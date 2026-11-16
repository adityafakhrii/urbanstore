import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import {
  PRODUCT_BESTSELLER_TABS,
  PRODUCT_CATEGORIES,
  PRODUCT_FABRICS,
  PRODUCT_FIT_SCALES,
  PRODUCT_SUBCATEGORIES,
  Product,
} from '../../data/products';
import {
  createProductAdmin,
  updateProductAdmin,
  uploadProductImageAdmin,
} from '../../services/supabaseService';
import { MAX_IMAGE_SIZE_BYTES, formatBytes } from '../../utils/image';

export const AdminProductFormPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { products, loadCatalog, showToast } = useStore();

  const isEdit = Boolean(productId);
  const existingProduct = isEdit ? products.find((p) => p.id === productId) : undefined;

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('450000');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<Product['category']>('women');
  const [subcategory, setSubcategory] = useState<Product['subcategory']>('Dress & Setelan');
  const [fabric, setFabric] = useState<Product['fabricType']>('Linen Organik');
  const [fitScale, setFitScale] = useState<Product['fitScale']>('Pas Banget');
  const [bestsellerTab, setBestsellerTab] = useState<string>('');
  const [image, setImage] = useState('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [badge, setBadge] = useState('DROP BARU');
  const [colorName, setColorName] = useState('Natural Cream');
  const [colorHex, setColorHex] = useState('#F5F2EB');
  const [sizesText, setSizesText] = useState('S, M, L');
  const [initialStock, setInitialStock] = useState('10');
  const [fitNote, setFitNote] = useState('True to size');
  const [modelInfo, setModelInfo] = useState('Model TB 170cm memakai Size S.');
  const [description, setDescription] = useState('');
  const [fabricDetailsText, setFabricDetailsText] = useState('');
  const [careText, setCareText] = useState('');

  const [uploadingImg, setUploadingImg] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existingProduct) return;
    setName(existingProduct.name);
    setSku(existingProduct.sku);
    setPrice(String(existingProduct.price));
    setSubtitle(existingProduct.subtitle);
    setCategory(existingProduct.category);
    setSubcategory(existingProduct.subcategory);
    setFabric(existingProduct.fabricType);
    setFitScale(existingProduct.fitScale);
    setBestsellerTab(existingProduct.bestsellerTab || '');
    setImage(existingProduct.image);
    setGalleryUrls(existingProduct.gallery.filter((u) => u !== existingProduct.image));
    setBadge(existingProduct.badges[0]?.text || '');
    setColorName(existingProduct.colors[0]?.name || 'Default');
    setColorHex(existingProduct.colors[0]?.hex || '#F5F2EB');
    setSizesText(existingProduct.sizes.join(', '));
    setInitialStock(existingProduct.inStock ? '10' : '0');
    setFitNote(existingProduct.fitNote);
    setModelInfo(existingProduct.modelInfo);
    setDescription(existingProduct.description);
    setFabricDetailsText(existingProduct.fabricDetails.join('\n'));
    setCareText(existingProduct.careInstructions.join('\n'));
  }, [existingProduct]);

  const handleUploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'main' | 'gallery'
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Format file harus berupa gambar.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast('Ukuran gambar maksimal 5 MB.');
      return;
    }

    setUploadError(null);
    setUploadingImg(true);
    const res = await uploadProductImageAdmin(file);
    setUploadingImg(false);

    if (res.error || !res.url) {
      setUploadError(res.error || 'Upload gambar gagal.');
      showToast(`Upload gagal: ${res.error || 'Cek bucket product-images'}`);
      return;
    }

    if (res.originalBytes && res.compressedBytes) {
      setCompressionInfo(
        `WebP terkompresi: ${formatBytes(res.originalBytes)} → ${formatBytes(res.compressedBytes)}`
      );
    }

    if (target === 'main') {
      setImage(res.url);
    } else {
      setGalleryUrls((prev) => [...prev, res.url!]);
    }
    showToast('Foto dikompres ke WebP & berhasil di-upload!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSizes = sizesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (parsedSizes.length === 0) {
      showToast('Isi minimal 1 ukuran (contoh: S, M, L).');
      return;
    }
    if (!image.trim()) {
      showToast('Upload atau masukkan URL foto utama produk.');
      return;
    }

    const commonPayload = {
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      price: Math.max(0, Number(price) || 0),
      subtitle: subtitle.trim() || `${fabric} · ${colorName}`,
      category,
      subcategory,
      bestsellerTab: bestsellerTab ? (bestsellerTab as Product['bestsellerTab']) : undefined,
      image: image.trim(),
      gallery: [image.trim(), ...galleryUrls.filter((u) => u && u !== image.trim())],
      badgeText: badge.trim() || undefined,
      fitNote: fitNote.trim() || 'True to size',
      fabricType: fabric,
      colors: [{ name: colorName.trim() || 'Default', hex: colorHex }],
      sizes: parsedSizes,
      defaultSize: parsedSizes[0],
      inStock: (Number(initialStock) || 0) > 0,
      stockLabel: 'Ready stock — langsung bungkus & kirim dlm 1-2 hari',
      description: description.trim(),
      fabricDetails: fabricDetailsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      careInstructions: careText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      modelInfo: modelInfo.trim() || 'Lihat panduan ukuran Anti-Zonk.',
      fitScale,
      initialStock: Math.max(0, Number(initialStock) || 0),
    };

    setSaving(true);
    let res: { error?: string };
    if (isEdit && productId) {
      res = await updateProductAdmin(productId, commonPayload);
    } else {
      const slugBase = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const newId = `${slugBase || 'produk'}-${Date.now().toString(36).slice(-4)}`;
      res = await createProductAdmin({ id: newId, ...commonPayload });
    }
    setSaving(false);

    if (res.error) {
      showToast(`Gagal menyimpan produk: ${res.error}`);
      return;
    }

    await loadCatalog();
    showToast(isEdit ? 'Perubahan produk disimpan!' : 'Produk baru berhasil ditambahkan!');
    navigate('/admin/products');
  };

  if (isEdit && !existingProduct && products.length > 0) {
    return (
      <div className="bg-surface-card border border-border-ecru p-8 text-center space-y-3">
        <p className="text-sm text-primary">Produk dengan ID "{productId}" tidak ditemukan.</p>
        <Link to="/admin/products" className="text-xs underline text-secondary">
          Kembali ke daftar produk
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between border-b border-border-ecru pb-4">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            {isEdit ? `EDIT PRODUCT · ${existingProduct?.sku || productId}` : 'CREATE NEW PRODUCT'}
          </span>
          <h1 className="font-headline-sm text-2xl text-primary">
            {isEdit ? 'Edit Produk Atelier' : 'Tambah Produk Baru'}
          </h1>
        </div>
        <Link
          to="/admin/products"
          className="px-4 py-2 border border-border-ecru text-primary font-label-uppercase text-[11px] uppercase tracking-wider hover:bg-surface-muted"
        >
          ← Kembali
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-card border border-border-ecru p-6 space-y-5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-text-muted mb-1">Nama Produk *</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kemeja Linen Atelier"
              className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
            />
          </div>
          <div>
            <label className="block text-text-muted mb-1">SKU *</label>
            <input
              required
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="US-WN-010"
              className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary uppercase font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-text-muted mb-1">Harga (IDR) *</label>
            <input
              required
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
            />
          </div>
          <div>
            <label className="block text-text-muted mb-1">Kategori *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Product['category'])}
              className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-text-muted mb-1">Subkategori *</label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value as Product['subcategory'])}
              className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
            >
              {PRODUCT_SUBCATEGORIES.map((sc) => (
                <option key={sc} value={sc}>
                  {sc}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-text-muted mb-1">Bahan (Fabric)</label>
            <select
              value={fabric}
              onChange={(e) => setFabric(e.target.value as Product['fabricType'])}
              className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
            >
              {PRODUCT_FABRICS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-text-muted mb-1">Skala Fit</label>
            <select
              value={fitScale}
              onChange={(e) => setFitScale(e.target.value as Product['fitScale'])}
              className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
            >
              {PRODUCT_FIT_SCALES.map((fs) => (
                <option key={fs} value={fs}>
                  {fs}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-text-muted mb-1">Bestseller Tab (Opsional)</label>
            <select
              value={bestsellerTab}
              onChange={(e) => setBestsellerTab(e.target.value)}
              className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
            >
              <option value="">Tidak Ditampilkan</option>
              {PRODUCT_BESTSELLER_TABS.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Images & WebP Upload */}
        <div className="p-4 bg-surface border border-border-ecru space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
              Foto Utama &amp; Galeri (Auto-compress WebP maks 5 MB)
            </span>
            {compressionInfo && <span className="text-[11px] text-status-stock">{compressionInfo}</span>}
          </div>

          {uploadError && (
            <div className="p-2 bg-error-container/70 border border-error/30 text-error">
              {uploadError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <label className="px-4 py-2 bg-primary text-on-primary font-label-uppercase text-[10px] uppercase tracking-wider cursor-pointer">
              {uploadingImg ? 'Mengupload WebP...' : 'Upload Foto Utama'}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingImg}
                onChange={(e) => void handleUploadImage(e, 'main')}
                className="hidden"
              />
            </label>
            <label className="px-4 py-2 border border-primary text-primary font-label-uppercase text-[10px] uppercase tracking-wider cursor-pointer">
              + Tambah Foto Galeri
              <input
                type="file"
                accept="image/*"
                disabled={uploadingImg}
                onChange={(e) => void handleUploadImage(e, 'gallery')}
                className="hidden"
              />
            </label>
          </div>

          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="Atau tempel URL foto utama https://..."
            className="w-full h-10 bg-surface-card border border-border-ecru px-3 text-primary"
          />

          {(image || galleryUrls.length > 0) && (
            <div className="flex flex-wrap gap-3 pt-1">
              {image && (
                <div className="relative">
                  <img src={image} alt="Main" className="w-20 h-24 object-cover border border-primary" />
                  <span className="absolute bottom-0 inset-x-0 bg-primary/80 text-white text-[9px] text-center py-0.5">
                    UTAMA
                  </span>
                </div>
              )}
              {galleryUrls.map((url, idx) => (
                <div key={`${url}-${idx}`} className="relative">
                  <img src={url} alt={`Gallery ${idx}`} className="w-20 h-24 object-cover border border-border-ecru" />
                  <button
                    type="button"
                    onClick={() => setGalleryUrls((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error text-white rounded-full text-[10px] cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variants & Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-text-muted mb-1">Nama Warna</label>
            <input
              type="text"
              value={colorName}
              onChange={(e) => setColorName(e.target.value)}
              className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
            />
          </div>
          <div>
            <label className="block text-text-muted mb-1">Hex Warna</label>
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="w-full h-10 bg-surface border border-border-ecru px-2"
            />
          </div>
          <div>
            <label className="block text-text-muted mb-1">Ukuran (pisahkan koma) *</label>
            <input
              required
              type="text"
              value={sizesText}
              onChange={(e) => setSizesText(e.target.value)}
              placeholder="S, M, L, XL"
              className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
            />
          </div>
          <div>
            <label className="block text-text-muted mb-1">Stok Awal / Status</label>
            <input
              type="number"
              min={0}
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-text-muted mb-1">Subtitle Singkat</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
            />
          </div>
          <div>
            <label className="block text-text-muted mb-1">Badge (Opsional)</label>
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
            />
          </div>
          <div>
            <label className="block text-text-muted mb-1">Fit Note</label>
            <input
              type="text"
              value={fitNote}
              onChange={(e) => setFitNote(e.target.value)}
              className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-text-muted mb-1">Info Model</label>
          <input
            type="text"
            value={modelInfo}
            onChange={(e) => setModelInfo(e.target.value)}
            className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
          />
        </div>

        <div>
          <label className="block text-text-muted mb-1">Deskripsi Produk *</label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan siluet, material, dan keunggulan produk..."
            className="w-full p-3 bg-surface border border-border-ecru text-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-muted mb-1">Detail Bahan (1 poin per baris)</label>
            <textarea
              rows={3}
              value={fabricDetailsText}
              onChange={(e) => setFabricDetailsText(e.target.value)}
              className="w-full p-3 bg-surface border border-border-ecru text-primary"
            />
          </div>
          <div>
            <label className="block text-text-muted mb-1">Cara Rawat (1 poin per baris)</label>
            <textarea
              rows={3}
              value={careText}
              onChange={(e) => setCareText(e.target.value)}
              className="w-full p-3 bg-surface border border-border-ecru text-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/admin/products"
            className="px-5 py-2.5 border border-border-ecru bg-surface text-primary"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={saving || uploadingImg}
            className="px-6 py-2.5 bg-primary text-on-primary font-label-uppercase uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            {saving
              ? 'Menyimpan...'
              : isEdit
              ? 'Simpan Perubahan Produk'
              : 'Simpan Produk ke Database'}
          </button>
        </div>
      </form>
    </div>
  );
};
