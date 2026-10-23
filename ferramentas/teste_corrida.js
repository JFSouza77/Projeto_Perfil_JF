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
      if (typeof avisoMesa !== "undefined" && avisoMesa) { for (let i = 0; i < 8 && avisoMesa; i++) avisoAcabar(avisoMesa.id); corridaTicar(); } // 1.7.10.7: o aviso da mesa sai na hora no teste
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
    o.relogioInicial = Math.round(corridaGeralMs() / 1000) === CORRIDA_TEMPO_MS / 1000;
    o.dezDicas = currentCard.clues.length === 10;
    o.semCasa = !currentCard.clues.some((c) => especialDeCasa(c));
    o.semTabuleiro = document.getElementById("boardTrack").innerHTML === "";
    flipCard();
    f();
    o.vez15 = timerKind === "pick" && secondsLeft() === CORRIDA_ESCOLHA_SEG; // 1.7.10.9.3 (JF): 15 s pra escolher
    // 1.7.10.9.3 (JF): acabou o tempo de escolher: uma dica de verdade abre sozinha, a vez continua com a mesma pessoa
    const quemVez = responderIndex,
      abertasAntes = revealedOrder.length;
    onTimerExpired("pick");
    o.escolhaAbreSozinha = pendingIndex !== null && responderIndex === quemVez && timerKind === "response" && revealedOrder.length === abertasAntes + 1 && currentCard.clues[pendingIndex].type === "clue";
    clearTimeout(overlayTimeoutRef);
    overlayTimeoutRef = null;
    timeoutOverlayMessage = null;
    pendingOverlayAction = null;
    f();
    // a resposta continua com 25 s (+5 s do aviso de tempo esgotado, que não pode comer o tempo de responder)
    o.resp15 = timerKind === "response" && secondsLeft() >= CORRIDA_VEZ_SEG + 4 && secondsLeft() <= CORRIDA_VEZ_SEG + 5;
    // 1.7.10.9.3 (JF): a Corrida não tem Ano; Animal é categoria própria
    o.semAno = !allCards.some((c) => c.category === "ANO") && allCards.some((c) => c.category === "ANIMAL") && gemCategoryFor("ANIMAL") === "ANIMAL";
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
    // o aviso do Juízo Final congela o relógio: tira o aviso e espera o relógio zerar (com folga pra máquina lenta)
    for (let i = 0; i < 40 && !corridaAcabou; i++) {
      f();
      await esp(150);
    }
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
      if (typeof avisoMesa !== "undefined" && avisoMesa) { for (let i = 0; i < 8 && avisoMesa; i++) avisoAcabar(avisoMesa.id); corridaTicar(); } // 1.7.10.7: o aviso da mesa sai na hora no teste
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
  // Eventos (spec de 17/10 à noite): penalidades, carta morta, escudo, bomba, Juízo Final, Hardcore, duelo, lojinha, coroas
  const re = await p.evaluate(async () => {
    const o = {};
    const esp = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const f = () => {
      if (activeToastState) closeActiveToast();
      if (typeof avisoMesa !== "undefined" && avisoMesa) { for (let i = 0; i < 8 && avisoMesa; i++) avisoAcabar(avisoMesa.id); corridaTicar(); } // 1.7.10.7: o aviso da mesa sai na hora no teste
      document.querySelectorAll(".caos-modal-ov").forEach((x) => x.remove());
    };
    const livre = () => currentCard.clues.map((c, i) => i).filter((i) => currentCard.clues[i].type === "clue" && !revealedOrder.some((x) => x.index === i));
    const comecar = async (flavor, nomes) => {
      resetGame();
      CURRENT_FORMAT = "versus";
      players = (nomes || ["Ana", "Beto", "Caio"]).map((n, i) => ({ id: jogadorIdNovo(), name: n, score: 0, position: 0, color: PLAYER_COLORS[i], avatar: "😀", humor: "normal", gems: {} }));
      selectMode("corrida", null, flavor);
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
      await esp(300);
      f();
    };
    const parar = () => corridaDobrar();
    // penalidades
    await comecar("tempo");
    parar();
    corridaCartaRestaMs = 100e3;
    chooseClue(livre()[0]);
    f();
    toqueJogoUltimo = 0;
    markWrong();
    await esp(100);
    f();
    parar();
    const depoisErro = corridaCartaRestaMs;
    await esp(400);
    f();
    if (timerKind === "pick") chooseClue(livre()[0]);
    f();
    toqueJogoUltimo = 0;
    parar();
    const antesPulo = corridaCartaRestaMs;
    markWrong("pular");
    await esp(100);
    f();
    parar();
    o.erroMenos1 = depoisErro <= 99.1e3 && depoisErro >= 98.5e3;
    o.puloMenos2 = antesPulo - corridaCartaRestaMs >= 1.9e3 && antesPulo - corridaCartaRestaMs <= 2.5e3;
    // carta morta: −1 min no geral
    await esp(300);
    f();
    parar();
    const g0 = corridaRestaMs;
    corridaCartaRestaMs = 100;
    await esp(800);
    f();
    await esp(300);
    o.cartaMorta = Math.abs(g0 - 60e3 - corridaGeralMs()) < 1500 && cardState === "hidden";
    // escudo segura a próxima
    corridaIntervaloFechar();
    await esp(200);
    f();
    corridaEscudo = cartaSeq;
    flipCard();
    f();
    await esp(200);
    f();
    parar();
    const g1 = corridaRestaMs;
    corridaCartaRestaMs = 100;
    await esp(800);
    f();
    await esp(300);
    o.escudo = Math.abs(g1 - corridaGeralMs()) < 1500;
    // bomba: erro −5 s no geral, acerto +20 s
    corridaIntervaloFechar();
    await esp(200);
    f();
    corridaBomba = cartaSeq;
    flipCard();
    f();
    await esp(200);
    f();
    o.bombaNaTela = document.body.classList.contains("cr-bomba") && /BOMBA/.test(document.getElementById("corridaRelogios").innerText);
    chooseClue(livre()[0]);
    f();
    parar();
    const g2 = corridaRestaMs;
    toqueJogoUltimo = 0;
    markWrong();
    await esp(100);
    f();
    parar();
    o.bombaErro5 = Math.abs(g2 - 5e3 - corridaRestaMs) < 600;
    await esp(300);
    f();
    if (timerKind === "pick") chooseClue(livre()[0]);
    f();
    parar();
    const g3 = corridaRestaMs;
    toqueJogoUltimo = 0;
    markCorrect();
    await esp(100);
    o.bombaMais20 = Math.abs(corridaGeralMs() - g3 - 20e3) < 800;
    // Juízo Final: dicas abrem sozinhas, qualquer um bate, errou abre a próxima, sem +10 s
    corridaIntervaloFechar();
    await esp(200);
    f();
    parar();
    corridaRestaMs = 55e3;
    flipCard();
    f();
    for (let t = 0; t < 40 && pendingIndex === null; t++) {
      await esp(150);
      f();
    }
    o.juizo = corridaJuizo && document.body.classList.contains("cr-juizo");
    o.abriuSozinha = pendingIndex !== null && revealedOrder.length === 1;
    o.todosBatem = palpiteEligibleHolders().length === 2;
    const quem = palpiteEligibleHolders()[0];
    palpiteMiss(quem);
    for (let t = 0; t < 40 && !(revealedOrder.length === 2 && pendingIndex !== null); t++) {
      await esp(150);
      f();
    }
    o.errouAbreProxima = revealedOrder.length === 2 && pendingIndex !== null;
    parar();
    const g4 = corridaRestaMs;
    const q2 = palpiteEligibleHolders()[1];
    const antes = jogadorPorId(q2).score;
    palpiteHit(q2);
    await esp(100);
    o.semBonusNoJuizo = Math.abs(corridaGeralMs() - g4) < 600 && jogadorPorId(q2).score > antes;
    // Hardcore: 1:30 a 1,5×, sem especiais, abre sozinha desde o começo
    await comecar("tempo-hc");
    await esp(1300);
    f();
    o.hcDuracao = corridaCartaDuracao() === 90e3 && corridaVelocidade() === 1.5;
    o.hcSemEspecial = currentCard.clues.every((c) => c.type === "clue");
    o.hcAbreSozinha = pendingIndex !== null;
    parar();
    const c0 = corridaCartaRestaMs;
    await esp(1000);
    o.hcCorre15 = c0 - corridaCartaMs() >= 1300 && c0 - corridaCartaMs() <= 1800;
    // Duelo: geral congela, carta 2×, só os dois, quem vence rouba 25, o Mestre volta
    await comecar("tempo", ["Ana", "Beto", "Caio", "Duda"]);
    players[1].score = 100;
    players[2].score = 100;
    players[3].score = 100;
    players[0].score = 100;
    chooseClue(livre()[0]);
    f();
    toqueJogoUltimo = 0;
    markCorrect();
    await esp(100);
    corridaIntervaloFechar();
    const mestreAntesDuelo = mestreIndex;
    corridaDueloComecar();
    await esp(100);
    f();
    await esp(300);
    f();
    const ids = corridaDuelo.ids.slice();
    flipCard();
    f();
    await esp(300);
    f();
    const gD = corridaGeralMs();
    await esp(600);
    o.dueloGeralParado = Math.abs(corridaGeralMs() - gD) < 50 && corridaVelocidade() === 2;
    o.dueloSoOsDois = ids.includes(players[responderIndex].id) && !ids.includes(players[mestreIndex].id);
    const venc = jogadorPorId(players[responderIndex].id),
      perd = jogadorPorId(ids.find((id) => id !== venc.id));
    const sv = venc.score,
      sp = perd.score;
    chooseClue(livre()[0]);
    f();
    toqueJogoUltimo = 0;
    markCorrect();
    await esp(300);
    f();
    o.dueloRoubo = perd.score === sp - 25 && venc.score > sv + 25;
    o.dueloMestreVolta = !corridaDuelo && mestreIndex === mestreAntesDuelo && corridaVelocidade() === 1;
    // Lojinha (simula sala online): compra no intervalo, usa o Desfibrilador e o Corte de Fio
    const lojaOrig = window.corridaLojaLigada;
    window.corridaLojaLigada = () => true;
    corridaEstoque = null;
    // 1.7.10.6: vitrine sorteada: CORRIDA_VITRINE itens, 1 a 3 de cada, preço ±20% de 5 em 5; muda a cada intervalo
    const vitrines = [];
    for (let i = 0; i < 40; i++) {
      corridaLojaPreparar();
      vitrines.push(JSON.stringify(Object.keys(corridaEstoque).sort()));
      const ks = Object.keys(corridaEstoque);
      if (ks.length !== CORRIDA_VITRINE || ks.some((k) => !CORRIDA_LOJA[k] || corridaEstoque[k] < 1 || corridaEstoque[k] > (CORRIDA_LOJA[k].max || 3) || corridaPrecos[k] % 5 || Math.abs(corridaPrecos[k] - CORRIDA_LOJA[k].preco) > CORRIDA_LOJA[k].preco * 0.2 + 2.5)) o.estoque = false;
    }
    if (o.estoque !== false) o.estoque = true;
    o.vitrineVaria = new Set(vitrines).size > 5;
    if (!corridaIntervaloAberto()) corridaIntervaloAbrir();
    corridaIntervaloIni = Date.now() - LOJA_TRAVA_MS - 100; // passou a trava de leitura (conferida mais abaixo)
    // vitrine fixa pro resto do teste (o sorteio já foi conferido acima)
    corridaEstoque = { desfib: 2, corte: 2, cofrinho: 1, ampulheta: 1, ima: 1 };
    corridaPrecos = Object.fromEntries(Object.keys(corridaEstoque).map((k) => [k, CORRIDA_LOJA[k].preco]));
    const comprador = players.find((q) => q.score >= 60);
    comprador.score += 200;
    // 1.7.10.9.3 (JF): nos 3 primeiros segundos do intervalo a vitrine aparece, mas não dá pra comprar
    corridaIntervaloIni = Date.now();
    o.lojaTravaNoComeco = !corridaPodeComprar("desfib", comprador.id) && /liberam em instantes/.test(corridaLojaVitrineHtml(corridaEstoque, [{ id: comprador.id, nome: comprador.name, pts: comprador.score }], corridaPrecos));
    corridaIntervaloIni = Date.now() - LOJA_TRAVA_MS - 100;
    o.lojaLiberaDepois = corridaPodeComprar("desfib", comprador.id);
    const pts0 = comprador.score;
    const est0 = corridaEstoque.desfib;
    dispatchAction({ type: "corridaComprar", data: ["desfib", comprador.id] });
    dispatchAction({ type: "corridaComprar", data: ["corte", comprador.id] });
    o.comprou = comprador.score === pts0 - CORRIDA_LOJA.desfib.preco - CORRIDA_LOJA.corte.preco && corridaEstoque.desfib === est0 - 1 && corridaItens[comprador.id].desfib === 1;
    o.foraDaVitrineNaoCompra = !corridaPodeComprar("escudo", comprador.id);
    // 1.7.10.9.1 (JF): a lojinha guarda quanto cada um gastou (tela: ganhou × gastou; export: seção Lojinha)
    const reg = corridaCompras[comprador.id] || {};
    // 1.7.10.9.1: a Pausa Dramática não acumula (antes somava 15 s a cada compra e o geral quase não andava)
    corridaCongelaMs = 0;
    corridaEstoque.congelar = 2;
    corridaPrecos.congelar = CORRIDA_LOJA.congelar.preco;
    corridaComprar("congelar", comprador.id);
    corridaComprar("congelar", comprador.id);
    o.pausaNaoAcumula = corridaCongelaMs === 15e3;
    corridaCongelaMs = 0;
    delete corridaEstoque.congelar;
    comprador.score += 2 * CORRIDA_LOJA.congelar.preco;
    o.gastoRegistrado = reg.gasto === CORRIDA_LOJA.desfib.preco + CORRIDA_LOJA.corte.preco + 2 * CORRIDA_LOJA.congelar.preco && reg.itens.desfib === 1 && reg.itens.corte === 1;
    o.lojaMostraGanhouGastou = /ganhou \d+ · gastou \d+/.test(corridaLojaVitrineHtml(corridaEstoque, [{ id: comprador.id, nome: comprador.name, pts: corridaSaldo(comprador.id) }], corridaPrecos));
    // Cofrinho (+40 no próximo acerto de quem comprou), Ímã (20% do acerto dos outros) e Ampulheta (+30 s no geral)
    const outro = players.find((q) => q !== comprador);
    outro.score += 100;
    dispatchAction({ type: "corridaComprar", data: ["cofrinho", comprador.id] });
    dispatchAction({ type: "corridaComprar", data: ["ima", outro.id] });
    const gAntes = corridaGeralMs();
    dispatchAction({ type: "corridaComprar", data: ["ampulheta", comprador.id] });
    o.ampulheta = Math.abs(corridaGeralMs() - gAntes - 30e3) < 400;
    const sOutro = outro.score;
    const extra = corridaLojaNoAcerto(comprador, 100);
    o.cofrinho = extra === CORRIDA_COFRINHO_PTS && corridaLojaNoAcerto(comprador, 100) === 0;
    o.ima = outro.score === sOutro + 40; // 2 acertos de 100 do comprador: 20 + 20
    corridaIma = {};
    o.semDinheiroNaoCompra = (() => {
      const pobre = players.find((q) => q.score < 15) || players[0];
      const sc = pobre.score;
      pobre.score = 5;
      const ok = !corridaPodeComprar("corte", pobre.id);
      pobre.score = sc;
      return ok;
    })();
    corridaIntervaloFechar();
    await esp(200);
    f();
    flipCard();
    f();
    await esp(300);
    f();
    parar();
    const cd = corridaCartaRestaMs;
    dispatchAction({ type: "corridaUsar", data: ["desfib", comprador.id] });
    parar();
    o.desfib = Math.abs(corridaCartaRestaMs - cd - 15e3) < 300;
    responderIndex = players.indexOf(comprador);
    if (mestreIndex === responderIndex) mestreIndex = (responderIndex + 1) % players.length;
    clearTimer();
    startTimer("pick");
    parar();
    const cc = corridaCartaRestaMs,
      revC = revealedOrder.length;
    dispatchAction({ type: "corridaUsar", data: ["corte", comprador.id] });
    parar();
    o.corteDeFio = players[responderIndex] !== comprador && revealedOrder.length === revC && Math.abs(corridaCartaRestaMs - cc) < 300;
    // 1.7.10.6.1 (JF): lojinha também na vitória por Cartas, paga com créditos (os segundos que sobravam na carta)
    {
      const vit = corridaVitoria, sc = comprador.score;
      corridaVitoria = "cartas";
      corridaCreditos = {};
      corridaCartaDesde = null;
      corridaCartaRestaMs = 80e3;
      corridaLojaNoAcerto(comprador, 1);
      const cred = corridaSaldo(comprador.id);
      corridaEstoque = { cofrinho: 1 };
      corridaPrecos = { cofrinho: 25 };
      if (!corridaIntervaloAberto()) corridaIntervaloAbrir();
      corridaIntervaloIni = Date.now() - LOJA_TRAVA_MS - 100; // passou a trava de leitura
      corridaEstoque = { cofrinho: 1 };
      corridaPrecos = { cofrinho: 25 };
      const pode = corridaPodeComprar("cofrinho", comprador.id);
      corridaComprar("cofrinho", comprador.id);
      o.lojaCartas = cred === 80 && pode && corridaSaldo(comprador.id) === 55 && comprador.score === sc;
      corridaIntervaloFechar();
      corridaVitoria = vit;
    }
    // coroas
    endGame();
    await esp(300);
    const fim = document.getElementById("winnerArea").innerText;
    o.coroas = /Senhor do Tempo|Dono da Corrida/.test(fim) && (/Colecionador/.test(fim) || /Dono da Corrida/.test(fim));
    window.corridaLojaLigada = lojaOrig;
    return o;
  });
  Object.assign(r, re);
  // 1.7.10.6: Corrida em equipe e até 10 jogadores / 5 equipes
  const rq = await p.evaluate(async () => {
    const o = {};
    const esp = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const f = () => {
      if (activeToastState) closeActiveToast();
      if (typeof avisoMesa !== "undefined" && avisoMesa) { for (let i = 0; i < 8 && avisoMesa; i++) avisoAcabar(avisoMesa.id); corridaTicar(); } // 1.7.10.7: o aviso da mesa sai na hora no teste
      document.querySelectorAll(".caos-modal-ov").forEach((x) => x.remove());
    };
    const livre = () => currentCard.clues.map((c, i) => i).filter((i) => currentCard.clues[i].type === "clue" && !revealedOrder.some((x) => x.index === i));
    resetGame();
    o.max10 = MAX_PLAYERS === 10;
    o.divisoes = JSON.stringify([4, 5, 6, 7, 8, 9, 10].map((n) => equipeQuantidadesValidas(n))) === JSON.stringify([[2], [], [2, 3], [], [2, 4], [3], [2, 5]]);
    CURRENT_FORMAT = "equipe";
    players = Array.from({ length: 10 }, (_, i) => ({ id: jogadorIdNovo(), name: "J" + i, score: 0, position: 0, color: "#888888", avatar: AVATARS[i], humor: "normal", ageBracket: "adulto", team: null, gems: {} }));
    selectMode("corrida", null, "tempo");
    formTeamsBalancedByAge(5);
    o.cincoEquipes = Object.keys(teams).length === 5 && Object.values(teams).every((t) => t.members.length === 2) && !!teams.black && !!teams.white;
    // Corrida em equipe com 4 (2 × 2)
    resetGame();
    CURRENT_FORMAT = "equipe";
    players = ["Ana", "Beto", "Caio", "Duda"].map((n, i) => ({ id: jogadorIdNovo(), name: n, score: 0, position: 0, color: "#888888", avatar: AVATARS[i], humor: "normal", ageBracket: "adulto", team: null, gems: {} }));
    selectMode("corrida", null, "tempo");
    formTeamsBalancedByAge(2);
    equipeSubMode = "duelo";
    drawEquipeOrder();
    starterDrawCount = 1;
    ["splashScreen", "welcomeScreen", "playerPanel", "orderRevealSection"].forEach((id) => (document.getElementById(id).style.display = "none"));
    document.getElementById("gameScreen").style.display = "flex";
    beginGameplay();
    await esp(300);
    f();
    flipCard();
    f();
    await esp(300);
    f();
    const timeQueResponde = players[responderIndex].team;
    o.leituraOutraEquipe = players[mestreIndex].team !== timeQueResponde;
    chooseClue(livre()[0]);
    f();
    toqueJogoUltimo = 0;
    markCorrect();
    await esp(200);
    o.pontoDaEquipe = teamScore(timeQueResponde) > 0 && /Equipe/.test(document.getElementById("miniScoreboard").innerText);
    corridaIntervaloFechar();
    await esp(200);
    f();
    // Juízo Final em equipe: só quem não é da equipe do Mestre bate na mesa
    corridaDobrar();
    corridaRestaMs = 50e3;
    flipCard();
    f();
    for (let t = 0; t < 40 && pendingIndex === null; t++) {
      await esp(150);
      f();
    }
    const timeMestre = players[mestreIndex].team;
    o.juizoEquipe = corridaJuizo && palpiteEligibleHolders().length === 2 && palpiteEligibleHolders().every((id) => jogadorPorId(id).team !== timeMestre);
    endGame();
    await esp(300);
    o.fimEquipe = /Equipe/.test(document.getElementById("winnerArea").innerText) && /pts/.test(document.getElementById("winnerArea").innerText);
    return o;
  });
  Object.assign(r, rq);
  // save e volta: os dois relógios continuam de onde estavam
  const r2 = await p.evaluate(async () => {
    const esp = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const f = () => {
      if (activeToastState) closeActiveToast();
      if (typeof avisoMesa !== "undefined" && avisoMesa) { for (let i = 0; i < 8 && avisoMesa; i++) avisoAcabar(avisoMesa.id); corridaTicar(); } // 1.7.10.7: o aviso da mesa sai na hora no teste
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
    // a primeira carta pode sair depois da apresentação (balão/aviso): espera ela estar na mesa antes de virar
    for (let i = 0; i < 40 && cardState !== "hidden" && cardState !== "revealed"; i++) {
      f();
      await esp(100);
    }
    if (cardState === "hidden") flipCard();
    f();
    await esp(500);
    f();
    if (cardState !== "revealed") console.log("[save] carta não virou: " + cardState);
    corridaDobrar();
    corridaRestaMs = 754000;
    corridaCartaRestaMs = 81000;
    saveGameState();
    // como no importar: espera o navegador confirmar a gravação antes de recarregar (recarregar 0 ms depois às vezes
    // perde a última escrita no próprio Chromium e o teste via um save de meio segundo antes)
    await JFStore.flushNow();
    await esp(1000);
    return true;
  });
  await p.reload();
  await p.waitForFunction(() => typeof saveGameState === "function" && !document.getElementById("goToRulesBtn").disabled);
  await p.waitForFunction(() => CURRENT_MODE === "corrida" && !!corridaTique, null, { timeout: 20000 }).catch(() => {}); // máquina lenta: o save volta depois do boot
  await p.waitForTimeout(300);
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
