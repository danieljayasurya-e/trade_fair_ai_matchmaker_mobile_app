module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // zod v4 ships `export * as ns from` syntax.
    '@babel/plugin-transform-export-namespace-from',
    // Reanimated 4 worklets. Must stay last.
    'react-native-worklets/plugin',
  ],
};
