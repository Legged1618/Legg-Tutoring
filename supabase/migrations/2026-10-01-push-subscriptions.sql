-- Browsers the tutor turned desktop alerts on for (Notifications tab).
-- Run once in the Supabase SQL editor.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

-- No policies: only the tutor-gated API routes (service role) touch this.
alter table public.push_subscriptions enable row level security;
