#!/usr/bin/env node
// Teste do cadastro dos jogadores no servidor (11/2026): nick + PIN, ficha na nuvem, bloqueio de PIN errado e
// o painel do JF. Precisa do servidor rodando (wrangler dev) com REPORTES_SENHA de teste.
//   node ferramentas/teste_contas.js [--servidor=8787] [--senha=teste-senha] [--so-servidor]
// Também abre o jogo (dois dispositivos) falando com esse servidor: cria, joga, sobe a ficha, protege o nick.
const arg = (k, d) => (process.argv.find((a) => a.startsWith("--" + k + "=")) || "").split("=")[1] || d;
const BASE = "http://127.0.0.1:" + arg("servidor", "8787");
const SENHA = arg("senha", "teste-senha");
const post = async (cam, corpo) => {
  const r = await fetch(BASE + cam, { method: "POST", body: JSON.stringify(corpo), headers: { Origin: "null" } });
  let j = {};
  try {
    j = await r.json();
  } catch (e) {}
  return { s: r.status, j };
};
(async () => {
  const o = {};
  const nick = "Teste" + Math.random().toString(36).slice(2, 7);
  o.naoExiste = (await post("/conta/existe", { nick })).j.existe === false;
  const c = await post("/conta/criar", { nick, pin: "1234" });
  o.cria = c.s === 200 && !!c.j.token;
  o.existeDepois = (await post("/conta/existe", { nick: nick.toUpperCase() })).j.existe === true;
  o.naoCriaDeNovo = (await post("/conta/criar", { nick, pin: "9999" })).s === 409;
  o.pinRuimRecusado = (await post("/conta/criar", { nick: nick + "x", pin: "12a4" })).s === 400;
  const ficha = { partidas: 3, vitorias: 1, ultimaVez: Date.now(), ultimoResultado: "venceu" };
  o.salva = (await post("/conta/salvar", { nick, token: c.j.token, ficha })).s === 200;
  o.semTokenNaoSalva = (await post("/conta/salvar", { nick, token: "errado", ficha })).s === 401;
  const e = await post("/conta/entrar", { nick, pin: "1234" });
  o.entraEPegaFicha = e.s === 200 && e.j.ficha && e.j.ficha.partidas === 3 && e.j.token !== c.j.token;
  o.tokenAntigoVale = (await post("/conta/ficha", { nick, token: c.j.token })).s === 200;
  const erros = [];
  for (let i = 0; i < 5; i++) erros.push((await post("/conta/entrar", { nick, pin: "0000" })).s);
  o.bloqueiaDepoisDe5 = erros.slice(0, 5).every((x) => x === 401) && (await post("/conta/entrar", { nick, pin: "1234" })).s === 429;
  o.sair = (await post("/conta/sair", { nick, token: e.j.token })).s === 200 && (await post("/conta/ficha", { nick, token: e.j.token })).s === 401;
  // painel do JF
  const pag = await fetch(BASE + "/contas?chave=" + SENHA);
  o.painel = pag.status === 200 && (await pag.text()).includes(nick);
  o.painelSemSenha = (await fetch(BASE + "/contas?chave=errada")).status === 401;
  const fd = (campos) => new URLSearchParams(campos);
  await fetch(BASE + "/contas/pin", { method: "POST", body: fd({ chave: SENHA, nick }), redirect: "manual" });
  const ex = (await post("/conta/existe", { nick })).j;
  const recria = await post("/conta/criar", { nick, pin: "4321" });
  o.zerarPinMantemFicha = ex.semPin === true && recria.s === 200 && recria.j.ficha && recria.j.ficha.partidas === 3;
  await fetch(BASE + "/contas/apagar", { method: "POST", body: fd({ chave: SENHA, nick }), redirect: "manual" });
  o.apagar = (await post("/conta/existe", { nick })).j.existe === false;
  // o jogo de verdade falando com o servidor local: cria o cadastro, cadastra o jogador, sobe a ficha no fim,
  // e outro dispositivo (sem o login) usando o mesmo nick fica sem a memória
  if (!process.argv.includes("--so-servidor")) {
    const { acharMestre, abrirNavegador } = require("./_navegador");
    const b = await abrirNavegador();
    const abrir = async () => {
      const ctx = await b.newContext();
      const page = await ctx.newPage();
      await page.route(/fonts\./, (r) => r.abort());
      const porta = Number(arg("servidor", "8787"));
      await page.addInitScript((porta) => {
        window.__REDE_SERVIDOR = { host: "127.0.0.1", port: porta, secure: false };
        try {
          localStorage.setItem("perfil5_tutorial_visto", "x");
        } catch (e) {}
      }, porta);
      await page.goto("file://" + acharMestre());
      await page.waitForFunction(() => typeof contaAbrir === "function");
      return page;
    };
    const nick2 = "Jog" + Math.random().toString(36).slice(2, 7);
    const pg = await abrir();
    const r1 = await pg.evaluate(async (nick2) => {
      const out = {};
      // cria pelo caminho do jogo (os modais respondidos pelo teste)
      const pins = ["2468", "2468"];
      window.contaPinModal = (msg, cb) => setTimeout(() => cb(pins.shift()), 0);
      window.caosAvisoModal = (msg, ok) => ((out.aviso = msg), ok && ok());
      await contaAbrir(nick2);
      for (let i = 0; i < 50 && !contaLogin(nick2); i++) await new Promise((r) => setTimeout(r, 100));
      out.criouPeloJogo = !!contaLogin(nick2) && /Pronto/.test(out.aviso || "");
      delete out.aviso;
      // cadastra o jogador e simula uma partida jogada
      const inp = document.getElementById("playerNameInput");
      inp.value = nick2;
      addPlayer();
      const p = players.find((x) => x.name === nick2);
      out.jogadorTemConta = !!(p && p.conta && !p.nickEmprestado);
      fichaUpd(nick2, (f) => ((f.partidas = 7), (f.vitorias = 2), (f.ultimaVez = Date.now()), (f.ultimoResultado = "venceu")));
      contasSalvarFichas();
      await new Promise((r) => setTimeout(r, 1500));
      const r = await contaPost("ficha", { nick: nick2, token: contaLogin(nick2).token });
      out.fichaSubiu = !!(r.ok && r.ficha && r.ficha.partidas === 7);
      return out;
    }, nick2);
    Object.assign(o, r1);
    // outro dispositivo, sem login, mesmo nick: sem memória; depois entra com o PIN e a ficha chega
    const pg2 = await abrir();
    const r2 = await pg2.evaluate(async (nick2) => {
      const out = {};
      const inp = document.getElementById("playerNameInput");
      inp.value = nick2;
      addPlayer();
      const p = players.find((x) => x.name === nick2);
      for (let i = 0; i < 50 && !p.nickEmprestado; i++) await new Promise((r) => setTimeout(r, 100));
      out.outroDispositivoSemMemoria = !!p.nickEmprestado && !p.conta && !memContaFicha(p);
      // a pergunta aparece sozinha depois de cadastrar o nick (pedido do JF), pedindo o PIN
      for (let i = 0; i < 30 && !/tem cadastro/.test(document.body.innerText); i++) await new Promise((r) => setTimeout(r, 100));
      out.perguntaSozinha = /tem cadastro/.test(document.body.innerText) && /Digitar o PIN/.test(document.body.innerText);
      document.querySelectorAll(".caos-modal-ov").forEach((o) => o.remove());
      const pins = ["2468"];
      window.contaPinModal = (msg, cb) => setTimeout(() => cb(pins.shift()), 0);
      window.caosAvisoModal = (msg, ok) => ok && ok();
      await contaAbrir(nick2);
      for (let i = 0; i < 50 && !contaLogin(nick2); i++) await new Promise((r) => setTimeout(r, 100));
      const f = fichaGet(nick2);
      out.entrouEFichaChegou = !!contaLogin(nick2) && !!f && f.partidas === 7;
      return out;
    }, nick2);
    Object.assign(o, r2);
    await b.close();
    await fetch(BASE + "/contas/apagar", { method: "POST", body: new URLSearchParams({ chave: SENHA, nick: nick2 }), redirect: "manual" });
  }
  let falhas = 0;
  for (const [k, v] of Object.entries(o)) {
    console.log((v ? "ok   " : "FALHA") + " " + k);
    if (!v) falhas++;
  }
  console.log(falhas ? "CONTAS COM PROBLEMA" : "CONTAS OK");
  process.exit(falhas ? 1 : 0);
})().catch((e) => {
  console.log("erro:", e.message);
  process.exit(1);
});
