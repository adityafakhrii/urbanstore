import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { formatRupiah } from '../../services/supabaseService';
import {
  formatCountdown,
  getOrderStatusBadge,
  getRemainingSeconds,
  isOrderPaymentExpired,
} from '../../utils/payment';
import { AlertBanner, StatusBadge, getButtonClassName } from '../../components/ui';

export const OrderHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { orders } = useStore();
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  void nowTick;

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-ecru pb-6">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            RIWAYAT TRANSAKSI
          </span>
          <h1 className="font-headline-sm text-2xl sm:text-3xl text-primary">
            Pesanan Saya ({orders.length})
          </h1>
        </div>
        <Link
          to="/curated-drops"
          className={getButtonClassName({ variant: 'outline', size: 'sm' })}
        >
          Belanja Koleksi Baru →
        </Link>
      </div>

      {!user && (
        <AlertBanner variant="info">
          Menampilkan pesanan dari sesi browser ini.{' '}
          <Link to="/login?redirect=/account/orders" className="text-primary underline font-medium">
            Masuk dengan Google
          </Link>{' '}
          untuk sinkronisasi lintas perangkat.
        </AlertBanner>
      )}

      {orders.length === 0 ? (
        <div className="border border-border-ecru rounded-2xl bg-surface-card p-10 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface-sand flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px] text-secondary">receipt_long</span>
          </div>
          <h2 className="font-headline-sm text-xl text-primary">Belum Ada Pesanan</h2>
          <p className="font-body-sm text-text-muted max-w-md mx-auto">
            Pesanan yang sudah kamu checkout akan tampil di sini beserta timer pembayaran &amp; invoice PDF.
          </p>
          <div className="pt-2">
            <Link
              to="/curated-drops"
              className={getButtonClassName({ variant: 'primary', size: 'md' })}
            >
              Mulai Belanja
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const expired = isOrderPaymentExpired(order);
            const remaining = order.status === 'pending' ? getRemainingSeconds(order.paymentExpiresAt) : 0;
            const badge = getOrderStatusBadge(order.status, expired);

            return (
              <article
                key={order.id}
                className="bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm font-semibold text-primary">#{order.id}</span>
                    <StatusBadge label={badge.label} className={badge.cls} />
                    {order.status === 'pending' && !expired && (
                      <span className="font-mono text-xs text-secondary bg-surface-sand px-3 py-1 rounded-full">
                        Sisa waktu: {formatCountdown(remaining)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">
                    {order.createdAt} · {order.itemsCount} item · Metode: {order.paymentMethod}
                  </p>
                  <p className="text-sm font-semibold text-primary pt-0.5">
                    Total: {formatRupiah(order.total)}
                  </p>
                  {order.trackingNumber && (
                    <p className="text-xs text-status-stock">
                      Pengiriman ({order.shippingExpedition || order.courier.toUpperCase()}) · Resi:{' '}
                      <span className="font-mono font-medium">{order.trackingNumber}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Link
                    to={`/orders/${encodeURIComponent(order.id)}/payment`}
                    className={getButtonClassName({ variant: 'primary', size: 'sm' })}
                  >
                    {order.status === 'pending' && !expired
                      ? 'Bayar / Upload Bukti'
                      : 'Detail Pembayaran'}
                  </Link>
                  <Link
                    to={`/orders/${encodeURIComponent(order.id)}/invoice`}
                    className={getButtonClassName({ variant: 'outline', size: 'sm' })}
                  >
                    Invoice PDF
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
