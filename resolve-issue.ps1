param (
    [int]$IssueNum,
    [string[]]$Files,
    [string]$Title,
    [string]$Message
)
Write-Host "Creating issue for $Title..."
$body = "Issue $IssueNum from coderabbit-findings.md"
$out = gh issue create --title $Title --body $body
$id = if ($out -match "\/(\d+)$") { $matches[1] } else { $out }

Write-Host "Committing files: $($Files -join ', ')..."
foreach ($f in $Files) {
    git add $f
}
git commit -m $Message

$hash = git rev-parse HEAD
Write-Host "Linking commit $hash to issue $id..."
gh issue comment $id -b "Resolved by commit $hash"
gh issue close $id

Write-Host "Marking as solved in MD..."
$content = Get-Content coderabbit-findings.md -Raw
# Use regex to find the header and append - Solved
$pattern = "(?m)^(## $IssueNum\..*?)( - Solved)?$"
$content = [regex]::Replace($content, $pattern, "`$1 - Solved")
Set-Content coderabbit-findings.md -Value $content -NoNewline

Write-Host "Done issue $IssueNum"
