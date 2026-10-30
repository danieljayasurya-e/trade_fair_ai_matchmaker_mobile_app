import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, radius, spacing, TOUCH, useTheme } from '../theme/theme';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Small, non-interactive tag style used inside cards. */
  compact?: boolean;
  tone?: 'neutral' | 'accent';
  accessibilityLabel?: string;
}

export function Chip({ label, selected, onPress, compact, tone = 'neutral', accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const active = selected || tone === 'accent';
  const bg = selected ? colors.accent : tone === 'accent' ? colors.accentSoft : colors.surfaceAlt;
  const fg = selected ? colors.onAccent : active ? colors.accent : colors.text;

  const content = (
    <Text style={[styles.text, compact && styles.textCompact, { color: fg }]} numberOfLines={1}>
      {label}
    </Text>
  );

  if (!onPress) {
    return <View style={[styles.base, compact && styles.compact, { backgroundColor: bg }]}>{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: !!selected }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        styles.interactive,
        { backgroundColor: bg, borderColor: selected ? colors.accent : colors.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    maxWidth: '100%',
  },
  interactive: { minHeight: TOUCH - 8, justifyContent: 'center', borderWidth: 1 },
  compact: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
  text: { fontSize: font.small, fontWeight: '500' },
  textCompact: { fontSize: font.caption },
});
