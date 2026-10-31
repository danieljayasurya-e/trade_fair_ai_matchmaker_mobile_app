import { StyleSheet, Text, View } from 'react-native';
import { useIsOnline } from '../net/online';
import { useSession } from '../store/sessionStore';
import { font, radius, spacing, useTheme } from '../theme/theme';
import { ModeChip } from './ModeChip';

function OfflineChip() {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.chip, { backgroundColor: colors.dangerSoft }]}
      accessible
      accessibilityLabel="Offline. Changes will sync when you reconnect."
    >
      <Text style={[styles.text, { color: colors.danger }]}>Offline</Text>
    </View>
  );
}

/** Header status: "Live" or "Demo data", plus "Offline" when there is no network. "Live" gives way to "Offline". */
export function HeaderChips() {
  const online = useIsOnline();
  const mode = useSession((s) => s.mode);
  return (
    <View style={styles.row}>
      {!online ? <OfflineChip /> : null}
      {online || mode === 'mock' ? <ModeChip /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  chip: { borderRadius: radius.pill, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs },
  text: { fontSize: font.caption, fontWeight: '600' },
});
