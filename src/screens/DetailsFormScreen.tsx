import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { describeError, isApiError } from '../api/client';
import { EMPTY_GUEST_INPUT } from '../api/mock/fixtures';
import { useMeta, useSaveGuest } from '../api/queries';
import { FREE_TEXT_MAX, validationDetailsSchema, type GuestInput, type SampleProfile } from '../api/schemas';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { LegalFooter } from '../components/LegalFooter';
import { SkeletonList } from '../components/Skeleton';
import { Banner, StateView } from '../components/StateViews';
import { OptionGrid, SelectField, TextField } from '../features/profile/FormFields';
import { validateGuestInput, type FieldErrors } from '../features/profile/formValidation';
import { initials } from '../features/results/location';
import type { RootStackParamList } from '../navigation/types';
import { useSession } from '../store/sessionStore';
import { font, radius, spacing, useTheme } from '../theme/theme';

const SAMPLES_SHOWN = 3;

function initialInput(): GuestInput {
  const guest = useSession.getState().guest;
  if (!guest) return EMPTY_GUEST_INPUT;
  const { id: _id, updatedAt: _u, ...input } = guest;
  return input;
}

/** The server's per-field messages for a 400 VALIDATION_ERROR (contract §5). */
function serverFieldErrors(e: unknown): FieldErrors {
  if (!isApiError(e)) return {};
  const parsed = validationDetailsSchema.safeParse(e.details);
  if (!parsed.success) return {};
  return Object.fromEntries(parsed.data.fields.map((f) => [f.field, f.message]));
}

function SampleCard({ sample, filled, onUse }: { sample: SampleProfile; filled: boolean; onUse: () => void }) {
  const { colors } = useTheme();
  const { label, profile } = sample;
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sampleTop}>
        <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.avatarText, { color: colors.onAccentSoft }]}>{initials(profile.name)}</Text>
        </View>
        <View style={styles.flexShrink}>
          <Text style={[styles.sampleTitle, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.sampleWho, { color: colors.textMuted }]}>
            {profile.name} · {profile.jobRole}
          </Text>
        </View>
      </View>
      <Text style={[styles.sampleFacts, { color: colors.text }]}>
        <Text style={{ color: colors.textMuted }}>Industry </Text>
        <Text style={styles.sampleFact}>{profile.industry}</Text>
        {' · '}
        <Text style={{ color: colors.textMuted }}>Size </Text>
        <Text style={styles.sampleFact}>{profile.companySize}</Text>
      </Text>
      <View style={styles.tags}>
        {profile.interests.map((i) => (
          <Chip key={i} label={i} compact tone="accent" />
        ))}
      </View>
      <Button
        label={filled ? 'Filled in below' : 'Use this sample'}
        variant="secondary"
        onPress={onUse}
        testID={`sample-${sample.id}`}
      />
    </View>
  );
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
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [allSamples, setAllSamples] = useState(false);
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
      else navigation.navigate('Matching');
    } catch (e) {
      setErrors(serverFieldErrors(e));
    } finally {
      submitting.current = false;
    }
  };

  if (meta.isPending) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
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
  const samples = allSamples ? m.sampleProfiles : m.sampleProfiles.slice(0, SAMPLES_SHOWN);
  const filledSample = m.sampleProfiles.find((s) => s.id === sampleId);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingBottom: insets.bottom }}>
        <View style={styles.content}>
          <View>
            <Text style={[styles.heading, { color: colors.text }]} accessibilityRole="header">
              {isEdit ? 'Edit your details' : 'Tell us what you are looking for'}
            </Text>
            <Text style={[styles.lead, { color: colors.textMuted }]}>
              {isEdit ? 'Save and we’ll re-rank your matches.' : 'A few details are enough. We only use them to rank exhibitors.'}
            </Text>
          </View>

          {!isEdit ? (
            <View style={styles.samples}>
              <Text style={[styles.section, { color: colors.text }]} accessibilityRole="header">Try a sample profile</Text>
              {samples.map((s) => (
                <SampleCard
                  key={s.id}
                  sample={s}
                  filled={s.id === sampleId}
                  onUse={() => {
                    setForm(s.profile);
                    setErrors({});
                    setSampleId(s.id);
                  }}
                />
              ))}
              {!allSamples && m.sampleProfiles.length > SAMPLES_SHOWN ? (
                <Button label={`Show all ${m.sampleProfiles.length} samples`} variant="ghost" onPress={() => setAllSamples(true)} testID="show-all-samples" />
              ) : null}
            </View>
          ) : null}

          {filledSample ? (
            <Banner tone="info" text={`Filled in ${filledSample.profile.name}'s details. Review them, then choose Find my stalls.`} />
          ) : null}

          <View style={[styles.card, styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.section, { color: colors.text }]} accessibilityRole="header">About you</Text>
            <TextField label="Name" value={form.name} onChangeText={(name) => update({ name })} error={errors.name} autoComplete="name" returnKeyType="next" maxLength={80} />
            <TextField label="Job role" value={form.jobRole} onChangeText={(jobRole) => update({ jobRole })} error={errors.jobRole} placeholder="e.g. Plant Manager" maxLength={80} />
            <SelectField label="Industry" options={m.industries} value={form.industry} onChange={(industry) => update({ industry })} error={errors.industry} />
            <SelectField label="Seniority" options={m.seniorities} value={form.seniority} onChange={(seniority) => update({ seniority })} error={errors.seniority} />
            <OptionGrid label="Company size (employees)" options={m.companySizes} value={form.companySize} onChange={(companySize) => update({ companySize })} error={errors.companySize} />
            <SelectField label="Region" options={m.regions} value={form.region} onChange={(region) => update({ region })} error={errors.region} />
          </View>

          <View style={[styles.card, styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.section, { color: colors.text }]} accessibilityRole="header">What you're looking for</Text>
            <OptionGrid
              label="Procurement interests"
              options={m.taxonomy}
              value={form.interests}
              onChange={toggleInterest}
              error={errors.interests}
              hint={`${form.interests.length} selected`}
            />
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
          </View>

          {save.isError ? <Banner tone="error" text={describeError(save.error)} /> : null}
          <Button
            label={isEdit ? 'Save and update matches' : 'Find my stalls'}
            onPress={onSubmit}
            loading={save.isPending}
            testID="submit-profile"
          />
        </View>
        <LegalFooter />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg + 4, paddingBottom: spacing.xl, gap: spacing.lg + 4 },
  heading: { fontSize: font.heading, lineHeight: 32, fontWeight: '700', letterSpacing: -0.5, marginBottom: spacing.xs + 2 },
  lead: { fontSize: font.small, lineHeight: 20 },
  samples: { gap: spacing.md },
  section: { fontSize: font.section, lineHeight: 25, fontWeight: '600' },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md },
  formCard: { padding: spacing.lg + 4, gap: spacing.lg },
  sampleTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: font.label, fontWeight: '700' },
  sampleTitle: { fontSize: font.body, lineHeight: 22, fontWeight: '600' },
  sampleWho: { fontSize: font.meta, lineHeight: 19 },
  sampleFacts: { fontSize: font.small, lineHeight: 20 },
  sampleFact: { fontWeight: '500' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
});
