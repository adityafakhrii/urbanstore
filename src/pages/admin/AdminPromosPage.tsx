import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  PromoRow,
  createPromoAdmin,
  fetchPromosAdmin,
  formatRupiah,
  togglePromoAdmin,
} from '../../services/supabaseService';
import { Button, CurrencyInputField, InputField, StatusBadge } from '../../components/ui';

export const AdminPromosPage: React.FC = () => {
  const { showToast } = useStore();
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoDescInput, setPromoDescInput] = useState('');
  const [promoDiscountInput, setPromoDiscountInput] = useState<number>(50000);
  const [promoMinInput, setPromoMinInput] = useState<number>(300000);

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
    <div className="space-y-8">
      <div className="border-b border-border-ecru pb-6">
        <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
          VOUCHERS &amp; CAMPAIGNS
        </span>
        <h1 className="font-headline-sm text-2xl sm:text-3xl text-primary">Kelola Kode Promo</h1>
      </div>

      <form
        onSubmit={handleCreatePromo}
        className="bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
      >
        <InputField
          label="Kode Promo"
          required
          type="text"
          value={promoCodeInput}
          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
          placeholder="URBAN25"
          className="uppercase font-mono"
        />
        <CurrencyInputField
          label="Potongan (IDR)"
          value={promoDiscountInput}
          onValueChange={setPromoDiscountInput}
        />
        <CurrencyInputField
          label="Min. Subtotal"
          value={promoMinInput}
          onValueChange={setPromoMinInput}
        />
        <InputField
          label="Keterangan"
          type="text"
          value={promoDescInput}
          onChange={(e) => setPromoDescInput(e.target.value)}
          placeholder="Promo Payday"
        />
        <Button type="submit" variant="primary" size="md" fullWidth>
          + Tambah Promo
        </Button>
      </form>

      <div className="bg-surface-card border border-border-ecru rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-ecru bg-surface-sand font-label-uppercase text-[10px] uppercase text-text-muted">
                <th className="p-4">Kode</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4">Potongan</th>
                <th className="p-4">Min. Belanja</th>
                <th className="p-4">Status</th>
                <th className="p-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ecru">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-muted">
                    Memuat daftar promo...
                  </td>
                </tr>
              ) : promos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-muted">
                    Belum ada kode promo terdaftar.
                  </td>
                </tr>
              ) : (
                promos.map((pr) => (
                  <tr key={pr.code}>
                    <td className="p-4 font-mono font-bold text-primary">{pr.code}</td>
                    <td className="p-4 text-primary">{pr.description || '-'}</td>
                    <td className="p-4 text-primary">{formatRupiah(pr.discount_amount)}</td>
                    <td className="p-4 text-text-muted">{formatRupiah(pr.min_subtotal)}</td>
                    <td className="p-4">
                      <StatusBadge
                        label={pr.is_active ? 'Aktif' : 'Nonaktif'}
                        className={
                          pr.is_active
                            ? 'bg-status-stock text-white'
                            : 'bg-surface-container-highest text-text-muted'
                        }
                      />
                    </td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleTogglePromo(pr)}
                      >
                        {pr.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
