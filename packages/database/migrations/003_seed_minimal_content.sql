-- 003_seed_minimal_content.sql
-- Minimal seed for manual ingestion flow and dynamic route generation.

insert into public.sources (id, name, base_url, rss_url, language, trust_score, is_active)
values
  ('s1', 'The Enemy', 'https://www.theenemy.com.br', 'https://www.theenemy.com.br/rss', 'pt-BR', 85, true),
  ('s2', 'Canaltech Games', 'https://canaltech.com.br', 'https://canaltech.com.br/rss/games/', 'pt-BR', 80, true),
  ('s3', 'IGN International', 'https://www.ign.com', 'https://feeds.ign.com/ign/all', 'en-US', 60, false)
on conflict (id) do update
set
  name = excluded.name,
  base_url = excluded.base_url,
  rss_url = excluded.rss_url,
  language = excluded.language,
  trust_score = excluded.trust_score,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.genres (slug, name, description)
values
  ('rpg', 'RPG', 'Role-playing games'),
  ('fps', 'FPS', 'First-person shooters'),
  ('survival', 'Survival', 'Games focused on endurance and resource management')
on conflict (slug) do nothing;

insert into public.platforms (slug, name, vendor)
values
  ('pc', 'PC', 'Multi'),
  ('ps5', 'PlayStation 5', 'Sony'),
  ('xbox-series', 'Xbox Series', 'Microsoft')
on conflict (slug) do nothing;

insert into public.games (slug, name, summary, release_date, rating, status)
values
  ('elden-ring', 'Elden Ring', 'RPG de acao com exploracao em mundo aberto e combate desafiador.', '2022-02-25', 9.6, 'published'),
  ('baldurs-gate-3', 'Baldur''s Gate 3', 'RPG tatico com narrativa profunda e escolhas de alto impacto.', '2023-08-03', 9.5, 'published')
on conflict (slug) do update
set
  name = excluded.name,
  summary = excluded.summary,
  release_date = excluded.release_date,
  rating = excluded.rating,
  status = excluded.status,
  updated_at = now();

insert into public.articles (slug, title, excerpt, status, published_at)
values
  ('novo-trailer-de-gta-6', 'Novo trailer de GTA 6 revela mais da cidade', 'Confira os principais detalhes revelados e o que muda na jogabilidade.', 'published', now()),
  ('atualizacao-elden-ring', 'Atualizacao de Elden Ring melhora balanceamento', 'Patch recente ajusta builds e melhora estabilidade em diferentes plataformas.', 'published', now())
on conflict (slug) do update
set
  title = excluded.title,
  excerpt = excluded.excerpt,
  status = excluded.status,
  updated_at = now();

insert into public.seo_pages (page_type, slug_path, title, meta_description, status, canonical_url, last_generated_at)
values
  ('hardware', '/hardware/8gb', 'Jogos para PC com 8GB de RAM', 'Lista de jogos recomendados para computadores com 8GB de RAM.', 'published', 'https://www.noticiasgames.com/hardware/8gb', now()),
  ('hardware', '/hardware/16gb', 'Jogos para PC com 16GB de RAM', 'Jogos e desempenho esperado para setups com 16GB de RAM.', 'published', 'https://www.noticiasgames.com/hardware/16gb', now()),
  ('hardware', '/hardware/32gb', 'Jogos para PC com 32GB de RAM', 'Experiencias recomendadas para PCs com 32GB de RAM.', 'published', 'https://www.noticiasgames.com/hardware/32gb', now())
on conflict (slug_path) do update
set
  title = excluded.title,
  meta_description = excluded.meta_description,
  status = excluded.status,
  canonical_url = excluded.canonical_url,
  last_generated_at = excluded.last_generated_at,
  updated_at = now();
