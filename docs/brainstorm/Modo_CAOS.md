# Modo C.A.O.S. — brainstorm (para levar ao Gemini / GPT)

**Estado:** rascunho. Nada disso está no jogo ainda.
**Base:** handoff `HANDOFF_MODO_C.A.O.S._1.7.10.5` (GPT + JF, 14/10/2026), revisado pelo Klaus (Claude Code) em 15/10/2026.
**Como usar:** cada pergunta tem a minha recomendação. JF decide; as outras IAs podem contestar.

---

## 1. Em uma frase

Online, cada um no seu aparelho. Cada jogador tem **uma carta secreta por rodada**. O Mestre roda: a cada vez, uma dica da carta dele abre pra todos. Quem acertar **captura a carta** (1 carta = 1 ponto). O C.A.O.S. mexe na partida: roubos, duelos e uma intervenção no placar.

## 2. O que já está decidido (JF)

- Só online, 1 aparelho por pessoa. Individual (equipes, talvez depois).
- 1 carta secreta por jogador por rodada; 10 dicas embaralhadas; especiais do Express valem.
- Mestre roda. Ninguém acertou: a carta **pausa** e volta na próxima vez daquele Mestre, na dica seguinte.
- Acertou: captura a carta, 1 ponto. Sem tabuleiro, sem joias.
- T2 mostra o Mestre da vez, a categoria, a dica atual e as dicas já abertas **só daquela carta**.
- Roubo: ladrão sorteado entre quem não é líder; ele escolhe alvo com cartas iguais ou mais. Duelo sorteado.
- Intervenção no placar: no máximo 1 por partida, só neste modo.
- Provocação mais forte, mas sem xingar e sem atacar a pessoa.
- Relógios pro 1º teste: 10 min de partida, rodada até 5 min, janela de palpite de 15 s, intervalo de 15 s congelado. Acertar **não** dá tempo extra (isso é da Corrida).

## 3. Perguntas abertas (com a minha recomendação)

| # | Pergunta | Recomendação do Klaus |
|---|---|---|
| 1 | **Como se palpita?** Falando na call, ou digitando no aparelho? | Começar **falando** + botão **"Palpitar agora"** no aparelho (o mesmo que vamos fazer no modo normal). Quem toca primeiro trava a vez; o Mestre marca acertou/errou. Digitar fica pra depois. |
| 2 | Uma tentativa por pessoa por dica, ou várias? | **Uma.** Várias vira chute em massa. |
| 3 | O Mestre é dono da carta e julga o acerto: conflito de interesse? | Sim. Solução simples: a **resposta aparece pra mesa** quando o Mestre marca "acertou" (todos conferem). Se marcar "errou" e a pessoa contestar, a mesa vota (já temos votação no online). |
| 4 | Intervenção no placar: 1 no total ou 1 de cada tipo? | **1 no total**, sorteada de uma lista: tirar 1 carta (nunca abaixo de 1), dar 1 carta da reserva, passar 1 carta do líder pro último. Sempre anunciada pra todos. |
| 5 | "Doar ponto" cria carta do nada? | Não. Usa uma **reserva de cartas de evento** (cartas que expiraram sem dono). Mantém "1 carta = 1 ponto". |
| 6 | Piso de 1 carta vale pro roubo também? | **Não.** Só pra punição do C.A.O.S. No roubo, quem perde pode zerar. |
| 7 | Quando acontece o roubo? | **No intervalo entre rodadas**, no máximo 1 por intervalo, com chance (ex.: 40%). Nunca no meio de uma dica. |
| 8 | Revanche | 1 revanche imediata por roubo, mesmo duelo. Venceu: recupera a carta (e leva +1 só se o ladrão tiver outra). |
| 9 | Duelos | Os 4 (dado, pedra-papel-tesoura, cara ou coroa, par ou ímpar), melhor de 3, escolhas escondidas até travar. O host sorteia. |
| 10 | Empate no fim | **Empate compartilhado** no 1º teste. |
| 11 | Tempo acabou no meio de uma resposta | Termina a resposta aberta; não começa nada novo. |
| 12 | Mestre caiu da sala | A carta dele pausa e a vez pula. Voltou: segue. Host caiu: a sucessão que já existe. |
| 13 | Idade 16+ | Basear no **tom** do C.A.O.S., não na velocidade. Sugestão: modo liberado a partir do humor "Normal"; nunca no Júnior. |
| 14 | Nome | Manter "Modo C.A.O.S." (combina com o narrador). |

## 4. O que já existe no código e ajuda

- Sala online com host autoritativo, retrato da partida, painel por jogador, votação e sucessão de host.
- Fala dirigida que chega só no aparelho certo (4.2).
- Cronômetro do Express (por carta e por vez).
- Marcação de jogador (`caosMarked`), rancor, favoritos e ciúmes (4.3): base para a "lista negra" e o "favorito".

## 5. Ordem sugerida de construção

1. Rodada com 1 carta por jogador, Mestre rodando, carta pausando, captura.
2. Relógios (partida, rodada, janela, intervalo).
3. "Palpitar agora" no aparelho.
4. Roubo + 1 duelo (cara ou coroa).
5. Revanche, os outros duelos, intervenção no placar.

## 6. Perguntas pra fazer ao Gemini

- O ciclo "carta pausa e volta" fica claro pra quem joga pela 1ª vez? Como mostrar isso na tela?
- 15 s de janela é pouco numa call com 4 a 6 pessoas?
- Roubo + intervenção + duelo na mesma partida é caos demais, ou é o objetivo?
- Ideias de eventos do C.A.O.S. que mexam no jogo **sem** mexer no placar (ex.: embaralhar a ordem dos Mestres, esconder a categoria por uma dica).
