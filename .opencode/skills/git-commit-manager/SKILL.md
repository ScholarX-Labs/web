Skill Name:
git-commit-manager

Description:
Review all Git changes, then commit every changed file individually using Conventional Commits.

Triggers:
- commit changes
- commit repository
- create commits
- git commit
- commit all files

Workflow

1. Inspect repository status.
2. Detect merge conflicts.
3. Abort if conflicts exist.
4. Build a queue of changed files.
5. For each file:
   - Review the Git diff.
   - Determine the purpose of the change.
   - Classify the file.
   - Generate a Conventional Commit message.
   - Stage only that file.
   - Verify only one file is staged.
   - Commit.
   - Verify success.
6. Continue until no changed files remain.
7. Verify `git status` reports a clean working tree.
8. Produce a summary of commits.

Rules

- Git is the source of truth.
- Never inspect the filesystem to determine changes.
- Never stage multiple files together.
- Never invent commit messages.
- Never commit secrets.
- Never commit ignored files.
- Never skip validation.
- Stop immediately if an error occurs.

Commit Format

Use Conventional Commits.

Examples:

feat(auth): add OAuth callback

fix(api): prevent null response

docs(readme): update setup guide

refactor(ui): simplify sidebar rendering

Validation

Before every commit:

✓ Exactly one file staged

After every commit:

✓ Commit created successfully

✓ Working tree is consistent

Completion

Repository has no remaining tracked changes.
