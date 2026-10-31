import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { CheckIcon, ChevronIcon } from '../../components/icons';
import { Sheet } from '../../components/Sheet';
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
            borderColor: error ? colors.danger : colors.outline,
          },
        ]}
      />
    </FieldShell>
  );
}

interface SelectFieldProps {
  label: string;
  options: string[];
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

/** Stands in for a native dropdown: the choices open in a bottom sheet. */
export function SelectField({ label, options, value, error, onChange }: SelectFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <FieldShell label={label} error={error}>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.input, styles.select, { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.outline }]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'not selected'}`}
        testID={`select-${label}`}
      >
        <Text style={[styles.selectText, { color: value ? colors.text : colors.textMuted }]} numberOfLines={1}>
          {value || 'Select…'}
        </Text>
        <ChevronIcon direction="down" color={colors.textMuted} />
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title={label} fit>
        {options.map((o) => {
          const selected = o === value;
          return (
            <Pressable
              key={o}
              onPress={() => {
                onChange(o);
                setOpen(false);
              }}
              style={[styles.option, { borderBottomColor: colors.border }]}
              accessibilityRole="radio"
              accessibilityLabel={o}
              accessibilityState={{ checked: selected }}
            >
              <Text style={[styles.optionText, { color: colors.text }, selected && styles.optionSelected]}>{o}</Text>
              {selected ? <CheckIcon color={colors.accent} size={18} /> : null}
            </Pressable>
          );
        })}
      </Sheet>
    </FieldShell>
  );
}

interface OptionGridProps {
  label: string;
  options: string[];
  error?: string;
  value: string | string[];
  onChange: (value: string) => void;
  hint?: string;
}

/** Tappable options. Single select when `value` is a string, multi select when it is an array. */
export function OptionGrid({ label, options, error, value, onChange, hint }: OptionGridProps) {
  const { colors } = useTheme();
  const multi = Array.isArray(value);
  const isSelected = (o: string) => (Array.isArray(value) ? value.includes(o) : value === o);
  return (
    <FieldShell label={label} error={error}>
      <View style={styles.options}>
        {options.map((o) => {
          const selected = isSelected(o);
          return (
            <Pressable
              key={o}
              onPress={() => onChange(o)}
              style={[
                styles.gridOption,
                selected
                  ? [styles.gridSelected, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]
                  : [styles.gridPlain, { backgroundColor: colors.surface, borderColor: colors.outline }],
              ]}
              accessibilityRole={multi ? 'checkbox' : 'radio'}
              accessibilityLabel={`${label}: ${o}`}
              accessibilityState={{ checked: selected }}
            >
              <Text style={[styles.gridText, { color: selected ? colors.onAccentSoft : colors.text }]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
      {hint ? <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text> : null}
    </FieldShell>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs + 2 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontSize: font.small, fontWeight: '600', flexShrink: 1 },
  counter: { fontSize: font.meta, fontVariant: ['tabular-nums'] },
  input: {
    minHeight: TOUCH,
    borderWidth: 1,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: font.label,
  },
  multiline: { minHeight: 120, lineHeight: 22, textAlignVertical: 'top' },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  selectText: { flex: 1, fontSize: font.label },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: TOUCH + 4,
    borderBottomWidth: 1,
  },
  optionText: { flex: 1, fontSize: font.label },
  optionSelected: { fontWeight: '600' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridOption: { minHeight: TOUCH, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.btn, justifyContent: 'center' },
  gridSelected: { borderWidth: 2 },
  gridPlain: { borderWidth: 1 },
  gridText: { fontSize: font.small, fontWeight: '500' },
  hint: { fontSize: font.meta, marginTop: spacing.xs },
  error: { fontSize: font.small },
});
