import React from 'react';
import { ScrollView, View } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { useManagement } from '@/lib/context/ManagementContext';
import { useAuth } from '@/lib/context/AuthContext';
import { Spacing, Radius } from '@/lib/theme';
import { Avatar, RoleBadge, ListItem, Divider, EmptyState } from '@/components/ui';

export default function UsersScreen() {
  const { colors } = useTheme();
  const { site } = useAuth();
  const { getUsersForSite } = useManagement();

  const users = site ? getUsersForSite(site.id) : [];

  if (users.length === 0) {
    return (
      <EmptyState
        icon="account-group-outline"
        title="No users found"
        description="No users are assigned to this site yet."
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
        {users.map((user, index) => (
          <View key={user.id}>
            <ListItem
              title={user.name}
              subtitle={user.email}
              inactive={!user.active}
              left={<Avatar name={user.name} size={40} />}
              right={<RoleBadge role={user.role} short />}
            />
            {index < users.length - 1 && <Divider inset={68} />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
