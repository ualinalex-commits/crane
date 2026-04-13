import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/lib/context/AuthContext';
import { mockUsers, mockSites } from '@/lib/mock';
import { useTheme } from '@/lib/hooks/useTheme';
import { Typography, Spacing, Radius, Colors, RoleConfig } from '@/lib/theme';
import type { UserRole, Site, User } from '@/lib/types';

// One representative user per role for the login picker
const ROLE_USERS: { role: UserRole; userId: string; icon: string; description: string }[] = [
  {
    role: 'Appointed_Person',
    userId: 'user-ap',
    icon: 'shield-crown-outline',
    description: 'Approve bookings · Manage site',
  },
  {
    role: 'Crane_Supervisor',
    userId: 'user-cs',
    icon: 'binoculars',
    description: 'View approved bookings & timeline',
  },
  {
    role: 'Crane_Operator',
    userId: 'user-co',
    icon: 'crane',
    description: 'View approved bookings & timeline',
  },
  {
    role: 'Slinger_Signaller',
    userId: 'user-ss',
    icon: 'hand-wave-outline',
    description: 'View approved bookings & timeline',
  },
  {
    role: 'Subcontractor',
    userId: 'user-sub-1',
    icon: 'hard-hat',
    description: 'Submit & track booking requests',
  },
];

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { login } = useAuth();

  const [selectedSiteId, setSelectedSiteId] = useState<string>(mockSites[0].id);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const selectedRoleEntry = ROLE_USERS.find((r) => r.userId === selectedUserId);
  const selectedUser = mockUsers.find((u) => u.id === selectedUserId);

  function handleEnter() {
    if (!selectedUserId || !selectedSiteId) return;
    login(selectedUserId, selectedSiteId);
    router.replace('/(tabs)/(bookings)');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.xxxl,
          paddingBottom: Spacing.xxxl,
          gap: Spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Wordmark */}
        <View style={{ alignItems: 'center', gap: Spacing.md }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: Radius.xl,
              borderCurve: 'continuous',
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(249,115,22,0.35)',
            }}
          >
            <MaterialCommunityIcons name="crane" size={40} color="#FFF" />
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={[Typography.headingXl, { color: colors.textPrimary }]}>
              Crane 2.0
            </Text>
            <Text style={[Typography.bodyMd, { color: colors.textSecondary }]}>
              Construction site lift management
            </Text>
          </View>
        </View>

        {/* Site Selector */}
        <View style={{ gap: Spacing.md }}>
          <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>
            Select site
          </Text>
          <View style={{ gap: Spacing.sm }}>
            {mockSites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                selected={selectedSiteId === site.id}
                onPress={() => setSelectedSiteId(site.id)}
              />
            ))}
          </View>
        </View>

        {/* Role Selector */}
        <View style={{ gap: Spacing.md }}>
          <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>
            Sign in as
          </Text>
          <View style={{ gap: Spacing.sm }}>
            {ROLE_USERS.map((entry) => (
              <RoleCard
                key={entry.userId}
                entry={entry}
                selected={selectedUserId === entry.userId}
                onPress={() => setSelectedUserId(entry.userId)}
              />
            ))}
          </View>
        </View>

        {/* Enter Button */}
        <Pressable
          onPress={handleEnter}
          disabled={!selectedUserId}
          style={({ pressed }) => ({
            height: 56,
            borderRadius: Radius.lg,
            borderCurve: 'continuous',
            backgroundColor: selectedUserId ? colors.accent : colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
            flexDirection: 'row',
            gap: Spacing.sm,
          })}
        >
          <Text
            style={[
              Typography.headingMd,
              {
                color: selectedUserId ? '#FFF' : colors.textTertiary,
                fontSize: 17,
              },
            ]}
          >
            {selectedUser && selectedRoleEntry
              ? `Enter as ${RoleConfig[selectedRoleEntry.role].label}`
              : 'Choose a role to continue'}
          </Text>
          {selectedUserId && (
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
          )}
        </Pressable>

        {/* Dev note */}
        <Text
          style={[
            Typography.bodySm,
            { color: colors.textTertiary, textAlign: 'center' },
          ]}
        >
          Demo mode — select any role to explore the app
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SiteCard({
  site,
  selected,
  onPress,
}: {
  site: Site;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        borderCurve: 'continuous',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.accent : colors.border,
        backgroundColor: selected ? colors.accentSubtle : colors.surfaceRaised,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: Radius.md,
          backgroundColor: selected ? colors.accent : colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons
          name="map-marker-outline"
          size={20}
          color={selected ? '#FFF' : colors.textSecondary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.bodySemibold, { color: colors.textPrimary }]}>
          {site.name}
        </Text>
        <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
          {site.location}
        </Text>
      </View>
      {selected && (
        <MaterialCommunityIcons name="check-circle" size={22} color={colors.accent} />
      )}
    </Pressable>
  );
}

function RoleCard({
  entry,
  selected,
  onPress,
}: {
  entry: (typeof ROLE_USERS)[number];
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const config = RoleConfig[entry.role];
  const user = mockUsers.find((u) => u.id === entry.userId);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        borderCurve: 'continuous',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? config.colour : colors.border,
        backgroundColor: selected ? config.colour + '12' : colors.surfaceRaised,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: Radius.md,
          backgroundColor: selected ? config.colour : colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons
          name={entry.icon as any}
          size={22}
          color={selected ? '#FFF' : colors.textSecondary}
        />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[Typography.bodySemibold, { color: colors.textPrimary }]}>
          {config.label}
        </Text>
        <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
          {entry.description}
        </Text>
        {user && (
          <Text style={[Typography.bodySm, { color: colors.textTertiary }]}>
            {user.name}
          </Text>
        )}
      </View>
      {selected && (
        <MaterialCommunityIcons
          name="check-circle"
          size={22}
          color={config.colour}
        />
      )}
    </Pressable>
  );
}
