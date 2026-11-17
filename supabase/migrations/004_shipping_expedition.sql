-- ============================================================================
-- 004: Add Shipping Expedition Name for Shipped Order Validation
-- ============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_expedition text;
