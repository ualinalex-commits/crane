import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../supabase';
import type { User, Site } from '../types';

// SecureStore is native-only; fall back to localStorage on web.
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

const STORAGE_KEY = 'crane_session';

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
  /** Step 2: verify the PIN; stores the user profile locally on success. */
  verifyPin: (email: string, pin: string) => Promise<void>;
  switchSite: (siteId: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    site: null,
    availableSites: [],
    loading: true,
  });

  // Restore session from storage on app launch
  useEffect(() => {
    storage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const { user, sites } = JSON.parse(raw) as { user: User; sites: Site[] };
          setState({ user, site: sites[0] ?? null, availableSites: sites, loading: false });
        } else {
          setState((s) => ({ ...s, loading: false }));
        }
      })
      .catch(() => {
        setState((s) => ({ ...s, loading: false }));
      });
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
      if (error) {
        // FunctionsHttpError carries the raw Response on .context — extract the
        // app-level error code before falling back to a generic throw.
        const body = await (error as any).context?.json().catch(() => null);
        if (body?.error) throw new Error(body.error);
        throw error;
      }
      if (data?.error === 'expired_pin') throw new Error('expired_pin');
      if (data?.error === 'invalid_pin') throw new Error('invalid_pin');
      if (data?.error) throw new Error(data.error);

      const { user, sites } = data as { user: User; sites: Site[] };
      await storage.setItem(STORAGE_KEY, JSON.stringify({ user, sites }));
      setState({ user, site: sites[0] ?? null, availableSites: sites, loading: false });
    },

    switchSite: (siteId) => {
      const site = state.availableSites.find((s) => s.id === siteId) ?? null;
      setState((s) => ({ ...s, site }));
    },

    logout: async () => {
      await storage.deleteItem(STORAGE_KEY);
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
