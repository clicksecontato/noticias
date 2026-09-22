-- 022_rename_games_to_subjects_drop_platforms.sql
-- Fase 1: remove platforms/hardware; rename games→subjects, genres→types e junctions.

-- ---------------------------------------------------------------------------
-- 1) Drop platform-related RLS policies and tables
-- ---------------------------------------------------------------------------
drop policy if exists article_platforms_public_read on public.article_platforms;
drop policy if exists youtube_video_platforms_public_read on public.youtube_video_platforms;
drop policy if exists platforms_public_read on public.platforms;

drop table if exists public.article_platforms;
drop table if exists public.youtube_video_platforms;
drop table if exists public.platforms;

-- ---------------------------------------------------------------------------
-- 2) Remove hardware SEO pages
-- ---------------------------------------------------------------------------
delete from public.seo_pages where page_type = 'hardware';

-- ---------------------------------------------------------------------------
-- 3) Reports: top_games → top_subjects
-- (drop CHECK first — cannot UPDATE to top_subjects while constraint still lists top_games)
-- ---------------------------------------------------------------------------
alter table public.reports
  drop constraint if exists reports_type_check;

update public.reports
set report_type = 'top_subjects'
where report_type = 'top_games';

alter table public.reports
  add constraint reports_type_check check (report_type in (
    'volume', 'top_sources', 'by_tags', 'activity_by_weekday', 'executive_summary',
    'rss_vs_youtube', 'timeline', 'by_source_detail', 'top_subjects', 'month_presentation'
  ));

-- ---------------------------------------------------------------------------
-- 4) Rename games → subjects (table, constraints, indexes, RLS)
-- ---------------------------------------------------------------------------
drop policy if exists games_public_read on public.games;

alter table public.games rename to subjects;

alter table public.subjects rename constraint games_slug_unique to subjects_slug_unique;

alter index if exists games_slug_unique_idx rename to subjects_slug_unique_idx;
alter index if exists games_release_date_idx rename to subjects_release_date_idx;
alter index if exists games_search_vector_idx rename to subjects_search_vector_idx;

-- PK default name from CREATE TABLE
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'games_pkey' and conrelid = 'public.subjects'::regclass
  ) then
    alter table public.subjects rename constraint games_pkey to subjects_pkey;
  end if;
end $$;

create policy subjects_public_read on public.subjects
for select to anon, authenticated
using (status = 'published');

-- ---------------------------------------------------------------------------
-- 5) Rename genres → types
-- ---------------------------------------------------------------------------
drop policy if exists genres_public_read on public.genres;

alter table public.genres rename to types;

alter table public.types rename constraint genres_slug_unique to types_slug_unique;

alter index if exists genres_slug_unique_idx rename to types_slug_unique_idx;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'genres_pkey' and conrelid = 'public.types'::regclass
  ) then
    alter table public.types rename constraint genres_pkey to types_pkey;
  end if;
end $$;

create policy types_public_read on public.types
for select to anon, authenticated
using (true);

-- ---------------------------------------------------------------------------
-- 6) Rename game_tags → subject_tags
-- ---------------------------------------------------------------------------
drop policy if exists game_tags_public_read on public.game_tags;

alter table public.game_tags rename to subject_tags;
alter table public.subject_tags rename column game_id to subject_id;

alter table public.subject_tags rename constraint game_tags_pk to subject_tags_pk;
alter table public.subject_tags rename constraint game_tags_game_fk to subject_tags_subject_fk;
alter table public.subject_tags rename constraint game_tags_tag_fk to subject_tags_tag_fk;

alter index if exists game_tags_pk_idx rename to subject_tags_pk_idx;

create policy subject_tags_public_read on public.subject_tags
for select to anon, authenticated
using (true);

-- ---------------------------------------------------------------------------
-- 7) Rename article_games → article_subjects
-- ---------------------------------------------------------------------------
drop policy if exists article_games_public_read on public.article_games;

alter table public.article_games rename to article_subjects;
alter table public.article_subjects rename column game_id to subject_id;

alter table public.article_subjects rename constraint article_games_pk to article_subjects_pk;
alter table public.article_subjects rename constraint article_games_article_fk to article_subjects_article_fk;
alter table public.article_subjects rename constraint article_games_game_fk to article_subjects_subject_fk;

alter index if exists article_games_game_id_idx rename to article_subjects_subject_id_idx;

create policy article_subjects_public_read on public.article_subjects
for select to anon, authenticated
using (true);

-- ---------------------------------------------------------------------------
-- 8) Rename article_genres → article_types
-- ---------------------------------------------------------------------------
drop policy if exists article_genres_public_read on public.article_genres;

alter table public.article_genres rename to article_types;
alter table public.article_types rename column genre_id to type_id;

alter table public.article_types rename constraint article_genres_pk to article_types_pk;
alter table public.article_types rename constraint article_genres_article_fk to article_types_article_fk;
alter table public.article_types rename constraint article_genres_genre_fk to article_types_type_fk;

alter index if exists article_genres_genre_id_idx rename to article_types_type_id_idx;

create policy article_types_public_read on public.article_types
for select to anon, authenticated
using (true);

-- ---------------------------------------------------------------------------
-- 9) Rename youtube_video_games → youtube_video_subjects
-- ---------------------------------------------------------------------------
drop policy if exists youtube_video_games_public_read on public.youtube_video_games;

alter table public.youtube_video_games rename to youtube_video_subjects;
alter table public.youtube_video_subjects rename column game_id to subject_id;

alter table public.youtube_video_subjects rename constraint youtube_video_games_pk to youtube_video_subjects_pk;
alter table public.youtube_video_subjects rename constraint youtube_video_games_video_fk to youtube_video_subjects_video_fk;
alter table public.youtube_video_subjects rename constraint youtube_video_games_game_fk to youtube_video_subjects_subject_fk;

alter index if exists youtube_video_games_game_id_idx rename to youtube_video_subjects_subject_id_idx;

create policy youtube_video_subjects_public_read on public.youtube_video_subjects
for select to anon, authenticated
using (true);

-- ---------------------------------------------------------------------------
-- 10) Rename youtube_video_genres → youtube_video_types
-- ---------------------------------------------------------------------------
drop policy if exists youtube_video_genres_public_read on public.youtube_video_genres;

alter table public.youtube_video_genres rename to youtube_video_types;
alter table public.youtube_video_types rename column genre_id to type_id;

alter table public.youtube_video_types rename constraint youtube_video_genres_pk to youtube_video_types_pk;
alter table public.youtube_video_types rename constraint youtube_video_genres_video_fk to youtube_video_types_video_fk;
alter table public.youtube_video_types rename constraint youtube_video_genres_genre_fk to youtube_video_types_type_fk;

alter index if exists youtube_video_genres_genre_id_idx rename to youtube_video_types_type_id_idx;

create policy youtube_video_types_public_read on public.youtube_video_types
for select to anon, authenticated
using (true);

comment on table public.article_subjects is 'Vínculo artigo ↔ assunto (enriquecimento por título/excerpt).';
comment on table public.youtube_video_subjects is 'Vínculo vídeo YouTube ↔ assunto (enriquecimento por título/descrição).';
