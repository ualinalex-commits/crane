import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { Booking, BookingStatus } from '../types';
import { mockBookings } from '../mock';

interface BookingsState {
  bookings: Booking[];
}

type BookingsAction =
  | { type: 'ADD_BOOKING'; booking: Booking }
  | { type: 'APPROVE_BOOKING'; id: string; approvedById: string }
  | { type: 'REJECT_BOOKING'; id: string; reason?: string; approvedById: string }
  | { type: 'UPDATE_BOOKING'; id: string; changes: Partial<Booking> };

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

function bookingsReducer(state: BookingsState, action: BookingsAction): BookingsState {
  switch (action.type) {
    case 'ADD_BOOKING':
      return { bookings: [...state.bookings, action.booking] };

    case 'APPROVE_BOOKING':
      return {
        bookings: state.bookings.map((b) =>
          b.id === action.id
            ? {
                ...b,
                status: 'approved' as BookingStatus,
                approvedAt: new Date().toISOString(),
                approvedById: action.approvedById,
              }
            : b
        ),
      };

    case 'REJECT_BOOKING':
      return {
        bookings: state.bookings.map((b) =>
          b.id === action.id
            ? {
                ...b,
                status: 'rejected' as BookingStatus,
                rejectionReason: action.reason,
                approvedAt: new Date().toISOString(),
                approvedById: action.approvedById,
              }
            : b
        ),
      };

    case 'UPDATE_BOOKING':
      return {
        bookings: state.bookings.map((b) =>
          b.id === action.id ? { ...b, ...action.changes } : b
        ),
      };

    default:
      return state;
  }
}

const BookingsContext = createContext<BookingsContextValue | null>(null);

export function BookingsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(bookingsReducer, {
    bookings: mockBookings,
  });

  const approvedBookings = useMemo(
    () => state.bookings.filter((b) => b.status === 'approved'),
    [state.bookings]
  );
  const pendingBookings = useMemo(
    () => state.bookings.filter((b) => b.status === 'pending'),
    [state.bookings]
  );
  const rejectedBookings = useMemo(
    () => state.bookings.filter((b) => b.status === 'rejected'),
    [state.bookings]
  );

  const value: BookingsContextValue = {
    bookings: state.bookings,
    approvedBookings,
    pendingBookings,
    rejectedBookings,
    getBookingsForSite: (siteId) =>
      state.bookings.filter((b) => b.siteId === siteId),
    getBookingsForCompany: (companyId) =>
      state.bookings.filter((b) => b.companyId === companyId),
    getBookingById: (id) => state.bookings.find((b) => b.id === id),
    addBooking: (data) => {
      const booking: Booking = {
        ...data,
        id: `bk-${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_BOOKING', booking });
    },
    approveBooking: (id, approvedById) =>
      dispatch({ type: 'APPROVE_BOOKING', id, approvedById }),
    rejectBooking: (id, approvedById, reason) =>
      dispatch({ type: 'REJECT_BOOKING', id, approvedById, reason }),
  };

  return (
    <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>
  );
}

export function useBookings(): BookingsContextValue {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider');
  return ctx;
}
