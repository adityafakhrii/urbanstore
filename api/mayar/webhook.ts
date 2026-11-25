import {
  type ApiRequest,
  type ApiResponse,
  type DbOrderRow,
  confirmOrderPaidInSupabase,
  fetchMayarPaymentStatus,
  getMayarConfig,
  getQueryParam,
  getSupabaseAdminClient,
  readJsonBody,
  sendJson,
  timingSafeEqualStrings,
} from '../_lib/mayar';

function extractWebhookEventName(body: Record<string, unknown>): string {
  if (typeof body.event === 'string') return body.event.trim().toLowerCase();
  if (body.event && typeof body.event === 'object') {
    const nested = body.event as Record<string, unknown>;
    if (typeof nested.received === 'string') return nested.received.trim().toLowerCase();
    if (typeof nested.type === 'string') return nested.type.trim().toLowerCase();
  }
  return '';
}

function getHeaderString(req: ApiRequest, headerName: string): string {
  const val = req.headers[headerName.toLowerCase()];
  if (typeof val === 'string') return val.trim();
  if (Array.isArray(val) && val[0]) return val[0].trim();
  return '';
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

  // 1. Validate webhook shared secret token (configured via ?token=... on Mayar Dashboard)
  const { webhookToken, apiKey } = getMayarConfig();
  if (webhookToken) {
    const queryToken = (getQueryParam(req, 'token') || '').trim();
    const headerToken =
      getHeaderString(req, 'x-mayar-token') ||
      getHeaderString(req, 'x-callback-token') ||
      getHeaderString(req, 'authorization').replace(/^Bearer\s+/i, '');
    const suppliedToken = queryToken || headerToken;

    if (!suppliedToken || !timingSafeEqualStrings(suppliedToken, webhookToken)) {
      sendJson(res, 401, { ok: false, error: 'Webhook token tidak valid.' });
      return;
    }
  }

  const body = await readJsonBody(req);
  const eventName = extractWebhookEventName(body);

  // 2. Allow Mayar Dashboard "Test URL" ping to pass with HTTP 200
  if (eventName === 'testing' || eventName === 'test' || (!eventName && !body.data)) {
    sendJson(res, 200, { ok: true, event: eventName || 'testing', message: 'Webhook endpoint aktif.' });
    return;
  }

  // Only process successful payment events
  if (eventName && eventName !== 'payment.received') {
    sendJson(res, 200, { ok: true, ignored: true, event: eventName });
    return;
  }

  const { client: supabaseAdmin, error: supaErr } = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    sendJson(res, 500, { ok: false, error: supaErr });
    return;
  }

  const data = (
    body.data && typeof body.data === 'object' && !Array.isArray(body.data)
      ? (body.data as Record<string, unknown>)
      : body
  ) as Record<string, unknown>;

  const extraData = (
    data.extraData && typeof data.extraData === 'object' && !Array.isArray(data.extraData)
      ? (data.extraData as Record<string, unknown>)
      : {}
  ) as Record<string, unknown>;

  const webhookStatus =
    typeof data.status === 'string'
      ? data.status.trim().toLowerCase()
      : data.status === true
      ? 'success'
      : '';

  const transactionId =
    (typeof data.transactionId === 'string' && data.transactionId.trim()) ||
    (typeof data.transaction_id === 'string' && data.transaction_id.trim()) ||
    '';

  const invoiceId =
    (typeof data.invoiceId === 'string' && data.invoiceId.trim()) ||
    (typeof data.productId === 'string' && data.productId.trim()) ||
    (typeof data.id === 'string' && data.id.trim()) ||
    '';

  const extraOrderId =
    (typeof extraData.orderId === 'string' && extraData.orderId.trim()) ||
    (typeof extraData.idProd === 'string' && extraData.idProd.trim()) ||
    '';

  const extraOrderNumber =
    (typeof extraData.orderNumber === 'string' && extraData.orderNumber.trim()) ||
    (typeof extraData.noCustomer === 'string' && extraData.noCustomer.trim()) ||
    '';

  const paymentMethod =
    (typeof data.paymentMethod === 'string' && data.paymentMethod.trim()) ||
    (typeof data.payment_method === 'string' && data.payment_method.trim()) ||
    (typeof data.paymentChannel === 'string' && data.paymentChannel.trim()) ||
    (typeof data.channel === 'string' && data.channel.trim()) ||
    null;

  const webhookAmount = Number(data.amount ?? data.nettAmount ?? 0);

  // 3. Locate matching order in Supabase
  let matchedOrder: DbOrderRow | null = null;

  const lookupCandidates: { col: string; val: string }[] = [
    ...(transactionId ? [{ col: 'mayar_transaction_id', val: transactionId }] : []),
    ...(invoiceId ? [{ col: 'mayar_invoice_id', val: invoiceId }] : []),
    ...(extraOrderId ? [{ col: 'id', val: extraOrderId }] : []),
    ...(extraOrderNumber ? [{ col: 'order_number', val: extraOrderNumber }] : []),
  ];

  for (const candidate of lookupCandidates) {
    const { data: found } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq(candidate.col, candidate.val)
      .maybeSingle();

    if (found) {
      matchedOrder = found as DbOrderRow;
      break;
    }
  }

  if (!matchedOrder) {
    sendJson(res, 200, { ok: true, ignored: true, reason: 'order_not_found' });
    return;
  }

  // 4. Verify payment status directly with Mayar API (defense-in-depth against spoofed webhooks)
  let verifiedByMayarApi = false;
  let verifiedMethod = paymentMethod;
  let verifiedPaidAt: string | null = null;
  let verifiedTxId = transactionId || matchedOrder.mayar_transaction_id || null;
  let verifiedInvoiceId = invoiceId || matchedOrder.mayar_invoice_id || null;

  if (apiKey && (verifiedInvoiceId || verifiedTxId)) {
    const apiCheck = await fetchMayarPaymentStatus({
      invoiceId: verifiedInvoiceId,
      transactionId: verifiedTxId,
    });
    if (apiCheck.ok) {
      if (apiCheck.state === 'paid') {
        verifiedByMayarApi = true;
        verifiedMethod = apiCheck.paymentMethod || verifiedMethod;
        verifiedPaidAt = apiCheck.paidAtIso || verifiedPaidAt;
        verifiedTxId = apiCheck.transactionId || verifiedTxId;
        verifiedInvoiceId = apiCheck.invoiceId || verifiedInvoiceId;
      } else if (apiCheck.state === 'unpaid' || apiCheck.state === 'expired') {
        sendJson(res, 200, {
          ok: true,
          ignored: true,
          reason: `mayar_api_reports_${apiCheck.state}`,
          orderNumber: matchedOrder.order_number,
        });
        return;
      }
    }
  }

  const webhookIndicatesPaid = ['success', 'paid', 'settled', 'completed'].includes(webhookStatus);
  if (!verifiedByMayarApi && !webhookIndicatesPaid) {
    sendJson(res, 200, {
      ok: true,
      ignored: true,
      reason: `unconfirmed_status_${webhookStatus || 'empty'}`,
    });
    return;
  }

  if (webhookAmount > 0 && webhookAmount < matchedOrder.total) {
    sendJson(res, 400, {
      ok: false,
      error: `Nominal pembayaran (${webhookAmount}) kurang dari total order (${matchedOrder.total}).`,
    });
    return;
  }

  // 5. Confirm payment atomically (updates status='paid', paid_at, mayar_verified_at, & stock consistency)
  const confirmed = await confirmOrderPaidInSupabase(supabaseAdmin, matchedOrder.id, {
    invoiceId: verifiedInvoiceId,
    transactionId: verifiedTxId,
    paymentStatus: 'paid',
    paymentMethod: verifiedMethod,
    paidAtIso: verifiedPaidAt || new Date().toISOString(),
    rawPayload: body,
  });

  if (confirmed.error || !confirmed.order) {
    sendJson(res, 500, { ok: false, error: confirmed.error || 'Gagal menyimpan konfirmasi Mayar.' });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    verified: true,
    verifiedByMayarApi,
    orderNumber: confirmed.order.order_number,
    status: confirmed.order.status,
    mayarVerifiedAt: confirmed.order.mayar_verified_at,
  });
}
