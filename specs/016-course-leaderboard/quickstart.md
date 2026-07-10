# Quickstart: Course Leaderboard

**Feature**: `016-course-leaderboard`
**Target**: Local development from a clean checkout

---

## Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|--------------|
| Node.js | ≥ 20.x | `node --version` |
| pnpm | ≥ 9.x | `pnpm --version` |
| Docker Desktop | ≥ 4.x | `docker --version` |
| Redis (Docker) | ≥ 7.x | see Step 2 |
| PostgreSQL (local or Neon) | ≥ 15.x | via `.env.local` |

---

## Step 1 — Install Dependencies

```bash
pnpm install
```

---

## Step 2 — Start Redis Locally

The leaderboard cache layer requires a Redis 7 instance. Start one via Docker:

```bash
docker run -d \
  --name scholarx-redis \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

Verify it's running:

```bash
docker exec scholarx-redis redis-cli ping
# Expected output: PONG
```

---

## Step 3 — Environment Variables

Copy the example env file and populate it:

```bash
cp .env.example .env.local
```

Add or verify the following leaderboard-specific variables in `.env.local`:

```bash
# Redis connection
REDIS_URL=redis://localhost:6379

# Feature flag (set to "true" to enable the leaderboard tab per course)
LEADERBOARD_ENABLED=true
```

---

## Step 4 — Database Migration

Generate and apply the leaderboard tables:

```bash
# Generate the migration SQL from the Drizzle schema changes
pnpm db:generate

# Inspect the generated migration in drizzle/ (verify before applying)

# Apply to local database
pnpm db:push
```

The migration creates:
- `activity_type` PostgreSQL enum
- `point_events` table with composite indexes
- `leaderboard_opt_outs` table with composite primary key

---

## Step 5 — Seed the Leaderboard

Populate a test course with synthetic learner data to exercise the UI:

```bash
# Replace <test-course-id> with a real UUID from your local courses table
pnpm seed:leaderboard --courseId=<test-course-id> --users=100
```

This script:
1. Creates 100 test user accounts (or reuses existing ones with `seed_` prefix)
2. Inserts randomized `point_events` across all activity types
3. Triggers a synchronous cache rebuild for the seeded course
4. Prints the top-5 leaderboard to stdout as a quick verification

---

## Step 6 — Run the Dev Server

```bash
pnpm dev
```

Navigate to:
```
http://localhost:3000/courses/<your-test-course-slug>/leaderboard
```

You should see:
- A ranked leaderboard of top 10 seeded users
- Your own rank row (if the session user has points)
- The time-window selector (All-Time / This Week / This Month)
- "Last updated X min ago" freshness indicator

---

## Step 7 — Run Tests

```bash
# Unit tests (scoring policy, privacy policy, cache service)
pnpm test src/domain/leaderboard

# Integration tests (DB repository, full route handler)
pnpm test:integration leaderboard

# Component tests
pnpm test src/components/leaderboard
```

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Leaderboard page shows empty state | Redis not running or REDIS_URL not set | Complete Step 2 and Step 3 |
| `pnpm db:push` fails | Missing env var `DATABASE_URL` | Check `.env.local` |
| Seed script errors on missing course | `courseId` not found in DB | Use a valid UUID from `SELECT id FROM courses LIMIT 5` |
| Rankings not updating after seeding | Cache build job not triggered | Run `pnpm redis:rebuild --courseId=<id>` manually |
| "Last updated" showing stale time | Worker not running locally | Ensure dev server is running (it starts the worker inline in dev mode) |
