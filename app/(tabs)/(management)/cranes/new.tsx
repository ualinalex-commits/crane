import React from 'react';
import { ScrollView } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { Spacing } from '@/lib/theme';
import { EmptyState } from '@/components/ui';

export default function NewCraneScreen() {
  const { colors } = useTheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, flexGrow: 1 }}
    >
      <EmptyState icon="plus-circle-outline" title="Add Crane" description="Crane form coming soon." />
    </ScrollView>
  );
}
