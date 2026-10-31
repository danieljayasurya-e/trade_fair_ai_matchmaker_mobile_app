import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { brand } from '../theme/theme';

interface IconProps {
  color: string;
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
}

function stroke({ color, strokeWidth = 1.75 }: IconProps) {
  return {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
}

export function FilterIcon(p: IconProps) {
  return (
    <Svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24">
      <Path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" {...stroke(p)} />
    </Svg>
  );
}

export function BookmarkIcon(p: IconProps) {
  return (
    <Svg width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 24 24">
      <Path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" {...stroke(p)} fill={p.filled ? p.color : 'none'} />
    </Svg>
  );
}

export function CloseIcon(p: IconProps) {
  return (
    <Svg width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 24 24">
      <Path d="M18 6 6 18" {...stroke({ strokeWidth: 2, ...p })} />
      <Path d="m6 6 12 12" {...stroke({ strokeWidth: 2, ...p })} />
    </Svg>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <Svg width={p.size ?? 15} height={p.size ?? 15} viewBox="0 0 24 24">
      <Path d="M20 6 9 17l-5-5" {...stroke({ strokeWidth: 3, ...p })} />
    </Svg>
  );
}

export function ChevronIcon({ direction, ...p }: IconProps & { direction: 'left' | 'right' | 'down' }) {
  const d = direction === 'left' ? 'm15 18-6-6 6-6' : direction === 'right' ? 'm9 18 6-6-6-6' : 'm6 9 6 6 6-6';
  return (
    <Svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24">
      <Path d={d} {...stroke({ strokeWidth: 2, ...p })} />
    </Svg>
  );
}

export function TargetIcon(p: IconProps) {
  return (
    <Svg width={p.size ?? 22} height={p.size ?? 22} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} {...stroke(p)} />
      <Circle cx={12} cy={12} r={5} {...stroke(p)} />
      <Circle cx={12} cy={12} r={1} {...stroke(p)} />
    </Svg>
  );
}

export function UserIcon(p: IconProps) {
  return (
    <Svg width={p.size ?? 22} height={p.size ?? 22} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={4} {...stroke(p)} />
      <Path d="M4 21a8 8 0 0 1 16 0" {...stroke(p)} />
    </Svg>
  );
}

export function MapIcon(p: IconProps) {
  return (
    <Svg width={p.size ?? 22} height={p.size ?? 22} viewBox="0 0 24 24">
      <Path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" {...stroke(p)} />
      <Path d="M9 3v15" {...stroke(p)} />
      <Path d="M15 6v15" {...stroke(p)} />
    </Svg>
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Rect width={36} height={36} rx={9} fill={brand.blue} />
      <Rect x={6} y={6} width={17} height={17} rx={3.5} fill={brand.white} />
      <Rect x={13} y={13} width={17} height={17} rx={3.5} fill={brand.mint} />
      <Path d="M13 16.5A3.5 3.5 0 0 1 16.5 13H23V19.5A3.5 3.5 0 0 1 19.5 23H13Z" fill={brand.teal} />
    </Svg>
  );
}
