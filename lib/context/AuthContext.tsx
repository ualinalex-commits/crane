import React, { createContext, useContext, useReducer } from 'react';
import type { User, Site } from '../types';
import { mockUsers, mockSites } from '../mock';

interface AuthState {
  user: User | null;
  site: Site | null;
}

type AuthAction =
  | { type: 'LOGIN'; userId: string; siteId: string }
  | { type: 'SWITCH_SITE'; siteId: string }
  | { type: 'LOGOUT' };

interface AuthContextValue extends AuthState {
  login: (userId: string, siteId: string) => void;
  switchSite: (siteId: string) => void;
  logout: () => void;
  availableSites: Site[];
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN': {
      const user = mockUsers.find((u) => u.id === action.userId) ?? null;
      const site = mockSites.find((s) => s.id === action.siteId) ?? null;
      return { user, site };
    }
    case 'SWITCH_SITE': {
      const site = mockSites.find((s) => s.id === action.siteId) ?? null;
      return { ...state, site };
    }
    case 'LOGOUT':
      return { user: null, site: null };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { user: null, site: null });

  const value: AuthContextValue = {
    ...state,
    availableSites: mockSites,
    login: (userId, siteId) => dispatch({ type: 'LOGIN', userId, siteId }),
    switchSite: (siteId) => dispatch({ type: 'SWITCH_SITE', siteId }),
    logout: () => dispatch({ type: 'LOGOUT' }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
