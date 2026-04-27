# Quickstart: Certification Module
**Branch**: `003-certification-module` | **Date**: 2026-04-28

Developer guide for implementing the Certification Module from scratch.

---

## Prerequisites

Ensure these are in place before starting implementation:

```bash
# New dependencies to install
pnpm add @react-pdf/renderer qrcode @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Dev/type dependencies
pnpm add -D @types/qrcode @types/react-pdf
```

Add to `.env.local`:
```env
# Certification Module
CERT_SIGNING_SECRET=<64-char random hex>       # HMAC signing secret
CERT_STORAGE_BUCKET=scholarx-certificates       # S3/R2 bucket name
CERT_STORAGE_ENDPOINT=https://...              # Cloudflare R2 endpoint (omit for AWS S3)
CERT_STORAGE_ACCESS_KEY_ID=...
CERT_STORAGE_SECRET_ACCESS_KEY=...
CERT_BASE_URL=https://scholarx.lk              # Base URL for verify/claim links
```

---

## Folder Structure (create this)

```text
src/domain/certificates/
├── contracts/
│   ├── certificate.contract.ts     # (copy from specs/003-certification-module/contracts/)
│   └── index.ts                    # barrel export
├── application/
│   ├── certificate-issuance.service.ts
│   ├── certificate-verification.service.ts
│   ├── certificate-claim.service.ts
│   ├── certificate-admin.service.ts
│   ├── certificate-portfolio.service.ts
│   ├── certificate-email.service.ts
│   ├── certificate-signing.service.ts    # HMAC logic
│   ├── certificate-storage.service.ts    # S3/R2 logic
│   ├── certificate-pdf.service.ts        # @react-pdf/renderer
│   ├── certificate.errors.ts
│   └── index.ts
├── infrastructure/
│   ├── db/
│   │   ├── certificates-db.schema.ts     # Drizzle schema (from data-model.md)
│   │   ├── certificates.repository.ts    # DB access layer
│   │   └── completion-criteria.repository.ts
│   └── http/
│       ├── certificates-admin.handler.ts # Admin API route handlers
│       └── certificates-public.handler.ts
└── index.ts                              # Public barrel export
```

---

## Implementation Order

Follow this strict sequence to avoid blocked dependencies:

### Step 1 — DB Schema & Migration
1. Create `certificates-db.schema.ts` from `data-model.md`
2. Add to `drizzle.config.ts` schema array and `schemaFilter`
3. Run `pnpm db:generate && pnpm db:migrate`
4. Add `portfolioUsername` and `portfolioEnabled` columns to `auth.user` via Drizzle migration

### Step 2 — Domain Contracts
1. Copy `specs/003-certification-module/contracts/certificate.contract.ts` → `src/domain/certificates/contracts/`
2. Create `index.ts` barrel export

### Step 3 — Infrastructure Layer
1. Implement `CertificatesRepository` (CRUD for all certificate tables)
2. Implement `CompletionCriteriaRepository` (CRUD for completion_criteria)

### Step 4 — Core Application Services (in this order)
1. `CertificateSigningService` — HMAC-SHA256 sign + verify (pure crypto, no DB)
2. `CertificatePdfService` — `@react-pdf/renderer` PDF + PNG generation
3. `CertificateStorageService` — S3/R2 upload + pre-signed URL generation
4. `CertificateEmailService` — nodemailer claim + reminder email
5. `CertificateIssuanceService` — orchestrates signing → PDF → storage → email → DB (single-cert, sync)
6. `CertificateVerificationService` — verify signature, log event, return `VerifyCertificateResult`
7. `CertificateClaimService` — validate token → mark claimed → optionally link to wallet
8. `CertificateAdminService` — list, revoke, resend, bulk trigger, export CSV
9. `CertificatePortfolioService` — set username, toggle visibility, get public portfolio

### Step 5 — Courses Integration
In `NextCourseEnrollmentService`, after a successful enrollment/progress update that crosses the completion threshold:
```typescript
// Emit completion event to certificates domain
if (completionCriteriaMet) {
  await certificateIssuanceService.issue({
    userId,
    courseId,
    ...
  });
}
```

### Step 6 — Next.js Route Handlers
Create under `src/app/api/`:
```text
src/app/api/
└── certificates/
    ├── route.ts                        # POST /api/certificates (admin manual issue)
    ├── [id]/
    │   ├── route.ts                    # GET /api/certificates/:id
    │   └── revoke/route.ts             # POST /api/certificates/:id/revoke
    ├── bulk/route.ts                   # POST /api/certificates/bulk
    ├── jobs/[jobId]/route.ts           # GET /api/certificates/jobs/:jobId (progress)
    ├── claim/route.ts                  # POST /api/certificates/claim
    ├── verify/[id]/route.ts            # GET /api/certificates/verify/:id
    └── portfolio/
        ├── route.ts                    # PUT /api/certificates/portfolio (set username)
        └── [username]/route.ts         # GET /api/certificates/portfolio/:username
```

Create under `src/app/`:
```text
src/app/
├── verify/
│   └── [id]/page.tsx                  # Public: /verify/:id
├── certificates/
│   └── claim/[token]/page.tsx         # Public: /certificates/claim/:token
└── u/
    └── [username]/
        └── certificates/page.tsx      # Public: /u/:username/certificates
```

### Step 7 — Admin Dashboard UI
Add to the existing admin area:
```text
src/app/(admin)/
└── admin/certificates/
    ├── page.tsx                       # Certificate list + filters
    ├── [id]/page.tsx                  # Certificate detail + actions
    └── bulk/page.tsx                  # Bulk issuance trigger + progress
```

### Step 8 — Wallet UI
```text
src/app/(authenticated)/
└── my/certificates/
    ├── page.tsx                       # Wallet — all claimed certs
    └── settings/page.tsx             # Portfolio username + visibility toggles
```

---

## Key Implementation Notes

### HMAC Signing
```typescript
// certificate-signing.service.ts
import { createHmac, timingSafeEqual, randomBytes } from "crypto";

function sign(payload: CanonicalPayload): string {
  const data = JSON.stringify(payload, Object.keys(payload).sort());
  return createHmac("sha256", process.env.CERT_SIGNING_SECRET!)
    .update(data)
    .digest("hex");
}

function verify(payload: CanonicalPayload, signature: string): boolean {
  const expected = Buffer.from(sign(payload), "hex");
  const received = Buffer.from(signature, "hex");
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
```

### Short ID Generation
```typescript
// Use a PostgreSQL sequence: CREATE SEQUENCE IF NOT EXISTS cert_seq START 1;
// On insert: shortId = `SX-${new Date().getFullYear()}-${seq.toString().padStart(5, "0")}`
```

### Node.js Runtime Declaration
All API routes that use `crypto`, `@react-pdf/renderer`, or `nodemailer` MUST declare:
```typescript
export const runtime = "nodejs";
```

### Completion Criteria Guard
```typescript
// Before issuing, always check criteria exist:
const criteria = await criteriaRepo.findByCourseId(courseId);
if (!criteria) throw new CertificateError("CRITERIA_NOT_CONFIGURED", 422, ...);

const meetsWatch = watchPercentage >= criteria.minWatchPercentage;
const meetsQuiz = !criteria.quizzesRequired || quizScore >= (criteria.minQuizScore ?? 0);
if (!meetsWatch || !meetsQuiz) return { code: "completion_criteria_not_met", ... };
```

---

## Testing Strategy

| Layer | Tool | What to test |
|---|---|---|
| Signing service | `node --test` (built-in) | Sign → verify roundtrip; tamper detection; timing-safe comparison |
| Issuance service | `node --test` + DB mock | Idempotency (duplicate issue returns `already_exists`); criteria guard |
| Verification service | `node --test` | VALID / REVOKED / INVALID paths |
| Claim service | `node --test` | Token expiry; double-claim prevention; atomic consumption |
| API route handlers | `test:api` script | HTTP status codes; auth guard (admin routes); public route accessibility |

Run with: `pnpm test:api` (existing script) for API-level tests.

---

## Constitution Compliance Checklist

- [x] **Principle I** — Domain follows SRP: each service has one responsibility. Observer pattern for Courses → Certificates event. DI via constructor injection.
- [x] **Principle II** — All contracts and services are strictly typed TypeScript. No `any`. Explicit return types everywhere.
- [x] **Principle III** — Unit tests for signing, issuance, and verification services. Integration tests for API routes.
- [x] **Principle IV** — Verify page, claim page, portfolio page, and wallet UI follow the design system (glassmorphism, Framer Motion, Tailwind).
- [x] **Principle V** — Verify page targets <1.5s LCP (static-rendered with `generateStaticParams`). PDF generation <5s p95. No unnecessary re-renders.
