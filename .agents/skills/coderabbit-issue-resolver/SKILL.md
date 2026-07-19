---
name: coderabbit-issue-resolver
description: >-
  Automates the workflow for resolving CodeRabbit findings step-by-step: fixing the code, creating a GitHub issue, committing the fix, linking the issue, closing it, and marking the finding as Solved.
---

# CodeRabbit Issue Resolver

## Overview
This is an instruction-only skill that guides you through the process of resolving findings listed in a CodeRabbit findings markdown file (e.g., `coderabbit-findings.md`). 
Because each finding needs separate code fixes and commits, this skill provides a strict sequential protocol to follow for each bug to ensure clean Git history and proper GitHub tracking.

## Dependencies
- `gh` (GitHub CLI) must be authenticated and available in the environment.
- `git` must be available.
- `COMMIT_CONVENTIONS.md` should be present in the repository and adhered to for commit messages.

## Workflow

When asked to resolve CodeRabbit findings, you MUST iterate through the unresolved findings in the provided markdown file one by one. For **each finding**, complete the following sequence completely before moving to the next finding:

### 1. Fix the Code
- Read the specific finding.
- Investigate and edit the necessary files to fix the issue.
- Verify the fix if applicable.

### 2. Create GitHub Issue
- Use the `run_command` tool to run `gh issue create` and create a new issue for this specific finding.
  - Set the title to match the finding (e.g., `[Bug]: <Finding Title>`).
  - Add a short body referencing the finding details.
- Capture the newly created Issue ID from the command output.
- **Error Handling:** If the `gh` command fails (e.g., due to permissions or rate limits), DO NOT proceed or loop indefinitely. Stop immediately and ask the user for guidance.

### 3. Commit the Fix
- Stage the files you modified using `git add <files>`.
- Read `COMMIT_CONVENTIONS.md` (if it exists in the repo) to determine the correct commit message format.
- Run `git commit -m "<Your Commit Message>"`.
- **Error Handling:** If the commit fails (e.g., due to pre-commit hooks or formatting), attempt to resolve the formatting error once. If it fails again, stop and ask the user for guidance.

### 4. Link and Close the Issue
- Get the hash of the commit you just created (e.g., using `git rev-parse HEAD`).
- Comment on the GitHub issue to link it: `gh issue comment <IssueID> -b "Resolved by commit <Hash>"`
- Close the GitHub issue: `gh issue close <IssueID>`
- **Error Handling:** Stop and ask the user if `gh` commands fail.

### 5. Mark Finding as Solved
- Edit the markdown file containing the findings.
- Append ` - Solved` to the markdown header for this specific finding to track progress.

### 6. Repeat
- Once steps 1-5 are complete for the current finding, move on to the next unresolved finding in the file and repeat the entire process from step 1.

## Common Mistakes
- Committing multiple fixes together instead of one by one. You must commit *each* fix separately.
- Forgetting to link the commit hash in the GitHub issue before closing it.
- Proceeding when `gh` fails. Always pause and ask the user if GitHub CLI issues occur.
