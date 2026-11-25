# UrbanStore — Panduan Database & Autentikasi Google OAuth (Supabase)

## 1. Arsitektur Tabel & RBAC

Schema berada di [001_urbanstore_schema.sql](file:///d:/Projects/Vibe%20Coding%20Batch%204/urbanstore/supabase/migrations/001_urbanstore_schema.sql), ekstensi Google OAuth RBAC di [006_google_oauth_rbac.sql](file:///d:/Projects/Vibe%20Coding%20Batch%204/urbanstore/supabase/migrations/006_google_oauth_rbac.sql), dan data awal di [seed.sql](file:///d:/Projects/Vibe%20Coding%20Batch%204/urbanstore/supabase/seed.sql).

- **`profiles`**: Terhubung 1:1 ke `auth.users` via trigger `on_auth_user_created`. Menyimpan `role` (`'customer'` atau `'admin'`), `full_name`, `whatsapp`, dan alamat default. Dilindungi trigger `trg_profiles_prevent_role_escalation` sehingga user biasa tidak bisa mengubah role sendiri lewat client API.
- **`admin_emails`**: Whitelist email Google yang otomatis mendapat role `'admin'` saat login pertama kali maupun jika sudah pernah login sebelumnya.
- **`products` & `product_variants`**: Katalog produk kurasi beserta stok riil per kombinasi `product_id + color_name + size`.
- **`size_guides`**: Tabel panduan ukuran Anti-Zonk (`tops`, `bottoms`, `shoes`).
- **`wishlists` & `cart_items`**: Tersinkronisasi ke database saat user login.
- **`promos`**: Voucher diskon tervalidasi server via RPC `validate_promo`.
- **`orders` & `order_items`**: Transaksi yang dibuat secara atomik melalui RPC `place_order`.
- **`newsletter_subscribers`**: Menyimpan email VIP drop dari footer.

## 2. Cara Setup Database di Supabase Dashboard

1. Buka **Supabase Dashboard → SQL Editor**.
2. Jalankan urutan file migrasi di `supabase/migrations/`:
   - `001_urbanstore_schema.sql`
   - `002_storage_product_images.sql`
   - `003_checkout_payment_invoice.sql`
   - `004_shipping_expedition.sql`
   - `005_seed_19_products.sql`
   - `006_google_oauth_rbac.sql`
   - `007_mayar_payment_gateway.sql`
3. Jalankan isi file `supabase/seed.sql`.

## 3. Setup Google Cloud Console & Supabase Google Provider

1. **Google Cloud Console** → **APIs & Services → OAuth consent screen**:
   - Pilih **External**, isi App name `UrbanStore`, support email, dan developer contact email.
   - Tambahkan scopes: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
   - Jika status masih *Testing*, tambahkan email Google Admin & Customer ke **Test users** (atau publish app).
2. **Google Cloud Console** → **APIs & Services → Credentials → + Create Credentials → OAuth client ID** (Web application):
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://urbanstore-vcb.vercel.app` (domain produksi kamu)
   - **Authorized redirect URIs**:
     - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
3. **Supabase Dashboard** → **Authentication → Providers → Google**:
   - Aktifkan toggle **Enable Sign in with Google**.
   - Tempel **Client ID** dan **Client Secret** dari Google Cloud Console, lalu Save.
4. **Supabase Dashboard** → **Authentication → URL Configuration**:
   - **Site URL**: `https://urbanstore-vcb.vercel.app` (atau `http://localhost:3000` saat dev lokal)
   - **Redirect URLs**:
     - `http://localhost:3000/auth/callback`
     - `https://urbanstore-vcb.vercel.app/auth/callback`

## 4. Mengatur Role `customer` dan `admin`

- **Role `customer`**: Semua user baru yang klik **Lanjutkan dengan Google** otomatis terdaftar dengan role `customer`.
- **Role `admin`**:
  Daftarkan email Google Admin di tabel `public.admin_emails` melalui **SQL Editor** Supabase:
  ```sql
  INSERT INTO public.admin_emails (email, note)
  VALUES ('email.admin.kamu@gmail.com', 'Owner / Super Admin')
  ON CONFLICT (email) DO NOTHING;
  ```
  (Jika akun tersebut sudah pernah login sebelumnya, trigger `trg_sync_admin_email_to_profile` otomatis mengubah rolenya menjadi `'admin'` di `public.profiles`.)
