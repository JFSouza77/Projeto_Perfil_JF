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
    case "pausado":
      return {
        fr: `a mesa ficou ${v} ${pl(d.v, "minuto", "minutos")} na pausa, e isso não entrou na duração`,
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
function caosFalaFechaSozinha(corpo) {
  const t = String(corpo || "").trim();
  if (/[!?]$/.test(t) || /\p{Extended_Pictographic}\uFE0F?\s*$/u.test(t)) return true;
  return t.split(/(?<=[.!?…])\s+/).filter((x) => x.length > 3).length >= 2;
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
    // Piada que fecha sozinha (preparação + desfecho, ou termina em emoji, ! ou ?): o C.A.O.S. cala a boca
    // depois dela. Colar "eu ia falar mais bonito…" no fim mata o timing (pedido do JF, 1.7.6.7).
    if (!caosFalaFechaSozinha(corpo))
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
// Abrir uma janela tira o balão do C.A.O.S. da frente (e cala a voz dele): a mesa lê a janela em paz.
function caosLimparFalaParaJanela() {
  try {
    if (!activeToastState) return;
    caosVoiceCancel();
    closeActiveToast();
  } catch (e) {}
}
function caosModalBase() {
  caosLimparFalaParaJanela();
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
  // limite de memória (1.7.5.1): guarda as 500 avaliações mais recentes
  delete R[entry.key];
  R[entry.key] = rec;
  const ks = Object.keys(R);
  if (ks.length > CAOS_RATINGS_MAX) ks.slice(0, ks.length - CAOS_RATINGS_MAX).forEach((k) => delete R[k]);
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
    "PERFIL JF — RELATÓRIO DO C.A.O.S. (Beta 1.7.8 · C.A.O.S. 4.0)",
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
  const txt =
    caosGerarFala("pausaHumor", null, { tags: ["d" + alvo], vars: { pausa: caosPausaTexto(seg) } }) ||
    getRandomReaction(REACTIVE_VOICE.pausaHumor["s" + alvo]);
  if (!txt) return;
  box.style.display = "";
  box.classList.add("show");
  caosToastEmo(box, emo, alvo >= 5 ? "erroEscalada" : null);
  box.textContent = String(txt).replace(/[⟦⟧]/g, "");
  caosLog("pausa", `😤 pausa longa (degrau ${alvo + 1}, ${Math.round(seg)} s): ${emo}`);
}
// "1 minuto", "3 minutos" (pausas são de 40 s pra cima)
function caosPausaTexto(seg) {
  const m = Math.max(1, Math.round(seg / 60));
  return m === 1 ? "1 minuto" : m + " minutos";
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
  const pausa = caosPausaTexto(CAOS_PAUSA_DEGRAUS[d].s);
  caosFalaAgendar(
    () =>
      caosGerarFala("pausaVolta", null, { tags: [nivel], vars: { pausa } }) ||
      getRandomReaction(REACTIVE_VOICE.pausaVolta[nivel]),
    450,
    "media",
  );
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
