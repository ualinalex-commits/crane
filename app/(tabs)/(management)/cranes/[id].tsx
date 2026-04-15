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
import { useTheme } from '@/lib/hooks/useTheme';
import { useManagement } from '@/lib/context/ManagementContext';
import { Typography, Spacing, Radius, Shadow } from '@/lib/theme';

const COLOUR_OPTIONS = [
  '#3B82F6',
  '#8B5CF6',
  '#F97316',
  '#06B6D4',
  '#22C55E',
  '#EAB308',
  '#EC4899',
  '#EF4444',
  '#14B8A6',
  '#F59E0B',
];

export default function EditCraneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { cranes, updateCrane, deactivateCrane, reactivateCrane, deleteCrane } = useManagement();


  const crane = cranes.find((c) => c.id === id);

  const [name, setName] = useState(crane?.name ?? '');
  const [model, setModel] = useState(crane?.model ?? '');
  const [capacity, setCapacity] = useState(String(crane?.maxCapacityTonnes ?? ''));
  const [colour, setColour] = useState(crane?.colour ?? COLOUR_OPTIONS[0]);

  if (!crane) return null;

  const hasChanges =
    name.trim() !== crane.name ||
    model.trim() !== crane.model ||
    Number(capacity) !== crane.maxCapacityTonnes ||
    colour !== crane.colour;

  const canSave =
    name.trim().length > 0 &&
    model.trim().length > 0 &&
    Number(capacity) > 0 &&
    hasChanges;

  function handleSave() {
    if (!canSave) return;
    updateCrane(crane!.id, {
      name: name.trim(),
      model: model.trim(),
      maxCapacityTonnes: Number(capacity),
      colour,
    });
    router.back();
  }

  function handleToggleActive() {
    if (crane!.active) {
      deactivateCrane(crane!.id);
    } else {
      reactivateCrane(crane!.id);
    }
    router.back();
  }

  function handleDelete() {
    Alert.alert(
      'Delete Crane',
      `Are you sure you want to delete ${crane!.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCrane(crane!.id);
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
      <Section label="Crane Name">
        <FieldInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Tower Crane 3"
          autoCapitalize="words"
          colors={colors}
        />
      </Section>

      <Section label="Model">
        <FieldInput
          value={model}
          onChangeText={setModel}
          placeholder="e.g. Liebherr 380 EC-B"
          autoCapitalize="words"
          colors={colors}
        />
      </Section>

      <Section label="Max Capacity (tonnes)">
        <FieldInput
          value={capacity}
          onChangeText={setCapacity}
          placeholder="e.g. 16"
          keyboardType="numeric"
          colors={colors}
        />
      </Section>

      <Section label="Lane Colour">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {COLOUR_OPTIONS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColour(c)}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: c,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: colour === c ? 3 : 0,
                borderColor: colors.textPrimary,
                opacity: pressed ? 0.8 : 1,
              })}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colour }} />
          <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>{colour}</Text>
        </View>
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
          borderColor: crane.active ? colors.warning : colors.success,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={[
            Typography.bodySemibold,
            { color: crane.active ? colors.warning : colors.success, fontSize: 16 },
          ]}
        >
          {crane.active ? 'Deactivate Crane' : 'Reactivate Crane'}
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
        <Text style={[Typography.bodySemibold, { color: colors.danger, fontSize: 16 }]}>
          Delete Crane
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
  keyboardType?: 'default' | 'numeric' | 'email-address';
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
