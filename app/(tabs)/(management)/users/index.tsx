import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/hooks/useTheme';
import { useManagement } from '@/lib/context/ManagementContext';
import { useAuth } from '@/lib/context/AuthContext';
import { Spacing, Radius, Shadow } from '@/lib/theme';
import { Avatar, RoleBadge, ListItem, Divider, EmptyState } from '@/components/ui';

export default function UsersScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { site } = useAuth();
  const { getUsersForSite } = useManagement();

  const users = site ? getUsersForSite(site.id) : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {users.length === 0 ? (
        <EmptyState
          icon="account-group-outline"
          title="No users found"
          description="No users are assigned to this site yet."
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
            {users.map((user, index) => (
              <View key={user.id}>
                <ListItem
                  title={user.name}
                  subtitle={user.email}
                  inactive={!user.active}
                  onPress={() => router.push(`/(tabs)/(management)/users/${user.id}` as any)}
                  left={<Avatar name={user.name} size={40} />}
                  right={<RoleBadge role={user.role} short />}
                />
                {index < users.length - 1 && <Divider inset={68} />}
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
