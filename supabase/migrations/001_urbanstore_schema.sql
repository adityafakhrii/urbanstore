-- ============================================================================
-- UrbanStore — Complete Supabase PostgreSQL Schema, RLS, Triggers & RPCs
-- Aligned with UrbanStore PRD v1.2 & Application Architecture
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('customer', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'pending',
    'paid',
    'packed',
    'shipped',
    'delivered',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.courier_type AS ENUM ('reguler', 'sameday', 'instant');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. UTILITY FUNCTIONS & TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. PROFILES & ROLE-BASED ACCESS CONTROL (RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  role public.user_role NOT NULL DEFAULT 'customer',
  default_address text NOT NULL DEFAULT '',
  default_city text NOT NULL DEFAULT '',
  default_postal_code text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Helper function for RLS without self-referential recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Prevent non-admin users from escalating their own role via UPDATE
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    -- Allow direct SQL Editor / postgres superuser migrations where auth.uid() IS NULL
    IF auth.uid() IS NOT NULL THEN
      RAISE EXCEPTION 'Forbidden: role cannot be modified by non-admin users';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_profiles_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- Auto-create profile when a new auth user signs up (always defaults to 'customer')
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, whatsapp, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'whatsapp', ''),
    'customer'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE
      WHEN public.profiles.full_name = '' THEN EXCLUDED.full_name
      ELSE public.profiles.full_name
    END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. CATALOG: PRODUCTS, VARIANTS (STOCK), & SIZE GUIDES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  subtitle text NOT NULL,
  category text NOT NULL CHECK (category IN ('women', 'men', 'bags', 'shoes', 'accessories')),
  subcategory text NOT NULL CHECK (
    subcategory IN (
      'Dress & Setelan',
      'Outerwear Atelier',
      'Celana Tailored',
      'Knitwear',
      'Tas Kurasi',
      'Sepatu',
      'Aksesori'
    )
  ),
  bestseller_tab text CHECK (bestseller_tab IN ('Outerwear', 'Celana', 'Dress', 'Sepatu', 'Tas')),
  image text NOT NULL,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  alt text NOT NULL,
  badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  fit_note text NOT NULL,
  fabric_type text NOT NULL CHECK (
    fabric_type IN ('Linen Organik', 'Sutra Mulberry', 'Kasmir Murni', 'Kulit Calfskin', 'Cotton Twill')
  ),
  colors jsonb NOT NULL DEFAULT '[]'::jsonb,
  sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_size text NOT NULL,
  disabled_sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  in_stock boolean NOT NULL DEFAULT true,
  stock_label text,
  description text NOT NULL,
  fabric_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  care_instructions jsonb NOT NULL DEFAULT '[]'::jsonb,
  model_info text NOT NULL,
  fit_scale text NOT NULL CHECK (fit_scale IN ('Slim Fit', 'Pas Banget', 'Relaxed')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products(subcategory);
CREATE INDEX IF NOT EXISTS idx_products_active_sort ON public.products(is_active, sort_order);

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color_name text NOT NULL,
  color_hex text NOT NULL,
  size text NOT NULL,
  stock_qty integer NOT NULL DEFAULT 10 CHECK (stock_qty >= 0),
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, color_name, size)
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);

DROP TRIGGER IF EXISTS trg_variants_updated_at ON public.product_variants;
CREATE TRIGGER trg_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.size_guides (
  id serial PRIMARY KEY,
  garment_type text NOT NULL CHECK (garment_type IN ('tops', 'bottoms', 'shoes')),
  size_label text NOT NULL,
  chest_cm integer,
  waist_cm integer,
  length_cm integer,
  foot_cm numeric(4,1),
  min_weight_kg integer,
  max_weight_kg integer,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (garment_type, size_label)
);

-- ============================================================================
-- 5. CUSTOMER ENGAGEMENT: WISHLISTS, CART ITEMS, NEWSLETTER
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL,
  color text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id, size, color)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user ON public.cart_items(user_id);

DROP TRIGGER IF EXISTS trg_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  source text NOT NULL DEFAULT 'footer',
  subscribed_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 6. PROMOS, ORDERS, & ORDER ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.promos (
  code text PRIMARY KEY,
  description text NOT NULL DEFAULT '',
  discount_amount integer NOT NULL CHECK (discount_amount > 0),
  min_subtotal integer NOT NULL DEFAULT 0 CHECK (min_subtotal >= 0),
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  courier public.courier_type NOT NULL DEFAULT 'reguler',
  payment_method text NOT NULL CHECK (
    payment_method IN ('QRIS', 'BCA Virtual Account', 'Mandiri', 'Visa / Mastercard')
  ),
  promo_code text REFERENCES public.promos(code) ON DELETE SET NULL,
  subtotal integer NOT NULL CHECK (subtotal >= 0),
  discount integer NOT NULL DEFAULT 0 CHECK (discount >= 0),
  shipping_cost integer NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  total integer NOT NULL CHECK (total >= 0),
  status public.order_status NOT NULL DEFAULT 'pending',
  tracking_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_sku text NOT NULL,
  size text NOT NULL,
  color text NOT NULL,
  unit_price integer NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total integer NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile or admin all" ON public.profiles;
CREATE POLICY "Users can view own profile or admin all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- PRODUCTS (Public read active; Admin full write)
DROP POLICY IF EXISTS "Public can read active products" ON public.products;
CREATE POLICY "Public can read active products"
  ON public.products FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
CREATE POLICY "Admin can manage products"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- PRODUCT VARIANTS (Public read; Admin full write)
DROP POLICY IF EXISTS "Public can read variants" ON public.product_variants;
CREATE POLICY "Public can read variants"
  ON public.product_variants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can manage variants" ON public.product_variants;
CREATE POLICY "Admin can manage variants"
  ON public.product_variants FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- SIZE GUIDES (Public read; Admin write)
DROP POLICY IF EXISTS "Public can read size guides" ON public.size_guides;
CREATE POLICY "Public can read size guides"
  ON public.size_guides FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can manage size guides" ON public.size_guides;
CREATE POLICY "Admin can manage size guides"
  ON public.size_guides FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- WISHLISTS (Owner only)
DROP POLICY IF EXISTS "Users manage own wishlist" ON public.wishlists;
CREATE POLICY "Users manage own wishlist"
  ON public.wishlists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CART ITEMS (Owner only)
DROP POLICY IF EXISTS "Users manage own cart" ON public.cart_items;
CREATE POLICY "Users manage own cart"
  ON public.cart_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- NEWSLETTER SUBSCRIBERS (Anyone can subscribe; Admin reads/deletes)
DROP POLICY IF EXISTS "Anyone can subscribe newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can view subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admin can view subscribers"
  ON public.newsletter_subscribers FOR SELECT
  USING (public.is_admin());

-- PROMOS (Admin full control; public validates via validate_promo RPC)
DROP POLICY IF EXISTS "Admin can manage promos" ON public.promos;
CREATE POLICY "Admin can manage promos"
  ON public.promos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ORDERS (Customer views own orders; Admin views & updates all; creation via place_order RPC)
DROP POLICY IF EXISTS "Users view own orders or admin all" ON public.orders;
CREATE POLICY "Users view own orders or admin all"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admin can update orders" ON public.orders;
CREATE POLICY "Admin can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ORDER ITEMS (Customer views own order items; Admin views all)
DROP POLICY IF EXISTS "Users view own order items or admin all" ON public.order_items;
CREATE POLICY "Users view own order items or admin all"
  ON public.order_items FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. SERVER-SIDE RPC FUNCTIONS (ANTI-TAMPERING PROMO & ATOMIC CHECKOUT)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_promo(
  p_code text,
  p_subtotal integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo public.promos%ROWTYPE;
BEGIN
  SELECT * INTO v_promo
  FROM public.promos
  WHERE code = upper(trim(p_code))
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Kode promo ini nggak valid atau udah lewat masanya.'
    );
  END IF;

  IF p_subtotal < v_promo.min_subtotal THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', format('Minimal belanja Rp %s buat pakai kode ini.', v_promo.min_subtotal)
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code', v_promo.code,
    'discount_amount', v_promo.discount_amount,
    'description', v_promo.description
  );
END;
$$;

-- Atomic server-calculated order placement
-- p_items format: [{"product_id": "column-dress-overshirt", "size": "S", "color": "Alabaster White", "quantity": 1}]
CREATE OR REPLACE FUNCTION public.place_order(
  p_full_name text,
  p_email text,
  p_whatsapp text,
  p_address text,
  p_city text,
  p_postal_code text,
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
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Keranjang belanja masih kosong.';
  END IF;

  IF length(trim(COALESCE(p_full_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Nama penerima wajib diisi.';
  END IF;

  -- First pass: lock variants, verify stock, and compute authoritative subtotal from DB prices
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

    -- Lock matching variant row if present in product_variants
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

  -- Authoritative shipping calculation (matching PRD)
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
    address,
    city,
    postal_code,
    courier,
    payment_method,
    promo_code,
    subtotal,
    discount,
    shipping_cost,
    total,
    status
  )
  VALUES (
    v_order_number,
    v_user_id,
    trim(p_full_name),
    trim(p_email),
    trim(p_whatsapp),
    trim(p_address),
    trim(p_city),
    trim(p_postal_code),
    p_courier,
    p_payment_method,
    v_applied_code,
    v_subtotal,
    v_discount,
    v_shipping,
    v_total,
    'pending'
  )
  RETURNING id INTO v_order_id;

  -- Second pass: insert immutable order_items snapshot
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

  -- Clear authenticated user's persisted cart after successful order
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
    'created_at', now()
  );
END;
$$;

-- Grants for anon and authenticated clients
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.products, public.product_variants, public.size_guides TO anon, authenticated;
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists, public.cart_items TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promos, public.products, public.product_variants, public.size_guides TO authenticated;
GRANT SELECT ON public.newsletter_subscribers TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_promo(text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(text, text, text, text, text, text, public.courier_type, text, text, jsonb) TO anon, authenticated;

-- ============================================================================
-- 9. SUPABASE STORAGE BUCKET FOR REAL PRODUCT IMAGES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin can upload product images" ON storage.objects;
CREATE POLICY "Admin can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin can update product images" ON storage.objects;
CREATE POLICY "Admin can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin can delete product images" ON storage.objects;
CREATE POLICY "Admin can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND public.is_admin());
