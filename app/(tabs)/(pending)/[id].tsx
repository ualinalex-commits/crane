import React from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/lib/hooks/useTheme';
import { Spacing } from '@/lib/theme';
import { BookingCard } from '@/components/ui';
import { useBookings } from '@/lib/context/BookingsContext';

export default function PendingBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getBookingById } = useBookings();
  const { colors } = useTheme();
  const booking = getBookingById(id);

  if (!booking) return null;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: Spacing.lg }}
    >
      <BookingCard booking={booking} showStatus />
    </ScrollView>
  );
}
