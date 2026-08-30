alter table public.kanji add column if not exists stroke_count integer check (stroke_count is null or stroke_count > 0);
alter table public.kanji add column if not exists grade integer check (grade is null or grade > 0);
alter table public.kanji add column if not exists radical text;
alter table public.kanji add column if not exists nanori text[] not null default '{}';
alter table public.kanji add column if not exists components text[] not null default '{}';
alter table public.kanji add column if not exists mnemonic text;
alter table public.kanji add column if not exists stroke_order text;
