import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.SUPABASE_PROJECT_URL || import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey =
  import.meta.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
