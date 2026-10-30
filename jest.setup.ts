// MMKV's own Jest mock still loads Nitro's native module, so replace it with a Map.
jest.mock('react-native-mmkv', () => ({
  createMMKV: () => {
    const store = new Map<string, string | number | boolean>();
    return {
      set: (k: string, v: string | number | boolean) => store.set(k, v),
      getString: (k: string) => {
        const v = store.get(k);
        return typeof v === 'string' ? v : undefined;
      },
      remove: (k: string) => store.delete(k),
      clearAll: () => store.clear(),
    };
  },
}));

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: { API_URL: 'http://localhost:4000', USE_MOCK: 'true' },
  Config: { API_URL: 'http://localhost:4000', USE_MOCK: 'true' },
}));

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

jest.mock('react-native-reanimated', () => require('./jest/mocks/reanimated'));

// Swipe gestures aren't exercised in Jest; render the row and its actions statically.
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, renderRightActions, testID }: { children: unknown; renderRightActions?: () => unknown; testID?: string }) =>
      require('react').createElement(View, { testID }, children, renderRightActions?.()),
  };
});

require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('react-native-html-to-pdf', () => ({
  generatePDF: jest.fn(async () => ({ filePath: '/tmp/visit-list.pdf', numberOfPages: 1 })),
}));

jest.mock('react-native-share', () => ({
  __esModule: true,
  default: { open: jest.fn(async () => ({ success: true, message: '' })) },
}));
