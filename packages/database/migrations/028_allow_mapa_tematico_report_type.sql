-- 028_allow_mapa_tematico_report_type.sql
-- Inclui o tipo de relatório 'mapa_tematico' na constraint reports_type_check.

alter table public.reports
  drop constraint if exists reports_type_check;

alter table public.reports
  add constraint reports_type_check check (report_type in (
    'volume', 'top_sources', 'by_tags', 'activity_by_weekday', 'executive_summary',
    'rss_vs_youtube', 'timeline', 'by_source_detail', 'top_subjects', 'month_presentation',
    'radar_pauta', 'mapa_tematico'
  ));
