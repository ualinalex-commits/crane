import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/lib/hooks/useTheme';
import { useManagement } from '@/lib/context/ManagementContext';
import { Typography, Spacing, Radius } from '@/lib/theme';

export default function EditSubcontractorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { companies, updateCompany, deactivateCompany, reactivateCompany } = useManagement();

  const company = companies.find((c) => c.id === id);

  const [companyName, setCompanyName] = useState(company?.name ?? '');
  const [contactName, setContactName] = useState(company?.contactName ?? '');
  const [contactEmail, setContactEmail] = useState(company?.contactEmail ?? '');
  const [contactPhone, setContactPhone] = useState(company?.contactPhone ?? '');

  if (!company) return null;

  const hasChanges =
    companyName.trim() !== company.name ||
    contactName.trim() !== company.contactName ||
    contactEmail.trim() !== company.contactEmail ||
    contactPhone.trim() !== (company.contactPhone ?? '');

  const canSave =
    companyName.trim().length > 0 &&
    contactName.trim().length > 0 &&
    contactEmail.trim().length > 0 &&
    hasChanges;

  function handleSave() {
    if (!canSave) return;
    updateCompany(company!.id, {
      name: companyName.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim() || undefined,
    });
    router.back();
  }

  function handleToggleActive() {
    if (company!.active) {
      deactivateCompany(company!.id);
    } else {
      reactivateCompany(company!.id);
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
      <Section label="Company Name">
        <FieldInput
          value={companyName}
          onChangeText={setCompanyName}
          placeholder="e.g. Apex Steelworks Ltd"
          autoCapitalize="words"
          colors={colors}
        />
      </Section>

      <Section label="Contact Name">
        <FieldInput
          value={contactName}
          onChangeText={setContactName}
          placeholder="e.g. Dave Flanagan"
          autoCapitalize="words"
          colors={colors}
        />
      </Section>

      <Section label="Contact Email">
        <FieldInput
          value={contactEmail}
          onChangeText={setContactEmail}
          placeholder="e.g. dave@apexsteel.co.uk"
          keyboardType="email-address"
          autoCapitalize="none"
          colors={colors}
        />
      </Section>

      <Section label="Contact Phone">
        <FieldInput
          value={contactPhone}
          onChangeText={setContactPhone}
          placeholder="e.g. 07700 900123"
          keyboardType="phone-pad"
          colors={colors}
        />
      </Section>

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
          borderColor: company.active ? colors.danger : colors.success,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={[
            Typography.bodySemibold,
            { color: company.active ? colors.danger : colors.success, fontSize: 16 },
          ]}
        >
          {company.active ? 'Deactivate Subcontractor' : 'Reactivate Subcontractor'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

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
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
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
