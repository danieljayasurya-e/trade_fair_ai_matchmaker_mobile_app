import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createQueryClient, useSyncOnReconnect } from './api/queries';
import { RootNavigator } from './navigation/RootNavigator';
import { installNetworkManagers } from './net/online';
import { useSession } from './store/sessionStore';
import { useTheme } from './theme/theme';

installNetworkManagers();

function SyncOnReconnect() {
  useSyncOnReconnect();
  return null;
}

export default function App() {
  const [queryClient] = useState(createQueryClient);
  const hydrated = useSession((s) => s.hydrated);
  const bootstrap = useSession((s) => s.bootstrap);
  const { colors, dark } = useTheme();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Root unmount = app teardown; drop cache GC timers so nothing outlives the app (and Jest exits).
  useEffect(() => () => queryClient.clear(), [queryClient]);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
          {hydrated ? (
            <>
              <SyncOnReconnect />
              <RootNavigator />
            </>
          ) : (
            <View style={[styles.flex, styles.center, { backgroundColor: colors.background }]}>
              <ActivityIndicator color={colors.accent} size="large" accessibilityLabel="Starting up" />
            </View>
          )}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
