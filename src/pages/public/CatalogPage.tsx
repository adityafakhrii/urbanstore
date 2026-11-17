import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CatalogView } from '../../components/CatalogView';
import { ActivePage, activePageToPath } from '../../components/Header';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../data/products';

interface CatalogPageProps {
  categoryPage: 'women' | 'men' | 'bags' | 'shoes' | 'curated-drops';
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ categoryPage }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const { products, addToBag, toggleWishlist, wishlistIds, setSizeGuideOpen, showToast } = useStore();

  const handleNavigate = (page: ActivePage) => {
    navigate(activePageToPath(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    navigate(`/product/${product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next, { replace: true });
  };

  return (
    <CatalogView
      products={products}
      activePage={categoryPage}
      onNavigate={handleNavigate}
      onSelectProduct={handleSelectProduct}
      onAddToBag={addToBag}
      onToggleWishlist={toggleWishlist}
      wishlistIds={wishlistIds}
      onOpenSizeGuide={() => setSizeGuideOpen(true)}
      searchQuery={searchQuery}
      onClearSearch={handleClearSearch}
      onShowToast={showToast}
    />
  );
};
