module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['android/', 'ios/', 'coverage/'],
  rules: {
    // `const { id: _id, ...rest } = obj` is how we drop fields.
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
    ],
    // `void promise` marks intentionally un-awaited promises.
    'no-void': 'off',
    // React Navigation's tabBarIcon/headerRight are render callbacks, not nested components.
    'react/no-unstable-nested-components': ['warn', { allowAsProps: true }],
  },
};
