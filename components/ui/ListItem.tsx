import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';
import { Typography, Spacing, Radius } from '@/lib/theme';
import { Avatar } from './Avatar';

interface ListItemProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  left?: React.ReactNode;
  right?: React.ReactNode;
  showChevron?: boolean;
  inactive?: boolean;
}

export function ListItem({
  title,
  subtitle,
  onPress,
  left,
  right,
  showChevron = true,
  inactive = false,
}: ListItemProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        backgroundColor: colors.surfaceRaised,
        opacity: pressed ? 0.75 : inactive ? 0.5 : 1,
      })}
    >
      {left && <View>{left}</View>}
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={[Typography.bodySemibold, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[Typography.bodySm, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {right && <View>{right}</View>}
      {showChevron && onPress && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.textTertiary}
        />
      )}
    </Pressable>
  );
}
