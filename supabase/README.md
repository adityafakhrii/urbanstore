# UrbanStore — Panduan Database & Autentikasi Supabase

## 1. Arsitektur Tabel

Schema berada di [001_urbanstore_schema.sql](file:///d:/Projects/Vibe%20Coding%20Batch%204/urbanstore/supabase/migrations/001_urbanstore_schema.sql) dan data awal di [seed.sql](file:///d:/Projects/Vibe%20Coding%20Batch%204/urbanstore/supabase/seed.sql).

- **`profiles`**: Terhubung 1:1 ke `auth.users` via trigger `on_auth_user_created`. Menyimpan `role` (`'customer'` atau `'admin'`), `full_name`, `whatsapp`, dan alamat default. Dilindungi trigger `trg_profiles_prevent_role_escalation` sehingga user biasa tidak bisa mengubah role sendiri lewat client API.
- **`products` & `product_variants`**: Katalog produk kurasi beserta stok riil per kombinasi `product_id + color_name + size`.
- **`size_guides`**: Tabel panduan ukuran Anti-Zonk (`tops`, `bottoms`, `shoes`).
- **`wishlists` & `cart_items`**: Tersinkronisasi ke database saat user login.
- **`promos`**: Voucher diskon tervalidasi server via RPC `validate_promo`.
- **`orders` & `order_items`**: Transaksi yang dibuat secara atomik melalui RPC `place_order` (menghitung harga, diskon, dan ongkir di server PostgreSQL sekaligus memotong `product_variants.stock_qty`).
- **`newsletter_subscribers`**: Menyimpan email VIP drop dari footer.

## 2. Cara Setup di Supabase Dashboard

1. Buka **Supabase Dashboard → SQL Editor**.
2. Jalankan isi file `supabase/migrations/001_urbanstore_schema.sql`.
3. Jalankan isi file `supabase/migrations/002_storage_product_images.sql` (untuk membuat bucket Storage `product-images`).
4. Jalankan isi file `supabase/migrations/003_checkout_payment_invoice.sql` (untuk checkout provinsi/kecamatan/catatan, timer 1 jam, & bucket `payment-proofs`).
5. Jalankan isi file `supabase/seed.sql`.
6. Pastikan **Authentication → Providers → Email** aktif.
   *(Opsional untuk testing lokal tanpa verifikasi email: matikan **Confirm email** di Authentication → Providers → Email).*

## 3. Membuat Akun `customer` dan `admin`

- **Role `customer`**: Setiap pendaftaran baru lewat halaman **Daftar** di aplikasi otomatis mendapat role `customer`.
- **Role `admin`**:
  1. Daftarkan akun terlebih dahulu lewat UI aplikasi (atau buat user di **Authentication → Users**).
  2. Jalankan query berikut di **SQL Editor** Supabase untuk mempromosikan akun menjadi `admin`:
     ```sql
     UPDATE public.profiles
     SET role = 'admin'
     WHERE email = 'admin@urbanstore.id';
     ```
  3. Login kembali di aplikasi menggunakan email & password tersebut. Header akan menampilkan badge **ADMIN** dan menu **Admin Atelier** untuk mengelola pesanan, produk, stok varian, promo, dan subscriber.
