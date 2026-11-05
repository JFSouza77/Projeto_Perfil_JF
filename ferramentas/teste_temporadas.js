#!/usr/bin/env node
// Teste do motor das temporadas (docs/Temporadas.md): a temporada certa em cada data (inclusive as móveis), a
// prioridade quando duas caem juntas, todas aparecendo todo ano, a opção de desligar e o modo de teste.
//   node ferramentas/teste_temporadas.js
const { acharMestre, abrirNavegador } = require("./_navegador");
(async () => {
  const b = await abrirNavegador();
  const page = await (await b.newContext()).newPage();
  await page.route(/fonts\.|google/, (r) => r.abort());
  await page.addInitScript(() => {
    try {
      localStorage.setItem("perfil5_tutorial_visto", "x");
    } catch (e) {}
  });
  const url = "file://" + acharMestre();
  await page.goto(url);
  await page.waitForFunction(() => typeof temporadaDe === "function");
  const o = await page.evaluate(() => {
    const out = {};
    const id = (a, m, d) => (temporadaDe(new Date(a, m - 1, d, 15)) || { id: null }).id;
    const casos = [
      // [ano, mês, dia, esperado]
      [2026, 10, 31, "halloween"],
      [2026, 10, 20, "halloween"],
      [2026, 10, 19, null],
      [2026, 10, 12, "criancas"],
      [2026, 10, 6, "criancas"],
      [2026, 11, 10, null],
      [2026, 11, 27, "blackfriday"], // 4ª quinta de nov/2026 = 26
      [2026, 11, 29, "blackfriday"],
      [2026, 11, 30, null],
      [2026, 12, 1, "natal"],
      [2026, 12, 24, "natal"],
      [2026, 12, 31, "anoNovo"], // ganha do Natal
      [2027, 1, 1, "anoNovo"],
      [2027, 1, 2, "aniversario"],
      [2027, 1, 3, null],
      [2027, 2, 6, "carnaval"], // Páscoa 2027 = 28/3; Carnaval (terça) = 9/2
      [2027, 2, 9, "carnaval"],
      [2027, 2, 10, "carnaval"], // Quarta de Cinzas
      [2027, 2, 11, null],
      [2027, 3, 8, "mulher"],
      [2027, 3, 26, "pascoa"],
      [2027, 3, 28, "pascoa"],
      [2027, 3, 29, null],
      [2027, 5, 9, "maes"],
      [2027, 5, 10, null],
      [2027, 6, 1, "junina"],
      [2027, 6, 12, "namorados"], // ganha da Festa Junina
      [2027, 6, 30, "junina"],
      [2027, 8, 8, "pais"],
      [2027, 8, 22, "folclore"],
      [2027, 9, 7, "independencia"],
      [2027, 11, 26, "blackfriday"],
      [2026, 2, 17, "carnaval"], // Páscoa 2026 = 5/4
      [2026, 4, 3, "pascoa"],
      [2026, 5, 10, "maes"],
      [2026, 8, 9, "pais"],
    ];
    out.erradas = casos.filter(([a, m, d, e]) => id(a, m, d) !== e).map(([a, m, d, e]) => `${d}/${m}/${a}: ${id(a, m, d)} (esperado ${e})`);
    out.datasCertas = out.erradas.length === 0;
    out.quinze = TEMPORADAS.length === 15 && new Set(TEMPORADAS.map((t) => t.id)).size === 15;
    // todas aparecem em todo ano de 2026 a 2040
    const faltou = [];
    for (let a = 2026; a <= 2040; a++) {
      const vistas = new Set();
      for (let t = new Date(a, 0, 1, 15); t.getFullYear() === a; t.setDate(t.getDate() + 1)) {
        const s = temporadaDe(t);
        if (s) vistas.add(s.id);
      }
      TEMPORADAS.forEach((s) => vistas.has(s.id) || faltou.push(a + ":" + s.id));
    }
    out.faltou = faltou;
    out.todasTodoAno = faltou.length === 0;
    // Páscoa conferida em anos conhecidos
    const p = (a) => {
      const d = temporadaPascoa(a);
      return d.getDate() + "/" + (d.getMonth() + 1);
    };
    out.pascoa = p(2026) === "5/4" && p(2027) === "28/3" && p(2028) === "16/4" && p(2030) === "21/4" && p(2038) === "25/4";
    // opção desligada: nada; ligada de novo: volta
    acessCfg.temporadas = false;
    out.desligada = temporadaAtual(new Date(2026, 11, 24, 15)) === null;
    acessCfg.temporadas = true;
    out.ligada = (temporadaAtual(new Date(2026, 11, 24, 15)) || {}).id === "natal";
    // modo de teste pela chave do aparelho
    JFStore.setItem(TEMPORADA_TESTE_KEY, "halloween");
    out.forcada = (temporadaAtual(new Date(2026, 6, 1, 15)) || {}).id === "halloween";
    JFStore.setItem(TEMPORADA_TESTE_KEY, "nenhuma");
    out.forcadaNenhuma = temporadaAtual(new Date(2026, 11, 24, 15)) === null;
    JFStore.removeItem(TEMPORADA_TESTE_KEY);
    return out;
  });
  // ?temporada=natal na URL marca o <html>; desligar na Acessibilidade tira a marca
  await page.goto(url + "?temporada=natal");
  await page.waitForFunction(() => typeof temporadaAplicar === "function");
  o.urlMarcaHtml = await page.evaluate(() => document.documentElement.dataset.temporada === "natal");
  o.desligarTiraMarca = await page.evaluate(() => {
    acessCfg.temporadas = false;
    aplicarAcessibilidade();
    const ok = !document.documentElement.dataset.temporada;
    acessCfg.temporadas = true;
    aplicarAcessibilidade();
    return ok && document.documentElement.dataset.temporada === "natal";
  });
  // item 2: enfeite do Natal (atrás do conteúdo, sem toque) e selo na splash
  o.natalEnfeite = await page.evaluate(() => {
    const e = document.getElementById("temporadaEnfeite");
    const cs = e && getComputedStyle(e);
    return !!cs && cs.display === "block" && cs.pointerEvents === "none" && cs.zIndex === "-1" && cs.position === "fixed";
  });
  o.natalSelo = await page.evaluate(() => {
    const s = document.getElementById("splashTemporada");
    return !!s && !s.hidden && /Edição de Natal/.test(s.textContent);
  });
  // item 3: falas do Natal (15), piadas de avançar/voltar, gorro e a gafe de data (15 correções)
  Object.assign(o, await page.evaluate(() => {
    const r = {};
    const N = REACTIVE_VOICE.temporada && REACTIVE_VOICE.temporada.natal;
    r.natal15Falas = !!N && N.inicio.length === 5 && N.avancou.length === 5 && N.voltou.length === 5;
    r.gafe15Correcoes = (REACTIVE_VOICE.temporada.gafe || []).length === 15;
    r.natalFalasAtivas = caosTemporadaFalas() === N;
    const ditas = [];
    const orig = showToastMessage;
    const rnd = Math.random;
    showToastMessage = (m) => ditas.push(String(m));
    Math.random = () => 0.1;
    try {
      maybeShowMoveSpecialFlavor("Ana", 2, false);
      maybeShowMoveSpecialFlavor("Beto", -3, false);
    } finally {
      showToastMessage = orig;
      Math.random = rnd;
    }
    r.natalAvancouBonzinho = /Ana/.test(ditas[0] || "") && /2 casas/.test(ditas[0] || "") && N.avancou.some((f) => f("Ana", 2) === ditas[0].replace(/^.*?\[C\.A\.O\.S\.\]/, "[C.A.O.S.]").trim() || ditas[0].includes(f("Ana", 2).replace("[C.A.O.S.] ", "")));
    r.natalVoltouMalvado = /Beto/.test(ditas[1] || "") && /3 casas/.test(ditas[1] || "");
    r.natalSemGafe = !caosTemporadaGafeOutras().includes("natal"); // no Natal a gafe nunca é com a própria fala de Natal
    const cs = getComputedStyle(document.createElement("div"));
    // gorro: a regra existe no CSS montado
    r.natalGorroCss = [...document.styleSheets].some((sh) => {
      try {
        return [...sh.cssRules].some((ru) => /data-temporada="natal"\].*rede-fala-rosto/.test(ru.cssText) || /data-temporada="natal"\] \.jf-toast-overlay\.caos-emo/.test(ru.cssText));
      } catch (e) {
        return false;
      }
    });
    return r;
  }));
  // item 8: 10 cartas de Natal (entram só na época, espalhadas no começo, valendo o dobro, com selo)
  Object.assign(o, await page.evaluate(() => {
    const r = {};
    r.natal10Cartas = TEMPORADA_CARTAS.length === 10 && TEMPORADA_CARTAS.every((c) => c.temporada === "natal" && c.clues.length === 20);
    r.cartasNatalForaDoBaralhoFixo = !TEMPORADA_CARTAS.some((c) => ADULT_CARDS.includes(c));
    const modo = CURRENT_MODE, sp = players;
    players = [{ id: "a", name: "Ana", color: "#e94560", avatar: "🦊", score: 0, position: 0 }, { id: "b", name: "Beto", color: "#4ecdc4", avatar: "🐼", score: 0, position: 0 }];
    CURRENT_MODE = "classico";
    allCards = baralhoClassico();
    resetDeck();
    const ini = deck.slice(-50);
    r.cartasNatalEntramNoComeco = TEMPORADA_CARTAS.every((c) => ini.includes(c));
    r.baralhoNaoPassaDoLimite = deck.length <= deckLimiteModo(); // print do Natal (04/11): "409 de 400"
    r.cartaNatalValeODobro = temporadaMultCarta(TEMPORADA_CARTAS[0]) === 2 && temporadaMultCarta(ADULT_CARDS[0]) === 1;
    r.seloNaCartaDeNatal = /vale o dobro/.test(temporadaSeloCartaHtml(TEMPORADA_CARTAS[0])) && temporadaSeloCartaHtml(ADULT_CARDS[0]) === "";
    r.cartaNatalAchadaPeloId = cartaPorId("PESSOA-0901") === TEMPORADA_CARTAS[0];
    CURRENT_MODE = "express";
    r.expressSemCartasNatal = temporadaCartasDoModo().length === 0;
    CURRENT_MODE = modo; players = sp;
    return r;
  }));
  // item 7: 5 títulos de Natal no resumo da partida
  Object.assign(o, await page.evaluate(() => {
    const r = {};
    const salva = { players, history, cartasPartida };
    players = [
      { id: "a", name: "Ana", color: "#e94560", avatar: "🦊", errosPartida: 3, apoiosPartida: 1 },
      { id: "b", name: "Beto", color: "#4ecdc4", avatar: "🐼", errosPartida: 0, apoiosPartida: 0 },
      { id: "c", name: "Cris", color: "#ffd166", avatar: "🐸", errosPartida: 1, apoiosPartida: 3 },
    ];
    history = [
      { playerName: "Beto", cluesUsed: 2, timeTakenMs: 5000 },
      { playerName: "Beto", cluesUsed: 6, timeTakenMs: 7000 },
      { playerName: "Beto", cluesUsed: 4, timeTakenMs: 9000 },
      { playerName: "Cris", cluesUsed: 5, timeTakenMs: 20000 },
      { playerName: "Cris", cluesUsed: 7, timeTakenMs: 30000 },
    ];
    cartasPartida = [{ mestre: "a", quem: "b" }, { mestre: "a", quem: "c" }, { mestre: "a", quem: "b" }, { mestre: "b", quem: "c" }];
    const got = [];
    temporadaTitulosHtml((ic, tit, nome, desc, cor, meta) => (got.push([tit, meta.n]), ""));
    const m = Object.fromEntries(got);
    r.natal5Titulos = got.length === 5;
    r.papaiNoelProMestreQueMaisDeu = m["Papai Noel"] === "Ana";
    r.titulosCertos = m["Duende Ajudante"] === "Cris" && m["Rena Veloz"] === "Beto" && m["Estrela Guia"] === "Beto" && m["Boneco de Neve"] === "Ana";
    r.tituloComentavel = !!caosComentFato({ t: "natalNoel", n: "Ana", v: 3 });
    // o contador do Duende: mexer em outro jogador conta pra quem está na vez; mexer em si mesmo não
    const salvaR = responderIndex;
    const fakeMove = () => {};
    players.forEach((p) => (p.apoiosPartida = 0, p.position = 0));
    responderIndex = 0;
    const ren = { renderMiniScoreboard, renderScoreboard, afterMoveSpecial, maybeShowMoveSpecialFlavor, fxFloat };
    renderMiniScoreboard = renderScoreboard = afterMoveSpecial = maybeShowMoveSpecialFlavor = fxFloat = fakeMove;
    try {
      applySpecialMove(1, 2);
      applySpecialMove(2, -2);
      applySpecialMove(0, 2);
    } finally {
      Object.assign(window, {});
      renderMiniScoreboard = ren.renderMiniScoreboard; renderScoreboard = ren.renderScoreboard; afterMoveSpecial = ren.afterMoveSpecial; maybeShowMoveSpecialFlavor = ren.maybeShowMoveSpecialFlavor; fxFloat = ren.fxFloat;
      responderIndex = salvaR;
    }
    r.duendeContaQuemMexeNosOutros = players[0].apoiosPartida === 2;
    players = salva.players; history = salva.history; cartasPartida = salva.cartasPartida;
    return r;
  }));
  // item 6: cores e emojis do Natal, pergunta pro cadastrado e salvamento da temporada
  Object.assign(o, await page.evaluate(async () => {
    const r = {};
    const E = TEMPORADA_ESTILOS.natal;
    r.estilo5Cores5Emojis = E.cores.length === 5 && E.emojis.length === 5 && E.cores.every((c) => GRADIENTS[c]);
    r.paletaTemCoresNatal = E.cores.every((c) => coresDaPaleta().includes(c));
    r.emojisNatalNaLista = E.emojis.every((a) => avatarsForMode().includes(a));
    const salva = { players, render: typeof render === "function" ? render : null };
    JFStore.setItem(TEMPORADA_ESTILO_KEY, "{}");
    fichaUpd("Duda", (f) => (f.ultimoAvatar = "🦊"));
    const p = { id: "d1", name: "Duda", color: "GRAD_NATAL_GORRO", avatar: "🎅", score: 0, position: 0 };
    players = [p];
    let seguiu = 0;
    document.querySelectorAll(".caos-modal-ov").forEach((x) => x.remove());
    temporadaEstiloPerguntar(p, () => seguiu++);
    const ov = document.querySelector(".caos-modal-ov");
    r.perguntaApareceProCadastrado = !!ov && /estilo que não é o do seu cadastro/.test(ov.textContent) && /durante a temporada/.test(ov.textContent);
    const btns = ov ? [...ov.querySelectorAll("button")] : [];
    btns.find((b) => /Não/.test(b.textContent)).click();
    r.naoVoltaOEstiloDeSempre = p.avatar === "🦊" && !temporadaCorEh(p.color) && seguiu === 1;
    p.avatar = "🎄";
    p.color = "GRAD_NATAL_NEVE";
    temporadaEstiloPerguntar(p, () => seguiu++);
    [...document.querySelectorAll(".caos-modal-ov button")].find((b) => /Sim/.test(b.textContent)).click();
    const salvo = JSON.parse(JFStore.getItem(TEMPORADA_ESTILO_KEY) || "{}");
    r.simGuardaNaTemporada = p.avatar === "🎄" && salvo[nameKeyPlain("Duda")] && /^natal:/.test(salvo[nameKeyPlain("Duda")].chave) && seguiu === 2;
    temporadaEstiloPerguntar(p, () => seguiu++);
    r.naoPerguntaDeNovo = !document.querySelector(".caos-modal-ov") && seguiu === 3;
    const semCad = { id: "x", name: "Zeca Novo", color: "GRAD_NATAL_GORRO", avatar: "🎅" };
    temporadaEstiloPerguntar(semCad, () => seguiu++);
    r.semCadastroNaoPergunta = !document.querySelector(".caos-modal-ov") && seguiu === 4;
    // a ficha não guarda emoji de temporada (no fim da época, volta o de sempre sozinho)
    caosMemCadastro(p);
    r.fichaNaoGuardaEmojiDeTemporada = fichaGet("Duda").ultimoAvatar === "🦊";
    players = salva.players;
    return r;
  }));
  // item 5: lojinha de Natal (5 itens em cada loja, só na época, viram itens de sempre na compra)
  Object.assign(o, await page.evaluate(() => {
    const r = {};
    const nat = (cat) => Object.keys(cat).filter((k) => cat[k].temporada === "natal");
    r.loja5ItensNatalCadaLoja = nat(MC_LOJA).length === 5 && nat(CORRIDA_LOJA).length === 5;
    const basesOk = (cat) => nat(cat).every((k) => { const it = cat[k]; return it.surpresa ? it.surpresa.every((b) => cat[b] && !cat[b].temporada) : cat[it.base] && !cat[it.base].temporada; });
    r.lojaNatalViraItemDeSempre = basesOk(MC_LOJA) && basesOk(CORRIDA_LOJA);
    let okMc = true, okCo = true;
    for (let i = 0; i < 60; i++) {
      const v = Object.keys(lojaVitrineSortear(MC_LOJA, MC_VITRINE).estoque);
      if (v.filter((k) => MC_LOJA[k].temporada).length !== 2 || v.filter((k) => !MC_LOJA[k].temporada).length !== MC_VITRINE) okMc = false;
      const c = Object.keys(lojaVitrineSortear(CORRIDA_LOJA, CORRIDA_VITRINE).estoque);
      if (c.filter((k) => CORRIDA_LOJA[k].temporada).length !== 2 || c.filter((k) => !CORRIDA_LOJA[k].temporada).length !== CORRIDA_VITRINE) okCo = false;
    }
    r.vitrineNatalTem2DaTemporada = okMc && okCo;
    const meia = lojaEfeito(MC_LOJA, "natalMeia");
    const surp = lojaEfeito(MC_LOJA, "natalSurpresa");
    r.compraMeiaDa2Vidas = meia.base === "folego" && meia.qtd === 2;
    r.compraSurpresaSorteia = MC_LOJA.natalSurpresa.surpresa.includes(surp.base) && surp.qtd === 1;
    r.itemDeSempreNaoMuda = lojaEfeito(MC_LOJA, "corte").base === "corte" && lojaEfeito(MC_LOJA, "corte").qtd === 1;
    return r;
  }));
  // item 4: C.A.O.S. bonzinho (joia rara, nunca a 4ª; trava da rodada; até 3 presentes no Modo C.A.O.S.)
  Object.assign(o, await page.evaluate(() => {
    const r = {};
    const salva = { players, CURRENT_MODE, WIN_CONDITION, currentCard, gameEnded, joiasRodada, render, saveGameState, showToastMessage, mcAnunciar: typeof mcAnunciar === "function" ? mcAnunciar : null, mc: typeof mc !== "undefined" ? mc : null, cartasPartida };
    render = () => {};
    saveGameState = () => {};
    const ditas = [];
    showToastMessage = (m) => ditas.push(String(m));
    CURRENT_MODE = "classico";
    WIN_CONDITION = "joias";
    currentCard = { category: "ANO", clues: [] };
    gameEnded = false;
    caosSilenced = false;
    const nova = () => {
      caosEasterEggsUsed.delete("temporada_joia");
      joiasRodada = {};
    };
    players = [
      { id: "a", name: "Ana", gems: { ANO: 1, PESSOA: 1, LUGAR: 1 }, score: 0 },
      { id: "b", name: "Beto", gems: { ANO: 1 }, score: 0 },
    ];
    nova();
    const g1 = temporadaJoiaPresenteTalvez(true);
    r.joiaVaiPraQuemNaoTem3 = !!g1 && g1.id === "b" && players[0].gems.COISA === undefined && gemTotal(players[1]) === 2;
    r.joiaFalaDeNatal = ditas.some((d) => /joia/i.test(d));
    r.joiaUmaPorPartida = temporadaJoiaPresenteTalvez(true) === null;
    players = [
      { id: "a", name: "Ana", gems: { ANO: 1, PESSOA: 1, LUGAR: 1 }, score: 0 },
      { id: "b", name: "Beto", gems: { ANO: 1, PESSOA: 1, COISA: 1 }, score: 0 },
    ];
    nova();
    r.nuncaA4aJoia = temporadaJoiaPresenteTalvez(true) === null && players.every((p) => gemTotal(p) === 3);
    players = [{ id: "b", name: "Beto", gems: {}, score: 0 }, { id: "c", name: "Cris", gems: { ANO: 1, PESSOA: 1, LUGAR: 1 }, score: 0 }];
    nova();
    joiasRodada = { b: 2 };
    r.respeitaTrava = temporadaJoiaPresenteTalvez(true) === null;
    nova();
    WIN_CONDITION = "pontos";
    r.soOndeJoiaVale = temporadaJoiaPresenteTalvez(true) === null;
    WIN_CONDITION = "joias";
    // Modo C.A.O.S.: até 3 presentes no Natal
    CURRENT_MODE = "caos";
    mcAnunciar = () => {};
    players = [{ id: "a", name: "Ana", score: 5 }, { id: "b", name: "Beto", score: 3 }, { id: "c", name: "Cris", score: 0 }];
    cartasPartida = [1, 2, 3, 4];
    mc = { cont: { presente: 1 }, inv: {}, pc: {} };
    const p2 = mcPresenteTalvez();
    r.natalSegundoPresente = p2 === true && mc.cont.presente === 2;
    mc.cont.presente = 3;
    r.natalMax3Presentes = mcPresenteTalvez() === false;
    Object.assign(window, {});
    players = salva.players; CURRENT_MODE = salva.CURRENT_MODE; WIN_CONDITION = salva.WIN_CONDITION; currentCard = salva.currentCard; gameEnded = salva.gameEnded; joiasRodada = salva.joiasRodada;
    render = salva.render; saveGameState = salva.saveGameState; showToastMessage = salva.showToastMessage; if (salva.mcAnunciar) mcAnunciar = salva.mcAnunciar; mc = salva.mc; cartasPartida = salva.cartasPartida;
    return r;
  }));
  // Espírito natalino (JF, 04/11): mais feliz, menos estressado, mais paciência; aviso, carvão e perdão
  Object.assign(o, await page.evaluate(() => {
    const r = {};
    const sv = { players, caosFalarDepois, caosSilenced, gameEnded, stats: stats.totalDrawn, caosPartidaSerial };
    const ditas = [];
    caosFalarDepois = (m) => ditas.push(String(m));
    caosSilenced = false;
    gameEnded = false;
    caosPartidaSerial = 9001;
    r.espiritoRaivaEntraFraca = temporadaSentirFator("raiva") < 1 && temporadaSentirFator("tristeza") < 1;
    r.espiritoAlegriaEntraForte = temporadaSentirFator("alegria") > 1 && temporadaSentirFator("curiosidade") === 1;
    r.espiritoRaivaEsfriaRapido = temporadaDecaimento("raiva", 0.8) < 0.8 && temporadaDecaimento("alegria", 0.78) > 0.78;
    r.espiritoMaisPaciencia = temporadaPacienciaFator() < 1 && temporadaPacienciaRecupera() > 0.12 && temporadaDemoraFator() > 1;
    {
      // o mesmo erro deixa menos raiva no Natal
      caosCerebroFabrica(); // temperamento normal: o teste não depende do sorteado na carga
      caosSentir("raiva", 2, "teste");
      r.espiritoErroDaMenosRaiva = caosConsole.g.raiva > 0 && caosConsole.g.raiva < 2 * 0.8;
    }
    players = [{ id: "a", name: "Ana", score: 0, position: 0, errosPartida: 4 }, { id: "b", name: "Beto", score: 0, position: 0, errosPartida: 0 }];
    stats.totalDrawn = 10;
    // carvão: raiva alta e Ana errou 4 vezes
    let carvao = false;
    for (let i = 0; i < 30 && !carvao; i++) {
      caosConsole.g.raiva = 7;
      temporadaEspiritoEvento(0, "E");
      carvao = ditas.some((d) => /Ana/.test(d) && /Papai Noel|carvão|lista|Polo Norte|presente|renas|duende|meia/i.test(d));
    }
    r.espiritoCarvaoComNome = carvao;
    const nCarvao = ditas.length;
    for (let i = 0; i < 30; i++) {
      caosConsole.g.raiva = 7;
      temporadaEspiritoEvento(0, "E");
    }
    r.espiritoCarvaoUmaVezPorJogador = ditas.filter((d) => /Ana/.test(d)).length === 1;
    // quem errou pouco não ganha carvão (pode ganhar o aviso de Natal)
    caosConsole.g.raiva = 7;
    for (let i = 0; i < 30; i++) temporadaEspiritoEvento(1, "E");
    r.espiritoSemCarvaoPraQuemErrouPouco = !ditas.some((d) => /Beto/.test(d));
    // esfriou: perdoa (no máximo 2 vezes por partida)
    const antes = ditas.length;
    caosConsole.g.raiva = 1;
    temporadaEspiritoEvento(0, "A");
    const perdoou = ditas.slice(antes);
    r.espiritoPerdoaQuandoEsfria = perdoou.length === 1 && REACTIVE_VOICE.temporada.natal.perdao.some((f) => perdoou[0].includes(String(typeof f === "function" ? f() : f).replace(/^\[C\.A\.O\.S\.\]\s*/, "").slice(0, 20)));
    // aviso "sorte que é Natal" quando a raiva sobe (nova partida, sem ninguém pra carvão)
    caosPartidaSerial = 9002;
    players.forEach((p) => (p.errosPartida = 0));
    const a0 = ditas.length;
    for (let i = 0; i < 40; i++) {
      stats.totalDrawn = 20 + i * 5;
      caosConsole.g.raiva = 4;
      temporadaEspiritoEvento(1, "E");
    }
    r.espiritoAvisoNoMaximo3 = ditas.length - a0 >= 1 && ditas.length - a0 <= 3;
    {
      const tg = caosGerContexto(null).tags;
      r.geradorTemEtiquetaDaTemporada = tg.has("temporada_natal") && [...tg].some((t) => /^data_natal_/.test(t));
      players = [{ id: "a", name: "Ana", score: 0, position: 0 }];
      const g = caosGerarFala("escolherDica", players[0], { tags: ["emo_tedio"] });
      r.geradorEscolherDicaFala = /Ana/.test(g) && !/morde/.test(g);
      r.escolherSemNaoMorde = !REACTIVE_VOICE.avisoEscolha.some((f) => /morde/.test(String(f))) && REACTIVE_VOICE.avisoEscolha.length % 5 === 0;
    }
    r.espiritoFalasEmMultiploDe5 = ["espirito", "carvao", "perdao"].every((k) => REACTIVE_VOICE.temporada.natal[k].length % 5 === 0);
    caosConsoleReset();
    players = sv.players; caosFalarDepois = sv.caosFalarDepois; caosSilenced = sv.caosSilenced; gameEnded = sv.gameEnded; stats.totalDrawn = sv.stats; caosPartidaSerial = sv.caosPartidaSerial;
    return r;
  }));
  // item 10: Ano Novo (enfeite, selo, 15 falas + presentes, 5 cores, 5 emojis, 5 itens em cada lojinha)
  await page.goto(url + "?temporada=anoNovo");
  await page.waitForFunction(() => typeof temporadaAplicar === "function");
  Object.assign(o, await page.evaluate(() => {
    const r = {};
    const e = document.getElementById("temporadaEnfeite");
    r.anoNovoMarcaEEnfeite = document.documentElement.dataset.temporada === "anoNovo" && !!e && getComputedStyle(e).display === "block" && getComputedStyle(e).pointerEvents === "none";
    const selo = document.getElementById("splashTemporada");
    r.anoNovoSelo = !!selo && !selo.hidden && /Ano Novo/.test(selo.textContent);
    const A = REACTIVE_VOICE.temporada.anoNovo;
    r.anoNovo15Falas = !!A && A.inicio.length === 5 && A.avancou.length === 5 && A.voltou.length === 5 && caosTemporadaFalas() === A;
    r.anoNovoPresentesComFalaPropria = A.presenteJoia.length === 5 && A.presentePonto.length === 5 && temporadaFalasDe("presenteJoia") === A.presenteJoia && temporadaFalasDe("presentePonto") === A.presentePonto;
    r.anoNovoAvancouFala = /Ana/.test(A.avancou[0]("Ana", 2)) && /2 casas/.test(A.avancou[0]("Ana", 2)) && /1 casa\b/.test(A.voltou[0]("Ana", 1));
    const E = TEMPORADA_ESTILOS.anoNovo;
    r.anoNovo5Cores5Emojis = E.cores.length === 5 && E.emojis.length === 5 && E.nomesCores.length === 5 && E.cores.every((c) => GRADIENTS[c] && coresDaPaleta().includes(c)) && E.emojis.every((x) => avatarsForMode().includes(x));
    r.anoNovoSemCoresDoNatal = !TEMPORADA_ESTILOS.natal.cores.some((c) => coresDaPaleta().includes(c));
    const an = (cat) => Object.keys(cat).filter((k) => cat[k].temporada === "anoNovo");
    const basesOk = (cat) => an(cat).every((k) => { const it = cat[k]; return it.surpresa ? it.surpresa.every((b) => cat[b] && !cat[b].temporada) : cat[it.base] && !cat[it.base].temporada; });
    r.anoNovoLoja5Cada = an(MC_LOJA).length === 5 && an(CORRIDA_LOJA).length === 5 && basesOk(MC_LOJA) && basesOk(CORRIDA_LOJA);
    let ok = true;
    for (let i = 0; i < 60; i++) {
      const v = Object.keys(lojaVitrineSortear(MC_LOJA, MC_VITRINE).estoque).filter((k) => MC_LOJA[k].temporada);
      const c = Object.keys(lojaVitrineSortear(CORRIDA_LOJA, CORRIDA_VITRINE).estoque).filter((k) => CORRIDA_LOJA[k].temporada);
      if (v.length !== 2 || c.length !== 2 || v.concat(c).some((k) => !/^anoNovo/.test(k))) ok = false;
    }
    r.anoNovoVitrineSoDoAnoNovo = ok;
    r.anoNovoBonzinho = temporadaBonzinha() && temporadaSentirFator("raiva") < 1;
    {
      // item 10: 5 títulos de Ano Novo, cada um com dado de verdade e comentário do C.A.O.S.
      const sh = history, sp = players;
      players = [{ id: "a", name: "Ana", color: "#e94560", avatar: "🦊", errosPartida: 3 }, { id: "b", name: "Beto", color: "#4ecdc4", avatar: "🐼", errosPartida: 0 }];
      history = [
        { playerName: "Beto", cluesUsed: 4, timeTakenMs: 20000, points: 16 },
        { playerName: "Ana", cluesUsed: 2, timeTakenMs: 6000, points: 18 },
        { playerName: "Ana", cluesUsed: 7, timeTakenMs: 30000, points: 13 },
      ];
      const got = [];
      temporadaTitulosHtml((ic, tit, nome, desc, cor, meta) => (got.push([tit, meta.n, meta.t]), ""));
      history = sh; players = sp;
      const tem = (tit, n) => got.some((g) => g[0] === tit && g[1] === n);
      r.anoNovo5Titulos = got.length === 5 && tem("Show de Fogos", "Ana") && tem("Champanhe Estourada", "Ana") && tem("Pé Direito", "Beto") && tem("Meia-Noite em Ponto", "Ana") && tem("Promessa de Ano Novo", "Ana");
      r.anoNovoTitulosComentaveis = got.every((g) => !!caosComentFato({ t: g[2], n: g[1], v: 3 })) && got.every((g) => CAOS_COMENT_TOM[g[2]]);
      r.anoNovoCabecalho = /Ano Novo/.test(temporadaTitulosCabecalho());
    }
    {
      // calmo como no Natal, mas sem Papai Noel e carvão na fala
      const sf = caosFalarDepois, ditas = [], sp = players;
      caosFalarDepois = (m) => ditas.push(String(m));
      players = [{ id: "a", name: "Ana", score: 0, position: 0, errosPartida: 5 }];
      caosConsoleReset();
      for (let i = 0; i < 20; i++) { caosConsole.g.raiva = 8; temporadaEspiritoEvento(0, "E"); }
      caosConsole.g.raiva = 0;
      temporadaEspiritoEvento(0, "A");
      caosFalarDepois = sf; players = sp;
      caosConsoleReset();
      r.anoNovoSemCarvaoDoNatal = ditas.length === 0;
    }
    return r;
  }));
  await page.goto(url + "?temporada=nenhuma");
  await page.waitForFunction(() => typeof temporadaAplicar === "function");
  o.semTemporadaSemEnfeite = await page.evaluate(() => {
    const e = document.getElementById("temporadaEnfeite");
    const s = document.getElementById("splashTemporada");
    return (!e || getComputedStyle(e).display === "none") && (!s || s.hidden);
  });
  Object.assign(o, await page.evaluate(() => {
    const r = {};
    r.foraSemFalasTemporada = caosTemporadaFalas() === null;
    r.foraNaoEhBonzinho = !temporadaBonzinha();
    {
      let ok = true;
      for (let i = 0; i < 60; i++) {
        if (Object.keys(lojaVitrineSortear(MC_LOJA, MC_VITRINE).estoque).some((k) => MC_LOJA[k].temporada)) ok = false;
        if (Object.keys(lojaVitrineSortear(CORRIDA_LOJA, CORRIDA_VITRINE).estoque).some((k) => CORRIDA_LOJA[k].temporada)) ok = false;
      }
      r.foraVitrineSemNatal = ok;
      {
        const modo = CURRENT_MODE, sp = players;
        players = [{ id: "a", name: "Ana", color: "#e94560", avatar: "🦊", score: 0, position: 0 }, { id: "b", name: "Beto", color: "#4ecdc4", avatar: "🐼", score: 0, position: 0 }];
        CURRENT_MODE = "classico";
        allCards = baralhoClassico();
        resetDeck();
        r.foraSemCartasDeNatal = !deck.some((c) => c.temporada) && temporadaMultCarta(TEMPORADA_CARTAS[0]) === 1;
        CURRENT_MODE = modo; players = sp;
      }
      r.foraSemTitulosDeNatal = temporadaTitulosHtml(() => "x") === "";
      r.foraSemCoresEEmojisDeNatal = !coresDaPaleta().some(temporadaCorEh) && !avatarsForMode().some(temporadaEmojiEh);
      JFStore.setItem(TEMPORADA_ESTILO_KEY, JSON.stringify({ duda: { chave: "natal:2025", cor: "GRAD_NATAL_GORRO", avatar: "🎅" } }));
      r.salvamentoVenceNoFimDaTemporada = Object.keys(temporadaEstiloLer()).length === 0;
    }
    {
      const s = { players, CURRENT_MODE, mc: typeof mc !== "undefined" ? mc : null, cartasPartida, mcAnunciar };
      mcAnunciar = () => {};
      CURRENT_MODE = "caos";
      players = [{ id: "a", name: "Ana", score: 5 }, { id: "b", name: "Beto", score: 3 }, { id: "c", name: "Cris", score: 0 }];
      cartasPartida = [1, 2, 3, 4];
      mc = { cont: { presente: 1 }, inv: {}, pc: {} };
      r.foraSo1Presente = mcPresenteTalvez() === false;
      // fora do Natal, o presente às vezes vem com piada de data
      const sf = caosFalarDepois, ditas = [];
      caosFalarDepois = (m) => ditas.push(String(m));
      const ss = caosSilenced;
      caosSilenced = false;
      let deu = 0;
      for (let i = 0; i < 40; i++) {
        mc = { cont: {}, inv: {}, pc: {} };
        if (mcPresenteTalvez()) deu++;
      }
      caosFalarDepois = sf;
      caosSilenced = ss;
      r.foraPresenteComPiadaDeData = deu === 40 && ditas.length > 5 && ditas.length < 35 && ditas.every((d) => /Cris/.test(d) && /aniversário|desaniversário|Natal adiantado|presente|generoso|dia nacional/i.test(d));
      {
        // calendário do presente (JF, 04/11): adiantado, no dia, atrasado
        const m = (a, mes, d) => { const x = temporadaPresenteMomento(new Date(a, mes - 1, d, 15)); return x ? x.id + ":" + x.momento : "-"; };
        const casos = [
          [2026, 10, 1, "criancas:adiantado"], [2026, 10, 11, "criancas:adiantado"], [2026, 10, 12, "criancas:nodia"],
          [2026, 10, 13, "criancas:atrasado"], [2026, 10, 20, "criancas:atrasado"], [2026, 10, 21, "halloween:nodia"],
          [2026, 10, 31, "halloween:nodia"], [2026, 11, 5, "blackfriday:adiantado"], [2026, 11, 27, "blackfriday:nodia"],
          [2026, 11, 30, "blackfriday:nodia"], [2026, 12, 2, "natal:adiantado"], [2026, 12, 24, "natal:nodia"],
          [2026, 12, 25, "natal:nodia"], [2026, 12, 27, "natal:atrasado"], [2026, 12, 30, "anoNovo:adiantado"],
          [2026, 12, 31, "anoNovo:nodia"], [2027, 1, 1, "anoNovo:nodia"], [2027, 1, 2, "aniversario:nodia"],
          [2027, 1, 5, "anoNovo:atrasado"], [2027, 2, 1, "carnaval:adiantado"], [2027, 2, 9, "carnaval:nodia"],
          [2027, 2, 12, "carnaval:atrasado"], [2027, 3, 8, "mulher:nodia"], [2027, 3, 28, "pascoa:nodia"],
          [2027, 3, 22, "pascoa:adiantado"], [2027, 4, 1, "pascoa:atrasado"], [2027, 5, 9, "maes:nodia"],
          [2027, 6, 10, "namorados:adiantado"], [2027, 6, 12, "namorados:nodia"], [2027, 6, 14, "namorados:atrasado"],
          [2027, 6, 20, "junina:nodia"], [2027, 8, 8, "pais:nodia"], [2027, 8, 22, "folclore:nodia"],
          [2027, 9, 7, "independencia:nodia"], [2027, 7, 15, "-"], [2027, 4, 20, "-"],
        ];
        r.presenteCalendarioErradas = casos.filter(([a, mes, d, e]) => m(a, mes, d) !== e).map(([a, mes, d, e]) => `${d}/${mes}/${a}: ${m(a, mes, d)} (esperado ${e})`);
        const D = REACTIVE_VOICE.temporada.presenteData;
        r.presenteDataTodaDataTemFala = TEMPORADA_PRESENTE_DATAS.every((e) => D[e.id] && D[e.id].nodia && D[e.id].nodia.length >= 5 && (!e.antes || (D[e.id].adiantado || []).length >= 5) && (!e.depois || (D[e.id].atrasado || []).length >= 5));
        r.presenteDataEmMultiploDe5 = Object.values(D).every((b) => Object.values(b).every((l) => l.length % 5 === 0));
        r.presenteDataComNome = Object.values(D).every((b) => Object.values(b).every((l) => l.every((f) => f("Zé").includes("Zé"))));
        r.presenteDataAdiantadoAtrasado = D.criancas.adiantado.some((f) => /adiantado/.test(f("Zé"))) && D.criancas.atrasado.some((f) => /atrasado/.test(f("Zé"))) && !D.criancas.nodia.some((f) => /adiantado|atrasado/.test(f("Zé")));
      }
      r.foraSemEspiritoNatalino = temporadaSentirFator("raiva") === 1 && temporadaPacienciaFator() === 1 && temporadaDemoraFator() === 1;
      players = s.players; CURRENT_MODE = s.CURRENT_MODE; mc = s.mc; cartasPartida = s.cartasPartida; mcAnunciar = s.mcAnunciar;
    }
    const t = caosTemporadaGafeTexto();
    r.gafeFalaErradaEConserta = /\.\.\./.test(t) && REACTIVE_VOICE.temporada.gafe.some((g) => t.includes(String(typeof g === "function" ? g() : g).replace(/^\[C\.A\.O\.S\.\]\s*/, ""))) && /Natal|Ho, ho|gorro|Pisca|bonzinhos|Ano Novo|ondas|champanhe|Fogos|Dez, nove/i.test(t);
    const modo = CURRENT_MODE;
    CURRENT_MODE = "junior";
    let jr = false;
    for (let i = 0; i < 200; i++) jr = jr || caosTemporadaGafePode();
    CURRENT_MODE = "classico";
    let n = 0;
    for (let i = 0; i < 4000; i++) if (caosTemporadaGafePode()) n++;
    CURRENT_MODE = modo;
    r.gafeNuncaNoJunior = !jr;
    r.gafeRara = n > 100 && n < 400; // ~6%
    acessCfg.temporadas = false;
    r.gafeDesligada = caosTemporadaGafeOutras().length === 0;
    acessCfg.temporadas = true;
    return r;
  }));
  o.botaoNaAcessibilidade = await page.evaluate(() => {
    document.querySelectorAll(".caos-modal-ov").forEach((x) => x.remove());
    acessPainelAbrir();
    return !!document.querySelector('[data-tog="temporadas"]');
  });
  let falhas = 0;
  for (const [k, v] of Object.entries(o)) {
    if (Array.isArray(v)) {
      if (v.length) console.log("      " + k + ": " + v.slice(0, 8).join(" · "));
      continue;
    }
    console.log((v ? "ok   " : "FALHA") + " " + k);
    if (!v) falhas++;
  }
  console.log(falhas ? "TEMPORADAS COM PROBLEMA" : "TEMPORADAS OK");
  await b.close();
  process.exit(falhas ? 1 : 0);
})().catch((e) => {
  console.log("erro:", e.message);
  process.exit(1);
});
