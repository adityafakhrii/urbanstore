import {
  type ApiRequest,
  type ApiResponse,
  type DbOrderRow,
  createMayarInvoice,
  expireOrderInSupabase,
  getRequestOrigin,
  getSupabaseAdminClient,
  readJsonBody,
  sendJson,
} from '../_lib/mayar';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method tidak diizinkan. Gunakan POST.' });
    return;
  }

  const { client: supabaseAdmin, error: supaErr } = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    sendJson(res, 500, { ok: false, error: supaErr });
    return;
  }

  const body = await readJsonBody(req);
  const orderNumber = typeof body.orderNumber === 'string' ? body.orderNumber.trim() : '';
  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
  const forceRecreate = body.forceRecreate === true;

  if (!orderNumber && !orderId) {
    sendJson(res, 400, { ok: false, error: 'orderNumber atau orderId wajib diisi.' });
    return;
  }

  let query = supabaseAdmin
    .from('orders')
    .select(
      '*, order_items(id, product_id, product_name, product_sku, size, color, unit_price, quantity, line_total)'
    );
  query = orderId ? query.eq('id', orderId) : query.eq('order_number', orderNumber);

  const { data: orderData, error: fetchErr } = await query.maybeSingle();

  if (fetchErr || !orderData) {
    sendJson(res, 404, { ok: false, error: 'Pesanan tidak ditemukan di database.' });
    return;
  }

  const order = orderData as DbOrderRow;

  // Already paid / fulfilled -> return current status without creating duplicate Mayar invoice
  if (['paid', 'packed', 'shipped', 'delivered'].includes(order.status)) {
    sendJson(res, 200, {
      ok: true,
      alreadyPaid: true,
      orderNumber: order.order_number,
      status: order.status,
      invoiceId: order.mayar_invoice_id,
      transactionId: order.mayar_transaction_id,
      paymentLink: order.mayar_payment_link,
      paidAt: order.paid_at,
      mayarVerifiedAt: order.mayar_verified_at,
    });
    return;
  }

  if (order.status === 'cancelled' || order.status === 'expired') {
    sendJson(res, 400, {
      ok: false,
      error: 'Pesanan ini sudah dibatalkan atau kedaluwarsa. Silakan buat pesanan baru.',
    });
    return;
  }

  // Check if 1-hour deadline already passed -> expire order and restore reserved stock
  const expiresAtMs = new Date(order.payment_expires_at).getTime();
  if (!Number.isNaN(expiresAtMs) && expiresAtMs <= Date.now()) {
    await expireOrderInSupabase(supabaseAdmin, order.id, { paymentStatus: 'expired' });
    sendJson(res, 400, {
      ok: false,
      expired: true,
      error: 'Batas waktu pembayaran 60 menit telah berakhir dan stok telah dikembalikan.',
    });
    return;
  }

  // Reuse existing active Mayar payment link unless explicitly recreating
  if (!forceRecreate && order.mayar_payment_link && order.mayar_invoice_id) {
    sendJson(res, 200, {
      ok: true,
      reused: true,
      orderNumber: order.order_number,
      status: order.status,
      invoiceId: order.mayar_invoice_id,
      transactionId: order.mayar_transaction_id,
      paymentLink: order.mayar_payment_link,
      expiredAt: order.payment_expires_at,
    });
    return;
  }

  const origin = getRequestOrigin(req);
  const redirectUrl = `${origin}/orders/${encodeURIComponent(order.order_number)}/payment?mayar_return=1`;

  const created = await createMayarInvoice(order, redirectUrl);
  if (!created.ok || !created.paymentLink) {
    sendJson(res, 502, {
      ok: false,
      error: created.error || 'Gagal membuat link pembayaran Mayar.id.',
    });
    return;
  }

  const { error: attachErr } = await supabaseAdmin.rpc('attach_mayar_payment', {
    p_order_id: order.id,
    p_mayar_invoice_id: created.invoiceId ?? null,
    p_mayar_transaction_id: created.transactionId ?? null,
    p_mayar_payment_link: created.paymentLink,
    p_payment_expires_at: created.expiredAtIso ?? null,
  });

  if (attachErr) {
    sendJson(res, 500, {
      ok: false,
      error: `Link pembayaran dibuat tetapi gagal menyimpan ke database: ${attachErr.message}`,
    });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    orderNumber: order.order_number,
    status: order.status,
    invoiceId: created.invoiceId,
    transactionId: created.transactionId,
    paymentLink: created.paymentLink,
    expiredAt: created.expiredAtIso || order.payment_expires_at,
  });
}
