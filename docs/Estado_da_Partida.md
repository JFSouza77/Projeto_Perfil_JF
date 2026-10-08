# Estado da Partida

Inventário do estado global do jogo (`src/js/02-estado.js` e módulos 02b/02c), feito na **1.7.7.4 · Foundation and Structure Update, Parte 5**.

Este documento serve para separar três coisas que hoje vivem misturadas:

1. **Regra:** decide a partida. Na 1.7.9 só o host vai mudar esse estado, e os outros aparelhos recebem o retrato.
2. **C.A.O.S.:** comentário, emoção e memória. Nunca decide nada (1ª lei, protegida pela espinha).
3. **Tela:** o que só existe neste aparelho, como animação, relógio visual, cadastro em andamento e painéis abertos.

São 258 variáveis no estado global: 136 do C.A.O.S. (`caos*`) e 122 do jogo. 77 vão para o save (`perfil200_state`, versão 12).

---

## 1. Regra (decide a partida)

### Identidade (1.7.7.1 e 1.7.7.2)

| Variável | No save | Observação |
|---|---|---|
| `players` | sim | cada jogador com `id` fixo (`j_…`) |
| `matchId` | sim | nasce no início e é preservado ao retomar |
| `deck`, `currentCard`, `allCards` | sim | pelo `id` da carta (`ANO-0001`) e pela resposta |
| `teams`, `teamOrder`, `teamRoundIndex` | sim | a chave das equipes é o id da equipe |

### Configuração da partida

| Variável | No save |
|---|---|
| `CURRENT_MODE`, `CURRENT_FORMAT`, `equipeSubMode` | sim |
| `WIN_CONDITION`, `WINNING_SCORE`, `casaSorteado` | sim |
| `expressSelectedCategories`, `expressFlavor` | sim |
| `oldSchoolAcess`, `RESPONSE_TIME_LIMIT` | sim |

### Turno e carta

| Variável | No save | Observação |
|---|---|---|
| `mestreIndex`, `responderIndex` | sim | ainda são posição ("assento"); na 1.7.8 viram id |
| `playDirection`, `starterChosen`, `gameEnded` | sim | |
| `cardState`, `revealedOrder`, `pendingIndex` | sim | ao retomar, a carta em jogo continua na mesa, com as dicas abertas |
| `pendingBonusQueue`, `bonusOrigMestreIdx` | sim | |
| `ffaCandidateQueue`, `ffaWrongCount` | sim | |
| `expressStealSavedResponder`, `expressWhoFreeze` | sim | |
| `expressAskWho`, `expressTargetAction` | não | escolha momentânea no Express (quem acertou / alvo da surpresa); ao retomar no meio dela, a escolha recomeça |

### Placar e vitória

| Variável | No save | Observação |
|---|---|---|
| `palpiteHolders`, `palpiteStock` | sim | chave: id do jogador (Versus) ou da equipe |
| `joiasRodada`, `gemWinner` | sim | por id |
| `rodadaAtual`, `primeiroMestreId`, `ultimaRodada`, `ultimaRodadaQuem` | sim | |
| `mercyEventUsed`, `stats`, `history`, `usedAtLeastOnce` | sim | |
| `consecutiveDiscards` | sim | |
| `consecutiveExhausted`, `streakCount`, `streakScorerIdx`, `starterDrawCount`, `cardWrongCount` | **sim, desde a 1.7.7.4** | antes se perdiam ao recarregar a página; a sequência é guardada pelo id (`streakId`) |

### Relógios

| Variável | No save | Observação |
|---|---|---|
| `timerEndAt`, `timerKind`, `cardEndAt`, `pendingStartTime` | sim | o C.A.O.S. pode dar tempo, nunca tirar (espinha) |
| `pausedAt`, `pausedKind`, `pausedRemainingSeconds`, `pausedCardRemaining`, `pausaExpirada` | sim | |
| `tempoJogoMs`, `tempoPausaMs` (05f) | sim | duração só com o tempo jogando |

### Sorteios de regra (1.7.7.4)

Todo sorteio que decide o jogo passa por `sorteioRegra()` (`js/02c-sorteio.js`):

- embaralhar o baralho e devolver uma carta a ele;
- quantas instruções especiais entram no Hardcore;
- o modo da Moda da Casa;
- as categorias e o modo sorteados;
- o alvo automático das surpresas;
- o 1º Mestre;
- o evento de misericórdia;
- Duelo ou Todos.

`sorteioSemear(n)` repete a mesma sequência (só em testes). `sorteioContagem` vai para o save.

---

## 2. C.A.O.S. (nunca decide)

São 136 variáveis `caos*`. Vão para o save as que dão continuidade à partida:

| Grupo | Variáveis no save |
|---|---|
| Cansaço e silêncio | `caosFatigueLevel`, `caosFatiguePlan`, `caosSilenced` |
| Saída temporária | `caosCortes`, `caosSaidaTemp`, `caosSaidasTensao` |
| Mesa | `caosMesa`, `caosAposta`, `caosCatSeq`, `caosCofrinho` |
| Histórico | `caosMatchLog`, `caosRitmoLog`, `caosEmoHist` |
| Tempo da partida | `caosPartidaInicioAt`, `caosPartidaFimAt` |

Também vão para o save as partes salvas por `caosExtraSalvar()`: vínculos, emoções e console.

A memória entre partidas fica em chaves próprias, fora do save da partida: `perfil5_*` e as fichas da mesa.

No online, o C.A.O.S. roda em **um** aparelho, o host. As falas vão pelo canal (`caosCanalRegistrar`), que já anota para quem cada fala é.

---

## 3. Tela (só deste aparelho)

Nada disto vai para o retrato da rede:

- **Cadastro:** `selectedColor`, `selectedAvatar`, `selectedHumor`, `selectedAgeBracket`, `cad*`, `nick*`, `iniFluxo`.
- **Painéis abertos:** `showHistory`, `showStats`, `showHall`, `tutorialPos`, `vozPainelAberto`, `pauseTip*`.
- **Animação e som:** `splash*`, `lastSplashColor`, `rouletteToken`, `soundOn`, `vibraOn`, `lastBeepSecond`, `audioTravadoToques`.
- **Avisos e balões:** `toast*`, `activeToastState`, `overlay*`, `timeoutOverlayMessage`, `microAmbienteSerial`.
- **Resposta escondida:** `answerRevealUntil`, `answerEscondidaCarta`, `answerHideRef`, `answerChecksThisCard`.
- **Controle interno:** `timerInterval`, `timerSerial`, `cardSerial`, `cartaSeq`, `wakeLockRef`, `lastTimerTick`, `autoPauseBlurRef`, `orderCountdownInterval`.
- **ADM:** `admCriadorLogado`, `admMsgPendente`. O ADM principal (`admPrincipalId`) é regra e vai para o save.
- **Save importado:** `saveBloqueado`.

---

## 4. Três coisas diferentes (para a 1.7.8)

| | Para que serve | Onde |
|---|---|---|
| **Save** | retomar a partida neste aparelho | `saveGameState` / `loadGameState` |
| **Foto da espinha** | desfazer o que o C.A.O.S. mexer, dentro de uma rotina | `caosEspinhaFoto` |
| **Retrato da partida** (GameSnapshot) | mandar o estado de regra para os outros aparelhos | 1.7.8: só a seção 1 deste documento |

O retrato da 1.7.8 nasce da seção 1, e cada ação (`dispatchAction`) leva `matchId`, `actorId` (o id do jogador) e a revisão esperada.
