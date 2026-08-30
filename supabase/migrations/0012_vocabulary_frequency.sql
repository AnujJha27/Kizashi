alter table public.vocabulary
  add column if not exists frequency integer,
  add column if not exists frequency_metadata jsonb not null default '{}'::jsonb;

alter table public.vocabulary
  drop constraint if exists vocabulary_frequency_check;

alter table public.vocabulary
  add constraint vocabulary_frequency_check check (frequency is null or frequency >= 0);
