import React from 'react';
import { Link } from 'react-router-dom';
import { getButtonClassName } from './ui';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const msg =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Terjadi kesalahan tak terduga saat memuat halaman.';
    return { hasError: true, message: msg };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-surface-card border border-border-ecru rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <span className="material-symbols-outlined text-[40px] text-error block">error</span>
            <h1 className="font-headline-sm text-xl text-primary">Halaman Mengalami Kendala</h1>
            <p className="font-body-sm text-xs text-text-muted leading-relaxed">
              {this.state.message}
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className={getButtonClassName({ variant: 'primary', size: 'sm' })}
              >
                Muat Ulang Halaman
              </button>
              <Link
                to="/"
                onClick={() => this.setState({ hasError: false, message: '' })}
                className={getButtonClassName({ variant: 'outline', size: 'sm' })}
              >
                Ke Beranda
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
