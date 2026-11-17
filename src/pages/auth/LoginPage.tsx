import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { AlertBanner, Button, InputField, PasswordField } from '../../components/ui';

export const LoginPage: React.FC = () => {
  const { signIn, isConfigured } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="w-full max-w-md bg-surface-card border border-border-ecru rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      <div>
        <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
          URBANSTORE MEMBER &amp; ATELIER ACCESS
        </span>
        <h1 className="font-headline-sm text-2xl text-primary">Masuk ke Akun</h1>
        <p className="font-body-sm text-xs text-text-muted mt-1">
          Masuk untuk melacak pesanan, menyimpan wishlist, atau mengakses konsol admin.
        </p>
      </div>

      {!isConfigured && (
        <AlertBanner variant="warning">
          Koneksi Supabase belum terkonfigurasi. Hubungi administrator untuk mengaktifkan autentikasi.
        </AlertBanner>
      )}

      {errorMsg && <AlertBanner variant="error">{errorMsg}</AlertBanner>}

      <form onSubmit={handleLogin} className="space-y-4">
        <InputField
          label="Email"
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@email.com"
        />

        <PasswordField
          label="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 6 karakter"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={submitting || !isConfigured}
        >
          {submitting ? 'Memproses...' : 'Masuk Sekarang'}
        </Button>
      </form>

      <div className="pt-5 border-t border-border-ecru text-center">
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
