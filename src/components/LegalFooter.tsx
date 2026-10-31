import { StyleSheet, Text, View } from 'react-native';
import { font, spacing, useTheme } from '../theme/theme';

export function LegalFooter() {
  const { colors } = useTheme();
  return (
    <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.textMuted }]}>
        Rankings come only from how well profiles fit. No exhibitor pays for placement.
      </Text>
      <Text style={[styles.text, { color: colors.textMuted }]}>Sample profiles are fictional.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { padding: spacing.lg, paddingHorizontal: spacing.lg + 4, borderTopWidth: 1, gap: spacing.xs + 2 },
  text: { fontSize: font.meta, lineHeight: 19 },
});
