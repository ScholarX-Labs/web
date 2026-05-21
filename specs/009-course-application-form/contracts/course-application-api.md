# Contract: Course Application API

## Submit Course Application

`POST /api/v1/courses/{courseId}/enroll/application`

Authentication: required learner session.

Rate limiting: required per authenticated user, course, and abuse key. Exact thresholds can be tuned, but V1 should protect against repeated submit attempts during campaign spikes.

Idempotency:

- Prefer `Idempotency-Key` header.
- Body `idempotencyKey` remains accepted for client compatibility.
- Key must be an opaque UUID-like value.
- Key is scoped to authenticated user and course.
- Key retention target: at least 24 hours.
- Same key with a different user or course must not replay a prior response.
- After the retention window expires, the same key is treated as a new request. Existing active-application uniqueness still prevents duplicate active applications.

Request body:

```json
{
  "name": "string",
  "age": 18,
  "email": "learner@example.com",
  "phone": "+201000000000",
  "learnerStatus": "high_school | undergraduate | graduate | professional",
  "highSchoolName": "string, required for high_school",
  "university": "string, required for undergraduate and graduate",
  "faculty": "string, required for undergraduate and graduate",
  "graduationYear": 2026,
  "workField": "string, required for professional",
  "yearsOfExperience": 3,
  "personalStatement": "string",
  "learningGoals": "string",
  "background": "string",
  "sourceSurface": "course_hero",
  "idempotencyKey": "uuid-or-client-generated-key"
}
```

Success response:

```json
{
  "success": true,
  "requestId": "uuid",
  "data": {
    "applicationId": "uuid",
    "status": "pending",
    "message": "Your application has been submitted. Our team will review it shortly."
  }
}
```

Standard error response:

```json
{
  "success": false,
  "requestId": "uuid",
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Please correct the highlighted fields.",
    "fieldErrors": {
      "email": ["Enter a valid email address."]
    }
  }
}
```

Error codes:

- `400 BAD_REQUEST`: missing or invalid fields.
- `401 UNAUTHORIZED`: signed-in user required.
- `404 COURSE_NOT_FOUND`: course does not exist or is inactive.
- `409 DUPLICATE_APPLICATION`: active application already exists.
- `409 APPLICATION_NOT_REQUIRED`: course does not require an application.
- `429 RATE_LIMITED`: submit rate limit exceeded.

Rate-limited response:

- HTTP status: `429`
- Header: `Retry-After: <seconds>`
- Error code: `RATE_LIMITED`

```json
{
  "success": false,
  "requestId": "uuid",
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many application attempts. Please wait before trying again."
  }
}
```

## Get Learner Application Status

`GET /api/v1/courses/{courseId}/enroll/application/status`

Authentication: required learner session.

Success response:

```json
{
  "success": true,
  "requestId": "uuid",
  "data": {
    "courseId": "uuid",
    "requiresApplication": true,
    "application": {
      "id": "uuid",
      "status": "pending",
      "submittedAt": "2026-05-21T00:00:00.000Z"
    }
  }
}
```

## Admin List Applications

`GET /api/v1/admin/course-applications?courseId={courseId}&status=pending&page=1&limit=20`

Authentication: admin only. V1 requires a ScholarX admin role; future course-scoped reviewer authorization must be added as an attribute-based extension.

Success response:

```json
{
  "success": true,
  "requestId": "uuid",
  "data": {
    "items": [
      {
        "id": "uuid",
        "courseId": "uuid",
        "courseTitle": "Course title",
        "applicantName": "Learner",
        "applicantEmail": "learner@example.com",
        "learnerStatus": "undergraduate",
        "status": "pending",
        "submittedAt": "2026-05-21T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

## Admin Get Application Detail

`GET /api/v1/admin/course-applications/{applicationId}`

Authentication: admin only.

Success response includes a discriminated conditional details object:

```json
{
  "success": true,
  "requestId": "uuid",
  "data": {
    "id": "uuid",
    "courseId": "uuid",
    "courseTitle": "Course title",
    "applicantName": "Learner",
    "applicantEmail": "learner@example.com",
    "age": 22,
    "phone": "+201000000000",
    "learnerStatus": "graduate",
    "status": "pending",
    "conditionalEducation": {
      "type": "graduate",
      "university": "Cairo University",
      "faculty": "Engineering",
      "graduationYear": 2025
    },
    "personalStatement": "Applicant text rendered as text.",
    "learningGoals": "Applicant text rendered as text.",
    "background": "Applicant text rendered as text.",
    "submittedAt": "2026-05-21T00:00:00.000Z",
    "reviewedAt": null,
    "reviewedBy": null,
    "reviewNotes": null
  }
}
```

## Admin Update Application Status

`PATCH /api/v1/admin/course-applications/{applicationId}/status`

Authentication: admin only.

Request body:

```json
{
  "status": "reviewing | approved | rejected | waitlisted | withdrawn",
  "reviewNotes": "Internal note"
}
```

Success response:

```json
{
  "success": true,
  "requestId": "uuid",
  "data": {
    "id": "uuid",
    "status": "approved",
    "reviewedAt": "2026-05-21T00:00:00.000Z",
    "reviewedBy": {
      "id": "admin-user-id",
      "name": "Admin Name"
    }
  }
}
```
