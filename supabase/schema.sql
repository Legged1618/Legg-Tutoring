-- Legg Tutoring: client portal schema.
-- Run this once in the Supabase SQL editor for your project.
--
-- Design note: clients only ever READ their own rows directly from the
-- browser. All writes (booking, cancelling, approving) go through the
-- Next.js API routes using the service-role key, so the 24h refund rule,
-- payment checks, and approval gate can't be bypassed by calling Supabase
-- directly from the client.
--
-- Design note on approval: a client is "approved" (can log in and book/pay
-- for real sessions) based on their EMAIL, decided by the tutor after the
-- free consultation -- before that person has ever created an account. So
-- `clients` is keyed by its own id, uniquely indexed by email, and
-- `auth_user_id` is filled in the first time that email actually logs in.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  full_name text,
  phone text,
  -- set true by the tutor (via /portal/admin) once you've agreed on the
  -- consultation call that you'll work together.
  approved boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists clients_auth_user_id_idx on public.clients (auth_user_id);

create type public.session_type as enum ('virtual', 'in_person');

create type public.session_status as enum (
  'pending_payment',   -- virtual session created, waiting on Stripe checkout
  'scheduled',         -- confirmed (paid, for virtual; booked, for in-person)
  'completed',
  'cancelled_by_client',
  'cancelled_by_tutor'
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  type public.session_type not null,
  status public.session_status not null default 'pending_payment',
  scheduled_at timestamptz not null,
  duration_minutes int not null default 60,
  -- only set for in_person sessions; the client picks this when booking.
  location text,
  rate_cents int not null,
  amount_paid_cents int not null default 0,
  refund_cents int not null default 0,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now()
);

create index if not exists sessions_client_id_idx on public.sessions (client_id);
create index if not exists sessions_scheduled_at_idx on public.sessions (scheduled_at);

-- Free 15-minute consultation calls. Public: anyone can book one without an
-- account. `scheduled_at` is unique so two people can't grab the same slot
-- (the booking API also checks first, but the constraint is the real guard
-- against a race between two simultaneous requests).
create type public.consultation_status as enum (
  'scheduled',
  'completed',
  'cancelled',
  'no_show'
);

create type public.consultation_outcome as enum (
  'pending',
  'good_fit',
  'not_a_fit'
);

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subject text,
  notes text,
  scheduled_at timestamptz not null unique,
  duration_minutes int not null default 15,
  status public.consultation_status not null default 'scheduled',
  outcome public.consultation_outcome not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists consultations_scheduled_at_idx on public.consultations (scheduled_at);
create index if not exists consultations_email_idx on public.consultations (email);

-- Ad-hoc time off on top of the recurring WEEKLY_AVAILABILITY schedule --
-- set by the tutor from the admin calendar whenever they want a day (or
-- stretch of days) off. Blocks new bookings for both consultations and
-- paid sessions in that range; doesn't touch anything already booked.
create table if not exists public.time_off (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists time_off_range_idx on public.time_off (starts_at, ends_at);

alter table public.clients enable row level security;
alter table public.sessions enable row level security;
alter table public.consultations enable row level security;
alter table public.time_off enable row level security;

create policy "clients read own row"
  on public.clients for select
  using (auth.uid() = auth_user_id);

create policy "clients read own sessions"
  on public.sessions for select
  using (
    client_id in (
      select id from public.clients where auth_user_id = auth.uid()
    )
  );

-- No insert/update/delete policies for authenticated users, and no policies
-- at all for consultations: booking is public but goes through the API
-- (service role) so slot uniqueness and availability rules are enforced
-- server-side, not by a client calling Supabase directly.
--
-- No policies at all for time_off either -- only the tutor-gated API
-- routes (service role) ever read or write it.

-- Portal messaging + tutor notes (also in migrations/2026-10-01-messages-and-notes.sql).
alter table public.clients add column if not exists tutor_notes text;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  sender text not null check (sender in ('client', 'tutor')),
  body text not null check (length(body) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_client_id_idx on public.messages (client_id, created_at);

alter table public.messages enable row level security;

-- Tutor desktop alerts (also in migrations/2026-10-01-push-subscriptions.sql).
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
