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

async function rodar(b, modo, porta) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/^https?:/, (r) => (porta && r.request().url().startsWith("http://127.0.0.1:" + porta) ? r.continue() : r.abort()));
  await ctx.addInitScript((porta) => {
    try {
      localStorage.setItem("perfil5_tutorial_visto", "x");
      localStorage.setItem("perfil5_tab_lobby", "0");
      localStorage.setItem("perfil5_tut_vitoria_vistos", JSON.stringify(["casa", "tabuleiro", "pontos", "joias"]));
    } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
    if (porta) window.__REDE_PEER_CONFIG = { host: "127.0.0.1", port: porta, path: "/", secure: false, config: { iceServers: [] } };
  }, porta || 0);
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
  const conf = (nome, v) => ok.push([`[${modo}] ${nome}`, !!v]);
  if (modo === "internet") conf("Sala aberta no servidor (PeerJS)", await esperar(host, () => rede && rede.transporte.estado === "aberta", null, 10000));
  const ids = await H(() => ({ mestre: jogadorIdDe(mestreIndex), vez: jogadorIdDe(responderIndex), outro: players[2].id, resposta: currentCard.answer }));

  // 1) entrar e escolher quem é
  const gM = await abrir("#sala=" + sala + sufixo);
  const gV = await abrir("#sala=" + sala + sufixo);
  conf("Convidado recebe a lista de lugares livres", (await esperar(gM, () => rede && rede.estado === "escolhendo" && rede.lugares.length === 3, null, 15000)) && (await esperar(gV, () => rede && rede.estado === "escolhendo", null, 15000)));
  await gM.evaluate((id) => redeEscolherLugar(id), ids.mestre);
  await gV.evaluate((id) => redeEscolherLugar(id), ids.vez);
  conf("Escolheu o lugar e entrou (com o retrato da partida)", (await esperar(gM, () => rede.estado === "dentro" && !!rede.retrato)) && (await esperar(gV, () => rede.estado === "dentro" && !!rede.retrato)));
  // 2) privacidade
  const semResposta = async (pg) => pg.evaluate((resp) => !JSON.stringify(rede.retrato).includes(resp), ids.resposta);
  conf("Retrato do convidado nunca tem a resposta", (await semResposta(gM)) && (await semResposta(gV)));
  conf("Resposta chega só pro Mestre", (await esperar(gM, (resp) => rede.segredo && rede.segredo.resposta === resp, ids.resposta)) && (await gV.evaluate(() => rede.segredo === null)));
  conf("A tela do Mestre mostra a resposta; a do outro, não", (await gM.evaluate((r) => document.body.innerText.includes(r), ids.resposta)) && !(await gV.evaluate((r) => document.body.innerText.includes(r), ids.resposta)));
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
  conf("Quem está na vez escolhe a dica", r && r.ok && (await H((i) => revealedOrder.some((x) => x.index === i), livre)));
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

(async () => {
  const b = await navegador();
  const todos = [], erros = [];
  if (SO !== "internet") {
    const r = await rodar(b, "local");
    todos.push(...r.ok);
    erros.push(...r.erros);
  }
  if (SO !== "local") {
    const sv = await servidorPeer();
    if (!sv) console.log("(sem o pacote 'peer': o roteiro pela internet não rodou; npm install)");
    else {
      try {
        const r = await rodar(b, "internet", sv.porta);
        todos.push(...r.ok);
        erros.push(...r.erros);
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
