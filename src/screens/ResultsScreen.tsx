import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';
import { describeError } from '../api/client';
import { useBookmarks, useMeta, useRecommendations, useToggleBookmark } from '../api/queries';
import type { Recommendation } from '../api/schemas';
import { Chip } from '../components/Chip';
import { FilterIcon } from '../components/icons';
import { SkeletonList } from '../components/Skeleton';
import { Banner, StateView } from '../components/StateViews';
import { mapRows } from '../features/map/mapLayout';
import { FilterSheet } from '../features/results/FilterSheet';
import { activeFilterCount, applyFilters, facetsOf } from '../features/results/filtering';
import { rowLabel, shortName } from '../features/results/location';
import { ResultCard } from '../features/results/ResultCard';
import { StallDetailSheet } from '../features/results/StallDetailSheet';
import { useIsOnline } from '../net/online';
import { selectFilters, useFilters } from '../store/filtersStore';
import { formatSeconds, useMatchTiming } from '../store/matchTimingStore';
import { rankDelta, useRankChanges } from '../store/rankChangesStore';
import { useSession } from '../store/sessionStore';
import { font, radius, spacing, TOUCH, useTheme } from '../theme/theme';

const AnimatedList = Animated.FlatList<Recommendation>;
// Cards glide to their new positions when a profile edit re-ranks the list.
const reorder = LinearTransition.springify().damping(18);

export function ResultsScreen() {
  const { colors } = useTheme();
  const recs = useRecommendations();
  const bookmarks = useBookmarks();
  const meta = useMeta();
  const { toggle } = useToggleBookmark();
  const mode = useSession((s) => s.mode);
  const guest = useSession((s) => s.guest);
  const switchMode = useSession((s) => s.switchMode);
  const online = useIsOnline();
  const previousRanks = useRankChanges((s) => s.previous);
  const roundTripMs = useMatchTiming((s) => s.ms);

  const filters = useFilters(useShallow(selectFilters));
  const setFilters = useFilters((s) => s.set);
  const toggleFilter = useFilters((s) => s.toggle);
  const clearFilters = useFilters((s) => s.clearFilters);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const results = useMemo(() => recs.data?.results ?? [], [recs.data]);
  const savedIds = useMemo(() => new Set(bookmarks.data?.exhibitorIds ?? []), [bookmarks.data]);
  const visible = useMemo(() => applyFilters(results, filters, savedIds), [results, filters, savedIds]);
  const facets = useMemo(() => facetsOf(results), [results]);
  const rows = useMemo(() => mapRows(meta.data?.halls ?? [], results.map((r) => r.exhibitor.hall)), [meta.data, results]);
  const selected = results.find((r) => r.exhibitor.id === selectedId) ?? null;
  const selectedIndex = visible.findIndex((r) => r.exhibitor.id === selectedId);
  const filterCount = activeFilterCount(filters);

  const onToggleSave = useCallback(
    (item: Recommendation) => toggle(item.exhibitor.id, !savedIds.has(item.exhibitor.id)),
    [toggle, savedIds],
  );
  const onOpen = useCallback((item: Recommendation) => setSelectedId(item.exhibitor.id), []);
  const demoAction = mode === 'http' ? { label: 'Use demo data instead', onPress: () => void switchMode('mock') } : undefined;

  if (recs.isPending) {
    if (recs.fetchStatus === 'paused') {
      return (
        <View style={[styles.flex, { backgroundColor: colors.background }]}>
          <StateView
            title="You're offline"
            message="Your matches will load as soon as you're back online. Nothing saved on this phone yet."
            secondaryAction={demoAction}
          />
        </View>
      );
    }
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <SkeletonList />
      </View>
    );
  }

  if (recs.isError && !recs.data) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <StateView
          tone="error"
          title="Couldn't load your matches"
          message={describeError(recs.error)}
          action={{ label: 'Retry', onPress: () => void recs.refetch() }}
          secondaryAction={demoAction}
        />
      </View>
    );
  }

  const { latencyMs } = recs.data;
  const activeChips = [
    ...(filters.minScore > 0 ? [{ key: 'score', label: `${filters.minScore}%+`, clear: () => setFilters({ minScore: 0 }) }] : []),
    ...filters.halls.map((h) => ({ key: `h-${h}`, label: rowLabel(h), clear: () => toggleFilter('halls', h) })),
    ...filters.categories.map((c) => ({ key: `c-${c}`, label: c, clear: () => toggleFilter('categories', c) })),
    ...filters.industries.map((i) => ({ key: `i-${i}`, label: i, clear: () => toggleFilter('industries', i) })),
    ...(filters.savedOnly ? [{ key: 'saved', label: 'Saved', clear: () => setFilters({ savedOnly: false }) }] : []),
  ];
  const engineLabel = mode === 'mock' ? 'Demo data' : 'Local model';

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.panel, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          Your top {results.length}
        </Text>
        <View style={styles.pills}>
          {guest ? (
            <View style={[styles.pill, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.guestPill, { color: colors.onAccentSoft }]} numberOfLines={1}>
                {shortName(guest.name)} · {guest.industry}
              </Text>
            </View>
          ) : null}
          <View style={[styles.pill, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.latencyPill, { color: colors.text }]} testID="latency-badge">
              {recs.isFetching ? 'Updating matches…' : `${formatSeconds(roundTripMs ?? latencyMs)} · ${engineLabel}`}
            </Text>
          </View>
        </View>
        <View style={styles.controls}>
          <TextInput
            value={filters.search}
            onChangeText={(search) => setFilters({ search })}
            placeholder="Search stall, product, booth"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Search by stall name, product or booth"
            returnKeyType="search"
            clearButtonMode="while-editing"
            testID="search"
            style={[styles.search, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.outline }]}
          />
          <Pressable
            onPress={() => setFiltersOpen(true)}
            style={[styles.filterBtn, { backgroundColor: filterCount ? colors.accentSoft : colors.surface, borderColor: filterCount ? colors.accent : colors.outline }]}
            accessibilityRole="button"
            accessibilityLabel={`Filters and sort${filterCount ? `, ${filterCount} active` : ''}`}
            testID="open-filters"
          >
            <FilterIcon color={filterCount ? colors.onAccentSoft : colors.text} />
            <Text style={[styles.filterText, { color: filterCount ? colors.onAccentSoft : colors.text }]}>
              Filters{filterCount ? ` · ${filterCount}` : ''}
            </Text>
          </Pressable>
        </View>
      </View>

      <AnimatedList
        data={visible}
        keyExtractor={(r) => r.exhibitor.id}
        itemLayoutAnimation={reorder}
        renderItem={({ item }) => (
          <ResultCard
            item={item}
            saved={savedIds.has(item.exhibitor.id)}
            onPress={onOpen}
            onToggleSave={onToggleSave}
            rankDelta={rankDelta(previousRanks, item.exhibitor.id, item.rank)}
          />
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {mode === 'http' && !online ? <Banner text="Offline, showing saved results" /> : null}
            {recs.isError ? <Banner tone="error" text={`Couldn't refresh: ${describeError(recs.error)}`} /> : null}
            {activeChips.length > 0 ? (
              <View style={styles.activeRow}>
                {activeChips.map((c) => (
                  <Chip key={c.key} label={`${c.label}  ✕`} selected onPress={c.clear} accessibilityLabel={`Remove filter ${c.label}`} />
                ))}
                <Chip label="Clear all" onPress={clearFilters} />
              </View>
            ) : null}
            <Text style={[styles.count, { color: colors.textMuted }]} testID="result-count">
              Showing {visible.length} of {results.length}
            </Text>
          </View>
        }
        ListEmptyComponent={
          results.length === 0 ? (
            <StateView title="No matches yet" message="Try adding more interests or describing what you're looking for." />
          ) : (
            <StateView
              title="No stalls match these filters"
              action={{
                label: 'Clear filters',
                onPress: () => {
                  clearFilters();
                  setFilters({ search: '' });
                },
              }}
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={recs.isRefetching && !recs.isPending}
            onRefresh={() => void recs.refetch()}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        testID="results-list"
      />

      <FilterSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} facets={facets} resultCount={visible.length} />
      <StallDetailSheet
        item={selected}
        saved={selected ? savedIds.has(selected.exhibitor.id) : false}
        onToggleSave={onToggleSave}
        onClose={() => setSelectedId(null)}
        total={recs.data.total}
        rows={rows}
        onPrev={selectedIndex > 0 ? () => setSelectedId(visible[selectedIndex - 1].exhibitor.id) : undefined}
        onNext={selectedIndex >= 0 && selectedIndex < visible.length - 1 ? () => setSelectedId(visible[selectedIndex + 1].exhibitor.id) : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  panel: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm + 2, borderBottomWidth: 1 },
  title: { fontSize: font.screen, lineHeight: 28, fontWeight: '700' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  pill: { paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs, borderRadius: radius.pill, maxWidth: '100%' },
  guestPill: { fontSize: font.meta, fontWeight: '600' },
  latencyPill: { fontSize: font.meta, fontWeight: '500', fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', gap: spacing.sm },
  search: {
    flex: 1,
    minHeight: TOUCH,
    borderWidth: 1,
    borderRadius: radius.btn,
    paddingHorizontal: spacing.md,
    fontSize: font.label,
  },
  filterBtn: {
    minHeight: TOUCH,
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.btn,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: { fontSize: font.label, fontWeight: '600' },
  list: { paddingBottom: spacing.xxl },
  listHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  count: { fontSize: font.meta },
  activeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
