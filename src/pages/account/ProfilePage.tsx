import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { AccountSettingsPanel } from '../../components/AccountSettingsPanel';
import { Button, getButtonClassName } from '../../components/ui';

export const ProfilePage: React.FC = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { showToast, wishlistIds, orders } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    showToast('Kamu sudah keluar dari akun.');
    navigate('/', { replace: true });
  };

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-ecru pb-6">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            PENGATURAN AKUN &amp; PROFIL URBANSTORE
          </span>
          <h1 className="font-headline-sm text-2xl sm:text-3xl text-primary">
            Halo, {profile?.full_name || user?.email || 'Member'}
          </h1>
          <p className="font-body-sm text-xs text-text-muted mt-1">
            {user?.email} · Google Account · Role:{' '}
            <strong className="uppercase">{isAdmin ? 'Admin' : 'Customer'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className={getButtonClassName({ variant: 'primary', size: 'sm' })}
            >
              Buka Admin Console →
            </Link>
          )}
          <Button variant="danger" size="sm" onClick={() => void handleLogout()}>
            Keluar
          </Button>
        </div>
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Link
          to="/account/orders"
          className="p-5 sm:p-6 bg-surface-card border border-border-ecru rounded-2xl hover:border-primary transition-colors flex items-center justify-between"
        >
          <div>
            <p className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
              Riwayat Transaksi
            </p>
            <p className="font-headline-sm text-xl text-primary mt-1">{orders.length} Pesanan</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-surface-sand flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px] text-primary">receipt_long</span>
          </div>
        </Link>

        <Link
          to="/wishlist"
          className="p-5 sm:p-6 bg-surface-card border border-border-ecru rounded-2xl hover:border-primary transition-colors flex items-center justify-between"
        >
          <div>
            <p className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
              Koleksi Tersimpan
            </p>
            <p className="font-headline-sm text-xl text-primary mt-1">{wishlistIds.length} Wishlist</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-surface-sand flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px] text-primary">favorite</span>
          </div>
        </Link>
      </div>

      <AccountSettingsPanel variant="customer" />
    </div>
  );
};
