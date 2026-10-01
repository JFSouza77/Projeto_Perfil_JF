#!/usr/bin/env node
// Simulação de equilíbrio do Perfil JF (ferramenta; NÃO faz parte do jogo).
// Reproduz as regras do modo Clássico (Versus) com o baralho real do mestre e compara
// os três modos da Moda da Casa: Tabuleiro, Pontos e Joias.
//
//   node sim.js                    10 mil partidas por modo e por nº de jogadores (2 a 6)
//   node sim.js --partidas 2000    outra quantidade
//   node sim.js --historico arq.json   calibra a chance de acerto com partidas exportadas
//   node sim.js --meta 200,250,300,350,400 --trava 2 --joias 4 --limite 5   testar outros números
//
// Regras reproduzidas (iguais ao jogo):
//   - carta de 20 entradas (dicas + especiais reais do baralho); quem responde escolhe um número;
//   - dica: a pessoa chuta; acerto = 20 − entradas abertas (pontos E casas); o mestre ganha as entradas abertas;
//   - erro, ou especial (Avance/Volte/Escolha/Perca/Palpite): a vez passa ao próximo (pulando o mestre);
//   - carta esgotada (20 abertas): o mestre leva 20;
//   - casa de bônus (cair exatamente num múltiplo de 10, 3+ jogadores): carta-duelo valendo o dobro;
//   - joia: acertar com até 5 dicas reais dá a joia da categoria (ANIMAL conta como COISA), 1 por categoria;
//   - trava: no máximo 2 joias por jogador por rodada (rodada = o 1º mestre voltar a ser mestre);
//   - mestre gira a cada carta; baralho do Clássico tem limite de 400 cartas (aí vence quem está na frente).
// Aproximações (ditas no relatório): a chance de acerto é um modelo (perfil × nº de dicas reais vistas);
// o palpite a qualquer hora não é simulado.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const acorn = require("acorn");

// ---------------------------------------------------------------- parâmetros
const arg = (n, d) => {
  const i = process.argv.indexOf("--" + n);
  return i > 0 ? process.argv[i + 1] : d;
};
const PARTIDAS = +arg("partidas", 10000);
const META = Object.fromEntries(
  arg("meta", "200,250,300,350,400")
    .split(",")
    .map((v, i) => [i + 2, +v]),
);
const TRAVA = +arg("trava", 2);
const JOIAS = +arg("joias", 4);
const LIMITE_DICAS_JOIA = +arg("limite", 5);
const TABULEIRO = +arg("tabuleiro", 200);
const LIMITE_CARTAS = 400;
// Última rodada (como no jogo 1.7.1.3+): bateu a meta, a rodada termina; --sem-ultima desliga.
const ULTIMA = !process.argv.includes("--sem-ultima");
const BONUS = 10;
// Perfis: chance de acerto por chute = perfil × curva(dicas reais já vistas)
const PERFIS = { fraco: 0.65, medio: 1.0, forte: 1.4 };
let CURVA = (k) => Math.min(0.9, 0.06 + 0.035 * k); // k = dicas reais vistas (1, 2, ...)

// ---------------------------------------------------------------- baralho real
function carregarBaralho() {
  const mestre = fs
    .readdirSync(__dirname)
    .filter((f) => /^Perfil_JF_Mestre_.*\.html$/.test(f))
    .sort()
    .pop();
  const html = fs.readFileSync(path.join(__dirname, mestre), "utf8");
  const js = /<script>([\s\S]*?)<\/script>/.exec(html)[1];
  const ast = acorn.parse(js, { ecmaVersion: "latest" });
  for (const n of ast.body)
    if (n.type === "VariableDeclaration" && n.declarations[0].id.name === "ADULT_CARDS") {
      const a = n.declarations[0].init.arguments[0];
      const cartas = vm.runInNewContext("(" + js.slice(a.start, a.end) + ")");
      // baralho do Clássico (próprias + mistura), como no jogo: adulto/livre + oldschool + junior
      return { mestre, cartas };
    }
  throw new Error("ADULT_CARDS não encontrado");
}
const { mestre: MESTRE, cartas: CARTAS } = carregarBaralho();
const especial = (t) => {
  t = t.toLowerCase();
  if (t.startsWith("avance 1")) return { tipo: "move", v: 1 };
  if (t.startsWith("avance 2")) return { tipo: "move", v: 2 };
  if (t.startsWith("volte 2")) return { tipo: "move", v: -2 };
  if (t.startsWith("volte 3")) return { tipo: "move", v: -3 };
  if (t.includes("escolha um jogador para avançar")) return { tipo: "escolha", v: 2 };
  if (t.includes("escolha um jogador para voltar")) return { tipo: "escolha", v: -2 };
  return { tipo: "passa" }; // Perca sua vez, Palpite a qualquer hora
};
const BARALHO = CARTAS.map((c) => ({
  cat: c.cat === "ANIMAL" ? "COISA" : c.cat,
  q: c.q.map((t) => (t[0] === "*" ? especial(t.slice(1)) : null)),
}));

// ---------------------------------------------------------------- calibração (opcional)
const hist = arg("historico", null);
if (hist) {
  // usa "cluesUsed" das partidas exportadas para ajustar a curva média
  const dados = JSON.parse(fs.readFileSync(hist, "utf8"));
  const lista = (Array.isArray(dados) ? dados : [dados]).flatMap((d) => d.history || d.historico || []);
  const usados = lista.map((h) => h.cluesUsed).filter((x) => x > 0);
  if (usados.length) {
    const media = usados.reduce((s, x) => s + x, 0) / usados.length;
    // ajuste simples: escala a curva para que a média simulada de dicas no acerto fique perto da real
    const escala = 5.5 / media;
    const base = CURVA;
    CURVA = (k) => Math.min(0.9, base(k) * escala);
    console.log(`Calibrado com ${usados.length} acertos reais (média de ${media.toFixed(1)} dicas).`);
  }
}

// ---------------------------------------------------------------- RNG
let seed = 12345;
const rnd = () => {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return (seed >>> 0) / 4294967296;
};
const embaralhar = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------------------------------------------------------------- uma partida
// modo: "tabuleiro" | "pontos" | "joias"; perfis: array com o perfil de cada assento
function partida(modo, perfis, comTrava = true) {
  const n = perfis.length;
  const J = perfis.map((p) => ({ s: PERFIS[p], score: 0, pos: 0, gems: {}, total: 0 }));
  const meta = META[n];
  const deck = embaralhar(BARALHO.slice()).slice(0, LIMITE_CARTAS);
  let mestre = 0; // assento 0 é o primeiro mestre
  let rodada = 1,
    joiasRodada = {},
    bloqueios = 0,
    bonusFila = [],
    primeiroMeta = -1;
  const venceu = () => {
    if (modo === "tabuleiro") return J.findIndex((j) => j.pos >= TABULEIRO);
    if (modo === "pontos") return J.findIndex((j) => j.score >= meta);
    return J.findIndex((j) => j.total >= JOIAS);
  };
  const credita = (i, pts, bonus) => {
    const j = J[i],
      antes = j.pos;
    j.score += pts;
    j.pos += pts;
    if (bonus && j.pos > antes && j.pos % BONUS === 0 && j.pos < TABULEIRO && n >= 3) bonusFila.push(i);
  };
  const lider = (excl) => {
    let m = -1;
    J.forEach((j, i) => {
      if (i === excl) return;
      const v = modo === "pontos" ? j.score : modo === "joias" ? j.total : j.pos;
      if (m < 0 || v > (modo === "pontos" ? J[m].score : modo === "joias" ? J[m].total : J[m].pos)) m = i;
    });
    return m;
  };
  for (let c = 0; c < deck.length; c++) {
    const carta = deck[c];
    // carta de bônus (duelo) antes da carta normal, se alguém caiu numa casa de bônus
    let duelo = null;
    if (bonusFila.length) {
      const lander = bonusFila.shift();
      const opp = lider(lander);
      duelo = { a: lander, b: opp, mult: 2 };
    }
    const ordem = embaralhar([...Array(20).keys()]);
    let aberta = 0,
      reais = 0,
      resp = duelo ? duelo.a : (mestre + 1) % n;
    // como no jogo: o duelo é lido pelo mestre da vez (ou pelo próximo, se o mestre estiver duelando)
    let mestreCarta = mestre;
    if (duelo && (mestre === duelo.a || mestre === duelo.b)) {
      mestreCarta = undefined;
      for (let k = 1; k < n; k++) {
        const c2 = (mestre + k) % n;
        if (c2 !== duelo.a && c2 !== duelo.b) {
          mestreCarta = c2;
          break;
        }
      }
    }
    const mult = duelo ? 2 : 1;
    const proximo = (r) => {
      if (duelo) return r === duelo.a ? duelo.b : duelo.a;
      let x = (r + 1) % n;
      if (x === mestre) x = (x + 1) % n;
      return x;
    };
    let acertou = false;
    while (aberta < 20) {
      const e = carta.q[ordem[aberta]];
      aberta++;
      if (e === null) {
        reais++;
        const p = Math.min(0.95, J[resp].s * CURVA(reais));
        if (rnd() < p) {
          credita(resp, (20 - aberta) * mult, true);
          if (mestreCarta !== undefined) credita(mestreCarta, aberta * mult, false);
          // joia
          if (modo === "joias" && !duelo && reais <= LIMITE_DICAS_JOIA && !J[resp].gems[carta.cat]) {
            if (comTrava && (joiasRodada[resp] || 0) >= TRAVA) bloqueios++;
            else {
              J[resp].gems[carta.cat] = 1;
              J[resp].total++;
              joiasRodada[resp] = (joiasRodada[resp] || 0) + 1;
            }
          }
          acertou = true;
          break;
        }
        resp = proximo(resp);
      } else {
        if (e.tipo === "move") J[resp].pos = Math.max(0, Math.min(TABULEIRO, J[resp].pos + e.v));
        else if (e.tipo === "escolha") {
          // "voltar" vai para quem está na frente; "avançar" para quem está mais atrás (nunca quem pediu)
          const t = e.v < 0 ? lider(resp) : J.reduce((m, j, i) => (i !== resp && (m < 0 || j.pos < J[m].pos) ? i : m), -1);
          J[t].pos = Math.max(0, Math.min(TABULEIRO, J[t].pos + e.v));
        }
        resp = proximo(resp);
      }
      if (!ULTIMA && venceu() >= 0) break;
    }
    if (!acertou && aberta >= 20 && mestreCarta !== undefined) credita(mestreCarta, 20 * mult, false);
    const w = venceu();
    if (!ULTIMA && w >= 0) return { vencedor: w, cartas: c + 1, rodadas: (c + 1) / n, bloqueios, travou: false };
    if (ULTIMA && w >= 0 && primeiroMeta < 0) primeiroMeta = w;
    {
      // o duelo gasta a vez do mestre, como no jogo (a carta normal dele não acontece)
      mestre = (mestre + 1) % n;
      if (mestre === 0 && primeiroMeta >= 0) {
        // fim da última rodada: vence quem está na frente; empate = quem bateu a meta primeiro
        const v = (j) => (modo === "pontos" ? j.score : modo === "joias" ? j.total : j.pos);
        const max = Math.max(...J.map(v));
        const top = J.map((j, i) => (v(j) === max ? i : -1)).filter((i) => i >= 0);
        const venc = top.length === 1 ? top[0] : top.includes(primeiroMeta) ? primeiroMeta : -1;
        return { vencedor: venc, cartas: c + 1, rodadas: (c + 1) / n, bloqueios, travou: false };
      }
      if (mestre === 0) {
        rodada++;
        joiasRodada = {};
      }
    }
  }
  // baralho acabou: vence quem está na frente (empate = empate)
  const val = (j) => (modo === "pontos" ? j.score : modo === "joias" ? j.total : j.pos);
  const max = Math.max(...J.map(val));
  const lideres = J.map((j, i) => (val(j) === max ? i : -1)).filter((i) => i >= 0);
  return { vencedor: lideres.length === 1 ? lideres[0] : -1, cartas: deck.length, rodadas: deck.length / n, bloqueios, travou: true };
}

// ---------------------------------------------------------------- estatística
const mediana = (a) => {
  const s = a.slice().sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const pct = (x) => (100 * x).toFixed(1) + "%";
const MODOS = ["tabuleiro", "pontos", "joias"];

function rodar() {
  const linhas = [];
  const out = { duracao: {}, assento: {}, forte: {}, trava: {}, empates: {} };
  for (let n = 2; n <= 6; n++) {
    for (const modo of MODOS) {
      // mesa só de médios: duração, vantagem de assento, empates
      seed = 1000 + n * 7 + MODOS.indexOf(modo);
      const rods = [],
        venc = Array(n).fill(0);
      let empates = 0,
        travou = 0;
      for (let k = 0; k < PARTIDAS; k++) {
        const r = partida(modo, Array(n).fill("medio"));
        rods.push(r.rodadas);
        if (r.vencedor < 0) empates++;
        else venc[r.vencedor]++;
        if (r.travou) travou++;
      }
      out.duracao[n + modo] = { media: rods.reduce((s, x) => s + x, 0) / rods.length, mediana: mediana(rods) };
      out.assento[n + modo] = venc.map((v) => v / PARTIDAS);
      out.empates[n + modo] = { empates: empates / PARTIDAS, travou: travou / PARTIDAS };
      // forte x fraco: assento 0 forte, 1 fraco, resto médio (e o inverso, para tirar o efeito do assento)
      seed = 5000 + n * 7 + MODOS.indexOf(modo);
      let vf = 0,
        vw = 0;
      for (let k = 0; k < PARTIDAS; k++) {
        const pf = Array(n).fill("medio");
        const iF = k % n,
          iW = (k + 1) % n;
        pf[iF] = "forte";
        pf[iW] = "fraco";
        const r = partida(modo, pf);
        if (r.vencedor === iF) vf++;
        if (r.vencedor === iW) vw++;
      }
      out.forte[n + modo] = { forte: vf / PARTIDAS, fraco: vw / PARTIDAS };
      // trava decisiva (só Joias): mesma partida (mesma semente) com e sem trava; decisiva = muda o vencedor
      if (modo === "joias") {
        let dec = 0,
          bloq = 0;
        for (let k = 0; k < PARTIDAS; k++) {
          const sd = 900000 + k * 31 + n;
          seed = sd;
          const a = partida(modo, Array(n).fill("medio"), true);
          seed = sd;
          const b = partida(modo, Array(n).fill("medio"), false);
          if (a.bloqueios > 0) bloq++;
          if (a.vencedor !== b.vencedor) dec++;
        }
        out.trava[n] = { comBloqueio: bloq / PARTIDAS, decisiva: dec / PARTIDAS };
      }
    }
  }
  return out;
}

// --buscar-meta: acha, para cada nº de jogadores, a meta de pontos cuja duração média
// fica igual à do Tabuleiro (busca binária, 3000 partidas por teste).
if (process.argv.includes("--buscar-meta")) {
  const media = (modo, n, meta) => {
    if (meta) META[n] = meta;
    seed = 777 + n;
    let s = 0;
    for (let k = 0; k < 3000; k++) s += partida(modo, Array(n).fill("medio")).rodadas;
    return s / 3000;
  };
  const res = [];
  for (let n = 2; n <= 6; n++) {
    const alvo = media("tabuleiro", n);
    let lo = 80,
      hi = 500;
    for (let it = 0; it < 12; it++) {
      const mid = (lo + hi) / 2;
      if (media("pontos", n, mid) < alvo) lo = mid;
      else hi = mid;
    }
    const meta = Math.round((lo + hi) / 2 / 5) * 5;
    res.push(meta);
    console.log(`${n} jogadores: tabuleiro ${alvo.toFixed(2)} rodadas → meta de pontos ${meta} (dá ${media("pontos", n, meta).toFixed(2)})`);
  }
  console.log("Sugestão: --meta " + res.join(","));
  process.exit(0);
}
const t0 = Date.now();
const R = rodar();
const L = [];
L.push(`# Simulação de equilíbrio — Moda da Casa`);
L.push("");
L.push(`Baralho: ${BARALHO.length} cartas reais de ${MESTRE}. ${PARTIDAS} partidas por modo e por nº de jogadores.`);
L.push(`Números testados: tabuleiro ${TABULEIRO} casas · metas de pontos ${Object.values(META).join("/")} · ${JOIAS} joias · trava ${TRAVA} por rodada · joia com até ${LIMITE_DICAS_JOIA} dicas reais.`);
L.push("");
L.push("## Duração em rodadas (média / mediana)");
L.push("");
L.push("| Jogadores | Tabuleiro | Pontos | Joias | Maior diferença |");
L.push("|---|---|---|---|---|");
for (let n = 2; n <= 6; n++) {
  const d = MODOS.map((m) => R.duracao[n + m]);
  const med = d.map((x) => x.media);
  const dif = (Math.max(...med) / Math.min(...med) - 1) * 100;
  L.push(`| ${n} | ${d.map((x) => x.media.toFixed(1) + " / " + x.mediana.toFixed(1)).join(" | ")} | ${dif.toFixed(0)}% ${dif <= 15 ? "✅" : "⚠️"} |`);
}
L.push("");
L.push("## Vantagem por posição (mesa só de jogadores médios)");
L.push("");
L.push("Assento 1 = primeiro mestre; assento 2 = primeiro a responder. O justo seria 1/n para cada.");
L.push("");
L.push("| Jogadores | Modo | Vitórias por assento | Justo |");
L.push("|---|---|---|---|");
for (let n = 2; n <= 6; n++) for (const m of MODOS) L.push(`| ${n} | ${m} | ${R.assento[n + m].map(pct).join(" · ")} | ${pct(1 / n)} |`);
L.push("");
L.push("## Forte x fraco (um forte, um fraco, o resto médio; assentos alternados)");
L.push("");
L.push("| Jogadores | Modo | Forte vence | Fraco vence | Justo (1/n) |");
L.push("|---|---|---|---|---|");
for (let n = 2; n <= 6; n++) for (const m of MODOS) L.push(`| ${n} | ${m} | ${pct(R.forte[n + m].forte)} | ${pct(R.forte[n + m].fraco)} | ${pct(1 / n)} |`);
L.push("");
L.push("## Trava de joias (modo Joias)");
L.push("");
L.push("| Jogadores | Partidas em que a trava bloqueou alguma joia | Trava decidiu o vencedor |");
L.push("|---|---|---|");
for (let n = 2; n <= 6; n++) L.push(`| ${n} | ${pct(R.trava[n].comBloqueio)} | ${pct(R.trava[n].decisiva)} |`);
L.push("");
L.push("## Empates e partidas que não terminam (baralho de 400 cartas acaba)");
L.push("");
L.push("| Jogadores | Modo | Empate | Acabou o baralho |");
L.push("|---|---|---|---|");
for (let n = 2; n <= 6; n++) for (const m of MODOS) L.push(`| ${n} | ${m} | ${pct(R.empates[n + m].empates)} | ${pct(R.empates[n + m].travou)} |`);
L.push("");
L.push(`_Tempo de simulação: ${((Date.now() - t0) / 1000).toFixed(0)} s._`);
const txt = L.join("\n");
const saida = arg("saida", null);
if (saida) fs.writeFileSync(saida, txt);
console.log(txt);
