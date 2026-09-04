-- Keep authored grammar context and reading practice data available to remote clients.
alter table public.grammar_points
  add column if not exists aliases text[] not null default '{}',
  add column if not exists context jsonb not null default '{}'::jsonb;

alter table public.grammar_points
  add constraint grammar_points_context_object_check
  check (jsonb_typeof(context) = 'object');

alter table public.readings
  add column if not exists visual_format text,
  add column if not exists questions jsonb not null default '[]'::jsonb;

alter table public.readings
  add constraint readings_visual_format_check
  check (visual_format is null or visual_format in (
    'notice', 'menu', 'timetable', 'schedule', 'sale', 'event', 'directions',
    'hotel', 'work', 'health', 'school', 'home', 'restaurant', 'museum',
    'weather', 'delivery', 'transport'
  )),
  add constraint readings_questions_array_check
  check (jsonb_typeof(questions) = 'array');
