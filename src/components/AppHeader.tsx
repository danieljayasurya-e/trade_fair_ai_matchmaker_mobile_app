import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, spacing, TOUCH, useTheme } from '../theme/theme';
import { HeaderChips } from './HeaderChips';
import { ChevronIcon, Logo } from './icons';
import { Sheet } from './Sheet';

const HOW_IT_WORKS = [
  { title: 'Two-way score', body: 'We score how well a stall fits you and how well you fit its buyers. The match % is the geometric mean of both, so one strong side cannot carry a weak one.' },
  { title: 'What goes in', body: 'Your industry, interests and what you wrote, compared with each exhibitor’s product areas, products and the sectors they sell to.' },
  { title: 'What stays out', body: 'No exhibitor pays for placement. Rankings come only from how well profiles fit.' },
];

interface Props {
  /** Shows a back arrow, for stack screens. */
  back?: boolean;
  howItWorks?: boolean;
}

export function AppHeader({ back, howItWorks }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [howOpen, setHowOpen] = useState(false);

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top + spacing.md }]}>
      {back ? (
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Back"
          testID="header-back"
        >
          <ChevronIcon direction="left" color={colors.text} size={22} />
        </Pressable>
      ) : null}
      <Logo />
      <Text style={[styles.brand, { color: colors.text }]} numberOfLines={1} accessibilityRole="header">
        Matchmaker
      </Text>
      {howItWorks ? (
        <Pressable
          onPress={() => setHowOpen(true)}
          style={styles.how}
          accessibilityRole="button"
          accessibilityLabel="How it works"
          testID="how-it-works"
        >
          <Text style={[styles.howText, { color: colors.accent }]}>How it works</Text>
        </Pressable>
      ) : null}
      <HeaderChips />
      {howItWorks ? (
        <Sheet visible={howOpen} onClose={() => setHowOpen(false)} title="How it works" fit>
          {HOW_IT_WORKS.map((h) => (
            <View key={h.title} style={styles.howItem}>
              <Text style={[styles.howTitle, { color: colors.text }]}>{h.title}</Text>
              <Text style={[styles.howBody, { color: colors.textMuted }]}>{h.body}</Text>
            </View>
          ))}
        </Sheet>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  back: { width: TOUCH - 12, height: TOUCH - 12, alignItems: 'center', justifyContent: 'center' },
  brand: { flex: 1, fontSize: font.body, fontWeight: '700' },
  how: { minHeight: TOUCH - 12, justifyContent: 'center' },
  howText: { fontSize: font.small, fontWeight: '500' },
  howItem: { marginBottom: spacing.lg },
  howTitle: { fontSize: font.body, fontWeight: '600', marginBottom: spacing.xs },
  howBody: { fontSize: font.small, lineHeight: 20 },
});
