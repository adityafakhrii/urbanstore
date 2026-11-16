import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeNewsletterInDb } from '../services/supabaseService';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC = () => {
  const { setSizeGuideOpen, showToast } = useStore();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!isValidEmail) {
      showToast('Masukin email yang valid dulu ya biar nggak ketinggalan drop baru!');
      return;
    }
    const res = await subscribeNewsletterInDb(email);
    if (!res.ok) {
      showToast('Mantap! Email kamu udah tercatat untuk info drop terbaru.');
    } else {
      showToast('Mantap! Kamu udah masuk list VIP buat dapetin spill drop terbaru.');
    }
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="w-full bg-surface-sand border-t border-border-ecru mt-space-2xl print:hidden">
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
              <li>
                <Link to="/curated-drops" className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors">
                  Drop Baru
                </Link>
              </li>
              <li>
                <Link to="/women" className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors">
                  Wanita
                </Link>
              </li>
              <li>
                <Link to="/men" className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors">
                  Pria
                </Link>
              </li>
              <li>
                <Link to="/shoes" className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors">
                  Sepatu Kurasi
                </Link>
              </li>
              <li>
                <Link to="/bags" className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors">
                  Tas Kulit
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-label-uppercase text-label-uppercase uppercase text-primary mb-space-md tracking-wider">
              Bantuan &amp; Fit
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors cursor-pointer text-left"
                >
                  Panduan Size Anti-Zonk
                </button>
              </li>
              <li>
                <Link to="/account/orders" className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors">
                  Cek Status Pesanan
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors">
                  Wishlist Favorit
                </Link>
              </li>
              <li>
                <Link to="/about" className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors">
                  Retur 30 Hari &amp; Ongkir
                </Link>
              </li>
              <li>
                <Link to="/about" className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors">
                  Cara Rawat Pakaian
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-label-uppercase text-label-uppercase uppercase text-primary mb-space-md tracking-wider">
              Atelier
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/about" className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors">
                  Cerita Brand
                </Link>
              </li>
              <li>
                <Link to="/about" className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors">
                  Manifesto Anti-Zonk
                </Link>
              </li>
              <li>
                <Link to="/about" className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors">
                  Transparansi Bahan
                </Link>
              </li>
              <li>
                <Link to="/about" className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors">
                  Lokasi Toko: Jakarta
                </Link>
              </li>
              <li>
                <Link to="/curated-drops" className="font-body-md text-body-md text-text-muted hover:text-primary transition-colors">
                  Katalog Lengkap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border-ecru pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md font-body-sm text-body-sm text-text-muted">
          <div>© {new Date().getFullYear()} UrbanStore Editorial Atelier. All rights reserved.</div>
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
