# Plano: Admin com menu lateral e CRUD (tags, jogos, fontes e demais)

Objetivo: aperfeiçoar o admin com **menu lateral à esquerda** (ícones + texto ou só texto), **cadastro e edição** de tags, jogos, fontes, gêneros e plataformas, e **ingestão manual** integrada ao menu. Autenticação via **ADMIN_INGEST_TOKEN** automático no servidor (.env). Código **clean** e **SOLID**.

---

## 1. Estado atual

### 1.1 Estrutura do admin

- **Rotas:** `/admin` (página única), `/admin/login` (Supabase email/senha).
- **Conteúdo:** Uma única página que renderiza `AdminIngestionClient` (ingestão manual + listagem de fontes + formulário “Adicionar fonte” inline).
- **Auth:**
  - **Páginas /admin:** middleware exige usuário Supabase; sem sessão redireciona para `/admin/login`.
  - **APIs /api/admin:** middleware aceita **ou** usuário Supabase **ou** header `X-Admin-Token` / `Authorization: Bearer` igual a `ADMIN_INGEST_TOKEN`.
- **Ingestão:** POST `/api/admin/ingest-news` com `{ token, sourceIds }`. O token é **digitado manualmente** no formulário; a API valida contra `process.env.ADMIN_INGEST_TOKEN`.

### 1.2 Entidades no banco (catálogos)

| Entidade   | Tabela    | Campos principais (identificação/edição)     | Unique      |
|-----------|-----------|-----------------------------------------------|-------------|
| Jogos     | `games`   | id, slug, name, summary, release_date, rating, status, cover_url | slug        |
| Tags      | `tags`    | id, slug, name                                | slug        |
| Gêneros   | `genres`  | id, slug, name, description                   | slug        |
| Plataformas | `platforms` | id, slug, name, vendor                      | slug        |
| Fontes    | `sources` | id (PK texto), name, base_url, rss_url, language, provider, channel_id, is_active, trust_score | id, base_url |

- **games:** usado em relatórios (top jogos), enriquecimento, rotas SEO.
- **tags, genres, platforms:** enriquecimento e filtros; `game_tags` relaciona game ↔ tag.
- **sources:** ingestão RSS/YouTube; já existe GET/POST em `/api/admin/sources` (criação de fonte).

### 1.3 O que já existe na aplicação

- **APIs:** `/api/admin/sources` (GET lista, POST cria), `/api/admin/ingest-news` (POST), `/api/admin/enrichment-backfill` (POST), `/api/admin/sources/resolve-channel` (GET).
- **Repositório:** `content-repository` com leitura de catálogos (getCatalogsForEnrichment, getGames, etc.) e escrita para sources/ingestão; **não** há CRUD genérico para games, tags, genres, platforms (apenas leitura/uso em enriquecimento).
- **UI:** Nenhum layout compartilhado do admin; nenhum menu lateral; ingestão e “adicionar fonte” na mesma tela.

---

## 2. Objetivos e requisitos

- **Menu admin:** lateral **à esquerda**, com **ícones + texto** ou **apenas texto** por item (configurável por item).
- **CRUD:** criar, editar e remover itens de **tags**, **jogos**, **fontes**, **gêneros** e **plataformas** de forma rápida e clara.
- **Ingestão manual:** virar um **item do menu** (ex.: “Ingestão”), sem campo de token no formulário; token admin **automático** vindo do `.env` (`ADMIN_INGEST_TOKEN`) no servidor.
- **Auth:** usuário logado no admin (Supabase) deve poder chamar as APIs sem informar token; o servidor usa sessão ou, em chamadas server-side, pode usar `ADMIN_INGEST_TOKEN` quando aplicável.
- **Clean code e SOLID:** separação clara de responsabilidades (repositórios, use cases, UI), componentes reutilizáveis, interfaces estáveis.

---

## 3. Autenticação e token automático

### 3.1 Regra desejada

- **Token admin:** valor em `ADMIN_INGEST_TOKEN` (.env) é **somente servidor**; nunca expor no cliente.
- **Fluxo na ingestão (e demais ações admin):**
  - **Opção A (recomendada):** Na área admin, o usuário já está autenticado (Supabase). As chamadas a `/api/admin/*` partem do browser com cookies de sessão. O **middleware** já considera “autorizado” se houver `user` OU token válido. Assim, **não é necessário** enviar token no body/header nas chamadas feitas a partir do admin UI.
  - **Opção B:** Para chamadas que hoje exigem token (ex.: ingestão), o **Next.js** pode enviar o token **apenas no servidor**: por exemplo, uma **Server Action** que lê `process.env.ADMIN_INGEST_TOKEN` e chama um endpoint interno ou a mesma API passando o token no header. O cliente nunca vê o token.

Recomendação: **Opção A** para o admin UI (tudo via sessão Supabase). Manter suporte a **Opção B** para scripts/ferramentas externas que chamem a API com `X-Admin-Token` ou `Authorization: Bearer` usando `ADMIN_INGEST_TOKEN`.

### 3.2 Ajustes concretos

1. **Ingestão:** Alterar `handleAdminIngestRequest` (ou o route handler) para aceitar **também** requisição considerada “admin autenticado por sessão”. Por exemplo: o middleware já anexa ou valida o user; o route de ingestão pode verificar “se request veio com sessão admin válida, não exige token no body”. Assim, o **frontend** deixa de ter o campo “Token Admin” e envia apenas `{ sourceIds }`.
2. **Demais APIs admin:** Manter consistência: sessão Supabase **ou** header com token; não exigir token no body para uso pelo painel.
3. **Documentar:** “Token admin é automático no servidor (.env). No painel, o login Supabase basta; para integrações externas, usar header com ADMIN_INGEST_TOKEN.”

---

## 4. Layout e menu lateral

### 4.1 Estrutura de rotas proposta

- `/admin` — redireciona para `/admin/dashboard` ou primeira seção (ex.: Ingestão).
- `/admin/layout.tsx` — layout com **menu lateral esquerdo** + área de conteúdo (`children`).
- Itens de menu (podendo exibir **ícone + nome** ou **só nome**):
  - **Dashboard** (opcional): resumo (contagens, último ingest, etc.).
  - **Ingestão** — ingestão manual (conteúdo atual de `AdminIngestionClient`, sem campo token).
  - **Fontes** — listagem + CRUD de fontes (sources).
  - **Jogos** — listagem + CRUD de jogos (games).
  - **Tags** — listagem + CRUD de tags.
  - **Gêneros** — listagem + CRUD de gêneros.
  - **Plataformas** — listagem + CRUD de plataformas.
  - **Enriquecimento** — botão “Rodar backfill” (chama POST enrichment-backfill); opcional agrupar com Ingestão.

Menu: array de configuração, por exemplo `{ path, label, icon?, showLabel?: boolean }` para permitir “só ícone” ou “ícone + texto”.

### 4.2 Componentes de layout

- **AdminLayout:** lê sessão (Supabase), redireciona para login se não autenticado; renderiza sidebar + main.
- **AdminSidebar:** navegação lateral; itens com Link; ícones (ex.: lucide-react) e texto condicional.
- **Conteúdo:** `{children}` em uma área scrollável à direita da sidebar.

Sidebar pode ser colapsável (só ícones) com `showLabel: false` ou estado local; persistir preferência em localStorage se desejado.

---

## 5. Arquitetura (SOLID e clean code)

### 5.1 Camadas

- **API (Route Handlers):** apenas validação de auth, parsing de body/query e delegação para “serviços” ou “use cases”.
- **Serviços / Use cases:** regras de negócio (ex.: “criar jogo com slug único”, “não remover fonte se houver artigos”). Chamam repositórios.
- **Repositórios:** acesso a dados (Supabase). Uma interface por entidade ou um “CatalogRepository” com métodos por tabela (games, tags, genres, platforms, sources). Manter **content-repository** para fluxos existentes (ingestão, enriquecimento) e estender ou criar **admin-repository** / **catalog-repository** para CRUD explícito.
- **UI:** componentes de listagem (tabela ou cards), formulários (criar/editar), confirmação de exclusão. Reutilizar onde fizer sentido (ex.: mesmo componente de “slug + name” para tags e gêneros).

### 5.2 Princípios

- **SRP:** Cada módulo com uma responsabilidade (ex.: repositório só persiste; serviço aplica regras).
- **OCP:** Novas entidades (ex.: “temas”) = novos itens de menu + novos métodos no repositório/serviço, sem alterar lógica dos outros.
- **DIP:** Rotas e serviços dependem de interfaces (ex.: `IGamesRepository`), não da implementação Supabase direta.
- **Interfaces estáveis:** Contratos de repositório (list, getById, create, update, delete) com DTOs claros.

### 5.3 Estrutura de pastas proposta (apps/web)

```
app/admin/
  layout.tsx                 # Layout com sidebar + auth check
  page.tsx                   # Redirect para /admin/ingestao ou dashboard
  login/
    page.tsx                 # Mantém login Supabase
  components/
    AdminSidebar.tsx         # Menu lateral (ícones + texto ou só texto)
    AdminHeader.tsx          # (opcional) Barra superior com usuário e sair
  ingestao/
    page.tsx                 # Ingestão manual (ex-AdminIngestionClient, sem token)
  fontes/
    page.tsx                 # Listagem + ações CRUD
    [id]/
      page.tsx               # Editar fonte (ou modal/drawer na listagem)
  jogos/
    page.tsx
    [id]/page.tsx            # ou novo/ e [id]/ para criar/editar
  tags/
    page.tsx
    [id]/page.tsx
  generos/
    page.tsx
    [id]/page.tsx
  plataformas/
    page.tsx
    [id]/page.tsx
  enriquecimento/            # (opcional) ou dentro de ingestao
    page.tsx                 # Botão backfill
```

Serviços/repositórios podem ficar em:

- `src/admin/` ou `src/app-admin/`:
  - `repositories/catalog-repository.ts` (ou games-repository, tags-repository, etc.)
  - `services/games-service.ts`, `tags-service.ts`, …
  - `types.ts` (DTOs compartilhados)

Ou manter repositórios em `packages/database` e criar apenas “admin services” em `apps/web/src` que usam esses repositórios.

---

## 6. CRUD por entidade

### 6.1 Contratos comuns (exemplo)

- **List:** `GET /api/admin/{entity}?page=1&pageSize=20&q=opcional`
- **Get by id:** `GET /api/admin/{entity}/[id]`
- **Create:** `POST /api/admin/{entity}` body: { slug, name, … }
- **Update:** `PATCH /api/admin/{entity}/[id]` body: campos a alterar
- **Delete:** `DELETE /api/admin/{entity}/[id]` (com validação: ex. não remover tag em uso se houver constraint; ou soft delete se aplicável)

Cada entidade com seus campos obrigatórios e validações (slug único, name obrigatório, etc.).

### 6.2 Fontes (sources)

- **Já existe:** GET e POST em `/api/admin/sources`. Falta: PATCH (editar), DELETE (se desejado), e GET por id para tela de edição.
- **Edição:** Permitir alterar name, base_url, rss_url, language, is_active, trust_score, provider, channel_id (com cuidado em provider youtube: manter resolução de channel_id se necessário).
- **Remoção:** Decidir se permite deletar fonte (e cascata em article_sources / youtube_videos) ou apenas desativar (`is_active = false`).

### 6.3 Jogos (games)

- Campos: slug, name, summary, release_date, rating, status, cover_url.
- Slug único; name obrigatório. Create/Update com validação de slug (e se slug mudar, considerar impacto em rotas SEO).
- Delete: pode haver FKs (article_games, game_tags); cascade já existe em game_tags; article_games deve ter on delete cascade para não bloquear.

### 6.4 Tags, Gêneros, Plataformas

- Estrutura simples: slug, name (e description para gêneros, vendor para plataformas).
- CRUD completo; delete só se não houver vínculos ou com regra clara (ex.: impedir ou cascade).

---

## 7. UI: listagem e formulários

- **Listagem:** Tabela com colunas relevantes (nome, slug, status, etc.) + ações “Editar” e “Excluir”. Paginação e busca (q) quando fizer sentido.
- **Criar/Editar:** Formulário em página dedicada (`/admin/jogos/novo`, `/admin/jogos/[id]`) ou em **drawer/modal** na mesma página de listagem (mais rápido). Preferência: **página dedicada** para manter URLs claras e compartilháveis; drawer como alternativa em segunda fase.
- **Excluir:** Confirmação (dialog) antes de DELETE; mensagem de sucesso ou erro.
- **Componentes reutilizáveis:** Input slug (derivado de name ou editável), DataTable com colunas configuráveis, FormCard, ConfirmDeleteDialog.
- **Ícones:** Usar biblioteca única (ex.: lucide-react) em todo o menu e botões.

---

## 8. Fases de implementação sugeridas

### Fase 1 — Base do admin (layout + auth + ingestão)

1. Criar `admin/layout.tsx` com sidebar (menu lateral esquerdo, ícones + texto).
2. Configurar itens de menu (Ingestão, Fontes, Jogos, Tags, Gêneros, Plataformas, Enriquecimento).
3. Ajustar ingestão: remover campo “Token Admin” do frontend; no backend, aceitar requisição autenticada por sessão Supabase como válida para ingestão (token automático no servidor para scripts externos continua via header).
4. Mover conteúdo atual de ingestão para `admin/ingestao/page.tsx`; `/admin` redireciona para `/admin/ingestao` (ou dashboard).

### Fase 2 — CRUD Fontes

1. Endpoints: PATCH `/api/admin/sources/[id]`, DELETE (ou desativar), GET por id se necessário.
2. Página `admin/fontes`: listagem (tabela) + botão “Nova fonte” + editar/excluir por linha.
3. Página ou drawer “Editar fonte” com campos existentes + provider, channel_id, etc.

### Fase 3 — CRUD Jogos, Tags, Gêneros, Plataformas

1. Criar repositório (ou estender content-repository) com métodos list, getById, create, update, delete para cada entidade.
2. APIs: `GET/POST /api/admin/games`, `GET/PATCH/DELETE /api/admin/games/[id]` (e análogo para tags, genres, platforms).
3. Páginas: listagem + criar/editar (formulário com slug, name e campos específicos); confirmação de exclusão.
4. Validações: slug único, nomes obrigatórios; ao deletar, tratar FKs (mensagem clara ou cascade).

### Fase 4 — Refino e Enriquecimento

1. Página ou seção “Enriquecimento”: botão “Rodar backfill” chamando POST `/api/admin/enrichment-backfill` (auth por sessão ou token header).
2. Ajustes de UX: loading states, toasts de sucesso/erro, sidebar colapsável (só ícones) se desejado.
3. Documentação: atualizar README ou doc do admin com “Token admin é automático no servidor; uso do painel após login Supabase”.

---

## 9. Checklist de token automático

- [ ] Remover campo “Token Admin” do formulário de ingestão no admin.
- [ ] No handler de ingestão: considerar autorizado se (sessão Supabase válida **ou** header X-Admin-Token/Authorization com ADMIN_INGEST_TOKEN). Não exigir token no body quando sessão for válida.
- [ ] Documentar que `ADMIN_INGEST_TOKEN` no .env é usado automaticamente no servidor; para chamadas do painel, basta login Supabase; para scripts externos, enviar token no header.
- [ ] Aplicar mesma regra de auth (sessão ou token) em todas as rotas `/api/admin/*` que forem usadas pelo painel (fontes, jogos, tags, etc.).

---

## 10. Resumo

- **Menu:** lateral esquerdo, ícones + texto (ou só texto por configuração).
- **CRUD:** tags, jogos, fontes, gêneros, plataformas (listagem, criar, editar, remover).
- **Ingestão:** item do menu; token automático no servidor (.env); usuário não digita token.
- **Auth:** sessão Supabase no painel; APIs aceitam sessão ou header com ADMIN_INGEST_TOKEN.
- **Código:** camadas (API → serviço → repositório), interfaces estáveis, componentes reutilizáveis (SOLID e clean code).
- **Implementação:** em fases (layout + ingestão → fontes → jogos/tags/gêneros/plataformas → enriquecimento e refino).

Este plano pode ser usado como guia para implementação incremental do admin.
