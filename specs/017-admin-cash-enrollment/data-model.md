# Data Model: Admin Cash Enrollment

**Feature**: `017-admin-cash-enrollment`
**Date**: 2026-07-19

---

## Schema Changes

### 1. Add `paymentMethod` to `dbSubscriptions`

**Table**: `courses.subscriptions`
**Change**: Add new column

```typescript
paymentMethod: varchar("payment_method", { length: 50 })
```

**Values**: `"cash"`, `"bank_transfer"`, `"other"`
**Default**: `null` (for existing subscriptions without payment method)
**Nullable**: Yes (backward compatible)

---

### 2. Add `mustChangePassword` to `dbUsers`

**Table**: `auth.user`
**Change**: Add new column

```typescript
mustChangePassword: boolean("must_change_password").default(false).notNull()
```

**Default**: `false` (existing users don't need to change password)
**Nullable**: No (boolean with default)

---

## Entity Relationships

```
┌─────────────────┐       ┌─────────────────────┐
│    dbUsers       │       │   dbSubscriptions    │
│─────────────────│       │─────────────────────│
│ id (PK)         │◄──────│ user_id (FK)         │
│ email           │       │ course_id (FK)       │
│ name            │       │ payment_method       │
│ must_change_    │       │ amount               │
│   password      │       │ status               │
└─────────────────┘       └─────────────────────┘
        │                         │
        │                         │
        ▼                         ▼
┌─────────────────┐       ┌─────────────────────┐
│  admin_audit_    │       │    dbCourses         │
│      log         │       │─────────────────────│
│─────────────────│       │ id (PK)             │
│ admin_id (FK)   │       │ title               │
│ action          │       │ current_price       │
│ entity_type     │       └─────────────────────┘
│ entity_id       │
│ before (JSONB)  │
│ after (JSONB)   │
└─────────────────┘
```

---

## State Transitions

### User Creation Flow

```
[Admin fills form]
        │
        ▼
[POST /api/admin/users]
        │
        ├─── Generate temporary password
        ├─── Hash password (Better Auth)
        ├─── Insert user (mustChangePassword: true)
        ├─── Log audit event (user.create)
        │
        ▼
[Return { user, temporaryPassword }]
        │
        ▼
[Admin relays credentials to user]
        │
        ▼
[User logs in with temp password]
        │
        ▼
[Middleware detects mustChangePassword: true]
        │
        ▼
[Redirect to change-password page]
        │
        ▼
[User sets new password]
        │
        ▼
[mustChangePassword → false]
```

### Enrollment Flow

```
[Admin fills enrollment form]
        │
        ▼
[POST /api/admin/courses/[courseId]/enroll]
        │
        ├─── Validate user exists
        ├─── Validate course exists
        ├─── Check for existing active subscription (409 if duplicate)
        ├─── Insert subscription (paymentMethod, amount, status: "active")
        ├─── Log audit event (course.enroll_user)
        │
        ▼
[Return { subscription }]
```

### Combined Create + Enroll Flow

```
[Admin fills combined form]
        │
        ▼
[POST /api/admin/operations/cash-enrollment]
        │
        ├─── Create user (same as User Creation Flow)
        ├─── Enroll user (same as Enrollment Flow)
        │
        ├─── If user creation fails → return error, no subscription created
        ├─── If enrollment fails → user preserved, return enrollment error
        │
        ▼
[Return { user, temporaryPassword, subscription }]
```

---

## Validation Rules

### CreateUserSchema

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | Valid email format |
| firstName | string | Yes | 1-100 chars |
| lastName | string | Yes | 1-100 chars |
| phoneNumber | string | No | Any string |

### EnrollUserSchema

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | Valid email, must exist in db |
| paymentMethod | enum | Yes | "cash" \| "bank_transfer" \| "other" |
| amount | number | Yes | > 0 |

### CombinedCashEnrollmentSchema

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| user.email | string | Yes | Valid email format |
| user.firstName | string | Yes | 1-100 chars |
| user.lastName | string | Yes | 1-100 chars |
| user.phoneNumber | string | No | Any string |
| courseId | string (UUID) | Yes | Must exist in db |
| paymentMethod | enum | Yes | "cash" \| "bank_transfer" \| "other" |
| amount | number | Yes | > 0 |

---

## Audit Log Entries

### User Creation

```json
{
  "adminId": "admin-user-id",
  "action": "user.create",
  "entityType": "user",
  "entityId": "new-user-id",
  "after": {
    "email": "customer@example.com",
    "name": "John Doe"
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### Enrollment

```json
{
  "adminId": "admin-user-id",
  "action": "course.enroll_user",
  "entityType": "subscription",
  "entityId": "subscription-id",
  "after": {
    "userId": "user-id",
    "courseId": "course-id",
    "paymentMethod": "cash",
    "amount": 9900,
    "status": "active"
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```
