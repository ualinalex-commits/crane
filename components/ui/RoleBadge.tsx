import React from 'react';
import { View, Text } from 'react-native';
import { Radius, Typography, RoleConfig } from '@/lib/theme';
import type { UserRole } from '@/lib/types';

interface RoleBadgeProps {
  role: UserRole;
  short?: boolean;
}

export function RoleBadge({ role, short = false }: RoleBadgeProps) {
  const config = RoleConfig[role];
  const label = short ? config.shortLabel : config.label;

  return (
    <View
      style={{
        backgroundColor: config.colour + '22',
        borderRadius: Radius.full,
        paddingHorizontal: short ? 8 : 10,
        paddingVertical: 3,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={[
          Typography.label,
          { color: config.colour },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
