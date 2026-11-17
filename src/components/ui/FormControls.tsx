import React, { useEffect, useId, useRef, useState } from 'react';

const CONTROL_BASE =
  'w-full bg-surface-card border border-border-ecru rounded-xl text-body-sm text-primary placeholder:text-text-muted/70 transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-surface-container-low disabled:text-text-muted disabled:cursor-not-allowed';

const CONTROL_ERROR = 'border-error/70 focus:border-error focus:ring-error/15';

interface BaseFieldProps {
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  containerClassName?: string;
}

const FieldLabel: React.FC<{
  htmlFor?: string;
  label?: string;
  required?: boolean;
}> = ({ htmlFor, label, required }) => {
  if (!label) return null;
  return (
    <label
      htmlFor={htmlFor}
      className="block font-body-sm text-xs font-medium text-text-muted mb-1.5"
    >
      {label}
      {required && <span className="text-secondary ml-0.5">*</span>}
    </label>
  );
};

const FieldFooter: React.FC<{ hint?: string; error?: string | null }> = ({ hint, error }) => {
  if (error) {
    return (
      <p className="mt-1.5 text-[11px] text-error flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">error</span>
        <span>{error}</span>
      </p>
    );
  }
  if (hint) {
    return <p className="mt-1.5 text-[11px] text-text-muted">{hint}</p>;
  }
  return null;
};

/* -------------------------------------------------------------------------- */
/* 1. InputField                                                              */
/* -------------------------------------------------------------------------- */

export interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    BaseFieldProps {
  leftIcon?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  hint,
  error,
  required,
  containerClassName = '',
  className = '',
  leftIcon,
  id,
  ...rest
}) => {
  const autoId = useId();
  const fieldId = id || autoId;

  return (
    <div className={containerClassName}>
      <FieldLabel htmlFor={fieldId} label={label} required={required} />
      <div className="relative">
        {leftIcon && (
          <span className="material-symbols-outlined text-[18px] text-text-muted pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
            {leftIcon}
          </span>
        )}
        <input
          id={fieldId}
          required={required}
          className={[
            CONTROL_BASE,
            'h-11',
            leftIcon ? 'pl-10 pr-3.5' : 'px-3.5',
            error ? CONTROL_ERROR : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />
      </div>
      <FieldFooter hint={hint} error={error} />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. PasswordField (with editorial show/hide toggle)                         */
/* -------------------------------------------------------------------------- */

export interface PasswordFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>,
    BaseFieldProps {}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  hint,
  error,
  required,
  containerClassName = '',
  className = '',
  id,
  ...rest
}) => {
  const autoId = useId();
  const fieldId = id || autoId;
  const [visible, setVisible] = useState(false);

  return (
    <div className={containerClassName}>
      <FieldLabel htmlFor={fieldId} label={label} required={required} />
      <div className="relative">
        <input
          id={fieldId}
          type={visible ? 'text' : 'password'}
          required={required}
          className={[
            CONTROL_BASE,
            'h-11 pl-3.5 pr-11',
            error ? CONTROL_ERROR : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Sembunyikan password' : 'Lihat password'}
          className="absolute inset-y-0 right-0 px-3.5 flex items-center text-text-muted hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">
            {visible ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>
      <FieldFooter hint={hint} error={error} />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. TextareaField                                                           */
/* -------------------------------------------------------------------------- */

export interface TextareaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseFieldProps {}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  hint,
  error,
  required,
  containerClassName = '',
  className = '',
  id,
  rows = 3,
  ...rest
}) => {
  const autoId = useId();
  const fieldId = id || autoId;

  return (
    <div className={containerClassName}>
      <FieldLabel htmlFor={fieldId} label={label} required={required} />
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        className={[CONTROL_BASE, 'p-3.5 leading-relaxed', error ? CONTROL_ERROR : '', className]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
      <FieldFooter hint={hint} error={error} />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. CustomSelect (Headless Editorial Dropdown — replaces native <select>)   */
/* -------------------------------------------------------------------------- */

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface CustomSelectProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  id?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  hint,
  error,
  required,
  containerClassName = '',
  value,
  onChange,
  options,
  placeholder = 'Pilih salah satu...',
  disabled = false,
  size = 'md',
  id,
}) => {
  const autoId = useId();
  const fieldId = id || autoId;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={`relative ${containerClassName}`} ref={rootRef}>
      <FieldLabel htmlFor={fieldId} label={label} required={required} />
      <button
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={[
          CONTROL_BASE,
          size === 'sm' ? 'h-9 px-3 text-xs' : 'h-11 px-3.5 text-body-sm',
          'flex items-center justify-between gap-2 text-left cursor-pointer',
          open ? 'border-primary ring-2 ring-primary/15' : '',
          error ? CONTROL_ERROR : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className={`truncate ${selectedOption ? 'text-primary' : 'text-text-muted/80'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span
          className={`material-symbols-outlined text-[18px] text-text-muted transition-transform duration-200 shrink-0 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 mt-1.5 z-50 bg-surface-card border border-border-ecru rounded-2xl shadow-xl py-1.5 max-h-64 overflow-y-auto animate-fade-in"
        >
          {options.length === 0 ? (
            <div className="px-3.5 py-2.5 text-xs text-text-muted">Tidak ada pilihan</div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-surface-sand text-primary font-medium'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block text-xs truncate">{opt.label}</span>
                    {opt.description && (
                      <span className="block text-[10px] text-text-muted truncate">
                        {opt.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">
                      check
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
      <FieldFooter hint={hint} error={error} />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. ColorPickerField (Editorial Swatches + Custom Circular Picker + Hex)    */
/* -------------------------------------------------------------------------- */

const EDITORIAL_COLOR_PRESETS = [
  { name: 'Obsidian', hex: '#1A1A1A' },
  { name: 'Natural Cream', hex: '#F5F2EB' },
  { name: 'Warm Sand', hex: '#D6C7B2' },
  { name: 'Terracotta', hex: '#855224' },
  { name: 'Olive', hex: '#4A5D4E' },
  { name: 'Midnight Navy', hex: '#1E293B' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Stone Grey', hex: '#6B665F' },
];

export interface ColorPickerFieldProps extends BaseFieldProps {
  value: string;
  onChange: (hex: string) => void;
  onPresetNameSelect?: (name: string) => void;
}

export const ColorPickerField: React.FC<ColorPickerFieldProps> = ({
  label = 'Warna',
  hint,
  error,
  required,
  containerClassName = '',
  value,
  onChange,
  onPresetNameSelect,
}) => {
  const autoId = useId();
  const normalizedHex = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#1A1A1A';

  return (
    <div className={containerClassName}>
      <FieldLabel htmlFor={autoId} label={label} required={required} />
      <div
        className={[
          CONTROL_BASE,
          'p-2.5 space-y-2.5',
          error ? CONTROL_ERROR : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Top Row: Circular Swatch Trigger + Editable Hex Text */}
        <div className="flex items-center gap-2.5">
          <label
            title="Pilih warna bebas"
            className="relative w-8 h-8 rounded-full border border-border-ecru shadow-xs overflow-hidden shrink-0 cursor-pointer ring-offset-1 hover:ring-2 hover:ring-primary/30 transition-all"
            style={{ backgroundColor: normalizedHex }}
          >
            <input
              type="color"
              value={normalizedHex}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
          </label>
          <input
            id={autoId}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            placeholder="#F5F2EB"
            maxLength={7}
            className="flex-1 min-w-0 h-8 px-2.5 rounded-lg bg-surface border border-border-ecru font-mono text-xs text-primary focus:outline-none focus:border-primary"
          />
        </div>

        {/* Preset Swatches */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {EDITORIAL_COLOR_PRESETS.map((preset) => {
            const active = normalizedHex.toUpperCase() === preset.hex.toUpperCase();
            return (
              <button
                key={preset.hex}
                type="button"
                title={preset.name}
                onClick={() => {
                  onChange(preset.hex);
                  onPresetNameSelect?.(preset.name);
                }}
                style={{ backgroundColor: preset.hex }}
                className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                  active
                    ? 'border-primary ring-2 ring-primary/30 scale-110'
                    : 'border-border-ecru hover:scale-105'
                }`}
              />
            );
          })}
        </div>
      </div>
      <FieldFooter hint={hint} error={error} />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 6. DatePickerField (Editorial Custom Date Trigger + Clearable)             */
/* -------------------------------------------------------------------------- */

export interface DatePickerFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  id?: string;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  hint,
  error,
  required,
  containerClassName = '',
  value,
  onChange,
  min,
  max,
  placeholder = 'Pilih tanggal...',
  id,
}) => {
  const autoId = useId();
  const fieldId = id || autoId;

  const formattedDisplay = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <div className={containerClassName}>
      <FieldLabel htmlFor={fieldId} label={label} required={required} />
      <div
        className={[
          CONTROL_BASE,
          'relative h-11 px-3.5 flex items-center justify-between gap-2',
          error ? CONTROL_ERROR : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">
            calendar_today
          </span>
          <span className={`text-xs truncate ${formattedDisplay ? 'text-primary' : 'text-text-muted/80'}`}>
            {formattedDisplay || placeholder}
          </span>
        </div>

        <input
          id={fieldId}
          type="date"
          value={value}
          min={min}
          max={max}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {value && !required && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            aria-label="Hapus tanggal"
            className="relative z-10 p-1 rounded-full text-text-muted hover:text-error hover:bg-surface-sand cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">close</span>
          </button>
        )}
      </div>
      <FieldFooter hint={hint} error={error} />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 7. CurrencyInputField (Auto Thousand Dot "." Formatting, Rp Prefix)        */
/* -------------------------------------------------------------------------- */

function formatDotGrouped(digitsOnly: string): string {
  if (!digitsOnly) return '';
  const strippedLeading = digitsOnly.replace(/^0+(?=\d)/, '');
  return strippedLeading.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export interface CurrencyInputFieldProps extends BaseFieldProps {
  value: number | string;
  onValueChange: (numericValue: number) => void;
  placeholder?: string;
  size?: 'sm' | 'md';
  id?: string;
  disabled?: boolean;
  className?: string;
}

export const CurrencyInputField: React.FC<CurrencyInputFieldProps> = ({
  label,
  hint,
  error,
  required,
  containerClassName = '',
  value,
  onValueChange,
  placeholder = '0',
  size = 'md',
  id,
  disabled = false,
  className = '',
}) => {
  const autoId = useId();
  const fieldId = id || autoId;

  const rawDigits =
    typeof value === 'number'
      ? value > 0
        ? String(Math.round(value))
        : value === 0
        ? '0'
        : ''
      : String(value).replace(/\D/g, '');

  const displayValue = rawDigits === '' ? '' : formatDotGrouped(rawDigits);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextDigits = e.target.value.replace(/\D/g, '');
    if (!nextDigits) {
      onValueChange(0);
      return;
    }
    onValueChange(Number(nextDigits));
  };

  return (
    <div className={containerClassName}>
      <FieldLabel htmlFor={fieldId} label={label} required={required} />
      <div className="relative">
        <span
          className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-medium text-text-muted ${
            size === 'sm' ? 'text-[11px]' : 'text-xs'
          }`}
        >
          Rp
        </span>
        <input
          id={fieldId}
          type="text"
          inputMode="numeric"
          required={required}
          disabled={disabled}
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={[
            CONTROL_BASE,
            size === 'sm' ? 'h-9 pl-9 pr-3 text-xs' : 'h-11 pl-10 pr-3.5',
            'tabular-nums font-medium',
            error ? CONTROL_ERROR : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        />
      </div>
      <FieldFooter hint={hint} error={error} />
    </div>
  );
};
