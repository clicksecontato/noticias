-- 001_init_core_tables.sql
-- Core schema for gaming news + programmatic SEO platform.

create extension if not exists pgcrypto;

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  summary text,
  release_date date,
  rating numeric(3,1),
  cover_url text,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.platforms (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  vendor text,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.game_tags (
  game_id uuid not null,
  tag_id uuid not null,
  created_at timestamptz not null default now(),
  constraint game_tags_pk primary key (game_id, tag_id),
  constraint game_tags_game_fk foreign key (game_id) references public.games(id) on delete cascade,
  constraint game_tags_tag_fk foreign key (tag_id) references public.tags(id) on delete cascade
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  excerpt text,
  content_md text,
  content_html text,
  canonical_url text,
  source_article_hash text,
  ai_model text,
  quality_score numeric(4,3),
  published_at timestamptz not null default now(),
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_status_check check (status in ('draft', 'published', 'archived'))
);

create table if not exists public.sources (
  id text primary key,
  name text not null,
  base_url text,
  rss_url text not null,
  language text not null,
  trust_score integer not null default 50,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.article_sources (
  article_id uuid not null,
  source_id text not null,
  source_url text,
  external_id text,
  fetched_at timestamptz not null default now(),
  constraint article_sources_pk primary key (article_id, source_id),
  constraint article_sources_article_fk foreign key (article_id) references public.articles(id) on delete cascade,
  constraint article_sources_source_fk foreign key (source_id) references public.sources(id) on delete cascade
);

create table if not exists public.seo_pages (
  id uuid primary key default gen_random_uuid(),
  page_type text not null,
  slug_path text not null,
  title text not null,
  meta_description text,
  og_image_url text,
  canonical_url text,
  schema_json jsonb,
  payload_json jsonb,
  status text not null default 'published',
  last_generated_at timestamptz not null default now(),
  next_revalidate_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
