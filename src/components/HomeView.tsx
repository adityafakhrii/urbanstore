import React, { useState } from 'react';
import { BRAND_ASSETS, CATEGORY_PORTALS, PRODUCTS, Product } from '../data/products';
import { ActivePage } from './Header';

interface HomeViewProps {
  onNavigate: (page: ActivePage) => void;
  onSelectProduct: (product: Product) => void;
  onAddToBag: (product: Product, size: string, colorName?: string) => void;
  onToggleWishlist: (productId: string) => void;
  wishlistIds: string[];
  onOpenSizeGuide: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onSelectProduct,
  onAddToBag,
  onToggleWishlist,
  wishlistIds,
  onOpenSizeGuide,
}) => {
  const [bestsellerFilter, setBestsellerFilter] = useState<'Semua' | 'Outerwear' | 'Celana' | 'Dress' | 'Sepatu'>('Semua');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({
    'minimalist-cashmere-sweater': 'S',
    'pleated-silk-midi-skirt': 'M',
    'signature-mini-shoulder-bag': 'One Size (24 × 16 cm)',
    'chelsea-leather-ankle-boot': '42',
  });

  const columnDress = PRODUCTS.find((p) => p.id === 'column-dress-overshirt')!;
  const leatherWatch = PRODUCTS.find((p) => p.id === 'handcrafted-leather-watch')!;
  const pleatedTrouserMen = PRODUCTS.find((p) => p.id === 'tailored-pleated-trouser-men')!;
  const structuredTote = PRODUCTS.find((p) => p.id === 'structured-leather-tote-bag')!;
  const cashmereCoat = PRODUCTS.find((p) => p.id === 'cashmere-wrap-coat')!;

  const bestsellerCardData = [
    {
      product: PRODUCTS.find((p) => p.id === 'minimalist-cashmere-sweater')!,
      tag: 'DROP BARU',
      tagVariant: 'primary' as const,
      kicker: 'Atelier Knit',
      displayTitle: 'Minimalist Cashmere Sweater',
      displaySubtitle: 'Alabaster White',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB5UjbzvhaQiTlO4j_Ce-TWF5AvUj1YOGUnJsPrkrR8fbrxX_ev7CJ4oAfPeaxufa72VIGZfG-fCWjFuLE-Ec9tV28_CdjLPy0G2d1nbKqQUDFcM_CfHON92ArbeyJHPW4Ldm_rfYEUCvmOvE2HAAR8rRDtO3xwZIw5yuUAkAedCLMQBB4e4R3A9iEte8hqpOLSHMnNijt5InBbRjTjvbvtHZHgQMXWDweGNitiFhsj',
      swatches: ['#F5F2EB', '#3D3A37'],
      sizes: ['XS', 'S', 'M', 'L'],
      disabledSize: undefined,
      tab: 'Outerwear' as const,
    },
    {
      product: PRODUCTS.find((p) => p.id === 'pleated-silk-midi-skirt')!,
      tag: undefined,
      tagVariant: undefined,
      kicker: 'Silks',
      displayTitle: 'Pleated Midi Silk Skirt',
      displaySubtitle: 'Soft Beige · Silk Twill',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDWgEOUb2gnI1pfX3PYPk6iVFAyOtoYV7Fu-eiGEyD4KAtgwJXiLpAZ_oFJCqg9DySYL6MgpdhRs1AfyMFZH6D7I_aE625YG1vfxKY6kYmay_UQVyPaAPgiI0b9oa-H3esxHQN8xkuKLmhBmXnn4z5BYB4qfKYfL5ANS9XY2ACkJuzkaKgMGkpHzJNai2PFH8DANnX_tKXMJwbjxCDHr79lV7EfFue2hwup8ezC-faM',
      swatches: ['#E8DFD8', '#1C1C19'],
      sizes: ['S', 'M', 'L', 'XL'],
      disabledSize: 'XL',
      tab: 'Dress' as const,
    },
    {
      product: PRODUCTS.find((p) => p.id === 'signature-mini-shoulder-bag')!,
      tag: 'RESTOCK LAGI',
      tagVariant: 'secondary' as const,
      kicker: 'Leather Goods',
      displayTitle: 'Signature Mini Shoulder Bag',
      displaySubtitle: 'Warm Tan · Calfskin',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB5O0R9NxcaFDK7T7TD4qxCnk8i6UckBij9bcqPWiJyf_jZ_0leM4qiWo_q_kXo1F9Tetxb3efbOgvVkq05K5dLEnixLoOgD3I6YyuX7-P6a4jUgZnwzma1rcaL6ZemsGCY5h0NYet7UaqwzvYDe2XjGZrNKoPR6ftY9jiTi_fKvKdVKqVF1sOJX_L7NkwIBuupiG6H4xThseUJVWLPgcW57pOO_AULxIXihbYpiILH',
      swatches: ['#855224', '#000000', '#C8B89E'],
      sizes: ['One Size (24 × 16 cm)'],
      disabledSize: undefined,
      tab: 'Outerwear' as const,
    },
    {
      product: PRODUCTS.find((p) => p.id === 'chelsea-leather-ankle-boot')!,
      tag: undefined,
      tagVariant: undefined,
      kicker: 'Footwear',
      displayTitle: 'Chelsea Leather Ankle Boot',
      displaySubtitle: 'Espresso Brown · Italian Leather',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBdMFl8hC-fxkHoUQJkYwEDaM4MzJ0aESzNrnSRGpeJNs5crYiSiTAkzpKfXgyoKVpah4lsA-EUPDKoEV7HvFFlHLQuAuothIuqAm9kEFVBbn6QKdFLaO-YLQj_8GEixckbZF8ZW84Lj10vaMVK3qBfkYLG2B_Cpqi47Iu3uQnUHnsQ7B6FQrfdwh7J8TWgseQc61FJCriLc3XlJ5u7nYe9QHjGAKL9Q_CISjdGCZTI',
      swatches: ['#3B2820', '#1A1A1A'],
      sizes: ['40', '41', '42', '43'],
      disabledSize: undefined,
      tab: 'Sepatu' as const,
    },
  ];

  const extraFilteredBestsellers =
    bestsellerFilter === 'Celana'
      ? [
          {
            product: PRODUCTS.find((p) => p.id === 'wide-leg-pleated-trousers')!,
            tag: 'BEST SELLER',
            tagVariant: 'primary' as const,
            kicker: 'Tailored Pants',
            displayTitle: 'Wide-Leg Pleated Trousers',
            displaySubtitle: 'Sand Taupe · Gabardine',
            image: PRODUCTS.find((p) => p.id === 'wide-leg-pleated-trousers')!.image,
            swatches: ['#C5B7A5', '#1E1E1C', '#622329'],
            sizes: ['XS', 'S', 'M', 'L'],
            disabledSize: undefined,
            tab: 'Celana' as const,
          },
          {
            product: pleatedTrouserMen,
            tag: 'CORE FIT',
            tagVariant: 'primary' as const,
            kicker: 'Men Tailoring',
            displayTitle: 'Celana Pleated Tailored',
            displaySubtitle: 'Cream · Cotton Twill',
            image: pleatedTrouserMen.image,
            swatches: ['#F3EFE6', '#C7BBA8', '#232320'],
            sizes: ['28', '30', '32', '34'],
            disabledSize: undefined,
            tab: 'Celana' as const,
          },
        ]
      : [];

  const visibleBestsellers =
    bestsellerFilter === 'Semua'
      ? bestsellerCardData
      : bestsellerFilter === 'Celana'
      ? extraFilteredBestsellers
      : bestsellerCardData.filter((item) => item.tab === bestsellerFilter);

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
                      referrerPolicy="no-referrer"
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
                  alt="Full body shot of elegant woman wearing a relaxed sleeveless cream linen column dress holding ceramic vase in sunlit Parisian apartment atelier"
                  referrerPolicy="no-referrer"
                  src={columnDress.gallery[1]}
                />
                {/* Quick Add Overlay Trigger */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToBag(columnDress, columnDress.defaultSize);
                  }}
                  title="Tambah ke Bag"
                  className="absolute bottom-4 right-4 z-10 w-10 h-10 rounded-full bg-surface-card/90 backdrop-blur-sm border border-border-ecru flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-on-primary transition-all duration-200 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
              </div>
              <div className="p-6 flex flex-col flex-1 justify-between bg-surface-card">
                <div onClick={() => onSelectProduct(columnDress)} className="cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-label-uppercase uppercase tracking-wider bg-surface-sand text-secondary font-medium">
                      FIT PAS BANGET
                    </span>
                    <span className="text-body-sm text-[12px] text-text-muted">100% Linen Alami</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-1 group-hover:text-secondary transition-colors">
                    The Column Dress &amp; Overshirt
                  </h3>
                  <p className="font-body-md text-body-md text-text-muted">Organic Linen · Natural Alabaster</p>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-border-ecru mt-4">
                  <span className="font-price-lg text-price-lg text-primary">Rp 449.000</span>
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
              {/* Item 1: Handcrafted Leather Watch */}
              <div className="bg-surface-card border border-border-ecru flex flex-col group">
                <div
                  onClick={() => onSelectProduct(leatherWatch)}
                  className="relative w-full aspect-square overflow-hidden bg-surface-container-low cursor-pointer"
                >
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={leatherWatch.alt}
                    referrerPolicy="no-referrer"
                    src={leatherWatch.image}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(leatherWatch.id);
                    }}
                    className={`absolute top-3 right-3 transition-colors p-1 cursor-pointer ${
                      wishlistIds.includes(leatherWatch.id)
                        ? 'text-error'
                        : 'text-on-surface-variant hover:text-error'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                  </button>
                </div>
                <div
                  onClick={() => onSelectProduct(leatherWatch)}
                  className="p-4 flex flex-col justify-between flex-1 cursor-pointer"
                >
                  <div>
                    <h4 className="font-body-md text-body-md font-medium text-primary group-hover:text-secondary transition-colors">
                      Jam Tangan Kulit Handmade
                    </h4>
                    <p className="font-body-sm text-body-sm text-text-muted">Cow Leather · Taupe</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-ecru">
                    <span className="font-price-md text-price-md text-primary">Rp 649.000</span>
                    <span className="font-label-uppercase text-[10px] tracking-wider text-status-stock uppercase">
                      Stok Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Item 2: Tailored Pleated Trouser */}
              <div className="bg-surface-card border border-border-ecru flex flex-col group">
                <div
                  onClick={() => onSelectProduct(pleatedTrouserMen)}
                  className="relative w-full aspect-square overflow-hidden bg-surface-container-low cursor-pointer"
                >
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={pleatedTrouserMen.alt}
                    referrerPolicy="no-referrer"
                    src={pleatedTrouserMen.image}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(pleatedTrouserMen.id);
                    }}
                    className={`absolute top-3 right-3 transition-colors p-1 cursor-pointer ${
                      wishlistIds.includes(pleatedTrouserMen.id)
                        ? 'text-error'
                        : 'text-on-surface-variant hover:text-error'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                  </button>
                </div>
                <div
                  onClick={() => onSelectProduct(pleatedTrouserMen)}
                  className="p-4 flex flex-col justify-between flex-1 cursor-pointer"
                >
                  <div>
                    <h4 className="font-body-md text-body-md font-medium text-primary group-hover:text-secondary transition-colors">
                      Celana Pleated Tailored
                    </h4>
                    <p className="font-body-sm text-body-sm text-text-muted">Cotton Twill · Cream</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-ecru">
                    <span className="font-price-md text-price-md text-primary">Rp 389.000</span>
                    <span className="font-label-uppercase text-[10px] tracking-wider text-text-muted uppercase">
                      Size 28-36
                    </span>
                  </div>
                </div>
              </div>

              {/* Item 3: Structured Leather Tote Bag */}
              <div className="bg-surface-card border border-border-ecru flex flex-col group">
                <div
                  onClick={() => onSelectProduct(structuredTote)}
                  className="relative w-full aspect-square overflow-hidden bg-surface-container-low cursor-pointer"
                >
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={structuredTote.alt}
                    referrerPolicy="no-referrer"
                    src={structuredTote.image}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(structuredTote.id);
                    }}
                    className={`absolute top-3 right-3 transition-colors p-1 cursor-pointer ${
                      wishlistIds.includes(structuredTote.id)
                        ? 'text-error'
                        : 'text-on-surface-variant hover:text-error'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                  </button>
                </div>
                <div
                  onClick={() => onSelectProduct(structuredTote)}
                  className="p-4 flex flex-col justify-between flex-1 cursor-pointer"
                >
                  <div>
                    <h4 className="font-body-md text-body-md font-medium text-primary group-hover:text-secondary transition-colors">
                      Tas Kulit Terstruktur
                    </h4>
                    <p className="font-body-sm text-body-sm text-text-muted">Pebbled Grain · Desert Tan</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-ecru">
                    <span className="font-price-md text-price-md text-primary">Rp 890.000</span>
                    <span className="font-label-uppercase text-[10px] tracking-wider text-secondary uppercase font-semibold">
                      Stok Menipis
                    </span>
                  </div>
                </div>
              </div>

              {/* Item 4: Cashmere Blend Wrap Coat */}
              <div className="bg-surface-card border border-border-ecru flex flex-col group">
                <div
                  onClick={() => onSelectProduct(cashmereCoat)}
                  className="relative w-full aspect-square overflow-hidden bg-surface-container-low cursor-pointer"
                >
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt="Front editorial crop of a camel beige double-faced cashmere trench wrap coat styled with a matching tonal silk scarf"
                    referrerPolicy="no-referrer"
                    src={cashmereCoat.gallery[1]}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(cashmereCoat.id);
                    }}
                    className={`absolute top-3 right-3 transition-colors p-1 cursor-pointer ${
                      wishlistIds.includes(cashmereCoat.id)
                        ? 'text-error'
                        : 'text-on-surface-variant hover:text-error'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                  </button>
                </div>
                <div
                  onClick={() => onSelectProduct(cashmereCoat)}
                  className="p-4 flex flex-col justify-between flex-1 cursor-pointer"
                >
                  <div>
                    <h4 className="font-body-md text-body-md font-medium text-primary group-hover:text-secondary transition-colors">
                      Cashmere Wrap Coat
                    </h4>
                    <p className="font-body-sm text-body-sm text-text-muted">Wool &amp; Cashmere · Oatmeal</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-ecru">
                    <span className="font-price-md text-price-md text-primary">Rp 1.150.000</span>
                    <span className="font-label-uppercase text-[10px] tracking-wider text-text-muted uppercase">
                      Atelier Fit
                    </span>
                  </div>
                </div>
              </div>
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
                  referrerPolicy="no-referrer"
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
              {(['Semua', 'Outerwear', 'Celana', 'Dress', 'Sepatu'] as const).map((tab) => (
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
            {visibleBestsellers.map((card) => {
              const currentSize = selectedSizes[card.product.id] || card.product.defaultSize;
              const isWishlisted = wishlistIds.includes(card.product.id);

              return (
                <div
                  key={card.product.id}
                  className="bg-surface-card border border-border-ecru flex flex-col group transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                >
                  <div
                    onClick={() => onSelectProduct(card.product)}
                    className="relative w-full aspect-[3/4] overflow-hidden bg-surface-container cursor-pointer"
                  >
                    {card.tag && (
                      <span
                        className={`absolute top-3 left-3 z-10 font-label-uppercase text-[10px] tracking-wider px-2 py-0.5 font-semibold ${
                          card.tagVariant === 'secondary'
                            ? 'bg-secondary text-on-secondary'
                            : 'bg-primary text-on-primary'
                        }`}
                      >
                        {card.tag}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(card.product.id);
                      }}
                      className={`absolute top-3 right-3 z-10 p-1.5 rounded-full bg-surface-card/80 backdrop-blur-sm transition-colors cursor-pointer ${
                        isWishlisted ? 'text-error' : 'text-on-surface hover:text-error'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">favorite</span>
                    </button>
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={card.product.alt}
                      referrerPolicy="no-referrer"
                      src={card.image}
                    />
                  </div>

                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-body-sm text-[11px] font-label-uppercase text-text-muted uppercase tracking-wider">
                          {card.kicker}
                        </span>
                        <div className="flex items-center gap-1">
                          {card.swatches.map((hex) => (
                            <span
                              key={hex}
                              style={{ backgroundColor: hex }}
                              className="w-3 h-3 rounded-full border border-border-ecru"
                            />
                          ))}
                        </div>
                      </div>
                      <h3
                        onClick={() => onSelectProduct(card.product)}
                        className="font-body-md text-body-md font-medium text-primary line-clamp-1 cursor-pointer hover:text-secondary transition-colors"
                      >
                        {card.displayTitle}
                      </h3>
                      <p className="font-body-sm text-body-sm text-text-muted mb-4">{card.displaySubtitle}</p>

                      {/* Quick Size Selector Chips */}
                      <div className="flex items-center gap-1.5 mb-4">
                        {card.sizes.length === 1 ? (
                          <span className="px-2.5 py-1 text-[11px] font-body-sm bg-surface-container border border-border-ecru text-text-muted">
                            {card.sizes[0]}
                          </span>
                        ) : (
                          card.sizes.map((sz) => {
                            const isDisabled = card.disabledSize === sz;
                            const isSelected = currentSize === sz;
                            return (
                              <button
                                key={sz}
                                type="button"
                                disabled={isDisabled}
                                onClick={() =>
                                  setSelectedSizes((prev) => ({
                                    ...prev,
                                    [card.product.id]: sz,
                                  }))
                                }
                                className={`w-8 h-8 flex items-center justify-center text-[11px] font-body-sm border transition-colors ${
                                  isDisabled
                                    ? 'border-border-ecru opacity-40 cursor-not-allowed'
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
                      <span className="font-price-md text-price-md text-primary">{card.product.priceFormatted}</span>
                      <button
                        type="button"
                        onClick={() => onAddToBag(card.product, currentSize)}
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
              onClick={() => onNavigate('women')}
              className="inline-flex items-center justify-center px-10 py-3.5 border border-primary text-primary hover:bg-primary hover:text-on-primary font-label-uppercase text-label-uppercase tracking-[0.14em] uppercase transition-all duration-300 cursor-pointer"
            >
              Lihat 420+ Outfit Pilihan
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
