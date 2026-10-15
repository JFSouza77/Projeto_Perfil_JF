# Telemetria — plano (para JF decidir)

**Estado:** plano. Nada é enviado hoje.
**Ideia do JF:** no fim da partida, o C.A.O.S. manda um resumo pro servidor, pra gente ver o que funciona e melhorar o jogo.

---

## 1. Regras de privacidade (proposta)

1. **Desligada por padrão.** Uma pergunta, uma vez: "Posso mandar um resumo anônimo da partida pra melhorar o jogo?" Sim / Não. Dá pra mudar depois nas opções.
2. **Sem nome, sem voz, sem conversa.** Jogador vira "J1, J2, J3". Nenhum texto digitado, nenhum áudio.
3. **Um resumo por partida**, mandado só pelo host (não um por celular).
4. **Guarda por 90 dias** e apaga sozinho.
5. Página de reportes (que já existe, com senha) ganha uma aba "Partidas".

## 2. O que vai no resumo

| Grupo | Dados |
|---|---|
| Partida | versão/build, modo, formato, condição de vitória, nº de jogadores, nº de aparelhos (online/local), duração, cartas jogadas |
| C.A.O.S. | falas no total, falas por minuto, maior rajada (falas em 60 s), falas cortadas pelo respiro, falas puladas, quem calou (quantos), se a sala inteira calou, voz ligada em quantos aparelhos |
| Cartas | por carta: id, categoria, dicas usadas, acertou/esgotou/descartou, tempo (já temos isso no log de cartas) |
| Ritmo | tempo médio por carta, por dica, cartas descartadas, Desfazer usado |
| Problemas | erros de página (só a mensagem), quedas de conexão, troca de host |

## 3. O que dá pra descobrir com isso

- A fala que **mais vezes é pulada** → reescrever ou tirar.
- Cartas que **quase ninguém acerta** ou que **todo mundo acerta na 1ª dica** → ajustar.
- Se o respiro do C.A.O.S. está curto ou longo (falas por minuto x quantos calaram).
- Quanto dura uma partida real em cada modo (ajuda a calibrar Corrida e Modo C.A.O.S.).
- Erros que só acontecem no celular de alguém.

## 4. Como construir (técnico, curto)

1. No jogo: `telemetriaResumo()` monta o objeto no fim da partida (endGame), só no host, só se a pessoa disse Sim.
2. Envia `POST /telemetria` pro servidor (o mesmo Worker do Cloudflare). Se estiver offline, guarda e tenta na próxima vez (no máximo 5 guardados).
3. No servidor: a mesma "caixa" dos reportes de carta (Durable Object), com limite de tamanho (8 KB por resumo) e por IP.
4. Página `/reportes` ganha a aba "Partidas" com médias simples.
5. Nada muda sozinho no jogo: JF e o Klaus olham os números e decidem.

## 5. Decisões do JF (15/10/2026)

- [x] **Pergunta de permissão:** as duas coisas. Pergunta no 1º uso **e** a opção fica nas configurações pra mudar depois.
- [x] **Guarda de 90 dias:** sim, desde que a gente confira os relatórios. Quando a telemetria existir, a rotina mensal
      ("Limpeza mensal do Perfil JF", todo dia 1º) passa a trazer também o resumo das partidas do mês pro JF ler.
- [x] **Texto das falas puladas:** sim, manda (é texto do próprio C.A.O.S., sem dado pessoal).
- [x] **Quando começar:** **depois** dos dois modos novos (Modo C.A.O.S. e Corrida contra o Tempo). Primeiro os modos;
      depois a telemetria entra junto com a próxima fase do cérebro do C.A.O.S. (ver `CAOS_Proximos_Passos.md`).
