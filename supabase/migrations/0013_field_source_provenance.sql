alter table public.learning_items
  add column if not exists field_source_ids jsonb not null default '{}'::jsonb;

alter table public.learning_items
  drop constraint if exists learning_items_field_source_ids_object_check;

alter table public.learning_items
  add constraint learning_items_field_source_ids_object_check
  check (jsonb_typeof(field_source_ids) = 'object');
