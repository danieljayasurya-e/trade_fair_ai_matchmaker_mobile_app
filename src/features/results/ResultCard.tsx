import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Recommendation } from '../../api/schemas';
import { BookmarkButton } from '../../components/BookmarkButton';
import { Chip } from '../../components/Chip';
import { ScoreRing } from '../../components/ScoreRing';
import { font, radius, spacing, useTheme } from '../../theme/theme';
import { HALL_NAME } from './location';
import { RankChangeBadge } from './RankChangeBadge';

const MAX_CHIPS = 2;

interface Props {
  item: Recommendation;
  saved: boolean;
  onPress: (item: Recommendation) => void;
  onToggleSave: (item: Recommendation) => void;
  /** Rank movement since the last profile edit. */
  rankDelta?: number | 'new';
}

function ResultCardImpl({ item, saved, onPress, onToggleSave, rankDelta = 0 }: Props) {
  const { colors } = useTheme();
  const { exhibitor, matchedOn, score, rank } = item;
  const matched = matchedOn.length > 0 ? matchedOn : ['General match'];
  const extra = matched.length - MAX_CHIPS;

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.92 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Rank ${rank}. ${exhibitor.name}. ${score} percent match. ${HALL_NAME}, booth ${exhibitor.booth}. Matched on ${matched.join(', ')}.`}
      accessibilityHint="Opens stall details"
      testID={`result-${exhibitor.id}`}
    >
      <ScoreRing score={score} />
      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {exhibitor.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
            #{rank} · {HALL_NAME} · {exhibitor.booth}
          </Text>
          <RankChangeBadge delta={rankDelta} />
        </View>
        <View style={styles.chips}>
          {matched.slice(0, MAX_CHIPS).map((c) => (
            <Chip key={c} label={c} compact tone="accent" />
          ))}
          {extra > 0 ? <Chip label={`+${extra}`} compact /> : null}
        </View>
      </View>
      <BookmarkButton saved={saved} name={exhibitor.name} onToggle={() => onToggleSave(item)} />
    </Pressable>
  );
}

export const ResultCard = memo(ResultCardImpl);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md + 2,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm + 2,
  },
  body: { flex: 1, minWidth: 0, gap: spacing.xs },
  name: { fontSize: font.body, lineHeight: 22, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  meta: { fontSize: font.meta, flexShrink: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2, marginTop: 2 },
});
