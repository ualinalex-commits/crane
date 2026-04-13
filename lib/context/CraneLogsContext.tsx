import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { CraneLog } from '../types';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

function rowToLog(row: any): CraneLog {
  return {
    id: row.id,
    siteId: row.site_id,
    craneId: row.crane_id,
    companyId: row.company_id ?? undefined,
    status: row.status,
    jobDetails: row.job_details,
    imageUri: row.image_uri ?? undefined,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    isOpen: row.is_open,
    createdById: row.created_by_id,
    createdAt: row.created_at,
  };
}

interface CraneLogsContextValue {
  logs: CraneLog[];
  openLogs: CraneLog[];
  getLogsForSite: (siteId: string) => CraneLog[];
  addLog: (data: Omit<CraneLog, 'id' | 'createdAt'>) => void;
  closeLog: (id: string, endTime: string) => void;
}

const CraneLogsContext = createContext<CraneLogsContextValue | null>(null);

export function CraneLogsProvider({ children }: { children: React.ReactNode }) {
  const { user, site } = useAuth();
  const [logs, setLogs] = useState<CraneLog[]>([]);

  useEffect(() => {
    if (!user || !site) { setLogs([]); return; }
    supabase
      .from('crane_logs')
      .select('*')
      .eq('site_id', site.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('crane_logs fetch:', error); return; }
        if (data) setLogs(data.map(rowToLog));
      });
  }, [user?.id, site?.id]);

  const openLogs = useMemo(() => logs.filter((l) => l.isOpen), [logs]);

  const value: CraneLogsContextValue = {
    logs,
    openLogs,
    getLogsForSite: (siteId) => logs.filter((l) => l.siteId === siteId),

    addLog: (data) => {
      const tempId = `temp-${Date.now()}`;
      const optimistic: CraneLog = { ...data, id: tempId, createdAt: new Date().toISOString() };
      setLogs((prev) => [optimistic, ...prev]);

      supabase
        .from('crane_logs')
        .insert({
          site_id:       data.siteId,
          crane_id:      data.craneId,
          company_id:    data.companyId ?? null,
          status:        data.status,
          job_details:   data.jobDetails,
          image_uri:     data.imageUri ?? null,
          start_time:    data.startTime,
          end_time:      data.endTime ?? null,
          is_open:       data.isOpen,
          created_by_id: data.createdById,
        })
        .select()
        .single()
        .then(({ data: row, error }) => {
          if (error) {
            setLogs((prev) => prev.filter((l) => l.id !== tempId));
            console.error('addLog:', error);
            return;
          }
          setLogs((prev) => prev.map((l) => (l.id === tempId ? rowToLog(row) : l)));
        });
    },

    closeLog: (id, endTime) => {
      setLogs((prev) =>
        prev.map((l) => (l.id === id ? { ...l, isOpen: false, endTime } : l))
      );
      supabase
        .from('crane_logs')
        .update({ is_open: false, end_time: endTime })
        .eq('id', id)
        .then(({ error }) => { if (error) console.error('closeLog:', error); });
    },
  };

  return <CraneLogsContext.Provider value={value}>{children}</CraneLogsContext.Provider>;
}

export function useCraneLogs(): CraneLogsContextValue {
  const ctx = useContext(CraneLogsContext);
  if (!ctx) throw new Error('useCraneLogs must be used within CraneLogsProvider');
  return ctx;
}
