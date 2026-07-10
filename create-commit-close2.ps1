$issues = @(
    @{title="[Bug]: Untyped cast of raw API response to MyRankDto"; body="File: src/hooks/queries/use-leaderboard.ts`n`nres.json() is returned directly as Promise<MyRankDto> with no intermediate raw type."},
    @{title="[Bug]: Non-percentage unit strings aren't mirrored for RTL"; body="File: src/hooks/useRTLMotion.ts`n`ngetX only flips numbers and percentage strings, missing things like px or rem."},
    @{title="[Bug]: Type the raw API response before mapping in use-leaderboard"; body="File: src/hooks/queries/use-leaderboard.ts`n`nres.json() resolves to any, passing unchecked data to UI."},
    @{title="[Bug]: Avoid returning raw error internals in point-events route"; body="File: src/app/api/leaderboard/point-events/route.ts`n`nValidation and catch errors expose internal ZodError structure to client."},
    @{title="[Bug]: Avoid leaking raw error internals in opt-out route"; body="File: src/app/api/leaderboard/opt-out/route.ts`n`nSame pattern as point-events route."},
    @{title="[Bug]: CSV formula injection via displayName"; body="File: src/app/api/leaderboard/[courseId]/export/route.ts`n`ndisplayName is user-controlled and can trigger formulas in Excel."}
)

$issueIds = @()

Write-Host "Creating issues..."
foreach ($i in $issues) {
    $out = gh issue create --title $i.title --body $i.body
    # output is a URL like https://github.com/ScholarX-Labs/web/issues/157
    if ($out -match "\/(\d+)$") {
        $issueIds += $matches[1]
    } else {
        $issueIds += $out
    }
}

Write-Host "Committing changes..."
git add src/
git add coderabbit-findings.md
git commit -m "Fix CodeRabbit findings (Issues 16-21)"

$hash = git rev-parse HEAD

Write-Host "Linking commit $hash and closing issues..."
foreach ($id in $issueIds) {
    gh issue comment $id -b "Resolved by commit $hash"
    gh issue close $id
}

Write-Host "Done!"
