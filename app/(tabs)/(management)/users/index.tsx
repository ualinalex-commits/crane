import React, { useState } from 'react';
import { View, ScrollView, Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/hooks/useTheme';
import { useManagement } from '@/lib/context/ManagementContext';
import { useAuth } from '@/lib/context/AuthContext';
import { Spacing, Radius, Shadow, Typography } from '@/lib/theme';
import { Avatar, RoleBadge, ListItem, Divider, EmptyState } from '@/components/ui';
import type { UserRole } from '@/lib/types';

const ROLE_FILTERS: Array<{ value: UserRole | 'All'; label: string }> = [
  { value: 'All', label: 'All' },
  { value: 'Crane_Supervisor', label: 'Supervisor' },
  { value: 'Crane_Operator', label: 'Operator' },
  { value: 'Slinger_Signaller', label: 'Slinger' },
  { value: 'Subcontractor', label: 'Subcontractor' },
];

export default function UsersScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { site } = useAuth();
  const { getUsersForSite } = useManagement();
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');

  const siteUsers = site ? getUsersForSite(site.id) : [];
  const filteredUsers =
    roleFilter === 'All' ? siteUsers : siteUsers.filter((u) => u.role === roleFilter);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Role filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          gap: Spacing.sm,
        }}
        style={{ flexGrow: 0 }}
      >
        {ROLE_FILTERS.map(({ value, label }) => {
          const isActive = roleFilter === value;
          return (
            <Pressable
              key={value}
              onPress={() => setRoleFilter(value)}
              style={({ pressed }) => ({
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.xs + 2,
                borderRadius: Radius.full,
                backgroundColor: isActive ? colors.accent : colors.surface,
                borderWidth: 1,
                borderColor: isActive ? colors.accent : colors.border,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={[
                  Typography.bodySm,
                  { fontWeight: '600', color: isActive ? '#FFF' : colors.textSecondary },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon="account-group-outline"
          title="No users found"
          description={
            roleFilter === 'All'
              ? 'No users are assigned to this site yet.'
              : 'No users with this role on this site.'
          }
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
              marginTop: Spacing.sm,
              overflow: 'hidden',
            }}
          >
            {filteredUsers.map((user, index) => (
              <View key={user.id}>
                <ListItem
                  title={user.name}
                  subtitle={user.email}
                  inactive={!user.active}
                  onPress={() => router.push(`/(tabs)/(management)/users/${user.id}` as any)}
                  left={<Avatar name={user.name} size={40} />}
                  right={<RoleBadge role={user.role} short />}
                />
                {index < filteredUsers.length - 1 && <Divider inset={68} />}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/(tabs)/(management)/users/new')}
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
