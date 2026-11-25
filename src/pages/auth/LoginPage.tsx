import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertBanner, Button } from '../../components/ui';

const GoogleIcon: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-8.97z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
    />
  </svg>
);

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, isConfigured } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect');
  const oauthError = searchParams.get('error_description') || searchParams.get('error');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (oauthError) {
      setErrorMsg(decodeURIComponent(oauthError));
    }
  }, [oauthError]);

  const handleGoogleContinue = async () => {
    if (submitting || !isConfigured) return;
    setErrorMsg(null);
    setSubmitting(true);
    const res = await signInWithGoogle(redirectTarget);
    if (res.error) {
      setErrorMsg(res.error);
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-surface-card border border-border-ecru rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="space-y-1.5">
        <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block">
          URBANSTORE MEMBER &amp; ATELIER ACCESS
        </span>
        <h1 className="font-headline-sm text-2xl text-primary">Masuk atau Daftar Akun</h1>
        <p className="font-body-sm text-xs text-text-muted leading-relaxed">
          Cukup satu langkah untuk masuk ke akun atau otomatis mendaftar sebagai member baru UrbanStore.
        </p>
      </div>

      {!isConfigured && (
        <AlertBanner variant="warning">
          Koneksi Supabase belum terkonfigurasi. Pastikan <code>SUPABASE_PROJECT_URL</code> dan{' '}
          <code>SUPABASE_PUBLISHABLE_KEY</code> sudah diisi di file <code>.env</code>.
        </AlertBanner>
      )}

      {errorMsg && <AlertBanner variant="error">{errorMsg}</AlertBanner>}

      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          fullWidth
          disabled={submitting || !isConfigured}
          onClick={() => void handleGoogleContinue()}
          className="bg-white border-border-ecru hover:border-primary hover:bg-surface-sand/40 text-primary shadow-xs h-12"
        >
          <GoogleIcon />
          <span className="font-medium tracking-normal normal-case text-sm">
            {submitting ? 'Menghubungkan ke Google...' : 'Lanjutkan dengan Google'}
          </span>
        </Button>
      </div>

      <div className="pt-5 border-t border-border-ecru space-y-2 text-left">
        <p className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
          Sistem Role Otomatis
        </p>
        <ul className="font-body-sm text-xs text-text-muted space-y-1.5 list-disc pl-4">
          <li>
            <strong>Customer:</strong> Akun Google baru otomatis aktif sebagai Member untuk sinkronisasi keranjang, wishlist, dan riwayat pesanan.
          </li>
          <li>
            <strong>Admin Atelier:</strong> Email Google yang terdaftar sebagai <code>admin</code> akan langsung diarahkan ke Admin Console.
          </li>
        </ul>
      </div>
    </div>
  );
};
