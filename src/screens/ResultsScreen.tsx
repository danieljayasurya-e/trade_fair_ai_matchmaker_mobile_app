import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';
import { describeError } from '../api/client';
import { useBookmarks, useRecommendations, useToggleBookmark } from '../api/queries';
import type { Recommendation } from '../api/schemas';
import { Chip } from '../components/Chip';
import { SkeletonList } from '../components/Skeleton';
import { Banner, StateView } from '../components/StateViews';
import { FilterSheet } from '../features/results/FilterSheet';
import { activeFilterCount, applyFilters, facetsOf } from '../features/results/filtering';
import { ResultCard } from '../features/results/ResultCard';
import { StallDetailSheet } from '../features/results/StallDetailSheet';
import { useIsOnline } from '../net/online';
import { selectFilters, useFilters } from '../store/filtersStore';
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
  const { toggle } = useToggleBookmark();
  const mode = useSession((s) => s.mode);
  const switchMode = useSession((s) => s.switchMode);
  const online = useIsOnline();
  const previousRanks = useRankChanges((s) => s.previous);

  const filters = useFilters(useShallow(selectFilters));
  const setFilters = useFilters((s) => s.set);
  const toggleFilter = useFilters((s) => s.toggle);
  const clearFilters = useFilters((s) => s.clearFilters);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const results = useMemo(() => recs.data?.results ?? [], [recs.data]);
  const visible = useMemo(() => applyFilters(results, filters), [results, filters]);
  const facets = useMemo(() => facetsOf(results), [results]);
  const savedIds = useMemo(() => new Set(bookmarks.data?.exhibitorIds ?? []), [bookmarks.data]);
  const selected = results.find((r) => r.exhibitor.id === selectedId) ?? null;
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
        <View style={[styles.latency, { backgroundColor: colors.accentSoft }]} accessibilityLiveRegion="polite">
          <Text style={[styles.latencyText, { color: colors.accent }]}>Matching you against every stall…</Text>
        </View>
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
    ...filters.halls.map((h) => ({ key: `h-${h}`, label: `Hall ${h}`, clear: () => toggleFilter('halls', h) })),
    ...filters.industries.map((i) => ({ key: `i-${i}`, label: i, clear: () => toggleFilter('industries', i) })),
    ...filters.products.map((p) => ({ key: `p-${p}`, label: p, clear: () => toggleFilter('products', p) })),
  ];

  const header = (
    <View style={styles.header}>
      {mode === 'http' && !online ? <Banner text="Offline, showing saved results" /> : null}
      {recs.isError ? <Banner tone="error" text={`Couldn't refresh: ${describeError(recs.error)}`} /> : null}
      <View style={styles.badgeRow}>
        <View style={[styles.latency, styles.latencyInline, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.latencyText, { color: colors.accent }]} testID="latency-badge">
            {recs.isFetching ? 'Updating matches…' : `Top ${results.length} in ${Math.round(latencyMs)} ms`}
          </Text>
        </View>
        <Text style={[styles.count, { color: colors.textMuted }]} testID="result-count">
          Showing {visible.length} of {results.length}
        </Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={filters.search}
          onChangeText={(search) => setFilters({ search })}
          placeholder="Search stall or product"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Search by stall name or product"
          returnKeyType="search"
          clearButtonMode="while-editing"
          testID="search"
          style={[styles.search, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
        />
        <Pressable
          onPress={() => setFiltersOpen(true)}
          style={[styles.filterBtn, { backgroundColor: filterCount ? colors.accent : colors.surface, borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel={`Filters and sort${filterCount ? `, ${filterCount} active` : ''}`}
          testID="open-filters"
        >
          <Text style={[styles.filterText, { color: filterCount ? colors.onAccent : colors.text }]}>
            Filter{filterCount ? ` · ${filterCount}` : ''}
          </Text>
        </Pressable>
      </View>

      {activeChips.length > 0 ? (
        <View style={styles.activeRow}>
          {activeChips.map((c) => (
            <Chip key={c.key} label={`${c.label}  ✕`} selected onPress={c.clear} accessibilityLabel={`Remove filter ${c.label}`} />
          ))}
          <Chip label="Clear all" onPress={clearFilters} />
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
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
        ListHeaderComponent={header}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingBottom: spacing.xxl },
  header: { paddingTop: spacing.md, paddingBottom: spacing.sm },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  latency: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  latencyInline: { marginHorizontal: 0, marginVertical: 0 },
  latencyText: { fontSize: font.small, fontWeight: '700' },
  count: { fontSize: font.small },
  searchRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm },
  search: {
    flex: 1,
    minHeight: TOUCH + 4,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: font.body,
  },
  filterBtn: {
    minHeight: TOUCH + 4,
    minWidth: TOUCH + 32,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: { fontSize: font.body, fontWeight: '600' },
  activeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
});
