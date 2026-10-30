# Mobile app: requirements checklist

How the mobile app covers the challenge (`Team 4 Challenge.pdf`), the team flow (`final-flow.md`) and the mobile spec (`CLAUDE_CODE_PROMPT_MOBILE.md`). Paths are relative to the repo root.

Status: ✅ done · 🟡 partly done · ⏳ waiting on backend.

## Challenge: core (as experienced on mobile)

| Requirement | Status | Where |
| --- | --- | --- |
| Ingest structured + unstructured guest profile (industry, job role, procurement interests, company size, free text) | ✅ | `src/screens/DetailsFormScreen.tsx`, `src/api/schemas.ts` (`guestInputSchema`) |
| Compatibility score, normalised (0–100) | ✅ | Engine is backend; app validates `score` as integer 0–100 (`recommendationSchema`). Offline mock: `src/api/mock/scorer.ts` |
| Top 30 with booth details and rationale | ✅ | `src/screens/ResultsScreen.tsx`, `src/features/results/ResultCard.tsx` |
| Guest selects a profile, views top 30, inspects scores, bookmarks | ✅ | Sample profiles on the form; `StallDetailSheet.tsx`; `useToggleBookmark` in `src/api/queries.ts` |
| Filter/sort by score, industry, hall/booth, product category | ✅ | `src/features/results/filtering.ts`, `FilterSheet.tsx`, search bar in `ResultsScreen.tsx` |
| Explainable insights ("Matched on: …") | ✅ | Matched-on chips on cards and in the sheet; "General match" when empty |
| Top 30 in under 2 s, latency visible | ✅ | "Top 30 in N ms" badge, skeleton loaders, "Matching you against every stall…" |
| Fairness: no hard-coded preferences or suppression | ✅ | App renders server order as-is; mock scorer uses profile fit only; "No paid boosts" note in the sheet and PDF |
| Demo: select profile → run engine → top 30 → filter → inspect → save/export visit list | ✅ | Maestro flows `01`–`04` in `.maestro/` |

## Challenge: stretch (mobile items)

| Requirement | Status | Where |
| --- | --- | --- |
| 4. Recommendation engine embedded in the MMI visitor mobile app as a working PoC | ✅ | This app (bare React Native CLI, Android + iOS projects) |
| 5. Sync bookmarking, stall visits and profile updates with the backend | 🟡 | REST sync works: bookmarks and profile go through the shared API, with an offline queue (`src/features/bookmarks/queue.ts`) and refetch on reconnect/foreground (`useSyncOnReconnect`, `src/net/online.ts`). **Live push (Socket.io) is not built**, waiting on backend support. Events are specified in `docs/mobile-api-contract.md`. |
| Clean API for plug-and-play integration | ✅ | `docs/mobile-api-contract.md`; one `ApiClient` interface (`src/api/client.ts`) |
| Real-time recalculation when guest preferences update | ✅ (in app) / ⏳ (cross-device) | Edit → recompute → animated re-rank with ↑/↓ badges. Pushing it to the web app and portal needs the socket events. |

## Team flow: guest flow steps (`final-flow.md`)

| Step | Status | Where |
| --- | --- | --- |
| 1. Landing with hook and "Find my stalls" | ✅ | `src/screens/LandingScreen.tsx` (plus "Continue as …") |
| 2. Details form + 2–3 sample profiles | ✅ | `DetailsFormScreen.tsx`, `SAMPLE_PROFILES` in `src/api/mock/fixtures.ts` |
| 3. Loading state | ✅ | `src/components/Skeleton.tsx`, loading banner |
| 4. Top 30 cards: name, match %, hall/booth, products, matched-on, latency badge | ✅ | `ResultCard.tsx`, `ScoreRing.tsx` |
| 5. Search and filter | ✅ | `FilterSheet.tsx`, `filtering.ts` |
| 6. Stall detail with score breakdown bars | ✅ | `StallDetailSheet.tsx`, `ScoreBar.tsx` (semantic, interest, intent, buyer fit, you→stall, stall→you) |
| 7. Bookmarks → My visit list | ✅ | `src/screens/VisitListScreen.tsx`, swipe to remove in `src/features/visit/SavedStallRow.tsx` |
| 8. Plan my route (hall, then booth) | ✅ | `src/features/visit/route.ts` (natural booth sort) |
| 9. Download PDF | ✅ | `src/features/visit/pdfHtml.ts` (escaped), `exportPdf.ts` (`react-native-html-to-pdf` + `react-native-share`) |
| 10. Edit details → list recomputes, cards animate | ✅ | `useSaveGuest`, `src/store/rankChangesStore.ts`, `RankChangeBadge.tsx`, Reanimated `LinearTransition` in `ResultsScreen.tsx` |

## Pre-flight checklist (evaluation guidelines)

| Item | Status | Where |
| --- | --- | --- |
| Fallbacks: cached/mock responses for network outages | ✅ | Mock mode (`USE_MOCK`, auto-fallback when `/api/health` fails, Profile-tab toggle); cached last results shown offline |
| Staging: pre-populated inputs | ✅ | Three one-tap sample profiles |
| Visibility | ✅ | Large type, 44 pt touch targets, dynamic type, light/dark |
| Clear indicators for latency and processing | ✅ | Latency badge, "Updating matches…", skeletons, "Offline" and "Demo data" chips |

## Spec §6 edge cases

| Case | Status | Where / test |
| --- | --- | --- |
| Missing required fields → inline errors, no request | ✅ | `formValidation.ts`; `guestFlow.test.tsx` "blocks submit" |
| Empty / whitespace / 1000 chars / emoji / Hindi / HTML-like free text | ✅ | `schemas.test.ts`, `scorer.test.ts`, `visit.test.ts` |
| Rapid double tap on submit or bookmark → one request | ✅ | Ref guard in the form; pending-set guard in `useToggleBookmark`; `guestFlow.test.tsx` |
| Fewer than 30 → "Showing 12 of 12" | ✅ | `ResultsScreen.tsx` count |
| Bad scores / NaN / missing fields → rejected, error state | ✅ | zod in `httpClient.ts`; `schemas.test.ts`, `httpClient.test.ts` |
| Long names / many chips | ✅ | `numberOfLines`, max 3 chips + "+N"; `ResultCard.test.tsx` |
| Empty matchedOn → "General match" | ✅ | `ResultCard.tsx`, `pdfHtml.ts` |
| Filters match nothing → empty state + "Clear filters" | ✅ | `guestFlow.test.tsx` |
| No internet at launch → cached results + banner; offline bookmarks queued | ✅ | `useRecommendations` initial data, offline banner, `queue.ts`; `queue.test.ts`; Maestro `06` |
| API error / 10 s timeout → error + Retry; one auto retry with backoff | ✅ | `httpClient.ts`, `createQueryClient`; `httpClient.test.ts`, `guestFlow.test.tsx` |
| Edit while request in flight → stale request cancelled | ✅ | TanStack Query abort signal passed to both clients; `httpClient.test.ts`, `mockClient.test.ts` |
| Backgrounded and resumed → resync | ✅ | `focusManager` + `AppState` in `src/net/online.ts` |
| Socket disconnect → indicator + auto reconnect | ⏳ | Waiting on socket backend. Network loss already shows the "Offline" chip. |
| Cleartext HTTP blocked → clear "Can't reach server" | ✅ | `describeError` for `NETWORK`; debug network security config allows LAN HTTP |
| Android back closes sheet first, never exits from results by accident | ✅ | `Sheet.tsx` (`onRequestClose`); Landing kept under Main in the stack; Maestro `03` |
| Route/PDF with zero bookmarks → disabled + hint | ✅ | `VisitListScreen.tsx`; `guestFlow.test.tsx` |
| Same hall → natural booth order (B-2 before B-10) | ✅ | `naturalSort.ts`, `route.ts`; `visit.test.ts`, `filtering.test.ts` |
| PDF with 1 and 30 stalls, escaped | ✅ | `visit.test.ts` |
| `updatedAt` last write wins | ✅ | `conflict.ts`, enforced in `sessionStore.setGuest`; `profile.test.ts` |
