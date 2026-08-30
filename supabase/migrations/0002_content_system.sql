create table if not exists public.content_sources (
  id text primary key,
  name text not null,
  source_type text not null check (source_type in ('official', 'dictionary', 'curriculum', 'generated', 'user')),
  url text,
  license text,
  retrieved_at timestamptz,
  notes text
);

create table if not exists public.learning_item_sources (
  item_id text not null references public.learning_items(id) on delete cascade,
  source_id text not null references public.content_sources(id) on delete cascade,
  primary key (item_id, source_id)
);

create table if not exists public.curriculum_classifications (
  item_type text not null check (item_type in ('vocabulary', 'kanji', 'grammar', 'reading', 'listening')),
  item_id text not null,
  level text not null check (level in ('N5', 'N4', 'N3', 'N2', 'N1')),
  band text not null check (band in ('core', 'extended', 'bridge')),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  evidence_sources text[] not null default '{}',
  inclusion_reason text not null,
  reviewed_at date not null default current_date,
  primary key (item_type, item_id)
);

create table if not exists public.practice_questions (
  id text primary key,
  item_id text not null,
  category text not null check (category in ('vocabulary', 'kanji', 'grammar', 'reading', 'listening')),
  question_type text not null,
  jlpt_level text check (jlpt_level in ('N5', 'N4', 'N3', 'N2', 'N1')),
  prompt text not null,
  options jsonb not null default '[]',
  correct_index integer not null check (correct_index >= 0),
  explanation text not null,
  audio_url text,
  audio_text text,
  validation_status text not null default 'generated' check (validation_status in ('generated', 'validated', 'rejected')),
  generated_by text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.question_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.practice_questions(id) on delete cascade,
  attempts integer not null default 0 check (attempts >= 0),
  correct integer not null default 0 check (correct >= 0 and correct <= attempts),
  ambiguity_reports integer not null default 0 check (ambiguity_reports >= 0),
  quality_score numeric not null default 1 check (quality_score between 0 and 1),
  last_response_ms integer check (last_response_ms >= 0),
  last_confidence text check (last_confidence in ('guess', 'unsure', 'confident')),
  slow_count integer not null default 0 check (slow_count >= 0),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, question_id)
);

create table if not exists public.study_later (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('vocabulary', 'kanji', 'grammar', 'reading', 'listening')),
  item_id text not null,
  added_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, item_type, item_id)
);

create table if not exists public.content_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  payload jsonb not null,
  status text not null default 'draft' check (status in ('draft', 'validated', 'published', 'rejected')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists learning_item_sources_source_idx on public.learning_item_sources(source_id);
create index if not exists classifications_level_idx on public.curriculum_classifications(level, band);
create index if not exists practice_questions_item_idx on public.practice_questions(item_id, category);
create index if not exists question_stats_user_idx on public.question_stats(user_id, quality_score);
create index if not exists study_later_user_idx on public.study_later(user_id, added_at desc);

alter table public.content_sources enable row level security;
alter table public.learning_item_sources enable row level security;
alter table public.curriculum_classifications enable row level security;
alter table public.practice_questions enable row level security;
alter table public.question_stats enable row level security;
alter table public.study_later enable row level security;
alter table public.content_drafts enable row level security;

create policy "authenticated users read content sources" on public.content_sources for select using ((select auth.uid()) is not null);
create policy "authenticated users read item sources" on public.learning_item_sources for select using ((select auth.uid()) is not null);
create policy "authenticated users read classifications" on public.curriculum_classifications for select using ((select auth.uid()) is not null);
create policy "authenticated users read practice questions" on public.practice_questions for select using ((select auth.uid()) is not null);
create policy "users manage question stats" on public.question_stats for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users manage study later" on public.study_later for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users manage content drafts" on public.content_drafts for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
