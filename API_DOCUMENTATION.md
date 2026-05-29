# API Documentation

## Overview
ScholarX API routes are implemented in the Next.js App Router under `src/app/api`. Routes validate input, call domain services, and return JSON responses.

## Major areas
- **Opportunities search:** `/api/opportunities/search` for AI‑powered scholarship search.
- **Courses & enrollment:** course listing, filtering, and enrollment flows.
- **Certificates:** issuance, verification, and delivery flows.
- **Analytics & dashboards:** executive analytics and KPI reporting.
- **Auth & accounts:** authentication and user management.

## Conventions
- Input validation uses Zod schemas.
- Domain services encapsulate business logic.
- Errors are surfaced through consistent API responses.

## Where to look
Browse `src/app/api` for the full route list and handler implementations.
