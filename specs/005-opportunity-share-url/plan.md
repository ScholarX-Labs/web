# Implementation Plan: Shareable Opportunity Detail URLs

**Branch**: `005-opportunity-share-url` | **Date**: 2026-05-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification + External API contract providing `GET /api/opportunities/{opportunity_id}`

---

## Summary

Add URL-based state synchronization to the AI Search page and a new public opportunity detail page. The feature has two tiers:

1. **Internal URL state** (`/ai-search?q=...&o=...`) — real-time URL sync for authenticated users browsing search results.
2. **Public shareable page** (`/opportunity/[id]`) — server-rendered, SEO-friendly, ISR-cached, no auth required.

The public page uses the external API's dedicated `GET /api/opportunities/{opportunity_id}` endpoint (with `lang` support) to fetch single-opportunity data directly — no search-by-ID proxy needed.

---

## Technical Context

| Field | Value |
|---|---|
| **Language/Version** | TypeScript 5.x + React 19, Next.js 16 (App Router) |
| **Primary Dependencies** | `next/navigation` (built-in), Framer Motion, TanStack React Query |
| **Routes** | `/ai-search` — authenticated (`requireSession()`); `/opportunity/[id]` — new, public |
| **External API** | `POST /api/search` (search) + `GET /api/opportunities/{id}` (single fetch) |
| **API Base URL** | `https://scholarx-search-api.vercel.app/api` |
| **Data Nature** | Opportunity data is **static** (changes infrequently) — ideal for ISR |
| **Current State** | Zero URL sync; modal state is local `useState` only |
| **Testing** | `tsc --noEmit`, ESLint, manual browser + Lighthouse |
| **Auth Boundary** | `/ai-search/layout.tsx` calls `requireSession()` — blocks all public access |

---

## Two-Tier URL Strategy

### Tier 1 — Authenticated URL Sync (existing route)

```
/ai-search?q=germany+DAAD&o=opp_abc123
```

- For logged-in users browsing search results
- Real-time `router.replace` as users click cards
- Back button navigates between cards / closes modal
- **Not shareable publicly** — route is auth-protected

### Tier 2 — Public Shareable Page (new route)

```
/opportunity/opp_abc123?lang=en
```

- Fully public — no auth required
- Server-rendered with ISR (`revalidate: 3600`)
- Supports optional `lang` query parameter (en/ar)
- SEO metadata (OG tags, JSON-LD structured data)
- "Sign in to search more" CTA for conversion
- Search engines can index each opportunity

### How They Connect

```
Search page card click
  → URL updates to /ai-search?q=...&o=opp_abc123   (authenticated)
  → Modal's "Share" button offers /opportunity/opp_abc123  (public link)
```

---

## External API Contract

### `GET /api/opportunities/{opportunity_id}`

| Parameter | Type | Location | Required | Default |
|---|---|---|---|---|
| `opportunity_id` | `string` | Path | Yes | — |
| `lang` | `string` (en / ar) | Query | No | `en` |

**Success Response (200):**

```json
{
  "id": "string",
  "data": {
    "title": "string",
    "description": "string",
    "category": "string",
    "fund_type": ["string"],
    "benefits": ["string"],
    "deadline": "string",
    "country": ["string"],
    "eligibility": "string",
    "type": {
      "subtype": ["string"],
      "category": "string"
    },
    "application_link": "string",
    "official_website": "string",
    "eligible_nationalities": "string",
    "language_requirements": {},
    "duration": "string",
    "target_segment": ["string"]
  }
}
```

The `data` object follows the same structure as `RawOpportunity` in the existing search results, so the normalization logic in `normalizeResult()` is reusable.

---

## SOLID Architecture Analysis

| Principle | Application |
|---|---|
| **S**ingle Responsibility | `/ai-search` handles authenticated search + modal state sync. `/opportunity/[id]` handles public display. One route, one job. No auth logic mixed with display logic. |
| **O**pen/Closed | We **add** routes, API functions, and a component without **modifying** existing auth guards, search logic, or modal components. The system is open for extension, closed for modification. |
| **L**iskov Substitution | No inheritance. Both routes consume the same `SearchResult` interface — the public page uses data normalized from the same schema as search results. |
| **I**nterface Segregation | The public detail component receives only what it renders: title, description, benefits, deadline, etc. No search state, no modal lifecycle, no animation props. |
| **D**ependency Inversion | Both routes depend on the **same normalized data interface** (`SearchResult`). The new `getOpportunityById()` function in `api.ts` abstracts the external endpoint, so the public page never knows the external URL or the raw response shape. |

---

## Performance & Caching Strategy

```
                          ┌─────────────────────────┐
                          │   CDN / Edge Cache       │
                          │   (Vercel Edge Network)  │
                          └──────────┬──────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
   │ /opportunity/[id] │   │  ISR Cache       │   │ API Route Cache  │
   │   (Static HTML)   │   │  revalidate: 1h  │   │  stale-while-    │
   │   Instant Serve   │   │  Next.js fetch   │   │  revalidate: 1d  │
   └──────────────────┘   └──────────────────┘   └──────────────────┘
```

| Layer | Mechanism | Benefit |
|---|---|---|
| **CDN** | Vercel Edge Network | Static HTML served globally at edge, zero cold starts |
| **ISR** | `revalidate: 3600` | Page generated on first visit, cached for 1 hour |
| **API Route** | `stale-while-revalidate` + `stale-if-error` | Redundant cache layers, graceful degradation |
| **External API** | `next: { revalidate: 3600 }` in `fetch()` | Dedicated endpoint, no redundant search |
| **Browser** | `Cache-Control: public, max-age=300` | Short browser cache, CDN does the heavy lifting |

---

## New Files Structure

```
src/
├── app/
│   ├── ai-search/                           [MODIFY: useSearchParams sync]
│   │   ├── page.tsx                         [NO CHANGE]
│   │   └── layout.tsx                       [NO CHANGE]
│   │
│   ├── opportunity/                         [NEW DIRECTORY]
│   │   └── [id]/
│   │       ├── page.tsx                     [NEW] Server Component with ISR
│   │       ├── layout.tsx                   [NEW] Public layout (no auth)
│   │       └── loading.tsx                  [NEW] Skeleton fallback
│   │
│   └── api/
│       └── opportunities/
│           └── [id]/
│               └── route.ts                 [NEW] GET endpoint, cached proxy
│
├── components/
│   └── opportunity/
│       └── opportunity-detail.tsx           [NEW] Shared detail component
│
└── lib/
    └── ai-search/
        └── api.ts                           [MODIFY: add getOpportunityById()]
```

---

## Implementation

### Step 1 — API Function: `src/lib/ai-search/api.ts`

Add a new function that calls the external `GET /api/opportunities/{id}` endpoint and normalizes the response to `SearchResult`.

```typescript
const SEARCH_API_BASE = "https://scholarx-search-api.vercel.app/api";

// ... existing searchScholarships() ...

interface RawSingleOpportunityResponse {
  id: string;
  data: RawOpportunity;
}

export async function getOpportunityById(
  id: string,
  lang: string = "en",
): Promise<SearchResult | null> {
  const url = `${SEARCH_API_BASE}/opportunities/${encodeURIComponent(id)}?lang=${lang}`;
  const response = await fetch(url, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) return null;

  const raw: RawSingleOpportunityResponse = await response.json();

  // Package the single-opportunity response into a RawSearchResult shape
  // so we can reuse the existing normalizeResult() logic
  const wrapped: RawSearchResult = {
    id: raw.id,
    opportunity: raw.data,
  };

  return normalizeResult(wrapped);
}
```

**Design rationale:**
- Wraps the single-opportunity response into a `RawSearchResult` shape so existing `normalizeResult()` handles it without duplication.
- `next: { revalidate: 3600 }` caches the upstream fetch at the data layer — no two Server Components in the same 1-hour window will hit the external API for the same ID.
- Returns `null` on error, never throws. The caller (page or API route) decides how to render the null state.

---

### Step 2 — Internal API Route: `src/app/api/opportunities/[id]/route.ts`

A thin Next.js API route that:
1. Accepts `GET /api/opportunities/:id?lang=en`
2. Calls `getOpportunityById()` (which handles the external fetch + normalization)
3. Returns normalized JSON with proper cache headers

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getOpportunityById } from "@/lib/ai-search/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const lang = request.nextUrl.searchParams.get("lang") ?? "en";

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid opportunity_id" },
      { status: 400 },
    );
  }

  const opportunity = await getOpportunityById(id, lang);

  if (!opportunity) {
    return NextResponse.json(
      { error: "Opportunity not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(opportunity, {
    status: 200,
    headers: {
      "Cache-Control":
        "public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400",
    },
  });
}
```

**Why an internal API route instead of calling the external API directly from the page?**
1. **Abstraction** — The page never knows about the external URL, raw response shapes, or the `lang` parameter encoding.
2. **Normalization boundary** — The normalization logic stays in the API layer (`api.ts`), not in the page component.
3. **Caching control** — We control the CDN cache headers independently of the upstream.
4. **Future-proofing** — If we later add a local DB or switch providers, only the API route changes, not the public page (Open/Closed principle).

---

### Step 3 — Public Layout: `src/app/opportunity/[id]/layout.tsx`

```typescript
export default function OpportunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

No auth guard. This is the critical difference from the `/ai-search` layout — public users reach this page without authentication.

---

### Step 4 — Public Page: `src/app/opportunity/[id]/page.tsx`

Server Component with ISR. Fetches data from the internal API route. Generates SEO metadata including OG tags for social previews.

```typescript
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SearchResult } from "@/lib/ai-search/types";
import { OpportunityDetail } from "@/components/opportunity/opportunity-detail";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

async function fetchOpportunity(
  id: string,
  lang: string,
): Promise<SearchResult | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(
      `${baseUrl}/api/opportunities/${id}?lang=${lang}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params, searchParams }: Props,
): Promise<Metadata> {
  const { id } = await params;
  const { lang = "en" } = (await searchParams) ?? {};
  const opp = await fetchOpportunity(id, lang);
  if (!opp) return { title: "Opportunity Not Found" };

  return {
    title: `${opp.title} — ScholarX`,
    description: opp.description.slice(0, 160),
    openGraph: {
      title: opp.title,
      description: opp.description.slice(0, 160),
      type: "article",
      url: `/opportunity/${id}`,
    },
  };
}

export default async function OpportunityPage(
  { params, searchParams }: Props,
) {
  const { id } = await params;
  const { lang = "en" } = (await searchParams) ?? {};
  const opp = await fetchOpportunity(id, lang);
  if (!opp) notFound();

  return <OpportunityDetail opportunity={opp} />;
}
```

**Performance notes:**
- `fetchOpportunity()` is called once per render (called inside both `generateMetadata` and the page component, but Next.js deduplicates the same `fetch` call).
- `next: { revalidate: 3600 }` gives 1-hour ISR cache. After 1 hour, the next visit triggers a background regeneration.
- `notFound()` serves a cacheable 404 page.

---

### Step 5 — Shared Detail Component: `src/components/opportunity/opportunity-detail.tsx`

Renders opportunity content. Used by both the public page and could be reused by the modal. Depends only on the `SearchResult` abstraction.

```typescript
"use client";

import { SearchResult } from "@/lib/ai-search/types";
import { Badge } from "@/components/ai-search/ui/badge";

interface Props {
  opportunity: SearchResult;
}

export function OpportunityDetail({ opportunity }: Props) {
  const {
    title,
    description,
    category,
    tags,
    funding,
    fundingLevel,
    deadline,
    location,
    eligibility,
    benefits,
    url,
  } = opportunity;

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      {/* Category badge */}
      {category && <Badge>{category}</Badge>}

      {/* Title */}
      <h1 className="text-4xl font-extrabold mt-4 mb-6">{title}</h1>

      {/* Description */}
      <p className="text-lg text-muted-foreground leading-relaxed mb-8">
        {description}
      </p>

      {/* Details grid */}
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {fundingLevel && (
          <div>
            <dt className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Funding
            </dt>
            <dd className="text-lg font-bold">{fundingLevel}</dd>
          </div>
        )}
        {deadline && (
          <div>
            <dt className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Deadline
            </dt>
            <dd className="text-lg font-bold">{deadline}</dd>
          </div>
        )}
        {location && (
          <div>
            <dt className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Location
            </dt>
            <dd className="text-lg font-bold">{location}</dd>
          </div>
        )}
        {eligibility && (
          <div className="md:col-span-2">
            <dt className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Eligibility
            </dt>
            <dd className="text-base">{eligibility}</dd>
          </div>
        )}
      </dl>

      {/* Benefits */}
      {benefits && benefits.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Benefits</h2>
          <ul className="space-y-2">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-green-500 mt-1">&#10003;</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* CTA — Sign in for full experience */}
      <div className="border-t pt-8 mt-8 text-center">
        <p className="text-muted-foreground mb-4">
          Want to explore more opportunities like this?
        </p>
        <a
          href="/auth/signin"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-scholar-blue to-scholar-blue-dark shadow-lg shadow-scholar-blue/30 hover:shadow-xl transition-all"
        >
          Sign In to Search All Opportunities
        </a>
      </div>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOccupationalProgram",
            name: title,
            description,
            ...(deadline && {
              timeToComplete: deadline,
            }),
            ...(location && {
              location: { "@type": "Place", name: location },
            }),
          }),
        }}
      />
    </article>
  );
}
```

---

### Step 6 — Search Results URL Sync (existing files)

#### `src/components/ai-search/search-results-enhanced.tsx`

**Changes:**

1. Import `useSearchParams`, `useRouter` from `next/navigation`
2. On mount: read `o` from search params → if match found in `results`, open modal
3. On `handleViewDetails`: if `result.id` exists, update `?o=` via `router.replace`
4. On close (`handleClose`): remove `?o=` via `router.replace`
5. Watch `results` changes + `o` param for deep-link auto-open
6. Add "Copy Link" button in the modal footer that copies `/opportunity/<id>` to clipboard

```typescript
import { useSearchParams, useRouter } from "next/navigation";

export function SearchResults({ query, results, isLoading, onScrollToTop }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const opportunityIdFromUrl = searchParams.get("o");

  // Deep-link: auto-open modal when results arrive
  useEffect(() => {
    if (!opportunityIdFromUrl || isModalOpen) return;
    const match = results.find((r) => r.id === opportunityIdFromUrl);
    if (match) {
      setSelectedResult(match);
      setIsModalOpen(true);
    }
  }, [opportunityIdFromUrl, results, isModalOpen]);

  // Back button: close modal when "o" param is removed
  useEffect(() => {
    if (!opportunityIdFromUrl && isModalOpen) {
      setIsModalOpen(false);
      setSelectedResult(null);
    }
  }, [opportunityIdFromUrl, isModalOpen]);

  function handleViewDetails(result: SearchResult) {
    setSelectedResult(result);
    setIsModalOpen(true);
    if (result.id) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("o", result.id);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }

  function handleClose() {
    setIsModalOpen(false);
    setSelectedResult(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("o");
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  // Pass handleClose to modal's onClose
  // Add Copy Link button in modal footer (only when result.id exists)
}
```

**"Copy Link" button — placed inside the modal footer:**

```tsx
{result.id && (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => {
      const shareUrl = `${window.location.origin}/opportunity/${result.id}`;
      navigator.clipboard.writeText(shareUrl).catch(() => {
        // Fallback: noop — button just won't copy
      });
    }}
    className="w-full px-8 py-5 rounded-2xl font-bold text-lg border border-scholar-blue/30 text-scholar-blue hover:bg-scholar-blue/10 transition-all"
  >
    Copy Link
  </motion.button>
)}
```

#### `src/components/ai-search/ai-search-page-enhanced.tsx`

Wrap in `<Suspense>` (required by `useSearchParams`) and sync `q` param with search query:

```typescript
export default function EnhancedAISearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <EnhancedAISearchPageInner />
    </Suspense>
  );
}

function EnhancedAISearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeQuery, setActiveQuery] = useState(searchParams.get("q") ?? "");

  function handleSearch(query: string) {
    setActiveQuery(query);
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", query);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  // ... rest unchanged
}
```

---

## Data Flow Diagrams

### Flow A — Authenticated user shares an opportunity:

```
User on /ai-search searches "germany DAAD"
  → URL: /ai-search?q=germany+DAAD
  → Clicks card "opp_abc123"
    → URL: /ai-search?q=germany+DAAD&o=opp_abc123
    → Modal opens with layout morph
  → Clicks "Copy Link" in modal footer
    → Clipboard: https://scholarx.app/opportunity/opp_abc123
```

### Flow B — Public user receives shared link:

```
User opens https://scholarx.app/opportunity/opp_abc123?lang=en

  → Vercel Edge serves cached HTML (if available)
  → If not cached (cold / expired ISR):
    → Page Server Component calls:
        GET /api/opportunities/opp_abc123?lang=en  (internal)
          → Calls getOpportunityById("opp_abc123", "en")
            → fetch("https://scholarx-search-api.vercel.app/api/opportunities/opp_abc123?lang=en")
            → External API returns { id, data: RawOpportunity }
            → normalizeResult() converts to SearchResult
          → Returns SearchResult JSON with Cache-Control: s-maxage=3600
    → OpportunityDetail renders full HTML with OG tags + JSON-LD
    → HTML cached at edge for 1 hour (ISR)

  → Public user sees fully rendered opportunity page
  → CTA: "Sign In to Search All Opportunities"
```

### Flow C — Search engine indexing:

```
Googlebot crawls /opportunity/opp_abc123
  → Edge serves cached HTML
  → HTML includes:
    - <title>DAAD Scholarship 2025 — ScholarX</title>
    - <meta property="og:title" ...>
    - <meta property="og:description" ...>
    - <script type="application/ld+json">
        { "@type": "EducationalOccupationalProgram", ... }
      </script>
  → Google indexes the opportunity
  → Users find it in search results
  → Click → public page → CTA → sign up → search flow
```

---

## Edge Cases & Production Guardrails

| Scenario | Handling |
|---|---|
| External `GET /opportunities/{id}` returns 404 | `getOpportunityById` returns `null` → `notFound()` → cacheable 404 page |
| External `GET /opportunities/{id}` returns 422 (invalid ID) | `getOpportunityById` returns `null` → same 404 path |
| External API is down (timeout / 5xx) | `fetch` throws → `try/catch` returns `null` → 404 page. ISR stale cache serves stale HTML if available (graceful degradation). |
| `result.id` is `undefined` in search results | Modal opens normally. "Copy Link" button is hidden. No URL update for `o` param. |
| Public user visits `/opportunity/invalid-id` | External API returns 404 → `fetchOpportunity` returns null → `notFound()` |
| User clicks "Copy Link" on non-HTTPS (no clipboard API) | `navigator.clipboard.writeText` wrapped in `.catch()` → silent failure. Button does nothing. |
| ISR cache stale — opportunity data changed upstream | `revalidate: 3600` means max 1 hour staleness. Acceptable for static data. |
| Rate limiting on external API | ISR + data-layer cache means ~1 request per unique ID per hour. Negligible. |
| Modal open + user refreshes page | `q` param re-initiates search, `o` param triggers deep-link auto-open. Full state restoration. |
| lang param is "ar" — Arabic text | Response comes in Arabic from the external API. The component renders whatever the API returns — no RTL layout changes in V1. |

---

## Verification Checklist

| # | Test | Expected Result |
|---|---|---|
| 1 | Search a query on `/ai-search` | URL updates to `?q=<query>` |
| 2 | Click an opportunity card with valid `id` | URL updates to `?q=<query>&o=<id>`, modal opens with layout morph |
| 3 | Click an opportunity card without `id` | Modal opens normally, no URL change |
| 4 | Press browser back (modal open) | `&o=` removed, modal closes with reverse morph, results stay |
| 5 | Click "Copy Link" in modal | Clipboard contains `https://.../opportunity/<id>` |
| 6 | Open `/opportunity/<valid-id>` in incognito | Server-rendered opportunity detail page, no auth redirect |
| 7 | Open `/opportunity/<valid-id>` → view source | HTML contains title, description, OG tags, JSON-LD |
| 8 | Open `/opportunity/<valid-id>?lang=ar` | Arabic content rendered (from external API) |
| 9 | Open `/opportunity/<invalid-id>` | 404 page served |
| 10 | `/opportunity/<id>` response headers | `Cache-Control: public, s-maxage=3600` |
| 11 | Open `?q=germany&o=<valid-id>` directly on `/ai-search` | Search auto-runs, modal auto-opens on results load |
| 12 | Open `?q=germany&o=<invalid-id>` directly | Search runs, modal stays closed |
| 13 | Lighthouse on `/opportunity/<id>` (desktop) | Performance ≥ 90, SEO ≥ 90 |
| 14 | Lighthouse on `/opportunity/<id>` (mobile) | Performance ≥ 85, SEO ≥ 90 |
| 15 | TypeScript check | `tsc --noEmit` passes |
| 16 | ESLint | `npm run lint` passes with no new errors |

---

## Dependency Map (No New Packages)

```
next/navigation         (built-in)  ← useSearchParams, useRouter
next/server             (built-in)  ← NextRequest, NextResponse
@/lib/ai-search/api                 [MODIFY] add getOpportunityById()
@/lib/ai-search/types               [NO CHANGE] reuses SearchResult
lucide-react            (existing)  ← Share2 icon for Copy button
```

Zero new npm dependencies.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| External `GET /opportunities/{id}` has different shape than `RawOpportunity` in search | Low | Data display issues | Already verified: the contract shows `data` contains the same fields as `RawOpportunity`. The normalization wrapper aligns them. |
| `useSearchParams` throws without Suspense | Medium | Build error | Outer wrapper with `<Suspense>` (planned) |
| Circular update: URL → effect → state → URL | Low | Infinite loop | `router.replace` + guard effects with `if (prev !== current)` |
| Framer Motion layout animation interrupted by URL-driven re-render | Low | Visual glitch | `scroll: false` on replace; layout animation runs on unmounted element |
| Clipboard API fails | Low | UX friction | `.catch()` silent failure, no toast needed for V1 |
| External API rate limits on high-traffic shared links | Low | 404s for public pages | ISR + data-cache layer reduces external calls to ~1/ID/hour. Scale-safe. |
