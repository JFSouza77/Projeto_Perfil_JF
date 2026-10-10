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
const conf = (n, v) => todos.push([n, !!v]);

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
    window.__REDE_PEER_CONFIG = { host: "127.0.0.1", port: porta, path: "/", secure: false, key: chave, config: { iceServers: [] } };
      },
      [sv.porta, sv.chave],
    );
    if (extra) await ctx.addInitScript(extra);
    const pg = await ctx.newPage();
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
    players = cen.nomes.map((n, i) => ({ id: jogadorIdNovo(), name: n, score: 0, position: 0, isBlocked: false, color: eq ? "#888888" : PLAYER_COLORS[i], avatar: AVATARS[i], humor: "normal", ageBracket: eq ? "adulto" : null, team: null, gems: {} }));
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
    beginGameplay();
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
    for (const a of ["continuar", "bonusAdversario", "sacarCarta", "virarCarta", "expressAlvo", "moverJogador", "moverEquipe", "especialSeguir", "especialPerdeVez", "expressPular", "expressInverter", "expressMirar"]) if (tem(a) >= 0) return ops[tem(a)];
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
    if (livres.length) {
      redeMandar("escolherDica", livres[Math.floor(Math.random() * livres.length)]);
      return "dica";
    }
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
      if (livres.length) {
        chooseClue(livres[Math.floor(Math.random() * livres.length)]);
        return "dica";
      }
    }
    let o = null;
    for (const a of ["continuar", "bonusAdversario", "sacarCarta", "virarCarta", "expressAlvo", "moverJogador", "moverEquipe", "especialSeguir", "especialPerdeVez", "expressPular", "expressInverter", "expressMirar"])
      if (!o && tem(a) >= 0) o = ops[tem(a)];
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
    const r = await jogarAteOFim(host, [c1.g, c2.g], cen.limite || 360000);
    conf(`[${rot}] A partida foi até o fim (${r.passos} passos, ${r.seg} s)`, r.fim);
    conf(`[${rot}] Os celulares viram o fim da partida`, (await esperar(c1.g, () => rede.retrato && rede.retrato.fim, null, 15000)) && (await esperar(c2.g, () => rede.retrato && rede.retrato.fim, null, 15000)));
    const placar = await host.evaluate(() => JSON.stringify(players.map((p) => [p.id, p.score, p.position])));
    const iguais = async (g) => g.evaluate((pl) => JSON.stringify((rede.retrato.jogadores || []).map((p) => [p.id, p.pontos, p.casa])) === pl, placar);
    conf(`[${rot}] O placar dos celulares bate com o do host`, (await iguais(c1.g)) && (await iguais(c2.g)));
    const segredo = await host.evaluate(() => (currentCard && currentCard.answer) || "");
    conf(`[${rot}] Nenhum retrato da mesa levou resposta`, !segredo || !(await c2.g.evaluate((s) => JSON.stringify(rede.retrato).includes(JSON.stringify(s)), segredo)));
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
    await volta.goto("file://" + ARQ + "#sala=" + sala);
    conf(`[${rot}] O iOS fechou a página: abrindo o link de novo ela volta pro mesmo lugar, sem pedir de novo`, await esperar(volta, (id) => rede && rede.estado === "dentro" && rede.eu === id && !!rede.retrato, anne.id, 25000));
    // 3) o host (JF) troca de app por 6 s: a sala continua com ele
    await congelar(host, 6000);
    await host.waitForTimeout(1500);
    conf(`[${rot}] Host volta de 6 s em segundo plano e continua host`, (await host.evaluate(() => rede && rede.papel === "host")) && (await esperar(volta, () => rede.papel === "convidado" && rede.estado === "dentro", null, 15000)));
    const revAntes = await host.evaluate(() => partidaRevisao);
    await jogarAteOFim(host, [volta, pedro.g], 3000);
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
    conf(`[${rot}] Host recarregou com a versão nova ("Release 1.0", build maior) e a sala voltou`, await esperar(host, () => rede && rede.papel === "host" && rede.transporte.estado === "aberta", null, 30000));
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

(async () => {
  const b = await navegador();
  const sv = await servidorPeer();
  try {
    if (!SO || SO === "partidas") {
      await partidaInteira(b, sv, { rot: "Versus Clássico até o fim", formato: "versus", modo: "classico", cond: "tabuleiro", nomes: ["Ana", "Beto", "Caio"] });
      await partidaInteira(b, sv, { rot: "Equipe até o fim", formato: "equipe", modo: "classico", cond: "tabuleiro", equipes: 2, nomes: ["Ana", "Beto", "Caio", "Davi"] });
      await partidaInteira(b, sv, { rot: "Express até o fim", formato: "versus", modo: "express", sabor: "classico", nomes: ["Ana", "Beto", "Caio"] });
    }
    if (!SO || SO === "fundo") await segundoPlano(b, sv);
    if (!SO || SO === "versao") await atualizacao(b, sv);
  } finally {
    sv.fechar();
    await b.close();
  }
  todos.forEach(([n, v]) => console.log((v ? "ok    " : "FALHOU") + "  " + n));
  if (erros.length) console.log("Erros na página:", [...new Set(erros)].slice(0, 12).join(" | "));
  else console.log("Sem erro na página.");
  const tudo = todos.every((x) => x[1]) && !erros.length;
  console.log(tudo ? "ONLINE OK" : "ONLINE COM PROBLEMA");
  process.exit(tudo ? 0 : 1);
})();
