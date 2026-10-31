import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { CheckIcon, FilterIcon } from '../../components/icons';
import { Sheet } from '../../components/Sheet';
import { useFilters } from '../../store/filtersStore';
import { font, radius, spacing, TOUCH, useTheme } from '../../theme/theme';
import { MIN_SCORE_OPTIONS, type Facet, type SortBy } from './filtering';
import { rowLabel } from './location';

const SORTS: { value: SortBy; label: string }[] = [
  { value: 'score', label: 'Best match' },
  { value: 'hall', label: 'Booth' },
  { value: 'name', label: 'Name A–Z' },
];

function SectionTitle({ title, color }: { title: string; color: string }) {
  return (
    <Text style={[styles.section, { color }]} accessibilityRole="header">
      {title}
    </Text>
  );
}

function CheckRow({ label, count, checked, onPress }: { label: string; count: number; checked: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={styles.checkRow}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
    >
      <View style={[styles.box, { borderColor: checked ? colors.accent : colors.outline, backgroundColor: checked ? colors.accent : colors.surface }]}>
        {checked ? <CheckIcon color={colors.onAccent} size={14} /> : null}
      </View>
      <Text style={[styles.checkLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.count, { color: colors.textMuted }]}>{count}</Text>
    </Pressable>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
  facets: { industries: Facet[]; halls: Facet[]; categories: Facet[] };
  resultCount: number;
}

export function FilterSheet({ visible, onClose, facets, resultCount }: Props) {
  const { colors } = useTheme();
  const f = useFilters(
    useShallow((s) => ({
      minScore: s.minScore,
      industries: s.industries,
      halls: s.halls,
      categories: s.categories,
      savedOnly: s.savedOnly,
      sortBy: s.sortBy,
      set: s.set,
      toggle: s.toggle,
      clearFilters: s.clearFilters,
    })),
  );

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Filters"
      closeLabel="Close filters"
      heading={
        <View style={styles.heading}>
          <FilterIcon color={colors.text} />
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            Filters
          </Text>
        </View>
      }
      headerAction={
        <Pressable onPress={f.clearFilters} style={styles.clear} accessibilityRole="button" accessibilityLabel="Clear all filters">
          <Text style={[styles.clearText, { color: colors.accent }]}>Clear all</Text>
        </Pressable>
      }
      footer={<Button label={`Show ${resultCount} ${resultCount === 1 ? 'match' : 'matches'}`} onPress={onClose} testID="apply-filters" />}
    >
      <SectionTitle color={colors.text} title="Match score" />
      <View style={styles.chips}>
        {MIN_SCORE_OPTIONS.map((v) => (
          <Chip
            key={v}
            label={v === 0 ? 'All' : `${v}%+`}
            accessibilityLabel={v === 0 ? 'Any match score' : `At least ${v} percent`}
            selected={f.minScore === v}
            onPress={() => f.set({ minScore: v })}
          />
        ))}
      </View>

      <SectionTitle color={colors.text} title="Sort by" />
      <View style={styles.chips}>
        {SORTS.map((s) => (
          <Chip key={s.value} label={s.label} selected={f.sortBy === s.value} onPress={() => f.set({ sortBy: s.value })} />
        ))}
      </View>

      <SectionTitle color={colors.text} title="Booth row (Hall 1)" />
      {facets.halls.map((h) => (
        <CheckRow key={h.value} label={rowLabel(h.value)} count={h.count} checked={f.halls.includes(h.value)} onPress={() => f.toggle('halls', h.value)} />
      ))}

      <SectionTitle color={colors.text} title="Product category" />
      {facets.categories.map((c) => (
        <CheckRow key={c.value} label={c.value} count={c.count} checked={f.categories.includes(c.value)} onPress={() => f.toggle('categories', c.value)} />
      ))}

      <SectionTitle color={colors.text} title="Industry" />
      {facets.industries.map((i) => (
        <CheckRow key={i.value} label={i.value} count={i.count} checked={f.industries.includes(i.value)} onPress={() => f.toggle('industries', i.value)} />
      ))}

      <View style={[styles.switchRow, { backgroundColor: colors.surfaceAlt }]}>
        <Text style={[styles.switchLabel, { color: colors.text }]}>Saved stalls only</Text>
        <Switch
          value={f.savedOnly}
          onValueChange={(savedOnly) => f.set({ savedOnly })}
          accessibilityLabel="Saved stalls only"
          trackColor={{ true: colors.accent, false: colors.border }}
          thumbColor={colors.surface}
          testID="saved-only"
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  heading: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: font.section, fontWeight: '600' },
  clear: { minHeight: TOUCH, paddingHorizontal: spacing.sm, justifyContent: 'center' },
  clearText: { fontSize: font.small, fontWeight: '600' },
  section: { fontSize: font.small, fontWeight: '600', marginTop: spacing.xl, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: TOUCH },
  box: { width: 20, height: 20, borderWidth: 1, borderRadius: radius.xs - 2, alignItems: 'center', justifyContent: 'center' },
  checkLabel: { flex: 1, fontSize: font.label },
  count: { fontSize: font.meta, fontVariant: ['tabular-nums'] },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TOUCH + 8,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.btn,
    marginTop: spacing.xl,
  },
  switchLabel: { fontSize: font.label, fontWeight: '500' },
});
