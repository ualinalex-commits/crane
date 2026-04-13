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
  login: (email: string, password: string) => Promise<void>;
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
    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { user, sites } = await fetchProfileAndSites(data.user.id);
      setState({ user, site: sites[0] ?? null, availableSites: sites, loading: false });
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
