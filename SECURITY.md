# Security

## Secrets and configuration
- Secrets are sourced from environment variables; no secrets are stored in the repository.
- `.env.example` documents required variables.

## Database connections
- When SSL is enabled, the connection enforces `sslmode=verify-full` for secure Postgres connections.

## API protection
- Redis-backed rate limiting protects public endpoints.
- Sensitive flows use stricter failure behavior than public reads.

## Analytics governance
- Raw PII is excluded from analytics event payloads.

## Monitoring
- Sentry captures errors and performance regressions.
