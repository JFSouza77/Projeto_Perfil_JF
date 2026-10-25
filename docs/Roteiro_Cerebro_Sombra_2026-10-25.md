# Cérebro do C.A.O.S. em modo sombra: roteiro revisado (25/10/2026)

**Origem:** roteiro de 28/09/2026 (Beta 1.5.0, `perfil_jf_Beta_1_5_0_ROTEIRO_CEREBRO_CAOS_SOMBRA.md`), que o JF mandou de novo
nesta conversa. **Revisão:** Claude, conferindo cada ponto contra o código atual (Beta 1.7.10.9.3, C.A.O.S. 5.0.1, build 1841).
**Status:** passos 1 e 2 feitos no C.A.O.S. 5.1.0 (build 1842), com o OK do JF. Passo 3 espera o teste de mesa.
Decisões do JF (25/10): orçamento do passo 3 fica o de hoje (até 6 por carta, com respiro e Tato); versão 5.1, não 6.0.

A ideia continua a mesma: deixar o C.A.O.S. com mais cara de IA que pensa antes de falar, **sem** dar a ele poder sobre o jogo.

---

## 1. O que mudou desde o roteiro original

O roteiro foi escrito para o arquivo único da 1.5.0. De lá pra cá o jogo foi dividido em `src/`, ganhou online, e o C.A.O.S.
ganhou várias peças que cobrem parte do que o roteiro pedia.

### Já existe (não precisa fazer de novo)

| O roteiro pedia | O que já tem hoje | Onde |
|---|---|---|
| Funil de falas | `showToastMessage` continua sendo o funil, e ganhou fila (`caosFalaAgendar`, `caosFalarDepois`) | `07-caos/09-vinculos-silencio-e-balao.js`, `04-turno-e-rodada.js`, `07-caos/03-memoria-e-mesa.js` |
| Saber de qual banco veio a fala | `caosBankId` e `caosLastPick` (banco, chave e texto da última fala) | `07-caos/01-nucleo-e-falas.js` |
| Orçamento de fala | Pulmão/respiro (4.3): no máx. 6 comentários por carta, 12 em 3 cartas, respiro de 3,5 s (9 s em rajada). Modo C.A.O.S.: calado na hora de decidir, 1 fala por vez | `CAOS_FALAS_POR_CARTA`, `CAOS_RESPIRO_*` (js/01) |
| Decidir calar | `caosSilencioTalvez` (silêncio de tempero) e o Tato (5.0): encurta ou pula fala quando a mesa corta | `07-caos/06-humanizacao.js`, `07-caos/14-tato.js` |
| Emoção e humor | Console de 10 emoções, misturas, escada de rostos, temperamento, matriz de humor | `07-caos/05-emocoes-e-rede-neural.js` |
| Aba Decisões no Inspetor | Existe (`📜 Decisões`), mostra as últimas 40 entradas do `caosLog` | `07-caos/02-cerebro-adm.js` |
| Percepção e memória entre partidas | Fichas por jogador (emoji, humor, sorteio, recorde, tempo médio, categorias), memória da mesa, datas | `08-salvamento.js`, `07-caos/03-memoria-e-mesa.js` |
| Falas que citam fatos | Já existem em vários bancos (memória, recordes, sequência) e o contexto é conferido (`caosContextoOk`) | `07-caos/01-nucleo-e-falas.js` |
| Partida simulada com semente | `simular_partidas.js --semente=N --replay` | `ferramentas/` |

### Divergências (o roteiro está desatualizado aqui)

| Roteiro de 28/09 | Hoje |
|---|---|
| "~103 pontos de fala" | Bem mais: **123** chamadas de `showToastMessage`, **37** de `caosFalaAgendar`, **16** de `caosFalarDepois`, **6** de `admFala` e **310** de `getRandomReaction` |
| Linhas da fonte 1.5.0 (`~10471`, `~12878`…) | Não valem mais. Os pontos certos estão na tabela acima |
| Orçamento "1 fala espontânea a cada 2 cartas" | Hoje são até **6 por carta** (calibrado com a mesa nas 4.3/4.4). Ir pra 1 a cada 2 cartas seria uma mudança enorme no jeito dele. **Decisão do JF** |
| Versão alvo "C.A.O.S. 4.0" | Ele está na 5.0.1. E a regra atual é: **qualquer mexida sobe a versão**. Então os passos 1 e 2 sobem a terceira casa (5.0.2, 5.0.3) e o passo 3 sobe a do meio (**5.1.0**, ou 6.0.0 se o JF quiser marcar) |
| `rodar_testes.sh`, "19 testes + 13 cenários", `cmp_cartas.js`, `tstats.js`, MANUAL_DE_DEBUG, CHANGELOG | Nenhum desses existe mais. Hoje: bateria em `ferramentas/` (votação, aviso, baralho, corrida, ações, telão, botões, duelo, idade, loja, identidade, espinha, rede, replay, macaco), mais contas, nomes, geradores, falas e online. Registro em `HISTÓRICO` (`src/html/01-cabeca.html`) e `docs/Registro_de_Versoes.md` |
| "Animação só por JS, nunca `@keyframes`" | O balão com emoção (4.4.3) já usa `@keyframes` (só translate/rotate/scale, parado com Batata e Menos movimento). A regra antiga não vale mais assim |
| "Contagens em múltiplos de 5" | Continua, e agora é regra fixa (`CLAUDE.md`): total **e** cada grupo |
| "Cartas: não mexer" | Continua |

---

## 2. Regras que não podem quebrar (atualizadas)

- HTML/JS puro, funciona offline. **Nada de modelo de linguagem em tempo real.**
- **A fala nunca atrasa o jogo.** Se o cérebro demorar ou der erro, a fala sai do jeito antigo.
- **Ele só fala.** Pontos, turno, cartas, regras, respostas, dicas e votação ficam fora do alcance dele.
- Sem palavrão, sem revelar resposta ou dica antes da hora, filtros do Júnior e do Family friendly valendo.
- Online: o host decide a fala e manda pros aparelhos como hoje (nada muda na rede).
- Quantidades terminam em 0 ou 5.
- Fonte em `src/`, `node montar.js` e `node build.js`; bateria inteira verde antes de publicar.

## 3. Os três passos (adaptados)

### Passo 1: um registro único das falas (zero mudança no que a mesa vê)

Em vez de reescrever as 170+ chamadas uma por uma (alto risco de quebrar), o registro entra **dentro do funil**:

- `caosEmit(evento, dados)` é chamado por dentro de `showToastMessage`, `caosFalaAgendar` e `caosFalarDepois`. O evento sai do
  `caosBankId` da fala (já existe) ou de uma etiqueta passada nos poucos pontos que não têm banco.
- **Inventário automático:** um script (`ferramentas/caos_inventario.js`) lista todos os pontos de fala (arquivo, linha, banco,
  gatilho). Ele vira documento e serve de base pros passos seguintes.
- **Teste de igualdade:** com semente fixa, a sequência de falas (texto e emoção) é idêntica antes e depois, em 5 partidas
  simuladas.
- C.A.O.S. 5.0.2.

### Passo 2: modo sombra (decide, anota, não fala)

- **Percepção (`caosVisao`)**, só leitura: quem lidera, sequências, quem está perto da chegada, tempo da carta, dificuldade,
  e a ficha de cada jogador.
- **Decisão:** para cada momento, lista as falas candidatas com nota (novidade, gravidade, relevância pra quem jogou, se já foi
  dita, cansaço da mesa pelo Tato) e escolhe uma ou o silêncio. **Quem fala continua sendo o sistema atual.** O cérebro só
  anota: "eu teria falado X (nota 0,8) porque Y; o sistema falou Z".
- A aba **📜 Decisões** do Inspetor ganha essa comparação por carta.
- Chave `caosCerebro.on`, desligada por padrão, guardada no aparelho.
- **Invariância:** mesma partida, mesma semente, cérebro ligado e desligado: pontos, turnos, cartas e respostas idênticos.
- **Métrica:** em 300 cartas simuladas, o cérebro teria falado entre 40% e 60% das vezes, com pelo menos 5 tipos de fala
  diferentes por partida.
- C.A.O.S. 5.0.3.

### Passo 3: valer (só depois de jogar com a mesa e com o OK do JF)

- Liga a decisão de verdade: silêncio real nas falas de tempero. Falas obrigatórias nunca são cortadas: regra, joia, vitória,
  Absurdo, fim de jogo, avisos de tempo e da mesa.
- Falas que citam fatos montadas só a partir da percepção (ex.: "Três erros seguidos. Eu anotei.").
- Botão pra voltar ao jeito antigo.
- Aqui entra também o pedido do JF de 25/10: **interface neural melhor e reações e emoções mais calibradas**, usando a ficha
  de cada jogador.
- C.A.O.S. 5.1.0 (ou 6.0.0).

## 4. Testes (feito: um arquivo, 5 conferências)

`ferramentas/teste_cerebro.js`:

| Conferência | O que confere |
|---|---|
| Inventário | Todo banco citado nos pontos de fala existe e `docs/CAOS_Inventario_de_Falas.md` está em dia |
| Igualdade | Com o mesmo sorteio, 300 jogadas dão as mesmas falas (texto e emoção) e o mesmo número de sorteios com o registro desligado, ligado e com o cérebro em sombra |
| Invariância | Partida jogada com o cérebro desligado e repetida (replay) com ele ligado chega ao mesmo estado (`simular_partidas.js --cerebro`) |
| Sombra | 40% a 60% de "falaria" em 300 cartas, 5 tipos ou mais por partida |
| Limites | Orçamento por carta, Absurdo sempre, Júnior sem zoeira, nenhum sorteio, jogo intocado |

No passo 3 entra a conferência de fatos (toda fala que cita número bate com a partida).

## 5. Fora do escopo

- Modelo de linguagem em tempo real.
- Mudar cartas, regras, pontuação, duelo ou votação.
- Personalidade que muda o jogo (fica só no tom).

## 6. Decisões do JF antes de começar

1. **Quando:** começar agora (passos 1 e 2 não mudam nada que a mesa vê) ou só depois das sessões de teste?
2. **Orçamento do passo 3:** manter o de hoje (até 6 por carta, com respiro e Tato) ou baixar? O roteiro antigo falava em 1 a
   cada 2 cartas, o que deixaria ele bem mais quieto.
3. **Versão do passo 3:** 5.1.0 ou 6.0.0?

## 7. Checklist

- [x] Inventário automático dos pontos de fala
- [x] Passo 1: `caosEmit` no funil + teste de igualdade
- [x] Passo 2: percepção e decisão em sombra, chave desligada, aba Decisões comparando
- [x] Passo 2: invariância e métrica passando
- [x] Teste novo na bateria (5 conferências); bateria inteira verde
- [x] HISTÓRICO com origem (conversa do JF com Claude) e motivo
- [ ] Passo 3 só depois do teste de mesa e com aprovação do JF
