import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ToastBanner } from '../components/ToastBanner';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface font-body-md text-on-surface antialiased">
      <header className="w-full border-b border-border-ecru bg-surface/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="font-headline-sm text-lg tracking-[0.22em] text-primary hover:opacity-80 transition-opacity"
          >
            URBANSTORE
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 font-label-uppercase text-[11px] uppercase tracking-wider text-secondary hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            Kembali ke Toko
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <Outlet />
      </main>

      <footer className="py-6 border-t border-border-ecru text-center">
        <p className="font-label-uppercase text-[10px] uppercase tracking-[0.2em] text-text-muted">
          © 2026 UrbanStore Indonesia — Architectural Apparel
        </p>
      </footer>

      <ToastBanner />
    </div>
  );
};
