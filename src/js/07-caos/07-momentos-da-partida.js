function caosWelcomePlayer(p) {
  if (!p || caosSilenced) return;
  if (p.iniciante) {
    showToastMessage(getRandomReaction(REACTIVE_VOICE.iniciante.boasVindas, p.name, iniJfNaMesa()));
    return;
  }
  const R = Math.random,
    B = REACTIVE_VOICE.boasVindas,
    name = p.name;
  const n = p.nickEmprestado ? 0 : caosTimesSeen(name);
  let bank = null,
    args = [name];
  const prevNickMs = caosNickTempoRemember(p);
  if (typeof p.nickMs === "number" && p.nickMs >= 6e4 && R() < 0.75) {
    bank = REACTIVE_VOICE.nickDemora.chegou;
    args = [name, caosTempoFala(p.nickMs)];
  } else if (prevNickMs >= 9e4 && typeof p.nickMs === "number" && p.nickMs < 3e4 && R() < 0.8)
    bank = REACTIVE_VOICE.nickDemora.evoluiu;
  else if (isAnneName(name) && p.avatar === "👸") {
    const g = caosGerarFala("anneChegou", p);
    if (g) return showToastMessage(g);
    bank = n > 0 && R() < 0.4 ? B.anneVolta : B.anne;
  } else if (isJfName(name) && p.avatar === "😎") {
    const g = caosGerarFala("jfChegou", p);
    if (g) return showToastMessage(g);
    bank = REACTIVE_VOICE.nickReacao.jf;
  }
  else {
    {
      const m = caosPerfilCadastro(p);
      if (m) {
        showToastMessage(m);
        return;
      }
    }
    if (R() < 0.3 && maybeReactToNick(name)) return;
    const humor = playerHumor(p);
    // gerador de boas-vindas (1.7.5.1): na maioria das vezes, monta uma fala pelo contexto
    if (!humorFamilia(p) && humor !== "zero" && R() < 0.65) {
      const extra = players.length === 1 ? ["primeiro"] : players.length >= MAX_PLAYERS ? ["ultimo"] : [];
      const g = caosGerarFala("boasVindas", p, { tags: extra });
      if (g) return showToastMessage(g);
    }
    const others = players.filter((x) => x !== p);
    const other = others.length ? others[Math.floor(R() * others.length)].name : null;
    const mem = n >= 1 && R() < 0.7 ? caosMemBoasVindas(p, n) : null;
    if (mem) {
      bank = mem.bank;
      args = mem.args;
    } else if (n >= 3 && R() < 0.7) {
      bank = B.conhecidoMuitas;
      args = [name, n];
    } else if (n >= 1 && R() < 0.75) {
      bank = B.conhecido;
      args = [name, n];
    } else if (humorFamilia(p) && R() < 0.8) bank = REACTIVE_VOICE.familia.boasVindas;
    else if (humor === "zero" && REACTIVE_VOICE.nivelZero && R() < 0.8) bank = REACTIVE_VOICE.nivelZero.boasVindas;
    else if (humor === "acido" && R() < 0.5) bank = B.acido;
    else if (humor === "suave" && R() < 0.5) bank = B.suave;
    else if (players.length === 1) bank = B.primeiro;
    else if (players.length >= MAX_PLAYERS && R() < 0.6) bank = B.ultimo;
    else if (other && R() < 0.5) {
      bank = B.novoComOutro;
      args = [name, other];
    } else bank = B.novo;
  }
  const msg = getRandomReaction(bank, ...args);
  if (msg) showToastMessage(msg);
}
function caosSeenNicks() {
  try {
    return JSON.parse(JFStore.getItem("perfil200_caos_nicks") || "[]");
  } catch (e) {
    return [];
  }
}
function caosRememberNick(n) {
  try {
    const a = caosSeenNicks();
    a.push(String(n).toLowerCase());
    JFStore.setItem("perfil200_caos_nicks", JSON.stringify(a.slice(-50)));
  } catch (e) {}
}
function caosStartBeatText(type) {
  switch (type) {
    case "jf":
      return caosOncePerMatch("egg_jf_inicio")
        ? caosGerarFala("jfInicio", players.find(isJfPlayer)) || getRandomReaction(REACTIVE_VOICE.jfInicio)
        : "";
    case "nick": {
      const seen = caosSeenNicks();
      const nickP = players.find((p) => /\d{2,}/.test(p.name) && !seen.includes(p.name.toLowerCase()));
      if (!nickP || !caosOncePerMatch("egg_nick")) return "";
      caosRememberNick(nickP.name);
      return getRandomReaction(REACTIVE_VOICE.nickNumerado, nickP.name);
    }
    case "cor": {
      const p = players[Math.floor(Math.random() * players.length)];
      const cor = p && CAOS_COLOR_NAMES[p.color];
      if (!cor || !caosOncePerMatch("egg_cor")) return "";
      return cor === "arco-íris"
        ? getRandomReaction(REACTIVE_VOICE.corRgb, p.name)
        : getRandomReaction(REACTIVE_VOICE.corEscolhida, p.name, cor);
    }
    case "jogadores": {
      const n = players.length,
        key = n <= 2 ? "2" : n === 3 ? "3" : n === 4 ? "4" : "5a6";
      return (
        caosGerarFala("inicioJogadores", null, { tags: ["q" + key] }) ||
        getRandomReaction(REACTIVE_VOICE.inicioJogadores[key])
      );
    }
    case "mestre": {
      const m = players[mestreIndex];
      return m ? caosGerarFala("inicioMestre", m) || getRandomReaction(REACTIVE_VOICE.inicioMestre, m.name) : "";
    }
    case "primeiro": {
      const r = players[responderIndex];
      return r ? caosGerarFala("inicioPrimeiro", r) || getRandomReaction(REACTIVE_VOICE.inicioPrimeiro, r.name) : "";
    }
    case "memoria":
      return caosOncePerMatch("mem_inicio") ? caosMemInicioTexto() : "";
    case "relogio":
      return caosOncePerMatch("relogio_inicio") ? caosRelogioInicioTexto() : "";
    case "casal":
      return caosCasal() && caosOncePerMatch("casal_inicio")
        ? getRandomReaction(REACTIVE_VOICE.perfilJogador.casal.inicio)
        : "";
    case "modo": {
      const k = CURRENT_FORMAT === "equipe" ? "equipe" : CURRENT_MODE;
      return (
        caosGerarFala("inicioModo", null) ||
        (REACTIVE_VOICE.inicioModo[k] ? getRandomReaction(REACTIVE_VOICE.inicioModo[k]) : "")
      );
    }
  }
  return "";
}
function maybeShowStartComment() {
  if (caosSilenced || players.length === 0) return;
  if (!caosOncePerMatch("start_comment")) return;
  const w = {
    jf: players.some(isJfPlayer) ? 120 : 0,
    nick: 30,
    cor: CURRENT_FORMAT !== "equipe" ? 15 : 0,
    jogadores: 35,
    mestre: 35,
    primeiro: 25,
    modo: 30,
    memoria: caosMemTemInicio() ? 70 : 0,
    casal: caosCasal() ? 90 : 0,
    relogio: caosDataEspecial(caosAgora()) ? 150 : 45,
  };
  Object.keys(w).forEach((k) => {
    if (!w[k]) delete w[k];
  });
  const order = [];
  while (Object.keys(w).length) {
    const k = caosWeightedKind(w);
    order.push(k);
    delete w[k];
  }
  const msgs = [];
  for (const k of order) {
    const t = caosStartBeatText(k);
    if (t) msgs.push(t);
    if (msgs.length >= 2) break;
    if (msgs.length === 1 && Math.random() >= 0.35) break;
  }
  if (msgs.length) showToastMessage(msgs[0], msgs[1] ? () => showToastMessage(msgs[1]) : null);
}
function maybeShowAiCardEgg() {
  if (caosSilenced || !currentCard || !CAOS_AI_RE.test(currentCard.answer || "")) return;
  if (Math.random() < 0.35 && caosOncePerMatch("egg_ia")) showToastMessage(getRandomReaction(REACTIVE_VOICE.cartaIA));
}
function maybeAcidMessage(missedPlayer) {
  if (caosSilenced || !missedPlayer || CURRENT_MODE === "express") return null;
  if (caosOS() && playerHumor(missedPlayer) !== "zero" && Math.random() < 0.6) return null;
  if (playerHumor(missedPlayer) === "suave" || CURRENT_MODE === "junior") return null;
  if (playerHumor(missedPlayer) === "zero") {
    if (stats.totalDrawn - caosLastAchievementCard < 2) return null;
    const idxZ = players.indexOf(missedPlayer),
      Z = REACTIVE_VOICE.nivelZero;
    if (idxZ >= 0 && caosTrailing(idxZ, "M") >= 3 && Math.random() < 0.3)
      return getRandomReaction(Z.incentivo, missedPlayer.name);
    if (Math.random() >= 0.4) return null;
    return getRandomReaction(Math.random() < 0.6 ? Z.erro : REACTIVE_VOICE.acido, missedPlayer.name);
  }
  if (caosEasterEggsUsed.has("acido3")) return null;
  if (stats.totalDrawn - caosAcidLastCard < 5) return null;
  if (stats.totalDrawn - caosLastAchievementCard < 2) return null;
  const idx = players.indexOf(missedPlayer);
  if (idx === caosAcidLastIdx) return null;
  if (Math.random() >= (playerHumor(missedPlayer) === "acido" ? 0.15 : 0.06)) return null;
  caosOncePerMatch("acido1") || caosOncePerMatch("acido2") || caosOncePerMatch("acido3");
  caosAcidLastCard = stats.totalDrawn;
  caosAcidLastIdx = idx;
  return getRandomReaction(REACTIVE_VOICE.acido, missedPlayer.name);
}
function maybeShowCaosPresentation() {
  if (caosOncePerMatch("apresentacao")) {
    caosDiagMatchStarted();
    caosRememberPlayers();
    showToastMessage(getRandomReaction(REACTIVE_VOICE.apresentacaoInicial), () => maybeShowStartComment());
  }
}
function maybeShowNameReminder() {
  if (CURRENT_MODE === "express" || caosSilenced) return false;
  if (Math.random() < 0.6 && caosOncePerMatch("lembrete_nome")) {
    showToastMessage(getRandomReaction(REACTIVE_VOICE.lembreteNome));
    return true;
  }
  return false;
}
function maybeShowScoreMilestone(p, oldScore, newScore) {
  if (oldScore < 100 && newScore >= 100 && caosOncePerMatch("score100")) {
    showToastMessage(getRandomReaction(REACTIVE_VOICE.marco100, p.name));
  } else if (oldScore < 77 && newScore >= 77 && caosOncePerMatch("score77")) {
    showToastMessage(getRandomReaction(REACTIVE_VOICE.marco77, p.name));
  } else if (oldScore < 67 && newScore >= 67 && caosOncePerMatch("score67")) {
    showToastMessage(getRandomReaction(REACTIVE_VOICE.marco67, p.name));
  } else if (newScore !== oldScore && REACTIVE_VOICE.marcosExatos[newScore] && caosOncePerMatch("exato" + newScore)) {
    showToastMessage(getRandomReaction(REACTIVE_VOICE.marcosExatos[newScore], p.name));
  }
}
function maybeAnnounceCrystalBall() {
  if (caosSilenced || caosPrediction) return;
  if (CURRENT_FORMAT === "equipe" || players.length < 2) return;
  if (Math.random() > (caosOS() ? 0.04 : 0.06)) return;
  const candidates = players.map((p, i) => i).filter((i) => i !== mestreIndex);
  if (candidates.length === 0) return;
  const pesos = candidates.map(caosBolaPeso),
    tot = pesos.reduce((a, b) => a + b, 0);
  let r = Math.random() * tot,
    chosenIdx = candidates[candidates.length - 1];
  for (let i = 0; i < candidates.length; i++) {
    r -= pesos[i];
    if (r <= 0) {
      chosenIdx = candidates[i];
      break;
    }
  }
  caosPrediction = { playerIdx: chosenIdx };
  showToastMessage(getRandomReaction(REACTIVE_VOICE.bolaCristalAnuncio, players[chosenIdx].name));
}
function caosCategoryLabel(cat) {
  return CATEGORY_LABELS[cat] || cat;
}
function maybeAnnounceCardPrediction() {
  if (caosSilenced || caosCardPrediction || deck.length === 0 || activeToastState) return false;
  if (Math.random() > 0.04) return false;
  const categories =
    CURRENT_MODE === "express" && expressSelectedCategories.length
      ? expressSelectedCategories.slice()
      : currentGemCategories();
  const guessedCategory = categories[Math.floor(Math.random() * categories.length)];
  const withAnswer = Math.random() < 0.5;
  let guessedAnswer = null;
  if (withAnswer) {
    const candidates = (allCards || []).filter((c) => gemCategoryFor(c.category) === guessedCategory);
    if (candidates.length > 0) guessedAnswer = candidates[Math.floor(Math.random() * candidates.length)].answer;
  }
  caosCardPrediction = { category: guessedCategory, answer: guessedAnswer };
  const msg = guessedAnswer
    ? getRandomReaction(REACTIVE_VOICE.previsaoCartaComResposta, caosCategoryLabel(guessedCategory), guessedAnswer)
    : getRandomReaction(REACTIVE_VOICE.previsaoCartaSoCategoria, caosCategoryLabel(guessedCategory));
  showToastMessage(msg, () => drawHidden());
  return true;
}
// 1.7.5.2: nome curto das misturas pra etiqueta do gerador de pensamento.
const CAOS_MISTURA_TAG = {
  magoado: "magoado",
  "empolgação nervosa": "empolgacaoNervosa",
  "riso sem graça": "risoSemGraca",
  "espiando com receio": "espiandoReceio",
  "elogio contrariado": "elogioContrariado",
  saudade: "saudade",
  acuado: "acuado",
};
// Pensamento em voz alta: ele conta como está por dentro (console de emoções).
function caosPensamentoTexto() {
  const C = caosConsole;
  if (!C || !C.on) return "";
  const tags = ["emo_" + (C.mostraMed || C.atual || "calmo")];
  if (C.mist && CAOS_MISTURA_TAG[C.mist]) tags.push("mist_" + CAOS_MISTURA_TAG[C.mist]);
  const vars = {};
  if (stats.totalDrawn <= 3) tags.push("comecoPartida");
  const min = caosMinutosPartida();
  if (min >= 40) {
    tags.push("partidaLonga");
    vars.min = String(min);
  }
  if (CURRENT_FORMAT !== "equipe" && players.length >= 2) {
    const ord = players.slice().sort((a, b) => b.score - a.score);
    if (ord[0].score > ord[1].score) {
      tags.push("temLider");
      vars.lider = ord[0].name;
    }
  }
  // com mistura, o pensamento fala da mistura (sem ela, da emoção do momento)
  if (C.mist && CAOS_MISTURA_TAG[C.mist] && Math.random() < 0.75) tags.shift();
  return caosGerarFala("pensamento", null, { tags, vars });
}
function caosChatterText() {
  const p = players[responderIndex];
  const nome = p ? p.name : "galera";
  // 4.0: às vezes ele pensa em voz alta (mais quando está sentindo alguma coisa forte)
  const C = caosConsole;
  const sentindo = C && C.on && (C.mist || (C.atual && C.atual !== "calmo"));
  if (Math.random() < (sentindo ? 0.45 : 0.12)) {
    const t = caosPensamentoTexto();
    if (t) return t;
  }
  if (Math.random() < 0.1 && caosOncePerMatch("meta")) return getRandomReaction(REACTIVE_VOICE.meta);
  if (Math.random() < 0.4) return getRandomReaction(REACTIVE_VOICE.espontaneo, nome);
  return caosFamilyLine(nome, "neutro");
}
function maybeCommentClueNumber(idx) {
  if (caosSilenced || activeToastState || !currentCard || Math.random() >= CAOS_NUMERO_CHANCE * (caosOS() ? 0.3 : 1))
    return false;
  const B = REACTIVE_VOICE.escolhaNumero,
    n = idx + 1,
    max = currentCard.clues.length;
  const p = players[responderIndex];
  if (!p) return false;
  const anterior = revealedOrder.length >= 2 ? revealedOrder[revealedOrder.length - 2].index + 1 : null;
  let bank = B.geral;
  const especial =
    n === 1
      ? B.primeira
      : n === max
        ? B.ultima
        : n === 13
          ? B.treze
          : n === 7
            ? B.sete
            : anterior && n === anterior + 1
              ? B.sequencia
              : null;
  if (especial && Math.random() < 0.6) bank = especial;
  const msg = getRandomReaction(bank, p.name, n, anterior);
  if (!msg) return false;
  showToastMessage(msg, null, false, false, true);
  return true;
}
function maybeMicroAmbiente() {
  if (CURRENT_MODE === "express" || caosSilenced || gameEnded || activeToastState || cardState !== "revealed") return;
  if ((timerKind !== "pick" && timerKind !== "response") || microAmbienteSerial === timerSerial) return;
  const total =
    timerKind === "pick" ? PICK_TIME_LIMIT + acessTempoExtra("pick") : RESPONSE_TIME_LIMIT + acessTempoExtra("response");
  if (total - secondsLeft() < 4 || Date.now() - caosLastSpokeAt < 25e3) return;
  if (Math.random() >= (caosOS() ? 0.01 : 0.03)) return;
  microAmbienteSerial = timerSerial;
  const r = Math.random(),
    V = REACTIVE_VOICE;
  const bank = caosOS()
    ? V.microAmbiente
    : r < 0.5
      ? V.microAmbiente
      : r < 0.75
        ? V.familias.microMeta
        : Math.random() < 0.5
          ? V.reacaoCurta
          : V.familias.semContexto;
  const p = players[responderIndex];
  const msg = getRandomReaction(bank, p ? p.name : "galera");
  if (msg) showToastMessage(msg, null, false, false, true);
}
function maybeShowSpontaneousChatter() {
  if (caosSilenced) return;
  caosSpontaneousCounter++;
  if (caosSpontaneousCounter < 5) return;
  if (Math.random() > (caosOS() ? 0.08 : 0.2)) return;
  caosSpontaneousCounter = 0;
  showToastMessage(
    caosOS() && Math.random() < 0.5 ? getRandomReaction(REACTIVE_VOICE.oldSchool.nostalgia) : caosChatterText(),
  );
}
function maybeShowCardChatter() {
  if (caosSilenced || activeToastState || stats.totalDrawn < 2) return false;
  if (Math.random() > CAOS_CARD_CHATTER_CHANCE * (caosOS() ? 0.45 : 1) || caosBudgetBlocks()) return false;
  caosSpontaneousCounter = 0;
  showToastMessage(caosChatterText());
  return true;
}
function snapshotForAviao() {
  if (CURRENT_MODE === "express") return null;
  if (CURRENT_FORMAT === "equipe")
    return teamOrder.map((id) => ({ key: id, name: "Equipe " + TEAM_INFO[id].label, val: teams[id].position }));
  return players.map((p, i) => ({ key: i, name: p.name, val: p.score }));
}
function computeAviaoMessage(before, scorerIdx) {
  if (!before || caosSilenced || caosEasterEggsUsed.has("aviao2")) return null;
  if (stats.totalDrawn - caosAviaoLast < 4) return null;
  if (before.length < 2) return null;
  const scorerKey = CURRENT_FORMAT === "equipe" ? players[scorerIdx] && players[scorerIdx].team : scorerIdx;
  const sorted = [...before].sort((a, b) => b.val - a.val);
  const leader = sorted[0],
    second = sorted[1];
  const goal = WINNING_SCORE > 0 ? WINNING_SCORE : 200;
  if (!leader || leader.key === scorerKey) return null;
  if (leader.val - second.val < Math.round(goal * 0.15)) return null;
  const me = before.find((e) => e.key === scorerKey);
  if (!me) return null;
  const minVal = sorted[sorted.length - 1].val;
  const wasLast = me.val === minVal && leader.val > minVal;
  const firstPoint = me.val === 0;
  if (!wasLast && !firstPoint) return null;
  return getRandomReaction(REACTIVE_VOICE.aviao, leader.name, me.name);
}
function maybeShowAcertoFlavor(scorerIdx, realCluesRevealed, timeTakenMs, ctx) {
  ctx = ctx || {};
  const player = players[scorerIdx];
  if (!player) return;
  const missBefore = caosTrailing(scorerIdx, "M");
  const prevResult = caosMemPl(scorerIdx).res.slice(-1)[0];
  caosMemRecord(scorerIdx, true);
  let marcante = false;
  if (streakScorerIdx === scorerIdx) streakCount++;
  else {
    streakScorerIdx = scorerIdx;
    streakCount = 1;
  }
  if (streakCount >= 2) caosPacienciaNudge(0.4);
  caosVinculoAcerto(scorerIdx);
  caosMarcadoRedencao(scorerIdx, realCluesRevealed);
  const rivalMsg =
    caosPrevLeaderIdx >= 0 && caosLeaderIdx() === scorerIdx && caosPrevLeaderIdx !== scorerIdx
      ? caosRivalTroca(scorerIdx, caosPrevLeaderIdx)
      : null;
  const timeTakenSec = timeTakenMs ? timeTakenMs / 1e3 : 999;
  const cat = gemCategoryFor(currentCard.category);
  let reactionMsg = "";
  let sfx = null;
  if (caosPrediction) {
    const bolaOk = caosPrediction.playerIdx === scorerIdx;
    reactionMsg =
      (bolaOk
        ? getRandomReaction(REACTIVE_VOICE.bolaCristalAcerto, player.name)
        : getRandomReaction(REACTIVE_VOICE.bolaCristalErro)) + caosBolaRegistrar(bolaOk);
    caosPrediction = null;
  }
  if (!reactionMsg && caosCardPrediction) {
    if (caosCardPrediction.answer) {
      reactionMsg =
        caosCardPrediction.answer === currentCard.answer
          ? getRandomReaction(REACTIVE_VOICE.previsaoCartaAcertou, player.name)
          : getRandomReaction(REACTIVE_VOICE.previsaoCartaPassouPerto);
    }
    caosCardPrediction = null;
  }
  if (!reactionMsg && ctx.aviaoMsg) {
    reactionMsg = ctx.aviaoMsg;
    sfx = "flash";
    caosOncePerMatch("aviao" + (caosEasterEggsUsed.has("aviao1") ? "2" : "1"));
    caosAviaoLast = stats.totalDrawn;
    caosLastAchievementCard = stats.totalDrawn;
  }
  if (reactionMsg) marcante = true;
  if (!reactionMsg && ctx.caosSurpresa === "acertoDificil" && REACTIVE_VOICE.surpresaAcertoDificil) {
    reactionMsg = getRandomReaction(REACTIVE_VOICE.surpresaAcertoDificil, player.name);
    if (reactionMsg) marcante = true;
  }
  if (!reactionMsg) {
    const cm = caosCerebroAcerto(player, realCluesRevealed, missBefore, timeTakenMs);
    if (cm) {
      reactionMsg = cm;
      marcante = true;
    }
  }
  if (!reactionMsg) {
    const nowLeader = caosLeaderIdx(),
      R = Math.random;
    let viaResposta = false;
    if (rivalMsg) reactionMsg = rivalMsg;
    if (reactionMsg) {
    } else if (
      caosPrevLeaderIdx >= 0 &&
      nowLeader === scorerIdx &&
      caosPrevLeaderIdx !== scorerIdx &&
      players[caosPrevLeaderIdx] &&
      R() < 0.85
    )
      reactionMsg = getRandomReaction(REACTIVE_VOICE.acertoVirada, player.name, players[caosPrevLeaderIdx].name);
    else if (missBefore >= 3 && R() < 0.85)
      reactionMsg = getRandomReaction(REACTIVE_VOICE.acertoRecuperacao, player.name, missBefore);
    else if (prevResult === "M" && R() < 0.25)
      reactionMsg = getRandomReaction(REACTIVE_VOICE.acertoAposErro, player.name);
    else if (currentCard && currentCard.answer && R() < 0.1) {
      reactionMsg = getRandomReaction(REACTIVE_VOICE.acertoComResposta, player.name, currentCard.answer);
      viaResposta = true;
    }
    if (reactionMsg && !viaResposta) marcante = true;
  }
  if (!reactionMsg && realCluesRevealed === 1 && Math.random() < 0.4) {
    reactionMsg = getRandomReaction(REACTIVE_VOICE.acertoUmaDica, player.name);
  }
  if (!reactionMsg && realCluesRevealed <= 2) {
    if (timeTakenSec <= 5) {
      if (Math.random() < 0.75) {
        sfx = "flash";
        reactionMsg = getRandomReaction(REACTIVE_VOICE.acertoRidiculamenteRapido, player.name);
      }
    } else if (timeTakenSec <= 15 && REACTIVE_VOICE.acertoCategoriaRapido[cat]) {
      if (Math.random() < 0.65) {
        sfx = "flash";
        reactionMsg = getRandomReaction(REACTIVE_VOICE.acertoCategoriaRapido[cat], player.name);
      }
    }
  }
  if (!reactionMsg) {
    const sinalTempo = caosPersonalTimeSignal(scorerIdx, timeTakenMs);
    if (sinalTempo === "maisRapidoQueOnormal") {
      if (realCluesRevealed <= 2 && Math.random() < 0.5) {
        sfx = "flash";
        reactionMsg = getRandomReaction(REACTIVE_VOICE.acertoRidiculamenteRapido, player.name);
      } else reactionMsg = getRandomReaction(REACTIVE_VOICE.tempoPessoalRapido, player.name);
    } else if (sinalTempo === "maisLentoQueOnormal") {
      reactionMsg = getRandomReaction(
        Math.random() < 0.5 ? REACTIVE_VOICE.tempoPessoalLento : REACTIVE_VOICE.jogadorLento,
        player.name,
      );
    }
  }
  if (!reactionMsg && realCluesRevealed >= 2) {
    const bucketD = realCluesRevealed <= 5 ? String(realCluesRevealed) : realCluesRevealed <= 8 ? "6a8" : "9mais";
    const chanceD = realCluesRevealed >= 9 ? 0.6 : realCluesRevealed >= 6 ? 0.45 : 0.35;
    if (Math.random() < chanceD)
      reactionMsg = getRandomReaction(REACTIVE_VOICE.acertoPorDicas[bucketD], player.name, realCluesRevealed);
  }
  if (!reactionMsg && streakCount >= 3 && streakCount % 2 === 1) {
    reactionMsg = getRandomReaction(REACTIVE_VOICE.sequenciaAcertos, player.name, streakCount);
  }
  if (!reactionMsg && timeTakenSec > 60) {
    reactionMsg = getRandomReaction(REACTIVE_VOICE.jogadorLento, player.name);
  }
  if (!reactionMsg) reactionMsg = caosVirtualAcertoLine(realCluesRevealed) || "";
  if (!reactionMsg && Math.random() < 0.12) reactionMsg = caosArquetipoLine(scorerIdx, "acerto") || "";
  if (!reactionMsg) reactionMsg = analyzeMatchStateReaction(scorerIdx);
  if (!reactionMsg && Math.random() < 0.08 && (caosOncePerMatch("carinho1") || caosOncePerMatch("carinho2"))) {
    reactionMsg = getRandomReaction(REACTIVE_VOICE.carinho, player.name);
  }
  if (!reactionMsg && isJfPlayer(player) && Math.random() < 0.1 && caosOncePerMatch("egg_jf_acerto")) {
    reactionMsg = caosGerarFala("jfAcerto", player) || getRandomReaction(REACTIVE_VOICE.jfAcerto);
  }
  if (
    !reactionMsg &&
    playerHumor(player) !== "suave" &&
    CURRENT_MODE !== "junior" &&
    !caosOS() &&
    Math.random() < 0.03 &&
    caosOncePerMatch("cantada")
  ) {
    reactionMsg = getRandomReaction(REACTIVE_VOICE.cantada, player.name);
  }
  if (playerHumor(player) === "zero" && !marcante && REACTIVE_VOICE.nivelZero && Math.random() < 0.55) {
    reactionMsg = getRandomReaction(REACTIVE_VOICE.nivelZero.acerto, player.name);
    marcante = true;
  }
  if (!reactionMsg) {
    const rr = Math.random();
    if (rr < 0.06) reactionMsg = getRandomReaction(REACTIVE_VOICE.reacaoCurta, player.name);
    else if (rr < 0.11) reactionMsg = caosFamilyLine(player.name, "acerto");
  } else if (!marcante && caosBudgetBlocks()) {
    reactionMsg = "";
    sfx = null;
  }
  if (!ctx.gemAwarded) {
    const pickPrincipal = caosLastPick;
    const seguidas = caosNoteSpeechTarget(scorerIdx);
    const continuidade = caosContinuidadeLine(player.name, seguidas);
    const marcadoFlavor = caosMarcadoFlavor(scorerIdx, player.name);
    const extra = [continuidade, marcadoFlavor].filter(Boolean).join(" ");
    if (extra) reactionMsg = caosJoinExtra(extra, reactionMsg, pickPrincipal);
  }
  caosNoteSpeech(!!reactionMsg || !!ctx.gemAwarded);
  if (reactionMsg && !ctx.gemAwarded && !ctx.milestoneSpoke) {
    if (sfx) playSfx(sfx);
    showToastMessage(reactionMsg);
  }
}
function maybeShowMoveSpecialFlavor(entityName, amount, wasChosenByAnother) {
  if (!entityName || !amount) return;
  if (caosOS() && Math.random() < 0.5) return;
  if (wasChosenByAnother && REACTIVE_VOICE.especialEscolhaJogador && REACTIVE_VOICE.especialEscolhaJogador.length > 0) {
    const msg2 = getRandomReaction(REACTIVE_VOICE.especialEscolhaJogador, entityName, amount > 0);
    if (msg2) {
      showToastMessage(msg2);
      return;
    }
  }
  const msg =
    amount > 0
      ? getRandomReaction(REACTIVE_VOICE.especialAvancou, entityName, amount)
      : getRandomReaction(REACTIVE_VOICE.especialVoltou, entityName, Math.abs(amount));
  if (msg) showToastMessage(msg);
}
function maybeShowLoseTurnSpecialFlavor(item) {
  if (!item || item.type !== "special") return;
  if (caosOS() && !isWildcardSpecial(item.text) && Math.random() < 0.5) return;
  const txt = (item.text || "").toLowerCase();
  if (txt.includes("avance") || txt.includes("volte") || txt.includes("escolha um jogador")) return;
  if (isWildcardSpecial(item.text)) {
    const entry = revealedOrder.find((r) => r.index === pendingIndex);
    if (!entry || entry.palpiteResult !== "ganhou") return;
  }
  const msg = isWildcardSpecial(item.text)
    ? getRandomReaction(REACTIVE_VOICE.especialPalpite, players[responderIndex] ? players[responderIndex].name : "?")
    : getRandomReaction(REACTIVE_VOICE.especialPercaVez);
  if (msg) showToastMessage(msg);
}
function maybeShowExpressSpecialFlavor(kind, a, b) {
  let msg = "";
  if (kind === "skip") msg = getRandomReaction(REACTIVE_VOICE.especialExpressSkip, a);
  else if (kind === "reverse") msg = getRandomReaction(REACTIVE_VOICE.especialExpressReverse);
  else if (kind === "block") msg = getRandomReaction(REACTIVE_VOICE.especialExpressBlock, a);
  else if (kind === "steal") msg = getRandomReaction(REACTIVE_VOICE.especialExpressSteal, a, b);
  // o fato vai sempre, mesmo com o C.A.O.S. mudo: a mesa precisa ver o efeito
  const vez = players[responderIndex] ? players[responderIndex].name : "?";
  let fato = "";
  if (kind === "skip") {
    const nomes = (b || []).slice();
    fato = nomes.length
      ? `⏭️ ${nomes.join(" e ")} ${nomes.length > 1 ? "foram pulados" : "foi pulado"} · vez de ${vez}`
      : `⏭️ A vez pulou · vez de ${vez}`;
  } else if (kind === "reverse")
    fato = (b && b.length ? `🔄 Sentido invertido e ${b.join(" e ")} foi pulado` : "🔄 Sentido invertido") + ` · vez de ${vez}`;
  else if (kind === "block") fato = `⛔ ${a} perde a próxima vez · vez de ${vez}`;
  else if (kind === "steal") fato = `🎯 ${a} responde a próxima dica no lugar de ${b || "?"}`;
  if (caosSilenced || !msg) msg = fato;
  else msg = msg + " — " + fato;
  if (msg) showToastMessage(msg, null, true);
  if (fato) fxFloat(fato.split(" · ")[0], "#facc15");
}
function caosCadastroFluxo(ev) {
  const inp = document.getElementById("playerNameInput"),
    ok = inp && inp.value.trim().length >= 2;
  cadAtualizarBotao();
  const cb = document.getElementById("colorBox"),
    ab = document.getElementById("avatarBox");
  const corVisivel = cb && cb.style.display !== "none";
  if (ok && !cadCor && corVisivel && !cb.open && !ab.open) cb.open = true;
  else if (ok && (!corVisivel || cadCor) && !cadEmoji && !ab.open && !cb.open) ab.open = true;
  cadPrevs();
}
function caosCadastroReset() {
  cadCor = false;
  cadEmoji = false;
  cadHumor = false;
  cadFaixa = false;
  try {
    renderColorPicker();
    renderAvatarPicker();
  } catch (e) {}
  const cb = document.getElementById("colorBox"),
    ab = document.getElementById("avatarBox"),
    hb = document.getElementById("humorBox");
  if (cb) cb.open = false;
  if (ab) ab.open = false;
  if (hb) hb.open = false;
  document.getElementById("addPlayerBtn").classList.remove("pronto");
  cadPrevs();
  cadAtualizarBotao();
}
function caosIniDica(p, tipo) {
  if (!p || !p.iniciante || !p.ini || gameEnded) return null;
  if (p.ini.dicas >= 3 || p.ini.feitas.includes(tipo)) return null;
  const D = REACTIVE_VOICE.iniciante.dicas;
  const bank = CURRENT_MODE === "express" && D[tipo + "Express"] ? D[tipo + "Express"] : D[tipo];
  if (!bank) return null;
  p.ini.feitas.push(tipo);
  p.ini.dicas++;
  let txt = getRandomReaction(bank, p.name);
  if (p.ini.dicas >= 3) txt += " " + getRandomReaction(REACTIVE_VOICE.iniciante.fimDasDicas);
  caosLog("iniciante", `${p.name}: dica "${tipo}" (${p.ini.dicas}/3)`);
  saveGameState();
  return txt;
}
function caosIniMostrar(p, tipo) {
  if (!p || !p.iniciante || cardState === "none" || gameEnded) return;
  if (tipo === "vez" && (cardState !== "revealed" || players[responderIndex] !== p)) return;
  if ((tipo === "mestre" || tipo === "mestreDica") && players[mestreIndex] !== p) return;
  const t = caosIniDica(p, tipo);
  if (t) showToastMessage(t, null, true);
}
function caosIniAcerto(p) {
  if (!p || !p.iniciante || !p.ini || p.ini.acertou) return;
  p.ini.acertou = true;
  showToastMessage(getRandomReaction(REACTIVE_VOICE.iniciante.acerto, p.name), null, true);
}
function caosFalaLeveIniciante(nome) {
  const cand = [];
  ["reacaoCurta", "erroSarcasmo", "microAmbiente"].forEach((k) => {
    (REACTIVE_VOICE[k] || []).forEach((it) => {
      let t = "";
      try {
        t = typeof it === "function" ? it(nome) : String(it);
      } catch (e) {
        return;
      }
      if (!t || t.length > 95 || t.indexOf("undefined") !== -1 || !t.includes("[C.A.O.S.]")) return;
      if (CAOS_FALA_PESADA_RE.test(t) || CAOS_JUNIOR_BLOCK_RE.test(t)) return;
      cand.push(t);
    });
  });
  return cand.length ? cand[Math.floor(Math.random() * cand.length)] : "";
}
function caosIniFormatura() {
  const formandos = players.filter((p) => p.iniciante);
  if (!formandos.length) return;
  formandos.forEach((p) => {
    p.iniciante = false;
    p.formado = true;
    p.humor = "normal";
    delete p.ini;
  });
  const nomes = formandos.map((p) => p.name).join(" e ");
  caosLog("iniciante", `formatura: ${nomes}`);
  showToastMessage(getRandomReaction(REACTIVE_VOICE.iniciante.formatura, nomes, iniJfNaMesa()), null, true);
  renderScoreboard();
  saveGameState();
}
function caosSortearHumor() {
  const o =
    CURRENT_MODE === "junior"
      ? ["familia", "suave", "normal"]
      : CURRENT_MODE === "hardcore"
        ? ["normal", "acido", "zero"]
        : ["suave", "normal", "acido"];
  return o[Math.floor(Math.random() * o.length)];
}
function caosTempoFala(ms) {
  const s = Math.max(1, Math.round((ms || 0) / 1e3));
  if (s < 60) return `${s} segundos`;
  const m = Math.floor(s / 60),
    r = s % 60;
  return `${m} minuto${m > 1 ? "s" : ""}` + (r >= 10 ? ` e ${r} segundos` : "");
}
function caosNickTempoRemember(p) {
  try {
    const o = JSON.parse(JFStore.getItem(CAOS_NICKTEMPO_KEY) || "{}") || {};
    const k = nameKeyPlain(p.name);
    const prev = typeof o[k] === "number" ? o[k] : 0;
    if (typeof p.nickMs === "number") {
      o[k] = p.nickMs;
      const keys = Object.keys(o);
      if (keys.length > 60) keys.slice(0, keys.length - 60).forEach((x) => delete o[x]);
      JFStore.setItem(CAOS_NICKTEMPO_KEY, JSON.stringify(o));
    }
    return prev;
  } catch (e) {
    return 0;
  }
}
