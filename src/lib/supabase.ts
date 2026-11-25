import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.SUPABASE_PROJECT_URL || import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey =
  import.meta.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Resolve OAuth callback URL dynamically from current browser origin
 * so localhost dev and Vercel production both redirect back cleanly.
 */
export function getOAuthRedirectUrl(path = '/auth/callback'): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${normalizedPath}`;
  }
  const configuredAppUrl = (import.meta.env.VITE_APP_URL || '').trim().replace(/\/+$/, '');
  if (configuredAppUrl && configuredAppUrl !== 'MY_APP_URL') {
    return `${configuredAppUrl}${normalizedPath}`;
  }
  return normalizedPath;
}
