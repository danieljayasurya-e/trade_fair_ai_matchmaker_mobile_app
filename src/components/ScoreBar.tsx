import { StyleSheet, Text, View } from 'react-native';
import { font, radius, spacing, useTheme } from '../theme/theme';

interface Props {
  label: string;
  /** 0–1 */
  value: number;
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
        <Text style={[styles.value, { color: colors.textMuted }]}>{pct}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colors.accent }]} />
      </View>
      {hint ? <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  label: { fontSize: font.small, fontWeight: '600', flexShrink: 1 },
  value: { fontSize: font.small, fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  hint: { fontSize: font.caption, marginTop: 2 },
});
