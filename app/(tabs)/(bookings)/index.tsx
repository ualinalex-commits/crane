import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Calendar, CalendarProvider, WeekCalendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';
import { useBookings } from '@/lib/context/BookingsContext';
import { useManagement } from '@/lib/context/ManagementContext';
import { useAuth } from '@/lib/context/AuthContext';
import { Typography, Spacing, Radius } from '@/lib/theme';
import { Chip, EmptyState, BookingCard, BottomSheet } from '@/components/ui';
import { getCraneById, getCompanyById } from '@/lib/mock';
import type { Booking } from '@/lib/types';

type ViewMode = 'month' | 'week';

const TODAY = new Date().toISOString().split('T')[0];

function formatDisplayDate(dateStr: string): string {
  if (dateStr === TODAY) return 'Today';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  if (dateStr === yStr) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function ApprovedBookingsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { site } = useAuth();
  const { approvedBookings } = useBookings();
  const { getCranesForSite } = useManagement();

  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filterCraneId, setFilterCraneId] = useState<string | null>(null);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  const cranes = useMemo(
    () => getCranesForSite(site?.id ?? '', true),
    [site?.id, getCranesForSite]
  );

  const siteBookings = useMemo(
    () => approvedBookings.filter((b) => b.siteId === site?.id),
    [approvedBookings, site?.id]
  );

  // Multi-dot markers: one dot per unique crane per day
  const markedDates = useMemo(() => {
    const result: Record<string, { dots: { key: string; color: string }[]; selected?: boolean; selectedColor?: string }> = {};

    siteBookings.forEach((b) => {
      const crane = cranes.find((c) => c.id === b.craneId);
      if (!result[b.date]) result[b.date] = { dots: [] };
      if (crane && !result[b.date].dots.find((d) => d.key === crane.id)) {
        result[b.date].dots.push({ key: crane.id, color: crane.colour });
      }
    });

    // Selected day marker
    if (!result[selectedDate]) result[selectedDate] = { dots: [] };
    result[selectedDate] = {
      ...result[selectedDate],
      selected: true,
      selectedColor: colors.accent,
    };

    return result;
  }, [siteBookings, cranes, selectedDate, colors.accent]);

  const dayBookings = useMemo(
    () =>
      siteBookings.filter(
        (b) => b.date === selectedDate && (!filterCraneId || b.craneId === filterCraneId)
      ),
    [siteBookings, selectedDate, filterCraneId]
  );

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: colors.background,
      calendarBackground: colors.background,
      textSectionTitleColor: colors.textSecondary,
      selectedDayBackgroundColor: colors.accent,
      selectedDayTextColor: '#FFFFFF',
      todayTextColor: colors.accent,
      dayTextColor: colors.textPrimary,
      textDisabledColor: colors.textTertiary,
      dotColor: colors.accent,
      arrowColor: colors.accent,
      monthTextColor: colors.textPrimary,
      indicatorColor: colors.accent,
      textDayFontSize: 14,
      textMonthFontSize: 16,
      textDayHeaderFontSize: 12,
      textDayFontWeight: '400' as const,
      textMonthFontWeight: '700' as const,
      textDayHeaderFontWeight: '600' as const,
      'stylesheet.calendar.header': {
        week: {
          marginTop: 0,
          flexDirection: 'row',
          justifyContent: 'space-around',
        },
      },
    }),
    [colors]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header ── */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.md,
          backgroundColor: colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          gap: Spacing.md,
        }}
      >
        {/* Title + toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[Typography.headingLg, { color: colors.textPrimary }]}>Bookings</Text>

          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.surface,
              borderRadius: Radius.full,
              padding: 2,
            }}
          >
            {(['month', 'week'] as ViewMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setViewMode(mode)}
                style={{
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.xs,
                  borderRadius: Radius.full,
                  backgroundColor: viewMode === mode ? colors.accent : 'transparent',
                }}
              >
                <Text
                  style={[
                    Typography.label,
                    {
                      color: viewMode === mode ? '#FFFFFF' : colors.textSecondary,
                      textTransform: 'capitalize',
                    },
                  ]}
                >
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Crane filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Chip
              label="All Cranes"
              selected={filterCraneId === null}
              onPress={() => setFilterCraneId(null)}
            />
            {cranes.map((crane) => (
              <Chip
                key={crane.id}
                label={crane.name}
                selected={filterCraneId === crane.id}
                onPress={() => setFilterCraneId(filterCraneId === crane.id ? null : crane.id)}
                colour={crane.colour}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* ── Calendar ── */}
      {viewMode === 'month' ? (
        <Calendar
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          markingType="multi-dot"
          theme={calendarTheme}
          style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}
        />
      ) : (
        <CalendarProvider date={selectedDate} onDateChanged={(date) => setSelectedDate(date)}>
          <WeekCalendar
            markedDates={markedDates}
            markingType="multi-dot"
            theme={calendarTheme}
            style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}
          />
        </CalendarProvider>
      )}

      {/* ── Day bookings ── */}
      <View
        style={{
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={[Typography.bodySemibold, { color: colors.textPrimary }]}>
          {formatDisplayDate(selectedDate)}
          {'  '}
          {dayBookings.length > 0 && (
            <Text style={[Typography.bodyMd, { color: colors.textSecondary }]}>
              {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}
            </Text>
          )}
        </Text>
      </View>

      <FlatList
        data={dayBookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-blank-outline"
            title="No bookings"
            description="No approved bookings on this date."
          />
        }
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            showStatus={false}
            onPress={() => setDetailBooking(item)}
          />
        )}
      />

      {/* ── Booking detail sheet ── */}
      <BookingDetailSheet booking={detailBooking} onClose={() => setDetailBooking(null)} />
    </View>
  );
}

// ── Inline detail sheet ────────────────────────────────────────────────────────

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
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />

          {/* Details */}
          <DetailRow icon="office-building-outline" label="Subcontractor" value={company?.name ?? '—'} colors={colors} />
          <DetailRow icon="calendar-outline" label="Date" value={formatDetailDate(booking.date)} colors={colors} />
          <DetailRow
            icon="clock-outline"
            label="Time"
            value={`${booking.startTime} – ${booking.endTime}`}
            colors={colors}
          />

          {booking.jobDetails && (
            <View style={{ gap: Spacing.xs }}>
              <Text style={[Typography.bodyMd, { color: colors.textTertiary, fontWeight: '600' }]}>
                Job Details
              </Text>
              <Text style={[Typography.bodyMd, { color: colors.textPrimary, lineHeight: 22 }]}>
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

function DetailRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
      <MaterialCommunityIcons name={icon as any} size={18} color={colors.textTertiary} />
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[Typography.bodyMd, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[Typography.bodyMd, { color: colors.textPrimary, fontWeight: '500' }]}>{value}</Text>
      </View>
    </View>
  );
}

function formatDetailDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
