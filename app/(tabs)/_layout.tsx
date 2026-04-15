import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/lib/context/AuthContext';
import { Colors } from '@/lib/theme';

export default function TabLayout() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const isAdmin = user?.role === 'Admin';
  const isAP = user?.role === 'Appointed_Person';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* Admin-only tab */}
      <Tabs.Screen
        name="(admin)"
        options={{
          title: 'Admin',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="shield-crown-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Standard tabs — hidden for Admin */}
      <Tabs.Screen
        name="(bookings)"
        options={{
          title: 'Bookings',
          href: isAdmin ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-check-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="(logs)"
        options={{
          title: 'Crane Logs',
          href: isAdmin || user?.role === 'Subcontractor' ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-list-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="(pending)"
        options={{
          title: 'Pending',
          href: isAdmin ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clock-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="(timeline)"
        options={{
          title: 'Timeline',
          href: isAdmin ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="timeline-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="(management)"
        options={{
          title: 'Management',
          href: isAP ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
