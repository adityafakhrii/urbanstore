import React, { useState } from 'react';
import { BRAND_ASSETS, CATEGORY_PORTALS, PRODUCTS, Product } from '../data/products';
import { ActivePage } from './Header';
import { handleImageError } from '../utils/storage';

interface HomeViewProps {
  onNavigate: (page: ActivePage) => void;
  onSelectProduct: (product: Product) => void;
  onAddToBag: (product: Product, size: string, colorName?: string) => void;
  onToggleWishlist: (productId: string) => void;
  wishlistIds: string[];
  onOpenSizeGuide: () => void;
}

type BestsellerTab = 'Semua' | 'Outerwear' | 'Celana' | 'Dress' | 'Tas' | 'Sepatu';

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onSelectProduct,
  onAddToBag,
  onToggleWishlist,
  wishlistIds,
  onOpenSizeGuide,
}) => {
  const [bestsellerFilter, setBestsellerFilter] = useState<BestsellerTab>('Semua');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({
    'minimalist-cashmere-sweater': 'S',
    'pleated-silk-midi-skirt': 'M',
    'signature-mini-shoulder-bag': 'One Size (24 × 16 cm)',
    'chelsea-leather-ankle-boot': '42',
  });

  const getProduct = (id: string): Product =>
    PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];

  const columnDress = getProduct('column-dress-overshirt');
  const leatherWatch = getProduct('handcrafted-leather-watch');
  const pleatedTrouserMen = getProduct('tailored-pleated-trouser-men');
  const structuredTote = getProduct('structured-leather-tote-bag');
  const cashmereCoat = getProduct('cashmere-wrap-coat');

  const featuredAllIds = [
    'minimalist-cashmere-sweater',
    'pleated-silk-midi-skirt',
    'signature-mini-shoulder-bag',
    'chelsea-leather-ankle-boot',
  ];

  const visibleBestsellerProducts =
    bestsellerFilter === 'Semua'
      ? featuredAllIds.map(getProduct)
      : PRODUCTS.filter((p) => p.bestsellerTab === bestsellerFilter);

  const weeklyEditSideCards = [
    {
      product: leatherWatch,
      image: leatherWatch.image,
      alt: leatherWatch.alt,
      metaText: 'Stok Ready',
      metaClass: 'text-status-stock',
    },
    {
      product: pleatedTrouserMen,
      image: pleatedTrouserMen.image,
      alt: pleatedTrouserMen.alt,
      metaText: 'Size 28-36',
      metaClass: 'text-text-muted',
    },
    {
      product: structuredTote,
      image: structuredTote.image,
      alt: structuredTote.alt,
      metaText: 'Stok Menipis',
      metaClass: 'text-secondary font-semibold',
    },
    {
      product: cashmereCoat,
      image: cashmereCoat.gallery[1] || cashmereCoat.image,
      alt: cashmereCoat.alt,
      metaText: 'Atelier Fit',
      metaClass: 'text-text-muted',
    },
  ];

  const handlePortalClick = (id: string) => {
    if (id === 'men') onNavigate('men');
    else if (id === 'women') onNavigate('women');
    else if (id === 'bags') onNavigate('bags');
    else if (id === 'shoes') onNavigate('shoes');
    else onNavigate('curated-drops');
  };

  return (
    <div className="flex flex-col w-full">
      {/* HERO SECTION */}
      <section className="relative w-full bg-surface-sand/40 overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin pt-10 lg:pt-16 pb-6 flex flex-col items-center text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1 rounded-full bg-surface-container border border-border-ecru">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span className="font-label-uppercase text-label-uppercase uppercase tracking-[0.2em] text-on-surface-variant text-[10px]">
              CURATED DROP — VOL. 01
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display-hero text-[42px] leading-[48px] sm:text-[56px] sm:leading-[62px] lg:text-[68px] lg:leading-[74px] text-primary tracking-[-0.025em] max-w-4xl mx-auto">
            Fit check approved. <span className="italic font-normal text-secondary">Mewah tapi nggak ribet.</span>
          </h1>

          {/* Subtitle */}
          <p className="font-body-lg text-body-lg text-text-muted max-w-2xl mx-auto mt-5 mb-8">
            Outfit timeless yang kepake terus. Pas di badan, masuk di budget, tinggal mix-and-match.
          </p>

          {/* CTA Buttons & Size Guide Link */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-12">
            <a
              className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-8 bg-primary text-on-primary font-label-uppercase text-label-uppercase tracking-[0.14em] uppercase transition-all duration-300 hover:bg-neutral-800 hover:shadow-lg shadow-sm"
              href="#weekly-edit"
            >
              Explore Drop Baru
            </a>
            <button
              type="button"
              onClick={onOpenSizeGuide}
              className="inline-flex items-center gap-1.5 text-body-md font-body-md text-primary hover:text-secondary group transition-colors py-2 cursor-pointer"
            >
              <span>Biar Nggak Zonk (Size Guide)</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>

          {/* Hero Visual: Group of models in tonal cream, beige, and tailored silhouettes */}
          <div className="w-full relative mt-2 rounded-t-lg overflow-hidden border-b border-border-ecru">
            <img
              className="w-full h-[360px] sm:h-[480px] lg:h-[580px] object-cover object-top"
              alt="Editorial fashion studio lookbook lineup of eight diverse stylish models standing shoulder to shoulder wearing minimalist cream, sand, and taupe tailored blazers"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              src={BRAND_ASSETS.heroLineup}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-30 pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* CIRCULAR CATEGORY QUICK-LINKS */}
      <section className="w-full bg-surface py-12 lg:py-16 border-b border-border-ecru">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-6 sm:gap-8 justify-items-center">
            {CATEGORY_PORTALS.map((portal, index) => (
              <button
                key={portal.id}
                type="button"
                onClick={() => handlePortalClick(portal.id)}
                className={`group flex flex-col items-center text-center cursor-pointer ${
                  index === 4 ? 'col-span-3 sm:col-span-1' : ''
                }`}
              >
                <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1 border border-border-ecru group-hover:border-primary transition-all duration-300 bg-surface-card">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={portal.alt}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                      src={portal.image}
                    />
                  </div>
                </div>
                <span className="mt-3 font-body-md text-body-md font-medium text-primary group-hover:text-secondary transition-colors">
                  {portal.label}
                </span>
                <span className="font-body-sm text-[12px] text-text-muted">{portal.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* EDITORIAL GRID SECTION ("THIS WEEK'S EDIT") */}
      <section className="w-full py-16 lg:py-24 bg-surface" id="weekly-edit">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-border-ecru">
            <div>
              <span className="font-label-uppercase text-label-uppercase uppercase text-text-muted tracking-[0.18em] block mb-1">
                DROP TERBARU · MINGGU INI
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Racun Minggu Ini</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('women')}
              className="inline-flex items-center gap-1.5 font-label-uppercase text-label-uppercase uppercase tracking-wider text-primary hover:text-secondary group transition-colors cursor-pointer"
            >
              <span>Lihat Semua Lookbook</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                east
              </span>
            </button>
          </div>

          {/* Asymmetrical Editorial Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Column: Featured Major Look (5 cols) */}
            <div className="lg:col-span-5 bg-surface-card border border-border-ecru flex flex-col group overflow-hidden">
              <div
                onClick={() => onSelectProduct(columnDress)}
                className="relative w-full aspect-[4/5] lg:aspect-[3/4] overflow-hidden bg-surface-container-low cursor-pointer"
              >
                {/* Label Badge */}
                <div className="absolute top-4 left-4 z-10 bg-primary text-on-primary font-label-uppercase text-[10px] tracking-widest px-2.5 py-1">
                  DROP EKSKLUSIF
                </div>
                <img
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                  alt={columnDress.alt}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                  src={columnDress.gallery[1] || columnDress.image}
                />
                {/* Quick Add Overlay Trigger */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToBag(columnDress, columnDress.defaultSize, columnDress.colors[0]?.name);
                  }}
                  title="Tambah ke Bag"
                  aria-label={`Tambah ${columnDress.name} ke Bag`}
                  className="absolute bottom-4 right-4 z-10 w-10 h-10 rounded-full bg-surface-card/90 backdrop-blur-sm border border-border-ecru flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-on-primary transition-all duration-200 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
              </div>
              <div className="p-6 flex flex-col flex-1 justify-between bg-surface-card">
                <div onClick={() => onSelectProduct(columnDress)} className="cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-label-uppercase uppercase tracking-wider bg-surface-sand text-secondary font-medium">
                      {columnDress.fitScale}
                    </span>
                    <span className="text-body-sm text-[12px] text-text-muted">{columnDress.fabricType}</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-1 group-hover:text-secondary transition-colors">
                    {columnDress.name}
                  </h3>
                  <p className="font-body-md text-body-md text-text-muted">{columnDress.subtitle}</p>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-border-ecru mt-4">
                  <span className="font-price-lg text-price-lg text-primary">{columnDress.priceFormatted}</span>
                  <button
                    type="button"
                    onClick={() => onSelectProduct(columnDress)}
                    className="font-label-uppercase text-label-uppercase uppercase text-primary underline underline-offset-4 hover:text-secondary transition-colors cursor-pointer"
                  >
                    Lihat Cepat
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: 2x2 Modular Grid (7 cols) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              {weeklyEditSideCards.map((card) => (
                <div key={card.product.id} className="bg-surface-card border border-border-ecru flex flex-col group">
                  <div
                    onClick={() => onSelectProduct(card.product)}
                    className="relative w-full aspect-square overflow-hidden bg-surface-container-low cursor-pointer"
                  >
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={card.alt}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                      src={card.image}
                    />
                    <button
                      type="button"
                      aria-label="Toggle wishlist"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(card.product.id);
                      }}
                      className={`absolute top-3 right-3 transition-colors p-1 cursor-pointer ${
                        wishlistIds.includes(card.product.id)
                          ? 'text-error'
                          : 'text-on-surface-variant hover:text-error'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">favorite</span>
                    </button>
                  </div>
                  <div
                    onClick={() => onSelectProduct(card.product)}
                    className="p-4 flex flex-col justify-between flex-1 cursor-pointer"
                  >
                    <div>
                      <h4 className="font-body-md text-body-md font-medium text-primary group-hover:text-secondary transition-colors">
                        {card.product.name}
                      </h4>
                      <p className="font-body-sm text-body-sm text-text-muted">{card.product.subtitle}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-ecru">
                      <span className="font-price-md text-price-md text-primary">{card.product.priceFormatted}</span>
                      <span className={`font-label-uppercase text-[10px] tracking-wider uppercase ${card.metaClass}`}>
                        {card.metaText}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editorial Landscape Capsule Sub-Banner */}
          <div className="mt-12 w-full relative border border-border-ecru bg-surface-sand overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center">
              <div className="p-8 sm:p-12 md:col-span-6 flex flex-col justify-center">
                <span className="font-label-uppercase text-label-uppercase uppercase text-secondary tracking-[0.2em] mb-2">
                  KOLEKSI KULIT PILIHAN
                </span>
                <h3 className="font-headline-lg text-headline-lg text-primary mb-4 leading-tight">
                  Bikin Kamu Pede Tiap Hari di Segala Momen
                </h3>
                <p className="font-body-md text-body-md text-text-muted mb-8 max-w-md">
                  Koleksi kurasi buat mix, match, dan repeat tiap hari. Tampil mewah tanpa ribet.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => onNavigate('bags')}
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-[0.14em] hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Explore Koleksi Kulit
                  </button>
                </div>
              </div>
              <div className="md:col-span-6 h-64 sm:h-80 md:h-[380px] relative overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  alt="Editorial luxury display of caramel brown structured leather handbag placed gracefully on warm sunlit textured travertine plinth"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                  src={BRAND_ASSETS.leatherBanner}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BESTSELLERS & CORE FITS (4-COLUMN PRODUCT SHOWCASE) */}
      <section className="w-full py-16 lg:py-24 bg-surface-container-low/40 border-t border-border-ecru">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin">
          {/* Section Title & Category Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="font-label-uppercase text-label-uppercase uppercase tracking-[0.2em] text-text-muted block mb-1">
                PALING BANYAK DI-COP
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                Best Seller &amp; Fit Andalan
              </h2>
            </div>

            {/* Filter Pill Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {(['Semua', 'Outerwear', 'Celana', 'Dress', 'Tas', 'Sepatu'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setBestsellerFilter(tab)}
                  className={
                    bestsellerFilter === tab
                      ? 'px-4 py-2 bg-primary text-on-primary font-label-uppercase text-[11px] uppercase tracking-wider rounded-DEFAULT whitespace-nowrap cursor-pointer'
                      : 'px-4 py-2 bg-surface-card border border-border-ecru text-on-surface hover:border-primary font-label-uppercase text-[11px] uppercase tracking-wider rounded-DEFAULT transition-colors whitespace-nowrap cursor-pointer'
                  }
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* 4-Column Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleBestsellerProducts.map((product) => {
              const firstAvailable =
                product.sizes.find((sz) => !product.disabledSizes?.includes(sz)) || product.defaultSize;
              const currentSize = selectedSizes[product.id] || firstAvailable;
              const isWishlisted = wishlistIds.includes(product.id);
              const firstBadge = product.badges[0];

              return (
                <div
                  key={product.id}
                  className="bg-surface-card border border-border-ecru flex flex-col group transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                >
                  <div
                    onClick={() => onSelectProduct(product)}
                    className="relative w-full aspect-[3/4] overflow-hidden bg-surface-container cursor-pointer"
                  >
                    {firstBadge && (
                      <span
                        className={`absolute top-3 left-3 z-10 font-label-uppercase text-[10px] tracking-wider px-2 py-0.5 font-semibold ${
                          firstBadge.variant === 'secondary'
                            ? 'bg-secondary text-on-secondary'
                            : 'bg-primary text-on-primary'
                        }`}
                      >
                        {firstBadge.text}
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label="Toggle wishlist"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(product.id);
                      }}
                      className={`absolute top-3 right-3 z-10 p-1.5 rounded-full bg-surface-card/80 backdrop-blur-sm transition-colors cursor-pointer ${
                        isWishlisted ? 'text-error' : 'text-on-surface hover:text-error'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">favorite</span>
                    </button>
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={product.alt}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                      src={product.image}
                    />
                  </div>

                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-body-sm text-[11px] font-label-uppercase text-text-muted uppercase tracking-wider">
                          {product.subcategory}
                        </span>
                        <div className="flex items-center gap-1">
                          {product.colors.map((c) => (
                            <span
                              key={c.name}
                              title={c.name}
                              style={{ backgroundColor: c.hex }}
                              className="w-3 h-3 rounded-full border border-border-ecru"
                            />
                          ))}
                        </div>
                      </div>
                      <h3
                        onClick={() => onSelectProduct(product)}
                        className="font-body-md text-body-md font-medium text-primary line-clamp-1 cursor-pointer hover:text-secondary transition-colors"
                      >
                        {product.name}
                      </h3>
                      <p className="font-body-sm text-body-sm text-text-muted mb-4">{product.subtitle}</p>

                      {/* Quick Size Selector Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        {product.sizes.length === 1 ? (
                          <span className="px-2.5 py-1 text-[11px] font-body-sm bg-surface-container border border-border-ecru text-text-muted">
                            {product.sizes[0]}
                          </span>
                        ) : (
                          product.sizes.map((sz) => {
                            const isDisabled = product.disabledSizes?.includes(sz);
                            const isSelected = currentSize === sz;
                            return (
                              <button
                                key={sz}
                                type="button"
                                disabled={isDisabled}
                                onClick={() =>
                                  setSelectedSizes((prev) => ({
                                    ...prev,
                                    [product.id]: sz,
                                  }))
                                }
                                className={`w-8 h-8 flex items-center justify-center text-[11px] font-body-sm border transition-colors ${
                                  isDisabled
                                    ? 'border-border-ecru opacity-40 cursor-not-allowed line-through'
                                    : isSelected
                                    ? 'bg-primary text-on-primary border-primary cursor-pointer'
                                    : 'border-border-ecru hover:border-primary cursor-pointer'
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border-ecru flex items-center justify-between">
                      <span className="font-price-md text-price-md text-primary">{product.priceFormatted}</span>
                      <button
                        type="button"
                        onClick={() => onAddToBag(product, currentSize, product.colors[0]?.name)}
                        className="font-label-uppercase text-[11px] tracking-wider uppercase text-primary font-semibold hover:text-secondary transition-colors cursor-pointer"
                      >
                        + Masukin Bag
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Centered Catalog Link */}
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => onNavigate('curated-drops')}
              className="inline-flex items-center justify-center px-10 py-3.5 border border-primary text-primary hover:bg-primary hover:text-on-primary font-label-uppercase text-label-uppercase tracking-[0.14em] uppercase transition-all duration-300 cursor-pointer"
            >
              Lihat Semua Koleksi ({PRODUCTS.length} Kurasi)
            </button>
          </div>
        </div>
      </section>

      {/* VALUE PROPS & TRUST BAR */}
      <section className="w-full bg-surface-sand border-y border-border-ecru py-14 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Pillar 1 */}
            <div className="flex flex-col items-start pr-0 md:pr-6 border-b md:border-b-0 md:border-r border-border-ecru pb-8 md:pb-0">
              <div className="w-10 h-10 rounded-full bg-surface-card border border-border-ecru flex items-center justify-center text-primary mb-4">
                <span className="material-symbols-outlined text-[20px]">straighten</span>
              </div>
              <h4 className="font-headline-sm text-[20px] leading-[26px] text-primary mb-2">Fit Check Anti-Zonk</h4>
              <p className="font-body-md text-body-md text-text-muted leading-relaxed">
                Detail ukuran riil &amp; proporsi model transparan biar kamu nggak nebak-nebak size lagi.
              </p>
            </div>
            {/* Pillar 2 */}
            <div className="flex flex-col items-start pr-0 md:pr-6 border-b md:border-b-0 md:border-r border-border-ecru pb-8 md:pb-0">
              <div className="w-10 h-10 rounded-full bg-surface-card border border-border-ecru flex items-center justify-center text-primary mb-4">
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              </div>
              <h4 className="font-headline-sm text-[20px] leading-[26px] text-primary mb-2">
                Kurasi Ketat, Gak Bikin Pusing
              </h4>
              <p className="font-body-md text-body-md text-text-muted leading-relaxed">
                Koleksi drop mingguan terkurasi rapi, bukan ribuan katalog acak yang bikin capek scroll.
              </p>
            </div>
            {/* Pillar 3 */}
            <div className="flex flex-col items-start">
              <div className="w-10 h-10 rounded-full bg-surface-card border border-border-ecru flex items-center justify-center text-primary mb-4">
                <span className="material-symbols-outlined text-[20px]">bolt</span>
              </div>
              <h4 className="font-headline-sm text-[20px] leading-[26px] text-primary mb-2">
                Checkout Sat-Set No Drama
              </h4>
              <p className="font-body-md text-body-md text-text-muted leading-relaxed">
                Bebas biaya siluman gaib, bayar gampang via QRIS &amp; Virtual Account, plus retur 30 hari santai.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
