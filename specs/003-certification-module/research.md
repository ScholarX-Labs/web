# Research: Certification Module
**Branch**: `003-certification-module` | **Date**: 2026-04-28

All NEEDS CLARIFICATION items from Technical Context resolved here.

---

## 1. PDF & PNG Certificate Generation

**Decision**: `@react-pdf/renderer` for PDF generation; `sharp` + SVG (or `@react-pdf/renderer` PNG export) for the 1200×630 share image.

**Rationale**: The project is a pure Next.js full-stack app — there is no separate NestJS backend. Puppeteer/Playwright are too heavy for this environment (serverless-compatible deployment, no Docker). `@react-pdf/renderer` runs natively in Node.js with no headless browser dependency, integrates cleanly with TypeScript and React component patterns already established in the project, and works inside Next.js Server Actions and Route Handlers. It produces pixel-consistent output and supports custom fonts, SVG, and image embedding. For the 1200×630 PNG share image, `@react-pdf/renderer` can render a PNG from a fixed-canvas React PDF document; alternatively, a lightweight `node-canvas` or SVG-to-PNG approach via `sharp` works for the simpler share-image format.

**Alternatives considered**:
- Puppeteer/Playwright: rejected — requires Chromium binary, extremely heavyweight for serverless, deployment complexity exceeds value.
- pdf-lib / PDFKit: rejected — no React component model; pure coordinate-based layout is expensive to maintain as templates evolve.
- External PDF API (PDFMonkey, Gotenberg): rejected — adds paid external dependency; unnecessary for the expected volume (~200 certs/season max).

---

## 2. Cryptographic Certificate Signing (HMAC-SHA256)

**Decision**: HMAC-SHA256 using Node.js built-in `crypto` module. Secret stored as `CERT_SIGNING_SECRET` environment variable. Signature computed over a canonical JSON payload (deterministic key order). Verified with `crypto.timingSafeEqual` to prevent timing attacks.

**Rationale**: Confirmed by spec clarification (Q1: HMAC, not RSA). The built-in `crypto` module requires no additional dependencies. `timingSafeEqual` is the industry-standard defence against timing oracle attacks on signature comparison. The canonical payload (sorted JSON keys) ensures the same data always produces the same signature, regardless of insertion order. Secret stored in env var, never in code or DB.

**Canonical payload structure**:
```json
{
  "certificateId": "...",
  "recipientEmail": "...",
  "recipientName": "...",
  "programId": "...",
  "seasonNumber": 1,
  "role": "mentee|mentor",
  "issuedAt": "ISO-8601"
}
```

**Key rotation**: Rotate `CERT_SIGNING_SECRET` on suspected compromise; previously signed certs will fail verification after rotation (acceptable for V1; add versioned key IDs in V2 if needed).

**Alternatives considered**:
- RSA-2048 / AWS KMS: rejected per spec clarification — overkill for V1, adds infra complexity.
- `jsonwebtoken` (JWT HS256): considered but rejected — over-engineered for a stored, non-expiring signature; adds a dependency unnecessarily.

---

## 3. Bulk Async Job Queue (No Redis)

**Decision**: Custom DB-backed job table in the existing `courses` PostgreSQL schema (new `certificates` schema). A lightweight polling Server Action / API route processes pending bulk jobs. For V1's low volume (≤200 certs/season), simple polling every 2 seconds from the admin dashboard is sufficient.

**Pattern**:
```
1. Admin triggers bulk issue → INSERT into `certificate_jobs` table (status: PENDING)
2. API returns job ID immediately
3. A Next.js Route Handler at /api/certificates/jobs/[jobId]/process handles per-job execution
4. Admin dashboard polls /api/certificates/jobs/[jobId] every 2s for progress
5. Each job row tracks: totalCount, processedCount, failedCount, status
```

**Rationale**: No Redis or external queue needed. The existing PostgreSQL database handles concurrency correctly with `SELECT FOR UPDATE SKIP LOCKED`. This is the exact pattern recommended by Graphile Worker and validated by industry practice for low-volume queues. At ≤200 certs per season, even simple sequential processing completes in under 17 minutes (200 × 5s). A future upgrade to Graphile Worker or Trigger.dev is a drop-in replacement when volume grows.

**Alternatives considered**:
- Graphile Worker: excellent choice but adds a dependency; overkill for V1 at this volume.
- Trigger.dev / Inngest: managed services, best for serverless; adds external dependency and vendor coupling.
- Redis + BullMQ: explicitly rejected by spec clarification (Q5).

---

## 4. QR Code Generation

**Decision**: `qrcode` npm package (`node-qrcode`), server-side only within the certificate generation service.

**Rationale**: Lightweight, zero native dependencies, runs in Node.js runtime, generates both Data URLs (base64 PNG) and SVG strings. Used server-side during certificate generation; the QR code data URL is embedded directly into the `@react-pdf/renderer` certificate template. TypeScript types available via `@types/qrcode`.

**Usage**: `QRCode.toDataURL(verificationUrl, { width: 150, margin: 1 })` → base64 PNG embedded in PDF template.

**Alternatives considered**:
- Client-side QR generation: rejected — certificate assets are generated server-side; client-side QR adds no value and would require additional render round-trips.

---

## 5. Architecture — Full-Stack Next.js (Not NestJS)

**Key finding**: The project is a **pure Next.js 16 App Router** application with **Drizzle ORM + PostgreSQL**. There is **no NestJS backend**. The `src/domain/courses/` follows a clean DDD pattern (contracts → application services → infrastructure repositories) entirely within Next.js. The Certification Module will follow the **identical pattern**:

```
src/domain/certificates/
├── contracts/          # TypeScript interfaces (gateway + DTO contracts)
├── application/        # Service classes (CertificateIssuanceService, etc.)
├── infrastructure/
│   ├── db/             # Drizzle schema + repository
│   └── http/           # Next.js route handlers
└── index.ts            # Public barrel export
```

The "internal event" integration with the Courses domain means the `CertificateIssuanceService` is called directly from within the Courses enrollment service (or a shared event bus pattern using a simple observer/callback registered at app startup) — no HTTP call, no separate service, no queue for single-cert path.

---

## 6. Email Delivery

**Decision**: `nodemailer` (already in `package.json`). Configuration via env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`). Branded HTML email templates as TypeScript template-literal strings.

**Rationale**: `nodemailer` is already a declared dependency. No new package required. For production, configure against Resend's SMTP relay or any transactional SMTP provider. The email service is abstracted behind an `IEmailService` interface following the existing project pattern.

---

## 7. File Storage (PDF/PNG Assets)

**Decision**: Cloudflare R2 (preferred, given `open-next.config.ts.disabled` and `.wrangler` directory present — evidence of existing Cloudflare infrastructure interest) or AWS S3. Files stored with UUID-keyed paths: `certificates/{certificateId}/cert.pdf` and `certificates/{certificateId}/cert.png`. Accessed via pre-signed URLs with 15-minute TTL.

**New package required**: `@aws-sdk/client-s3` (for S3-compatible API, works with both S3 and R2 via endpoint override) + `@aws-sdk/s3-request-presigner`.

---

## 8. Deployment Context

The project currently supports **Vercel** (`vercel.json` present) and **Cloudflare** (`open-next.config.ts.disabled` present, disabled). Certificate generation (PDF, HMAC signing, QR embedding) runs in **Node.js runtime** (not Edge Runtime). All certificate API routes and Server Actions must declare `export const runtime = 'nodejs'` to avoid Edge Runtime limitations with `crypto` and `@react-pdf/renderer`.
