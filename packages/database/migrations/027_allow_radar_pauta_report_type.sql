-- 027_allow_radar_pauta_report_type.sql
-- Inclui o tipo de relatório 'radar_pauta' na constraint reports_type_check.

alter table public.reports
  drop constraint if exists reports_type_check;

alter table public.reports
  add constraint reports_type_check check (report_type in (
    'volume', 'top_sources', 'by_tags', 'activity_by_weekday', 'executive_summary',
    'rss_vs_youtube', 'timeline', 'by_source_detail', 'top_subjects', 'month_presentation',
    'radar_pauta'
  ));
