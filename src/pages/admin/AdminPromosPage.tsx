import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  PromoRow,
  createPromoAdmin,
  fetchPromosAdmin,
  formatRupiah,
  togglePromoAdmin,
} from '../../services/supabaseService';

export const AdminPromosPage: React.FC = () => {
  const { showToast } = useStore();
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoDescInput, setPromoDescInput] = useState('');
  const [promoDiscountInput, setPromoDiscountInput] = useState('50000');
  const [promoMinInput, setPromoMinInput] = useState('300000');

  const loadPromos = useCallback(async () => {
    setLoading(true);
    const data = await fetchPromosAdmin();
    setPromos(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPromos();
  }, [loadPromos]);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;
    const res = await createPromoAdmin({
      code: promoCodeInput,
      description: promoDescInput || `Potongan ${formatRupiah(Number(promoDiscountInput) || 0)}`,
      discount_amount: Math.max(1000, Number(promoDiscountInput) || 50000),
      min_subtotal: Math.max(0, Number(promoMinInput) || 0),
    });
    if (res.error) {
      showToast(`Gagal tambah promo: ${res.error}`);
      return;
    }
    setPromoCodeInput('');
    setPromoDescInput('');
    showToast('Kode promo baru berhasil ditambahkan!');
    await loadPromos();
  };

  const handleTogglePromo = async (promo: PromoRow) => {
    const res = await togglePromoAdmin(promo.code, !promo.is_active);
    if (res.error) {
      showToast(`Gagal ubah promo: ${res.error}`);
      return;
    }
    showToast(`Promo ${promo.code} ${!promo.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`);
    await loadPromos();
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border-ecru pb-5">
        <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
          VOUCHERS &amp; CAMPAIGNS
        </span>
        <h1 className="font-headline-sm text-2xl text-primary">Kelola Kode Promo</h1>
      </div>

      <form
        onSubmit={handleCreatePromo}
        className="bg-surface-card border border-border-ecru p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end text-xs"
      >
        <div>
          <label className="block text-text-muted mb-1">Kode Promo *</label>
          <input
            required
            type="text"
            value={promoCodeInput}
            onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
            placeholder="URBAN25"
            className="w-full h-10 bg-surface border border-border-ecru px-3 uppercase font-mono text-primary"
          />
        </div>
        <div>
          <label className="block text-text-muted mb-1">Potongan (IDR)</label>
          <input
            type="number"
            min={1000}
            value={promoDiscountInput}
            onChange={(e) => setPromoDiscountInput(e.target.value)}
            className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
          />
        </div>
        <div>
          <label className="block text-text-muted mb-1">Min. Subtotal</label>
          <input
            type="number"
            min={0}
            value={promoMinInput}
            onChange={(e) => setPromoMinInput(e.target.value)}
            className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
          />
        </div>
        <div>
          <label className="block text-text-muted mb-1">Keterangan</label>
          <input
            type="text"
            value={promoDescInput}
            onChange={(e) => setPromoDescInput(e.target.value)}
            placeholder="Promo Payday"
            className="w-full h-10 bg-surface border border-border-ecru px-3 text-primary"
          />
        </div>
        <button
          type="submit"
          className="h-10 bg-primary text-on-primary font-label-uppercase text-[11px] uppercase tracking-wider cursor-pointer hover:bg-neutral-800"
        >
          + Tambah Promo
        </button>
      </form>

      <div className="bg-surface-card border border-border-ecru overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
              <th className="p-3">Kode</th>
              <th className="p-3">Keterangan</th>
              <th className="p-3">Potongan</th>
              <th className="p-3">Min. Belanja</th>
              <th className="p-3">Status</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-ecru">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-text-muted">
                  Memuat daftar promo...
                </td>
              </tr>
            ) : promos.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-text-muted">
                  Belum ada kode promo terdaftar.
                </td>
              </tr>
            ) : (
              promos.map((pr) => (
                <tr key={pr.code}>
                  <td className="p-3 font-mono font-bold text-primary">{pr.code}</td>
                  <td className="p-3 text-primary">{pr.description || '-'}</td>
                  <td className="p-3 text-primary">{formatRupiah(pr.discount_amount)}</td>
                  <td className="p-3 text-text-muted">{formatRupiah(pr.min_subtotal)}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-label-uppercase uppercase ${
                        pr.is_active
                          ? 'bg-status-stock text-white'
                          : 'bg-surface-container-highest text-text-muted'
                      }`}
                    >
                      {pr.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => void handleTogglePromo(pr)}
                      className="px-3 py-1 border border-border-ecru text-primary text-[10px] font-label-uppercase uppercase hover:bg-surface-muted cursor-pointer"
                    >
                      {pr.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
