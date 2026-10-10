#!/usr/bin/env node
// Teste da rede (1.7.9.7 · Parte 3; 1.7.9.10 · Final).
// O mesmo roteiro roda duas vezes:
//   · LOCAL: host e convidados em abas do mesmo navegador (BroadcastChannel);
//   · INTERNET: pelo PeerJS de verdade (WebRTC), com um servidor PeerJS local (pacote "peer").
// Confere: escolher lugar · resposta só pro Mestre · painel de cada um (o host calcula) · papéis ·
// comando repetido aplicado uma vez · revisão velha · lixo · relógio adiantado · versão diferente ·
// votação do Descartar · intervalo · reconexão · lugar ocupado · convidado não grava · e, na versão
// publicada, convidado sem catálogo de cartas.
//   node ferramentas/teste_rede.js [mestre.html] [publicada.html] [--so=local|internet]
"use strict";
const fs = require("fs");
const path = require("path");
const { acharMestre } = require("./_navegador");
const args = process.argv.slice(2);
const ARQ = acharMestre(args[0] && args[0].endsWith(".html") ? args[0] : null);
const PUB = (() => {
  if (args[1] && args[1].endsWith(".html")) return path.resolve(args[1]);
  const v = path.basename(ARQ).replace("Perfil_JF_Mestre_", "Perfil_JF_");
  const p = path.join(path.dirname(ARQ), v);
  return fs.existsSync(p) ? p : null;
})();
const SO = (args.find((a) => a.startsWith("--so=")) || "").slice(5);
// --servidor=PORTA: usa o servidor da sala nosso (servidor/worker.js rodando com "wrangler dev") no lugar do "peer"
const SERVIDOR = +((args.find((a) => a.startsWith("--servidor=")) || "").slice(11)) || 0;
const CHAVE = SERVIDOR ? "perfiljf" : "peerjs";

async function navegador() {
  const { chromium } = require("playwright-core");
  const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium", process.env.CHROMIUM].find((f) => f && fs.existsSync(f));
  // WebRTC entre abas: endereço local de verdade (sem o disfarce mDNS)
  return chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ["--disable-features=WebRtcHideLocalIpsWithMdns"] });
}
async function servidorPeer() {
  let express, ExpressPeerServer;
  try {
    express = require("express");
    ({ ExpressPeerServer } = require("peer"));
  } catch (e) {
    return null;
  }
  const app = express();
  const srv = await new Promise((ok) => {
    const s = app.listen(0, "127.0.0.1", () => ok(s));
  });
  app.use("/", ExpressPeerServer(srv, { path: "/" }));
  return { porta: srv.address().port, fechar: () => srv.close() };
}

// 1.7.9.9 · Partida online salva e sem sala pra voltar: ao abrir o jogo, ela é encerrada (não continua aqui)
async function rodarOrfa(b) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/^https?:/, (r) => r.abort());
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("perfil5_tutorial_visto", "x");
      localStorage.setItem("perfil5_tut_vitoria_vistos", JSON.stringify(["casa", "tabuleiro", "pontos", "joias"]));
    } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
  });
  const erros = [], ok = [];
  const pg = await ctx.newPage();
  pg.on("pageerror", (e) => erros.push(e.message.slice(0, 160)));
  await pg.goto("file://" + ARQ);
  await pg.waitForFunction(() => typeof sorteioSemear === "function" && !document.getElementById("goToRulesBtn").disabled);
  await pg.evaluate(async () => {
    document.querySelectorAll(".caos-modal-ov, #novidadesModal").forEach((o) => o.remove());
    caosSilenced = true;
    CURRENT_FORMAT = "versus";
    players = ["Ana", "Beto"].map((n, i) => ({ id: jogadorIdNovo(), name: n, score: 0, position: 0, isBlocked: false, color: PLAYER_COLORS[i], avatar: "😀", humor: "normal", ageBracket: null, team: null, gems: {} }));
    selectMode("classico");
    starterDrawCount = 1;
    mestreIndex = 0;
    responderIndex = 1;
    ["splashScreen", "welcomeScreen", "playerPanel", "orderRevealSection"].forEach((id) => {
      const e = document.getElementById(id);
      if (e) e.style.display = "none";
    });
    document.getElementById("gameScreen").style.display = "block";
    document.getElementById("playAreaSection").style.display = "block";
    beginGameplay();
    await new Promise((r) => setTimeout(r, 300));
    partidaOnline = true; // teve gente em outro aparelho
    saveGameState();
    if (JFStore.flushNow) await JFStore.flushNow();
  });
  await pg.reload();
  await pg.waitForFunction(() => typeof partidaOnline !== "undefined" && starterChosen, null, { timeout: 15000 });
  ok.push(["[online salvo] Abriu de novo sem sala pra voltar: avisa que a sala foi encerrada", await pg.waitForFunction(() => !!document.getElementById("redeOrfa"), null, { timeout: 10000 }).then(() => true, () => false)]);
  await pg.evaluate(() => document.getElementById("redeOrfaOk") && document.getElementById("redeOrfaOk").click());
  ok.push(["[online salvo] A partida fica encerrada (não continua neste aparelho)", await pg.waitForFunction(() => gameEnded, null, { timeout: 8000 }).then(() => true, () => false)]);
  await ctx.close();
  return { ok, erros };
}
// 1.7.9.8 · Código sorteado já em uso por outro grupo: a sala nova troca de código (não entra na sala dos outros)
async function rodarColisao(b, porta) {
  const ctx = await b.newContext();
  await ctx.addInitScript("window.__CHAVE = " + JSON.stringify(CHAVE));
  await ctx.route(/^https?:/, (r) => (r.request().url().startsWith("http://127.0.0.1:" + porta) ? r.continue() : r.abort()));
  await ctx.addInitScript((porta) => {
    try {
      localStorage.setItem("perfil5_tutorial_visto", "x");
    } catch (e) {}
    window.__REDE_PEER_CONFIG = { host: "127.0.0.1", port: porta, path: "/", secure: false, key: window.__CHAVE || "peerjs", config: { iceServers: [] } };
  }, porta);
  const erros = [], ok = [];
  const abrir = async () => {
    const pg = await ctx.newPage();
    pg.on("pageerror", (e) => erros.push(e.message.slice(0, 160)));
    await pg.goto("file://" + ARQ);
    await pg.waitForFunction(() => typeof redeAbrirSala === "function" && !document.getElementById("goToRulesBtn").disabled);
    return pg;
  };
  const outro = await abrir();
  const codigo = await outro.evaluate(() => redeAbrirSala("internet"));
  await outro.waitForFunction(() => rede && rede.transporte.estado === "aberta", null, { timeout: 15000 });
  const eu = await abrir();
  await eu.evaluate((c) => {
    window.__REDE_SALA_TESTE = c;
    redeAbrirSala("internet");
  }, codigo);
  const trocou = await eu.waitForFunction((c) => rede && rede.papel === "host" && rede.sala !== c && rede.transporte.estado === "aberta", codigo, { timeout: 30000 }).then(() => true, () => false);
  ok.push(["[internet] Código sorteado já em uso: a sala nova troca de código e continua host", trocou]);
  ok.push(["[internet] O outro grupo continua com a sala dele", await outro.evaluate((c) => rede && rede.papel === "host" && rede.sala === c, codigo)]);
  await ctx.close();
  return { ok, erros };
}
// 1.7.10 · Servidor da sala nosso (servidor/worker.js no "wrangler dev") com o público ("peer" local) de reserva:
// o host abre nos dois, a lista de salas da rede mostra a sala, e um convidado sem o nosso entra pelo público.
async function rodarServidorNosso(b, nosso, publico) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/^https?:/, (r) => (r.request().url().startsWith("http://127.0.0.1:") ? r.continue() : r.abort()));
  await ctx.addInitScript(([nosso, publico]) => {
    try {
      localStorage.setItem("perfil5_tutorial_visto", "x");
      Object.keys(localStorage).filter((k) => k.startsWith("perfil5_rede_eu_")).forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
    window.__REDE_SERVIDOR = { host: "127.0.0.1", port: window.__NOSSO_MORTO ? 9 : nosso, secure: false };
    window.__REDE_PEER_CONFIG = { host: "127.0.0.1", port: publico, path: "/", secure: false, key: "peerjs", config: { iceServers: [] } };
  }, [nosso, publico]);
  const erros = [], ok = [];
  const conf = (n, v) => ok.push(["[servidor nosso] " + n, !!v]);
  const abrir = async (hash, antes) => {
    const pg = await ctx.newPage();
    pg.on("pageerror", (e) => erros.push(e.message.slice(0, 160)));
    if (antes) await pg.addInitScript(antes);
    await pg.goto("file://" + ARQ + (hash || ""));
    await pg.waitForFunction(() => typeof redeAbrirSala === "function");
    return pg;
  };
  const esperar = (pg, fn, a, ms) => pg.waitForFunction(fn, a, { timeout: ms || 15000 }).then(() => true, () => false);
  const host = await abrir("");
  await host.waitForFunction(() => !document.getElementById("goToRulesBtn").disabled);
  const sala = await host.evaluate(() => redeAbrirSala("internet"));
  conf("Sala aberta (servidor nosso e o público de reserva)", await esperar(host, () => rede && rede.transporte.estado === "aberta"));
  const g1 = await abrir("#sala=" + sala);
  conf("Convidado entra pelo servidor nosso", await esperar(g1, () => rede && rede.transporte && rede.transporte.estado === "aberta" && rede.estado !== "entrando", null, 20000));
  const g2 = await abrir("#sala=" + sala, "window.__NOSSO_MORTO = true;");
  conf("Servidor nosso fora do ar: o convidado entra pelo público", await esperar(g2, () => rede && rede.transporte && rede.transporte.estado === "aberta" && rede.estado !== "entrando", null, 40000));
  await host.evaluate(() => redeSalaContar());
  const g3 = await abrir("");
  await g3.evaluate(() => redeEntrarPorCodigo());
  conf("Salas na sua rede: a sala aparece na tela de entrar", await esperar(g3, (c) => !!document.querySelector(`#redeSalasPerto [data-sala="${c}"]`), sala, 10000));
  await Promise.all([g3.waitForNavigation().catch(() => {}), g3.evaluate(() => document.querySelector("#redeSalasPerto [data-sala]").click())]);
  await g3.waitForFunction(() => typeof redeAbrirSala === "function").catch(() => {});
  conf("Tocar na sala da lista entra nela", await esperar(g3, (c) => !!rede && rede.sala === c, sala, 10000));
  conf(
    "Ponte: sem conta configurada segue sem; com credenciais, elas vão primeiro na lista",
    await g3.evaluate(async () => {
      await redePontePronta();
      const sem = !redePonteValida();
      redePonte = { iceServers: [{ urls: ["turn:turn.cloudflare.com:3478"], username: "u", credential: "c" }], validade: Date.now() + 86400000 };
      delete window.__REDE_PEER_CONFIG.config;
      const lista = redePeerConfig(0).config.iceServers;
      return sem && lista[0].urls[0] === "turn:turn.cloudflare.com:3478" && lista.length > 1 && redePeerConfig(0).key === "perfiljf";
    }),
  );
  await ctx.close();
  return { ok, erros };
}
function servidorTurn() {
  let Turn;
  try {
    Turn = require("node-turn");
  } catch (e) {
    return null;
  }
  const porta = 34780 + Math.floor(Math.random() * 200);
  const s = new Turn({ listeningIps: ["127.0.0.1"], listeningPort: porta, relayIps: ["127.0.0.1"], authMech: "long-term", credentials: { jf: "teste" }, debugLevel: "OFF" });
  let usos = 0;
  s.start();
  // conta as reservas de ponte (allocate) que o servidor aceitou
  const n0 = () => Object.keys(s.allocations || {}).length;
  const timer = setInterval(() => (usos = Math.max(usos, n0())), 100);
  return { porta, usos: () => Math.max(usos, n0()), fechar: () => (clearInterval(timer), s.stop()) };
}

async function rodar(b, modo, porta, turn) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript("window.__CHAVE = " + JSON.stringify(CHAVE));
  await ctx.route(/^https?:/, (r) => (porta && r.request().url().startsWith("http://127.0.0.1:" + porta) ? r.continue() : r.abort()));
  await ctx.addInitScript(([porta, turn]) => {
    try {
      localStorage.setItem("perfil5_tutorial_visto", "x");
      localStorage.setItem("perfil5_tab_lobby", "0");
      localStorage.setItem("perfil5_tut_vitoria_vistos", JSON.stringify(["casa", "tabuleiro", "pontos", "joias"]));
    } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
    // com turn: só vale a ponte (relay), como num 4G que não deixa ligação direta
    const ice = turn ? { iceServers: [{ urls: "turn:127.0.0.1:" + turn, username: "jf", credential: "teste" }], iceTransportPolicy: "relay" } : { iceServers: [] };
    if (porta) window.__REDE_PEER_CONFIG = { host: "127.0.0.1", port: porta, path: "/", secure: false, key: window.__CHAVE || "peerjs", config: ice };
  }, [porta || 0, turn || 0]);
  const erros = [];
  const abrir = async (hash, initScript) => {
    const pg = await ctx.newPage();
    pg.on("pageerror", (e) => erros.push(e.message.slice(0, 160)));
    if (initScript) await pg.addInitScript(initScript);
    await pg.goto("file://" + ARQ + (hash || ""));
    return pg;
  };
  const sufixo = modo === "local" ? "&local" : "";
  // host: partida montada como no cadastro
  const host = await abrir("");
  await host.waitForFunction(() => typeof sorteioSemear === "function" && !document.getElementById("goToRulesBtn").disabled);
  const sala = await host.evaluate(async (modo) => {
    document.querySelectorAll(".caos-modal-ov, #novidadesModal").forEach((o) => o.remove());
    caosSilenced = true;
    CURRENT_FORMAT = "versus";
    players = ["Ana", "Beto", "Caio"].map((n, i) => ({ id: jogadorIdNovo(), name: n, score: 0, position: 0, isBlocked: false, color: PLAYER_COLORS[i], avatar: "😀", humor: "normal", ageBracket: null, team: null, gems: {} }));
    selectMode("classico");
    WIN_CONDITION = "tabuleiro";
    starterDrawCount = 1;
    mestreIndex = 0;
    responderIndex = 1;
    ["splashScreen", "welcomeScreen", "playerPanel", "orderRevealSection"].forEach((id) => {
      const e = document.getElementById(id);
      if (e) e.style.display = "none";
    });
    document.getElementById("gameScreen").style.display = "block";
    document.getElementById("playAreaSection").style.display = "block";
    beginGameplay();
    await new Promise((r) => setTimeout(r, 300));
    if (activeToastState) closeActiveToast();
    return redeAbrirSala(modo);
  }, modo);
  const H = (fn, a) => host.evaluate(fn, a);
  const esperar = (pg, fn, a, ms) => pg.waitForFunction(fn, a, { timeout: ms || 8000 }).then(() => true, () => false);
  const ok = [];
  const conf = (nome, v) => ok.push([`[${turn ? "internet via TURN" : modo}] ${nome}`, !!v]);
  if (modo === "local")
    conf(
      "Config de verdade leva STUN e pontes TURN (80/443)",
      await H(() => {
        const ice = redePeerConfig().config.iceServers.flatMap((x) => [].concat(x.urls));
        return ice.some((u) => u.startsWith("stun:")) && ice.filter((u) => /^turns?:/.test(u)).length >= 4 && ice.some((u) => /:443/.test(u));
      }),
    );
  if (modo === "internet") conf("Sala aberta no servidor (PeerJS)", await esperar(host, () => rede && rede.transporte.estado === "aberta", null, 10000));
  const ids = await H(() => ({ mestre: jogadorIdDe(mestreIndex), vez: jogadorIdDe(responderIndex), outro: players[2].id, resposta: currentCard.answer }));

  // 1) entrar e escolher quem é
  const gM = await abrir("#sala=" + sala + sufixo);
  const gV = await abrir("#sala=" + sala + sufixo);
  conf("Convidado recebe a lista de lugares livres", (await esperar(gM, () => rede && rede.estado === "escolhendo" && rede.lugares.length === 3, null, 15000)) && (await esperar(gV, () => rede && rede.estado === "escolhendo", null, 15000)));
  await gM.evaluate((id) => redeEscolherLugar(id), ids.mestre);
  await gV.evaluate((id) => redeEscolherLugar(id), ids.vez);
  // 1.7.9.6: aparelho novo espera o host aceitar
  conf("Aparelho novo espera o host aceitar", (await esperar(gM, () => rede.estado === "aguardando")) && (await esperar(host, () => Object.keys(rede.pedidos).length === 2 && !!document.getElementById("redePedidos"))));
  await H(() => redeAprovarTodos());
  if (modo === "internet")
    conf(
      `O host vê como cada celular está ligado (${turn ? "pela ponte" : "direto"})`,
      await esperar(host, (via) => Object.values(rede.assentos).some((a) => a.via === via), turn ? "ponte" : "direta", 25000),
    );
  conf("Escolheu o lugar e entrou (com o retrato da partida)", (await esperar(gM, () => rede.estado === "dentro" && !!rede.retrato)) && (await esperar(gV, () => rede.estado === "dentro" && !!rede.retrato)));
  // 2) privacidade
  const semResposta = async (pg) => pg.evaluate((resp) => !JSON.stringify(rede.retrato).includes(resp), ids.resposta);
  conf("Retrato do convidado nunca tem a resposta", (await semResposta(gM)) && (await semResposta(gV)));
  conf("Resposta chega só pro Mestre", (await esperar(gM, (resp) => rede.segredo && rede.segredo.resposta === resp, ids.resposta)) && (await gV.evaluate(() => rede.segredo === null)));
  conf("A tela do outro não mostra a resposta", !(await gV.evaluate((r) => document.body.innerText.includes(r), ids.resposta)));
  // 3) painel calculado pelo host
  conf("Painel do Mestre: Ver carta; o do outro, não", (await esperar(gM, () => rede.painel && rede.painel.opcoes.some((o) => o.a === "virarCarta"))) && (await gV.evaluate(() => !!rede.painel && !rede.painel.opcoes.some((o) => o.a === "virarCarta"))));
  // 4) papéis
  const mandar = async (pg, acao, ...dados) => {
    const id = await pg.evaluate(([a, d]) => redeMandar(a, ...d), [acao, dados]);
    await esperar(pg, (c) => !!rede.respostas[c], id);
    return pg.evaluate((c) => rede.respostas[c] || null, id);
  };
  let r = await mandar(gV, "virarCarta");
  conf("Quem não é Mestre não vira a carta (sem_permissao)", r && !r.ok && r.motivo === "sem_permissao" && (await H(() => cardState)) === "hidden");
  // o Mestre vira tocando o botão do painel
  await gM.evaluate(() => {
    const i = rede.painel.opcoes.findIndex((o) => o.a === "virarCarta");
    document.querySelector(`[data-op="${i}"]`).click();
  });
  conf("O Mestre vira a carta pelo botão do painel", await esperar(host, () => cardState === "revealed"));
  // 1.7.9.5: como na tela de sempre, a resposta aparece pro Mestre depois de virar a carta
  conf("Virou a carta: a tela do Mestre mostra a resposta", await esperar(gM, (r) => document.body.innerText.toLowerCase().includes(r.toLowerCase()), ids.resposta));
  r = await mandar(gM, "tempoAcabou");
  conf("Coisa só do host (tempo acabou) é recusada pra convidado", r && !r.ok && r.motivo === "sem_permissao");
  // 5) votação do Descartar: o host joga como Caio; Ana (Mestre) pede, Beto vota sim
  await H((id) => (rede.hostEu = id), ids.outro);
  conf("Painel do Mestre oferece Descartar com votação", await esperar(gM, () => rede.painel && rede.painel.opcoes.some((o) => o.a === "descartarCarta" && /vota/.test(o.t))));
  const descAntes = await H(() => stats.totalDiscarded);
  r = await mandar(gM, "descartarCarta");
  conf("Descartar pelo celular abre a votação (não descarta direto)", r && r.ok && r.motivo === "votacao" && (await H(() => stats.totalDiscarded)) === descAntes);
  conf("A votação aparece pro outro jogador", await esperar(gV, () => rede.retrato.votacao && rede.retrato.votacao.tipo === "descartar" && !!document.querySelector('[data-voto="1"]')));
  await gV.evaluate(() => document.querySelector('[data-voto="1"]').click());
  conf("Maioria (2 de 3) aprova e a carta é descartada", await esperar(host, (n) => stats.totalDiscarded === n + 1 && !rede.votacao, descAntes));
  conf("Resposta da carta nova chega pro Mestre", await esperar(gM, () => !!rede.segredo && !!rede.segredo.resposta));
  const novaResp = await H(() => currentCard.answer);
  conf("Retrato continua sem a resposta da carta nova", !(await gV.evaluate((resp) => JSON.stringify(rede.retrato).includes(resp), novaResp)));
  // abre a carta nova e escolhe a dica
  r = await mandar(gM, "virarCarta");
  const livre = await H(() => currentCard.clues.findIndex((c, i) => c.type === "clue" && !revealedOrder.some((x) => x.index === i)));
  const revAntes = await H(() => partidaRevisao);
  r = await mandar(gV, "escolherDica", livre);
  conf("Quem está na vez não abre a dica (regra do JF: só o Mestre)", r && !r.ok && r.motivo === "sem_permissao" && (await H((i) => !revealedOrder.some((x) => x.index === i), livre)));
  r = await mandar(gM, "escolherDica", livre);
  conf("O Mestre abre a dica", r && r.ok && (await H((i) => revealedOrder.some((x) => x.index === i), livre)));
  conf("O telão mostra quem pediu a dica", await esperar(gV, () => /pedida por/.test(document.getElementById("telao").textContent)));
  conf("Revisão subiu uma vez", (await H(() => partidaRevisao)) === revAntes + 1);
  conf("Painel do Mestre com Acertou/Errou/Pulou", await esperar(gM, () => ["acertou", "errou"].every((a) => rede.painel.opcoes.some((o) => o.a === a)) && rede.painel.opcoes.some((o) => o.d[0] === "pular")));
  // 6) repetido e revisão velha
  await gM.evaluate(async () => {
    const id = redeMandar("pausar");
    const msg = rede.pendentes[id].msg;
    await new Promise((res) => setTimeout(res, 500));
    redeEnviar("cmd", msg); // o mesmo comando de novo (outra mensagem, mesmo commandId)
    await new Promise((res) => setTimeout(res, 500));
  });
  conf("Comando repetido (mesmo commandId) aplica uma vez só", (await H(() => acoesLog.filter((x) => x.a === "pausar").length)) === 1);
  conf("Pausado: o painel só oferece Continuar", await esperar(gV, () => rede.painel && rede.painel.opcoes.length === 1 && rede.painel.opcoes[0].a === "continuar"));
  r = await mandar(gM, "continuar");
  conf("Continuar depois da pausa (qualquer um pode)", r && r.ok);
  const velho = await gM.evaluate(async () => {
    const id = "c_velho" + Date.now();
    rede.pendentes[id] = { msg: { commandId: id, acao: "pausar", dados: [], rev: 1, matchId: rede.retrato.matchId }, tentativas: 1, quando: Date.now() };
    redeEnviar("cmd", rede.pendentes[id].msg);
    await new Promise((res) => setTimeout(res, 800));
    return rede.respostas[id];
  });
  conf("Comando com revisão velha é recusado (revisao_obsoleta)", velho && !velho.ok && velho.motivo === "revisao_obsoleta");
  // 7) lixo na sala
  const revLixo = await H(() => partidaRevisao);
  if (modo === "local") {
    await gV.evaluate((sala) => {
      const bc = new BroadcastChannel("perfiljf-sala-" + sala);
      const base = { p: 1, t: "cmd", sala, de: "s_intruso01", commandId: "c_lixo0001", acao: "pausar", dados: [] };
      [
        "isso não é json",
        JSON.stringify({ ...base, p: 99, seq: 1 }),
        JSON.stringify({ ...base, sala: "ZZZZ", seq: 2 }),
        JSON.stringify({ ...base, seq: 3, t: "explodir" }),
        JSON.stringify({ ...base, seq: 4, dados: [{ html: "<img>" }] }),
        JSON.stringify({ ...base, seq: 5, x: "a".repeat(70000) }),
        JSON.stringify({ ...base, seq: 6, de: "não é sessão" }),
        JSON.stringify({ ...base, seq: 7 }),
        JSON.stringify({ ...base, seq: 7 }),
        42,
      ].forEach((m) => bc.postMessage(m));
      bc.close();
    }, sala);
    await host.waitForTimeout(500);
    const rec = await H(() => ({ ...rede.recusadas }));
    conf("Lixo é jogado fora (formato, protocolo, sala, tipo, conteúdo, tamanho, sessão, repetida)", ["formato", "protocolo", "tipo", "conteudo", "grande_demais", "sessao", "repetida"].every((k) => rec[k] > 0));
  } else {
    // pela internet, a conexão fica presa à sessão de quem entrou: mensagem com outra sessão nem chega
    await gV.evaluate((sala) => {
      const m = { p: 1, t: "cmd", sala, de: "s_intruso01", seq: 1, commandId: "c_lixo0001", acao: "pausar", dados: [] };
      rede.transporte.enviar(JSON.stringify(m));
      rede.transporte.enviar("isso não é json");
    }, sala);
    await host.waitForTimeout(800);
  }
  conf("Intruso sem lugar não manda nada (a revisão não mudou)", (await H(() => partidaRevisao)) === revLixo);
  // 8) relógio adiantado 30 s (outro aparelho, sem a identidade guardada dos outros)
  const LIMPAR = 'Object.keys(localStorage).filter((k) => k.startsWith("perfil5_rede_eu_")).forEach((k) => localStorage.removeItem(k));';
  const gC = await abrir("#sala=" + sala + sufixo, `(() => { ${LIMPAR} const real = Date.now.bind(Date); Date.now = () => real() + 30000; })();`);
  await esperar(gC, () => rede && rede.relogio.amostras >= 3, null, 15000);
  const dif = await gC.evaluate(() => rede.relogio.dif);
  conf(`Relógio adiantado 30 s: o convidado acha a diferença (${dif} ms)`, Math.abs(dif + 30000) < 500);
  // 9) lugar ocupado e versão diferente
  await gC.evaluate((id) => redeEscolherLugar(id), ids.mestre);
  conf("Lugar de quem está online não pode ser tomado", await esperar(gC, () => rede.estado === "recusado" && rede.motivo === "lugar_ocupado"));
  const gX = await abrir("#sala=" + sala + sufixo, `(() => { ${LIMPAR} window.__JOGO_VERSAO = "0.0.1"; })();`);
  conf("Versão diferente é recusada, com o aviso pra atualizar", await esperar(gX, () => rede && rede.estado === "recusado" && rede.motivo === "versao_diferente" && !!rede.versaoHost, null, 15000));
  await gX.close();
  // 10) reconexão
  await gV.reload();
  conf("Recarregou: volta pro mesmo lugar sozinho", await esperar(gV, (id) => rede && rede.estado === "dentro" && rede.eu === id, ids.vez, 15000));
  // 11) a carta acaba: a resposta sai do celular de quem deixou de ser Mestre
  r = await mandar(gM, "acertou", 1);
  const depois = await H(() => ({ mestre: jogadorIdDe(mestreIndex), resposta: currentCard ? currentCard.answer : null }));
  conf("Mestre dá o veredito pelo celular", r && r.ok);
  conf("Quem deixou de ser Mestre perde a resposta", await esperar(gM, () => rede.segredo === null));
  if (depois.mestre === ids.vez)
    conf("O novo Mestre recebe a nova resposta", await esperar(gV, (resp) => rede.segredo && rede.segredo.resposta === resp, depois.resposta));
  // 12) intervalo: só o host segue; os celulares veem o aviso
  await H(() => {
    try {
      JFStore.setItem("perfil5_tab_lobby", "1");
    } catch (e) {}
    tabLobbyPendente = true;
    tabLobbyAbrir();
  });
  conf("Intervalo aparece no celular, sem botão de seguir", await esperar(gV, () => !!rede.retrato.intervalo && !!document.querySelector(".rede-intervalo") && !document.getElementById("tbLobbyPular")));
  conf("No intervalo, o celular mostra o placar (Pontos) a partir do retrato", await gV.evaluate(() => !!document.querySelector(".rede-lobby .lp-lista") && document.querySelectorAll(".rede-lobby .lp-linha").length === rede.retrato.jogadores.length));
  await H(() => tabLobbyFechar());
  conf("Host segue: o aviso some", await esperar(gV, () => !rede.retrato.intervalo));
  conf("Convidado não grava a partida", await gM.evaluate(() => saveBloqueado === true));
  // 13) o host recarrega: a sala volta com o mesmo código e os celulares se reconectam sozinhos
  const revHost = await H(() => partidaRevisao);
  await host.reload();
  conf("Host recarregou: a sala volta com o mesmo código", await esperar(host, (s) => typeof rede !== "undefined" && rede && rede.sala === s && rede.transporte.estado === "aberta", sala, 30000));
  conf("Os celulares voltam sozinhos, com o retrato da partida", (await esperar(gV, (rv) => rede.estado === "dentro" && rede.retrato && rede.retrato.revisao >= rv && rede.transporte.estado === "aberta", revHost, 30000)) && (await esperar(gM, () => rede.estado === "dentro" && !!rede.painel, null, 30000)));
  const mestreAgora = await H(() => jogadorIdDe(mestreIndex));
  const gMestre = mestreAgora === ids.vez ? gV : mestreAgora === ids.mestre ? gM : null;
  if (gMestre) conf("Depois da volta, o Mestre recebe a resposta de novo", await esperar(gMestre, () => !!rede.segredo && !!rede.segredo.resposta, null, 15000));
  // 14) troca de host: o host some de vez; o sucessor (2º Mestre: Beto) assume a mesma sala
  {
    const okV = await esperar(gV, (id) => rede.retrato.sucessor === id && !!rede.recuperacao, ids.vez, 15000);
    const okM = await esperar(gM, () => rede.recuperacao === null, null, 5000);
    if (!okV || !okM) {
      const dv = await gV.evaluate(() => ({ suc: rede.retrato.sucessor, eu: rede.eu, rec: !!rede.recuperacao }));
      const dh = await H(() => ({ hostEu: rede.hostEu, on: Object.keys(rede.assentos).filter((k) => redeOnline(rede.assentos[k])), pm: primeiroMestreId, rec: rede.recEnviada }));
      const dm = await gM.evaluate(() => ({ rec: !!rede.recuperacao, suc: rede.retrato.sucessor, eu: rede.eu, est: rede.estado }));
      console.log("[sucessor]", modo, JSON.stringify(dv), JSON.stringify(dh), JSON.stringify(dm));
    }
    conf("O host aponta o sucessor (2º Mestre) e manda o pacote só pra ele", okV && okM);
  }
  const revTroca = await H(() => partidaRevisao);
  const placarTroca = await H(() => JSON.stringify(players.map((p) => [p.id, p.score, p.position])));
  // o pacote vai no máximo a cada 3 s (e na batida de 4 s): espera o sucessor estar com a revisão de agora
  await esperar(gV, (rv) => !!rede.recuperacao && rede.recuperacao.revisao === rv, revTroca, 10000);
  await host.close();
  conf("O outro celular avisa que o host sumiu e quem assume", await esperar(gM, () => !!document.querySelector(".rede-conexao") && /assume/.test(document.querySelector(".rede-conexao").textContent), null, 15000));
  conf("O sucessor assume: vira host da MESMA sala", await esperar(gV, (s) => typeof rede !== "undefined" && rede && rede.papel === "host" && rede.sala === s && rede.transporte.estado === "aberta", sala, 60000));
  conf("Nada se perdeu: mesma revisão e o mesmo placar", (await gV.evaluate(() => partidaRevisao)) === revTroca && (await gV.evaluate(() => JSON.stringify(players.map((p) => [p.id, p.score, p.position])))) === placarTroca);
  conf("O novo host joga com o próprio jogador (Beto)", (await gV.evaluate(() => rede.hostEu)) === ids.vez);
  conf("O outro celular se reconecta ao novo host sozinho", await esperar(gM, () => rede.estado === "dentro" && !!rede.painel && Date.now() - rede.ultimoHost < 5000, null, 40000));
  // o host antigo volta: descobre que já tem host e entra como jogador
  const velhoHost = await abrir("");
  conf("O host antigo volta e entra como jogador (não briga pela sala)", await esperar(velhoHost, (s) => typeof rede !== "undefined" && rede && rede.papel === "convidado" && rede.sala === s, sala, 40000));
  await velhoHost.close();
  for (const pg of [gM, gV, gC]) await pg.close();
  await ctx.close();
  return { ok, erros };
}

// 1.7.9.4 · Sala antes do cadastro (pedido do JF) e tela de jogador no host quando o Mestre está em outro aparelho
async function rodarSalaPrimeiro(b) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/^https?:/, (r) => r.abort());
  await ctx.addInitScript(() => {
    window.__REDE_SOZINHO = [1500, 3000]; // 1.7.9.9: tempos curtos pro teste de "todo mundo saiu"
    try {
      localStorage.setItem("perfil5_tutorial_visto", "x");
      localStorage.setItem("perfil5_tab_lobby", "0");
    } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
  });
  const erros = [], ok = [];
  const conf = (nome, v) => ok.push([`[sala primeiro] ${nome}`, !!v]);
  const abrir = async (hash, init) => {
    const pg = await ctx.newPage();
    pg.on("pageerror", (e) => erros.push(e.message.slice(0, 160)));
    if (init) await pg.addInitScript(init);
    await pg.goto("file://" + ARQ + (hash || ""));
    return pg;
  };
  const esperar = (pg, fn, a, ms) => pg.waitForFunction(fn, a, { timeout: ms || 8000 }).then(() => true, () => false);
  const host = await abrir("");
  await host.waitForFunction(() => typeof sorteioSemear === "function" && !document.getElementById("goToRulesBtn").disabled);
  // cadastro vazio, sala aberta antes de cadastrar
  const sala = await host.evaluate(() => {
    document.querySelectorAll(".caos-modal-ov, #novidadesModal").forEach((o) => o.remove());
    caosSilenced = true;
    CURRENT_FORMAT = "versus";
    selectMode("classico");
    WIN_CONDITION = "tabuleiro";
    players = [];
    return redeAbrirSala("local");
  });
  conf("O botão da sala aparece no cadastro", await host.evaluate(() => !!document.getElementById("redeCadBtn") && /Sala/.test(document.getElementById("redeCadBtn").textContent)));
  const g = await abrir("#sala=" + sala + "&local");
  // 1.7.9.6 (pedido do JF): quem entra cria o próprio jogador e o host aceita
  conf(
    "Quem entra antes do cadastro vê o formulário pra criar o jogador",
    await esperar(g, () => rede && rede.estado === "escolhendo" && !!rede.cadastro && !!document.getElementById("redeNome") && document.querySelectorAll("#telao .avatar-swatch").length > 5 && document.querySelectorAll("#telao .humor-btn").length >= 3),
  );
  // o mesmo cadastro do host: com o nome "Anne", a cor exclusiva dela (degradê) já vem marcada, e o RGB do JF fica travado
  await g.fill("#redeNome", "Anne");
  conf(
    "Cadastro no celular igual ao do host (cor de dono marcada, a do outro travada)",
    await esperar(g, () => !!document.querySelector('#telao .color-swatch.selected[data-cor="GRAD_PRINCESA"]') && !!document.querySelector('#telao .color-swatch.tomada[data-cor="RGB"]') && rede.rascunho.avatar === "👸"),
  );
  await g.fill("#redeNome", "");
  await g.evaluate(() => (rede.rascunho = {}));
  const avAna = await g.evaluate(() => rede.cadastro.avatares[3]);
  await g.evaluate((av) => redePedirEntrada({ nome: "Ana", avatar: av, humor: "suave", idade: "maior" }), avAna);
  conf("Pediu pra entrar: espera o host aceitar", (await esperar(g, () => rede.estado === "aguardando")) && (await esperar(host, () => !!document.getElementById("redePedidos") && /Ana/.test(document.getElementById("redePedidos").textContent))));
  await host.evaluate(() => document.querySelector('#redePedidos [data-sim="1"]').click());
  conf(
    "O host aceitou: o jogador entra no cadastro como ela criou",
    await host.evaluate((av) => players.length === 1 && players[0].name === "Ana" && players[0].avatar === av && players[0].humor === "suave" && players[0].idade === "maior", avAna),
  );
  // outro aparelho: nome repetido volta pro formulário; depois o host recusa
  // outro celular: sem a identidade guardada do aparelho da Ana
  const g2 = await abrir("#sala=" + sala + "&local", () => Object.keys(localStorage).filter((k) => k.startsWith("perfil5_rede_eu_")).forEach((k) => localStorage.removeItem(k)));
  await esperar(g2, () => rede && rede.estado === "escolhendo" && !!rede.cadastro);
  await g2.evaluate(() => redePedirEntrada({ nome: "ana" }));
  conf("Nome repetido: volta pro formulário com o aviso", await esperar(g2, () => rede.estado === "escolhendo" && /Já tem alguém/.test(document.getElementById("telao").textContent)));
  await g2.evaluate(() => redePedirEntrada({ nome: "Duda" }));
  await esperar(host, () => Object.keys(rede.pedidos).length === 1);
  await host.evaluate(() => document.querySelector('#redePedidos [data-sim="0"]').click());
  conf("O host recusou: o aparelho fica de fora", (await esperar(g2, () => rede.estado === "recusado" && rede.motivo === "recusado")) && (await host.evaluate(() => players.length === 1)));
  // 1.7.9.7 · sala blindada: nome com HTML chega limpo; rajada de mensagens é cortada; pedidos têm limite
  await g2.evaluate(() => {
    rede.estado = "escolhendo";
    redeEnviar("pedido", { perfil: { nome: "<img src=x>Zé" }, chave: rede.chave });
  });
  conf(
    "Nome com HTML chega limpo no host",
    await esperar(host, () => Object.values(rede.pedidos).some((p) => p.perfil && /Zé/.test(p.perfil.nome) && !/[<>]/.test(p.perfil.nome))),
  );
  await host.evaluate(() => redeAprovarTodos());
  conf("O jogador entra com o nome limpo", await host.evaluate(() => players.some((p) => /Zé/.test(p.name) && !/[<>]/.test(p.name))));
  await host.evaluate(() => {
    const z = players.findIndex((p) => /Zé/.test(p.name));
    players.splice(z, 1);
    redeHostCadastroMudou();
  });
  const ritmoAntes = await host.evaluate(() => rede.recusadas.ritmo || 0);
  await g2.evaluate(() => {
    for (let i = 0; i < 60; i++) redeEnviar("ping", { t0: Date.now() });
  });
  conf("Rajada de mensagens de um aparelho é cortada (até 25 por segundo)", await esperar(host, (n) => (rede.recusadas.ritmo || 0) > n, ritmoAntes));
  const limite = await host.evaluate(() => {
    for (let i = 0; i < 6; i++) rede.pedidos["s_falso" + i] = { tipo: "lugar", jogadorId: players[0].id, chave: "x".repeat(16), quando: Date.now() };
    return Object.keys(rede.pedidos).length;
  });
  await g2.waitForTimeout(1100);
  await g2.evaluate(() => redeEnviar("pedido", { perfil: { nome: "Gabi" }, chave: rede.chave }));
  conf(`Com ${limite} pedidos esperando, o próximo é recusado com aviso`, await esperar(g2, () => rede.estado === "escolhendo" && /Muita gente/.test(rede.erroCadastro || "")));
  await host.evaluate(() => {
    Object.keys(rede.pedidos).forEach((k) => k.startsWith("s_falso") && delete rede.pedidos[k]);
    redePedidosPintar();
  });
  await g2.close();
  // o host cadastra o resto aqui mesmo
  await host.evaluate(() => {
    ["Beto", "Caio"].forEach((n, i) => players.push({ id: jogadorIdNovo(), name: n, score: 0, position: 0, isBlocked: false, color: PLAYER_COLORS[i + 1], avatar: "😀", humor: "normal", ageBracket: null, team: null, gems: {} }));
    redeHostCadastroMudou();
  });
  conf(
    "Escolheu o nome antes da partida: tela de espera",
    await esperar(g, () => rede.estado === "dentro" && rede.retrato && !rede.retrato.iniciada && /Esperando o host/.test(document.getElementById("telao").textContent)),
  );
  // a partida começa com a Ana (no celular dela) de Mestre e o Beto no aparelho do host, na vez
  await host.evaluate(async () => {
    rede.hostEu = players[1].id;
    starterDrawCount = 1;
    mestreIndex = 0;
    responderIndex = 1;
    ["splashScreen", "welcomeScreen", "playerPanel", "orderRevealSection"].forEach((id) => {
      const e = document.getElementById(id);
      if (e) e.style.display = "none";
    });
    document.getElementById("gameScreen").style.display = "block";
    document.getElementById("playAreaSection").style.display = "block";
    beginGameplay();
    await new Promise((r) => setTimeout(r, 300));
    if (activeToastState) closeActiveToast();
    redeHostPublicar(true);
  });
  conf("Mestre em outro aparelho: o host mostra a tela de jogador", await esperar(host, () => !!document.getElementById("redeHostVista") && document.body.classList.contains("rede-mestre-longe")));
  conf("Na tela do host não aparece a resposta", await host.evaluate(() => !document.getElementById("redeHostVista").textContent.includes(currentCard.answer)));
  conf("O convidado começa a partida junto", await esperar(g, () => rede.retrato && rede.retrato.iniciada && !!document.querySelector("#telao .telao-vez")));
  // a Mestre vira a carta no celular dela; o Beto escolhe a dica na tela do host
  await g.evaluate(() => redeMandar("sacarCarta"));
  await esperar(host, () => cardState === "hidden" || cardState === "revealed");
  await g.evaluate(() => redeMandar("virarCarta"));
  await esperar(host, () => cardState === "revealed", null, 12000);
  await host.evaluate(() => redeHostPublicar(true));
  // 1.7.9.6 (regra do JF): só o Mestre abre a dica; quem está na vez só fala o número
  conf(
    "Na vez de quem está no host: o aviso pra falar o número, sem botões de dica",
    await esperar(host, () => !!document.getElementById("redeHostVista") && /fale um número/.test(document.getElementById("redeHostVista").textContent) && !document.querySelector("#redeHostVista [data-dica]"), null, 12000),
  );
  const livreH = await host.evaluate(() => currentCard.clues.findIndex((c) => c.type === "clue"));
  await g.evaluate((i) => redeMandar("escolherDica", i), livreH);
  conf("A Mestre abre a dica no celular dela", await esperar(host, () => revealedOrder.length === 1));
  // 1.7.9.6: o C.A.O.S. fala no celular dela também (e a fala particular vai só pra ela)
  await host.evaluate(() => showToastMessage("[C.A.O.S.] Ana, essa é pra mesa toda."));
  conf("Fala do C.A.O.S. aparece no celular da Ana", await esperar(g, () => (!!document.getElementById("redeFala") && /pra mesa toda/.test(document.getElementById("redeFala").textContent)) || (rede.falas || []).some((f) => /pra mesa toda/.test(f.texto)), null, 12000));
  await host.evaluate(() => caosFalarPara(players[0].id, "[C.A.O.S.] Só entre nós: segredo da Ana.", true));
  conf(
    "Fala particular chega no celular dela, marcada como dela",
    await esperar(g, () => (document.querySelector("#redeFala.minha") && /segredo da Ana/.test(document.getElementById("redeFala").textContent)) || (rede.falas || []).some((f) => /segredo da Ana/.test(f.texto) && f.minha), null, 12000),
  );
  // 1.7.9.5: a Mestre vê a carta como na tela de sempre (a dica da vez e os botões do veredito)
  await host.evaluate(() => redeHostPublicar(true));
  conf(
    "A Mestre vê a carta no celular dela (resposta, dica da vez e Acertou/Errou)",
    await esperar(g, () => {
      const c = document.querySelector("#telao .rede-carta-mestre");
      return !!c && !!c.querySelector(".pending-box") && !!c.querySelector(".btn-correct") && !!c.querySelector(".btn-wrong") && !document.querySelector("#telao .telao-carta");
    }),
  );
  // 1.7.9.5: Reiniciar no host com a sala aberta; o mesmo nome cadastrado de novo devolve o lugar sozinho
  await host.evaluate(() => resetGame());
  conf("Reiniciar no host: o celular volta pra escolha do nome", await esperar(g, () => rede.estado === "escolhendo", null, 12000));
  await host.evaluate(() => {
    document.querySelectorAll(".caos-modal-ov, .jf-modal-bg").forEach((o) => o.remove());
    CURRENT_FORMAT = "versus";
    selectMode("classico");
    WIN_CONDITION = "tabuleiro";
    ["Ana", "Beto", "Caio"].forEach((n, i) => players.push({ id: jogadorIdNovo(), name: n, score: 0, position: 0, isBlocked: false, color: PLAYER_COLORS[i], avatar: "😀", humor: "normal", ageBracket: null, team: null, gems: {} }));
    redeHostCadastroMudou();
  });
  const anaNova = await host.evaluate(() => players[0].id);
  conf("Mesmo nome cadastrado de novo: o celular volta pro lugar sozinho", await esperar(g, (id) => rede.estado === "dentro" && rede.eu === id, anaNova, 12000));
  await host.evaluate(async () => {
    rede.hostEu = players[1].id;
    starterDrawCount = 1;
    mestreIndex = 0;
    responderIndex = 1;
    ["splashScreen", "welcomeScreen", "playerPanel", "orderRevealSection"].forEach((id) => {
      const e = document.getElementById(id);
      if (e) e.style.display = "none";
    });
    document.getElementById("gameScreen").style.display = "block";
    document.getElementById("playAreaSection").style.display = "block";
    beginGameplay();
    await new Promise((r) => setTimeout(r, 300));
    if (activeToastState) closeActiveToast();
    document.getElementById("redePainel")?.remove();
    redeHostPublicar(true);
  });
  conf("A partida nova começa no celular dela também", await esperar(g, () => rede.retrato && rede.retrato.iniciada && !!document.querySelector("#telao .rede-carta-mestre"), null, 12000));
  conf("De novo com a Mestre fora do host: tela de jogador no host", await esperar(host, () => !!document.getElementById("redeHostVista")));
  // 1.7.9.9: Beto e Caio dividem o aparelho do host; cada um vota pelo próprio botão
  await host.evaluate(() => redeDefinirNoHost([players[1].id, players[2].id]));
  conf("Dois jogadores no aparelho do host: a tela mostra os dois", await esperar(host, () => (document.getElementById("redeHostVista") || {}).textContent && /Beto/.test(document.getElementById("redeHostVista").textContent) && /Caio/.test(document.getElementById("redeHostVista").textContent)));
  conf("Os dois votam: a mesa tem 3 votantes", await host.evaluate(() => redeVotantes().length === 3));
  await g.evaluate(() => redeMandar("virarCarta"));
  await esperar(host, () => cardState === "revealed", null, 12000);
  const descA = await host.evaluate(() => stats.totalDiscarded);
  await g.evaluate(() => redeMandar("descartarCarta"));
  conf("Votação: uma linha de voto pra cada jogador do aparelho do host", await esperar(host, () => document.querySelectorAll("#redeVotoHost .rede-voto-linha").length === 2));
  await host.evaluate(() => document.querySelector('#redeVotoHost [data-sim="1"]').click());
  await host.evaluate(() => document.querySelector('#redeVotoHost [data-sim="1"]') && document.querySelector('#redeVotoHost [data-sim="1"]').click());
  conf("Com os votos dos dois, a carta é descartada", await esperar(host, (n) => stats.totalDiscarded === n + 1 && !rede.votacao, descA));
  await host.evaluate(() => redeDefinirNoHost([players[1].id]));
  // a Mestre sai da sala: o host volta pra tela de sempre (ela jogaria no aparelho do host)
  // 1.7.9.8: o QR Code da sala aparece no painel; o host tira a Ana da sala
  conf("O painel da sala mostra o QR Code do link", await host.evaluate(() => { redePainelHost(); const ok = !!document.querySelector("#redePainel .rede-qr svg"); document.getElementById("redePainel").remove(); return ok; }));
  await host.evaluate(() => redeTirarDaSala(players[0].id));
  conf("O host tira um aparelho da sala: ele fica de fora e precisa pedir de novo", (await esperar(g, () => rede.estado === "recusado" && rede.motivo === "removido")) && (await host.evaluate(() => !rede.assentos[players[0].id])));
  await g.close({ runBeforeUnload: true });
  await host.waitForTimeout(500);
  await host.evaluate(() => redeHostPublicar(true));
  conf("Mestre fora da sala: o host volta a mostrar tudo", await esperar(host, () => !document.getElementById("redeHostVista") && !document.body.classList.contains("rede-mestre-longe")));
  // 1.7.9.9 (regra do JF): partida online e todo mundo saiu → pausa, avisa e encerra (sem continuar sozinho)
  conf("Todo mundo saiu da sala: o jogo pausa e avisa", await esperar(host, () => !!document.getElementById("redeSozinho") && !!pausedAt, null, 10000));
  conf("Ninguém voltou: a partida online é encerrada", await esperar(host, () => gameEnded && !document.getElementById("redeSozinho"), null, 12000));
  await ctx.close();
  return { ok, erros };
}

(async () => {
  const b = await navegador();
  const todos = [], erros = [];
  if (SO !== "internet") {
    const r = await rodar(b, "local");
    todos.push(...r.ok);
    erros.push(...r.erros);
    const r2 = await rodarSalaPrimeiro(b);
    todos.push(...r2.ok);
    erros.push(...r2.erros);
    const r3 = await rodarOrfa(b);
    todos.push(...r3.ok);
    erros.push(...r3.erros);
  }
  if (SO !== "local") {
    const sv = SERVIDOR ? { porta: SERVIDOR, fechar: () => {} } : await servidorPeer();
    if (!sv) console.log("(sem o pacote 'peer': o roteiro pela internet não rodou; npm install)");
    else {
      try {
        const r = await rodar(b, "internet", sv.porta);
        todos.push(...r.ok);
        erros.push(...r.erros);
        const rc = await rodarColisao(b, sv.porta);
        todos.push(...rc.ok);
        erros.push(...rc.erros);
        if (SERVIDOR) {
          const pub = await servidorPeer();
          if (pub) {
            try {
              const rn = await rodarServidorNosso(b, SERVIDOR, pub.porta);
              todos.push(...rn.ok);
              erros.push(...rn.erros);
            } finally {
              pub.fechar();
            }
          }
        }
        // 1.7.9.3 · de novo, mas só pela ponte TURN (servidor local): prova que a conexão passa pelo relay
        const tv = servidorTurn();
        if (!tv) console.log("(sem o pacote 'node-turn': o roteiro via TURN não rodou; npm install)");
        else {
          try {
            const r2 = await rodar(b, "internet", sv.porta, tv.porta);
            todos.push(...r2.ok, ["[internet via TURN] A ponte TURN foi usada", tv.usos() > 0]);
            erros.push(...r2.erros);
          } finally {
            tv.fechar();
          }
        }
      } finally {
        sv.fechar();
      }
    }
  }
  // versão publicada: o convidado não abre o catálogo de cartas
  if (PUB) {
    const ctx = await b.newContext();
    await ctx.route(/^https?:/, (r) => r.abort());
    const p1 = await ctx.newPage();
    await p1.goto("file://" + PUB + "#sala=ABCD&local");
    await p1.waitForFunction(() => typeof ADULT_CARDS !== "undefined");
    const nConv = await p1.evaluate(() => ADULT_CARDS.length);
    const p2 = await ctx.newPage();
    await p2.goto("file://" + PUB);
    await p2.waitForFunction(() => typeof ADULT_CARDS !== "undefined");
    const nHost = await p2.evaluate(() => ADULT_CARDS.length);
    todos.push([`Publicada: convidado sem catálogo (${nConv} cartas), host com ele (${nHost})`, nConv === 0 && nHost >= 1000]);
    await ctx.close();
  } else console.log("(sem a versão publicada pra conferir o catálogo: rode depois do build)");
  await b.close();
  todos.forEach(([n, v]) => console.log((v ? "ok    " : "FALHOU") + "  " + n));
  if (erros.length) console.log("Erros na página:", [...new Set(erros)].join(" | "));
  else console.log("Sem erro na página.");
  const tudo = todos.every((x) => x[1]) && !erros.length;
  console.log(tudo ? "REDE OK" : "REDE COM PROBLEMA");
  process.exit(tudo ? 0 : 1);
})();
