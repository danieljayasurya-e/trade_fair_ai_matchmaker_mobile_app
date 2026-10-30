# Prompt for Claude Code (VS Code): Mobile App Only (Bare React Native)

**Before you paste this:** create an empty project folder, make a `docs/` folder inside it, and put these three files there:

- `docs/Team 4 Challenge.pdf`
- `docs/Appzoy AI Software Hackathon - Team Rosters Evaluation Guidelines.pdf`
- `docs/final-flow.md` (our team plan)

Then open the folder in VS Code, start Claude Code, and paste everything below the line.

---

You are building the **mobile app** as a **bare React Native CLI project (no Expo)** for our hackathon entry, **Trade Fair AI Matchmaker**. It is the "MMI visitor mobile app" PoC from the challenge. Teammates are building the backend API, the web app and the exhibitor portal separately. Your job is **only the mobile app**, and it must work against their API and against a built-in mock API until theirs is ready.

## 0. Read the references first

Read these before writing any code:

1. `docs/Team 4 Challenge.pdf`: requirements. Focus on the guest experience (core challenge) and stretch items 4 and 5: "MMI Mobile App Integration" and "Real-Time Synchronisation".
2. `docs/Appzoy AI Software Hackathon - Team Rosters Evaluation Guidelines.pdf`: rubric, demo format, pre-flight checklist (fallbacks, pre-populated inputs, latency indicators).
3. `docs/final-flow.md`: our agreed flow. Use the "Guest flow (web and mobile)" section as the screen list and the demo script as the acceptance test.

After reading, reply with:

- a short summary of what the mobile app must do
- the screen list and navigation structure
- the folder structure

Then **wait for my "go"** before building.

## 1. Stack and rules

- **Bare React Native CLI project, no Expo.** Create it with `npx @react-native-community/cli init TradeFairMatch --version latest` (TypeScript, New Architecture on). Do not use any `expo-*` package.
- **TypeScript** in `strict` mode.
- **Navigation:** React Navigation (`@react-navigation/native`, `native-stack`, `bottom-tabs`) with `react-native-screens` and `react-native-gesture-handler`.
- **State and data:** TanStack Query for server data; Zustand for local UI state (filters, bookmarks cache).
- **Validation:** zod for every API response and form.
- **UI:** a small custom theme (or NativeWind); `react-native-reanimated` for animations; `react-native-safe-area-context`; `@gorhom/bottom-sheet` for the stall detail sheet; `react-native-svg` for the match % ring and score bars.
- **Real-time:** `socket.io-client` with `transports: ['websocket']` (polling is unreliable on RN).
- **Storage:** `react-native-mmkv` for the offline cache, bookmarks queue and current guest id.
- **Config:** `react-native-config` with `.env` for `API_URL` and `USE_MOCK`. Commit `.env.example`, not `.env`.
- **PDF:** `react-native-html-to-pdf` to generate the PDF, `react-native-share` to share or save it.
- **Network status:** `@react-native-community/netinfo`.
- **Native setup:** after adding native libraries, run `cd ios && pod install`. Configure Reanimated's Babel plugin, gesture-handler's root view, and any Android Gradle changes each library needs. Verify a clean build on both platforms after every native dependency is added.
- **Local HTTP to a teammate's laptop:** allow cleartext HTTP in debug only. On Android, add a debug `network_security_config.xml`. On iOS, add an ATS exception for local networking in the debug Info.plist. Without this, LAN API calls fail silently.
- **Android emulator:** `localhost` on the emulator is `10.0.2.2`. Handle this in config docs.
- Build in the phases below. At the end of each phase, run the app and all tests, fix failures, and give me a short status before moving on.

## 2. API contract (the backend team builds to this)

Put all request and response types and zod schemas in `src/api/schemas.ts`. Read the base URL from `API_URL` in `.env` (via `react-native-config`) so it works from a phone on the same Wi-Fi (e.g. `http://192.168.1.20:4000`).

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/health` | `{ ok, db, model }` |
| GET | `/api/meta` | `{ industries[], seniorities[], companySizes[], regions[], halls[], taxonomy[], sampleProfiles[] }` |
| POST | `/api/guests` | the created `Guest` |
| PUT | `/api/guests/:id` | the updated `Guest` (with `updatedAt`) |
| GET | `/api/guests/:id/recommendations` | `{ results: Recommendation[], latencyMs, total }` |
| GET / POST / DELETE | `/api/guests/:id/bookmarks` | `{ exhibitorIds: string[] }` |
| GET | `/api/guests/:id/route` | `{ halls: { hall, stalls: Recommendation[] }[] }` |

Shapes:

- `Recommendation = { rank, exhibitor: { id, name, description, products[], industries[], hall, booth }, score (0–100 int), matchedOn: string[], factors: { semantic, interest, intent, buyerFit, g2e, e2g } (0–1), reason }`
- Errors: `{ error: { code, message, details? } }`

Socket.io events (join room `guest:<id>` on connect):

- `recommendations:updated` → `{ guestId, results, latencyMs }`
- `bookmark:changed` → `{ guestId, exhibitorIds }`
- `guest:updated` → `{ guest }`

Also write `docs/mobile-api-contract.md` with this contract so I can share it with the backend team.

## 3. Mock mode (build without the backend)

When `USE_MOCK=true` in `.env` or the API health check fails at startup, use a mock layer that implements the **same client interface**:

- Fixtures: ~60 exhibitors across halls A–F with realistic products and taxonomy tags, plus the 3 sample profiles: "Factory owner, automation buyer", "Procurement head, packaging", "Startup CTO, IoT sensors".
- A simple local scorer (tag overlap + keyword match, deterministic) so results change when the profile changes, with a simulated 150–400 ms delay and a real `latencyMs`.
- Bookmarks stored in MMKV.
- A visible "Demo data" chip in the header while mock mode is on, so we never confuse it with the real engine.

Switching between mock and real must need no code change, only the `.env` flag and a rebuild (or a hidden dev toggle on the Profile screen for the demo, so we can switch without rebuilding).

## 4. Screens

**Design direction:** clean, modern, professional trade-fair feel. One accent colour, generous spacing, large touch targets (minimum 44 pt), readable on a 360 dp Android phone and a large iPhone. Support light and dark mode. Use skeleton loaders while data loads. Accessible: `accessibilityLabel` on every control, screen-reader friendly cards, dynamic font scaling that doesn't break layouts.

1. **Landing:** hero line ("200 stalls. Find your 30 in 2 seconds."), three short value points, a "Find my stalls" button. If a guest already exists on the device, show "Continue as <name>" instead.
2. **Details form:**
   - Fields: name, industry, job role, seniority, company size, region, procurement interests (multi-select chips from the taxonomy) and free text (max 1000 characters with a counter).
   - Three "Try a sample profile" buttons that fill the form instantly.
   - Inline validation. The keyboard never hides the active field (`KeyboardAvoidingView` / scroll into view). Submit is disabled while submitting.
3. **Results (top 30):**
   - Card list (FlashList or FlatList) with rank, exhibitor name, a match % ring, hall/booth, product chips, "Matched on" chips and a bookmark toggle.
   - A latency badge at the top ("Top 30 in 180 ms") and pull-to-refresh.
   - A filter button opens a bottom sheet: score range slider, industry, hall, product category; sort by score, hall or name. Show active filter chips with "Clear all".
   - A search bar for name or product.
4. **Stall detail (bottom sheet):** score breakdown bars for semantic, interest, intent, buyer fit, plus g2e and e2g; the reason line; products; description; hall and booth; bookmark button.
5. **My visit list (tab):**
   - Bookmarked stalls; swipe to remove.
   - "Plan my route" shows stalls grouped and ordered by hall, then booth.
   - "Download PDF" generates the visit list (guest name, date, ordered stalls with booth and reasons) and opens the share sheet.
6. **Edit my details:** pre-filled form. On save, the results list recomputes and cards animate to their new positions with Reanimated layout animations. Show "↑3" / "↓2" rank-change badges for 5 seconds.

Use bottom tabs: **Recommendations**, **Visit list**, **Profile**.

## 5. Real-time sync with the web app

- Connect Socket.io after the guest is known; join `guest:<id>`.
- When the same guest bookmarks or edits on the web app, the mobile app updates within about a second, without a manual refresh.
- Show a small connection indicator: Live / Reconnecting / Offline.
- On reconnect or when the app returns to the foreground, refetch recommendations and bookmarks to resync.
- Conflicts: last write wins by `updatedAt`. The app never overwrites newer server data with older local data.

## 6. Edge cases you must handle and test

### Input

- Required fields missing → inline errors; never send an invalid request.
- Free text that is empty, whitespace-only, at the 1000-character limit, emoji, Hindi or other scripts, or HTML-like text → stored and shown as plain text, no crash.
- Rapid double-tap on submit or bookmark → only one request (debounce or disable while pending).

### Data

- Fewer than 30 results → "Showing 12 of 12".
- Scores outside 0–100, NaN or missing fields in the response → zod rejects; show an error state, never crash.
- Long exhibitor names or many chips → truncate cleanly; nothing overflows the card.
- Empty `matchedOn` → show "General match" instead of an empty row.
- Filters that match nothing → an empty state with "Clear filters".

### Network and lifecycle

- No internet at launch → show cached last results with an "Offline, showing saved results" banner; bookmarks made offline are queued and synced when back online.
- API error or timeout (10 s) → error state with Retry; one automatic retry with backoff.
- Editing the profile while a request is in flight → cancel the stale request; only the latest result renders.
- App backgrounded and resumed → resync.
- Socket disconnect → indicator changes and the app reconnects automatically.
- Cleartext HTTP blocked (missing network config) → the app shows a clear "Can't reach server" error, not an endless spinner.
- Android hardware back button → closes the bottom sheet first, then navigates back. Never exits the app from the results screen by accident.

### Visit list and PDF

- Route or PDF with zero bookmarks → buttons disabled with a hint.
- Several stalls in the same hall → stable order by booth number (`B-2` before `B-10`; natural sort).
- PDF works with 1 stall and with 30 stalls. Exhibitor text is escaped in the PDF HTML.

## 7. Tests

Use **Jest** (the React Native preset, with mocks for Reanimated, gesture-handler, MMKV, NetInfo, react-native-config, html-to-pdf and share) + **React Native Testing Library** for unit and component tests, and **MSW** to mock the REST API in tests. Add **Maestro** flows for end-to-end runs on a device or emulator. `npm test` runs Jest; `npm run e2e` runs Maestro.

1. **Unit tests:**
   - zod schemas (valid and invalid responses)
   - filter, sort and search logic
   - route ordering with natural booth sort
   - mock scorer is deterministic and changes when the profile changes
   - offline bookmark queue
   - `updatedAt` conflict rule
   - PDF HTML builder escapes text
2. **API client tests (with MSW):** every endpoint's success path, 400 and 404 errors, timeout and retry, request cancellation.
3. **Component tests:**
   - form validation and sample-profile fill
   - result card renders score, booth and chips
   - filter sheet applies and clears
   - empty, loading, error and offline states
   - bookmark toggle is idempotent
4. **Socket tests:** a mocked server emitting `recommendations:updated` and `bookmark:changed` updates the UI; reconnect triggers a refetch.
5. **Maestro E2E flows:**
   - Landing → sample profile → 30 results with the latency badge
   - Filter and clear
   - Open the detail sheet
   - Bookmark 3 → plan route → generate PDF
   - Edit profile → ranks change
   - Airplane mode → offline banner with cached results

All tests must pass before you say a phase is done. Show me the final test summary.

## 8. Phases

1. **Setup:** React Native CLI project, native libraries linked and building on Android and iOS, theme, navigation, API client + zod schemas, mock layer, contract doc.
2. **Guest flow:** landing, form, results, filters, search, detail sheet.
3. **Visit list:** bookmarks, route, PDF.
4. **Live:** edit profile with animated re-ranking, Socket.io sync, offline cache and queue.
5. **Hardening:** every edge case in section 6, all tests in section 7, a demo-mode check.

## 9. Demo safety (from the pre-flight checklist)

- The app must run the full demo in mock mode with no network, as a fallback.
- Sample profiles are one tap away.
- Loading and latency are always visible.
- Write a `README.md` with:
  - how to run on a physical Android phone (USB debugging, `npx react-native run-android`) and on iOS (Xcode, signing)
  - how to build and install a debug APK for the demo phone
  - how to point the app at a teammate's laptop API on the same Wi-Fi
  - how to toggle mock mode
  - the demo script steps for the mobile part

## 10. Definition of done

- `npx react-native run-android` and `npx react-native run-ios` build and run cleanly, with no red-box errors or yellow-box warnings.
- A debug APK is built (`cd android && ./gradlew assembleDebug`) and installs on a real Android phone.
- Every guest-flow step in `docs/final-flow.md` works in both mock and real API modes.
- A bookmark or profile edit on the web app appears on the phone live, and the reverse.
- All tests pass.
- Give me a checklist mapping each relevant requirement from the challenge PDF to the screen or file that covers it.

Start with section 0 now.
