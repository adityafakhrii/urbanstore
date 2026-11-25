import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import {
  CourierType,
  OrderRecord,
  formatRupiah,
  placeOrderInDb,
  validatePromoInDb,
} from '../../services/supabaseService';
import { createMayarPaymentForOrder } from '../../services/mayarService';
import {
  INDO_PROVINCES,
  MAYAR_SUPPORTED_CHANNELS,
  formatCourierLabel,
} from '../../utils/payment';
import { handleImageError } from '../../utils/storage';
import {
  AlertBanner,
  Button,
  CustomSelect,
  InputField,
  TextareaField,
  getButtonClassName,
} from '../../components/ui';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const {
    cartItems,
    useSupabaseDb,
    loadCatalog,
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
  const [courier, setCourier] = useState<CourierType>('reguler');
  const [submitting, setSubmitting] = useState(false);
  const [submittingLabel, setSubmittingLabel] = useState('Membuat Pesanan...');
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

  const provinceOptions = [
    ...INDO_PROVINCES.map((prov) => ({ value: prov, label: prov })),
    ...(province && !INDO_PROVINCES.includes(province)
      ? [{ value: province, label: province }]
      : []),
  ];

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discount = promoApplied ? promoApplied.amount : 0;
  const shippingCost =
    subtotal === 0 || courier === 'free'
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

    if (!province.trim()) {
      setCheckoutError('Pilih provinsi pengiriman terlebih dahulu.');
      return;
    }

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
      setSubmittingLabel('Menyimpan Pesanan & Mengunci Stok...');
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
        paymentMethod: 'Mayar Payment Gateway',
        promoCode: promoApplied?.code ?? null,
        items: cartItems,
      });

      if (res.error || !res.order) {
        setSubmitting(false);
        setCheckoutError(res.error || 'Jaringan lagi ngadat nih. Santai, klik coba lagi ya.');
        return;
      }

      // Refresh catalog stock right after atomic DB reservation
      void loadCatalog();

      setSubmittingLabel('Menghubungkan ke Mayar.id...');
      const mayarRes = await createMayarPaymentForOrder({
        orderId: res.order.dbId,
        orderNumber: res.order.id,
      });
      setSubmitting(false);

      const finalOrder: OrderRecord = {
        ...res.order,
        paymentGateway: 'mayar',
        mayarInvoiceId: mayarRes.invoiceId,
        mayarTransactionId: mayarRes.transactionId,
        mayarPaymentLink: mayarRes.paymentLink,
        mayarPaymentStatus: mayarRes.alreadyPaid ? 'paid' : 'unpaid',
        paymentExpiresAt: mayarRes.expiredAt || res.order.paymentExpiresAt,
      };

      addOrder(finalOrder);
      clearCart();

      if (mayarRes.ok && mayarRes.paymentLink) {
        showToast(`Pesanan ${finalOrder.id} siap dibayar melalui Mayar.id!`);
      } else {
        showToast(`Pesanan ${finalOrder.id} dibuat. Klik ulang buat link Mayar di halaman bayar.`);
      }

      navigate(`/orders/${encodeURIComponent(finalOrder.id)}/payment`, {
        replace: true,
        state: mayarRes.error ? { mayarInitError: mayarRes.error } : undefined,
      });
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
      paymentMethod: 'Mayar Payment Gateway',
      paymentGateway: 'mayar',
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
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 text-center">
        <div className="border border-border-ecru rounded-2xl bg-surface-card p-10 space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface-sand flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px] text-secondary">shopping_bag</span>
          </div>
          <h1 className="font-headline-sm text-2xl text-primary">Keranjang Belanja Masih Kosong</h1>
          <p className="font-body-sm text-text-muted max-w-md mx-auto">
            Tambahkan outfit pilihanmu terlebih dahulu sebelum melanjutkan ke halaman checkout.
          </p>
          <div className="pt-2">
            <Link
              to="/curated-drops"
              className={getButtonClassName({ variant: 'primary', size: 'md' })}
            >
              Jelajahi Curated Drops
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell py-8 sm:py-12 space-y-8">
      <div className="border-b border-border-ecru pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary block mb-1">
            SECURE CHECKOUT · URBANSTORE INDONESIA
          </span>
          <h1 className="font-headline-sm text-2xl sm:text-3xl text-primary">
            Pengiriman &amp; Pembayaran
          </h1>
        </div>
        <Link to="/cart" className={getButtonClassName({ variant: 'outline', size: 'sm' })}>
          ← Kembali ke Keranjang
        </Link>
      </div>

      {checkoutError && <AlertBanner variant="error">{checkoutError}</AlertBanner>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left: Checkout Form */}
        <form id="checkout-form" onSubmit={handleCompleteCheckout} className="lg:col-span-7 space-y-6">
          <section className="bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary border-b border-border-ecru pb-3">
              01 · Data Penerima
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Nama Lengkap"
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama penerima paket"
              />
              <InputField
                label="Email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@domain.com"
              />
            </div>

            <InputField
              label="No. WhatsApp Aktif"
              required
              type="tel"
              value={whatsapp}
              onChange={(e) => {
                setWhatsapp(e.target.value);
                setWhatsappError(null);
              }}
              placeholder="081234567890"
              error={whatsappError}
            />
          </section>

          <section className="bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary border-b border-border-ecru pb-3">
              02 · Alamat Pengiriman Lengkap
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomSelect
                label="Provinsi"
                required
                value={province}
                onChange={setProvince}
                options={provinceOptions}
                placeholder="Pilih Provinsi"
              />
              <InputField
                label="Kota / Kabupaten"
                required
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Contoh: Jakarta Selatan / Kota Bandung"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Kecamatan"
                required
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Contoh: Kebayoran Baru"
              />
              <InputField
                label="Kode Pos"
                required
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="12190"
              />
            </div>

            <TextareaField
              label="Alamat Lengkap (Jalan, No. Rumah, RT/RW, Patokan)"
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Jl. Senopati No. 18, RT 02/RW 03, samping toko kopi"
            />

            <InputField
              label="Catatan Pengiriman (Opsional)"
              type="text"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Misal: Titip ke satpam jika rumah kosong"
            />
          </section>

          <section className="bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-5">
            <h2 className="font-label-uppercase text-[11px] uppercase tracking-widest text-secondary border-b border-border-ecru pb-3">
              03 · Kurir &amp; Metode Pembayaran
            </h2>

            <div>
              <p className="font-body-sm text-xs font-medium text-text-muted mb-2">
                Layanan Pengiriman (Hitung Ongkir)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    id: 'free' as const,
                    label: 'Gratis Ongkir (3-6 Hari)',
                    cost: 'Rp 0 (Tanpa Min. Belanja)',
                  },
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
                    className={`p-3.5 border rounded-xl text-left transition-all cursor-pointer ${
                      courier === opt.id
                        ? 'border-primary bg-surface-sand ring-2 ring-primary/10'
                        : 'border-border-ecru bg-surface hover:border-primary/50'
                    }`}
                  >
                    <p className="text-xs font-medium text-primary">{opt.label}</p>
                    <p className="text-[11px] text-secondary mt-0.5 font-medium">{opt.cost}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-body-sm text-xs font-medium text-text-muted mb-2">
                Metode Pembayaran Otomatis
              </p>
              <div className="p-4 border-2 border-primary bg-surface-sand/60 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-sm text-primary">
                        Mayar.id Payment Gateway
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-status-stock/15 text-status-stock font-label-uppercase text-[9px] uppercase tracking-wider font-semibold">
                        Verifikasi Otomatis
                      </span>
                    </div>
                    <p className="font-body-sm text-xs text-text-muted">
                      Pilih channel pembayaran favoritmu langsung di halaman checkout aman Mayar.id tanpa perlu upload bukti transfer.
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[22px] text-primary shrink-0">
                    verified_user
                  </span>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-border-ecru text-[11px] text-primary">
                  {MAYAR_SUPPORTED_CHANNELS.map((ch) => (
                    <li key={ch} className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-status-stock">
                        check_circle
                      </span>
                      <span>{ch}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </form>

        {/* Right: Order Summary & Cart Adjustments */}
        <aside className="lg:col-span-5 bg-surface-card border border-border-ecru rounded-2xl p-5 sm:p-6 space-y-5 lg:sticky lg:top-28">
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
                  className="w-16 h-20 object-cover rounded-xl bg-surface-muted shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <p className="font-headline-sm text-xs text-primary truncate">{item.product.name}</p>
                    <button
                      type="button"
                      onClick={() => removeCartItem(item.product.id, item.size, item.color)}
                      className="text-text-muted hover:text-error p-0.5 rounded-full cursor-pointer"
                      aria-label="Hapus item"
                    >
                      <span className="material-symbols-outlined text-[15px]">close</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {item.color} · Size {item.size}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-border-ecru rounded-xl bg-surface overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.size, item.color, -1)}
                        className="px-2.5 py-1 text-xs text-primary hover:bg-surface-sand cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2.5 text-xs text-primary font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.size, item.color, 1)}
                        className="px-2.5 py-1 text-xs text-primary hover:bg-surface-sand cursor-pointer"
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
          <form onSubmit={handleApplyPromo} className="space-y-2">
            <div className="flex gap-2 items-start">
              <InputField
                containerClassName="flex-1"
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Kode Promo (contoh: ANTIZONK)"
              />
              <Button type="submit" variant="outline" size="md">
                Pakai
              </Button>
            </div>
            {promoError && <AlertBanner variant="error">{promoError}</AlertBanner>}
            {promoApplied && (
              <AlertBanner variant="success">
                Kode <strong>{promoApplied.code}</strong> aktif — Potongan{' '}
                {formatRupiah(promoApplied.amount)}
              </AlertBanner>
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
              <span>Ongkos Kirim ({formatCourierLabel(courier)})</span>
              <span>{shippingCost === 0 ? 'GRATIS' : formatRupiah(shippingCost)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-primary pt-3 border-t border-border-ecru">
              <span>Total Pembayaran</span>
              <span>{formatRupiah(grandTotal)}</span>
            </div>
          </div>

          <Button
            type="submit"
            form="checkout-form"
            variant="primary"
            size="lg"
            fullWidth
            disabled={submitting}
          >
            {submitting ? submittingLabel : 'Lanjut Bayar via Mayar.id'}
          </Button>

          <p className="text-[11px] text-text-muted text-center">
            Batas waktu pembayaran 60 menit. Status pesanan &amp; stok terupdate otomatis setelah pembayaran berhasil.
          </p>
        </aside>
      </div>
    </div>
  );
};
