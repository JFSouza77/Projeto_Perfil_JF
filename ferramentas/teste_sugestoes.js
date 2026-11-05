#!/usr/bin/env node
// 05/11/2026 · 💡 Sugestões (src/js/05u2-sugestoes.js + servidor/worker.js), com o servidor local no ar:
//   (na pasta servidor) npx wrangler dev --port 8787 --var REPORTES_SENHA:<senha qualquer de teste>
//   node ferramentas/teste_sugestoes.js [mestre.html] --servidor=8787 --senha=<a mesma senha de teste>
// Confere: o botão está no menu ⋮ e na Pausa; sem texto não envia; com texto chega na página do JF (seção
// 💡 Sugestões, com a categoria); sem servidor fica na fila do aparelho; o servidor recusa sugestão vazia.
const { acharMestre, abrirNavegador } = require("./_navegador");
const args = process.argv.slice(2);
const opt = (k, d) => ((args.find((a) => a.startsWith(`--${k}=`)) || "").split("=")[1] || d);
const PORTA = +opt("servidor", "8787"), SENHA = opt("senha", "");
const file = acharMestre(args.find((a) => a.endsWith(".html")));
(async () => {
  const ok = [];
  const conf = (n, v) => ok.push([n, !!v]);
  const b = await abrirNavegador();
  try {
    const ctx = await b.newContext();
    await ctx.addInitScript((porta) => { window.__REDE_SERVIDOR = { host: "127.0.0.1", port: porta, secure: false }; }, PORTA);
    const pg = await ctx.newPage();
    const erros = [];
    pg.on("pageerror", (e) => erros.push(e.message));
    await pg.route(/fonts\./, (r) => r.abort());
    await pg.goto("file://" + file);
    await pg.waitForFunction(() => typeof sugestaoAbrir === "function");
    conf("Botão 💡 Sugestões no menu ⋮ e na Pausa", await pg.evaluate(() => !!document.getElementById("btnSugestao") && !!document.getElementById("pauseSugestaoBtn")));
    await pg.click("#btnMenuSplash");
    await pg.click("#btnSugestao");
    await pg.waitForSelector("#sugestaoJanela");
    conf("Sem texto, o botão de enviar fica desligado", await pg.$eval("#sugEnviar", (e) => e.disabled));
    const texto = "Teste de sugestão " + Date.now();
    await pg.check('input[name="sugTipo"][value="cartas"]');
    await pg.fill("#sugNota", texto);
    conf("Com texto, liga e mostra a contagem", await pg.evaluate(() => !document.getElementById("sugEnviar").disabled && /de 500 letras/.test(document.getElementById("sugConta").textContent)));
    await pg.click("#sugEnviar");
    await pg.waitForFunction(() => /Enviada|Guardada|Não deu/.test(document.getElementById("sugEnviar").textContent), null, { timeout: 15000 });
    conf("Enviou pro servidor", /Enviada/.test(await pg.$eval("#sugEnviar", (e) => e.textContent)));
    if (SENHA) {
      const html = await (await fetch(`http://127.0.0.1:${PORTA}/reportes?chave=${encodeURIComponent(SENHA)}`)).text();
      conf("Chegou na página do JF, na seção 💡 Sugestões, com a categoria", /💡 Sugestões \(\d+\)/.test(html) && html.includes(texto) && /🃏 Cartas/.test(html));
      const txt = await (await fetch(`http://127.0.0.1:${PORTA}/reportes?chave=${encodeURIComponent(SENHA)}&formato=texto`)).text();
      conf("Também no formato texto", txt.includes("Sugestões (") && txt.includes(texto));
    }
    const vazia = await fetch(`http://127.0.0.1:${PORTA}/reporte`, { method: "POST", body: JSON.stringify({ tipo: "sugestao", cat: "ideia", nota: "  " }) });
    conf("Servidor recusa sugestão vazia", vazia.status === 400);
    // sem servidor: fica guardada no aparelho
    await pg.evaluate(() => { window.__REDE_SERVIDOR = { host: "127.0.0.1", port: 8798, secure: false }; document.getElementById("sugestaoJanela")?.remove(); });
    await pg.evaluate(() => sugestaoAbrir());
    await pg.fill("#sugNota", "Sem internet " + Date.now());
    await pg.click("#sugEnviar");
    await pg.waitForFunction(() => /Enviada|Guardada|Não deu/.test(document.getElementById("sugEnviar").textContent), null, { timeout: 15000 });
    conf("Sem servidor, fica guardada pra ir depois", /Guardada/.test(await pg.$eval("#sugEnviar", (e) => e.textContent)));
    conf("Sem erro na página", !erros.length);
    if (erros.length) console.log("Erros:", erros.join(" | "));
  } finally {
    await b.close();
  }
  ok.forEach(([n, v]) => console.log((v ? "ok    " : "FALHOU") + "  " + n));
  const tudo = ok.every((x) => x[1]);
  console.log(tudo ? "SUGESTÕES OK" : "SUGESTÕES COM PROBLEMA");
  process.exit(tudo ? 0 : 1);
})();
