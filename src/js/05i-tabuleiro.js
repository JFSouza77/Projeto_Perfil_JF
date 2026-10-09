/* ----------------------------------------------------------------------
 * 5i. TABULEIRO DE VERDADE (1.7.9.2 · Rooms and Network Update · Board Update)
 * A linha com pontinhos virou um tabuleiro desenhado: um caminho com 100 casinhas, numa forma
 * sorteada a cada partida (Oito, Serpente, Espiral, Onda, Circuito, Estrela, Oval, Labirinto e
 * Zigue-zague), em blocos coloridos como os tabuleiros de verdade, com o tema do
 * modo (Clássico, Hardcore, Júnior, Old School). Os peões andam casa por casa.
 *  · É só desenho: a regra continua em pontos/casas (WINNING_SCORE). Cada casinha vale meta/100
 *    (2 no Clássico, 1,5 no Júnior). Os números do tabuleiro são as casas de verdade (20, 40… 200).
 *  · A forma sai no começo da partida, vai no save (tabForma) e no retrato (telão e online): todo
 *    aparelho desenha o mesmo tabuleiro. Não repete a forma da partida anterior neste aparelho.
 *  · 1.7.9.4: na partida volta a linha com pontinhos; o desenho aparece no "toque pra ampliar" e no
 *    lobby entre as cartas (tabLobbyAbrir, mais abaixo).
 *  · Tudo em SVG feito aqui (nada pra baixar). Modo Batata e "menos movimento" tiram a animação.
 * ---------------------------------------------------------------------- */
const TAB_CASAS = 100;
const TAB_FORMAS = {
  oito: { nome: "Oito", ic: "∞" },
  serpente: { nome: "Serpente", ic: "🐍" },
  espiral: { nome: "Espiral", ic: "🌀" },
  onda: { nome: "Onda", ic: "🌊" },
  circuito: { nome: "Circuito", ic: "🏎️" },
  estrela: { nome: "Estrela", ic: "⭐" },
  // 1.7.9.3 (inspiradas nos tabuleiros de verdade): oval em anéis (Perfil 3), labirinto (Perfil 4 e
  // Júnior) e zigue-zague (Perfil 7). O Coração saiu.
  oval: { nome: "Oval", ic: "🥚" },
  labirinto: { nome: "Labirinto", ic: "🧩" },
  zigue: { nome: "Zigue-zague", ic: "⚡" },
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
    // 1.7.9.3: menos voltas, mais espaço entre elas
    const voltas = 2;
    for (let i = 0; i <= N; i++) {
      const u = i / N, a = -Math.PI / 2 + TAU * voltas * u, r = 0.47 - 0.33 * u;
      P.push([0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)]);
    }
  } else if (forma === "oval") {
    // anéis ovais de fora pra dentro (2 voltas), como no Perfil 3
    const voltas = 2;
    for (let i = 0; i <= N; i++) {
      const u = i / N, a = Math.PI * 0.62 + TAU * voltas * u, k = 1 - 0.62 * u;
      P.push([0.5 + 0.47 * k * Math.cos(a), 0.5 + 0.45 * k * Math.sin(a)]);
    }
  } else if (forma === "labirinto") {
    // espiral quadrada de cantos redondos (Perfil 4 e Júnior)
    const v = [[0.06, 0.94], [0.06, 0.06], [0.94, 0.06], [0.94, 0.94], [0.28, 0.94], [0.28, 0.3], [0.72, 0.3], [0.72, 0.7], [0.5, 0.7]];
    P.push(...tabSuavizar(tabLinha(v, 80), 3));
  } else if (forma === "zigue") {
    // fileiras inclinadas indo e voltando (Perfil 7)
    const v = [];
    for (let f = 0; f < 4; f++) {
      const y = 0.06 + f * 0.27, ida = f % 2 === 0;
      const esq = [0.14, y], dir = [0.86, y + 0.07];
      v.push(...(ida ? [esq, dir] : [dir, esq]));
    }
    P.push(...tabSuavizar(tabLinha(v, 90), 4));
  } else if (forma === "onda") {
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      P.push([0.06 + 0.88 * u, 0.5 + 0.38 * Math.sin(u * TAU * 2.25)]);
    }
  } else if (forma === "circuito") {
    // pista de corrida (estádio); a reta de baixo tem o vão entre a saída e a chegada
    const L = 0.3, R = 0.4;
    for (let i = 0; i <= 100; i++) P.push([0.56 + (0.5 + L - 0.56) * (i / 100), 0.5 + R]);
    for (let i = 1; i <= 120; i++) {
      const a = Math.PI / 2 - (Math.PI * i) / 120;
      P.push([0.5 + L + R * 0.5 * Math.cos(a), 0.5 + R * Math.sin(a)]);
    }
    for (let i = 1; i <= 200; i++) P.push([0.5 + L - (2 * L * i) / 200, 0.5 - R]);
    for (let i = 1; i <= 120; i++) {
      const a = -Math.PI / 2 - (Math.PI * i) / 120;
      P.push([0.5 - L + R * 0.5 * Math.cos(a), 0.5 + R * Math.sin(a)]);
    }
    for (let i = 1; i <= 100; i++) P.push([0.5 - L + (L - 0.06) * (i / 100), 0.5 + R]);
  } else {
    // estrela de 5 pontas, começando na ponta de cima
    const v = [];
    for (let k = 0; k <= 10; k++) {
      const a = -Math.PI / 2 + (Math.PI * k) / 5, r = k % 2 === 0 ? 0.48 : 0.27;
      v.push([0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)]);
    }
    v[10] = [v[9][0] + (v[10][0] - v[9][0]) * 0.72, v[9][1] + (v[10][1] - v[9][1]) * 0.72];
    v[0] = [v[0][0] + (v[1][0] - v[0][0]) * 0.12, v[0][1] + (v[1][1] - v[0][1]) * 0.12];
    P.push(...tabSuavizar(tabLinha(v, 60), 2));
  }
  return P;
}
// Linha reta entre os vértices, com n pontos por trecho.
function tabLinha(v, n) {
  const P = [];
  for (let k = 0; k < v.length - 1; k++)
    for (let i = 0; i < n; i++) P.push([v[k][0] + ((v[k + 1][0] - v[k][0]) * i) / n, v[k][1] + ((v[k + 1][1] - v[k][1]) * i) / n]);
  P.push(v[v.length - 1]);
  return P;
}
// Arredonda os cantos (média móvel), mantendo as pontas.
function tabSuavizar(P, vezes) {
  let Q = P;
  for (let t = 0; t < vezes; t++) {
    const R = [Q[0]];
    for (let i = 1; i < Q.length - 1; i++) {
      const a = Math.max(0, i - 12), b = Math.min(Q.length - 1, i + 12);
      let x = 0, y = 0;
      for (let k = a; k <= b; k++) {
        x += Q[k][0];
        y += Q[k][1];
      }
      R.push([x / (b - a + 1), y / (b - a + 1)]);
    }
    R.push(Q[Q.length - 1]);
    Q = R;
  }
  return Q;
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
  // 2 pontos por casinha: os pares são os centros, os ímpares as divisas entre uma casa e a outra
  const pts = [];
  let j = 0;
  for (let k = 0; k <= TAB_CASAS * 2; k++) {
    const alvo = (total * k) / (TAB_CASAS * 2);
    while (j < acum.length - 2 && acum[j + 1] < alvo) j++;
    const seg = acum[j + 1] - acum[j] || 1, u = Math.min(1, Math.max(0, (alvo - acum[j]) / seg));
    const dx = denso[j + 1][0] - denso[j][0], dy = denso[j + 1][1] - denso[j][1], n = Math.hypot(dx, dy) || 1;
    pts.push({ x: denso[j][0] + dx * u, y: denso[j][1] + dy * u, nx: -dy / n, ny: dx / n });
  }
  const casas = pts.filter((_, k) => k % 2 === 0).map((p) => [p.x, p.y]);
  const passo = total / TAB_CASAS;
  // largura da pista: a maior que não encosta na volta vizinha
  let folga = Infinity;
  for (let a = 0; a <= TAB_CASAS; a++)
    for (let b = a + 6; b <= TAB_CASAS; b++) folga = Math.min(folga, Math.hypot(casas[a][0] - casas[b][0], casas[a][1] - casas[b][1]));
  // no Oito a pista cruza ela mesma no meio (é o desenho): a folga não vale, a largura é fixa
  const largura = forma === "oito" ? passo * 1.45 : Math.max(passo * 0.9, Math.min(passo * 1.9, folga * 0.82));
  const d = "M" + denso.filter((_, i) => i % 4 === 0 || i === denso.length - 1).map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L");
  return (tabGeoCache[chave] = { W, H, casas, pts, d, passo, largura });
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
  const w = g.largura, h = w / 2;
  // casas de bônus (a cada BONUS_HOUSE_INTERVAL casas de verdade): "?" como nos tabuleiros de verdade
  const bonus = new Set();
  for (let pos = BONUS_HOUSE_INTERVAL; pos < meta; pos += BONUS_HOUSE_INTERVAL) bonus.add(tabIdx(pos, meta));
  const f = (v) => v.toFixed(2);
  let blocos = "", marcas = "";
  for (let i = 1; i < TAB_CASAS; i++) {
    // bloco entre a divisa de trás e a da frente, na largura da pista
    const a = g.pts[2 * i - 1], b = g.pts[2 * i + 1];
    const poli = [
      [a.x + a.nx * h, a.y + a.ny * h],
      [b.x + b.nx * h, b.y + b.ny * h],
      [b.x - b.nx * h, b.y - b.ny * h],
      [a.x - a.nx * h, a.y - a.ny * h],
    ].map(([x, y]) => f(x) + "," + f(y)).join(" ");
    const bo = bonus.has(i);
    const cor = !bo && tema === "junior" ? ` style="fill:hsl(${Math.round((i * 3.4) % 360)} 88% 60%)"` : "";
    blocos += `<polygon class="tb-bloco${bo ? " tb-bonus" : i % 2 ? " tb-b" : ""}" points="${poli}"${cor}/>`;
    const [x, y] = g.casas[i];
    if (i % 10 === 0) {
      // marco: o número da casa de verdade dentro do próprio bloco (não confunde com a fileira vizinha)
      const n = String(Math.round((i * meta) / TAB_CASAS));
      marcas += `<text class="tb-num tb-num-bloco" x="${f(x)}" y="${f(y)}" style="font-size:${f(Math.max(1.5, Math.min(w * 0.5, (w * 1.15) / n.length)))}px">${n}</text>`;
    } else if (bo) marcas += `<text class="tb-q" x="${f(x)}" y="${f(y)}" style="font-size:${f(w * 0.62)}px">?</text>`;
  }
  const nums = "";
  const [x0, y0] = g.casas[0], [x1, y1] = g.casas[TAB_CASAS];
  const rp = w * 0.95;
  const p0 = g.pts[0], p1 = g.pts[TAB_CASAS * 2];
  // placa de SAÍDA/CHEGADA: testa lugares em volta da bolinha e fica com o mais longe da pista,
  // sempre dentro da borda
  const fs = Math.max(1.8, w * 0.48);
  const rot = (p, txt, r) => {
    const meia = txt.length * fs * 0.36;
    const off = r + fs * 0.9, offN = h + w * 1.25;
    const cand = [
      [p.x + p.nx * offN, p.y + p.ny * offN],
      [p.x - p.nx * offN, p.y - p.ny * offN],
      [p.x, p.y + off],
      [p.x, p.y - off],
      [p.x + r + meia + 0.6, p.y],
      [p.x - r - meia - 0.6, p.y],
    ].map(([x, y]) => [Math.max(meia + 1, Math.min(g.W - meia - 1, x)), Math.max(fs, Math.min(g.H - fs, y))]);
    let melhor = cand[0], nota = -1;
    cand.forEach(([x, y]) => {
      let perto = Infinity;
      // distância até a pista, medindo nos dois lados do texto
      [-meia * 0.8, 0, meia * 0.8].forEach((dx) => g.casas.forEach(([cx, cy]) => (perto = Math.min(perto, Math.hypot(x + dx - cx, y - cy)))));
      if (perto > nota) {
        nota = perto;
        melhor = [x, y];
      }
    });
    return `<text class="tb-rot" x="${f(melhor[0])}" y="${f(melhor[1])}" style="font-size:${f(fs)}px">${txt}</text>`;
  };
  return `<svg class="tb-svg" viewBox="0 0 ${g.W} ${g.H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <path class="tb-trilha-luz" d="${g.d}" style="stroke-width:${f(w + 2.2)}"/><path class="tb-faixa" d="${g.d}" style="stroke-width:${f(w + 0.8)}"/>
    ${blocos}${marcas}${nums}
    <circle class="tb-ponta" cx="${f(x0)}" cy="${f(y0)}" r="${f(rp)}"/><text class="tb-ponta-ic" x="${f(x0)}" y="${f(y0)}" style="font-size:${f(rp * 1.1)}px">${T.largada}</text>${rot(p0, "SAÍDA", rp)}
    <circle class="tb-ponta tb-chegada" cx="${f(x1)}" cy="${f(y1)}" r="${f(rp * 1.15)}"/><text class="tb-ponta-ic" x="${f(x1)}" y="${f(y1)}" style="font-size:${f(rp * 1.25)}px">${T.chegada}</text>${rot(p1, "CHEGADA", rp * 1.15)}
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
      return { k: "t" + id, pos: t.position, idx: tabIdx(t.position, meta), html: info.emoji, style: `background:${info.color}`, titulo: `Equipe ${info.label}: casa ${t.position}` };
    });
  return players.map((p) => {
    const label = escapeHtml(p.avatar || (p.name ? p.name[0].toUpperCase() : "?"));
    const grad = GRADIENTS[p.color];
    return {
      k: "p" + (p.id || p.name),
      pos: p.position,
      idx: tabIdx(p.position, meta),
      html: label,
      cls: (p.color === "GRAD_ONYX" ? "onyx-swatch" : "") + (grad && p.color !== "GRAD_ONYX" ? " grad-anim" : ""),
      style: `background:${grad || (p.color === "RGB" ? "conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)" : p.color)}`,
      titulo: `${p.name}: casa ${p.position}`,
    };
  });
}
// Tabuleiro grande: em pé no celular, deitado no computador. Vai no "toque pra ampliar" e no lobby.
function tabHtmlGrande(id) {
  const forma = tabFormaAtual(), tema = tabTema(CURRENT_MODE);
  const emPe = window.innerWidth < 700;
  return `<div class="tb-caixa tb-grande tb-tema-${tema}${emPe ? " tb-em-pe" : ""}" id="${id || "tabCaixaGrande"}">${tabSvg({ forma, meta: WINNING_SCORE, modo: CURRENT_MODE, emPe })}<div class="tb-pecas"></div></div>
    <div class="tb-legenda tb-legenda-grande">${TAB_FORMAS[forma].ic} Tabuleiro ${TAB_FORMAS[forma].nome} · ${TAB_CASAS} casinhas, cada uma vale ${(WINNING_SCORE / TAB_CASAS).toLocaleString("pt-BR")} casa${WINNING_SCORE / TAB_CASAS === 1 ? "" : "s"}${boardCountsForWin() ? "" : " · não vale vitória"}</div>`;
}
function tabPreencherGrande() {
  const caixa = document.getElementById("tabCaixaGrande");
  if (!caixa) return;
  Object.keys(tabPrevIdx).forEach((k) => k.startsWith("tabCaixaGrande") && delete tabPrevIdx[k]);
  tabPosicionarPecas(caixa, tabFormaAtual(), caixa.classList.contains("tb-em-pe"), tabPecasDaPartida(), false);
}

/* --- 1.7.9.4 · Board Update 3: LOBBY ENTRE AS CARTAS (ideia do JF) ---
 * Na partida volta a linha com pontinhos (renderBoardTrack). O tabuleiro grande vira uma tela de
 * espera: quando uma carta acaba e os pontos/casas já foram contados, ele abre por 1 minuto antes da
 * próxima carta (com "Próxima carta ▶" pra pular). Os peões andam o que andaram na carta, a lista
 * mostra quem está na frente e quanto cada um andou, e a mesa tem tempo de conversar e montar
 * estratégia. No online cada aparelho abre o seu.
 *  · É só tela: a próxima carta já foi sorteada (escondida) por baixo; nada da partida muda aqui,
 *    nada vai no save nem no registro de ações. Desfazer o veredito fecha o lobby.
 *  · Não abre no Express (não tem tabuleiro), no Descartar, nem quando a partida acaba.
 *  · Dá pra desligar no "toque pra ampliar" (vale pra este aparelho). */
const TAB_LOBBY_SEG = 60;
const TAB_LOBBY_KEY = "perfil5_tab_lobby";
let tabLobbyPendente = false; // uma carta acabou (checkWinnerThenDraw): abre quando a próxima estiver pronta
let tabLobbyRelogio = null;
let tabLobbyAntes = null; // casa de cada peça no lobby anterior (pra mostrar quanto andou)
let tabLobbyAntesVelho = null; // o de antes do último lobby (o Desfazer volta pra ele)

function tabLobbyLigado() {
  try {
    return JFStore.getItem(TAB_LOBBY_KEY) !== "0";
  } catch (e) {
    return true;
  }
}
function tabLobbyLigar(on) {
  try {
    JFStore.setItem(TAB_LOBBY_KEY, on ? "1" : "0");
  } catch (e) {}
  if (!on) tabLobbyFechar();
}
function tabLobbyCasas() {
  const o = {};
  tabPecasDaPartida().forEach((p) => (o[p.k] = p.pos));
  return o;
}
// Partida nova: esquece o lobby anterior e as posições desenhadas.
function tabLobbyZerar() {
  tabLobbyPendente = false;
  tabLobbyAntes = tabLobbyAntesVelho = null;
  tabLobbyFechar();
  Object.keys(tabPrevIdx).forEach((k) => delete tabPrevIdx[k]);
}
// Chamado quando a próxima carta ficou pronta (drawHidden) ou na escolha do duelo de bônus.
function tabLobbyTalvez() {
  if (!tabLobbyPendente) return;
  tabLobbyPendente = false;
  if (gameEnded || !starterChosen || CURRENT_MODE === "express" || !players.length || !tabLobbyLigado()) return;
  if (cardState !== "hidden" && cardState !== "bonusChoice") return;
  tabLobbyAbrir();
}
function tabLobbyAbrir() {
  tabLobbyFechar();
  const agora = tabLobbyCasas();
  // primeira carta da partida: todo mundo saiu da casa 0
  const antes = tabLobbyAntes || (stats.totalDrawn <= 2 ? Object.fromEntries(Object.keys(agora).map((k) => [k, 0])) : null);
  tabLobbyAntesVelho = tabLobbyAntes;
  tabLobbyAntes = agora;
  let prox = "";
  if (cardState === "bonusChoice") prox = "🏟️ Casa de bônus! Depois do tabuleiro, escolham o duelo.";
  else {
    const m = players[mestreIndex];
    if (m) prox = `📖 Próximo Mestre: ${playerNameHtml(m.name, m.color, m.avatar)}`;
  }
  if (typeof ultimaRodada !== "undefined" && ultimaRodada) prox += `<div class="tb-lobby-ultima">⏳ Última rodada!</div>`;
  const ov = document.createElement("div");
  ov.id = "tabLobby";
  ov.className = "jf-modal-bg tb-lobby-bg";
  ov.innerHTML = `<div class="jf-modal tb-modal tb-lobby" role="dialog" aria-modal="true" aria-labelledby="tbLobbyTit">
    <div class="tb-lobby-topo"><h3 id="tbLobbyTit">🗺️ Antes da próxima carta</h3><button type="button" class="btn-neo neo-solid neo-still tb-lobby-pular" id="tbLobbyPular" style="--mc:#a78bfa; --mc-glow:rgba(167,139,250,0.35);">Próxima carta ▶</button></div>
    <div class="tb-lobby-tempo" aria-hidden="true"><div class="tb-lobby-barra" id="tbLobbyBarra"></div></div>
    <div class="tb-lobby-sub"><b id="tbLobbySeg">${TAB_LOBBY_SEG}</b> s pra ver o tabuleiro e combinar a estratégia</div>
    <div class="tb-lobby-prox">${prox}</div>
    ${tabHtmlGrande("tabCaixaLobby")}
    <ul class="tg-list">${tabuleiroLinhasHtml(antes)}</ul>
  </div>`;
  document.body.appendChild(ov);
  ov.querySelector("#tbLobbyPular").addEventListener("click", tabLobbyFechar);
  const caixa = ov.querySelector("#tabCaixaLobby");
  // os peões entram um instante depois, pra andança aparecer (sai de onde estavam no lobby anterior)
  setTimeout(() => {
    if (caixa.isConnected) tabPosicionarPecas(caixa, tabFormaAtual(), caixa.classList.contains("tb-em-pe"), tabPecasDaPartida(), tabAnimar());
  }, 280);
  let fim = Date.now() + TAB_LOBBY_SEG * 1000,
    antesTique = Date.now();
  tabLobbyRelogio = setInterval(() => {
    const t = Date.now(),
      passou = t - antesTique;
    antesTique = t;
    if (!ov.isConnected || gameEnded || (cardState !== "hidden" && cardState !== "bonusChoice")) return tabLobbyFechar();
    // aba escondida ou pausa: o relógio do lobby espera junto
    if (document.hidden || (typeof pausaEstaAberta === "function" && pausaEstaAberta())) {
      fim += passou;
      return;
    }
    const resta = Math.max(0, fim - t);
    const seg = ov.querySelector("#tbLobbySeg"),
      barra = ov.querySelector("#tbLobbyBarra");
    if (seg) seg.textContent = String(Math.ceil(resta / 1000));
    if (barra) barra.style.width = ((resta / (TAB_LOBBY_SEG * 1000)) * 100).toFixed(1) + "%";
    if (resta <= 0) tabLobbyFechar();
  }, 250);
}
function tabLobbyFechar() {
  clearInterval(tabLobbyRelogio);
  tabLobbyRelogio = null;
  document.getElementById("tabLobby")?.remove();
}
// Desfazer o veredito: o lobby fecha e a conta de "quanto andou" volta pro lobby de antes.
function tabLobbyDesfeito() {
  tabLobbyPendente = false;
  if (document.getElementById("tabLobby")) tabLobbyAntes = tabLobbyAntesVelho;
  tabLobbyFechar();
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
