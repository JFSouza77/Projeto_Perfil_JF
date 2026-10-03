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
// Mistura cujo rosto saiu na última escolha (o balão mostra o nome dela na etiqueta).
let caosFaceMist = null;
function caosFaceEscolher(emo, bank) {
  caosFaceMist = null;
  // 4.0: com duas emoções altas ao mesmo tempo, às vezes o rosto mostra a mistura
  try {
    const C = caosConsole,
      M = C && C.on && C.mist && CAOS_MISTURA_ROSTOS[C.mist];
    if (M && emo === C.mostra && !caosSuaveAlvo(bank)) {
      const mem = Array.isArray(caosFaceUlt["mist:" + C.mist]) ? caosFaceUlt["mist:" + C.mist] : (caosFaceUlt["mist:" + C.mist] = []);
      let i,
        g = 0;
      do i = Math.floor(Math.random() * M.length);
      while (mem.includes(i) && ++g < 10);
      mem.push(i);
      while (mem.length > M.length - 1) mem.shift();
      caosFaceMist = C.mist;
      return M[i];
    }
  } catch (e) {}
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
  caosGerConta = {};
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
    rt.textContent = toast.dataset.mist || CAOS_EMOS[toast.dataset.emo].nome;
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
