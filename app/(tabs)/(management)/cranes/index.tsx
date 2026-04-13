import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/hooks/useTheme';
import { useManagement } from '@/lib/context/ManagementContext';
import { useAuth } from '@/lib/context/AuthContext';
import { Spacing, Radius, Shadow } from '@/lib/theme';
import { ListItem, Divider, EmptyState, Badge } from '@/components/ui';

export default function CranesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { site } = useAuth();
  const { getCranesForSite } = useManagement();

  const cranes = site ? getCranesForSite(site.id) : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {cranes.length === 0 ? (
        <EmptyState
          icon="crane"
          title="No cranes found"
          description="No cranes are configured for this site yet."
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
            {cranes.map((crane, index) => (
              <View key={crane.id}>
                <ListItem
                  title={crane.name}
                  subtitle={`${crane.model} · ${crane.maxCapacityTonnes}t`}
                  inactive={!crane.active}
                  onPress={() => router.push(`/(tabs)/(management)/cranes/${crane.id}` as any)}
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
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/(tabs)/(management)/cranes/new')}
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
