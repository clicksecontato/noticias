-- 034_allow_editorial_pauta_report_types.sql
-- Inclui perspectivas, em_portugues e by_types na constraint reports_type_check.

alter table public.reports
  drop constraint if exists reports_type_check;

alter table public.reports
  add constraint reports_type_check check (report_type in (
    'volume', 'top_sources', 'by_tags', 'activity_by_weekday', 'executive_summary',
    'rss_vs_youtube', 'timeline', 'by_source_detail', 'top_subjects', 'month_presentation',
    'radar_pauta', 'mapa_tematico', 'youtube_formato', 'thumb_analysis',
    'perspectivas', 'em_portugues', 'by_types'
  ));
