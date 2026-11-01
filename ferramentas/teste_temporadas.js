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
    r.natalSemGafe = caosTemporadaGafeOutras().length === 0; // no Natal não tem gafe com a própria fala de Natal
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
      const s = { players, CURRENT_MODE, mc: typeof mc !== "undefined" ? mc : null, cartasPartida, mcAnunciar };
      mcAnunciar = () => {};
      CURRENT_MODE = "caos";
      players = [{ id: "a", name: "Ana", score: 5 }, { id: "b", name: "Beto", score: 3 }, { id: "c", name: "Cris", score: 0 }];
      cartasPartida = [1, 2, 3, 4];
      mc = { cont: { presente: 1 }, inv: {}, pc: {} };
      r.foraSo1Presente = mcPresenteTalvez() === false;
      players = s.players; CURRENT_MODE = s.CURRENT_MODE; mc = s.mc; cartasPartida = s.cartasPartida; mcAnunciar = s.mcAnunciar;
    }
    const t = caosTemporadaGafeTexto();
    r.gafeFalaErradaEConserta = /\.\.\./.test(t) && REACTIVE_VOICE.temporada.gafe.some((g) => t.includes(String(typeof g === "function" ? g() : g).replace(/^\[C\.A\.O\.S\.\]\s*/, ""))) && /Natal|Ho, ho|gorro|Pisca|bonzinhos/i.test(t);
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
