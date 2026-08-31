alter table public.learning_items
  add column if not exists audio_metadata jsonb not null default '{}'::jsonb;

alter table public.learning_items
  drop constraint if exists learning_items_audio_metadata_check;

alter table public.learning_items
  add constraint learning_items_audio_metadata_check check (
    jsonb_typeof(audio_metadata) = 'object'
    and (
      not (audio_metadata ? 'sourceType')
      or audio_metadata->>'sourceType' in ('browser-speech', 'remote', 'server-tts')
    )
  );

alter table public.practice_questions
  add column if not exists audio_metadata jsonb not null default '{}'::jsonb;

alter table public.practice_questions
  drop constraint if exists practice_questions_audio_metadata_check;

alter table public.practice_questions
  add constraint practice_questions_audio_metadata_check check (
    jsonb_typeof(audio_metadata) = 'object'
    and (
      not (audio_metadata ? 'sourceType')
      or audio_metadata->>'sourceType' in ('browser-speech', 'remote', 'server-tts')
    )
  );
