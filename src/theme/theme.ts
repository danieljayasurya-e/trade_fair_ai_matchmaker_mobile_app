import { useColorScheme } from 'react-native';

export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  /** Border of inputs and outlined buttons. */
  outline: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  onAccentSoft: string;
  teal: string;
  tealSoft: string;
  success: string;
  successSoft: string;
  onSuccessSoft: string;
  warning: string;
  danger: string;
  dangerSoft: string;
  skeleton: string;
  backdrop: string;
}

const light: Palette = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  outline: '#64748B',
  text: '#0F172A',
  textMuted: '#475569',
  accent: '#1D4ED8',
  accentSoft: '#DBEAFE',
  onAccent: '#FFFFFF',
  onAccentSoft: '#1E3A8A',
  teal: '#0F766E',
  tealSoft: '#CCFBF1',
  success: '#15803D',
  successSoft: '#DCFCE7',
  onSuccessSoft: '#14532D',
  warning: '#B45309',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  skeleton: '#EEF2F6',
  backdrop: 'rgba(15, 23, 42, 0.45)',
};

const dark: Palette = {
  background: '#0B1220',
  surface: '#111A2C',
  surfaceAlt: '#1C2740',
  border: '#2A3650',
  outline: '#7C8BA5',
  text: '#F1F5F9',
  textMuted: '#A3B0C6',
  accent: '#7AA2FF',
  accentSoft: '#1E2F57',
  onAccent: '#0B1220',
  onAccentSoft: '#BFD3FF',
  teal: '#5EEAD4',
  tealSoft: '#123A38',
  success: '#4ADE80',
  successSoft: '#12331F',
  onSuccessSoft: '#BBF7D0',
  warning: '#FBBF24',
  danger: '#F87171',
  dangerSoft: '#3B1A1F',
  skeleton: '#1F2A40',
  backdrop: 'rgba(0, 0, 0, 0.6)',
};

/** Logo colours; the same in light and dark. */
export const brand = { blue: '#1D4ED8', white: '#FFFFFF', mint: '#5EEAD4', teal: '#0F766E' } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { xs: 6, sm: 8, btn: 10, md: 12, lg: 16, pill: 999 } as const;
export const font = {
  caption: 12,
  meta: 13,
  small: 14,
  label: 15,
  body: 16,
  section: 18,
  title: 20,
  screen: 22,
  heading: 24,
  hero: 30,
} as const;
/** Minimum touch target in points. */
export const TOUCH = 44;

export interface Theme {
  dark: boolean;
  colors: Palette;
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { dark: isDark, colors: isDark ? dark : light };
}

/** The match-score band: colour of the ring and the words next to it. */
export function scoreBand(score: number, colors: Palette): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent fit', color: colors.success };
  if (score >= 60) return { label: 'Good fit', color: colors.warning };
  return { label: 'Partial fit', color: colors.textMuted };
}
