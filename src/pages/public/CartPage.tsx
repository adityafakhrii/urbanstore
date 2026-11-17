import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { formatRupiah } from '../../services/supabaseService';
import { handleImageError } from '../../utils/storage';
import { AlertBanner, Button, ConfirmDialog, getButtonClassName } from '../../components/ui';

const FREE_SHIPPING_THRESHOLD = 500000;

export const CartPage: React.FC = () => {
  const { cartItems, totalCartCount, updateQuantity, removeCartItem, clearCart, showToast } =
    useStore();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div className="page-shell py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-ecru pb-6">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            URBANSTORE SHOPPING BAG
          </span>
          <h1 className="font-headline-sm text-2xl sm:text-3xl text-primary">
            Keranjang Belanja ({totalCartCount} Item)
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {cartItems.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmClearOpen(true)}>
              Kosongkan Keranjang
            </Button>
          )}
          <Link to="/curated-drops" className={getButtonClassName({ variant: 'outline', size: 'sm' })}>
            ← Lanjut Belanja
          </Link>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="max-w-xl mx-auto bg-surface-card border border-border-ecru rounded-2xl p-10 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface-sand flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px] text-secondary">shopping_bag</span>
          </div>
          <h2 className="font-headline-sm text-xl text-primary">Keranjang Belanjamu Masih Kosong</h2>
          <p className="font-body-sm text-text-muted max-w-md mx-auto">
            Temukan siluet kurasi terbaru mulai dari linen Eropa hingga tailoring santai siap pakai.
          </p>
          <div className="pt-2">
            <Link to="/curated-drops" className={getButtonClassName({ variant: 'primary', size: 'md' })}>
              Jelajahi Curated Drops
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cartItems.map((item) => (
              <article
                key={`${item.product.id}-${item.size}-${item.color}`}
                className="bg-surface-card border border-border-ecru rounded-2xl p-4 sm:p-5 flex gap-4 sm:gap-5 items-start"
              >
                <Link
                  to={`/product/${item.product.id}`}
                  className="w-24 sm:w-28 aspect-[3/4] rounded-xl overflow-hidden bg-surface-muted shrink-0"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    onError={handleImageError}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-label-uppercase text-[10px] uppercase tracking-wider text-secondary block">
                        {item.product.sku}
                      </span>
                      <Link
                        to={`/product/${item.product.id}`}
                        className="font-headline-sm text-base sm:text-lg text-primary hover:underline line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-text-muted mt-0.5">
                        Warna: <strong className="text-primary font-medium">{item.color}</strong> ·
                        Ukuran: <strong className="text-primary font-medium">{item.size}</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeCartItem(item.product.id, item.size, item.color)}
                      aria-label={`Hapus ${item.product.name}`}
                      className="p-1.5 rounded-full text-text-muted hover:text-error hover:bg-error-container/40 transition-colors cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-ecru/60">
                    <div className="inline-flex items-center border border-border-ecru rounded-xl bg-surface overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.size, item.color, -1)}
                        aria-label="Kurangi jumlah"
                        className="w-9 h-9 flex items-center justify-center text-primary hover:bg-surface-sand transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                      </button>
                      <span className="w-10 text-center text-xs font-semibold text-primary tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.size, item.color, 1)}
                        aria-label="Tambah jumlah"
                        className="w-9 h-9 flex items-center justify-center text-primary hover:bg-surface-sand transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] text-text-muted">
                        {formatRupiah(item.product.price)} × {item.quantity}
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-primary tabular-nums">
                        {formatRupiah(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Right: Subtotal Summary (NO Shipping Calculation Here — Exclusively at Checkout) */}
          <aside className="lg:col-span-4 bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-5 lg:sticky lg:top-28">
            <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary border-b border-border-ecru pb-3">
              Ringkasan Belanja
            </h2>

            {/* Free shipping qualifier progress */}
            <div className="bg-surface-sand/70 border border-border-ecru rounded-xl p-3.5 space-y-2">
              <p className="text-xs text-primary leading-relaxed">
                {remainingForFreeShipping === 0 ? (
                  <span className="text-status-stock font-medium">
                    ✓ Selamat! Belanjaanmu memenuhi syarat Gratis Ongkir Reguler (min.{' '}
                    {formatRupiah(FREE_SHIPPING_THRESHOLD)}).
                  </span>
                ) : (
                  <>
                    Tambah <strong>{formatRupiah(remainingForFreeShipping)}</strong> lagi untuk
                    mendapatkan <strong>Gratis Ongkir Reguler</strong> saat checkout.
                  </>
                )}
              </p>
              <div className="w-full h-1.5 bg-surface-card rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-text-muted">
                <span>Total Barang</span>
                <span className="font-medium text-primary">{totalCartCount} Item</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-primary pt-3 border-t border-border-ecru">
                <span>Subtotal Produk</span>
                <span className="tabular-nums">{formatRupiah(subtotal)}</span>
              </div>
            </div>

            <AlertBanner variant="info">
              Ongkos kirim, pilihan kurir, dan kode promo akan dihitung pada halaman Checkout.
            </AlertBanner>

            <Link
              to="/checkout"
              className={getButtonClassName({ variant: 'primary', size: 'lg', fullWidth: true })}
            >
              Lanjut ke Checkout →
            </Link>
          </aside>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmClearOpen}
        title="Kosongkan Keranjang?"
        description="Seluruh item di dalam keranjang belanjamu akan dihapus. Kamu tetap bisa memilih ulang dari katalog."
        confirmLabel="Ya, Kosongkan"
        cancelLabel="Batal"
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          clearCart();
          setConfirmClearOpen(false);
          showToast('Keranjang belanja dikosongkan.');
        }}
      />
    </div>
  );
};
