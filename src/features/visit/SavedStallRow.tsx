import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { Recommendation } from '../../api/schemas';
import { BookmarkButton } from '../../components/BookmarkButton';
import { font, radius, spacing, TOUCH, useTheme } from '../../theme/theme';

interface Props {
  item: Recommendation;
  onRemove: (item: Recommendation) => void;
  /** Route position; shown instead of the match % when planning a route. */
  stop?: number;
}

/** Saved stall. Swipe left to remove; the star button does the same for screen-reader users. */
export function SavedStallRow({ item, onRemove, stop }: Props) {
  const { colors } = useTheme();
  const { exhibitor } = item;

  const renderRightActions = () => (
    <Pressable
      onPress={() => onRemove(item)}
      style={[styles.action, { backgroundColor: colors.danger }]}
      accessibilityRole="button"
      accessibilityLabel={`Remove ${exhibitor.name}`}
    >
      <Text style={[styles.actionText, { color: colors.surface }]}>Remove</Text>
    </Pressable>
  );

  return (
    <ReanimatedSwipeable
      renderRightActions={renderRightActions}
      onSwipeableOpen={() => onRemove(item)}
      rightThreshold={64}
      overshootRight={false}
      containerStyle={styles.container}
      testID={`saved-${exhibitor.id}`}
    >
      <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {stop !== undefined ? (
          <View style={[styles.stop, { backgroundColor: colors.accent }]}>
            <Text style={[styles.stopText, { color: colors.onAccent }]}>{stop}</Text>
          </View>
        ) : null}
        <View style={styles.flex}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
            {exhibitor.name}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
            Hall {exhibitor.hall} · Booth {exhibitor.booth} · {item.score}% match
          </Text>
          <Text style={[styles.reason, { color: colors.textMuted }]} numberOfLines={2}>
            {item.reason}
          </Text>
        </View>
        <BookmarkButton saved name={exhibitor.name} onToggle={() => onRemove(item)} />
      </View>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md, borderRadius: radius.lg, overflow: 'hidden' },
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  stop: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stopText: { fontSize: font.small, fontWeight: '800' },
  name: { fontSize: font.body, fontWeight: '700' },
  meta: { fontSize: font.small, marginTop: 2 },
  reason: { fontSize: font.caption, marginTop: spacing.xs },
  action: { justifyContent: 'center', alignItems: 'center', width: 96, minHeight: TOUCH },
  actionText: { fontSize: font.small, fontWeight: '700' },
});
