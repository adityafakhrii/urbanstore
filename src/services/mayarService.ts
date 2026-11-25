import { supabase } from '../lib/supabase';
import type { OrderStatusType } from './supabaseService';

export interface CreateMayarPaymentResponse {
  ok: boolean;
  alreadyPaid?: boolean;
  reused?: boolean;
  expired?: boolean;
  orderNumber?: string;
  status?: OrderStatusType;
  invoiceId?: string;
  transactionId?: string;
  paymentLink?: string;
  expiredAt?: string;
  paidAt?: string | null;
  mayarVerifiedAt?: string | null;
  error?: string;
}

export interface CheckMayarStatusResponse {
  ok: boolean;
  orderId?: string;
  orderNumber?: string;
  status?: OrderStatusType;
  mayarPaymentStatus?: string;
  mayarPaymentMethod?: string | null;
  mayarTransactionId?: string | null;
  mayarInvoiceId?: string | null;
  mayarVerifiedAt?: string | null;
  paidAt?: string | null;
  updated?: boolean;
  error?: string;
}

export interface SyncAllMayarResponse {
  ok: boolean;
  checkedCount?: number;
  paidUpdatedCount?: number;
  expiredUpdatedCount?: number;
  error?: string;
}

function extractErrorMessage(raw: unknown, status: number): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string') return raw.trim() || undefined;
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const msg =
      (typeof obj.message === 'string' && obj.message) ||
      (typeof obj.messages === 'string' && obj.messages) ||
      (typeof obj.error === 'string' && obj.error);
    if (msg) {
      const code = typeof obj.code === 'string' && obj.code ? `[${obj.code}] ` : '';
      return `${code}${msg}`;
    }
    try {
      return JSON.stringify(obj);
    } catch {
      return `Error server (HTTP ${status}).`;
    }
  }
  return String(raw);
}

async function postMayarApi<T extends { ok?: boolean; error?: string }>(
  url: string,
  body: unknown,
  accessToken?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: Record<string, unknown> = {};
  try {
    const json = JSON.parse(text);
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      parsed = json as Record<string, unknown>;
    }
  } catch {
    parsed = {
      ok: false,
      error: `Response server tidak valid (HTTP ${res.status}). Pastikan endpoint /api/mayar aktif.`,
    };
  }

  const normalizedError =
    extractErrorMessage(parsed.error, res.status) ||
    (!res.ok ? extractErrorMessage(parsed.message ?? parsed, res.status) : undefined) ||
    (!res.ok ? `Permintaan ke Mayar gagal (HTTP ${res.status}).` : undefined);

  return {
    ...parsed,
    ok: res.ok && parsed.ok !== false,
    ...(normalizedError ? { error: normalizedError } : {}),
  } as T;
}

async function resolveCurrentAccessToken(): Promise<string | undefined> {
  if (!supabase) return undefined;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  } catch {
    return undefined;
  }
}

export async function createMayarPaymentForOrder(params: {
  orderId?: string;
  orderNumber?: string;
  forceRecreate?: boolean;
}): Promise<CreateMayarPaymentResponse> {
  try {
    const accessToken = await resolveCurrentAccessToken();
    return await postMayarApi<CreateMayarPaymentResponse>(
      '/api/mayar/create-payment',
      params,
      accessToken
    );
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Gagal terhubung ke server pembayaran Mayar.id.',
    };
  }
}

export async function checkMayarPaymentStatus(params: {
  orderId?: string;
  orderNumber?: string;
}): Promise<CheckMayarStatusResponse> {
  try {
    const accessToken = await resolveCurrentAccessToken();
    return await postMayarApi<CheckMayarStatusResponse>(
      '/api/mayar/check-status',
      params,
      accessToken
    );
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Gagal memeriksa status pembayaran Mayar.id.',
    };
  }
}

export async function syncAllPendingMayarOrders(
  accessToken: string
): Promise<SyncAllMayarResponse> {
  try {
    return await postMayarApi<SyncAllMayarResponse>(
      '/api/mayar/check-status',
      { syncAllPending: true },
      accessToken
    );
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Gagal menyinkronkan status pesanan Mayar.id.',
    };
  }
}
