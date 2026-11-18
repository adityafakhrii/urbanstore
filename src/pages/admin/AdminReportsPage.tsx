import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { PRODUCT_CATEGORIES } from '../../data/products';
import {
  AdminOrderRow,
  ProductVariantRow,
  PromoRow,
  SubscriberRow,
  fetchAllOrdersAdmin,
  fetchPromosAdmin,
  fetchSubscribersAdmin,
  fetchVariantsAdmin,
  formatRupiah,
} from '../../services/supabaseService';
import {
  SavedAiReportInsight,
  deleteSavedAiInsight,
  generateAdminBusinessInsight,
  loadSavedAiInsights,
  saveAiInsightToArchive,
} from '../../services/aiAssistantService';
import { getOrderStatusBadge, getOrderStatusLabel } from '../../utils/payment';
import { exportSalesReportPdf } from '../../utils/reportPdf';
import {
  AlertBanner,
  Button,
  ConfirmDialog,
  CustomSelect,
  DatePickerField,
  StatusBadge,
} from '../../components/ui';

type PeriodPreset = 'today' | '7d' | '30d' | 'month' | 'all' | 'custom';
type ScopeMode = 'confirmed' | 'valid' | 'all';

const CONFIRMED_STATUSES: AdminOrderRow['status'][] = ['paid', 'packed', 'shipped', 'delivered'];
const CLOSED_STATUSES: AdminOrderRow['status'][] = ['cancelled', 'expired'];

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function escapeCsvCell(val: unknown): string {
  const s = String(val ?? '').replace(/\r?\n/g, ' ');
  return `"${s.replace(/"/g, '""')}"`;
}

export const AdminReportsPage: React.FC = () => {
  const { profile } = useAuth();
  const { products, showToast } = useStore();

  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [variants, setVariants] = useState<ProductVariantRow[]>([]);
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [preset, setPreset] = useState<PeriodPreset>('30d');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return toDateInputValue(d);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => toDateInputValue(new Date()));
  const [scopeMode, setScopeMode] = useState<ScopeMode>('confirmed');

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiSavedCurrent, setAiSavedCurrent] = useState(false);
  const [savedInsights, setSavedInsights] = useState<SavedAiReportInsight[]>(() =>
    loadSavedAiInsights()
  );
  const [activeArchivedId, setActiveArchivedId] = useState<string | null>(null);
  const [confirmDeleteInsightId, setConfirmDeleteInsightId] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  const loadReportData = useCallback(async () => {
    setLoading(true);
    const [ordData, varData, promoData, subData] = await Promise.all([
      fetchAllOrdersAdmin(),
      fetchVariantsAdmin(),
      fetchPromosAdmin(),
      fetchSubscribersAdmin(),
    ]);
    setOrders(ordData);
    setVariants(varData);
    setPromos(promoData);
    setSubscribers(subData);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadReportData();
  }, [loadReportData]);

  // Compute active date range boundaries
  const dateRange = useMemo(() => {
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start: Date | null = null;
    let end: Date = endOfToday;
    let label = '30 Hari Terakhir';

    if (preset === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      label = `Hari Ini (${start.toLocaleDateString('id-ID')})`;
    } else if (preset === '7d') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      label = '7 Hari Terakhir';
    } else if (preset === '30d') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
      label = '30 Hari Terakhir';
    } else if (preset === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      label = `Bulan ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
    } else if (preset === 'custom') {
      start = customStart ? new Date(`${customStart}T00:00:00`) : null;
      end = customEnd ? new Date(`${customEnd}T23:59:59.999`) : endOfToday;
      label = `${customStart || '...'} s/d ${customEnd || 'Hari Ini'}`;
    } else {
      start = null;
      label = 'Semua Waktu';
    }

    return { start, end, label };
  }, [preset, customStart, customEnd]);

  // Orders within selected date range (all statuses for completion rate & funnel)
  const ordersInPeriod = useMemo(() => {
    return orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      if (dateRange.start && t < dateRange.start.getTime()) return false;
      if (t > dateRange.end.getTime()) return false;
      return true;
    });
  }, [orders, dateRange]);

  // Previous period revenue comparison (when finite window exists)
  const previousRevenuePct = useMemo(() => {
    if (!dateRange.start) return null;
    const windowMs = dateRange.end.getTime() - dateRange.start.getTime();
    const prevEnd = dateRange.start.getTime() - 1;
    const prevStart = prevEnd - windowMs;

    const currentRev = ordersInPeriod
      .filter((o) => CONFIRMED_STATUSES.includes(o.status))
      .reduce((s, o) => s + o.total, 0);

    const prevRev = orders
      .filter((o) => {
        const t = new Date(o.created_at).getTime();
        return t >= prevStart && t <= prevEnd && CONFIRMED_STATUSES.includes(o.status);
      })
      .reduce((s, o) => s + o.total, 0);

    if (prevRev === 0) return currentRev > 0 ? 100 : 0;
    return Math.round(((currentRev - prevRev) / prevRev) * 100);
  }, [orders, ordersInPeriod, dateRange]);

  // Orders filtered by financial scope selector
  const scopedOrders = useMemo(() => {
    if (scopeMode === 'confirmed') {
      return ordersInPeriod.filter((o) => CONFIRMED_STATUSES.includes(o.status));
    }
    if (scopeMode === 'valid') {
      return ordersInPeriod.filter((o) => !CLOSED_STATUSES.includes(o.status));
    }
    return ordersInPeriod;
  }, [ordersInPeriod, scopeMode]);

  const productBySku = useMemo(() => {
    const map = new Map<string, (typeof products)[number]>();
    products.forEach((p) => map.set(p.sku.toUpperCase(), p));
    return map;
  }, [products]);

  const analytics = useMemo(() => {
    const confirmedInPeriod = ordersInPeriod.filter((o) => CONFIRMED_STATUSES.includes(o.status));
    const closedInPeriod = ordersInPeriod.filter((o) => CLOSED_STATUSES.includes(o.status));
    const pendingInPeriod = ordersInPeriod.filter(
      (o) => o.status === 'pending' || o.status === 'waiting_verification'
    );

    const netRevenue = confirmedInPeriod.reduce((s, o) => s + o.total, 0);
    const pendingAmount = pendingInPeriod.reduce((s, o) => s + o.total, 0);
    const aov =
      confirmedInPeriod.length > 0 ? Math.round(netRevenue / confirmedInPeriod.length) : 0;

    const finishedDenominator = confirmedInPeriod.length + closedInPeriod.length;
    const completionRatePct =
      finishedDenominator > 0
        ? Math.round((confirmedInPeriod.length / finishedDenominator) * 100)
        : confirmedInPeriod.length > 0
        ? 100
        : 0;

    // Scoped totals for breakdown charts & tables
    const scopedTotalRevenue = scopedOrders.reduce((s, o) => s + o.total, 0);
    const totalDiscount = scopedOrders.reduce((s, o) => s + o.discount, 0);
    const totalShipping = scopedOrders.reduce((s, o) => s + o.shipping_cost, 0);
    let totalUnitsSold = 0;

    const categoryStats = new Map<string, { label: string; revenue: number; qty: number }>();
    PRODUCT_CATEGORIES.forEach((cat) => {
      categoryStats.set(cat.value, { label: cat.label, revenue: 0, qty: 0 });
    });

    const productPerf = new Map<
      string,
      { sku: string; name: string; categoryLabel: string; qty: number; revenue: number }
    >();

    const regionStats = new Map<string, { province: string; orders: number; revenue: number }>();
    const paymentStats = new Map<string, { method: string; orders: number; revenue: number }>();
    const courierStats = new Map<string, { courier: string; orders: number; revenue: number }>();

    scopedOrders.forEach((ord) => {
      const prov = (ord.province || ord.city || 'Lainnya').trim() || 'Lainnya';
      const rEntry = regionStats.get(prov) || { province: prov, orders: 0, revenue: 0 };
      rEntry.orders += 1;
      rEntry.revenue += ord.total;
      regionStats.set(prov, rEntry);

      const pEntry = paymentStats.get(ord.payment_method) || {
        method: ord.payment_method,
        orders: 0,
        revenue: 0,
      };
      pEntry.orders += 1;
      pEntry.revenue += ord.total;
      paymentStats.set(ord.payment_method, pEntry);

      const cKey = ord.shipping_expedition
        ? `${ord.shipping_expedition} (${ord.courier.toUpperCase()})`
        : ord.courier.toUpperCase();
      const cEntry = courierStats.get(cKey) || { courier: cKey, orders: 0, revenue: 0 };
      cEntry.orders += 1;
      cEntry.revenue += ord.total;
      courierStats.set(cKey, cEntry);

      ord.order_items?.forEach((item) => {
        totalUnitsSold += item.quantity;
        const catalogProd = productBySku.get(item.product_sku.toUpperCase());
        const catKey = catalogProd?.category || 'accessories';
        const catMeta = PRODUCT_CATEGORIES.find((c) => c.value === catKey);
        const catLabel = catMeta?.label || 'Lainnya';

        const catEntry = categoryStats.get(catKey) || { label: catLabel, revenue: 0, qty: 0 };
        catEntry.revenue += item.line_total;
        catEntry.qty += item.quantity;
        categoryStats.set(catKey, catEntry);

        const perfEntry = productPerf.get(item.product_sku) || {
          sku: item.product_sku,
          name: item.product_name,
          categoryLabel: catLabel,
          qty: 0,
          revenue: 0,
        };
        perfEntry.qty += item.quantity;
        perfEntry.revenue += item.line_total;
        productPerf.set(item.product_sku, perfEntry);
      });
    });

    const categoryList = Array.from(categoryStats.values()).sort((a, b) => b.revenue - a.revenue);
    const totalCatRev = Math.max(
      categoryList.reduce((s, c) => s + c.revenue, 0),
      1
    );

    const topProducts = Array.from(productPerf.values())
      .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty)
      .slice(0, 8);

    const soldSkus = new Set(Array.from(productPerf.keys()).map((k) => k.toUpperCase()));
    const slowMovingProducts = products.filter((p) => p.inStock && !soldSkus.has(p.sku.toUpperCase()));

    const topRegions = Array.from(regionStats.values())
      .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders)
      .slice(0, 6);

    const paymentList = Array.from(paymentStats.values()).sort((a, b) => b.orders - a.orders);
    const courierList = Array.from(courierStats.values()).sort((a, b) => b.orders - a.orders);

    const lowStockVariantsCount = variants.filter((v) => v.stock_qty <= 3).length;
    const activePromosCount = promos.filter((p) => p.is_active).length;

    return {
      confirmedCount: confirmedInPeriod.length,
      closedCount: closedInPeriod.length,
      netRevenue,
      pendingAmount,
      pendingCount: pendingInPeriod.length,
      aov,
      completionRatePct,
      scopedTotalRevenue,
      totalDiscount,
      totalShipping,
      totalUnitsSold,
      categoryList,
      totalCatRev,
      topProducts,
      slowMovingProducts,
      topRegions,
      paymentList,
      courierList,
      lowStockVariantsCount,
      activePromosCount,
    };
  }, [ordersInPeriod, scopedOrders, products, productBySku, variants, promos]);

  // Daily trend chart buckets (up to 14 visible bars)
  const trendBars = useMemo(() => {
    const dayMap = new Map<string, { label: string; revenue: number; count: number }>();

    if (preset === '7d' || preset === 'today') {
      const daysBack = preset === 'today' ? 1 : 7;
      const now = new Date();
      for (let i = daysBack - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = toDateInputValue(d);
        const label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        dayMap.set(key, { label, revenue: 0, count: 0 });
      }
    }

    scopedOrders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = toDateInputValue(d);
      const label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const existing = dayMap.get(key) || { label, revenue: 0, count: 0 };
      existing.revenue += o.total;
      existing.count += 1;
      dayMap.set(key, existing);
    });

    const sorted = Array.from(dayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([key, v]) => ({ key, ...v }));

    const maxRev = Math.max(...sorted.map((s) => s.revenue), 1);
    return sorted.map((s) => ({
      ...s,
      heightPct: s.revenue > 0 ? Math.max(10, Math.round((s.revenue / maxRev) * 100)) : 4,
    }));
  }, [scopedOrders, preset]);

  const handleExportCsv = () => {
    if (scopedOrders.length === 0) {
      showToast('Tidak ada data transaksi pada periode ini untuk di-export.');
      return;
    }

    const header = [
      'No. Order',
      'Tanggal',
      'Nama Customer',
      'Email',
      'WhatsApp',
      'Provinsi',
      'Kota',
      'Status',
      'Metode Pembayaran',
      'Kurir',
      'Ekspedisi',
      'No. Resi',
      'Subtotal',
      'Diskon',
      'Ongkos Kirim',
      'Total',
    ];

    const rows = scopedOrders.map((o) => [
      o.order_number,
      new Date(o.created_at).toLocaleString('id-ID'),
      o.full_name,
      o.email,
      o.whatsapp,
      o.province,
      o.city,
      getOrderStatusLabel(o.status),
      o.payment_method,
      o.courier,
      o.shipping_expedition || '-',
      o.tracking_number || '-',
      o.subtotal,
      o.discount,
      o.shipping_cost,
      o.total,
    ]);

    const csvLines = [
      header.map(escapeCsvCell).join(','),
      ...rows.map((r) => r.map(escapeCsvCell).join(',')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvLines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `urbanstore-laporan-${toDateInputValue(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Laporan CSV berhasil diunduh!');
  };

  const handleGenerateAiInsight = async () => {
    setAiError(null);
    setGeneratingAi(true);
    const res = await generateAdminBusinessInsight({
      periodLabel: dateRange.label,
      netRevenueFormatted: formatRupiah(analytics.netRevenue),
      confirmedOrdersCount: analytics.confirmedCount,
      aovFormatted: formatRupiah(analytics.aov),
      completionRatePct: analytics.completionRatePct,
      expiredOrCancelledCount: analytics.closedCount,
      pendingAmountFormatted: formatRupiah(analytics.pendingAmount),
      totalUnitsSold: analytics.totalUnitsSold,
      totalDiscountFormatted: formatRupiah(analytics.totalDiscount),
      topCategorySummary: analytics.categoryList
        .filter((c) => c.revenue > 0)
        .slice(0, 3)
        .map((c) => `${c.label}: ${formatRupiah(c.revenue)} (${c.qty} pcs)`)
        .join('; '),
      topRegionSummary: analytics.topRegions
        .slice(0, 3)
        .map((r) => `${r.province}: ${r.orders} order (${formatRupiah(r.revenue)})`)
        .join('; '),
      topProductsSummary: analytics.topProducts
        .slice(0, 3)
        .map((p) => `${p.name} (${p.qty} pcs, ${formatRupiah(p.revenue)})`)
        .join('; '),
      slowMovingCount: analytics.slowMovingProducts.length,
      lowStockVariantsCount: analytics.lowStockVariantsCount,
      subscribersCount: subscribers.length,
    });
    setGeneratingAi(false);

    if (res.error || !res.insight) {
      setAiError(res.error || 'Gagal membuat analisa bisnis AI.');
      return;
    }

    setAiInsight(res.insight);
    setAiSavedCurrent(false);
    showToast('Analisa & strategi bisnis AI siap!');
  };

  const handleSaveCurrentInsight = () => {
    if (!aiInsight || aiSavedCurrent) return;
    const nextList = saveAiInsightToArchive({
      periodLabel: dateRange.label,
      netRevenueFormatted: formatRupiah(analytics.netRevenue),
      confirmedOrdersCount: analytics.confirmedCount,
      aovFormatted: formatRupiah(analytics.aov),
      insightText: aiInsight,
    });
    setSavedInsights(nextList);
    setAiSavedCurrent(true);
    if (nextList[0]) setActiveArchivedId(nextList[0].id);
    showToast('Insight AI berhasil disimpan ke Arsip Laporan!');
  };

  const handleDownloadPdf = () => {
    const scopeLabel =
      scopeMode === 'confirmed'
        ? 'Hanya Transaksi Lunas'
        : scopeMode === 'valid'
        ? 'Lunas + Pending Aktif'
        : 'Semua Status (Termasuk Batal)';

    const downloadedAt = exportSalesReportPdf({
      periodLabel: dateRange.label,
      scopeLabel,
      downloadedBy: profile?.full_name || 'Administrator',
      netRevenue: analytics.netRevenue,
      confirmedCount: analytics.confirmedCount,
      aov: analytics.aov,
      totalUnitsSold: analytics.totalUnitsSold,
      completionRatePct: analytics.completionRatePct,
      closedCount: analytics.closedCount,
      pendingAmount: analytics.pendingAmount,
      pendingCount: analytics.pendingCount,
      totalDiscount: analytics.totalDiscount,
      totalShipping: analytics.totalShipping,
      categoryList: analytics.categoryList,
      totalCatRev: analytics.totalCatRev,
      topRegions: analytics.topRegions,
      paymentList: analytics.paymentList,
      topProducts: analytics.topProducts,
      slowMovingProducts: analytics.slowMovingProducts,
      scopedOrders,
      aiInsightText: aiInsight,
    });
    showToast(`PDF Laporan diunduh (${downloadedAt} WIB).`);
  };

  return (
    <div className="space-y-8">
      {/* Header + Actions */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-border-ecru pb-6">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            STORE ANALYTICS &amp; FINANCIAL REPORT
          </span>
          <h1 className="font-headline-sm text-2xl sm:text-3xl text-primary">
            Laporan Penjualan &amp; Insight Bisnis
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Periode aktif: <strong className="text-primary">{dateRange.label}</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 print:hidden">
          <Button variant="outline" size="sm" onClick={() => void loadReportData()}>
            Refresh Data
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={loading}>
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            Download PDF
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={generatingAi || loading}
            onClick={() => void handleGenerateAiInsight()}
          >
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            {generatingAi ? 'Menganalisa...' : 'Analisa Bisnis AI'}
          </Button>
        </div>
      </div>

      {/* Period & Scope Filters */}
      <section className="bg-surface-card border border-border-ecru rounded-2xl p-5 space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Period Presets */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'today' as const, label: 'Hari Ini' },
              { key: '7d' as const, label: '7 Hari' },
              { key: '30d' as const, label: '30 Hari' },
              { key: 'month' as const, label: 'Bulan Ini' },
              { key: 'all' as const, label: 'Semua Waktu' },
              { key: 'custom' as const, label: 'Custom Tanggal' },
            ].map((item) => {
              const active = preset === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPreset(item.key)}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-label-uppercase uppercase tracking-wider border transition-colors cursor-pointer ${
                    active
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface text-secondary border-border-ecru hover:border-primary hover:text-primary'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="w-full sm:w-64">
            <CustomSelect
              size="sm"
              value={scopeMode}
              onChange={(val) => setScopeMode(val as ScopeMode)}
              options={[
                { value: 'confirmed', label: 'Cakupan: Hanya Transaksi Lunas' },
                { value: 'valid', label: 'Cakupan: Lunas + Pending Aktif' },
                { value: 'all', label: 'Cakupan: Semua Status (Termasuk Batal)' },
              ]}
            />
          </div>
        </div>

        {preset === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-border-ecru">
            <DatePickerField
              label="Tanggal Mulai"
              value={customStart}
              onChange={setCustomStart}
              max={customEnd || undefined}
            />
            <DatePickerField
              label="Tanggal Akhir"
              value={customEnd}
              onChange={setCustomEnd}
              min={customStart || undefined}
            />
          </div>
        )}
      </section>

      {/* AI Executive Business Insight */}
      {aiError && <AlertBanner variant="error">{aiError}</AlertBanner>}

      {aiInsight && (
        <section className="bg-surface-sand/80 border border-secondary/35 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-ecru pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-secondary">
                auto_awesome
              </span>
              <div>
                <h2 className="font-headline-sm text-base text-primary">
                  Insight &amp; Strategi Penjualan AI — {dateRange.label}
                </h2>
                <p className="text-[11px] text-text-muted">
                  Mencakup kondisi toko, hal yang perlu ditingkatkan, dan strategi ke depan.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <Button
                variant={aiSavedCurrent ? 'success' : 'outline'}
                size="sm"
                onClick={handleSaveCurrentInsight}
                disabled={aiSavedCurrent}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {aiSavedCurrent ? 'bookmark_added' : 'bookmark_add'}
                </span>
                {aiSavedCurrent ? 'Tersimpan di Arsip' : 'Simpan Insight'}
              </Button>
              <button
                type="button"
                onClick={() => setAiInsight(null)}
                className="px-2.5 py-1.5 text-xs text-text-muted hover:text-primary cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-primary leading-relaxed whitespace-pre-line">
            {aiInsight}
          </p>
        </section>
      )}

      {/* Saved AI Insights Archive */}
      {savedInsights.length > 0 && (
        <section className="bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-4 print:hidden">
          <div className="flex items-center justify-between border-b border-border-ecru pb-3">
            <div>
              <h2 className="font-headline-sm text-base text-primary">
                Arsip Insight &amp; Strategi AI Tersimpan ({savedInsights.length})
              </h2>
              <p className="text-[11px] text-text-muted">
                Klik item arsip untuk membaca ulang analisa periode sebelumnya atau memuatnya ke laporan PDF.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {savedInsights.map((item) => {
              const isExpanded = activeArchivedId === item.id;
              return (
                <div
                  key={item.id}
                  className="border border-border-ecru rounded-xl bg-surface/60 overflow-hidden"
                >
                  <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveArchivedId(isExpanded ? null : item.id)}
                      className="text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-primary">
                          {item.periodLabel}
                        </span>
                        <StatusBadge
                          label={`${item.netRevenueFormatted} · ${item.confirmedOrdersCount} order`}
                        />
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Disimpan pada {item.createdAtLabel} · AOV {item.aovFormatted}
                      </p>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAiInsight(item.insightText);
                          setAiSavedCurrent(true);
                          showToast('Insight arsip dimuat ke tampilan aktif & siap ikut terunduh di PDF.');
                        }}
                      >
                        Pakai di Laporan
                      </Button>
                      <button
                        type="button"
                        onClick={() => setActiveArchivedId(isExpanded ? null : item.id)}
                        className="p-1.5 rounded-full text-text-muted hover:text-primary hover:bg-surface-sand cursor-pointer"
                        aria-label="Lihat isi insight"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteInsightId(item.id)}
                        className="p-1.5 rounded-full text-text-muted hover:text-error hover:bg-error-container/40 cursor-pointer"
                        aria-label="Hapus arsip insight"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-border-ecru/60 bg-surface-card">
                      <p className="text-xs text-primary leading-relaxed whitespace-pre-line">
                        {item.insightText}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* KPI Financial Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 sm:p-6 bg-surface-card border border-border-ecru rounded-2xl space-y-1.5">
          <span className="font-label-uppercase text-[10px] uppercase tracking-wider text-text-muted block">
            Pendapatan Bersih (Lunas)
          </span>
          <p className="font-headline-sm text-2xl text-primary tabular-nums">
            {loading ? '...' : formatRupiah(analytics.netRevenue)}
          </p>
          <p className="text-[11px] text-text-muted">
            {analytics.confirmedCount} transaksi lunas
            {previousRevenuePct !== null && (
              <span
                className={`ml-2 font-semibold ${
                  previousRevenuePct >= 0 ? 'text-status-stock' : 'text-error'
                }`}
              >
                {previousRevenuePct >= 0 ? `+${previousRevenuePct}%` : `${previousRevenuePct}%`} vs
                periode lalu
              </span>
            )}
          </p>
        </div>

        <div className="p-5 sm:p-6 bg-surface-card border border-border-ecru rounded-2xl space-y-1.5">
          <span className="font-label-uppercase text-[10px] uppercase tracking-wider text-text-muted block">
            Rata-rata Belanja (AOV)
          </span>
          <p className="font-headline-sm text-2xl text-primary tabular-nums">
            {loading ? '...' : formatRupiah(analytics.aov)}
          </p>
          <p className="text-[11px] text-text-muted">
            Total {analytics.totalUnitsSold} pcs item terjual
          </p>
        </div>

        <div className="p-5 sm:p-6 bg-surface-card border border-border-ecru rounded-2xl space-y-1.5">
          <span className="font-label-uppercase text-[10px] uppercase tracking-wider text-text-muted block">
            Tingkat Pembayaran Berhasil
          </span>
          <p className="font-headline-sm text-2xl text-status-stock tabular-nums">
            {loading ? '...' : `${analytics.completionRatePct}%`}
          </p>
          <p className="text-[11px] text-text-muted">
            {analytics.closedCount} order batal/kedaluwarsa
          </p>
        </div>

        <div className="p-5 sm:p-6 bg-surface-card border border-border-ecru rounded-2xl space-y-1.5">
          <span className="font-label-uppercase text-[10px] uppercase tracking-wider text-text-muted block">
            Tertunda &amp; Beban Promo
          </span>
          <p className="font-headline-sm text-2xl text-secondary tabular-nums">
            {loading ? '...' : formatRupiah(analytics.pendingAmount)}
          </p>
          <p className="text-[11px] text-text-muted">
            {analytics.pendingCount} order pending · Diskon {formatRupiah(analytics.totalDiscount)}
          </p>
        </div>
      </section>

      {/* Revenue Trend + Category Contribution */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Trend Chart */}
        <div className="lg:col-span-7 bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border-ecru pb-3">
            <div>
              <h2 className="font-headline-sm text-base text-primary">Tren Pendapatan Harian</h2>
              <p className="text-[11px] text-text-muted">
                Total nilai transaksi sesuai filter periode &amp; cakupan
              </p>
            </div>
            <span className="text-xs font-semibold text-primary">
              {formatRupiah(analytics.scopedTotalRevenue)}
            </span>
          </div>

          {trendBars.length === 0 ? (
            <p className="text-xs text-text-muted py-12 text-center">
              Belum ada transaksi pada periode ini.
            </p>
          ) : (
            <div className="flex items-end gap-2 h-44 pt-4">
              {trendBars.map((bar) => (
                <div
                  key={bar.key}
                  className="flex-1 min-w-0 flex flex-col items-center h-full justify-end gap-1.5 group"
                >
                  <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {bar.count} ord
                  </span>
                  <div className="w-full flex-1 flex items-end bg-surface rounded-xl overflow-hidden">
                    <div
                      title={`${bar.key}: ${formatRupiah(bar.revenue)} (${bar.count} transaksi)`}
                      style={{ height: `${bar.heightPct}%` }}
                      className={`w-full rounded-t-xl transition-all ${
                        bar.revenue > 0 ? 'bg-primary group-hover:bg-secondary' : 'bg-border-ecru/60'
                      }`}
                    />
                  </div>
                  <span className="text-[9px] text-text-muted truncate max-w-full">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="lg:col-span-5 bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border-ecru pb-3">
            <h2 className="font-headline-sm text-base text-primary">Kontribusi per Kategori</h2>
            <span className="text-[11px] text-text-muted">{analytics.totalUnitsSold} pcs</span>
          </div>

          <div className="space-y-3.5">
            {analytics.categoryList.map((cat) => {
              const pct = Math.round((cat.revenue / analytics.totalCatRev) * 100);
              return (
                <div key={cat.label} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium text-primary">
                      {cat.label}{' '}
                      <span className="text-text-muted font-normal">({cat.qty} pcs)</span>
                    </span>
                    <span className="font-semibold text-primary tabular-nums">
                      {formatRupiah(cat.revenue)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(pct, cat.revenue > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Geographic Reach + Payment & Courier */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="font-headline-sm text-base text-primary border-b border-border-ecru pb-3">
            Sebaran Wilayah Pembeli Terbanyak
          </h2>
          {analytics.topRegions.length === 0 ? (
            <p className="text-xs text-text-muted py-4">Belum ada data wilayah.</p>
          ) : (
            <div className="space-y-3 text-xs">
              {analytics.topRegions.map((reg) => {
                const maxOrd = Math.max(...analytics.topRegions.map((r) => r.orders), 1);
                const barPct = Math.round((reg.orders / maxOrd) * 100);
                return (
                  <div key={reg.province} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-primary">{reg.province}</span>
                      <span className="text-text-muted">
                        {reg.orders} transaksi ·{' '}
                        <strong className="text-primary">{formatRupiah(reg.revenue)}</strong>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-6 bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-5">
          <h2 className="font-headline-sm text-base text-primary border-b border-border-ecru pb-3">
            Metode Pembayaran &amp; Layanan Pengiriman
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-2">
              <p className="font-label-uppercase text-[10px] uppercase tracking-wider text-secondary">
                Metode Bayar
              </p>
              {analytics.paymentList.length === 0 ? (
                <p className="text-text-muted">Belum ada transaksi.</p>
              ) : (
                <ul className="divide-y divide-border-ecru/70">
                  {analytics.paymentList.map((pm) => (
                    <li key={pm.method} className="py-2 flex justify-between gap-2">
                      <span className="text-primary">{pm.method}</span>
                      <span className="font-semibold text-primary">{pm.orders}x</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <p className="font-label-uppercase text-[10px] uppercase tracking-wider text-secondary">
                Kurir / Ekspedisi
              </p>
              {analytics.courierList.length === 0 ? (
                <p className="text-text-muted">Belum ada pengiriman.</p>
              ) : (
                <ul className="divide-y divide-border-ecru/70">
                  {analytics.courierList.map((c) => (
                    <li key={c.courier} className="py-2 flex justify-between gap-2">
                      <span className="text-primary truncate">{c.courier}</span>
                      <span className="font-semibold text-primary shrink-0">{c.orders}x</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Product Performance: Top Sellers vs Slow Moving */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-7 bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="font-headline-sm text-base text-primary border-b border-border-ecru pb-3">
            Performa Produk Terlaris
          </h2>
          {analytics.topProducts.length === 0 ? (
            <p className="text-xs text-text-muted py-4">
              Belum ada produk terjual pada periode terpilih.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-ecru text-[10px] font-label-uppercase uppercase text-text-muted">
                    <th className="py-2.5 pr-3">Produk</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-right">Terjual</th>
                    <th className="py-2.5 pl-3 text-right">Omzet Item</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-ecru/70">
                  {analytics.topProducts.map((tp) => (
                    <tr key={tp.sku}>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-primary">{tp.name}</p>
                        <p className="text-[10px] font-mono text-text-muted">{tp.sku}</p>
                      </td>
                      <td className="py-2.5 px-3 text-text-muted">{tp.categoryLabel}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-primary">
                        {tp.qty} pcs
                      </td>
                      <td className="py-2.5 pl-3 text-right font-semibold text-primary tabular-nums">
                        {formatRupiah(tp.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Slow Moving & Inventory Health */}
        <div className="lg:col-span-5 bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border-ecru pb-3">
            <h2 className="font-headline-sm text-base text-primary">
              Produk Belum Terjual ({analytics.slowMovingProducts.length})
            </h2>
            <Link
              to="/admin/promos"
              className="text-[10px] font-label-uppercase uppercase tracking-wider text-secondary hover:text-primary underline print:hidden"
            >
              Buat Promo →
            </Link>
          </div>

          {analytics.slowMovingProducts.length === 0 ? (
            <p className="text-xs text-status-stock py-4">
              Semua produk aktif mencatat penjualan di periode ini!
            </p>
          ) : (
            <div className="divide-y divide-border-ecru/70 text-xs max-h-72 overflow-y-auto pr-1">
              {analytics.slowMovingProducts.slice(0, 10).map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-primary truncate">{p.name}</p>
                    <p className="text-[10px] font-mono text-text-muted">
                      {p.sku} · {p.category}
                    </p>
                  </div>
                  <span className="text-xs text-text-muted shrink-0">{p.priceFormatted}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-border-ecru text-[11px] text-text-muted flex flex-wrap justify-between gap-2">
            <span>Promo aktif: {analytics.activePromosCount} kode</span>
            <span>VIP Subscribers: {subscribers.length}</span>
            <span>Varian stok kritis: {analytics.lowStockVariantsCount}</span>
          </div>
        </div>
      </section>

      {/* Detailed Transactions Table */}
      <section className="bg-surface-card border border-border-ecru rounded-2xl overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-border-ecru flex items-center justify-between">
          <h2 className="font-headline-sm text-base text-primary">
            Rincian Transaksi ({scopedOrders.length})
          </h2>
          <span className="text-[11px] text-text-muted">
            Ongkir Tercatat: {formatRupiah(analytics.totalShipping)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
                <th className="p-3.5">No. Order</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Customer &amp; Wilayah</th>
                <th className="p-3.5">Pembayaran</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Total</th>
                <th className="p-3.5 text-right print:hidden">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ecru">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-muted">
                    Memuat rincian laporan transaksi...
                  </td>
                </tr>
              ) : scopedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-muted">
                    Tidak ada transaksi sesuai filter periode ini.
                  </td>
                </tr>
              ) : (
                scopedOrders.map((ord) => {
                  const badge = getOrderStatusBadge(ord.status);
                  return (
                    <tr key={ord.id}>
                      <td className="p-3.5 font-mono font-semibold text-primary">
                        #{ord.order_number}
                      </td>
                      <td className="p-3.5 text-text-muted whitespace-nowrap">
                        {new Date(ord.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3.5">
                        <p className="font-medium text-primary">{ord.full_name}</p>
                        <p className="text-[10px] text-text-muted">
                          {[ord.city, ord.province].filter(Boolean).join(', ')}
                        </p>
                      </td>
                      <td className="p-3.5 text-text-muted">{ord.payment_method}</td>
                      <td className="p-3.5">
                        <StatusBadge label={badge.label} className={badge.cls} />
                      </td>
                      <td className="p-3.5 text-right font-semibold text-primary tabular-nums">
                        {formatRupiah(ord.total)}
                      </td>
                      <td className="p-3.5 text-right print:hidden">
                        <Link
                          to={`/orders/${encodeURIComponent(ord.order_number)}/invoice`}
                          className="text-[11px] text-secondary hover:text-primary underline"
                        >
                          Lihat
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        isOpen={Boolean(confirmDeleteInsightId)}
        title="Hapus Arsip Insight AI?"
        description="Catatan analisa & strategi bisnis ini akan dihapus permanen dari arsip tersimpan."
        confirmLabel="Ya, Hapus Arsip"
        cancelLabel="Batal"
        onCancel={() => setConfirmDeleteInsightId(null)}
        onConfirm={() => {
          if (confirmDeleteInsightId) {
            setSavedInsights(deleteSavedAiInsight(confirmDeleteInsightId));
            if (activeArchivedId === confirmDeleteInsightId) setActiveArchivedId(null);
            showToast('Arsip insight AI dihapus.');
          }
          setConfirmDeleteInsightId(null);
        }}
      />
    </div>
  );
};
