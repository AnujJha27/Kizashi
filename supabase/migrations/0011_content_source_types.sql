alter table public.content_sources
  drop constraint if exists content_sources_source_type_check;

alter table public.content_sources
  add constraint content_sources_source_type_check
  check (source_type in ('official', 'dictionary', 'curriculum', 'frequency', 'examples', 'generated', 'user'));
