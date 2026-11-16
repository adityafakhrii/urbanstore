import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ProductDetailView } from '../../components/ProductDetailView';
import { ActivePage } from '../../components/Header';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../data/products';

function activePageToPath(page: ActivePage): string {
  switch (page) {
    case 'home':
      return '/';
    case 'admin':
      return '/admin/orders';
    case 'checkout':
      return '/checkout';
    case 'pdp':
      return '/curated-drops';
    default:
      return `/${page}`;
  }
}

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { products, catalogLoaded, addToBag, toggleWishlist, wishlistIds, setSizeGuideOpen } = useStore();

  const product = products.find((p) => p.id === productId);

  if (!catalogLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary">
            Memuat detail outfit...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="font-label-uppercase text-[11px] uppercase tracking-widest text-text-muted mb-2">
            Produk Tidak Ditemukan
          </p>
          <h1 className="font-headline-sm text-headline-sm text-primary mb-3">Outfit Tidak Tersedia</h1>
          <p className="font-body-sm text-text-muted mb-6">
            Outfit yang kamu cari mungkin sudah dihapus atau tautannya berubah.
          </p>
          <Link
            to="/curated-drops"
            className="inline-block px-6 py-3 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-wider"
          >
            Lihat Semua Koleksi
          </Link>
        </div>
      </div>
    );
  }

  const handleNavigate = (page: ActivePage) => {
    navigate(activePageToPath(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (selected: Product) => {
    navigate(`/product/${selected.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBuyNow = (selected: Product, size: string, colorName?: string) => {
    addToBag(selected, size, colorName);
    navigate('/checkout');
  };

  return (
    <ProductDetailView
      product={product}
      products={products}
      onNavigate={handleNavigate}
      onSelectProduct={handleSelectProduct}
      onAddToBag={addToBag}
      onBuyNow={handleBuyNow}
      onToggleWishlist={toggleWishlist}
      wishlistIds={wishlistIds}
      onOpenSizeGuide={() => setSizeGuideOpen(true)}
    />
  );
};
