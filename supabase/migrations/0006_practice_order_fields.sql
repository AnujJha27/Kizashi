alter table public.practice_questions
  add column if not exists tokens jsonb;

alter table public.practice_questions
  add column if not exists correct_order jsonb;
