// Teste focado: 1.8 · C.A.O.S. 5.2 · afeto da ficha. A ficha guardada de cada jogador muda o que ele sente numa
// jogada (veterano irrita menos, craque irrita mais, zebra alegra mais, mágoa, recorde pessoal) e a aba
// "🧬 Jogadores" do cérebro mostra isso.
const { acharMestre, abrirNavegador } = require("./_navegador");
const ARQ = acharMestre(process.argv[2]);
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage({ viewport: { width: 900, height: 900 } });
  const erros = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.addInitScript(() => {
    try { localStorage.setItem("perfil5_tutorial_visto", "x"); localStorage.setItem("perfil_jf_caos_guia", "0"); } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
  });
  await page.goto("file://" + ARQ);
  await page.waitForFunction(() => typeof caosAfeto === "function" && typeof caosConsoleEvento === "function");
  const r = await page.evaluate(() => {
    const out = {};
    // fichas: Vera veterana e craque, Zeca zebra, Mag com mágoa, Nina sem ficha
    fichaUpd("Vera", (f) => Object.assign(f, { partidas: 14, acertos: 40, erros: 10, melhorPts: 30 }));
    fichaUpd("Zeca", (f) => Object.assign(f, { partidas: 5, acertos: 3, erros: 12 }));
    fichaUpd("Mag", (f) => Object.assign(f, { partidas: 4, acertos: 6, erros: 6, magoa: 2, ultimoResultado: "lanterna" }));
    CURRENT_FORMAT = "versus";
    selectMode("classico");
    players = ["Vera", "Zeca", "Mag", "Nina"].map((n, i) => ({ id: "j" + i, name: n, score: 0, position: 0, color: PLAYER_COLORS[i], avatar: "😀", humor: "normal", gems: {} }));
    matchId = "teste_afeto";
    caosVinc = null;
    const tags = (i) => caosAfeto(players[i]).tags;
    out.vera = tags(0);
    out.zeca = tags(1);
    out.mag = tags(2);
    out.nina = tags(3);
    // quanto um evento sobe a emoção, com o console zerado
    const sobe = (i, ev, emo) => {
      caosConsoleReset();
      caosEmo = { tensao: 5, calor: 5, paciencia: 7 };
      caosConsoleEvento(i, ev);
      return caosConsole.g[emo] || 0;
    };
    const raivaVera = sobe(0, "E", "raiva"), raivaNina = sobe(3, "E", "raiva");
    out.raivaVera = raivaVera; out.raivaNina = raivaNina;
    const alegriaZeca = sobe(1, "A", "alegria"), alegriaMag = sobe(2, "A", "alegria");
    out.alegriaZeca = alegriaZeca; out.alegriaMag = alegriaMag;
    out.nojoMag = sobe(2, "E", "nojo");
    out.carinhoNina = sobe(3, "A", "carinho");
    out.motivoNoLog = caosConsole.log.some((l) => /novato/.test(l));
    // recorde pessoal: uma vez só
    players[0].score = 31;
    caosConsoleReset();
    out.recorde1 = caosAfetoRecorde(players[0]);
    out.recorde2 = caosAfetoRecorde(players[0]);
    // nome emprestado não usa a ficha
    players[1].nickEmprestado = true;
    caosAfetoCache = { match: null, por: {}, recorde: {} };
    out.emprestado = caosAfeto(players[1]).tags;
    players[1].nickEmprestado = false;
    // aba do cérebro
    const aba = caosInspectorJogadores();
    document.body.appendChild(aba);
    out.abaCards = aba.querySelectorAll(".ci-jog").length;
    out.abaTemFicha = /14 partidas · 80% de acerto · recorde 30/.test(aba.textContent) && /sem ficha/.test(aba.textContent) && /craque/.test(aba.textContent);
    aba.remove();
    return out;
  });
  await b.close();
  const checks = [
    ["Vera: veterana e craque", r.vera.includes("veterano") && r.vera.includes("craque")],
    ["Zeca: zebra", r.zeca.includes("zebra")],
    ["Mag: mágoa e voltou por cima", r.mag.includes("magoa") && r.mag.includes("volta")],
    ["Nina sem ficha: novata", r.nina.includes("novato")],
    ["Erro da craque irrita mais que o da novata", r.raivaVera > r.raivaNina * 1.3],
    ["Acerto da zebra alegra mais que o de quem tem mágoa", r.alegriaZeca > r.alegriaMag * 1.3],
    ["Erro de quem tem mágoa dá um pouco de nojo", r.nojoMag > 0],
    ["Acerto da novata dá carinho", r.carinhoNina > 0],
    ["O motivo (ficha) aparece nos gatilhos do console", r.motivoNoLog],
    ["Passou o recorde da ficha: festa uma vez só", r.recorde1 === true && r.recorde2 === false],
    ["Nome emprestado não usa a ficha", r.emprestado.length === 1 && r.emprestado[0] === "novato"],
    ["Aba 🧬 Jogadores: um cartão por jogador com a ficha", r.abaCards === 4 && r.abaTemFicha],
  ];
  let ok = true;
  checks.forEach(([n, v]) => { console.log(`${v ? "ok    " : "FALHOU"}  ${n}`); if (!v) ok = false; });
  if (erros.length) { console.log("Erros na página: " + erros.slice(0, 3).join(" | ")); ok = false; }
  console.log("diag:", JSON.stringify(r));
  console.log(ok ? "AFETO OK" : "AFETO FALHOU");
  process.exit(ok ? 0 : 1);
})();
