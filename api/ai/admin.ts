import type { ApiRequest, ApiResponse } from '../_lib/mayar.js';
import { getSupabaseAdminClient, readJsonBody, sendJson } from '../_lib/mayar.js';
import { callGeminiWithFallback, getAdminGeminiKey } from '../_lib/gemini.js';

function clampString(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function safeNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method tidak diizinkan. Gunakan POST.' });
    return;
  }

  const { client: supabaseAdmin, error: supaErr } = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    sendJson(res, 500, { ok: false, error: supaErr });
    return;
  }

  // Strictly require valid Admin Supabase JWT
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    sendJson(res, 401, { ok: false, error: 'Akses ditolak. Token admin diperlukan.' });
    return;
  }

  const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !authData.user) {
    sendJson(res, 401, { ok: false, error: 'Sesi admin tidak valid.' });
    return;
  }

  const { data: profileData } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileData?.role !== 'admin') {
    sendJson(res, 403, { ok: false, error: 'Hanya akun admin yang dapat menggunakan fitur AI ini.' });
    return;
  }

  const apiKey = getAdminGeminiKey();
  if (!apiKey) {
    sendJson(res, 503, {
      ok: false,
      error: 'ADMIN_GEMINI_API_KEY belum dikonfigurasi di server.',
    });
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode === 413 ? 413 : 400;
    sendJson(res, status, {
      ok: false,
      error: status === 413 ? 'Ukuran payload terlalu besar.' : 'Format request tidak valid.',
    });
    return;
  }

  const action = clampString(body.action, 40);
  const input =
    body.input && typeof body.input === 'object' && !Array.isArray(body.input)
      ? (body.input as Record<string, unknown>)
      : null;

  if (!input) {
    sendJson(res, 400, { ok: false, error: 'Payload input wajib diisi.' });
    return;
  }

  if (action === 'product-description') {
    const name = clampString(input.name, 120);
    if (!name) {
      sendJson(res, 400, { ok: false, error: 'Nama produk wajib diisi.' });
      return;
    }

    const systemInstruction = `Kamu adalah Senior Copywriter & Merchandiser untuk brand fashion UrbanStore Indonesia (gaya editorial quiet luxury modern).

TUGAS:
Buatkan deskripsi produk yang menarik minat beli pelanggan, jelas, informatif, dan elegan berdasarkan data form produk yang diberikan oleh Admin.

ATURAN WAJIB:
1. MAKSIMAL 3 PARAGRAF PENDEK: Tulis 2 hingga maksimal 3 paragraf singkat dan padat (total ideal 60–110 kata). Jangan terlalu panjang.
2. DILARANG MENGADA-ADA: Gunakan HANYA fakta dari data input (nama, harga, kategori, bahan, warna, ukuran, fit, detail bahan/perawatan jika ada). Jangan mengarang klaim teknis, persentase komposisi baru, garansi palsu, atau dimensi yang tidak tertulis di input.
3. BAHASA INDONESIA NATURAL & PERSUASIF: Fokus pada keunggulan siluet, kenyamanan pemakaian, kemudahan mix-and-match, dan nilai produk agar pembaca tertarik membeli.
4. FORMAT BERSIH: DILARANG menggunakan tanda bintang (* atau **), pagar (#), backtick (\`), atau underscore (_). Tulis hanya teks paragraf bersih yang dipisahkan baris kosong.`;

    const sku = clampString(input.sku, 40);
    const subtitle = clampString(input.subtitle, 160);
    const fitNote = clampString(input.fitNote, 120);
    const modelInfo = clampString(input.modelInfo, 160);
    const fabricDetails = clampString(input.fabricDetails, 400);
    const careInstructions = clampString(input.careInstructions, 400);

    const prompt = [
      'Buatkan deskripsi produk UrbanStore untuk data berikut:',
      `- Nama Produk: ${name}`,
      sku ? `- SKU: ${sku}` : null,
      `- Harga: ${clampString(input.priceFormatted, 40)}`,
      `- Kategori: ${clampString(input.category, 40)} / ${clampString(input.subcategory, 60)}`,
      `- Bahan Utama: ${clampString(input.fabric, 60)}`,
      `- Skala Fit: ${clampString(input.fitScale, 40)}`,
      `- Warna: ${clampString(input.colorName, 60)}`,
      `- Ukuran Tersedia: ${clampString(input.sizes, 80)}`,
      subtitle ? `- Subtitle: ${subtitle}` : null,
      fitNote ? `- Fit Note: ${fitNote}` : null,
      modelInfo ? `- Info Ukuran/Model: ${modelInfo}` : null,
      fabricDetails ? `- Detail Bahan:\n${fabricDetails}` : null,
      careInstructions ? `- Cara Rawat:\n${careInstructions}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const result = await callGeminiWithFallback({
      apiKey,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction,
      temperature: 0.45,
      maxOutputTokens: 380,
      logLabel: 'Admin AI Description',
    });

    if (result.error || !result.text) {
      sendJson(res, result.statusCode || 502, {
        ok: false,
        error: result.error || 'Gagal membuat deskripsi produk AI.',
      });
      return;
    }

    const paragraphs = result.text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 3);

    sendJson(res, 200, { ok: true, description: paragraphs.join('\n\n') });
    return;
  }

  if (action === 'business-insight') {
    const systemInstruction = `Kamu adalah Senior Retail & E-Commerce Business Strategist untuk UrbanStore Indonesia.

TUGAS:
Analisa angka laporan penjualan toko saat ini, lalu berikan diagnosa kelemahan/peluang serta rekomendasi strategi penjualan konkret ke depan.

ATURAN WAJIB:
1. FAKTUAL: Gunakan HANYA angka dan fakta yang tertulis di laporan. Dilarang mengarang angka baru.
2. WAJIB MEMUAT 3 BAGIAN BERIKUT:
   KONDISI TOKO SAAT INI
   - 2 poin singkat mengevaluasi kekuatan omzet, AOV, kategori/wilayah unggulan, dan konversi pembayaran.
   HAL YANG PERLU DITINGKATKAN
   - 2 poin spesifik menyoroti area yang lemah atau perlu perbaikan (mis. order pending/kedaluwarsa, produk slow-moving, ketergantungan pada 1 kategori, atau stok varian kritis).
   REKOMENDASI STRATEGI PENJUALAN KE DEPAN
   - 3 poin rencana aksi praktis untuk minggu/bulan depan (mis. skema bundling produk slow-moving + best seller, kode promo bersyarat, follow-up WA untuk order tertunda, atau kampanye VIP subscriber).
3. FORMAT BERSIH: DILARANG menggunakan tanda bintang (* atau **), pagar (#), underscore (_), atau backtick (\`). Gunakan huruf kapital hanya untuk judul 3 bagian di atas dan tanda strip (-) atau angka (1., 2., 3.) yang rapi.`;

    const prompt = [
      `Analisa laporan bisnis UrbanStore untuk periode: ${clampString(input.periodLabel, 80)}`,
      `- Pendapatan Bersih (Lunas): ${clampString(input.netRevenueFormatted, 40)} (${safeNum(input.confirmedOrdersCount)} transaksi)`,
      `- Rata-rata Nilai Order (AOV): ${clampString(input.aovFormatted, 40)}`,
      `- Tingkat Keberhasilan Bayar: ${safeNum(input.completionRatePct)}% (${safeNum(input.expiredOrCancelledCount)} batal/kedaluwarsa)`,
      `- Potensi Omzet Tertunda (Pending/Verifikasi): ${clampString(input.pendingAmountFormatted, 40)}`,
      `- Total Unit Terjual: ${safeNum(input.totalUnitsSold)} pcs | Total Diskon Promo: ${clampString(input.totalDiscountFormatted, 40)}`,
      `- Kontribusi Kategori Teratas: ${clampString(input.topCategorySummary, 300) || 'Belum ada'}`,
      `- Wilayah Pembeli Teratas: ${clampString(input.topRegionSummary, 300) || 'Belum ada'}`,
      `- Produk Terlaris: ${clampString(input.topProductsSummary, 300) || 'Belum ada'}`,
      `- Produk Aktif Belum Terjual (Slow-Moving): ${safeNum(input.slowMovingCount)} produk`,
      `- Varian Stok Kritis (<= 3 pcs): ${safeNum(input.lowStockVariantsCount)} varian | VIP Subscribers: ${safeNum(input.subscribersCount)}`,
    ].join('\n');

    const result = await callGeminiWithFallback({
      apiKey,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction,
      temperature: 0.4,
      maxOutputTokens: 720,
      logLabel: 'Admin AI Report',
    });

    if (result.error || !result.text) {
      sendJson(res, result.statusCode || 502, {
        ok: false,
        error: result.error || 'Gagal menghasilkan analisa bisnis AI.',
      });
      return;
    }

    sendJson(res, 200, { ok: true, insight: result.text });
    return;
  }

  sendJson(res, 400, { ok: false, error: 'Action AI admin tidak dikenali.' });
}
