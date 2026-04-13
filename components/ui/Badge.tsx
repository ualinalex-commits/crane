import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { Typography, Radius, Spacing } from '@/lib/theme';
import type { BookingStatus } from '@/lib/types';

type BadgeVariant = BookingStatus | 'info' | 'warning' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const { colors } = useTheme();

  const config: Record<BadgeVariant, { bg: string; text: string }> = {
    pending: { bg: colors.pendingBg, text: colors.pendingText },
    approved: { bg: colors.approvedBg, text: colors.approvedText },
    rejected: { bg: colors.rejectedBg, text: colors.rejectedText },
    info: { bg: colors.infoSubtle, text: colors.infoText },
    warning: { bg: colors.warningSubtle, text: colors.warningText },
    neutral: { bg: colors.surface, text: colors.textSecondary },
  };

  const { bg, text } = config[variant];

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={[
          Typography.label,
          { color: text, textTransform: 'uppercase' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const labels: Record<BookingStatus, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  return <Badge label={labels[status]} variant={status} />;
}
