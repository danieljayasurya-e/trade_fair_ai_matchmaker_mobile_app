import { useColorScheme } from 'react-native';

export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  success: string;
  warning: string;
  danger: string;
  dangerSoft: string;
  skeleton: string;
  backdrop: string;
}

const light: Palette = {
  background: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF1F7',
  border: '#DCE1EA',
  text: '#121826',
  textMuted: '#5B6475',
  accent: '#1F5EFF',
  accentSoft: '#E3EBFF',
  onAccent: '#FFFFFF',
  success: '#1A8F5A',
  warning: '#B26A00',
  danger: '#C62E3A',
  dangerSoft: '#FDE8EA',
  skeleton: '#E3E7EF',
  backdrop: 'rgba(10, 14, 24, 0.45)',
};

const dark: Palette = {
  background: '#0D111A',
  surface: '#161B26',
  surfaceAlt: '#1F2633',
  border: '#2C3442',
  text: '#F1F4F9',
  textMuted: '#A0A9B8',
  accent: '#6B93FF',
  accentSoft: '#1E2A4A',
  onAccent: '#0D111A',
  success: '#4CC38A',
  warning: '#F0B44C',
  danger: '#F07178',
  dangerSoft: '#3A1E24',
  skeleton: '#232A37',
  backdrop: 'rgba(0, 0, 0, 0.6)',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const font = {
  caption: 12,
  small: 14,
  body: 16,
  title: 20,
  heading: 26,
  hero: 32,
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
