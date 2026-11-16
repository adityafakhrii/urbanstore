import React from 'react';
import type { OrderRecord } from './CartAndCheckoutModal';
import { formatRupiah } from '../services/supabaseService';
import { useModalEffects } from '../utils/storage';

interface InvoiceModalProps {
  order: OrderRecord | null;
  onClose: () => void;
}

function getInvoiceStamp(order: OrderRecord): { label: string; isPaid: boolean; colorHex: string; bgHex: string } {
  const status = order.status;
  const isExpired =
    status === 'expired' ||
    (status === 'pending' &&
      typeof order.paymentExpiresAt === 'string' &&
      new Date(order.paymentExpiresAt).getTime() <= Date.now());

  if (status === 'paid' || status === 'packed' || status === 'shipped' || status === 'delivered') {
    return { label: 'LUNAS', isPaid: true, colorHex: '#2D5A3D', bgHex: '#EAF4ED' };
  }
  if (status === 'waiting_verification') {
    return { label: 'BELUM LUNAS (MENUNGGU VERIFIKASI)', isPaid: false, colorHex: '#855224', bgHex: '#FFF4EB' };
  }
  if (isExpired) {
    return { label: 'BELUM LUNAS (KEDALUWARSA)', isPaid: false, colorHex: '#BA1A1A', bgHex: '#FFDAD6' };
  }
  if (status === 'cancelled') {
    return { label: 'DIBATALKAN', isPaid: false, colorHex: '#BA1A1A', bgHex: '#FFDAD6' };
  }
  return { label: 'BELUM LUNAS', isPaid: false, colorHex: '#BA1A1A', bgHex: '#FFDAD6' };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  useModalEffects(Boolean(order), onClose);

  if (!order) return null;

  const stamp = getInvoiceStamp(order);
  const items = order.items || [];
  const subtotal =
    order.subtotal ??
    (items.length > 0 ? items.reduce((s, i) => s + i.lineTotal, 0) : order.total);
  const discount = order.discount ?? 0;
  const shippingCost = order.shippingCost ?? 0;

  const handleDownloadPdf = () => {
    const rowsHtml =
      items.length > 0
        ? items
            .map(
              (item) => `
            <tr>
              <td>${escapeHtml(item.productSku)}</td>
              <td><strong>${escapeHtml(item.productName)}</strong><br/><span style="color:#6B665F;font-size:11px;">${escapeHtml(item.color)} · Size ${escapeHtml(item.size)}</span></td>
              <td style="text-align:center;">${item.quantity}</td>
              <td style="text-align:right;">${escapeHtml(formatRupiah(item.unitPrice))}</td>
              <td style="text-align:right;"><strong>${escapeHtml(formatRupiah(item.lineTotal))}</strong></td>
            </tr>`
            )
            .join('')
        : `<tr><td colspan="4">Pesanan kurasi (${order.itemsCount} item)</td><td style="text-align:right;"><strong>${escapeHtml(formatRupiah(order.total))}</strong></td></tr>`;

    const fullAddress = [
      order.address,
      order.district ? `Kec. ${order.district}` : '',
      order.city,
      order.province,
      order.postalCode,
    ]
      .filter(Boolean)
      .join(', ');

    const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(order.id)} - UrbanStore</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body { font-family: 'Inter', Arial, sans-serif; color: #1c1c19; margin: 0; padding: 24px; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1c1c19; padding-bottom: 16px; margin-bottom: 20px; }
    .brand { font-family: Georgia, serif; font-size: 24px; font-weight: 600; margin: 0 0 4px 0; }
    .muted { color: #6B665F; font-size: 12px; margin: 0; }
    .stamp { display: inline-block; padding: 6px 14px; border: 2px solid ${stamp.colorHex}; color: ${stamp.colorHex}; background: ${stamp.bgHex}; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
    .grid { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; font-size: 12px; }
    .box { flex: 1; background: #FAF8F5; border: 1px solid #E6E1D8; padding: 12px 14px; }
    .box h4 { margin: 0 0 8px 0; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #855224; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    th { text-align: left; border-bottom: 1px solid #1c1c19; padding: 8px 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #6B665F; }
    td { padding: 10px 6px; border-bottom: 1px solid #E6E1D8; vertical-align: top; }
    .summary { width: 280px; margin-left: auto; font-size: 12px; }
    .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
    .summary-total { border-top: 2px solid #1c1c19; margin-top: 6px; padding-top: 8px; font-size: 15px; font-weight: 700; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #E6E1D8; font-size: 11px; color: #6B665F; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">UrbanStore Editorial Atelier</div>
      <p class="muted">Jl. Senopati No. 48, Kebayoran Baru, Jakarta Selatan</p>
      <p class="muted">INVOICE RESMI · #${escapeHtml(order.id)}</p>
    </div>
    <div style="text-align:right;">
      <div class="stamp">${escapeHtml(stamp.label)}</div>
      <p class="muted" style="margin-top:8px;">Tanggal: ${escapeHtml(order.createdAt)}</p>
      ${
        order.paidAt
          ? `<p class="muted">Dibayar: ${escapeHtml(new Date(order.paidAt).toLocaleString('id-ID'))}</p>`
          : ''
      }
    </div>
  </div>
  <div class="grid">
    <div class="box">
      <h4>Penerima &amp; Tujuan Kirim</h4>
      <div><strong>${escapeHtml(order.fullName)}</strong></div>
      <div>${escapeHtml(order.whatsapp)}${order.email ? ` · ${escapeHtml(order.email)}` : ''}</div>
      <div style="margin-top:4px;">${escapeHtml(fullAddress)}</div>
      ${order.deliveryNotes ? `<div style="margin-top:4px;font-style:italic;color:#6B665F;">Catatan: ${escapeHtml(order.deliveryNotes)}</div>` : ''}
    </div>
    <div class="box">
      <h4>Pembayaran &amp; Pengiriman</h4>
      <div>Metode Bayar: <strong>${escapeHtml(order.paymentMethod)}</strong></div>
      <div>Kurir: <strong>${escapeHtml(order.courier.toUpperCase())}</strong></div>
      ${order.trackingNumber ? `<div>No. Resi: <strong>${escapeHtml(order.trackingNumber)}</strong></div>` : ''}
      ${
        order.paymentExpiresAt && !stamp.isPaid
          ? `<div style="margin-top:4px;color:#855224;">Batas Bayar: ${escapeHtml(new Date(order.paymentExpiresAt).toLocaleString('id-ID'))}</div>`
          : ''
      }
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>SKU</th>
        <th>Produk</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Harga</th>
        <th style="text-align:right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="summary">
    <div class="summary-row"><span>Subtotal Produk</span><span>${escapeHtml(formatRupiah(subtotal))}</span></div>
    ${discount > 0 ? `<div class="summary-row" style="color:#2D5A3D;"><span>Diskon Promo</span><span>- ${escapeHtml(formatRupiah(discount))}</span></div>` : ''}
    <div class="summary-row"><span>Ongkos Kirim</span><span>${shippingCost === 0 ? 'GRATIS' : escapeHtml(formatRupiah(shippingCost))}</span></div>
    <div class="summary-row summary-total"><span>Total Tagihan</span><span>${escapeHtml(formatRupiah(order.total))}</span></div>
  </div>
  <div class="footer">
    Dokumen ini diterbitkan secara otomatis oleh UrbanStore Atelier · Garansi tuker size 30 hari.
  </div>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc || !iframe.contentWindow) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    window.setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      window.setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 250);
  };

  return (
    <div aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog">
      <div className="fixed inset-0 bg-[#1A1A1A]/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-surface-card border border-border-ecru max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 z-10 shadow-2xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-primary">
          <div>
            <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block">
              URBANSTORE EDITORIAL ATELIER · INVOICE RESMI
            </span>
            <h3 className="font-headline-md text-headline-md text-primary">#{order.id}</h3>
            <p className="text-xs text-text-muted mt-0.5">Tanggal Terbit: {order.createdAt}</p>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <span
              style={{
                color: stamp.colorHex,
                borderColor: stamp.colorHex,
                backgroundColor: stamp.bgHex,
              }}
              className="px-3.5 py-1.5 border-2 font-label-uppercase text-[11px] font-bold tracking-widest uppercase"
            >
              {stamp.label}
            </span>
            {order.paidAt && (
              <span className="text-[11px] text-status-stock">
                Lunas pada: {new Date(order.paidAt).toLocaleString('id-ID')}
              </span>
            )}
          </div>
        </div>

        {/* Recipient & Payment Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-surface-sand border border-border-ecru space-y-1">
            <span className="font-label-uppercase text-[10px] uppercase text-secondary block mb-1">
              PENERIMA &amp; ALAMAT
            </span>
            <div className="font-semibold text-primary">{order.fullName}</div>
            <div className="text-text-muted">
              {order.whatsapp}
              {order.email ? ` · ${order.email}` : ''}
            </div>
            <div className="text-primary pt-1">
              {order.address}
              {order.district ? `, Kec. ${order.district}` : ''}, {order.city}
              {order.province ? `, ${order.province}` : ''}
              {order.postalCode ? ` ${order.postalCode}` : ''}
            </div>
            {order.deliveryNotes && (
              <div className="text-text-muted italic pt-1">Catatan: {order.deliveryNotes}</div>
            )}
          </div>

          <div className="p-4 bg-surface-sand border border-border-ecru space-y-1">
            <span className="font-label-uppercase text-[10px] uppercase text-secondary block mb-1">
              PEMBAYARAN &amp; PENGIRIMAN
            </span>
            <div>
              Metode Bayar: <strong className="text-primary">{order.paymentMethod}</strong>
            </div>
            <div>
              Kurir: <strong className="text-primary uppercase">{order.courier}</strong>
            </div>
            {order.trackingNumber && (
              <div>
                No. Resi: <strong className="font-mono text-primary">{order.trackingNumber}</strong>
              </div>
            )}
            {order.paymentExpiresAt && !stamp.isPaid && (
              <div className="text-secondary pt-1">
                Batas Bayar: {new Date(order.paymentExpiresAt).toLocaleString('id-ID')}
              </div>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-border-ecru overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
                <th className="p-3">SKU</th>
                <th className="p-3">Produk</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Harga</th>
                <th className="p-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ecru">
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <tr key={`${item.productSku}-${idx}`}>
                    <td className="p-3 font-mono text-text-muted">{item.productSku}</td>
                    <td className="p-3">
                      <div className="font-medium text-primary">{item.productName}</div>
                      <div className="text-[11px] text-text-muted">
                        {item.color} · Size {item.size}
                      </div>
                    </td>
                    <td className="p-3 text-center tabular-nums">{item.quantity}</td>
                    <td className="p-3 text-right tabular-nums">{formatRupiah(item.unitPrice)}</td>
                    <td className="p-3 text-right font-medium tabular-nums">
                      {formatRupiah(item.lineTotal)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-3 text-text-muted">
                    Pesanan kurasi ({order.itemsCount} item)
                  </td>
                  <td className="p-3 text-right font-medium tabular-nums">
                    {formatRupiah(order.total)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="sm:w-72 sm:ml-auto space-y-2 text-xs bg-surface-sand p-4 border border-border-ecru">
          <div className="flex justify-between text-text-muted">
            <span>Subtotal Produk</span>
            <span className="tabular-nums text-primary">{formatRupiah(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-status-stock">
              <span>Diskon Promo</span>
              <span className="tabular-nums">- {formatRupiah(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-text-muted">
            <span>Ongkos Kirim</span>
            <span className="tabular-nums text-primary">
              {shippingCost === 0 ? 'GRATIS' : formatRupiah(shippingCost)}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border-ecru text-sm font-semibold text-primary">
            <span>Total Tagihan</span>
            <span className="tabular-nums">{formatRupiah(order.total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border-ecru">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-border-ecru text-primary font-label-uppercase text-[11px] uppercase tracking-wider cursor-pointer hover:border-primary"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-6 py-2.5 bg-primary text-on-primary font-label-uppercase text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer hover:bg-neutral-800"
          >
            <span className="material-symbols-outlined text-[17px]">download</span>
            <span>Download PDF / Cetak Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
