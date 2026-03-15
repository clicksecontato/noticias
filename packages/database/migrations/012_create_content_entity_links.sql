-- 012_create_content_entity_links.sql
-- Tabelas de vínculo entre conteúdo (articles, youtube_videos) e entidades (games, tags, genres, platforms).
-- Usado para enriquecimento na ingestão e filtros em relatórios.

-- Artigo ↔ entidades
create table if not exists public.article_games (
  article_id uuid not null,
  game_id uuid not null,
  created_at timestamptz not null default now(),
  constraint article_games_pk primary key (article_id, game_id),
  constraint article_games_article_fk foreign key (article_id) references public.articles(id) on delete cascade,
  constraint article_games_game_fk foreign key (game_id) references public.games(id) on delete cascade
);

create table if not exists public.article_tags (
  article_id uuid not null,
  tag_id uuid not null,
  created_at timestamptz not null default now(),
  constraint article_tags_pk primary key (article_id, tag_id),
  constraint article_tags_article_fk foreign key (article_id) references public.articles(id) on delete cascade,
  constraint article_tags_tag_fk foreign key (tag_id) references public.tags(id) on delete cascade
);

create table if not exists public.article_genres (
  article_id uuid not null,
  genre_id uuid not null,
  created_at timestamptz not null default now(),
  constraint article_genres_pk primary key (article_id, genre_id),
  constraint article_genres_article_fk foreign key (article_id) references public.articles(id) on delete cascade,
  constraint article_genres_genre_fk foreign key (genre_id) references public.genres(id) on delete cascade
);

create table if not exists public.article_platforms (
  article_id uuid not null,
  platform_id uuid not null,
  created_at timestamptz not null default now(),
  constraint article_platforms_pk primary key (article_id, platform_id),
  constraint article_platforms_article_fk foreign key (article_id) references public.articles(id) on delete cascade,
  constraint article_platforms_platform_fk foreign key (platform_id) references public.platforms(id) on delete cascade
);

-- Youtube video ↔ entidades
create table if not exists public.youtube_video_games (
  youtube_video_id uuid not null,
  game_id uuid not null,
  created_at timestamptz not null default now(),
  constraint youtube_video_games_pk primary key (youtube_video_id, game_id),
  constraint youtube_video_games_video_fk foreign key (youtube_video_id) references public.youtube_videos(id) on delete cascade,
  constraint youtube_video_games_game_fk foreign key (game_id) references public.games(id) on delete cascade
);

create table if not exists public.youtube_video_tags (
  youtube_video_id uuid not null,
  tag_id uuid not null,
  created_at timestamptz not null default now(),
  constraint youtube_video_tags_pk primary key (youtube_video_id, tag_id),
  constraint youtube_video_tags_video_fk foreign key (youtube_video_id) references public.youtube_videos(id) on delete cascade,
  constraint youtube_video_tags_tag_fk foreign key (tag_id) references public.tags(id) on delete cascade
);

create table if not exists public.youtube_video_genres (
  youtube_video_id uuid not null,
  genre_id uuid not null,
  created_at timestamptz not null default now(),
  constraint youtube_video_genres_pk primary key (youtube_video_id, genre_id),
  constraint youtube_video_genres_video_fk foreign key (youtube_video_id) references public.youtube_videos(id) on delete cascade,
  constraint youtube_video_genres_genre_fk foreign key (genre_id) references public.genres(id) on delete cascade
);

create table if not exists public.youtube_video_platforms (
  youtube_video_id uuid not null,
  platform_id uuid not null,
  created_at timestamptz not null default now(),
  constraint youtube_video_platforms_pk primary key (youtube_video_id, platform_id),
  constraint youtube_video_platforms_video_fk foreign key (youtube_video_id) references public.youtube_videos(id) on delete cascade,
  constraint youtube_video_platforms_platform_fk foreign key (platform_id) references public.platforms(id) on delete cascade
);

-- Índices para filtros em relatórios (por entidade)
create index if not exists article_games_game_id_idx on public.article_games (game_id);
create index if not exists article_tags_tag_id_idx on public.article_tags (tag_id);
create index if not exists article_genres_genre_id_idx on public.article_genres (genre_id);
create index if not exists article_platforms_platform_id_idx on public.article_platforms (platform_id);
create index if not exists youtube_video_games_game_id_idx on public.youtube_video_games (game_id);
create index if not exists youtube_video_tags_tag_id_idx on public.youtube_video_tags (tag_id);
create index if not exists youtube_video_genres_genre_id_idx on public.youtube_video_genres (genre_id);
create index if not exists youtube_video_platforms_platform_id_idx on public.youtube_video_platforms (platform_id);

comment on table public.article_games is 'Vínculo artigo ↔ jogo (enriquecimento por título/excerpt).';
comment on table public.youtube_video_games is 'Vínculo vídeo YouTube ↔ jogo (enriquecimento por título/descrição).';
