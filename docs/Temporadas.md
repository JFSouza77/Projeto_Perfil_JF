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
3. [ ] Natal · falas do C.A.O.S.: 15 falas, com as piadas de avançar e voltar casas (lista dos bonzinhos e dos malvados), gorro no rosto e a gafe de data (15 correções).
4. [ ] Natal · C.A.O.S. bonzinho: mais presentes (até 3 por partida, inclusive pros favoritos), pontinho extra e joia rara (nunca a 4ª).
5. [ ] Natal · lojinha: 5 itens de Natal na Corrida e 5 no Modo C.A.O.S.
6. [ ] Natal · 5 cores e 5 emojis, troca com pergunta pro cadastrado e salvamento da temporada (volta ao normal no fim).
7. [ ] Natal · 5 títulos nas estatísticas (Papai Noel e outros).
8. [ ] Natal · 10 cartas de Natal, auditadas, valendo o dobro na janela.
9. [ ] Natal · bateria de testes, prints e relatório pro JF (ele decide se publica).
10. [ ] Ano Novo e aniversário do criador (2/1), no mesmo formato do Natal.
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
