import { Pressable, StyleSheet, Text } from 'react-native';
import { TOUCH, font, useTheme } from '../theme/theme';

interface Props {
  saved: boolean;
  onToggle: () => void;
  name: string;
  disabled?: boolean;
}

export function BookmarkButton({ saved, onToggle, name, disabled }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      hitSlop={6}
      style={styles.btn}
      accessibilityRole="button"
      accessibilityLabel={saved ? `Remove ${name} from visit list` : `Save ${name} to visit list`}
      accessibilityState={{ selected: saved, disabled: !!disabled }}
    >
      <Text style={[styles.icon, { color: saved ? colors.accent : colors.textMuted }]}>{saved ? '★' : '☆'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: font.heading },
});
