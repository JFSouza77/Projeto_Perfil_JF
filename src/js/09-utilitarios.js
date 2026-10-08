/* ======================================================================
 * 9. UTILITÁRIOS (TEXTO, CORES, SORTEIO, NÚMEROS)
 * ====================================================================== */

function nameKeyPlain(n) {
  return String(n || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
function isLightHexColor(hex) {
  if (!hex || hex[0] !== "#" || hex.length !== 7) return false;
  const r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}
function isSafeColor(c) {
  return c === "RGB" || !!GRADIENTS[c] || /^#[0-9a-fA-F]{3,8}$/.test(String(c));
}
// Embaralha dando a cada categoria de joia a mesma chance de sair, seja qual for o
// tamanho dela no baralho (sem isso PESSOA saía em ~35% das cartas e ANO em ~19%).
// Com `alvo`, a chance de cada categoria segue as proporções pedidas.
// devolve uma carta num ponto qualquer do baralho sem reembaralhar tudo (preserva o equilíbrio de categorias)
function devolverAoBaralho(card) {
  deck.splice(sorteioIndice(deck.length + 1), 0, card);
}
function embaralharEquilibrado(cards, alvo) {
  const n = {};
  cards.forEach((c) => {
    const g = gemCategoryFor(c.category);
    n[g] = (n[g] || 0) + 1;
  });
  const cats = Object.keys(n);
  const peso = {};
  cats.forEach((g) => {
    peso[g] = (alvo ? alvo[g] || 0.0001 : 1 / cats.length) / n[g];
  });
  return cards
    .map((c) => ({ c, key: -Math.log(1 - sorteioRegra()) / peso[gemCategoryFor(c.category)] }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.c);
}
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = sorteioIndice(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function formatLabelUppercase(label) {
  const parts = label.split(" ");
  const noun = parts.pop();
  return [...parts, `<span class="uppercase-label">${noun}</span>`].join(" ");
}
function ciNum(v, d) {
  return (typeof v === "number" && isFinite(v) ? v : d).toFixed(1);
}
function ciDec(v) {
  return (Math.round(v * 10) / 10).toFixed(1).replace(".", ",");
}
function ciPearson(xs, ys) {
  const n = xs.length;
  if (n < 4) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n,
    my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0,
    sxx = 0,
    syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx,
      dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}
const caosHexRgb = (h) => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h || "");
  return m ? `rgb(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)})` : null;
};
const caosNumBR = (v) =>
  typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".", ",")) : String(v);
function caosChuteNorm(t) {
  return String(t || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function caosLev(a, b) {
  const m = a.length,
    n = b.length;
  if (!m) return n;
  if (!n) return m;
  let p = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const c = [i];
    for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    p = c;
  }
  return p[n];
}
function jfSafeAvatar(a) {
  return JF_ALL_AVATARS.has(a) ? a : "";
}

