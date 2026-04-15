import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/lib/hooks/useTheme';
import { useAdmin } from '@/lib/context/AdminContext';
import { Typography, Spacing, Radius } from '@/lib/theme';

export default function NewSiteScreen() {
  const { colors } = useTheme();
  const { addSite } = useAdmin();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');

  const canSubmit =
    name.trim().length > 0 &&
    location.trim().length > 0 &&
    address.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    addSite({ name: name.trim(), location: location.trim(), address: address.trim() });
    router.back();
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <Section label="Site Name">
        <FieldInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Canary Wharf Phase 3"
          autoCapitalize="words"
          colors={colors}
        />
      </Section>

      <Section label="Location">
        <FieldInput
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. London, UK"
          autoCapitalize="words"
          colors={colors}
        />
      </Section>

      <Section label="Address">
        <FieldInput
          value={address}
          onChangeText={setAddress}
          placeholder="e.g. Bank Street, London E14 5JP"
          autoCapitalize="words"
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
          Add Site
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
  autoCapitalize,
  colors,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
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
