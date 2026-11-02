# App requirements and repair queue

Record the configuration and external services each app needs to run. Store only variable names and instructions here, never credentials.

## Chowly

Repository: https://github.com/Danny-Kyle/chowly-restaurant-app
Review branch: `codex/chowly-reliability`.

### Runtime

- Node.js 22 or newer; Node.js 24 was used for verification.
- npm and the committed `package-lock.json`; install with `npm ci`.
- Supabase project with PostgreSQL and its REST/RPC API enabled.
- Next.js server hosting (Vercel or another Node.js host). A static-only host cannot run the API routes.

### Server configuration

Set these in `.env.local` for local development, or the hosting provider's environment settings:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SECRET_KEY` | Server-side secret API key, used only by server repositories. Never prefix it with `NEXT_PUBLIC_`, put it in browser code, or commit its value. |

The previous `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` configuration is not sufficient for this review branch. No real payment provider, customer authentication provider, or email service is required: this is a shared fictional demo with a Customer/Waiter switch and clearly labelled pretend payments.

### Database setup

- New, empty project: run `supabase/schema.sql`, then `supabase/migrations/001_atomic_workflows.sql`.
- Existing project: run only the migration. Do not rerun the base schema or delete current data.
- The migration installs transactional RPC functions and revokes public-role table/function access. The server key must be configured together with the migrated application.
- Use a separate preview database/project for this review branch. Applying the access restrictions to the current live database while the old anon-key app is running would interrupt that version.
- Seeded restaurant and waiter IDs are `RES001` and `WAI001`, matching `lib/constants.ts`.

### Run and verify

```bash
npm ci
npm run dev
# Open http://localhost:3000
npm test
npm run typecheck
npm run build
npm start
```

The build needs internet to fetch the existing Google fonts on a cold build. Running database-backed features requires valid server settings and the migration; compiling the app does not.

For database regression tests: Python 3, the PostgreSQL `psql` client, and an expendable database named exactly `chowly_test`. Set `TEST_DATABASE_URL` and optionally `PSQL_BIN`, load the base schema once, then run `python tests/test_database.py`. The suite truncates test order/customer data and refuses other database names. It must never target the hosted demo.

Verified locally: 19 API tests, 16 PostgreSQL tests, TypeScript, and production build. GitHub Actions also passed for the repair commit. Production dependency audit was clear; 16 moderate development-tool findings are documented in `docs/RELIABILITY-REPAIR.md`.

### Outstanding hosted work

Configure a separate preview Supabase project, apply the migration, set the server environment variables, deploy the branch preview, and verify the complete customer/waiter journey there. The production app and database have not been changed by the repair.
