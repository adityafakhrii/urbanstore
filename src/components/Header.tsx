import React, { useState } from 'react';
import { BRAND_ASSETS } from '../data/products';

export type ActivePage = 'home' | 'women' | 'men' | 'bags' | 'shoes' | 'curated-drops' | 'pdp' | 'checkout';

interface HeaderProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenSizeGuide: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onNavigate,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenSizeGuide,
  searchQuery,
  onSearchChange,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyNotice, setCurrencyNotice] = useState(false);

  const navItems: { id: ActivePage; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'men', label: 'Pria' },
    { id: 'women', label: 'Wanita' },
    { id: 'bags', label: 'Tas' },
    { id: 'shoes', label: 'Sepatu' },
    { id: 'curated-drops', label: 'Curated Drops' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activePage === 'home' || activePage === 'pdp' || activePage === 'checkout') {
      onNavigate('women');
    }
  };

  const formattedCartCount = cartCount < 10 ? `0${cartCount}` : `${cartCount}`;

  return (
    <header className="fixed top-0 w-full z-50">
      {/* Top Announcement Bar */}
      <div className="w-full bg-[#FCEAE6] border-b border-border-ecru py-1.5 px-margin-mobile lg:px-margin">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-on-surface">
          <div className="hidden md:block w-28"></div>
          <div
            onClick={onOpenSizeGuide}
            className="flex-1 text-center font-label-uppercase text-[11px] tracking-widest text-on-surface cursor-pointer hover:text-secondary transition-colors"
          >
            GRATIS ONGKIR MIN. 500RB — SALAH SIZE? TUKER AJA DALEM 30 HARI
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setCurrencyNotice((prev) => !prev)}
              className="flex items-center justify-end space-x-1 font-label-uppercase text-[11px] cursor-pointer hover:text-secondary transition-colors"
            >
              <span className="tracking-wider">ID · IDR</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
            {currencyNotice && (
              <div className="absolute right-0 mt-2 w-56 bg-surface-card border border-border-ecru p-3 shadow-md z-50 text-left">
                <span className="font-label-uppercase text-[10px] uppercase tracking-wider text-secondary block mb-1">
                  LOKASI & MATA UANG
                </span>
                <p className="font-body-sm text-[12px] text-text-muted">
                  Harga sudah termasuk pajak dalam Rupiah (IDR). Pengiriman instan tersedia untuk area Jabodetabek & seluruh Indonesia.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="h-20 bg-background/95 backdrop-blur-md border-b border-border-ecru shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1440px] h-full mx-auto px-margin-mobile lg:px-margin flex items-center justify-between gap-gutter">
          {/* Mobile Hamburger + Desktop Nav */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Menu"
              className="xl:hidden p-1.5 text-on-surface hover:text-secondary transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>

            <nav className="hidden xl:flex items-center space-x-6 shrink-0">
              {navItems.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`font-label-uppercase text-label-uppercase uppercase transition-all pb-1 whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'text-primary font-semibold border-b border-primary'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Center Brand Logo */}
          <div className="flex items-center justify-center shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-space-sm cursor-pointer"
            >
              <img
                alt="UrbanStore Editorial Logo"
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
                src={BRAND_ASSETS.logo}
              />
              <span className="font-headline-sm text-headline-sm tracking-tight text-primary hidden sm:inline-block whitespace-nowrap">
                UrbanStore
              </span>
            </button>
          </div>

          {/* Right Controls: Search, Wishlist, Cart, Profile */}
          <div className="flex items-center justify-end gap-space-md shrink-0">
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center bg-surface-card border border-border-ecru rounded-full px-3 py-1.5 w-44 lg:w-56 focus-within:border-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-text-muted mr-2">search</span>
              <input
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (activePage === 'home' && e.target.value.trim().length > 0) {
                    onNavigate('women');
                  }
                }}
                className="bg-transparent w-full text-body-sm font-body-sm text-on-surface placeholder:text-text-muted focus:outline-none"
                placeholder="Cari racun outfit..."
                type="text"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="text-text-muted hover:text-primary ml-1"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </form>

            <div className="flex items-center gap-space-sm">
              <button
                type="button"
                onClick={onOpenWishlist}
                aria-label="Wishlist"
                className="p-1.5 text-on-surface hover:text-secondary transition-colors relative cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">favorite</span>
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0 bg-secondary text-on-secondary font-label-uppercase text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenCart}
                aria-label="Cart"
                className="p-1.5 text-on-surface hover:text-secondary transition-colors relative cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
                <span className="absolute top-0.5 right-0 bg-primary text-on-primary font-label-uppercase text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {formattedCartCount}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenCart}
                title="Profil & Pesanan Kamu"
                className="pl-1 cursor-pointer"
              >
                <img
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border border-border-ecru"
                  referrerPolicy="no-referrer"
                  src={BRAND_ASSETS.avatar}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-surface-card border-b border-border-ecru px-margin-mobile py-4 shadow-md">
            <form
              onSubmit={handleSearchSubmit}
              className="flex md:hidden items-center bg-surface-container-low border border-border-ecru rounded-full px-3 py-2 mb-4"
            >
              <span className="material-symbols-outlined text-[18px] text-text-muted mr-2">search</span>
              <input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-transparent w-full text-body-sm font-body-sm text-on-surface placeholder:text-text-muted focus:outline-none"
                placeholder="Cari racun outfit..."
                type="text"
              />
            </form>
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left font-label-uppercase text-label-uppercase uppercase py-1.5 border-b border-border-ecru/50 ${
                    activePage === item.id ? 'text-primary font-semibold' : 'text-on-surface-variant'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  onOpenSizeGuide();
                  setMobileMenuOpen(false);
                }}
                className="text-left font-label-uppercase text-label-uppercase uppercase py-1.5 text-secondary"
              >
                Panduan Size Anti-Zonk →
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
