# Por que alguns jogos não aparecem no Top Jogos?

## O que aconteceu com Crimson Desert e Slay the Spire II

Eles **não aparecem** no relatório "Top jogos" (nem no roteiro da semana) porque o sistema **só conta jogos que estão no catálogo** e que foram **vinculados** às notícias/vídeos pelo processo de enriquecimento.

### Fluxo em 3 passos

1. **Catálogo de jogos**  
   A tabela `games` é o catálogo: todo jogo que pode ser “reconhecido” nas notícias precisa estar aqui (com `name` e `slug`).

2. **Enriquecimento**  
   Quando um artigo ou vídeo é salvo (ou quando roda o backfill de enriquecimento), o sistema:
   - pega título + resumo/descrição;
   - procura no texto se aparece o **nome** ou **slug** de algum jogo do catálogo;
   - se encontrar, grava um vínculo em `article_games` ou `youtube_video_games`.

3. **Top jogos**  
   O relatório "Top jogos" (e o roteiro da semana) **só usa** esses vínculos: conta quantos artigos e vídeos estão ligados a cada `game_id`.  
   Se um jogo **não está na tabela `games`**, ele nunca é detectado no texto e **nunca ganha vínculos**, então **nunca aparece** no top.

Por isso: mesmo que "Crimson Desert" e "Slay the Spire II" sejam muito falados nas notícias, como **não estavam no catálogo**, não foram vinculados e não entram no Top jogos.

---

## O que fazer para as informações ficarem corretas

### 1. Incluir os jogos no catálogo

É necessário ter o jogo na tabela `games` (com `name` e `slug` usados nas notícias).

- **Opção A – Migration (recomendado)**  
  Foi criada a migration `017_add_crimson_desert_slay_the_spire_2.sql` que insere:
  - Crimson Desert  
  - Slay the Spire II  

  Depois de rodar as migrations no seu banco, esses jogos passam a fazer parte do catálogo.

- **Opção B – Inserir direto no banco**  
  Se não quiser usar migration, pode dar `INSERT` em `games` com `slug` e `name` (e outros campos opcionais). O importante é que o `name` (ou `slug`) seja o mesmo que aparece nas notícias (ex.: "Crimson Desert", "Slay the Spire II").

### 2. Reaplicar o enriquecimento (backfill)

Só adicionar o jogo no catálogo **não** altera os artigos/vídeos que já foram ingeridos. Para **vincular o conteúdo antigo** aos novos jogos:

- Chame o endpoint de backfill de enriquecimento:
  - **POST** `/api/admin/enrichment-backfill`
  - Com autenticação (ex.: header `X-Admin-Token` ou `Authorization: Bearer` com o valor de `ADMIN_INGEST_TOKEN`).

Isso reprocessa todos os artigos e vídeos existentes: onde o título/descrição contiver "Crimson Desert" ou "Slay the Spire II", o sistema criará os vínculos e eles passarão a entrar no Top jogos.

**Resumo:**  
1) Rodar a migration (ou inserir os jogos em `games`).  
2) Rodar o backfill de enriquecimento.  
A partir daí, os dados do Top jogos (e do roteiro da semana) ficam alinhados com o que é mais falado.

---

## Preciso verificar manualmente?

- **Incluir jogos novos:** hoje o jeito é **manual** (migration ou SQL). Não existe tela/API no sistema para cadastrar jogos; você (ou alguém do time) adiciona no catálogo quando um jogo passa a ser relevante nas notícias.
- **Verificar se um jogo está no catálogo:** pode conferir direto na tabela `games` (por nome ou slug).
- **Verificar vínculos:** pode consultar `article_games` e `youtube_video_games` para ver quais artigos/vídeos estão ligados a um `game_id`.

Sugestão de processo:
- De tempos em tempos (ex.: semanalmente ou quando um jogo estoura na mídia), adicionar ao catálogo os jogos que estão em muitas notícias mas ainda não estão em `games`.
- Depois rodar o backfill uma vez para atualizar os vínculos do conteúdo já ingerido.

---

## Match no enriquecimento

O enriquecimento usa **substring** no texto normalizado (minúsculas, sem acentos):  
se no catálogo estiver `name = "Crimson Desert"` e `slug = "crimson-desert"`, qualquer título ou descrição que contenha "Crimson Desert" ou "crimson desert" será vinculado a esse jogo.  
Por isso é importante que o `name` (e, se possível, o `slug`) no catálogo coincida com o que as fontes usam nas notícias (evitar grafias muito diferentes).
