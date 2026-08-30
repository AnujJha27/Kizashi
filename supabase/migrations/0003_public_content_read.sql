-- Content is public while the no-auth preview is deployed. User progress stays protected by auth policies.
create policy "public read courses" on public.courses for select using (true);
create policy "public read chapters" on public.chapters for select using (true);
create policy "public read lessons" on public.lessons for select using (true);
create policy "public read learning items" on public.learning_items for select using (true);
create policy "public read vocabulary" on public.vocabulary for select using (true);
create policy "public read kanji" on public.kanji for select using (true);
create policy "public read grammar" on public.grammar_points for select using (true);
create policy "public read grammar contrasts" on public.grammar_contrasts for select using (true);
create policy "public read readings" on public.readings for select using (true);
create policy "public read listening" on public.listening_exercises for select using (true);
create policy "public read lesson items" on public.lesson_learning_items for select using (true);
create policy "public read practice questions" on public.practice_questions for select using (true);
