-- 014_seed_tags_genres_platforms_games.sql
-- Seed com tags, gêneros, plataformas e jogos reais do mundo dos jogos digitais.
-- Idempotente: usa on conflict (slug) para não duplicar.

-- Tags (estilo de jogo, mecânicas, tipo de experiência)
insert into public.tags (slug, name)
values
  ('multiplayer', 'Multiplayer'),
  ('single-player', 'Single-player'),
  ('co-op', 'Co-op'),
  ('online', 'Online'),
  ('open-world', 'Mundo aberto'),
  ('story-driven', 'Narrativa'),
  ('competitive', 'Competitivo'),
  ('casual', 'Casual'),
  ('indie', 'Indie'),
  ('action-rpg', 'Action RPG'),
  ('battle-royale', 'Battle Royale'),
  ('metroidvania', 'Metroidvania'),
  ('roguelike', 'Roguelike'),
  ('souls-like', 'Souls-like'),
  ('sandbox', 'Sandbox'),
  ('narrative', 'Narrativo'),
  ('horror', 'Horror'),
  ('strategy', 'Estratégia'),
  ('first-person', 'Primeira pessoa'),
  ('third-person', 'Terceira pessoa'),
  ('crossplay', 'Crossplay'),
  ('free-to-play', 'Free-to-play'),
  ('early-access', 'Early Access'),
  ('remaster', 'Remaster'),
  ('remake', 'Remake'),
  ('vr', 'VR'),
  ('esports', 'eSports')
on conflict (slug) do update set name = excluded.name;

-- Gêneros
insert into public.genres (slug, name, description)
values
  ('rpg', 'RPG', 'Role-playing games com progressão de personagem e narrativa.'),
  ('fps', 'FPS', 'First-person shooters em primeira pessoa.'),
  ('action', 'Ação', 'Jogos focados em combate e reflexos.'),
  ('adventure', 'Aventura', 'Exploração e descoberta com narrativa.'),
  ('strategy', 'Estratégia', 'Planejamento tático e gestão de recursos.'),
  ('sports', 'Esportes', 'Simuladores e arcades de esportes.'),
  ('simulation', 'Simulação', 'Simuladores de vida, voo, construção.'),
  ('puzzle', 'Puzzle', 'Quebra-cabeças e desafios lógicos.'),
  ('fighting', 'Luta', 'Combate um contra um ou em grupo.'),
  ('survival', 'Survival', 'Sobrevivência e gestão de recursos.'),
  ('horror', 'Horror', 'Terror e atmosfera de suspense.'),
  ('platformer', 'Plataforma', 'Saltos e exploração em níveis.'),
  ('moba', 'MOBA', 'Multiplayer online battle arena.'),
  ('mmorpg', 'MMORPG', 'RPG massivo multiplayer online.'),
  ('racing', 'Corrida', 'Corridas de veículos e velocidade.')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description;

-- Plataformas
insert into public.platforms (slug, name, vendor)
values
  ('pc', 'PC', 'Multi'),
  ('playstation-5', 'PlayStation 5', 'Sony'),
  ('playstation-4', 'PlayStation 4', 'Sony'),
  ('xbox-series-x', 'Xbox Series X', 'Microsoft'),
  ('xbox-series-s', 'Xbox Series S', 'Microsoft'),
  ('xbox-one', 'Xbox One', 'Microsoft'),
  ('nintendo-switch', 'Nintendo Switch', 'Nintendo'),
  ('steam-deck', 'Steam Deck', 'Valve'),
  ('mobile', 'Mobile', 'Multi'),
  ('ios', 'iOS', 'Apple'),
  ('android', 'Android', 'Google')
on conflict (slug) do update set
  name = excluded.name,
  vendor = excluded.vendor;

-- Jogos (reais e relevantes para notícias)
insert into public.games (slug, name, summary, release_date, rating, status)
values
  ('elden-ring', 'Elden Ring', 'RPG de ação em mundo aberto com combate desafiador e lore profundo.', '2022-02-25', 9.6, 'published'),
  ('gta-v', 'GTA V', 'Ação em mundo aberto em Los Santos com campanha e GTA Online.', '2013-09-17', 9.2, 'published'),
  ('gta-6', 'GTA 6', 'Próximo Grand Theft Auto ambientado em Vice City.', null, null, 'published'),
  ('baldurs-gate-3', 'Baldur''s Gate 3', 'RPG tático baseado em D&D com narrativa e escolhas profundas.', '2023-08-03', 9.5, 'published'),
  ('zelda-tears-of-the-kingdom', 'The Legend of Zelda: Tears of the Kingdom', 'Sequel de Breath of the Wild com exploração e física avançada.', '2023-05-12', 9.5, 'published'),
  ('zelda-breath-of-the-wild', 'The Legend of Zelda: Breath of the Wild', 'Aventura em mundo aberto na terra de Hyrule.', '2017-03-03', 9.5, 'published'),
  ('cyberpunk-2077', 'Cyberpunk 2077', 'RPG de ação em Night City com história e personagens marcantes.', '2020-12-10', 8.5, 'published'),
  ('minecraft', 'Minecraft', 'Sandbox de construção e sobrevivência em mundo procedural.', '2011-11-18', 9.0, 'published'),
  ('fortnite', 'Fortnite', 'Battle royale free-to-play com construção e eventos ao vivo.', '2017-07-25', 8.8, 'published'),
  ('dark-souls-3', 'Dark Souls III', 'Action RPG souls-like com combate punitivo e mundo interconectado.', '2016-04-12', 9.2, 'published'),
  ('god-of-war-ragnarok', 'God of War Ragnarök', 'Ação e narrativa com Kratos e Atreus em mitologia nórdica.', '2022-11-09', 9.4, 'published'),
  ('spider-man-2', 'Marvel''s Spider-Man 2', 'Ação e aventura com Peter e Miles em Nova York.', '2023-10-20', 9.2, 'published'),
  ('red-dead-redemption-2', 'Red Dead Redemption 2', 'Western em mundo aberto com história e ambientação imersivas.', '2018-10-26', 9.6, 'published'),
  ('the-last-of-us-part-2', 'The Last of Us Part II', 'Ação e narrativa pós-apocalíptica com Ellie.', '2020-06-19', 9.0, 'published'),
  ('fifa-ea-sports-fc', 'EA Sports FC', 'Simulador de futebol com ligas e modos online.', '2023-09-29', 8.2, 'published'),
  ('counter-strike-2', 'Counter-Strike 2', 'FPS tático competitivo 5v5.', '2023-09-27', 9.0, 'published'),
  ('valorant', 'Valorant', 'FPS tático 5v5 com agentes e habilidades.', '2020-06-02', 8.8, 'published'),
  ('league-of-legends', 'League of Legends', 'MOBA 5v5 com mais de 160 campeões.', '2009-10-27', 8.5, 'published'),
  ('dota-2', 'Dota 2', 'MOBA competitivo com partidas estratégicas.', '2013-07-09', 9.0, 'published'),
  ('starfield', 'Starfield', 'RPG de exploração espacial da Bethesda.', '2023-09-06', 8.2, 'published'),
  ('hogwarts-legacy', 'Hogwarts Legacy', 'RPG de ação no mundo de Harry Potter.', '2023-02-10', 8.5, 'published'),
  ('diablo-4', 'Diablo IV', 'Action RPG de loot e dungeons em Sanctuary.', '2023-06-06', 8.8, 'published'),
  ('resident-evil-4-remake', 'Resident Evil 4 Remake', 'Remake do clássico de survival horror.', '2023-03-24', 9.2, 'published'),
  ('final-fantasy-vii-rebirth', 'Final Fantasy VII Rebirth', 'Segunda parte do remake de FF VII.', '2024-02-29', 9.2, 'published'),
  ('helldivers-2', 'Helldivers 2', 'Shooter cooperativo de terceira pessoa com humor e caos.', '2024-02-08', 9.0, 'published'),
  ('palworld', 'Palworld', 'Survival com criaturas, construção e coop.', '2024-01-19', 8.0, 'published'),
  ('monster-hunter-world', 'Monster Hunter World', 'Caça a monstros em mundo aberto com coop.', '2018-08-09', 9.2, 'published'),
  ('hades', 'Hades', 'Roguelike de ação com narrativa e combate fluido.', '2020-09-17', 9.4, 'published'),
  ('hollow-knight', 'Hollow Knight', 'Metroidvania com atmosfera e exploração.', '2017-02-24', 9.2, 'published'),
  ('stardew-valley', 'Stardew Valley', 'Simulação de fazenda e vida com coop.', '2016-02-26', 9.0, 'published')
on conflict (slug) do update set
  name = excluded.name,
  summary = excluded.summary,
  release_date = excluded.release_date,
  rating = excluded.rating,
  status = excluded.status,
  updated_at = now();

-- game_tags: vincular jogos às tags (por slug)
insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'elden-ring' and t.slug in ('single-player', 'open-world', 'action-rpg', 'souls-like', 'third-person')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'gta-v' and t.slug in ('multiplayer', 'open-world', 'online', 'sandbox', 'third-person')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'gta-6' and t.slug in ('multiplayer', 'open-world', 'online', 'sandbox')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'baldurs-gate-3' and t.slug in ('single-player', 'co-op', 'story-driven', 'narrative', 'action-rpg')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug in ('zelda-tears-of-the-kingdom', 'zelda-breath-of-the-wild') and t.slug in ('single-player', 'open-world', 'story-driven')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'cyberpunk-2077' and t.slug in ('single-player', 'open-world', 'action-rpg', 'first-person', 'narrative')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'minecraft' and t.slug in ('multiplayer', 'sandbox', 'co-op', 'open-world')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'fortnite' and t.slug in ('multiplayer', 'online', 'battle-royale', 'free-to-play', 'crossplay')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'dark-souls-3' and t.slug in ('single-player', 'multiplayer', 'souls-like', 'action-rpg')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug in ('god-of-war-ragnarok', 'spider-man-2') and t.slug in ('single-player', 'story-driven', 'action', 'third-person')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'red-dead-redemption-2' and t.slug in ('single-player', 'online', 'open-world', 'story-driven')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'the-last-of-us-part-2' and t.slug in ('single-player', 'story-driven', 'narrative', 'third-person')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'fifa-ea-sports-fc' and t.slug in ('multiplayer', 'online', 'competitive', 'sports')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug in ('counter-strike-2', 'valorant') and t.slug in ('multiplayer', 'online', 'competitive', 'first-person', 'esports')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug in ('league-of-legends', 'dota-2') and t.slug in ('multiplayer', 'online', 'competitive', 'moba', 'esports')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'starfield' and t.slug in ('single-player', 'open-world', 'action-rpg', 'first-person')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'hogwarts-legacy' and t.slug in ('single-player', 'open-world', 'action-rpg', 'story-driven')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'diablo-4' and t.slug in ('multiplayer', 'online', 'action-rpg', 'co-op')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'resident-evil-4-remake' and t.slug in ('single-player', 'horror', 'third-person', 'remake')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'helldivers-2' and t.slug in ('multiplayer', 'co-op', 'online', 'third-person')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'palworld' and t.slug in ('multiplayer', 'co-op', 'survival', 'sandbox', 'open-world')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'monster-hunter-world' and t.slug in ('multiplayer', 'co-op', 'action-rpg', 'online')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'hades' and t.slug in ('single-player', 'roguelike', 'action-rpg', 'indie', 'narrative')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'hollow-knight' and t.slug in ('single-player', 'metroidvania', 'indie', 'platformer')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug = 'stardew-valley' and t.slug in ('single-player', 'co-op', 'casual', 'indie', 'simulation')
on conflict (game_id, tag_id) do nothing;

insert into public.game_tags (game_id, tag_id)
select g.id, t.id from public.games g, public.tags t
where g.slug in ('final-fantasy-vii-rebirth', 'spider-man-2') and t.slug = 'third-person'
on conflict (game_id, tag_id) do nothing;
