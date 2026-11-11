import React, { useState } from 'react';
import { Product } from '../data/products';

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

interface CartAndCheckoutModalProps {
  isOpen: boolean;
  initialMode: 'bag' | 'checkout';
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, size: string, delta: number) => void;
  onRemoveItem: (productId: string, size: string) => void;
  onClearCart: () => void;
  onExploreCatalog: () => void;
}

export const CartAndCheckoutModal: React.FC<CartAndCheckoutModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onExploreCatalog,
}) => {
  const [mode, setMode] = useState<'bag' | 'checkout' | 'confirmation'>(initialMode);
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoApplied, setPromoApplied] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // 4-Step Checkout Form State
  const [fullName, setFullName] = useState<string>('Nadia Putri');
  const [email, setEmail] = useState<string>('nadia.putri@email.com');
  const [whatsapp, setWhatsapp] = useState<string>('081288994411');
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('Jl. Senopati Dalam No. 14, Kebayoran Baru');
  const [city, setCity] = useState<string>('Jakarta Selatan');
  const [postalCode, setPostalCode] = useState<string>('12190');
  const [courier, setCourier] = useState<'reguler' | 'sameday' | 'instant'>('reguler');
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'BCA Virtual Account' | 'Mandiri' | 'Visa / Mastercard'>('QRIS');
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>('');
  const [confirmedTotal, setConfirmedTotal] = useState<number>(0);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discount = promoApplied ? 50000 : 0;
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

  const formatRupiah = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = promoCode.trim().toUpperCase();
    if (['ANTIZONK', 'URBAN10', 'DROP01', 'HEMAT50'].includes(cleaned)) {
      setPromoApplied(cleaned);
      setPromoError(null);
    } else {
      setPromoApplied(null);
      setPromoError('Kode promo ini nggak valid atau udah lewat masanya.');
    }
  };

  const handleCompleteCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const digitsOnly = whatsapp.replace(/\D/g, '');
    if (digitsOnly.length < 9 || !digitsOnly.startsWith('08') && !digitsOnly.startsWith('62')) {
      setWhatsappError('Masukin nomor WhatsApp yang aktif ya buat info pengiriman.');
      return;
    }
    setWhatsappError(null);
    setConfirmedTotal(grandTotal);
    setConfirmedOrderId(`US-${Math.floor(100000 + Math.random() * 900000)}`);
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
                  : 'ORDER CONFIRMED'}
              </span>
              <h3 className="font-headline-sm text-headline-sm text-primary">
                {mode === 'bag'
                  ? `Shopping Bag (${cartItems.reduce((a, b) => a + b.quantity, 0)})`
                  : mode === 'checkout'
                  ? 'Rincian Pengiriman & Pembayaran'
                  : 'Done! Orderan kamu udah kami terima.'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
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
                        <div key={`${item.product.id}-${item.size}`} className="py-4 flex gap-4">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
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
                                  onClick={() => onRemoveItem(item.product.id, item.size)}
                                  className="text-text-muted hover:text-error cursor-pointer"
                                  title="Hapus"
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
                                  onClick={() => onUpdateQuantity(item.product.id, item.size, -1)}
                                  className="w-7 h-7 flex items-center justify-center text-primary hover:bg-surface-container cursor-pointer"
                                >
                                  −
                                </button>
                                <span className="w-8 text-center font-body-sm text-xs font-medium tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(item.product.id, item.size, 1)}
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
                          ✓ Kode {promoApplied} aktif! Potongan Rp 50.000 otomatis kepasang.
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
                          <span>Potongan Promo ({promoApplied})</span>
                          <span className="tabular-nums">- Rp 50.000</span>
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
                  <div>
                    <label className="block font-body-sm text-xs text-text-muted mb-1">Alamat Jalan &amp; Nomor Rumah</label>
                    <input
                      required
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-body-sm text-xs text-text-muted mb-1">Kota / Kecamatan</label>
                      <input
                        required
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                      />
                    </div>
                    <div>
                      <label className="block font-body-sm text-xs text-text-muted mb-1">Kode Pos</label>
                      <input
                        required
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full h-11 bg-surface-card border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                      />
                    </div>
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
                      <span>Kode Promo ({promoApplied})</span>
                      <span className="tabular-nums">- Rp 50.000</span>
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
              </form>
            )}

            {mode === 'confirmation' && (
              <div className="py-8 space-y-6">
                <div className="p-6 bg-surface-sand border border-border-ecru text-center">
                  <div className="w-12 h-12 rounded-full bg-status-stock text-white flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-[24px]">check</span>
                  </div>
                  <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
                    ORDER ID #{confirmedOrderId}
                  </span>
                  <h4 className="font-headline-sm text-headline-sm text-primary mb-2">
                    Done! Orderan kamu udah kami terima.
                  </h4>
                  <p className="font-body-md text-body-md text-text-muted">
                    Duduk manis ya, outfit barumu lagi disiapin dari atelier.
                  </p>
                </div>

                <div className="p-5 bg-surface-card border border-border-ecru space-y-3 text-body-sm">
                  <div className="flex justify-between py-1 border-b border-border-ecru">
                    <span className="text-text-muted">Penerima</span>
                    <span className="font-medium text-primary">{fullName} ({whatsapp})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-ecru">
                    <span className="text-text-muted">Tujuan Kirim</span>
                    <span className="font-medium text-primary text-right max-w-[220px]">{address}, {city}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-ecru">
                    <span className="text-text-muted">Metode Bayar</span>
                    <span className="font-medium text-primary">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-text-muted">Total Dibayar</span>
                    <span className="font-price-md text-primary tabular-nums">{formatRupiah(confirmedTotal)}</span>
                  </div>
                </div>

                <div className="p-4 bg-[#FCEAE6] border border-border-ecru text-xs text-primary">
                  Info resi otomatis dikirim ke WhatsApp <strong>{whatsapp}</strong> begitu paket dijemput kurir.
                </div>
              </div>
            )}
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
                  className="flex-1 h-12 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-[0.14em] rounded-DEFAULT hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Gas Checkout — {formatRupiah(grandTotal)}
                </button>
              </div>
            )}

            {mode === 'confirmation' && (
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
    </div>
  );
};
