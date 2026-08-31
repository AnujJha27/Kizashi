create table if not exists public.learner_error_aggregates (
  pattern text not null check (btrim(pattern) <> ''),
  category text not null check (btrim(category) <> ''),
  count integer not null check (count >= 0),
  source_reference text not null check (btrim(source_reference) <> ''),
  notes text,
  primary key (pattern, category)
);

alter table public.learner_error_aggregates enable row level security;

drop policy if exists "public read learner error aggregates" on public.learner_error_aggregates;
create policy "public read learner error aggregates" on public.learner_error_aggregates for select using (true);
