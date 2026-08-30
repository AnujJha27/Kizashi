alter table public.practice_questions
  add column if not exists answer_mode text not null default 'choice';

alter table public.practice_questions
  add column if not exists accepted_answers jsonb not null default '[]';

alter table public.practice_questions
  drop constraint if exists practice_questions_answer_mode_check;

alter table public.practice_questions
  add constraint practice_questions_answer_mode_check check (answer_mode in ('choice', 'text'));

create index if not exists practice_questions_answer_mode_idx on public.practice_questions(answer_mode, category);
