-- 002_init_indexes_constraints.sql
-- Named indexes/constraints aligned with contracts and performance goals.

alter table public.games
  add constraint games_slug_unique unique (slug);

alter table public.genres
  add constraint genres_slug_unique unique (slug);

alter table public.platforms
  add constraint platforms_slug_unique unique (slug);

alter table public.tags
  add constraint tags_slug_unique unique (slug);

alter table public.articles
  add constraint articles_slug_unique unique (slug);

alter table public.sources
  add constraint sources_base_url_unique unique (base_url);

alter table public.seo_pages
  add constraint seo_pages_slug_path_unique unique (slug_path);

create unique index if not exists games_slug_unique_idx
  on public.games (slug);

create index if not exists games_release_date_idx
  on public.games (release_date desc nulls last);

create index if not exists games_search_vector_idx
  on public.games
  using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(summary, '')));

create unique index if not exists genres_slug_unique_idx
  on public.genres (slug);

create unique index if not exists platforms_slug_unique_idx
  on public.platforms (slug);

create unique index if not exists tags_slug_unique_idx
  on public.tags (slug);

create unique index if not exists articles_slug_unique_idx
  on public.articles (slug);

create index if not exists articles_published_at_idx
  on public.articles (published_at desc);

create unique index if not exists sources_base_url_unique_idx
  on public.sources (base_url);

create unique index if not exists game_tags_pk_idx
  on public.game_tags (game_id, tag_id);

create unique index if not exists article_sources_pk_idx
  on public.article_sources (article_id, source_id);

create unique index if not exists seo_pages_slug_path_unique_idx
  on public.seo_pages (slug_path);

create index if not exists seo_pages_page_type_status_idx
  on public.seo_pages (page_type, status);

create index if not exists seo_pages_next_revalidate_at_idx
  on public.seo_pages (next_revalidate_at);
