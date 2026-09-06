# Chowly

A restaurant ordering platform built for the Chowly assignment (Build phase). Customers browse the menu, place an order, and pay from their table; waiters assign chefs/bartenders to each order and mark it served.

## Stack

- **Next.js (App Router)** — single full-stack app, UI + API routes together
- **Tailwind CSS** — styling
- **Supabase (Postgres)** — database, accessed directly via `supabase-js` (no ORM)
- **Vercel** — deployment

## Architecture

```
components/   UI, split into customer/ and waiter/
app/api/      controllers — parse requests, call services, return JSON
services/     business logic: validation, calculations (e.g. waiting time), orchestration
repositories/ the only layer that talks to Supabase
lib/          shared client, id generator, constants, formatting, types
supabase/     schema.sql — run this in the Supabase SQL editor before first use
```

## Local setup

1. Create a Supabase project, then run `supabase/schema.sql` in its SQL editor.
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase project URL and anon key (Project Settings → API).
3. `npm install`
4. `npm run dev` — open http://localhost:3000

## Notes on the data model

Two small additions were made on top of the original design, documented here as required by the assignment:

- **`orders.is_paid`** (boolean) — added so the payment step can explicitly mark an order as paid, rather than inferring it from the existence of a payment row.
- **`menu_items.expected_preparation_time`** stored as an integer (minutes) rather than free text, so the order service can calculate estimated waiting time programmatically.
- **No new table**, but note the flow: customers are not required to log in. The first time someone orders, the app collects just a first/last name and creates (or reuses) a `customers` row — this satisfies the data model's foreign key without adding real authentication.
- **Row Level Security is explicitly disabled** on every table (see the end of `schema.sql`). Since there's no login system, access rules are enforced in the service layer rather than per-row — RLS with no policies would just block the anon key entirely, which is what you'll hit if you skip this step.
