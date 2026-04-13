import React from 'react';
import { ScrollView } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { Spacing } from '@/lib/theme';
import { EmptyState } from '@/components/ui';

export default function EditSubcontractorScreen() {
  const { colors } = useTheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, flexGrow: 1 }}
    >
      <EmptyState icon="domain" title="Edit Subcontractor" description="Edit subcontractor form coming soon." />
    </ScrollView>
  );
}
