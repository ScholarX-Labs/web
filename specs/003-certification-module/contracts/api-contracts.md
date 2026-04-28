# API Contracts: Certification Module

**Branch**: `003-certification-module` | **Date**: 2026-04-28  
**Base Path**: `/api/certificates`  
**Auth**: All protected routes require a valid Better-Auth session cookie. Role: `admin` unless marked `Public`.

---

## 1. Issue Certificate (Single)

**POST** `/api/certificates`

**Auth**: Admin only

**Request Body**:
```json
{
  "courseSlug": "string",
  "userId": "string",
  "recipientName": "string",
  "recipientEmail": "user@example.com",
  "role": "mentee | mentor"
}
```

**Response `201`**:
```json
{
  "id": "uuid",
  "shortId": "SX-2026-00142",
  "status": "PENDING",
  "claimToken": "string",
  "claimTokenExpiry": "ISO-8601"
}
```

**Response `409`** (duplicate):
```json
{ "error": "Certificate already exists for this user and course" }
```

---

## 2. Bulk Issue (Season)

**POST** `/api/certificates/bulk`

**Auth**: Admin only

**Request Body**:
```json
{
  "courseSlug": "string"
}
```

**Response `202`**:
```json
{
  "jobId": "uuid",
  "status": "QUEUED",
  "totalCount": 42
}
```

---

## 3. Get Bulk Job Status

**GET** `/api/certificates/jobs/[jobId]`

**Auth**: Admin only

**Response `200`**:
```json
{
  "id": "uuid",
  "courseSlug": "string",
  "status": "RUNNING | COMPLETED | PARTIAL | FAILED",
  "totalCount": 42,
  "processedCount": 30,
  "failedCount": 2
}
```

---

## 4. List Certificates

**GET** `/api/certificates?courseSlug=&status=&role=&page=&limit=`

**Auth**: Admin only

**Response `200`**:
```json
{
  "data": [
    {
      "id": "uuid",
      "shortId": "SX-2026-00142",
      "recipientName": "string",
      "recipientEmail": "string",
      "courseTitle": "string",
      "role": "mentee | mentor",
      "status": "PENDING | CLAIMED | REVOKED | FAILED",
      "claimedAt": "ISO-8601 | null",
      "createdAt": "ISO-8601"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 150 }
}
```

---

## 5. Revoke Certificate

**PATCH** `/api/certificates/[id]/revoke`

**Auth**: Admin only

**Request Body**:
```json
{ "reason": "string" }
```

**Response `200`**:
```json
{ "id": "uuid", "status": "REVOKED", "revokedAt": "ISO-8601" }
```

---

## 6. Resend Claim Email

**POST** `/api/certificates/[id]/resend`

**Auth**: Admin only

**Response `200`**:
```json
{ "id": "uuid", "message": "Claim email resent successfully." }
```

---

## 7. Claim Certificate

**GET** `/api/certificates/claim/[token]`

**Auth**: Public (claim token acts as credential)

**Response `200`**:
```json
{
  "id": "uuid",
  "shortId": "SX-2026-00142",
  "recipientName": "string",
  "courseTitle": "string",
  "courseSlug": "string",
  "role": "mentee | mentor",
  "issuedAt": "ISO-8601",
  "pdfUrl": "presigned-s3-url (15 min TTL)",
  "pngUrl": "presigned-s3-url (15 min TTL)",
  "verificationUrl": "https://scholarx.lk/verify/uuid"
}
```

**Response `410`** (expired or already claimed):
```json
{ "error": "Claim token expired or already used." }
```

---

## 8. Verify Certificate

**GET** `/api/certificates/verify/[id]`

**Auth**: Public

**Response `200`**:
```json
{
  "status": "VALID | REVOKED | INVALID",
  "certificateId": "uuid",
  "shortId": "SX-2026-00142",
  "recipientName": "string",
  "courseTitle": "string",
  "role": "mentee | mentor",
  "issuedAt": "ISO-8601",
  "claimedAt": "ISO-8601 | null",
  "signatureFingerprint": "string (last 16 hex chars)",
  "signatureValid": true,
  "pngUrl": "presigned-s3-url | null"
}
```

---

## 9. Get Portfolio

**GET** `/api/certificates/portfolio/[username]`

**Auth**: Public

**Response `200`**:
```json
{
  "username": "string",
  "displayName": "string",
  "certificates": [
    {
      "id": "uuid",
      "shortId": "SX-2026-00142",
      "courseTitle": "string",
      "role": "mentee | mentor",
      "issuedAt": "ISO-8601",
      "verificationUrl": "string",
      "pngUrl": "presigned-s3-url"
    }
  ]
}
```

**Response `404`** (profile disabled or not found):
```json
{ "error": "Profile not available." }
```

---

## 10. Set Portfolio Username

**POST** `/api/certificates/portfolio/username`

**Auth**: Authenticated user (any role)

**Request Body**:
```json
{ "username": "string (3–30 chars, alphanumeric + hyphens)" }
```

**Response `200`**:
```json
{ "username": "string", "portfolioEnabled": true }
```

**Response `409`** (username taken):
```json
{ "error": "Username already taken." }
```

---

## 11. Check Username Availability

**GET** `/api/certificates/portfolio/username/check?username=string`

**Auth**: Authenticated user

**Response `200`**:
```json
{ "available": true }
```

---

## Internal Event Contract

The Courses service emits the following internal application event (via a shared in-process event bus or direct function call) when a learner's lesson watch threshold is crossed:

```ts
interface CourseCompletionEvent {
  userId:       string;   // Better-Auth user.id
  courseSlug:   string;
  courseTitle:  string;
  role:         "mentee" | "mentor";
  completedAt:  number;   // unix ms
}
```

The `CertificationService.handleCourseCompletion(event)` method subscribes to this event and triggers synchronous single-certificate issuance.
