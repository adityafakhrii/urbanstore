import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { AlertBanner, Button, InputField, PasswordField } from '../../components/ui';

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
    <div className="w-full max-w-md bg-surface-card border border-border-ecru rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      <div>
        <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
          CREATE URBANSTORE ACCOUNT
        </span>
        <h1 className="font-headline-sm text-2xl text-primary">Daftar Akun Baru</h1>
        <p className="font-body-sm text-xs text-text-muted mt-1">
          Simpan alamat pengiriman &amp; sinkronkan wishlist serta riwayat pesananmu di semua perangkat.
        </p>
      </div>

      {!isConfigured && (
        <AlertBanner variant="warning">Koneksi Supabase belum terkonfigurasi.</AlertBanner>
      )}

      {errorMsg && <AlertBanner variant="error">{errorMsg}</AlertBanner>}

      {infoMsg && (
        <AlertBanner variant="success">
          {infoMsg}{' '}
          <Link to="/login" className="underline font-semibold">
            Ke halaman login →
          </Link>
        </AlertBanner>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <InputField
          label="Nama Lengkap"
          required
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Contoh: Aditya Fakhri"
        />

        <InputField
          label="No. WhatsApp"
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="0812-3456-7890"
        />

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
          {submitting ? 'Memproses...' : 'Buat Akun Sekarang'}
        </Button>
      </form>

      <div className="pt-5 border-t border-border-ecru text-center">
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
