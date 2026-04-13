import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Platform,
  StyleSheet,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/hooks/useTheme';
import { useAuth } from '@/lib/context/AuthContext';
import { useCraneLogs } from '@/lib/context/CraneLogsContext';
import { Typography, Spacing, Radius } from '@/lib/theme';
import { CraneLogCard, CraneLogSheet, EmptyState } from '@/components/ui';
import type { CraneLog } from '@/lib/types';

export default function CraneLogsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { site, user } = useAuth();
  const { getLogsForSite, closeLog } = useCraneLogs();
  const isSlinger = user?.role === 'Slinger_Signaller';

  const [sheetVisible, setSheetVisible] = useState(false);
  const [closingLog, setClosingLog] = useState<CraneLog | null>(null);
  const [closeEndTime, setCloseEndTime] = useState(new Date());
  const [showClosePicker, setShowClosePicker] = useState(false);

  const siteLogs = useMemo(
    () => getLogsForSite(site?.id ?? ''),
    [site?.id, getLogsForSite]
  );

  function handleConfirmClose() {
    if (!closingLog) return;
    closeLog(closingLog.id, closeEndTime.toISOString());
    setClosingLog(null);
    setShowClosePicker(false);
  }

  function handleCloseTimeChange(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS !== 'ios') setShowClosePicker(false);
    if (date) setCloseEndTime(date);
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.md,
          backgroundColor: colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={[Typography.headingLg, { color: colors.textPrimary }]}>Crane Logs</Text>
        {site && (
          <Text style={[Typography.bodyMd, { color: colors.textSecondary, marginTop: 2 }]}>
            {site.name}
          </Text>
        )}
      </View>

      {/* Log list */}
      <FlatList
        data={siteLogs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: Spacing.lg,
          gap: Spacing.md,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-list-outline"
            title="No logs yet"
            description="Start a crane log to record activity on site."
          />
        }
        renderItem={({ item }) => (
          <CraneLogCard
            log={item}
            onCloseLog={
              item.isOpen && !isSlinger
                ? () => {
                    setClosingLog(item);
                    setCloseEndTime(new Date());
                    setShowClosePicker(false);
                  }
                : undefined
            }
          />
        )}
      />

      {/* FAB — hidden for Slinger_Signaller */}
      {!isSlinger && (
        <TouchableOpacity
          onPress={() => setSheetVisible(true)}
          style={{
            position: 'absolute',
            bottom: insets.bottom + Spacing.lg,
            right: Spacing.lg,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 4,
            boxShadow: '0 4px 12px rgba(249,115,22,0.4)',
          }}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Create log sheet */}
      <CraneLogSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />

      {/* Close log modal */}
      <Modal
        visible={closingLog !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setClosingLog(null)}
        statusBarTranslucent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: Spacing.lg,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surfaceRaised,
              borderRadius: Radius.xl,
              padding: Spacing.xxl,
              width: '100%',
              gap: Spacing.lg,
            }}
          >
            <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>Close Log</Text>
            <Text style={[Typography.bodyMd, { color: colors.textSecondary }]}>
              Set the end time to close this log entry.
            </Text>

            {/* End time picker trigger */}
            <TouchableOpacity
              onPress={() => setShowClosePicker(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.surface,
                borderRadius: Radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                padding: Spacing.md,
                paddingHorizontal: Spacing.lg,
              }}
            >
              <Text style={[Typography.bodyLg, { color: colors.textPrimary }]}>
                {formatTime(closeEndTime)}
              </Text>
              <MaterialCommunityIcons name="clock-edit-outline" size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            {showClosePicker && (
              <DateTimePicker
                value={closeEndTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleCloseTimeChange}
              />
            )}
            {Platform.OS === 'ios' && showClosePicker && (
              <TouchableOpacity
                onPress={() => setShowClosePicker(false)}
                style={{ alignSelf: 'flex-end' }}
              >
                <Text style={[Typography.bodySemibold, { color: colors.accent }]}>Done</Text>
              </TouchableOpacity>
            )}

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <TouchableOpacity
                onPress={() => setClosingLog(null)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: Radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={[Typography.bodySemibold, { color: colors.textSecondary, fontSize: 15 }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmClose}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: Radius.md,
                  backgroundColor: colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={[Typography.bodySemibold, { color: '#FFFFFF', fontSize: 15 }]}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
