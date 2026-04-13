import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { Booking } from '../types';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

function rowToBooking(row: any): Booking {
  return {
    id: row.id,
    siteId: row.site_id,
    craneId: row.crane_id,
    companyId: row.company_id,
    requestedById: row.requested_by_id,
    jobDetails: row.job_details,
    date: row.date,
    startTime: (row.start_time as string).slice(0, 5),  // '07:00:00' → '07:00'
    endTime: (row.end_time as string).slice(0, 5),
    status: row.status,
    rejectionReason: row.rejection_reason ?? undefined,
    createdAt: row.created_at,
    approvedAt: row.approved_at ?? undefined,
    approvedById: row.approved_by_id ?? undefined,
  };
}

interface BookingsContextValue {
  bookings: Booking[];
  approvedBookings: Booking[];
  pendingBookings: Booking[];
  rejectedBookings: Booking[];
  getBookingsForSite: (siteId: string) => Booking[];
  getBookingsForCompany: (companyId: string) => Booking[];
  getBookingById: (id: string) => Booking | undefined;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) => void;
  approveBooking: (id: string, approvedById: string) => void;
  rejectBooking: (id: string, approvedById: string, reason?: string) => void;
}

const BookingsContext = createContext<BookingsContextValue | null>(null);

export function BookingsProvider({ children }: { children: React.ReactNode }) {
  const { user, site } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user || !site) {
      setBookings([]);
      return;
    }
    supabase
      .from('bookings')
      .select('*')
      .eq('site_id', site.id)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('bookings fetch:', error); return; }
        if (data) setBookings(data.map(rowToBooking));
      });
  }, [user?.id, site?.id]);

  const approvedBookings = useMemo(() => bookings.filter((b) => b.status === 'approved'), [bookings]);
  const pendingBookings  = useMemo(() => bookings.filter((b) => b.status === 'pending'),  [bookings]);
  const rejectedBookings = useMemo(() => bookings.filter((b) => b.status === 'rejected'), [bookings]);

  const value: BookingsContextValue = {
    bookings,
    approvedBookings,
    pendingBookings,
    rejectedBookings,
    getBookingsForSite:    (siteId)    => bookings.filter((b) => b.siteId === siteId),
    getBookingsForCompany: (companyId) => bookings.filter((b) => b.companyId === companyId),
    getBookingById:        (id)        => bookings.find((b) => b.id === id),

    addBooking: (data) => {
      const tempId = `temp-${Date.now()}`;
      const optimistic: Booking = { ...data, id: tempId, status: 'pending', createdAt: new Date().toISOString() };
      setBookings((prev) => [...prev, optimistic]);

      supabase
        .from('bookings')
        .insert({
          site_id:          data.siteId,
          crane_id:         data.craneId,
          company_id:       data.companyId,
          requested_by_id:  data.requestedById,
          job_details:      data.jobDetails,
          date:             data.date,
          start_time:       data.startTime,
          end_time:         data.endTime,
        })
        .select()
        .single()
        .then(({ data: row, error }) => {
          if (error) {
            setBookings((prev) => prev.filter((b) => b.id !== tempId));
            console.error('addBooking:', error);
            return;
          }
          setBookings((prev) => prev.map((b) => (b.id === tempId ? rowToBooking(row) : b)));
        });
    },

    approveBooking: (id, approvedById) => {
      const now = new Date().toISOString();
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'approved', approvedAt: now, approvedById } : b))
      );
      supabase
        .from('bookings')
        .update({ status: 'approved', approved_at: now, approved_by_id: approvedById })
        .eq('id', id)
        .then(({ error }) => { if (error) console.error('approveBooking:', error); });
    },

    rejectBooking: (id, approvedById, reason) => {
      const now = new Date().toISOString();
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: 'rejected', rejectionReason: reason, approvedAt: now, approvedById } : b
        )
      );
      supabase
        .from('bookings')
        .update({ status: 'rejected', rejection_reason: reason ?? null, approved_at: now, approved_by_id: approvedById })
        .eq('id', id)
        .then(({ error }) => { if (error) console.error('rejectBooking:', error); });
    },
  };

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function useBookings(): BookingsContextValue {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider');
  return ctx;
}
