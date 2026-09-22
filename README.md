# Legg Tutoring

Marketing site + one system for everything: free-consultation booking (no login), a client portal (login, paid session booking, cancellation/refunds), and a tutor admin view.

## What's here

- `app/page.tsx` — the public marketing page, including an inline consultation-booking widget (`components/ConsultationBooking.tsx`). This replaced the old Cal.com embed — no account required to book a free 15-minute call.
- `app/portal/*` — the client portal: magic-link login, dashboard of upcoming sessions, booking form. Only reachable after the tutor has approved that person's email.
- `app/portal/admin` — tutor-only view listing consultations, with "Good fit" / "Not a fit" buttons. Marking someone a good fit approves their email for the client portal.
- `app/api/*` — server-side logic: consultation availability + booking, session booking, Stripe Checkout + webhook, cancellation/refunds.
- `supabase/schema.sql` — the database schema (clients, sessions, consultations) with row-level security.
- `lib/pricing.ts` — **all rates and the late-cancellation fee live here.** Currently `0` placeholders.
- `lib/availability.ts` — **your weekly availability for free consultations lives here** (`WEEKLY_AVAILABILITY`). Edit the days/times to match your real schedule.

This is a scaffold: the structure and logic are in place, but it needs real accounts (Supabase, Stripe, Resend, Vercel) connected before it does anything live.

## How the flow works end to end

1. A visitor books a free consultation on the homepage — no account needed. They pick an open slot (computed from `lib/availability.ts` minus already-booked times) and give their name/email/phone/subject.
2. Both the client and you get an email (via Resend). Yours includes their details and a link to the call script, plus a reminder to record the outcome afterward.
3. After the call, you go to `/portal/admin` (signed in as yourself) and mark the consultation "Good fit" or "Not a fit". Good fit approves their email.
4. That person can now go to `/portal`, sign in with a magic link to that same email, and book/pay for real sessions. Virtual sessions pay via Stripe Checkout before confirming; in-person sessions let them type a location and don't require prepayment.
5. Either side can cancel from `/portal`; refunds follow the 24-hour policy automatically. You cancel by signing in with the email in `TUTOR_EMAIL`.

## One-time setup

### 1. Supabase (auth + database) — free

1. Create an account at [supabase.com](https://supabase.com) and a new project.
2. In the SQL Editor, paste the contents of `supabase/schema.sql` and run it.
3. In **Authentication > Providers**, make sure Email is enabled. In **Authentication > URL Configuration**, add your site URL (and `http://localhost:3000` while testing) plus `/auth/callback` as a redirect URL.
4. In **Project Settings > API**, copy the Project URL, `anon` public key, and `service_role` secret key into `.env.local` (copy `.env.example` first). **Never commit `.env.local`.**

### 2. Stripe (payments) — free, per-transaction fees only

1. Create an account at [stripe.com](https://stripe.com).
2. In **Developers > API keys**, copy the secret key into `STRIPE_SECRET_KEY`.
3. In **Developers > Webhooks**, add an endpoint at `https://<your-domain>/api/stripe/webhook`, listening for `checkout.session.completed`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Locally, use the [Stripe CLI](https://docs.stripe.com/stripe-cli) (`stripe listen --forward-to localhost:3000/api/stripe/webhook`) instead.

### 3. Resend (email) — free up to 3,000 emails/month

1. Create an account at [resend.com](https://resend.com).
2. Grab an API key under **API Keys** and put it in `RESEND_API_KEY`.
3. For real sending to any address, verify your own domain under **Domains** and set `EMAIL_FROM` to an address on it (e.g. `Legg Tutoring <hello@leggtutoring.com>`). Until then, the default `onboarding@resend.dev` sender only delivers to your own Resend account email — fine for testing, not for real clients.

### 4. Vercel (hosting) — free for this size of site

1. Create an account at [vercel.com](https://vercel.com) and import this GitHub repo.
2. Add every variable from `.env.example` as an Environment Variable in the Vercel project settings.
3. Deploy.
4. To use leggtutoring.com, add it under **Settings > Domains** in Vercel and update your DNS at your registrar to point at Vercel instead of GitHub Pages (the old `CNAME` file was for GitHub Pages and has been removed).

### 5. Setting your rates and availability

- `lib/pricing.ts` — fill in `virtualHourlyRateCents`, `inPersonHourlyRateCents`, and `lateCancelFlatFeeCents` (all in cents).
- `lib/availability.ts` — edit `WEEKLY_AVAILABILITY` to your real consultation hours (day of week + start/end time, in `TUTOR_TIMEZONE`).

These should match whatever we land on together in the "Consultation Script & Policy" doc.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```

## Known gaps / next decisions

- Rates and the late-cancellation fee are placeholders (see above).
- Consultation availability doesn't cross-check against already-booked paid tutoring sessions yet — just other consultations. Worth unifying once real volume shows up.
- In-person session locations are free-text. Flagged in the shared doc: restrict to public places for safety, or leave open?
- Approving a client from `/portal/admin` requires you to be signed into the portal yourself as `TUTOR_EMAIL`.
- No reschedule flow yet for consultations — a client who needs to change time has to email you and you'd cancel/re-explain manually (there's no cancel button on the public booking widget by design, to keep it simple for a first-time visitor).
