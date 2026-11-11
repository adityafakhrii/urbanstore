import React, { useState } from 'react';
import { ActivePage } from './Header';

interface FooterProps {
  onNavigate: (page: ActivePage) => void;
  onOpenSizeGuide: () => void;
  onShowToast: (msg: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenSizeGuide,
  onShowToast,
}) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      onShowToast('Masukin email yang valid dulu ya biar nggak ketinggalan drop baru!');
      return;
    }
    setSubscribed(true);
    setEmail('');
    onShowToast('Mantap! Kamu udah masuk list VIP buat dapetin spill drop terbaru.');
  };

  return (
    <footer className="w-full bg-surface-sand border-t border-border-ecru mt-space-2xl">
      <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin pt-space-2xl pb-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-gutter mb-space-2xl">
          <div className="lg:col-span-2 pr-0 lg:pr-space-xl">
            <span className="font-headline-sm text-headline-sm text-primary block mb-space-sm">
              UrbanStore Editorial
            </span>
            <p className="font-body-md text-body-md text-text-muted mb-space-lg max-w-sm">
              Kurasi outfit modern tailoring dengan vibe quiet luxury. Pas di badan, estetik, dan timeless.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-space-xs">
              <label className="block font-label-uppercase text-label-uppercase uppercase text-text-muted">
                DAPETIN SPILL DROP BARU
              </label>
              <div className="flex items-center max-w-md">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-surface-card border border-border-ecru px-space-md py-2.5 text-body-sm font-body-sm text-on-surface rounded-l-DEFAULT focus:outline-none focus:border-primary"
                  placeholder={subscribed ? 'Udah terdaftar di VIP list ✨' : 'Masukin email kamu...'}
                  type="email"
                />
                <button
                  type="submit"
                  className="bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase px-space-lg py-2.5 rounded-r-DEFAULT hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                >
                  Langganan
                </button>
              </div>
            </form>
          </div>

          <div>
            <h4 className="font-label-uppercase text-label-uppercase uppercase text-primary mb-space-md tracking-wider">
              Koleksi
            </h4>
            <ul className="space-y-2.5">
              <li
                onClick={() => onNavigate('curated-drops')}
                className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors cursor-pointer"
              >
                Drop Baru
              </li>
              <li
                onClick={() => onNavigate('women')}
                className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors cursor-pointer"
              >
                Linen &amp; Sutra
              </li>
              <li
                onClick={() => onNavigate('women')}
                className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors cursor-pointer"
              >
                Outerwear
              </li>
              <li
                onClick={() => onNavigate('shoes')}
                className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors cursor-pointer"
              >
                Sepatu Kurasi
              </li>
              <li
                onClick={() => onNavigate('bags')}
                className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors cursor-pointer"
              >
                Tas Kulit
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-label-uppercase text-label-uppercase uppercase text-primary mb-space-md tracking-wider">
              Bantuan &amp; Fit
            </h4>
            <ul className="space-y-2.5">
              <li
                onClick={onOpenSizeGuide}
                className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors cursor-pointer"
              >
                Panduan Size Anti-Zonk
              </li>
              <li
                onClick={() => onShowToast('Gratis ongkir otomatis buat transaksi minimal Rp 500.000 ke seluruh Indonesia!')}
                className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors cursor-pointer"
              >
                Bebas Ongkir
              </li>
              <li
                onClick={() => onShowToast('Salah size? Tenang, tuker size gratis dijemput kurir ke rumah dalam 30 hari.')}
                className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors cursor-pointer"
              >
                Retur 30 Hari
              </li>
              <li
                onClick={() => onShowToast('Tips rawat bahan alami ada di setiap halaman detail produk ya!')}
                className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors cursor-pointer"
              >
                Cara Rawat Pakaian
              </li>
              <li
                onClick={() => onShowToast('Stylist Atelier kami siap bantu via WhatsApp Senin–Minggu 09.00–21.00 WIB.')}
                className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors cursor-pointer"
              >
                Chat Tim Kami
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-label-uppercase text-label-uppercase uppercase text-primary mb-space-md tracking-wider">
              Atelier
            </h4>
            <ul className="space-y-2.5">
              <li
                onClick={() => onNavigate('women')}
                className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors cursor-pointer"
              >
                Cerita Brand
              </li>
              <li
                onClick={onOpenSizeGuide}
                className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors cursor-pointer"
              >
                Manifesto Kami
              </li>
              <li
                onClick={() => onShowToast('100% GOTS Certified Organic Flax, Mulberry Silk 22mm, & Grade-A Cashmere.')}
                className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors cursor-pointer"
              >
                Transparansi Bahan
              </li>
              <li
                onClick={() => onShowToast('UrbanStore Atelier: Jl. Senopati No. 48, Kebayoran Baru, Jakarta Selatan.')}
                className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors cursor-pointer"
              >
                Lokasi Toko: Jakarta
              </li>
              <li
                onClick={() => onNavigate('curated-drops')}
                className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors cursor-pointer"
              >
                Liputan Media
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border-ecru pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md font-body-sm text-body-sm text-text-muted">
          <div>© 2025 UrbanStore Editorial Atelier. All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-space-md font-label-uppercase text-[10px] tracking-wider uppercase">
            <span className="border border-border-ecru bg-surface-card px-2 py-0.5 rounded-DEFAULT">
              BCA Virtual Account
            </span>
            <span className="border border-border-ecru bg-surface-card px-2 py-0.5 rounded-DEFAULT">
              QRIS
            </span>
            <span className="border border-border-ecru bg-surface-card px-2 py-0.5 rounded-DEFAULT">
              Mandiri
            </span>
            <span className="border border-border-ecru bg-surface-card px-2 py-0.5 rounded-DEFAULT">
              Visa / Mastercard
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
