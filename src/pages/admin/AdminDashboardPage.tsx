import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
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

const CONFIRMED_STATUSES: AdminOrderRow['status'][] = ['paid', 'packed', 'shipped', 'delivered'];

export const AdminDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const { products } = useStore();

  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [variants, setVariants] = useState<ProductVariantRow[]>([]);
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
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
    void loadDashboard();
  }, [loadDashboard]);

  const productById = useMemo(() => {
    const map = new Map<string, (typeof products)[number]>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const metrics = useMemo(() => {
    const confirmedOrders = orders.filter((o) => CONFIRMED_STATUSES.includes(o.status));
    const confirmedRevenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0);
    const waitingVerificationCount = orders.filter(
      (o) => o.status === 'waiting_verification'
    ).length;
    const paidNoTrackingCount = orders.filter(
      (o) => (o.status === 'paid' || o.status === 'packed') && !o.tracking_number
    ).length;
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

    const readyProductsCount = products.filter((p) => p.inStock).length;
    const lowStockVariants = variants
      .filter((v) => v.stock_qty <= 5)
      .sort((a, b) => a.stock_qty - b.stock_qty);
    const criticalStockCount = variants.filter((v) => v.stock_qty <= 3).length;

    const activePromosCount = promos.filter((p) => p.is_active).length;

    return {
      confirmedRevenue,
      confirmedOrdersCount: confirmedOrders.length,
      waitingVerificationCount,
      paidNoTrackingCount,
      actionNeededCount: waitingVerificationCount + paidNoTrackingCount,
      pendingCount,
      deliveredCount,
      readyProductsCount,
      lowStockVariants,
      criticalStockCount,
      activePromosCount,
    };
  }, [orders, variants, promos, products]);

  // 7-day sales trend
  const last7Days = useMemo(() => {
    const days: { key: string; label: string; revenue: number; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { weekday: 'short' });
      days.push({ key, label, revenue: 0, count: 0 });
    }

    orders.forEach((o) => {
      if (o.status === 'cancelled' || o.status === 'expired') return;
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const bucket = days.find((item) => item.key === key);
      if (bucket) {
        bucket.revenue += o.total;
        bucket.count += 1;
      }
    });

    const maxRevenue = Math.max(...days.map((d) => d.revenue), 1);
    return days.map((d) => ({
      ...d,
      heightPct: d.revenue > 0 ? Math.max(12, Math.round((d.revenue / maxRevenue) * 100)) : 4,
    }));
  }, [orders]);

  // Top products & payment methods
  const topProducts = useMemo(() => {
    const qtyByProduct = new Map<string, { name: string; qty: number; revenue: number }>();
    orders.forEach((o) => {
      if (o.status === 'cancelled' || o.status === 'expired') return;
      o.order_items?.forEach((item) => {
        const current = qtyByProduct.get(item.product_sku) || {
          name: item.product_name,
          qty: 0,
          revenue: 0,
        };
        current.qty += item.quantity;
        current.revenue += item.line_total;
        qtyByProduct.set(item.product_sku, current);
      });
    });
    return Array.from(qtyByProduct.entries())
      .map(([sku, val]) => ({ sku, ...val }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 4);
  }, [orders]);

  const paymentBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach((o) => {
      if (o.status === 'cancelled' || o.status === 'expired') return;
      counts.set(o.payment_method, (counts.get(o.payment_method) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const recentOrders = orders.slice(0, 5);
  const lowStockList = metrics.lowStockVariants.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-ecru pb-5">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            ADMIN OVERVIEW · EXECUTIVE SUMMARY
          </span>
          <h1 className="font-headline-sm text-2xl text-primary">
            Selamat Datang, {profile?.full_name || 'Administrator'}
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Ringkasan performa toko, antrean verifikasi, dan status stok UrbanStore hari ini.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard()}
          className="px-4 py-2 border border-border-ecru bg-surface-card text-primary font-label-uppercase text-[11px] uppercase tracking-wider hover:border-primary cursor-pointer self-start sm:self-end"
        >
          Refresh Dashboard
        </button>
      </div>

      {/* Block A: Action Alert Banner (conditional) */}
      {!loading &&
        (metrics.waitingVerificationCount > 0 ||
          metrics.paidNoTrackingCount > 0 ||
          metrics.criticalStockCount > 0) && (
          <section className="bg-surface-sand border border-secondary/40 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-secondary shrink-0 mt-0.5 sm:mt-0">
                notifications_active
              </span>
              <div className="text-xs text-primary space-y-0.5">
                <p className="font-medium">Perhatian Operasional Diperlukan:</p>
                <p className="text-text-muted">
                  {[
                    metrics.waitingVerificationCount > 0
                      ? `${metrics.waitingVerificationCount} pesanan menunggu verifikasi bukti transfer`
                      : null,
                    metrics.paidNoTrackingCount > 0
                      ? `${metrics.paidNoTrackingCount} pesanan lunas belum diinput nomor resi`
                      : null,
                    metrics.criticalStockCount > 0
                      ? `${metrics.criticalStockCount} varian memiliki stok kritis (≤ 3 pcs)`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              {metrics.waitingVerificationCount > 0 && (
                <Link
                  to="/admin/orders?status=waiting_verification"
                  className="px-3.5 py-2 bg-primary text-on-primary font-label-uppercase text-[10px] uppercase tracking-wider hover:bg-neutral-800"
                >
                  Verifikasi Order →
                </Link>
              )}
              {metrics.paidNoTrackingCount > 0 && (
                <Link
                  to="/admin/orders?status=needs_shipping"
                  className="px-3.5 py-2 border border-primary text-primary font-label-uppercase text-[10px] uppercase tracking-wider hover:bg-surface-card"
                >
                  Input Resi →
                </Link>
              )}
              {metrics.criticalStockCount > 0 && (
                <Link
                  to="/admin/products"
                  className="px-3.5 py-2 border border-border-ecru bg-surface-card text-primary font-label-uppercase text-[10px] uppercase tracking-wider hover:border-primary"
                >
                  Cek Stok →
                </Link>
              )}
            </div>
          </section>
        )}

      {/* Block B: 4 Main KPI Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-surface-card border border-border-ecru space-y-1">
          <span className="font-label-uppercase text-[10px] uppercase tracking-wider text-text-muted block">
            Omzet Terkonfirmasi (Lunas)
          </span>
          <p className="font-headline-sm text-2xl text-primary tabular-nums">
            {loading ? '...' : formatRupiah(metrics.confirmedRevenue)}
          </p>
          <p className="text-[11px] text-status-stock">
            {metrics.confirmedOrdersCount} transaksi tervalidasi
          </p>
        </div>

        <Link
          to={
            metrics.waitingVerificationCount > 0
              ? '/admin/orders?status=waiting_verification'
              : '/admin/orders?status=needs_shipping'
          }
          className="p-5 bg-surface-card border border-border-ecru hover:border-primary transition-colors space-y-1 block"
        >
          <span className="font-label-uppercase text-[10px] uppercase tracking-wider text-text-muted block">
            Perlu Tindakan Segera
          </span>
          <p className="font-headline-sm text-2xl text-secondary tabular-nums">
            {loading ? '...' : metrics.actionNeededCount}
          </p>
          <p className="text-[11px] text-text-muted">
            {metrics.waitingVerificationCount} verifikasi · {metrics.paidNoTrackingCount} belum ada resi
          </p>
        </Link>

        <Link
          to="/admin/products"
          className="p-5 bg-surface-card border border-border-ecru hover:border-primary transition-colors space-y-1 block"
        >
          <span className="font-label-uppercase text-[10px] uppercase tracking-wider text-text-muted block">
            Katalog &amp; Stok Varian
          </span>
          <p className="font-headline-sm text-2xl text-primary tabular-nums">
            {products.length} <span className="text-sm font-normal text-text-muted">Produk</span>
          </p>
          <p className="text-[11px] text-text-muted">
            {metrics.readyProductsCount} ready ·{' '}
            <span className={metrics.criticalStockCount > 0 ? 'text-error font-medium' : ''}>
              {metrics.criticalStockCount} varian kritis
            </span>
          </p>
        </Link>

        <div className="p-5 bg-surface-card border border-border-ecru space-y-1">
          <span className="font-label-uppercase text-[10px] uppercase tracking-wider text-text-muted block">
            Promo &amp; VIP List
          </span>
          <p className="font-headline-sm text-2xl text-primary tabular-nums">
            {loading ? '...' : subscribers.length}{' '}
            <span className="text-sm font-normal text-text-muted">Subscribers</span>
          </p>
          <p className="text-[11px] text-text-muted">
            {metrics.activePromosCount} kode promo aktif
          </p>
        </div>
      </section>

      {/* Block C: Sales Trend 7 Days + Quick Actions / Top Products (7/5) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 7-Day Trend & Status Pipeline */}
        <div className="lg:col-span-7 bg-surface-card border border-border-ecru p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border-ecru pb-3">
            <div>
              <h2 className="font-headline-sm text-base text-primary">Aktivitas Order 7 Hari Terakhir</h2>
              <p className="text-[11px] text-text-muted">
                Volume nilai transaksi non-batal per hari
              </p>
            </div>
            <span className="font-label-uppercase text-[10px] uppercase tracking-wider text-secondary">
              {orders.length} Total Order
            </span>
          </div>

          {/* Pure CSS Bar Chart */}
          <div className="grid grid-cols-7 gap-2.5 h-40 items-end pt-4">
            {last7Days.map((day) => (
              <div key={day.key} className="flex flex-col items-center h-full justify-end gap-1.5 group">
                <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {day.count > 0 ? `${day.count} ord` : '0'}
                </span>
                <div className="w-full flex-1 flex items-end bg-surface/60 rounded-sm overflow-hidden">
                  <div
                    title={`${day.key}: ${formatRupiah(day.revenue)} (${day.count} order)`}
                    style={{ height: `${day.heightPct}%` }}
                    className={`w-full transition-all duration-300 ${
                      day.revenue > 0 ? 'bg-primary group-hover:bg-secondary' : 'bg-border-ecru/60'
                    }`}
                  />
                </div>
                <span className="font-label-uppercase text-[10px] uppercase text-text-muted">
                  {day.label}
                </span>
              </div>
            ))}
          </div>

          {/* Order Pipeline Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border-ecru text-xs">
            <div className="bg-surface p-2.5 border border-border-ecru/70">
              <span className="text-[10px] uppercase text-text-muted block">Menunggu Bayar</span>
              <span className="font-semibold text-primary text-sm">{metrics.pendingCount}</span>
            </div>
            <div className="bg-surface p-2.5 border border-border-ecru/70">
              <span className="text-[10px] uppercase text-text-muted block">Verifikasi Bukti</span>
              <span className="font-semibold text-secondary text-sm">
                {metrics.waitingVerificationCount}
              </span>
            </div>
            <div className="bg-surface p-2.5 border border-border-ecru/70">
              <span className="text-[10px] uppercase text-text-muted block">Perlu Kirim / Resi</span>
              <span className="font-semibold text-primary text-sm">
                {metrics.paidNoTrackingCount}
              </span>
            </div>
            <div className="bg-surface p-2.5 border border-border-ecru/70">
              <span className="text-[10px] uppercase text-text-muted block">Selesai (Delivered)</span>
              <span className="font-semibold text-status-stock text-sm">
                {metrics.deliveredCount}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions & Top Products */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-card border border-border-ecru p-5 space-y-3">
            <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary">
              Aksi Cepat Admin
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
              <Link
                to="/admin/products/new"
                className="flex items-center justify-between px-4 py-2.5 bg-primary text-on-primary text-xs font-label-uppercase uppercase tracking-wider hover:bg-neutral-800"
              >
                <span>+ Tambah Produk Baru</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
              <Link
                to="/admin/orders?status=waiting_verification"
                className="flex items-center justify-between px-4 py-2.5 border border-border-ecru bg-surface hover:border-primary text-xs font-label-uppercase uppercase tracking-wider text-primary"
              >
                <span>Antrean Verifikasi Bayar</span>
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              </Link>
              <Link
                to="/admin/promos"
                className="flex items-center justify-between px-4 py-2.5 border border-border-ecru bg-surface hover:border-primary text-xs font-label-uppercase uppercase tracking-wider text-primary"
              >
                <span>Kelola Kode Promo</span>
                <span className="material-symbols-outlined text-[16px]">local_offer</span>
              </Link>
            </div>
          </div>

          <div className="bg-surface-card border border-border-ecru p-5 space-y-3">
            <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary">
              Produk Terlaris &amp; Metode Bayar
            </h2>
            {topProducts.length === 0 ? (
              <p className="text-xs text-text-muted">Belum ada data penjualan item.</p>
            ) : (
              <ul className="divide-y divide-border-ecru/70 text-xs">
                {topProducts.map((tp) => (
                  <li key={tp.sku} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-primary truncate">{tp.name}</p>
                      <p className="text-[10px] font-mono text-text-muted">{tp.sku}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-primary">{tp.qty} pcs</p>
                      <p className="text-[10px] text-text-muted">{formatRupiah(tp.revenue)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {paymentBreakdown.length > 0 && (
              <div className="pt-2 border-t border-border-ecru flex flex-wrap gap-1.5">
                {paymentBreakdown.map(([method, count]) => (
                  <span
                    key={method}
                    className="px-2.5 py-1 bg-surface-sand text-[10px] text-primary border border-border-ecru"
                  >
                    {method}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Block D: 2 Mini Tables "Need Attention" (6/6) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-surface-card border border-border-ecru p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border-ecru pb-3">
            <h2 className="font-headline-sm text-base text-primary">Pesanan Terbaru</h2>
            <Link
              to="/admin/orders"
              className="font-label-uppercase text-[10px] uppercase tracking-wider text-secondary hover:text-primary"
            >
              Lihat Semua →
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-text-muted py-4">Memuat pesanan...</p>
          ) : recentOrders.length === 0 ? (
            <p className="text-xs text-text-muted py-4">Belum ada pesanan masuk.</p>
          ) : (
            <div className="divide-y divide-border-ecru text-xs">
              {recentOrders.map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-primary">
                        #{ord.order_number}
                      </span>
                      <span className="px-2 py-0.5 bg-surface-sand text-[10px] uppercase text-secondary">
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-text-muted truncate mt-0.5">
                      {ord.full_name} · {ord.payment_method}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="font-semibold text-primary">{formatRupiah(ord.total)}</p>
                    <Link
                      to={`/orders/${encodeURIComponent(ord.order_number)}/invoice`}
                      className="text-[10px] uppercase tracking-wider text-secondary hover:text-primary underline block"
                    >
                      Invoice
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Variants Warning */}
        <div className="bg-surface-card border border-border-ecru p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border-ecru pb-3">
            <h2 className="font-headline-sm text-base text-primary">Peringatan Stok Menipis</h2>
            <Link
              to="/admin/products"
              className="font-label-uppercase text-[10px] uppercase tracking-wider text-secondary hover:text-primary"
            >
              Kelola Stok →
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-text-muted py-4">Memuat data varian...</p>
          ) : lowStockList.length === 0 ? (
            <p className="text-xs text-status-stock py-4">
              Semua varian memiliki stok aman (&gt; 5 pcs).
            </p>
          ) : (
            <div className="divide-y divide-border-ecru text-xs">
              {lowStockList.map((v) => {
                const prod = productById.get(v.product_id);
                return (
                  <div key={v.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-primary truncate">
                        {prod?.name || v.product_id}
                      </p>
                      <p className="text-text-muted mt-0.5">
                        {v.color_name} · Size {v.size}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-label-uppercase uppercase ${
                          v.stock_qty === 0
                            ? 'bg-error-container text-error font-semibold'
                            : 'bg-surface-sand text-secondary'
                        }`}
                      >
                        {v.stock_qty === 0 ? 'HABIS' : `Sisa ${v.stock_qty}`}
                      </span>
                      <Link
                        to="/admin/products"
                        className="text-[10px] uppercase tracking-wider text-primary underline"
                      >
                        Restock
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
