import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary border border-primary hover:bg-neutral-800 shadow-xs disabled:bg-neutral-400 disabled:border-neutral-400',
  secondary:
    'bg-secondary text-on-secondary border border-secondary hover:opacity-90 shadow-xs disabled:opacity-50',
  outline:
    'bg-surface-card text-primary border border-border-ecru hover:border-primary hover:bg-surface-sand/60 disabled:opacity-50',
  ghost:
    'bg-transparent text-secondary border border-transparent hover:bg-surface-sand hover:text-primary disabled:opacity-50',
  danger:
    'bg-surface-card text-error border border-error/40 hover:bg-error-container/60 disabled:opacity-50',
  success:
    'bg-status-stock text-white border border-status-stock hover:opacity-90 shadow-xs disabled:opacity-50',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[11px] gap-1.5',
  md: 'h-11 px-5 text-[11px] gap-2',
  lg: 'h-12 px-6 text-xs gap-2',
};

export function getButtonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  return [
    'inline-flex items-center justify-center font-label-uppercase uppercase tracking-[0.12em] rounded-xl transition-all duration-200 cursor-pointer disabled:cursor-not-allowed select-none whitespace-nowrap',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
  children,
  ...rest
}) => {
  return (
    <button
      type={type}
      className={getButtonClassName({ variant, size, fullWidth, className })}
      {...rest}
    >
      {children}
    </button>
  );
};
