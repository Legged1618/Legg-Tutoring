# Legg Tutoring

Marketing site + one system for everything: free-consultation booking (no login), a client portal (login, paid session booking, cancellation/refunds), and a tutor admin view.

## What's here

- `app/page.tsx` — the public marketing page, including an inline consultation-booking widget (`components/ConsultationBooking.tsx`). This replaced the old Cal.com embed — no account required to book a free 15-minute call.
- `components/SiteHeader.tsx` — the one header for the whole site, homepage and portal alike, rendered once in `app/portal/layout.tsx` for every portal page (and directly on the homepage/consultation pages). It checks auth itself (no props): logged out, "Book a consultation / Client login"; logged in, an account-menu dropdown (`components/AccountMenu.tsx`) with name/email, Sessions (or Admin portal, for the tutor), Profile, and Log out. Logged-in state follows onto the homepage too, not just `/portal/*` -- including the homepage's own second hero button, which becomes "Go to client portal" or "Go to admin portal" instead of "Existing client? Log in" once you're signed in.
- `app/portal/*` — the client portal: magic-link login, a calendar of upcoming sessions (`/portal`, 4-week Monday-aligned grid — click a day with an open slot to book it, click a day with your own session to see/cancel it), profile (`/portal/profile`, name + phone). Anyone who's booked a consultation can log in immediately (see below).
- `app/portal/admin/*` — the tutor-only admin portal, tabbed: **Calendar** (same 4-week grid, color-coded by booking type and whether it's upcoming or resolved; click a day to see what's on it, click a booking to see whether it's paid, jump to the client's page, open the room, or manage it; block your own time off further down the page), **Consultations** (pending only -- "Good fit" / "Not a fit"; past ones live on the calendar now), **Sessions** (upcoming paid sessions, can cancel any; past/cancelled ones live on the calendar now), **Manage clients** (everyone who's logged in or booked a consultation, grouped into Approved / Booked a consultation / Signed up only, each with an Approve or Revoke button -- this is the only way to approve someone who logged in without ever booking a consultation, since the Consultations tab has nothing to show for them), **Notifications** (recent booking activity -- replaces email alerts to your personal inbox; see below). Gated entirely by `TUTOR_EMAIL`; nobody else can reach any of it.
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
5. After the call, if it turns out not to be a fit, go to `/portal/admin` (signed in as `TUTOR_EMAIL`) and mark it "Not a fit" to revoke that email's portal access. Everything upcoming -- consultations and sessions together -- is also visible at `/portal/admin/calendar`, click any entry for its details.
6. Either side can cancel a paid session from `/portal`; refunds follow the 24-hour policy automatically. You cancel by signing in with the email in `TUTOR_EMAIL`.

### No more tutor-facing booking emails

Every booking used to also email `TUTOR_EMAIL`. That's gone -- `/portal/admin/notifications` is now the one place to check for new consultations, new paid sessions, and cancellations (last 30 days, newest first). It's a plain read of existing data, not a new table, so there's nothing to configure and nothing that can silently stop working. Client-facing confirmation emails are unchanged.

### Desktop alerts

On top of the Notifications tab, the tutor can get a pop-up on any computer or phone browser for new consultations, paid sessions, cancellations and client messages (Web Push, `lib/push.ts` + `public/sw.js`). Open **Notifications** in the admin portal and click **Turn on**; each browser is turned on separately and they all get every alert. Clicking an alert opens the right page. Installing the site as an app (Chrome/Edge: the install icon in the address bar) keeps alerts tidy on a dedicated machine.

Admin pages and the client Messages page also refresh themselves every few seconds while open, so new messages and bookings appear without a reload.

Setup: run `supabase/migrations/2026-10-01-push-subscriptions.sql`, then set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` (make a pair with `npx web-push generate-vapid-keys`) and redeploy. `VAPID_SUBJECT` is optional and defaults to `mailto:` + `TUTOR_EMAIL`.

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

### 4. Lessonspace (live session room) — from $9/month

Each paid session has its own Lessonspace room (two-way video and voice, plus a shared whiteboard with math tools that both sides can write on), embedded on the site at `/portal/session/<id>` (login required; linked from the portal calendar and the confirmation email). Free consultations are phone calls and don't get a room. Clients don't need a Lessonspace account. The room opens to the client 10 minutes before the start; the tutor can open it any time to set up the board, and joins as the room's leader.

1. Sign up at [thelessonspace.com](https://www.thelessonspace.com/pricing) (Basic is $9/month for 10 session hours; every plan includes the API).
2. Copy your organisation's API key into `LESSONSPACE_API_KEY`.

Rooms are created on demand from the booking id, so there's nothing to store or migrate. If the key is missing or Lessonspace is down, the join page says the room isn't ready and bookings still work.

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
- Session slots (30/60/120 min) and consultation slots (15 min) both draw from `lib/availability.ts`'s shared engine and block each other — no more double-booking across the two tables. Minimum notice differs by type: consultations need 2 hours (`MIN_NOTICE_HOURS`), paid sessions need 48 hours (`SESSION_MIN_NOTICE_HOURS`) — a real commitment on both sides. Both still cap out at `BOOKING_WINDOW_DAYS` (30) out.
- Revoking access ("Not a fit") from `/portal/admin` requires you to be signed into the portal yourself as `TUTOR_EMAIL`.
- No reschedule flow for consultations — a client who needs a different time cancels via their email link and books a new slot; there's no "change time" in place, just cancel + rebook.
- `TUTOR_EMAIL` decides who has admin access -- update it in your env (and log in with that email going forward) to change who that is. Nothing else in the code needs to change.
- Both calendars (`/portal` and `/portal/admin/calendar`) are a 4-week (28-day) grid, always starting on the most recent Monday -- not today, and not locked to calendar-month boundaries -- so Previous/Next paging (which moves by exactly 28 days) always lands on a Monday too. Admin day cells show colored dots (brass = consultation, teal = session; muted shade = resolved/past, full shade = upcoming); the client's own calendar shows teal for their own sessions and a muted brass dot for days with any open booking slot. Click a day for its detail, click a booking (admin) for its payment status, client link, script link, and management actions (approve/deny, cancel).
- **Time off**: below the admin calendar grid, block any date range (with an optional reason) to keep clients from booking over it -- stored in `time_off` and merged into `lib/busyIntervals.ts`, so it blocks both consultations and paid sessions automatically. Doesn't cancel anything already booked in that range. Days blocked this way show a hatched "Off" pattern on the admin grid.
- **Performance note**: `SiteHeader` reads the session with `getSession()`, not `getUser()`. The proxy middleware already runs the real, network-verified `getUser()` check on every request (its matcher covers the whole site now), so by the time a page renders, the cookies are already server-validated for that request -- a second `getUser()` call in the header was pure redundant latency on every single page load. Every actual access-control decision (which admin pages render, what the API routes allow) still uses its own `getUser()`, unchanged. If you ever narrow the middleware's matcher again, revisit this.
- `app/portal/loading.tsx` gives every portal navigation (tab switches, calendar paging) an instant fallback while the next page streams in, so clicking Next/a tab doesn't feel unresponsive during the round trip -- independent of the fade-in transition, which only plays once the new content has actually arrived.
