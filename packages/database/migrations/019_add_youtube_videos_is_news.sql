-- 019_add_youtube_videos_is_news.sql
-- Flag para excluir da listagem pública e dos relatórios vídeos que não são conteúdo editorial (ex.: gameplays, off-topic).
-- true = exibir e contabilizar; false = não exibir nem contabilizar.

alter table public.youtube_videos
  add column if not exists is_news boolean not null default true;

comment on column public.youtube_videos.is_news is 'Quando true, o vídeo é exibido no site e contabilizado nos relatórios. Quando false, é tratado como não-conteúdo (ex.: gameplay, off-topic).';
