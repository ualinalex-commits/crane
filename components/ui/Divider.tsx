import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';

interface DividerProps {
  inset?: number;
}

export function Divider({ inset = 0 }: DividerProps) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.border,
        marginLeft: inset,
      }}
    />
  );
}
