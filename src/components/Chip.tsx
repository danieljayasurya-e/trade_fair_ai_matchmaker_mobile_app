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
  const bg = selected ? colors.accent : onPress ? colors.surface : tone === 'accent' ? colors.tealSoft : colors.surfaceAlt;
  const fg = selected ? colors.onAccent : tone === 'accent' ? colors.teal : colors.text;

  const content = (
    <Text style={[styles.text, compact && styles.textCompact, onPress && styles.textInteractive, { color: fg }]} numberOfLines={onPress ? 1 : 2}>
      {label}
    </Text>
  );

  if (!onPress) {
    return <View style={[styles.tag, compact && styles.compact, { backgroundColor: bg }]}>{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: !!selected }}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: bg, borderColor: selected ? colors.accent : colors.outline, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    maxWidth: '100%',
  },
  compact: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
  pill: {
    minHeight: TOUCH,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg + 2,
    maxWidth: '100%',
  },
  text: { fontSize: font.small },
  textCompact: { fontSize: font.caption, fontWeight: '500' },
  textInteractive: { fontWeight: '600' },
});
