import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import {
  OrderRecord,
  fetchOrderByNumberFromDb,
  formatRupiah,
  submitPaymentProofInDb,
  uploadPaymentProofImage,
} from '../../services/supabaseService';
import { MAX_IMAGE_SIZE_BYTES, formatBytes } from '../../utils/image';
import {
  PAYMENT_ACCOUNTS,
  formatCountdown,
  getOrderStatusBadge,
  getRemainingSeconds,
  isOrderPaymentExpired,
} from '../../utils/payment';
import { AlertBanner, StatusBadge, getButtonClassName } from '../../components/ui';

export const OrderPaymentPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { orders, useSupabaseDb, updateOrder, showToast } = useStore();

  const localMatch = orders.find((o) => o.id === orderNumber);
  const [fetchedOrder, setFetchedOrder] = useState<OrderRecord | null>(null);
  const [loadingOrder, setLoadingOrder] = useState<boolean>(!localMatch);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState<boolean>(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofCompressionInfo, setProofCompressionInfo] = useState<string | null>(null);

  const order = localMatch || fetchedOrder;

  useEffect(() => {
    if (!orderNumber || localMatch || !useSupabaseDb) {
      setLoadingOrder(false);
      return;
    }
    let mounted = true;
    setLoadingOrder(true);
    void fetchOrderByNumberFromDb(orderNumber).then((res) => {
      if (!mounted) return;
      setFetchedOrder(res);
      setLoadingOrder(false);
    });
    return () => {
      mounted = false;
    };
  }, [orderNumber, localMatch, useSupabaseDb]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (loadingOrder) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary">
            Memuat detail pembayaran...
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
            Nomor order <span className="font-mono">{orderNumber}</span> tidak ditemukan atau tidak berada
            pada sesi akun ini.
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
  const account = PAYMENT_ACCOUNTS[order.paymentMethod] || PAYMENT_ACCOUNTS['BCA Virtual Account'];
  const isPaid = ['paid', 'packed', 'shipped', 'delivered'].includes(order.status || '');

  const handleCopyText = (label: string, text: string) => {
    if (!navigator.clipboard) return;
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedField(label);
      window.setTimeout(() => setCopiedField((prev) => (prev === label ? null : prev)), 2000);
    });
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProofError('File bukti transfer harus berupa gambar.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setProofError('Ukuran gambar maksimal 5 MB.');
      return;
    }

    setProofError(null);
    setUploadingProof(true);
    const uploadRes = await uploadPaymentProofImage(file);

    if (uploadRes.error || !uploadRes.url) {
      setUploadingProof(false);
      setProofError(uploadRes.error || 'Gagal mengunggah bukti transfer.');
      return;
    }

    if (uploadRes.originalBytes && uploadRes.compressedBytes) {
      setProofCompressionInfo(
        `WebP terkompresi: ${formatBytes(uploadRes.originalBytes)} → ${formatBytes(uploadRes.compressedBytes)}`
      );
    }

    if (useSupabaseDb && order.dbId) {
      const rpcRes = await submitPaymentProofInDb(order.dbId, uploadRes.url);
      setUploadingProof(false);
      if (rpcRes.error) {
        setProofError(rpcRes.error);
        return;
      }
      const updated: OrderRecord = {
        ...order,
        paymentProofUrl: rpcRes.paymentProofUrl || uploadRes.url,
        status: rpcRes.status || 'waiting_verification',
      };
      setFetchedOrder(updated);
      updateOrder(updated);
      showToast('Bukti transfer berhasil diunggah! Admin akan segera memverifikasi.');
      return;
    }

    setUploadingProof(false);
    const updated: OrderRecord = {
      ...order,
      paymentProofUrl: uploadRes.url,
      status: 'waiting_verification',
    };
    setFetchedOrder(updated);
    updateOrder(updated);
    showToast('Bukti transfer berhasil disimpan!');
  };

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8 sm:py-12 space-y-6">
      {/* Header Status */}
      <div className="bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            KONFIRMASI &amp; INSTRUKSI PEMBAYARAN
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

      {/* 1-Hour Countdown */}
      {order.status === 'pending' && (
        <AlertBanner
          variant={expired ? 'error' : 'warning'}
          title={
            expired
              ? 'Batas Waktu Pembayaran Telah Berakhir'
              : 'Selesaikan Pembayaran Sebelum Waktu Habis'
          }
          action={
            <span className="font-mono text-2xl font-bold tracking-wider">
              {expired ? '00:00' : formatCountdown(remainingSec)}
            </span>
          }
        >
          {expired
            ? 'Order ini sudah melewati batas waktu 60 menit.'
            : 'Stok akan tetap tertahan untukmu selama 1 jam sejak checkout.'}
        </AlertBanner>
      )}

      {/* Payment Account Info & Proof Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transfer Info */}
        <section className="bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary border-b border-border-ecru pb-3">
            Informasi Rekening Tujuan ({order.paymentMethod})
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-text-muted">Bank / Channel</p>
              <p className="font-medium text-primary text-sm">{account.bank}</p>
            </div>
            <div>
              <p className="text-text-muted">Nomor Rekening / VA</p>
              <div className="flex items-center justify-between gap-2 bg-surface border border-border-ecru rounded-xl px-3.5 py-2.5 mt-1">
                <span className="font-mono text-base font-semibold text-primary">
                  {account.accountNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText('rekening', account.accountNumber)}
                  className="px-2.5 py-1 rounded-full bg-surface-sand text-[10px] font-label-uppercase uppercase tracking-wider text-secondary hover:text-primary cursor-pointer"
                >
                  {copiedField === 'rekening' ? 'Disalin!' : 'Salin'}
                </button>
              </div>
            </div>
            <div>
              <p className="text-text-muted">Atas Nama</p>
              <p className="font-medium text-primary">{account.accountHolder}</p>
            </div>
            <div>
              <p className="text-text-muted">Total Transfer</p>
              <div className="flex items-center justify-between gap-2 bg-surface border border-border-ecru rounded-xl px-3.5 py-2.5 mt-1">
                <span className="font-mono text-base font-bold text-primary">
                  {formatRupiah(order.total)}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText('nominal', String(order.total))}
                  className="px-2.5 py-1 rounded-full bg-surface-sand text-[10px] font-label-uppercase uppercase tracking-wider text-secondary hover:text-primary cursor-pointer"
                >
                  {copiedField === 'nominal' ? 'Disalin!' : 'Salin Nominal'}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed pt-1">{account.note}</p>
          </div>
        </section>

        {/* Proof Upload */}
        <section className="bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary border-b border-border-ecru pb-3">
            Unggah Bukti Transfer
          </h2>

          {proofError && <AlertBanner variant="error">{proofError}</AlertBanner>}

          {order.paymentProofUrl && (
            <div className="space-y-2">
              <p className="text-xs text-status-stock font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Bukti transfer sudah diunggah
              </p>
              <img
                src={order.paymentProofUrl}
                alt="Bukti Transfer"
                className="w-full max-h-56 object-contain rounded-xl border border-border-ecru bg-surface"
              />
            </div>
          )}

          {proofCompressionInfo && (
            <AlertBanner variant="success">{proofCompressionInfo}</AlertBanner>
          )}

          {!isPaid && !expired && (
            <label className="block border border-dashed border-primary/40 rounded-2xl bg-surface hover:bg-surface-sand transition-colors p-5 text-center cursor-pointer">
              <input
                type="file"
                accept="image/*"
                disabled={uploadingProof}
                onChange={handleUploadProof}
                className="hidden"
              />
              <span className="material-symbols-outlined text-[28px] text-primary block mb-1">
                cloud_upload
              </span>
              <p className="text-xs font-medium text-primary">
                {uploadingProof
                  ? 'Mengompresi WebP & mengunggah...'
                  : order.paymentProofUrl
                  ? 'Ganti Bukti Transfer (Maks 5 MB)'
                  : 'Pilih Foto / Screenshot Bukti Transfer'}
              </p>
              <p className="text-[10px] text-text-muted mt-1">
                Otomatis dikompresi ke format WebP sebelum dikirim ke admin.
              </p>
            </label>
          )}

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/account/orders"
              className={getButtonClassName({ variant: 'outline', size: 'sm', className: 'flex-1' })}
            >
              Semua Pesanan Saya
            </Link>
            <Link
              to="/curated-drops"
              className={getButtonClassName({ variant: 'primary', size: 'sm', className: 'flex-1' })}
            >
              Belanja Lagi
            </Link>
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
            <p className="text-primary font-medium">{order.fullName} ({order.whatsapp})</p>
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
