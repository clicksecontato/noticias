-- 030_youtube_api_quota_events.sql
-- Registro operacional de chamadas à YouTube Data API v3 (estimativa de cota).

create table if not exists public.youtube_api_quota_events (
  id uuid primary key default gen_random_uuid(),
  method text not null,
  units integer not null check (units > 0),
  context text,
  quota_day date not null,
  created_at timestamptz not null default now()
);

create index if not exists youtube_api_quota_events_quota_day_idx
  on public.youtube_api_quota_events (quota_day desc);

create index if not exists youtube_api_quota_events_method_day_idx
  on public.youtube_api_quota_events (method, quota_day desc);

create index if not exists youtube_api_quota_events_created_at_idx
  on public.youtube_api_quota_events (created_at desc);

comment on table public.youtube_api_quota_events
  is 'Eventos de uso da YouTube Data API v3 para estimar consumo diário de cota (PT).';
