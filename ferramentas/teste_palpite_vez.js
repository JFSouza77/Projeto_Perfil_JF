// Teste focado: palpite a qualquer hora NA PRÓPRIA VEZ (pedido do JF 25/10).
// Confere: 1) quem tira a especial pode responder na vez; 2) acertou = pontua e mantém a ficha; 3) errou (passar) mantém a ficha.
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
  await page.waitForFunction(() => typeof chooseClue === "function" && typeof acertarNaVezAposEspecial === "function");
  const r = await page.evaluate(async () => {
    const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const fechar = () => { try { if (activeToastState) closeActiveToast(); } catch(e){}; document.querySelectorAll(".caos-modal-ov, .jf-modal-bg, #tutorialOverlay").forEach((o) => o.remove()); };
    const out = {};
    CURRENT_FORMAT = "versus";
    players = ["Ana","Beto","Caio","Dino"].map((n,i) => ({ id: jogadorIdNovo(), name:n, score:0, position:0, color: PLAYER_COLORS[i], avatar:"😀", humor:"normal", gems:{} }));
    selectMode("classico");
    WIN_CONDITION = "tabuleiro";
    starterDrawCount = 1; mestreIndex = 0; responderIndex = 1;
    ["splashScreen","welcomeScreen","playerPanel"].forEach((id)=>{const e=document.getElementById(id); if(e) e.style.display="none";});
    document.getElementById("gameScreen").style.display = "flex";
    beginGameplay(); await espera(30); fechar();
    if (cardState === "hidden") flipCard();
    await espera(20); fechar();
    // abre uma dica de verdade
    const clueIdx = currentCard.clues.findIndex((c) => c.type === "clue");
    chooseClue(clueIdx); await espera(20); fechar();
    out.temDicaAberta = revealedOrder.some((x) => x.item.type === "clue");
    // responde errado pra liberar a vez (a dica aberta continua na mesa)
    markWrong(); await espera(20); fechar();
    out.pendingLimpo = pendingIndex === null;
    // injeta a especial de palpite num slot ainda fechado e abre como a pessoa da vez
    const resp = responderIndex;
    out.respNome = players[resp].name;
    const key = palpiteKeyOf(resp);
    out.tinhaFichaAntes = palpiteCount(key);
    const livre = currentCard.clues.findIndex((c, i) => c.type === "clue" && !revealedOrder.some((x) => x.index === i));
    currentCard.clues[livre] = { type: "special", text: "Um palpite a qualquer hora" };
    chooseClue(livre); await espera(20); fechar();
    out.resultado = (revealedOrder.find((x) => x.index === livre) || {}).palpiteResult;
    out.fichaDepoisDeTirar = palpiteCount(key);
    out.podeResponder = palpitePodeResponderNaVez();
    // confere que os botões aparecem no render do mestre
    render(); await espera(10);
    out.temBotaoResponder = !!document.getElementById("respNaVezBtn");
    out.temBotaoPassar = !!document.getElementById("loseTurnBtn");
    // RESPONDE e ACERTA na própria vez
    const scoreAntes = players[resp].score;
    const cartaAntes = stats.totalDrawn;
    acertarNaVezAposEspecial(); await espera(30); fechar();
    out.pontuou = players[resp].score > scoreAntes;
    out.fichaMantida = palpiteCount(key) >= 1; // a ficha NÃO some ao acertar na vez
    out.cartaAvancou = stats.totalDrawn > cartaAntes || cardState !== "revealed";
    return out;
  });
  await b.close();
  const checks = [
    ["Tem dica aberta na mesa", r.temDicaAberta],
    ["Pending limpo após errar", r.pendingLimpo],
    ["Tirou a especial e ganhou a ficha", r.resultado === "ganhou" && r.fichaDepoisDeTirar === 1],
    ["palpitePodeResponderNaVez() = true", r.podeResponder === true],
    ["Botão 'responder agora' aparece", r.temBotaoResponder],
    ["Botão 'passar a vez' aparece", r.temBotaoPassar],
    ["Acertou na vez: pontuou", r.pontuou],
    ["Acertou na vez: ficha mantida", r.fichaMantida],
    ["Carta avançou/encerrou", r.cartaAvancou],
  ];
  let ok = true;
  checks.forEach(([n,v]) => { console.log(`${v?"ok    ":"FALHOU"}  ${n}`); if(!v) ok=false; });
  if (erros.length) { console.log("Erros na página: " + erros.slice(0,3).join(" | ")); ok=false; }
  console.log("diag:", JSON.stringify(r));
  console.log(ok ? "PALPITE NA VEZ OK" : "PALPITE NA VEZ FALHOU");
  process.exit(ok ? 0 : 1);
})();
