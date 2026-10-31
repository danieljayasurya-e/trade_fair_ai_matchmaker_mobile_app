import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { font, radius, spacing, useTheme } from '../../theme/theme';
import { MAP_MAX_BOOTH, placePins } from './mapLayout';

export interface MapPin {
  key: string;
  row: string;
  booth: string;
  /** stop = numbered route stop; match = plain dot; focus = the one stall being looked at. */
  tone: 'stop' | 'match' | 'focus';
  label?: string;
  accessibilityLabel: string;
  onPress?: () => void;
}

interface Props {
  rows: string[];
  pins: MapPin[];
  width: number;
  /** Small, single-lane version for the stall detail. */
  compact?: boolean;
  testID?: string;
}

const GUTTER = 36;
const STOP_SIZE = 28;
const DOT_SIZE = 14;
const LANES = 3;

export function FloorMap({ rows, pins, width, compact, testID }: Props) {
  const { colors } = useTheme();
  const laneHeight = compact ? 22 : STOP_SIZE + spacing.xs;
  const laneCount = compact ? 1 : LANES;
  const rowHeight = laneHeight * laneCount + spacing.xs;
  const rowGap = compact ? spacing.xs : spacing.sm;
  const trackWidth = width - GUTTER - spacing.sm;
  const pinSize = compact ? 16 : STOP_SIZE;
  const inset = pinSize / 2;
  const usable = trackWidth - pinSize;

  const placed = useMemo(() => placePins(pins, rows, pinSize / usable, laneCount), [pins, rows, pinSize, usable, laneCount]);

  const centre = (rowIndex: number, x: number, lane: number) => ({
    cx: GUTTER + inset + x * usable,
    cy: rowIndex * (rowHeight + rowGap) + spacing.xs / 2 + laneHeight * (lane + 0.5),
  });

  const height = Math.max(0, rows.length * (rowHeight + rowGap) - rowGap);
  const routePoints = placed
    .filter((p) => p.item.tone === 'stop')
    .map((p) => {
      const { cx, cy } = centre(p.rowIndex, p.x, p.lane);
      return `${cx},${cy}`;
    })
    .join(' ');

  return (
    <View testID={testID}>
      <View style={{ width, height }}>
        {rows.map((row, i) => (
          <View key={row} style={[styles.row, { top: i * (rowHeight + rowGap), height: rowHeight }]}>
            <Text style={[styles.rowLabel, { color: colors.textMuted, width: GUTTER }]} accessibilityLabel={`Row ${row}`}>
              {row}
            </Text>
            <View style={[styles.track, { width: trackWidth, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} />
          </View>
        ))}

        {routePoints ? (
          <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Polyline points={routePoints} stroke={colors.accent} strokeWidth={2} strokeDasharray="5 4" fill="none" />
          </Svg>
        ) : null}

        {placed.map(({ item, rowIndex, x, lane }) => {
          const { cx, cy } = centre(rowIndex, x, lane);
          const size = compact ? 16 : item.tone === 'match' ? DOT_SIZE : STOP_SIZE;
          const isDot = item.tone === 'match';
          const pinStyle = {
            left: cx - size / 2,
            top: cy - size / 2,
            width: size,
            height: size,
            backgroundColor: isDot ? colors.tealSoft : colors.accent,
            borderColor: isDot ? colors.teal : colors.surface,
          };
          const face = item.label ? <Text style={[styles.pinText, { color: colors.onAccent }]} allowFontScaling={false}>{item.label}</Text> : null;
          if (!item.onPress) {
            return (
              <View key={item.key} style={[styles.pin, pinStyle]} accessible accessibilityLabel={item.accessibilityLabel}>
                {face}
              </View>
            );
          }
          return (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              hitSlop={(44 - size) / 2}
              style={[styles.pin, pinStyle]}
              accessibilityRole="button"
              accessibilityLabel={item.accessibilityLabel}
              testID={`map-pin-${item.key}`}
            >
              {face}
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.axis, { marginLeft: GUTTER, width: trackWidth }]}>
        <Text style={[styles.axisText, { color: colors.textMuted }]}>Booth 1</Text>
        <Text style={[styles.axisText, { color: colors.textMuted }]}>Booth {MAP_MAX_BOOTH}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { position: 'absolute', left: 0, flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontSize: font.meta, fontWeight: '700' },
  track: { height: '100%', borderWidth: 1, borderRadius: radius.xs },
  pin: { position: 'absolute', borderWidth: 2, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pinText: { fontSize: font.caption, fontWeight: '700' },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  axisText: { fontSize: font.caption },
});
