import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';
import { Typography, Spacing } from '@/lib/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xxxl,
        gap: Spacing.lg,
      }}
    >
      {icon && (
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons
            name={icon}
            size={36}
            color={colors.textTertiary}
          />
        </View>
      )}
      <View style={{ alignItems: 'center', gap: Spacing.sm }}>
        <Text
          style={[Typography.headingMd, { color: colors.textPrimary, textAlign: 'center' }]}
        >
          {title}
        </Text>
        {description && (
          <Text
            style={[
              Typography.bodyMd,
              { color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
            ]}
          >
            {description}
          </Text>
        )}
      </View>
      {action && (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="primary"
          size="md"
        />
      )}
    </View>
  );
}
