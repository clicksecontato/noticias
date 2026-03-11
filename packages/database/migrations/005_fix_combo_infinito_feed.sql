-- 005_fix_combo_infinito_feed.sql
-- Combo Infinito: feed correto é /principal/feed/ (WordPress), não /feed/.
-- Garante que a fonte exista com a URL certa para ingestão.

insert into public.sources (id, name, base_url, rss_url, language, trust_score, is_active)
values
  (
    'comboinfinito',
    'Combo Infinito',
    'https://www.comboinfinito.com.br/principal',
    'https://www.comboinfinito.com.br/principal/feed/',
    'pt-BR',
    75,
    true
  )
on conflict (id) do update
set
  name = excluded.name,
  base_url = excluded.base_url,
  rss_url = excluded.rss_url,
  language = excluded.language,
  trust_score = excluded.trust_score,
  is_active = excluded.is_active,
  updated_at = now();
