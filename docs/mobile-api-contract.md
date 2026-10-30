# Mobile API contract (Team 4 – Trade Fair AI Matchmaker)

This is the API the **mobile app** calls. The web app should use the same endpoints so bookmarks and profile edits sync. The source of truth for shapes is `src/api/schemas.ts` (zod); this page mirrors it.

The app validates every response. A response that doesn't match these shapes (e.g. a score of `87.5`, `NaN` or `120`, or a missing field) is rejected and the guest sees an error state, so please match the types exactly.

## Base URL and transport

- Base URL comes from `API_URL` in the app's `.env`, e.g. `http://192.168.1.20:4000`. The phone must reach it over the venue/laptop Wi-Fi.
- Plain HTTP on the LAN is fine. Bind the server to `0.0.0.0`, not `127.0.0.1`.
- JSON in, JSON out. `Content-Type: application/json` on bodies.
- Client timeout is 10 s. Health check timeout is 3 s.
- CORS is not needed for mobile, but the web app will need it.

## Errors

Any non-2xx response should use this body:

```json
{ "error": { "code": "GUEST_NOT_FOUND", "message": "No guest with id g_123", "details": {} } }
```

`details` is optional. Use 400 for validation errors (put the field problems in `details`) and 404 for unknown ids.

## Types

```ts
type GuestInput = {
  name: string;            // 1–80 chars, trimmed
  industry: string;        // one of meta.industries
  jobRole: string;         // 1–80 chars
  seniority: string;       // one of meta.seniorities
  companySize: string;     // one of meta.companySizes
  region: string;          // one of meta.regions
  interests: string[];     // ≥1, values from meta.taxonomy
  freeText: string;        // 0–1000 chars; may contain emoji, Hindi, "<b>"-like text. Store as plain text.
  optIn?: boolean;         // consent to share business contact with exhibitors
};

type Guest = GuestInput & {
  id: string;
  updatedAt: string;       // ISO 8601. Used for last-write-wins conflict handling.
};

type Exhibitor = {
  id: string;
  name: string;
  description: string;
  products: string[];
  industries: string[];
  hall: string;            // "A"
  booth: string;           // "A-12". Natural sort: A-2 before A-10.
};

type Factors = {           // every value is a number in [0, 1]
  semantic: number;        // embedding similarity
  interest: number;        // taxonomy tag overlap
  intent: number;          // procurement interests vs products
  buyerFit: number;        // guest vs exhibitor's target buyer
  g2e: number;             // guest → exhibitor score
  e2g: number;             // exhibitor → guest score
};

type Recommendation = {
  rank: number;            // integer ≥ 1
  exhibitor: Exhibitor;
  score: number;           // INTEGER 0–100 (geometric mean of g2e and e2g × 100)
  matchedOn: string[];     // taxonomy tags; may be empty
  factors: Factors;
  reason: string;          // one sentence
};

type SampleProfile = { id: string; label: string; profile: GuestInput };
```

## Endpoints

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/health` | – | `{ ok: boolean, db: boolean \| string, model: boolean \| string }` |
| GET | `/api/meta` | – | `{ industries[], seniorities[], companySizes[], regions[], halls[], taxonomy[], sampleProfiles: SampleProfile[] }` |
| POST | `/api/guests` | `GuestInput` | `Guest` |
| PUT | `/api/guests/:id` | `GuestInput` | `Guest` (new `updatedAt`) |
| GET | `/api/guests/:id/recommendations` | – | `{ results: Recommendation[], latencyMs: number, total: number }` |
| GET | `/api/guests/:id/bookmarks` | – | `{ exhibitorIds: string[] }` |
| POST | `/api/guests/:id/bookmarks` | `{ exhibitorId }` | `{ exhibitorIds: string[] }` |
| DELETE | `/api/guests/:id/bookmarks` | `{ exhibitorId }` | `{ exhibitorIds: string[] }` |
| GET | `/api/guests/:id/route` | – | `{ halls: { hall: string, stalls: Recommendation[] }[] }` |

Notes:

- `results` holds at most 30 items, ordered by `rank`. `total` is the number of candidates that scored, so the app can show "Showing 12 of 12" when fewer than 30 match.
- `latencyMs` is server-side engine time for this request. The app shows it as "Top 30 in 180 ms".
- POST and DELETE bookmarks must be **idempotent**: adding twice or removing a missing id is not an error. Both return the full list.
- DELETE carries a JSON body. If your framework drops DELETE bodies, also accept `DELETE /api/guests/:id/bookmarks/:exhibitorId` and tell the mobile team.
- `route` groups bookmarked stalls by hall (A, B, C…) and orders each hall's stalls by booth in natural order.

## Real-time (Socket.io)

- The app connects with `transports: ['websocket']` (no long-polling) to the same base URL.
- After connecting it emits `join` with `{ guestId }`. Put the socket in room `guest:<id>`.
- Emit to that room:

| Event | Payload | When |
| --- | --- | --- |
| `recommendations:updated` | `{ guestId, results: Recommendation[], latencyMs }` | after a profile edit is recomputed |
| `bookmark:changed` | `{ guestId, exhibitorIds: string[] }` | after any bookmark add/remove, from any client |
| `guest:updated` | `{ guest: Guest }` | after `PUT /api/guests/:id` |

- On reconnect or app foreground, the app refetches recommendations and bookmarks, so missed events are fine.
- Conflicts are last write wins on `updatedAt`. The app ignores a `guest:updated` whose `updatedAt` is older than what it has.

## Sample profiles

`/api/meta.sampleProfiles` should include these three so the web and mobile demos match. The app's demo data uses the same three:

1. "Factory owner, automation buyer"
2. "Procurement head, packaging"
3. "Startup CTO, IoT sensors"

See `src/api/mock/fixtures.ts` for the exact field values.
