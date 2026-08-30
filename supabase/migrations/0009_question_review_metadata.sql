alter table public.practice_questions
  add column if not exists review_metadata jsonb not null default '{}'::jsonb;
