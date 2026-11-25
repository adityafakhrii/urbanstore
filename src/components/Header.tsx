import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BRAND_ASSETS } from '../data/products';
import { handleImageError } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export type ActivePage = 'home' | 'women' | 'men' | 'bags' | 'shoes' | 'curated-drops' | 'pdp' | 'checkout' | 'admin';

export function activePageToPath(page: ActivePage): string {
  switch (page) {
    case 'home':
      return '/';
    case 'admin':
      return '/admin/dashboard';
    case 'checkout':
      return '/checkout';
    case 'pdp':
      return '/curated-drops';
    default:
      return `/${page}`;
  }
}

const NAV_ITEMS = [
  { path: '/', label: 'Home' },
  { path: '/men', label: 'Pria' },
  { path: '/women', label: 'Wanita' },
  { path: '/bags', label: 'Tas' },
  { path: '/shoes', label: 'Sepatu' },
  { path: '/curated-drops', label: 'Curated Drops' },
];

const CATALOG_PATHS = ['/women', '/men', '/bags', '/shoes', '/curated-drops'];

export const Header: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const { totalCartCount, wishlistIds, setSizeGuideOpen } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyNotice, setCurrencyNotice] = useState(false);
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') || '');
  const currencyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchInput(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    if (!currencyNotice) return;
    const handleOutside = (e: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyNotice(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCurrencyNotice(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [currencyNotice]);

  const applySearch = (rawQuery: string) => {
    setSearchInput(rawQuery);
    const trimmed = rawQuery.trim();
    const targetBase = CATALOG_PATHS.includes(location.pathname) ? location.pathname : '/curated-drops';
    if (trimmed) {
      navigate(`${targetBase}?q=${encodeURIComponent(trimmed)}`);
    } else if (CATALOG_PATHS.includes(location.pathname)) {
      navigate(location.pathname);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applySearch(searchInput);
    setMobileMenuOpen(false);
  };

  const formattedCartCount = totalCartCount < 10 ? `0${totalCartCount}` : `${totalCartCount}`;
  const userAvatarSrc =
    (user?.user_metadata?.avatar_url as string) ||
    (user?.user_metadata?.picture as string) ||
    BRAND_ASSETS.avatar;

  return (
    <header className="sticky top-0 w-full z-50 print:hidden">
      {/* Top Announcement Bar */}
      <div className="w-full bg-[#FCEAE6] border-b border-border-ecru py-1.5 px-margin-mobile lg:px-margin">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-on-surface">
          <div className="hidden md:block w-28"></div>
          <button
            type="button"
            onClick={() => setSizeGuideOpen(true)}
            className="flex-1 text-center font-label-uppercase text-[11px] tracking-widest text-on-surface cursor-pointer hover:text-secondary transition-colors"
          >
            GRATIS ONGKIR MIN. 500RB — SALAH SIZE? TUKER AJA DALEM 30 HARI
          </button>
          <div className="relative" ref={currencyRef}>
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
                  LOKASI &amp; MATA UANG
                </span>
                <p className="font-body-sm text-[12px] text-text-muted">
                  Harga sudah termasuk pajak dalam Rupiah (IDR). Pengiriman instan tersedia untuk area Jabodetabek &amp; seluruh Indonesia.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="h-16 sm:h-[72px] bg-background/95 backdrop-blur-md border-b border-border-ecru shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
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
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`font-label-uppercase text-label-uppercase uppercase transition-all pb-1 whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'text-primary font-semibold border-b border-primary'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className={`font-label-uppercase text-label-uppercase uppercase transition-all pb-1 whitespace-nowrap shrink-0 ${
                    location.pathname.startsWith('/admin')
                      ? 'text-secondary font-semibold border-b border-secondary'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Center Brand Logo */}
          <div className="flex items-center justify-center shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                alt="UrbanStore US Lettermark Logo"
                className="h-9 w-9 rounded-xl object-cover border border-border-ecru shadow-xs group-hover:scale-105 transition-transform"
                onError={handleImageError}
                src={BRAND_ASSETS.logo}
              />
              <span className="font-headline-sm text-headline-sm tracking-tight text-primary hidden sm:inline-block whitespace-nowrap">
                UrbanStore
              </span>
            </Link>
          </div>

          {/* Right Controls: Search, Wishlist, Cart, Orders, Account */}
          <div className="flex items-center justify-end gap-space-md shrink-0">
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center bg-surface-card border border-border-ecru rounded-full px-3 py-1.5 w-44 lg:w-56 focus-within:border-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-text-muted mr-2">search</span>
              <input
                value={searchInput}
                onChange={(e) => applySearch(e.target.value)}
                className="bg-transparent w-full text-body-sm font-body-sm text-on-surface placeholder:text-text-muted focus:outline-none"
                placeholder="Cari racun outfit..."
                type="text"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => applySearch('')}
                  className="text-text-muted hover:text-primary ml-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </form>

            <div className="flex items-center gap-space-sm">
              <Link
                to="/wishlist"
                aria-label="Wishlist"
                className="p-1.5 text-on-surface hover:text-secondary transition-colors relative"
              >
                <span className="material-symbols-outlined text-[22px]">favorite</span>
                {wishlistIds.length > 0 && (
                  <span className="absolute top-0.5 right-0 bg-secondary text-on-secondary font-label-uppercase text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishlistIds.length}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                aria-label="Keranjang Belanja"
                className="p-1.5 text-on-surface hover:text-secondary transition-colors relative"
              >
                <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
                <span className="absolute top-0.5 right-0 bg-primary text-on-primary font-label-uppercase text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {formattedCartCount}
                </span>
              </Link>

              <Link
                to="/account/orders"
                title="Riwayat Pesanan Kamu"
                aria-label="Riwayat Pesanan"
                className="p-1.5 text-on-surface hover:text-secondary transition-colors"
              >
                <span className="material-symbols-outlined text-[22px]">receipt_long</span>
              </Link>

              <Link
                to={user ? '/account' : '/login'}
                title={user ? `${profile?.full_name || user.email} (${isAdmin ? 'Admin' : 'Customer'})` : 'Lanjutkan dengan Google'}
                aria-label="Akun Saya"
                className="flex items-center gap-1.5 pl-1"
              >
                <img
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border border-border-ecru"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                  src={userAvatarSrc}
                />
                <span className="hidden sm:inline-block font-label-uppercase text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-border-ecru bg-surface-card text-primary">
                  {user ? (isAdmin ? 'ADMIN' : 'MEMBER') : 'MASUK'}
                </span>
              </Link>
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
                value={searchInput}
                onChange={(e) => applySearch(e.target.value)}
                className="bg-transparent w-full text-body-sm font-body-sm text-on-surface placeholder:text-text-muted focus:outline-none"
                placeholder="Cari racun outfit..."
                type="text"
              />
            </form>
            <div className="flex flex-col space-y-3">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-label-uppercase text-label-uppercase uppercase py-1.5 border-b border-border-ecru/50 ${
                    location.pathname === item.path ? 'text-primary font-semibold' : 'text-on-surface-variant'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-label-uppercase text-label-uppercase uppercase py-1.5 border-b border-border-ecru/50 text-secondary font-semibold"
                >
                  Admin Atelier Dashboard →
                </Link>
              )}
              <Link
                to={user ? '/account' : '/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="font-label-uppercase text-label-uppercase uppercase py-1.5 border-b border-border-ecru/50 text-primary"
              >
                {user ? `Akun: ${profile?.full_name || user.email}` : 'Lanjutkan dengan Google →'}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSizeGuideOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="text-left font-label-uppercase text-label-uppercase uppercase py-1.5 text-secondary cursor-pointer"
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
