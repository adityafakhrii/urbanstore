import React, { useEffect, useState, useCallback } from 'react';
import {
  Product,
  PRODUCT_CATEGORIES,
  PRODUCT_SUBCATEGORIES,
  PRODUCT_FABRICS,
  PRODUCT_FIT_SCALES,
  PRODUCT_BESTSELLER_TABS,
} from '../data/products';
import { useAuth } from '../context/AuthContext';
import {
  AdminOrderRow,
  ProductVariantRow,
  PromoRow,
  SubscriberRow,
  fetchAllOrdersAdmin,
  fetchVariantsAdmin,
  fetchPromosAdmin,
  fetchSubscribersAdmin,
  updateOrderAdmin,
  updateVariantStockAdmin,
  updateProductPriceStockAdmin,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  uploadProductImageAdmin,
  createPromoAdmin,
  togglePromoAdmin,
  formatRupiah,
} from '../services/supabaseService';
import { MAX_IMAGE_SIZE_BYTES, formatBytes } from '../utils/image';
import type { OrderRecord } from './CartAndCheckoutModal';
import { InvoiceModal } from './InvoiceModal';

interface AdminDashboardViewProps {
  products: Product[];
  onRefreshCatalog: () => Promise<void>;
  onBackToStore: () => void;
  onShowToast: (msg: string) => void;
}

type AdminTab = 'orders' | 'inventory' | 'promos' | 'subscribers';

const ORDER_STATUS_OPTIONS: AdminOrderRow['status'][] = [
  'pending',
  'waiting_verification',
  'paid',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'expired',
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  products,
  onRefreshCatalog,
  onBackToStore,
  onShowToast,
}) => {
  const { isAdmin, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [variants, setVariants] = useState<ProductVariantRow[]>([]);
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);

  const [orderEdits, setOrderEdits] = useState<
    Record<string, { status: AdminOrderRow['status']; tracking: string }>
  >({});
  const [variantStockEdits, setVariantStockEdits] = useState<Record<string, number>>({});
  const [productPriceEdits, setProductPriceEdits] = useState<
    Record<string, { price: number; inStock: boolean }>
  >({});
  const [zoomedProofUrl, setZoomedProofUrl] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<OrderRecord | null>(null);

  // Create / Edit Product Form State
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newPrice, setNewPrice] = useState('450000');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState<Product['category']>('women');
  const [newSubcategory, setNewSubcategory] = useState<Product['subcategory']>('Dress & Setelan');
  const [newFabric, setNewFabric] = useState<Product['fabricType']>('Linen Organik');
  const [newFitScale, setNewFitScale] = useState<Product['fitScale']>('Pas Banget');
  const [newBestsellerTab, setNewBestsellerTab] = useState<string>('');
  const [newImage, setNewImage] = useState('');
  const [newGalleryUrls, setNewGalleryUrls] = useState<string[]>([]);
  const [newBadge, setNewBadge] = useState('DROP BARU');
  const [newColorName, setNewColorName] = useState('Natural Cream');
  const [newColorHex, setNewColorHex] = useState('#F5F2EB');
  const [newSizesText, setNewSizesText] = useState('S, M, L');
  const [newInitialStock, setNewInitialStock] = useState('10');
  const [newFitNote, setNewFitNote] = useState('True to size');
  const [newModelInfo, setNewModelInfo] = useState('Model TB 170cm memakai Size S.');
  const [newDescription, setNewDescription] = useState('');
  const [newFabricDetailsText, setNewFabricDetailsText] = useState('');
  const [newCareText, setNewCareText] = useState('');

  // Add Promo Form State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoDescInput, setPromoDescInput] = useState('');
  const [promoDiscountInput, setPromoDiscountInput] = useState('50000');
  const [promoMinInput, setPromoMinInput] = useState('0');

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    const [ordData, varData, promoData, subData] = await Promise.all([
      fetchAllOrdersAdmin(),
      fetchVariantsAdmin(),
      fetchPromosAdmin(),
      fetchSubscribersAdmin(),
    ]);

    setOrders(ordData);
    setVariants(varData);
    setPromos(promoData);
    setSubscribers(subData);

    const nextOrdEdits: Record<string, { status: AdminOrderRow['status']; tracking: string }> = {};
    ordData.forEach((o) => {
      nextOrdEdits[o.id] = { status: o.status, tracking: o.tracking_number || '' };
    });
    setOrderEdits(nextOrdEdits);

    const nextVarEdits: Record<string, number> = {};
    varData.forEach((v) => {
      nextVarEdits[v.id] = v.stock_qty;
    });
    setVariantStockEdits(nextVarEdits);

    const nextProdEdits: Record<string, { price: number; inStock: boolean }> = {};
    products.forEach((p) => {
      nextProdEdits[p.id] = { price: p.price, inStock: p.inStock };
    });
    setProductPriceEdits(nextProdEdits);

    setLoading(false);
  }, [isAdmin, products]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  if (!isAdmin) {
    return (
      <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin py-20 text-center">
        <div className="max-w-md mx-auto bg-surface-card border border-border-ecru p-8">
          <span className="material-symbols-outlined text-[40px] text-error mb-3">lock</span>
          <h1 className="font-headline-md text-headline-md text-primary mb-2">Akses Khusus Admin</h1>
          <p className="font-body-md text-body-md text-text-muted mb-6">
            Halaman ini hanya bisa diakses oleh akun dengan role <strong>admin</strong>.
          </p>
          <button
            type="button"
            onClick={onBackToStore}
            className="px-6 py-3 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-wider cursor-pointer"
          >
            Kembali ke Store
          </button>
        </div>
      </div>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'expired')
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'waiting_verification'
  ).length;

  const mapAdminOrderToInvoice = (ord: AdminOrderRow): OrderRecord => ({
    id: ord.order_number,
    dbId: ord.id,
    createdAt: new Date(ord.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    fullName: ord.full_name,
    email: ord.email,
    whatsapp: ord.whatsapp,
    province: ord.province,
    city: ord.city,
    district: ord.district,
    address: ord.address,
    postalCode: ord.postal_code,
    deliveryNotes: ord.delivery_notes,
    courier: ord.courier,
    paymentMethod: ord.payment_method,
    subtotal: ord.subtotal,
    discount: ord.discount,
    shippingCost: ord.shipping_cost,
    total: ord.total,
    itemsCount: ord.order_items?.reduce((s, i) => s + i.quantity, 0) || 0,
    status: ord.status,
    trackingNumber: ord.tracking_number ?? undefined,
    paymentProofUrl: ord.payment_proof_url ?? undefined,
    paymentExpiresAt: ord.payment_expires_at,
    paidAt: ord.paid_at ?? undefined,
    items: ord.order_items?.map((i) => ({
      productName: i.product_name,
      productSku: i.product_sku,
      size: i.size,
      color: i.color,
      unitPrice: i.unit_price,
      quantity: i.quantity,
      lineTotal: i.line_total,
    })),
  });

  const handleConfirmPayment = async (ord: AdminOrderRow) => {
    const edit = orderEdits[ord.id];
    const res = await updateOrderAdmin(ord.id, {
      status: 'paid',
      paid_at: ord.paid_at || new Date().toISOString(),
      tracking_number: edit?.tracking.trim() || ord.tracking_number || null,
    });
    if (res.error) {
      onShowToast(`Gagal konfirmasi pembayaran: ${res.error}`);
      return;
    }
    onShowToast(`Pembayaran #${ord.order_number} dikonfirmasi LUNAS!`);
    await loadAdminData();
  };

  const handleSaveOrder = async (orderId: string) => {
    const edit = orderEdits[orderId];
    if (!edit) return;
    const existing = orders.find((o) => o.id === orderId);
    const shouldSetPaidAt =
      (edit.status === 'paid' || edit.status === 'packed' || edit.status === 'shipped' || edit.status === 'delivered') &&
      !existing?.paid_at;
    const res = await updateOrderAdmin(orderId, {
      status: edit.status,
      tracking_number: edit.tracking.trim() || null,
      ...(shouldSetPaidAt ? { paid_at: new Date().toISOString() } : {}),
    });
    if (res.error) {
      onShowToast(`Gagal update order: ${res.error}`);
      return;
    }
    onShowToast('Status pesanan & resi berhasil diperbarui!');
    await loadAdminData();
  };

  const handleSaveProduct = async (productId: string) => {
    const edit = productPriceEdits[productId];
    if (!edit) return;
    const res = await updateProductPriceStockAdmin(productId, {
      price: Number(edit.price) || 0,
      in_stock: edit.inStock,
    });
    if (res.error) {
      onShowToast(`Gagal update produk: ${res.error}`);
      return;
    }
    await onRefreshCatalog();
    onShowToast('Harga & status produk berhasil disimpan ke Supabase!');
  };

  const handleSaveVariantStock = async (variantId: string) => {
    const qty = Math.max(0, Number(variantStockEdits[variantId] ?? 0));
    const res = await updateVariantStockAdmin(variantId, qty);
    if (res.error) {
      onShowToast(`Gagal update stok varian: ${res.error}`);
      return;
    }
    onShowToast('Stok varian berhasil diperbarui!');
    await loadAdminData();
  };

  const handleTogglePromo = async (promo: PromoRow) => {
    const res = await togglePromoAdmin(promo.code, !promo.is_active);
    if (res.error) {
      onShowToast(`Gagal ubah promo: ${res.error}`);
      return;
    }
    onShowToast(`Promo ${promo.code} ${!promo.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`);
    await loadAdminData();
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setCompressionInfo(null);
    setNewName('');
    setNewSku('');
    setNewPrice('450000');
    setNewSubtitle('');
    setNewCategory('women');
    setNewSubcategory('Dress & Setelan');
    setNewFabric('Linen Organik');
    setNewFitScale('Pas Banget');
    setNewBestsellerTab('');
    setNewImage('');
    setNewGalleryUrls([]);
    setNewBadge('DROP BARU');
    setNewColorName('Natural Cream');
    setNewColorHex('#F5F2EB');
    setNewSizesText('S, M, L');
    setNewInitialStock('10');
    setNewFitNote('True to size');
    setNewModelInfo('Model TB 170cm memakai Size S.');
    setNewDescription('');
    setNewFabricDetailsText('');
    setNewCareText('');
  };

  const handleStartEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setCompressionInfo(null);
    setNewName(p.name);
    setNewSku(p.sku);
    setNewPrice(String(p.price));
    setNewSubtitle(p.subtitle);
    setNewCategory(p.category);
    setNewSubcategory(p.subcategory);
    setNewFabric(p.fabricType);
    setNewFitScale(p.fitScale);
    setNewBestsellerTab(p.bestsellerTab || '');
    setNewImage(p.image);
    setNewGalleryUrls(p.gallery.filter((url) => url !== p.image));
    setNewBadge(p.badges[0]?.text || '');
    setNewColorName(p.colors[0]?.name || 'Default');
    setNewColorHex(p.colors[0]?.hex || '#F5F2EB');
    setNewSizesText(p.sizes.join(', '));
    setNewInitialStock('10');
    setNewFitNote(p.fitNote);
    setNewModelInfo(p.modelInfo);
    setNewDescription(p.description);
    setNewFabricDetailsText(p.fabricDetails.join('\n'));
    setNewCareText(p.careInstructions.join('\n'));
    setShowProductForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'gallery' = 'main') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Format file harus berupa gambar.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      onShowToast('Ukuran gambar maksimal 5 MB.');
      return;
    }

    setUploadError(null);
    setUploadingImg(true);
    const res = await uploadProductImageAdmin(file);
    setUploadingImg(false);

    if (res.error || !res.url) {
      setUploadError(res.error || 'Upload gambar gagal.');
      onShowToast(`Upload gambar gagal: ${res.error || 'Pastikan bucket product-images sudah dibuat.'}`);
      return;
    }

    if (res.originalBytes && res.compressedBytes) {
      setCompressionInfo(
        `WebP terkompresi: ${formatBytes(res.originalBytes)} → ${formatBytes(res.compressedBytes)}`
      );
    }

    if (target === 'main') {
      setNewImage(res.url);
    } else {
      setNewGalleryUrls((prev) => [...prev, res.url!]);
    }
    onShowToast('Foto dikompres ke WebP & berhasil di-upload!');
  };

  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSizes = newSizesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (parsedSizes.length === 0) {
      onShowToast('Isi minimal 1 ukuran (contoh: S, M, L atau One Size).');
      return;
    }
    if (!newImage.trim()) {
      onShowToast('Masukkan URL foto produk atau upload gambar terlebih dahulu.');
      return;
    }

    const commonPayload = {
      sku: newSku.trim().toUpperCase(),
      name: newName.trim(),
      price: Math.max(0, Number(newPrice) || 0),
      subtitle: newSubtitle.trim() || `${newFabric} · ${newColorName}`,
      category: newCategory,
      subcategory: newSubcategory,
      bestsellerTab: newBestsellerTab ? (newBestsellerTab as Product['bestsellerTab']) : undefined,
      image: newImage.trim(),
      gallery: [newImage.trim(), ...newGalleryUrls.filter((u) => u && u !== newImage.trim())],
      badgeText: newBadge.trim() || undefined,
      fitNote: newFitNote.trim() || 'True to size',
      fabricType: newFabric,
      colors: [{ name: newColorName.trim() || 'Default', hex: newColorHex }],
      sizes: parsedSizes,
      defaultSize: parsedSizes[0],
      inStock: (Number(newInitialStock) || 0) > 0,
      stockLabel: 'Ready stock — langsung bungkus & kirim dlm 1-2 hari',
      description: newDescription.trim(),
      fabricDetails: newFabricDetailsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      careInstructions: newCareText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      modelInfo: newModelInfo.trim() || 'Lihat panduan ukuran Anti-Zonk.',
      fitScale: newFitScale,
      initialStock: Math.max(0, Number(newInitialStock) || 0),
    };

    setSavingProduct(true);
    let res: { error?: string };
    if (editingProductId) {
      res = await updateProductAdmin(editingProductId, commonPayload);
    } else {
      const slugBase = newName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const productId = `${slugBase || 'produk'}-${Date.now().toString(36).slice(-4)}`;
      res = await createProductAdmin({ id: productId, ...commonPayload });
    }
    setSavingProduct(false);

    if (res.error) {
      onShowToast(`Gagal menyimpan produk: ${res.error}`);
      return;
    }

    resetProductForm();
    setShowProductForm(false);

    await onRefreshCatalog();
    await loadAdminData();
    onShowToast(
      editingProductId
        ? 'Perubahan produk berhasil disimpan ke Supabase!'
        : 'Produk real berhasil ditambahkan ke database Supabase!'
    );
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Hapus produk "${product.name}" (${product.sku}) dari database?`)) return;
    const res = await deleteProductAdmin(product.id);
    if (res.error) {
      onShowToast(`Gagal menghapus produk: ${res.error}`);
      return;
    }
    await onRefreshCatalog();
    await loadAdminData();
    onShowToast(`Produk "${product.name}" telah dihapus.`);
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;
    const res = await createPromoAdmin({
      code: promoCodeInput,
      description: promoDescInput || `Potongan ${formatRupiah(Number(promoDiscountInput) || 0)}`,
      discount_amount: Math.max(1000, Number(promoDiscountInput) || 50000),
      min_subtotal: Math.max(0, Number(promoMinInput) || 0),
    });
    if (res.error) {
      onShowToast(`Gagal tambah promo: ${res.error}`);
      return;
    }
    setPromoCodeInput('');
    setPromoDescInput('');
    onShowToast('Kode promo baru berhasil ditambahkan!');
    await loadAdminData();
  };

  return (
    <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin py-space-xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border-ecru">
        <div>
          <span className="font-label-uppercase text-label-uppercase uppercase tracking-widest text-secondary block mb-1">
            ADMIN ATELIER · ROLE: ADMIN
          </span>
          <h1 className="font-headline-lg text-headline-lg text-primary">Dashboard Operasional UrbanStore</h1>
          <p className="font-body-sm text-text-muted mt-1">
            Masuk sebagai <strong>{profile?.full_name || profile?.email}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadAdminData()}
            className="px-4 py-2 border border-border-ecru bg-surface-card text-primary font-label-uppercase text-[11px] uppercase tracking-wider hover:border-primary cursor-pointer"
          >
            Refresh Data
          </button>
          <button
            type="button"
            onClick={onBackToStore}
            className="px-5 py-2 bg-primary text-on-primary font-label-uppercase text-[11px] uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
          >
            Lihat Storefront
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-surface-card border border-border-ecru">
          <span className="font-label-uppercase text-[10px] uppercase text-text-muted block mb-1">
            Total Pesanan
          </span>
          <span className="font-headline-md text-headline-md text-primary tabular-nums">{orders.length}</span>
        </div>
        <div className="p-5 bg-surface-card border border-border-ecru">
          <span className="font-label-uppercase text-[10px] uppercase text-text-muted block mb-1">
            Perlu Diproses
          </span>
          <span className="font-headline-md text-headline-md text-secondary tabular-nums">
            {pendingOrdersCount}
          </span>
        </div>
        <div className="p-5 bg-surface-card border border-border-ecru">
          <span className="font-label-uppercase text-[10px] uppercase text-text-muted block mb-1">
            Omzet Tercatat
          </span>
          <span className="font-headline-sm text-headline-sm text-primary tabular-nums">
            {formatRupiah(totalRevenue)}
          </span>
        </div>
        <div className="p-5 bg-surface-card border border-border-ecru">
          <span className="font-label-uppercase text-[10px] uppercase text-text-muted block mb-1">
            VIP Subscribers
          </span>
          <span className="font-headline-md text-headline-md text-primary tabular-nums">
            {subscribers.length}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border-ecru">
        {[
          { id: 'orders' as const, label: `Pesanan (${orders.length})` },
          { id: 'inventory' as const, label: `Produk & Stok (${products.length})` },
          { id: 'promos' as const, label: `Kode Promo (${promos.length})` },
          { id: 'subscribers' as const, label: `VIP Subscribers (${subscribers.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 font-label-uppercase text-[11px] uppercase tracking-wider whitespace-nowrap cursor-pointer ${
              activeTab === t.id
                ? 'bg-primary text-on-primary'
                : 'bg-surface-card border border-border-ecru text-on-surface hover:border-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center bg-surface-card border border-border-ecru text-text-muted text-sm">
          Memuat data operasional dari Supabase...
        </div>
      ) : (
        <>
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="p-12 text-center bg-surface-card border border-border-ecru text-text-muted text-sm">
                  Belum ada pesanan masuk di database Supabase.
                </div>
              ) : (
                orders.map((ord) => {
                  const edit = orderEdits[ord.id] || { status: ord.status, tracking: ord.tracking_number || '' };
                  return (
                    <div
                      key={ord.id}
                      className="p-5 bg-surface-card border border-border-ecru space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-ecru">
                        <div>
                          <span className="font-label-uppercase text-xs font-semibold text-primary">
                            #{ord.order_number}
                          </span>
                          <span className="text-xs text-text-muted ml-3">
                            {new Date(ord.created_at).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <span className="font-price-md text-price-md text-primary tabular-nums">
                          {formatRupiah(ord.total)} · {ord.payment_method}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="font-semibold text-primary">
                            {ord.full_name} ({ord.whatsapp})
                          </div>
                          <div className="text-text-muted">{ord.email}</div>
                          <div className="text-text-muted">
                            {ord.address}
                            {ord.district ? `, Kec. ${ord.district}` : ''}, {ord.city}
                            {ord.province ? `, ${ord.province}` : ''} {ord.postal_code}
                          </div>
                          <div className="text-text-muted">Kurir: {ord.courier.toUpperCase()}</div>
                          {ord.delivery_notes && (
                            <div className="text-secondary italic">Catatan: {ord.delivery_notes}</div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="font-semibold text-primary">Item Pesanan:</div>
                          {ord.order_items?.map((item) => (
                            <div key={item.id} className="text-text-muted">
                              • {item.quantity}x {item.product_name} ({item.color}, Size {item.size}) —{' '}
                              {formatRupiah(item.line_total)}
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <div className="font-semibold text-primary">Bukti Transfer &amp; Invoice:</div>
                          {ord.payment_proof_url ? (
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setZoomedProofUrl(ord.payment_proof_url)}
                                className="border border-border-ecru hover:border-primary overflow-hidden cursor-pointer shrink-0"
                                title="Klik untuk perbesar bukti transfer"
                              >
                                <img
                                  src={ord.payment_proof_url}
                                  alt={`Bukti bayar ${ord.order_number}`}
                                  className="w-14 h-16 object-cover"
                                />
                              </button>
                              <div className="space-y-1">
                                <span className="inline-block px-2 py-0.5 bg-surface-sand text-secondary text-[10px] font-label-uppercase uppercase">
                                  {ord.status === 'waiting_verification' ? 'Perlu Verifikasi' : ord.status}
                                </span>
                                <div className="text-[11px] text-text-muted">Klik gambar untuk zoom</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-text-muted italic">Belum ada bukti transfer</div>
                          )}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {(ord.status === 'pending' || ord.status === 'waiting_verification') && (
                              <button
                                type="button"
                                onClick={() => void handleConfirmPayment(ord)}
                                className="px-3 py-1.5 bg-status-stock text-white font-label-uppercase text-[10px] uppercase tracking-wider cursor-pointer hover:opacity-90"
                              >
                                ✓ Konfirmasi Lunas
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setInvoiceOrder(mapAdminOrderToInvoice(ord))}
                              className="px-3 py-1.5 border border-primary text-primary font-label-uppercase text-[10px] uppercase tracking-wider cursor-pointer hover:bg-surface-sand"
                            >
                              Invoice PDF
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border-ecru flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <select
                          value={edit.status}
                          onChange={(e) =>
                            setOrderEdits((prev) => ({
                              ...prev,
                              [ord.id]: { ...edit, status: e.target.value as AdminOrderRow['status'] },
                            }))
                          }
                          className="h-10 px-3 bg-surface-sand border border-border-ecru text-xs uppercase font-label-uppercase text-primary"
                        >
                          {ORDER_STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={edit.tracking}
                          onChange={(e) =>
                            setOrderEdits((prev) => ({
                              ...prev,
                              [ord.id]: { ...edit, tracking: e.target.value },
                            }))
                          }
                          placeholder="Nomor Resi Kurir (opsional)"
                          className="flex-1 h-10 px-3 bg-surface-card border border-border-ecru text-xs text-primary"
                        />
                        <button
                          type="button"
                          onClick={() => void handleSaveOrder(ord.id)}
                          className="h-10 px-5 bg-primary text-on-primary font-label-uppercase text-[11px] uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
                        >
                          Simpan Order
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm text-primary">
                  Daftar Produk Real ({products.length})
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    if (showProductForm) {
                      resetProductForm();
                      setShowProductForm(false);
                    } else {
                      resetProductForm();
                      setShowProductForm(true);
                    }
                  }}
                  className="px-4 py-2 bg-primary text-on-primary font-label-uppercase text-[11px] uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
                >
                  {showProductForm ? 'Tutup Form' : '+ Tambah Produk Baru'}
                </button>
              </div>

              {showProductForm && (
                <form
                  onSubmit={handleSaveProductForm}
                  className="p-6 bg-surface-sand border border-border-ecru space-y-4 text-xs"
                >
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    {editingProductId ? 'Edit Produk' : 'Tambah Produk Real'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-text-muted mb-1">Nama Produk *</label>
                      <input
                        required
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Contoh: Linen Relaxed Shirt"
                        className="w-full h-10 px-3 bg-surface-card border border-border-ecru text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-text-muted mb-1">SKU Unik *</label>
                      <input
                        required
                        type="text"
                        value={newSku}
                        onChange={(e) => setNewSku(e.target.value)}
                        placeholder="Contoh: US-W01"
                        className="w-full h-10 px-3 bg-surface-card border border-border-ecru text-primary uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-text-muted mb-1">Harga (IDR) *</label>
                      <input
                        required
                        type="number"
                        min={0}
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full h-10 px-3 bg-surface-card border border-border-ecru text-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-text-muted mb-1">Subtitle (Material &amp; Warna)</label>
                      <input
                        type="text"
                        value={newSubtitle}
                        onChange={(e) => setNewSubtitle(e.target.value)}
                        placeholder="100% Organic Linen · Natural Cream"
                        className="w-full h-10 px-3 bg-surface-card border border-border-ecru text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-text-muted mb-1">Badge (opsional)</label>
                      <input
                        type="text"
                        value={newBadge}
                        onChange={(e) => setNewBadge(e.target.value)}
                        placeholder="DROP BARU"
                        className="w-full h-10 px-3 bg-surface-card border border-border-ecru text-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-text-muted mb-1">Kategori</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as Product['category'])}
                        className="w-full h-10 px-2 bg-surface-card border border-border-ecru text-primary"
                      >
                        {PRODUCT_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-text-muted mb-1">Subkategori</label>
                      <select
                        value={newSubcategory}
                        onChange={(e) => setNewSubcategory(e.target.value as Product['subcategory'])}
                        className="w-full h-10 px-2 bg-surface-card border border-border-ecru text-primary"
                      >
                        {PRODUCT_SUBCATEGORIES.map((sc) => (
                          <option key={sc} value={sc}>
                            {sc}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-text-muted mb-1">Bahan Utama</label>
                      <select
                        value={newFabric}
                        onChange={(e) => setNewFabric(e.target.value as Product['fabricType'])}
                        className="w-full h-10 px-2 bg-surface-card border border-border-ecru text-primary"
                      >
                        {PRODUCT_FABRICS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-text-muted mb-1">Fit Scale</label>
                      <select
                        value={newFitScale}
                        onChange={(e) => setNewFitScale(e.target.value as Product['fitScale'])}
                        className="w-full h-10 px-2 bg-surface-card border border-border-ecru text-primary"
                      >
                        {PRODUCT_FIT_SCALES.map((fs) => (
                          <option key={fs} value={fs}>
                            {fs}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-text-muted mb-1">Tab Best Seller</label>
                      <select
                        value={newBestsellerTab}
                        onChange={(e) => setNewBestsellerTab(e.target.value)}
                        className="w-full h-10 px-2 bg-surface-card border border-border-ecru text-primary"
                      >
                        <option value="">Tidak ada</option>
                        {PRODUCT_BESTSELLER_TABS.map((bt) => (
                          <option key={bt} value={bt}>
                            {bt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-text-muted mb-1">
                        Foto Utama (Upload max 5 MB → Auto WebP, atau URL) *
                      </label>
                      <div className="flex gap-2">
                        <input
                          required
                          type="url"
                          value={newImage}
                          onChange={(e) => setNewImage(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 h-10 px-3 bg-surface-card border border-border-ecru text-primary"
                        />
                        <label className="h-10 px-3 border border-primary bg-surface-card text-primary flex items-center cursor-pointer hover:bg-primary hover:text-on-primary transition-colors shrink-0">
                          <span>{uploadingImg ? 'Compressing...' : 'Upload WebP'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => void handleUploadImage(e, 'main')}
                            className="hidden"
                            disabled={uploadingImg}
                          />
                        </label>
                        <label className="h-10 px-3 border border-border-ecru bg-surface-card text-primary flex items-center cursor-pointer hover:border-primary transition-colors shrink-0">
                          <span>+ Galeri</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => void handleUploadImage(e, 'gallery')}
                            className="hidden"
                            disabled={uploadingImg}
                          />
                        </label>
                      </div>
                      {compressionInfo && (
                        <p className="text-[11px] text-status-stock mt-1 font-medium">{compressionInfo}</p>
                      )}
                      {uploadError && (
                        <p className="text-[11px] text-error mt-1 font-medium">{uploadError}</p>
                      )}
                      {(newImage || newGalleryUrls.length > 0) && (
                        <div className="flex items-center gap-2 mt-2">
                          {newImage && (
                            <img
                              src={newImage}
                              alt="Preview utama"
                              className="w-12 h-16 object-cover border border-primary"
                            />
                          )}
                          {newGalleryUrls.map((gUrl, idx) => (
                            <div key={idx} className="relative">
                              <img
                                src={gUrl}
                                alt={`Galeri ${idx + 1}`}
                                className="w-12 h-16 object-cover border border-border-ecru"
                              />
                              <button
                                type="button"
                                onClick={() => setNewGalleryUrls((prev) => prev.filter((_, i) => i !== idx))}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-error text-white text-[10px] flex items-center justify-center cursor-pointer"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-text-muted mb-1">Warna Utama &amp; Hex</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newColorName}
                          onChange={(e) => setNewColorName(e.target.value)}
                          placeholder="Natural Cream"
                          className="flex-1 h-10 px-2 bg-surface-card border border-border-ecru text-primary"
                        />
                        <input
                          type="color"
                          value={newColorHex}
                          onChange={(e) => setNewColorHex(e.target.value)}
                          className="w-10 h-10 p-1 bg-surface-card border border-border-ecru cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-text-muted mb-1">Ukuran (koma)</label>
                        <input
                          required
                          type="text"
                          value={newSizesText}
                          onChange={(e) => setNewSizesText(e.target.value)}
                          placeholder="S, M, L"
                          className="w-full h-10 px-2 bg-surface-card border border-border-ecru text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-text-muted mb-1">Stok Awal</label>
                        <input
                          required
                          type="number"
                          min={0}
                          value={newInitialStock}
                          onChange={(e) => setNewInitialStock(e.target.value)}
                          className="w-full h-10 px-2 bg-surface-card border border-border-ecru text-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-text-muted mb-1">Fit Note Singkat</label>
                      <input
                        type="text"
                        value={newFitNote}
                        onChange={(e) => setNewFitNote(e.target.value)}
                        className="w-full h-10 px-3 bg-surface-card border border-border-ecru text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-text-muted mb-1">Info Model</label>
                      <input
                        type="text"
                        value={newModelInfo}
                        onChange={(e) => setNewModelInfo(e.target.value)}
                        className="w-full h-10 px-3 bg-surface-card border border-border-ecru text-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-text-muted mb-1">Deskripsi Produk *</label>
                    <textarea
                      required
                      rows={2}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Jelaskan siluet, material, dan keunggulan produk..."
                      className="w-full p-3 bg-surface-card border border-border-ecru text-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-text-muted mb-1">Detail Bahan (1 poin per baris)</label>
                      <textarea
                        rows={3}
                        value={newFabricDetailsText}
                        onChange={(e) => setNewFabricDetailsText(e.target.value)}
                        placeholder={'100% Organic Linen\nJahitan French seam rapi'}
                        className="w-full p-3 bg-surface-card border border-border-ecru text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-text-muted mb-1">Cara Rawat (1 poin per baris)</label>
                      <textarea
                        rows={3}
                        value={newCareText}
                        onChange={(e) => setNewCareText(e.target.value)}
                        placeholder={'Cuci air dingin\nJemur di tempat teduh'}
                        className="w-full p-3 bg-surface-card border border-border-ecru text-primary"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetProductForm();
                        setShowProductForm(false);
                      }}
                      className="px-4 py-2 border border-border-ecru bg-surface-card text-primary cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={savingProduct || uploadingImg}
                      className="px-6 py-2 bg-primary text-on-primary font-label-uppercase uppercase tracking-wider cursor-pointer disabled:opacity-50"
                    >
                      {savingProduct
                        ? 'Menyimpan...'
                        : editingProductId
                        ? 'Simpan Perubahan Produk'
                        : 'Simpan Produk ke Database'}
                    </button>
                  </div>
                </form>
              )}

              <div className="bg-surface-card border border-border-ecru overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
                      <th className="p-3">SKU</th>
                      <th className="p-3">Produk</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Harga (IDR)</th>
                      <th className="p-3">Ready Stock</th>
                      <th className="p-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-ecru">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-text-muted">
                          Belum ada produk di database. Klik <strong>+ Tambah Produk Baru</strong> di atas untuk menambahkan produk real.
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => {
                        const edit = productPriceEdits[p.id] || { price: p.price, inStock: p.inStock };
                        return (
                          <tr key={p.id}>
                            <td className="p-3 font-mono text-text-muted">{p.sku}</td>
                            <td className="p-3 font-medium text-primary">{p.name}</td>
                            <td className="p-3 uppercase text-text-muted">{p.category}</td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={edit.price}
                                onChange={(e) =>
                                  setProductPriceEdits((prev) => ({
                                    ...prev,
                                    [p.id]: { ...edit, price: Number(e.target.value) },
                                  }))
                                }
                                className="w-28 h-8 px-2 border border-border-ecru bg-surface-card tabular-nums"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={edit.inStock}
                                onChange={(e) =>
                                  setProductPriceEdits((prev) => ({
                                    ...prev,
                                    [p.id]: { ...edit, inStock: e.target.checked },
                                  }))
                                }
                                className="w-4 h-4 accent-primary"
                              />
                            </td>
                            <td className="p-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void handleSaveProduct(p.id)}
                                className="px-3 py-1.5 bg-primary text-on-primary font-label-uppercase text-[10px] uppercase cursor-pointer"
                              >
                                Update
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEditProduct(p)}
                                className="px-3 py-1.5 border border-primary text-primary hover:bg-surface-sand font-label-uppercase text-[10px] uppercase cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteProduct(p)}
                                className="px-3 py-1.5 border border-border-ecru text-error hover:border-error font-label-uppercase text-[10px] uppercase cursor-pointer"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary mb-3">
                  Stok Varian (Warna &amp; Size)
                </h3>
                {variants.length === 0 ? (
                  <div className="p-6 bg-surface-card border border-border-ecru text-xs text-text-muted">
                    Belum ada varian stok. Varian akan otomatis dibuat saat Admin menambahkan produk baru.
                  </div>
                ) : (
                  <div className="bg-surface-card border border-border-ecru overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
                          <th className="p-3">Product ID</th>
                          <th className="p-3">Warna</th>
                          <th className="p-3">Size</th>
                          <th className="p-3">Stok Qty</th>
                          <th className="p-3">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-ecru">
                        {variants.map((v) => (
                          <tr key={v.id}>
                            <td className="p-3 font-mono text-primary">{v.product_id}</td>
                            <td className="p-3">{v.color_name}</td>
                            <td className="p-3 font-semibold">{v.size}</td>
                            <td className="p-3">
                              <input
                                type="number"
                                min={0}
                                value={variantStockEdits[v.id] ?? v.stock_qty}
                                onChange={(e) =>
                                  setVariantStockEdits((prev) => ({
                                    ...prev,
                                    [v.id]: Number(e.target.value),
                                  }))
                                }
                                className="w-20 h-8 px-2 border border-border-ecru tabular-nums"
                              />
                            </td>
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => void handleSaveVariantStock(v.id)}
                                className="px-3 py-1.5 border border-primary text-primary hover:bg-primary hover:text-on-primary font-label-uppercase text-[10px] uppercase cursor-pointer"
                              >
                                Simpan Stok
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'promos' && (
            <div className="space-y-6">
              <form
                onSubmit={handleCreatePromo}
                className="p-4 bg-surface-sand border border-border-ecru grid grid-cols-1 sm:grid-cols-5 gap-3 items-end text-xs"
              >
                <div>
                  <label className="block text-text-muted mb-1">Kode Promo *</label>
                  <input
                    required
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder="CONTOH50"
                    className="w-full h-9 px-2 bg-surface-card border border-border-ecru uppercase"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-text-muted mb-1">Deskripsi</label>
                  <input
                    type="text"
                    value={promoDescInput}
                    onChange={(e) => setPromoDescInput(e.target.value)}
                    placeholder="Diskon spesial..."
                    className="w-full h-9 px-2 bg-surface-card border border-border-ecru"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-text-muted mb-1">Diskon</label>
                    <input
                      required
                      type="number"
                      min={1000}
                      value={promoDiscountInput}
                      onChange={(e) => setPromoDiscountInput(e.target.value)}
                      className="w-full h-9 px-2 bg-surface-card border border-border-ecru"
                    />
                  </div>
                  <div>
                    <label className="block text-text-muted mb-1">Min. Belanja</label>
                    <input
                      type="number"
                      min={0}
                      value={promoMinInput}
                      onChange={(e) => setPromoMinInput(e.target.value)}
                      className="w-full h-9 px-2 bg-surface-card border border-border-ecru"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="h-9 px-4 bg-primary text-on-primary font-label-uppercase text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  + Tambah Promo
                </button>
              </form>

              <div className="bg-surface-card border border-border-ecru overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
                    <th className="p-3">Kode</th>
                    <th className="p-3">Deskripsi</th>
                    <th className="p-3">Diskon</th>
                    <th className="p-3">Min. Belanja</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-ecru">
                  {promos.map((pr) => (
                    <tr key={pr.code}>
                      <td className="p-3 font-mono font-semibold text-primary">{pr.code}</td>
                      <td className="p-3 text-text-muted">{pr.description}</td>
                      <td className="p-3 tabular-nums">{formatRupiah(pr.discount_amount)}</td>
                      <td className="p-3 tabular-nums">{formatRupiah(pr.min_subtotal)}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-label-uppercase uppercase ${
                            pr.is_active ? 'bg-surface-sand text-status-stock' : 'bg-surface-container text-text-muted'
                          }`}
                        >
                          {pr.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => void handleTogglePromo(pr)}
                          className="px-3 py-1.5 border border-primary text-primary hover:bg-primary hover:text-on-primary font-label-uppercase text-[10px] uppercase cursor-pointer"
                        >
                          {pr.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {activeTab === 'subscribers' && (
            <div className="bg-surface-card border border-border-ecru overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
                    <th className="p-3">Email</th>
                    <th className="p-3">Sumber</th>
                    <th className="p-3">Tanggal Daftar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-ecru">
                  {subscribers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-text-muted">
                        Belum ada subscriber terdaftar.
                      </td>
                    </tr>
                  ) : (
                    subscribers.map((sub) => (
                      <tr key={sub.id}>
                        <td className="p-3 font-medium text-primary">{sub.email}</td>
                        <td className="p-3 uppercase text-text-muted">{sub.source}</td>
                        <td className="p-3 text-text-muted">
                          {new Date(sub.subscribed_at).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {zoomedProofUrl && (
        <div
          aria-modal="true"
          role="dialog"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-[#1A1A1A]/60 backdrop-blur-[2px]"
            onClick={() => setZoomedProofUrl(null)}
          />
          <div className="relative bg-surface-card border border-border-ecru p-4 max-w-lg w-full z-10 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-ecru">
              <span className="font-label-uppercase text-xs uppercase text-primary font-semibold">
                Preview Bukti Transfer
              </span>
              <button
                type="button"
                onClick={() => setZoomedProofUrl(null)}
                className="text-text-muted hover:text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <img
              src={zoomedProofUrl}
              alt="Bukti Transfer Full"
              className="w-full max-h-[70vh] object-contain bg-surface-container-low"
            />
          </div>
        </div>
      )}

      <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
    </div>
  );
};
