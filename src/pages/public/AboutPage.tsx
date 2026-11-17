import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Button, getButtonClassName } from '../../components/ui';

export const AboutPage: React.FC = () => {
  const { setSizeGuideOpen } = useStore();

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12 space-y-10">
      <header className="border-b border-border-ecru pb-8">
        <span className="font-label-uppercase text-[11px] uppercase tracking-[0.22em] text-secondary block mb-2">
          ATELIER &amp; PHILOSOPHY
        </span>
        <h1 className="font-headline-sm text-3xl sm:text-4xl text-primary leading-tight">
          Arsitektur Busana Tropis Modern
        </h1>
        <p className="font-body-md text-text-muted mt-4 max-w-2xl leading-relaxed">
          UrbanStore Indonesia menghadirkan siluet bersih yang terinspirasi oleh arsitektur tropis dan
          ritme keseharian kota besar. Setiap potongan dirancang dengan kain bernapas serta detail jahitan
          presisi agar tahan lintas musim.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        <div className="p-6 border border-border-ecru rounded-2xl bg-surface-card space-y-2">
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
            01. Material Alami
          </span>
          <h2 className="font-headline-sm text-lg text-primary">Tencel &amp; Katun Sisir</h2>
          <p className="font-body-sm text-xs text-text-muted leading-relaxed">
            Serat pilihan yang sejuk di iklim lembap, jatuh rapi, dan meminimalkan kusut untuk mobilitas tinggi.
          </p>
        </div>

        <div className="p-6 border border-border-ecru rounded-2xl bg-surface-card space-y-2">
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
            02. Skala Fit Konsisten
          </span>
          <h2 className="font-headline-sm text-lg text-primary">Atelier Fit Index</h2>
          <p className="font-body-sm text-xs text-text-muted leading-relaxed">
            Panduan ukuran transparan dari Slim hingga Relaxed Boxy yang terkalibrasi untuk proporsi Asia.
          </p>
        </div>

        <div className="p-6 border border-border-ecru rounded-2xl bg-surface-card space-y-2">
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
            03. Layanan Indonesia
          </span>
          <h2 className="font-headline-sm text-lg text-primary">Pengiriman &amp; Pembayaran Lokal</h2>
          <p className="font-body-sm text-xs text-text-muted leading-relaxed">
            Mendukung verifikasi transfer bank domestik, invoice PDF instan, dan pelacakan resi seluruh Indonesia.
          </p>
        </div>
      </section>

      <section className="border border-border-ecru rounded-2xl bg-surface-sand p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="font-headline-sm text-xl text-primary">Siap Menemukan Siluet Pilihanmu?</h2>
          <p className="font-body-sm text-xs text-text-muted mt-1">
            Jelajahi rilisan terbaru atau lihat panduan ukuran sebelum memesan.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="md" onClick={() => setSizeGuideOpen(true)}>
            Buka Size Guide
          </Button>
          <Link
            to="/curated-drops"
            className={getButtonClassName({ variant: 'primary', size: 'md' })}
          >
            Lihat Koleksi
          </Link>
        </div>
      </section>
    </div>
  );
};
