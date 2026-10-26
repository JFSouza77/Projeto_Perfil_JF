#!/usr/bin/env node
// Teste: vários jogadores no mesmo celular convidado (26/10/2026, pedido do JF).
// Transporte local (host e convidado no mesmo navegador). Confere:
//  1. o convidado cria o 1º jogador e depois adiciona um 2º no mesmo aparelho (sem perder o 1º);
//  2. no host, os dois assentos ficam com a mesma sessão; no celular aparecem os dois ("Neste celular");
//  3. o host manda um painel pra cada jogador e o celular guarda os dois;
//  4. na partida, o celular mostra sozinho quem é a vez (troca de Pedro pra Elisa quando a vez muda);
//  5. tela de espera viva: dica, tutorial rápido e "Pergunte ao C.A.O.S." (o C.A.O.S. responde);
//  6. host automático: quem foi cadastrado no aparelho do host joga nele sem marcar nada;
//  7. o celular cai e volta: todos os jogadores dele voltam juntos (1.8).
//   node ferramentas/teste_varios_no_celular.js [mestre.html]
"use strict";
const { acharMestre, abrirNavegador } = require("./_navegador");
const ARQ = acharMestre(process.argv[2]);
(async () => {
  const b = await abrirNavegador();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/^https?:/, (r) => r.abort());
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("perfil5_tutorial_visto", "x");
      localStorage.setItem("perfil5_tab_lobby", "0");
      localStorage.setItem("perfil5_tut_vitoria_vistos", JSON.stringify(["casa", "tabuleiro", "pontos", "joias"]));
      Object.keys(localStorage).filter((k) => k.startsWith("perfil5_rede_eu_")).forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
    window.__REDE_SERVIDOR = false;
  });
  const erros = [];
  const abrir = async (hash) => {
    const pg = await ctx.newPage();
    pg.on("pageerror", (e) => erros.push(e.message.slice(0, 160)));
    await pg.goto("file://" + ARQ + (hash || ""));
    return pg;
  };
  const esperar = (pg, fn, a, ms) => pg.waitForFunction(fn, a, { timeout: ms || 10000 }).then(() => true, () => false);
  const ok = [];
  const conf = (n, v) => ok.push([n, !!v]);

  // host: sala aberta antes de cadastrar (o convidado cria o próprio jogador)
  const host = await abrir("");
  await host.waitForFunction(() => typeof redeAbrirSala === "function" && !document.getElementById("goToRulesBtn").disabled);
  const sala = await host.evaluate(() => {
    document.querySelectorAll(".caos-modal-ov, #novidadesModal").forEach((o) => o.remove());
    caosSilenced = true;
    CURRENT_FORMAT = "versus";
    selectMode("classico");
    WIN_CONDITION = "tabuleiro";
    players = [{ id: jogadorIdNovo(), name: "Ana", score: 0, position: 0, isBlocked: false, color: PLAYER_COLORS[0], avatar: "😀", humor: "normal", ageBracket: null, team: null, gems: {}, idade: "maior" }];
    return redeAbrirSala("local");
  });
  const idade = await host.evaluate(() => IDADE_OPCOES[IDADE_OPCOES.length - 1].id);

  const g = await abrir("#sala=" + sala + "&local");
  conf("Convidado chega no formulário de cadastro", await esperar(g, () => rede && rede.estado === "escolhendo" && !!rede.cadastro, null, 15000));
  await g.evaluate((idade) => redePedirEntrada({ nome: "Pedro", idade, humor: "normal" }), idade);
  await esperar(host, () => Object.keys(rede.pedidos).length === 1);
  // tela de espera (o host ainda não aceitou): dica, tutorial e perguntas pro C.A.O.S.
  conf("Esperando o host: dica, tutorial e 5 perguntas na tela", await esperar(g, () => rede.estado === "aguardando" && !!document.getElementById("redeDicaEspera") && !!document.getElementById("redeTutRapido") && document.querySelectorAll("[data-perg]").length === 5));
  await g.evaluate(() => document.querySelector('[data-perg="oQueFaco"]').click());
  conf("Pergunta ao C.A.O.S.: ele responde na tela", await g.evaluate(() => { const r = document.getElementById("redeCaosResp"); return !!r && !r.hidden && !/=>|CAOS_PREFIXO|function/.test(r.textContent) && REACTIVE_VOICE.esperaSala.oQueFaco.some((t) => r.textContent.includes(redeFalaTexto(t))); }));
  await g.evaluate(() => document.getElementById("redeTutRapido").click());
  conf("Tutorial rápido abre no celular", await g.evaluate(() => !!document.getElementById("tutorialOverlay")));
  await g.evaluate(() => document.getElementById("tutorialOverlay")?.remove());
  await host.evaluate(() => redeAprovarTodos());
  conf("1º jogador (Pedro) entra", await esperar(g, () => rede.estado === "dentro" && (rede.euLista || []).length === 1));
  const pedroId = await g.evaluate(() => rede.eu);

  // adiciona a Elisa no MESMO celular
  await g.evaluate(() => redeConvAdicionarJogador());
  conf("Botão de adicionar abre o formulário (modo 'mais um')", await g.evaluate(() => rede.adicionando === true && rede.estado === "escolhendo"));
  await g.evaluate((idade) => redePedirEntrada({ nome: "Elisa", idade, humor: "normal" }), idade);
  await esperar(host, () => Object.keys(rede.pedidos).length === 1);
  await host.evaluate(() => redeAprovarTodos());
  conf("2º jogador (Elisa) entra sem tirar o Pedro", await esperar(g, () => (rede.euLista || []).length === 2 && rede.euLista.includes(rede.eu)));
  const elisaId = await g.evaluate((p) => rede.euLista.find((x) => x !== p), pedroId);
  conf("No host: os dois assentos com a mesma sessão", await host.evaluate(([p, e]) => !!rede.assentos[p] && !!rede.assentos[e] && rede.assentos[p].sessao === rede.assentos[e].sessao, [pedroId, elisaId]));
  conf("No host: os três jogadores no cadastro", await host.evaluate(() => players.length === 3));
  conf("Lobby do celular mostra 'Neste celular' com os dois", await esperar(g, () => document.querySelectorAll("#telao .rede-eu-chip").length === 2));
  // 1.8: o celular cai (recarrega a página) e volta com os dois, sem precisar adicionar de novo
  await g.reload();
  conf("Celular recarregou: Pedro e Elisa voltam juntos", await esperar(g, ([p, e]) => typeof rede !== "undefined" && rede && rede.estado === "dentro" && (rede.euLista || []).includes(p) && rede.euLista.includes(e), [pedroId, elisaId], 15000));
  conf("No host: os dois de volta na mesma sessão nova", await esperar(host, ([p, e]) => !!rede.assentos[p] && !!rede.assentos[e] && rede.assentos[p].sessao === rede.assentos[e].sessao && redeOnline(rede.assentos[e]), [pedroId, elisaId]));
  conf("Celular guarda um painel pra cada jogador", await esperar(g, ([p, e]) => !!(rede.painelPorJid || {})[p] && !!(rede.painelPorJid || {})[e], [pedroId, elisaId]));

  // partida: vez do Pedro, depois da Elisa
  await host.evaluate(([p]) => {
    const iP = jogadorIdxPorId(p);
    starterDrawCount = 1;
    mestreIndex = 0;
    responderIndex = iP;
    ["splashScreen", "welcomeScreen", "playerPanel", "orderRevealSection"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });
    document.getElementById("gameScreen").style.display = "block";
    document.getElementById("playAreaSection").style.display = "block";
    beginGameplay();
    mestreIndex = 0;
    responderIndex = iP;
    if (activeToastState) closeActiveToast();
    render();
    redeHostPublicar(true);
  }, [pedroId]);
  conf("Host automático: a Ana (cadastrada no host) joga nele sem marcar", await esperar(host, () => !!rede.hostEu && players[0] && rede.hostEu === players[0].id));
  conf("Host não abre o painel perguntando quem joga aqui", await host.evaluate(() => !document.getElementById("redePainel") && !document.querySelector(".caos-aviso-ov")));
  conf("Na vez do Pedro, o celular mostra o Pedro", await esperar(g, (p) => rede.retrato && rede.retrato.iniciada && rede.retrato.vezId === p && rede.eu === p, pedroId, 12000));
  await host.evaluate(([e]) => {
    responderIndex = jogadorIdxPorId(e);
    render();
    redeHostPublicar(true);
  }, [elisaId]);
  conf("Quando a vez passa pra Elisa, o celular troca sozinho", await esperar(g, (e) => rede.retrato && rede.retrato.vezId === e && rede.eu === e, elisaId, 12000));
  conf("O painel ativo é o da Elisa", await g.evaluate((e) => rede.painel === (rede.painelPorJid || {})[e], elisaId));
  // troca manual pelo chip
  await g.evaluate((p) => redeConvDefinirAtivo(p), pedroId);
  conf("Troca manual pelo chip funciona", await g.evaluate((p) => rede.eu === p, pedroId));

  await b.close();
  let tudo = true;
  ok.forEach(([n, v]) => {
    console.log(`${v ? "ok    " : "FALHOU"}  ${n}`);
    if (!v) tudo = false;
  });
  if (erros.length) {
    console.log("Erros na página: " + erros.slice(0, 4).join(" | "));
    tudo = false;
  }
  console.log(tudo ? "VÁRIOS NO CELULAR OK" : "VÁRIOS NO CELULAR FALHOU");
  process.exit(tudo ? 0 : 1);
})();
