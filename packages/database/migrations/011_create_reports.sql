-- 011_create_reports.sql
-- Estrutura para relatórios sobre publicações (artigos + vídeos) para empresas e profissionais.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  parameters jsonb default '{}',
  status text not null default 'pending',
  error_message text,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  constraint reports_type_check check (report_type in (
    'volume', 'top_sources', 'activity_by_weekday', 'executive_summary',
    'rss_vs_youtube', 'timeline', 'by_source_detail'
  )),
  constraint reports_status_check check (status in ('pending', 'completed', 'failed'))
);

create index if not exists reports_report_type_idx on public.reports (report_type);
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_type_period_idx on public.reports (report_type, period_start, period_end);

comment on table public.reports is 'Metadado dos relatórios gerados (tipo, período, status).';

create table if not exists public.report_results (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint report_results_report_fk foreign key (report_id) references public.reports(id) on delete cascade,
  constraint report_results_report_id_unique unique (report_id)
);

create index if not exists report_results_report_id_idx on public.report_results (report_id);

comment on table public.report_results is 'Resultado (payload JSON) de cada relatório.';
