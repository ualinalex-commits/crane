import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/lib/theme';

export default function PendingStack() {
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
      <Stack.Screen
        name="index"
        options={{ title: 'Pending Bookings', headerLargeTitle: true }}
      />
      <Stack.Screen
        name="new"
        options={{ title: 'New Booking Request', presentation: 'modal' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Booking Detail', presentation: 'modal' }}
      />
    </Stack>
  );
}
