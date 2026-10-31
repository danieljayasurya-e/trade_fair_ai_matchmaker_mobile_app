import { useNavigation } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { Button } from '../components/Button';
import { LegalFooter } from '../components/LegalFooter';
import { useSession } from '../store/sessionStore';
import { font, radius, spacing, useTheme } from '../theme/theme';

const POINTS = [
  { title: 'Matched both ways', body: 'A stall ranks high only if it sells what you need and you are the buyer it wants.' },
  { title: 'Explained, not guessed', body: 'Every match shows what it matched on and a score breakdown.' },
  { title: 'Plan your day', body: 'Save stalls to a visit list, see your route on the map, then export it to take with you.' },
];

export function LandingScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const guest = useSession((s) => s.guest);
  const clearGuest = useSession((s) => s.clearGuest);

  const goToResults = () => navigation.reset({ index: 1, routes: [{ name: 'Landing' }, { name: 'Main' }] });

  return (
    <View style={[styles.safe, { backgroundColor: colors.background }]}>
      <AppHeader howItWorks />
      <ScrollView style={styles.safe} contentContainerStyle={styles.content}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.teal }]}>AI visitor matchmaking</Text>
          <Text style={[styles.hero, { color: colors.text }]} accessibilityRole="header">
            150 stalls.{'\n'}Find your 30 in 2 seconds.
          </Text>
          <Text style={[styles.lead, { color: colors.textMuted }]}>
            Tell us about your business and we rank every exhibitor by how well you fit each other.
          </Text>
        </View>

        <View style={styles.points}>
          {POINTS.map((p) => (
            <View key={p.title} style={[styles.point, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.pointTitle, { color: colors.text }]}>{p.title}</Text>
              <Text style={[styles.pointBody, { color: colors.textMuted }]}>{p.body}</Text>
            </View>
          ))}
        </View>

        {guest ? (
          <View style={styles.actions}>
            <Button label={`Continue as ${guest.name}`} onPress={goToResults} testID="continue" />
            <Button
              label="Not you? Start over"
              variant="ghost"
              onPress={async () => {
                await clearGuest();
                navigation.navigate('Details');
              }}
            />
          </View>
        ) : (
          <Button label="Find my stalls" onPress={() => navigation.navigate('Details')} testID="find-my-stalls" />
        )}
      </ScrollView>
      <LegalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: spacing.lg + 4, paddingVertical: spacing.xl, gap: spacing.xl, flexGrow: 1, justifyContent: 'center' },
  eyebrow: { fontSize: font.meta, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center', marginBottom: spacing.sm + 2 },
  hero: { fontSize: font.hero, fontWeight: '700', lineHeight: 38, letterSpacing: -0.6, textAlign: 'center', marginBottom: spacing.md },
  lead: { fontSize: font.body, lineHeight: 24, textAlign: 'center' },
  points: { gap: spacing.md },
  point: { borderWidth: 1, borderRadius: radius.md, paddingVertical: spacing.lg, paddingHorizontal: spacing.lg + 2 },
  pointTitle: { fontSize: font.body, lineHeight: 22, fontWeight: '600', marginBottom: spacing.xs },
  pointBody: { fontSize: font.small, lineHeight: 20 },
  actions: { gap: spacing.sm },
});
