import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { scoreBand, useTheme } from '../theme/theme';

interface Props {
  score: number;
  size?: number;
  /** Adds the % sign; the small ring on cards shows the bare number. */
  percent?: boolean;
}

export function ScoreRing({ score, size = 44, percent }: Props) {
  const { colors } = useTheme();
  const stroke = size >= 64 ? 8 : 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityLabel={`${pct} percent match`}
      accessibilityRole="image"
    >
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={scoreBand(pct, colors).color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.center}>
          <Text style={[styles.value, { color: colors.text, fontSize: size * 0.3 }]} allowFontScaling={false}>
            {pct}
            {percent ? '%' : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  value: { fontWeight: '700' },
});
