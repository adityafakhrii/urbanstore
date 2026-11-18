import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { ToastBanner } from '../components/ToastBanner';
import { Button, getButtonClassName } from '../components/ui';

const ADMIN_NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/orders', label: 'Orders', icon: 'receipt_long' },
  { to: '/admin/reports', label: 'Laporan Penjualan', icon: 'analytics' },
  { to: '/admin/products', label: 'Products & Inventory', icon: 'inventory_2' },
  { to: '/admin/promos', label: 'Promos', icon: 'local_offer' },
  { to: '/admin/subscribers', label: 'Subscribers', icon: 'mail' },
];

export const AdminLayout: React.FC = () => {
  const { profile, user, signOut } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    showToast('Sesi admin berakhir.');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-surface font-body-md text-on-surface antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r border-border-ecru bg-surface-card sticky top-0 h-screen print:hidden">
        <div className="px-6 h-16 flex items-center justify-between border-b border-border-ecru">
          <div>
            <Link
              to="/admin/dashboard"
              className="font-headline-sm text-base tracking-[0.2em] text-primary block"
            >
              URBANSTORE
            </Link>
            <span className="font-label-uppercase text-[9px] uppercase tracking-widest text-secondary">
              Admin Console
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-label-uppercase uppercase tracking-wider transition-colors ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-secondary hover:bg-surface-sand hover:text-primary'
                }`
              }
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border-ecru space-y-3">
          <div className="px-2">
            <p className="text-xs font-medium text-primary truncate">
              {profile?.full_name || 'Administrator'}
            </p>
            <p className="text-[11px] text-text-muted truncate">{user?.email || 'Admin Session'}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to="/"
              className={getButtonClassName({ variant: 'outline', size: 'sm', fullWidth: true })}
            >
              <span className="material-symbols-outlined text-[15px]">storefront</span>
              Lihat Storefront
            </Link>
            <Button variant="danger" size="sm" fullWidth onClick={handleLogout}>
              <span className="material-symbols-outlined text-[15px]">logout</span>
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border-ecru bg-surface-card px-5 sm:px-8 lg:px-10 flex items-center justify-between sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl border border-border-ecru text-primary hover:bg-surface-sand cursor-pointer"
              aria-label="Toggle Menu Admin"
            >
              <span className="material-symbols-outlined text-[20px]">
                {mobileNavOpen ? 'close' : 'menu'}
              </span>
            </button>
            <span className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary">
              Store Operations &amp; Inventory Management
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/admin/products/new"
              className={getButtonClassName({
                variant: 'primary',
                size: 'sm',
                className: 'hidden sm:inline-flex',
              })}
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              Tambah Produk
            </Link>
            <Link
              to="/"
              className={getButtonClassName({
                variant: 'outline',
                size: 'sm',
                className: 'lg:hidden',
              })}
            >
              Storefront
            </Link>
          </div>
        </header>

        {/* Mobile Drawer Nav */}
        {mobileNavOpen && (
          <div className="lg:hidden bg-surface-card border-b border-border-ecru px-5 py-4 space-y-2">
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-label-uppercase uppercase tracking-wider ${
                    isActive ? 'bg-primary text-on-primary' : 'text-secondary hover:bg-surface-sand'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
            <Button variant="danger" size="sm" fullWidth onClick={handleLogout}>
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Keluar
            </Button>
          </div>
        )}

        <main className="flex-1 px-5 sm:px-8 lg:px-10 py-8 sm:py-10 max-w-7xl w-full mx-auto print:px-0 print:py-0 print:max-w-none">
          <Outlet />
        </main>
      </div>

      <ToastBanner />
    </div>
  );
};
