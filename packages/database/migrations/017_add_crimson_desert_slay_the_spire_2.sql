-- 017_add_crimson_desert_slay_the_spire_2.sql
-- Inclui no catálogo jogos em alta nas notícias que não apareciam no Top jogos.

insert into public.games (slug, name, summary, release_date, rating, status)
values
  ('crimson-desert', 'Crimson Desert', 'RPG de ação em mundo aberto da Pearl Abyss com foco em narrativa e combate.', null, null, 'published'),
  ('slay-the-spire-2', 'Slay the Spire II', 'Sequel do roguelike de deck-building da Mega Crit Games.', null, null, 'published')
on conflict (slug) do update set
  name = excluded.name,
  summary = excluded.summary,
  release_date = excluded.release_date,
  rating = excluded.rating,
  status = excluded.status,
  updated_at = now();
