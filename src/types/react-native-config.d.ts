import 'react-native-config';

// Keys we read from .env. Keep in sync with .env.example.
declare module 'react-native-config' {
  export interface NativeConfig {
    API_URL?: string;
    USE_MOCK?: string;
  }
}
