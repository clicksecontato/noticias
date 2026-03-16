# Plano de Relatórios – Mundo dos Games (BR)

Objetivo: estruturar relatórios úteis para **empresas e profissionais** que queiram entender o que está sendo publicado sobre games pelos principais canais e portais do Brasil (RSS + YouTube), com dados persistidos na base para consulta e histórico.

---

## 1. Ideias de relatórios (valor para o mercado)

| Relatório | Descrição | Valor para empresas/profissionais |
|-----------|-----------|-----------------------------------|
| **Volume por período** | Total de artigos e vídeos por dia/semana/mês, com opção de filtrar por fonte ou por tipo (RSS vs YouTube). | Ver tendência de produção de conteúdo, planejar campanhas e parcerias. |
| **Ranking de fontes** | Ordenação das fontes por quantidade de publicações no período (artigos + vídeos ou separado). | Identificar canais/portais mais ativos; benchmarking. |
| **Atividade por dia da semana** | Distribuição de publicações por dia da semana (seg–dom). | Saber quando há mais conteúdo; timing de releases. |
| **Resumo executivo (snapshot)** | Um “dashboard” fixo: totais dos últimos 7, 30 e 90 dias (artigos, vídeos, por provider, top 5 fontes). | Visão rápida sem rodar vários relatórios. |
| **Comparativo RSS vs YouTube** | Contagem e percentual por tipo de mídia no período. | Entender peso de texto vs vídeo no ecossistema. |
| **Linha do tempo (timeline)** | Série temporal: publicações por dia ou semana em um intervalo. | Gráficos de tendência; picos de cobertura. |
| **Conteúdo por fonte (detalhado)** | Por fonte: total de itens, primeiros e últimos publicados, exemplo de títulos. | Perfil de cada canal/portal para curadoria ou parceria. |
| **Top jogos por período** | Ranking de jogos por quantidade de notícias/vídeos no período (com variação vs período anterior). | Entender quais jogos dominam a pauta e como a “curva de hype” evolui. |
| **Tags/temas em alta** | Ranking de tags/temas mais mencionados, com comparação entre períodos e por tipo de mídia (RSS vs YouTube). | Mapear macrotemas (ex.: “remake”, “microtransações”, “indie brasileiro”) relevantes para criadores e marcas. |
| **RSS vs YouTube (profundo)** | Além de totais, breakdown por jogo, tag, gênero e fonte, com foco em onde a conversa está acontecendo (texto x vídeo). | Guiar estratégia de presença (publicar artigo, vídeo ou ambos) e parcerias com criadores. |
| **Padrões de publicação (dia/hora)** | Heatmaps de dia da semana x horário, com volume de publicações. | Definir melhores janelas de publicação de conteúdo profissional. |
| **Especial BR / jogos brasileiros** | Recorte de todos os relatórios focado apenas em jogos brasileiros e/ou fontes PT-BR. | Mostrar a “temperatura” do mercado local de desenvolvimento e cobertura. |

**Futuro (com mais dados ou NLP):**

- **Temas/jogos mais citados** – extração de entidades (nomes de jogos, estúdios) ou palavras-chave nos títulos/descrições.
- **Sentimento ou categorização** – classificação automática (notícia, review, trailer, etc.).
- **Clusters de temas** – agrupar tags/jogos em “assuntos” (ex.: polêmicas de preço, lançamentos, eSports) para análises macro.

---

## 2. Estrutura na base de dados

### 2.1 Tabela `reports`

Guarda o **metadado** de cada relatório gerado (tipo, período, quando foi gerado, status).

| Coluna | Tipo | Descrição |
|--------|------|------------|
| `id` | uuid | PK, default gen_random_uuid() |
| `report_type` | text | Tipo: `volume`, `top_sources`, `activity_by_weekday`, `executive_summary`, `rss_vs_youtube`, `timeline`, `by_source_detail` |
| `period_start` | timestamptz | Início do período analisado |
| `period_end` | timestamptz | Fim do período analisado |
| `parameters` | jsonb | Opções (ex.: `group_by: 'day'|'week'|'month'`, `limit_sources: 10`) |
| `status` | text | `pending`, `completed`, `failed` |
| `error_message` | text | Preenchido se `status = failed` |
| `generated_at` | timestamptz | Quando o relatório foi gerado (conclusão) |
| `created_at` | timestamptz | default now() |

- Índices: `report_type`, `(report_type, period_start, period_end)`, `status`, `created_at`.
- Constraint: `report_type` em lista conhecida; `status` em `pending`/`completed`/`failed`.

### 2.2 Tabela `report_results`

Guarda o **resultado** de cada relatório em JSON, para flexibilidade entre tipos diferentes.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | PK |
| `report_id` | uuid | FK → reports(id) ON DELETE CASCADE |
| `payload` | jsonb | Estrutura do resultado (definida por report_type) |
| `created_at` | timestamptz | default now() |

- Um registro por relatório (1:1 com `reports`).
- Índice em `report_id` (único).

**Exemplos de `payload` por tipo:**

- **volume**: `{ "group_by": "day", "series": [ {"date": "2025-03-01", "articles": 12, "videos": 5 }, ... ], "totals": { "articles": 120, "videos": 45 } }`
- **top_sources**: `{ "items": [ {"source_id": "...", "source_name": "...", "articles": 10, "videos": 0, "total": 10 }, ... ] }`
- **executive_summary**: `{ "last_7_days": { "articles": 50, "videos": 15 }, "last_30_days": { ... }, "last_90_days": { ... }, "top_sources": [ ... ] }`
- **rss_vs_youtube**: `{ "articles": 100, "videos": 30, "percentages": { "rss": 77, "youtube": 23 } }`
- **timeline**: `{ "series": [ {"date": "2025-03-01", "count": 17 }, ... ] }`
- **activity_by_weekday**: `{ "weekday": [ {"day": 0, "label": "Dom", "count": 5 }, ... ] }` (0=Dom, 6=Sab)
- **by_source_detail**: `{ "sources": [ { "source_id", "source_name", "provider", "total", "first_published_at", "last_published_at", "sample_titles": [...] }, ... ] }`

---

## 3. API de relatórios

Base: **`/api/reports`** (ou prefixo escolhido, ex. `/api/admin/reports` se for área restrita).

### 3.1 Gerar e persistir relatório

- **POST /api/reports/generate**  
  - Body: `{ "reportType": "volume" | "top_sources" | ... , "periodStart": "ISO8601", "periodEnd": "ISO8601", "options": { ... } }`  
  - Comportamento:  
    1. Valida tipo e datas.  
    2. Insere em `reports` com `status = pending`.  
    3. Executa o gerador do relatório (lendo de `articles`, `youtube_videos`, `sources`).  
    4. Insere em `report_results` o `payload` e atualiza `reports` para `status = completed` e `generated_at`; em erro, `status = failed` e `error_message`.  
  - Resposta: `201` + corpo com `reportId`, `status`, `periodStart`, `periodEnd` (e opcionalmente o payload se quiser devolver na criação).

### 3.2 Listar relatórios

- **GET /api/reports**  
  - Query: `type`, `status`, `from`, `to`, `page`, `pageSize`.  
  - Retorna lista de registros de `reports` (sem o payload), com paginação.

### 3.3 Obter um relatório (com resultado)

- **GET /api/reports/[id]**  
  - Retorna o registro em `reports` + o `payload` de `report_results` (se existir).  
  - 404 se não existir.

### 3.4 Último relatório por tipo (opcional)

- **GET /api/reports/latest?type=volume**  
  - Retorna o relatório mais recente (`generated_at` ou `created_at`) daquele tipo com `status = completed`.  
  - Evita regenerar sempre que o cliente só quer “o último volume”.

### 3.5 Autenticação

- Definir se a API é pública (somente leitura?) ou restrita (ex.: mesmo token do admin de ingestão para POST).  
- Sugestão: **GET** públicos (list + get + latest); **POST /generate** protegido por token ou role.

---

## 4. Plano de implementação (fases)

### Fase 1 – Base e um relatório piloto

1. **Migration**  
   - Criar tabelas `reports` e `report_results` conforme acima.  
2. **Repositório**  
   - No pacote `database`: métodos para criar/atualizar `reports`, inserir/ler `report_results`, e leitura bruta de dados para relatórios (ex.: artigos e vídeos por intervalo de datas, agregados por source).  
3. **Geradores**  
   - Um módulo (ex.: `packages/reports` ou `apps/web/src/reports`) com funções puras que recebem dados já carregados e retornam o objeto do `payload`.  
   - Implementar primeiro **Volume por período** (agrupado por dia ou semana) e **Top fontes** (ranking por total no período).  
4. **API**  
   - POST `/api/reports/generate` e GET `/api/reports` + GET `/api/reports/[id]`.  
   - Persistir resultado em `report_results` e atualizar `reports`.

### Fase 2 – Mais tipos e consultas

5. Implementar **Resumo executivo**, **RSS vs YouTube**, **Timeline** e **Atividade por dia da semana**.  
6. GET **/api/reports/latest?type=...**.  
7. Filtros e paginação em GET `/api/reports`.

### Fase 3 – Uso e otimização

8. **Frontend** (admin ou área “Relatórios”): escolher tipo, período, gerar e visualizar (tabelas/gráficos).  
9. **Agendamento** (opcional): job (cron/edge) que gera semanalmente relatórios padrão (ex.: volume da semana, resumo executivo) e os persiste.  
10. **Export** (opcional): endpoint ou botão para exportar payload em CSV/JSON para análise externa.

---

## 5. Resumo

- **Relatórios sugeridos:** volume por período, ranking de fontes, atividade por dia da semana, resumo executivo, RSS vs YouTube, timeline, detalhe por fonte.  
- **Base de dados:** `reports` (metadado + status) + `report_results` (payload JSON por relatório).  
- **API:** POST para gerar e salvar, GET para listar e obter por id (e opcionalmente latest por tipo).  
- **Implementação:** em fases: schema + repositório + geradores + API (primeiro 2 tipos), depois demais tipos e endpoints, por fim UI e agendamento/export se fizer sentido.

Com isso, empresas e profissionais passam a ter relatórios estáveis, armazenados e consultáveis na base, alinhados ao que está sendo publicado sobre games nos principais canais do Brasil.
