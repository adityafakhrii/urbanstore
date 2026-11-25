import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { supabase } from '../../lib/supabase';
import {
  AdminOrderRow,
  fetchAllOrdersAdmin,
  formatRupiah,
  updateOrderAdmin,
} from '../../services/supabaseService';
import {
  checkMayarPaymentStatus,
  syncAllPendingMayarOrders,
} from '../../services/mayarService';
import {
  EXPEDITION_OPTIONS,
  ORDER_STATUS_OPTIONS_ID,
  formatCourierLabel,
  formatPaymentMethodLabel,
  getOrderStatusBadge,
} from '../../utils/payment';
import {
  AlertBanner,
  Button,
  CustomSelect,
  InputField,
  StatusBadge,
  getButtonClassName,
} from '../../components/ui';

type OrderFilterKey =
  | 'all'
  | 'pending'
  | 'needs_shipping'
  | 'completed'
  | 'waiting_verification'
  | 'closed';

const ORDER_FILTER_TABS: { key: OrderFilterKey; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu Mayar' },
  { key: 'needs_shipping', label: 'Lunas · Belum Resi' },
  { key: 'completed', label: 'Lunas & Selesai' },
  { key: 'waiting_verification', label: 'Legacy Verifikasi' },
  { key: 'closed', label: 'Dibatalkan / Kedaluwarsa' },
];

interface OrderEditState {
  status: AdminOrderRow['status'];
  expeditionSelect: string;
  customExpedition: string;
  tracking: string;
}

function parseExpeditionState(raw?: string | null): {
  expeditionSelect: string;
  customExpedition: string;
} {
  const cleaned = (raw || '').trim();
  if (!cleaned) return { expeditionSelect: '', customExpedition: '' };
  if (EXPEDITION_OPTIONS.includes(cleaned)) {
    return { expeditionSelect: cleaned, customExpedition: '' };
  }
  return { expeditionSelect: 'Lainnya', customExpedition: cleaned };
}

export const AdminOrdersPage: React.FC = () => {
  const { showToast, loadCatalog } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawFilter = (searchParams.get('status') || 'all') as OrderFilterKey;
  const activeFilter: OrderFilterKey = ORDER_FILTER_TABS.some((t) => t.key === rawFilter)
    ? rawFilter
    : 'all';

  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [orderEdits, setOrderEdits] = useState<Record<string, OrderEditState>>({});
  const [orderErrors, setOrderErrors] = useState<Record<string, string>>({});
  const [zoomedProofUrl, setZoomedProofUrl] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const ordData = await fetchAllOrdersAdmin();
    setOrders(ordData);

    const edits: Record<string, OrderEditState> = {};
    ordData.forEach((o) => {
      const exp = parseExpeditionState(o.shipping_expedition);
      edits[o.id] = {
        status: o.status,
        expeditionSelect: exp.expeditionSelect,
        customExpedition: exp.customExpedition,
        tracking: o.tracking_number || '',
      };
    });
    setOrderEdits(edits);
    setOrderErrors({});
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const totalRevenue = orders
    .filter((o) => ['paid', 'packed', 'shipped', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'waiting_verification'
  ).length;
  const mayarVerifiedCount = orders.filter(
    (o) =>
      Boolean(o.mayar_verified_at) ||
      o.mayar_payment_status === 'paid' ||
      ['paid', 'packed', 'shipped', 'delivered'].includes(o.status)
  ).length;

  const filterCounts = useMemo(
    () => ({
      all: orders.length,
      waiting_verification: orders.filter((o) => o.status === 'waiting_verification').length,
      needs_shipping: orders.filter(
        (o) => (o.status === 'paid' || o.status === 'packed') && !o.tracking_number
      ).length,
      pending: orders.filter((o) => o.status === 'pending').length,
      completed: orders.filter((o) =>
        ['paid', 'packed', 'shipped', 'delivered'].includes(o.status)
      ).length,
      closed: orders.filter((o) => o.status === 'cancelled' || o.status === 'expired').length,
    }),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    switch (activeFilter) {
      case 'waiting_verification':
        return orders.filter((o) => o.status === 'waiting_verification');
      case 'needs_shipping':
        return orders.filter(
          (o) => (o.status === 'paid' || o.status === 'packed') && !o.tracking_number
        );
      case 'pending':
        return orders.filter((o) => o.status === 'pending');
      case 'completed':
        return orders.filter((o) =>
          ['paid', 'packed', 'shipped', 'delivered'].includes(o.status)
        );
      case 'closed':
        return orders.filter((o) => o.status === 'cancelled' || o.status === 'expired');
      default:
        return orders;
    }
  }, [orders, activeFilter]);

  const handleSelectFilter = (key: OrderFilterKey) => {
    if (key === 'all') {
      searchParams.delete('status');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ status: key }, { replace: true });
    }
  };

  const resolveExpeditionName = (edit: OrderEditState): string => {
    if (edit.expeditionSelect === 'Lainnya') {
      return edit.customExpedition.trim();
    }
    return edit.expeditionSelect.trim();
  };

  const handleSyncSingleMayar = async (ord: AdminOrderRow) => {
    if (syncingOrderId) return;
    setSyncingOrderId(ord.id);
    setOrderErrors((prev) => {
      const next = { ...prev };
      delete next[ord.id];
      return next;
    });

    const res = await checkMayarPaymentStatus({
      orderId: ord.id,
      orderNumber: ord.order_number,
    });
    setSyncingOrderId(null);

    if (!res.ok) {
      const msg = res.error || 'Gagal menyinkronkan status Mayar.id.';
      setOrderErrors((prev) => ({ ...prev, [ord.id]: msg }));
      showToast(msg);
      return;
    }

    if (res.updated && res.status === 'paid') {
      showToast(`Order #${ord.order_number} terverifikasi LUNAS oleh Mayar.id!`);
      void loadCatalog();
    } else if (res.updated && res.status === 'expired') {
      showToast(`Order #${ord.order_number} kedaluwarsa. Stok dikembalikan otomatis.`);
      void loadCatalog();
    } else if (res.status === 'paid') {
      showToast(`Order #${ord.order_number} sudah berstatus LUNAS.`);
    } else {
      showToast(`Order #${ord.order_number} masih menunggu pembayaran di Mayar.id.`);
    }

    await loadOrders();
  };

  const handleSyncAllPendingMayar = async () => {
    if (syncingAll || !supabase) return;
    setSyncingAll(true);
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    if (!accessToken) {
      setSyncingAll(false);
      showToast('Sesi login admin tidak ditemukan. Silakan masuk ulang.');
      return;
    }

    const res = await syncAllPendingMayarOrders(accessToken);
    setSyncingAll(false);

    if (!res.ok) {
      showToast(res.error || 'Gagal menyinkronkan pesanan pending dari Mayar.id.');
      return;
    }

    showToast(
      `Sinkronisasi Mayar selesai: ${res.checkedCount ?? 0} dicek, ${res.paidUpdatedCount ?? 0} Lunas, ${res.expiredUpdatedCount ?? 0} Kedaluwarsa.`
    );
    if ((res.paidUpdatedCount ?? 0) > 0 || (res.expiredUpdatedCount ?? 0) > 0) {
      void loadCatalog();
    }
    await loadOrders();
  };

  const handleSaveOrder = async (orderId: string) => {
    const edit = orderEdits[orderId];
    if (!edit) return;

    const expeditionName = resolveExpeditionName(edit);
    const trackingNumber = edit.tracking.trim();

    if (edit.status === 'shipped' && (!expeditionName || !trackingNumber)) {
      const msg =
        'Untuk mengubah status menjadi Dikirim, wajib mengisi Nama Ekspedisi dan Nomor Resi.';
      setOrderErrors((prev) => ({ ...prev, [orderId]: msg }));
      showToast(msg);
      return;
    }

    setOrderErrors((prev) => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });

    const existing = orders.find((o) => o.id === orderId);
    const shouldSetPaidAt =
      ['paid', 'packed', 'shipped', 'delivered'].includes(edit.status) && !existing?.paid_at;

    const res = await updateOrderAdmin(orderId, {
      status: edit.status,
      shipping_expedition: expeditionName || null,
      tracking_number: trackingNumber || null,
      ...(shouldSetPaidAt ? { paid_at: new Date().toISOString() } : {}),
    });

    if (res.error) {
      setOrderErrors((prev) => ({ ...prev, [orderId]: res.error! }));
      showToast(`Gagal memperbarui pesanan: ${res.error}`);
      return;
    }

    if (
      (edit.status === 'cancelled' || edit.status === 'expired') &&
      existing?.status !== edit.status
    ) {
      void loadCatalog();
    }

    showToast('Status pesanan & info pengiriman berhasil diperbarui!');
    await loadOrders();
  };

  const statusSelectOptions = ORDER_STATUS_OPTIONS_ID.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  const expeditionSelectOptions = EXPEDITION_OPTIONS.map((name) => ({
    value: name,
    label: name,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-ecru pb-6">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            VERIFIKASI OTOMATIS MAYAR.ID &amp; PENGIRIMAN
          </span>
          <h1 className="font-headline-sm text-2xl sm:text-3xl text-primary">Manajemen Pesanan</h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="primary"
            size="sm"
            disabled={syncingAll}
            onClick={() => void handleSyncAllPendingMayar()}
          >
            <span className="material-symbols-outlined text-[15px]">sync</span>
            {syncingAll ? 'Menyinkronkan Mayar...' : 'Sync Status Mayar'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void loadOrders()}>
            Refresh Orders
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 bg-surface-card border border-border-ecru rounded-2xl">
          <span className="font-label-uppercase text-[10px] uppercase text-text-muted block mb-1">
            Total Pesanan
          </span>
          <span className="font-headline-sm text-2xl text-primary tabular-nums">{orders.length}</span>
        </div>
        <div className="p-5 bg-surface-card border border-border-ecru rounded-2xl">
          <span className="font-label-uppercase text-[10px] uppercase text-text-muted block mb-1">
            Menunggu Bayar
          </span>
          <span className="font-headline-sm text-2xl text-secondary tabular-nums">{pendingCount}</span>
        </div>
        <div className="p-5 bg-surface-card border border-border-ecru rounded-2xl">
          <span className="font-label-uppercase text-[10px] uppercase text-text-muted block mb-1">
            Terverifikasi Lunas
          </span>
          <span className="font-headline-sm text-2xl text-status-stock tabular-nums">
            {mayarVerifiedCount}
          </span>
        </div>
        <div className="p-5 bg-surface-card border border-border-ecru rounded-2xl">
          <span className="font-label-uppercase text-[10px] uppercase text-text-muted block mb-1">
            Omzet Lunas
          </span>
          <span className="font-headline-sm text-xl text-primary tabular-nums">
            {formatRupiah(totalRevenue)}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-ecru pb-4">
        {ORDER_FILTER_TABS.map((tab) => {
          const isSelected = activeFilter === tab.key;
          const count = filterCounts[tab.key];
          if (tab.key === 'waiting_verification' && count === 0 && !isSelected) return null;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleSelectFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-label-uppercase uppercase tracking-wider border transition-colors cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-card text-secondary border-border-ecru hover:border-primary hover:text-primary'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-surface-sand text-primary'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-12 text-center bg-surface-card border border-border-ecru rounded-2xl text-xs text-text-muted">
          Memuat daftar pesanan dari Supabase...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-surface-card border border-border-ecru rounded-2xl text-xs text-text-muted space-y-2">
          <p>
            {orders.length === 0
              ? 'Belum ada pesanan masuk.'
              : 'Tidak ada pesanan pada filter ini.'}
          </p>
          {activeFilter !== 'all' && orders.length > 0 && (
            <button
              type="button"
              onClick={() => handleSelectFilter('all')}
              className="underline text-primary cursor-pointer"
            >
              Tampilkan semua pesanan
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((ord) => {
            const edit: OrderEditState = orderEdits[ord.id] || {
              status: ord.status,
              expeditionSelect: parseExpeditionState(ord.shipping_expedition).expeditionSelect,
              customExpedition: parseExpeditionState(ord.shipping_expedition).customExpedition,
              tracking: ord.tracking_number || '',
            };
            const badge = getOrderStatusBadge(ord.status);
            const isShippedSelected = edit.status === 'shipped';
            const cardError = orderErrors[ord.id];
            const isPaidOrFulfilled = ['paid', 'packed', 'shipped', 'delivered'].includes(
              ord.status
            );
            const isMayarVerified =
              Boolean(ord.mayar_verified_at) ||
              ord.mayar_payment_status === 'paid' ||
              (isPaidOrFulfilled && Boolean(ord.mayar_invoice_id || ord.mayar_transaction_id));
            const canCheckMayar =
              ord.status === 'pending' || ord.status === 'waiting_verification';

            return (
              <article
                key={ord.id}
                className="bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-ecru/70 pb-3.5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-primary">
                        #{ord.order_number}
                      </span>
                      <StatusBadge label={badge.label} className={badge.cls} />
                      {isMayarVerified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAF4ED] border border-status-stock/30 text-[#1F442C] text-[10px] font-medium">
                          <span className="material-symbols-outlined text-[13px] text-status-stock">
                            verified
                          </span>
                          Auto-Verified Mayar.id
                        </span>
                      )}
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
                      {formatPaymentMethodLabel(ord.payment_method, ord.mayar_payment_method)} ·{' '}
                      {formatCourierLabel(ord.courier)}
                    </p>
                  </div>
                </div>

                {cardError && <AlertBanner variant="error">{cardError}</AlertBanner>}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                  {/* Shipping & Items */}
                  <div className="lg:col-span-4 space-y-2">
                    <p className="font-label-uppercase text-[10px] uppercase tracking-wider text-text-muted">
                      Alamat Pengiriman
                    </p>
                    <p className="text-primary leading-relaxed">
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
                      <div className="pt-2 space-y-1 border-t border-border-ecru/50">
                        {ord.order_items.map((item, idx) => (
                          <p key={idx} className="text-text-muted">
                            {item.quantity}x <strong>{item.product_name}</strong> ({item.color},{' '}
                            {item.size}) — {formatRupiah(item.line_total)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mayar Payment Gateway Verification Details */}
                  <div className="lg:col-span-3 space-y-2.5">
                    <p className="font-label-uppercase text-[10px] uppercase tracking-wider text-text-muted">
                      Verifikasi Gateway Mayar.id
                    </p>

                    <div className="bg-surface border border-border-ecru rounded-xl p-3 space-y-1.5">
                      {isMayarVerified ? (
                        <p className="text-status-stock font-semibold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">
                            check_circle
                          </span>
                          Lunas Terverifikasi Mayar
                        </p>
                      ) : ord.status === 'expired' || ord.status === 'cancelled' ? (
                        <p className="text-error font-medium flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">cancel</span>
                          {ord.status === 'expired' ? 'Kedaluwarsa' : 'Dibatalkan'}
                        </p>
                      ) : (
                        <p className="text-secondary font-medium flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          Menunggu Pembayaran Mayar
                        </p>
                      )}

                      {ord.mayar_invoice_id && (
                        <p className="text-[11px] text-text-muted break-all">
                          Inv: <span className="font-mono text-primary">{ord.mayar_invoice_id}</span>
                        </p>
                      )}
                      {ord.mayar_transaction_id && (
                        <p className="text-[11px] text-text-muted break-all">
                          TX:{' '}
                          <span className="font-mono text-primary">{ord.mayar_transaction_id}</span>
                        </p>
                      )}
                      {ord.mayar_payment_method && (
                        <p className="text-[11px] text-text-muted">
                          Channel: <strong className="text-primary">{ord.mayar_payment_method}</strong>
                        </p>
                      )}
                      {(ord.mayar_verified_at || ord.paid_at) && (
                        <p className="text-[11px] text-text-muted">
                          Verifikasi:{' '}
                          {new Date(ord.mayar_verified_at || ord.paid_at!).toLocaleString('id-ID')}
                        </p>
                      )}
                      <p className="text-[10px] pt-1 border-t border-border-ecru/60 text-text-muted">
                        Stok:{' '}
                        <strong
                          className={
                            ord.stock_deducted === false ? 'text-secondary' : 'text-status-stock'
                          }
                        >
                          {ord.stock_deducted === false ? 'Dikembalikan ke Katalog' : 'Terpotong'}
                        </strong>
                      </p>

                      {ord.mayar_payment_link && !isPaidOrFulfilled && (
                        <a
                          href={ord.mayar_payment_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-[11px] text-primary underline pt-1"
                        >
                          Buka Link Invoice Mayar ↗
                        </a>
                      )}
                    </div>

                    {ord.payment_proof_url && (
                      <button
                        type="button"
                        onClick={() => setZoomedProofUrl(ord.payment_proof_url!)}
                        className="text-[11px] text-secondary underline cursor-pointer"
                      >
                        Lihat bukti transfer legacy
                      </button>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <CustomSelect
                        label="Status Pesanan"
                        size="sm"
                        value={edit.status}
                        onChange={(val) => {
                          setOrderErrors((prev) => {
                            const next = { ...prev };
                            delete next[ord.id];
                            return next;
                          });
                          setOrderEdits((prev) => ({
                            ...prev,
                            [ord.id]: {
                              ...edit,
                              status: val as AdminOrderRow['status'],
                            },
                          }));
                        }}
                        options={statusSelectOptions}
                      />

                      <CustomSelect
                        label="Nama Ekspedisi"
                        required={isShippedSelected}
                        size="sm"
                        value={edit.expeditionSelect}
                        onChange={(val) =>
                          setOrderEdits((prev) => ({
                            ...prev,
                            [ord.id]: { ...edit, expeditionSelect: val },
                          }))
                        }
                        options={expeditionSelectOptions}
                        placeholder="Pilih Ekspedisi..."
                      />
                    </div>

                    {edit.expeditionSelect === 'Lainnya' && (
                      <InputField
                        label="Nama Ekspedisi Lainnya"
                        required={isShippedSelected}
                        type="text"
                        value={edit.customExpedition}
                        onChange={(e) =>
                          setOrderEdits((prev) => ({
                            ...prev,
                            [ord.id]: { ...edit, customExpedition: e.target.value },
                          }))
                        }
                        placeholder="Contoh: Wahana / TIKI / Lalamove"
                      />
                    )}

                    <InputField
                      label="No. Resi Pengiriman"
                      required={isShippedSelected}
                      type="text"
                      value={edit.tracking}
                      onChange={(e) =>
                        setOrderEdits((prev) => ({
                          ...prev,
                          [ord.id]: { ...edit, tracking: e.target.value },
                        }))
                      }
                      placeholder={
                        isShippedSelected
                          ? 'Wajib isi nomor resi pengiriman...'
                          : 'Isi saat pesanan dikirim'
                      }
                      hint={
                        isShippedSelected
                          ? 'Status Dikirim mewajibkan Nama Ekspedisi & No. Resi terisi.'
                          : undefined
                      }
                    />

                    <div className="flex flex-wrap gap-2 pt-1">
                      {canCheckMayar && (
                        <Button
                          variant="success"
                          size="sm"
                          disabled={syncingOrderId === ord.id}
                          onClick={() => void handleSyncSingleMayar(ord)}
                        >
                          <span className="material-symbols-outlined text-[15px]">sync</span>
                          {syncingOrderId === ord.id
                            ? 'Memeriksa Mayar...'
                            : 'Verifikasi via Mayar'}
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => void handleSaveOrder(ord.id)}
                      >
                        Simpan Status
                      </Button>
                      <Link
                        to={`/orders/${encodeURIComponent(ord.order_number)}/invoice`}
                        className={getButtonClassName({ variant: 'outline', size: 'sm' })}
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

      {/* Legacy Proof Zoom Modal */}
      {zoomedProofUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomedProofUrl(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-card border border-border-ecru rounded-2xl max-w-2xl w-full p-5 space-y-3 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="font-label-uppercase text-xs uppercase tracking-wider text-primary">
                Preview Bukti Transfer Legacy
              </span>
              <button
                type="button"
                onClick={() => setZoomedProofUrl(null)}
                className="p-1 rounded-full text-primary hover:bg-surface-sand cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <img
              src={zoomedProofUrl}
              alt="Zoomed Bukti Transfer"
              className="w-full max-h-[75vh] object-contain rounded-xl bg-surface"
            />
          </div>
        </div>
      )}
    </div>
  );
};
