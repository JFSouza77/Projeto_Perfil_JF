#!/usr/bin/env node
// Teste da rede (1.7.9.7 · Rooms and Network Update, Parte 3).
// Um host e convidados em abas do mesmo navegador (transporte local). Confere o protocolo:
//   escolher lugar · resposta só pro Mestre · papel de cada um (veredito, dica, coisas só do host) ·
//   comando repetido aplicado uma vez · revisão velha · mensagens malformadas, de outra sala, de
//   outro protocolo, grandes demais ou repetidas · relógio de um aparelho adiantado · reconexão ·
//   lugar ocupado · convidado não grava · e, na versão publicada, convidado sem catálogo de cartas.
//   node ferramentas/teste_rede.js [mestre.html] [publicada.html]
"use strict";
const fs = require("fs");
const path = require("path");
const { acharMestre, abrirNavegador } = require("./_navegador");
const ARQ = acharMestre(process.argv[2] && process.argv[2].endsWith(".html") ? process.argv[2] : null);
const PUB = (() => {
  if (process.argv[3]) return path.resolve(process.argv[3]);
  const v = path.basename(ARQ).replace("Perfil_JF_Mestre_", "Perfil_JF_");
  const p = path.join(path.dirname(ARQ), v);
  return fs.existsSync(p) ? p : null;
})();

(async () => {
  const b = await abrirNavegador();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/^https?:/, (r) => r.abort());
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("perfil5_tutorial_visto", "x");
      localStorage.setItem("perfil5_tab_lobby", "0");
      localStorage.setItem("perfil5_tut_vitoria_vistos", JSON.stringify(["casa", "tabuleiro", "pontos", "joias"]));
    } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
  });
  const erros = [];
  const abrir = async (hash, initScript) => {
    const pg = await ctx.newPage();
    pg.on("pageerror", (e) => erros.push(e.message.slice(0, 160)));
    if (initScript) await pg.addInitScript(initScript);
    await pg.goto("file://" + ARQ + (hash || ""));
    return pg;
  };
  // host: partida montada como no cadastro
  const host = await abrir("");
  await host.waitForFunction(() => typeof sorteioSemear === "function" && !document.getElementById("goToRulesBtn").disabled);
  const sala = await host.evaluate(async () => {
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
    return redeAbrirSala();
  });
  const H = (fn, a) => host.evaluate(fn, a);
  const ids = await H(() => ({ mestre: jogadorIdDe(mestreIndex), vez: jogadorIdDe(responderIndex), outro: players[2].id, resposta: currentCard.answer }));
  const esperar = (pg, fn, a, ms) => pg.waitForFunction(fn, a, { timeout: ms || 6000 }).then(() => true, () => false);
  const ok = [];
  const conf = (nome, v) => ok.push([nome, !!v]);

  // 1) entrar e escolher quem é
  const gM = await abrir("#sala=" + sala);
  const gV = await abrir("#sala=" + sala);
  conf("Convidado recebe a lista de lugares livres", (await esperar(gM, () => rede && rede.estado === "escolhendo" && rede.lugares.length === 3)) && (await esperar(gV, () => rede && rede.estado === "escolhendo")));
  await gM.evaluate((id) => redeEscolherLugar(id), ids.mestre);
  await gV.evaluate((id) => redeEscolherLugar(id), ids.vez);
  conf("Escolheu o lugar e entrou (com o retrato da partida)", (await esperar(gM, () => rede.estado === "dentro" && !!rede.retrato)) && (await esperar(gV, () => rede.estado === "dentro" && !!rede.retrato)));
  // 2) privacidade
  const semResposta = async (pg) => pg.evaluate((resp) => !JSON.stringify(rede.retrato).includes(resp), ids.resposta);
  conf("Retrato do convidado nunca tem a resposta", (await semResposta(gM)) && (await semResposta(gV)));
  conf("Resposta chega só pro Mestre", (await esperar(gM, (resp) => rede.segredo && rede.segredo.resposta === resp, ids.resposta)) && (await gV.evaluate(() => rede.segredo === null)));
  conf("A tela do Mestre mostra a resposta; a do outro, não", (await gM.evaluate((r) => document.body.innerText.includes(r), ids.resposta)) && !(await gV.evaluate((r) => document.body.innerText.includes(r), ids.resposta)));
  // 3) papéis
  const mandar = async (pg, acao, ...dados) => {
    const id = await pg.evaluate(([a, d]) => redeMandar(a, ...d), [acao, dados]);
    await esperar(pg, (c) => !!rede.respostas[c], id);
    return pg.evaluate((c) => rede.respostas[c] || null, id);
  };
  let r = await mandar(gV, "virarCarta");
  conf("Quem não é Mestre não vira a carta (sem_permissao)", r && !r.ok && r.motivo === "sem_permissao" && (await H(() => cardState)) === "hidden");
  r = await mandar(gM, "virarCarta");
  conf("O Mestre vira a carta pelo celular dele", r && r.ok && (await H(() => cardState)) === "revealed");
  r = await mandar(gM, "tempoAcabou");
  conf("Coisa só do host (tempo acabou) é recusada pra convidado", r && !r.ok && r.motivo === "sem_permissao");
  const livre = await H(() => currentCard.clues.findIndex((c, i) => c.type === "clue" && !revealedOrder.some((x) => x.index === i)));
  const revAntes = await H(() => partidaRevisao);
  r = await mandar(gV, "escolherDica", livre);
  conf("Quem está na vez escolhe a dica", r && r.ok && (await H((i) => revealedOrder.some((x) => x.index === i), livre)));
  conf("Revisão subiu uma vez", (await H(() => partidaRevisao)) === revAntes + 1);
  // 4) repetido e revisão velha
  const dup = await gM.evaluate(async () => {
    const id = redeMandar("pausar");
    const msg = rede.pendentes[id].msg;
    await new Promise((res) => setTimeout(res, 400));
    redeEnviar("cmd", msg); // o mesmo comando de novo (outra mensagem, mesmo commandId)
    await new Promise((res) => setTimeout(res, 400));
    return { id };
  });
  const pausas = await H(() => acoesLog.filter((x) => x.a === "pausar").length);
  conf("Comando repetido (mesmo commandId) aplica uma vez só", pausas === 1);
  r = await mandar(gM, "continuar");
  conf("Continuar depois da pausa (qualquer um pode)", r && r.ok);
  const velho = await gM.evaluate(async () => {
    const id = "c_velho" + Date.now();
    rede.pendentes[id] = { msg: { commandId: id, acao: "pausar", dados: [], rev: 1, matchId: rede.retrato.matchId }, tentativas: 1, quando: Date.now() };
    redeEnviar("cmd", rede.pendentes[id].msg);
    await new Promise((res) => setTimeout(res, 600));
    return rede.respostas[id];
  });
  conf("Comando com revisão velha é recusado (revisao_obsoleta)", velho && !velho.ok && velho.motivo === "revisao_obsoleta");
  // 5) lixo na sala
  const revLixo = await H(() => partidaRevisao);
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
  conf("Intruso sem lugar não manda nada (a revisão não mudou)", (await H(() => partidaRevisao)) === revLixo);
  // 6) relógio adiantado 30 s
  // outro aparelho: sem a identidade guardada dos outros convidados (mesmo navegador no teste)
  const gC = await abrir("#sala=" + sala, () => {
    Object.keys(localStorage).filter((k) => k.startsWith("perfil5_rede_eu_")).forEach((k) => localStorage.removeItem(k));
    const real = Date.now.bind(Date);
    Date.now = () => real() + 30000;
  });
  await esperar(gC, () => rede && rede.relogio.amostras >= 3);
  const dif = await gC.evaluate(() => rede.relogio.dif);
  conf(`Relógio adiantado 30 s: o convidado acha a diferença (${dif} ms)`, Math.abs(dif + 30000) < 400);
  // 7) reconexão e lugar ocupado
  await gV.reload();
  conf("Recarregou: volta pro mesmo lugar sozinho", await esperar(gV, (id) => rede && rede.estado === "dentro" && rede.eu === id, ids.vez, 8000));
  await gC.evaluate((id) => redeEscolherLugar(id), ids.mestre);
  conf("Lugar de quem está online não pode ser tomado", await esperar(gC, () => rede.estado === "recusado" && rede.motivo === "lugar_ocupado"));
  // 8) a carta acaba: a resposta sai do celular de quem deixou de ser Mestre
  r = await mandar(gM, "acertou");
  const depois = await H(() => ({ mestre: jogadorIdDe(mestreIndex), resposta: currentCard ? currentCard.answer : null }));
  conf("Mestre dá o veredito pelo celular", r && r.ok);
  conf("Quem deixou de ser Mestre perde a resposta", await esperar(gM, () => rede.segredo === null));
  if (depois.mestre === ids.vez)
    conf("O novo Mestre recebe a nova resposta", await esperar(gV, (resp) => rede.segredo && rede.segredo.resposta === resp, depois.resposta));
  conf("Convidado não grava a partida", await gM.evaluate(() => saveBloqueado === true));
  for (const pg of [gM, gV, gC]) await pg.close();
  await host.close();

  // 9) versão publicada: o convidado não abre o catálogo de cartas
  if (PUB) {
    const p1 = await ctx.newPage();
    await p1.goto("file://" + PUB + "#sala=ABCD");
    await p1.waitForFunction(() => typeof ADULT_CARDS !== "undefined");
    const nConv = await p1.evaluate(() => ADULT_CARDS.length);
    await p1.close();
    const p2 = await ctx.newPage();
    await p2.goto("file://" + PUB);
    await p2.waitForFunction(() => typeof ADULT_CARDS !== "undefined");
    const nHost = await p2.evaluate(() => ADULT_CARDS.length);
    await p2.close();
    conf(`Publicada: convidado sem catálogo (${nConv} cartas), host com ele (${nHost})`, nConv === 0 && nHost >= 1000);
  } else console.log("(sem a versão publicada pra conferir o catálogo: rode depois do build)");
  await b.close();
  ok.forEach(([n, v]) => console.log((v ? "ok    " : "FALHOU") + "  " + n));
  if (erros.length) console.log("Erros na página:", [...new Set(erros)].join(" | "));
  else console.log("Sem erro na página.");
  const tudo = ok.every((x) => x[1]) && !erros.length;
  console.log(tudo ? "REDE OK" : "REDE COM PROBLEMA");
  process.exit(tudo ? 0 : 1);
})();
