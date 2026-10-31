import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer, type Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { BookmarkIcon, MapIcon, TargetIcon, UserIcon } from '../components/icons';
import { DetailsFormScreen } from '../screens/DetailsFormScreen';
import { LandingScreen } from '../screens/LandingScreen';
import { MapScreen } from '../screens/MapScreen';
import { MatchingScreen } from '../screens/MatchingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { VisitListScreen } from '../screens/VisitListScreen';
import { font, useTheme } from '../theme/theme';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const tabHeader = () => <AppHeader />;
const stackHeaderWithBack = () => <AppHeader back />;
const stackHeader = () => <AppHeader />;

function MatchesIcon({ color }: { color: string }) {
  return <TargetIcon color={color} />;
}
function VisitIcon({ color }: { color: string }) {
  return <BookmarkIcon color={color} size={22} />;
}
function FloorIcon({ color }: { color: string }) {
  return <MapIcon color={color} />;
}
function ProfileIcon({ color }: { color: string }) {
  return <UserIcon color={color} />;
}

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tabs.Navigator
      screenOptions={{
        header: tabHeader,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="Recommendations" component={ResultsScreen} options={{ tabBarLabel: 'Matches', tabBarIcon: MatchesIcon }} />
      <Tabs.Screen name="VisitList" component={VisitListScreen} options={{ tabBarLabel: 'Visit list', tabBarIcon: VisitIcon }} />
      <Tabs.Screen name="Map" component={MapScreen} options={{ tabBarLabel: 'Map', tabBarIcon: FloorIcon }} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile', tabBarIcon: ProfileIcon }} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { dark, colors } = useTheme();
  const navTheme = useMemo<NavTheme>(() => {
    const base = dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accent,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [dark, colors]);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Details" component={DetailsFormScreen} options={{ header: stackHeaderWithBack }} />
        <Stack.Screen name="Matching" component={MatchingScreen} options={{ header: stackHeader, gestureEnabled: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabLabel: { fontSize: font.caption, fontWeight: '600' },
});
