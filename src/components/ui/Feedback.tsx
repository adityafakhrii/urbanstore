import React from 'react';
import { useModalEffects } from '../../utils/storage';
import { Button } from './Button';

/* -------------------------------------------------------------------------- */
/* 1. AlertBanner (error / warning / info / success)                          */
/* -------------------------------------------------------------------------- */

export type AlertVariant = 'error' | 'warning' | 'info' | 'success';

const ALERT_STYLES: Record<
  AlertVariant,
  { container: string; icon: string; iconColor: string }
> = {
  error: {
    container: 'bg-error-container/60 border-error/30 text-on-error-container',
    icon: 'error',
    iconColor: 'text-error',
  },
  warning: {
    container: 'bg-[#FFF5EC] border-secondary/35 text-[#693B0F]',
    icon: 'warning',
    iconColor: 'text-secondary',
  },
  info: {
    container: 'bg-surface-sand border-border-ecru text-primary',
    icon: 'info',
    iconColor: 'text-secondary',
  },
  success: {
    container: 'bg-[#EAF4ED] border-status-stock/35 text-[#1F442C]',
    icon: 'check_circle',
    iconColor: 'text-status-stock',
  },
};

export interface AlertBannerProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  variant = 'info',
  title,
  children,
  action,
  className = '',
}) => {
  const style = ALERT_STYLES[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${style.container} ${className}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <span className={`material-symbols-outlined text-[19px] shrink-0 mt-0.5 sm:mt-0 ${style.iconColor}`}>
          {style.icon}
        </span>
        <div className="min-w-0 space-y-0.5">
          {title && <p className="font-semibold text-xs">{title}</p>}
          <div className="leading-relaxed">{children}</div>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. StatusBadge (Uniform Rounded Pill Badge)                                */
/* -------------------------------------------------------------------------- */

export const StatusBadge: React.FC<{
  label: string;
  className?: string;
}> = ({ label, className = 'bg-surface-sand text-secondary' }) => {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full font-label-uppercase text-[10px] uppercase tracking-wider whitespace-nowrap ${className}`}
    >
      {label}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. ConfirmDialog (Replaces native window.confirm with Editorial Modal)     */
/* -------------------------------------------------------------------------- */

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  useModalEffects(isOpen, onCancel);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-surface-card border border-border-ecru rounded-2xl p-6 shadow-xl space-y-5 animate-fade-in"
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              danger ? 'bg-error-container text-error' : 'bg-surface-sand text-secondary'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {danger ? 'warning' : 'help'}
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="font-headline-sm text-lg text-primary">{title}</h3>
            <p className="font-body-sm text-xs text-text-muted leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Memproses...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
