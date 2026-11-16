import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import {
  OrderRecord,
  formatRupiah,
  placeOrderInDb,
  validatePromoInDb,
} from '../../services/supabaseService';
import { INDO_PROVINCES } from '../../utils/payment';
import { handleImageError } from '../../utils/storage';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const {
    cartItems,
    useSupabaseDb,
    updateQuantity,
    removeCartItem,
    clearCart,
    addOrder,
    showToast,
  } = useStore();

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; amount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [courier, setCourier] = useState<'reguler' | 'sameday' | 'instant'>('reguler');
  const [paymentMethod, setPaymentMethod] = useState<
    'QRIS' | 'BCA Virtual Account' | 'Mandiri' | 'Visa / Mastercard'
  >('BCA Virtual Account');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (!fullName && profile.full_name) setFullName(profile.full_name);
    if (!email && (profile.email || user?.email)) setEmail(profile.email || user?.email || '');
    if (!whatsapp && profile.whatsapp) setWhatsapp(profile.whatsapp);
    if (!province && profile.default_province) setProvince(profile.default_province);
    if (!city && profile.default_city) setCity(profile.default_city);
    if (!district && profile.default_district) setDistrict(profile.default_district);
    if (!address && profile.default_address) setAddress(profile.default_address);
    if (!postalCode && profile.default_postal_code) setPostalCode(profile.default_postal_code);
  }, [profile, user, fullName, email, whatsapp, province, city, district, address, postalCode]);

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

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = promoCode.trim().toUpperCase();
    if (!cleaned) return;

    if (useSupabaseDb) {
      const res = await validatePromoInDb(cleaned, subtotal);
      if (res.valid && res.code && res.discountAmount) {
        setPromoApplied({ code: res.code, amount: res.discountAmount });
        setPromoError(null);
        showToast(`Kode promo ${res.code} diterapkan!`);
      } else {
        setPromoApplied(null);
        setPromoError(res.message || 'Kode promo ini nggak valid atau udah lewat masanya.');
      }
      return;
    }

    if (['ANTIZONK', 'URBAN10', 'DROP01', 'HEMAT50'].includes(cleaned)) {
      setPromoApplied({ code: cleaned, amount: 50000 });
      setPromoError(null);
      showToast(`Kode promo ${cleaned} diterapkan!`);
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

      addOrder(res.order);
      clearCart();
      showToast(`Pesanan ${res.order.id} berhasil dibuat!`);
      navigate(`/orders/${encodeURIComponent(res.order.id)}/payment`, { replace: true });
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
        quantity: item.quantity,
        unitPrice: item.product.price,
        lineTotal: item.product.price * item.quantity,
      })),
    };

    addOrder(newOrder);
    clearCart();
    showToast(`Pesanan ${newOrder.id} berhasil dibuat!`);
    navigate(`/orders/${encodeURIComponent(newOrder.id)}/payment`, { replace: true });
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="border border-border-ecru bg-surface-card p-10 space-y-4">
          <span className="material-symbols-outlined text-[42px] text-secondary block">
            shopping_bag
          </span>
          <h1 className="font-headline-sm text-headline-sm text-primary">Tas Belanja Masih Kosong</h1>
          <p className="font-body-sm text-text-muted max-w-md mx-auto">
            Tambahkan outfit pilihanmu terlebih dahulu sebelum melanjutkan ke halaman checkout.
          </p>
          <div className="pt-2">
            <Link
              to="/curated-drops"
              className="inline-block px-6 py-3 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-wider"
            >
              Jelajahi Curated Drops
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="border-b border-border-ecru pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            SECURE CHECKOUT · URBANSTORE INDONESIA
          </span>
          <h1 className="font-headline-sm text-headline-sm text-primary">
            Pengiriman &amp; Pembayaran
          </h1>
        </div>
        <Link
          to="/curated-drops"
          className="font-label-uppercase text-[11px] uppercase tracking-wider text-secondary hover:text-primary underline underline-offset-4"
        >
          ← Lanjut Belanja
        </Link>
      </div>

      {checkoutError && (
        <div className="mb-6 p-4 bg-error-container/70 border border-error/40 text-error text-xs">
          {checkoutError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Checkout Form */}
        <form id="checkout-form" onSubmit={handleCompleteCheckout} className="lg:col-span-7 space-y-6">
          <section className="bg-surface-card border border-border-ecru p-6 space-y-4">
            <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary border-b border-border-ecru pb-3">
              01 · Data Penerima
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-body-sm text-xs text-text-muted mb-1">Nama Lengkap *</label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama penerima paket"
                  className="w-full h-11 bg-surface border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                />
              </div>
              <div>
                <label className="block font-body-sm text-xs text-text-muted mb-1">Email *</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="w-full h-11 bg-surface border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                />
              </div>
            </div>

            <div>
              <label className="block font-body-sm text-xs text-text-muted mb-1">
                No. WhatsApp Aktif *
              </label>
              <input
                required
                type="tel"
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(e.target.value);
                  setWhatsappError(null);
                }}
                placeholder="081234567890"
                className="w-full h-11 bg-surface border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
              />
              {whatsappError && <p className="text-[11px] text-error mt-1">{whatsappError}</p>}
            </div>
          </section>

          <section className="bg-surface-card border border-border-ecru p-6 space-y-4">
            <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary border-b border-border-ecru pb-3">
              02 · Alamat Pengiriman Lengkap
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-body-sm text-xs text-text-muted mb-1">Provinsi *</label>
                <select
                  required
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full h-11 bg-surface border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                >
                  <option value="">Pilih Provinsi</option>
                  {INDO_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                  {province && !INDO_PROVINCES.includes(province) && (
                    <option value={province}>{province}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block font-body-sm text-xs text-text-muted mb-1">
                  Kota / Kabupaten *
                </label>
                <input
                  required
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Contoh: Jakarta Selatan / Kota Bandung"
                  className="w-full h-11 bg-surface border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-body-sm text-xs text-text-muted mb-1">Kecamatan *</label>
                <input
                  required
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Contoh: Kebayoran Baru"
                  className="w-full h-11 bg-surface border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                />
              </div>
              <div>
                <label className="block font-body-sm text-xs text-text-muted mb-1">Kode Pos *</label>
                <input
                  required
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="12190"
                  className="w-full h-11 bg-surface border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
                />
              </div>
            </div>

            <div>
              <label className="block font-body-sm text-xs text-text-muted mb-1">
                Alamat Lengkap (Jalan, No. Rumah, RT/RW, Patokan) *
              </label>
              <textarea
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Senopati No. 18, RT 02/RW 03, samping toko kopi"
                className="w-full bg-surface border border-border-ecru p-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
              />
            </div>

            <div>
              <label className="block font-body-sm text-xs text-text-muted mb-1">
                Catatan Pengiriman (Opsional)
              </label>
              <input
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Misal: Titip ke satpam jika rumah kosong"
                className="w-full h-11 bg-surface border border-border-ecru px-3 text-body-sm text-primary focus:outline-none focus:border-primary rounded-DEFAULT"
              />
            </div>
          </section>

          <section className="bg-surface-card border border-border-ecru p-6 space-y-4">
            <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary border-b border-border-ecru pb-3">
              03 · Kurir &amp; Metode Pembayaran
            </h2>

            <div>
              <p className="font-body-sm text-xs text-text-muted mb-2">Layanan Pengiriman</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'reguler' as const,
                    label: 'Reguler (2-4 Hari)',
                    cost: subtotal >= 500000 ? 'Gratis' : formatRupiah(18000),
                  },
                  { id: 'sameday' as const, label: 'Same-Day Jabodetabek', cost: formatRupiah(20000) },
                  { id: 'instant' as const, label: 'Instant (2-3 Jam)', cost: formatRupiah(35000) },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCourier(opt.id)}
                    className={`p-3 border text-left transition-colors cursor-pointer ${
                      courier === opt.id
                        ? 'border-primary bg-surface-sand'
                        : 'border-border-ecru bg-surface hover:border-primary/50'
                    }`}
                  >
                    <p className="text-xs font-medium text-primary">{opt.label}</p>
                    <p className="text-[11px] text-secondary mt-0.5">{opt.cost}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-body-sm text-xs text-text-muted mb-2">Metode Pembayaran (Transfer / QRIS)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  ['BCA Virtual Account', 'Mandiri', 'QRIS', 'Visa / Mastercard'] as const
                ).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3 border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      paymentMethod === method
                        ? 'border-primary bg-surface-sand'
                        : 'border-border-ecru bg-surface hover:border-primary/50'
                    }`}
                  >
                    <span className="text-xs font-medium text-primary">{method}</span>
                    {paymentMethod === method && (
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        check_circle
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </form>

        {/* Right: Order Summary & Cart Adjustments */}
        <aside className="lg:col-span-5 bg-surface-card border border-border-ecru p-6 space-y-5 lg:sticky lg:top-24">
          <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary border-b border-border-ecru pb-3">
            Ringkasan Pesanan ({cartItems.reduce((s, i) => s + i.quantity, 0)} Item)
          </h2>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div
                key={`${item.product.id}-${item.size}-${item.color}`}
                className="flex gap-3 pb-4 border-b border-border-ecru/70"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  onError={handleImageError}
                  className="w-16 h-20 object-cover bg-surface-muted shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <p className="font-headline-sm text-xs text-primary truncate">{item.product.name}</p>
                    <button
                      type="button"
                      onClick={() => removeCartItem(item.product.id, item.size, item.color)}
                      className="text-text-muted hover:text-error cursor-pointer"
                      aria-label="Hapus item"
                    >
                      <span className="material-symbols-outlined text-[15px]">close</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {item.color} · Size {item.size}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-border-ecru bg-surface">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.size, item.color, -1)}
                        className="px-2 py-0.5 text-xs text-primary cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2.5 text-xs text-primary">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.size, item.color, 1)}
                        className="px-2 py-0.5 text-xs text-primary cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs font-medium text-primary">
                      {formatRupiah(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Promo Input */}
          <form onSubmit={handleApplyPromo} className="space-y-1.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Kode Promo (contoh: ANTIZONK)"
                className="flex-1 h-10 bg-surface border border-border-ecru px-3 text-xs text-primary focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-4 h-10 border border-primary text-primary font-label-uppercase text-[10px] uppercase tracking-wider hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"
              >
                Pakai
              </button>
            </div>
            {promoError && <p className="text-[11px] text-error">{promoError}</p>}
            {promoApplied && (
              <p className="text-[11px] text-status-stock">
                Kode {promoApplied.code} aktif — Potongan {formatRupiah(promoApplied.amount)}
              </p>
            )}
          </form>

          {/* Totals */}
          <div className="space-y-2 pt-3 border-t border-border-ecru text-xs">
            <div className="flex justify-between text-text-muted">
              <span>Subtotal Produk</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-status-stock">
                <span>Diskon Promo</span>
                <span>-{formatRupiah(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-muted">
              <span>Ongkos Kirim ({courier})</span>
              <span>{shippingCost === 0 ? 'GRATIS' : formatRupiah(shippingCost)}</span>
            </div>
            <div className="flex justify-between text-base font-medium text-primary pt-3 border-t border-border-ecru">
              <span>Total Pembayaran</span>
              <span>{formatRupiah(grandTotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className="w-full h-12 bg-primary text-on-primary font-label-uppercase text-label-uppercase uppercase tracking-[0.14em] hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Membuat Pesanan...' : 'Buat Pesanan Sekarang'}
          </button>

          <p className="text-[11px] text-text-muted text-center">
            Batas waktu pembayaran adalah 60 menit setelah pesanan dibuat.
          </p>
        </aside>
      </div>
    </div>
  );
};
