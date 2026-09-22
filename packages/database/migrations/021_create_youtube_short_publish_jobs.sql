-- 021_create_youtube_short_publish_jobs.sql
-- Jobs de republicacao de shorts do YouTube no canal do administrador.

create table if not exists public.youtube_short_publish_jobs (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  source_video_id text not null,
  source_title text,
  source_channel_title text,
  target_title text,
  target_description text,
  target_tags text[] not null default '{}',
  target_privacy_status text not null default 'private',
  status text not null default 'pending',
  target_video_id text,
  target_video_url text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  constraint youtube_short_publish_jobs_privacy_check
    check (target_privacy_status in ('private', 'unlisted', 'public')),
  constraint youtube_short_publish_jobs_status_check
    check (status in ('pending', 'processing', 'completed', 'failed'))
);

create index if not exists youtube_short_publish_jobs_status_idx
  on public.youtube_short_publish_jobs (status);
create index if not exists youtube_short_publish_jobs_created_at_idx
  on public.youtube_short_publish_jobs (created_at desc);
create index if not exists youtube_short_publish_jobs_source_video_id_idx
  on public.youtube_short_publish_jobs (source_video_id);

comment on table public.youtube_short_publish_jobs
  is 'Historico de jobs de publicacao de shorts para canal administrado.';
