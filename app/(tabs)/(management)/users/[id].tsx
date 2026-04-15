import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';
import { useManagement } from '@/lib/context/ManagementContext';
import { Typography, Spacing, Radius, RoleConfig } from '@/lib/theme';
import { Avatar } from '@/components/ui';
import type { UserRole } from '@/lib/types';

// AP manages operatives only
const ROLES: { value: UserRole; icon: string }[] = [
  { value: 'Crane_Supervisor', icon: 'account-hard-hat-outline' },
  { value: 'Crane_Operator', icon: 'crane' },
  { value: 'Slinger_Signaller', icon: 'hand-wave-outline' },
  { value: 'Subcontractor', icon: 'office-building-outline' },
];

export default function EditUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { users, companies, updateUser, deactivateUser, reactivateUser, deleteUser } =
    useManagement();

  const user = users.find((u) => u.id === id);

  const [name, setName] = useState(user?.name ?? '');
  const [role, setRole] = useState<UserRole>(
    // If existing user has a role not in AP's list (e.g. Appointed_Person), show Crane_Operator
    ROLES.find((r) => r.value === user?.role) ? (user?.role ?? 'Crane_Operator') : 'Crane_Operator'
  );
  const [companyId, setCompanyId] = useState<string>(user?.companyId ?? '');

  if (!user) return null;

  const isSubcontractor = role === 'Subcontractor';
  const activeCompanies = companies.filter((c) => c.active);

  const hasChanges =
    name.trim() !== user.name ||
    role !== user.role ||
    (isSubcontractor && companyId !== user.companyId);

  const canSave =
    name.trim().length > 0 &&
    (!isSubcontractor || companyId.length > 0) &&
    hasChanges;

  function handleSave() {
    if (!canSave) return;
    updateUser(user!.id, {
      name: name.trim(),
      role,
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

  function handleDelete() {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user!.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteUser(user!.id);
            router.back();
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Identity header */}
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
        <Avatar name={name || user.name} size={52} />
        <View style={{ flex: 1, gap: Spacing.xs }}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            style={[
              Typography.headingMd,
              {
                color: colors.textPrimary,
                padding: 0,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                paddingBottom: 2,
              },
            ]}
          />
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

      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />

      {/* Deactivate / Reactivate */}
      <Pressable
        onPress={handleToggleActive}
        style={({ pressed }) => ({
          height: 52,
          borderRadius: Radius.lg,
          borderCurve: 'continuous',
          borderWidth: 1.5,
          borderColor: user.active ? colors.warning : colors.success,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={[
            Typography.bodySemibold,
            { color: user.active ? colors.warning : colors.success, fontSize: 16 },
          ]}
        >
          {user.active ? 'Deactivate User' : 'Reactivate User'}
        </Text>
      </Pressable>

      {/* Delete */}
      <Pressable
        onPress={handleDelete}
        style={({ pressed }) => ({
          height: 52,
          borderRadius: Radius.lg,
          borderCurve: 'continuous',
          borderWidth: 1.5,
          borderColor: colors.danger,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={[Typography.bodySemibold, { color: colors.danger, fontSize: 16 }]}
        >
          Delete User
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
