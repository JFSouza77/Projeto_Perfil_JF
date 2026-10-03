# Cérebro do C.A.O.S. (mapa da 1.7.5.1)

O C.A.O.S. é o apresentador do jogo. Ele **nunca** pontua e nunca muda turno nem estado da partida: só comenta.
Este documento mostra as camadas do cérebro dele, onde cada uma está no código e como testar.

## Camadas que decidem como ele está

| Camada | O que é | Onde |
|---|---|---|
| **Temperamento** | Sorteado no começo de cada partida: normal (40%), sensível à demora, generoso, rabugento ou elétrico (15% cada). Mexe no ponto de equilíbrio da tensão e do calor e na paciência. | `CAOS_TEMPERAMENTOS` (js/01) · `caosTemperSortear` (js/07) |
| **Vetor de emoção** | Três números de 0 a 10: tensão, calor e paciência. Acerto baixa a tensão e esquenta. Erro sobe a tensão e esfria. Tudo volta devagar para o equilíbrio do temperamento. | `caosEmo`, `caosEmoNudge`, `caosPacienciaNudge`, `caosEmoMaybeDecay` (js/07) |
| **Estado composto** | Resumo do vetor: calmo observador, em flow, showman nervoso, irritado e seco, apático, no talo, no limite, sem paciência. | `caosEstadoComposto` · `CI_ESTADOS` |
| **Console de emoções** | Dez emoções com teto e decaimento próprios: alegria, tristeza, raiva, medo, nojo, ansiedade, tédio, vergonha, curiosidade e carinho. A que estiver mais alta (acima de 3,8) vira a emoção do momento. Duas altas ao mesmo tempo viram **mistura**, como magoado (raiva com tristeza) ou empolgação nervosa (alegria com ansiedade). | `CAOS_CONSOLE`, `CAOS_CONSOLE_CFG`, `CAOS_CONSOLE_MISTURAS` (js/01) · `caosSentir`, `caosConsoleEvento`, `caosConsoleAvancar` (js/07) |
| **Matriz de humor** | Quatro humores de voz e de fala: frustrado, orgulhoso, entediado e desafiante. Saem do console e do humor contínuo. | `caosHumorMatriz` · `CI_HUMORES` |
| **Escada de rostos** | O rosto não pula de feliz para furioso direto: passa por rostos vizinhos. | `CAOS_EMO_VIZ`, `caosEscada` |
| **Cansaço** | Em algumas partidas ele cansa depois de 60–70 min reais e pode sair da partida depois de 90–105 min. Se a tensão estourar duas vezes, também sai. | `rollCaosFatiguePlan`, `caosMaybeCheckOutFromTension` |
| **Memória** | Fichas por jogador (partidas, vitórias, acertos por categoria, última vez), recordes, rivais, cartas difíceis, nicks e avaliações 👍/👎. Tudo tem teto (veja abaixo). | js/08 (`fichaUpd`, `memGravar`) e js/07 |

## Gerador de falas por gatilho (novo na 1.7.5.1)

Antes, cada gatilho tinha uma lista fixa de falas. A entrada do JF, por exemplo, tinha só 3. Agora cada gatilho pode ter um **gerador**, que monta a fala juntando pedaços conforme o contexto.

- **Motor:** `src/js/07b-gerador-de-falas.js`, função `caosGerarFala(gatilho, jogador, extra)`.
- **Dados:** um arquivo por gatilho em `src/dados/08-geradores/`. As regras de escrita estão no topo de `00-abertura.js`.
- **Contexto que o motor lê sozinho:**
  - hora e dia da semana;
  - modo, formato e quantidade de jogadores;
  - quem está na mesa (JF, Anne, Pedro, Isabel ou outra pessoa);
  - a memória da pessoa: estreia, voltou hoje, faz dias, sumiu, ganhou ou perdeu a última, veterana, vencedora;
  - o humor escolhido;
  - o temperamento e o estado do C.A.O.S.
- **Como evita repetir:**
  - guarda no aparelho os pedaços usados por último em cada gatilho (`perfil5_caos_gerador`, cerca de 4 KB);
  - não usa o mesmo assunto duas vezes na mesma fala;
  - não repete palavra forte entre os pedaços;
  - não repete nenhuma das últimas 12 falas do gatilho;
  - respeita o 👎 da mesa.
- **Segurança:**
  - se o gerador não conseguir montar uma fala, o jogo usa a lista antiga;
  - o filtro do Júnior e o de palavrão continuam valendo;
  - fala com mais de 190 letras é remontada.

**Geradores da 1.7.5.1:**
- JF: chegou, início da partida, acerto e fim;
- Anne: chegou;
- boas-vindas de qualquer jogador;
- início da partida: modo, quantidade de jogadores, primeiro Mestre e primeira pessoa a responder;
- revanche;
- pausa longa, em 6 degraus, e a volta da pausa.

**Para criar um gerador novo:**
1. Crie o arquivo em `src/dados/08-geradores/` e acrescente a linha dele em `src/ordem.txt`.
2. No ponto do código onde a fala acontece, use `caosGerarFala("nome", jogador) || getRandomReaction(listaAntiga, ...)`.
3. Rode `node ferramentas/caos_teste_geradores.js`.

## Calibração ajustada na 1.7.5.1

O teste de estresse mostrou que um **erro em série deixava o C.A.O.S. entediado**, em vez de irritado ou magoado. Toda carta depois de um erro somava tédio de "rotina", e o tédio vencia.

**O que mudou:**
- o tédio de rotina passa a vir só de **pulo**;
- erro em série longo, de 6 ou mais, soma só um pouco de tédio ("a mesa empacou");
- a raiva por erro subiu de 1 para 1,25.

**Resultado no teste, com 25 erros seguidos:**
- **Antes:** quase só tédio.
- **Agora:** raiva a partir do 5º erro e **magoado** (raiva com tristeza) depois. O tédio passou a voltar ao calmo em 10 a 13 cartas; antes, nunca voltava.

## Limites de memória (o que fica gravado no aparelho)

| O que | Teto |
|---|---|
| Fichas de jogadores | 80 |
| Nomes conhecidos | 60 |
| Rivais | 60 |
| Nicks vistos | 50 |
| Repertório de nicks | 120 |
| Tempo de nick | 60 |
| Cartas com absurdo | 150 |
| Falas da partida (relatório) | 150 |
| Histórico de emoção | 200 |
| Ritmo | 150 |
| Avaliações 👍/👎 | **500 (novo)** |
| Gerador de falas | pedaços recentes por gatilho, cerca de 4 KB |
| Memória por carta | 1 entrada por carta, que tem limite natural porque o baralho é limitado |

## Testes

```
node ferramentas/caos_teste_geradores.js [quantas]   repetição, falas vazias, {chave} sem preencher, memória entre recargas
node ferramentas/caos_teste_estresse.js              estresse, tédio, animação, montanha-russa, absurdos e partida realista, nos 5 temperamentos
```

Os dois só reportam e usam o Mestre mais novo (rode `node montar.js` antes).
