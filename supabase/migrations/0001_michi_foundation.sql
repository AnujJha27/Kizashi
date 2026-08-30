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
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vocabulary (
  item_id text primary key references public.learning_items(id) on delete cascade,
  written_form text not null,
  reading text not null,
  meanings text[] not null,
  part_of_speech text not null,
  commonness integer check (commonness between 1 and 5),
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

create index if not exists learning_items_type_idx on public.learning_items(item_type, jlpt_level);
create index if not exists chapters_course_idx on public.chapters(course_id, sort_order);
create index if not exists lessons_chapter_idx on public.lessons(chapter_id, sort_order);
create index if not exists lesson_items_order_idx on public.lesson_learning_items(lesson_id, sort_order);
create index if not exists reviews_due_idx on public.reviews(user_id, due_at) where status = 'scheduled';
create index if not exists mistakes_user_idx on public.mistakes(user_id, occurrence_count desc);
create index if not exists study_events_user_idx on public.study_events(user_id, created_at desc);

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

create policy "users read their profile" on public.profiles for select using ((select auth.uid()) = id);
create policy "users update their profile" on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "authenticated users read courses" on public.courses for select using ((select auth.uid()) is not null);
create policy "authenticated users read chapters" on public.chapters for select using ((select auth.uid()) is not null);
create policy "authenticated users read lessons" on public.lessons for select using ((select auth.uid()) is not null);
create policy "authenticated users read learning items" on public.learning_items for select using ((select auth.uid()) is not null);
create policy "authenticated users read vocabulary" on public.vocabulary for select using ((select auth.uid()) is not null);
create policy "authenticated users read kanji" on public.kanji for select using ((select auth.uid()) is not null);
create policy "authenticated users read grammar" on public.grammar_points for select using ((select auth.uid()) is not null);
create policy "authenticated users read grammar contrasts" on public.grammar_contrasts for select using ((select auth.uid()) is not null);
create policy "authenticated users read sentences" on public.sentences for select using ((select auth.uid()) is not null);
create policy "authenticated users read readings" on public.readings for select using ((select auth.uid()) is not null);
create policy "authenticated users read listening" on public.listening_exercises for select using ((select auth.uid()) is not null);
create policy "authenticated users read lesson items" on public.lesson_learning_items for select using ((select auth.uid()) is not null);
create policy "authenticated users read lesson vocabulary" on public.lesson_vocabulary for select using ((select auth.uid()) is not null);
create policy "authenticated users read lesson grammar" on public.lesson_grammar for select using ((select auth.uid()) is not null);
create policy "authenticated users read lesson kanji" on public.lesson_kanji for select using ((select auth.uid()) is not null);
create policy "authenticated users read lesson readings" on public.lesson_readings for select using ((select auth.uid()) is not null);
create policy "authenticated users read lesson listening" on public.lesson_listening for select using ((select auth.uid()) is not null);
create policy "authenticated users read achievements" on public.achievements for select using ((select auth.uid()) is not null);

create policy "users manage their item progress" on public.user_item_progress for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users manage their reviews" on public.reviews for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users manage their review history" on public.review_history for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users manage their mistakes" on public.mistakes for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users manage their notes" on public.notes for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users manage their achievements" on public.user_achievements for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users manage their study sessions" on public.study_sessions for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users manage their study events" on public.study_events for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

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
