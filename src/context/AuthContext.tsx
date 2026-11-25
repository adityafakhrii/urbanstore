import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, getOAuthRedirectUrl } from '../lib/supabase';
import type { UserProfile, UserRole } from '../services/supabaseService';

const OAUTH_REDIRECT_STORAGE_KEY = 'urbanstore_oauth_redirect';

export function savePendingOAuthRedirect(path: string | null) {
  try {
    if (path && path.startsWith('/') && !path.startsWith('//')) {
      sessionStorage.setItem(OAUTH_REDIRECT_STORAGE_KEY, path);
    } else {
      sessionStorage.removeItem(OAUTH_REDIRECT_STORAGE_KEY);
    }
  } catch {
    // Ignore sessionStorage restriction errors
  }
}

export function consumePendingOAuthRedirect(): string | null {
  try {
    const val = sessionStorage.getItem(OAUTH_REDIRECT_STORAGE_KEY);
    sessionStorage.removeItem(OAUTH_REDIRECT_STORAGE_KEY);
    if (val && val.startsWith('/') && !val.startsWith('//')) {
      return val;
    }
    return null;
  } catch {
    return null;
  }
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isAdmin: boolean;
  isCustomer: boolean;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: (redirectPath?: string | null) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (
    updates: Partial<Omit<UserProfile, 'id' | 'email' | 'role'>>
  ) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PROFILE_SELECT_COLS =
  'id, email, full_name, whatsapp, role, default_province, default_city, default_district, default_address, default_postal_code';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const profileRef = useRef<UserProfile | null>(null);

  const setProfileState = useCallback((next: UserProfile | null) => {
    profileRef.current = next;
    setProfile(next);
  }, []);

  const loadProfile = useCallback(
    async (authUser: User | null) => {
      if (!authUser || !supabase) {
        setProfileState(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT_COLS)
        .eq('id', authUser.id)
        .maybeSingle();

      if (data && !error) {
        setProfileState(data as UserProfile);
        return;
      }

      // Fallback RPC if profile row was not yet created by trigger
      const ensured = await supabase.rpc('ensure_user_profile');
      if (ensured.data && !ensured.error) {
        setProfileState(ensured.data as UserProfile);
        return;
      }

      const metaName =
        (authUser.user_metadata?.full_name as string) ||
        (authUser.user_metadata?.name as string) ||
        '';

      setProfileState({
        id: authUser.id,
        email: authUser.email || '',
        full_name: metaName,
        whatsapp: (authUser.user_metadata?.whatsapp as string) || '',
        role: 'customer',
        default_province: '',
        default_city: '',
        default_district: '',
        default_address: '',
        default_postal_code: '',
      });
    },
    [setProfileState]
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const syncSession = async (sessionUser: User | null) => {
      if (!mounted) return;
      setUser(sessionUser);
      if (sessionUser) {
        await loadProfile(sessionUser);
      } else {
        setProfileState(null);
      }
      if (mounted) setLoading(false);
    };

    supabase.auth
      .getSession()
      .then(({ data }) => syncSession(data.session?.user ?? null))
      .catch(() => {
        if (mounted) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null;

      if (event === 'SIGNED_OUT' || !nextUser) {
        setUser(null);
        setProfileState(null);
        setLoading(false);
        return;
      }

      // Avoid flashing routes/403 while profile & role for a newly signed-in user are still loading
      if (profileRef.current?.id !== nextUser.id) {
        setLoading(true);
      }
      void syncSession(nextUser);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile, setProfileState]);

  const signInWithGoogle = async (redirectPath?: string | null): Promise<{ error?: string }> => {
    if (!supabase) return { error: 'Supabase belum terkonfigurasi.' };

    savePendingOAuthRedirect(redirectPath ?? null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getOAuthRedirectUrl('/auth/callback'),
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      savePendingOAuthRedirect(null);
      return { error: error.message };
    }

    return {};
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfileState(null);
  };

  const refreshProfile = async () => {
    await loadProfile(user);
  };

  const updateProfile = async (
    updates: Partial<Omit<UserProfile, 'id' | 'email' | 'role'>>
  ): Promise<{ error?: string }> => {
    if (!supabase || !user) return { error: 'Kamu belum masuk.' };
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) return { error: error.message };
    await loadProfile(user);
    return {};
  };

  const role: UserRole | null = user ? profile?.role ?? 'customer' : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin: role === 'admin',
        isCustomer: role === 'customer',
        loading,
        isConfigured: isSupabaseConfigured,
        signInWithGoogle,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
