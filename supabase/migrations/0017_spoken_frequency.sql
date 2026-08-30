alter table public.vocabulary
  add column if not exists spoken_frequency integer,
  add column if not exists spoken_frequency_metadata jsonb not null default '{}'::jsonb;

alter table public.vocabulary
  drop constraint if exists vocabulary_spoken_frequency_check;

alter table public.vocabulary
  add constraint vocabulary_spoken_frequency_check check (spoken_frequency is null or spoken_frequency >= 0);
