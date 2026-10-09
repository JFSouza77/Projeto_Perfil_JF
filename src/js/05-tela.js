/* ======================================================================
 * 5. TELA (RENDERIZAÇÃO, MENUS, CADASTRO, TUTORIAL, PAINÉIS, EFEITOS)
 * ====================================================================== */

// Resposta à mostra pro Mestre memorizar. Nos outros modos, até a 1ª dica ser aberta; no Express a
// 1ª dica já abre sozinha junto com a carta, então ela fica à mostra até a 2ª dica (ou até o toque).
function answerLivre() {
  return (
    !!currentCard &&
    cardState === "revealed" &&
    revealedOrder.length <= (CURRENT_MODE === "express" ? 1 : 0) &&
    answerEscondidaCarta !== currentCard
  );
}
// Só o nome, numa caixinha própria e em destaque (a categoria já está logo acima).
function answerHtml() {
  return `<span class="ans-nome">${escapeHtml(currentCard.answer)}</span>`;
}
function answerTexto(open) {
  return answerLivre() || open ? answerHtml() : "🙈 Resposta escondida — toque pra ver (5 s)";
}
function deckWasUsed() {
  return usedAtLeastOnce;
}
function cadastroAberto() {
  const g = document.getElementById("gameScreen"),
    pp = document.getElementById("playerPanel");
  return (
    !starterChosen &&
    g &&
    g.style.display === "flex" &&
    pp &&
    pp.style.display !== "none" &&
    players.length < MAX_PLAYERS
  );
}
function rulesCtx() {
  const mode = CURRENT_MODE,
    express = mode === "express";
  const xt = expressTimes();
  return {
    mode,
    express,
    equipe: CURRENT_FORMAT === "equipe",
    junior: mode === "junior",
    acess: mode === "oldschool" && oldSchoolAcess,
    hard: mode === "hardcore" || (express && expressFlavor === "hardcore"),
    palpite: mode === "classico" || mode === "junior" || mode === "oldschool",
    gems: gemsEnabled(),
    goal: WINNING_SCORE && WINNING_SCORE > 0 ? WINNING_SCORE : mode === "junior" ? 150 : 200,
    resp: (mode === "oldschool" && oldSchoolAcess ? 120 : RESPONSE_TIME_LIMIT_BY_MODE[mode] || 90) + acessTempoExtra("response"),
    pick: PICK_TIME_LIMIT + acessTempoExtra("pick"),
    cats: mode === "junior" ? "Animal, Pessoa, Lugar ou Coisa" : "Ano, Pessoa, Lugar ou Coisa",
    card: Math.floor(xt.card / 60) + ":" + String(xt.card % 60).padStart(2, "0"),
    turn: xt.turn,
    gemLimit: gemClueLimit(mode),
  };
}
function updateModeNotice() {
  const box = document.getElementById("modeNoticeBox");
  const title = document.getElementById("welcomeTitle");
  if (!box || !title) return;
  const names = {
    classico: "Perfil JF — Clássico (12+)",
    oldschool: "Perfil JF — Old School (20+)",
    hardcore: "Perfil JF — Hardcore (15+)",
    junior: "Perfil JF — Júnior (6+)",
    express: `Perfil JF — Express ${expressFlavor === "hardcore" ? "Hardcore" : "Clássico"}`,
  };
  const notices = {
    classico: "",
    oldschool: oldSchoolAcess
      ? "🔎 Acessibilidade: letra maior, 2 min pra responder e 45 s pra escolher a dica."
      : "📻 Cartas de adulto, dicas mais difíceis e nenhum animal.",
    hardcore: "💀 10 dicas por carta, 60s pra responder, pontos em dobro. Recomendado 15+.",
    junior: `🧒 ${cartasNoModo()} cartas pra criançada: Animal, Pessoa, Lugar e Coisa. Meta de 150 casas.`,
    express: `🔥 Categorias: ${expressSelectedCategories.join(", ")} · sem tabuleiro · 50 cartas · carta de ${rulesCtx().card} e vez de ${rulesCtx().turn}s.`,
  };
  title.textContent = names[CURRENT_MODE] || "Perfil JF";
  const sumEl = document.getElementById("rulesSummaryList");
  if (sumEl) sumEl.innerHTML = buildRulesSummaryHtml();
  const rulesEl = document.getElementById("rulesList");
  if (rulesEl) rulesEl.innerHTML = buildRulesHtml();
  const text = notices[CURRENT_MODE] || "";
  box.style.display = text ? "block" : "none";
  box.textContent = text;
}
const TUT_MC = (cor, glow, ic, nome, selo, extra) =>
  `<div class="mode-select-wrap mc-wrap${extra || ""}" style="--mc:${cor}; --mc-glow:${glow};"><div class="mode-btn mc-card"><span class="mc-icon">${ic}</span><span class="mc-body"><span class="mc-top"><span class="mc-title">${nome}</span><span class="mc-badge">${selo}</span></span></span></div></div>`;
function playerColorCss(color) {
  if (!isSafeColor(color)) return "#cccccc";
  if (color === "RGB") return "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)";
  if (GRADIENTS[color]) return GRADIENTS[color];
  return color;
}
function playerSwatchAttrs(color) {
  const isRgb = color === "RGB";
  const isGrad = !!GRADIENTS[color];
  const isOnyx = color === "GRAD_ONYX";
  const textColor = isOnyx ? "#fff" : isRgb || isGrad ? "#1a1a2e" : isLightHexColor(color) ? "#1a1a2e" : "#fff";
  const shadow = textColor === "#fff" ? "text-shadow:0 1px 2px rgba(0,0,0,0.8);" : "";
  const bg = isRgb ? "" : `background:${playerColorCss(color)};`;
  return { cls: isRgb ? " rgb-swatch" : isOnyx ? " onyx-swatch" : "", style: `${bg} color:${textColor}; ${shadow}` };
}
function playerNameHtml(name, color, avatar) {
  const safeName = escapeHtml(name);
  const avatarHtml = avatar ? `${escapeHtml(avatar)} ` : "";
  if (!isSafeColor(color)) color = "#cccccc";
  if (color === "RGB") {
    return `${avatarHtml}<span class="player-name-neon rgb-name">${safeName}</span>`;
  }
  if (color === "GRAD_ONYX") return `${avatarHtml}<span class="player-name-neon onyx-name">${safeName}</span>`;
  if (GRADIENTS[color]) {
    return `${avatarHtml}<span class="player-name-neon grad-anim" style="background:${caosGradLoop(color)}; background-size:200% 100%; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent; text-shadow:none; filter:drop-shadow(0 0 2px rgba(0,0,0,0.7)); font-weight:800;">${safeName}</span>`;
  }
  const strokeStyle = DARK_COLORS.has(color)
    ? 'style="color:' + color + '; -webkit-text-stroke:0.5px #fff;"'
    : `style="color:${color}"`;
  return `${avatarHtml}<span class="player-name-neon" ${strokeStyle}>${safeName}</span>`;
}
function showGemToast(r) {
  caosLastAchievementCard = stats.totalDrawn;
  playSfx("joia");
  if (CURRENT_FORMAT !== "equipe" && jogadorPorId(r.key))
    caosIniExplica(jogadorPorId(r.key), "joia", (GEM_INFO[r.cat] || {}).name || r.cat);
  vibrar("joia");
  {
    const gi = GEM_INFO[r.cat];
    if (gi) {
      setTimeout(() => {
        fxBurst(gi.color);
        setTimeout(() => fxBurst("#ffd700"), 180);
        fxPop("💎");
      }, 550);
    }
  }
  const info = GEM_INFO[r.cat];
  const equipe = CURRENT_FORMAT === "equipe";
  const who = equipe ? "Equipe " + TEAM_INFO[r.key].label : (jogadorPorId(r.key) || { name: "?" }).name;
  let msg;
  if (r.trofeu) {
    msg = equipe
      ? `💎 Boa, ${who}! Joia de ${info.name} pra coleção.`
      : `💎 Boa, ${who}! Joia de ${info.name} pra coleção.`;
    if (r.total >= GEMS_TO_WIN)
      msg = `💎💎 ${who} juntou as ${GEMS_TO_WIN} joias! Com menos de ${GEMS_MIN_PLAYERS} jogadores é só troféu — a vitória é na casa ${WINNING_SCORE}.`;
    else if (r.total === 1) msg += ` (Com menos de ${GEMS_MIN_PLAYERS} jogadores a joia é troféu: só a chegada vence.)`;
  } else if (r.total >= GEMS_TO_WIN) {
    msg = `💎💎 ${who} reuniu as ${GEMS_TO_WIN} joias e VENCEU o jogo!`;
  } else {
    msg = equipe
      ? `💎 Parabéns, ${who}! Vocês ganharam a joia de ${info.name}!`
      : `💎 Parabéns, ${who}! Você ganhou a joia de ${info.name}!`;
    if (gemCapFor() > 1) msg += ` (${r.count} de ${gemCapFor()} dessa categoria)`;
    if (r.total === GEMS_TO_WIN - 1) msg += " Falta só UMA joia pra vencer!";
  }
  showToastMessage(msg, null, true, true);
  const t = document.getElementById("jfToast");
  if (t) t.style.borderColor = info.color;
}
function splashHue(t) {
  return (splashH0 + ((t - splashT0) / 1e3) * 5) % 360;
}
function aplicarCorRngSplash() {
  const title = document.querySelector(".splash-title");
  if (!title) return;
  try {
    const ant = parseFloat(JFStore.getItem("perfil5_splash_h"));
    splashH0 = (isNaN(ant) ? Math.random() * 360 : ant + 100 + Math.random() * 80) % 360;
    JFStore.setItem("perfil5_splash_h", String(Math.round(splashH0)));
  } catch (e) {
    splashH0 = (splashH0 + 100 + Math.random() * 80) % 360;
  }
  splashT0 = performance.now();
  const vivas = ["#e94560", "#ff6b6b", "#ffd166", "#4ecdc4", "#38bdf8", "#a78bfa", "#fb923c", "#2ecc71", "#39ff14"];
  const pool = vivas.filter((c) => c !== lastSplashColor);
  lastSplashColor = pool[Math.floor(Math.random() * pool.length)];
  title.style.color = lastSplashColor;
  const outra = pool.filter((c) => c !== lastSplashColor);
  title.style.setProperty("--sp-cor", lastSplashColor);
  title.style.setProperty("--sp-cor2", outra[Math.floor(Math.random() * outra.length)] || "#38bdf8");
  document.documentElement.style.setProperty("--sp-cor", lastSplashColor);
}
function updateDeckInfo() {
  document.getElementById("deckInfo").textContent =
    (ultimaRodada ? `🏁 Última rodada (${ultimaRodadaQuem} bateu a meta) · ` : "") +
    `Cartas restantes no baralho: ${deck.length} de ${Math.min(allCards.length, deckLimiteModo())}`;
}
function updateTimerDisplay() {
  const el = document.getElementById("timerDisplay");
  const left = secondsLeft();
  if (el) {
    const isBig = left <= 10 && left > 0;
    const isBlinkStep = left <= 5 && left > 0 && left % 2 === 1;
    const cardPart =
      CURRENT_MODE === "express" && cardEndAt
        ? ` · carta <b>${Math.floor(cardSecondsLeft() / 60)}:${String(cardSecondsLeft() % 60).padStart(2, "0")}</b>`
        : "";
    const labelPart = cardPart ? "vez " : "";
    el.innerHTML = `◷ ${labelPart}<span class="timer-number ${isBig ? "timer-big" : ""} ${isBlinkStep ? "timer-blink-on" : ""}">${left}s</span>${cardPart}`;
  }
  if (left <= 5 && left > 0 && left !== lastBeepSecond) {
    lastBeepSecond = left;
    playBeep(440, 0.1);
    if (left <= 3) vibrar("tique");
  }
  if (left > 5) lastBeepSecond = null;
  fxUrgente(
    left <= 5 && left > 0 && !!timerInterval && document.getElementById("pauseScreen").style.display !== "block",
  );
}
function ciSanearLog(arr, max) {
  if (!Array.isArray(arr)) return [];
  const num = (v, d) => (typeof v === "number" && isFinite(v) ? v : d);
  const txt = (v, n) => String(v == null ? "" : v).slice(0, n);
  return arr
    .filter((x) => x && typeof x === "object")
    .slice(-max)
    .map((x) => {
      const o = {
        carta: num(x.carta, 0),
        humor: txt(x.humor || "neutro", 20),
        estado: txt(x.estado, 30),
        t: num(x.t, 5),
        c: num(x.c, 5),
      };
      if ("ms" in x) {
        o.nome = txt(x.nome, 20);
        o.ms = Math.max(0, num(x.ms, 0));
        o.ok = !!x.ok;
        o.dif = txt(x.dif, 10);
        o.resp = txt(x.resp, 40);
        o.dicas = num(x.dicas, 0);
      } else {
        o.p = num(x.p, 7);
        o.motivo = txt(x.motivo, 80);
        if (x.fala) o.fala = txt(x.fala, 160);
      }
      return o;
    });
}
function ciAmostra(bank, ...args) {
  if (!Array.isArray(bank) || !bank.length) return "";
  const it = bank[Math.floor(Math.random() * bank.length)];
  try {
    return typeof it === "function" ? it(...args) : String(it);
  } catch (e) {
    return "";
  }
}
function ciSecao(titulo, extraHtml) {
  const s = document.createElement("div");
  s.className = "ci-section";
  s.innerHTML = `<div class="ci-section-title">${titulo}${extraHtml ? `<span class="ci-section-extra">${extraHtml}</span>` : ""}</div>`;
  return s;
}
function ciMedidor(icone, nome, v, nota, cor) {
  const pct = Math.max(0, Math.min(100, (Number(v) || 0) * 10));
  return `<div class="ci-card"><div class="ci-meter-top"><span>${icone} ${nome}</span><b style="color:${cor}">${ciNum(v, 0)} / 10</b></div>
    <div class="ci-bar"><i style="width:${pct}%;background:${cor}"></i></div><div class="ci-note">${nota}</div></div>`;
}
function ciHumorCor(h) {
  return CI_HUMOR_COR[h] || CI_HUMOR_COR.neutro;
}
function ciSeg(v) {
  return (Math.round(v / 100) / 10).toFixed(1).replace(".", ",") + " s";
}
function ciSegmentos(arr, keyFn) {
  const out = [];
  arr.forEach((x, i) => {
    const k = keyFn(x);
    const last = out[out.length - 1];
    if (last && last.key === k) {
      last.ate = i;
      last.n++;
    } else out.push({ key: k, de: i, ate: i, n: 1 });
  });
  return out;
}
function ciLeCorrelacao(r, eixo) {
  if (r === null) return `${eixo}: poucos dados (precisa de 4+ respostas).`;
  const a = Math.abs(r),
    forca =
      a < 0.2 ? "quase nenhuma relação" : a < 0.45 ? "relação fraca" : a < 0.7 ? "relação moderada" : "relação forte";
  const sentido =
    a < 0.2
      ? ""
      : r > 0
        ? " — quanto mais alto, mais DEVAGAR a mesa responde"
        : " — quanto mais alto, mais RÁPIDO a mesa responde";
  return `${eixo}: r = ${r.toFixed(2).replace(".", ",")} (${forca}${sentido}).`;
}
function ciChartFrame(n, yMax, yTicks, yFmt) {
  const W = 380,
    H = 190,
    P = { l: 34, r: 8, t: 10, b: 22 };
  const iw = W - P.l - P.r,
    ih = H - P.t - P.b;
  const x = (i) => P.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v) => P.t + ih - (Math.max(0, Math.min(yMax, v)) / yMax) * ih;
  let grid = "";
  yTicks.forEach((v) => {
    grid += `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(255,255,255,0.08)"/><text x="${P.l - 5}" y="${y(v) + 3}" font-size="9" text-anchor="end">${yFmt(v)}</text>`;
  });
  return { W, H, P, iw, ih, x, y, grid };
}
function ciHumorBandas(f, arr, n) {
  return ciSegmentos(arr, (a) => a.humor)
    .map((sg) => {
      const x0 = sg.de === 0 ? f.P.l : (f.x(sg.de - 1) + f.x(sg.de)) / 2;
      const x1 = sg.ate === n - 1 ? f.W - f.P.r : (f.x(sg.ate) + f.x(sg.ate + 1)) / 2;
      return `<rect x="${x0}" y="${f.P.t}" width="${Math.max(1, x1 - x0)}" height="${f.ih}" fill="${ciHumorCor(sg.key)}" opacity="0.13"/>`;
    })
    .join("");
}
function ciLegendaHumor(presentes) {
  return (
    '<div class="ci-legend">' +
    Object.keys(CI_HUMOR_COR)
      .filter((h) => presentes.has(h))
      .map((h) => `<span><i style="background:${CI_HUMOR_COR[h]}"></i>${CI_HUMOR_NOME[h]}</span>`)
      .join("") +
    "</div>"
  );
}
function hallDaFamaHtml() {
  const e = escapeHtml,
    rec = memLer(MEM_RECORDES_KEY, {}),
    fichas = Object.values(fichasTodas()).map((f) => fichaLimpa(f));
  const novo = (t) => (caosRecordesNovos.includes(t) ? ' <b style="color:var(--special);">🆕</b>' : "");
  const itens = [];
  const placa = (ic, tit, nome, det, cor, largo, fala) =>
    `<li class="hall-placa${largo ? " hall-largo" : ""}${fala ? " falavel" : ""}" style="--hc:${cor};"${fala ? caosFalavel(fala) : ""}><span class="hall-ic">${ic}</span><span class="hall-tit">${tit}</span><span class="hall-nome">${nome}</span><span class="hall-det">${det}</span></li>`;
  if (rec.rapido && typeof rec.rapido.v === "number")
    itens.push(
      placa(
        "⚡",
        "Relâmpago da casa" + novo("rapido"),
        `<b>${e(rec.rapido.nome || "?")}</b>`,
        `acertou em ${memSeg(rec.rapido.v)} s${rec.rapido.resp ? ` · ${e(rec.rapido.resp)}` : ""}`,
        "#38bdf8",
        false,
        {
          t: "rapido",
          n: rec.rapido.nome || "?",
          v: memSeg(rec.rapido.v),
          x: rec.rapido.resp || "",
          titulo: "Relâmpago da casa",
        },
      ),
    );
  if (rec.sequencia && typeof rec.sequencia.v === "number")
    itens.push(
      placa(
        "🔥",
        "Sequência imparável" + novo("sequencia"),
        `<b>${e(rec.sequencia.nome || "?")}</b>`,
        `${rec.sequencia.v} acertos seguidos`,
        "#fb923c",
        false,
        { t: "sequencia", n: rec.sequencia.nome || "?", v: rec.sequencia.v, titulo: "Sequência imparável" },
      ),
    );
  Object.keys(rec)
    .filter((k) => k.startsWith("pontuacao_") && rec[k] && typeof rec[k].v === "number")
    .forEach((k) => {
      itens.push(
        placa(
          "🎯",
          `Placar lendário · ${e(memModoNome(k.slice(10)))}` + novo(k),
          `<b>${e(rec[k].nome || "?")}</b>`,
          `${rec[k].v} pontos numa partida`,
          "#34d399",
          false,
          { t: "placar", n: rec[k].nome || "?", v: rec[k].v, x: memModoNome(k.slice(10)), titulo: "Placar lendário" },
        ),
      );
    });
  const vit = fichas
    .filter((f) => f.vitorias > 0)
    .sort((a, b) => b.vitorias - a.vitorias || a.partidas - b.partidas)
    .slice(0, 5);
  const rei = fichas.filter((f) => f.primeiraDica > 0).sort((a, b) => b.primeiraDica - a.primeiraDica)[0];
  const rivais = Object.values(memLer(MEM_RIVAIS_KEY, {}))
    .filter((r) => r && memNum(r.n, 0) >= 3)
    .sort((a, b) => b.n - a.n)[0];
  const bola = memLer(MEM_BOLA_KEY, {});
  if (rei)
    itens.push(
      placa(
        "🥇",
        "Sniper da 1ª dica",
        `<b>${e(rei.nome)}</b>`,
        `${rei.primeiraDica} acerto${rei.primeiraDica === 1 ? "" : "s"} logo de primeira`,
        "#fbbf24",
        false,
        { t: "sniper", n: rei.nome, v: rei.primeiraDica, titulo: "Sniper da 1ª dica" },
      ),
    );
  if (rivais)
    itens.push(
      placa(
        "⚔️",
        "Rivalidade histórica",
        `<b>${e(rivais.a || "?")}</b> <span class="hall-x">×</span> <b>${e(rivais.b || "?")}</b>`,
        `${rivais.n} trocas de liderança`,
        "#f87171",
        true,
        { t: "rival", n: rivais.a || "?", n2: rivais.b || "?", v: rivais.n, titulo: "Rivalidade histórica" },
      ),
    );
  if (memNum(bola.t, 0) >= 3)
    itens.push(
      placa(
        "🔮",
        "Bola de cristal do C.A.O.S.",
        `<b>${memPct(bola.a / bola.t)}</b>`,
        `${bola.a} de ${bola.t} previsões certas`,
        "#a78bfa",
        false,
        { t: "bola", a: bola.a, tot: bola.t, titulo: "Minha bola de cristal" },
      ),
    );
  const vitHtml = vit.length
    ? `<div class="hall-campeoes"><div class="hall-tit">👑 Galeria dos campeões</div><ol>${vit.map((f, i) => `<li class="falavel"${caosFalavel({ t: "campeao", n: f.nome, v: f.vitorias, x: f.partidas, titulo: "Galeria dos campeões" })}><span class="hall-pos">${i + 1}º</span><b>${e(f.nome)}</b><span class="hall-det">${f.vitorias} vitória${f.vitorias === 1 ? "" : "s"} em ${f.partidas} partida${f.partidas === 1 ? "" : "s"}</span></li>`).join("")}</ol></div>`
    : "";
  const vazio = !itens.length && !vitHtml;
  return `<div class="stats-box hall-box"><h3>🏆 Hall da Fama</h3><div class="hall-sub">recordes guardados neste aparelho${vazio ? "" : " · toque num deles e o C.A.O.S. comenta"}</div>
    ${vazio ? '<p style="opacity:0.75;">Ainda vazio. Joguem mais umas partidas que eu começo a anotar.</p>' : `<ul class="hall-grid">${itens.join("")}</ul>${vitHtml}`}
    <button type="button" class="btn-sec hall-zerar" id="hallZerarBtn">🧹 Apagar a memória do C.A.O.S.</button></div>`;
}
function hallZerar() {
  caosConfirmarModal(
    "Apagar fichas, recordes, rivalidades e a memória da última partida deste aparelho? Não dá pra desfazer.",
    "Apagar",
    "Cancelar",
    hallZerarFeito,
  );
}
function hallZerarFeito() {
  [MEM_FICHAS_KEY, MEM_RECORDES_KEY, MEM_RIVAIS_KEY, MEM_ULTIMA_KEY, MEM_BOLA_KEY].forEach((k) => {
    try {
      JFStore.removeItem(k);
    } catch (e) {}
  });
  caosRecordesNovos = [];
  showToastMessage(getRandomReaction(REACTIVE_VOICE.memoria.apagada), null, true);
  renderFinalScreen();
}
function jogEmoHtml(p) {
  const E = p && JOG_EMOS[p.estadoEmocional];
  if (!E) return "";
  const gentil = p.iniciante || playerHumor(p) === "suave" || CURRENT_MODE === "junior";
  return ` <span class="jog-emo" title="O C.A.O.S. acha que ${escapeHtml(p.name)} está: ${E.t}">${gentil && E.gentil ? E.gentil : E.i}</span>`;
}
function buildExpressAcertouHtml(isSpecial) {
  if (expressAskWho) {
    const btns = players
      .map((p, i) => {
        if (i === mestreIndex) return "";
        const sw = playerSwatchAttrs(p.color);
        return `<button class="btn-correct express-who${sw.cls}" data-who="${i}" style="margin:4px; padding:10px 14px; border:none; border-radius:8px; ${sw.style}">${p.avatar ? p.avatar + " " : ""}${escapeHtml(p.name)}</button>`;
      })
      .join("");
    return `<div class="pick-label">Quem acertou?</div><div style="display:flex; flex-wrap:wrap; justify-content:center;">${btns}</div><button class="discard-btn" id="expressWhoBackBtn">↩️ Voltar</button>`;
  }
  return "";
}
function wireExpressControls(area) {
  const c = document.getElementById("expressCorrectBtn");
  if (c)
    c.addEventListener("click", () => {
      expressFreezeForWho();
      expressAskWho = true;
      render();
      saveGameState();
    });
  const n = document.getElementById("expressNextBtn");
  if (n) n.addEventListener("click", expressPass);
  const bk = document.getElementById("expressWhoBackBtn");
  if (bk)
    bk.addEventListener("click", () => {
      expressAskWho = false;
      expressUnfreezeWho();
      render();
      updateTimerDisplay();
      saveGameState();
    });
  area
    .querySelectorAll(".express-who")
    .forEach((b) => b.addEventListener("click", () => markCorrect(parseInt(b.dataset.who))));
}
function openExpressTargetPopup(actionType) {
  const eligible = players.filter((p, idx) => idx !== responderIndex && idx !== mestreIndex);
  if (eligible.length === 0) {
    playSfx("erro");
    showToastMessage(getRandomReaction(REACTIVE_VOICE.especialExpressSemAlvo));
    clearTimer();
    expressAfterSpecial();
    return;
  }
  expressTargetAction = actionType;
  const modal = document.getElementById("expressTargetModal");
  const title = document.getElementById("expressTargetTitle");
  const row = document.getElementById("expressTargetAvatars");
  if (!modal || !title || !row) return;
  title.textContent =
    actionType === "block"
      ? "🚫 Escolha quem vai ser bloqueado na próxima vez dele"
      : "🎯 Escolha quem vai responder essa dica no seu lugar";
  row.innerHTML = "";
  players.forEach((p, idx) => {
    if (idx === responderIndex || idx === mestreIndex) return;
    const btn = document.createElement("button");
    const sw = playerSwatchAttrs(p.color);
    btn.className = "btn-correct" + sw.cls;
    btn.style.cssText = `padding:10px 14px; border:none; border-radius:8px; ${sw.style}`;
    btn.textContent = `${p.avatar ? p.avatar + " " : ""}${p.name}`;
    btn.addEventListener("click", () => resolveExpressTarget(idx));
    row.appendChild(btn);
  });
  modal.style.display = "block";
}
function updateDrawAvailability() {
  {
    const b = document.getElementById("drawStarterBtn");
    if (b) b.classList.toggle("pronto", players.length >= 2 && !starterChosen);
  }
  const drawBtn = document.getElementById("drawBtn");
  const warning = document.getElementById("playerWarning");
  const enoughPlayers = hasEnoughPlayersForFormat();
  if (cardState === "none" && !gameEnded) {
    drawBtn.style.display = deck.length > 0 && enoughPlayers && starterChosen ? "block" : "none";
  }
  warning.style.display = enoughPlayers ? "none" : "block";
  warning.textContent =
    CURRENT_FORMAT === "equipe"
      ? `O Modo Equipe precisa de EXATAMENTE 4 ou 6 jogadores (com 6: 2 equipes de 3 ou 3 equipes de 2) — agora tem ${players.length}.`
      : `Adicione pelo menos ${MIN_PLAYERS} jogadores para começar (máximo ${MAX_PLAYERS}).`;
  const team2Btn = document.getElementById("teamCount2Btn");
  const team3Btn = document.getElementById("teamCount3Btn");
  if (team2Btn) team2Btn.disabled = players.length !== 4 && players.length !== 6;
  if (team3Btn) team3Btn.disabled = players.length !== 6;
  iniAtualizarBotao();
  renderWinCondPicker();
}
// 1.7.7 (revisão Google AI Studio): leitor de tela anuncia a troca de vez (região escondida, só pra leitor).
let vezAnunciada = "";
function anunciarVez() {
  try {
    if (!starterChosen || gameEnded || cardState !== "revealed" || typeof responderIndex !== "number") return;
    const r = players[responderIndex];
    const m = players[mestreIndex];
    if (!r) return;
    const txt = `Vez de ${r.name}${m ? ". Mestre: " + m.name : ""}.`;
    if (txt === vezAnunciada) return;
    vezAnunciada = txt;
    let el = document.getElementById("anuncioVez");
    if (!el) {
      el = document.createElement("div");
      el.id = "anuncioVez";
      el.className = "so-leitor";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = txt;
  } catch (e) {}
}
function render() {
  anunciarVez();
  const area = document.getElementById("cardArea");
  const drawBtn = document.getElementById("drawBtn");
  const miniScore = document.getElementById("miniScoreboard");
  const boardTrack = document.getElementById("boardTrack");
  if (gameEnded) {
    drawBtn.style.display = "none";
    return;
  }
  if (cardState === "revealed") {
    if (miniScore) miniScore.style.display = "none";
    if (boardTrack) boardTrack.style.display = "none";
  } else {
    if (miniScore) miniScore.style.display = "";
    if (boardTrack) boardTrack.style.display = "";
  }
  if (boardTrack && CURRENT_MODE === "express") boardTrack.style.display = "none";
  if (cardState === "bonusChoice") {
    area.className = "card";
    const entry = pendingBonusQueue[0];
    if (!entry) {
      drawBtn.style.display = "none";
      return;
    }
    const lander = entityDisplay(entry.landerIdx);
    const landerHtml = playerNameHtml(lander.name, lander.color, lander.avatar);
    let optionBtns;
    if (CURRENT_FORMAT === "equipe") {
      optionBtns = teamOrder
        .filter((id) => id !== entry.landerIdx)
        .map((id) => {
          const info = TEAM_INFO[id];
          const sw = playerSwatchAttrs(info.color);
          return `<button class="btn-correct${sw.cls}" style="margin:4px; padding:10px 14px; border:none; border-radius:8px; ${sw.style}" data-opp="${id}">${info.emoji} ${info.label}</button>`;
        })
        .join("");
    } else {
      optionBtns = players
        .map((p, i) => {
          if (i === entry.landerIdx) return "";
          const tag = i === mestreIndex ? " (Mestre atual)" : "";
          const sw = playerSwatchAttrs(p.color);
          return `<button class="btn-correct${sw.cls}" style="margin:4px; padding:10px 14px; border:none; border-radius:8px; ${sw.style}" data-opp="${i}">${escapeHtml(p.name)}${tag}</button>`;
        })
        .join("");
    }
    area.innerHTML = `
      <div class="bonus-banner">⭐ ${escapeHtml(lander.name)} parou numa casa de bônus!</div>
      <div style="text-align:center; margin:10px 0;"><strong>${landerHtml}</strong>, escolha contra quem você vai duelar por esta carta em dobro:</div>
      <div style="display:flex; flex-wrap:wrap; justify-content:center;">${optionBtns}</div>
    `;
    drawBtn.style.display = "none";
    area.querySelectorAll("[data-opp]").forEach((btn) => {
      const raw = btn.dataset.opp;
      btn.addEventListener("click", () => chooseBonusOpponent(CURRENT_FORMAT === "equipe" ? raw : parseInt(raw)));
    });
    return;
  }
  if (cardState === "none") {
    area.className = "card";
    area.innerHTML =
      deck.length === 0 && currentCard === null && deckWasUsed()
        ? '<div class="placeholder">Baralho acabou! Resete o baralho ou encerre o jogo.</div>'
        : '<div class="placeholder">Aperte "Sortear carta" para começar</div>';
    drawBtn.style.display = deck.length > 0 && hasEnoughPlayersForFormat() && starterChosen ? "block" : "none";
    drawBtn.textContent = "🔀 Sortear carta";
  } else if (cardState === "hidden" && roletaCarta && roletaCarta === currentCard) {
    drawBtn.style.display = "none";
    roletaDesenhar(true);
  } else if (cardState === "hidden") {
    area.className = "card face-down";
    const mestreBadge = mestreDestaqueHtml();
    const bonusBannerHiddenHtml = currentCard && currentCard.isBonus ? renderBonusBanner() : "";
    area.innerHTML = `
      ${bonusBannerHiddenHtml}
      <i class="verso-canto c1" aria-hidden="true">✦</i><i class="verso-canto c2" aria-hidden="true">✦</i><i class="verso-canto c3" aria-hidden="true">✦</i><i class="verso-canto c4" aria-hidden="true">✦</i>
      ${VERSO_EMBLEMA_SVG}
      <div class="verso-frase">Você sabe dizer quem sou?!</div>
      <div class="mestre-da-vez">Mestre da rodada: ${mestreBadge}</div>
      <div>Só o Mestre segura o celular e vira a carta quando estiver pronto.</div>
      <button class="flip-btn" id="flipBtn">↻ Virar carta</button>
    `;
    drawBtn.style.display = "none";
    document.getElementById("flipBtn").addEventListener("click", startCategoryRoulette);
  } else if (cardState === "revealed") {
    area.className = "card";
    if (timeoutOverlayMessage) {
      area.innerHTML = `
        <div class="timeout-overlay">
          ${timeoutOverlayMessage.message}
          <div class="sub">${timeoutOverlayMessage.sub}</div>
        </div>
      `;
      drawBtn.style.display = "none";
      return;
    }
    const revealedItems = revealedOrder
      .map((r) => {
        const num = r.index + 1;
        const pickedByHtml = r.pickedByName
          ? ` <span class="picked-by">(pedida por ${playerNameHtml(r.pickedByName, r.pickedByColor, r.pickedByAvatar)})</span>`
          : "";
        if (r.item.type === "special") return `<li class="special">${num}. ⭐ ${r.item.text}${pickedByHtml}</li>`;
        return `<li><span class="clue-num">${num}.</span>${r.item.text}${pickedByHtml}</li>`;
      })
      .join("");
    const mestreName = players[mestreIndex] ? escapeHtml(players[mestreIndex].name) : "?";
    const responderName = players[responderIndex] ? escapeHtml(players[responderIndex].name) : "?";
    const mestreNameHtml = players[mestreIndex]
      ? playerNameHtml(players[mestreIndex].name, players[mestreIndex].color, players[mestreIndex].avatar)
      : "?";
    const responderNameHtml = players[responderIndex]
      ? playerNameHtml(players[responderIndex].name, players[responderIndex].color, players[responderIndex].avatar)
      : "?";
    let controlsHtml = "";
    if (pendingIndex !== null) {
      const item = currentCard.clues[pendingIndex];
      const num = pendingIndex + 1;
      const spotlightTimerHtml = expressWhoFreeze
        ? `<div class="spotlight-timer">⏸️ Tempo parado — Mestre, quem acertou?</div>`
        : `<div id="timerDisplay" class="spotlight-timer">⏱️ ${secondsLeft()}s</div>`;
      if (item.type === "special") {
        const txt = item.text.toLowerCase();
        if (isWildcardSpecial(item.text)) {
          controlsHtml = `
            <div class="pending-box spotlight-box"><span class="pending-num">Dica ${num}:</span> ⭐ ${item.text}</div>
            <div style="text-align:center; opacity:0.8; font-size:0.85rem; margin:4px 0 8px;">${(() => {
              const e = revealedOrder.find((r) => r.index === pendingIndex);
              const res = e ? e.palpiteResult : null;
              if (res === "ganhou")
                return `${responderName} guardou uma <b>ficha de palpite</b> 🃏 — ela vale o jogo inteiro, até ser usada (fichas no estoque agora: ${palpiteStock}). A vez passa normalmente.`;
              if (res === "fominha")
                return `${responderName} já tem uma ficha de palpite 🃏 — cada um guarda no máximo <b>uma</b>. A instrução não vale, ${responderName} perde a vez e a ficha fica no estoque.`;
              if (res === "sem-estoque")
                return "Todas as 5 fichas de palpite já estão com jogadores — a instrução fica sem efeito. Quem tirou não perde a vez: escolha outra dica.";
              return palpiteEnabled()
                ? "O palpite a qualquer hora precisa de 3 ou mais participantes — a instrução fica sem efeito. Quem tirou não perde a vez: escolha outra dica."
                : "O palpite a qualquer hora não vale neste modo — a instrução fica sem efeito. Quem tirou não perde a vez: escolha outra dica.";
            })()}</div>
            ${spotlightTimerHtml}
            ${specialIsVoid(item) ? `<button class="continue-btn" id="continueSpecialBtn">→ Continuar, ${responderName} escolhe outra dica</button>` : `<button class="continue-btn" id="loseTurnBtn">→ Passar a vez</button>`}`;
        } else if (CONTINUE_SAME_PLAYER_SPECIALS.has(item.text)) {
          controlsHtml = `
            <div class="pending-box spotlight-box"><span class="pending-num">Dica ${num}:</span> ⭐ ${item.text}</div>
            ${spotlightTimerHtml}
            <button class="continue-btn" id="continueSpecialBtn">→ Continuar, ${responderName} escolhe outra dica</button>`;
        } else if (
          CURRENT_MODE === "express" &&
          (txt.includes("avance") || txt.includes("volte") || txt.includes("escolha um jogador"))
        ) {
          if (txt.includes("avance") && !txt.includes("escolha")) {
            const steps = txt.includes("2") ? 2 : 1;
            const cad = expressPreverCadeia(responderIndex, steps + 1).map((i) => (players[i] ? escapeHtml(players[i].name) : "?"));
            controlsHtml = `
              <div class="pending-box spotlight-box"><span class="pending-num">Dica ${num}:</span> ⭐ ${item.text}</div>
              <div style="text-align:center; opacity:0.8; font-size:0.85rem; margin:4px 0 8px;">Estilo UNO: pula ${cad.slice(0, steps).join(" e ")} — a vez vai pra <b>${cad[steps]}</b>.</div>
              ${spotlightTimerHtml}
              <button class="btn-correct btn-acao" onclick="expressSkip(${steps})">⏭️ Pular ${steps} jogador${steps === 1 ? "" : "es"}</button>`;
          } else if (txt.includes("volte") && !txt.includes("escolha")) {
            const steps = txt.includes("3") ? 3 : 2;
            controlsHtml = `
              <div class="pending-box spotlight-box"><span class="pending-num">Dica ${num}:</span> ⭐ ${item.text}</div>
              <div style="text-align:center; opacity:0.8; font-size:0.85rem; margin:4px 0 8px;">${steps === 3 ? "Estilo UNO: inverte o sentido e ainda pula 1 jogador." : "Estilo UNO: inverte o sentido — a vez volta pra quem jogou antes."}</div>
              ${spotlightTimerHtml}
              <button class="btn-wrong btn-acao" onclick="expressReverse(${steps})">🔁 ${steps === 3 ? "Inverter e pular 1" : "Inverter o sentido"}</button>`;
          } else if (txt.includes("escolha um jogador")) {
            const isAvancar = txt.includes("avan");
            controlsHtml = `
              <div class="pending-box spotlight-box"><span class="pending-num">Dica ${num}:</span> ⭐ ${item.text}</div>
              <div style="text-align:center; opacity:0.8; font-size:0.85rem; margin:4px 0 8px;">${isAvancar ? "Cede sua vez pra outro jogador responder essa dica." : "Bloqueia outro jogador na próxima vez dele."}</div>
              ${spotlightTimerHtml}
              <button class="btn-correct btn-acao" onclick="openExpressTargetPopup('${isAvancar ? "steal" : "block"}')">🎯 Escolher jogador</button>`;
          }
        } else if (txt.includes("avance 1 casa")) {
          controlsHtml = `
            <div class="pending-box spotlight-box"><span class="pending-num">Dica ${num}:</span> ⭐ ${item.text}</div>
            ${spotlightTimerHtml}
            <button class="btn-correct btn-acao" onclick="applySpecialMove(${responderIndex}, 1)">➡️ Avançar 1 casa e passar a vez</button>`;
        } else if (txt.includes("avance 2 casas") && !txt.includes("escolha")) {
          controlsHtml = `
            <div class="pending-box spotlight-box"><span class="pending-num">Dica ${num}:</span> ⭐ ${item.text}</div>
            ${spotlightTimerHtml}
            <button class="btn-correct btn-acao" onclick="applySpecialMove(${responderIndex}, 2)">➡️ Avançar 2 casas e passar a vez</button>`;
        } else if (txt.includes("volte 2 casas") && !txt.includes("escolha")) {
          controlsHtml = `
            <div class="pending-box spotlight-box"><span class="pending-num">Dica ${num}:</span> ⭐ ${item.text}</div>
            ${spotlightTimerHtml}
            <button class="btn-wrong btn-acao" onclick="applySpecialMove(${responderIndex}, -2)">⬅️ Voltar 2 casas e passar a vez</button>`;
        } else if (txt.includes("volte 3 casas")) {
          controlsHtml = `
            <div class="pending-box spotlight-box"><span class="pending-num">Dica ${num}:</span> ⭐ ${item.text}</div>
            ${spotlightTimerHtml}
            <button class="btn-wrong btn-acao" onclick="applySpecialMove(${responderIndex}, -3)">⬅️ Voltar 3 casas e passar a vez</button>`;
        } else if (txt.includes("escolha um jogador")) {
          const moveVal = txt.includes("avançar") ? 2 : -2;
          const moveText = txt.includes("avançar") ? "avançar" : "voltar";
          let targetBtns, promptLabel;
          if (CURRENT_FORMAT === "equipe") {
            promptLabel = `${responderName}, escolha qual equipe vai ${moveText} 2 casas:`;
            targetBtns = teamOrder
              .filter((id) => id !== (players[responderIndex] && players[responderIndex].team))
              .map((id) => {
                const info = TEAM_INFO[id];
                const sw = playerSwatchAttrs(info.color);
                return `<button class="btn-correct${sw.cls}" style="padding:10px; margin:4px; font-size:0.9rem; border:none; border-radius:8px; ${sw.style}" onclick="applyTeamSpecialMove('${id}', ${moveVal}, true)">${info.emoji} ${info.label}</button>`;
              })
              .join("");
          } else {
            promptLabel = `${responderName}, escolha quem vai ${moveText} 2 casas:`;
            targetBtns = players
              .map((p, i) => {
                if (i === responderIndex) return "";
                const sw = playerSwatchAttrs(p.color);
                return `<button class="btn-correct${sw.cls}" style="padding:10px; margin:4px; font-size:0.9rem; border:none; border-radius:8px; ${sw.style}" onclick="applySpecialMove(${i}, ${moveVal})">${escapeHtml(p.name)}</button>`;
              })
              .join("");
          }
          const soDois = palpiteParticipants() < 3;
          let autoName = "",
            autoOnclick = "";
          if (soDois) {
            if (CURRENT_FORMAT === "equipe") {
              const otherTeam = teamOrder.find(
                (id) => id !== (players[responderIndex] && players[responderIndex].team),
              );
              autoName = otherTeam
                ? `${TEAM_INFO[otherTeam].emoji} equipe ${TEAM_INFO[otherTeam].label}`
                : "a outra equipe";
              autoOnclick = otherTeam
                ? `applyTeamSpecialMove('${otherTeam}', ${moveVal}, true)`
                : "loseTurnAfterSpecial()";
            } else {
              const mst = players[mestreIndex];
              autoName = mst ? escapeHtml(mst.name) + " (o Mestre)" : "o Mestre";
              autoOnclick = mst ? `applySpecialMove(${mestreIndex}, ${moveVal})` : "loseTurnAfterSpecial()";
            }
          }
          controlsHtml = soDois
            ? `
            <div class="pending-box spotlight-box"><span class="pending-num">Dica ${num}:</span> ⭐ ${item.text}</div>
            <div style="text-align:center; opacity:0.85; font-size:0.85rem; margin:8px 0;">Com só 2 ${CURRENT_FORMAT === "equipe" ? "equipes" : "jogadores"} ninguém pode escolher a si mesmo — o efeito vai direto pra <b>${autoName}</b>.</div>
            ${spotlightTimerHtml}
            <button class="${moveVal > 0 ? "btn-correct" : "btn-wrong"} btn-acao" onclick="${autoOnclick}">${moveVal > 0 ? "➡️ Avançar" : "⬅️ Voltar"} 2 casas: ${autoName} — e passar a vez</button>`
            : `
            <div class="pending-box spotlight-box"><span class="pending-num">Dica ${num}:</span> ⭐ ${item.text}</div>
            ${spotlightTimerHtml}
            <div style="text-align:center; opacity:0.7; font-size:0.8rem; margin-top:4px;">Se o tempo acabar, o jogo sorteia o alvo.</div>
            <div style="text-align:center; margin-top:10px;"><strong>${promptLabel}</strong></div>
            <div style="display:flex; flex-wrap:wrap; justify-content:center; margin-top:8px;">${targetBtns}</div>`;
        } else {
          controlsHtml = `
            <div class="pending-box spotlight-box"><span class="pending-num">Dica ${num}:</span> ⭐ ${item.text}</div>
            ${spotlightTimerHtml}
            ${currentCard.isBonus && /perca sua vez/i.test(item.text) ? '<div style="text-align:center; opacity:0.85; font-size:0.85rem; margin:4px 0 8px;">💥 Perca sua vez em carta bônus: o <b>bônus é cancelado</b>. A carta volta pro fim do baralho e ninguém pontua.</div>' : ""}
            <button class="continue-btn" id="loseTurnBtn">${currentCard.isBonus && /perca sua vez/i.test(item.text) ? "💥 Cancelar o bônus e seguir" : "➡️ Vez consumida, passa pro próximo jogador"}</button>`;
        }
      } else if (CURRENT_MODE === "express") {
        const realN = revealedOrder.filter((r) => r.item.type === "clue").length;
        const pts = expressPoints(realN);
        const remainingX = currentCard.clues.length - revealedOrder.length;
        const bodyHtml = expressAskWho
          ? buildExpressAcertouHtml(false)
          : `<div class="guess-btns" style="flex-direction:column;"><button class="btn-correct" id="expressCorrectBtn">✓ Acertou</button><button class="btn-wrong" id="expressNextBtn">➡️ ${remainingX > 0 ? "Revelar próxima dica" : "Sem mais dicas — encerrar a carta"}</button></div>`;
        controlsHtml = `
          <div class="pending-box spotlight-box"><span class="pending-num">Dica ${num}:</span> ${item.text}</div>
          <div style="text-align:center; opacity:0.75; font-size:0.85rem; margin-bottom:4px;">Vale ${pts} ponto${pts === 1 ? "" : "s"} se acertar agora (11 − ${realN} dica${realN === 1 ? "" : "s"} revelada${realN === 1 ? "" : "s"})</div>
          ${spotlightTimerHtml}
          ${bodyHtml}`;
      } else {
        const totalCardPointsNow = currentCard.clues.length;
        const entriesNow = revealedOrder.length;
        const bonusMult = (currentCard && currentCard.isBonus ? 2 : 1) * (CURRENT_MODE === "hardcore" ? 2 : 1);
        const pointsIfCorrect = (totalCardPointsNow - entriesNow) * bonusMult;
        const mestreGainDisplay = entriesNow * bonusMult;
        const cb = currentCard && currentCard.isBonus ? currentCard : null;
        const quemGanhaNm =
          cb && players[cb.bonusLanderPlayerIdx] && players[cb.bonusOpponentPlayerIdx]
            ? escapeHtml(
                players[
                  responderIndex === cb.bonusLanderPlayerIdx ? cb.bonusOpponentPlayerIdx : cb.bonusLanderPlayerIdx
                ].name,
              )
            : mestreName;
        let correctButtonsHtml = "";
        let palpiteHtml = "";
        const landerIdx = currentCard && currentCard.isBonus ? currentCard.bonusLanderPlayerIdx : void 0;
        const oppIdx = currentCard && currentCard.isBonus ? currentCard.bonusOpponentPlayerIdx : void 0;
        if (currentCard && currentCard.isBonus && players[landerIdx] && players[oppIdx]) {
          const r = players[responderIndex];
          const ehAtaque =
            CURRENT_FORMAT === "equipe" ? r && r.team === players[landerIdx].team : responderIndex === landerIdx;
          const tagEq =
            CURRENT_FORMAT === "equipe"
              ? `${TEAM_INFO[ehAtaque ? currentCard.bonusLandedByIdx : currentCard.bonusMestreIdx].emoji} `
              : "";
          correctButtonsHtml = `<button class="btn-correct ${ehAtaque ? "duel-atk" : "duel-def"}" id="correctBtn" data-scorer="${responderIndex}">${ehAtaque ? "⚔️" : "🛡️"} ${escapeHtml(r ? r.name : "?")} acertou (${tagEq}${ehAtaque ? "desafiante" : "na defesa"})</button>`;
          palpiteHtml = buildPalpiteBoxHtml();
        } else {
          correctButtonsHtml = `<button class="btn-correct" id="correctBtn" data-scorer="${responderIndex}">✓ ${responderName} acertou</button>`;
          palpiteHtml = buildPalpiteBoxHtml();
        }
        controlsHtml = `
          <div class="pending-box spotlight-box"><span class="pending-num">Dica ${num}:</span> ${item.text}</div>
          <div style="text-align:center; opacity:0.75; font-size:0.85rem; margin-bottom:4px;">Vale ${pointsIfCorrect} pontos se acertar agora (${quemGanhaNm} ganha ${mestreGainDisplay})</div>
          ${spotlightTimerHtml}
          <div class="guess-btns" style="flex-direction:column;">
            ${correctButtonsHtml}
            <button class="btn-wrong" id="wrongBtn">✕ Errou</button>
            ${'<div class="mesa-btns"><button type="button" class="btn-pular" id="pularBtn" title="A pessoa não tinha palpite: passa a vez sem contar como erro" aria-label="Pulou: não tinha palpite, passa a vez">» Pulou</button><button type="button" class="btn-absurdo" id="absurdoBtn" title="O chute foi absurdo (nada a ver com a dica): conta como erro e o C.A.O.S. fica sabendo" aria-label="Absurdo: o chute não tinha nada a ver, conta como erro">⚠︎ Absurdo</button></div>'}
          </div>
          ${palpiteHtml}`;
      }
    } else {
      const totalEntries = currentCard.clues.length;
      const remaining = totalEntries - revealedOrder.length;
      let grid = "";
      for (let i = 0; i < totalEntries; i++) {
        const used = revealedOrder.some((r) => r.index === i);
        grid += `<button class="number-btn${used ? " aberta" : ""}" data-idx="${i}" ${used ? 'aria-disabled="true" title="Essa dica já foi aberta"' : ""}>${i + 1}</button>`;
      }
      controlsHtml = `
        <div class="pick-label">${responderName}, escolha uma dica de 1 a ${totalEntries} (${remaining} restantes)</div>
        <div id="timerDisplay" class="pick-timer">◷ ${secondsLeft()}s</div>
        <div class="number-grid">${grid}</div>`;
    }
    if (CURRENT_MODE === "express" && pendingIndex !== null && !expressAskWho) controlsHtml += expressRodaHtml();
    if (pendingIndex !== null && currentCard.clues[pendingIndex].type === "clue") {
      controlsHtml += `<button type="button" class="conferir-btn" id="conferirBtn">${Date.now() < answerRevealUntil ? answerHtml() : "👁️ Conferir resposta"}</button>`;
    }
    const historyBlurred = pendingIndex !== null ? "blurred" : "";
    const realCluesCount = revealedOrder.filter((r) => r.item.type === "clue").length;
    // no Express a 1ª dica abre sozinha (nunca fica sem dica aberta): o descarte vale com a dica na tela
    const expressPodeDescartar = CURRENT_MODE === "express" && pendingIndex !== null && !expressAskWho && !expressWhoFreeze;
    const canDiscard = podeDescartarCarta(); // 1.7.9: mesma regra da porta das ações
    let extraBtnsHtml = "";
    // 1.7.8.7: o "Reembaralhar" (antes da 1ª dica, sem limite) saiu; fazia o mesmo que o Descartar.
    // Trocar a carta é só pelo Descartar (até a 5ª dica, no máximo 2 seguidas). No online, vira votação da mesa.
    if (canDiscard) {
      const chancesLeft = 5 - realCluesCount;
      const discardsLeft = 2 - consecutiveDiscards;
      const discardText = expressPodeDescartar
        ? `✕ Carta muito difícil? Descartar e puxar outra (${realCluesCount < 5 ? "até a 5ª dica, " : "última chance, "}${discardsLeft} descarte${discardsLeft === 1 ? "" : "s"} seguido${discardsLeft === 1 ? "" : "s"})`
        : realCluesCount === 0
          ? `✕ Carta muito difícil? Descartar (${discardsLeft} chance${discardsLeft === 1 ? "" : "s"} de descarte)`
          : `✕ Carta muito difícil? Descartar (${chancesLeft} chance${chancesLeft === 1 ? "" : "s"} de dica, ${discardsLeft} de descarte)`;
      extraBtnsHtml += `<button class="discard-btn" id="discardBtn">${discardText}</button>`;
    }
    if (podeDesistirCarta())
      extraBtnsHtml += `<button class="discard-btn" id="giveUpBtn" style="color:#b45309;border-color:rgba(180,83,9,.5);margin-top:8px">🏳️ Desistir desta carta (ninguém acerta)</button>`;
    area.style.setProperty("--card-glow", (GEM_INFO[gemCategoryFor(currentCard.category)] || {}).color || "#a78bfa");
    const bonusBannerRevealedHtml = currentCard.isBonus ? renderBonusBanner() : "";
    const bonusDuelHtml = currentCard.isBonus ? renderBonusDuelInfo() : "";
    area.innerHTML = `
      ${bonusBannerRevealedHtml}
      <div class="answer-header cat-neon" style="--cat:${(GEM_INFO[gemCategoryFor(currentCard.category)] || {}).color || "#e94560"};"><span class="cat-selo">${CAT_SELO_ICONE[gemCategoryFor(currentCard.category)] || "🃏"} ${escapeHtml((GEM_INFO[gemCategoryFor(currentCard.category)] || {}).name || gemCategoryFor(currentCard.category))}</span>Diga aos jogadores: "Eu sou ${formatLabelUppercase(CATEGORY_LABELS[gemCategoryFor(currentCard.category)])}."</div>
      ${bonusDuelHtml}
      ${answerLineHtml()}
      <div class="clue-history ${historyBlurred}">
        <div class="turn-info">
          <span class="mestre-tag">🎙️ Mestre: ${mestreNameHtml}</span>
          <span class="responder-tag">👉 Vez de: ${responderNameHtml}</span>
        </div>
        <ul class="clue-list">${revealedItems}</ul>
      </div>
      ${controlsHtml}
      ${extraBtnsHtml}
    `;
    drawBtn.style.display = "none";
    wireAnswerToggle();
    if (CURRENT_MODE === "express") updateTimerDisplay();
    if (pendingIndex !== null) {
      const item = currentCard.clues[pendingIndex];
      if (CURRENT_MODE === "express") wireExpressControls(area);
      if (canDiscard && CURRENT_MODE === "express") {
        const db = document.getElementById("discardBtn");
        if (db) db.addEventListener("click", discardAndDraw);
      }
      if (item.type === "special") {
        const loseTurnBtn = document.getElementById("loseTurnBtn");
        const continueBtn = document.getElementById("continueSpecialBtn");
        if (continueBtn) continueBtn.addEventListener("click", continueAfterSpecial);
        if (loseTurnBtn) loseTurnBtn.addEventListener("click", loseTurnAfterSpecial);
      } else if (CURRENT_MODE !== "express") {
        document.getElementById("correctBtn").addEventListener("click", function () {
          markCorrect(parseInt(this.dataset.scorer));
        });
        const wildcardBtn = document.getElementById("correctWildcardBtn");
        if (wildcardBtn)
          wildcardBtn.addEventListener("click", function () {
            markCorrect(parseInt(this.dataset.scorer));
          });
        area
          .querySelectorAll(".palpite-hit")
          .forEach((b) => b.addEventListener("click", () => palpiteHit(b.dataset.key)));
        area
          .querySelectorAll(".palpite-miss")
          .forEach((b) => b.addEventListener("click", () => palpiteMiss(b.dataset.key)));
        document.getElementById("wrongBtn").addEventListener("click", () => markWrong());
        {
          const pb = document.getElementById("pularBtn");
          if (pb) pb.addEventListener("click", () => markWrong("pular"));
          const ab = document.getElementById("absurdoBtn");
          if (ab) ab.addEventListener("click", () => markWrong("absurdo"));
        }
      }
    } else {
      const gridEl = area.querySelector(".number-grid");
      if (gridEl) {
        gridEl.onclick = (e) => {
          const btn = e.target.closest(".number-btn");
          if (!btn || btn.disabled) return;
          if (btn.classList.contains("aberta")) {
            caosDicaRepetida(parseInt(btn.dataset.idx));
            return;
          }
          chooseClue(parseInt(btn.dataset.idx));
        };
      }
      if (canDiscard) document.getElementById("discardBtn").addEventListener("click", discardAndDraw);
      {
        const gu = document.getElementById("giveUpBtn");
        if (gu) gu.addEventListener("click", pedirDesistirCarta);
      }
    }
  }
}
// Nome do Mestre em destaque (carta virada e roleta), pra ninguém ler a carta sem ser o Mestre.
function mestreDestaqueHtml() {
  const m = players[mestreIndex];
  return `<span class="mestre-destaque">🎙️ ${m ? playerNameHtml(m.name, m.color, m.avatar) : "?"}</span>`;
}
// 1.7.8.6 (feedback do JF): "Ver carta" vira a carta de verdade (as costas giram e a roleta entra
// do outro lado); depois do "Falei!", sem outro giro: a frase "Diga aos jogadores" sobe deslizando até o
// topo da carta e o resto aparece aos poucos. Só enfeite: o estado do jogo muda na hora, como antes.
function cartaAnimar() {
  try {
    if (!visualFxAllowed()) return false;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  } catch (e) {}
  return true;
}
function cartaAnimarClasse(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  const fim = (ev) => ev.target === el && tira();
  const tira = () => {
    el.classList.remove(cls);
    el.removeEventListener("animationend", fim);
  };
  el.addEventListener("animationend", fim);
  setTimeout(tira, 1500);
}
// cópia das costas da carta, por cima, girando pra fora (a carta de verdade já é a roleta por baixo)
function cartaCostasSaindo(area) {
  try {
    const r = area.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const c = area.cloneNode(true);
    c.removeAttribute("id"); // nada de dois #cardArea na tela
    c.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id"));
    c.setAttribute("aria-hidden", "true");
    c.classList.add("flip-sai");
    Object.assign(c.style, {
      position: "fixed",
      left: r.left + "px",
      top: r.top + "px",
      width: r.width + "px",
      height: r.height + "px",
      margin: "0",
      zIndex: "60",
      pointerEvents: "none",
      boxSizing: "border-box",
    });
    document.body.appendChild(c);
    const tira = () => c.remove();
    c.addEventListener("animationend", tira, { once: true });
    setTimeout(tira, 900);
  } catch (e) {}
}
// guarda onde estava a frase da roleta, pra depois da virada ela deslizar até o topo da carta
function cartaFraseAntes() {
  try {
    const f = document.querySelector("#cardArea .roulette-phrase");
    return f ? f.getBoundingClientRect().top : null;
  } catch (e) {
    return null;
  }
}
function cartaFraseSobe(topoAntes) {
  if (!cartaAnimar()) return;
  try {
    const area = document.getElementById("cardArea");
    const h = area && area.querySelector(".answer-header");
    if (!area || !h) return;
    cartaAnimarClasse(area, "revelando");
    if (topoAntes === null) return;
    const dy = topoAntes - h.getBoundingClientRect().top;
    if (Math.abs(dy) < 4) return;
    h.style.transition = "none";
    h.style.transform = `translateY(${dy}px)`;
    void h.offsetWidth;
    // 1.7.8.7: subida mais lenta e macia (antes 0,5 s parecia instantâneo)
    h.style.transition = "transform 1s cubic-bezier(0.33, 0, 0.2, 1)";
    h.style.transform = "";
    setTimeout(() => (h.style.transition = ""), 1100);
  } catch (e) {}
}
// 1.7.8.9: a roleta é lembrada pela carta. Antes, qualquer render() no meio dela (pausa e volta, balão
// que fecha) redesenhava as costas e o Mestre tinha que virar de novo. Agora o render() redesenha a
// roleta já pousada na categoria. (roletaCarta mora em 02-estado.js)
function startCategoryRoulette() {
  roletaDesenhar(false);
}
function roletaDesenhar(jaPousada) {
  if (cardState !== "hidden" || !currentCard) return;
  roletaCarta = currentCard;
  const area = document.getElementById("cardArea");
  const finalCat = gemCategoryFor(currentCard.category);
  // no Express a roleta só gira entre as categorias da partida (escolhidas ou sorteadas pelo C.A.O.S.)
  const cats =
    CURRENT_MODE === "express" && expressSelectedCategories && expressSelectedCategories.length
      ? expressSelectedCategories.slice()
      : currentGemCategories();
  if (!cats.includes(finalCat)) cats.push(finalCat);
  const label = (c) => (CATEGORY_LABELS[c] || c).toUpperCase();
  const token = ++rouletteToken;
  const virar = !jaPousada && cartaAnimar();
  if (virar) cartaCostasSaindo(area);
  area.className = "card";
  area.style.setProperty("--card-glow", (GEM_INFO[finalCat] || {}).color || "#a78bfa");
  area.innerHTML = `
    <div class="roulette" style="--cat:${(GEM_INFO[finalCat] || {}).color || "#e94560"};">
      <div class="roulette-title">Mestre ${mestreDestaqueHtml()}, diga aos jogadores:</div>
      <div class="roulette-phrase">"Eu sou <span class="roulette-reel" id="rouletteReel">${label(cats[0])}</span>"</div>
      <div class="roulette-hint" id="rouletteHint">🎰 sorteando a categoria...</div>
      <button type="button" class="flip-btn" id="rouletteDoneBtn" style="display:none;">✓ Falei! Mostrar a carta</button>
    </div>`;
  if (virar) cartaAnimarClasse(area, "flip-entra");
  const reel = document.getElementById("rouletteReel");
  const finish = () => {
    if (token !== rouletteToken || cardState !== "hidden" || !reel.isConnected) return;
    reel.textContent = label(finalCat);
    reel.classList.add("landed");
    document.getElementById("rouletteHint").textContent =
      "🗣️ Leia a frase em voz alta pra todo mundo — só a categoria, nunca a resposta!";
    const btn = document.getElementById("rouletteDoneBtn");
    btn.style.display = "";
    btn.addEventListener("click", () => {
      if (token === rouletteToken) flipCard();
    });
    if (!jaPousada) caosRoletaSom("pouso");
  };
  if (jaPousada || !visualFxAllowed() || cats.length < 2) {
    finish();
    return;
  }
  let i = Math.floor(Math.random() * cats.length),
    step = 0,
    delay = 55;
  const STEPS = 14 + Math.floor(Math.random() * 4);
  const spin = () => {
    if (token !== rouletteToken || cardState !== "hidden" || !reel.isConnected) return;
    if (step >= STEPS) {
      finish();
      return;
    }
    i = (i + 1) % cats.length;
    reel.textContent = label(cats[i]);
    caosRoletaSom("tick", step, STEPS);
    step++;
    delay = Math.min(260, delay * 1.16);
    setTimeout(spin, delay);
  };
  spin();
}
function answerLineHtml() {
  const open = answerLivre() || Date.now() < answerRevealUntil;
  return `<button type="button" id="answerToggle" class="answer-line-name answer-toggle${open ? " open" : ""}${answerLivre() ? " livre" : ""}">${answerTexto(open)}</button>${answerLivre() ? `<div class="ans-hint" id="ansHint">👆 toque pra esconder · some sozinha na ${CURRENT_MODE === "express" ? "2ª" : "1ª"} dica</div>` : ""}`;
}
function wireAnswerToggle() {
  ["answerToggle", "conferirBtn"].forEach((id) => {
    const b = document.getElementById(id);
    if (b) b.addEventListener("click", revealAnswerBriefly);
  });
}
function revealAnswerBriefly() {
  if (!currentCard) return;
  // resposta à mostra antes da 1ª dica: o toque esconde na hora
  if (answerLivre()) {
    answerEscondidaCarta = currentCard;
    answerRevealUntil = 0;
    clearTimeout(answerHideRef);
    refreshAnswerToggle();
    return;
  }
  const jaAberta = Date.now() < answerRevealUntil;
  answerRevealUntil = Date.now() + ANSWER_REVEAL_MS;
  refreshAnswerToggle();
  clearTimeout(answerHideRef);
  answerHideRef = setTimeout(() => {
    answerRevealUntil = 0;
    refreshAnswerToggle();
  }, ANSWER_REVEAL_MS);
  if (jaAberta) return;
  answerChecksThisCard++;
  const m = players[mestreIndex];
  if (
    m &&
    playerHumor(m) !== "suave" &&
    !caosSilenced &&
    !activeToastState &&
    ((answerChecksThisCard === 3 && Math.random() < 0.6) || (answerChecksThisCard >= 5 && Math.random() < 0.35))
  ) {
    showToastMessage(
      getRandomReaction(REACTIVE_VOICE.conferirResposta, m.name, answerChecksThisCard),
      null,
      false,
      false,
      true,
    );
  }
}
function refreshAnswerToggle() {
  if (!currentCard) return;
  const open = answerLivre() || Date.now() < answerRevealUntil;
  const b = document.getElementById("answerToggle");
  if (b) {
    b.classList.toggle("open", open);
    b.classList.toggle("livre", answerLivre());
    b.innerHTML = answerTexto(open);
  }
  const hh = document.getElementById("ansHint");
  if (hh) hh.style.display = answerLivre() ? "" : "none";
  const c = document.getElementById("conferirBtn");
  if (c) {
    c.classList.toggle("open", open);
    c.innerHTML = open ? answerHtml() : "👁️ Conferir resposta";
  }
}
function renderBonusBanner() {
  return `<div class="bonus-banner">⭐ CARTA BÔNUS — vale pontos em dobro nesta carta!</div>`;
}
function renderBonusDuelInfo() {
  if (!currentCard || !currentCard.isBonus) return "";
  const lander = entityDisplay(currentCard.bonusLandedByIdx);
  const opponent = entityDisplay(currentCard.bonusMestreIdx);
  const landerHtml = playerNameHtml(lander.name, lander.color, lander.avatar);
  const opponentHtml = playerNameHtml(opponent.name, opponent.color, opponent.avatar);
  let repNote = "";
  if (
    CURRENT_FORMAT === "equipe" &&
    players[currentCard.bonusLanderPlayerIdx] &&
    players[currentCard.bonusOpponentPlayerIdx]
  ) {
    repNote = ` (representantes: ${escapeHtml(players[currentCard.bonusLanderPlayerIdx].name)} vs ${escapeHtml(players[currentCard.bonusOpponentPlayerIdx].name)})`;
  }
  return `<div class="bonus-duel-info">🏟️ Duelo de casa de bônus: <strong>${landerHtml}</strong> parou exatamente numa casa de bônus e escolheu duelar contra <strong>${opponentHtml}</strong> por esta carta em dobro${repNote}.</div>`;
}
function renderBoardTrack() {
  const track = document.getElementById("boardTrack");
  if (!track) return;
  if (CURRENT_MODE === "express" || players.length === 0) {
    track.innerHTML = "";
    return;
  }
  let bonusMarks = "";
  for (let pos = BONUS_HOUSE_INTERVAL; pos < WINNING_SCORE; pos += BONUS_HOUSE_INTERVAL) {
    const pct = (pos / WINNING_SCORE) * 100;
    bonusMarks += `<div class="board-bonus-mark" style="left:${pct}%"></div>`;
    // número só a cada 20 casas em tabuleiros grandes, pra não embolar na tela do celular
    if (pos % (WINNING_SCORE >= 150 ? 20 : 10) === 0)
      bonusMarks += `<div class="board-bonus-label" style="left:${pct}%">${pos}</div>`;
  }
  let tokens;
  if (CURRENT_FORMAT === "equipe") {
    tokens = teamOrder
      .map((id, i) => {
        const t = teams[id];
        const info = TEAM_INFO[id];
        const pct = Math.max(0, Math.min(100, (t.position / WINNING_SCORE) * 100));
        const verticalOffset = i % 2 === 0 ? -10 : 10;
        return `<div class="board-token" style="left:${pct}%; top:calc(50% + ${verticalOffset}px); background:${info.color};" title="Equipe ${info.label}: ${t.position} casa">${info.emoji}</div>`;
      })
      .join("");
  } else {
    tokens = players
      .map((p, i) => {
        const pct = Math.max(0, Math.min(100, (p.position / WINNING_SCORE) * 100));
        const label = p.avatar || (p.name ? p.name[0].toUpperCase() : "?");
        const verticalOffset = i % 2 === 0 ? -10 : 10;
        return `<div class="board-token${p.color === "GRAD_ONYX" ? " onyx-swatch" : ""}${GRADIENTS[p.color] && p.color !== "GRAD_ONYX" ? " grad-anim" : ""}" style="left:${pct}%; top:calc(50% + ${verticalOffset}px); background:${GRADIENTS[p.color] && p.color !== "GRAD_ONYX" ? caosGradLoop(p.color) : playerColorCss(p.color)};${p.color === "GRAD_ONYX" ? " color:#fff;" : ""}" title="${escapeHtml(p.name)}: ${p.score} pts, casa ${p.position}">${label}</div>`;
      })
      .join("");
  }
  track.innerHTML = `<div class="board-track-line"></div>${bonusMarks}${tokens}
    <div class="board-endpoints"><span>Casa 0</span><span class="board-hint">🔍 toque pra ampliar</span><span>Casa ${WINNING_SCORE}${boardCountsForWin() ? "" : " · não vale vitória"}</span></div>`;
  const chaves =
    CURRENT_FORMAT === "equipe"
      ? teamOrder.map((id) => ["t" + id, teams[id].position])
      : players.map((p) => ["p" + p.name, p.position]);
  const els = track.querySelectorAll(".board-token");
  chaves.forEach(([k, pos], i) => {
    const antes = caosTokPrev[k];
    caosTokPrev[k] = pos;
    if (antes !== void 0 && antes !== pos && els[i] && !document.body.classList.contains("batata-mode")) {
      els[i].classList.add("pulando");
      els[i].dataset.t0 = Date.now();
    }
  });
}
// Tabuleiro ampliado: cada jogador (ou equipe) numa linha, do primeiro ao último, com a
// distância pro líder e quanto falta pra chegar.
function abrirTabuleiroGrande() {
  if (CURRENT_MODE === "express" || !players.length) return;
  const ents =
    CURRENT_FORMAT === "equipe"
      ? teamOrder.map((id) => ({
          nome: `${TEAM_INFO[id].emoji} Equipe ${TEAM_INFO[id].label}`,
          pos: teams[id].position,
          cor: corDoJogador(TEAM_INFO[id].color),
          tok: TEAM_INFO[id].emoji,
        }))
      : players.map((p) => ({
          nome: playerNameHtml(p.name, p.color, p.avatar),
          pos: p.position,
          cor: corDoJogador(p.color),
          tok: escapeHtml(p.avatar || (p.name ? p.name[0].toUpperCase() : "?")),
        }));
  ents.sort((a, b) => b.pos - a.pos);
  const meta = WINNING_SCORE,
    lider = ents[0].pos;
  let ticks = "";
  for (let pos = BONUS_HOUSE_INTERVAL; pos < meta; pos += BONUS_HOUSE_INTERVAL) ticks += `<i style="left:${(pos / meta) * 100}%"></i>`;
  const casas = (n) => `${n} ${n === 1 ? "casa" : "casas"}`;
  const linhas = ents
    .map((e, i) => {
      const pct = Math.max(0, Math.min(100, (e.pos / meta) * 100));
      const dist =
        e.pos === lider
          ? ents.filter((x) => x.pos === lider).length > 1
            ? "🏁 Empatado na frente"
            : "🏁 Na frente"
          : `a ${casas(lider - e.pos)} do líder`;
      return `<li class="tg-row" style="--pc:${e.cor}"><div class="tg-top"><span>${i + 1}º ${e.nome}</span><span>casa ${e.pos}/${meta}</span></div><div class="tg-bar"><div class="tg-fill" style="width:${pct}%"></div>${ticks}<span class="tg-tok" style="left:${pct}%">${e.tok}</span></div><div class="tg-dist">${dist} · faltam ${casas(Math.max(0, meta - e.pos))} pra chegar</div></li>`;
    })
    .join("");
  document.getElementById("tabuleiroModal")?.remove();
  const bg = document.createElement("div");
  bg.id = "tabuleiroModal";
  bg.className = "jf-modal-bg";
  bg.innerHTML = `<div class="jf-modal" role="dialog" aria-modal="true" aria-labelledby="tgTitle"><h3 id="tgTitle">🗺️ Tabuleiro</h3><div class="nov-sub">Quem está na frente e quem está atrás</div><ul class="tg-list">${linhas}</ul><button type="button" class="btn-start btn-neo neo-solid neo-still" id="tgOk" style="--mc:#a78bfa; --mc-glow:rgba(167,139,250,0.35); margin-top:10px;">Fechar</button></div>`;
  document.body.appendChild(bg);
  const fechar = () => bg.remove();
  bg.querySelector("#tgOk").addEventListener("click", fechar);
  bg.addEventListener("click", (ev) => {
    if (ev.target === bg) fechar();
  });
}
// Cor sólida que representa o jogador (degradês e RGB viram um tom fixo), pra tingir caixinhas.
function corDoJogador(c) {
  if (typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c)) return c;
  if (c === "RGB") return "#a855f7";
  const g = typeof c === "string" && GRADIENTS[c] && /#[0-9a-f]{6}/i.exec(GRADIENTS[c]);
  return g ? g[0] : "#a78bfa";
}
function renderMiniScoreboard() {
  const list = document.getElementById("miniScoreboard");
  if (list) {
    if (CURRENT_MODE === "express") {
      const sorted = [...players].sort((a, b) => b.score - a.score);
      list.innerHTML = sorted
        .map(
          (p) => `
        <li style="--pc:${corDoJogador(p.color)}">${playerNameHtml(p.name, p.color, p.avatar)}${jogEmoHtml(p)}: ${p.score} pt${p.score === 1 ? "" : "s"}${gemBadgesHtml(p)}${joiasTravaBadge(CURRENT_FORMAT === "equipe" ? p.team : p.id)}</li>
      `,
        )
        .join("");
    } else if (CURRENT_FORMAT === "equipe") {
      const wc = winCond();
      const sortedTeams = [...teamOrder].sort(
        (a, b) => rankValue(teams[b], b) - rankValue(teams[a], a) || teams[b].position - teams[a].position,
      );
      list.innerHTML = sortedTeams
        .map((id) => {
          const info = TEAM_INFO[id];
          const txt =
            wc === "pontos"
              ? `${teamScore(id)}/${metaPontos()} pts — casa ${teams[id].position}`
              : wc === "joias"
                ? `${gemTotal(teams[id])}/${GEMS_TO_WIN} joias — casa ${teams[id].position}`
                : `casa ${teams[id].position}/${WINNING_SCORE}`;
          return `<li style="--pc:${corDoJogador(info.color)}">${info.emoji} Equipe ${info.label}: ${txt}${palpiteBadge(id)}${gemBadgesHtml(teams[id])}${joiasTravaBadge(id)}</li>`;
        })
        .join("");
    } else {
      const wc = winCond();
      const sorted = [...players].sort((a, b) => rankValue(b) - rankValue(a) || b.position - a.position);
      list.innerHTML = sorted
        .map((p) => {
          const txt =
            wc === "pontos"
              ? `${p.score}/${metaPontos()} pts — casa ${p.position}`
              : wc === "joias"
                ? `${gemTotal(p)}/${GEMS_TO_WIN} joias — casa ${p.position}`
                : wc === "tabuleiro"
                  ? `casa ${p.position}/${WINNING_SCORE}`
                  : `${p.score} pts — casa ${p.position}/${WINNING_SCORE}`;
          return `<li style="--pc:${corDoJogador(p.color)}">${playerNameHtml(p.name, p.color, p.avatar)}${jogEmoHtml(p)}: ${txt}${palpiteBadge(p.id)}${gemBadgesHtml(p)}${joiasTravaBadge(p.id)}</li>`;
        })
        .join("");
    }
  }
  renderBoardTrack();
}
function renderScoreboard() {
  const list = document.getElementById("scoreboard");
  if (players.length === 0) {
    list.innerHTML = '<li style="opacity:0.6;">Nenhum jogador adicionado ainda</li>';
    return;
  }
  const withIndex = players.map((p, i) => ({ ...p, originalIndex: i }));
  withIndex.sort((a, b) => b.score - a.score);
  list.innerHTML = withIndex
    .map((p) => {
      const bracket =
        CURRENT_FORMAT === "equipe" && p.ageBracket ? AGE_BRACKETS.find((b) => b.id === p.ageBracket) : null;
      const ageBadge =
        (bracket ? ` <span class="age-badge">${escapeHtml(bracket.label)}</span>` : "") +
        (p.iniciante
          ? ' <span class="age-badge">🐣 iniciante</span>'
          : p.formado
            ? ' <span class="age-badge">🎓</span>'
            : "");
      return `
    <li>
      <span>${playerNameHtml(p.name, p.color, p.avatar)}${ageBadge}</span>
      <span><span class="pts">${p.score} pts</span><button class="remove-player" data-i="${p.originalIndex}">remover</button></span>
    </li>
  `;
    })
    .join("");
  list.querySelectorAll(".remove-player").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (starterChosen) return;
      players.splice(parseInt(btn.dataset.i), 1);
      undoTeamFormation();
      if (mestreIndex !== null && mestreIndex >= players.length) mestreIndex = 0;
      if (responderIndex !== null && responderIndex >= players.length) responderIndex = 0;
      renderScoreboard();
      renderColorPicker();
      renderAvatarPicker();
      updateDrawAvailability();
      saveGameState();
    });
  });
}
function renderAvatarPicker() {
  const row = document.getElementById("avatarPickerRow");
  if (!row) return;
  const list = avatarsForMode();
  const usedAvatars = new Set(players.map((p) => p.avatar));
  if (usedAvatars.has(selectedAvatar) || !list.includes(selectedAvatar)) {
    const free = list.find((a) => !usedAvatars.has(a));
    if (free) selectedAvatar = free;
  }
  row.innerHTML = list
    .map(
      (a) => `
    <button type="button" class="avatar-swatch ${a === selectedAvatar && cadMostraSel(cadEmoji) ? "selected" : ""}${usedAvatars.has(a) ? " tomada" : ""}" data-avatar="${a}" aria-label="Emoji ${a}${usedAvatars.has(a) ? " (já escolhido)" : ""}" ${usedAvatars.has(a) ? 'aria-disabled="true"' : ""}>${a}</button>
  `,
    )
    .join("");
  row.querySelectorAll(".avatar-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("tomada")) return caosEscolhaTomada("emoji", btn.dataset.avatar, btn);
      selectedAvatar = btn.dataset.avatar;
      renderAvatarPicker();
    });
  });
}
// Cores com dono fixo: aparecem na paleta com cadeado e só liberam pra quem tem o nome do dono.
const COR_EXCLUSIVA = {
  RGB: { de: "do JF", dono: (n) => isJfName(n) },
  GRAD_PRINCESA: { de: "da Anne", dono: (n) => isAnneName(n) },
};
function corReservada(c) {
  const inp = document.getElementById("playerNameInput"),
    nome = inp ? inp.value.trim() : "";
  return !!COR_EXCLUSIVA[c] && !COR_EXCLUSIVA[c].dono(nome);
}
// Tocou numa cor ou emoji que já tem dono: o botão não some, o C.A.O.S. explica (no tom da zoeira escolhida).
let caosTomadaAt = 0;
// Cada toque repetido sobe o tom: 1º leve, 2º normal, 3º em diante bravo (no Júnior para no normal).
// Zera quando alguém é adicionado.
let caosTomadaN = 0;
// Toque em cor/emoji com dono: a tela nega na hora (som, vibração, piscada vermelha e o
// botão treme) a cada toque; a fala do C.A.O.S. tem intervalo e sobe o tom.
function negarEscolha(btn) {
  playSfx("nega");
  vibrar("nega");
  if (!visualFxAllowed()) return;
  const el = document.createElement("div");
  el.className = "screen-flash flash-red";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
  if (btn) {
    btn.classList.remove("nega-treme");
    void btn.offsetWidth;
    btn.classList.add("nega-treme");
    setTimeout(() => btn.classList.remove("nega-treme"), 450);
  }
}
function caosEscolhaTomada(tipo, valor, btn) {
  const exclusiva = tipo === "cor" && COR_EXCLUSIVA[valor];
  const dono = exclusiva ? null : players.find((p) => (tipo === "cor" ? p.color : p.avatar) === valor);
  if (dono || exclusiva) negarEscolha(btn);
  if ((!dono && !exclusiva) || Date.now() - caosTomadaAt < 2500) return;
  caosTomadaAt = Date.now();
  caosTomadaN++;
  const nivel = caosTomadaN <= 1 ? "leve" : caosTomadaN === 2 || CURRENT_MODE === "junior" ? "normal" : "zero";
  caosLog("cadastro", `tocou em ${tipo} com dono (${caosTomadaN}ª vez, tom ${nivel})`);
  let txt;
  if (exclusiva) txt = getRandomReaction(REACTIVE_VOICE.escolhaExclusiva[nivel], exclusiva.de);
  else {
    const f =
      tipo === "cor" ? ["essa cor", "Essa cor", "escolhida", "outra", "a"] : ["esse emoji", "Esse emoji", "escolhido", "outro", "o"];
    txt = getRandomReaction(REACTIVE_VOICE.escolhaTomada[nivel], dono.name, ...f);
  }
  if (txt) showToastMessage(txt, null, true);
}
function renderColorPicker() {
  const row = document.getElementById("colorPickerRow");
  if (!row) return;
  const isBatata = document.body.classList.contains("batata-mode");
  const availableColors = PLAYER_COLORS.slice(0, -1)
    .concat(["GRAD_PRINCESA", "RGB"])
    .filter((c) => !(isBatata && (c === "RGB" || GRADIENTS[c])));
  const usedColors = new Set(players.map((p) => p.color));
  availableColors.forEach((c) => {
    if (corReservada(c)) usedColors.add(c);
  });
  if (usedColors.has(selectedColor) || !availableColors.includes(selectedColor)) {
    const free = availableColors.find((c) => !usedColors.has(c));
    if (free) selectedColor = free;
  }
  row.innerHTML = availableColors
    .map((c, i) => {
      const bg = c === "RGB" ? "" : "background:" + playerColorCss(c);
      const rotulo =
        (c === "GRAD_ONYX" ? "Ônix neon" : COR_EXCLUSIVA[c] ? "Cor exclusiva " + COR_EXCLUSIVA[c].de : "Cor " + (i + 1)) +
        (usedColors.has(c) ? " (já escolhida)" : "");
      return `<button type="button" class="color-swatch ${c === selectedColor && cadMostraSel(cadCor || CURRENT_FORMAT === "equipe") ? "selected" : ""} ${c === "RGB" ? "rgb-swatch" : ""} ${c === "GRAD_ONYX" ? "onyx-swatch" : ""}${usedColors.has(c) ? " tomada" : ""}${COR_EXCLUSIVA[c] && usedColors.has(c) && !players.some((p) => p.color === c) ? " reservada" : ""}" data-color="${c}" style="${bg}" aria-label="${rotulo}" ${usedColors.has(c) ? 'aria-disabled="true"' : ""} title="${c === "GRAD_ONYX" ? "Ônix neon" : COR_EXCLUSIVA[c] ? "Cor exclusiva " + COR_EXCLUSIVA[c].de : ""}"></button>`;
    })
    .join("");
  row.querySelectorAll(".color-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("tomada")) return caosEscolhaTomada("cor", btn.dataset.color, btn);
      selectedColor = btn.dataset.color;
      renderColorPicker();
    });
  });
}
function cadPrevs() {
  const cp = document.getElementById("colorPrev"),
    ap = document.getElementById("avatarPrev");
  if (cp)
    cp.innerHTML =
      cadMostraSel(cadCor) || CURRENT_FORMAT === "equipe"
        ? `<i class="pick-dot${selectedColor === "RGB" ? " rgb-swatch" : ""}" style="${selectedColor === "RGB" ? "" : "background:" + playerColorCss(selectedColor)}"></i>`
        : `<span class="pick-vazio">escolher</span>`;
  if (ap)
    ap.innerHTML = cadMostraSel(cadEmoji)
      ? escapeHtml(selectedAvatar || "")
      : `<span class="pick-vazio">escolher</span>`;
}
function iniJfNaMesa() {
  return players.some((p) => isJfName(p.name));
}
function iniPassos() {
  return ["nick", "avatar", CURRENT_FORMAT === "equipe" ? "faixa" : "cor", "humor", "pronto"];
}
function iniPassoAtual() {
  return iniFluxo ? iniPassos()[iniFluxo.i] : null;
}
function iniTexto(passo) {
  const nome = (document.getElementById("playerNameInput").value || "").trim();
  const culpa = iniJfNaMesa() ? "do JF, que tá aí na mesa e me programou assim" : "de quem me programou";
  return {
    nick: 'Oi! Primeira vez? Relaxa, eu te ajudo. Primeiro, escreve seu nome ou um apelido no campo aceso (de 2 a 15 letras). Sem ideia? Toca em "Sem ideia de nome" que eu sugiro um.',
    avatar: `Boa${nome ? ", " + nome : ""}! Agora escolhe um desenho pra ser você no jogo. Ele aparece do lado do seu nome e na sua pecinha do tabuleiro.`,
    cor: "Agora a sua cor. Ela pinta o seu nome no placar. Cada pessoa tem uma cor diferente, as que já têm dono ficam apagadas.",
    faixa:
      "Agora a sua faixa de idade. É só pra deixar os times equilibrados na hora do sorteio. Ninguém vai ver sua idade, prometo.",
    humor: `Aqui cada um escolhe o quanto eu posso zoar. Com você eu vou no 🌷 Suave a partida inteira. Paciência não é bem o meu forte… mas hoje eu vou treinar. Se eu escorregar, a culpa é ${culpa}.`,
    pronto: `Tudo certo${nome ? ", " + nome : ""}! Confere aí e toca em "Adicionar". Na partida eu te dou umas dicas rápidas quando for a sua vez. Depois eu te deixo em paz. Mais ou menos.`,
  }[passo];
}
function iniAtualizarBotao() {
  const b = document.getElementById("iniBtn");
  if (!b) return;
  b.style.display = !iniFluxo && !starterChosen && players.length < MAX_PLAYERS ? "" : "none";
}
function iniRender(aviso) {
  const passos = iniPassos(),
    passo = passos[iniFluxo.i];
  const panel = document.getElementById("playerPanel");
  panel.querySelectorAll(".ini-foco").forEach((el) => el.classList.remove("ini-foco"));
  INI_ALVOS[passo].forEach((sel) => {
    const el = panel.querySelector(sel);
    if (el) {
      el.classList.add("ini-foco");
      if (el.tagName === "DETAILS") el.open = true;
    }
  });
  document.getElementById("iniPasso").textContent = `passo ${iniFluxo.i + 1} de ${passos.length}`;
  const txt = document.getElementById("iniTxt");
  txt.textContent = iniTexto(passo);
  if (aviso) {
    const a = document.createElement("span");
    a.className = "ini-aviso";
    a.textContent = aviso;
    txt.appendChild(a);
  }
  document.getElementById("iniVoltar").disabled = iniFluxo.i === 0;
  document.getElementById("iniProx").style.display = passo === "pronto" ? "none" : "";
  document.getElementById("addPlayerBtn").disabled = passo !== "pronto" && passo !== "nick";
  document.getElementById("humorPickerRow").classList.toggle("ini-trava", true);
  if (passo === "nick")
    setTimeout(() => {
      try {
        document.getElementById("playerNameInput").focus();
      } catch (e) {}
    }, 50);
  if (!aviso) caosSpeak("[C.A.O.S.] " + iniTexto(passo));
}
function iniComecar() {
  if (starterChosen || players.length >= MAX_PLAYERS) return;
  if (tutSugerir("iniciante", iniComecar)) return;
  iniFluxo = { i: 0 };
  if (activeToastState) closeActiveToast();
  selectedHumor = "suave";
  renderHumorPicker();
  hideNickSuggest();
  document.getElementById("playerPanel").classList.add("ini-ativo");
  document.getElementById("iniCoach").style.display = "";
  iniAtualizarBotao();
  caosLog("iniciante", "cadastro guiado começou");
  iniRender();
}
function iniProximo() {
  if (!iniFluxo) return;
  if (iniPassoAtual() === "nick") {
    const nome = (document.getElementById("playerNameInput").value || "").trim();
    if (nome.length < 2 || nome.length > 15) {
      iniRender("Escreve um nome de 2 a 15 letras. Com calma, eu espero. (Tô treinando a paciência, lembra?)");
      return;
    }
    if (players.some((p) => p.name.toLowerCase() === nome.toLowerCase())) {
      iniRender("Esse nome já está na mesa. Tenta outro, ou um apelido!");
      return;
    }
  }
  iniFluxo.i = Math.min(iniPassos().length - 1, iniFluxo.i + 1);
  iniRender();
}
function iniVoltar() {
  if (!iniFluxo) return;
  iniFluxo.i = Math.max(0, iniFluxo.i - 1);
  iniRender();
}
function iniEncerrar() {
  iniFluxo = null;
  const panel = document.getElementById("playerPanel");
  panel.classList.remove("ini-ativo");
  panel.querySelectorAll(".ini-foco").forEach((el) => el.classList.remove("ini-foco"));
  document.getElementById("humorPickerRow").classList.remove("ini-trava");
  document.getElementById("iniCoach").style.display = "none";
  document.getElementById("addPlayerBtn").disabled = false;
  caosVoiceCancel();
  iniAtualizarBotao();
}
function iniSair() {
  iniEncerrar();
  selectedHumor = CURRENT_MODE === "junior" ? "familia" : "normal";
  renderHumorPicker();
  caosLog("iniciante", "saiu do cadastro guiado");
}
// Zoeira por modo: Júnior sem Ácido/Nível 0; Hardcore sem Suave (é pra ser pesado).
function humorOptionsForMode() {
  if (CURRENT_MODE === "hardcore") return ["normal", "acido", "zero"];
  return CURRENT_MODE === "junior" ? ["familia", "suave", "normal"] : ["suave", "normal", "acido", "zero"];
}
// Júnior (Family friendly) e Hardcore (Normal) já vêm com a zoeira marcada; dá pra trocar.
function humorPreMarcado() {
  return CURRENT_MODE === "junior" || CURRENT_MODE === "hardcore";
}
function renderHumorPicker() {
  const row = document.getElementById("humorPickerRow");
  if (!row) return;
  const junior = CURRENT_MODE === "junior";
  const JR_HINT = {
    suave: "Zoa um pouquinho e dá uma risadinha aqui e ali, mas sempre tranquilo.",
    normal: "Zoa e implica, mas dentro do limite e sem ficar magoado (versão Júnior: sem ácido e sem cantada).",
    caos: "Ele sorteia entre Family friendly, Suave e Normal e, no meio do jogo, pergunta se você está curtindo.",
  };
  const opts = junior
    ? HUMOR_OPTIONS.filter((o) => o.id !== "acido" && o.id !== "zero").map((o) =>
        JR_HINT[o.id] ? { ...o, hint: JR_HINT[o.id] } : o,
      )
    : CURRENT_MODE === "hardcore"
      ? HUMOR_OPTIONS.filter((o) => o.id !== "familia" && o.id !== "suave").map((o) =>
          o.id === "caos"
            ? {
                ...o,
                hint: "Ele sorteia como vai tratar você (Normal, Ácido ou Nível 0) e, no meio do jogo, pergunta se você está curtindo. No Hardcore não tem Suave.",
              }
            : o,
        )
      : HUMOR_OPTIONS.filter((o) => o.id !== "familia");
  if (!opts.some((o) => o.id === selectedHumor)) selectedHumor = junior ? "familia" : "normal";
  row.innerHTML = opts
    .map(
      (o) =>
        `<button type="button" class="main-btn age-swatch humor-btn${o.id === selectedHumor && (cadMostraSel(cadHumor) || humorPreMarcado()) ? " on" : ""}" data-humor="${o.id}" style="--hc:${HUMOR_COR[o.id] || "#fbbf24"};">${o.label}</button>`,
    )
    .join("");
  row.querySelectorAll("[data-humor]").forEach((btn) =>
    btn.addEventListener("click", () => {
      selectedHumor = btn.dataset.humor;
      cadHumor = true;
      renderHumorPicker();
      cadAtualizarBotao();
    }),
  );
  const hint = document.getElementById("humorHint");
  const cur = cadMostraSel(cadHumor) || humorPreMarcado() ? opts.find((o) => o.id === selectedHumor) : null;
  if (hint) hint.textContent = cur ? cur.hint : "Toque numa opção pra escolher a zoeira.";
  row.classList.toggle("tem-escolha", !!cur);
  const ha = document.getElementById("humorAtual");
  if (ha) {
    ha.textContent = cur ? cur.label : "escolher";
    ha.style.color = cur ? HUMOR_COR[selectedHumor] || "" : "";
  }

  try {
    cadAtualizarBotao();
  } catch (e) {}
}
function nickKidsContext() {
  return CURRENT_MODE === "junior" || (CURRENT_FORMAT === "equipe" && selectedAgeBracket === "crianca");
}
function nickWaitReset() {
  nickWaitStart = Date.now();
  nickWaitStage = 0;
}
function showNickSuggest() {
  const box = document.getElementById("nickSuggest"),
    nm = document.getElementById("nickSuggestName");
  const s = pickNickSuggestion();
  if (!box || !nm || !s) return false;
  nickSuggestCurrent = s;
  nm.textContent = s + (nickSugestaoDoRepertorio ? " (já jogou aqui)" : "");
  box.style.display = "block";
  return true;
}
function hideNickSuggest() {
  const box = document.getElementById("nickSuggest");
  if (box) box.style.display = "none";
  nickSuggestCurrent = null;
}
function nickWaitTick() {
  if (!cadastroAberto()) {
    nickWaitStart = null;
    return;
  }
  if (iniFluxo) {
    nickWaitReset();
    return;
  }
  if (nickWaitStart === null) {
    nickWaitReset();
    return;
  }
  const input = document.getElementById("playerNameInput");
  const mexendo = !!input && (document.activeElement === input || input.value.trim().length > 0);
  if (players.length >= MIN_PLAYERS && !mexendo) return;
  const elapsed = Date.now() - nickWaitStart;
  const stage = NICK_WAIT_STAGES[nickWaitStage];
  if (!stage || elapsed < stage.at) return;
  nickWaitStage++;
  const querSugestao = stage.bank === "forte" || (stage.bank === "media" && nickKidsContext());
  const digitando = !!input && input.value.trim().length > 0;
  const mostrou = querSugestao && !digitando && showNickSuggest();
  if (caosSilenced || activeToastState || (digitando && stage.bank === "leve")) return;
  const bank = stage.bank === "forte" && !mostrou ? "media" : stage.bank;
  const msg = getRandomReaction(REACTIVE_VOICE.nickDemora[bank], caosTempoFala(elapsed));
  if (msg) showToastMessage(msg);
}
function renderAgeBracketPicker() {
  const row = document.getElementById("ageBracketRow");
  if (!row) return;
  row.innerHTML = AGE_BRACKETS.map(
    (b) => `
    <button type="button" class="main-btn age-swatch age-btn${b.id === selectedAgeBracket ? " on" : ""}" data-age="${b.id}" style="--hc:${b.cor};">${b.label}</button>
  `,
  ).join("");
  row.classList.add("tem-escolha");
  row.querySelectorAll("[data-age]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedAgeBracket = btn.dataset.age;
      cadFaixa = true;
      renderAgeBracketPicker();
      cadAtualizarBotao();
    });
  });
}
function fxTemp(el, ms) {
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}
function fxShake() {
  if (!visualFxAllowed()) return;
  const c = document.getElementById("cardArea");
  if (!c) return;
  c.classList.remove("fx-shake");
  void c.offsetWidth;
  c.classList.add("fx-shake");
  caosAnimar(c, "fxShake");
  setTimeout(() => c.classList.remove("fx-shake"), 500);
}
function fxPop(emoji) {
  if (!visualFxAllowed()) return;
  const d = document.createElement("div");
  d.className = "fx-pop";
  d.textContent = emoji;
  fxTemp(d, 1200);
}
function fxFloat(txt, cor) {
  if (!visualFxAllowed()) return;
  const d = document.createElement("div");
  d.className = "fx-float";
  d.textContent = txt;
  d.style.color = cor || "#ffd166";
  fxTemp(d, 1500);
}
function fxBurst(cor) {
  if (!visualFxAllowed()) return;
  const d = document.createElement("div");
  d.className = "fx-burst";
  d.style.background = `radial-gradient(circle, ${cor} 0%, transparent 70%)`;
  fxTemp(d, 1e3);
}
function fxFlash(cls) {
  if (!visualFxAllowed()) return;
  const d = document.createElement("div");
  d.className = "screen-flash " + cls;
  fxTemp(d, 700);
}
function fxUrgente(on) {
  const b = document.body;
  if (!b) return;
  if (on && visualFxAllowed()) b.classList.add("fx-urgente");
  else b.classList.remove("fx-urgente");
}
function visualFxAllowed() {
  if (document.body.classList.contains("batata-mode")) return false;
  return true;
}
function flashScreen(kind) {
  if (!visualFxAllowed()) return;
  const el = document.createElement("div");
  el.className = "screen-flash " + (kind === "red" ? "flash-red" : "flash-green");
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
  if (kind === "red") {
    const x = document.createElement("div");
    x.className = "error-x";
    x.innerHTML =
      '<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><g stroke-linecap="round"><path d="M18 18 L82 82 M82 18 L18 82" stroke="#fff" stroke-width="26" fill="none"/><path d="M18 18 L82 82 M82 18 L18 82" stroke="#e94560" stroke-width="16" fill="none"/></g></svg>';
    document.body.appendChild(x);
    setTimeout(() => x.remove(), 900);
  }
}
function spawnConfetti(colors, count, minDur, maxDur, lifeMs) {
  const container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    const r0 = Math.round(Math.random() * 360);
    piece.style.transform = `rotate(${r0}deg)`;
    container.appendChild(piece);
    caosAnimar(piece, {
      dur: (minDur + Math.random() * (maxDur - minDur)) * 1e3,
      delay: Math.random() * 400,
      ease: "ease-in",
      fill: true,
      frames: [
        [0, { transform: `translateY(0vh) rotate(${r0}deg)`, opacity: 0.9 }],
        [1, { transform: "translateY(110vh) rotate(360deg)", opacity: 0.3 }],
      ],
    });
  }
  setTimeout(() => container.remove(), lifeMs);
}
function celebrateHit() {
  if (!visualFxAllowed()) return;
  flashScreen("green");
  spawnConfetti(["#2ecc71", "#27ae60", "#7bed9f", "#00e676", "#a3e635"], 22, 1.4, 2.4, 3e3);
}
function triggerConfetti(porJoias) {
  if (document.body.classList.contains("batata-mode")) return;
  if (porJoias) {
    const cores = currentGemCategories()
      .map((c) => GEM_INFO[c].color)
      .concat(["#ffd700", "#fff4b0"]);
    spawnConfetti(cores, 110, 2.5, 4.5, 5200);
    setTimeout(() => spawnConfetti(cores, 80, 2.5, 4.5, 5e3), 700);
    setTimeout(() => spawnConfetti(["#ffd700", "#fff4b0", "#ffffff"], 60, 3, 5, 5e3), 1500);
    return;
  }
  spawnConfetti(["#f5a623", "#e94560", "#4ecdc4", "#ffd166", "#6c5ce7", "#2ecc71"], 60, 2.5, 4, 4200);
}
function buildStatsHtml() {
  const totalAnswered = history.length;
  const totalSkipped = stats.totalExhausted + stats.totalDiscarded;
  const mini = (ic, tit, val, det, cor, fala) =>
    `<li class="hall-placa falavel" style="--hc:${cor};"${caosFalavel(fala)}><span class="hall-ic">${ic}</span><span class="hall-tit">${tit}</span><span class="hall-nome"><b>${val}</b></span>${det ? `<span class="hall-det">${det}</span>` : ""}</li>`;
  const larga = (ic, tit, nome, det, cor, fala) =>
    `<li class="hall-placa hall-largo falavel" style="--hc:${cor};"${caosFalavel(fala)}><span class="hall-ic">${ic}</span><span class="hall-tit">${tit}</span><span class="hall-nome">${nome}</span><span class="hall-det">${det}</span></li>`;
  const topo = (por) => {
    const t = Object.entries(por || {}).sort((a, b) => b[1] - a[1])[0];
    return t && t[1] > 0 ? t : null;
  };
  let numeros = mini("🃏", "Cartas sorteadas", stats.totalDrawn, "", "#a78bfa", {
    t: "sorteadas",
    v: stats.totalDrawn,
  });
  if (caosPartidaInicioAt) {
    const m = caosMinutosPartida();
    numeros += mini("⏱️", "Duração", m + " min", "só o tempo jogando", "#38bdf8", { t: "duracao", v: m });
    const mp = tempoMinutosPausa();
    if (mp >= 1) numeros += mini("⏸️", "Pausado", mp + " min", "fora da duração", "#94a3b8", { t: "pausado", v: mp });
  }
  numeros += mini("✅", "Respondidas", totalAnswered, "cartas acertadas", "#34d399", {
    t: "respondidas",
    v: totalAnswered,
  });
  numeros += mini("🌀", "Sem dono", totalSkipped, "sem acerto ou descartadas", "#94a3b8", {
    t: "semdono",
    v: totalSkipped,
  });
  if (CURRENT_MODE !== "express") {
    const tp = topo(caosMesa.pulosPor),
      ta = topo(caosMesa.absurdosPor);
    numeros += mini(
      "🙊",
      "Dicas puladas",
      caosMesa.pulos,
      tp ? `quem mais: ${escapeHtml(tp[0])} (${tp[1]})` : '"passo"',
      "#c4b5fd",
      { t: "pulos", v: caosMesa.pulos, n: tp ? tp[0] : null, x: tp ? tp[1] : 0 },
    );
    numeros += mini(
      "⚠️",
      "Absurdos",
      caosMesa.absurdos,
      ta ? `quem mais: ${escapeHtml(ta[0])} (${ta[1]})` : "",
      "#fbbf24",
      { t: "absurdos", v: caosMesa.absurdos, n: ta ? ta[0] : null, x: ta ? ta[1] : 0 },
    );
  }
  let destaques = "";
  const validHistory = history.filter((h) => typeof h.cluesUsed === "number" && h.playerName);
  if (validHistory.length > 0) {
    const withTime = validHistory.filter((h) => typeof h.timeTakenMs === "number" && h.timeTakenMs >= 1500);
    const fastest = withTime.length ? withTime.reduce((a, b) => (a.timeTakenMs < b.timeTakenMs ? a : b)) : null;
    const easiest = validHistory.reduce((a, b) => (a.cluesUsed < b.cluesUsed ? a : b));
    const hardest = validHistory.reduce((a, b) => (a.cluesUsed > b.cluesUsed ? a : b));
    if (fastest) {
      const sg = Math.round(fastest.timeTakenMs / 100) / 10;
      destaques += larga(
        "⚡",
        "Resposta mais rápida",
        playerNameHtml(fastest.playerName, fastest.playerColor, fastest.playerAvatar),
        `${escapeHtml(fastest.answer)} em ${caosNumBR(sg)} s`,
        "#38bdf8",
        { t: "rapida", n: fastest.playerName, v: sg, x: fastest.answer },
      );
    }
    destaques += larga(
      "😌",
      "Carta mais fácil",
      `<b>${escapeHtml(easiest.answer)}</b>`,
      `só ${easiest.cluesUsed} dica${easiest.cluesUsed === 1 ? "" : "s"} · ${playerNameHtml(easiest.playerName, easiest.playerColor, easiest.playerAvatar)}`,
      "#34d399",
      { t: "facil", n: easiest.playerName, v: easiest.cluesUsed, x: easiest.answer },
    );
    destaques += larga(
      "🥵",
      "Carta mais difícil",
      `<b>${escapeHtml(hardest.answer)}</b>`,
      `${hardest.cluesUsed} dicas · ${playerNameHtml(hardest.playerName, hardest.playerColor, hardest.playerAvatar)}`,
      "#fb923c",
      { t: "dificil", n: hardest.playerName, v: hardest.cluesUsed, x: hardest.answer },
    );
    const mvp = computeMvp();
    if (mvp)
      destaques += larga(
        "🌟",
        "MVP da partida",
        playerNameHtml(mvp.name, mvp.color, mvp.avatar),
        `média de ${caosNumBR(Math.round(mvp.avg * 10) / 10)} pts por acerto`,
        "#fbbf24",
        { t: "mvp", n: mvp.name, v: Math.round(mvp.avg * 10) / 10 },
      );
    // Mestre muralha: quem leu as cartas que mais pediram dicas (mínimo 2 cartas acertadas)
    const porMestre = {};
    validHistory.forEach((h) => {
      if (!h.mestreName || h.wasBonus) return;
      const m = (porMestre[h.mestreName] = porMestre[h.mestreName] || { n: 0, d: 0, cor: h.mestreColor });
      m.n++;
      m.d += h.cluesUsed;
    });
    const mestres = Object.entries(porMestre)
      .filter(([, m]) => m.n >= 2)
      .map(([nome, m]) => ({ nome, cor: m.cor, med: Math.round((m.d / m.n) * 10) / 10 }))
      .sort((a, b) => b.med - a.med);
    if (mestres.length >= 2 && mestres[0].med > mestres[1].med) {
      const mu = mestres[0],
        pm = players.find((x) => x.name === mu.nome);
      destaques += larga(
        "🧱",
        "Mestre muralha",
        playerNameHtml(mu.nome, mu.cor, pm ? pm.avatar : ""),
        `as cartas que leu pediram ${caosNumBR(mu.med)} dicas em média`,
        "#f97316",
        { t: "muralha", n: mu.nome, v: mu.med },
      );
    }
  }
  if (CURRENT_MODE !== "express") destaques += caosAuditoriaHtml();
  return `
    <div class="stats-box hall-box resumo-box">
      <h3>📊 Resumo da partida</h3><div class="hall-sub">toque num número e o C.A.O.S. comenta</div>
      <ul class="stats-list hall-grid">${numeros}${destaques}</ul>
    </div>
  `;
}
// Texto curto do resultado (o ranking como aparece na tela) para mandar no WhatsApp etc.
function resultadoTexto() {
  const linhas = [...document.querySelectorAll(".final-ranking-list > li")]
    .map((li) =>
      li.innerText
        .replace(/\s*\n\s*/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .slice(0, 8);
  const w = winCond();
  const cond =
    WIN_CONDITION === "casa" && CASA_MODOS.includes(casaSorteado)
      ? "Moda da Casa: " + { tabuleiro: "Tabuleiro", pontos: "Pontos", joias: "Joias" }[casaSorteado]
      : (WIN_CONDITIONS[w] || WIN_CONDITIONS.casa).label;
  const mvp = computeMvp();
  const cab =
    "🎲 Perfil JF · " +
    (MODE_LABELS[CURRENT_MODE] || "Perfil").replace(/^Perfil /, "") +
    (CURRENT_MODE === "express" ? "" : " · " + cond) +
    (CURRENT_FORMAT === "equipe" ? " · Equipes" : "");
  const t = [cab, "", ...linhas];
  if (mvp) t.push("", "🌟 Estrela da partida: " + mvp.name);
  t.push("", "Jogue também: " + JOGO_URL);
  return t.join("\n");
}
async function compartilharResultado() {
  const txt = resultadoTexto();
  try {
    if (navigator.share) {
      await navigator.share({ title: "Perfil JF", text: txt });
      return;
    }
  } catch (e) {
    if (e && e.name === "AbortError") return;
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(txt);
      showToastMessage("📋 Resultado copiado. É só colar no grupo.", null, true);
      return;
    }
  } catch (e) {}
  caosAvisoModal("Copie o resultado:\n\n" + txt);
}
function renderFinalScreen() {
  caosFalaveis = [];
  const winnerArea = document.getElementById("winnerArea");
  const isExpress = CURRENT_MODE === "express";
  let headerHtml, rankingHtml;
  const wc = winCond();
  const rankTxt = (v) =>
    wc === "pontos" ? `${v} pts` : wc === "joias" ? `${v} joia${v === 1 ? "" : "s"}` : `casa ${v}`;
  const rankHead = (v) =>
    wc === "pontos"
      ? `com ${v} pontos`
      : wc === "joias"
        ? `com ${v} joia${v === 1 ? "" : "s"} (o baralho acabou antes das ${GEMS_TO_WIN})`
        : `chegou na casa ${v}`;
  if (CURRENT_FORMAT === "equipe") {
    const tv = (id) => rankValue(teams[id], id);
    const sortedTeams = [...teamOrder].sort((a, b) => tv(b) - tv(a));
    const gemTeam = gemWinner && gemWinner.kind === "team" && teams[gemWinner.id] ? gemWinner.id : null;
    if (gemTeam) {
      sortedTeams.splice(sortedTeams.indexOf(gemTeam), 1);
      sortedTeams.unshift(gemTeam);
    }
    const medals = ["🥇", "🥈", "🥉"];
    const allZero = !gemTeam && sortedTeams.every((id) => tv(id) === 0);
    const topValue = sortedTeams.length ? tv(sortedTeams[0]) : 0;
    const tied = sortedTeams.filter((id) => tv(id) === topValue);
    if (gemTeam) {
      headerHtml = `<h2>💎 Equipe ${TEAM_INFO[gemTeam].label} venceu com as ${GEMS_TO_WIN} joias!</h2><p style="opacity:0.8;">reuniu todas as joias na casa ${teams[gemTeam].position}</p>`;
    } else if (allZero) {
      headerHtml = `<h2>🏁 Jogo encerrado</h2><p style="opacity:0.8;">${wc === "pontos" ? "Nenhuma equipe pontuou" : wc === "joias" ? "Nenhuma equipe ganhou joia" : "Nenhuma equipe andou casa"} nessa partida</p>`;
    } else if (tied.length > 1) {
      headerHtml = `<h2>🤝 Empate entre ${tied.map((id) => TEAM_INFO[id].label).join(" e ")}!</h2><p style="opacity:0.8;">${rankTxt(topValue)} cada</p>`;
    } else {
      headerHtml = `<h2>🏆 Equipe ${TEAM_INFO[sortedTeams[0]].label} venceu!</h2><p style="opacity:0.8;">${rankHead(topValue)}</p>`;
    }
    let rank = 0;
    rankingHtml = sortedTeams
      .map((id, i) => {
        if (i === 0 || (gemTeam && i === 1) || tv(id) !== tv(sortedTeams[i - 1])) rank = i + 1;
        const info = TEAM_INFO[id];
        const members = players
          .filter((p) => p.team === id)
          .map((p) => p.name)
          .join(", ");
        return `<li class="${rank === 1 && !allZero ? "first-place" : ""}">
        <span>${(!allZero && medals[rank - 1]) || rank + "º"} ${info.emoji} Equipe ${info.label} <span style="opacity:0.7; font-size:0.8em;">(${escapeHtml(members)})</span></span>
        <span>${wc === "pontos" ? `${teamScore(id)} pts — ` : ""}casa ${teams[id].position}${gemBadgesHtml(teams[id])}</span>
      </li>`;
      })
      .join("");
  } else {
    const pv = (p) => rankValue(p);
    const sorted = [...players].sort((a, b) => pv(b) - pv(a));
    const gemPlayer = gemWinner && gemWinner.kind === "player" ? jogadorPorId(gemWinner.id) : null;
    if (gemPlayer) {
      sorted.splice(sorted.indexOf(gemPlayer), 1);
      sorted.unshift(gemPlayer);
    }
    const medals = ["🥇", "🥈", "🥉"];
    const allZero = !gemPlayer && sorted.every((p) => pv(p) === 0);
    const topValue = sorted.length ? pv(sorted[0]) : 0;
    const tiedTop = sorted.filter((p) => pv(p) === topValue);
    let rank = 0;
    const rankedList = sorted.map((p, i) => {
      if (i === 0 || (gemPlayer && i === 1) || pv(p) !== pv(sorted[i - 1])) rank = i + 1;
      return { ...p, rank };
    });
    if (gemPlayer) {
      headerHtml = `<h2>💎 ${escapeHtml(gemPlayer.name)} venceu com as ${GEMS_TO_WIN} joias!</h2><p style="opacity:0.8;">reuniu todas as joias</p>`;
    } else if (allZero) {
      headerHtml = isExpress
        ? `<h2>🏁 Jogo encerrado</h2><p style="opacity:0.8;">Ninguém pontuou nessa partida</p>`
        : `<h2>🏁 Jogo encerrado</h2><p style="opacity:0.8;">${wc === "pontos" ? "Ninguém pontuou" : wc === "joias" ? "Ninguém ganhou joia" : "Ninguém andou casa"} nessa partida</p>`;
    } else if (tiedTop.length > 1) {
      const names = tiedTop.map((p) => escapeHtml(p.name)).join(" e ");
      headerHtml = isExpress
        ? `<h2>🤝 Empate entre ${names}!</h2><p style="opacity:0.8;">${topValue} ponto${topValue === 1 ? "" : "s"} cada</p>`
        : `<h2>🤝 Empate entre ${names}!</h2><p style="opacity:0.8;">${rankTxt(topValue)} cada</p>`;
    } else {
      headerHtml = isExpress
        ? `<h2>🏆 ${escapeHtml(sorted[0].name)} venceu!</h2><p style="opacity:0.8;">com ${topValue} ponto${topValue === 1 ? "" : "s"}</p>`
        : `<h2>🏆 ${escapeHtml(sorted[0].name)} venceu!</h2><p style="opacity:0.8;">${rankHead(topValue)}</p>`;
    }
    rankingHtml = rankedList
      .map(
        (p) => `
    <li class="${p.rank === 1 && !allZero ? "first-place" : ""}">
      <span>${(!allZero && medals[p.rank - 1]) || p.rank + "º"} ${playerNameHtml(p.name, p.color, p.avatar)}</span>
      <span>${isExpress ? `${p.score} ponto${p.score === 1 ? "" : "s"}` : `${p.score} pts — casa ${p.position}`}${gemBadgesHtml(p)}</span>
    </li>
  `,
      )
      .join("");
  }
  const statsHtml = showStats ? buildStatsHtml() : "";
  let historyHtml = "";
  if (showHistory) {
    const byPlayer = {};
    players.forEach((p) => {
      byPlayer[p.name] = { color: p.color, avatar: p.avatar, items: [] };
    });
    history.forEach((h) => {
      if (!byPlayer[h.playerName]) byPlayer[h.playerName] = { color: h.playerColor, avatar: h.playerAvatar, items: [] };
      byPlayer[h.playerName].items.push(h);
    });
    historyHtml =
      `<div class="history-list hist-v2">` +
      Object.entries(byPlayer)
        .map(
          ([name, data]) => `
      <details class="history-group">
        <summary><h4>${playerNameHtml(name, data.color, data.avatar)}<span class="hist-qt">${data.items.length} carta${data.items.length === 1 ? "" : "s"}</span></h4><span class="hist-seta" aria-hidden="true">▾</span></summary>
        <ul>${data.items.length ? data.items.map((h) => `<li><span class="hist-cat">${escapeHtml(gemCategoryFor(h.category))}</span><span class="hist-resp">${escapeHtml(h.answer)}</span><span class="hist-det">+${h.points} pts · ${h.cluesUsed} dica${h.cluesUsed === 1 ? "" : "s"}</span></li>`).join("") : '<li class="hist-vazio">Nenhuma carta acertada</li>'}</ul>
      </details>
    `,
        )
        .join("") +
      `</div>`;
  }
  winnerArea.innerHTML = `
    <div class="final-ranking-screen">
      ${headerHtml}
      ${(() => {
        let r = "";
        try {
          r = caosResenha();
        } catch (e) {
          r = "";
        }
        return r ? '<blockquote class="caos-resenha">🤖 ' + escapeHtml(r) + "</blockquote>" : "";
      })()}
      ${(() => {
        const mvp = computeMvp();
        return mvp
          ? `<div class="mvp-spotlight">🌟 Estrela da partida: ${playerNameHtml(mvp.name, mvp.color, mvp.avatar)} — média de ${mvp.avg.toFixed(1)} pts por acerto</div>`
          : "";
      })()}
      <ul class="final-ranking-list">${rankingHtml}</ul>
      <div style="display:flex; flex-direction:column; gap:10px; width:100%; max-width:480px; margin-top:10px;">
        <button class="btn-start btn-neo neo-solid neo-still neo-ghost neo-long fim-btn" id="toggleStatsBtn" style="--mc:#38bdf8; --mc-glow:rgba(56,189,248,0.3);">${showStats ? "▴ Esconder as estatísticas" : "📊 Estatísticas da partida"}</button>
        ${statsHtml}
        <button class="btn-start btn-neo neo-solid neo-still neo-ghost neo-long fim-btn" id="toggleHistoryBtn" style="--mc:#a78bfa; --mc-glow:rgba(167,139,250,0.3);">${showHistory ? "▴ Esconder as cartas" : "🃏 Cartas que cada um acertou"}</button>
        ${historyHtml}
        <button class="btn-start btn-neo neo-solid neo-still neo-ghost neo-long fim-btn" id="toggleHallBtn" style="--mc:#fbbf24; --mc-glow:rgba(251,191,36,0.3);">${showHall ? "▴ Esconder o Hall da Fama" : "🏆 Hall da Fama"}</button>
        ${showHall ? hallDaFamaHtml() : ""}
        <button class="btn-start btn-neo neo-solid neo-still neo-ghost neo-long fim-btn" id="compartilharResultadoBtn" style="--mc:#60a5fa; --mc-glow:rgba(96,165,250,0.3);">📲 Compartilhar resultado</button>
        <div class="fim-sub">o ranking num texto curto, pronto pro WhatsApp</div>
        <button class="btn-start btn-neo neo-solid neo-still neo-ghost neo-long fim-btn" id="exportPartidaBtn" style="--mc:#22d3ee; --mc-glow:rgba(34,211,238,0.3);">📄 Exportar dados da partida</button>
        <div class="fim-sub">arquivo .md com o resumo da partida</div>
        <button class="btn-start btn-neo neo-solid neo-still fim-btn" id="jogarDeNovoBtn" style="--mc:#34d399; --mc-glow:rgba(52,211,153,0.35);">🔁 Jogar de novo</button>
        <div class="fim-sub">mesmos jogadores, mesmo modo, placar zerado</div>
        ${caosMatchLog.length ? `<button class="btn-start btn-neo neo-solid neo-still neo-ghost neo-long fim-btn" id="caosReviewBtn" style="--mc:#f472b6; --mc-glow:rgba(244,114,182,0.28);">🤖 Avaliar as falas do C.A.O.S.</button>` : ""}
      </div>
    </div>
  `;
  document.getElementById("toggleStatsBtn").addEventListener("click", () => {
    showStats = !showStats;
    renderFinalScreen();
    saveGameState();
  });
  document.getElementById("toggleHistoryBtn").addEventListener("click", () => {
    showHistory = !showHistory;
    renderFinalScreen();
    saveGameState();
  });
  const rv = document.getElementById("caosReviewBtn");
  if (rv) rv.addEventListener("click", openCaosReview);
  const jn = document.getElementById("jogarDeNovoBtn");
  if (jn) jn.addEventListener("click", jogarDeNovo);
  const exp = document.getElementById("exportPartidaBtn");
  if (exp) exp.addEventListener("click", caosExportarPartidaModal);
  const comp = document.getElementById("compartilharResultadoBtn");
  if (comp) comp.addEventListener("click", compartilharResultado);
  document.getElementById("toggleHallBtn").addEventListener("click", () => {
    showHall = !showHall;
    renderFinalScreen();
  });
  const hz = document.getElementById("hallZerarBtn");
  if (hz) hz.addEventListener("click", hallZerar);
  caosLigarFalaveis(winnerArea);
}
function openCaosReview() {
  let ov = document.getElementById("caosReviewOverlay");
  if (ov) ov.remove();
  ov = document.createElement("div");
  ov.id = "caosReviewOverlay";
  ov.className = "tut-overlay";
  ov.style.display = "flex";
  const box = document.createElement("div");
  box.className = "tut-box";
  box.style.textAlign = "left";
  const close = document.createElement("button");
  close.className = "tut-close";
  close.textContent = "✕";
  close.addEventListener("click", () => ov.remove());
  const h = document.createElement("div");
  h.className = "tut-title";
  h.style.textAlign = "center";
  h.textContent = "🤖 Como foi o C.A.O.S. hoje?";
  const sub = document.createElement("div");
  sub.style.cssText = "opacity:0.75; font-size:0.85rem; text-align:center; margin-bottom:10px;";
  sub.textContent = "Dê uma nota pras falas. As que a mesa reprovar (2 👎) param de sair neste aparelho.";
  box.append(close, h, sub);
  caosMatchLog.forEach((e) => {
    const row = document.createElement("div");
    row.className = "review-row";
    const t = document.createElement("div");
    t.className = "review-text";
    t.textContent = (e.n > 0 ? `Carta ${e.n}: ` : "Cadastro: ") + e.text;
    const btns = document.createElement("div");
    btns.className = "review-btns";
    [
      [1, "👍"],
      [0, "😐"],
      [-1, "👎"],
    ].forEach(([v, lbl]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = lbl;
      const paint = () => b.classList.toggle("on", e.rated && e.r === v);
      paint();
      b.addEventListener("click", () => {
        caosRate(e, v);
        btns.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
      });
      btns.appendChild(b);
    });
    row.append(t, btns);
    box.appendChild(row);
  });
  const nav = document.createElement("div");
  nav.className = "tut-nav";
  nav.style.marginTop = "14px";
  const exp = document.createElement("button");
  exp.className = "tut-btn";
  exp.textContent = "📤 Exportar / copiar relatório";
  exp.addEventListener("click", () => {
    caosEntregarTexto(
      caosNomeArquivo("relatorio-caos"),
      caosReviewReport(),
      "🤖 Relatório do C.A.O.S.",
      "Copie o texto ou compartilhe o arquivo .md.",
    );
  });
  nav.appendChild(exp);
  box.appendChild(nav);
  ov.appendChild(box);
  document.body.appendChild(ov);
}
function selectPendingFormat(fmt) {
  pendingFormat = fmt;
  CURRENT_FORMAT = fmt;
  Object.entries(FORMAT_WRAP_IDS).forEach(([f, id]) => {
    const w2 = document.getElementById(id);
    if (!w2) return;
    w2.classList.toggle("mode-selected", f === fmt);
    w2.classList.toggle("mode-dimmed", f !== fmt);
  });
  const btn = document.getElementById("fmtConfirmBtn"),
    w = document.getElementById(FORMAT_WRAP_IDS[fmt]);
  btn.style.display = "block";
  btn.textContent = fmt === "equipe" ? "✅ Continuar no Equipe" : "✅ Continuar no Versus";
  if (w) {
    btn.style.setProperty("--mc", w.style.getPropertyValue("--mc"));
    btn.style.setProperty("--mc-glow", w.style.getPropertyValue("--mc-glow"));
  }
}
function resetFormatSelectionUI() {
  pendingFormat = null;
  Object.values(FORMAT_WRAP_IDS).forEach((id) => {
    const w = document.getElementById(id);
    if (w) w.classList.remove("mode-selected", "mode-dimmed");
  });
  document.getElementById("fmtConfirmBtn").style.display = "none";
}
function toqueSelecao(k, jaMarcado, marcar, confirmar, desmarcar) {
  const agora = Date.now();
  if (jaMarcado()) {
    const rapido = caosToque.k === k && agora - caosToque.at < 450;
    caosToque = { k: null, at: 0 };
    if (rapido) confirmar();
    else desmarcar();
    return;
  }
  marcar();
  caosToque = { k, at: agora };
}
function renderModeCardDescs() {
  const R = RESPONSE_TIME_LIMIT_BY_MODE,
    X = EXPRESS_TIMES,
    eq = CURRENT_FORMAT === "equipe";
  const set = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };
  set(
    "mcDescClassico",
    `Tabuleiro até 200 casas, até 20 dicas, ${R.classico}s pra responder, bônus a cada ${BONUS_HOUSE_INTERVAL} casas e 4 joias.`,
  );
  set(
    "mcDescJunior",
    `Meta de 150 casas. Animal, Pessoa, Lugar e Coisa (sem Ano). C.A.O.S. mais leve com a criançada.`,
  );
  set(
    "mcDescHardcore",
    `Só 10 dicas por carta, ${R.hardcore}s pra responder, pontos em dobro e nada de Ajudinha do C.A.O.S.`,
  );
  set(
    "mcDescExpress",
    `Sem tabuleiro: 50 cartas, pontos = 11 − dicas, carta de ${Math.floor(X.hardcore.card / 60)}:${String(X.hardcore.card % 60).padStart(2, "0")} a ${Math.floor(X.classico.card / 60)}:${String(X.classico.card % 60).padStart(2, "0")} e especiais estilo UNO.`,
  );
  set(
    "mcDescOldschool",
    "Cartas de quem viveu a época: dicas mais difíceis, sem animais, coisas de adulto. C.A.O.S. mais comentarista, menos palhaço.",
  );
  set(
    "mcDescRandom",
    eq
      ? "O jogo sorteia entre Clássico, Hardcore e Old School (no Equipe só tem tabuleiro)."
      : "O jogo sorteia o modo: Júnior, Clássico, Hardcore, Old School ou Express.",
  );
  set("mcDescVersus", `Cada um por si. De ${MIN_PLAYERS} a ${MAX_PLAYERS} jogadores, o Mestre roda a cada carta.`);
  set("mcDescEquipe", "Times sorteados equilibrando as idades. Exatamente 4 ou 6 jogadores. Clássico, Hardcore ou Old School.");
}
function atualizarRotuloModo() {
  const el = document.getElementById("trocarModoLabel");
  if (!el) return;
  const nomes = {
    classico: "🃏 Clássico",
    oldschool: oldSchoolAcess ? "📻 Old School 🔎" : "📻 Old School",
    junior: "🧒 Júnior",
    hardcore: "💀 Hardcore",
    express: `🔥 Express ${expressFlavor === "hardcore" ? "Hardcore" : "Clássico"}`,
  };
  el.textContent = `${nomes[CURRENT_MODE] || CURRENT_MODE} · ${CURRENT_FORMAT === "equipe" ? "Equipe" : "Versus"}`;
}
function resetModeSelectionUI() {
  pendingMode = null;
  renderModeCardDescs();
  document.getElementById("expressConfigBox").style.display = "none";
  document.getElementById("oldSchoolConfigBox").style.display = "none";
  document.getElementById("modeConfirmBtn").style.display = "none";
  const equipeMode = CURRENT_FORMAT === "equipe";
  document.getElementById("modeWrapExpress").style.display = equipeMode ? "none" : "";
  document.getElementById("modeWrapJunior").style.display = equipeMode ? "none" : "";
  document.querySelectorAll(".expressCatChk").forEach((cb) => {
    cb.checked = false;
    cb.disabled = false;
  });
  updateExpressCheckboxState();
  Object.values(MODE_WRAP_IDS).forEach((id) => {
    const wrap = document.getElementById(id);
    if (wrap) wrap.classList.remove("mode-selected", "mode-dimmed");
  });
}
function updateExpressCheckboxState() {
  const boxes = Array.from(document.querySelectorAll(".expressCatChk"));
  const checkedCount = boxes.filter((cb) => cb.checked).length;
  boxes.forEach((cb) => {
    cb.disabled = !cb.checked && checkedCount >= 2;
  });
  const suffix = checkedCount === 0 ? " <u>(categorias aleatórias)</u>" : "";
  const classicoBtn = document.getElementById("confirmExpressClassicoBtn");
  const hardcoreBtn = document.getElementById("confirmExpressHardcoreBtn");
  if (classicoBtn) classicoBtn.innerHTML = `🃏 Iniciar Express Clássico${suffix} 🃏`;
  if (hardcoreBtn) hardcoreBtn.innerHTML = `💀 Iniciar Express Hardcore${suffix} 💀`;
}
// Anúncio do sorteio da Moda da Casa: roleta igual à da categoria (com som), o C.A.O.S.
// fica calado enquanto gira, comenta só o resultado e volta a falar quando a mesa toca "Bora jogar!".
function casaAnunciar() {
  const NOMES = { tabuleiro: "🎲 TABULEIRO", pontos: "🔢 PONTOS", joias: "💎 JOIAS" };
  const final = casaSorteado;
  caosSorteioSilencio = true;
  try {
    closeActiveToast();
    caosVoiceCancel();
  } catch (e) {}
  const { ov, box } = caosModalBase();
  ov.classList.add("casa-sorteio-ov");
  box.innerHTML =
    '<div class="casa-sorteio-tit">🏠 A Moda da Casa</div>' +
    '<div class="casa-roleta"><div class="roulette">' +
    '<div class="roulette-title">O C.A.O.S. sorteia o modo da mesa:</div>' +
    '<div class="roulette-phrase"><span class="roulette-reel" id="casaReel">' +
    NOMES[CASA_MODOS[0]] +
    "</span></div>" +
    '<div class="roulette-hint" id="casaHint">🎰 sorteando o modo...</div>' +
    "</div></div>" +
    '<div class="casa-sorteio-desc" id="casaDesc"></div>';
  document.body.appendChild(ov);
  const reel = box.querySelector("#casaReel"),
    hint = box.querySelector("#casaHint"),
    desc = box.querySelector("#casaDesc");
  const fechar = () => {
    ov.remove();
    caosSorteioSilencio = false;
  };
  const finish = () => {
    if (!ov.isConnected) return;
    reel.textContent = NOMES[final];
    reel.classList.add("landed");
    hint.textContent = "Modo da mesa sorteado! Vale para todo mundo nesta partida.";
    try {
      caosRoletaSom("pouso");
    } catch (e) {}
    desc.innerHTML = winCondRuleText();
    // 1.7.8.7: "Bora jogar!" em destaque e "Como funciona" mais leve, um embaixo do outro
    const row = caosModalRow();
    row.classList.add("caos-mrow-pilha");
    const comoFunciona = caosModalBtn("📖 Como funciona este modo?", "#0e7490", () => {
      fechar();
      openTutorial("vitoria:" + final);
    });
    comoFunciona.classList.add("caos-mbtn-sec");
    row.append(
      caosModalBtn("🎮 Bora jogar!", "#1f7a4f", () => {
        fechar();
        vitoriaTutTalvez(final);
      }),
      comoFunciona,
    );
    box.append(row);
    renderMiniScoreboard();
    renderWinCondPicker();
    updateModeNotice();
    // única fala permitida no sorteio: o comentário sobre o modo sorteado
    const banco = REACTIVE_VOICE.casaSorteio[final];
    setTimeout(() => {
      if (ov.isConnected)
        showToastMessage(getRandomReaction(banco, final === "pontos" ? metaPontos() : final), null, true);
    }, 350);
  };
  if (!visualFxAllowed()) {
    finish();
    return;
  }
  let i = Math.floor(Math.random() * CASA_MODOS.length),
    step = 0,
    delay = 55;
  const STEPS = 14 + Math.floor(Math.random() * 4);
  const spin = () => {
    if (!ov.isConnected) return;
    if (step >= STEPS) {
      finish();
      return;
    }
    i = (i + 1) % CASA_MODOS.length;
    reel.textContent = NOMES[CASA_MODOS[i]];
    try {
      caosRoletaSom("tick", step, STEPS);
    } catch (e) {}
    step++;
    delay = Math.min(260, delay * 1.16);
    setTimeout(spin, delay);
  };
  setTimeout(spin, 400);
}
function renderWinCondPicker() {
  const wrap = document.getElementById("winCondWrap");
  if (!wrap) return;
  if (CURRENT_MODE === "express") {
    wrap.style.display = "none";
    return;
  }
  wrap.style.display = "";
  const row = document.getElementById("winCondRow"),
    hint = document.getElementById("winCondHint");
  const locked = !!starterChosen;
  const WC_COR = ["#34d399", "#fbbf24", "#38bdf8", "#f472b6", "#a78bfa", "#fb923c"];
  row.innerHTML = Object.keys(WIN_CONDITIONS)
    .map((id, i) => {
      const o2 = WIN_CONDITIONS[id];
      return `<button type="button" class="wincond-btn${id === WIN_CONDITION ? " on" : ""}" data-wc="${id}" style="--wc:${WC_COR[i % WC_COR.length]};"${locked ? " disabled" : ""}>${o2.icon} ${o2.label}</button>`;
    })
    .join("");
  {
    const at = document.getElementById("winCondAtual"),
      ow = WIN_CONDITIONS[winCond()] || WIN_CONDITIONS.casa;
    if (at)
      at.textContent =
        WIN_CONDITION === "casa" && CASA_MODOS.includes(casaSorteado)
          ? "🏠 Moda da Casa → " + { tabuleiro: "🎲 Tabuleiro", pontos: "🔢 Pontos", joias: "💎 Joias" }[casaSorteado]
          : ow.icon + " " + ow.label;
  }
  row.querySelectorAll("[data-wc]").forEach((b) =>
    b.addEventListener("click", () => {
      if (starterChosen) return;
      WIN_CONDITION = b.dataset.wc;
      renderWinCondPicker();
      updateModeNotice();
      renderMiniScoreboard();
      saveGameState();
      const box = document.getElementById("winCondBox");
      if (box) box.open = false;
    }),
  );
  const o = WIN_CONDITIONS[winCond()] || WIN_CONDITIONS.casa;
  let aviso = "";
  if (WIN_CONDITION === "casa" && casaSorteado === "misto" && players.length < GEMS_MIN_PLAYERS)
    aviso = `<div class="wincond-warn">Com ${players.length || "menos de " + GEMS_MIN_PLAYERS} jogador${players.length === 1 ? "" : "es"} as joias são só troféu — vale a chegada na casa ${WINNING_SCORE}. Com ${GEMS_MIN_PLAYERS}+ elas também dão vitória.</div>`;
  hint.innerHTML = `${o.hint}${aviso}${locked ? '<div class="ci-dim">🔒 Travada: a partida já começou.</div>' : ""}${vitoriaTutBotaoHtml()}`;
  const tb = document.getElementById("winCondTutBtn");
  if (tb) tb.addEventListener("click", () => openTutorial("vitoria:" + (starterChosen ? winCond() : WIN_CONDITION)));
}
// Quantas cartas o baralho do modo tem de verdade (o que entra na partida).
function cartasNoModo() {
  return Math.min((allCards && allCards.length) || 0, deckLimiteModo());
}
// Resumo rápido: o mínimo pra quem nunca jogou começar, na ordem em que as coisas acontecem.
function buildRulesSummaryHtml() {
  const c = rulesCtx(),
    li = [];
  if (c.express) {
    li.push("🎯 <b>Objetivo:</b> somar mais pontos até o baralho acabar.");
    li.push(
      '🎙️ <b>Mestre:</b> segura o celular, fala a categoria (<i>"Eu sou uma PESSOA"</i>) e lê as dicas. <b>Nunca</b> fala a resposta.',
    );
    li.push("💬 <b>Jogo:</b> as dicas abrem sozinhas. Quem souber, fala. O Mestre toca em <b>Acertou</b> e escolhe quem foi.");
    li.push(`🧮 <b>Pontos:</b> 11 menos as dicas abertas. A carta tem ${c.card} e cada vez tem ${c.turn}s.`);
  } else {
    li.push(`🎯 <b>Objetivo (${WIN_CONDITIONS[winCond()].label}):</b> ${winCondRuleText(c.goal)}`);
    li.push(
      '🎙️ <b>Mestre:</b> segura o celular, fala a categoria (<i>"Eu sou uma PESSOA"</i>) e lê as dicas. <b>Nunca</b> fala a resposta.',
    );
    li.push(
      `💬 <b>Sua vez:</b> escolha um número de 1 a ${c.hard ? 10 : 20}, ouça a dica e dê <b>um</b> palpite. Errou? A vez passa.`,
    );
    li.push("🧮 <b>Pontos:</b> a carta vale 20. Quem acerta leva 20 menos as dicas abertas; o Mestre leva o resto.");
  }
  if (c.gems)
    li.push(
      `💎 <b>Joias:</b> acertou com poucas dicas? Leva a joia da categoria. ${gemsCountForWin() ? "<b>4 joias vencem na hora.</b>" : `Com menos de ${GEMS_MIN_PLAYERS} jogadores a joia é só troféu.`}`,
    );
  return li.map((t) => "<li>" + t + "</li>").join("");
}
// Regras completas, em ordem de leitura: objetivo, quem joga, cartas, a vez, pontos e,
// por fim, os detalhes (especiais, palpite, bônus, joias e imprevistos).
function buildRulesHtml() {
  const c = rulesCtx(),
    li = [];
  // 1. Objetivo
  li.push(
    c.express
      ? "🎯 <b>Objetivo:</b> vence quem tiver mais pontos quando o baralho acabar. Não tem tabuleiro."
      : `🎯 <b>Objetivo (${WIN_CONDITIONS[winCond()].label}):</b> ${winCondRuleText(c.goal)} Se o baralho acabar antes, vence quem estiver na frente.`,
  );
  // 2. Quem joga
  li.push(
    c.equipe
      ? "👥 <b>Equipes:</b> 4 jogadores (2 equipes de 2) ou 6 (2 equipes de 3, ou 3 equipes de 2), sorteadas equilibrando as idades. A cada carta uma equipe lê e outra responde. Com 3 equipes: <b>Duelo de Guildas</b> (uma responde) ou <b>Mestre vs Todos</b> (as outras respondem em ordem)."
      : "👥 <b>Jogadores:</b> de 2 a 6. Sorteiem o primeiro Mestre (dá pra sortear de novo até 2 vezes). Depois a roda segue sempre na mesma ordem.",
  );
  // 3. Cartas
  if (c.express)
    li.push(
      `🃏 <b>Cartas:</b> até 50, de 1 ou 2 categorias, com <b>10 entradas</b> cada. Express Clássico e Express Hardcore só mudam o tempo.`,
    );
  else
    li.push(
      `🃏 <b>Cartas:</b> cada uma tem ${c.hard ? "<b>10 entradas</b>" : "20 entradas"} sobre ${c.junior ? "um Animal, uma Pessoa, um Lugar ou uma Coisa" : "um Ano, uma Pessoa, um Lugar ou uma Coisa"}. Os números são embaralhados: o número não diz se a dica é fácil.${c.hard ? "" : " As categorias saem na mesma proporção."}`,
    );
  if (c.junior)
    li.push(
      `🧒 <b>Júnior:</b> ${cartasNoModo()} cartas feitas pra idade e meta de ${c.goal} casas. O C.A.O.S. pega leve (Family friendly, Suave ou Normal Júnior).`,
    );
  if (c.hard && !c.express)
    li.push(
      "💀 <b>Hardcore:</b> saem mais cartas de Ano e Pessoa, os pontos valem em dobro e não tem ajudinha nem palpite a qualquer hora.",
    );
  // 4. A vez
  li.push(
    "🎙️ <b>Mestre:</b> fala a categoria em voz alta e lê cada dica. Nunca fala a resposta. O Mestre muda a cada carta.",
  );
  if (c.express) {
    li.push(
      "💬 <b>A vez:</b> a 1ª dica abre sozinha. <b>Revelar próxima dica</b> passa a vez (não tem botão de erro). <b>Acertou</b>: o Mestre escolhe quem acertou.",
    );
    li.push(
      `⏱️ <b>Tempo:</b> a carta tem ${c.card} (acabou, ninguém pontua) e cada vez tem ${c.turn}s (acabou, a vez passa sem castigo).`,
    );
  } else {
    li.push(
      `💬 <b>A vez:</b> só quem está na vez responde. Escolha um número, ouça a dica e dê <b>um</b> palpite.`,
    );
    li.push(
      `⏱️ <b>Tempo:</b> ${c.pick}s pra escolher a dica e ${c.resp}s pra responder. Não escolheu a tempo? Perde a vez. Não respondeu? Conta como erro.`,
    );
    li.push(
      c.equipe
        ? "❌ <b>Errou:</b> no Duelo, tenta outro da mesma equipe. No Mestre vs Todos, tenta a próxima equipe."
        : "❌ <b>Errou:</b> a vez passa pro próximo (pulando o Mestre) até alguém acertar ou as dicas acabarem.",
    );
  }
  // 5. Pontos
  if (c.express)
    li.push(
      "🧮 <b>Pontos:</b> 11 menos as dicas abertas (acertou na 1ª dica = 10). Só quem acerta pontua; o Mestre não ganha nada.",
    );
  else
    li.push(
      `🧮 <b>Pontos:</b> a carta vale 20${c.hard ? " (10 entradas × 2)" : ""}. Quem acerta leva 20 menos as entradas abertas; o Mestre leva as abertas. Ninguém acertou? Os 20 vão pro Mestre. No tabuleiro, 1 ponto = 1 casa.`,
    );
  // 6. Detalhes
  if (c.express)
    li.push(
      "⭐ <b>Especiais (estilo UNO):</b> Avance 1/2 pula 1/2 jogadores · Volte 2 inverte o sentido · Volte 3 inverte e pula 1 · Escolha um jogador bloqueia ou cede a vez · Perca sua vez passa. Se o tempo acabar, o efeito acontece sozinho.",
    );
  else
    li.push(
      `⭐ <b>Especiais:</b> Avance/Volte casas, Escolha um jogador (nunca você mesmo), Perca sua vez${c.palpite ? " e Palpite a qualquer hora" : ""}. Contam como dica aberta e <b>passam a vez</b> de quem tirou (menos o Palpite). Em ${SPECIAL_TIME_LIMIT + (c.acess ? 10 : 0)}s sem toque, Avance/Volte valem sozinhos.`,
    );
  if (c.palpite)
    li.push(
      `🃏 <b>Palpite a qualquer hora:</b> quem tira ganha uma ficha (vale o jogo todo) pra chutar fora da vez enquanto houver dica na tela. Errou, sem castigo. Cada um guarda <b>no máximo 1</b>: tirou outra já tendo uma? Perde a vez. Precisa de 3+ ${c.equipe ? "equipes" : "jogadores"}; são 5 fichas no jogo.`,
    );
  if (!c.express)
    li.push(
      `🎁 <b>Casa de bônus</b> (a cada 10 casas): parou nela por pontos? Duelo valendo o dobro contra quem você escolher. Só os dois respondem, e você começa. » Pulou e ⚠︎ Absurdo valem no duelo${c.palpite ? "; ficha de palpite, só pra quem está duelando" : ""}. "Perca sua vez" no duelo cancela o bônus.${c.equipe ? "" : " Com 2 jogadores não tem duelo."}`,
    );
  if (c.gems)
    li.push(
      `💎 <b>Joias:</b> acerte com até ${c.gemLimit} dicas reais e ganhe a joia da categoria${c.equipe ? " (é da equipe)" : ""}. ${gemsCountForWin() ? (ultimaRodadaAtiva() ? "4 joias = meta batida (a rodada termina e aí sai o vencedor)." : "4 joias = vitória na hora.") : `Com menos de ${GEMS_MIN_PLAYERS} jogadores (Moda da Casa) a joia é só troféu.`}${c.express ? " Com 1 categoria dá pra ter até 4 dela; com 2, até 2 de cada." : " Carta bônus não dá joia."}`,
    );
  li.push(
    "✕ <b>Carta difícil ou o Mestre viu sem querer?</b> Descarte e puxe outra até a 5ª dica (no máximo 2 seguidas).",
  );
  if (!c.equipe && !c.express && !c.hard)
    li.push(
      "🤖 <b>Ajudinha do C.A.O.S.:</b> no máximo 1 vez por partida, quem estiver bem atrás pode ganhar pontos ou uma carta bônus.",
    );
  return li.map((t) => "<li>" + t + "</li>").join("");
}
// Tutorial: "rapido" (menos de 2 minutos, TUTORIAL_RAPIDO), "manual" (completo, TUTORIAL_STEPS, por capítulos)
// ou "vitoria:<condição>" (como se ganha, 5 passos, VITORIA_TUTORIAIS).
let tutorialLista = null; // definido ao abrir (os dados do tutorial carregam depois deste arquivo)
let tutorialTipo = "manual";
function openTutorial(tipo) {
  const cond = typeof tipo === "string" && tipo.indexOf("vitoria:") === 0 ? tipo.slice(8) : null;
  const passosVitoria = cond ? vitoriaTutPassos(cond) : null;
  if (cond && !passosVitoria) return;
  tutorialTipo = cond ? tipo : tipo === "rapido" ? "rapido" : "manual";
  tutorialLista = passosVitoria || (tipo === "rapido" ? TUTORIAL_RAPIDO : TUTORIAL_STEPS);
  tutorialPos = 0;
  caosLimparFalaParaJanela();
  if (cond) vitoriaTutMarcar(cond);
  else tutMarcarVisto("abriu");
  let ov = document.getElementById("tutorialOverlay");
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "tutorialOverlay";
    ov.className = "tut-overlay";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-label", "Tutorial");
    ov.innerHTML = `<div class="tut-box">
      <button type="button" class="tut-close" id="tutClose" aria-label="Fechar tutorial">✕</button>
      <div class="tut-tempo" id="tutTempo"></div>
      <div class="tut-caps" id="tutCaps"></div>
      <div class="tut-icon" id="tutIcon" aria-hidden="true"></div>
      <div class="tut-title" id="tutTitle"></div>
      <div class="tut-text" id="tutText"></div>
      <div class="tut-mock card" id="tutMock" aria-hidden="true"></div>
      <div class="tut-prog"><i id="tutProg"></i></div>
      <div class="tut-count" id="tutCount" aria-live="polite"></div>
      <button type="button" class="tut-btn tut-ouvir" id="tutOuvir">🔊 Ouvir este passo</button>
      <div class="tut-nav"><button type="button" class="tut-btn tut-back" id="tutBack">⬅️ Voltar</button><button type="button" class="tut-btn" id="tutNext">Próximo ➡️</button></div>
      <button type="button" class="tut-btn tut-manual" id="tutManual">📖 Ver o manual completo</button>
    </div>`;
    document.body.appendChild(ov);
    document.getElementById("tutClose").addEventListener("click", closeTutorial);
    document.getElementById("tutBack").addEventListener("click", () => {
      if (tutorialPos > 0) {
        tutorialPos--;
        renderTutorial();
      }
    });
    document.getElementById("tutNext").addEventListener("click", () => {
      if (tutorialPos < tutorialLista.length - 1) {
        tutorialPos++;
        renderTutorial();
      } else closeTutorial();
    });
    document.getElementById("tutManual").addEventListener("click", () => openTutorial("manual"));
    document.getElementById("tutOuvir").addEventListener("click", tutOuvirPasso);
  }
  ov.style.display = "flex";
  renderTutorial();
}
// 1.7.7.8 (ideia do JF, revisão do GPT): o C.A.O.S. lê o passo em voz alta, só quando a pessoa toca.
// Nunca vira o passo sozinho; trocar de passo ou fechar o tutorial cala a leitura.
let tutFalando = false;
function tutCalar() {
  if (!tutFalando) return;
  tutFalando = false;
  try {
    window.speechSynthesis.cancel();
  } catch (e) {}
}
function tutOuvirPasso() {
  const s = tutorialLista && tutorialLista[tutorialPos];
  if (!s || typeof CAOS_VOICE_OK === "undefined" || !CAOS_VOICE_OK) return;
  try {
    caosVoiceCancel();
    window.speechSynthesis.cancel();
    const tmp = document.createElement("div");
    tmp.innerHTML = s.text;
    const u = new SpeechSynthesisUtterance(s.title + ". " + tmp.textContent.replace(/\s+/g, " ").trim());
    u.lang = "pt-BR";
    const v = typeof caosPickVoice === "function" ? caosPickVoice() : null;
    if (v) u.voice = v;
    u.rate = 1;
    u.volume = typeof acessVolVoz === "function" ? acessVolVoz() : 1;
    u.onend = u.onerror = () => {
      tutFalando = false;
    };
    tutFalando = true;
    window.speechSynthesis.speak(u);
  } catch (e) {
    tutFalando = false;
  }
}
function renderTutorial() {
  tutCalar();
  const ouvir = document.getElementById("tutOuvir");
  if (ouvir) ouvir.style.display = typeof CAOS_VOICE_OK !== "undefined" && CAOS_VOICE_OK ? "" : "none";
  const rapido = tutorialTipo === "rapido";
  const vitoria = tutorialTipo.indexOf("vitoria:") === 0;
  const s = tutorialLista[tutorialPos],
    last = tutorialPos === tutorialLista.length - 1;
  document.getElementById("tutIcon").textContent = s.icon;
  document.getElementById("tutTitle").textContent = s.title;
  document.getElementById("tutText").innerHTML = s.text;
  const mock = document.getElementById("tutMock");
  mock.innerHTML = s.mock || "";
  mock.style.display = s.mock ? "" : "none";
  mock.className = s.dark ? "tut-mock tut-dark" : "tut-mock card";
  const tempo = document.getElementById("tutTempo");
  tempo.textContent = vitoria
    ? "🏆 Como se ganha: " + vitoriaTutNome(tutorialTipo.slice(8))
    : rapido
      ? "⏱️ Tutorial rápido · menos de 2 minutos"
      : "📖 Manual completo";
  const caps = document.getElementById("tutCaps");
  caps.style.display = rapido || vitoria ? "none" : "";
  caps.innerHTML = rapido || vitoria
    ? ""
    : TUT_CAPS.map((c, i) => `<button type="button" data-cap="${i}" class="${i === s.sec ? "on" : ""}">${c}</button>`).join("");
  caps.querySelectorAll("[data-cap]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const k = tutorialLista.findIndex((x) => x.sec === +btn.dataset.cap);
      if (k >= 0) {
        tutorialPos = k;
        renderTutorial();
      }
    }),
  );
  document.getElementById("tutProg").style.width = (((tutorialPos + 1) / tutorialLista.length) * 100).toFixed(1) + "%";
  document.getElementById("tutCount").textContent = `Passo ${tutorialPos + 1} de ${tutorialLista.length}`;
  const box = document.querySelector("#tutorialOverlay .tut-box");
  if (box) box.scrollTop = 0;
  document.getElementById("tutBack").style.visibility = tutorialPos === 0 ? "hidden" : "visible";
  document.getElementById("tutNext").textContent = last ? "🎮 Bora jogar!" : "Próximo ➡️";
  // No rápido, o manual completo aparece no último passo.
  document.getElementById("tutManual").style.display = rapido && last ? "" : "none";
}
function closeTutorial() {
  tutCalar();
  const ov = document.getElementById("tutorialOverlay");
  if (ov) ov.style.display = "none";
  tutPausaAtualizar();
  tutDepoisDeFechar();
}
function selectPendingMode(mode) {
  pendingMode = mode;
  Object.entries(MODE_WRAP_IDS).forEach(([m, id]) => {
    const wrap = document.getElementById(id);
    if (!wrap) return;
    wrap.classList.toggle("mode-selected", m === mode);
    wrap.classList.toggle("mode-dimmed", m !== mode);
  });
  const confirmBtn = document.getElementById("modeConfirmBtn");
  const expressBox = document.getElementById("expressConfigBox");
  document.getElementById("oldSchoolConfigBox").style.display = mode === "oldschool" ? "block" : "none";
  if (mode === "express" || mode === "oldschool") {
    confirmBtn.style.display = "none";
    expressBox.style.display = mode === "express" ? "block" : "none";
  } else {
    expressBox.style.display = "none";
    confirmBtn.style.display = "block";
    confirmBtn.textContent = mode === "random" ? "🎰 Iniciar Modo Aleatório" : `🚀 Iniciar ${MODE_LABELS[mode]}`;
    const w = document.getElementById(MODE_WRAP_IDS[mode]);
    if (w) {
      confirmBtn.style.setProperty("--mc", w.style.getPropertyValue("--mc"));
      confirmBtn.style.setProperty("--mc-glow", w.style.getPropertyValue("--mc-glow"));
    }
    confirmBtn.classList.toggle("neo-rainbow", mode === "random");
  }
}
function pauseTipsForNow() {
  return PAUSE_TIPS.filter((t) => {
    try {
      return t.when();
    } catch (e) {
      return false;
    }
  });
}
function showPauseTip(advance) {
  const el = document.getElementById("pauseTipText"),
    cnt = document.getElementById("pauseTipCount");
  if (!el || !pauseTipOrder.length) return;
  if (advance) pauseTipPos = (pauseTipPos + 1) % pauseTipOrder.length;
  const tip = pauseTipOrder[pauseTipPos];
  el.classList.add("fading");
  setTimeout(
    () => {
      try {
        el.textContent = tip.text();
      } catch (e) {
        el.textContent = "";
      }
      if (cnt) cnt.textContent = `${pauseTipPos + 1} de ${pauseTipOrder.length}`;
      el.classList.remove("fading");
    },
    advance ? 300 : 0,
  );
}
function startPauseTips() {
  stopPauseTips();
  {
    const lista = pauseTipsForNow(),
      n = lista.length >= 5 ? Math.floor(lista.length / 5) * 5 : lista.length;
    pauseTipOrder = shuffle(lista).slice(0, n);
  }
  pauseTipPos = 0;
  showPauseTip(false);
  pauseTipTimer = setInterval(() => showPauseTip(true), PAUSE_TIP_MS);
}
function stopPauseTips() {
  if (pauseTipTimer) {
    clearInterval(pauseTipTimer);
    pauseTipTimer = null;
  }
}
function admHash(s) {
  let h = 2166136261;
  const t = "adm|" + String(s || "").trim();
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
function admPrincipalIdx() {
  return jogadorIdxPorId(admPrincipalId);
}
function admPrincipalNaVez() {
  const i = admPrincipalIdx();
  return i >= 0 && (i === mestreIndex || i === responderIndex);
}
function admFala(msg) {
  if (msg) admMsgPendente.push(msg);
}
function admSoltarFalas() {
  const fila = admMsgPendente.splice(0);
  const next = () => {
    const m = fila.shift();
    if (m) showToastMessage(m, next);
  };
  next();
}
function openAdmPanel() {
  let ov = document.getElementById("admOverlay");
  if (ov) ov.remove();
  ov = document.createElement("div");
  ov.id = "admOverlay";
  ov.className = "ci-overlay";
  ov.style.zIndex = "10002";
  document.body.appendChild(ov);
  if (admCriadorLogado) {
    admPainel(ov, "criador");
    return;
  }
  const pi = admPrincipalIdx(),
    pNome = pi >= 0 ? players[pi].name : null,
    naVez = admPrincipalNaVez();
  ov.innerHTML = `<div class="ci-lock">
    <div class="ci-lock-icon">🛡️</div>
    <div class="ci-chip ci-chip-red">ÁREA DO ADM</div>
    <div class="ci-lock-title">Quem está mexendo?</div>
    <button type="button" id="admPrincipalBtn" class="ci-btn ci-btn-gold ci-wide" ${pNome && naVez ? "" : 'disabled style="opacity:0.45"'}>👑 ${pNome ? escapeHtml(pNome) : "—"} (ADM principal)</button>
    <div class="ci-lock-sub" style="margin-top:6px;">${!pNome ? "Ainda não tem ADM principal (ele nasce quando a partida começa: é o 1º Mestre)." : naVez ? "Sem senha: pode ajustar a zoeira do C.A.O.S. com um jogador." : `Só libera na vez de ${escapeHtml(pNome)} (quando for Mestre ou estiver respondendo).`}</div>
    <div class="ci-lock-sub" style="margin:14px 0 6px;">🛠️ ADM Criador (JF): digite a senha</div>
    <div class="ci-lock-field"><input id="admKey" type="password" inputmode="numeric" autocomplete="off" spellcheck="false" placeholder="Senha do criador"><button type="button" id="admEye" class="ci-eye" aria-label="Mostrar a senha">👁️</button></div>
    <div id="admMsg" class="ci-lock-msg"></div>
    <div class="ci-lock-btns"><button type="button" id="admCancel" class="ci-btn">Cancelar</button><button type="button" id="admOpen" class="ci-btn ci-btn-accent">🔓 Entrar</button></div>
  </div>`;
  const inp = ov.querySelector("#admKey"),
    msg = ov.querySelector("#admMsg");
  const tentar = () => {
    if (caosIntrusoBarrado(msg)) {
      inp.value = "";
      return;
    }
    if (caosIntrusoTentativa(admHash(inp.value) === ADM_CRIADOR_HASH, msg, "ADM")) {
      admCriadorLogado = true;
      caosLog("adm", "ADM Criador entrou");
      admPainel(ov, "criador");
    } else {
      inp.value = "";
      inp.focus();
    }
  };
  ov.querySelector("#admOpen").addEventListener("click", tentar);
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tentar();
  });
  ov.querySelector("#admEye").addEventListener("click", () => {
    inp.type = inp.type === "password" ? "text" : "password";
  });
  ov.querySelector("#admCancel").addEventListener("click", () => ov.remove());
  const pb = ov.querySelector("#admPrincipalBtn");
  if (pb && pNome && naVez)
    pb.addEventListener("click", () => {
      caosLog("adm", `ADM principal (${pNome}) entrou`);
      admPainel(ov, "principal");
    });
}
function admPainel(ov, nivel) {
  const criador = nivel === "criador";
  ov.innerHTML = "";
  const box = document.createElement("div");
  box.className = "ci-box";
  const head = document.createElement("div");
  head.className = "ci-head";
  const pi = admPrincipalIdx();
  head.innerHTML = `<div class="ci-head-icon">${criador ? "🛠️" : "👑"}</div>
    <div class="ci-head-txt"><div class="ci-title">${criador ? "ADM Criador" : "ADM principal"} <span class="ci-badge">5.0.13</span></div>
    <div class="ci-sub">${criador ? "controle total da partida" : escapeHtml(pi >= 0 ? players[pi].name : "") + " · só a zoeira do C.A.O.S. por jogador"}</div></div>
    <div class="ci-head-btns">${criador ? '<button type="button" class="ci-btn ci-btn-red" id="admSair">🔒 Sair do ADM</button>' : ""}<button type="button" class="ci-btn" id="admFechar">Fechar</button></div>`;
  const body = document.createElement("div");
  body.className = "ci-body";
  const redesenhar = () => admPainel(ov, nivel);
  const sHum = ciSecao(
    "🎚️ Nível de zoeira do C.A.O.S. com cada jogador",
    CURRENT_MODE === "junior"
      ? "Júnior: Family friendly, Suave ou Normal"
      : CURRENT_MODE === "hardcore"
        ? "Hardcore: Normal, Ácido ou Nível 0 (sem Suave)"
        : "💀 Nível 0 = sem dó",
  );
  const opts = humorOptionsForMode();
  const lista = document.createElement("div");
  lista.className = "ci-list";
  players.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "ci-row";
    row.innerHTML = `<span>${escapeHtml(p.avatar || "")} ${escapeHtml(p.name)}${i === pi ? " 👑" : ""}</span><span></span>`;
    const sel = document.createElement("select");
    sel.className = "ci-input";
    sel.style.margin = "0";
    opts.forEach((h) => {
      const o = document.createElement("option");
      o.value = h;
      o.textContent = HUMOR_NOMES[h];
      sel.appendChild(o);
    });
    sel.value = humorEscolhido(p);
    if (p.iniciante) {
      sel.disabled = true;
      sel.title = "Iniciante: Suave até o fim da partida";
      row.firstElementChild.insertAdjacentHTML("beforeend", ' <span class="ci-chip">🐣 iniciante</span>');
    }
    sel.addEventListener("change", () => {
      if (p.iniciante) return;
      p.humor = sel.value;
      caosLog("adm", `${p.name}: zoeira → ${sel.value}`);
      admFala(getRandomReaction(REACTIVE_VOICE.admHumorMudou, p.name, HUMOR_NOMES[sel.value].replace(/^\S+\s/, "")));
      saveGameState();
    });
    row.appendChild(sel);
    lista.appendChild(row);
  });
  sHum.appendChild(lista);
  if (criador && players.length) {
    const todos = document.createElement("div");
    todos.className = "ci-grid2 ci-tight";
    opts.forEach((h) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ci-step";
      b.style.background =
        h === "zero" ? "#7b1f3a" : h === "acido" ? "#8a4b10" : h === "suave" ? "#2d6b4f" : h === "familia" ? "#1f5f7a" : "#34465a";
      b.textContent = "Todos: " + HUMOR_NOMES[h];
      b.addEventListener("click", () => {
        players.forEach((p) => {
          if (!p.iniciante) p.humor = h;
        });
        caosLog("adm", `todos → ${h}`);
        admFala(
          getRandomReaction(REACTIVE_VOICE.admHumorMudou, "a mesa inteira", HUMOR_NOMES[h].replace(/^\S+\s/, "")),
        );
        saveGameState();
        redesenhar();
      });
      todos.appendChild(b);
    });
    sHum.appendChild(todos);
  }
  sHum.insertAdjacentHTML(
    "beforeend",
    '<div class="ci-note">O C.A.O.S. comenta a mudança quando o jogo voltar da pausa.</div>',
  );
  body.appendChild(sHum);
  if (criador) {
    const sRem = ciSecao("🚪 Remover jogador", "pontos divididos entre quem fica");
    if (CURRENT_FORMAT === "equipe")
      sRem.insertAdjacentHTML(
        "beforeend",
        '<div class="ci-empty">No Equipe não dá: as equipes precisam de exatamente 4 ou 6 jogadores.</div>',
      );
    else if (players.length <= 2)
      sRem.insertAdjacentHTML(
        "beforeend",
        '<div class="ci-empty">Com 2 jogadores não dá pra tirar ninguém — a partida precisa de pelo menos 2.</div>',
      );
    else if (gameEnded || !starterChosen)
      sRem.insertAdjacentHTML(
        "beforeend",
        '<div class="ci-empty">Só durante a partida (no cadastro, use o "remover" da lista).</div>',
      );
    else {
      const l2 = document.createElement("div");
      l2.className = "ci-list";
      players.forEach((p, i) => {
        const row = document.createElement("div");
        row.className = "ci-row";
        row.innerHTML = `<span>${escapeHtml(p.avatar || "")} ${escapeHtml(p.name)}</span><span class="ci-mono ci-dim">${p.score} pts · casa ${p.position}</span>`;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ci-mini";
        b.textContent = "🚪 Remover";
        b.addEventListener("click", () => {
          const resto = players.length - 1,
            parte = Math.floor(p.score / resto),
            sobra = p.score - parte * resto;
          caosConfirmarModal(
            `Remover ${p.name} da partida?

Os ${p.score} pontos vão ser divididos: +${parte} pra cada um dos ${resto} que ficam${sobra ? `, e ${sobra} vão pro cofrinho do C.A.O.S.` : ""}.${currentCard ? "\nA carta da mesa volta pro baralho e o Mestre puxa outra." : ""}`,
            "Remover",
            "Cancelar",
            () => {
              const r = admRemoverJogador(i);
              if (r !== "ok") caosAvisoModal("Não deu pra remover: " + r);
              redesenhar();
            },
          );
        });
        row.appendChild(b);
        l2.appendChild(row);
      });
      sRem.appendChild(l2);
    }
    body.appendChild(sRem);
    const sC = ciSecao("🤖 C.A.O.S.", `cofrinho: ${caosCofrinho} ${caosCofrinho === 1 ? "ponto" : "pontos"}`);
    const bSil = document.createElement("button");
    bSil.type = "button";
    bSil.className = "ci-btn ci-wide" + (caosSilenced ? " ci-btn-gold" : "");
    bSil.textContent = caosSilenced
      ? "🔊 Soltar o C.A.O.S. (ele volta a falar)"
      : "🤐 Calar o C.A.O.S. até o fim da partida";
    bSil.addEventListener("click", () => {
      caosSilenced = !caosSilenced;
      if (!caosSilenced) {
        caosFatigueLevel = "normal";
        admFala(getRandomReaction(REACTIVE_VOICE.caosVoltouDaPartida));
      } else caosVoiceCancel();
      caosLog("adm", caosSilenced ? "C.A.O.S. calado pelo ADM" : "C.A.O.S. solto pelo ADM");
      saveGameState();
      redesenhar();
    });
    const bCer = document.createElement("button");
    bCer.type = "button";
    bCer.className = "ci-btn ci-btn-gold ci-wide";
    bCer.textContent = "🧠 Abrir o cérebro do C.A.O.S.";
    bCer.addEventListener("click", () => {
      caosInspectorDestravado = true;
      ov.remove();
      caosDiagShow();
    });
    sC.append(bSil, bCer);
    sC.insertAdjacentHTML(
      "beforeend",
      '<div class="ci-note">O cofrinho junta os pontos que sobram quando alguém sai e a divisão não fecha. O C.A.O.S. entrega tudo junto na próxima Ajudinha.</div>',
    );
    body.appendChild(sC);
    const sP = ciSecao("🃏 Controle da partida");
    const bPular = document.createElement("button");
    bPular.type = "button";
    bPular.className = "ci-btn ci-wide";
    const temCarta = !!currentCard && !gameEnded && (cardState === "hidden" || cardState === "revealed");
    bPular.textContent = "⏭️ Pular a carta da mesa (volta pro baralho, ninguém pontua, o mesmo Mestre puxa outra)";
    if (!temCarta) {
      bPular.disabled = true;
      bPular.style.opacity = "0.45";
    }
    bPular.addEventListener("click", () => {
      caosConfirmarModal("Pular esta carta? Ela volta pro baralho e ninguém pontua.", "Pular", "Cancelar", () => {
        admDevolverCarta();
        caosLog("adm", "carta pulada pelo ADM");
        saveGameState();
        redesenhar();
      });
    });
    sP.appendChild(bPular);
    if (players.length) {
      const lbl = document.createElement("label");
      lbl.className = "ci-field";
      lbl.textContent = "👑 ADM principal";
      const sel = document.createElement("select");
      sel.className = "ci-input";
      players.forEach((p) => {
        const o = document.createElement("option");
        o.value = p.id;
        o.textContent = p.name;
        sel.appendChild(o);
      });
      sel.value = admPrincipalId || "";
      sel.addEventListener("change", () => {
        admPrincipalId = sel.value;
        caosLog("adm", `ADM principal → ${(jogadorPorId(sel.value) || {}).name || "?"}`);
        saveGameState();
        redesenhar();
      });
      lbl.appendChild(sel);
      sP.appendChild(lbl);
    }
    admMestreAjudaSecao(sP, redesenhar);
    // 1.7.8.3: ensaio em duas abas
    if (typeof telaoAbrirAba === "function" && typeof BroadcastChannel === "function") {
      const tb = document.createElement("button");
      tb.type = "button";
      tb.className = "ci-btn ci-wide";
      tb.textContent = "📺 Abrir telão (outra aba, só olha a partida)";
      tb.addEventListener("click", telaoAbrirAba);
      sP.appendChild(tb);
    }
    body.appendChild(sP);
  }
  head.querySelector("#admFechar").addEventListener("click", () => ov.remove());
  const sair = head.querySelector("#admSair");
  if (sair)
    sair.addEventListener("click", () => {
      admCriadorLogado = false;
      ov.remove();
    });
  box.append(head, body);
  ov.appendChild(box);
}
function showPauseScreen() {
  document.getElementById("welcomeScreen").style.display = "none";
  document.getElementById("pauseScreen").style.display = "block";
  const rl = document.getElementById("pauseRulesList");
  if (rl) rl.innerHTML = buildRulesHtml();
  pausaAjustesAtualizar();
  tutPausaAtualizar();
  const bv = document.getElementById("pauseVitoriaBtn");
  if (bv) bv.style.display = CURRENT_MODE === "express" ? "none" : "";
  startPauseTips();
}
function hidePauseScreen() {
  stopPauseTips();
  caosPausaParar();
  document.getElementById("pauseScreen").style.display = "none";
}
function perguntarPartidaAnterior() {
  let bg = document.getElementById("partidaAnteriorModal");
  if (bg) bg.remove();
  const min = pausedAt ? Math.max(5, Math.round((Date.now() - pausedAt) / 6e4)) : 5;
  const nomes = players.map((p) => escapeHtml(p.name)).join(", ");
  bg = document.createElement("div");
  bg.id = "partidaAnteriorModal";
  bg.className = "jf-modal-bg";
  bg.innerHTML = `<div class="jf-modal" role="dialog" aria-modal="true" aria-labelledby="paTitle">
    <div class="pause-icon pause-min" aria-hidden="true"><i></i><i></i></div>
    <h3 id="paTitle">Continuar a partida anterior?</h3>
    <p>A partida ficou pausada por ${min >= 60 ? "mais de uma hora" : min + " min"} e o C.A.O.S. fechou o jogo.${nomes ? `<br><b>${nomes}</b>` : ""}</p>
    <button class="btn-start btn-neo neo-solid neo-still" id="paSim" style="--mc:#34d399; --mc-glow:rgba(52,211,153,0.35);">▶️ Sim, continuar de onde parou</button>
    <button class="btn-sec" id="paNao" style="width:100%; margin-top:12px; padding:12px;">🔄 Não, começar outra</button>
  </div>`;
  document.body.appendChild(bg);
  bg.querySelector("#paSim").addEventListener("click", () => {
    bg.remove();
    const minutos = min;
    document.getElementById("splashScreen").style.display = "none";
    resumeGame();
    requestWakeLock();
    caosToastAtrasado(
      () => showToastMessage(getRandomReaction(REACTIVE_VOICE.pausaExpirada.continuou, minutos), null, true),
      350,
    );
  });
  bg.querySelector("#paNao").addEventListener("click", () => {
    bg.remove();
    resetGame();
    document.getElementById("splashScreen").style.display = "none";
    document.getElementById("formatSelectScreen").style.display = "block";
    renderModeCardDescs();
    caosToastAtrasado(
      () => showToastMessage(getRandomReaction(REACTIVE_VOICE.pausaExpirada.recomecou), null, true),
      350,
    );
  });
}
function startPauseTipsTimerOnly() {
  stopPauseTips();
  pauseTipTimer = setInterval(() => showPauseTip(true), PAUSE_TIP_MS);
}
function buildOrderList() {
  const order = [];
  let idx = mestreIndex;
  for (let i = 0; i < players.length; i++) {
    order.push(idx);
    idx = nextIndex(idx);
  }
  return order;
}
function renderOrderList() {
  const el = document.getElementById("orderList");
  if (CURRENT_FORMAT === "equipe") {
    el.innerHTML = teamOrder
      .map(
        (id, i) =>
          `<li class="${i === 0 ? "is-mestre" : ""}">${TEAM_INFO[id].emoji} Equipe ${TEAM_INFO[id].label}${i === 0 && players[mestreIndex] ? " — Mestre: " + escapeHtml(players[mestreIndex].name) : ""}</li>`,
      )
      .join("");
  } else {
    el.innerHTML = buildOrderList()
      .map(
        (idx, i) =>
          `<li class="${i === 0 ? "is-mestre" : ""}">${playerNameHtml(players[idx].name, players[idx].color, players[idx].avatar)}</li>`,
      )
      .join("");
  }
  const b = document.getElementById("redrawMestreBtn");
  if (b) {
    const left = STARTER_MAX_DRAWS - starterDrawCount;
    b.style.display = left > 0 ? "" : "none";
    const jfNext = left === 1 && jfPlayerIndex() >= 0;
    b.textContent = jfNext
      ? "🔄 Sortear outro Mestre (último: vai pro JF 😎)"
      : `🔄 Sortear outro Mestre (${left} ${left === 1 ? "chance" : "chances"})`;
  }
}
function startOrderCountdown() {
  let secondsLeftOrder = 30;
  const countdownEl = document.getElementById("orderCountdown");
  countdownEl.textContent = `${secondsLeftOrder}s`;
  clearInterval(orderCountdownInterval);
  orderCountdownInterval = setInterval(() => {
    secondsLeftOrder--;
    countdownEl.textContent = `${secondsLeftOrder}s`;
    if (secondsLeftOrder <= 0) {
      clearInterval(orderCountdownInterval);
      beginGameplay();
    }
  }, 1e3);
}
function resetTeamSetupUI() {
  document.getElementById("teamCountChoice").style.display = "block";
  document.getElementById("teamRosterPreview").style.display = "none";
  document.getElementById("teamSubModeChoice").style.display = "none";
  document.getElementById("startTeamsBtn").style.display = "none";
}
function renderTeamRosterPreview() {
  const box = document.getElementById("teamRosterPreview");
  const ids = Object.keys(teams);
  box.innerHTML =
    ids
      .map((id) => {
        const info = TEAM_INFO[id];
        const members = teams[id].members.map((i) => escapeHtml(players[i].name)).join(", ");
        return `<div style="margin-bottom:4px;"><strong style="color:${info.color};">${info.emoji} Equipe ${info.label}:</strong> ${members}</div>`;
      })
      .join("") +
    `<button class="main-btn" id="reRollTeamsBtn" style="margin-top:8px; font-size:0.8rem; opacity:0.8;">🎲 Sortear de novo</button>`;
  document.getElementById("reRollTeamsBtn").addEventListener("click", () => runTeamFormation(ids.length));
}
function paintSubModeChoice(which) {
  [
    ["subModeDueloBtn", "duelo"],
    ["subModeFfaBtn", "ffa"],
    ["subModeRandomBtn", "random"],
  ].forEach(([id, k]) => {
    const b = document.getElementById(id);
    if (!b) return;
    const on = k === which;
    b.style.background = on ? "var(--special)" : "";
    b.style.color = on ? "#1a1a2e" : "";
    b.style.opacity = on ? "1" : "0.6";
  });
}
function syncGameplayPanels() {
  if (starterChosen) {
    document.getElementById("playerPanel").style.display = "none";
    document.getElementById("orderRevealSection").style.display = "none";
    document.getElementById("playAreaSection").style.display = "flex";
  } else {
    document.getElementById("playerPanel").style.display = "block";
    document.getElementById("orderRevealSection").style.display = "none";
    document.getElementById("playAreaSection").style.display = "none";
  }
}
function updateBatataBtn() {
  const btn = document.getElementById("btnBatata");
  if (!btn) return;
  const on = document.body.classList.contains("batata-mode");
  btn.textContent = "🥔 Batata";
  btn.classList.toggle("off", !on);
  btn.title = on
    ? "Modo Batata LIGADO: sem animações pesadas (toque pra desligar)"
    : "Modo Batata: tira animações pesadas, economiza bateria (toque pra ligar)";
}
function updateNoturnoBtn() {
  const btn = document.getElementById("btnNoturno");
  if (!btn) return;
  const claro = document.body.classList.contains("claro");
  btn.textContent = claro ? "☀️ Claro" : "🌙 Noturno";
  btn.style.setProperty("--cc", claro ? "#f59e0b" : "#a5b4fc");
  btn.title = claro ? "Modo Claro (toque pra voltar ao Noturno)" : "Modo Noturno (toque pra trocar pro Claro)";
  pausaAjustesAtualizar();
}
// Pausa: trocar o visual e calar/ligar a voz sem sair da partida.
function pausaAjustesAtualizar() {
  const t = document.getElementById("pauseTemaBtn"),
    v = document.getElementById("pauseVozBtn");
  if (t) t.textContent = document.body.classList.contains("claro") ? "🌙 Noturno" : "☀️ Modo Claro";
  if (v) {
    v.style.display = CAOS_VOICE_OK ? "" : "none";
    v.textContent = caosVoiceOn ? "🤐 Calar a voz" : "🗣️ Ligar a voz";
  }
  // 1.7.5.2: silenciou sem querer? Religa nesta carta, sem mágoa.
  const r = document.getElementById("pauseReligarBtn");
  if (r) r.style.display = caosMudoCarta && !gameEnded ? "" : "none";
}
// Calou a voz na pausa: ele continua nos balões e reclama uma vez, sem encher o saco.
function pausaVozTrocar() {
  if (!CAOS_VOICE_OK) return;
  caosVoiceOn = !caosVoiceOn;
  try {
    JFStore.setItem("perfil200_voz", caosVoiceOn ? "1" : "0");
  } catch (e) {}
  updateVoiceBtn();
  pausaAjustesAtualizar();
  if (caosVoiceOn) {
    caosSpeakSample("Voz do Caos ligada. Senti falta de mim.");
    return;
  }
  caosVoiceCancel();
  try {
    if (!stats || stats.totalDrawn < 1 || gameEnded || caosSilenced || !caosOncePerMatch("voz_calada")) return;
    caosEmoNudge(2, -1);
    caosLog("voz", "voz desligada na pausa");
    const box = document.getElementById("pausaCaos");
    const txt = getRandomReaction(REACTIVE_VOICE.vozCalada);
    if (!box || !txt) return;
    box.style.display = "";
    box.classList.add("show");
    caosToastEmo(box, CURRENT_MODE === "junior" ? "deboche" : "tedio", null);
    box.textContent = String(txt).replace(/[⟦⟧]/g, "");
  } catch (e) {}
}
// Dois visuais: Noturno (padrão) e Claro. Guardado em NOTURNO_KEY: "0" = Claro.
function temaAplicar(claro) {
  if (claro === undefined) {
    claro = false;
    try {
      claro = JFStore.getItem(NOTURNO_KEY) === "0";
    } catch (e) {}
  }
  document.body.classList.toggle("noturno", !claro);
  document.body.classList.toggle("claro", claro);
  document.documentElement.classList.toggle("claro", claro);
  try {
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", claro ? "#f8edd5" : "#1a1a2e");
  } catch (e) {}
  updateNoturnoBtn();
}
function toggleNoturno() {
  const claro = !document.body.classList.contains("claro");
  temaAplicar(claro);
  try {
    JFStore.setItem(NOTURNO_KEY, claro ? "0" : "1");
  } catch (e) {}
}
function toggleBatataMode() {
  const isBatata = document.body.classList.toggle("batata-mode");
  updateBatataBtn();
  renderColorPicker();
  try {
    JFStore.setItem("perfil200_batata", isBatata ? "1" : "0");
  } catch (e) {}
}
function novidadesMarcarChip() {
  const c = document.getElementById("btnNovidades");
  if (!c) return;
  let visto = "";
  try {
    visto = JFStore.getItem(NOVIDADES_KEY) || "";
  } catch (e) {
    visto = NOVIDADES[0].v;
  }
  c.classList.toggle("tem-novo", visto !== NOVIDADES[0].v);
}
// Item das novidades no formato "emoji Título: texto": o título vai numa caixinha de destaque.
function novItemHtml(x) {
  const m = /^(\S+\s+)?([^:<"]{2,34}):\s+([\s\S]+)$/u.exec(x);
  if (!m) return `<li>${x}</li>`;
  return `<li><details class="nov-drop"><summary class="nov-tag">${m[1] || ""}${m[2]}</summary><div class="nov-drop-txt">${m[3].charAt(0).toUpperCase() + m[3].slice(1)}</div></details></li>`;
}
function abrirNovidades() {
  document.getElementById("novidadesModal")?.remove();
  const bg = document.createElement("div");
  bg.id = "novidadesModal";
  bg.className = "jf-modal-bg";
  bg.innerHTML = `<div class="jf-modal nov-modal" role="dialog" aria-modal="true" aria-labelledby="novTitle">
    <button type="button" class="nov-x" id="novX" aria-label="Fechar novidades">✕</button>
    <div class="nov-ic">🆕</div><h3 id="novTitle">NOVIDADES</h3><div class="nov-sub">O que mudou nas últimas versões</div>
    ${NOVIDADES.map((n, i) => `<details class="nov-item"${i === 0 ? " open" : ""}><summary><span class="nov-v">${n.v}</span>${n.nome ? `<span class="nov-nome">${n.nome}</span>` : ""}${n.data ? `<span class="nov-data">📅 ${n.data}</span>` : ""}<span class="nov-t">${n.t}</span></summary><ul>${n.itens.map(novItemHtml).join("")}</ul>${n.qol && n.qol.length ? `<div class="nov-qol">🔧 Ajustes e correções (QoL)</div><ul>${n.qol.map(novItemHtml).join("")}</ul>` : ""}</details>`).join("")}
    <button type="button" class="btn-start btn-neo neo-solid neo-still" id="novOk" style="--mc:#a78bfa; --mc-glow:rgba(167,139,250,0.35); margin-top:14px;">Entendi</button>
  </div>`;
  document.body.appendChild(bg);
  const fechar = () => bg.remove();
  bg.querySelector("#novOk").addEventListener("click", fechar);
  bg.querySelector("#novX").addEventListener("click", fechar);
  bg.addEventListener("click", (ev) => {
    if (ev.target === bg) fechar();
  });
  try {
    JFStore.setItem(NOVIDADES_KEY, NOVIDADES[0].v);
  } catch (e) {}
  novidadesMarcarChip();
}
function cadMostraSel(flag) {
  return !!flag || (typeof iniFluxo !== "undefined" && !!iniFluxo);
}
function cadPodeAdicionar() {
  const inp = document.getElementById("playerNameInput");
  const nome = inp ? inp.value.trim() : "";
  if (nome.length < 2) return false;
  if (isJfName(nome) || isAnneName(nome)) return true;
  const eq = CURRENT_FORMAT === "equipe";
  if (!eq && !cadCor) return false;
  if (!cadEmoji) return false;
  if (!humorPreMarcado() && !cadHumor) return false;
  if (eq && !cadFaixa) return false;
  return true;
}
function cadFaltaTexto() {
  const inp = document.getElementById("playerNameInput");
  const nome = inp ? inp.value.trim() : "";
  if (nome.length < 2) return "Escreva o nome (2 a 15 letras).";
  if (isJfName(nome) || isAnneName(nome)) return "";
  const f = [],
    eq = CURRENT_FORMAT === "equipe";
  if (!eq && !cadCor) f.push("cor");
  if (!cadEmoji) f.push("emoji");
  if (!humorPreMarcado() && !cadHumor) f.push("zoeira do C.A.O.S.");
  if (eq && !cadFaixa) f.push("faixa de idade");
  return f.length ? "Falta escolher: " + f.join(", ") + (/\.$/.test(f[f.length - 1]) ? "" : ".") : "";
}
function cadAtualizarBotao() {
  try {
    const b = document.getElementById("addPlayerBtn");
    if (!b) return;
    if (typeof iniFluxo !== "undefined" && iniFluxo) return;
    const ok = cadPodeAdicionar();
    b.disabled = !ok;
    b.classList.toggle("pronto", ok);
    const f = document.getElementById("addPlayerFalta");
    if (f) f.textContent = ok ? "" : cadFaltaTexto();
  } catch (e) {}
}

