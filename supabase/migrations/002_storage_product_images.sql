-- ============================================================================
-- 002: Create Supabase Storage Bucket 'product-images' & Admin RLS Policies
-- Jalankan file ini di Supabase Dashboard -> SQL Editor jika muncul error
-- "Bucket not found" saat upload foto produk.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

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
