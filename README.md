# Legg Tutoring

Marketing site + one system for everything: free-consultation booking (no login), a client portal (login, paid session booking, cancellation/refunds), and a tutor admin view.

## What's here

- `app/page.tsx` — the public marketing page, including an inline consultation-booking widget (`components/ConsultationBooking.tsx`). This replaced the old Cal.com embed — no account required to book a free 15-minute call.
- `components/SiteHeader.tsx` — the one header for the whole site, homepage and portal alike, rendered once in `app/portal/layout.tsx` for every portal page (and directly on the homepage/consultation pages). It checks auth itself (no props): logged out, "Book a consultation / Client login"; logged in, an account-menu dropdown (`components/AccountMenu.tsx`) with name/email, Sessions (or Admin portal, for the tutor), Profile, and Log out. Logged-in state follows onto the homepage too, not just `/portal/*`.
- `app/portal/*` — the client portal: magic-link login, a calendar of upcoming sessions (`/portal`, 4-week Monday-aligned grid — click a day with an open slot to book it, click a day with your own session to see/cancel it), profile (`/portal/profile`, name + phone). Anyone who's booked a consultation can log in immediately (see below).
- `app/portal/admin/*` — the tutor-only admin portal, tabbed: **Calendar** (same 4-week grid, color-coded by booking type and whether it's upcoming or resolved; click a day to see what's on it, click a booking to open its checklist/script and manage it; block your own time off further down the page), **Consultations** ("Good fit" / "Not a fit" -- since everyone is auto-approved at booking, this is really a revoke tool), **Sessions** (every client's paid sessions, can cancel any), **Manage clients** (read-only directory -- name, email, phone, approval status, sign-up date), **Notifications** (recent booking activity -- replaces email alerts to your personal inbox; see below). Gated entirely by `TUTOR_EMAIL`; nobody else can reach any of it.
- `lib/calendarWindow.ts` — the Monday-aligned rolling window math shared by both calendars (admin and client). Window length must stay a multiple of 7, or Previous/Next paging drifts off the week grid.
- `app/api/*` — server-side logic: consultation availability + booking, session booking, Stripe Checkout + webhook, cancellation/refunds.
- `supabase/schema.sql` — the database schema (clients, sessions, consultations, time_off) with row-level security. **If you already ran this once, re-run it** — it's all `if not exists`, so it only adds the new `time_off` table without touching your existing data.
- `lib/pricing.ts` — **all rates and the late-cancellation fee live here.** Currently $65/hr flat, virtual-only, $10 late-cancellation fee.
- `lib/availability.ts` — **your weekly working hours live here** (`WEEKLY_AVAILABILITY`), shared by both consultations and paid sessions. Currently 1pm-9pm every day, `TUTOR_TIMEZONE`. Edit to match your real schedule.

This is a scaffold: the structure and logic are in place, but it needs real accounts (Supabase, Stripe, Resend, Vercel) connected before it does anything live.

## How the flow works end to end

1. A visitor books a free consultation on `/consultation` (or the homepage) — no account needed. They pick an open slot (computed from `lib/availability.ts` minus already-booked times) and give their name/email/phone/subject.
2. **They're approved for portal access immediately** — no manual review gate. The client gets a confirmation email (via Resend). You don't get an email for this anymore -- check `/portal/admin/notifications` instead (see below).
3. The client can cancel the free consultation any time with one click via the link in their confirmation email (`/consultation/cancel/[id]`) — no policy, no fee, it's free.
4. That person can go to `/portal` any time, sign in with a magic link, and book/pay for a real session (virtual only, $65/hr flat, via Stripe Checkout before it's confirmed) by clicking an open day on their calendar. **This is where the cancellation policy (24-hour refund rule) actually applies** — never to the free consultation.
5. After the call, if it turns out not to be a fit, go to `/portal/admin` (signed in as `TUTOR_EMAIL`) and mark it "Not a fit" to revoke that email's portal access. Everything upcoming -- consultations and sessions together -- is also visible at `/portal/admin/calendar`, click any entry for its checklist.
6. Either side can cancel a paid session from `/portal`; refunds follow the 24-hour policy automatically. You cancel by signing in with the email in `TUTOR_EMAIL`.

### No more tutor-facing booking emails

Every booking used to also email `TUTOR_EMAIL`. That's gone -- `/portal/admin/notifications` is now the one place to check for new consultations, new paid sessions, and cancellations (last 30 days, newest first). It's a plain read of existing data, not a new table, so there's nothing to configure and nothing that can silently stop working. Client-facing confirmation emails are unchanged.

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
- `lib/availability.ts` — edit `WEEKLY_AVAILABILITY` to your real working hours (day of week + start/end time, in `TUTOR_TIMEZONE`). Applies to both consultations and paid sessions.

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
- Both calendars (`/portal` and `/portal/admin/calendar`) are a 4-week (28-day) grid, always starting on the most recent Monday -- not today, and not locked to calendar-month boundaries -- so Previous/Next paging (which moves by exactly 28 days) always lands on a Monday too. Admin day cells show colored dots (brass = consultation, teal = session; muted shade = resolved/past, full shade = upcoming); the client's own calendar shows teal for their own sessions and a muted brass dot for days with any open booking slot. Click a day for its detail, click a booking (admin) for its checklist, script link, and management actions (approve/deny, cancel).
- **Time off**: below the admin calendar grid, block any date range (with an optional reason) to keep clients from booking over it -- stored in `time_off` and merged into `lib/busyIntervals.ts`, so it blocks both consultations and paid sessions automatically. Doesn't cancel anything already booked in that range. Days blocked this way show a hatched "Off" pattern on the admin grid.
- **Performance note**: `SiteHeader` reads the session with `getSession()`, not `getUser()`. The proxy middleware already runs the real, network-verified `getUser()` check on every request (its matcher covers the whole site now), so by the time a page renders, the cookies are already server-validated for that request -- a second `getUser()` call in the header was pure redundant latency on every single page load. Every actual access-control decision (which admin pages render, what the API routes allow) still uses its own `getUser()`, unchanged. If you ever narrow the middleware's matcher again, revisit this.
- `app/portal/loading.tsx` gives every portal navigation (tab switches, calendar paging) an instant fallback while the next page streams in, so clicking Next/a tab doesn't feel unresponsive during the round trip -- independent of the fade-in transition, which only plays once the new content has actually arrived.
