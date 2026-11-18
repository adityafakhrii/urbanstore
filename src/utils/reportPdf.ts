import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AdminOrderRow, formatRupiah } from '../services/supabaseService';
import { Product } from '../data/products';
import { getOrderStatusLabel } from './payment';

interface JsPdfWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

export interface SalesReportPdfInput {
  periodLabel: string;
  scopeLabel: string;
  downloadedBy: string;
  netRevenue: number;
  confirmedCount: number;
  aov: number;
  totalUnitsSold: number;
  completionRatePct: number;
  closedCount: number;
  pendingAmount: number;
  pendingCount: number;
  totalDiscount: number;
  totalShipping: number;
  categoryList: { label: string; revenue: number; qty: number }[];
  totalCatRev: number;
  topRegions: { province: string; orders: number; revenue: number }[];
  paymentList: { method: string; orders: number; revenue: number }[];
  topProducts: { sku: string; name: string; categoryLabel: string; qty: number; revenue: number }[];
  slowMovingProducts: Product[];
  scopedOrders: AdminOrderRow[];
  aiInsightText?: string | null;
}

function getNextY(doc: JsPdfWithAutoTable, fallback: number, gap = 8): number {
  const lastY = doc.lastAutoTable?.finalY;
  return typeof lastY === 'number' ? lastY + gap : fallback;
}

function ensureRoom(doc: JsPdfWithAutoTable, currentY: number, neededHeight = 32): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + neededHeight > pageHeight - 20) {
    doc.addPage();
    return 18;
  }
  return currentY;
}

function drawSectionHeading(doc: JsPdfWithAutoTable, title: string, y: number): number {
  const safeY = ensureRoom(doc, y, 26);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(28, 28, 25);
  doc.text(title.toUpperCase(), 14, safeY);
  doc.setDrawColor(230, 225, 216);
  doc.setLineWidth(0.4);
  doc.line(14, safeY + 2.2, 196, safeY + 2.2);
  return safeY + 6;
}

export function exportSalesReportPdf(data: SalesReportPdfInput): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as JsPdfWithAutoTable;
  const now = new Date();
  const downloadedAt = now.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateSlug = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  // Top Header Band
  doc.setFillColor(28, 28, 25);
  doc.rect(0, 0, 210, 34, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('URBANSTORE INDONESIA', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(230, 225, 216);
  doc.text('Laporan Penjualan & Analisa Bisnis Resmi', 14, 21);

  doc.setFontSize(8);
  doc.setTextColor(210, 204, 194);
  doc.text(`Diunduh: ${downloadedAt} WIB`, 196, 14, { align: 'right' });
  doc.text(`Oleh: ${data.downloadedBy || 'Administrator'}`, 196, 20, { align: 'right' });

  // Report Metadata Card
  doc.setFillColor(245, 242, 235);
  doc.setDrawColor(230, 225, 216);
  doc.roundedRect(14, 39, 182, 15, 2, 2, 'FD');

  doc.setTextColor(107, 102, 95);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PERIODE LAPORAN:', 18, 45.5);
  doc.text('CAKUPAN STATUS:', 108, 45.5);

  doc.setTextColor(28, 28, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(data.periodLabel, 18, 50.5);
  doc.text(data.scopeLabel, 108, 50.5);

  let y = 62;

  // Section 1: Financial Summary
  y = drawSectionHeading(doc, '1. Ringkasan Kinerja Keuangan & Operasional', y);
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [28, 28, 25],
      lineColor: [230, 225, 216],
      lineWidth: 0.25,
    },
    headStyles: {
      fillColor: [245, 242, 235],
      textColor: [133, 82, 36],
      fontStyle: 'bold',
    },
    head: [['Indikator Bisnis', 'Nilai', 'Keterangan']],
    body: [
      [
        'Pendapatan Bersih (Lunas)',
        formatRupiah(data.netRevenue),
        `${data.confirmedCount} transaksi tervalidasi`,
      ],
      [
        'Rata-rata Nilai Order (AOV)',
        formatRupiah(data.aov),
        `Total ${data.totalUnitsSold} pcs item terjual`,
      ],
      [
        'Tingkat Pembayaran Berhasil',
        `${data.completionRatePct}%`,
        `${data.closedCount} pesanan batal / kedaluwarsa`,
      ],
      [
        'Potensi Omzet Tertunda',
        formatRupiah(data.pendingAmount),
        `${data.pendingCount} pesanan menunggu bayar / verifikasi`,
      ],
      [
        'Total Diskon Promo & Ongkir',
        formatRupiah(data.totalDiscount),
        `Ongkos kirim tercatat: ${formatRupiah(data.totalShipping)}`,
      ],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 62 },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 44 },
      2: { cellWidth: 76 },
    },
  });
  y = getNextY(doc, y, 9);

  // Section 2: Category & Geographic Contribution
  y = drawSectionHeading(doc, '2. Kontribusi Kategori & Wilayah Pembeli', y);
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    theme: 'striped',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.8,
      textColor: [28, 28, 25],
      lineColor: [230, 225, 216],
    },
    headStyles: {
      fillColor: [28, 28, 25],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [250, 248, 244] },
    head: [['Kategori', 'Unit Terjual', 'Total Pendapatan', 'Kontribusi']],
    body: data.categoryList.map((c) => {
      const pct = data.totalCatRev > 0 ? Math.round((c.revenue / data.totalCatRev) * 100) : 0;
      return [c.label, `${c.qty} pcs`, formatRupiah(c.revenue), `${pct}%`];
    }),
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });
  y = getNextY(doc, y, 7);

  if (data.topRegions.length > 0 || data.paymentList.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      theme: 'striped',
      styles: { fontSize: 8.2, cellPadding: 2.6, textColor: [28, 28, 25] },
      headStyles: { fillColor: [133, 82, 36], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 248, 244] },
      head: [['Wilayah Pembeli (Provinsi/Kota)', 'Jumlah Order', 'Total Nilai Order']],
      body:
        data.topRegions.length > 0
          ? data.topRegions.map((r) => [r.province, `${r.orders} order`, formatRupiah(r.revenue)])
          : [['Belum ada data wilayah', '-', '-']],
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
    });
    y = getNextY(doc, y, 9);
  }

  // Section 3: Product Performance (Best Sellers & Slow Moving)
  y = drawSectionHeading(doc, '3. Performa Produk Terlaris & Slow-Moving', y);
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    theme: 'striped',
    styles: { fontSize: 8.2, cellPadding: 2.6, textColor: [28, 28, 25] },
    headStyles: { fillColor: [28, 28, 25], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 248, 244] },
    head: [['SKU', 'Produk Terlaris', 'Kategori', 'Terjual', 'Omzet Item']],
    body:
      data.topProducts.length > 0
        ? data.topProducts.map((tp) => [
            tp.sku,
            tp.name,
            tp.categoryLabel,
            `${tp.qty} pcs`,
            formatRupiah(tp.revenue),
          ])
        : [['-', 'Belum ada produk terjual pada periode ini', '-', '0 pcs', 'Rp 0']],
    columnStyles: {
      0: { cellWidth: 26 },
      3: { halign: 'right', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 34 },
    },
  });
  y = getNextY(doc, y, 6);

  if (data.slowMovingProducts.length > 0) {
    const slowSummary = data.slowMovingProducts
      .slice(0, 8)
      .map((p) => `${p.name} (${p.sku} · ${p.priceFormatted})`)
      .join(', ');
    y = ensureRoom(doc, y, 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(133, 82, 36);
    doc.text(
      `Produk Aktif Belum Terjual (${data.slowMovingProducts.length} produk):`,
      14,
      y
    );
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 71, 70);
    const wrapped = doc.splitTextToSize(slowSummary, 182) as string[];
    doc.text(wrapped, 14, y + 4.5);
    y += 6 + wrapped.length * 4;
  }

  // Section 4: AI Business Insight & Strategy (if present)
  if (data.aiInsightText && data.aiInsightText.trim()) {
    y = drawSectionHeading(doc, '4. Analisa Bisnis & Strategi Penjualan AI', y + 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(28, 28, 25);
    const insightLines = doc.splitTextToSize(data.aiInsightText.trim(), 178) as string[];
    for (const line of insightLines) {
      y = ensureRoom(doc, y, 8);
      doc.text(line, 16, y);
      y += 4.3;
    }
    y += 5;
  }

  // Section 5: Transactions Table
  const txTitleNumber = data.aiInsightText?.trim() ? '5' : '4';
  y = drawSectionHeading(
    doc,
    `${txTitleNumber}. Rincian Transaksi (${data.scopedOrders.length} Pesanan)`,
    y
  );
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14, bottom: 20 },
    showHead: 'everyPage',
    theme: 'striped',
    styles: {
      fontSize: 7.8,
      cellPadding: 2.5,
      textColor: [28, 28, 25],
      overflow: 'linebreak',
    },
    headStyles: { fillColor: [28, 28, 25], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 248, 244] },
    head: [['No. Order', 'Tanggal', 'Customer & Wilayah', 'Pembayaran', 'Status', 'Total']],
    body:
      data.scopedOrders.length > 0
        ? data.scopedOrders.map((ord) => [
            `#${ord.order_number}`,
            new Date(ord.created_at).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            `${ord.full_name}\n${[ord.city, ord.province].filter(Boolean).join(', ')}`,
            ord.payment_method,
            getOrderStatusLabel(ord.status),
            formatRupiah(ord.total),
          ])
        : [['-', '-', 'Tidak ada transaksi pada periode terpilih', '-', '-', 'Rp 0']],
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 23 },
      2: { cellWidth: 52 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 24 },
    },
  });

  // Stamp page numbers & download timestamp footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(230, 225, 216);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 14, 196, pageH - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 102, 95);
    doc.text(`UrbanStore Indonesia · Dokumen Laporan Internal · Diunduh: ${downloadedAt} WIB`, 14, pageH - 9);
    doc.text(`Halaman ${i} dari ${totalPages}`, 196, pageH - 9, { align: 'right' });
  }

  const fileName = `urbanstore-laporan-penjualan-${dateSlug}.pdf`;
  doc.save(fileName);
  return downloadedAt;
}
