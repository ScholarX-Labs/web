$issues = @(
    @{title="[Bug]: isArabicEnabled() and routing.ts can disagree"; body="File: src/lib/app-config.ts`n`nrouting.ts determines locales from env vars at module load, while isArabicEnabled() additionally checks a DB-backed config."},
    @{title="[Bug]: as any cast weakens type safety in routing.ts"; body="File: src/lib/i18n/routing.ts`n`nCasting SUPPORTED_LOCALES as any bypasses defineRouting's locale-array typing."},
    @{title="[Bug]: Arrays not sanitized in agent-log, allowing nested PII leak"; body="File: src/lib/debug/agent-log.ts`n`nsanitizeData only recurses into plain objects. When a value is an array, it's copied untouched."},
    @{title="[Bug]: Widened Redis ready check may trade fast fallback for blocking latency"; body="File: src/lib/cache/shared-redis.ts`n`nTreating connecting/connect as ready combined with enableOfflineQueue: true means callers queue commands during connection setup."},
    @{title="[Bug]: remaining/reset come from different rate-limit windows, giving misleading pair"; body="File: src/lib/rate-limiter.ts`n`nremaining uses the min across windows, but reset uses the max."}
)

foreach ($i in $issues) {
    # Create the issue
    $out = gh issue create --title $i.title --body $i.body
    
    # Close it since it's already fixed
    gh issue close $out -c "Solved by codebase updates."
}
