-- 029_sources_image_url.sql
-- Avatar/logo da fonte (YouTube: snippet.thumbnails do canal; RSS opcional no futuro).

alter table public.sources
  add column if not exists image_url text;

comment on column public.sources.image_url is
  'URL da imagem de perfil/logo da fonte (ex.: avatar do canal YouTube).';
