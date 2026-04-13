import React from 'react';
import { ScrollView } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { Spacing } from '@/lib/theme';
import { EmptyState } from '@/components/ui';

export default function EditCraneScreen() {
  const { colors } = useTheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, flexGrow: 1 }}
    >
      <EmptyState icon="pencil-outline" title="Edit Crane" description="Edit crane form coming soon." />
    </ScrollView>
  );
}
