import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile, UserRole } from '../services/supabaseService';

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  whatsapp: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isAdmin: boolean;
  isCustomer: boolean;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (params: SignUpParams) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'email' | 'role'>>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);

  const loadProfile = useCallback(async (authUser: User | null) => {
    if (!authUser || !supabase) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, email, full_name, whatsapp, role, default_province, default_city, default_district, default_address, default_postal_code'
      )
      .eq('id', authUser.id)
      .maybeSingle();

    if (error || !data) {
      setProfile({
        id: authUser.id,
        email: authUser.email || '',
        full_name: (authUser.user_metadata?.full_name as string) || '',
        whatsapp: (authUser.user_metadata?.whatsapp as string) || '',
        role: 'customer',
        default_province: '',
        default_city: '',
        default_district: '',
        default_address: '',
        default_postal_code: '',
      });
      return;
    }

    setProfile(data as UserProfile);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        const sessionUser = data.session?.user ?? null;
        setUser(sessionUser);
        await loadProfile(sessionUser);
        if (mounted) setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      void loadProfile(nextUser);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (!supabase) return { error: 'Supabase belum terkonfigurasi.' };
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      return {
        error:
          error.message === 'Invalid login credentials'
            ? 'Email atau password salah. Cek lagi ya!'
            : error.message,
      };
    }
    if (data.user) {
      setUser(data.user);
      await loadProfile(data.user);
    }
    return {};
  };

  const signUp = async ({
    email,
    password,
    fullName,
    whatsapp,
  }: SignUpParams): Promise<{ error?: string; needsEmailConfirmation?: boolean }> => {
    if (!supabase) return { error: 'Supabase belum terkonfigurasi.' };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          whatsapp: whatsapp.trim(),
        },
      },
    });
    if (error) {
      return { error: error.message };
    }
    if (data.user && data.session) {
      setUser(data.user);
      await loadProfile(data.user);
      return { needsEmailConfirmation: false };
    }
    return { needsEmailConfirmation: true };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
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
        signIn,
        signUp,
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
