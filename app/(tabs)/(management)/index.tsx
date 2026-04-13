import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';
import { useManagement } from '@/lib/context/ManagementContext';
import { useAuth } from '@/lib/context/AuthContext';
import { Typography, Spacing, Radius, Shadow } from '@/lib/theme';

const SECTIONS = [
  {
    key: 'users',
    label: 'Users',
    description: 'Add, edit or deactivate site users',
    icon: 'account-group-outline',
    route: '/(tabs)/(management)/users/index',
  },
  {
    key: 'cranes',
    label: 'Cranes',
    description: 'Manage cranes on this site',
    icon: 'crane',
    route: '/(tabs)/(management)/cranes/index',
  },
  {
    key: 'subcontractors',
    label: 'Subcontractors',
    description: 'Add or deactivate subcontractor companies',
    icon: 'domain',
    route: '/(tabs)/(management)/subcontractors/index',
  },
] as const;

export default function ManagementHubScreen() {
  const { colors } = useTheme();
  const { users, cranes, companies } = useManagement();
  const { site } = useAuth();

  const counts: Record<string, number> = {
    users: users.filter((u) => u.active).length,
    cranes: cranes.filter((c) => c.active).length,
    subcontractors: companies.filter((c) => c.active).length,
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}
    >
      {site && (
        <Text style={[Typography.bodyMd, { color: colors.textSecondary, marginBottom: Spacing.sm }]}>
          {site.name}
        </Text>
      )}

      {SECTIONS.map((section) => (
        <Pressable
          key={section.key}
          onPress={() => router.push(section.route as any)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.lg,
            padding: Spacing.lg,
            borderRadius: Radius.lg,
            borderCurve: 'continuous',
            backgroundColor: colors.surfaceRaised,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
            ...Shadow.sm,
          })}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: Radius.md,
              backgroundColor: colors.accentSubtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons
              name={section.icon as any}
              size={24}
              color={colors.accent}
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>
              {section.label}
            </Text>
            <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
              {section.description}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={[Typography.headingMd, { color: colors.accent }]}>
              {counts[section.key]}
            </Text>
            <Text style={[Typography.bodySm, { color: colors.textTertiary }]}>active</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.textTertiary}
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}
