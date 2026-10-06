/* ======================================================================
 * 8. SALVAMENTO E MEMÓRIA (ARMAZENAMENTO, SALVAR/CARREGAR, EXPORTAR/IMPORTAR, FICHAS)
 * ====================================================================== */

const JFStore = (function () {
  const mem = new Map();
  let ls = null;
  try {
    const t = "__jf_teste__";
    window.localStorage.setItem(t, "1");
    if (window.localStorage.getItem(t) === "1") {
      window.localStorage.removeItem(t);
      ls = window.localStorage;
    }
  } catch (e) {
    ls = null;
  }
  let idb = null,
    idbOk = false;
  const hasClaudeStorage = (function () {
    try {
      return !!(window.storage && typeof window.storage.get === "function" && typeof window.storage.set === "function");
    } catch (e) {
      return false;
    }
  })();
  let claudeOk = false;
  const PREFIX = "perfiljf:";
  const pending = new Map();
  let flushTimer = null;
  function idbOpen() {
    return new Promise((resolve) => {
      try {
        if (!window.indexedDB) return resolve(null);
        const req = window.indexedDB.open("PerfilJF", 1);
        req.onupgradeneeded = () => {
          try {
            req.result.createObjectStore("kv");
          } catch (e) {}
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }
  function idbAll(db) {
    return new Promise((resolve) => {
      try {
        const out = {},
          tx = db.transaction("kv", "readonly"),
          st = tx.objectStore("kv"),
          req = st.openCursor();
        req.onsuccess = () => {
          const c = req.result;
          if (c) {
            out[c.key] = c.value;
            c.continue();
          } else resolve(out);
        };
        req.onerror = () => resolve(out);
      } catch (e) {
        resolve({});
      }
    });
  }
  function idbPut(key, value) {
    if (!idb) return;
    try {
      const tx = idb.transaction("kv", "readwrite");
      const st = tx.objectStore("kv");
      if (value === null) st.delete(key);
      else st.put(value, key);
    } catch (e) {}
  }
  async function claudeGet(key) {
    try {
      const r = await window.storage.get(PREFIX + key);
      if (r === null || r === void 0) return null;
      return typeof r === "object" && "value" in r ? r.value : r;
    } catch (e) {
      return null;
    }
  }
  function flush() {
    flushTimer = null;
    const items = [...pending.entries()];
    pending.clear();
    items.forEach(([k, v]) => {
      idbPut(k, v);
      if (hasClaudeStorage) {
        try {
          const p =
            v === null && typeof window.storage.delete === "function"
              ? window.storage.delete(PREFIX + k)
              : v === null
                ? null
                : window.storage.set(PREFIX + k, v);
          if (p && typeof p.then === "function")
            p.then(
              () => {
                claudeOk = true;
              },
              () => {},
            );
        } catch (e) {}
      }
    });
  }
  function schedule(key, value) {
    pending.set(key, value);
    if (!flushTimer) flushTimer = setTimeout(flush, 250);
  }
  function stamp(raw) {
    try {
      const o = JSON.parse(raw);
      return o && typeof o.savedAt === "number" ? o.savedAt : 0;
    } catch (e) {
      return 0;
    }
  }
  const api = {
    getItem(key) {
      if (ls) {
        try {
          const v = ls.getItem(key);
          if (v !== null) return v;
        } catch (e) {}
      }
      return mem.has(key) ? mem.get(key) : null;
    },
    setItem(key, value) {
      value = String(value);
      mem.set(key, value);
      if (ls) {
        try {
          ls.setItem(key, value);
        } catch (e) {}
      }
      schedule(key, value);
    },
    removeItem(key) {
      mem.delete(key);
      if (ls) {
        try {
          ls.removeItem(key);
        } catch (e) {}
      }
      schedule(key, null);
    },
    flushNow() {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flush();
      }
    },
    boot() {
      const work = (async () => {
        idb = await idbOpen();
        const fromIdb = idb ? await idbAll(idb) : {};
        idbOk = !!idb;
        const keys = new Set(Object.keys(fromIdb));
        [
          "perfil200_state",
          "perfil200_som",
          "perfil200_vibra",
          "perfil200_voz",
          "perfil200_voz_vel",
          "perfil200_voz_tom",
          "perfil200_voz_nome",
          "perfil200_batata",
          "perfil5_noturno",
          "perfil200_caos_hist",
          "perfil200_caos_diag",
          "perfil200_caos_conhecidos",
          "perfil200_caos_nicks",
          "perfil5_caos_cardmem",
          "perfil5_caos_nicktempo",
          "perfil5_caos_avaliacoes",
          "perfil5_caos_chave",
          "perfil5_nicks_repertorio",
          "perfil5_caos_fichas",
          "perfil5_caos_recordes",
          "perfil5_caos_rivais",
          "perfil5_caos_ultimapartida",
          "perfil5_caos_bola",
          "perfil5_caos_cartas_absurdo",
          "perfil5_caos_console",
          "perfil5_novidades_visto",
          "perfil5_splash_h",
          "perfil5_caos_descanso",
          "perfil5_caos_fimsrecentes",
        ].forEach((k) => keys.add(k));
        for (const k of keys) {
          let best = api.getItem(k);
          const cands = [fromIdb[k]];
          if (hasClaudeStorage) {
            const c = await claudeGet(k);
            if (c !== null) {
              claudeOk = true;
              cands.push(c);
            }
          }
          cands.forEach((c) => {
            if (typeof c !== "string") return;
            if (best === null) best = c;
            else if (k === "perfil200_state" && stamp(c) > stamp(best)) best = c;
          });
          if (best !== null && best !== api.getItem(k)) {
            mem.set(k, best);
            if (ls) {
              try {
                ls.setItem(k, best);
              } catch (e) {}
            }
          }
          if (best !== null && fromIdb[k] !== best) schedule(k, best);
        }
        try {
          if (navigator.storage && navigator.storage.persist)
            await Promise.race([navigator.storage.persist(), new Promise((r) => setTimeout(r, 300))]);
        } catch (e) {}
      })().catch(() => {});
      return Promise.race([work, new Promise((r) => setTimeout(r, 1200))]);
    },
    status() {
      const camadas = [];
      if (ls) camadas.push("navegador");
      if (idbOk) camadas.push("banco do navegador");
      if (claudeOk || hasClaudeStorage) camadas.push("Claude");
      return { ok: camadas.length > 0, camadas };
    },
  };
  try {
    window.addEventListener("pagehide", () => api.flushNow());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") api.flushNow();
    });
  } catch (e) {}
  return api;
})();
function caosExtraRestaurar(x) {
  try {
    if (!x || typeof x !== "object") return;
    const n = (v, d, lo, hi) => (typeof v === "number" && isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d);
    const nomes = new Set(players.map((p) => p.name));
    const nm = (v) => (typeof v === "string" && nomes.has(v) ? v : null);
    const mapa = (o) => {
      const r = {};
      if (o && typeof o === "object")
        Object.keys(o)
          .slice(0, 12)
          .forEach((k) => {
            if (nomes.has(k) && ((typeof o[k] === "number" && isFinite(o[k])) || typeof o[k] === "boolean"))
              r[k] = o[k];
          });
      return r;
    };
    if (x.emo && typeof x.emo === "object")
      caosEmo = {
        tensao: n(x.emo.tensao, 5, 0, 10),
        calor: n(x.emo.calor, 5, 0, 10),
        paciencia: n(x.emo.paciencia, 7, 0, 10),
      };
    if (typeof x.temper === "string" && Object.prototype.hasOwnProperty.call(CAOS_TEMPERAMENTOS, x.temper))
      caosTemper = CAOS_TEMPERAMENTOS[x.temper];
    if (x.eixos && typeof x.eixos === "object")
      caosEixos = {
        alegria: n(x.eixos.alegria, 0, -10, 10),
        confianca: n(x.eixos.confianca, 0, -10, 10),
        curiosidade: n(x.eixos.curiosidade, 0, -10, 10),
      };
    if (Array.isArray(x.eixosCats))
      caosEixosCats = x.eixosCats
        .filter((c) => typeof c === "string")
        .slice(-6)
        .map((c) => c.slice(0, 12));
    const C = x.console;
    if (C && typeof C === "object" && C.g && typeof C.g === "object" && caosConsole) {
      Object.keys(CAOS_CONSOLE).forEach((k) => {
        caosConsole.g[k] = n(C.g[k], 0, 0, CAOS_CONSOLE[k].teto);
      });
      if (
        typeof C.atual === "string" &&
        (C.atual === "calmo" || Object.prototype.hasOwnProperty.call(CAOS_CONSOLE, C.atual))
      )
        caosConsole.atual = C.atual;
      caosConsole.dwell = n(C.dwell, 0, 0, 99);
      caosConsole.seqOk = n(C.seqOk, 0, 0, 99);
      caosConsole.seqErr = n(C.seqErr, 0, 0, 99);
    }
    const V = x.vinc;
    if (V && typeof V === "object")
      caosVinc = {
        fav: nm(V.fav),
        motivo: typeof V.motivo === "string" ? V.motivo.slice(0, 80) : "",
        negados: mapa(V.negados),
        ress: mapa(V.ress),
        desafeto: nm(V.desafeto),
        desafetoFoi: nm(V.desafetoFoi),
        acusou: mapa(V.acusou),
        cartaUlt: n(V.cartaUlt, -99, -99, 9999),
        favFoi: nm(V.favFoi),
        decepcionou: V.decepcionou === true,
      };
    const I = x.implic;
    if (I && typeof I === "object")
      caosImplic =
        I.ativa === false
          ? { ativa: false }
          : typeof I.cat === "string"
            ? {
                cat: I.cat.slice(0, 12),
                ativa: true,
                anunciado: I.anunciado === true,
                cartas: n(I.cartas, 0, 0, 9),
                avisei: I.avisei === true,
                dislikes: n(I.dislikes, 0, 0, 9),
                anunciadoEm: n(I.anunciadoEm, -99, -99, 9999),
              }
            : caosImplic;
    const Q = x.pergunta;
    if (Q && typeof Q === "object") {
      caosPerguntaN = n(Q.n, 0, 0, 9);
      caosPerguntaUlt = n(Q.ult, -99, -99, 9999);
    }
    if (typeof x.pausaAcum === "number" && isFinite(x.pausaAcum))
      caosPausaAcum = Math.max(0, Math.min(1e9, x.pausaAcum));
    caosMudoCarta = x.mudo === true;
    caosMudoPor = typeof x.mudoPor === "string" && nomes.has(x.mudoPor) ? x.mudoPor : null;
  } catch (e) {}
}
function saveGameState() {
  // importando um save: nada pode gravar por cima até a página recarregar
  if (saveBloqueado) return;
  try {
    const state = {
      saveVersion: SAVE_VERSION,
      savedAt: Date.now(),
      players,
      deck: deck.map((c) => c.answer),
      currentCardAnswer: currentCard ? currentCard.answer : null,
      currentCardClues: currentCard ? currentCard.clues : null,
      currentCardBonusData:
        currentCard && currentCard.isBonus
          ? {
              bonusLandedByIdx: currentCard.bonusLandedByIdx,
              bonusMestreIdx: currentCard.bonusMestreIdx,
              bonusLanderPlayerIdx: currentCard.bonusLanderPlayerIdx,
              bonusOpponentPlayerIdx: currentCard.bonusOpponentPlayerIdx,
            }
          : null,
      cardState,
      gameEnded,
      usedAtLeastOnce,
      starterChosen,
      mestreIndex,
      responderIndex,
      revealedOrder,
      pendingIndex,
      history,
      palpiteHolders,
      palpiteStock,
      timerEndAt,
      timerKind,
      stats,
      pendingStartTime,
      pausedRemainingSeconds,
      pausedKind,
      pausedAt,
      pausaExpirada,
      consecutiveDiscards,
      showHistory,
      showStats,
      pendingBonusQueue,
      mercyEventUsed,
      caosFatiguePlan,
      caosFatigueLevel,
      caosSilenced,
      caosSaidaTemp,
      caosSaidasTensao,
      caosPartidaInicioAt,
      caosPartidaFimAt,
      tempoJogoMs,
      tempoPausaMs,
      caosCatSeq,
      caosMesa,
      caosAposta,
      caosCortes,
      gemWinner,
      cardEndAt,
      pausedCardRemaining,
      expressWhoFreeze,
      bonusOrigMestreIdx,
      caosMatchLog,
      WIN_CONDITION,
      casaSorteado,
      rodadaAtual,
      primeiroMestreNome,
      joiasRodada,
      ultimaRodada,
      ultimaRodadaQuem,
      oldSchoolAcess,
      caosRitmoLog,
      caosEmoHist,
      caosExtra: caosExtraSalvar(),
      admPrincipalName,
      caosCofrinho,
      CURRENT_MODE,
      WINNING_SCORE,
      RESPONSE_TIME_LIMIT,
      playDirection,
      expressSelectedCategories,
      expressFlavor,
      expressStealSavedResponder,
      CURRENT_FORMAT,
      teams,
      teamOrder,
      teamRoundIndex,
      equipeSubMode,
      ffaCandidateQueue,
      ffaWrongCount,
      allCardsAnswers: CURRENT_MODE === "express" || CURRENT_MODE === "classico" ? allCards.map((c) => c.answer) : null,
      screen: getCurrentScreen(),
    };
    JFStore.setItem("perfil200_state", JSON.stringify(state));
  } catch (e) {
    DEBUG && console.warn("Perfil: falha ao salvar a partida", e);
  }
}
function getCurrentScreen() {
  if (document.getElementById("gameScreen").style.display === "flex") return "game";
  if (document.getElementById("pauseScreen").style.display === "block") return "paused";
  if (document.getElementById("welcomeScreen").style.display === "block") return "rules";
  return "splash";
}
function saveNum(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function saveSegundos(v) {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
}
function sanitizeLoadedState(s) {
  if (!s || typeof s !== "object") return;
  const MODES = ["classico", "hardcore", "express", "junior", "oldschool"];
  if (!MODES.includes(s.CURRENT_MODE)) s.CURRENT_MODE = "classico";
  if (s.CURRENT_FORMAT !== "versus" && s.CURRENT_FORMAT !== "equipe") s.CURRENT_FORMAT = "versus";
  const num = (v, d) => (typeof v === "number" && Number.isFinite(v) ? v : d);
  const teamIds = Object.keys(TEAM_INFO);
  const okColors = new Set([
    ...PLAYER_COLORS,
    ...Object.keys(GRADIENTS),
    "RGB",
    "#888888",
    ...teamIds.map((id) => TEAM_INFO[id].color),
  ]);
  const usedNames = new Set();
  s.players = (Array.isArray(s.players) ? s.players : [])
    .slice(0, MAX_PLAYERS)
    .filter((p) => p && typeof p === "object")
    .map((p, i) => {
      let name = (typeof p.name === "string" ? p.name : "").trim().slice(0, 15);
      if (name.length < 1 || usedNames.has(name.toLowerCase())) name = "Jogador " + (i + 1);
      usedNames.add(name.toLowerCase());
      const gems = {};
      if (p.gems && typeof p.gems === "object")
        Object.keys(GEM_INFO).forEach((c) => {
          const n = num(p.gems[c], 0);
          if (n > 0) gems[c] = Math.min(GEMS_TO_WIN, Math.floor(n));
        });
      return {
        name,
        score: num(p.score, 0),
        position: num(p.position, 0),
        isBlocked: !!p.isBlocked,
        color: okColors.has(p.color) ? p.color : PLAYER_COLORS[i % PLAYER_COLORS.length],
        avatar: jfSafeAvatar(p.avatar),
        humor: playerHumor(p),
        ageBracket: AGE_BRACKETS.some((b) => b.id === p.ageBracket) ? p.ageBracket : null,
        team: teamIds.includes(p.team) ? p.team : null,
        gems,
        ...(typeof p.nickMs === "number" ? { nickMs: p.nickMs } : {}),
        ...(p.nickEmprestado === true ? { nickEmprestado: true } : {}),
        ...(p.iniciante === true
          ? {
              iniciante: true,
              ini: {
                dicas: Math.min(3, Math.max(0, num(p.ini && p.ini.dicas, 0))),
                feitas: (p.ini && Array.isArray(p.ini.feitas) ? p.ini.feitas : [])
                  .filter((x) => typeof x === "string")
                  .slice(0, 30),
                acertou: !!(p.ini && p.ini.acertou),
              },
            }
          : {}),
        ...(p.formado === true ? { formado: true } : {}),
        ...(p.idade === "menor" || p.idade === "maior" ? { idade: p.idade } : {}),
        ...(p.mestreAjuda === true ? { mestreAjuda: true } : {}),
        ...(p.mestreAjudaPerguntado === true ? { mestreAjudaPerguntado: true } : {}),
        ...(p.mestreAjudaAvisado === true ? { mestreAjudaAvisado: true } : {}),
        ...(p.obsM && typeof p.obsM === "object"
          ? { obsM: { d: num(p.obsM.d, 0), e: num(p.obsM.e, 0), ms: num(p.obsM.ms, 0), n: num(p.obsM.n, 0) } }
          : {}),
        ...(p.humorCaos === true ? { humorCaos: true } : {}),
        ...(p.humorPergunta === true ? { humorPergunta: true } : {}),
        ...(p.emo && typeof p.emo.h === "string" ? { emo: { h: p.emo.h.replace(/[^AaEPX]/g, "").slice(-8) } } : {}),
        ...(JOG_EMOS[p.estadoEmocional] ? { estadoEmocional: p.estadoEmocional } : {}),
      };
    });
  const nP = s.players.length;
  const idxOk = (v) => Number.isInteger(v) && v >= 0 && v < nP;
  ["mestreIndex", "responderIndex", "expressStealSavedResponder", "bonusOrigMestreIdx"].forEach((k) => {
    if (!idxOk(s[k])) s[k] = null;
  });
  if (s.currentCard && typeof s.currentCard === "object") {
    if (!s.currentCardAnswer) s.currentCardAnswer = s.currentCard.answer;
    delete s.currentCard;
  }
  if (Array.isArray(s.deck))
    s.deck = s.deck.map((d) => (d && typeof d === "object" ? d.answer : d)).filter((a) => typeof a === "string");
  else s.deck = [];
  if (typeof s.currentCardAnswer !== "string") s.currentCardAnswer = null;
  if (Array.isArray(s.allCardsAnswers)) s.allCardsAnswers = s.allCardsAnswers.filter((a) => typeof a === "string");
  else s.allCardsAnswers = null;
  const teams0 = s.teams && typeof s.teams === "object" ? s.teams : {};
  s.teams = {};
  Object.keys(teams0)
    .filter((id) => teamIds.includes(id))
    .forEach((id) => {
      const t = teams0[id] || {};
      const gems = {};
      if (t.gems && typeof t.gems === "object")
        Object.keys(GEM_INFO).forEach((c) => {
          const n = num(t.gems[c], 0);
          if (n > 0) gems[c] = Math.min(GEMS_TO_WIN, Math.floor(n));
        });
      s.teams[id] = {
        position: num(t.position, 0),
        members: (Array.isArray(t.members) ? t.members : []).filter(idxOk),
        memberCursor: Math.max(0, Math.floor(num(t.memberCursor, 0))),
        mestreCursor: Math.max(0, Math.floor(num(t.mestreCursor, 0))),
        gems,
      };
    });
  s.teamOrder = (Array.isArray(s.teamOrder) ? s.teamOrder : []).filter((id) => s.teams[id]);
  s.ffaCandidateQueue = (Array.isArray(s.ffaCandidateQueue) ? s.ffaCandidateQueue : []).filter(idxOk);
  const entityOk = (v) => (s.CURRENT_FORMAT === "equipe" ? !!s.teams[v] : idxOk(v));
  s.pendingBonusQueue = (Array.isArray(s.pendingBonusQueue) ? s.pendingBonusQueue : [])
    .filter(
      (e) =>
        e && entityOk(e.landerIdx) && (e.opponentIdx === null || e.opponentIdx === void 0 || entityOk(e.opponentIdx)),
    )
    .map((e) => ({ landerIdx: e.landerIdx, opponentIdx: e.opponentIdx === void 0 ? null : e.opponentIdx }));
  if (s.currentCardBonusData && typeof s.currentCardBonusData === "object") {
    const b = s.currentCardBonusData;
    if (
      !entityOk(b.bonusLandedByIdx) ||
      !entityOk(b.bonusMestreIdx) ||
      !idxOk(b.bonusLanderPlayerIdx) ||
      !idxOk(b.bonusOpponentPlayerIdx)
    )
      s.currentCardBonusData = null;
  } else s.currentCardBonusData = null;
  const ph = s.palpiteHolders && typeof s.palpiteHolders === "object" ? s.palpiteHolders : {};
  s.palpiteHolders = {};
  Object.keys(ph).forEach((k) => {
    const n = Math.floor(num(ph[k], 0));
    const ok = s.CURRENT_FORMAT === "equipe" ? !!s.teams[k] : idxOk(parseInt(k, 10));
    if (ok && n > 0) s.palpiteHolders[k] = 1;
  });
  s.palpiteStock = Math.max(0, PALPITE_STOCK - Object.keys(s.palpiteHolders).length);
  const answers = new Set(ADULT_CARDS.map((c) => c.answer));
  s.history = (Array.isArray(s.history) ? s.history : [])
    .filter((h) => h && answers.has(h.answer) && Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, h.category))
    .slice(-150)
    .map((h) => ({
      ...h,
      playerName: typeof h.playerName === "string" ? h.playerName.slice(0, 15) : "?",
      playerColor: isSafeColor(h.playerColor) ? h.playerColor : "#cccccc",
      playerAvatar: jfSafeAvatar(h.playerAvatar),
      mestreName: typeof h.mestreName === "string" ? h.mestreName.slice(0, 15) : "",
      mestreColor: isSafeColor(h.mestreColor) ? h.mestreColor : "#cccccc",
      points: num(h.points, 0),
      cluesUsed: num(h.cluesUsed, 0),
      timeTakenMs: typeof h.timeTakenMs === "number" ? h.timeTakenMs : null,
    }));
  if (!Array.isArray(s.expressSelectedCategories)) s.expressSelectedCategories = [];
  s.expressSelectedCategories = s.expressSelectedCategories
    .filter((c) => ["ANO", "PESSOA", "LUGAR", "COISA"].includes(c))
    .slice(0, 2);
  if (!["none", "hidden", "revealed", "bonusChoice"].includes(s.cardState)) s.cardState = "none";
  if (s.gemWinner && !(s.gemWinner.kind === "team" ? s.teams[s.gemWinner.id] : idxOk(s.gemWinner.id)))
    s.gemWinner = null;
  if (s.equipeSubMode !== "duelo" && s.equipeSubMode !== "ffa") s.equipeSubMode = "duelo";
  if (s.playDirection !== 1 && s.playDirection !== -1) s.playDirection = 1;
  if (typeof s.admPrincipalName !== "string" || !s.players.some((p) => p.name === s.admPrincipalName))
    s.admPrincipalName = null;
  s.caosCofrinho = Math.max(0, Math.floor(num(s.caosCofrinho, 0)));
}
function loadGameState() {
  let saved = null;
  try {
    saved = JFStore.getItem("perfil200_state");
  } catch (e) {}
  if (!saved) {
    resetDeck();
    return;
  }
  try {
    const state = JSON.parse(saved);
    sanitizeLoadedState(state);
    if (state.saveVersion !== SAVE_VERSION) {
      DEBUG &&
        console.warn(
          `Save de versao ${state.saveVersion ?? "desconhecida"} carregado num jogo versao ${SAVE_VERSION}.`,
        );
    }
    players = state.players || [];
    CURRENT_MODE = state.CURRENT_MODE || "classico";
    WINNING_SCORE = state.WINNING_SCORE === void 0 || state.WINNING_SCORE === null ? 200 : state.WINNING_SCORE;
    admPrincipalName = state.admPrincipalName || null;
    caosCofrinho = state.caosCofrinho || 0;
    WIN_CONDITION = WIN_CONDITIONS[state.WIN_CONDITION] ? state.WIN_CONDITION : "casa";
    RESPONSE_TIME_LIMIT = state.RESPONSE_TIME_LIMIT || RESPONSE_TIME_LIMIT_BY_MODE[CURRENT_MODE] || 90;
    playDirection = state.playDirection || 1;
    expressSelectedCategories = state.expressSelectedCategories || [];
    expressFlavor = state.expressFlavor || "classico";
    expressStealSavedResponder = state.expressStealSavedResponder === void 0 ? null : state.expressStealSavedResponder;
    if (
      (CURRENT_MODE === "express" || CURRENT_MODE === "classico") &&
      state.allCardsAnswers &&
      state.allCardsAnswers.length
    ) {
      const fullIndex = new Map(ADULT_CARDS.map((c) => [c.answer, c]));
      allCards = state.allCardsAnswers.map((a) => fullIndex.get(a)).filter(Boolean);
    } else if (CURRENT_MODE === "junior") {
      allCards = ADULT_CARDS.filter(
        (c) => c.category !== "ANO" && (c.classificacao === "junior" || c.classificacao === "livre"),
      );
    } else if (CURRENT_MODE === "oldschool") {
      allCards = baralhoOldSchool();
    } else {
      allCards = CURRENT_MODE === "hardcore" ? baralhoHardcore() : baralhoClassico();
    }
    oldSchoolAcess = CURRENT_MODE === "oldschool" && !!state.oldSchoolAcess;
    aplicarAcessibilidade();
    CURRENT_FORMAT = state.CURRENT_FORMAT || "versus";
    teams = state.teams || {};
    teamOrder = state.teamOrder || [];
    teamRoundIndex = state.teamRoundIndex || 0;
    equipeSubMode = state.equipeSubMode || "duelo";
    ffaCandidateQueue = state.ffaCandidateQueue || [];
    ffaWrongCount = state.ffaWrongCount || 0;
    rebuildCardsIndex();
    updateModeNotice();
    if (state.deck && state.deck.length > 0 && typeof state.deck[0] === "object") {
      deck = state.deck;
    } else if (state.deck) {
      deck = state.deck.map((answer) => cardsByAnswer.get(answer)).filter(Boolean);
    } else {
      deck = [];
    }
    if (state.currentCard) {
      currentCard = state.currentCard;
    } else if (state.currentCardAnswer) {
      const rawCardOnLoad = cardsByAnswer.get(state.currentCardAnswer) || null;
      const realClueKeys = rawCardOnLoad ? new Set(rawCardOnLoad.clues.map((c) => c.type + "|" + c.text)) : null;
      const savedCluesOk = !!(
        rawCardOnLoad &&
        Array.isArray(state.currentCardClues) &&
        state.currentCardClues.length > 0 &&
        state.currentCardClues.length <= rawCardOnLoad.clues.length &&
        state.currentCardClues.every((c) => c && realClueKeys.has(c.type + "|" + c.text))
      );
      currentCard = rawCardOnLoad
        ? {
            ...rawCardOnLoad,
            clues: savedCluesOk
              ? state.currentCardClues.map((c) => ({ type: c.type, text: c.text }))
              : shuffle(rawCardOnLoad.clues),
          }
        : null;
      if (currentCard && !savedCluesOk) {
        state.revealedOrder = [];
        state.pendingIndex = null;
      }
      if (currentCard && state.currentCardBonusData) {
        currentCard.isBonus = true;
        currentCard.bonusLandedByIdx = state.currentCardBonusData.bonusLandedByIdx;
        currentCard.bonusMestreIdx = state.currentCardBonusData.bonusMestreIdx;
        currentCard.bonusLanderPlayerIdx = state.currentCardBonusData.bonusLanderPlayerIdx;
        currentCard.bonusOpponentPlayerIdx = state.currentCardBonusData.bonusOpponentPlayerIdx;
      } else if (currentCard) {
        currentCard.isBonus = false;
      }
    } else {
      currentCard = null;
    }
    cardState = state.cardState || "none";
    gameEnded = state.gameEnded || false;
    usedAtLeastOnce = state.usedAtLeastOnce || false;
    starterChosen = state.starterChosen || false;
    mestreIndex = state.mestreIndex === void 0 ? null : state.mestreIndex;
    responderIndex = state.responderIndex === void 0 ? null : state.responderIndex;
    revealedOrder =
      Array.isArray(state.revealedOrder) && currentCard
        ? state.revealedOrder
            .filter((r) => r && Number.isInteger(r.index) && currentCard.clues[r.index])
            .map((r) => ({
              index: r.index,
              item: currentCard.clues[r.index],
              pickedByName: typeof r.pickedByName === "string" ? r.pickedByName.slice(0, 15) : "",
              pickedByColor: isSafeColor(r.pickedByColor) ? r.pickedByColor : "#cccccc",
              pickedByAvatar: jfSafeAvatar(r.pickedByAvatar),
              ...(typeof r.palpiteResult === "string" ? { palpiteResult: r.palpiteResult } : {}),
            }))
        : [];
    pendingIndex =
      Number.isInteger(state.pendingIndex) && currentCard && currentCard.clues[state.pendingIndex]
        ? state.pendingIndex
        : null;
    history = state.history || [];
    palpiteHolders = state.palpiteHolders || {};
    palpiteStock = typeof state.palpiteStock === "number" ? state.palpiteStock : PALPITE_STOCK;
    timerEndAt = saveNum(state.timerEndAt) || null;
    timerKind = TIMER_KINDS.includes(state.timerKind) ? state.timerKind : null;
    stats = state.stats || { totalDrawn: 0, totalDiscarded: 0, totalExhausted: 0 };
    pendingStartTime = saveNum(state.pendingStartTime) || null;
    pausedRemainingSeconds = saveSegundos(state.pausedRemainingSeconds);
    pausedKind = TIMER_KINDS.includes(state.pausedKind) ? state.pausedKind : null;
    pausedAt = typeof state.pausedAt === "number" && isFinite(state.pausedAt) ? state.pausedAt : null;
    pausaExpirada = !!state.pausaExpirada && !!state.starterChosen && !state.gameEnded;
    if (
      !pausaExpirada &&
      state.screen === "paused" &&
      pausedAt &&
      Date.now() - pausedAt > PAUSA_EXPIRA_MS &&
      !state.gameEnded
    )
      pausaExpirada = true;
    consecutiveDiscards = state.consecutiveDiscards || 0;
    showHistory = state.showHistory || false;
    showStats = state.showStats || false;
    pendingBonusQueue = state.pendingBonusQueue || [];
    mercyEventUsed = !!state.mercyEventUsed;
    caosFatiguePlan = state.caosFatiguePlan || null;
    caosFatigueLevel = state.caosFatigueLevel || "normal";
    caosSilenced = !!state.caosSilenced;
    caosSaidaTemp =
      state.caosSaidaTemp && Number.isFinite(state.caosSaidaTemp.volta) ? { volta: state.caosSaidaTemp.volta } : null;
    caosSaidasTensao = Number.isFinite(state.caosSaidasTensao) ? state.caosSaidasTensao : 0;
    {
      const c = state.caosCortes,
        limpo = { total: 0, por: {}, rancor: {} };
      if (c && typeof c === "object") {
        limpo.total = Number.isFinite(c.total) ? c.total : 0;
        players.forEach((p) => {
          if (c.por && Number.isFinite(c.por[p.name])) limpo.por[p.name] = c.por[p.name];
          if (c.rancor && c.rancor[p.name] === true) limpo.rancor[p.name] = true;
        });
      }
      caosCortes = limpo;
    }
    caosMesa = caosMesaLimpa(state.caosMesa);
    caosCatSeq = Array.isArray(state.caosCatSeq) ? state.caosCatSeq.filter((c) => typeof c === "string").slice(-6) : [];
    caosPartidaInicioAt = Number.isFinite(state.caosPartidaInicioAt) ? state.caosPartidaInicioAt : null;
    caosPartidaFimAt = Number.isFinite(state.caosPartidaFimAt) ? state.caosPartidaFimAt : null;
    tempoRestaurar(state);
    caosResenhaTxt = null;
    caosAposta =
      state.caosAposta && typeof state.caosAposta.nome === "string"
        ? {
            nome: state.caosAposta.nome.slice(0, 15),
            carta: Number.isFinite(state.caosAposta.carta) ? state.caosAposta.carta : 0,
          }
        : null;
    gemWinner = state.gemWinner || null;
    // Moda da Casa: partida salva antes do sorteio existir segue a regra antiga ("misto").
    casaSorteado = CASA_MODOS.includes(state.casaSorteado)
      ? state.casaSorteado
      : state.casaSorteado === "misto" ||
          (!("casaSorteado" in state) &&
            state.WIN_CONDITION === "casa" &&
            state.CURRENT_MODE !== "express" &&
            state.starterChosen &&
            !state.gameEnded)
        ? "misto"
        : null;
    rodadaAtual = Number.isInteger(state.rodadaAtual) && state.rodadaAtual >= 1 ? state.rodadaAtual : 1;
    primeiroMestreNome = typeof state.primeiroMestreNome === "string" ? state.primeiroMestreNome.slice(0, 15) : null;
    ultimaRodada = state.ultimaRodada === true;
    ultimaRodadaQuem = typeof state.ultimaRodadaQuem === "string" ? state.ultimaRodadaQuem.slice(0, 30) : "";
    joiasRodada = {};
    if (state.joiasRodada && typeof state.joiasRodada === "object")
      Object.keys(state.joiasRodada).forEach((k) => {
        const v = state.joiasRodada[k];
        if (typeof v === "number" && Number.isFinite(v))
          joiasRodada[String(k).slice(0, 10)] = Math.max(0, Math.min(JOIAS_POR_RODADA, Math.floor(v)));
      });
    cardEndAt = saveNum(state.cardEndAt) || null;
    if (state.expressWhoFreeze && typeof state.expressWhoFreeze === "object" && CURRENT_MODE === "express") {
      const f = state.expressWhoFreeze,
        ok = (v) => typeof v === "number" && isFinite(v) && v >= 0;
      if (ok(f.cardMs)) cardEndAt = Date.now() + Math.min(f.cardMs, 6e5);
      if (ok(f.turnMs) && f.kind === "turn") {
        timerKind = "turn";
        timerEndAt = Date.now() + Math.min(f.turnMs, 6e5);
      }
    }
    expressWhoFreeze = null;
    expressAskWho = false;
    pausedCardRemaining = saveSegundos(state.pausedCardRemaining);
    bonusOrigMestreIdx =
      typeof state.bonusOrigMestreIdx === "number" && players[state.bonusOrigMestreIdx]
        ? state.bonusOrigMestreIdx
        : null;
    caosRitmoLog = ciSanearLog(state.caosRitmoLog, CAOS_RITMO_MAX);
    caosEmoHist = ciSanearLog(state.caosEmoHist, CAOS_EMOHIST_MAX);
    caosExtraRestaurar(state.caosExtra);
    caosMatchLog = Array.isArray(state.caosMatchLog)
      ? state.caosMatchLog
          .filter((x) => x && typeof x.text === "string")
          .slice(-CAOS_MATCHLOG_MAX)
          .map((x) => ({
            n: Number.isFinite(x.n) ? x.n : 0,
            bank: String(x.bank || "?").slice(0, 60),
            key: String(x.key || "").slice(0, 220),
            text: x.text.slice(0, 400),
            r: x.r === 1 || x.r === -1 ? x.r : 0,
            rated: !!x.rated,
          }))
      : [];
    if (pausaExpirada) {
      document.getElementById("splashScreen").style.display = "";
      document.getElementById("welcomeScreen").style.display = "none";
      document.getElementById("gameScreen").style.display = "none";
      hidePauseScreen();
    } else if (state.screen === "paused" || (state.screen === "rules" && starterChosen && !gameEnded)) {
      document.getElementById("splashScreen").style.display = "none";
      document.getElementById("welcomeScreen").style.display = "none";
      syncGameplayPanels();
      showPauseScreen();
    } else if (state.screen === "game") {
      document.getElementById("splashScreen").style.display = "none";
      document.getElementById("welcomeScreen").style.display = "none";
      document.getElementById("gameScreen").style.display = "flex";
      syncGameplayPanels();
    } else if (state.screen === "rules") {
      document.getElementById("splashScreen").style.display = "none";
      document.getElementById("welcomeScreen").style.display = "block";
      if (starterChosen) {
        document.getElementById("startGameBtn").style.display = "none";
        document.getElementById("resumeGameBtn").style.display = "block";
      }
      const isEquipe = CURRENT_FORMAT === "equipe";
      document.getElementById("colorBox").style.display = isEquipe ? "none" : "";
      document.getElementById("ageBracketWrap").style.display = isEquipe ? "block" : "none";
      idadeMostrar(isEquipe);
      document.getElementById("teamSetupSection").style.display = isEquipe ? "block" : "none";
      if (isEquipe) {
        if (Object.keys(teams).length > 0) {
          renderTeamRosterPreview();
          document.getElementById("teamCountChoice").style.display = "none";
          document.getElementById("teamRosterPreview").style.display = "block";
          document.getElementById("teamSubModeChoice").style.display =
            Object.keys(teams).length === 3 ? "block" : "none";
          document.getElementById("startTeamsBtn").style.display = starterChosen ? "none" : "block";
        } else {
          resetTeamSetupUI();
        }
        document.getElementById("drawStarterBtn").style.display = "none";
      }
    }
    if (starterChosen && players.length > 0 && mestreIndex !== null) {
      syncGameplayPanels();
      renderMiniScoreboard();
    }
    renderScoreboard();
    renderColorPicker();
    renderAvatarPicker();
    updateDeckInfo();
    if (gameEnded) {
      document.getElementById("cardArea").style.display = "none";
      document.getElementById("drawControls").style.display = "none";
      document.getElementById("miniScoreboard").style.display = "none";
      document.getElementById("deckInfo").style.display = "none";
      if (players.length > 0) renderFinalScreen();
    } else {
      render();
      if (CURRENT_MODE === "express" && cardEndAt && cardSecondsLeft() <= 0) {
        expressCardLost();
      } else if (timerEndAt && timerKind) {
        if (secondsLeft() <= 0) {
          const expiredKind = timerKind;
          clearTimer();
          onTimerExpired(expiredKind);
        } else {
          resumeTimerInterval();
        }
      } else if (
        cardState === "revealed" &&
        pendingIndex !== null &&
        currentCard &&
        currentCard.clues[pendingIndex] &&
        currentCard.clues[pendingIndex].type === "clue" &&
        pausedRemainingSeconds === null &&
        CURRENT_MODE !== "express"
      ) {
        markWrong();
      }
    }
    updateDrawAvailability();
  } catch (e) {
    resetDeck();
  }
}
const memSeg = (ms) => (ms / 1e3).toFixed(1).replace(".", ",");
function memLer(k, d) {
  try {
    const v = JSON.parse(JFStore.getItem(k) || "null");
    return v && typeof v === "object" ? v : d;
  } catch (e) {
    return d;
  }
}
function memGravar(k, o) {
  try {
    JFStore.setItem(k, JSON.stringify(o));
  } catch (e) {}
}
const memNum = (v, d) => (typeof v === "number" && isFinite(v) && v >= 0 ? v : d);
function fichaLimpa(f, nome) {
  f = f && typeof f === "object" ? f : {};
  const cat = {};
  MEM_CATS.forEach((c) => {
    const a = f.cat && Array.isArray(f.cat[c]) ? f.cat[c] : null;
    if (a) cat[c] = [memNum(a[0], 0), memNum(a[1], 0)];
  });
  return {
    nome: String(f.nome || nome || "").slice(0, 15),
    partidas: memNum(f.partidas, 0),
    vitorias: memNum(f.vitorias, 0),
    acertos: memNum(f.acertos, 0),
    erros: memNum(f.erros, 0),
    cat,
    msSum: memNum(f.msSum, 0),
    msN: memNum(f.msN, 0),
    joias: memNum(f.joias, 0),
    primeiraDica: memNum(f.primeiraDica, 0),
    melhorPts: memNum(f.melhorPts, 0),
    ultimaVez: memNum(f.ultimaVez, 0),
    magoa: Math.min(3, memNum(f.magoa, 0)),
    absurdos: memNum(f.absurdos, 0),
    dificil: (() => {
      const d = {};
      if (f.dificil && typeof f.dificil === "object")
        MEM_CATS.forEach((c) => {
          const v = memNum(f.dificil[c], 0);
          if (v > 0) d[c] = Math.min(9, v);
        });
      return d;
    })(),
    ultimoResultado: ["venceu", "lanterna", "meio"].includes(f.ultimoResultado) ? f.ultimoResultado : null,
    ultimoModo: typeof f.ultimoModo === "string" ? f.ultimoModo.slice(0, 12) : null,
  };
}
function fichasTodas() {
  return memLer(MEM_FICHAS_KEY, {});
}
function fichaGet(nome) {
  const k = nameKeyPlain(nome);
  const o = fichasTodas();
  return k && o[k] ? fichaLimpa(o[k], nome) : null;
}
function fichaUpd(nome, fn) {
  const k = nameKeyPlain(nome);
  if (!k) return;
  const o = fichasTodas();
  const f = fichaLimpa(o[k], nome);
  fn(f);
  f.nome = String(nome).slice(0, 15);
  delete o[k];
  o[k] = f;
  const ks = Object.keys(o);
  if (ks.length > 80) ks.slice(0, ks.length - 80).forEach((x) => delete o[x]);
  memGravar(MEM_FICHAS_KEY, o);
}
function fichaTaxa(f, cat) {
  const a = f && f.cat && f.cat[cat];
  return a && a[1] > 0 ? { taxa: a[0] / a[1], n: a[1] } : { taxa: null, n: 0 };
}
function memContaFicha(p) {
  return !!p && !p.nickEmprestado;
}
function memPct(x) {
  return Math.round(x * 100) + "%";
}
function memTempoDesde(ms) {
  const d = Math.floor(ms / 864e5);
  if (d <= 0) return "hoje mesmo";
  if (d === 1) return "ontem";
  if (d < 7) return d + " dias";
  if (d < 30) {
    const s = Math.round(d / 7);
    return s === 1 ? "uma semana" : s + " semanas";
  }
  const m = Math.round(d / 30);
  return m <= 1 ? "um mês" : m < 12 ? m + " meses" : "mais de um ano";
}
function memModoNome(m) {
  return (
    { classico: "Clássico", hardcore: "Hardcore", junior: "Júnior", express: "Express", oldschool: "Old School" }[m] ||
    m ||
    "?"
  );
}
function nicksRepertorio() {
  try {
    const a = JSON.parse(JFStore.getItem(NICKS_REPERTORIO_KEY) || "[]");
    return Array.isArray(a) ? a.filter((x) => typeof x === "string") : [];
  } catch (e) {
    return [];
  }
}
function nicksRepertorioGuardar(nome) {
  try {
    const k = nameKeyPlain(nome);
    if (!k || isJfName(nome) || isAnneName(nome)) return;
    const a = nicksRepertorio().filter((x) => nameKeyPlain(x) !== k);
    a.push(String(nome).slice(0, 15));
    JFStore.setItem(NICKS_REPERTORIO_KEY, JSON.stringify(a.slice(-120)));
  } catch (e) {}
}
function exportSave() {
  let state;
  try {
    state = JFStore.getItem("perfil200_state");
  } catch (e) {
    state = null;
  }
  if (!state) {
    caosAvisoModal("Nenhum jogo salvo em andamento encontrado.");
    return;
  }
  const encoded = btoa(encodeURIComponent(state));
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(encoded)
      .then(() => {
        caosAvisoModal("💾 Save copiado! Cole no WhatsApp e mande pro seu amigo continuar a partida.");
      })
      .catch(() => {
        caosPromptModal(
          "Não deu pra copiar automaticamente. Copie o código abaixo manualmente:",
          encoded,
          () => {},
          true,
        );
      });
  } else {
    caosPromptModal("Copie o código do save abaixo:", encoded, () => {}, true);
  }
}
// 1.7.5.4: levar a memória do C.A.O.S. pra outro aparelho ou endereço (o site, um arquivo
// offline, o futuro dicaos.com.br). É um código com tudo o que ele lembra entre partidas:
// fichas, recordes, rivais, nomes e nicks, cartas, avaliações e a memória do gerador.
// Trazer substitui a memória deste aparelho (a partida em andamento não é tocada).
const CAOS_MEMORIA_PREFIXO = "CAOSMEM1.";
function caosMemoriaChaves() {
  return [
    MEM_FICHAS_KEY,
    MEM_RECORDES_KEY,
    MEM_RIVAIS_KEY,
    MEM_ULTIMA_KEY,
    MEM_BOLA_KEY,
    MEM_CARTAS_ABSURDO_KEY,
    CAOS_NAMES_KEY,
    "perfil200_caos_nicks",
    NICKS_REPERTORIO_KEY,
    CAOS_NICKTEMPO_KEY,
    CAOS_CARDMEM_KEY,
    CAOS_RATINGS_KEY,
    CAOS_GERADOR_KEY,
    CAOS_DIAG_KEY,
    "perfil5_caos_fimsrecentes",
  ];
}
function caosMemoriaExportar() {
  const k = {};
  caosMemoriaChaves().forEach((ch) => {
    const v = JFStore.getItem(ch);
    if (v !== null) k[ch] = v;
  });
  let nFichas = 0;
  try {
    nFichas = Object.keys(JSON.parse(k[MEM_FICHAS_KEY] || "{}")).length;
  } catch (e) {}
  if (!Object.keys(k).length) {
    caosAvisoModal("🧠 O C.A.O.S. ainda não lembra de nada neste aparelho. Joguem umas partidas primeiro.");
    return;
  }
  const pacote = { tipo: "memoria-caos", v: 1, versao: NOVIDADES[0].v, data: Date.now(), k };
  const code = CAOS_MEMORIA_PREFIXO + btoa(encodeURIComponent(JSON.stringify(pacote)));
  const msg = `🧠 Memória do C.A.O.S. (${nFichas} jogador${nFichas === 1 ? "" : "es"} com ficha). Cole no outro aparelho em ⋮ → 📥 Trazer.`;
  const manual = () => caosPromptModal(msg + " Copie o código abaixo:", code, () => {}, true);
  if (navigator.clipboard && navigator.clipboard.writeText)
    navigator.clipboard.writeText(code).then(() => caosAvisoModal(msg + " O código já foi copiado."), manual);
  else manual();
}
function caosMemoriaImportar() {
  caosPromptModal("Cole aqui o código da memória do C.A.O.S. (começa com CAOSMEM1.):", "", (code) => {
    if (!code) return;
    let pacote = null;
    try {
      const t = String(code).trim();
      if (t.indexOf(CAOS_MEMORIA_PREFIXO) !== 0) throw new Error("prefixo");
      pacote = JSON.parse(decodeURIComponent(atob(t.slice(CAOS_MEMORIA_PREFIXO.length))));
    } catch (e) {
      caosAvisoModal("❌ Esse código não é uma memória do C.A.O.S. (ou veio cortado). Confere se copiou inteiro.");
      return;
    }
    if (!pacote || pacote.tipo !== "memoria-caos" || !pacote.k || typeof pacote.k !== "object") {
      caosAvisoModal("❌ Esse código não é uma memória do C.A.O.S.");
      return;
    }
    const validas = caosMemoriaChaves().filter((ch) => {
      const v = pacote.k[ch];
      if (typeof v !== "string") return false;
      try {
        JSON.parse(v);
        return true;
      } catch (e) {
        return false;
      }
    });
    let nFichas = 0;
    try {
      nFichas = Object.keys(JSON.parse(pacote.k[MEM_FICHAS_KEY] || "{}")).length;
    } catch (e) {}
    caosConfirmarModal(
      `Trazer a memória do C.A.O.S. (${nFichas} jogador${nFichas === 1 ? "" : "es"} com ficha, de ${new Date(pacote.data || 0).toLocaleDateString("pt-BR")})? Ela substitui o que ele lembra neste aparelho. A partida em andamento não muda.`,
      "Trazer",
      "Cancelar",
      () => {
        validas.forEach((ch) => JFStore.setItem(ch, pacote.k[ch]));
        try {
          JFStore.flushNow();
        } catch (e) {}
        caosCardMem = null;
        caosRatings = null;
        caosDiag = null;
        caosGerMem = null;
        caosLog("memoria", "memória trazida: " + validas.length + " partes, " + nFichas + " fichas");
        showToastMessage(
          `[C.A.O.S.] Memória restaurada. Lembrei de ${nFichas} jogador${nFichas === 1 ? "" : "es"}. Parece que eu nunca saí daqui.`,
          null,
          true,
        );
      },
    );
  });
}
function importSave() {
  caosPromptModal("Cole aqui o código do save que você recebeu:", "", (code) => {
    if (!code) return;
    importSaveAplicar(code);
  });
}
function importSaveAplicar(code) {
  let decoded, parsed;
  try {
    decoded = decodeURIComponent(atob(code.trim()));
    parsed = JSON.parse(decoded);
  } catch (e) {
    caosAvisoModal("❌ Código inválido ou corrompido. Confere se copiou o código inteiro.");
    return;
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.players)) {
    caosAvisoModal("❌ Esse código não parece ser um save do Perfil JF.");
    return;
  }
  let existing = null;
  try {
    existing = JSON.parse(JFStore.getItem("perfil200_state") || "null");
  } catch (e) {
    existing = null;
  }
  const gravar = () => {
    parsed.savedAt = Date.now();
    saveBloqueado = true;
    JFStore.setItem("perfil200_state", JSON.stringify(parsed));
    JFStore.flushNow();
    caosAvisoModal("✅ Jogo importado! A página vai recarregar pra continuar de onde parou.", () => location.reload());
  };
  if (existing && Array.isArray(existing.players) && existing.players.length > 0 && !existing.gameEnded) {
    caosConfirmarModal(
      "Já existe uma partida em andamento neste aparelho. Importar vai APAGAR essa partida e colocar a do código no lugar. Continuar?",
      "Continuar",
      "Cancelar",
      gravar,
    );
    return;
  }
  gravar();
}
function applyStoredPrefs() {
  try {
    if (caosConsole) caosConsole.on = JFStore.getItem("perfil5_caos_console") !== "0";
  } catch (e) {}
  try {
    soundOn = JFStore.getItem("perfil200_som") !== "0";
  } catch (e) {}
  try {
    if (CAOS_VOICE_OK) caosVoiceOn = JFStore.getItem("perfil200_voz") !== "0";
  } catch (e) {}
  try {
    const v = parseFloat(JFStore.getItem("perfil200_voz_vel"));
    if (v >= 1 && v <= 2) caosVoiceSpeed = Math.round(v * 20) / 20;
  } catch (e) {}
  try {
    const v = parseFloat(JFStore.getItem("perfil200_voz_tom"));
    if (v >= 0.6 && v <= 1.4) caosVoicePitch = Math.round(v * 20) / 20;
  } catch (e) {}
  try {
    caosVoiceName = JFStore.getItem("perfil200_voz_nome") || "";
  } catch (e) {}
  try {
    const batata = JFStore.getItem("perfil200_batata") === "1";
    document.body.classList.toggle("batata-mode", batata);
    updateBatataBtn();
  } catch (e) {}
  temaAplicar();
  caosHist = null;
  caosCardMem = null;
  caosDiag = null;
  caosRatings = null;
  updateSoundBtn();
  updateVoiceBtn();
  renderColorPicker();
}
function renderStorageStatus() {
  const el = document.getElementById("storageStatus");
  if (!el) return;
  const s = JFStore.status();
  el.textContent = s.ok
    ? ""
    : '⚠️ Este app/navegador não deixa o jogo salvar sozinho. Antes de fechar, use "📤 Exportar partida" (no menu de pausa) pra não perder a partida.';
  el.style.display = s.ok ? "none" : "";
  el.style.color = s.ok ? "" : "#ffd166";
  el.style.opacity = s.ok ? "0.55" : "1";
}
function caosNomeArquivo(base) {
  const d = new Date(),
    z = (v) => String(v).padStart(2, "0");
  return (
    "perfil-jf_" +
    base +
    "_" +
    d.getFullYear() +
    "-" +
    z(d.getMonth() + 1) +
    "-" +
    z(d.getDate()) +
    "_" +
    z(d.getHours()) +
    z(d.getMinutes()) +
    ".md"
  );
}
function caosCopiarTexto(txt, ta) {
  return new Promise((res) => {
    const via = () => {
      try {
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        if (document.execCommand && document.execCommand("copy")) {
          res(true);
          return;
        }
      } catch (e) {}
      res(false);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        let feito = false;
        const t = setTimeout(() => {
          if (!feito) {
            feito = true;
            via();
          }
        }, 1200);
        navigator.clipboard.writeText(txt).then(
          () => {
            if (!feito) {
              feito = true;
              clearTimeout(t);
              res(true);
            }
          },
          () => {
            if (!feito) {
              feito = true;
              clearTimeout(t);
              via();
            }
          },
        );
        return;
      }
    } catch (e) {}
    via();
  });
}
function caosEntregarTexto(nome, txt, titulo, sub) {
  const antigo = document.getElementById("caosEntregaModal");
  if (antigo) antigo.remove();
  const { ov, box } = caosModalBase();
  ov.id = "caosEntregaModal";
  const tit = caosModalMsg(titulo || "📄 Exportar");
  tit.style.fontWeight = "700";
  tit.style.marginBottom = "6px";
  const info = caosModalMsg((sub || "") + " Arquivo: " + nome);
  info.style.fontSize = ".85rem";
  info.style.opacity = ".8";
  const ta = document.createElement("textarea");
  ta.readOnly = true;
  ta.rows = 8;
  ta.value = txt;
  ta.style.cssText =
    "width:100%;box-sizing:border-box;padding:10px;margin:0 0 12px;border-radius:8px;border:1px solid #555a7a;background:#0f0f1e;color:#cbd5e1;font-size:12px;font-family:monospace;text-align:left";
  const st = document.createElement("div");
  st.style.cssText = "min-height:20px;margin:-4px 0 10px;font-size:.85rem;color:#86efac;white-space:pre-line";
  const linha = caosModalRow();
  linha.style.flexWrap = "wrap";
  const toque =
    /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent || "") ||
    (navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1) ||
    !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  const bCop = caosModalBtn("📋 Copiar tudo", "#16a34a", async () => {
    const ok = await caosCopiarTexto(txt, ta);
    st.style.color = ok ? "#86efac" : "#fcd34d";
    st.textContent = ok
      ? "✅ Copiado! Cole num bloco de notas, no WhatsApp ou onde preferir."
      : "Texto selecionado acima: toque e segure para copiar.";
  });
  linha.appendChild(bCop);
  if (navigator.share) {
    linha.appendChild(
      caosModalBtn("📤 Compartilhar", "#2563eb", async () => {
        try {
          let arq = null;
          try {
            arq = new File(["\ufeff" + txt], nome, { type: "text/markdown" });
          } catch (e) {}
          if (arq && navigator.canShare && navigator.canShare({ files: [arq] }))
            await navigator.share({ files: [arq], title: titulo });
          else await navigator.share({ title: titulo, text: txt });
          st.style.color = "#86efac";
          st.textContent = "✅ Enviado para o compartilhamento do aparelho.";
        } catch (e) {
          if (e && e.name === "AbortError") {
            st.textContent = "";
          } else {
            st.style.color = "#fcd34d";
            st.textContent = "Este aparelho não deixou compartilhar aqui. Use Copiar tudo.";
          }
        }
      }),
    );
  }
  if (!toque) {
    linha.appendChild(
      caosModalBtn("⬇️ Baixar .md", "#7c3aed", () => {
        try {
          const blob = new Blob(["\ufeff" + txt], { type: "text/markdown;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = nome;
          a.style.display = "none";
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            a.remove();
            URL.revokeObjectURL(url);
          }, 1500);
          st.style.color = "#86efac";
          st.textContent = "✅ Download iniciado.";
        } catch (e) {
          st.style.color = "#fcd34d";
          st.textContent = "Não deu pra baixar aqui. Use Copiar tudo.";
        }
      }),
    );
  }
  const fim = caosModalRow();
  fim.style.marginTop = "10px";
  fim.appendChild(caosModalBtn("Fechar", "#444a66", () => ov.remove()));
  box.style.maxWidth = "440px";
  box.append(tit, info, ta, st, linha, fim);
  ov.addEventListener("click", (e) => {
    if (e.target === ov) ov.remove();
  });
  document.body.appendChild(ov);
  setTimeout(() => {
    try {
      ta.focus();
      ta.select();
    } catch (e) {}
  }, 80);
}
function caosCardMemLoad() {
  try {
    const raw = JFStore.getItem(CAOS_CARDMEM_KEY);
    if (raw) caosCardMem = JSON.parse(raw);
  } catch (e) {}
  if (!caosCardMem || typeof caosCardMem !== "object") caosCardMem = { porCarta: {} };
  if (!caosCardMem.porCarta) caosCardMem.porCarta = {};
}
function caosCardMemSave() {
  try {
    JFStore.setItem(CAOS_CARDMEM_KEY, JSON.stringify(caosCardMem));
  } catch (e) {}
}
function caosCardMemRecord(cardAnswer, acertou) {
  if (!caosCardMem) caosCardMemLoad();
  if (!cardAnswer) return;
  const pc =
    caosCardMem.porCarta[cardAnswer] || (caosCardMem.porCarta[cardAnswer] = { acertos: 0, erros: 0, taxaEMA: null });
  if (acertou) pc.acertos++;
  else pc.erros++;
  pc.taxaEMA =
    pc.taxaEMA != null
      ? pc.taxaEMA * (1 - CAOS_CARDMEM_ALPHA) + (acertou ? 1 : 0) * CAOS_CARDMEM_ALPHA
      : acertou
        ? 1
        : 0;
  caosCardMemSave();
}
function caosCardMemOnDraw(cardAnswer) {
  if (!caosCardMem) caosCardMemLoad();
  if (!cardAnswer) return null;
  const pc = caosCardMem.porCarta[cardAnswer];
  if (!pc || pc.acertos + pc.erros < 3) return null;
  const taxa = pc.taxaEMA != null ? pc.taxaEMA : pc.acertos / (pc.acertos + pc.erros);
  if (taxa >= 0.7) return "facil";
  if (taxa <= 0.35) return "dificil";
  return "media";
}
function caosExtraSalvar() {
  try {
    return {
      emo: { tensao: caosEmo.tensao, calor: caosEmo.calor, paciencia: caosEmo.paciencia },
      temper: Object.keys(CAOS_TEMPERAMENTOS).find((k) => CAOS_TEMPERAMENTOS[k] === caosTemper) || "normal",
      eixos: { alegria: caosEixos.alegria, confianca: caosEixos.confianca, curiosidade: caosEixos.curiosidade },
      eixosCats: caosEixosCats.slice(-6),
      console: caosConsole
        ? {
            g: { ...caosConsole.g },
            atual: caosConsole.atual,
            dwell: caosConsole.dwell,
            seqOk: caosConsole.seqOk,
            seqErr: caosConsole.seqErr,
          }
        : null,
      implic: caosImplic,
      vinc: caosVinc,
      pergunta: { n: caosPerguntaN, ult: caosPerguntaUlt },
      pausaAcum: caosPausaAcum,
      mudo: caosMudoCarta,
      mudoPor: caosMudoPor,
    };
  } catch (e) {
    return null;
  }
}
function caosLoadHist() {
  try {
    const raw = JFStore.getItem(CAOS_HIST_KEY);
    const o = raw ? JSON.parse(raw) : {};
    return o && typeof o === "object" ? o : {};
  } catch (e) {
    return {};
  }
}
function caosSaveHist() {
  try {
    JFStore.setItem(CAOS_HIST_KEY, JSON.stringify(caosHist));
  } catch (e) {}
}
function caosRatingsLoad() {
  if (caosRatings) return caosRatings;
  try {
    const o = JSON.parse(JFStore.getItem(CAOS_RATINGS_KEY) || "{}");
    caosRatings = o && typeof o === "object" ? o : {};
  } catch (e) {
    caosRatings = {};
  }
  return caosRatings;
}
function caosDiagLoad() {
  if (caosDiag) return caosDiag;
  try {
    const o = JSON.parse(JFStore.getItem(CAOS_DIAG_KEY) || "null");
    caosDiag = o && typeof o === "object" && o.by ? o : { matches: 0, total: 0, by: {} };
  } catch (e) {
    caosDiag = { matches: 0, total: 0, by: {} };
  }
  return caosDiag;
}
function caosDiagSave() {
  try {
    JFStore.setItem(CAOS_DIAG_KEY, JSON.stringify(caosDiag));
  } catch (e) {}
  caosDiagUnsaved = 0;
}
function caosPartidaMarkdown() {
  const L = [];
  const esc = (t) =>
    String(t == null ? "" : t)
      .replace(/\|/g, "\\|")
      .replace(/\r?\n/g, " ")
      .trim();
  const n1 = (v) => {
    const n = Number(v);
    return isFinite(n) ? (Math.round(n * 10) / 10).toString().replace(".", ",") : "0";
  };
  const soma = (a, f) => a.reduce((t, x) => t + (Number(f(x)) || 0), 0);
  const modoNome =
    { classico: "Clássico", hardcore: "Hardcore", junior: "Júnior", express: "Express", oldschool: "Old School" }[
      CURRENT_MODE
    ] || CURRENT_MODE;
  const equipe = CURRENT_FORMAT === "equipe";
  const wc = winCond();
  let wcLabel = wc;
  try {
    wcLabel =
      CURRENT_MODE === "express"
        ? "Express (pontos)"
        : WIN_CONDITIONS[WIN_CONDITION]
          ? WIN_CONDITIONS[WIN_CONDITION].label +
            (WIN_CONDITION === "casa" && CASA_MODOS.includes(casaSorteado) ? " (sorteado: " + casaSorteado + ")" : "")
          : wc;
  } catch (e) {}
  const gemStr = (h) => {
    const g = h && h.gems ? h.gems : null;
    if (!g) return "—";
    try {
      const r = currentGemCategories()
        .filter((c) => g[c] > 0)
        .map((c) => c + (g[c] > 1 ? "×" + g[c] : ""))
        .join(", ");
      return r || "—";
    } catch (e) {
      return "—";
    }
  };
  const agora = new Date();
  const hist = (history || []).filter((h) => h && h.playerName);
  const minutos = caosPartidaInicioAt ? caosMinutosPartida() : null;
  L.push("# Perfil JF — Dados da partida", "");
  L.push("- **Exportado em:** " + agora.toLocaleString("pt-BR"));
  L.push("- **Versão:** Beta 1.7.7 · C.A.O.S. 4.0");
  L.push("- **Modo:** " + modoNome + " · **Formato:** " + (equipe ? "Equipe" : "Versus"));
  L.push("- **Condição de vitória:** " + wcLabel);
  if (minutos !== null) L.push("- **Duração:** " + minutos + " min");
  L.push("- **Jogadores (" + players.length + "):** " + players.map((p) => p.name).join(", "));
  L.push("- **Cartas sorteadas:** " + stats.totalDrawn);
  L.push("");
  /* resultado */
  L.push("## Resultado final", "");
  let vencedor = "";
  if (equipe) {
    const ids = (teamOrder || []).filter((id) => teams[id]);
    const tv = (id) => rankValue(teams[id], id);
    const ord = [...ids].sort((a, b) => tv(b) - tv(a));
    const gt = gemWinner && gemWinner.kind === "team" && teams[gemWinner.id] ? gemWinner.id : null;
    if (gt) {
      ord.splice(ord.indexOf(gt), 1);
      ord.unshift(gt);
    }
    if (ord.length) {
      const topo = tv(ord[0]);
      const emp = ord.filter((id) => tv(id) === topo);
      vencedor = gt
        ? "Equipe " + TEAM_INFO[gt].label + " (reuniu as " + GEMS_TO_WIN + " joias)"
        : topo === 0
          ? "Ninguém pontuou"
          : emp.length > 1
            ? "Empate: " + emp.map((id) => "Equipe " + TEAM_INFO[id].label).join(" e ")
            : "Equipe " + TEAM_INFO[ord[0]].label;
    }
    L.push("**Vencedor:** " + (vencedor || "—"), "");
    L.push("| Pos | Equipe | Membros | Pontos | Casa | Joias |", "|---|---|---|---|---|---|");
    let rk = 0;
    ord.forEach((id, i) => {
      if (i === 0 || (gt && i === 1) || tv(id) !== tv(ord[i - 1])) rk = i + 1;
      L.push(
        "| " +
          rk +
          "º | " +
          esc(TEAM_INFO[id].label) +
          " | " +
          esc(
            players
              .filter((p) => p.team === id)
              .map((p) => p.name)
              .join(", "),
          ) +
          " | " +
          teamScore(id) +
          " | " +
          (teams[id].position || 0) +
          " | " +
          esc(gemStr(teams[id])) +
          " |",
      );
    });
  } else {
    const pv = (p) => rankValue(p);
    const ord = [...players].sort((a, b) => pv(b) - pv(a));
    const gp = gemWinner && gemWinner.kind === "player" && players[gemWinner.id] ? players[gemWinner.id] : null;
    if (gp) {
      ord.splice(ord.indexOf(gp), 1);
      ord.unshift(gp);
    }
    if (ord.length) {
      const topo = pv(ord[0]);
      const emp = ord.filter((p) => pv(p) === topo);
      vencedor = gp
        ? gp.name + " (reuniu as " + GEMS_TO_WIN + " joias)"
        : topo === 0
          ? "Ninguém pontuou"
          : emp.length > 1
            ? "Empate: " + emp.map((p) => p.name).join(" e ")
            : ord[0].name;
    }
    L.push("**Vencedor:** " + (vencedor || "—"), "");
    L.push("| Pos | Jogador | Pontos | Casa | Joias | Tom do C.A.O.S. com ele |", "|---|---|---|---|---|---|");
    let rk = 0;
    ord.forEach((p, i) => {
      if (i === 0 || (gp && i === 1) || pv(p) !== pv(ord[i - 1])) rk = i + 1;
      L.push(
        "| " +
          rk +
          "º | " +
          esc(p.name) +
          " | " +
          (p.score || 0) +
          " | " +
          (p.position || 0) +
          " | " +
          esc(gemStr(p)) +
          " | " +
          esc(p.humor || "—") +
          " |",
      );
    });
  }
  L.push("");
  /* resumo */
  L.push("## Resumo da partida", "");
  const semDono = (stats.totalExhausted || 0) + (stats.totalDiscarded || 0);
  L.push("- Cartas sorteadas: **" + stats.totalDrawn + "**");
  L.push("- Cartas respondidas (acertos): **" + history.length + "**");
  L.push(
    "- Cartas sem dono: **" +
      semDono +
      "** (dicas esgotadas: " +
      (stats.totalExhausted || 0) +
      " · descartadas: " +
      (stats.totalDiscarded || 0) +
      ")",
  );
  try {
    L.push("- Dicas puladas: **" + (caosMesa.pulos || 0) + "** · Absurdos: **" + (caosMesa.absurdos || 0) + "**");
  } catch (e) {}
  try {
    if (typeof caosCofrinho === "number" && caosCofrinho > 0)
      L.push("- Cofrinho do C.A.O.S.: **" + caosCofrinho + "** ponto" + (caosCofrinho === 1 ? "" : "s"));
  } catch (e) {}
  if (hist.length) {
    const mvp = computeMvp();
    if (mvp) L.push("- MVP (maior média de pontos por acerto): **" + mvp.name + "** — " + n1(mvp.avg) + " pts/acerto");
    const cc = hist.filter((h) => typeof h.cluesUsed === "number");
    if (cc.length)
      L.push("- Média de dicas por acerto (mesa toda): **" + n1(soma(cc, (h) => h.cluesUsed) / cc.length) + "**");
    const tt = hist.filter((h) => typeof h.timeTakenMs === "number");
    if (tt.length) {
      const ttOk = tt.filter((h) => h.timeTakenMs >= 1500);
      const rap = ttOk.length ? ttOk.reduce((a, b) => (a.timeTakenMs < b.timeTakenMs ? a : b)) : null;
      L.push(
        "- Tempo médio de resposta: **" +
          n1(soma(tt, (h) => h.timeTakenMs) / tt.length / 1e3) +
          " s**" +
          (rap
            ? " · mais rápida: " +
              esc(rap.playerName) +
              " com " +
              esc(rap.answer) +
              " em " +
              n1(rap.timeTakenMs / 1e3) +
              " s"
            : "") +
          (tt.length > ttOk.length
            ? " · (" + (tt.length - ttOk.length) + " resposta(s) abaixo de 1,5 s não entram no recorde)"
            : ""),
      );
    }
  }
  L.push("");
  /* por jogador */
  L.push("## Desempenho por jogador", "");
  L.push(
    "| Jogador | Acertos | Pts (acertos) | Média pts/acerto | Média dicas | Tempo médio (s) | Mais rápido (s) | Cartas como Mestre | Pts como Mestre | Dicas puladas | Absurdos |",
    "|---|---|---|---|---|---|---|---|---|---|---|",
  );
  players.forEach((p) => {
    const h = hist.filter((x) => x.playerName === p.name);
    const tp = h.filter((x) => typeof x.timeTakenMs === "number");
    const m = hist.filter((x) => x.mestreName === p.name);
    let pu = 0,
      ab = 0;
    try {
      pu = caosMesa.pulosPor[p.name] || 0;
      ab = caosMesa.absurdosPor[p.name] || 0;
    } catch (e) {}
    L.push(
      "| " +
        esc(p.name) +
        " | " +
        h.length +
        " | " +
        soma(h, (x) => x.points) +
        " | " +
        (h.length ? n1(soma(h, (x) => x.points) / h.length) : "—") +
        " | " +
        (h.length ? n1(soma(h, (x) => x.cluesUsed) / h.length) : "—") +
        " | " +
        (tp.length ? n1(soma(tp, (x) => x.timeTakenMs) / tp.length / 1e3) : "—") +
        " | " +
        (tp.some((x) => x.timeTakenMs >= 1500)
          ? n1(Math.min(...tp.filter((x) => x.timeTakenMs >= 1500).map((x) => x.timeTakenMs)) / 1e3)
          : "—") +
        " | " +
        m.length +
        " | " +
        soma(m, (x) => x.mestrePoints) +
        " | " +
        pu +
        " | " +
        ab +
        " |",
    );
  });
  L.push("");
  /* categorias e dicas */
  if (hist.length) {
    L.push("## Acertos por categoria", "");
    L.push("| Categoria | Acertos | Média de dicas | Pts total |", "|---|---|---|---|");
    const cat = {};
    hist.forEach((h) => {
      let c = h.category;
      try {
        c = gemCategoryFor(h.category);
      } catch (e) {}
      const o = cat[c] || (cat[c] = { n: 0, d: 0, p: 0 });
      o.n++;
      o.d += Number(h.cluesUsed) || 0;
      o.p += Number(h.points) || 0;
    });
    Object.entries(cat)
      .sort((a, b) => b[1].n - a[1].n)
      .forEach(([c, o]) => L.push("| " + esc(c) + " | " + o.n + " | " + n1(o.d / o.n) + " | " + o.p + " |"));
    L.push("");
    L.push("## Quantas dicas foram usadas nos acertos", "");
    L.push("| Dicas usadas | Cartas |", "|---|---|");
    const dist = {};
    hist.forEach((h) => {
      const k = Number(h.cluesUsed) || 0;
      dist[k] = (dist[k] || 0) + 1;
    });
    Object.keys(dist)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((k) => L.push("| " + k + " | " + dist[k] + " |"));
    L.push("");
  }
  /* cartas */
  L.push("## Cartas respondidas (em ordem)", "");
  if (hist.length) {
    L.push(
      "| # | Jogador | Categoria | Resposta | Pts | Dicas | Tempo (s) | Mestre | Pts Mestre | Bônus |",
      "|---|---|---|---|---|---|---|---|---|---|",
    );
    hist.forEach((h, i) =>
      L.push(
        "| " +
          (i + 1) +
          " | " +
          esc(h.playerName) +
          " | " +
          esc(h.category) +
          " | " +
          esc(h.answer) +
          " | " +
          (h.points == null ? "" : h.points) +
          " | " +
          (h.cluesUsed == null ? "" : h.cluesUsed) +
          " | " +
          (typeof h.timeTakenMs === "number" ? n1(h.timeTakenMs / 1e3) : "—") +
          " | " +
          esc(h.mestreName || "—") +
          " | " +
          (h.mestrePoints == null ? "" : h.mestrePoints) +
          " | " +
          (h.wasBonus ? "sim" : "não") +
          " |",
      ),
    );
  } else L.push("Nenhuma carta foi acertada nesta partida.");
  L.push("");
  /* falas */
  L.push("## Falas do C.A.O.S.", "");
  if (caosMatchLog && caosMatchLog.length) {
    const nota = (e) => (!e.rated ? "—" : e.r === 1 ? "👍" : e.r === -1 ? "👎" : "😐");
    L.push("| Carta | Nota | Banco | Fala |", "|---|---|---|---|");
    caosMatchLog.forEach((e) =>
      L.push("| " + (e.n > 0 ? e.n : "cadastro") + " | " + nota(e) + " | " + esc(e.bank) + " | " + esc(e.text) + " |"),
    );
  } else L.push("Nenhuma fala registrada.");
  L.push("");
  /* humor e emoções do C.A.O.S. */
  const hora = (t) => {
    try {
      return new Date(t).toLocaleTimeString("pt-BR");
    } catch (e) {
      return "";
    }
  };
  const dl = Array.isArray(caosDecisionLog) ? caosDecisionLog : [];
  try {
    L.push("## Humor e emoções do C.A.O.S.", "");
    let mAg = "—",
      mMat = "neutro",
      est = "—";
    try {
      mAg = caosMood();
    } catch (e) {}
    try {
      mMat = caosHumorMatriz() || "neutro";
    } catch (e) {}
    try {
      est = caosEstadoComposto();
    } catch (e) {}
    L.push("- **Temperamento do dia:** " + esc((caosTemper && caosTemper.nome) || "normal"));
    L.push("- **Humor ao encerrar:** " + esc(mMat) + " · ritmo da mesa: " + esc(mAg) + " · estado: " + esc(est));
    try {
      const h = caosHumorContinuo();
      L.push("- **Emoção dominante no fim:** " + esc(h.emo) + (h.sec ? " (com " + esc(h.sec) + " ao fundo)" : ""));
    } catch (e) {}
    L.push(
      "- **Tensão / calor / paciência no fim (0–10):** " +
        n1(caosEmo.tensao) +
        " / " +
        n1(caosEmo.calor) +
        " / " +
        n1(caosEmo.paciencia == null ? 7 : caosEmo.paciencia),
    );
    try {
      L.push(
        "- **Cansaço:** " +
          esc(caosFatigueLevel) +
          (caosSilenced
            ? caosFatigueLevel === "exausto"
              ? " · saiu sozinho por cansaço"
              : " · está calado (ADM ou saída temporária)"
            : ""),
      );
    } catch (e) {}
    try {
      const ex = caosEixos;
      L.push(
        "- **Eixos no fim (−10 a 10):** alegria " +
          n1(ex.alegria) +
          " · confiança " +
          n1(ex.confianca) +
          " · curiosidade " +
          n1(ex.curiosidade),
      );
    } catch (e) {}
    try {
      const g =
        caosConsole && caosConsole.g
          ? Object.entries(caosConsole.g)
              .filter(([k, v]) => v >= 0.5)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => k + " " + n1(v))
          : [];
      if (g.length) L.push("- **Emoções ainda acesas no fim:** " + g.join(" · "));
    } catch (e) {}
    L.push("");
    const eh = Array.isArray(caosEmoHist) ? caosEmoHist : [];
    if (eh.length) {
      L.push("### Fluxo de humor ao longo da partida", "");
      const cont = (arr, f) => {
        const o = {};
        arr.forEach((x) => {
          const k = f(x) || "—";
          o[k] = (o[k] || 0) + 1;
        });
        return Object.entries(o)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => k + " (" + v + ")")
          .join(" · ");
      };
      L.push("- **Humor (nº de registros):** " + cont(eh, (x) => x.humor));
      L.push("- **Estado emocional (nº de registros):** " + cont(eh, (x) => x.estado));
      let mud = 0;
      for (let i = 1; i < eh.length; i++) if (eh[i].humor !== eh[i - 1].humor) mud++;
      L.push("- **Trocas de humor:** " + mud + " em " + eh.length + " registros", "");
      L.push(
        "| Carta | Humor | Estado | Tensão | Calor | Paciência | Motivo | Fala do C.A.O.S. |",
        "|---|---|---|---|---|---|---|---|",
      );
      eh.forEach((x) =>
        L.push(
          "| " +
            (x.carta || 0) +
            " | " +
            esc(x.humor) +
            " | " +
            esc(x.estado) +
            " | " +
            n1(x.t) +
            " | " +
            n1(x.c) +
            " | " +
            n1(x.p) +
            " | " +
            esc(x.motivo) +
            " | " +
            esc(x.fala) +
            " |",
        ),
      );
      L.push("");
    }
    const trans = dl.filter((e) => e && e.tipo === "humor");
    if (trans.length) {
      L.push("### Trocas de humor (com horário)", "");
      trans.forEach((e) => L.push("- " + hora(e.t) + " · " + esc(e.detalhe)));
      L.push("");
    }
    L.push("## Quem o C.A.O.S. marcou", "");
    const V = caosVinc || {};
    L.push(
      "- **Favorito secreto:** " +
        (V.fav ? "**" + esc(V.fav) + "** — motivo dele: " + esc(V.motivo) : "não escolheu ninguém"),
    );
    L.push(
      "- **Desafeto da partida:** " +
        (V.desafetoFoi || V.desafeto ? "**" + esc(V.desafetoFoi || V.desafeto) + "**" : "ninguém"),
    );
    const rs = Object.entries(V.ress || {})
      .filter(([k, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);
    if (rs.length)
      L.push(
        "- **Ressentimento por jogador (0 a 6; a partir de 3 vira desafeto):** " +
          rs.map(([k, v]) => esc(k) + " " + n1(v)).join(" · "),
      );
    const ng = Object.keys(V.negados || {});
    if (ng.length) L.push('- **Ouviram "não é você, é o outro":** ' + ng.map(esc).join(", "));
    const ac = Object.keys(V.acusou || {});
    if (ac.length) L.push("- **Acusados por ele quando a fala tomou 👎:** " + ac.map(esc).join(", "));
    const al = Object.entries((caosMesa && caosMesa.alvos) || {}).sort((a, b) => b[1] - a[1]);
    if (al.length) {
      L.push("", "### Quem mandou quem voltar casas", "", "| Quem → alvo | Vezes |", "|---|---|");
      al.forEach(([k, v]) => L.push("| " + esc(k) + " | " + v + " |"));
    }
    const tl = Object.keys((caosMesa && caosMesa.tilt) || {}),
      pr = Object.entries((caosMesa && caosMesa.precoce) || {}).filter(([k, v]) => v > 0),
      ab = Object.entries((caosMesa && caosMesa.absCat) || {}),
      dg = Object.keys((caosMesa && caosMesa.diag) || {});
    if (tl.length || pr.length || ab.length || dg.length) {
      L.push("", "### Marcas do C.A.O.S. por jogador", "");
      if (tl.length) L.push("- **Entrou em tilt:** " + tl.map(esc).join(", "));
      if (pr.length)
        L.push("- **Chutes precoces (errou na 1ª dica):** " + pr.map(([k, v]) => esc(k) + " " + v).join(" · "));
      if (ab.length)
        L.push(
          "- **Absurdos por categoria:** " +
            ab
              .map(([k, v]) => {
                const q = k.split("|");
                return esc(q[0]) + " em " + esc(q[1]) + " (" + v + ")";
              })
              .join(" · "),
        );
      if (dg.length)
        L.push(
          "- **Laudos de dificuldade:** " +
            dg
              .map((k) => {
                const q = k.split("|");
                return esc(q[0]) + " (" + esc(q[1]) + ")";
              })
              .join(" · "),
        );
    }
    L.push("");
    const rt = Array.isArray(caosRitmoLog) ? caosRitmoLog : [];
    if (rt.length) {
      L.push(
        "## Ritmo de resposta (por tentativa)",
        "",
        "| Carta | Jogador | Tempo (s) | Acertou | Dificuldade | Resposta | Dicas | Humor | Estado |",
        "|---|---|---|---|---|---|---|---|---|",
      );
      rt.forEach((x) =>
        L.push(
          "| " +
            (x.carta || 0) +
            " | " +
            esc(x.nome) +
            " | " +
            n1((x.ms || 0) / 1e3) +
            " | " +
            (x.ok ? "sim" : "não") +
            " | " +
            esc(x.dif || "—") +
            " | " +
            esc(x.resp) +
            " | " +
            (x.dicas == null ? "" : x.dicas) +
            " | " +
            esc(x.humor) +
            " | " +
            esc(x.estado) +
            " |",
        ),
      );
      L.push("");
    }
    const cl = caosConsole && Array.isArray(caosConsole.log) ? caosConsole.log : [];
    if (cl.length) {
      L.push("### Gatilhos emocionais (o que mexeu com ele)", "");
      cl.forEach((x) => L.push("- " + esc(x)));
      L.push("");
    }
    if (dl.length) {
      L.push(
        "## Linha do tempo do C.A.O.S. (todos os eventos)",
        "",
        "| Hora | Tipo | Humor | Estado | Detalhe |",
        "|---|---|---|---|---|",
      );
      dl.forEach((e) =>
        L.push(
          "| " +
            hora(e.t) +
            " | " +
            esc(e.tipo) +
            " | " +
            esc(e.humor) +
            " | " +
            esc(e.estado) +
            " | " +
            esc(e.detalhe) +
            " |",
        ),
      );
      L.push("");
    }
  } catch (e) {
    L.push("_(não foi possível montar a seção de humor: " + esc(e && e.message) + ")_", "");
  }
  /* bruto */
  let raw = "";
  try {
    raw = JSON.stringify(
      {
        exportadoEm: agora.toISOString(),
        versao: "Beta 1.7.7 · C.A.O.S. 4.0",
        modo: CURRENT_MODE,
        formato: CURRENT_FORMAT,
        condicaoVitoria: wc,
        duracaoMin: minutos,
        cartasSorteadas: stats.totalDrawn,
        stats: stats,
        jogadores: players.map((p) => ({
          nome: p.name,
          pontos: p.score,
          casa: p.position,
          equipe: p.team || null,
          joias: p.gems || {},
          tomDoCaos: p.humor || null,
        })),
        historico: history,
        mesa: caosMesa,
        falas: caosMatchLog,
        caos: {
          temperamento: (caosTemper && caosTemper.nome) || null,
          tensaoCalorPaciencia: caosEmo,
          eixos: caosEixos,
          vinculo: caosVinc,
          fluxoDeHumor: caosEmoHist,
          ritmo: caosRitmoLog,
          gatilhos: (caosConsole && caosConsole.log) || [],
          eventos: caosDecisionLog,
        },
      },
      null,
      2,
    );
  } catch (e) {
    raw = "";
  }
  if (raw) {
    L.push("## Dados brutos (JSON)", "", "```json", raw, "```", "");
  }
  L.push(
    "---",
    "",
    "_Observações: o arquivo guarda até 1000 registros de cada tipo (cartas, falas, eventos, fluxo de humor e ritmo) e até 300 gatilhos emocionais, bem mais do que uma partida costuma gerar. Cartas sem dono aparecem só como totais._",
    "",
  );
  return L.join("\n");
}
// No GitHub Pages (https), registra o sw.js para o jogo abrir sem internet
// depois da primeira visita. Aberto como arquivo (file://), não faz nada.
function registrarOffline() {
  try {
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost"))
      navigator.serviceWorker.register("sw.js").catch(() => {});
  } catch (e) {}
}
// Instalar o app na tela de início. Android (Chrome): usa o aviso do próprio navegador.
// iPhone (Safari) não tem aviso: mostra o passo a passo. Já instalado: o botão some.
let instalarPrompt = null;
function appInstalado() {
  try {
    return (
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true
    );
  } catch (e) {
    return false;
  }
}
function aparelhoIOS() {
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}
function aparelhoAndroid() {
  return /Android/i.test(navigator.userAgent || "");
}
function instalarAtualizarBotao() {
  const b = document.getElementById("btnInstalar");
  if (!b) return;
  const pode =
    !appInstalado() && location.protocol !== "file:" && (instalarPrompt || aparelhoIOS() || aparelhoAndroid());
  b.style.display = pode ? "" : "none";
}
function instalarApp() {
  if (instalarPrompt) {
    const pr = instalarPrompt;
    instalarPrompt = null;
    try {
      pr.prompt();
      pr.userChoice.then(() => instalarAtualizarBotao()).catch(() => {});
    } catch (e) {}
    return;
  }
  caosAvisoModal(
    aparelhoIOS()
      ? "📲 Pra instalar no iPhone/iPad:\n\n1. Abra o jogo no Safari.\n2. Toque em Compartilhar (o quadrado com a seta pra cima).\n3. Toque em Adicionar à Tela de Início.\n\nO jogo abre em tela cheia e funciona sem internet."
      : "📲 Pra instalar no Android:\n\n1. Abra o jogo no Chrome.\n2. Toque no menu ⋮ do navegador (canto de cima).\n3. Toque em Instalar app (ou Adicionar à tela inicial).\n\nO jogo abre em tela cheia e funciona sem internet.",
  );
}
// Botão voltar do Android no meio da partida: pausa o jogo em vez de fechar o app.
// (window.history explícito: "history" no jogo é a lista de cartas acertadas.)
function voltarGuardar() {
  try {
    if (!window.history.state || !window.history.state.perfilJF) window.history.pushState({ perfilJF: 1 }, "");
  } catch (e) {}
}
// 1.7.7 (revisão GPT/Google): com uma janela aberta, o voltar cuida dela primeiro.
// O tutorial fecha; as outras janelas pedem uma decisão, então o voltar só não deixa sair
// do jogo nem pausar por baixo delas.
function voltarJanelaAberta() {
  const tut = document.getElementById("tutorialOverlay");
  if (tut && tut.style.display !== "none" && getComputedStyle(tut).display !== "none") {
    const x = document.getElementById("tutClose");
    if (x) x.click();
    return true;
  }
  return !!document.querySelector(".caos-modal-ov, .jf-modal-bg");
}
function voltarApertado() {
  if (starterChosen && !gameEnded && voltarJanelaAberta()) {
    voltarGuardar();
    return;
  }
  if (starterChosen && !gameEnded && document.getElementById("gameScreen").style.display !== "none") {
    voltarGuardar();
    if (!pausaEstaAberta()) pauseGame();
  }
}
function caosExportarPartidaModal() {
  let md;
  try {
    md = caosPartidaMarkdown();
  } catch (e) {
    md = "Erro ao gerar o relatório: " + (e && e.message ? e.message : e);
  }
  caosEntregarTexto(
    caosNomeArquivo("partida"),
    md,
    "📄 Dados da partida",
    "Copie o texto ou compartilhe o arquivo .md.",
  );
}

