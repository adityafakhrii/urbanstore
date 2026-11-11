/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PRODUCTS, Product } from './data/products';
import { Header, ActivePage } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { CatalogView } from './components/CatalogView';
import { ProductDetailView } from './components/ProductDetailView';
import { SizeGuideModal } from './components/SizeGuideModal';
import { CartAndCheckoutModal, CartItem } from './components/CartAndCheckoutModal';
import { WishlistDrawer } from './components/WishlistDrawer';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pre-populated with 2 curated items so the header badge "02" matches the reference screen
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      product: PRODUCTS[0], // The Column Dress & Overshirt
      size: 'S',
      color: 'Alabaster White',
      quantity: 1,
    },
    {
      product: PRODUCTS[1], // Pleated Silk Midi Skirt
      size: 'S',
      color: 'Soft Beige',
      quantity: 1,
    },
  ]);

  const [wishlistIds, setWishlistIds] = useState<string[]>(['minimalist-cashmere-sweater']);
  const [sizeGuideOpen, setSizeGuideOpen] = useState<boolean>(false);
  const [cartModalOpen, setCartModalOpen] = useState<boolean>(false);
  const [cartInitialMode, setCartInitialMode] = useState<'bag' | 'checkout'>('bag');
  const [wishlistOpen, setWishlistOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleNavigate = (page: ActivePage) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setActivePage('pdp');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToBag = (product: Product, size: string, colorName?: string) => {
    const color = colorName || product.colors[0]?.name || 'Default';
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.size === size
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }
      return [...prev, { product, size, color, quantity: 1 }];
    });
    showToast(`✓ ${product.name} (Size ${size}) udah masuk ke Bag kamu!`);
  };

  const handleBuyNow = (product: Product, size: string, colorName?: string) => {
    handleAddToBag(product, size, colorName);
    setCartInitialMode('checkout');
    setCartModalOpen(true);
  };

  const handleUpdateQuantity = (productId: string, size: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.size === size) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveCartItem = (productId: string, size: string) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.size === size))
    );
  };

  const handleToggleWishlist = (productId: string) => {
    const prod = PRODUCTS.find((p) => p.id === productId);
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        if (prod) showToast(`${prod.name} dihapus dari Wishlist.`);
        return prev.filter((id) => id !== productId);
      } else {
        if (prod) showToast(`♥ ${prod.name} disimpan ke Wishlist!`);
        return [...prev, productId];
      }
    });
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body-md text-on-surface antialiased">
      <Header
        activePage={activePage}
        onNavigate={handleNavigate}
        cartCount={totalCartCount}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => {
          setCartInitialMode('bag');
          setCartModalOpen(true);
        }}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenSizeGuide={() => setSizeGuideOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="w-full pt-28 bg-surface flex-1">
        {activePage === 'home' && (
          <HomeView
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
            onAddToBag={handleAddToBag}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            onOpenSizeGuide={() => setSizeGuideOpen(true)}
          />
        )}

        {(activePage === 'women' ||
          activePage === 'men' ||
          activePage === 'bags' ||
          activePage === 'shoes' ||
          activePage === 'curated-drops') && (
          <CatalogView
            activePage={activePage}
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
            onAddToBag={handleAddToBag}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            onOpenSizeGuide={() => setSizeGuideOpen(true)}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onShowToast={showToast}
          />
        )}

        {activePage === 'pdp' && (
          <ProductDetailView
            product={selectedProduct}
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
            onAddToBag={handleAddToBag}
            onBuyNow={handleBuyNow}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            onOpenSizeGuide={() => setSizeGuideOpen(true)}
          />
        )}
      </main>

      <Footer
        onNavigate={handleNavigate}
        onOpenSizeGuide={() => setSizeGuideOpen(true)}
        onShowToast={showToast}
      />

      {/* Drawers & Modals */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
      />

      <CartAndCheckoutModal
        isOpen={cartModalOpen}
        initialMode={cartInitialMode}
        onClose={() => setCartModalOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
        onExploreCatalog={() => handleNavigate('women')}
      />

      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        wishlistIds={wishlistIds}
        onToggleWishlist={handleToggleWishlist}
        onSelectProduct={handleSelectProduct}
        onAddToBag={handleAddToBag}
      />

      {/* Editorial Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-5 py-3.5 rounded-DEFAULT shadow-lg border border-border-ecru/20 flex items-center gap-3 max-w-sm animate-fade-in">
          <span className="font-body-sm text-xs tracking-wide">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-on-primary/70 hover:text-on-primary cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
