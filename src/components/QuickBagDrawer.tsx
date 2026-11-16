import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatRupiah } from '../services/supabaseService';
import { handleImageError, useModalEffects } from '../utils/storage';

export const QuickBagDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    bagDrawerOpen,
    setBagDrawerOpen,
    cartItems,
    totalCartCount,
    updateQuantity,
    removeCartItem,
  } = useStore();

  const onClose = () => setBagDrawerOpen(false);
  useModalEffects(bagDrawerOpen, onClose);

  if (!bagDrawerOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <div aria-modal="true" className="fixed inset-0 z-50" role="dialog">
      <div
        className="fixed inset-0 bg-[#1A1A1A]/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-surface-card border-l border-border-ecru flex flex-col justify-between overflow-y-auto z-10">
          {/* Header */}
          <div className="p-6 border-b border-border-ecru flex items-center justify-between sticky top-0 bg-surface-card z-20">
            <div>
              <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block">
                URBANSTORE SHOPPING BAG
              </span>
              <h3 className="font-headline-sm text-headline-sm text-primary">
                Shopping Bag ({totalCartCount})
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup bag"
              className="p-1.5 text-on-surface hover:text-secondary cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex-1 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-surface-sand border border-border-ecru flex items-center justify-center mx-auto mb-4 text-text-muted">
                  <span className="material-symbols-outlined text-[26px]">shopping_bag</span>
                </div>
                <h4 className="font-headline-sm text-headline-sm text-primary mb-2">
                  Bag kamu masih sepi nih. Yuk cari fit baru dulu!
                </h4>
                <p className="font-body-sm text-body-sm text-text-muted mb-6 max-w-xs mx-auto">
                  Kurasi mingguan kami siap di-mix-and-match dengan garansi tuker size 30 hari.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/curated-drops');
                  }}
                  className="px-8 py-3 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-wider rounded-DEFAULT hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cari Outfit Dulu
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-3 bg-[#FCEAE6] border border-border-ecru rounded-DEFAULT text-xs font-body-sm text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-status-stock">verified</span>
                  {subtotal >= 500000 ? (
                    <span>
                      Mantap! Kamu dapet <strong>Gratis Ongkir</strong> + garansi tuker size 30 hari.
                    </span>
                  ) : (
                    <span>
                      Tambah <strong>{formatRupiah(500000 - subtotal)}</strong> lagi buat klaim{' '}
                      <strong>Gratis Ongkir</strong>!
                    </span>
                  )}
                </div>

                <div className="divide-y divide-border-ecru">
                  {cartItems.map((item) => (
                    <div key={`${item.product.id}-${item.size}-${item.color}`} className="py-4 flex gap-4">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                        onClick={() => {
                          onClose();
                          navigate(`/product/${item.product.id}`);
                        }}
                        className="w-20 h-26 object-cover object-top bg-surface-container-low border border-border-ecru shrink-0 cursor-pointer"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              onClick={() => {
                                onClose();
                                navigate(`/product/${item.product.id}`);
                              }}
                              className="font-body-md text-body-md font-medium text-primary hover:text-secondary cursor-pointer"
                            >
                              {item.product.name}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeCartItem(item.product.id, item.size, item.color)}
                              className="text-text-muted hover:text-error cursor-pointer"
                              title="Hapus"
                              aria-label={`Hapus ${item.product.name}`}
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                          <p className="font-body-sm text-xs text-text-muted mt-0.5">
                            Size: <strong className="text-primary">{item.size}</strong> · {item.color}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="inline-flex items-center border border-border-ecru bg-surface-card">
                            <button
                              type="button"
                              aria-label="Kurangi jumlah"
                              onClick={() => updateQuantity(item.product.id, item.size, item.color, -1)}
                              className="w-7 h-7 flex items-center justify-center text-primary hover:bg-surface-container cursor-pointer"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-body-sm text-xs font-medium tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Tambah jumlah"
                              onClick={() => updateQuantity(item.product.id, item.size, item.color, 1)}
                              className="w-7 h-7 flex items-center justify-center text-primary hover:bg-surface-container cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-price-md text-price-md text-primary tabular-nums">
                            {formatRupiah(item.product.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-surface-sand border border-border-ecru rounded-DEFAULT flex justify-between items-baseline">
                  <span className="font-label-uppercase text-label-uppercase uppercase text-primary">
                    Subtotal
                  </span>
                  <span className="font-price-lg text-price-lg text-primary tabular-nums">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-border-ecru bg-surface-card">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/checkout');
                }}
                className="w-full h-12 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-[0.14em] rounded-DEFAULT hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Lanjut ke Checkout — {formatRupiah(subtotal)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
