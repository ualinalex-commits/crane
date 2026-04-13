import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/lib/theme';

export default function TimelineStack() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Timeline', headerLargeTitle: true }}
      />
    </Stack>
  );
}
