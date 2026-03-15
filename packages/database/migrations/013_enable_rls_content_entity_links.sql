-- 013_enable_rls_content_entity_links.sql
-- RLS nas tabelas de vínculo (article_* e youtube_video_*). Leitura para anon/authenticated; escrita via service role.

alter table public.article_games enable row level security;
alter table public.article_tags enable row level security;
alter table public.article_genres enable row level security;
alter table public.article_platforms enable row level security;
alter table public.youtube_video_games enable row level security;
alter table public.youtube_video_tags enable row level security;
alter table public.youtube_video_genres enable row level security;
alter table public.youtube_video_platforms enable row level security;

create policy article_games_public_read on public.article_games for select to anon, authenticated using (true);
create policy article_tags_public_read on public.article_tags for select to anon, authenticated using (true);
create policy article_genres_public_read on public.article_genres for select to anon, authenticated using (true);
create policy article_platforms_public_read on public.article_platforms for select to anon, authenticated using (true);
create policy youtube_video_games_public_read on public.youtube_video_games for select to anon, authenticated using (true);
create policy youtube_video_tags_public_read on public.youtube_video_tags for select to anon, authenticated using (true);
create policy youtube_video_genres_public_read on public.youtube_video_genres for select to anon, authenticated using (true);
create policy youtube_video_platforms_public_read on public.youtube_video_platforms for select to anon, authenticated using (true);
