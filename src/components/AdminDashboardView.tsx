import React, { useEffect, useState, useCallback } from 'react';
import { Product } from '../data/products';
import { useAuth } from '../context/AuthContext';
import {
  AdminOrderRow,
  ProductVariantRow,
  PromoRow,
  SubscriberRow,
  fetchAllOrdersAdmin,
  fetchVariantsAdmin,
  fetchPromosAdmin,
  fetchSubscribersAdmin,
  updateOrderAdmin,
  updateVariantStockAdmin,
  updateProductPriceStockAdmin,
  togglePromoAdmin,
  formatRupiah,
} from '../services/supabaseService';

interface AdminDashboardViewProps {
  products: Product[];
  onRefreshCatalog: () => Promise<void>;
  onBackToStore: () => void;
  onShowToast: (msg: string) => void;
}

type AdminTab = 'orders' | 'inventory' | 'promos' | 'subscribers';

const ORDER_STATUS_OPTIONS: AdminOrderRow['status'][] = [
  'pending',
  'paid',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  products,
  onRefreshCatalog,
  onBackToStore,
  onShowToast,
}) => {
  const { isAdmin, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [variants, setVariants] = useState<ProductVariantRow[]>([]);
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);

  const [orderEdits, setOrderEdits] = useState<
    Record<string, { status: AdminOrderRow['status']; tracking: string }>
  >({});
  const [variantStockEdits, setVariantStockEdits] = useState<Record<string, number>>({});
  const [productPriceEdits, setProductPriceEdits] = useState<
    Record<string, { price: number; inStock: boolean }>
  >({});

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
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

    const nextOrdEdits: Record<string, { status: AdminOrderRow['status']; tracking: string }> = {};
    ordData.forEach((o) => {
      nextOrdEdits[o.id] = { status: o.status, tracking: o.tracking_number || '' };
    });
    setOrderEdits(nextOrdEdits);

    const nextVarEdits: Record<string, number> = {};
    varData.forEach((v) => {
      nextVarEdits[v.id] = v.stock_qty;
    });
    setVariantStockEdits(nextVarEdits);

    const nextProdEdits: Record<string, { price: number; inStock: boolean }> = {};
    products.forEach((p) => {
      nextProdEdits[p.id] = { price: p.price, inStock: p.inStock };
    });
    setProductPriceEdits(nextProdEdits);

    setLoading(false);
  }, [isAdmin, products]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  if (!isAdmin) {
    return (
      <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin py-20 text-center">
        <div className="max-w-md mx-auto bg-surface-card border border-border-ecru p-8">
          <span className="material-symbols-outlined text-[40px] text-error mb-3">lock</span>
          <h1 className="font-headline-md text-headline-md text-primary mb-2">Akses Khusus Admin</h1>
          <p className="font-body-md text-body-md text-text-muted mb-6">
            Halaman ini hanya bisa diakses oleh akun dengan role <strong>admin</strong>.
          </p>
          <button
            type="button"
            onClick={onBackToStore}
            className="px-6 py-3 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-wider cursor-pointer"
          >
            Kembali ke Store
          </button>
        </div>
      </div>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending' || o.status === 'paid').length;

  const handleSaveOrder = async (orderId: string) => {
    const edit = orderEdits[orderId];
    if (!edit) return;
    const res = await updateOrderAdmin(orderId, {
      status: edit.status,
      tracking_number: edit.tracking.trim() || null,
    });
    if (res.error) {
      onShowToast(`Gagal update order: ${res.error}`);
      return;
    }
    onShowToast('Status pesanan & resi berhasil diperbarui!');
    await loadAdminData();
  };

  const handleSaveProduct = async (productId: string) => {
    const edit = productPriceEdits[productId];
    if (!edit) return;
    const res = await updateProductPriceStockAdmin(productId, {
      price: Number(edit.price) || 0,
      in_stock: edit.inStock,
    });
    if (res.error) {
      onShowToast(`Gagal update produk: ${res.error}`);
      return;
    }
    await onRefreshCatalog();
    onShowToast('Harga & status produk berhasil disimpan ke Supabase!');
  };

  const handleSaveVariantStock = async (variantId: string) => {
    const qty = Math.max(0, Number(variantStockEdits[variantId] ?? 0));
    const res = await updateVariantStockAdmin(variantId, qty);
    if (res.error) {
      onShowToast(`Gagal update stok varian: ${res.error}`);
      return;
    }
    onShowToast('Stok varian berhasil diperbarui!');
    await loadAdminData();
  };

  const handleTogglePromo = async (promo: PromoRow) => {
    const res = await togglePromoAdmin(promo.code, !promo.is_active);
    if (res.error) {
      onShowToast(`Gagal ubah promo: ${res.error}`);
      return;
    }
    onShowToast(`Promo ${promo.code} ${!promo.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`);
    await loadAdminData();
  };

  return (
    <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin py-space-xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border-ecru">
        <div>
          <span className="font-label-uppercase text-label-uppercase uppercase tracking-widest text-secondary block mb-1">
            ADMIN ATELIER · ROLE: ADMIN
          </span>
          <h1 className="font-headline-lg text-headline-lg text-primary">Dashboard Operasional UrbanStore</h1>
          <p className="font-body-sm text-text-muted mt-1">
            Masuk sebagai <strong>{profile?.full_name || profile?.email}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadAdminData()}
            className="px-4 py-2 border border-border-ecru bg-surface-card text-primary font-label-uppercase text-[11px] uppercase tracking-wider hover:border-primary cursor-pointer"
          >
            Refresh Data
          </button>
          <button
            type="button"
            onClick={onBackToStore}
            className="px-5 py-2 bg-primary text-on-primary font-label-uppercase text-[11px] uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
          >
            Lihat Storefront
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-surface-card border border-border-ecru">
          <span className="font-label-uppercase text-[10px] uppercase text-text-muted block mb-1">
            Total Pesanan
          </span>
          <span className="font-headline-md text-headline-md text-primary tabular-nums">{orders.length}</span>
        </div>
        <div className="p-5 bg-surface-card border border-border-ecru">
          <span className="font-label-uppercase text-[10px] uppercase text-text-muted block mb-1">
            Perlu Diproses
          </span>
          <span className="font-headline-md text-headline-md text-secondary tabular-nums">
            {pendingOrdersCount}
          </span>
        </div>
        <div className="p-5 bg-surface-card border border-border-ecru">
          <span className="font-label-uppercase text-[10px] uppercase text-text-muted block mb-1">
            Omzet Tercatat
          </span>
          <span className="font-headline-sm text-headline-sm text-primary tabular-nums">
            {formatRupiah(totalRevenue)}
          </span>
        </div>
        <div className="p-5 bg-surface-card border border-border-ecru">
          <span className="font-label-uppercase text-[10px] uppercase text-text-muted block mb-1">
            VIP Subscribers
          </span>
          <span className="font-headline-md text-headline-md text-primary tabular-nums">
            {subscribers.length}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border-ecru">
        {[
          { id: 'orders' as const, label: `Pesanan (${orders.length})` },
          { id: 'inventory' as const, label: `Produk & Stok (${products.length})` },
          { id: 'promos' as const, label: `Kode Promo (${promos.length})` },
          { id: 'subscribers' as const, label: `VIP Subscribers (${subscribers.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 font-label-uppercase text-[11px] uppercase tracking-wider whitespace-nowrap cursor-pointer ${
              activeTab === t.id
                ? 'bg-primary text-on-primary'
                : 'bg-surface-card border border-border-ecru text-on-surface hover:border-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center bg-surface-card border border-border-ecru text-text-muted text-sm">
          Memuat data operasional dari Supabase...
        </div>
      ) : (
        <>
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="p-12 text-center bg-surface-card border border-border-ecru text-text-muted text-sm">
                  Belum ada pesanan masuk di database Supabase.
                </div>
              ) : (
                orders.map((ord) => {
                  const edit = orderEdits[ord.id] || { status: ord.status, tracking: ord.tracking_number || '' };
                  return (
                    <div
                      key={ord.id}
                      className="p-5 bg-surface-card border border-border-ecru space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-ecru">
                        <div>
                          <span className="font-label-uppercase text-xs font-semibold text-primary">
                            #{ord.order_number}
                          </span>
                          <span className="text-xs text-text-muted ml-3">
                            {new Date(ord.created_at).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <span className="font-price-md text-price-md text-primary tabular-nums">
                          {formatRupiah(ord.total)} · {ord.payment_method}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="font-semibold text-primary">
                            {ord.full_name} ({ord.whatsapp})
                          </div>
                          <div className="text-text-muted">{ord.email}</div>
                          <div className="text-text-muted">
                            {ord.address}, {ord.city} {ord.postal_code} · Kurir: {ord.courier.toUpperCase()}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-semibold text-primary">Item Pesanan:</div>
                          {ord.order_items?.map((item) => (
                            <div key={item.id} className="text-text-muted">
                              • {item.quantity}x {item.product_name} ({item.color}, Size {item.size}) —{' '}
                              {formatRupiah(item.line_total)}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border-ecru flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <select
                          value={edit.status}
                          onChange={(e) =>
                            setOrderEdits((prev) => ({
                              ...prev,
                              [ord.id]: { ...edit, status: e.target.value as AdminOrderRow['status'] },
                            }))
                          }
                          className="h-10 px-3 bg-surface-sand border border-border-ecru text-xs uppercase font-label-uppercase text-primary"
                        >
                          {ORDER_STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={edit.tracking}
                          onChange={(e) =>
                            setOrderEdits((prev) => ({
                              ...prev,
                              [ord.id]: { ...edit, tracking: e.target.value },
                            }))
                          }
                          placeholder="Nomor Resi Kurir (opsional)"
                          className="flex-1 h-10 px-3 bg-surface-card border border-border-ecru text-xs text-primary"
                        />
                        <button
                          type="button"
                          onClick={() => void handleSaveOrder(ord.id)}
                          className="h-10 px-5 bg-primary text-on-primary font-label-uppercase text-[11px] uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
                        >
                          Simpan Order
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-8">
              <div className="bg-surface-card border border-border-ecru overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
                      <th className="p-3">SKU</th>
                      <th className="p-3">Produk</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Harga (IDR)</th>
                      <th className="p-3">Ready Stock</th>
                      <th className="p-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-ecru">
                    {products.map((p) => {
                      const edit = productPriceEdits[p.id] || { price: p.price, inStock: p.inStock };
                      return (
                        <tr key={p.id}>
                          <td className="p-3 font-mono text-text-muted">{p.sku}</td>
                          <td className="p-3 font-medium text-primary">{p.name}</td>
                          <td className="p-3 uppercase text-text-muted">{p.category}</td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={edit.price}
                              onChange={(e) =>
                                setProductPriceEdits((prev) => ({
                                  ...prev,
                                  [p.id]: { ...edit, price: Number(e.target.value) },
                                }))
                              }
                              className="w-28 h-8 px-2 border border-border-ecru bg-surface-card tabular-nums"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={edit.inStock}
                              onChange={(e) =>
                                setProductPriceEdits((prev) => ({
                                  ...prev,
                                  [p.id]: { ...edit, inStock: e.target.checked },
                                }))
                              }
                              className="w-4 h-4 accent-primary"
                            />
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => void handleSaveProduct(p.id)}
                              className="px-3 py-1.5 bg-primary text-on-primary font-label-uppercase text-[10px] uppercase cursor-pointer"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary mb-3">
                  Stok Varian (Warna &amp; Size)
                </h3>
                {variants.length === 0 ? (
                  <div className="p-6 bg-surface-card border border-border-ecru text-xs text-text-muted">
                    Belum ada data varian di Supabase. Jalankan <code>supabase/seed.sql</code> di SQL Editor.
                  </div>
                ) : (
                  <div className="bg-surface-card border border-border-ecru overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
                          <th className="p-3">Product ID</th>
                          <th className="p-3">Warna</th>
                          <th className="p-3">Size</th>
                          <th className="p-3">Stok Qty</th>
                          <th className="p-3">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-ecru">
                        {variants.map((v) => (
                          <tr key={v.id}>
                            <td className="p-3 font-mono text-primary">{v.product_id}</td>
                            <td className="p-3">{v.color_name}</td>
                            <td className="p-3 font-semibold">{v.size}</td>
                            <td className="p-3">
                              <input
                                type="number"
                                min={0}
                                value={variantStockEdits[v.id] ?? v.stock_qty}
                                onChange={(e) =>
                                  setVariantStockEdits((prev) => ({
                                    ...prev,
                                    [v.id]: Number(e.target.value),
                                  }))
                                }
                                className="w-20 h-8 px-2 border border-border-ecru tabular-nums"
                              />
                            </td>
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => void handleSaveVariantStock(v.id)}
                                className="px-3 py-1.5 border border-primary text-primary hover:bg-primary hover:text-on-primary font-label-uppercase text-[10px] uppercase cursor-pointer"
                              >
                                Simpan Stok
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'promos' && (
            <div className="bg-surface-card border border-border-ecru overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
                    <th className="p-3">Kode</th>
                    <th className="p-3">Deskripsi</th>
                    <th className="p-3">Diskon</th>
                    <th className="p-3">Min. Belanja</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-ecru">
                  {promos.map((pr) => (
                    <tr key={pr.code}>
                      <td className="p-3 font-mono font-semibold text-primary">{pr.code}</td>
                      <td className="p-3 text-text-muted">{pr.description}</td>
                      <td className="p-3 tabular-nums">{formatRupiah(pr.discount_amount)}</td>
                      <td className="p-3 tabular-nums">{formatRupiah(pr.min_subtotal)}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-label-uppercase uppercase ${
                            pr.is_active ? 'bg-surface-sand text-status-stock' : 'bg-surface-container text-text-muted'
                          }`}
                        >
                          {pr.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => void handleTogglePromo(pr)}
                          className="px-3 py-1.5 border border-primary text-primary hover:bg-primary hover:text-on-primary font-label-uppercase text-[10px] uppercase cursor-pointer"
                        >
                          {pr.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'subscribers' && (
            <div className="bg-surface-card border border-border-ecru overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
                    <th className="p-3">Email</th>
                    <th className="p-3">Sumber</th>
                    <th className="p-3">Tanggal Daftar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-ecru">
                  {subscribers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-text-muted">
                        Belum ada subscriber terdaftar.
                      </td>
                    </tr>
                  ) : (
                    subscribers.map((sub) => (
                      <tr key={sub.id}>
                        <td className="p-3 font-medium text-primary">{sub.email}</td>
                        <td className="p-3 uppercase text-text-muted">{sub.source}</td>
                        <td className="p-3 text-text-muted">
                          {new Date(sub.subscribed_at).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};
