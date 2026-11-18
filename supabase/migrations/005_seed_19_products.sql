-- ============================================================================
-- 005: Seed 19 Varied UrbanStore Products & Variants (Bespoke SVG Imagery)
-- Safe to run repeatedly: uses ON CONFLICT DO NOTHING (preserves existing items)
-- ============================================================================

INSERT INTO public.products (
  id, sku, name, price, subtitle, category, subcategory, bestseller_tab,
  image, gallery, alt, badges, fit_note, fabric_type, colors, sizes,
  default_size, disabled_sizes, in_stock, stock_label, description,
  fabric_details, care_instructions, model_info, fit_scale, is_active, sort_order
) VALUES
  -- 1. Wanita: Dress & Setelan
  (
    'atelier-silk-column-dress', 'US-WM-101', 'Klara Silk Column Dress', 789000,
    'Sutra Mulberry · Bias-Cut Minimalist', 'women', 'Dress & Setelan', 'Dress',
    '/images/products/atelier-silk-column-dress.svg',
    '["/images/products/atelier-silk-column-dress.svg"]'::jsonb,
    'Ilustrasi produk Klara Silk Column Dress berbahan sutra Mulberry warna Ivory',
    '[{"text":"DROP BARU","variant":"primary"}]'::jsonb,
    'True to size · Potongan bias jatuh mengikuti lekuk tubuh',
    'Sutra Mulberry',
    '[{"name":"Ivory","hex":"#F5F2EB"},{"name":"Espresso","hex":"#3B2B23"}]'::jsonb,
    '["S","M","L"]'::jsonb, 'M', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Gaun slip column dengan potongan bias-cut dari sutra Mulberry 22-momme yang sejuk, ringan, dan berkilau lembut untuk acara formal maupun kasual malam.',
    '["100% Grade-6A Mulberry Silk 22mm","Lapisan lining halus anti-nerawang","Jahitan French seam rapi di sisi dalam"]'::jsonb,
    '["Cuci tangan dengan air dingin & deterjen khusus sutra","Jangan diperas, jemur gantung di tempat teduh","Setrika uap suhu rendah dari sisi dalam"]'::jsonb,
    'Lihat panduan ukuran Anti-Zonk untuk lingkar dada.', 'Pas Banget', true, 10
  ),
  -- 2. Wanita: Outerwear Atelier
  (
    'linen-double-blazer-wm', 'US-WM-102', 'Sora Linen Double-Breasted Blazer', 849000,
    'Linen Organik · Warm Sand Tailoring', 'women', 'Outerwear Atelier', 'Outerwear',
    '/images/products/linen-double-blazer-wm.svg',
    '["/images/products/linen-double-blazer-wm.svg"]'::jsonb,
    'Ilustrasi produk Sora Linen Double-Breasted Blazer warna Warm Sand',
    '[{"text":"BEST SELLER","variant":"secondary"}]'::jsonb,
    'Relaxed tailored · Bahu terstruktur ringan',
    'Linen Organik',
    '[{"name":"Warm Sand","hex":"#D6C7B2"},{"name":"Natural Cream","hex":"#F5F2EB"}]'::jsonb,
    '["S","M","L"]'::jsonb, 'M', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Blazer double-breasted berpotongan santai namun tegas dari linen Eropa bernapas, lengkap dengan kancing tanduk dan dua saku welt fungsional.',
    '["100% GOTS Certified European Flax Linen","Half-lined breathable Bemberg cupro","Kancing resin tanduk alami 4 titik"]'::jsonb,
    '["Dry clean disarankan atau cuci lembut air dingin","Setrika uap saat masih agak lembap"]'::jsonb,
    'Pilih size normal untuk fit santai.', 'Relaxed', true, 20
  ),
  -- 3. Wanita: Knitwear
  (
    'cashmere-rib-cardigan', 'US-WM-103', 'Nadia Cashmere Rib Cardigan', 649000,
    'Kasmir Murni · Oatmeal Fine Rib', 'women', 'Knitwear', NULL,
    '/images/products/cashmere-rib-cardigan.svg',
    '["/images/products/cashmere-rib-cardigan.svg"]'::jsonb,
    'Ilustrasi produk Nadia Cashmere Rib Cardigan warna Oatmeal',
    '[{"text":"SOFT KNIT","variant":"surface"}]'::jsonb,
    'True to size · Rajut elastis nyaman',
    'Kasmir Murni',
    '[{"name":"Oatmeal","hex":"#E5DEC9"},{"name":"Charcoal","hex":"#363532"}]'::jsonb,
    '["XS","S","M","L"]'::jsonb, 'S', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Kardigan rajut rib halus berleher V dengan sentuhan kasmir ringan yang lembut di kulit dan pas dipakai di ruangan ber-AC.',
    '["Fine-gauge Mongolian Cashmere Blend","Kancing motif tortoiseshell","Manset dan hem rajut rib elastis"]'::jsonb,
    '["Cuci tangan air dingin maksimal 30°C","Keringkan mendatar di atas handuk (flat dry)"]'::jsonb,
    'Fit mengikuti kontur tubuh tanpa sesak.', 'Pas Banget', true, 30
  ),
  -- 4. Wanita: Celana Tailored
  (
    'pleated-linen-palazzo', 'US-WM-104', 'Ayla Pleated Wide Palazzo', 529000,
    'Linen Organik · High-Waist Wide Leg', 'women', 'Celana Tailored', 'Celana',
    '/images/products/pleated-linen-palazzo.svg',
    '["/images/products/pleated-linen-palazzo.svg"]'::jsonb,
    'Ilustrasi produk Ayla Pleated Wide Palazzo warna Taupe',
    '[{"text":"DROP BARU","variant":"primary"}]'::jsonb,
    'High-waist · Kaki lebar memberi siluet jenjang',
    'Linen Organik',
    '[{"name":"Stone Taupe","hex":"#A69684"},{"name":"Natural Cream","hex":"#F5F2EB"}]'::jsonb,
    '["S","M","L"]'::jsonb, 'M', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Celana panjang high-waist dengan lipit depan ganda yang rapi dan siluet wide-leg lega untuk kenyamanan bergerak seharian.',
    '["100% Organic Linen 210gsm","Pengait pinggang tersembunyi + resleting YKK","Dua saku samping dalam"]'::jsonb,
    '["Cuci mesin mode gentle air dingin","Jemur teduh dan setrika suhu sedang"]'::jsonb,
    'Ukur lingkar pinggang tepat di atas pusar.', 'Relaxed', true, 40
  ),
  -- 5. Wanita: Dress & Setelan (Shirt)
  (
    'poplin-tunic-shirt-wm', 'US-WM-105', 'Elena Crisp Oversized Shirt', 429000,
    'Cotton Twill · Pure White Poplin', 'women', 'Dress & Setelan', NULL,
    '/images/products/poplin-tunic-shirt-wm.svg',
    '["/images/products/poplin-tunic-shirt-wm.svg"]'::jsonb,
    'Ilustrasi produk Elena Crisp Oversized Shirt warna Pure White',
    '[{"text":"ESSENTIAL","variant":"surface"}]'::jsonb,
    'Oversized fit · Turun 1 size jika suka pas',
    'Cotton Twill',
    '[{"name":"Pure White","hex":"#FFFFFF"},{"name":"Warm Ecru","hex":"#EFECE6"}]'::jsonb,
    '["S","M","L","XL"]'::jsonb, 'M', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Kemeja putih arsitektural berkerah tegas dengan bahu jatuh dan hem melengkung, mudah dipadukan sebagai atasan kerja maupun outer kasual.',
    '["100% High-density Combed Cotton","Kancing mutiara sintetis matte","Saku dada kiri simetris"]'::jsonb,
    '["Cuci mesin suhu normal dengan warna senada","Setrika suhu sedang-tinggi agar tetap crisp"]'::jsonb,
    'Potongan longgar modern.', 'Relaxed', true, 50
  ),

  -- 6. Pria: Outerwear Atelier
  (
    'relaxed-linen-blazer-mn', 'US-MN-201', 'Bima Unstructured Linen Blazer', 899000,
    'Linen Organik · Camel Tailored', 'men', 'Outerwear Atelier', 'Outerwear',
    '/images/products/relaxed-linen-blazer-mn.svg',
    '["/images/products/relaxed-linen-blazer-mn.svg"]'::jsonb,
    'Ilustrasi produk Bima Unstructured Linen Blazer warna Camel',
    '[{"text":"BEST SELLER","variant":"secondary"}]'::jsonb,
    'True to size · Bahu lembut tanpa bantalan kaku',
    'Linen Organik',
    '[{"name":"Warm Camel","hex":"#B38B59"},{"name":"Obsidian","hex":"#1E1E1C"}]'::jsonb,
    '["M","L","XL"]'::jsonb, 'L', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Blazer pria berkonstruksi unstructured yang ringan dan tidak gerah di iklim tropis, ideal untuk smart-casual meeting maupun acara malam.',
    '["100% European Flax Linen 230gsm","2-button single breasted + dua patch pocket","Jahitan pick-stitch rapi di kerah"]'::jsonb,
    '["Dry clean atau steam ringan setelah pemakaian","Gantung menggunakan hanger bahu lebar"]'::jsonb,
    'Cocok dipadukan di atas kaos maupun kemeja.', 'Pas Banget', true, 60
  ),
  -- 7. Pria: Knitwear
  (
    'merino-mockneck-knit', 'US-MN-202', 'Arga Fine Knit Mockneck', 579000,
    'Kasmir Murni · Warm Taupe Knit', 'men', 'Knitwear', NULL,
    '/images/products/merino-mockneck-knit.svg',
    '["/images/products/merino-mockneck-knit.svg"]'::jsonb,
    'Ilustrasi produk Arga Fine Knit Mockneck warna Warm Taupe',
    '[{"text":"DROP BARU","variant":"primary"}]'::jsonb,
    'Slim-regular · Rapi dipakai di bawah blazer',
    'Kasmir Murni',
    '[{"name":"Warm Taupe","hex":"#9A8D7D"},{"name":"Espresso","hex":"#3B2B23"}]'::jsonb,
    '["S","M","L","XL"]'::jsonb, 'M', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Sweater rajut halus berkerah mockneck dengan ketebalan medium yang tetap adem, memberikan siluet rapi baik dipakai tunggal maupun sebagai layer.',
    '["Fine Cashmere & Combed Cotton Blend","Kerah mockneck rib anti-melar","Sambungan bahu raglan presisi"]'::jsonb,
    '["Cuci tangan air dingin & keringkan mendatar","Simpan terlipat, hindari digantung lama"]'::jsonb,
    'Naik 1 size jika lebih suka potongan agak longgar.', 'Slim Fit', true, 70
  ),
  -- 8. Pria: Celana Tailored
  (
    'selvedge-chino-trousers', 'US-MN-203', 'Damar Tailored Pleated Chino', 489000,
    'Cotton Twill · Olive Stone Tapered', 'men', 'Celana Tailored', 'Celana',
    '/images/products/selvedge-chino-trousers.svg',
    '["/images/products/selvedge-chino-trousers.svg"]'::jsonb,
    'Ilustrasi produk Damar Tailored Pleated Chino warna Olive Stone',
    '[{"text":"CORE FIT","variant":"surface"}]'::jsonb,
    'True to size · Tapered rapi ke mata kaki',
    'Cotton Twill',
    '[{"name":"Olive Stone","hex":"#5D6354"},{"name":"Warm Khaki","hex":"#CBB89D"}]'::jsonb,
    '["30","32","34","36"]'::jsonb, '32', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Celana chino berbahan cotton twill padat dengan garis lipatan tengah rapi dan sedikit stretch agar tetap nyaman saat duduk maupun berjalan.',
    '["98% Organic Cotton Twill, 2% Elastane","Resleting metal YKK & kancing tanduk","Saku belakang paspoal berkancing"]'::jsonb,
    '["Cuci mesin air dingin dari sisi dalam","Setrika suhu sedang mengikuti lipatan depan"]'::jsonb,
    'Gunakan ukuran celana denim/chino yang biasa dipakai.', 'Pas Banget', true, 80
  ),
  -- 9. Pria: Outerwear Atelier (Overshirt)
  (
    'atelier-chore-overshirt', 'US-MN-204', 'Raka Twill Chore Overshirt', 599000,
    'Cotton Twill · Espresso Boxy Jacket', 'men', 'Outerwear Atelier', 'Outerwear',
    '/images/products/atelier-chore-overshirt.svg',
    '["/images/products/atelier-chore-overshirt.svg"]'::jsonb,
    'Ilustrasi produk Raka Twill Chore Overshirt warna Espresso',
    '[{"text":"DROP BARU","variant":"primary"}]'::jsonb,
    'Boxy relaxed · Mudah dipakai sebagai outer',
    'Cotton Twill',
    '[{"name":"Espresso","hex":"#3B2B23"},{"name":"Warm Sand","hex":"#D6C7B2"}]'::jsonb,
    '["S","M","L","XL"]'::jsonb, 'L', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Jaket overshirt bergaya workwear minimalis dari heavy cotton twill 310gsm dengan 3 saku patch utilitas dan jahitan ganda kokoh.',
    '["100% Heavy Cotton Twill 310gsm","3 saku patch depan + 1 saku dalam","Kancing corozo matte senada"]'::jsonb,
    '["Cuci terpisah air dingin, jangan gunakan pemutih","Jemur gantung di tempat teduh"]'::jsonb,
    'Potongan boxy cocok di-layer di atas T-shirt atau knit.', 'Relaxed', true, 90
  ),

  -- 10. Tas: Tas Kurasi
  (
    'structured-calfskin-tote', 'US-BG-301', 'Vero Structured Calfskin Tote', 1450000,
    'Kulit Calfskin · Caramel Architectural', 'bags', 'Tas Kurasi', 'Tas',
    '/images/products/structured-calfskin-tote.svg',
    '["/images/products/structured-calfskin-tote.svg"]'::jsonb,
    'Ilustrasi produk Vero Structured Calfskin Tote warna Caramel',
    '[{"text":"BEST SELLER","variant":"secondary"}]'::jsonb,
    'Muat laptop 14 inci & dokumen A4',
    'Kulit Calfskin',
    '[{"name":"Caramel","hex":"#9C6234"},{"name":"Obsidian","hex":"#1A1A1A"}]'::jsonb,
    '["One Size"]'::jsonb, 'One Size', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Tas tote berstruktur kokoh dari full-grain calfskin dengan pegangan gulung ergonomis, pengait brass minimalis, dan kompartemen laptop empuk.',
    '["100% Full-Grain Calfskin Leather","Lining suede mikrofiber tahan gores","Kaki pelindung brass di bagian alas"]'::jsonb,
    '["Lap dengan kain mikrofiber kering setelah pemakaian","Simpan di dalam dust bag dengan isian kertas"]'::jsonb,
    'Dimensi: 38cm (L) x 28cm (T) x 13cm (P).', 'Pas Banget', true, 100
  ),
  -- 11. Tas: Crescent Bag
  (
    'crescent-shoulder-bag', 'US-BG-302', 'Luna Crescent Shoulder Bag', 1150000,
    'Kulit Calfskin · Warm Cream Hobo', 'bags', 'Tas Kurasi', 'Tas',
    '/images/products/crescent-shoulder-bag.svg',
    '["/images/products/crescent-shoulder-bag.svg"]'::jsonb,
    'Ilustrasi produk Luna Crescent Shoulder Bag warna Warm Cream',
    '[{"text":"DROP BARU","variant":"primary"}]'::jsonb,
    'Ringan · Tali bahu dapat diatur 5 lubang',
    'Kulit Calfskin',
    '[{"name":"Warm Cream","hex":"#F2EDE2"},{"name":"Espresso","hex":"#3B2B23"}]'::jsonb,
    '["One Size"]'::jsonb, 'One Size', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Tas bahu siluet bulan sabit lembut yang mengikuti kontur tubuh dengan bukaan ritsleting halus dan gesper kuningan minimalis.',
    '["Supple Pebble Calfskin Leather","Gesper brushed-brass anti karat","Kompartemen dalam beritsleting"]'::jsonb,
    '["Hindari paparan hujan langsung & tinta","Gunakan leather conditioner ringan setiap 3 bulan"]'::jsonb,
    'Dimensi: 31cm (L) x 21cm (T) x 9cm (P).', 'Pas Banget', true, 110
  ),
  -- 12. Tas: Crossbody
  (
    'minimalist-crossbody-bag', 'US-BG-303', 'Kano Messenger Crossbody', 980000,
    'Kulit Calfskin · Obsidian Flap Bag', 'bags', 'Tas Kurasi', NULL,
    '/images/products/minimalist-crossbody-bag.svg',
    '["/images/products/minimalist-crossbody-bag.svg"]'::jsonb,
    'Ilustrasi produk Kano Messenger Crossbody warna Obsidian',
    '[{"text":"UNISEX","variant":"surface"}]'::jsonb,
    'Tali selempang adjustable · Unisex',
    'Kulit Calfskin',
    '[{"name":"Obsidian","hex":"#1C1C1A"},{"name":"Cognac","hex":"#855224"}]'::jsonb,
    '["One Size"]'::jsonb, 'One Size', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Tas selempang minimalis berdesain flap bersih dengan pengunci magnet tersembunyi, ideal untuk mobilitas harian tanpa membawa beban berlebih.',
    '["Smooth Matte Calfskin Leather","Pengunci magnetik + saku belakang cepat","Tali kulit adjustable 95-125cm"]'::jsonb,
    '["Bersihkan noda ringan dengan kain lembap lembut","Simpan dalam dust bag di tempat sejuk"]'::jsonb,
    'Dimensi: 25cm (L) x 19cm (T) x 7cm (P).', 'Pas Banget', true, 120
  ),
  -- 13. Tas: Weekender Duffel
  (
    'canvas-leather-weekender', 'US-BG-304', 'Surya Canvas & Leather Duffel', 1650000,
    'Cotton Twill · Ecru Canvas & Tan Trim', 'bags', 'Tas Kurasi', NULL,
    '/images/products/canvas-leather-weekender.svg',
    '["/images/products/canvas-leather-weekender.svg"]'::jsonb,
    'Ilustrasi produk Surya Canvas and Leather Duffel warna Ecru Tan',
    '[{"text":"TRAVEL EDIT","variant":"secondary"}]'::jsonb,
    'Kapasitas kabin pesawat (32L)',
    'Cotton Twill',
    '[{"name":"Ecru & Tan","hex":"#E8E1D1"}]'::jsonb,
    '["One Size"]'::jsonb, 'One Size', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Tas travel akhir pekan perpaduan kanvas katun tebal water-repellent dengan sabuk penguat kulit saddle tan dan tali bahu lepas-pasang.',
    '["Heavyweight 18oz Water-Repellent Canvas","Trim & handle 100% saddle leather","Saku sepatu terpisah di sisi samping"]'::jsonb,
    '["Sikat halus bagian kanvas jika berdebu","Jangan dicuci mesin atau direndam"]'::jsonb,
    'Dimensi: 48cm (L) x 27cm (T) x 24cm (P).', 'Relaxed', true, 130
  ),

  -- 14. Sepatu: Penny Loafer
  (
    'handburnished-penny-loafer', 'US-SH-401', 'Marco Hand-Burnished Penny Loafer', 1290000,
    'Kulit Calfskin · Cognac Blake-Stitched', 'shoes', 'Sepatu', 'Sepatu',
    '/images/products/handburnished-penny-loafer.svg',
    '["/images/products/handburnished-penny-loafer.svg"]'::jsonb,
    'Ilustrasi produk Marco Hand-Burnished Penny Loafer warna Cognac',
    '[{"text":"BEST SELLER","variant":"secondary"}]'::jsonb,
    'True to size · Insole empuk bebas lecet',
    'Kulit Calfskin',
    '[{"name":"Cognac Tan","hex":"#8F5124"},{"name":"Dark Espresso","hex":"#2D211B"}]'::jsonb,
    '["40","41","42","43"]'::jsonb, '42', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Sepatu penny loafer klasik konstruksi Blake-stitched dari kulit calfskin burnished tangan dengan bantalan memory foam berlapis kulit.',
    '["Full-grain Hand-Burnished Calfskin Upper","Konstruksi sol Blake-stitched fleksibel","Insole kulit sapi dengan memory foam 4mm"]'::jsonb,
    '["Gunakan shoe tree kayu setelah pemakaian","Semir dengan neutral cream secara berkala"]'::jsonb,
    'Cocokkan panjang telapak kaki dengan tabel Sepatu di Size Guide.', 'Pas Banget', true, 140
  ),
  -- 15. Sepatu: Minimalist Sneaker
  (
    'minimalist-court-sneaker', 'US-SH-402', 'Solano Minimalist Leather Sneaker', 950000,
    'Kulit Calfskin · Chalk White & Taupe', 'shoes', 'Sepatu', 'Sepatu',
    '/images/products/minimalist-court-sneaker.svg',
    '["/images/products/minimalist-court-sneaker.svg"]'::jsonb,
    'Ilustrasi produk Solano Minimalist Leather Sneaker warna Chalk White',
    '[{"text":"UNISEX","variant":"surface"}]'::jsonb,
    'True to size · Sol karet ringan empuk',
    'Kulit Calfskin',
    '[{"name":"Chalk White","hex":"#F7F5F0"}]'::jsonb,
    '["39","40","41","42","43"]'::jsonb, '41', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Sneaker court putih bersih tanpa logo mencolok dengan aksen tumit suede taupe dan cupsole karet Margom yang ringan untuk dipakai seharian.',
    '["Nappa Calfskin Upper + Suede Heel Tab","Full leather lining bebas bau","Cupsole karet jahit keliling tahan lama"]'::jsonb,
    '["Lap dengan kain lembap setelah dipakai","Gunakan sikat suede lembut khusus bagian tumit"]'::jsonb,
    'Pilih ukuran sneaker harian Anda.', 'Pas Banget', true, 150
  ),
  -- 16. Sepatu: Square-Toe Mule
  (
    'square-toe-leather-mule', 'US-SH-403', 'Celine Square-Toe Leather Mule', 790000,
    'Kulit Calfskin · Butter Cream Slip-On', 'shoes', 'Sepatu', NULL,
    '/images/products/square-toe-leather-mule.svg',
    '["/images/products/square-toe-leather-mule.svg"]'::jsonb,
    'Ilustrasi produk Celine Square-Toe Leather Mule warna Butter Cream',
    '[{"text":"DROP BARU","variant":"primary"}]'::jsonb,
    'True to size · Kaki lebar naik 1 size',
    'Kulit Calfskin',
    '[{"name":"Butter Cream","hex":"#EFE6D5"},{"name":"Obsidian","hex":"#1E1E1C"}]'::jsonb,
    '["37","38","39","40"]'::jsonb, '38', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Mule kulit ujung kotak modern dengan hak blok rendah 2.5cm yang stabil dan bantalan kaki empuk untuk transisi kerja ke makan malam.',
    '["Soft Nappa Calfskin Upper","Hak blok rendah 2.5cm anti-selip","Footbed kulit empuk ergonomis"]'::jsonb,
    '["Hindari genangan air agar kulit tetap lentur","Simpan dengan penyangga ujung sepatu"]'::jsonb,
    'Jika punggung kaki tinggi atau lebar, disarankan naik 1 ukuran.', 'Pas Banget', true, 160
  ),

  -- 17. Aksesori: Watch
  (
    'atelier-chronograph-watch', 'US-AC-501', 'Chrono Minimalist Leather Watch', 1850000,
    'Kulit Calfskin · Brushed Steel & Taupe', 'accessories', 'Aksesori', NULL,
    '/images/products/atelier-chronograph-watch.svg',
    '["/images/products/atelier-chronograph-watch.svg"]'::jsonb,
    'Ilustrasi produk Chrono Minimalist Leather Watch strap taupe',
    '[{"text":"LIMITED","variant":"secondary"}]'::jsonb,
    'Diameter case 38mm · Unisex',
    'Kulit Calfskin',
    '[{"name":"Taupe & Steel","hex":"#A69684"}]'::jsonb,
    '["One Size"]'::jsonb, 'One Size', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Jam tangan analog minimalis berdiameter 38mm dengan kaca safir tahan gores, dial krem bersih, dan strap kulit calfskin Italia yang mudah dilepas-pasang.',
    '["316L Brushed Stainless Steel Case 38mm","Sapphire Crystal Glass + Water Resistant 5ATM","Quick-release Italian Calfskin Strap"]'::jsonb,
    '["Lap kaca & case dengan kain lembut","Lepas saat berenang untuk menjaga keawetan strap kulit"]'::jsonb,
    'Cocok untuk lingkar pergelangan 14.5cm - 20.5cm.', 'Pas Banget', true, 170
  ),
  -- 18. Aksesori: Belt
  (
    'italian-calfskin-belt', 'US-AC-502', 'Brushed-Brass Calfskin Belt', 389000,
    'Kulit Calfskin · Espresso & Brass Buckle', 'accessories', 'Aksesori', NULL,
    '/images/products/italian-calfskin-belt.svg',
    '["/images/products/italian-calfskin-belt.svg"]'::jsonb,
    'Ilustrasi produk Brushed-Brass Calfskin Belt warna Espresso',
    '[{"text":"ESSENTIAL","variant":"surface"}]'::jsonb,
    'Lebar 30mm · Cocok untuk celana tailored & jeans',
    'Kulit Calfskin',
    '[{"name":"Espresso","hex":"#3B2B23"},{"name":"Obsidian","hex":"#1A1A1A"}]'::jsonb,
    '["S-M","L-XL"]'::jsonb, 'S-M', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Ikat pinggang kulit sapi utuh (full-grain) selebar 3cm dengan gesper kuningan membulat yang kokoh, menyempurnakan tampilan chino maupun blazer.',
    '["100% Vegetable-Tanned Calfskin","Solid Brushed-Brass Buckle","5 lubang penyesuaian presisi"]'::jsonb,
    '["Gulung longgar saat disimpan","Hindari menekuk tajam di satu titik"]'::jsonb,
    'S-M (pinggang 28-32), L-XL (pinggang 33-38).', 'Pas Banget', true, 180
  ),
  -- 19. Aksesori: Silk Scarf
  (
    'mulberry-silk-scarf', 'US-AC-503', 'Botanical Mulberry Silk Scarf', 349000,
    'Sutra Mulberry · Warm Terracotta Frame', 'accessories', 'Aksesori', NULL,
    '/images/products/mulberry-silk-scarf.svg',
    '["/images/products/mulberry-silk-scarf.svg"]'::jsonb,
    'Ilustrasi produk Botanical Mulberry Silk Scarf warna Terracotta Cream',
    '[{"text":"GIFT READY","variant":"surface"}]'::jsonb,
    'Ukuran persegi 70x70 cm · Hand-rolled edge',
    'Sutra Mulberry',
    '[{"name":"Terracotta Cream","hex":"#D9C7B2"}]'::jsonb,
    '["One Size"]'::jsonb, 'One Size', '[]'::jsonb, true,
    'Ready stock — kirim dlm 1-2 hari',
    'Syal sutra Mulberry persegi 70x70 cm dengan motif bingkai arsitektural lembut dan tepian gulung jahit rapi, cantik dipakai di leher, rambut, maupun pegangan tas.',
    '["100% Mulberry Silk Twill 14mm","Tepian hand-rolled rapi","Dikemas dalam kotak hadiah UrbanStore"]'::jsonb,
    '["Cuci tangan dingin atau dry clean","Setrika suhu rendah di balik kain tipis"]'::jsonb,
    'Dimensi: 70cm x 70cm.', 'Pas Banget', true, 190
  )
ON CONFLICT (id) DO NOTHING;

-- Seed default variants (10 pcs each) for the 19 products
INSERT INTO public.product_variants (product_id, color_name, color_hex, size, stock_qty, is_available)
SELECT
  p.id,
  (c ->> 'name') AS color_name,
  (c ->> 'hex') AS color_hex,
  sz AS size,
  10 AS stock_qty,
  true AS is_available
FROM public.products p
CROSS JOIN LATERAL jsonb_array_elements(p.colors) AS c
CROSS JOIN LATERAL jsonb_array_elements_text(p.sizes) AS sz
WHERE p.id IN (
  'atelier-silk-column-dress',
  'linen-double-blazer-wm',
  'cashmere-rib-cardigan',
  'pleated-linen-palazzo',
  'poplin-tunic-shirt-wm',
  'relaxed-linen-blazer-mn',
  'merino-mockneck-knit',
  'selvedge-chino-trousers',
  'atelier-chore-overshirt',
  'structured-calfskin-tote',
  'crescent-shoulder-bag',
  'minimalist-crossbody-bag',
  'canvas-leather-weekender',
  'handburnished-penny-loafer',
  'minimalist-court-sneaker',
  'square-toe-leather-mule',
  'atelier-chronograph-watch',
  'italian-calfskin-belt',
  'mulberry-silk-scarf'
)
ON CONFLICT (product_id, color_name, size) DO NOTHING;
