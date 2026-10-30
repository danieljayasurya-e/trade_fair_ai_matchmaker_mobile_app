import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Chip } from '../../components/Chip';
import { font, radius, spacing, TOUCH, useTheme } from '../../theme/theme';

function FieldShell({ label, error, children, trailing }: { label: string; error?: string; children: ReactNode; trailing?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {trailing}
      </View>
      {children}
      {error ? (
        <Text style={[styles.error, { color: colors.danger }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  counter?: { value: number; max: number };
}

export function TextField({ label, error, counter, multiline, ...rest }: TextFieldProps) {
  const { colors } = useTheme();
  return (
    <FieldShell
      label={label}
      error={error}
      trailing={
        counter ? (
          <Text
            style={[styles.counter, { color: counter.value >= counter.max ? colors.danger : colors.textMuted }]}
            accessibilityLabel={`${counter.value} of ${counter.max} characters`}
          >
            {counter.value}/{counter.max}
          </Text>
        ) : null
      }
    >
      <TextInput
        {...rest}
        multiline={multiline}
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
          },
        ]}
      />
    </FieldShell>
  );
}

interface ChipSelectProps {
  label: string;
  options: string[];
  error?: string;
  value: string | string[];
  onChange: (value: string) => void;
}

/** Single select when `value` is a string, multi select when it is an array. */
export function ChipSelect({ label, options, error, value, onChange }: ChipSelectProps) {
  const isSelected = (o: string) => (Array.isArray(value) ? value.includes(o) : value === o);
  return (
    <FieldShell label={label} error={error}>
      <View style={styles.chips} accessibilityLabel={label}>
        {options.map((o) => (
          <Chip key={o} label={o} selected={isSelected(o)} onPress={() => onChange(o)} accessibilityLabel={`${label}: ${o}`} />
        ))}
      </View>
    </FieldShell>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.xl },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.sm },
  label: { fontSize: font.body, fontWeight: '600' },
  counter: { fontSize: font.caption, fontVariant: ['tabular-nums'] },
  input: {
    minHeight: TOUCH + 4,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: font.body,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  error: { fontSize: font.small, marginTop: spacing.xs },
});
