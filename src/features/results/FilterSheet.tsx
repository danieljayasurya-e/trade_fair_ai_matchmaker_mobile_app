import { StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Sheet } from '../../components/Sheet';
import { useFilters } from '../../store/filtersStore';
import { font, spacing, useTheme } from '../../theme/theme';
import { MIN_SCORE_OPTIONS, type SortBy } from './filtering';

const SORTS: { value: SortBy; label: string }[] = [
  { value: 'score', label: 'Best match' },
  { value: 'hall', label: 'Hall & booth' },
  { value: 'name', label: 'Name A–Z' },
];

function SectionTitle({ title, color }: { title: string; color: string }) {
  return (
    <Text style={[styles.section, { color }]} accessibilityRole="header">
      {title}
    </Text>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
  facets: { industries: string[]; halls: string[]; products: string[] };
  resultCount: number;
}

export function FilterSheet({ visible, onClose, facets, resultCount }: Props) {
  const { colors } = useTheme();
  const f = useFilters(
    useShallow((s) => ({
      minScore: s.minScore,
      industries: s.industries,
      halls: s.halls,
      products: s.products,
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
      title="Filter & sort"
      footer={
        <View style={styles.footer}>
          <Button label="Clear all" variant="ghost" onPress={f.clearFilters} style={styles.footerBtn} />
          <Button label={`Show ${resultCount}`} onPress={onClose} style={styles.footerBtn} />
        </View>
      }
    >
      <SectionTitle color={colors.text} title="Sort by" />
      <View style={styles.chips}>
        {SORTS.map((s) => (
          <Chip key={s.value} label={s.label} selected={f.sortBy === s.value} onPress={() => f.set({ sortBy: s.value })} />
        ))}
      </View>

      <SectionTitle color={colors.text} title="Minimum match" />
      <View style={styles.chips}>
        {MIN_SCORE_OPTIONS.map((v) => (
          <Chip
            key={v}
            label={v === 0 ? 'Any' : `${v}%+`}
            accessibilityLabel={v === 0 ? 'Any match score' : `At least ${v} percent`}
            selected={f.minScore === v}
            onPress={() => f.set({ minScore: v })}
          />
        ))}
      </View>

      <SectionTitle color={colors.text} title="Hall" />
      <View style={styles.chips}>
        {facets.halls.map((h) => (
          <Chip key={h} label={`Hall ${h}`} selected={f.halls.includes(h)} onPress={() => f.toggle('halls', h)} />
        ))}
      </View>

      <SectionTitle color={colors.text} title="Industry" />
      <View style={styles.chips}>
        {facets.industries.map((i) => (
          <Chip key={i} label={i} selected={f.industries.includes(i)} onPress={() => f.toggle('industries', i)} />
        ))}
      </View>

      <SectionTitle color={colors.text} title="Product category" />
      <View style={styles.chips}>
        {facets.products.map((p) => (
          <Chip key={p} label={p} selected={f.products.includes(p)} onPress={() => f.toggle('products', p)} />
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: font.body, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: { flexDirection: 'row', gap: spacing.sm },
  footerBtn: { flex: 1 },
});
