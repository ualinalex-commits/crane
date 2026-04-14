import React, { useState, useEffect, useRef } from 'react';
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

type Step = 'email' | 'pin' | 'site';

const PIN_LENGTH = 8;

export default function LoginScreen() {
  const { colors } = useTheme();
  const { requestPin, verifyPin, switchSite, availableSites, user } = useAuth();

  const [step, setStep]         = useState<Step>('email');
  const [email, setEmail]       = useState('');
  const [pin, setPin]           = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [pinExpired, setPinExpired] = useState(false);

  const pinInputRef = useRef<TextInput>(null);

  // After verifyPin() resolves and AuthContext updates, decide next screen
  useEffect(() => {
    if (!user) return;
    if (availableSites.length === 1) {
      switchSite(availableSites[0].id);
      router.replace('/(tabs)/(bookings)');
    } else if (availableSites.length > 1) {
      setStep('site');
    }
  }, [user?.id]);

  // ── Step 1: submit email ──────────────────────────────────────────────────

  async function handleEmailContinue() {
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await requestPin(email.trim());
      setPin('');
      setPinExpired(false);
      setStep('pin');
      // Focus PIN input after layout settles
      setTimeout(() => pinInputRef.current?.focus(), 150);
    } catch (e: any) {
      if (e.message === 'not_found') {
        setError('You are not registered. Please contact your Appointed Person.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: verify PIN ────────────────────────────────────────────────────

  async function handleVerifyPin(digits: string) {
    if (digits.length < PIN_LENGTH) return;
    setError(null);
    setPinExpired(false);
    setLoading(true);
    try {
      await verifyPin(email.trim(), digits);
      // Navigation handled by the useEffect above
    } catch (e: any) {
      setPin('');
      if (e.message === 'expired_pin') {
        setPinExpired(true);
        setError(null);
      } else if (e.message === 'invalid_pin') {
        setError('Incorrect PIN. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setTimeout(() => pinInputRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  function handlePinChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPin(digits);
    setError(null);
    setPinExpired(false);
    if (digits.length === PIN_LENGTH) {
      handleVerifyPin(digits);
    }
  }

  async function handleResendPin() {
    setError(null);
    setPinExpired(false);
    setPin('');
    setLoading(true);
    try {
      await requestPin(email.trim());
      setTimeout(() => pinInputRef.current?.focus(), 150);
    } catch {
      setError('Failed to resend PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleBackToEmail() {
    setStep('email');
    setPin('');
    setError(null);
    setPinExpired(false);
  }

  // ── Step 3: site select ───────────────────────────────────────────────────

  function handleSiteSelect(siteId: string) {
    switchSite(siteId);
    router.replace('/(tabs)/(bookings)');
  }

  // ── Shared error banner ───────────────────────────────────────────────────

  function ErrorBanner({ message }: { message: string }) {
    return (
      <View
        style={{
          flexDirection: 'row',
          gap: Spacing.sm,
          padding: Spacing.md,
          borderRadius: Radius.md,
          borderCurve: 'continuous',
          backgroundColor: '#FEF2F2',
          borderWidth: 1,
          borderColor: '#FECACA',
        }}
      >
        <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
        <Text style={[Typography.bodySm, { color: '#DC2626', flex: 1 }]}>{message}</Text>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
          {/* ── Logo ──────────────────────────────────────────────────── */}
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

          {/* ── Step 1: email ─────────────────────────────────────────── */}
          {step === 'email' && (
            <View style={{ gap: Spacing.lg }}>
              <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>
                Sign in
              </Text>

              <View style={{ gap: Spacing.xs }}>
                <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
                  Email address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(null); }}
                  onSubmitEditing={handleEmailContinue}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
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

              {error && <ErrorBanner message={error} />}

              <Pressable
                onPress={handleEmailContinue}
                disabled={loading || !email.trim()}
                style={({ pressed }) => ({
                  height: 56,
                  borderRadius: Radius.lg,
                  borderCurve: 'continuous',
                  backgroundColor: email.trim() ? colors.accent : colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed || loading ? 0.7 : 1,
                  flexDirection: 'row',
                  gap: Spacing.sm,
                })}
              >
                {loading ? (
                  <Text style={[Typography.headingMd, { color: '#FFF', fontSize: 17 }]}>
                    Sending PIN…
                  </Text>
                ) : (
                  <>
                    <Text
                      style={[
                        Typography.headingMd,
                        { fontSize: 17, color: email.trim() ? '#FFF' : colors.textTertiary },
                      ]}
                    >
                      Continue
                    </Text>
                    {email.trim() && (
                      <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
                    )}
                  </>
                )}
              </Pressable>
            </View>
          )}

          {/* ── Step 2: PIN entry ──────────────────────────────────────── */}
          {step === 'pin' && (
            <View style={{ gap: Spacing.lg }}>
              {/* Back button + heading */}
              <View style={{ gap: Spacing.xs }}>
                <Pressable
                  onPress={handleBackToEmail}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    alignSelf: 'flex-start',
                    opacity: pressed ? 0.6 : 1,
                    marginBottom: Spacing.xs,
                  })}
                >
                  <MaterialCommunityIcons name="arrow-left" size={16} color={colors.textSecondary} />
                  <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>Back</Text>
                </Pressable>
                <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>
                  Enter your PIN
                </Text>
                <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
                  We sent an 8-digit PIN to{' '}
                  <Text style={{ color: colors.textPrimary }}>{email}</Text>
                </Text>
              </View>

              {/* PIN boxes */}
              <PinBoxes
                ref={pinInputRef}
                value={pin}
                onChange={handlePinChange}
                disabled={loading}
                colors={colors}
              />

              {/* Error banner */}
              {error && <ErrorBanner message={error} />}

              {/* Expired state */}
              {pinExpired && (
                <View
                  style={{
                    gap: Spacing.sm,
                    padding: Spacing.md,
                    borderRadius: Radius.md,
                    borderCurve: 'continuous',
                    backgroundColor: '#FFF7ED',
                    borderWidth: 1,
                    borderColor: '#FED7AA',
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    <MaterialCommunityIcons name="clock-alert-outline" size={18} color="#EA580C" />
                    <Text style={[Typography.bodySm, { color: '#EA580C', flex: 1 }]}>
                      PIN has expired. Please request a new one.
                    </Text>
                  </View>
                  <Pressable
                    onPress={handleResendPin}
                    disabled={loading}
                    style={({ pressed }) => ({
                      alignSelf: 'flex-start',
                      opacity: pressed || loading ? 0.6 : 1,
                    })}
                  >
                    <Text style={[Typography.bodySemibold, { color: '#EA580C', fontSize: 13 }]}>
                      {loading ? 'Sending…' : 'Resend PIN →'}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Resend link (not-expired) */}
              {!pinExpired && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                  <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
                    Didn't receive it?
                  </Text>
                  <Pressable
                    onPress={handleResendPin}
                    disabled={loading}
                    style={({ pressed }) => ({ opacity: pressed || loading ? 0.5 : 1 })}
                  >
                    <Text style={[Typography.bodySemibold, { color: colors.accent, fontSize: 13 }]}>
                      Resend PIN
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* ── Step 3: site picker ────────────────────────────────────── */}
          {step === 'site' && (
            <View style={{ gap: Spacing.md }}>
              <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>
                Select your site
              </Text>
              <View style={{ gap: Spacing.sm }}>
                {availableSites.map((site) => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    onPress={() => handleSiteSelect(site.id)}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── PinBoxes ─────────────────────────────────────────────────────────────────

interface PinBoxesProps {
  value: string;
  onChange: (text: string) => void;
  disabled: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}

const PinBoxes = React.forwardRef<TextInput, PinBoxesProps>(
  ({ value, onChange, disabled, colors }, ref) => {
    return (
      <Pressable
        onPress={() => (ref as React.RefObject<TextInput>)?.current?.focus()}
        style={{ flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' }}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => {
          const isFocused = value.length === i && !disabled;
          const isFilled  = i < value.length;
          return (
            <View
              key={i}
              style={{
                width: 36,
                height: 48,
                borderRadius: Radius.md,
                borderCurve: 'continuous',
                borderWidth: isFocused ? 2 : 1.5,
                borderColor: isFocused
                  ? colors.accent
                  : isFilled
                  ? colors.textSecondary
                  : colors.border,
                backgroundColor: colors.surfaceRaised,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isFilled && (
                <Text
                  style={[Typography.headingMd, { color: colors.textPrimary, fontSize: 20 }]}
                >
                  •
                </Text>
              )}
            </View>
          );
        })}

        {/* Hidden input captures all keystrokes */}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          maxLength={PIN_LENGTH}
          editable={!disabled}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0,
          }}
        />
      </Pressable>
    );
  },
);

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
