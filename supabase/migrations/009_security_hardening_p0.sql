-- ============================================================================
-- 009: P0 Security Hardening — Lock Down Legacy 'payment-proofs' Storage Bucket
-- Jalankan file ini di Supabase Dashboard -> SQL Editor.
-- ============================================================================

-- 1. Set payment-proofs bucket to private so customer transfer proofs are not publicly accessible
UPDATE storage.buckets
SET public = false
WHERE id = 'payment-proofs';

-- 2. Remove public read and unauthenticated public upload policies
DROP POLICY IF EXISTS "Public can view payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Customers and guests can upload payment proofs" ON storage.objects;

-- 3. Restrict read access on legacy payment proofs strictly to authenticated Admins
DROP POLICY IF EXISTS "Admin can view payment proofs" ON storage.objects;
CREATE POLICY "Admin can view payment proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs' AND public.is_admin());
