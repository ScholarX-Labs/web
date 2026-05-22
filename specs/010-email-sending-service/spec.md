# Feature Specification: Production Email Sending Service

**Feature Branch**: `010-email-sending-service`  
**Created**: 2026-05-22  
**Status**: Draft  
**Input**: User description: "Build a professional production-grade email sending service loop starting from the working email sending method in `C:\Users\dell\Documents\ScholarX\V2\email-test\test_email.py`, send through Gmail if that approach fails, and know whether each email worked or not."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Send Critical Platform Emails Reliably (Priority: P1)

As ScholarX, the platform needs to send transactional emails for user-facing workflows through the primary verified ScholarX sending channel, with a backup Gmail channel if the primary channel fails, so important messages are not silently lost.

**Why this priority**: Reliable email is the core user value. Without a successful primary send path and controlled fallback, users may miss account, application, scholarship, course, or operational communications.

**Independent Test**: Submit a valid email request while the primary sending channel is available and confirm the recipient receives a single message, the request is marked successful, and no fallback attempt is made.

**Acceptance Scenarios**:

1. **Given** a valid email request and an available primary sending channel, **When** the system sends the email, **Then** it records a successful primary-channel outcome and does not use Gmail fallback.
2. **Given** a valid email request and a temporary primary-channel failure, **When** the system sends the email, **Then** it attempts Gmail fallback and records whether the fallback was accepted or failed.
3. **Given** a valid email request and all sending channels fail, **When** the system exhausts allowed attempts, **Then** it records a failed outcome with a safe failure reason for operational review.

---

### User Story 2 - Know Whether Email Sending Worked (Priority: P1)

As an operator or developer responsible for ScholarX communications, I need a clear result for every outbound email request so I can tell whether the message was accepted by a sending provider, failed before acceptance, or later reported as undeliverable when that signal is available.

**Why this priority**: Production email must be observable. "No exception thrown" is not enough because operations need evidence for retries, support cases, and incident diagnosis.

**Independent Test**: Send test emails across success, primary failure, fallback success, validation failure, and full failure cases, then verify each request has a final status, attempt history, timestamps, and a non-sensitive reason code.

**Acceptance Scenarios**:

1. **Given** an email accepted by the primary channel, **When** an operator checks the request status, **Then** the status shows accepted, primary channel, accepted time, and provider reference if available.
2. **Given** an email accepted by Gmail fallback after primary failure, **When** an operator checks the request status, **Then** the status shows fallback accepted and includes both the failed primary attempt and successful fallback attempt.
3. **Given** an email rejected before any provider accepts it, **When** an operator checks the request status, **Then** the status shows failed with a validation, configuration, authentication, rate-limit, or provider-unavailable reason.
4. **Given** a provider later reports a bounce or delivery failure, **When** the status is reviewed, **Then** the original accepted status is updated or supplemented with the later delivery event.

---

### User Story 3 - Protect Recipients, Credentials, and Reputation (Priority: P2)

As ScholarX, the email service must prevent unsafe sending behavior, protect credentials, and avoid leaking sensitive content in logs or status views.

**Why this priority**: Email sending touches user data, account reputation, and private credentials. A production service must not preserve hardcoded passwords or expose message bodies unnecessarily.

**Independent Test**: Configure the service without hardcoded secrets, send messages containing personal data, and verify credentials are not stored in source files, logs do not expose full message bodies or secrets, and unauthorized users cannot inspect delivery records.

**Acceptance Scenarios**:

1. **Given** production credentials are required, **When** the service is configured, **Then** credentials are provided through managed private configuration and not committed to source-controlled files.
2. **Given** a send attempt fails, **When** the error is recorded, **Then** the record excludes passwords, tokens, full message bodies, and private provider responses.
3. **Given** a non-admin user requests delivery records, **When** access is evaluated, **Then** private email operation details are denied.

---

### User Story 4 - Support Operational Retries and Recovery (Priority: P2)

As an operator, I need failed or temporarily blocked email requests to be retryable without accidentally sending duplicates, so transient provider failures can be recovered safely.

**Why this priority**: Production providers can fail temporarily. Recovery must be deliberate and idempotent to protect recipients and sender reputation.

**Independent Test**: Create a send request with a stable idempotency key, force temporary failure, retry the same request, and confirm the system does not create duplicate accepted messages for the same intended email.

**Acceptance Scenarios**:

1. **Given** a temporary failure and remaining retry allowance, **When** the service retries, **Then** it records each attempt and stops after the first accepted provider response.
2. **Given** the same email request is submitted more than once with the same idempotency key, **When** the system processes the duplicates, **Then** recipients receive no more than one accepted message for that request.
3. **Given** an operator manually retries a failed request, **When** the retry is accepted, **Then** the status reflects the retry outcome while preserving the earlier attempt history.

### Edge Cases

- Primary channel accepts a message but the network response is lost before the service can record the outcome.
- Primary channel fails due to authentication or configuration errors that should not trigger endless retries.
- Gmail fallback is unavailable, rate-limited, or disabled by configuration.
- Recipient address is malformed, blocked, duplicated, or belongs to an unsubscribed recipient where applicable.
- Message content is too large, missing required subject/body fields, or contains unsupported attachments.
- Multiple workers or repeated requests try to send the same message at the same time.
- Provider reports success at send time but later sends a bounce or complaint.
- Operational logs need enough context to debug failures without exposing secrets or private message content.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept outbound email requests containing recipient, sender identity, subject, body content, email category, and a caller-provided request identifier or idempotency key.
- **FR-002**: System MUST validate required email fields before attempting delivery and reject invalid requests with actionable, non-sensitive error details.
- **FR-003**: System MUST attempt delivery through the primary verified ScholarX sending channel before attempting any fallback channel.
- **FR-004**: System MUST attempt Gmail fallback when the primary channel fails with a retryable or provider-specific sending failure and fallback is enabled.
- **FR-005**: System MUST avoid Gmail fallback when the primary channel has already accepted the message, even if a later delivery event reports a bounce.
- **FR-006**: System MUST stop sending attempts for a request after the first provider acceptance unless an authorized operator explicitly creates a new retry action after a final failure or later bounce.
- **FR-007**: System MUST record a delivery record for every email request, including current status, requested time, final decision time, selected channel, and safe reason code.
- **FR-008**: System MUST record an attempt history for every provider attempt, including attempt order, channel name, start time, end time, outcome, and sanitized failure category.
- **FR-009**: System MUST expose a way for authorized internal users or services to query the status of an email request by its stable request identifier.
- **FR-010**: System MUST distinguish provider acceptance from confirmed inbox delivery when presenting outcomes.
- **FR-011**: System MUST support later delivery events such as bounce, complaint, or delivery failure when a provider makes those events available.
- **FR-012**: System MUST support safe retry of failed requests without creating duplicate accepted sends for the same idempotent request.
- **FR-013**: System MUST classify failures into at least validation failure, configuration failure, authentication failure, provider unavailable, rate limited, recipient rejected, content rejected, timeout, and unknown failure.
- **FR-014**: System MUST keep provider credentials, passwords, tokens, and private connection details out of source-controlled files and user-visible responses.
- **FR-015**: System MUST avoid storing or logging full email bodies in routine operational logs unless an explicitly authorized diagnostic mode is enabled for a bounded incident.
- **FR-016**: System MUST provide a controlled test mode that can verify configuration and sending behavior without emailing real users unintentionally.
- **FR-017**: System MUST rate-limit or otherwise constrain abusive or runaway email sending by caller, category, and recipient where appropriate.
- **FR-018**: System MUST provide operator-visible health information for configured sending channels without exposing credentials.
- **FR-019**: System MUST produce clear alerts or failure signals when both primary and fallback sending are failing above an operational threshold.
- **FR-020**: System MUST preserve public, authenticated, and admin data boundaries when exposing email status or diagnostic information.
- **FR-021**: System MUST prevent concurrent processors from sending the same pending email request more than once.
- **FR-022**: System MUST define a production execution model for delayed retries that can operate independently of user-facing page requests.
- **FR-023**: System MUST emit structured operational signals for accepted, failed, fallback, retried, delayed, bounced, and complained email outcomes.
- **FR-024**: System MUST reduce pressure on unhealthy sending channels during sustained provider outages.
- **FR-025**: System MUST support at least 50,000 users and campaign-style transactional spikes without degrading unrelated ScholarX workflows.

### Key Entities *(include if feature involves data)*

- **Email Request**: A single intended outbound email with recipient, sender identity, subject, body reference or content, category, idempotency key, requested by, and requested time.
- **Email Delivery Record**: The durable status of an email request, including current lifecycle state, accepted channel, final reason code, provider reference when available, and timestamps.
- **Email Attempt**: One attempt to send an email through a specific channel, including ordering, channel, result, timing, and sanitized diagnostic category.
- **Sending Channel**: A configured outbound provider identity such as the primary ScholarX sending channel or Gmail fallback, with enablement state and operational health.
- **Delivery Event**: A later provider-reported event such as delivered, bounced, complained, deferred, or rejected after initial acceptance.
- **Email Template or Message Content**: The subject and body content used for an email category, including variables and rendered output rules.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 99% of valid transactional email requests receive a final accepted or failed status within 60 seconds under normal operating conditions.
- **SC-002**: When the primary sending channel is unavailable but Gmail fallback is healthy, at least 95% of valid fallback-eligible email requests are accepted by the fallback channel within 2 minutes.
- **SC-003**: 100% of email requests have a queryable delivery record with current status and attempt history.
- **SC-004**: Duplicate accepted sends for the same idempotent email request occur in fewer than 1 out of 100,000 requests.
- **SC-005**: Operators can determine the latest outcome of a specific email request in under 30 seconds using the request identifier.
- **SC-006**: No production provider credentials or passwords are present in source-controlled files, routine logs, or user-visible error responses.
- **SC-007**: During provider outage drills, the service records primary failure, fallback decision, fallback result, and final status for 100% of test requests.
- **SC-008**: Support tickets caused by unknown email send status are reduced by at least 80% after rollout compared with the current manual test-script workflow baseline.
- **SC-009**: The service supports 50,000 ScholarX users with burst processing of 5,000 transactional email requests in 15 minutes while keeping 99% of requests in a final accepted or failed state within 2 minutes.
- **SC-010**: During a simulated multi-worker retry run, duplicate accepted sends for the same pending delivery are zero across at least 100,000 scheduled retry selections.
- **SC-011**: During a sustained primary-provider outage, the service limits calls to the unhealthy provider within the configured outage protection threshold and continues processing fallback-eligible requests.

## Assumptions

- The existing working test proves the primary ScholarX mailbox path can send at least basic plaintext email, but production credentials must be moved to managed private configuration before launch.
- Gmail fallback is intended as a backup channel for transactional reliability, not as the default sender identity.
- The first production scope covers transactional and operational platform emails, not marketing campaigns, newsletters, or bulk promotional sending.
- "Worked" means the sending provider accepted the email unless a later provider event reports bounce, complaint, or delivery failure; true inbox placement cannot be guaranteed by the application.
- Email status and diagnostics are internal operational data and should only be visible to authorized services, maintainers, or admins.
- The service should support future categories such as course applications, authentication, account notifications, scholarship alerts, and admin operations without coupling the sending workflow to one feature.
- Attachment support is not required for the first production release unless an existing ScholarX workflow already depends on it.
- Unsubscribe and preference handling applies to non-transactional categories; critical account and operational emails may follow separate compliance rules.
- The first release must be safe for more than 50,000 registered users, but bulk marketing/newsletter workflows remain outside v1 scope.
