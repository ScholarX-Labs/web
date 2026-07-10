# Commit Message Specification

> **Version:** 2.0.0
> **Status:** Repository Standard — Normative
> **Applies To:** Humans, AI Coding Agents, CI/CD Systems, Release Tooling
> **Conformance Basis:** Conventional Commits 1.0.0, Semantic Versioning 2.0.0
> **Key Words:** The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Design Principles](#2-design-principles)
3. [Commit Message Grammar](#3-commit-message-grammar)
4. [Header](#4-header)
5. [Body](#5-body)
6. [Footer](#6-footer)
7. [Commit Type Decision Procedure](#7-commit-type-decision-procedure)
8. [Atomicity and Granularity](#8-atomicity-and-granularity)
9. [Commit Lifecycle](#9-commit-lifecycle)
10. [Semantic Versioning Relationship](#10-semantic-versioning-relationship)
11. [Branch Naming Relationship](#11-branch-naming-relationship)
12. [Merge, Squash, and Revert Policy](#12-merge-squash-and-revert-policy)
13. [Monorepo Guidelines](#13-monorepo-guidelines)
14. [Dependency Update Rules](#14-dependency-update-rules)
15. [Generated and Vendored Files Policy](#15-generated-and-vendored-files-policy)
16. [Security Guidelines](#16-security-guidelines)
17. [Documentation Guidelines](#17-documentation-guidelines)
18. [CI/CD and Automation Compatibility](#18-cicd-and-automation-compatibility)
19. [AI Agent Requirements](#19-ai-agent-requirements)
20. [Human Reviewer Expectations](#20-human-reviewer-expectations)
21. [Common Mistakes and Anti-Patterns](#21-common-mistakes-and-anti-patterns)
22. [Edge Cases](#22-edge-cases)
23. [Examples Library](#23-examples-library)
24. [Frequently Asked Questions](#24-frequently-asked-questions)
25. [Glossary](#25-glossary)
26. [Appendix](#26-appendix)
27. [Commit Quality Checklist](#27-commit-quality-checklist)
28. [Summary](#28-summary)

---

## 1. Introduction

### 1.1 Purpose

This document is the official, normative specification for Git commit messages in this repository. It exists to make the commit history a reliable, machine-parseable, and human-readable record of *why* the codebase changed, not merely *what* changed (the diff already shows that).

A commit history that conforms to this specification enables:

- Automated changelog generation
- Automated semantic version bumps
- Fast, confident code review
- Reliable `git bisect` and `git blame` investigations
- Safe, surgical reverts
- Consistent behavior when AI coding agents generate commits on behalf of humans

### 1.2 Scope

This specification governs:

- The syntax and semantics of commit messages
- The selection of commit type and scope
- Commit granularity and atomicity
- The relationship between commits, branches, releases, and version numbers
- Requirements specific to autonomous AI agents authoring commits

This specification does **not** govern code style, testing strategy, or branch protection rules, except where they directly intersect with commit authorship.

### 1.3 Audience

This document MUST be treated as authoritative by:

- Human contributors (all experience levels)
- AI coding agents (Claude Code, GitHub Copilot, Cursor, Aider, Windsurf, Cline, Roo Code, Continue, Gemini CLI, Codex CLI, OpenCode, and equivalent tools)
- CI/CD pipelines that lint, validate, or act upon commit messages
- Release automation (semantic-release, changesets, release-please, or equivalent)

### 1.4 Relationship to Conventional Commits 1.0.0

This specification is a **strict superset** of [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). Every commit that conforms to this document also conforms to Conventional Commits 1.0.0. Where this document is silent, Conventional Commits 1.0.0 governs. Where this document adds constraints (closed type list, mandatory scope, atomicity rules, AI agent procedures), those constraints are additive, not contradictory.

---

## 2. Design Principles

These principles underlie every rule in this document. When a rule's application is ambiguous, resolve the ambiguity by returning to these principles.

| Principle | Statement |
|---|---|
| **Atomicity** | A commit MUST represent exactly one logical, reviewable, revertible unit of change. |
| **Determinism** | Given the same diff and the same intent, two different authors (human or AI) SHOULD produce functionally equivalent commit messages. Subjective, mood-based phrasing is discouraged. |
| **Legibility** | A commit message MUST be understandable by an engineer unfamiliar with the change, six months after the fact, without access to the author. |
| **Machine Parseability** | A commit header MUST be parseable by a regular expression without natural-language inference. |
| **Traceability** | A commit SHOULD make it possible to answer: what changed, why it changed, what area it touches, and what (if anything) it is linked to. |
| **Reversibility** | A commit SHOULD be revertible in isolation without requiring unrelated changes to also be reverted. |
| **Minimal Surface Area** | A commit SHOULD touch the smallest set of files necessary to fully implement one logical change — no more, no less. |
| **Honesty** | A commit message MUST accurately describe the actual diff. It MUST NOT describe intended, planned, or aspirational behavior that the diff does not implement. |

---

## 3. Commit Message Grammar

The commit message format is defined below in ABNF-style notation, consistent with Conventional Commits 1.0.0.

```
<commit-message>  ::= <header> "\n" [ "\n" <body> ] [ "\n" <footer> ]

<header>          ::= <type> [ "(" <scope> ")" ] [ "!" ] ":" " " <subject>

<type>            ::= "feat" | "fix" | "refactor" | "perf" | "docs"
                     | "style" | "test" | "build" | "ci" | "chore" | "revert"

<scope>           ::= 1*( lowercase-alnum / "-" )

<subject>         ::= imperative-phrase, <= 72 characters, no trailing period

<body>            ::= 1*( free-text-paragraph )

<footer>          ::= 1*( footer-token ": " footer-value )

<footer-token>    ::= "BREAKING CHANGE" | "Refs" | "Closes" | "Fixes"
                     | "Reviewed-by" | "Co-authored-by" | "Signed-off-by"
```

Structurally:

```
<type>(<scope>)!: <subject>

<body>

<footer>
```

- The **header** is REQUIRED.
- The **body** is OPTIONAL but RECOMMENDED whenever the "why" is not self-evident from the subject.
- The **footer** is OPTIONAL and REQUIRED only when a breaking change or issue reference exists.
- The `!` after `<scope>` is OPTIONAL shorthand indicating a breaking change; if used, a `BREAKING CHANGE:` footer MUST still be present.

---

## 4. Header

### 4.1 Type

The type is a REQUIRED, closed-vocabulary token identifying the *category* of change. AI agents and linters MUST reject any type not in this table.

| Type | Purpose | SemVer Impact |
|---|---|---|
| `feat` | Introduces new, user- or API-observable functionality | MINOR |
| `fix` | Corrects incorrect behavior | PATCH |
| `refactor` | Restructures code with no observable behavior change | none |
| `perf` | Improves performance with no observable behavior change other than speed/resource use | PATCH |
| `docs` | Documentation-only changes | none |
| `style` | Formatting, whitespace, linting — no logic change | none |
| `test` | Adds or updates tests only | none |
| `build` | Changes to build tooling, compilation, packaging, or dependencies | none (PATCH/MINOR/MAJOR if a dependency bump changes public behavior — see §14) |
| `ci` | Changes to CI/CD pipeline configuration | none |
| `chore` | Maintenance work that fits no other category | none |
| `revert` | Reverts a previous commit | mirrors the reverted commit's impact, inverted |

Rules:

- A commit MUST use exactly one type. If a change legitimately requires two types (e.g., a fix that also adds a test), it MUST be split into two commits (see §8).
- Custom or invented types MUST NOT be used. If no type fits, the correct action is to reconsider whether the change is atomic — not to invent a type.
- `chore` MUST NOT be used when a more specific type applies. It is the type of last resort, not a default.

### 4.2 Scope

The scope is a REQUIRED, lowercase, single-word (or hyphenated) token identifying *where* the change occurred.

> **Deviation from Conventional Commits 1.0.0:** the upstream spec treats scope as optional. This repository makes scope REQUIRED because it materially improves changelog readability and searchability at scale. An AI agent MUST always supply a scope; if genuinely no scope applies (e.g., a repository-wide chore), use `repo`.

#### 4.2.1 Scope Philosophy

Scope answers "where," not "what" (that is the subject's job) and not "why" (that is the body's job). Scope SHOULD correspond to a directory, module, package, or well-known subsystem — something a reviewer can map to a location in the codebase within a few seconds.

#### 4.2.2 Canonical Scope List

Maintain a canonical, versioned list of scopes in `.commitlintrc` (see Appendix B). The following are common defaults; adapt to your codebase:

```
auth · api · ui · dashboard · navbar · footer · profile · settings
database · prisma · redis · cache · docker · github · ci · build
config · docs · readme · tests · deps · release · infra
```

Rules:

- Scope MUST be lowercase.
- Scope MUST NOT contain spaces.
- Scope SHOULD be singular (`api`, not `apis`).
- Scope SHOULD be as specific as possible; prefer `navbar` over `ui` when the change is confined to the navbar.
- New scopes MAY be introduced as the codebase grows; they SHOULD be added to the canonical list in the same commit that first uses them.

#### 4.2.3 Monorepo Scope Rules

See §13.

### 4.3 Subject

The subject is a REQUIRED, single-line summary of the change.

The subject MUST:

- Use the imperative mood ("add", "fix", "remove" — not "added", "fixes", "removing"). Test: the subject should complete the sentence "If applied, this commit will **&lt;subject&gt;**."
- Start with a lowercase letter.
- Contain no trailing period.
- Not exceed 72 characters (RECOMMENDED hard limit for git-log/terminal readability; git itself imposes no limit, but tooling and terminals do).
- Describe *what* the commit does, at the level of observable effect — not implementation minutiae.
- Be written in English, unless the repository has an explicitly documented alternate-language policy.

| Bad | Why it fails | Good |
|---|---|---|
| `fixed bug` | Past tense, vague, no scope, no subsystem | `fix(api): prevent duplicate invoice creation` |
| `Update stuff` | Not imperative-testable, meaningless | `refactor(auth): extract token validation into helper` |
| `Changes` | Contains zero information | `feat(profile): support avatar uploads` |
| `feat(auth): Added new login.` | Wrong case, past tense, trailing period | `feat(auth): add OAuth login` |

---

## 5. Body

The body is OPTIONAL and SHOULD be included whenever the reason for a change is not obvious from the subject alone.

Rules:

- The body MUST be separated from the header by exactly one blank line.
- The body SHOULD explain **why** the change was made and what trade-offs were considered — not restate the diff line-by-line.
- The body SHOULD be wrapped at ~72 columns per line for terminal readability.
- The body MAY contain multiple paragraphs, separated by blank lines.
- The body MUST NOT contradict the header.
- The body MUST NOT describe functionality that is not present in the diff.

**Example:**

```
fix(auth): prevent refresh token replay

The previous implementation allowed a single refresh token to be
exchanged more than once, enabling replay attacks if a token was
intercepted.

Introduce single-use token rotation: each refresh invalidates the
prior token immediately, before issuing a new one.
```

---

## 6. Footer

The footer is OPTIONAL except where §6.1 or §6.2 makes it REQUIRED.

### 6.1 Breaking Changes

A commit that introduces a breaking change MUST include a footer beginning with `BREAKING CHANGE:` followed by a description of what breaks and, where applicable, a migration path.

```
feat(api): redesign authentication endpoints

BREAKING CHANGE: the /login endpoint now returns OAuth 2.0 bearer
tokens instead of opaque session identifiers. Clients must update
their token storage and refresh logic. See MIGRATION.md#v3.
```

A commit MAY additionally mark the header with `!` immediately before the colon (e.g., `feat(api)!: redesign authentication endpoints`) as a fast visual signal, but this MUST NOT replace the `BREAKING CHANGE:` footer.

### 6.2 Issue References

Use the following footer tokens to link commits to issue trackers:

| Token | Meaning |
|---|---|
| `Refs: #123` | Related to, but does not close, issue #123 |
| `Closes: #123` | Merging/landing this commit closes issue #123 |
| `Fixes: #123` | Synonym for `Closes`, preferred for bug trackers that distinguish "fixed" from "closed" |

Rules:

- Issue numbers MUST NOT be invented. If no verified issue number exists, omit the footer entirely.
- An AI agent MUST NOT fabricate an issue reference under any circumstance, including when the user's prompt implies one exists but does not supply the number.

### 6.3 Other Trailers

The footer MAY additionally include standard Git trailers:

```
Co-authored-by: Jane Doe <jane@example.com>
Signed-off-by: Jane Doe <jane@example.com>
Reviewed-by: John Smith <john@example.com>
```

Multiple footer trailers are permitted; each occupies its own line.

---

## 7. Commit Type Decision Procedure

Use this procedure, in order, to select a type. Stop at the first matching question.

1. **Is this reverting a previous commit verbatim?** → `revert`
2. **Does it change what the system does, from a user's or API consumer's point of view?** → `feat` (if adding capability) or `fix` (if correcting incorrect behavior)
3. **Does it only make the code run faster or use fewer resources, with identical output?** → `perf`
4. **Does it restructure code with provably identical behavior?** → `refactor`
5. **Does it only touch formatting/whitespace/lint auto-fixes?** → `style`
6. **Does it only add or modify tests, with no production code change?** → `test`
7. **Does it only touch documentation?** → `docs`
8. **Does it only touch build tooling, compiler config, or packaging?** → `build`
9. **Does it only touch CI/CD pipeline definitions?** → `ci`
10. **Does none of the above apply?** → `chore` (last resort — reconsider whether the change should be split)

Precedence rules when a change appears to satisfy more than one question:

- `fix` takes precedence over `chore` (Golden Rule: prefer `fix` over `chore` when correcting a bug).
- `feat` takes precedence over `refactor` when new capability is added, even if refactoring was also required to support it — but only if the refactor is not independently extractable. If it is extractable, split into two commits.
- `refactor` MUST NOT be used if there is any behavior change, however minor. If in doubt, treat it as `fix` or `feat` and explain the behavior delta in the body.

---

## 8. Atomicity and Granularity

### 8.1 Definition of Atomic

A commit is atomic if and only if:

1. It compiles/builds successfully in isolation.
2. Existing tests pass against it (new tests introduced by the same commit also pass).
3. It can be reverted without breaking unrelated functionality.
4. It can be described completely by one `<type>(<scope>): <subject>` header.
5. A reviewer can evaluate its correctness without needing to read unrelated hunks.

### 8.2 Splitting Guidance

Split a change into multiple commits when it spans:

- Multiple unrelated scopes (e.g., `auth` and `navbar`)
- Multiple types (e.g., a `fix` bundled with an unrelated `feat`)
- Independently revertible units (e.g., a dependency bump plus a feature that depends on it — bump first, feature second)

### 8.3 When Multiple Files Are Acceptable in One Commit

Multiple files MAY be included in a single commit when they are all necessary to implement **one** logical change — for example, a new API route plus its route registration, its test, and its type definitions. The test for inclusion is: *"If I revert this commit, does the codebase return to a fully consistent, working state?"*

### 8.4 When a Single File Requires Multiple Commits

A single file MAY need to be split across multiple commits (via `git add -p`) when it contains multiple unrelated hunks — for example, an incidental formatting fix and a behavioral fix in the same file. Stage and commit each hunk separately with its correct type.

---

## 9. Commit Lifecycle

| Stage | Guidance |
|---|---|
| **Staging** | Stage only the files/hunks belonging to one logical change (`git add -p` where necessary). Never `git add .` reflexively. |
| **Drafting** | Write the header first. Ask whether it alone would be understood in `git log --oneline`. Add a body only if the "why" needs explanation. |
| **Pre-commit** | Run linters, formatters, and tests locally or via commit hooks before committing. Never commit a known-broken build. |
| **Local amend** | `git commit --amend` MAY be used to correct a commit that has not yet been pushed or shared. |
| **After push (shared history)** | Once a commit is pushed to a shared branch, it MUST be treated as immutable. Corrections MUST be made via a new commit, not `--amend` + force-push, unless the branch is explicitly a personal feature branch with documented force-push conventions. |
| **Rebase interaction** | Interactive rebase (`git rebase -i`) MAY be used prior to opening a pull request to squash "fixup" commits into their logical parent, provided the final history remains atomic per §8. |
| **Merge** | See §12. |

---

## 10. Semantic Versioning Relationship

When commits drive automated releases (e.g., via semantic-release), the following mapping to [SemVer 2.0.0](https://semver.org/) MUST be used:

| Trigger | Version Bump |
|---|---|
| Any commit with a `BREAKING CHANGE:` footer or `!` marker | MAJOR |
| `feat` | MINOR |
| `fix`, `perf` | PATCH |
| `docs`, `style`, `test`, `build`, `ci`, `chore`, `refactor` | none (no release) |
| `revert` | Inverse of the reverted commit's original impact |

A monorepo with independently versioned packages MUST scope this mapping per-package (see §13.3).

---

## 11. Branch Naming Relationship

While branch naming is not strictly part of commit message grammar, consistency between the two SHOULD be maintained for traceability:

```
<type>/<scope>-<short-description>

feat/auth-passkey-support
fix/api-duplicate-invoices
chore/deps-eslint-update
```

The branch's primary type SHOULD match the type of its main commit(s). Branches containing genuinely mixed types SHOULD be split before merge, consistent with §8.

---

## 12. Merge, Squash, and Revert Policy

### 12.1 Merge Commits

Where a repository uses merge commits (`git merge --no-ff`), the merge commit message SHOULD follow the same header grammar, typically:

```
chore(release): merge feat/auth-passkey-support into main
```

Merge commits MUST NOT be the sole record of a multi-commit feature's rationale — the underlying commits carry that responsibility.

### 12.2 Squash Merge Guidance

When a repository squashes pull requests into a single commit on the target branch:

- The squashed commit message MUST be rewritten to conform fully to this specification — it MUST NOT simply concatenate all intermediate commit messages (which are frequently non-atomic "wip", "fixup", or "address review comments" commits).
- The PR author or merging AI agent MUST re-derive the type, scope, and subject from the *net effect* of the full diff, not from the least common denominator of intermediate messages.
- Intermediate commit history MAY remain visible in the pull request UI for review context even after squashing.

### 12.3 Revert Strategy

- Use `git revert`, not manual inverse edits, whenever reverting a merged commit — this preserves history and produces an automatic `revert` commit.
- The revert commit message MUST reference the original commit's hash and header:

```
revert(auth): revert "feat(auth): add passkey authentication"

This reverts commit a1b2c3d4. Passkey login caused a regression in
Safari 17 (see #204). Reverting until the WebAuthn polyfill is fixed.
```

- Partial reverts (reverting only part of a commit's change) MUST be expressed as a new, forward-moving commit with an accurate type of its own — not as a `revert`, since `revert` implies full inversion.

---

## 13. Monorepo Guidelines

### 13.1 Package Scoping

In a monorepo, the scope MUST identify the affected package, not just a generic subsystem:

```
feat(web-auth): add passkey support
fix(api-users): validate email format
build(pkg-ui-kit): bump storybook to v9
```

### 13.2 Cross-Package Changes

A change spanning multiple packages MUST either:

- Be split into one commit per package (preferred, maximizes atomicity), or
- Use a shared umbrella scope (e.g., `workspace`) only when the packages are versioned and released together as a single unit.

### 13.3 Release Trains

Where packages are released independently, each package's version MUST be computed only from commits scoped to that package. Where packages are released together ("fixed"/"locked" versioning), the highest-impact commit type across all packages in the release determines the shared version bump.

---

## 14. Dependency Update Rules

| Update Type | Type | Example |
|---|---|---|
| Patch/minor dependency bump, no code change required | `build` | `build(deps): update axios to 1.12` |
| Major dependency bump requiring code changes | `build` (if internal-only) or `feat`/`fix`!` (if it changes public behavior) | `build(nextjs): upgrade to next.js 16` |
| Security-driven dependency bump | `build` with a `Security:` note, or `fix` if it corrects an exploitable behavior | `build(deps): bump lodash to 4.17.21 (CVE-2021-23337)` |
| Dev-only dependency (linter, test runner, type defs) | `chore` | `chore(deps): update eslint to 9.x` |

Rules:

- The subject SHOULD name the exact dependency and target version where practical.
- A major bump that changes the package's own public API MUST be marked as a breaking change (§6.1) if it propagates to this codebase's own consumers.
- Automated dependency bots (Dependabot, Renovate) SHOULD be configured to emit messages conforming to this table.

---

## 15. Generated and Vendored Files Policy

- Generated files (build output, lockfiles, compiled assets) MUST NOT be committed unless the project's build process explicitly requires them to be version-controlled (e.g., `package-lock.json`, `Cargo.lock`, vendored dependencies in air-gapped environments).
- When a generated file is intentionally committed, it MUST be included in the same commit as the source change that produced it — never as a separate, undocumented commit.
- Regenerating a lockfile with no dependency version change MUST NOT be committed at all; it is noise.
- Commits whose only content is a regenerated lockfile from a dependency bump SHOULD use `build(deps): ...` and clearly state the version delta.

---

## 16. Security Guidelines

- Commits MUST NOT include secrets: `.env` files, API keys, private keys, certificates, access tokens, passwords, or credentials of any kind, in either the diff or the commit message.
- If a secret is committed accidentally, the fix is **not** a new commit removing it — the secret remains in history. It MUST be treated as compromised (rotate it) and history MUST be scrubbed via the project's documented history-rewriting procedure.
- A commit fixing a security vulnerability SHOULD use `fix`, with scope indicating the affected subsystem, and MAY reference a CVE in the footer once public disclosure has occurred:

```
fix(auth): invalidate sessions on password change

Refs: CVE-2026-XXXXX
```

- Prior to coordinated public disclosure, commit messages for embargoed vulnerabilities SHOULD avoid describing the exploit mechanism in detail; a neutral description ("harden input validation") MAY be used with full detail added to the footer only after disclosure.
- AI agents MUST NOT include secrets found in the working tree in any commit message, log, or generated documentation, even when quoting file contents for explanatory purposes.

---

## 17. Documentation Guidelines

- Documentation-only changes MUST use `docs`, scoped to the affected surface (`readme`, `api`, `changelog`, etc.).
- A `feat` or `fix` commit that also requires accompanying documentation updates SHOULD include those doc updates in the same commit when the documentation describes the exact behavior being introduced or fixed (this preserves atomicity of "feature + its own docs" as one revertible unit). Unrelated documentation improvements MUST be separated into their own `docs` commit.
- Auto-generated API reference documentation MUST NOT be hand-edited; regenerate it and commit the output alongside the source change that altered the API.

---

## 18. CI/CD and Automation Compatibility

### 18.1 Commit Linting

Repositories SHOULD enforce this specification automatically via a commit-msg hook (e.g., `commitlint` with `@commitlint/config-conventional`, extended with the closed type/scope lists in Appendix B). A non-conforming commit MUST be rejected before it enters shared history.

### 18.2 Automated Changelog Generation

Changelogs SHOULD be generated automatically from commit history (e.g., `conventional-changelog`, `release-please`, `changesets`), grouped by type, with `feat` and `fix` surfaced most prominently and `BREAKING CHANGE` entries called out separately at the top.

### 18.3 Automated Semantic Release

Where semantic-release tooling is in use, it MUST rely exclusively on the type/footer mapping in §10. No manual version bump commits are required or permitted outside that automation.

---

## 19. AI Agent Requirements

This section is binding on any autonomous or semi-autonomous coding agent authoring commits in this repository.

### 19.1 Mandatory Pre-Commit Procedure

Before authoring a commit, an agent MUST, in order:

1. Read the full diff to be committed (`git diff --staged`), not just the user's natural-language description of the change.
2. Identify all files touched and confirm they belong to a single logical change per §8.
3. If the staged diff spans more than one logical change, split it (`git reset` + selective `git add -p`) before committing, rather than writing a compound message.
4. Select a type using the procedure in §7.
5. Select a scope from the canonical list (§4.2.2), or propose a new one if genuinely absent.
6. Draft a subject in the imperative mood, ≤ 72 characters.
7. Add a body only if the rationale is non-obvious from the diff and subject alone.
8. Verify no secrets are present in the diff (§16).
9. Verify the working tree is otherwise clean or that unrelated changes remain unstaged.
10. Execute the commit and verify success (non-zero exit code or hook rejection MUST be treated as failure, not silently ignored).

### 19.2 Deterministic Rules (Non-Negotiable)

- An agent MUST NOT invent commit types outside the closed list in §4.1.
- An agent MUST NOT invent issue/PR numbers, CVE IDs, or co-author identities.
- An agent MUST NOT describe functionality that is not present in the actual diff, including functionality the user *asked for* but that the diff does not yet implement.
- An agent MUST NOT stage or commit files it was not instructed to change and that are not required for the logical change to be complete (e.g., unrelated formatting drift from an IDE auto-save).
- An agent MUST NOT commit code that fails the project's existing test suite or build, except in a repository/branch explicitly designated for work-in-progress commits.
- An agent MUST prefer `fix` over `chore` when the change corrects incorrect behavior, and MUST prefer `feat` over `refactor` when the change adds new capability rather than merely restructuring existing capability.
- An agent MUST use `refactor` only when it can state affirmatively that no observable behavior changed.
- An agent SHOULD ask the human operator for confirmation before force-pushing, rewriting shared history, or committing to a protected branch.

### 19.3 Prohibited Behaviors

An agent MUST NOT:

- Produce vague subjects ("update code", "fix stuff", "misc changes").
- Bundle multiple unrelated concerns to save time or reduce commit count.
- Commit generated files that are excluded by `.gitignore` "just in case."
- Silently retry a failed commit hook by disabling the hook.
- Fabricate a `BREAKING CHANGE:` footer for a non-breaking change, or omit one for a breaking change.

### 19.4 Validation Algorithm (Reference Pseudocode)

```
function validate_commit(message, diff):
    header = message.lines[0]
    match = HEADER_REGEX.match(header)
    if not match:
        reject("header does not match <type>(<scope>)!: <subject>")

    type, scope, breaking_marker, subject = match.groups()

    if type not in ALLOWED_TYPES:
        reject(f"unknown type '{type}'")

    if scope not in CANONICAL_SCOPES and not ALLOW_NEW_SCOPES:
        reject(f"unknown scope '{scope}'")

    if not subject[0].islower():
        reject("subject must start lowercase")

    if subject.endswith("."):
        reject("subject must not end with a period")

    if len(subject) > 72:
        reject("subject exceeds 72 characters")

    if not is_imperative_mood(subject):
        warn("subject may not be in imperative mood")

    if breaking_marker and "BREAKING CHANGE:" not in message:
        reject("'!' marker requires a BREAKING CHANGE footer")

    if contains_secret_pattern(diff):
        reject("diff appears to contain a secret")

    if touches_multiple_unrelated_scopes(diff, scope):
        reject("diff spans multiple logical changes; split the commit")

    return ACCEPT
```

---

## 20. Human Reviewer Expectations

A reviewer evaluating conformance to this specification SHOULD verify:

- The header alone communicates what changed and where, without opening the diff.
- The type accurately reflects the nature of the change (per §7), not merely the author's preference.
- The commit is atomic (§8) — the diff contains no unrelated hunks.
- Any breaking change is flagged and explained.
- No secrets are present.
- The message would still make sense to someone with zero context, six months from now.

Reviewers MAY request commit message amendments (via interactive rebase, pre-merge) without requesting code changes, when the message alone fails these checks.

---

## 21. Common Mistakes and Anti-Patterns

| Anti-Pattern | Problem | Correction |
|---|---|---|
| `chore: fix bug` | Wrong type; `chore` is not for bug fixes | `fix(<scope>): <specific description>` |
| `feat(auth): add login, fix navbar, update deps` | Multiple unrelated changes in one commit | Split into three commits |
| `fix: fixed the thing that was broken` | Past tense, no scope, no specificity | `fix(cache): avoid stale session lookup` |
| Commit message describing a feature the code doesn't yet fully implement | Dishonest / misleading history | Only describe what the diff actually does; use `wip` branch conventions, not misleading `feat` commits, for incomplete work |
| Committing `.env.local` "temporarily" | Secret exposure risk | Never commit; use `.env.example` with placeholder values |
| `refactor(payments): switch to new pricing tiers` | Behavior clearly changes (`refactor` misused) | Use `feat` or `fix`, and explain the behavior delta |
| Rewriting pushed, shared commit history without coordination | Breaks collaborators' local history | Use a new commit or coordinate a rebase explicitly |
| A 4,000-line "add feature X" commit | Impossible to review meaningfully | Split into a reviewable sequence of atomic commits |

---

## 22. Edge Cases

- **Multi-type changes discovered mid-implementation:** if while implementing a `feat` you discover and fix an unrelated bug, stop and commit the fix separately (`fix`) before continuing the feature work.
- **Work-in-progress commits:** permitted only on personal/feature branches that are squashed or rebased before merging into a shared branch; WIP commits MUST NOT reach `main`/`develop` in their raw form.
- **Pure rename/move with no content change:** use `refactor(<scope>): move <file> to <new-location>`; Git's rename detection preserves history regardless of type.
- **Initial commit of a new repository or package:** use `chore(repo): initialize project` or a scoped equivalent; avoid `feat` for pure scaffolding with no functional code yet.
- **Merge conflict resolution commits:** these are typically part of the merge commit itself; if a separate commit is needed post-merge to fix a bad resolution, treat it as a normal `fix` scoped to the affected area.
- **Formatting-only changes across many files (e.g., running Prettier repo-wide):** use a single `style` commit isolated from all other changes, so it can be excluded from `git blame` via `.git-blame-ignore-revs`.
- **Empty commits:** MUST NOT be created except for deliberate CI-trigger purposes, and only with an explicit `chore(ci): trigger pipeline` message.

---

## 23. Examples Library

### 23.1 Backend Service

```
feat(api-orders): add idempotency key support to order creation

Duplicate network retries could previously create duplicate orders.
Clients may now supply an Idempotency-Key header; duplicate keys
within a 24h window return the original response instead of creating
a new order.

Closes: #512
```

### 23.2 Frontend Application

```
fix(dashboard): prevent chart re-render loop on filter change

The filter reducer created a new array reference on every render,
causing useEffect to re-fire continuously. Memoize the filter list.
```

### 23.3 Infrastructure / DevOps

```
build(docker): reduce final image size from 1.2GB to 340MB

Switch to a multi-stage build and drop dev dependencies from the
production layer.
```

### 23.4 Documentation

```
docs(readme): add local HTTPS setup instructions

New contributors were blocked by browser mixed-content warnings when
running the dev server. Document the mkcert-based setup.
```

### 23.5 Tests

```
test(auth): add coverage for expired refresh token rejection

No existing test asserted that an expired refresh token is rejected
with 401 rather than silently issuing a new access token.
```

### 23.6 Security Fix

```
fix(uploads): reject path traversal in filename parameter

User-supplied filenames were passed to the filesystem without
sanitization, allowing "../" sequences to write outside the upload
directory. Normalize and validate paths before use.

Refs: CVE-2026-41022
```

### 23.7 Performance Improvement

```
perf(search): reduce query latency via composite index

Add a composite index on (tenant_id, created_at) to eliminate the
full table scan observed in slow query logs (p95: 1.8s -> 40ms).
```

### 23.8 Dependency Update

```
build(deps): update axios to 1.12

Patch release; no code changes required.
```

```
build(nextjs): upgrade to next.js 16

BREAKING CHANGE: the deprecated `next/image` legacy loader API has
been removed upstream. Custom image loaders must migrate to the new
loader signature described in MIGRATION.md.
```

### 23.9 Database Migration

```
feat(database): add audit_log table

Introduce append-only audit logging for all mutating admin actions,
required for the upcoming SOC 2 audit.
```

### 23.10 Rollback

```
revert(payments): revert "feat(payments): enable installment plans"

This reverts commit 9f1e2ab. The installment calculation produced
incorrect totals for currencies with zero decimal places (e.g. JPY).
Reverting until the rounding logic is fixed.

Refs: #618
```

### 23.11 Breaking Change

```
feat(api)!: require API version header on all requests

BREAKING CHANGE: requests without an `X-API-Version` header now
receive a 400 response instead of defaulting to v1 behavior. Clients
must explicitly opt into a version.
```

### 23.12 Monorepo

```
fix(api-users): validate email format before persistence

feat(web-auth): add passkey support

chore(pkg-ui-kit): bump storybook to v9
```

*(Each of the above is a separate, independent commit — shown together only to illustrate correct per-package scoping.)*

---

## 24. Frequently Asked Questions

**Q: What if a change genuinely doesn't fit any scope in the canonical list?**
A: Propose a new scope and add it to the canonical list (Appendix B) in the same commit. Do not force-fit an inaccurate existing scope.

**Q: Is a body required for every commit?**
A: No. It is required only when the "why" is not obvious from the header. A trivial `fix(readme): correct typo in installation link` needs no body.

**Q: Can I use `feat` for internal developer tooling with no end-user impact?**
A: No. `feat` denotes new *observable* functionality for a consumer of the software (end user or API client). Internal tooling improvements are `chore` or `build`, depending on what they touch.

**Q: How do I handle a commit that is 90% one concern and 10% an unrelated one-line fix?**
A: Split it. There is no size threshold below which mixing concerns becomes acceptable — the rule is about logical independence, not line count.

**Q: What if an AI agent is uncertain about the correct type?**
A: The agent MUST apply the decision procedure in §7 and, if still ambiguous, ask the human operator rather than guessing.

**Q: Do merge commits from GitHub's "Update branch" button need to conform?**
A: No — mechanical merge commits generated by hosting platforms to keep a branch current are exempt, since they do not represent an authored logical change.

---

## 25. Glossary

| Term | Definition |
|---|---|
| **Atomic commit** | A commit representing exactly one logical, independently revertible change. |
| **Header** | The first line of a commit message: `<type>(<scope>): <subject>`. |
| **Trailer** | A `Key: value` line in the footer, per Git's trailer convention. |
| **Breaking change** | A change that requires consumers of the software to modify their own code or configuration to continue functioning correctly. |
| **Squash merge** | Combining all commits in a pull request into a single commit on the target branch. |
| **Fixup commit** | A temporary, non-atomic commit intended to be squashed into another commit before merge (e.g., via `git commit --fixup`). |
| **Semantic Release** | Automated versioning and publishing driven by commit message conventions. |
| **Scope** | The subsystem, module, or package a commit affects. |

---

## 26. Appendix

### Appendix A — Header Validation Regular Expression

```
^(feat|fix|refactor|perf|docs|style|test|build|ci|chore|revert)\([a-z0-9-]+\)!?: [a-z].{0,70}[^.]$
```

### Appendix B — Example `commitlint` Configuration

```js
// commitlint.config.js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", "fix", "refactor", "perf", "docs",
        "style", "test", "build", "ci", "chore", "revert"
      ]
    ],
    "scope-empty": [2, "never"],
    "scope-enum": [
      2,
      "always",
      [
        "auth", "api", "ui", "dashboard", "navbar", "footer",
        "profile", "settings", "database", "prisma", "redis",
        "cache", "docker", "github", "ci", "build", "config",
        "docs", "readme", "tests", "deps", "release", "infra", "repo"
      ]
    ],
    "subject-case": [2, "always", "lower-case"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 72]
  }
};
```

### Appendix C — Git Commit Template

```
# <type>(<scope>): <subject>   (max 72 chars, imperative, lowercase, no period)
#
# <body — explain WHY, wrap at ~72 columns>
#
# <footer — BREAKING CHANGE:, Refs:, Closes:>
#
# Allowed types: feat fix refactor perf docs style test build ci chore revert
```

Install with:

```
git config commit.template .gitmessage
```

### Appendix D — Pre-Commit Secret Scan (Illustrative)

```bash
#!/usr/bin/env bash
# .git/hooks/pre-commit (illustrative — use a maintained secret scanner in production)
if git diff --cached | grep -E -i "(api[_-]?key|secret|password|BEGIN (RSA|EC) PRIVATE KEY)" ; then
  echo "Potential secret detected in staged changes. Commit aborted."
  exit 1
fi
```

---

## 27. Commit Quality Checklist

Before committing, verify every item:

- [ ] Represents exactly one logical change
- [ ] Type selected via §7 decision procedure
- [ ] Scope is specific and from the canonical list (or newly added to it)
- [ ] Subject is imperative, lowercase-start, no trailing period, ≤ 72 characters
- [ ] Body present if — and only if — the "why" is non-obvious
- [ ] Breaking changes flagged with `BREAKING CHANGE:` footer
- [ ] Issue references are real, not fabricated
- [ ] No secrets in diff or message
- [ ] Code builds successfully
- [ ] Existing and new tests pass
- [ ] Commit message accurately reflects the actual diff, no more and no less
- [ ] Commit is independently revertible

---

## 28. Summary

A conforming commit is atomic, honest, specific, and written for a reader with no prior context. It carries enough structure to be parsed by machines and enough narrative to be understood by humans. Every commit is permanent documentation: treat it with the same rigor as production code, because — unlike most code — it can never be refactored away.
