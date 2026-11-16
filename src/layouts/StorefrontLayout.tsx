import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { QuickBagDrawer } from '../components/QuickBagDrawer';
import { SizeGuideModal } from '../components/SizeGuideModal';
import { ToastBanner } from '../components/ToastBanner';
import { useStore } from '../context/StoreContext';

export const StorefrontLayout: React.FC = () => {
  const { sizeGuideOpen, setSizeGuideOpen } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body-md text-on-surface antialiased">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <QuickBagDrawer />
      <SizeGuideModal isOpen={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
      <ToastBanner />
    </div>
  );
};
