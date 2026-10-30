import { StyleSheet, Text, View } from 'react-native';
import type { Recommendation } from '../../api/schemas';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { ScoreBar } from '../../components/ScoreBar';
import { ScoreRing } from '../../components/ScoreRing';
import { Sheet } from '../../components/Sheet';
import { font, spacing, useTheme } from '../../theme/theme';

interface Props {
  item: Recommendation | null;
  saved: boolean;
  onToggleSave: (item: Recommendation) => void;
  onClose: () => void;
}

export function StallDetailSheet({ item, saved, onToggleSave, onClose }: Props) {
  const { colors } = useTheme();
  if (!item) return null;
  const { exhibitor, factors, matchedOn, reason, score, rank } = item;

  return (
    <Sheet
      visible
      onClose={onClose}
      title={exhibitor.name}
      footer={
        <Button
          label={saved ? 'Remove from visit list' : 'Save to visit list'}
          variant={saved ? 'secondary' : 'primary'}
          onPress={() => onToggleSave(item)}
        />
      }
    >
      <View style={styles.summary}>
        <ScoreRing score={score} size={72} />
        <View style={styles.summaryText}>
          <Text style={[styles.meta, { color: colors.textMuted }]}>Rank #{rank}</Text>
          <Text style={[styles.booth, { color: colors.text }]}>
            Hall {exhibitor.hall} · Booth {exhibitor.booth}
          </Text>
        </View>
      </View>

      <Text style={[styles.reason, { color: colors.text }]}>{reason}</Text>

      <Text style={[styles.section, { color: colors.text }]}>Matched on</Text>
      <View style={styles.chips}>
        {(matchedOn.length > 0 ? matchedOn : ['General match']).map((m) => (
          <Chip key={m} label={m} tone="accent" />
        ))}
      </View>

      <Text style={[styles.section, { color: colors.text }]}>Why this score</Text>
      <ScoreBar label="Semantic similarity" value={factors.semantic} hint="How closely your goals read like their offering" />
      <ScoreBar label="Interest overlap" value={factors.interest} hint="Shared taxonomy tags" />
      <ScoreBar label="Intent match" value={factors.intent} hint="Your procurement interests vs their products" />
      <ScoreBar label="Buyer fit" value={factors.buyerFit} hint="You vs the buyers they target" />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <ScoreBar label="You → Stall" value={factors.g2e} hint="Does this stall sell what you want?" />
      <ScoreBar label="Stall → You" value={factors.e2g} hint="Are you the buyer they want?" />
      <Text style={[styles.note, { color: colors.textMuted }]}>
        Final match = geometric mean of both directions. No paid boosts.
      </Text>

      <Text style={[styles.section, { color: colors.text }]}>Products</Text>
      <View style={styles.chips}>
        {exhibitor.products.map((p) => (
          <Chip key={p} label={p} />
        ))}
      </View>

      <Text style={[styles.section, { color: colors.text }]}>About</Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>{exhibitor.description}</Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.md },
  summaryText: { flex: 1 },
  meta: { fontSize: font.small },
  booth: { fontSize: font.body, fontWeight: '600', marginTop: 2 },
  reason: { fontSize: font.body, lineHeight: 22 },
  section: { fontSize: font.body, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.sm },
  note: { fontSize: font.caption },
  body: { fontSize: font.body, lineHeight: 22 },
});
