import React from 'react';
import { PRODUCTS, Product } from '../data/products';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToBag: (product: Product, size: string) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlistIds,
  onToggleWishlist,
  onSelectProduct,
  onAddToBag,
}) => {
  if (!isOpen) return null;

  const wishlistedProducts = PRODUCTS.filter((p) => wishlistIds.includes(p.id));

  return (
    <div aria-modal="true" className="fixed inset-0 z-50" role="dialog">
      <div
        className="fixed inset-0 bg-[#1A1A1A]/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface-card border-l border-border-ecru p-6 flex flex-col justify-between overflow-y-auto z-10">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border-ecru mb-6">
              <div>
                <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
                  WISHLIST INCARAN KAMU
                </span>
                <h3 className="font-headline-sm text-headline-sm text-primary">
                  Outfit Favorit ({wishlistedProducts.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-on-surface hover:text-secondary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {wishlistedProducts.length === 0 ? (
              <div className="py-16 text-center">
                <span className="material-symbols-outlined text-[32px] text-text-muted mb-3">favorite</span>
                <h4 className="font-headline-sm text-headline-sm text-primary mb-2">
                  Belum ada outfit yang di-save nih
                </h4>
                <p className="font-body-sm text-body-sm text-text-muted">
                  Klik ikon hati di foto produk buat nyimpen racun outfit incaranmu.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border-ecru">
                {wishlistedProducts.map((product) => (
                  <div key={product.id} className="py-4 flex gap-4">
                    <img
                      onClick={() => {
                        onClose();
                        onSelectProduct(product);
                      }}
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-26 object-cover object-top bg-surface-container-low border border-border-ecru cursor-pointer shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            onClick={() => {
                              onClose();
                              onSelectProduct(product);
                            }}
                            className="font-body-md text-body-md font-medium text-primary hover:text-secondary cursor-pointer"
                          >
                            {product.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => onToggleWishlist(product.id)}
                            className="text-text-muted hover:text-error cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                        <p className="font-body-sm text-xs text-text-muted">{product.subtitle}</p>
                        <span className="font-price-md text-price-md text-primary block mt-1">
                          {product.priceFormatted}
                        </span>
                      </div>

                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => onAddToBag(product, product.defaultSize)}
                          className="px-3 py-1.5 bg-primary text-on-primary font-label-uppercase text-[10px] uppercase tracking-wider rounded-DEFAULT hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          + Masukin Bag ({product.defaultSize})
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border-ecru mt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-primary text-on-primary font-label-uppercase text-label-uppercase tracking-wider uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Tutup Wishlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
