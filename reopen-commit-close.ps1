$issueIds = 142..156

# 1. Reopen the issues so we can close them properly
Write-Host "Reopening issues..."
foreach ($id in $issueIds) {
    gh issue reopen $id
}

# 2. Add and commit the changes
Write-Host "Committing changes..."
git add src/
git add coderabbit-findings.md
git commit -m "Fix CodeRabbit findings (Issues 142-156)"

# 3. Get the new commit hash
$hash = git rev-parse HEAD

# 4. Link the commit and close the issues
Write-Host "Linking commit $hash and closing issues..."
foreach ($id in $issueIds) {
    gh issue comment $id -b "Resolved by commit $hash"
    gh issue close $id
}
Write-Host "Done!"
