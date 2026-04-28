# Quickstart: Certification Module

**Branch**: `003-certification-module` | **Date**: 2026-04-28

This guide covers the local dev setup for the Certification Module.

---

## Prerequisites

- Node.js 20+, pnpm installed
- PostgreSQL database running (local or Neon/Supabase)
- AWS S3 bucket (or LocalStack for local dev)
- SMTP credentials (Resend SMTP recommended)

---

## 1. Environment Variables

Add the following to your `.env.local` (see `.env.example` for the full template):

```bash
# Certification Module — Signing
CERTIFICATE_SIGNING_SECRET="<random-256-bit-hex-string>"

# Certification Module — Storage (S3)
AWS_ACCESS_KEY_ID="<your-key>"
AWS_SECRET_ACCESS_KEY="<your-secret>"
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="scholarx-certificates"

# Certification Module — Email (Nodemailer SMTP)
SMTP_HOST="smtp.resend.com"
SMTP_PORT="465"
SMTP_USER="resend"
SMTP_PASS="<resend-api-key>"
SMTP_FROM="ScholarX <no-reply@scholarx.lk>"

# App public URL (for claim links and verification URLs)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 2. Run Database Migration

After adding the new `certification-schema.ts`:

```bash
pnpm db:generate    # generates migration files
pnpm db:migrate     # applies migration to your PostgreSQL DB
```

---

## 3. Install New Dependencies

```bash
pnpm add html-to-image @react-email/render
```

---

## 4. Configure Completion Criteria (Admin)

Use the admin dashboard or directly insert a `completion_criteria` row for your test course:

```sql
INSERT INTO completion_criteria (course_slug, min_watch_pct, quizzes_required, min_quiz_score)
VALUES ('my-test-course', 90, false, null);
```

---

## 5. Test the Completion Flow (Local)

1. Start the dev server: `pnpm dev`
2. Navigate to a lesson: `http://localhost:3000/courses/my-test-course/lessons/1`
3. Seek the video to 90%+ of its duration.
4. The `useLessonProgress` hook fires `onCompleted` → the celebration modal appears.
5. Check your email (or Nodemailer preview) for the claim email.
6. Click the claim link → `http://localhost:3000/certificates/claim/<token>`
7. Verify the certificate → `http://localhost:3000/verify/<certificate-id>`

---

## 6. Test Bulk Issuance (Admin)

```bash
# POST to bulk issue endpoint (replace token with your admin session token)
curl -X POST http://localhost:3000/api/certificates/bulk \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=<your-session>" \
  -d '{"courseSlug": "my-test-course"}'
```

Poll the job status:
```bash
curl http://localhost:3000/api/certificates/jobs/<jobId> \
  -H "Cookie: better-auth.session_token=<your-session>"
```

---

## 7. Key Source Locations

| Area | Path |
|------|------|
| DB schema | `src/db/schema/certification-schema.ts` |
| Domain types & Zod schemas | `src/domain/certificates/` |
| Certificate service | `src/domain/certificates/certificate.service.ts` |
| Signing utility | `src/lib/certificate-signing.ts` |
| PDF generator | `src/lib/certificate-pdf.tsx` |
| PNG generator | `src/lib/certificate-png.tsx` |
| Email templates | `src/lib/emails/` |
| S3 helpers | `src/lib/storage.ts` (existing, shared) |
| API routes | `src/app/api/certificates/` |
| Lesson progress hook | `src/hooks/use-lesson-progress.ts` |
| Celebration modal | `src/components/certificates/CelebrationModal.tsx` |
| Verification page | `src/app/verify/[id]/page.tsx` |
| Claim page | `src/app/certificates/claim/[token]/page.tsx` |
| Wallet page | `src/app/my/certificates/page.tsx` |
| Public portfolio page | `src/app/u/[username]/certificates/page.tsx` |
| Admin dashboard | `src/app/api/certificates/route.ts` + admin UI |

---

## 8. Running Tests

```bash
# All tests
pnpm test

# Certification module tests only
node --import tsx --test src/domain/certificates/**/*.test.ts
node --import tsx --test src/lib/certificate-signing.test.ts
```
