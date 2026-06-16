'use strict';

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/__tests__/**/*.test.[jt]s?(x)'],
  transformIgnorePatterns: [
    // Transform expo packages, react-native, and local workspace packages.
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo(?!nent)|@expo(?!nent)|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|@homevault))',
    '/node_modules/react-native-reanimated/plugin/',
  ],
  // Force all test code to use the root copy of React so it matches the copy
  // used by react-reconciler and @testing-library/react-native.
  moduleNameMapper: {
    '^react$': '<rootDir>/../../node_modules/react',
    '^react/(.*)$': '<rootDir>/../../node_modules/react/$1',
    '^react-dom$': '<rootDir>/../../node_modules/react-dom',
    '^react-dom/(.*)$': '<rootDir>/../../node_modules/react-dom/$1',
  },
};
