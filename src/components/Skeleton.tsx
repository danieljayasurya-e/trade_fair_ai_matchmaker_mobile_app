import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { radius, spacing, useTheme } from '../theme/theme';

function Block({ width, height }: { width: DimensionValue; height: number }) {
  const { colors } = useTheme();
  return <View style={{ width, height, borderRadius: radius.sm, backgroundColor: colors.skeleton }} />;
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
      <View style={styles.row}>
        <View style={styles.grow}>
          <Block width="70%" height={18} />
          <View style={styles.gap} />
          <Block width="40%" height={14} />
        </View>
        <View style={[styles.ring, { backgroundColor: colors.skeleton }]} />
      </View>
      <View style={styles.gap} />
      <Block width="90%" height={14} />
      <View style={styles.gap} />
      <Block width="60%" height={14} />
    </Animated.View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View accessibilityLabel="Loading recommendations" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1 },
  gap: { height: spacing.sm },
  ring: { width: 56, height: 56, borderRadius: 28 },
});
