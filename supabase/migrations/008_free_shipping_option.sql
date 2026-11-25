-- ============================================================================
-- 008: Add Free Shipping Option ('free') to courier_type & place_order RPC
-- ============================================================================

-- 0. Ensure shipping_expedition exists even if 004 was skipped
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_expedition text;

-- 1. Extend courier_type enum safely
ALTER TYPE public.courier_type ADD VALUE IF NOT EXISTS 'free';

-- 2. Update place_order RPC to support 'free' (Rp 0 without minimum subtotal)
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
  IF p_courier = 'free' THEN
    v_shipping := 0;
  ELSIF p_courier = 'instant' THEN
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
