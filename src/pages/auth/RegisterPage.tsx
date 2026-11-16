import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';

export const RegisterPage: React.FC = () => {
  const { signUp, isConfigured } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (password.length < 6) {
      setErrorMsg('Password minimal 6 karakter ya.');
      return;
    }

    setSubmitting(true);
    const res = await signUp({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      whatsapp: whatsapp.trim(),
    });
    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    setPassword('');
    if (res.needsEmailConfirmation) {
      setInfoMsg('Akun berhasil dibuat! Cek email kamu untuk klik link konfirmasi sebelum login.');
      return;
    }

    showToast('Akun Customer berhasil dibuat & langsung login!');
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
          CREATE URBANSTORE ACCOUNT
        </span>
        <h1 className="font-headline-sm text-headline-sm text-primary">Daftar Akun Baru</h1>
        <p className="font-body-sm text-xs text-text-muted mt-1">
          Simpan alamat pengiriman &amp; sinkronkan wishlist serta riwayat pesananmu di semua perangkat.
        </p>
      </div>

      {!isConfigured && (
        <div className="mb-5 p-3 bg-surface-sand border border-border-ecru text-xs text-secondary">
          Koneksi Supabase belum terkonfigurasi.
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-error-container/60 border border-error/30 text-error text-xs">
          {errorMsg}
        </div>
      )}

      {infoMsg && (
        <div className="mb-4 p-3 bg-surface-sand border border-status-stock/40 text-status-stock text-xs">
          {infoMsg}{' '}
          <Link to="/login" className="underline font-medium">
            Ke halaman login →
          </Link>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block font-body-sm text-xs text-text-muted mb-1">Nama Lengkap</label>
          <input
            required
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Contoh: Aditya Fakhri"
            className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
          />
        </div>

        <div>
          <label className="block font-body-sm text-xs text-text-muted mb-1">No. WhatsApp</label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="0812-3456-7890"
            className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
          />
        </div>

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
          {submitting ? 'Memproses...' : 'Buat Akun Sekarang'}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-border-ecru text-center">
        <p className="font-body-sm text-xs text-text-muted">
          Sudah punya akun?{' '}
          <Link
            to={redirectTarget ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : '/login'}
            className="text-primary font-medium underline underline-offset-4 hover:opacity-80"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
};
