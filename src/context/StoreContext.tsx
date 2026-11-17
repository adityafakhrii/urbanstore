import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { PRODUCTS, Product } from '../data/products';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from '../utils/storage';
import { useAuth } from './AuthContext';
import {
  CartItem,
  OrderRecord,
  fetchCatalogProducts,
  syncGuestWishlistToDb,
  syncGuestCartToDb,
  fetchCustomerOrders,
  setWishlistItemInDb,
  upsertCartItemInDb,
  deleteCartItemInDb,
  clearUserCartInDb,
} from '../services/supabaseService';

interface StoreContextValue {
  products: Product[];
  catalogLoaded: boolean;
  useSupabaseDb: boolean;
  cartItems: CartItem[];
  wishlistIds: string[];
  orders: OrderRecord[];
  totalCartCount: number;
  sizeGuideOpen: boolean;
  setSizeGuideOpen: (open: boolean) => void;
  toastMessage: string | null;
  dismissToast: () => void;
  showToast: (msg: string) => void;
  loadCatalog: () => Promise<void>;
  addToBag: (product: Product, size: string, colorName?: string) => void;
  updateQuantity: (productId: string, size: string, color: string, delta: number) => void;
  removeCartItem: (productId: string, size: string, color: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  addOrder: (order: OrderRecord) => void;
  updateOrder: (updated: OrderRecord) => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [catalogLoaded, setCatalogLoaded] = useState<boolean>(false);
  const [useSupabaseDb, setUseSupabaseDb] = useState<boolean>(false);

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const prevUserIdRef = useRef<string | null>(null);

  const loadCatalog = useCallback(async () => {
    const res = await fetchCatalogProducts();
    setProducts(res.products);
    setUseSupabaseDb(res.fromSupabase);
    setCatalogLoaded(true);
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  // Restore guest local storage on logout
  useEffect(() => {
    const currentId = user?.id ?? null;
    if (prevUserIdRef.current && !currentId) {
      setCartItems(loadFromStorage<CartItem[]>(STORAGE_KEYS.cart, []));
      setWishlistIds(loadFromStorage<string[]>(STORAGE_KEYS.wishlist, []));
      setOrders(loadFromStorage<OrderRecord[]>(STORAGE_KEYS.orders, []));
    }
    prevUserIdRef.current = currentId;
  }, [user]);

  // Sync user data with Supabase on login
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

  // Guest local persistence
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

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3200);
  }, []);

  const dismissToast = useCallback(() => setToastMessage(null), []);

  const addToBag = useCallback(
    (product: Product, size: string, colorName?: string) => {
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
    },
    [user, useSupabaseDb, showToast]
  );

  const updateQuantity = useCallback(
    (productId: string, size: string, color: string, delta: number) => {
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
    },
    [user, useSupabaseDb]
  );

  const removeCartItem = useCallback(
    (productId: string, size: string, color: string) => {
      setCartItems((prev) =>
        prev.filter((item) => !(item.product.id === productId && item.size === size && item.color === color))
      );
      if (user && useSupabaseDb) {
        void deleteCartItemInDb(user.id, productId, size, color);
      }
    },
    [user, useSupabaseDb]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    if (user && useSupabaseDb) {
      void clearUserCartInDb(user.id);
    }
  }, [user, useSupabaseDb]);

  const toggleWishlist = useCallback(
    (productId: string) => {
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
    },
    [products, wishlistIds, user, useSupabaseDb, showToast]
  );

  const addOrder = useCallback(
    (order: OrderRecord) => {
      setOrders((prev) => [order, ...prev]);
      if (user && useSupabaseDb) {
        void fetchCustomerOrders(user.id).then((fresh) => {
          if (fresh.length > 0) setOrders(fresh);
        });
      }
    },
    [user, useSupabaseDb]
  );

  const updateOrder = useCallback((updated: OrderRecord) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }, []);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        products,
        catalogLoaded,
        useSupabaseDb,
        cartItems,
        wishlistIds,
        orders,
        totalCartCount,
        sizeGuideOpen,
        setSizeGuideOpen,
        toastMessage,
        dismissToast,
        showToast,
        loadCatalog,
        addToBag,
        updateQuantity,
        removeCartItem,
        clearCart,
        toggleWishlist,
        addOrder,
        updateOrder,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return ctx;
}
