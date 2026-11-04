# Temporadas: o jogo no clima de cada data

Pedido do JF em 30/10/2026. O jogo olha a data do aparelho e entra no clima da época: visual, falas do C.A.O.S. e
cartas da temporada valendo o dobro. Tudo é feito aos poucos, no branch `temporadas`. **Nada é publicado sem o JF ver
e autorizar.** Quando tudo estiver pronto, o Code avisa e mostra o que fez.

## As 15 temporadas

| # | Temporada | Quando (janela) | Clima |
|---|---|---|---|
| 1 | Ano Novo | 31/12 a 1/1 | fogos, brinde, contagem regressiva |
| 2 | Aniversário do criador | 2/1 | festa pro JF; o C.A.O.S. pega leve com ele nesse dia |
| 3 | Carnaval | sábado até a Quarta de Cinzas (data móvel) | confete, serpentina, marchinha |
| 4 | Dia da Mulher | 8/3 | homenagem com fatos (cartas de mulheres marcantes) |
| 5 | Páscoa | Sexta-feira Santa ao domingo (data móvel) | ovos, coelho, chocolate |
| 6 | Dia das Mães | 2º domingo de maio | homenagem |
| 7 | Dia dos Namorados | 12/6 | corações; o C.A.O.S. faz piada de casal |
| 8 | Festa Junina | o mês de junho inteiro | bandeirinhas, fogueira, quadrilha |
| 9 | Dia dos Pais | 2º domingo de agosto | homenagem |
| 10 | Folclore | 22/8 | Saci, Curupira, Iara (ótimo pro Júnior) |
| 11 | Independência | 7/9 | verde e amarelo, com fatos |
| 12 | Dia das Crianças | 6/10 a 12/10 | o C.A.O.S. fala mais no Júnior |
| 13 | Halloween | 20/10 a 31/10 | abóboras, morcegos, teia; "olha a bruxa" |
| 14 | Black Friday | a sexta e o fim de semana (data móvel) | etiquetas de "desconto"; o C.A.O.S. zoando a "promoção" |
| 15 | Natal | 1/12 a 30/12 | neve leve, luzinhas, gorro no C.A.O.S. |

- **Se duas datas caírem juntas,** vale a de um dia só (ex.: o Dia dos Namorados ganha da Festa Junina no dia 12/6).
- **Datas móveis** são calculadas pelo próprio jogo. Pra conferir: em 2027, o Carnaval cai na terça 9/2 e a Páscoa em 28/3;
  o Dia das Mães em 9/5, o Dia dos Pais em 8/8 e a Black Friday em 26/11.
- **Pra conversar com o JF depois:** outras datas (Consciência Negra, Dia do Professor, Dia do Gamer…). A lista acima é a
  base e pode crescer.

## Regras

- **Liga e desliga:** uma opção "Temporadas" nas configurações, ligada por padrão.
- **Só aparência e falas,** com uma exceção pedida pelo JF: **carta da temporada vale o dobro de pontos** durante a
  janela, com um selo na carta (🎃, 🎄, 🎉…). Fora da janela, ela é uma carta comum ou nem aparece.
- **Quantidades terminam em 0 ou 5:** 15 temporadas e, em cada uma, 15 falas do C.A.O.S., 10 cartas, 5 itens por
  lojinha, 5 cores, 5 emojis e 5 títulos.
- **Júnior:** só falas e cartas leves. As datas de homenagem usam fatos, sem tomar partido (mesma regra das cartas de
  tema pesado).
- **Movimento leve:** os enfeites respeitam o "reduzir movimento" do aparelho e não cobrem texto nem botões.
- **Online:** cada aparelho segue a própria data. Na dúvida, vale a data do host pra pontuação dobrada (assim todos
  contam igual).
- **Pra testar fora da época:** um modo de teste força a temporada (ex.: `?temporada=natal`), só pra desenvolvimento.

## O que cada temporada traz (ideias do JF, 30/10/2026)

- **Lojinha da temporada:** na Corrida contra o Tempo e no Modo C.A.O.S., os itens de sempre continuam e entram
  5 itens da temporada em cada loja.
- **Cores e emojis da temporada:** 5 cores e 5 emojis novos pros jogadores escolherem.
  - Se um jogador cadastrado escolher uma cor ou emoji diferente do cadastro, o jogo pergunta: "Você escolheu um estilo
    que não é o do seu cadastro. Quer usar durante a temporada?" Se ele aceitar, o C.A.O.S. "autoriza" a troca.
  - O estilo novo fica salvo só durante a temporada (salvamento da temporada). Quando ela acaba, o jogador volta ao
    estilo que tinha antes, sozinho.
- **Títulos da temporada nas estatísticas:** 5 títulos por temporada. Exemplos:
  - Halloween: **Caçador de Bruxas**, quem eliminou as cartas mais rápido.
  - Natal: **Papai Noel**, quem mais distribuiu presentes (o Mestre que mais deu pontos, casas e bônus pros outros).
- **Piadas do C.A.O.S. no tema:** no Natal, quando alguém volta casas: "Parece que alguém se comportou mal esse ano e
  tá na lista dos malvados do Papai Noel. Fulano voltou N casas." Quando avança: "Olha, o Papai Noel te deu um
  presentinho, hein? Alguém tá na lista dos bonzinhos. Ho, ho, ho!"
- **C.A.O.S. bonzinho no Natal e no Ano Novo:** ele fica feliz e ajuda mais.
  - Hoje o 🎁 Presente do Modo C.A.O.S. sai no máximo 1 vez por partida, só pra quem está bem atrás do líder. No Natal,
    pode sair 2 ou 3 vezes, e também pros favoritos dele, mesmo quem não precisa ("Aproveita o Natal, toma um pontinho
    extra").
  - Joia de presente só com chance bem baixa e só onde joias valem (modo Joias e Express). Ele dá uma joia que falta
    (Ano, Pessoa, Lugar ou Coisa) e respeita o limite de 2 joias por rodada.
  - **Nunca a 4ª joia:** com 3 joias, o jogador não ganha joia do C.A.O.S. Ele pode ajudar, mas nunca entregar a vitória.
- **Doces ou travessuras no Halloween (Modo C.A.O.S.):** o C.A.O.S. pergunta a um jogador.
  - **Doces:** um presente sorteado (um item da lojinha, mais tempo na próxima carta…).
  - **Travessuras:** uma sabotagem pequena, pra zoar sem estragar o jogo (pula a próxima vez, perde uns pontos ou uns
    segundos).
  - **Às vezes, nada:** o C.A.O.S. diz "Aguarde… em breve você verá alguma coisa", deixa o jogador na tensão e, no
    fim, solta: "É pegadinha! Feliz Halloween!"
- **Gafe de data (o TDAH do C.A.O.S.):** de vez em quando ele solta uma fala de outra temporada fora de época (uma
  piada de Festa Junina em dezembro) e logo se corrige: "Ih, rapaz… perdão, errei a data" ou "Me atrasei, desculpa".
  - É rara: no máximo 1 vez por partida, com chance baixa. Fica mais engraçada justamente por ser rara.
  - É só fala: nunca muda o visual nem a pontuação.
  - Usa as falas que as outras temporadas já têm, mais 15 correções ("errei a data", "me atrasei"…).
- **Tom:** o C.A.O.S. pode implicar e zoar, mas com respeito. Datas de homenagem (Dia das Mães, Dia dos Pais, Dia da
  Mulher) têm falas carinhosas, sem piada pesada.

## Ordem de trabalho (um pedaço por dia)

**Prioridade: o Natal** (pedido do JF, 30/10/2026). O Natal fica completo primeiro, pra estar pronto antes de 1/12.
Quando ele estiver pronto, o Code mostra pro JF, que decide se publica antes de dezembro. Depois vêm as outras
temporadas, na ordem do calendário.

1. [x] Motor de temporadas: data → temporada, datas móveis, prioridade, opção nas configurações, modo de teste e teste automático.
2. [x] Natal · visual (neve leve, luzinhas) e selo "🎄 Edição de Natal" na splash.
3. [x] Natal · falas do C.A.O.S.: 15 falas, com as piadas de avançar e voltar casas (lista dos bonzinhos e dos malvados), gorro no rosto e a gafe de data (15 correções).
4. [x] Natal · C.A.O.S. bonzinho: mais presentes (até 3 por partida, inclusive pros favoritos), pontinho extra e joia rara (nunca a 4ª).
5. [x] Natal · lojinha: 5 itens de Natal na Corrida e 5 no Modo C.A.O.S.
6. [x] Natal · 5 cores e 5 emojis, troca com pergunta pro cadastrado e salvamento da temporada (volta ao normal no fim).
7. [x] Natal · 5 títulos nas estatísticas (Papai Noel e outros).
8. [x] Natal · 10 cartas de Natal, auditadas, valendo o dobro na janela.
9. [x] Natal · bateria de testes, prints e relatório pro JF (ele decide se publica).
10. [ ] Ano Novo e aniversário do criador (2/1), no mesmo formato do Natal. Em pedaços:
    - [x] Ano Novo · enfeite (confete e fogos), selo, 15 falas (+ 10 de presente), 5 cores, 5 emojis e 5+5 itens de lojinha.
    - [ ] Ano Novo · 5 títulos e 10 cartas valendo o dobro.
    - [ ] Aniversário do criador (2/1) · tudo (enfeite, falas, o C.A.O.S. pegando leve com o JF, cores, emojis, lojinha, títulos e cartas).
11. [ ] As outras 12 temporadas, uma de cada vez, na ordem do calendário (Carnaval → … → Halloween, com o Doces ou travessuras).
12. [ ] Bateria final, prints de todas as temporadas e relatório pro JF.

## Progresso

- 30/10/2026: plano criado; o JF somou lojinha, cores, emojis, títulos e piadas da temporada e deu prioridade pro Natal; tarefa agendada 2 vezes por dia (8h47 e 23h47, horário de Brasília) pra ir fazendo um pedaço por vez.
- 31/10/2026 (madrugada): item 1 feito. Motor em `src/js/05y-temporadas.js` (`temporadaDe`, `temporadaAtual`,
  `temporadaAplicar` marca `data-temporada` no `<html>`), opção 🎄 Temporadas na Acessibilidade (ligada por padrão),
  modo de teste `?temporada=natal` (ou `nenhuma`) e teste fixo `ferramentas/teste_temporadas.js` (datas de 2026 a
  2040, Páscoa, prioridade, liga e desliga). O branch já tem a 1.9.1 junto (merge de `v1.9.1`).
- 31/10/2026 (manhã): item 2 feito. Natal com neve leve e varal de luzinhas numa camada atrás do conteúdo
  (`#temporadaEnfeite`, z-index -1, sem toque; `src/css/11-temporadas.css`), parado no "menos movimento", sem neve no
  Modo Batata, neve azulada no modo claro; selo "🎄 Edição de Natal" na splash (`#splashTemporada`). Cada temporada
  ganhou o texto do selo (`selo` em TEMPORADAS). Teste: `teste_temporadas` (natalEnfeite, natalSelo, semTemporadaSemEnfeite).
- 01/11/2026 (madrugada): branch atualizado com a `main` (1.9.1 e 1.9.2). Item 3 feito. 15 falas de Natal em
  `REACTIVE_VOICE.temporada.natal`: 5 no começo da partida, 5 quando alguém avança casas (lista dos bonzinhos, "Ho, ho,
  ho!") e 5 quando volta (lista dos malvados, carvão na meia). As piadas saem em 60% dos Avance/Volte. Gorro no rosto
  do C.A.O.S. (faixa vermelha, barra branca e pompom; no balão do host e no do celular). Gafe de data: 15 correções em
  `REACTIVE_VOICE.temporada.gafe`. Ela é rara (6% das partidas, no máximo 1 vez), nunca no Júnior e some com a opção
  de temporadas desligada. Usa a fala de começo de outra temporada que já tenha falas (por enquanto, só o Natal). Teste:
  `teste_temporadas` (12 checagens novas).
- 01/11/2026 (manhã): item 4 feito, em `src/js/05y-temporadas.js` (vale no Natal e no Ano Novo).
  - Modo C.A.O.S.: o 🎁 Presente sai até 3 vezes por partida (fora da temporada, 1). Num intervalo sem lanterna pra
    ajudar, às vezes (40%) ele dá +5 PC pra um favorito dele ("pontinho extra").
  - Joia de presente: chance de 3% por carta, no máximo 1 por partida, só onde joias contam pra vencer. Vai pro
    favorito do C.A.O.S. se ele puder ganhar; senão, pra alguém sorteado. Respeita a trava de 2 por rodada e **nunca dá
    a 4ª joia** (quem tem 3 não ganha).
  - 10 falas novas: 5 da joia de presente e 5 do pontinho extra.
  - Teste: `teste_temporadas` (36 checagens: joia pra quem não tem 3, uma por partida, nunca a 4ª, trava, só onde joia
    vale, até 3 presentes no Natal, 1 fora). `teste_loja_caos` e `caos_teste_espinha` continuam OK.
- 02/11/2026 (madrugada): branch atualizado com a `main` (cartas da 2.0 e lote por categoria). Item 5 feito.
  - 5 itens de Natal em cada lojinha (`temporada: "natal"` em `MC_LOJA` e `CORRIDA_LOJA`):
    - Modo C.A.O.S.: 🎁 Presente Surpresa, 🧦 Meia Recheada (2 Vidas Extras), ⛄ Boneco de Neve (Era do Gelo mais
      barata), 🌟 Estrela Guia (Olho) e 🎅 Gorro Protetor (Colete).
    - Corrida: 🎁 Presente Surpresa, 🧦 Meia Recheada (2 Passes Livres), ⛄ Boneco de Neve (Pausa Dramática), 🌟
      Estrela Guia (Cofrinho) e 🦌 Trenó do Noel (Choque de Tempo).
  - Na época, a vitrine continua com os itens de sempre e ganha mais 2 de Natal. Fora dela, nunca aparecem, nem nas
    regras. Na compra, cada um vira um item de sempre (`lojaEfeito`), então nenhuma regra nova de jogo foi criada.
  - Teste: `teste_temporadas` (43 checagens). `teste_loja_caos` e `teste_corrida` continuam OK.
- 02/11/2026 (manhã): item 6 feito.
  - 5 cores de Natal (Gorro do Noel, Pinheiro, Estrela dourada, Neve, Bengala doce) e 5 emojis (🎅 🤶 🦌 ⛄ 🎄) em
    `TEMPORADA_ESTILOS`. Na época, entram na paleta e na lista de emojis (local e celular); fora dela, somem.
  - Quem tem cadastro e escolhe um deles recebe a pergunta "Você escolheu um estilo que não é o do seu cadastro. Quer
    usar durante a temporada?".
    - Sim: o C.A.O.S. autoriza (5 falas novas) e o salvamento da temporada (`perfil_jf_estilo_temporada`) guarda a
      escolha. Não pergunta de novo nesta temporada; o que é de outra temporada some sozinho.
    - Não: volta o emoji da ficha e uma cor de sempre.
  - A ficha nunca guarda emoji de temporada, então, quando a época acaba, o jogador volta sozinho ao estilo de antes.
  - Quem não tem cadastro não recebe a pergunta.
  - Teste: `teste_temporadas` (54 checagens). `teste_cadastro_caos`, `teste_idade` e `caos_teste_espinha` continuam OK.
- 03/11/2026 (madrugada): item 7 feito. No Natal, o resumo do fim da partida ganha a caixa "🎄 Títulos de Natal"
  (`temporadaTitulosHtml`), com 5 títulos:
  - 🎅 Papai Noel: o Mestre que mais entregou cartas acertadas de presente;
  - 🎁 Duende Ajudante: quem mais deu suporte aos outros, avançando ou recuando jogadores (ajuste do JF em 03/11);
  - 🦌 Rena Veloz: quem acertou mais rápido, em média;
  - 🌟 Estrela Guia: o acerto com menos dicas;
  - ⛄ Boneco de Neve: quem mais congelou nos palpites furados.

  Cada título só aparece com dado de verdade (mínimo de 2), e tocar nele faz o C.A.O.S. comentar, como nos troféus.
  Teste: `teste_temporadas` (59 checagens), e o resumo foi montado no navegador sem erro.
- 03/11/2026 (manhã): item 8 feito. 10 cartas de Natal em `src/dados/02-cartas/98-temporada.js`, com ids 0901 a 0905,
  fora da sequência das cartas de sempre:
  - Pessoa: Papai Noel, Mamãe Noel, Grinch, Rudolph e Kevin McCallister (Esqueceram de Mim);
  - Coisa: Árvore de Natal, Panetone, Presépio, Pisca-pisca e Amigo Secreto.

  Elas ficam fora do baralho o ano todo (`TEMPORADA_CARTAS`). No Natal, entram no Clássico, Hardcore, Júnior e Corrida,
  espalhadas entre as primeiras 40 cartas, **valem o dobro de pontos** (também no Express, se cair) e mostram o selo
  "🎄 Carta de Natal · vale o dobro". Auditoria: 0 erros (1.010 cartas no jogo, total em múltiplo de 5); assuntos
  no catálogo. Teste: `teste_temporadas` (68 checagens). `teste_baralho`, `teste_lote`, `teste_corrida` e
  `caos_teste_espinha` continuam OK.
- 04/11/2026: item 9 feito. Bateria inteira no build do Natal: tudo OK (`build.js --testar` nas 3 saídas, temporadas
  com 69 checagens, baralho, lote, corrida, espinha, cérebro e o resto). Dois achados no caminho:
  - o `teste_cerebro` falhava às vezes, até no main (o teste dependia do temperamento sorteado na carga). Corrigido
    só no teste;
  - o print mostrou "409 de 400" no contador: as 10 de Natal entravam por cima do limite. Agora tomam o lugar das
    últimas 10 a sair (`baralhoNaoPassaDoLimite` no teste).
  Prints e relatório mandados pro JF. **Esperando ele dizer se publica antes de 1/12.**
- 04/11/2026: **espírito natalino do C.A.O.S.** (pedido do JF antes de publicar). No Natal e no Ano Novo:
  - emoções ruins entram com 75% da força e caem mais rápido; alegria e carinho entram com 115% e duram mais;
  - perde 40% menos paciência, recupera mais rápido e demora 35% a mais pra achar a mesa lenta;
  - falas novas: "vocês têm sorte que é Natal" (até 3 por partida, quando a raiva sobe), carvão pra quem errou 3 vezes
    ou mais com ele bravo ("já liguei pro Papai Noel", 1 por jogador, até 2 por partida, nunca com iniciante) e o
    perdão quando esfria ("é Natal, não abusem da sorte", até 2 por partida). 10 falas de cada.
  - fora do Natal, o 🎁 Presente do Modo C.A.O.S. vem às vezes com piada de data: 10 de "não sei se é seu aniversário,
    mas..." e 5 de "Feliz Natal adiantado" (só em outubro e novembro).
  Teste: `teste_temporadas` (+13 checagens). Cérebro, espinha, afeto, estresse, loja, corrida, baralho e
  `build.js --testar` OK. **Esperando o ok do JF pra publicar.**
- 04/11/2026 (tarefa da manhã): item 10, 1º pedaço (Ano Novo). Enfeite com confete colorido e fogos piscando no
  alto, selo "🎆 Edição de Ano Novo", 15 falas (começo, avançar, voltar) e 10 de presente (joia e PC, pra não
  sair "Papai Noel" no dia 31), 5 cores (Champanhe, Fogos, Roupa branca, Meia-noite, Confete), 5 emojis
  (🎆 🥂 🍾 🎇 🕛) e 5 itens em cada lojinha (Champanhe Surpresa, Lentilha da Sorte, Queima de Fogos, 12 Uvas, Roupa
  Branca; na Corrida, Sete Ondas e Contagem Regressiva). No Ano Novo o C.A.O.S. continua calmo como no Natal, mas
  as falas de carvão e perdão são só do Natal. A gafe de data agora também pode usar as falas do Ano Novo.
  Teste: `teste_temporadas` (+11 checagens); cérebro, espinha, loja, corrida, afeto e `build.js --testar` OK.
- 04/11/2026 (pedido do JF): **presente com fala de data.** Quando o C.A.O.S. dá o 🎁 Presente (Modo C.A.O.S.),
  metade das vezes a fala segue o calendário: Dia das Crianças de 1 a 11/10 "adiantado", 12/10 "no dia", de 13 a
  20/10 "atrasado"; de 21 a 31/10, Halloween; em novembro, Black Friday; em dezembro, Natal adiantado/no dia/atrasado,
  depois Ano Novo e o aniversário do JF (2/1). O mesmo vale pra Carnaval, Dia da Mulher, Páscoa, Mães, Namorados,
  Festa Junina, Pais, Folclore e Independência. Longe de qualquer data, a piada do "não sei se é seu aniversário".
  150 falas (`REACTIVE_VOICE.temporada.presenteData`), calendário em `TEMPORADA_PRESENTE_DATAS` (05y).
  **Geradores:** todo gerador de fala agora recebe as etiquetas `temporada_<id>` e `data_<id>_<momento>`, então dá pra
  pôr pedaço de temporada em qualquer gerador. O primeiro a usar é o `escolherDica` (novo, 70 pedaços): a cobrança
  pra escolher a dica, com humor, temporada e "de novo você?". A lista `avisoEscolha` foi pra 25 falas, sem o "eles
  não mordem". Teste: `teste_temporadas` (calendário com 36 datas e mais 8 checagens) e `caos_auditar_geradores`
  (escolherDica sem defeito em 450 falas).

