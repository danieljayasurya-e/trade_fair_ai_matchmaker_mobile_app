import { useNavigation } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { ModeChip } from '../components/ModeChip';
import { useSession } from '../store/sessionStore';
import { font, radius, spacing, useTheme } from '../theme/theme';

const POINTS = [
  { title: 'Matched both ways', body: 'A stall ranks high only if it sells what you need and you are the buyer it wants.' },
  { title: 'Explained, not guessed', body: 'Every match shows what it matched on and a score breakdown.' },
  { title: 'Plan your day', body: 'Bookmark stalls, get a walking route by hall and take it with you as a PDF.' },
];

export function LandingScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const guest = useSession((s) => s.guest);
  const clearGuest = useSession((s) => s.clearGuest);

  const goToResults = () => navigation.reset({ index: 1, routes: [{ name: 'Landing' }, { name: 'Main' }] });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.brand, { color: colors.accent }]}>MMI Matchmaker</Text>
          <ModeChip />
        </View>

        <Text style={[styles.hero, { color: colors.text }]} accessibilityRole="header">
          200 stalls.{'\n'}Find your 30 in 2 seconds.
        </Text>

        <View style={styles.points}>
          {POINTS.map((p) => (
            <View key={p.title} style={[styles.point, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.pointTitle, { color: colors.text }]}>{p.title}</Text>
              <Text style={[styles.pointBody, { color: colors.textMuted }]}>{p.body}</Text>
            </View>
          ))}
        </View>

        {guest ? (
          <>
            <Button label={`Continue as ${guest.name}`} onPress={goToResults} testID="continue" />
            <Button
              label="Not you? Start over"
              variant="ghost"
              onPress={async () => {
                await clearGuest();
                navigation.navigate('Details');
              }}
            />
          </>
        ) : (
          <Button label="Find my stalls" onPress={() => navigation.navigate('Details')} testID="find-my-stalls" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: font.small, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  hero: { fontSize: font.hero, fontWeight: '800', lineHeight: 40 },
  points: { gap: spacing.md, marginVertical: spacing.md },
  point: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  pointTitle: { fontSize: font.body, fontWeight: '700', marginBottom: spacing.xs },
  pointBody: { fontSize: font.small, lineHeight: 20 },
});
