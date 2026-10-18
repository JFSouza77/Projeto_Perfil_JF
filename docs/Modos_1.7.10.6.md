# 1.7.10.6 · Corrida contra o Tempo + Modo C.A.O.S. (decisões do JF, 17/10/2026)

Fonte: handoffs do GPT (pacote "Novos Modos Arquivos OffHand"), brainstorms em `docs/brainstorm/` e as respostas do
JF de 17/10/2026. O que está aqui é regra; o resto dos handoffs é sugestão.

## Corrida contra o Tempo

O nome é **Corrida contra o Tempo** (sem "Modo" na frente). É o jeito que o JF jogava com os sobrinhos: quem acerta
fica com a carta.

- **Onde:** local (um dispositivo na mesa) **e** online.
- **Quem lê e quem responde:** o Mestre roda a cada carta, como no Clássico. A vez de responder segue a roda:
  **15 s pra escolher a dica + 15 s pra responder**. Errou ou o tempo acabou: passa pro próximo. Não escolheu:
  passa a vez sem gastar dica.
- **Relógios:** geral de **30 min**, **+10 s por carta acertada** (uma vez por carta, sem teto no 1º teste);
  carta de **2:30**, que não reinicia por erro nem troca de vez; **intervalo de 15 s** entre cartas com o relógio
  geral **congelado**.
- **Dicas:** até 10 por carta (sorteadas, com pelo menos 6 normais; numeração da tela 1 a 10).
- **Especiais:** sem tabuleiro, as de casa ("avance/volte N casas", "escolha um jogador…") saem. "Perde a vez"
  fica. **"Palpite a qualquer hora" vira "rouba a vez"** (a ficha de palpite: quem tem toca e responde na hora).
- **Pontuação:** sem casas, pontos ou joias. **Cada carta acertada vale 1** (com 1 dica ou com 10) e vai pra
  coleção de quem acertou. Carta que expirou ou acabou as dicas sai sem dono; ninguém perde nada.
- **Fim:** quando o relógio geral zera (a resposta em andamento termina; não começa carta nova). **Vence quem tiver
  mais cartas.** Empate: **desempate relâmpago** (1 carta; quem acertar primeiro leva; ninguém acertou = empate).
- O C.A.O.S. comenta, mas não muda regra.

### Duas vitórias na Corrida (JF, 17/10, "já é oficial")

Ideia que o JF trouxe da conversa com o Gemini (handoff atualizado em 17/10, 15:28):

- **⏱️ Tempo** (padrão): a carta vale **os segundos que sobravam no relógio dela** na hora do acerto (acertou com
  1:45 sobrando = 105 pontos). O valor fica "derretendo" na tela (💰 vale N). Vence quem somar mais pontos.
  Empate em pontos: vence quem tem mais cartas; empatou de novo, vitória dividida (sem desempate relâmpago).
- **🃏 Cartas**: o que já estava: cada carta vale 1, empate vai pro desempate relâmpago.
- Último Suspiro (Buzzer Beater): relógio geral zerou com resposta em andamento, ela termina; não sai carta nova.
- A escolha é na tela de modos (como o Old School): ⏱️ Tempo ou 🃏 Cartas.
- Ainda não entrou: a Corrida Hardcore do handoff (carta de 1:30, vez de 10+10 s). Fica pra decisão do JF.

## Modo C.A.O.S.

- **Só online**, um dispositivo por pessoa, individual. **16+** (todos os jogadores com 16 anos ou mais) e nunca
  no Júnior: exige raciocínio rápido e é competitivo.
- 1 carta secreta por jogador por rodada; 10 dicas embaralhadas; especiais do Express valem.
- O Mestre roda; a cada vez, uma dica da carta dele abre pra todos. Ninguém acertou: a carta **pausa** e volta na
  próxima vez dele, na dica seguinte. Acertou: **captura** a carta (1 carta = 1 ponto). Sem tabuleiro e sem joias.
- **Palpite:** quem tocar primeiro em **Palpitar agora** responde (falando na call ou na mesa); o Mestre marca
  Acertou/Errou. **Quando o Mestre marca, a resposta aparece pra todo mundo conferir.**
- **Relógios do 1º teste:** partida de 10 min, rodada de até 5 min, 15 s por dica, intervalo de 15 s congelado.
  Acertar não dá tempo extra (isso é da Corrida).
- **Caprichado, não só o básico** (pedido do JF): roubo com duelo ("É HORA DO DUELO!", ideia do Rafa), revanche,
  intervenção no placar (1 por partida), e a Mochila entram conforme ficarem bem feitos e testados.
- T2 mostra o Mestre da vez, a categoria, a dica atual e as dicas já abertas **só daquela carta**.
- Provocação mais forte, sem xingar e sem atacar a pessoa.

### Modo C.A.O.S.: handoff de 17/10 (Lojinha com Pontos de Caos, drops e eventos) · implementado

Arquivo: `src/js/05q-modo-caos.js` (constantes MC_* em `01-configuracao.js`). Teste: `teste_online.js --so=caos`.
A Mochila saiu (substituída pela lojinha com PC, como diz o handoff).

- Base: só online, 3+ jogadores, cada um no próprio dispositivo (o host conta como um), sem menor de 12 marcado
  (o cadastro só tem "menos de 12 / 12+": o 16+ fica no aviso do modo). Carta secreta por pessoa por rodada,
  10 dicas (só dicas de verdade nesta 1ª versão; as especiais do Express ficam pra depois do playtest).
  O dono vê a própria resposta no painel dele.
- Vez: o Mestre roda; a dica abre sozinha 1,5 s depois. Janela de 15 s. **Palpite falado com "Palpitar agora"**
  (decisão do JF): o primeiro trava, o Mestre julga (se ele cair, o host julga). Errou: não tenta de novo nessa dica.
  Ninguém: hiberna; 10 dicas sem acerto: carta morta (resposta aparece).
- Tempo: 10 min de partida, rodada até 5 min, intervalo de 15 s congelado. Duelo, carta bônus e intervalo não comem
  o relógio.
- PC: +10 por rodada, +5 acertando nos 5 primeiros segundos, +30 Piñata, +50 carta bônus da batata, −10 imposto.
- Lojinha (no intervalo, preços do handoff): ✂️ Corte de Fio 15 (janela vai pra 6 s; só com mais de 7 s sobrando),
  🫁 Fôlego 20, 🤐 Mordaça 30 (o Mestre não; Garganta Limpa na dica seguinte), ⚡ Desfibrilador 35 (quando a carta
  for hibernar: a próxima dica só pra ele + 8 s pra responder sozinho), 🧊 Congelar Mesa 40 (nos 3 primeiros s
  da dica; os outros travados até os 7 s), 🪞 Espelho 45, 🛡️ Kevlar 60. O que foi comprado é segredo de quem comprou.
- Eventos (o C.A.O.S. faz de verdade): ⏩ Turbo (2/partida), 💸 Imposto da Preguiça (3/partida, quem não tocou em
  Palpitar paga — é o equivalente do "palpite vazio" já que o palpite é falado), 🥔 Batata Quente (2/partida, dura
  3 dicas; **Passar pro próximo** ou **Segurar a Batata** = encara a carta bônus na hora, pedido do JF), carta bônus
  com até 5 dicas automáticas e um juiz que recebe a resposta, 🧤 Mão Leve (1/partida, entregue em segredo no
  intervalo pra alguém da metade de baixo), 🪅 Piñata (até 3, no intervalo, digitar a palavra), ⚔️ Roubo (2/partida:
  ladrão abaixo do topo × alguém com placar ≥ e pelo menos 1 carta; Dado, Cara ou Coroa, Jokenpô ou Par ou Ímpar,
  escolhas fechadas no host) e 🔁 Revanche dobro ou nada. Espelho e Kevlar valem no roubo, na Mão Leve e na batata.
- Nada de evento no primeiro minuto.

## Peça ao C.A.O.S.

Entra nestas versões: o jogador pede pra ele falar mais/menos e usar humor mais leve/mais ácido. Preferência
pessoal (de quem pediu), nunca fura o mudo, não muda regra nem placar.

### Peça ao C.A.O.S. · implementado (17/10)

- Pausa → 🙋 **Peça ao C.A.O.S.** (jogadores do dispositivo); no online cada convidado tem o botão no próprio
  dispositivo. Opções por jogador: 🤫 fale menos / normal / 🗣️ fale mais; 🌸 mais leve / normal / 🌶️ mais ácido
  (sem ácido no Júnior).
- Fale menos: 60% das falas de erro/acerto dirigidas a essa pessoa viram silêncio. Fale mais: metade dos silêncios
  sorteados no erro dela viram comentário. Humor: troca o humor da pessoa (o do cadastro fica guardado).
- Nunca fura o mudo, não muda regra nem placar. Fica no save.

## Fica pra depois

Equalizador/perfil de voz versionado, fadiga entre partidas, orquestração por intenção sobre os geradores.

## Corrida: como ficou no código (17/10)

- Arquivo próprio: `src/js/05o-corrida.js` (relógios, intervalo, fim, desempate, regras, retrato do online).
- Os relógios guardam "quanto falta" + "corre desde". Um tique de 250 ms decide se cada um corre: param na pausa,
  nas falas do C.A.O.S., nos avisos de tempo esgotado, no tutorial e no intervalo. O da carta só corre com a carta
  aberta; o geral também corre com a carta escondida (o Mestre não enrola).
- `p.score` = cartas conquistadas (placar, ranking, tela final e o "Pontos" do lobby viram "cartas").
- Especiais de casa saem; "Um palpite a qualquer hora" aparece como **Rouba a vez** (mesma ficha do palpite; no
  online o botão vira "Roubar a vez!"). 10 dicas por carta, 1 ou 2 especiais.
- Fim de carta por tempo: se tem resposta pendente, espera o veredito. Relógio geral zerado: idem, e não sai carta
  nova. Desistir da carta não dá carta pro Mestre.
- Desempate relâmpago: só os empatados respondem; o Mestre é alguém fora do empate (se tiver). Todo mundo empatado:
  até uma carta por empatado, cada um lendo uma vez. Ninguém acertou: empate. Fichas de Rouba a vez voltam pro estoque.
- Desfazer o acerto tira a carta e os +10 s; o relógio da carta continua de onde estava.
- Save guarda os dois relógios (e o desempate). Online: o retrato leva os prazos; a T2 e os dispositivos mostram a
  barra dos relógios; o intervalo de 15 s aparece pra todos com o placar em cartas.
- Só Versus (no Equipe o card do modo some). Fora do Modo Aleatório por enquanto.

## Corrida: ideias do Gemini + áudio do JF (17/10, noite) · balanceamento proposto (aguardando o JF)

| Ideia | Veredito | Ajuste pra não quebrar |
|---|---|---|
| Dois vencedores: **Senhor do Tempo** (mais pontos) e **Colecionador** (mais cartas) | Entra | O vencedor oficial continua sendo o da vitória escolhida; o outro ganha a coroa na tela final (e o C.A.O.S. zoa). Mesma pessoa nas duas: "Dono da Corrida". |
| **Bomba-Relógio** | Entra | Anunciada antes da carta. Expirou: −60 s no relógio geral (nunca deixa menos de 30 s). 2 por partida no normal, 4 no Hardcore. Não sai nos 3 min finais. Alguém acertou: desarmou, o C.A.O.S. comemora. |
| **Juízo Final** (último minuto) | Entra, sem "cuspir" dica a cada 3 s | Tela pulsa vermelho, tique-taque. A dica abre sozinha a cada 8 s (como o Express) e qualquer um responde (Palpitar agora / o Mestre marca quem foi). Sem os +10 s por acerto (senão o minuto final nunca acaba). |
| **Corrida Hardcore** | Entra | Relógio da carta corre 1,5×. Dicas abrem sozinhas e quem souber aperta pra responder. Bombas mais frequentes. Pontos = o que o relógio da carta mostra (sem multiplicador: ele já derrete mais rápido). |
| **Corrida Extreme** (2×) | Depois | Só depois de jogar o Hardcore 1,5× e ver se dá. |
| **Duelo de Vida ou Morte** | Depois do 1º teste | Raro (no máximo 2 por partida, nunca nos 3 min finais), o C.A.O.S. escolhe os 2 mais colados no placar (não aleatório). Relógio geral congela, o da carta corre 2×. Roubo de 25 pontos (50 é mais do que muita carta vale). Os dois erraram: carta destruída. Precisa do botão de resposta rápida funcionando no online. |
| **Loja de Tempo** (Sacrifício) | Depois do 1º teste, versão limitada | Só no Tempo. Custa 30 pontos, 1 vez por pessoa por partida: congela o relógio da carta por 10 s. "Dica de graça" não entra (a dica é de todo mundo, e quem tá na frente compraria vantagem). |

Observação (corrigida pelo JF, 17/10): na Corrida o C.A.O.S. **continua só comentarista**, agora como mestre de
cerimônias. Quem sorteia bomba, duelo e anúncios é o **jogo**; o C.A.O.S. só finge que foi ele, pra deixar dinâmico.
Quem efetivamente mexe na partida é o C.A.O.S. do **Modo C.A.O.S.** (outro modo).

## Corrida: spec consolidada do JF (17/10, ~16:30) · implementado

Arquivo: `src/js/05p-corrida-eventos.js` (constantes em `01-configuracao.js`, bloco CORRIDA_*). Teste: `ferramentas/teste_corrida.js`.

- **Penalidades:** errou, a carta perde 1 s; pulou, 2 s (estouro de tempo da resposta conta como erro; demorar pra escolher, não).
- **Carta morta** (tempo ou dicas acabaram, sem acerto): −1 min no geral. Não vale no duelo nem no desempate.
- **Bomba-Relógio:** 2 por partida (4 no Hardcore), a partir da 3ª carta, espaçadas, nunca nos 3 min finais. Tic-tac,
  borda laranja, aviso no intervalo. Cada erro/pulo: −5 s no geral; desarmou: +20 s; morreu: −1 min.
- **Juízo Final** (≤ 60 s): dicas abrem sozinhas, qualquer um bate na mesa (no online, "✋ Bater na mesa!"); errou,
  −1 s e a próxima abre na hora; ninguém bateu em 10 s, a próxima abre sem castigo. Acerto não dá +10 s.
- **Hardcore** (caixinha na tela de modos, vale pra Tempo e Cartas): carta de 1:30 a 1,5×, relâmpago o jogo todo,
  sem especiais, mais bombas. Extreme (2×) fica pra depois do playtest.
- **Duelo do C.A.O.S.:** até 2 por partida (3+ jogadores), a partir da 5ª carta, nunca nos 3 min finais nem no Juízo.
  Sorteia 2 duelistas e o Mestre. Geral congela, carta 2×, só os dois respondem. Vencedor rouba 25 pontos (Tempo).
  Ninguém acertou: carta destruída (sem −1 min). Depois o Mestre volta pra roda normal.
- **Lojinha de Sobrevivência** (só online + Tempo, no intervalo; estoque 1–5 de cada, sorteado no começo). **Uma só pra
  mesa toda**, a mesma vitrine ao vivo no host, nos dispositivos e na T2; quem comprar primeiro leva (JF, 17/10):
  🧊 Congelar Mesa 40 · 🫁 Fôlego 20 · 🛡️ Escudo de Kevlar 60 · ✂️ Corte de Fio 15 · ⚡ Desfibrilador 35 (preços meus,
  pra playtest). Corte de Fio e Desfibrilador ficam guardados e são usados na carta (no dispositivo de cada um; os do
  dispositivo do host aparecem como botões na tela do host).
- **Coroas** na tela final: ⏱️ Senhor do Tempo e 🃏 Colecionador (mesma pessoa: 🏆 Dono da Corrida).
- Offline: tudo menos a lojinha.

## Carta presa depois do acerto (relato do Henrique) · corrigido (18/10)

Relato: no duelo bônus online (Henrique × Rafa), o Vitinho acertou, o Henrique virou Mestre e a pergunta ficou
na tela como se ninguém tivesse respondido.

- Causa achada: depois de cada carta, 4% das vezes o C.A.O.S. anuncia a "previsão da próxima carta" e o jogo só
  sacava a próxima quando o balão fechava. Nesse meio-tempo a carta acertada continuava "revelada" na mesa, com o
  Mestre novo já na vez (online dava até pra abrir dica da carta velha). Se o balão demorava (voz, janela aberta,
  fila de falas), parecia travado.
- Correção: a carta que acabou sai da mesa na hora do anúncio; o balão saca a próxima quando fecha, e qualquer
  saque feito antes cancela o do balão (sem carta em dobro). Vale pra todos os modos, não só pro duelo.
- Testes: `teste_duelo.js` ganhou a checagem da previsão; `teste_online.js --so=duelo` (novo) força duelos
  Henrique × Rafa numa mesa de 4 com 3 dispositivos, o Vitinho tentando marcar acerto e "Palpitar agora" no meio,
  e confere a cada passo: quem responde é duelista, o Mestre não é, o leitor emprestado volta, os dispositivos veem
  o mesmo Mestre e a mesma carta do host, e nada fica parado.

## QoL da partida online de 18/10 (JF, namorada, cunhada e prima: 11 a 13 anos)

- **Botões de próximo passo** ("cta"): grandes, amarelos e pulsando (param no modo calmo/batata e com
  movimento reduzido). Valem pro Mestre: "🎰 Virar a carta (sorteia a categoria)", "✓ Já falei a categoria!
  Mostrar a carta" (no dispositivo e na tela do host), "🃏 Puxar a próxima carta" e "👉 Abrir a dica X
  (pedida por …)".
- **Faixa do papel** no dispositivo: "🎙️ VOCÊ É O MESTRE" (roxa) ou "👉 É A SUA VEZ!" (amarela, pulsando),
  cada uma com uma linha do que fazer.
- **T2**: na ordem que a mesa precisa: 1º Mestre (em destaque, com a cor da pessoa e "lê as dicas"), 2º vez
  (em destaque, "escolhe a dica e responde"), 3º categoria da carta; o tempo fica do lado da categoria.
- **Pedido de dica e Palpitar agora chegam na hora**: eles não mexem na revisão da partida, então só iam pros
  outros dispositivos na batida de 4 s (a demora que vocês viram).
- **"Travou" a dica**: com a trava ligada, os números não pedidos ficavam travados e o toque não fazia nada;
  só segurar 650 ms abria o "Abrir sem pedido", e ninguém sabia. Agora o toque simples já pede a confirmação
  (no dispositivo do Mestre e no host). Junto com o atraso de 4 s, é o que explica a Mestra não conseguir abrir
  a dica pedida e o "forçar" não funcionar.
- **Host caiu**: a mesa vê a contagem de quando o próximo assume ("… assume a sala em 45 s. Não feche a
  página!"). O tempo de espera continua 1 min (decisão da 1.7.10.1).
- **Duelo de bônus pra mesa toda**: aviso na hora em que alguém cai na casa, faixa "🏟️ Duelo de bônus" na T2
  de todo dispositivo (escolhendo o adversário → escolhendo o Mestre → duelo X × Y · Mestre Z) e um segundo
  aviso quando o duelo começa ("X chamou Y pra duelar e Z pra ser o Mestre!").
- **Quem caiu escolhe o Mestre do duelo** (fora os dois duelistas). Com uma pessoa só de fora, ela é a Mestre
  e o aviso diz. No Equipe continua automático (a equipe de fora lê).
- **Voz**: "Jh" no começo do nome vira J ("Jhennyfer" saía "Guenifer") e a risada grudada no nick não é lida
  ("Jhenykkk" → "Jeny"). A voz nova não cai mais na robótica por 10 min depois de uma falha passageira
  (confere de novo em 1 min, e tenta mesmo sem resposta ainda), e espera 4 s (era 2,5) pelo 1º pedaço.
- **Joia de Animal**: o respiro da letra era em % (o navegador calcula pela largura da linha), e no placar das
  joias o triângulo virava uma torre. Agora é em em.
