import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { User, Site } from '../types';

interface AuthState {
  user: User | null;
  site: Site | null;
  availableSites: Site[];
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  /** Step 1: send an 8-digit PIN to the given email address.
   *  Throws `'not_found'` if the email is not in public.profiles. */
  requestPin: (email: string) => Promise<void>;
  /** Step 2: verify the PIN and establish a Supabase session. */
  verifyPin: (email: string, pin: string) => Promise<void>;
  switchSite: (siteId: string) => void;
  logout: () => Promise<void>;
}

async function fetchProfileAndSites(userId: string): Promise<{ user: User; sites: Site[] }> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, company_id, active, user_sites(site_id)')
    .eq('id', userId)
    .single();

  if (error || !profile) throw error ?? new Error('Profile not found');

  const siteIds = (profile.user_sites as { site_id: string }[]).map((us) => us.site_id);

  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .in('id', siteIds);

  if (sitesError) throw sitesError;

  return {
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      siteIds,
      companyId: profile.company_id ?? undefined,
      active: profile.active,
    },
    sites: (sites ?? []) as Site[],
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    site: null,
    availableSites: [],
    loading: true,
  });

  // Restore session on app launch
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const { user, sites } = await fetchProfileAndSites(session.user.id);
          setState({ user, site: sites[0] ?? null, availableSites: sites, loading: false });
        } catch {
          setState((s) => ({ ...s, loading: false }));
        }
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setState({ user: null, site: null, availableSites: [], loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    ...state,

    requestPin: async (email) => {
      const { data, error } = await supabase.functions.invoke('request-pin', {
        body: { email: email.toLowerCase().trim() },
      });
      if (error) throw error;
      if (data?.error === 'not_found') throw new Error('not_found');
      if (data?.error) throw new Error(data.error);
    },

    verifyPin: async (email, pin) => {
      const { data, error } = await supabase.functions.invoke('verify-pin', {
        body: { email: email.toLowerCase().trim(), pin: pin.trim() },
      });
      if (error) throw error;
      if (data?.error === 'expired_pin') throw new Error('expired_pin');
      if (data?.error === 'invalid_pin') throw new Error('invalid_pin');
      if (data?.error) throw new Error(data.error);

      // Exchange the magic-link token for a live session
      const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.token,
        type: 'magiclink',
      });
      if (otpError) throw otpError;

      const { user: profileUser, sites } = await fetchProfileAndSites(otpData.user!.id);
      setState({ user: profileUser, site: sites[0] ?? null, availableSites: sites, loading: false });
    },

    switchSite: (siteId) => {
      const site = state.availableSites.find((s) => s.id === siteId) ?? null;
      setState((s) => ({ ...s, site }));
    },

    logout: async () => {
      await supabase.auth.signOut();
      setState({ user: null, site: null, availableSites: [], loading: false });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
