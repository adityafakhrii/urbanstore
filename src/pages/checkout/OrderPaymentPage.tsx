import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import {
  OrderRecord,
  fetchOrderByNumberFromDb,
  formatRupiah,
} from '../../services/supabaseService';
import {
  checkMayarPaymentStatus,
  createMayarPaymentForOrder,
} from '../../services/mayarService';
import {
  MAYAR_SUPPORTED_CHANNELS,
  formatCountdown,
  formatPaymentMethodLabel,
  getOrderStatusBadge,
  getRemainingSeconds,
  isOrderPaymentExpired,
} from '../../utils/payment';
import { AlertBanner, Button, StatusBadge, getButtonClassName } from '../../components/ui';

export const OrderPaymentPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { orders, useSupabaseDb, updateOrder, loadCatalog, showToast } = useStore();

  const localMatch = orders.find((o) => o.id === orderNumber);
  const [fetchedOrder, setFetchedOrder] = useState<OrderRecord | null>(null);
  const [loadingOrder, setLoadingOrder] = useState<boolean>(!localMatch);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [creatingLink, setCreatingLink] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);
  const [gatewayError, setGatewayError] = useState<string | null>(() => {
    const state = location.state as { mayarInitError?: string } | null;
    return state?.mayarInitError || null;
  });

  const order = fetchedOrder || localMatch || null;

  const refreshOrderFromDb = useCallback(async () => {
    if (!orderNumber || !useSupabaseDb) return null;
    const fresh = await fetchOrderByNumberFromDb(orderNumber);
    if (fresh) {
      setFetchedOrder(fresh);
      updateOrder(fresh);
    }
    return fresh;
  }, [orderNumber, useSupabaseDb, updateOrder]);

  useEffect(() => {
    if (!orderNumber || !useSupabaseDb) {
      setLoadingOrder(false);
      return;
    }
    let mounted = true;
    if (!localMatch) setLoadingOrder(true);
    void fetchOrderByNumberFromDb(orderNumber).then((res) => {
      if (!mounted) return;
      if (res) {
        setFetchedOrder(res);
        updateOrder(res);
      }
      setLoadingOrder(false);
    });
    return () => {
      mounted = false;
    };
  }, [orderNumber, useSupabaseDb, localMatch, updateOrder]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleCheckPaymentStatus = useCallback(
    async (silent = false) => {
      if (!orderNumber || !useSupabaseDb || checkingStatus) return;
      setCheckingStatus(true);
      if (!silent) setGatewayError(null);

      const res = await checkMayarPaymentStatus({
        orderId: order?.dbId,
        orderNumber,
      });
      setCheckingStatus(false);

      if (!res.ok) {
        if (!silent) {
          setGatewayError(res.error || 'Gagal mengecek status pembayaran dari Mayar.id.');
        }
        return;
      }

      if (res.status && order) {
        const merged: OrderRecord = {
          ...order,
          status: res.status,
          mayarPaymentStatus: res.mayarPaymentStatus || order.mayarPaymentStatus,
          mayarPaymentMethod: res.mayarPaymentMethod || order.mayarPaymentMethod,
          mayarTransactionId: res.mayarTransactionId || order.mayarTransactionId,
          mayarInvoiceId: res.mayarInvoiceId || order.mayarInvoiceId,
          mayarVerifiedAt: res.mayarVerifiedAt || order.mayarVerifiedAt,
          paidAt: res.paidAt || order.paidAt,
        };
        setFetchedOrder(merged);
        updateOrder(merged);
      } else {
        await refreshOrderFromDb();
      }

      if (res.updated && res.status === 'paid') {
        void loadCatalog();
        showToast('Pembayaran LUNAS & terverifikasi otomatis oleh Mayar.id!');
      } else if (res.updated && res.status === 'expired') {
        void loadCatalog();
        showToast('Pembayaran kedaluwarsa. Stok produk telah dikembalikan otomatis.');
      } else if (!silent) {
        if (res.status === 'paid') {
          showToast('Pembayaran sudah terkonfirmasi LUNAS oleh Mayar.id.');
        } else {
          showToast('Status saat ini masih menunggu pembayaran di Mayar.id.');
        }
      }
    },
    [orderNumber, useSupabaseDb, checkingStatus, order, updateOrder, refreshOrderFromDb, loadCatalog, showToast]
  );

  // Immediately verify with Mayar API when customer returns from Mayar checkout (?mayar_return=1)
  useEffect(() => {
    const isMayarReturn = searchParams.get('mayar_return') === '1';
    if (!isMayarReturn || !orderNumber || !useSupabaseDb || loadingOrder) return;

    void handleCheckPaymentStatus(false).finally(() => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('mayar_return');
      setSearchParams(nextParams, { replace: true });
    });
  }, [searchParams, setSearchParams, orderNumber, useSupabaseDb, loadingOrder, handleCheckPaymentStatus]);

  // Lightweight background polling while waiting for Mayar webhook / payment completion
  useEffect(() => {
    if (!order || !useSupabaseDb) return;
    if (order.status !== 'pending') return;
    if (isOrderPaymentExpired(order)) return;

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void handleCheckPaymentStatus(true);
      }
    }, 8000);

    return () => window.clearInterval(interval);
  }, [order, useSupabaseDb, handleCheckPaymentStatus]);

  const handleGenerateMayarLink = async (forceRecreate = false) => {
    if (!order || creatingLink) return;
    setGatewayError(null);
    setCreatingLink(true);

    const res = await createMayarPaymentForOrder({
      orderId: order.dbId,
      orderNumber: order.id,
      forceRecreate,
    });
    setCreatingLink(false);

    if (!res.ok) {
      setGatewayError(res.error || 'Gagal membuat link pembayaran Mayar.id.');
      if (res.expired) {
        await refreshOrderFromDb();
        void loadCatalog();
      }
      return;
    }

    const updated: OrderRecord = {
      ...order,
      status: res.status || order.status,
      paymentGateway: 'mayar',
      mayarInvoiceId: res.invoiceId || order.mayarInvoiceId,
      mayarTransactionId: res.transactionId || order.mayarTransactionId,
      mayarPaymentLink: res.paymentLink || order.mayarPaymentLink,
      paymentExpiresAt: res.expiredAt || order.paymentExpiresAt,
      paidAt: res.paidAt || order.paidAt,
      mayarVerifiedAt: res.mayarVerifiedAt || order.mayarVerifiedAt,
    };
    setFetchedOrder(updated);
    updateOrder(updated);

    if (res.alreadyPaid) {
      showToast('Pesanan ini sudah LUNAS dan terverifikasi!');
      return;
    }

    showToast('Link pembayaran Mayar.id berhasil disiapkan!');
  };

  if (loadingOrder) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary">
            Memuat detail pembayaran Mayar.id...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-5 py-14 text-center">
        <div className="border border-border-ecru rounded-2xl bg-surface-card p-10 space-y-4">
          <h1 className="font-headline-sm text-2xl text-primary">Pesanan Tidak Ditemukan</h1>
          <p className="font-body-sm text-text-muted">
            Nomor order <span className="font-mono">{orderNumber}</span> tidak ditemukan atau tidak
            berada pada sesi akun ini.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/account/orders"
              className={getButtonClassName({ variant: 'primary', size: 'sm' })}
            >
              Riwayat Pesanan
            </Link>
            <Link to="/" className={getButtonClassName({ variant: 'outline', size: 'sm' })}>
              Ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  void nowTick;
  const expired = isOrderPaymentExpired(order);
  const remainingSec = order.status === 'pending' ? getRemainingSeconds(order.paymentExpiresAt) : 0;
  const badge = getOrderStatusBadge(order.status, expired);
  const isPaid = ['paid', 'packed', 'shipped', 'delivered'].includes(order.status || '');
  const isClosed = expired || order.status === 'cancelled';

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8 sm:py-12 space-y-6">
      {/* Header Status */}
      <div className="bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            PEMBAYARAN OTOMATIS · MAYAR.ID PAYMENT GATEWAY
          </span>
          <h1 className="font-headline-sm text-2xl text-primary">Order #{order.id}</h1>
          <p className="text-xs text-text-muted mt-1">
            Dibuat pada {order.createdAt} · Penerima: {order.fullName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge label={badge.label} className={badge.cls} />
          <Link
            to={`/orders/${encodeURIComponent(order.id)}/invoice`}
            className={getButtonClassName({ variant: 'outline', size: 'sm' })}
          >
            <span className="material-symbols-outlined text-[15px]">description</span>
            Lihat Invoice / PDF
          </Link>
        </div>
      </div>

      {/* 1-Hour Countdown while pending */}
      {order.status === 'pending' && (
        <AlertBanner
          variant={expired ? 'error' : 'warning'}
          title={
            expired
              ? 'Batas Waktu Pembayaran Telah Berakhir'
              : 'Selesaikan Pembayaran via Mayar.id Sebelum Waktu Habis'
          }
          action={
            <span className="font-mono text-2xl font-bold tracking-wider">
              {expired ? '00:00' : formatCountdown(remainingSec)}
            </span>
          }
        >
          {expired
            ? 'Order ini telah melewati batas waktu 60 menit dan stok produk dikembalikan otomatis.'
            : 'Stok produk telah diamankan untukmu selama 60 menit. Setelah dibayar, status berubah LUNAS otomatis.'}
        </AlertBanner>
      )}

      {gatewayError && <AlertBanner variant="error">{gatewayError}</AlertBanner>}

      {/* Main Mayar Gateway Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <section className="md:col-span-7 bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 border-b border-border-ecru pb-3">
            <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary">
              Status &amp; Aksi Pembayaran Mayar.id
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] text-status-stock font-medium">
              <span className="material-symbols-outlined text-[15px]">verified_user</span>
              Auto-Verify
            </span>
          </div>

          <div className="bg-surface border border-border-ecru rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-text-muted">Total Tagihan</p>
              <p className="font-mono text-xl sm:text-2xl font-bold text-primary">
                {formatRupiah(order.total)}
              </p>
            </div>
            <div className="text-right text-xs">
              <p className="text-text-muted">Gateway</p>
              <p className="font-medium text-primary">
                {formatPaymentMethodLabel(order.paymentMethod, order.mayarPaymentMethod)}
              </p>
            </div>
          </div>

          {isPaid ? (
            <AlertBanner variant="success" title="Pembayaran Berhasil & Terverifikasi Otomatis">
              Pembayaran pesanan ini telah dikonfirmasi oleh <strong>Mayar.id</strong>. Pesanan kamu
              langsung masuk antrean pengemasan Atelier.
              {order.mayarTransactionId && (
                <p className="mt-1.5 font-mono text-[11px]">
                  Mayar TX ID: <strong>{order.mayarTransactionId}</strong>
                </p>
              )}
              {(order.mayarVerifiedAt || order.paidAt) && (
                <p className="mt-0.5 text-[11px]">
                  Terverifikasi pada:{' '}
                  {new Date(order.mayarVerifiedAt || order.paidAt!).toLocaleString('id-ID')}
                </p>
              )}
            </AlertBanner>
          ) : isClosed ? (
            <AlertBanner variant="error" title="Pesanan Tidak Aktif">
              Pesanan ini berstatus <strong>{badge.label}</strong>. Stok produk telah dikembalikan ke
              katalog. Silakan buat pesanan baru jika masih ingin berbelanja.
            </AlertBanner>
          ) : (
            <div className="space-y-4">
              {order.mayarPaymentLink ? (
                <div className="space-y-3">
                  <a
                    href={order.mayarPaymentLink}
                    className={getButtonClassName({
                      variant: 'primary',
                      size: 'lg',
                      fullWidth: true,
                    })}
                  >
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                    Bayar Sekarang di Mayar.id →
                  </a>
                  <div className="flex flex-wrap gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={checkingStatus}
                      onClick={() => void handleCheckPaymentStatus(false)}
                      className="flex-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">sync</span>
                      {checkingStatus ? 'Memeriksa Mayar...' : 'Cek Status Pembayaran'}
                    </Button>
                    <a
                      href={order.mayarPaymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={getButtonClassName({
                        variant: 'outline',
                        size: 'sm',
                      })}
                    >
                      Buka di Tab Baru ↗
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <AlertBanner variant="warning">
                    Link pembayaran Mayar.id belum terbentuk untuk order ini. Klik tombol di bawah
                    untuk membuat link pembayaran resmi Mayar.id.
                  </AlertBanner>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={creatingLink || !useSupabaseDb}
                    onClick={() => void handleGenerateMayarLink(true)}
                  >
                    <span className="material-symbols-outlined text-[18px]">add_card</span>
                    {creatingLink ? 'Menghubungkan ke Mayar.id...' : 'Buat Link Pembayaran Mayar.id'}
                  </Button>
                </div>
              )}

              {order.mayarInvoiceId && (
                <p className="text-[11px] text-text-muted font-mono">
                  Ref Invoice Mayar: {order.mayarInvoiceId}
                </p>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-border-ecru flex flex-wrap gap-3">
            <Link
              to="/account/orders"
              className={getButtonClassName({ variant: 'outline', size: 'sm', className: 'flex-1' })}
            >
              Semua Pesanan Saya
            </Link>
            <Link
              to="/curated-drops"
              className={getButtonClassName({ variant: 'outline', size: 'sm', className: 'flex-1' })}
            >
              Belanja Lagi
            </Link>
          </div>
        </section>

        {/* Supported Channels & How It Works */}
        <section className="md:col-span-5 bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary border-b border-border-ecru pb-3">
            Channel &amp; Cara Bayar
          </h2>

          <ul className="space-y-2 text-xs text-primary">
            {MAYAR_SUPPORTED_CHANNELS.map((channel) => (
              <li key={channel} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-status-stock mt-0.5 shrink-0">
                  check_circle
                </span>
                <span>{channel}</span>
              </li>
            ))}
          </ul>

          <div className="pt-3 border-t border-border-ecru space-y-2 text-[11px] text-text-muted leading-relaxed">
            <p className="font-label-uppercase text-[10px] uppercase tracking-wider text-secondary">
              Alur Verifikasi Otomatis
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Klik tombol <strong>Bayar Sekarang di Mayar.id</strong>.</li>
              <li>Pilih metode bayar (QRIS / Virtual Account / E-Wallet / Kartu) dan selesaikan transaksi.</li>
              <li>Kamu akan diarahkan kembali ke halaman ini dan status pesanan otomatis berubah menjadi <strong>Lunas</strong> tanpa upload bukti manual.</li>
            </ol>
          </div>
        </section>
      </div>

      {/* Shipping & Items Summary */}
      <section className="bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary border-b border-border-ecru pb-3">
          Detail Pengiriman &amp; Item
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-text-muted mb-1">Alamat Pengiriman</p>
            <p className="text-primary font-medium">
              {order.fullName} ({order.whatsapp})
            </p>
            <p className="text-text-muted mt-0.5">
              {[
                order.address,
                order.district ? `Kec. ${order.district}` : '',
                order.city,
                order.province,
                order.postalCode,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
            {order.deliveryNotes && (
              <p className="text-secondary mt-1">Catatan: {order.deliveryNotes}</p>
            )}
          </div>
          <div>
            <p className="text-text-muted mb-1">Ekspedisi &amp; No. Resi</p>
            <p className="text-primary font-medium">
              {order.shippingExpedition
                ? `${order.shippingExpedition} (${order.courier.toUpperCase()})`
                : order.courier.toUpperCase()}
            </p>
            <p className="text-text-muted mt-0.5">
              No. Resi:{' '}
              {order.trackingNumber ? (
                <span className="font-mono text-primary font-medium">{order.trackingNumber}</span>
              ) : (
                'Menunggu pengiriman'
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
