import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/lib/theme';

export default function AdminStack() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Sites', headerLargeTitle: true }} />
      <Stack.Screen name="new-site" options={{ title: 'Add Site', presentation: 'modal' }} />
      <Stack.Screen name="[siteId]" options={{ title: 'Edit Site', presentation: 'modal' }} />
      <Stack.Screen name="add-ap" options={{ title: 'Add Appointed Person', presentation: 'modal' }} />
    </Stack>
  );
}
