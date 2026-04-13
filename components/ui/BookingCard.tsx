import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';
import { Typography, Spacing, Radius, Shadow } from '@/lib/theme';
import { StatusBadge } from './Badge';
import type { Booking } from '@/lib/types';
import { getCraneById, getCompanyById } from '@/lib/mock';

interface BookingCardProps {
  booking: Booking;
  onPress?: () => void;
  showStatus?: boolean;
  /** AP approve/reject actions */
  onApprove?: () => void;
  onReject?: () => void;
}

export function BookingCard({
  booking,
  onPress,
  showStatus = true,
  onApprove,
  onReject,
}: BookingCardProps) {
  const { colors } = useTheme();
  const crane = getCraneById(booking.craneId);
  const company = getCompanyById(booking.companyId);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surfaceRaised,
        borderRadius: Radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: 6,
        opacity: pressed ? 0.85 : 1,
        ...Shadow.sm,
      })}
    >
      {/* Header row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            {crane && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: crane.colour,
                }}
              />
            )}
            <Text style={{ fontSize: 14, fontWeight: '600', letterSpacing: -0.1, color: colors.textPrimary }}>
              {crane?.name ?? 'Unknown Crane'}
            </Text>
          </View>
          <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
            {company?.name ?? 'Unknown Company'}
          </Text>
        </View>
        {showStatus && <StatusBadge status={booking.status} />}
      </View>

      {/* Time row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
        <MaterialCommunityIcons name="clock-outline" size={13} color={colors.textTertiary} />
        <Text
          style={[
            Typography.bodySm,
            { color: colors.textSecondary, fontVariant: ['tabular-nums'] },
          ]}
        >
          {booking.startTime} – {booking.endTime}
        </Text>
        <Text style={[Typography.bodySm, { color: colors.textTertiary }]}>·</Text>
        <MaterialCommunityIcons name="calendar-outline" size={13} color={colors.textTertiary} />
        <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
          {formatDate(booking.date)}
        </Text>
      </View>

      {/* Job details */}
      <Text
        style={[Typography.bodySm, { color: colors.textSecondary, lineHeight: 17 }]}
        numberOfLines={2}
      >
        {booking.jobDetails}
      </Text>

      {/* Rejection reason */}
      {booking.status === 'rejected' && booking.rejectionReason && (
        <View
          style={{
            backgroundColor: colors.rejectedBg,
            borderRadius: Radius.sm,
            padding: Spacing.md,
            gap: Spacing.xs,
          }}
        >
          <Text style={[Typography.label, { color: colors.rejectedText }]}>
            REJECTION REASON
          </Text>
          <Text style={[Typography.bodySm, { color: colors.rejectedText, lineHeight: 18 }]}>
            {booking.rejectionReason}
          </Text>
        </View>
      )}

      {/* AP action buttons */}
      {(onApprove || onReject) && booking.status === 'pending' && (
        <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.xs }}>
          {onReject && (
            <Pressable
              onPress={onReject}
              style={({ pressed }) => ({
                flex: 1,
                height: 40,
                borderRadius: Radius.md,
                borderCurve: 'continuous',
                borderWidth: 1.5,
                borderColor: colors.danger,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={[Typography.bodySemibold, { color: colors.danger, fontSize: 14 }]}>
                Reject
              </Text>
            </Pressable>
          )}
          {onApprove && (
            <Pressable
              onPress={onApprove}
              style={({ pressed }) => ({
                flex: 1,
                height: 40,
                borderRadius: Radius.md,
                borderCurve: 'continuous',
                backgroundColor: colors.success,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={[Typography.bodySemibold, { color: '#FFF', fontSize: 14 }]}>
                Approve
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
