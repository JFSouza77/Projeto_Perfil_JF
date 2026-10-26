#!/usr/bin/env node
// Teste do cérebro do C.A.O.S. em modo sombra (C.A.O.S. 5.1 · docs/Roteiro_Cerebro_Sombra_2026-10-25.md).
// Cinco conferências:
//   1. inventário: todo banco citado nos pontos de fala existe e o documento está em dia;
//   2. igualdade: com o mesmo sorteio, as falas (texto e emoção) saem iguais com o registro único
//      desligado, ligado, e com o cérebro em sombra ligado (o cérebro não muda nenhuma fala);
//   3. invariância: partida jogada com o cérebro desligado e repetida com ele ligado chega ao mesmo estado;
//   4. sombra: em 300 cartas ele falaria entre 40% e 60% das jogadas, com 5 tipos ou mais por partida;
//   5. limites: orçamento por carta, Absurdo sempre, Júnior sem zoeira, zero sorteio e jogo intocado.
//   node ferramentas/teste_cerebro.js [mestre.html]
"use strict";
const path = require("path");
const { execFileSync } = require("child_process");
const { acharMestre, abrirNavegador } = require("./_navegador");
const ARQ = acharMestre(process.argv[2]);
const res = [];
const ok = (nome, passou, diag) => res.push({ nome, passou: !!passou, diag });
const rodar = (args) => {
  try {
    return execFileSync("node", args, { cwd: path.join(__dirname, ".."), encoding: "utf8", timeout: 900e3 });
  } catch (e) {
    return String(e.stdout || "") + String(e.stderr || "");
  }
};

// sorteio fixo e relógio virtual: o mesmo roteiro dá sempre o mesmo resultado
function preparo() {
  try {
    localStorage.setItem("perfil_jf_caos_guia", "0"); // 1.8: o guia da mesa tem relógio próprio (o roteiro aqui adianta o tempo)
  } catch (e) {}
  let a = 20261025;
  window.__rng = 0;
  Math.random = function () {
    window.__rng++;
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let T = 1761400000000;
  Date.now = () => T;
  window.__avanca = (ms) => (T += ms);
  if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
}
// roteiro de falas: as mesmas jogadas e os mesmos bancos, em ordem fixa
function roteiro(modo) {
  if (modo === "semRegistro") {
    window.caosEmit = () => null;
    window.caosCortou = () => {};
  }
  caosCerebro.on = modo === "cerebro";
  document.querySelectorAll(".caos-modal-ov, #novidadesModal").forEach((o) => o.remove());
  CURRENT_MODE = "classico";
  CURRENT_FORMAT = "versus";
  gameEnded = false;
  starterChosen = true;
  caosSilenced = false;
  stats.totalDrawn = 6;
  players = ["Ana", "Beto", "Caio"].map((n, i) => ({ id: "j" + i, name: n, score: 0, position: 0, humor: "normal", avatar: "😀" }));
  const bancos = [];
  (function andar(o, p) {
    if (Array.isArray(o)) {
      if (o.length >= 10 && o.every((x) => typeof x === "string")) bancos.push(o);
      return;
    }
    if (o && typeof o === "object") Object.keys(o).forEach((k) => andar(o[k], p + "." + k));
  })(REACTIVE_VOICE, "");
  const usar = bancos.slice(0, 40);
  const EV = "AaEPAEXAaE";
  const out = [];
  window.__rng = 0;
  for (let i = 0; i < 300; i++) {
    if (i % 5 === 0) stats.totalDrawn++;
    caosJogEmoRegistrar(i % 3, EV[i % EV.length]);
    const msg = "[C.A.O.S.] " + getRandomReaction(usar[i % usar.length], players[i % 3].name, players[(i + 1) % 3].name);
    const antes = caosMatchLog.length;
    showToastMessage(msg);
    const ult = caosMatchLog.length > antes ? caosMatchLog[caosMatchLog.length - 1] : null;
    out.push(ult ? ult.text + " |" + (ult.emo || "") : "-");
    if (activeToastState) closeActiveToast();
    window.__avanca(15000);
  }
  return { out, rng: window.__rng, reg: caosFalaReg.length, cerebro: caosCerebro.tot };
}

(async () => {
  // 1. inventário
  const inv = rodar(["ferramentas/caos_inventario.js", "--checar"]);
  ok("Inventário: bancos citados existem e o documento está em dia", /INVENTÁRIO OK/.test(inv), inv.trim().split("\n").pop());

  const b = await abrirNavegador();
  const abrir = async () => {
    const page = await b.newPage();
    const erros = [];
    page.on("pageerror", (e) => erros.push(e.message));
    await page.route(/fonts\./, (r) => r.abort());
    await page.addInitScript(preparo);
    await page.goto("file://" + ARQ);
    await page.waitForFunction(() => typeof caosEmit === "function" && typeof caosEspinha === "object" && caosEspinha.instalada);
    return { page, erros };
  };

  // 2. igualdade
  const corr = {};
  for (const modo of ["semRegistro", "registro", "cerebro"]) {
    const { page, erros } = await abrir();
    corr[modo] = await page.evaluate(roteiro, modo);
    corr[modo].erros = erros;
    await page.close();
  }
  const A = corr.semRegistro,
    B = corr.registro,
    C = corr.cerebro;
  const iguais = (x, y) => JSON.stringify(x.out) === JSON.stringify(y.out) && x.rng === y.rng;
  const apareceram = A.out.filter((x) => x !== "-").length;
  ok(
    "Igualdade: mesmas falas e mesmo sorteio com registro desligado, ligado e com o cérebro em sombra",
    iguais(A, B) && iguais(A, C) && B.reg > 0 && C.cerebro > 0 && apareceram >= 50 && ![A, B, C].some((x) => x.erros.length),
    JSON.stringify({ apareceram, rng: [A.rng, B.rng, C.rng], registro: B.reg, cerebro: C.cerebro, difAB: A.out.findIndex((x, i) => x !== B.out[i]), difAC: A.out.findIndex((x, i) => x !== C.out[i]), erros: [...A.erros, ...B.erros, ...C.erros].slice(0, 2) }),
  );

  // 3. invariância (partidas inteiras: original com o cérebro desligado, replay com ele ligado)
  const sim = rodar(["ferramentas/simular_partidas.js", ARQ, "--cerebro", "--so=versus-classico-tabuleiro-3"]) + rodar(["ferramentas/simular_partidas.js", ARQ, "--cerebro", "--so=equipe-2x2"]);
  const replays = sim.split("\n").filter((l) => /replay:/.test(l));
  ok(
    "Invariância: partida repetida com o cérebro ligado chega ao mesmo estado (pontos, casas, cartas, turnos)",
    replays.length === 2 && replays.every((l) => /ok, mesmo estado final/.test(l) && /espinha 0/.test(l)),
    replays.map((l) => l.trim()).join(" || ") || sim.slice(-300),
  );

  // 4 e 5. sombra e limites (só o cérebro, com jogadas sintéticas)
  const { page, erros } = await abrir();
  const r = await page.evaluate(() => {
    document.querySelectorAll(".caos-modal-ov, #novidadesModal").forEach((o) => o.remove());
    caosCerebro.on = true;
    CURRENT_FORMAT = "versus";
    gameEnded = false;
    starterChosen = true;
    WINNING_SCORE = 60;
    // gerador próprio do teste (não usa o Math.random do jogo)
    let s = 7;
    const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const mesa = () => ["Ana", "Beto", "Caio", "Duda"].map((n, i) => ({ id: "j" + i, name: n, score: 0, position: 0, humor: "normal", emo: { h: "" } }));
    const partidas = [];
    let falasPorCartaMax = 0;
    for (let pt = 0; pt < 5; pt++) {
      CURRENT_MODE = "classico";
      caosCerebroZerar();
      caosCerebro.on = true;
      players = mesa();
      stats.totalDrawn = 0;
      for (let c = 0; c < 60; c++) {
        stats.totalDrawn++;
        // cada carta: alguns erros ou pulos (às vezes um Absurdo) e um acerto
        // mistura parecida com a das partidas simuladas: 1 a 3 erros por carta, ~10% de Absurdo
        const n = 1 + Math.floor(rnd() * 3);
        for (let k = 0; k < n; k++) {
          // quem erra de novo costuma ser quem está respondendo (como na mesa)
          const i = rnd() < 0.6 ? c % 4 : Math.floor(rnd() * 4);
          const ev = rnd() < 0.1 ? "X" : rnd() < 0.15 ? "P" : "E";
          caosJogEmoRegistrar(i, ev);
        }
        // um jogador "em fase" acerta mais (gera sequência e troca de liderança)
        const quem = rnd() < 0.45 ? (Math.floor(c / 12) % 4) : Math.floor(rnd() * 4);
        players[quem].score += 4;
        players[quem].position += 2;
        caosJogEmoRegistrar(quem, rnd() < 0.35 ? "a" : "A");
        const naCarta = caosCerebro.log.filter((e) => e.carta === stats.totalDrawn && e.escolha).length;
        falasPorCartaMax = Math.max(falasPorCartaMax, naCarta);
      }
      const rs = caosCerebroResumo();
      partidas.push({ pct: rs.pct, tipos: rs.tipos.length, lista: rs.tipos });
    }
    const tot = partidas.reduce((a, p) => a + p.pct, 0) / partidas.length;
    // limites
    CURRENT_MODE = "classico";
    caosCerebroZerar();
    caosCerebro.on = true;
    players = mesa();
    stats.totalDrawn = 10;
    for (let k = 0; k < 20; k++) caosJogEmoRegistrar(0, "a");
    const orc = caosCerebro.log.filter((e) => e.carta === 10 && e.escolha).length;
    caosJogEmoRegistrar(1, "X");
    const absurdoSempre = caosCerebro.log[caosCerebro.log.length - 1].escolha === "absurdo";
    CURRENT_MODE = "junior";
    caosCerebroZerar();
    caosCerebro.on = true;
    players = mesa();
    stats.totalDrawn = 20;
    for (let k = 0; k < 4; k++) caosJogEmoRegistrar(2, "E");
    for (let k = 0; k < 3; k++) caosJogEmoRegistrar(3, "P");
    const escolhasJr = caosCerebro.log.map((e) => e.escolha).filter(Boolean);
    const juniorSemZoeira = escolhasJr.length > 0 && !escolhasJr.some((x) => CAOS_CEREBRO_ZOEIRA.has(x));
    // zero sorteio e jogo intocado (chamando o cérebro direto, sem o resto do C.A.O.S.)
    CURRENT_MODE = "classico";
    const rOrig = Math.random;
    let sorteios = 0;
    Math.random = function () {
      sorteios++;
      return rOrig();
    };
    const foto = caosEspinhaFoto();
    for (let k = 0; k < 50; k++) caosCerebroEvento(k % 4, "AaEPX"[k % 5]);
    const intocado = caosEspinhaFoto() === foto;
    Math.random = rOrig;
    return { partidas, media: Math.round(tot), falasPorCartaMax, orc, absurdoSempre, juniorSemZoeira, escolhasJr, sorteios, intocado, leis: caosEspinha.leis, limite: CAOS_FALAS_POR_CARTA };
  });
  await page.close();
  await b.close();
  ok(
    "Sombra: falaria em 40% a 60% das jogadas (300 cartas), com 5 tipos ou mais por partida",
    r.partidas.every((p) => p.pct >= 40 && p.pct <= 60 && p.tipos >= 5) && !erros.length,
    JSON.stringify({ media: r.media, partidas: r.partidas.map((p) => p.pct + "%/" + p.tipos), erros: erros.slice(0, 2) }),
  );
  ok(
    "Limites: orçamento por carta, Absurdo sempre, Júnior sem zoeira, nenhum sorteio, jogo intocado",
    r.orc <= r.limite && r.falasPorCartaMax <= r.limite && r.absurdoSempre && r.juniorSemZoeira && r.sorteios === 0 && r.intocado && r.leis === 0,
    JSON.stringify({ orc: r.orc, max: r.falasPorCartaMax, limite: r.limite, absurdo: r.absurdoSempre, junior: r.escolhasJr, sorteios: r.sorteios, intocado: r.intocado, leis: r.leis }),
  );

  res.forEach((x) => {
    console.log(`${x.passou ? "ok    " : "FALHOU"}  ${x.nome}`);
    if (!x.passou || process.env.V) console.log("        " + x.diag);
  });
  const tudo = res.every((x) => x.passou);
  if (!tudo) console.log("Error: teste do cérebro falhou");
  console.log(tudo ? "CÉREBRO OK" : "CÉREBRO FALHOU");
  process.exit(tudo ? 0 : 1);
})();
