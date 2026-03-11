-- 007_add_articles_image_url.sql
-- Optional image URL for article cards (e.g. from RSS enclosure/media).

alter table public.articles
  add column if not exists image_url text;

comment on column public.articles.image_url is 'Optional thumbnail/cover image URL (e.g. from RSS enclosure or media:content).';
