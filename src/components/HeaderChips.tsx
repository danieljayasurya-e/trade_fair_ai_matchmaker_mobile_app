import { StyleSheet, Text, View } from 'react-native';
import { useIsOnline } from '../net/online';
import { font, radius, spacing, useTheme } from '../theme/theme';
import { ModeChip } from './ModeChip';

function OfflineChip() {
  const online = useIsOnline();
  const { colors } = useTheme();
  if (online) return null;
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

/** Header-right status: "Offline" when there is no network, "Demo data" in mock mode. */
export function HeaderChips() {
  return (
    <View style={styles.row}>
      <OfflineChip />
      <ModeChip />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  chip: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, marginRight: spacing.sm },
  text: { fontSize: font.caption, fontWeight: '700' },
});
