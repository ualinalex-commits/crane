import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Site } from '../types';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

interface AdminContextValue {
  sites: Site[];
  addSite: (data: Omit<Site, 'id'>) => void;
  updateSite: (id: string, changes: Partial<Omit<Site, 'id'>>) => void;
  deleteSite: (id: string) => void;
  addAppointedPerson: (siteId: string, name: string, email: string) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

function rowToSite(row: any): Site {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    address: row.address,
  };
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    if (user?.role !== 'Admin') {
      setSites([]);
      return;
    }
    supabase
      .from('sites')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (error) { console.error('sites fetch:', error); return; }
        if (data) setSites(data.map(rowToSite));
      });
  }, [user?.id, user?.role]);

  const value: AdminContextValue = {
    sites,

    addSite: (data) => {
      const tempId = `temp-${Date.now()}`;
      setSites((prev) => [...prev, { ...data, id: tempId }]);
      supabase
        .from('sites')
        .insert({ name: data.name, location: data.location, address: data.address })
        .select()
        .single()
        .then(({ data: row, error }) => {
          if (error) {
            setSites((prev) => prev.filter((s) => s.id !== tempId));
            console.error('addSite:', error);
            return;
          }
          setSites((prev) => prev.map((s) => (s.id === tempId ? rowToSite(row) : s)));
        });
    },

    updateSite: (id, changes) => {
      setSites((prev) => prev.map((s) => (s.id === id ? { ...s, ...changes } : s)));
      supabase
        .from('sites')
        .update(changes)
        .eq('id', id)
        .then(({ error }) => { if (error) console.error('updateSite:', error); });
    },

    deleteSite: (id) => {
      setSites((prev) => prev.filter((s) => s.id !== id));
      supabase
        .from('sites')
        .delete()
        .eq('id', id)
        .then(({ error }) => { if (error) console.error('deleteSite:', error); });
    },

    addAppointedPerson: (siteId, name, email) => {
      supabase
        .from('profiles')
        .insert({ name, email, role: 'Appointed_Person', active: true })
        .select()
        .single()
        .then(async ({ data: row, error }) => {
          if (error) { console.error('addAppointedPerson profile:', error); return; }
          const { error: linkError } = await supabase
            .from('user_sites')
            .insert({ user_id: row.id, site_id: siteId });
          if (linkError) console.error('addAppointedPerson user_sites:', linkError);
        });
    },
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
