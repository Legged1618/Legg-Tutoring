# Legg Tutoring

Marketing site + one system for everything: free-consultation booking (no login), a client portal (login, paid session booking, cancellation/refunds), and a tutor admin view.

## What's here

- `app/page.tsx` — the public marketing page, including an inline consultation-booking widget (`components/ConsultationBooking.tsx`). This replaced the old Cal.com embed — no account required to book a free 15-minute call.
- `app/portal/*` — the client portal: magic-link login, dashboard of upcoming sessions, booking form. Anyone who's booked a consultation can log in immediately (see below).
- `app/portal/admin/*` — the tutor-only admin portal, tabbed: **Calendar** (agenda view of everything upcoming, click any item to expand its "what to do" checklist), **Consultations** ("Good fit" / "Not a fit" -- since everyone is auto-approved at booking, this is really a revoke tool), **Sessions** (every client's paid sessions, can cancel any), **Scripts** (placeholder linking to the shared doc -- real content is next phase). Gated entirely by `TUTOR_EMAIL`; nobody else can reach any of it.
- `app/api/*` — server-side logic: consultation availability + booking, session booking, Stripe Checkout + webhook, cancellation/refunds.
- `supabase/schema.sql` — the database schema (clients, sessions, consultations) with row-level security.
- `lib/pricing.ts` — **all rates and the late-cancellation fee live here.** Currently $65/hr flat, virtual-only, $10 late-cancellation fee.
- `lib/availability.ts` — **your weekly availability for free consultations lives here** (`WEEKLY_AVAILABILITY`). Edit the days/times to match your real schedule.

This is a scaffold: the structure and logic are in place, but it needs real accounts (Supabase, Stripe, Resend, Vercel) connected before it does anything live.

## How the flow works end to end

1. A visitor books a free consultation on `/consultation` (or the homepage) — no account needed. They pick an open slot (computed from `lib/availability.ts` minus already-booked times) and give their name/email/phone/subject.
2. **They're approved for portal access immediately** — no manual review gate. Both the client and you get an email (via Resend). Yours includes their details, a link to the call script, and a reminder that you can revoke access later if it's not a fit.
3. The client can cancel the free consultation any time with one click via the link in their confirmation email (`/consultation/cancel/[id]`) — no policy, no fee, it's free.
4. That person can go to `/portal` any time, sign in with a magic link, and book/pay for a real session (virtual only, $65/hr flat, via Stripe Checkout before it's confirmed). **This is where the cancellation policy (24-hour refund rule) actually applies** — never to the free consultation.
5. After the call, if it turns out not to be a fit, go to `/portal/admin` (signed in as `TUTOR_EMAIL`) and mark it "Not a fit" to revoke that email's portal access. Everything upcoming -- consultations and sessions together -- is also visible at `/portal/admin/calendar`, click any entry for its checklist.
6. Either side can cancel a paid session from `/portal`; refunds follow the 24-hour policy automatically. You cancel by signing in with the email in `TUTOR_EMAIL`.

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

### 4. Google Calendar (see your bookings automatically) — free

Every scheduled consultation and paid session is available as a private ICS feed at `/api/calendar/feed.ics?token=<CALENDAR_FEED_TOKEN>`.

1. Set `CALENDAR_FEED_TOKEN` in your env to a long random string (treat it like a password — anyone with it can read your upcoming bookings' names/emails/phone numbers). `.env.example` has a placeholder; generate one with `openssl rand -base64 24` or similar.
2. In Google Calendar: **Settings → Add calendar → From URL**, paste `https://leggtutoring.com/api/calendar/feed.ics?token=<your token>`.
3. Google will poll and refresh this periodically (typically every several hours, not instantly — that's a Google limitation for URL-subscribed calendars, not something this app controls).

This is one-way and read-only by design: it shows what's booked, but cancelling/editing still happens through the portal or admin, not by touching the calendar event itself. Each event's description includes the client's contact info and (for consultations) the `CALL_SCRIPT_URL` link.

### 5. Vercel (hosting) — free for this size of site

1. Create an account at [vercel.com](https://vercel.com) and import this GitHub repo.
2. Add every variable from `.env.example` as an Environment Variable in the Vercel project settings.
3. Deploy.
4. To use leggtutoring.com, add it under **Settings > Domains** in Vercel and update your DNS at your registrar to point at Vercel instead of GitHub Pages (the old `CNAME` file was for GitHub Pages and has been removed).

### 6. Rates and availability

- `lib/pricing.ts` — `virtualHourlyRateCents` (currently 6500 = $65/hr) and `lateCancelFlatFeeCents` (currently 1000 = $10), both in cents.
- `lib/availability.ts` — edit `WEEKLY_AVAILABILITY` to your real consultation hours (day of week + start/end time, in `TUTOR_TIMEZONE`).

These match the "Consultation Script & Policy" doc.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```

## Known gaps / next decisions

- Virtual-only for now, by design — the business is positioned as nationwide/online. In-person could come back later (the `type` column and enum still support it), but nothing in the UI offers it currently.
- Session slots (30/60/120 min) and consultation slots (15 min) both draw from `lib/availability.ts`'s shared engine and block each other — no more double-booking across the two tables.
- Revoking access ("Not a fit") from `/portal/admin` requires you to be signed into the portal yourself as `TUTOR_EMAIL`.
- No reschedule flow for consultations — a client who needs a different time cancels via their email link and books a new slot; there's no "change time" in place, just cancel + rebook.
- `TUTOR_EMAIL` decides who has admin access -- update it in your env (and log in with that email going forward) to change who that is. Nothing else in the code needs to change.
- The admin Calendar view is an in-app agenda list (grouped by day, click to expand), not a full month-grid calendar widget -- deliberately simpler to build/maintain; worth revisiting if that's ever not enough.
