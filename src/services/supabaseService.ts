import { supabase } from '../lib/supabase';
import { PRODUCTS, Product } from '../data/products';
import type { CartItem, OrderRecord } from '../components/CartAndCheckoutModal';

export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  whatsapp: string;
  role: UserRole;
  default_address: string;
  default_city: string;
  default_postal_code: string;
}

export interface ProductVariantRow {
  id: string;
  product_id: string;
  color_name: string;
  color_hex: string;
  size: string;
  stock_qty: number;
  is_available: boolean;
}

export interface AdminOrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  full_name: string;
  email: string;
  whatsapp: string;
  address: string;
  city: string;
  postal_code: string;
  courier: 'reguler' | 'sameday' | 'instant';
  payment_method: 'QRIS' | 'BCA Virtual Account' | 'Mandiri' | 'Visa / Mastercard';
  promo_code: string | null;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  total: number;
  status: 'pending' | 'paid' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  tracking_number: string | null;
  created_at: string;
  order_items?: {
    id: string;
    product_name: string;
    product_sku: string;
    size: string;
    color: string;
    quantity: number;
    line_total: number;
  }[];
}

export interface PromoRow {
  code: string;
  description: string;
  discount_amount: number;
  min_subtotal: number;
  is_active: boolean;
}

export interface SubscriberRow {
  id: string;
  email: string;
  source: string;
  subscribed_at: string;
}

interface DbProductRow {
  id: string;
  sku: string;
  name: string;
  price: number;
  subtitle: string;
  category: Product['category'];
  subcategory: Product['subcategory'];
  bestseller_tab: Product['bestsellerTab'] | null;
  image: string;
  gallery: string[];
  alt: string;
  badges: Product['badges'];
  fit_note: string;
  fabric_type: Product['fabricType'];
  colors: Product['colors'];
  sizes: string[];
  default_size: string;
  disabled_sizes: string[];
  in_stock: boolean;
  stock_label: string | null;
  description: string;
  fabric_details: string[];
  care_instructions: string[];
  model_info: string;
  fit_scale: Product['fitScale'];
}

export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function mapDbProductToProduct(row: DbProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    price: row.price,
    priceFormatted: formatRupiah(row.price),
    subtitle: row.subtitle,
    category: row.category,
    subcategory: row.subcategory,
    bestsellerTab: row.bestseller_tab ?? undefined,
    image: row.image,
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    alt: row.alt,
    badges: Array.isArray(row.badges) ? row.badges : [],
    fitNote: row.fit_note,
    fabricType: row.fabric_type,
    colors: Array.isArray(row.colors) ? row.colors : [],
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    defaultSize: row.default_size,
    disabledSizes: Array.isArray(row.disabled_sizes) ? row.disabled_sizes : [],
    inStock: row.in_stock,
    stockLabel: row.stock_label ?? undefined,
    description: row.description,
    fabricDetails: Array.isArray(row.fabric_details) ? row.fabric_details : [],
    careInstructions: Array.isArray(row.care_instructions) ? row.care_instructions : [],
    modelInfo: row.model_info,
    fitScale: row.fit_scale,
  };
}

export async function fetchCatalogProducts(): Promise<{ products: Product[]; fromSupabase: boolean }> {
  if (!supabase) return { products: PRODUCTS, fromSupabase: false };

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data || data.length === 0) {
    return { products: PRODUCTS, fromSupabase: false };
  }

  return {
    products: (data as DbProductRow[]).map(mapDbProductToProduct),
    fromSupabase: true,
  };
}

// ============================================================================
// WISHLIST SYNC
// ============================================================================
export async function fetchUserWishlist(userId: string): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('wishlists')
    .select('product_id')
    .eq('user_id', userId);

  if (error || !data) return [];
  return data.map((row) => row.product_id as string);
}

export async function syncGuestWishlistToDb(userId: string, guestIds: string[]): Promise<string[]> {
  if (!supabase) return guestIds;
  if (guestIds.length > 0) {
    const rows = guestIds.map((product_id) => ({ user_id: userId, product_id }));
    await supabase.from('wishlists').upsert(rows, { onConflict: 'user_id,product_id' });
  }
  return fetchUserWishlist(userId);
}

export async function setWishlistItemInDb(userId: string, productId: string, shouldAdd: boolean): Promise<void> {
  if (!supabase) return;
  if (shouldAdd) {
    await supabase
      .from('wishlists')
      .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' });
  } else {
    await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
  }
}

// ============================================================================
// CART SYNC
// ============================================================================
export async function fetchUserCart(userId: string, catalog: Product[]): Promise<CartItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('cart_items')
    .select('product_id, size, color, quantity')
    .eq('user_id', userId);

  if (error || !data) return [];

  return data
    .map((row) => {
      const product = catalog.find((p) => p.id === row.product_id);
      if (!product) return null;
      return {
        product,
        size: row.size as string,
        color: row.color as string,
        quantity: row.quantity as number,
      };
    })
    .filter((item): item is CartItem => item !== null);
}

export async function syncGuestCartToDb(
  userId: string,
  guestCart: CartItem[],
  catalog: Product[]
): Promise<CartItem[]> {
  if (!supabase) return guestCart;
  if (guestCart.length > 0) {
    const existing = await fetchUserCart(userId, catalog);
    const mergedMap = new Map<string, CartItem>();
    existing.forEach((item) => {
      mergedMap.set(`${item.product.id}__${item.size}__${item.color}`, item);
    });
    guestCart.forEach((item) => {
      const key = `${item.product.id}__${item.size}__${item.color}`;
      const prev = mergedMap.get(key);
      mergedMap.set(key, {
        ...item,
        quantity: prev ? prev.quantity + item.quantity : item.quantity,
      });
    });

    const rows = Array.from(mergedMap.values()).map((item) => ({
      user_id: userId,
      product_id: item.product.id,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    }));

    await supabase.from('cart_items').upsert(rows, { onConflict: 'user_id,product_id,size,color' });
  }
  return fetchUserCart(userId, catalog);
}

export async function upsertCartItemInDb(
  userId: string,
  productId: string,
  size: string,
  color: string,
  quantity: number
): Promise<void> {
  if (!supabase) return;
  if (quantity <= 0) {
    await deleteCartItemInDb(userId, productId, size, color);
    return;
  }
  await supabase
    .from('cart_items')
    .upsert({ user_id: userId, product_id: productId, size, color, quantity }, { onConflict: 'user_id,product_id,size,color' });
}

export async function deleteCartItemInDb(
  userId: string,
  productId: string,
  size: string,
  color: string
): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('size', size)
    .eq('color', color);
}

export async function clearUserCartInDb(userId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('cart_items').delete().eq('user_id', userId);
}

// ============================================================================
// PROMO, CHECKOUT RPC & CUSTOMER ORDERS
// ============================================================================
export async function validatePromoInDb(
  code: string,
  subtotal: number
): Promise<{ valid: boolean; code?: string; discountAmount?: number; message?: string }> {
  if (!supabase) {
    return { valid: false, message: 'Supabase belum terkonfigurasi.' };
  }
  const { data, error } = await supabase.rpc('validate_promo', {
    p_code: code,
    p_subtotal: subtotal,
  });

  if (error || !data) {
    return { valid: false, message: 'Gagal memvalidasi kode promo.' };
  }

  return {
    valid: Boolean(data.valid),
    code: data.code as string | undefined,
    discountAmount: data.discount_amount as number | undefined,
    message: data.message as string | undefined,
  };
}

export async function placeOrderInDb(payload: {
  fullName: string;
  email: string;
  whatsapp: string;
  address: string;
  city: string;
  postalCode: string;
  courier: 'reguler' | 'sameday' | 'instant';
  paymentMethod: 'QRIS' | 'BCA Virtual Account' | 'Mandiri' | 'Visa / Mastercard';
  promoCode: string | null;
  items: CartItem[];
}): Promise<{ order?: OrderRecord; error?: string }> {
  if (!supabase) {
    return { error: 'Supabase belum terkonfigurasi.' };
  }

  const rpcItems = payload.items.map((item) => ({
    product_id: item.product.id,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
  }));

  const { data, error } = await supabase.rpc('place_order', {
    p_full_name: payload.fullName,
    p_email: payload.email,
    p_whatsapp: payload.whatsapp,
    p_address: payload.address,
    p_city: payload.city,
    p_postal_code: payload.postalCode,
    p_courier: payload.courier,
    p_payment_method: payload.paymentMethod,
    p_promo_code: payload.promoCode,
    p_items: rpcItems,
  });

  if (error || !data) {
    return { error: error?.message || 'Jaringan lagi ngadat nih. Santai, klik coba lagi ya.' };
  }

  return {
    order: {
      id: data.order_number as string,
      createdAt: new Date(data.created_at as string).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      fullName: payload.fullName,
      whatsapp: payload.whatsapp,
      address: payload.address,
      city: payload.city,
      courier: payload.courier,
      paymentMethod: payload.paymentMethod,
      total: data.total as number,
      itemsCount: data.items_count as number,
      status: (data.status as OrderRecord['status']) || 'pending',
    },
  };
}

export async function fetchCustomerOrders(userId: string): Promise<OrderRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, created_at, full_name, whatsapp, address, city, courier, payment_method, total, status, tracking_number, order_items(quantity)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const items = (row.order_items as { quantity: number }[]) || [];
    const itemsCount = items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      id: row.order_number as string,
      createdAt: new Date(row.created_at as string).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      fullName: row.full_name as string,
      whatsapp: row.whatsapp as string,
      address: row.address as string,
      city: row.city as string,
      courier: row.courier as OrderRecord['courier'],
      paymentMethod: row.payment_method as OrderRecord['paymentMethod'],
      total: row.total as number,
      itemsCount,
      status: row.status as OrderRecord['status'],
      trackingNumber: (row.tracking_number as string | null) ?? undefined,
    };
  });
}

export async function subscribeNewsletterInDb(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: true };
  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert({ email: email.trim().toLowerCase(), source: 'footer' }, { onConflict: 'email' });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ============================================================================
// ADMIN QUERIES & MUTATIONS (Protected by Supabase RLS is_admin())
// ============================================================================
export async function fetchAllOrdersAdmin(): Promise<AdminOrderRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(id, product_name, product_sku, size, color, quantity, line_total)')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as AdminOrderRow[];
}

export async function updateOrderAdmin(
  orderId: string,
  updates: { status: AdminOrderRow['status']; tracking_number?: string | null }
): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase belum aktif.' };
  const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
  return error ? { error: error.message } : {};
}

export async function fetchVariantsAdmin(): Promise<ProductVariantRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .order('product_id', { ascending: true });
  if (error || !data) return [];
  return data as ProductVariantRow[];
}

export async function updateVariantStockAdmin(
  variantId: string,
  stockQty: number
): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase belum aktif.' };
  const { error } = await supabase
    .from('product_variants')
    .update({ stock_qty: stockQty, is_available: stockQty > 0 })
    .eq('id', variantId);
  return error ? { error: error.message } : {};
}

export async function updateProductPriceStockAdmin(
  productId: string,
  updates: { price: number; in_stock: boolean }
): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase belum aktif.' };
  const { error } = await supabase.from('products').update(updates).eq('id', productId);
  return error ? { error: error.message } : {};
}

export async function fetchPromosAdmin(): Promise<PromoRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('promos').select('*').order('code', { ascending: true });
  if (error || !data) return [];
  return data as PromoRow[];
}

export async function togglePromoAdmin(code: string, isActive: boolean): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase belum aktif.' };
  const { error } = await supabase.from('promos').update({ is_active: isActive }).eq('code', code);
  return error ? { error: error.message } : {};
}

export async function fetchSubscribersAdmin(): Promise<SubscriberRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false });
  if (error || !data) return [];
  return data as SubscriberRow[];
}
