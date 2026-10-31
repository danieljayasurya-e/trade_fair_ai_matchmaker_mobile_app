import { StyleSheet, Text, View } from 'react-native';
import { font, radius, spacing, useTheme } from '../theme/theme';
import { Button } from './Button';

interface Action {
  label: string;
  onPress: () => void;
}

interface Props {
  title: string;
  message?: string;
  action?: Action;
  secondaryAction?: Action;
  tone?: 'neutral' | 'error';
}

export function StateView({ title, message, action, secondaryAction, tone = 'neutral' }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap} accessibilityRole={tone === 'error' ? 'alert' : undefined}>
      <Text style={[styles.title, { color: tone === 'error' ? colors.danger : colors.text }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text> : null}
      {action ? <Button label={action.label} onPress={action.onPress} style={styles.button} /> : null}
      {secondaryAction ? (
        <Button label={secondaryAction.label} onPress={secondaryAction.onPress} variant="ghost" />
      ) : null}
    </View>
  );
}

export function Banner({ text, tone = 'warning' }: { text: string; tone?: 'warning' | 'error' | 'info' }) {
  const { colors } = useTheme();
  const bg = tone === 'error' ? colors.dangerSoft : tone === 'info' ? colors.successSoft : colors.surfaceAlt;
  const fg = tone === 'error' ? colors.danger : tone === 'info' ? colors.onSuccessSoft : colors.warning;
  return (
    <View style={[styles.banner, { backgroundColor: bg }]} accessibilityRole="alert">
      <Text style={[styles.bannerText, { color: fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: spacing.xxl, gap: spacing.md },
  title: { fontSize: font.title, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: font.body, textAlign: 'center', lineHeight: 22 },
  button: { alignSelf: 'stretch', marginTop: spacing.sm },
  banner: {
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
  },
  bannerText: { fontSize: font.small, lineHeight: 20 },
});
