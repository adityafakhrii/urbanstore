-- ============================================================================
-- UrbanStore Seed Data (Reference Size Guides & Promos Only)
-- Produk & varian produk sengaja dikosongkan agar dikelola nyata oleh Admin.
-- ============================================================================

-- 1. SIZE GUIDES (Anti-Zonk Reference Table)
INSERT INTO public.size_guides (garment_type, size_label, chest_cm, waist_cm, length_cm, foot_cm, min_weight_kg, max_weight_kg, sort_order) VALUES
  ('tops', 'XS', 92, 74, 68, NULL, 40, 48, 1),
  ('tops', 'S', 96, 78, 70, NULL, 49, 57, 2),
  ('tops', 'M (Core)', 100, 82, 72, NULL, 58, 67, 3),
  ('tops', 'L', 106, 88, 74, NULL, 68, 77, 4),
  ('tops', 'XL', 112, 94, 76, NULL, 78, 95, 5),
  ('bottoms', '28', NULL, 72, 98, NULL, 50, 58, 1),
  ('bottoms', '30', NULL, 77, 100, NULL, 59, 68, 2),
  ('bottoms', '32', NULL, 82, 102, NULL, 69, 77, 3),
  ('bottoms', '34', NULL, 87, 103, NULL, 78, 86, 4),
  ('bottoms', '36', NULL, 92, 104, NULL, 87, 98, 5),
  ('shoes', '40', NULL, NULL, NULL, 25.5, NULL, NULL, 1),
  ('shoes', '41', NULL, NULL, NULL, 26.5, NULL, NULL, 2),
  ('shoes', '42', NULL, NULL, NULL, 27.5, NULL, NULL, 3),
  ('shoes', '43', NULL, NULL, NULL, 28.5, NULL, NULL, 4)
ON CONFLICT (garment_type, size_label) DO UPDATE SET
  chest_cm = EXCLUDED.chest_cm,
  waist_cm = EXCLUDED.waist_cm,
  length_cm = EXCLUDED.length_cm,
  foot_cm = EXCLUDED.foot_cm,
  min_weight_kg = EXCLUDED.min_weight_kg,
  max_weight_kg = EXCLUDED.max_weight_kg,
  sort_order = EXCLUDED.sort_order;

-- 2. PROMOS
INSERT INTO public.promos (code, description, discount_amount, min_subtotal, is_active) VALUES
  ('ANTIZONK', 'Potongan Anti-Zonk Rp 50.000 untuk semua outfit kurasi', 50000, 0, true),
  ('URBAN10', 'Voucher member UrbanStore potongan Rp 50.000', 50000, 0, true),
  ('DROP01', 'Special Curated Drop Vol. 01 potongan Rp 50.000', 50000, 0, true),
  ('HEMAT50', 'Diskon langsung Rp 50.000 minimal belanja Rp 300.000', 50000, 300000, true)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_amount = EXCLUDED.discount_amount,
  min_subtotal = EXCLUDED.min_subtotal,
  is_active = EXCLUDED.is_active;
