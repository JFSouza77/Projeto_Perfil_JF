/* ======================================================================
 * 4. TURNO E RODADA (SORTEIO DE CARTA, DICAS, ACERTO/ERRO, ESPECIAIS, TIMERS, PAUSA, INÍCIO E FIM)
 * ====================================================================== */

function nextIndex(i) {
  if (players.length === 0) return 0;
  return (i + 1) % players.length;
}
function pickTeamMember(teamId) {
  const t = teams[teamId];
  if (!t || !t.members || t.members.length === 0) return null;
  const idx = t.members[t.memberCursor % t.members.length];
  t.memberCursor++;
  return idx;
}
function pickTeamMemberNot(teamId, avoid) {
  const t = teams[teamId];
  if (!t || !t.members || t.members.length === 0) return null;
  for (let i = 0; i < t.members.length; i++) {
    const idx = pickTeamMember(teamId);
    if (idx !== avoid) return idx;
  }
  return pickTeamMember(teamId);
}
function pickTeamMemberAfter(teamId, atual) {
  const t = teams[teamId];
  if (!t || !t.members || t.members.length === 0) return null;
  const i = t.members.indexOf(atual);
  if (i < 0) return pickTeamMember(teamId);
  const prox = t.members[(i + 1) % t.members.length];
  t.memberCursor = i + 2;
  return prox;
}
function pickTeamMestre(teamId) {
  const t = teams[teamId];
  if (!t || !t.members || t.members.length === 0) return null;
  const c = t.mestreCursor || 0;
  const idx = t.members[c % t.members.length];
  t.mestreCursor = c + 1;
  return idx;
}
function duelRepresentante(teamId) {
  const r = players[responderIndex];
  if (r && r.team === teamId && responderIndex !== mestreIndex) return responderIndex;
  return pickTeamMemberNot(teamId, mestreIndex);
}
function restoreBonusReader() {
  if (bonusOrigMestreIdx !== null && bonusOrigMestreIdx !== void 0 && players[bonusOrigMestreIdx])
    mestreIndex = bonusOrigMestreIdx;
  bonusOrigMestreIdx = null;
}
function setupBonusDuelTurn() {
  if (!currentCard || !currentCard.isBonus) return;
  const a = currentCard.bonusLanderPlayerIdx,
    b = currentCard.bonusOpponentPlayerIdx;
  if (!players[a] || !players[b]) return;
  responderIndex = a;
  if (mestreIndex !== a && mestreIndex !== b) return;
  let reader = null;
  if (CURRENT_FORMAT === "equipe") {
    const duelTeams = [players[a].team, players[b].team];
    reader = players.findIndex((p) => p.team && !duelTeams.includes(p.team));
    if (reader < 0) {
      const mt = players[mestreIndex] && players[mestreIndex].team;
      reader = players.findIndex((p, i) => p.team === mt && i !== a && i !== b);
    }
  } else {
    let c = mestreIndex;
    for (let i = 0; i < players.length; i++) {
      c = nextIndex(c);
      if (c !== a && c !== b) {
        reader = c;
        break;
      }
    }
  }
  if (reader === null || reader < 0) return;
  bonusOrigMestreIdx = mestreIndex;
  mestreIndex = reader;
}
function advanceResponderAfterFailure() {
  if (
    currentCard &&
    currentCard.isBonus &&
    players[currentCard.bonusLanderPlayerIdx] &&
    players[currentCard.bonusOpponentPlayerIdx]
  ) {
    return responderIndex === currentCard.bonusLanderPlayerIdx
      ? currentCard.bonusOpponentPlayerIdx
      : currentCard.bonusLanderPlayerIdx;
  }
  if (CURRENT_FORMAT === "equipe") {
    if (equipeSubMode === "ffa" && ffaCandidateQueue.length > 0) {
      ffaWrongCount++;
      return ffaCandidateQueue[ffaWrongCount % ffaCandidateQueue.length];
    }
    return pickTeamMemberAfter(players[responderIndex].team, responderIndex);
  }
  if (CURRENT_MODE === "express") return nextResponderStep(responderIndex);
  return nextResponder(responderIndex, mestreIndex);
}
// Começa a contagem de rodadas (chamado quando a partida começa).
function rodadaIniciar() {
  rodadaAtual = 1;
  joiasRodada = {};
  primeiroMestreId = jogadorIdDe(mestreIndex);
}
// Depois que o mestre muda: se voltou ao primeiro mestre (equipes: à 1ª equipe), começa nova rodada.
function rodadaChecarVirada() {
  if (CURRENT_FORMAT === "equipe") {
    if (teamOrder.length && teamRoundIndex % teamOrder.length === 0) rodadaVirar();
    return;
  }
  const m = players[mestreIndex];
  if (!m) return;
  if (!primeiroMestreId || jogadorIdxPorId(primeiroMestreId) < 0) {
    primeiroMestreId = m.id;
    return;
  }
  if (m.id === primeiroMestreId) rodadaVirar();
}
function rodadaVirar() {
  rodadaAtual++;
  joiasRodada = {};
  caosLog("rodada", "começou a rodada " + rodadaAtual);
}
// A rodada acabou de virar? (mestre de volta ao primeiro; equipes: 1ª equipe lendo de novo)
function rodadaNoComeco() {
  if (CURRENT_FORMAT === "equipe") return !!teamOrder.length && teamRoundIndex % teamOrder.length === 0;
  const m = players[mestreIndex];
  if (!m || !primeiroMestreId) return true;
  return m.id === primeiroMestreId;
}
// A última rodada vale agora? (Express encerra na hora, como sempre)
function ultimaRodadaAtiva() {
  return ULTIMA_RODADA && CURRENT_MODE !== "express";
}
// Alguém bateu a meta no meio da rodada: anuncia a última rodada e segue o jogo.
function ultimaRodadaComecar() {
  ultimaRodada = true;
  const eq = CURRENT_FORMAT === "equipe";
  let quem = "";
  if (gemWinner)
    quem =
      gemWinner.kind === "team" ? "Equipe " + TEAM_INFO[gemWinner.id].label : (jogadorPorId(gemWinner.id) || {}).name || "";
  else if (eq) {
    const id = [...teamOrder].sort((a, b) => rankValue(teams[b], b) - rankValue(teams[a], a))[0];
    quem = id ? "Equipe " + TEAM_INFO[id].label : "";
  } else quem = ([...players].sort((a, b) => rankValue(b) - rankValue(a))[0] || {}).name || "";
  ultimaRodadaQuem = quem;
  caosLog("rodada", `${quem} bateu a meta: última rodada (${rodadaAtual})`);
  updateDeckInfo();
  fxFloat("🏁 Última rodada!", "#fbbf24");
  showToastMessage(getRandomReaction(REACTIVE_VOICE.ultimaRodada, quem), null, false, true);
}
// Joia bloqueada pela trava: aviso curto na tela + fala do C.A.O.S.
function joiasTravaAvisar(scorerIdx) {
  const quem =
    CURRENT_FORMAT === "equipe"
      ? "Equipe " + ((TEAM_INFO[players[scorerIdx] && players[scorerIdx].team] || {}).label || "")
      : (players[scorerIdx] || {}).name || "";
  fxFloat(`🔒 ${quem}: limite de ${JOIAS_POR_RODADA} joias nesta rodada`, "#fbbf24");
  caosLog("joias", `${quem} bateu a trava de ${JOIAS_POR_RODADA} joias na rodada ${rodadaAtual}`);
  caosToastAtrasado(() => showToastMessage(getRandomReaction(REACTIVE_VOICE.joiasTrava, quem)), 2600);
}
// Moda da Casa: sorteia o modo da mesa (sem repetir o da partida anterior) e anuncia com suspense.
function casaSortearModo() {
  if (CURRENT_MODE === "express" || WIN_CONDITION !== "casa" || casaSorteado) return;
  let ultimo = "";
  try {
    ultimo = JFStore.getItem(CASA_ULTIMO_KEY) || "";
  } catch (e) {}
  const opcoes = CASA_MODOS.filter((m) => m !== ultimo);
  casaSorteado = sorteioItem(opcoes);
  try {
    JFStore.setItem(CASA_ULTIMO_KEY, casaSorteado);
  } catch (e) {}
  caosLog("casa", "sorteou o modo " + casaSorteado);
  casaAnunciar();
}
function advanceToNextCardTurn() {
  restoreBonusReader();
  if (CURRENT_FORMAT === "equipe" && teamOrder.length > 0) {
    teamRoundIndex++;
    const n = teamOrder.length;
    const readingTeam = teamOrder[teamRoundIndex % n];
    mestreIndex = pickTeamMestre(readingTeam);
    if (equipeSubMode === "ffa" && n > 2) {
      const others = teamOrder.filter((t) => t !== readingTeam);
      ffaCandidateQueue = shuffle(others).map((t) => pickTeamMember(t));
      ffaWrongCount = 0;
      responderIndex = ffaCandidateQueue[0];
    } else {
      const respondingTeam = teamOrder[(teamRoundIndex + 1) % n];
      ffaCandidateQueue = [];
      responderIndex = pickTeamMember(respondingTeam);
    }
    rodadaChecarVirada();
    return;
  }
  mestreIndex = nextIndex(mestreIndex);
  responderIndex = nextResponder(mestreIndex, mestreIndex);
  rodadaChecarVirada();
}
function nextResponder(fromIndex, mestre) {
  let c = nextIndex(fromIndex);
  if (c === mestre) c = nextIndex(c);
  return c;
}
function nextResponderStep(fromIndex, attemptsLeft) {
  if (attemptsLeft === void 0) attemptsLeft = players.length;
  let c = (fromIndex + playDirection + players.length) % players.length;
  if (c === mestreIndex) c = (c + playDirection + players.length) % players.length;
  if (players[c] && players[c].isBlocked) {
    players[c].isBlocked = false;
    if (attemptsLeft <= 1) return c;
    return nextResponderStep(c, attemptsLeft - 1);
  }
  return c;
}
function resetGame() {
  caosVoiceCancel();
  closeActiveToast();
  caosSorteioSilencio = false;
  document.querySelectorAll(".casa-sorteio-ov").forEach((o) => o.remove());
  aplicarCorRngSplash();
  clearOverlayTimeout();
  releaseWakeLock();
  clearInterval(orderCountdownInterval);
  pausedRemainingSeconds = null;
  pausedKind = null;
  pausedAt = null;
  pausaExpirada = false;
  document.getElementById("startGameBtn").style.display = "block";
  document.getElementById("resumeGameBtn").style.display = "none";
  document.getElementById("pauseBtn").style.display = "";
  document.getElementById("endGameBtn").style.display = "";
  players = [];
  starterChosen = false;
  mestreIndex = null;
  responderIndex = null;
  CURRENT_FORMAT = "versus";
  teams = {};
  teamOrder = [];
  teamRoundIndex = 0;
  ffaCandidateQueue = [];
  ffaWrongCount = 0;
  document.getElementById("drawStarterBtn").disabled = false;
  document.getElementById("drawStarterBtn").style.display = "block";
  document.getElementById("orderRevealSection").style.display = "none";
  document.getElementById("playAreaSection").style.display = "none";
  document.getElementById("playerPanel").style.display = "none";
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("welcomeScreen").style.display = "none";
  hidePauseScreen();
  document.getElementById("splashScreen").style.display = "";
  resetDeck();
  renderScoreboard();
  renderColorPicker();
  renderAvatarPicker();
  saveGameState();
}
function resetDeck() {
  caosPartidaSerial++;
  matchId = null;
  if (typeof partidaOnline !== "undefined") partidaOnline = false; // 1.7.9.9: partida nova começa sem ser online
  tabForma = null; // 1.7.9.2: partida nova, tabuleiro novo
  tabLobbyZerar(); // 1.7.9.4
  sorteioContagem = 0;
  acoesZerar();
  caosCatSeq = [];
  clearTimer();
  clearCardTimer();
  pausedCardRemaining = null;
  expressWhoFreeze = null;
  expressAskWho = false;
  history = [];
  showHistory = false;
  showStats = false;
  consecutiveDiscards = 0;
  consecutiveExhausted = 0;
  streakScorerIdx = null;
  streakCount = 0;
  caosEasterEggsUsed = new Set();
  caosFatigueLevel = "normal";
  caosSilenced = false;
  caosSaidaTemp = null;
  caosSaidasTensao = 0;
  caosCortes = { total: 0, por: {}, rancor: {} };
  caosAviaoLast = -99;
  caosAcidLastCard = -99;
  caosAcidLastIdx = null;
  caosLastAchievementCard = -99;
  caosCofrinho = 0;
  admPrincipalId = null;
  admMsgPendente = [];
  caosFatiguePlan = rollCaosFatiguePlan();
  caosSpontaneousCounter = 0;
  caosMemReset();
  caosPrediction = null;
  caosCardPrediction = null;
  pendingBonusQueue = [];
  bonusOrigMestreIdx = null;
  caosMatchLog = [];
  caosLastPick = null;
  caosViradaLimpar();
  caosDuploUlt = null;
  caosDuploN = 0;
  caosDuploCarta = -99;
  caosHumanizaReset();
  caosFila = [];
  caosGiriaUlt = -99;
  caosRepetidaN = 0;
  caosRepetidaAt = 0;
  playDirection = 1;
  expressStealSavedResponder = null;
  players.forEach((p) => {
    p.isBlocked = false;
  });
  stats = { totalDrawn: 0, totalDiscarded: 0, totalExhausted: 0 };
  mercyEventUsed = false;
  pendingStartTime = null;
  timeoutOverlayMessage = null;
  const fonteDeck = allCards.length > deckLimiteModo() ? shuffle(allCards).slice(0, deckLimiteModo()) : allCards;
  // o baralho é comprado do fim (deck.pop()); o embaralhamento equilibrado põe a ordem boa no começo,
  // então ele entra invertido. Antes não invertia, e a categoria com mais cartas dominava a partida.
  deck =
    CURRENT_MODE === "express"
      ? shuffle(fonteDeck)
      : embaralharEquilibrado(fonteDeck, CURRENT_MODE === "hardcore" ? CATEGORY_WEIGHTS_HARDCORE : null).reverse();
  currentCard = null;
  cardState = "none";
  gameEnded = false;
  revealedOrder = [];
  pendingIndex = null;
  palpiteStock = PALPITE_STOCK;
  palpiteHolders = {};
  gemWinner = null;
  casaSorteado = null;
  rodadaAtual = 1;
  primeiroMestreId = null;
  joiasRodada = {};
  ultimaRodada = false;
  ultimaRodadaQuem = "";
  players.forEach((p) => {
    p.gems = {};
    p.emo = { h: "" };
    p.estadoEmocional = null;
  });
  document.getElementById("winnerArea").innerHTML = "";
  document.getElementById("cardArea").style.display = "";
  document.getElementById("miniScoreboard").style.display = "";
  document.getElementById("deckInfo").style.display = "";
  document.getElementById("drawControls").style.display = "";
  updateDeckInfo();
  render();
  updateDrawAvailability();
  saveGameState();
}
function discardAndDraw() {
  if (gameEnded) return;
  clearTimer();
  stats.totalDiscarded++;
  caosCardPrediction = null;
  if (currentCard && currentCard.isBonus) {
    pendingBonusQueue.unshift({ landerIdx: currentCard.bonusLandedByIdx, opponentIdx: currentCard.bonusMestreIdx });
  }
  if (deck.length === 0) {
    currentCard = null;
    cardState = "none";
    endGame();
    return;
  }
  usedAtLeastOnce = true;
  consecutiveDiscards++;
  drawHidden();
}
function drawHidden() {
  roletaCarta = null;
  clearTimer();
  clearCardTimer();
  if (gameEnded) return;
  caosMudoVolta();
  expressStealSavedResponder = null;
  caosPrediction = null;
  if (CURRENT_MODE !== "express" && pendingBonusQueue.length > 0 && pendingBonusQueue[0].opponentIdx === null) {
    beginBonusChoice();
    return;
  }
  if (deck.length === 0) {
    currentCard = null;
    cardState = "none";
    endGame();
    return;
  }
  if (stats.totalDrawn === 0) maybeShowCaosPresentation();
  else {
    let falou = false;
    const transicaoMatriz = activeToastState ? null : caosMatrizTransitionLine();
    const transicaoRitmo = activeToastState ? null : caosMoodTransitionLine();
    const transicao = transicaoMatriz || transicaoRitmo;
    if (transicao) {
      showToastMessage(transicao);
      falou = true;
    }
    if (!falou && stats.totalDrawn >= 3 && stats.totalDrawn <= 5) falou = maybeShowNameReminder();
    if (!falou) falou = caosRelogioNaCarta();
    if (!falou) falou = caosMesaNaCarta();
    if (!falou) maybeShowCardChatter();
  }
  restoreBonusReader();
  caosAntiRepeticao();
  const rawCard = deck.pop();
  currentCard = { ...rawCard, clues: shuffle(rawCard.clues) };
  caosCatSeq.push(gemCategoryFor(rawCard.category));
  if (caosCatSeq.length > 6) caosCatSeq.shift();
  cartaSeq++;
  cardWrongCount = 0;
  answerRevealUntil = 0;
  clearTimeout(answerHideRef);
  answerChecksThisCard = 0;
  currentCard._caosDificuldade = caosCardMemOnDraw(currentCard.answer);
  currentCard._caosLimiar = caosVirtualLimiar(currentCard._caosDificuldade);
  if (!palpiteEnabled()) {
    currentCard.clues = currentCard.clues.filter((c) => !(c.type === "special" && isWildcardSpecial(c.text)));
  }
  if (CURRENT_MODE === "hardcore" || CURRENT_MODE === "express") {
    currentCard.clues = buildHardcoreClueSet(currentCard.clues);
  }
  if (CURRENT_MODE !== "express" && pendingBonusQueue.length > 0) {
    const entry = pendingBonusQueue.shift();
    currentCard.isBonus = true;
    currentCard.bonusLandedByIdx = entry.landerIdx;
    currentCard.bonusMestreIdx = entry.opponentIdx;
    currentCard.bonusLanderPlayerIdx =
      CURRENT_FORMAT === "equipe" ? duelRepresentante(entry.landerIdx) : entry.landerIdx;
    currentCard.bonusOpponentPlayerIdx =
      CURRENT_FORMAT === "equipe" ? duelRepresentante(entry.opponentIdx) : entry.opponentIdx;
    setupBonusDuelTurn();
  } else {
    currentCard.isBonus = false;
  }
  if (caosCardPrediction && caosCardPrediction.category !== gemCategoryFor(currentCard.category)) {
    showToastMessage(getRandomReaction(REACTIVE_VOICE.previsaoCartaCategoriaErrada));
    caosCardPrediction = null;
  }
  stats.totalDrawn++;
  caosNoteCardDrawn();
  maybeUpdateCaosFatigue();
  caosTalvezVoltar();
  setTimeout(() => caosIniMostrar(players[mestreIndex], "mestre"), 60);
  setTimeout(mestreAjudaNaCarta, 120);
  cardState = "hidden";
  revealedOrder = [];
  pendingIndex = null;
  updateDeckInfo();
  renderMiniScoreboard();
  render();
  saveGameState();
  tabLobbyTalvez();
}
function beginBonusChoice() {
  cardState = "bonusChoice";
  render();
  saveGameState();
  tabLobbyTalvez();
}
function chooseBonusOpponent(idx) {
  if (cardState !== "bonusChoice" || pendingBonusQueue.length === 0) return;
  if (CURRENT_FORMAT !== "equipe" && !players[idx]) return;
  if (CURRENT_FORMAT === "equipe" && !teams[idx]) return;
  pendingBonusQueue[0].opponentIdx = idx;
  drawHidden();
}
function flipCard() {
  if (cardState !== "hidden") return;
  document.getElementById("caosPergunta")?.remove();
  const fraseTopo = cartaFraseAntes();
  roletaCarta = null;
  cardState = "revealed";
  if (CURRENT_MODE === "express") startExpressCard();
  else startTimer("pick");
  maybeAnnounceCrystalBall();
  maybeShowAiCardEgg();
  caosImplicFlip();
  caosPausaMagoaCarta();
  caosRetaFinalTalvez();
  caosVinculoCarta();
  caosAusentesTalvez();
  caosSatisfacaoTalvez();
  caosEixosCarta();
  render();
  // 1.7.8.6: a frase da roleta sobe até o topo da carta e o resto aparece (o giro foi no "Ver carta")
  cartaFraseSobe(fraseTopo);
  saveGameState();
}
function checkWinnerThenDraw() {
  tabLobbyPendente = true; // 1.7.9.4: a carta acabou; o lobby do tabuleiro abre quando a próxima estiver pronta
  renderScoreboard();
  renderMiniScoreboard();
  if (ultimaRodadaAtiva() && (ultimaRodada || gemWinner || victoryReached())) {
    // a rodada fechou (todos jogaram o mesmo número de vezes): acabou
    if (rodadaNoComeco()) {
      endGame();
      return;
    }
    if (!ultimaRodada) ultimaRodadaComecar();
    if (CURRENT_FORMAT !== "equipe") maybeTriggerMercyEvent();
    if (!maybeAnnounceCardPrediction()) drawHidden();
    return;
  }
  if (gemWinner) {
    endGame();
    return;
  }
  if (CURRENT_MODE === "express") {
    if (deck.length === 0) {
      endGame();
      return;
    }
    if (!maybeAnnounceCardPrediction()) drawHidden();
    return;
  }
  if (victoryReached()) {
    endGame();
    return;
  }
  if (CURRENT_FORMAT === "equipe") {
    if (!maybeAnnounceCardPrediction()) drawHidden();
    return;
  }
  maybeTriggerMercyEvent();
  if (!maybeAnnounceCardPrediction()) drawHidden();
}
function resolveExhaustionIfNeeded() {
  if (!currentCard || gameEnded) return true;
  if (revealedOrder.length >= currentCard.clues.length) {
    clearCardTimer();
    stats.totalExhausted++;
    caosImplicFim(99);
    if (CURRENT_MODE !== "express") {
      caosEventoContexto = "carta esgotada — ninguém acertou";
      caosEmoNudge(-0.3, -0.8);
      caosEmoMaybeDecay();
    }
    consecutiveDiscards = 0;
    consecutiveExhausted++;
    const culpaMestre = caosMesaCulpaMestre();
    const temaEsgotou = caosCartaTema("esgotou");
    if (caosPrediction) {
      showToastMessage(getRandomReaction(REACTIVE_VOICE.bolaCristalErro) + caosBolaRegistrar(false));
      caosPrediction = null;
    } else if (caosCardPrediction && caosCardPrediction.answer) {
      showToastMessage(getRandomReaction(REACTIVE_VOICE.previsaoCartaPassouPerto));
      caosCardPrediction = null;
    } else if (caosCardPrediction) {
      caosCardPrediction = null;
    } else if (consecutiveExhausted === 2 && CURRENT_MODE !== "express") {
      playSfx("agonia");
      showToastMessage(getRandomReaction(REACTIVE_VOICE.mesaDormindo));
    } else if (
      caosOS() &&
      currentCard &&
      currentCard.classificacao === "oldschool" &&
      Math.random() < 0.45 &&
      stats.totalDrawn - (caosMesa.geracaoCarta || -99) >= 4
    ) {
      caosMesa.geracaoCarta = stats.totalDrawn;
      showToastMessage(getRandomReaction(REACTIVE_VOICE.mesa.geracao));
    } else if (temaEsgotou) {
      showToastMessage(temaEsgotou);
    } else if (culpaMestre) {
      showToastMessage(culpaMestre);
    } else if (CURRENT_MODE !== "express" && currentCard && currentCard.answer && Math.random() < 0.35) {
      showToastMessage(getRandomReaction(REACTIVE_VOICE.esgotouComResposta, currentCard.answer));
    }
    expressStealSavedResponder = null;
    if (CURRENT_MODE !== "express") {
      const totalCardPoints = currentCard.clues.length;
      const bonusMultiplier = currentCard && currentCard.isBonus ? 2 : 1;
      const hardcoreMultiplier = CURRENT_MODE === "hardcore" ? 2 : 1;
      const gained = totalCardPoints * bonusMultiplier * hardcoreMultiplier;
      creditPoints(mestreIndex, gained, true);
    }
    advanceToNextCardTurn();
    checkWinnerThenDraw();
    return true;
  }
  return false;
}
function clearTimer() {
  fxUrgente(false);
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerEndAt = null;
  timerKind = null;
}
function secondsLeft() {
  if (!timerEndAt) return 0;
  return Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1e3));
}
function startTimer(kind) {
  if (activeToastState && activeToastState.hadActiveTimer && !activeToastState.freezeEndedAt)
    activeToastState.freezeEndedAt = Date.now();
  clearTimer();
  timerSerial++;
  const durations = {
    pick: PICK_TIME_LIMIT + acessTempoExtra("pick"),
    response: RESPONSE_TIME_LIMIT + acessTempoExtra("response") + mestreTempoExtra("response"),
    special: SPECIAL_TIME_LIMIT + acessTempoExtra("special") + mestreTempoExtra("special"),
    turn: expressTimes().turn + acessTempoExtra("turn") + mestreTempoExtra("turn"),
  };
  timerKind = kind;
  timerEndAt = Date.now() + durations[kind] * 1e3;
  resumeTimerInterval();
  if (kind === "pick" || kind === "turn") setTimeout(() => caosIniMostrar(players[responderIndex], "vez"), 60);
}
function resumeTimerInterval() {
  if (timerInterval) clearInterval(timerInterval);
  lastTimerTick = Date.now();
  timerInterval = setInterval(() => {
    lastTimerTick = Date.now();
    updateTimerDisplay();
    maybeShowTimeWarning();
    maybeMicroAmbiente();
    caosTedioTick();
    if (CURRENT_MODE === "express" && cardEndAt && cardSecondsLeft() <= 0) {
      expressCardLost();
      return;
    }
    if (secondsLeft() <= 0) {
      const expiredKind = timerKind;
      clearTimer();
      onTimerExpired(expiredKind);
    }
  }, 1e3);
}
function clearOverlayTimeout() {
  if (overlayTimeoutRef) {
    clearTimeout(overlayTimeoutRef);
    overlayTimeoutRef = null;
  }
  pendingOverlayAction = null;
  timeoutOverlayMessage = null;
}
function resolveOverlayImmediately() {
  if (overlayTimeoutRef) {
    clearTimeout(overlayTimeoutRef);
    overlayTimeoutRef = null;
  }
  timeoutOverlayMessage = null;
  if (pendingOverlayAction) {
    const action = pendingOverlayAction;
    pendingOverlayAction = null;
    action();
  }
}
function autoResolveMoveSpecial(item) {
  if (!item || item.type !== "special" || CURRENT_MODE === "express") return false;
  const txt = (item.text || "").toLowerCase();
  if (txt.includes("escolha um jogador")) {
    const moveVal = txt.includes("avançar") ? 2 : -2;
    const myTeam = players[responderIndex] && players[responderIndex].team;
    if (CURRENT_FORMAT === "equipe") {
      const pool2 = teamOrder.filter((id) => id !== myTeam);
      if (!pool2.length) return false;
      applyTeamSpecialMove(sorteioItem(pool2), moveVal, true);
      return true;
    }
    const pool =
      palpiteParticipants() < 3 ? [mestreIndex] : players.map((p, i) => i).filter((i) => i !== responderIndex);
    const alvo = sorteioItem(pool);
    if (alvo === void 0 || alvo === null || !players[alvo]) return false;
    applySpecialMove(alvo, moveVal);
    return true;
  }
  const amount = txt.includes("avance 1 casa")
    ? 1
    : txt.includes("avance 2 casas")
      ? 2
      : txt.includes("volte 2 casas")
        ? -2
        : txt.includes("volte 3 casas")
          ? -3
          : 0;
  if (!amount) return false;
  applySpecialMove(responderIndex, amount);
  return true;
}
function onTimerExpired(kind) {
  if (gameEnded) return;
  fxUrgente(false);
  if (kind === "pick" || kind === "response" || kind === "turn") {
    vibrar("tempo");
    fxFlash("flash-laranja");
  }
  if (kind === "pick") {
    if (cardState === "revealed" && pendingIndex === null) {
      const skippedName = players[responderIndex] ? escapeHtml(players[responderIndex].name) : "?";
      if (CURRENT_MODE === "express" && expressStealSavedResponder !== null) {
        responderIndex = expressStealSavedResponder;
        expressStealSavedResponder = null;
      } else {
        responderIndex = advanceResponderAfterFailure();
      }
      startTimer("pick");
      // o aviso de tempo esgotado cobre a tela por 5 s: o próximo não perde esse tempo
      timerEndAt += 5e3;
      saveGameState();
      showTimeoutOverlay("⏰ TEMPO ESGOTADO!", `${skippedName} demorou pra escolher e perdeu a vez`, () => {
        render();
      });
    }
  } else if (kind === "response") {
    mestreObsEstouro();
    const skippedName = players[responderIndex] ? escapeHtml(players[responderIndex].name) : "?";
    showTimeoutOverlay("⏰ ACABOU O TEMPO!", `${skippedName} não respondeu a tempo`, () => {
      markWrong();
    });
  } else if (kind === "turn") {
    if (CURRENT_MODE === "express" && cardState === "revealed") {
      const it = pendingIndex !== null && currentCard ? currentCard.clues[pendingIndex] : null;
      if (it && it.type === "special") expressAutoSpecial(it);
      else {
        mestreObsEstouro();
        expressPass();
      }
    }
  } else if (kind === "special") {
    if (pendingIndex === null) return;
    const item = currentCard.clues[pendingIndex];
    if (item.type !== "special") return;
    if (CONTINUE_SAME_PLAYER_SPECIALS.has(item.text) || specialIsVoid(item)) {
      continueAfterSpecial();
    } else if (!autoResolveMoveSpecial(item)) {
      loseTurnAfterSpecial();
    }
  }
}
function chooseClue(idx) {
  if (cardState !== "revealed" || gameEnded) return;
  if (pendingIndex !== null) return;
  if (revealedOrder.some((r) => r.index === idx)) return;
  if (idx < 0 || idx >= currentCard.clues.length) return;
  if (!players[responderIndex]) return;
  const item = currentCard.clues[idx];
  const revealedEntry = {
    index: idx,
    item,
    pickedByName: players[responderIndex].name,
    pickedByColor: players[responderIndex].color,
    pickedByAvatar: players[responderIndex].avatar,
  };
  revealedOrder.push(revealedEntry);
  pendingIndex = idx;
  acessLerDica(idx + 1, item);
  if (item.type === "special" && isWildcardSpecial(item.text)) {
    revealedEntry.palpiteResult = grantPalpite(responderIndex);
    if (revealedEntry.palpiteResult === "ganhou") caosIniExplica(players[responderIndex], "palpite");
    if (revealedEntry.palpiteResult === "fominha") {
      const pf = players[responderIndex];
      caosLog("palpite", `${pf.name}: fominha (já tinha ficha)`);
      caosFalarDepois(
        getRandomReaction(
          playerHumor(pf) === "suave" ? REACTIVE_VOICE.fominha.suave : REACTIVE_VOICE.fominha.normal,
          pf.name,
        ),
      );
    }
  }
  if (item.type === "clue") {
    pendingStartTime = Date.now();
    startTimer("response");
    if (CURRENT_MODE !== "express") setTimeout(() => caosIniMostrar(players[mestreIndex], "mestreDica"), 60);
    if (CURRENT_MODE !== "express" && revealedOrder.filter((r) => r.item.type === "clue").length >= 2)
      caosIniExplica(players[mestreIndex], "mestreBotoes");
    const milestoneFired = maybeShowClueMilestoneFlavor();
    if (
      !milestoneFired &&
      !(caosFalasUltimos(45e3) >= 2 && Math.random() < 0.7) &&
      !caosMemoriaNaDica() &&
      !maybeCommentClueNumber(idx) &&
      !maybeVirtualPlayerLine()
    )
      maybeShowSpontaneousChatter();
  } else {
    startTimer("special");
    caosIniExplicaEspecial(players[responderIndex], item.text);
  }
  render();
  saveGameState();
}
function markCorrect(playerIdxOverride) {
  if (pendingIndex === null || gameEnded) return;
  const item = currentCard.clues[pendingIndex];
  if (item.type !== "clue") return;
  mestreObsVeredito();
  let scorerIdx = responderIndex;
  if (playerIdxOverride !== void 0 && playerIdxOverride !== null) {
    const allowedScorers = currentCard.isBonus
      ? [responderIndex, ...palpiteEligibleScorers()]
      : CURRENT_MODE === "express"
        ? players.map((p, i) => i).filter((i) => i !== mestreIndex)
        : [responderIndex, ...palpiteEligibleScorers()];
    if (allowedScorers.includes(playerIdxOverride)) scorerIdx = playerIdxOverride;
  }
  if (CURRENT_MODE !== "express" && scorerIdx !== responderIndex) consumePalpite(palpiteKeyOf(scorerIdx));
  const restoRelogio =
    CURRENT_MODE === "express"
      ? cardEndAt
        ? cardEndAt - Date.now()
        : null
      : timerEndAt && timerKind === "response"
        ? timerEndAt - Date.now()
        : null;
  caosPrevLeaderIdx = caosLeaderIdx();
  caosUltimoAtorIdx = scorerIdx;
  clearTimer();
  clearCardTimer();
  expressAskWho = false;
  expressWhoFreeze = null;
  consecutiveDiscards = 0;
  consecutiveExhausted = 0;
  usedAtLeastOnce = true;
  expressStealSavedResponder = null;
  playSfx("vitoriaCarta");
  celebrateHit();
  vibrar("acerto");
  const realCluesRevealed = revealedOrder.filter((r) => r.item.type === "clue").length;
  const timeTakenMs = pendingStartTime ? Date.now() - pendingStartTime : null;
  const caosSurpresaAcerto = caosSurpresaTipo(
    currentCard ? currentCard._caosDificuldade : null,
    true,
    realCluesRevealed,
  );
  if (currentCard && currentCard.answer) caosCardMemRecord(currentCard.answer, true);
  if (scorerIdx >= 0) caosMemRecordTime(scorerIdx, timeTakenMs);
  if (scorerIdx >= 0) caosRitmoRegistrar(scorerIdx, timeTakenMs, true);
  caosEventoContexto =
    (players[scorerIdx] ? players[scorerIdx].name : "?") +
    " acertou com " +
    realCluesRevealed +
    (realCluesRevealed === 1 ? " dica" : " dicas");
  if (scorerIdx >= 0) caosJogEmoRegistrar(scorerIdx, realCluesRevealed <= 3 ? "a" : "A");
  if (scorerIdx >= 0) caosDuploPadrao(scorerIdx);
  caosImplicFim(realCluesRevealed);
  caosEmoNudge(-0.4, 0.6);
  caosEmoMaybeDecay();
  if (scorerIdx >= 0) caosV2NoteMarkedEvent(scorerIdx);
  const currentMestreIdx = currentCard.isBonus
    ? scorerIdx === currentCard.bonusLanderPlayerIdx
      ? currentCard.bonusOpponentPlayerIdx
      : currentCard.bonusLanderPlayerIdx
    : mestreIndex;
  if (CURRENT_MODE === "express") {
    const expressPts = expressPoints(realCluesRevealed);
    players[scorerIdx].score += expressPts;
    fxFloat("+" + expressPts, "#4ade80");
    const gemResultX = awardGemIfEarned(scorerIdx, realCluesRevealed);
    maybeShowAcertoFlavor(scorerIdx, realCluesRevealed, timeTakenMs, {
      gemAwarded: !!gemResultX,
      caosSurpresa: caosSurpresaAcerto,
    });
    caosIniAcerto(players[scorerIdx]);
    caosIniExplica(players[scorerIdx], "pontosExpress", expressPts);
    if (gemResultX) showGemToast(gemResultX);
    caosMemAcerto(scorerIdx, realCluesRevealed, timeTakenMs);
    caosMesaRegistrar("acerto", players[scorerIdx]);
    caosMesaMimica(restoRelogio, players[scorerIdx], players[currentMestreIdx]);
    history.push({
      playerName: players[scorerIdx].name,
      playerColor: players[scorerIdx].color,
      playerAvatar: players[scorerIdx].avatar,
      category: currentCard.category,
      answer: currentCard.answer,
      points: expressPts,
      cluesUsed: realCluesRevealed,
      timeTakenMs,
      mestreName: players[currentMestreIdx].name,
      mestreColor: players[currentMestreIdx].color,
      mestrePoints: 0,
      wasBonus: false,
    });
    pendingStartTime = null;
    pendingIndex = null;
    if (history.length > 150) history = history.slice(-150);
    mestreIndex = nextIndex(mestreIndex);
    responderIndex = nextResponder(mestreIndex, mestreIndex);
    checkWinnerThenDraw();
    return;
  }
  const totalCardPoints = currentCard.clues.length;
  const entriesRevealed = revealedOrder.length;
  const pointsForResponder = totalCardPoints - entriesRevealed;
  const pointsForMestre = entriesRevealed;
  const bonusMultiplier = currentCard.isBonus ? 2 : 1;
  const hardcoreMultiplier = CURRENT_MODE === "hardcore" ? 2 : 1;
  const finalPointsResponder = pointsForResponder * bonusMultiplier * hardcoreMultiplier;
  const finalPointsMestre = pointsForMestre * bonusMultiplier * hardcoreMultiplier;
  const scorer = players[scorerIdx];
  const aviaoBefore = snapshotForAviao();
  const toastAntesDePontuar = toastSerial;
  creditPoints(scorerIdx, finalPointsResponder);
  fxFloat("+" + finalPointsResponder + " pts", "#4ade80");
  if (finalPointsMestre > 0) creditPoints(currentMestreIdx, finalPointsMestre, true);
  const gemResult = awardGemIfEarned(scorerIdx, realCluesRevealed);
  const aviaoMsg = gemResult ? null : computeAviaoMessage(aviaoBefore, scorerIdx);
  maybeShowAcertoFlavor(scorerIdx, realCluesRevealed, timeTakenMs, {
    gemAwarded: !!gemResult,
    aviaoMsg,
    caosSurpresa: caosSurpresaAcerto,
    milestoneSpoke: toastSerial !== toastAntesDePontuar,
  });
  caosIniAcerto(scorer);
  caosIniExplica(
    scorer,
    "pontos",
    finalPointsResponder,
    players[currentMestreIdx] ? players[currentMestreIdx].name : "o Mestre",
    finalPointsMestre,
  );
  if (players[currentMestreIdx] && players[currentMestreIdx] !== scorer)
    caosIniExplica(players[currentMestreIdx], "pontosMestre", finalPointsMestre);
  if (gemResult) showGemToast(gemResult);
  caosMemAcerto(scorerIdx, realCluesRevealed, timeTakenMs);
  caosMesaRegistrar("acerto", scorer);
  caosMesaMimica(restoRelogio, scorer, players[currentMestreIdx]);
  history.push({
    playerName: players[scorerIdx].name,
    playerColor: players[scorerIdx].color,
    playerAvatar: players[scorerIdx].avatar,
    category: currentCard.category,
    answer: currentCard.answer,
    points: finalPointsResponder,
    cluesUsed: realCluesRevealed,
    timeTakenMs,
    mestreName: players[currentMestreIdx].name,
    mestreColor: players[currentMestreIdx].color,
    mestrePoints: finalPointsMestre,
    wasBonus: currentCard.isBonus || false,
  });
  pendingStartTime = null;
  pendingIndex = null;
  if (history.length > 150) history = history.slice(-150);
  advanceToNextCardTurn();
  checkWinnerThenDraw();
}
function markWrong(tipo) {
  if (tipo !== "pular" && tipo !== "absurdo") tipo = null;
  if (pendingIndex === null || gameEnded) return;
  const item = currentCard.clues[pendingIndex];
  if (item.type !== "clue") return;
  mestreObsVeredito();
  clearTimer();
  usedAtLeastOnce = true;
  pendingIndex = null;
  streakScorerIdx = null;
  streakCount = 0;
  const missedPlayer = players[responderIndex];
  const missIdx = players.indexOf(missedPlayer);
  if (missIdx >= 0) caosUltimoAtorIdx = missIdx;
  const missMs = pendingStartTime ? Date.now() - pendingStartTime : null;
  const hsBefore = missIdx >= 0 ? caosTrailing(missIdx, "H") : 0;
  const missesNow = missIdx >= 0 ? caosTrailing(missIdx, "M") + 1 : 1;
  if (missIdx >= 0 && tipo !== "pular") caosMemRecord(missIdx, false);
  if (missIdx >= 0 && tipo !== "pular") caosMemErro(missIdx);
  caosMesaRegistrar(tipo, missedPlayer);
  caosVinculoErro(missedPlayer, tipo);
  if (missIdx >= 0) caosJogEmoRegistrar(missIdx, tipo === "pular" ? "P" : tipo === "absurdo" ? "X" : "E");
  caosPerguntaTalvez(missedPlayer, tipo);
  if (missIdx >= 0) caosMemRecordTime(missIdx, missMs);
  if (missIdx >= 0 && tipo !== "pular") caosRitmoRegistrar(missIdx, missMs, false);
  const realCluesRevealedNow = revealedOrder.filter((r) => r.item.type === "clue").length;
  const caosSurpresaErro = caosSurpresaTipo(
    currentCard ? currentCard._caosDificuldade : null,
    false,
    realCluesRevealedNow,
  );
  if (currentCard && currentCard.answer) caosCardMemRecord(currentCard.answer, false);
  caosEventoContexto =
    (missedPlayer ? missedPlayer.name : "?") +
    " errou" +
    (missesNow >= 2 ? " (" + missesNow + "º erro seguido)" : "") +
    (missMs != null && missMs > 25e3 ? " depois de pensar " + Math.round(missMs / 1e3) + " s" : "");
  caosEmoNudge(missesNow >= 2 ? 1 : 0.5, (missMs != null && missMs > 25e3 ? -0.5 : 0) + (missesNow >= 2 ? -0.3 : 0));
  caosEmoMaybeDecay();
  if (missIdx >= 0) caosV2NoteMarkedEvent(missIdx);
  if (CURRENT_MODE === "express" && expressStealSavedResponder !== null) {
    responderIndex = expressStealSavedResponder;
    expressStealSavedResponder = null;
  } else {
    responderIndex = advanceResponderAfterFailure();
  }
  const serialDoErro = cartaSeq;
  const proceed = () => {
    if (serialDoErro !== cartaSeq || gameEnded) return;
    if (!resolveExhaustionIfNeeded()) {
      startTimer("pick");
      render();
      saveGameState();
    }
  };
  if (missedPlayer) {
    cardWrongCount++;
    if (tipo === "pular") {
      playSfx("erro");
      vibrar("pular");
      fxPop("⏭️");
    } else if (tipo === "absurdo") {
      playSfx("erroForte");
      vibrar("absurdo");
      fxFlash("flash-roxo");
      fxPop("⚠️");
      fxShake();
    } else {
      playSfx("erroForte");
      flashScreen("red");
      vibrar("erro");
      fxShake();
    }
    {
      const prio = caosCerebroAnne(tipo, missedPlayer) || caosCerebroDiagnostico(missedPlayer);
      if (prio) {
        caosNoteSpeech(true);
        showToastMessage(prio, proceed);
        return;
      }
    }
    if (tipo) {
      const fm = caosMesaFala(tipo, missedPlayer);
      caosNoteSpeech(!!fm);
      if (!fm) {
        proceed();
        return;
      }
      showToastMessage(fm, proceed);
      return;
    }
    const acidMsg = missedPlayer.iniciante ? null : maybeAcidMessage(missedPlayer);
    let msg = acidMsg || "";
    if (
      !msg &&
      ((caosCortes.por && caosCortes.por[missedPlayer.name]) || 0) >= 3 &&
      playerHumor(missedPlayer) !== "suave" &&
      caosOncePerMatch("verbosidade_" + missedPlayer.name)
    )
      msg = getRandomReaction(REACTIVE_VOICE.verbosidade, missedPlayer.name);
    if (!msg) msg = caosMesaErroNormal(missedPlayer, missMs);
    if (!msg) msg = caosCerebroErro(missedPlayer, missMs, caosSurpresaErro);
    if (missedPlayer.iniciante && !msg) msg = caosIniAjuda(missedPlayer);
    if (missedPlayer.iniciante && !msg) {
      const r = Math.random();
      msg =
        caosIniDica(missedPlayer, "erro") ||
        (r < 0.45
          ? ""
          : r < 0.75
            ? caosFalaLeveIniciante(missedPlayer.name)
            : getRandomReaction(REACTIVE_VOICE.iniciante.erroLeve, missedPlayer.name, iniJfNaMesa())) ||
        "";
    }
    if (!msg) msg = caosVingancaLine(missedPlayer) || "";
    if (
      !msg &&
      !missedPlayer.iniciante &&
      caosSurpresaErro === "erroFacil" &&
      REACTIVE_VOICE.surpresaErroFacil &&
      Math.random() < 0.7
    ) {
      msg = getRandomReaction(REACTIVE_VOICE.surpresaErroFacil, missedPlayer.name);
    }
    if (!msg && !missedPlayer.iniciante) {
      const cand = caosErroCandidate(missedPlayer, missIdx, {
        hsBefore,
        misses: missesNow,
        ms: missMs,
        personalTime: missIdx >= 0 ? caosPersonalTimeSignal(missIdx, missMs) : null,
      });
      const zero = playerHumor(missedPlayer) === "zero";
      let kind = caosWeightedKindComTemperatura(
        zero
          ? cand
            ? { silencio: 6, contexto: 34, micro: 6, personalidade: 10, generica: 44 }
            : { silencio: 6, micro: 10, personalidade: 14, generica: 70 }
          : caosOS()
            ? cand
              ? { silencio: 45, contexto: 32, micro: 6, personalidade: 5, generica: 12 }
              : { silencio: 55, micro: 12, personalidade: 8, generica: 25 }
            : cand
              ? { silencio: 28, contexto: 32, micro: 8, personalidade: 8, generica: 24 }
              : { silencio: 28, micro: 12, personalidade: 10, generica: 50 },
      );
      const recentes = caosFalasUltimos(45e3);
      if (
        !zero &&
        (kind === "micro" || kind === "generica" || kind === "personalidade") &&
        Math.random() < (recentes >= 3 ? 0.8 : recentes >= 2 ? 0.55 : 0)
      )
        kind = "silencio";
      if (kind === "contexto") msg = cand.text();
      else if (kind === "micro") msg = getRandomReaction(REACTIVE_VOICE.reacaoCurta, missedPlayer.name);
      else if (kind === "personalidade")
        msg =
          (Math.random() < 0.3 && missIdx >= 0 && caosArquetipoLine(missIdx, "erro")) ||
          caosFamilyLine(missedPlayer.name, "erro");
      else if (kind === "generica" && (zero || !caosBudgetBlocks()))
        msg =
          (Math.random() < 0.55 && caosGerar("erro", missedPlayer, { ms: missMs })) || caosGenericErro(missedPlayer);
    }
    if (missIdx >= 0 && !missedPlayer.iniciante) {
      const pickPrincipal = caosLastPick;
      const seguidas = caosNoteSpeechTarget(missIdx);
      const continuidade =
        playerHumor(missedPlayer) === "suave" ? null : caosContinuidadeLine(missedPlayer.name, seguidas);
      const marcadoFlavor = caosMarcadoFlavor(missIdx, missedPlayer.name);
      const extra = [continuidade, marcadoFlavor].filter(Boolean).join(" ");
      if (extra && (msg || caosFalasUltimos(45e3) < 2)) msg = caosJoinExtra(extra, msg, pickPrincipal);
    }
    if (
      msg &&
      caosOS() &&
      playerHumor(missedPlayer) !== "zero" &&
      !missedPlayer.iniciante &&
      Math.random() < (caosFalasUltimos(6e4) >= 2 ? 0.6 : 0.25)
    )
      msg = "";
    if (
      !msg &&
      !missedPlayer.iniciante &&
      playerHumor(missedPlayer) !== "suave" &&
      caosCerebroOrdem() >= 6 &&
      Math.random() < 0.08
    )
      caosFalsoCarregamento();
    caosNoteSpeech(!!msg);
    if (!msg) {
      proceed();
      return;
    }
    showToastMessage(msg, proceed);
  } else {
    proceed();
  }
}
function continueAfterSpecial() {
  if (pendingIndex === null || gameEnded) return;
  const item = currentCard.clues[pendingIndex];
  if (item.type !== "special" || !(CONTINUE_SAME_PLAYER_SPECIALS.has(item.text) || specialIsVoid(item))) return;
  clearTimer();
  usedAtLeastOnce = true;
  pendingIndex = null;
  if (!resolveExhaustionIfNeeded()) {
    startTimer("pick");
    render();
    saveGameState();
  }
}
function cancelBonusCard() {
  clearTimer();
  usedAtLeastOnce = true;
  const card = currentCard;
  const raw = card ? cardsByAnswer.get(card.answer) || card : null;
  if (raw) deck.unshift(raw);
  currentCard = null;
  pendingIndex = null;
  revealedOrder = [];
  cardState = "none";
  const msg = getRandomReaction(REACTIVE_VOICE.bonusCancelado);
  advanceToNextCardTurn();
  render();
  saveGameState();
  showToastMessage(msg, () => {
    if (!gameEnded && cardState === "none") checkWinnerThenDraw();
  });
}
function loseTurnAfterSpecial() {
  if (pendingIndex === null || gameEnded) return;
  const item = currentCard.clues[pendingIndex];
  if (item.type !== "special" || CONTINUE_SAME_PLAYER_SPECIALS.has(item.text) || specialIsVoid(item)) return;
  if (currentCard.isBonus && /perca sua vez/i.test(item.text)) {
    cancelBonusCard();
    return;
  }
  clearTimer();
  usedAtLeastOnce = true;
  maybeShowLoseTurnSpecialFlavor(item);
  pendingIndex = null;
  if (CURRENT_MODE === "express") {
    if (expressStealSavedResponder !== null) {
      responderIndex = expressStealSavedResponder;
      expressStealSavedResponder = null;
    } else responderIndex = nextResponderStep(responderIndex);
    expressAfterSpecial();
    return;
  }
  responderIndex = advanceResponderAfterFailure();
  if (!resolveExhaustionIfNeeded()) {
    startTimer("pick");
    render();
    saveGameState();
  }
}
function cardSecondsLeft() {
  return cardEndAt ? Math.max(0, Math.ceil((cardEndAt - Date.now()) / 1e3)) : 0;
}
function clearCardTimer() {
  cardEndAt = null;
}
function expressRevealNext() {
  expressAskWho = false;
  const idx = revealedOrder.length;
  if (!currentCard || idx >= currentCard.clues.length) return false;
  const item = currentCard.clues[idx];
  const r = players[responderIndex];
  revealedOrder.push({ index: idx, item, pickedByName: r.name, pickedByColor: r.color, pickedByAvatar: r.avatar });
  pendingIndex = idx;
  acessLerDica(idx + 1, item);
  pendingStartTime = Date.now();
  startTimer("turn");
  if (item.type === "clue") {
    const fired = maybeShowClueMilestoneFlavor();
    if (!fired) maybeShowSpontaneousChatter();
  }
  return true;
}
function startExpressCard() {
  cardEndAt = Date.now() + (expressTimes().card + mestreTempoExtra("card")) * 1e3;
  cardSerial++;
  expressAskWho = false;
  revealedOrder = [];
  pendingIndex = null;
  expressStealSavedResponder = null;
  expressRevealNext();
}
function expressPass() {
  if (CURRENT_MODE !== "express" || cardState !== "revealed" || gameEnded || pendingIndex === null) return;
  mestreObsVeredito();
  expressAskWho = false;
  streakScorerIdx = null;
  streakCount = 0;
  usedAtLeastOnce = true;
  if (revealedOrder.length >= currentCard.clues.length) {
    clearTimer();
    clearCardTimer();
    resolveExhaustionIfNeeded();
    return;
  }
  if (expressStealSavedResponder !== null) {
    responderIndex = expressStealSavedResponder;
    expressStealSavedResponder = null;
  } else {
    responderIndex = nextResponderStep(responderIndex);
  }
  expressRevealNext();
  render();
  saveGameState();
}
function expressAfterSpecial() {
  usedAtLeastOnce = true;
  pendingIndex = null;
  if (!expressRevealNext()) {
    clearTimer();
    clearCardTimer();
    resolveExhaustionIfNeeded();
    return;
  }
  render();
  saveGameState();
}
function expressCardLost() {
  if (gameEnded || CURRENT_MODE !== "express" || cardState !== "revealed") return;
  clearTimer();
  clearCardTimer();
  usedAtLeastOnce = true;
  stats.totalExhausted++;
  consecutiveDiscards = 0;
  consecutiveExhausted++;
  caosPrediction = null;
  caosCardPrediction = null;
  expressStealSavedResponder = null;
  expressAskWho = false;
  playSfx("erroForte");
  flashScreen("red");
  showToastMessage("⏰ O tempo da carta acabou — ninguém pontua!", null, true);
  advanceToNextCardTurn();
  checkWinnerThenDraw();
}
function expressFreezeForWho() {
  if (expressWhoFreeze) return;
  if (activeToastState) closeActiveToast();
  const now = Date.now();
  expressWhoFreeze = {
    turnMs: timerEndAt ? Math.max(0, timerEndAt - now) : null,
    kind: timerKind,
    cardMs: cardEndAt ? Math.max(0, cardEndAt - now) : null,
    startAgoMs: typeof pendingStartTime === "number" ? now - pendingStartTime : null,
  };
  clearTimer();
  clearCardTimer();
}
function expressUnfreezeWho() {
  const f = expressWhoFreeze;
  expressWhoFreeze = null;
  if (!f) return;
  const now = Date.now();
  if (f.cardMs !== null) cardEndAt = now + f.cardMs;
  if (f.startAgoMs !== null) pendingStartTime = now - f.startAgoMs;
  if (f.turnMs !== null && f.kind) {
    timerKind = f.kind;
    timerEndAt = now + f.turnMs;
  }
  if (timerEndAt || cardEndAt) resumeTimerInterval();
}
function expressSkip(steps) {
  if (gameEnded) return;
  const pulados = [];
  for (let i = 0; i < steps + 1; i++) {
    responderIndex = nextResponderStep(responderIndex);
    if (i < steps && players[responderIndex]) pulados.push(players[responderIndex].name);
  }
  maybeShowExpressSpecialFlavor("skip", steps, pulados);
  finishExpressSpecialTurn();
}
// Volte 2 = inverte o sentido (como o Inverter do UNO: a vez volta pra quem jogou antes);
// Volte 3 = inverte e ainda pula 1 jogador.
function expressReverse(steps) {
  if (gameEnded) return;
  playDirection *= -1;
  const pulados = [];
  const passos = Math.max(1, steps - 1);
  for (let i = 0; i < passos; i++) {
    responderIndex = nextResponderStep(responderIndex);
    if (i < passos - 1 && players[responderIndex]) pulados.push(players[responderIndex].name);
  }
  maybeShowExpressSpecialFlavor("reverse", null, pulados);
  finishExpressSpecialTurn();
}
// Express: quem vem depois de idx no sentido atual (sem mexer em bloqueios; só pra mostrar na tela)
function expressPreverProximo(idx) {
  if (!players.length) return null;
  let c = idx;
  for (let i = 0; i < players.length * 2; i++) {
    c = (c + playDirection + players.length) % players.length;
    if (c === mestreIndex || c === idx) continue;
    if (players[c] && players[c].isBlocked) continue;
    return c;
  }
  return null;
}
// os próximos n na roda a partir de idx (só pra mostrar; com poucos jogadores pode repetir gente)
function expressPreverCadeia(idx, n) {
  const out = [];
  const bloq = new Set(players.map((p, i) => (p.isBlocked ? i : -1)).filter((i) => i >= 0));
  let c = idx;
  for (let i = 0; i < n; i++) {
    let k = c;
    for (let t = 0; t < players.length * 2; t++) {
      k = (k + playDirection + players.length) % players.length;
      if (k === mestreIndex) continue;
      if (bloq.has(k)) {
        bloq.delete(k); // como no jogo: quem está bloqueado é pulado uma vez
        continue;
      }
      break;
    }
    out.push(k);
    c = k;
  }
  return out;
}
function expressRodaHtml() {
  if (CURRENT_MODE !== "express" || CURRENT_FORMAT !== "versus" || !players[responderIndex]) return "";
  const naEspecial = pendingIndex !== null && currentCard && currentCard.clues[pendingIndex].type === "special";
  const prox = naEspecial ? null : expressPreverProximo(responderIndex);
  const bloq = players.filter((p) => p.isBlocked).map((p) => escapeHtml(p.name));
  return `<div class="express-roda">${playDirection > 0 ? "🔃 Sentido normal" : "🔄 Sentido invertido"}${prox !== null ? ` · depois: <b>${escapeHtml(players[prox].name)}</b>` : ""}${bloq.length ? ` · ⛔ ${bloq.join(", ")} perde a próxima` : ""}</div>`;
}
// Express: se o tempo da vez acabar numa instrução especial, o efeito acontece sozinho (antes ela era ignorada)
function expressAutoSpecial(item) {
  const txt = (item.text || "").toLowerCase();
  if (CONTINUE_SAME_PLAYER_SPECIALS.has(item.text)) {
    continueAfterSpecial();
    return;
  }
  if (txt.includes("escolha um jogador")) {
    const elegiveis = players.map((p, i) => i).filter((i) => i !== responderIndex && i !== mestreIndex);
    if (!elegiveis.length) {
      clearTimer();
      expressAfterSpecial();
      return;
    }
    expressTargetAction = txt.includes("avan") ? "steal" : "block";
    resolveExpressTarget(sorteioItem(elegiveis));
    return;
  }
  if (txt.includes("avance")) return expressSkip(txt.includes("2") ? 2 : 1);
  if (txt.includes("volte")) return expressReverse(txt.includes("3") ? 3 : 2);
  loseTurnAfterSpecial();
}
function finishExpressSpecialTurn() {
  clearTimer();
  expressAfterSpecial();
}
function resolveExpressTarget(idx) {
  if (!players[idx]) return;
  document.getElementById("expressTargetModal").style.display = "none";
  const action = expressTargetAction;
  expressTargetAction = null;
  if (action === "block") {
    players[idx].isBlocked = true;
    maybeShowExpressSpecialFlavor("block", players[idx].name);
    finishExpressSpecialTurn();
  } else if (action === "steal") {
    const thiefName = players[responderIndex] ? players[responderIndex].name : null;
    expressStealSavedResponder = responderIndex;
    responderIndex = idx;
    clearTimer();
    usedAtLeastOnce = true;
    pendingIndex = null;
    maybeShowExpressSpecialFlavor("steal", players[idx].name, thiefName);
    expressAfterSpecial();
  }
}
function undoTeamFormation() {
  if (CURRENT_FORMAT !== "equipe" || Object.keys(teams).length === 0) return;
  teams = {};
  teamOrder = [];
  teamRoundIndex = 0;
  ffaCandidateQueue = [];
  ffaWrongCount = 0;
  players.forEach((p) => {
    p.team = null;
    p.color = "#888888";
  });
  resetTeamSetupUI();
}
function addPlayer() {
  const input = document.getElementById("playerNameInput");
  const name = input.value.trim();
  if (name.length < 2 || name.length > 15) {
    caosAvisoModal("O nome deve ter entre 2 e 15 caracteres!");
    return;
  }
  if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    caosAvisoModal("Esse jogador já está na partida!");
    return;
  }
  if (players.length >= MAX_PLAYERS) {
    caosAvisoModal(`O Perfil permite no máximo ${MAX_PLAYERS} jogadores.`);
    return;
  }
  if (iniFluxo && iniPassoAtual() !== "pronto") {
    iniProximo();
    return;
  }
  undoTeamFormation();
  const isEquipe = CURRENT_FORMAT === "equipe";
  players.push({
    id: jogadorIdNovo(),
    name,
    score: 0,
    position: 0,
    isBlocked: false,
    color: isEquipe ? "#888888" : sanitizePlayerColor(name, selectedColor),
    avatar: sanitizePlayerAvatar(name, selectedAvatar),
    humor: selectedHumor === "caos" ? caosSortearHumor() : selectedHumor,
    humorCaos: selectedHumor === "caos" || void 0,
    ageBracket: isEquipe ? selectedAgeBracket : null,
    idade: idadeDoCadastro(isEquipe),
    team: null,
    nickMs: nickWaitStart ? Date.now() - nickWaitStart : null,
    ...(iniFluxo ? { iniciante: true, ini: { dicas: 0, feitas: [], acertou: false } } : {}),
  });
  if (iniFluxo) {
    players[players.length - 1].humor = "suave";
    iniEncerrar();
  }
  nickWaitReset();
  hideNickSuggest();
  idadeLimpar();
  nicksRepertorioGuardar(name);
  caosMemCadastro(players[players.length - 1]);
  input.value = "";
  caosTomadaN = 0;
  renderScoreboard();
  if (typeof redeHostCadastroMudou === "function") redeHostCadastroMudou(); // 1.7.9.4: a sala vê o nome novo na hora
  renderColorPicker();
  renderAvatarPicker();
  updateDrawAvailability();
  saveGameState();
  caosCadastroReset();
  selectedHumor = CURRENT_MODE === "junior" ? "familia" : "normal";
  renderHumorPicker();
  caosWelcomePlayer(players[players.length - 1]);
}
function endGame() {
  tempoTick();
  if (caosPartidaInicioAt && !caosPartidaFimAt) {
    caosPartidaFimAt = Date.now();
    try {
      caosDescansoRegistrar();
    } catch (e) {}
  }
  try {
    caosMemFimDePartida();
  } catch (e) {}
  setTimeout(caosIniFormatura, 4500);
  clearTimer();
  clearCardTimer();
  clearOverlayTimeout();
  releaseWakeLock();
  gameEnded = true;
  document.getElementById("cardArea").style.display = "none";
  document.getElementById("drawControls").style.display = "none";
  document.getElementById("miniScoreboard").style.display = "none";
  document.getElementById("deckInfo").style.display = "none";
  document.getElementById("pauseBtn").style.display = "none";
  document.getElementById("endGameBtn").style.display = "none";
  const winnerArea = document.getElementById("winnerArea");
  if (players.length === 0) {
    winnerArea.innerHTML = `<div class="final-ranking-screen"><h2>Jogo encerrado</h2><p>Nenhum jogador foi cadastrado.</p></div>`;
    saveGameState();
    return;
  }
  renderFinalScreen();
  triggerConfetti(!!gemWinner);
  caosMesaRevelaAposta();
  caosCasalFim();
  playSfx("vitoria");
  vibrar("vitoria");
  fxUrgente(false);
  if (players.some(isJfPlayer) && Math.random() < 0.25 && caosOncePerMatch("egg_jf_fim")) {
    const jfI = players.findIndex(isJfPlayer);
    const fimJf = caosGerarFala("jfFim", players[jfI], {
      tags: [caosVencedoresIdx().includes(jfI) ? "jfVenceu" : "jfPerdeu"],
    });
    showToastMessage(fimJf || getRandomReaction(REACTIVE_VOICE.jfFim), null, true);
  } else if (caosSilenced) {
    showToastMessage(
      getRandomReaction(REACTIVE_VOICE.caosVoltouDaPartida) + " " + getRandomReaction(REACTIVE_VOICE.partidaLonga),
      null,
      true,
    );
  } else if (caosFatiguePlan && caosFatigueLevel !== "normal") {
    showToastMessage(getRandomReaction(REACTIVE_VOICE.partidaLonga), null, true);
  }
  saveGameState();
}
function voltarParaSelecaoDeModo(meioDaPartida) {
  clearOverlayTimeout();
  clearInterval(orderCountdownInterval);
  releaseWakeLock();
  if (activeToastState) closeActiveToast();
  caosVoiceCancel();
  pausedRemainingSeconds = null;
  pausedKind = null;
  pausedAt = null;
  pausaExpirada = false;
  players.forEach((p) => {
    p.score = 0;
    p.position = 0;
    p.gems = {};
    p.isBlocked = false;
    p.team = null;
  });
  starterChosen = false;
  mestreIndex = null;
  responderIndex = null;
  gameEnded = false;
  if (typeof admPrincipalId !== "undefined") admPrincipalId = null;
  resetDeck();
  ["gameScreen", "welcomeScreen", "formatSelectScreen", "splashScreen"].forEach((id) => {
    document.getElementById(id).style.display = "none";
  });
  hidePauseScreen();
  document.getElementById("orderRevealSection").style.display = "none";
  document.getElementById("playAreaSection").style.display = "none";
  document.getElementById("pauseBtn").style.display = "";
  document.getElementById("endGameBtn").style.display = "";
  document.getElementById("startGameBtn").style.display = "block";
  document.getElementById("resumeGameBtn").style.display = "none";
  document.getElementById("drawStarterBtn").disabled = false;
  document.getElementById("modeSelectScreen").style.display = "block";
  resetModeSelectionUI();
  trocaDeModoPendente = !!meioDaPartida || players.length > 0;
  window.scrollTo(0, 0);
  saveGameState();
}
function ajustarJogadoresAoModo() {
  if (CURRENT_FORMAT !== "equipe") {
    const usadas = new Set();
    const livres = PLAYER_COLORS.filter((c) => c !== "RGB" && !GRADIENTS[c]);
    players.forEach((p) => {
      const dono = (p.color === "RGB" && isJfName(p.name)) || (p.color === "GRAD_PRINCESA" && isAnneName(p.name));
      if (
        !dono &&
        (!isSafeColor(p.color) ||
          p.color === "#888888" ||
          usadas.has(p.color) ||
          p.color === "RGB" ||
          p.color === "GRAD_PRINCESA")
      ) {
        p.color = livres.find((c) => !usadas.has(c) && !players.some((q) => q !== p && q.color === c)) || p.color;
      }
      usadas.add(p.color);
    });
  }
  if (CURRENT_MODE === "junior") {
    const ok = avatarsForMode();
    players.forEach((p) => {
      if (["🍺", "🧛", "🧟", "🥷"].includes(p.avatar) || String(p.avatar || "").startsWith("🕵")) {
        const livre = ok.find((a) => !players.some((q) => q.avatar === a));
        if (livre) p.avatar = livre;
      }
      if (p.humor === "acido" || p.humor === "zero") p.humor = "normal";
    });
  } else if (CURRENT_MODE === "hardcore")
    players.forEach((p) => {
      if (p.humor === "familia" || p.humor === "suave") p.humor = "normal";
    });
  else
    players.forEach((p) => {
      if (p.humor === "familia") p.humor = "suave";
    });
}
function jogarDeNovo() {
  const modo = CURRENT_MODE,
    cats = (expressSelectedCategories || []).slice(),
    flavor = modo === "express" ? expressFlavor : modo === "oldschool" ? (oldSchoolAcess ? "acess" : "padrao") : null;
  const campeao = (() => {
    const v = players.slice().sort((a, b) => rankValue(b) - rankValue(a))[0];
    return v ? v.name : null;
  })();
  voltarParaSelecaoDeModo(false);
  trocaDeModoPendente = false;
  selectMode(modo, cats, flavor);
  document.getElementById("startGameBtn").click();
  caosLog("revanche", `mesmo modo (${modo}) · ${players.length} jogadores`);
  caosToastAtrasado(
    () =>
      showToastMessage(
        caosGerarFala("revanche", null, { vars: { nome: campeao || "quem ganhou" } }) ||
          getRandomReaction(REACTIVE_VOICE.revanche, campeao || "quem ganhou"),
      ),
    400,
  );
}
function pickRandomExpressCategories() {
  const cats = ["ANO", "PESSOA", "LUGAR", "COISA"];
  const count = sorteioRegra() < 0.5 ? 1 : 2;
  return shuffle(cats).slice(0, count);
}
function selectMode(mode, expressCategories, flavor) {
  CURRENT_MODE = mode;
  playDirection = 1;
  expressStealSavedResponder = null;
  expressTargetAction = null;
  teams = {};
  teamOrder = [];
  teamRoundIndex = 0;
  ffaCandidateQueue = [];
  players.forEach((p) => {
    p.isBlocked = false;
    p.team = null;
    if (CURRENT_FORMAT !== "equipe") p.ageBracket = null;
  });
  RESPONSE_TIME_LIMIT = RESPONSE_TIME_LIMIT_BY_MODE[mode] || 90;
  ajustarJogadoresAoModo();
  if (mode === "express") {
    WINNING_SCORE = 0;
    expressFlavor = flavor === "hardcore" ? "hardcore" : "classico";
    expressSelectedCategories =
      expressCategories && expressCategories.length > 0 ? expressCategories : pickRandomExpressCategories();
    let pool = [];
    if (expressSelectedCategories.length === 1) {
      pool = shuffle(cardsForExpressCategory(expressSelectedCategories[0])).slice(0, 50);
    } else if (expressSelectedCategories.length === 2) {
      const p1 = shuffle(cardsForExpressCategory(expressSelectedCategories[0])).slice(0, 25);
      const p2 = shuffle(cardsForExpressCategory(expressSelectedCategories[1])).slice(0, 50 - p1.length);
      pool = shuffle([...p1, ...p2]);
    }
    allCards = pool;
  } else if (mode === "junior") {
    WINNING_SCORE = 150;
    allCards = ADULT_CARDS.filter(
      (c) => c.category !== "ANO" && (c.classificacao === "junior" || c.classificacao === "livre"),
    );
  } else if (mode === "oldschool") {
    WINNING_SCORE = 200;
    oldSchoolAcess = flavor === "acess";
    RESPONSE_TIME_LIMIT = oldSchoolAcess ? 120 : 90;
    allCards = baralhoOldSchool();
  } else {
    WINNING_SCORE = 200;
    allCards = mode === "hardcore" ? baralhoHardcore() : baralhoClassico();
  }
  if (mode !== "oldschool") oldSchoolAcess = false;
  aplicarAcessibilidade();
  rebuildCardsIndex();
  resetDeck();
  updateModeNotice();
  document.getElementById("modeSelectScreen").style.display = "none";
  document.getElementById("formatSelectScreen").style.display = "none";
  document.getElementById("welcomeScreen").style.display = "block";
  document.getElementById("startGameBtn").style.display = "block";
  document.getElementById("resumeGameBtn").style.display = "none";
  document.getElementById("playerPanel").style.display = "block";
  document.getElementById("orderRevealSection").style.display = "none";
  document.getElementById("playAreaSection").style.display = "none";
  const isEquipe = CURRENT_FORMAT === "equipe";
  document.getElementById("colorBox").style.display = isEquipe ? "none" : "";
  document.getElementById("ageBracketWrap").style.display = isEquipe ? "block" : "none";
  idadeMostrar(isEquipe);
  document.getElementById("teamSetupSection").style.display = isEquipe ? "block" : "none";
  resetTeamSetupUI();
  renderAvatarPicker();
  renderColorPicker();
  selectedHumor = CURRENT_MODE === "junior" ? "familia" : "normal";
  renderHumorPicker();
  if (!starterChosen) {
    document.getElementById("drawStarterBtn").style.display = isEquipe ? "none" : "block";
    document.getElementById("drawStarterBtn").disabled = false;
  }
  updateDrawAvailability();
  renderWinCondPicker();
  atualizarRotuloModo();
  renderScoreboard();
  if (trocaDeModoPendente) {
    trocaDeModoPendente = false;
    const nm =
      { classico: "Clássico", junior: "Júnior", hardcore: "Hardcore", express: "Express", oldschool: "Old School" }[
        mode
      ] || "outro modo";
    caosToastAtrasado(() => showToastMessage(getRandomReaction(REACTIVE_VOICE.trocaDeModo, nm)), 300);
  }
  if (typeof redePerguntarSalaTalvez === "function") redePerguntarSalaTalvez(); // 1.7.9.6 (pedido do JF): sala online logo depois do modo
  saveGameState();
}
function confirmExpress(flavor) {
  const checked = Array.from(document.querySelectorAll(".expressCatChk:checked")).map((cb) => cb.value);
  if (checked.length > 2) {
    caosAvisoModal("Escolha no máximo 2 categorias para o Modo Express!");
    return;
  }
  selectMode("express", checked, flavor);
}
function pauseGame() {
  if (!starterChosen || gameEnded) return;
  caosVoiceCancel();
  resolveOverlayImmediately();
  closeActiveToast();
  if (timerEndAt && timerKind) {
    pausedRemainingSeconds = secondsLeft();
    pausedKind = timerKind;
    clearTimer();
  }
  if (cardEndAt) {
    pausedCardRemaining = cardSecondsLeft();
    clearCardTimer();
  }
  document.getElementById("gameScreen").style.display = "none";
  pausedAt = Date.now();
  showPauseScreen();
  caosPausaHumorIniciar();
  const apb = document.getElementById("autoPauseBanner");
  if (apb) apb.style.display = "none";
  saveGameState();
}
function resumeGame() {
  const vinhaExpirada = pausaExpirada;
  try {
    if (caosPausaInicio) {
      const d = Date.now() - caosPausaInicio;
      if (d > 0 && d < 72e5) {
        caosPausaAcum += d;
        if (caosCardTimes.length) caosCardTimes = caosCardTimes.map((t) => t + d);
      }
    }
  } catch (e) {}
  pausedAt = null;
  pausaExpirada = false;
  const apb = document.getElementById("autoPauseBanner");
  if (apb) apb.style.display = "none";
  hidePauseScreen();
  document.getElementById("welcomeScreen").style.display = "none";
  document.getElementById("gameScreen").style.display = "flex";
  document.getElementById("startGameBtn").style.display = "block";
  document.getElementById("resumeGameBtn").style.display = "none";
  syncGameplayPanels();
  if (pausedCardRemaining !== null) {
    cardEndAt = Date.now() + pausedCardRemaining * 1e3;
    pausedCardRemaining = null;
  }
  if (pausedRemainingSeconds !== null && pausedKind) {
    timerKind = pausedKind;
    timerEndAt = Date.now() + pausedRemainingSeconds * 1e3;
    pausedRemainingSeconds = null;
    pausedKind = null;
    resumeTimerInterval();
    updateTimerDisplay();
  }
  render();
  saveGameState();
  if (admMsgPendente.length) setTimeout(admSoltarFalas, 300);
  caosPausaHumorVoltar(vinhaExpirada);
}
function pausaEstaAberta() {
  return document.getElementById("pauseScreen").style.display === "block" && starterChosen && !gameEnded;
}
function checarPausaEsquecida() {
  if (pausaExpirada || !pausaEstaAberta() || !pausedAt) return;
  if (Date.now() - pausedAt <= PAUSA_EXPIRA_MS) return;
  fecharPartidaPorPausa();
}
function fecharPartidaPorPausa() {
  pausaExpirada = true;
  ["admOverlay", "caosDiagOverlay", "caosReviewOverlay"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
  hidePauseScreen();
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("welcomeScreen").style.display = "none";
  document.getElementById("splashScreen").style.display = "";
  releaseWakeLock();
  caosVoiceCancel();
  saveGameState();
}
function pausaRegistrarToque() {
  if (!pausaEstaAberta() || pausaExpirada) return;
  pausedAt = Date.now();
  if (pausedAt - pausaToqueUltimoSave > 3e4) {
    pausaToqueUltimoSave = pausedAt;
    saveGameState();
  }
}
function pickStarterMestreVersus() {
  const jf = jfPlayerIndex();
  if (starterDrawCount >= STARTER_MAX_DRAWS && jf >= 0) return jf;
  const pool = players.map((p, i) => i).filter((i) => starterDrawCount <= 1 || i !== mestreIndex || players.length < 2);
  return sorteioItem(pool);
}
function drawEquipeOrder() {
  const ids = Object.keys(teams);
  const jf = jfPlayerIndex();
  const forceJf = starterDrawCount >= STARTER_MAX_DRAWS && jf >= 0 && players[jf].team && teams[players[jf].team];
  teamOrder = shuffle(ids);
  if (forceJf) {
    const jt = players[jf].team;
    teamOrder = [jt, ...teamOrder.filter((t) => t !== jt)];
  }
  teamRoundIndex = 0;
  if (forceJf) {
    const t = teams[players[jf].team];
    mestreIndex = jf;
    t.memberCursor = t.members.indexOf(jf) + 1;
    t.mestreCursor = t.members.indexOf(jf) + 1;
  } else {
    mestreIndex = pickTeamMestre(teamOrder[0]);
  }
  if (equipeSubMode === "ffa" && teamOrder.length > 2) {
    const others = teamOrder.filter((t) => t !== teamOrder[0]);
    ffaCandidateQueue = shuffle(others).map((t) => pickTeamMember(t));
    ffaWrongCount = 0;
    responderIndex = ffaCandidateQueue[0];
  } else {
    ffaCandidateQueue = [];
    responderIndex = pickTeamMember(teamOrder[1]);
  }
  renderOrderList();
}
function redrawMestre() {
  if (starterChosen || starterDrawCount >= STARTER_MAX_DRAWS) return;
  starterDrawCount++;
  if (CURRENT_FORMAT === "equipe") drawEquipeOrder();
  else {
    mestreIndex = pickStarterMestreVersus();
    responderIndex = nextResponder(mestreIndex, mestreIndex);
    renderOrderList();
  }
  playBeep(620, 0.08);
  if (starterDrawCount >= STARTER_MAX_DRAWS && jfPlayerIndex() === mestreIndex && !caosSilenced) {
    showToastMessage(getRandomReaction(REACTIVE_VOICE.sorteioMestreJf));
  }
  startOrderCountdown();
  saveGameState();
}
function runTeamFormation(n) {
  // 2 equipes: 4 jogadores (2 + 2) ou 6 (3 + 3). 3 equipes: 6 jogadores (2 + 2 + 2).
  if (n === 2 && players.length !== 4 && players.length !== 6) {
    caosAvisoModal("2 equipes precisam de 4 jogadores (2 por equipe) ou 6 (3 por equipe). Hoje tem " + players.length + ".");
    return;
  }
  if (n === 3 && players.length !== 6) {
    caosAvisoModal("3 equipes precisam de EXATAMENTE 6 jogadores (2 por equipe). Hoje tem " + players.length + ".");
    return;
  }
  formTeamsBalancedByAge(n);
  renderTeamRosterPreview();
  document.getElementById("teamCountChoice").style.display = "none";
  document.getElementById("teamRosterPreview").style.display = "block";
  if (n === 3) {
    document.getElementById("teamSubModeChoice").style.display = "block";
    if (typeof paintSubModeChoice === "function") paintSubModeChoice(equipeSubMode === "ffa" ? "ffa" : "duelo");
  } else {
    equipeSubMode = "duelo";
    document.getElementById("teamSubModeChoice").style.display = "none";
  }
  document.getElementById("startTeamsBtn").style.display = "block";
  renderScoreboard();
  renderColorPicker();
  saveGameState();
}
function beginGameplay() {
  clearInterval(orderCountdownInterval);
  const equipeOk =
    CURRENT_FORMAT !== "equipe" ||
    (isValidEquipeCount(players.length) && players.every((p) => p.team && teams[p.team]));
  if (players.length < MIN_PLAYERS || !equipeOk) {
    document.getElementById("orderRevealSection").style.display = "none";
    document.getElementById("playerPanel").style.display = "block";
    showToastMessage(
      getRandomReaction(
        REACTIVE_VOICE.inicioInvalido,
        CURRENT_FORMAT === "equipe"
          ? "o Modo Equipe precisa de 4 ou 6 jogadores, todos com equipe"
          : `precisa de pelo menos ${MIN_PLAYERS} jogadores`,
      ),
      null,
      true,
    );
    return;
  }
  starterChosen = true;
  if (!caosPartidaInicioAt) {
    caosPartidaInicioAt = Date.now();
    tempoZerar();
    matchId = partidaIdNovo();
  }
  if (!matchId) matchId = partidaIdNovo(); // save de antes da 1.7.7.2
  caosDescansoChecar();
  caosMagoaInicio();
  jogadoresGarantirIds(players);
  if (!admPrincipalId && players[mestreIndex]) admPrincipalId = players[mestreIndex].id;
  rodadaIniciar();
  voltarGuardar();
  players.forEach((p) => {
    p.famZ = 0;
    p.famLim = 1 + Math.floor(Math.random() * 5);
  });
  casaSortearModo();
  vitoriaTutInicio();
  syncGameplayPanels();
  updateDrawAvailability();
  renderMiniScoreboard();
  requestWakeLock();
  drawHidden();
  saveGameState();
}
function autoPauseGame() {
  if (!starterChosen || gameEnded) return;
  const g = document.getElementById("gameScreen");
  if (!g || g.style.display !== "flex") return;
  pauseGame();
  const apb = document.getElementById("autoPauseBanner");
  if (apb) apb.style.display = "block";
}
function recoverFromMissedPause() {
  if (!starterChosen || gameEnded) return;
  const g = document.getElementById("gameScreen");
  if (!g || g.style.display !== "flex") return;
  if (!(timerInterval && timerEndAt && lastTimerTick)) return;
  const gap = Date.now() - lastTimerTick;
  if (gap <= 2500) return;
  timerEndAt += gap;
  if (cardEndAt) cardEndAt += gap;
  if (typeof pendingStartTime === "number" && pendingStartTime) pendingStartTime += gap;
  autoPauseGame();
}
function pedirDesistirCarta() {
  if (gameEnded || !currentCard || CURRENT_MODE === "express") return;
  const nome = caosNomeMestre(),
    rev = revealedOrder.length,
    mult = CURRENT_MODE === "hardcore" ? 2 : 1,
    pts = currentCard.isBonus ? 0 : rev * mult;
  const msg = currentCard.isBonus
    ? "Desistir desta carta de bônus? Ela volta pra fila e ninguém pontua."
    : "Desistir desta carta? Ninguém acerta, e " +
      nome +
      " fica com " +
      pts +
      " ponto" +
      (pts === 1 ? "" : "s") +
      " pelas dicas reveladas.";
  caosConfirmarComVoz(
    msg,
    "Desistir",
    "Continuar",
    () => desistirCarta(),
    "[C.A.O.S.] Gente, o Mestre, " +
      nome +
      ", apertou Desistir da carta. Vocês concordam? Se ninguém tem mais ideia, toquem em Desistir. Se ainda dá pra tentar, toquem em Continuar.",
  );
}
function desistirCarta() {
  if (gameEnded || !currentCard) return;
  clearTimer();
  clearCardTimer();
  stats.totalDiscarded++;
  caosCardPrediction = null;
  caosPrediction = null;
  const rev = revealedOrder.length;
  try {
    caosLog("desistir", "carta desistida: " + currentCard.answer + " com " + rev + " dica(s)");
    caosEmoNudge(-0.2, -0.4);
  } catch (e) {}
  if (currentCard.isBonus) {
    pendingBonusQueue.unshift({ landerIdx: currentCard.bonusLandedByIdx, opponentIdx: currentCard.bonusMestreIdx });
    if (deck.length === 0) {
      currentCard = null;
      cardState = "none";
      endGame();
      return;
    }
    usedAtLeastOnce = true;
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.desistiuBonus), 500, "sempre");
    drawHidden();
    return;
  }
  const mult = CURRENT_MODE === "hardcore" ? 2 : 1,
    ganho = rev * mult,
    nome = caosNomeMestre();
  if (ganho > 0) creditPoints(mestreIndex, ganho, true);
  consecutiveDiscards = 0;
  try {
    caosImplicFim(99);
  } catch (e) {}
  expressStealSavedResponder = null;
  caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.desistiu, nome, ganho), 500, "sempre");
  advanceToNextCardTurn();
  checkWinnerThenDraw();
}
function afterMoveSpecial() {
  if (!MOVE_SPECIALS_KEEP_TURN || CURRENT_MODE === "express" || gameEnded || pendingIndex === null || !currentCard) {
    loseTurnAfterSpecial();
    return;
  }
  const item = currentCard.clues[pendingIndex];
  if (!item || item.type !== "special" || (currentCard.isBonus && /perca sua vez/i.test(item.text))) {
    loseTurnAfterSpecial();
    return;
  }
  clearTimer();
  usedAtLeastOnce = true;
  pendingIndex = null;
  if (!resolveExhaustionIfNeeded()) {
    startTimer("pick");
    render();
    saveGameState();
  }
}
function pickReactionIndex(list) {
  const n = list.length;
  const bad = caosBadIdx.get(list);
  if (n <= 1) return bad && bad.has(0) ? -1 : 0;
  if (!caosPoolIds) caosPoolIds = caosBuildPoolIds();
  if (!caosHist) caosHist = caosLoadHist();
  const id = caosPoolIds.get(list);
  const windowSize = Math.min(n - 1, Math.max(1, Math.floor(n * 0.8)));
  const recent =
    id && Array.isArray(caosHist[id]) ? caosHist[id].filter((i) => Number.isInteger(i) && i >= 0 && i < n) : [];
  const blocked = new Set(recent.slice(-windowSize));
  let options = [];
  for (let i = 0; i < n; i++) if (!blocked.has(i) && !(bad && bad.has(i))) options.push(i);
  if (!options.length) {
    for (let i = 0; i < n; i++) if (!(bad && bad.has(i))) options.push(i);
  }
  if (!options.length) return -1;
  const idx = options[Math.floor(Math.random() * options.length)];
  if (id) {
    recent.push(idx);
    caosHist[id] = recent.slice(-windowSize);
    caosSaveHist();
  }
  return idx;
}
function eligibleMercyTargets() {
  if (CURRENT_FORMAT !== "versus" || players.length < 2) return [];
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const leader = sorted[0];
  if (!leader) return [];
  return players.filter((p) => p !== leader && p.score < leader.score);
}
function pickWeightedMercyTarget(leader, pool) {
  const weights = pool.map((p) => Math.max(1, leader.score - p.score));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = sorteioRegra() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}
function maybeTriggerMercyEvent() {
  if (mercyEventUsed || gameEnded) return;
  if (CURRENT_MODE === "express" || CURRENT_MODE === "hardcore" || CURRENT_FORMAT !== "versus") return;
  // 1.7.8.5: a regra não depende mais de ter balão na tela (antes, com balão aberto ela nem sorteava,
  // e a mesma partida podia dar resultado diferente conforme o tempo da tela). O aviso vem com prioridade.
  const pool = eligibleMercyTargets();
  if (pool.length === 0) return;
  const leader = players.reduce((a, b) => (b.score > a.score ? b : a));
  const closestGap = leader.score - Math.max(...pool.map((p) => p.score));
  if (closestGap < WINNING_SCORE * 0.15) return;
  if (sorteioRegra() > 0.15) return;
  const target = pickWeightedMercyTarget(leader, pool);
  if (!target) return;
  mercyEventUsed = true;
  const targetIdx = players.indexOf(target);
  if (players.length < 3 || sorteioRegra() < 0.5) {
    const roll = 1 + sorteioIndice(10);
    const bonusPoints = roll * 2;
    creditPoints(targetIdx, bonusPoints);
    renderMiniScoreboard();
    renderScoreboard();
    if (victoryReached() && !ultimaRodadaAtiva()) {
      saveGameState();
      endGame();
      return;
    }
    playSfx("agonia");
    let msgCofrinho = "";
    if (caosCofrinho > 0 && players[targetIdx]) {
      const cof = caosCofrinho;
      caosCofrinho = 0;
      creditPoints(targetIdx, cof);
      msgCofrinho =
        " " +
        String(getRandomReaction(REACTIVE_VOICE.caosCofrinhoUso, target.name, cof) || "").replace(
          /\[C\.A\.O\.S\.\]\s*/,
          "",
        );
      renderMiniScoreboard();
      renderScoreboard();
      if (victoryReached() && !ultimaRodadaAtiva()) {
        saveGameState();
        endGame();
        return;
      }
    }
    showToastMessage(getRandomReaction(REACTIVE_VOICE.mercyPontos, target.name, bonusPoints) + msgCofrinho, null, true, true);
  } else {
    pendingBonusQueue.push({ landerIdx: targetIdx, opponentIdx: null });
    playSfx("agonia");
    showToastMessage(getRandomReaction(REACTIVE_VOICE.mercyBonus, target.name), null, true, true);
  }
  saveGameState();
}
// Mostra uma fala depois de "ms", só se ainda for a mesma partida
// (evita fala "fantasma" de uma partida antiga aparecer na nova).
function caosToastAtrasado(fn, ms) {
  const ser = caosPartidaSerial;
  setTimeout(() => {
    if (ser === caosPartidaSerial) fn();
  }, ms);
}
function caosFalaAgendar(fn, ms, prio) {
  const ser = caosPartidaSerial,
    carta = stats ? stats.totalDrawn : 0;
  setTimeout(() => {
    try {
      if (ser !== caosPartidaSerial) return;
      if (prio !== "sempre") {
        if (gameEnded || stats.totalDrawn !== carta) return;
        if (document.getElementById("pauseScreen").style.display === "block") return;
      }
      if (prio === "baixa" && (activeToastState || Date.now() - (caosUltimaFalaAt || 0) < 7e3)) {
        caosLog("maestro", "fala de baixa prioridade descartada");
        return;
      }
      const m = fn();
      if (m) showToastMessage(m);
    } catch (e) {}
  }, ms);
}
function showTimeoutOverlay(message, sub, thenAction) {
  if (overlayTimeoutRef) {
    clearTimeout(overlayTimeoutRef);
    overlayTimeoutRef = null;
  }
  timeoutOverlayMessage = { message, sub };
  pendingOverlayAction = thenAction;
  playBeep(880, 0.4);
  render();
  saveGameState();
  overlayTimeoutRef = setTimeout(() => {
    overlayTimeoutRef = null;
    timeoutOverlayMessage = null;
    const action = pendingOverlayAction;
    pendingOverlayAction = null;
    action();
  }, 5e3);
}
function pickNickSuggestion() {
  const used = new Set(players.map((p) => nameKeyPlain(p.name)));
  nickSugestaoDoRepertorio = false;
  const rep = nicksRepertorio().filter(
    (n) =>
      !used.has(nameKeyPlain(n)) &&
      n !== nickSuggestCurrent &&
      !isJfName(n) &&
      !isAnneName(n) &&
      n.length >= 2 &&
      n.length <= 15,
  );
  if (rep.length && Math.random() < 0.4) {
    nickSugestaoDoRepertorio = true;
    return rep[Math.floor(Math.random() * rep.length)];
  }
  const base = nickKidsContext() ? NICKS_KIDS : NICKS_GERAL.concat(NICKS_KIDS);
  const pool = base.filter(
    (n) => !used.has(nameKeyPlain(n)) && n !== nickSuggestCurrent && !isJfName(n) && !isAnneName(n) && n.length <= 15,
  );
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}
function admDevolverCarta() {
  clearTimer();
  clearCardTimer();
  if (typeof clearOverlayTimeout === "function") clearOverlayTimeout();
  pausedRemainingSeconds = null;
  pausedKind = null;
  pausedCardRemaining = null;
  if (currentCard) {
    if (currentCard.isBonus && CURRENT_MODE !== "express")
      pendingBonusQueue.unshift({ landerIdx: currentCard.bonusLandedByIdx, opponentIdx: currentCard.bonusMestreIdx });
    devolverAoBaralho(cardsByAnswer.get(currentCard.answer) || currentCard);
  }
  restoreBonusReader();
  currentCard = null;
  revealedOrder = [];
  pendingIndex = null;
  cardState = "none";
  expressAskWho = false;
  expressStealSavedResponder = null;
  caosPrediction = null;
  caosCardPrediction = null;
  if (typeof expressWhoFreeze !== "undefined") expressWhoFreeze = null;
}
function admRemoverJogador(r) {
  if (CURRENT_FORMAT === "equipe") return "no Equipe as equipes precisam de 4 ou 6 jogadores";
  if (!players[r] || players.length <= 2) return "a partida precisa de pelo menos 2 jogadores";
  const saiu = players[r];
  admDevolverCarta();
  pendingBonusQueue = pendingBonusQueue.filter((e) => e.landerIdx !== r && e.opponentIdx !== r);
  let novoMestre = mestreIndex;
  if (mestreIndex === r) novoMestre = nextIndex(r);
  const remap = (i) => (i === null || i === void 0 || i < 0 ? i : i === r ? null : i > r ? i - 1 : i);
  // fichas de palpite e joias da rodada são por id (1.7.7.1): só sai a de quem saiu, sem remapear
  if (palpiteHolders[saiu.id]) {
    palpiteStock = Math.min(PALPITE_STOCK, palpiteStock + palpiteHolders[saiu.id]);
    delete palpiteHolders[saiu.id];
  }
  delete joiasRodada[saiu.id];
  pendingBonusQueue = pendingBonusQueue.map((e) => ({
    landerIdx: remap(e.landerIdx),
    opponentIdx: e.opponentIdx === null ? null : remap(e.opponentIdx),
  }));
  const pl = {};
  Object.keys(caosMem.pl || {}).forEach((k) => {
    const i = parseInt(k, 10);
    if (i !== r) pl[remap(i)] = caosMem.pl[k];
  });
  caosMem.pl = pl;
  const sp = {};
  Object.keys(caosLastSpeechByPlayer || {}).forEach((k) => {
    const i = parseInt(k, 10);
    if (i !== r) sp[remap(i)] = caosLastSpeechByPlayer[k];
  });
  caosLastSpeechByPlayer = sp;
  if (caosMarked.idx === r) {
    caosMarked.idx = null;
    caosMarked.remaining = 0;
  } else caosMarked.idx = remap(caosMarked.idx);
  caosPrevMarkedIdx = remap(caosPrevMarkedIdx);
  caosUltimoAtorIdx = remap(caosUltimoAtorIdx);
  caosAcidLastIdx = remap(caosAcidLastIdx);
  caosPrevLeaderIdx = -1;
  streakScorerIdx = null;
  streakCount = 0;
  try {
    if (caosVinc) {
      if (caosVinc.fav === saiu.name) caosVinc.fav = null;
      if (caosVinc.desafeto === saiu.name) caosVinc.desafeto = null;
      if (caosVinc.desafetoFoi === saiu.name) caosVinc.desafetoFoi = null;
    }
  } catch (e) {}
  players.splice(r, 1);
  mestreIndex = remap(novoMestre === r ? nextIndex(r) : novoMestre);
  if (mestreIndex === null || !players[mestreIndex]) mestreIndex = 0;
  responderIndex =
    CURRENT_MODE === "express" ? nextResponderStep(mestreIndex) : nextResponder(mestreIndex, mestreIndex);
  const parte = Math.floor(saiu.score / players.length),
    sobra = saiu.score - parte * players.length;
  if (parte > 0)
    players.forEach((p) => {
      p.score += parte;
      if (CURRENT_MODE !== "express") p.position += parte;
    });
  if (sobra > 0) caosCofrinho += sobra;
  if (admPrincipalId === saiu.id) admPrincipalId = jogadorIdDe(mestreIndex);
  if (primeiroMestreId === saiu.id) primeiroMestreId = jogadorIdDe(mestreIndex);
  caosLog("adm", `${saiu.name} removido · +${parte} pra cada · cofrinho +${sobra}`);
  admFala(getRandomReaction(REACTIVE_VOICE.admSaida, saiu.name));
  if (sobra > 0) admFala(getRandomReaction(REACTIVE_VOICE.caosCofrinho, sobra));
  renderScoreboard();
  renderMiniScoreboard();
  updateDrawAvailability();
  if (victoryReached()) {
    saveGameState();
    hidePauseScreen();
    document.getElementById("gameScreen").style.display = "flex";
    syncGameplayPanels();
    endGame();
    return "ok";
  }
  saveGameState();
  return "ok";
}
async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLockRef = await navigator.wakeLock.request("screen");
    }
  } catch (e) {}
}
function releaseWakeLock() {
  try {
    if (wakeLockRef) {
      wakeLockRef.release();
      wakeLockRef = null;
    }
  } catch (e) {}
}

