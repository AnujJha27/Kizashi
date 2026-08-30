-- Repair a project whose migration history is ahead of its actual schema.
-- This is intentionally idempotent: it creates only missing objects and never
-- deletes rows. It also folds the later additive migrations into the repair so
-- a stale project can accept the existing seed and app code in one push.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.courses (
  id text primary key,
  slug text not null unique,
  title text not null,
  description text,
  jlpt_level text check (jlpt_level in ('N5', 'N4', 'N3', 'N2', 'N1')),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chapters (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  region text not null default 'quiet-city',
  sort_order integer not null default 0,
  unique (course_id, slug)
);

create table if not exists public.lessons (
  id text primary key,
  chapter_id text not null references public.chapters(id) on delete cascade,
  slug text not null,
  title text not null,
  subtitle text not null,
  description text,
  estimated_minutes integer not null default 10 check (estimated_minutes > 0),
  sort_order integer not null default 0,
  unique (chapter_id, slug)
);

create table if not exists public.learning_items (
  id text primary key,
  slug text not null unique,
  item_type text not null check (item_type in ('vocabulary', 'kanji', 'grammar', 'reading', 'listening')),
  jlpt_level text check (jlpt_level in ('N5', 'N4', 'N3', 'N2', 'N1')),
  subcategory text,
  difficulty integer not null default 1 check (difficulty between 1 and 5),
  prerequisite_ids text[] not null default '{}',
  tags text[] not null default '{}',
  review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  field_source_ids jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vocabulary (
  item_id text primary key references public.learning_items(id) on delete cascade,
  written_form text not null,
  reading text not null,
  meanings text[] not null,
  part_of_speech text not null,
  commonness integer check (commonness between 1 and 5),
  frequency integer,
  frequency_metadata jsonb not null default '{}'::jsonb,
  example_sentences jsonb not null default '[]',
  collocations text[] not null default '{}',
  related_words text[] not null default '{}',
  antonyms text[] not null default '{}',
  notes text,
  audio_url text
);

create table if not exists public.kanji (
  item_id text primary key references public.learning_items(id) on delete cascade,
  character text not null,
  meanings text[] not null,
  onyomi text[] not null default '{}',
  kunyomi text[] not null default '{}',
  stroke_count integer check (stroke_count is null or stroke_count > 0),
  grade integer check (grade is null or grade > 0),
  radical text,
  nanori text[] not null default '{}',
  components text[] not null default '{}',
  mnemonic text,
  stroke_order text,
  useful_words jsonb not null default '[]'
);

create table if not exists public.grammar_points (
  item_id text primary key references public.learning_items(id) on delete cascade,
  pattern text not null,
  meaning text not null,
  formation text not null,
  intuition text not null,
  usage_conditions text[] not null,
  examples jsonb not null default '[]',
  common_mistakes text[] not null,
  contrast_ids text[] not null default '{}',
  practice_question_ids text[] not null default '{}'
);

create table if not exists public.grammar_contrasts (
  id text primary key,
  title text not null,
  grammar_point_ids text[] not null,
  explanation text not null,
  examples jsonb not null default '[]',
  exercises text[] not null default '{}'
);

create table if not exists public.sentences (
  id text primary key,
  japanese text not null,
  reading text,
  translation text not null,
  sentence_type text not null default 'example',
  audio_url text
);

create table if not exists public.readings (
  item_id text primary key references public.learning_items(id) on delete cascade,
  title text not null,
  passage text not null,
  translation text not null,
  vocabulary_ids text[] not null default '{}',
  grammar_ids text[] not null default '{}',
  kanji_ids text[] not null default '{}',
  estimated_difficulty integer not null default 1 check (estimated_difficulty between 1 and 5)
);

create table if not exists public.listening_exercises (
  item_id text primary key references public.learning_items(id) on delete cascade,
  title text not null,
  situation text not null,
  audio_url text,
  voice text,
  speed numeric not null default 1 check (speed > 0),
  source_type text not null check (source_type in ('recorded', 'tts', 'imported')),
  transcript text,
  questions jsonb not null default '[]'
);

create table if not exists public.lesson_learning_items (
  lesson_id text not null references public.lessons(id) on delete cascade,
  item_id text not null references public.learning_items(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (lesson_id, item_id)
);

create table if not exists public.lesson_vocabulary (
  lesson_id text not null references public.lessons(id) on delete cascade,
  item_id text not null references public.vocabulary(item_id) on delete cascade,
  primary key (lesson_id, item_id)
);

create table if not exists public.lesson_grammar (
  lesson_id text not null references public.lessons(id) on delete cascade,
  item_id text not null references public.grammar_points(item_id) on delete cascade,
  primary key (lesson_id, item_id)
);

create table if not exists public.lesson_kanji (
  lesson_id text not null references public.lessons(id) on delete cascade,
  item_id text not null references public.kanji(item_id) on delete cascade,
  primary key (lesson_id, item_id)
);

create table if not exists public.lesson_readings (
  lesson_id text not null references public.lessons(id) on delete cascade,
  item_id text not null references public.readings(item_id) on delete cascade,
  primary key (lesson_id, item_id)
);

create table if not exists public.lesson_listening (
  lesson_id text not null references public.lessons(id) on delete cascade,
  item_id text not null references public.listening_exercises(item_id) on delete cascade,
  primary key (lesson_id, item_id)
);

create table if not exists public.user_item_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('vocabulary', 'grammar', 'kanji', 'lesson', 'reading', 'listening')),
  item_id text not null,
  status text not null default 'new' check (status in ('new', 'learning', 'learned', 'mastered')),
  mastery_score numeric not null default 0 check (mastery_score between 0 and 1),
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  unique (user_id, item_type, item_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null,
  item_id text not null,
  due_at timestamptz not null default timezone('utc', now()),
  interval_days integer not null default 0,
  ease numeric not null default 2.5,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, item_type, item_id)
);

create table if not exists public.review_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null,
  item_id text not null,
  result text not null check (result in ('again', 'hard', 'good', 'easy')),
  confidence text check (confidence in ('guess', 'unsure', 'confident')),
  response_ms integer,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null,
  item_id text not null,
  question_type text,
  expected_answer text,
  submitted_answer text,
  mistake_key text not null,
  occurrence_count integer not null default 1,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, mistake_key)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text,
  item_id text,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.achievements (
  id text primary key,
  title text not null,
  description text not null
);

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, achievement_id)
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text references public.lessons(id) on delete set null,
  item_ids text[] not null default '{}',
  position integer not null default 0 check (position >= 0),
  status text not null default 'active' check (status in ('active', 'complete', 'abandoned')),
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create table if not exists public.study_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.study_sessions(id) on delete set null,
  event_type text not null,
  item_type text,
  item_id text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.content_sources (
  id text primary key,
  name text not null,
  source_type text not null check (source_type in ('official', 'dictionary', 'curriculum', 'frequency', 'examples', 'generated', 'user')),
  url text,
  license text,
  retrieved_at timestamptz,
  notes text,
  sha256 text,
  local_filename text
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
  answer_mode text not null default 'choice' check (answer_mode in ('choice', 'text')),
  accepted_answers jsonb not null default '[]',
  tokens jsonb,
  correct_order jsonb,
  validation_status text not null default 'generated' check (validation_status in ('generated', 'validated', 'rejected')),
  generated_by text,
  review_metadata jsonb not null default '{}'::jsonb,
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

create table if not exists public.sync_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version integer not null default 1 check (version = 1),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.learning_items add column if not exists review_status text not null default 'approved';
alter table public.learning_items add column if not exists field_source_ids jsonb not null default '{}'::jsonb;
alter table public.vocabulary add column if not exists frequency integer;
alter table public.vocabulary add column if not exists frequency_metadata jsonb not null default '{}'::jsonb;
alter table public.kanji add column if not exists stroke_count integer;
alter table public.kanji add column if not exists grade integer;
alter table public.kanji add column if not exists radical text;
alter table public.kanji add column if not exists nanori text[] not null default '{}';
alter table public.kanji add column if not exists components text[] not null default '{}';
alter table public.kanji add column if not exists mnemonic text;
alter table public.kanji add column if not exists stroke_order text;
alter table public.practice_questions add column if not exists answer_mode text not null default 'choice';
alter table public.practice_questions add column if not exists accepted_answers jsonb not null default '[]';
alter table public.practice_questions add column if not exists tokens jsonb;
alter table public.practice_questions add column if not exists correct_order jsonb;
alter table public.practice_questions add column if not exists review_metadata jsonb not null default '{}'::jsonb;
alter table public.content_sources add column if not exists sha256 text;
alter table public.content_sources add column if not exists local_filename text;

alter table public.learning_items drop constraint if exists learning_items_review_status_check;
alter table public.learning_items add constraint learning_items_review_status_check check (review_status in ('pending', 'approved', 'rejected'));
alter table public.learning_items drop constraint if exists learning_items_field_source_ids_object_check;
alter table public.learning_items add constraint learning_items_field_source_ids_object_check check (jsonb_typeof(field_source_ids) = 'object');
alter table public.vocabulary drop constraint if exists vocabulary_frequency_check;
alter table public.vocabulary add constraint vocabulary_frequency_check check (frequency is null or frequency >= 0);
alter table public.practice_questions drop constraint if exists practice_questions_answer_mode_check;
alter table public.practice_questions add constraint practice_questions_answer_mode_check check (answer_mode in ('choice', 'text'));
alter table public.content_sources drop constraint if exists content_sources_source_type_check;
alter table public.content_sources add constraint content_sources_source_type_check check (source_type in ('official', 'dictionary', 'curriculum', 'frequency', 'examples', 'generated', 'user'));

create index if not exists learning_items_type_idx on public.learning_items(item_type, jlpt_level);
create index if not exists learning_items_review_status_idx on public.learning_items(review_status);
create index if not exists chapters_course_idx on public.chapters(course_id, sort_order);
create index if not exists lessons_chapter_idx on public.lessons(chapter_id, sort_order);
create index if not exists lesson_items_order_idx on public.lesson_learning_items(lesson_id, sort_order);
create index if not exists reviews_due_idx on public.reviews(user_id, due_at) where status = 'scheduled';
create index if not exists mistakes_user_idx on public.mistakes(user_id, occurrence_count desc);
create index if not exists study_events_user_idx on public.study_events(user_id, created_at desc);
create index if not exists learning_item_sources_source_idx on public.learning_item_sources(source_id);
create index if not exists classifications_level_idx on public.curriculum_classifications(level, band);
create index if not exists practice_questions_item_idx on public.practice_questions(item_id, category);
create index if not exists practice_questions_answer_mode_idx on public.practice_questions(answer_mode, category);
create index if not exists question_stats_user_idx on public.question_stats(user_id, quality_score);
create index if not exists study_later_user_idx on public.study_later(user_id, added_at desc);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.chapters enable row level security;
alter table public.lessons enable row level security;
alter table public.learning_items enable row level security;
alter table public.vocabulary enable row level security;
alter table public.kanji enable row level security;
alter table public.grammar_points enable row level security;
alter table public.grammar_contrasts enable row level security;
alter table public.sentences enable row level security;
alter table public.readings enable row level security;
alter table public.listening_exercises enable row level security;
alter table public.lesson_learning_items enable row level security;
alter table public.lesson_vocabulary enable row level security;
alter table public.lesson_grammar enable row level security;
alter table public.lesson_kanji enable row level security;
alter table public.lesson_readings enable row level security;
alter table public.lesson_listening enable row level security;
alter table public.achievements enable row level security;
alter table public.user_item_progress enable row level security;
alter table public.reviews enable row level security;
alter table public.review_history enable row level security;
alter table public.mistakes enable row level security;
alter table public.notes enable row level security;
alter table public.user_achievements enable row level security;
alter table public.study_sessions enable row level security;
alter table public.study_events enable row level security;
alter table public.content_sources enable row level security;
alter table public.learning_item_sources enable row level security;
alter table public.curriculum_classifications enable row level security;
alter table public.practice_questions enable row level security;
alter table public.question_stats enable row level security;
alter table public.study_later enable row level security;
alter table public.content_drafts enable row level security;
alter table public.sync_snapshots enable row level security;

drop policy if exists "users read their profile" on public.profiles;
drop policy if exists "users update their profile" on public.profiles;
create policy "users read their profile" on public.profiles for select using ((select auth.uid()) = id);
create policy "users update their profile" on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "authenticated users read courses" on public.courses;
drop policy if exists "public read courses" on public.courses;
create policy "public read courses" on public.courses for select using (true);
drop policy if exists "authenticated users read chapters" on public.chapters;
drop policy if exists "public read chapters" on public.chapters;
create policy "public read chapters" on public.chapters for select using (true);
drop policy if exists "authenticated users read lessons" on public.lessons;
drop policy if exists "public read lessons" on public.lessons;
create policy "public read lessons" on public.lessons for select using (true);
drop policy if exists "authenticated users read learning items" on public.learning_items;
drop policy if exists "public read learning items" on public.learning_items;
create policy "public read learning items" on public.learning_items for select using (true);
drop policy if exists "authenticated users read vocabulary" on public.vocabulary;
drop policy if exists "public read vocabulary" on public.vocabulary;
create policy "public read vocabulary" on public.vocabulary for select using (true);
drop policy if exists "authenticated users read kanji" on public.kanji;
drop policy if exists "public read kanji" on public.kanji;
create policy "public read kanji" on public.kanji for select using (true);
drop policy if exists "authenticated users read grammar" on public.grammar_points;
drop policy if exists "public read grammar" on public.grammar_points;
create policy "public read grammar" on public.grammar_points for select using (true);
drop policy if exists "authenticated users read grammar contrasts" on public.grammar_contrasts;
drop policy if exists "public read grammar contrasts" on public.grammar_contrasts;
create policy "public read grammar contrasts" on public.grammar_contrasts for select using (true);
drop policy if exists "authenticated users read sentences" on public.sentences;
drop policy if exists "public read sentences" on public.sentences;
create policy "public read sentences" on public.sentences for select using (true);
drop policy if exists "authenticated users read readings" on public.readings;
drop policy if exists "public read readings" on public.readings;
create policy "public read readings" on public.readings for select using (true);
drop policy if exists "authenticated users read listening" on public.listening_exercises;
drop policy if exists "public read listening" on public.listening_exercises;
create policy "public read listening" on public.listening_exercises for select using (true);
drop policy if exists "authenticated users read lesson items" on public.lesson_learning_items;
drop policy if exists "public read lesson items" on public.lesson_learning_items;
create policy "public read lesson items" on public.lesson_learning_items for select using (true);
drop policy if exists "authenticated users read lesson vocabulary" on public.lesson_vocabulary;
drop policy if exists "public read lesson vocabulary" on public.lesson_vocabulary;
create policy "public read lesson vocabulary" on public.lesson_vocabulary for select using (true);
drop policy if exists "authenticated users read lesson grammar" on public.lesson_grammar;
drop policy if exists "public read lesson grammar" on public.lesson_grammar;
create policy "public read lesson grammar" on public.lesson_grammar for select using (true);
drop policy if exists "authenticated users read lesson kanji" on public.lesson_kanji;
drop policy if exists "public read lesson kanji" on public.lesson_kanji;
create policy "public read lesson kanji" on public.lesson_kanji for select using (true);
drop policy if exists "authenticated users read lesson readings" on public.lesson_readings;
drop policy if exists "public read lesson readings" on public.lesson_readings;
create policy "public read lesson readings" on public.lesson_readings for select using (true);
drop policy if exists "authenticated users read lesson listening" on public.lesson_listening;
drop policy if exists "public read lesson listening" on public.lesson_listening;
create policy "public read lesson listening" on public.lesson_listening for select using (true);
drop policy if exists "authenticated users read achievements" on public.achievements;
create policy "authenticated users read achievements" on public.achievements for select using ((select auth.uid()) is not null);

drop policy if exists "public read content sources" on public.content_sources;
drop policy if exists "authenticated users read content sources" on public.content_sources;
create policy "public read content sources" on public.content_sources for select using (true);
drop policy if exists "public read item sources" on public.learning_item_sources;
drop policy if exists "authenticated users read item sources" on public.learning_item_sources;
create policy "public read item sources" on public.learning_item_sources for select using (true);
drop policy if exists "public read classifications" on public.curriculum_classifications;
drop policy if exists "authenticated users read classifications" on public.curriculum_classifications;
create policy "public read classifications" on public.curriculum_classifications for select using (true);
drop policy if exists "public read practice questions" on public.practice_questions;
drop policy if exists "authenticated users read practice questions" on public.practice_questions;
create policy "public read practice questions" on public.practice_questions for select using (true);

drop policy if exists "users manage their item progress" on public.user_item_progress;
create policy "users manage their item progress" on public.user_item_progress for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "users manage their reviews" on public.reviews;
create policy "users manage their reviews" on public.reviews for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "users manage their review history" on public.review_history;
create policy "users manage their review history" on public.review_history for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "users manage their mistakes" on public.mistakes;
create policy "users manage their mistakes" on public.mistakes for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "users manage their notes" on public.notes;
create policy "users manage their notes" on public.notes for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "users manage their achievements" on public.user_achievements;
create policy "users manage their achievements" on public.user_achievements for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "users manage their study sessions" on public.study_sessions;
create policy "users manage their study sessions" on public.study_sessions for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "users manage their study events" on public.study_events;
create policy "users manage their study events" on public.study_events for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "users manage question stats" on public.question_stats;
create policy "users manage question stats" on public.question_stats for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "users manage study later" on public.study_later;
create policy "users manage study later" on public.study_later for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "users manage content drafts" on public.content_drafts;
create policy "users manage content drafts" on public.content_drafts for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "users manage their sync snapshot" on public.sync_snapshots;
create policy "users manage their sync snapshot" on public.sync_snapshots for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do update set email = excluded.email, updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
