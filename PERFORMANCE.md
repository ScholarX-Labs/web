# ⚡ PERFORMANCE

## Performance Objectives
- Fast initial page load for public discovery routes
- Responsive interaction for authenticated product workflows
- Non-blocking analytics and observability paths

## Current Performance Patterns
1. Next.js App Router with server-first rendering where appropriate
2. Feature-focused client components for interactive surfaces only
3. Fail-open analytics dispatch to avoid user-facing latency impact
4. Route-level safeguards for cache/rate limit behavior where needed

## Analytics Performance Notes
- Client event dispatch is non-blocking
- Internal mirror writes do not block product flows
- Ingestion uses same-origin proxy for reliability and fewer network failures

## Optimization Opportunities
- Expand route-level caching policy where data boundaries are clear
- Add synthetic perf benchmarks for key flows (homepage, search, apply)
- Track Web Vitals and tie to release regressions

