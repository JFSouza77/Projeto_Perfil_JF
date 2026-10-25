/* ----------------------------------------------------------------------
 * 7g. CÉREBRO EM MODO SOMBRA (C.A.O.S. 5.1, roteiro docs/Roteiro_Cerebro_Sombra_2026-10-25.md)
 *
 * Passo 1 · REGISTRO ÚNICO. Toda fala que passa pelo funil (showToastMessage) é anotada aqui por
 *           caosEmit: o que apareceu na tela (com banco e emoção) e o que foi cortado (e por quê).
 *           Não sorteia nada e não mexe em nada: só anota.
 * Passo 2 · MODO SOMBRA. A cada jogada (acerto, erro, pulo, Absurdo) o cérebro olha a mesa
 *           (caosVisao, só leitura), dá nota pras falas que caberiam e escolhe uma ou o silêncio.
 *           Ele NÃO fala: quem fala continua sendo o sistema de sempre. O cérebro só anota
 *           "eu teria falado X porque Y; o sistema falou Z" (aba 📜 Decisões do Inspetor).
 *           Desligado por padrão (chave no aparelho). Sem sorteio: a mesma mesa dá a mesma decisão,
 *           então ligar ou desligar não muda nenhum sorteio do jogo.
 * Passo 3 (depois do teste de mesa, com o OK do JF): a decisão passa a valer.
 * ---------------------------------------------------------------------- */
const CAOS_FALA_REG_MAX = 200;
const CAOS_CEREBRO_LOG_MAX = 60;
const CAOS_CEREBRO_KEY = "perfil5_caos_cerebro";
const CAOS_CEREBRO_LIMIAR = 0.5;
// falas que o cérebro nunca cala (no passo 3 elas continuam protegidas)
const CAOS_CEREBRO_OBRIGATORIAS = new Set(["absurdo", "retaFinal"]);
// zoeira: no Júnior e com Family friendly vira incentivo
const CAOS_CEREBRO_ZOEIRA = new Set(["errosSeguidos", "pulosSeguidos"]);
let caosFalaReg = [];
let caosFalaN = 0;
const caosCerebro = { on: false, log: [], lider: null, reta: new Set(), escolhas: [], tot: 0, fal: 0, tipos: {}, acertaram: new Set() };
try {
  caosCerebro.on = JFStore.getItem(CAOS_CEREBRO_KEY) === "1";
} catch (e) {}

// ---------- Passo 1: registro único ----------
function caosEmit(evento, dados) {
  try {
    const d = dados || {};
    const e = {
      n: ++caosFalaN,
      t: Date.now(),
      carta: typeof stats !== "undefined" && stats ? stats.totalDrawn : 0,
      ev: String(evento || "livre"),
      banco: d.banco || null,
      emo: d.emo || null,
      prio: !!d.prio,
      motivo: d.motivo || null,
      texto: String(d.texto || "").slice(0, 160),
    };
    caosFalaReg.push(e);
    if (caosFalaReg.length > CAOS_FALA_REG_MAX) caosFalaReg.shift();
    if (caosCerebro.on) caosCerebroParear(e);
    return e;
  } catch (err) {
    return null;
  }
}
// fala do C.A.O.S. que o funil não deixou passar
function caosCortou(msg, motivo, prio) {
  if (typeof msg !== "string" || msg.indexOf("[C.A.O.S.]") === -1) return;
  caosEmit("cortada", { texto: msg, motivo, prio });
}

// ---------- Passo 2: percepção (só leitura) ----------
function caosVisao(idx, ev) {
  const p = players[idx] || null,
    cartas = typeof stats !== "undefined" && stats ? stats.totalDrawn : 0;
  const ord = players.map((q, i) => i).sort((a, b) => (players[b].score || 0) - (players[a].score || 0));
  const lider = players.length ? players[ord[0]].name : null;
  const gap = players.length > 1 ? (players[ord[0]].score || 0) - (players[ord[1]].score || 0) : 0;
  const h = (p && p.emo && p.emo.h) || "";
  const fim = (re) => (h.match(re) || [""])[0].length;
  const alvo = typeof WINNING_SCORE === "number" && WINNING_SCORE > 0 ? WINNING_SCORE : 0;
  return {
    carta: cartas,
    ev,
    quem: p ? p.name : null,
    humor: p ? playerHumor(p) : null,
    familia: !!(p && humorFamilia(p)),
    junior: CURRENT_MODE === "junior",
    lider,
    gap,
    seqOk: fim(/[Aa]+$/),
    seqErr: fim(/[EX]+$/),
    seqPulo: fim(/P+$/),
    perto: !!(p && alvo && (p.position || 0) >= alvo - Math.max(5, Math.round(alvo * 0.1)) && (p.position || 0) < alvo),
    dicas: Array.isArray(revealedOrder) ? revealedOrder.filter((r) => r && r.item && r.item.type === "clue").length : 0,
    cansada: !!(caosTato && caosTato.curto),
    falasCarta: caosCerebro.log.filter((e) => e.carta === cartas && e.escolha).length,
  };
}

// ---------- Passo 2: decisão (notas, sem sorteio) ----------
function caosCerebroCandidatos(v) {
  const c = [];
  const add = (tipo, nota, motivo) => c.push({ tipo, nota, motivo });
  if (v.ev === "X") add("absurdo", 1, "Absurdo é sempre comentado");
  if (v.ev === "a") add("acertoRapido", 0.7, `acertou com ${v.dicas || "poucas"} dica${v.dicas === 1 ? "" : "s"}`);
  if (v.ev === "A") add("acerto", 0.35, "acerto comum");
  if ((v.ev === "A" || v.ev === "a") && v.seqOk >= 3) add("sequencia", 0.85, `${v.seqOk} acertos seguidos`);
  if ((v.ev === "A" || v.ev === "a") && v.quem && !caosCerebro.acertaram.has(v.quem) && v.carta >= 2)
    add("estreia", 0.6, `primeiro acerto de ${v.quem} na partida`);
  if (v.ev === "E") add("erro", 0.3, "erro comum");
  if (v.ev === "E" && v.seqErr === 2) add("erroDeNovo", 0.55, "segundo erro seguido");
  if ((v.ev === "E" || v.ev === "X") && v.seqErr >= 3) add("errosSeguidos", 0.8, `${v.seqErr} erros seguidos`);
  if (v.ev === "P") add("pulo", 0.2, "pulou");
  if (v.ev === "P" && v.seqPulo >= 2) add("pulosSeguidos", 0.65, `${v.seqPulo} pulos seguidos`);
  if (v.lider && caosCerebro.lider && v.lider !== caosCerebro.lider && v.carta >= 3)
    add("viradaLider", 0.8, `${v.lider} passou ${caosCerebro.lider} na liderança`);
  if (v.perto && v.quem && !caosCerebro.reta.has(v.quem)) add("retaFinal", 0.9, `${v.quem} está na reta final`);
  // ajustes: o que acabou de ser escolhido perde graça; mesa cansada (Tato) pede menos
  const recentes = caosCerebro.escolhas.slice(-3);
  c.forEach((x) => {
    if (CAOS_CEREBRO_OBRIGATORIAS.has(x.tipo)) return;
    if (recentes.includes(x.tipo)) {
      x.nota -= 0.2;
      x.motivo += " (já dito há pouco)";
    }
    if (v.cansada) {
      x.nota -= 0.15;
      x.motivo += " (mesa cansada)";
    }
    // Júnior e Family friendly: zoeira vira incentivo
    if ((v.junior || v.familia) && CAOS_CEREBRO_ZOEIRA.has(x.tipo)) {
      x.tipo = "incentivo";
      x.motivo += " → incentivo (Júnior/Family friendly)";
    }
    x.nota = Math.round(Math.max(0, Math.min(1, x.nota)) * 100) / 100;
  });
  return c.sort((a, b) => b.nota - a.nota);
}
function caosCerebroDecidir(v) {
  const cands = caosCerebroCandidatos(v);
  const top = cands[0] || null;
  let escolha = null,
    porque = "nada que valesse a pena";
  if (top && CAOS_CEREBRO_OBRIGATORIAS.has(top.tipo)) {
    escolha = top;
    porque = top.motivo + " (obrigatória)";
  } else if (v.falasCarta >= CAOS_FALAS_POR_CARTA) porque = `orçamento da carta cheio (${CAOS_FALAS_POR_CARTA})`;
  else if (top && top.nota >= CAOS_CEREBRO_LIMIAR) {
    escolha = top;
    porque = top.motivo;
  } else if (top) porque = `nota baixa (${top.tipo} ${top.nota})`;
  return { escolha, porque, cands };
}
// entrada (blindada pela espinha): chamada a cada jogada, só com o cérebro ligado
function caosCerebroEvento(idx, ev) {
  if (!caosCerebro.on || !players[idx]) return;
  const v = caosVisao(idx, ev);
  const d = caosCerebroDecidir(v);
  const e = {
    t: Date.now(),
    carta: v.carta,
    ev,
    quem: v.quem,
    escolha: d.escolha ? d.escolha.tipo : null,
    nota: d.escolha ? d.escolha.nota : d.cands[0] ? d.cands[0].nota : 0,
    porque: d.porque,
    cands: d.cands.slice(0, 3).map((c) => c.tipo + " " + c.nota),
    sistema: null,
  };
  caosCerebro.log.push(e);
  caosCerebro.tot++;
  if (e.escolha) {
    caosCerebro.fal++;
    caosCerebro.tipos[e.escolha] = (caosCerebro.tipos[e.escolha] || 0) + 1;
  }
  if (caosCerebro.log.length > CAOS_CEREBRO_LOG_MAX) caosCerebro.log.shift();
  if (e.escolha) {
    caosCerebro.escolhas.push(e.escolha);
    if (caosCerebro.escolhas.length > 10) caosCerebro.escolhas.shift();
  }
  if (e.escolha === "retaFinal" && v.quem) caosCerebro.reta.add(v.quem);
  if ((ev === "A" || ev === "a") && v.quem) caosCerebro.acertaram.add(v.quem);
  caosCerebro.lider = v.lider;
}
// o que o sistema de verdade falou (ou cortou) logo depois da decisão
function caosCerebroParear(f) {
  const ult = caosCerebro.log[caosCerebro.log.length - 1];
  if (!ult || ult.sistema || ult.carta !== f.carta || f.t - ult.t > 20e3) return;
  ult.sistema = f.ev === "cortada" ? "cortou (" + (f.motivo || "?") + ")" : f.banco || "fala sem banco";
}
function caosCerebroLigar(v) {
  caosCerebro.on = !!v;
  try {
    JFStore.setItem(CAOS_CEREBRO_KEY, v ? "1" : "0");
  } catch (e) {}
}
function caosCerebroZerar() {
  caosCerebro.log = [];
  caosCerebro.lider = null;
  caosCerebro.reta = new Set();
  caosCerebro.acertaram = new Set();
  caosCerebro.escolhas = [];
  caosCerebro.tot = 0;
  caosCerebro.fal = 0;
  caosCerebro.tipos = {};
  caosFalaReg = [];
}
// resumo pro Inspetor e pros testes
function caosCerebroResumo() {
  const L = caosCerebro.log,
    C = caosCerebro;
  return {
    decisoes: C.tot,
    falaria: C.fal,
    pct: C.tot ? Math.round((C.fal / C.tot) * 100) : 0,
    tipos: Object.keys(C.tipos),
    jogadas: L.reduce((m, e) => ((m[e.ev] = (m[e.ev] || 0) + 1), m), {}),
    concordou: L.filter((e) => e.escolha && e.sistema && !/^cortou/.test(e.sistema)).length,
  };
}
// seção da aba 📜 Decisões
function caosInspectorCerebro(onChange) {
  const sec = ciSecao("🧠 Cérebro em modo sombra", caosCerebro.on ? "ligado" : "desligado");
  const bt = document.createElement("button");
  bt.type = "button";
  bt.className = "ci-mini";
  bt.textContent = caosCerebro.on ? "Desligar" : "Ligar";
  bt.addEventListener("click", () => {
    caosCerebroLigar(!caosCerebro.on);
    onChange();
  });
  sec.querySelector(".ci-section-title").appendChild(bt);
  sec.insertAdjacentHTML(
    "beforeend",
    '<div class="ci-note">Ele decide se falaria e o quê, mas não fala: quem fala continua sendo o sistema de sempre. Serve pra comparar antes de valer (passo 3). Não sorteia nada e não mexe no jogo.</div>',
  );
  const r = caosCerebroResumo();
  if (!caosCerebro.log.length) {
    sec.insertAdjacentHTML(
      "beforeend",
      `<div class="ci-empty">${caosCerebro.on ? "Nenhuma jogada desde que ligou." : "Desligado. Ligue e jogue algumas cartas."}</div>`,
    );
    return sec;
  }
  sec.insertAdjacentHTML(
    "beforeend",
    `<div class="ci-note">${r.decisoes} jogadas · falaria em ${r.falaria} (${r.pct}%) · tipos: ${escapeHtml(r.tipos.join(", ") || "-")}</div>`,
  );
  const lista = document.createElement("div");
  lista.className = "ci-list";
  lista.innerHTML = [...caosCerebro.log]
    .reverse()
    .slice(0, 30)
    .map(
      (e) =>
        `<div class="ci-log" style="border-left-color:${e.escolha ? "#4ade80" : "#64748b"}"><div class="ci-log-top"><span class="ci-mono ci-dim">carta ${e.carta}</span><b>${escapeHtml(e.quem || "")}</b><span class="ci-chip">${e.escolha ? "falaria: " + escapeHtml(e.escolha) + " " + e.nota : "calaria"}</span></div><div class="ci-log-txt">Por quê: ${escapeHtml(e.porque)} · sistema: ${escapeHtml(e.sistema || "não falou")}</div></div>`,
    )
    .join("");
  sec.appendChild(lista);
  return sec;
}
