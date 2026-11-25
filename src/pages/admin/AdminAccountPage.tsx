import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AccountSettingsPanel } from '../../components/AccountSettingsPanel';
import { getButtonClassName } from '../../components/ui';

export const AdminAccountPage: React.FC = () => {
  const { profile, user } = useAuth();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-ecru pb-5">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            ADMIN ACCOUNT SETTINGS
          </span>
          <h1 className="font-headline-sm text-2xl sm:text-3xl text-primary">
            Pengaturan Profil &amp; Akun Admin
          </h1>
          <p className="font-body-sm text-xs text-text-muted mt-1">
            Kelola identitas pengelola Atelier untuk akun{' '}
            <strong className="text-primary">{profile?.full_name || user?.email}</strong>.
          </p>
        </div>

        <Link
          to="/admin/dashboard"
          className={getButtonClassName({ variant: 'outline', size: 'sm' })}
        >
          ← Kembali ke Dashboard
        </Link>
      </div>

      {/* Admin Access Scope Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-border-ecru rounded-2xl p-4 space-y-1">
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
            Level Akses
          </span>
          <p className="font-headline-sm text-lg text-primary">Administrator</p>
          <p className="font-body-sm text-[11px] text-text-muted">
            Otorisasi penuh atas seluruh modul konsol Atelier.
          </p>
        </div>
        <div className="bg-surface-card border border-border-ecru rounded-2xl p-4 space-y-1">
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
            Metode Login
          </span>
          <p className="font-headline-sm text-lg text-primary">Google OAuth</p>
          <p className="font-body-sm text-[11px] text-text-muted">
            Keamanan login &amp; password dikelola langsung oleh Google.
          </p>
        </div>
        <div className="bg-surface-card border border-border-ecru rounded-2xl p-4 space-y-1">
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
            Hak Operasional
          </span>
          <p className="font-headline-sm text-lg text-primary">Orders, Katalog &amp; Laporan</p>
          <p className="font-body-sm text-[11px] text-text-muted">
            Verifikasi pembayaran, resi, produk, promo, dan analitik AI.
          </p>
        </div>
      </div>

      <AccountSettingsPanel variant="admin" />
    </div>
  );
};
