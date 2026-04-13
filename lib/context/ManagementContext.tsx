import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Crane, Company } from '../types';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

// ── Row mappers ───────────────────────────────────────────────────────────────

function rowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    siteIds: (row.user_sites as { site_id: string }[] | null ?? []).map((us) => us.site_id),
    companyId: row.company_id ?? undefined,
    active: row.active,
  };
}

function rowToCrane(row: any): Crane {
  return {
    id: row.id,
    siteId: row.site_id,
    name: row.name,
    model: row.model,
    maxCapacityTonnes: Number(row.max_capacity_tonnes),
    active: row.active,
    colour: row.colour,
  };
}

function rowToCompany(row: any): Company {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone ?? undefined,
    active: row.active,
  };
}

// ── Context interface ─────────────────────────────────────────────────────────

interface ManagementContextValue {
  users: User[];
  cranes: Crane[];
  companies: Company[];
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

const ManagementContext = createContext<ManagementContextValue | null>(null);

// ── Helper: sync user_sites for a profile ────────────────────────────────────

async function syncUserSites(userId: string, newSiteIds: string[]) {
  await supabase.from('user_sites').delete().eq('user_id', userId);
  if (newSiteIds.length > 0) {
    await supabase
      .from('user_sites')
      .insert(newSiteIds.map((siteId) => ({ user_id: userId, site_id: siteId })));
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ManagementProvider({ children }: { children: React.ReactNode }) {
  const { user, site } = useAuth();
  const [users, setUsers]         = useState<User[]>([]);
  const [cranes, setCranes]       = useState<Crane[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    if (!user || !site) {
      setUsers([]); setCranes([]); setCompanies([]);
      return;
    }

    // Users visible on the current site (with their site memberships)
    supabase
      .from('profiles')
      .select('id, name, email, role, company_id, active, user_sites(site_id)')
      .order('name')
      .then(({ data, error }) => {
        if (error) { console.error('users fetch:', error); return; }
        if (data) setUsers(data.map(rowToUser));
      });

    // Cranes for the current site
    supabase
      .from('cranes')
      .select('*')
      .eq('site_id', site.id)
      .order('name')
      .then(({ data, error }) => {
        if (error) { console.error('cranes fetch:', error); return; }
        if (data) setCranes(data.map(rowToCrane));
      });

    // All companies (RLS allows all authenticated users to read)
    supabase
      .from('companies')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (error) { console.error('companies fetch:', error); return; }
        if (data) setCompanies(data.map(rowToCompany));
      });
  }, [user?.id, site?.id]);

  const value: ManagementContextValue = {
    users,
    cranes,
    companies,

    getUsersForSite:    (siteId)            => users.filter((u) => u.siteIds.includes(siteId)),
    getCranesForSite:   (siteId, activeOnly = false) =>
      cranes.filter((c) => c.siteId === siteId && (!activeOnly || c.active)),

    // ── Users ──────────────────────────────────────────────────────────────
    // NOTE: addUser creates only the profile row. A matching auth.users entry
    // must already exist (create users in Supabase Dashboard → Authentication
    // → Users → Invite User). The profile insert will fail silently if the
    // auth account does not yet exist.
    addUser: (data) => {
      const tempId = `temp-${Date.now()}`;
      setUsers((prev) => [...prev, { ...data, id: tempId }]);
      supabase
        .from('profiles')
        .insert({ name: data.name, email: data.email, role: data.role, company_id: data.companyId ?? null, active: data.active })
        .select()
        .single()
        .then(async ({ data: row, error }) => {
          if (error) { setUsers((prev) => prev.filter((u) => u.id !== tempId)); console.error('addUser:', error); return; }
          if (data.siteIds.length > 0) await syncUserSites(row.id, data.siteIds);
          setUsers((prev) => prev.map((u) => (u.id === tempId ? rowToUser({ ...row, user_sites: data.siteIds.map((s) => ({ site_id: s })) }) : u)));
        });
    },

    updateUser: (id, changes) => {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...changes } : u)));
      const dbChanges: Record<string, any> = {};
      if (changes.name)       dbChanges.name       = changes.name;
      if (changes.role)       dbChanges.role       = changes.role;
      if (changes.companyId !== undefined) dbChanges.company_id = changes.companyId ?? null;
      if (Object.keys(dbChanges).length) {
        supabase.from('profiles').update(dbChanges).eq('id', id)
          .then(({ error }) => { if (error) console.error('updateUser:', error); });
      }
      if (changes.siteIds) {
        syncUserSites(id, changes.siteIds).catch((e) => console.error('updateUser sites:', e));
      }
    },

    deactivateUser: (id) => {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: false } : u)));
      supabase.from('profiles').update({ active: false }).eq('id', id)
        .then(({ error }) => { if (error) console.error('deactivateUser:', error); });
    },

    reactivateUser: (id) => {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: true } : u)));
      supabase.from('profiles').update({ active: true }).eq('id', id)
        .then(({ error }) => { if (error) console.error('reactivateUser:', error); });
    },

    // ── Cranes ─────────────────────────────────────────────────────────────
    addCrane: (data) => {
      const tempId = `temp-${Date.now()}`;
      setCranes((prev) => [...prev, { ...data, id: tempId }]);
      supabase
        .from('cranes')
        .insert({ site_id: data.siteId, name: data.name, model: data.model, max_capacity_tonnes: data.maxCapacityTonnes, active: data.active, colour: data.colour })
        .select()
        .single()
        .then(({ data: row, error }) => {
          if (error) { setCranes((prev) => prev.filter((c) => c.id !== tempId)); console.error('addCrane:', error); return; }
          setCranes((prev) => prev.map((c) => (c.id === tempId ? rowToCrane(row) : c)));
        });
    },

    updateCrane: (id, changes) => {
      setCranes((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)));
      const dbChanges: Record<string, any> = {};
      if (changes.name                !== undefined) dbChanges.name                 = changes.name;
      if (changes.model               !== undefined) dbChanges.model                = changes.model;
      if (changes.maxCapacityTonnes   !== undefined) dbChanges.max_capacity_tonnes  = changes.maxCapacityTonnes;
      if (changes.colour              !== undefined) dbChanges.colour               = changes.colour;
      if (Object.keys(dbChanges).length) {
        supabase.from('cranes').update(dbChanges).eq('id', id)
          .then(({ error }) => { if (error) console.error('updateCrane:', error); });
      }
    },

    deactivateCrane: (id) => {
      setCranes((prev) => prev.map((c) => (c.id === id ? { ...c, active: false } : c)));
      supabase.from('cranes').update({ active: false }).eq('id', id)
        .then(({ error }) => { if (error) console.error('deactivateCrane:', error); });
    },

    reactivateCrane: (id) => {
      setCranes((prev) => prev.map((c) => (c.id === id ? { ...c, active: true } : c)));
      supabase.from('cranes').update({ active: true }).eq('id', id)
        .then(({ error }) => { if (error) console.error('reactivateCrane:', error); });
    },

    // ── Companies ──────────────────────────────────────────────────────────
    addCompany: (data) => {
      const tempId = `temp-${Date.now()}`;
      setCompanies((prev) => [...prev, { ...data, id: tempId }]);
      supabase
        .from('companies')
        .insert({ name: data.name, contact_name: data.contactName, contact_email: data.contactEmail, contact_phone: data.contactPhone ?? null, active: data.active })
        .select()
        .single()
        .then(({ data: row, error }) => {
          if (error) { setCompanies((prev) => prev.filter((c) => c.id !== tempId)); console.error('addCompany:', error); return; }
          setCompanies((prev) => prev.map((c) => (c.id === tempId ? rowToCompany(row) : c)));
        });
    },

    updateCompany: (id, changes) => {
      setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)));
      const dbChanges: Record<string, any> = {};
      if (changes.name         !== undefined) dbChanges.name          = changes.name;
      if (changes.contactName  !== undefined) dbChanges.contact_name  = changes.contactName;
      if (changes.contactEmail !== undefined) dbChanges.contact_email = changes.contactEmail;
      if (changes.contactPhone !== undefined) dbChanges.contact_phone = changes.contactPhone ?? null;
      if (Object.keys(dbChanges).length) {
        supabase.from('companies').update(dbChanges).eq('id', id)
          .then(({ error }) => { if (error) console.error('updateCompany:', error); });
      }
    },

    deactivateCompany: (id) => {
      setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, active: false } : c)));
      supabase.from('companies').update({ active: false }).eq('id', id)
        .then(({ error }) => { if (error) console.error('deactivateCompany:', error); });
    },

    reactivateCompany: (id) => {
      setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, active: true } : c)));
      supabase.from('companies').update({ active: true }).eq('id', id)
        .then(({ error }) => { if (error) console.error('reactivateCompany:', error); });
    },
  };

  return <ManagementContext.Provider value={value}>{children}</ManagementContext.Provider>;
}

export function useManagement(): ManagementContextValue {
  const ctx = useContext(ManagementContext);
  if (!ctx) throw new Error('useManagement must be used within ManagementProvider');
  return ctx;
}
