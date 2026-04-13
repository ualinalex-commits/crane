import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { Typography, Radius, Spacing } from '@/lib/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
}: ButtonProps) {
  const { colors } = useTheme();

  const heights: Record<ButtonSize, number> = { sm: 36, md: 44, lg: 52 };
  const textSizes: Record<ButtonSize, object> = {
    sm: { fontSize: 13, fontWeight: '600' as const },
    md: { fontSize: 15, fontWeight: '600' as const },
    lg: { fontSize: 17, fontWeight: '700' as const },
  };
  const paddings: Record<ButtonSize, number> = { sm: 12, md: 16, lg: 20 };

  const bgColors: Record<ButtonVariant, string> = {
    primary: colors.accent,
    secondary: colors.surface,
    ghost: 'transparent',
    destructive: colors.danger,
    success: colors.success,
  };
  const textColors: Record<ButtonVariant, string> = {
    primary: '#FFFFFF',
    secondary: colors.textPrimary,
    ghost: colors.accent,
    destructive: '#FFFFFF',
    success: '#FFFFFF',
  };
  const borderColors: Record<ButtonVariant, string | undefined> = {
    primary: undefined,
    secondary: colors.border,
    ghost: undefined,
    destructive: undefined,
    success: undefined,
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        height: heights[size],
        paddingHorizontal: paddings[size],
        backgroundColor: bgColors[variant],
        borderRadius: Radius.md,
        borderCurve: 'continuous',
        borderWidth: borderColors[variant] ? 1 : 0,
        borderColor: borderColors[variant],
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: Spacing.sm,
        opacity: pressed || isDisabled ? 0.65 : 1,
        alignSelf: fullWidth ? 'stretch' : 'auto',
      })}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textColors[variant]}
        />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text
            style={[
              textSizes[size],
              { color: textColors[variant] },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
