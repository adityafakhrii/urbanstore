import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type ApiRequest = IncomingMessage & {
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

export type ApiResponse = ServerResponse & {
  status?: (code: number) => ApiResponse;
  json?: (payload: unknown) => void;
};

export interface DbOrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string;
  size: string;
  color: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface DbOrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  full_name: string;
  email: string;
  whatsapp: string;
  province: string;
  city: string;
  district: string;
  address: string;
  postal_code: string;
  delivery_notes: string;
  courier: 'free' | 'reguler' | 'sameday' | 'instant';
  payment_method: string;
  payment_gateway?: string | null;
  promo_code: string | null;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  total: number;
  status: string;
  payment_expires_at: string;
  paid_at: string | null;
  mayar_invoice_id?: string | null;
  mayar_transaction_id?: string | null;
  mayar_payment_link?: string | null;
  mayar_payment_status?: string | null;
  mayar_payment_method?: string | null;
  mayar_verified_at?: string | null;
  order_items?: DbOrderItem[];
}

export function sendJson(res: ApiResponse, statusCode: number, payload: unknown): void {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    const nextRes = res.status(statusCode);
    if (typeof nextRes.json === 'function') {
      nextRes.json(payload);
      return;
    }
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

const DEFAULT_MAX_BODY_BYTES = 64 * 1024; // 64 KB

function createPayloadTooLargeError(): Error & { statusCode: number } {
  const err = new Error('Payload terlalu besar.') as Error & { statusCode: number };
  err.statusCode = 413;
  return err;
}

export async function readJsonBody(
  req: ApiRequest,
  maxBytes = DEFAULT_MAX_BODY_BYTES
): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    const serializedLen = Buffer.byteLength(JSON.stringify(req.body), 'utf8');
    if (serializedLen > maxBytes) {
      throw createPayloadTooLargeError();
    }
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string') {
    if (Buffer.byteLength(req.body, 'utf8') > maxBytes) {
      throw createPayloadTooLargeError();
    }
    try {
      const parsed = JSON.parse(req.body);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (Buffer.isBuffer(req.body)) {
    if (req.body.length > maxBytes) {
      throw createPayloadTooLargeError();
    }
    try {
      const parsed = JSON.parse(req.body.toString('utf8'));
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let settled = false;

    req.on('data', (chunk: Buffer | string) => {
      if (settled) return;
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      totalBytes += buf.length;
      if (totalBytes > maxBytes) {
        settled = true;
        reject(createPayloadTooLargeError());
        return;
      }
      chunks.push(buf);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolve(parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => {
      if (settled) return;
      settled = true;
      resolve({});
    });
  });
}

function normalizeOrigin(raw: string): string | null {
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function isLocalDevOrigin(origin: string): boolean {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

function getAllowedOrigins(): string[] {
  const candidates: string[] = [];
  const addRaw = (val?: string) => {
    if (!val) return;
    const trimmed = val.trim();
    if (!trimmed || trimmed === 'MY_APP_URL') return;
    const normalized = normalizeOrigin(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    );
    if (normalized) candidates.push(normalized);
  };

  addRaw(process.env.APP_URL);
  addRaw(process.env.VITE_APP_URL);
  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach((entry) => addRaw(entry));
  }
  addRaw(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  addRaw(process.env.VERCEL_URL);
  addRaw('https://urbanstore-vcb.vercel.app');

  return Array.from(new Set(candidates));
}

export function getQueryParam(req: ApiRequest, key: string): string | null {
  if (req.query && req.query[key] !== undefined) {
    const val = req.query[key];
    return Array.isArray(val) ? val[0] ?? null : val ?? null;
  }
  if (req.url) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      return parsed.searchParams.get(key);
    } catch {
      return null;
    }
  }
  return null;
}

export function getRequestOrigin(req: ApiRequest): string {
  const allowlist = getAllowedOrigins();
  const isProd = process.env.NODE_ENV === 'production';

  const originHeader = req.headers.origin;
  if (typeof originHeader === 'string') {
    const normalized = normalizeOrigin(originHeader);
    if (normalized && (allowlist.includes(normalized) || (!isProd && isLocalDevOrigin(normalized)))) {
      return normalized;
    }
  }

  const hostHeader = req.headers.host;
  if (typeof hostHeader === 'string' && hostHeader.trim()) {
    const proto = hostHeader.includes('localhost') || hostHeader.startsWith('127.0.0.1') ? 'http' : 'https';
    const normalizedHost = normalizeOrigin(`${proto}://${hostHeader.trim()}`);
    if (
      normalizedHost &&
      (allowlist.includes(normalizedHost) || (!isProd && isLocalDevOrigin(normalizedHost)))
    ) {
      return normalizedHost;
    }
  }

  return allowlist[0] || 'https://urbanstore-vcb.vercel.app';
}

export async function authorizeOrderAccess(
  req: ApiRequest,
  supabaseAdmin: SupabaseClient,
  order: DbOrderRow,
  suppliedOrderId?: string
): Promise<{ authorized: boolean; statusCode?: number; error?: string }> {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (token) {
    const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (!authErr && authData.user) {
      if (order.user_id && authData.user.id === order.user_id) {
        return { authorized: true };
      }

      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileData?.role === 'admin') {
        return { authorized: true };
      }
    }
  }

  if (order.user_id) {
    return {
      authorized: false,
      statusCode: token ? 403 : 401,
      error: token
        ? 'Anda tidak memiliki akses ke pesanan ini.'
        : 'Autentikasi diperlukan untuk mengakses pesanan ini.',
    };
  }

  // Guest order (user_id IS NULL): require exact secret order UUID (order.id), not only guessable order_number
  const trimmedId = (suppliedOrderId || '').trim();
  if (trimmedId && timingSafeEqualStrings(trimmedId, order.id)) {
    return { authorized: true };
  }

  return {
    authorized: false,
    statusCode: 403,
    error: 'Akses pesanan ditolak. Diperlukan ID pesanan yang valid.',
  };
}

export function getSupabaseAdminClient(): { client?: SupabaseClient; error?: string } {
  const url = (
    process.env.SUPABASE_PROJECT_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !serviceRoleKey) {
    return {
      error:
        'Konfigurasi server Supabase belum lengkap. Pastikan SUPABASE_PROJECT_URL dan SUPABASE_SERVICE_ROLE_KEY sudah diisi di environment server.',
    };
  }

  return {
    client: createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
  };
}

export function getMayarConfig(): {
  apiKey: string;
  baseUrl: string;
  env: 'production' | 'sandbox';
  webhookToken: string;
} {
  const apiKey = (process.env.MAYAR_API_KEY || '').trim();
  const rawEnv = (process.env.MAYAR_ENV || 'production').trim().toLowerCase();
  const env: 'production' | 'sandbox' = rawEnv === 'sandbox' ? 'sandbox' : 'production';
  const customBaseUrl = (process.env.MAYAR_BASE_URL || '').trim().replace(/\/+$/, '');
  const baseUrl =
    customBaseUrl || (env === 'sandbox' ? 'https://api.mayar.io/hl/v2' : 'https://api.mayar.id/hl/v2');
  const webhookToken = (process.env.MAYAR_WEBHOOK_TOKEN || '').trim();

  return { apiKey, baseUrl, env, webhookToken };
}

export function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function normalizeIndonesianMobile(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('62') && digits.length >= 11) {
    return `0${digits.slice(2)}`;
  }
  if (digits.length >= 10) {
    return digits;
  }
  return digits.padEnd(10, '0');
}

function buildFallbackUrl(baseUrl: string, primaryPath: string, fallbackPath: string): string[] {
  const urls = [`${baseUrl}${primaryPath}`];
  const v1Base = baseUrl.replace(/\/hl\/v2$/i, '/hl/v1');
  if (fallbackPath !== primaryPath) {
    urls.push(`${baseUrl}${fallbackPath}`);
  }
  if (v1Base !== baseUrl) {
    urls.push(`${v1Base}${fallbackPath}`);
  }
  return Array.from(new Set(urls));
}

async function fetchMayarJson(
  method: 'GET' | 'POST',
  candidateUrls: string[],
  apiKey: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; data: Record<string, unknown>; error?: string }> {
  let lastStatus = 500;
  let lastData: Record<string, unknown> = {};
  let lastError = 'Gagal menghubungi API Mayar.id.';

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });

      const rawText = await response.text();
      let parsed: Record<string, unknown> = {};
      try {
        const json = JSON.parse(rawText);
        if (json && typeof json === 'object') {
          parsed = json as Record<string, unknown>;
        }
      } catch {
        parsed = { raw: rawText };
      }

      lastStatus = response.status;
      lastData = parsed;

      if (response.ok) {
        return { ok: true, status: response.status, data: parsed };
      }

      const message =
        (typeof parsed.messages === 'string' && parsed.messages) ||
        (typeof parsed.message === 'string' && parsed.message) ||
        (typeof parsed.error === 'string' && parsed.error) ||
        `HTTP ${response.status}`;
      lastError = message;

      // Only try next candidate path when route is 404/405
      if (response.status !== 404 && response.status !== 405) {
        return { ok: false, status: response.status, data: parsed, error: message };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Koneksi ke Mayar.id gagal.';
    }
  }

  return { ok: false, status: lastStatus, data: lastData, error: lastError };
}

function parseTimestampToIso(val: unknown): string | null {
  if (typeof val === 'number' && Number.isFinite(val)) {
    const ms = val < 1e12 ? val * 1000 : val;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof val === 'string' && val.trim()) {
    const numeric = Number(val);
    if (!Number.isNaN(numeric) && /^\d+$/.test(val.trim())) {
      return parseTimestampToIso(numeric);
    }
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

export async function createMayarInvoice(order: DbOrderRow, redirectUrl: string): Promise<{
  ok: boolean;
  invoiceId?: string;
  transactionId?: string;
  paymentLink?: string;
  expiredAtIso?: string;
  raw?: Record<string, unknown>;
  error?: string;
}> {
  const { apiKey, baseUrl } = getMayarConfig();
  if (!apiKey) {
    return {
      ok: false,
      error:
        'MAYAR_API_KEY belum dikonfigurasi di server. Tambahkan MAYAR_API_KEY pada .env / Vercel Environment Variables.',
    };
  }

  const expiresDate = new Date(order.payment_expires_at);
  const safeExpiredAt =
    Number.isNaN(expiresDate.getTime()) || expiresDate.getTime() <= Date.now() + 60_000
      ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
      : expiresDate.toISOString();

  // Build Mayar line items so sum(quantity * rate) ALWAYS equals order.total
  const orderItems = order.order_items || [];
  let mayarItems: { quantity: number; rate: number; description: string }[] = [];

  if (order.discount === 0 && orderItems.length > 0) {
    mayarItems = orderItems.map((item) => ({
      quantity: Math.max(1, Number(item.quantity) || 1),
      rate: Math.max(0, Math.round(Number(item.unit_price) || 0)),
      description: `${item.product_name} (${item.color}, Size ${item.size})`,
    }));
    if (order.shipping_cost > 0) {
      mayarItems.push({
        quantity: 1,
        rate: Math.round(order.shipping_cost),
        description: `Ongkos Kirim (${order.courier === 'free' ? 'Ambil di Tempat' : order.courier.toUpperCase()})`,
      });
    }
  }

  const computedSum = mayarItems.reduce((acc, i) => acc + i.quantity * i.rate, 0);
  if (mayarItems.length === 0 || computedSum !== Math.round(order.total)) {
    const itemCount = orderItems.reduce((sum, i) => sum + i.quantity, 0) || 1;
    const promoNote = order.promo_code ? ` · Promo ${order.promo_code}` : '';
    mayarItems = [
      {
        quantity: 1,
        rate: Math.max(100, Math.round(order.total)),
        description: `UrbanStore Order #${order.order_number} (${itemCount} item${promoNote})`,
      },
    ];
  }

  const payload = {
    name: order.full_name.trim() || 'Pelanggan UrbanStore',
    email: order.email.trim(),
    mobile: normalizeIndonesianMobile(order.whatsapp),
    redirectUrl,
    description: `Pembayaran Pesanan UrbanStore #${order.order_number}`,
    expiredAt: safeExpiredAt,
    items: mayarItems,
    extraData: {
      noCustomer: order.order_number,
      idProd: order.id,
      orderNumber: order.order_number,
      orderId: order.id,
    },
  };

  const urls = buildFallbackUrl(baseUrl, '/invoices/create', '/invoice/create');
  const res = await fetchMayarJson('POST', urls, apiKey, payload);

  if (!res.ok) {
    return {
      ok: false,
      raw: res.data,
      error: `Mayar.id menolak pembuatan invoice: ${res.error || 'Unknown error'}`,
    };
  }

  const inner = (res.data.data && typeof res.data.data === 'object'
    ? (res.data.data as Record<string, unknown>)
    : res.data) as Record<string, unknown>;

  const invoiceId = typeof inner.id === 'string' ? inner.id : undefined;
  const transactionId =
    typeof inner.transactionId === 'string'
      ? inner.transactionId
      : typeof inner.transaction_id === 'string'
      ? inner.transaction_id
      : undefined;
  const paymentLink =
    typeof inner.link === 'string'
      ? inner.link
      : typeof inner.paymentUrl === 'string'
      ? inner.paymentUrl
      : typeof inner.payment_url === 'string'
      ? inner.payment_url
      : undefined;

  if (!paymentLink) {
    return {
      ok: false,
      raw: res.data,
      error: 'Response Mayar.id tidak menyertakan link pembayaran.',
    };
  }

  const expiredAtIso = parseTimestampToIso(inner.expiredAt) || safeExpiredAt;

  return {
    ok: true,
    invoiceId,
    transactionId,
    paymentLink,
    expiredAtIso,
    raw: res.data,
  };
}

export interface MayarStatusResult {
  ok: boolean;
  state: 'paid' | 'unpaid' | 'expired' | 'unknown';
  rawStatus: string;
  invoiceId?: string;
  transactionId?: string;
  paymentMethod?: string;
  paidAtIso?: string;
  raw?: Record<string, unknown>;
  error?: string;
}

const PAID_STATUS_KEYWORDS = new Set(['paid', 'settled', 'success', 'succeeded', 'completed']);
const EXPIRED_STATUS_KEYWORDS = new Set(['expired', 'cancelled', 'canceled', 'void', 'failed']);

function inspectMayarObject(obj: Record<string, unknown>): {
  state: 'paid' | 'unpaid' | 'expired' | 'unknown';
  rawStatus: string;
  invoiceId?: string;
  transactionId?: string;
  paymentMethod?: string;
  paidAtIso?: string;
} {
  const data =
    obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)
      ? (obj.data as Record<string, unknown>)
      : obj;

  const rawStatusVal = data.status;
  const rawStatus =
    typeof rawStatusVal === 'string'
      ? rawStatusVal.trim().toLowerCase()
      : rawStatusVal === true
      ? 'paid'
      : '';

  const invoiceId =
    (typeof data.invoiceId === 'string' && data.invoiceId) ||
    (typeof data.productId === 'string' && data.productId) ||
    (typeof data.id === 'string' && data.id) ||
    undefined;

  let transactionId =
    (typeof data.transactionId === 'string' && data.transactionId) ||
    (typeof data.transaction_id === 'string' && data.transaction_id) ||
    undefined;

  let paymentMethod =
    (typeof data.paymentMethod === 'string' && data.paymentMethod) ||
    (typeof data.payment_method === 'string' && data.payment_method) ||
    (typeof data.paymentChannel === 'string' && data.paymentChannel) ||
    (typeof data.channel === 'string' && data.channel) ||
    undefined;

  let paidAtIso =
    parseTimestampToIso(data.paidAt) ||
    parseTimestampToIso(data.paid_at) ||
    parseTimestampToIso(data.updatedAt) ||
    undefined;

  // Check nested transactions array on Mayar Invoice detail responses
  if (Array.isArray(data.transactions)) {
    for (const entry of data.transactions) {
      if (!entry || typeof entry !== 'object') continue;
      const tx = entry as Record<string, unknown>;
      const txStatus =
        typeof tx.status === 'string'
          ? tx.status.trim().toLowerCase()
          : tx.status === true
          ? 'paid'
          : '';
      const txIsPaid = tx.isPaid === true || PAID_STATUS_KEYWORDS.has(txStatus);
      if (txIsPaid) {
        transactionId =
          (typeof tx.id === 'string' && tx.id) ||
          (typeof tx.transactionId === 'string' && tx.transactionId) ||
          transactionId;
        paymentMethod =
          (typeof tx.paymentMethod === 'string' && tx.paymentMethod) ||
          (typeof tx.payment_method === 'string' && tx.payment_method) ||
          (typeof tx.paymentChannel === 'string' && tx.paymentChannel) ||
          paymentMethod;
        paidAtIso =
          parseTimestampToIso(tx.paidAt) ||
          parseTimestampToIso(tx.updatedAt) ||
          parseTimestampToIso(tx.createdAt) ||
          paidAtIso;

        return {
          state: 'paid',
          rawStatus: txStatus || 'paid',
          invoiceId,
          transactionId,
          paymentMethod,
          paidAtIso,
        };
      }
    }
  }

  if (data.isPaid === true || PAID_STATUS_KEYWORDS.has(rawStatus)) {
    return {
      state: 'paid',
      rawStatus: rawStatus || 'paid',
      invoiceId,
      transactionId,
      paymentMethod,
      paidAtIso,
    };
  }

  if (EXPIRED_STATUS_KEYWORDS.has(rawStatus)) {
    return {
      state: 'expired',
      rawStatus,
      invoiceId,
      transactionId,
      paymentMethod,
      paidAtIso,
    };
  }

  const expiredAtIso = parseTimestampToIso(data.expiredAt);
  if (expiredAtIso && new Date(expiredAtIso).getTime() <= Date.now()) {
    return {
      state: 'expired',
      rawStatus: rawStatus || 'expired',
      invoiceId,
      transactionId,
      paymentMethod,
      paidAtIso,
    };
  }

  if (rawStatus === 'unpaid' || rawStatus === 'active' || rawStatus === 'pending' || rawStatus === 'open') {
    return {
      state: 'unpaid',
      rawStatus,
      invoiceId,
      transactionId,
      paymentMethod,
      paidAtIso,
    };
  }

  return {
    state: 'unknown',
    rawStatus: rawStatus || 'unknown',
    invoiceId,
    transactionId,
    paymentMethod,
    paidAtIso,
  };
}

export async function fetchMayarPaymentStatus(params: {
  invoiceId?: string | null;
  transactionId?: string | null;
}): Promise<MayarStatusResult> {
  const { apiKey, baseUrl } = getMayarConfig();
  if (!apiKey) {
    return {
      ok: false,
      state: 'unknown',
      rawStatus: 'unconfigured',
      error: 'MAYAR_API_KEY belum dikonfigurasi di server.',
    };
  }

  let latestResult: MayarStatusResult | null = null;

  if (params.invoiceId) {
    const invUrls = buildFallbackUrl(
      baseUrl,
      `/invoices/${encodeURIComponent(params.invoiceId)}`,
      `/invoice/${encodeURIComponent(params.invoiceId)}`
    );
    const invRes = await fetchMayarJson('GET', invUrls, apiKey);
    if (invRes.ok) {
      const inspected = inspectMayarObject(invRes.data);
      latestResult = {
        ok: true,
        ...inspected,
        invoiceId: inspected.invoiceId || params.invoiceId,
        transactionId: inspected.transactionId || params.transactionId || undefined,
        raw: invRes.data,
      };
      if (inspected.state === 'paid') {
        return latestResult;
      }
    }
  }

  if (params.transactionId) {
    const txUrls = buildFallbackUrl(
      baseUrl,
      `/transactions/${encodeURIComponent(params.transactionId)}`,
      `/transaction/${encodeURIComponent(params.transactionId)}`
    );
    const txRes = await fetchMayarJson('GET', txUrls, apiKey);
    if (txRes.ok) {
      const inspected = inspectMayarObject(txRes.data);
      const txResult: MayarStatusResult = {
        ok: true,
        ...inspected,
        invoiceId: inspected.invoiceId || params.invoiceId || undefined,
        transactionId: inspected.transactionId || params.transactionId,
        raw: txRes.data,
      };
      if (txResult.state === 'paid' || !latestResult || latestResult.state === 'unknown') {
        return txResult;
      }
    }
  }

  if (latestResult) return latestResult;

  return {
    ok: false,
    state: 'unknown',
    rawStatus: 'unreachable',
    error: 'Tidak dapat memverifikasi status transaksi dari Mayar.id saat ini.',
  };
}

export async function confirmOrderPaidInSupabase(
  supabaseAdmin: SupabaseClient,
  orderId: string,
  details: {
    invoiceId?: string | null;
    transactionId?: string | null;
    paymentStatus?: string;
    paymentMethod?: string | null;
    paidAtIso?: string | null;
    rawPayload?: Record<string, unknown> | null;
  }
): Promise<{ order?: DbOrderRow; error?: string }> {
  const rpcRes = await supabaseAdmin.rpc('confirm_mayar_payment', {
    p_order_id: orderId,
    p_mayar_invoice_id: details.invoiceId ?? null,
    p_mayar_transaction_id: details.transactionId ?? null,
    p_mayar_payment_status: details.paymentStatus || 'paid',
    p_mayar_payment_method: details.paymentMethod ?? null,
    p_paid_at: details.paidAtIso ?? new Date().toISOString(),
    p_raw_payload: details.rawPayload ?? null,
  });

  if (!rpcRes.error && rpcRes.data) {
    return { order: rpcRes.data as DbOrderRow };
  }

  return { error: rpcRes.error?.message || 'Gagal mengonfirmasi pembayaran di database.' };
}

export async function expireOrderInSupabase(
  supabaseAdmin: SupabaseClient,
  orderId: string,
  details?: {
    paymentStatus?: string;
    rawPayload?: Record<string, unknown> | null;
  }
): Promise<{ order?: DbOrderRow; error?: string }> {
  const rpcRes = await supabaseAdmin.rpc('expire_mayar_order', {
    p_order_id: orderId,
    p_mayar_payment_status: details?.paymentStatus || 'expired',
    p_raw_payload: details?.rawPayload ?? null,
  });

  if (!rpcRes.error && rpcRes.data) {
    return { order: rpcRes.data as DbOrderRow };
  }

  return { error: rpcRes.error?.message || 'Gagal memperbarui status kedaluwarsa di database.' };
}
