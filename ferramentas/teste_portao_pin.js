#!/usr/bin/env node
// 06/11/2026 · Portão do PIN (pedido do JF): nick com cadastro só entra como o dono depois do PIN, mesmo com o login
// guardado no aparelho; sem o PIN, outro nick ou o ADM libera como convidado; e quem o C.A.O.S. conhece (JF, Anne,
// família) só é reconhecido pelo cadastro. Servidor de mentira (page.route); PIN de mentira "2468".
//   node ferramentas/teste_portao_pin.js [mestre.html]
const { acharMestre, abrirNavegador } = require("./_navegador");
const file = acharMestre(process.argv[2]);
const CADASTRADOS = ["jf", "nickteste", "outro"];
(async () => {
  const ok = [];
  const conf = (n, v) => ok.push([n, !!v]);
  const b = await abrirNavegador();
  let offline = false;
  try {
    const pg = await (await b.newContext()).newPage();
    const erros = [];
    pg.on("pageerror", (e) => erros.push(e.message));
    await pg.route(/fonts\.|google/, (r) => r.abort());
    await pg.route(/\/conta\//, async (r) => {
      if (offline) return r.abort();
      const url = r.request().url(), corpo = JSON.parse(r.request().postData() || "{}");
      const k = String(corpo.nick || "").toLowerCase().replace(/\s+/g, "");
      const json = (st, o) => r.fulfill({ status: st, contentType: "application/json", body: JSON.stringify(o) });
      if (/existe/.test(url)) return json(200, { existe: CADASTRADOS.includes(k), semPin: false });
      if (/entrar/.test(url)) return corpo.pin === "2468" ? json(200, { ok: true, token: "tok-" + k, nick: corpo.nick, ficha: null }) : json(401, { erro: "pin", restam: 3 });
      return json(200, { ok: true, ficha: null });
    });
    await pg.addInitScript(() => {
      try {
        localStorage.setItem("perfil5_tutorial_visto", "x");
        localStorage.setItem("perfil5_anne_ligada", "1");
      } catch (e) {}
      window.__REDE_SERVIDOR = { host: "127.0.0.1", port: 8787, secure: false };
      if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
    });
    await pg.goto("file://" + file);
    await pg.waitForFunction(() => typeof contaExigirPin === "function" && typeof addPlayer === "function");
    await pg.waitForTimeout(800);
    const r = await pg.evaluate(async () => {
      const out = {};
      const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
      const limpar = () => document.querySelectorAll(".caos-modal-ov").forEach((x) => x.remove());
      const modal = async () => {
        for (let i = 0; i < 40 && !document.querySelector(".caos-modal-ov"); i++) await espera(50);
        return document.querySelector(".caos-modal-ov");
      };
      const botao = (re) => [...document.querySelectorAll(".caos-modal-ov button")].find((x) => re.test(x.textContent));
      const pin = async (v) => {
        botao(/Digitar o PIN/).click();
        for (let i = 0; i < 20 && !document.querySelector('.caos-modal-ov input[type="password"]'); i++) await espera(30);
        document.querySelector('.caos-modal-ov input[type="password"]').value = v;
        botao(/^OK$/).click();
        await espera(300);
      };
      const add = (n) => {
        document.getElementById("playerNameInput").value = n;
        addPlayer();
      };
      const tem = (n) => players.find((p) => p.name === n);
      limpar();
      players = [];
      // 1) o caso do JF: login guardado neste aparelho (a família cadastrou aqui) → pede o PIN ANTES de entrar
      contaGuardarLogin("JF", "tok-antigo", "2468");
      await espera(600); // a conferência do PIN pro modo sem internet é guardada em segundo plano
      add("JF");
      out.pedeAntes = !!(await modal()) && !tem("JF") && /já tem cadastro/.test(document.querySelector(".caos-modal-ov").textContent);
      // 2) PIN errado não entra; volta a pergunta
      await pin("1111");
      for (let i = 0; i < 20 && !botao(/^OK$/); i++) await espera(30);
      botao(/^OK$/) && botao(/^OK$/).click(); // fecha o aviso "PIN errado"
      out.pinErradoNaoEntra = !tem("JF") && !!(await modal()) && !!botao(/Digitar o PIN/);
      // 3) PIN certo: entra como o dono, com o tratamento do JF (😎 e reconhecido)
      await pin("2468");
      for (let i = 0; i < 40 && !tem("JF"); i++) await espera(50);
      const jf = tem("JF");
      out.pinCertoEntraComoDono = !!jf && !!jf.conta && !jf.nickEmprestado && isJfName("JF") && jf.avatar === "😎";
      limpar();
      // 4) Usar outro nick: não entra; o campo vem com a sugestão
      add("NickTeste");
      await modal();
      botao(/Usar outro nick/).click();
      await espera(100);
      out.outroNickNaoEntra = !tem("NickTeste") && document.getElementById("playerNameInput").value === "NickTeste 2";
      limpar();
      // 5) ADM libera como convidado: entra sem o dono (senha de mentira só no teste)
      const admReal = admHash;
      admHash = (v) => (v === "9911" ? ADM_CRIADOR_HASH : admReal(v) + "x");
      players = [];
      contaMarcarConhecida("JF", true);
      add("JF");
      await modal();
      [...document.querySelectorAll(".caos-modal-ov button")].find((x) => /ADM libera/.test(x.textContent)).click();
      await espera(100);
      const campo = document.querySelector(".caos-modal-ov input");
      campo.value = "9911";
      botao(/^OK$/).click();
      await espera(150);
      botao(/^OK$/) && botao(/^OK$/).click(); // aviso "O ADM liberou"
      for (let i = 0; i < 40 && !tem("JF"); i++) await espera(50);
      const conv = tem("JF");
      out.admLiberaConvidado = !!conv && conv.convidadoAdm === true && conv.nickEmprestado === true && !isJfName("JF") && conv.avatar !== "😎";
      admHash = admReal;
      limpar();
      // 6) aparelho que não sabia: entra, o servidor avisa e a janela aparece; até resolver, sem o tratamento do dono
      players = [];
      contaMarcarConhecida("Outro", false);
      add("Outro");
      const entrouAntes = !!tem("Outro");
      await modal();
      out.servidorAvisaDepois = entrouAntes && tem("Outro").nickEmprestado === true && !!botao(/Digitar o PIN/);
      botao(/Usar outro nick/).click();
      await espera(100);
      out.outroNickTiraDaLista = !tem("Outro");
      limpar();
      // 7) nick sem cadastro entra normal, mas nome conhecido sem cadastro não ganha o tratamento (a Anne de qualquer um)
      players = [];
      add("Anne");
      await espera(400);
      limpar();
      out.semCadastroEntraSemTratamento = !!tem("Anne") && !isAnneName("Anne") && isAnneNomeBruto("Anne") && tem("Anne").avatar !== "👸";
      return out;
    });
    Object.entries(r).forEach(([k, v]) => conf(k, v));
    // 8) sem internet, com o login guardado: o PIN é conferido no aparelho
    offline = true;
    const r2 = await pg.evaluate(async () => {
      const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
      document.querySelectorAll(".caos-modal-ov").forEach((x) => x.remove());
      players = [];
      document.getElementById("playerNameInput").value = "JF";
      addPlayer();
      for (let i = 0; i < 40 && !document.querySelector(".caos-modal-ov"); i++) await espera(50);
      const bt = (re) => [...document.querySelectorAll(".caos-modal-ov button")].find((x) => re.test(x.textContent));
      bt(/Digitar o PIN/).click();
      for (let i = 0; i < 20 && !document.querySelector('.caos-modal-ov input[type="password"]'); i++) await espera(30);
      document.querySelector('.caos-modal-ov input[type="password"]').value = "2468";
      bt(/^OK$/).click();
      for (let i = 0; i < 60 && !players.some((p) => p.name === "JF"); i++) await espera(50);
      const p = players.find((q) => q.name === "JF");
      return !!p && !!p.conta && isJfName("JF");
    });
    conf("semInternetConfereNoAparelho", r2);
    conf("semErroNaPagina", !erros.length);
    if (erros.length) console.log("Erros:", erros.join(" | "));
  } finally {
    await b.close();
  }
  ok.forEach(([n, v]) => console.log((v ? "ok    " : "FALHOU") + "  " + n));
  const tudo = ok.every((x) => x[1]);
  console.log(tudo ? "PORTÃO DO PIN OK" : "PORTÃO DO PIN COM PROBLEMA");
  process.exit(tudo ? 0 : 1);
})();
