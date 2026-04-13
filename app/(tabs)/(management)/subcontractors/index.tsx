import React from 'react';
import { ScrollView, View } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { useManagement } from '@/lib/context/ManagementContext';
import { Spacing, Radius } from '@/lib/theme';
import { Avatar, Badge, ListItem, Divider, EmptyState } from '@/components/ui';

export default function SubcontractorsScreen() {
  const { colors } = useTheme();
  const { companies } = useManagement();

  if (companies.length === 0) {
    return (
      <EmptyState
        icon="domain"
        title="No subcontractors"
        description="No subcontractor companies have been added yet."
      />
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View
        style={{
          borderRadius: Radius.lg,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceRaised,
          marginHorizontal: Spacing.lg,
          marginTop: Spacing.lg,
          overflow: 'hidden',
        }}
      >
        {companies.map((company, index) => (
          <View key={company.id}>
            <ListItem
              title={company.name}
              subtitle={`${company.contactName} · ${company.contactEmail}`}
              inactive={!company.active}
              left={<Avatar name={company.name} size={40} />}
              right={
                !company.active ? (
                  <Badge label="Inactive" variant="neutral" />
                ) : undefined
              }
            />
            {index < companies.length - 1 && <Divider inset={68} />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
