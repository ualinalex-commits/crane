import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/lib/theme';

export default function ManagementStack() {
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
        options={{ title: 'Management', headerLargeTitle: true }}
      />
      <Stack.Screen name="users/index" options={{ title: 'Users' }} />
      <Stack.Screen name="users/new" options={{ title: 'Add User', presentation: 'modal' }} />
      <Stack.Screen name="users/[id]" options={{ title: 'Edit User', presentation: 'modal' }} />
      <Stack.Screen name="cranes/index" options={{ title: 'Cranes' }} />
      <Stack.Screen name="cranes/new" options={{ title: 'Add Crane', presentation: 'modal' }} />
      <Stack.Screen name="cranes/[id]" options={{ title: 'Edit Crane', presentation: 'modal' }} />
      <Stack.Screen name="subcontractors/index" options={{ title: 'Subcontractors' }} />
      <Stack.Screen name="subcontractors/new" options={{ title: 'Add Subcontractor', presentation: 'modal' }} />
      <Stack.Screen name="subcontractors/[id]" options={{ title: 'Edit Subcontractor', presentation: 'modal' }} />
    </Stack>
  );
}
