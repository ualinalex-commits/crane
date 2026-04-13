import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/lib/context/AuthContext';
import { useTheme } from '@/lib/hooks/useTheme';
import { Typography, Spacing, Radius } from '@/lib/theme';
import type { Site } from '@/lib/types';

type Step = 'credentials' | 'site';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login, switchSite, availableSites, user } = useAuth();

  const [step, setStep]         = useState<Step>('credentials');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  // After login() resolves and state re-renders, decide what to show
  useEffect(() => {
    if (!user) return;
    if (availableSites.length === 1) {
      // Only one site — auto-select and navigate
      switchSite(availableSites[0].id);
      router.replace('/(tabs)/(bookings)');
    } else if (availableSites.length > 1) {
      setStep('site');
    }
  }, [user?.id]);

  async function handleSignIn() {
    if (!email.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // Navigation handled by the useEffect above
    } catch (e: any) {
      setError(e.message ?? 'Sign in failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  function handleSiteSelect(siteId: string) {
    switchSite(siteId);
    router.replace('/(tabs)/(bookings)');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: Spacing.xl,
            paddingTop: Spacing.xxxl,
            paddingBottom: Spacing.xxxl,
            gap: Spacing.xxxl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', gap: Spacing.md }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: Radius.xl,
                borderCurve: 'continuous',
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(249,115,22,0.35)',
              }}
            >
              <MaterialCommunityIcons name="crane" size={40} color="#FFF" />
            </View>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={[Typography.headingXl, { color: colors.textPrimary }]}>
                Crane 2.0
              </Text>
              <Text style={[Typography.bodyMd, { color: colors.textSecondary }]}>
                Construction site lift management
              </Text>
            </View>
          </View>

          {step === 'credentials' ? (
            /* ── Step 1: email + password ─────────────────────────────── */
            <View style={{ gap: Spacing.lg }}>
              <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>
                Sign in
              </Text>

              {/* Email */}
              <View style={{ gap: Spacing.xs }}>
                <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
                  Email address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    height: 52,
                    borderRadius: Radius.md,
                    borderCurve: 'continuous',
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceRaised,
                    paddingHorizontal: Spacing.lg,
                    color: colors.textPrimary,
                    ...Typography.bodyMd,
                  }}
                />
              </View>

              {/* Password */}
              <View style={{ gap: Spacing.xs }}>
                <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
                  Password
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  style={{
                    height: 52,
                    borderRadius: Radius.md,
                    borderCurve: 'continuous',
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceRaised,
                    paddingHorizontal: Spacing.lg,
                    color: colors.textPrimary,
                    ...Typography.bodyMd,
                  }}
                />
              </View>

              {/* Error */}
              {error && (
                <View
                  style={{
                    flexDirection: 'row',
                    gap: Spacing.sm,
                    padding: Spacing.md,
                    borderRadius: Radius.md,
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FECACA',
                  }}
                >
                  <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
                  <Text style={[Typography.bodySm, { color: '#DC2626', flex: 1 }]}>{error}</Text>
                </View>
              )}

              {/* Sign in button */}
              <Pressable
                onPress={handleSignIn}
                disabled={loading || !email.trim() || !password}
                style={({ pressed }) => ({
                  height: 56,
                  borderRadius: Radius.lg,
                  borderCurve: 'continuous',
                  backgroundColor:
                    email.trim() && password ? colors.accent : colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed || loading ? 0.7 : 1,
                  flexDirection: 'row',
                  gap: Spacing.sm,
                })}
              >
                {loading ? (
                  <Text style={[Typography.headingMd, { color: '#FFF', fontSize: 17 }]}>
                    Signing in…
                  </Text>
                ) : (
                  <>
                    <Text
                      style={[
                        Typography.headingMd,
                        {
                          fontSize: 17,
                          color: email.trim() && password ? '#FFF' : colors.textTertiary,
                        },
                      ]}
                    >
                      Sign in
                    </Text>
                    {email.trim() && password && (
                      <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
                    )}
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            /* ── Step 2: site picker ──────────────────────────────────── */
            <View style={{ gap: Spacing.md }}>
              <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>
                Select your site
              </Text>
              <View style={{ gap: Spacing.sm }}>
                {availableSites.map((site) => (
                  <SiteCard key={site.id} site={site} onPress={() => handleSiteSelect(site.id)} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── SiteCard ─────────────────────────────────────────────────────────────────

function SiteCard({ site, onPress }: { site: Site; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceRaised,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: Radius.md,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.bodySemibold, { color: colors.textPrimary }]}>{site.name}</Text>
        <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>{site.location}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
    </Pressable>
  );
}
