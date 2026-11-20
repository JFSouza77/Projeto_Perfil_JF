#!/usr/bin/env node
// Teste do avatar do C.A.O.S. (1.9.6, em teste). Confere:
//   1. começa desligado (opção na Acessibilidade) e não aparece fora do Modo C.A.O.S.;
//   2. ligado, no Modo C.A.O.S.: aparece no canto e não pega toque;
//   3. cada humor do console vira a forma combinada com o JF (e raiva forte vira o capeta bravo);
//   4. desligar a opção some com ele na hora; sem erro na página.
//   node ferramentas/teste_avatar.js [mestre.html] [--prints=pasta]
"use strict";
const path = require("path");
const { acharMestre, abrirNavegador } = require("./_navegador");
const ARQ = acharMestre(process.argv.slice(2).find((a) => a.endsWith(".html")));
const PRINTS = (process.argv.find((a) => a.startsWith("--prints=")) || "").slice(9);
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage({ viewport: { width: 420, height: 760 } });
  const erros = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.goto("file://" + ARQ);
  await page.waitForFunction(() => typeof caosAvatarAtualizar === "function" && typeof CaosAvatar === "object");
  const r = {};
  Object.assign(
    r,
    await page.evaluate(() => {
      document.querySelectorAll(".caos-modal-ov, #novidadesModal").forEach((o) => o.remove());
      const out = {};
      out.padraoDesligado = acessCfg.avatar === false;
      CURRENT_MODE = "classico";
      gameEnded = false;
      document.getElementById("gameScreen").style.display = "flex";
      acessCfg.avatar = true;
      caosAvatarAtualizar();
      const el0 = document.getElementById("caosAvatarMesa");
      out.foraDoModo = !el0 || el0.hidden;
      CURRENT_MODE = "caos";
      caosAvatarAtualizar();
      const el = document.getElementById("caosAvatarMesa");
      out.aparece = !!el && !el.hidden && !!el.querySelector("svg") && getComputedStyle(el).pointerEvents === "none";
      return out;
    }),
  );
  const esperado = {
    calmo: "anjinho",
    carinho: "anjinho",
    alegria: "feliz",
    raiva: "tentado",
    tristeza: "triste",
    medo: "alerta",
    ansiedade: "alerta",
    curiosidade: "pensando",
    tedio: "sonolento",
    vergonha: "envergonhado",
    nojo: "nojinho",
  };
  r.formas = {};
  for (const [emo, forma] of Object.entries(esperado)) {
    const f = await page.evaluate((emo) => {
      caosConsole.atual = emo;
      caosConsole.g = caosConsole.g || {};
      caosConsole.g.raiva = 0;
      caosAvatarAtualizar();
      return document.getElementById("caosAvatarMesa").dataset.forma;
    }, emo);
    r.formas[emo] = f === forma;
    if (PRINTS) {
      await page.waitForTimeout(900);
      await page.locator("#caosAvatarMesa").screenshot({ path: path.join(PRINTS, `avatar_${emo}.png`) });
    }
  }
  r.furia = await page.evaluate(() => {
    caosConsole.atual = "raiva";
    caosConsole.g.raiva = 9;
    caosAvatarAtualizar();
    return document.getElementById("caosAvatarMesa").dataset.forma === "perturbado";
  });
  if (PRINTS) {
    await page.waitForTimeout(900);
    await page.locator("#caosAvatarMesa").screenshot({ path: path.join(PRINTS, "avatar_furia.png") });
    await page.screenshot({ path: path.join(PRINTS, "avatar_tela.png") });
  }
  r.desliga = await page.evaluate(() => {
    acessCfg.avatar = false;
    aplicarAcessibilidade();
    return document.getElementById("caosAvatarMesa").hidden === true;
  });
  await b.close();
  const linhas = [
    ["Começa desligado", r.padraoDesligado],
    ["Ligado, mas fora do Modo C.A.O.S.: não aparece", r.foraDoModo],
    ["Ligado no Modo C.A.O.S.: aparece no canto, sem pegar toque", r.aparece],
    ...Object.entries(r.formas).map(([e, v]) => [`Humor ${e}: forma combinada`, v]),
    ["Raiva forte: capeta bravo", r.furia],
    ["Desligar a opção some com ele na hora", r.desliga],
  ];
  linhas.forEach(([n, v]) => console.log(`${v ? "ok    " : "FALHOU"}  ${n}`));
  if (erros.length) console.log("Erros na página: " + erros.slice(0, 3).join(" | "));
  const tudo = linhas.every((x) => x[1]) && !erros.length;
  if (!tudo) console.log("Error: teste do avatar falhou");
  console.log(tudo ? "AVATAR OK" : "AVATAR FALHOU");
  process.exit(tudo ? 0 : 1);
})();
