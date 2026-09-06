alter table public.kanji add column if not exists confusable_kanji text[] not null default '{}';
