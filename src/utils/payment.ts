import type { OrderRecord, OrderStatusType } from '../services/supabaseService';

export const INDO_PROVINCES = [
  'DKI Jakarta',
  'Jawa Barat',
  'Banten',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Bali',
  'Sumatera Utara',
  'Sumatera Barat',
  'Sumatera Selatan',
  'Riau',
  'Kepulauan Riau',
  'Lampung',
  'Kalimantan Barat',
  'Kalimantan Timur',
  'Kalimantan Selatan',
  'Sulawesi Selatan',
  'Sulawesi Utara',
];

export const EXPEDITION_OPTIONS = [
  'JNE',
  'J&T Express',
  'SiCepat',
  'AnterAja',
  'Paxel',
  'GoSend',
  'GrabExpress',
  'Lion Parcel',
  'Pos Indonesia',
  'Lainnya',
];

export const ORDER_STATUS_OPTIONS_ID: { value: OrderStatusType; label: string }[] = [
  { value: 'pending', label: 'Menunggu Pembayaran' },
  { value: 'waiting_verification', label: 'Menunggu Verifikasi' },
  { value: 'paid', label: 'Lunas' },
  { value: 'packed', label: 'Sedang Dikemas' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'delivered', label: 'Pesanan Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
  { value: 'expired', label: 'Kedaluwarsa' },
];

export const MAYAR_SUPPORTED_CHANNELS = [
  'QRIS (GoPay, OVO, DANA, ShopeePay, Mobile Banking)',
  'Virtual Account (BCA, Mandiri, BNI, BRI, Permata)',
  'E-Wallet & Kartu Kredit / Debit',
  'Minimarket (Alfamart / Indomaret)',
];

export function formatCourierLabel(courier?: string): string {
  if (courier === 'free') return 'GRATIS ONGKIR';
  return (courier || 'reguler').toUpperCase();
}

export function formatPaymentMethodLabel(
  paymentMethod?: string,
  mayarPaymentMethod?: string | null
): string {
  if (mayarPaymentMethod && mayarPaymentMethod.trim()) {
    return `Mayar.id (${mayarPaymentMethod.trim()})`;
  }
  if (!paymentMethod || paymentMethod === 'Mayar Payment Gateway') {
    return 'Mayar.id Payment Gateway';
  }
  return paymentMethod;
}

export function getRemainingSeconds(expiresAt?: string): number {
  if (!expiresAt) return 0;
  const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
  return Math.max(0, diff);
}

export function formatCountdown(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function isOrderPaymentExpired(order: Pick<OrderRecord, 'status' | 'paymentExpiresAt'>): boolean {
  if (order.status === 'expired') return true;
  if (order.status !== 'pending' || typeof order.paymentExpiresAt !== 'string') return false;
  return new Date(order.paymentExpiresAt).getTime() <= Date.now();
}

export function getOrderStatusLabel(status?: OrderStatusType, isExpired?: boolean): string {
  if (isExpired && status === 'pending') return 'Kedaluwarsa';
  const found = ORDER_STATUS_OPTIONS_ID.find((item) => item.value === status);
  return found ? found.label : 'Menunggu Pembayaran';
}

export function getOrderStatusBadge(
  status?: OrderStatusType,
  isExpired?: boolean
): { label: string; cls: string } {
  if (isExpired && status === 'pending') {
    return { label: 'Kedaluwarsa', cls: 'bg-error-container text-error' };
  }
  switch (status) {
    case 'paid':
      return { label: 'Lunas', cls: 'bg-status-stock text-white' };
    case 'packed':
      return { label: 'Sedang Dikemas', cls: 'bg-[#EDE6D8] text-[#5C4326]' };
    case 'shipped':
      return { label: 'Dikirim', cls: 'bg-[#E3ECF7] text-[#1D4ED8]' };
    case 'delivered':
      return { label: 'Pesanan Selesai', cls: 'bg-status-stock text-white' };
    case 'waiting_verification':
      return { label: 'Menunggu Verifikasi', cls: 'bg-secondary text-on-secondary' };
    case 'expired':
      return { label: 'Kedaluwarsa', cls: 'bg-error-container text-error' };
    case 'cancelled':
      return { label: 'Dibatalkan', cls: 'bg-error-container text-error' };
    default:
      return { label: 'Menunggu Pembayaran', cls: 'bg-surface-container-highest text-primary' };
  }
}

export function getInvoiceStamp(order: OrderRecord): {
  label: string;
  isPaid: boolean;
  colorHex: string;
  bgHex: string;
} {
  const status = order.status;
  const expired = isOrderPaymentExpired(order);

  if (status === 'paid' || status === 'packed' || status === 'shipped' || status === 'delivered') {
    return { label: 'LUNAS', isPaid: true, colorHex: '#2D5A3D', bgHex: '#EAF4ED' };
  }
  if (status === 'waiting_verification') {
    return {
      label: 'BELUM LUNAS (MENUNGGU VERIFIKASI)',
      isPaid: false,
      colorHex: '#855224',
      bgHex: '#FFF4EB',
    };
  }
  if (expired) {
    return {
      label: 'BELUM LUNAS (KEDALUWARSA)',
      isPaid: false,
      colorHex: '#BA1A1A',
      bgHex: '#FFDAD6',
    };
  }
  if (status === 'cancelled') {
    return {
      label: 'DIBATALKAN',
      isPaid: false,
      colorHex: '#BA1A1A',
      bgHex: '#FFDAD6',
    };
  }
  return {
    label: 'BELUM LUNAS',
    isPaid: false,
    colorHex: '#BA1A1A',
    bgHex: '#FFDAD6',
  };
}
