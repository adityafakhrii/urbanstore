import React, { useState, useEffect } from 'react';
import { Product } from '../data/products';
import { handleImageError, useModalEffects } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import {
  validatePromoInDb,
  placeOrderInDb,
  uploadPaymentProofImage,
  submitPaymentProofInDb,
  formatRupiah,
  OrderStatusType,
} from '../services/supabaseService';
import { MAX_IMAGE_SIZE_BYTES, formatBytes } from '../utils/image';
import { InvoiceModal } from './InvoiceModal';

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

export interface OrderItemSummary {
  productName: string;
  productSku: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderRecord {
  id: string;
  dbId?: string;
  createdAt: string;
  fullName: string;
  email?: string;
  whatsapp: string;
  province?: string;
  city: string;
  district?: string;
  address: string;
  postalCode?: string;
  deliveryNotes?: string;
  courier: 'reguler' | 'sameday' | 'instant';
  paymentMethod: 'QRIS' | 'BCA Virtual Account' | 'Mandiri' | 'Visa / Mastercard';
  subtotal?: number;
  discount?: number;
  shippingCost?: number;
  total: number;
  itemsCount: number;
  status?: OrderStatusType;
  trackingNumber?: string;
  paymentProofUrl?: string;
  paymentExpiresAt?: string;
  paidAt?: string;
  items?: OrderItemSummary[];
}

const INDO_PROVINCES = [
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

const PAYMENT_ACCOUNTS: Record<
  OrderRecord['paymentMethod'],
  { bank: string; accountNumber: string; accountHolder: string; note: string }
> = {
  'BCA Virtual Account': {
    bank: 'Bank BCA',
    accountNumber: '522088914401',
    accountHolder: 'PT UrbanStore Atelier Indonesia',
    note: 'Transfer sesuai nominal tepat hingga digit terakhir via m-BCA / KlikBCA / ATM.',
  },
  Mandiri: {
    bank: 'Bank Mandiri',
    accountNumber: '1240009811223',
    accountHolder: 'PT UrbanStore Atelier Indonesia',
    note: 'Transfer via Livin by Mandiri atau ATM Bersama sebelum batas waktu berakhir.',
  },
  QRIS: {
    bank: 'QRIS UrbanStore Official',
    accountNumber: 'ID10293847561',
    accountHolder: 'UrbanStore Atelier Jakarta',
    note: 'Bayar melalui GoPay, OVO, DANA, ShopeePay, atau Mobile Banking berlogo QRIS.',
  },
  'Visa / Mastercard': {
    bank: 'Transfer Konfirmasi Manual / BCA',
    accountNumber: '522088914401',
    accountHolder: 'PT UrbanStore Atelier Indonesia',
    note: 'Sementara dapat melakukan transfer konfirmasi ke rekening resmi UrbanStore di atas.',
  },
};

function getRemainingSeconds(expiresAt?: string): number {
  if (!expiresAt) return 0;
  const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
  return Math.max(0, diff);
}

function formatCountdown(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getOrderStatusBadge(status?: OrderStatusType, isExpired?: boolean) {
  if (isExpired && status === 'pending') {
    return { label: 'KEDALUWARSA', cls: 'bg-error-container text-error' };
  }
  switch (status) {
    case 'paid':
    case 'packed':
    case 'shipped':
    case 'delivered':
      return { label: 'LUNAS', cls: 'bg-status-stock text-white' };
    case 'waiting_verification':
      return { label: 'MENUNGGU VERIFIKASI ADMIN', cls: 'bg-secondary text-on-secondary' };
    case 'expired':
      return { label: 'KEDALUWARSA', cls: 'bg-error-container text-error' };
    case 'cancelled':
      return { label: 'DIBATALKAN', cls: 'bg-error-container text-error' };
    default:
      return { label: 'BELUM LUNAS', cls: 'bg-surface-container-highest text-primary' };
  }
}

interface CartAndCheckoutModalProps {
  isOpen: boolean;
  initialMode: 'bag' | 'checkout' | 'orders';
  useSupabaseDb: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  orders: OrderRecord[];
  onUpdateQuantity: (productId: string, size: string, color: string, delta: number) => void;
  onRemoveItem: (productId: string, size: string, color: string) => void;
  onClearCart: () => void;
  onOrderComplete: (order: OrderRecord) => void;
  onOrderUpdated?: (order: OrderRecord) => void;
  onExploreCatalog: () => void;
}

export const CartAndCheckoutModal: React.FC<CartAndCheckoutModalProps> = ({
  isOpen,
  initialMode,
  useSupabaseDb,
  onClose,
  cartItems,
  orders,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderComplete,
  onOrderUpdated,
  onExploreCatalog,
}) => {
  const { profile, user } = useAuth();
  const [mode, setMode] = useState<'bag' | 'checkout' | 'confirmation' | 'orders'>(initialMode);
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; amount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Checkout Form State
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [province, setProvince] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [courier, setCourier] = useState<'reguler' | 'sameday' | 'instant'>('reguler');
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'BCA Virtual Account' | 'Mandiri' | 'Visa / Mastercard'>('BCA Virtual Account');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Payment countdown & proof upload state
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState<boolean>(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofCompressionInfo, setProofCompressionInfo] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setCheckoutError(null);
      setProofError(null);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen || (mode !== 'confirmation' && mode !== 'orders')) return;
    const timer = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen || !profile) return;
    if (!fullName && profile.full_name) setFullName(profile.full_name);
    if (!email && (profile.email || user?.email)) setEmail(profile.email || user?.email || '');
    if (!whatsapp && profile.whatsapp) setWhatsapp(profile.whatsapp);
    if (!province && profile.default_province) setProvince(profile.default_province);
    if (!city && profile.default_city) setCity(profile.default_city);
    if (!district && profile.default_district) setDistrict(profile.default_district);
    if (!address && profile.default_address) setAddress(profile.default_address);
    if (!postalCode && profile.default_postal_code) setPostalCode(profile.default_postal_code);
  }, [isOpen, profile, user, fullName, email, whatsapp, province, city, district, address, postalCode]);

  useModalEffects(isOpen, onClose);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discount = promoApplied ? promoApplied.amount : 0;
  const shippingCost =
    subtotal === 0
      ? 0
      : courier === 'instant'
      ? 35000
      : courier === 'sameday'
      ? 20000
      : subtotal >= 500000
      ? 0
      : 18000;
  const grandTotal = Math.max(0, subtotal - discount + shippingCost);

  const handleCopyText = (label: string, text: string) => {
    if (!navigator.clipboard) return;
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedField(label);
      window.setTimeout(() => setCopiedField((prev) => (prev === label ? null : prev)), 2000);
    });
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !confirmedOrder) return;

    if (!file.type.startsWith('image/')) {
      setProofError('File bukti transfer harus berupa gambar.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setProofError('Ukuran gambar maksimal 5 MB.');
      return;
    }

    setProofError(null);
    setUploadingProof(true);
    const uploadRes = await uploadPaymentProofImage(file);

    if (uploadRes.error || !uploadRes.url) {
      setUploadingProof(false);
      setProofError(uploadRes.error || 'Gagal mengunggah bukti transfer.');
      return;
    }

    if (uploadRes.originalBytes && uploadRes.compressedBytes) {
      setProofCompressionInfo(
        `WebP terkompresi: ${formatBytes(uploadRes.originalBytes)} → ${formatBytes(uploadRes.compressedBytes)}`
      );
    }

    if (useSupabaseDb && confirmedOrder.dbId) {
      const rpcRes = await submitPaymentProofInDb(confirmedOrder.dbId, uploadRes.url);
      setUploadingProof(false);
      if (rpcRes.error) {
        setProofError(rpcRes.error);
        return;
      }
      const updated: OrderRecord = {
        ...confirmedOrder,
        paymentProofUrl: rpcRes.paymentProofUrl || uploadRes.url,
        status: rpcRes.status || 'waiting_verification',
      };
      setConfirmedOrder(updated);
      onOrderUpdated?.(updated);
      return;
    }

    setUploadingProof(false);
    const updated: OrderRecord = {
      ...confirmedOrder,
      paymentProofUrl: uploadRes.url,
      status: 'waiting_verification',
    };
    setConfirmedOrder(updated);
    onOrderUpdated?.(updated);
  };

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = promoCode.trim().toUpperCase();
    if (!cleaned) return;

    if (useSupabaseDb) {
      const res = await validatePromoInDb(cleaned, subtotal);
      if (res.valid && res.code && res.discountAmount) {
        setPromoApplied({ code: res.code, amount: res.discountAmount });
        setPromoError(null);
      } else {
        setPromoApplied(null);
        setPromoError(res.message || 'Kode promo ini nggak valid atau udah lewat masanya.');
      }
      return;
    }

    if (['ANTIZONK', 'URBAN10', 'DROP01', 'HEMAT50'].includes(cleaned)) {
      setPromoApplied({ code: cleaned, amount: 50000 });
      setPromoError(null);
    } else {
      setPromoApplied(null);
      setPromoError('Kode promo ini nggak valid atau udah lewat masanya.');
    }
  };

  const handleCompleteCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0 || submitting) return;

    const digitsOnly = whatsapp.replace(/\D/g, '');
    const isValidWhatsapp =
      digitsOnly.length >= 9 &&
      digitsOnly.length <= 15 &&
      (digitsOnly.startsWith('08') || digitsOnly.startsWith('62'));

    if (!isValidWhatsapp) {
      setWhatsappError('Masukin nomor WhatsApp yang aktif ya (diawali 08 atau 62).');
      return;
    }

    setWhatsappError(null);
    setCheckoutError(null);
    setProofCompressionInfo(null);
    setProofError(null);

    if (useSupabaseDb) {
      setSubmitting(true);
      const res = await placeOrderInDb({
        fullName: fullName.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim(),
        province: province.trim(),
        city: city.trim(),
        district: district.trim(),
        address: address.trim(),
        postalCode: postalCode.trim(),
        deliveryNotes: deliveryNotes.trim(),
        courier,
        paymentMethod,
        promoCode: promoApplied?.code ?? null,
        items: cartItems,
      });
      setSubmitting(false);

      if (res.error || !res.order) {
        setCheckoutError(res.error || 'Jaringan lagi ngadat nih. Santai, klik coba lagi ya.');
        return;
      }

      setConfirmedOrder(res.order);
      onOrderComplete(res.order);
      setPromoCode('');
      setPromoApplied(null);
      setPromoError(null);
      setMode('confirmation');
      onClearCart();
      return;
    }

    const expiresAtIso = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const newOrder: OrderRecord = {
      id: `US-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      fullName: fullName.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      province: province.trim(),
      city: city.trim(),
      district: district.trim(),
      address: address.trim(),
      postalCode: postalCode.trim(),
      deliveryNotes: deliveryNotes.trim(),
      courier,
      paymentMethod,
      subtotal,
      discount,
      shippingCost,
      total: grandTotal,
      itemsCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      status: 'pending',
      paymentExpiresAt: expiresAtIso,
      items: cartItems.map((item) => ({
        productName: item.product.name,
        productSku: item.product.sku,
        size: item.size,
        color: item.color,
        unitPrice: item.product.price,
        quantity: item.quantity,
        lineTotal: item.product.price * item.quantity,
      })),
    };

    setConfirmedOrder(newOrder);
    onOrderComplete(newOrder);
    setPromoCode('');
    setPromoApplied(null);
    setPromoError(null);
    setMode('confirmation');
    onClearCart();
  };

  return (
    <div aria-modal="true" className="fixed inset-0 z-50" role="dialog">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1A1A1A]/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div
          className={`w-screen ${
            mode === 'checkout' ? 'max-w-2xl' : 'max-w-md'
          } bg-surface-card border-l border-border-ecru flex flex-col justify-between overflow-y-auto z-10 transition-all duration-300`}
        >
          {/* Top Drawer Header */}
          <div className="p-6 border-b border-border-ecru flex items-center justify-between sticky top-0 bg-surface-card z-20">
            <div>
              <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block">
                {mode === 'bag'
                  ? 'URBANSTORE SHOPPING BAG'
                  : mode === 'checkout'
                  ? 'CHECKOUT SAT-SET NO DRAMA'
                  : mode === 'orders'
                  ? 'RIWAYAT PESANAN'
                  : 'ORDER CONFIRMED'}
              </span>
              <h3 className="font-headline-sm text-headline-sm text-primary">
                {mode === 'bag'
                  ? `Shopping Bag (${cartItems.reduce((a, b) => a + b.quantity, 0)})`
                  : mode === 'checkout'
                  ? 'Rincian Pengiriman & Pembayaran'
                  : mode === 'orders'
                  ? `Pesanan Kamu (${orders.length})`
                  : 'Done! Orderan kamu udah kami terima.'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup panel"
              className="p-1.5 text-on-surface hover:text-secondary cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* BODY CONTENT */}
          <div className="p-6 flex-1 overflow-y-auto">
            {mode === 'bag' && (
              <>
                {cartItems.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-14 h-14 rounded-full bg-surface-sand border border-border-ecru flex items-center justify-center mx-auto mb-4 text-text-muted">
                      <span className="material-symbols-outlined text-[26px]">shopping_bag</span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-primary mb-2">
                      Bag kamu masih sepi nih. Yuk cari fit baru dulu!
                    </h4>
                    <p className="font-body-sm text-body-sm text-text-muted mb-6 max-w-xs mx-auto">
                      Kurasi mingguan kami siap di-mix-and-match dengan garansi tuker size 30 hari.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onExploreCatalog();
                      }}
                      className="px-8 py-3 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-wider rounded-DEFAULT hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      Cari Outfit Dulu
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Free shipping bar */}
                    <div className="p-3 bg-[#FCEAE6] border border-border-ecru rounded-DEFAULT text-xs font-body-sm text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-status-stock">verified</span>
                      {subtotal >= 500000 ? (
                        <span>
                          Mantap! Kamu dapet <strong>Gratis Ongkir</strong> + garansi tuker size 30 hari.
                        </span>
                      ) : (
                        <span>
                          Tambah <strong>{formatRupiah(500000 - subtotal)}</strong> lagi buat klaim{' '}
                          <strong>Gratis Ongkir</strong>!
                        </span>
                      )}
                    </div>

                    {/* Itemized list */}
                    <div className="divide-y divide-border-ecru">
                      {cartItems.map((item) => (
                        <div key={`${item.product.id}-${item.size}-${item.color}`} className="py-4 flex gap-4">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            onError={handleImageError}
                            className="w-20 h-26 object-cover object-top bg-surface-container-low border border-border-ecru shrink-0"
                          />
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-body-md text-body-md font-medium text-primary">
                                  {item.product.name}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => onRemoveItem(item.product.id, item.size, item.color)}
                                  className="text-text-muted hover:text-error cursor-pointer"
                                  title="Hapus"
                                  aria-label={`Hapus ${item.product.name}`}
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
                              <p className="font-body-sm text-xs text-text-muted mt-0.5">
                                Size: <strong className="text-primary">{item.size}</strong> · {item.color}
                              </p>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              {/* Quantity Stepper (- 1 +) */}
                              <div className="inline-flex items-center border border-border-ecru bg-surface-card">
                                <button
                                  type="button"
                                  aria-label="Kurangi jumlah"
                                  onClick={() => onUpdateQuantity(item.product.id, item.size, item.color, -1)}
                                  className="w-7 h-7 flex items-center justify-center text-primary hover:bg-surface-container cursor-pointer"
                                >
                                  −
                                </button>
                                <span className="w-8 text-center font-body-sm text-xs font-medium tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  aria-label="Tambah jumlah"
                                  onClick={() => onUpdateQuantity(item.product.id, item.size, item.color, 1)}
                                  className="w-7 h-7 flex items-center justify-center text-primary hover:bg-surface-container cursor-pointer"
                                >
                                  +
                                </button>
                              </div>

                              <span className="font-price-md text-price-md text-primary tabular-nums">
                                {formatRupiah(item.product.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Promo Code Input */}
                    <form onSubmit={handleApplyPromo} className="pt-2">
                      <label className="block font-body-sm text-xs text-text-muted mb-1.5">
                        Punya kode promo? Masukin sini (Coba: <span className="font-mono text-primary">ANTIZONK</span>)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="Ketik kode voucher..."
                          className="flex-1 bg-surface-card border border-border-ecru px-3 py-2 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 border border-primary text-primary font-label-uppercase text-[11px] uppercase tracking-wider hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"
                        >
                          Pakai
                        </button>
                      </div>
                      {promoError && <p className="text-error text-xs mt-1.5">{promoError}</p>}
                      {promoApplied && (
                        <p className="text-status-stock text-xs mt-1.5 font-medium">
                          ✓ Kode {promoApplied.code} aktif! Potongan {formatRupiah(promoApplied.amount)} otomatis kepasang.
                        </p>
                      )}
                    </form>

                    {/* Order Summary Box Warm Sand (#F5F2EB) */}
                    <div className="p-5 bg-surface-sand border border-border-ecru rounded-DEFAULT space-y-2.5 text-body-sm">
                      <div className="flex justify-between text-text-muted">
                        <span>Subtotal ({cartItems.reduce((a, b) => a + b.quantity, 0)} item)</span>
                        <span className="tabular-nums text-primary">{formatRupiah(subtotal)}</span>
                      </div>
                      {promoApplied && (
                        <div className="flex justify-between text-status-stock">
                          <span>Potongan Promo ({promoApplied.code})</span>
                          <span className="tabular-nums">- {formatRupiah(promoApplied.amount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-text-muted">
                        <span>Estimasi Ongkir</span>
                        <span className="tabular-nums text-status-stock font-medium">
                          {shippingCost === 0 ? 'GRATIS' : formatRupiah(shippingCost)}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-border-ecru flex justify-between items-baseline">
                        <span className="font-label-uppercase text-label-uppercase uppercase text-primary">
                          Total Bayar
                        </span>
                        <span className="font-price-lg text-price-lg text-primary tabular-nums">
                          {formatRupiah(grandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {mode === 'checkout' && (
              <form id="checkout-form" onSubmit={handleCompleteCheckout} className="space-y-6">
                {/* 4-Step Visual Stepper */}
                <div className="p-3 bg-surface-sand border border-border-ecru rounded-DEFAULT font-label-uppercase text-[10px] tracking-wider uppercase text-primary flex flex-wrap items-center justify-between gap-2">
                  <span>❶ Info Kamu</span>
                  <span className="text-text-muted">·</span>
                  <span>❷ Kirim ke Mana</span>
                  <span className="text-text-muted">·</span>
                  <span>❸ Mau Pake Kurir Apa</span>
                  <span className="text-text-muted">·</span>
                  <span>❹ Bayar Sat-Set</span>
                </div>

                {/* Step 1: Info Kamu */}
                <div className="space-y-3 border-b border-border-ecru pb-6">
                  <h4 className="font-label-uppercase text-label-uppercase uppercase text-primary">
                    ❶ Info Kamu (Kontak Penerima)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-body-sm text-xs text-text-muted mb-1">Nama Lengkap</label>
                      <input
                        required
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nama lengkap penerima"
                        className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                      />
                    </div>
                    <div>
                      <label className="block font-body-sm text-xs text-text-muted mb-1">Email Nota &amp; Resi</label>
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-body-sm text-xs text-text-muted mb-1">Nomor WhatsApp Aktif</label>
                    <input
                      required
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => {
                        setWhatsapp(e.target.value);
                        setWhatsappError(null);
                      }}
                      placeholder="0812xxxxxxxx"
                      className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                    />
                    {whatsappError && <p className="text-error text-xs mt-1">{whatsappError}</p>}
                  </div>
                </div>

                {/* Step 2: Kirim ke Mana */}
                <div className="space-y-3 border-b border-border-ecru pb-6">
                  <h4 className="font-label-uppercase text-label-uppercase uppercase text-primary">
                    ❷ Kirim ke Mana (Alamat Lengkap)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-body-sm text-xs text-text-muted mb-1">Provinsi</label>
                      <input
                        required
                        type="text"
                        list="indo-provinces"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        placeholder="DKI Jakarta"
                        className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                      />
                      <datalist id="indo-provinces">
                        {INDO_PROVINCES.map((prov) => (
                          <option key={prov} value={prov} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block font-body-sm text-xs text-text-muted mb-1">Kota / Kabupaten</label>
                      <input
                        required
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Jakarta Selatan"
                        className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-body-sm text-xs text-text-muted mb-1">Kecamatan</label>
                      <input
                        required
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="Kebayoran Baru"
                        className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                      />
                    </div>
                    <div>
                      <label className="block font-body-sm text-xs text-text-muted mb-1">Kode Pos</label>
                      <input
                        required
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="12190"
                        className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-body-sm text-xs text-text-muted mb-1">Alamat Lengkap (Jalan, No. Rumah, Patokan)</label>
                    <input
                      required
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Contoh: Jl. Senopati No. 14, RT 02/03, Samping Cafe"
                      className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                    />
                  </div>
                  <div>
                    <label className="block font-body-sm text-xs text-text-muted mb-1">Catatan Pengiriman (Opsional)</label>
                    <textarea
                      rows={2}
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Contoh: Titip di pos satpam / hubungi WA sebelum kurir sampai"
                      className="w-full bg-surface-card border border-border-ecru p-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                    />
                  </div>
                </div>

                {/* Step 3: Mau Pake Kurir Apa */}
                <div className="space-y-3 border-b border-border-ecru pb-6">
                  <h4 className="font-label-uppercase text-label-uppercase uppercase text-primary">
                    ❸ Mau Pake Kurir Apa
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: 'reguler' as const,
                        name: 'Reguler Express',
                        eta: '1-2 Hari Sampai',
                        priceLabel: subtotal >= 500000 ? 'GRATIS' : 'Rp 18.000',
                      },
                      {
                        id: 'sameday' as const,
                        name: 'Sameday Kurir',
                        eta: '6-8 Jam Sampai',
                        priceLabel: 'Rp 20.000',
                      },
                      {
                        id: 'instant' as const,
                        name: 'Instant Sat-Set',
                        eta: 'Maks. 2 Jam',
                        priceLabel: 'Rp 35.000',
                      },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCourier(c.id)}
                        className={`p-3 border text-left rounded-DEFAULT transition-colors cursor-pointer ${
                          courier === c.id
                            ? 'border-primary bg-surface-sand'
                            : 'border-border-ecru bg-surface-card hover:border-primary'
                        }`}
                      >
                        <div className="font-body-sm text-xs font-semibold text-primary">{c.name}</div>
                        <div className="font-body-sm text-[11px] text-text-muted">{c.eta}</div>
                        <div className="font-label-uppercase text-[11px] text-secondary mt-1">{c.priceLabel}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 4: Bayar Sat-Set */}
                <div className="space-y-3">
                  <h4 className="font-label-uppercase text-label-uppercase uppercase text-primary">
                    ❹ Bayar Sat-Set (Bebas Biaya Admin Gaib)
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['QRIS', 'BCA Virtual Account', 'Mandiri', 'Visa / Mastercard'] as const).map((pm) => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setPaymentMethod(pm)}
                        className={`p-3 border text-left rounded-DEFAULT transition-colors cursor-pointer flex items-center justify-between ${
                          paymentMethod === pm
                            ? 'border-primary bg-surface-sand font-medium'
                            : 'border-border-ecru bg-surface-card hover:border-primary'
                        }`}
                      >
                        <span className="font-body-sm text-xs text-primary">{pm}</span>
                        {paymentMethod === pm && (
                          <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Warm Sand Summary Card */}
                <div className="p-5 bg-surface-sand border border-border-ecru rounded-DEFAULT space-y-2 text-body-sm">
                  <div className="flex justify-between text-text-muted">
                    <span>Subtotal Outfit</span>
                    <span className="tabular-nums text-primary">{formatRupiah(subtotal)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-status-stock">
                      <span>Kode Promo ({promoApplied.code})</span>
                      <span className="tabular-nums">- {formatRupiah(promoApplied.amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-text-muted">
                    <span>Ongkos Kirim ({courier.toUpperCase()})</span>
                    <span className="tabular-nums text-primary">
                      {shippingCost === 0 ? 'GRATIS' : formatRupiah(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Biaya Layanan / Admin</span>
                    <span className="tabular-nums text-status-stock">Rp 0 (Bebas Drama)</span>
                  </div>
                    <div className="pt-3 border-t border-border-ecru flex justify-between items-baseline">
                    <span className="font-label-uppercase text-label-uppercase uppercase text-primary">
                      Total Tagihan
                    </span>
                    <span className="font-price-lg text-price-lg text-primary tabular-nums">
                      {formatRupiah(grandTotal)}
                    </span>
                  </div>
                </div>
                {checkoutError && (
                  <div className="p-3 bg-error-container/60 border border-error/30 text-error text-xs">
                    {checkoutError}
                  </div>
                )}
              </form>
            )}

            {mode === 'confirmation' && confirmedOrder && (() => {
              void nowTick;
              const paymentAccount = PAYMENT_ACCOUNTS[confirmedOrder.paymentMethod];
              const remainingSec = getRemainingSeconds(confirmedOrder.paymentExpiresAt);
              const isExpired =
                Boolean(confirmedOrder.paymentExpiresAt) &&
                remainingSec === 0 &&
                confirmedOrder.status === 'pending';
              const badge = getOrderStatusBadge(confirmedOrder.status, isExpired);
              const canUploadProof =
                !isExpired &&
                (confirmedOrder.status === 'pending' ||
                  confirmedOrder.status === 'waiting_verification' ||
                  !confirmedOrder.status);

              return (
                <div className="py-4 space-y-5">
                  {/* Order Created & Payment Status */}
                  <div className="p-5 bg-surface-sand border border-border-ecru text-center">
                    <div className="w-11 h-11 rounded-full bg-status-stock text-white flex items-center justify-center mx-auto mb-3">
                      <span className="material-symbols-outlined text-[22px]">check</span>
                    </div>
                    <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
                      NO. ORDER #{confirmedOrder.id}
                    </span>
                    <h4 className="font-headline-sm text-headline-sm text-primary mb-2">
                      Pesanan Berhasil Dibuat!
                    </h4>
                    <span
                      className={`inline-block px-3 py-1 font-label-uppercase text-[10px] tracking-widest uppercase ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* 1-Hour Live Countdown Timer */}
                  {(confirmedOrder.status === 'pending' || confirmedOrder.status === 'waiting_verification') &&
                    confirmedOrder.paymentExpiresAt && (
                      <div
                        className={`p-4 border text-center ${
                          isExpired
                            ? 'bg-error-container/50 border-error/40 text-error'
                            : 'bg-[#FCEAE6] border-border-ecru text-primary'
                        }`}
                      >
                        <span className="font-label-uppercase text-[10px] uppercase tracking-widest block mb-1">
                          {isExpired ? 'BATAS WAKTU PEMBAYARAN HABIS' : 'SISA WAKTU PEMBAYARAN (1 JAM)'}
                        </span>
                        <div className="font-headline-lg text-[32px] leading-none tabular-nums font-semibold">
                          {formatCountdown(remainingSec)}
                        </div>
                        <p className="text-[11px] text-text-muted mt-1.5">
                          Batas bayar:{' '}
                          <strong>
                            {new Date(confirmedOrder.paymentExpiresAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            WIB
                          </strong>
                        </p>
                      </div>
                    )}

                  {/* Bank / Transfer Info */}
                  <div className="p-4 bg-surface-card border border-border-ecru space-y-3 text-body-sm">
                    <div className="flex items-center justify-between border-b border-border-ecru pb-2">
                      <span className="font-label-uppercase text-[10px] uppercase tracking-wider text-secondary">
                        INFO REKENING &amp; TRANSFER
                      </span>
                      <span className="font-semibold text-xs text-primary">{paymentAccount.bank}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] text-text-muted">Nomor Rekening / ID</div>
                        <div className="font-mono text-sm font-semibold text-primary">
                          {paymentAccount.accountNumber}
                        </div>
                        <div className="text-[11px] text-text-muted">a.n. {paymentAccount.accountHolder}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText('rekening', paymentAccount.accountNumber)}
                        className="px-3 py-1.5 border border-primary text-primary font-label-uppercase text-[10px] uppercase cursor-pointer hover:bg-primary hover:text-on-primary transition-colors"
                      >
                        {copiedField === 'rekening' ? 'Tersalin ✓' : 'Salin'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-ecru">
                      <div>
                        <div className="text-[11px] text-text-muted">Total Transfer</div>
                        <div className="font-price-md text-price-md text-primary tabular-nums">
                          {formatRupiah(confirmedOrder.total)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText('nominal', String(confirmedOrder.total))}
                        className="px-3 py-1.5 border border-border-ecru text-primary font-label-uppercase text-[10px] uppercase cursor-pointer hover:border-primary"
                      >
                        {copiedField === 'nominal' ? 'Tersalin ✓' : 'Salin Nominal'}
                      </button>
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed">{paymentAccount.note}</p>
                  </div>

                  {/* Payment Proof Upload Form (Auto WebP Compressed) */}
                  <div className="p-4 bg-surface-sand border border-border-ecru space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-label-uppercase text-[10px] uppercase tracking-wider text-primary font-semibold">
                        UPLOAD BUKTI TRANSFER (AUTO WEBP · MAKS 5MB)
                      </span>
                    </div>

                    {confirmedOrder.paymentProofUrl && (
                      <div className="p-3 bg-surface-card border border-status-stock/40 flex items-center gap-3">
                        <img
                          src={confirmedOrder.paymentProofUrl}
                          alt="Bukti Transfer"
                          className="w-14 h-16 object-cover border border-border-ecru shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-status-stock">Bukti transfer terkirim!</div>
                          <p className="text-[11px] text-text-muted">
                            {confirmedOrder.status === 'paid'
                              ? 'Pembayaran telah dikonfirmasi LUNAS oleh Admin.'
                              : 'Menunggu konfirmasi Admin UrbanStore.'}
                          </p>
                          {proofCompressionInfo && (
                            <p className="text-[10px] text-status-stock mt-0.5">{proofCompressionInfo}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {canUploadProof && (
                      <label className="w-full h-11 border border-dashed border-primary bg-surface-card text-primary flex items-center justify-center gap-2 font-label-uppercase text-[11px] uppercase tracking-wider cursor-pointer hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        <span>
                          {uploadingProof
                            ? 'Mengompres ke WebP & Mengunggah...'
                            : confirmedOrder.paymentProofUrl
                            ? 'Ganti Foto Bukti Transfer'
                            : 'Pilih / Upload Foto Bukti Transfer'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => void handleUploadProof(e)}
                          className="hidden"
                          disabled={uploadingProof}
                        />
                      </label>
                    )}

                    {proofError && <p className="text-error text-[11px] font-medium">{proofError}</p>}
                  </div>

                  {/* View Invoice & Download PDF Button */}
                  <button
                    type="button"
                    onClick={() => setInvoiceOrder(confirmedOrder)}
                    className="w-full h-11 border border-primary bg-surface-card text-primary font-label-uppercase text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-surface-sand transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">description</span>
                    <span>Lihat Invoice &amp; Download PDF ({badge.label})</span>
                  </button>

                  {/* Shipping Summary */}
                  <div className="p-4 bg-surface-card border border-border-ecru space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border-ecru">
                      <span className="text-text-muted">Penerima</span>
                      <span className="font-medium text-primary">
                        {confirmedOrder.fullName} ({confirmedOrder.whatsapp})
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border-ecru gap-3">
                      <span className="text-text-muted shrink-0">Tujuan Kirim</span>
                      <span className="font-medium text-primary text-right">
                        {confirmedOrder.address}
                        {confirmedOrder.district ? `, Kec. ${confirmedOrder.district}` : ''}, {confirmedOrder.city}
                        {confirmedOrder.province ? `, ${confirmedOrder.province}` : ''}
                        {confirmedOrder.postalCode ? ` ${confirmedOrder.postalCode}` : ''}
                      </span>
                    </div>
                    {confirmedOrder.deliveryNotes && (
                      <div className="flex justify-between py-1 border-b border-border-ecru gap-3">
                        <span className="text-text-muted shrink-0">Catatan</span>
                        <span className="text-primary text-right italic">{confirmedOrder.deliveryNotes}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1">
                      <span className="text-text-muted">Kurir</span>
                      <span className="font-medium text-primary uppercase">{confirmedOrder.courier}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {mode === 'orders' && (() => {
              void nowTick;
              return (
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-14 h-14 rounded-full bg-surface-sand border border-border-ecru flex items-center justify-center mx-auto mb-4 text-text-muted">
                        <span className="material-symbols-outlined text-[26px]">receipt_long</span>
                      </div>
                      <h4 className="font-headline-sm text-headline-sm text-primary mb-2">
                        Belum ada riwayat pesanan
                      </h4>
                      <p className="font-body-sm text-body-sm text-text-muted mb-6 max-w-xs mx-auto">
                        Pesanan yang kamu selesaikan bakal muncul di sini biar gampang dipantau.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onExploreCatalog();
                        }}
                        className="px-8 py-3 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-wider rounded-DEFAULT hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        Eksplor Koleksi
                      </button>
                    </div>
                  ) : (
                    orders.map((ord) => {
                      const remSec = getRemainingSeconds(ord.paymentExpiresAt);
                      const isExp = Boolean(ord.paymentExpiresAt) && remSec === 0 && ord.status === 'pending';
                      const badge = getOrderStatusBadge(ord.status, isExp);

                      return (
                        <div key={ord.id} className="p-4 bg-surface-sand border border-border-ecru space-y-2.5 text-body-sm">
                          <div className="flex items-center justify-between border-b border-border-ecru pb-2 gap-2">
                            <span className="font-label-uppercase text-[11px] font-semibold text-primary">
                              #{ord.id}
                            </span>
                            <span className={`px-2 py-0.5 font-label-uppercase text-[9px] uppercase ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-text-muted">Tanggal &amp; Penerima</span>
                            <span className="text-primary font-medium">
                              {ord.createdAt} · {ord.fullName}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-text-muted">Metode &amp; Item</span>
                            <span className="text-primary">
                              {ord.paymentMethod} · {ord.itemsCount} item
                            </span>
                          </div>
                          {ord.status === 'pending' && ord.paymentExpiresAt && !isExp && (
                            <div className="flex justify-between text-xs text-secondary font-medium">
                              <span>Sisa Waktu Bayar</span>
                              <span className="tabular-nums font-semibold">{formatCountdown(remSec)}</span>
                            </div>
                          )}
                          {ord.trackingNumber && (
                            <div className="flex justify-between text-xs">
                              <span className="text-text-muted">No. Resi</span>
                              <span className="font-mono font-semibold text-primary">{ord.trackingNumber}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-border-ecru gap-2">
                            <span className="font-price-md text-primary tabular-nums">{formatRupiah(ord.total)}</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInvoiceOrder(ord)}
                                className="px-2.5 py-1.5 border border-primary text-primary font-label-uppercase text-[10px] uppercase tracking-wider cursor-pointer hover:bg-surface-card"
                              >
                                Invoice PDF
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmedOrder(ord);
                                  setProofError(null);
                                  setProofCompressionInfo(null);
                                  setMode('confirmation');
                                }}
                                className="px-3 py-1.5 bg-primary text-on-primary font-label-uppercase text-[10px] uppercase tracking-wider cursor-pointer hover:bg-neutral-800"
                              >
                                {ord.status === 'pending' && !isExp ? 'Bayar / Upload Bukti →' : 'Detail →'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })()}
          </div>

          {/* Bottom Sticky Drawer Actions */}
          <div className="p-6 border-t border-border-ecru bg-surface-card">
            {mode === 'bag' && cartItems.length > 0 && (
              <button
                type="button"
                onClick={() => setMode('checkout')}
                className="w-full h-12 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-[0.14em] rounded-DEFAULT hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Gas Checkout — {formatRupiah(grandTotal)}
              </button>
            )}

            {mode === 'checkout' && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode('bag')}
                  className="px-4 h-12 border border-border-ecru text-primary font-label-uppercase text-label-uppercase uppercase cursor-pointer hover:border-primary"
                >
                  ← Bag
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={cartItems.length === 0 || submitting}
                  className="flex-1 h-12 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-[0.14em] rounded-DEFAULT hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {submitting ? 'Memproses Order...' : `Gas Checkout — ${formatRupiah(grandTotal)}`}
                </button>
              </div>
            )}

            {(mode === 'confirmation' || mode === 'orders') && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExploreCatalog();
                }}
                className="w-full h-12 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-[0.14em] rounded-DEFAULT hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Lanjut Eksplor Outfit Lainnya
              </button>
            )}
          </div>
        </div>
      </div>

      <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
    </div>
  );
};
