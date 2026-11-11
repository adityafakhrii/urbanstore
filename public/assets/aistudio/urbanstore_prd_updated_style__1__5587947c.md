# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## UrbanStore — Curated Fashion, Clear Fit, Fast Checkout

| Informasi | Detail | 
| ----- | ----- | 
| Produk | UrbanStore Web App | 
| Dokumen | Product Requirements Document | 
| Versi | 1.2 (Gen Z Slang / Casual Indonesian Copywriting Update) | 
| Status | Draft untuk validasi dan development | 
| Target platform | Responsive web app (mobile-first) | 
| Target pengguna | Gen Z & Young Millennials, usia 18–30 tahun | 
| Bahasa utama | Bahasa Indonesia santai / gaul Gen Z (Conversational & Punchy) | 

---

## 1. Ringkasan Produk

UrbanStore adalah online store fashion pria dan wanita kurasi yang ngebantu Gen Z nemuin outfit yang *aesthetic*, *timeless*, dan masuk budget tanpa harus boncos atau pusing scroll ribuan katalog yang bikin pusing. UrbanStore ngutamain kurasi ketat, info bahan dan ukuran yang transparan, visual size guide biar fitting nggak *zonk*, serta alur checkout mobile yang sat-set tanpa ribet.

Pengalaman produk dibangun dengan pendekatan **mobile-first, fast, clear, and curated**. Visual mengadopsi estetika editorial *Quiet Luxury* (terinspirasi dari referensi editorial modern seperti SABLE) yang dipadukan dengan gaya komunikasi santai, natural, dan *relatable* khas obrolan Gen Z.

### Product vision
Jadi destinasi fashion andalan Gen Z buat eksplor outfit, mastiin ukuran pas tanpa mikir keras, dan checkout secepat kilat.

### Value proposition
**Style dapet. Fit anti-zonk. Checkout no drama.**

---

## 2. Latar Belakang dan Problem Statement

### Masalah pengguna
1. **Katalog Bikin Pusing**: Olshop biasa sering kebanyakan produk random dan banner norak yang bikin mata capek (*visual clutter*).
2. **Takut Size Zonk**: Beli baju online sering gambling karena size chart cuma deretan angka tanpa panduan fitting visual yang jelas di badan.
3. **Checkout Kepanjangan**: Banyak langkah form berbelit dan ongkir/biaya admin tiba-tiba muncul di akhir bikin males lanjut (*cart abandonment*).
4. **Trust Issue Soal Bahan**: Foto produk suka nipu atau beda jauh aslinya karena detail material nggak dijelasin jujur.

### Peluang produk
Menyajikan e-commerce fashion dengan tampilan mewah dan tenang (*warm editorial aesthetic*), tapi cara ngomongnya luwes, asik, dan transparan kayak rekomendasi temen sendiri.

### Problem statement
Gen Z butuh platform belanja outfit kurasi yang estetik, ngasih jaminan ukuran pas biar nggak retur-retur club, plus proses checkout yang ringkas dan jujur dari awal.

---

## 3. Tujuan Produk dan Success Metrics

| Goal | Hasil yang diharapkan | Metrik keberhasilan awal | 
| ----- | ----- | ----- | 
| G1. Discovery gampang | User nemu outfit incaran tanpa ribet scroll | ≥ 70% user nemu produk target dalam ≤ 60 detik | 
| G2. Fit akurat anti-zonk | User pede milih size yang pas lewat visual size guide | ≥ 85% user milih size tanpa ragu & retur size < 5% | 
| G3. Checkout sat-set | Checkout lancar tanpa drama biaya tersembunyi | Median checkout ≤ 90 detik; conversion rate ≥ 65% | 

---

## 4. Target Pengguna dan Persona

### Primary audience
Gen Z dan Gen-Zillenial (18–30 tahun) yang melek fashion, suka look minimalis/capsule wardrobe, aktif belanja lewat smartphone, dan suka komunikasi yang to-the-point tanpa basa-basi formal.

### Persona utama — “The Quick Stylist”
- **Vibe:** Santai, suka mix-and-match outfit clean & aesthetic.
- **Kebiasaan belanja:** Belanja pas senggang di HP, gampang ilfeel kalau web lemot atau UX-nya ribet.
- **Kebutuhan:** Kurasi outfit yang udah terjamin keren, size chart yang gampang dibayangin di badan, rincian harga jujur tanpa biaya gaib.

---

## 5. Prinsip Produk

1. **Curated, Gak Bikin Pusing**: Katalog dipilih rapi per drop, bukan numpuk barang nggak jelas.
2. **Visual Mewah, Bahasa Nyantai**: Desain layout berkelas ala majalah fashion, tapi copy teksnya ramah dan akrab.
3. **Ukuran Anti-Zonk**: Panduan size visual wajib ada di tiap produk biar user nggak nebak-nebak.
4. **Mobile First & Sat-Set**: Tombol dan form gampang dijangkau jempol satu tangan.
5. **No Hidden Drama**: Biaya ongkir dan potongan harga kelihatan jelas dari keranjang.

---

## 6. Scope Produk (MVP)

1. **Top Announcement Bar**: Pengumuman gratis ongkir & garansi retur.
2. **Minimal Header**: Navigasi kategori, search bar kapsul, bag counter.
3. **Editorial Homepage**:
   - Hero banner tipografi serif mewah dengan hook copy Gen Z.
   - Quick category bubbles (Men, Women, Bags, Shoes, Accs).
   - Lookbook grid ("Curated Drops / Edit Minggu Ini").
   - Best seller fits.
4. **Katalog & Filter**: Filter instan Pria/Wanita dan sorting harga.
5. **Product Detail Page (PDP)**:
   - Galeri foto multi-angle.
   - Varian warna & size picker.
   - Drawer Visual Size Guide.
   - Accordion: *Detail Bahan & Fitting*, *Cara Rawat*, *Pengiriman & Garansi*.
6. **Shopping Bag**:
   - List belanjaan dengan counter quantity (`- 1 +`).
   - Order summary box warm sand.
   - Voucher code input.
7. **Structured 4-Step Checkout**:
   - (1) Kontak, (2) Alamat, (3) Pengiriman, (4) Pembayaran.
8. **Order Confirmation**: Bukti order dan instruksi pembayaran yang jelas.

---

## 7. UI/UX & Visual Direction

Mengacu pada referensi visual editorial modern (**SABLE**) yang tenang dan mewah:

### 7.1 Color System (Warm Neutral Palette)

| Token Name | Hex Code | Penggunaan | 
| ----- | ----- | ----- | 
| **Canvas / Background** | `#FBF8F3` | Background utama seluruh web (Alabaster Warm Cream) | 
| **Surface Card / Input** | `#FFFFFF` | Kontainer form input, foto produk, dan card item | 
| **Top Announcement** | `#F9E7E3` | Bar pengumuman atas (Soft Blush / Muted Peach) | 
| **Primary Ink** | `#1A1A1A` | Teks judul, body copy utama, dan button hitam solid | 
| **Muted Text** | `#6B665F` | Teks sekunder, deskripsi fitting, breadcrumb | 
| **Divider Subtle** | `#E8E4DC` | Garis border form, pemisah accordion | 
| **Summary Card** | `#F5F2EB` | Background box rincian order di Cart & Checkout | 
| **Stock Accent** | `#2D5A3D` | Teks ketersediaan barang ("Ready stock, langsung gas kirim") | 

### 7.2 Typography
- **Headings / Hero**: Editorial Serif (*Playfair Display* / *Cormorant Garamond*) — memberi nuansa estetik high-fashion.
- **Body / Interactive UI**: Clean Sans-Serif (*Inter* / *Geist Sans*) — modern, clean, dan gampang dibaca.

---

## 8. Copywriting Direction & Microcopy (Bahasa Indonesia Gaul Gen Z)

Gaya bahasa mengombinasikan visual *Quiet Luxury* dengan gaya tutur santai, percaya diri, gaul khas anak muda Jakarta/urban Indonesia, tanpa alay berlebihan.

### 8.1 Brand Voice Guidelines
- **Santai & Akrab:** Pakai sapaan *"kamu"* atau langsung to-the-point tanpa panggilan kaku *"Anda"*.
- **Slang Relevan:** Gunakan istilah yang natural: *fit check, spill, auto cop, anti zonk, sat-set, no drama, drop, racun baru*.
- **Jelas & Nggak Bikin Bingung:** Slang hanya untuk punchline, headline, atau button; label form dan angka tetap harus presisi dan mudah dipahami.

### 8.2 Kamus Microcopy & UI Texts

| Komponen / Halaman | Default Formal | Copy Gen Z UrbanStore | 
| ----- | ----- | ----- | 
| **Top Banner** | *Gratis Ongkir Minimal Rp 500.000 — Garansi Pengembalian 30 Hari* | **GRATIS ONGKIR MIN. 500RB — SALAH SIZE? TUKER AJA DALEM 30 HARI** | 
| **Hero Eyebrow** | *Koleksi Terbaik* | **CURATED DROP — VOL. 01** | 
| **Hero Headline** | *Gaya mewah, dirancang cermat.* | **Fit check approved. Mewah tapi nggak ribet.** | 
| **Hero Subcopy** | *Jelajahi pakaian dan aksesori premium untuk segala momen.* | *Outfit timeless yang kepake terus. Pas di badan, masuk di budget, tinggal mix-and-match.* | 
| **Hero CTA** | *Lihat Koleksi* | **Explore Drop Baru** | 
| **Section Title** | *Pilihan Minggu Ini* | **Racun Minggu Ini** | 
| **PDP Size Guide Link**| *Panduan Ukuran* | **Biar Nggak Zonk (Size Guide) →** | 
| **Stock Status** | *Stok tersedia, dikirim dalam 2-4 hari kerja* | **Ready stock — langsung bungkus & kirim dlm 1-2 hari** | 
| **Out of Stock** | *Stok habis* | **Keduluan yang lain / Habis nih** | 
| **Add to Bag** | *Tambahkan ke Keranjang* | **Masukin Bag (Rp 449.000)** | 
| **Empty Bag State** | *Keranjang belanja Anda masih kosong.* | **Bag kamu masih sepi nih. Yuk cari fit baru dulu!** | 
| **Empty Bag CTA** | *Mulai Belanja* | **Cari Outfit Dulu** | 
| **Promo Code Label** | *Gunakan Kode Promo* | **Punya kode promo? Masukin sini** | 
| **Checkout Stepper** | *1. Kontak, 2. Alamat, 3. Pengiriman, 4. Pembayaran* | **❶ Info Kamu · ❷ Kirim ke Mana · ❸ Mau Pake Kurir Apa · ❹ Bayar Sat-Set** | 
| **Checkout CTA** | *Lakukan Pemesanan* | **Gas Checkout — Rp 1.490.000** | 
| **Order Confirmation**| *Pesanan Anda telah berhasil dibuat.* | **Done! Orderan kamu udah kami terima.** | 
| **Order Status Sub** | *Kami sedang memproses pesanan Anda.* | *Duduk manis ya, outfit barumu lagi disiapin dari atelier.* | 

### 8.3 Error & Feedback States

| Kondisi | Respon Sistem | Copywriting Ramah & Solutif | 
| ----- | ----- | ----- | 
| Belum pilih ukuran | Blokir Add to Bag | *"Pilih ukuran dulu ya, biar pas di badan!"* | 
| Stok habis pas checkout | Notifikasi stok | *"Yah keduluan, size ini baru aja ludes. Cek varian lain yuk!"* | 
| Kode voucher salah | Input error | *"Kode promo ini nggak valid atau udah lewat masanya."* | 
| No HP salah format | Inline form error | *"Masukin nomor WhatsApp yang aktif ya buat info pengiriman."* | 
| Submit gagal | Retry toast | *"Jaringan lagi ngadat nih. Santai, klik coba lagi ya."* | 

---

## 9. Functional Requirements

### 9.1 Catalog & Product Listing
- Kartu produk bersih dengan thumbnail foto model/still-life.
- Label produk: Nama barang, varian warna/bahan, harga Rupiah rapi (cth: `Rp 420.000`).
- Chip filter: "Semua", "Pria", "Wanita", "Aksesoris".

### 9.2 Product Detail & Visual Size Guide
- Accordion minimalis:
  - **Fabric & Fit:** Komposisi bahan (cth: *100% Linen organic, cutting relaxed fit, model pake size M*).
  - **Care Instructions:** Cara cuci biar awet (cth: *Cuci santai air dingin, jangan disikat barbar*).
  - **Shipping & Returns:** Info pengiriman & garansi tukar size.
- Drawer panduan ukuran dengan ilustrasi pengukuran badan nyata (lebar dada, panjang baju) dan tips: *"Ukur kaos ternyamanmu, cocokkan sama tabel ini."*

### 9.3 Shopping Bag & Checkout
- Ringkasan pesanan di panel kartu *Warm Sand* (`#F5F2EB`).
- Input formulir satu kolom yang nyaman diketik di HP.
- Opsi kurir instan, reguler, dan bebas drama biaya siluman.

---

## 10. Acceptance Criteria MVP Checklist

- [ ] Seluruh copywriting utama sudah mengadopsi gaya bahasa santai ala Gen Z tanpa merusak estetika mewah.
- [ ] Microcopy form dan error message tetap jelas, solutif, dan tidak membingungkan pengguna.
- [ ] Desain visual konsisten dengan referensi Warm Neutral & Editorial Serif.
- [ ] Drawer Size Guide menggunakan copy yang menenangkan dan instruktif (*Anti-Zonk*).
- [ ] Alur 4-section checkout dapat diselesaikan dengan cepat di layar HP.

---

**End of Document — UrbanStore PRD v1.2 (Gen Z Slang Edition)**