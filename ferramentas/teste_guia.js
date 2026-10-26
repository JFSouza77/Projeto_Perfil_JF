// Teste focado: 1.8 · Guia da mesa (ideia da Elisa). A mesa parou esperando alguém: o C.A.O.S. cutuca a pessoa
// certa, o botão certo brilha, quem se perde duas vezes vira "guiado" (instrução na hora + comentário de acerto,
// erro e absurdo) e, com 3 jogadas no ritmo, ele se despede. Desliga no ADM; não entra no Express nem na pausa.
const { acharMestre, abrirNavegador } = require("./_navegador");
const ARQ = acharMestre(process.argv[2]);
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.addInitScript(() => {
    try { localStorage.setItem("perfil5_tutorial_visto", "x"); localStorage.setItem("perfil5_tut_vitoria_vistos", JSON.stringify(["casa","tabuleiro","pontos","joias"])); } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
  });
  await page.goto("file://" + ARQ);
  await page.waitForFunction(() => typeof guiaTick === "function" && typeof chooseClue === "function");
  const r = await page.evaluate(async () => {
    const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const fechar = () => { try { if (activeToastState) closeActiveToast(); } catch(e){}; activeToastState = null; caosFila.length = 0; document.querySelectorAll(".caos-modal-ov, .jf-modal-bg, #tutorialOverlay").forEach((o) => o.remove()); };
    const falas = [];
    const orig = window.caosFalarPara;
    const bancos = [];
    const origFalar = window.guiaFalar;
    window.guiaFalar = (jid, banco) => { bancos.push(jid + ":" + banco); return origFalar(jid, banco); };
    window.caosFalarPara = (quem, msg, priv) => { falas.push({ quem, msg }); };
    // "passa o tempo": a situação atual fica parada há ms (sem esperar de verdade)
    const parado = (ms) => { fechar(); guiaTick(); guia.desde -= ms; guia.ult = -1e9; guiaTick(); };
    const out = {};
    CURRENT_FORMAT = "versus";
    players = ["Ana","Beto","Caio","Dino"].map((n,i) => ({ id: jogadorIdNovo(), name:n, score:0, position:0, color: PLAYER_COLORS[i], avatar:"😀", humor:"normal", gems:{} }));
    selectMode("classico");
    WIN_CONDITION = "tabuleiro";
    starterDrawCount = 1; mestreIndex = 0; responderIndex = 1;
    ["splashScreen","welcomeScreen","playerPanel"].forEach((id)=>{const e=document.getElementById(id); if(e) e.style.display="none";});
    document.getElementById("gameScreen").style.display = "flex";
    beginGameplay(); await espera(30); fechar();
    guiaDefinirLigado(true);
    const mestre = players[mestreIndex];
    // 1) a carta está virada pra baixo: é o Mestre que a mesa espera
    const q1 = guiaQuemAge();
    out.q1 = q1 && q1.acao;
    out.donoMestre = !!q1 && q1.jid === mestre.id;
    // ainda dentro do prazo: nada
    fechar(); guiaTick(); guia.desde -= 5000; guiaTick();
    out.antesDoPrazoQuieto = falas.length === 0;
    parado(13000);
    out.cutucouMestre = falas.length === 1 && falas[0].quem === mestre.id && falas[0].msg.includes(mestre.name);
    out.botaoBrilha = !!document.querySelector(".guia-pulso");
    out.lento1 = guia.lento[mestre.id] === 1;
    // a mesma parada não cutuca de novo
    parado(30000);
    out.umaVezSo = falas.length === 1;
    // jogou: o brilho sai
    flipCard(); await espera(20); fechar(); guiaTick();
    out.brilhoSaiu = !document.querySelector(".guia-pulso");
    // 2) quem está na vez escolhe o número
    const q2 = guiaQuemAge();
    out.q2 = q2 && q2.acao;
    out.donoResp = !!q2 && q2.jid === players[responderIndex].id;
    // 3) dica aberta: o Mestre julga (prazo maior, 25 s); a 2ª demora dele liga o guia
    const clueIdx = currentCard.clues.findIndex((c) => c.type === "clue");
    chooseClue(clueIdx); await espera(20); fechar(); guiaTick();
    out.q3 = (guiaQuemAge() || {}).acao;
    const n0 = falas.length;
    parado(15000);
    out.julgarEsperaMais = falas.length === n0;
    guia.desde -= 15000; guia.ult = -1e9; guiaTick();
    out.virouGuiado = !!guia.guiando[mestre.id];
    out.oferta = bancos.includes(mestre.id + ":oferta");
    // 4) guiado: cada vez dele, a instrução vem logo (1,5 s) e 3 jogadas no ritmo = despedida
    let ritmo = 0;
    for (let k = 0; k < 12 && guia.guiando[mestre.id]; k++) {
      fechar();
      const q = guiaQuemAge();
      if (!q) { await espera(20); continue; }
      if (q.jid === mestre.id) {
        const antes = falas.length;
        guiaTick(); guia.desde -= 1600; guiaTick();
        if (falas.length > antes) ritmo++;
      }
      // a jogada acontece
      if (q.acao === "julgar") markWrong();
      else if (q.acao === "escolher") { const i = currentCard.clues.findIndex((c, j) => c.type === "clue" && !revealedOrder.some((x) => x.index === j)); chooseClue(i); }
      else if (q.acao === "especial") { try { continueAfterSpecial(); } catch (e) { loseTurnAfterSpecial(); } }
      else if (q.acao === "sacar") drawHidden();
      else if (q.acao === "virar") flipCard();
      await espera(20); fechar(); guiaTick();
    }
    out.instrucaoNaHora = ritmo >= 2;
    out.despediu = !guia.guiando[mestre.id] && bancos.includes(mestre.id + ":tchau");
    // 5) comentário de absurdo pra quem está sendo guiado
    while (cardState !== "revealed" || pendingIndex === null) {
      fechar();
      if (cardState === "none") drawHidden();
      else if (cardState === "hidden") flipCard();
      else if (cardState === "revealed" && pendingIndex === null) { const i = currentCard.clues.findIndex((c, j) => c.type === "clue" && !revealedOrder.some((x) => x.index === j)); if (i < 0) { drawHidden(); continue; } chooseClue(i); }
      await espera(20);
    }
    fechar(); guiaTick();
    const resp = players[responderIndex];
    guia.guiando[resp.id] = { ritmo: 0 };
    const n1 = falas.length;
    markWrong("absurdo"); await espera(1400);
    out.comentouAbsurdo = falas.slice(n1).some((f) => f.quem === resp.id && f.msg.includes(resp.name));
    // 6) Online: o botão de quem a mesa espera brilha no celular dele (e o "Pausar" não)
    fechar(); guiaTick();
    const q6 = guiaQuemAge();
    guia.pulso = q6 ? q6.jid : null;
    const ops = q6 ? redeOpcoes(q6.jid) : [];
    out.painelBrilha = ops.some((o) => o.gp === 1) && !ops.some((o) => o.a === "pausar" && o.gp);
    guia.pulso = null;
    // 7) ADM desligou: fica quieto
    guiaDefinirLigado(false);
    const n2 = falas.length;
    parado(40000);
    out.admDesliga = falas.length === n2;
    guiaDefinirLigado(true);
    // 8) pausa e Express: ninguém é esperado
    pausedAt = Date.now();
    out.pausaNinguem = guiaQuemAge() === null;
    pausedAt = null;
    const modo = CURRENT_MODE;
    CURRENT_MODE = "express";
    out.expressNinguem = guiaQuemAge() === null;
    CURRENT_MODE = modo;
    // 9) fala dele na tela não conta como demora
    fechar(); guiaTick();
    activeToastState = { serial: -1, shownAt: Date.now() };
    const d0 = guia.desde; guia.tick = relogioJogo() - 5000; guiaTick();
    out.falaNaoConta = guia.desde > d0;
    activeToastState = null;
    window.caosFalarPara = orig;
    out.bancosLog = bancos;
    out.bancos = Object.keys(REACTIVE_VOICE.guia).length;
    out.falasTotal = Object.values(REACTIVE_VOICE.guia).reduce((s, l) => s + l.length, 0);
    out.cadaBanco5 = Object.values(REACTIVE_VOICE.guia).every((l) => l.length % 5 === 0);
    return out;
  });
  await b.close();
  const checks = [
    ["Carta virada: a mesa espera o Mestre", r.donoMestre && r.q1 === "virar"],
    ["Antes de 12 s, quieto", r.antesDoPrazoQuieto],
    ["Parou 12 s: cutuca o Mestre pelo nome", r.cutucouMestre],
    ["O botão certo brilha", r.botaoBrilha],
    ["Conta a 1ª demora do Mestre", r.lento1],
    ["Mesma parada: cutuca uma vez só", r.umaVezSo],
    ["Jogou: o brilho sai", r.brilhoSaiu],
    ["Carta aberta: espera quem está na vez escolher", r.donoResp && r.q2 === "escolher"],
    ["Dica aberta: espera o Mestre julgar", r.q3 === "julgar"],
    ["Julgar tem prazo maior (15 s ainda quieto)", r.julgarEsperaMais],
    ["2ª demora: vira guiado e oferece ajuda", r.virouGuiado && r.oferta],
    ["Guiado: instrução logo na vez dele", r.instrucaoNaHora],
    ["3 jogadas no ritmo: se despede", r.despediu],
    ["Guiado: comenta o chute absurdo", r.comentouAbsurdo],
    ["Online: botão brilha no painel (Pausar não)", r.painelBrilha],
    ["ADM desliga: fica quieto", r.admDesliga],
    ["Pausa: ninguém é esperado", r.pausaNinguem],
    ["Express: o guia não entra", r.expressNinguem],
    ["Fala dele na tela não conta como demora", r.falaNaoConta],
    ["Falas: 13 bancos de 5 (65)", r.bancos === 13 && r.falasTotal === 65 && r.cadaBanco5],
  ];
  let ok = true;
  checks.forEach(([n,v]) => { console.log(`${v?"ok    ":"FALHOU"}  ${n}`); if(!v) ok=false; });
  if (erros.length) { console.log("Erros na página: " + erros.slice(0,3).join(" | ")); ok=false; }
  console.log("diag:", JSON.stringify(r));
  console.log(ok ? "GUIA OK" : "GUIA FALHOU");
  process.exit(ok ? 0 : 1);
})();
