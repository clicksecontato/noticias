-- 009_add_source_provider.sql
-- Flag de provider (rss | youtube) para suportar múltiplas fontes de conteúdo.

alter table public.sources
  add column if not exists provider text not null default 'rss',
  add column if not exists channel_id text;

-- rss_url pode ser null para fontes YouTube
alter table public.sources
  alter column rss_url drop not null;

-- Garante que apenas valores conhecidos sejam usados (expandir conforme novos providers).
alter table public.sources
  drop constraint if exists sources_provider_check;

alter table public.sources
  add constraint sources_provider_check check (provider in ('rss', 'youtube'));

-- rss_url obrigatório apenas para provider 'rss'; channel_id obrigatório para 'youtube'.
-- (Não é possível expressar "if provider=rss then rss_url not null" em um único check simples em todas as versões do PG;
-- aplicação deve validar. Opcional: trigger ou check com case.)
comment on column public.sources.provider is 'Tipo de fonte: rss (feed) ou youtube (canal).';
comment on column public.sources.channel_id is 'ID do canal YouTube (obrigatório quando provider=youtube).';
