import { GoogleGenAI } from '@google/genai';

export const FREE_GEMINI_MODELS = [
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
];

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

export function getCustomerGeminiKey(): string {
  return (process.env.CS_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();
}

export function getAdminGeminiKey(): string {
  return (process.env.ADMIN_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();
}

export async function callGeminiWithFallback(params: {
  apiKey: string;
  contents: { role: 'user' | 'model'; parts: { text: string }[] }[];
  systemInstruction: string;
  temperature: number;
  maxOutputTokens: number;
  logLabel: string;
}): Promise<{ text?: string; modelUsed?: string; error?: string; statusCode?: number }> {
  const ai = new GoogleGenAI({ apiKey: params.apiKey });
  let lastErrorMsg = '';

  for (const model of FREE_GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          temperature: params.temperature,
          maxOutputTokens: params.maxOutputTokens,
        },
      });

      const rawText = (response.text || '').trim();
      if (!rawText) {
        lastErrorMsg = 'Respons AI kosong.';
        continue;
      }

      return {
        text: sanitizeAiReply(rawText),
        modelUsed: model,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      lastErrorMsg = msg;
      console.warn(`[${params.logLabel}] Model ${model} gagal:`, msg);
      if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
        return {
          statusCode: 502,
          error: 'Konfigurasi API key AI di server tidak valid.',
        };
      }
      continue;
    }
  }

  if (lastErrorMsg.includes('429') || lastErrorMsg.includes('RESOURCE_EXHAUSTED')) {
    return {
      statusCode: 429,
      error: 'Layanan AI sedang sibuk karena batas kuota sementara. Silakan coba lagi beberapa saat lagi.',
    };
  }

  return {
    statusCode: 502,
    error: 'Maaf, asisten AI sedang mengalami gangguan koneksi. Silakan coba lagi sebentar lagi.',
  };
}

/**
 * Lightweight per-instance sliding-window rate limiter to protect AI endpoints from burst abuse.
 * Note: For multi-instance deployments, back rate limiting with a shared store (e.g. Upstash Redis).
 */
const rateLimitBuckets = new Map<string, number[]>();

export function checkRateLimit(
  bucketKey: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const existing = (rateLimitBuckets.get(bucketKey) || []).filter((ts) => ts > cutoff);

  if (existing.length >= maxRequests) {
    const oldest = existing[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    rateLimitBuckets.set(bucketKey, existing);
    return { allowed: false, retryAfterSec };
  }

  existing.push(now);
  rateLimitBuckets.set(bucketKey, existing);

  // Periodic cleanup to avoid unbounded map growth
  if (rateLimitBuckets.size > 1000) {
    for (const [k, timestamps] of rateLimitBuckets.entries()) {
      const recent = timestamps.filter((ts) => ts > cutoff);
      if (recent.length === 0) rateLimitBuckets.delete(k);
      else rateLimitBuckets.set(k, recent);
    }
  }

  return { allowed: true, retryAfterSec: 0 };
}
