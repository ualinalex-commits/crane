import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';
import { useManagement } from '@/lib/context/ManagementContext';
import { useAuth } from '@/lib/context/AuthContext';
import { Typography, Spacing, Radius, RoleConfig } from '@/lib/theme';
import type { UserRole } from '@/lib/types';

// AP manages operatives only — not other APs or Admins
const ROLES: { value: UserRole; icon: string }[] = [
  { value: 'Crane_Supervisor', icon: 'account-hard-hat-outline' },
  { value: 'Crane_Operator', icon: 'crane' },
  { value: 'Slinger_Signaller', icon: 'hand-wave-outline' },
  { value: 'Subcontractor', icon: 'office-building-outline' },
];

export default function NewUserScreen() {
  const { colors } = useTheme();
  const { site } = useAuth();
  const { addUser, companies } = useManagement();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Crane_Operator');
  const [companyId, setCompanyId] = useState<string>('');

  const activeCompanies = companies.filter((c) => c.active);
  const isSubcontractor = role === 'Subcontractor';

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    (!isSubcontractor || companyId.length > 0);

  function handleSubmit() {
    if (!canSubmit) return;
    addUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      siteIds: site ? [site.id] : [],
      companyId: isSubcontractor ? companyId : undefined,
      active: true,
    });
    router.back();
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <Section label="Full Name">
        <FieldInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. James Whitfield"
          autoCapitalize="words"
          colors={colors}
        />
      </Section>

      <Section label="Email">
        <FieldInput
          value={email}
          onChangeText={setEmail}
          placeholder="e.g. j.whitfield@site.co.uk"
          keyboardType="email-address"
          autoCapitalize="none"
          colors={colors}
        />
      </Section>

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

      {isSubcontractor && (
        <Section label="Company">
          <View style={{ gap: Spacing.sm }}>
            {activeCompanies.length === 0 ? (
              <Text style={[Typography.bodySm, { color: colors.textTertiary }]}>
                No active companies. Add a subcontractor company first.
              </Text>
            ) : (
              activeCompanies.map((company) => {
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
              })
            )}
          </View>
        </Section>
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        style={({ pressed }) => ({
          height: 52,
          borderRadius: Radius.lg,
          borderCurve: 'continuous',
          backgroundColor: canSubmit ? colors.accent : colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text
          style={[
            Typography.bodySemibold,
            { color: canSubmit ? '#FFF' : colors.textTertiary, fontSize: 16 },
          ]}
        >
          Add User
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

function FieldInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  colors,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      keyboardType={keyboardType ?? 'default'}
      autoCapitalize={autoCapitalize ?? 'sentences'}
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: Radius.md,
        padding: Spacing.md,
        color: colors.textPrimary,
        fontSize: 14,
        backgroundColor: colors.surface,
      }}
    />
  );
}
