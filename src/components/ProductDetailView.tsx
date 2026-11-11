import React, { useState, useEffect } from 'react';
import { PRODUCTS, Product } from '../data/products';
import { ActivePage } from './Header';

interface ProductDetailViewProps {
  product: Product;
  onNavigate: (page: ActivePage) => void;
  onSelectProduct: (product: Product) => void;
  onAddToBag: (product: Product, size: string, colorName?: string) => void;
  onBuyNow: (product: Product, size: string, colorName?: string) => void;
  onToggleWishlist: (productId: string) => void;
  wishlistIds: string[];
  onOpenSizeGuide: () => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onNavigate,
  onSelectProduct,
  onAddToBag,
  onBuyNow,
  onToggleWishlist,
  wishlistIds,
  onOpenSizeGuide,
}) => {
  const [activeImage, setActiveImage] = useState<string>(product.image);
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]?.name || '');
  const [selectedSize, setSelectedSize] = useState<string>(product.defaultSize || '');
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<'fabric' | 'care' | 'shipping' | null>('fabric');

  useEffect(() => {
    setActiveImage(product.image);
    setSelectedColor(product.colors[0]?.name || '');
    setSelectedSize(product.defaultSize || '');
    setSizeError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  const isWishlisted = wishlistIds.includes(product.id);

  const handleAddClick = () => {
    if (!selectedSize) {
      setSizeError('Pilih ukuran dulu ya, biar pas di badan!');
      return;
    }
    setSizeError(null);
    onAddToBag(product, selectedSize, selectedColor);
  };

  const handleBuyNowClick = () => {
    if (!selectedSize) {
      setSizeError('Pilih ukuran dulu ya, biar pas di badan!');
      return;
    }
    setSizeError(null);
    onBuyNow(product, selectedSize, selectedColor);
  };

  const relatedProducts = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="flex flex-col w-full bg-surface">
      {/* Breadcrumb Bar */}
      <div className="max-w-[1440px] w-full mx-auto px-margin-mobile lg:px-margin pt-space-md pb-space-sm">
        <nav className="flex items-center gap-2 font-label-uppercase text-label-uppercase text-text-muted">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="hover:text-primary transition-colors cursor-pointer uppercase"
          >
            Home
          </button>
          <span className="text-surface-dim">/</span>
          <button
            type="button"
            onClick={() => onNavigate(product.category === 'men' ? 'men' : 'women')}
            className="hover:text-primary transition-colors cursor-pointer uppercase"
          >
            {product.category === 'men' ? 'Pria' : product.category === 'bags' ? 'Tas' : 'Wanita'}
          </button>
          <span className="text-surface-dim">/</span>
          <span className="text-primary font-semibold truncate">{product.name}</span>
        </nav>
      </div>

      {/* Main Contiguous PDP Layout */}
      <section className="max-w-[1440px] w-full mx-auto px-margin-mobile lg:px-margin py-space-md lg:py-space-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Multi-Angle Photo Gallery (7 cols) */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:w-24 shrink-0">
              {product.gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(imgUrl)}
                  className={`relative aspect-[3/4] w-20 sm:w-full bg-surface-card overflow-hidden border transition-all cursor-pointer ${
                    activeImage === imgUrl ? 'border-primary ring-1 ring-primary' : 'border-border-ecru opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} angle ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                </button>
              ))}
            </div>

            {/* Primary Portrait Image */}
            <div className="flex-1 relative aspect-[3/4] bg-surface-card border border-border-ecru overflow-hidden">
              <img
                src={activeImage}
                alt={product.alt}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top transition-all duration-500"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                {product.badges.map((b, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 font-label-uppercase text-[10px] tracking-widest uppercase rounded-DEFAULT ${
                      b.variant === 'primary'
                        ? 'bg-primary text-on-primary'
                        : b.variant === 'secondary'
                        ? 'bg-surface-bright/95 text-secondary border border-border-ecru'
                        : 'bg-surface-bright/95 text-primary border border-border-ecru'
                    }`}
                  >
                    {b.text}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                aria-label="Toggle Wishlist"
                className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-surface-card/90 border border-border-ecru flex items-center justify-center transition-colors cursor-pointer ${
                  isWishlisted ? 'text-error' : 'text-primary hover:text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">favorite</span>
              </button>
            </div>
          </div>

          {/* Right: Contiguous Purchase Module (5 cols) */}
          <div className="lg:col-span-5 bg-surface-card border border-border-ecru p-6 sm:p-8">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-label-uppercase text-label-uppercase uppercase tracking-widest text-secondary">
                {product.subcategory} · {product.fabricType}
              </span>
              <span className="font-label-uppercase text-[10px] text-text-muted uppercase">SKU-US04</span>
            </div>

            <h1 className="font-headline-md text-headline-md text-primary mb-2">{product.name}</h1>
            <p className="font-body-md text-body-md text-text-muted mb-4">{product.subtitle}</p>

            <div className="flex items-baseline justify-between pb-5 mb-5 border-b border-border-ecru">
              <span className="font-price-lg text-[24px] leading-[30px] font-medium text-primary">
                {product.priceFormatted}
              </span>
              <div className="flex items-center gap-1.5 text-status-stock font-body-sm text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-status-stock"></span>
                <span>{product.stockLabel || 'Ready stock — langsung bungkus & kirim dlm 1-2 hari'}</span>
              </div>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant mb-6 leading-relaxed">
              {product.description}
            </p>

            {/* Color Swatches */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-uppercase text-label-uppercase uppercase text-text-muted">
                  WARNA PILIHAN: <strong className="text-primary">{selectedColor}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3">
                {product.colors.map((c) => {
                  const isSelected = selectedColor === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      title={c.name}
                      style={{ backgroundColor: c.hex }}
                      className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-primary ring-offset-2'
                          : 'border border-border-ecru hover:ring-1 hover:ring-primary'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Size Selector & Visual Size Guide Trigger */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-label-uppercase text-label-uppercase uppercase text-text-muted">
                  PILIH UKURAN: <strong className="text-primary">{selectedSize || 'Belum dipilih'}</strong>
                </span>
                <button
                  type="button"
                  onClick={onOpenSizeGuide}
                  className="inline-flex items-center gap-1 font-label-uppercase text-label-uppercase uppercase text-secondary hover:text-primary transition-colors cursor-pointer"
                >
                  <span>Biar Nggak Zonk (Size Guide)</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sz) => {
                  const isDisabled = product.disabledSizes?.includes(sz);
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        setSelectedSize(isSelected ? '' : sz);
                        setSizeError(null);
                      }}
                      className={`min-w-[44px] h-11 px-3 flex items-center justify-center font-body-md text-body-md border rounded-DEFAULT transition-all ${
                        isDisabled
                          ? 'border-border-ecru bg-surface-container-low text-text-muted opacity-40 line-through cursor-not-allowed'
                          : isSelected
                          ? 'bg-primary text-on-primary border-primary font-medium cursor-pointer'
                          : 'bg-surface-card text-primary border-border-ecru hover:border-primary cursor-pointer'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>

              {sizeError && (
                <div className="mt-2.5 p-2.5 bg-error-container/60 border border-error/30 text-error font-body-sm text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{sizeError}</span>
                </div>
              )}

              {/* Fit Meter Indicator */}
              <div className="mt-4 p-3.5 bg-surface-sand rounded-DEFAULT border border-border-ecru">
                <div className="flex justify-between font-label-uppercase text-[10px] uppercase tracking-wider text-text-muted mb-1.5">
                  <span className={product.fitScale === 'Slim Fit' ? 'text-primary font-bold' : ''}>Slim Fit</span>
                  <span className={product.fitScale === 'Pas Banget' ? 'text-primary font-bold' : ''}>Pas Banget</span>
                  <span className={product.fitScale === 'Relaxed' ? 'text-primary font-bold' : ''}>Relaxed</span>
                </div>
                <div className="w-full bg-border-ecru h-1 rounded-full relative mb-2">
                  <div
                    className={`absolute -top-1 w-3 h-3 bg-primary rounded-full ${
                      product.fitScale === 'Slim Fit'
                        ? 'left-[15%]'
                        : product.fitScale === 'Relaxed'
                        ? 'left-[82%]'
                        : 'left-1/2 -ml-1.5'
                    }`}
                  />
                </div>
                <p className="font-body-sm text-[12px] text-text-muted">{product.modelInfo}</p>
              </div>
            </div>

            {/* Primary & Secondary Action CTAs */}
            <div className="space-y-3 mb-8">
              <button
                type="button"
                onClick={handleAddClick}
                className="w-full h-12 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-[0.14em] rounded-DEFAULT hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                <span>Masukin Bag ({product.priceFormatted})</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNowClick}
                className="w-full h-12 bg-surface-card border border-primary text-primary font-label-uppercase text-label-uppercase uppercase tracking-[0.14em] rounded-DEFAULT hover:bg-surface-sand transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Gas Checkout Sekarang</span>
                <span className="material-symbols-outlined text-[16px]">bolt</span>
              </button>
            </div>

            {/* Minimalist Accordions: Fabric & Fit, Care, Shipping */}
            <div className="border-t border-border-ecru divide-y divide-border-ecru">
              {/* Accordion 1: Fabric & Fit */}
              <div>
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === 'fabric' ? null : 'fabric')}
                  className="w-full py-4 flex items-center justify-between text-left font-body-md text-body-md font-medium text-primary cursor-pointer"
                >
                  <span>Detail Bahan &amp; Fitting</span>
                  <span className="font-body-lg text-lg leading-none">
                    {openAccordion === 'fabric' ? '−' : '+'}
                  </span>
                </button>
                {openAccordion === 'fabric' && (
                  <div className="pb-4 space-y-2 font-body-sm text-body-sm text-text-muted">
                    <ul className="list-disc pl-4 space-y-1.5">
                      {product.fabricDetails.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Accordion 2: Care Instructions */}
              <div>
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === 'care' ? null : 'care')}
                  className="w-full py-4 flex items-center justify-between text-left font-body-md text-body-md font-medium text-primary cursor-pointer"
                >
                  <span>Cara Rawat Biar Awet</span>
                  <span className="font-body-lg text-lg leading-none">
                    {openAccordion === 'care' ? '−' : '+'}
                  </span>
                </button>
                {openAccordion === 'care' && (
                  <div className="pb-4 space-y-2 font-body-sm text-body-sm text-text-muted">
                    <ul className="list-disc pl-4 space-y-1.5">
                      {product.careInstructions.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Accordion 3: Shipping & Returns */}
              <div>
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
                  className="w-full py-4 flex items-center justify-between text-left font-body-md text-body-md font-medium text-primary cursor-pointer"
                >
                  <span>Pengiriman &amp; Garansi Tuker 30 Hari</span>
                  <span className="font-body-lg text-lg leading-none">
                    {openAccordion === 'shipping' ? '−' : '+'}
                  </span>
                </button>
                {openAccordion === 'shipping' && (
                  <div className="pb-4 space-y-2 font-body-sm text-body-sm text-text-muted">
                    <p>
                      • <strong>Gratis Ongkir</strong> otomatis untuk pembelian minimal Rp 500.000 ke seluruh Indonesia.
                    </p>
                    <p>
                      • <strong>Sameday / Instant Courier</strong> tersedia setiap hari untuk area Jakarta, Bogor, Depok,
                      Tangerang, dan Bekasi.
                    </p>
                    <p>
                      • <strong>Garansi Tuker Size 30 Hari:</strong> Kalau pas dicoba di rumah rasanya kurang sreg, kurir
                      kami jemput balik dan tuker size baru tanpa biaya admin tambahan.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complete the Look / Curated Recommendations */}
      <section className="max-w-[1440px] w-full mx-auto px-margin-mobile lg:px-margin py-space-xl border-t border-border-ecru mt-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="font-label-uppercase text-label-uppercase uppercase text-secondary tracking-widest block mb-1">
              MIX &amp; MATCH KURASI
            </span>
            <h2 className="font-headline-md text-headline-md text-primary">Pasangannya Biar Makin Aesthetic</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('women')}
            className="font-label-uppercase text-label-uppercase uppercase text-primary hover:text-secondary transition-colors cursor-pointer"
          >
            Lihat Semua Katalog →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts.map((rel) => (
            <div
              key={rel.id}
              onClick={() => onSelectProduct(rel)}
              className="group bg-surface-card border border-border-ecru overflow-hidden cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[3/4] bg-surface-container-low overflow-hidden">
                <img
                  src={rel.image}
                  alt={rel.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 flex items-baseline justify-between gap-2">
                <div>
                  <h4 className="font-body-md text-body-md font-medium text-primary group-hover:text-secondary transition-colors">
                    {rel.name}
                  </h4>
                  <p className="font-body-sm text-xs text-text-muted">{rel.subtitle}</p>
                </div>
                <span className="font-price-md text-price-md text-primary shrink-0">{rel.priceFormatted}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
