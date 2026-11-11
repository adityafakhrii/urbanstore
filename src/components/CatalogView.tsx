import React, { useState, useMemo } from 'react';
import { BRAND_ASSETS, PRODUCTS, Product } from '../data/products';
import { ActivePage } from './Header';

interface CatalogViewProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onSelectProduct: (product: Product) => void;
  onAddToBag: (product: Product, size: string, colorName?: string) => void;
  onToggleWishlist: (productId: string) => void;
  wishlistIds: string[];
  onOpenSizeGuide: () => void;
  searchQuery: string;
  onClearSearch: () => void;
  onShowToast: (msg: string) => void;
}

const SUBCATEGORIES = [
  'Semua Outfit',
  'Dress & Setelan',
  'Outerwear Atelier',
  'Celana Tailored',
  'Knitwear',
  'Tas Kurasi',
] as const;

const COLOR_SWATCHES = [
  { name: 'Alabaster Cream', hex: '#FAF7F2' },
  { name: 'Soft Oat', hex: '#E8E0D5' },
  { name: 'Desert Taupe', hex: '#C2B2A3' },
  { name: 'Olive Earth', hex: '#646A55' },
  { name: 'Deep Ink', hex: '#1C1C19' },
];

export const CatalogView: React.FC<CatalogViewProps> = ({
  activePage,
  onNavigate,
  onSelectProduct,
  onAddToBag,
  onToggleWishlist,
  wishlistIds,
  onOpenSizeGuide,
  searchQuery,
  onClearSearch,
  onShowToast,
}) => {
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(true);
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('Semua Outfit');
  const [sortBy, setSortBy] = useState<string>('Kurasi / Favorit');

  // Filter Drawer states matching code_03270c42.html initial appearance
  const [selectedSize, setSelectedSize] = useState<string | null>('S');
  const [selectedColor, setSelectedColor] = useState<string>('Alabaster Cream');
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>(['Linen Organik']);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>('500rb - 1jt');
  const [readyStockOnly, setReadyStockOnly] = useState<boolean>(true);
  const [userModifiedFilters, setUserModifiedFilters] = useState<boolean>(false);
  const [activePageNumber, setActivePageNumber] = useState<number>(1);
  const [loadedExtra, setLoadedExtra] = useState<boolean>(false);
  const [manifestoModalOpen, setManifestoModalOpen] = useState<boolean>(false);

  // Header metadata based on active navigation tab
  const collectionMeta = useMemo(() => {
    switch (activePage) {
      case 'men':
        return {
          breadcrumbCategory: 'Pria',
          breadcrumbLeaf: 'Tailored Menswear',
          edition: 'EDISI 04 / MODERN MENSWEAR ATELIER',
          title: 'Kapsul Kurasi Cowok',
          description:
            'Potongan relaxed tailoring dari katun twill organik, linen Eropa, dan aksesori kulit calfskin. Fit rapi tanpa kaku, langsung siap dipakai harian.',
          totalText: 'Nampilin 24 dari 120 Outfit Pilihan',
        };
      case 'bags':
        return {
          breadcrumbCategory: 'Tas',
          breadcrumbLeaf: 'Leather Goods',
          edition: 'EDISI 04 / ITALIAN CALFSKIN ARCHIVE',
          title: 'Koleksi Tas Kulit Kurasi',
          description:
            'Siluet struktural dari full-grain Italian calfskin dengan hardware brass minimalis. Tahan banting buat ngantor sampe hangout malam.',
          totalText: 'Nampilin 18 dari 45 Tas Pilihan',
        };
      case 'shoes':
        return {
          breadcrumbCategory: 'Sepatu',
          breadcrumbLeaf: 'Artisanal Footwear',
          edition: 'EDISI 04 / HANDWELTED FOOTWEAR',
          title: 'Sepatu Kulit & Loafers',
          description:
            'Konstruksi Blake-stitched dengan bantalan insole memory foam berlapis calfskin. Empuk dari langkah pertama tanpa drama lecet.',
          totalText: 'Nampilin 16 dari 60 Sepatu Pilihan',
        };
      case 'curated-drops':
        return {
          breadcrumbCategory: 'Curated Drops',
          breadcrumbLeaf: 'Vol. 01 Archive',
          edition: 'CURATED DROP — VOL. 01 / FULL ARCHIVE',
          title: 'Edisi Terbatas Minggu Ini',
          description:
            'Rangkaian kapsul lengkap pria dan wanita dari rilisan terbaru UrbanStore Atelier. Diproduksi terbatas dalam batch kecil.',
          totalText: 'Nampilin 24 dari 128 Outfit Pilihan',
        };
      default:
        return {
          breadcrumbCategory: 'Wanita',
          breadcrumbLeaf: 'Kapsul Kurasi',
          edition: 'EDISI 04 / AUTUMN-WARM MINIMAL',
          title: 'Kapsul Kurasi Cewek',
          description:
            'Siluet timeless dari bahan linen alami Eropa, sutra twill halus, dan kasmir organik. Cutting relaxed fit yang nyaman di badan, auto-approved buat daily wear.',
          totalText: 'Nampilin 24 dari 128 Outfit Pilihan',
        };
    }
  }, [activePage]);

  // The 8 exact catalog products from code_03270c42.html in order
  const baseCatalogProducts = useMemo(() => {
    const core8Ids = [
      'column-dress-overshirt',
      'pleated-silk-midi-skirt',
      'linen-double-breasted-blazer',
      'minimalist-cashmere-sweater',
      'wide-leg-pleated-trousers',
      'cashmere-wrap-coat',
      'sculptured-leather-shoulder-bag',
      'silk-studio-shirt',
    ];
    const core8 = core8Ids
      .map((id) => PRODUCTS.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));

    if (activePage === 'men') {
      const menItems = PRODUCTS.filter((p) => p.category === 'men' || p.category === 'accessories' || p.category === 'shoes');
      return [...menItems, ...core8.slice(0, 5)];
    }
    if (activePage === 'bags') {
      const bagItems = PRODUCTS.filter((p) => p.category === 'bags');
      return [...bagItems, ...core8.filter((p) => p.category !== 'bags').slice(0, 5)];
    }
    if (activePage === 'shoes') {
      const shoeItems = PRODUCTS.filter((p) => p.category === 'shoes');
      return [...shoeItems, ...core8.slice(0, 7)];
    }
    if (activePage === 'curated-drops') {
      return PRODUCTS;
    }
    return core8;
  }, [activePage]);

  const filteredProducts = useMemo(() => {
    let list = [...baseCatalogProducts];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q) ||
          p.fabricType.toLowerCase().includes(q)
      );
    }

    // Subcategory pill filter
    if (selectedSubcategory !== 'Semua Outfit') {
      list = list.filter((p) => p.subcategory === selectedSubcategory);
    }

    // Only apply strict drawer filters when user actively clicks to filter
    if (userModifiedFilters) {
      if (selectedSize) {
        list = list.filter((p) => p.sizes.includes(selectedSize) || p.sizes.includes('One Size'));
      }
      if (selectedFabrics.length > 0) {
        list = list.filter((p) => selectedFabrics.includes(p.fabricType));
      }
      if (selectedPriceRange === '< 500rb') {
        list = list.filter((p) => p.price < 500000);
      } else if (selectedPriceRange === '500rb - 1jt') {
        list = list.filter((p) => p.price >= 400000 && p.price <= 1000000);
      } else if (selectedPriceRange === '> 1jt') {
        list = list.filter((p) => p.price > 1000000);
      }
    }

    // Sorting
    if (sortBy === 'Harga: Rendah ke Tinggi') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Harga: Tinggi ke Rendah') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'Drop Terbaru') {
      list.sort((a, b) => (b.badges[0]?.text === 'DROP BARU' ? 1 : -1));
    }

    if (loadedExtra) {
      const extraItems = PRODUCTS.filter((p) => !list.some((existing) => existing.id === p.id));
      list = [...list, ...extraItems];
    }

    return list;
  }, [
    baseCatalogProducts,
    searchQuery,
    selectedSubcategory,
    userModifiedFilters,
    selectedSize,
    selectedFabrics,
    selectedPriceRange,
    sortBy,
    loadedExtra,
  ]);

  const firstSectionProducts = filteredProducts.slice(0, 4);
  const secondSectionProducts = filteredProducts.slice(4);

  const toggleFabric = (fabric: string) => {
    setUserModifiedFilters(true);
    setSelectedFabrics((prev) =>
      prev.includes(fabric) ? prev.filter((f) => f !== fabric) : [...prev, fabric]
    );
  };

  const handleResetFilters = () => {
    setSelectedSize(null);
    setSelectedFabrics([]);
    setSelectedPriceRange(null);
    setSelectedSubcategory('Semua Outfit');
    setUserModifiedFilters(false);
    if (searchQuery) onClearSearch();
    onShowToast('Semua filter udah di-reset. Nampilin koleksi lengkap!');
  };

  const renderProductCard = (product: Product) => {
    const isWishlisted = wishlistIds.includes(product.id);

    return (
      <article
        key={product.id}
        className="group flex flex-col bg-surface-card rounded-DEFAULT overflow-hidden transition-all duration-300 hover:shadow-md"
      >
        <div
          onClick={() => onSelectProduct(product)}
          className="relative aspect-[3/4] bg-surface-container-low overflow-hidden cursor-pointer"
        >
          <img
            className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
            alt={product.alt}
            referrerPolicy="no-referrer"
            src={product.image}
          />
          {/* Micro Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.badges.map((b, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 font-label-uppercase text-[10px] tracking-widest uppercase rounded-DEFAULT ${
                  b.variant === 'primary'
                    ? 'bg-primary text-on-primary'
                    : b.variant === 'secondary'
                    ? 'bg-surface-bright/90 backdrop-blur text-secondary'
                    : 'bg-surface-bright/90 backdrop-blur text-primary'
                }`}
              >
                {b.text}
              </span>
            ))}
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            aria-label="Add to wishlist"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-bright/80 hover:bg-surface-bright flex items-center justify-center transition-colors cursor-pointer ${
              isWishlisted ? 'text-error' : 'text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">favorite</span>
          </button>

          {/* Quick Add Overlay (appears on desktop hover) */}
          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToBag(product, product.defaultSize);
              }}
              className="w-full bg-primary text-on-primary py-2.5 font-label-uppercase text-label-uppercase uppercase tracking-wider rounded-DEFAULT hover:bg-primary-container shadow-md flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>+ Tambah ke Bag</span>
            </button>
          </div>
        </div>

        <div
          onClick={() => onSelectProduct(product)}
          className="p-4 flex flex-col flex-1 justify-between gap-3 bg-surface-card cursor-pointer"
        >
          <div>
            <div className="flex items-baseline justify-between mb-1 gap-2">
              <h3 className="font-body-md text-body-md font-medium text-primary group-hover:text-secondary transition-colors">
                {product.name}
              </h3>
              <span className="font-price-md text-price-md text-primary shrink-0">{product.priceFormatted}</span>
            </div>
            <p className="font-body-sm text-body-sm text-text-muted">{product.subtitle}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-status-stock"></span>
              <span className="font-body-sm text-[11px] text-text-muted">{product.fitNote}</span>
            </div>
          </div>

          {/* Size Selector & Swatches inline */}
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {product.colors.map((c, idx) => (
                <span
                  key={c.name}
                  title={c.name}
                  style={{ backgroundColor: c.hex }}
                  className={`w-5 h-5 rounded-full ${
                    idx === 0 ? 'ring-1 ring-primary ring-offset-1' : 'border border-border-ecru'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-label-uppercase text-text-muted">
              {product.sizes.map((sz, i) => (
                <React.Fragment key={sz}>
                  {i > 0 && <span>·</span>}
                  <span className={sz === product.defaultSize && product.sizes.length > 1 ? 'font-semibold text-primary' : ''}>
                    {sz}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Collection Header & Breadcrumbs */}
      <section className="w-full bg-surface-bright pb-space-lg">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin">
          {/* Breadcrumb Bar */}
          <nav className="flex items-center gap-2 pt-space-md pb-space-sm font-label-uppercase text-label-uppercase text-text-muted">
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
              onClick={() => onNavigate(activePage)}
              className="hover:text-primary transition-colors cursor-pointer uppercase"
            >
              {collectionMeta.breadcrumbCategory}
            </button>
            <span className="text-surface-dim">/</span>
            <span className="text-primary font-semibold">{collectionMeta.breadcrumbLeaf}</span>
          </nav>

          {/* Headline & Editorial Narrative */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg pt-space-sm pb-space-md">
            <div className="max-w-2xl">
              <span className="font-label-uppercase text-label-uppercase text-secondary uppercase tracking-widest block mb-2">
                {collectionMeta.edition}
              </span>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight mb-3">
                {collectionMeta.title}
              </h1>
              <p className="font-body-md text-body-md text-text-muted max-w-xl">
                {collectionMeta.description}
              </p>
            </div>
            <div className="flex items-baseline gap-4 self-start lg:self-end">
              <div className="bg-surface-container-low px-4 py-2 rounded-DEFAULT">
                <span className="font-label-uppercase text-label-uppercase text-text-muted block text-[10px]">
                  Total Kurasi
                </span>
                <span className="font-body-md text-body-md font-medium text-primary">
                  {collectionMeta.totalText}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter Bar & Control Bar */}
      <div className="sticky top-20 z-40 bg-surface-bright/95 backdrop-blur-md shadow-sm">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          {/* Subcategory Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {SUBCATEGORIES.map((sub) => {
              const isSelected = selectedSubcategory === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubcategory(sub)}
                  className={
                    isSelected
                      ? 'px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-uppercase text-label-uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer'
                      : 'px-4 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-label-uppercase text-label-uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer'
                  }
                >
                  {sub}
                </button>
              );
            })}
          </div>

          {/* Controls Right: Filters Toggle, Sort, Grid Switcher */}
          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setFilterDrawerOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container-low hover:bg-surface-container rounded-DEFAULT text-primary font-label-uppercase text-label-uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">tune</span>
              <span>Filters</span>
              {(selectedSize || selectedFabrics.length > 0 || selectedPriceRange) && (
                <span className="w-1.5 h-1.5 rounded-full bg-secondary ml-0.5"></span>
              )}
            </button>

            <div className="relative inline-block text-left">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-surface-container-low hover:bg-surface-container text-on-surface font-label-uppercase text-label-uppercase pl-3 pr-8 py-1.5 rounded-DEFAULT focus:outline-none cursor-pointer"
              >
                <option value="Kurasi / Favorit">Kurasi / Favorit</option>
                <option value="Drop Terbaru">Drop Terbaru</option>
                <option value="Harga: Rendah ke Tinggi">Harga: Rendah ke Tinggi</option>
                <option value="Harga: Tinggi ke Rendah">Harga: Tinggi ke Rendah</option>
                <option value="Paling Dicari">Paling Dicari</option>
              </select>
              <span className="material-symbols-outlined text-[16px] pointer-events-none absolute right-2 top-2 text-text-muted">
                expand_more
              </span>
            </div>

            <div className="hidden sm:flex items-center bg-surface-container-low p-0.5 rounded-DEFAULT">
              <button
                type="button"
                aria-label="3 columns grid"
                onClick={() => setGridCols(3)}
                className={`p-1 rounded-DEFAULT transition-colors cursor-pointer ${
                  gridCols === 3 ? 'bg-surface-card shadow-sm text-primary' : 'text-text-muted hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">view_column</span>
              </button>
              <button
                type="button"
                aria-label="4 columns grid"
                onClick={() => setGridCols(4)}
                className={`p-1 rounded-DEFAULT transition-colors cursor-pointer ${
                  gridCols === 4 ? 'bg-surface-card shadow-sm text-primary' : 'text-text-muted hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Quick Filter Drawer / Strip */}
        {filterDrawerOpen && (
          <div className="bg-surface-sand transition-all duration-300 border-t border-border-ecru/60">
            <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin py-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Size Selector */}
                <div>
                  <span className="font-label-uppercase text-[10px] tracking-wider uppercase text-text-muted block mb-2">
                    UKURAN
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(['XS', 'S', 'M', 'L', 'XL'] as const).map((sz) => {
                      const isDisabled = sz === 'XL';
                      const isSelected = selectedSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            setUserModifiedFilters(true);
                            setSelectedSize(isSelected ? null : sz);
                          }}
                          className={
                            isDisabled
                              ? 'w-8 h-8 rounded-DEFAULT bg-surface-card text-on-surface font-body-sm text-xs opacity-40 cursor-not-allowed'
                              : isSelected
                              ? 'w-8 h-8 rounded-DEFAULT bg-primary text-on-primary font-body-sm text-xs cursor-pointer'
                              : 'w-8 h-8 rounded-DEFAULT bg-surface-card text-on-surface font-body-sm text-xs hover:bg-primary hover:text-on-primary transition-colors cursor-pointer'
                          }
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Swatches */}
                <div>
                  <span className="font-label-uppercase text-[10px] tracking-wider uppercase text-text-muted block mb-2">
                    PALET WARNA
                  </span>
                  <div className="flex items-center gap-2">
                    {COLOR_SWATCHES.map((swatch) => {
                      const isSelected = selectedColor === swatch.name;
                      return (
                        <button
                          key={swatch.name}
                          type="button"
                          onClick={() => setSelectedColor(swatch.name)}
                          style={{ backgroundColor: swatch.hex }}
                          className={`w-6 h-6 rounded-full cursor-pointer ${
                            isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary'
                          }`}
                          title={swatch.name}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Fabric Filter */}
                <div>
                  <span className="font-label-uppercase text-[10px] tracking-wider uppercase text-text-muted block mb-2">
                    BAHAN UTAMA
                  </span>
                  <div className="flex flex-col gap-1 text-xs font-body-sm">
                    {[
                      { label: 'Linen Organik (14)', value: 'Linen Organik' },
                      { label: 'Sutra Mulberry (8)', value: 'Sutra Mulberry' },
                      { label: 'Kasmir Murni (6)', value: 'Kasmir Murni' },
                    ].map((fab) => (
                      <label key={fab.value} className="inline-flex items-center gap-2 text-on-surface cursor-pointer">
                        <input
                          checked={selectedFabrics.includes(fab.value)}
                          onChange={() => toggleFabric(fab.value)}
                          className="rounded-DEFAULT accent-primary w-3.5 h-3.5"
                          type="checkbox"
                        />
                        <span>{fab.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range Chips */}
                <div>
                  <span className="font-label-uppercase text-[10px] tracking-wider uppercase text-text-muted block mb-2">
                    RENTANG HARGA
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(['< 500rb', '500rb - 1jt', '> 1jt'] as const).map((range) => {
                      const isSelected = selectedPriceRange === range;
                      return (
                        <button
                          key={range}
                          type="button"
                          onClick={() => {
                            setUserModifiedFilters(true);
                            setSelectedPriceRange(isSelected ? null : range);
                          }}
                          className={
                            isSelected
                              ? 'px-2 py-1 bg-primary text-on-primary rounded-DEFAULT text-[11px] font-body-sm cursor-pointer'
                              : 'px-2 py-1 bg-surface-card rounded-DEFAULT text-[11px] font-body-sm cursor-pointer hover:bg-surface-container'
                          }
                        >
                          {range}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stock & Clear Action */}
                <div className="flex flex-col justify-between">
                  <div>
                    <span className="font-label-uppercase text-[10px] tracking-wider uppercase text-text-muted block mb-2">
                      KETERSEDIAAN
                    </span>
                    <label className="inline-flex items-center gap-2 text-xs font-body-sm text-status-stock font-medium cursor-pointer">
                      <input
                        checked={readyStockOnly}
                        onChange={(e) => setReadyStockOnly(e.target.checked)}
                        className="rounded-DEFAULT accent-status-stock w-3.5 h-3.5"
                        type="checkbox"
                      />
                      <span>Ready stock, langsung gas kirim dlm 24 jam</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="font-label-uppercase text-[10px] tracking-wider uppercase text-secondary hover:underline text-left mt-2 cursor-pointer"
                  >
                    RESET SEMUA FILTER
                  </button>
                </div>
              </div>

              {/* Active Filter Pills Strip */}
              <div className="flex items-center gap-2 pt-3 mt-3 overflow-x-auto">
                <span className="font-label-uppercase text-[10px] tracking-wider text-text-muted uppercase shrink-0">
                  Aktif:
                </span>
                {selectedSize && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-card rounded-full font-body-sm text-xs text-on-surface">
                    Ukuran: {selectedSize}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSize(null);
                        setUserModifiedFilters(true);
                      }}
                      className="material-symbols-outlined text-[13px] cursor-pointer hover:text-error"
                    >
                      close
                    </button>
                  </span>
                )}
                {selectedFabrics.map((fab) => (
                  <span
                    key={fab}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-card rounded-full font-body-sm text-xs text-on-surface"
                  >
                    Bahan: {fab}
                    <button
                      type="button"
                      onClick={() => toggleFabric(fab)}
                      className="material-symbols-outlined text-[13px] cursor-pointer hover:text-error"
                    >
                      close
                    </button>
                  </span>
                ))}
                {selectedPriceRange && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-card rounded-full font-body-sm text-xs text-on-surface">
                    {selectedPriceRange}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPriceRange(null);
                        setUserModifiedFilters(true);
                      }}
                      className="material-symbols-outlined text-[13px] cursor-pointer hover:text-error"
                    >
                      close
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-card rounded-full font-body-sm text-xs text-on-surface">
                    Cari: &ldquo;{searchQuery}&rdquo;
                    <button
                      type="button"
                      onClick={onClearSearch}
                      className="material-symbols-outlined text-[13px] cursor-pointer hover:text-error"
                    >
                      close
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Product Listing Section (Part 1) */}
      <section className="w-full py-space-xl">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin">
          {filteredProducts.length === 0 ? (
            <div className="bg-surface-card border border-border-ecru p-12 text-center my-6">
              <span className="material-symbols-outlined text-[36px] text-text-muted mb-3">checkroom</span>
              <h3 className="font-headline-sm text-headline-sm text-primary mb-2">
                Belum ada outfit yang cocok sama kombinasi filter ini
              </h3>
              <p className="font-body-md text-body-md text-text-muted mb-6 max-w-md mx-auto">
                Coba longgarin filter ukuran atau bahan biar pilihan kurasi lainnya kelihatan.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-6 py-3 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-wider rounded-DEFAULT cursor-pointer"
              >
                Reset Filter Sekarang
              </button>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 ${
                gridCols === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
              } gap-x-gutter gap-y-space-xl`}
            >
              {firstSectionProducts.map(renderProductCard)}
            </div>
          )}
        </div>
      </section>

      {/* Editorial Break: Fit & Fabric Transparency Strip */}
      <section className="w-full my-space-lg bg-surface-sand">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin py-space-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
            {/* Visual Craft Image */}
            <div className="lg:col-span-5 relative">
              <div className="aspect-[4/3] rounded-DEFAULT overflow-hidden shadow-sm">
                <img
                  className="w-full h-full object-cover"
                  alt="Macro close up photography of high quality European woven flax fabric and bespoke tailor tape measure on wooden workbench"
                  referrerPolicy="no-referrer"
                  src={BRAND_ASSETS.editorialCraft}
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-surface-card p-3 rounded-DEFAULT shadow-md hidden sm:block max-w-[200px]">
                <span className="font-label-uppercase text-[10px] text-secondary tracking-widest uppercase block mb-1">
                  TRANSPARANSI TOTAL
                </span>
                <p className="font-body-sm text-[12px] text-text-muted">
                  GOTS Certified Organic Flax &amp; Oeko-Tex Standard 100.
                </p>
              </div>
            </div>

            {/* Editorial Copy & Fit Philosophy */}
            <div className="lg:col-span-7 lg:pl-space-lg">
              <span className="font-label-uppercase text-label-uppercase uppercase tracking-widest text-secondary block mb-2">
                UKURAN PRESISI &amp; TRANSPARAN
              </span>
              <h2 className="font-headline-md text-headline-md text-primary mb-3">
                Fit Anti-Zonk — Nggak Perlu Nebak Ukuran Badan.
              </h2>
              <p className="font-body-md text-body-md text-text-muted mb-space-md max-w-xl">
                Nggak ada lagi drama salah size. Tiap outfit kami ukur detail dari lingkar dada, pinggang, sampe
                panjang baju. Dicocokin langsung sama postur tubuh nyata biar pas di badan kamu.
              </p>

              {/* Metric Key Highlights */}
              <div className="grid grid-cols-3 gap-4 mb-space-md py-3">
                <div>
                  <span className="font-headline-sm text-headline-sm text-primary block">Tuker 30 Hari</span>
                  <span className="font-body-sm text-[12px] text-text-muted">
                    Salah ukuran? Tuker santai tanpa ribet
                  </span>
                </div>
                <div>
                  <span className="font-headline-sm text-headline-sm text-primary block">100%</span>
                  <span className="font-body-sm text-[12px] text-text-muted">Bahan serat alami tersertifikasi</span>
                </div>
                <div>
                  <span className="font-headline-sm text-headline-sm text-primary block">2mm</span>
                  <span className="font-body-sm text-[12px] text-text-muted">
                    Jahitan french seam rapi &amp; presisi
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setManifestoModalOpen(true)}
                  className="bg-primary text-on-primary px-6 py-3 font-label-uppercase text-label-uppercase uppercase tracking-wider rounded-DEFAULT hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  BACA MANIFESTO FIT KAMI
                </button>
                <button
                  type="button"
                  onClick={onOpenSizeGuide}
                  className="font-label-uppercase text-label-uppercase uppercase tracking-wider text-primary hover:text-secondary transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>BIAR NGGAK ZONK (SIZE GUIDE)</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Catalog Grid Continued (Part 2) */}
      {secondSectionProducts.length > 0 && (
        <section className="w-full pb-space-xl">
          <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin">
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 ${
                gridCols === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
              } gap-x-gutter gap-y-space-xl`}
            >
              {secondSectionProducts.map(renderProductCard)}
            </div>
          </div>
        </section>
      )}

      {/* Load More & Editorial Pagination Container */}
      <section className="w-full pb-space-2xl bg-surface-bright">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin text-center">
          {/* Progress Bar indicator */}
          <div className="max-w-xs mx-auto mb-4">
            <div className="flex items-center justify-between font-label-uppercase text-[11px] text-text-muted mb-1.5">
              <span>Nampilin {filteredProducts.length} dari 128 Outfit</span>
              <span>Halaman {activePageNumber} dari 16</span>
            </div>
            <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: loadedExtra ? '30%' : '15%' }}
              ></div>
            </div>
          </div>

          {/* Load More Button */}
          <div className="inline-flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setLoadedExtra(true);
                onShowToast('Nampilin seluruh arsip kurasi terbaru!');
              }}
              className="px-8 py-3.5 bg-surface-card hover:bg-surface-container text-primary font-label-uppercase text-label-uppercase uppercase tracking-wider rounded-DEFAULT shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{loadedExtra ? 'SEMUA DROP MINGGU INI UDAH TAMPIL' : 'LOAD 12 OUTFIT LAGI'}</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
            <span className="font-body-sm text-[12px] text-text-muted flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-status-stock">check_circle</span>
              ✓ Garansi tuker size santai dijemput kurir dalam 30 hari
            </span>
          </div>

          {/* Minimal Page Selector */}
          <div className="flex items-center justify-center gap-2 mt-8 font-label-uppercase text-[12px]">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setActivePageNumber(num);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-8 h-8 rounded-DEFAULT transition-colors cursor-pointer ${
                  activePageNumber === num
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-card text-on-surface hover:bg-surface-container'
                }`}
              >
                {num}
              </button>
            ))}
            <span className="px-1 text-text-muted">...</span>
            <button
              type="button"
              onClick={() => {
                setActivePageNumber(16);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`w-8 h-8 rounded-DEFAULT transition-colors cursor-pointer ${
                activePageNumber === 16
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-card text-on-surface hover:bg-surface-container'
              }`}
            >
              16
            </button>
            <button
              type="button"
              onClick={() => {
                const next = activePageNumber < 16 ? activePageNumber + 1 : 1;
                setActivePageNumber(next);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-1 rounded-DEFAULT bg-surface-card text-on-surface hover:bg-surface-container transition-colors ml-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Manifesto Fit Modal */}
      {manifestoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#1A1A1A]/30 backdrop-blur-[2px]"
            onClick={() => setManifestoModalOpen(false)}
          />
          <div className="relative bg-surface-card border border-border-ecru max-w-lg w-full p-8 z-10 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-border-ecru mb-5">
              <div>
                <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
                  URBANSTORE ATELIER
                </span>
                <h3 className="font-headline-sm text-headline-sm text-primary">Manifesto Fit &amp; Bahan Kami</h3>
              </div>
              <button
                type="button"
                onClick={() => setManifestoModalOpen(false)}
                className="p-1 text-on-surface hover:text-secondary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <div className="space-y-4 font-body-md text-body-md text-text-muted">
              <p>
                Di UrbanStore, kami percaya baju yang bagus itu bukan yang cuma kelihatan estetik di foto studio, tapi
                yang jatuhnya pas di postur tubuh nyata dan adem dipakai seharian.
              </p>
              <div className="p-4 bg-surface-sand border border-border-ecru space-y-2 text-body-sm">
                <div className="font-semibold text-primary">3 Janji Anti-Zonk UrbanStore:</div>
                <p>1. Semua pola diuji di 5 tipe postur tubuh Indonesia sebelum masuk produksi.</p>
                <p>2. Serat alami 100% transparan: GOTS Certified Linen, Mulberry Silk 22mm, &amp; Cashmere.</p>
                <p>3. Kurir jemput gratis ke rumah kalau kamu merasa size yang dipilih kurang pas.</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border-ecru flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setManifestoModalOpen(false);
                  onOpenSizeGuide();
                }}
                className="px-5 py-2.5 border border-primary text-primary font-label-uppercase text-label-uppercase uppercase cursor-pointer"
              >
                Cek Size Guide
              </button>
              <button
                type="button"
                onClick={() => setManifestoModalOpen(false)}
                className="px-5 py-2.5 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase cursor-pointer"
              >
                Paham, Lanjut Eksplor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
