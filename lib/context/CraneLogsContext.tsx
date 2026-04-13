import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { CraneLog } from '../types';
import { mockCraneLogs } from '../mock';

interface CraneLogsState {
  logs: CraneLog[];
}

type CraneLogsAction =
  | { type: 'ADD_LOG'; log: CraneLog }
  | { type: 'CLOSE_LOG'; id: string; endTime: string };

interface CraneLogsContextValue {
  logs: CraneLog[];
  openLogs: CraneLog[];
  getLogsForSite: (siteId: string) => CraneLog[];
  addLog: (data: Omit<CraneLog, 'id' | 'createdAt'>) => void;
  closeLog: (id: string, endTime: string) => void;
}

function craneLogsReducer(state: CraneLogsState, action: CraneLogsAction): CraneLogsState {
  switch (action.type) {
    case 'ADD_LOG':
      return { logs: [action.log, ...state.logs] };
    case 'CLOSE_LOG':
      return {
        logs: state.logs.map((l) =>
          l.id === action.id ? { ...l, isOpen: false, endTime: action.endTime } : l
        ),
      };
    default:
      return state;
  }
}

const CraneLogsContext = createContext<CraneLogsContextValue | null>(null);

export function CraneLogsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(craneLogsReducer, { logs: mockCraneLogs });

  const openLogs = useMemo(() => state.logs.filter((l) => l.isOpen), [state.logs]);

  const value: CraneLogsContextValue = {
    logs: state.logs,
    openLogs,
    getLogsForSite: (siteId) => state.logs.filter((l) => l.siteId === siteId),
    addLog: (data) => {
      const log: CraneLog = {
        ...data,
        id: `log-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_LOG', log });
    },
    closeLog: (id, endTime) => dispatch({ type: 'CLOSE_LOG', id, endTime }),
  };

  return (
    <CraneLogsContext.Provider value={value}>{children}</CraneLogsContext.Provider>
  );
}

export function useCraneLogs(): CraneLogsContextValue {
  const ctx = useContext(CraneLogsContext);
  if (!ctx) throw new Error('useCraneLogs must be used within CraneLogsProvider');
  return ctx;
}
