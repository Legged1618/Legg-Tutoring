-- Legg Tutoring: client portal schema.
-- Run this once in the Supabase SQL editor for your project.
--
-- Design note: clients only ever READ their own rows directly from the
-- browser. All writes (booking, cancelling) go through the Next.js API
-- routes using the service-role key, so the 24h refund rule and payment
-- checks can't be bypassed by calling Supabase directly from the client.

create table if not exists public.clients (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  -- set true once you and the client have agreed, in the consultation, that
  -- you'll work together; only approved clients should be able to book paid sessions.
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

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

alter table public.clients enable row level security;
alter table public.sessions enable row level security;

create policy "clients read own row"
  on public.clients for select
  using (auth.uid() = id);

create policy "clients read own sessions"
  on public.sessions for select
  using (auth.uid() = client_id);

-- No insert/update/delete policies for authenticated users on purpose:
-- all writes happen server-side with the service-role key (see
-- app/api/sessions/book and app/api/sessions/[id]/cancel), which bypasses RLS.
