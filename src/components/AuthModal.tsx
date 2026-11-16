import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModalEffects } from '../utils/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOrders: () => void;
  onOpenAdmin: () => void;
  onShowToast: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onOpenOrders,
  onOpenAdmin,
  onShowToast,
}) => {
  const { user, profile, role, isAdmin, signIn, signUp, signOut, updateProfile } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Editable profile state when logged in
  const [editName, setEditName] = useState('');
  const [editWa, setEditWa] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPostal, setEditPostal] = useState('');

  useModalEffects(isOpen, onClose);

  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name || '');
      setEditWa(profile.whatsapp || '');
      setEditAddress(profile.default_address || '');
      setEditCity(profile.default_city || '');
      setEditPostal(profile.default_postal_code || '');
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    const res = await signIn(email, password);
    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    setPassword('');
    onShowToast('Berhasil masuk ke akun UrbanStore kamu!');
    onClose();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (password.length < 6) {
      setErrorMsg('Password minimal 6 karakter ya.');
      return;
    }

    setSubmitting(true);
    const res = await signUp({ email, password, fullName, whatsapp });
    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    setPassword('');
    if (res.needsEmailConfirmation) {
      setInfoMsg('Akun berhasil dibuat! Cek email kamu untuk klik link konfirmasi sebelum login.');
      setTab('login');
      return;
    }

    onShowToast('Akun Customer berhasil dibuat & langsung login!');
    onClose();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    const res = await updateProfile({
      full_name: editName.trim(),
      whatsapp: editWa.trim(),
      default_address: editAddress.trim(),
      default_city: editCity.trim(),
      default_postal_code: editPostal.trim(),
    });
    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    onShowToast('Profil & alamat pengiriman tersimpan!');
  };

  const handleLogout = async () => {
    await signOut();
    onShowToast('Kamu sudah keluar dari akun.');
    onClose();
  };

  return (
    <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
      <div
        className="fixed inset-0 bg-[#1A1A1A]/35 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative bg-surface-card border border-border-ecru max-w-md w-full p-6 sm:p-8 z-10 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-border-ecru mb-6">
          <div>
            <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block">
              {user ? 'AKUN URBANSTORE' : 'MEMBER & ATELIER ACCESS'}
            </span>
            <h3 className="font-headline-sm text-headline-sm text-primary">
              {user
                ? profile?.full_name || user.email
                : tab === 'login'
                ? 'Masuk ke Akun Kamu'
                : 'Daftar Member Baru'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1 text-on-surface hover:text-secondary cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {!user ? (
          <>
            {/* Login / Register Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-sand border border-border-ecru mb-6">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`py-2 font-label-uppercase text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
                  tab === 'login' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-primary'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`py-2 font-label-uppercase text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
                  tab === 'register' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-primary'
                }`}
              >
                Daftar
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-error-container/60 border border-error/30 text-error text-xs">
                {errorMsg}
              </div>
            )}
            {infoMsg && (
              <div className="mb-4 p-3 bg-surface-sand border border-status-stock/40 text-status-stock text-xs">
                {infoMsg}
              </div>
            )}

            {tab === 'login' ? (
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
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-[0.14em] rounded-DEFAULT hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Memproses...' : 'Masuk Sekarang'}
                </button>
                <p className="text-[11px] text-text-muted text-center">
                  Mendukung login role <strong>Customer</strong> &amp; <strong>Admin Atelier</strong>.
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block font-body-sm text-xs text-text-muted mb-1">Nama Lengkap</label>
                  <input
                    required
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama lengkap kamu"
                    className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                  />
                </div>
                <div>
                  <label className="block font-body-sm text-xs text-text-muted mb-1">Nomor WhatsApp</label>
                  <input
                    required
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0812xxxxxxxx"
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
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-[0.14em] rounded-DEFAULT hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Mendaftarkan...' : 'Buat Akun Customer'}
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="space-y-5">
            {/* Role & Email Card */}
            <div className="p-4 bg-surface-sand border border-border-ecru flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-text-muted truncate">{user.email}</p>
                <p className="font-body-sm text-sm font-medium text-primary truncate">
                  {profile?.full_name || 'Member UrbanStore'}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 font-label-uppercase text-[10px] uppercase tracking-widest shrink-0 ${
                  isAdmin ? 'bg-secondary text-on-secondary' : 'bg-primary text-on-primary'
                }`}
              >
                {role === 'admin' ? 'ADMIN' : 'CUSTOMER'}
              </span>
            </div>

            {/* Quick Role Actions */}
            <div className="grid grid-cols-1 gap-2.5">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="w-full py-3 bg-secondary text-on-secondary font-label-uppercase text-label-uppercase uppercase tracking-wider rounded-DEFAULT hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Buka Admin Atelier Dashboard →
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOrders();
                }}
                className="w-full py-2.5 border border-primary text-primary font-label-uppercase text-label-uppercase uppercase tracking-wider rounded-DEFAULT hover:bg-surface-sand transition-colors cursor-pointer"
              >
                Lihat Riwayat Pesanan Saya
              </button>
            </div>

            {/* Editable Profile & Default Shipping */}
            <form onSubmit={handleSaveProfile} className="space-y-3 pt-4 border-t border-border-ecru">
              <span className="font-label-uppercase text-[10px] uppercase tracking-wider text-text-muted block">
                INFO KONTAK &amp; ALAMAT DEFAULT
              </span>
              {errorMsg && (
                <div className="p-2.5 bg-error-container/60 text-error text-xs">{errorMsg}</div>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nama lengkap"
                  className="h-10 bg-surface-card border border-border-ecru px-3 text-xs text-primary focus:outline-none focus:border-primary"
                />
                <input
                  type="tel"
                  value={editWa}
                  onChange={(e) => setEditWa(e.target.value)}
                  placeholder="No. WhatsApp"
                  className="h-10 bg-surface-card border border-border-ecru px-3 text-xs text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <input
                type="text"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="Alamat pengiriman default"
                className="w-full h-10 bg-surface-card border border-border-ecru px-3 text-xs text-primary focus:outline-none focus:border-primary"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="Kota / Kecamatan"
                  className="h-10 bg-surface-card border border-border-ecru px-3 text-xs text-primary focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  value={editPostal}
                  onChange={(e) => setEditPostal(e.target.value)}
                  placeholder="Kode Pos"
                  className="h-10 bg-surface-card border border-border-ecru px-3 text-xs text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-primary text-on-primary font-label-uppercase text-[11px] uppercase tracking-wider hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2.5 border border-border-ecru text-error font-label-uppercase text-[11px] uppercase tracking-wider hover:border-error cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
