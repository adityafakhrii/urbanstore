import React, { useState, useEffect } from 'react';
import { useModalEffects } from '../utils/storage';
import { fetchSizeGuides, SizeGuideRow } from '../services/supabaseService';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_TOPS: SizeGuideRow[] = [
  { id: 1, garment_type: 'tops', size_label: 'XS', chest_cm: 92, waist_cm: 74, length_cm: 68, foot_cm: null, min_weight_kg: 40, max_weight_kg: 48, sort_order: 1 },
  { id: 2, garment_type: 'tops', size_label: 'S', chest_cm: 96, waist_cm: 78, length_cm: 70, foot_cm: null, min_weight_kg: 49, max_weight_kg: 57, sort_order: 2 },
  { id: 3, garment_type: 'tops', size_label: 'M (Core)', chest_cm: 100, waist_cm: 82, length_cm: 72, foot_cm: null, min_weight_kg: 58, max_weight_kg: 67, sort_order: 3 },
  { id: 4, garment_type: 'tops', size_label: 'L', chest_cm: 106, waist_cm: 88, length_cm: 74, foot_cm: null, min_weight_kg: 68, max_weight_kg: 77, sort_order: 4 },
  { id: 5, garment_type: 'tops', size_label: 'XL', chest_cm: 112, waist_cm: 94, length_cm: 76, foot_cm: null, min_weight_kg: 78, max_weight_kg: 95, sort_order: 5 },
];

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  const [fitPreference, setFitPreference] = useState<'slim' | 'core' | 'relaxed'>('core');
  const [heightCm, setHeightCm] = useState<string>('170');
  const [weightKg, setWeightKg] = useState<string>('58');
  const [garmentTab, setGarmentTab] = useState<'tops' | 'bottoms' | 'shoes'>('tops');
  const [dbRows, setDbRows] = useState<SizeGuideRow[]>([]);

  useModalEffects(isOpen, onClose);

  useEffect(() => {
    if (!isOpen || dbRows.length > 0) return;
    void fetchSizeGuides().then((rows) => {
      if (rows.length > 0) setDbRows(rows);
    });
  }, [isOpen, dbRows.length]);

  if (!isOpen) return null;

  const calculateRecommendedSize = () => {
    const h = Number(heightCm) || 170;
    const w = Number(weightKg) || 58;
    let baseIndex = 1; // 0: XS, 1: S, 2: M, 3: L, 4: XL
    if (w < 49) baseIndex = 0;
    else if (w < 58) baseIndex = 1;
    else if (w < 68) baseIndex = 2;
    else if (w < 78) baseIndex = 3;
    else baseIndex = 4;

    if (h > 178 && baseIndex < 3) baseIndex += 1;
    if (fitPreference === 'slim' && baseIndex > 0) baseIndex -= 1;
    if (fitPreference === 'relaxed' && baseIndex < 4) baseIndex += 1;

    const sizes = ['XS', 'S', 'M (Core)', 'L', 'XL'];
    return sizes[baseIndex];
  };

  const recommended = calculateRecommendedSize();

  return (
    <div aria-modal="true" className="fixed inset-0 z-50" role="dialog">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1A1A1A]/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface-card border-l border-border-ecru p-6 lg:p-8 flex flex-col justify-between overflow-y-auto z-10">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border-ecru mb-6">
              <div>
                <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-text-muted">
                  PANDUAN SIZE URBANSTORE
                </span>
                <h3 className="font-headline-sm text-headline-sm text-primary">Visual Fit Guide</h3>
              </div>
              <button
                type="button"
                className="p-1 text-on-surface hover:text-secondary cursor-pointer"
                onClick={onClose}
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Fit Slider Preview */}
            <div className="mb-6 p-4 bg-surface-sand rounded-DEFAULT border border-border-ecru">
              <div className="flex justify-between text-body-sm font-label-uppercase text-[11px] uppercase tracking-wider text-text-muted mb-2">
                <button
                  type="button"
                  onClick={() => setFitPreference('slim')}
                  className={`cursor-pointer ${fitPreference === 'slim' ? 'text-primary font-bold' : ''}`}
                >
                  Slim Fit
                </button>
                <button
                  type="button"
                  onClick={() => setFitPreference('core')}
                  className={`cursor-pointer ${fitPreference === 'core' ? 'text-primary font-bold' : ''}`}
                >
                  Pas Banget
                </button>
                <button
                  type="button"
                  onClick={() => setFitPreference('relaxed')}
                  className={`cursor-pointer ${fitPreference === 'relaxed' ? 'text-primary font-bold' : ''}`}
                >
                  Relaxed
                </button>
              </div>
              <div className="w-full bg-border-ecru h-1 rounded-full relative">
                <div
                  className={`absolute -top-1 w-3 h-3 bg-primary rounded-full transition-all ${
                    fitPreference === 'slim'
                      ? 'left-[10%]'
                      : fitPreference === 'relaxed'
                      ? 'left-[88%]'
                      : 'left-1/2 -ml-1.5'
                  }`}
                />
              </div>
              <p className="text-[12px] text-text-muted mt-3">
                Model memakai Size M (Pria: 184cm / 74kg, Wanita: 175cm / 55kg).
              </p>
            </div>

            {/* Interactive Anti-Zonk Quick Calculator */}
            <div className="mb-6 p-4 bg-surface-container-low border border-border-ecru rounded-DEFAULT">
              <span className="font-label-uppercase text-[10px] uppercase tracking-wider text-secondary block mb-2">
                CEK REKOMENDASI ANTI-ZONK
              </span>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block font-body-sm text-[11px] text-text-muted mb-1">Tinggi Badan (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full bg-surface-card border border-border-ecru px-3 py-1.5 text-body-sm text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-body-sm text-[11px] text-text-muted mb-1">Berat Badan (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full bg-surface-card border border-border-ecru px-3 py-1.5 text-body-sm text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border-ecru text-xs">
                <span className="text-text-muted">Size paling pas buat kamu:</span>
                <span className="font-semibold text-primary bg-surface-card px-2.5 py-0.5 border border-border-ecru">
                  Size {recommended}
                </span>
              </div>
            </div>

            {/* Garment Type Tabs */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {[
                { id: 'tops' as const, label: 'Atasan / Dress' },
                { id: 'bottoms' as const, label: 'Celana' },
                { id: 'shoes' as const, label: 'Sepatu' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setGarmentTab(t.id)}
                  className={`py-1.5 font-label-uppercase text-[10px] uppercase tracking-wider border cursor-pointer ${
                    garmentTab === t.id
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-card text-text-muted border-border-ecru hover:border-primary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {(() => {
                const activeRows = dbRows.filter((r) => r.garment_type === garmentTab);
                const rows =
                  activeRows.length > 0
                    ? activeRows
                    : garmentTab === 'tops'
                    ? DEFAULT_TOPS
                    : [];

                if (rows.length === 0) {
                  return (
                    <div className="p-4 text-xs text-text-muted border border-border-ecru bg-surface-sand">
                      Data tabel ukuran untuk kategori ini belum tersedia di database.
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left font-body-sm text-[13px]">
                    <thead>
                      <tr className="border-b border-border-ecru font-label-uppercase text-[10px] tracking-wider uppercase text-text-muted">
                        <th className="py-2.5">Size</th>
                        {garmentTab === 'tops' && <th className="py-2.5">Dada (cm)</th>}
                        {garmentTab !== 'shoes' && <th className="py-2.5">Pinggang (cm)</th>}
                        {garmentTab !== 'shoes' && <th className="py-2.5">Panjang (cm)</th>}
                        {garmentTab === 'shoes' && <th className="py-2.5">Panjang Kaki (cm)</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-ecru tabular-nums">
                      {rows.map((row) => {
                        const isRecommended = garmentTab === 'tops' && recommended === row.size_label;
                        return (
                          <tr
                            key={row.size_label}
                            className={isRecommended ? 'bg-surface-sand font-semibold text-primary' : ''}
                          >
                            <td className={`py-2.5 font-semibold ${isRecommended ? 'text-secondary' : ''}`}>
                              {row.size_label}
                            </td>
                            {garmentTab === 'tops' && (
                              <td className="py-2.5 text-text-muted">{row.chest_cm ?? '–'}</td>
                            )}
                            {garmentTab !== 'shoes' && (
                              <td className="py-2.5 text-text-muted">{row.waist_cm ?? '–'}</td>
                            )}
                            {garmentTab !== 'shoes' && (
                              <td className="py-2.5 text-text-muted">{row.length_cm ?? '–'}</td>
                            )}
                            {garmentTab === 'shoes' && (
                              <td className="py-2.5 text-text-muted">{row.foot_cm ?? '–'}</td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            <p className="font-body-sm text-[12px] text-text-muted mt-4 italic">
              Tips: Ukur kaos atau kemeja ternyamanmu mendatar, lalu cocokkan sama tabel di atas.
            </p>
          </div>

          <div className="pt-6 border-t border-border-ecru mt-6">
            <button
              type="button"
              className="w-full py-3 bg-primary text-on-primary font-label-uppercase text-label-uppercase tracking-wider uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
              onClick={onClose}
            >
              Paham, Gas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
