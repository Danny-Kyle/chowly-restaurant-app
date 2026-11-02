# Reliability repair — November 2026

## Scope

Preserve the assignment's shared Customer/Waiter switch, existing visual design, fictional data, and clearly labelled pretend payments. Prepare a review branch; do not merge main or change the hosted database.

## Findings and changes

1. Separate header/line inserts could leave empty or incomplete orders. `chowly_place_order` now validates stored menu availability/restaurant ownership and commits all rows together.
2. IDs were generated from the highest existing text ID, allowing concurrent collisions and incorrect lexical ordering beyond 999. New IDs use UUIDs while preserving text columns and existing records.
3. Payment trusted the submitted amount and wrote the payment and paid flag separately. The new function locks the order, verifies its served state and stored total, and returns an existing successful payment on replay.
4. Assignment ignored the URL order ID and trusted the client category. The function checks item ownership, stored category, staff role, and staff restaurant.
5. Serve/cancel checks and writes could race. Every order mutation takes the same row lock; replays preserve timestamps and cancellation history.
6. The combined complaint/rating UI made two independent requests. It now submits to `/api/orders/{id}/feedback`, which saves both or neither.
7. Invalid request bodies and fractional/non-finite numeric input were insufficiently validated. Shared validators and explicit HTTP error mapping now handle these cases.
8. Fetch errors could replace arrays with undefined, lose cancellation errors, or leave loading views stuck. The affected customer and waiter views now show errors and preserve valid data. Polling does not request an empty order ID and ignores responses belonging to an earlier order.
9. Name-based customer reuse treated unrelated people with matching display names as one customer and had inconsistent null handling. Each new identification creates a distinct demo customer; tab-scoped session restoration retains an existing one.
10. The public database key with disabled RLS bypassed the application's workflow checks. Server-only credentials and revoked public table/function privileges establish one application entry point. The shared demo is still intentionally unauthenticated.

## AI assistance

Codex reviewed the original assignment and implementation, proposed the transactional workflows, generated the migration and regression tests, and revised UI error handling and documentation. The user explicitly chose to preserve the demo flow rather than add sign-in, and requested a review branch. Actual PostgreSQL tests use competing connections and deliberately failing triggers to check rollback. Assertions that passed only by mocking transactions were not used as database evidence. New authentication, real payment processing, and production data migration are outside this repair.

## Verification limits

Tests use an isolated local PostgreSQL database, not the hosted Supabase project. A review preview still requires the migration and server credentials configured against a separate database. No live data, hosted settings, or main branch are changed by this work. Exact final check results are recorded after validation in this document.

## Final local checks — 2 November 2026

- Node.js 24.20.0; Next.js 16.4.4; PostgreSQL 18 on an isolated localhost cluster.
- 19 API/validation tests passed, including malformed bodies, numeric validation, status mapping, error redaction, and ID uniqueness.
- 16 real PostgreSQL tests passed, including simultaneous orders/payments, serve-versus-cancel, transaction rollback, public-role denial, and server-role access.
- TypeScript `tsc --noEmit` passed.
- `next build` completed successfully with no database credentials supplied.
- Production dependency audit: zero reported vulnerabilities after the compatible updates.
- Full dependency audit: 16 moderate findings remain in development tooling (ESLint/minimatch dependency chains). The audit's force option proposes breaking changes; those were not applied. This does not imply the repository is free of all possible security issues.
- Hosted Supabase workflows and a deployed preview were not tested: the preview database migration and server settings still need to be configured as described in the README.
- GitHub Actions verification is configured; its hosted result is separate from these local results.
