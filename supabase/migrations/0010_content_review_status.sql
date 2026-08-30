alter table public.learning_items
  add column if not exists review_status text not null default 'approved';

alter table public.learning_items
  drop constraint if exists learning_items_review_status_check;

alter table public.learning_items
  add constraint learning_items_review_status_check check (review_status in ('pending', 'approved', 'rejected'));

create index if not exists learning_items_review_status_idx on public.learning_items(review_status);
