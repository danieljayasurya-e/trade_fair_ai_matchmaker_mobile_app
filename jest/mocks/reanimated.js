// Minimal Reanimated stand-in for Jest. Reanimated 4's own mock loads its native
// initializer under the RN CLI preset and crashes, so we mock only what the app uses.
const React = require('react');
const RN = require('react-native');

/** Layout-animation builder: every chained call (springify, damping, duration…) returns itself. */
function builder() {
  const self = new Proxy(function () {}, {
    get: (_t, prop) => (prop === 'build' ? () => ({}) : () => self),
  });
  return self;
}

const Animated = {
  View: RN.View,
  Text: RN.Text,
  Image: RN.Image,
  ScrollView: RN.ScrollView,
  FlatList: RN.FlatList,
  createAnimatedComponent: (C) => C,
};

module.exports = {
  __esModule: true,
  default: Animated,
  ...Animated,
  useSharedValue: (v) => React.useRef({ value: v }).current,
  useAnimatedStyle: (fn) => fn(),
  useDerivedValue: (fn) => ({ value: fn() }),
  withTiming: (v) => v,
  withSpring: (v) => v,
  withRepeat: (v) => v,
  withDelay: (_d, v) => v,
  interpolate: (_v, _i, out) => out[0],
  runOnJS: (fn) => fn,
  Easing: new Proxy({}, { get: () => () => (t) => t }),
  FadeIn: builder(),
  FadeOut: builder(),
  LinearTransition: builder(),
  Layout: builder(),
};
