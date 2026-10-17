#!/usr/bin/env node
// Teste da Corrida contra o Tempo (1.7.10.6): joga uma partida curta e confere as regras do JF
// (docs/Modos_1.7.10.6.md): vez de 15 + 15 s, 10 dicas sem especial de casa, acerto = 1 carta e +10 s,
// intervalo com o relógio congelado, Desfazer tira a carta e os 10 s, carta que estoura sai sem dono,
// relógio zerado espera a resposta pendente, desempate relâmpago só com os empatados, tela final em
// cartas, save e volta dos dois relógios, e o retrato do online com os prazos.
//   node ferramentas/teste_corrida.js [arquivo.html]
const { acharMestre, abrirNavegador } = require("./_navegador");
const ARQ = acharMestre(process.argv[2]);
(async () => {
  const b = await abrirNavegador();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/fonts\.|peerjs|workers\.dev|google/, (r) => r.abort());
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("perfil5_tutorial_visto", "x");
      localStorage.setItem("perfil5_tut_vitoria_vistos", JSON.stringify(["corrida", "corridaTempo"]));
    } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
  });
  const p = await ctx.newPage();
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message));
  await p.goto("file://" + ARQ);
  await p.waitForFunction(() => typeof saveGameState === "function" && !document.getElementById("goToRulesBtn").disabled);
  const r = await p.evaluate(async () => {
    const o = {};
    const esp = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const f = () => {
      if (activeToastState) closeActiveToast();
      document.querySelectorAll(".caos-modal-ov").forEach((x) => x.remove());
    };
    const livre = () => currentCard.clues.map((c, i) => i).filter((i) => currentCard.clues[i].type === "clue" && !revealedOrder.some((x) => x.index === i));
    document.querySelectorAll(".caos-modal-ov,.jf-modal-bg").forEach((x) => x.remove());
    CURRENT_FORMAT = "versus";
    players = ["Ana", "Beto", "Caio"].map((n, i) => ({ id: jogadorIdNovo(), name: n, score: 0, position: 0, color: PLAYER_COLORS[i], avatar: "😀", humor: "normal", gems: {} }));
    selectMode("corrida", null, "cartas");
    o.cardModo = !!document.getElementById("modeWrapCorrida");
    o.regras = /mais cartas/.test(document.getElementById("rulesList").innerHTML) && /Rouba a vez/.test(document.getElementById("rulesList").innerHTML);
    starterDrawCount = 1;
    mestreIndex = 0;
    responderIndex = 1;
    ["splashScreen", "welcomeScreen", "playerPanel"].forEach((id) => (document.getElementById(id).style.display = "none"));
    document.getElementById("gameScreen").style.display = "flex";
    beginGameplay();
    await esp(400);
    f();
    o.relogioInicial = Math.round(corridaGeralMs() / 1000) === 1800;
    o.dezDicas = currentCard.clues.length === 10;
    o.semCasa = !currentCard.clues.some((c) => especialDeCasa(c));
    o.semTabuleiro = document.getElementById("boardTrack").innerHTML === "";
    flipCard();
    f();
    o.vez15 = timerKind === "pick" && secondsLeft() === 15;
    chooseClue(livre()[0]);
    f();
    o.resp15 = timerKind === "response" && secondsLeft() === 15;
    const gAntes = corridaGeralMs();
    toqueJogoUltimo = 0;
    markCorrect();
    await esp(100);
    o.umaCarta = players[1].score === 1 && players[0].score === 0;
    o.bonus10 = Math.abs(corridaGeralMs() - gAntes - 10e3) < 600;
    o.intervalo = corridaIntervaloAberto() && !!tabLobbyFimEm();
    o.mestreRodou = mestreIndex === 1;
    const cartaAntes = corridaCartaMs();
    desfazerUltimo();
    await esp(200);
    f();
    o.desfazer = players[1].score === 0 && !corridaIntervaloAberto() && Math.abs(corridaGeralMs() - gAntes) < 900 && corridaCartaMs() <= cartaAntes + 50;
    toqueJogoUltimo = 0;
    markCorrect();
    await esp(100);
    const g1 = corridaGeralMs();
    await esp(700);
    o.congelado = Math.abs(corridaGeralMs() - g1) < 50;
    o.retrato = (() => {
      const rr = retratoPartida("mesa");
      return !!rr.corrida && rr.vitoria === "corrida" && typeof rr.corrida.resta === "number";
    })();
    corridaIntervaloFechar();
    await esp(300);
    f();
    flipCard();
    f();
    // carta estoura no tempo: sai sem dono
    corridaDobrar();
    corridaCartaRestaMs = 200;
    await esp(800);
    f();
    await esp(300);
    const ult = cartasPartida[cartasPartida.length - 1];
    o.estourou = !!ult && ult.quem === null && cardState === "hidden" && players.every((q, i) => q.score === (i === 1 ? 1 : 0));
    corridaIntervaloFechar();
    await esp(300);
    f();
    flipCard();
    f();
    // relógio zera com resposta pendente: a resposta vale; aí empate (Ana 1 × Beto 1) → desempate relâmpago
    const respondeu = responderIndex;
    chooseClue(livre()[0]);
    f();
    corridaDobrar();
    corridaRestaMs = 200;
    await esp(800);
    f();
    o.esperaPendente = corridaAcabou && cardState === "revealed" && pendingIndex !== null && !gameEnded;
    players[respondeu].score = 0;
    const outro = [0, 1, 2].find((i) => i !== respondeu && i !== mestreIndex);
    players[outro].score = 1;
    toqueJogoUltimo = 0;
    markCorrect();
    await esp(200);
    f();
    await esp(300);
    o.desempate = !!corridaDesempate && corridaDesempate.ids.length === 2 && !corridaPodeResponder(mestreIndex) && cardState === "hidden" && !gameEnded;
    flipCard();
    f();
    o.soEmpatados = corridaPodeResponder(responderIndex);
    chooseClue(livre()[0]);
    f();
    toqueJogoUltimo = 0;
    markWrong();
    await esp(150);
    f();
    await esp(150);
    o.passouProOutroEmpatado = corridaPodeResponder(responderIndex) && responderIndex !== mestreIndex;
    const venc = players[responderIndex].name;
    chooseClue(livre()[0]);
    f();
    toqueJogoUltimo = 0;
    markCorrect();
    await esp(300);
    f();
    const fim = document.getElementById("winnerArea").innerText;
    o.fim = gameEnded && fim.includes(venc + " venceu") && /2 cartas/.test(fim) && /desempate/.test(fim);
    o.parou = !corridaTique;
    return o;
  });
  // Corrida · Tempo: a carta vale os segundos que sobravam; empate em pontos desempata por cartas (sem desempate relâmpago)
  const rt = await p.evaluate(async () => {
    const o = {};
    const esp = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const f = () => {
      if (activeToastState) closeActiveToast();
      document.querySelectorAll(".caos-modal-ov").forEach((x) => x.remove());
    };
    const livre = () => currentCard.clues.map((c, i) => i).filter((i) => currentCard.clues[i].type === "clue" && !revealedOrder.some((x) => x.index === i));
    resetGame();
    CURRENT_FORMAT = "versus";
    players = ["Ana", "Beto", "Caio"].map((n, i) => ({ id: jogadorIdNovo(), name: n, score: 0, position: 0, color: PLAYER_COLORS[i], avatar: "😀", humor: "normal", gems: {} }));
    selectMode("corrida", null, "tempo");
    o.tempoRegras = /segundos que sobravam/.test(document.getElementById("rulesList").innerHTML);
    starterDrawCount = 1;
    mestreIndex = 0;
    responderIndex = 1;
    ["splashScreen", "welcomeScreen", "playerPanel"].forEach((id) => (document.getElementById(id).style.display = "none"));
    document.getElementById("gameScreen").style.display = "flex";
    beginGameplay();
    await esp(300);
    f();
    flipCard();
    f();
    await esp(400);
    f();
    corridaDobrar();
    corridaCartaRestaMs = 105400; // 1:45 sobrando
    o.valeNaTela = /vale\s*106/.test(document.getElementById("corridaRelogios").innerText) || (await esp(400), /vale\s*10[56]/.test(document.getElementById("corridaRelogios").innerText));
    chooseClue(livre()[0]);
    f();
    toqueJogoUltimo = 0;
    markCorrect();
    await esp(100);
    o.pontosPorTempo = players[1].score >= 104 && players[1].score <= 106 && cartasPartida[cartasPartida.length - 1].pts === players[1].score;
    o.placarTempo = /pts · 1 carta/.test(document.getElementById("miniScoreboard").innerText);
    // empate em pontos, Caio com mais cartas → Caio vence sem desempate relâmpago
    players[1].score = 200;
    players[2].score = 200;
    cartasPartida.push({ n: 99, cat: "PESSOA", resp: "x", quem: players[2].id, mestre: null, dicas: 1, dicaNum: null, dicaTxt: null, bonus: false, pts: 50 });
    cartasPartida.push({ n: 98, cat: "PESSOA", resp: "y", quem: players[2].id, mestre: null, dicas: 1, dicaNum: null, dicaTxt: null, bonus: false, pts: 50 });
    corridaIntervaloFechar();
    corridaAcabou = true;
    await esp(600);
    f();
    await esp(300);
    o.semDesempateNoTempo = gameEnded && !corridaDesempate;
    o.cartasDesempatam = /Caio venceu/.test(document.getElementById("winnerArea").innerText);
    return o;
  });
  Object.assign(r, rt);
  // save e volta: os dois relógios continuam de onde estavam
  const r2 = await p.evaluate(async () => {
    const esp = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const f = () => {
      if (activeToastState) closeActiveToast();
      document.querySelectorAll(".caos-modal-ov").forEach((x) => x.remove());
    };
    resetGame();
    CURRENT_FORMAT = "versus";
    players = ["Ana", "Beto"].map((n, i) => ({ id: jogadorIdNovo(), name: n, score: 0, position: 0, color: PLAYER_COLORS[i], avatar: "😀", humor: "normal", gems: {} }));
    selectMode("corrida"); // padrão: Tempo
    starterDrawCount = 1;
    mestreIndex = 0;
    responderIndex = 1;
    ["splashScreen", "welcomeScreen", "playerPanel"].forEach((id) => (document.getElementById(id).style.display = "none"));
    document.getElementById("gameScreen").style.display = "flex";
    beginGameplay();
    f();
    flipCard();
    f();
    await esp(500);
    f();
    corridaDobrar();
    corridaRestaMs = 754000;
    corridaCartaRestaMs = 81000;
    saveGameState();
    return true;
  });
  await p.reload();
  await p.waitForFunction(() => typeof saveGameState === "function" && !document.getElementById("goToRulesBtn").disabled);
  await p.waitForTimeout(600);
  const r3 = await p.evaluate(() => ({
    modo: CURRENT_MODE,
    g: Math.round(corridaGeralMs() / 1000),
    c: Math.round(corridaCartaMs() / 1000),
    tique: !!corridaTique,
  }));
  console.log(r3);
  r.save = r2 && r3.modo === "corrida" && Math.abs(r3.g - 754) <= 2 && Math.abs(r3.c - 81) <= 2 && r3.tique;
  let ok = true;
  Object.entries(r).forEach(([k, v]) => {
    console.log((v ? "ok   " : "FALHA") + "  " + k);
    if (!v) ok = false;
  });
  if (erros.length) {
    ok = false;
    console.log("Erros na página:", erros);
  } else console.log("Sem erro na página.");
  console.log(ok ? "CORRIDA OK" : "CORRIDA COM FALHA");
  await b.close();
  process.exit(ok ? 0 : 1);
})();
