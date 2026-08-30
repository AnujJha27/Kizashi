-- Keep deployed reference books out of Git and in a private Storage bucket.
-- Supabase Free projects cap each object at 50 MiB, so the app expects
-- 45 MiB parts under books/<book-id>/part-000.pdf, etc.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('books', 'books', false, 47185920, array['application/pdf']::text[])
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
