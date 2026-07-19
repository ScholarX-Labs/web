# Feature Specification: Admin Cash Enrollment

**Feature Branch**: `017-admin-cash-enrollment`
**Created**: 2026-07-19
**Status**: Approved
**Authors**: Principal Engineering, ScholarX Platform
**Input**: User description: "Admin must be able to create user accounts for cash-paying customers and enroll them in paid courses from the dashboard"

---

## Overview

The Admin Cash Enrollment feature enables administrators to onboard cash-paying customers by creating their accounts and enrolling them in paid courses directly from the admin dashboard. This bridges the gap between offline payment collection (cash, bank transfer) and online course access provisioning.

---

## User Scenarios & Testing

### User Story 1 — Create User Account (Priority: P1)

As an admin, I want to create a new user account from the admin dashboard so that I can provision access for cash-paying customers who have not self-registered.

**Why this priority**: Without user creation capability, the admin cannot enroll anyone who doesn't already have an account. This is the foundational prerequisite.

**Independent Test**: Navigate to admin users page. Click "Create User". Fill in email, name, and optional phone. Submit. Verify user appears in the users list and the generated password is displayed.

**Acceptance Scenarios**:

1. **Given** I am an admin on the users page, **When** I click "Create User" and fill in a valid email, first name, and last name, **Then** a new user account is created and the user appears in the users list.
2. **Given** I am an admin creating a user, **When** the email already exists in the system, **Then** I receive a clear error message and the form remains populated so I can correct it.
3. **Given** I am an admin creating a user, **When** the creation succeeds, **Then** the system-generated temporary password is displayed in the UI so I can relay the credentials to the user (e.g., via WhatsApp, phone call, or in-person), and the action is logged for audit purposes.
4. **Given** the newly created user logs in for the first time, **When** they enter the temporary password, **Then** they are prompted to change their password before accessing the platform.

### User Story 2 — Enroll User in Course (Priority: P1)

As an admin, I want to enroll an existing user in a course with a payment method and amount so that I can grant access to customers who have paid via cash or bank transfer.

**Why this priority**: This is the core business value — provisioning course access after offline payment.

**Independent Test**: Navigate to admin course detail page. Click "Enrollments" tab. Click "Enroll User". Search for a user by email. Select payment method (cash/bank transfer/other). Enter amount. Submit. Verify the user is now enrolled and appears in the enrolled users list.

**Placement**: The enrollment flow lives in the admin dashboard at `/admin/courses/[courseId]` as a dedicated **"Enrollments" tab** alongside the existing Curriculum, General, Pricing, Media, and Management tabs. This keeps all course-related admin operations in one place while staying fully within the admin dashboard (not mixed into user-facing pages).

**Acceptance Scenarios**:

1. **Given** I am on a course detail page, **When** I click "Enroll User" and search for an existing user by email, **Then** I can select the user and choose a payment method (cash, bank transfer, or other).
2. **Given** I have selected a user and payment method, **When** I enter the payment amount and submit, **Then** the user is enrolled with an active subscription and the payment details are recorded.
3. **Given** I am enrolling a user who already has an active subscription to this course, **When** I submit the enrollment, **Then** I receive a clear error message and no duplicate subscription is created.
4. **Given** I am enrolling a user, **When** the enrollment succeeds, **Then** the action is logged for audit purposes including the payment method and amount.

### User Story 3 — Combined Create and Enroll (Priority: P2)

As an admin, I want to create a user account AND enroll them in a course in a single flow so that I can efficiently onboard new cash-paying customers without navigating between pages.

**Why this priority**: Reduces admin friction for the common "new cash customer" workflow.

**Independent Test**: Navigate to admin Operations section. Click "Cash Enrollment". Fill in user details, select course, enter payment info. Submit. Verify user is created and enrolled. Verify generated password is displayed.

**Placement**: The combined create+enroll flow lives in a dedicated **"Cash Enrollment"** page under the **Operations** section of the admin dashboard at `/admin/operations/cash-enrollment`. Operations is a new top-level admin section for multi-step manual workflows. This keeps the flow discoverable, gives it enough space for a multi-step form (create user → select course → payment details → confirm), and avoids cluttering course-specific or user-specific pages.

**Acceptance Scenarios**:

1. **Given** I am on the enroll user form, **When** I toggle "Create new account" and fill in email, first name, last name, **Then** the form validates both user details and payment details together before submission, and after successful creation the generated password is displayed so I can relay it to the user.
2. **Given** I submit the combined create+enroll form, **When** both user creation and enrollment succeed, **Then** both actions are logged for audit purposes.
3. **Given** I submit the combined create+enroll form, **When** user creation succeeds but enrollment fails, **Then** the user account is preserved and I receive an error about the enrollment failure.

---

### Edge Cases

- **User Already Enrolled**: The system must prevent duplicate active subscriptions for the same user and course.
- **Invalid Email on Create**: The system must validate email format before attempting creation and show clear errors.
- **Course Not Found**: The enrollment flow must validate the course exists and is accessible.
- **Concurrent Enrollment**: Two admins enrolling the same user simultaneously must not create duplicates.
- **Missing Required Fields**: The form must require email, first name, last name for user creation, and payment method + amount for enrollment.

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow admins to create new user accounts with email, first name, last name, and optional phone number.
- **FR-002**: System MUST generate a secure random temporary password for each new user account.
- **FR-003**: System MUST force the user to change their temporary password on first login before accessing the platform.
- **FR-004**: System MUST allow admins to enroll existing users in courses by specifying the user, course, payment method, and amount.
- **FR-005**: System MUST support payment methods: cash, bank transfer, and other.
- **FR-006**: System MUST prevent duplicate active subscriptions for the same user and course combination.
- **FR-007**: System MUST record audit logs for both user creation and enrollment actions.
- **FR-008**: System MUST support a combined flow where a user is created and enrolled in a single operation.
- **FR-009**: System MUST display the enrolled users list on a dedicated "Enrollments" tab within the admin course detail page.
- **FR-010**: System MUST display the generated temporary password to the admin after user creation so credentials can be relayed to the user.
- **FR-011**: System MUST provide a dedicated "Cash Enrollment" page under the admin Operations section at `/admin/operations/cash-enrollment` for the combined create+enroll flow.

### Non-Functional Requirements

- **NFR-001 Performance**: Admin user creation and enrollment must complete within 3 seconds at the 95th percentile.
- **NFR-002 Reliability**: All mutations must be idempotent — retrying the same enrollment does not create duplicates.
- **NFR-003 Auditability**: Every admin action must be traceable to the admin who performed it, including their IP address and device information.

### Key Entities

- **User**: A platform account with email, name, and optional phone — the identity that accesses courses.
- **Subscription**: A record linking a user to a course with payment details — the grant of access.
- **Audit Log**: An immutable record of admin actions — for compliance and troubleshooting.

---

## Success Criteria

### Measurable Outcomes

- **SC-001 Efficiency**: Admin can create a user account and enroll them in a course within 30 seconds using the combined flow.
- **SC-002 Data Integrity**: Zero duplicate subscriptions created via the admin enrollment flow.
- **SC-003 Compliance**: 100% of admin enrollment actions are captured in the audit log.

---

## Assumptions

- The platform already has an authentication system that supports user creation.
- The platform already has a subscription model linking users to courses.
- Admins have elevated permissions that allow them to create users and manage enrollments.
- The existing admin dashboard has a users section and course management section.
- The platform supports forced password change on first login.
- A new "Operations" section will be added to the admin sidebar to house multi-step admin workflows.
