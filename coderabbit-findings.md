# CodeRabbit Review Findings

> Branch: `015-i18n-localization` vs `main`
> Generated: 2026-07-07

---

## 1. critical: NaN/non-finite points bypasses validation - Solved

**File:** `src/domain/leaderboard/application/leaderboard.service.ts:26-31`

`event.points <= 0` does not reject `NaN`, `Infinity`, or `-Infinity`. Non-finite values pass validation and propagate into score calculations.

### Proposed Fix

```ts
if (!Number.isFinite(event.points) || event.points <= 0) {
  throw new LeaderboardError(
    "INVALID_OPERATION",
    "Points awarded must be greater than zero."
  );
}
```

---

## 2. major: Nondeterministic tie-breaker on bulk cache rebuild - Solved

**File:** `src/domain/leaderboard/application/leaderboard-cache-rebuild.job.ts:42-46`

`Date.now()` is used as a tie-breaker in rankings, but it's re-evaluated on every rebuild. Tied users' relative order will shift unpredictably.

### Suggestion

Use a deterministic tie-breaker (e.g., earliest activity timestamp or userId).

---

## 3. major: Fire-and-forget cache rebuild risks - Solved

**File:** `src/domain/leaderboard/application/leaderboard.service.ts:35-42`

Three full-course cache rebuilds are triggered per `awardPoints` call without being awaited or debounced. In serverless environments, the function may terminate before rebuilds complete. Under bursty point-awarding, this creates redundant recomputation.

### Suggestion

Consider debouncing/coalescing rebuild triggers per course and using `waitUntil` or a background queue.

---

## 4. major: Month window boundary mixes UTC extraction with local Date construction - Solved

**File:** `src/domain/leaderboard/application/leaderboard-cache-rebuild.job.ts:64-68`

UTC-based getters feed into local-time `new Date()`, shifting month boundaries by a day in non-UTC timezones.

### Proposed Fix

```ts
const startOfMonth = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
);
```

---

## 5. major: Math.floor() drops legitimate fractional weighted scores - Solved

**File:** `src/domain/leaderboard/application/leaderboard-scoring.policy.ts:25-37`

`Math.floor()` drops fractional points, collapsing distinct learners to the same score.

### Proposed Fix

```ts
- totalScore: Math.floor(totalScore),
+ totalScore,
```

---

## 6. minor: Disabled Switch + Tooltip not keyboard/screen-reader accessible - Solved

**File:** `src/components/leaderboard/LeaderboardOptOutToggle.tsx:68-85`

The `<div>` wrapping a disabled `Switch` has no `tabIndex`, so keyboard/screen-reader users can't trigger the tooltip.

### Proposed Fix

```tsx
<div tabIndex={0}>
  <Switch id="opt-out" checked={true} disabled={true} ... />
</div>
```

---

## 7. major: CACHE_UNAVAILABLE error won't trigger query-service fallback - Solved

**File:** `src/domain/leaderboard/infrastructure/cache/leaderboard-cache.repository.ts:11-20`

When Redis is down, `CACHE_UNAVAILABLE` error code isn't recognized by `LeaderboardQueryService` fallback logic (which only checks `ECONNREFUSED`).

### Suggestion

Align error codes or widen the fallback condition.

---

## 8. major: Unknown activityType values silently corrupt aggregation - Solved

**File:** `src/domain/leaderboard/infrastructure/db/point-event.repository.ts:50-64`

Unmapped `activityType` values produce `undefined` keys and `NaN` totals, silently dropping points.

### Proposed Fix

```ts
if (!category) {
  continue; // skip unmapped activity types
}
```

---

## 9. major: Redundant unique constraint on idempotencyKey - Solved

**File:** `src/db/schema/leaderboard.ts:27`

`idempotencyKey` has both `.unique()` on the column definition and an explicit `uniqueIndex("pe_idempotency_key_idx")` on the same single column. This creates a second, functionally identical unique index with unnecessary storage/maintenance overhead.

### Proposed Fix

```ts
- idempotencyKey: varchar("idempotency_key", { length: 255 }).unique(),
+ idempotencyKey: varchar("idempotency_key", { length: 255 }),
```

---

## 10. major: Ungated production DB-mock override with `any` type weakening - Solved

**File:** `src/db/index.ts:42-44`

`globalThis.__MOCK_DB__` is checked unconditionally with no `NODE_ENV` guard. Any code path that sets this global in production -- accidentally or via prototype pollution -- silently redirects all DB reads/writes through a Proxy. The `as any` cast also discards type safety.

### Proposed Fix

```ts
declare global {
  var __MOCK_DB__: ReturnType<typeof drizzle> | undefined;
}

function getDb() {
  if (process.env.NODE_ENV === "test" && globalThis.__MOCK_DB__) {
    return globalThis.__MOCK_DB__;
  }
  // ...
}
```

---

## 11. major: isArabicEnabled() and routing.ts can disagree - Solved

**File:** `src/lib/app-config.ts:100-111`

`routing.ts` determines locales from env vars at module load, while `isArabicEnabled()` additionally checks a DB-backed config. If an operator toggles `arabic_enabled` in the DB without setting env vars, UI gated by `isArabicEnabled()` could link to an `ar` locale that routing rejects.

### Suggestion

Align the two sources of truth (env-only or DB-only) for Arabic locale availability.

---

## 12. major: `as any` cast weakens type safety in routing.ts - Solved

**File:** `src/lib/i18n/routing.ts:8-9`

Casting `SUPPORTED_LOCALES as any` bypasses `defineRouting`'s locale-array typing, masking genuine type errors on future changes.

### Proposed Fix

```ts
- locales: isArabicActive ? (SUPPORTED_LOCALES as any) : [DEFAULT_LOCALE],
+ locales: isArabicActive ? [...SUPPORTED_LOCALES] : [DEFAULT_LOCALE],
```

---

## 13. major: Arrays not sanitized in agent-log, allowing nested PII leak - Solved

**File:** `src/lib/debug/agent-log.ts:14-28`

`sanitizeData` only recurses into plain objects. When a value is an array, it's copied untouched — any sensitive fields nested inside array elements (e.g. `data.items[].email`) are sent unredacted to the debug ingest endpoint.

### Proposed Fix

```ts
if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
  sanitized[key] = "[REDACTED]";
} else if (Array.isArray(val)) {
  sanitized[key] = val.map((item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? sanitizeData(item as Record<string, unknown>)
      : item,
  );
} else if (val && typeof val === "object") {
  sanitized[key] = sanitizeData(val as Record<string, unknown>);
} else {
  sanitized[key] = val;
}
```

---

## 14. major: Widened Redis "ready" check may trade fast fallback for blocking latency - Solved

**File:** `src/lib/cache/shared-redis.ts:59-61`

Treating "connecting"/"connect" as ready combined with `enableOfflineQueue: true` means callers queue commands during connection setup instead of getting an immediate null fallback. Commands can block up to `commandTimeout` before failing.

### Suggestion

Confirm the latency trade-off vs. reduced circuit-fallback churn is intentional for rate-limiter/cache callers that expect fast failover.

---

## 15. major: remaining/reset come from different rate-limit windows, giving misleading pair - Solved

**File:** `src/lib/rate-limiter.ts:39-44`

`remaining` uses the min across windows (correct bottleneck), but `reset` uses the max — these can point to entirely different rules. Callers may be told "0 remaining" alongside a reset that is weeks away even though the actual limiting window resets in minutes.

### Proposed Fix

```ts
const denied = results.find((r) => !r.allowed);
if (denied) {
  return { allowed: false, remaining: 0, reset: denied.resetAt };
}

const bottleneck = results.reduce((min, r) =>
  r.remaining < min.remaining ? r : min,
);
return {
  allowed: true,
  remaining: bottleneck.remaining,
  reset: bottleneck.resetAt,
};
```

---

## 16. major: Untyped cast of raw API response to MyRankDto - Solved

**File:** `src/hooks/queries/use-leaderboard.ts:29-36`

`res.json()` is returned directly as `Promise<MyRankDto>` with no intermediate raw type or validation, weakening the boundary between the API payload and the normalized/UI-facing type.

### Suggestion

Add a response validation layer or interface for the raw payload before casting to `MyRankDto`.

---

## 17. minor: Non-percentage unit strings aren't mirrored for RTL - Solved

**File:** `src/hooks/useRTLMotion.ts:21-30`

`getX` only flips numbers and percentage strings. Other unit strings (e.g. `"10px"`, `"2rem"`) pass through unchanged even when `isRTL` is true, silently failing to mirror x-offsets.

### Proposed Fix

```ts
if (typeof xValue === "string") {
  const match = xValue.match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
  if (match) {
    const [, num, unit] = match;
    return isRTL ? `${-parseFloat(num)}${unit}` : xValue;
  }
}
```

---

## 18. major: Type the raw API response before mapping in use-leaderboard - Solved

**File:** `src/hooks/queries/use-leaderboard.ts:12-20`

`res.json()` resolves to `any`, so `data.entries`/`data.updatedAt` are unchecked and pass through into `LeaderboardData` with no validation. A shape mismatch from the API surfaces as a silent runtime bug.

### Proposed Fix

```ts
interface LeaderboardApiResponse {
  entries: LeaderboardEntryDto[];
  updatedAt: string | null;
}

queryFn: async (): Promise<LeaderboardData> => {
  const res = await fetch(`/api/leaderboard/${courseId}?window=${window}`);
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  const data: LeaderboardApiResponse = await res.json();
  return {
    entries: data.entries,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
  };
},
```

---

## 19. minor: Avoid returning raw error internals in point-events route - Solved

**File:** `src/app/api/leaderboard/point-events/route.ts:24-29`

Both the validation error (`details: result.error`) and the catch handler (`details: err.message`) serialize internal detail to the client. The full ZodError object includes internal schema structure.

### Suggestion

Log the full error server-side and return a minimal message.

---

## 20. minor: Avoid leaking raw error internals in opt-out route - Solved

**File:** `src/app/api/leaderboard/opt-out/route.ts:23-28`

Same pattern as point-events route: returning `details: result.error` (full ZodError) and `details: err.message` exposes internal detail to clients.

### Suggestion

Log server-side, return a minimal message.

---

## 21. major: CSV formula injection via displayName - Solved

**File:** `src/app/api/leaderboard/[courseId]/export/route.ts:48-58`

`displayName` is user-controlled and written into CSV with only double-quote escaping. A value beginning with `=`, `+`, `-`, `@` (or tab/CR) is interpreted as a formula when opened in Excel/Sheets.

### Proposed Fix

```ts
const sanitizeCsv = (value: string) => {
  const escaped = value.replace(/"/g, '""');
  return /^[=+\-@\t\r]/.test(escaped) ? `'${escaped}` : escaped;
};
```

---

## 22. critical: Missing React import breaks type references in pointer-highlight - Solved

**File:** `src/components/ui/pointer-highlight.tsx:19`

File references `React.ReactNode` and `React.SVGProps` but never imports React (only imports `useRef, useEffect, useState`).

### Proposed Fix

```ts
import React, { useRef, useEffect, useState } from "react";
```

---

## 23. minor: Boundary checks don't match their own error messages in lens.tsx - Solved

**File:** `src/components/ui/lens.tsx:69-74`

`zoomFactor < 1` doesn't match error "must be greater than 1". `lensSize < 0` doesn't match "must be greater than 0".

### Proposed Fix

```ts
- if (zoomFactor < 1) {
+ if (zoomFactor <= 1) {
    throw new Error("zoomFactor must be greater than 1")
  }
- if (lensSize < 0) {
+ if (lensSize <= 0) {
    throw new Error("lensSize must be greater than 0")
  }
```

---

## 24. minor: `role="text"` is not a standard ARIA role - Solved

**File:** `src/components/ui/encrypted-text.tsx:152-158`

`role="text"` is non-standard (Safari-specific) and may be flagged by linters. `aria-label` already provides an accessible name.

### Suggestion

Remove the `role="text"` attribute.

---

## 25. minor: Invalid Tailwind class `bg-red-transparent` - Solved

**File:** `src/components/ui/google-gemini-effect.tsx:47`

`bg-red-transparent` is not a valid Tailwind utility class. Replace with a real utility (e.g. `bg-transparent`).

---

## 26. minor: `btoa` throws on non-Latin1 SVG content - Solved

**File:** `src/components/ui/icon-cloud.tsx:133-135`

`btoa(svgString)` raises `InvalidCharacterError` if SVG contains Unicode glyphs/emoji. Use `encodeURIComponent` or `TextEncoder` instead.

---

## 27. major: Hover-only nav, not keyboard/touch accessible - Solved

**File:** `src/components/ui/3d-adaptive-navigation-bar.tsx:165-168`

Pill expansion is driven exclusively by `onMouseEnter`/`onMouseLeave`. Keyboard-only and touch users can never open the menu.

### Suggestion

Add focus-based expansion (`onFocus`/`onBlur`) and ensure collapsed state exposes a focusable control.

---

## 28. major: Animation loop torn down on every mouse move - Solved

**File:** `src/components/ui/icon-cloud.tsx:236-330`

The effect depends on `mousePos`, `targetRotation`, and `isDragging` — all update on pointer movement. Each update tears down and re-creates the `requestAnimationFrame` loop.

### Suggestion

Read these values from refs inside a single, stable loop instead of listing them as effect dependencies.

---

## 29. major: Potential GPU material leak on resize - Solved

**File:** `src/components/ui/canvas-reveal-effect.tsx:277-301`

`material` is memoized on `[source, getUniforms]`, and `getUniforms` depends on `size`. Each resize produces a new `ShaderMaterial` without disposing the previous one.

### Proposed Fix

```ts
useEffect(() => {
  return () => {
    material.dispose();
  };
}, [material]);
```

---

## 30. minor: Decorative characters read twice by screen readers - Solved

**File:** `src/components/ui/text-3d-flip.tsx:209-233`

The `sr-only` span provides accessible text, but the animated `CharBox` characters remain in the accessibility tree, so AT announces the word twice.

### Proposed Fix

```tsx
- <span key={wordIndex} className="inline-flex">
+ <span key={wordIndex} className="inline-flex" aria-hidden="true">
```

---

## 31. major: Validation bounds duplicated across two contact schemas

**File:** `src/app/contact/contact.schema.ts:3-16`

`contactSchema` (server-side) and `createContactSchema` (client-side) independently repeat the same numeric bounds (50, 25, 10, 2000). If one is updated without the other, client and server validation will silently diverge.

### Proposed Fix

```ts
const LIMITS = {
  firstNameMax: 50,
  lastNameMax: 50,
  phoneNumberMax: 25,
  messageMin: 10,
  messageMax: 2000,
} as const;
```

Then reference `LIMITS.firstNameMax`, etc. in both schemas.

---

## 32. major: Manually duplicated types instead of deriving from contact schema

**File:** `src/app/contact/contact.schema.ts:61-69`

`ContactFormValues` / `ContactFormInput` are hand-written rather than inferred via `z.infer`. A future change to `contactSchema` won't be reflected in the types.

### Proposed Fix

```ts
export type ContactFormValues = z.infer<typeof contactSchema>;
export type ContactFormInput = ContactFormValues;
```
