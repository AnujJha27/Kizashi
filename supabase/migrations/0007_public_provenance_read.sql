-- Provenance is shared content metadata, not user data. Keep progress,
-- question stats, study-later items, and drafts behind their auth policies.
create policy "public read content sources" on public.content_sources for select using (true);
create policy "public read item sources" on public.learning_item_sources for select using (true);
create policy "public read classifications" on public.curriculum_classifications for select using (true);
