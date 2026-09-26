-- 031_youtube_video_public_metadata.sql
-- Metadados públicos do YouTube Data API (videos.list) para vídeos de terceiros.

alter table public.youtube_videos
  add column if not exists duration_seconds integer,
  add column if not exists creator_tags text[] not null default '{}',
  add column if not exists live_broadcast_content text,
  add column if not exists default_audio_language text,
  add column if not exists has_captions boolean,
  add column if not exists topic_categories text[] not null default '{}',
  add column if not exists youtube_category_id text;

alter table public.youtube_videos
  drop constraint if exists youtube_videos_duration_seconds_check;

alter table public.youtube_videos
  add constraint youtube_videos_duration_seconds_check
  check (duration_seconds is null or duration_seconds >= 0);

alter table public.youtube_videos
  drop constraint if exists youtube_videos_live_broadcast_content_check;

alter table public.youtube_videos
  add constraint youtube_videos_live_broadcast_content_check
  check (
    live_broadcast_content is null
    or live_broadcast_content in ('none', 'live', 'upcoming')
  );

comment on column public.youtube_videos.duration_seconds is 'Duração em segundos (contentDetails.duration).';
comment on column public.youtube_videos.creator_tags is 'Tags definidas pelo criador (snippet.tags).';
comment on column public.youtube_videos.live_broadcast_content is 'none, live ou upcoming (snippet.liveBroadcastContent).';
comment on column public.youtube_videos.default_audio_language is 'Idioma do áudio (snippet.defaultAudioLanguage ou defaultLanguage).';
comment on column public.youtube_videos.has_captions is 'Se o vídeo tem faixa de legenda (contentDetails.caption). Não é a transcrição.';
comment on column public.youtube_videos.topic_categories is 'Tópicos Wikipedia atribuídos pelo YouTube (topicDetails.topicCategories).';
comment on column public.youtube_videos.youtube_category_id is 'Categoria numérica do YouTube (snippet.categoryId).';
