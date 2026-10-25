#!/usr/bin/env node
// Teste do app instalável (PWA, desde a 1.7.1.1): serve a pasta do repositório num localhost (como o GitHub Pages),
// abre o index.html e confere:
//   1. o manifesto existe, tem nome, start_url, display standalone e ícones 192 e 512 que existem de verdade;
//   2. o service worker registra e passa a controlar a página;
//   3. sem internet, o jogo abre de novo pela cópia guardada (e a página não quebra).
//   node ferramentas/teste_pwa.js
"use strict";
const fs = require("fs");
const path = require("path");
const http = require("http");
const { abrirNavegador } = require("./_navegador");
const RAIZ = path.join(__dirname, "..");
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webmanifest": "application/manifest+json" };
const res = [];
const ok = (n, v, d) => res.push({ n, v: !!v, d });

const srv = http.createServer((req, resp) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(RAIZ, path.normalize(p).replace(/^(\.\.[/\\])+/, ""));
  if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    resp.writeHead(404);
    return resp.end();
  }
  resp.writeHead(200, { "Content-Type": TIPOS[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(resp);
});

(async () => {
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const base = `http://localhost:${srv.address().port}/`;
  // 1. manifesto
  const man = JSON.parse(fs.readFileSync(path.join(RAIZ, "manifest.json"), "utf8"));
  const icones = (man.icons || []).filter((i) => fs.existsSync(path.join(RAIZ, i.src)));
  const tem = (s) => icones.some((i) => i.sizes === s);
  ok(
    "Manifesto: nome, start_url, standalone e ícones 192 e 512 que existem",
    man.name && man.start_url && man.display === "standalone" && tem("192x192") && tem("512x512") && icones.length === (man.icons || []).length,
    JSON.stringify({ icones: icones.length, de: (man.icons || []).length }),
  );
  const b = await abrirNavegador();
  const ctx = await b.newContext();
  const page = await ctx.newPage();
  const erros = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await ctx.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  await page.goto(base);
  const linkMan = await page.evaluate(() => (document.querySelector('link[rel="manifest"]') || {}).href || null);
  // 2. service worker registra e controla
  const controla = await page
    .evaluate(async () => {
      const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 15000))]);
      if (!reg) return false;
      if (!navigator.serviceWorker.controller) await new Promise((r) => { navigator.serviceWorker.addEventListener("controllerchange", r); setTimeout(r, 8000); });
      return !!navigator.serviceWorker.controller;
    })
    .catch(() => false);
  ok("Service worker registra e controla a página", controla && !!linkMan, JSON.stringify({ linkMan }));
  // garante que a página inteira passou pelo service worker (fica na cópia)
  await page.reload();
  await page.waitForFunction(() => typeof JOGO_VERSAO === "string", null, { timeout: 30000 }).catch(() => {});
  const versaoOn = await page.evaluate(() => (typeof JOGO_VERSAO === "string" ? JOGO_VERSAO : null)).catch(() => null);
  // 3. sem internet abre de novo
  await ctx.setOffline(true);
  let offOk = false,
    versaoOff = null;
  try {
    await page.reload({ timeout: 30000 });
    await page.waitForFunction(() => typeof JOGO_VERSAO === "string" && !!document.getElementById("goToRulesBtn"), null, { timeout: 30000 });
    versaoOff = await page.evaluate(() => JOGO_VERSAO);
    offOk = versaoOff === versaoOn;
  } catch (e) {}
  ok("Sem internet, o jogo abre pela cópia guardada (mesma versão)", offOk && !erros.length, JSON.stringify({ versaoOn, versaoOff, erros: erros.slice(0, 2) }));
  await b.close();
  srv.close();
  res.forEach((x) => {
    console.log(`${x.v ? "ok    " : "FALHOU"}  ${x.n}`);
    if (!x.v || process.env.V) console.log("        " + x.d);
  });
  const tudo = res.every((x) => x.v);
  if (!tudo) console.log("Error: teste do app instalável falhou");
  console.log(tudo ? "PWA OK" : "PWA FALHOU");
  process.exit(tudo ? 0 : 1);
})();
