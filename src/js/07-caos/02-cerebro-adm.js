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
    <div class="ci-head-txt"><div class="ci-title">Cérebro do C.A.O.S. <span class="ci-badge">4.0 · rede neural</span></div>
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
      <div class="ci-kv"><span>🧩 Gerador de falas</span><b class="ci-mono">${(() => {
        const ks = Object.keys(caosGerConta).sort((a, b) => caosGerConta[b] - caosGerConta[a]);
        const tot = ks.reduce((s, k) => s + caosGerConta[k], 0);
        let kb = 0;
        try {
          kb = ((JFStore.getItem(CAOS_GERADOR_KEY) || "").length / 1024).toFixed(1);
        } catch (e) {}
        return (
          tot +
          " montada" +
          (tot === 1 ? "" : "s") +
          " nesta partida" +
          (ks.length ? " (" + ks.map((k) => escapeHtml(k) + " " + caosGerConta[k]).join(", ") + ")" : "") +
          " · " +
          Object.keys(CAOS_GERADORES).length +
          " geradores · memória " +
          kb +
          " KB"
        );
      })()}</b></div>
      <div class="ci-kv"><span>🦴 Espinha (3 leis)</span><b class="ci-mono">${caosEspinha.instalada ? "ativa" : "DESLIGADA"} · erros contidos ${caosEspinha.falhas} · jogo protegido ${caosEspinha.leis}x · medidores saneados ${caosEspinha.saneados}</b></div>
      <div class="ci-kv"><span>📡 Canal (últimas falas e destino)</span><b class="ci-mono">${
        caosCanal
          .slice(-4)
          .reverse()
          .map((c) => escapeHtml(c.para.map((d) => d.nome + "@" + d.aparelho).join(", ")) + ": " + escapeHtml(c.texto.slice(0, 50)))
          .join("<br>") || "—"
      }</b></div>
      <div class="ci-kv"><span>🦴 Registro da espinha</span><b class="ci-mono">${caosEspinha.log.slice(-5).reverse().map(escapeHtml).join("<br>") || "—"}</b></div>
      <div class="ci-kv"><span>🔇 Silenciado nesta carta</span><b class="ci-mono">${caosMudoCarta ? "SIM (por " + escapeHtml(caosMudoPor || "?") + ") · dá pra religar na Pausa" : "não"}</b></div>
      <div class="ci-kv"><span>Versão</span><b class="ci-mono">Beta 1.7.7.4 · C.A.O.S. 4.0</b></div>
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
// 1.7.5.3: o que o C.A.O.S. lembra entre partidas, onde está gravado e se o lugar é seguro.
// (As abas Ritmo e Decisões mostram só a partida atual; a memória de longo prazo fica aqui.)
let caosMemPersistida = null;
function caosMemoriaLongoPrazo() {
  const sec = ciSecao("🧠 Memória de longo prazo (entre partidas, neste endereço)");
  const conta = (k, arr) => {
    try {
      const v = JSON.parse(JFStore.getItem(k) || (arr ? "[]" : "{}"));
      return Array.isArray(v) ? v.length : Object.keys(v || {}).length;
    } catch (e) {
      return 0;
    }
  };
  let fichas = {},
    diag = { matches: 0 };
  try {
    fichas = fichasTodas() || {};
  } catch (e) {}
  try {
    diag = caosDiagLoad() || diag;
  } catch (e) {}
  const nomesFichas = Object.values(fichas)
    .sort((a, b) => (b.ultimaVez || 0) - (a.ultimaVez || 0))
    .slice(0, 8)
    .map((f) => escapeHtml(f.nome || "?") + " (" + (f.partidas || 0) + ")")
    .join(", ");
  let st = { camadas: [] };
  try {
    st = JFStore.status();
  } catch (e) {}
  const prot = location.protocol;
  const arquivo = prot === "file:" || prot === "blob:" || prot === "content:";
  if (caosMemPersistida === null && navigator.storage && navigator.storage.persisted)
    navigator.storage.persisted().then(
      (v) => (caosMemPersistida = !!v),
      () => (caosMemPersistida = false),
    );
  const avisos = [];
  if (arquivo)
    avisos.push(
      "📁 Você está jogando por um <b>arquivo</b> (aberto pelo Arquivos ou baixado). Cada arquivo tem a sua própria memória, e a pré-visualização do iPhone pode não guardar nada. Pra memória ficar sempre, jogue pelo <b>site</b> e adicione à Tela de Início.",
    );
  if (!arquivo && caosMemPersistida === false)
    avisos.push(
      "📲 O navegador ainda não garantiu esta memória. No iPhone, o Safari apaga dados de site depois de 7 dias sem visita. Adicionando o jogo à <b>Tela de Início</b>, isso não acontece.",
    );
  sec.insertAdjacentHTML(
    "beforeend",
    `<div class="ci-card">
      <div class="ci-kv"><span>👤 Jogadores com ficha</span><b class="ci-mono">${Object.keys(fichas).length}${nomesFichas ? " · " + nomesFichas : ""}</b></div>
      <div class="ci-kv"><span>📛 Nomes conhecidos · nicks vistos</span><b class="ci-mono">${conta(CAOS_NAMES_KEY)} · ${conta("perfil200_caos_nicks", true)}</b></div>
      <div class="ci-kv"><span>🎮 Partidas registradas</span><b class="ci-mono">${diag.matches || 0}</b></div>
      <div class="ci-kv"><span>🏆 Recordes · ⚔️ rivalidades</span><b class="ci-mono">${conta(MEM_RECORDES_KEY)} · ${conta(MEM_RIVAIS_KEY)}</b></div>
      <div class="ci-kv"><span>🃏 Cartas com histórico</span><b class="ci-mono">${Object.keys((caosCardMem && caosCardMem.porCarta) || {}).length}</b></div>
      <div class="ci-kv"><span>💾 Onde está gravado</span><b class="ci-mono">${escapeHtml(st.camadas.join(" + ") || "SÓ NA MEMÓRIA (some ao fechar)")} · ${escapeHtml(arquivo ? "arquivo local" : location.host || prot)}</b></div>
      <div class="ci-kv"><span>🔒 Memória garantida pelo navegador</span><b class="ci-mono">${caosMemPersistida === null ? "conferindo…" : caosMemPersistida ? "sim" : "não"}</b></div>
      ${avisos.map((a) => `<div class="ci-note">${a}</div>`).join("")}
      <div class="ci-note">As abas Ritmo e Decisões mostram só a partida atual, por isso começam vazias. O que o C.A.O.S. lembra entre partidas está aqui. Cada endereço (o site, ou cada arquivo offline) tem a sua própria memória.</div>
    </div>`,
  );
  return sec;
}
function caosInspectorMemoria() {
  const wrap = document.createElement("div");
  if (!caosCardMem) caosCardMemLoad();
  wrap.appendChild(caosMemoriaLongoPrazo());
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
    // 4.0: controle de humor por barras (deslize pra subir ou baixar cada emoção)
    const inj = document.createElement("div");
    inj.className = "ci-section";
    const tt = document.createElement("div");
    tt.className = "ci-section-title";
    tt.textContent = "🎛️ Controle de humor (teste)";
    inj.appendChild(tt);
    const lista = document.createElement("div");
    lista.className = "ci-card ci-sliders";
    const linhas = {};
    Object.keys(CAOS_CONSOLE).forEach((k) => {
      const M = CAOS_CONSOLE[k];
      const row = document.createElement("label");
      row.className = "ci-slider";
      row.innerHTML = `<span class="ci-slider-nome">${M.ic} ${k}</span><input type="range" min="0" max="${M.teto}" step="0.1"><b class="ci-mono"></b>`;
      const inp = row.querySelector("input"),
        val = row.querySelector("b");
      inp.style.accentColor = M.cor;
      inp.value = caosConsole.g[k];
      val.textContent = (+inp.value).toFixed(1);
      inp.addEventListener("input", () => {
        caosConsole.g[k] = Math.max(0, Math.min(M.teto, +inp.value));
        val.textContent = caosConsole.g[k].toFixed(1);
        caosConsoleAvancar("joia.sandbox");
      });
      inp.addEventListener("change", () => {
        caosLog("sandbox", `${k} ajustado pra ${caosConsole.g[k].toFixed(1)}`);
        caosConsoleLog(`${M.ic} ${k} = ${caosConsole.g[k].toFixed(1)} (controle)`);
        pintar();
      });
      linhas[k] = { inp, val };
      lista.appendChild(row);
    });
    inj.appendChild(lista);
    const bts = document.createElement("div");
    bts.className = "ci-grid2";
    const zerar = document.createElement("button");
    zerar.type = "button";
    zerar.className = "ci-btn";
    zerar.textContent = "🧘 Acalmar tudo (zera)";
    zerar.addEventListener("click", () => {
      Object.keys(caosConsole.g).forEach((k) => (caosConsole.g[k] = 0));
      caosConsoleAvancar("joia.sandbox");
      caosLog("sandbox", "acalmou tudo");
      pintar();
    });
    bts.appendChild(zerar);
    inj.appendChild(bts);
    inj.insertAdjacentHTML(
      "beforeend",
      '<div class="ci-note">Deslize pra subir ou baixar cada emoção. A emoção que manda é a mais alta (acima do limiar) e troca só com margem, então o humor muda de forma estável. O rosto muda na próxima fala. Não mexe em ponto nem em regra.</div>',
    );
    // as barras acompanham o cérebro (as emoções caem sozinhas com o tempo), menos a que está sendo arrastada
    const tk2 = setInterval(() => {
      if (!inj.isConnected) return clearInterval(tk2);
      Object.keys(linhas).forEach((k) => {
        const L = linhas[k];
        if (document.activeElement === L.inp) return;
        L.inp.value = caosConsole.g[k];
        L.val.textContent = caosConsole.g[k].toFixed(1);
      });
    }, 1e3);
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
