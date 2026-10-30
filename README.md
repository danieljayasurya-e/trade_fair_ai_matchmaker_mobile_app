# mmipoc: Trade Fair AI Matchmaker (mobile)

The MMI visitor mobile app PoC for Team 4. A guest fills a short profile (or taps a sample profile) and gets their top 30 exhibitors with a match %, "Matched on" reasons and a score breakdown. Bare React Native CLI 0.88 (New Architecture), TypeScript.

It works against the team backend or fully offline on built-in demo data.

## Prerequisites

- Node 22.11+
- JDK 17 and Android Studio (Android SDK + platform tools), with `ANDROID_HOME` set
- For iOS: a Mac with Xcode, Ruby/Bundler and CocoaPods

```bash
npm install
cp .env.example .env          # Windows: copy .env.example .env
```

## Run on an Android phone (USB)

1. On the phone: Settings → About phone → tap **Build number** 7 times, then Developer options → enable **USB debugging**.
2. Plug in the phone and accept the "Allow USB debugging" prompt. Check it shows up: `adb devices`.
3. In one terminal: `npm start` (Metro).
4. In another: `npm run android` (same as `npx react-native run-android`).

If the app shows "Unable to load script", run `adb reverse tcp:8081 tcp:8081` and reload.

## Build a debug APK for the demo phone

```bash
npm run android:apk           # same as: cd android && gradlew assembleDebug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

A debug APK still loads JS from Metro. For a phone that must run **without the laptop**, bundle the JS into the APK first:

```bash
npx react-native bundle --platform android --dev false --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res
npm run android:apk
```

(Create `android/app/src/main/assets/` if it doesn't exist. Delete the bundle afterwards so dev builds go back to Metro.)

## Run on iOS (macOS only)

```bash
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios                   # simulator
```

For a physical iPhone, open `ios/mmipoc.xcworkspace` in Xcode, pick your team under **Signing & Capabilities**, select the device and press Run.

## Point the app at a teammate's laptop API

1. Laptop and phone must be on the **same Wi-Fi**. The API must listen on `0.0.0.0`, not `127.0.0.1`.
2. Find the laptop's IP (`ipconfig` on Windows, `ipconfig getifaddr en0` on macOS).
3. In `.env`:
   ```
   API_URL=http://192.168.1.20:4000
   USE_MOCK=false
   ```
4. **Rebuild**: `npm run android`. `.env` is baked in at build time, so a Metro reload is not enough.

On the Android emulator, `http://localhost:4000` works as-is (the app rewrites it to `10.0.2.2`). Plain HTTP is allowed in debug builds only.

If `/api/health` doesn't answer within 3 s at startup, the app falls back to demo data and shows a **Demo data** chip in the header.

## Toggle demo (mock) mode

- **At build time:** `USE_MOCK=true` in `.env`, then rebuild.
- **During the demo, no rebuild:** Profile tab → **Data source** → *Demo data* / *Live API*. The choice is remembered on the device.

Demo data is 60 synthetic exhibitors in halls A–F with a deterministic local scorer, so results change when the profile changes. It needs no network.

## Tests

```bash
npm test                      # Jest + React Native Testing Library (unit, component, full guest-flow integration)
npm run typecheck
npm run lint
npm run e2e                   # Maestro flows in .maestro/ against a connected device/emulator
```

End-to-end flows need [Maestro](https://maestro.dev) installed and the app already installed on the device (`npm run android`). They cover: sample profile → results, filter and clear, stall detail sheet, bookmark → route → PDF, edit profile → re-rank, and airplane mode → cached results.

## Offline behaviour

- Last results are saved on the phone. With no network they still show, with an **Offline** chip in the header and, on the live API, an "Offline, showing saved results" banner.
- Bookmarks changed offline are queued on the phone and sent when the network returns. Then everything resyncs.
- Coming back to the app from the background refreshes stale data.
- Demo data needs no network at all.

## Demo script (mobile part)

From `docs/final-flow.md`. Before going on stage: install the APK with the JS bundled in, charge the phone, and pick the data source on the Profile tab.

1. Open the app → **Find my stalls** → tap **Factory owner, automation buyer** → **Find my stalls**. The top 30 appear with the "Top 30 in N ms" badge.
2. Tap **Filter** → Hall A → **Show**. Open the #1 stall and walk through the score bars and "Matched on" chips. Press back to close the sheet.
3. Bookmark three stalls (☆) → **Visit list** tab → **Plan my route** (grouped by hall, ordered by booth) → **Download PDF** → share or save it.
4. Profile → **Edit my details** → change interests → **Save and update matches**. Cards glide to their new ranks with ↑/↓ badges.

Live sync with the web app and exhibitor portal (Socket.io) is not built yet; it needs the backend socket events in `docs/mobile-api-contract.md`. Changes made on the web show on the phone after pull to refresh or reopening the app.

More project detail for contributors and coding agents: [CLAUDE.md](CLAUDE.md). API contract for the backend team: [docs/mobile-api-contract.md](docs/mobile-api-contract.md).

Team-wide project docs (goals, architecture, setup checklist, contributing, glossary): [docs/PROJECT_GOALS.md](docs/PROJECT_GOALS.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/SETUP.md](docs/SETUP.md), [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md), [docs/GLOSSARY.md](docs/GLOSSARY.md). Requirement coverage for the mobile app: [docs/requirements-checklist.md](docs/requirements-checklist.md).
