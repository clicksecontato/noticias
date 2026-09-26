# Pautas para o YouTube a partir do Conhecimento Ampliado

O **Conhecimento Ampliado** reúne notícias e vídeos, organiza o acervo por assunto, tipo, tag e fonte, e oferece radar de pauta, mapa temático e resumos de 7, 30 e 90 dias. Esses dados podem orientar vídeos que ajudem o público a entender e aplicar inteligência artificial.

## Formatos de conteúdo

| Formato | Pergunta que o vídeo responde | O que buscar na base |
|---|---|---|
| **Radar semanal** | O que aconteceu na IA esta semana que vale entender? | Pautas marcadas, novidades e fontes distintas. |
| **Novidade na prática** | O que consigo fazer com esse recurso? | Anúncio, demonstrações e limitações documentadas. |
| **Vale a pena usar?** | Para quem essa ferramenta resolve um problema? | Vídeos, artigos e casos sobre o mesmo produto. |
| **Entenda o assunto** | O que são agentes de IA, em termos simples? | Assuntos recorrentes e dúvidas que pedem explicação. |
| **Além do anúncio** | O que mudou de verdade depois do lançamento? | Registros do mesmo tema ao longo de 30 ou 90 dias. |
| **Perspectivas diferentes** | Onde as fontes concordam ou divergem? | Notícias e vídeos de fontes diferentes sobre um tema. |
| **IA no Brasil** | Como essa mudança afeta quem usa IA aqui? | Itens com recorte brasileiro e disponibilidade local. |
| **Mapa do mês** | Quais temas cresceram e quais perderam força? | Apresentação mensal, mapa temático e evolução por período. |

Uma programação semanal pode partir de **uma novidade demonstrável, uma dúvida recorrente para ensinar e uma mudança que precise de contexto**. *Agentes*, *ChatGPT* e *Prompting* são exemplos de temas citados no roteiro do sistema; a prioridade real depende dos registros da base.

## Prompt para analisar o projeto e a base de dados

Use este prompt no ambiente que tenha acesso ao repositório e ao banco do Conhecimento Ampliado:

```text
Atue como pesquisador e estrategista editorial do meu canal brasileiro de YouTube sobre inteligência artificial.

Você está no projeto Conhecimento Ampliado. Analise os registros reais do banco de dados para descobrir quais assuntos do meu acervo podem virar vídeos úteis e interessantes para o público. Faça apenas leituras: não altere dados, configurações ou estrutura do banco.

Comece identificando o esquema efetivo e as relações entre notícias/artigos, vídeos do YouTube, assuntos, tipos, tags, fontes e marcações de pauta. Use os nomes reais dos campos encontrados; não presuma que o roteiro do projeto corresponde exatamente à implementação atual.

Analise os últimos 7 dias no horário de Brasília e compare com os períodos anteriores de 30 e 90 dias. Considere:
- assuntos que aparecem em várias fontes independentes;
- novidades com aplicação prática que eu possa demonstrar;
- dúvidas ou conceitos recorrentes que merecem uma explicação;
- mudanças na cobertura de um tema ao longo do tempo;
- divergências entre notícias, vídeos e anúncios originais;
- assuntos relevantes para usuários brasileiros;
- pautas já marcadas no sistema.

Agrupe registros duplicados e diferencie volume de publicação de interesse real do público. Se o banco não guardar visualizações, comentários ou outros indicadores de audiência, não invente esses números nem afirme que um assunto está viralizando.

Entregue de 8 a 12 sugestões de vídeo, ordenadas por oportunidade editorial. Para cada uma, informe:
1. Assunto e proposta central do vídeo.
2. Por que um espectador se interessaria por ele agora.
3. O aprendizado ou resultado prático que o espectador levará.
4. Registros que sustentam a sugestão: título, data, fonte, link e identificador no banco.
5. O que é fato confirmado, o que é interpretação e o que ainda precisa ser testado.
6. Formato recomendado: Short, vídeo completo ou ambos.
7. Título sugerido, ideia de thumbnail e demonstração que posso gravar.
8. Nota editorial de 0 a 10, explicada por relevância, utilidade, novidade e força das evidências. Trate a nota como estimativa, não como previsão de viralização.

Ao final, selecione as 3 melhores pautas para esta semana. Organize a ordem de publicação e escreva para cada uma uma abertura de até 15 segundos. Indique também quais registros preciso ler ou testar antes de gravar.

Se não conseguir acessar o banco, não simule resultados: informe exatamente o acesso ou a exportação necessária para fazer a análise.
```

## Escopo das sugestões

Os formatos acima foram elaborados a partir do roteiro `roteiro-conhecimento-ampliado.md`, que descreve o sistema e suas funcionalidades. Eles ainda não representam uma análise dos registros do banco de dados. A escolha dos assuntos da semana depende dessa consulta.
