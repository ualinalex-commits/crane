import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/lib/hooks/useTheme';
import { useManagement } from '@/lib/context/ManagementContext';
import { Typography, Spacing, Radius } from '@/lib/theme';

export default function NewSubcontractorScreen() {
  const { colors } = useTheme();
  const { addCompany } = useManagement();

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const canSubmit =
    companyName.trim().length > 0 &&
    contactName.trim().length > 0 &&
    contactEmail.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    addCompany({
      name: companyName.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim() || undefined,
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

      <Section label="Contact Phone (optional)">
        <FieldInput
          value={contactPhone}
          onChangeText={setContactPhone}
          placeholder="e.g. 07700 900123"
          keyboardType="phone-pad"
          colors={colors}
        />
      </Section>

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
          Add Subcontractor
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
