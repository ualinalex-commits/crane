import React, { createContext, useContext, useReducer } from 'react';
import type { User, Crane, Company } from '../types';
import { mockUsers, mockCranes, mockCompanies } from '../mock';

interface ManagementState {
  users: User[];
  cranes: Crane[];
  companies: Company[];
}

type ManagementAction =
  | { type: 'ADD_USER'; user: User }
  | { type: 'UPDATE_USER'; id: string; changes: Partial<User> }
  | { type: 'DEACTIVATE_USER'; id: string }
  | { type: 'REACTIVATE_USER'; id: string }
  | { type: 'ADD_CRANE'; crane: Crane }
  | { type: 'UPDATE_CRANE'; id: string; changes: Partial<Crane> }
  | { type: 'DEACTIVATE_CRANE'; id: string }
  | { type: 'REACTIVATE_CRANE'; id: string }
  | { type: 'ADD_COMPANY'; company: Company }
  | { type: 'UPDATE_COMPANY'; id: string; changes: Partial<Company> }
  | { type: 'DEACTIVATE_COMPANY'; id: string }
  | { type: 'REACTIVATE_COMPANY'; id: string };

interface ManagementContextValue extends ManagementState {
  getUsersForSite: (siteId: string) => User[];
  getCranesForSite: (siteId: string, activeOnly?: boolean) => Crane[];
  addUser: (data: Omit<User, 'id'>) => void;
  updateUser: (id: string, changes: Partial<User>) => void;
  deactivateUser: (id: string) => void;
  reactivateUser: (id: string) => void;
  addCrane: (data: Omit<Crane, 'id'>) => void;
  updateCrane: (id: string, changes: Partial<Crane>) => void;
  deactivateCrane: (id: string) => void;
  reactivateCrane: (id: string) => void;
  addCompany: (data: Omit<Company, 'id'>) => void;
  updateCompany: (id: string, changes: Partial<Company>) => void;
  deactivateCompany: (id: string) => void;
  reactivateCompany: (id: string) => void;
}

function managementReducer(state: ManagementState, action: ManagementAction): ManagementState {
  switch (action.type) {
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.user] };
    case 'UPDATE_USER':
      return { ...state, users: state.users.map((u) => u.id === action.id ? { ...u, ...action.changes } : u) };
    case 'DEACTIVATE_USER':
      return { ...state, users: state.users.map((u) => u.id === action.id ? { ...u, active: false } : u) };
    case 'REACTIVATE_USER':
      return { ...state, users: state.users.map((u) => u.id === action.id ? { ...u, active: true } : u) };
    case 'ADD_CRANE':
      return { ...state, cranes: [...state.cranes, action.crane] };
    case 'UPDATE_CRANE':
      return { ...state, cranes: state.cranes.map((c) => c.id === action.id ? { ...c, ...action.changes } : c) };
    case 'DEACTIVATE_CRANE':
      return { ...state, cranes: state.cranes.map((c) => c.id === action.id ? { ...c, active: false } : c) };
    case 'REACTIVATE_CRANE':
      return { ...state, cranes: state.cranes.map((c) => c.id === action.id ? { ...c, active: true } : c) };
    case 'ADD_COMPANY':
      return { ...state, companies: [...state.companies, action.company] };
    case 'UPDATE_COMPANY':
      return { ...state, companies: state.companies.map((c) => c.id === action.id ? { ...c, ...action.changes } : c) };
    case 'DEACTIVATE_COMPANY':
      return { ...state, companies: state.companies.map((c) => c.id === action.id ? { ...c, active: false } : c) };
    case 'REACTIVATE_COMPANY':
      return { ...state, companies: state.companies.map((c) => c.id === action.id ? { ...c, active: true } : c) };
    default:
      return state;
  }
}

const ManagementContext = createContext<ManagementContextValue | null>(null);

export function ManagementProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(managementReducer, {
    users: mockUsers,
    cranes: mockCranes,
    companies: mockCompanies,
  });

  const value: ManagementContextValue = {
    ...state,
    getUsersForSite: (siteId) => state.users.filter((u) => u.siteIds.includes(siteId)),
    getCranesForSite: (siteId, activeOnly = false) =>
      state.cranes.filter((c) => c.siteId === siteId && (!activeOnly || c.active)),
    addUser: (data) => dispatch({ type: 'ADD_USER', user: { ...data, id: `user-${Date.now()}` } }),
    updateUser: (id, changes) => dispatch({ type: 'UPDATE_USER', id, changes }),
    deactivateUser: (id) => dispatch({ type: 'DEACTIVATE_USER', id }),
    reactivateUser: (id) => dispatch({ type: 'REACTIVATE_USER', id }),
    addCrane: (data) => dispatch({ type: 'ADD_CRANE', crane: { ...data, id: `crane-${Date.now()}` } }),
    updateCrane: (id, changes) => dispatch({ type: 'UPDATE_CRANE', id, changes }),
    deactivateCrane: (id) => dispatch({ type: 'DEACTIVATE_CRANE', id }),
    reactivateCrane: (id) => dispatch({ type: 'REACTIVATE_CRANE', id }),
    addCompany: (data) => dispatch({ type: 'ADD_COMPANY', company: { ...data, id: `co-${Date.now()}` } }),
    updateCompany: (id, changes) => dispatch({ type: 'UPDATE_COMPANY', id, changes }),
    deactivateCompany: (id) => dispatch({ type: 'DEACTIVATE_COMPANY', id }),
    reactivateCompany: (id) => dispatch({ type: 'REACTIVATE_COMPANY', id }),
  };

  return (
    <ManagementContext.Provider value={value}>{children}</ManagementContext.Provider>
  );
}

export function useManagement(): ManagementContextValue {
  const ctx = useContext(ManagementContext);
  if (!ctx) throw new Error('useManagement must be used within ManagementProvider');
  return ctx;
}
