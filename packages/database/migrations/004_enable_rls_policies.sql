-- 004_enable_rls_policies.sql
-- Optional baseline RLS. Use service role for ingestion jobs.

alter table public.games enable row level security;
alter table public.genres enable row level security;
alter table public.platforms enable row level security;
alter table public.tags enable row level security;
alter table public.game_tags enable row level security;
alter table public.articles enable row level security;
alter table public.sources enable row level security;
alter table public.article_sources enable row level security;
alter table public.seo_pages enable row level security;

drop policy if exists games_public_read on public.games;
create policy games_public_read on public.games
for select to anon, authenticated
using (status = 'published');

drop policy if exists genres_public_read on public.genres;
create policy genres_public_read on public.genres
for select to anon, authenticated
using (true);

drop policy if exists platforms_public_read on public.platforms;
create policy platforms_public_read on public.platforms
for select to anon, authenticated
using (true);

drop policy if exists tags_public_read on public.tags;
create policy tags_public_read on public.tags
for select to anon, authenticated
using (true);

drop policy if exists game_tags_public_read on public.game_tags;
create policy game_tags_public_read on public.game_tags
for select to anon, authenticated
using (true);

drop policy if exists articles_public_read on public.articles;
create policy articles_public_read on public.articles
for select to anon, authenticated
using (status = 'published');

drop policy if exists sources_public_read on public.sources;
create policy sources_public_read on public.sources
for select to anon, authenticated
using (is_active = true);

drop policy if exists article_sources_public_read on public.article_sources;
create policy article_sources_public_read on public.article_sources
for select to anon, authenticated
using (true);

drop policy if exists seo_pages_public_read on public.seo_pages;
create policy seo_pages_public_read on public.seo_pages
for select to anon, authenticated
using (status = 'published');
