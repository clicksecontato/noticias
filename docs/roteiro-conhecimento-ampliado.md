# Roteiro — Conhecimento Ampliado

Guia do projeto sob o objetivo principal: **reunir informações sobre um ou mais assuntos** e, com o acervo e as features, **ampliar o conhecimento** sobre eles — para aprender, ensinar e criar conteúdo (ex.: vídeos e pautas).

> Ferramenta **pessoal** de uso local (operador). Não é um portal público multi-usuário. O hub operacional é `/admin`.

---

## 1. Objetivo em uma frase

**Agregar → organizar → compreender (relatórios) → criar/compartilhar**, sempre em torno de **assuntos** (hoje com foco em inteligência artificial).

| Etapa | O que faz | Por que amplia conhecimento |
|-------|-----------|------------------------------|
| Agregar | Traz notícias (RSS) e vídeos (YouTube) | Mais matéria-prima, menos caça manual |
| Organizar | Assuntos, tipos, tags, fontes, pauta | O acervo fica pesquisável e comparável |
| Relatar | Relatórios e apresentação do mês | Padrões, lacunas e ângulos para estudar |
| Criar | Pauta, roteiros, shorts, previews | Transforma o agregado em conteúdo próprio |

Nome do produto na UI: **Conhecimento Ampliado**.

---

## 2. Glossário (o “mapa mental” do acervo)

| PT (UI) | EN (código/DB) | Papel |
|---------|----------------|--------|
| **Assunto** | `subject` | Tema principal (“sobre o quê”). Entidade editorial central. |
| **Tipo** | `type` | Categoria taxômica estável e larga (prateleira). |
| **Tag** | `tag` | Etiqueta livre e granular (produto, empresa, ângulo). |
| **Fonte** | `source` | Origem: feed RSS ou canal YouTube. |
| **Notícia** | `news` / `article` | Conteúdo textual ingerido. |
| **Vídeo** | `youtube_video` | Conteúdo de canal YouTube. |

**Como se encaixam:** um vídeo ou notícia pode ter vários assuntos, tipos e tags. A fonte diz *de onde veio*; o assunto diz *sobre o quê estudar*.

---

## 3. Fluxo operacional recomendado

```text
Fontes → Atualizar Fontes (ingestão)
       → Notícias / Vídeos (revisar, pauta)
       → Catálogo + Enriquecimento (vincular)
       → Relatórios / Apresentação do mês (aprender)
       → Previews (/news, /videos) ou criação (roteiro, shorts)
```

1. Cadastre e mantenha **fontes** (RSS e YouTube).
2. Rode **Atualizar Fontes** para puxar conteúdo novo.
3. Revise **notícias** e **vídeos**; marque o que entra na **pauta**.
4. Mantenha o **catálogo** e rode **enriquecimento** para vincular entidades.
5. Gere **relatórios** para ver volume, fontes, assuntos e radar de pauta.
6. Use previews e criação de conteúdo para **ampliar e compartilhar** o que aprendeu.

---

## 4. Features por área do admin

### 4.1 Hub (`/admin`)

Painel inicial: saúde das fontes, atalhos e visão rápida do pipeline.

**Relação com o objetivo:** ponto de partida diário — “o que preciso atualizar e onde há lacunas”.

---

### 4.2 Operação

#### Atualizar Fontes (`/admin/ingestao`)

Dispara ingestão das fontes selecionadas (RSS e/ou YouTube). Mostra o que foi criado, pulado ou falhou.

**Relação com o objetivo:** é o motor que **alimenta** o acervo sem o operador visitar cada site/canal.

#### Fontes (`/admin/fontes`)

Cadastro de origens (RSS / canal YouTube), avatars de canais, ativação e edição.

**Relação com o objetivo:** define *de onde* o conhecimento entra. Boas fontes = melhor cobertura do assunto.

#### API YouTube (`/admin/youtube-api`)

Uso estimado de cota da YouTube Data API (métodos, unidades, limite diário, eventos).

**Relação com o objetivo:** permite agregar vídeo com previsibilidade — sem “estourar” a API sem perceber.

---

### 4.3 Conteúdo

#### Notícias (`/admin/noticias`)

Lista, edita e filtra artigos (fonte, datas, pauta, sem assunto). Alterna se entra na pauta editorial.

**Relação com o objetivo:** transforma o feed bruto em **acervo editorial** útil para estudo e roteiro.

#### Vídeos (`/admin/videos`)

Mesmo papel para vídeos YouTube: filtros, pauta, vínculos com catálogo.

**Relação com o objetivo:** o vídeo costuma ser a ponte entre “o que o mercado fala” e “o que você ensina”.

Preview público do operador: `/videos` (filtros por canal múltiplo e período).

---

### 4.4 Catálogo

#### Assuntos (`/admin/assuntos`)

Temas principais do domínio (ex.: ChatGPT, Agentes, Brasil).

#### Tipos (`/admin/tipos`)

Prateleiras estáveis (ex.: LLM, Infraestrutura, Regulação).

#### Tags (`/admin/tags`)

Marcadores finos (ex.: OpenAI, Lançamento, Prompting).

#### Enriquecimento (`/admin/enriquecimento`)

Backfill: reaplica vínculos de artigos/vídeos com o catálogo atual (regras + IA, conforme implementação).

**Relação com o objetivo:** sem catálogo e vínculos, o acervo é só uma lista cronológica. Com eles, você **cruza**, **compara** e **descobre padrões** — base do “ampliar conhecimento”.

---

### 4.5 Relatórios e criação

#### Relatórios (`/admin/reports`)

Tipos principais (entre outros):

| Tipo | Para que serve no aprendizado |
|------|-------------------------------|
| Volume por período | Ritmo do acervo no tempo |
| Ranking de fontes | Quem mais publica sobre o tema |
| Por tags / top assuntos | Onde a conversa se concentra |
| Atividade por dia da semana | Cadência de publicação |
| Detalhe por fonte | Zoom em um canal/site |
| Radar de pauta | O que merece virar conteúdo |
| Mapa temático | Visão de clusters de tema |
| Resumo executivo | Visão 7 / 30 / 90 dias |
| Apresentação mensal | Narrativa do mês para ensinar/compartilhar |

#### Apresentação do Mês (`/admin/month-presentation`)

Leitura rica do relatório mensal (mix de fontes, cadência, relevância, etc.), com filtros.

**Relação com o objetivo:** os relatórios são a camada de **síntese** — transformam volume em insight e pauta.

---

## 5. Previews e utilidades (fora do menu “portal”)

Rotas como `/news`, `/videos`, `/sistema`, `/roteiro` existem como **preview/utilidade do operador**, não como site de audiência.

| Rota | Uso típico |
|------|------------|
| `/news` | Folhear notícias agregadas |
| `/videos` | Explorar vídeos por canal(s) e período |
| `/sistema` | KPIs do pipeline |
| `/roteiro` | Apoio a criação de roteiro a partir do acervo |

---

## 6. Como o monorepo se organiza (visão técnica simples)

| Parte | Papel |
|-------|--------|
| `apps/web` | App Next.js: admin, APIs, previews |
| `packages/database` | Persistência, migrations, repositórios |
| `packages/scraping` | Ingestão RSS / YouTube |
| `packages/seo` | Metadados / estratégias de página (preview) |
| `docs/` | ADRs, planos e este roteiro |
| `.cursor/` | Rules e skills para agentes |

Regra de fronteira: apps podem usar packages; packages não importam apps (`docs/adr/0002-boundaries-and-dependencies.md`).

---

## 7. Roteiro sugerido para “ampliar conhecimento” sobre um assunto

Exemplo: você quer aprofundar **Agentes**.

1. **Garanta cobertura** — fontes que falem do tema; rode ingestão.
2. **Marque o assunto** — confirme “Agentes” no catálogo; vincule notícias/vídeos (enriquecimento + edição).
3. **Separe a pauta** — o que é genérico vs. o que merece estudo/vídeo (`is_news` / pauta).
4. **Leia o agregado** — `/admin/noticias`, `/admin/videos`, `/videos` filtrando canais e período.
5. **Peça o mapa** — relatórios de top assuntos, tags, radar de pauta, apresentação do mês.
6. **Crie a partir disso** — pauta, roteiro, short ou aula, usando o que o sistema já reuniu.

O ciclo se repete: quanto melhor a ingestão e a organização, mais os relatórios e a criação **ampliam** (em vez de só acumular links).

---

## 8. O que este projeto *não* é

- Site público de audiência massiva.
- Rede social ou CMS genérico para vários autores.
- Domínio de games (modelo antigo depreciado; ver ADR 0003).

---

## 9. Referências internas

- Propósito e glossário: `AGENTS.md`, `.cursor/rules/product-purpose.mdc`, `.cursor/rules/domain-glossary.mdc`
- Domínio: `docs/adr/0003-domain-news-youtube.md`
- Boundaries: `docs/adr/0002-boundaries-and-dependencies.md`
- Glossário de tooltips do catálogo: `apps/web/src/admin/catalog-glossary.ts`
