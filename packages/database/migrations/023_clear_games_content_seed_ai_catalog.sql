-- 023_clear_games_content_seed_ai_catalog.sql
-- Fase 2: limpa conteúdo/catálogo de games, remove fontes antigas e semeia catálogo + fontes de IA (pt-BR).

-- ---------------------------------------------------------------------------
-- 1) Limpar vínculos e conteúdo editorial
-- ---------------------------------------------------------------------------
truncate table public.report_results cascade;
truncate table public.reports cascade;

do $$
begin
  if to_regclass('public.youtube_short_publish_jobs') is not null then
    execute 'truncate table public.youtube_short_publish_jobs cascade';
  end if;
end $$;

truncate table public.article_subjects, public.article_types, public.article_tags, public.article_sources,
               public.youtube_video_subjects, public.youtube_video_types, public.youtube_video_tags,
               public.articles, public.youtube_videos,
               public.subject_tags, public.subjects, public.types, public.tags
  cascade;

delete from public.seo_pages
where page_type in ('subject', 'subjects-like', 'related', 'best', 'best-type', 'game', 'genre', 'hardware')
   or slug_path like '/games%'
   or slug_path like '/subjects%'
   or slug_path like '/best%'
   or slug_path like '/hardware%';

-- ---------------------------------------------------------------------------
-- 2) Remover fontes legadas
-- (artigos/vídeos já truncados; DELETE evita conflito em sources_base_url_unique
--  quando o id novo difere do id antigo com o mesmo base_url)
-- ---------------------------------------------------------------------------
delete from public.sources;

-- ---------------------------------------------------------------------------
-- 3) Catálogo inicial de IA (tipos, tags, assuntos)
-- ---------------------------------------------------------------------------
insert into public.types (slug, name, description)
values
  ('llm', 'LLM', 'Modelos de linguagem de grande escala.'),
  ('agentes', 'Agentes', 'Agentes autônomos e orquestração de ferramentas.'),
  ('multimodal', 'Multimodal', 'Modelos que combinam texto, imagem, áudio e vídeo.'),
  ('regulacao', 'Regulação', 'Políticas, leis e governança de IA.'),
  ('infraestrutura', 'Infraestrutura', 'Chips, nuvem, treinamento e serving.'),
  ('produtividade', 'Produtividade', 'Ferramentas de IA no trabalho e no dia a dia.'),
  ('seguranca', 'Segurança', 'Safety, alinhamento, privacidade e abuso.'),
  ('open-source', 'Open source', 'Modelos e stacks abertos de IA.')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description;

insert into public.tags (slug, name)
values
  ('chatgpt', 'ChatGPT'),
  ('claude', 'Claude'),
  ('gemini', 'Gemini'),
  ('openai', 'OpenAI'),
  ('anthropic', 'Anthropic'),
  ('google', 'Google'),
  ('meta', 'Meta'),
  ('microsoft', 'Microsoft'),
  ('lancamento', 'Lançamento'),
  ('pesquisa', 'Pesquisa'),
  ('empresas', 'Empresas'),
  ('brasil', 'Brasil'),
  ('api', 'API'),
  ('codigo', 'Código'),
  ('imagem', 'Imagem')
on conflict (slug) do update set name = excluded.name;

insert into public.subjects (slug, name, summary, status)
values
  ('chatgpt', 'ChatGPT', 'Assistente conversacional da OpenAI.', 'published'),
  ('claude', 'Claude', 'Família de modelos da Anthropic.', 'published'),
  ('gemini', 'Gemini', 'Família de modelos de IA do Google.', 'published'),
  ('openai', 'OpenAI', 'Empresa por trás do GPT e do ChatGPT.', 'published'),
  ('anthropic', 'Anthropic', 'Empresa focada em IA segura e Claude.', 'published'),
  ('google-deepmind', 'Google DeepMind', 'Pesquisa e produtos de IA do Google.', 'published'),
  ('copilot', 'Microsoft Copilot', 'Assistente de IA da Microsoft.', 'published'),
  ('midjourney', 'Midjourney', 'Geração de imagens por IA.', 'published')
on conflict (slug) do update set
  name = excluded.name,
  summary = excluded.summary,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- 4) Fontes RSS de tech/IA em português (ativas)
-- ---------------------------------------------------------------------------
insert into public.sources (
  id, name, base_url, rss_url, language, trust_score, is_active, provider, updated_at
)
values
  (
    'canaltech-ia',
    'Canaltech IA',
    'https://canaltech.com.br/inteligencia-artificial',
    'https://canaltech.com.br/rss/inteligencia-artificial/',
    'pt-BR', 80, true, 'rss', now()
  ),
  (
    'tecnoblog',
    'Tecnoblog',
    'https://tecnoblog.net',
    'https://tecnoblog.net/feed/',
    'pt-BR', 80, true, 'rss', now()
  ),
  (
    'tecmundo',
    'TecMundo',
    'https://www.tecmundo.com.br',
    'https://rss.tecmundo.com.br/feed',
    'pt-BR', 75, true, 'rss', now()
  ),
  (
    'olhar-digital',
    'Olhar Digital',
    'https://olhardigital.com.br',
    'https://olhardigital.com.br/feed/',
    'pt-BR', 75, true, 'rss', now()
  ),
  (
    'showmetech',
    'Showmetech',
    'https://www.showmetech.com.br',
    'https://www.showmetech.com.br/feed/',
    'pt-BR', 70, true, 'rss', now()
  ),
  (
    'canaltech',
    'Canaltech',
    'https://canaltech.com.br',
    'https://canaltech.com.br/rss/',
    'pt-BR', 75, true, 'rss', now()
  ),
  (
    'macmagazine',
    'MacMagazine',
    'https://macmagazine.com.br',
    'https://macmagazine.com.br/feed/',
    'pt-BR', 70, true, 'rss', now()
  )
on conflict (id) do update set
  name = excluded.name,
  base_url = excluded.base_url,
  rss_url = excluded.rss_url,
  language = excluded.language,
  trust_score = excluded.trust_score,
  is_active = true,
  provider = 'rss',
  updated_at = now();
