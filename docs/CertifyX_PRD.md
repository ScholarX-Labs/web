# CertifyX â€” Certification System PRD

**Document Version:** 1.0.0
**Status:** Draft â€” Pending EM Review
**Author:** Principal Software Engineer
**Date:** April 27, 2026
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

### 1.1 Problem Statement

Organizations issuing credentials today face three compounding failures:

- **Fraud**: Paper and static PDF certificates are trivially forged; there is no reliable verification path for employers or institutions.
- **Fragmentation**: Credentials live in disconnected systems â€” email inboxes, LMS platforms, Google Drive â€” with no canonical holder-controlled record.
- **Opacity**: Issuers have zero visibility into how credentials are consumed, shared, or verified post-issuance, making ROI measurement impossible.

The consequence is credential mistrust at scale: hiring managers cannot verify; learners cannot prove; issuers cannot measure.

### 1.2 Product Vision

> **CertifyX** is a multi-tenant, end-to-end certification platform that empowers organizations to issue, manage, and cryptographically verify digital credentials â€” and empowers credential holders to own, share, and prove their achievements with zero friction.

CertifyX sits at the intersection of three forces:

| Force | CertifyX Response |
|---|---|
| Rise of verifiable credentials (W3C VC / Open Badges 3.0) | Full standards compliance out of the box |
| Remote-first hiring requiring instant proof-of-skill | One-click shareable verification URL + LinkedIn push |
| Enterprise need for credential analytics | Real-time issuance, view & verification dashboards |

### 1.3 Strategic Fit

CertifyX is a **platform-level capability** that can be sold as:

- A **standalone SaaS** product (B2B subscription, per-seat or per-certificate)
- An **embedded module** inside an existing LMS or HR platform
- An **internal enterprise tool** for large organizations managing thousands of credentials

### 1.4 Core Value Propositions

| Stakeholder | Value |
|---|---|
| **Learner / Recipient** | Own credentials in one place, share in one click, never lose proof |
| **Issuing Organization** | Automate issuance, reduce fraud liability, gain analytics |
| **Employer / Verifier** | Instant, tamper-proof verification without a platform account |
| **Platform Admin** | Full multi-tenant control, audit trail, compliance reporting |
## 2. Goals & Success Metrics

### 2.1 Business Goals

| ID | Goal | Priority |
|---|---|---|
| BG-01 | Reduce credential fraud exposure for issuing organizations by providing cryptographic verification | P0 |
| BG-02 | Increase credential engagement (shares, views, verifications) by 3أ— vs. static PDF baseline | P0 |
| BG-03 | Enable multi-tenant issuance to support B2B SaaS model | P0 |
| BG-04 | Achieve SOC 2 Type II readiness within 12 months of launch | P1 |
| BG-05 | Generate measurable post-issuance analytics for issuer organizations | P1 |
| BG-06 | Support Open Badges 3.0 / W3C Verifiable Credentials standard | P2 |

### 2.2 Success Metrics (OKRs)

#### Objective 1: Deliver a trusted credential issuance engine

| Key Result | Target | Measurement Method |
|---|---|---|
| Certificate generation P99 latency | < 2 seconds | Backend APM (Datadog/New Relic) |
| Certificate verification accuracy | 100% (zero false positives) | QA test suite + canary monitors |
| Fraud-attempt detection & alert rate | > 95% of tampered certs flagged | Security audit log analysis |

#### Objective 2: Drive credential adoption

| Key Result | Target | Measurement Method |
|---|---|---|
| LinkedIn share conversion from certificate wallet | > 40% of recipients share within 7 days | Event tracking (Segment/Mixpanel) |
| Public verification page load time | < 1.5s on 4G | Lighthouse / WebPageTest |
| Recipient portal DAU/MAU ratio | > 0.3 within 6 months | Product analytics |

#### Objective 3: Achieve enterprise-grade reliability

| Key Result | Target | Measurement Method |
|---|---|---|
| System uptime | 99.9% (< 8.7 hrs downtime/year) | StatusPage + PagerDuty |
| Issuance pipeline error rate | < 0.1% | Error tracking (Sentry) |
| Time-to-resolve P0 incidents | < 30 minutes | Incident postmortem logs |

### 2.3 Anti-Goals (What We Are NOT Optimizing For)

- **Not** building a blockchain-native product in v1 (optional anchor only)
- **Not** replacing existing LMS course delivery functionality
- **Not** building a consumer marketplace for credential discovery in v1
- **Not** optimizing for offline-first mobile native apps in v1

---

## 3. Scope, Assumptions & Constraints

### 3.1 In-Scope (v1.0)

| # | Feature Area |
|---|---|
| S-01 | Multi-tenant organization onboarding & management |
| S-02 | Certificate template designer (drag-and-drop, brand customization) |
| S-03 | Manual & bulk CSV certificate issuance |
| S-04 | Automated issuance via webhook / API trigger |
| S-05 | Recipient email delivery with personalized claim link |
| S-06 | Recipient credential wallet (view, download PDF, share) |
| S-07 | Public verification page (QR + unique URL, no login required) |
| S-08 | LinkedIn one-click share + Open Graph meta tags |
| S-09 | Issuer analytics dashboard (issuance, views, verifications) |
| S-10 | Role-based access control (Super Admin, Org Admin, Issuer, Recipient) |
| S-11 | REST API for third-party LMS/HR integration |
| S-12 | Audit log for all credential lifecycle events |
| S-13 | SSO via Google OAuth 2.0 |

### 3.2 Out-of-Scope (v1.0 â€” Future Roadmap)

| # | Feature | Target Version |
|---|---|---|
| OS-01 | Blockchain anchoring (Ethereum / Polygon) | v1.5 |
| OS-02 | W3C Verifiable Credentials (DID-based) full compliance | v1.5 |
| OS-03 | Native iOS / Android apps | v2.0 |
| OS-04 | Marketplace for credential discovery | v2.0 |
| OS-05 | AI-powered fraud detection ML model | v2.0 |
| OS-06 | SAML/Okta Enterprise SSO | v1.5 |

### 3.3 Assumptions

- All users have access to a modern browser (Chrome 110+, Safari 16+, Firefox 110+)
- Organizations own their brand assets (logo, colors) and provide them during onboarding
- Email delivery relies on a third-party transactional provider (SendGrid/Resend)
- PDF generation handled server-side; no client-side rendering dependencies for certificates

### 3.4 Constraints

| Constraint | Impact |
|---|---|
| GDPR / PDPA compliance required | PII must be minimized, right-to-erasure implemented |
| PDF/A-1b archive format required by some edu orgs | PDF renderer must support PDF/A output |
| Multi-region deployment | Data residency: EU and US regions must be independently operable |
| Max team: 6 engineers (FE: 2, BE: 2, DevOps: 1, QA: 1) | Scope must fit within 3 أ— 2-week sprints for MVP |
## 4. Personas & User Journeys

### 4.1 Personas

#### P1 â€” Sarah, the Org Admin (Primary Issuer)
- **Role**: L&D Manager at a 500-person tech company
- **Goal**: Issue branded certificates to employees who complete internal training programs; track who has claimed their cert
- **Pain Points**: Currently emails PDFs manually; no tracking; recipients lose files
- **Tech Comfort**: Medium-High; uses Workday, Slack, Google Workspace
- **Key Needs**: Bulk issuance, branded templates, real-time claim tracking

#### P2 â€” Carlos, the Recipient (Learner)
- **Role**: Junior developer who completed a cloud certification course
- **Goal**: Showcase credential on LinkedIn and resume; never lose proof of achievement
- **Pain Points**: PDF in email gets buried; can't verify it online; employers ask "is this real?"
- **Tech Comfort**: High
- **Key Needs**: Shareable link, LinkedIn push, PDF download, permanent URL

#### P3 â€” Priya, the Verifier (Employer / Background Check)
- **Role**: Technical Recruiter reviewing a candidate's credentials
- **Goal**: Instantly verify the credential is genuine, unexpired, and issued by the claimed organization
- **Pain Points**: Calls issuing org HR to verify manually; time-consuming
- **Tech Comfort**: Medium
- **Key Needs**: No login required, clear pass/fail status, issuer org branding visible

#### P4 â€” David, the Super Admin (Platform Operator)
- **Role**: Internal platform admin managing all tenant organizations
- **Goal**: Onboard orgs, manage subscriptions, review audit logs, respond to fraud reports
- **Tech Comfort**: Very High
- **Key Needs**: Tenant management, billing controls, system-wide audit log, impersonation for support

### 4.2 User Journeys

#### Journey 1: Certificate Issuance (Sarah â€” Org Admin)

```
[1] Login to CertifyX portal (SSO / email)
    â†“
[2] Select Organization â†’ Certificates â†’ Issue New
    â†“
[3] Choose template OR create new template (brand upload, fields)
    â†“
[4] Choose issuance method:
    â€¢ Manual (fill form) â†’ single recipient
    â€¢ Bulk CSV upload â†’ multiple recipients
    â€¢ API Trigger (from LMS webhook) â†’ automated
    â†“
[5] Preview certificate â†’ Confirm & Issue
    â†“
[6] System generates signed certificate + unique URL + QR code
    â†“
[7] Recipient receives email with "Claim Your Certificate" CTA
    â†“
[8] Sarah views issuance dashboard â†’ tracks claim status per recipient
```

#### Journey 2: Credential Claiming (Carlos â€” Recipient)

```
[1] Receives email: "Your [Org Name] Certificate is Ready"
    â†“
[2] Clicks "Claim Certificate" â†’ lands on claim page (no login required)
    â†“
[3] Optionally creates CertifyX account OR claims as guest (email verified)
    â†“
[4] Certificate displayed in full visual â€” sees name, issuer, date, skills
    â†“
[5] Actions available:
    â€¢ Download PDF
    â€¢ Copy shareable URL
    â€¢ Share to LinkedIn (pre-filled post + Open Graph card)
    â€¢ Add to Wallet (if logged in)
    â†“
[6] If logged in â†’ Certificate saved in personal wallet dashboard
```

#### Journey 3: Verification (Priya â€” Verifier)

```
[1] Receives link from candidate (e.g. certifyx.io/verify/abc123)
    OR scans QR code on printed/PDF certificate
    â†“
[2] Lands on public verification page (zero login, zero friction)
    â†“
[3] Page displays:
    â€¢ âœ… VALID / â‌Œ INVALID / âڑ ï¸ڈ REVOKED status (large, clear)
    â€¢ Recipient name, issuing org logo, credential title
    â€¢ Issue date, expiry date (if applicable)
    â€¢ Cryptographic signature fingerprint
    â†“
[4] Optional: "Report suspected fraud" link
    â†“
[5] Page logs verification event (visible to issuing org in analytics)
```
## 5. Functional Requirements

### Legend
- **P0** = Must have for MVP launch
- **P1** = Should have (sprint 2â€“3)
- **P2** = Nice to have (post-MVP)

### 5.1 Authentication & Authorization

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-AUTH-01 | Email + password authentication | P0 | bcrypt, 12 rounds |
| FR-AUTH-02 | Google OAuth 2.0 SSO | P0 | â€” |
| FR-AUTH-03 | JWT access token (15 min) + refresh token (7 days) | P0 | HttpOnly cookie |
| FR-AUTH-04 | Role-based access control: Super Admin, Org Admin, Issuer, Recipient | P0 | Guard-based (NestJS) |
| FR-AUTH-05 | Email verification on registration | P0 | â€” |
| FR-AUTH-06 | Password reset via email token | P0 | 1-hour expiry |
| FR-AUTH-07 | Multi-factor authentication (TOTP) | P1 | Authenticator app |
| FR-AUTH-08 | Session management â€” view & revoke active sessions | P1 | â€” |

### 5.2 Organization Management (Multi-Tenant)

| ID | Requirement | Priority |
|---|---|---|
| FR-ORG-01 | Create / update / suspend organization tenant | P0 |
| FR-ORG-02 | Upload organization logo, brand colors, domain | P0 |
| FR-ORG-03 | Invite members to organization via email | P0 |
| FR-ORG-04 | Assign roles within organization (Admin / Issuer) | P0 |
| FR-ORG-05 | Custom email domain for outgoing certificate emails | P1 |
| FR-ORG-06 | Subscription plan management (Free / Pro / Enterprise) | P1 |
| FR-ORG-07 | Data export: all certificates as CSV / ZIP | P1 |

### 5.3 Certificate Template Management

| ID | Requirement | Priority |
|---|---|---|
| FR-TPL-01 | Create certificate template with drag-and-drop field layout | P0 |
| FR-TPL-02 | Fields: Recipient Name, Credential Title, Issue Date, Expiry, Skills, Signature | P0 |
| FR-TPL-03 | Upload background image / custom font | P0 |
| FR-TPL-04 | Live preview of template with sample data | P0 |
| FR-TPL-05 | Duplicate / version templates | P1 |
| FR-TPL-06 | Template library (pre-built starter templates) | P1 |

### 5.4 Certificate Issuance

| ID | Requirement | Priority |
|---|---|---|
| FR-ISS-01 | Manual issuance: single recipient form | P0 |
| FR-ISS-02 | Bulk issuance: CSV upload (name, email, credential, date) | P0 |
| FR-ISS-03 | API-triggered issuance via webhook | P0 |
| FR-ISS-04 | Issue date, optional expiry date, optional skill tags | P0 |
| FR-ISS-05 | Certificate generation: PDF/A + unique ID + QR code embedded | P0 |
| FR-ISS-06 | Recipient notification email (claim link, org branding) | P0 |
| FR-ISS-07 | Revoke / un-revoke a certificate with reason | P0 |
| FR-ISS-08 | Resend claim email | P0 |
| FR-ISS-09 | Schedule issuance for a future date | P1 |
| FR-ISS-10 | Batch status: track per-recipient claim status in bulk issue | P1 |

### 5.5 Recipient Credential Wallet

| ID | Requirement | Priority |
|---|---|---|
| FR-WALL-01 | View all claimed certificates in personal dashboard | P0 |
| FR-WALL-02 | Download certificate as PDF | P0 |
| FR-WALL-03 | Copy unique shareable URL to clipboard | P0 |
| FR-WALL-04 | Share to LinkedIn (pre-filled post + profile section deep-link) | P0 |
| FR-WALL-05 | Share via email / WhatsApp / Twitter | P1 |
| FR-WALL-06 | Certificate visibility toggle (public / private) | P1 |
| FR-WALL-07 | Export all credentials as ZIP | P1 |

### 5.6 Public Verification

| ID | Requirement | Priority |
|---|---|---|
| FR-VER-01 | Public URL: `/verify/:certificateId` â€” no login required | P0 |
| FR-VER-02 | QR code on certificate resolves to verification URL | P0 |
| FR-VER-03 | Display: Valid / Invalid / Revoked / Expired status | P0 |
| FR-VER-04 | Display issuer org branding, recipient name, credential, dates | P0 |
| FR-VER-05 | Verification event logged (timestamp, IP region, user-agent) | P0 |
| FR-VER-06 | Cryptographic signature fingerprint displayed | P1 |
| FR-VER-07 | "Report suspected fraud" form | P1 |

### 5.7 Analytics Dashboard (Issuer)

| ID | Requirement | Priority |
|---|---|---|
| FR-ANL-01 | Total issued / claimed / pending / revoked counts | P0 |
| FR-ANL-02 | Claim rate over time (line chart) | P0 |
| FR-ANL-03 | Verification events per certificate | P1 |
| FR-ANL-04 | LinkedIn share count per certificate | P1 |
| FR-ANL-05 | Export analytics as CSV | P1 |
| FR-ANL-06 | Email digest (weekly summary) | P2 |

### 5.8 Audit Log

| ID | Requirement | Priority |
|---|---|---|
| FR-AUD-01 | Immutable log of all lifecycle events (issue, claim, revoke, verify) | P0 |
| FR-AUD-02 | Actor, action, timestamp, IP, resource ID per entry | P0 |
| FR-AUD-03 | Searchable / filterable audit log UI for Org Admin | P1 |
| FR-AUD-04 | Exportable audit log (CSV) for compliance | P1 |
## 6. Non-Functional Requirements

### 6.1 Performance

| Metric | Target | Notes |
|---|---|---|
| API P99 response time | < 300ms | Excluding PDF generation |
| Certificate PDF generation | < 3s | Server-side, async job for bulk |
| Public verification page TTI | < 1.5s on 4G | Core Web Vitals LCP target |
| Bulk issuance throughput | 10,000 certs/hour | Via async queue (BullMQ) |
| Concurrent users supported (MVP) | 5,000 | Horizontal scaling enabled |

### 6.2 Security

| Requirement | Detail |
|---|---|
| Transport encryption | TLS 1.3 enforced; HSTS headers |
| Certificate signing | RSA-256 asymmetric key pair per tenant; private key stored in AWS KMS |
| Token security | JWT stored in HttpOnly SameSite=Strict cookie; CSRF protection |
| Password policy | Min 10 chars, 1 uppercase, 1 number, 1 special; bcrypt 12 rounds |
| Rate limiting | 100 req/min per IP on auth endpoints; 1000 req/min on API |
| Input validation | Class-validator (NestJS) + Zod on frontend; no raw SQL (TypeORM parameterized) |
| Secrets management | No secrets in code; AWS Secrets Manager / environment injection |
| Dependency scanning | Dependabot + Snyk in CI pipeline |
| PII handling | Email, name encrypted at rest (AES-256); right-to-erasure workflow |
| CORS | Strict allowlist; no wildcard origins in production |

### 6.3 Reliability & Availability

| Requirement | Target |
|---|---|
| System uptime SLA | 99.9% monthly |
| RTO (Recovery Time Objective) | < 1 hour |
| RPO (Recovery Point Objective) | < 5 minutes |
| Database backups | Automated daily snapshots + continuous WAL archiving |
| Health checks | `/health` and `/ready` endpoints; integrated with load balancer |

### 6.4 Scalability

- **Stateless API**: Horizontally scalable NestJS instances behind load balancer
- **Database**: PostgreSQL with read replicas for analytics queries
- **Queue**: BullMQ on Redis for async jobs (PDF generation, bulk email, bulk issuance)
- **Storage**: AWS S3 for PDFs, template assets; CDN (CloudFront) for static delivery
- **Multi-region**: Active-passive setup; US-East primary, EU-West failover

### 6.5 Accessibility

| Standard | Target |
|---|---|
| WCAG compliance | WCAG 2.1 AA minimum |
| Screen reader support | Full ARIA labeling on interactive elements |
| Keyboard navigation | All flows operable via keyboard only |
| Color contrast ratio | Minimum 4.5:1 for all text |
| Focus management | Visible focus ring; focus trap in modals |

### 6.6 Observability

| Tool | Purpose |
|---|---|
| **Sentry** | Frontend + Backend error tracking |
| **Datadog APM** | API latency, throughput, error rate |
| **CloudWatch Logs** | Infrastructure & application logs |
| **PagerDuty** | On-call alerting for P0 incidents |
| **StatusPage** | Public status communication |

### 6.7 Compliance

| Regulation | Requirement |
|---|---|
| **GDPR** | Consent management, data minimization, right-to-erasure, DPA |
| **SOC 2 Type II** (target) | Access controls, audit logging, incident response documented |
| **PDF/A-1b** | Archive-grade PDF output for education org compatibility |

---

## 7. System Architecture

### 7.1 Architecture Overview

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚                          CLIENT LAYER                               â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ   â”‚
â”‚  â”‚   Next.js Web App   â”‚        â”‚  Public Verification Page    â”‚   â”‚
â”‚  â”‚  (App Router, RSC)  â”‚        â”‚  (Static / Edge-rendered)    â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
            â”‚ HTTPS / REST                         â”‚ HTTPS
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚                          CDN / EDGE LAYER                           â”‚
â”‚              CloudFront + WAF (rate limit, DDoS protect)            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
                                â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚                        API GATEWAY LAYER                            â”‚
â”‚              AWS ALB â†’ NestJS API (containerized, ECS Fargate)      â”‚
â”‚                    /api/v1/* (versioned REST)                        â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
       â”‚                      â”‚                      â”‚
â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”گ    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ  â”Œâ”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚  Auth       â”‚    â”‚  Certificate Engine  â”‚  â”‚  Notification  â”‚
â”‚  Module     â”‚    â”‚  Module              â”‚  â”‚  Module        â”‚
â”‚  (NestJS)   â”‚    â”‚  (NestJS + BullMQ)   â”‚  â”‚  (NestJS)      â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”ک    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک  â””â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”ک
       â”‚                      â”‚                      â”‚
â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚                         DATA LAYER                                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ  â”‚
â”‚  â”‚  PostgreSQL     â”‚  â”‚  Redis       â”‚  â”‚  AWS S3                â”‚  â”‚
â”‚  â”‚  (Primary +    â”‚  â”‚  (BullMQ     â”‚  â”‚  (PDFs, assets,        â”‚  â”‚
â”‚  â”‚   Read Replica)â”‚  â”‚   + Cache)   â”‚  â”‚   templates)           â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
       â”‚
â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚  External Services          â”‚
â”‚  â€¢ SendGrid/Resend (Email)  â”‚
â”‚  â€¢ AWS KMS (Key signing)    â”‚
â”‚  â€¢ Google OAuth 2.0         â”‚
â”‚  â€¢ LinkedIn API (share)     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
```

### 7.2 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript | RSC for SEO on verification pages; SSR for perf |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid, consistent design system |
| **State** | Zustand + TanStack Query | Server state separation; no Redux overhead |
| **Backend** | NestJS + TypeScript | Module-based, testable, matches team expertise |
| **ORM** | TypeORM + PostgreSQL | Typed migrations; multi-tenant schema per org |
| **Queue** | BullMQ on Redis | Reliable async job processing |
| **PDF Engine** | Puppeteer (headless Chrome) | Pixel-perfect HTMLâ†’PDF with custom fonts |
| **Auth** | JWT (Passport.js) + Google OAuth 2.0 | Industry standard |
| **Object Storage** | AWS S3 + CloudFront CDN | Scalable, durable, globally fast |
| **Key Management** | AWS KMS | Tenant signing keys; FIPS-compliant |
| **Email** | Resend (or SendGrid) | Reliable transactional delivery |
| **Containerization** | Docker + AWS ECS Fargate | Serverless container management |
| **CI/CD** | GitHub Actions | Automated test â†’ build â†’ deploy pipeline |
| **Monitoring** | Sentry + Datadog | Full observability stack |
## 8. Backend Modules & API Design

### 8.1 Module Breakdown

```
src/
â”œâ”€â”€ auth/                    # Authentication & session
â”œâ”€â”€ users/                   # User profiles
â”œâ”€â”€ organizations/           # Multi-tenant org management
â”œâ”€â”€ templates/               # Certificate template CRUD
â”œâ”€â”€ certificates/            # Issuance, revocation, verification
â”œâ”€â”€ notifications/           # Email delivery orchestration
â”œâ”€â”€ analytics/               # Events & aggregation
â”œâ”€â”€ audit/                   # Immutable audit log
â”œâ”€â”€ storage/                 # S3 abstraction layer
â”œâ”€â”€ queue/                   # BullMQ job processors
â”œâ”€â”€ common/                  # Guards, decorators, pipes, interceptors
â””â”€â”€ config/                  # Environment & secrets configuration
```

### 8.2 API Endpoints

All endpoints versioned under `/api/v1/`. Authentication via `Authorization: Bearer <token>` or HttpOnly cookie.

#### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Email + password login |
| POST | `/auth/logout` | ًں”’ | Invalidate refresh token |
| POST | `/auth/refresh` | Public | Exchange refresh for access token |
| GET | `/auth/google` | Public | Initiate Google OAuth |
| GET | `/auth/google/callback` | Public | OAuth callback |
| POST | `/auth/forgot-password` | Public | Send reset link |
| POST | `/auth/reset-password` | Public | Consume reset token |

#### Organizations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/organizations` | ًں”’ Super Admin | Create organization |
| GET | `/organizations/:id` | ًں”’ Org Member | Get org details |
| PATCH | `/organizations/:id` | ًں”’ Org Admin | Update org profile |
| POST | `/organizations/:id/invite` | ًں”’ Org Admin | Invite member |
| GET | `/organizations/:id/members` | ًں”’ Org Admin | List members |
| PATCH | `/organizations/:id/members/:uid` | ًں”’ Org Admin | Update member role |
| DELETE | `/organizations/:id/members/:uid` | ًں”’ Org Admin | Remove member |

#### Certificate Templates

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/templates` | ًں”’ Issuer | Create template |
| GET | `/templates` | ًں”’ Issuer | List org templates |
| GET | `/templates/:id` | ًں”’ Issuer | Get template |
| PATCH | `/templates/:id` | ًں”’ Issuer | Update template |
| DELETE | `/templates/:id` | ًں”’ Org Admin | Delete template |
| POST | `/templates/:id/preview` | ًں”’ Issuer | Generate preview PDF |

#### Certificates

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/certificates` | ًں”’ Issuer | Issue single certificate |
| POST | `/certificates/bulk` | ًں”’ Issuer | Bulk issue via CSV |
| GET | `/certificates` | ًں”’ Issuer | List org certificates |
| GET | `/certificates/:id` | ًں”’ Issuer | Get certificate detail |
| PATCH | `/certificates/:id/revoke` | ًں”’ Org Admin | Revoke certificate |
| PATCH | `/certificates/:id/restore` | ًں”’ Org Admin | Un-revoke certificate |
| POST | `/certificates/:id/resend` | ًں”’ Issuer | Resend claim email |
| GET | `/certificates/claim/:token` | Public | Claim certificate |
| GET | `/certificates/verify/:id` | Public | Verify certificate (returns JSON) |
| GET | `/certificates/:id/download` | Public | Download PDF |

#### Analytics

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/analytics/overview` | ًں”’ Org Admin | Aggregated stats |
| GET | `/analytics/certificates/:id` | ًں”’ Org Admin | Per-cert analytics |
| GET | `/analytics/events` | ًں”’ Org Admin | Raw event log |

### 8.3 Key DTOs

```typescript
// Issue Certificate DTO
class IssueCertificateDto {
  @IsUUID() templateId: string;
  @IsEmail() recipientEmail: string;
  @IsString() recipientName: string;
  @IsString() credentialTitle: string;
  @IsDateString() issueDate: string;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsArray() skills?: string[];
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

// Verify Certificate Response
class CertificateVerificationResponseDto {
  status: 'VALID' | 'INVALID' | 'REVOKED' | 'EXPIRED';
  certificateId: string;
  recipientName: string;
  credentialTitle: string;
  issuingOrg: { name: string; logoUrl: string; };
  issueDate: string;
  expiryDate?: string;
  signatureFingerprint: string;
  verifiedAt: string;
}
```
## 9. Data Models & ERD

### 9.1 Entity Relationship Diagram

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚    User          â”‚        â”‚    Organization      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤        â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ id (UUID PK)     â”‚â—„â”€â”€â”گ    â”‚ id (UUID PK)         â”‚
â”‚ email (UNIQUE)   â”‚   â”‚    â”‚ name                 â”‚
â”‚ passwordHash     â”‚   â”‚    â”‚ slug (UNIQUE)         â”‚
â”‚ firstName        â”‚   â”‚    â”‚ logoUrl              â”‚
â”‚ lastName         â”‚   â”‚    â”‚ brandColor           â”‚
â”‚ emailVerified    â”‚   â”‚    â”‚ domain               â”‚
â”‚ mfaEnabled       â”‚   â”‚    â”‚ plan (enum)          â”‚
â”‚ createdAt        â”‚   â”‚    â”‚ status (enum)        â”‚
â”‚ updatedAt        â”‚   â”‚    â”‚ createdAt            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک   â”‚    â”‚ updatedAt            â”‚
                        â”‚    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
                        â”‚               â”‚ 1
                        â”‚               â”‚
                    â”Œâ”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
                    â”‚       OrganizationMember          â”‚
                    â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
                    â”‚ id (UUID PK)                      â”‚
                    â”‚ userId (FK â†’ User)                â”‚
                    â”‚ organizationId (FK â†’ Organization)â”‚
                    â”‚ role (ENUM: admin, issuer)        â”‚
                    â”‚ inviteStatus (pending/accepted)   â”‚
                    â”‚ joinedAt                          â”‚
                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚   CertificateTemplate    â”‚       â”‚       Certificate           â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤       â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ id (UUID PK)             â”‚â—„â”€â”€â”€â”€â”€â”€â”‚ templateId (FK)             â”‚
â”‚ organizationId (FK)      â”‚       â”‚ id (UUID PK)                â”‚
â”‚ name                     â”‚       â”‚ organizationId (FK)         â”‚
â”‚ backgroundImageUrl       â”‚       â”‚ issuedById (FK â†’ User)      â”‚
â”‚ fields (JSONB)           â”‚       â”‚ recipientEmail              â”‚
â”‚ brandConfig (JSONB)      â”‚       â”‚ recipientName               â”‚
â”‚ version                  â”‚       â”‚ credentialTitle             â”‚
â”‚ isActive                 â”‚       â”‚ skills (TEXT[])             â”‚
â”‚ createdAt                â”‚       â”‚ issueDate                   â”‚
â”‚ updatedAt                â”‚       â”‚ expiryDate (nullable)       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک       â”‚ status (ENUM)               â”‚
                                   â”‚   PENDING / CLAIMED /       â”‚
                                   â”‚   REVOKED / EXPIRED         â”‚
                                   â”‚ claimToken (UNIQUE)         â”‚
                                   â”‚ claimTokenExpiry            â”‚
                                   â”‚ claimedAt                   â”‚
                                   â”‚ pdfUrl (S3 key)             â”‚
                                   â”‚ signatureFingerprint        â”‚
                                   â”‚ metadata (JSONB)            â”‚
                                   â”‚ createdAt                   â”‚
                                   â”‚ updatedAt                   â”‚
                                   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
                                                â”‚ 1
                                   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
                                   â”‚      CertificateEvent       â”‚
                                   â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
                                   â”‚ id (UUID PK)                â”‚
                                   â”‚ certificateId (FK)          â”‚
                                   â”‚ eventType (ENUM)            â”‚
                                   â”‚   ISSUED / CLAIMED /        â”‚
                                   â”‚   VIEWED / VERIFIED /       â”‚
                                   â”‚   SHARED / REVOKED /        â”‚
                                   â”‚   DOWNLOADED                â”‚
                                   â”‚ actorId (FK â†’ User, null)   â”‚
                                   â”‚ ipAddress                   â”‚
                                   â”‚ userAgent                   â”‚
                                   â”‚ metadata (JSONB)            â”‚
                                   â”‚ createdAt                   â”‚
                                   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚       AuditLog           â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ id (UUID PK)             â”‚
â”‚ organizationId (FK)      â”‚
â”‚ actorId (FK â†’ User)      â”‚
â”‚ action (VARCHAR)         â”‚
â”‚ resourceType (VARCHAR)   â”‚
â”‚ resourceId (UUID)        â”‚
â”‚ before (JSONB)           â”‚
â”‚ after (JSONB)            â”‚
â”‚ ipAddress                â”‚
â”‚ createdAt (immutable)    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
```

### 9.2 Database Strategy

| Decision | Choice | Rationale |
|---|---|---|
| Schema isolation | Shared schema, org-scoped rows (+ RLS) | Simpler ops vs. per-org schemas for v1 |
| Row-level security | PostgreSQL RLS policies | Prevent cross-tenant data leaks |
| Soft deletes | `deletedAt` timestamp on mutable entities | Preserve audit trail |
| Migrations | TypeORM migrations (versioned, reviewed in PR) | Reproducible schema changes |
| Indexing | `organizationId`, `email`, `claimToken`, `status` | High-frequency query columns |

---

## 10. Security & Verification Model

### 10.1 Certificate Signing Flow

```
[1] Certificate data finalized (all fields locked)
    â†“
[2] Canonical JSON payload constructed:
    { id, orgId, recipientEmail, recipientName,
      credentialTitle, issueDate, expiryDate, skills }
    â†“
[3] SHA-256 hash of canonical JSON computed
    â†“
[4] Hash signed using org's RSA-2048 private key
    (private key stored in AWS KMS â€” never leaves KMS boundary)
    â†“
[5] Signature + public key fingerprint stored in Certificate record
    â†“
[6] PDF generated with:
    â€¢ QR code pointing to /verify/:certificateId
    â€¢ Certificate ID printed visibly
    â€¢ Signature fingerprint printed (last 16 chars)
```

### 10.2 Verification Flow

```
[1] Verifier hits /verify/:certificateId (or scans QR)
    â†“
[2] API fetches Certificate record
    â†“
[3] Status check: REVOKED â†’ return REVOKED immediately
    â†“
[4] Expiry check: expiryDate < now â†’ return EXPIRED
    â†“
[5] Reconstruct canonical JSON from stored fields
    â†“
[6] Compute SHA-256 hash
    â†“
[7] Verify signature against org's public key
    â†“
[8] Hash match + valid signature â†’ VALID
    Hash mismatch â†’ INVALID (tampered)
    â†“
[9] Log CertificateEvent(VERIFIED) with IP + user-agent
    â†“
[10] Return CertificateVerificationResponseDto
```

### 10.3 Key Management

| Item | Implementation |
|---|---|
| Key generation | RSA-2048 key pair generated per organization on onboarding |
| Private key storage | AWS KMS (hardware-backed HSM); never exported |
| Signing operation | KMS Sign API call; no key material in application memory |
| Public key storage | PostgreSQL `organizations.publicKey` (PEM) |
| Key rotation | Annual rotation via KMS key rotation + re-signing flow (v1.5) |

### 10.4 Threat Model

| Threat | Mitigation |
|---|---|
| Forged certificate (fake PDF) | Signature verification; QR always resolves to source-of-truth API |
| Tampered certificate data | SHA-256 hash of canonical payload; mismatch â†’ INVALID |
| Claim link interception | HTTPS only; claim token single-use + 48h expiry |
| Brute-force verification | Rate limit 100 req/min per IP on `/verify/*` |
| SSRF via template image upload | URL allowlist validation; images proxied server-side |
| SQL injection | TypeORM parameterized queries; no raw SQL in application code |
| JWT theft | HttpOnly cookie; SameSite=Strict; 15-min access token TTL |
## 11. Frontend Architecture

### 11.1 Next.js App Router Structure

```
web/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ (auth)/
â”‚   â”‚   â”œâ”€â”€ login/page.tsx
â”‚   â”‚   â”œâ”€â”€ register/page.tsx
â”‚   â”‚   â””â”€â”€ reset-password/page.tsx
â”‚   â”œâ”€â”€ (dashboard)/
â”‚   â”‚   â”œâ”€â”€ layout.tsx                    # Protected layout + sidebar
â”‚   â”‚   â”œâ”€â”€ overview/page.tsx             # Org analytics overview
â”‚   â”‚   â”œâ”€â”€ certificates/
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx                  # Certificate list
â”‚   â”‚   â”‚   â”œâ”€â”€ issue/page.tsx            # Single issue form
â”‚   â”‚   â”‚   â”œâ”€â”€ bulk/page.tsx             # Bulk CSV upload
â”‚   â”‚   â”‚   â””â”€â”€ [id]/page.tsx             # Certificate detail
â”‚   â”‚   â”œâ”€â”€ templates/
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx                  # Template list
â”‚   â”‚   â”‚   â”œâ”€â”€ new/page.tsx              # Template designer
â”‚   â”‚   â”‚   â””â”€â”€ [id]/edit/page.tsx        # Edit template
â”‚   â”‚   â”œâ”€â”€ organization/
â”‚   â”‚   â”‚   â”œâ”€â”€ settings/page.tsx         # Org settings + branding
â”‚   â”‚   â”‚   â””â”€â”€ members/page.tsx          # Member management
â”‚   â”‚   â””â”€â”€ audit-log/page.tsx            # Audit log viewer
â”‚   â”œâ”€â”€ verify/
â”‚   â”‚   â””â”€â”€ [certificateId]/page.tsx      # Public verification page (SSR)
â”‚   â”œâ”€â”€ claim/
â”‚   â”‚   â””â”€â”€ [token]/page.tsx              # Claim certificate page
â”‚   â”œâ”€â”€ wallet/
â”‚   â”‚   â””â”€â”€ page.tsx                      # Recipient credential wallet
â”‚   â””â”€â”€ layout.tsx                        # Root layout + providers
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ ui/                               # shadcn/ui base components
â”‚   â”œâ”€â”€ certificates/                     # CertCard, CertPreview, CertStatus
â”‚   â”œâ”€â”€ templates/                        # TemplateDesigner, FieldEditor
â”‚   â”œâ”€â”€ analytics/                        # StatsCard, ClaimChart, EventTable
â”‚   â”œâ”€â”€ organization/                     # OrgBadge, MemberTable, InviteModal
â”‚   â””â”€â”€ shared/                           # Navbar, Sidebar, PageHeader, EmptyState
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ api/                              # TanStack Query hooks + axios client
â”‚   â”œâ”€â”€ store/                            # Zustand stores
â”‚   â”œâ”€â”€ validators/                       # Zod schemas
â”‚   â””â”€â”€ utils/                            # formatDate, truncate, etc.
â””â”€â”€ types/                                # Shared TypeScript interfaces
```

### 11.2 Component Architecture Principles

| Principle | Implementation |
|---|---|
| **Server Components by default** | Use React Server Components (RSC) for data-fetching pages |
| **Client Components on demand** | `'use client'` only for interactive/stateful components |
| **Colocation** | Styles, types, and tests colocated with components |
| **Atomic design** | Atoms (ui/) â†’ Molecules (shared/) â†’ Organisms (feature/) â†’ Pages |
| **Type safety** | All API responses typed; no `any`; strict TypeScript |

---

## 12. UI/UX Flows & Screen Inventory

### 12.1 Screen Inventory

| Screen ID | Name | Route | Role | Type |
|---|---|---|---|---|
| SCR-01 | Login | `/login` | All | Auth |
| SCR-02 | Register | `/register` | All | Auth |
| SCR-03 | Org Overview (Analytics) | `/overview` | Org Admin / Issuer | Dashboard |
| SCR-04 | Certificate List | `/certificates` | Issuer | Dashboard |
| SCR-05 | Issue Certificate | `/certificates/issue` | Issuer | Dashboard |
| SCR-06 | Bulk Issue | `/certificates/bulk` | Issuer | Dashboard |
| SCR-07 | Certificate Detail | `/certificates/:id` | Issuer | Dashboard |
| SCR-08 | Template List | `/templates` | Issuer | Dashboard |
| SCR-09 | Template Designer | `/templates/new` | Issuer | Dashboard |
| SCR-10 | Org Settings | `/organization/settings` | Org Admin | Dashboard |
| SCR-11 | Member Management | `/organization/members` | Org Admin | Dashboard |
| SCR-12 | Audit Log | `/audit-log` | Org Admin | Dashboard |
| SCR-13 | Claim Certificate | `/claim/:token` | Recipient | Public |
| SCR-14 | Credential Wallet | `/wallet` | Recipient | Auth |
| SCR-15 | Public Verification | `/verify/:id` | Anyone | Public |
| SCR-16 | Super Admin Panel | `/admin/*` | Super Admin | Admin |

### 12.2 Critical Screen Specs

#### SCR-15 â€” Public Verification Page

This is the most externally visible screen. It must be:

- **SSR rendered** (not client-side) for performance + crawlability
- **Zero authentication** required
- **Open Graph tags** set dynamically (recipient name, org, credential) for rich link previews

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚  [Org Logo]          CertifyX               â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                             â”‚
â”‚  âœ…  CERTIFICATE VALID                      â”‚
â”‚      (Green, 48px, prominent)               â”‚
â”‚                                             â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ  â”‚
â”‚  â”‚  [Certificate visual thumbnail]       â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک  â”‚
â”‚                                             â”‚
â”‚  Issued to:   Carlos Mendoza                â”‚
â”‚  Credential:  AWS Solutions Architect       â”‚
â”‚  Issued by:   [Org Logo] TechCorp Inc.      â”‚
â”‚  Issue date:  January 15, 2026              â”‚
â”‚  Expiry:      January 15, 2028              â”‚
â”‚                                             â”‚
â”‚  Signature:   A3F9...C21B  â„¹ï¸ڈ              â”‚
â”‚                                             â”‚
â”‚  [Download PDF]     [Report Issue]          â”‚
â”‚                                             â”‚
â”‚  Verified at: 2026-04-27 23:05 UTC          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
```

#### SCR-09 â€” Template Designer

- Drag-and-drop canvas (using `react-dnd` or `@dnd-kit/core`)
- Right panel: Field properties (font, size, position, color)
- Top bar: Background upload, preview toggle, save/publish
- Live preview renders actual font + org colors

---

## 13. State Management & API Integration

### 13.1 State Layers

| Layer | Tool | Responsibility |
|---|---|---|
| **Server state** | TanStack Query v5 | API data fetching, caching, invalidation |
| **Global client state** | Zustand | Auth session, active org, UI preferences |
| **Form state** | React Hook Form + Zod | Form validation, submission handling |
| **URL state** | Next.js `useSearchParams` | Filters, pagination, tab state |

### 13.2 API Client Configuration

```typescript
// lib/api/client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // HttpOnly cookie
  timeout: 10_000,
});

// Interceptor: auto-refresh token on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      await apiClient.post('/auth/refresh');
      return apiClient(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 13.3 Key TanStack Query Hooks

```typescript
// Certificate hooks
export const useCertificates = (filters: CertificateFilters) =>
  useQuery({ queryKey: ['certificates', filters], queryFn: () => getCertificates(filters) });

export const useIssueCertificate = () =>
  useMutation({
    mutationFn: issueCertificate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['certificates'] }),
  });

export const useVerifyCertificate = (id: string) =>
  useQuery({ queryKey: ['verify', id], queryFn: () => verifyCertificate(id), staleTime: 60_000 });
```

### 13.4 Error Handling Strategy

| Layer | Strategy |
|---|---|
| Network errors | Axios interceptor â†’ toast notification |
| Form validation | Zod inline errors via React Hook Form |
| API 4xx | Per-field error mapping from API response |
| API 5xx | Global error boundary â†’ "Something went wrong" page |
| Not found | Next.js `notFound()` â†’ custom 404 page |
## 14. Milestones & Delivery Timeline

### 14.1 Team Composition

| Role | Count | Responsibility |
|---|---|---|
| Frontend Engineer | 2 | Next.js UI, component library, API integration |
| Backend Engineer | 2 | NestJS modules, API, PDF engine, queue |
| DevOps Engineer | 1 | Infrastructure, CI/CD, monitoring |
| QA Engineer | 1 | Test plans, E2E automation, regression |

**Total**: 6 engineers across 6 sprints (12 weeks MVP)

### 14.2 Sprint Plan

#### Sprint 1 â€” Foundation (Weeks 1â€“2)
**Goal**: Infrastructure up, auth working, basic org management

| Task | Owner | Est. |
|---|---|---|
| AWS infrastructure setup (ECS, RDS, S3, KMS, Redis) | DevOps | 3d |
| CI/CD pipeline (GitHub Actions â†’ ECS) | DevOps | 2d |
| NestJS project scaffold + module structure | BE | 1d |
| Auth module (register, login, JWT, Google OAuth) | BE | 4d |
| Database schema + TypeORM migrations (all entities) | BE | 3d |
| Next.js scaffold + design system (shadcn/ui, Tailwind) | FE | 1d |
| Auth pages (login, register, reset password) | FE | 3d |
| Org creation + member invite flow | BE + FE | 3d |

#### Sprint 2 â€” Template & Issuance Engine (Weeks 3â€“4)
**Goal**: Templates created, certificates issued and emailed

| Task | Owner | Est. |
|---|---|---|
| Certificate template CRUD API | BE | 3d |
| Template designer UI (drag-and-drop canvas) | FE | 5d |
| PDF generation service (Puppeteer) | BE | 3d |
| Single certificate issuance API + flow | BE + FE | 3d |
| KMS signing integration | BE | 2d |
| S3 upload + PDF storage | BE | 1d |
| Claim email (Resend) + claim token flow | BE | 2d |

#### Sprint 3 â€” Claim, Verification & Wallet (Weeks 5â€“6)
**Goal**: Recipients can claim, share, and have certs verified

| Task | Owner | Est. |
|---|---|---|
| Public verification API + page (SSR) | BE + FE | 4d |
| Claim certificate page + flow | FE | 3d |
| QR code embed in PDF | BE | 1d |
| Recipient wallet dashboard | FE | 3d |
| LinkedIn share integration | FE | 2d |
| PDF download endpoint | BE | 1d |
| Open Graph meta tags for verification page | FE | 1d |

#### Sprint 4 â€” Bulk, Queue & Analytics (Weeks 7â€“8)
**Goal**: Bulk issuance, async processing, analytics dashboard live

| Task | Owner | Est. |
|---|---|---|
| Bulk CSV issuance API + BullMQ job | BE | 4d |
| Bulk issuance UI (upload + progress tracking) | FE | 3d |
| Certificate events tracking (view, verify, share) | BE | 2d |
| Analytics API (aggregations) | BE | 3d |
| Analytics dashboard UI (charts, stats) | FE | 4d |
| Revoke / resend flows | BE + FE | 2d |

#### Sprint 5 â€” Admin, Audit & Hardening (Weeks 9â€“10)
**Goal**: Super admin panel, audit log, security hardening

| Task | Owner | Est. |
|---|---|---|
| Audit log service + API | BE | 3d |
| Audit log UI (filterable, exportable) | FE | 2d |
| Super admin panel (org management) | BE + FE | 4d |
| Rate limiting (Throttler) across all endpoints | BE | 1d |
| RBAC guard audit pass | BE | 2d |
| GDPR right-to-erasure implementation | BE | 2d |
| Security penetration test (external) | QA + DevOps | 3d |

#### Sprint 6 â€” QA, Performance & Launch (Weeks 11â€“12)
**Goal**: Production-ready, all P0s green, launch

| Task | Owner | Est. |
|---|---|---|
| E2E test suite (Playwright) â€” all critical paths | QA | 5d |
| Performance audit (Lighthouse, load testing k6) | QA + DevOps | 2d |
| Accessibility audit (WCAG 2.1 AA) | QA + FE | 2d |
| Production environment final check | DevOps | 2d |
| Documentation (API docs via Swagger, runbook) | BE | 2d |
| Staged rollout + monitoring | DevOps | 2d |
| Launch ًںڑ€ | All | â€” |

### 14.3 Milestone Summary

| Milestone | Date | Criteria |
|---|---|---|
| **M1**: Infrastructure & Auth | End of Sprint 1 | Users can register, login, create org |
| **M2**: First Certificate Issued | End of Sprint 2 | PDF generated, emailed, signed |
| **M3**: Verification Live | End of Sprint 3 | Public verify page live, wallet working |
| **M4**: Bulk + Analytics | End of Sprint 4 | Bulk issuance + dashboard functional |
| **M5**: Admin + Hardened | End of Sprint 5 | All security + admin features done |
| **M6**: Production Launch ًںڑ€ | End of Sprint 6 | All P0s passing, load test passed |

---

## 15. Risks, Dependencies & Mitigations

### 15.1 Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | Puppeteer PDF gen slower than 3s under load | Medium | High | Pre-warm instances; async job for bulk; cache generated PDFs |
| R-02 | AWS KMS signing latency adds to issuance time | Low | Medium | Async signing post-issuance; non-blocking user flow |
| R-03 | Email delivery failures (spam filters) | Medium | High | Use verified sending domain; SPF/DKIM/DMARC; monitor bounce rate |
| R-04 | GDPR right-to-erasure vs. audit log immutability conflict | Medium | High | Pseudonymize PII in audit log; retain non-PII event records |
| R-05 | Template designer complexity underestimated | High | Medium | Timebox sprint 2 designer; fallback to static field layout if DnD overruns |
| R-06 | Team velocity lower than projected | Medium | High | P2 features cut first; P1 features deprioritized after M3 |
| R-07 | LinkedIn API changes share flow | Low | Low | Share via URL parameter method (no API dependency for v1) |
| R-08 | Security vulnerability found in pen test | Medium | Critical | Build in 3-day buffer in Sprint 6; critical findings block launch |

### 15.2 External Dependencies

| Dependency | Provider | Risk Level | Fallback |
|---|---|---|---|
| Transactional email | Resend | Low | SendGrid as backup |
| Cloud infrastructure | AWS | Low | Multi-AZ deployment; runbook for failover |
| PDF rendering | Puppeteer (Chromium) | Medium | wkhtmltopdf as backup |
| Google OAuth | Google | Low | Email/password auth as fallback |
| Key Management | AWS KMS | Low | No fallback; KMS is SLA-backed |

---

## 16. Open Questions & Appendix

### 16.1 Open Questions

| ID | Question | Owner | Deadline |
|---|---|---|---|
| OQ-01 | Will v1 support W3C Verifiable Credentials (DID) or Open Badges 3.0 metadata format? | PM | Sprint 1 |
| OQ-02 | What subscription tiers and certificate volume limits apply per plan? | PM + Finance | Sprint 2 |
| OQ-03 | Should revoked certificates remain publicly accessible (showing REVOKED status) or return 404? | Legal + PM | Sprint 1 |
| OQ-04 | Data residency: are EU and US regions independent deployments, or one global + data locality tagging? | CTO + DevOps | Sprint 1 |
| OQ-05 | LinkedIn share: URL-based share (no API key) sufficient for v1, or integration with LinkedIn Profile API needed? | PM | Sprint 3 |
| OQ-06 | Will organizations require custom sending domains for certificate emails in v1 or v1.5? | PM | Sprint 2 |

### 16.2 Glossary

| Term | Definition |
|---|---|
| **Certificate** | A digitally signed credential issued to a recipient proving completion of a course, program, or achievement |
| **Claim Token** | A single-use, time-limited URL token sent to a recipient to claim their certificate |
| **Credential Wallet** | Recipient-facing dashboard storing all claimed certificates |
| **Fingerprint** | Last 16 characters of the RSA signature displayed publicly for human-readable verification |
| **KMS** | AWS Key Management Service â€” hardware-backed service for cryptographic key storage and signing operations |
| **Open Badges** | IMS Global open standard for digital credentials that embed metadata within the credential artifact |
| **RSC** | React Server Components â€” Next.js 14 feature for server-rendered components without client JS hydration |
| **Multi-tenant** | Architecture where a single deployment serves multiple organizations with data isolation between them |

### 16.3 Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-04-27 | Principal SWE | Initial draft |
| 1.0 | 2026-04-27 | Principal SWE | Complete PRD â€” all 16 sections |
