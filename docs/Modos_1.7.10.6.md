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

## Peça ao C.A.O.S.

Entra nestas versões: o jogador pede pra ele falar mais/menos e usar humor mais leve/mais ácido. Preferência
pessoal (de quem pediu), nunca fura o mudo, não muda regra nem placar.

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

Observação: a regra antiga dizia "o C.A.O.S. comenta, mas não muda regra". Bomba e Duelo são o C.A.O.S. mexendo na partida
de propósito: é uma mudança de filosofia que o JF está aprovando agora.
