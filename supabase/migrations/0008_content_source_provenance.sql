-- Preserve acquisition checksums and local artifact names in the source registry.
alter table public.content_sources add column if not exists sha256 text;
alter table public.content_sources add column if not exists local_filename text;
