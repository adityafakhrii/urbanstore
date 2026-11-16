import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import {
  AdminOrderRow,
  fetchAllOrdersAdmin,
  formatRupiah,
  updateOrderAdmin,
} from '../../services/supabaseService';

const ORDER_STATUS_OPTIONS: AdminOrderRow['status'][] = [
  'pending',
  'waiting_verification',
  'paid',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'expired',
];

export const AdminOrdersPage: React.FC = () => {
  const { showToast } = useStore();
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderEdits, setOrderEdits] = useState<
    Record<string, { status: AdminOrderRow['status']; tracking: string }>
  >({});
  const [zoomedProofUrl, setZoomedProofUrl] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const ordData = await fetchAllOrdersAdmin();
    setOrders(ordData);

    const edits: Record<string, { status: AdminOrderRow['status']; tracking: string }> = {};
    ordData.forEach((o) => {
      edits[o.id] = { status: o.status, tracking: o.tracking_number || '' };
    });
    setOrderEdits(edits);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'expired')
    .reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'waiting_verification'
  ).length;
  const paidCount = orders.filter((o) =>
    ['paid', 'packed', 'shipped', 'delivered'].includes(o.status)
  ).length;

  const handleConfirmPayment = async (ord: AdminOrderRow) => {
    const edit = orderEdits[ord.id];
    const res = await updateOrderAdmin(ord.id, {
      status: 'paid',
      paid_at: ord.paid_at || new Date().toISOString(),
      tracking_number: edit?.tracking.trim() || ord.tracking_number || null,
    });
    if (res.error) {
      showToast(`Gagal konfirmasi pembayaran: ${res.error}`);
      return;
    }
    showToast(`Pembayaran #${ord.order_number} dikonfirmasi LUNAS!`);
    await loadOrders();
  };

  const handleSaveOrder = async (orderId: string) => {
    const edit = orderEdits[orderId];
    if (!edit) return;
    const existing = orders.find((o) => o.id === orderId);
    const shouldSetPaidAt =
      ['paid', 'packed', 'shipped', 'delivered'].includes(edit.status) && !existing?.paid_at;
    const res = await updateOrderAdmin(orderId, {
      status: edit.status,
      tracking_number: edit.tracking.trim() || null,
      ...(shouldSetPaidAt ? { paid_at: new Date().toISOString() } : {}),
    });
    if (res.error) {
      showToast(`Gagal update order: ${res.error}`);
      return;
    }
    showToast('Status pesanan & resi berhasil diperbarui!');
    await loadOrders();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-ecru pb-5">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            ADMIN ORDERS &amp; PAYMENT VERIFICATION
          </span>
          <h1 className="font-headline-sm text-2xl text-primary">Manajemen Pesanan</h1>
        </div>
        <button
          type="button"
          onClick={() => void loadOrders()}
          className="px-4 py-2 border border-border-ecru bg-surface-card text-primary font-label-uppercase text-[11px] uppercase tracking-wider hover:border-primary cursor-pointer"
        >
          Refresh Orders
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-surface-card border border-border-ecru">
          <span className="font-label-uppercase text-[10px] uppercase text-text-muted block mb-1">
            Total Pesanan
          </span>
          <span className="font-headline-sm text-2xl text-primary tabular-nums">{orders.length}</span>
        </div>
        <div className="p-4 bg-surface-card border border-border-ecru">
          <span className="font-label-uppercase text-[10px] uppercase text-text-muted block mb-1">
            Perlu Verifikasi
          </span>
          <span className="font-headline-sm text-2xl text-secondary tabular-nums">{pendingCount}</span>
        </div>
        <div className="p-4 bg-surface-card border border-border-ecru">
          <span className="font-label-uppercase text-[10px] uppercase text-text-muted block mb-1">
            Sudah Lunas
          </span>
          <span className="font-headline-sm text-2xl text-status-stock tabular-nums">{paidCount}</span>
        </div>
        <div className="p-4 bg-surface-card border border-border-ecru">
          <span className="font-label-uppercase text-[10px] uppercase text-text-muted block mb-1">
            Omzet Tercatat
          </span>
          <span className="font-headline-sm text-xl text-primary tabular-nums">
            {formatRupiah(totalRevenue)}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-surface-card border border-border-ecru text-xs text-text-muted">
          Memuat daftar pesanan dari Supabase...
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-surface-card border border-border-ecru text-xs text-text-muted">
          Belum ada pesanan masuk.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const edit = orderEdits[ord.id] || {
              status: ord.status,
              tracking: ord.tracking_number || '',
            };
            const canConfirmPaid =
              ord.status === 'pending' || ord.status === 'waiting_verification';

            return (
              <article
                key={ord.id}
                className="bg-surface-card border border-border-ecru p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-ecru/70 pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary">
                        #{ord.order_number}
                      </span>
                      <span className="px-2 py-0.5 bg-surface-sand text-[10px] font-label-uppercase uppercase text-secondary">
                        {ord.status}
                      </span>
                      <span className="text-[11px] text-text-muted">
                        {new Date(ord.created_at).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-xs text-primary mt-1 font-medium">
                      {ord.full_name} · {ord.whatsapp} · {ord.email}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{formatRupiah(ord.total)}</p>
                    <p className="text-[11px] text-text-muted">
                      {ord.payment_method} · {ord.courier.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
                  {/* Shipping & Items */}
                  <div className="lg:col-span-5 space-y-2">
                    <p className="font-label-uppercase text-[10px] uppercase tracking-wider text-text-muted">
                      Alamat Pengiriman
                    </p>
                    <p className="text-primary">
                      {[
                        ord.address,
                        ord.district ? `Kec. ${ord.district}` : '',
                        ord.city,
                        ord.province,
                        ord.postal_code,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {ord.delivery_notes && (
                      <p className="text-secondary">Catatan: {ord.delivery_notes}</p>
                    )}

                    {ord.order_items && ord.order_items.length > 0 && (
                      <div className="pt-2 space-y-1">
                        {ord.order_items.map((item, idx) => (
                          <p key={idx} className="text-text-muted">
                            {item.quantity}x <strong>{item.product_name}</strong> ({item.color},{' '}
                            {item.size}) — {formatRupiah(item.line_total)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Proof */}
                  <div className="lg:col-span-3 space-y-2">
                    <p className="font-label-uppercase text-[10px] uppercase tracking-wider text-text-muted">
                      Bukti Transfer
                    </p>
                    {ord.payment_proof_url ? (
                      <button
                        type="button"
                        onClick={() => setZoomedProofUrl(ord.payment_proof_url!)}
                        className="block border border-border-ecru p-1 hover:border-primary transition-colors cursor-pointer"
                      >
                        <img
                          src={ord.payment_proof_url}
                          alt={`Bukti ${ord.order_number}`}
                          className="w-28 h-20 object-cover"
                        />
                        <span className="text-[10px] text-secondary block mt-1">Klik perbesar</span>
                      </button>
                    ) : (
                      <p className="text-text-muted italic">Belum ada bukti upload</p>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase text-text-muted mb-1">
                          Status Order
                        </label>
                        <select
                          value={edit.status}
                          onChange={(e) =>
                            setOrderEdits((prev) => ({
                              ...prev,
                              [ord.id]: {
                                ...edit,
                                status: e.target.value as AdminOrderRow['status'],
                              },
                            }))
                          }
                          className="w-full h-9 bg-surface border border-border-ecru px-2 text-xs text-primary"
                        >
                          {ORDER_STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-text-muted mb-1">
                          No. Resi
                        </label>
                        <input
                          type="text"
                          value={edit.tracking}
                          onChange={(e) =>
                            setOrderEdits((prev) => ({
                              ...prev,
                              [ord.id]: { ...edit, tracking: e.target.value },
                            }))
                          }
                          placeholder="JNE / SiCepat..."
                          className="w-full h-9 bg-surface border border-border-ecru px-2 text-xs text-primary"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {canConfirmPaid && (
                        <button
                          type="button"
                          onClick={() => void handleConfirmPayment(ord)}
                          className="px-3 py-1.5 bg-status-stock text-white font-label-uppercase text-[10px] uppercase tracking-wider cursor-pointer hover:opacity-90"
                        >
                          ✓ Konfirmasi Lunas
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleSaveOrder(ord.id)}
                        className="px-3 py-1.5 bg-primary text-on-primary font-label-uppercase text-[10px] uppercase tracking-wider cursor-pointer hover:bg-neutral-800"
                      >
                        Simpan Status
                      </button>
                      <Link
                        to={`/orders/${encodeURIComponent(ord.order_number)}/invoice`}
                        className="px-3 py-1.5 border border-border-ecru text-primary font-label-uppercase text-[10px] uppercase tracking-wider hover:bg-surface-muted"
                      >
                        Invoice
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Proof Zoom Modal */}
      {zoomedProofUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomedProofUrl(null)}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-card border border-border-ecru max-w-2xl w-full p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-label-uppercase text-xs uppercase tracking-wider text-primary">
                Preview Bukti Transfer
              </span>
              <button
                type="button"
                onClick={() => setZoomedProofUrl(null)}
                className="text-primary hover:opacity-70 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <img
              src={zoomedProofUrl}
              alt="Zoomed Bukti Transfer"
              className="w-full max-h-[75vh] object-contain bg-surface"
            />
          </div>
        </div>
      )}
    </div>
  );
};
