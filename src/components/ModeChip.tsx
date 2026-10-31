import { StyleSheet, Text, View } from 'react-native';
import { useSession } from '../store/sessionStore';
import { font, radius, spacing, useTheme } from '../theme/theme';

/** "Live" on the real API; always "Demo data" in mock mode so it is never mistaken for the real engine. */
export function ModeChip() {
  const mode = useSession((s) => s.mode);
  const { colors } = useTheme();
  const mock = mode === 'mock';
  return (
    <View
      style={[styles.chip, { backgroundColor: mock ? colors.surfaceAlt : colors.successSoft }]}
      accessible
      accessibilityLabel={mock ? 'Showing demo data, not the live matching engine' : 'Connected to the live matching engine'}
    >
      <View style={[styles.dot, { backgroundColor: mock ? colors.warning : colors.success }]} />
      <Text style={[styles.text, { color: mock ? colors.warning : colors.onSuccessSoft }]}>{mock ? 'Demo data' : 'Live'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  dot: { width: 7, height: 7, borderRadius: radius.pill },
  text: { fontSize: font.caption, fontWeight: '600' },
});
