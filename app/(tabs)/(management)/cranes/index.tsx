import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';
import { useManagement } from '@/lib/context/ManagementContext';
import { useAuth } from '@/lib/context/AuthContext';
import { Spacing, Radius, Typography } from '@/lib/theme';
import { ListItem, Divider, EmptyState, Badge } from '@/components/ui';

export default function CranesScreen() {
  const { colors } = useTheme();
  const { site } = useAuth();
  const { getCranesForSite } = useManagement();

  const cranes = site ? getCranesForSite(site.id) : [];

  if (cranes.length === 0) {
    return (
      <EmptyState
        icon="crane"
        title="No cranes found"
        description="No cranes are configured for this site yet."
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
        {cranes.map((crane, index) => (
          <View key={crane.id}>
            <ListItem
              title={crane.name}
              subtitle={`${crane.model} · ${crane.maxCapacityTonnes}t`}
              inactive={!crane.active}
              left={
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: crane.colour + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="crane" size={20} color={crane.colour} />
                </View>
              }
              right={
                !crane.active ? (
                  <Badge label="Inactive" variant="neutral" />
                ) : undefined
              }
            />
            {index < cranes.length - 1 && <Divider inset={68} />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
