import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { describeError } from '../api/client';
import { EMPTY_GUEST_INPUT } from '../api/mock/fixtures';
import { useMeta, useSaveGuest } from '../api/queries';
import { FREE_TEXT_MAX, type GuestInput } from '../api/schemas';
import { Button } from '../components/Button';
import { SkeletonList } from '../components/Skeleton';
import { Banner, StateView } from '../components/StateViews';
import { ChipSelect, TextField } from '../features/profile/FormFields';
import { validateGuestInput, type FieldErrors } from '../features/profile/formValidation';
import type { RootStackParamList } from '../navigation/types';
import { useSession } from '../store/sessionStore';
import { font, spacing, useTheme } from '../theme/theme';

function initialInput(): GuestInput {
  const guest = useSession.getState().guest;
  if (!guest) return EMPTY_GUEST_INPUT;
  const { id: _id, updatedAt: _u, ...input } = guest;
  return input;
}

export function DetailsFormScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Details'>>();
  const isEdit = !!params?.edit;

  const meta = useMeta();
  const save = useSaveGuest();
  const [form, setForm] = useState<GuestInput>(initialInput);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const submitting = useRef(false);

  const update = (patch: Partial<GuestInput>) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (submitted) {
      const res = validateGuestInput(next);
      setErrors(res.ok ? {} : res.errors);
    }
  };

  const toggleInterest = (tag: string) =>
    update({
      interests: form.interests.includes(tag)
        ? form.interests.filter((t) => t !== tag)
        : [...form.interests, tag],
    });

  const onSubmit = async () => {
    // Guards rapid double taps before the disabled state renders.
    if (submitting.current) return;
    setSubmitted(true);
    const res = validateGuestInput(form);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    setErrors({});
    submitting.current = true;
    try {
      await save.mutateAsync(res.data);
      // After an edit, land on the results so the re-ranking animation is visible.
      if (isEdit) navigation.navigate('Main', { screen: 'Recommendations' });
      else navigation.reset({ index: 1, routes: [{ name: 'Landing' }, { name: 'Main' }] });
    } catch {
      // Error is shown from save.error below.
    } finally {
      submitting.current = false;
    }
  };

  if (meta.isPending) {
    return (
      <View style={[styles.flex, styles.loading, { backgroundColor: colors.background }]}>
        <SkeletonList count={3} />
      </View>
    );
  }
  if (meta.isError) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <StateView
          tone="error"
          title="Couldn't load the form"
          message={describeError(meta.error)}
          action={{ label: 'Retry', onPress: () => meta.refetch() }}
        />
      </View>
    );
  }
  const m = meta.data;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {!isEdit ? (
          <View style={styles.samples}>
            <Text style={[styles.samplesTitle, { color: colors.text }]}>Try a sample profile</Text>
            {m.sampleProfiles.map((s) => (
              <Button
                key={s.id}
                label={s.label}
                variant="secondary"
                testID={`sample-${s.id}`}
                onPress={() => {
                  setForm(s.profile);
                  setErrors({});
                }}
              />
            ))}
          </View>
        ) : null}

        <TextField label="Name" value={form.name} onChangeText={(name) => update({ name })} error={errors.name} autoComplete="name" returnKeyType="next" maxLength={80} />
        <ChipSelect label="Industry" options={m.industries} value={form.industry} onChange={(industry) => update({ industry })} error={errors.industry} />
        <TextField label="Job role" value={form.jobRole} onChangeText={(jobRole) => update({ jobRole })} error={errors.jobRole} placeholder="e.g. Plant Manager" maxLength={80} />
        <ChipSelect label="Seniority" options={m.seniorities} value={form.seniority} onChange={(seniority) => update({ seniority })} error={errors.seniority} />
        <ChipSelect label="Company size (employees)" options={m.companySizes} value={form.companySize} onChange={(companySize) => update({ companySize })} error={errors.companySize} />
        <ChipSelect label="Region" options={m.regions} value={form.region} onChange={(region) => update({ region })} error={errors.region} />
        <ChipSelect label="Procurement interests" options={m.taxonomy} value={form.interests} onChange={toggleInterest} error={errors.interests} />
        <TextField
          label="What are you looking for?"
          value={form.freeText}
          onChangeText={(freeText) => update({ freeText })}
          error={errors.freeText}
          multiline
          maxLength={FREE_TEXT_MAX}
          counter={{ value: form.freeText.length, max: FREE_TEXT_MAX }}
          placeholder="Products, problems to solve, budgets, timelines…"
        />

        {save.isError ? <Banner tone="error" text={describeError(save.error)} /> : null}
        <Button
          label={isEdit ? 'Save and update matches' : 'Find my stalls'}
          onPress={onSubmit}
          loading={save.isPending}
          testID="submit-profile"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { paddingTop: spacing.lg },
  content: { padding: spacing.lg },
  samples: { gap: spacing.sm, marginBottom: spacing.xl },
  samplesTitle: { fontSize: font.body, fontWeight: '700' },
});
