import { supabase } from '../lib/supabase';
import type { Product } from '../data/products';
import type { SizeGuideRow } from './supabaseService';

export const AI_CHAT_DAILY_LIMIT = 5;
const QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface AiQuotaState {
  used: number;
  remaining: number;
  limit: number;
  resetAt: number | null;
  isExhausted: boolean;
}

interface StoredQuota {
  firstChatAt: number;
  count: number;
}

function getQuotaStorageKey(userId?: string | null): string {
  return userId ? `urbanstore_ai_quota_user_${userId}` : 'urbanstore_ai_quota_guest';
}

function getHistoryStorageKey(userId?: string | null): string {
  return userId ? `urbanstore_ai_history_user_${userId}` : 'urbanstore_ai_history_guest';
}

export function loadAiChatHistory(userId?: string | null): AiChatMessage[] {
  try {
    const raw = window.localStorage.getItem(getHistoryStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is AiChatMessage =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.text === 'string' &&
        typeof item.timestamp === 'string'
    );
  } catch {
    return [];
  }
}

export function saveAiChatHistory(messages: AiChatMessage[], userId?: string | null): void {
  try {
    const toStore = messages.filter((m) => m.id !== 'welcome');
    if (toStore.length === 0) {
      window.localStorage.removeItem(getHistoryStorageKey(userId));
      return;
    }
    window.localStorage.setItem(getHistoryStorageKey(userId), JSON.stringify(toStore));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearAiChatHistory(userId?: string | null): void {
  try {
    window.localStorage.removeItem(getHistoryStorageKey(userId));
  } catch {
    // Ignore storage errors
  }
}

export function getAiQuotaState(userId?: string | null): AiQuotaState {
  const key = getQuotaStorageKey(userId);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return {
        used: 0,
        remaining: AI_CHAT_DAILY_LIMIT,
        limit: AI_CHAT_DAILY_LIMIT,
        resetAt: null,
        isExhausted: false,
      };
    }
    const parsed = JSON.parse(raw) as StoredQuota;
    const now = Date.now();
    if (!parsed.firstChatAt || now - parsed.firstChatAt >= QUOTA_WINDOW_MS) {
      window.localStorage.removeItem(key);
      return {
        used: 0,
        remaining: AI_CHAT_DAILY_LIMIT,
        limit: AI_CHAT_DAILY_LIMIT,
        resetAt: null,
        isExhausted: false,
      };
    }

    const used = Math.min(AI_CHAT_DAILY_LIMIT, Math.max(0, parsed.count || 0));
    const remaining = Math.max(0, AI_CHAT_DAILY_LIMIT - used);
    return {
      used,
      remaining,
      limit: AI_CHAT_DAILY_LIMIT,
      resetAt: parsed.firstChatAt + QUOTA_WINDOW_MS,
      isExhausted: remaining === 0,
    };
  } catch {
    return {
      used: 0,
      remaining: AI_CHAT_DAILY_LIMIT,
      limit: AI_CHAT_DAILY_LIMIT,
      resetAt: null,
      isExhausted: false,
    };
  }
}

export function consumeAiQuota(userId?: string | null): AiQuotaState {
  const key = getQuotaStorageKey(userId);
  const now = Date.now();
  try {
    const raw = window.localStorage.getItem(key);
    let next: StoredQuota = { firstChatAt: now, count: 1 };
    if (raw) {
      const parsed = JSON.parse(raw) as StoredQuota;
      if (parsed.firstChatAt && now - parsed.firstChatAt < QUOTA_WINDOW_MS) {
        next = {
          firstChatAt: parsed.firstChatAt,
          count: Math.min(AI_CHAT_DAILY_LIMIT, (parsed.count || 0) + 1),
        };
      }
    }
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return getAiQuotaState(userId);
}

export function formatResetCountdown(
  resetAt: number | null,
  style: 'long' | 'compact' = 'long'
): string {
  if (!resetAt) return '';
  const totalSeconds = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (style === 'compact') {
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(
      secs
    ).padStart(2, '0')}`;
  }

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} jam`);
  if (mins > 0 || hours > 0) parts.push(`${mins} menit`);
  parts.push(`${secs} detik`);
  return parts.join(' ');
}

/**
 * Strips any stray Markdown formatting (*, **, #, `, _) so AI replies stay clean and professional.
 */
export function sanitizeAiReply(rawText: string): string {
  return rawText
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*\*\s+/gm, '- ')
    .replace(/\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function postAiApi<T extends { ok?: boolean; error?: string }>(
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
      error: `Response server AI tidak valid (HTTP ${res.status}).`,
    };
  }

  const errorMessage =
    typeof parsed.error === 'string' && parsed.error.trim()
      ? parsed.error.trim()
      : !res.ok
      ? `Permintaan ke layanan AI gagal (HTTP ${res.status}).`
      : undefined;

  return {
    ...parsed,
    ok: res.ok && parsed.ok !== false,
    ...(errorMessage ? { error: errorMessage } : {}),
  } as T;
}

export async function sendCustomerAiMessage(params: {
  history: AiChatMessage[];
  userMessage: string;
  products: Product[];
  sizeGuides: SizeGuideRow[];
}): Promise<{ reply?: string; modelUsed?: string; error?: string }> {
  try {
    const compactProducts = params.products.map((p) => ({
      name: p.name,
      sku: p.sku,
      category: p.category,
      subcategory: p.subcategory,
      priceFormatted: p.priceFormatted,
      inStock: p.inStock,
      colors: p.colors.map((c) => ({ name: c.name })),
      sizes: p.sizes,
      disabledSizes: p.disabledSizes,
      fabricType: p.fabricType,
      fitScale: p.fitScale,
      fitNote: p.fitNote,
    }));

    const res = await postAiApi<{ ok?: boolean; reply?: string; modelUsed?: string; error?: string }>(
      '/api/ai/chat',
      {
        history: params.history.slice(-8).map((m) => ({ role: m.role, text: m.text })),
        userMessage: params.userMessage,
        products: compactProducts,
        sizeGuides: params.sizeGuides,
      }
    );

    if (!res.ok || !res.reply) {
      return {
        error:
          res.error ||
          'Maaf, asisten AI sedang mengalami gangguan koneksi. Silakan coba lagi sebentar lagi.',
      };
    }

    return {
      reply: sanitizeAiReply(res.reply),
      modelUsed: res.modelUsed,
    };
  } catch {
    return {
      error: 'Maaf, asisten AI sedang mengalami gangguan koneksi. Silakan coba lagi sebentar lagi.',
    };
  }
}

export interface AdminProductDescriptionInput {
  name: string;
  sku?: string;
  priceFormatted: string;
  category: string;
  subcategory: string;
  fabric: string;
  fitScale: string;
  colorName: string;
  sizes: string;
  subtitle?: string;
  fitNote?: string;
  modelInfo?: string;
  fabricDetails?: string;
  careInstructions?: string;
}

async function getAdminAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function generateAdminProductDescription(
  input: AdminProductDescriptionInput
): Promise<{ description?: string; error?: string }> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) {
    return { error: 'Sesi login admin tidak ditemukan. Silakan masuk ulang.' };
  }

  try {
    const res = await postAiApi<{ ok?: boolean; description?: string; error?: string }>(
      '/api/ai/admin',
      { action: 'product-description', input },
      accessToken
    );

    if (!res.ok || !res.description) {
      return { error: res.error || 'Gagal membuat deskripsi AI.' };
    }
    return { description: res.description };
  } catch {
    return { error: 'Gagal terhubung ke server AI admin.' };
  }
}

export interface AdminBusinessInsightInput {
  periodLabel: string;
  netRevenueFormatted: string;
  confirmedOrdersCount: number;
  aovFormatted: string;
  completionRatePct: number;
  expiredOrCancelledCount: number;
  pendingAmountFormatted: string;
  totalUnitsSold: number;
  totalDiscountFormatted: string;
  topCategorySummary: string;
  topRegionSummary: string;
  topProductsSummary: string;
  slowMovingCount: number;
  lowStockVariantsCount: number;
  subscribersCount: number;
}

export async function generateAdminBusinessInsight(
  input: AdminBusinessInsightInput
): Promise<{ insight?: string; error?: string }> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) {
    return { error: 'Sesi login admin tidak ditemukan. Silakan masuk ulang.' };
  }

  try {
    const res = await postAiApi<{ ok?: boolean; insight?: string; error?: string }>(
      '/api/ai/admin',
      { action: 'business-insight', input },
      accessToken
    );

    if (!res.ok || !res.insight) {
      return { error: res.error || 'Gagal menghasilkan analisa bisnis AI.' };
    }
    return { insight: res.insight };
  } catch {
    return { error: 'Gagal terhubung ke server AI admin.' };
  }
}

export interface SavedAiReportInsight {
  id: string;
  createdAtIso: string;
  createdAtLabel: string;
  periodLabel: string;
  netRevenueFormatted: string;
  confirmedOrdersCount: number;
  aovFormatted: string;
  insightText: string;
}

const ADMIN_INSIGHTS_ARCHIVE_KEY = 'urbanstore_admin_ai_insights_v1';

export function loadSavedAiInsights(): SavedAiReportInsight[] {
  try {
    const raw = window.localStorage.getItem(ADMIN_INSIGHTS_ARCHIVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedAiReportInsight =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.insightText === 'string' &&
        typeof item.periodLabel === 'string'
    );
  } catch {
    return [];
  }
}

export function saveAiInsightToArchive(
  entry: Omit<SavedAiReportInsight, 'id' | 'createdAtIso' | 'createdAtLabel'>
): SavedAiReportInsight[] {
  const existing = loadSavedAiInsights();
  const now = new Date();
  const newItem: SavedAiReportInsight = {
    id: `ins-${now.getTime()}`,
    createdAtIso: now.toISOString(),
    createdAtLabel: now.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    ...entry,
  };
  const next = [newItem, ...existing].slice(0, 30);
  try {
    window.localStorage.setItem(ADMIN_INSIGHTS_ARCHIVE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function deleteSavedAiInsight(id: string): SavedAiReportInsight[] {
  const next = loadSavedAiInsights().filter((item) => item.id !== id);
  try {
    window.localStorage.setItem(ADMIN_INSIGHTS_ARCHIVE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors
  }
  return next;
}
