import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';
import { useManagement } from '@/lib/context/ManagementContext';
import { Typography, Spacing, Radius, RoleConfig } from '@/lib/theme';
import { Avatar } from '@/components/ui';
import { mockSites } from '@/lib/mock';
import type { UserRole } from '@/lib/types';

const ROLES: { value: UserRole; icon: string }[] = [
  { value: 'Appointed_Person', icon: 'account-star-outline' },
  { value: 'Crane_Supervisor', icon: 'account-hard-hat-outline' },
  { value: 'Crane_Operator', icon: 'crane' },
  { value: 'Slinger_Signaller', icon: 'hand-wave-outline' },
  { value: 'Subcontractor', icon: 'office-building-outline' },
];

export default function EditUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { users, companies, updateUser, deactivateUser, reactivateUser } = useManagement();

  const user = users.find((u) => u.id === id);

  const [role, setRole] = useState<UserRole>(user?.role ?? 'Crane_Operator');
  const [siteIds, setSiteIds] = useState<string[]>(user?.siteIds ?? []);
  const [companyId, setCompanyId] = useState<string>(user?.companyId ?? '');

  if (!user) return null;

  const isSubcontractor = role === 'Subcontractor';
  const activeCompanies = companies.filter((c) => c.active);

  const hasChanges =
    role !== user.role ||
    JSON.stringify([...siteIds].sort()) !== JSON.stringify([...user.siteIds].sort()) ||
    (isSubcontractor && companyId !== user.companyId);

  const canSave =
    siteIds.length > 0 &&
    (!isSubcontractor || companyId.length > 0) &&
    hasChanges;

  function toggleSite(sid: string) {
    setSiteIds((prev) =>
      prev.includes(sid) ? prev.filter((s) => s !== sid) : [...prev, sid]
    );
  }

  function handleSave() {
    if (!canSave) return;
    updateUser(user!.id, {
      role,
      siteIds,
      companyId: isSubcontractor ? companyId : undefined,
    });
    router.back();
  }

  function handleToggleActive() {
    if (user!.active) {
      deactivateUser(user!.id);
    } else {
      reactivateUser(user!.id);
    }
    router.back();
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Identity (read-only) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.lg,
          padding: Spacing.lg,
          backgroundColor: colors.surface,
          borderRadius: Radius.lg,
          borderCurve: 'continuous',
        }}
      >
        <Avatar name={user.name} size={52} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>{user.name}</Text>
          <Text style={[Typography.bodyMd, { color: colors.textSecondary }]}>{user.email}</Text>
        </View>
      </View>

      {/* Role */}
      <Section label="Role">
        <View style={{ gap: Spacing.sm }}>
          {ROLES.map(({ value, icon }) => {
            const config = RoleConfig[value];
            const isSelected = role === value;
            return (
              <Pressable
                key={value}
                onPress={() => setRole(value)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.md,
                  padding: Spacing.md,
                  borderRadius: Radius.lg,
                  borderCurve: 'continuous',
                  borderWidth: 1.5,
                  borderColor: isSelected ? config.colour : colors.border,
                  backgroundColor: isSelected ? config.colour + '18' : colors.surface,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: isSelected ? config.colour + '30' : colors.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={20}
                    color={isSelected ? config.colour : colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    Typography.bodySemibold,
                    { color: isSelected ? config.colour : colors.textPrimary },
                  ]}
                >
                  {config.label}
                </Text>
                {isSelected && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={18}
                    color={config.colour}
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </Section>

      {/* Site Access */}
      <Section label="Site Access">
        <View style={{ gap: Spacing.sm }}>
          {mockSites.map((s) => {
            const isSelected = siteIds.includes(s.id);
            return (
              <Pressable
                key={s.id}
                onPress={() => toggleSite(s.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.md,
                  padding: Spacing.md,
                  borderRadius: Radius.md,
                  borderCurve: 'continuous',
                  borderWidth: 1.5,
                  borderColor: isSelected ? colors.accent : colors.border,
                  backgroundColor: isSelected ? colors.accentSubtle : colors.surface,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <MaterialCommunityIcons
                  name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                  size={20}
                  color={isSelected ? colors.accent : colors.textTertiary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodySemibold, { color: colors.textPrimary }]}>
                    {s.name}
                  </Text>
                  <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
                    {s.location}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Section>

      {/* Company (Subcontractor only) */}
      {isSubcontractor && (
        <Section label="Company">
          <View style={{ gap: Spacing.sm }}>
            {activeCompanies.map((company) => {
              const isSelected = companyId === company.id;
              return (
                <Pressable
                  key={company.id}
                  onPress={() => setCompanyId(company.id)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.md,
                    padding: Spacing.md,
                    borderRadius: Radius.md,
                    borderCurve: 'continuous',
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.accent : colors.border,
                    backgroundColor: isSelected ? colors.accentSubtle : colors.surface,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <MaterialCommunityIcons
                    name="office-building-outline"
                    size={18}
                    color={isSelected ? colors.accent : colors.textSecondary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.bodySemibold, { color: colors.textPrimary }]}>
                      {company.name}
                    </Text>
                    <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
                      {company.contactName}
                    </Text>
                  </View>
                  {isSelected && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={colors.accent} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Section>
      )}

      {/* Save */}
      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        style={({ pressed }) => ({
          height: 52,
          borderRadius: Radius.lg,
          borderCurve: 'continuous',
          backgroundColor: canSave ? colors.accent : colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text
          style={[
            Typography.bodySemibold,
            { color: canSave ? '#FFF' : colors.textTertiary, fontSize: 16 },
          ]}
        >
          Save Changes
        </Text>
      </Pressable>

      {/* Separator */}
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />

      {/* Deactivate / Reactivate */}
      <Pressable
        onPress={handleToggleActive}
        style={({ pressed }) => ({
          height: 52,
          borderRadius: Radius.lg,
          borderCurve: 'continuous',
          borderWidth: 1.5,
          borderColor: user.active ? colors.danger : colors.success,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={[
            Typography.bodySemibold,
            { color: user.active ? colors.danger : colors.success, fontSize: 16 },
          ]}
        >
          {user.active ? 'Deactivate User' : 'Reactivate User'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={[Typography.bodySemibold, { color: colors.textPrimary }]}>{label}</Text>
      {children}
    </View>
  );
}
