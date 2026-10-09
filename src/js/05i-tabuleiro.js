/* ----------------------------------------------------------------------
 * 5i. TABULEIRO DE VERDADE (1.7.9.2 · Rooms and Network Update · Board Update)
 * A linha com pontinhos virou um tabuleiro desenhado: um caminho com 100 casinhas, numa forma
 * sorteada a cada partida (Oito, Serpente, Espiral, Coração, Onda, Circuito, Estrela), com o tema do
 * modo (Clássico, Hardcore, Júnior, Old School). Os peões andam casa por casa.
 *  · É só desenho: a regra continua em pontos/casas (WINNING_SCORE). Cada casinha vale meta/100
 *    (2 no Clássico, 1,5 no Júnior). Os números do tabuleiro são as casas de verdade (20, 40… 200).
 *  · A forma sai no começo da partida, vai no save (tabForma) e no retrato (telão e online): todo
 *    aparelho desenha o mesmo tabuleiro. Não repete a forma da partida anterior neste aparelho.
 *  · Tudo em SVG feito aqui (nada pra baixar). Modo Batata e "menos movimento" tiram a animação.
 * ---------------------------------------------------------------------- */
const TAB_CASAS = 100;
const TAB_FORMAS = {
  oito: { nome: "Oito", ic: "∞" },
  serpente: { nome: "Serpente", ic: "🐍" },
  espiral: { nome: "Espiral", ic: "🌀" },
  coracao: { nome: "Coração", ic: "💜" },
  onda: { nome: "Onda", ic: "🌊" },
  circuito: { nome: "Circuito", ic: "🏎️" },
  estrela: { nome: "Estrela", ic: "⭐" },
};
const TAB_TEMAS = {
  classico: { chegada: "🏁", largada: "🚩" },
  hardcore: { chegada: "💀", largada: "🩸" },
  junior: { chegada: "🏆", largada: "🎈" },
  oldschool: { chegada: "📻", largada: "📼" },
};
const TAB_ULTIMA_KEY = "perfil5_tab_ultima";
let tabForma = null; // forma do tabuleiro desta partida (vai no save)
const tabGeoCache = {};
const tabPrevIdx = {}; // última casinha desenhada de cada peão (pra animar a andança)

function tabTema(modo) {
  return TAB_TEMAS[modo] ? modo : "classico";
}
// Escolhe a forma da partida (não repete a anterior neste aparelho). Visual: Math.random serve.
function tabSortearForma() {
  const nomes = Object.keys(TAB_FORMAS);
  let ultima = null;
  try {
    ultima = JFStore.getItem(TAB_ULTIMA_KEY);
  } catch (e) {}
  const pool = nomes.filter((n) => n !== ultima);
  tabForma = pool[Math.floor(Math.random() * pool.length)];
  try {
    JFStore.setItem(TAB_ULTIMA_KEY, tabForma);
  } catch (e) {}
  return tabForma;
}
function tabFormaAtual() {
  if (!tabForma || !TAB_FORMAS[tabForma]) tabSortearForma();
  return tabForma;
}

/* --- Geometria: cada forma é uma lista densa de pontos no quadrado [0,1]²; depois vira 101 pontos
 * (casa 0 = largada, casa 100 = chegada) igualmente espaçados ao longo do caminho. --- */
function tabFormaPontos(forma) {
  const P = [];
  const N = 1400;
  const TAU = Math.PI * 2;
  if (forma === "oito") {
    // lemniscata de Gerono: o 8 deitado; a abertura fica na ponta da direita
    for (let i = 0; i <= N; i++) {
      const t = 0.16 + (TAU - 0.32) * (i / N);
      P.push([0.5 + 0.46 * Math.cos(t), 0.5 + 0.9 * Math.sin(t) * Math.cos(t)]);
    }
  } else if (forma === "serpente") {
    const faixas = 4, y0 = 0.1, y1 = 0.9, x0 = 0.18, x1 = 0.82;
    const dy = (y1 - y0) / (faixas - 1);
    for (let f = 0; f < faixas; f++) {
      const y = y0 + f * dy, ida = f % 2 === 0;
      for (let i = 0; i <= 200; i++) P.push([ida ? x0 + ((x1 - x0) * i) / 200 : x1 - ((x1 - x0) * i) / 200, y]);
      if (f < faixas - 1) {
        // curva em U pra descer pra próxima faixa
        const cx = ida ? x1 : x0, cy = y + dy / 2, r = dy / 2;
        for (let i = 1; i < 60; i++) {
          const a = -Math.PI / 2 + (Math.PI * i) / 60;
          P.push([cx + (ida ? 1 : -1) * r * Math.cos(a) * 0.9, cy + r * Math.sin(a)]);
        }
      }
    }
  } else if (forma === "espiral") {
    // de fora pra dentro: a chegada é no centro
    const voltas = 2.6;
    for (let i = 0; i <= N; i++) {
      const u = i / N, a = -Math.PI / 2 + TAU * voltas * u, r = 0.47 - 0.38 * u;
      P.push([0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)]);
    }
  } else if (forma === "coracao") {
    for (let i = 0; i <= N; i++) {
      const t = 0.32 + (TAU - 0.64) * (i / N);
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      P.push([0.5 + x / 36, 0.47 + y / 34]);
    }
  } else if (forma === "onda") {
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      P.push([0.06 + 0.88 * u, 0.5 + 0.38 * Math.sin(u * TAU * 2.25)]);
    }
  } else if (forma === "circuito") {
    // pista de corrida (estádio) com uma chicane na reta de baixo
    const L = 0.3, R = 0.28;
    const pts = [];
    for (let i = 0; i <= 100; i++) pts.push([0.5 + (L * i) / 100, 0.5 + R]);
    for (let i = 1; i <= 100; i++) {
      const a = Math.PI / 2 - (Math.PI * i) / 100;
      pts.push([0.5 + L + R * 0.75 * Math.cos(a), 0.5 + R * Math.sin(a)]);
    }
    for (let i = 1; i <= 200; i++) pts.push([0.5 + L - (2 * L * i) / 200, 0.5 - R]);
    for (let i = 1; i <= 100; i++) {
      const a = -Math.PI / 2 - (Math.PI * i) / 100;
      pts.push([0.5 - L + R * 0.75 * Math.cos(a), 0.5 + R * Math.sin(a)]);
    }
    for (let i = 1; i <= 90; i++) {
      const u = i / 100;
      pts.push([0.5 - L + L * u, 0.5 + R - 0.12 * Math.sin(Math.PI * u) * (u < 0.9 ? 1 : 0)]);
    }
    P.push(...pts);
  } else {
    // estrela de 5 pontas, começando na ponta de cima
    const v = [];
    for (let k = 0; k <= 10; k++) {
      const a = -Math.PI / 2 + (Math.PI * k) / 5, r = k % 2 === 0 ? 0.48 : 0.2;
      v.push([0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)]);
    }
    for (let k = 0; k < 10; k++) {
      const fim = k === 9 ? 0.93 : 1;
      for (let i = 0; i < 120; i++) {
        const u = (i / 120) * fim;
        P.push([v[k][0] + (v[k + 1][0] - v[k][0]) * u, v[k][1] + (v[k + 1][1] - v[k][1]) * u]);
      }
    }
  }
  return P;
}
// Caixa: deitada (W×H) pra tela da partida e o telão; em pé pro tabuleiro grande no celular.
function tabGeo(forma, emPe) {
  const chave = forma + (emPe ? "|pe" : "|deitado");
  if (tabGeoCache[chave]) return tabGeoCache[chave];
  const W = emPe ? 60 : 100, H = emPe ? 100 : 56, M = 6;
  const denso = tabFormaPontos(forma).map(([x, y]) => (emPe ? [M + y * (W - 2 * M), M + x * (H - 2 * M)] : [M + x * (W - 2 * M), M + y * (H - 2 * M)]));
  const acum = [0];
  for (let i = 1; i < denso.length; i++) acum.push(acum[i - 1] + Math.hypot(denso[i][0] - denso[i - 1][0], denso[i][1] - denso[i - 1][1]));
  const total = acum[acum.length - 1];
  const casas = [];
  let j = 0;
  for (let k = 0; k <= TAB_CASAS; k++) {
    const alvo = (total * k) / TAB_CASAS;
    while (j < acum.length - 2 && acum[j + 1] < alvo) j++;
    const seg = acum[j + 1] - acum[j] || 1, u = Math.min(1, Math.max(0, (alvo - acum[j]) / seg));
    casas.push([denso[j][0] + (denso[j + 1][0] - denso[j][0]) * u, denso[j][1] + (denso[j + 1][1] - denso[j][1]) * u]);
  }
  const passo = total / TAB_CASAS;
  const d = "M" + denso.filter((_, i) => i % 4 === 0 || i === denso.length - 1).map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L");
  return (tabGeoCache[chave] = { W, H, casas, d, passo });
}
// Casa de verdade (pontos/casas da regra) → casinha desenhada (0..100).
function tabIdx(pos, meta) {
  if (!meta || meta <= 0) return 0;
  return Math.max(0, Math.min(TAB_CASAS, Math.round((pos * TAB_CASAS) / meta)));
}

/* --- Desenho (SVG). Serve pra tela da partida, pro tabuleiro grande e pro telão. --- */
function tabSvg({ forma, meta, modo, emPe }) {
  const g = tabGeo(forma, emPe);
  const tema = tabTema(modo), T = TAB_TEMAS[tema];
  const rc = Math.min(1.45, g.passo * 0.42);
  // casas de bônus (a cada BONUS_HOUSE_INTERVAL casas de verdade)
  const bonus = new Set();
  for (let pos = BONUS_HOUSE_INTERVAL; pos < meta; pos += BONUS_HOUSE_INTERVAL) bonus.add(tabIdx(pos, meta));
  let casas = "";
  g.casas.forEach(([x, y], i) => {
    if (i === 0 || i === TAB_CASAS) return;
    const b = bonus.has(i);
    const cor = tema === "junior" ? ` style="fill:hsl(${(i * 37) % 360} 85% 62%)"` : "";
    casas += `<circle class="tb-casa${b ? " tb-bonus" : ""}${i % 10 === 0 ? " tb-dez" : ""}" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(b ? rc * 1.25 : rc).toFixed(2)}"${b ? "" : cor}/>`;
  });
  // números (casas de verdade) a cada 10 casinhas, pra fora do caminho
  let nums = "";
  for (let i = 10; i < TAB_CASAS; i += 10) {
    const [x, y] = g.casas[i], [xa, ya] = g.casas[i - 1], [xb, yb] = g.casas[i + 1];
    let nx = -(yb - ya), ny = xb - xa;
    const n = Math.hypot(nx, ny) || 1;
    nx /= n;
    ny /= n;
    const off = rc * 2.6;
    nums += `<text class="tb-num" x="${(x + nx * off).toFixed(2)}" y="${(y + ny * off).toFixed(2)}">${Math.round((i * meta) / TAB_CASAS)}</text>`;
  }
  const [x0, y0] = g.casas[0], [x1, y1] = g.casas[TAB_CASAS];
  return `<svg class="tb-svg" viewBox="0 0 ${g.W} ${g.H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <path class="tb-trilha-luz" d="${g.d}"/><path class="tb-trilha" d="${g.d}"/>
    ${casas}${nums}
    <circle class="tb-ponta" cx="${x0.toFixed(2)}" cy="${y0.toFixed(2)}" r="${(rc * 2.1).toFixed(2)}"/><text class="tb-ponta-ic" x="${x0.toFixed(2)}" y="${y0.toFixed(2)}">${T.largada}</text>
    <circle class="tb-ponta tb-chegada" cx="${x1.toFixed(2)}" cy="${y1.toFixed(2)}" r="${(rc * 2.4).toFixed(2)}"/><text class="tb-ponta-ic" x="${x1.toFixed(2)}" y="${y1.toFixed(2)}">${T.chegada}</text>
  </svg>`;
}
// Peões por cima do desenho (HTML, pra usar as cores, degradês e avatares de sempre).
// pecas: [{ k, idx, html, cls, style, titulo }]
function tabPosicionarPecas(caixa, forma, emPe, pecas, animar) {
  const g = tabGeo(forma, emPe);
  const camada = caixa.querySelector(".tb-pecas");
  if (!camada) return;
  const porCasa = {};
  pecas.forEach((p) => (porCasa[p.idx] = (porCasa[p.idx] || []).concat(p.k)));
  const vivos = new Set();
  const pct = ([x, y]) => [(x / g.W) * 100, (y / g.H) * 100];
  pecas.forEach((p) => {
    vivos.add(p.k);
    let el = camada.querySelector(`[data-k="${CSS.escape(p.k)}"]`);
    if (!el) {
      el = document.createElement("div");
      el.dataset.k = p.k;
      camada.appendChild(el);
    }
    el.className = "board-token tb-peao" + (p.cls ? " " + p.cls : "");
    el.setAttribute("style", p.style || "");
    el.title = p.titulo || "";
    el.innerHTML = p.html;
    // vários na mesma casinha: um do lado do outro
    const mesmos = porCasa[p.idx], n = mesmos.length, ord = mesmos.indexOf(p.k);
    const desloc = (i) => {
      if (n < 2) return [0, 0];
      const a = (Math.PI * 2 * i) / n, r = g.passo * 0.9;
      return [Math.cos(a) * r, Math.sin(a) * r];
    };
    const ponto = (i, comDesloc) => {
      const [x, y] = g.casas[i], [dx, dy] = comDesloc ? desloc(ord) : [0, 0];
      return pct([x + dx, y + dy]);
    };
    const [lx, ly] = ponto(p.idx, true);
    const ant = tabPrevIdx[caixa.id + p.k];
    tabPrevIdx[caixa.id + p.k] = p.idx;
    el.style.left = lx.toFixed(2) + "%";
    el.style.top = ly.toFixed(2) + "%";
    if (animar && ant !== undefined && ant !== p.idx && typeof el.animate === "function") {
      // anda casa por casa (no máximo 14 paradas no caminho), de 0,4 s a 1,6 s
      const passos = Math.abs(p.idx - ant), dir = p.idx > ant ? 1 : -1, paradas = Math.min(passos, 14);
      const quadros = [];
      for (let s = 0; s <= paradas; s++) {
        const i = ant + dir * Math.round((passos * s) / paradas);
        const [qx, qy] = ponto(i, s === paradas);
        quadros.push({ left: qx.toFixed(2) + "%", top: qy.toFixed(2) + "%", offset: paradas ? s / paradas : 1 });
      }
      try {
        el.animate(quadros, { duration: Math.max(400, Math.min(1600, passos * 110)), easing: "ease-in-out" });
      } catch (e) {}
    }
  });
  camada.querySelectorAll("[data-k]").forEach((el) => {
    if (!vivos.has(el.dataset.k)) el.remove();
  });
}
function tabAnimar() {
  try {
    if (document.body.classList.contains("batata-mode")) return false;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  } catch (e) {}
  return true;
}
// Peças da partida que está nesta tela.
function tabPecasDaPartida() {
  const meta = WINNING_SCORE;
  if (CURRENT_FORMAT === "equipe")
    return teamOrder.map((id) => {
      const t = teams[id], info = TEAM_INFO[id];
      return { k: "t" + id, idx: tabIdx(t.position, meta), html: info.emoji, style: `background:${info.color}`, titulo: `Equipe ${info.label}: casa ${t.position}` };
    });
  return players.map((p) => {
    const label = escapeHtml(p.avatar || (p.name ? p.name[0].toUpperCase() : "?"));
    const grad = GRADIENTS[p.color];
    return {
      k: "p" + (p.id || p.name),
      idx: tabIdx(p.position, meta),
      html: label,
      cls: (p.color === "GRAD_ONYX" ? "onyx-swatch" : "") + (grad && p.color !== "GRAD_ONYX" ? " grad-anim" : ""),
      style: `background:${grad || (p.color === "RGB" ? "conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)" : p.color)}`,
      titulo: `${p.name}: casa ${p.position}`,
    };
  });
}
// Tela da partida (substitui a linha com pontinhos). Desenha uma vez por forma/tema/meta; depois
// só mexe nos peões.
function tabRenderTrilha(track) {
  const forma = tabFormaAtual(), meta = WINNING_SCORE, tema = tabTema(CURRENT_MODE);
  const chave = [forma, meta, tema].join("|");
  if (track.dataset.tab !== chave) {
    track.dataset.tab = chave;
    track.innerHTML = `<div class="tb-caixa tb-tema-${tema}" id="tabCaixaMini">${tabSvg({ forma, meta, modo: CURRENT_MODE, emPe: false })}<div class="tb-pecas"></div></div>
      <div class="tb-legenda"><span>${TAB_FORMAS[forma].ic} Tabuleiro ${TAB_FORMAS[forma].nome}</span><span class="board-hint">🔍 toque pra ampliar</span><span>${boardCountsForWin() ? "Chegada: casa " + meta : "não vale vitória"}</span></div>`;
  }
  tabPosicionarPecas(track.querySelector(".tb-caixa"), forma, false, tabPecasDaPartida(), tabAnimar());
}
// Tabuleiro grande (janela do "toque pra ampliar"): em pé no celular, deitado no computador.
function tabHtmlGrande() {
  const forma = tabFormaAtual(), tema = tabTema(CURRENT_MODE);
  const emPe = window.innerWidth < 700;
  return `<div class="tb-caixa tb-grande tb-tema-${tema}${emPe ? " tb-em-pe" : ""}" id="tabCaixaGrande">${tabSvg({ forma, meta: WINNING_SCORE, modo: CURRENT_MODE, emPe })}<div class="tb-pecas"></div></div>
    <div class="tb-legenda tb-legenda-grande">${TAB_FORMAS[forma].ic} Tabuleiro ${TAB_FORMAS[forma].nome} · ${TAB_CASAS} casinhas, cada uma vale ${(WINNING_SCORE / TAB_CASAS).toLocaleString("pt-BR")} casa${WINNING_SCORE / TAB_CASAS === 1 ? "" : "s"}</div>`;
}
function tabPreencherGrande() {
  const caixa = document.getElementById("tabCaixaGrande");
  if (!caixa) return;
  Object.keys(tabPrevIdx).forEach((k) => k.startsWith("tabCaixaGrande") && delete tabPrevIdx[k]);
  tabPosicionarPecas(caixa, tabFormaAtual(), caixa.classList.contains("tb-em-pe"), tabPecasDaPartida(), false);
}
// Telão: o mesmo desenho, a partir do retrato público.
function tabHtmlTelao(r) {
  if (!r || r.modo === "express" || !r.meta || !r.meta.casa) return "";
  const forma = TAB_FORMAS[r.tabuleiro] ? r.tabuleiro : "oito", tema = tabTema(r.modo);
  return `<section class="telao-tabuleiro"><div class="tb-caixa tb-tema-${tema}" id="tabCaixaTelao">${tabSvg({ forma, meta: r.meta.casa, modo: r.modo, emPe: false })}<div class="tb-pecas"></div></div></section>`;
}
function tabPecasTelao(r) {
  const caixa = document.getElementById("tabCaixaTelao");
  if (!caixa || !r) return;
  const forma = TAB_FORMAS[r.tabuleiro] ? r.tabuleiro : "oito";
  const pecas = (r.equipes && r.equipes.length ? r.equipes.map((e) => ({ k: "t" + e.id, idx: tabIdx(e.casa, r.meta.casa), html: (TEAM_INFO[e.id] || {}).emoji || "●", style: `background:${(TEAM_INFO[e.id] || {}).color || "#888"}` })) : r.jogadores.map((j) => ({ k: "p" + j.id, idx: tabIdx(j.casa, r.meta.casa), html: escapeHtml(j.avatar || (j.nome || "?")[0]), style: `background:${corDoJogador(j.cor)}` })));
  tabPosicionarPecas(caixa, forma, false, pecas, tabAnimar());
}
