import { Platform } from 'react-native';
import Config from 'react-native-config';

// react-native-config reads .env at native build time.
// After changing .env, rebuild the app (npm run android); a Metro reload is not enough.
const rawApiUrl = Config.API_URL ?? 'http://localhost:4000';
const rawUseMock = Config.USE_MOCK ?? 'true';

// The Android emulator reaches the host machine at 10.0.2.2, not localhost.
function resolveApiUrl(url: string): string {
  if (Platform.OS === 'android' && /\/\/(localhost|127\.0\.0\.1)/.test(url)) {
    return url.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
  }
  return url;
}

export const env = {
  apiUrl: resolveApiUrl(rawApiUrl.replace(/\/+$/, '')),
  useMock: rawUseMock.toLowerCase() === 'true',
  requestTimeoutMs: 10_000,
  healthTimeoutMs: 3_000,
} as const;
