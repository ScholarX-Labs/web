$issues = @(
    @{title="[Bug]: NaN/non-finite points bypasses validation"; body="File: src/domain/leaderboard/application/leaderboard.service.ts`n`nevent.points <= 0 does not reject NaN, Infinity, or -Infinity. Non-finite values pass validation and propagate into score calculations."},
    @{title="[Bug]: Nondeterministic tie-breaker on bulk cache rebuild"; body="File: src/domain/leaderboard/application/leaderboard-cache-rebuild.job.ts`n`nDate.now() is used as a tie-breaker in rankings, but it's re-evaluated on every rebuild. Tied users' relative order will shift unpredictably."},
    @{title="[Bug]: Fire-and-forget cache rebuild risks"; body="File: src/domain/leaderboard/application/leaderboard.service.ts`n`nThree full-course cache rebuilds are triggered per awardPoints call without being awaited or debounced."},
    @{title="[Bug]: Month window boundary mixes UTC extraction with local Date construction"; body="File: src/domain/leaderboard/application/leaderboard-cache-rebuild.job.ts`n`nUTC-based getters feed into local-time new Date(), shifting month boundaries by a day in non-UTC timezones."},
    @{title="[Bug]: Math.floor() drops legitimate fractional weighted scores"; body="File: src/domain/leaderboard/application/leaderboard-scoring.policy.ts`n`nMath.floor() drops fractional points, collapsing distinct learners to the same score."},
    @{title="[Bug]: Disabled Switch + Tooltip not keyboard/screen-reader accessible"; body="File: src/components/leaderboard/LeaderboardOptOutToggle.tsx`n`nThe <div> wrapping a disabled Switch has no tabIndex, so keyboard/screen-reader users can't trigger the tooltip."},
    @{title="[Bug]: CACHE_UNAVAILABLE error won't trigger query-service fallback"; body="File: src/domain/leaderboard/infrastructure/cache/leaderboard-cache.repository.ts`n`nWhen Redis is down, CACHE_UNAVAILABLE error code isn't recognized by LeaderboardQueryService fallback logic."},
    @{title="[Bug]: Unknown activityType values silently corrupt aggregation"; body="File: src/domain/leaderboard/infrastructure/db/point-event.repository.ts`n`nUnmapped activityType values produce undefined keys and NaN totals, silently dropping points."},
    @{title="[Bug]: Redundant unique constraint on idempotencyKey"; body="File: src/db/schema/leaderboard.ts`n`nidempotencyKey has both .unique() on the column definition and an explicit uniqueIndex on the same single column."},
    @{title="[Bug]: Ungated production DB-mock override with any type weakening"; body="File: src/db/index.ts`n`nglobalThis.__MOCK_DB__ is checked unconditionally with no NODE_ENV guard."}
)

$results = @()
foreach ($i in $issues) {
    $url = gh issue create --title $i.title --body $i.body
    $results += "$($i.title): $url"
}
$results | Out-File -FilePath created_issues.txt -Encoding utf8
