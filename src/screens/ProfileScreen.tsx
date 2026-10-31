import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { describeError } from '../api/client';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Banner } from '../components/StateViews';
import { env } from '../config/env';
import { useSession, type ModeReason } from '../store/sessionStore';
import { font, radius, spacing, useTheme } from '../theme/theme';

const REASON_TEXT: Record<ModeReason, string> = {
  env: 'Set by USE_MOCK in .env',
  fallback: "The live API didn't answer at startup, so the app fell back to demo data",
  override: 'Chosen with the toggle below',
  healthy: 'Live API answered the health check',
  offline: 'No network at launch; showing your saved results from the live API',
};

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value || '—'}</Text>
    </View>
  );
}

export function ProfileScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const qc = useQueryClient();
  const { guest, mode, modeReason, switchMode, clearGuest } = useSession();
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const onSwitch = async (next: 'mock' | 'http') => {
    if (next === mode || switching) return;
    setSwitching(true);
    setSwitchError(null);
    try {
      await switchMode(next);
      qc.clear();
    } catch (e) {
      setSwitchError(describeError(e));
    } finally {
      setSwitching(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
        Your profile
      </Text>
      {guest ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.name, { color: colors.text }]}>{guest.name}</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>{guest.jobRole}</Text>
          <Row label="Industry" value={guest.industry} />
          <Row label="Seniority" value={guest.seniority} />
          <Row label="Company size" value={guest.companySize} />
          <Row label="Region" value={guest.region} />
          <View style={styles.chips}>
            {guest.interests.map((i) => (
              <Chip key={i} label={i} compact tone="accent" />
            ))}
          </View>
          {guest.freeText.trim() ? (
            <Text style={[styles.freeText, { color: colors.textMuted }]}>{guest.freeText}</Text>
          ) : null}
          <Button label="Edit my details" onPress={() => navigation.navigate('Details', { edit: true })} style={styles.gapTop} />
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.section, { color: colors.text }]}>Data source (demo control)</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>{REASON_TEXT[modeReason]}</Text>
        <View style={[styles.chips, styles.gapTop]}>
          <Chip label="Demo data" selected={mode === 'mock'} onPress={() => onSwitch('mock')} />
          <Chip label="Live API" selected={mode === 'http'} onPress={() => onSwitch('http')} />
        </View>
        <Text style={[styles.mono, { color: colors.textMuted }]}>API: {env.apiUrl}</Text>
        {switching ? <Text style={[styles.sub, { color: colors.textMuted }]}>Switching…</Text> : null}
        {switchError ? <Banner tone="error" text={switchError} /> : null}
      </View>

      <Button
        label="Start over"
        variant="ghost"
        onPress={async () => {
          await clearGuest();
          qc.clear();
          navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { fontSize: font.screen, lineHeight: 28, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.lg, gap: spacing.xs },
  name: { fontSize: font.section, fontWeight: '600' },
  sub: { fontSize: font.small, lineHeight: 20 },
  section: { fontSize: font.body, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, gap: spacing.md },
  rowLabel: { fontSize: font.small },
  rowValue: { fontSize: font.small, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  freeText: { fontSize: font.small, marginTop: spacing.sm, lineHeight: 20 },
  mono: { fontSize: font.caption, marginTop: spacing.sm, fontFamily: 'monospace' },
  gapTop: { marginTop: spacing.md },
});
