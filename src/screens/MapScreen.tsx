import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useMeta, useRecommendations, useToggleBookmark } from '../api/queries';
import type { Recommendation } from '../api/schemas';
import { SkeletonList } from '../components/Skeleton';
import { FloorMap, type MapPin } from '../features/map/FloorMap';
import { mapRows } from '../features/map/mapLayout';
import { HALL_NAME } from '../features/results/location';
import { StallDetailSheet } from '../features/results/StallDetailSheet';
import { useSavedStalls } from '../features/visit/useSavedStalls';
import { font, radius, spacing, TOUCH, useTheme } from '../theme/theme';

// Wide enough that booths a few numbers apart stay separate; the map scrolls sideways.
const MAP_WIDTH = 720;

function ListRow({ badge, title, meta, onPress, isStop }: { badge: string; title: string; meta: string; onPress: () => void; isStop: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.listRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={`${isStop ? 'Stop' : 'Rank'} ${badge}. ${title}. ${meta}.`}
    >
      <View style={[styles.badge, { backgroundColor: isStop ? colors.accent : colors.tealSoft }]}>
        <Text style={[styles.badgeText, { color: isStop ? colors.onAccent : colors.teal }]}>{badge}</Text>
      </View>
      <View style={styles.flex}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.rowMeta, { color: colors.textMuted }]} numberOfLines={1}>{meta}</Text>
      </View>
    </Pressable>
  );
}

export function MapScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const recs = useRecommendations();
  const meta = useMeta();
  const { toggle } = useToggleBookmark();
  const { route, savedIds } = useSavedStalls();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const results = useMemo(() => recs.data?.results ?? [], [recs.data]);
  const stops = useMemo(() => route.halls.flatMap((h) => h.stalls), [route]);
  const others = useMemo(() => results.filter((r) => !savedIds.has(r.exhibitor.id)), [results, savedIds]);
  const rows = useMemo(
    () => mapRows(meta.data?.halls ?? [], [...stops, ...results].map((r) => r.exhibitor.hall)),
    [meta.data, stops, results],
  );

  const pins = useMemo<MapPin[]>(
    () => [
      ...others.map((r): MapPin => ({
        key: r.exhibitor.id,
        row: r.exhibitor.hall,
        booth: r.exhibitor.booth,
        tone: 'match',
        accessibilityLabel: `Rank ${r.rank}, ${r.exhibitor.name}, booth ${r.exhibitor.booth}`,
        onPress: () => setSelectedId(r.exhibitor.id),
      })),
      ...stops.map((r, i): MapPin => ({
        key: r.exhibitor.id,
        row: r.exhibitor.hall,
        booth: r.exhibitor.booth,
        tone: 'stop',
        label: String(i + 1),
        accessibilityLabel: `Stop ${i + 1}, ${r.exhibitor.name}, booth ${r.exhibitor.booth}`,
        onPress: () => setSelectedId(r.exhibitor.id),
      })),
    ],
    [others, stops],
  );

  const all = [...stops, ...results];
  const selected = all.find((r) => r.exhibitor.id === selectedId) ?? null;
  const onToggleSave = (item: Recommendation) => toggle(item.exhibitor.id, !savedIds.has(item.exhibitor.id));

  if (recs.isPending) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <SkeletonList count={3} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <View style={[styles.panel, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">{HALL_NAME} map</Text>
        <Text style={[styles.caption, { color: colors.textMuted }]}>
          Schematic by booth row and number, not the official floor plan. Check booth signs on the floor.
        </Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendStop, { backgroundColor: colors.accent }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Stop on your route</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.tealSoft, borderColor: colors.teal }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Other top match</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.mapScroll} testID="floor-map">
        <FloorMap rows={rows} pins={pins} width={Math.max(MAP_WIDTH, width - spacing.lg * 2)} />
      </ScrollView>

      <View style={styles.list}>
        {stops.length > 0 ? (
          <>
            <Text style={[styles.section, { color: colors.text }]} accessibilityRole="header">Your route · {stops.length} {stops.length === 1 ? 'stop' : 'stops'}</Text>
            {stops.map((r, i) => (
              <ListRow
                key={r.exhibitor.id}
                badge={String(i + 1)}
                isStop
                title={r.exhibitor.name}
                meta={`${r.exhibitor.booth} · ${r.score}% match`}
                onPress={() => setSelectedId(r.exhibitor.id)}
              />
            ))}
          </>
        ) : (
          <>
            <Text style={[styles.caption, { color: colors.textMuted }]}>
              Save stalls to see them as numbered stops with a route between them.
            </Text>
            <Text style={[styles.section, { color: colors.text }]} accessibilityRole="header">Your top matches</Text>
            {others.slice(0, 5).map((r) => (
              <ListRow
                key={r.exhibitor.id}
                badge={String(r.rank)}
                isStop={false}
                title={r.exhibitor.name}
                meta={`${r.exhibitor.booth} · ${r.score}% match`}
                onPress={() => setSelectedId(r.exhibitor.id)}
              />
            ))}
          </>
        )}
      </View>

      <StallDetailSheet
        item={selected}
        saved={selected ? savedIds.has(selected.exhibitor.id) : false}
        onToggleSave={onToggleSave}
        onClose={() => setSelectedId(null)}
        total={recs.data?.total}
        rows={rows}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  panel: { padding: spacing.lg, gap: spacing.sm, borderBottomWidth: 1 },
  title: { fontSize: font.screen, lineHeight: 28, fontWeight: '700' },
  caption: { fontSize: font.meta, lineHeight: 19 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  legendStop: { width: 14, height: 14, borderRadius: radius.pill },
  legendDot: { width: 12, height: 12, borderWidth: 2, borderRadius: radius.pill },
  legendText: { fontSize: font.caption },
  mapScroll: { padding: spacing.lg },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm + 2 },
  section: { fontSize: font.body, fontWeight: '600', marginTop: spacing.xs },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: TOUCH + 12,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badge: { width: 28, height: 28, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: font.caption, fontWeight: '700' },
  rowTitle: { fontSize: font.small, fontWeight: '600' },
  rowMeta: { fontSize: font.meta, marginTop: 2 },
});
