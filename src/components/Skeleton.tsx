import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { radius, spacing, useTheme } from '../theme/theme';

function Block({ width, height }: { width: DimensionValue; height: number }) {
  const { colors } = useTheme();
  return <View style={{ width, height, borderRadius: radius.xs, backgroundColor: colors.skeleton }} />;
}

export function SkeletonCard() {
  const { colors } = useTheme();
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.45, { duration: 700 }), -1, true);
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.ring, { backgroundColor: colors.skeleton }]} />
      <View style={styles.grow}>
        <Block width="55%" height={14} />
        <Block width="80%" height={10} />
      </View>
    </Animated.View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list} accessibilityLabel="Loading recommendations" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, padding: spacing.lg },
  card: {
    height: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md + 2,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  grow: { flex: 1, gap: spacing.sm },
  ring: { width: 44, height: 44, borderRadius: radius.pill },
});
