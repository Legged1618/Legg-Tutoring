-- Portal messaging between clients and the tutor, plus private tutor notes
-- on each client. Run once in the Supabase SQL editor.

alter table public.clients add column if not exists tutor_notes text;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  -- set when the message is about one specific booking
  session_id uuid references public.sessions (id) on delete set null,
  sender text not null check (sender in ('client', 'tutor')),
  body text not null check (length(body) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_client_id_idx on public.messages (client_id, created_at);

-- No policies: only the API routes (service role) read or write messages,
-- and they check who's asking first.
alter table public.messages enable row level security;
