import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

let installed = false;

/**
 * Feeds NetInfo and AppState into TanStack Query: queries pause while offline and
 * refetch when the network returns or the app comes back to the foreground.
 *
 * Only `isConnected` is used. A demo laptop hotspot often has no internet, so
 * `isInternetReachable` would wrongly mark a working LAN API as offline.
 */
export function installNetworkManagers(): void {
  if (installed) return;
  installed = true;

  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
  );

  focusManager.setEventListener((handleFocus) => {
    const sub = AppState.addEventListener('change', (s) => handleFocus(s === 'active'));
    return () => sub.remove();
  });
}

export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
  );
}
