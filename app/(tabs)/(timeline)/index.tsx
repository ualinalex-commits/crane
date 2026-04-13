import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { Typography, Spacing, Radius } from '@/lib/theme';
import { BottomSheet } from '@/components/ui';
import { getCraneById, getCompanyById } from '@/lib/mock';
import type { Booking, Crane } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const TIME_LABEL_WIDTH = 52;
const COLUMN_WIDTH = 120;
const HOUR_HEIGHT = 64;   // px per hour
const HEADER_HEIGHT = 52; // crane name headers at top
const START_HOUR = 6;
const END_HOUR = 19;
const TOTAL_HOURS = END_HOUR - START_HOUR;       // 13
const TOTAL_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;  // 832
const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

// ── Helpers ───────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function timeToY(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return ((h + m / 60) - START_HOUR) * HOUR_HEIGHT;
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
  const scrollRef = useRef<ScrollView>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  const dateStr = toDateStr(selectedDate);
  const todayStr = toDateStr(new Date());
  const isToday = dateStr === todayStr;

  const cranes = useMemo(
    () => getCranesForSite(site?.id ?? '', true),
    [site?.id, getCranesForSite]
  );

  const dayBookings = useMemo(
    () => approvedBookings.filter((b) => b.siteId === site?.id && b.date === dateStr),
    [approvedBookings, site?.id, dateStr]
  );

  const bookingsByCrane = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    dayBookings.forEach((b) => {
      if (!map[b.craneId]) map[b.craneId] = [];
      map[b.craneId].push(b);
    });
    return map;
  }, [dayBookings]);

  // Current time Y position
  const now = new Date();
  const nowY = ((now.getHours() + now.getMinutes() / 60) - START_HOUR) * HOUR_HEIGHT;
  const showNow = isToday && nowY >= 0 && nowY <= TOTAL_HEIGHT;

  // Scroll to current time on mount / date change
  useEffect(() => {
    const target = isToday && showNow ? Math.max(0, nowY - 120) : 0;
    setTimeout(() => scrollRef.current?.scrollTo({ y: target, animated: isToday }), 250);
  }, [dateStr]);

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
        /* ── Vertical scroll: time axis + crane columns ── */
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          <View style={{ flexDirection: 'row' }}>

            {/* Left: time labels — outside horizontal scroll so they stay pinned */}
            <View
              style={{
                width: TIME_LABEL_WIDTH,
                borderRightWidth: StyleSheet.hairlineWidth,
                borderRightColor: borderColor,
              }}
            >
              {/* Corner spacer aligns with crane header row */}
              <View style={{ height: HEADER_HEIGHT }} />

              {/* Hour labels, absolutely positioned within the grid height */}
              <View style={{ height: TOTAL_HEIGHT, position: 'relative' }}>
                {HOURS.map((h) => (
                  <Text
                    key={h}
                    style={[
                      Typography.label,
                      {
                        color: colors.textTertiary,
                        fontVariant: ['tabular-nums'],
                        position: 'absolute',
                        top: (h - START_HOUR) * HOUR_HEIGHT - 8,
                        right: Spacing.xs,
                        textAlign: 'right',
                      },
                    ]}
                  >
                    {pad(h)}:00
                  </Text>
                ))}
              </View>
            </View>

            {/* Right: crane headers + columns, horizontally scrollable */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flex: 1 }}
              bounces={false}
            >
              <View style={{ width: cranes.length * COLUMN_WIDTH }}>

                {/* Crane name headers */}
                <View
                  style={{
                    flexDirection: 'row',
                    height: HEADER_HEIGHT,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: borderColor,
                  }}
                >
                  {cranes.map((crane, i) => (
                    <View
                      key={crane.id}
                      style={{
                        width: COLUMN_WIDTH,
                        height: HEADER_HEIGHT,
                        justifyContent: 'center',
                        paddingHorizontal: Spacing.sm,
                        borderLeftWidth: i > 0 ? StyleSheet.hairlineWidth : 0,
                        borderLeftColor: borderColor,
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
                        style={{ fontSize: 10, color: colors.textTertiary, marginTop: 1 }}
                        numberOfLines={1}
                      >
                        {crane.maxCapacityTonnes}t
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Grid body: hour lines + crane columns + now indicator */}
                <View style={{ flexDirection: 'row', height: TOTAL_HEIGHT, position: 'relative' }}>

                  {/* Horizontal hour grid lines */}
                  {HOURS.map((h) => (
                    <View
                      key={h}
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: (h - START_HOUR) * HOUR_HEIGHT,
                        height: StyleSheet.hairlineWidth,
                        backgroundColor: h === START_HOUR ? borderColor : gridColor,
                      }}
                    />
                  ))}

                  {/* Crane columns */}
                  {cranes.map((crane, i) => (
                    <CraneColumn
                      key={crane.id}
                      crane={crane}
                      bookings={bookingsByCrane[crane.id] ?? []}
                      borderColor={borderColor}
                      showLeftBorder={i > 0}
                      onPressBooking={setDetailBooking}
                    />
                  ))}

                  {/* Current time indicator — horizontal red line */}
                  {showNow && (
                    <>
                      <View
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: nowY - 1,
                          height: 2,
                          backgroundColor: colors.danger,
                          zIndex: 10,
                        }}
                      />
                      <View
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: nowY - 5,
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: colors.danger,
                          zIndex: 10,
                        }}
                      />
                    </>
                  )}
                </View>

              </View>
            </ScrollView>

          </View>
        </ScrollView>
      )}

      {/* ── Booking detail sheet ── */}
      <BookingDetailSheet
        booking={detailBooking}
        onClose={() => setDetailBooking(null)}
      />
    </View>
  );
}

// ── Crane column ──────────────────────────────────────────────────────────────

function CraneColumn({
  crane,
  bookings,
  borderColor,
  showLeftBorder,
  onPressBooking,
}: {
  crane: Crane;
  bookings: Booking[];
  borderColor: string;
  showLeftBorder: boolean;
  onPressBooking: (b: Booking) => void;
}) {
  return (
    <View
      style={{
        width: COLUMN_WIDTH,
        height: TOTAL_HEIGHT,
        position: 'relative',
        borderLeftWidth: showLeftBorder ? StyleSheet.hairlineWidth : 0,
        borderLeftColor: borderColor,
      }}
    >
      {bookings.map((b) => {
        const top = Math.max(0, timeToY(b.startTime));
        const bottom = Math.min(TOTAL_HEIGHT, timeToY(b.endTime));
        const height = bottom - top;
        if (height <= 4) return null;
        return (
          <BookingBlock
            key={b.id}
            booking={b}
            top={top}
            height={height}
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
  top,
  height,
  craneColour,
  onPress,
}: {
  booking: Booking;
  top: number;
  height: number;
  craneColour: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const company = getCompanyById(booking.companyId);
  const compact = height < 40;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        position: 'absolute',
        top: top + 1,
        left: 2,
        right: 2,
        height: height - 2,
        borderRadius: Radius.sm,
        borderCurve: 'continuous',
        backgroundColor: `${craneColour}22`,
        borderLeftWidth: 3,
        borderLeftColor: craneColour,
        overflow: 'hidden',
        justifyContent: 'center',
        paddingHorizontal: compact ? 4 : 6,
        paddingTop: compact ? 0 : 4,
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
