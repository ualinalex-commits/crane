import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/context/AuthContext';

export default function Root() {
  const { user, site, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (user && site) {
    return <Redirect href="/(tabs)/(bookings)" />;
  }
  return <Redirect href="/(auth)/login" />;
}
