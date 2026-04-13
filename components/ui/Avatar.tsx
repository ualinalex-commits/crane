import React from 'react';
import { View, Text } from 'react-native';
import { Radius, Typography } from '@/lib/theme';

interface AvatarProps {
  name: string;
  size?: number;
  colour?: string;
}

// Deterministic colour from name
const AVATAR_COLOURS = [
  '#F97316', '#3B82F6', '#8B5CF6', '#22C55E',
  '#EF4444', '#06B6D4', '#EC4899', '#EAB308',
];

function colourFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length];
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({ name, size = 40, colour }: AvatarProps) {
  const bg = colour ?? colourFromName(name);
  const initials = initialsFromName(name);
  const fontSize = Math.round(size * 0.36);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize,
          fontWeight: '700',
          color: '#FFFFFF',
          letterSpacing: 0.5,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
