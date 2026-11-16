import React from 'react';
import { useStore } from '../context/StoreContext';

export const ToastBanner: React.FC = () => {
  const { toastMessage, dismissToast } = useStore();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-5 py-3.5 rounded-DEFAULT shadow-lg border border-border-ecru/20 flex items-center gap-3 max-w-sm animate-fade-in print:hidden">
      <span className="font-body-sm text-xs tracking-wide">{toastMessage}</span>
      <button
        type="button"
        onClick={dismissToast}
        aria-label="Tutup notifikasi"
        className="text-on-primary/70 hover:text-on-primary cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
};
