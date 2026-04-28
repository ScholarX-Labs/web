# Feature Specification: Certification Module

**Feature Branch**: `003-certification-module`  
**Created**: 2026-04-28  
**Status**: Draft  
**Input**: ScholarX Certification PRD + CertifyX PRD (see `/docs/`)

---

## Clarifications

### Session 2026-04-28

- Q: What constitutes course/program completion that triggers certificate issuance? → A: Completion requires reaching a configurable minimum watch percentage AND passing any quizzes attached to the course (minimum quiz score configurable per course). If no quizzes exist on a course, watch percentage alone determines completion.
- Q: Should the Certification Module be a separate deployed service (CertifyX SaaS) or an embedded module inside the ScholarX V2 monorepo? → A: Embedded NestJS module inside the existing ScholarX V2 monorepo — shared database, shared auth, shared deployment. No separate service.
- Q: Should the recipient credential wallet include a public-facing portfolio page? → A: Yes — opt-in public profile page at `/u/:username/certificates`. Certificates are private by default; recipients explicitly toggle individual certificates to public. Profile page is SEO-indexed.
- Q: What additional content should the public verification page display to maximise trust and convert verifiers into ScholarX users? → A: Course context + ScholarX CTA — add program duration, a skills/tags list associated with the program, instructor name (text only), and a "Learn more on ScholarX →" CTA button linking to the program page.
- Q: Should certificate issuance in V1 be fully asynchronous (job queue) or synchronous? → A: Mixed-mode — single certificate issuance (one participant, triggered by completion event or admin) is synchronous. Bulk season issuance uses a lightweight database-backed async job pattern. No Redis or external queue infrastructure required for V1.
- Q: How is a lesson officially marked as "Completed" by the system? → A: Automatic via Telemetry: The video player automatically reports watch percentage to the backend; completion triggers instantly when the threshold is reached.
- Q: How is the watch percentage actually measured by telemetry? → A: Furthest Timestamp Reached: The system simply looks at the furthest point the user has reached in the video, even if they skipped directly to the end.
- Q: Does the user receive an immediate in-app notification when the certificate is generated? → A: In-App Celebration + Email: A celebratory modal appears instantly over the video player with a button to view/claim the certificate, alongside the email.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automated Certificate Issuance on Program Completion (Priority: P1)

When a ScholarX program season is marked as completed, the system automatically issues a cryptographically signed, branded digital certificate to every participant (mentee and mentor). Each recipient immediately receives an email with a personalized claim link. Certificates include a unique verification URL and an embedded QR code.

**Why this priority**: This is the core value proposition of the entire feature. Without automated issuance, every other story has nothing to operate on. It eliminates the current manual, error-prone PDF process and is the primary driver for participant retention and completion incentives.

**Independent Test**: Can be fully tested by triggering a program-completion event for a test season containing 2–3 participants, then verifying that a signed certificate record exists for each, that PDFs and PNGs are stored, and that claim emails arrive — all without any admin manual intervention.

**Acceptance Scenarios**:

1. **Given** a ScholarX program season is marked "Completed" with 3 participants (2 mentees, 1 mentor), **When** the completion event fires, **Then** a distinct certificate is generated for each participant within 5 seconds per certificate, with the correct role designation (Mentee/Mentor), a unique ID, a cryptographic signature, an embedded QR code, and both PDF and PNG assets stored securely.
2. **Given** the certificate generation succeeds, **When** the job finishes, **Then** each participant receives a branded claim email within 60 seconds containing a single-use claim link that expires in 30 days.
3. **Given** a participant's certificate generation fails (e.g., storage error), **When** the system retries up to 3 times with exponential backoff, **Then** the failure is surfaced in the admin dashboard as a resendable error — the overall batch does not stop for one failure.
4. **Given** the same participant has already received a certificate for this season, **When** the completion event fires again (duplicate), **Then** no duplicate certificate is generated.

---

### User Story 2 - Recipient Claims and Shares Their Certificate (Priority: P1)

A program participant clicks the claim link in their email, views their certificate, downloads a PDF or PNG, copies a permanent shareable URL, and shares it to LinkedIn with a pre-filled post and Open Graph card preview — all without needing to create an account.

**Why this priority**: The claim and share experience is the primary public-facing moment of the feature. LinkedIn sharing drives brand reach (viral growth) and is one of the top KPIs. It must work independently of all other stories once certificates are issued.

**Independent Test**: Can be fully tested by seeding a certificate record directly and issuing a claim token, then verifying the claim page resolves correctly, all share actions work, and the LinkedIn share URL renders an Open Graph preview of the certificate image.

**Acceptance Scenarios**:

1. **Given** a recipient has received a claim email with a valid, unexpired claim link, **When** they click the link, **Then** they land on the claim page displaying their certificate preview (name, program, season, role, completion date, QR code), with no login required.
2. **Given** the recipient is on the claim page, **When** they click "Download PDF", **Then** a correctly branded A4 PDF is downloaded; **When** they click "Download PNG", **Then** a 1200×630 share-optimized PNG is downloaded.
3. **Given** the recipient is on the claim page, **When** they click "Copy Link", **Then** the unique permanent verification URL is copied to their clipboard with a success confirmation.
4. **Given** the recipient is on the claim page, **When** they click "Share to LinkedIn", **Then** a LinkedIn share dialog opens pre-filled with the verification URL, and LinkedIn renders the certificate PNG as an Open Graph card preview.
5. **Given** a recipient signs in with Google (optional), **When** they claim their certificate, **Then** the certificate is saved to their personal credential wallet and accessible on future logins.
6. **Given** a claim token has already been used once, **When** someone attempts to use it again, **Then** they see a clear message that the certificate has already been claimed, with a link to the permanent public verification page.
7. **Given** a claim token has expired (past 30 days), **When** the link is clicked, **Then** the recipient sees a clear expiry message and a prompt to contact ScholarX for a resend.

---

### User Story 3 - Public Certificate Verification (Priority: P1)

An employer, recruiter, or any third party can visit a public URL (or scan the QR code on the certificate) to instantly verify whether a ScholarX certificate is genuine, without logging in or creating an account.

**Why this priority**: Verification is the trust layer that makes all issued certificates credible. It must work independently and be reliable — any downtime or incorrect result directly damages platform credibility. It is also required for the share flow to be valuable.

**Independent Test**: Can be fully tested by visiting `/verify/:id` for a valid certificate, a revoked certificate, and a non-existent ID — then confirming the correct status (VALID / REVOKED / INVALID) with accurate certificate details is displayed, and the page load meets the performance target.

**Acceptance Scenarios**:

1. **Given** a valid certificate ID, **When** a verifier navigates to `/verify/:id`, **Then** the page loads in under 1.5 seconds on a 4G connection, no login is required, and the page displays "CERTIFICATE VALID" with the recipient's name, role, program, season, issue date, and ScholarX branding.
2. **Given** a revoked certificate ID, **When** a verifier navigates to `/verify/:id`, **Then** the page clearly displays "CERTIFICATE REVOKED" with no download option.
3. **Given** a non-existent or tampered certificate ID, **When** a verifier navigates to `/verify/:id`, **Then** the page clearly displays "UNABLE TO VERIFY" with guidance to contact ScholarX.
4. **Given** a valid certificate, **When** the verifier shares the verification URL on LinkedIn, Slack, or WhatsApp, **Then** the platform renders a rich Open Graph card showing the certificate image and recipient details.
5. **Given** a verification page is accessed, **When** the request is processed, **Then** a verification event is logged silently (with anonymized IP and user-agent) without affecting page load time.
6. **Given** a valid certificate, **When** a verifier views the verification page, **Then** the page also displays the program duration, associated skills/tags, the instructor's name, and a clearly visible "Learn more on ScholarX →" button that links to the program's page on ScholarX — functioning as a conversion CTA for potential new learners.

---

### User Story 4 - Admin Certificate Management Dashboard (Priority: P2)

A ScholarX admin can view all issued certificates, filter by season/status/role, trigger bulk issuance for a season, resend claim emails to unclaimed recipients, and revoke certificates with a reason — all from a protected dashboard.

**Why this priority**: Admin tooling is essential for operational control, but the system is designed to require minimal admin intervention through automation. Comes after the core issuance and verification flows are stable.

**Independent Test**: Can be fully tested with a seeded set of certificate records (PENDING, CLAIMED, REVOKED) by verifying that all filters, actions (revoke, resend), bulk issue trigger, and CSV export work correctly for an authenticated admin user.

**Acceptance Scenarios**:

1. **Given** an authenticated admin, **When** they open the certificate management page, **Then** they see a filterable, paginated list of all issued certificates showing short ID, recipient name, program, season, role, and status (PENDING / CLAIMED / REVOKED).
2. **Given** the admin is on the certificate list, **When** they select a season and click "Bulk Issue", **Then** the system queues certificate generation for all qualified participants of that season and shows real-time progress feedback.
3. **Given** a certificate with status PENDING, **When** the admin clicks "Resend", **Then** a new claim email is dispatched to the recipient and the action is logged.
4. **Given** a certificate, **When** the admin clicks "Revoke" and provides a reason, **Then** the certificate status changes to REVOKED, the verification page immediately reflects this, and the event is logged in the audit trail.
5. **Given** the admin clicks "Export CSV", **When** the export is generated, **Then** a CSV file is downloaded containing all certificate records including status and claim timestamps.

---

### User Story 5 - Recipient Credential Wallet (Priority: P2)

A signed-in recipient can access their personal credential wallet, view all certificates issued to them across seasons, and perform download and share actions for any certificate in one place.

**Why this priority**: The wallet provides long-term value for recipients who want a permanent, centralized home for their credentials. Depends on the claim flow (P1) being complete.

**Independent Test**: Can be fully tested by authenticating as a recipient who has at least 2 claimed certificates, then verifying that the wallet displays all credentials, and download/share actions are functional for each.

**Acceptance Scenarios**:

1. **Given** a signed-in recipient with 2 claimed certificates, **When** they navigate to their wallet, **Then** they see all their certificates listed as cards with program name, season, role, status, and quick-action buttons.
2. **Given** a certificate card in the wallet, **When** the recipient clicks "Download PDF" or "Download PNG", **Then** the correct file is downloaded immediately.
3. **Given** a certificate card in the wallet, **When** the recipient clicks "Share to LinkedIn", **Then** the LinkedIn share dialog opens pre-filled with the correct verification URL.

---

### User Story 6 - Public Credential Portfolio Page (Priority: P3)

A signed-in recipient can enable a public profile page at `/u/:username/certificates` that showcases all certificates they have opted to make public. Any visitor can access this page without logging in. It is SEO-indexed and serves as a shareable portfolio link recipients can include in job applications, LinkedIn bios, and resumes.

**Why this priority**: Once the wallet (P2) is stable, the public portfolio converts it from a private dashboard into a viral growth surface — each public profile page is a new inbound discovery channel for ScholarX. Comes after P2 wallet is complete.

**Independent Test**: Can be fully tested by creating a recipient account, claiming 2 certificates, toggling one to public, and verifying the public profile page shows only the opted-in certificate, is accessible without login, and is crawlable by search engines (correct meta tags, no `noindex`).

**Acceptance Scenarios**:

1. **Given** a recipient has set a username and toggled at least one certificate to public, **When** anyone visits `/u/:username/certificates`, **Then** they see a public portfolio page listing all public certificates with name, program, season, and a link to each certificate's verification page — no login required.
2. **Given** a recipient has not set a username, **When** they attempt to enable the public portfolio, **Then** they are prompted to choose a unique username (alphanumeric + hyphens, 3–30 characters) before the feature is activated.
3. **Given** a recipient has set a certificate to private (default), **When** anyone visits their public portfolio page, **Then** the private certificate does not appear in the listing.
4. **Given** a public portfolio page exists, **When** a search engine crawls it, **Then** the page renders valid Open Graph meta tags (recipient name, credential count) and is not blocked by `noindex`, making it indexable.
5. **Given** a recipient disables their public profile, **When** anyone visits `/u/:username/certificates`, **Then** the page returns a "Profile not available" state and signals search engines to de-index (via `noindex` header).

---

### Edge Cases

- What happens when a participant's email or name contains special characters? — The system must sanitize and correctly render them on the certificate and in emails.
- How does the system handle duplicate program-completion events for the same participant and season? — Idempotency check prevents duplicate certificate creation; subsequent events are ignored and logged.
- What happens if PDF/PNG generation fails after 3 retries? — The failure is recorded against the certificate record with status "FAILED" and surfaced in the admin dashboard for manual retry.
- How does the system handle an extremely long recipient name on the certificate template? — The template must gracefully truncate or reflow long names without overflowing the certificate layout.
- What happens if the claim email is never delivered (bounced)? — The admin dashboard surfaces unclaimed certificates and allows manual resend; a 7-day automated reminder email is sent to unclaimed recipients.
- What if the same claim token is used concurrently from two browser sessions? — The token is consumed atomically; only the first successful claim marks the token as used.
- What if a recipient requests deletion of their data (GDPR erasure)? — `recipient_email` is anonymized to `deleted@scholarx.lk` and `recipient_name` to `[Redacted]`; the certificate record and event log are retained for audit compliance.
- What if a certificate is revoked but the recipient has already downloaded the PDF? — The local PDF file remains on the recipient's device, but the public verification URL shows REVOKED, making the credential effectively untrusted by any verifier.
- What if a participant has watched enough content but has not yet passed a required quiz at the time the season is marked complete? — The system MUST NOT issue a certificate; the participant's enrollment record is logged as "incomplete" and surfaced in the admin dashboard. If they later pass the quiz (e.g., in a grace period defined by the admin), the admin can manually trigger issuance.
- What if a program's CompletionCriteria has not been configured by the time a season completion event fires? — The system MUST block automatic issuance for that program, log an error to the admin dashboard, and require the admin to configure criteria before re-triggering.
- What if a recipient's chosen username is already taken? — The system rejects the username and prompts the recipient to choose a different one, with real-time availability feedback in the UI.
- What if a recipient has public certificates indexed by search engines, then disables their public profile? — The page returns a `noindex` signal immediately on the next crawl; previously indexed pages will be dropped from search results on the next crawl cycle (typically within days to weeks).

---

## Requirements *(mandatory)*

### Functional Requirements

**Certificate Issuance**

- **FR-001**: The system MUST automatically issue a certificate to a participant when they satisfy the completion criteria for their enrolled program: (a) their recorded lesson watch percentage meets or exceeds the course's configured minimum watch threshold, AND (b) if the course contains quizzes, they have passed all required quizzes with a score at or above the course's configured minimum quiz score. If a course has no quizzes, criterion (a) alone is sufficient. The system MUST NOT issue a certificate to a participant who does not meet these criteria.
- **FR-001a**: Each program (course) MUST store a `CompletionCriteria` record defining: the minimum watch percentage (0–100, required), whether quizzes are required for that course (boolean), and the minimum quiz score (0–100, required when quizzes are enabled). These values MUST be configurable by an admin per course.
- **FR-001b**: The system MUST rely on background telemetry from the video player to track watch percentage automatically. When the telemetry indicates the configured minimum watch threshold is reached (and any quizzes are passed), the lesson is marked completed and the certificate is issued instantly without requiring the user to explicitly acknowledge completion.
- **FR-001c**: The video telemetry MUST calculate watch percentage based on the furthest timestamp reached by the user in the video, regardless of whether the user scrubbed/skipped ahead. Linear viewing of every segment is not enforced for completion.
- **FR-002**: An admin MUST be able to manually issue a single certificate by providing recipient name, email, program, role, and completion date.
- **FR-003**: An admin MUST be able to trigger bulk certificate issuance for all participants of a selected season from the admin dashboard.
- **FR-004**: The system MUST generate two certificate outputs per participant: a PDF (A4, download-quality) and a PNG (1200×630, share-optimized for LinkedIn/OG).
- **FR-005**: Each certificate MUST have a globally unique identifier (both a UUID and a human-readable short ID, e.g. "SX-2026-00142").
- **FR-006**: Each certificate MUST be cryptographically signed at generation time to enable tamper detection during verification.
- **FR-007**: An embedded QR code MUST be rendered on every certificate PDF and PNG, resolving to the certificate's public verification URL.
- **FR-008**: The system MUST apply the correct visual template based on the participant's role (Mentee vs. Mentor), with a visually distinct "Mentor" designation.
- **FR-009**: Single certificate issuance (triggered by an individual completion event or an admin manual issue) MUST be processed synchronously within the request lifecycle and complete within 5 seconds, returning success or a structured error to the caller.
- **FR-009a**: Bulk season issuance (triggered by an admin selecting a full season) MUST be processed asynchronously using a lightweight database-backed job pattern. The API MUST return immediately with a job reference ID; the admin dashboard MUST show real-time progress (e.g., N of M certificates generated) without requiring an external queue service such as Redis or BullMQ.
- **FR-010**: Failed certificate generation attempts (single or bulk) MUST be retried up to 3 times with exponential backoff before being marked as FAILED and surfaced in the admin dashboard for manual retry.
- **FR-010a**: The Certification Module MUST integrate with the Courses Service via an internal application event (e.g., a `course.completion_evaluated` event emitted within the same backend application) — not via an external HTTP webhook or separate service call. The Courses Service evaluates completion criteria and emits the event; the Certification Module subscribes to it and triggers issuance. No cross-service network call is required.

**Claim & Email Notifications**

- **FR-011**: Upon certificate generation, the system MUST send a branded claim email to the recipient containing a unique, single-use claim link.
- **FR-011a**: When a certificate is issued to an active user (e.g., upon reaching the video watch threshold), the frontend MUST instantly display a celebratory modal over the video player. This modal MUST contain a button linking directly to view/claim the new certificate.
- **FR-012**: The claim link MUST expire 30 days after issuance and become invalid after first successful use.
- **FR-013**: An admin MUST be able to resend the claim email for any certificate with PENDING status.
- **FR-014**: The system MUST automatically send a reminder email to all unclaimed recipients 7 days after initial issuance.
- **FR-015**: Recipients MUST be able to view and download their certificate from the claim page without requiring a login or account creation.
- **FR-016**: Recipients MUST be able to optionally sign in with Google to save their certificate to a personal credential wallet.

**Public Verification**

- **FR-017**: A public verification page MUST be accessible at `/verify/:certificateId` without any login, displaying the certificate status (VALID / REVOKED / INVALID) prominently.
- **FR-018**: The verification page MUST display: recipient name, role, program name, season, issue date, ScholarX logo and branding, a cryptographic signature fingerprint, program duration, a list of skills/tags associated with the program, the instructor's name (text), and a "Learn more on ScholarX →" CTA button linking to the program's page. The CTA button MUST only appear for VALID certificates.
- **FR-019**: The verification page MUST include Open Graph meta tags so the URL renders a rich preview card when shared on LinkedIn, Slack, or WhatsApp, using the certificate PNG as the preview image.
- **FR-020**: Every verification page access MUST be logged with an anonymized timestamp and IP region (no PII stored).
- **FR-021**: The system MUST verify the cryptographic signature of the certificate on every verification request and return INVALID if the signature does not match stored data.

**Admin Dashboard**

- **FR-022**: An admin MUST be able to view a filterable, paginated list of all certificates, filtered by season, status (PENDING/CLAIMED/REVOKED), and role.
- **FR-023**: An admin MUST be able to revoke any certificate by providing a reason; revoked certificates MUST immediately display as REVOKED on the verification page.
- **FR-024**: An admin MUST be able to export the full certificate list as a CSV file.
- **FR-025**: An admin MUST be able to view a claim rate summary (% claimed) per season.
- **FR-026**: All certificate lifecycle events (issued, claimed, revoked, verified, shared, downloaded, email sent/resent) MUST be recorded in an immutable audit log viewable by admins.

**Credential Wallet & Public Portfolio**

- **FR-027**: A signed-in recipient MUST be able to view all certificates issued to their account in a personal credential wallet.
- **FR-028**: From the wallet, a recipient MUST be able to download any certificate as PDF or PNG, copy the shareable URL, and share directly to LinkedIn.
- **FR-034**: A recipient MUST be able to toggle visibility on each individual certificate between public and private. The default state for all certificates is **private**.
- **FR-035**: A recipient MUST be able to set a unique public username (alphanumeric and hyphens, 3–30 characters) to activate their public portfolio page at `/u/:username/certificates`. The system MUST enforce username uniqueness and provide real-time availability feedback.
- **FR-036**: The public portfolio page at `/u/:username/certificates` MUST be accessible without login and MUST list only certificates the recipient has explicitly set to public, each linking to its individual verification page.
- **FR-037**: The public portfolio page MUST include correct Open Graph meta tags (recipient name, credential count, ScholarX branding) and MUST be crawlable by search engines (no `noindex`) when the profile is active. When the recipient disables their public profile, the page MUST return a `noindex` directive on subsequent requests.

**Sharing**

- **FR-029**: The LinkedIn share action MUST open a pre-filled LinkedIn share dialog with the verification URL and suggested post text, using the URL-based share method (no LinkedIn API key required).
- **FR-030**: The certificate PNG MUST serve as the Open Graph image so LinkedIn, Slack, and WhatsApp render a visual preview of the actual certificate.

**Security**

- **FR-031**: All admin dashboard routes and API endpoints MUST be protected by role-based access control, allowing only authenticated ScholarX admins to access them.
- **FR-032**: Certificate files (PDF/PNG) MUST be served via time-limited signed URLs (15-minute TTL) and MUST NOT be publicly guessable.
- **FR-033**: The GDPR right-to-erasure request MUST result in anonymization of PII fields (email → `deleted@scholarx.lk`, name → `[Redacted]`) without deleting the certificate or event records.

---

### Key Entities

- **Certificate**: Represents one issued credential for one participant. Key attributes: unique ID (UUID + short ID), recipient name and email, program name, season number, role (mentee/mentor), completion date, issuance date, status (PENDING/CLAIMED/REVOKED), `isPublic` (boolean, default false — controls portfolio visibility), cryptographic signature, PDF and PNG asset references, claim token, claim token expiry, claim timestamp. Uniqueness constraint: one certificate per (participant, program, season) — enforced to prevent duplicates.
- **CompletionCriteria**: Defines what constitutes completion for a given program/course. Attributes: minimum watch percentage (integer, 0–100), quizzes required (boolean), minimum quiz score (integer, 0–100; applicable only when quizzes required is true). One record per program; configurable by admin.
- **CertificateEvent**: An immutable record of every action taken in a certificate's lifecycle (issued, claimed, viewed, verified, shared, downloaded, revoked, email sent, email resent). Includes actor, timestamp, anonymized IP, and user-agent.
- **ClaimToken**: A single-use, time-limited (30 days) token sent to the recipient via email to claim their certificate. Invalidated on first successful use.
- **Program / Season**: An existing ScholarX entity representing the mentorship program and its enrollment period. The Certification Module reads (but does not own) the following attributes from this entity: program name, season number, instructor name (the lead mentor or program lead), program duration (total hours or weeks), and associated skill tags (a list of short labels, e.g. "Leadership", "Software Engineering"). These fields are displayed on the public verification page.
- **User (Recipient)**: An optionally authenticated ScholarX participant who can link their Google account to claim certificates into their credential wallet. Additional attributes for portfolio: `username` (unique, optional, alphanumeric + hyphens, 3–30 chars), `portfolioEnabled` (boolean, default false). When `portfolioEnabled` is true and a username is set, the public portfolio page is active.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of program participants who complete a ScholarX season automatically receive a certificate within 5 minutes of the completion event, with no manual admin action required.
- **SC-002**: Certificate generation (PDF + PNG) completes in under 5 seconds at the 95th percentile for a single certificate.
- **SC-003**: The public verification page loads in under 1.5 seconds on a 4G connection (measured by Largest Contentful Paint).
- **SC-004**: Claim emails are delivered within 60 seconds of certificate issuance for 95% of recipients.
- **SC-005**: Over 35% of certificate recipients share their credential to LinkedIn within 14 days of issuance.
- **SC-006**: Over 90% of issued certificates are claimed by recipients within 30 days of issuance.
- **SC-007**: Zero verification false positives — every VALID result corresponds to a genuinely issued, unmodified certificate.
- **SC-008**: Admin effort to issue certificates for an entire season is reduced to under 5 minutes (single bulk-trigger action, no per-recipient work).
- **SC-009**: Support tickets related to lost or unfound certificates are reduced by 80% compared to the current manual process, within 60 days of launch.
- **SC-010**: All public-facing pages (verification, claim, public portfolio) meet WCAG 2.1 AA accessibility standards.
- **SC-011**: At least 5% of verifiers who view a valid certificate's verification page click the "Learn more on ScholarX →" CTA within the first 90 days of launch, measured via click-event tracking.

---

## Assumptions

- The Certification Module is an embedded NestJS module within the ScholarX V2 monorepo. It shares the existing database, authentication system, and deployment pipeline. No separate service, separate deployment, or cross-service network call is introduced.
- The Courses Service (within the same NestJS application) emits a `course.completion_evaluated` internal application event when a participant's completion criteria are evaluated as met. The Certification Module subscribes to this event to trigger certificate issuance. The exact event payload schema (at minimum: participantId, programId, seasonNumber, role, completionDate) will be agreed between module owners before Sprint 1.
- Participant names and email addresses are already stored in the ScholarX platform — no new data collection is required from participants for certificate issuance.
- ScholarX brand assets (logo, colors, typography) will be finalized and provided to the engineering team before certificate template work begins in Sprint 1.
- A transactional email provider (Resend or equivalent) is already configured or will be provisioned for ScholarX V2, with a verified sending domain (SPF/DKIM/DMARC).
- Cloud object storage (AWS S3 or Cloudflare R2) will be provisioned and accessible to the backend service before Sprint 1 work begins.
- Google OAuth 2.0 authentication is already operational in ScholarX V2 and will be reused for the optional recipient wallet sign-in, with no additional OAuth setup required.
- Certificates do NOT expire for V2 — ScholarX mentorship completion is treated as a permanent achievement. Expiry is a post-V2 roadmap item.
- Revoked certificates remain publicly accessible at their verification URL but display REVOKED status prominently, rather than returning a 404 (for transparency to verifiers).
- The certificate module is built exclusively for ScholarX V2 (Next.js frontend + upgraded backend) and will NOT be backported to the existing React + Express V1 stack.
- Mobile web experience must be responsive and functional; a native mobile app is out of scope for V2.
- Blockchain anchoring, W3C Verifiable Credentials, and Open Badges 3.0 are out of scope for V2 and targeted for a future roadmap release.
- A custom certificate template designer is out of scope for V2; templates will be fixed, branded HTML templates (Mentee and Mentor variants), with the option to extend via code by the engineering team.
