import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import {
  OrderRecord,
  fetchOrderByNumberFromDb,
  formatRupiah,
} from '../../services/supabaseService';
import { getInvoiceStamp } from '../../utils/payment';
import { Button, getButtonClassName } from '../../components/ui';

export const OrderInvoicePage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { orders, useSupabaseDb } = useStore();

  const localMatch = orders.find((o) => o.id === orderNumber);
  const [fetchedOrder, setFetchedOrder] = useState<OrderRecord | null>(null);
  const [loadingOrder, setLoadingOrder] = useState<boolean>(!localMatch);

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

  if (loadingOrder) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary">
            Menyiapkan invoice...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-5 py-14 text-center">
        <div className="border border-border-ecru rounded-2xl bg-surface-card p-10 space-y-4">
          <h1 className="font-headline-sm text-2xl text-primary">Invoice Tidak Ditemukan</h1>
          <p className="font-body-sm text-text-muted">
            Order <span className="font-mono">{orderNumber}</span> tidak ditemukan.
          </p>
          <Link
            to="/account/orders"
            className={getButtonClassName({ variant: 'primary', size: 'md' })}
          >
            Kembali ke Pesanan
          </Link>
        </div>
      </div>
    );
  }

  const stamp = getInvoiceStamp(order);
  const items = order.items || [];
  const subtotal =
    order.subtotal ?? (items.length > 0 ? items.reduce((s, i) => s + i.lineTotal, 0) : order.total);
  const discount = order.discount ?? 0;
  const shippingCost = order.shippingCost ?? 0;

  const fullAddress = [
    order.address,
    order.district ? `Kec. ${order.district}` : '',
    order.city,
    order.province,
    order.postalCode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
      {/* Action Toolbar (hidden when printing to PDF) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
        <Link
          to={`/orders/${encodeURIComponent(order.id)}/payment`}
          className={getButtonClassName({ variant: 'outline', size: 'sm' })}
        >
          <span className="material-symbols-outlined text-[15px]">arrow_back</span>
          Kembali ke Pembayaran
        </Link>
        <Button variant="primary" size="md" onClick={() => window.print()}>
          <span className="material-symbols-outlined text-[16px]">print</span>
          Cetak / Download PDF
        </Button>
      </div>

      {/* Printable Invoice Sheet */}
      <article className="bg-white border border-border-ecru rounded-2xl p-6 sm:p-10 shadow-sm print:border-0 print:rounded-none print:shadow-none print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-primary pb-6 mb-6">
          <div>
            <h1 className="font-headline-sm text-2xl text-primary tracking-wide">URBANSTORE</h1>
            <p className="text-xs text-text-muted mt-1">
              Architectural Apparel Indonesia · support@urbanstore.id
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              No. Invoice: <strong className="font-mono text-primary">INV-{order.id}</strong> · Tanggal:{' '}
              {order.createdAt}
            </p>
          </div>
          <div
            style={{
              borderColor: stamp.colorHex,
              color: stamp.colorHex,
              backgroundColor: stamp.bgHex,
            }}
            className="inline-block px-4 py-1.5 rounded-full border-2 text-[11px] font-bold uppercase tracking-widest self-start"
          >
            {stamp.label}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-xs">
          <div className="bg-surface border border-border-ecru rounded-xl p-4 space-y-1">
            <h2 className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary mb-2">
              Ditagihkan &amp; Dikirim Ke
            </h2>
            <p className="font-medium text-primary text-sm">{order.fullName}</p>
            <p className="text-text-muted">{order.email}</p>
            <p className="text-text-muted">WA: {order.whatsapp}</p>
            <p className="text-primary pt-1">{fullAddress}</p>
            {order.deliveryNotes && <p className="text-secondary">Catatan: {order.deliveryNotes}</p>}
          </div>

          <div className="bg-surface border border-border-ecru rounded-xl p-4 space-y-1">
            <h2 className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary mb-2">
              Informasi Pembayaran &amp; Kurir
            </h2>
            <p>
              <span className="text-text-muted">Order ID:</span>{' '}
              <strong className="font-mono text-primary">{order.id}</strong>
            </p>
            <p>
              <span className="text-text-muted">Metode Bayar:</span>{' '}
              <strong className="text-primary">{order.paymentMethod}</strong>
            </p>
            <p>
              <span className="text-text-muted">Layanan Kurir:</span>{' '}
              <strong className="text-primary">
                {order.shippingExpedition
                  ? `${order.shippingExpedition} (${order.courier.toUpperCase()})`
                  : order.courier.toUpperCase()}
              </strong>
            </p>
            {order.trackingNumber && (
              <p>
                <span className="text-text-muted">No. Resi:</span>{' '}
                <strong className="font-mono text-primary">{order.trackingNumber}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-primary text-left text-[10px] uppercase tracking-wider text-text-muted">
                <th className="py-2.5 pr-3">SKU</th>
                <th className="py-2.5 pr-3">Produk</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                <th className="py-2.5 pl-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <tr key={`${item.productSku}-${idx}`} className="border-b border-border-ecru">
                    <td className="py-3 pr-3 font-mono text-text-muted">{item.productSku}</td>
                    <td className="py-3 pr-3">
                      <p className="font-medium text-primary">{item.productName}</p>
                      <p className="text-[11px] text-text-muted">
                        {item.color} · Size {item.size}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-center">{item.quantity}</td>
                    <td className="py-3 px-3 text-right">{formatRupiah(item.unitPrice)}</td>
                    <td className="py-3 pl-3 text-right font-medium text-primary">
                      {formatRupiah(item.lineTotal)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-border-ecru">
                  <td colSpan={4} className="py-3 pr-3 text-primary">
                    Pesanan Kurasi ({order.itemsCount} item)
                  </td>
                  <td className="py-3 pl-3 text-right font-medium text-primary">
                    {formatRupiah(order.total)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="sm:w-72 sm:ml-auto space-y-2 text-xs">
          <div className="flex justify-between text-text-muted">
            <span>Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-status-stock">
              <span>Diskon</span>
              <span>-{formatRupiah(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-text-muted">
            <span>Ongkos Kirim</span>
            <span>{shippingCost === 0 ? 'GRATIS' : formatRupiah(shippingCost)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-primary pt-3 border-t-2 border-primary">
            <span>Total Tagihan</span>
            <span>{formatRupiah(order.total)}</span>
          </div>
        </div>
      </article>
    </div>
  );
};
