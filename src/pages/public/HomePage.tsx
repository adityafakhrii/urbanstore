import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeView } from '../../components/HomeView';
import { ActivePage, activePageToPath } from '../../components/Header';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../data/products';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { products, addToBag, toggleWishlist, wishlistIds, setSizeGuideOpen } = useStore();

  const handleNavigate = (page: ActivePage) => {
    navigate(activePageToPath(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    navigate(`/product/${product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <HomeView
      products={products}
      onNavigate={handleNavigate}
      onSelectProduct={handleSelectProduct}
      onAddToBag={addToBag}
      onToggleWishlist={toggleWishlist}
      wishlistIds={wishlistIds}
      onOpenSizeGuide={() => setSizeGuideOpen(true)}
    />
  );
};
