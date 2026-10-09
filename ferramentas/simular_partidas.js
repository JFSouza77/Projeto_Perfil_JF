#!/usr/bin/env node
// Simulador de partidas inteiras (1.7.7.5 · Foundation and Structure Update, Parte 6).
// Joga partidas completas e automáticas no Mestre, em todos os modos e formatos (Versus;
// Equipe 2×2, 2×3 e 3×2), tocando nos mesmos botões que a mesa toca. Ele usa semente (o sorteio
// de regra do jogo e as escolhas do "jogador robô") e tem limite de passos, então nunca roda pra sempre.
// Depois de cada passo, confere as regras que nunca podem quebrar:
//   placar e casa nunca negativos · joias de cada um ≤ 4 · todo jogador com o mesmo id ·
//   Mestre e vez sempre num jogador que existe · a partida termina · nenhum erro na página ·
//   a espinha do C.A.O.S. nunca precisou desfazer nada (ele não encostou no jogo).
//   node ferramentas/simular_partidas.js [mestre.html] [--semente=N] [--so=nome] [--passos=N] [--replay]
// Com --replay, cada partida é repetida a partir das ações gravadas e tem que chegar ao mesmo estado.
// As esperas do jogo (balões, animações) são encurtadas pra 5 ms só dentro do simulador.
// A semente fixa os sorteios de regra e as escolhas do robô, mas a partida exata ainda pode variar
// um pouco entre execuções: se um balão ainda está aberto ou não quando o robô age depende do tempo.
"use strict";
const { acharMestre, abrirNavegador } = require("./_navegador");
const argv = process.argv.slice(2);
const opt = (k, d) => {
  const a = argv.find((x) => x.startsWith("--" + k + "="));
  return a ? a.split("=")[1] : d;
};
const ARQ = acharMestre(argv.find((x) => !x.startsWith("--")));
const SEMENTE = parseInt(opt("semente", "2026"), 10);
const SO = opt("so", "");
const PASSOS = parseInt(opt("passos", "6000"), 10);
const REPLAY = argv.includes("--replay");

const N = (n) => ["Ana", "Beto", "Caio", "Duda", "Edu", "Fabi"].slice(0, n);
const CENARIOS = [
  { nome: "versus-classico-tabuleiro-3", formato: "versus", modo: "classico", cond: "tabuleiro", jog: 3 },
  { nome: "versus-classico-pontos-4", formato: "versus", modo: "classico", cond: "pontos", jog: 4 },
  { nome: "versus-classico-joias-3", formato: "versus", modo: "classico", cond: "joias", jog: 3 },
  { nome: "versus-classico-casa-3", formato: "versus", modo: "classico", cond: "casa", jog: 3 },
  { nome: "versus-classico-tabuleiro-6", formato: "versus", modo: "classico", cond: "tabuleiro", jog: 6 },
  { nome: "versus-hardcore-tabuleiro-4", formato: "versus", modo: "hardcore", cond: "tabuleiro", jog: 4 },
  { nome: "versus-junior-tabuleiro-3", formato: "versus", modo: "junior", cond: "tabuleiro", jog: 3 },
  { nome: "versus-oldschool-tabuleiro-2", formato: "versus", modo: "oldschool", cond: "tabuleiro", jog: 2 },
  { nome: "versus-express-classico-3", formato: "versus", modo: "express", sabor: "classico", jog: 3 },
  { nome: "versus-express-hardcore-4", formato: "versus", modo: "express", sabor: "hardcore", jog: 4 },
  { nome: "equipe-2x2-classico-tabuleiro", formato: "equipe", modo: "classico", cond: "tabuleiro", jog: 4, equipes: 2 },
  { nome: "equipe-2x3-hardcore-pontos", formato: "equipe", modo: "hardcore", cond: "pontos", jog: 6, equipes: 2 },
  { nome: "equipe-3x2-duelo-tabuleiro", formato: "equipe", modo: "classico", cond: "tabuleiro", jog: 6, equipes: 3, sub: "duelo" },
  { nome: "equipe-3x2-todos-joias", formato: "equipe", modo: "classico", cond: "joias", jog: 6, equipes: 3, sub: "ffa" },
].filter((c) => !SO || c.nome.includes(SO));

// Monta a mesa na página (a mesma pro jogo e pro replay): semente, jogadores (com os ids dados no
// replay), modo, condição, equipes e começo da partida. Grava cada ação em window.__grav.
function montarMesa({ cen, semente, nomes, ids }) {
  window.__grav = [];
  // impressão digital do estado de regra depois de cada ação (pra achar a 1ª divergência no replay)
  window.__hash = (t) => {
    let h = 2166136261;
    for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
    return (h >>> 0).toString(36);
  };
  window.__grav_h = {};
  acoesAoMudar((e) => {
    window.__grav.push({ r: e.r, a: e.a, d: e.d, h: window.__hash(caosEspinhaFoto() + "|" + sorteioContagem) });
    window.__grav_h[e.r] = window.__hash(caosEspinhaFoto() + "|" + sorteioContagem);
  });
      sorteioSemear(semente * 7 + 1);
      document.querySelectorAll(".caos-modal-ov, #novidadesModal").forEach((o) => o.remove());
      // mesa montada como no cadastro
      CURRENT_FORMAT = cen.formato;
      players = nomes.map((n, i) => ({
        id: ids ? ids[i] : jogadorIdNovo(),
        name: n,
        score: 0,
        position: 0,
        isBlocked: false,
        color: CURRENT_FORMAT === "equipe" ? "#888888" : PLAYER_COLORS[i],
        avatar: "😀",
        humor: "normal",
        ageBracket: CURRENT_FORMAT === "equipe" ? "adulto" : null,
        team: null,
        gems: {},
      }));
      selectMode(cen.modo, null, cen.sabor);
      if (cen.cond) WIN_CONDITION = cen.cond;
      if (cen.formato === "equipe") {
        formTeamsBalancedByAge(cen.equipes);
        equipeSubMode = cen.sub || "duelo";
        starterDrawCount = 1;
        drawEquipeOrder();
      } else {
        starterDrawCount = 1;
        mestreIndex = pickStarterMestreVersus();
        responderIndex = nextResponder(mestreIndex, mestreIndex);
      }
      ["splashScreen", "welcomeScreen", "playerPanel", "orderRevealSection"].forEach((id) => {
        const e = document.getElementById(id);
        if (e) e.style.display = "none";
      });
      document.getElementById("gameScreen").style.display = "block";
      const pa = document.getElementById("playAreaSection");
      if (pa) pa.style.display = "block";
      beginGameplay();
  return players.map((p) => p.id);
}

async function jogar(b, cen, semente) {
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.addInitScript(() => {
    // esperas curtas: o jogo inteiro roda em segundos
    const st = window.setTimeout.bind(window);
    window.__esperaReal = st;
    window.setTimeout = (fn, ms, ...a) => st(fn, Number(ms) >= 7000 ? ms : Math.min(Number(ms) || 0, 5), ...a);
    try {
      localStorage.setItem("perfil5_tutorial_visto", "x");
      localStorage.setItem("perfil5_tut_vitoria_vistos", JSON.stringify(["casa", "tabuleiro", "pontos", "joias"]));
    } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
  });
  await page.goto("file://" + ARQ);
  await page.waitForFunction(() => typeof sorteioSemear === "function" && !document.getElementById("goToRulesBtn").disabled);
  await page.evaluate(montarMesa, { cen, semente, nomes: N(cen.jog), ids: null });
  const r = await page.evaluate(
    async ({ cen, semente, nomes, PASSOS }) => {
      const espera = () => new Promise((ok) => window.__esperaReal(ok, 0));
      // robô com semente própria (as escolhas dele) e sorteio de regra do jogo com semente
      let s = semente >>> 0;
      const rnd = () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      // a mesa já foi montada por montarMesa (mesma função usada no replay)
      const ids = players.map((p) => p.id).join();
      const quebras = [];
      const quebra = (m) => quebras.length < 10 && quebras.push(`passo ${passo}: ${m}`);
      const vis = (sel) => [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null && !e.disabled);
      const evitar = /giveUpBtn|discardBtn|reshuffleBtn|conferirBtn|answerToggle|endGameBtn|pauseBtn|resetBtn/;
      const tocar = (el) => {
        toqueJogoUltimo = 0; // a trava de toque duplo é pra dedo, não pro robô
        el.click();
      };
      const acoes = {};
      let passo = 0;
      for (; passo < PASSOS && !gameEnded; passo++) {
        await espera();
        let feito = "";
        if (activeToastState) {
          closeActiveToast();
          feito = "balao";
        } else if (document.getElementById("desfazerBtn") && desfazerOferta && window.__ofertaVista !== desfazerOferta && ((window.__ofertaVista = desfazerOferta), rnd() < 0.1)) {
          // 1.7.8.2: o robô às vezes se arrepende do veredito (botão fixo: offsetParent é null)
          tocar(document.getElementById("desfazerBtn"));
          feito = "desfazer";
        } else if (vis("#tutClose").length) {
          tocar(vis("#tutClose")[0]);
          feito = "tutorial";
        } else if (vis(".caos-modal-ov button, .casa-sorteio-ov button, .jf-modal-bg button, #expressTargetModal button").length) {
          const bs = vis(".caos-modal-ov button, .casa-sorteio-ov button, .jf-modal-bg button, #expressTargetModal button");
          tocar(bs[Math.floor(rnd() * bs.length)]);
          feito = "janela";
        } else if (vis("#cardArea .number-btn:not(.aberta)").length) {
          const bs = vis("#cardArea .number-btn:not(.aberta)");
          tocar(bs[Math.floor(rnd() * bs.length)]);
          feito = "numero";
        } else if (vis("#correctBtn, #wrongBtn").length) {
          // chance de acertar cresce com as dicas abertas
          const abertas = revealedOrder.filter((x) => x.item.type === "clue").length;
          const x = rnd();
          const pal = vis("#cardArea .palpite-hit");
          if (pal.length && x < 0.05) tocar(pal[0]);
          else if (x < 0.1 + abertas * 0.05) tocar(vis("#correctBtn")[0] || vis("#wrongBtn")[0]);
          else if (x < 0.8) tocar(vis("#wrongBtn")[0]);
          else if (x < 0.9 && vis("#pularBtn").length) tocar(vis("#pularBtn")[0]);
          else tocar(vis("#absurdoBtn")[0] || vis("#wrongBtn")[0]);
          feito = "veredito";
        } else if (vis("#expressCorrectBtn, #expressNextBtn").length) {
          const abertas = revealedOrder.filter((x) => x.item.type === "clue").length;
          tocar(rnd() < 0.08 + abertas * 0.06 && vis("#expressCorrectBtn").length ? vis("#expressCorrectBtn")[0] : vis("#expressNextBtn")[0] || vis("#expressCorrectBtn")[0]);
          feito = "express";
        } else {
          const bs = vis("#cardArea button").filter((e) => !evitar.test(e.id + " " + e.className));
          const d = vis("#drawBtn");
          if (bs.length) {
            const pref = bs.find((e) => /flipBtn|rouletteDoneBtn|continueSpecialBtn/.test(e.id));
            tocar(pref || bs[Math.floor(rnd() * bs.length)]);
            feito = "carta";
          } else if (d.length) {
            tocar(d[0]);
            feito = "sacar";
          } else if (pausaEstaAberta && pausaEstaAberta()) {
            resumeGame();
            feito = "pausa";
          } else feito = "espera";
        }
        acoes[feito] = (acoes[feito] || 0) + 1;
        // regras que nunca podem quebrar
        players.forEach((p) => {
          if (!(p.score >= 0)) quebra(`${p.name} com placar ${p.score}`);
          if (!(p.position >= 0)) quebra(`${p.name} na casa ${p.position}`);
          const g = Object.values(p.gems || {}).reduce((a, v) => a + v, 0);
          if (g > GEMS_TO_WIN) quebra(`${p.name} com ${g} joias`);
        });
        Object.keys(teams).forEach((k) => {
          if (!(teams[k].position >= 0)) quebra(`equipe ${k} na casa ${teams[k].position}`);
          const g = Object.values(teams[k].gems || {}).reduce((a, v) => a + v, 0);
          if (g > GEMS_TO_WIN) quebra(`equipe ${k} com ${g} joias`);
        });
        if (players.map((p) => p.id).join() !== ids) quebra("id de jogador mudou");
        // 1.7.8.1: o retrato público nunca leva a resposta da carta em jogo
        if (typeof retratoPartida === "function" && passo % 10 === 0 && currentCard) {
          const pub = JSON.stringify(retratoPartida("mesa"));
          if (pub.includes('"' + currentCard.answer + '"') || (currentCard.id && pub.includes(currentCard.id))) quebra("retrato público com a resposta");
        }
        // 1.7.8: a revisão da partida só cresce, e o registro de ações acompanha
        if (typeof partidaRevisao === "number") {
          if (partidaRevisao < (window.__revAnt || 0)) quebra(`revisão voltou (${window.__revAnt} → ${partidaRevisao})`);
          window.__revAnt = partidaRevisao;
        }
        if (!gameEnded && starterChosen && !players[mestreIndex]) quebra(`Mestre inválido (${mestreIndex})`);
        if (!gameEnded && starterChosen && cardState === "revealed" && !players[responderIndex]) quebra(`vez inválida (${responderIndex})`);
      }
      return {
        terminou: gameEnded,
        passos: passo,
        cartas: stats.totalDrawn,
        quebras,
        acoes,
        leis: caosEspinha.leis,
        falhasCaos: caosEspinha.falhas,
        espinhaLog: caosEspinha.log.filter((l) => !/instalada/.test(l)).slice(-3),
        sorteios: sorteioContagem,
        revisao: typeof partidaRevisao === "number" ? partidaRevisao : 0,
        vencedor: (() => {
          try {
            return caosVencedoresIdx().map((i) => players[i].name).join("+") || "?";
          } catch (e) {
            return "?";
          }
        })(),
        cond: winCond(),
        // pro replay: as ações gravadas, os ids e o retrato final (sem relógio)
        gravacao: window.__grav,
        ids: players.map((p) => p.id),
        final: (() => {
          const f = retratoPartida("mestre");
          delete f.relogio;
          delete f.matchId; // o replay é outra partida: o matchId é novo
          delete f.tabuleiro; // e a forma do tabuleiro (só desenho) é sorteada de novo
          return JSON.stringify(f);
        })(),
      };
    },
    { cen, semente, nomes: N(cen.jog), PASSOS },
  );
  await page.close();
  r.erros = erros;
  return r;
}

// Replay (1.7.8.5): partida nova com a mesma semente e os mesmos ids; repete as ações gravadas, na
// ordem. Ação que o próprio jogo dispara sozinho (ex.: sacar a carta depois do balão) já chega pela
// revisão: se a revisão já alcançou a da ação gravada, ela não é repetida. No fim, o retrato tem que
// ser idêntico ao da partida original.
async function replay(b, cen, semente, original) {
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.addInitScript(() => {
    const st = window.setTimeout.bind(window);
    window.__esperaReal = st;
    window.setTimeout = (fn, ms, ...a) => st(fn, Number(ms) >= 7000 ? ms : Math.min(Number(ms) || 0, 5), ...a);
    try {
      localStorage.setItem("perfil5_tutorial_visto", "x");
      localStorage.setItem("perfil5_tut_vitoria_vistos", JSON.stringify(["casa", "tabuleiro", "pontos", "joias"]));
    } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
  });
  await page.goto("file://" + ARQ);
  await page.waitForFunction(() => typeof sorteioSemear === "function" && !document.getElementById("goToRulesBtn").disabled);
  await page.evaluate(montarMesa, { cen, semente, nomes: N(cen.jog), ids: original.ids });
  if (process.env.DBG) await page.evaluate(() => (window.__DBG = 1));
  const r = await page.evaluate(async (grav) => {
    const espera = () => new Promise((ok) => window.__esperaReal(ok, 0));
    // deixa o jogo assentar: balões fecham, janelas somem, o que estava agendado roda
    const assentar = async () => {
      for (let i = 0; i < 12; i++) {
        await espera();
        if (activeToastState) closeActiveToast();
        document.querySelectorAll(".caos-modal-ov, .casa-sorteio-ov, #tutorialOverlay").forEach((o) => o.remove());
      }
    };
    let divergiu = null;
    let avisoMeio = null;
    let repetidas = 0;
    let consumidas = 0; // ações do próprio replay já casadas com a gravação
    const AUTOMATICAS = ["sacarCarta", "tempoAcabou", "encerrar"]; // o jogo também faz sozinho
    for (const e of grav) {
      // o Desfazer foi tocado logo depois do veredito: assentar antes deixaria o jogo seguir (sacar a
      // próxima carta) e a oferta sumir, coisa que na partida gravada não aconteceu
      if (e.a !== "desfazer") await assentar();
      // o replay já fez sozinho uma ação deste tipo? (ex.: sacar a carta depois do balão)
      const proprias = window.__grav;
      let casou = false;
      while (consumidas < proprias.length) {
        const x = proprias[consumidas++];
        if (x.a === e.a) {
          casou = true;
          break;
        }
      }
      if (casou) continue;
      const res = dispatchAction({ type: e.a, data: e.d.map((x) => (x === null ? undefined : x)) });
      consumidas = window.__grav.length;
      if (res.ok) {
        repetidas++;
        continue;
      }
      if (AUTOMATICAS.includes(e.a) && (res.motivo === "fora_de_hora" || res.motivo === "sem_efeito")) continue; // já tinha acontecido dentro de outra ação
      divergiu = `ação ${e.r} (${e.a} ${JSON.stringify(e.d)}): ${res.motivo}` + (window.__DBG ? " · " + JSON.stringify({ cs: cardState, pi: pendingIndex, antes: grav.filter((x) => x.r > e.r - 6 && x.r <= e.r).map((x) => x.r + x.a + JSON.stringify(x.d)) }) : "");
      break;
    }
    await assentar();
    const f = retratoPartida("mestre");
    delete f.relogio;
          delete f.matchId; // o replay é outra partida: o matchId é novo
          delete f.tabuleiro; // e a forma do tabuleiro (só desenho) é sorteada de novo
    return { divergiu, avisoMeio, repetidas, final: JSON.stringify(f) };
  }, original.gravacao);
  await page.close();
  // a revisão conta ações aceitas; ação automática que no replay já veio embutida em outra (sacar,
  // tempo, encerrar) não soma de novo. Se o estado é o mesmo, a diferença só no contador é anotada.
  const semRev = (s) => { const o = JSON.parse(s); r.rev = (r.rev || []).concat(o.revisao); delete o.revisao; return JSON.stringify(o); };
  r.igual = !r.divergiu && semRev(r.final) === semRev(original.final);
  if (r.igual && r.rev[0] !== r.rev[1]) r.notaRev = `revisão ${r.rev[1]} no original, ${r.rev[0]} no replay (automáticas embutidas)`;
  if (!r.igual && !r.divergiu) {
    const A = JSON.parse(original.final), B = JSON.parse(r.final);
    r.divergiu = "estado final diferente em: " + Object.keys(A).filter((k) => JSON.stringify(A[k]) !== JSON.stringify(B[k])).map((k) => k + (process.env.DBG ? "=" + JSON.stringify(A[k]).slice(0, 160) + " ≠ " + JSON.stringify(B[k]).slice(0, 160) : "")).join(", ");
  }
  r.erros = erros;
  return r;
}

(async () => {
  const b = await abrirNavegador();
  let tudoOk = true;
  console.log(`Simulador · ${require("path").basename(ARQ)} · semente ${SEMENTE} · limite ${PASSOS} passos\n`);
  for (let i = 0; i < CENARIOS.length; i++) {
    const cen = CENARIOS[i];
    const r = await jogar(b, cen, SEMENTE + i);
    const ok = r.terminou && !r.quebras.length && !r.erros.length && r.leis === 0;
    tudoOk = tudoOk && ok;
    console.log(
      `${ok ? "ok    " : "FALHOU"}  ${cen.nome.padEnd(30)} ${String(r.cartas).padStart(3)} cartas · ${String(r.passos).padStart(4)} passos · ${r.sorteios} sorteios · rev ${r.revisao} · ${r.acoes.desfazer || 0} desfazer · vence: ${r.vencedor} (${r.cond})`,
    );
    if (!r.terminou) console.log(`        não terminou em ${PASSOS} passos · ações: ${JSON.stringify(r.acoes)}`);
    r.quebras.forEach((q) => console.log("        regra quebrada: " + q));
    r.erros.slice(0, 3).forEach((e) => console.log("        erro na página: " + e));
    if (r.leis) console.log(`        espinha desfez ${r.leis} vez(es): ${r.espinhaLog.join(" | ")}`);
    if (r.falhasCaos) console.log(`        (C.A.O.S. teve ${r.falhasCaos} erro(s) contido(s) pela 3ª lei)`);
    if (REPLAY && r.terminou) {
      const rp = await replay(b, cen, SEMENTE + i, r);
      const okR = rp.igual && !rp.erros.length;
      tudoOk = tudoOk && okR;
      console.log(`        replay: ${okR ? "ok, mesmo estado final" : "DIVERGIU"} (${rp.repetidas} ações repetidas de ${r.gravacao.length})${rp.divergiu ? " · " + rp.divergiu : ""}${rp.avisoMeio && !rp.igual ? " · 1º estado diferente: " + rp.avisoMeio : ""}${rp.notaRev ? " · " + rp.notaRev : ""}${rp.erros.length ? " · erro: " + rp.erros[0] : ""}`);
    }
  }
  console.log(tudoOk ? "\nSIMULAÇÃO OK" : "\nSIMULAÇÃO COM PROBLEMA");
  await b.close();
  process.exit(tudoOk ? 0 : 1);
})();
