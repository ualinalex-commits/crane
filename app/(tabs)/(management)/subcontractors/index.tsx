import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/hooks/useTheme';
import { useManagement } from '@/lib/context/ManagementContext';
import { Spacing, Radius, Shadow } from '@/lib/theme';
import { Avatar, Badge, ListItem, Divider, EmptyState } from '@/components/ui';

export default function SubcontractorsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { companies } = useManagement();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {companies.length === 0 ? (
        <EmptyState
          icon="domain"
          title="No subcontractors"
          description="No subcontractor companies have been added yet."
        />
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
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
                  onPress={() =>
                    router.push(`/(tabs)/(management)/subcontractors/${company.id}` as any)
                  }
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
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/(tabs)/(management)/subcontractors/new')}
        style={({ pressed }) => ({
          position: 'absolute',
          right: Spacing.xl,
          bottom: insets.bottom + Spacing.xl,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          ...Shadow.md,
        })}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
      </Pressable>
    </View>
  );
}
