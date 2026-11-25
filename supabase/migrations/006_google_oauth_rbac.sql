-- ============================================================================
-- 006: Google OAuth Metadata & Role-Based Access Control (Admin vs Customer)
-- ============================================================================

-- 1. Table whitelist email Admin (hanya bisa dibaca/ubah via SQL Editor atau Admin)
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage admin_emails" ON public.admin_emails;
CREATE POLICY "Admin can manage admin_emails"
  ON public.admin_emails FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Normalisasi email lowercase sebelum disimpan ke admin_emails
CREATE OR REPLACE FUNCTION public.normalize_admin_email()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.email = lower(trim(NEW.email));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_emails_normalize ON public.admin_emails;
CREATE TRIGGER trg_admin_emails_normalize
  BEFORE INSERT OR UPDATE ON public.admin_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_admin_email();

-- Jika email admin ditambahkan setelah user sudah pernah login Google sebelumnya,
-- otomatis promosikan profilenya ke role 'admin'
CREATE OR REPLACE FUNCTION public.sync_admin_email_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'admin'
  WHERE lower(email) = lower(NEW.email)
    AND role <> 'admin';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_admin_email_to_profile ON public.admin_emails;
CREATE TRIGGER trg_sync_admin_email_to_profile
  AFTER INSERT OR UPDATE ON public.admin_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_admin_email_to_profile();

-- 2. Update handle_new_user() agar Google OAuth metadata (full_name / name)
--    dan pengecekan admin_emails berjalan otomatis saat login pertama kali
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := COALESCE(NEW.email, '');
  v_full_name text := COALESCE(
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'name', '')), ''),
    ''
  );
  v_whatsapp text := COALESCE(NEW.raw_user_meta_data ->> 'whatsapp', '');
  v_assigned_role public.user_role := 'customer';
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.admin_emails ae
    WHERE lower(ae.email) = lower(v_email)
  ) THEN
    v_assigned_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, whatsapp, role)
  VALUES (
    NEW.id,
    v_email,
    v_full_name,
    v_whatsapp,
    v_assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE
      WHEN public.profiles.full_name = '' THEN EXCLUDED.full_name
      ELSE public.profiles.full_name
    END,
    role = CASE
      WHEN public.profiles.role = 'admin' OR EXCLUDED.role = 'admin' THEN 'admin'::public.user_role
      ELSE public.profiles.role
    END;

  RETURN NEW;
END;
$$;

-- 3. RPC fallback untuk memastikan profile selalu tersedia bagi user terautentikasi
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_auth_email text := '';
  v_auth_name text := '';
  v_assigned_role public.user_role := 'customer';
  v_profile public.profiles%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_uid;

  IF FOUND THEN
    RETURN v_profile;
  END IF;

  SELECT
    COALESCE(email, ''),
    COALESCE(
      NULLIF(trim(COALESCE(raw_user_meta_data ->> 'full_name', '')), ''),
      NULLIF(trim(COALESCE(raw_user_meta_data ->> 'name', '')), ''),
      ''
    )
  INTO v_auth_email, v_auth_name
  FROM auth.users
  WHERE id = v_uid;

  IF EXISTS (
    SELECT 1
    FROM public.admin_emails ae
    WHERE lower(ae.email) = lower(v_auth_email)
  ) THEN
    v_assigned_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_uid, v_auth_email, v_auth_name, v_assigned_role)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;

-- Contoh mendaftarkan email Google Admin (ganti dengan Gmail Admin kamu lalu jalankan):
-- INSERT INTO public.admin_emails (email, note)
-- VALUES ('email.admin.kamu@gmail.com', 'Owner / Super Admin')
-- ON CONFLICT (email) DO NOTHING;
