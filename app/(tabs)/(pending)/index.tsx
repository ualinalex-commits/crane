import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';
import { useAuth } from '@/lib/context/AuthContext';
import { useBookings } from '@/lib/context/BookingsContext';
import { Typography, Spacing, Radius, Shadow } from '@/lib/theme';
import { BookingCard, BottomSheet, EmptyState } from '@/components/ui';
import type { Booking } from '@/lib/types';

export default function PendingBookingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, site } = useAuth();
  const { pendingBookings, approveBooking, rejectBooking } = useBookings();

  const [rejectTarget, setRejectTarget] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const isAP = user?.role === 'Appointed_Person';

  const visibleBookings = useMemo(() => {
    const siteBookings = pendingBookings.filter((b) => b.siteId === site?.id);
    if (isAP) return siteBookings;
    return siteBookings.filter((b) => b.companyId === user?.companyId);
  }, [pendingBookings, site?.id, isAP, user?.companyId]);

  function handleApprove(booking: Booking) {
    if (!user) return;
    approveBooking(booking.id, user.id);
  }

  function openRejectSheet(booking: Booking) {
    setRejectTarget(booking);
    setRejectReason('');
  }

  function handleRejectConfirm() {
    if (!rejectTarget || !user) return;
    rejectBooking(rejectTarget.id, user.id, rejectReason.trim() || undefined);
    setRejectTarget(null);
    setRejectReason('');
  }

  const emptyDescription = isAP
    ? 'No booking requests awaiting approval for this site.'
    : "You don't have any pending booking requests.";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={visibleBookings}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: Spacing.lg,
          gap: Spacing.md,
          flexGrow: 1,
          paddingBottom: insets.bottom + 88,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="clock-outline"
            title="No pending bookings"
            description={emptyDescription}
          />
        }
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            showStatus
            onPress={() => router.push(`/(tabs)/(pending)/${item.id}`)}
            onApprove={isAP ? () => handleApprove(item) : undefined}
            onReject={isAP ? () => openRejectSheet(item) : undefined}
          />
        )}
      />

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/(tabs)/(pending)/new')}
        style={({ pressed }) => ({
          position: 'absolute',
          right: Spacing.xl,
          bottom: insets.bottom + Spacing.xl,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          ...Shadow.md,
        })}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
      </Pressable>

      {/* Reject sheet */}
      <BottomSheet
        visible={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
      >
        <View style={{ padding: Spacing.lg, gap: Spacing.lg }}>
          <View style={{ gap: Spacing.xs }}>
            <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>
              Reject Booking
            </Text>
            <Text style={[Typography.bodyMd, { color: colors.textSecondary }]}>
              Optionally provide a reason — the subcontractor will see this.
            </Text>
          </View>

          <TextInput
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder="Reason for rejection (optional)"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: Radius.md,
              padding: Spacing.md,
              color: colors.textPrimary,
              minHeight: 88,
              textAlignVertical: 'top',
              fontSize: 14,
              lineHeight: 22,
              backgroundColor: colors.surface,
            }}
          />

          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Pressable
              onPress={() => setRejectTarget(null)}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                borderRadius: Radius.md,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={[Typography.bodySemibold, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleRejectConfirm}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                borderRadius: Radius.md,
                borderCurve: 'continuous',
                backgroundColor: colors.danger,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={[Typography.bodySemibold, { color: '#FFF' }]}>
                Confirm Rejection
              </Text>
            </Pressable>
          </View>

          <View style={{ height: Spacing.sm }} />
        </View>
      </BottomSheet>
    </View>
  );
}
