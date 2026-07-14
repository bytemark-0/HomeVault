# HomeVault

A local-first Expo/React Native app for household continuity: the shared operating manual for your
home.

HomeVault helps a household keep the access details, key documents, devices, maintenance history,
and recovery steps someone trusted would need if the primary homeowner were away or unavailable.

## Requirements

- Node.js 18+
- npm 9+
- Expo CLI (`npx expo`)
- iOS Simulator or Android Emulator, or the Expo Go app on a physical device

## Getting started

```bash
npm install
```

## Running the app

```bash
# Start the Expo development server (opens a menu to choose platform)
npm run mobile

# Or run directly on a specific platform:
cd apps/mobile
npx expo start --ios
npx expo start --android
npx expo start --web
```

## Type checking

```bash
# Typecheck everything (packages + mobile app)
npm run typecheck

# Typecheck the mobile app only
cd apps/mobile && npx tsc --noEmit
```

## Tests

```bash
# Run package tests (export, restore, checklist)
npm test
```

## Generating the sample backup fixture

The docs/homevault-sample-backup.json fixture is used for manual restore testing and kept in sync by the test suite. To regenerate it manually:

```bash
npm run fixtures:backup
```

## Project structure

```
apps/
  mobile/          Expo React Native app
packages/
  database/        Repository interface + in-memory implementation
  domain/          Shared TypeScript types
  export/          Export package builder and validator
docs/
  homevault-development-task-list.md   Development progress tracker
  homevault-sample-backup.json         Sample backup for manual testing
tests/
  exportPackage.test.ts   Package-level tests
```

## Current branch

`codex/homevault-stabilization` — active development branch. Not yet pushed to remote.
