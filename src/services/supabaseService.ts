import { supabase } from '../lib/supabase';
import { PRODUCTS, Product } from '../data/products';
import { compressImageToWebp } from '../utils/image';

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

export interface OrderItemSummary {
  productName: string;
  productSku: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export type CourierType = 'free' | 'reguler' | 'sameday' | 'instant';

export type PaymentMethodType =
  | 'Mayar Payment Gateway'
  | 'QRIS'
  | 'BCA Virtual Account'
  | 'Mandiri'
  | 'Visa / Mastercard';

export interface OrderRecord {
  id: string;
  dbId?: string;
  createdAt: string;
  fullName: string;
  email?: string;
  whatsapp: string;
  province?: string;
  city: string;
  district?: string;
  address: string;
  postalCode?: string;
  deliveryNotes?: string;
  courier: CourierType;
  paymentMethod: PaymentMethodType;
  paymentGateway?: string;
  subtotal?: number;
  discount?: number;
  shippingCost?: number;
  total: number;
  itemsCount: number;
  status?: OrderStatusType;
  trackingNumber?: string;
  shippingExpedition?: string;
  paymentProofUrl?: string;
  paymentExpiresAt?: string;
  paidAt?: string;
  mayarInvoiceId?: string;
  mayarTransactionId?: string;
  mayarPaymentLink?: string;
  mayarPaymentStatus?: string;
  mayarPaymentMethod?: string;
  mayarVerifiedAt?: string;
  items?: OrderItemSummary[];
}

export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  whatsapp: string;
  role: UserRole;
  default_province: string;
  default_city: string;
  default_district: string;
  default_address: string;
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

export type OrderStatusType =
  | 'pending'
  | 'waiting_verification'
  | 'paid'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'expired';

export interface AdminOrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  full_name: string;
  email: string;
  whatsapp: string;
  province: string;
  city: string;
  district: string;
  address: string;
  postal_code: string;
  delivery_notes: string;
  courier: CourierType;
  payment_method: PaymentMethodType;
  payment_gateway?: string | null;
  promo_code: string | null;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  total: number;
  status: OrderStatusType;
  tracking_number: string | null;
  shipping_expedition?: string | null;
  payment_proof_url: string | null;
  payment_expires_at: string;
  paid_at: string | null;
  mayar_invoice_id?: string | null;
  mayar_transaction_id?: string | null;
  mayar_payment_link?: string | null;
  mayar_payment_status?: string | null;
  mayar_payment_method?: string | null;
  mayar_verified_at?: string | null;
  stock_deducted?: boolean | null;
  created_at: string;
  order_items?: {
    id: string;
    product_name: string;
    product_sku: string;
    size: string;
    color: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }[];
}

export interface SizeGuideRow {
  id: number;
  garment_type: 'tops' | 'bottoms' | 'shoes';
  size_label: string;
  chest_cm: number | null;
  waist_cm: number | null;
  length_cm: number | null;
  foot_cm: number | null;
  min_weight_kg: number | null;
  max_weight_kg: number | null;
  sort_order: number;
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

export function formatThousandDot(amount: number | string): string {
  const num =
    typeof amount === 'number'
      ? Math.max(0, Math.round(amount))
      : Number(String(amount).replace(/\D/g, '')) || 0;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatRupiah(amount: number): string {
  return `Rp ${formatThousandDot(amount)}`;
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
  if (!supabase) return { products: [], fromSupabase: false };

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data) {
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
  province: string;
  city: string;
  district: string;
  address: string;
  postalCode: string;
  deliveryNotes: string;
  courier: CourierType;
  paymentMethod: PaymentMethodType;
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
    p_province: payload.province,
    p_city: payload.city,
    p_district: payload.district,
    p_address: payload.address,
    p_postal_code: payload.postalCode,
    p_delivery_notes: payload.deliveryNotes,
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
      dbId: data.id as string,
      createdAt: new Date(data.created_at as string).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      fullName: payload.fullName,
      email: payload.email,
      whatsapp: payload.whatsapp,
      province: payload.province,
      city: payload.city,
      district: payload.district,
      address: payload.address,
      postalCode: payload.postalCode,
      deliveryNotes: payload.deliveryNotes,
      courier: payload.courier,
      paymentMethod: payload.paymentMethod,
      subtotal: data.subtotal as number,
      discount: data.discount as number,
      shippingCost: data.shipping_cost as number,
      total: data.total as number,
      itemsCount: data.items_count as number,
      status: (data.status as OrderRecord['status']) || 'pending',
      paymentExpiresAt: data.payment_expires_at as string,
      items: payload.items.map((item) => ({
        productName: item.product.name,
        productSku: item.product.sku,
        size: item.size,
        color: item.color,
        unitPrice: item.product.price,
        quantity: item.quantity,
        lineTotal: item.product.price * item.quantity,
      })),
    },
  };
}

export async function submitPaymentProofInDb(
  orderDbId: string,
  proofUrl: string
): Promise<{ status?: OrderStatusType; paymentProofUrl?: string; error?: string }> {
  if (!supabase) {
    return { error: 'Supabase belum terkonfigurasi.' };
  }
  const { data, error } = await supabase.rpc('submit_payment_proof', {
    p_order_id: orderDbId,
    p_proof_url: proofUrl,
  });

  if (error || !data) {
    return { error: error?.message || 'Gagal mengirim bukti pembayaran.' };
  }

  return {
    status: data.status as OrderStatusType,
    paymentProofUrl: data.payment_proof_url as string,
  };
}

function mapDbOrderToOrderRecord(row: Record<string, unknown>): OrderRecord {
  const rawItems =
    (row.order_items as {
      product_name: string;
      product_sku: string;
      size: string;
      color: string;
      unit_price: number;
      quantity: number;
      line_total: number;
    }[]) || [];
  const itemsCount = rawItems.reduce((sum, i) => sum + i.quantity, 0);
  return {
    id: row.order_number as string,
    dbId: row.id as string,
    createdAt: new Date(row.created_at as string).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    fullName: row.full_name as string,
    email: row.email as string,
    whatsapp: row.whatsapp as string,
    province: (row.province as string) || '',
    city: row.city as string,
    district: (row.district as string) || '',
    address: row.address as string,
    postalCode: (row.postal_code as string) || '',
    deliveryNotes: (row.delivery_notes as string) || '',
    courier: row.courier as OrderRecord['courier'],
    paymentMethod: row.payment_method as OrderRecord['paymentMethod'],
    paymentGateway: (row.payment_gateway as string | null) ?? undefined,
    subtotal: row.subtotal as number,
    discount: row.discount as number,
    shippingCost: row.shipping_cost as number,
    total: row.total as number,
    itemsCount,
    status: row.status as OrderRecord['status'],
    trackingNumber: (row.tracking_number as string | null) ?? undefined,
    shippingExpedition: (row.shipping_expedition as string | null) ?? undefined,
    paymentProofUrl: (row.payment_proof_url as string | null) ?? undefined,
    paymentExpiresAt: (row.payment_expires_at as string | null) ?? undefined,
    paidAt: (row.paid_at as string | null) ?? undefined,
    mayarInvoiceId: (row.mayar_invoice_id as string | null) ?? undefined,
    mayarTransactionId: (row.mayar_transaction_id as string | null) ?? undefined,
    mayarPaymentLink: (row.mayar_payment_link as string | null) ?? undefined,
    mayarPaymentStatus: (row.mayar_payment_status as string | null) ?? undefined,
    mayarPaymentMethod: (row.mayar_payment_method as string | null) ?? undefined,
    mayarVerifiedAt: (row.mayar_verified_at as string | null) ?? undefined,
    items: rawItems.map((i) => ({
      productName: i.product_name,
      productSku: i.product_sku,
      size: i.size,
      color: i.color,
      unitPrice: i.unit_price,
      quantity: i.quantity,
      lineTotal: i.line_total,
    })),
  };
}

const ORDER_SELECT_COLUMNS_WITH_MAYAR =
  'id, order_number, created_at, full_name, email, whatsapp, province, city, district, address, postal_code, delivery_notes, courier, payment_method, payment_gateway, subtotal, discount, shipping_cost, total, status, tracking_number, shipping_expedition, payment_proof_url, payment_expires_at, paid_at, mayar_invoice_id, mayar_transaction_id, mayar_payment_link, mayar_payment_status, mayar_payment_method, mayar_verified_at, order_items(product_name, product_sku, size, color, unit_price, quantity, line_total)';

const ORDER_SELECT_COLUMNS_LEGACY =
  'id, order_number, created_at, full_name, email, whatsapp, province, city, district, address, postal_code, delivery_notes, courier, payment_method, subtotal, discount, shipping_cost, total, status, tracking_number, payment_proof_url, payment_expires_at, paid_at, order_items(product_name, product_sku, size, color, unit_price, quantity, line_total)';

function isMissingExpeditionColError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  const msg = err.message || '';
  return (
    err.code === '42703' ||
    err.code === 'PGRST204' ||
    msg.includes('shipping_expedition') ||
    msg.includes('mayar_') ||
    msg.includes('payment_gateway')
  );
}

export async function fetchCustomerOrders(userId: string): Promise<OrderRecord[]> {
  if (!supabase) return [];
  const primary = await supabase
    .from('orders')
    .select(ORDER_SELECT_COLUMNS_WITH_MAYAR)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  let rows: unknown[] | null = primary.data as unknown[] | null;
  let queryError = primary.error;

  if (isMissingExpeditionColError(queryError)) {
    const fallback = await supabase
      .from('orders')
      .select(ORDER_SELECT_COLUMNS_LEGACY)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    rows = fallback.data as unknown[] | null;
    queryError = fallback.error;
  }

  if (queryError || !rows) return [];
  return rows.map((row) => mapDbOrderToOrderRecord(row as Record<string, unknown>));
}

export async function fetchOrderByNumberFromDb(orderNumber: string): Promise<OrderRecord | null> {
  if (!supabase) return null;
  const primary = await supabase
    .from('orders')
    .select(ORDER_SELECT_COLUMNS_WITH_MAYAR)
    .eq('order_number', orderNumber)
    .maybeSingle();

  let row: unknown = primary.data;
  let queryError = primary.error;

  if (isMissingExpeditionColError(queryError)) {
    const fallback = await supabase
      .from('orders')
      .select(ORDER_SELECT_COLUMNS_LEGACY)
      .eq('order_number', orderNumber)
      .maybeSingle();
    row = fallback.data;
    queryError = fallback.error;
  }

  if (queryError || !row) return null;
  return mapDbOrderToOrderRecord(row as Record<string, unknown>);
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
export async function fetchProductVariants(productId: string): Promise<ProductVariantRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId);
  if (error || !data) return [];
  return data as ProductVariantRow[];
}

export async function fetchSizeGuides(): Promise<SizeGuideRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('size_guides')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error || !data) return [];
  return data as SizeGuideRow[];
}

export async function fetchAllOrdersAdmin(): Promise<AdminOrderRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(id, product_name, product_sku, size, color, unit_price, quantity, line_total)')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as AdminOrderRow[];
}

export async function updateOrderAdmin(
  orderId: string,
  updates: {
    status: AdminOrderRow['status'];
    tracking_number?: string | null;
    shipping_expedition?: string | null;
    paid_at?: string | null;
  }
): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase belum aktif.' };
  let { error } = await supabase.from('orders').update(updates).eq('id', orderId);
  if (isMissingExpeditionColError(error)) {
    const { shipping_expedition, tracking_number, ...rest } = updates;
    const combinedTracking =
      shipping_expedition && tracking_number
        ? `${shipping_expedition} - ${tracking_number}`
        : tracking_number;
    ({ error } = await supabase
      .from('orders')
      .update({ ...rest, tracking_number: combinedTracking ?? null })
      .eq('id', orderId));
  }
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

export interface CreateProductInput {
  id: string;
  sku: string;
  name: string;
  price: number;
  subtitle: string;
  category: Product['category'];
  subcategory: Product['subcategory'];
  bestsellerTab?: Product['bestsellerTab'];
  image: string;
  gallery: string[];
  badgeText?: string;
  fitNote: string;
  fabricType: Product['fabricType'];
  colors: Product['colors'];
  sizes: string[];
  defaultSize: string;
  inStock: boolean;
  stockLabel: string;
  description: string;
  fabricDetails: string[];
  careInstructions: string[];
  modelInfo: string;
  fitScale: Product['fitScale'];
  initialStock: number;
}

async function uploadCompressedWebpToBucket(
  bucket: string,
  folder: string,
  rawFile: File,
  migrationHint: string
): Promise<{
  url?: string;
  originalBytes?: number;
  compressedBytes?: number;
  error?: string;
}> {
  if (!supabase) return { error: 'Supabase belum terkonfigurasi.' };

  let compressed;
  try {
    compressed = await compressImageToWebp(rawFile);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal memproses gambar.' };
  }

  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const filePath = `${folder}/${safeName}`;

  const { error } = await supabase.storage.from(bucket).upload(filePath, compressed.file, {
    contentType: 'image/webp',
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    const isBucketMissing = error.message.toLowerCase().includes('bucket');
    return {
      error: isBucketMissing
        ? `Bucket '${bucket}' belum ada di Supabase Storage. Jalankan SQL ${migrationHint} di Supabase SQL Editor.`
        : error.message,
    };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return {
    url: data.publicUrl,
    originalBytes: compressed.originalBytes,
    compressedBytes: compressed.compressedBytes,
  };
}

export async function uploadProductImageAdmin(rawFile: File) {
  return uploadCompressedWebpToBucket(
    'product-images',
    'products',
    rawFile,
    '002_storage_product_images.sql'
  );
}

export async function uploadPaymentProofImage(rawFile: File) {
  return uploadCompressedWebpToBucket(
    'payment-proofs',
    'proofs',
    rawFile,
    '003_checkout_payment_invoice.sql'
  );
}

export async function createProductAdmin(
  input: CreateProductInput
): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase belum aktif.' };

  const badges = input.badgeText?.trim()
    ? [{ text: input.badgeText.trim().toUpperCase(), variant: 'primary' as const }]
    : [];

  const { error: prodErr } = await supabase.from('products').insert({
    id: input.id,
    sku: input.sku,
    name: input.name,
    price: input.price,
    subtitle: input.subtitle,
    category: input.category,
    subcategory: input.subcategory,
    bestseller_tab: input.bestsellerTab || null,
    image: input.image,
    gallery: input.gallery.length > 0 ? input.gallery : [input.image],
    alt: input.name,
    badges,
    fit_note: input.fitNote,
    fabric_type: input.fabricType,
    colors: input.colors,
    sizes: input.sizes,
    default_size: input.defaultSize,
    disabled_sizes: [],
    in_stock: input.inStock,
    stock_label: input.stockLabel,
    description: input.description,
    fabric_details: input.fabricDetails,
    care_instructions: input.careInstructions,
    model_info: input.modelInfo,
    fit_scale: input.fitScale,
    is_active: true,
    sort_order: 0,
  });

  if (prodErr) return { error: prodErr.message };

  const variantRows = input.colors.flatMap((c) =>
    input.sizes.map((sz) => ({
      product_id: input.id,
      color_name: c.name,
      color_hex: c.hex,
      size: sz,
      stock_qty: Math.max(0, input.initialStock),
      is_available: input.initialStock > 0,
    }))
  );

  if (variantRows.length > 0) {
    const { error: varErr } = await supabase.from('product_variants').insert(variantRows);
    if (varErr) return { error: varErr.message };
  }

  return {};
}

export async function updateProductAdmin(
  productId: string,
  input: Omit<CreateProductInput, 'id'>
): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase belum aktif.' };

  const badges = input.badgeText?.trim()
    ? [{ text: input.badgeText.trim().toUpperCase(), variant: 'primary' as const }]
    : [];

  const { error: prodErr } = await supabase
    .from('products')
    .update({
      sku: input.sku,
      name: input.name,
      price: input.price,
      subtitle: input.subtitle,
      category: input.category,
      subcategory: input.subcategory,
      bestseller_tab: input.bestsellerTab || null,
      image: input.image,
      gallery: input.gallery.length > 0 ? input.gallery : [input.image],
      alt: input.name,
      badges,
      fit_note: input.fitNote,
      fabric_type: input.fabricType,
      colors: input.colors,
      sizes: input.sizes,
      default_size: input.defaultSize,
      in_stock: input.inStock,
      stock_label: input.stockLabel,
      description: input.description,
      fabric_details: input.fabricDetails,
      care_instructions: input.careInstructions,
      model_info: input.modelInfo,
      fit_scale: input.fitScale,
    })
    .eq('id', productId);

  if (prodErr) return { error: prodErr.message };

  // Add any newly introduced color/size combinations without overwriting existing stock
  const variantRows = input.colors.flatMap((c) =>
    input.sizes.map((sz) => ({
      product_id: productId,
      color_name: c.name,
      color_hex: c.hex,
      size: sz,
      stock_qty: Math.max(0, input.initialStock),
      is_available: input.initialStock > 0,
    }))
  );

  if (variantRows.length > 0) {
    await supabase
      .from('product_variants')
      .upsert(variantRows, { onConflict: 'product_id,color_name,size', ignoreDuplicates: true });
  }

  return {};
}

export async function deleteProductAdmin(productId: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase belum aktif.' };
  const { error } = await supabase.from('products').delete().eq('id', productId);
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

export async function createPromoAdmin(promo: {
  code: string;
  description: string;
  discount_amount: number;
  min_subtotal: number;
}): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase belum aktif.' };
  const { error } = await supabase.from('promos').insert({
    code: promo.code.trim().toUpperCase(),
    description: promo.description.trim(),
    discount_amount: promo.discount_amount,
    min_subtotal: promo.min_subtotal,
    is_active: true,
  });
  return error ? { error: error.message } : {};
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
