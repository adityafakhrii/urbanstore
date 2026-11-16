-- ============================================================================
-- 003: Extended Checkout Address (Provinsi/Kecamatan/Catatan), 1-Hour Payment
--      Countdown, Payment Proof Upload (WebP), & Invoice Readiness
-- ============================================================================

-- 1. Extend order_status enum safely
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'waiting_verification';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'expired';

-- 2. Extend profiles with default province & district
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_province text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS default_district text NOT NULL DEFAULT '';

-- 3. Extend orders with shipping region, delivery notes, payment timer & proof
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS province text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS district text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS delivery_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_proof_url text,
  ADD COLUMN IF NOT EXISTS payment_expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_payment_expires ON public.orders(payment_expires_at);

-- 4. Storage bucket for payment proofs (WebP compressed, max 5MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  true,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

DROP POLICY IF EXISTS "Public can view payment proofs" ON storage.objects;
CREATE POLICY "Public can view payment proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "Customers and guests can upload payment proofs" ON storage.objects;
CREATE POLICY "Customers and guests can upload payment proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "Admin can delete payment proofs" ON storage.objects;
CREATE POLICY "Admin can delete payment proofs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'payment-proofs' AND public.is_admin());

-- 5. Replace place_order RPC with province, district, delivery_notes & 1-hour expiry
DROP FUNCTION IF EXISTS public.place_order(
  text, text, text, text, text, text, public.courier_type, text, text, jsonb
);

CREATE OR REPLACE FUNCTION public.place_order(
  p_full_name text,
  p_email text,
  p_whatsapp text,
  p_province text,
  p_city text,
  p_district text,
  p_address text,
  p_postal_code text,
  p_delivery_notes text,
  p_courier public.courier_type,
  p_payment_method text,
  p_promo_code text,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_item jsonb;
  v_product public.products%ROWTYPE;
  v_variant public.product_variants%ROWTYPE;
  v_qty integer;
  v_size text;
  v_color text;
  v_subtotal integer := 0;
  v_discount integer := 0;
  v_shipping integer := 0;
  v_total integer := 0;
  v_promo public.promos%ROWTYPE;
  v_applied_code text := NULL;
  v_order_id uuid;
  v_order_number text;
  v_total_items integer := 0;
  v_expires_at timestamptz := now() + interval '1 hour';
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Keranjang belanja masih kosong.';
  END IF;

  IF length(trim(COALESCE(p_full_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Nama penerima wajib diisi.';
  END IF;

  -- First pass: lock variants, verify stock, compute authoritative subtotal
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := COALESCE((v_item ->> 'quantity')::integer, 0);
    v_size := COALESCE(v_item ->> 'size', '');
    v_color := COALESCE(v_item ->> 'color', '');

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Jumlah item harus lebih dari 0.';
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = (v_item ->> 'product_id')
      AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produk % tidak ditemukan atau tidak aktif.', (v_item ->> 'product_id');
    END IF;

    SELECT * INTO v_variant
    FROM public.product_variants
    WHERE product_id = v_product.id
      AND size = v_size
      AND (color_name = v_color OR v_color = 'Default')
    ORDER BY (color_name = v_color) DESC
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
      IF NOT v_variant.is_available OR v_variant.stock_qty < v_qty THEN
        RAISE EXCEPTION 'Yah keduluan, % (Size % / %) stoknya tidak cukup.', v_product.name, v_size, v_color;
      END IF;

      UPDATE public.product_variants
      SET stock_qty = stock_qty - v_qty,
          is_available = (stock_qty - v_qty) > 0
      WHERE id = v_variant.id;
    ELSIF NOT v_product.in_stock THEN
      RAISE EXCEPTION 'Yah keduluan, % sedang habis.', v_product.name;
    END IF;

    v_subtotal := v_subtotal + (v_product.price * v_qty);
    v_total_items := v_total_items + v_qty;
  END LOOP;

  -- Authoritative promo validation
  IF p_promo_code IS NOT NULL AND trim(p_promo_code) <> '' THEN
    SELECT * INTO v_promo
    FROM public.promos
    WHERE code = upper(trim(p_promo_code))
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND v_subtotal >= min_subtotal;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Kode promo tidak valid atau belum memenuhi syarat minimal belanja.';
    END IF;

    v_discount := v_promo.discount_amount;
    v_applied_code := v_promo.code;
  END IF;

  -- Authoritative shipping calculation
  IF p_courier = 'instant' THEN
    v_shipping := 35000;
  ELSIF p_courier = 'sameday' THEN
    v_shipping := 20000;
  ELSIF v_subtotal >= 500000 THEN
    v_shipping := 0;
  ELSE
    v_shipping := 18000;
  END IF;

  v_total := GREATEST(0, v_subtotal - v_discount + v_shipping);
  v_order_number := 'US-' || to_char(now(), 'YYMMDD') || '-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));

  INSERT INTO public.orders (
    order_number,
    user_id,
    full_name,
    email,
    whatsapp,
    province,
    city,
    district,
    address,
    postal_code,
    delivery_notes,
    courier,
    payment_method,
    promo_code,
    subtotal,
    discount,
    shipping_cost,
    total,
    status,
    payment_expires_at
  )
  VALUES (
    v_order_number,
    v_user_id,
    trim(p_full_name),
    trim(p_email),
    trim(p_whatsapp),
    trim(COALESCE(p_province, '')),
    trim(p_city),
    trim(COALESCE(p_district, '')),
    trim(p_address),
    trim(p_postal_code),
    trim(COALESCE(p_delivery_notes, '')),
    p_courier,
    p_payment_method,
    v_applied_code,
    v_subtotal,
    v_discount,
    v_shipping,
    v_total,
    'pending',
    v_expires_at
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item ->> 'quantity')::integer;
    v_size := COALESCE(v_item ->> 'size', '');
    v_color := COALESCE(v_item ->> 'color', '');

    SELECT * INTO v_product
    FROM public.products
    WHERE id = (v_item ->> 'product_id');

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      product_sku,
      size,
      color,
      unit_price,
      quantity,
      line_total
    )
    VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.sku,
      v_size,
      v_color,
      v_product.price,
      v_qty,
      v_product.price * v_qty
    );
  END LOOP;

  IF v_user_id IS NOT NULL THEN
    DELETE FROM public.cart_items WHERE user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'shipping_cost', v_shipping,
    'total', v_total,
    'items_count', v_total_items,
    'status', 'pending',
    'created_at', now(),
    'payment_expires_at', v_expires_at
  );
END;
$$;

-- 6. RPC for customer/guest to submit payment proof within 1-hour deadline
CREATE OR REPLACE FUNCTION public.submit_payment_proof(
  p_order_id uuid,
  p_proof_url text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  IF length(trim(COALESCE(p_proof_url, ''))) < 8 THEN
    RAISE EXCEPTION 'URL bukti transfer tidak valid.';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pesanan tidak ditemukan.';
  END IF;

  IF v_order.user_id IS NOT NULL AND auth.uid() IS DISTINCT FROM v_order.user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Anda tidak memiliki akses ke pesanan ini.';
  END IF;

  IF v_order.status NOT IN ('pending', 'waiting_verification') THEN
    RAISE EXCEPTION 'Pesanan dengan status % tidak dapat mengunggah bukti transfer lagi.', v_order.status;
  END IF;

  IF now() > v_order.payment_expires_at AND v_order.status = 'pending' THEN
    UPDATE public.orders
    SET status = 'expired'
    WHERE id = v_order.id;
    RAISE EXCEPTION 'Batas waktu pembayaran 1 jam sudah berakhir. Silakan buat pesanan baru.';
  END IF;

  UPDATE public.orders
  SET payment_proof_url = trim(p_proof_url),
      status = 'waiting_verification'
  WHERE id = v_order.id
  RETURNING * INTO v_order;

  RETURN jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'payment_proof_url', v_order.payment_proof_url,
    'payment_expires_at', v_order.payment_expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(
  text, text, text, text, text, text, text, text, text, public.courier_type, text, text, jsonb
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_payment_proof(uuid, text) TO anon, authenticated;
