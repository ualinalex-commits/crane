import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';
import { useAdmin } from '@/lib/context/AdminContext';
import { Typography, Spacing, Radius, RoleConfig } from '@/lib/theme';

export default function AddAppointedPersonScreen() {
  const { siteId, siteName } = useLocalSearchParams<{ siteId: string; siteName: string }>();
  const { colors } = useTheme();
  const { addAppointedPerson } = useAdmin();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && !!siteId;

  function handleSubmit() {
    if (!canSubmit) return;
    addAppointedPerson(siteId, name.trim(), email.trim().toLowerCase());
    router.back();
  }

  const apConfig = RoleConfig['Appointed_Person'];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      {siteName && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            padding: Spacing.md,
            backgroundColor: colors.surface,
            borderRadius: Radius.md,
            borderCurve: 'continuous',
          }}
        >
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textSecondary} />
          <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
            Adding to{' '}
            <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{siteName}</Text>
          </Text>
        </View>
      )}

      <Section label="Full Name">
        <FieldInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Sarah Mitchell"
          autoCapitalize="words"
          colors={colors}
        />
      </Section>

      <Section label="Email">
        <FieldInput
          value={email}
          onChangeText={setEmail}
          placeholder="e.g. s.mitchell@site.co.uk"
          keyboardType="email-address"
          autoCapitalize="none"
          colors={colors}
        />
      </Section>

      <Section label="Role">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.md,
            padding: Spacing.md,
            borderRadius: Radius.lg,
            borderCurve: 'continuous',
            borderWidth: 1.5,
            borderColor: apConfig.colour,
            backgroundColor: apConfig.colour + '18',
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: apConfig.colour + '30',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="account-star-outline" size={20} color={apConfig.colour} />
          </View>
          <Text style={[Typography.bodySemibold, { color: apConfig.colour, flex: 1 }]}>
            {apConfig.label}
          </Text>
          <MaterialCommunityIcons name="lock-outline" size={16} color={apConfig.colour + 'AA'} />
        </View>
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
          Add Appointed Person
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
