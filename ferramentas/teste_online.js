#!/usr/bin/env node
// Testes do online que faltavam (pedido do JF, antes da 1.7.10). Tudo pela internet "de verdade" (PeerJS +
// WebRTC, servidor de apresentação local, pacote "peer"), com 3 aparelhos: o host (que também joga) e 2 celulares.
//   1. Partida inteira até o fim: Versus Clássico (tabuleiro), Equipe (2 equipes, 4 jogadores, um jogador a
//      mais dividindo o aparelho do host) e Express. Cada aparelho joga sozinho pelo painel que o host calcula.
//   2. iPhone em segundo plano: o celular congela (como o iOS faz ao trocar de app) e volta; o iOS mata a
//      página e o link é aberto de novo; o host congela por pouco tempo (segue) e por muito (o 2º Mestre assume).
//   3. O host atualiza o jogo no meio da partida: os celulares recarregam sozinhos e voltam pro mesmo lugar;
//      com o host mais velho, o celular explica que é o host que precisa atualizar.
//   node ferramentas/teste_online.js [mestre.html] [--so=partidas|fundo|versao] [--servidor=PORTA]
//   --servidor=PORTA: o servidor de apresentação é o nosso (servidor/worker.js no "wrangler dev").
"use strict";
const fs = require("fs");
const { acharMestre } = require("./_navegador");

const args = process.argv.slice(2);
const ARQ = acharMestre(args[0] && args[0].endsWith(".html") ? args[0] : null);
const SO = (args.find((a) => a.startsWith("--so=")) || "").slice(5);
const SERVIDOR = +((args.find((a) => a.startsWith("--servidor=")) || "").slice(11)) || 0;

async function navegador() {
  const { chromium } = require("playwright-core");
  const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium", process.env.CHROMIUM].find((f) => f && fs.existsSync(f));
  return chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ["--disable-features=WebRtcHideLocalIpsWithMdns"] });
}
async function servidorPeer() {
  if (SERVIDOR) return { porta: SERVIDOR, chave: "perfiljf", fechar: () => {} };
  const express = require("express");
  const { ExpressPeerServer } = require("peer");
  const app = express();
  const srv = await new Promise((ok) => {
    const s = app.listen(0, "127.0.0.1", () => ok(s));
  });
  app.use("/", ExpressPeerServer(srv, { path: "/" }));
  return { porta: srv.address().port, chave: "peerjs", fechar: () => srv.close() };
}

const todos = [], erros = [];
// 25/10/2026: cada conferência aparece na hora (se o teste cair no meio, o que já passou ou falhou não se perde)
const conf = (n, v) => {
  todos.push([n, !!v]);
  console.log((v ? "ok    " : "FALHOU") + "  " + n);
};
// um cenário que quebra (erro de script, página fechada) vira uma falha com o motivo, e os outros seguem
async function cenario(nome, fn) {
  try {
    await fn();
  } catch (e) {
    conf(`[${nome}] o cenário rodou até o fim sem quebrar o teste (${String((e && e.message) || e).split("\n")[0].slice(0, 160)})`, false);
  }
}

// Uma mesa: o host (aparelho de mesa que também joga) e 2 celulares. Cada aparelho é um contexto próprio
// (localStorage separado, como aparelhos de verdade).
async function mesa(b, sv, rot) {
  const ctxs = [];
  const abrir = async (hash, extra) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    ctxs.push(ctx);
    await ctx.route(/^https?:/, (r) => (r.request().url().startsWith("http://127.0.0.1:" + sv.porta) ? r.continue() : r.abort()));
    await ctx.addInitScript(
      ([porta, chave]) => {
        try {
          localStorage.setItem("perfil5_tutorial_visto", "x");
          localStorage.setItem("perfil5_tab_lobby", "0");
          localStorage.setItem("perfil5_tut_vitoria_vistos", JSON.stringify(["casa", "tabuleiro", "pontos", "joias"]));
        } catch (e) {}
        if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
        if (window.__REDE_SERVIDOR === undefined) window.__REDE_SERVIDOR = false;
    if (window.__REDE_HOST_SUMIU_MS === undefined) window.__REDE_HOST_SUMIU_MS = 15000; // (o jogo espera 1 min; o teste, 15 s)
    if (window.__REDE_RESERVA_MS === undefined) window.__REDE_RESERVA_MS = 8000; // (o reserva espera +20 s; o teste, +8 s)
    window.__REDE_PEER_CONFIG = { host: "127.0.0.1", port: porta, path: "/", secure: false, key: chave, config: { iceServers: [] } };
      },
      [sv.porta, sv.chave],
    );
    if (extra) await ctx.addInitScript(extra);
    if (process.env.REDE_ESPIAO)
      await ctx.addInitScript(() => {
        const set = Storage.prototype.setItem, rem = Storage.prototype.removeItem, clr = Storage.prototype.clear;
        const pilha = () => new Error().stack.split("\n").slice(2, 6).join(" < ").replace(/file:\/\/\S+?:(\d+):\d+/g, "@$1");
        Storage.prototype.setItem = function (k, v) {
          if (String(k).startsWith("perfil5_rede_eu_")) console.log("[EUKEY] set", this === localStorage ? "ls" : "ss", location.hash, Date.now(), v, pilha());
          return set.call(this, k, v);
        };
        Storage.prototype.removeItem = function (k) {
          if (String(k).startsWith("perfil5_rede_eu_")) console.log("[EUKEY] rem", this === localStorage ? "ls" : "ss", location.hash, Date.now(), pilha());
          return rem.call(this, k);
        };
        Storage.prototype.clear = function () {
          console.log("[EUKEY] clear", location.hash, pilha());
          return clr.call(this);
        };
      });
    const pg = await ctx.newPage();
    if (process.env.REDE_ESPIAO) pg.on("console", (c) => c.text().startsWith("[EUKEY]") && console.log(`[${rot}]`, c.text().slice(0, 300)));
    pg.on("pageerror", (e) => erros.push(`[${rot}] ${e.message.slice(0, 160)}`));
    pg.on("dialog", (d) => d.accept().catch(() => {}));
    await pg.goto("file://" + ARQ + (hash || ""));
    await pg.waitForFunction(() => typeof redeAbrirSala === "function");
    return pg;
  };
  return { abrir, fechar: () => Promise.all(ctxs.map((c) => c.close().catch(() => {}))) };
}
const esperar = (pg, fn, a, ms) => pg.waitForFunction(fn, a, { timeout: ms || 15000 }).then(() => true, () => false);

// Monta a partida no host e abre a sala. cen: { formato, modo, cond, nomes, equipes }
async function montar(host, cen) {
  await host.waitForFunction(() => !document.getElementById("goToRulesBtn").disabled);
  return host.evaluate(async (cen) => {
    document.querySelectorAll(".caos-modal-ov, #novidadesModal, .jf-modal-bg").forEach((o) => o.remove());
    caosSilenced = true;
    CURRENT_FORMAT = cen.formato;
    const eq = cen.formato === "equipe";
    players = cen.nomes.map((n, i) => ({ id: jogadorIdNovo(), name: n, score: 0, position: 0, isBlocked: false, color: eq ? "#888888" : PLAYER_COLORS[i], avatar: AVATARS[i], humor: "normal", ageBracket: eq ? "adulto" : null, idade: "dezesseis", team: null, gems: {} }));
    selectMode(cen.modo, null, cen.sabor);
    if (cen.cond) WIN_CONDITION = cen.cond;
    starterDrawCount = 1;
    if (eq) {
      formTeamsBalancedByAge(cen.equipes || 2);
      equipeSubMode = "duelo";
      drawEquipeOrder();
    } else {
      mestreIndex = 0;
      responderIndex = 1;
    }
    ["splashScreen", "welcomeScreen", "playerPanel", "orderRevealSection"].forEach((id) => {
      const e = document.getElementById(id);
      if (e) e.style.display = "none";
    });
    document.getElementById("gameScreen").style.display = "block";
    const pa = document.getElementById("playAreaSection");
    if (pa) pa.style.display = "block";
    // 1.7.10.6: o Modo C.A.O.S. só começa com a sala aberta e todo mundo dentro (o teste começa depois)
    if (cen.modo === "caos") return redeAbrirSala("internet");
    beginGameplay();
    // 1.7.10.6: a Corrida começa com o relógio curto (senão a partida do teste dura 30 min)
    if (cen.modo === "corrida") {
      corridaDobrar();
      corridaRestaMs = cen.relogio || 150e3;
    }
    await new Promise((r) => setTimeout(r, 300));
    if (activeToastState) closeActiveToast();
    return redeAbrirSala("internet");
  }, cen);
}
// Um celular entra, escolhe o nome e o host aceita.
async function entrar(m, host, sala, nome) {
  const g = await m.abrir("#sala=" + sala);
  await esperar(g, () => rede && rede.estado === "escolhendo" && rede.lugares && rede.lugares.length > 0, null, 20000);
  const id = await host.evaluate((n) => players.find((p) => p.name === n).id, nome);
  await g.evaluate((id) => redeEscolherLugar(id), id);
  await esperar(host, () => Object.keys(rede.pedidos).length > 0, null, 10000);
  await host.evaluate(() => redeAprovarTodos());
  const ok = await esperar(g, () => rede.estado === "dentro" && !!rede.retrato, null, 15000);
  return { g, id, ok };
}

// Um passo de jogo num aparelho. Celular: pelo painel que o host mandou (redeMandar); host: as mesmas opções
// (redeOpcoes) pelos jogadores do aparelho dele, chamando a função do motor (como o toque na tela).
const PASSO_CELULAR = () => {
  if (!rede || rede.estado !== "dentro" || !rede.retrato || rede.retrato.fim) return "nada";
  if (Object.keys(rede.pendentes || {}).length) return "esperando";
  const r = rede.retrato, ops = (rede.painel && rede.painel.opcoes) || [];
  const tem = (a) => ops.findIndex((o) => o.a === a);
  const sorte = Math.random();
  const escolher = () => {
    for (const a of ["continuar", "bonusAdversario", "bonusMestre", "sacarCarta", "roletaCategoria", "virarCarta", "expressAlvo", "moverJogador", "moverEquipe", "especialSeguir", "especialPerdeVez", "expressPular", "expressInverter", "expressMirar"]) if (tem(a) >= 0) return ops[tem(a)];
    // 1.7.10.6 · Corrida: compra na lojinha, usa item, bate na mesa, julga quem bateu, passa a dica
    if (tem("corridaComprar") >= 0 && sorte < 0.5) return ops[tem("corridaComprar")];
    if (tem("corridaUsar") >= 0 && sorte < 0.3) return ops[tem("corridaUsar")];
    if (tem("palpitarAgora") >= 0 && sorte < 0.5) return ops[tem("palpitarAgora")];
    if (tem("palpiteAcertou") >= 0 && sorte < 0.4) return ops[tem("palpiteAcertou")];
    if (tem("palpiteErrou") >= 0) return ops[tem("palpiteErrou")];
    if (tem("corridaProxima") >= 0 && sorte < 0.3) return ops[tem("corridaProxima")];
    const ac = ops.filter((o) => o.a === "acertou");
    if (ac.length && sorte < 0.3) return ac[Math.floor(Math.random() * ac.length)];
    if (tem("errou") >= 0) return ops[tem("errou")];
    if (tem("expressPassar") >= 0) return ops[tem("expressPassar")];
    if (ac.length) return ac[0];
    return null;
  };
  // Mestre com a carta aberta e nenhuma dica pendente: abre uma dica livre
  const c = r.carta;
  const souMestre = r.mestreId === rede.eu;
  if (c && r.estadoCarta === "revealed" && c.pendente === null && souMestre) {
    const usadas = new Set(c.abertas.map((x) => x.pos));
    const livres = Array.from({ length: c.totalDicas }, (_, i) => i).filter((i) => !usadas.has(i));
    // 1.7.10.5.3: com a trava, abre a dica pedida; sem pedido, às vezes usa o "Abrir sem pedido" (fail safe)
    if (livres.length && r.dicaTravada) {
      if (r.pedidoDica) redeMandar("escolherDica", r.pedidoDica.pos);
      else if (sorte < 0.15) redeMandar("escolherDica", livres[Math.floor(Math.random() * livres.length)], true);
      else return "esperando pedido";
      return "dica";
    }
    if (livres.length) {
      redeMandar("escolherDica", livres[Math.floor(Math.random() * livres.length)]);
      return "dica";
    }
  }
  // quem está na vez pede a dica no próprio dispositivo
  const pedir = ops.filter((o) => o.a === "pedirDica");
  if (pedir.length && !r.pedidoDica) {
    const o = pedir[Math.floor(Math.random() * pedir.length)];
    redeMandar(o.a, ...o.d);
    return "pedirDica";
  }
  const o = escolher();
  if (!o) return "nada";
  redeMandar(o.a, ...o.d);
  return o.a;
};
const PASSO_HOST = () => {
  if (!starterChosen || gameEnded) return "nada";
  document.querySelectorAll(".caos-modal-ov").forEach((o) => {
    const b = o.querySelector("button");
    if (b) b.click();
  });
  if (activeToastState) closeActiveToast();
  const sorte = Math.random();
  for (const jid of redeJogadoresNoHost()) {
    const ops = redeOpcoes(jid);
    const tem = (a) => ops.findIndex((o) => o.a === a);
    // dica: o Mestre do aparelho do host abre uma livre
    if (jogadorIdDe(mestreIndex) === jid && cardState === "revealed" && pendingIndex === null && currentCard) {
      const livres = currentCard.clues.map((x, i) => i).filter((i) => acoesDicaLivre(i));
      // 1.7.10.5.3: com a trava, abre a pedida; sem pedido, às vezes força (fail safe)
      if (livres.length && dicaTravada()) {
        const ped = pedidoDicaAtual();
        if (ped) chooseClue(ped.idx);
        else if (sorte < 0.15) chooseClue(livres[Math.floor(Math.random() * livres.length)], true);
        else continue;
        return "dica";
      }
      if (livres.length) {
        chooseClue(livres[Math.floor(Math.random() * livres.length)]);
        return "dica";
      }
    }
    let o = null;
    for (const a of ["continuar", "bonusAdversario", "bonusMestre", "sacarCarta", "roletaCategoria", "virarCarta", "expressAlvo", "moverJogador", "moverEquipe", "especialSeguir", "especialPerdeVez", "expressPular", "expressInverter", "expressMirar"])
      if (!o && tem(a) >= 0) o = ops[tem(a)];
    for (const [a, chance] of [["corridaComprar", 0.5], ["corridaUsar", 0.3], ["palpitarAgora", 0.5], ["palpiteAcertou", 0.4], ["palpiteErrou", 1], ["corridaProxima", 0.3]])
      if (!o && tem(a) >= 0 && sorte < chance) o = ops[tem(a)];
    const ac = ops.filter((x) => x.a === "acertou");
    if (!o && ac.length && sorte < 0.3) o = ac[Math.floor(Math.random() * ac.length)];
    if (!o && tem("errou") >= 0) o = ops[tem("errou")];
    if (!o && tem("expressPassar") >= 0) o = ops[tem("expressPassar")];
    if (!o && ac.length) o = ac[0];
    if (!o) continue;
    const fn = ACOES[o.a] && window[ACOES[o.a].fn];
    if (typeof fn !== "function") continue;
    fn(...o.d);
    return o.a;
  }
  return "nada";
};

// Joga até o fim (ou até o limite de tempo). Devolve quantos passos e se acabou.
async function jogarAteOFim(host, celulares, limiteMs) {
  const t0 = Date.now();
  let passos = 0, parado = 0, revAntes = -1;
  while (Date.now() - t0 < limiteMs) {
    const fim = await host.evaluate(() => gameEnded).catch(() => false);
    if (fim) break;
    await host.evaluate(PASSO_HOST).catch(() => {});
    for (const g of celulares) await g.evaluate(PASSO_CELULAR).catch(() => {});
    await host.waitForTimeout(120);
    passos++;
    const rev = await host.evaluate(() => partidaRevisao).catch(() => revAntes);
    if (rev === revAntes) parado++;
    else parado = 0;
    revAntes = rev;
    // o cronômetro da carta (Express) e o intervalo andam sozinhos; 40 s sem nada mudar = travou
    if (parado > 330) break;
  }
  return { passos, fim: await host.evaluate(() => gameEnded).catch(() => false), seg: Math.round((Date.now() - t0) / 1000) };
}

async function partidaInteira(b, sv, cen) {
  const rot = cen.rot;
  const m = await mesa(b, sv, rot);
  try {
    const host = await m.abrir("");
    const sala = await montar(host, cen);
    conf(`[${rot}] Sala aberta`, await esperar(host, () => rede && rede.transporte.estado === "aberta"));
    const c1 = await entrar(m, host, sala, cen.nomes[1]);
    const c2 = await entrar(m, host, sala, cen.nomes[2]);
    conf(`[${rot}] Os 2 celulares entraram`, c1.ok && c2.ok);
    // o host joga como o 1º; no Equipe, o 4º divide o aparelho do host
    await host.evaluate((ids) => redeDefinirNoHost(ids), [await host.evaluate((n) => players.find((p) => p.name === n).id, cen.nomes[0]), ...(cen.nomes[3] ? [await host.evaluate((n) => players.find((p) => p.name === n).id, cen.nomes[3])] : [])]);
    let r;
    if (cen.modo === "corrida") {
      // os robôs acertam rápido demais (cada acerto dá +10 s e o relógio só cresce): depois de 90 s jogando, o relógio
      // cai pra 55 s, entra no Juízo Final (lá acerto não dá tempo) e a partida tem que acabar sozinha
      await jogarAteOFim(host, [c1.g, c2.g], 90000);
      await host.evaluate(() => {
        if (gameEnded) return;
        corridaDobrar();
        corridaRestaMs = Math.min(corridaRestaMs, 55e3);
      });
      r = await jogarAteOFim(host, [c1.g, c2.g], cen.limite || 360000);
      conf(`[${rot}] Passou pelo Juízo Final`, await host.evaluate(() => corridaJuizo || corridaAcabou));
    } else r = await jogarAteOFim(host, [c1.g, c2.g], cen.limite || 360000);
    if (!r.fim && cen.modo === "corrida")
      console.log("DIAG " + rot + ": " + (await host.evaluate(() => JSON.stringify({ g: Math.round(corridaGeralMs() / 1000), c: Math.round(corridaCartaMs() / 1000), cs: cardState, pi: pendingIndex, tk: timerKind, tl: secondsLeft(), toast: !!activeToastState, ov: !!timeoutOverlayMessage, jan: caosJanelaImportanteAberta(), pausa: !!pausedAt, int: corridaIntervaloAberto(), cartas: stats.totalDrawn, acabou: corridaAcabou, juizo: corridaJuizo, duelo: !!corridaDuelo, desemp: !!corridaDesempate, mestre: jogadorIdDe(mestreIndex), hostEu: rede.hostEu, rev: partidaRevisao, parado: corridaParado(), desde: !!corridaDesde, congela: corridaCongelaMs, aviso: avisoMesa ? avisoMesa.titulo + " " + Math.round((avisoMesa.ate - Date.now()) / 1000) + "s" : null, fila: avisoFila.length, janelas: [...document.querySelectorAll(".caos-modal-ov")].map((m) => m.innerText.slice(0, 60)), timer: !!timerInterval }))));
    conf(`[${rot}] A partida foi até o fim (${r.passos} passos, ${r.seg} s)`, r.fim);
    conf(`[${rot}] Os celulares viram o fim da partida`, (await esperar(c1.g, () => rede.retrato && rede.retrato.fim, null, 15000)) && (await esperar(c2.g, () => rede.retrato && rede.retrato.fim, null, 15000)));
    const placar = await host.evaluate(() => JSON.stringify(players.map((p) => [p.id, p.score, p.position])));
    const iguais = async (g) => g.evaluate((pl) => JSON.stringify(((rede.retrato && rede.retrato.jogadores) || []).map((p) => [p.id, p.pontos, p.casa])) === pl, placar);
    conf(`[${rot}] O placar dos celulares bate com o do host`, (await iguais(c1.g)) && (await iguais(c2.g)));
    // 1.7.10.5.6: as cartas da partida (partida.historico) levam a resposta de carta JÁ encerrada, de propósito;
    // fora delas nenhuma resposta, e a carta da vez só entra no histórico depois de encerrada
    const seg = await host.evaluate(() => ({ resp: (currentCard && currentCard.answer) || "", encerrada: !!currentCard && cartasPartida.some((c) => c.resp === currentCard.answer) }));
    const vazou = !!seg.resp && (await c2.g.evaluate((s) => {
      const r = JSON.parse(JSON.stringify(rede.retrato));
      const hist = (r.partida && r.partida.historico) || [];
      if (r.partida) delete r.partida.historico;
      return JSON.stringify(r).includes(JSON.stringify(s.resp)) || (!s.encerrada && hist.some((c) => c.resp === s.resp));
    }, seg));
    conf(`[${rot}] Nenhum retrato da mesa levou resposta`, !vazou);
  } finally {
    await m.fechar();
  }
}

// 1.7.10.6 · Modo C.A.O.S.: host + 2 dispositivos jogando pelo painel até o fim (cada um tem a sua carta)
const PASSO_MC = (ehHost) => {
  const lista = [];
  const ids = ehHost ? redeJogadoresNoHost() : [rede && rede.eu];
  const r = ehHost ? null : rede && rede.retrato;
  if (!ehHost && (!rede || rede.estado !== "dentro" || !r || r.fim || Object.keys(rede.pendentes || {}).length)) return "nada";
  if (ehHost && (!starterChosen || gameEnded)) return "nada";
  if (ehHost && activeToastState) closeActiveToast();
  for (const id of ids) {
    const ops = ehHost ? redeOpcoes(id) : (rede.painel && rede.painel.opcoes) || [];
    const M = ehHost ? mcRetrato() : r.mc;
    if (M && M.pinata && !M.pinata.ganhou && Math.random() < 0.3) {
      if (ehHost) dispatchAction({ type: "mcPinata", data: [id, M.pinata.palavra] });
      else redeMandar("mcPinata", id, M.pinata.palavra);
      return "pinata";
    }
    const tem = (a) => ops.filter((o) => o.a === a);
    const sorte = Math.random();
    const pega = (a, chance) => {
      const l = tem(a);
      return l.length && sorte < chance ? l[Math.floor(Math.random() * l.length)] : null;
    };
    const o =
      pega("continuar", 1) ||
      (tem("mcVeredito").length ? tem("mcVeredito")[sorte < 0.45 ? 0 : 1] : null) ||
      (tem("mcDesafioVeredito").length ? tem("mcDesafioVeredito")[sorte < 0.5 ? 0 : 1] : null) ||
      pega("mcDuelo", 1) ||
      pega("mcRevanche", 1) ||
      pega("mcDesfib", 0.6) ||
      pega("mcDesafioBater", 0.5) ||
      pega("mcBatataSegurar", 0.2) ||
      pega("mcBatataPassar", 0.5) ||
      pega("mcComprar", 0.3) ||
      pega("mcUsar", 0.2) ||
      pega("mcMaoLeve", 0.3) ||
      pega("mcPalpitar", 0.25);
    if (!o) continue;
    if (ehHost) dispatchAction({ type: o.a, data: o.d });
    else redeMandar(o.a, ...o.d);
    lista.push(o.a);
    return o.a;
  }
  return "nada";
};
async function partidaModoCaos(b, sv) {
  const rot = "Modo C.A.O.S. até o fim";
  const m = await mesa(b, sv, rot);
  try {
    const host = await m.abrir("");
    const cen = { formato: "versus", modo: "caos", nomes: ["Ana", "Beto", "Caio"] };
    const sala = await montar(host, cen);
    conf(`[${rot}] Sala aberta`, await esperar(host, () => rede && rede.transporte.estado === "aberta"));
    const c1 = await entrar(m, host, sala, "Beto");
    const c2 = await entrar(m, host, sala, "Caio");
    conf(`[${rot}] Os 2 dispositivos entraram`, c1.ok && c2.ok);
    await host.evaluate((id) => redeDefinirNoHost([id]), await host.evaluate(() => players.find((p) => p.name === "Ana").id));
    await host.evaluate(() => {
      beginGameplay();
      if (activeToastState) closeActiveToast();
    });
    conf(`[${rot}] Começou (cada um com a sua carta)`, await host.evaluate(() => !!mc && Object.keys(mc.cartas).length === 3));
    // a partida é de 10 min: o teste encurta pra 100 s
    await host.evaluate(() => {
      mcRelogioParar(mc.geral);
      mc.geral.resta = 100e3;
    });
    conf(`[${rot}] Cada dispositivo vê só a própria carta`, await (async () => {
      const resp = await host.evaluate(() => Object.fromEntries(players.map((p) => [p.name, mc.cartas[p.id].resp])));
      await c1.g.waitForTimeout(1500);
      const beto = await c1.g.evaluate(() => (rede.painel && rede.painel.extra && rede.painel.extra.carta && rede.painel.extra.carta.resp) || null);
      const vaza = await c1.g.evaluate((outros) => {
        const t = JSON.stringify(rede.retrato.mc) + JSON.stringify(rede.painel || {});
        return outros.some((x) => t.includes(JSON.stringify(x)));
      }, [resp.Ana, resp.Caio]);
      return beto === resp.Beto && !vaza;
    })());
    const SHOTS = process.env.MC_SHOTS; // pasta pra fotos da tela (conferência visual)
    if (SHOTS) {
      await host.waitForTimeout(2500);
      await host.screenshot({ path: SHOTS + "/mc_host.png", fullPage: true });
      await c1.g.screenshot({ path: SHOTS + "/mc_conv.png", fullPage: true });
    }
    let fotoInt = false;
    const t0 = Date.now();
    let passos = 0;
    const vistos = new Set();
    while (Date.now() - t0 < 300000) {
      if (await host.evaluate(() => gameEnded).catch(() => false)) break;
      const a = await host.evaluate(PASSO_MC, true).catch(() => "erro");
      vistos.add(a);
      for (const g of [c1.g, c2.g]) vistos.add(await g.evaluate(PASSO_MC, false).catch(() => "erro"));
      await host.waitForTimeout(150);
      passos++;
      if (SHOTS && !fotoInt && (await c1.g.evaluate(() => rede.retrato && rede.retrato.mc && rede.retrato.mc.fase === "intervalo").catch(() => false))) {
        fotoInt = true;
        await c1.g.screenshot({ path: SHOTS + "/mc_intervalo.png", fullPage: true });
      }
    }
    const fim = await host.evaluate(() => gameEnded).catch(() => false);
    if (!fim) console.log("DIAG MC: " + (await host.evaluate(() => JSON.stringify({ fase: mc && mc.fase, geral: mc && mcRelogioMs(mc.geral), rodada: mc && mc.rodada, feed: mc && mc.feed }))));
    console.log("MC ações vistas: " + [...vistos].join(", "));
    conf(`[${rot}] A partida foi até o fim (${passos} passos, ${Math.round((Date.now() - t0) / 1000)} s)`, fim);
    conf(`[${rot}] Os dispositivos viram o fim`, (await esperar(c1.g, () => rede.retrato && rede.retrato.fim, null, 15000)) && (await esperar(c2.g, () => rede.retrato && rede.retrato.fim, null, 15000)));
    const placar = await host.evaluate(() => JSON.stringify(players.map((p) => [p.id, p.score])));
    conf(`[${rot}] O placar dos dispositivos bate com o do host`, await c1.g.evaluate((pl) => JSON.stringify((rede.retrato.jogadores || []).map((p) => [p.id, p.pontos])) === pl, placar));
    conf(`[${rot}] Teve palpite e veredito pela rede`, vistos.has("mcPalpitar") && vistos.has("mcVeredito"));
  } finally {
    await m.fechar();
  }
}

// iPhone em segundo plano
async function segundoPlano(b, sv) {
  const rot = "segundo plano";
  const m = await mesa(b, sv, rot);
  try {
    const host = await m.abrir("");
    const cen = { formato: "versus", modo: "classico", cond: "tabuleiro", nomes: ["JF", "Anne", "Pedro"] };
    const sala = await montar(host, cen);
    await esperar(host, () => rede && rede.transporte.estado === "aberta");
    const anne = await entrar(m, host, sala, "Anne");
    const pedro = await entrar(m, host, sala, "Pedro");
    await host.evaluate((id) => redeDefinirNoHost([id]), await host.evaluate(() => players.find((p) => p.name === "JF").id));
    conf(`[${rot}] Mesa montada (JF no host, Anne e Pedro nos celulares)`, anne.ok && pedro.ok);
    const congelar = async (pg, ms) => {
      const cdp = await pg.context().newCDPSession(pg);
      // o Chromium não congela página com WebRTC aberto (setWebLifecycleState não pega): pausa o JavaScript
      // inteiro pelo depurador, como o iOS suspende o app (a conexão fica lá, mas ninguém responde)
      // como o iOS: antes de suspender, a página fica escondida (visibilitychange)
      await pg.evaluate(() => {
        Object.defineProperty(document, "hidden", { value: true, configurable: true });
        Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await new Promise((r) => setTimeout(r, 200));
      await cdp.send("Debugger.enable");
      await cdp.send("Debugger.pause");
      await new Promise((r) => setTimeout(r, ms));
      await cdp.send("Debugger.resume").catch(() => {});
      await cdp.send("Debugger.disable").catch(() => {});
      await pg.evaluate(() => {
        delete document.hidden;
        delete document.visibilityState;
        document.dispatchEvent(new Event("visibilitychange"));
      }).catch(() => {});
      await cdp.detach().catch(() => {});
    };
    // 1) a Anne troca de app por 8 s; enquanto isso a partida anda no host
    // (26/10/2026: o Chromium grava o localStorage no disco com uns segundos de atraso; congelar o celular menos de
    // 1 s depois de entrar segurava essa gravação, e fechar a página logo depois perdia o lugar guardado. Um celular
    // de verdade não troca de app no mesmo segundo em que entra: espera a gravação antes de congelar.)
    await anne.g.waitForTimeout(2500);
    const congela = congelar(anne.g, 8000);
    await host.waitForTimeout(600);
    await jogarAteOFim(host, [pedro.g], 5000);
    await congela;
    const revHost = await host.evaluate(() => partidaRevisao);
    conf(`[${rot}] Celular volta do segundo plano (8 s) e pega a partida de onde ela está`, await esperar(anne.g, (rv) => rede.estado === "dentro" && rede.retrato && rede.retrato.revisao >= rv, revHost, 20000));
    // 2) o iOS mata a página da Anne (sem aviso); ela abre o link de novo e volta pro lugar dela
    const ctxAnne = anne.g.context();
    await anne.g.close({ runBeforeUnload: false });
    await jogarAteOFim(host, [pedro.g], 4000);
    const volta = await ctxAnne.newPage();
    volta.on("pageerror", (e) => erros.push(`[${rot}] ${e.message.slice(0, 160)}`));
    if (process.env.REDE_ESPIAO) volta.on("console", (c) => c.text().startsWith("[EUKEY]") && console.log(`[${rot} volta]`, c.text().slice(0, 300)));
    await volta.goto("file://" + ARQ + "#sala=" + sala);
    const voltouAnne = await esperar(volta, (id) => rede && rede.estado === "dentro" && rede.eu === id && !!rede.retrato, anne.id, 25000);
    if (!voltouAnne) {
      console.log("[diag ios] anne:", await volta.evaluate(() => JSON.stringify({ rede: rede ? { estado: rede.estado, eu: rede.eu, motivo: rede.motivo, t: rede.transporte.estado, erro: rede.transporte.erro, diag: rede.transporte.diag && rede.transporte.diag() } : null, guardado: Object.keys(localStorage).filter((k) => k.startsWith("perfil5_rede_eu_")).map((k) => k + "=" + localStorage.getItem(k)) })).catch(String));
      console.log("[diag ios] host:", await host.evaluate(() => JSON.stringify({ pedidos: Object.values(rede.pedidos).map((x) => x.tipo + ":" + x.chave), aprovados: Object.keys(rede.aprovados), assentos: Object.entries(rede.assentos).map(([k, a]) => k + ":" + a.chave + ":" + (redeOnline(a) ? "on" : "off")), t: rede.transporte.estado })).catch(String));
    }
    conf(`[${rot}] O iOS fechou a página: abrindo o link de novo ela volta pro mesmo lugar, sem pedir de novo`, voltouAnne);
    // 3) o host (JF) troca de app por 6 s: a sala continua com ele
    await congelar(host, 6000);
    await host.waitForTimeout(1500);
    conf(`[${rot}] Host volta de 6 s em segundo plano e continua host`, (await host.evaluate(() => rede && rede.papel === "host")) && (await esperar(volta, () => rede.papel === "convidado" && rede.estado === "dentro", null, 15000)));
    const revAntes = await host.evaluate(() => partidaRevisao);
    await jogarAteOFim(host, [volta, pedro.g], 8000); // (a roleta da categoria leva uns 3 s)
    conf(`[${rot}] A partida anda depois que o host volta`, (await host.evaluate(() => partidaRevisao)) > revAntes);
    // 4) o host some por 30 s (ligação recebida): o 2º Mestre começa a assumir. Se o servidor já soltou a sala
    //    (o nosso solta em 20 s), ele vira host e o JF volta como jogador; se a sala ainda está presa no
    //    aparelho do JF (o público segura até ~90 s), o JF continua host e a Anne volta a ser jogadora.
    //    Em qualquer caso: um host só, todo mundo de volta e nada perdido.
    const revCong = await host.evaluate(() => partidaRevisao);
    await congelar(host, 30000);
    const pgs = [host, volta, pedro.g];
    const papeis = async () => Promise.all(pgs.map((pg) => pg.evaluate(() => (rede ? rede.papel + ":" + (rede.papel === "host" ? rede.transporte.estado : rede.estado) : "nada")).catch(() => "recarregando")));
    let fim = [], t0 = Date.now();
    while (Date.now() - t0 < 150000) {
      fim = await papeis();
      if (process.env.DIAG && (Date.now() - t0) % 10000 < 1100) console.log("DIAG", Math.round((Date.now() - t0) / 1000), fim.join(" | "), (await Promise.all(pgs.map((pg) => pg.evaluate(() => JSON.stringify(rede && rede.transporte && rede.transporte.diag ? rede.transporte.diag() : null)).catch(() => "?")))).join(" / "));
      if (fim.filter((x) => x === "host:aberta").length === 1 && fim.filter((x) => x === "convidado:dentro").length === 2) break;
      await host.waitForTimeout(1000);
    }
    if (process.env.DIAG) console.log("DIAG papéis", fim.join(" | "), Math.round((Date.now() - t0) / 1000) + " s");
    conf(`[${rot}] Host sumiu 30 s: no fim fica um host só e os outros dois de volta na sala (${Math.round((Date.now() - t0) / 1000)} s)`, fim.filter((x) => x === "host:aberta").length === 1 && fim.filter((x) => x === "convidado:dentro").length === 2);
    const quem = pgs[fim.indexOf("host:aberta")];
    if (process.env.DIAG && quem) console.log("DIAG volta", revCong, await quem.evaluate(() => JSON.stringify({ rev: partidaRevisao, ini: starterChosen, fim: gameEnded, tam: (JFStore.getItem("perfil200_state") || "").length }))); 
    conf(`[${rot}] Nada se perdeu na volta (mesma revisão ou à frente)`, !!quem && (await quem.evaluate((r) => partidaRevisao >= r && starterChosen && !gameEnded, revCong)));
    if (quem) {
      const outros = pgs.filter((pg) => pg !== quem);
      const antes = await quem.evaluate(() => partidaRevisao);
      await jogarAteOFim(quem, outros, 4000);
      conf(`[${rot}] A partida continua depois da volta`, (await quem.evaluate(() => partidaRevisao)) > antes);
    }
  } finally {
    await m.fechar();
  }
}

// 1.7.10.6 (relato do JF: o dispositivo do host descarregou e a sala travou): o host morre de vez (página fechada)
// e o sucessor está "dormindo" (não assume). O reserva tem que assumir e a partida continuar de onde estava.
async function hostMorreu(b, sv) {
  const rot = "host morreu";
  const m = await mesa(b, sv, rot);
  try {
    const host = await m.abrir("");
    const nomes = ["JF", "Anne", "Jhenny", "Sofia"];
    const sala = await montar(host, { formato: "versus", modo: "classico", cond: "tabuleiro", nomes });
    await esperar(host, () => rede && rede.transporte.estado === "aberta");
    const cs = [];
    for (const n of nomes.slice(1)) cs.push(await entrar(m, host, sala, n));
    await host.evaluate((id) => redeDefinirNoHost([id]), await host.evaluate(() => players.find((p) => p.name === "JF").id));
    conf(`[${rot}] Mesa montada (JF no host, 3 dispositivos)`, cs.every((c) => c.ok));
    await jogarAteOFim(host, cs.map((c) => c.g), 6000);
    await host.waitForTimeout(2500); // o pacote de recuperação chega no sucessor e no reserva
    const sucs = await host.evaluate(() => redeSucessores());
    conf(`[${rot}] Tem sucessor e reserva`, sucs.length === 2);
    const pg = (id) => cs.find((c) => c.id === id).g;
    const temPacote = await pg(sucs[1]).evaluate(() => !!(rede && rede.recuperacao));
    conf(`[${rot}] O reserva também recebeu o pacote da partida`, temPacote);
    const revAntes = await host.evaluate(() => partidaRevisao);
    // o sucessor "dorme" (segundo plano): não assume
    await pg(sucs[0]).evaluate(() => (redeAssumir = () => false));
    await host.close({ runBeforeUnload: false });
    const papel = (g) => g.evaluate(() => (rede ? rede.papel + ":" + (rede.papel === "host" ? rede.transporte.estado : rede.estado) : "nada")).catch(() => "recarregando");
    let novo = null, t0 = Date.now();
    while (Date.now() - t0 < 90000) {
      if ((await papel(pg(sucs[1]))) === "host:aberta") { novo = pg(sucs[1]); break; }
      await cs[0].g.waitForTimeout(1000);
    }
    conf(`[${rot}] O reserva assumiu a sala (${Math.round((Date.now() - t0) / 1000)} s)`, !!novo);
    if (novo) {
      conf(`[${rot}] Nada se perdeu (mesma revisão ou à frente)`, await novo.evaluate((r) => partidaRevisao >= r && starterChosen && !gameEnded, revAntes));
      const outros = cs.filter((c) => c.id !== sucs[1]).map((c) => c.g);
      let voltaram = true;
      for (const g of outros) voltaram = voltaram && (await esperar(g, () => rede && rede.papel === "convidado" && rede.estado === "dentro", null, 40000));
      conf(`[${rot}] Os outros dois voltaram pra sala do novo host`, voltaram);
      // o JF ficou sem dispositivo: quem assumiu joga por ele também (a tela do host mostra o jogo inteiro)
      await novo.evaluate(() => redeDefinirNoHost(redeJogadoresNoHost().concat(players.find((p) => p.name === "JF").id)));
      const antes = await novo.evaluate(() => partidaRevisao);
      await jogarAteOFim(novo, outros, 15000);
      const andou = (await novo.evaluate(() => partidaRevisao)) > antes;
      if (!andou) for (const g of outros) console.log("DIAG conv:", await g.evaluate(() => JSON.stringify({ eu: rede.eu, est: rede.estado, rev: rede.retrato && rede.retrato.revisao, ops: (rede.painel && rede.painel.opcoes || []).map((o) => o.a), pend: Object.keys(rede.pendentes).length, resp: Object.values(rede.respostas).slice(-2) })));
      if (!andou) console.log("DIAG caiu:", await novo.evaluate(() => JSON.stringify({ m: (players[mestreIndex] || {}).name, v: (players[responderIndex] || {}).name, cs: cardState, pi: pendingIndex, noHost: redeJogadoresNoHost().map((id) => jogadorPorId(id).name), toast: !!activeToastState, pausa: !!pausedAt, modais: [...document.querySelectorAll(".caos-modal-ov, .jf-modal-bg")].map((o) => o.textContent.slice(0, 80)), tk: timerKind, ops: redeJogadoresNoHost().map((id) => redeOpcoes(id).map((o) => o.a)) })));
      conf(`[${rot}] A partida continua`, andou);
    }
  } finally {
    await m.fechar();
  }
}

// O host atualiza o jogo no meio da partida
async function atualizacao(b, sv) {
  const rot = "atualização";
  const m = await mesa(b, sv, rot);
  try {
    const host = await m.abrir("");
    const sala = await montar(host, { formato: "versus", modo: "classico", cond: "tabuleiro", nomes: ["JF", "Anne", "Pedro"] });
    await esperar(host, () => rede && rede.transporte.estado === "aberta");
    const anne = await entrar(m, host, sala, "Anne");
    await host.evaluate((id) => redeDefinirNoHost([id]), await host.evaluate(() => players.find((p) => p.name === "JF").id));
    await jogarAteOFim(host, [anne.g], 3000);
    // 1.7.10 (alerta do Klaus): a versão nova se chama "1.0", que "volta" no número; quem decide é o build
    const build = await host.evaluate(() => JOGO_BUILD);
    const nova = "1.0", novaInit = `window.__JOGO_VERSAO = "1.0"; window.__JOGO_BUILD = ${build + 1};`;
    // a Anne marca quando o jogo pediu pra recarregar (no teste, em vez de recarregar de verdade)
    await anne.g.evaluate(() => (window.__REDE_RECARREGAR = () => (window.__recarregou = (window.__recarregou || 0) + 1)));
    await host.addInitScript(novaInit);
    await host.reload();
    await host.waitForFunction(() => typeof redeAbrirSala === "function");
    const voltou = await esperar(host, () => rede && rede.papel === "host" && rede.transporte.estado === "aberta", null, 30000);
    if (!voltou) console.log("[diag atualização]", await host.evaluate(() => JSON.stringify({ rede: rede ? { papel: rede.papel, t: rede.transporte.estado } : null, starterChosen, gameEnded, orfa: !!document.getElementById("redeOrfa"), guardado: localStorage.getItem("perfil5_rede_host"), versao: JOGO_VERSAO })));
    conf(`[${rot}] Host recarregou com a versão nova ("Release 1.0", build maior) e a sala voltou`, voltou);
    conf(`[${rot}] O celular da Anne vê que o host atualizou e recarrega sozinho`, await esperar(anne.g, () => window.__recarregou === 1, null, 30000));
    await anne.g.waitForTimeout(3000);
    conf(`[${rot}] Recarrega uma vez só (sem ficar em loop se a versão nova ainda não chegou)`, (await anne.g.evaluate(() => window.__recarregou)) === 1 && (await anne.g.evaluate(() => /Recarregue a página/.test(document.body.innerText))));
    // a versão nova chega no celular: ela volta pro mesmo lugar
    await anne.g.context().addInitScript(novaInit);
    await anne.g.reload();
    conf(`[${rot}] Com a versão nova, a Anne volta pro mesmo lugar na partida`, await esperar(anne.g, (id) => rede && rede.estado === "dentro" && rede.eu === id, anne.id, 25000));
    // host mais velho que o celular: o celular explica que quem precisa atualizar é o host
    const p2 = await m.abrir("#sala=" + sala, `window.__JOGO_VERSAO = "1.0.1"; window.__JOGO_BUILD = ${build + 5};`);
    await host.evaluate(() => 0);
    conf(`[${rot}] Celular mais novo que o host: avisa que o host precisa recarregar`, await esperar(p2, () => rede && rede.motivo === "versao_diferente" && /host está mais velho/.test(document.body.innerText), null, 20000));
  } finally {
    await m.fechar();
  }
}

// 1.7.10.6 · relato do Henrique (online): "desafiei o Rafa, o Vitinho acertou e a questão travou". Mesa de 4 com
// 3 dispositivos de fora: força duelos bônus Henrique × Rafa (com o Rafa de Mestre, o leitor é emprestado) e os
// robôs jogam pelo painel. O Vitinho ainda tenta marcar acerto pra ele e "Palpitar agora" no meio do duelo.
// Confere: quem responde é sempre duelista, o Mestre nunca é duelista, o leitor emprestado volta, os
// dispositivos veem o mesmo Mestre e a mesma carta do host, e a partida nunca fica parada.
async function dueloOnline(b, sv) {
  const rot = "Duelo bônus online (relato Henrique)";
  const m = await mesa(b, sv, rot);
  try {
    const host = await m.abrir("");
    const nomes = ["JF", "Henrique", "Rafa", "Vitinho"];
    const sala = await montar(host, { formato: "versus", modo: "classico", cond: "tabuleiro", nomes });
    conf(`[${rot}] Sala aberta`, await esperar(host, () => rede && rede.transporte.estado === "aberta"));
    const cs = [];
    for (const n of nomes.slice(1)) cs.push(await entrar(m, host, sala, n));
    conf(`[${rot}] Os 3 dispositivos entraram`, cs.every((c) => c.ok));
    await host.evaluate((id) => redeDefinirNoHost([id]), await host.evaluate(() => players.find((p) => p.name === "JF").id));
    await host.evaluate(() => {
      WINNING_SCORE = 9999;
      const orig = dispatchAction;
      dispatchAction = function (cmd) {
        const r = orig.apply(this, arguments);
        const nm = (i) => (players[i] ? players[i].name[0] : "-");
        const est = () => `{${cardState[0]}${currentCard && currentCard.isBonus ? "B" + nm(currentCard.bonusLanderPlayerIdx) + nm(currentCard.bonusOpponentPlayerIdx) : ""} M${nm(mestreIndex)} R${nm(responderIndex)}}`;
        if (r && r.ok) window.__ultAcao = ((window.__ultAcao || "") + " " + cmd.type + JSON.stringify(cmd.data || []) + est()).slice(-600);
        return r;
      };
    });
    const vit = cs[2];
    const problemas = [];
    let duelos = 0, acertos = 0, tentativas = 0, parado = 0, revAntes = -1;
    const t0 = Date.now();
    while (Date.now() - t0 < 150000 && duelos < 14) {
      // carta nova escondida e sem duelo: vira duelo Henrique × Rafa (metade das vezes com o Rafa de Mestre)
      const forc = await host.evaluate(() => {
        if (gameEnded || cardState !== "hidden" || !currentCard || currentCard.isBonus || activeToastState) return false;
        const h = players.findIndex((p) => p.name === "Henrique"), r = players.findIndex((p) => p.name === "Rafa");
        devolverAoBaralho(cardsByAnswer.get(currentCard.answer) || currentCard);
        currentCard = null;
        if (Math.random() < 0.6) mestreIndex = r;
        pendingBonusQueue.push({ landerIdx: h, opponentIdx: r });
        drawHidden();
        return !!(currentCard && currentCard.isBonus);
      }).catch(() => false);
      if (forc) { duelos++; await host.evaluate(() => (window.__ultAcao = (window.__ultAcao || "") + " FORCA")); }
      // o Vitinho tenta se meter no duelo
      const meio = await host.evaluate(() => !!(currentCard && currentCard.isBonus && pendingIndex !== null)).catch(() => false);
      if (meio && Math.random() < 0.5) {
        tentativas++;
        await vit.g.evaluate((id) => {
          const i = (rede.retrato.jogadores || []).findIndex((p) => p.id === id);
          redeMandar(Math.random() < 0.5 ? "acertou" : "palpitarAgora", Math.random() < 0.5 ? i : id);
        }, vit.id).catch(() => {});
      }
      const antesAc = await host.evaluate(() => history.length).catch(() => 0);
      const ph = await host.evaluate(PASSO_HOST).catch(() => "");
      if (ph && ph !== "nada") await host.evaluate((ph) => { const nm = (i) => (players[i] ? players[i].name[0] : "-"); window.__ultAcao = ((window.__ultAcao || "") + " HOST:" + ph + `{${cardState[0]}${currentCard && currentCard.isBonus ? "B" + nm(currentCard.bonusLanderPlayerIdx) + nm(currentCard.bonusOpponentPlayerIdx) : ""} M${nm(mestreIndex)} R${nm(responderIndex)}}`).slice(-600); }, ph);
      for (const c of cs) await c.g.evaluate(PASSO_CELULAR).catch(() => {});
      await host.waitForTimeout(120);
      const st = await host.evaluate(() => {
        const out = { rev: partidaRevisao, hist: history.length, fim: gameEnded, mestre: jogadorIdDe(mestreIndex), cs: cardState };
        if (currentCard && currentCard.isBonus) {
          const a = currentCard.bonusLanderPlayerIdx, b = currentCard.bonusOpponentPlayerIdx;
          out.bonus = cardState !== "bonusChoice"; // na escolha do adversário a carta bônus velha ainda está na memória
          out.respDuelista = responderIndex === a || responderIndex === b;
          out.mestreFora = mestreIndex !== a && mestreIndex !== b;
          out.diag = JSON.stringify({ a: players[a] && players[a].name, b: players[b] && players[b].name, resp: players[responderIndex] && players[responderIndex].name, mestre: players[mestreIndex] && players[mestreIndex].name, orig: bonusOrigMestreIdx, cs: cardState, pi: pendingIndex, rev: revealedOrder.length, ult: (window.__ultAcao || "") });
        } else out.emprestado = bonusOrigMestreIdx !== null && bonusOrigMestreIdx !== void 0;
        return out;
      }).catch(() => null);
      if (!st) continue;
      if (st.hist > antesAc) acertos++;
      if (st.bonus && (!st.respDuelista || !st.mestreFora) && process.env.DUELO_DIAG) console.log("DIAG", st.diag);
      if (st.bonus && !st.respDuelista) problemas.push("quem responde não é duelista");
      if (st.bonus && !st.mestreFora) problemas.push("Mestre é duelista");
      if (!st.bonus && st.emprestado && st.cs !== "bonusChoice") problemas.push("leitor emprestado não voltou");
      if (st.fim) break;
      parado = st.rev === revAntes ? parado + 1 : 0;
      revAntes = st.rev;
      if (parado > 200) {
        problemas.push("partida parada: " + JSON.stringify(await host.evaluate(() => ({ cs: cardState, pi: pendingIndex, tk: timerKind, bonus: !!(currentCard && currentCard.isBonus), toast: !!activeToastState }))));
        break;
      }
    }
    // no fim, os dispositivos veem o mesmo Mestre e o mesmo estado da carta
    await host.waitForTimeout(1500);
    const hs = await host.evaluate(() => ({ m: jogadorIdDe(mestreIndex), e: cardState }));
    let iguais = true;
    for (const c of cs) iguais = iguais && (await esperar(c.g, (h) => rede.retrato && rede.retrato.mestreId === h.m && rede.retrato.estadoCarta === h.e, hs, 8000));
    console.log(`DUELO ONLINE: ${duelos} duelos, ${acertos} cartas acertadas, ${tentativas} tentativas do Vitinho`);
    conf(`[${rot}] Jogou ${duelos} duelos (≥ 6)`, duelos >= 6);
    conf(`[${rot}] Nunca travou e as regras do duelo valeram em todo passo`, [...new Set(problemas)].length === 0 || console.log("  " + [...new Set(problemas)].join(" | ")));
    conf(`[${rot}] Os dispositivos veem o mesmo Mestre e a mesma carta do host`, iguais);
  } finally {
    await m.fechar();
  }
}

(async () => {
  const b = await navegador();
  const sv = await servidorPeer();
  try {
    const partida = (cen) => cenario(cen.rot, () => partidaInteira(b, sv, cen));
    if (!SO || SO === "partidas") {
      await partida({ rot: "Versus Clássico até o fim", formato: "versus", modo: "classico", cond: "tabuleiro", nomes: ["Ana", "Beto", "Caio"] });
      await partida({ rot: "Equipe até o fim", formato: "equipe", modo: "classico", cond: "tabuleiro", equipes: 2, nomes: ["Ana", "Beto", "Caio", "Davi"] });
      await partida({ rot: "Express até o fim", formato: "versus", modo: "express", sabor: "classico", nomes: ["Ana", "Beto", "Caio"] });
    }
    if (!SO || SO === "partidas" || SO === "corrida") {
      await partida({ rot: "Corrida · Tempo até o fim", formato: "versus", modo: "corrida", sabor: "tempo", relogio: 90e3, limite: 420000, nomes: ["Ana", "Beto", "Caio"] }); // 1.7.10.8: intervalo de 15 s e avisos congelam o relógio, o fim demora mais em tempo real
      await partida({ rot: "Corrida · Tempo Hardcore até o fim", formato: "versus", modo: "corrida", sabor: "tempo-hc", relogio: 120e3, nomes: ["Ana", "Beto", "Caio"] });
    }
    if (!SO || SO === "partidas" || SO === "caos") await cenario("Modo C.A.O.S.", () => partidaModoCaos(b, sv));
    if (!SO || SO === "partidas" || SO === "duelo") await cenario("Duelo online", () => dueloOnline(b, sv));
    if (!SO || SO === "fundo") await cenario("Segundo plano", () => segundoPlano(b, sv));
    if (!SO || SO === "fundo" || SO === "caiu") await cenario("Host caiu", () => hostMorreu(b, sv));
    if (!SO || SO === "versao") await cenario("Atualização", () => atualizacao(b, sv));
  } finally {
    sv.fechar();
    await b.close();
  }
  const falhas = todos.filter((x) => !x[1]);
  console.log(`\n${todos.length - falhas.length} de ${todos.length} conferências ok.`);
  falhas.forEach(([n]) => console.log("FALHOU  " + n));
  if (erros.length) console.log("Erros na página:", [...new Set(erros)].slice(0, 12).join(" | "));
  else console.log("Sem erro na página.");
  const tudo = todos.every((x) => x[1]) && !erros.length;
  console.log(tudo ? "ONLINE OK" : "ONLINE COM PROBLEMA");
  process.exit(tudo ? 0 : 1);
})();
