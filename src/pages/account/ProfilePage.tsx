import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { INDO_PROVINCES } from '../../utils/payment';

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-ecru pb-6">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            AKUN URBANSTORE
          </span>
          <h1 className="font-headline-sm text-headline-sm text-primary">
            Halo, {profile?.full_name || user?.email || 'Member'}
          </h1>
          <p className="font-body-sm text-xs text-text-muted mt-1">
            {user?.email} · Role: <strong className="uppercase">{isAdmin ? 'Admin' : 'Customer'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Link
              to="/admin/orders"
              className="px-4 py-2 bg-primary text-on-primary font-label-uppercase text-[11px] uppercase tracking-wider"
            >
              Buka Admin Console →
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 border border-red-200 text-red-700 hover:bg-red-50 font-label-uppercase text-[11px] uppercase tracking-wider cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/account/orders"
          className="p-5 bg-surface-card border border-border-ecru hover:border-primary transition-colors flex items-center justify-between"
        >
          <div>
            <p className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
              Riwayat Transaksi
            </p>
            <p className="font-headline-sm text-lg text-primary mt-1">{orders.length} Pesanan</p>
          </div>
          <span className="material-symbols-outlined text-[24px] text-primary">receipt_long</span>
        </Link>

        <Link
          to="/wishlist"
          className="p-5 bg-surface-card border border-border-ecru hover:border-primary transition-colors flex items-center justify-between"
        >
          <div>
            <p className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
              Koleksi Tersimpan
            </p>
            <p className="font-headline-sm text-lg text-primary mt-1">{wishlistIds.length} Wishlist</p>
          </div>
          <span className="material-symbols-outlined text-[24px] text-primary">favorite</span>
        </Link>
      </div>

      {/* Edit Profile & Address Form */}
      <form onSubmit={handleSaveProfile} className="bg-surface-card border border-border-ecru p-6 sm:p-8 space-y-5">
        <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary border-b border-border-ecru pb-3">
          Profil &amp; Alamat Pengiriman Default
        </h2>

        {errorMsg && (
          <div className="p-3 bg-error-container/70 border border-error/40 text-error text-xs">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-body-sm text-xs text-text-muted mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-11 bg-surface border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
            />
          </div>
          <div>
            <label className="block font-body-sm text-xs text-text-muted mb-1">No. WhatsApp</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full h-11 bg-surface border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-body-sm text-xs text-text-muted mb-1">Provinsi Default</label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full h-11 bg-surface border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
            >
              <option value="">Pilih Provinsi</option>
              {INDO_PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              {province && !INDO_PROVINCES.includes(province) && (
                <option value={province}>{province}</option>
              )}
            </select>
          </div>
          <div>
            <label className="block font-body-sm text-xs text-text-muted mb-1">Kota / Kabupaten</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Contoh: Jakarta Selatan"
              className="w-full h-11 bg-surface border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-body-sm text-xs text-text-muted mb-1">Kecamatan</label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Contoh: Kebayoran Baru"
              className="w-full h-11 bg-surface border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
            />
          </div>
          <div>
            <label className="block font-body-sm text-xs text-text-muted mb-1">Kode Pos</label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="12190"
              className="w-full h-11 bg-surface border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
            />
          </div>
        </div>

        <div>
          <label className="block font-body-sm text-xs text-text-muted mb-1">Alamat Jalan Lengkap</label>
          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-surface border border-border-ecru p-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
        </button>
      </form>
    </div>
  );
};
