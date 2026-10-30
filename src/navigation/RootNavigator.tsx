import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer, type Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { HeaderChips } from '../components/HeaderChips';
import { DetailsFormScreen } from '../screens/DetailsFormScreen';
import { LandingScreen } from '../screens/LandingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { VisitListScreen } from '../screens/VisitListScreen';
import { useTheme } from '../theme/theme';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const tabIcon = (glyph: string) =>
  function TabIcon({ color }: { color: string }) {
    return <Text style={[styles.tabIcon, { color }]}>{glyph}</Text>;
  };

const styles = StyleSheet.create({
  tabIcon: { fontSize: 20 },
});

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerRight: () => <HeaderChips /> }}>
      <Tabs.Screen
        name="Recommendations"
        component={ResultsScreen}
        options={{ title: 'Your top matches', tabBarLabel: 'Recommendations', tabBarIcon: tabIcon('◎') }}
      />
      <Tabs.Screen
        name="VisitList"
        component={VisitListScreen}
        options={{ title: 'My visit list', tabBarLabel: 'Visit list', tabBarIcon: tabIcon('★') }}
      />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', tabBarIcon: tabIcon('☺') }} />
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
        <Stack.Screen
          name="Details"
          component={DetailsFormScreen}
          options={({ route }) => ({
            title: route.params?.edit ? 'Edit my details' : 'Tell us about you',
            headerRight: () => <HeaderChips />,
          })}
        />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
