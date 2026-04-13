import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';
import { useAuth } from '@/lib/context/AuthContext';
import { useBookings } from '@/lib/context/BookingsContext';
import { Typography, Spacing, Radius, Shadow } from '@/lib/theme';
import { StatusBadge, BottomSheet } from '@/components/ui';
import { getCraneById, getCompanyById, getUserById } from '@/lib/mock';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatISO(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Row ───────────────────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
      <MaterialCommunityIcons
        name={icon as any}
        size={18}
        color={colors.textTertiary}
        style={{ marginTop: 1 }}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[Typography.label, { color: colors.textTertiary }]}>{label}</Text>
        <Text style={[Typography.bodyMd, { color: colors.textPrimary, lineHeight: 20 }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PendingBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { getBookingById, approveBooking, rejectBooking } = useBookings();

  const [rejectSheetOpen, setRejectSheetOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const booking = getBookingById(id);
  if (!booking) return null;

  const crane = getCraneById(booking.craneId);
  const company = getCompanyById(booking.companyId);
  const requester = getUserById(booking.requestedById);
  const approver = booking.approvedById ? getUserById(booking.approvedById) : undefined;

  const isAP = user?.role === 'Appointed_Person';
  const isPending = booking.status === 'pending';

  function handleApprove() {
    if (!user) return;
    approveBooking(booking.id, user.id);
    router.back();
  }

  function handleRejectConfirm() {
    if (!user) return;
    rejectBooking(booking.id, user.id, rejectReason.trim() || undefined);
    setRejectSheetOpen(false);
    router.back();
  }

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          padding: Spacing.lg,
          gap: Spacing.xl,
          paddingBottom: isAP && isPending ? 120 : 48,
        }}
      >
        {/* ── Header card ── */}
        <View
          style={{
            backgroundColor: colors.surfaceRaised,
            borderRadius: Radius.lg,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: colors.border,
            padding: Spacing.lg,
            gap: Spacing.lg,
            ...Shadow.sm,
          }}
        >
          {/* Crane + status */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: Spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                {crane && (
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: crane.colour,
                    }}
                  />
                )}
                <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>
                  {crane?.name ?? 'Unknown Crane'}
                </Text>
              </View>
              {crane && (
                <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
                  {crane.model} · {crane.maxCapacityTonnes}t capacity
                </Text>
              )}
            </View>
            <StatusBadge status={booking.status} />
          </View>

          {/* Detail rows */}
          <View style={{ gap: Spacing.md }}>
            <DetailRow
              icon="calendar-outline"
              label="DATE"
              value={formatDate(booking.date)}
              colors={colors}
            />
            <DetailRow
              icon="clock-outline"
              label="TIME"
              value={`${booking.startTime} – ${booking.endTime}`}
              colors={colors}
            />
            <DetailRow
              icon="office-building-outline"
              label="SUBCONTRACTOR"
              value={company?.name ?? 'Unknown Company'}
              colors={colors}
            />
            <DetailRow
              icon="account-outline"
              label="REQUESTED BY"
              value={requester?.name ?? booking.requestedById}
              colors={colors}
            />
          </View>
        </View>

        {/* ── Job details ── */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={[Typography.bodySemibold, { color: colors.textPrimary }]}>
            Job Details
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: Radius.md,
              borderCurve: 'continuous',
              padding: Spacing.lg,
            }}
          >
            <Text style={[Typography.bodyMd, { color: colors.textPrimary, lineHeight: 22 }]}>
              {booking.jobDetails}
            </Text>
          </View>
        </View>

        {/* ── Rejection reason ── */}
        {booking.status === 'rejected' && booking.rejectionReason && (
          <View style={{ gap: Spacing.sm }}>
            <Text style={[Typography.bodySemibold, { color: colors.textPrimary }]}>
              Rejection Reason
            </Text>
            <View
              style={{
                backgroundColor: colors.rejectedBg,
                borderRadius: Radius.md,
                borderCurve: 'continuous',
                padding: Spacing.lg,
                gap: Spacing.xs,
              }}
            >
              <MaterialCommunityIcons name="close-circle-outline" size={18} color={colors.rejectedText} />
              <Text style={[Typography.bodyMd, { color: colors.rejectedText, lineHeight: 22, marginTop: Spacing.xs }]}>
                {booking.rejectionReason}
              </Text>
            </View>
          </View>
        )}

        {/* ── Metadata ── */}
        <View
          style={{
            gap: Spacing.sm,
            paddingTop: Spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Text style={[Typography.label, { color: colors.textTertiary }]}>
            Submitted {formatISO(booking.createdAt)}
          </Text>
          {booking.approvedAt && (
            <Text style={[Typography.label, { color: colors.textTertiary }]}>
              {booking.status === 'approved' ? 'Approved' : 'Rejected'}{' '}
              {formatISO(booking.approvedAt)}
              {approver ? ` by ${approver.name}` : ''}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* ── AP action bar ── */}
      {isAP && isPending && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            gap: Spacing.sm,
            padding: Spacing.lg,
            paddingBottom: Spacing.xl,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => {
              setRejectReason('');
              setRejectSheetOpen(true);
            }}
            style={({ pressed }) => ({
              flex: 1,
              height: 52,
              borderRadius: Radius.lg,
              borderCurve: 'continuous',
              borderWidth: 1.5,
              borderColor: colors.danger,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={[Typography.bodySemibold, { color: colors.danger }]}>Reject</Text>
          </Pressable>
          <Pressable
            onPress={handleApprove}
            style={({ pressed }) => ({
              flex: 1,
              height: 52,
              borderRadius: Radius.lg,
              borderCurve: 'continuous',
              backgroundColor: colors.success,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={[Typography.bodySemibold, { color: '#FFF' }]}>Approve</Text>
          </Pressable>
        </View>
      )}

      {/* ── Reject sheet ── */}
      <BottomSheet visible={rejectSheetOpen} onClose={() => setRejectSheetOpen(false)}>
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
              onPress={() => setRejectSheetOpen(false)}
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
    </>
  );
}
