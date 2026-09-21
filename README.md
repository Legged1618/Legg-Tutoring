# Legg Tutoring

Marketing site + client portal (login, paid session booking, cancellation/refunds).

## What's here

- `app/page.tsx` — the public marketing page (unchanged from before, now a Next.js page). Free-consultation booking still runs through the existing Cal.com embed.
- `app/portal/*` — the client portal: magic-link login, dashboard of upcoming sessions, booking form.
- `app/api/*` — server-side logic: creating sessions, Stripe Checkout, the Stripe webhook, and cancellation/refunds.
- `supabase/schema.sql` — the database schema (clients, sessions) with row-level security.
- `lib/pricing.ts` — **all rates and the late-cancellation fee live here in one place.** They're currently `0` placeholders — see "Setting your rates" below.

This is a scaffold: the structure and logic are in place, but it needs real accounts (Supabase, Stripe, Vercel) connected before it does anything live.

## One-time setup

### 1. Supabase (auth + database) — free

1. Create an account at [supabase.com](https://supabase.com) and a new project.
2. In the SQL Editor, paste the contents of `supabase/schema.sql` and run it. This creates the `clients` and `sessions` tables.
3. In **Authentication > Providers**, make sure Email is enabled. In **Authentication > URL Configuration**, add your site URL (and `http://localhost:3000` while testing) plus `/auth/callback` as a redirect URL.
4. In **Project Settings > API**, copy the Project URL, `anon` public key, and `service_role` secret key into your `.env.local` (copy `.env.example` to `.env.local` first). **Never commit `.env.local`.**

### 2. Stripe (payments) — free, per-transaction fees only

1. Create an account at [stripe.com](https://stripe.com).
2. In **Developers > API keys**, copy the secret key into `STRIPE_SECRET_KEY`.
3. In **Developers > Webhooks**, add an endpoint pointing at `https://<your-domain>/api/stripe/webhook`, listening for `checkout.session.completed`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
4. While developing locally, use the [Stripe CLI](https://docs.stripe.com/stripe-cli) (`stripe listen --forward-to localhost:3000/api/stripe/webhook`) to get a local webhook secret instead.

### 3. Vercel (hosting) — free for this size of site

1. Create an account at [vercel.com](https://vercel.com) and import this GitHub repo.
2. Add all the variables from `.env.example` as Environment Variables in the Vercel project settings.
3. Deploy. Vercel gives you a `*.vercel.app` URL immediately.
4. To use your real domain (leggtutoring.com), add it under **Settings > Domains** in Vercel and update your DNS at your domain registrar to point at Vercel instead of GitHub Pages (Vercel's UI tells you the exact record to add). This replaces the old `CNAME` file, which was for GitHub Pages and has been removed.

### 4. Setting your rates

Open `lib/pricing.ts` and fill in:

- `virtualHourlyRateCents` — your hourly rate for virtual sessions, in cents (e.g. `6000` = $60/hr).
- `inPersonHourlyRateCents` — your hourly rate for in-person sessions.
- `lateCancelFlatFeeCents` — the flat fee withheld when a client cancels inside 24 hours.

These should match whatever we land on together in the "Consultation Script & Policy" doc so the numbers you say on the call match what the portal actually charges.

## Approving a client after their consultation

Right now, a new portal user can sign in but can't book a paid session until you flip their `approved` flag. After a good consultation call:

1. In the Supabase Table Editor, open the `clients` table.
2. Find the row for that client's email (join through `auth.users` if needed) and set `approved` to `true`.

(A small admin UI for this can be added later once the manual flow feels like a bottleneck.)

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```

## Known gaps / next decisions

- Rates and the late-cancellation fee are placeholders (see above).
- In-person sessions currently accept any free-text location. We flagged in the shared doc whether you want to restrict this to public places for safety.
- Tutor-side session cancellation currently works by you signing into the same portal with the email set in `TUTOR_EMAIL` and hitting cancel on any session — there's no separate admin dashboard yet.
- Approving clients after a consultation is a manual step in the Supabase dashboard for now.
