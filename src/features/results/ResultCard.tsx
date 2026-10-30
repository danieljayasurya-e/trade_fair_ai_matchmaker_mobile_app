import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Recommendation } from '../../api/schemas';
import { BookmarkButton } from '../../components/BookmarkButton';
import { Chip } from '../../components/Chip';
import { ScoreRing } from '../../components/ScoreRing';
import { font, radius, spacing, useTheme } from '../../theme/theme';
import { RankChangeBadge } from './RankChangeBadge';

const MAX_CHIPS = 3;

interface Props {
  item: Recommendation;
  saved: boolean;
  onPress: (item: Recommendation) => void;
  onToggleSave: (item: Recommendation) => void;
  /** Rank movement since the last profile edit. */
  rankDelta?: number | 'new';
}

function ChipRow({ items, tone }: { items: string[]; tone?: 'accent' }) {
  const extra = items.length - MAX_CHIPS;
  return (
    <View style={styles.chips}>
      {items.slice(0, MAX_CHIPS).map((c) => (
        <Chip key={c} label={c} compact tone={tone} />
      ))}
      {extra > 0 ? <Chip label={`+${extra}`} compact /> : null}
    </View>
  );
}

function ResultCardImpl({ item, saved, onPress, onToggleSave, rankDelta = 0 }: Props) {
  const { colors } = useTheme();
  const { exhibitor, matchedOn, score, rank } = item;
  const matched = matchedOn.length > 0 ? matchedOn : ['General match'];

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.92 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Rank ${rank}. ${exhibitor.name}. ${score} percent match. Hall ${exhibitor.hall}, booth ${exhibitor.booth}. Matched on ${matched.join(', ')}.`}
      accessibilityHint="Opens stall details"
      testID={`result-${exhibitor.id}`}
    >
      <View style={styles.top}>
        <View style={styles.rankCol}>
          <Text style={[styles.rank, { color: colors.textMuted }]}>#{rank}</Text>
          <RankChangeBadge delta={rankDelta} />
        </View>
        <View style={styles.titleCol}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
            {exhibitor.name}
          </Text>
          <Text style={[styles.booth, { color: colors.textMuted }]} numberOfLines={1}>
            Hall {exhibitor.hall} · Booth {exhibitor.booth}
          </Text>
        </View>
        <ScoreRing score={score} />
      </View>

      <ChipRow items={exhibitor.products} />
      <View style={styles.matchedRow}>
        <Text style={[styles.matchedLabel, { color: colors.textMuted }]}>Matched on</Text>
        <ChipRow items={matched} tone="accent" />
      </View>

      <View style={styles.bookmark}>
        <BookmarkButton saved={saved} name={exhibitor.name} onToggle={() => onToggleSave(item)} />
      </View>
    </Pressable>
  );
}

export const ResultCard = memo(ResultCardImpl);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rankCol: { minWidth: 32, gap: spacing.xs },
  rank: { fontSize: font.small, fontWeight: '700' },
  titleCol: { flex: 1 },
  name: { fontSize: font.body + 1, fontWeight: '700' },
  booth: { fontSize: font.small, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm, flexShrink: 1 },
  matchedRow: { marginTop: spacing.xs },
  matchedLabel: { fontSize: font.caption, marginTop: spacing.sm, fontWeight: '600' },
  bookmark: { position: 'absolute', right: spacing.xs, bottom: spacing.xs },
});
