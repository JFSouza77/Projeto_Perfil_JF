#!/usr/bin/env node
// Teste do relógio único da partida (25/10/2026 · src/js/02d-relogio.js). Confere:
//   1. pausa e aviso da mesa param o tempo de jogo, e voltam a andar quando saem;
//   2. pausa e aviso ao mesmo tempo descontam uma vez só (sem descontar em dobro);
//   3. o tempo da vez, a Corrida e o Modo C.A.O.S. não andam com a partida parada (ninguém empurra prazo);
//   4. prazo convertido pro horário de verdade (o que vai pros celulares) bate com o que falta;
//   5. o save guarda o horário de verdade e, ao voltar, o tempo que faltava continua o mesmo;
//   6. aviso que some sem desmarcar não deixa a mesa congelada pra sempre.
//   node ferramentas/teste_relogio.js [mestre.html]
"use strict";
const { acharMestre, abrirNavegador } = require("./_navegador");
const ARQ = acharMestre(process.argv[2]);
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage();
  const erros = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.goto("file://" + ARQ);
  await page.waitForFunction(() => typeof relogioJogo === "function" && typeof avisoMostrar === "function");
  const r = await page.evaluate(async () => {
    const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const out = {};
    document.querySelectorAll(".caos-modal-ov, #novidadesModal").forEach((o) => o.remove());
    gameEnded = false;
    starterChosen = true;
    // 1. pausa para, despausa anda
    let j = relogioJogo();
    pausedAt = Date.now();
    relogioMarcar("pausa", true);
    await espera(400);
    const naPausa = relogioJogo() - j;
    pausedAt = null;
    relogioMarcar("pausa", false);
    j = relogioJogo();
    await espera(300);
    const depois = relogioJogo() - j;
    out.pausa = naPausa < 40 && depois >= 250;
    out.pausaDiag = { naPausa, depois };
    // 2. pausa + aviso juntos contam uma vez
    const d0 = relogio.desconto;
    pausedAt = Date.now();
    relogioMarcar("pausa", true);
    await espera(200);
    relogioMarcar("aviso", true); // (sem aviso de verdade na tela: o conferir fecha; aqui testamos a soma)
    await espera(200);
    pausedAt = null;
    relogioMarcar("pausa", false);
    relogioMarcar("aviso", false);
    const somou = relogio.desconto - d0;
    out.juntos = somou >= 380 && somou < 520;
    out.juntosDiag = { somou };
    // 3a. tempo da vez parado na pausa
    timerKind = "turn";
    timerEndAt = relogioJogo() + 5000;
    const s0 = secondsLeft();
    pausedAt = Date.now();
    relogioMarcar("pausa", true);
    await espera(1200);
    const s1 = secondsLeft();
    pausedAt = null;
    relogioMarcar("pausa", false);
    out.vez = s0 === s1;
    out.vezDiag = { s0, s1 };
    // 3b. Corrida: o geral não anda na pausa
    corridaRestaMs = 60000;
    corridaDesde = relogioJogo();
    pausedAt = Date.now();
    relogioMarcar("pausa", true);
    const g0 = corridaGeralMs();
    await espera(600);
    const g1 = corridaGeralMs();
    pausedAt = null;
    relogioMarcar("pausa", false);
    corridaDesde = null;
    out.corrida = Math.abs(g1 - g0) < 40;
    out.corridaDiag = { g0, g1 };
    // 3c. Modo C.A.O.S.: relógio correndo e prazo (abrir dica) não andam com aviso na tela
    const rel = { resta: 8000, fimEm: null };
    mcRelogioCorrer(rel);
    const abrirEm = mcAgora() + 3000;
    avisoMostrar({ ic: "📣", titulo: "Teste do relógio", texto: "parado", seg: 2 });
    const m0 = mcRelogioMs(rel),
      a0 = abrirEm - mcAgora();
    await espera(700);
    const m1 = mcRelogioMs(rel),
      a1 = abrirEm - mcAgora();
    out.modoCaos = avisoMesaCongela() && Math.abs(m1 - m0) < 40 && Math.abs(a1 - a0) < 40;
    out.modoCaosDiag = { m0, m1, a0, a1 };
    // 6. aviso some sem desmarcar: o relógio volta sozinho quando o aviso devia ter saído
    avisoMesa.ate = Date.now() - 1;
    await espera(50);
    const jA = relogioJogo();
    await espera(300);
    out.avisoSome = !relogioParado() && relogioJogo() - jA >= 250;
    avisoZerar();
    // 4. horário de verdade (celulares)
    const prazo = relogioJogo() + 5000;
    const parede = relogioParede(prazo);
    out.parede = Math.abs(parede - (Date.now() + 5000)) < 40 && Math.abs(relogioDaParede(parede) - prazo) < 40;
    out.paredeDiag = { dif: parede - Date.now() };
    // 5. save → volta: o tempo que faltava é o mesmo
    timerKind = "turn";
    timerEndAt = relogioJogo() + 20000;
    const salvo = relogioParede(timerEndAt);
    const antes = timerEndAt - relogioJogo();
    timerEndAt = relogioDaParede(salvo);
    const depoisSave = timerEndAt - relogioJogo();
    out.save = Math.abs(antes - depoisSave) < 40;
    out.saveDiag = { antes, depoisSave };
    clearTimer();
    return out;
  });
  await b.close();
  const linhas = [
    ["Pausa para o tempo de jogo e ele volta a andar depois", r.pausa, r.pausaDiag],
    ["Pausa e aviso juntos descontam uma vez só", r.juntos, r.juntosDiag],
    ["Tempo da vez não anda na pausa", r.vez, r.vezDiag],
    ["Corrida: o relógio geral não anda na pausa", r.corrida, r.corridaDiag],
    ["Modo C.A.O.S.: relógio e prazo não andam com aviso na tela", r.modoCaos, r.modoCaosDiag],
    ["Aviso que some sem desmarcar não deixa a mesa congelada", r.avisoSome, {}],
    ["Prazo convertido pro horário de verdade (celulares) bate", r.parede, r.paredeDiag],
    ["Save: o tempo que faltava volta igual", r.save, r.saveDiag],
  ];
  linhas.forEach(([n, v, d]) => {
    console.log(`${v ? "ok    " : "FALHOU"}  ${n}`);
    if (!v || process.env.V) console.log("        " + JSON.stringify(d));
  });
  if (erros.length) console.log("Erros na página: " + erros.slice(0, 3).join(" | "));
  const tudo = linhas.every((x) => x[1]) && !erros.length;
  if (!tudo) console.log("Error: teste do relógio falhou");
  console.log(tudo ? "RELÓGIO OK" : "RELÓGIO FALHOU");
  process.exit(tudo ? 0 : 1);
})();
