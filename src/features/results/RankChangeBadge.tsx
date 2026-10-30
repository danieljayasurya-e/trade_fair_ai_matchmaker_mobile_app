import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { font, radius, spacing, useTheme } from '../../theme/theme';

/** "↑3" / "↓2" / "New" after a profile edit. Renders nothing for unchanged ranks. */
export function RankChangeBadge({ delta }: { delta: number | 'new' }) {
  const { colors } = useTheme();
  if (delta === 0) return null;
  const up = delta === 'new' || delta > 0;
  const label = delta === 'new' ? 'New' : delta > 0 ? `↑${delta}` : `↓${-delta}`;
  const a11y = delta === 'new' ? 'New in your list' : delta > 0 ? `Up ${delta} places` : `Down ${-delta} places`;
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <View
        style={[styles.badge, { backgroundColor: up ? colors.success : colors.danger }]}
        accessible
        accessibilityLabel={a11y}
      >
        <Text style={[styles.text, { color: colors.surface }]}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 1, alignSelf: 'flex-start' },
  text: { fontSize: font.caption, fontWeight: '800' },
});
