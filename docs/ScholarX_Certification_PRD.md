# ScholarX Certification Module â€” PRD

**Document Version:** 1.0.0
**Status:** Draft â€” Pending EM Review
**Author:** Mostafa Yaser
**Date:** April 27, 2026
**Product:** ScholarX V2 â€” Certification Feature Module
**Classification:** Internal â€” Confidential

---

## Table of Contents

1. [Executive Summary & Product Vision](#1-executive-summary--product-vision)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [Scope, Assumptions & Constraints](#3-scope-assumptions--constraints)
4. [Personas & User Journeys](#4-personas--user-journeys)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [System Architecture](#7-system-architecture)
8. [Backend Modules & API Design](#8-backend-modules--api-design)
9. [Data Models & ERD](#9-data-models--erd)
10. [Security & Verification Model](#10-security--verification-model)
11. [Frontend Architecture](#11-frontend-architecture)
12. [UI/UX Flows & Screen Inventory](#12-uiux-flows--screen-inventory)
13. [State Management & API Integration](#13-state-management--api-integration)
14. [Milestones & Delivery Timeline](#14-milestones--delivery-timeline)
15. [Risks, Dependencies & Mitigations](#15-risks-dependencies--mitigations)
16. [Open Questions & Appendix](#16-open-questions--appendix)

---

## 1. Executive Summary & Product Vision

### 1.1 Context

ScholarX is an internal mentorship platform that connects mentees with industry mentors across structured seasonal programs. Upon completing a program, both mentors and mentees currently receive **no formal, verifiable recognition** of their participation and achievement. Certificates â€” if issued â€” are informal PDFs attached to emails, untracked, and unverifiable.

This PRD defines the **ScholarX Certification Module**: a first-class feature integrated into ScholarX V2 (Next.js) that automatically issues branded, cryptographically verifiable digital certificates to program participants and makes them shareable, downloadable, and publicly verifiable.

### 1.2 Problem Statement

| Problem                                                   | Impact                                                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| No formal credential issued after program completion      | Mentors and mentees cannot prove participation to employers, universities, or professional networks |
| Manual PDF issuance (if any) is error-prone and untracked | Admin overhead; no visibility into who received or claimed a cert                                   |
| Certificates cannot be verified                           | Recipients' credentials are untrusted; potential for forgery                                        |
| No LinkedIn integration                                   | Participants miss professional recognition; platform loses virality                                 |

### 1.3 Product Vision

> **Every ScholarX program completion deserves a credential that participants are proud to share and employers trust to verify â€” issued automatically, styled to ScholarX's brand, and publicly verifiable with one click.**

### 1.4 Strategic Fit

The Certification Module directly advances ScholarX's platform goals:

| Platform Goal                                     | Module Contribution                                               |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| Increase mentor & mentee program completion rates | Certificate as a completion incentive                             |
| Grow ScholarX brand reach                         | LinkedIn shares expose ScholarX to professional networks virally  |
| Improve platform credibility                      | Verifiable, tamper-proof credentials signal institutional quality |
| Support ScholarX V2 migration                     | Built natively in Next.js; no legacy dependencies                 |

### 1.5 Migration Note

## The current stack (React + Express) will **not** receive the certification feature. The module is built exclusively for **ScholarX V2 (Next.js + upgraded backend)**, serving as a flagship V2 feature that incentivizes migration. The backend API design is stack-agnostic (REST), allowing gradual migration of the Express layer to Next.js API routes or a dedicated NestJS service.

## 2. Goals & Success Metrics

### 2.1 Business Goals

| ID    | Goal                                                                                                   | Priority |
| ----- | ------------------------------------------------------------------------------------------------------ | -------- |
| BG-01 | Automatically issue a branded certificate to every participant who completes a ScholarX program season | P0       |
| BG-02 | Enable public, zero-friction certificate verification via unique URL and QR code                       | P0       |
| BG-03 | Drive LinkedIn shares of ScholarX certificates to grow brand reach                                     | P0       |
| BG-04 | Provide ScholarX admins with full visibility into certificate issuance and claim status                | P1       |
| BG-05 | Reduce admin effort for certificate issuance from manual to fully automated                            | P1       |

### 2.2 Success Metrics (OKRs)

#### Objective 1: Automate and trust certificate issuance

| Key Result                                         | Target        | How Measured                      |
| -------------------------------------------------- | ------------- | --------------------------------- |
| % of program completions auto-issued a certificate | 100%          | Backend job monitoring            |
| Certificate PDF/PNG generation time (P95)          | < 5 seconds   | APM (Sentry performance)          |
| Zero false-positive verification results           | 100% accuracy | Automated verification test suite |

#### Objective 2: Drive credential sharing and engagement

| Key Result                                 | Target                           | How Measured           |
| ------------------------------------------ | -------------------------------- | ---------------------- |
| LinkedIn share rate per issued certificate | > 35% within 14 days of issuance | Event tracking         |
| Public verification page load time (LCP)   | < 1.5s on 4G                     | Lighthouse CI          |
| Certificate claim rate                     | > 90% within 30 days             | Admin dashboard metric |

#### Objective 3: Reduce admin overhead

| Key Result                                           | Target                     | How Measured         |
| ---------------------------------------------------- | -------------------------- | -------------------- |
| Manual effort to issue all certs for a season        | < 5 minutes (bulk trigger) | Admin workflow audit |
| Support tickets related to lost/unfound certificates | Reduced by 80%             | Helpdesk data        |

### 2.3 Anti-Goals

- **Not** building a multi-tenant SaaS for external organizations
- **Not** implementing blockchain anchoring in V2 (roadmap item)
- **Not** replacing the existing ScholarX program management system â€” this module is additive
- **Not** building a native mobile app; web only for V2

---

## 3. Scope, Assumptions & Constraints

### 3.1 In-Scope (V2 Launch)

| #    | Feature                                                                        |
| ---- | ------------------------------------------------------------------------------ |
| S-01 | Automatic certificate issuance triggered on program completion event           |
| S-02 | Manual / bulk issuance by ScholarX admin                                       |
| S-03 | Certificate output: PDF (download) + PNG (share-optimized)                     |
| S-04 | Unique verification URL + embedded QR code per certificate                     |
| S-05 | Public verification page (no login required)                                   |
| S-06 | Recipient email notification with claim link                                   |
| S-07 | Recipient credential wallet (view, download, share)                            |
| S-08 | LinkedIn one-click share with Open Graph preview                               |
| S-09 | Admin issuance dashboard (status tracking per recipient)                       |
| S-10 | Google OAuth 2.0 for recipient login (claim without separate account creation) |
| S-11 | Certificate revocation by admin (with reason)                                  |
| S-12 | Audit log for all certificate lifecycle events                                 |

### 3.2 Out-of-Scope (Future Roadmap)

| #     | Feature                                      | Target |
| ----- | -------------------------------------------- | ------ |
| OS-01 | Open Badges 3.0 / W3C Verifiable Credentials | V2.5   |
| OS-02 | Blockchain anchoring (Polygon)               | V3     |
| OS-03 | Custom certificate template designer         | V2.5   |
| OS-04 | Multi-organization / multi-tenant support    | V3     |
| OS-05 | SAML/Okta SSO                                | V2.5   |
| OS-06 | Native iOS / Android app                     | V3     |
| OS-07 | Certificate expiry & renewal workflows       | V2.5   |

### 3.3 Assumptions

- ScholarX V2 backend will expose a `program_completion` event (webhook or internal event) that the certification module subscribes to
- ScholarX already stores participant emails and names â€” no new data collection required
- ScholarX brand assets (logo, colors, typography) are finalized before template implementation
- Email delivery uses an existing transactional email provider (e.g. Resend or SendGrid already configured for V2)

### 3.4 Constraints

| Constraint                                           | Impact                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| Single organization (ScholarX only)                  | No multi-tenancy complexity; simpler schema and auth model |
| Web-only (Next.js V2)                                | No React Native / Expo work required                       |
| GDPR compliance for participant PII                  | Email + name handled per existing ScholarX data policy     |
| Existing Express backend in V1                       | Certification module is V2-only; no backport               |
| Team size: estimated 2â€“3 engineers for this module | Timeline must be realistic for small team                  |

---

## 4. Personas & User Journeys

### 4.1 Personas

#### P1 â€” Aisha, the ScholarX Admin

- **Role**: Program Coordinator at ScholarX
- **Goal**: Ensure every mentee and mentor who completes a season receives their certificate automatically; track claim status; handle exceptions
- **Pain Points**: Currently manually creates PDFs and emails them one by one; no tracking; participants ask "where's my certificate?"
- **Key Needs**: Dashboard showing who received/claimed; bulk issue trigger; resend option

#### P2 â€” Kasun, the Mentee (Recipient)

- **Role**: University student who completed a 6-month mentorship program
- **Goal**: Add the ScholarX mentorship certificate to his LinkedIn profile and CV before applying for internships
- **Pain Points**: Received a PDF attachment that got lost in email; can't share a live, verifiable link
- **Key Needs**: One-click LinkedIn share, permanent public URL, downloadable PDF + PNG

#### P3 â€” Nimal, the Mentor (Recipient)

- **Role**: Senior engineer who volunteered as a ScholarX mentor
- **Goal**: Add mentorship credential to LinkedIn to demonstrate community contribution
- **Key Needs**: Same as Kasun; also values the "Mentor" designation on the certificate being visually distinct

#### P4 â€” Emma, the Hiring Manager (Verifier)

- **Role**: HR at a tech company reviewing Kasun's application
- **Goal**: Quickly verify the ScholarX certificate is genuine
- **Key Needs**: Zero login, instant result, issuer branding visible, clear VALID/INVALID status

### 4.2 User Journeys

#### Journey 1: Automated Season Completion Issuance (Aisha)

```
[1] ScholarX platform marks program season as "Completed"
    â†“
[2] Completion event fires â†’ Certification Module receives event payload
    { programId, participants: [{ name, email, role: 'mentee'|'mentor' }] }
    â†“
[3] For each participant:
    â€¢ Generate certificate (correct template per role: Mentee / Mentor)
    â€¢ Sign certificate â†’ generate unique ID + QR code
    â€¢ Render PDF + PNG
    â€¢ Upload to storage
    â€¢ Store certificate record
    â€¢ Send claim email
    â†“
[4] Aisha opens Admin Dashboard â†’ sees all issued certificates
    with status: PENDING CLAIM / CLAIMED / REVOKED
    â†“
[5] For any unclaimed after 7 days â†’ Aisha clicks "Resend" per row
    OR triggers "Bulk Resend to Unclaimed"
```

#### Journey 2: Claiming the Certificate (Kasun)

```
[1] Kasun receives email:
    "ًںژ“ Your ScholarX Mentorship Certificate is Ready!"
    [Claim Your Certificate â†’] button
    â†“
[2] Clicks â†’ lands on /claim/:token (no login required by default)
    OR prompted to "Sign in with Google" to save to wallet
    â†“
[3] Certificate displayed in full visual:
    â€¢ ScholarX logo, Kasun's name, program name, season, completion date
    â€¢ "Mentee" or "Mentor" role designation
    â€¢ Verification URL + QR code visible on certificate
    â†“
[4] Available actions:
    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
    â”‚ [â¬‡ Download PDF]  [ًں–¼ Download PNG]          â”‚
    â”‚ [ًں”— Copy Link]    [in Share to LinkedIn]     â”‚
    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
    â†“
[5] Kasun clicks "Share to LinkedIn":
    â†’ Opens LinkedIn share dialog with pre-filled text:
      "Proud to have completed the ScholarX Mentorship Program!
       Verified credential: https://scholarx.lk/verify/abc123"
    â†’ LinkedIn card shows Open Graph preview of certificate
    â†“
[6] Certificate saved in Kasun's wallet (if signed in)
```

#### Journey 3: Verification (Emma)

```
[1] Emma clicks certificate link in Kasun's application:
    https://scholarx.lk/verify/abc123
    â†“
[2] Lands on public verification page â€” no login, loads in < 2s
    â†“
[3] Sees:
    âœ…  CERTIFICATE VALID
    ScholarX [logo] | Kasun Perera | Mentee â€” Program X, Season 5
    Issued: January 15, 2026  |  No expiry
    â†“
[4] Emma satisfied â†’ proceeds with application review
    (Verification event logged silently in background)
```

---

## 5. Functional Requirements

### Priority Legend

- **P0** â€” Must have at V2 launch
- **P1** â€” Should have (sprint 2â€“3)
- **P2** â€” Nice to have (post-launch iteration)

---

### 5.1 Authentication & Authorization

| ID         | Requirement                                              | Priority | Notes                                  |
| ---------- | -------------------------------------------------------- | -------- | -------------------------------------- |
| FR-AUTH-01 | Google OAuth 2.0 for recipient login (claim + wallet)    | P0       | Re-use existing ScholarX OAuth         |
| FR-AUTH-02 | Claimless certificate viewing (no login to see/download) | P0       | Claim token in URL is sufficient proof |
| FR-AUTH-03 | Admin role guard on all issuance and management APIs     | P0       | Re-use ScholarX existing RBAC          |
| FR-AUTH-04 | Session-based auth for admin dashboard                   | P0       | Inherit from ScholarX V2 auth          |

### 5.2 Certificate Issuance

| ID        | Requirement                                                           | Priority | Notes                         |
| --------- | --------------------------------------------------------------------- | -------- | ----------------------------- |
| FR-ISS-01 | Auto-issue on program `completion` event (webhook/event listener)     | P0       | Core automation               |
| FR-ISS-02 | Manual single issuance by admin (name, email, program, role, date)    | P0       | Exception handling            |
| FR-ISS-03 | Bulk trigger for all participants of a season (from admin UI)         | P0       | Season completion workflow    |
| FR-ISS-04 | Certificate type: Mentee certificate template                         | P0       | â€”                           |
| FR-ISS-05 | Certificate type: Mentor certificate template                         | P0       | Distinct "Mentor" designation |
| FR-ISS-06 | Generate PDF (A4, download-ready)                                     | P0       | Server-side rendering         |
| FR-ISS-07 | Generate PNG (1200أ—630, share-optimized for LinkedIn/OG)             | P0       | Same render, different export |
| FR-ISS-08 | Embed QR code on certificate (links to `/verify/:id`)                 | P0       | QR generated server-side      |
| FR-ISS-09 | Unique certificate ID assigned (UUID, human-readable short ID)        | P0       | â€”                           |
| FR-ISS-10 | Certificate cryptographically signed (HMAC-SHA256 with server secret) | P0       | Tamper detection              |
| FR-ISS-11 | Recipient claim email sent on issuance                                | P0       | ScholarX branded template     |
| FR-ISS-12 | Claim token (UUID, single-use, 30-day expiry) in claim email          | P0       | â€”                           |
| FR-ISS-13 | Revoke certificate with reason (admin only)                           | P0       | Status â†’ REVOKED            |
| FR-ISS-14 | Resend claim email per recipient (admin)                              | P0       | â€”                           |
| FR-ISS-15 | Bulk resend to all unclaimed recipients for a season                  | P1       | â€”                           |
| FR-ISS-16 | Schedule issuance for a future date                                   | P2       | â€”                           |

### 5.3 Certificate Assets & Storage

| ID        | Requirement                                                | Priority |
| --------- | ---------------------------------------------------------- | -------- |
| FR-STG-01 | Store generated PDF in cloud storage (S3 or equivalent)    | P0       |
| FR-STG-02 | Store generated PNG in cloud storage                       | P0       |
| FR-STG-03 | Serve files via CDN with signed/expiring URLs for download | P0       |
| FR-STG-04 | Certificate assets retained for minimum 5 years            | P0       |

### 5.4 Recipient Credential Wallet

| ID         | Requirement                                          | Priority |
| ---------- | ---------------------------------------------------- | -------- |
| FR-WALL-01 | List all certificates issued to logged-in recipient  | P0       |
| FR-WALL-02 | Download certificate as PDF                          | P0       |
| FR-WALL-03 | Download certificate as PNG                          | P0       |
| FR-WALL-04 | Copy unique shareable URL                            | P0       |
| FR-WALL-05 | Share to LinkedIn (one-click, pre-filled text + URL) | P0       |
| FR-WALL-06 | Share via copy-link (for WhatsApp, email, Twitter)   | P1       |

### 5.5 Public Verification

| ID        | Requirement                                                            | Priority |
| --------- | ---------------------------------------------------------------------- | -------- |
| FR-VER-01 | Public page `/verify/:certificateId` â€” zero login required           | P0       |
| FR-VER-02 | Display: VALID / INVALID / REVOKED / EXPIRED status prominently        | P0       |
| FR-VER-03 | Display recipient name, program, role, season, issue date              | P0       |
| FR-VER-04 | Display ScholarX branding (logo, colors)                               | P0       |
| FR-VER-05 | QR code on PDF resolves to verification page                           | P0       |
| FR-VER-06 | Verification event logged (timestamp, anonymized IP, user-agent)       | P0       |
| FR-VER-07 | Open Graph meta tags for rich link previews on LinkedIn/Slack/WhatsApp | P0       |
| FR-VER-08 | HMAC signature fingerprint shown (last 8 chars) for reference          | P1       |

### 5.6 Admin Dashboard

| ID        | Requirement                                                        | Priority |
| --------- | ------------------------------------------------------------------ | -------- |
| FR-ADM-01 | List all issued certificates with filters (season, status, role)   | P0       |
| FR-ADM-02 | Per-certificate status: PENDING / CLAIMED / REVOKED                | P0       |
| FR-ADM-03 | Per-certificate actions: Revoke, Resend, View                      | P0       |
| FR-ADM-04 | Season-level issuance trigger (issue all participants of a season) | P0       |
| FR-ADM-05 | Claim rate summary per season                                      | P1       |
| FR-ADM-06 | Export certificate list as CSV                                     | P1       |
| FR-ADM-07 | Audit log viewer (all certificate events)                          | P1       |

### 5.7 Notifications

| ID        | Requirement                                                        | Priority | Notes         |
| --------- | ------------------------------------------------------------------ | -------- | ------------- |
| FR-NOT-01 | Claim email: ScholarX branded, recipient name, program, CTA button | P0       | HTML email    |
| FR-NOT-02 | Reminder email to unclaimed recipients (7 days after issuance)     | P1       | Automated job |
| FR-NOT-03 | Admin summary email after bulk issuance (X issued, X failed)       | P1       | â€”           |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric                                    | Target                      | Notes                             |
| ----------------------------------------- | --------------------------- | --------------------------------- |
| Single certificate generation (PDF + PNG) | < 5s P95                    | Acceptable for async delivery     |
| Public verification page LCP              | < 1.5s on 4G                | SSR; no client-side data fetch    |
| Verification API response time            | < 200ms                     | Simple DB lookup + HMAC verify    |
| Claim email delivery                      | < 60 seconds after issuance | Transactional email SLA           |
| Concurrent verifications supported        | 1,000 req/min               | Stateless endpoint; CDN cacheable |

### 6.2 Security

| Requirement                  | Implementation                                                        |
| ---------------------------- | --------------------------------------------------------------------- |
| Certificate tamper detection | HMAC-SHA256 of canonical certificate payload; stored server-side      |
| Claim token security         | UUID v4, single-use, 30-day expiry; invalidated on first use          |
| Transport security           | TLS 1.3 enforced; HSTS headers                                        |
| File access control          | PDF/PNG served via signed URLs (time-limited); not publicly guessable |
| Input validation             | Zod (frontend) + class-validator (backend) on all inputs              |
| Rate limiting                | 60 req/min per IP on `/verify/*` and auth endpoints                   |
| CORS                         | Strict allowlist; only scholarx.lk origins in production              |
| Secrets                      | Server HMAC secret stored in environment; never in code or DB         |

### 6.3 Reliability

| Requirement                                 | Target                                              |
| ------------------------------------------- | --------------------------------------------------- |
| Certificate generation job retry on failure | 3 retries with exponential backoff                  |
| Email delivery failure handling             | Log + surface in admin dashboard for manual resend  |
| Storage (PDF/PNG) redundancy                | Multi-AZ S3 or equivalent; 99.999999999% durability |
| System uptime                               | Inherits ScholarX V2 platform SLA (target: 99.5%)   |

### 6.4 Accessibility

| Standard              | Target                                     |
| --------------------- | ------------------------------------------ |
| WCAG compliance       | 2.1 AA â€” verification and wallet pages   |
| Screen reader support | Full ARIA on interactive elements          |
| Keyboard navigation   | All flows operable via keyboard            |
| Color contrast        | Min 4.5:1 for all text against backgrounds |

### 6.5 Observability

| Tool                          | Purpose                                                           |
| ----------------------------- | ----------------------------------------------------------------- |
| **Sentry**                    | Frontend + backend error tracking                                 |
| **Console logs (structured)** | Job success/failure; email delivery; verification events          |
| **Admin dashboard metrics**   | Claim rates, issuance counts visible to admin without code access |

---

## 7. System Architecture

### 7.1 Architecture Overview

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚                    CLIENT LAYER (Browser)                    â”‚
â”‚                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ â”‚
â”‚  â”‚  ScholarX V2 Web     â”‚   â”‚  Public Verification Page    â”‚ â”‚
â”‚  â”‚  (Next.js App Router)â”‚   â”‚  /verify/:id  (SSR, no auth) â”‚ â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
            â”‚ HTTPS                           â”‚ HTTPS
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚              ScholarX V2 Backend (API Layer)                  â”‚
â”‚                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ  â”‚
â”‚  â”‚  Auth Module    â”‚  â”‚  Certification     â”‚  â”‚  Program  â”‚  â”‚
â”‚  â”‚  (Google OAuth) â”‚  â”‚  Module            â”‚  â”‚  Module   â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ  â”‚  â””â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”ک  â”‚
â”‚                        â”‚  â”‚ Issue Serviceâ”‚  â”‚        â”‚        â”‚
â”‚                        â”‚  â”‚ Sign Service â”‚  â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”ک        â”‚
â”‚                        â”‚  â”‚ Verify Svc   â”‚  â”‚  completion     â”‚
â”‚                        â”‚  â”‚ Notify Svc   â”‚  â”‚  event          â”‚
â”‚                        â”‚  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”ک  â”‚                 â”‚
â”‚                        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
                                   â”‚
            â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
            â”‚                      â”‚                      â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”گ   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”گ   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”گ
â”‚   PostgreSQL      â”‚   â”‚   Job Queue       â”‚   â”‚   Cloud        â”‚
â”‚   (Certificates,  â”‚   â”‚   (BullMQ/Redis   â”‚   â”‚   Storage      â”‚
â”‚    Events, Audit) â”‚   â”‚    OR pg-boss)    â”‚   â”‚   (S3/R2)      â”‚
â”‚                   â”‚   â”‚   PDF+PNG gen     â”‚   â”‚   PDFs, PNGs   â”‚
â”‚                   â”‚   â”‚   Email dispatch  â”‚   â”‚   Templates    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
            â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚  External Services                           â”‚
â”‚  â€¢ Resend / SendGrid (transactional email)   â”‚
â”‚  â€¢ Google OAuth 2.0 (recipient login)        â”‚
â”‚  â€¢ LinkedIn Share URL API (no key needed)    â”‚
â”‚  â€¢ Puppeteer / html-pdf-node (PDF/PNG gen)   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
```

### 7.2 Technology Stack

| Layer        | Technology                                             | Rationale                                                       |
| ------------ | ------------------------------------------------------ | --------------------------------------------------------------- |
| **Frontend** | Next.js 14 (App Router, RSC)                           | V2 platform standard; SSR for verification page SEO             |
| **Styling**  | Tailwind CSS + shadcn/ui                               | Consistent with ScholarX V2 design system                       |
| **Backend**  | Express (V2 migration) â†’ Next.js API Routes (target) | Incremental migration; cert module can be API routes from day 1 |
| **Database** | PostgreSQL (existing ScholarX DB)                      | Add certification tables to existing schema                     |
| **Queue**    | pg-boss (Postgres-backed) OR BullMQ (Redis)            | pg-boss avoids Redis dependency if not already present          |
| **PDF/PNG**  | Puppeteer (headless Chromium)                          | Pixel-perfect HTMLâ†’PDF/PNG with custom fonts & branding       |
| **Storage**  | AWS S3 or Cloudflare R2                                | Scalable, durable object storage                                |
| **Email**    | Resend                                                 | Modern API; React Email templates; generous free tier           |
| **Auth**     | Google OAuth 2.0 (NextAuth.js in V2)                   | Re-use ScholarX V2 auth stack                                   |
| **QR Codes** | `qrcode` npm package                                   | Server-side QR generation; no external API                      |
| **Signing**  | Node.js `crypto.createHmac` (HMAC-SHA256)              | No external KMS needed for single-org; simple and reliable      |

### 7.3 Certificate Generation Pipeline

```
Trigger (event / manual)
    â†“
Enqueue job: { participantId, programId, role, season }
    â†“
Job Processor picks up:
  1. Fetch participant data (name, email, program, season dates)
  2. Select template (Mentor / Mentee HTML template)
  3. Inject data â†’ render HTML in memory
  4. Launch Puppeteer â†’ render HTML â†’ export PDF (A4)
  5. Puppeteer screenshot PNG (1200أ—630 OG size)
  6. Generate HMAC-SHA256 signature of canonical payload
  7. Generate QR code PNG pointing to /verify/:id
  8. Embed QR code into PDF template â†’ final PDF
  9. Upload PDF + PNG to S3
  10. Insert Certificate record to DB (status: PENDING)
  11. Dispatch claim email via Resend
    â†“
Done â€” Admin dashboard reflects new PENDING certificate
```

---

## 8. Backend Modules & API Design

### 8.1 Module Structure

```
src/
â”œâ”€â”€ certificates/
â”‚   â”œâ”€â”€ certificates.controller.ts     # REST endpoints
â”‚   â”œâ”€â”€ certificates.service.ts        # Business logic
â”‚   â”œâ”€â”€ certificates.repository.ts     # DB queries
â”‚   â”œâ”€â”€ certificates.types.ts          # Interfaces & enums
â”‚   â””â”€â”€ dto/
â”‚       â”œâ”€â”€ issue-certificate.dto.ts
â”‚       â””â”€â”€ bulk-issue.dto.ts
â”œâ”€â”€ verification/
â”‚   â”œâ”€â”€ verification.controller.ts     # Public verify endpoint
â”‚   â””â”€â”€ verification.service.ts        # HMAC verify logic
â”œâ”€â”€ certificate-generation/
â”‚   â”œâ”€â”€ pdf.generator.ts               # Puppeteer PDF renderer
â”‚   â”œâ”€â”€ png.generator.ts               # Puppeteer PNG renderer
â”‚   â”œâ”€â”€ qr.generator.ts                # QR code generation
â”‚   â””â”€â”€ templates/
â”‚       â”œâ”€â”€ mentee.template.html        # Mentee certificate HTML
â”‚       â””â”€â”€ mentor.template.html        # Mentor certificate HTML
â”œâ”€â”€ notifications/
â”‚   â”œâ”€â”€ notifications.service.ts        # Email dispatch via Resend
â”‚   â””â”€â”€ templates/
â”‚       â””â”€â”€ claim-email.tsx             # React Email template
â”œâ”€â”€ jobs/
â”‚   â”œâ”€â”€ issue-certificate.job.ts        # Async job processor
â”‚   â””â”€â”€ reminder-email.job.ts           # 7-day reminder job
â”œâ”€â”€ storage/
â”‚   â””â”€â”€ storage.service.ts              # S3/R2 upload abstraction
â””â”€â”€ audit/
    â””â”€â”€ audit.service.ts                # Immutable event logger
```

### 8.2 API Endpoints

All endpoints under `/api/v1/certificates`. Admin endpoints require ScholarX admin session.

#### Certificate Management (Admin)

| Method | Endpoint                   | Auth       | Description                                        |
| ------ | -------------------------- | ---------- | -------------------------------------------------- |
| POST   | `/certificates/issue`      | ًں”’ Admin | Issue single certificate                           |
| POST   | `/certificates/bulk-issue` | ًں”’ Admin | Issue all participants of a season                 |
| GET    | `/certificates`            | ًں”’ Admin | List certificates (filter by season, status, role) |
| GET    | `/certificates/:id`        | ًں”’ Admin | Get certificate detail                             |
| PATCH  | `/certificates/:id/revoke` | ًں”’ Admin | Revoke with reason                                 |
| PATCH  | `/certificates/:id/resend` | ًں”’ Admin | Resend claim email                                 |
| GET    | `/certificates/export`     | ًں”’ Admin | Export as CSV                                      |

#### Public Endpoints (No Auth)

| Method | Endpoint                         | Auth     | Description                                          |
| ------ | -------------------------------- | -------- | ---------------------------------------------------- |
| GET    | `/certificates/claim/:token`     | Public   | Resolve claim token â†’ redirect or return cert data |
| GET    | `/certificates/verify/:id`       | Public   | Verify certificate (JSON response)                   |
| GET    | `/certificates/:id/download/pdf` | Public\* | Download PDF (\*signed URL, time-limited)            |
| GET    | `/certificates/:id/download/png` | Public\* | Download PNG (\*signed URL, time-limited)            |

#### Recipient Wallet (Authenticated Recipient)

| Method | Endpoint             | Auth           | Description                              |
| ------ | -------------------- | -------------- | ---------------------------------------- |
| GET    | `/certificates/mine` | ًں”’ Recipient | List all certificates for logged-in user |

### 8.3 Key Request/Response Shapes

```typescript
// POST /certificates/issue
interface IssueCertificateDto {
  recipientEmail: string; // Must match existing ScholarX user
  recipientName: string;
  programId: string; // FK to ScholarX program
  programName: string;
  seasonNumber: number;
  role: "mentee" | "mentor";
  completionDate: string; // ISO date string
}

// POST /certificates/bulk-issue
interface BulkIssueDto {
  seasonId: string; // ScholarX season ID
  // System fetches all completed participants from program module
}

// GET /certificates/verify/:id â€” Response
interface VerificationResponse {
  status: "VALID" | "INVALID" | "REVOKED";
  certificate?: {
    id: string;
    recipientName: string;
    programName: string;
    seasonNumber: number;
    role: "mentee" | "mentor";
    completionDate: string;
    issuedAt: string;
    signatureFingerprint: string; // Last 8 chars of HMAC
  };
  verifiedAt: string;
}

// Certificate DB Record (TypeScript interface)
interface Certificate {
  id: string; // UUID
  shortId: string; // e.g. "SX-2026-00142"
  recipientEmail: string;
  recipientName: string;
  programId: string;
  programName: string;
  seasonNumber: number;
  role: "mentee" | "mentor";
  completionDate: Date;
  issuedAt: Date;
  claimToken: string; // UUID, single-use
  claimTokenExpiresAt: Date;
  claimedAt: Date | null;
  status: "PENDING" | "CLAIMED" | "REVOKED";
  revokeReason: string | null;
  pdfStorageKey: string; // S3 object key
  pngStorageKey: string;
  hmacSignature: string; // Full HMAC stored server-side
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 9. Data Models & ERD

### 9.1 New Tables Added to ScholarX DB

```
(Existing ScholarX Tables)
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚     users        â”‚     â”‚    programs           â”‚
â”‚ id (PK)          â”‚     â”‚ id (PK)               â”‚
â”‚ email            â”‚     â”‚ name                  â”‚
â”‚ name             â”‚     â”‚ ...                   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
         â”‚                          â”‚
(New Certification Tables)          â”‚
         â”‚                          â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚                  certificates                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ id               UUID         PRIMARY KEY        â”‚
â”‚ short_id         VARCHAR(20)  UNIQUE  NOT NULL   â”‚
â”‚ recipient_email  VARCHAR      NOT NULL           â”‚
â”‚ recipient_name   VARCHAR      NOT NULL           â”‚
â”‚ program_id       UUID         FK â†’ programs.id   â”‚
â”‚ program_name     VARCHAR      NOT NULL           â”‚
â”‚ season_number    INTEGER      NOT NULL           â”‚
â”‚ role             ENUM(mentee, mentor) NOT NULL   â”‚
â”‚ completion_date  DATE         NOT NULL           â”‚
â”‚ issued_at        TIMESTAMPTZ  NOT NULL DEFAULT NOWâ”‚
â”‚ claim_token      UUID         UNIQUE NOT NULL    â”‚
â”‚ claim_token_exp  TIMESTAMPTZ  NOT NULL           â”‚
â”‚ claimed_at       TIMESTAMPTZ  NULL               â”‚
â”‚ status           ENUM         NOT NULL           â”‚
â”‚                  (PENDING, CLAIMED, REVOKED)     â”‚
â”‚ revoke_reason    TEXT         NULL               â”‚
â”‚ pdf_storage_key  VARCHAR      NOT NULL           â”‚
â”‚ png_storage_key  VARCHAR      NOT NULL           â”‚
â”‚ hmac_signature   VARCHAR(64)  NOT NULL           â”‚
â”‚ created_at       TIMESTAMPTZ  DEFAULT NOW        â”‚
â”‚ updated_at       TIMESTAMPTZ  DEFAULT NOW        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
                         â”‚ 1-to-many
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚              certificate_events                  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ id               UUID         PRIMARY KEY        â”‚
â”‚ certificate_id   UUID         FK â†’ certificates  â”‚
â”‚ event_type       ENUM         NOT NULL           â”‚
â”‚   (ISSUED, CLAIMED, VIEWED, VERIFIED,            â”‚
â”‚    SHARED_LINKEDIN, DOWNLOADED_PDF,              â”‚
â”‚    DOWNLOADED_PNG, REVOKED, EMAIL_SENT,          â”‚
â”‚    EMAIL_RESENT)                                 â”‚
â”‚ actor_email      VARCHAR      NULL  (admin email)â”‚
â”‚ ip_hash          VARCHAR      NULL  (SHA-256)    â”‚
â”‚ user_agent       VARCHAR      NULL               â”‚
â”‚ metadata         JSONB        NULL               â”‚
â”‚ created_at       TIMESTAMPTZ  DEFAULT NOW        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
```

### 9.2 Indexes

```sql
-- High-frequency lookup indexes
CREATE INDEX idx_certs_recipient_email ON certificates(recipient_email);
CREATE INDEX idx_certs_status ON certificates(status);
CREATE INDEX idx_certs_program_id ON certificates(program_id);
CREATE INDEX idx_certs_claim_token ON certificates(claim_token);
CREATE INDEX idx_cert_events_cert_id ON certificate_events(certificate_id);
CREATE INDEX idx_cert_events_type ON certificate_events(event_type);
```

### 9.3 Data Retention & Privacy

| Decision         | Detail                                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| PII fields       | `recipient_email`, `recipient_name` â€” encrypted at rest via Postgres `pgcrypto` or application-level AES-256                          |
| Right to erasure | On GDPR erasure request: anonymize `recipient_email` â†’ `deleted@scholarx.lk`, `recipient_name` â†’ `[Redacted]`; retain event records |
| Soft delete      | No hard deletes; revocation + anonymization is the erasure path                                                                         |
| Retention        | Certificate records + assets retained for minimum 5 years per edu standards                                                             |

---

## 10. Security & Verification Model

### 10.1 Why HMAC-SHA256 (Not RSA/KMS)

For a **single-org, internal system** like ScholarX, HMAC-SHA256 provides:

| Property                            | HMAC-SHA256             | RSA (KMS)                 |
| ----------------------------------- | ----------------------- | ------------------------- |
| Tamper detection                    | âœ… Yes                 | âœ… Yes                   |
| Implementation complexity           | Low                     | High                      |
| Infrastructure cost                 | $0                      | AWS KMS costs             |
| Key rotation                        | Simple env var rotation | KMS key rotation workflow |
| Public verifiability without server | â‌Œ No                  | âœ… Yes                   |
| Right fit for internal single-org   | âœ… **Yes**             | Overkill                  |

> **Recommendation**: HMAC-SHA256 for V2. RSA/KMS and W3C Verifiable Credentials earmarked for V2.5 when open/public verifiability becomes a hard requirement.

### 10.2 Signing Flow

```typescript
// Certificate signing (server-side, at generation time)
import { createHmac } from "crypto";

function signCertificate(cert: CanonicalCertPayload): string {
  const canonical = JSON.stringify({
    id: cert.id,
    recipientEmail: cert.recipientEmail,
    recipientName: cert.recipientName,
    programId: cert.programId,
    seasonNumber: cert.seasonNumber,
    role: cert.role,
    completionDate: cert.completionDate,
    issuedAt: cert.issuedAt,
  });
  return createHmac("sha256", process.env.CERT_HMAC_SECRET!)
    .update(canonical)
    .digest("hex");
}
```

### 10.3 Verification Flow

```
[1] GET /api/v1/certificates/verify/:id
    â†“
[2] Fetch Certificate record by ID
    If not found â†’ { status: 'INVALID' }
    â†“
[3] If status === 'REVOKED' â†’ { status: 'REVOKED' } (short-circuit)
    â†“
[4] Reconstruct canonical JSON from stored fields (same fields, same order)
    â†“
[5] Recompute HMAC-SHA256 with server secret
    â†“
[6] Compare computed HMAC === stored hmac_signature (timing-safe compare)
    Match â†’ { status: 'VALID', certificate: {...} }
    No match â†’ { status: 'INVALID' } (data tampered)
    â†“
[7] Log certificate_events(VERIFIED) with anonymized IP hash + user-agent
    â†“
[8] Return response (cached at CDN edge for 60 seconds for VALID status)
```

### 10.4 Claim Token Security

| Property | Value                                                          |
| -------- | -------------------------------------------------------------- |
| Format   | UUID v4 (128-bit random)                                       |
| Expiry   | 30 days from issuance                                          |
| Usage    | Single-use: invalidated on first successful claim              |
| Delivery | HTTPS link only; never in query string of log-able URLs        |
| Exposure | Only in email body; not stored in browser history via redirect |

### 10.5 Threat Model

| Threat                                  | Mitigation                                                       |
| --------------------------------------- | ---------------------------------------------------------------- |
| Forged certificate PDF                  | HMAC verify always done server-side; QR points to live API       |
| Tampered certificate data (name, dates) | HMAC signature mismatch â†’ INVALID on verify                    |
| Claim link forwarded and reused         | Single-use token; after claim, token nulled in DB                |
| Expired claim link                      | `claim_token_exp` checked; admin can resend fresh link           |
| Verification page scraping / DDoS       | Rate limit 60 req/min per IP; CDN edge caching for VALID results |
| Brute-force certificate ID guessing     | UUID v4 (2^122 space); practically impossible                    |
| PDF download link sharing               | Signed, time-limited S3 URLs (15-min TTL)                        |

---

## 11. Frontend Architecture

### 11.1 Next.js App Router File Structure (Certification Module)

```
app/
â”œâ”€â”€ (recipient)/
â”‚   â”œâ”€â”€ claim/
â”‚   â”‚   â””â”€â”€ [token]/
â”‚   â”‚       â””â”€â”€ page.tsx          # Claim certificate (SSR, resolves token)
â”‚   â”œâ”€â”€ wallet/
â”‚   â”‚   â””â”€â”€ page.tsx              # Recipient credential wallet (auth required)
â”‚   â””â”€â”€ verify/
â”‚       â””â”€â”€ [certificateId]/
â”‚           â””â”€â”€ page.tsx          # Public verification page (SSR, no auth)
â”‚
â”œâ”€â”€ (admin)/
â”‚   â””â”€â”€ admin/
â”‚       â””â”€â”€ certificates/
â”‚           â”œâ”€â”€ page.tsx          # Admin certificate list + filters
â”‚           â”œâ”€â”€ issue/
â”‚           â”‚   â””â”€â”€ page.tsx      # Single issue form
â”‚           â”œâ”€â”€ bulk/
â”‚           â”‚   â””â”€â”€ page.tsx      # Bulk season issuance trigger
â”‚           â””â”€â”€ [id]/
â”‚               â””â”€â”€ page.tsx      # Certificate detail + actions

components/
â”œâ”€â”€ certificates/
â”‚   â”œâ”€â”€ CertificateCard.tsx       # Wallet: card with download/share actions
â”‚   â”œâ”€â”€ CertificatePreview.tsx    # Visual certificate preview (iframe/image)
â”‚   â”œâ”€â”€ VerificationBadge.tsx     # VALID / INVALID / REVOKED status badge
â”‚   â”œâ”€â”€ ShareActions.tsx          # Download PDF, PNG, LinkedIn, Copy link
â”‚   â””â”€â”€ CertificateTable.tsx      # Admin: sortable, filterable cert list
â”œâ”€â”€ admin/
â”‚   â”œâ”€â”€ IssueForm.tsx             # Single issue form with validation
â”‚   â”œâ”€â”€ BulkIssuePanel.tsx        # Season selector + bulk trigger
â”‚   â”œâ”€â”€ RevokeModal.tsx           # Revoke with reason input
â”‚   â””â”€â”€ CertStatusBadge.tsx       # PENDING / CLAIMED / REVOKED pill
â””â”€â”€ shared/
    â”œâ”€â”€ QRCodeDisplay.tsx         # Renders QR code image
    â””â”€â”€ CopyButton.tsx            # Copy-to-clipboard with feedback
```

### 11.2 Rendering Strategy Per Page

| Page                  | Rendering                   | Auth                    | Rationale                                     |
| --------------------- | --------------------------- | ----------------------- | --------------------------------------------- |
| `/verify/:id`         | **SSR** (generateMetadata)  | None                    | SEO, Open Graph, zero client flash            |
| `/claim/:token`       | **SSR**                     | None                    | Token resolved server-side; no client flicker |
| `/wallet`             | **SSR** + client hydration  | Required (Google OAuth) | Initial data fetched server-side              |
| `/admin/certificates` | **SSR** + client pagination | Admin session           | Fast initial load + dynamic filtering         |

### 11.3 Open Graph / SEO for Verification Page

```typescript
// app/verify/[certificateId]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cert = await verifyCertificate(params.certificateId);

  return {
    title: `${cert.recipientName} â€” ScholarX ${cert.role === "mentor" ? "Mentor" : "Mentee"} Certificate`,
    description: `Verified ScholarX credential for ${cert.programName}, Season ${cert.seasonNumber}`,
    openGraph: {
      title: `${cert.recipientName}'s ScholarX Certificate`,
      description: `${cert.programName} آ· Season ${cert.seasonNumber} آ· ${cert.role}`,
      images: [
        {
          url: cert.pngUrl,
          width: 1200,
          height: 630,
          alt: "ScholarX Certificate",
        },
      ],
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}
```

---

## 12. UI/UX Flows & Screen Inventory

### 12.1 Screen Inventory

| ID     | Screen                    | Route                       | Auth         | Type          |
| ------ | ------------------------- | --------------------------- | ------------ | ------------- |
| SCR-01 | Public Verification       | `/verify/:id`               | None         | Public SSR    |
| SCR-02 | Certificate Claim         | `/claim/:token`             | None         | Public SSR    |
| SCR-03 | Recipient Wallet          | `/wallet`                   | Google OAuth | Authenticated |
| SCR-04 | Admin: Certificate List   | `/admin/certificates`       | Admin        | Dashboard     |
| SCR-05 | Admin: Issue Single       | `/admin/certificates/issue` | Admin        | Dashboard     |
| SCR-06 | Admin: Bulk Issue         | `/admin/certificates/bulk`  | Admin        | Dashboard     |
| SCR-07 | Admin: Certificate Detail | `/admin/certificates/:id`   | Admin        | Dashboard     |

### 12.2 Screen Specs

#### SCR-01 â€” Public Verification Page

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚  [ScholarX Logo]                    scholarx.lk      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                      â”‚
â”‚     âœ…  CERTIFICATE VERIFIED                         â”‚
â”‚         (Green check, 56px bold)                     â”‚
â”‚                                                      â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ  â”‚
â”‚  â”‚          [Certificate PNG Preview]             â”‚  â”‚
â”‚  â”‚    (1200أ—630 image, rounded corners)           â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک  â”‚
â”‚                                                      â”‚
â”‚  Recipient     Kasun Perera                          â”‚
â”‚  Role          Mentee                                â”‚
â”‚  Program       ScholarX Mentorship Program           â”‚
â”‚  Season        Season 5                              â”‚
â”‚  Completed     January 15, 2026                      â”‚
â”‚  Issued by     ScholarX [logo]                       â”‚
â”‚                                                      â”‚
â”‚  Fingerprint   A3F9C21B  â“ک                          â”‚
â”‚                                                      â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€   â”‚
â”‚  Verified on April 27, 2026 at 23:46 UTC             â”‚
â”‚  [â†“ Download PDF]          [âڑ‘ Report Issue]         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
```

**REVOKED state**: Replace green âœ… with red â›” `CERTIFICATE REVOKED`; hide download button.
**INVALID state**: Red â‌Œ `UNABLE TO VERIFY` with guidance to contact ScholarX.

#### SCR-02 â€” Certificate Claim Page

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚  ًںژ“  Congratulations, Kasun!                         â”‚
â”‚  Your ScholarX Certificate is Ready                  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ  â”‚
â”‚  â”‚          [Certificate PNG Preview]             â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک  â”‚
â”‚                                                      â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ    â”‚
â”‚  â”‚  [â¬‡ Download PDF]    [ًں–¼ Download PNG]       â”‚    â”‚
â”‚  â”‚  [ًں”— Copy Link]      [in Share on LinkedIn]  â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک    â”‚
â”‚                                                      â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€   â”‚
â”‚  [Sign in with Google to save to your Wallet â†’]      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
```

#### SCR-04 â€” Admin Certificate List

```
Certificates                              [+ Issue Single] [âڑ، Bulk Issue]

Filters: [Season â–¼] [Status â–¼] [Role â–¼]           ًں”چ Search recipient...

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚ Short ID   â”‚ Recipient    â”‚ Program  â”‚ Role     â”‚ Status   â”‚ Actions  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ SX-2026-01 â”‚ Kasun Perera â”‚ Season 5 â”‚ Mentee   â”‚ ًںں، PEND  â”‚ â‹¯        â”‚
â”‚ SX-2026-02 â”‚ Nimal Silva  â”‚ Season 5 â”‚ Mentor   â”‚ ًںں¢ CLMD  â”‚ â‹¯        â”‚
â”‚ SX-2026-03 â”‚ Emma Watson  â”‚ Season 5 â”‚ Mentee   â”‚ ًں”´ RVKD  â”‚ â‹¯        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک

Page 1 of 12                                    [Export CSV]
```

---

## 13. State Management & API Integration

### 13.1 State Strategy

| Layer                 | Tool                  | Scope                                           |
| --------------------- | --------------------- | ----------------------------------------------- |
| **Server state**      | TanStack Query v5     | Certificate lists, verification results, wallet |
| **Global auth state** | NextAuth.js session   | Google OAuth session                            |
| **Form state**        | React Hook Form + Zod | Issue form, revoke modal                        |
| **URL state**         | `useSearchParams`     | Filters (season, status, role), pagination      |

### 13.2 Critical API Hooks

```typescript
// Verification (public â€” no auth)
export const useCertificateVerification = (id: string) =>
  useQuery({
    queryKey: ["verify", id],
    queryFn: () => fetchVerification(id),
    staleTime: 60_000, // Cache 60s; VALID status doesn't change often
    retry: 1,
  });

// Recipient wallet
export const useMyWallet = () =>
  useQuery({
    queryKey: ["wallet"],
    queryFn: fetchMyCertificates,
    enabled: !!session, // Only fetch when authenticated
  });

// Admin: issue certificate
export const useIssueCertificate = () =>
  useMutation({
    mutationFn: issueCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "certificates"] });
      toast.success("Certificate issued and email sent!");
    },
    onError: (err) => toast.error(err.message),
  });

// Admin: bulk issue
export const useBulkIssue = () =>
  useMutation({
    mutationFn: (seasonId: string) => bulkIssueSeason(seasonId),
    onSuccess: (data) =>
      toast.success(
        `Issued ${data.issued} certificates. ${data.failed} failed.`,
      ),
  });
```

### 13.3 LinkedIn Share Implementation

LinkedIn share uses the native share URL pattern (no API key required):

```typescript
// components/certificates/ShareActions.tsx
const shareToLinkedIn = (verificationUrl: string, recipientName: string) => {
  const text = encodeURIComponent(
    `Proud to have completed the ScholarX Mentorship Program! ًںژ“\n\nVerified credential: ${verificationUrl}`,
  );
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`;
  window.open(linkedInUrl, "_blank", "width=600,height=500");

  // Track share event
  trackEvent("SHARED_LINKEDIN", certificateId);
};
```

---

## 14. Milestones & Delivery Timeline

### 14.1 Team Assumption

| Role                       | Count | Responsibility                            |
| -------------------------- | ----- | ----------------------------------------- |
| Full-Stack Engineer (lead) | 1     | API, PDF generation, DB schema, job queue |
| Frontend Engineer          | 1     | Next.js pages, components, LinkedIn share |
| QA / DevOps (part-time)    | 0.5   | CI, storage setup, testing                |

**Total**: ~2.5 engineers over **4 sprints (8 weeks)**

> Adjust if team size differs.

### 14.2 Sprint Plan

#### Sprint 1 â€” Foundation (Weeks 1â€“2)

**Goal**: DB schema, API scaffold, PDF generation proof-of-concept

| Task                                                            | Owner  | Est. |
| --------------------------------------------------------------- | ------ | ---- |
| Add `certificates` + `certificate_events` tables to ScholarX DB | BE     | 2d   |
| Certificate service scaffold (issue, sign, store)               | BE     | 3d   |
| Puppeteer PDF generation with static mentee template            | BE     | 3d   |
| PNG generation (same Puppeteer render, screenshot)              | BE     | 1d   |
| QR code generation + embed into PDF                             | BE     | 1d   |
| S3/R2 storage service (upload + signed URL generation)          | BE     | 2d   |
| CI pipeline: test + build                                       | DevOps | 1d   |

**Sprint 1 Exit Criteria**: Admin can trigger `POST /certificates/issue` and get a signed, QR-embedded PDF in S3 within 5 seconds.

---

#### Sprint 2 â€” Core Flow (Weeks 3â€“4)

**Goal**: Claim flow, verification, and admin dashboard working end-to-end

| Task                                                           | Owner | Est. |
| -------------------------------------------------------------- | ----- | ---- |
| Claim email template (React Email + Resend)                    | BE    | 2d   |
| Claim token flow (single-use, expiry, resolution API)          | BE    | 2d   |
| Public verification API + HMAC verify logic                    | BE    | 2d   |
| Next.js public verification page (SSR + OG tags)               | FE    | 3d   |
| Certificate claim page (SSR, token resolution)                 | FE    | 2d   |
| ShareActions component (Download PDF/PNG, Copy link, LinkedIn) | FE    | 2d   |
| Admin certificate list page with filters                       | FE    | 2d   |

**Sprint 2 Exit Criteria**: Full E2E flow testable â€” issue â†’ email â†’ claim page â†’ LinkedIn share â†’ verification page shows VALID.

---

#### Sprint 3 â€” Admin Tools & Automation (Weeks 5â€“6)

**Goal**: Bulk issuance, season automation, wallet, revocation

| Task                                                                  | Owner | Est. |
| --------------------------------------------------------------------- | ----- | ---- |
| Async job queue setup (pg-boss or BullMQ)                             | BE    | 2d   |
| Bulk season issuance job (fetch participants â†’ queue per-cert jobs) | BE    | 3d   |
| Revoke + resend endpoints                                             | BE    | 1d   |
| 7-day unclaimed reminder email job                                    | BE    | 1d   |
| Recipient credential wallet page                                      | FE    | 3d   |
| Admin: bulk issue UI (season selector + progress feedback)            | FE    | 2d   |
| Admin: revoke modal + resend button                                   | FE    | 1d   |
| Audit log (event tracking on all certificate actions)                 | BE    | 1d   |

**Sprint 3 Exit Criteria**: Admin can trigger bulk issuance for a full season; wallet shows all claimed certs for a logged-in recipient.

---

#### Sprint 4 â€” QA, Polish & Launch (Weeks 7â€“8)

**Goal**: Production-ready, all P0s passing, deployed

| Task                                                           | Owner   | Est. |
| -------------------------------------------------------------- | ------- | ---- |
| E2E test: full issuance â†’ claim â†’ verify flow (Playwright) | QA      | 3d   |
| E2E test: revoke â†’ verify shows REVOKED                      | QA      | 1d   |
| Accessibility audit (WCAG 2.1 AA on public pages)              | FE + QA | 1d   |
| Lighthouse CI on verification page (LCP < 1.5s)                | QA      | 1d   |
| Rate limiting on verify endpoint                               | BE      | 0.5d |
| Admin CSV export                                               | BE + FE | 1d   |
| Mentor certificate template (visual distinction)               | FE + BE | 1d   |
| Production environment + CDN config                            | DevOps  | 1d   |
| Bug bash + regression                                          | QA      | 2d   |
| Launch ًںڑ€                                                    | All     | â€”  |

**Sprint 4 Exit Criteria**: All P0 requirements passing; Lighthouse LCP < 1.5s; zero P0/P1 bugs open.

### 14.3 Milestone Summary

| Milestone                      | End of Sprint | Criteria                                         |
| ------------------------------ | ------------- | ------------------------------------------------ |
| **M1**: PDF generation live    | Sprint 1      | Signed, QR-embedded PDF generated on API call    |
| **M2**: Full E2E flow          | Sprint 2      | Issue â†’ email â†’ claim â†’ verify all working |
| **M3**: Admin + bulk           | Sprint 3      | Bulk issuance + wallet + revoke done             |
| **M4**: Production Launch ًںڑ€ | Sprint 4      | All P0s passing, deployed, monitored             |

---

## 15. Risks, Dependencies & Mitigations

### 15.1 Risk Register

| ID   | Risk                                                        | Likelihood | Impact | Mitigation                                                                           |
| ---- | ----------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------ |
| R-01 | Puppeteer slow/unstable in containerized environment        | Medium     | High   | Pin Chromium version; test in Docker early in Sprint 1; fallback: `html-pdf-node`    |
| R-02 | `completion` event contract with program module not defined | High       | High   | Define event schema as first meeting with EM; block Sprint 1 otherwise               |
| R-03 | S3 signed URL configuration issues (CORS, ACLs)             | Medium     | Medium | Test S3 config Day 1 Sprint 1; use Cloudflare R2 as simpler fallback                 |
| R-04 | Email delivery to spam (claim emails blocked)               | Medium     | High   | Verify sending domain (SPF/DKIM/DMARC) before Sprint 2; test with real email clients |
| R-05 | LinkedIn share preview not showing certificate image        | Low        | Medium | Validate OG tags with LinkedIn Post Inspector before Sprint 2 exit                   |
| R-06 | HMAC secret rotation breaks existing valid certificates     | Low        | High   | Document re-signing procedure; never rotate without migration plan                   |
| R-07 | Team velocity less than projected                           | Medium     | Medium | Descope P1 features first (reminder emails, CSV export, audit log UI)                |

### 15.2 Dependencies

| Dependency                                            | Owner             | Needed By      | Risk                                |
| ----------------------------------------------------- | ----------------- | -------------- | ----------------------------------- |
| `program.completion` event schema defined             | Program team / EM | Sprint 1 Day 1 | ًں”´ High â€” blocks auto-issuance  |
| ScholarX V2 Google OAuth working                      | Auth team         | Sprint 2       | ًںں، Medium                         |
| ScholarX brand assets finalized (logo, colors, fonts) | Design            | Sprint 1 Day 3 | ًںں، Medium â€” blocks PDF template |
| S3 bucket + IAM credentials provisioned               | DevOps            | Sprint 1 Day 1 | ًںں، Medium                         |
| Resend/SendGrid account + verified domain             | DevOps            | Sprint 2 Day 1 | ًںں، Medium                         |

---

## 16. Open Questions & Appendix

### 16.1 Remaining Open Questions

| ID    | Question                                                                                       | Impact               | Owner                  | Target           |
| ----- | ---------------------------------------------------------------------------------------------- | -------------------- | ---------------------- | ---------------- |
| OQ-01 | What is the exact payload schema of the `program.completion` event?                            | Blocks auto-issuance | BE Lead + Program Team | Sprint 1 kickoff |
| OQ-02 | Should certificates expire? (ScholarX mentorships are time-bound programs)                     | Data model           | PM + EM                | Sprint 1         |
| OQ-03 | Should revoked certificates be publicly visible (showing REVOKED) or return a not-found page?  | Legal + UX           | PM + Legal             | Sprint 1         |
| OQ-04 | Is there a certificate for program completion only, or also for milestones (e.g. mid-program)? | Scope                | PM                     | Sprint 1         |
| OQ-05 | Will the same participant receive multiple certificates across seasons? (One per season?)      | Wallet UX            | PM                     | Sprint 2         |

### 16.2 Recommended Decisions (Engineering Lead View)

| Question                      | Recommendation                | Rationale                                                                   |
| ----------------------------- | ----------------------------- | --------------------------------------------------------------------------- |
| Verification: QR + URL?       | âœ… Both                      | QR on printed/PDF copies; URL for digital sharing â€” zero extra cost       |
| Integrations for V2?          | âœ… LinkedIn + Google OAuth   | Highest ROI; LinkedIn drives virality; Google OAuth = frictionless login    |
| Signing mechanism?            | âœ… HMAC-SHA256               | Right-sized for single-org; RSA/KMS for V2.5 when open verification matters |
| Queue system?                 | âœ… pg-boss (Postgres-backed) | No new infrastructure (Redis); simpler ops for small team                   |
| Certificate expiry?           | âœ… No expiry for V2          | Mentorship completion is a permanent achievement; simplifies model          |
| Revoked certificate behavior? | âœ… Show REVOKED status       | Transparency > 404; verifiers need to know it was revoked, not just missing |

### 16.3 Glossary

| Term                  | Definition                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| **Claim Token**       | UUID in the claim email link; single-use; expires in 30 days                                   |
| **HMAC-SHA256**       | Hash-based Message Authentication Code using SHA-256; used to sign certificate payloads        |
| **Canonical Payload** | The exact, ordered JSON representation of certificate fields used for signing and verification |
| **QR Code**           | Machine-readable barcode embedded in certificate PDF/PNG linking to the verification page      |
| **Open Graph (OG)**   | Protocol for controlling how URLs appear when shared on LinkedIn, Slack, WhatsApp etc.         |
| **pg-boss**           | PostgreSQL-backed job queue library for Node.js; avoids Redis dependency                       |
| **Puppeteer**         | Node.js library controlling headless Chromium; used for server-side PDF and PNG generation     |
| **RSC**               | React Server Components â€” Next.js feature for server-rendered UI without client JS hydration |

### 16.4 Revision History

| Version | Date       | Author        | Summary                                                                                                  |
| ------- | ---------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| 0.1     | 2026-04-27 | Principal SWE | Initial generic draft                                                                                    |
| 1.0     | 2026-04-27 | Principal SWE | Full rewrite scoped to ScholarX V2; single-org, web-only, HMAC signing, PDF+PNG, LinkedIn + Google OAuth |
