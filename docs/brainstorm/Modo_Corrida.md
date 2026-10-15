# Modo Corrida contra o Tempo — brainstorm (para levar ao Gemini / GPT)

**Estado:** rascunho. Nada disso está no jogo ainda.
**Base:** handoff `HANDOFF_MODO_CORRIDA_CONTRA_O_TEMPO` (GPT + JF, 14/10/2026), revisado pelo Klaus (Claude Code) em 15/10/2026.

---

## 1. Em uma frase

O jeito que o JF jogava com os sobrinhos: **sem tabuleiro e sem pontos, quem acerta fica com a carta**. Mais dois relógios: **30 min de partida** e **2:30 por carta**. Acabou o tempo, vence quem tem mais cartas.

## 2. O que já está decidido (JF)

- Vitória = mais cartas quando o relógio geral zerar. Toda carta vale 1, com 1 dica ou com 10.
- Relógio geral de 30 min; **cada acerto dá +10 s** (uma vez por carta, sem teto por enquanto).
- Relógio da carta: 2:30 (Hardcore 1:30). Não reinicia por erro nem troca de vez.
- Carta expirou ou acabaram as dicas: sai sem dono, ninguém perde nada.
- Intervalo de 15 s entre cartas, com o relógio geral **congelado**.
- O jogador da vez **escolhe** a dica (não abre sozinha como no Express). Até 10 dicas por carta.
- Todas as categorias misturadas. Sem joias, tabuleiro, pontos.
- O C.A.O.S. comenta, mas não muda regra.

## 3. Perguntas abertas (com a minha recomendação)

| # | Pergunta | Recomendação do Klaus |
|---|---|---|
| 1 | Local, online ou os dois? | **Os dois.** Local é o jeito dos sobrinhos (um celular na mesa). |
| 2 | Quem é o Mestre? | **Roda a cada carta**, como no Clássico. Quem lê não responde. |
| 3 | Ordem de quem responde | Começa no jogador depois do Mestre e segue a roda. Errou ou o tempo acabou: passa pro próximo. |
| 4 | Tempo pra escolher e pra responder | 15 s + 15 s (Hardcore 10 + 10). Não escolheu: passa a vez **sem gastar dica**. |
| 5 | Como escolher as 10 dicas de cartas com mais de 10? | Sortear 10, **mas** garantir pelo menos 6 dicas "normais" (não especiais) e manter a numeração original na tela. |
| 6 | Hardcore muda o quê? | Só os relógios no 1º teste (1:30 por carta, 10 + 10 por vez). |
| 7 | Dicas especiais (avance/volte casas) | **Fora**, porque não tem tabuleiro. "Perde a vez" e "Palpite a qualquer hora" podem ficar (o palpite vira "rouba a vez"). |
| 8 | Zerou no meio de uma resposta | Termina a resposta aberta (no máximo o prazo dela) e acaba. Não começa carta nova. |
| 9 | Empate | **Desempate relâmpago**: 1 carta, quem acertar primeiro leva. Se ninguém, empate. |
| 10 | +10 s sem teto prolonga demais? | Medir no teste. Se passar de 40 min reais, colocar teto de +5 min. |
| 11 | Nome | **Contra o Relógio** (curto e claro). Alternativas: No Limite, Tempo Valendo, Último Segundo, Corre!. |

## 4. O que já existe no código e ajuda

- Cronômetro por carta e por vez (Express), o relógio da sala no online.
- Histórico de quem acertou cada carta (dá pra virar a "coleção de troféus").
- Escolha de dica pelo jogador da vez (é o fluxo normal do Clássico).

## 5. Perguntas pra fazer ao Gemini

- 30 min é longo demais pra um modo "rápido"? 20 min com +10 s funciona melhor?
- Como mostrar a "coleção de cartas" de cada jogador de um jeito divertido (pilha de cartas, troféus)?
- Vale ter um evento de "últimos 2 minutos" (relógio da carta cai pra 1 min, por exemplo)?
- O +10 s por acerto pode criar partidas que nunca acabam numa mesa muito boa?
