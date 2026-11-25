-- ============================================================================
-- 007: Mayar.id Payment Gateway Integration, Automatic Verification,
--      & Idempotent Stock Sync / Restoration
-- ============================================================================

-- 1. Relax & update payment_method CHECK constraint to support Mayar Payment Gateway
--    while keeping legacy values valid for historical orders.
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  FOR v_constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'orders'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%payment_method%'
  LOOP
    EXECUTE format('ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS %I', v_constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check CHECK (
    payment_method IN (
      'Mayar Payment Gateway',
      'QRIS',
      'BCA Virtual Account',
      'Mandiri',
      'Visa / Mastercard'
    )
  );

-- 2. Add Mayar gateway tracking & verification columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_gateway text NOT NULL DEFAULT 'mayar',
  ADD COLUMN IF NOT EXISTS mayar_invoice_id text,
  ADD COLUMN IF NOT EXISTS mayar_transaction_id text,
  ADD COLUMN IF NOT EXISTS mayar_payment_link text,
  ADD COLUMN IF NOT EXISTS mayar_payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS mayar_payment_method text,
  ADD COLUMN IF NOT EXISTS mayar_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS mayar_raw_payload jsonb,
  ADD COLUMN IF NOT EXISTS stock_deducted boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_orders_mayar_invoice_id ON public.orders(mayar_invoice_id);
CREATE INDEX IF NOT EXISTS idx_orders_mayar_transaction_id ON public.orders(mayar_transaction_id);

-- 3. Auto-sync products.in_stock whenever product_variants stock changes
CREATE OR REPLACE FUNCTION public.sync_product_in_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id text := COALESCE(NEW.product_id, OLD.product_id);
  v_has_stock boolean;
BEGIN
  IF v_product_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.product_variants
    WHERE product_id = v_product_id
      AND stock_qty > 0
      AND is_available = true
  ) INTO v_has_stock;

  UPDATE public.products
  SET in_stock = v_has_stock
  WHERE id = v_product_id
    AND in_stock IS DISTINCT FROM v_has_stock;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_product_variants_sync_in_stock ON public.product_variants;
CREATE TRIGGER trg_product_variants_sync_in_stock
  AFTER INSERT OR UPDATE OF stock_qty, is_available OR DELETE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_product_in_stock();

-- 4. Idempotent stock restoration / re-deduction trigger on order status changes
CREATE OR REPLACE FUNCTION public.handle_order_stock_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item record;
  v_variant_id uuid;
BEGIN
  -- Case A: Unpaid order is cancelled or expired -> restore reserved stock once
  IF NEW.status IN ('cancelled', 'expired')
     AND OLD.status NOT IN ('cancelled', 'expired')
     AND OLD.stock_deducted = true THEN
    FOR v_item IN
      SELECT product_id, size, color, quantity
      FROM public.order_items
      WHERE order_id = OLD.id
        AND product_id IS NOT NULL
    LOOP
      SELECT id INTO v_variant_id
      FROM public.product_variants
      WHERE product_id = v_item.product_id
        AND size = v_item.size
        AND (color_name = v_item.color OR v_item.color = 'Default')
      ORDER BY (color_name = v_item.color) DESC
      LIMIT 1
      FOR UPDATE;

      IF FOUND THEN
        UPDATE public.product_variants
        SET stock_qty = stock_qty + v_item.quantity,
            is_available = true
        WHERE id = v_variant_id;
      END IF;
    END LOOP;

    NEW.stock_deducted := false;
  END IF;

  -- Case B: Previously expired/cancelled order receives late confirmed payment -> re-deduct stock once
  IF NEW.status IN ('paid', 'packed', 'shipped', 'delivered')
     AND OLD.stock_deducted = false THEN
    FOR v_item IN
      SELECT product_id, size, color, quantity
      FROM public.order_items
      WHERE order_id = OLD.id
        AND product_id IS NOT NULL
    LOOP
      SELECT id INTO v_variant_id
      FROM public.product_variants
      WHERE product_id = v_item.product_id
        AND size = v_item.size
        AND (color_name = v_item.color OR v_item.color = 'Default')
      ORDER BY (color_name = v_item.color) DESC
      LIMIT 1
      FOR UPDATE;

      IF FOUND THEN
        UPDATE public.product_variants
        SET stock_qty = GREATEST(0, stock_qty - v_item.quantity),
            is_available = GREATEST(0, stock_qty - v_item.quantity) > 0
        WHERE id = v_variant_id;
      END IF;
    END LOOP;

    NEW.stock_deducted := true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_stock_status_sync ON public.orders;
CREATE TRIGGER trg_orders_stock_status_sync
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_stock_on_status_change();

-- 5. Server-only RPCs (invoked via service_role from /api/mayar/* endpoints)
CREATE OR REPLACE FUNCTION public.attach_mayar_payment(
  p_order_id uuid,
  p_mayar_invoice_id text,
  p_mayar_transaction_id text,
  p_mayar_payment_link text,
  p_payment_expires_at timestamptz DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  UPDATE public.orders
  SET payment_gateway = 'mayar',
      mayar_invoice_id = COALESCE(NULLIF(trim(p_mayar_invoice_id), ''), mayar_invoice_id),
      mayar_transaction_id = COALESCE(NULLIF(trim(p_mayar_transaction_id), ''), mayar_transaction_id),
      mayar_payment_link = COALESCE(NULLIF(trim(p_mayar_payment_link), ''), mayar_payment_link),
      mayar_payment_status = CASE
        WHEN status IN ('paid', 'packed', 'shipped', 'delivered') THEN 'paid'
        ELSE 'unpaid'
      END,
      payment_expires_at = COALESCE(p_payment_expires_at, payment_expires_at)
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order tidak ditemukan.';
  END IF;

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_mayar_payment(
  p_order_id uuid,
  p_mayar_invoice_id text DEFAULT NULL,
  p_mayar_transaction_id text DEFAULT NULL,
  p_mayar_payment_status text DEFAULT 'paid',
  p_mayar_payment_method text DEFAULT NULL,
  p_paid_at timestamptz DEFAULT NULL,
  p_raw_payload jsonb DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_next_status public.order_status;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order tidak ditemukan.';
  END IF;

  -- Preserve fulfillment progress if already packed/shipped/delivered
  IF v_order.status IN ('packed', 'shipped', 'delivered') THEN
    v_next_status := v_order.status;
  ELSE
    v_next_status := 'paid';
  END IF;

  UPDATE public.orders
  SET status = v_next_status,
      payment_gateway = 'mayar',
      mayar_invoice_id = COALESCE(NULLIF(trim(p_mayar_invoice_id), ''), mayar_invoice_id),
      mayar_transaction_id = COALESCE(NULLIF(trim(p_mayar_transaction_id), ''), mayar_transaction_id),
      mayar_payment_status = COALESCE(NULLIF(trim(p_mayar_payment_status), ''), 'paid'),
      mayar_payment_method = COALESCE(NULLIF(trim(p_mayar_payment_method), ''), mayar_payment_method),
      paid_at = COALESCE(paid_at, p_paid_at, now()),
      mayar_verified_at = COALESCE(mayar_verified_at, now()),
      mayar_raw_payload = COALESCE(p_raw_payload, mayar_raw_payload)
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_mayar_order(
  p_order_id uuid,
  p_mayar_payment_status text DEFAULT 'expired',
  p_raw_payload jsonb DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order tidak ditemukan.';
  END IF;

  -- Never downgrade paid/fulfilled orders
  IF v_order.status IN ('paid', 'packed', 'shipped', 'delivered') THEN
    RETURN v_order;
  END IF;

  UPDATE public.orders
  SET status = 'expired',
      mayar_payment_status = COALESCE(NULLIF(trim(p_mayar_payment_status), ''), 'expired'),
      mayar_raw_payload = COALESCE(p_raw_payload, mayar_raw_payload)
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.attach_mayar_payment(uuid, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.confirm_mayar_payment(uuid, text, text, text, text, timestamptz, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_mayar_order(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.attach_mayar_payment(uuid, text, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_mayar_payment(uuid, text, text, text, text, timestamptz, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_mayar_order(uuid, text, jsonb) TO service_role;
