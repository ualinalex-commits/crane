import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/lib/context/AuthContext';
import { BookingsProvider } from '@/lib/context/BookingsContext';
import { ManagementProvider } from '@/lib/context/ManagementContext';
import { CraneLogsProvider } from '@/lib/context/CraneLogsContext';
import { AdminProvider } from '@/lib/context/AdminContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AdminProvider>
        <BookingsProvider>
          <ManagementProvider>
            <CraneLogsProvider>
              <Stack screenOptions={{ headerShown: false }} />
              <StatusBar style="auto" />
            </CraneLogsProvider>
          </ManagementProvider>
        </BookingsProvider>
      </AdminProvider>
    </AuthProvider>
  );
}
