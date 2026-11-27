#!/usr/bin/env node
// Teste do botão de idade "60 ou mais" (1.9.7, pedido do JF em 27/11/2026; núcleo fala.porIdade). Confere:
//   1. o botão aparece no cadastro, junto com as 3 faixas de antes;
//   2. 60+ vale como adulto: entra no Modo C.A.O.S. (16+) e não trava o bordão;
//   3. 60+ ganha o tempo extra de Mestre (como quem tem menos de 12);
//   4. com alguém de 60+ na mesa, a voz do C.A.O.S. fica um pouco mais calma (e volta ao normal sem ele);
//   5. a idade fica salva como "sessenta" (não vira "16 ou mais" sem querer).
//   node ferramentas/teste_idade60.js [mestre.html] [--print=arquivo.png]
"use strict";
const { acharMestre, abrirNavegador } = require("./_navegador");
const ARQ = acharMestre(process.argv.slice(2).find((a) => a.endsWith(".html")));
const PRINT = (process.argv.find((a) => a.startsWith("--print=")) || "").slice(8);
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage({ viewport: { width: 420, height: 860 } });
  const erros = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.goto("file://" + ARQ);
  await page.waitForFunction(() => typeof jogador60 === "function" && typeof caosVelVoz === "function");
  const r = await page.evaluate(() => {
    const out = {};
    out.opcao = IDADE_OPCOES.length === 4 && IDADE_OPCOES[3].id === "sessenta" && /60 ou mais/.test(IDADE_OPCOES[3].label);
    document.querySelectorAll(".caos-modal-ov, #novidadesModal").forEach((o) => o.remove());
    renderIdadePicker();
    out.botaoNaTela = !!document.querySelector('[data-idade="sessenta"]');
    const vovo = { id: "v", name: "Vovó", idade: "sessenta", score: 0, position: 0 };
    const neto = { id: "n", name: "Neto", idade: "dezesseis", score: 0, position: 0 };
    out.adulto = jogador16(vovo) && jogador60(vovo) && !jogador60(neto);
    out.tempoExtra = mestreTemAjuda(vovo) && !mestreTemAjuda(neto);
    players = [neto, { ...neto, id: "m", name: "Mari" }];
    const normal = caosVelVoz();
    players = [neto, vovo];
    const calma = caosVelVoz();
    out.vozCalma = calma < normal && calma > normal * 0.85;
    players = [neto];
    out.vozVolta = caosVelVoz() === normal;
    // bordão: mesa com 60+ e 16+ continua podendo
    players = [neto, vovo, { ...neto, id: "x", name: "Xande" }];
    CURRENT_MODE = "classico";
    caosBordaoReset();
    stats.totalDrawn = 30;
    out.bordao = caosBordaoPode();
    out.salva = idadeNorm("sessenta") === "sessenta" && idadeLabel("sessenta") === "60 ou mais";
    return out;
  });
  if (PRINT) {
    await page.waitForFunction(() => { const s = document.getElementById("splashScreen"); return !s || getComputedStyle(s).display === "none" || s.hidden; }, null, { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => {
      document.querySelectorAll(".caos-modal-ov, #novidadesModal").forEach((o) => o.remove());
      document.querySelectorAll("section, main").forEach((s) => (s.style.display = "none"));
      document.getElementById("welcomeScreen").style.display = "";
      renderIdadePicker();
      document.getElementById("idadeRow").scrollIntoView({ block: "center" });
    });
    await page.waitForTimeout(400);
    // a linha das idades fica escondida até o nick ser digitado: o print usa uma cópia dela, com as mesmas classes
    await page.evaluate(() => {
      const row = document.getElementById("idadeRow");
      const c = row.cloneNode(true);
      c.id = "idadeRowPrint";
      c.style.cssText = "position:fixed;top:12px;left:12px;right:12px;z-index:99999;background:#12121c;padding:12px;border-radius:12px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;";
      document.body.appendChild(c);
    });
    await page.locator("#idadeRowPrint").screenshot({ path: PRINT });
  }
  await b.close();
  const linhas = [
    ["Botão \"60 ou mais\" no cadastro", r.opcao && r.botaoNaTela],
    ["60+ vale como adulto (Modo C.A.O.S. 16+)", r.adulto],
    ["60+ ganha tempo extra de Mestre", r.tempoExtra],
    ["Com 60+ na mesa, a voz fica mais calma", r.vozCalma],
    ["Sem 60+, a voz volta ao normal", r.vozVolta],
    ["60+ não trava o bordão", r.bordao],
    ["A idade fica salva como 60 ou mais", r.salva],
  ];
  linhas.forEach(([n, v]) => console.log(`${v ? "ok    " : "FALHOU"}  ${n}`));
  if (erros.length) console.log("Erros na página: " + erros.slice(0, 3).join(" | "));
  const tudo = linhas.every((x) => x[1]) && !erros.length;
  if (!tudo) console.log("Error: teste da idade 60+ falhou");
  console.log(tudo ? "IDADE 60+ OK" : "IDADE 60+ FALHOU");
  process.exit(tudo ? 0 : 1);
})();
