# Plano de Implementacao por Tarefas

## Regras de execucao (TDD estrito)

1. Escrever testes primeiro.
2. Executar e confirmar falha.
3. Implementar o minimo para passar.
4. Executar suite novamente.
5. Refatorar sem quebrar testes.

## Fase 1 - Fundacao do monorepo

- [ ] TSK-001 Criar workspace TypeScript com scripts padrao
- [ ] TSK-002 Configurar Vitest e convencoes de testes
- [ ] TSK-003 Configurar CI inicial (lint, typecheck, test)
- [ ] TSK-004 Definir guias de contribuicao e padrao de branches

## Fase 2 - Banco de dados (Supabase)

- [ ] TSK-010 Definir contratos de schema em testes (`packages/database/tests/schema.spec.ts`)
- [ ] TSK-011 Criar migrations das tabelas principais
- [ ] TSK-012 Criar testes de indexes e constraints
- [ ] TSK-013 Criar seeds e fixtures para ambiente local
- [ ] TSK-014 Adicionar testes de regressao de query performance

## Fase 3 - Ingestao de noticias

- [ ] TSK-020 Criar testes de descoberta de fontes (RSS/API)
- [ ] TSK-021 Implementar discovery service
- [ ] TSK-022 Criar testes de extracao e normalizacao
- [ ] TSK-023 Implementar parser de conteudo por adaptador
- [ ] TSK-024 Criar testes de deduplicacao
- [ ] TSK-025 Implementar hash + similaridade semantica

## Fase 4 - Pipeline de IA

- [ ] TSK-030 Criar testes de contrato de prompts
- [ ] TSK-031 Implementar templates de prompts e validadores
- [ ] TSK-032 Criar testes de qualidade (unicidade, factualidade, tamanho)
- [ ] TSK-033 Implementar orquestrador de geracao
- [ ] TSK-034 Integrar persistencia de conteudo aprovado

## Fase 5 - SEO programatico

- [ ] TSK-040 Criar testes de slug generation
- [ ] TSK-041 Implementar geracao de slugs canonicos
- [ ] TSK-042 Criar testes de metadata por template
- [ ] TSK-043 Implementar metadata builder (title, description, OG)
- [ ] TSK-044 Criar testes de schema.org
- [ ] TSK-045 Implementar schema composer e breadcrumbs
- [ ] TSK-046 Criar testes de sitemap chunking
- [ ] TSK-047 Implementar sitemap generator

## Fase 6 - Aplicacao Web (Next.js)

- [ ] TSK-050 Criar testes de rotas dinamicas
- [ ] TSK-051 Implementar paginas App Router (`news`, `games`, `best`, `games-like`, `hardware`)
- [ ] TSK-052 Criar testes de metadados renderizados
- [ ] TSK-053 Implementar SSG/ISR e revalidacao por tag
- [ ] TSK-054 Criar testes de API interna (`revalidate`, `health`)
- [ ] TSK-055 Implementar endpoints internos

## Fase 7 - Infra AWS (CloudFormation)

- [ ] TSK-060 Criar testes de contrato dos templates CloudFormation
- [ ] TSK-061 Implementar EventBridge schedules
- [ ] TSK-062 Implementar SQS + DLQ + politicas de retry
- [ ] TSK-063 Implementar workers de ingestao/IA/SEO/sitemap
- [ ] TSK-064 Implementar alarmes e monitoramento

## Fase 8 - Qualidade final e escala

- [ ] TSK-070 Criar suite E2E Playwright (SEO smoke)
- [ ] TSK-071 Implementar medicao de Lighthouse no pipeline
- [ ] TSK-072 Hardening para 50k+ paginas
- [ ] TSK-073 Otimizacoes para 1M+ visitantes/mês

## Primeiros testes ja criados neste ciclo

- `packages/database/tests/schema.spec.ts`
- `packages/seo/tests/slug.spec.ts`
- `packages/seo/tests/metadata.spec.ts`
