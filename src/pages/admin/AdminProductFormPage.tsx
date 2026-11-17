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
import {
  AlertBanner,
  Button,
  ColorPickerField,
  CustomSelect,
  InputField,
  TextareaField,
  getButtonClassName,
} from '../../components/ui';

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
  const [formError, setFormError] = useState<string | null>(null);
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
      setUploadError('Format file harus berupa gambar.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setUploadError('Ukuran gambar maksimal 5 MB.');
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
    setFormError(null);

    const parsedSizes = sizesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (parsedSizes.length === 0) {
      setFormError('Isi minimal 1 ukuran (contoh: S, M, L).');
      return;
    }
    if (!image.trim()) {
      setFormError('Upload atau masukkan URL foto utama produk.');
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
      setFormError(`Gagal menyimpan produk: ${res.error}`);
      showToast(`Gagal menyimpan produk: ${res.error}`);
      return;
    }

    await loadCatalog();
    showToast(isEdit ? 'Perubahan produk disimpan!' : 'Produk baru berhasil ditambahkan!');
    navigate('/admin/products');
  };

  if (isEdit && !existingProduct && products.length > 0) {
    return (
      <div className="bg-surface-card border border-border-ecru rounded-2xl p-8 text-center space-y-4">
        <p className="text-sm text-primary">Produk dengan ID "{productId}" tidak ditemukan.</p>
        <Link
          to="/admin/products"
          className={getButtonClassName({ variant: 'outline', size: 'sm' })}
        >
          Kembali ke Daftar Produk
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-ecru pb-5">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            {isEdit ? `EDIT PRODUCT · ${existingProduct?.sku || productId}` : 'CREATE NEW PRODUCT'}
          </span>
          <h1 className="font-headline-sm text-2xl sm:text-3xl text-primary">
            {isEdit ? 'Edit Produk Atelier' : 'Tambah Produk Baru'}
          </h1>
        </div>
        <Link
          to="/admin/products"
          className={getButtonClassName({ variant: 'outline', size: 'sm' })}
        >
          ← Kembali
        </Link>
      </div>

      {formError && <AlertBanner variant="error">{formError}</AlertBanner>}

      <form
        onSubmit={handleSubmit}
        className="bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-8 space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField
            containerClassName="sm:col-span-2"
            label="Nama Produk"
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Kemeja Linen Atelier"
          />
          <InputField
            label="SKU"
            required
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="US-WN-010"
            className="uppercase font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField
            label="Harga (IDR)"
            required
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <CustomSelect
            label="Kategori"
            required
            value={category}
            onChange={(val) => setCategory(val as Product['category'])}
            options={PRODUCT_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          />
          <CustomSelect
            label="Subkategori"
            required
            value={subcategory}
            onChange={(val) => setSubcategory(val as Product['subcategory'])}
            options={PRODUCT_SUBCATEGORIES.map((sc) => ({ value: sc, label: sc }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CustomSelect
            label="Bahan (Fabric)"
            value={fabric}
            onChange={(val) => setFabric(val as Product['fabricType'])}
            options={PRODUCT_FABRICS.map((f) => ({ value: f, label: f }))}
          />
          <CustomSelect
            label="Skala Fit"
            value={fitScale}
            onChange={(val) => setFitScale(val as Product['fitScale'])}
            options={PRODUCT_FIT_SCALES.map((fs) => ({ value: fs, label: fs }))}
          />
          <CustomSelect
            label="Bestseller Tab (Opsional)"
            value={bestsellerTab}
            onChange={setBestsellerTab}
            options={[
              { value: '', label: 'Tidak Ditampilkan' },
              ...PRODUCT_BESTSELLER_TABS.map((bt) => ({ value: bt, label: bt })),
            ]}
          />
        </div>

        {/* Images & WebP Upload */}
        <div className="p-4 sm:p-5 bg-surface border border-border-ecru rounded-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
              Foto Utama &amp; Galeri (Auto-compress WebP maks 5 MB)
            </span>
          </div>

          {uploadError && <AlertBanner variant="error">{uploadError}</AlertBanner>}
          {compressionInfo && <AlertBanner variant="success">{compressionInfo}</AlertBanner>}

          <div className="flex flex-wrap items-center gap-3">
            <label
              className={getButtonClassName({
                variant: 'primary',
                size: 'sm',
                className: uploadingImg ? 'opacity-60 pointer-events-none' : '',
              })}
            >
              <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
              {uploadingImg ? 'Mengupload WebP...' : 'Upload Foto Utama'}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingImg}
                onChange={(e) => void handleUploadImage(e, 'main')}
                className="hidden"
              />
            </label>
            <label
              className={getButtonClassName({
                variant: 'outline',
                size: 'sm',
                className: uploadingImg ? 'opacity-60 pointer-events-none' : '',
              })}
            >
              <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
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

          <InputField
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="Atau tempel URL foto utama https://..."
          />

          {(image || galleryUrls.length > 0) && (
            <div className="flex flex-wrap gap-3 pt-1">
              {image && (
                <div className="relative rounded-xl overflow-hidden border border-primary">
                  <img src={image} alt="Main" className="w-20 h-24 object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-primary/85 text-white text-[9px] text-center py-0.5 font-label-uppercase">
                    UTAMA
                  </span>
                </div>
              )}
              {galleryUrls.map((url, idx) => (
                <div key={`${url}-${idx}`} className="relative">
                  <img
                    src={url}
                    alt={`Gallery ${idx}`}
                    className="w-20 h-24 object-cover rounded-xl border border-border-ecru"
                  />
                  <button
                    type="button"
                    onClick={() => setGalleryUrls((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error text-white rounded-full text-[10px] flex items-center justify-center shadow cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variants & Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          <InputField
            label="Nama Warna"
            type="text"
            value={colorName}
            onChange={(e) => setColorName(e.target.value)}
          />
          <ColorPickerField
            label="Warna (Swatch & Hex)"
            value={colorHex}
            onChange={setColorHex}
            onPresetNameSelect={(presetName) => setColorName(presetName)}
          />
          <InputField
            label="Ukuran (pisahkan koma)"
            required
            type="text"
            value={sizesText}
            onChange={(e) => setSizesText(e.target.value)}
            placeholder="S, M, L, XL"
          />
          <InputField
            label="Stok Awal / Status"
            type="number"
            min={0}
            value={initialStock}
            onChange={(e) => setInitialStock(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField
            label="Subtitle Singkat"
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
          <InputField
            label="Badge (Opsional)"
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
          />
          <InputField
            label="Fit Note"
            type="text"
            value={fitNote}
            onChange={(e) => setFitNote(e.target.value)}
          />
        </div>

        <InputField
          label="Info Model"
          type="text"
          value={modelInfo}
          onChange={(e) => setModelInfo(e.target.value)}
        />

        <TextareaField
          label="Deskripsi Produk"
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Jelaskan siluet, material, dan keunggulan produk..."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextareaField
            label="Detail Bahan (1 poin per baris)"
            rows={3}
            value={fabricDetailsText}
            onChange={(e) => setFabricDetailsText(e.target.value)}
          />
          <TextareaField
            label="Cara Rawat (1 poin per baris)"
            rows={3}
            value={careText}
            onChange={(e) => setCareText(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-border-ecru">
          <Link
            to="/admin/products"
            className={getButtonClassName({ variant: 'outline', size: 'md' })}
          >
            Batal
          </Link>
          <Button type="submit" variant="primary" size="md" disabled={saving || uploadingImg}>
            {saving
              ? 'Menyimpan...'
              : isEdit
              ? 'Simpan Perubahan Produk'
              : 'Simpan Produk ke Database'}
          </Button>
        </div>
      </form>
    </div>
  );
};
