import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { consumePendingOAuthRedirect, useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { supabase } from '../../lib/supabase';
import { AlertBanner, getButtonClassName } from '../../components/ui';

function readHashParam(key: string): string | null {
  if (typeof window === 'undefined' || !window.location.hash) return null;
  const rawHash = window.location.hash.replace(/^#/, '');
  return new URLSearchParams(rawHash).get(key);
}

export const AuthCallbackPage: React.FC = () => {
  const { user, profile, isAdmin, loading } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const err =
      searchParams.get('error_description') ||
      searchParams.get('error') ||
      readHashParam('error_description') ||
      readHashParam('error');

    if (err) {
      setErrorMsg(decodeURIComponent(err));
      return;
    }

    if (loading) return;

    if (user) {
      const pendingRedirect = consumePendingOAuthRedirect();
      const displayName =
        profile?.full_name ||
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        user.email ||
        'Member';

      if (isAdmin) {
        showToast(`Selamat datang di Atelier Admin, ${displayName}!`);
      } else {
        showToast(`Berhasil masuk dengan Google sebagai ${displayName}!`);
      }

      if (pendingRedirect) {
        navigate(pendingRedirect, { replace: true });
      } else {
        navigate(isAdmin ? '/admin/dashboard' : '/', { replace: true });
      }
      return;
    }

    // Fallback check in case PKCE code exchange finished right after initial mount
    const code = searchParams.get('code');
    if (code && supabase) {
      let active = true;
      const timer = window.setTimeout(async () => {
        if (!active || !supabase) return;
        const { data } = await supabase.auth.getSession();
        if (!data.session?.user && active) {
          setErrorMsg('Sesi login Google tidak ditemukan atau sudah kedaluwarsa. Silakan coba lagi.');
        }
      }, 2500);
      return () => {
        active = false;
        window.clearTimeout(timer);
      };
    }

    navigate('/login', { replace: true });
  }, [loading, user, profile, isAdmin, searchParams, navigate, showToast]);

  if (errorMsg) {
    return (
      <div className="w-full max-w-md bg-surface-card border border-border-ecru rounded-2xl p-6 sm:p-8 shadow-sm space-y-5 text-center">
        <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[24px]">error</span>
        </div>
        <div className="space-y-1">
          <h1 className="font-headline-sm text-xl text-primary">Autentikasi Google Gagal</h1>
          <p className="font-body-sm text-xs text-text-muted">
            Proses masuk dengan akun Google belum selesai atau dibatalkan.
          </p>
        </div>
        <AlertBanner variant="error">{errorMsg}</AlertBanner>
        <Link
          to="/login"
          className={getButtonClassName({ variant: 'primary', size: 'md', fullWidth: true })}
        >
          Kembali ke Halaman Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-surface-card border border-border-ecru rounded-2xl p-8 shadow-sm text-center space-y-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="font-headline-sm text-lg text-primary">Memverifikasi Akun Google...</p>
      <p className="font-body-sm text-xs text-text-muted">
        Menyiapkan profil dan memeriksa hak akses Admin / Customer kamu.
      </p>
    </div>
  );
};
