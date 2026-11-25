import React from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, getButtonClassName } from '../components/ui';

export const AdminRoute: React.FC = () => {
  const { user, role, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
    const handleSwitchAccount = async () => {
      await signOut();
      const redirect = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${redirect}`, { replace: true });
    };

    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface-card border border-border-ecru rounded-2xl p-8 text-center space-y-5">
          <span className="material-symbols-outlined text-[40px] text-error block">lock</span>
          <div className="space-y-2">
            <h1 className="font-headline-md text-headline-md text-primary">403 — Akses Ditolak</h1>
            <p className="font-body-md text-body-md text-text-muted">
              Halaman portal operasional ini khusus untuk akun dengan role <strong>admin</strong>.
            </p>
            <p className="font-body-sm text-xs text-text-muted bg-surface rounded-xl border border-border-ecru px-3 py-2">
              Akun saat ini: <strong className="text-primary">{user.email}</strong> (Role:{' '}
              <span className="uppercase font-medium">{role || 'customer'}</span>)
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
            <Link to="/" className={getButtonClassName({ variant: 'primary', size: 'md' })}>
              Kembali ke Storefront
            </Link>
            <Button variant="outline" size="md" onClick={() => void handleSwitchAccount()}>
              Ganti Akun Google
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
