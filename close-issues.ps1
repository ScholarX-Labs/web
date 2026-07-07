$issueIds = 142..151
foreach ($id in $issueIds) {
    gh issue close $id -c "Solved by codebase updates."
}
