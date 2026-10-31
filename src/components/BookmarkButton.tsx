import { Pressable, StyleSheet } from 'react-native';
import { radius, TOUCH, useTheme } from '../theme/theme';
import { BookmarkIcon } from './icons';

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
      style={[
        styles.btn,
        { backgroundColor: saved ? colors.accentSoft : colors.surface, borderColor: saved ? colors.accent : colors.border },
      ]}
      accessibilityRole="button"
      accessibilityLabel={saved ? `Remove ${name} from visit list` : `Save ${name} to visit list`}
      accessibilityState={{ selected: saved, disabled: !!disabled }}
    >
      <BookmarkIcon color={saved ? colors.onAccentSoft : colors.text} filled={saved} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: TOUCH, height: TOUCH, borderWidth: 1, borderRadius: radius.btn, alignItems: 'center', justifyContent: 'center' },
});
