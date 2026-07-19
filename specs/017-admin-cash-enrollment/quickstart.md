# Quickstart: Admin Cash Enrollment

**Feature**: `017-admin-cash-enrollment`
**Date**: 2026-07-19

---

## Prerequisites

- Node.js 20+
- PostgreSQL (Docker or local)
- pnpm installed

---

## Local Development Setup

### 1. Apply Database Migrations

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply to local database
pnpm db:push
```

Verify the new columns exist:

```sql
-- Check paymentMethod column
SELECT column_name FROM information_schema.columns
WHERE table_name = 'subscriptions' AND column_name = 'payment_method';

-- Check mustChangePassword column
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user' AND column_name = 'must_change_password';
```

### 2. Start Dev Server

```bash
pnpm dev
```

### 3. Test User Creation

1. Navigate to `/admin/users`
2. Click "Create User"
3. Fill in: email (`test@example.com`), firstName (`Test`), lastName (`User`)
4. Submit
5. Verify:
   - User appears in the users list
   - Temporary password is displayed in the UI
   - Audit log entry exists in `admin_audit_log`

### 4. Test Enrollment

1. Navigate to `/admin/courses/[courseId]`
2. Click "Enrollments" tab
3. Click "Enroll User"
4. Search for the user by email
5. Select payment method: "cash"
6. Enter amount: `50`
7. Submit
8. Verify:
   - Subscription appears in the enrolled users list
   - `payment_method` is "cash" in the database
   - Audit log entry exists

### 5. Test Combined Flow

1. Navigate to `/admin/operations/cash-enrollment`
2. Fill in user details (email, firstName, lastName)
3. Select a course
4. Select payment method: "bank_transfer"
5. Enter amount: `75`
6. Submit
7. Verify:
   - User is created
   - Subscription is created
   - Temporary password is displayed
   - Both audit log entries exist

### 6. Test Forced Password Change

1. Log out as admin
2. Log in as the newly created user with the temporary password
3. Verify:
   - Redirected to change-password page
   - Cannot access any other page until password is changed
4. Set a new password
5. Verify:
   - Can now access the platform normally
   - `must_change_password` is `false` in the database

---

## API Testing

### Create User

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "email": "cash-customer@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "phoneNumber": "+1234567890"
  }'
```

### Enroll User

```bash
curl -X POST http://localhost:3000/api/admin/courses/COURSE_ID/enroll \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "email": "cash-customer@example.com",
    "paymentMethod": "cash",
    "amount": 5000
  }'
```

### Combined Cash Enrollment

```bash
curl -X POST http://localhost:3000/api/admin/operations/cash-enrollment \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "user": {
      "email": "new-customer@example.com",
      "firstName": "Bob",
      "lastName": "Johnson"
    },
    "courseId": "COURSE_ID",
    "paymentMethod": "bank_transfer",
    "amount": 7500
  }'
```

---

## Verification Checklist

- [ ] `payment_method` column exists in `subscriptions` table
- [ ] `must_change_password` column exists in `user` table
- [ ] POST `/api/admin/users` creates a user and returns temporary password
- [ ] POST `/api/admin/courses/[courseId]/enroll` creates a subscription with payment method
- [ ] POST `/api/admin/operations/cash-enrollment` creates both user and subscription
- [ ] Duplicate enrollment returns 409 error
- [ ] All mutations create audit log entries
- [ ] Temporary password is displayed after user creation
- [ ] Forced password change works on first login
- [ ] Enrollments tab shows enrolled users list
- [ ] Operations/Cash Enrollment page is accessible from admin sidebar
