-- 018_add_articles_is_news.sql
-- Rode este SQL no Supabase (SQL Editor) para adicionar a coluna is_news.
-- Flag para excluir da listagem pública e dos relatórios itens que não são notícias (ex.: gameplays, off-topic).
-- true = considerar como notícia (exibir e contabilizar); false = não exibir nem contabilizar.
-- Registros existentes recebem is_news = true por padrão.

alter table public.articles
  add column if not exists is_news boolean not null default true;

comment on column public.articles.is_news is 'Quando true, o artigo é exibido no site e contabilizado nos relatórios. Quando false, é tratado como não-notícia (ex.: gameplay, assunto off-topic).';
