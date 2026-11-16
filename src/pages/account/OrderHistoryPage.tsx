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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-ecru pb-6">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            RIWAYAT TRANSAKSI
          </span>
          <h1 className="font-headline-sm text-headline-sm text-primary">
            Pesanan Saya ({orders.length})
          </h1>
          {!user && (
            <p className="text-xs text-text-muted mt-1">
              Menampilkan pesanan dari sesi browser ini.{' '}
              <Link to="/login?redirect=/account/orders" className="text-primary underline">
                Masuk
              </Link>{' '}
              untuk sinkronisasi lintas perangkat.
            </p>
          )}
        </div>
        <Link
          to="/curated-drops"
          className="font-label-uppercase text-[11px] uppercase tracking-wider text-primary underline underline-offset-4"
        >
          Belanja Koleksi Baru →
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="border border-border-ecru bg-surface-card p-12 text-center">
          <span className="material-symbols-outlined text-[42px] text-secondary block mb-3">
            receipt_long
          </span>
          <h2 className="font-headline-sm text-lg text-primary mb-2">Belum Ada Pesanan</h2>
          <p className="font-body-sm text-text-muted mb-6">
            Pesanan yang sudah kamu checkout akan tampil di sini beserta timer pembayaran &amp; invoice PDF.
          </p>
          <Link
            to="/curated-drops"
            className="inline-block px-6 py-3 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-wider"
          >
            Mulai Belanja
          </Link>
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
                className="bg-surface-card border border-border-ecru p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm font-semibold text-primary">#{order.id}</span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-label-uppercase uppercase tracking-wider ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                    {order.status === 'pending' && !expired && (
                      <span className="font-mono text-xs text-secondary bg-surface-sand px-2 py-0.5">
                        Sisa waktu: {formatCountdown(remaining)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">
                    {order.createdAt} · {order.itemsCount} item · Metode: {order.paymentMethod}
                  </p>
                  <p className="text-sm font-semibold text-primary pt-1">
                    Total: {formatRupiah(order.total)}
                  </p>
                  {order.trackingNumber && (
                    <p className="text-xs text-status-stock">
                      Resi ({order.courier.toUpperCase()}):{' '}
                      <span className="font-mono font-medium">{order.trackingNumber}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Link
                    to={`/orders/${encodeURIComponent(order.id)}/payment`}
                    className="px-4 py-2 bg-primary text-on-primary font-label-uppercase text-[10px] uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                  >
                    {order.status === 'pending' && !expired
                      ? 'Bayar / Upload Bukti'
                      : 'Detail Pembayaran'}
                  </Link>
                  <Link
                    to={`/orders/${encodeURIComponent(order.id)}/invoice`}
                    className="px-4 py-2 border border-border-ecru text-primary font-label-uppercase text-[10px] uppercase tracking-wider hover:bg-surface-muted transition-colors"
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
