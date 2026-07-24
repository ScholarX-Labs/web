# Tasks: Bunny.net Video Infrastructure Migration

**Input**: Design documents from `/specs/018-bunny-net-video-migration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included — the feature specification explicitly requires test coverage for token signing, source detection, and API route (plan.md §13, spec.md §6 FR-8).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Environment configuration and domain types that ALL user stories depend on

- [x] T001 Add Bunny environment variables and NEXT_PUBLIC_ safety guard to `src/config/env.ts` per plan.md §7 Layer 1
- [x] T002 [P] Create all domain types, value objects, error types, and API contracts in `src/lib/bunny/video-source.types.ts` per data-model.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core services that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Implement `BunnyCdnTokenSigner` class in `src/lib/bunny/token-signer.ts` per plan.md §7 Layer 2 — HMAC-SHA256 signing, path-style tokens, expiry clamping, `node:crypto` only
- [x] T004 [P] Implement `VideoSourceDetector` class with strategy pattern in `src/lib/bunny/video-source-detector.ts` and strategy files under `src/lib/bunny/strategies/` per plan.md §7 Layer 3 — `YouTubeVideoSourceStrategy`, `BunnyCdnVideoSourceStrategy`, frozen value objects, `VideoSourceDetector.default` singleton

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Enrolled Student Watches Paid Course (Priority: P1) 🎯 MVP

**Goal**: An enrolled student can play a paid course video with CDN Token Authentication, auto-refresh on expiry, loading skeleton, and error states — all through the existing Vidstack player with zero regressions to YouTube playback

**Independent Test**:
- Paid lesson (Bunny CDN URL in DB): `/api/bunny/token` called before video plays
- Network tab: request URL contains `bcdn_token=HS256-` in path
- HLS quality levels visible, heatmap overlay renders, focus mode works
- Token expiry → auto-refresh → playback resumes seamlessly
- After 3 failed refreshes → error card rendered
- Free lesson (YouTube URL): plays without any `/api/bunny/token` call

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T005 [P] [US1] Write unit tests for `BunnyCdnTokenSigner` in `src/lib/bunny/token-signer.test.ts` per plan.md §7 Layer 6 — signing determinism, path computation, expiry clamping, error handling (13 test cases)
- [x] T006 [P] [US1] Write unit tests for `VideoSourceDetector` and both strategies in `src/lib/bunny/video-source-detector.test.ts` per plan.md §7 Layer 6 — URL patterns, INVARIANT tests, immutability (16 test cases)

### Implementation for User Story 1

- [x] T007 [US1] Create Zod validation schema for token request in `src/app/api/bunny/token/schemas.ts` per contracts/cdn-token-api.md — `BunnyTokenRequestSchema` with videoUrl (valid URL, b-cdn.net hostname, .m3u8/.mp4 extension, no pre-signed) and expires (future, min now+5m, max now+24h)
- [x] T008 [US1] Implement `GET /api/bunny/token` route handler in `src/app/api/bunny/token/route.ts` per plan.md §7 Layer 4 and contracts/cdn-token-api.md — auth guard → Zod validation → rate limit check → `BunnyCdnTokenSigner.sign()` → JSON response with `{ success, data: { token, expires, signedUrl } }`
- [x] T009 [US1] Implement `useBunnyCdnToken` hook in `src/hooks/use-bunny-cdn-token.ts` per plan.md §7 Layer 5 — detect source type → fetch token on mount → pass signedUrl to player → handle 403 via `onTokenExpired` callback → exponential backoff (1s/2s/4s + jitter) → max 3 retries → error state
- [x] T010 [P] [US1] Create `VideoPlayerSkeleton` component in `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/video-player-skeleton.tsx` per plan.md §7 Layer 5 — glassmorphism loading skeleton, zero CLS, ambilight pulse animation, 16:9 aspect ratio
- [x] T011 [P] [US1] Create `VideoErrorDisplay` component in `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/video-error-display.tsx` per plan.md §7 Layer 5 — glassmorphism error card, accessible `role="alert"`, retry button, user-friendly messages
- [x] T012 [US1] Enhance `toPlayerSrc()` with HLS detection and add `onTokenExpired` prop in `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/video-player.tsx` per contracts/video-source-routing.md — add Bunny CDN regex branch (`b-cdn.net|\.m3u8`), return `{ src, type: "application/x-mpegURL" }`, wire `onTokenExpired` to Vidstack `onError` 403 handler, import `VideoPlayerSkeleton` and `VideoErrorDisplay`
- [x] T013 [US1] Wire `useBunnyCdnToken` into `LessonClientBridge` in `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-client-bridge.tsx` per plan.md §7 Layer 5 — import hook, call with `currentLesson.media.src`, conditional rendering: skeleton while loading → error display on failure → player with signed URL on success, pass `onTokenExpired` callback

**Checkpoint**: At this point, User Story 1 should be fully functional — paid course videos play with CDN Token Auth, auto-refresh works, skeleton/error states render, YouTube regression-free

---

## Phase 4: User Story 5 — Concurrent Access Protection (Priority: P5)

**Goal**: Rate limiting prevents abuse of token generation and progress tracking endpoints via Redis-backed sliding window

**Independent Test**:
- 6th token request within 60s → 429 with `Retry-After` header
- Redis unavailable → fail-open (request proceeds)
- Progress update rate limit enforced

### Implementation for User Story 5

- [x] T014 [US5] Add rate limiting to `GET /api/bunny/token` in `src/app/api/bunny/token/route.ts` per spec.md §6 FR-8 and research.md Decision 6 — integrate `checkDistributedRateLimit` with key format `{userId}:token-request`, 5 req/60s sliding window, 429 response with `Retry-After` header, fail-open on Redis unavailable

**Checkpoint**: Rate limiting active on token endpoint, abuse prevented

---

## Phase 5: Tests (Unit + Integration)

**Purpose**: Comprehensive test coverage for all implemented components

### Unit Tests

- [x] T015 [P] Run and verify `BunnyCdnTokenSigner` unit tests pass in `src/lib/bunny/token-signer.test.ts` — all 13 test cases green
- [x] T016 [P] Run and verify `VideoSourceDetector` unit tests pass in `src/lib/bunny/video-source-detector.test.ts` — all 16 test cases green including INVARIANT tests

### Integration Tests

- [x] T017 Write and verify integration tests for `GET /api/bunny/token` in `tests/integration/api/bunny-token-route.test.ts` per plan.md §7 Layer 6 — 12 scenarios: auth (2), input validation (7), rate limiting (2), successful signing (4), configuration errors (2), error envelope format (2)

**Checkpoint**: All tests pass, type checking clean, lint clean

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality assurance, type safety, and final validation

- [x] T018 [P] Run `pnpm typecheck` — zero new type errors in all video-related code paths
- [x] T019 [P] Run `pnpm lint` — zero new lint violations in all changed files
- [ ] T020 Verify YouTube regression — free lesson plays without `/api/bunny/token` call, heatmap/quality/focus mode unchanged
- [ ] T021 Verify Bunny CDN playback — paid lesson loads with signed URL, HLS quality levels visible, heatmap renders, progress tracking works
- [ ] T022 Verify token lifecycle — expiry triggers auto-refresh, 3 failures show error card, rate limit returns 429
- [ ] T023 Verify rollback — change DB `video_url` from Bunny CDN to YouTube → plays immediately, zero code deploy

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion (T001, T002) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 completion (T003, T004) — core implementation
- **US5 (Phase 4)**: Depends on US1 API route (T008) — adds rate limiting to existing route
- **Tests (Phase 5)**: Depends on Phase 3 + Phase 4 completion
- **Polish (Phase 6)**: Depends on Phase 5 completion

### User Story Dependencies

- **US1 (P1 — MVP)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **US5 (P5)**: Can start after US1 API route (T008) — adds rate limiting to existing route
- **US2, US3, US4**: No code changes required — existing functionality already supports these scenarios

### Within Each User Story

- Tests (T005, T006) MUST be written and FAIL before implementation
- Types before services
- Services before endpoints
- Endpoints before hooks
- Hooks before UI integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel (different files)
- **Phase 2**: T003 and T004 can run in parallel (different files, no dependencies)
- **Phase 3 Tests**: T005 and T006 can run in parallel (different test files)
- **Phase 3 UI**: T010 and T011 can run in parallel (different component files)
- **Phase 5 Tests**: T015 and T016 can run in parallel (different test files)
- **Phase 6 Checks**: T018 and T019 can run in parallel (different commands)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write unit tests for BunnyCdnTokenSigner in src/lib/bunny/token-signer.test.ts"
Task: "Write unit tests for VideoSourceDetector in src/lib/bunny/video-source-detector.test.ts"

# Launch all parallel UI components together:
Task: "Create VideoPlayerSkeleton in src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/video-player-skeleton.tsx"
Task: "Create VideoErrorDisplay in src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/video-error-display.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002)
2. Complete Phase 2: Foundational (T003, T004)
3. Complete Phase 3: User Story 1 (T005–T013)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 5 → Test independently → Deploy/Demo
4. Complete Tests + Polish → Full feature ready
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- US2 (Admin Editor), US3 (Rollback), US4 (Free Course) require ZERO code changes — existing functionality already supports these scenarios per research.md Decisions 8, 9, 10
