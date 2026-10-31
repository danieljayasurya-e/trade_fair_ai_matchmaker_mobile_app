import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { describeError } from '../api/client';
import { queryKeys, useRecommendations } from '../api/queries';
import { Button } from '../components/Button';
import { CheckIcon } from '../components/icons';
import { SkeletonList } from '../components/Skeleton';
import { StateView } from '../components/StateViews';
import { formatSeconds, useMatchTiming } from '../store/matchTimingStore';
import { useSession } from '../store/sessionStore';
import { font, radius, spacing, TOUCH, useTheme } from '../theme/theme';

const STEPS = ['Reading profile', 'Comparing with every exhibitor', 'Ranking your top 30'];
/** The first two steps are paced by the clock; the last one lasts until the answer arrives. */
const STEP_ENDS_MS = [200, 650];
const BAR_FULL_MS = 840;

function Step({ label, state }: { label: string; state: 'done' | 'current' | 'pending' }) {
  const { colors } = useTheme();
  return (
    <View style={styles.step} accessible accessibilityLabel={`${label}, ${state}`}>
      {state === 'done' ? (
        <View style={[styles.stepDot, { backgroundColor: colors.success }]}>
          <CheckIcon color={colors.onAccent} />
        </View>
      ) : (
        <View style={[styles.stepDot, styles.stepRing, { borderColor: state === 'current' ? colors.accent : colors.border }]} />
      )}
      <Text
        style={[
          styles.stepText,
          { color: state === 'pending' ? colors.textMuted : colors.text },
          state === 'current' && styles.stepCurrent,
        ]}
      >
        {label}
        {state === 'current' ? '…' : ''}
      </Text>
    </View>
  );
}

export function MatchingScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const qc = useQueryClient();
  const recs = useRecommendations();
  const mode = useSession((s) => s.mode);
  const switchMode = useSession((s) => s.switchMode);
  const guest = useSession((s) => s.guest);
  const roundTripMs = useMatchTiming((s) => s.ms);

  const done = !recs.isFetching && !!recs.data && !recs.isError;
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (done || recs.isError) return;
    const timer = setInterval(() => setElapsed(Date.now() - startedAt.current), 40);
    return () => clearInterval(timer);
  }, [done, recs.isError]);

  const replay = useCallback(() => {
    startedAt.current = Date.now();
    setElapsed(0);
    void recs.refetch();
  }, [recs]);

  const cancel = () => {
    if (guest) void qc.cancelQueries({ queryKey: queryKeys.recommendations(mode, guest.id) });
    navigation.goBack();
  };

  const viewResults = () => navigation.reset({ index: 1, routes: [{ name: 'Landing' }, { name: 'Main' }] });

  if (recs.isError && !recs.isFetching) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <StateView
          tone="error"
          title="Couldn't load your matches"
          message={describeError(recs.error)}
          action={{ label: 'Retry', onPress: replay }}
          secondaryAction={
            mode === 'http' ? { label: 'Use demo data instead', onPress: () => void switchMode('mock') } : { label: 'Back', onPress: () => navigation.goBack() }
          }
        />
      </View>
    );
  }

  const timerMs = done ? (roundTripMs ?? elapsed) : elapsed;
  const stepIndex = done ? STEPS.length : STEP_ENDS_MS.filter((end) => elapsed >= end).length;
  const barPct = done ? 100 : Math.min(95, (elapsed / BAR_FULL_MS) * 100);
  const firstName = (guest?.name ?? 'your').split(/\s+/)[0];
  const count = recs.data?.results.length ?? 0;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]} accessibilityState={{ busy: !done }}>
      <SkeletonList count={6} />
      <View
        style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}
        accessibilityLiveRegion="polite"
      >
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            Matching {firstName}'s profile
          </Text>
          <Text style={[styles.timer, { color: colors.accent }]} testID="match-timer">
            {formatSeconds(timerMs)}
          </Text>
        </View>
        <View style={[styles.bar, { backgroundColor: colors.border }]}>
          <View style={[styles.barFill, { width: `${barPct}%`, backgroundColor: colors.accent }]} />
        </View>
        <View style={styles.steps}>
          {STEPS.map((label, i) => (
            <Step key={label} label={label} state={i < stepIndex ? 'done' : i === stepIndex ? 'current' : 'pending'} />
          ))}
        </View>
        {done ? (
          <View style={styles.doneBlock}>
            <Text style={[styles.summary, { color: colors.textMuted }]}>
              {count} {count === 1 ? 'match' : 'matches'} found in{' '}
              <Text style={[styles.summaryTime, { color: colors.text }]}>{formatSeconds(timerMs)}</Text>
              {mode === 'mock' ? ' using demo data.' : ' using the local model.'}
            </Text>
            <Button label={`View your top ${count}`} onPress={viewResults} testID="view-results" />
            <Button label="Replay" variant="secondary" onPress={replay} testID="replay-match" />
          </View>
        ) : (
          <Pressable onPress={cancel} style={styles.cancel} accessibilityRole="button" accessibilityLabel="Cancel matching" testID="cancel-match">
            <Text style={[styles.cancelText, { color: colors.accent }]}>Cancel</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    position: 'absolute',
    top: 56,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg + 4,
    elevation: 12,
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
  },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.md },
  title: { flex: 1, fontSize: font.title, lineHeight: 28, fontWeight: '600' },
  timer: { fontSize: font.title, fontWeight: '700', fontVariant: ['tabular-nums'] },
  bar: { height: 6, borderRadius: radius.pill, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.pill },
  steps: { gap: spacing.md + 2 },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepDot: { width: 26, height: 26, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  stepRing: { borderWidth: 3 },
  stepText: { flex: 1, fontSize: font.label },
  stepCurrent: { fontWeight: '600' },
  doneBlock: { gap: spacing.md },
  summary: { fontSize: font.small, lineHeight: 20 },
  summaryTime: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  cancel: { alignSelf: 'flex-start', minHeight: TOUCH, justifyContent: 'center' },
  cancelText: { fontSize: font.label, fontWeight: '500' },
});
