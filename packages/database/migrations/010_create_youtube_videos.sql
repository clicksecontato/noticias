-- 010_create_youtube_videos.sql
-- Armazena vídeos agregados dos canais YouTube cadastrados.

create table if not exists public.youtube_videos (
  id uuid primary key default gen_random_uuid(),
  source_id text not null,
  video_id text not null,
  title text not null,
  description text,
  published_at timestamptz not null,
  thumbnail_url text,
  url text not null,
  created_at timestamptz not null default now(),
  constraint youtube_videos_source_fk foreign key (source_id) references public.sources(id) on delete cascade,
  constraint youtube_videos_source_video_unique unique (source_id, video_id)
);

create index if not exists youtube_videos_source_id_idx on public.youtube_videos (source_id);
create index if not exists youtube_videos_published_at_idx on public.youtube_videos (published_at desc);

comment on table public.youtube_videos is 'Vídeos agregados dos canais YouTube (títulos e descrições para relatórios).';
