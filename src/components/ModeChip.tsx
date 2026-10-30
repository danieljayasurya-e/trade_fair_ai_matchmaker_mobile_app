import { StyleSheet, Text, View } from 'react-native';
import { useSession } from '../store/sessionStore';
import { font, radius, spacing, useTheme } from '../theme/theme';

/** Always visible in mock mode so demo data is never mistaken for the real engine. */
export function ModeChip() {
  const mode = useSession((s) => s.mode);
  const { colors } = useTheme();
  if (mode !== 'mock') return null;
  return (
    <View
      style={[styles.chip, { backgroundColor: colors.surfaceAlt, borderColor: colors.warning }]}
      accessible
      accessibilityLabel="Showing demo data, not the live matching engine"
    >
      <Text style={[styles.text, { color: colors.warning }]}>Demo data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.sm,
  },
  text: { fontSize: font.caption, fontWeight: '700' },
});
