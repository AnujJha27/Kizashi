create table if not exists public.sync_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version integer not null default 1 check (version = 1),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.sync_snapshots enable row level security;

create policy "users manage their sync snapshot" on public.sync_snapshots
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
