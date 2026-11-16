import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { formatRupiah } from '../../services/supabaseService';
import { handleImageError } from '../../utils/storage';

export const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { products, wishlistIds, toggleWishlist, addToBag } = useStore();

  const savedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-ecru pb-6 mb-8">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            PERSONAL CURATION
          </span>
          <h1 className="font-headline-sm text-headline-sm text-primary">
            Wishlist Kamu ({savedProducts.length})
          </h1>
        </div>
        <Link
          to="/curated-drops"
          className="font-label-uppercase text-[11px] uppercase tracking-wider text-primary underline underline-offset-4 hover:opacity-80"
        >
          Jelajahi Koleksi Lainnya →
        </Link>
      </div>

      {savedProducts.length === 0 ? (
        <div className="border border-border-ecru bg-surface-card p-12 text-center max-w-xl mx-auto">
          <span className="material-symbols-outlined text-[42px] text-secondary block mb-3">
            favorite_border
          </span>
          <h2 className="font-headline-sm text-lg text-primary mb-2">Wishlist Masih Kosong</h2>
          <p className="font-body-sm text-text-muted mb-6">
            Simpan outfit favoritmu dengan menekan ikon hati pada katalog untuk membandingkan siluet dan bahan.
          </p>
          <Link
            to="/curated-drops"
            className="inline-block px-6 py-3 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-wider"
          >
            Mulai Eksplorasi
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {savedProducts.map((product) => (
            <article
              key={product.id}
              className="group border border-border-ecru bg-surface-card flex flex-col justify-between overflow-hidden"
            >
              <div>
                <Link to={`/product/${product.id}`} className="block aspect-[3/4] bg-surface-muted overflow-hidden relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    onError={handleImageError}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                <div className="p-4">
                  <p className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary mb-1">
                    {product.category}
                  </p>
                  <Link
                    to={`/product/${product.id}`}
                    className="font-headline-sm text-base text-primary hover:underline line-clamp-1 block"
                  >
                    {product.name}
                  </Link>
                  <p className="font-body-sm text-sm text-primary mt-1">{formatRupiah(product.price)}</p>
                </div>
              </div>

              <div className="px-4 pb-4 pt-2 border-t border-border-ecru/60 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    addToBag(product, product.sizes[0] || 'M', product.colors[0]?.name);
                    navigate('/checkout');
                  }}
                  className="flex-1 py-2.5 bg-primary text-on-primary font-label-uppercase text-[10px] uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Tambah &amp; Checkout
                </button>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Hapus dari Wishlist"
                  className="px-3 py-2.5 border border-border-ecru text-text-muted hover:text-error hover:border-error/40 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
