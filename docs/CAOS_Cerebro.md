# Cérebro do C.A.O.S. 4.0 (mapa da 1.7.5.3)

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

- **Motor:** `src/js/07-caos/10-gerador-de-falas.js`, função `caosGerarFala(gatilho, jogador, extra)`.
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

**Geradores (1.7.5.1 e 1.7.5.2):**
- JF: chegou, início da partida, acerto e fim;
- Anne: chegou;
- boas-vindas de qualquer jogador;
- início da partida: modo, quantidade de jogadores, primeiro Mestre e primeira pessoa a responder;
- revanche;
- pausa longa, em 6 degraus, e a volta da pausa;
- chute, pensamento e religado (na 1.7.5.2).

**Para criar um gerador novo:**
1. Crie o arquivo em `src/dados/08-geradores/` e acrescente a linha dele em `src/ordem.txt`.
2. No ponto do código onde a fala acontece, use `caosGerarFala("nome", jogador) || getRandomReaction(listaAntiga, ...)`.
3. Rode `node ferramentas/caos_teste_geradores.js`.

## A espinha: as 3 leis (1.7.5.3)

O C.A.O.S. é **caótico leal**: fala o que quiser, do jeito dele, mas dentro de três leis que o código faz valer. Ele não tem consciência nem vontade própria, nem acesso ao jogo. Ele observa e comenta. A espinha fica em `src/js/07-caos/11-espinha.js` e é instalada no `iniciar()`.

1. **Nunca mexe no jogo.** Pontos, casas, joias, equipes, turno, Mestre e carta são da mesa. Antes de cada rotina protegida, a espinha tira uma foto do jogo. Se a rotina mudar algo, a espinha desfaz na hora e anota.
2. **Nunca fala o que a mesa proibiu.** O Júnior e o Family friendly não recebem fala pesada, o Suave não recebe zoeira, e o 🔇 da carta, a saída da partida e o 👎 são respeitados. Isso é feito pelos filtros do motor e do gerador.
3. **Nunca trava a partida.** Se der erro dentro dele, a rotina devolve "nada", a partida segue e o erro fica registrado.

**Como isso funciona:**
- **Proteção:** são 24 rotinas de fala e de emoção protegidas (`CAOS_ENTRADAS`).
- **Saneamento:** os medidores de emoção são saneados, sem número inválido nem valor fora da faixa.
- **Acompanhamento:** na área ADM, a aba Estado mostra a espinha, os erros contidos, as vezes em que protegeu o jogo, os saneamentos e o registro.

**Canal (preparação do online):**
- toda fala do C.A.O.S. passa pelo canal, que anota o destino: os jogadores citados ou a mesa toda;
- `caosFalarPara(nome, msg, privado)` é a fala dirigida a uma pessoa;
- hoje todos os jogadores estão no aparelho "host";
- na 1.7.10, cada jogador vai ter `aparelho`, e o canal entrega a fala no celular certo. As falas privadas vão só para o aparelho da pessoa.

**Teste:** `node ferramentas/caos_teste_espinha.js`.

## Novo no C.A.O.S. 4.0 (1.7.5.2)

- **Chute comentado:** o Mestre toca em "digitar o chute" e o C.A.O.S. compara o chute com a resposta.
  - **Tipos de chute:** igual, trave, perto, médio, longe, outra era, parte, parecido, inicial e longe.
  - **O que ele leva em conta no comentário:**
    - a categoria;
    - as dicas abertas;
    - se alguém já chutou a mesma coisa nessa carta;
    - como a pessoa costuma ir na categoria (pela ficha);
    - se a carta costuma derrubar gente ou sair fácil.
  - **Limites:** nunca diz se a data é antes ou depois. Com jogador Suave, comenta só a reação, sem zoeira.
- **Pensamento em voz alta:** de vez em quando, a fala espontânea conta como ele está por dentro. Ela usa a emoção do console e, quando houver, a mistura.
- **Religar na Pausa:** o botão "🔊 Religar o C.A.O.S. nesta carta" aparece quando ele foi silenciado na carta. Ele desfaz o corte que o 🔇 contou (cortes, rancor e marcação de quem silenciou) e a raiva e a tristeza que vieram junto.
- **Misturas com rosto:** as 7 misturas têm rosto próprio (`CAOS_MISTURA_ROSTOS`), que aparece em 55% das vezes em que a mistura está ativa. Nunca no Júnior nem no Suave.
- **Misturas:** a mistura agora começa em 70% do limiar (antes era 80%). Quando há mistura, o rosto mostra a mistura de forma fixa, sem sorteio.
- **Estabilizador de humor:** antes, o humor oscilava entre alegre e triste do nada. Agora:
  - não existe mais sorteio de rosto secundário (`pMistura` 0);
  - a emoção nova só assume se passar 2 pontos à frente da atual (`margem` 2);
  - cada emoção dura pelo menos 3 falas (`dwell` 3);
  - ela só sai abaixo de 2,2 (`saida`);
  - a emoção que manda cai a 75% do ritmo normal (`segura`).
  
  No teste caótico, a oscilação caiu de 38 para 19 trocas. Ele volta ao calmo aos poucos, em 6 a 21 cartas.
- **Controle de humor (área ADM, aba Console):** uma barra deslizante por emoção, mais o botão "Acalmar tudo". As barras acompanham a queda natural das emoções.
- **Interface neural (área ADM):**
  - um anel com os 10 núcleos de emoção, em que o tamanho mostra a intensidade e uma linha branca liga as emoções da mistura;
  - uma legenda com a mistura, o estado e o temperamento;
  - na aba Estado, as falas que o gerador montou na partida, a memória dele e se ele está silenciado na carta.
- **Auditor de falas:** `node ferramentas/caos_auditar_falas.js`.

## Repertório (estimativa da 1.7.5.2)

| Fonte | Quanto |
|---|---|
| Falas prontas (`REACTIVE_VOICE`) | 3.410 em 494 listas. 651 delas mudam com nome ou número, então rendem uma variação diferente para cada jogador |
| Gerador de acerto, erro e pulo (`CAOS_LEX`) | 238 pedaços, que dão dezenas de milhares de montagens |
| Comentários do Hall da Fama (`CAOS_COMENT`) | 145 pedaços |
| Geradores por gatilho (16) | Cerca de 600 pedaços e mais ou menos 30 mil combinações (somando todos os contextos) |

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
node ferramentas/caos_teste_espinha.js               as 3 leis, saneamento e canal
node ferramentas/caos_auditar_falas.js               auditoria das falas e dos pedaços dos geradores
node ferramentas/caos_teste_estresse.js              estresse, tédio, animação, montanha-russa, absurdos e partida realista, nos 5 temperamentos
```

Os dois só reportam e usam o Mestre mais novo (rode `node montar.js` antes).
