import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/context/AuthContext';

export default function Root() {
  const { user, site } = useAuth();
  if (user && site) {
    return <Redirect href="/(tabs)/(bookings)" />;
  }
  return <Redirect href="/(auth)/login" />;
}
