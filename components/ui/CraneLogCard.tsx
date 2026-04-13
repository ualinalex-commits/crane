import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';
import { Typography, Spacing, Radius, Shadow } from '@/lib/theme';
import type { CraneLog, CraneLogStatus } from '@/lib/types';
import { getCraneById, getCompanyById } from '@/lib/mock';

interface CraneLogCardProps {
  log: CraneLog;
  onCloseLog?: () => void;
}

const STATUS_CONFIG: Record<CraneLogStatus, { label: string; color: string }> = {
  working: { label: 'Working', color: '#22C55E' },
  breaking_down: { label: 'Breaking Down', color: '#EF4444' },
  service: { label: 'Service', color: '#3B82F6' },
  thorough_examination: { label: 'Thorough Exam', color: '#EAB308' },
  wind_off: { label: 'Wind Off', color: '#8E8E93' },
};

function formatISOTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatLogDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  ) {
    return 'Today';
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Yesterday';
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function CraneLogCard({ log, onCloseLog }: CraneLogCardProps) {
  const { colors } = useTheme();
  const crane = getCraneById(log.craneId);
  const company = log.companyId ? getCompanyById(log.companyId) : undefined;
  const status = STATUS_CONFIG[log.status];

  return (
    <View
      style={{
        backgroundColor: colors.surfaceRaised,
        borderRadius: Radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
        padding: Spacing.lg,
        gap: Spacing.md,
        ...Shadow.sm,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            {crane && (
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: crane.colour }} />
            )}
            <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>
              {crane?.name ?? 'Unknown Crane'}
            </Text>
          </View>
          {company && (
            <Text style={[Typography.bodyMd, { color: colors.textSecondary }]}>{company.name}</Text>
          )}
        </View>

        <View
          style={{
            paddingHorizontal: Spacing.md,
            paddingVertical: 4,
            borderRadius: Radius.full,
            backgroundColor: `${status.color}22`,
          }}
        >
          <Text style={[Typography.label, { color: status.color }]}>
            {status.label.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Time + date */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        <MaterialCommunityIcons name="clock-outline" size={15} color={colors.textTertiary} />
        <Text style={[Typography.bodyMd, { color: colors.textSecondary, fontVariant: ['tabular-nums'] }]}>
          {formatISOTime(log.startTime)} → {log.endTime ? formatISOTime(log.endTime) : 'Open'}
        </Text>
        <Text style={[Typography.bodyMd, { color: colors.textTertiary }]}>·</Text>
        <Text style={[Typography.bodyMd, { color: colors.textSecondary }]}>
          {formatLogDate(log.startTime)}
        </Text>
      </View>

      {/* Job details */}
      {log.jobDetails.length > 0 && (
        <Text
          style={[Typography.bodyMd, { color: colors.textSecondary, lineHeight: 20 }]}
          numberOfLines={2}
        >
          {log.jobDetails}
        </Text>
      )}

      {/* Open indicator + close button */}
      {log.isOpen && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
            <Text style={[Typography.bodySm, { color: colors.success, fontWeight: '600' }]}>
              Log Open
            </Text>
          </View>
          {onCloseLog && (
            <Pressable
              onPress={onCloseLog}
              style={({ pressed }) => ({
                paddingHorizontal: Spacing.md,
                paddingVertical: 6,
                borderRadius: Radius.md,
                borderWidth: 1.5,
                borderColor: colors.accent,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={[Typography.bodyMd, { color: colors.accent, fontWeight: '600', fontSize: 13 }]}>
                Close Log
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
