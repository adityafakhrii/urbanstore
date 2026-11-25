import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { BRAND_ASSETS } from '../data/products';
import { INDO_PROVINCES } from '../utils/payment';
import { handleImageError } from '../utils/storage';
import {
  AlertBanner,
  Button,
  CustomSelect,
  InputField,
  StatusBadge,
  TextareaField,
} from './ui';

interface AccountSettingsPanelProps {
  variant: 'customer' | 'admin';
}

export const AccountSettingsPanel: React.FC<AccountSettingsPanelProps> = ({ variant }) => {
  const { user, profile, isAdmin, updateProfile, signOut } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [saving, setSaving] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || '');
    setWhatsapp(profile.whatsapp || '');
    setProvince(profile.default_province || '');
    setCity(profile.default_city || '');
    setDistrict(profile.default_district || '');
    setAddress(profile.default_address || '');
    setPostalCode(profile.default_postal_code || '');
  }, [profile]);

  const avatarSrc =
    (user?.user_metadata?.avatar_url as string) ||
    (user?.user_metadata?.picture as string) ||
    BRAND_ASSETS.avatar;

  const googleEmail = user?.email || profile?.email || '-';
  const roleLabel = isAdmin ? 'ADMIN ATELIER' : 'CUSTOMER MEMBER';

  const provinceOptions = [
    ...INDO_PROVINCES.map((p) => ({ value: p, label: p })),
    ...(province && !INDO_PROVINCES.includes(province) ? [{ value: province, label: province }] : []),
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (fullName.trim().length < 2) {
      setErrorMsg('Nama lengkap minimal 2 karakter.');
      return;
    }

    setSaving(true);
    const res = await updateProfile({
      full_name: fullName.trim(),
      whatsapp: whatsapp.trim(),
      default_province: province.trim(),
      default_city: city.trim(),
      default_district: district.trim(),
      default_address: address.trim(),
      default_postal_code: postalCode.trim(),
    });
    setSaving(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    const msg =
      variant === 'admin'
        ? 'Pengaturan profil Admin berhasil disimpan!'
        : 'Pengaturan profil & alamat default tersimpan!';
    setSuccessMsg(msg);
    showToast(msg);
  };

  const handleSwitchGoogleAccount = async () => {
    setSwitchingAccount(true);
    const redirectTarget = variant === 'admin' ? '/admin/account' : '/account';
    await signOut();
    navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Identity & Google OAuth Summary Card */}
      <section className="bg-surface-card border border-border-ecru rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <img
            src={avatarSrc}
            alt={profile?.full_name || googleEmail}
            referrerPolicy="no-referrer"
            onError={handleImageError}
            className="w-16 h-16 rounded-full object-cover border border-border-ecru shrink-0"
          />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-headline-sm text-lg sm:text-xl text-primary truncate">
                {profile?.full_name || (user?.user_metadata?.full_name as string) || 'Pengguna Google'}
              </h2>
              <StatusBadge
                label={roleLabel}
                className={
                  isAdmin
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-sand text-secondary border border-border-ecru'
                }
              />
            </div>
            <p className="font-body-sm text-xs text-text-muted truncate">{googleEmail}</p>
            <div className="inline-flex items-center gap-1.5 text-[11px] text-status-stock font-medium pt-0.5">
              <span className="material-symbols-outlined text-[15px]">verified_user</span>
              <span>Terhubung via Google OAuth</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={switchingAccount}
            onClick={() => void handleSwitchGoogleAccount()}
          >
            <span className="material-symbols-outlined text-[16px]">switch_account</span>
            {switchingAccount ? 'Mengalihkan...' : 'Ganti Akun Google'}
          </Button>
        </div>
      </section>

      {/* Editable Profile Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-surface-card border border-border-ecru rounded-2xl p-6 sm:p-8 space-y-6"
      >
        <div className="border-b border-border-ecru pb-3">
          <h3 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary">
            {variant === 'admin'
              ? 'Profil Pengelola Atelier & Kontak Operasional'
              : 'Informasi Profil & Alamat Pengiriman Default'}
          </h3>
          <p className="font-body-sm text-xs text-text-muted mt-1">
            {variant === 'admin'
              ? 'Nama tampilan admin akan digunakan di sidebar konsol dan laporan penjualan.'
              : 'Data nama, WhatsApp, dan alamat akan terisi otomatis saat kamu melakukan checkout.'}
          </p>
        </div>

        {errorMsg && <AlertBanner variant="error">{errorMsg}</AlertBanner>}
        {successMsg && <AlertBanner variant="success">{successMsg}</AlertBanner>}

        {/* Account Identity Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label={variant === 'admin' ? 'Nama Tampilan Admin' : 'Nama Lengkap'}
            required
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nama lengkap kamu"
          />
          <InputField
            label={variant === 'admin' ? 'No. WhatsApp Operasional' : 'No. WhatsApp'}
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="0812-3456-7890"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Email Akun (Google)"
            type="email"
            value={googleEmail}
            disabled
            leftIcon="mail"
            hint="Email disinkronkan dari Google dan tidak dapat diubah di sini."
          />
          <InputField
            label="Role Akses Akun"
            type="text"
            value={isAdmin ? 'Admin (Akses Penuh Konsol Atelier)' : 'Customer (Member Storefront)'}
            disabled
            leftIcon="shield_person"
            hint="Role dikontrol oleh sistem otorisasi database UrbanStore."
          />
        </div>

        {/* Shipping Address Section */}
        <div className="pt-2 border-t border-border-ecru space-y-4">
          <h4 className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
            {variant === 'admin'
              ? 'Alamat Pengiriman Default (Untuk Checkout Storefront)'
              : 'Alamat Pengiriman Default'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomSelect
              label="Provinsi"
              value={province}
              onChange={setProvince}
              options={provinceOptions}
              placeholder="Pilih Provinsi"
            />
            <InputField
              label="Kota / Kabupaten"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Contoh: Jakarta Selatan"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Kecamatan"
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Contoh: Kebayoran Baru"
            />
            <InputField
              label="Kode Pos"
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="12190"
            />
          </div>

          <TextareaField
            label="Alamat Jalan Lengkap"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Nama jalan, nomor rumah, RT/RW, atau patokan..."
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button type="submit" variant="primary" size="md" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan Profil'}
          </Button>
        </div>
      </form>

      {/* Locked Security / Password Policy Card */}
      <section className="bg-surface-card border border-border-ecru rounded-2xl p-6 sm:p-7 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block">
              KEAMANAN &amp; KATA SANDI
            </span>
            <h3 className="font-headline-sm text-lg text-primary">
              Autentikasi Dikelola oleh Google
            </h3>
          </div>
          <span className="w-10 h-10 rounded-full bg-surface-sand flex items-center justify-center shrink-0 text-secondary">
            <span className="material-symbols-outlined text-[20px]">lock</span>
          </span>
        </div>

        <AlertBanner variant="info" title="Pengubahan Password Dinonaktifkan">
          Akun UrbanStore kamu masuk menggunakan <strong>Google OAuth</strong>. Kamu tidak perlu dan
          tidak dapat membuat atau mengganti kata sandi di halaman ini karena keamanan kata sandi,
          verifikasi 2 langkah (2FA), dan pemulihan akun sepenuhnya ditangani oleh Google.
        </AlertBanner>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-text-muted">
          <span>Ingin mengubah kata sandi atau keamanan verifikasi Google kamu?</span>
          <a
            href="https://myaccount.google.com/security"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4 hover:opacity-80"
          >
            <span>Buka Keamanan Akun Google</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </div>
      </section>
    </div>
  );
};
