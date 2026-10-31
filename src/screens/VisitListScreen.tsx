import { useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, SectionList, StyleSheet, Text, View } from 'react-native';
import { useMeta, useToggleBookmark } from '../api/queries';
import type { Recommendation } from '../api/schemas';
import { Button } from '../components/Button';
import { Banner, StateView } from '../components/StateViews';
import { HALL_NAME, rowLabel } from '../features/results/location';
import { exportVisitPdf } from '../features/visit/exportPdf';
import { SavedStallRow } from '../features/visit/SavedStallRow';
import { useSavedStalls } from '../features/visit/useSavedStalls';
import { useSession } from '../store/sessionStore';
import { font, spacing, useTheme } from '../theme/theme';

export function VisitListScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const guestName = useSession((s) => s.guest?.name ?? 'Guest');
  const { saved, route } = useSavedStalls();
  const meta = useMeta();
  const { toggle } = useToggleBookmark();

  const [showRoute, setShowRoute] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const onRemove = useCallback((item: Recommendation) => toggle(item.exhibitor.id, false), [toggle]);
  const hasStalls = saved.length > 0;

  const onExport = async () => {
    if (exporting || !hasStalls) return;
    setExporting(true);
    setExportError(null);
    try {
      await exportVisitPdf(guestName, route, meta.data?.halls);
    } catch {
      setExportError("Couldn't create the PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const header = (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
        Your visit list
      </Text>
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
      {hasStalls ? (
        <Button
          label="See route on the map"
          variant="ghost"
          onPress={() => navigation.navigate('Main', { screen: 'Map' })}
          testID="open-map"
        />
      ) : null}
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
      message="Tap the bookmark on a stall to save it here."
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
            {HALL_NAME}, {rowLabel(section.title)} · {section.data.length} {section.data.length === 1 ? 'stop' : 'stops'}
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
  header: { marginBottom: spacing.md, gap: spacing.sm + 2 },
  title: { fontSize: font.screen, lineHeight: 28, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  hint: { fontSize: font.meta },
  section: { fontSize: font.small, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
});
