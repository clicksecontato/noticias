# Planejamento: Enriquecimento com IA para cadastro automático de entidades

## 1. Situação atual

- **Enriquecimento hoje:** O módulo `packages/database/src/enrichment.ts` expõe `extractEntityIdsFromText(title, description, catalog)`, que faz **apenas match por texto** (substring) contra o **catálogo já existente** (games, tags, genres, platforms).
- **Limitação:** Só são vinculadas entidades que **já existem** na base. Novos jogos, tags, gêneros ou plataformas mencionados no título/resumo **não** são criados nem vinculados, exigindo cadastro manual no admin.
- **Onde é usado:** 
  - Na ingestão de notícias RSS (`saveIngestedNewsItems` em `content-repository.ts`): após persistir o artigo, chama `extractEntityIdsFromText` + `linkArticleToEntities`.
  - Na ingestão de vídeos YouTube: mesmo fluxo com `extractEntityIdsFromText` + `linkYoutubeVideoToEntities`.
  - No backfill de enriquecimento (`/api/admin/enrichment-backfill`): reaplica o mesmo match em artigos/vídeos já existentes.

## 2. Objetivo

- **Analisar** o conteúdo (título + resumo) com uma **API de IA gratuita** para **extrair sugestões** de: jogos, tags, gêneros e plataformas.
- **Para cada entidade sugerida:**
  - Se **já existir** na base (match por nome/slug): usar o id existente e vincular.
  - Se **não existir**: **criar** a entidade (insert) e **vincular** em seguida.
- Reduzir intervenção manual no admin e manter o catálogo atualizado conforme as notícias ingeridas.

## 3. APIs de IA gratuitas (sugestão)

| Opção | Modelo | Limite free | Uso típico |
|-------|--------|-------------|------------|
| **Google AI Studio (Gemini)** | gemini-1.5-flash / gemini-1.5-pro | 15 req/min, 1500 req/dia (flash) | JSON estruturado, boa em PT-BR |
| **Groq** | llama-3 ou mixtral | 30 req/min, 14.400 req/dia | Respostas rápidas, JSON |
| **Hugging Face Inference** | modelos pequenos (ex: Mistral) | Rate limit por minuto | Gratuito com chave |
| **Ollama (local)** | llama3, mistral | Ilimitado (local) | Sem custo, sem limite; exige instalação |

**Recomendação inicial:** **Google AI Studio (Gemini)** ou **Groq**, por terem tier gratuito generoso e boa capacidade de seguir prompt em JSON. Configurável via env (ex.: `ENRICHMENT_AI_PROVIDER=gemini`, `GEMINI_API_KEY=...`).

## 4. Arquitetura proposta

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                  Ingestão (RSS / YouTube)                 │
                    └───────────────────────────┬─────────────────────────────┘
                                                │
                                                ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │ 1. Persistir artigo/vídeo (como hoje)                    │
                    └───────────────────────────┬─────────────────────────────┘
                                                │
                    ┌───────────────────────────▼─────────────────────────────┐
                    │ 2. Enriquecimento (novo pipeline opcional)                │
                    │    • Entrada: title + excerpt/summary (ex.: 500–2000 chars)│
                    │    • Chamar serviço de enriquecimento com IA              │
                    └───────────────────────────┬─────────────────────────────┘
                                                │
                    ┌───────────────────────────▼─────────────────────────────┐
                    │ 3. Serviço de enriquecimento com IA                        │
                    │    • Prompt: "Extraia jogos, tags, gêneros, plataformas   │
                    │      deste texto; retorne JSON com listas de nomes."      │
                    │    • Resposta: { games: [], tags: [], genres: [],         │
                    │                 platforms: [] }                           │
                    └───────────────────────────┬─────────────────────────────┘
                                                │
                    ┌───────────────────────────▼─────────────────────────────┐
                    │ 4. Resolver ou criar entidades                             │
                    │    • Para cada nome em games/tags/genres/platforms:       │
                    │      - Buscar no catálogo (por nome/slug normalizado)     │
                    │      - Se existe → usar id                                │
                    │      - Se não existe → INSERT (slug gerado do nome) → id  │
                    └───────────────────────────┬─────────────────────────────┘
                                                │
                    ┌───────────────────────────▼─────────────────────────────┐
                    │ 5. Vincular ao artigo/vídeo                               │
                    │    • linkArticleToEntities(articleId, ids)                │
                    │    • ou linkYoutubeVideoToEntities(videoId, ids)          │
                    └─────────────────────────────────────────────────────────┘
```

- O **match atual** (`extractEntityIdsFromText` só com catálogo) pode permanecer como **fallback** quando a IA não estiver configurada ou falhar (ou ser combinado: IA + match por texto para maximizar cobertura).

## 5. Fluxo de dados (resolver ou criar)

- **Entrada da IA:** listas de nomes por tipo, ex.: `{ games: ["Elden Ring", "GTA VI"], tags: ["lançamento"], genres: ["RPG"], platforms: ["PC", "PS5"] }`.
- **Resolução:**
  - Normalizar nome → slug (mesma lógica que hoje: minúsculas, sem acentos, hífens).
  - Buscar em `games` / `tags` / `genres` / `platforms` por `name` ou `slug` (ILIKE ou normalizado).
  - Se encontrar **um** registro → usar `id`.
  - Se **não** encontrar → **INSERT** com `name` e `slug` gerado; usar o `id` retornado.
- **Saída:** `EntityIds` (gameIds, tagIds, genreIds, platformIds) como hoje, passados para `linkArticleToEntities` / `linkYoutubeVideoToEntities`.

## 6. Fases de implementação

### Fase 1 – Infraestrutura e provedor de IA
- [ ] Definir variáveis de ambiente: `ENRICHMENT_AI_PROVIDER` (opcional), `GEMINI_API_KEY` ou `GROQ_API_KEY` (conforme provedor).
- [ ] Criar pacote ou módulo `enrichment-ai` (ex.: `packages/enrichment-ai` ou em `apps/web/src/enrichment-ai`):
  - Interface única: `extractEntitiesFromText(text: string): Promise<{ games: string[]; tags: string[]; genres: string[]; platforms: string[] }>`.
  - Implementação para **um** provedor (ex.: Gemini) com prompt fixo e parsing de JSON.
  - Tratamento de erros e timeout; em caso de falha, retornar listas vazias ou lançar para o chamador decidir (fallback para match sem IA).
- [ ] Testes unitários com resposta mock da IA (JSON válido e inválido).

### Fase 2 – Resolver ou criar entidades
- [ ] Novo método no repositório (ou serviço) que recebe as listas de **nomes** e o **catálogo atual**:
  - Para cada nome em cada categoria: buscar por nome/slug; se não existir, inserir na tabela correspondente (games, tags, genres, platforms) e obter id.
  - Retornar `EntityIds` (ids já existentes + ids recém-criados).
- [ ] Garantir que criação de games use campos obrigatórios (ex.: slug, name; status default); tags/genres/platforms idem (apenas nome e slug se for o caso).
- [ ] Reutilizar regras de slug e unicidade já usadas no admin (ex.: slug único por tabela).

### Fase 3 – Integração na ingestão
- [ ] No fluxo de `saveIngestedNewsItems` (e, se desejado, em vídeos YouTube):
  - Após persistir o artigo, **se** `ENRICHMENT_AI_PROVIDER` (e chave) estiver configurado:
    - Chamar `extractEntitiesFromText(title + excerpt)`.
    - Chamar “resolver ou criar” com as listas retornadas → obter `EntityIds`.
    - Chamar `linkArticleToEntities(articleId, ids)`.
  - **Senão** (ou se a IA falhar): manter comportamento atual (só `extractEntityIdsFromText` com catálogo + `linkArticleToEntities`).
- [ ] Opção: **mesclar** resultados da IA com resultados do match por texto (união de ids) para não perder vínculos que o match atual já encontra.

### Fase 4 – Backfill e admin
- [ ] No endpoint de backfill (`/api/admin/enrichment-backfill`): opção (query param ou body) para usar **apenas IA**, **apenas match texto** ou **ambos** (IA + match).
- [ ] Documentar no admin (ex.: página Enriquecimento) que, com IA configurada, novas entidades podem ser criadas automaticamente na ingestão e no backfill.
- [ ] (Opcional) Log ou contador de quantas entidades foram criadas por execução, para auditoria.

### Fase 5 – Ajustes e segundo provedor (opcional)
- [ ] Ajustar prompt e parsing para reduzir ruído (ex.: jogos que não são jogos, tags genéricas demais).
- [ ] Implementar segundo provedor (ex.: Groq) atrás da mesma interface; escolha por `ENRICHMENT_AI_PROVIDER`.
- [ ] Limites de segurança: máximo de entidades criadas por artigo (ex.: até 5 jogos, 10 tags) para evitar explosão de registros por alucinação da IA.

## 7. Formato do prompt (exemplo – Gemini)

Texto enviado à API (ex.: título + primeiros 500 caracteres do resumo):

```
Analise o texto abaixo (título e resumo de uma notícia de jogos) e extraia entidades. 
Retorne APENAS um JSON válido, sem markdown, no formato:
{"games":["Nome do Jogo 1","..."],"tags":["tag1","..."],"genres":["gênero1","..."],"platforms":["plataforma1","..."]}
Use listas vazias [] para categorias sem itens. Nomes em português quando fizer sentido.
Texto:
---
{TITLE}
---
{RESUMO}
```

- Validação no código: parse JSON; se algum campo não for array de strings, tratar como vazio; limitar tamanho de cada lista (ex.: máx. 10 por categoria) para evitar abuso.

## 8. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| IA retorna entidades erradas ou “inventadas” | Validar contra o texto (ex.: nome deve aparecer ou ser muito próximo no título/resumo); limite de itens por categoria; opção de desligar IA e usar só match texto |
| Rate limit / custo da API | Usar apenas APIs com tier gratuito; fila ou batching na ingestão se necessário; fallback para match sem IA |
| Duplicação de entidades (slug parecido) | Normalização de slug única; buscar por slug antes de criar; considerar “slug similar” (ex.: já existir “gta-6” e IA sugerir “GTA 6”) |
| Lentidão na ingestão | Chamada à IA assíncrona; processar enriquecimento em background (job) ou manter síncrono com timeout curto (ex.: 5 s) e fallback em caso de timeout |

## 9. Critérios de sucesso

- Com API de IA gratuita configurada, ao ingerir uma notícia que menciona um jogo/tag/gênero/plataforma **ainda não cadastrado**, o sistema:
  1. Extrai essa entidade via IA.
  2. Cria o registro na tabela correspondente (games, tags, genres ou platforms).
  3. Vincula a entidade ao artigo (ou vídeo) recém-criado.
- Para entidades **já existentes**, apenas o vínculo é criado (sem duplicar registro).
- Sem configuração de IA (ou em caso de falha), o comportamento atual (match só com catálogo existente) é preservado.

## 10. Próximos passos

1. Escolher o primeiro provedor (ex.: **Gemini** ou **Groq**) e obter chave no tier gratuito.
2. Implementar Fase 1 (cliente IA + `extractEntitiesFromText`).
3. Implementar Fase 2 (resolver ou criar em games/tags/genres/platforms).
4. Integrar na ingestão (Fase 3) com feature flag ou env.
5. Testar com algumas notícias reais e ajustar prompt e limites (Fase 5).
6. Estender ao backfill e documentar no admin (Fase 4).
