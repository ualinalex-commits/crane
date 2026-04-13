import React from 'react';
import { ScrollView } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { Spacing } from '@/lib/theme';
import { EmptyState } from '@/components/ui';

export default function NewUserScreen() {
  const { colors } = useTheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, flexGrow: 1 }}
    >
      <EmptyState icon="account-plus-outline" title="Add User" description="User form coming soon." />
    </ScrollView>
  );
}
