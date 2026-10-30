# CLAUDE.md

Guidance for Claude Code in this repo.

## What this is

`mmipoc` is the **MMI visitor mobile app PoC** for Team 4's hackathon entry, *Trade Fair AI Matchmaker* (Appzoy AI Hackathon, demos 31 Oct 2026). A guest fills a short profile and gets their top 30 exhibitors with a match %, "Matched on" reasons and a two-way score breakdown, then bookmarks stalls, plans a route and exports a PDF.

Teammates build the backend API, the guest web app and the exhibitor portal separately. **This repo is only the mobile app.** It must run against their API *and* fully offline against the built-in mock.

It is a **bare React Native CLI project (no Expo)**: React Native 0.88.1, New Architecture, Hermes, TypeScript strict. Do not add `expo-*` packages.

Reference docs in `docs/`:
- `CLAUDE_CODE_PROMPT_MOBILE.md`: the full mobile spec (stack, screens, edge cases, tests, phases). Main requirements source.
- `final-flow.md`: the agreed team flow and demo script. The "Guest flow" section is the screen list and the demo script is the acceptance test.
- `Team 4 Challenge.pdf`: the challenge. Mobile covers stretch items 4 (MMI app integration) and 5 (real-time sync).
- `Appzoy … Evaluation Guidelines.pdf`: rubric and pre-flight checklist (fallbacks, pre-filled inputs, visible latency).
- `mobile-api-contract.md`: the API contract we gave the backend team. Keep it in sync with `src/api/schemas.ts`.

## Deviations from the spec

| Spec says | We use | Why |
| --- | --- | --- |
| `@gorhom/bottom-sheet` | `src/components/Sheet.tsx` on RN `Modal` | gorhom v5 targets gesture-handler v2; we're on v3. `Modal.onRequestClose` gives "Android back closes the sheet first" for free |
| Score range slider | min-score chips (Any / 50+ / 70+ / 85+) | no slider dependency |
| MSW for API tests | mocked `globalThis.fetch` in `src/api/__tests__/httpClient.test.ts` | lighter; switch to MSW if tests grow |
| Project name `TradeFairMatch` | `mmipoc` (Android package `com.mmipoc`) | the name the user chose |
| Live/Reconnecting/Offline socket indicator | "Offline" chip from NetInfo (`HeaderChips`) | Socket.io sync is deferred until the backend has it |

**Socket.io live sync is intentionally not built yet** (user decision: needs backend socket support first). `socket.io-client` is installed and the events are specified in `docs/mobile-api-contract.md`. When adding it: connect after the guest is known with `transports: ['websocket']`, join `guest:<id>`, write incoming data into the TanStack Query cache (`queryKeys`), pass `guest:updated` through `useSession.setGuest` (it already enforces last-write-wins), and refetch on reconnect.

## Commands

```bash
npm start                     # Metro bundler
npm run android               # build + install debug app on a device/emulator (needs Metro running)
npm run android:apk           # debug APK → android/app/build/outputs/apk/debug/app-debug.apk
npm run ios                   # macOS only: cd ios && bundle install && bundle exec pod install first
npm test                      # Jest (@react-native/jest-preset)
npm run typecheck             # tsc --noEmit
npm run lint                  # eslint
npm run e2e                   # Maestro flows in .maestro/ (device/emulator with the app installed)
npx react-native bundle --platform android --dev false --entry-file index.js \
  --bundle-output <tmp>/index.android.bundle    # quick "does the JS bundle" check
```

Before saying a phase is done: `npm run typecheck`, `npm test`, the Android JS bundle and `npm run android:apk` must all pass.

After adding a native library: rebuild Android (`npm run android:apk`), and on macOS run `pod install`. Metro reloads are not enough for native changes **or for `.env` changes** (react-native-config bakes `.env` in at build time).

## Native setup (already done, keep it working)

- **Reanimated 4**: `react-native-worklets/plugin` is the last Babel plugin in `babel.config.js`.
- **zod v4**: needs `@babel/plugin-transform-export-namespace-from` (Babel 7 line, `^7.x`; v8 needs Babel 8) in `babel.config.js`.
- **gesture-handler**: `GestureHandlerRootView` wraps the app in `src/App.tsx`.
- **react-native-screens**: `MainActivity.onCreate` passes `null` to `super.onCreate`.
- **react-native-config**: `android/app/build.gradle` applies `dotenv.gradle` and sets `resValue build_config_package`. Typed keys in `src/types/react-native-config.d.ts`. `.env` is git-ignored; `.env.example` is committed.
- **react-native-mmkv v4** needs `react-native-nitro-modules` (keep both installed).
- **Cleartext HTTP** (LAN API): debug-only `android/app/src/debug/res/xml/network_security_config.xml` + `android/app/src/debug/AndroidManifest.xml`. iOS `Info.plist` has `NSAllowsLocalNetworking`. Release builds stay HTTPS-only on Android.
- **Android emulator**: `src/config/env.ts` rewrites `localhost` to `10.0.2.2`.

## Architecture

```
index.js                    AppRegistry entry ("mmipoc", from app.json)
App.tsx                     re-exports src/App
src/
  App.tsx                   providers (gesture root, safe area, TanStack Query) + bootstrap gate
  config/env.ts             API_URL / USE_MOCK from react-native-config
  api/
    schemas.ts              zod schemas + types for the whole contract (single source of truth)
    client.ts               ApiClient interface, ApiError, describeError()
    httpClient.ts           fetch + 10 s timeout + abort + zod validation + error envelope
    mock/fixtures.ts        60 exhibitors (halls A–F), taxonomy, meta, 3 sample profiles
    mock/scorer.ts          deterministic two-way scorer (token + tag overlap, geometric mean)
    mock/mockClient.ts      ApiClient over fixtures, 150–400 ms delay, MMKV persistence
    index.ts                getClient(mode): one client per mode
    queries.ts              TanStack Query hooks + QueryClient defaults (1 retry w/ backoff),
                            offline cache seeding, bookmark toggle (double-tap guard + offline queue),
                            rank snapshot on edit, useSyncOnReconnect
  net/online.ts             NetInfo → onlineManager, AppState → focusManager, useIsOnline()
  storage/storage.ts        MMKV JSON helpers (sync + async) + key names
  store/
    sessionStore.ts         zustand: mode (mock/http) + why, current guest (last-write-wins), bootstrap, mode switch
    filtersStore.ts         zustand: filters, sort, search
    rankChangesStore.ts     ranks before the last edit, shown as ↑/↓ badges for 5 s
  features/results/         filtering.ts (pure), ResultCard, RankChangeBadge, FilterSheet, StallDetailSheet
  features/visit/           route.ts (hall → natural booth order), pdfHtml.ts (escaped), exportPdf.ts, SavedStallRow (swipe)
  features/bookmarks/       queue.ts: offline bookmark queue (persisted, last op per stall wins)
  features/profile/         form fields, zod-based form validation, conflict.ts (updatedAt rule)
  components/               Button, Chip, ScoreRing (svg), ScoreBar, Sheet, Skeleton, StateViews, ModeChip, HeaderChips
  navigation/               RootNavigator (stack: Landing → Details → Main tabs), typed params
  screens/                  Landing, DetailsForm, Results, VisitList, Profile
  theme/theme.ts            light/dark palettes, spacing, radius, font, TOUCH (44)
  types/                    ambient typings (react-native-config keys)
android/, ios/              native projects (committed, edited by hand when a library needs it)
```

Key rules:

- **One `ApiClient` interface, two implementations.** Screens never know which one they use. Add every new endpoint to `client.ts`, `httpClient.ts`, `mockClient.ts`, `schemas.ts` and `docs/mobile-api-contract.md` together.
- **Validate every response with zod** in the client layer. Never trust server data in components.
- **Mode selection** happens in `useSession.bootstrap()`: persisted override → `USE_MOCK` → `/api/health` (3 s) → fallback to mock. The "Demo data" chip (`ModeChip`) must be visible whenever mode is `mock`. A guest belongs to one mode, so switching mode re-creates the guest in the new source. The Profile screen has the no-rebuild mode toggle for the demo.
- Query keys include the mode (`['recommendations', mode, guestId]`) so mock and live data never mix.
- Pure logic (filtering, sorting, scoring, natural booth sort) lives in plain `.ts` files with unit tests. Keep components thin.
- Server-provided text (names, descriptions, free text) is rendered as plain `<Text>`. Escape it when building PDF HTML.

## Conventions

- TypeScript strict. No `any`; use zod-inferred types from `schemas.ts`.
- Styles: `StyleSheet.create` at the bottom of the file, colours from `useTheme()`, spacing/radius/font tokens from `theme.ts`. No hard-coded colours in components.
- Touch targets ≥ 44 pt (`TOUCH`). Every pressable gets `accessibilityRole` and `accessibilityLabel`.
- Don't define components inside render functions (they remount each render); hoist them.
- zustand v5: selectors that build objects must use `useShallow`.
- Tests: `__tests__/` next to the code; `src/__tests__/guestFlow.test.tsx` drives the whole app on demo data. React Native Testing Library v14: `render` and `fireEvent` are async, so `await` them. Native modules are mocked in `jest.setup.ts` (MMKV as a Map, react-native-config, NetInfo, gesture-handler, `ReanimatedSwipeable`, safe-area, html-to-pdf, share); add a mock there for each new native library.
- Reanimated is mocked by hand in `jest/mocks/reanimated.js`. Reanimated 4's own mock and `setUpTests()` crash under the RN CLI Jest preset. If you use a new Reanimated API, add it there.
- Use `testID`s for anything Maestro (`.maestro/`) or integration tests need to find. Keep visible strings in the flows in sync with the UI.
- Requirement coverage is tracked in `docs/requirements-checklist.md`; update it when behaviour changes.

## Build status (phases from the spec)

1. **Setup**: done. RN CLI project, native libs linked (Android debug APK builds), theme, navigation, API client + zod schemas, mock layer, contract doc, tests. iOS project is generated but pods have not been installed (needs macOS).
2. **Guest flow**: done. Landing, details form (sample profiles, validation, 1000-char counter), results (latency badge, search, filter/sort sheet, active filter chips, pull to refresh, skeletons, empty/error states), stall detail sheet with score breakdown, bookmark toggle.
3. **Visit list**: done. Swipe to remove, "Plan my route" (hall → natural booth order; details from `getRoute`, falling back to current results), PDF via `react-native-html-to-pdf` + `react-native-share` with escaped HTML, disabled buttons + hint when empty.
4. **Live**: done except Socket.io. Edit profile → animated re-rank (`LinearTransition`) with ↑/↓/New badges for 5 s, cached results offline with banner, offline bookmark queue replayed on reconnect, resync on foreground, `updatedAt` last-write-wins, "Offline" chip. **Socket.io sync deferred** (see Deviations).
5. **Hardening**: done. Spec §6 edge cases (see `docs/requirements-checklist.md`), 84 Jest tests including a full guest-flow integration test, 6 Maestro flows in `.maestro/`. Not yet run on a physical device: the PDF share sheet and Maestro flows need on-device verification.
