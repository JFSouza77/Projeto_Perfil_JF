# Handoff · Modo C.A.O.S. e Corrida contra o Tempo

**Para:** GPT (ou qualquer revisor externo) · **De:** Claude Code, a pedido do JF · **Data:** 19/10/2026
**Versão do jogo:** Beta 1.7.10.9.3 · C.A.O.S. 4.6.4 · build 1831

**Objetivo:** entregar o retrato completo e atual dos dois modos novos, com:
- regras;
- números;
- decisões e quem decidiu;
- origem das ideias (GPT, Gemini, JF, amigos, Claude);
- feedbacks de partida e o que já foi corrigido;
- o que ficou pra depois.

Com isso, a análise de fora pode sugerir melhorias sem refazer o que já foi discutido.

**Como ler:**
- O que está marcado como **regra (JF)** foi decidido pelo JF. Dá pra questionar, mas a palavra final é dele.
- Os números marcados como **balanceamento** foram calibrados pelo Claude, com aval do JF ("eu sou o arquiteto, você é o engenheiro"). É aqui que a revisão de fora mais ajuda.

---

## 0. Contexto em 1 minuto

- **Perfil JF:**
  - é um jogo de adivinhação inspirado no jogo de tabuleiro Perfil;
  - cada carta (Pessoa, Lugar, Coisa, Ano, Animal) tem até 20 dicas;
  - um **Mestre** lê as dicas e os outros tentam adivinhar.
- **Formato técnico:**
  - um único arquivo HTML que roda no navegador;
  - funciona num dispositivo só (offline, passando de mão em mão) ou online (cada um no seu dispositivo, com um **host** que manda na partida).
- **T2:** a tela dos jogadores, ou seja, a tela de quem não é o Mestre.
- **C.A.O.S.:** o narrador do jogo, um personagem com voz, humor e memória dos jogadores. Ele comenta, zoa e, num modo específico, apronta de verdade.
- **Modos antigos:** Clássico (com tabuleiro e joias), Hardcore, Old School, Júnior e Express (sem tabuleiro, por tempo).
- **Modos novos:** a Corrida e o Modo C.A.O.S. saíram na **1.7.10.6 (18/10/2026)**. Foram a promessa original da 1.7.10, junto com o multiplayer.
- **Bússola de design (JF, 19/10):**
  > "Se fosse uma criança de 12 anos jogando tudo em grupo, eles iriam conseguir jogar? E se fosse uma mesa de adultos de 30–40 anos, eles manteriam o foco e a vontade de jogar?"

  O JF esclareceu que isso é **nivelamento de intuição, não de dificuldade**: as mecânicas, os relógios e os modos têm de ser entendidos sem ler o manual. A dificuldade das cartas não entra nessa conta.

---

## 1. Corrida contra o Tempo

### 1.1 A ideia

É o jeito que o JF jogava com os sobrinhos: **sem tabuleiro, quem acerta fica com a carta**, contra um relógio de partida.
- O nome é "Corrida contra o Tempo", sem "Modo" na frente (regra JF).
- Funciona **no local (um dispositivo) e no online**.
- Funciona **no Versus e no Equipe**. No Equipe, o placar é a soma da equipe.

### 1.2 Fluxo de uma carta

1. **O Mestre roda a cada carta**, como no Clássico. Quem lê não responde.
2. **A vez de responder segue a roda**, começando no jogador depois do Mestre.
   - O jogador da vez **escolhe a dica** e depois **responde**.
   - Errou, ou o tempo acabou: passa pro próximo.
   - Não escolheu a tempo: passa a vez **sem gastar dica**.
3. **Dicas:** até 10 por carta, sorteadas entre as da carta. Pelo menos 6 são normais e 1 ou 2 são especiais.
   - As especiais de tabuleiro saem ("avance/volte casas", "escolha um jogador").
   - "Perde a vez" fica.
   - **"Palpite a qualquer hora" vira "Rouba a vez"**: quem tem a ficha toca e responde na hora (no online, o botão é "Roubar a vez!").
4. **Fim da carta:**
   - alguém acertou;
   - ou o relógio da carta zerou;
   - ou as dicas acabaram.

   Carta que morre sem acerto sai sem dono.
5. **Intervalo de 15 s** entre cartas, com o relógio geral **congelado**. Mostra o placar e, no online, a lojinha.

**Categorias (1.7.10.9.3, JF):** Pessoa, Lugar, Coisa e Animal. **Na Corrida não tem Ano.** O Animal é categoria própria, completada com bichos do Júnior.

### 1.3 Relógios (números atuais)

| Relógio | Valor | Observação |
|---|---|---|
| Partida (geral) | **30 min** | +10 s por carta acertada (uma vez por carta, sem teto). **Regra fixa do JF: não entra no balanceamento.** |
| Carta | **3:00** | Não reinicia por erro nem por troca de vez. Só corre com a carta aberta. |
| Vez | **15 s pra escolher + 25 s pra responder** | 1.7.10.9.3 (JF): não escolheu, uma dica de verdade abre sozinha e a vez continua. A resposta era 15 s até o JF achar "ridiculamente rápido" (1.7.10.6.1). |
| Intervalo | 15 s | Geral congelado. |
| Hardcore: carta | 1:30 correndo a 1,5× | |
| Hardcore: vez | 15 + 15 s | Era 10+10. |
| Janela relâmpago | 15 s | Usada no Hardcore e no Juízo Final. |

**Regras gerais dos relógios:**
- O geral também corre com a carta escondida, pra o Mestre não enrolar.
- Todos os relógios param na pausa, no aviso da mesa, no tutorial, no intervalo e nos avisos de tempo esgotado.
- Na 1.7.10.6.1, o C.A.O.S. parou de falar com a carta correndo. Antes ele também congelava os relógios quando falava.

### 1.4 Duas vitórias (regra JF; ideia do Gemini, 17/10)

O JF escolhe na tela de modos:
- **⏱️ Tempo (padrão):** a carta vale **os segundos que sobravam no relógio dela** na hora do acerto. Exemplo: acertou com 1:45 sobrando, ganha 105 pontos.
  - O valor "derrete" na tela: "💰 Acertou agora, vale N".
  - Vence quem somar mais pontos.
  - Empate em pontos: vence quem tem mais cartas. Empatou de novo: vitória dividida.
- **🃏 Cartas:** cada carta vale 1, com 1 dica ou com 10. Vence quem tiver mais cartas.
  - Empate: **desempate relâmpago**. Sai uma carta e só os empatados respondem; o Mestre é alguém de fora do empate. Ninguém acertou: empate.

**Coroas na tela final** (ideia do Gemini):
- ⏱️ **Senhor do Tempo:** mais pontos.
- 🃏 **Colecionador:** mais cartas.
- 🏆 **Dono da Corrida:** quando a mesma pessoa leva as duas.

O vencedor oficial é sempre o da vitória escolhida; a outra coroa é honraria.

**Último Suspiro:** o relógio geral zerou com uma resposta em andamento. Ela termina, mas não sai carta nova.

### 1.5 Penalidades (spec do JF, 17–18/10)

| Ação | Efeito |
|---|---|
| Errou | A carta perde **1 s**. Estouro do tempo de resposta conta como erro; demorar pra escolher, não. |
| Pulou ("nem tentou") | A carta perde **2 s**. |
| Resposta absurda | A carta perde **3 s** (pedido do JF, 18/10). |
| Carta morta (tempo ou dicas acabaram, sem acerto) | O **geral perde 1 min**. Não vale no duelo nem no desempate. |
| Desfazer um acerto | Tira a carta e os +10 s. O relógio da carta continua de onde estava. |

### 1.6 Eventos

Na Corrida, **o C.A.O.S. é só mestre de cerimônias** (regra JF, 17/10): quem sorteia bomba, duelo e anúncios é o **jogo**, e o C.A.O.S. finge que foi ele, pra dar clima. Ele **não mexe na partida** nesse modo.

- **💣 Bomba-Relógio** (ideia do Gemini):
  - É anunciada antes da carta, com tic-tac e borda laranja.
  - Sai 2 vezes por partida (4 no Hardcore), a partir da 3ª carta, espaçadas, e nunca nos 3 min finais.
  - Cada erro ou pulo tira **−5 s do geral**.
  - Desarmar (acertar) dá **+20 s** (no lugar dos +10 s).
  - Se ela explodir (carta morta): **−1 min** no geral.
- **⚖️ Juízo Final** (último minuto; o Gemini propôs "Morte Súbita"):
  - A tela pulsa vermelho.
  - As dicas abrem sozinhas e **qualquer um bate na mesa** pra responder (no online, "✋ Bater na mesa!").
  - Errou: −1 s e a próxima dica abre na hora.
  - Ninguém bateu em 15 s: a próxima abre sem castigo.
  - Acerto **não** dá +10 s, senão o minuto nunca acaba.
  - O Gemini sugeriu "cuspir uma dica a cada 3 s". O Claude descartou: ilegível.
- **⚔️ Duelo do C.A.O.S.** (ideia do JF, com tempero do Gemini, "Vida ou Morte"):
  - Até 2 por partida, com 3+ jogadores, a partir da 5ª carta, nunca nos 3 min finais nem no Juízo.
  - Sorteia 2 duelistas e o Mestre.
  - O geral congela e a carta corre a **2×**. Só os dois respondem.
  - O vencedor **rouba 25 pontos** (no Tempo). O Gemini sugeriu 50; ficou 25 porque 50 é mais do que muita carta vale.
  - Ninguém acertou: a carta é destruída, sem o −1 min.
- **🔥 Hardcore** (caixinha na tela de modos, vale pra Tempo e Cartas):
  - carta de 1:30 a 1,5×;
  - relâmpago o jogo todo (dicas abrem sozinhas, quem souber bate);
  - sem especiais;
  - mais bombas.
  - **Extreme (2×)** fica pra depois do playtest do Hardcore.

### 1.7 Lojinha de Sobrevivência

- **Onde:** só online, no intervalo, nas duas vitórias.
  - No Tempo, paga com pontos.
  - No Cartas, cada acerto dá **créditos** (os segundos que sobravam na carta), sem mexer no placar.
- **Regra JF (17/10):** **uma lojinha só pra mesa toda**, a mesma vitrine ao vivo em todos os dispositivos e na T2. **Quem comprar primeiro leva.**
- **Vitrine sorteada** a cada intervalo (pedido do JF, 18/10):
  - 4 itens, sorteados pelo peso;
  - 1 a 3 unidades de cada;
  - preço com ±20% de variação (de 5 em 5).
- **Nomes próprios da Corrida**, diferentes dos do Modo C.A.O.S. (pedido do JF).

| Item | Preço base | Peso | Efeito |
|---|---|---|---|
| ⏸️ Pausa Dramática | 30 | 3 (máx. 1) | O geral para 15 s na próxima carta (vale pra mesa toda). |
| 🌬️ Segundo Fôlego | 25 | 3 | +15 s em cada vez sua na próxima carta. |
| 🧯 Seguro do Relógio | 40 | 2 | Se a próxima carta morrer, a mesa não perde 1 min. |
| 🎟️ Passe Livre | 15 | 3 | Guarda: pula a sua vez sem gastar dica e sem os −2 s. |
| ⚡ Choque de Tempo | 30 | 2 | Guarda: +15 s no relógio da carta, quando quiser. |
| 🐷 Cofrinho | 25 | 2 | A sua próxima carta acertada vale +40 pontos. |
| ⏳ Ampulheta Extra | 35 | 1 (máx. 1) | +30 s no geral na hora (não sai no Juízo Final). |
| 🧲 Ímã de Pontos | 20 | 2 | Se outro acertar a próxima carta, você leva 20% do valor dela. |

**Raciocínio do balanceamento:** no Tempo, um acerto vale ~60–140 pontos. Item barato é aposta; item caro é seguro.

Ideias que não entraram:
- **"Dica de graça" comprada** (Gemini): não entra, porque a dica é de todo mundo e quem está na frente compraria vantagem.
- **"Sacrifício"** (Gemini, gastar 30 pontos pra congelar a carta 10 s): virou a ideia da lojinha.

**Itens funcionam na hora (regra do JF, 19/10):**
- não existe recarga (cooldown);
- comprou ou usou, vale naquele momento;
- os itens de "próxima carta" valem já na carta que abre depois do intervalo, que é onde a lojinha fica.

**Trava de leitura (1.7.10.9.3, JF):** a vitrine aparece quando o intervalo abre, mas os botões só liberam depois de 3 s. Vale também pra lojinha do Modo C.A.O.S.

### 1.8 Online

- O host decide tudo.
- A T2 e os dispositivos mostram as barras dos relógios e o intervalo com o placar.
- Pedido de dica e "Roubar a vez" chegam na hora; antes esperavam a batida de 4 s da sincronização.
- O save guarda os dois relógios e o desempate.

---

## 2. Modo C.A.O.S.

### 2.1 A ideia

**Online, cada um no seu dispositivo, cada um por si.** Cada jogador tem **a sua carta secreta por rodada** e é o Mestre dela. Quem acertar a carta de outro **captura** a carta (1 carta = 1 ponto).

Aqui, o C.A.O.S. **apronta de verdade**: eventos, roubos, duelos e lojinha.
- **Base:** handoff do GPT + JF (14/10), revisado pelo Claude (15/10).
- **Camadas:** a do Gemini (lojinha com Pontos de Caos, drops e eventos de pânico) e as do JF.

### 2.2 Quem pode jogar (regra JF)

- **Só online**, 3+ jogadores, cada um no próprio dispositivo (o host conta como um).
- **Todos com 16+.** O raciocínio é rápido e o jogo é competitivo: "12 anos ainda é muito baixo" (JF).
  - A idade é obrigatória no cadastro, com faixas **menos de 12 / 12 a 15 / 16+**.
  - O dispositivo lembra **nome → faixa**. Se alguém marcar uma faixa maior que a lembrada, o jogo pede confirmação.
  - Quem não tem 16+ fica de fora, com um aviso que cita os nomes.
- Nunca no Júnior.

### 2.3 Fluxo de uma vez

1. **O Mestre roda.** Na vez dele, **uma dica da carta dele abre pra todos** (sozinha, 1,5 s depois).
2. **A janela de palpite é de 25 s** (era 15; a galera achou "rápido demais").
3. **Palpite falado (regra JF):**
   - quem souber toca em **"Palpitar agora"**; o primeiro trava;
   - a pessoa fala a resposta (na call ou na mesa) e o Mestre marca **Acertou/Errou**;
   - se o Mestre cair, o host julga.
   - Errou: não tenta de novo nessa dica.
4. **Anti-trapaça (regra JF):** quando o Mestre marca, **a resposta aparece pra todo mundo conferir**. O Mestre é dono da carta e também juiz, e isso foi aceito ("é normal, ué").
5. **Acertou:** captura a carta e a resposta aparece pra todos.
6. **Ninguém acertou:** a carta **hiberna** e volta na próxima vez daquele Mestre, na dica seguinte. Se as 10 dicas passarem sem acerto, a carta morre e a resposta aparece.
7. **Respiro de 4,5 s** antes da próxima vez, com o resultado na tela (ideia do Henrique; era 1,5 s).

### 2.4 Relógios

| Relógio | Valor |
|---|---|
| Partida | **15 min** (1.7.10.9.3, JF; era 10) |
| Rodada | até 5 min |
| Janela da dica | **25 s** (Turbo: 8 s) |
| Intervalo entre rodadas | 15 s, tudo congelado (lojinha e Piñata) |

- Acertar **não** dá tempo extra (isso é da Corrida).
- Duelo, carta bônus, intervalo e avisos não comem o relógio.
- O tempo acabou no meio de uma resposta: ela termina e não começa nada novo.

### 2.5 Pontos de Caos (PC)

É a moeda paralela da lojinha e **não conta no placar** (ideia do Gemini, que substituiu a "Mochila" do GPT).

| Ganho/perda | PC |
|---|---|
| Por rodada | +10 |
| Acertar nos 5 primeiros segundos da janela | +5 |
| Piñata | +30 |
| Encarar a carta bônus da Batata | +50 |
| Imposto da Preguiça | −10 |

**Balanceamento:** dá ~10–25 PC por rodada. Um item de 15–25 dá pra comprar toda rodada; um de 40+ exige guardar 2–3 rodadas.

### 2.6 Lojinha do C.A.O.S.

- Fica no intervalo, numa tela própria.
- É **uma só pra mesa**, e quem compra primeiro leva.
- **O que cada um comprou é segredo.**
- **Vitrine sorteada:** 5 itens, 1 a 3 de cada, preço ±20%.

| Item | Preço base | Peso | Efeito |
|---|---|---|---|
| ✂️ Tesoura do Caos | 15 | 3 | Na hora: a janela da dica cai pra 6 s. |
| 💖 Vida Extra | 20 | 3 | Errou? Ganha uma 2ª tentativa na mesma dica. |
| 🤐 Mordaça | 30 | 2 | Trava o botão de palpite de alguém nesta dica (o Mestre não). |
| 🧟 Ressurreição | 35 | 2 | Quando a carta for hibernar, a próxima dica é só pra você, com tentativa solo. |
| 🥶 Era do Gelo | 40 | 2 | Na hora: os outros ficam travados por 7 s e só você palpita. |
| 🪞 Espelho Refletor | 45 | 2 | Guarda: devolve a próxima agressão (roubo, mordaça, assalto, punição). |
| 🦺 Colete Anti-Caos | 60 | 1 | Guarda: anula 1 roubo, assalto ou punição contra você. |
| 👁️ Olho do C.A.O.S. | 45 | 1 | A 1ª letra da resposta aparece só pra você, naquela dica. |
| 💸 Assalto Relâmpago | 25 | 2 | Na compra, leva 15 PC de quem tem mais PC (o Colete segura, o Espelho devolve). |

**Itens na hora (1.7.10.9.1):** a Era do Gelo e a Tesoura não têm mais "janelinha certa".
- A Era do Gelo trava os outros por 7 s a partir de quando é usada (antes, só nos 3 primeiros s da dica).
- A Tesoura vale com mais de 6 s sobrando.

### 2.7 Eventos

**Regras gerais:**
- **No máximo um evento por vez**, sorteado entre uma vez e outra.
- Todo evento vem com o **aviso da mesa** (ver 3.1).
- **Nada de evento no primeiro minuto.**
- O topo da tela tem uma linha fixa ("Agora: vez de X · dica N") e mostra só a última novidade, sem feed rolando. Isso entrou na 1.7.10.7, porque o JF disse que o modo estava "caótico muito bagunçado".

| Evento | Quando | Cota | Como funciona |
|---|---|---|---|
| ⚔️ Roubo com duelo | ~7% por vez | 2/partida | Ladrão abaixo do topo × alguém com placar ≥ e pelo menos 1 carta. Duelo sorteado: 🎲 Dado, 🪙 Cara ou Coroa, ✊ Jokenpô ou ✌️ Par ou Ímpar. As escolhas ficam fechadas no host. Animado: mãozinha balançando, dado rolando, moeda girando. Depois tem **🔁 Revanche dobro ou nada**. Anúncio "É HORA DO DUELO!" estilo Yu-Gi-Oh (ideia do Rafa). |
| 🥔 Batata Quente | ~6% por vez | 2/partida | Dura 3 dicas. O dono escolhe **Passar pro próximo** ou **Segurar a Batata** (pedido do JF): quem segura encara na hora a **carta bônus**, com até 5 dicas automáticas e um juiz que recebe a resposta. |
| ⏩ Turbo | ~6% por vez | 2/partida | A carta de alguém roda com janela de 8 s. |
| 💸 Imposto da Preguiça | ~6% por vez, a partir da 2ª rodada | 3/partida | Quem não tocou em Palpitar na 1ª dica da vez paga 10 PC. É o equivalente do "palpite vazio", já que o palpite é falado. |
| 🧤 Mão Leve | No intervalo, a partir da 1ª rodada, 60% de chance | 1/partida | Entregue **em segredo** a alguém da metade de baixo do placar. **Só o roubado recebe o aviso**: "Mão Leve passou por aqui" (regra JF). |
| 🪅 Piñata | No intervalo, 45% de chance | até 3/partida | O primeiro a digitar a palavra ganha 30 PC. |

Espelho e Colete valem no roubo, na Mão Leve e na batata.

**🎁 Presente do C.A.O.S.** (1.7.10.9.2; é a "Mochila" do JF enxugada, ver `docs/Revisao_Pacote_GPT_2026-10-17.md`):
- É checado no intervalo, depois de 3 cartas encerradas.
- Se houver um líder só e um lanterna só com 2+ cartas de diferença, o lanterna ganha 1 item (Olho, Vida Extra ou Mordaça).
- Sai uma vez por partida.
- A mesa vê o aviso, mas o item é segredo.

### 2.8 Telas (como ficou depois do feedback de 18/10)

- **Mestre:**
  - a resposta da carta dele em destaque;
  - as dicas já abertas logo abaixo;
  - a categoria, em que dica está e o tempo com barra.
- **Quem palpita:**
  - quem é o Mestre;
  - a categoria grande;
  - a dica atual e a barra da janela;
  - o botão **Palpitar** logo abaixo da carta, sem rolar.
- **Quem está respondendo** aparece grande pra todos (ideia do Henrique).
- **T2:**
  - o Mestre da vez, a categoria e a dica atual;
  - as dicas já abertas **só daquela carta** (regra JF).

---

## 3. Sistemas que os dois modos usam

### 3.1 Aviso da mesa (1.7.10.7, pedido do JF)

- **Disparo:** todo evento importante (duelo, batata, Mão Leve, bomba, turbo, imposto, Juízo Final…).
- **O que acontece:**
  - **escurece a tela de todos, treme e vibra**;
  - **congela o tempo e os botões** de todo mundo até fechar.
- **Visual por tipo:** cada tipo tem a sua cor e o seu botão, sorteado de uma lista sem repetir o último:
  - duelo dourado; batata laranja; Mão Leve roxa; bomba vermelha; turbo azul; imposto verde;
  - exemplos de botão: "Socorro!" na bomba, "Tá quente!" na batata, "Vou me vingar!" na Mão Leve.
- **Convite de duelo:** o desafiado só tem o botão **"Bora!"**, sem recusar (regra JF). O Mestre do duelo também fica sabendo.
- **Reações variadas no resultado:** o jokenpô pode dar "Beleza!", "Droga!" ou "Na próxima eu ganho!"; a bomba pode dar "Kabum!" ou "Vai explodir!".
- **Robustez:** se o aviso der erro ao sortear ou publicar, ele mesmo assim termina e descongela. Um bug antigo deixava o relógio da Corrida parado pra sempre; foi corrigido na 1.7.10.9.

### 3.2 Outros

- **👀 Espectar duelo:** quem está fora de um duelo pode ver a resposta no próprio dispositivo ("Não sopra!").
- **🙋 Peça ao C.A.O.S.:**
  - pela pausa, cada jogador pede pra ele falar menos, normal ou mais com ele, e pegar mais leve ou mais ácido;
  - é preferência pessoal: nunca fura o mudo e não muda regra nem placar.
- **C.A.O.S. na Corrida:** não comenta com a carta correndo e fala no máximo uma vez entre cartas. Motivo: "falando muito tempo, quebra a concentração" (JF, 18/10).
- **Cartas menos repetidas (1.7.10.8):** o dispositivo lembra as cartas que já saíram (até 400) e elas vão pro fundo do baralho nas próximas partidas.
- **Host com um toque:** quem não entrou pelo próprio celular joga no dispositivo do host sem precisar ficar selecionando. Isso era a causa de "host não consegue comprar nem escolher dica".
- **Host que cai:** o host manda a cópia da partida pro sucessor e pra um reserva. O sucessor assume em 1 min; se ele não assumir, o reserva assume 20 s depois. A mesa vê a contagem.
- **Tutorial:** cada passo fica pelo menos 5 s na tela (JF: "tem que pelo menos demorar 5 segundos").

---

## 4. Quem trouxe o quê

| Origem | Contribuição |
|---|---|
| **JF** | A Corrida em si (jeito dos sobrinhos). Lojinha única pra mesa. C.A.O.S. só mestre de cerimônias na Corrida. "Segurar a Batata". Palpite falado. 16+. Penalidade de absurdo (−3 s). Aviso da mesa. Mão Leve secreta. Espectar duelo. 5 s por passo do tutorial. Vitrine sorteada. Nomes de itens diferentes por modo. Corrida em equipe e até 10 jogadores (5 equipes 🔴🔵🟢⚫⚪). |
| **GPT** | Handoffs-base dos dois modos (14/10): relógios, carta que hiberna, roubo/duelo/intervenção, "Mochila" (substituída). Filtra as ideias antes de chegarem ao Claude. |
| **Gemini** | Pontuação regressiva (carta vale o tempo restante) e as duas vitórias com coroas. Bomba-Relógio. Morte Súbita (virou Juízo Final). Duelo de Vida ou Morte. Sacrifício/Loja de Tempo. Pontos de Caos, drops e eventos de pânico do Modo C.A.O.S. Nomes de itens. |
| **Claude** | Balanceamento dos números (preços, cotas, janelas, durações), os ajustes "pra não quebrar" (tabela da seção 1.6), implementação e testes. |
| **Amigos** | **Rafa:** "É HORA DO DUELO!". **Henrique:** respiro antes da próxima carta e "quem está respondendo" grande. **Anne:** duelo avisado pra mesa toda, quem caiu escolhe o Mestre do duelo, destaque de nomes e papéis, botões que chamam. **Vitinho + Typingg:** bug do Alt-Tab. |

---

## 5. Feedbacks de partida e o que foi feito

| Data | Quem/onde | Feedback | Situação |
|---|---|---|---|
| 18/10 tarde | JF + Rafa + CarroPika (Henrique) + vineFA (Vitinho), Corrida online | "TÁ RIDICULAMENTE RÁPIDO" | Vez 15+15 → **25+25**; carta 2:30 → **3:00**; Hardcore 10+10 → 15+15; janela relâmpago 10 → 15 s. |
| 18/10 | idem | "C.A.O.S. falando muito quebra a concentração" | Calado com a carta correndo; no máximo 1 fala entre cartas. |
| 18/10 | idem | Host não conseguia comprar nem escolher dica | Causa: o dispositivo do host não estava "selecionado" pro jogador. Corrigido com o host em um toque. |
| 18/10 | idem | Não aparecia onde e como usar os itens | A lojinha mostra o que você tem guardado e onde aparece o botão "Usar". |
| 18/10 | idem | Lojinha tem de valer nas duas Corridas | Créditos no Cartas. |
| 18/10 | idem | Cores pouco contrastadas | Legendas da T2 refeitas, contraste ≥ 4,5:1. |
| 18/10 noite | Henrique (duelos 3–4×) | Duelo/jokenpô "aconteciam" sem ninguém ver | Aviso da mesa + duelos animados (3.1). |
| 18/10 noite | JF | "Modo C.A.O.S. caótico muito bagunçado" | Um evento por vez, linha fixa no topo, intervalo com tela própria. |
| 18/10 noite | JF | No Modo C.A.O.S. não dava pra ver Mestre, categoria, tempo, dicas abertas e a própria resposta | Telas refeitas (2.8). |
| 18/10 noite | JF | Corrida: depois de "errou", a próxima dica demorava e comia o tempo da carta | A próxima abre na hora. |
| 19/10 | JF (prints dos avisos) | "Muito bonitos", mas cada tipo podia ter a sua cor e o seu botão | Feito (3.1). |
| 19/10 | JF | Reações iguais ("uau") no jokenpô, moeda e dado; Mão Leve com 4 luvas; balões de tamanhos diferentes; cartas repetindo entre partidas | Reações variadas, 2 luvas, tamanhos iguais, memória de cartas. |
| 19/10 madrugada | Testes automáticos | Relógio da Corrida online parado pra sempre depois de um aviso (raro) | Corrigido (3.1). |

### Dados da partida de Corrida de 18/10 (vitória por Tempo, 4 jogadores, versão 1.7.10.6)

- Durou **26 min**: na época a base era de 20 min (já voltou pros 30), + bônus de acerto − mortes.
- Saíram **25 cartas**: **21 acertos**, 3 sem dono.
- Foram **12 pulos** e **4 absurdos**.

| Jogador | Acertos | Pontos | Pontos por acerto | Média de dicas | Pulos |
|---|---|---|---|---|---|
| vineFA | 8 | 972 | 121 | 2,9 | 3 |
| CarroPika | 7 | 458* | 80 | 4,9 | 4 |
| JF | 5 | 301* | 122 | 2,6 | 0 |
| BsLordRafa | 1 | 137 | 137 | 1 | 5 |

\* O placar final ficou abaixo da soma dos acertos (CarroPika 559 e JF 611 em acertos). O JF confirmou que foi a lojinha: o Henrique comprou desde o começo e o JF comprou muito depois que conseguiu acessar. Desde a 1.7.10.9.1, a lojinha mostra "ganhou × gastou" e os dados da partida têm uma seção **Lojinha**.

**Leituras do Claude** (pra revisão de fora confirmar ou contestar):
- A média de ~3,4 dicas por acerto com vez de 15 s ainda deu ~80–145 pontos por carta.
- O placar abre muito: um jogador ficou com 1 acerto em 26 min (Rafa, 5 pulos).
- Não existe mecânica de recuperação além do Ímã de Pontos e da Ampulheta.
- Cartas de **Ano** quase não saem acertadas (1 em 21, com 8 dicas, valendo 36). Na vitória por Tempo, elas valem pouco por natureza.

---

## 6. Pontos em aberto

### 6.1 Inconsistências conhecidas (pra corrigir)

- **Palpite a qualquer hora no Modo C.A.O.S.:** o handoff original dizia "especiais do Express valem", mas a 1ª versão saiu **só com dicas de verdade**. As especiais ficaram pra depois do playtest.

### 6.2 Ficou pra depois (decidido)

- Corrida **Extreme (2×)**, depois de jogar o Hardcore.
- **Intervenção no placar** do Modo C.A.O.S. (1 por partida: tirar uma carta / dar da reserva / passar do líder pro último). Estava no handoff do GPT e ainda não entrou.
- **Especiais do Express** no Modo C.A.O.S.
- **Palpite digitado** (hoje é falado).
- **Modo C.A.O.S. em equipes.**
- Ideias do Gemini/AI Studio pro narrador: "C.A.O.S., você ouviu isso?!", medidor de paciência, botão de opinião enigmática.

### 6.3 Perguntas pra análise de fora

1. **Corrida, recuperação:** como dar chance a quem ficou muito atrás sem punir quem joga bem? (Hoje: Ímã e Ampulheta na lojinha.)
2. **Corrida, cartas de Ano:** na vitória por Tempo elas valem pouco e quase ninguém acerta. Tirar da Corrida? Dar bônus? Relógio próprio?
3. **Corrida, ritmo dos 30 min (fixos, regra do JF):** com 25 s de vez e 3:00 de carta, o que manter dentro da partida pra mesa de 30–40 anos não perder o foco?
4. **Modo C.A.O.S., densidade de eventos:** ~25% de chance de evento por vez, mais o intervalo. É caos divertido ou ainda é bagunça pra quem joga a 1ª vez?
5. **Modo C.A.O.S., economia de PC:** 9 itens, vitrine de 5, ~10–25 PC por rodada numa partida de 10 min (umas 3–4 rodadas). Dá pra comprar algo relevante ou a lojinha fica decorativa?
6. **Modo C.A.O.S., 10 min:** com janela de 25 s e respiro de 4,5 s, quantas cartas cada um consegue ser Mestre? Vale subir pra 12–15 min?
7. **Intuição (bússola do JF):** o que uma criança de 12 anos ainda não entenderia sozinha nos dois modos? (Carta que hiberna, PC vs placar, Juízo Final, créditos da lojinha no Cartas…)
8. **Lojinha "quem compra primeiro leva":** favorece quem tem internet mais rápida ou está com o dedo pronto. Isso é parte da graça ou incomoda?

---

## 7. Onde está no código (se o revisor tiver acesso)

| Assunto | Arquivo |
|---|---|
| Constantes dos dois modos | `src/js/01-configuracao.js` (blocos `CORRIDA_*` e `MC_*`) |
| Corrida | `src/js/05o-corrida.js` (relógios, fim, desempate, placar) |
| Eventos da Corrida | `src/js/05p-corrida-eventos.js` (bomba, juízo, duelo, lojinha) |
| Modo C.A.O.S. | `src/js/05q-modo-caos.js` |
| Aviso da mesa | `src/js/05r-aviso-mesa.js` |
| Histórico de decisões | `docs/Modos_1.7.10.6.md`, `docs/brainstorm/Modo_CAOS.md`, `docs/brainstorm/Modo_Corrida.md` |
| Testes | `ferramentas/teste_corrida.js`, `ferramentas/teste_aviso.js`, `ferramentas/teste_loja_caos.js`, `ferramentas/teste_online.js --so=caos\|corrida` |
