/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { PRODUCTS, Product } from './data/products';
import { Header, ActivePage } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { CatalogView } from './components/CatalogView';
import { ProductDetailView } from './components/ProductDetailView';
import { SizeGuideModal } from './components/SizeGuideModal';
import type { CartItem, OrderRecord } from './components/CartAndCheckoutModal';
import { WishlistDrawer } from './components/WishlistDrawer';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from './utils/storage';

const CartAndCheckoutModal = lazy(() =>
  import('./components/CartAndCheckoutModal').then((m) => ({ default: m.CartAndCheckoutModal }))
);
const AuthModal = lazy(() =>
  import('./components/AuthModal').then((m) => ({ default: m.AuthModal }))
);
const AdminDashboardView = lazy(() =>
  import('./components/AdminDashboardView').then((m) => ({ default: m.AdminDashboardView }))
);
import { useAuth } from './context/AuthContext';
import {
  fetchCatalogProducts,
  syncGuestWishlistToDb,
  syncGuestCartToDb,
  fetchCustomerOrders,
  setWishlistItemInDb,
  upsertCartItemInDb,
  deleteCartItemInDb,
  clearUserCartInDb,
} from './services/supabaseService';

export default function App() {
  const { user, isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [useSupabaseDb, setUseSupabaseDb] = useState<boolean>(false);

  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [cartItems, setCartItems] = useState<CartItem[]>(() =>
    loadFromStorage<CartItem[]>(STORAGE_KEYS.cart, [])
  );
  const [wishlistIds, setWishlistIds] = useState<string[]>(() =>
    loadFromStorage<string[]>(STORAGE_KEYS.wishlist, [])
  );
  const [orders, setOrders] = useState<OrderRecord[]>(() =>
    loadFromStorage<OrderRecord[]>(STORAGE_KEYS.orders, [])
  );

  const [sizeGuideOpen, setSizeGuideOpen] = useState<boolean>(false);
  const [cartModalOpen, setCartModalOpen] = useState<boolean>(false);
  const [cartInitialMode, setCartInitialMode] = useState<'bag' | 'checkout' | 'orders'>('bag');
  const [wishlistOpen, setWishlistOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const prevUserIdRef = useRef<string | null>(null);

  const loadCatalog = useCallback(async () => {
    const res = await fetchCatalogProducts();
    setProducts(res.products);
    setUseSupabaseDb(res.fromSupabase);
    setSelectedProduct((prev) => res.products.find((p) => p.id === prev.id) || res.products[0]);
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  // Handle logout transition cleanly (restore guest storage & leave admin view)
  useEffect(() => {
    const currentId = user?.id ?? null;
    if (prevUserIdRef.current && !currentId) {
      setCartItems(loadFromStorage<CartItem[]>(STORAGE_KEYS.cart, []));
      setWishlistIds(loadFromStorage<string[]>(STORAGE_KEYS.wishlist, []));
      setOrders(loadFromStorage<OrderRecord[]>(STORAGE_KEYS.orders, []));
      setActivePage((prev) => (prev === 'admin' ? 'home' : prev));
    }
    prevUserIdRef.current = currentId;
  }, [user]);

  // Sync user cart, wishlist, and order history with Supabase when logged in
  useEffect(() => {
    if (!user || !useSupabaseDb) return;

    let active = true;
    const syncUserData = async () => {
      const guestCart = loadFromStorage<CartItem[]>(STORAGE_KEYS.cart, []);
      const guestWishlist = loadFromStorage<string[]>(STORAGE_KEYS.wishlist, []);

      const [syncedCart, syncedWishlist, dbOrders] = await Promise.all([
        syncGuestCartToDb(user.id, guestCart, products),
        syncGuestWishlistToDb(user.id, guestWishlist),
        fetchCustomerOrders(user.id),
      ]);

      if (!active) return;
      setCartItems(syncedCart);
      setWishlistIds(syncedWishlist);
      setOrders(dbOrders);
      saveToStorage(STORAGE_KEYS.cart, []);
      saveToStorage(STORAGE_KEYS.wishlist, []);
    };

    void syncUserData();
    return () => {
      active = false;
    };
  }, [user, useSupabaseDb, products]);

  // Persist guest cart/wishlist/orders locally when not authenticated (or DB fallback)
  useEffect(() => {
    if (!user || !useSupabaseDb) {
      saveToStorage(STORAGE_KEYS.cart, cartItems);
    }
  }, [cartItems, user, useSupabaseDb]);

  useEffect(() => {
    if (!user || !useSupabaseDb) {
      saveToStorage(STORAGE_KEYS.wishlist, wishlistIds);
    }
  }, [wishlistIds, user, useSupabaseDb]);

  useEffect(() => {
    if (!user || !useSupabaseDb) {
      saveToStorage(STORAGE_KEYS.orders, orders);
    }
  }, [orders, user, useSupabaseDb]);

  const showToast = (msg: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3200);
  };

  const handleNavigate = (page: ActivePage) => {
    if (page === 'admin' && !isAdmin) {
      showToast('Halaman Admin khusus untuk role admin.');
      return;
    }
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
    let nextQuantity = 1;
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.size === size && item.color === color
      );
      if (existingIndex > -1) {
        nextQuantity = prev[existingIndex].quantity + 1;
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: nextQuantity,
        };
        return updated;
      }
      return [...prev, { product, size, color, quantity: 1 }];
    });
    if (user && useSupabaseDb) {
      void upsertCartItemInDb(user.id, product.id, size, color, nextQuantity);
    }
    showToast(`✓ ${product.name} (${color}, Size ${size}) masuk ke Bag!`);
  };

  const handleBuyNow = (product: Product, size: string, colorName?: string) => {
    handleAddToBag(product, size, colorName);
    setCartInitialMode('checkout');
    setCartModalOpen(true);
  };

  const handleUpdateQuantity = (productId: string, size: string, color: string, delta: number) => {
    let nextQuantityForDb: number | null = null;
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.size === size && item.color === color) {
            const nextQty = item.quantity + delta;
            nextQuantityForDb = nextQty;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
    if (user && useSupabaseDb && nextQuantityForDb !== null) {
      void upsertCartItemInDb(user.id, productId, size, color, nextQuantityForDb);
    }
  };

  const handleRemoveCartItem = (productId: string, size: string, color: string) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.size === size && item.color === color))
    );
    if (user && useSupabaseDb) {
      void deleteCartItemInDb(user.id, productId, size, color);
    }
  };

  const handleClearCart = () => {
    setCartItems([]);
    if (user && useSupabaseDb) {
      void clearUserCartInDb(user.id);
    }
  };

  const handleOrderComplete = (order: OrderRecord) => {
    setOrders((prev) => [order, ...prev]);
    if (user && useSupabaseDb) {
      void fetchCustomerOrders(user.id).then((fresh) => {
        if (fresh.length > 0) setOrders(fresh);
      });
    }
  };

  const handleToggleWishlist = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const exists = wishlistIds.includes(productId);
    setWishlistIds((prev) => {
      if (exists) {
        if (prod) showToast(`${prod.name} dihapus dari Wishlist.`);
        return prev.filter((id) => id !== productId);
      } else {
        if (prod) showToast(`♥ ${prod.name} disimpan ke Wishlist!`);
        return [...prev, productId];
      }
    });
    if (user && useSupabaseDb) {
      void setWishlistItemInDb(user.id, productId, !exists);
    }
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
        onOpenOrders={() => {
          setCartInitialMode('orders');
          setCartModalOpen(true);
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenSizeGuide={() => setSizeGuideOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="w-full pt-28 bg-surface flex-1">
        {activePage === 'home' && (
          <HomeView
            products={products}
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
            products={products}
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
            products={products}
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
            onAddToBag={handleAddToBag}
            onBuyNow={handleBuyNow}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            onOpenSizeGuide={() => setSizeGuideOpen(true)}
          />
        )}

        {activePage === 'admin' && (
          <Suspense
            fallback={
              <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin py-16 text-center text-sm text-text-muted">
                Memuat Admin Atelier Dashboard...
              </div>
            }
          >
            <AdminDashboardView
              products={products}
              onRefreshCatalog={loadCatalog}
              onBackToStore={() => handleNavigate('home')}
              onShowToast={showToast}
            />
          </Suspense>
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

      <Suspense fallback={null}>
        <CartAndCheckoutModal
          isOpen={cartModalOpen}
          initialMode={cartInitialMode}
          useSupabaseDb={useSupabaseDb}
          onClose={() => setCartModalOpen(false)}
          cartItems={cartItems}
          orders={orders}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          onOrderComplete={handleOrderComplete}
          onExploreCatalog={() => handleNavigate('curated-drops')}
        />
      </Suspense>

      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        products={products}
        wishlistIds={wishlistIds}
        onToggleWishlist={handleToggleWishlist}
        onSelectProduct={handleSelectProduct}
        onAddToBag={handleAddToBag}
      />

      <Suspense fallback={null}>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onOpenOrders={() => {
            setCartInitialMode('orders');
            setCartModalOpen(true);
          }}
          onOpenAdmin={() => handleNavigate('admin')}
          onShowToast={showToast}
        />
      </Suspense>

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
