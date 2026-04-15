import React from 'react';
import { ScrollView, View, Text, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/hooks/useTheme';
import { useAdmin } from '@/lib/context/AdminContext';
import { Typography, Spacing, Radius, Shadow } from '@/lib/theme';
import { EmptyState } from '@/components/ui';

export default function AdminSitesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { sites, deleteSite } = useAdmin();

  function handleDeleteSite(id: string, name: string) {
    Alert.alert(
      'Delete Site',
      `Are you sure you want to delete "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteSite(id) },
      ]
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {sites.length === 0 ? (
        <EmptyState
          icon="map-marker-outline"
          title="No sites"
          description="Add your first construction site to get started."
        />
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: Spacing.lg,
            gap: Spacing.md,
            paddingBottom: insets.bottom + 88,
          }}
        >
          {sites.map((site) => (
            <View
              key={site.id}
              style={{
                borderRadius: Radius.lg,
                borderCurve: 'continuous',
                backgroundColor: colors.surfaceRaised,
                borderWidth: 1,
                borderColor: colors.border,
                padding: Spacing.lg,
                gap: Spacing.md,
                ...Shadow.sm,
              }}
            >
              <View style={{ gap: 3 }}>
                <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>
                  {site.name}
                </Text>
                <Text style={[Typography.bodyMd, { color: colors.textSecondary }]}>
                  {site.location}
                </Text>
                <Text style={[Typography.bodySm, { color: colors.textTertiary }]}>
                  {site.address}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/(admin)/add-ap',
                      params: { siteId: site.id, siteName: site.name },
                    } as any)
                  }
                  style={({ pressed }) => ({
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: Spacing.xs,
                    paddingVertical: Spacing.sm,
                    paddingHorizontal: Spacing.md,
                    borderRadius: Radius.md,
                    borderCurve: 'continuous',
                    backgroundColor: colors.accentSubtle,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <MaterialCommunityIcons
                    name="account-plus-outline"
                    size={15}
                    color={colors.accent}
                  />
                  <Text
                    style={[
                      Typography.bodySm,
                      { color: colors.accent, fontWeight: '600' as const },
                    ]}
                  >
                    Add Appointed Person
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/(admin)/[siteId]',
                      params: { siteId: site.id },
                    } as any)
                  }
                  style={({ pressed }) => ({
                    width: 40,
                    height: 40,
                    borderRadius: Radius.md,
                    borderCurve: 'continuous',
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                </Pressable>

                <Pressable
                  onPress={() => handleDeleteSite(site.id, site.name)}
                  style={({ pressed }) => ({
                    width: 40,
                    height: 40,
                    borderRadius: Radius.md,
                    borderCurve: 'continuous',
                    backgroundColor: colors.dangerSubtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color={colors.danger}
                  />
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Pressable
        onPress={() => router.push('/(tabs)/(admin)/new-site' as any)}
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
