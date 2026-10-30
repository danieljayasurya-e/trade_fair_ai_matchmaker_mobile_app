import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, SectionList, StyleSheet, Text, View } from 'react-native';
import { useBookmarks, useRecommendations, useToggleBookmark, useVisitRoute } from '../api/queries';
import type { Recommendation } from '../api/schemas';
import { Button } from '../components/Button';
import { Banner, StateView } from '../components/StateViews';
import { exportVisitPdf } from '../features/visit/exportPdf';
import { planRoute, savedStallsFrom } from '../features/visit/route';
import { SavedStallRow } from '../features/visit/SavedStallRow';
import { useSession } from '../store/sessionStore';
import { font, spacing, useTheme } from '../theme/theme';

export function VisitListScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const guestName = useSession((s) => s.guest?.name ?? 'Guest');
  const recs = useRecommendations();
  const bookmarks = useBookmarks();
  const routeQuery = useVisitRoute();
  const { toggle } = useToggleBookmark();

  const [showRoute, setShowRoute] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Bookmarks are the source of truth for *which* stalls; details come from the route
  // response (covers stalls outside the current top 30) or, offline, from the results.
  const saved = useMemo(() => {
    const ids = new Set(bookmarks.data?.exhibitorIds ?? []);
    const fromRoute = routeQuery.data?.halls.flatMap((h) => h.stalls) ?? [];
    return savedStallsFrom(ids, fromRoute, recs.data?.results ?? []);
  }, [bookmarks.data, routeQuery.data, recs.data]);
  const route = useMemo(() => planRoute(saved), [saved]);

  const onRemove = useCallback((item: Recommendation) => toggle(item.exhibitor.id, false), [toggle]);
  const hasStalls = saved.length > 0;

  const onExport = async () => {
    if (exporting || !hasStalls) return;
    setExporting(true);
    setExportError(null);
    try {
      await exportVisitPdf(guestName, route);
    } catch {
      setExportError("Couldn't create the PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.actions}>
        <Button
          label={showRoute ? 'Show by match' : 'Plan my route'}
          variant="secondary"
          disabled={!hasStalls}
          onPress={() => setShowRoute((v) => !v)}
          style={styles.flex}
          testID="plan-route"
        />
        <Button
          label="Download PDF"
          variant="secondary"
          disabled={!hasStalls}
          loading={exporting}
          onPress={onExport}
          style={styles.flex}
          testID="download-pdf"
        />
      </View>
      {!hasStalls ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>Save at least one stall to plan a route or download a PDF.</Text>
      ) : (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {saved.length} {saved.length === 1 ? 'stall' : 'stalls'} · swipe left to remove
        </Text>
      )}
      {exportError ? <Banner tone="error" text={exportError} /> : null}
    </View>
  );

  const empty = (
    <StateView
      title="Your visit list is empty"
      message="Tap ☆ on a stall to save it here."
      action={{ label: 'Browse matches', onPress: () => navigation.navigate('Main', { screen: 'Recommendations' }) }}
    />
  );

  if (showRoute && hasStalls) {
    let stop = 0;
    const sections = route.halls.map((h) => ({
      title: h.hall,
      data: h.stalls.map((s) => ({ item: s, stop: ++stop })),
    }));
    return (
      <SectionList
        style={{ backgroundColor: colors.background }}
        sections={sections}
        keyExtractor={(r) => r.item.exhibitor.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.section, { color: colors.accent }]} accessibilityRole="header">
            Hall {section.title} · {section.data.length} {section.data.length === 1 ? 'stop' : 'stops'}
          </Text>
        )}
        renderItem={({ item }) => <SavedStallRow item={item.item} stop={item.stop} onRemove={onRemove} />}
      />
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={saved}
      keyExtractor={(r) => r.exhibitor.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      renderItem={({ item }) => <SavedStallRow item={item} onRemove={onRemove} />}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg, flexGrow: 1 },
  header: { marginBottom: spacing.md, gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  hint: { fontSize: font.small },
  section: { fontSize: font.body, fontWeight: '800', marginTop: spacing.md, marginBottom: spacing.sm },
});
