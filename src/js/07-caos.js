/* ======================================================================
 * 7. C.A.O.S. (FALAS, HUMOR, ROSTOS, MEMÓRIA, DECISÕES)
 * ====================================================================== */

function caosEmoK(emo) {
  const t = (caosEmo.tensao ?? 5) / 10,
    c = (caosEmo.calor ?? 5) / 10,
    p = (caosEmo.paciencia ?? 7) / 10;
  try {
    const m = CAOS_CONSOLE_DE_ROSTO[emo];
    if (caosConsole && caosConsole.on && m)
      return Math.max(0, Math.min(1, caosConsole.g[m] / 10 + (Math.random() - 0.5) * 0.2));
  } catch (e) {}
  try {
    const S = caosHumorScores();
    if (S[emo] !== void 0) return Math.max(0, Math.min(1, S[emo] + (Math.random() - 0.5) * 0.2));
  } catch (e) {}
  if (["raiva", "furia", "julgando", "desafio", "deboche", "preocupado", "medo", "ansiedade"].includes(emo)) return t;
  if (["orgulho", "festa", "carinho", "surpresa"].includes(emo)) return c;
  if (emo === "tedio") return 1 - p;
  return 0.5;
}
function caosFaceEscolher(emo, bank) {
  const E = CAOS_EMOS[emo] || CAOS_EMOS.calmo,
    N = E.niv.length;
  let lv = Math.round(
    Math.max(0, Math.min(1, caosEmoK(emo) + caosMesaIntim())) * (N - 1) +
      (CAOS_EMO_GRAVE[String(bank || "").split(".")[0]] || 0),
  );
  lv = Math.max(0, Math.min(N - 1, lv));
  if (["triste", "medo", "ansiedade", "vergonha", "inveja", "nostalgia"].includes(emo) && caosSuaveAlvo(bank)) lv = 0;
  const vs = E.niv[lv],
    chave = emo + ":" + lv;
  const mem = Array.isArray(caosFaceUlt[chave]) ? caosFaceUlt[chave] : (caosFaceUlt[chave] = []),
    jan = Math.min(vs.length - 1, Math.ceil(vs.length * 0.6));
  let i,
    g = 0;
  do {
    i = Math.floor(Math.random() * vs.length);
  } while (mem.includes(i) && ++g < 20);
  mem.push(i);
  while (mem.length > jan) mem.shift();
  return vs[i];
}
function caosOS() {
  return CURRENT_MODE === "oldschool";
}
function rollCaosFatiguePlan() {
  if (Math.random() >= CAOS_FATIGUE_CHANCE) return null;
  const tiredAt = 60 + Math.floor(Math.random() * 11);
  const exhaustedAt = 90 + Math.floor(Math.random() * 16);
  return { tiredAt, exhaustedAt, u: "min" };
}
function caosEmoClamp(v) {
  return Math.max(0, Math.min(10, Math.round(v * 100) / 100));
}
function caosEmoNudge(dTensao, dCalor) {
  if (caosVetorTravado) return;
  if (dTensao) caosEmo.tensao = caosEmoClamp(caosEmo.tensao + dTensao);
  if (dCalor) caosEmo.calor = caosEmoClamp(caosEmo.calor + dCalor);
}
function caosPacienciaNudge(delta) {
  if (caosVetorTravado) return;
  if (delta < 0) delta *= caosTemper.pac || 1;
  const atual = caosEmo.paciencia ?? 7;
  caosEmo.paciencia = caosEmoClamp(Math.max(delta < 0 ? Math.min(1, atual) : 0, atual + delta));
}
function caosTemperSortear() {
  const r = Math.random(),
    k =
      r < 0.4 ? "normal" : ["sensivel", "generoso", "rabugento", "eletrico"][Math.floor((r - 0.4) / 0.15)] || "normal";
  caosTemper = CAOS_TEMPERAMENTOS[k];
  caosEmo.tensao = caosEmoClamp(5 + caosTemper.t);
  caosEmo.calor = caosEmoClamp(5 + caosTemper.c);
  try {
    caosLog("temperamento", "🎲 hoje ele está: " + caosTemper.nome);
  } catch (e) {}
}
function caosEmoAmbientPull() {
  const alvo = CAOS_MOOD_ALVO[caosMood()] || CAOS_MOOD_ALVO.normal;
  const T = caosTemper || {},
    rz = (T.ruido || 1) * 0.5;
  caosEmo.tensao = caosEmoClamp(
    caosEmo.tensao + (alvo.tensao + (T.t || 0) - caosEmo.tensao) * 0.08 + (Math.random() - 0.5) * rz,
  );
  caosEmo.calor = caosEmoClamp(
    caosEmo.calor + (alvo.calor + (T.c || 0) - caosEmo.calor) * 0.08 + (Math.random() - 0.5) * rz,
  );
}
function caosPacienciaTick() {
  const mood = caosMood();
  if (mood === "impaciente") caosPacienciaNudge(-0.2);
  else if (mood === "cansado") caosPacienciaNudge(-0.1);
  else if (mood === "animado") caosPacienciaNudge(0.3);
  if (caosFamilyRecent.length >= 2 && caosFamilyRecent[0] === caosFamilyRecent[1]) caosPacienciaNudge(-0.5);
  caosEmo.paciencia = caosEmoClamp((caosEmo.paciencia ?? 7) + (7 - (caosEmo.paciencia ?? 7)) * 0.12);
}
function caosEmoMaybeDecay() {
  if (caosVetorTravado) {
    caosEmoHistSample("travado");
    return;
  }
  caosEmoAmbientPull();
  caosPacienciaTick();
  caosMaybeCheckOutFromTension();
  caosEmoEventsSinceDecay++;
  if (caosEmoEventsSinceDecay >= 4) {
    caosEmoEventsSinceDecay = 0;
    caosEmo.tensao = caosEmoClamp(caosEmo.tensao + (5 + (caosTemper.t || 0) - caosEmo.tensao) * 0.18);
    caosEmo.calor = caosEmoClamp(caosEmo.calor + (5 + (caosTemper.c || 0) - caosEmo.calor) * 0.18);
  }
  caosEmoHistSample();
}
function caosEstadoComposto() {
  const { tensao: t, calor: c, paciencia: p } = caosEmo;
  if (p <= 2.5) return t >= 6 ? "no_limite" : "exausto_de_paciencia";
  if (t <= 3 && c >= 7 && p >= 6) return "flow";
  if (t >= 7 && c >= 7) return "showman_nervoso";
  if (t >= 7 && c <= 3) return "irritado_seco";
  if (t <= 3 && c <= 3) return "apatico";
  if (t >= 5 && p <= 4) return "no_talo";
  return "normal";
}
function caosHumorMatriz() {
  if (caosHumorOverride) return caosHumorOverride;
  if (typeof caosFatigueLevel !== "undefined" && caosFatigueLevel === "exausto") return null;
  const h = caosHumorContinuo();
  const v = { raiva: "frustrado", orgulho: "orgulhoso", tedio: "entediado", desafio: "desafiante" }[h.emo] || null;
  if (v && h.k >= 0.38) return v;
  try {
    const C = caosConsole;
    if (C && C.on) {
      let best = null,
        bv = CAOS_CONSOLE_CFG.limiar;
      ["raiva", "alegria", "tedio"].forEach((k) => {
        if (C.g[k] >= bv) {
          bv = C.g[k];
          best = k;
        }
      });
      const m = { raiva: "frustrado", alegria: "orgulhoso", tedio: "entediado" }[best];
      if (m) return m;
    }
  } catch (e) {}
  return null;
}
function caosMatrizTransitionLine() {
  const atual = caosHumorMatriz(),
    antes = caosLastMatrizSeen;
  caosLastMatrizSeen = atual;
  if (atual === antes) return null;
  caosLog("humor", `${antes || "neutro"} → ${atual || "neutro"}`);
  if (!atual || !REACTIVE_VOICE.matrizHumor || Math.random() > 0.5) return null;
  if (atual === "frustrado" && CURRENT_MODE === "junior") return null;
  const ator =
    caosUltimoAtorIdx !== null && players[caosUltimoAtorIdx] && Math.random() < 0.6
      ? players[caosUltimoAtorIdx].name
      : void 0;
  return getRandomReaction(REACTIVE_VOICE.matrizHumor[atual], ator);
}
function caosVirtualLimiar(dif) {
  const R = Math.random();
  return dif === "facil" ? 2 + Math.floor(R * 2) : dif === "dificil" ? 7 + Math.floor(R * 4) : 4 + Math.floor(R * 3);
}
function caosVirtualPodeFalar() {
  return (
    CURRENT_MODE !== "express" &&
    !caosSilenced &&
    currentCard &&
    caosVirtualCardSeen !== currentCard &&
    stats.totalDrawn - caosVirtualLastDrawn >= 3 &&
    REACTIVE_VOICE.jogadorArtificial
  );
}
function caosVirtualMarcou(detalhe) {
  caosVirtualCardSeen = currentCard;
  caosVirtualLastDrawn = stats.totalDrawn;
  caosLog("jogadorArtificial", detalhe);
}
function maybeVirtualPlayerLine() {
  if (activeToastState || !caosVirtualPodeFalar()) return false;
  const n = revealedOrder.filter((r) => r.item.type === "clue").length;
  const lim = currentCard._caosLimiar || 5,
    V = REACTIVE_VOICE.jogadorArtificial;
  let msg = null;
  if (n >= 9 && n > lim + 2 && Math.random() < 0.3) msg = getRandomReaction(V.ironiaTardia, n);
  else if (n === lim && Math.random() < 0.3) msg = getRandomReaction(V.jaSei, lim);
  if (!msg) return false;
  caosVirtualMarcou(`limiar ${lim}, dica ${n}`);
  showToastMessage(msg, null, false, false, true);
  return true;
}
function caosVirtualAcertoLine(realClues) {
  if (!caosVirtualPodeFalar()) return null;
  const lim = currentCard._caosLimiar || 5;
  if (realClues < lim + 2 || Math.random() >= 0.2) return null;
  const msg = getRandomReaction(REACTIVE_VOICE.jogadorArtificial.palpiteAntecipado, lim);
  if (msg) caosVirtualMarcou(`acerto na dica ${realClues}, ele "sabia" na ${lim}`);
  return msg;
}
function caosArquetipo(idx) {
  const p = caosMemPl(idx),
    n = p.res.length;
  if (n < 3) return "padrao";
  const hits = p.res.filter((r) => r === "H").length,
    misses = n - hits;
  if (p.msN >= 2 && p.msMedio > 0 && p.msMedio < 6e3) return "impulsivo";
  if (p.msN >= 2 && p.msMedio > 24e3) return "meticuloso";
  if (hits >= 2 && hits / n >= 0.7) return "sortudo";
  if (misses >= 4) return "resiliente";
  return "padrao";
}
function caosArquetipoLine(idx, ctx) {
  const A = REACTIVE_VOICE.jogadorArtificial,
    pl = players[idx];
  if (!A || !pl) return null;
  if (stats.totalDrawn - (caosArqUltima[idx] ?? -99) < 6) return null;
  caosArqUltima[idx] = stats.totalDrawn;
  const tipo = caosArquetipo(idx);
  if (ctx === "erro" && (tipo === "padrao" || tipo === "sortudo"))
    return Math.random() < 0.5 ? getRandomReaction(A.analiseTatica, pl.name) : null;
  if (tipo === "padrao" || !A.arquetipos[tipo]) return null;
  caosLog("arquetipo", `${pl.name}: ${tipo} (${ctx})`);
  return getRandomReaction(A.arquetipos[tipo], pl.name);
}
function caosFamilyWeight(key) {
  const alvo = CAOS_FAMILIA_ALVO[key];
  let peso = alvo
    ? 1 +
      Math.max(
        0,
        1 - Math.sqrt(Math.pow(alvo.tensao - caosEmo.tensao, 2) + Math.pow(alvo.calor - caosEmo.calor, 2)) / 12,
      ) *
        5
    : 3;
  if (caosOS() && CAOS_OS_FAMILIAS_BOBAS.includes(key)) peso *= 0.15;
  const posicaoRecente = caosFamilyRecent.indexOf(key);
  if (posicaoRecente !== -1) peso *= 0.15 + posicaoRecente * 0.25;
  return Math.max(0.3, peso);
}
function caosTemperaturaAtual() {
  const p = caosEmo.paciencia ?? 7;
  return 1 + (10 - p) / 4.5;
}
function caosWeightedKindComTemperatura(w) {
  const temp = caosTemperaturaAtual();
  if (temp <= 1.05) return caosWeightedKind(w);
  const flat = {};
  Object.keys(w).forEach((k) => {
    flat[k] = Math.pow(Math.max(0.001, w[k]), 1 / temp);
  });
  return caosWeightedKind(flat);
}
function caosMaybeRuidoPuro(nome) {
  const p = caosEmo.paciencia ?? 7;
  if (p > 3) return null;
  if (Math.random() >= (3 - p) * 0.05) return null;
  const temMestre = mestreIndex !== null && mestreIndex !== void 0 && !!players[mestreIndex];
  const todasFamilias = Object.keys(REACTIVE_VOICE.familias).filter(
    (k) => temMestre || !CAOS_FAMILIAS_MESTRE.includes(k),
  );
  const key = todasFamilias[Math.floor(Math.random() * todasFamilias.length)];
  return getRandomReaction(REACTIVE_VOICE.familias[key], nome);
}
function caosV2PickMarked() {
  if (!players || players.length < 2) return;
  const naoIni = players.map((p, i) => i).filter((i) => !players[i].iniciante);
  if (!naoIni.length) return;
  const elegiveis = naoIni.filter((i) => i !== caosPrevMarkedIdx);
  const pool = elegiveis.length ? elegiveis : naoIni;
  let melhorMotivo = -1,
    alvoIdx = null;
  pool.forEach((i) => {
    const mem = caosMemPl(i);
    let score = Math.random() * 3;
    const erros = mem.res.filter((r) => r === "M").length;
    const acertos = mem.res.filter((r) => r === "H").length;
    score += erros * 1.5 + acertos * 1.3;
    if (score > melhorMotivo) {
      melhorMotivo = score;
      alvoIdx = i;
    }
  });
  caosMarked.idx = alvoIdx !== null ? alvoIdx : pool[Math.floor(Math.random() * pool.length)];
  caosMarked.remaining = 5 + Math.floor(Math.random() * 4);
  const nomeMarcado = players[caosMarked.idx] ? players[caosMarked.idx].name : "?";
  caosLog("marcado", `${nomeMarcado} (motivo score ${melhorMotivo.toFixed(1)}, dura ${caosMarked.remaining} eventos)`);
}
function caosV2NoteMarkedEvent(idx) {
  if (caosMarked.idx === null) {
    if (players && players.length >= 2) caosV2PickMarked();
    return;
  }
  if (idx !== caosMarked.idx) return;
  caosMarked.remaining--;
  if (caosMarked.remaining <= 0) {
    caosPrevMarkedIdx = caosMarked.idx;
    caosMarked.idx = null;
  }
}
function caosMarcadoFlavor(idx, name) {
  if (caosMarked.idx === null || idx !== caosMarked.idx) return null;
  if (Math.random() >= CAOS_MARCADO_REVELA_CHANCE || !REACTIVE_VOICE.marcadoRevelacao) return null;
  return getRandomReaction(REACTIVE_VOICE.marcadoRevelacao, name);
}
function caosNoteSpeechTarget(idx) {
  if (idx === null || idx === void 0) return 0;
  const now = Date.now();
  const prev = caosLastSpeechByPlayer[idx];
  const seguido = prev && now - prev.at < 6e4;
  caosLastSpeechByPlayer[idx] = { at: now, count: seguido ? prev.count + 1 : 1 };
  return seguido ? caosLastSpeechByPlayer[idx].count : 0;
}
function caosContinuidadeLine(name, count) {
  if (count < 2 || !REACTIVE_VOICE.continuidadeMesmoJogador) return null;
  if (Math.random() >= (CAOS_CONTINUIDADE_CHANCE[count] ?? CAOS_CONTINUIDADE_CHANCE[3])) return null;
  return getRandomReaction(REACTIVE_VOICE.continuidadeMesmoJogador, name, count);
}
function caosSurpresaTipo(dificuldade, acertou, realCluesRevealed) {
  if (!dificuldade) return null;
  if (acertou && dificuldade === "dificil" && realCluesRevealed <= 5) return "acertoDificil";
  if (!acertou && dificuldade === "facil") return "erroFacil";
  return null;
}
function caosReactionWeight(msg) {
  if (!msg) return 0;
  let w = 0;
  if (msg.length > 90) w += 1;
  if (/!{1,}/.test(msg)) w += 1;
  if (/virou|ultrapassou|recupera|surpre/i.test(msg)) w += 1;
  return w;
}
function caosFalasUltimos(ms) {
  const lim = Date.now() - ms;
  caosFalasRecentes = caosFalasRecentes.filter((t) => t >= lim - 6e4);
  return caosFalasRecentes.filter((t) => t >= lim).length;
}
function caosReactionDelay(msg) {
  const w = caosReactionWeight(msg);
  if (w === 0) return 0;
  return 450 + w * 220 + Math.random() * 300;
}
function caosMoodTransitionLine() {
  const atual = caosMood(),
    anterior = caosLastMoodSeen;
  caosLastMoodSeen = atual;
  if (!anterior || anterior === atual) return null;
  const antes = CAOS_MOOD_PIORA.indexOf(anterior),
    agora = CAOS_MOOD_PIORA.indexOf(atual);
  if (antes === -1 || agora === -1 || Math.random() > 0.35) return null;
  if (agora > antes && REACTIVE_VOICE.transicaoPiorando) {
    caosLog("transicao", `${antes} -> ${agora} (piorou)`);
    return getRandomReaction(REACTIVE_VOICE.transicaoPiorando);
  }
  if (agora < antes && REACTIVE_VOICE.transicaoMelhorando) {
    caosLog("transicao", `${antes} -> ${agora} (melhorou)`);
    return getRandomReaction(REACTIVE_VOICE.transicaoMelhorando);
  }
  return null;
}
function caosV2Reset() {
  caosVetorTravado = false;
  caosEmo = { tensao: 5, calor: 5, paciencia: 7 };
  caosTemperSortear();
  caosEmoFalaAtual = null;
  caosEmoFalaN = 0;
  caosVinculoReset();
  caosEixosReset();
  caosConsoleReset();
  caosEmoEventsSinceDecay = 0;
  caosMarked = { idx: null, remaining: 0 };
  caosPrevMarkedIdx = null;
  caosFamilyRecent = [];
  caosLastSpeechByPlayer = {};
  caosLastMoodSeen = null;
  caosLastTorcidaCard = -99;
  caosMoodOverride = null;
  caosHumorOverride = null;
  caosLastMatrizSeen = null;
  caosUltimoAtorIdx = null;
  caosVirtualCardSeen = null;
  caosVirtualLastDrawn = -99;
  caosDecisionLog = [];
  caosArqUltima = {};
  caosFalasRecentes = [];
  caosMesaReset();
  caosMemResetPartida();
  caosRitmoLog = [];
  caosEmoHist = [];
  caosEmoHistSample("início");
}
function caosNoteCardDrawn() {
  caosCardTimes.push(Date.now());
  if (caosCardTimes.length > 12) caosCardTimes.shift();
}
function caosMood() {
  if (caosMoodOverride) return caosMoodOverride;
  if (typeof caosFatigueLevel !== "undefined" && caosFatigueLevel !== "normal") return "cansado";
  const k = typeof CURRENT_MODE !== "undefined" && CURRENT_MODE === "express" ? 0.5 : 1;
  const gaps = [];
  for (let i = 1; i < caosCardTimes.length; i++) {
    const g = caosCardTimes[i] - caosCardTimes[i - 1];
    if (g > 0 && g < 3e5) gaps.push(g / 1e3);
  }
  if (gaps.length < 3) return "normal";
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const rec = avg(gaps.slice(-3));
  const ini = gaps.length > 3 ? avg(gaps.slice(0, gaps.length - 3)) : rec;
  if (gaps.length >= 5 && ini > 130 * k && rec < 80 * k) return "esquentou";
  if (rec < 50 * k) return "animado";
  if (rec > 200 * k) return "cansado";
  if (rec > 130 * k) return "impaciente";
  return "normal";
}
function caosCountUnder(key, max) {
  for (let i = 1; i <= max; i++) {
    if (!caosEasterEggsUsed.has(key + i)) {
      caosEasterEggsUsed.add(key + i);
      return true;
    }
  }
  return false;
}
function maybeShowTimeWarning() {
  if (caosSilenced || gameEnded || activeToastState || cardState !== "revealed") return;
  if (timerKind === "pick" && CURRENT_MODE !== "express") {
    const leftP = secondsLeft();
    if (leftP <= 15 && leftP >= 12 && timeWarnedSerial !== timerSerial) {
      timeWarnedSerial = timerSerial;
      const pp = players[responderIndex];
      if (pp && Math.random() < (caosOS() ? 0.12 : 0.4) && caosCountUnder("avisoescolha", caosOS() ? 2 : 4))
        showToastMessage(getRandomReaction(REACTIVE_VOICE.avisoEscolha, pp.name), null, false, false, true);
    }
  } else if (timerKind === "response" && CURRENT_MODE !== "express") {
    const left = secondsLeft();
    if (left <= 20 && left >= 17 && timeWarnedSerial !== timerSerial) {
      timeWarnedSerial = timerSerial;
      const p = players[responderIndex];
      if (p && Math.random() < (caosOS() ? 0.15 : 0.45) && caosCountUnder("avisotempo", caosOS() ? 2 : 5))
        showToastMessage(
          getRandomReaction(
            playerHumor(p) === "zero" && REACTIVE_VOICE.nivelZero && Math.random() < 0.85
              ? REACTIVE_VOICE.nivelZero.demora
              : REACTIVE_VOICE.avisoTempo,
            p.name,
            left,
          ),
          null,
          false,
          false,
          true,
        );
    }
  } else if (CURRENT_MODE === "express" && cardEndAt) {
    const c = cardSecondsLeft();
    if (c <= 20 && c >= 17 && cardWarnedSerial !== cardSerial) {
      cardWarnedSerial = cardSerial;
      if (Math.random() < 0.45 && caosCountUnder("avisotempo", 5))
        showToastMessage(getRandomReaction(REACTIVE_VOICE.avisoCarta, c), null, false, false, true);
    }
  }
}
// Converte as falas em texto de REACTIVE_VOICE para funções, exatamente como o
// jogo sempre as usou: "texto" -> () => "[C.A.O.S.] texto"; "{nome}" -> (name) => ...
// Altera as listas no lugar (mesmos objetos), então quem guarda referência continua valendo.
function caosFalasMontar(raiz) {
  const literais = new Set(CAOS_FALAS_LITERAIS);
  const fala = (t) =>
    t.includes("{nome}") ? (name) => CAOS_PREFIXO + t.split("{nome}").join(String(name)) : () => CAOS_PREFIXO + t;
  (function walk(o, path) {
    if (Array.isArray(o)) {
      if (literais.has(path)) return;
      for (let i = 0; i < o.length; i++) if (typeof o[i] === "string") o[i] = fala(o[i]);
      return;
    }
    if (o && typeof o === "object") Object.keys(o).forEach((k) => walk(o[k], path ? path + "." + k : k));
  })(raiz, "");
}
function caosBuildPoolIds() {
  const m = new Map();
  (function walk(o, path) {
    if (Array.isArray(o)) {
      m.set(o, path);
      return;
    }
    if (o && typeof o === "object") Object.keys(o).forEach((k) => walk(o[k], path ? path + "." + k : k));
  })(REACTIVE_VOICE, "");
  return m;
}
function getRandomReaction(list, ...args) {
  if (!list || list.length === 0) return "";
  for (let tries = 0; tries < 8; tries++) {
    const idx = pickReactionIndex(list);
    if (idx < 0) return "";
    const item = list[idx];
    const text = typeof item === "function" ? item(...args) : item;
    if (CURRENT_MODE === "junior" && CAOS_JUNIOR_BLOCK_RE.test(text)) continue;
    {
      const fam = caosFamiliaTroca(list, text, args);
      if (fam !== null) return fam;
    }
    if (caosIsDisliked(list, text, args)) continue;
    if (typeof text === "string" && text.length > 170 && tries < 4 && list.length > 1) continue;
    if (!caosHasProfanity(text, args)) {
      const out = caosRisada(caosSelfRoastIfSlang(caosDecorate(text, list), args, list), list, args);
      if (out) {
        caosDiagLog(list);
        caosLastPick = { bank: caosBankId(list), key: caosLineKey(list, text, args), text: out };
      }
      return out;
    }
    if (!caosBadIdx.has(list)) caosBadIdx.set(list, new Set());
    caosBadIdx.get(list).add(idx);
  }
  return "";
}
// Risadinha do C.A.O.S. nas falas de zoeira (ideia do Pedro, 11 anos): às vezes ele ri
// antes ou depois de zoar. Nunca com iniciante nem Family friendly; no Suave, só de vez em quando
// (metade da chance); no Júnior, risada leve.
function caosRisada(text, list, args) {
  if (typeof text !== "string" || text.indexOf(CAOS_PREFIXO) !== 0) return text;
  if (Math.random() >= CAOS_RISADA_CHANCE) return text;
  if (!CAOS_RISADA_BANCOS.test(caosBankId(list))) return text;
  const alvo = typeof args[0] === "string" ? players.find((p) => p.name === args[0]) : null;
  if (alvo && (alvo.iniciante || humorFamilia(alvo) || (playerHumor(alvo) === "suave" && Math.random() < 0.5))) return text;
  const r = CURRENT_MODE === "junior" ? CAOS_RISADAS_JUNIOR : CAOS_RISADAS;
  const ri = r[Math.floor(Math.random() * r.length)];
  const corpo = text.slice(CAOS_PREFIXO.length);
  return Math.random() < 0.6 ? CAOS_PREFIXO + ri + " " + corpo : text.replace(/\s*$/, "") + " " + ri;
}
// Family friendly (Júnior): fala de zoeira ou pesada pra esse jogador vira incentivo
// (ou, de 1 a 5 vezes por partida, uma zoeirinha bem leve).
function caosFamiliaTroca(list, text, args) {
  if (CURRENT_MODE !== "junior" || typeof args[0] !== "string" || !REACTIVE_VOICE.familia) return null;
  const alvo = players.find((p) => p.name === args[0]);
  if (!humorFamilia(alvo)) return null;
  const id = caosBankId(list);
  if (id.indexOf("familia") === 0) return null;
  if (!CAOS_RISADA_BANCOS.test(id) && !CAOS_FALA_PESADA_RE.test(String(text || ""))) return null;
  // ele ainda é zoeiro: de 1 a 5 zoeirinhas bem leves por partida, o resto vira incentivo
  if (!(alvo.famLim >= 1)) alvo.famLim = 1 + Math.floor(Math.random() * 5);
  if ((alvo.famZ || 0) < alvo.famLim && Math.random() < 0.3) {
    alvo.famZ = (alvo.famZ || 0) + 1;
    caosLog("familia", `${alvo.name}: zoeirinha ${alvo.famZ}/${alvo.famLim}`);
    return getRandomReaction(REACTIVE_VOICE.familia.zoeiraLeve, alvo.name);
  }
  return getRandomReaction(REACTIVE_VOICE.familia.apoio, alvo.name);
}
function caosBankId(list) {
  if (!caosPoolIds) caosPoolIds = caosBuildPoolIds();
  return caosPoolIds.get(list) || "?";
}
function caosLineKey(list, text, args) {
  let t = String(text || "");
  (args || []).forEach((a) => {
    if (!((typeof a === "string" && a.length) || typeof a === "number")) return;
    const esc = String(a).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    t = t.replace(new RegExp("(^|[^\\p{L}\\p{N}])" + esc + "(?![\\p{L}\\p{N}])", "gu"), "$1#");
  });
  return caosBankId(list) + "|" + t.replace(/\d+/g, "#").replace(/\s+/g, " ").trim().slice(0, 160);
}
function caosLogMatchLine(msg) {
  if (typeof msg !== "string" || msg.indexOf("[C.A.O.S.]") === -1) {
    caosLastPick = null;
    return;
  }
  caosLastSpokeAt = Date.now();
  const semSelo = (s) => String(s).replace(/\[C\.A\.O\.S\.\]\s*/g, "");
  const pick = caosLastPick && semSelo(msg).indexOf(semSelo(caosLastPick.text)) !== -1 ? caosLastPick : null;
  caosMatchLog.push({
    n: stats.totalDrawn,
    bank: pick ? pick.bank : "fala direta",
    key: pick ? pick.key : "direta|" + msg.slice(0, 120),
    text: msg
      .replace(/\[C\.A\.O\.S\.\]\s*/g, "")
      .replace(/[⟦⟧]/g, "")
      .trim()
      .slice(0, 400),
    r: 0,
    rated: false,
  });
  if (caosMatchLog.length > CAOS_MATCHLOG_MAX) caosMatchLog.shift();
  caosLog("fala", (pick ? pick.bank : "fala direta") + " · " + semSelo(msg).slice(0, 110));
  {
    const ult = caosEmoHist[caosEmoHist.length - 1];
    if (ult && !ult.fala && ult.motivo && ult.carta === stats.totalDrawn) ult.fala = semSelo(msg).trim().slice(0, 160);
  }
  caosLastPick = null;
}
// Tamanho máximo (em letras) de uma fala montada juntando duas frases.
const CAOS_FALA_JUNTA_MAX = 140;
// Junta uma frase curta ("De novo você, Ana?", "Continuo de olho...") com a fala principal.
// Não junta quando o resultado ficaria longo, quando a fala principal já é montada
// (gerador, avião) ou quando as duas citam o mesmo jogador (evita "Ana. Ana, ...").
function caosJoinExtra(extra, main, mainPick) {
  const pick = main ? mainPick : caosLastPick;
  const corpo = (main || "").replace(/^\[C\.A\.O\.S\.\]\s*/, "");
  caosLastPick = pick;
  if (!corpo) return "[C.A.O.S.] " + extra;
  const banco = (pick && pick.bank) || "";
  const montada = /^(gerador|aviao)/.test(banco) || /✈️|🎵/.test(corpo);
  const longa = extra.length + 1 + corpo.length > CAOS_FALA_JUNTA_MAX;
  const mesmoNome = players.some((p) => p && p.name && extra.includes(p.name) && corpo.includes(p.name));
  if (montada || longa || mesmoNome) return main;
  return "[C.A.O.S.] " + extra + " " + corpo;
}
function caosIsDisliked(list, text, args) {
  const r = caosRatingsLoad()[caosLineKey(list, text, args)];
  return !!r && (r.down || 0) >= 2 && (r.down || 0) > (r.up || 0);
}
function caosEmojiSetFor(id) {
  const p = id.split(".");
  if (p[0] === "familias") return CAOS_EMOJI_FAMILIA[p[1]] || CAOS_EMOJIS.geral;
  if (p[0] === "acertoPorDicas") return p[1] === "2" ? ["🥈", "🎯"] : p[1] === "3" ? ["🥉", "🎯"] : CAOS_EMOJIS.acerto;
  if (/^(erro|acido)/.test(p[0])) return CAOS_EMOJIS.erro;
  if (/^(acerto|sequencia|marco)/.test(p[0])) return CAOS_EMOJIS.acerto;
  if (
    /^(nickDemora|jogadorLento|avisoTempo|avisoEscolha|dicasProgresso|agonia|mesaDormindo|metadeDaCarta|partidaLonga|caosCansado|caosExausto)/.test(
      p[0],
    )
  )
    return CAOS_EMOJIS.tempo;
  if (/^(apresentacao|lembrete)/.test(p[0])) return CAOS_EMOJIS.apresentacao;
  if (p[0] === "especialAvancou") return ["🚀", "⚡", "🏃"];
  if (p[0] === "especialVoltou") return ["🐢", "⏪", "😅"];
  if (p[0] === "especialPercaVez") return ["🚫", "🙈", "⏸️"];
  if (/^especial/.test(p[0])) return ["🎲", "✨", "🃏"];
  if (/^(carinho|cantada)/.test(p[0])) return CAOS_EMOJIS.carinho;
  if (/^(jf)/.test(p[0])) return ["👨‍💻", "🫡", "😏"];
  if (/^(espontaneo|meta$)/.test(p[0])) return CAOS_EMOJIS.espontaneo;
  if (/^(bolaCristal|previsao)/.test(p[0])) return ["🔮", "✨"];
  if (p[0] === "cartaIA") return ["🤖", "👀"];
  if (p[0] === "reacaoCurta") return ["👀", "🤔", "😐", "🫡"];
  if (p[0] === "escolhaNumero") return ["🔢", "🤔", "👀", "😬"];
  if (p[0] === "microAmbiente") return ["👀", "🫥", "🤨"];
  if (/^(nickReacao|nickContagem)/.test(p[0])) return ["👋", "🤨", "🧐", "😏"];
  if (/^inicio/.test(p[0])) return CAOS_EMOJIS.apresentacao;
  if (p[0] === "nickNumerado") return ["🤨", "😏", "🧐"];
  if (/^cor/.test(p[0])) return ["🎨", "🌈"];
  if (p[0] === "bonusCancelado") return ["💥", "😈"];
  if (/^mercy/.test(p[0])) return ["🍀", "🎁"];
  if (p[0] === "estadoDoJogo") return ["🏁", "🍿", "👀"];
  return CAOS_EMOJIS.geral;
}
function caosDecorate(text, list) {
  if (typeof text !== "string" || !text || CAOS_EMOJI_CHANCE <= 0) return text;
  if (/\p{Extended_Pictographic}/u.test(text)) return text;
  if (!caosPoolIds) caosPoolIds = caosBuildPoolIds();
  const id = caosPoolIds.get(list);
  if (!id || id === "autoZoeiraGiria" || id === "familiasSorteio") return text;
  if (Math.random() >= CAOS_EMOJI_CHANCE) return text;
  const set = caosEmojiSetFor(id);
  let e = set[Math.floor(Math.random() * set.length)];
  if (set.length > 1 && e === caosLastEmoji) e = set[(set.indexOf(e) + 1) % set.length];
  caosLastEmoji = e;
  caosUltEmojiAdd = e;
  return text + " " + e;
}
function caosHasProfanity(text, args) {
  if (typeof text !== "string" || !text) return false;
  let probe = text;
  (args || []).forEach((a) => {
    if (typeof a === "string" && a.length) probe = probe.split(a).join(" ");
  });
  probe = probe
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return CAOS_PALAVROES_RE.test(probe);
}
function caosSelfRoastIfSlang(text, args, list) {
  if (typeof text !== "string" || !text) return text;
  if (list === REACTIVE_VOICE.autoZoeiraGiria) return text;
  const nFalas = typeof caosMatchLog !== "undefined" && caosMatchLog ? caosMatchLog.length : 0;
  if (text.length > 110 || nFalas - caosGiriaUlt < 8 || Math.random() > 0.2) return text;
  let probe = text;
  args.forEach((a) => {
    if (typeof a === "string" && a.length) probe = probe.split(a).join(" ");
  });
  const m = CAOS_GIRIAS_RE.exec(probe);
  if (!m) return text;
  const pool = REACTIVE_VOICE.autoZoeiraGiria;
  const it = pool[pickReactionIndex(pool)];
  caosGiriaUlt = nFalas;
  return text + " " + (typeof it === "function" ? it(m[2]) : it);
}
function caosFilaGuardar(msg, noFreeze) {
  if (caosFila.length >= 1) {
    caosLog(
      "fila",
      "fala extra descartada (fila cheia): " +
        String(msg)
          .replace(/\[C\.A\.O\.S\.\]\s*/, "")
          .slice(0, 60),
    );
    return;
  }
  caosFila.push({ msg, noFreeze, carta: stats.totalDrawn, at: Date.now() });
}
function caosFilaProxima() {
  if (!caosFila.length) return;
  setTimeout(function tentar() {
    if (!caosFila.length || gameEnded) {
      caosFila = [];
      return;
    }
    if (activeToastState) return;
    if (document.getElementById("pauseScreen").style.display === "block") {
      setTimeout(tentar, 1e3);
      return;
    }
    const f = caosFila.shift();
    const velha =
      Date.now() - f.at > 15e3 ||
      stats.totalDrawn - f.carta >= 2 ||
      (stats.totalDrawn !== f.carta && cardState === "revealed" && revealedOrder.length > 0);
    if (velha) {
      caosLog("fila", "fala extra descartada (fora de contexto)");
      return;
    }
    showToastMessage(f.msg, null, false, false, f.noFreeze);
  }, 700);
}
function caosLeituraMinMs(st) {
  const m = String((st && st.msg) || "");
  if (!CAOS_VOICE_OK || !caosVoiceOn || m.indexOf("[C.A.O.S.]") === -1) return CAOS_MIN_LEITURA_MS;
  const voz = (caosSpeechText(m).length / (13 * Math.max(0.7, caosVoiceSpeed))) * 1e3 + 400;
  return Math.min(5e3, Math.max(CAOS_MIN_LEITURA_MS, voz));
}
function caosToastTexto(toast, texto) {
  const limpo = String(texto).replace(/[⟦⟧]/g, "");
  const ehCaos = limpo.indexOf("[C.A.O.S.]") !== -1;
  toast.textContent = "";
  if (ehCaos) {
    const tx = document.createElement("span");
    tx.className = "toast-txt";
    tx.textContent = limpo;
    toast.appendChild(tx);
  } else toast.textContent = limpo;
  if (ehCaos && toast.dataset.emo && CAOS_EMOS[toast.dataset.emo]) {
    const rt = document.createElement("span");
    rt.className = "toast-rotulo";
    rt.setAttribute("aria-hidden", "true");
    rt.textContent = CAOS_EMOS[toast.dataset.emo].nome;
    toast.insertBefore(rt, toast.firstChild);
  }
  const ac = document.createElement("span");
  ac.className = "toast-acoes";
  const sk = document.createElement("span");
  sk.className = "toast-skip";
  sk.textContent = "⏭️";
  sk.setAttribute("aria-label", "Pular a fala");
  ac.appendChild(sk);
  if (ehCaos && !gameEnded && starterChosen) {
    const mu = document.createElement("span");
    mu.className = "toast-mute";
    mu.textContent = "🔇";
    mu.setAttribute("role", "button");
    mu.setAttribute("aria-label", "Silenciar o C.A.O.S. nesta carta");
    mu.addEventListener("click", (ev) => {
      ev.stopPropagation();
      caosSilenciarCarta();
    });
    ac.appendChild(mu);
  }
  toast.appendChild(ac);
}
function caosTetoVozMs(msg) {
  const n = caosSpeechText(msg).length;
  return Math.min(22e3, Math.max(CAOS_BALAO_MIN_MS, (n / (13 * Math.max(0.7, caosVoiceSpeed))) * 1e3 + 2500));
}
function caosFalarComBalao(msg, serial, virada) {
  const falou = caosSpeak(
    msg,
    void 0,
    () => {
      if (!activeToastState || activeToastState.serial !== serial) return;
      const falta = Math.max(
        CAOS_BALAO_POS_VOZ_MS,
        CAOS_BALAO_MIN_MS - (Date.now() - (activeToastState.shownAt || activeToastState.frozenAt)),
      );
      clearTimeout(toastTimeoutRef);
      toastTimeoutRef = setTimeout(() => {
        if (activeToastState && activeToastState.serial === serial) closeActiveToast();
      }, falta);
    },
    virada
      ? (pi, corte) => {
          if (pi === corte) caosViradaTrocar(serial, virada, "voz");
        }
      : void 0,
    virada,
  );
  if (virada) {
    if (!falou) caosViradaTempo(serial, virada);
    else
      caosViradaTempo(
        serial,
        virada,
        (virada.frac || 0.5) * ((caosSpeechText(msg).length / (13 * Math.max(0.7, caosVoiceSpeed))) * 1e3) * 1.6 + 1500,
      );
  }
  if (falou) {
    clearTimeout(toastTimeoutRef);
    toastTimeoutRef = setTimeout(() => {
      if (activeToastState && activeToastState.serial === serial) closeActiveToast();
    }, caosTetoVozMs(msg));
  }
  return falou;
}
function caosPularFala(ev) {
  if (ev) ev.stopPropagation();
  if (caosSegurou) {
    caosSegurou = false;
    return;
  }
  if (!activeToastState) return;
  const eraCaos = String(activeToastState.msg || "").includes("[C.A.O.S.]") && !activeToastState.priority;
  caosVoiceCancel();
  closeActiveToast();
  if (eraCaos) {
    caosRegistrarCorte();
    caosVinculoCorte();
  }
}
function caosRegistrarCorte() {
  caosCortes.total++;
  const agora = Date.now();
  caosFalasRecentes.push(agora, agora);
  caosEmoNudge(0.6, -0.3);
  const quem =
    mestreIndex !== null && mestreIndex !== void 0 && players[mestreIndex] && starterChosen && !gameEnded
      ? players[mestreIndex]
      : null;
  const C = REACTIVE_VOICE.caosCortado;
  let fala = null;
  if (quem && quem.iniciante) {
    if (Math.random() < 0.3)
      caosToastAtrasado(
        () =>
          showToastMessage(getRandomReaction(REACTIVE_VOICE.iniciante.cortado, quem.name), null, false, false, true),
        250,
      );
    return;
  }
  if (quem) {
    const n = (caosCortes.por[quem.name] = (caosCortes.por[quem.name] || 0) + 1);
    caosCortes.rancor[quem.name] = true;
    caosMarked = {
      idx: mestreIndex,
      remaining: Math.max(caosMarked.idx === mestreIndex ? caosMarked.remaining : 0, 5),
    };
    caosLog("cortado", `${quem.name} pulou a fala (${n}ª vez) → marcado + rancor`);
    if (n === 3) fala = getRandomReaction(C.terceira, quem.name);
    else if (n >= 6 && n % 3 === 0) fala = getRandomReaction(C.muitas, quem.name, n);
    else if (n === 1 && Math.random() < 0.35) fala = getRandomReaction(C.primeira, quem.name);
  } else if (caosCortes.total % 3 === 0) fala = getRandomReaction(C.semNome);
  if (fala && playerHumor(quem) !== "suave")
    caosToastAtrasado(() => showToastMessage(fala, null, false, false, true), 250);
}
function caosVingancaLine(p) {
  const h = playerHumor(p);
  if (!p || !caosCortes.rancor[p.name] || h === "suave") return null;
  if (Math.random() >= (h === "acido" ? 0.75 : h === "normal" ? 0.3 : 0.5)) return null;
  delete caosCortes.rancor[p.name];
  caosLog("vinganca", `${p.name} (cortou ${caosCortes.por[p.name] || 1}x)`);
  return getRandomReaction(REACTIVE_VOICE.caosCortado.vinganca, p.name, caosCortes.por[p.name] || 1);
}
function caosToastBloquear() {
  try {
    if (document.getElementById("pauseScreen").style.display === "block") return true;
    if (!stats || stats.totalDrawn < 1 || gameEnded) return false;
    if (caosFalaCartaRef !== stats.totalDrawn) {
      caosFalaCartaRef = stats.totalDrawn;
      caosFalaCartaN = 0;
    }
    if (caosFalaCartaN >= CAOS_FALAS_POR_CARTA) {
      caosLog("orcamento", "fala cortada (limite por carta)");
      return true;
    }
    caosFalaCartaN++;
    return false;
  } catch (e) {
    return false;
  }
}
function caosEscalaMeta(v) {
  return Math.round(v * ((WINNING_SCORE > 0 ? WINNING_SCORE : 200) / 200));
}
function analyzeMatchStateReaction(scorerIdx) {
  if (CURRENT_MODE === "express") return null;
  if (Math.random() > 0.25) return null;
  if (!players || players.length < 2) return null;
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const leader = sorted[0],
    second = sorted[1],
    last = sorted[sorted.length - 1];
  const scorer = players[scorerIdx];
  if (!leader || !second || !last || !scorer) return null;
  const diffLider = leader.score - second.score;
  const diffLanterna = leader.score - last.score;
  if (history.length > 10 && leader.score < caosEscalaMeta(30))
    return getRandomReaction(REACTIVE_VOICE.estadoDoJogo.jogoArrastado);
  if (scorer === leader && diffLider > caosEscalaMeta(30))
    return getRandomReaction(REACTIVE_VOICE.estadoDoJogo.liderIsolado, leader.name);
  if (scorer === last && last.score > 0 && diffLanterna > caosEscalaMeta(40))
    return getRandomReaction(REACTIVE_VOICE.estadoDoJogo.lanternaReagindo, scorer.name);
  if (
    scorer !== last &&
    diffLanterna > caosEscalaMeta(35) &&
    (typeof caosLastTorcidaCard === "undefined" || stats.totalDrawn - caosLastTorcidaCard >= 6) &&
    REACTIVE_VOICE.estadoDoJogo.torcidaLanterna
  ) {
    caosLastTorcidaCard = stats.totalDrawn;
    return getRandomReaction(REACTIVE_VOICE.estadoDoJogo.torcidaLanterna, last.name);
  }
  if (diffLider <= caosEscalaMeta(5) && leader.score > caosEscalaMeta(60))
    return getRandomReaction(REACTIVE_VOICE.estadoDoJogo.jogoAcirrado, leader.name);
  return null;
}
function get10thClueMockery() {
  if (!players || players.length < 2) return getRandomReaction(REACTIVE_VOICE.metadeDaCarta.geral);
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const leader = sorted[0],
    second = sorted[1],
    last = sorted[sorted.length - 1];
  if (leader.score >= caosEscalaMeta(40) && leader.score - second.score > caosEscalaMeta(15)) {
    return getRandomReaction(REACTIVE_VOICE.metadeDaCarta.ataqueLider, leader.name);
  }
  if (last.score < caosEscalaMeta(10) && leader.score > caosEscalaMeta(30)) {
    return getRandomReaction(REACTIVE_VOICE.metadeDaCarta.ataqueLanterna, last.name, last.score);
  }
  return getRandomReaction(REACTIVE_VOICE.metadeDaCarta.geral);
}
function maybeShowClueMilestoneFlavor() {
  try {
    if (CURRENT_MODE !== "express" && currentCard && revealedOrder.filter((r) => r.item.type === "clue").length === 10)
      caosSentir("tedio", 1.5, "10ª dica sem acerto");
  } catch (e) {}
  if (caosOS() && Math.random() < 0.5) return false;
  const realCluesCount = revealedOrder.filter((r) => r.item.type === "clue").length;
  const totalCardClues = currentCard.clues.filter((c) => c.type === "clue").length;
  if (caosClueCommentCard !== currentCard) {
    caosClueCommentCard = currentCard;
    caosClueCommentCount = 0;
    caosClueCommentLast = -99;
  }
  if (realCluesCount === 15 && totalCardClues > 15) {
    playSfx("agonia");
    showToastMessage(getRandomReaction(REACTIVE_VOICE.agonia15Dicas));
    caosClueCommentLast = realCluesCount;
    caosClueCommentCount++;
    return true;
  } else if (realCluesCount === 10 && totalCardClues > 10 && CURRENT_MODE !== "express") {
    playSfx("agonia");
    const m10 = get10thClueMockery();
    showToastMessage(m10 && m10.indexOf("[C.A.O.S.]") === -1 ? "[C.A.O.S.] " + m10 : m10);
    caosClueCommentLast = realCluesCount;
    caosClueCommentCount++;
    return true;
  }
  if (
    CURRENT_MODE !== "express" &&
    !caosSilenced &&
    caosClueCommentCount < 3 &&
    realCluesCount - caosClueCommentLast >= 3
  ) {
    const n = realCluesCount;
    const bucket = n >= 16 ? "desespero" : n >= 11 && n <= 14 ? "aflito" : n >= 6 && n <= 9 ? "meio" : null;
    if (bucket && Math.random() < 0.3) {
      const msg = getRandomReaction(
        REACTIVE_VOICE.dicasProgresso[bucket],
        n,
        String(gemCategoryFor(currentCard.category) || "").toLowerCase(),
      );
      if (msg) {
        playSfx("agonia");
        showToastMessage(msg);
        caosClueCommentLast = n;
        caosClueCommentCount++;
        return true;
      }
    }
  }
  return false;
}
function caosOncePerMatch(key) {
  if (caosEasterEggsUsed.has(key)) return false;
  caosEasterEggsUsed.add(key);
  return true;
}
function maybeUpdateCaosFatigue() {
  if (caosSilenced || !caosFatiguePlan || caosFatiguePlan.u !== "min" || !caosPartidaInicioAt) return;
  const minAtivos = caosMinutosAtivos();
  if (caosFatigueLevel === "normal" && minAtivos >= caosFatiguePlan.tiredAt) {
    caosFatigueLevel = "cansado";
    showToastMessage(getRandomReaction(REACTIVE_VOICE.caosCansado));
  } else if (caosFatigueLevel === "cansado" && minAtivos >= caosFatiguePlan.exhaustedAt) {
    caosFatigueLevel = "exausto";
    showToastMessage(getRandomReaction(REACTIVE_VOICE.caosExausto));
    caosCheckOut();
  }
}
function caosCheckOut() {
  if (caosSilenced) return;
  caosSilenced = true;
  caosLog("saiu", `tensao=${caosEmo.tensao} calor=${caosEmo.calor} fadiga=${caosFatigueLevel}`);
  showToastMessage(getRandomReaction(REACTIVE_VOICE.caosSaiuDaPartida), null, true);
}
function caosMaybeCheckOutFromTension() {
  if (caosSilenced) return;
  if (caosEmo.tensao >= 9.5 && caosEmo.calor <= 1) {
    caosSaidasTensao++;
    if (caosSaidasTensao >= 2 || caosFatigueLevel !== "normal") {
      caosFatigueLevel = "exausto";
      caosCheckOut();
      return;
    }
    caosSaidaTemp = { volta: stats.totalDrawn + 3 + Math.floor(Math.random() * 3) };
    caosSilenced = true;
    caosLog(
      "saiu",
      `temporário (volta na carta ${caosSaidaTemp.volta}) tensao=${caosEmo.tensao} calor=${caosEmo.calor}`,
    );
    showToastMessage(getRandomReaction(REACTIVE_VOICE.caosSaiuTemporario), null, true);
  }
}
function caosTalvezVoltar() {
  if (!caosSilenced || !caosSaidaTemp || stats.totalDrawn < caosSaidaTemp.volta) return;
  caosSaidaTemp = null;
  caosSilenced = false;
  caosEmo.tensao = 6;
  caosEmo.calor = 5;
  caosEmo.paciencia = Math.max(caosEmo.paciencia ?? 7, 6);
  caosLog("voltou", "saída temporária acabou");
  showToastMessage(getRandomReaction(REACTIVE_VOICE.caosVoltouTemporario));
}
function caosMemReset() {
  caosCardTimes = [];
  caosMem = { pl: {} };
  caosSpeechHist = [];
  caosSetupCount = 0;
  caosPrevLeaderIdx = -1;
  caosV2Reset();
}
function caosMemPl(idx) {
  return caosMem.pl[idx] || (caosMem.pl[idx] = { res: [], msN: 0, msMedio: 0, ultimoAnuncioSeguido: 0 });
}
function caosMemRecordTime(idx, ms) {
  if (!Number.isFinite(ms) || ms < 0) return;
  const p = caosMemPl(idx);
  p.msN = (p.msN || 0) + 1;
  p.msMedio = p.msMedio ? p.msMedio + (ms - p.msMedio) / p.msN : ms;
}
function caosPersonalTimeSignal(idx, ms) {
  const p = caosMemPl(idx);
  if (!Number.isFinite(ms) || p.msN < 3) return null;
  if (ms <= p.msMedio * 0.45) return "maisRapidoQueOnormal";
  if (ms >= p.msMedio * 2) return "maisLentoQueOnormal";
  return null;
}
function caosTrailing(idx, ch) {
  const r = caosMemPl(idx).res;
  let n = 0;
  for (let i = r.length - 1; i >= 0 && r[i] === ch; i--) n++;
  return n;
}
function caosMemRecord(idx, ok) {
  const p = caosMemPl(idx);
  p.res.push(ok ? "H" : "M");
  if (p.res.length > 12) p.res.shift();
  if (ok) p.ultimoAnuncioSeguido = 0;
}
function caosNoteSpeech(spoke) {
  caosSpeechHist.push(spoke ? 1 : 0);
  if (caosSpeechHist.length > 6) caosSpeechHist.shift();
}
function caosBudgetBlocks() {
  const recent = caosSpeechHist.slice(-3).reduce((a, b) => a + b, 0);
  return recent >= 2 && Math.random() < 0.45;
}
function caosWeightedKind(w) {
  const keys = Object.keys(w);
  let r = Math.random() * keys.reduce((s, k) => s + w[k], 0);
  for (const k of keys) {
    r -= w[k];
    if (r < 0) return k;
  }
  return keys[keys.length - 1];
}
function caosLeaderIdx() {
  if (CURRENT_FORMAT === "equipe" || players.length < 2) return -1;
  let best = -1,
    bestS = 0,
    tie = false;
  players.forEach((p, i) => {
    if (p.score > bestS) {
      bestS = p.score;
      best = i;
      tie = false;
    } else if (p.score === bestS && bestS > 0) tie = true;
  });
  return tie ? -1 : best;
}
function caosLastClueText() {
  const last = [...revealedOrder].reverse().find((r) => r.item && r.item.type === "clue");
  const t = last && last.item.text ? String(last.item.text).replace(/\s+/g, " ").trim() : "";
  return t.length >= 8 && t.length <= 70 ? t : null;
}
function caosLineFitsContext(text, ctx) {
  if (!text || !ctx || ctx === "qualquer") return true;
  const erro = CAOS_CTX_ERRO_RE.test(text),
    acerto = CAOS_CTX_ACERTO_RE.test(text);
  if (ctx === "erro") return !acerto;
  if (ctx === "acerto") return !erro;
  return !erro && !acerto;
}
function caosFamilyLine(nome, ctx) {
  const ruido = caosMaybeRuidoPuro(nome);
  if (ruido && caosLineFitsContext(ruido, ctx)) return ruido;
  const temMestre = mestreIndex !== null && mestreIndex !== void 0 && !!players[mestreIndex];
  const candidatos = REACTIVE_VOICE.familiasSorteio.filter(
    (k) => REACTIVE_VOICE.familias[k] && (temMestre || !CAOS_FAMILIAS_MESTRE.includes(k)),
  );
  for (let fam = 0; fam < 3; fam++) {
    const pesos = {};
    candidatos.forEach((k) => {
      pesos[k] = caosFamilyWeight(k);
    });
    const key = caosWeightedKindComTemperatura(pesos) || "distraido";
    for (let t = 0; t < 6; t++) {
      const txt = getRandomReaction(REACTIVE_VOICE.familias[key], nome);
      if (txt && caosLineFitsContext(txt, ctx)) {
        caosFamilyRecent.unshift(key);
        if (caosFamilyRecent.length > 4) caosFamilyRecent.pop();
        return txt;
      }
    }
  }
  return "";
}
function caosErroCandidate(p, idx, info) {
  if (!p || idx < 0) return null;
  const n = p.name,
    R = Math.random,
    V = REACTIVE_VOICE;
  const suave = playerHumor(p) === "suave";
  const leve = CURRENT_MODE === "junior" ? 0.5 : 1;
  if (!suave && info.hsBefore >= 2 && R() < 0.9 * leve)
    return { text: () => getRandomReaction(V.erroQuebraSequencia, n, info.hsBefore) };
  if (!suave && info.misses >= 3 && idx >= 0) {
    const mem = caosMemPl(idx);
    if (info.misses >= mem.ultimoAnuncioSeguido + 2 && R() < 0.9 * leve) {
      mem.ultimoAnuncioSeguido = info.misses;
      return { text: () => getRandomReaction(V.erroSeguido, n, info.misses) };
    }
  }
  if (CURRENT_FORMAT !== "equipe" && players.length >= 3) {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    if (sorted[0] === p && sorted[0].score - sorted[1].score >= 10 && R() < 0.6)
      return { text: () => getRandomReaction(V.erroLider, n) };
    if (!suave && sorted[sorted.length - 1] === p && sorted[0].score - p.score >= 30 && R() < 0.6 * leve)
      return { text: () => getRandomReaction(V.erroUltimo, n) };
  }
  if (info.ms != null && info.ms < 4e3 && R() < 0.5) return { text: () => getRandomReaction(V.erroRapido, n) };
  if (info.ms != null && info.ms > 25e3 && R() < 0.5) return { text: () => getRandomReaction(V.erroDemorou, n) };
  if (info.personalTime === "maisRapidoQueOnormal" && R() < 0.5)
    return { text: () => getRandomReaction(R() < 0.5 ? V.erroRapido : V.tempoPessoalRapido, n) };
  if (info.personalTime === "maisLentoQueOnormal" && R() < 0.5)
    return { text: () => getRandomReaction(R() < 0.5 ? V.erroDemorou : V.tempoPessoalLento, n) };
  const dica = caosLastClueText();
  if (dica && R() < 0.55) {
    const sinais = caosClueSignals(dica);
    if (sinais.temNumero && V.erroComDicaNumero) return { text: () => getRandomReaction(V.erroComDicaNumero, n, dica) };
    if (sinais.curta && V.erroComDicaCurta) return { text: () => getRandomReaction(V.erroComDicaCurta, n, dica) };
    return { text: () => getRandomReaction(V.erroComDica, n, dica) };
  }
  return null;
}
function caosClueSignals(text) {
  if (!text || typeof text !== "string") return {};
  return {
    temNumero: /\b(1[4-9]\d{2}|20\d{2})\b/.test(text),
    curta: text.length <= 40,
    longa: text.length >= 140,
    exclamativa: /!/.test(text),
  };
}
function caosGenericErro(p) {
  const cat = currentCard && gemCategoryFor(currentCard.category);
  const categoriaLines = REACTIVE_VOICE.erroCategoria && REACTIVE_VOICE.erroCategoria[cat];
  if (cardWrongCount >= 2 && playerHumor(p) !== "suave" && Math.random() < (CURRENT_MODE === "junior" ? 0.25 : 0.5))
    return getRandomReaction(REACTIVE_VOICE.erroEscalada, p.name, cardWrongCount);
  if (categoriaLines && categoriaLines.length > 0 && Math.random() < 0.5)
    return getRandomReaction(categoriaLines, p.name);
  return getRandomReaction(REACTIVE_VOICE.erroSarcasmo, p.name);
}
function maybeReactToNick(name) {
  if (caosSilenced || caosSetupCount >= 3 || activeToastState) return false;
  const R = Math.random,
    nm = String(name),
    V = REACTIVE_VOICE;
  const letters = nm.replace(/[^A-Za-zÀ-ÿ]/g, "");
  let bank = null;
  if (isJfPlayer({ name: nm })) {
    if (R() < 0.9) bank = V.nickReacao.jf;
  } else if (/(c\.?a\.?o\.?s|caos)/i.test(nm) && R() < 0.8) bank = V.nickReacao.chamaCaos;
  else if (/^vit[oó]ria$/i.test(nm.trim()) && R() < 0.85) bank = V.nickReacao.vitoria;
  else if (/\p{Extended_Pictographic}/u.test(nm) && R() < 0.7) bank = V.nickReacao.emoji;
  else if (/\d{2,}/.test(nm) && R() < 0.5) bank = V.nickReacao.numero;
  else if (nm.length >= 12 && R() < 0.5) bank = V.nickReacao.longo;
  else if (nm.length <= 2 && R() < 0.45) bank = V.nickReacao.curto;
  else if (letters.length >= 3 && nm === nm.toUpperCase() && R() < 0.35) bank = V.nickReacao.maiusculo;
  else if (letters.length >= 3 && nm === nm.toLowerCase() && R() < 0.15) bank = V.nickReacao.minusculo;
  else if (players.length === 1 && R() < 0.25) bank = V.nickReacao.primeiro;
  else if (players.length >= 2 && R() < 0.22) bank = V.nickContagem[String(Math.min(players.length, 6))];
  if (!bank) return false;
  const msg = getRandomReaction(bank, nm);
  if (!msg) return false;
  caosSetupCount++;
  showToastMessage(msg);
  return true;
}
function caosDiagLog(list) {
  if (!caosPoolIds) caosPoolIds = caosBuildPoolIds();
  const id = caosPoolIds.get(list);
  if (!id || id === "autoZoeiraGiria" || id === "familiasSorteio") return;
  const d = caosDiagLoad();
  d.total++;
  d.by[id] = (d.by[id] || 0) + 1;
  if (++caosDiagUnsaved >= 6) caosDiagSave();
}
function caosDiagMatchStarted() {
  const d = caosDiagLoad();
  d.matches++;
  caosDiagSave();
}
function caosDiagText() {
  const d = caosDiagLoad(),
    m = Math.max(1, d.matches);
  if (!caosPoolIds) caosPoolIds = caosBuildPoolIds();
  const all = [...caosPoolIds.values()].filter((id) => id !== "autoZoeiraGiria" && id !== "familiasSorteio");
  const never = all.filter((id) => !d.by[id]);
  const rows = Object.entries(d.by)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([k, v]) => (v / m).toFixed(2).padStart(6) + "  " + k);
  return (
    "DIAGNÓSTICO DO C.A.O.S. (5.0.14)\nVoz: " +
    (CAOS_VOICE_OK ? (caosVoiceOn ? "ligada" : "desligada") : "indisponível neste aparelho") +
    " · faladas nesta sessão: " +
    caosVoiceSpoken +
    " · só escritas (pro Mestre): " +
    caosVoiceSilenced +
    " · humor agora: " +
    caosMood() +
    "\nVozes do aparelho: " +
    (CAOS_VOICE_OK
      ? (window.speechSynthesis.getVoices() || [])
          .map((v) => v.name + " (" + v.lang + (v.localService ? "" : ", online") + ")")
          .join("; ")
      : "-") +
    "\nPartidas: " +
    d.matches +
    " · falas: " +
    d.total +
    " · média por partida: " +
    (d.total / m).toFixed(1) +
    "\n\nMAIS USADOS (falas por partida):\n" +
    rows.join("\n") +
    "\n\nNUNCA OUVIDOS (" +
    never.length +
    " de " +
    all.length +
    "):\n" +
    never.join(", ")
  );
}
function caosRitmoRegistrar(idx, ms, ok) {
  if (CURRENT_MODE === "express" || !Number.isFinite(ms) || ms < 0 || !players[idx]) return;
  let humor = "neutro",
    estado = "";
  try {
    humor = caosHumorMatriz() || "neutro";
    estado = caosEstadoComposto();
  } catch (e) {}
  caosRitmoLog.push({
    carta: stats.totalDrawn,
    nome: String(players[idx].name).slice(0, 20),
    ms: Math.round(ms),
    ok: !!ok,
    humor,
    estado,
    t: caosEmo.tensao,
    c: caosEmo.calor,
    dif: (currentCard && currentCard._caosDificuldade) || "",
    resp: currentCard ? String(currentCard.answer).slice(0, 40) : "",
    dicas: revealedOrder.filter((r) => r.item.type === "clue").length,
  });
  if (caosRitmoLog.length > CAOS_RITMO_MAX) caosRitmoLog.shift();
}
function caosEmoHistSample(motivo) {
  let humor = "neutro",
    estado = "normal";
  try {
    humor = caosHumorMatriz() || "neutro";
    estado = caosEstadoComposto();
  } catch (e) {}
  caosEmoHist.push({
    carta: typeof stats !== "undefined" && stats ? stats.totalDrawn : 0,
    t: caosEmo.tensao,
    c: caosEmo.calor,
    p: caosEmo.paciencia ?? 7,
    humor,
    estado,
    motivo: motivo || caosEventoContexto || "",
  });
  caosEventoContexto = "";
  if (caosEmoHist.length > CAOS_EMOHIST_MAX) caosEmoHist.shift();
}
function caosLog(tipo, detalhe) {
  let estado = "",
    humor = "";
  try {
    estado = caosEstadoComposto();
    humor = caosHumorMatriz() || caosMood();
  } catch (e) {}
  caosDecisionLog.push({ t: Date.now(), tipo, detalhe, estado, humor });
  if (caosDecisionLog.length > 40) caosDecisionLog.shift();
}
function caosChaveHash(s) {
  let h = 2166136261;
  const t =
    "caos|" +
    String(s || "")
      .trim()
      .toUpperCase();
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
function caosChaveOk(k) {
  if (!String(k || "").trim()) return false;
  let propria = null;
  try {
    propria = JFStore.getItem(CAOS_CHAVE_KEY);
  } catch (e) {}
  const h = caosChaveHash(k);
  return propria ? h === propria : CAOS_CHAVES_PADRAO.includes(h);
}
function caosInspectorTrancar() {
  caosInspectorDestravado = false;
  try {
    sessionStorage.removeItem("perfil5_caos_auth");
  } catch (e) {}
}
function caosDiagShow() {
  let ov = document.getElementById("caosDiagOverlay");
  if (ov) ov.remove();
  ov = document.createElement("div");
  ov.id = "caosDiagOverlay";
  ov.className = "ci-overlay";
  document.body.appendChild(ov);
  if (caosInspectorDestravado) caosInspectorPainel(ov);
  else caosInspectorLockScreen(ov);
}
function caosIntrusoTravado() {
  return Date.now() < caosIntrusoTravaAte ? Math.ceil((caosIntrusoTravaAte - Date.now()) / 1e3) : 0;
}
function caosIntrusoFalar(msgEl, txt) {
  if (msgEl) msgEl.textContent = txt.replace(/^\[C\.A\.O\.S\.\]\s*/, "🤖 ");
  try {
    caosSpeak(txt);
  } catch (e) {}
}
function caosIntrusoTentativa(ok, msgEl, onde) {
  const I = REACTIVE_VOICE.intruso;
  if (ok) {
    caosIntrusoErros = 0;
    caosIntrusoTravas = 0;
    caosIntrusoFalar(null, getRandomReaction(I.entrou));
    return true;
  }
  caosIntrusoErros++;
  caosLog("intruso", `${onde}: senha errada (${caosIntrusoErros}ª)`);
  if (caosIntrusoErros >= 3) {
    caosIntrusoErros = 0;
    caosIntrusoTravas++;
    const sg = 30 * caosIntrusoTravas;
    caosIntrusoTravaAte = Date.now() + sg * 1e3;
    caosIntrusoFalar(msgEl, getRandomReaction(I.bloqueado, sg));
  } else caosIntrusoFalar(msgEl, getRandomReaction(caosIntrusoErros === 1 ? I.errou1 : I.errou2));
  return false;
}
function caosIntrusoBarrado(msgEl) {
  const sg = caosIntrusoTravado();
  if (sg) caosIntrusoFalar(msgEl, getRandomReaction(REACTIVE_VOICE.intruso.travado, sg));
  return sg > 0;
}
function caosInspectorLockScreen(ov) {
  ov.innerHTML = `<div class="ci-lock">
    <div class="ci-lock-icon">🔒</div>
    <div class="ci-chip ci-chip-red">TRAVA DO CRIADOR</div>
    <div class="ci-lock-title">Acesso restrito ao JF</div>
    <div class="ci-lock-sub">Digite a chave pra abrir o cérebro do C.A.O.S.</div>
    <div class="ci-lock-sub" style="font-style:italic; opacity:0.85;">🤖 ${escapeHtml(getRandomReaction(REACTIVE_VOICE.intruso.abrir))}</div>
    <div class="ci-lock-field"><input id="ciKey" type="password" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Chave do criador"><button type="button" id="ciEye" class="ci-eye" aria-label="Mostrar a chave">👁️</button></div>
    <div id="ciLockMsg" class="ci-lock-msg"></div>
    <div class="ci-lock-btns"><button type="button" id="ciCancel" class="ci-btn">Cancelar</button><button type="button" id="ciOpen" class="ci-btn ci-btn-accent">🔓 Destravar</button></div>
  </div>`;
  const inp = ov.querySelector("#ciKey"),
    msg = ov.querySelector("#ciLockMsg");
  const tentar = () => {
    if (caosIntrusoBarrado(msg)) {
      inp.value = "";
      return;
    }
    if (caosIntrusoTentativa(caosChaveOk(inp.value), msg, "inspetor")) {
      caosInspectorDestravado = true;
      try {
        sessionStorage.setItem("perfil5_caos_auth", "1");
      } catch (e) {}
      caosLog("acesso", "painel destravado pelo criador");
      caosInspectorPainel(ov);
    } else {
      inp.value = "";
      inp.focus();
    }
  };
  ov.querySelector("#ciOpen").addEventListener("click", tentar);
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tentar();
  });
  ov.querySelector("#ciCancel").addEventListener("click", () => ov.remove());
  ov.querySelector("#ciEye").addEventListener("click", () => {
    inp.type = inp.type === "password" ? "text" : "password";
  });
  setTimeout(() => {
    try {
      inp.focus();
    } catch (e) {}
  }, 60);
}
function caosInspectorPainel(ov) {
  ov.innerHTML = "";
  const box = document.createElement("div");
  box.className = "ci-box";
  const head = document.createElement("div");
  head.className = "ci-head";
  head.innerHTML = `<div class="ci-head-icon">🧠</div>
    <div class="ci-head-txt"><div class="ci-title">Cérebro do C.A.O.S. <span class="ci-badge">5.0.14 reativo</span></div>
    <div class="ci-sub">Central de Avaliação e Observação Sistêmica · acesso do criador</div></div>
    <div class="ci-head-btns"><button type="button" class="ci-btn ci-btn-red" id="ciLockBtn">🔒 Trancar</button><button type="button" class="ci-btn" id="ciCloseBtn">Fechar</button></div>`;
  const tabs = document.createElement("div");
  tabs.className = "ci-tabs";
  const body = document.createElement("div");
  body.className = "ci-body";
  const nCartas = () => {
    if (!caosCardMem) caosCardMemLoad();
    return Object.keys(caosCardMem.porCarta || {}).length;
  };
  const TABS = [
    ["estado", "🧠 Estado & Emoção"],
    ["ritmo", "📈 Ritmo & Humor", () => caosRitmoLog.length],
    ["memoria", "💾 Memória", nCartas],
    ["decisoes", "📜 Decisões", () => caosDecisionLog.length],
    ["console", "🎚️ Console"],
    ["sandbox", "🎛️ Sandbox"],
    ["falas", "📊 Falas"],
  ];
  function pintarAbas() {
    tabs.innerHTML = "";
    TABS.forEach(([id, label, cont]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ci-tab" + (caosInspectorTab === id ? " on" : "");
      b.innerHTML = label + (cont ? ` <span class="ci-count">${cont()}</span>` : "");
      b.addEventListener("click", () => {
        caosInspectorTab = id;
        pintarAbas();
        renderBody();
      });
      tabs.appendChild(b);
    });
  }
  function renderBody() {
    body.innerHTML = "";
    body.scrollTop = 0;
    if (caosInspectorTab === "estado") body.appendChild(caosInspectorEstado());
    else if (caosInspectorTab === "ritmo") body.appendChild(caosInspectorRitmo());
    else if (caosInspectorTab === "memoria") body.appendChild(caosInspectorMemoria());
    else if (caosInspectorTab === "decisoes")
      body.appendChild(
        caosInspectorDecisoes(() => {
          pintarAbas();
          renderBody();
        }),
      );
    else if (caosInspectorTab === "console") body.appendChild(caosInspectorConsole());
    else if (caosInspectorTab === "sandbox")
      body.appendChild(
        caosInspectorSandbox(() => {
          pintarAbas();
          renderBody();
        }),
      );
    else body.appendChild(caosInspectorFalas());
  }
  head.querySelector("#ciCloseBtn").addEventListener("click", () => ov.remove());
  head.querySelector("#ciLockBtn").addEventListener("click", () => {
    caosInspectorTrancar();
    ov.remove();
  });
  pintarAbas();
  renderBody();
  box.append(head, caosNeuralCriar(), tabs, body);
  ov.appendChild(box);
}
function caosInspectorEstado() {
  const wrap = document.createElement("div");
  const t = caosEmo.tensao,
    c = caosEmo.calor,
    p = caosEmo.paciencia ?? 7;
  const est = caosEstadoComposto(),
    hum = caosHumorMatriz();
  const grid = document.createElement("div");
  grid.className = "ci-grid3";
  grid.innerHTML =
    ciMedidor(
      "🔥",
      "Tensão / sarcasmo",
      t,
      t < 3.5 ? "Relaxado" : t < 6.5 ? "Nível equilibrado de provocação" : "Provocação alta",
      "#ff6b6b",
    ) +
    ciMedidor(
      "💛",
      "Calor / afeto",
      c,
      c < 3.5 ? "Frio e seco" : c < 6.5 ? "Companheirismo mordaz" : "Afetuoso (do jeito dele)",
      "#ffd166",
    ) +
    ciMedidor(
      "⏳",
      "Paciência",
      p,
      p <= 3 ? 'Por um fio — pode "perder a linha"' : p <= 5 ? "Curta" : "Tranquila",
      "#4ecdc4",
    ) +
    `<div class="ci-card"><div class="ci-kv"><span>Ritmo da partida</span><b class="ci-mono">${escapeHtml(caosMood())}${caosMoodOverride ? " (forçado)" : ""}</b></div>
      <div class="ci-kv"><span>Fadiga</span><b class="ci-mono">${escapeHtml(String(caosFatigueLevel))}</b></div>
      <div class="ci-kv"><span>Estado ativo</span><b class="ci-mono ci-red">${escapeHtml(est.toUpperCase())}</b></div>
      <div class="ci-kv"><span>Humor da matriz</span><b class="ci-mono">${hum ? escapeHtml(hum.toUpperCase()) : "—"}${caosHumorOverride ? " (forçado)" : ""}</b></div>
      <div class="ci-kv"><span>Saiu da partida?</span><b class="ci-mono">${caosSilenced ? "SIM" : "não"}</b></div>
      <div class="ci-kv"><span>💾 Salvamento</span><b class="ci-mono">${(() => {
        try {
          const st = JFStore.status();
          return st.ok ? "ligado (" + escapeHtml(st.camadas.join(" + ")) + ")" : "SEM salvamento automático";
        } catch (e) {
          return "?";
        }
      })()}</b></div>
      <div class="ci-kv"><span>🎲 Temperamento</span><b class="ci-mono">${escapeHtml(caosTemper.nome)}</b></div>
      <div class="ci-kv"><span>💘 Favorito / 😒 desafeto</span><b class="ci-mono">${escapeHtml((caosVinc && caosVinc.fav) || "—")} / ${escapeHtml((caosVinc && caosVinc.desafeto) || "—")}</b></div>
      <div class="ci-kv"><span>🧠 Humor contínuo</span><b class="ci-mono">${(() => {
        const h = caosHumorContinuo();
        return (
          escapeHtml(h.emo) + " " + h.k.toFixed(2) + (h.sec ? " + " + escapeHtml(h.sec) + " " + h.k2.toFixed(2) : "")
        );
      })()}</b></div>
      <div class="ci-kv"><span>😄 Alegria · 🎯 confiança · 🔎 curiosidade</span><b class="ci-mono">${caosEixos.alegria.toFixed(1)} · ${caosEixos.confianca.toFixed(1)} · ${caosEixos.curiosidade.toFixed(1)}</b></div>
      <div class="ci-kv"><span>Versão</span><b class="ci-mono">Beta 1.7.5 · C.A.O.S. 3.8</b></div>
      <div class="ci-kv"><span>⚠️ Avisos dos dados</span><b class="ci-mono">${avisosDados.length ? avisosDados.map(escapeHtml).join("<br>") : "nenhum"}</b></div></div>`;
  wrap.appendChild(grid);
  const sEst = ciSecao("⚡ Estados dinâmicos do cérebro");
  const g2 = document.createElement("div");
  g2.className = "ci-grid3";
  g2.innerHTML = CI_ESTADOS.map(
    ([k, nome, desc, cond]) =>
      `<div class="ci-state${k === est ? " on" : ""}"><div class="ci-state-name">${nome}</div><div class="ci-state-desc">${desc}</div><div class="ci-state-cond">${cond}</div></div>`,
  ).join("");
  sEst.appendChild(g2);
  wrap.appendChild(sEst);
  const sHum = ciSecao(
    "🎭 Matriz de humor e modulação da voz",
    `humor atual: ${hum ? escapeHtml(hum.toUpperCase()) : "NEUTRO"}`,
  );
  const g3 = document.createElement("div");
  g3.className = "ci-grid2";
  Object.keys(CI_HUMORES).forEach((k) => {
    const [em, nome, desc, cond] = CI_HUMORES[k],
      f = CAOS_VOICE_MATRIZ[k];
    const d = document.createElement("div");
    d.className = "ci-state" + (k === hum ? " on" : "");
    d.innerHTML = `<div class="ci-state-name">${em} ${nome} <span class="ci-mono ci-dim">vel ${f[0].toFixed(2)}× · tom ${f[1].toFixed(2)}×</span></div><div class="ci-state-desc">${desc}</div><div class="ci-state-cond">${cond}</div>`;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ci-mini";
    b.textContent = "🔊 ouvir";
    b.addEventListener("click", () => caosInspectorTestarVoz(k));
    d.appendChild(b);
    g3.appendChild(d);
  });
  sHum.appendChild(g3);
  if (!CAOS_VOICE_OK)
    sHum.insertAdjacentHTML("beforeend", '<div class="ci-note">Este aparelho não tem voz: o teste não toca.</div>');
  else if (!caosVoiceOn)
    sHum.insertAdjacentHTML(
      "beforeend",
      '<div class="ci-note">A voz do C.A.O.S. está desligada na splash — o teste toca mesmo assim.</div>',
    );
  wrap.appendChild(sHum);
  const marcado = caosMarked.idx !== null && players[caosMarked.idx] ? players[caosMarked.idx] : null;
  const sDos = ciSecao(
    "🎯 Dossiê dos jogadores",
    marcado ? `marcado: ${escapeHtml(marcado.name)} (${caosMarked.remaining} eventos)` : "ninguém marcado agora",
  );
  if (!players.length)
    sDos.insertAdjacentHTML("beforeend", '<div class="ci-empty">Nenhum jogador na partida ainda.</div>');
  else {
    const lista = document.createElement("div");
    lista.className = "ci-list";
    lista.innerHTML = players
      .map((pl, i) => {
        const mem = caosMemPl(i),
          seq = mem.res.join("") || "-",
          arq = caosArquetipo(i);
        const med = mem.msMedio ? Math.round(mem.msMedio / 100) / 10 + " s" : "-";
        return `<div class="ci-row${caosMarked.idx === i ? " on" : ""}"><span>${escapeHtml(pl.avatar || "")} ${escapeHtml(pl.name)}${caosMarked.idx === i ? " 🎯" : ""}</span>
        <span class="ci-chip">${CI_ARQUETIPOS[arq] || arq}</span><span class="ci-mono ci-dim">[${escapeHtml(seq)}] · ${med}</span></div>`;
      })
      .join("");
    sDos.appendChild(lista);
    sDos.insertAdjacentHTML(
      "beforeend",
      '<div class="ci-note">H = acertou · M = errou (últimas 12 jogadas). O estilo aparece depois de 3 jogadas da pessoa.</div>',
    );
  }
  wrap.appendChild(sDos);
  if (players.length) {
    const cores = { suave: "#34d399", normal: "#60a5fa", acido: "#f59e0b", zero: "#ef4444" };
    const cont = { suave: 0, normal: 0, acido: 0, zero: 0 };
    players.forEach((p2) => {
      cont[playerHumor(p2)]++;
    });
    const tot = players.length,
      R = 34,
      C = 2 * Math.PI * R;
    let off = 0;
    const arcos = Object.keys(cont)
      .filter((k) => cont[k])
      .map((k) => {
        const len = (C * cont[k]) / tot;
        const a = `<circle cx="50" cy="50" r="${R}" fill="none" stroke="${cores[k]}" stroke-width="16" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 50 50)"/>`;
        off += len;
        return a;
      })
      .join("");
    const quente = (cont.acido + cont.zero * 2) / tot,
      temp =
        quente >= 1
          ? "🔥 mesa pegando fogo"
          : quente >= 0.4
            ? "🌶️ mesa apimentada"
            : cont.suave > tot / 2
              ? "🌷 mesa fofa"
              : "😏 mesa na média";
    const sRos = ciSecao("🍩 Temperatura da mesa (zoeira de cada jogador)", temp);
    sRos.insertAdjacentHTML(
      "beforeend",
      `<div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;"><svg viewBox="0 0 100 100" width="110" height="110" role="img" aria-label="Distribuição dos níveis de zoeira">${arcos}<text x="50" y="55" text-anchor="middle" font-size="16" font-weight="700" fill="currentColor">${tot}</text></svg>
      <div class="ci-list" style="flex:1; min-width:140px;">${Object.keys(cont)
        .map(
          (k) =>
            `<div class="ci-row"><span><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${cores[k]}; margin-right:6px;"></span>${HUMOR_NOMES[k]}</span><span class="ci-mono">${cont[k]}</span></div>`,
        )
        .join("")}</div></div>`,
    );
    wrap.appendChild(sRos);
  }
  if (currentCard && cardState === "revealed" && CURRENT_MODE !== "express") {
    const n = revealedOrder.filter((r) => r.item.type === "clue").length;
    const sVp = ciSecao("🤖 Jogador artificial (carta atual)");
    sVp.insertAdjacentHTML(
      "beforeend",
      `<div class="ci-card"><div class="ci-kv"><span>Ele "descobre" esta carta na dica</span><b class="ci-mono">${currentCard._caosLimiar || 5}</b></div>
      <div class="ci-kv"><span>Dicas reais reveladas</span><b class="ci-mono">${n}</b></div><div class="ci-kv"><span>Histórico da carta</span><b class="ci-mono">${escapeHtml(currentCard._caosDificuldade || "sem amostra")}</b></div></div>`,
    );
    wrap.appendChild(sVp);
  }
  return wrap;
}
function caosInspectorRitmo() {
  const wrap = document.createElement("div");
  const R = caosRitmoLog;
  const sec = ciSecao(
    "⏱️ Velocidade de resposta × humor do C.A.O.S.",
    R.length
      ? `${R.length} resposta${R.length === 1 ? "" : "s"} · média ${ciSeg(R.reduce((a, r) => a + r.ms, 0) / R.length)}`
      : "sem dados",
  );
  sec.insertAdjacentHTML(
    "beforeend",
    '<div class="ci-note">Cada bolinha é uma resposta (● acerto · ○ erro), na cor do humor do C.A.O.S. no momento em que a pessoa respondeu. A linha branca é a média móvel da mesa (últimas 5 respostas). Toque numa bolinha pra ver o detalhe.</div>',
  );
  if (CURRENT_MODE === "express")
    sec.insertAdjacentHTML(
      "beforeend",
      '<div class="ci-empty">O Express não mede tempo de resposta por jogador (a carta e a vez têm relógio próprio).</div>',
    );
  else if (R.length < 2)
    sec.insertAdjacentHTML(
      "beforeend",
      '<div class="ci-empty">Joguem algumas cartas: o gráfico aparece a partir de 2 respostas.</div>',
    );
  else {
    const n = R.length;
    const maxS = Math.max(10, Math.ceil(Math.max(...R.map((r) => r.ms)) / 1e3 / 10) * 10);
    const ticks = [];
    for (let v = 0; v <= maxS; v += maxS <= 40 ? 10 : maxS <= 100 ? 20 : 30) ticks.push(v);
    const f = ciChartFrame(n, maxS, ticks, (v) => v + "s");
    const mm = R.map((r, i) => {
      const j = R.slice(Math.max(0, i - 4), i + 1);
      return j.reduce((a, b) => a + b.ms, 0) / j.length / 1e3;
    });
    const linha = mm.map((v, i) => `${i ? "L" : "M"}${f.x(i).toFixed(1)},${f.y(v).toFixed(1)}`).join(" ");
    const dots = R.map((r, i) => {
      const cor = ciHumorCor(r.humor);
      return `<circle class="ci-dot" data-i="${i}" cx="${f.x(i).toFixed(1)}" cy="${f.y(r.ms / 1e3).toFixed(1)}" r="${n > 60 ? 3.5 : 5}" fill="${r.ok ? cor : "rgba(20,6,14,0.9)"}" stroke="${cor}" stroke-width="2"><title>${escapeHtml(r.nome)} · ${ciSeg(r.ms)} · ${r.ok ? "acertou" : "errou"} · ${r.humor}</title></circle>`;
    }).join("");
    const xl = [];
    const passo = Math.max(1, Math.ceil(n / 8));
    for (let i = 0; i < n; i += passo)
      xl.push(`<text x="${f.x(i)}" y="${f.H - 6}" font-size="9" text-anchor="middle">${i + 1}</text>`);
    const box = document.createElement("div");
    box.innerHTML =
      `<svg class="ci-chart" viewBox="0 0 ${f.W} ${f.H}" role="img" aria-label="Tempo de resposta de cada jogada, colorido pelo humor do C.A.O.S.">${ciHumorBandas(f, R, n)}${f.grid}${xl.join("")}<path d="${linha}" fill="none" stroke="#fff" stroke-width="2" opacity="0.85"/>${dots}</svg>` +
      ciLegendaHumor(new Set(R.map((r) => r.humor))) +
      '<div class="ci-legend"><span>● acerto</span><span>○ erro</span><span><i style="background:#fff;height:2px;"></i> média móvel (5)</span><span class="ci-dim">eixo X = nº da resposta na partida</span></div><div class="ci-preview ci-ritmo-det">Toque numa bolinha.</div>';
    const det = box.querySelector(".ci-ritmo-det");
    box.querySelector("svg").addEventListener("click", (ev) => {
      const el = ev.target.closest && ev.target.closest(".ci-dot");
      if (!el) return;
      box.querySelectorAll(".ci-dot.sel").forEach((d) => d.classList.remove("sel"));
      el.classList.add("sel");
      const r = R[+el.dataset.i];
      if (!r) return;
      det.innerHTML = `<b>Resposta ${+el.dataset.i + 1}</b> (carta ${r.carta}) · ${escapeHtml(r.nome)} · <b>${ciSeg(r.ms)}</b> · ${r.ok ? "✅ acertou" : "❌ errou"}<br>C.A.O.S.: ${CI_HUMOR_NOME[r.humor] || escapeHtml(r.humor)} · estado ${escapeHtml(r.estado || "-")} · tensão ${ciDec(r.t)} · calor ${ciDec(r.c)}`;
    });
    sec.appendChild(box);
    const porCarta = [];
    R.forEach((r) => {
      const u = porCarta[porCarta.length - 1];
      if (u && u.carta === r.carta) {
        u.ms += r.ms;
        u.n++;
        u.hs[r.humor] = (u.hs[r.humor] || 0) + 1;
      } else porCarta.push({ carta: r.carta, ms: r.ms, n: 1, hs: { [r.humor]: 1 } });
    });
    if (porCarta.length >= 2) {
      const pc = porCarta.map((c) => ({
        carta: c.carta,
        s: c.ms / c.n / 1e3,
        n: c.n,
        humor: Object.entries(c.hs).sort((a, b) => b[1] - a[1])[0][0],
      }));
      const m2 = pc.length,
        maxS2 = Math.max(10, Math.ceil(Math.max(...pc.map((c) => c.s)) / 10) * 10);
      const ticks2 = [];
      for (let v = 0; v <= maxS2; v += maxS2 <= 40 ? 10 : maxS2 <= 100 ? 20 : 30) ticks2.push(v);
      const f2 = ciChartFrame(m2, maxS2, ticks2, (v) => v + "s");
      const mediaGeral = R.reduce((a, r) => a + r.ms, 0) / R.length / 1e3;
      const trechos = pc
        .slice(1)
        .map(
          (c, i) =>
            `<line x1="${f2.x(i).toFixed(1)}" y1="${f2.y(pc[i].s).toFixed(1)}" x2="${f2.x(i + 1).toFixed(1)}" y2="${f2.y(c.s).toFixed(1)}" stroke="${ciHumorCor(c.humor)}" stroke-width="3" stroke-linecap="round"/>`,
        )
        .join("");
      const pts = pc
        .map(
          (c, i) =>
            `<circle cx="${f2.x(i).toFixed(1)}" cy="${f2.y(c.s).toFixed(1)}" r="4" fill="${ciHumorCor(c.humor)}" stroke="#14060d" stroke-width="1.5"><title>Carta ${c.carta} · ${ciSeg(c.s * 1e3)} de média (${c.n} resposta${c.n === 1 ? "" : "s"}) · ${c.humor}</title></circle>`,
        )
        .join("");
      const xl2 = [];
      const passo2 = Math.max(1, Math.ceil(m2 / 8));
      for (let i = 0; i < m2; i += passo2)
        xl2.push(`<text x="${f2.x(i)}" y="${f2.H - 6}" font-size="9" text-anchor="middle">c${pc[i].carta}</text>`);
      const box2 = document.createElement("div");
      box2.innerHTML =
        `<div class="ci-section-title" style="margin-top:14px;">📉 Tempo médio por carta × humor</div><svg class="ci-chart" viewBox="0 0 ${f2.W} ${f2.H}" role="img" aria-label="Tempo médio de resposta em cada carta, com a linha colorida pelo humor do C.A.O.S.">${f2.grid}${xl2.join("")}<line x1="${f2.P.l}" x2="${f2.W - f2.P.r}" y1="${f2.y(mediaGeral)}" y2="${f2.y(mediaGeral)}" stroke="#fff" stroke-dasharray="4 4" opacity="0.5"/>${trechos}${pts}</svg>` +
        ciLegendaHumor(new Set(pc.map((c) => c.humor))) +
        `<div class="ci-legend"><span><i style="background:#fff;height:2px;"></i> média da partida (${ciSeg(mediaGeral * 1e3)})</span><span class="ci-dim">eixo X = carta</span></div><div class="ci-note">Linha subindo = a mesa ficando mais lenta; descendo = acelerando. A cor mostra em que humor o C.A.O.S. estava naquela carta.</div>`;
      sec.appendChild(box2);
    }
    const porHumor = {};
    R.forEach((r) => {
      const h = porHumor[r.humor] || (porHumor[r.humor] = { n: 0, ms: 0, ok: 0 });
      h.n++;
      h.ms += r.ms;
      if (r.ok) h.ok++;
    });
    const geral = R.reduce((a, r) => a + r.ms, 0) / n;
    sec.insertAdjacentHTML(
      "beforeend",
      '<div class="ci-section-title" style="margin-top:14px;">🎭 Tempo médio da mesa por humor</div><div class="ci-table"><div class="ci-tr ci-tr4 ci-th"><span>Humor do C.A.O.S.</span><span>Respostas</span><span>Tempo médio</span><span>Acerto</span></div>' +
        Object.keys(CI_HUMOR_COR)
          .filter((h) => porHumor[h])
          .map((h) => {
            const d = porHumor[h],
              m = d.ms / d.n,
              dif = m - geral;
            return `<div class="ci-tr ci-tr4"><span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${ciHumorCor(h)};margin-right:5px;"></i>${CI_HUMOR_NOME[h]}</span><span class="ci-mono">${d.n}</span><span class="ci-mono">${ciSeg(m)} <span class="${dif > 0 ? "ci-red" : "ci-green"} ci-dim">${d.n > 1 && n > d.n ? (dif > 0 ? "+" : "−") + ciSeg(Math.abs(dif)) : ""}</span></span><span class="ci-mono">${Math.round((d.ok / d.n) * 100)}%</span></div>`;
          })
          .join("") +
        "</div>",
    );
    const rt = ciPearson(
        R.map((r) => r.t),
        R.map((r) => r.ms),
      ),
      rc = ciPearson(
        R.map((r) => r.c),
        R.map((r) => r.ms),
      );
    sec.insertAdjacentHTML(
      "beforeend",
      `<div class="ci-note">+/− = diferença pra média geral (${ciSeg(geral)}). ${ciLeCorrelacao(rt, "🔥 Tensão × tempo")} ${ciLeCorrelacao(rc, "💛 Calor × tempo")} Correlação não é causa: o humor também reage ao ritmo da mesa.</div>`,
    );
    const porJog = {};
    R.forEach((r) => (porJog[r.nome] || (porJog[r.nome] = [])).push(r.ms));
    const linhas = Object.entries(porJog)
      .map(([nome, arr]) => {
        const m = arr.reduce((a, b) => a + b, 0) / arr.length;
        let tend = '<span class="ci-dim">poucos dados</span>';
        if (arr.length >= 4) {
          const h = Math.floor(arr.length / 2),
            a1 = arr.slice(0, h),
            a2 = arr.slice(h);
          const d = a2.reduce((a, b) => a + b, 0) / a2.length - a1.reduce((a, b) => a + b, 0) / a1.length;
          tend =
            Math.abs(d) < 1500
              ? "➡️ estável"
              : d < 0
                ? `<span class="ci-green">⚡ acelerou ${ciSeg(-d)}</span>`
                : `<span class="ci-red">🐢 desacelerou ${ciSeg(d)}</span>`;
        }
        return `<div class="ci-row"><span>${escapeHtml(nome)}</span><span class="ci-mono">${ciSeg(m)} · ${arr.length}×</span><span>${tend}</span></div>`;
      })
      .join("");
    sec.insertAdjacentHTML(
      "beforeend",
      `<div class="ci-section-title" style="margin-top:14px;">👥 Velocidade média de cada jogador</div><div class="ci-list">${linhas}</div><div class="ci-note">Tendência = média da 2ª metade das respostas da pessoa × a da 1ª metade (4+ respostas).</div>`,
    );
  }
  wrap.appendChild(sec);
  const E = caosEmoHist;
  const atual = caosHumorMatriz() || "neutro";
  const secE = ciSecao("💓 Histórico Emocional", `agora: ${CI_HUMOR_NOME[atual] || escapeHtml(atual)}`);
  secE.insertAdjacentHTML(
    "beforeend",
    '<div class="ci-note">Tensão, calor e paciência a cada evento da partida (acerto, erro, carta esgotada ou ajuste no Sandbox). O fundo e a faixa embaixo mostram a zona de humor da matriz em cada momento.</div>',
  );
  if (E.length < 2)
    secE.insertAdjacentHTML(
      "beforeend",
      '<div class="ci-empty">Ainda não há mudanças registradas nesta partida.</div>',
    );
  else {
    const n = E.length;
    const f = ciChartFrame(n, 10, [0, 2.5, 5, 7.5, 10], (v) => String(v).replace(".", ","));
    const serie = (k, cor) =>
      `<path d="${E.map((e, i) => `${i ? "L" : "M"}${f.x(i).toFixed(1)},${f.y(e[k]).toFixed(1)}`).join(" ")}" fill="none" stroke="${cor}" stroke-width="2.2" stroke-linejoin="round"/>`;
    const fim = E[n - 1];
    const rotulos = [
      ["t", "#ff6b6b"],
      ["c", "#ffd166"],
      ["p", "#4ecdc4"],
    ]
      .map(([k, cor]) => `<circle cx="${f.x(n - 1)}" cy="${f.y(fim[k])}" r="3.5" fill="${cor}"/>`)
      .join("");
    const box = document.createElement("div");
    box.innerHTML = `<svg class="ci-chart" viewBox="0 0 ${f.W} ${f.H}" role="img" aria-label="Linha do tempo de tensão, calor e paciência do C.A.O.S.">${ciHumorBandas(f, E, n)}${f.grid}${serie("p", "#4ecdc4")}${serie("c", "#ffd166")}${serie("t", "#ff6b6b")}${rotulos}<text x="${f.P.l}" y="${f.H - 6}" font-size="9">início</text><text x="${f.W - f.P.r}" y="${f.H - 6}" font-size="9" text-anchor="end">agora (carta ${fim.carta})</text></svg><div class="ci-legend"><span><i style="background:#ff6b6b"></i>🔥 Tensão ${ciDec(fim.t)}</span><span><i style="background:#ffd166"></i>💛 Calor ${ciDec(fim.c)}</span><span><i style="background:#4ecdc4"></i>⏳ Paciência ${ciDec(fim.p)}</span></div>`;
    const segs = ciSegmentos(E, (e) => e.humor);
    box.insertAdjacentHTML(
      "beforeend",
      '<div class="ci-ribbon">' +
        segs
          .map(
            (sg) =>
              `<div style="flex:${sg.n};background:${ciHumorCor(sg.key)};color:#1a1a2e;" title="${escapeHtml(CI_HUMOR_NOME[sg.key] || sg.key)} · ${sg.n} evento(s)">${sg.n >= Math.max(2, n / 8) ? (CI_HUMOR_NOME[sg.key] || "").split(" ")[0] : ""}</div>`,
          )
          .join("") +
        "</div>" +
        ciLegendaHumor(new Set(E.map((e) => e.humor))),
    );
    const nomeEstado = (k) => {
      const x = CI_ESTADOS.find((s) => s[0] === k);
      return x ? x[1] : k;
    };
    const trans = [];
    for (let i = 1; i < n; i++) {
      const a = E[i - 1],
        b = E[i];
      if (a.humor !== b.humor) trans.push({ tipo: "humor", de: a.humor, para: b.humor, e: b });
      else if (a.estado !== b.estado) trans.push({ tipo: "estado", de: a.estado, para: b.estado, e: b });
    }
    const tempoHumor = {};
    E.forEach((e) => {
      tempoHumor[e.humor] = (tempoHumor[e.humor] || 0) + 1;
    });
    const resumo = Object.keys(CI_HUMOR_COR)
      .filter((h) => tempoHumor[h])
      .map(
        (h) =>
          `<span class="ci-chip" style="border-color:${ciHumorCor(h)}">${CI_HUMOR_NOME[h]} ${Math.round((tempoHumor[h] / n) * 100)}%</span>`,
      )
      .join(" ");
    const ult = trans.slice(-25).reverse();
    const itens = ult
      .map((x, k) => {
        const e = x.e,
          humor = x.tipo === "humor";
        const titulo = humor
          ? `${CI_HUMOR_NOME[x.de] || escapeHtml(x.de)} → <b>${CI_HUMOR_NOME[x.para] || escapeHtml(x.para)}</b>`
          : `estado: ${escapeHtml(nomeEstado(x.de))} → <b>${escapeHtml(nomeEstado(x.para))}</b>`;
        const causa =
          e.motivo === "sandbox"
            ? "🎛️ ajuste no Sandbox"
            : e.motivo === "início"
              ? "🏁 começo da partida"
              : e.motivo
                ? "⚡ " + escapeHtml(e.motivo)
                : "🌊 variação natural (ritmo da mesa / emoção voltando ao normal)";
        return `<div class="ci-vt-item ${humor ? "humor" : "estado"}"><div class="ci-vt-node" style="background:${ciHumorCor(humor ? x.para : e.humor)}"></div><div class="ci-vt-card">
        <div class="ci-vt-head"><span>${titulo}</span><span class="ci-mono ci-dim">carta ${e.carta}${k === 0 ? ' <span class="ci-chip ci-chip-green">MAIS RECENTE</span>' : ""}</span></div>
        <div class="ci-vt-ctx">${causa}</div>
        ${humor ? `<div class="ci-mono ci-dim">🔥 ${ciDec(e.t)} · 💛 ${ciDec(e.c)} · ⏳ ${ciDec(e.p)}</div>` : ""}
        ${e.fala ? `<div class="ci-vt-fala">💬 “${escapeHtml(e.fala)}”</div>` : ""}
      </div></div>`;
      })
      .join("");
    const trocasHumor = trans.filter((x) => x.tipo === "humor").length;
    box.insertAdjacentHTML(
      "beforeend",
      `<div class="ci-section-title" style="margin-top:14px;">🕑 Linha do tempo do humor<span class="ci-section-extra">${trocasHumor} troca${trocasHumor === 1 ? "" : "s"} de humor</span></div><div class="ci-note">Quanto da partida ele passou em cada humor: ${resumo}</div>` +
        (ult.length
          ? `<div class="ci-vt">${itens}</div>`
          : '<div class="ci-empty">Ainda nenhuma troca de humor ou de estado nesta partida.</div>') +
        (trans.length > 25 ? '<div class="ci-note">Mostrando as 25 trocas mais recentes.</div>' : ""),
    );
    secE.appendChild(box);
  }
  wrap.appendChild(secE);
  return wrap;
}
function caosInspectorTestarVoz(humor) {
  const bank = REACTIVE_VOICE.matrizHumor && REACTIVE_VOICE.matrizHumor[humor];
  const txt = ciAmostra(bank) || "[C.A.O.S.] Testando o humor " + humor + ".";
  if (!CAOS_VOICE_OK) return;
  const ligada = caosVoiceOn;
  caosVoiceOn = true;
  try {
    caosSpeak(txt, humor);
  } finally {
    caosVoiceOn = ligada;
  }
}
function caosInspectorMemoria() {
  const wrap = document.createElement("div");
  if (!caosCardMem) caosCardMemLoad();
  const todas = Object.entries(caosCardMem.porCarta || {})
    .map(([nome, pc]) => {
      const total = (pc.acertos || 0) + (pc.erros || 0);
      const taxa = pc.taxaEMA != null ? pc.taxaEMA : total ? pc.acertos / total : null;
      const dif = total < 3 ? "amostra" : taxa >= 0.7 ? "facil" : taxa <= 0.35 ? "dificil" : "media";
      return { nome, acertos: pc.acertos || 0, erros: pc.erros || 0, total, taxa, dif };
    })
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
  const sec = ciSecao(
    "💾 Memória das cartas (entre partidas, neste aparelho)",
    `${todas.length} cartas · ${todas.filter((x) => x.total >= 3).length} classificadas`,
  );
  sec.insertAdjacentHTML(
    "beforeend",
    '<div class="ci-note">Taxa de acerto com média móvel (a jogada mais recente pesa 25%). Com 3+ resoluções a carta ganha um rótulo — é daí que saem as falas de "surpresa" e o momento em que o jogador artificial "descobre" a carta.</div>',
  );
  const busca = document.createElement("input");
  busca.type = "search";
  busca.className = "ci-input";
  busca.placeholder = "Buscar carta...";
  const tabela = document.createElement("div");
  const CHIP = {
    facil: '<span class="ci-chip ci-chip-green">FÁCIL</span>',
    media: '<span class="ci-chip">MÉDIA</span>',
    dificil: '<span class="ci-chip ci-chip-red">DIFÍCIL</span>',
    amostra: '<span class="ci-chip ci-dim">AMOSTRA PEQUENA</span>',
  };
  const desenhar = () => {
    const q = busca.value.trim().toLowerCase();
    const linhas = todas.filter((x) => !q || x.nome.toLowerCase().includes(q)).slice(0, 200);
    tabela.innerHTML = !todas.length
      ? '<div class="ci-empty">Nenhuma carta com histórico ainda — joguem uma partida.</div>'
      : `<div class="ci-table"><div class="ci-tr ci-th"><span>Carta</span><span>Acertos</span><span>Erros</span><span>Taxa</span><span>Dificuldade</span></div>` +
        linhas
          .map(
            (x) =>
              `<div class="ci-tr"><span>${escapeHtml(x.nome)}</span><span class="ci-green">${x.acertos}</span><span class="ci-red">${x.erros}</span><span class="ci-mono">${x.taxa == null ? "-" : Math.round(x.taxa * 100) + "%"}</span><span>${CHIP[x.dif]}</span></div>`,
          )
          .join("") +
        (linhas.length ? "" : '<div class="ci-empty">Nenhuma carta com esse nome.</div>') +
        "</div>";
  };
  busca.addEventListener("input", desenhar);
  desenhar();
  sec.append(busca, tabela);
  wrap.appendChild(sec);
  return wrap;
}
function caosInspectorDecisoes(onChange) {
  const wrap = document.createElement("div");
  const limpar = document.createElement("button");
  limpar.type = "button";
  limpar.className = "ci-mini";
  limpar.textContent = "Limpar log";
  limpar.addEventListener("click", () => {
    caosDecisionLog = [];
    onChange();
  });
  const DIF_CHIP = {
    facil: '<span class="ci-chip ci-chip-green">FÁCIL</span>',
    media: '<span class="ci-chip">MÉDIA</span>',
    dificil: '<span class="ci-chip ci-chip-red">DIFÍCIL</span>',
  };
  const secEv = ciSecao("⚡ Eventos recentes", "últimas 10 jogadas");
  const ev = caosRitmoLog.slice(-10).reverse();
  secEv.insertAdjacentHTML(
    "beforeend",
    ev.length
      ? '<div class="ci-list">' +
          ev
            .map(
              (r) =>
                `<div class="ci-log" style="border-left-color:${r.ok ? "#4ade80" : "#ff6b8a"}"><div class="ci-log-top"><span class="ci-chip ${r.ok ? "ci-chip-green" : "ci-chip-red"}">${r.ok ? "✅ ACERTO" : "❌ ERRO"}</span><b>${escapeHtml(r.nome)}</b><span class="ci-mono ci-dim">carta ${r.carta}${r.dicas ? " · " + r.dicas + (r.dicas === 1 ? " dica" : " dicas") : ""} · ${ciSeg(r.ms)}</span>${DIF_CHIP[r.dif] || '<span class="ci-chip ci-dim">SEM HISTÓRICO</span>'}</div><div class="ci-log-txt">${r.resp ? "🃏 " + escapeHtml(r.resp) + " · " : ""}C.A.O.S.: ${CI_HUMOR_NOME[r.humor] || escapeHtml(r.humor)} · ${escapeHtml(r.estado || "-")} · 🔥 ${ciDec(r.t)} · 💛 ${ciDec(r.c)}</div></div>`,
            )
            .join("") +
          "</div>"
      : `<div class="ci-empty">${CURRENT_MODE === "express" ? "O Express não mede acerto/erro por jogador com tempo — aqui fica vazio." : "Nenhuma jogada ainda nesta partida."}</div>`,
  );
  secEv.insertAdjacentHTML(
    "beforeend",
    '<div class="ci-note">Dificuldade = o que a memória do C.A.O.S. calculou pra carta com as partidas anteriores neste aparelho (precisa de 3+ resoluções). A resposta aparece aqui porque o painel é só do criador.</div>',
  );
  wrap.appendChild(secEv);
  const sec = ciSecao("📜 Fluxo de decisão (esta partida)");
  sec.querySelector(".ci-section-title").appendChild(limpar);
  sec.insertAdjacentHTML(
    "beforeend",
    '<div class="ci-note">Cada fala que apareceu (com o banco de onde veio), trocas de humor, jogador marcado, jogador artificial, dossiê e saída da partida — com o estado do cérebro naquele momento.</div>',
  );
  if (!caosDecisionLog.length)
    sec.insertAdjacentHTML(
      "beforeend",
      '<div class="ci-empty">Nenhuma decisão registrada ainda nesta partida. Joguem algumas cartas pra ver o cérebro raciocinando.</div>',
    );
  else {
    const lista = document.createElement("div");
    lista.className = "ci-list";
    lista.innerHTML = [...caosDecisionLog]
      .reverse()
      .map(
        (e) =>
          `<div class="ci-log"><div class="ci-log-top"><span class="ci-mono ci-dim">${new Date(e.t).toLocaleTimeString("pt-BR")}</span><span class="ci-chip">${escapeHtml(e.tipo)}</span>${e.estado ? `<span class="ci-mono ci-dim">${escapeHtml(e.estado)} · ${escapeHtml(e.humor || "")}</span>` : ""}</div><div class="ci-log-txt">${escapeHtml(e.detalhe)}</div></div>`,
      )
      .join("");
    sec.appendChild(lista);
  }
  wrap.appendChild(sec);
  return wrap;
}
function caosInspectorConsole() {
  const caixa = document.createElement("div");
  const wrap = document.createElement("div");
  caixa.appendChild(wrap);
  const pintar = () => {
    const C = caosConsole,
      F = CAOS_CONSOLE_CFG;
    const barras = Object.keys(CAOS_CONSOLE)
      .map((k) => {
        const M = CAOS_CONSOLE[k],
          v = C.g[k],
          on = C.atual === k;
        return `<div class="ci-kv"${on ? ' style="font-weight:800"' : ""}><span>${M.ic} ${k}${on ? " ◀" : ""}</span><b class="ci-mono">${v.toFixed(1)}</b></div><div class="ci-bar"><i style="width:${Math.min(100, v * 10)}%;background:${M.cor}"></i></div>`;
      })
      .join("");
    wrap.innerHTML = `<div class="ci-section"><div class="ci-section-title">🎚️ Console de emoções <span class="ci-section-extra">${C.on ? "LIGADO (manda no rosto)" : "desligado (modelo 2.3)"}</span></div>
      <div class="ci-card"><div class="ci-kv"><span>Emoção que manda</span><b class="ci-mono ci-red">${escapeHtml(C.atual.toUpperCase())}</b></div>
      <div class="ci-kv"><span>Rosto da última fala</span><b class="ci-mono">${escapeHtml(C.mostra)}</b></div>
      <div class="ci-kv"><span>Falas nessa emoção</span><b class="ci-mono">${C.dwell}</b></div>
      <div class="ci-kv"><span>Mistura</span><b class="ci-mono">${escapeHtml(C.mist || "—")}</b></div>
      <div class="ci-note">Limiar ${F.limiar} · sai abaixo de ${F.saida} · troca com margem ${F.margem} · mínimo ${F.dwell} falas. Tensão, calor e paciência só modulam.</div></div>
      <div class="ci-card">${barras}</div>
      <div class="ci-card"><div class="ci-section-title">📜 Últimos gatilhos</div><div class="ci-note ci-mono">${C.log.slice(-12).reverse().map(escapeHtml).join("<br>") || "—"}</div></div></div>`;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ci-btn";
    b.textContent = C.on ? "⏻ Desligar o console (volta o modelo 2.3)" : "⏻ Ligar o console";
    b.addEventListener("click", () => {
      C.on = !C.on;
      try {
        JFStore.setItem("perfil5_caos_console", C.on ? "1" : "0");
      } catch (e) {}
      caosLog("console", C.on ? "ligado" : "desligado");
      pintar();
    });
    wrap.querySelector(".ci-section").appendChild(b);
  };
  pintar();
  const tk = setInterval(() => {
    if (!wrap.isConnected) return clearInterval(tk);
    pintar();
  }, 1e3);
  {
    const inj = document.createElement("div");
    inj.className = "ci-section";
    const tt = document.createElement("div");
    tt.className = "ci-section-title";
    tt.textContent = "🧪 Injetar emoção (teste)";
    inj.appendChild(tt);
    const gr = document.createElement("div");
    gr.className = "ci-grid2";
    Object.keys(CAOS_CONSOLE).forEach((k) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ci-step";
      b.textContent = CAOS_CONSOLE[k].ic + " +4 " + k;
      b.style.background = "#334155";
      b.addEventListener("click", () => {
        caosSentir(k, 4, "sandbox");
        caosConsoleAvancar("joia.sandbox");
        caosLog("sandbox", "injetou " + k);
        pintar();
      });
      gr.appendChild(b);
    });
    inj.appendChild(gr);
    inj.insertAdjacentHTML(
      "beforeend",
      '<div class="ci-note">Soma +4 no medidor e reavalia na hora a emoção que manda. O rosto muda na próxima fala. Não mexe em ponto nem em regra.</div>',
    );
    caixa.appendChild(inj);
  }
  return caixa;
}
function caosCutucado(gancho) {
  const antes = JSON.stringify(caosEmo);
  caosCosq.mexidas++;
  const agora = Date.now();
  if (caosCosq.mexidas === 1 || caosCosq.n >= 6 || agora - caosCosq.at < 2e4 || Math.random() > 1 / 3.5) return null;
  caosCosq.at = agora;
  const est = caosCosq.n;
  caosCosq.n++;
  const G = CAOS_COSQ.gancho;
  const txt =
    est === 0
      ? caosPickNR("cosq.e", CAOS_COSQ.estranha)
      : est === 1 || est === 3
        ? caosPickNR("cosq." + gancho, G[gancho] || G.geral)
        : est === 2
          ? caosPickNR("cosq.jf", CAOS_COSQ.jf)
          : caosPickNR("cosq.r", CAOS_COSQ.resigna);
  const face = CAOS_EMOS[est >= 4 ? "ombros" : est === 2 ? "julgando" : "surpresa"];
  caosCosq.ult = `${(face.niv[0][0] || [""])[0]}  ${txt}`;
  if (caosCosq.voz && !caosCosq.falouAlto) {
    caosCosq.falouAlto = true;
    try {
      const l = caosVoiceOn;
      caosVoiceOn = true;
      caosSpeak(txt);
      caosVoiceOn = l;
    } catch (e) {}
  }
  if (JSON.stringify(caosEmo) !== antes) DEBUG && console.warn("cosquinha mexeu no humor!");
  return caosCosq.ult;
}
function caosInspectorSandbox(onChange) {
  const wrap = document.createElement("div");
  const sec1 = ciSecao("🎛️ Ajustar vetor emocional", "só vale pra partida atual");
  if (caosCosq.ult)
    sec1.insertAdjacentHTML("beforeend", `<div class="ci-note ci-cosq">🪶 ${escapeHtml(caosCosq.ult)}</div>`);
  {
    const lb = document.createElement("label");
    lb.className = "ci-note";
    lb.style.display = "block";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = caosCosq.voz;
    cb.addEventListener("change", () => {
      caosCosq.voz = cb.checked;
    });
    lb.append(cb, " pode reclamar em voz alta (no máx. 1 vez)");
    sec1.appendChild(lb);
  }
  {
    const lt = document.createElement("label");
    lt.className = "ci-note";
    lt.style.display = "block";
    const ct = document.createElement("input");
    ct.type = "checkbox";
    ct.checked = caosVetorTravado;
    ct.addEventListener("change", () => {
      caosVetorTravado = ct.checked;
      caosLog("sandbox", caosVetorTravado ? "vetor travado" : "vetor solto");
    });
    lt.append(ct, " 🔒 travar o vetor (só eu mexo; nada muda sozinho nesta partida)");
    sec1.appendChild(lt);
  }
  const g = document.createElement("div");
  g.className = "ci-grid2";
  const mkStepper = (label, get, set, step, corPos, corNeg) => {
    const boxS = document.createElement("div");
    boxS.className = "ci-card";
    boxS.innerHTML = `<div class="ci-meter-top"><span>${label}</span><b>${ciNum(get(), 0)}</b></div>`;
    const row = document.createElement("div");
    row.className = "ci-grid2 ci-tight";
    [
      [`− ${label} (−${step})`, -step, corNeg],
      [`+ ${label} (+${step})`, step, corPos],
    ].forEach(([txt, delta, cor]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ci-step";
      b.textContent = txt;
      b.style.background = cor;
      b.addEventListener("click", () => {
        set(caosEmoClamp(get() + delta));
        caosLog("sandbox", `${label} ${delta > 0 ? "+" : ""}${delta}`);
        caosEmoHistSample("sandbox");
        caosCutucado(
          ({ Tensão: "tensao", Calor: "calor", Paciência: "paciencia" }[label] || "geral") + (delta > 0 ? "+" : "-"),
        );
        onChange();
      });
      row.appendChild(b);
    });
    boxS.appendChild(row);
    return boxS;
  };
  g.appendChild(
    mkStepper(
      "Tensão",
      () => caosEmo.tensao,
      (v) => (caosEmo.tensao = v),
      1.5,
      "#9b1c3f",
      "#2d6b4f",
    ),
  );
  g.appendChild(
    mkStepper(
      "Calor",
      () => caosEmo.calor,
      (v) => (caosEmo.calor = v),
      2,
      "#9a6a08",
      "#34465a",
    ),
  );
  g.appendChild(
    mkStepper(
      "Paciência",
      () => caosEmo.paciencia ?? 7,
      (v) => (caosEmo.paciencia = v),
      1,
      "#2d7d8f",
      "#7a4f26",
    ),
  );
  sec1.appendChild(g);
  wrap.appendChild(sec1);
  const sec2 = ciSecao("🧪 Forçar (teste)");
  const mkSelect = (rotulo, opcoes, atual, aoMudar) => {
    const d = document.createElement("label");
    d.className = "ci-field";
    d.textContent = rotulo;
    const s = document.createElement("select");
    s.className = "ci-input";
    opcoes.forEach(([v, t]) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = t;
      s.appendChild(o);
    });
    s.value = atual || "";
    s.addEventListener("change", () => {
      aoMudar(s.value || null);
      caosCutucado(!s.value ? "normal" : /matriz/.test(rotulo) ? "humor" : "ritmo");
      onChange();
    });
    d.appendChild(s);
    return d;
  };
  sec2.appendChild(
    mkSelect(
      "Ritmo da partida (caosMood)",
      [
        ["", "(real)"],
        ["animado", "animado"],
        ["normal", "normal"],
        ["esquentou", "esquentou"],
        ["impaciente", "impaciente"],
        ["cansado", "cansado"],
      ],
      caosMoodOverride,
      (v) => {
        caosMoodOverride = v;
      },
    ),
  );
  sec2.appendChild(
    mkSelect(
      "Humor da matriz",
      [
        ["", "(real)"],
        ["frustrado", "😤 frustrado"],
        ["orgulhoso", "👑 orgulhoso"],
        ["entediado", "🥱 entediado"],
        ["desafiante", "⚡ desafiante"],
      ],
      caosHumorOverride,
      (v) => {
        caosHumorOverride = v;
      },
    ),
  );
  const mkBtn = (label, fn) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ci-btn ci-btn-gold ci-wide";
    b.textContent = label;
    b.addEventListener("click", () => {
      fn();
      onChange();
    });
    return b;
  };
  sec2.appendChild(mkBtn("🎯 Sortear jogador marcado agora", () => caosV2PickMarked()));
  sec2.appendChild(
    mkBtn("😤 Forçar saída da partida (checkout)", () => {
      caosCutucado("saida");
      caosCheckOut();
    }),
  );
  if (players.length) {
    const sel = document.createElement("select");
    sel.className = "ci-input";
    players.forEach((p, i) => {
      const o = document.createElement("option");
      o.value = i;
      o.textContent = p.name;
      sel.appendChild(o);
    });
    const row = document.createElement("div");
    row.className = "ci-grid2 ci-tight";
    [
      ["✅ Simular acerto", true, "#2d7d4f"],
      ["❌ Simular erro", false, "#b3344d"],
    ].forEach(([txt, ok, cor]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ci-step";
      b.textContent = txt;
      b.style.background = cor;
      b.addEventListener("click", () => {
        caosMemRecord(parseInt(sel.value, 10), ok);
        caosLog("sandbox", `${players[parseInt(sel.value, 10)].name}: ${ok ? "acerto" : "erro"} simulado`);
        caosCutucado("simular");
        onChange();
      });
      row.appendChild(b);
    });
    const lbl = document.createElement("div");
    lbl.className = "ci-note";
    lbl.textContent = "Simular resultado na memória curta (sem jogar a carta):";
    sec2.append(lbl, sel, row);
  }
  wrap.appendChild(sec2);
  const sec3 = ciSecao("🎬 Cenários especiais");
  const prev = document.createElement("div");
  prev.className = "ci-preview";
  prev.textContent = "Toque num cenário pra ver (e ouvir) uma fala de exemplo.";
  const nome = players.length ? players[0].name : "Fulano";
  const J = REACTIVE_VOICE.jogadorArtificial || {};
  const CEN = [
    [
      "Surpresa: acerto em carta difícil",
      "fala + calor sobe",
      () => {
        caosEmoNudge(-0.5, 1.5);
        return ciAmostra(REACTIVE_VOICE.surpresaAcertoDificil, nome);
      },
    ],
    [
      "Surpresa: erro em carta fácil",
      "fala + tensão sobe",
      () => {
        caosEmoNudge(1.5, -0.5);
        return ciAmostra(REACTIVE_VOICE.surpresaErroFacil, nome);
      },
    ],
    [
      "Quebra de sequência",
      "quem vinha acertando errou",
      () => {
        caosEmoNudge(1, 0);
        return ciAmostra(REACTIVE_VOICE.erroQuebraSequencia, nome, 3);
      },
    ],
    ["Jogador artificial", '"eu já sei quem é"', () => ciAmostra(J.jaSei, 4)],
    ["Dossiê: estilo impulsivo", "arquétipo do jogador", () => ciAmostra(J.arquetipos && J.arquetipos.impulsivo, nome)],
    [
      "Humor atual da matriz",
      "fala do humor + voz",
      () => ciAmostra(REACTIVE_VOICE.matrizHumor && REACTIVE_VOICE.matrizHumor[caosHumorMatriz() || "desafiante"]),
    ],
  ];
  const g4 = document.createElement("div");
  g4.className = "ci-grid2";
  CEN.forEach(([t, s, fn]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ci-scen";
    b.innerHTML = `<b>${t}</b><span>${s}</span>`;
    b.addEventListener("click", () => {
      const txt = fn() || "(banco vazio)";
      caosLog("sandbox", `cenário: ${t}`);
      caosEmoHistSample("sandbox");
      prev.textContent = txt;
      const ligada = caosVoiceOn;
      caosVoiceOn = true;
      try {
        caosSpeak(txt, caosHumorMatriz() || void 0);
      } finally {
        caosVoiceOn = ligada;
      }
      const est = wrap.querySelector(".ci-sandbox-state");
      if (est)
        est.textContent = `tensão ${ciNum(caosEmo.tensao, 0)} · calor ${ciNum(caosEmo.calor, 0)} · humor ${caosHumorMatriz() || "neutro"}`;
    });
    g4.appendChild(b);
  });
  sec3.appendChild(g4);
  sec3.insertAdjacentHTML(
    "beforeend",
    `<div class="ci-note ci-sandbox-state">tensão ${ciNum(caosEmo.tensao, 0)} · calor ${ciNum(caosEmo.calor, 0)} · humor ${caosHumorMatriz() || "neutro"}</div>`,
  );
  sec3.appendChild(prev);
  wrap.appendChild(sec3);
  return wrap;
}
function caosInspectorFalas() {
  const wrap = document.createElement("div");
  const sec = ciSecao("📊 Diagnóstico das falas (entre partidas, neste aparelho)");
  const pre = document.createElement("pre");
  pre.className = "ci-pre";
  pre.textContent = caosDiagText();
  sec.appendChild(pre);
  wrap.appendChild(sec);
  const secK = ciSecao("🔑 Chave do criador");
  let propria = null;
  try {
    propria = JFStore.getItem(CAOS_CHAVE_KEY);
  } catch (e) {}
  secK.insertAdjacentHTML(
    "beforeend",
    `<div class="ci-note">${propria ? "Este aparelho usa uma chave própria (as padrão não abrem mais aqui)." : "Este aparelho usa as chaves padrão."} A chave fica salva só neste aparelho. Se esquecer a chave própria, apagar os dados do site volta pras padrão.</div>`,
  );
  const b = document.createElement("button");
  b.type = "button";
  b.className = "ci-btn ci-btn-gold ci-wide";
  b.textContent = "🔑 Trocar a chave";
  b.addEventListener("click", () => {
    caosPromptModal("Nova chave (mínimo 4 caracteres, maiúsculas e minúsculas contam igual):", "", (k1) => {
      if (k1 === null) return;
      if (k1.trim().length < 4) {
        caosAvisoModal("Chave curta demais — use pelo menos 4 caracteres.");
        return;
      }
      caosPromptModal("Digite a nova chave de novo pra confirmar:", "", (k2) => {
        if (k2 === null) return;
        if (k1.trim().toUpperCase() !== k2.trim().toUpperCase()) {
          caosAvisoModal("As duas não bateram. Nada mudou.");
          return;
        }
        try {
          JFStore.setItem(CAOS_CHAVE_KEY, caosChaveHash(k1));
          caosAvisoModal("✅ Chave trocada neste aparelho.");
          caosLog("acesso", "chave própria definida");
        } catch (e) {
          caosAvisoModal("Não deu pra salvar a chave neste aparelho.");
        }
      });
    });
  });
  secK.appendChild(b);
  if (propria) {
    const r = document.createElement("button");
    r.type = "button";
    r.className = "ci-btn ci-wide";
    r.textContent = "↩️ Voltar pras chaves padrão";
    r.addEventListener("click", () => {
      caosConfirmarModal("Apagar a chave própria e voltar pras padrão?", "Apagar", "Cancelar", () => {
        try {
          JFStore.removeItem ? JFStore.removeItem(CAOS_CHAVE_KEY) : JFStore.setItem(CAOS_CHAVE_KEY, "");
        } catch (e) {}
        caosLog("acesso", "voltou pras chaves padrão");
        caosAvisoModal("Pronto: voltaram as chaves padrão.");
      });
    });
    secK.appendChild(r);
  }
  wrap.appendChild(secK);
  return wrap;
}
function caosKnownNames() {
  try {
    const o = JSON.parse(JFStore.getItem(CAOS_NAMES_KEY) || "{}");
    return o && typeof o === "object" ? o : {};
  } catch (e) {
    return {};
  }
}
function caosTimesSeen(name) {
  return caosKnownNames()[nameKeyPlain(name)] || 0;
}
function caosRememberPlayers() {
  try {
    const o = caosKnownNames();
    players.forEach((p) => {
      const k = nameKeyPlain(p.name);
      if (k && !p.nickEmprestado) o[k] = (o[k] || 0) + 1;
    });
    const keys = Object.keys(o);
    if (keys.length > 60) keys.slice(0, keys.length - 60).forEach((k) => delete o[k]);
    JFStore.setItem(CAOS_NAMES_KEY, JSON.stringify(o));
  } catch (e) {}
}
function caosMemCadastro(p) {
  if (!p) return;
  if (nickEmprestadoAtual && nameKeyPlain(nickEmprestadoAtual) === nameKeyPlain(p.name)) p.nickEmprestado = true;
  nickEmprestadoAtual = null;
  if (!memContaFicha(p)) return;
  p._fichaAntes = fichaGet(p.name);
  fichaUpd(p.name, (f) => {
    f.ultimaVez = Date.now();
  });
}
function caosMemBoasVindas(p, n) {
  const f = p._fichaAntes,
    M = REACTIVE_VOICE.memoria,
    R = Math.random,
    name = p.name;
  if (!f) return null;
  const opcoes = [];
  if (f.ultimaVez > 0) {
    const ms = Date.now() - f.ultimaVez;
    const b = ms < 864e5 ? M.reencontro.hoje : ms < 14 * 864e5 ? M.reencontro.dias : M.reencontro.muitoTempo;
    opcoes.push({ w: 40, bank: b, args: [name, memTempoDesde(ms)] });
  }
  if (f.ultimoResultado === "venceu" && f.partidas >= 1)
    opcoes.push({ w: 25, bank: M.venceuUltima, args: [name, memModoNome(f.ultimoModo)] });
  if (f.absurdos > 0) opcoes.push({ w: 18, bank: REACTIVE_VOICE.mesa.absurdoAntigo, args: [name, f.absurdos] });
  if (f.partidas >= 4 && f.vitorias >= 1)
    opcoes.push({ w: 15, bank: M.veterano, args: [name, f.vitorias, f.partidas] });
  const forte = MEM_CATS.map((c) => ({ c, ...fichaTaxa(f, c) }))
    .filter((x) => x.n >= 5)
    .sort((a, b) => b.taxa - a.taxa)[0];
  if (forte && forte.taxa >= 0.6)
    opcoes.push({
      w: 15,
      bank: M.categoria.forteCadastro,
      args: [name, caosCategoryLabel(forte.c), memPct(forte.taxa)],
    });
  if (!opcoes.length) return null;
  const tot = opcoes.reduce((s, o) => s + o.w, 0);
  let r = R() * tot;
  for (const o of opcoes) {
    r -= o.w;
    if (r <= 0) return o;
  }
  return opcoes[0];
}
function caosMemAcerto(idx, dicas, ms) {
  const p = players[idx];
  if (!p || !currentCard) return;
  const cat = gemCategoryFor(currentCard.category);
  if (memContaFicha(p))
    fichaUpd(p.name, (f) => {
      f.acertos++;
      const a = f.cat[cat] || [0, 0];
      a[0]++;
      a[1]++;
      f.cat[cat] = a;
      if (typeof ms === "number" && ms > 0 && ms < 6e5) {
        f.msSum += ms;
        f.msN++;
      }
      if (dicas === 1) f.primeiraDica++;
    });
  if (CURRENT_MODE !== "express" && !currentCard.isBonus) {
    const sofrido = CURRENT_MODE === "hardcore" ? 8 : 14;
    if (dicas <= 2)
      caosMomentos.push({
        tipo: "golaco",
        nome: p.name,
        carta: stats.totalDrawn,
        resp: currentCard.answer,
        dicas,
        usado: false,
      });
    else if (dicas >= sofrido)
      caosMomentos.push({
        tipo: "sofrido",
        nome: p.name,
        carta: stats.totalDrawn,
        resp: currentCard.answer,
        dicas,
        usado: false,
      });
  }
  const msgs = [];
  if (CURRENT_MODE !== "express" && typeof ms === "number" && ms >= 1500) {
    const m = caosRecordeTentar("rapido", ms, true, { nome: p.name, resp: currentCard.answer });
    if (m && m.antes.data < caosMemPartidaInicio && caosOncePerMatch("rec_rapido"))
      msgs.push(getRandomReaction(REACTIVE_VOICE.recorde.rapido, p.name, memSeg(ms), memSeg(m.antes.v), m.antes.nome));
  }
  if (streakScorerIdx === idx && streakCount >= 3) {
    const m = caosRecordeTentar("sequencia", streakCount, false, { nome: p.name });
    if (m && m.antes.data < caosMemPartidaInicio && caosOncePerMatch("rec_seq"))
      msgs.push(
        getRandomReaction(
          REACTIVE_VOICE.recorde.sequencia,
          p.name,
          streakCount,
          m.antes ? m.antes.v : "",
          m.antes ? m.antes.nome : "",
        ),
      );
  }
  if (msgs[0]) caosFalarDepois(msgs[0]);
}
function caosMemErro(idx) {
  const p = players[idx];
  if (!p || !currentCard || !memContaFicha(p)) return;
  const cat = gemCategoryFor(currentCard.category);
  fichaUpd(p.name, (f) => {
    f.erros++;
    const a = f.cat[cat] || [0, 0];
    a[1]++;
    f.cat[cat] = a;
  });
}
function caosFalarDepois(msg) {
  if (!msg) return;
  const ser = caosPartidaSerial;
  if (activeToastState && activeToastState.priority)
    activeToastState.deferred.push(() => {
      if (ser === caosPartidaSerial) showToastMessage(msg);
    });
  else
    setTimeout(() => {
      if (ser === caosPartidaSerial) showToastMessage(msg);
    }, 120);
}
function caosRecordeTentar(tipo, v, menorMelhor, extra) {
  const o = memLer(MEM_RECORDES_KEY, {});
  const atual =
    o[tipo] && typeof o[tipo].v === "number"
      ? { ...o[tipo], data: memNum(o[tipo].data, 0), nome: String(o[tipo].nome || "?") }
      : null;
  const bateu = !atual || (menorMelhor ? v < atual.v : v > atual.v);
  if (!bateu) return null;
  o[tipo] = {
    v,
    nome: String(extra.nome || "").slice(0, 15),
    resp: extra.resp ? String(extra.resp).slice(0, 60) : void 0,
    modo: CURRENT_MODE,
    data: Date.now(),
  };
  memGravar(MEM_RECORDES_KEY, o);
  if (!caosRecordesNovos.includes(tipo)) caosRecordesNovos.push(tipo);
  caosLog(
    "recorde",
    `${tipo}: ${v} (${extra.nome})${atual ? " — antes " + atual.v + " (" + atual.nome + ")" : " — primeiro registro"}`,
  );
  return atual ? { antes: atual } : null;
}
function caosRivalChave(a, b) {
  return [nameKeyPlain(a), nameKeyPlain(b)].sort().join("|");
}
function caosRivalTroca(novoIdx, antigoIdx) {
  const a = players[novoIdx],
    b = players[antigoIdx];
  if (!a || !b || a === b || CURRENT_FORMAT === "equipe") return null;
  const k = caosRivalChave(a.name, b.name);
  const n = (caosRivalPartida[k] || 0) + 1;
  caosRivalPartida[k] = n;
  const o = memLer(MEM_RIVAIS_KEY, {});
  const r = o[k] && typeof o[k] === "object" ? o[k] : { n: 0 };
  r.n = memNum(r.n, 0) + 1;
  r.a = String(a.name).slice(0, 15);
  r.b = String(b.name).slice(0, 15);
  delete o[k];
  o[k] = r;
  const ks = Object.keys(o);
  if (ks.length > 60) ks.slice(0, ks.length - 60).forEach((x) => delete o[x]);
  memGravar(MEM_RIVAIS_KEY, o);
  caosMomentos.push({ tipo: "virada", nome: a.name, outro: b.name, carta: stats.totalDrawn, usado: false });
  const RV = REACTIVE_VOICE.memoria.rival;
  if (n === 2 && caosOncePerMatch("rival_" + k)) return getRandomReaction(RV.classico, a.name, b.name, r.n);
  if (n >= 3 && Math.random() < 0.35) return getRandomReaction(RV.denovo, a.name, b.name, n);
  return null;
}
function caosMemoriaNaDica() {
  if (caosSilenced || CURRENT_MODE === "express" || !currentCard || currentCard.isBonus) return false;
  if (revealedOrder.filter((r) => r.item.type === "clue").length !== 1) return false;
  if (caosFalasUltimos(4e4) >= 2) return false;
  const p = players[responderIndex];
  if (!p || p.iniciante) return false;
  const R = Math.random,
    M = REACTIVE_VOICE.memoria,
    fator = caosOS() ? 0.6 : 1;
  {
    const ab = memLer(MEM_CARTAS_ABSURDO_KEY, {})[String(currentCard.answer).slice(0, 60)];
    if (
      ab &&
      memNum(ab.data, 0) < caosMemPartidaInicio &&
      R() < 0.5 &&
      caosOncePerMatch("absurdo_carta_" + currentCard.answer)
    ) {
      showToastMessage(getRandomReaction(REACTIVE_VOICE.mesa.cartaAbsurdo));
      return true;
    }
  }
  {
    const pm = caosCerebroPremonicao(p);
    if (pm) {
      showToastMessage(pm);
      return true;
    }
  }
  const mom = caosMomentos.filter((m) => !m.usado && m.nome === p.name && stats.totalDrawn - m.carta >= 3);
  if (mom.length && R() < 0.11 * fator) {
    const m = mom[Math.floor(R() * mom.length)];
    m.usado = true;
    if (m.tipo === "sofrido" && playerHumor(p) === "suave" && R() < 0.5) return false;
    const msg2 =
      m.tipo === "virada"
        ? getRandomReaction(M.callback.virada, p.name, m.outro)
        : getRandomReaction(M.callback[m.tipo], p.name, m.resp, m.dicas);
    if (msg2) {
      caosLog("memoria", `callback ${m.tipo}: ${p.name}`);
      showToastMessage(msg2);
      return true;
    }
  }
  if (caosMemCatFalou[p.name] || !memContaFicha(p)) return false;
  const f = fichaGet(p.name);
  if (!f) return false;
  const cat = gemCategoryFor(currentCard.category),
    t = fichaTaxa(f, cat);
  if (t.n < 5 || (t.taxa > 0.25 && t.taxa < 0.6) || R() >= 0.12 * fator) return false;
  if (t.taxa <= 0.25 && playerHumor(p) === "suave" && R() < 0.5) return false;
  caosMemCatFalou[p.name] = true;
  const msg = getRandomReaction(
    t.taxa >= 0.6 ? M.categoria.forte : M.categoria.fraco,
    p.name,
    caosCategoryLabel(cat),
    memPct(t.taxa),
    t.n,
  );
  if (msg) {
    caosLog("memoria", `categoria ${cat}: ${p.name} ${memPct(t.taxa)} de ${t.n}`);
    showToastMessage(msg);
    return true;
  }
  return false;
}
function caosBolaPeso(i) {
  const p = players[i];
  if (!p || !currentCard || !memContaFicha(p)) return 1;
  const t = fichaTaxa(fichaGet(p.name), gemCategoryFor(currentCard.category));
  return t.n >= 3 ? 0.4 + t.taxa * 2 : 1;
}
function caosBolaRegistrar(ok) {
  const o = memLer(MEM_BOLA_KEY, {});
  o.t = memNum(o.t, 0) + 1;
  o.a = memNum(o.a, 0) + (ok ? 1 : 0);
  memGravar(MEM_BOLA_KEY, o);
  if (o.t < 5 || Math.random() >= 0.5) return "";
  return (
    " " +
    getRandomReaction(
      ok ? REACTIVE_VOICE.memoria.bolaTaxa.acerto : REACTIVE_VOICE.memoria.bolaTaxa.erro,
      o.a,
      o.t,
      memPct(o.a / o.t),
    )
  );
}
function caosMemInicioTexto() {
  const M = REACTIVE_VOICE.memoria,
    R = Math.random,
    opcoes = [];
  const u = memLer(MEM_ULTIMA_KEY, null);
  const naMesa = new Set(players.filter(memContaFicha).map((p) => nameKeyPlain(p.name)));
  if (
    u &&
    memNum(u.data, 0) > 0 &&
    Date.now() - u.data < 14 * 864e5 &&
    Array.isArray(u.jogadores) &&
    u.jogadores.some((k) => naMesa.has(k))
  ) {
    if (u.saiu) opcoes.push(getRandomReaction(M.ultimaPartida.saiu));
    const cortador =
      typeof u.cortador === "string" ? players.find((p) => nameKeyPlain(p.name) === nameKeyPlain(u.cortador)) : null;
    if (memNum(u.cortes, 0) >= 3 && cortador && playerHumor(cortador) !== "suave")
      opcoes.push(getRandomReaction(M.ultimaPartida.cortes, cortador.name, u.cortes));
    const venc =
      typeof u.vencedor === "string"
        ? players.find((p) => nameKeyPlain(p.name) === nameKeyPlain(u.vencedor) && memContaFicha(p))
        : null;
    if (venc && players.length >= 2) opcoes.push(getRandomReaction(M.ultimaPartida.vencedor, venc.name));
  }
  if (CURRENT_FORMAT !== "equipe") {
    const o = memLer(MEM_RIVAIS_KEY, {});
    const pares = [];
    for (let i = 0; i < players.length; i++)
      for (let j = i + 1; j < players.length; j++) {
        if (!memContaFicha(players[i]) || !memContaFicha(players[j])) continue;
        const r = o[caosRivalChave(players[i].name, players[j].name)];
        if (r && memNum(r.n, 0) >= 3) pares.push({ a: players[i].name, b: players[j].name, n: r.n });
      }
    if (pares.length) {
      const x = pares.sort((a, b) => b.n - a.n)[0];
      opcoes.push(getRandomReaction(M.rival.inicio, x.a, x.b, x.n));
    }
  }
  const ok = opcoes.filter(Boolean);
  return ok.length ? ok[Math.floor(R() * ok.length)] : "";
}
function caosMemTemInicio() {
  try {
    return !!caosMemInicioTexto();
  } catch (e) {
    return false;
  }
}
function caosVencedoresIdx() {
  if (!players.length) return [];
  if (gemWinner && gemWinner.kind === "player" && players[gemWinner.id]) return [gemWinner.id];
  if (CURRENT_FORMAT === "equipe") {
    let alvo = null;
    if (gemWinner && gemWinner.kind === "team") alvo = gemWinner.id;
    else {
      const tv = (id) => rankValue(teams[id], id);
      const top2 = Math.max(...teamOrder.map(tv));
      const t2 = teamOrder.filter((id) => tv(id) === top2);
      if (t2.length === 1 && top2 > 0) alvo = t2[0];
    }
    return alvo ? players.map((p, i) => i).filter((i) => players[i].team === alvo) : [];
  }
  const top = Math.max(...players.map((p) => rankValue(p)));
  const t = players.map((p, i) => i).filter((i) => rankValue(players[i]) === top);
  return t.length === 1 && top > 0 ? t : [];
}
function caosMemFimDePartida() {
  if (caosMemFimFeito || !players.length) return;
  caosMemFimFeito = true;
  if (stats.totalDrawn < 5) return;
  caosMagoaFim();
  const venc = caosVencedoresIdx();
  const lanterna =
    CURRENT_FORMAT !== "equipe" && players.length >= 3
      ? (() => {
          const low = Math.min(...players.map((p) => rankValue(p)));
          const l = players.map((p, i) => i).filter((i) => rankValue(players[i]) === low);
          return l.length === 1 ? l[0] : -1;
        })()
      : -1;
  players.forEach((p, i) => {
    if (!memContaFicha(p)) return;
    fichaUpd(p.name, (f) => {
      f.partidas++;
      if (venc.includes(i)) f.vitorias++;
      f.melhorPts = Math.max(f.melhorPts, memNum(p.score, 0));
      f.joias += Object.values(p.gems || {}).reduce((s, n) => s + (Number(n) || 0), 0);
      f.ultimoResultado = venc.includes(i) ? "venceu" : i === lanterna ? "lanterna" : "meio";
      f.ultimoModo = CURRENT_MODE;
      f.ultimaVez = Date.now();
    });
  });
  let recMsg = "";
  if (CURRENT_FORMAT !== "equipe") {
    const best = players.reduce((a, b) => (b.score > a.score ? b : a), players[0]);
    if (best && best.score > 0) {
      const m = caosRecordeTentar("pontuacao_" + CURRENT_MODE, best.score, false, { nome: best.name });
      if (m && m.antes.data < caosMemPartidaInicio)
        recMsg = getRandomReaction(
          REACTIVE_VOICE.recorde.pontuacao,
          best.name,
          best.score,
          m.antes.v,
          m.antes.nome,
          memModoNome(CURRENT_MODE),
        );
    }
  }
  const cortes = Object.entries(caosCortes.por || {}).sort((a, b) => b[1] - a[1])[0];
  memGravar(MEM_ULTIMA_KEY, {
    data: Date.now(),
    saiu: !!caosSilenced,
    cortes: memNum(caosCortes.total, 0),
    cortador: cortes ? String(cortes[0]).slice(0, 15) : null,
    vencedor: venc.length === 1 && memContaFicha(players[venc[0]]) ? String(players[venc[0]].name).slice(0, 15) : null,
    jogadores: players.filter(memContaFicha).map((p) => nameKeyPlain(p.name)),
    modo: CURRENT_MODE,
  });
  if (recMsg)
    setTimeout(() => {
      if (gameEnded) showToastMessage(recMsg, null, true);
    }, 9e3);
}
function caosMemResetPartida() {
  caosMomentos = [];
  caosRivalPartida = {};
  caosMemCatFalou = {};
  caosRecordesNovos = [];
  caosMemFimFeito = false;
  caosMemPartidaInicio = Date.now();
}
function caosMesaReset() {
  caosPartidaInicioAt = null;
  caosPausaAcum = 0;
  caosPartidaFimAt = null;
  caosResenhaTxt = null;
  caosMesa = {
    pulos: 0,
    absurdos: 0,
    pulosPor: {},
    absurdosPor: {},
    puloSeq: 0,
    ultAcao: {},
    tilt: {},
    alvos: {},
    dm: {},
    diag: {},
    absCat: {},
    precoce: {},
    falso: 0,
    ultErro: null,
  };
  caosAposta = null;
}
function caosMesaLimpa(m) {
  const num = (v) => (typeof v === "number" && isFinite(v) && v >= 0 ? Math.floor(v) : 0);
  const mapa = (o) => {
    const r = {};
    if (o && typeof o === "object")
      Object.keys(o)
        .slice(0, 12)
        .forEach((k) => {
          r[String(k).slice(0, 15)] = num(o[k]);
        });
    return r;
  };
  const t = m && typeof m === "object" ? m : {};
  const mapaN = (o, lim) => {
    const r = {};
    if (o && typeof o === "object")
      Object.keys(o)
        .slice(0, lim)
        .forEach((k) => {
          r[String(k).slice(0, 40)] = num(o[k]);
        });
    return r;
  };
  return {
    pulos: num(t.pulos),
    absurdos: num(t.absurdos),
    pulosPor: mapa(t.pulosPor),
    absurdosPor: mapa(t.absurdosPor),
    puloSeq: num(t.puloSeq),
    ultAcao: {},
    tilt: {},
    alvos: mapa(t.alvos),
    dm: mapaN(t.dm, 400),
    diag: mapaN(t.diag, 60),
    absCat: mapaN(t.absCat, 60),
    precoce: mapa(t.precoce),
    falso: 0,
    ultErro: null,
  };
}
function caosMesaRegistrar(tipo, p) {
  if (!p) return;
  caosCerebroRegistrar(tipo, p);
  const nome = p.name;
  if (tipo === "pular") {
    caosMesa.pulos++;
    caosMesa.pulosPor[nome] = (caosMesa.pulosPor[nome] || 0) + 1;
    caosMesa.puloSeq++;
  } else caosMesa.puloSeq = 0;
  if (tipo === "absurdo") {
    caosMesa.absurdos++;
    caosMesa.absurdosPor[nome] = (caosMesa.absurdosPor[nome] || 0) + 1;
    if (memContaFicha(p))
      fichaUpd(nome, (f) => {
        f.absurdos = (f.absurdos || 0) + 1;
      });
    if (caosMesa.absCartaSeq !== cartaSeq) {
      caosMesa.absCartaSeq = cartaSeq;
      caosMesa.absCartaN = 0;
    }
    caosMesa.absCartaN++;
    if (caosMesa.absCartaN === 3 && players[mestreIndex] && caosOncePerMatch("abs3_" + cartaSeq))
      caosFalaAgendar(
        () => getRandomReaction(REACTIVE_VOICE.absurdoTresMestre, players[mestreIndex].name),
        700,
        "media",
      );
    if (currentCard && currentCard.answer) {
      const o = memLer(MEM_CARTAS_ABSURDO_KEY, {});
      const k = String(currentCard.answer).slice(0, 60);
      o[k] = { n: memNum(o[k] && o[k].n, 0) + 1, data: Date.now() };
      const ks = Object.keys(o);
      if (ks.length > 150) ks.slice(0, ks.length - 150).forEach((x) => delete o[x]);
      memGravar(MEM_CARTAS_ABSURDO_KEY, o);
    }
    caosLog("mesa", `🤦 Absurdo de ${nome} (${caosMesa.absurdosPor[nome]}º na partida)`);
  }
  if (tipo === "acerto") caosMesa.ultimoAcertoFofo = AVATARS_KIDS.includes(p.avatar) ? nome : null;
  caosMesa.antes = caosMesa.ultAcao[nome] || null;
  caosMesa.ultAcao[nome] = tipo || "erro";
}
function caosMesaFala(tipo, p) {
  if (!p || caosSilenced) return "";
  const M = REACTIVE_VOICE.mesa,
    suave = playerHumor(p) === "suave" || p.iniciante || CURRENT_MODE === "junior";
  if (tipo === "absurdo") {
    {
      const mm = players[mestreIndex];
      if (
        caosMesa.absCartaN >= 3 &&
        caosMesa.absCartaSeq === cartaSeq &&
        mm &&
        playerHumor(mm) !== "suave" &&
        caosOncePerMatch("ditador_" + mm.name)
      )
        return getRandomReaction(REACTIVE_VOICE.juizMestre.ditador, mm.name);
    }
    const q = caosMesa.absurdosPor[p.name] || 1;
    if (suave) return Math.random() < 0.85 ? getRandomReaction(M.absurdoSuave, p.name) : "";
    if (q === 3) return getRandomReaction(M.desacreditado, p.name);
    if (q === 2 && Math.random() < 0.6) return getRandomReaction(M.absurdoSegundo, p.name);
    return Math.random() < (caosOS() ? 0.75 : 0.95) ? getRandomReaction(M.absurdo, p.name) : "";
  }
  if (tipo === "pular") {
    if (caosMesa.puloSeq >= 3 && caosOncePerMatch("mesa_silencio_" + stats.totalDrawn))
      return getRandomReaction(M.silencio);
    if (suave || caosFalasUltimos(45e3) >= 2) return "";
    return Math.random() < (playerHumor(p) === "zero" ? 0.6 : caosOS() ? 0.18 : 0.3)
      ? (Math.random() < 0.5 && caosGerar("pular", p, {})) || getRandomReaction(M.pular, p.name)
      : "";
  }
  return "";
}
function caosMesaMista() {
  if (CURRENT_MODE === "junior" || CURRENT_FORMAT === "equipe") return false;
  const k = players.filter((p) => AVATARS_KIDS.includes(p.avatar)).length;
  return k >= 1 && k < players.length;
}
function caosMesaErroNormal(p, ms) {
  if (!p || p.iniciante) return "";
  {
    const mm = players[mestreIndex];
    if (
      cardWrongCount >= 5 &&
      !(caosMesa.absCartaSeq === cartaSeq && caosMesa.absCartaN > 0) &&
      caosCerebroOrdem() >= 12 &&
      mm &&
      mm !== p &&
      playerHumor(mm) !== "suave" &&
      Math.random() < 0.35 &&
      caosOncePerMatch("mae_" + mm.name)
    )
      return getRandomReaction(REACTIVE_VOICE.juizMestre.mae, mm.name);
  }
  const M = REACTIVE_VOICE.mesa;
  if (caosMesaMista()) {
    if (AVATARS_KIDS.includes(p.avatar)) {
      if (Math.random() < 0.35) return getRandomReaction(M.fofinho, p.name);
    } else if (
      caosMesa.ultimoAcertoFofo &&
      caosMesa.ultimoAcertoFofo !== p.name &&
      playerHumor(p) !== "suave" &&
      Math.random() < 0.3
    ) {
      const k = caosMesa.ultimoAcertoFofo;
      caosMesa.ultimoAcertoFofo = null;
      return getRandomReaction(M.carrasco, p.name, k);
    }
  }
  if (playerHumor(p) === "suave") return "";
  if (caosMesa.antes === "pular" && typeof ms === "number" && ms < 3e3 && !caosMesa.tilt[p.name]) {
    caosMesa.tilt[p.name] = 1;
    caosLog("mesa", `tilt: ${p.name}`);
    return getRandomReaction(M.tilt, p.name);
  }
  if ((caosMesa.absurdosPor[p.name] || 0) >= 3 && Math.random() < 0.35)
    return getRandomReaction(M.desacreditadoErro, p.name);
  return "";
}
function caosMesaMimica(restoMs, scorer, mestre) {
  if (caosSilenced || !scorer || !mestre || scorer === mestre || restoMs === null || restoMs > 2500 || restoMs < 0)
    return;
  if (playerHumor(mestre) === "suave" || Math.random() >= 0.5) return;
  caosFalarDepois(getRandomReaction(REACTIVE_VOICE.mesa.mimica, mestre.name, scorer.name));
}
function caosMesaCulpaMestre() {
  const m = players[mestreIndex];
  if (!m || CURRENT_MODE === "express" || playerHumor(m) === "suave" || m.iniciante || Math.random() >= 0.15) return "";
  return getRandomReaction(REACTIVE_VOICE.mesa.culpaMestre, m.name);
}
function caosMesaAlvo(quemIdx, alvoIdx, amount) {
  const a = players[quemIdx],
    b = players[alvoIdx];
  if (!a || !b || a === b || amount >= 0 || caosSilenced) return;
  const k = a.name + "→" + b.name;
  caosMesa.alvos[k] = (caosMesa.alvos[k] || 0) + 1;
  {
    const cm = caosCasalEspecial(quemIdx, alvoIdx);
    if (cm) {
      caosFalarDepois(cm);
      return;
    }
  }
  if (caosMesa.alvos[k] === 2 && caosOncePerMatch("rival_esp_" + k))
    caosFalarDepois(getRandomReaction(REACTIVE_VOICE.mesa.rivalEspecial, a.name, b.name));
}
function caosMesaNaCarta() {
  if (caosSilenced || CURRENT_MODE === "express" || CURRENT_FORMAT === "equipe" || players.length < 3) return false;
  const M = REACTIVE_VOICE.mesa,
    W = WINNING_SCORE || 200;
  const lider = players.reduce((best, p) => (rankValue(p) > rankValue(best) ? p : best), players[0]);
  if (
    !caosAposta &&
    stats.totalDrawn >= 8 &&
    (rankValue(lider) >= W * 0.35 || stats.totalDrawn >= 14) &&
    caosOncePerMatch("aposta")
  ) {
    const cand = [...players].sort(
      (x, y) =>
        rankValue(y) - rankValue(x) ||
        ((fichaGet(y.name) || {}).vitorias || 0) - ((fichaGet(x.name) || {}).vitorias || 0),
    );
    caosAposta = { nome: cand[0].name, carta: stats.totalDrawn };
    caosLog("mesa", `aposta secreta: ${cand[0].name} (carta ${stats.totalDrawn})`);
    showToastMessage(getRandomReaction(M.apostaFeita));
    return true;
  }
  if (typeof palpiteHolders === "object" && rankValue(lider) >= W * 0.75) {
    const donoIdx = Object.keys(palpiteHolders)
      .map(Number)
      .find((i) => palpiteHolders[i] > 0 && players[i]);
    if (
      donoIdx !== void 0 &&
      playerHumor(players[donoIdx]) !== "suave" &&
      Math.random() < 0.6 &&
      caosOncePerMatch("fantasma")
    ) {
      showToastMessage(getRandomReaction(M.fantasma, players[donoIdx].name));
      return true;
    }
  }
  return false;
}
function caosMesaRevelaAposta() {
  if (!caosAposta || !players.length) return;
  const venc = caosVencedoresIdx();
  if (venc.length !== 1) return;
  const v = players[venc[0]].name,
    ok = nameKeyPlain(v) === nameKeyPlain(caosAposta.nome);
  const msg = ok
    ? getRandomReaction(REACTIVE_VOICE.mesa.apostaAcertou, caosAposta.nome, caosAposta.carta)
    : getRandomReaction(REACTIVE_VOICE.mesa.apostaErrou, caosAposta.nome, caosAposta.carta, v);
  setTimeout(() => {
    if (gameEnded) showToastMessage(msg, null, true);
  }, 6500);
}
function caosPerfilAvatar(p) {
  if (!p || p.iniciante || CURRENT_MODE === "junior") return null;
  const h = playerHumor(p),
    a = p.avatar;
  if (CAOS_AVATAR_TIPO.fofo.has(a) && (h === "acido" || h === "zero")) return "fofoPsicopata";
  if (CAOS_AVATAR_TIPO.sombrio.has(a) && h === "suave") return "trevosoNutella";
  if (CAOS_AVATAR_TIPO.confiante.has(a)) return "arrogante";
  return null;
}
function caosCerebroOrdem() {
  return revealedOrder.filter((r) => r.item.type === "clue").length;
}
function caosDmInc(nome, cat, k, v) {
  const key = nome + "|" + cat + "|" + k;
  caosMesa.dm[key] = (caosMesa.dm[key] || 0) + v;
}
function caosDm(nome, cat, k) {
  return caosMesa.dm[nome + "|" + cat + "|" + k] || 0;
}
function caosDificilFicha(p, cat) {
  if (!memContaFicha(p)) return 0;
  const f = fichaGet(p.name);
  return f && f.dificil ? f.dificil[cat] || 0 : 0;
}
function caosCerebroRegistrar(tipo, p) {
  if (!p || !currentCard || CURRENT_MODE === "express") return;
  const cat = gemCategoryFor(currentCard.category),
    nome = p.name;
  caosDmInc(nome, cat, "t", 1);
  if (tipo === "acerto") {
    caosDmInc(nome, cat, "a", 1);
    return;
  }
  caosDmInc(nome, cat, "p", tipo === "absurdo" ? 5 : tipo === "pular" ? 2 : 1);
  if (tipo === "absurdo") caosMesa.absCat[nome + "|" + cat] = (caosMesa.absCat[nome + "|" + cat] || 0) + 1;
  if (tipo !== "pular" && caosCerebroOrdem() === 1) caosMesa.precoce[nome] = (caosMesa.precoce[nome] || 0) + 1;
}
function caosCerebroDiagnostico(p) {
  if (!p || !currentCard || CURRENT_MODE === "express" || p.iniciante) return "";
  const cat = gemCategoryFor(currentCard.category),
    nome = p.name,
    dk = nome + "|" + cat;
  if (caosMesa.diag[dk]) return "";
  const t = caosDm(nome, cat, "t"),
    pts = caosDm(nome, cat, "p");
  if (t < 3 || pts < 6 || caosDm(nome, cat, "a") > 0) return "";
  const outros = players.filter((x) => x.name !== nome && caosDm(x.name, cat, "t") > 0);
  const media = outros.length
    ? outros.reduce((s, x) => s + caosDm(x.name, cat, "p") / caosDm(x.name, cat, "t"), 0) / outros.length
    : 0;
  if (!outros.length) return "";
  if (pts / t < Math.max(1.5 * media, 1.2)) return "";
  caosMesa.diag[dk] = 1;
  if (memContaFicha(p))
    fichaUpd(nome, (f) => {
      f.dificil = f.dificil || {};
      f.dificil[cat] = Math.min(9, (f.dificil[cat] || 0) + 1);
    });
  caosLog(
    "cerebro",
    `laudo: ${nome} com dificuldade em ${cat} (${pts} pts em ${t} jogadas; média da mesa ${media.toFixed(2)}/jogada)`,
  );
  const C = REACTIVE_VOICE.cerebro,
    cn = CAOS_CAT_NOME[cat] || cat;
  return playerHumor(p) === "suave"
    ? getRandomReaction(C.diagnosticoSuave, nome, cn)
    : getRandomReaction(C.diagnostico, nome, cn, CAOS_CAT_MATERIA[cat] || cn);
}
function caosCerebroPremonicao(p) {
  if (!p || !currentCard || p.iniciante) return "";
  const cat = gemCategoryFor(currentCard.category);
  if (!(caosMesa.diag[p.name + "|" + cat] || caosDificilFicha(p, cat) > 0)) return "";
  if (Math.random() >= 0.3 || !caosOncePerMatch("premonicao_" + p.name + "_" + stats.totalDrawn)) return "";
  return getRandomReaction(REACTIVE_VOICE.cerebro.premonicao, p.name, CAOS_CAT_NOME[cat] || cat);
}
function caosCerebroAcerto(p, ordem, missBefore, ms) {
  if (!p || !currentCard || CURRENT_MODE === "express") return "";
  {
    const cm = caosCasalAcerto(p, players.indexOf(p));
    if (cm) return cm;
  }
  {
    const ct = caosCartaTema("acerto");
    if (ct) return ct;
  }
  const C = REACTIVE_VOICE.cerebro,
    cat = gemCategoryFor(currentCard.category),
    dk = p.name + "|" + cat;
  if (ordem <= 2 && (caosMesa.diag[dk] || caosDificilFicha(p, cat) > 0)) {
    delete caosMesa.diag[dk];
    if (memContaFicha(p))
      fichaUpd(p.name, (f) => {
        if (f.dificil) delete f.dificil[cat];
      });
    return getRandomReaction(C.redencao, p.name, CAOS_CAT_NOME[cat] || cat, ordem);
  }
  if (missBefore >= 3 && ordem <= 2 && !p.iniciante && playerHumor(p) !== "suave" && Math.random() < 0.7)
    return getRandomReaction(C.impostor, p.name, ordem);
  const PJ = REACTIVE_VOICE.perfilJogador,
    na = caosNickAnalise(p.name),
    pf = caosPerfilAvatar(p),
    R = Math.random;
  if (na && na.tipo === "enigma" && R() < 0.4) return getRandomReaction(PJ.enigma.acerto);
  if (na && na.tipo === "aura" && ordem >= 10 && R() < 0.6)
    return getRandomReaction(PJ.nick.acerto.auraTarde, p.name, ordem);
  if (
    na &&
    PJ.nick.acerto[na.tipo] &&
    ordem <= 3 &&
    R() < 0.4 &&
    caosOncePerMatch("nick_acerto_" + p.name + "_" + Math.floor(stats.totalDrawn / 4))
  )
    return getRandomReaction(PJ.nick.acerto[na.tipo], p.name);
  if (pf && ordem <= 3 && R() < 0.3 && caosOncePerMatch("perfil_acerto_" + p.name))
    return getRandomReaction(PJ.avatar.acerto[pf], p.name);
  if (R() < 0.12) {
    const g = caosGerar("acerto", p, { ms, ordem, missBefore });
    if (g) return g;
  }
  return "";
}
function caosCerebroErro(p, ms, surpresa) {
  if (!p || p.iniciante || CURRENT_MODE === "express") return "";
  const C = REACTIVE_VOICE.cerebro,
    R = Math.random,
    agora = Date.now(),
    ant = caosMesa.ultErro;
  caosMesa.ultErro = { nome: p.name, ms: typeof ms === "number" ? ms : 99999, t: agora };
  if (caosMesa.falso && R() < 0.6) {
    caosMesa.falso = 0;
    return getRandomReaction(C.falsoCarregamento);
  }
  if (
    ant &&
    ant.nome !== p.name &&
    ant.ms < 4e3 &&
    typeof ms === "number" &&
    ms < 4e3 &&
    agora - ant.t < 15e3 &&
    caosOncePerMatch("manada_" + stats.totalDrawn)
  )
    return getRandomReaction(C.manada);
  if (isJfPlayer(p) && surpresa === "erroFacil" && R() < 0.6) return getRandomReaction(C.criador, p.name);
  const PJ = REACTIVE_VOICE.perfilJogador,
    perfil = caosPerfilAvatar(p);
  if (perfil && R() < 0.5 && caosOncePerMatch("perfil_erro_" + p.name))
    return getRandomReaction(PJ.avatar.erro[perfil], p.name);
  const na = caosNickAnalise(p.name);
  if (na && na.tipo === "enigma") {
    if (R() < 0.35) return getRandomReaction(PJ.enigma.erro);
  } else if (na && PJ.nick.erro[na.tipo]) {
    const primeira = caosOncePerMatch("nick_erro1_" + p.name),
      chance = na.tipo === "nomeReal" ? [0.4, 0.1] : na.tipo === "numero" ? [0.5, 0.12] : [0.7, 0.18];
    if (R() < (primeira ? chance[0] : chance[1])) return getRandomReaction(PJ.nick.erro[na.tipo], p.name);
  }
  return "";
}
function caosCerebroAnne(tipo, p) {
  return caosCasalErro(tipo, p);
}
function caosFalsoCarregamento() {
  if (caosSilenced || activeToastState || !visualFxAllowed()) return false;
  const toast = document.getElementById("jfToast");
  if (!toast) return false;
  const serial0 = toastSerial;
  caosToastTexto(toast, "💭 ···");
  toast.classList.add("show", "caos-thinking");
  setTimeout(() => {
    if (toastSerial === serial0 && !activeToastState) toast.classList.remove("show", "caos-thinking");
  }, 2500);
  caosMesa.falso = 1;
  caosLog("cerebro", "falso carregamento");
  return true;
}
function caosNickAnalise(nome) {
  const k = nameKeyPlain(nome);
  if (!k || isJfName(nome) || isAnneName(nome)) return null;
  if (isEnigmaName(nome)) return { tipo: "enigma" };
  if (/(^|[^0-9])67([^0-9]|$)|(^|[^0-9])6 ?-? ?7([^0-9]|$)|six ?-? ?seven|meia ?sete/.test(k))
    return { tipo: "sixseven" };
  if (
    /brain ?rot|skibidi|(^|[^a-z])npc([^a-z]|$)|tralalero|tung ?tung|sahur|bombardiro|capuccin|patapim|labubu|delulu|slay|amogus|among ?us|(^|[^a-z])sus([^a-z]|$)|cringe|looksmax|mewing|fanum|ohio|rizz/.test(
      k,
    )
  )
    return { tipo: "genz" };
  if (/aura|sigma|chad|alpha|alfa|goat|(^|[^a-z])mog/.test(k)) return { tipo: "aura" };
  if (
    /player|matador|sniper|lenda|legend|brabo|craque|invict|imbativ|monstro|mito|^(boss|god|king)|(^|[^a-z])(pro|rei|boss|god|king|deus)([^a-z]|$)/.test(
      k,
    )
  )
    return { tipo: "tryhard" };
  const num = k.match(/\d+/);
  if (num) {
    const x = num[0];
    const sub = /^(19[4-9]\d|20[0-2]\d)$/.test(x)
      ? "ano"
      : ["7", "9", "10", "11"].includes(x)
        ? "camisa"
        : /^(123|1234|12345|321|4321)$/.test(x)
          ? "senha"
          : /^00\d?$/.test(x)
            ? "agente"
            : "generico";
    return { tipo: "numero", sub, x };
  }
  const palavras = k
    .replace(/[^a-z ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (palavras.length && palavras.length <= 2 && palavras.every((w) => CAOS_NOMES_REAIS.has(w)))
    return { tipo: "nomeReal" };
  return null;
}
function caosPerfilCadastro(p) {
  const PJ = REACTIVE_VOICE.perfilJogador,
    R = Math.random,
    na = caosNickAnalise(p.name),
    pf = caosPerfilAvatar(p);
  if (na && na.tipo === "enigma") return getRandomReaction(PJ.enigma.cadastro);
  if (na && (na.tipo === "sixseven" || na.tipo === "genz"))
    return getRandomReaction(PJ.nick.cadastro[na.tipo], p.name) + " " + caosAutoConsciencia();
  const op = [];
  if (na && na.tipo === "numero") op.push(() => getRandomReaction(PJ.nick.numero[na.sub], p.name, na.x));
  else if (na && PJ.nick.cadastro[na.tipo]) op.push(() => getRandomReaction(PJ.nick.cadastro[na.tipo], p.name));
  if (pf) op.push(() => getRandomReaction(PJ.avatar.cadastro[pf], p.name));
  if (!op.length || R() >= 0.6) return null;
  return op[Math.floor(R() * op.length)]() || null;
}
function caosCasal() {
  if (players.length < 3) return null;
  const j = players.findIndex((p) => isJfName(p.name)),
    a = players.findIndex((p) => isAnneName(p.name));
  return j >= 0 && a >= 0 ? { j, a } : null;
}
function caosCasalPode() {
  return stats.totalDrawn - (caosMesa.casalCarta ?? -99) >= 3;
}
function caosCasalMarca() {
  caosMesa.casalCarta = stats.totalDrawn;
}
function caosCasalErro(tipo, p) {
  const c = caosCasal();
  if (!c || !p || tipo === "pular" || !caosCasalPode()) return "";
  const C = REACTIVE_VOICE.perfilJogador.casal,
    idx = players.indexOf(p),
    R = Math.random;
  let m = "";
  if (idx === c.a && mestreIndex === c.j)
    m =
      tipo === "absurdo"
        ? R() < 0.8
          ? getRandomReaction(C.anneAbsurdo)
          : ""
        : R() < 0.45
          ? getRandomReaction(C.anneErraJfMestre)
          : "";
  else if (idx === c.j && mestreIndex === c.a)
    m =
      tipo === "absurdo"
        ? R() < 0.8
          ? getRandomReaction(C.jfAbsurdoPelaAnne)
          : ""
        : R() < 0.4
          ? getRandomReaction(C.jfErraAnneMestre)
          : "";
  if (m) caosCasalMarca();
  return m;
}
function caosCasalAcerto(p, scorerIdx) {
  const c = caosCasal();
  if (!c || !p || !caosCasalPode()) return "";
  const C = REACTIVE_VOICE.perfilJogador.casal,
    R = Math.random,
    par = scorerIdx === c.j ? c.a : scorerIdx === c.a ? c.j : -1;
  if (par < 0) return "";
  let m = "";
  if (caosPrevLeaderIdx === par && caosLeaderIdx() === scorerIdx && R() < 0.8)
    m = getRandomReaction(C.virada, p.name, players[par].name);
  else if (mestreIndex === par && R() < 0.35) m = getRandomReaction(C.acertoParceiroMestre, p.name, players[par].name);
  if (m) caosCasalMarca();
  return m;
}
function caosCasalEspecial(quemIdx, alvoIdx) {
  const c = caosCasal();
  if (!c) return "";
  if (!((quemIdx === c.j && alvoIdx === c.a) || (quemIdx === c.a && alvoIdx === c.j))) return "";
  if (!caosOncePerMatch("casal_esp_" + quemIdx)) return "";
  caosCasalMarca();
  return getRandomReaction(REACTIVE_VOICE.perfilJogador.casal.especial, players[quemIdx].name, players[alvoIdx].name);
}
function caosCasalFim() {
  const c = caosCasal();
  if (!c || Math.random() >= 0.8) return;
  const vj = rankValue(players[c.j]),
    va = rankValue(players[c.a]);
  if (vj === va) return;
  const msg = getRandomReaction(
    vj > va ? REACTIVE_VOICE.perfilJogador.casal.fimJf : REACTIVE_VOICE.perfilJogador.casal.fimAnne,
  );
  setTimeout(() => {
    if (gameEnded) showToastMessage(msg, null, true);
  }, 12e3);
}
const caosLexPick = (a) => a[Math.floor(Math.random() * a.length)];
const caosLexCap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const caosLexMin = (s) =>
  !s || (typeof players !== "undefined" && players.some((p) => p && p.name && s.indexOf(p.name) === 0))
    ? s
    : s.charAt(0).toLowerCase() + s.slice(1);
function caosIntimidade(p) {
  const f = p && memContaFicha(p) ? fichaGet(p.name) : null,
    n = f ? f.partidas : 0;
  return n >= 10 ? "veterano" : n >= 2 ? "conhecido" : "novato";
}
function caosPrateleira(p) {
  if (!p || p.iniciante || CURRENT_MODE === "junior") return "suave";
  const h = playerHumor(p);
  if (caosVincEhFav(p) && (h === "zero" || h === "acido") && Math.random() < 0.7)
    return h === "zero" ? "acido" : "normal";
  return h === "zero" ? "zero" : h === "acido" ? "acido" : h === "suave" ? "suave" : "normal";
}
function caosFatos(tipo, p, x) {
  const F = [],
    ordem = x.ordem,
    seg = x.seg,
    dif = x.dif,
    h = new Date().getHours(),
    mestre = players[mestreIndex];
  const s = (n) => (n === 1 ? "segundo" : "segundos");
  if (tipo === "erro") {
    if (ordem === 1) F.push({ w: 3, np: "chutar logo na 1ª dica lida", fr: "Chutou logo na 1ª dica lida" });
    if (ordem >= 10)
      F.push({ w: 3, np: `errar com ${ordem} dicas já lidas`, fr: `Já eram ${ordem} dicas lidas na mesa` });
    if (seg != null && seg >= 25)
      F.push({ w: 3, np: `pensar ${seg} segundos e chegar nisso`, fr: `Foram ${seg} segundos pensando` });
    if (seg != null && seg <= 3)
      F.push({ w: 3, np: `responder em ${seg} ${s(seg)}`, fr: `A resposta saiu em ${seg} ${s(seg)}` });
    if (dif === "facil")
      F.push({ w: 4, np: "errar uma carta que a minha memória marca como fácil", fr: "Essa carta costuma ser fácil" });
    if (x.seguidos >= 3)
      F.push({ w: 3, np: `emendar o ${x.seguidos}º erro seguido`, fr: `É o ${x.seguidos}º erro seguido` });
    if (x.catRepetida) F.push({ w: 2, np: `tropeçar em ${x.cat} de novo`, fr: `${x.cat} de novo` });
    if (h >= 0 && h < 5)
      F.push({
        w: 2,
        np: `errar isso ${h === 0 ? "à meia-noite" : "às " + h + " da manhã"}`,
        fr: `O relógio marca ${h === 0 ? "meia-noite" : h + " da manhã"}`,
      });
    if (mestre && mestre !== p && x.seg != null && x.seg >= 8)
      F.push({ w: 1, np: `errar com ${mestre.name} lendo tão bem`, fr: `${mestre.name} leu direitinho` });
  } else if (tipo === "acerto") {
    if (ordem <= 2)
      F.push({
        w: 3,
        np: `acertar com ${ordem === 1 ? "uma dica lida" : "duas dicas lidas"}`,
        fr: `Acertou com ${ordem === 1 ? "uma dica lida" : "duas dicas lidas"}`,
      });
    if (ordem >= 12) F.push({ w: 2, np: `precisar de ${ordem} dicas`, fr: `Precisou de ${ordem} dicas` });
    if (seg != null && seg <= 6) F.push({ w: 3, np: `acertar em ${seg} ${s(seg)}`, fr: `Levou ${seg} ${s(seg)}` });
    if (seg != null && seg >= 40)
      F.push({ w: 2, np: `pensar ${seg} segundos até acertar`, fr: `Foram ${seg} segundos de suspense` });
    if (dif === "dificil")
      F.push({ w: 4, np: "acertar uma carta que costuma travar a mesa", fr: "Essa carta costuma travar a mesa" });
    if (x.missBefore >= 2)
      F.push({
        w: 3,
        np: `acertar depois de ${x.missBefore} erros seguidos`,
        fr: `O acerto veio depois de ${x.missBefore} erros seguidos`,
      });
  } else if (tipo === "pular") {
    if (ordem === 1) F.push({ w: 3, np: "pular logo a 1ª dica lida", fr: "Passou logo a 1ª dica lida" });
    if (x.pulos >= 3)
      F.push({ w: 3, np: `pular pela ${x.pulos}ª vez na partida`, fr: `É o ${x.pulos}º pulo da partida` });
    if (seg != null && seg >= 20)
      F.push({ w: 2, np: `pensar ${seg} segundos e desistir`, fr: `Foram ${seg} segundos pensando antes de passar` });
    if (ordem >= 12) F.push({ w: 2, np: `passar com ${ordem} dicas lidas`, fr: `Já eram ${ordem} dicas lidas` });
  }
  if (!F.length) return null;
  const tot = F.reduce((a, f) => a + f.w, 0);
  let r = Math.random() * tot;
  for (const f of F) {
    r -= f.w;
    if (r <= 0) return f;
  }
  return F[0];
}
function caosGerar(tipo, p, x) {
  const caosLexPick2 = (arr) => caosPickNR("gerar." + String((arr && arr[0]) || "").slice(0, 40), arr);
  if (!p || caosSilenced || CURRENT_MODE === "express") return "";
  x = x || {};
  const n = p.name,
    idx = players.indexOf(p),
    cat0 = currentCard ? gemCategoryFor(currentCard.category) : null;
  const ctx = {
    ordem: x.ordem != null ? x.ordem : caosCerebroOrdem(),
    seg: typeof x.ms === "number" && x.ms > 0 ? Math.max(1, Math.round(x.ms / 1e3)) : null,
    dif: currentCard ? currentCard._caosDificuldade : null,
    seguidos: idx >= 0 ? caosTrailing(idx, "M") : 0,
    missBefore: x.missBefore || 0,
    cat: CAOS_CAT_NOME[cat0] || cat0,
    catRepetida: cat0 ? caosDm(n, cat0, "p") >= 2 : false,
    pulos: caosMesa.pulosPor[n] || 0,
  };
  const cortes = (caosCortes.por && caosCortes.por[n]) || 0;
  if (cortes >= 3 && playerHumor(p) !== "suave") {
    return (
      "[C.A.O.S.] " +
      (tipo === "erro"
        ? caosLexPick2([`Errou, ${n}.`, `Não, ${n}.`, `Errado.`])
        : tipo === "acerto"
          ? caosLexPick2([`Acertou, ${n}.`, `Certo.`, `Ponto.`])
          : caosLexPick2([`Pulou.`, `Passou, ${n}.`]))
    );
  }
  const prat = caosPrateleira(p),
    intim = caosIntimidade(p),
    J = CAOS_LEX.juizo[tipo];
  if (
    tipo === "erro" &&
    prat !== "suave" &&
    (caosMesa.absurdos >= 3 || Object.keys(caosMesa.tilt || {}).length) &&
    Math.random() < 0.12
  ) {
    const t = caosLexPick2(CAOS_LEX.trivia);
    return (
      "[C.A.O.S.] " +
      caosLexPick2([
        `Você errou, ${n}. A propósito, ${t} Achei que, se é pra falar coisa sem sentido, eu também podia participar.`,
        `Erro 404: a lógica da resposta de ${n} não foi encontrada no meu banco de dados. Reiniciando o módulo de paciência…`,
        `${n}, enquanto você pensava nisso, eu aprendi que ${t} Pelo menos um de nós saiu dessa rodada sabendo alguma coisa.`,
      ])
    );
  }
  const fato = caosFatos(tipo, p, ctx);
  if (!fato) return "";
  const nomeIn = (s) => s.replace(/\{n\}/g, n);
  let juizo = caosLexPick2(J[prat]);
  if (intim === "novato" && prat !== "zero" && Math.random() < 0.4) juizo = caosLexPick2(J.formal);
  const abreBank = CAOS_LEX.abre[intim];
  const zonaH = typeof caosHumorMatriz === "function" ? caosHumorMatriz() : null;
  const confAb =
    caosEixos.confianca >= 5 ? CAOS_LEX.abreConf.alta : caosEixos.confianca <= -5 ? CAOS_LEX.abreConf.baixa : null;
  const medE = caosConsole && caosConsole.on && caosConsole.mostraMed !== "calmo" ? caosConsole.mostraMed : null;
  const emoAb =
    medE && CAOS_LEX.abreEmo[medE] && !(prat === "suave" && /^(raiva|nojo)$/.test(medE))
      ? CAOS_LEX.abreEmo[medE]
      : null;
  const abre =
    Math.random() < 0.45
      ? nomeIn(
          confAb && Math.random() < 0.35
            ? caosLexPick2(confAb)
            : emoAb && Math.random() < 0.5
              ? caosLexPick2(emoAb)
              : zonaH && CAOS_LEX.abreHumor[zonaH] && Math.random() < 0.5
                ? caosLexPick2(CAOS_LEX.abreHumor[zonaH])
                : caosLexPick2(abreBank),
        ) + " "
      : "";
  const juizoBase = juizo;
  if (medE && CAOS_LEX.raboEmo[medE] && !(prat === "suave" && medE === "nojo") && Math.random() < 0.18)
    juizo += " " + caosLexPick2(CAOS_LEX.raboEmo[medE]);
  const cola = (a, t) => (a && /[,:]\s*$/.test(a) ? a + caosLexMin(t) : a + caosLexCap(t));
  const moldes = [
    () => `${cola(abre, fato.fr)}. ${juizo}`,
    () => `${n}, ${fato.np}? ${juizo}`,
    () => `Pelos meus registros: ${caosLexMin(fato.fr)}. ${juizo}`,
  ];
  if (tipo !== "acerto") moldes.push(() => `${cola(abre, fato.np)}… ${juizo}`);
  if (intim === "veterano") moldes.push(() => `${nomeIn(caosLexPick2(J.intimo))} ${fato.fr}? ${juizo}`);
  if (intim === "novato" && tipo === "erro" && prat !== "zero")
    moldes.push(() => `${caosLexPick2(J.formal)} Observação técnica: ${caosLexMin(fato.fr)}.`);
  moldes.push(
    () => `Nota mental: ${caosLexMin(fato.fr)}. ${juizo}`,
    () => `${n}… ${caosLexMin(fato.fr)}. ${juizo}`,
    () => `Fato do dia: ${caosLexMin(fato.fr)}. ${juizo}`,
  );
  const limpa = (t) =>
    nomeIn(t)
      .replace(/\s+/g, " ")
      .replace(/\?\s*\?/g, "?")
      .trim();
  let txt = limpa(caosLexPick2(moldes)());
  // fala montada longa demais: volta para a forma simples "Fato. Julgamento."
  if (txt.length > CAOS_FALA_JUNTA_MAX) txt = limpa(`${caosLexCap(fato.fr)}. ${juizoBase}`);
  if (caosHasProfanity(txt, [n])) return "";
  txt = "[C.A.O.S.] " + txt;
  caosLastPick = { bank: "gerador." + tipo + "." + prat, key: "gerador|" + tipo + "|" + prat, text: txt };
  return txt;
}
function caosAgora() {
  const d = new Date();
  return { h: d.getHours(), dow: d.getDay(), dia: d.getDate(), mes: d.getMonth() + 1 };
}
function caosPeriodo(h) {
  return h < 5 ? "madrugada" : h < 12 ? "manha" : h < 18 ? "tarde" : "noite";
}
function caosDataEspecial(a) {
  if (a.mes === 12 && (a.dia === 24 || a.dia === 25)) return "natal";
  if ((a.mes === 12 && a.dia === 31) || (a.mes === 1 && a.dia === 1)) return "anoNovo";
  if (a.mes === 6 && a.dia === 12) return caosCasal() ? "namoradosCasal" : "namorados";
  if (a.mes === 10 && a.dia === 12) return "criancas";
  if (a.mes === 10 && a.dia === 31) return "halloween";
  if (a.dow === 5 && a.dia === 13) return "sexta13";
  return null;
}
function caosTurno(h) {
  if (typeof h !== "number") h = new Date().getHours();
  return h < 6 ? "madrugada" : h < 12 ? "manhã" : h < 18 ? "tarde" : "noite";
}
function caosHoraTexto(h) {
  return h === 0
    ? "meia-noite"
    : h === 12
      ? "meio-dia"
      : h < 12
        ? `${h} da manhã`
        : h < 18
          ? `${h - 12} da tarde`
          : `${h - 12} da noite`;
}
function caosMinutosPartida() {
  return caosPartidaInicioAt
    ? Math.max(0, Math.floor(((caosPartidaFimAt || Date.now()) - caosPartidaInicioAt) / 6e4))
    : 0;
}
function caosRelogioInicioTexto() {
  const a = caosAgora(),
    R = REACTIVE_VOICE.relogio,
    esp = caosDataEspecial(a);
  if (esp && R.especial[esp]) return getRandomReaction(R.especial[esp]);
  const dk = { 5: "sexta", 6: "sabado", 0: "domingo", 1: "segunda" }[a.dow];
  if (dk && R.diaSemana[dk] && Math.random() < 0.4) return getRandomReaction(R.diaSemana[dk]);
  return getRandomReaction(R.inicio[caosPeriodo(a.h)], caosHoraTexto(a.h), CAOS_DIAS[a.dow]);
}
function caosRelogioNaCarta() {
  if (caosSilenced || !caosPartidaInicioAt) return false;
  const m = caosMinutosPartida(),
    R = REACTIVE_VOICE.relogio;
  for (const marco of [120, 90, 60, 30]) {
    if (m >= marco && m < marco + 25 && caosOncePerMatch("relogio_" + marco)) {
      showToastMessage(getRandomReaction(R.marco[marco]));
      return true;
    }
  }
  const h = new Date().getHours(),
    iniH = new Date(caosPartidaInicioAt).getHours();
  if (h === 0 && iniH >= 18 && caosOncePerMatch("relogio_meianoite")) {
    showToastMessage(getRandomReaction(R.meiaNoite));
    return true;
  }
  return false;
}
function caosAutoConsciencia() {
  const A = REACTIVE_VOICE.autoConsciencia;
  const jf = players.some((p) => isJfName(p.name)),
    anne = players.some((p) => isAnneName(p.name));
  if (jf && anne && Math.random() < 0.6) return getRandomReaction(A.jfAnne);
  if (jf && Math.random() < 0.7) return getRandomReaction(A.jf);
  return getRandomReaction(A.solo);
}
function caosCartaTema(momento) {
  if (!currentCard || caosSilenced || CURRENT_MODE === "junior") return "";
  const k = nameKeyPlain(currentCard.answer),
    tema = Object.keys(CAOS_CARTA_TEMA).find((t) => CAOS_CARTA_TEMA[t].includes(k));
  if (!tema || Math.random() >= 0.6 || !caosOncePerMatch("tema_" + k)) return "";
  return getRandomReaction(REACTIVE_VOICE.cartaTema[tema][momento], currentCard.answer);
}
function caosResenha() {
  if (caosResenhaTxt) return caosResenhaTxt;
  if (!players.length || stats.totalDrawn < 3) return "";
  const pick = caosLexPick,
    min = caosMinutosPartida(),
    a = caosAgora();
  const venc = caosVencedoresIdx(),
    vNome = venc.length === 1 ? players[venc[0]].name : null;
  const ord = [...players].sort((x, y) => rankValue(y) - rankValue(x)),
    lant = players.length >= 3 ? ord[ord.length - 1] : null;
  const topo = (o) => {
    const e = Object.entries(o || {}).sort((x, y) => y[1] - x[1])[0];
    return e && e[1] > 0 ? e : null;
  };
  const pul = topo(caosMesa.pulosPor),
    abs = topo(caosMesa.absurdosPor),
    pre = topo(caosMesa.precoce);
  const diag = Object.keys(caosMesa.diag || {}).map((k) => k.split("|"));
  const suave = players.filter((p) => playerHumor(p) === "suave" || p.iniciante).length > players.length / 2;
  const quando = `${a.h < 5 ? "numa madrugada" : a.h < 12 ? "numa manhã" : a.h < 18 ? "numa tarde" : "numa noite"} de ${CAOS_DIAS[a.dow]}`;
  const dur = min >= 1 ? `${min} ${min === 1 ? "minuto" : "minutos"}` : "poucos minutos";
  const f = [];
  f.push(
    pick([
      `Uma partida de ${dur}, ${quando}, com ${stats.totalDrawn} cartas na mesa.`,
      `${caosLexCap(dur)} de jogo ${quando}. ${stats.totalDrawn} cartas depois, aqui estamos.`,
      `Relatório oficial: ${stats.totalDrawn} cartas, ${dur}, ${quando}.`,
    ]),
  );
  if (vNome)
    f.push(
      suave
        ? pick([`${vNome} venceu, e mereceu.`, `Vitória de ${vNome}, com todos os méritos.`])
        : pick([
            `${vNome} venceu, mas vamos com calma antes de chamar de gênio.`,
            `${vNome} ganhou. Eu revisei os dados e, infelizmente, foi justo.`,
            `Vitória de ${vNome}, que agora vai lembrar disso por uma semana.`,
          ]),
    );
  if (lant && lant.name !== vNome && !suave && Math.random() < 0.7)
    f.push(
      pick([
        `${lant.name} ficou na lanterna, mas com muita personalidade.`,
        `${lant.name} terminou em último. Eu anotei com carinho, pra usar depois.`,
      ]),
    );
  if (pul && pul[1] >= 3)
    f.push(
      pick([
        `${pul[0]} pulou ${pul[1]} dicas: veio mais pra assistir do que pra jogar.`,
        `${pul[1]} pulos de ${pul[0]}. Honestidade tem limite, e o limite foi testado.`,
      ]),
    );
  if (abs && abs[1] >= 2)
    f.push(
      pick([
        `${abs[0]} levou ${abs[1]} Absurdos. O Mestre não teve escolha.`,
        `${abs[1]} Absurdos pra ${abs[0]}. Alguns chutes dessa ${caosTurno()} deviam ser proibidos por lei.`,
      ]),
    );
  if (pre && pre[1] >= 3) f.push(`${pre[0]} chutou e errou ${pre[1]} vezes logo na 1ª dica lida. Coragem não faltou.`);
  if (diag.length) {
    const [dn, dc] = pick(diag);
    f.push(`Laudo da ${caosTurno()}: ${dn} e a categoria ${CAOS_CAT_NOME[dc] || dc} não se entenderam.`);
  }
  if (caosAposta) {
    const ok = vNome && nameKeyPlain(vNome) === nameKeyPlain(caosAposta.nome);
    f.push(
      ok
        ? `Minha aposta secreta em ${caosAposta.nome} acertou. Anotem.`
        : `Minha aposta secreta era ${caosAposta.nome}. Vocês estragaram meu modelo.`,
    );
  }
  caosVinculoResenha(f, pick, suave);
  f.push(
    suave
      ? pick(["Foi bom jogar com vocês. Até a próxima.", "Obrigado pela partida. Voltem sempre."])
      : pick([
          "Até a próxima. Estudem.",
          "Eu vou arquivar tudo. Até a próxima.",
          "Vocês deveriam repensar algumas escolhas. Até a próxima.",
          "Foi um prazer. Mentira. Foi divertido. Até a próxima.",
        ]),
  );
  const fixas = vNome ? 2 : 1;
  const meio = f.slice(fixas, -1);
  while (meio.length > 2) meio.splice(Math.floor(Math.random() * meio.length), 1);
  caosResenhaTxt = [...f.slice(0, fixas), ...meio, f[f.length - 1]].join(" ");
  return caosResenhaTxt;
}
function caosGradLoop(color) {
  const cs = String(GRADIENTS[color] || "").match(/#[0-9a-fA-F]{3,8}/g) || [];
  return cs.length >= 2 ? `linear-gradient(90deg, ${cs.join(", ")}, ${cs[0]})` : GRADIENTS[color] || "";
}
function caosEixosReset() {
  caosEixos = { alegria: 0, confianca: 0, curiosidade: 0 };
  caosEixosCats = [];
  caosMesaIntimCache = null;
}
function caosEixosDaFala(bank) {
  const b = String(bank || ""),
    cl = (v) => Math.max(-10, Math.min(10, v));
  if (/^(joia|sequenciaAcertos|acertoVirada|acertoRecuperacao|recorde|marco100)/.test(b))
    caosEixos.alegria = cl(caosEixos.alegria + 2);
  if (/^(bolaCristalAcerto|previsaoCartaAcertou)/.test(b)) caosEixos.confianca = cl(caosEixos.confianca + 3);
  if (/^(bolaCristalErro|previsaoCartaCategoriaErrada|previsaoCartaPassouPerto)/.test(b))
    caosEixos.confianca = cl(caosEixos.confianca - 3);
}
function caosEixosCarta() {
  let novo = false;
  caosEixos.alegria *= 0.8;
  caosEixos.confianca *= 0.9;
  caosEixos.curiosidade *= 0.75;
  try {
    const c = currentCard && caosCatDaCarta(currentCard);
    if (c) {
      novo = !caosEixosCats.slice(-3).includes(c);
      if (novo) caosEixos.curiosidade = Math.min(10, caosEixos.curiosidade + 1.5);
      caosEixosCats.push(c);
    }
  } catch (e) {}
  caosConsoleCarta(novo);
}
function caosMesaIntim() {
  if (caosMesaIntimCache !== null) return caosMesaIntimCache;
  try {
    const ps = players.map((p) => (memContaFicha(p) && fichaGet(p.name) ? fichaGet(p.name).partidas : 0));
    const m = ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 0;
    caosMesaIntimCache = m >= 10 ? 0.15 : m < 2 ? -0.15 : 0;
  } catch (e) {
    caosMesaIntimCache = 0;
  }
  return caosMesaIntimCache;
}
function caosHumorScores() {
  const cl = (x) => Math.max(0, Math.min(1, x));
  const t = (caosEmo.tensao ?? 5) / 10,
    c = (caosEmo.calor ?? 5) / 10,
    p = (caosEmo.paciencia ?? 7) / 10;
  const sT = cl((t - 0.5) / 0.5),
    sTlow = cl((0.6 - t) / 0.6),
    sChi = cl((c - 0.55) / 0.45),
    sClo = cl((0.55 - c) / 0.55);
  return {
    raiva: Math.max(
      Math.pow(sT, 0.8) * Math.pow(1 - p, 0.8) * (0.7 + 0.3 * sClo),
      Math.pow(cl((0.25 - p) / 0.25), 1.5) * 0.45,
    ),
    preocupado: sT * Math.pow(p, 1.2) * 0.75,
    tedio: sTlow * Math.max(sClo * Math.pow(1 - p, 0.5), Math.pow(1 - p, 2) * 0.7),
    orgulho: sChi * cl(sTlow + 0.35) * Math.pow(p, 0.7),
    desafio: cl((t - 0.45) / 0.55) * cl((c - 0.5) / 0.5) * Math.pow(p, 0.5),
    festa: cl((caosEixos.alegria || 0) / 10) * (0.5 + 0.5 * p),
    espiando: cl((caosEixos.curiosidade || 0) / 10) * 0.8,
  };
}
function caosHumorContinuo() {
  const S = caosHumorScores();
  let top = "calmo",
    v = 0;
  const ks = ["raiva", "preocupado", "desafio", "orgulho", "tedio", "festa", "espiando"];
  ks.forEach((k) => {
    if (S[k] >= (k === "raiva" ? 0.3 : 0.35) && S[k] > v) {
      v = S[k];
      top = k;
    }
  });
  let sec = null,
    v2 = 0.3;
  ks.forEach((k) => {
    if (k !== top && S[k] > v2) {
      v2 = S[k];
      sec = k;
    }
  });
  return { emo: top, k: top === "calmo" ? 0 : v, sec, k2: sec ? v2 : 0 };
}
function caosEmocaoGlobalLegado() {
  let e = "calmo";
  try {
    const h = caosHumorContinuo();
    e = h.sec && Math.random() < h.k2 / (h.k + h.k2 || 1) ? h.sec : h.emo;
  } catch (err) {
    e = "calmo";
  }
  return e;
}
function caosConsoleReset() {
  const on = caosConsole
    ? caosConsole.on
    : (() => {
        try {
          return JFStore.getItem("perfil5_caos_console") !== "0";
        } catch (e) {
          return true;
        }
      })();
  const g = {};
  Object.keys(CAOS_CONSOLE).forEach((k) => {
    g[k] = 0;
  });
  caosConsole = {
    on,
    g,
    atual: "calmo",
    dwell: 0,
    mostra: "calmo",
    mostraMed: "calmo",
    mist: null,
    seqOk: 0,
    seqErr: 0,
    ultEv: "",
    log: [],
    hist: [],
    legMostra: "calmo",
    legN: 0,
  };
}
function caosConsoleLog(txt) {
  try {
    caosConsole.log.push(`c${typeof stats !== "undefined" && stats ? stats.totalDrawn : 0} · ${txt}`);
    if (caosConsole.log.length > 30) caosConsole.log.shift();
  } catch (e) {}
}
function caosSentir(emo, v, motivo) {
  try {
    const C = caosConsole,
      M = CAOS_CONSOLE[emo];
    if (!C || !M || !(v > 0)) return;
    const t = caosEmo.tensao ?? 5,
      c = caosEmo.calor ?? 5,
      p = caosEmo.paciencia ?? 7,
      T = caosTemper || {};
    let k = 1;
    if (emo === "raiva") k = (1 + Math.max(0, 7 - p) * 0.12) * (1 + (T.t || 0) * 0.15);
    else if (emo === "ansiedade") k = (1 + Math.max(0, 7 - p) * 0.08) * (1 + (t - 5) * 0.08);
    else if (emo === "medo") k = 1 + (t - 5) * 0.1;
    else if (emo === "alegria") k = 1 + (c - 5) * 0.08 + (T.c || 0) * 0.1;
    else if (emo === "carinho") k = 1 + (c - 5) * 0.06;
    else if (emo === "tedio") k = Math.max(0.4, Math.min(1.3, (9 - c) / 4));
    if (/demora/.test(String(motivo || "")) && T.pac && (emo === "raiva" || emo === "ansiedade")) k *= T.pac;
    k = emo === "tedio" ? k : Math.max(0.2, k);
    const antes = C.g[emo],
      sat = Math.max(0, 1 - antes / M.teto);
    C.g[emo] = Math.min(M.teto, antes + v * k * sat);
    if (C.g[emo] - antes >= 0.5) caosConsoleLog(`${M.ic} ${emo} +${(C.g[emo] - antes).toFixed(1)} (${motivo || "?"})`);
  } catch (e) {}
}
function caosTedioTick() {
  try {
    if (
      CURRENT_MODE === "express" ||
      gameEnded ||
      activeToastState ||
      cardState !== "revealed" ||
      !stats ||
      stats.totalDrawn < 1
    )
      return;
    if (document.getElementById("pauseScreen").style.display === "block") {
      caosUltEventoAt = Date.now();
      return;
    }
    const agora = Date.now();
    if (agora - Math.max(caosUltEventoAt, caosUltimaFalaAt || 0) < CAOS_TEDIO_OCIOSO_MS) return;
    caosUltEventoAt = agora;
    caosSentir("tedio", 1, "30 s sem evento na mesa");
  } catch (e) {}
}
function caosConsoleCarta(novo) {
  try {
    caosUltEventoAt = Date.now();
    const C = caosConsole;
    if (!C) return;
    Object.keys(C.g).forEach((k) => {
      C.g[k] = Math.max(0, C.g[k] * CAOS_CONSOLE[k].dec);
      if (C.g[k] < 0.05) C.g[k] = 0;
    });
    if (novo) caosSentir("curiosidade", 2, "categoria nova");
    else if (C.ultEv === "E" || C.ultEv === "P") caosSentir("tedio", 1.2, "rotina");
    if (
      typeof gameEnded !== "undefined" &&
      !gameEnded &&
      typeof caosMomentoCritico === "function" &&
      caosMomentoCritico()
    ) {
      caosSentir("ansiedade", 1, "reta final");
      caosSentir("medo", 1.2, "reta final");
      try {
        if (
          players.some(
            (p) =>
              p && typeof p.position === "number" && WINNING_SCORE - p.position > 0 && WINNING_SCORE - p.position <= 3,
          )
        )
          caosSentir("medo", 1.5, "alguém a 3 casas");
      } catch (e) {}
    }
  } catch (e) {}
}
function caosConsoleEvento(idx, ev) {
  try {
    caosUltEventoAt = Date.now();
    const C = caosConsole;
    if (!C) return;
    const p = players[idx],
      nm = p && p.name,
      fav = nm && caosVinc && caosVinc.fav === nm,
      des = nm && caosVinc && caosVinc.desafeto === nm;
    if (ev === "A" || ev === "a") {
      C.seqOk++;
      C.seqErr = 0;
      caosSentir("alegria", (ev === "a" ? 1 : 0.7) * (des ? 0.6 : 1), "acerto");
      if (C.seqOk >= 3 && C.seqOk % 2 === 1) caosSentir("alegria", 1.2, "sequência de acertos");
      if (fav) caosSentir("carinho", 0.5, "favorito acertou");
      if (p && playerHumor(p) === "suave") caosSentir("carinho", humorFamilia(p) ? 1 : 0.6, "acerto de jogador Suave");
      C.g.raiva = Math.max(0, (C.g.raiva || 0) - 1.2);
      if (des) caosSentir("nojo", 0.4, "elogio contrariado");
    } else if (ev === "E" || ev === "X") {
      C.seqErr++;
      C.seqOk = 0;
      caosPacienciaNudge(ev === "X" ? -0.5 : C.seqErr >= 3 ? -0.5 : C.seqErr === 2 ? -0.3 : -0.15);
      caosSentir(
        "raiva",
        (ev === "X" ? 0.5 : 1) *
          (fav ? 0.5 : des ? 1.3 : 1) *
          (p && playerHumor(p) === "suave" ? 0.5 : 1) *
          (1 / (1 + 0.18 * Math.max(0, (C.g.raiva || 0) - 3))),
        ev === "X" ? "absurdo" : "erro",
      );
      if (p && playerHumor(p) === "suave") caosSentir("carinho", 0.3, "erro de jogador Suave");
      if (ev === "X") caosSentir("nojo", 3.5, "absurdo");
      if (C.seqErr === 3) caosSentir("tristeza", 2, "erros seguidos");
      else if (C.seqErr > 3) caosSentir("tristeza", 1.2, "erros seguidos");
      if (des && ev === "E") caosSentir("nojo", 0.6, "desafeto errou");
    } else if (ev === "P") {
      C.seqOk = 0;
      caosPacienciaNudge(-0.15);
      caosSentir("tedio", 0.6, "pulou");
      if (p && p.emo && /PP$/.test(p.emo.h || "")) caosSentir("nojo", 1.5, "pulos seguidos");
    }
    C.ultEv = ev === "a" ? "A" : ev;
  } catch (e) {}
}
function caosConsoleDaFala(bank) {
  const b = String(bank || "");
  if (!b || !caosConsole) return;
  if (/^(joia|vitoria|recorde|marco100|acertoVirada)/.test(b)) caosSentir("alegria", 3, b.split(".")[0]);
  else if (/^sequenciaAcertos/.test(b)) caosSentir("alegria", 2, "sequência");
  else if (/^(bolaCristalAcerto|previsaoCartaAcertou|mesa\.apostaAcertou)/.test(b))
    caosSentir("alegria", 1.5, "previsão certa");
  if (/^erroEscalada/.test(b)) caosSentir("tristeza", 1.5, "erro em escalada");
  if (/^surpresaErroFacil/.test(b)) caosSentir("raiva", 1.5, "erro fácil");
  if (/^(erroDemorou|jogadorLento|tempoPessoalLento)/.test(b)) {
    caosSentir("raiva", 0.8, "demora");
    caosSentir("tedio", 1.2, "demora");
    caosSentir("ansiedade", 0.5, "demora");
  }
  if (/^(avisoTempo|avisoCarta|metadeDaCarta|dicasProgresso)/.test(b)) caosSentir("ansiedade", 1.2, "esperando");
  if (/^agonia15Dicas/.test(b)) {
    caosSentir("ansiedade", 2, "agonia");
    caosSentir("medo", 1.5, "agonia");
  }
  if (/^perguntaMestre\./.test(b)) caosSentir("ansiedade", 1, "pergunta ao Mestre");
  if (/^retaFinal/.test(b)) {
    caosSentir("medo", 3, "reta final");
    caosSentir("ansiedade", 2, "reta final");
  }
  if (/^pausaVolta\.magoado/.test(b)) caosSentir("tristeza", 3, "pausa longa");
  if (/^pausaVolta\.puto/.test(b)) {
    caosSentir("raiva", 3, "pausa longuíssima");
    caosSentir("tristeza", 1.5, "pausa longuíssima");
  }
  if (/^(caosCortado|naoCurti)/.test(b)) {
    caosSentir("tristeza", 1.5, "cortado/👎");
    caosSentir("raiva", 1, "cortado/👎");
  }
  if (/^(caosSaiuDaPartida|caosSaiuTemporario)/.test(b)) caosSentir("tristeza", 3, "silenciado");
  if (/^(bolaCristalErro|previsaoCartaCategoriaErrada|previsaoCartaPassouPerto)/.test(b))
    caosSentir("vergonha", 4, "previsão errada");
  if (/^mesa\.apostaErrou/.test(b)) caosSentir("vergonha", 5.5, "aposta errada");
  if (/^(carinho|iniciante|boasVindas|jfInicio|vinculo\.defesaFav|nickSugestaoAceita|satisfacao\.ok)/.test(b))
    caosSentir("carinho", 1.8, b.split(".")[0]);
  if (/^vinculo\.elogioContrariado/.test(b)) {
    caosSentir("nojo", 1, "elogio contrariado");
    caosSentir("alegria", 0.8, "elogio contrariado");
  }
  if (/^(entediado|mesaDormindo|partidaLonga|caosCansado|caosExausto)/.test(b)) caosSentir("tedio", 1.4, "mesa parada");
  if (/^(inicioJogadores|boasVindas|nickReacao)/.test(b)) caosSentir("curiosidade", 1, "gente nova");
}
function caosConsoleRosto(med) {
  const g = caosConsole ? caosConsole.g : {};
  if (med === "alegria") return g.alegria >= 6.5 ? "festa" : "orgulho";
  if (med === "raiva") return g.raiva >= 8.5 ? "furia" : "raiva";
  return (
    {
      tristeza: "triste",
      curiosidade: "espiando",
      medo: "medo",
      nojo: "nojo",
      ansiedade: "ansiedade",
      tedio: "tedio",
      vergonha: "vergonha",
      carinho: "carinho",
    }[med] || "calmo"
  );
}
function caosConsoleMistura() {
  const g = caosConsole.g,
    ord = Object.keys(g).sort((a2, b2) => g[b2] - g[a2]),
    a = ord[0],
    b = ord[1];
  if (!(g[a] >= CAOS_CONSOLE_CFG.limiar * 0.8 && g[b] >= CAOS_CONSOLE_CFG.limiar * 0.8)) return null;
  const m = CAOS_CONSOLE_MISTURAS.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
  return m ? m[2] : null;
}
function caosConsoleAvancar(bank) {
  try {
    const C = caosConsole,
      F = CAOS_CONSOLE_CFG,
      b = String(bank || ""),
      livre = CAOS_ESCADA_LIVRE.test(b) || (typeof gameEnded !== "undefined" && gameEnded);
    const leg = caosEmocaoGlobalLegado();
    if (leg !== C.legMostra && (C.legN >= F.dwell || livre)) {
      C.legMostra = leg;
      C.legN = 0;
    }
    C.legN++;
    const g = C.g,
      ord = Object.keys(g).sort((x, y) => g[y] - g[x]);
    let top = ord[0];
    const v = g[top];
    if (v < F.limiar) top = "calmo";
    const grave = g.medo >= 7 || g.nojo >= 7 || g.vergonha >= 7;
    if (top !== C.atual) {
      const vA = C.atual === "calmo" ? F.limiar : g[C.atual];
      const passa = top === "calmo" ? vA < F.saida : C.atual === "calmo" || v - vA >= F.margem || vA < F.saida;
      if ((C.dwell >= F.dwell || grave || livre) && passa) {
        caosConsoleLog(`🎚️ ${C.atual} → ${top}`);
        C.atual = top;
        C.dwell = 0;
      }
    } else if (C.atual !== "calmo" && g[C.atual] < F.saida && C.dwell >= F.dwell) {
      C.atual = "calmo";
      C.dwell = 0;
    }
    C.dwell++;
    let mostra = C.atual;
    if (C.atual !== "calmo") {
      const sec = ord.find((k) => k !== C.atual);
      if (
        sec &&
        g[sec] >= F.mistura * g[C.atual] &&
        g[sec] >= F.saida &&
        Math.random() < (F.pMistura * g[sec]) / g[C.atual]
      )
        mostra = sec;
    }
    const mi = caosConsoleMistura();
    if (mi && mi !== C.mist) caosConsoleLog("🎨 mistura: " + mi);
    C.mist = mi;
    C.mostraMed = mostra;
    C.mostra = caosConsoleRosto(mostra);
    C.hist.push(C.mostra);
    if (C.hist.length > 60) C.hist.shift();
  } catch (e) {}
}
function caosConsoleTingir(e, bank) {
  try {
    const C = caosConsole;
    if (!C || !C.on || C.atual === "calmo" || !e || e === C.mostra) return e;
    if (CAOS_ESCADA_LIVRE.test(String(bank || "")) || (typeof gameEnded !== "undefined" && gameEnded)) return e;
    const med = C.mostraMed,
      ok = (CAOS_TOM_POS.has(e) && CAOS_MED_POS.has(med)) || (CAOS_TOM_NEG.has(e) && CAOS_MED_NEG.has(med));
    if (!ok || !caosEmoVizinhos(e).has(C.mostra)) return e;
    const pr = Math.min(0.35, 0.1 + (C.g[med] - CAOS_CONSOLE_CFG.limiar) / 10);
    return Math.random() < pr ? C.mostra : e;
  } catch (err) {
    return e;
  }
}
function caosEmocaoGlobal() {
  let e = "calmo";
  try {
    e =
      caosConsole && caosConsole.on
        ? caosConsole.mostra
        : caosConsole && caosConsole.legN
          ? caosConsole.legMostra
          : caosEmocaoGlobalLegado();
  } catch (err) {
    e = "calmo";
  }
  if (e === "raiva" && typeof CURRENT_MODE !== "undefined" && CURRENT_MODE === "junior") e = "deboche";
  return e;
}
function caosSuaveAlvo(bank) {
  return (typeof CURRENT_MODE !== "undefined" && CURRENT_MODE === "junior") || /\.suave$/.test(String(bank || ""));
}
function caosConsoleSuavizar(e, bank) {
  if (!caosSuaveAlvo(bank)) return e;
  if (e === "raiva" || e === "furia") return "deboche";
  if (e === "nojo") return "ombros";
  if (e === "inveja") return "deboche";
  return e;
}
const caosEmoVizinhos = (e) => {
  const a = new Set((CAOS_EMO_VIZ[e] || "").split(" ").filter(Boolean));
  Object.keys(CAOS_EMO_VIZ).forEach((k) => {
    if ((CAOS_EMO_VIZ[k] || "").split(" ").includes(e)) a.add(k);
  });
  return a;
};
function caosEscada(emo, bank, forte) {
  if (!emo || !CAOS_EMOS[emo]) return emo;
  const antes = caosEmoFalaAtual;
  let fim = emo;
  const livre = forte || gameEnded || CAOS_ESCADA_LIVRE.test(String(bank || ""));
  if (antes && antes !== emo && !livre) {
    if (!caosEmoVizinhos(antes).has(emo)) {
      const vis = { [antes]: null },
        fila = [antes];
      while (fila.length) {
        const x = fila.shift();
        if (x === emo) break;
        caosEmoVizinhos(x).forEach((y) => {
          if (!(y in vis)) {
            vis[y] = x;
            fila.push(y);
          }
        });
      }
      if (emo in vis) {
        let passo = emo;
        while (vis[passo] !== antes && vis[passo] !== null) passo = vis[passo];
        fim = passo;
      }
    }
    if (
      (antes === "raiva" || antes === "furia") &&
      !["raiva", "furia", "recompondo"].includes(fim) &&
      Math.random() < 0.5
    )
      fim = "recompondo";
  }
  if (CURRENT_MODE === "junior" && (fim === "raiva" || fim === "furia")) fim = "deboche";
  caosEmoFalaN = fim === antes ? caosEmoFalaN + 1 : 1;
  caosEmoFalaAtual = fim;
  return fim;
}
function caosEmocaoDaFala(bank) {
  caosConsoleAvancar(bank);
  let e = null;
  const b = String(bank || "");
  if (b.startsWith("gerador.")) {
    const [, tipo, prat] = b.split(".");
    e =
      tipo === "acerto"
        ? "orgulho"
        : tipo === "pular"
          ? "ombros"
          : prat === "acido" || prat === "zero"
            ? "raiva"
            : "deboche";
  } else if (b.startsWith("perguntaMestre.")) {
    const sub = b.split(".")[1];
    e = /Suave$/.test(sub) ? "carinho" : sub === "longe" ? "deboche" : "desafio";
  } else if (b.startsWith("pausaVolta."))
    e = { leve: "deboche", magoado: "triste", puto: "raiva" }[b.split(".")[1]] || "deboche";
  else if (b === "pausaCalmou") e = "alivio";
  else if (b.startsWith("memoria.reencontro")) e = "nostalgia";
  else if (b.startsWith("ausentes."))
    e = { ambos: "pensando", anne: "carinho", jf: "deboche" }[b.split(".")[1]] || "calmo";
  else if (b.startsWith("satisfacao."))
    e = { ok: "carinho", mais: "desafio", menos: "recompondo" }[b.split(".")[1]] || "calmo";
  else if (b.startsWith("vinculo."))
    e =
      {
        naoEVoce: "espiando",
        defesaFav: "carinho",
        elogioContrariado: "inveja",
        acusa: "julgando",
        voltaAtras: "recompondo",
      }[b.split(".")[1]] || "calmo";
  else if (b.startsWith("hall."))
    e = { elogio: "orgulho", zoeira: "deboche", comentario: "pensando", eu: "orgulho" }[b.split(".")[1]] || "pensando";
  else if (b.startsWith("virada.")) e = (caosViradaPend && caosViradaPend.de) || null;
  else if (b === "mesa.apostaErrou") e = "vergonha";
  else if (b.startsWith("matrizHumor."))
    e =
      { frustrado: "raiva", orgulhoso: "orgulho", entediado: "tedio", desafiante: "desafio" }[b.split(".")[1]] || null;
  else if (b) e = CAOS_EMO_POR_BANCO[b.split(".")[0]] || null;
  if (!e) e = caosEmocaoGlobal();
  else e = caosConsoleTingir(e, bank);
  if (e === "raiva" && typeof CURRENT_MODE !== "undefined" && CURRENT_MODE === "junior") e = "deboche";
  return caosConsoleSuavizar(e, bank);
}
function caosToastEmo(toast, emo, bank) {
  try {
    if (caosAnimRodando.has(toast)) caosAnimParar(toast, false);
  } catch (e) {}
  const E = emo && CAOS_EMOS[emo];
  toast.classList.toggle("caos-emo", !!E);
  try {
    const rt0 = toast.querySelector(".toast-rotulo");
    if (rt0) {
      if (E) rt0.textContent = E.nome;
      else rt0.remove();
    }
  } catch (e) {}
  if (!E) {
    delete toast.dataset.emo;
    toast._frames = null;
    toast.removeAttribute("data-face");
    toast.style.removeProperty("--emo-cor");
    toast.style.removeProperty("--emo-bg");
    return;
  }
  toast.dataset.emo = emo;
  toast._frames = caosFaceEscolher(emo, bank);
  const f0 = toast._frames[0];
  toast.setAttribute("data-face", f0);
  toast.dataset.fl = toast._frames.some((f) => f.length > 9) ? "1" : "";
  toast.style.setProperty("--emo-cor", E.cor);
  toast.style.setProperty("--emo-bg", E.bg);
}
function caosViradaLimpar() {
  caosViradaDesde = 99;
  caosViradaPend = null;
}
function caosViradaDecidir(msg, emo, bank, priority, tropecou) {
  try {
    if (typeof msg !== "string" || msg.indexOf("[C.A.O.S.]") === -1 || !emo || !CAOS_EMOS[emo] || priority || tropecou)
      return null;
    const forca = caosViradaForcar === "auto",
      b = String(bank || "");
    if (caosViradaForcar === "manual") return null;
    if (!forca && caosViradaDesde < CAOS_VIRADA_ESPACO) return null;
    const hall = /^hall\./.test(b);
    if (CAOS_ESCADA_LIVRE.test(b) && !hall) return null;
    if (typeof gameEnded !== "undefined" && gameEnded && !hall) return null;
    const chunks = caosSpeechChunks(caosSpeechText(msg));
    if (chunks.length < 2) return null;
    if (!forca && Math.random() >= CAOS_VIRADA_P_AUTO) return null;
    const C = typeof caosConsole !== "undefined" && caosConsole ? caosConsole : null;
    let cand = [...caosEmoVizinhos(emo)].filter((e) => CAOS_EMOS[e] && e !== emo && e !== "furia");
    cand = cand
      .map((e) => ({ e, p: caosConsoleSuavizar(e, b) }))
      .filter((x) => CAOS_EMOS[x.p] && x.p !== emo && x.p !== "furia");
    if (!cand.length) return null;
    const med = (e) => (C && CAOS_CONSOLE_DE_ROSTO[e] ? C.g[CAOS_CONSOLE_DE_ROSTO[e]] || 0 : 0);
    const forte = Math.max(...cand.map((x) => med(x.p)));
    let pool = cand,
      pesos = null;
    if (forte >= CAOS_CONSOLE_CFG.limiar) pesos = cand.map((x) => 1 + Math.max(0, med(x.p) - 2) * 0.8);
    else {
      const d = cand.filter((x) => CAOS_VIRADA_DESINFLA.includes(x.p));
      if (d.length) pool = d;
    }
    let r = Math.random() * (pesos ? pesos.reduce((a, c) => a + c, 0) : pool.length),
      esc = pool[0];
    for (let i = 0; i < pool.length; i++) {
      r -= pesos ? pesos[i] : 1;
      if (r < 0) {
        esc = pool[i];
        break;
      }
    }
    const n = chunks.length;
    let corte = n - 1;
    if (n >= 3 && Math.random() < 0.3) corte = n - 2;
    const tot = chunks.reduce((a, c) => a + c.length, 0) || 1,
      ant = chunks.slice(0, corte).reduce((a, c) => a + c.length, 0);
    return { auto: true, de: emo, para: esc.p, corte, frac: ant / tot, banco: b };
  } catch (e) {
    return null;
  }
}
function caosViradaManual(msg, bank, priority) {
  try {
    if (priority || typeof msg !== "string" || msg.indexOf("[C.A.O.S.]") === -1 || !bank) return null;
    const b = String(bank),
      q = (CAOS_VIRADA_QUANDO.find((x) => x[1].test(b)) || [])[0];
    if (!q) return null;
    const forca = caosViradaForcar === "manual";
    if (caosViradaForcar === "auto") return null;
    if (q === "fim" ? !(typeof gameEnded !== "undefined" && gameEnded) : typeof gameEnded !== "undefined" && gameEnded)
      return null;
    if (!forca && Math.random() >= CAOS_VIRADA_P_MANUAL) return null;
    const suave = caosSuaveAlvo(b),
      nome =
        ((typeof players !== "undefined" && players) || [])
          .map((p) => p && p.name)
          .filter(Boolean)
          .find((nm) => msg.indexOf(nm) !== -1) || "";
    const deOrig = q === "pausa" ? { leve: "deboche", magoado: "triste", puto: "raiva" }[b.split(".")[1]] : null;
    const pool = CAOS_VIRADAS.filter(
      (x) =>
        x.quando === q &&
        !(suave && (CAOS_VIRADA_PROIBIDA.has(x.de) || CAOS_VIRADA_PROIBIDA.has(x.para))) &&
        (nome || !/\{n\}/.test(x.partes.join(" "))) &&
        (!deOrig || x.de === deOrig) &&
        CAOS_EMOS[x.de] &&
        CAOS_EMOS[x.para],
    );
    if (!pool.length) return null;
    const item = caosPickNR("virada." + q, pool),
      partes = item.partes.map((s) => s.replace(/\{n\}/g, nome)),
      junto = partes.join(" ");
    return {
      manual: true,
      quando: q,
      idx: CAOS_VIRADAS.indexOf(item),
      de: item.de,
      para: item.para,
      msg: "[C.A.O.S.] " + junto,
      depois: caosSpeechText(partes[1]),
      frac: partes[0].length / junto.length,
      banco: "virada." + q + (suave ? ".suave" : ""),
      origem: b,
    };
  } catch (e) {
    return null;
  }
}
function caosViradaTrocar(serial, v, origem) {
  try {
    if (!v || v.feita || !activeToastState || activeToastState.serial !== serial) return false;
    const toast = document.getElementById("jfToast");
    if (!toast || !toast.classList.contains("show") || toast.classList.contains("caos-thinking")) return false;
    v.feita = true;
    const A = CAOS_EMOS[v.de],
      B = CAOS_EMOS[v.para],
      a = A && caosHexRgb(A.cor),
      b = B && caosHexRgb(B.cor);
    caosToastEmo(toast, v.para, v.banco);
    if (a && b)
      caosAnimar(toast, {
        dur: CAOS_VIRADA_MS,
        ease: "ease-in-out",
        fill: true,
        frames: [
          [0, { "--emo-cor": a, "--emo-bg": A.bg }],
          [1, { "--emo-cor": b, "--emo-bg": B.bg }],
        ],
      });
    caosBip(v.para);
    caosEmoFalaAtual = v.para;
    if (v.auto) caosViradas.auto++;
    else caosViradas.manual++;
    if (v.linha) v.linha.v = v.de + "→" + v.para;
    caosLog("virada", `${v.de} → ${v.para} (${v.manual ? "manual " + v.quando : "auto"} · ${origem})`);
    return true;
  } catch (e) {
    return false;
  }
}
function caosViradaTempo(serial, v, ms) {
  const t = Math.max(
    1200,
    ms != null ? ms : (v.frac || 0.5) * ((activeToastState && activeToastState.displayMs) || 5e3),
  );
  setTimeout(() => caosViradaTrocar(serial, v, "tempo"), t);
}
function caosDuploPadrao(idx) {
  const agora = stats.totalDrawn,
    ant = caosDuploUlt;
  caosDuploUlt = { idx, carta: agora };
  if (!ant || ant.idx === idx || agora - ant.carta !== 1) return;
  if (CURRENT_MODE === "junior" || caosDuploN >= 2 || agora - caosDuploCarta < 5 || Math.random() > 0.6) return;
  const p = players[idx],
    q = players[ant.idx];
  if (!p || !q) return;
  const hp = playerHumor(p),
    hq = playerHumor(q),
    duro = (h) => h === "acido" || h === "zero";
  let su, ac, tipo;
  if (hp === "suave" && duro(hq)) {
    su = p;
    ac = q;
    tipo = "suaveAgora";
  } else if (duro(hp) && hq === "suave") {
    su = q;
    ac = p;
    tipo = "acidoAgora";
  } else return;
  const casal =
    players.length >= 3 && ((isJfName(ac.name) && isAnneName(su.name)) || (isAnneName(ac.name) && isJfName(su.name)));
  if (casal && Math.random() < 0.5) tipo = "casal";
  caosDuploN++;
  caosDuploCarta = agora;
  caosLog("duploPadrao", `${su.name} (Suave) × ${ac.name} (${playerHumor(ac)}) · ${tipo}`);
  caosFalarDepois(getRandomReaction(REACTIVE_VOICE.duploPadrao[tipo], su.name, ac.name));
}
function caosJogEmoRegistrar(idx, ev) {
  const p = players[idx];
  if (!p) return;
  if (!p.emo || typeof p.emo.h !== "string") p.emo = { h: "" };
  p.emo.h = (p.emo.h + ev).slice(-8);
  caosConsoleEvento(idx, ev);
  caosJogEmoAtualizar();
}
function caosJogEmoAtualizar() {
  if (!players.length) return;
  const cartas = typeof stats !== "undefined" && stats ? stats.totalDrawn : 0;
  const ord = players.map((p, i) => i).sort((a, b) => players[b].score - players[a].score);
  const lider = ord[0],
    lanterna = ord[ord.length - 1];
  const gap = players[lider].score - (players[ord[1]] ? players[ord[1]].score : 0);
  const escala = CURRENT_MODE === "express" ? 25 : 40;
  players.forEach((p, i) => {
    const h = (p.emo && p.emo.h) || "",
      ult = h.slice(-1),
      fim = (re) => (h.match(re) || [""])[0].length;
    let e = null;
    if (h.slice(-2).includes("X")) e = "palhaco";
    else if (fim(/[EX]+$/) >= 3) e = "tilt";
    else if (fim(/[Aa]+$/) >= 2 || ult === "a") e = "fogo";
    else if (fim(/P+$/) >= 2) e = "sumido";
    else if (players.length >= 3 && cartas >= 4 && i === lider && gap >= escala / 2 && ult !== "E") e = "lider";
    else if (players.length >= 3 && cartas >= 4 && i === lanterna && players[lider].score - p.score >= escala)
      e = "pressao";
    if (e !== (p.estadoEmocional || null)) {
      p.estadoEmocional = e;
      caosLog("jogador", `${p.name}: ${e ? JOG_EMOS[e].t : "neutro"}`);
    }
  });
}
function caosNeuralCriar() {
  const w = document.createElement("div");
  w.className = "ci-neural-wrap";
  w.innerHTML = '<canvas class="ci-neural" aria-hidden="true"></canvas><div class="ci-neural-lbl"></div>';
  caosNeuralDesenhar(w.firstChild, 0);
  return w;
}
function caosNeuralDesenhar(cv, t) {
  if (!cv || !cv.getContext) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1),
    W = cv.clientWidth || 300,
    H = cv.clientHeight || 110;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
  }
  const g = cv.getContext("2d");
  if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const emo = caosEmocaoGlobal(),
    E = CAOS_EMOS[emo] || CAOS_EMOS.calmo;
  const te = caosEmo.tensao,
    ca = caosEmo.calor,
    pa = caosEmo.paciencia ?? 7;
  const n = Math.round(10 + ca * 2.6),
    vel = 0.35 + te / 9,
    trem = Math.max(0, 6 - pa) * 0.7;
  if (!cv._pts) cv._pts = [];
  while (cv._pts.length < n)
    cv._pts.push({
      a: Math.random() * 6.283,
      r: 0.35 + Math.random() * 0.6,
      v: (0.5 + Math.random()) * (Math.random() < 0.5 ? -1 : 1),
      s: 1 + Math.random() * 1.8,
    });
  if (cv._pts.length > n) cv._pts.length = n;
  if (cv._emo && cv._emo !== emo) {
    cv._burst = (cv._burst || []).concat(
      Array.from({ length: 26 }, () => ({ a: Math.random() * 6.283, d: 0, v: 1.2 + Math.random() * 2.2, vida: 1 })),
    );
    caosLog("humor", "inspetor: " + cv._emo + " → " + emo);
  }
  cv._emo = emo;
  const dt = cv._t ? Math.min(0.1, (t - cv._t) / 1e3) : 0;
  cv._t = t;
  const cx = W / 2,
    cy = H / 2,
    R = Math.min(W / 2, H / 2) - 6,
    per = E.per / (0.7 + te / 10);
  const k = (1 - Math.cos((t / per) * 6.283)) / 2;
  g.clearRect(0, 0, W, H);
  const pos = cv._pts.map((p) => {
    p.a += p.v * vel * dt;
    const rr = p.r * R,
      jx = trem ? (Math.random() - 0.5) * trem : 0,
      jy = trem ? (Math.random() - 0.5) * trem : 0;
    return [cx + Math.cos(p.a) * rr * (W / H > 2 ? 2.4 : 1.3) + jx, cy + Math.sin(p.a) * rr * 0.85 + jy, p.s];
  });
  g.lineWidth = 0.6;
  g.strokeStyle = E.cor;
  for (let i = 0; i < pos.length; i++)
    for (let j = i + 1; j < pos.length; j++) {
      const dx = pos[i][0] - pos[j][0],
        dy = pos[i][1] - pos[j][1],
        d = dx * dx + dy * dy;
      if (d < 1800) {
        g.globalAlpha = 0.28 * (1 - d / 1800);
        g.beginPath();
        g.moveTo(pos[i][0], pos[i][1]);
        g.lineTo(pos[j][0], pos[j][1]);
        g.stroke();
      }
    }
  g.fillStyle = E.cor;
  pos.forEach(([x, y, sz]) => {
    g.globalAlpha = 0.85;
    g.beginPath();
    g.arc(x, y, sz, 0, 6.283);
    g.fill();
  });
  if (cv._burst && cv._burst.length) {
    cv._burst = cv._burst.filter((b) => {
      b.d += b.v * 60 * dt;
      b.vida -= dt * 0.9;
      if (b.vida <= 0) return false;
      g.globalAlpha = b.vida;
      g.beginPath();
      g.arc(cx + Math.cos(b.a) * b.d, cy + Math.sin(b.a) * b.d * 0.6, 1.8, 0, 6.283);
      g.fill();
      return true;
    });
  }
  const r0 = 14 + 6 * k * E.amp,
    grad = g.createRadialGradient(cx, cy, 0, cx, cy, r0 * 2.2);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.25, E.cor);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.globalAlpha = 0.9;
  g.fillStyle = grad;
  g.beginPath();
  g.arc(cx, cy, r0 * 2.2, 0, 6.283);
  g.fill();
  g.globalAlpha = 1;
  const wrap = cv.parentNode;
  if (wrap) {
    wrap.style.setProperty("--emo-cor", E.cor);
    wrap.style.setProperty("--emo-k", (k * E.amp).toFixed(3));
    if (cv._framesEmo !== emo || !cv._frames) {
      cv._framesEmo = emo;
      cv._frames = caosFaceEscolher(emo);
    }
    const lbl = wrap.querySelector(".ci-neural-lbl"),
      fr = cv._frames[Math.floor(t / E.fr) % cv._frames.length];
    const txt = `${fr}  ${E.nome.toUpperCase()}
tensão ${ciNum(te, 0)} · calor ${ciNum(ca, 0)} · paciência ${ciNum(pa, 0)}`;
    if (lbl && lbl.textContent !== txt) lbl.textContent = txt;
  }
}
function caosHumanizaReset() {
  caosNaoCurtiN = 0;
  caosNaoCurtiReacoes = 0;
  caosSegurou = false;
  caosPerguntaN = 0;
  caosPerguntaUlt = -99;
  caosPertoCont = {};
  caosImplic = null;
  caosSilencio = { ok: Math.random() < 0.4, usado: false };
  caosMagoa = 0;
  caosMagoaPico = 0;
  caosPausaInicio = null;
  caosPausaDegrau = -1;
  caosTropecos = { n: 0, ult: -99, nomes: {} };
}
function caosToastSegurarInicio() {
  clearTimeout(caosSeguraRef);
  if (!activeToastState) return;
  const t0 = Date.now();
  caosSeguraRef = setTimeout(() => {
    caosSegurou = true;
    setTimeout(() => {
      caosSegurou = false;
    }, 900);
    caosNaoCurti(t0);
  }, 700);
}
function caosToastSegurarFim() {
  clearTimeout(caosSeguraRef);
}
function caosNaoCurti(t0) {
  const st = activeToastState;
  if (!st) return;
  const msg = String(st.msg || "");
  if (msg.indexOf("[C.A.O.S.]") === -1) return;
  const sem = msg
    .replace(/\[C\.A\.O\.S\.\]\s*/g, "")
    .replace(/[⟦⟧]/g, "")
    .trim();
  let ent = null;
  for (let i = caosMatchLog.length - 1; i >= 0 && i >= caosMatchLog.length - 6; i--) {
    const e = caosMatchLog[i];
    if (e && e.text && sem.indexOf(e.text.slice(0, 60)) !== -1) {
      ent = e;
      break;
    }
  }
  if (!ent || (ent.rated && ent.r === -1)) return;
  const rapido = t0 - (st.shownAt || st.frozenAt || t0) < 1e3;
  caosNaoCurtiN++;
  const ruido = caosNaoCurtiN >= 5 && caosNaoCurtiN > caosMatchLog.length * 0.8;
  if (rapido || ruido) {
    ent.r = -1;
    ent.rated = true;
    ent.fraco = true;
    saveGameState();
  } else caosRate(ent, -1);
  ent.naHora = true;
  caosLog(
    "naoCurti",
    `${ent.bank}${rapido ? " (marcado em < 1 s: peso baixo)" : ""}${ruido ? " (80%+ das falas marcadas: ruído)" : ""} · ${ent.text.slice(0, 70)}`,
  );
  if (/^(acido|nivelZero)/.test(ent.bank) || /\.(acido|zero)$/.test(ent.bank))
    caosLog("naoCurti", "⚠️ fala Ácida/Nível 0 reprovada — conferir se ela chegou em alguém do Suave");
  caosEmoNudge(0.3, -0.4);
  caosVinculoNaoCurti();
  vibrar("erro");
  const toast = document.getElementById("jfToast");
  if (toast) {
    caosToastEmo(toast, "triste");
    const tag = document.createElement("span");
    tag.className = "toast-dislike";
    tag.textContent = "👎 anotado";
    toast.appendChild(tag);
  }
  if (/^implicancia/.test(ent.bank) && caosImplic && caosImplic.ativa) {
    caosImplic.dislikes++;
    if (caosImplic.dislikes >= 2) caosImplicLargar();
  }
  const reage = caosNaoCurtiN % 3 === 0 && caosNaoCurtiReacoes < 3 && !ruido;
  if (reage) caosNaoCurtiReacoes++;
  setTimeout(() => {
    if (activeToastState === st) closeActiveToast();
    if (reage) caosFalarDepois(getRandomReaction(REACTIVE_VOICE.naoCurti));
  }, 900);
}
function caosPerguntaTalvez(p, tipo) {
  if (!p || tipo || gameEnded || CURRENT_MODE === "express" || (currentCard && currentCard.isBonus)) return;
  const aperto = caosConsole && caosConsole.seqErr >= 2;
  if (
    caosPerguntaN >= (aperto ? 6 : 4) ||
    stats.totalDrawn - caosPerguntaUlt < (aperto ? 2 : 3) ||
    Math.random() > (aperto ? 0.65 : 0.35)
  )
    return;
  caosPerguntaN++;
  caosPerguntaUlt = stats.totalDrawn;
  document.getElementById("caosPergunta")?.remove();
  const d = document.createElement("div");
  d.id = "caosPergunta";
  d.className = "caos-pergunta";
  d.setAttribute("role", "group");
  d.innerHTML = `<span>🤖 Mestre, o chute de <b>${escapeHtml(p.name)}</b> foi…</span><button type="button" data-v="perto">🔥 Perto</button><button type="button" data-v="longe">🧊 Longe</button><button type="button" data-v="digitar">✏️ Digitar</button><button type="button" class="cp-x" data-v="x" aria-label="Fechar">✕</button>`;
  const nome = p.name;
  d.addEventListener("click", (ev) => {
    const bt = ev.target.closest("button");
    if (!bt) return;
    ev.stopPropagation();
    d.remove();
    if (bt.dataset.v === "digitar") caosChuteDigitar(nome);
    else if (bt.dataset.v !== "x") caosPerguntaResposta(nome, bt.dataset.v);
  });
  document.body.appendChild(d);
  setTimeout(() => {
    if (d.parentNode) d.remove();
  }, 9e3);
}
function caosPerguntaResposta(nome, v) {
  const p = players.find((q) => q.name === nome);
  if (!p || gameEnded) return;
  caosLog("perguntaMestre", `${nome}: ${v === "perto" ? "🔥 perto" : "🧊 longe"}`);
  const suave = playerHumor(p) === "suave",
    B = REACTIVE_VOICE.perguntaMestre;
  if (v === "perto") caosPertoCont[nome] = (caosPertoCont[nome] || 0) + 1;
  const bank =
    v === "perto"
      ? suave
        ? B.pertoSuave
        : caosPertoCont[nome] >= 2
          ? B.eternoQuase
          : B.perto
      : suave
        ? B.longeSuave
        : B.longe;
  const mestre = players[mestreIndex] ? players[mestreIndex].name : "o Mestre";
  caosEmoNudge(v === "perto" ? -0.2 : 0.3, v === "perto" ? 0.3 : 0);
  caosFalarDepois(getRandomReaction(bank, nome, mestre));
}
function caosCatDaCarta(c) {
  if (!c) return null;
  const k = CURRENT_MODE === "junior" ? c.category : gemCategoryFor(c.category);
  return k;
}
function caosImplicFlip() {
  if (CURRENT_MODE === "express" || gameEnded || !currentCard) return;
  if (!caosImplic) {
    const cats = [...new Set(deck.concat([currentCard]).map(caosCatDaCarta).filter(Boolean))];
    caosImplic =
      cats.length >= 2 && Math.random() < 0.75
        ? {
            cat: cats[Math.floor(Math.random() * cats.length)],
            ativa: true,
            anunciado: false,
            cartas: 0,
            avisei: false,
            dislikes: 0,
            anunciadoEm: -99,
          }
        : { ativa: false };
    if (caosImplic.ativa) caosLog("implicancia", "sorteada: " + caosImplic.cat);
  }
  const I = caosImplic;
  if (!I.ativa) return;
  if (!I.anunciado && stats.totalDrawn >= 2) {
    I.anunciado = true;
    I.anunciadoEm = stats.totalDrawn;
    caosFalarDepois(getRandomReaction(REACTIVE_VOICE.implicancia.anuncio, I.cat));
    return;
  }
  if (
    I.anunciado &&
    I.cartas < 2 &&
    stats.totalDrawn - I.anunciadoEm >= 2 &&
    caosCatDaCarta(currentCard) === I.cat &&
    Math.random() < 0.35
  ) {
    I.cartas++;
    caosFalarDepois(getRandomReaction(REACTIVE_VOICE.implicancia.carta, I.cat));
  }
}
function caosImplicFim(dicas) {
  const I = caosImplic;
  if (!I || !I.ativa || !I.anunciado || I.avisei || !currentCard) return;
  if (dicas >= 8 && caosCatDaCarta(currentCard) === I.cat && Math.random() < 0.6) {
    I.avisei = true;
    caosFalarDepois(getRandomReaction(REACTIVE_VOICE.implicancia.avisei, I.cat));
  }
}
function caosImplicLargar() {
  const I = caosImplic;
  if (!I || !I.ativa) return;
  I.ativa = false;
  caosLog("implicancia", "largada por 👎: " + I.cat);
  caosFalarDepois(getRandomReaction(REACTIVE_VOICE.implicancia.larguei, I.cat));
}
function caosSilencioTalvez(msg) {
  if (
    !caosSilencio.ok ||
    caosSilencio.usado ||
    gameEnded ||
    typeof msg !== "string" ||
    msg.indexOf("[C.A.O.S.]") === -1
  )
    return null;
  if (
    stats.totalDrawn < 6 ||
    !caosLastPick ||
    !/^(erro|erroComDica|erroComDicaNumero|erroComDicaCurta|acerto|acertoPorDicas|gerador\.)/.test(
      String(caosLastPick.bank),
    )
  )
    return null;
  if (Math.random() > 0.12) return null;
  caosSilencio.usado = true;
  const txt = getRandomReaction(REACTIVE_VOICE.silencio);
  caosLog("silencio", "escolheu não comentar (" + caosLastPick.bank + ")");
  caosLastPick = { bank: "silencio", key: "silencio|" + txt.slice(0, 40), text: txt };
  return txt;
}
function caosSplashFrases() {
  const h = new Date().getHours();
  const oi =
    h < 5
      ? ["espiando", "Madrugada e vocês aqui. Respeito."]
      : h < 12
        ? ["carinho", "Bom dia! Café e Perfil?"]
        : h < 18
          ? ["carinho", "Boa tarde! Bora uma partida?"]
          : ["desafio", "Boa noite! Partida rápida? (Nunca é rápida.)"];
  return [
    oi,
    ["espiando", "Tô de olho em quem vai ganhar hoje."],
    ["orgulho", "Eu comento. Vocês entretêm. Parceria justa."],
    ["desafio", "Aposto que ninguém acerta na 1ª dica."],
    ["festa", "Hoje tem joia, hein?"],
    ["julgando", "Vão começar sem ver o tutorial? Corajosos."],
    ["ombros", "Regras? Eu só narro."],
    ["tedio", "Tô esperando alguém tocar em Jogar…"],
  ];
}
function caosSplashMostrar(el, i) {
  const L = caosSplashFrases(),
    [emo, txt] = L[((i % L.length) + L.length) % L.length],
    E = CAOS_EMOS[emo] || CAOS_EMOS.calmo;
  el.dataset.emo = emo;
  el.style.setProperty("--emo-cor", E.cor);
  const f = el.querySelector(".sc-face"),
    t = el.querySelector(".sc-txt");
  el._frames = caosFaceEscolher(emo);
  if (f) f.textContent = el._frames[0];
  if (t) t.textContent = txt;
}
function caosSplashTick(el, t) {
  if (!caosSplashAt) caosSplashAt = t;
  if (t - caosSplashAt > 9e3) {
    caosSplashAt = t;
    caosSplashMostrar(el, ++caosSplashIdx);
  }
  const E = CAOS_EMOS[el.dataset.emo] || CAOS_EMOS.calmo,
    f = el.querySelector(".sc-face");
  const fs = el._frames || [E.faces[0]];
  if (f) {
    const fr = fs[Math.floor(t / (E.fr * 1.8)) % fs.length];
    if (f.textContent !== fr) f.textContent = fr;
  }
  el.style.setProperty("--emo-k", ((E.amp * (1 - Math.cos((t / E.per) * 2 * Math.PI))) / 2).toFixed(3));
}
function caosDicaRepetida(idx) {
  if (!currentCard || gameEnded || cardState !== "revealed" || pendingIndex !== null) return;
  const agora = Date.now();
  if (agora - caosRepetidaAt < 6e3 || caosRepetidaN >= 4) return;
  const e = revealedOrder.find((r) => r.index === idx);
  const v = players[responderIndex];
  if (!e || !v) return;
  caosRepetidaAt = agora;
  caosRepetidaN++;
  const B = REACTIVE_VOICE.dicaRepetida,
    dono = e.pickedByName || "alguém";
  let bank =
    playerHumor(v) === "suave" ? (dono === v.name ? B.suavePropria : B.suave) : dono === v.name ? B.propria : B.normal;
  if (bank === B.normal && (isJfName(v.name) || isAnneName(v.name)) && Math.random() < 0.6)
    bank = isJfName(v.name) ? B.sonso : B.sonsa;
  caosLog("dicaRepetida", `${v.name} tocou na dica ${idx + 1} (pedida por ${dono})`);
  showToastMessage(getRandomReaction(bank, v.name, dono), null, false, false, true);
}
function caosBezier(c, x) {
  if (x <= 0 || x >= 1) return x;
  const [x1, y1, x2, y2] = c,
    B = (t2, a, b) => 3 * a * t2 * (1 - t2) * (1 - t2) + 3 * b * t2 * t2 * (1 - t2) + t2 * t2 * t2;
  let t = x;
  for (let i = 0; i < 6; i++) {
    const dx = B(t, x1, x2) - x,
      d = 3 * x1 * (1 - t) * (1 - t) + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
    if (Math.abs(dx) < 1e-4 || Math.abs(d) < 1e-6) break;
    t -= dx / d;
  }
  if (t < 0 || t > 1 || Math.abs(B(t, x1, x2) - x) > 0.001) {
    let a = 0,
      b = 1;
    t = x;
    for (let i = 0; i < 20; i++) {
      const v = B(t, x1, x2);
      if (Math.abs(v - x) < 1e-4) break;
      if (v < x) a = t;
      else b = t;
      t = (a + b) / 2;
    }
  }
  return B(t, y1, y2);
}
function caosMistura(a, b, k) {
  if (typeof a === "number" && typeof b === "number") return +(a + (b - a) * k).toFixed(4);
  const sa = String(a),
    sb = String(b),
    na = sa.match(CAOS_NUM_RE) || [],
    nb = sb.match(CAOS_NUM_RE) || [];
  if (na.length !== nb.length || sa.replace(CAOS_NUM_RE, "#") !== sb.replace(CAOS_NUM_RE, "#"))
    return k < 0.5 ? sa : sb;
  let i = 0;
  return sa.replace(CAOS_NUM_RE, () => {
    const v = +na[i] + (+nb[i] - +na[i]) * k;
    i++;
    return String(+v.toFixed(4));
  });
}
function caosQuadro(spec, p) {
  const out = {},
    fr = spec.frames,
    ease = Array.isArray(spec.ease) ? spec.ease : CAOS_EASE[spec.ease] || CAOS_EASE.ease;
  const props = new Set();
  fr.forEach((f) => Object.keys(f[1]).forEach((k) => props.add(k)));
  props.forEach((prop) => {
    const tem = fr.filter((f) => prop in f[1]);
    let a = tem[0],
      b = tem[tem.length - 1];
    for (let i = 0; i < tem.length - 1; i++)
      if (p >= tem[i][0] && p <= tem[i + 1][0]) {
        a = tem[i];
        b = tem[i + 1];
        break;
      }
    if (p <= tem[0][0]) {
      out[prop] = tem[0][1][prop];
      return;
    }
    if (p >= b[0] && b === tem[tem.length - 1]) {
      out[prop] = b[1][prop];
      return;
    }
    const k = b[0] > a[0] ? caosBezier(ease, (p - a[0]) / (b[0] - a[0])) : 1;
    out[prop] = caosMistura(a[1][prop], b[1][prop], k);
  });
  return out;
}
function caosAnimPintar(el, q) {
  for (const k in q)
    el.style.setProperty(
      k,
      typeof q[k] === "number" && !k.startsWith("--") && k !== "opacity" ? q[k] + "px" : String(q[k]),
    );
}
function caosAnimParar(el, completou) {
  const r = caosAnimRodando.get(el);
  if (!r) return;
  caosAnimRodando.delete(el);
  if (!(completou && r.spec.fill))
    for (const k in r.orig) {
      if (r.orig[k]) el.style.setProperty(k, r.orig[k]);
      else el.style.removeProperty(k);
    }
  if (typeof r.fim === "function") {
    try {
      r.fim();
    } catch (e) {}
  }
}
function caosAnimTick(t) {
  caosAnimRaf = 0;
  caosAnimRodando.forEach((r, el) => {
    if (!el.isConnected || (r.sel && !el.matches(r.sel))) return caosAnimParar(el, false);
    const dt = t - r.t0 - (r.spec.delay || 0);
    if (dt < 0) return;
    let p = dt / r.spec.dur;
    if (r.spec.loop) p = p % 1;
    else if (p >= 1) {
      caosAnimPintar(el, caosQuadro(r.spec, 1));
      return caosAnimParar(el, true);
    }
    caosAnimPintar(el, caosQuadro(r.spec, p));
  });
  if (caosAnimRodando.size) caosAnimRaf = requestAnimationFrame(caosAnimTick);
}
function caosAnimar(el, spec, fim, sel) {
  try {
    if (!el) return;
    if (typeof spec === "string") spec = CAOS_ANIMS[spec];
    if (!spec) return;
    if (document.body.classList.contains("batata-mode")) {
      if (typeof fim === "function") fim();
      return;
    }
    caosAnimParar(el, false);
    const orig = {};
    spec.frames.forEach((f) =>
      Object.keys(f[1]).forEach((k) => {
        if (!(k in orig)) orig[k] = el.style.getPropertyValue(k);
      }),
    );
    const agora = performance.now();
    caosAnimRodando.set(el, { spec, t0: agora, orig, fim, sel });
    caosAnimPintar(el, caosQuadro(spec, 0));
    if (!caosAnimRaf) caosAnimRaf = requestAnimationFrame(caosAnimTick);
  } catch (e) {}
}
function caosIniExplica(p, tipo, ...args) {
  if (!p || !p.iniciante || !p.ini || gameEnded) return;
  const k = "x_" + tipo,
    feitas = p.ini.feitas || (p.ini.feitas = []);
  if (feitas.includes(k) || feitas.filter((x) => x.startsWith("x_")).length >= 8) return;
  const bank = REACTIVE_VOICE.iniciante.explica[tipo];
  if (!bank) return;
  feitas.push(k);
  caosLog("iniciante", `${p.name}: explicação "${tipo}"`);
  caosFalarDepois(getRandomReaction(bank, p.name, ...args));
  saveGameState();
}
function caosIniExplicaEspecial(p, texto) {
  if (!p || !p.iniciante) return;
  const t = String(texto || "").toLowerCase();
  if (/escolha um jogador para voltar/.test(t)) caosIniExplica(p, "escolherVoltar");
  else if (/escolha um jogador para avan/.test(t)) caosIniExplica(p, "escolherAvancar");
  else if (/^avance/.test(t)) caosIniExplica(p, "avancar");
  else if (/^volte/.test(t)) caosIniExplica(p, "voltar");
  else if (/perca sua vez/.test(t)) caosIniExplica(p, "perca");
}
function caosIniAjuda(p) {
  if (!p || !p.iniciante || gameEnded || stats.totalDrawn > 3 || CURRENT_MODE === "express") return "";
  caosMesa.iniErros = caosMesa.iniErros || {};
  const n = (caosMesa.iniErros[p.name] = (caosMesa.iniErros[p.name] || 0) + 1);
  if (n < 2 || !caosOncePerMatch("ini_ajuda_" + p.name)) return "";
  const m = players[mestreIndex];
  if (m && m !== p)
    setTimeout(() => caosBilheteMestre(getRandomReaction(REACTIVE_VOICE.iniciante.bilheteMestre, m.name, p.name)), 900);
  caosLog("iniciante", `${p.name}: ajuda direta (travou nas primeiras cartas)`);
  return getRandomReaction(REACTIVE_VOICE.iniciante.ajuda, p.name);
}
function caosBilheteMestre(txt) {
  if (!txt || gameEnded) return;
  document.getElementById("caosBilhete")?.remove();
  const d = document.createElement("div");
  d.id = "caosBilhete";
  d.className = "caos-bilhete";
  d.setAttribute("role", "note");
  const t = document.createElement("div");
  t.className = "caos-bilhete-tit";
  t.textContent = "🤫 Só pro Mestre ler (não lê em voz alta!)";
  const c = document.createElement("div");
  c.textContent = "🤖 " + String(txt).replace(/^\[C\.A\.O\.S\.\]\s*/, "");
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = "Li ✓";
  b.addEventListener("click", () => d.remove());
  d.append(t, c, b);
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 14e3);
}
function caosAntiRepeticao() {
  if (deck.length < 2) return;
  // nenhuma categoria sai mais de 2 vezes seguidas (no Express, com 1 ou 2 categorias, a regra é a de antes)
  const lim = 2,
    cat = (c) => gemCategoryFor(c.category);
  const cnt = {};
  deck.forEach((c) => {
    const k = cat(c);
    cnt[k] = (cnt[k] || 0) + 1;
  });
  const ult = caosCatSeq.slice(-lim),
    runCat = ult.length === lim && ult.every((x) => x === ult[0]) ? ult[0] : null;
  const topo = deck.length - 1,
    topCat = cat(deck[topo]);
  const ordem = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]),
    D = ordem[0],
    nD = cnt[D],
    nO = deck.length - nD;
  let alvo = null;
  if (runCat && topCat === runCat) alvo = ordem.find((k) => k !== runCat) || null;
  else if (D !== topCat && D !== runCat && nD > lim * nO) alvo = D;
  if (!alvo || alvo === topCat) return;
  for (let j = topo - 1; j >= 0; j--) {
    if (cat(deck[j]) === alvo) {
      const t = deck[topo];
      deck[topo] = deck[j];
      deck[j] = t;
      caosLog("baralho", `anti-repetição: puxei ${alvo} pra frente`);
      return;
    }
  }
}
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
  else if (isAnneName(name) && p.avatar === "👸") bank = n > 0 && R() < 0.4 ? B.anneVolta : B.anne;
  else if (isJfName(name) && p.avatar === "😎") bank = REACTIVE_VOICE.nickReacao.jf;
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
      return caosOncePerMatch("egg_jf_inicio") ? getRandomReaction(REACTIVE_VOICE.jfInicio) : "";
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
      return getRandomReaction(REACTIVE_VOICE.inicioJogadores[key]);
    }
    case "mestre": {
      const m = players[mestreIndex];
      return m ? getRandomReaction(REACTIVE_VOICE.inicioMestre, m.name) : "";
    }
    case "primeiro": {
      const r = players[responderIndex];
      return r ? getRandomReaction(REACTIVE_VOICE.inicioPrimeiro, r.name) : "";
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
      return REACTIVE_VOICE.inicioModo[k] ? getRandomReaction(REACTIVE_VOICE.inicioModo[k]) : "";
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
function caosChatterText() {
  const p = players[responderIndex];
  const nome = p ? p.name : "galera";
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
  const total = timerKind === "pick" ? PICK_TIME_LIMIT + (oldSchoolAcess ? 15 : 0) : RESPONSE_TIME_LIMIT;
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
    reactionMsg = getRandomReaction(REACTIVE_VOICE.jfAcerto);
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
function caosPickNR(chave, arr) {
  if (!arr || !arr.length) return "";
  const mem = caosPickNRMem[chave] || (caosPickNRMem[chave] = []),
    janela = Math.min(arr.length - 1, Math.floor(arr.length * 0.6));
  let i,
    g = 0;
  do {
    i = Math.floor(Math.random() * arr.length);
  } while (mem.includes(i) && ++g < 30);
  mem.push(i);
  while (mem.length > janela) mem.shift();
  return arr[i];
}
function caosFalavel(d) {
  caosFalaveis.push(d);
  return ` data-fala="${caosFalaveis.length - 1}" role="button" tabindex="0"`;
}
function caosComentFato(d) {
  const n = d.n,
    v = caosNumBR(d.v),
    pl = (k, a, b) => (k === 1 ? a : b);
  switch (d.t) {
    case "rapido":
      return { fr: `${n} acertou${d.x ? " " + d.x : ""} em ${v} segundos`, np: `acertar em ${v} segundos` };
    case "sequencia":
      return { fr: `${n} emendou ${v} acertos seguidos`, np: `emendar ${v} acertos seguidos` };
    case "placar":
      return { fr: `${n} fez ${v} pontos numa partida do ${d.x}`, np: `fazer ${v} pontos no ${d.x}` };
    case "sniper":
      return {
        fr: `${n} já acertou ${v} ${pl(d.v, "carta", "cartas")} logo na 1ª dica`,
        np: `acertar de primeira ${v} ${pl(d.v, "vez", "vezes")}`,
      };
    case "rival":
      return { fr: `${n} e ${d.n2} trocaram a liderança ${v} vezes` };
    case "bola":
      return { fr: `eu acertei ${d.a} de ${d.tot} previsões` };
    case "campeao":
      return {
        fr: `${n} tem ${v} ${pl(d.v, "vitória", "vitórias")} em ${d.x} ${pl(d.x, "partida", "partidas")}`,
        np: `ganhar ${v} de ${d.x}`,
      };
    case "sorteadas":
      return { fr: d.v === 1 ? "saiu uma carta só nessa partida" : `saíram ${v} cartas nessa partida` };
    case "duracao":
      return {
        fr:
          d.v >= 60
            ? `a partida passou de uma hora (${v} minutos)`
            : d.v < 1
              ? "a partida durou menos de um minuto"
              : `a partida durou ${v} ${pl(d.v, "minuto", "minutos")}`,
      };
    case "respondidas":
      return {
        fr:
          d.v === 0 ? "nenhuma carta foi acertada" : `${v} ${pl(d.v, "carta foi acertada", "cartas foram acertadas")}`,
      };
    case "semdono":
      return {
        fr: d.v === 0 ? "nenhuma carta ficou sem dono" : `${v} ${pl(d.v, "carta ficou", "cartas ficaram")} sem dono`,
      };
    case "pulos":
      return d.v === 0
        ? { fr: "ninguém passou dica nessa partida" }
        : n
          ? {
              fr: `a mesa passou ${v} ${pl(d.v, "dica", "dicas")}, e ${n} passou ${d.x}`,
              np: `passar ${d.x} ${pl(d.x, "dica", "dicas")}`,
            }
          : { fr: `a mesa passou ${v} ${pl(d.v, "dica", "dicas")}` };
    case "absurdos":
      return d.v === 0
        ? { fr: "não teve nenhum Absurdo na partida" }
        : n
          ? {
              fr: `${d.v === 1 ? "teve 1 Absurdo" : `foram ${v} Absurdos`}, ${d.x} de ${n}`,
              np: `levar ${d.x} ${pl(d.x, "Absurdo", "Absurdos")}`,
            }
          : { fr: `foram ${v} Absurdos na partida` };
    case "rapida":
      return { fr: `${n} matou ${d.x} em ${v} segundos`, np: `acertar ${d.x} em ${v} segundos` };
    case "facil":
      return {
        fr: `${d.x} caiu com ${v} ${pl(d.v, "dica", "dicas")}, na mão de ${n}`,
        np: `acertar ${d.x} com ${v} ${pl(d.v, "dica", "dicas")}`,
      };
    case "dificil":
      return { fr: `${d.x} precisou de ${v} dicas até ${n} acertar`, np: `precisar de ${v} dicas pra ${d.x}` };
    case "mvp":
      return { fr: `${n} fez média de ${v} pontos por acerto`, np: `fazer média de ${v} por acerto` };
    case "muralha":
      return {
        fr: `as cartas lidas por ${n} pediram ${v} dicas em média`,
        np: `ler cartas que pedem ${v} dicas em média`,
      };
    case "precoce":
      return { fr: `${n} errou ${v} vezes chutando na 1ª dica`, np: `chutar na 1ª dica ${v} vezes` };
    case "inimizade":
      return { fr: `${n} levou ${v} Absurdos em ${d.x}`, np: `brigar com ${d.x}` };
    case "laudos":
      return { fr: `eu emiti ${v} ${pl(d.v, "laudo", "laudos")} nessa partida` };
  }
  return null;
}
function caosComentarGerar(d) {
  const fato = caosComentFato(d);
  if (!fato) return "";
  let tom = CAOS_COMENT_TOM[d.t] || "comentario";
  if (tom === "zoeira" && d.v === 0) tom = "comentario";
  const minS = (t) =>
    (d.n && t.indexOf(d.n) === 0) || (d.x && String(t).indexOf(String(d.x)) === 0) ? t : caosLexMin(t);
  const capS = (t) => caosLexCap(t);
  const p = d.n ? players.find((x) => nameKeyPlain(x.name) === nameKeyPlain(d.n)) : null;
  let prat = p ? caosPrateleira(p) : CURRENT_MODE === "junior" ? "suave" : "normal";
  if (prat === "zero") prat = "acido";
  const J = CAOS_COMENT.juizo[tom];
  const quem = [d.n, d.n2].find((x) => x && isJfName(x))
    ? "jf"
    : [d.n, d.n2].find((x) => x && isAnneName(x))
      ? "anne"
      : null;
  const Pp = quem && CAOS_COMENT.pessoal[quem][tom === "eu" ? "comentario" : tom];
  let juizo =
    Pp && Math.random() < 0.7
      ? caosPickNR("cp." + quem + "." + tom, Pp)
      : caosPickNR("cj." + tom + "." + prat, J[prat] || J.normal);
  const abre = Math.random() < 0.55 ? caosPickNR("ca", CAOS_COMENT.abre) + " " : "";
  let gancho = "";
  if (d.n && tom !== "eu" && Math.random() < 0.4)
    gancho =
      " " +
      caosPickNR(p ? "cgp" : "cga", p ? CAOS_COMENT.ganchoPresente : CAOS_COMENT.ganchoAusente).replace(/\{n\}/g, d.n);
  else if (tom === "elogio" && Math.random() < 0.25) gancho = " " + caosPickNR("cgg", CAOS_COMENT.ganchoGeral);
  const cola = (t) => (abre && /[,:…]\s*$/.test(abre) ? abre + minS(t) : abre + capS(t));
  const moldes = [
    () => `${cola(fato.fr)}. ${juizo}${gancho}`,
    () => `Pelos meus registros: ${minS(fato.fr)}. ${juizo}`,
    () => `${capS(fato.fr)}. ${juizo}${gancho}`,
  ];
  if (fato.np && d.n) moldes.push(() => `${d.n}, ${fato.np}? ${juizo}${gancho}`);
  if (d.titulo) moldes.push(() => `${d.titulo}: ${minS(fato.fr)}. ${juizo}`);
  let txt = "";
  for (let g = 0; g < 6; g++) {
    txt = caosPickNR("cm", moldes)().replace(/\s+/g, " ").replace(/\.\./g, ".").trim();
    if (txt !== caosComentUlt) break;
  }
  if (caosHasProfanity(txt, [d.n || "", d.n2 || ""])) return "";
  caosComentUlt = txt;
  txt = "[C.A.O.S.] " + txt;
  caosLastPick = { bank: "hall." + tom, key: "hall|" + tom + (quem ? "|" + quem : ""), text: txt };
  return txt;
}
function caosComentarFalavel(i) {
  const d = caosFalaveis[+i];
  if (!d) return;
  if (Date.now() - caosComentAt < 700) return;
  caosComentAt = Date.now();
  const txt = caosComentarGerar(d);
  if (!txt) return;
  if (activeToastState) closeActiveToast();
  caosComentandoHall = true;
  try {
    showToastMessage(txt, null, true);
  } finally {
    caosComentandoHall = false;
  }
}
function caosLigarFalaveis(raiz) {
  (raiz || document).querySelectorAll("[data-fala]").forEach((el) => {
    el.addEventListener("click", () => caosComentarFalavel(el.dataset.fala));
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        caosComentarFalavel(el.dataset.fala);
      }
    });
  });
}
function caosMomentoCritico() {
  try {
    if (gameEnded) return !caosComentandoHall;
    if (CURRENT_MODE === "express" || WIN_CONDITION !== "casa" || !boardCountsForWin() || !(WINNING_SCORE > 0))
      return false;
    return players.some((p) => p && typeof p.position === "number" && WINNING_SCORE - p.position <= 20);
  } catch (e) {
    return false;
  }
}
function caosTropeco(msg, bank) {
  try {
    if (typeof msg !== "string" || msg.indexOf("[C.A.O.S.]") !== 0 || msg.length > 150 || msg.length < 24) return msg;
    if (/^escolha(Tomada|Exclusiva)/.test(String(bank || ""))) return msg; // aviso do cadastro: sem tropeço
    const nLog = caosMatchLog ? caosMatchLog.length : 0;
    if (caosTropecos.n >= 5 || nLog - caosTropecos.ult < 8 || caosMomentoCritico() || Math.random() > 0.08) return msg;
    const corpo = msg.slice("[C.A.O.S.]".length).trim(),
      b = String(bank || ""),
      junior = CURRENT_MODE === "junior";
    const ops = [];
    if (!junior && players.length >= 3) {
      const jaFalou = (nm) => (caosMatchLog || []).some((l) => String(l.text || "").indexOf(nm) !== -1);
      const livre = (p) => p && p.name && !isJfName(p.name) && !isAnneName(p.name);
      const alvo = players.find(
        (p) =>
          livre(p) &&
          !caosTropecos.nomes[p.name] &&
          jaFalou(p.name) &&
          new RegExp(
            "(^|[^\\p{L}\\p{N}])" + p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\p{L}\\p{N}])",
            "u",
          ).test(corpo),
      );
      if (alvo) {
        const outros = players.filter((p) => p !== alvo && livre(p) && corpo.indexOf(p.name) === -1);
        if (outros.length)
          ops.push({
            w: 3,
            f: () => {
              const o = outros[Math.floor(Math.random() * outros.length)].name;
              caosTropecos.nomes[alvo.name] = 1;
              const i = corpo.indexOf(alvo.name);
              return corpo.slice(0, i) + o + "… quer dizer, " + alvo.name + corpo.slice(i + alvo.name.length);
            },
          });
      }
    }
    const mn = !junior && corpo.match(/(^|[^\d,.:])(\d{1,2})(?![\d,.:ºª°%])/);
    if (mn && +mn[2] >= 2 && +mn[2] <= 60)
      ops.push({
        w: 2,
        f: () => {
          const k = +mn[2],
            errado = Math.random() < 0.5 ? k - 1 : k + 1,
            i = mn.index + mn[1].length;
          return corpo.slice(0, i) + errado + "… não, " + k + corpo.slice(i + mn[2].length);
        },
      });
    ops.push({ w: 2, f: () => caosLexPick(CAOS_TROPECO.fio) + " " + corpo });
    ops.push({ w: 3, f: () => corpo.replace(/\s*$/, "") + " " + caosLexPick(CAOS_TROPECO.arrep) });
    if (!junior && /^(acerto|gerador\.acerto)/.test(b))
      ops.push({ w: 2, f: () => caosLexPick(CAOS_TROPECO.interpAcerto) + " " + corpo });
    if (!junior && /^(erro|gerador\.erro)/.test(b))
      ops.push({ w: 2, f: () => caosLexPick(CAOS_TROPECO.interpErro) + " " + corpo });
    const tot = ops.reduce((a, o) => a + o.w, 0);
    let r = Math.random() * tot,
      op = ops[0];
    for (const o of ops) {
      r -= o.w;
      if (r <= 0) {
        op = o;
        break;
      }
    }
    const novo = op.f();
    if (!novo || novo === corpo) return msg;
    caosTropecos.n++;
    caosTropecos.ult = nLog;
    caosLog("tropeco", "🫠 " + novo.slice(0, 80));
    return "[C.A.O.S.] " + novo;
  } catch (e) {
    return msg;
  }
}
function caosAuditoriaHtml() {
  let h = "";
  const placa = (ic, tit, nome, det, cor, fala) =>
    `<li class="hall-placa hall-largo falavel" style="--hc:${cor};"${caosFalavel(fala)}><span class="hall-ic">${ic}</span><span class="hall-tit">${tit}</span><span class="hall-nome">${nome}</span><span class="hall-det">${det}</span></li>`;
  const pre = Object.entries(caosMesa.precoce || {}).sort((a, b) => b[1] - a[1])[0];
  if (pre && pre[1] >= 2)
    h += placa(
      "🎯",
      "Chutador(a) precoce",
      `<b>${escapeHtml(pre[0])}</b>`,
      `errou ${pre[1]} vezes chutando na 1ª dica lida`,
      "#fb7185",
      { t: "precoce", n: pre[0], v: pre[1], titulo: "Chutador precoce" },
    );
  const ab = Object.entries(caosMesa.absCat || {}).sort((a, b) => b[1] - a[1])[0];
  if (ab && ab[1] >= 2) {
    const [nome, cat] = ab[0].split("|");
    h += placa(
      "🧬",
      `Inimizade com ${escapeHtml(CAOS_CAT_MATERIA[cat] || cat)}`,
      `<b>${escapeHtml(nome)}</b>`,
      `${ab[1]} Absurdos em ${escapeHtml(CAOS_CAT_NOME[cat] || cat)}`,
      "#f472b6",
      { t: "inimizade", n: nome, v: ab[1], x: CAOS_CAT_MATERIA[cat] || cat, titulo: "Inimizade" },
    );
  }
  const diag = Object.keys(caosMesa.diag || {});
  if (diag.length)
    h += placa(
      "🩺",
      "Laudos do C.A.O.S.",
      `<b>${diag.length}</b>`,
      diag
        .map((k) => {
          const [n, c] = k.split("|");
          return escapeHtml(n) + " (" + escapeHtml(CAOS_CAT_NOME[c] || c) + ")";
        })
        .join(" · "),
      "#94a3b8",
      { t: "laudos", v: diag.length, titulo: "Meus laudos" },
    );
  return h;
}
function caosModalBase() {
  const ov = document.createElement("div");
  ov.className = "caos-modal-ov";
  ov.style.cssText =
    "position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box";
  const box = document.createElement("div");
  box.style.cssText =
    "background:#1a1a2e;color:#fff;border:1px solid #f87171;border-radius:16px;padding:22px 20px;max-width:380px;width:100%;max-height:90vh;overflow:auto;text-align:center;font-family:inherit;box-shadow:0 10px 40px rgba(0,0,0,.6);box-sizing:border-box";
  ov.appendChild(box);
  return { ov, box };
}
function caosModalBtn(t, bg, fn) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = t;
  b.style.cssText =
    "flex:1;padding:12px 8px;border:0;border-radius:10px;font-size:1rem;font-weight:700;color:#fff;background:" +
    bg +
    ";cursor:pointer";
  b.addEventListener("click", fn);
  return b;
}
function caosModalMsg(t) {
  const p = document.createElement("p");
  p.textContent = t;
  p.style.cssText = "margin:0 0 16px;font-size:1.05rem;line-height:1.4;white-space:pre-line;word-break:break-word";
  return p;
}
function caosModalRow() {
  const r = document.createElement("div");
  r.style.cssText = "display:flex;gap:10px";
  return r;
}
function caosConfirmarModal(msg, txtSim, txtNao, onSim) {
  const antigo = document.getElementById("caosConfirmModal");
  if (antigo) antigo.remove();
  const { ov, box } = caosModalBase();
  ov.id = "caosConfirmModal";
  const fechar = () => {
    ov.remove();
  };
  const row = caosModalRow();
  row.append(
    caosModalBtn(txtNao, "#444a66", fechar),
    caosModalBtn(txtSim, "#dc2626", () => {
      fechar();
      onSim();
    }),
  );
  box.append(caosModalMsg(msg), row);
  ov.addEventListener("click", (e) => {
    if (e.target === ov) fechar();
  });
  document.body.appendChild(ov);
}
function caosAvisoModal(msg, onOk) {
  const { ov, box } = caosModalBase();
  ov.classList.add("caos-aviso-ov");
  const row = caosModalRow();
  row.append(
    caosModalBtn("OK", "#2563eb", () => {
      ov.remove();
      if (onOk) onOk();
    }),
  );
  box.append(caosModalMsg(msg), row);
  document.body.appendChild(ov);
}
function caosPromptModal(msg, valor, cb, leitura) {
  const { ov, box } = caosModalBase();
  const inp = document.createElement(leitura ? "textarea" : "input");
  if (!leitura) inp.type = "text";
  inp.value = valor || "";
  if (leitura) {
    inp.readOnly = true;
    inp.rows = 5;
  }
  inp.style.cssText =
    "width:100%;box-sizing:border-box;padding:10px;margin:0 0 16px;border-radius:8px;border:1px solid #555a7a;background:#0f0f1e;color:#fff;font-size:16px;font-family:inherit";
  const fim = (v) => {
    ov.remove();
    cb(v);
  };
  const row = caosModalRow();
  if (leitura) {
    row.append(caosModalBtn("Fechar", "#444a66", () => fim(null)));
  } else {
    row.append(
      caosModalBtn("Cancelar", "#444a66", () => fim(null)),
      caosModalBtn("OK", "#2563eb", () => fim(inp.value)),
    );
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        fim(inp.value);
      }
    });
  }
  box.append(caosModalMsg(msg), inp, row);
  document.body.appendChild(ov);
  setTimeout(() => {
    try {
      inp.focus();
      if (leitura) inp.select();
    } catch (e) {}
  }, 50);
}
function caosRate(entry, val) {
  const R = caosRatingsLoad();
  const rec = R[entry.key] || (R[entry.key] = { up: 0, down: 0, bank: entry.bank, sample: entry.text.slice(0, 120) });
  if (entry.rated) {
    if (entry.r === 1) rec.up = Math.max(0, rec.up - 1);
    if (entry.r === -1) rec.down = Math.max(0, rec.down - 1);
  }
  entry.r = val;
  entry.rated = true;
  if (val === 1) rec.up++;
  if (val === -1) rec.down++;
  try {
    JFStore.setItem(CAOS_RATINGS_KEY, JSON.stringify(R));
  } catch (e) {}
  saveGameState();
}
function caosReviewReport() {
  const nota = (e) => (!e.rated ? "—" : e.r === 1 ? "👍" : e.r === -1 ? "👎" : "😐");
  const modo =
    { classico: "Clássico", hardcore: "Hardcore", junior: "Júnior", express: "Express", oldschool: "Old School" }[
      CURRENT_MODE
    ] || CURRENT_MODE;
  const up = caosMatchLog.filter((e) => e.rated && e.r === 1).length,
    down = caosMatchLog.filter((e) => e.rated && e.r === -1).length;
  const meh = caosMatchLog.filter((e) => e.rated && e.r === 0).length,
    sem = caosMatchLog.filter((e) => !e.rated).length;
  const porBanco = {};
  caosMatchLog.forEach((e) => {
    const b = porBanco[e.bank] || (porBanco[e.bank] = { n: 0, up: 0, down: 0 });
    b.n++;
    if (e.rated && e.r === 1) b.up++;
    if (e.rated && e.r === -1) b.down++;
  });
  const linhas = [
    "PERFIL JF — RELATÓRIO DO C.A.O.S. (Beta 1.7.5 · C.A.O.S. 3.8)",
    `Data: ${new Date().toLocaleString("pt-BR")} · Modo: ${modo} (${CURRENT_FORMAT === "equipe" ? "Equipe" : "Versus"}) · Jogadores: ${players.length} · Cartas: ${stats.totalDrawn} · Falas: ${caosMatchLog.length}`,
    `Notas: 👍 ${up} · 😐 ${meh} · 👎 ${down} · sem nota ${sem}`,
    "",
    "FALAS (carta · nota · banco · texto):",
    ...caosMatchLog.map(
      (e, i) =>
        `${String(i + 1).padStart(2, "0")}. ${e.n > 0 ? "c" + e.n : "cadastro"} · ${nota(e)} · ${e.bank} · ${e.text}`,
    ),
    "",
    "POR BANCO (falas · 👍 · 👎):",
    ...Object.entries(porBanco)
      .sort((a, b) => b[1].n - a[1].n)
      .map(([k, v]) => `${k}: ${v.n} · ${v.up} · ${v.down}`),
  ];
  return linhas.join("\n");
}
function caosPausaHumorIniciar() {
  caosPausaParar();
  caosPausaInicio = Date.now();
  caosPausaDegrau = -1;
  const box = document.getElementById("pausaCaos");
  if (box) {
    box.style.display = "none";
    box.classList.remove("show");
  }
  caosPausaTimer = setInterval(caosPausaHumorTick, 5e3);
}
function caosPausaParar() {
  if (caosPausaTimer) {
    clearInterval(caosPausaTimer);
    caosPausaTimer = null;
  }
}
function caosPausaHumorTick() {
  if (!caosPausaInicio || gameEnded || document.getElementById("pauseScreen").style.display !== "block") return;
  const seg = (Date.now() - caosPausaInicio) / 1e3;
  let alvo = -1;
  CAOS_PAUSA_DEGRAUS.forEach((g, i) => {
    if (seg >= g.s) alvo = i;
  });
  if (alvo <= caosPausaDegrau) return;
  for (let i = caosPausaDegrau + 1; i <= alvo; i++) {
    const [dt, dc, dp] = CAOS_PAUSA_DEGRAUS[i].d;
    caosEmoNudge(dt, dc);
    caosPacienciaNudge(dp);
  }
  caosPausaDegrau = alvo;
  if (caosSilenced) return;
  const box = document.getElementById("pausaCaos");
  if (!box) return;
  let emo = CAOS_PAUSA_DEGRAUS[alvo].emo;
  if (CURRENT_MODE === "junior" && (emo === "raiva" || emo === "furia")) emo = "deboche";
  const txt = getRandomReaction(REACTIVE_VOICE.pausaHumor["s" + alvo]);
  if (!txt) return;
  box.style.display = "";
  box.classList.add("show");
  caosToastEmo(box, emo, alvo >= 5 ? "erroEscalada" : null);
  box.textContent = String(txt).replace(/[⟦⟧]/g, "");
  caosLog("pausa", `😤 pausa longa (degrau ${alvo + 1}, ${Math.round(seg)} s): ${emo}`);
}
function caosPausaHumorVoltar(vinhaExpirada) {
  caosPausaParar();
  const d = caosPausaDegrau;
  caosPausaInicio = null;
  caosPausaDegrau = -1;
  const box = document.getElementById("pausaCaos");
  if (box) {
    box.style.display = "none";
    box.classList.remove("show");
  }
  if (d < 0) return;
  caosMagoa = Math.max(caosMagoa, d + 2);
  caosMagoaPico = Math.max(caosMagoaPico, d);
  if (vinhaExpirada || caosSilenced || gameEnded) return;
  const nivel = d >= 4 ? "puto" : d >= 2 ? "magoado" : "leve";
  caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.pausaVolta[nivel]), 450, "media");
}
function caosRetaFinalTalvez() {
  try {
    if (
      CURRENT_MODE === "express" ||
      CURRENT_FORMAT === "equipe" ||
      WIN_CONDITION !== "casa" ||
      !boardCountsForWin() ||
      !(WINNING_SCORE > 0) ||
      gameEnded
    )
      return;
    const p = players
      .filter(
        (x) =>
          x && typeof x.position === "number" && WINNING_SCORE - x.position > 0 && WINNING_SCORE - x.position <= 20,
      )
      .sort((a, b) => b.position - a.position)
      .find((x) => !caosEasterEggsUsed.has("reta_" + x.name));
    if (!p || !caosOncePerMatch("reta_" + p.name)) return;
    caosFalaAgendar(
      () => getRandomReaction(REACTIVE_VOICE.retaFinal, p.name, WINNING_SCORE - p.position),
      900,
      "media",
    );
  } catch (e) {}
}
function caosVinculoReset() {
  caosVinc = {
    fav: null,
    motivo: "",
    negados: {},
    ress: {},
    desafeto: null,
    desafetoFoi: null,
    acusou: {},
    cartaUlt: -99,
    favFoi: null,
    decepcionou: false,
  };
}
function caosVincElegivelDesafeto(p) {
  return p && !p.iniciante && CURRENT_MODE !== "junior" && playerHumor(p) !== "suave";
}
function caosVinculoSortear() {
  if (caosVinc.fav || caosVinc.decepcionou || players.length < 2) return;
  const pesos = players.map(
    (p2) => 1 + Math.min(10, memContaFicha(p2) && fichaGet(p2.name) ? fichaGet(p2.name).partidas : 0) * 0.3,
  );
  let r = Math.random() * pesos.reduce((a, b) => a + b, 0),
    idx = 0;
  for (let i = 0; i < pesos.length; i++) {
    r -= pesos[i];
    if (r <= 0) {
      idx = i;
      break;
    }
  }
  const p = players[idx],
    f = memContaFicha(p) && fichaGet(p.name);
  const motivos = [
    idx === 0 ? "foi a primeira pessoa a entrar no cadastro" : null,
    p.avatar ? `o ${p.avatar} do avatar me ganhou` : null,
    `o nick tem ${p.name.length} letras, meu número da sorte de hoje`,
    f && f.partidas >= 3 ? `a gente já jogou ${f.partidas} partidas` : null,
    "escolheu uma cor bonita",
  ].filter(Boolean);
  caosVinc.fav = p.name;
  caosVinc.motivo = motivos[Math.floor(Math.random() * motivos.length)];
  caosLog("vinculo", "💘 favorito secreto: " + p.name + " (" + caosVinc.motivo + ")");
}
function caosVincEhFav(p) {
  return !!(p && caosVinc && caosVinc.fav && nameKeyPlain(p.name) === nameKeyPlain(caosVinc.fav));
}
function caosVinculoCarta() {
  try {
    if (!starterChosen || gameEnded) return;
    caosVinculoSortear();
    const neg = Object.keys(caosVinc.negados).length;
    if (
      players.length >= 3 &&
      CURRENT_MODE !== "junior" &&
      stats.totalDrawn >= 3 &&
      neg < players.length - 2 &&
      stats.totalDrawn - caosVinc.cartaUlt >= 4 &&
      Math.random() < 0.08
    ) {
      const cand = players.filter(
        (p) => !caosVincEhFav(p) && !caosVinc.negados[p.name] && !p.iniciante && playerHumor(p) !== "suave",
      );
      if (cand.length) {
        const p = cand[Math.floor(Math.random() * cand.length)];
        caosVinc.negados[p.name] = 1;
        caosVinc.cartaUlt = stats.totalDrawn;
        caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.vinculo.naoEVoce, p.name), 1200, "baixa");
      }
    }
  } catch (e) {}
}
function caosVincRessent(p, q, motivo) {
  if (!p || !caosVincElegivelDesafeto(p) || caosVincEhFav(p)) return;
  const n = p.name;
  caosVinc.ress[n] = Math.min(6, (caosVinc.ress[n] || 0) + q);
  if (!caosVinc.desafeto && caosVinc.ress[n] >= 3) {
    caosVinc.desafeto = n;
    caosVinc.desafetoFoi = n;
    caosLog("vinculo", "😒 desafeto da partida: " + n + " (" + motivo + ")");
  }
}
function caosVinculoErro(p, tipo) {
  if (!p) return;
  const idx = players.indexOf(p);
  if (
    caosVincEhFav(p) &&
    !caosVinc.decepcionou &&
    tipo !== "absurdo" &&
    tipo !== "pular" &&
    idx >= 0 &&
    caosTrailing(idx, "M") >= 3
  ) {
    caosVinc.favFoi = p.name;
    caosVinc.fav = null;
    caosVinc.decepcionou = true;
    caosLog("vinculo", "💔 favorito decepcionou: " + p.name);
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.vinculo.decepcao, p.name), 1300, "media");
    return;
  }
  if (tipo === "absurdo") caosVincRessent(p, 1, "Absurdo");
  else if (tipo === "pular") caosVincRessent(p, 0.5, "pulou");
  else if (idx >= 0 && caosTrailing(idx, "M") >= 3) caosVincRessent(p, 0.5, "erros seguidos");
  if (caosVincEhFav(p) && tipo !== "absurdo" && Math.random() < 0.08 && stats.totalDrawn - caosVinc.cartaUlt >= 3) {
    caosVinc.cartaUlt = stats.totalDrawn;
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.vinculo.defesaFav, p.name), 1400, "baixa");
  }
}
function caosVinculoAcerto(idx) {
  const p = players[idx];
  if (!p || !caosVinc) return;
  const n = p.name;
  if (caosVinc.ress[n]) caosVinc.ress[n] = Math.max(0, caosVinc.ress[n] - 0.7);
  if (caosVinc.desafeto === n) {
    if (Math.random() < 0.35)
      caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.vinculo.elogioContrariado, n), 1600, "baixa");
    if ((caosVinc.ress[n] || 0) < 1.5) {
      caosVinc.desafeto = null;
      caosLog("vinculo", "🤝 " + n + " se redimiu");
    }
  }
}
function caosVinculoCorte() {
  const m = mestreIndex !== null && mestreIndex !== void 0 ? players[mestreIndex] : null;
  if (m) caosVincRessent(m, 1, "cortou a fala");
}
function caosVinculoNaoCurti() {
  const m = mestreIndex !== null && mestreIndex !== void 0 && starterChosen && !gameEnded ? players[mestreIndex] : null;
  if (!m || !caosVincElegivelDesafeto(m)) return;
  caosVincRessent(m, 1, "👎 (palpite: quem segurava o celular)");
  if (!caosVinc.acusou[m.name] && Math.random() < 0.4) {
    caosVinc.acusou[m.name] = 1;
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.vinculo.acusa, m.name), 1800, "baixa");
    const serV = caosPartidaSerial;
    if (Math.random() < 0.3)
      setTimeout(() => {
        if (!gameEnded && serV === caosPartidaSerial && caosVinc) {
          caosVinc.ress[m.name] = Math.max(0, (caosVinc.ress[m.name] || 0) - 1);
          showToastMessage(getRandomReaction(REACTIVE_VOICE.vinculo.voltaAtras, m.name));
        }
      }, 26e3);
  }
}
function caosVinculoResenha(f, pick, suave) {
  if (!caosVinc || !caosVinc.fav) return;
  f.push(
    pick([
      `Confissão: meu favorito da noite era ${caosVinc.fav}. Motivo: ${caosVinc.motivo}. Sim, é um motivo bobo.`,
      `Agora eu posso contar: meu favorito era ${caosVinc.fav}. Por quê? ${caosLexCap(caosVinc.motivo)}. Critério científico.`,
    ]),
  );
  if (caosVinc.desafetoFoi && !suave)
    f.push(
      pick([
        `E ${caosVinc.desafetoFoi}: a gente teve nossos momentos. Página virada. Quase.`,
        `${caosVinc.desafetoFoi}, sem ressentimentos. Poucos. Tá, alguns. Mas a gente se entende.`,
      ]),
    );
}
function caosAusentesTalvez() {
  try {
    if (stats.totalDrawn !== 2 || !caosOncePerMatch("ausentes") || CURRENT_MODE === "junior") return;
    const fichas = Object.values(fichasTodas() || {}),
      jaJogou = (f) => fichas.some((x) => x && x.nome && f(x.nome));
    const temJf = players.some((p) => isJfName(p.name)),
      temAnne = players.some((p) => isAnneName(p.name));
    const conheceJf = jaJogou(isJfName),
      conheceAnne = jaJogou(isAnneName);
    let bank = null;
    if (!temJf && !temAnne && conheceJf && conheceAnne && Math.random() < 0.6) bank = REACTIVE_VOICE.ausentes.ambos;
    else if (temJf && !temAnne && conheceAnne && Math.random() < 0.45) bank = REACTIVE_VOICE.ausentes.anne;
    else if (!temJf && temAnne && conheceJf && Math.random() < 0.45) bank = REACTIVE_VOICE.ausentes.jf;
    if (bank) caosToastAtrasado(() => showToastMessage(getRandomReaction(bank)), 1500);
  } catch (e) {}
}
function caosSatisfacaoTalvez() {
  try {
    if (gameEnded || stats.totalDrawn < 4 || document.getElementById("caosPergunta")) return;
    const p = players.find((x) => x && x.humorCaos && !x.humorPergunta && !x.iniciante);
    if (!p || Math.random() > 0.3) return;
    p.humorPergunta = true;
    const d = document.createElement("div");
    d.id = "caosPergunta";
    d.className = "caos-pergunta";
    d.setAttribute("role", "group");
    const fechar = () => d.remove(),
      nome = p.name;
    const passo1 = () => {
      d.innerHTML = `<span>🤖 <b>${escapeHtml(nome)}</b>, tá curtindo o jeito que eu tô te tratando?</span><button type="button" data-v="sim">👍 Tô</button><button type="button" data-v="nao">👎 Não</button>`;
    };
    const ordem =
      CURRENT_MODE === "junior"
        ? ["familia", "suave", "normal"]
        : CURRENT_MODE === "hardcore"
          ? ["normal", "acido", "zero"]
          : ["suave", "normal", "acido"];
    // Nível 0 fica acima de tudo; fora do Hardcore ele não está na escada do sorteio.
    const degrau = (h) => (ordem.includes(h) ? ordem.indexOf(h) : h === "zero" ? ordem.length : 0);
    const passo2 = () => {
      const i = degrau(humorEscolhido(p));
      const bts = [];
      if (i < ordem.length - 1) bts.push('<button type="button" data-v="mais">⬆️ Pode pegar mais pesado</button>');
      if (i > 0) bts.push('<button type="button" data-v="menos">⬇️ Pega mais leve</button>');
      d.innerHTML = `<span>🤖 Quer que eu mude, <b>${escapeHtml(nome)}</b>?</span>${bts.join("")}<button type="button" data-v="igual">Deixa assim</button>`;
    };
    d.addEventListener("click", (ev) => {
      const b = ev.target.closest("button");
      if (!b) return;
      ev.stopPropagation();
      const v = b.dataset.v,
        q = players.find((x) => x.name === nome);
      if (!q) return fechar();
      if (v === "nao") return passo2();
      fechar();
      const i = degrau(humorEscolhido(q));
      if (v === "mais" && i < ordem.length - 1) q.humor = ordem[i + 1];
      if (v === "menos" && i > 0) q.humor = ordem[i - 1];
      caosLog("satisfacao", `${nome}: ${v} → ${q.humor}`);
      saveGameState();
      renderScoreboard && renderScoreboard();
      caosFalarDepois(
        getRandomReaction(REACTIVE_VOICE.satisfacao[v === "mais" ? "mais" : v === "menos" ? "menos" : "ok"], nome),
      );
    });
    passo1();
    document.body.appendChild(d);
    setTimeout(() => {
      if (d.isConnected) d.remove();
    }, 14e3);
  } catch (e) {}
}
function caosPausaMagoaCarta() {
  if (caosMagoa <= 0) return;
  const f = 1 / caosMagoa;
  caosEmo.tensao = caosEmoClamp(caosEmo.tensao + (5 - caosEmo.tensao) * f);
  caosEmo.calor = caosEmoClamp(caosEmo.calor + (5 - caosEmo.calor) * f);
  caosEmo.paciencia = caosEmoClamp((caosEmo.paciencia ?? 7) + (7 - (caosEmo.paciencia ?? 7)) * f);
  caosMagoa--;
  if (caosMagoa === 0) {
    const pico = caosMagoaPico;
    caosMagoaPico = 0;
    if (pico >= 2 && !caosSilenced && Math.random() < 0.6)
      caosToastAtrasado(() => showToastMessage(getRandomReaction(REACTIVE_VOICE.pausaCalmou)), 1600);
  }
}
function caosLed(on) {
  try {
    const l = document.getElementById("caosStatusLed");
    if (!l) return;
    clearInterval(caosLedT);
    l.classList.toggle("on", !!on);
    l.classList.remove("alt");
    if (on) caosLedT = setInterval(() => l.classList.toggle("alt"), 380);
  } catch (e) {}
}
function caosMarcadoRedencao(idx, clues) {
  try {
    if (caosMarked.idx === null || caosMarked.idx !== idx || clues > 2) return;
    const p = players[idx];
    if (!p) return;
    caosPrevMarkedIdx = idx;
    caosMarked.idx = null;
    caosMarked.remaining = 0;
    caosLog("marcado", "redenção: " + p.name + " acertou com " + clues + " dica(s)");
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.marcadoRedencao, p.name), 900, "media");
  } catch (e) {}
}
function caosDescansoRegistrar() {
  try {
    if (!caosPartidaInicioAt || !stats || stats.totalDrawn < 5) return;
    const agora = Date.now();
    let rec = [];
    try {
      rec = JSON.parse(JFStore.getItem("perfil5_caos_fimsrecentes") || "[]");
    } catch (e) {}
    rec = (Array.isArray(rec) ? rec : [])
      .filter((t) => typeof t === "number" && agora - t < 72e5)
      .concat(agora)
      .slice(-6);
    JFStore.setItem("perfil5_caos_fimsrecentes", JSON.stringify(rec));
    const dur = caosMinutosAtivos();
    if (dur < 60 && rec.length < 3) return;
    JFStore.setItem(
      CAOS_DESCANSO_KEY,
      JSON.stringify({ fim: agora + CAOS_DESCANSO_MIN * 6e4, min: CAOS_DESCANSO_MIN }),
    );
    caosLog(
      "descanso",
      "exige " +
        CAOS_DESCANSO_MIN +
        " min (" +
        (dur >= 60 ? "partida de " + Math.round(dur) + " min" : "3 partidas em 2 h") +
        ")",
    );
    const ser = caosPartidaSerial;
    setTimeout(() => {
      if (ser !== caosPartidaSerial || !gameEnded) return;
      showToastMessage(getRandomReaction(REACTIVE_VOICE.descanso.exige, CAOS_DESCANSO_MIN), null, true);
    }, 14e3);
  } catch (e) {}
}
function caosDescansoChecar() {
  caosDescansoFalou = false;
  try {
    const raw = JFStore.getItem(CAOS_DESCANSO_KEY);
    if (!raw) return;
    JFStore.removeItem(CAOS_DESCANSO_KEY);
    const d = JSON.parse(raw);
    if (!d || typeof d.fim !== "number") return;
    const agora = Date.now();
    if (agora - d.fim > 72e5) return;
    const falta = Math.max(0, Math.ceil((d.fim - agora) / 6e4));
    let bank,
      args = [];
    if (falta > 3) {
      const fr = Math.min(1, falta / CAOS_DESCANSO_MIN);
      caosEmo.tensao = caosEmoClamp(5 + 3 * fr);
      caosEmo.paciencia = caosEmoClamp(7 - 4 * fr);
      caosEmo.calor = caosEmoClamp(5 - 2 * fr);
      caosSentir("raiva", falta > 8 ? 2 : 1, "intervalo interrompido");
      bank = REACTIVE_VOICE.descanso.interrompido;
      args = [falta];
    } else if (falta > 0) {
      caosEmo.tensao = caosEmoClamp(6);
      caosEmo.paciencia = caosEmoClamp(5);
      bank = REACTIVE_VOICE.descanso.quase;
      args = [falta];
    } else {
      caosEmo.tensao = caosEmoClamp(3);
      caosEmo.paciencia = caosEmoClamp(9);
      caosEmo.calor = caosEmoClamp(7);
      bank = REACTIVE_VOICE.descanso.respeitado;
    }
    caosLog("descanso", "início: faltavam " + falta + " min");
    caosDescansoFalou = true;
    caosFalaAgendar(() => getRandomReaction(bank, ...args), 2500, "sempre");
  } catch (e) {}
}
function caosMagoaFim() {
  try {
    if (CURRENT_MODE === "junior") return;
    players.forEach((p) => {
      if (!memContaFicha(p) || p.iniciante) return;
      const cortes = (caosCortes && caosCortes.por && caosCortes.por[p.name]) || 0;
      const mag = cortes >= 4 || (caosVinc && caosVinc.desafetoFoi === p.name);
      fichaUpd(p.name, (f) => {
        f.magoa = mag ? Math.min(3, (f.magoa || 0) + 1) : Math.max(0, (f.magoa || 0) - 1);
      });
    });
  } catch (e) {}
}
function caosMagoaInicio() {
  try {
    if (CURRENT_MODE === "junior" || caosDescansoFalou) return;
    const p = players.find(
      (x) =>
        !x.iniciante && playerHumor(x) !== "suave" && memContaFicha(x) && ((fichaGet(x.name) || {}).magoa || 0) >= 1,
    );
    if (!p) return;
    caosCortes.rancor[p.name] = true;
    caosLog("magoa", "começa magoado com " + p.name);
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.memoria.magoado, p.name), 4500, "sempre");
  } catch (e) {}
}
function caosMinutosAtivos() {
  return Math.max(0, (Date.now() - (caosPartidaInicioAt || Date.now()) - (caosPausaAcum || 0)) / 6e4);
}
function caosNomeMestre() {
  return players[mestreIndex] ? players[mestreIndex].name : "o Mestre";
}
function caosFalaBotao(botao, resto) {
  return "[C.A.O.S.] Atenção, mesa! O Mestre, " + caosNomeMestre() + ", apertou " + botao + ". " + resto;
}
function caosConfirmarComVoz(msg, txtSim, txtNao, onSim, fala) {
  const limpa = String(fala || "").replace(/^\[C\.A\.O\.S\.\]\s*/, "");
  caosConfirmarModal(msg + (limpa ? "\n\n🤖 " + limpa : ""), txtSim, txtNao, () => {
    caosVoiceCancel();
    onSim();
  });
  try {
    const ov = document.getElementById("caosConfirmModal");
    if (ov) ov.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => caosVoiceCancel()));
  } catch (e) {}
  if (fala) caosFalarNormal(fala);
}
function caosSilenciarCarta() {
  if (caosMudoCarta || gameEnded || !starterChosen) return;
  caosVoiceCancel();
  const quem = players[mestreIndex] ? players[mestreIndex].name : null;
  caosMudoCarta = true;
  caosMudoPor = quem;
  try {
    caosLog("silenciado", "C.A.O.S. silenciado nesta carta por " + (quem || "?"));
  } catch (e) {}
  try {
    closeActiveToast();
  } catch (e) {}
  try {
    caosRegistrarCorte();
  } catch (e) {}
  try {
    showToastMessage("🔇 C.A.O.S. silenciado até o fim desta carta.", null, true);
  } catch (e) {}
  saveGameState();
}
function caosMudoVolta() {
  if (!caosMudoCarta) return;
  caosMudoCarta = false;
  const quem = caosMudoPor;
  caosMudoPor = null;
  try {
    caosEmoNudge(3, -1.2);
    caosSentir("raiva", 2.5, "foi silenciado");
    caosSentir("tristeza", 1.2, "foi silenciado");
    if (quem) caosCortes.rancor[quem] = true;
  } catch (e) {}
  const p = quem && players.find((x) => x.name === quem);
  if (p && playerHumor(p) === "zero" && !p.iniciante) {
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.silenciaramVoltaZero, quem), 700, "sempre");
    return;
  }
  if (p && (playerHumor(p) === "suave" || p.iniciante)) {
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.silenciaramVoltaSuave, quem), 700, "sempre");
    return;
  }
  caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.silenciaramVolta, quem || "Mestre"), 700, "sempre");
}
function caosChuteAnalisar(chute, resposta, cat) {
  const g = caosChuteNorm(chute),
    r = caosChuteNorm(resposta);
  if (!g) return { tipo: "vazio" };
  if (cat === "ANO" || /^\d{3,4}$/.test(r)) {
    const gn = parseInt((g.match(/\d{1,4}/) || [])[0], 10),
      rn = parseInt((r.match(/\d{1,4}/) || [])[0], 10);
    if (isFinite(gn) && isFinite(rn) && gn !== rn) {
      const d = Math.abs(gn - rn);
      const tipo = d <= 2 ? "anoTrave" : d <= 10 ? "anoPerto" : d <= 50 ? "anoMedio" : d <= 300 ? "anoLonge" : "anoEra";
      return { tipo, d, antes: gn < rn, gn };
    }
    if (gn === rn) return { tipo: "igual" };
  }
  if (g === r) return { tipo: "igual" };
  const gt = g.split(" ").filter((x) => x.length >= 3),
    rt = r.split(" ").filter((x) => x.length >= 3);
  const comum = gt.filter((x) => rt.some((y) => y === x || y.startsWith(x) || x.startsWith(y)));
  if ((comum.length && comum.length < Math.max(rt.length, 1)) || (comum.length && gt.length < rt.length))
    return { tipo: "parte" };
  const sim = 1 - caosLev(g, r) / Math.max(g.length, r.length, 1);
  if (sim >= 0.62) return { tipo: "parecido" };
  if (g[0] && g[0] === r[0] && sim >= 0.3) return { tipo: "inicial" };
  return { tipo: "longe" };
}
function caosChuteResponder(nome, chute) {
  const p = players.find((q) => q.name === nome);
  if (!p || gameEnded || !currentCard) return;
  const cat = gemCategoryFor ? gemCategoryFor(currentCard.category) : currentCard.category;
  const an = caosChuteAnalisar(chute, currentCard.answer, cat),
    B = REACTIVE_VOICE.chute;
  const suave = playerHumor(p) === "suave";
  const g = String(chute).trim().slice(0, 30);
  caosLog("chute", nome + " chutou '" + g + "' → " + an.tipo + (an.d != null ? " (" + an.d + " anos)" : ""));
  let banco = null;
  if (an.tipo.startsWith("ano")) banco = B[an.tipo];
  else banco = B[an.tipo];
  if (!banco || !banco.length) return;
  const fraseSuave = suave && B[an.tipo + "Suave"];
  const lista = fraseSuave && fraseSuave.length ? fraseSuave : banco;
  caosEmoNudge(an.tipo === "longe" || an.tipo === "anoEra" ? 0.3 : -0.2, an.tipo === "longe" ? 0 : 0.3);
  caosFalarDepois(getRandomReaction(lista, nome, g, an.d || 0, an.antes ? "antes" : "depois"));
}
function caosChuteDigitar(nome) {
  caosPromptModal("O que " + nome + " chutou? (o C.A.O.S. não ouve, então conta pra ele)", "", (v) => {
    if (v == null) return;
    const t = String(v).trim();
    if (!t) return;
    caosChuteResponder(nome, t);
  });
}
function closeActiveToast() {
  if (!activeToastState) return;
  const { hadActiveTimer, afterClose, deferred, frozenAt, freezeEndedAt, frozenTimerSerial, frozenCardSerial } =
    activeToastState;
  activeToastState = null;
  if (toastTimeoutRef) {
    clearTimeout(toastTimeoutRef);
    toastTimeoutRef = null;
  }
  const toast = document.getElementById("jfToast");
  if (toast) toast.classList.remove("show");
  if (hadActiveTimer) {
    const frozenMs = Math.max(0, (freezeEndedAt || Date.now()) - frozenAt);
    if (cardEndAt && cardSerial === frozenCardSerial) cardEndAt += frozenMs;
    if (timerEndAt && timerSerial === frozenTimerSerial) {
      timerEndAt += frozenMs;
      if (typeof pendingStartTime === "number" && pendingStartTime !== null) pendingStartTime += frozenMs;
      resumeTimerInterval();
      updateTimerDisplay();
    } else if (cardEndAt && !timerInterval && CURRENT_MODE === "express" && cardState === "revealed") {
      resumeTimerInterval();
    }
  }
  if (typeof afterClose === "function") afterClose();
  if (deferred && deferred.length)
    deferred.forEach((fn) => {
      if (typeof fn === "function") fn();
    });
  caosFilaProxima();
}
function showToastMessage(msg, afterClose, bypassSilence, priority, noFreeze) {
  if (caosSorteioSilencio && !bypassSilence) {
    if (typeof afterClose === "function") afterClose();
    return;
  }
  if (caosMudoCarta && !bypassSilence && !priority && typeof msg === "string" && msg.indexOf("[C.A.O.S.]") !== -1) {
    if (typeof afterClose === "function") afterClose();
    return;
  }
  if (caosSilenced && !bypassSilence) {
    if (typeof afterClose === "function") afterClose();
    return;
  }
  if (!msg) {
    if (typeof afterClose === "function") afterClose();
    return;
  }
  if (
    typeof msg === "string" &&
    msg.indexOf("[C.A.O.S.]") !== -1 &&
    !priority &&
    !bypassSilence &&
    caosToastBloquear()
  ) {
    if (typeof afterClose === "function") afterClose();
    return;
  }
  if (
    CURRENT_MODE === "express" &&
    !priority &&
    !bypassSilence &&
    cardState === "revealed" &&
    !gameEnded &&
    String(msg).length > 150
  ) {
    caosLog("express", "fala longa cortada: " + String(msg).slice(0, 60));
    if (typeof afterClose === "function") afterClose();
    return;
  }
  if (activeToastState && activeToastState.priority && !priority) {
    if (typeof afterClose === "function") activeToastState.deferred.push(afterClose);
    return;
  }
  if (!priority && !bypassSilence && activeToastState && !activeToastState.priority) {
    if (typeof afterClose !== "function" && String(msg).indexOf("[C.A.O.S.]") !== -1) {
      caosFilaGuardar(msg, noFreeze);
      return;
    }
    const vis = Date.now() - (activeToastState.shownAt || activeToastState.frozenAt);
    const alvoLeitura = caosLeituraMinMs(activeToastState);
    if (vis < alvoLeitura) {
      const carta = stats.totalDrawn;
      const tentar = () => {
        if (gameEnded) return;
        if (document.getElementById("pauseScreen").style.display === "block") {
          setTimeout(tentar, 1e3);
          return;
        }
        if (
          stats.totalDrawn - carta >= 2 ||
          (stats.totalDrawn !== carta && cardState === "revealed" && revealedOrder.length > 0)
        ) {
          if (typeof afterClose === "function") afterClose();
          return;
        }
        showToastMessage(msg, afterClose, bypassSilence, priority, noFreeze);
      };
      setTimeout(tentar, alvoLeitura - vis + 60);
      return;
    }
  }
  for (let guard = 0; activeToastState && guard < 4; guard++) {
    if (guard > 0 && activeToastState.priority && !priority) {
      if (typeof afterClose === "function") activeToastState.deferred.push(afterClose);
      return;
    }
    closeActiveToast();
  }
  if (!priority && !bypassSilence) {
    const sil = caosSilencioTalvez(msg);
    if (sil) msg = sil;
  }
  let caosBancoFala =
    caosLastPick && String(msg).indexOf(String(caosLastPick.text).replace(/^\[C\.A\.O\.S\.\]\s*/, "")) !== -1
      ? caosLastPick.bank
      : null;
  const viradaManual = caosViradaManual(msg, caosBancoFala, priority);
  if (viradaManual) {
    msg = viradaManual.msg;
    caosBancoFala = viradaManual.banco;
    caosLastPick = { bank: viradaManual.banco, key: "virada|" + viradaManual.idx, text: msg };
    caosViradaPend = viradaManual;
  }
  const caosEmoFala =
    typeof msg === "string" && msg.indexOf("[C.A.O.S.]") !== -1
      ? caosEscada(caosEmocaoDaFala(caosBancoFala), caosBancoFala, priority)
      : null;
  caosViradaPend = null;
  const msgAntesTropeco = msg;
  if (!priority && !viradaManual) msg = caosTropeco(msg, caosBancoFala);
  const tropecou = msg !== msgAntesTropeco;
  if (
    caosEmoFala &&
    caosUltEmojiAdd &&
    msg.endsWith(" " + caosUltEmojiAdd) &&
    Math.max(0, Math.min(1, caosEmoK(caosEmoFala))) +
      (CAOS_EMO_GRAVE[String(caosBancoFala || "").split(".")[0]] || 0) >=
      0.75
  ) {
    msg = msg.slice(0, -(caosUltEmojiAdd.length + 1));
    caosUltEmojiAdd = "";
  }
  if (caosEmoFala) caosViradaDesde++;
  const virada = viradaManual || caosViradaDecidir(msg, caosEmoFala, caosBancoFala, priority, tropecou);
  caosLogMatchLine(msg);
  if (virada) {
    virada.linha = caosMatchLog[caosMatchLog.length - 1] || null;
    caosViradaDesde = 0;
  }
  let toast = document.getElementById("jfToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "jfToast";
    toast.className = "jf-toast-overlay";
    toast.setAttribute("role", "status");
    toast.title = "Toque pra pular a fala";
    toast.addEventListener("click", caosPularFala);
    toast.addEventListener("pointerdown", caosToastSegurarInicio);
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => toast.addEventListener(ev, caosToastSegurarFim));
    toast.addEventListener("contextmenu", (ev) => ev.preventDefault());
    document.body.appendChild(toast);
  }
  const displayMs = Math.max(4200, Math.min(msg.length > 200 ? 12e3 : msg.length > 140 ? 1e4 : 8e3, msg.length * 90));
  const hadActiveTimer = !noFreeze && !!timerInterval && !!timerEndAt;
  if (hadActiveTimer) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  toast.style.borderColor = "";
  caosToastEmo(toast, caosEmoFala, caosBancoFala);
  caosToastTexto(toast, msg);
  const serial = ++toastSerial;
  if (caosEmoFala) caosBip(caosEmoFala);
  caosEixosDaFala(caosBancoFala);
  caosConsoleDaFala(caosBancoFala);
  if (tropecou && caosEmoFala) caosSentir("vergonha", 5.5, "gafe");
  if (tropecou && caosEmoFala && toast.dataset.emo) {
    toast._frames = ["(・・?)", "(・・ )?"];
    toast.setAttribute("data-face", toast._frames[0]);
    setTimeout(() => {
      if (activeToastState && activeToastState.serial === serial) {
        const ev = caosConsole && caosConsole.on ? "vergonha" : caosEmoFala;
        caosToastEmo(toast, ev, caosBancoFala);
        caosEmoFalaAtual = ev;
      }
    }, 1100);
  }
  activeToastState = {
    hadActiveTimer,
    displayMs,
    afterClose,
    priority: !!priority,
    deferred: [],
    serial,
    frozenAt: Date.now(),
    freezeEndedAt: null,
    frozenTimerSerial: timerSerial,
    frozenCardSerial: cardSerial,
  };
  caosUltimaFalaAt = Date.now();
  caosFalasRecentes.push(caosUltimaFalaAt);
  activeToastState.msg = msg;
  activeToastState.virada = virada || null;
  const caosDelay = caosReactionDelay(msg);
  activeToastState.shownAt = Date.now() + caosDelay;
  if (caosDelay > 0) {
    caosToastTexto(toast, "💭 ···");
    toast.classList.add("show", "caos-thinking");
    if (caosEmoFala) caosToastEmo(toast, "pensando");
    caosLed(true);
    setTimeout(() => {
      caosLed(false);
      if (!activeToastState || activeToastState.serial !== serial) return;
      toast.classList.remove("caos-thinking");
      caosToastEmo(toast, caosEmoFala, caosBancoFala);
      caosToastTexto(toast, msg);
      caosFalarComBalao(msg, serial, virada);
    }, caosDelay);
  } else {
    toast.classList.remove("caos-thinking");
    toast.classList.add("show");
    caosFalarComBalao(msg, serial, virada);
  }
  toastTimeoutRef = setTimeout(() => {
    if (activeToastState && activeToastState.serial === serial) closeActiveToast();
  }, displayMs + caosDelay);
}

