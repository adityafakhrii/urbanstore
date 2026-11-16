import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { ToastBanner } from '../components/ToastBanner';

const ADMIN_NAV_ITEMS = [
  { to: '/admin/orders', label: 'Orders', icon: 'receipt_long' },
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
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r border-border-ecru bg-surface-card sticky top-0 h-screen">
        <div className="px-6 h-16 flex items-center justify-between border-b border-border-ecru">
          <div>
            <Link to="/admin/orders" className="font-headline-sm text-base tracking-[0.2em] text-primary block">
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
                `flex items-center gap-3 px-3.5 py-2.5 text-xs font-label-uppercase uppercase tracking-wider transition-colors ${
                  isActive
                    ? 'bg-primary text-on-primary'
                    : 'text-secondary hover:bg-surface-muted hover:text-primary'
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
              className="flex items-center justify-center gap-2 px-3 py-2 border border-border-ecru text-[11px] font-label-uppercase uppercase tracking-wider text-primary hover:bg-surface-muted transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">storefront</span>
              Lihat Storefront
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-700 hover:bg-red-50 text-[11px] font-label-uppercase uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">logout</span>
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border-ecru bg-surface-card px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="lg:hidden p-2 border border-border-ecru text-primary cursor-pointer"
              aria-label="Toggle Menu Admin"
            >
              <span className="material-symbols-outlined text-[20px]">
                {mobileNavOpen ? 'close' : 'menu'}
              </span>
            </button>
            <span className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary">
              Store Operations & Inventory Management
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/products/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-on-primary font-label-uppercase text-[11px] uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              Tambah Produk
            </Link>
            <Link
              to="/"
              className="lg:hidden px-3 py-2 border border-border-ecru font-label-uppercase text-[10px] uppercase tracking-wider text-primary"
            >
              Storefront
            </Link>
          </div>
        </header>

        {/* Mobile Drawer Nav */}
        {mobileNavOpen && (
          <div className="lg:hidden bg-surface-card border-b border-border-ecru p-4 space-y-2">
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 text-xs font-label-uppercase uppercase tracking-wider ${
                    isActive ? 'bg-primary text-on-primary' : 'text-secondary hover:bg-surface-muted'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-label-uppercase uppercase tracking-wider text-red-700 hover:bg-red-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Keluar
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <ToastBanner />
    </div>
  );
};
