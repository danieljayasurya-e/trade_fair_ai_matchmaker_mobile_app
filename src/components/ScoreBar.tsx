import { StyleSheet, Text, View } from 'react-native';
import { font, radius, spacing, useTheme } from '../theme/theme';

interface Props {
  label: string;
  /** 0–1 */
  value: number;
  /** Read out by screen readers. */
  hint?: string;
}

export function ScoreBar({ label, value, hint }: Props) {
  const { colors } = useTheme();
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${label}: ${pct} percent${hint ? `. ${hint}` : ''}`}
    >
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.text }]}>{pct}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colors.accent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs + 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: font.small, fontWeight: '500', flexShrink: 1 },
  value: { fontSize: font.small, fontWeight: '700', fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
