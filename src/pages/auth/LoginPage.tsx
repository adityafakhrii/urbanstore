import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';

export const LoginPage: React.FC = () => {
  const { signIn, isConfigured } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    const res = await signIn(email.trim(), password);
    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    setPassword('');
    showToast('Berhasil masuk ke akun UrbanStore kamu!');
    if (redirectTarget && redirectTarget.startsWith('/')) {
      navigate(redirectTarget, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="w-full max-w-md bg-surface-card border border-border-ecru p-6 sm:p-8 shadow-sm">
      <div className="mb-6">
        <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
          URBANSTORE MEMBER &amp; ATELIER ACCESS
        </span>
        <h1 className="font-headline-sm text-headline-sm text-primary">Masuk ke Akun</h1>
        <p className="font-body-sm text-xs text-text-muted mt-1">
          Masuk untuk melacak pesanan, menyimpan wishlist, atau mengakses konsol admin.
        </p>
      </div>

      {!isConfigured && (
        <div className="mb-5 p-3 bg-surface-sand border border-border-ecru text-xs text-secondary">
          Koneksi Supabase belum terkonfigurasi. Hubungi administrator untuk mengaktifkan autentikasi.
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-error-container/60 border border-error/30 text-error text-xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block font-body-sm text-xs text-text-muted mb-1">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
          />
        </div>

        <div>
          <label className="block font-body-sm text-xs text-text-muted mb-1">Password</label>
          <div className="relative">
            <input
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full h-11 bg-surface-card border border-border-ecru pl-3 pr-10 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-text-muted hover:text-primary cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !isConfigured}
          className="w-full h-12 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-[0.14em] rounded-DEFAULT hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          {submitting ? 'Memproses...' : 'Masuk Sekarang'}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-border-ecru text-center space-y-2">
        <p className="font-body-sm text-xs text-text-muted">
          Belum punya akun UrbanStore?{' '}
          <Link
            to={redirectTarget ? `/register?redirect=${encodeURIComponent(redirectTarget)}` : '/register'}
            className="text-primary font-medium underline underline-offset-4 hover:opacity-80"
          >
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
};
