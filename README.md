# Chowly

A shared restaurant-ordering demonstration built for the TeSA Africa Chowly assignment. Customers browse food and drinks, place orders, track estimated waiting time, submit feedback, and record a clearly labelled pretend payment. The Waiter view assigns kitchen/bar staff and marks orders served.

## Stack and structure

Next.js App Router, React, TypeScript, Tailwind CSS, Supabase/PostgreSQL, and Vercel.

- `components/`: Customer and Waiter interfaces.
- `app/api/`: HTTP input parsing and error responses.
- `services/`: input validation and workflow orchestration.
- `repositories/`: server-side database reads and RPC calls.
- `supabase/schema.sql`: original tables and fictional restaurant/menu/staff fixtures.
- `supabase/migrations/001_atomic_workflows.sql`: atomic workflows and database-access restrictions.
- `tests/`: API validation and real PostgreSQL transaction/concurrency tests.

## Local setup

Use Node.js 22 or newer and npm. Create a dedicated Supabase project for this demo.

1. For an **empty database**, run `supabase/schema.sql` in the SQL editor.
2. Run `supabase/migrations/001_atomic_workflows.sql`. For an existing installation, run **only the migration**; do not rerun the base schema or delete existing data.
3. Copy `.env.local.example` to `.env.local` and set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` using the server-side secret key from Supabase. Never use a `NEXT_PUBLIC_` prefix for this key or commit its value.
4. Run `npm ci`, then `npm run dev`. Open `http://localhost:3000`.

The server creates its Supabase client lazily. A production build does not require database credentials. Actual API requests require valid credentials and the migration.

Direct database access from anonymous and authenticated public API roles is revoked. The Next.js server uses the secret key to access the database. This protects the database entry point; it does **not** add individual authentication to this deliberately shared demo. Every visitor can use both roles. Use fictional data only.

## Walkthrough

1. Leave the role switch on **Customer** and enter a display name. Names do not identify accounts: two customers with the same name receive separate IDs.
2. Add food/drinks and place an order. Prices and preparation times are taken from the database, not the submitted cart. Kitchen and bar work in parallel; estimated wait is the larger station total.
3. Switch to **Waiter**, open the order, and assign a chef to each food item and a bartender to each drink item. Staff must belong to the order's restaurant. Mark the order served once every item is assigned.
4. Switch back to Customer. The active customer, cart, and order survive refreshes and role switching in the same tab. The existing simulated two-minute delivery display remains: Preparing, Delivering, then Served.
5. Submit a complaint and rating if needed. The combined form saves both records in one transaction. It rejects invalid ratings and a customer/order mismatch. Names/IDs in this public demo are labels, not authentication.
6. Click **Pretend Payment** once the customer display reaches Served. No real money is charged. The stored amount must match the database total; the payment record and paid flag commit together. Repeating a successful payment returns the same record.
7. An unpaid Pending order may be cancelled from either role. Served orders cannot be cancelled, and cancelled orders cannot be served or paid. Start a new order after cancellation or payment.

The in-browser session is tab-scoped; database records remain after refreshing or closing the page. If browser storage is unavailable, the current in-memory session still works but cannot survive refresh.

## Data integrity

- Order header and all line items are created in one PostgreSQL function transaction.
- Database-generated UUID-based text IDs replace the unsafe read-largest-ID-then-increment approach. Existing IDs remain valid.
- Assignment, serving, cancellation, and payment lock the order row so competing operations cannot overwrite each other after checking stale state.
- Assignment derives the food/drink category from stored menu data and verifies that the item belongs to the URL's order.
- Payment accepts only the full stored order total and only a served order. Replay does not create another successful payment.
- The combined complaint/rating form uses one transaction, so a failed rating insert cannot leave a complaint saved on its own. Individual complaint and rating API endpoints remain for compatibility.
- Expected invalid requests return 400, missing records 404, and invalid state transitions 409. Unexpected database failures return a generic 500 response and are logged server-side.
- Row-level security is enabled and direct public-role table/function privileges are revoked. The original no-login role switch is retained.

## Verification

```bash
npm test
npm run typecheck
npm run build
```

Database regression tests require Python 3, `psql`, and a **disposable database named `chowly_test`**. The test suite truncates orders/customers and their dependent records in that database and refuses any other database name. Do not point it at the hosted demo or a database with data you want to keep.

Example using a local PostgreSQL installation or container:

```bash
# Set TEST_DATABASE_URL to your disposable database connection.
# Apply schema.sql once before the first test run.
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/schema.sql
python tests/test_database.py
```

`psql` must be on PATH, or set `PSQL_BIN` to its executable path. Tests apply/reapply the migration, then exercise actual PostgreSQL transactions and competing connections. The optional default test URL is `postgresql://chowly_test@127.0.0.1:55439/chowly_test`.

## Review-branch deployment

Create a separate Supabase project or database copy for the preview. Apply the schema/migration there and configure `SUPABASE_URL` and `SUPABASE_SECRET_KEY` for the Vercel review branch. Never reuse the production database for an unreviewed migration.

The old application uses a public anonymous key. Applying the new access restrictions to its database before deploying/configuring the new server would break that old version. Review the preview first and coordinate the database/server rollout together. This repair branch does not apply anything to the live Supabase project.

See `docs/RELIABILITY-REPAIR.md` for the changes, AI assistance record, and verification limits.
