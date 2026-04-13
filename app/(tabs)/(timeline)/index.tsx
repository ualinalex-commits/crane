import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';
import { useAuth } from '@/lib/context/AuthContext';
import { useBookings } from '@/lib/context/BookingsContext';
import { useManagement } from '@/lib/context/ManagementContext';
import { Typography, Spacing, Radius, Shadow } from '@/lib/theme';
import { BottomSheet } from '@/components/ui';
import { getCraneById, getCompanyById } from '@/lib/mock';
import type { Booking, Crane } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const LABEL_WIDTH = 108;
const HOUR_WIDTH = 76;    // px per hour
const START_HOUR = 6;     // 06:00
const END_HOUR = 19;      // 19:00
const LANE_HEIGHT = 68;
const RULER_HEIGHT = 34;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const TOTAL_WIDTH = TOTAL_HOURS * HOUR_WIDTH;
const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

// ── Helpers ───────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function timeToX(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return ((h + m / 60) - START_HOUR) * HOUR_WIDTH;
}

function offsetDate(base: Date, delta: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatHeaderDate(d: Date): string {
  const today = toDateStr(new Date());
  const ds = toDateStr(d);
  if (ds === today) {
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) + '  —  Today';
  }
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function TimelineScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { site } = useAuth();
  const { approvedBookings } = useBookings();
  const { getCranesForSite } = useManagement();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  const dateStr = toDateStr(selectedDate);
  const todayStr = toDateStr(new Date());
  const isToday = dateStr === todayStr;

  const cranes = useMemo(
    () => getCranesForSite(site?.id ?? '', true),
    [site?.id, getCranesForSite]
  );

  // Bookings for the selected date at this site (approved only)
  const dayBookings = useMemo(
    () =>
      approvedBookings.filter(
        (b) => b.siteId === site?.id && b.date === dateStr
      ),
    [approvedBookings, site?.id, dateStr]
  );

  // Group bookings by craneId
  const bookingsByCrane = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    dayBookings.forEach((b) => {
      if (!map[b.craneId]) map[b.craneId] = [];
      map[b.craneId].push(b);
    });
    return map;
  }, [dayBookings]);

  // Current time X position (only relevant when isToday)
  const now = new Date();
  const nowX = ((now.getHours() + now.getMinutes() / 60) - START_HOUR) * HOUR_WIDTH;
  const showNow = isToday && nowX >= 0 && nowX <= TOTAL_WIDTH;

  const borderColor = colors.border;
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Custom header ── */}
      <View
        style={{
          paddingTop: insets.top + Spacing.sm,
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.md,
          backgroundColor: colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: borderColor,
          gap: Spacing.sm,
        }}
      >
        <Text style={[Typography.headingLg, { color: colors.textPrimary }]}>Timeline</Text>

        {/* Date navigation */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => setSelectedDate((d) => offsetDate(d, -1))}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => setSelectedDate(new Date())}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={[Typography.bodySemibold, { color: colors.textPrimary }]}>
              {formatHeaderDate(selectedDate)}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedDate((d) => offsetDate(d, 1))}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <MaterialCommunityIcons name="chevron-right" size={26} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* ── Empty state ── */}
      {cranes.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
          <MaterialCommunityIcons name="crane" size={48} color={colors.textTertiary} />
          <Text style={[Typography.headingMd, { color: colors.textTertiary, marginTop: Spacing.md }]}>
            No cranes on this site
          </Text>
        </View>
      ) : (
        /* ── Timeline grid ── */
        <View style={{ flex: 1, flexDirection: 'row' }}>

          {/* Left: fixed crane labels */}
          <View
            style={{
              width: LABEL_WIDTH,
              borderRightWidth: StyleSheet.hairlineWidth,
              borderRightColor: borderColor,
            }}
          >
            {/* Ruler spacer */}
            <View
              style={{
                height: RULER_HEIGHT,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: borderColor,
              }}
            />
            {/* Crane label rows */}
            {cranes.map((crane, i) => (
              <View
                key={crane.id}
                style={{
                  height: LANE_HEIGHT,
                  justifyContent: 'center',
                  paddingHorizontal: Spacing.sm,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: borderColor,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View
                    style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: crane.colour }}
                  />
                  <Text
                    style={[Typography.bodySm, { color: colors.textPrimary, fontWeight: '600', flex: 1 }]}
                    numberOfLines={1}
                  >
                    {crane.name}
                  </Text>
                </View>
                <Text
                  style={[{ fontSize: 10, color: colors.textTertiary, marginTop: 2 }]}
                  numberOfLines={1}
                >
                  {crane.maxCapacityTonnes}t
                </Text>
              </View>
            ))}
          </View>

          {/* Right: horizontal scrollable grid */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ width: TOTAL_WIDTH }}
          >
            <View style={{ width: TOTAL_WIDTH }}>

              {/* Time ruler */}
              <View
                style={{
                  height: RULER_HEIGHT,
                  flexDirection: 'row',
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: borderColor,
                }}
              >
                {HOURS.map((h) => (
                  <View
                    key={h}
                    style={{
                      width: HOUR_WIDTH,
                      justifyContent: 'center',
                      paddingLeft: 6,
                      borderLeftWidth: h > START_HOUR ? StyleSheet.hairlineWidth : 0,
                      borderLeftColor: borderColor,
                    }}
                  >
                    <Text
                      style={[
                        Typography.label,
                        { color: colors.textTertiary, fontVariant: ['tabular-nums'] },
                      ]}
                    >
                      {pad(h)}:00
                    </Text>
                  </View>
                ))}
              </View>

              {/* Lane rows + now indicator */}
              <View style={{ position: 'relative' }}>
                {cranes.map((crane) => (
                  <LaneRow
                    key={crane.id}
                    crane={crane}
                    bookings={bookingsByCrane[crane.id] ?? []}
                    gridColor={gridColor}
                    borderColor={borderColor}
                    onPressBooking={setDetailBooking}
                  />
                ))}

                {/* Current time indicator */}
                {showNow && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: nowX - 1,
                      width: 2,
                      backgroundColor: colors.danger,
                    }}
                  />
                )}
                {showNow && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: -4,
                      left: nowX - 5,
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: colors.danger,
                    }}
                  />
                )}
              </View>

            </View>
          </ScrollView>
        </View>
      )}

      {/* ── Booking detail sheet ── */}
      <BookingDetailSheet
        booking={detailBooking}
        onClose={() => setDetailBooking(null)}
      />
    </View>
  );
}

// ── Lane row ──────────────────────────────────────────────────────────────────

function LaneRow({
  crane,
  bookings,
  gridColor,
  borderColor,
  onPressBooking,
}: {
  crane: Crane;
  bookings: Booking[];
  gridColor: string;
  borderColor: string;
  onPressBooking: (b: Booking) => void;
}) {
  return (
    <View
      style={{
        height: LANE_HEIGHT,
        width: TOTAL_WIDTH,
        position: 'relative',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: borderColor,
      }}
    >
      {/* Hour grid lines */}
      {HOURS.slice(1).map((h) => (
        <View
          key={h}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: (h - START_HOUR) * HOUR_WIDTH,
            width: StyleSheet.hairlineWidth,
            backgroundColor: gridColor,
          }}
        />
      ))}

      {/* Booking blocks */}
      {bookings.map((b) => {
        const left = Math.max(0, timeToX(b.startTime));
        const right = Math.min(TOTAL_WIDTH, timeToX(b.endTime));
        const width = right - left;
        if (width <= 4) return null;
        return (
          <BookingBlock
            key={b.id}
            booking={b}
            left={left}
            width={width}
            craneColour={crane.colour}
            onPress={() => onPressBooking(b)}
          />
        );
      })}
    </View>
  );
}

// ── Booking block ─────────────────────────────────────────────────────────────

function BookingBlock({
  booking,
  left,
  width,
  craneColour,
  onPress,
}: {
  booking: Booking;
  left: number;
  width: number;
  craneColour: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const company = getCompanyById(booking.companyId);
  const compact = width < 80;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        position: 'absolute',
        top: 5,
        bottom: 5,
        left: left + 1,
        width: width - 2,
        borderRadius: Radius.sm,
        borderCurve: 'continuous',
        backgroundColor: `${craneColour}22`,
        borderLeftWidth: 3,
        borderLeftColor: craneColour,
        overflow: 'hidden',
        justifyContent: 'center',
        paddingHorizontal: compact ? 4 : 6,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {!compact && (
        <Text
          style={[Typography.label, { color: craneColour, marginBottom: 1 }]}
          numberOfLines={1}
        >
          {company?.name ?? '—'}
        </Text>
      )}
      <Text
        style={[
          Typography.label,
          { color: colors.textSecondary, fontVariant: ['tabular-nums'] },
        ]}
        numberOfLines={1}
      >
        {booking.startTime}–{booking.endTime}
      </Text>
    </Pressable>
  );
}

// ── Booking detail sheet ──────────────────────────────────────────────────────

function BookingDetailSheet({
  booking,
  onClose,
}: {
  booking: Booking | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const crane = booking ? getCraneById(booking.craneId) : null;
  const company = booking ? getCompanyById(booking.companyId) : null;

  return (
    <BottomSheet visible={booking !== null} onClose={onClose}>
      {booking && (
        <View style={{ padding: Spacing.lg, gap: Spacing.lg }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                {crane && (
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: crane.colour }} />
                )}
                <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>
                  {crane?.name ?? 'Unknown Crane'}
                </Text>
              </View>
              {crane && (
                <Text style={[Typography.bodySm, { color: colors.textTertiary }]}>{crane.model}</Text>
              )}
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />

          <DetailRow icon="office-building-outline" label="Subcontractor" value={company?.name ?? '—'} />
          <DetailRow icon="clock-outline" label="Time" value={`${booking.startTime} – ${booking.endTime}`} />
          <DetailRow
            icon="weight"
            label="Crane capacity"
            value={crane ? `${crane.maxCapacityTonnes}t max` : '—'}
          />

          {booking.jobDetails && (
            <View style={{ gap: Spacing.xs }}>
              <Text style={[Typography.label, { color: colors.textTertiary }]}>JOB DETAILS</Text>
              <Text style={[Typography.bodyMd, { color: colors.textPrimary, lineHeight: 22 }]} selectable>
                {booking.jobDetails}
              </Text>
            </View>
          )}

          <View style={{ height: Spacing.sm }} />
        </View>
      )}
    </BottomSheet>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
      <MaterialCommunityIcons name={icon as any} size={18} color={colors.textTertiary} />
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[Typography.bodyMd, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[Typography.bodyMd, { color: colors.textPrimary, fontWeight: '500' }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}
