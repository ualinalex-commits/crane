import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { Typography, Radius, Spacing } from '@/lib/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  colour?: string; // optional dot colour
  disabled?: boolean;
}

export function Chip({ label, selected = false, onPress, colour, disabled }: ChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: 7,
        borderRadius: Radius.full,
        borderCurve: 'continuous',
        backgroundColor: selected ? colors.accent : colors.surface,
        borderWidth: selected ? 0 : 1,
        borderColor: colors.border,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {colour && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colour,
          }}
        />
      )}
      <Text
        style={[
          Typography.bodyMd,
          {
            fontWeight: selected ? '600' : '400',
            color: selected ? '#FFFFFF' : colors.textPrimary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
