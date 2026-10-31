import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { Recommendation } from '../../api/schemas';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { BookmarkIcon, CheckIcon, ChevronIcon } from '../../components/icons';
import { ScoreBar } from '../../components/ScoreBar';
import { ScoreRing } from '../../components/ScoreRing';
import { Sheet } from '../../components/Sheet';
import { font, radius, scoreBand, spacing, useTheme } from '../../theme/theme';
import { FloorMap, type MapPin } from '../map/FloorMap';
import { cleanDescription, fullLocation, initials } from './location';

interface Props {
  item: Recommendation | null;
  saved: boolean;
  onToggleSave: (item: Recommendation) => void;
  onClose: () => void;
  /** Candidates that scored; "Rank #1 of 149 exhibitors". */
  total?: number;
  /** Booth rows for the location map. */
  rows: string[];
  onPrev?: () => void;
  onNext?: () => void;
}

function StepButton({ direction, onPress }: { direction: 'left' | 'right'; onPress?: () => void }) {
  const { colors } = useTheme();
  const label = direction === 'left' ? 'Previous exhibitor' : 'Next exhibitor';
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.step, !onPress && styles.stepDisabled, { borderColor: colors.outline, backgroundColor: colors.surface }]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !onPress }}
    >
      <ChevronIcon direction={direction} color={colors.text} />
    </Pressable>
  );
}

export function StallDetailSheet({ item, saved, onToggleSave, onClose, total, rows, onPrev, onNext }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  if (!item) return null;
  const { exhibitor, factors, insights, score, rank } = item;
  const band = scoreBand(score, colors);
  const description = cleanDescription(exhibitor.description);
  const pin: MapPin = { key: exhibitor.id, booth: exhibitor.booth, row: exhibitor.hall, tone: 'focus', accessibilityLabel: `Booth ${exhibitor.booth}` };
  const pins = [pin, ...exhibitor.otherBooths.map((b): MapPin => ({
    key: b,
    booth: b,
    row: b.split(' ')[0],
    tone: 'focus',
    accessibilityLabel: `Booth ${b}`,
  }))];

  return (
    <Sheet
      visible
      onClose={onClose}
      title={exhibitor.name}
      closeLabel="Close details"
      heading={
        <>
          <View style={[styles.tile, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.tileText, { color: colors.text }]}>{initials(exhibitor.name)}</Text>
          </View>
          <View style={styles.headingText}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={2} accessibilityRole="header">
              {exhibitor.name}
            </Text>
            <Text style={[styles.place, { color: colors.textMuted }]}>{fullLocation(exhibitor)}</Text>
          </View>
        </>
      }
      footer={
        <View style={styles.footer}>
          <Button
            label={saved ? 'Remove from visit list' : 'Save to visit list'}
            variant={saved ? 'secondary' : 'primary'}
            icon={<BookmarkIcon color={saved ? colors.text : colors.onAccent} size={18} filled={saved} />}
            onPress={() => onToggleSave(item)}
            style={styles.save}
            testID="detail-save"
          />
          <StepButton direction="left" onPress={onPrev} />
          <StepButton direction="right" onPress={onNext} />
        </View>
      }
    >
      <View style={styles.sections}>
        <View style={styles.summary}>
          <ScoreRing score={score} size={80} percent />
          <View style={styles.summaryText}>
            <Text style={[styles.why, { color: colors.text }]} accessibilityRole="header">
              Why this is a {score}% match
            </Text>
            <Text style={[styles.body, { color: colors.textMuted }]}>
              <Text style={[styles.bandText, { color: band.color }]}>{band.label}</Text> · Rank #{rank}
              {total !== undefined ? ` of ${total} exhibitors` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.bars}>
          <ScoreBar label="Semantic similarity" value={factors.semantic} hint="How closely your goals read like their offering" />
          <ScoreBar label="Interest overlap" value={factors.interest} hint="Share of your interests they are tagged with" />
          <ScoreBar label="Intent match" value={factors.intent} hint="What you wrote compared with their products" />
          <ScoreBar label="Buyer fit" value={factors.buyerFit} hint="Whether they sell to your sector" />
        </View>

        <Text style={[styles.body, { color: colors.textMuted }]} accessibilityLabel={`You to stall ${Math.round(factors.g2e * 100)} percent. Stall to you ${Math.round(factors.e2g * 100)} percent.`}>
          You → stall <Text style={[styles.strong, { color: colors.text }]}>{Math.round(factors.g2e * 100)}%</Text> · Stall → you{' '}
          <Text style={[styles.strong, { color: colors.text }]}>{Math.round(factors.e2g * 100)}%</Text>
        </Text>

        <View style={styles.insights}>
          {insights.map((i) => (
            <View key={i.label} style={styles.insight}>
              <View style={[styles.tick, { backgroundColor: colors.tealSoft }]}>
                <CheckIcon color={colors.teal} size={13} />
              </View>
              <View style={styles.insightText}>
                <Text style={[styles.insightLabel, { color: colors.text }]}>{i.label}</Text>
                <Text style={[styles.body, { color: colors.textMuted }]}>{i.why}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={[styles.note, { color: colors.textMuted }]}>
          The score is the geometric mean of both directions, from profile data only.
        </Text>

        {exhibitor.tags.length > 0 ? (
          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: colors.text }]} accessibilityRole="header">Product areas</Text>
            <View style={styles.chips}>
              {exhibitor.tags.map((t) => (
                <Chip key={t} label={t} />
              ))}
            </View>
          </View>
        ) : null}

        {exhibitor.products.length > 0 ? (
          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: colors.text }]} accessibilityRole="header">Products</Text>
            <View style={styles.chips}>
              {exhibitor.products.map((p) => (
                <Chip key={p} label={p} />
              ))}
            </View>
          </View>
        ) : null}

        {description ? (
          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: colors.text }]} accessibilityRole="header">About</Text>
            <Text style={[styles.body, { color: colors.textMuted }]}>{description}</Text>
          </View>
        ) : null}

        <View style={styles.group}>
          <Text style={[styles.groupTitle, { color: colors.text }]} accessibilityRole="header">Location</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Booth {[exhibitor.booth, ...exhibitor.otherBooths].join(', ')} in Hall 1.
          </Text>
          <FloorMap rows={rows} pins={pins} width={width - spacing.lg * 2} compact testID="detail-map" />
          <Text style={[styles.note, { color: colors.textMuted }]}>Schematic by row and booth number, not the official floor plan.</Text>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  tile: { width: 44, height: 44, borderRadius: radius.btn, alignItems: 'center', justifyContent: 'center' },
  tileText: { fontSize: font.label, fontWeight: '700' },
  headingText: { flex: 1, minWidth: 0 },
  name: { fontSize: font.section, lineHeight: 25, fontWeight: '600' },
  place: { fontSize: font.meta, lineHeight: 19, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  save: { flex: 1, minHeight: 48 },
  step: { width: 48, height: 48, borderWidth: 1, borderRadius: radius.btn, alignItems: 'center', justifyContent: 'center' },
  stepDisabled: { opacity: 0.4 },
  sections: { gap: spacing.lg + 4 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  summaryText: { flex: 1 },
  why: { fontSize: 17, lineHeight: 24, fontWeight: '600', marginBottom: spacing.xs },
  bandText: { fontWeight: '600' },
  bars: { gap: spacing.md },
  body: { fontSize: font.small, lineHeight: 20 },
  strong: { fontWeight: '700' },
  insights: { gap: spacing.md },
  insight: { flexDirection: 'row', gap: spacing.sm + 2, alignItems: 'flex-start' },
  tick: { width: 22, height: 22, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  insightText: { flex: 1 },
  insightLabel: { fontSize: font.small, lineHeight: 20, fontWeight: '600' },
  note: { fontSize: font.meta, lineHeight: 19 },
  group: { gap: spacing.sm + 2 },
  groupTitle: { fontSize: font.body, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
