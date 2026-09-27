export interface ChatGptCodeExample {
  input: string;
  output: string;
}

export interface ChatGptCode {
  n: number;
  code: string;
  does: string;
  use: string;
  example: ChatGptCodeExample;
}

const CODES: Omit<ChatGptCode, "example">[] = [
  {
    n: 1,
    code: "/rewrite",
    does: "Reescreve o conteúdo.",
    use: "Cole o texto e envie /rewrite. O ChatGPT devolve outra redação com o mesmo sentido, útil para variar a abertura de um vídeo ou de um post.",
  },
  {
    n: 2,
    code: "/proofread",
    does: "Revisa ortografia e gramática.",
    use: "Cole o texto e envie /proofread. A resposta corrige ortografia, concordância e pontuação sem mudar o que você quis dizer.",
  },
  {
    n: 3,
    code: "/formalize",
    does: "Deixa o texto mais formal.",
    use: "Cole um rascunho solto e envie /formalize. O tom fica mais sóbrio, bom para e-mail, proposta ou legenda institucional.",
  },
  {
    n: 4,
    code: "/casual",
    does: "Deixa o texto mais informal.",
    use: "Cole um texto duro e envie /casual. As frases ficam mais curtas e próximas da fala, para roteiro ou legenda de rede.",
  },
  {
    n: 5,
    code: "/shorten",
    does: "Encurta o conteúdo.",
    use: "Cole o texto, diga o tamanho desejado e envie /shorten. Saem as repetições e fica o essencial.",
  },
  {
    n: 6,
    code: "/hook",
    does: "Cria um gancho forte.",
    use: "Descreva o assunto e envie /hook. Você recebe frases de abertura para os primeiros segundos do vídeo ou a primeira linha do post.",
  },
  {
    n: 7,
    code: "/storytelling",
    does: "Transforma em uma história.",
    use: "Cole os fatos e envie /storytelling. O material vira narrativa com começo, conflito e desfecho.",
  },
  {
    n: 8,
    code: "/caption",
    does: "Cria legenda para redes sociais.",
    use: "Diga a rede e cole o tema ou o roteiro. Envie /caption para receber uma legenda curta, pronta para publicar.",
  },
  {
    n: 9,
    code: "/headline",
    does: "Gera títulos chamativos.",
    use: "Resuma o conteúdo e envie /headline. Peça várias opções e escolha o título do vídeo, do artigo ou do e-mail.",
  },
  {
    n: 10,
    code: "/cta",
    does: "Cria chamadas para ação.",
    use: "Diga o que a pessoa deve fazer em seguida e envie /cta. A resposta é uma frase final: comentar, assistir, testar ou se inscrever.",
  },
  {
    n: 11,
    code: "/script",
    does: "Transforma em roteiro.",
    use: "Cole as notas da pauta e envie /script. O texto vira fala, com abertura, desenvolvimento e fechamento.",
  },
  {
    n: 12,
    code: "/reels",
    does: "Cria roteiro curto para Reels.",
    use: "Descreva a ideia em uma frase e envie /reels. Sai um roteiro de até um minuto, com gancho logo no início.",
  },
  {
    n: 13,
    code: "/carousel",
    does: "Estrutura para carrossel.",
    use: "Cole o tema e envie /carousel. A resposta separa capa, slides e fechamento, um card por bloco.",
  },
  {
    n: 14,
    code: "/newsletter",
    does: "Transforma em newsletter.",
    use: "Cole os pontos da semana e envie /newsletter. Você recebe assunto, abertura e um pedido ou link no final.",
  },
  {
    n: 15,
    code: "/blog",
    does: "Cria artigo para blog.",
    use: "Junte as notas e envie /blog. O texto ganha título, subtítulos e conclusão, no formato de artigo.",
  },
  {
    n: 16,
    code: "/keywords",
    does: "Sugere palavras-chave.",
    use: "Descreva o tema e envie /keywords. Use os termos no título, na descrição e na pauta, no vocabulário de quem busca.",
  },
  {
    n: 17,
    code: "/hashtags",
    does: "Gera hashtags relevantes.",
    use: "Cole a legenda ou o tema e envie /hashtags. As tags ficam ligadas ao assunto, sem uma lista genérica.",
  },
  {
    n: 18,
    code: "/persona",
    does: "Cria uma persona.",
    use: "Descreva quem você quer alcançar e envie /persona. A resposta traz rotina, dúvida, objeção e o que faria essa pessoa clicar.",
  },
  {
    n: 19,
    code: "/audience",
    does: "Analisa o público-alvo.",
    use: "Explique o canal ou o produto e envie /audience. Você vê quem assiste, o que essa pessoa já sabe e o que ainda trava.",
  },
  {
    n: 20,
    code: "/positioning",
    does: "Desenvolve posicionamento.",
    use: "Diga o que o canal faz e envie /positioning. A resposta define para quem é, o que promete e o que não é.",
  },
  {
    n: 21,
    code: "/branding",
    does: "Traz ideias para a marca.",
    use: "Descreva a marca e envie /branding. Saem sugestões de nome, tom de voz e referências visuais.",
  },
  {
    n: 22,
    code: "/offer",
    does: "Estrutura uma oferta.",
    use: "Descreva o que você entrega e envie /offer. A oferta fica clara: para quem é, o que inclui e por que agora.",
  },
  {
    n: 23,
    code: "/sales",
    does: "Transforma em argumento de venda.",
    use: "Cole o benefício e envie /sales. O texto vira problema, prova e pedido, na ordem em que se vende.",
  },
  {
    n: 24,
    code: "/pitch",
    does: "Cria um pitch convincente.",
    use: "Resuma a ideia em poucas linhas e envie /pitch. Você recebe uma apresentação curta do episódio, do produto ou do projeto.",
  },
  {
    n: 25,
    code: "/negotiation",
    does: "Sugere argumentos de negociação.",
    use: "Descreva os dois lados e o que você quer e envie /negotiation. A resposta traz argumentos, concessões e uma proposta de acordo.",
  },
  {
    n: 26,
    code: "/objections",
    does: "Lista objeções e respostas.",
    use: "Descreva a oferta ou o tema e envie /objections. Cada objeção vem com uma resposta curta para usar no vídeo ou na conversa.",
  },
  {
    n: 27,
    code: "/swot",
    does: "Faz uma análise SWOT.",
    use: "Descreva o canal, o produto ou o tema e envie /swot. A resposta separa forças, fraquezas, oportunidades e ameaças.",
  },
  {
    n: 28,
    code: "/competitors",
    does: "Analisa concorrentes.",
    use: "Liste quem mais fala do mesmo assunto e envie /competitors. Você vê o que coincide e onde ainda há espaço.",
  },
  {
    n: 29,
    code: "/mind-map",
    does: "Cria um mapa mental.",
    use: "Diga o tema central e envie /mind-map. Os subtemas saem em ramos, prontos para virar pauta ou quadro.",
  },
  {
    n: 30,
    code: "/stick-notes",
    does: "Organiza ideias como post-its.",
    use: "Despeje as ideias soltas e envie /stick-notes. Cada bloco fica curto, para você reordenar depois.",
  },
  {
    n: 31,
    code: "/flowchart",
    does: "Cria um fluxograma de processo.",
    use: "Descreva o processo e envie /flowchart. Os passos aparecem em sequência, com decisão de sim ou não quando fizer sentido.",
  },
  {
    n: 32,
    code: "/concept-map",
    does: "Monta um mapa de conceitos conectados.",
    use: "Liste os conceitos e envie /concept-map. A resposta mostra como um leva ao outro, em vez de uma lista solta.",
  },
  {
    n: 33,
    code: "/tree",
    does: "Estrutura hierarquia em árvore.",
    use: "Diga o tema e envie /tree. O conteúdo desce em grupos e itens, do geral para o específico.",
  },
  {
    n: 34,
    code: "/roadmap",
    does: "Organiza um plano em etapas.",
    use: "Descreva o objetivo e envie /roadmap. O plano sai em fases, com o que acontece em cada uma.",
  },
  {
    n: 35,
    code: "/actionplan",
    does: "Transforma objetivo em ação.",
    use: "Escreva o objetivo e envie /actionplan. Você recebe ações concretas, em ordem, prontas para executar.",
  },
  {
    n: 36,
    code: "/checklist",
    does: "Transforma em checklist.",
    use: "Descreva a tarefa e envie /checklist. A lista serve para gravar, publicar ou revisar sem pular passo.",
  },
  {
    n: 37,
    code: "/timeline",
    does: "Organiza em ordem do tempo.",
    use: "Cole os fatos ou as tarefas e envie /timeline. Tudo fica em ordem cronológica, do mais antigo ao mais recente, ou o contrário se você pedir.",
  },
  {
    n: 38,
    code: "/prioritize",
    does: "Ordena por prioridade.",
    use: "Cole a lista e diga o critério. Envie /prioritize para ver o que fazer primeiro e por quê.",
  },
  {
    n: 39,
    code: "/proscons",
    does: "Lista vantagens e desvantagens.",
    use: "Descreva a decisão e envie /proscons. Prós e contras ficam lado a lado, para escolher com o quadro na frente.",
  },
  {
    n: 40,
    code: "/examples",
    does: "Gera exemplos práticos.",
    use: "Explique o conceito e o contexto e envie /examples. Os exemplos saem concretos, no assunto que você está ensinando.",
  },
  {
    n: 41,
    code: "/analogy",
    does: "Explica com analogia.",
    use: "Diga o conceito difícil e envie /analogy. A comparação usa algo que o público já conhece.",
  },
  {
    n: 42,
    code: "/stepbystep",
    does: "Explica passo a passo.",
    use: "Descreva o que a pessoa quer conseguir e envie /stepbystep. Os passos vêm numerados, um de cada vez, até o resultado.",
  },
  {
    n: 43,
    code: "/quiz",
    does: "Cria perguntas para teste.",
    use: "Cole a explicação e envie /quiz. As perguntas servem para checar se o conteúdo ficou claro, no vídeo ou no material.",
  },
  {
    n: 44,
    code: "/flashcards",
    does: "Cria cartões de estudo.",
    use: "Cole o tema e envie /flashcards. Cada cartão tem a pergunta na frente e a resposta no verso.",
  },
  {
    n: 45,
    code: "/studyplan",
    does: "Monta um plano de estudo.",
    use: "Diga o tema e quanto tempo você tem. Envie /studyplan para receber a sequência em dias ou sessões.",
  },
  {
    n: 46,
    code: "/questions",
    does: "Gera perguntas relevantes.",
    use: "Descreva o assunto e envie /questions. As perguntas são as que o público faria, e viram pauta ou bloco de comentários.",
  },
  {
    n: 47,
    code: "/faq",
    does: "Cria perguntas frequentes.",
    use: "Descreva o produto, o canal ou o tema e envie /faq. Cada pergunta vem com uma resposta curta.",
  },
  {
    n: 48,
    code: "/meeting",
    does: "Estrutura pauta de reunião.",
    use: "Diga o objetivo do encontro e envie /meeting. A pauta traz tópicos e o que precisa ser decidido.",
  },
  {
    n: 49,
    code: "/prompt",
    does: "Transforma ideia em prompt.",
    use: "Escreva a ideia em bruto e envie /prompt. O resultado é um prompt completo: papel, contexto, tarefa e formato da resposta.",
  },
  {
    n: 50,
    code: "/imageprompt",
    does: "Transforma ideia em prompt de imagem.",
    use: "Descreva a cena e envie /imageprompt. O prompt traz sujeito, estilo, luz e enquadramento para gerar a imagem.",
  },
];

const EXAMPLES: Record<string, ChatGptCodeExample> = {
  "/rewrite": {
    input: "A OpenAI lançou um modelo novo que escreve código mais rápido.\n/rewrite",
    output: "Chegou um modelo da OpenAI que programa em menos tempo.",
  },
  "/proofread": {
    input: "O modelo novo escreve codigo mais rapido e com menos erro.\n/proofread",
    output: "O modelo novo escreve código mais rápido e com menos erro.",
  },
  "/formalize": {
    input: "Cara, esse modelo ficou bom demais pra programar.\n/formalize",
    output: "Este modelo apresentou um desempenho elevado na geração de código.",
  },
  "/casual": {
    input: "O lançamento representa um avanço significativo na geração de código.\n/casual",
    output: "Olha, esse lançamento deixa a geração de código bem mais forte.",
  },
  "/shorten": {
    input:
      "A empresa anunciou hoje um modelo que escreve código, explica o que fez e ainda revisa o próprio resultado antes de entregar.\n/shorten",
    output: "Novo modelo escreve código, explica e revisa o próprio resultado.",
  },
  "/hook": {
    input: "Vídeo sobre um modelo que revisa o próprio código.\n/hook",
    output: "E se o modelo corrigisse o próprio código antes de você ver o erro?",
  },
  "/storytelling": {
    input:
      "Um dev passou a noite debugando. De manhã, testou um modelo que achou o bug em um minuto.\n/storytelling",
    output:
      "Era quase de manhã quando o teste rodou. O bug que tinha custado a noite apareceu em um minuto — e a tela finalmente ficou verde.",
  },
  "/caption": {
    input: "Instagram. Vídeo sobre um modelo que revisa o próprio código.\n/caption",
    output: "O modelo achou o bug antes de você. Quer ver o teste? O link está nos comentários.",
  },
  "/headline": {
    input: "Modelo novo escreve e revisa código sozinho.\n/headline",
    output: "O modelo que revisa o próprio código\nEle escreve. Depois ele mesmo confere.\nMenos bug, menos madrugada.",
  },
  "/cta": {
    input: "No fim do vídeo, quero que a pessoa comente o bug que mais perde tempo.\n/cta",
    output: "Comenta aqui o bug que mais te faz perder tempo. Eu leio e trago no próximo.",
  },
  "/script": {
    input: "Pauta: modelo que revisa o próprio código. Mostrar o antes e o depois.\n/script",
    output:
      "Abertura: você já perdeu a noite num bug de uma linha?\nMeio: olha o antes. Agora o modelo revisa e devolve o depois.\nFecho: o tempo que sobra é seu. Comenta o bug que mais te trava.",
  },
  "/reels": {
    input: "Modelo que acha o bug sozinho.\n/reels",
    output:
      "0s: Para. Esse bug não precisava da sua noite.\n5s: O modelo revisa o próprio código.\n20s: Antes. Depois.\n30s: Comenta o bug que eu testo no próximo.",
  },
  "/carousel": {
    input: "Carrossel: como um modelo revisa o próprio código.\n/carousel",
    output:
      "Capa: Ele revisa o próprio código\n2: Você pede a função\n3: Ele escreve\n4: Ele mesmo confere\n5: Você recebe o depois\nFecha: Salva para testar hoje",
  },
  "/newsletter": {
    input: "Novidade da semana: modelo que escreve e revisa código.\n/newsletter",
    output:
      "Assunto: O modelo que revisa o próprio código\n\nEsta semana apareceu um modelo que escreve a função e confere o resultado antes de entregar. O ganho é menos ida e volta no debug.\n\nSe quiser o passo a passo, responda este e-mail.",
  },
  "/blog": {
    input: "Notas: modelo gera código, explica a mudança e roda uma revisão antes de responder.\n/blog",
    output:
      "Título: O que muda quando o modelo revisa o próprio código\n\nO ciclo antigo era pedir, copiar e caçar o erro. Agora o modelo escreve, explica a mudança e revisa antes de entregar.\n\nVocê ainda decide o que entra no projeto. Só chega menos cedo no bug óbvio.",
  },
  "/keywords": {
    input: "Tema: modelos que geram e revisam código.\n/keywords",
    output: "geração de código com IA\nrevisão automática de código\nmodelo que corrige bug\nassistente de programação",
  },
  "/hashtags": {
    input: "Legenda sobre modelo que revisa código.\n/hashtags",
    output: "#InteligenciaArtificial\n#GeracaoDeCodigo\n#Programacao\n#Dev",
  },
  "/persona": {
    input: "Quem assiste: dev que usa IA no trabalho e perde tempo revisando o que o modelo gera.\n/persona",
    output:
      "Camila, 32, dev pleno.\nRotina: pede código na IA e gasta a tarde conferindo.\nDúvida: dá para confiar na revisão do próprio modelo?\nClique: um antes e depois com o bug real.",
  },
  "/audience": {
    input: "Canal de IA para quem constrói produto e grava conteúdo.\n/audience",
    output:
      "Assiste quem já usa modelo no dia a dia.\nJá sabe pedir um texto. Ainda trava em confiar no resultado e em transformar a novidade em vídeo claro.",
  },
  "/positioning": {
    input: "Canal que explica novidade de IA com o que dá para usar na prática.\n/positioning",
    output:
      "Para quem produz com IA.\nPromete: o que mudou e como usar nesta semana.\nNão é tutorial genérico nem hype de versão.",
  },
  "/branding": {
    input: "Marca de um canal de IA prático, em português, tom direto.\n/branding",
    output:
      "Tom: direto, mostra a tela, admite o limite.\nVisual: fundo escuro, uma cor de destaque, print grande do antes e do depois.",
  },
  "/offer": {
    input: "Aula gravada: como revisar o código que o modelo entrega, em 40 minutos.\n/offer",
    output:
      "Para quem já pede código à IA e ainda caça bug na mão.\nInclui roteiro de revisão, checklist e um exemplo comentado.\nO modelo já escreve. O gargalo passou a ser a conferência.",
  },
  "/sales": {
    input: "A aula mostra como revisar o código que o modelo gera, em menos tempo.\n/sales",
    output:
      "Você pede o código e ainda perde a tarde no bug.\nNa aula, a revisão vira um roteiro curto, com o antes e o depois na tela.\nSe o gargalo é conferir, começa por aqui.",
  },
  "/pitch": {
    input: "Episódio: um modelo que revisa o próprio código. 8 minutos.\n/pitch",
    output:
      "Em 8 minutos: o bug que custava a noite, o modelo revisando a própria resposta, e o que ainda fica com você.",
  },
  "/negotiation": {
    input: "Quero gravar a aula por R$ 4 mil. O cliente ofereceu R$ 2,5 mil e um prazo de 10 dias.\n/negotiation",
    output:
      "O valor cabe se o escopo ficar na aula de 40 minutos, sem edição extra.\nConcessão: entregar em 10 dias.\nProposta: R$ 3,5 mil, com uma rodada de revisão.",
  },
  "/objections": {
    input: "Aula sobre revisar código gerado por IA.\n/objections",
    output:
      "Já sei usar o ChatGPT. — Saber pedir é uma etapa. A aula é a conferência do que volta.\nVai errar mesmo assim. — Por isso a decisão continua com você.",
  },
  "/swot": {
    input: "Canal de IA prática, em português, com poucos vídeos longos.\n/swot",
    output:
      "Forças: tema quente e demonstração na tela.\nFraquezas: pouco arquivo e ritmo irregular.\nOportunidades: quem busca o uso, não o anúncio.\nAmeaças: canal grande cobre o lançamento no mesmo dia.",
  },
  "/competitors": {
    input: "Canais que noticiam lançamento de modelo no dia, sem mostrar o uso.\n/competitors",
    output:
      "Eles ganham na velocidade do anúncio.\nCoincidem no tema e não mostram o antes e o depois.\nEspaço: o vídeo curto do que mudou na prática.",
  },
  "/mind-map": {
    input: "Tema: revisar código gerado por IA.\n/mind-map",
    output:
      "Revisar código\n— Pedido: contexto, limite, exemplo\n— Resposta: função, explicação, teste\n— Decisão: aceitar, pedir de novo, escrever na mão",
  },
  "/stick-notes": {
    input: "Ideias: gancho do bug, print do antes, print do depois, objeção da alucinação, CTA do comentário.\n/stick-notes",
    output: "Bug que comeu a noite\nPrint do antes\nPrint do depois\nE se alucinar?\nComenta o seu bug",
  },
  "/flowchart": {
    input: "Processo: peço o código, leio, testo, e decido se aceito ou peço de novo.\n/flowchart",
    output: "Pedir o código → Ler a explicação → Rodar o teste\nPassou? Sim → Aceitar\nNão → Pedir de novo, com o erro colado",
  },
  "/concept-map": {
    input: "Conceitos: prompt, modelo, revisão, teste, decisão.\n/concept-map",
    output:
      "O prompt orienta o modelo.\nO modelo devolve código e explicação.\nA revisão usa o teste.\nO teste sustenta a decisão de aceitar ou pedir de novo.",
  },
  "/tree": {
    input: "Tema: conteúdo de IA da semana.\n/tree",
    output: "Semana\n— Vídeo longo\n—— Gancho\n—— Demo\n—— Fecho\n— Corte curto\n—— 30 segundos\n—— Legenda",
  },
  "/roadmap": {
    input: "Objetivo: publicar uma série de 4 vídeos sobre revisar código gerado por IA.\n/roadmap",
    output:
      "Fase 1: escolher os 4 bugs reais\nFase 2: gravar a demo de cada um\nFase 3: cortar e legendar\nFase 4: publicar um por semana",
  },
  "/actionplan": {
    input: "Objetivo: gravar amanhã o vídeo do modelo que revisa o próprio código.\n/actionplan",
    output:
      "1. Separar o bug de exemplo hoje\n2. Gravar a tela do antes e do depois\n3. Narrar o gancho em uma tomada\n4. Exportar e escrever a descrição",
  },
  "/checklist": {
    input: "Publicar um vídeo de IA no YouTube.\n/checklist",
    output:
      "[ ] Título com a mudança prática\n[ ] Demo do antes e do depois\n[ ] Descrição com o que foi testado\n[ ] Legenda revisada\n[ ] Comentário fixado com a pergunta",
  },
  "/timeline": {
    input: "2023: peço texto. 2024: peço código. 2025: o modelo revisa a própria resposta.\n/timeline",
    output: "2023 — O uso era gerar texto\n2024 — O pedido passou a ser código\n2025 — A resposta já vem com uma revisão",
  },
  "/prioritize": {
    input: "Tarefas: legenda, demo, título, corte, descrição. Critério: o que trava a publicação.\n/prioritize",
    output: "1. Demo — sem ela não há vídeo\n2. Título — define o clique\n3. Corte — segura o meio\n4. Descrição\n5. Legenda",
  },
  "/proscons": {
    input: "Deixar o modelo revisar o próprio código antes de eu ler.\n/proscons",
    output:
      "Vantagens: menos erro óbvio e menos texto para conferir.\nDesvantagens: a revisão também erra, e a resposta demora mais.",
  },
  "/examples": {
    input: "Conceito: revisão do próprio código. Contexto: uma função que soma uma lista.\n/examples",
    output:
      "Pedido: some a lista e revise.\nResposta: a função trata lista vazia e ignora item que não é número.\nUso: você cola os dois testes e vê o que a revisão pegou.",
  },
  "/analogy": {
    input: "Explique revisão do próprio código para quem não programa.\n/analogy",
    output:
      "É como reler o e-mail antes de enviar. O modelo escreve e, em seguida, passa o corretor nele mesmo. Você ainda decide se manda.",
  },
  "/stepbystep": {
    input: "Quero revisar uma função que o modelo acabou de gerar.\n/stepbystep",
    output:
      "1. Cole a função e o que ela deveria fazer\n2. Peça os casos que quebram\n3. Rode o primeiro que falhar\n4. Cole o erro e peça o ajuste\n5. Aceite só quando o caso passar",
  },
  "/quiz": {
    input:
      "Explicação: o modelo pode revisar o próprio código e ainda assim errar. A decisão continua com quem pediu.\n/quiz",
    output:
      "1. A revisão automática elimina o erro?\nNão.\n2. Quem decide se o código entra?\nQuem pediu.\n3. O teste falhou. E agora?\nColar o erro e pedir o ajuste.",
  },
  "/flashcards": {
    input: "Tema: revisão de código gerado por IA.\n/flashcards",
    output:
      "Frente: O modelo revisou. Posso colar direto?\nVerso: Não. A revisão reduz erro óbvio. O teste ainda é seu.",
  },
  "/studyplan": {
    input: "Tema: revisar código gerado por IA. Tenho 4 sessões de 30 minutos.\n/studyplan",
    output:
      "Sessão 1: o que pedir junto com o código\nSessão 2: o teste feliz e o que quebra\nSessão 3: colar o erro e pedir o ajuste\nSessão 4: decidir o que entra no projeto",
  },
  "/questions": {
    input: "Assunto: modelo que revisa o próprio código.\n/questions",
    output:
      "Ele pega erro de lógica ou só de sintaxe?\nA revisão deixa a resposta mais lenta?\nO que ainda preciso testar na mão?",
  },
  "/faq": {
    input: "Canal que mostra IA na prática, sem curso.\n/faq",
    output:
      "Preciso saber programar? Ajuda, mas o vídeo mostra a tela.\nTem curso? Não. É o uso da semana.\nPosso copiar o código? Pode testar. A decisão de usar é sua.",
  },
  "/meeting": {
    input: "Encontro de 25 minutos para fechar a pauta dos próximos 4 vídeos.\n/meeting",
    output:
      "Objetivo: escolher os 4 temas\n1. O que já está gravado\n2. O que a semana trouxe de novo\n3. Qual demo cabe em um vídeo\nDecisão: a ordem de publicação",
  },
  "/prompt": {
    input: "Quero um roteiro curto sobre o modelo que revisa o próprio código.\n/prompt",
    output:
      "Você é editor de um canal de IA prática. Com as notas abaixo, escreva um roteiro de 8 minutos, falado, com gancho, demo do antes e depois, e uma pergunta final.",
  },
  "/imageprompt": {
    input: "Capa: uma tela de código com um erro em vermelho e, ao lado, a mesma tela já corrigida.\n/imageprompt",
    output:
      "Duas janelas de editor lado a lado, fundo escuro, luz de monitor. À esquerda, uma linha em vermelho. À direita, a mesma linha em verde. Sem texto legível, enquadramento frontal.",
  },
};

/** Os 50 códigos do cartaz, com o que cada um faz, como usar e um exemplo de chat. */
export const CHATGPT_CODES: ChatGptCode[] = CODES.map((item) => ({
  ...item,
  example: EXAMPLES[item.code],
}));
