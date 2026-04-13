import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { Typography, Spacing } from '@/lib/theme';

interface SectionHeaderProps {
  title: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  count?: number;
}

export function SectionHeader({ title, action, count }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>{title}</Text>
        {count !== undefined && (
          <View
            style={{
              backgroundColor: colors.accent,
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 6,
            }}
          >
            <Text style={[Typography.label, { color: '#FFF' }]}>{count}</Text>
          </View>
        )}
      </View>
      {action && (
        <Pressable onPress={action.onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Text style={[Typography.bodyMd, { color: colors.accent, fontWeight: '600' }]}>
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
