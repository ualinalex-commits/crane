export const Colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    surfaceRaised: '#FFFFFF',
    surfaceHighlight: '#FFF7ED',
    border: '#E5E5EA',
    borderStrong: '#C7C7CC',
    textPrimary: '#1C1C1E',
    textSecondary: '#6E6E73',
    textTertiary: '#AEAEB2',
    textInverse: '#FFFFFF',
    accent: '#F97316',
    accentPressed: '#EA6B0E',
    accentSubtle: '#FFF7ED',
    success: '#22C55E',
    successSubtle: '#DCFCE7',
    successText: '#166534',
    warning: '#EAB308',
    warningSubtle: '#FEF9C3',
    warningText: '#713F12',
    danger: '#EF4444',
    dangerSubtle: '#FEE2E2',
    dangerText: '#991B1B',
    info: '#3B82F6',
    infoSubtle: '#EFF6FF',
    infoText: '#1E40AF',
    // Status
    pendingBg: '#FEF3C7',
    pendingText: '#92400E',
    approvedBg: '#DCFCE7',
    approvedText: '#166534',
    rejectedBg: '#FEE2E2',
    rejectedText: '#991B1B',
    // Tab bar
    tabActive: '#F97316',
    tabInactive: '#8E8E93',
    tabBar: '#FFFFFF',
  },
  dark: {
    background: '#000000',
    surface: '#1C1C1E',
    surfaceRaised: '#2C2C2E',
    surfaceHighlight: '#3A2500',
    border: '#3A3A3C',
    borderStrong: '#545456',
    textPrimary: '#F2F2F7',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',
    textInverse: '#000000',
    accent: '#F97316',
    accentPressed: '#FB923C',
    accentSubtle: '#3A2500',
    success: '#22C55E',
    successSubtle: 'rgba(34,197,94,0.15)',
    successText: '#4ADE80',
    warning: '#EAB308',
    warningSubtle: 'rgba(234,179,8,0.15)',
    warningText: '#FCD34D',
    danger: '#EF4444',
    dangerSubtle: 'rgba(239,68,68,0.15)',
    dangerText: '#F87171',
    info: '#3B82F6',
    infoSubtle: 'rgba(59,130,246,0.15)',
    infoText: '#93C5FD',
    // Status
    pendingBg: 'rgba(234,179,8,0.15)',
    pendingText: '#FCD34D',
    approvedBg: 'rgba(34,197,94,0.15)',
    approvedText: '#4ADE80',
    rejectedBg: 'rgba(239,68,68,0.15)',
    rejectedText: '#F87171',
    // Tab bar
    tabActive: '#F97316',
    tabInactive: '#636366',
    tabBar: '#1C1C1E',
  },
} as const;

export type ColorScheme = typeof Colors.light | typeof Colors.dark;

export const Typography = {
  headingXl: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  headingLg: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  headingMd: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2 },
  bodySemibold: { fontSize: 16, fontWeight: '600' as const },
  bodyLg: { fontSize: 16, fontWeight: '400' as const },
  bodyMd: { fontSize: 14, fontWeight: '400' as const },
  bodySm: { fontSize: 12, fontWeight: '400' as const },
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.4 },
  tabularNums: { fontVariant: ['tabular-nums'] as const },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const Shadow = {
  sm: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  md: { boxShadow: '0 4px 12px rgba(0,0,0,0.10)' },
  lg: { boxShadow: '0 8px 24px rgba(0,0,0,0.14)' },
} as const;

// Role display config
export const RoleConfig: Record<
  string,
  { label: string; shortLabel: string; colour: string }
> = {
  Appointed_Person: {
    label: 'Appointed Person',
    shortLabel: 'AP',
    colour: '#F97316',
  },
  Crane_Supervisor: {
    label: 'Crane Supervisor',
    shortLabel: 'CS',
    colour: '#3B82F6',
  },
  Crane_Operator: {
    label: 'Crane Operator',
    shortLabel: 'CO',
    colour: '#8B5CF6',
  },
  Slinger_Signaller: {
    label: 'Slinger / Signaller',
    shortLabel: 'SS',
    colour: '#06B6D4',
  },
  Subcontractor: {
    label: 'Subcontractor',
    shortLabel: 'SC',
    colour: '#22C55E',
  },
};
