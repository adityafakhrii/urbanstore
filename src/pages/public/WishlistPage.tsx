import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { formatRupiah } from '../../services/supabaseService';
import { handleImageError } from '../../utils/storage';
import { Button, getButtonClassName } from '../../components/ui';

export const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { products, wishlistIds, toggleWishlist, addToBag } = useStore();

  const savedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="page-shell py-8 sm:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-ecru pb-6">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            PERSONAL CURATION
          </span>
          <h1 className="font-headline-sm text-2xl sm:text-3xl text-primary">
            Wishlist Kamu ({savedProducts.length})
          </h1>
        </div>
        <Link
          to="/curated-drops"
          className={getButtonClassName({ variant: 'outline', size: 'sm' })}
        >
          Jelajahi Koleksi Lainnya →
        </Link>
      </div>

      {savedProducts.length === 0 ? (
        <div className="border border-border-ecru rounded-2xl bg-surface-card p-10 sm:p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface-sand flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px] text-secondary">
              favorite_border
            </span>
          </div>
          <h2 className="font-headline-sm text-xl text-primary">Wishlist Masih Kosong</h2>
          <p className="font-body-sm text-text-muted">
            Simpan outfit favoritmu dengan menekan ikon hati pada katalog untuk membandingkan siluet dan bahan.
          </p>
          <div className="pt-2">
            <Link
              to="/curated-drops"
              className={getButtonClassName({ variant: 'primary', size: 'md' })}
            >
              Mulai Eksplorasi
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {savedProducts.map((product) => (
            <article
              key={product.id}
              className="group border border-border-ecru rounded-2xl bg-surface-card flex flex-col justify-between overflow-hidden"
            >
              <div>
                <Link
                  to={`/product/${product.id}`}
                  className="block aspect-[3/4] bg-surface-muted overflow-hidden relative"
                >
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
                  <p className="font-body-sm text-sm text-primary font-medium mt-1">
                    {formatRupiah(product.price)}
                  </p>
                </div>
              </div>

              <div className="px-4 pb-4 pt-2 border-t border-border-ecru/60 flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    addToBag(product, product.sizes[0] || 'M', product.colors[0]?.name);
                    navigate('/cart');
                  }}
                >
                  Masuk Keranjang
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  aria-label="Hapus dari Wishlist"
                  onClick={() => toggleWishlist(product.id)}
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
