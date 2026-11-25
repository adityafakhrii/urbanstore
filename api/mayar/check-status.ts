import {
  type ApiRequest,
  type ApiResponse,
  type DbOrderRow,
  confirmOrderPaidInSupabase,
  expireOrderInSupabase,
  fetchMayarPaymentStatus,
  getSupabaseAdminClient,
  readJsonBody,
  sendJson,
} from '../_lib/mayar';

async function verifySingleOrder(
  supabaseAdmin: NonNullable<ReturnType<typeof getSupabaseAdminClient>['client']>,
  order: DbOrderRow
) {
  if (['paid', 'packed', 'shipped', 'delivered'].includes(order.status)) {
    return {
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status,
      mayarPaymentStatus: order.mayar_payment_status || 'paid',
      mayarPaymentMethod: order.mayar_payment_method || null,
      mayarTransactionId: order.mayar_transaction_id || null,
      mayarInvoiceId: order.mayar_invoice_id || null,
      mayarVerifiedAt: order.mayar_verified_at || order.paid_at,
      paidAt: order.paid_at,
      updated: false,
    };
  }

  if (order.status === 'cancelled' || order.status === 'expired') {
    return {
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status,
      mayarPaymentStatus: order.mayar_payment_status || order.status,
      mayarPaymentMethod: order.mayar_payment_method || null,
      mayarTransactionId: order.mayar_transaction_id || null,
      mayarInvoiceId: order.mayar_invoice_id || null,
      mayarVerifiedAt: order.mayar_verified_at || null,
      paidAt: order.paid_at,
      updated: false,
    };
  }

  // Query Mayar API directly if we have Mayar IDs
  if (order.mayar_invoice_id || order.mayar_transaction_id) {
    const mayarStatus = await fetchMayarPaymentStatus({
      invoiceId: order.mayar_invoice_id,
      transactionId: order.mayar_transaction_id,
    });

    if (mayarStatus.ok && mayarStatus.state === 'paid') {
      const confirmed = await confirmOrderPaidInSupabase(supabaseAdmin, order.id, {
        invoiceId: mayarStatus.invoiceId || order.mayar_invoice_id,
        transactionId: mayarStatus.transactionId || order.mayar_transaction_id,
        paymentStatus: 'paid',
        paymentMethod: mayarStatus.paymentMethod || order.mayar_payment_method,
        paidAtIso: mayarStatus.paidAtIso || new Date().toISOString(),
        rawPayload: mayarStatus.raw || null,
      });

      if (confirmed.order) {
        return {
          orderId: confirmed.order.id,
          orderNumber: confirmed.order.order_number,
          status: confirmed.order.status,
          mayarPaymentStatus: confirmed.order.mayar_payment_status || 'paid',
          mayarPaymentMethod: confirmed.order.mayar_payment_method || null,
          mayarTransactionId: confirmed.order.mayar_transaction_id || null,
          mayarInvoiceId: confirmed.order.mayar_invoice_id || null,
          mayarVerifiedAt: confirmed.order.mayar_verified_at || confirmed.order.paid_at,
          paidAt: confirmed.order.paid_at,
          updated: true,
        };
      }
    }

    if (mayarStatus.ok && mayarStatus.state === 'expired') {
      const expired = await expireOrderInSupabase(supabaseAdmin, order.id, {
        paymentStatus: 'expired',
        rawPayload: mayarStatus.raw || null,
      });
      if (expired.order) {
        return {
          orderId: expired.order.id,
          orderNumber: expired.order.order_number,
          status: expired.order.status,
          mayarPaymentStatus: 'expired',
          mayarPaymentMethod: expired.order.mayar_payment_method || null,
          mayarTransactionId: expired.order.mayar_transaction_id || null,
          mayarInvoiceId: expired.order.mayar_invoice_id || null,
          mayarVerifiedAt: null,
          paidAt: null,
          updated: true,
        };
      }
    }
  }

  // Fallback local expiry check -> automatically expire and restore stock
  const expiresAtMs = new Date(order.payment_expires_at).getTime();
  if (!Number.isNaN(expiresAtMs) && expiresAtMs <= Date.now() && order.status === 'pending') {
    const expired = await expireOrderInSupabase(supabaseAdmin, order.id, {
      paymentStatus: 'expired',
    });
    if (expired.order) {
      return {
        orderId: expired.order.id,
        orderNumber: expired.order.order_number,
        status: expired.order.status,
        mayarPaymentStatus: 'expired',
        mayarPaymentMethod: expired.order.mayar_payment_method || null,
        mayarTransactionId: expired.order.mayar_transaction_id || null,
        mayarInvoiceId: expired.order.mayar_invoice_id || null,
        mayarVerifiedAt: null,
        paidAt: null,
        updated: true,
      };
    }
  }

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    status: order.status,
    mayarPaymentStatus: order.mayar_payment_status || 'unpaid',
    mayarPaymentMethod: order.mayar_payment_method || null,
    mayarTransactionId: order.mayar_transaction_id || null,
    mayarInvoiceId: order.mayar_invoice_id || null,
    mayarVerifiedAt: order.mayar_verified_at || null,
    paidAt: order.paid_at,
    updated: false,
  };
}

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
  const syncAllPending = body.syncAllPending === true;

  // Batch sync for Admin Console (requires valid Admin Supabase JWT)
  if (syncAllPending) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      sendJson(res, 401, { ok: false, error: 'Akses ditolak. Token admin diperlukan.' });
      return;
    }

    const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !authData.user) {
      sendJson(res, 401, { ok: false, error: 'Sesi admin tidak valid.' });
      return;
    }

    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileData?.role !== 'admin') {
      sendJson(res, 403, { ok: false, error: 'Hanya akun admin yang dapat melakukan sinkronisasi massal.' });
      return;
    }

    const { data: pendingOrders, error: listErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .in('status', ['pending', 'waiting_verification'])
      .order('created_at', { ascending: false })
      .limit(30);

    if (listErr) {
      sendJson(res, 500, { ok: false, error: listErr.message });
      return;
    }

    const results = [];
    for (const row of (pendingOrders || []) as DbOrderRow[]) {
      results.push(await verifySingleOrder(supabaseAdmin, row));
    }

    const paidUpdatedCount = results.filter((r) => r.updated && r.status === 'paid').length;
    const expiredUpdatedCount = results.filter((r) => r.updated && r.status === 'expired').length;

    sendJson(res, 200, {
      ok: true,
      checkedCount: results.length,
      paidUpdatedCount,
      expiredUpdatedCount,
      results,
    });
    return;
  }

  const orderNumber = typeof body.orderNumber === 'string' ? body.orderNumber.trim() : '';
  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';

  if (!orderNumber && !orderId) {
    sendJson(res, 400, { ok: false, error: 'orderNumber atau orderId wajib diisi.' });
    return;
  }

  let query = supabaseAdmin.from('orders').select('*');
  query = orderId ? query.eq('id', orderId) : query.eq('order_number', orderNumber);

  const { data: orderData, error: fetchErr } = await query.maybeSingle();
  if (fetchErr || !orderData) {
    sendJson(res, 404, { ok: false, error: 'Pesanan tidak ditemukan.' });
    return;
  }

  const result = await verifySingleOrder(supabaseAdmin, orderData as DbOrderRow);
  sendJson(res, 200, { ok: true, ...result });
}
