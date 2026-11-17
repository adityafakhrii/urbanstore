import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { INDO_PROVINCES } from '../../utils/payment';
import {
  AlertBanner,
  Button,
  CustomSelect,
  InputField,
  TextareaField,
  getButtonClassName,
} from '../../components/ui';

export const ProfilePage: React.FC = () => {
  const { user, profile, isAdmin, updateProfile, signOut } = useAuth();
  const { showToast, wishlistIds, orders } = useStore();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const provinceOptions = [
    ...INDO_PROVINCES.map((p) => ({ value: p, label: p })),
    ...(province && !INDO_PROVINCES.includes(province) ? [{ value: province, label: province }] : []),
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
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

    showToast('Profil & alamat default tersimpan!');
  };

  const handleLogout = async () => {
    await signOut();
    showToast('Kamu sudah keluar dari akun.');
    navigate('/', { replace: true });
  };

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-ecru pb-6">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            AKUN URBANSTORE
          </span>
          <h1 className="font-headline-sm text-2xl sm:text-3xl text-primary">
            Halo, {profile?.full_name || user?.email || 'Member'}
          </h1>
          <p className="font-body-sm text-xs text-text-muted mt-1">
            {user?.email} · Role: <strong className="uppercase">{isAdmin ? 'Admin' : 'Customer'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className={getButtonClassName({ variant: 'primary', size: 'sm' })}
            >
              Buka Admin Console →
            </Link>
          )}
          <Button variant="danger" size="sm" onClick={handleLogout}>
            Keluar
          </Button>
        </div>
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Link
          to="/account/orders"
          className="p-5 sm:p-6 bg-surface-card border border-border-ecru rounded-2xl hover:border-primary transition-colors flex items-center justify-between"
        >
          <div>
            <p className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
              Riwayat Transaksi
            </p>
            <p className="font-headline-sm text-xl text-primary mt-1">{orders.length} Pesanan</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-surface-sand flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px] text-primary">receipt_long</span>
          </div>
        </Link>

        <Link
          to="/wishlist"
          className="p-5 sm:p-6 bg-surface-card border border-border-ecru rounded-2xl hover:border-primary transition-colors flex items-center justify-between"
        >
          <div>
            <p className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
              Koleksi Tersimpan
            </p>
            <p className="font-headline-sm text-xl text-primary mt-1">{wishlistIds.length} Wishlist</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-surface-sand flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px] text-primary">favorite</span>
          </div>
        </Link>
      </div>

      {/* Edit Profile & Address Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-surface-card border border-border-ecru rounded-2xl p-6 sm:p-8 space-y-5"
      >
        <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary border-b border-border-ecru pb-3">
          Profil &amp; Alamat Pengiriman Default
        </h2>

        {errorMsg && <AlertBanner variant="error">{errorMsg}</AlertBanner>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Nama Lengkap"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <InputField
            label="No. WhatsApp"
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomSelect
            label="Provinsi Default"
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
        />

        <Button type="submit" variant="primary" size="md" disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
        </Button>
      </form>
    </div>
  );
};
