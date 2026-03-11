-- 006_fix_ign_br_feed.sql
-- IGN Brasil: feed correto é /feed.xml (não /feed, que retorna 404).
-- Corrige qualquer fonte que esteja com a URL antiga e garante a fonte ign-br.

update public.sources
set rss_url = 'https://br.ign.com/feed.xml',
    updated_at = now()
where rss_url = 'https://br.ign.com/feed';

insert into public.sources (id, name, base_url, rss_url, language, trust_score, is_active)
values
  (
    'ign-br',
    'IGN Brasil',
    'https://br.ign.com',
    'https://br.ign.com/feed.xml',
    'pt-BR',
    85,
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
