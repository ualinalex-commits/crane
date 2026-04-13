import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';
import { useAuth } from '@/lib/context/AuthContext';
import { useManagement } from '@/lib/context/ManagementContext';
import { useCraneLogs } from '@/lib/context/CraneLogsContext';
import { Typography, Spacing, Radius } from '@/lib/theme';
import { Button } from './Button';
import { BottomSheet } from './BottomSheet';
import type { CraneLogStatus } from '@/lib/types';

interface CraneLogSheetProps {
  visible: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS: Array<{ value: CraneLogStatus; label: string; color: string }> = [
  { value: 'working', label: 'Working', color: '#22C55E' },
  { value: 'breaking_down', label: 'Breaking Down', color: '#EF4444' },
  { value: 'service', label: 'Service', color: '#3B82F6' },
  { value: 'thorough_examination', label: 'Thorough Exam', color: '#EAB308' },
  { value: 'wind_off', label: 'Wind Off', color: '#8E8E93' },
];

export function CraneLogSheet({ visible, onClose }: CraneLogSheetProps) {
  const { colors } = useTheme();
  const { user, site } = useAuth();
  const { getCranesForSite, companies } = useManagement();
  const { addLog } = useCraneLogs();

  const cranes = getCranesForSite(site?.id ?? '', true);
  const activeCompanies = companies.filter((c) => c.active);

  const [selectedCraneId, setSelectedCraneId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<CraneLogStatus | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState('');
  const [keepLogOpen, setKeepLogOpen] = useState(true);
  const [endTime, setEndTime] = useState(new Date());
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  function resetForm() {
    setSelectedCraneId(null);
    setSelectedStatus(null);
    setSelectedCompanyId(null);
    setJobDetails('');
    setKeepLogOpen(true);
    setEndTime(new Date());
    setShowEndTimePicker(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSubmit() {
    if (!selectedCraneId) {
      Alert.alert('Select Crane', 'Please select a crane before starting the log.');
      return;
    }
    if (!selectedStatus) {
      Alert.alert('Select Status', 'Please select a status before starting the log.');
      return;
    }
    if (selectedStatus === 'working' && !selectedCompanyId) {
      Alert.alert('Select Subcontractor', 'A subcontractor must be selected when status is Working.');
      return;
    }

    addLog({
      siteId: site?.id ?? '',
      craneId: selectedCraneId,
      companyId: selectedStatus === 'working' ? (selectedCompanyId ?? undefined) : undefined,
      status: selectedStatus,
      jobDetails,
      startTime: new Date().toISOString(),
      endTime: keepLogOpen ? undefined : endTime.toISOString(),
      isOpen: keepLogOpen,
      createdById: user?.id ?? '',
    });

    handleClose();
  }

  function handleEndTimeChange(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS !== 'ios') setShowEndTimePicker(false);
    if (date) setEndTime(date);
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      {/* Title row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.md,
          paddingBottom: Spacing.lg,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={[Typography.headingMd, { color: colors.textPrimary }]}>New Crane Log</Text>
        <TouchableOpacity onPress={handleClose} hitSlop={12}>
          <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={{ padding: Spacing.lg, gap: Spacing.xxl }}>

        {/* ── Crane ── */}
        <View>
          <Text style={[Typography.bodyMd, { color: colors.textSecondary, fontWeight: '600', marginBottom: Spacing.sm }]}>
            Crane
          </Text>
          {cranes.length === 0 ? (
            <Text style={[Typography.bodyMd, { color: colors.textTertiary }]}>
              No active cranes on this site.
            </Text>
          ) : (
            cranes.map((crane, i) => (
              <TouchableOpacity
                key={crane.id}
                onPress={() => setSelectedCraneId(crane.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.md,
                  paddingVertical: Spacing.md,
                  borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                  borderTopColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selectedCraneId === crane.id ? colors.accent : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedCraneId === crane.id && (
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />
                  )}
                </View>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: crane.colour }} />
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodyLg, { color: colors.textPrimary }]}>{crane.name}</Text>
                  <Text style={[Typography.bodySm, { color: colors.textTertiary }]}>{crane.model}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ── Status ── */}
        <View>
          <Text style={[Typography.bodyMd, { color: colors.textSecondary, fontWeight: '600', marginBottom: Spacing.sm }]}>
            Status
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = selectedStatus === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    setSelectedStatus(opt.value);
                    if (opt.value !== 'working') setSelectedCompanyId(null);
                  }}
                  style={{
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.sm,
                    borderRadius: Radius.full,
                    backgroundColor: isSelected ? opt.color : colors.surface,
                    borderWidth: 1.5,
                    borderColor: isSelected ? opt.color : colors.border,
                  }}
                >
                  <Text
                    style={[
                      Typography.bodyMd,
                      {
                        color: isSelected ? '#FFFFFF' : colors.textPrimary,
                        fontWeight: isSelected ? '600' : '400',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Subcontractors (only when status = 'working') ── */}
        {selectedStatus === 'working' && (
          <View>
            <Text style={[Typography.bodyMd, { color: colors.textSecondary, fontWeight: '600', marginBottom: Spacing.sm }]}>
              Subcontractor
            </Text>
            {activeCompanies.map((co, i) => (
              <TouchableOpacity
                key={co.id}
                onPress={() => setSelectedCompanyId(co.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.md,
                  paddingVertical: Spacing.md,
                  borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                  borderTopColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selectedCompanyId === co.id ? colors.accent : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedCompanyId === co.id && (
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodyLg, { color: colors.textPrimary }]}>{co.name}</Text>
                  <Text style={[Typography.bodySm, { color: colors.textTertiary }]}>{co.contactName}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Job Details ── */}
        <View>
          <Text style={[Typography.bodyMd, { color: colors.textSecondary, fontWeight: '600', marginBottom: Spacing.sm }]}>
            Job Details
          </Text>
          <TextInput
            value={jobDetails}
            onChangeText={setJobDetails}
            placeholder="Describe the work being carried out..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: colors.surface,
              borderRadius: Radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              padding: Spacing.md,
              ...Typography.bodyLg,
              color: colors.textPrimary,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* ── Photo ── */}
        <View>
          <Text style={[Typography.bodyMd, { color: colors.textSecondary, fontWeight: '600', marginBottom: Spacing.sm }]}>
            Photo
          </Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Coming Soon', 'Photo capture will be available in a future update.')
            }
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              backgroundColor: colors.surface,
              borderRadius: Radius.md,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.border,
              padding: Spacing.lg,
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="camera-plus-outline" size={22} color={colors.textTertiary} />
            <Text style={[Typography.bodyMd, { color: colors.textTertiary }]}>Add Photo (optional)</Text>
          </TouchableOpacity>
        </View>

        {/* ── Keep Log Open ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.lg }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[Typography.bodyLg, { color: colors.textPrimary }]}>Keep Log Open</Text>
            <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
              Log stays open until manually closed with end time
            </Text>
          </View>
          <Switch
            value={keepLogOpen}
            onValueChange={(v) => {
              setKeepLogOpen(v);
              if (v) setShowEndTimePicker(false);
            }}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* ── End Time (only when keepLogOpen = false) ── */}
        {!keepLogOpen && (
          <View>
            <Text style={[Typography.bodyMd, { color: colors.textSecondary, fontWeight: '600', marginBottom: Spacing.sm }]}>
              End Time
            </Text>
            <TouchableOpacity
              onPress={() => setShowEndTimePicker(true)}
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
                {formatTime(endTime)}
              </Text>
              <MaterialCommunityIcons name="clock-edit-outline" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
            {showEndTimePicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndTimeChange}
              />
            )}
            {Platform.OS === 'ios' && showEndTimePicker && (
              <TouchableOpacity
                onPress={() => setShowEndTimePicker(false)}
                style={{ alignSelf: 'flex-end', marginTop: Spacing.sm }}
              >
                <Text style={[Typography.bodySemibold, { color: colors.accent }]}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Submit ── */}
        <Button label="Start Log" variant="primary" onPress={handleSubmit} fullWidth />

        <View style={{ height: Spacing.sm }} />
      </View>
    </BottomSheet>
  );
}
