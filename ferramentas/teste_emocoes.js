#!/usr/bin/env node
// 1.9.4 · Calibragem das emoções (docs/Emocoes_Calibragem_2026-11-05.md), no motor real da página:
//   node ferramentas/teste_emocoes.js [mestre.html]
// Confere: o tédio vai embora quando a mesa volta a jogar; o temperamento do dia aparece (rabugento e elétrico se
// irritam com erro em série, normal e generoso se magoam); nada passa do teto nem vira NaN.
const { acharMestre, abrirNavegador } = require("./_navegador");
const file = acharMestre(process.argv[2]);
const REC = "AEAEAPAEAEAAEAEPAEAEAEAAE";
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage();
  const erros = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.goto("file://" + file);
  await page.waitForFunction(() => typeof caosConsoleReset === "function");
  const rodar = (seq, temp) =>
    page.evaluate(({ seq, temp }) => {
      CURRENT_MODE = "classico"; CURRENT_FORMAT = "versus"; gameEnded = false;
      players = [{ name: "Ana", humor: "normal", score: 0, position: 0 }, { name: "Beto", humor: "normal", score: 0, position: 0 }];
      stats.totalDrawn = 0;
      caosConsoleReset(); caosEixosReset();
      caosTemper = CAOS_TEMPERAMENTOS[temp]; caosEmo.tensao = 5 + caosTemper.t; caosEmo.calor = 5 + caosTemper.c; caosEmo.paciencia = 7;
      const hist = []; let ruim = false;
      for (let i = 0; i < seq.length; i++) {
        const ev = seq[i]; stats.totalDrawn++;
        caosConsoleCarta(false);
        if (ev === "T") for (let k = 0; k < 3; k++) caosSentir("tedio", 1, "30 s sem evento na mesa");
        else caosJogEmoRegistrar(i % 2, ev);
        caosConsoleAvancar("x");
        Object.entries(caosConsole.g).forEach(([k, v]) => { if (!Number.isFinite(v) || v > CAOS_CONSOLE[k].teto + 1e-9) ruim = true; });
        hist.push(caosConsole.atual);
      }
      return { hist, ruim };
    }, { seq, temp });
  const ok = [];
  const conf = (n, v) => ok.push([n, !!v]);
  try {
    const tedio = "P".repeat(10) + "T".repeat(20);
    const voltaTedio = [];
    for (const t of ["normal", "rabugento", "generoso"]) {
      const r = await rodar(tedio + REC, t);
      voltaTedio.push(r.hist.slice(tedio.length).findIndex((e) => e === "calmo"));
    }
    conf(`Tédio vai embora quando a mesa volta a jogar (em até 10 cartas; foi ${voltaTedio.join(", ")})`, voltaTedio.every((n) => n >= 0 && n <= 10));
    const est = "E".repeat(25);
    const manda = async (t) => {
      const r = await rodar(est, t), c = {};
      r.hist.forEach((e) => (c[e] = (c[e] || 0) + 1));
      return { top: Object.keys(c).filter((k) => k !== "calmo").sort((a, b2) => c[b2] - c[a])[0], ruim: r.ruim };
    };
    const R = {};
    for (const t of ["normal", "rabugento", "generoso", "eletrico"]) R[t] = await manda(t);
    conf(`Erro em série: rabugento e elétrico se irritam (${R.rabugento.top}, ${R.eletrico.top})`, R.rabugento.top === "raiva" && R.eletrico.top === "raiva");
    conf(`Erro em série: normal e generoso se magoam (${R.normal.top}, ${R.generoso.top})`, R.normal.top === "tristeza" && R.generoso.top === "tristeza");
    conf("Nada passa do teto nem vira NaN", Object.values(R).every((x) => !x.ruim));
    conf("Sem erro na página", !erros.length);
  } finally {
    await b.close();
  }
  ok.forEach(([n, v]) => console.log((v ? "ok    " : "FALHOU") + "  " + n));
  const tudo = ok.every((x) => x[1]);
  console.log(tudo ? "EMOÇÕES OK" : "EMOÇÕES COM PROBLEMA");
  process.exit(tudo ? 0 : 1);
})();
