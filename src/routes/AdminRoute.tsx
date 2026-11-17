import React from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { getButtonClassName } from '../components/ui';

export const AdminRoute: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-sm text-text-muted">
        Memverifikasi akses Admin Atelier...
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface-card border border-border-ecru rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined text-[40px] text-error mb-3">lock</span>
          <h1 className="font-headline-md text-headline-md text-primary mb-2">403 — Akses Ditolak</h1>
          <p className="font-body-md text-body-md text-text-muted mb-6">
            Halaman portal operasional ini khusus untuk akun dengan role <strong>admin</strong>.
          </p>
          <Link to="/" className={getButtonClassName({ variant: 'primary', size: 'md' })}>
            Kembali ke Storefront
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
