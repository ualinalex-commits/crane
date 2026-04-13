import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';
import { useAuth } from '@/lib/context/AuthContext';
import { useBookings } from '@/lib/context/BookingsContext';
import { useManagement } from '@/lib/context/ManagementContext';
import { Typography, Spacing, Radius } from '@/lib/theme';
import type { Crane } from '@/lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatTimeFromDate(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDisplayDate(d: Date) {
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const tomorrow = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
})();

// ── Screen ────────────────────────────────────────────────────────────────────

export default function NewBookingScreen() {
  const { colors } = useTheme();
  const { user, site } = useAuth();
  const { addBooking } = useBookings();
  const { getCranesForSite, companies } = useManagement();

  const cranes = useMemo(
    () => getCranesForSite(site?.id ?? '', true),
    [site?.id, getCranesForSite]
  );
  const activeCompanies = useMemo(
    () => companies.filter((c) => c.active),
    [companies]
  );

  const isAP = user?.role === 'Appointed_Person';

  const [selectedCrane, setSelectedCrane] = useState<Crane | null>(null);
  const [date, setDate] = useState(tomorrow);
  const [startTime, setStartTime] = useState(() => {
    const d = new Date(tomorrow);
    d.setHours(7, 0, 0, 0);
    return d;
  });
  const [endTime, setEndTime] = useState(() => {
    const d = new Date(tomorrow);
    d.setHours(10, 0, 0, 0);
    return d;
  });
  const [jobDetails, setJobDetails] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    user?.companyId ?? ''
  );

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const companyId = isAP ? selectedCompanyId : (user?.companyId ?? '');
  const canSubmit =
    selectedCrane !== null &&
    jobDetails.trim().length > 0 &&
    companyId.length > 0;

  function handleDateChange(_event: DateTimePickerEvent, d?: Date) {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
    if (d) setDate(d);
  }

  function handleStartChange(_event: DateTimePickerEvent, d?: Date) {
    if (Platform.OS !== 'ios') setShowStartPicker(false);
    if (d) setStartTime(d);
  }

  function handleEndChange(_event: DateTimePickerEvent, d?: Date) {
    if (Platform.OS !== 'ios') setShowEndPicker(false);
    if (d) setEndTime(d);
  }

  function handleSubmit() {
    if (!canSubmit || !user || !site) return;
    addBooking({
      siteId: site.id,
      craneId: selectedCrane!.id,
      companyId,
      requestedById: user.id,
      jobDetails: jobDetails.trim(),
      date: formatDateStr(date),
      startTime: formatTimeFromDate(startTime),
      endTime: formatTimeFromDate(endTime),
    });
    router.back();
  }

  const pickerDisplay = Platform.OS === 'ios' ? 'spinner' : 'default';

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Crane ── */}
      <Section label="Crane">
        {cranes.length === 0 ? (
          <Text style={[Typography.bodyMd, { color: colors.textTertiary }]}>
            No active cranes on this site.
          </Text>
        ) : (
          cranes.map((crane) => {
            const isSelected = selectedCrane?.id === crane.id;
            return (
              <Pressable
                key={crane.id}
                onPress={() => setSelectedCrane(crane)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.md,
                  padding: Spacing.md,
                  borderRadius: Radius.lg,
                  borderCurve: 'continuous',
                  borderWidth: 1.5,
                  borderColor: isSelected ? crane.colour : colors.border,
                  backgroundColor: isSelected ? `${crane.colour}18` : colors.surface,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <View
                  style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: crane.colour }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodySemibold, { color: colors.textPrimary }]}>
                    {crane.name}
                  </Text>
                  <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
                    {crane.model} · {crane.maxCapacityTonnes}t
                  </Text>
                </View>
                {isSelected && (
                  <MaterialCommunityIcons name="check-circle" size={20} color={crane.colour} />
                )}
              </Pressable>
            );
          })
        )}
      </Section>

      {/* ── Date ── */}
      <Section label="Date">
        <PickerRow
          icon="calendar-outline"
          value={formatDisplayDate(date)}
          onPress={() => {
            setShowStartPicker(false);
            setShowEndPicker(false);
            setShowDatePicker((v) => !v);
          }}
          colors={colors}
        />
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={pickerDisplay}
            minimumDate={new Date()}
            onChange={handleDateChange}
          />
        )}
        {Platform.OS === 'ios' && showDatePicker && (
          <DoneButton onPress={() => setShowDatePicker(false)} color={colors.accent} />
        )}
      </Section>

      {/* ── Time ── */}
      <Section label="Time">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <View style={{ flex: 1 }}>
            <PickerRow
              icon="clock-start"
              value={formatTimeFromDate(startTime)}
              onPress={() => {
                setShowDatePicker(false);
                setShowEndPicker(false);
                setShowStartPicker((v) => !v);
              }}
              colors={colors}
              monospace
            />
          </View>
          <MaterialCommunityIcons name="arrow-right" size={16} color={colors.textTertiary} />
          <View style={{ flex: 1 }}>
            <PickerRow
              icon="clock-end"
              value={formatTimeFromDate(endTime)}
              onPress={() => {
                setShowDatePicker(false);
                setShowStartPicker(false);
                setShowEndPicker((v) => !v);
              }}
              colors={colors}
              monospace
            />
          </View>
        </View>
        {showStartPicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            display={pickerDisplay}
            is24Hour
            minuteInterval={15}
            onChange={handleStartChange}
          />
        )}
        {Platform.OS === 'ios' && showStartPicker && (
          <DoneButton onPress={() => setShowStartPicker(false)} color={colors.accent} />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={endTime}
            mode="time"
            display={pickerDisplay}
            is24Hour
            minuteInterval={15}
            onChange={handleEndChange}
          />
        )}
        {Platform.OS === 'ios' && showEndPicker && (
          <DoneButton onPress={() => setShowEndPicker(false)} color={colors.accent} />
        )}
      </Section>

      {/* ── Company (AP only) ── */}
      {isAP && (
        <Section label="Subcontractor">
          {activeCompanies.map((company) => {
            const isSelected = selectedCompanyId === company.id;
            return (
              <Pressable
                key={company.id}
                onPress={() => setSelectedCompanyId(company.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.md,
                  padding: Spacing.md,
                  borderRadius: Radius.lg,
                  borderCurve: 'continuous',
                  borderWidth: 1.5,
                  borderColor: isSelected ? colors.accent : colors.border,
                  backgroundColor: isSelected ? colors.accentSubtle : colors.surface,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <MaterialCommunityIcons
                  name="office-building-outline"
                  size={18}
                  color={isSelected ? colors.accent : colors.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodySemibold, { color: colors.textPrimary }]}>
                    {company.name}
                  </Text>
                  <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
                    {company.contactName}
                  </Text>
                </View>
                {isSelected && (
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.accent} />
                )}
              </Pressable>
            );
          })}
        </Section>
      )}

      {/* ── Job Details ── */}
      <Section label="Job Details">
        <TextInput
          value={jobDetails}
          onChangeText={setJobDetails}
          placeholder="Describe the lift — what's being moved, quantities, any notes for the crane operator…"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={5}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: Radius.md,
            padding: Spacing.md,
            color: colors.textPrimary,
            minHeight: 120,
            textAlignVertical: 'top',
            fontSize: 14,
            lineHeight: 22,
            backgroundColor: colors.surface,
          }}
        />
      </Section>

      {/* ── Submit ── */}
      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        style={({ pressed }) => ({
          height: 52,
          borderRadius: Radius.lg,
          borderCurve: 'continuous',
          backgroundColor: canSubmit ? colors.accent : colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text
          style={[
            Typography.bodySemibold,
            { color: canSubmit ? '#FFF' : colors.textTertiary, fontSize: 16 },
          ]}
        >
          Submit Request
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={[Typography.bodySemibold, { color: colors.textPrimary }]}>{label}</Text>
      {children}
    </View>
  );
}

function PickerRow({
  icon,
  value,
  onPress,
  colors,
  monospace,
}: {
  icon: string;
  value: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  monospace?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radius.md,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <MaterialCommunityIcons name={icon as any} size={18} color={colors.textSecondary} />
      <Text
        style={[
          Typography.bodyMd,
          { color: colors.textPrimary, fontVariant: monospace ? ['tabular-nums'] : undefined },
        ]}
      >
        {value}
      </Text>
    </Pressable>
  );
}

function DoneButton({ onPress, color }: { onPress: () => void; color: string }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ alignSelf: 'flex-end', paddingVertical: 4 }}>
      <Text style={[Typography.bodySemibold, { color }]}>Done</Text>
    </TouchableOpacity>
  );
}
