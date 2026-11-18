import React from 'react';
import { useStore } from '../context/StoreContext';

export const ToastBanner: React.FC = () => {
  const { toastMessage, dismissToast } = useStore();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-20 right-5 z-50 bg-primary text-on-primary px-5 py-3.5 rounded-2xl shadow-xl border border-white/15 flex items-center gap-3 max-w-sm animate-fade-in print:hidden">
      <span className="material-symbols-outlined text-[18px] text-secondary-container shrink-0">
        check_circle
      </span>
      <span className="font-body-sm text-xs tracking-wide leading-snug">{toastMessage}</span>
      <button
        type="button"
        onClick={dismissToast}
        aria-label="Tutup notifikasi"
        className="text-on-primary/70 hover:text-on-primary p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer shrink-0"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
};
