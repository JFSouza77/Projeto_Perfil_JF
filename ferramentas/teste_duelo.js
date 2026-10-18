#!/usr/bin/env node
// Teste do duelo da casa de bônus (1.7.10.5 · relato do Henrique: "desafiei o Rafa, o Vitinho acertou e a
// questão travou"). Joga muitas cartas com duelos forçados, 3 e 4 jogadores, com acerto de duelista, acerto
// por ficha de palpite, erro, esgotar e devolver carta, e confere a cada passo que o jogo nunca fica preso:
// Mestre válido e fora do duelo, quem responde é duelista, o leitor emprestado sempre volta, e sempre há
// um próximo passo possível.
//   node ferramentas/teste_duelo.js [arquivo.html]
const { acharMestre, abrirNavegador } = require('./_navegador');
const ARQ = acharMestre(process.argv[2]);
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.addInitScript(() => {
    window.setTimeout = ((st) => (fn, ms, ...a) => st(fn, Math.min(Number(ms) || 0, 5), ...a))(window.setTimeout.bind(window));
    try {
      localStorage.setItem('perfil5_tutorial_visto', 'x');
      localStorage.setItem('perfil5_tut_vitoria_vistos', JSON.stringify(['casa', 'tabuleiro', 'pontos', 'joias']));
    } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
  });
  await page.goto('file://' + ARQ);
  await page.waitForFunction(() => typeof dispatchAction === 'function' && !document.getElementById('goToRulesBtn').disabled);
  const r = await page.evaluate(async () => {
    const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const fechar = () => {
      try { if (activeToastState) closeActiveToast(); } catch (e) {}
      document.querySelectorAll('.caos-modal-ov, #tutorialOverlay, .casa-sorteio-ov').forEach((o) => o.remove());
    };
    const problemas = [];
    let duelos = 0, palpites = 0, passos = 0, desfeitos = 0;
    for (const nomes of [['Henrique', 'Rafa', 'Vitinho'], ['JF', 'Vitinho', 'Rafa', 'Henrique']]) {
      for (let partida = 0; partida < 6; partida++) {
        document.querySelectorAll('.caos-modal-ov, .jf-modal-bg').forEach((o) => o.remove());
        caosSilenced = true;
        gameEnded = false;
        CURRENT_FORMAT = 'versus';
        players = nomes.map((n, i) => ({ id: jogadorIdNovo(), name: n, score: 0, position: 0, color: PLAYER_COLORS[i], avatar: '😀', humor: 'normal', gems: {} }));
        selectMode('classico');
        WIN_CONDITION = 'tabuleiro';
        WINNING_SCORE = 9999;
        starterDrawCount = 1;
        mestreIndex = partida % nomes.length;
        responderIndex = nextIndex(mestreIndex);
        ['splashScreen', 'welcomeScreen', 'playerPanel'].forEach((id) => (document.getElementById(id).style.display = 'none'));
        document.getElementById('gameScreen').style.display = 'flex';
        beginGameplay();
        await espera(20);
        fechar();
        for (let k = 0; k < 160 && !gameEnded; k++) {
          passos++;
          fechar();
          const st = cardState;
          if (st === 'none' || st === 'bonusChoice' && pendingBonusQueue.length === 0) { problemas.push(`p${partida} passo ${k}: estado ${st} sem saída`); break; }
          if (st === 'bonusChoice') {
            const lander = pendingBonusQueue[0].landerIdx;
            const ops = players.map((p, i) => i).filter((i) => i !== lander);
            chooseBonusOpponent(ops[Math.floor(Math.random() * ops.length)]);
            duelos++;
          } else if (st === 'hidden') {
            // força um duelo na próxima carta de vez em quando
            flipCard();
          } else if (st === 'revealed' && pendingIndex === null) {
            const livres = currentCard.clues.map((c, i) => i).filter((i) => !revealedOrder.some((x) => x.index === i));
            if (!livres.length) { problemas.push(`p${partida} passo ${k}: carta aberta sem dica livre e sem fim`); break; }
            chooseClue(livres[Math.floor(Math.random() * livres.length)]);
          } else if (pendingIndex !== null) {
            const item = currentCard.clues[pendingIndex];
            if (item.type !== 'clue') {
              if (Math.random() < 0.5) loseTurnAfterSpecial(); else continueAfterSpecial();
              if (pendingIndex !== null && currentCard && currentCard.clues[pendingIndex].type !== 'clue') afterMoveSpecial();
            } else {
              const x = Math.random();
              const hold = palpiteEligibleScorers();
              if (x < 0.15 && hold.length) { markCorrect(hold[0]); palpites++; }
              else if (x < 0.3) markCorrect();
              else if (x < 0.33) { admDevolverCarta(); drawHidden(); }
              else markWrong();
            }
          } else { problemas.push(`p${partida} passo ${k}: estado estranho ${st} pend=${pendingIndex}`); break; }
          await espera(2);
          fechar();
          // desfaz o último veredito de vez em quando (o desfazer guarda o leitor emprestado do duelo)
          if (desfazerOferta && Math.random() < 0.25) { dispatchAction({ type: 'desfazer' }); desfeitos++; await espera(2); fechar(); }
          // força duelos: antes de cada carta nova, enfileira um
          if (cardState === 'hidden' && !currentCard.isBonus && Math.random() < 0.5 && pendingBonusQueue.length === 0) {
            pendingBonusQueue.push({ landerIdx: Math.floor(Math.random() * players.length), opponentIdx: null });
          }
          // dá ficha de palpite a alguém de vez em quando
          if (Math.random() < 0.1) grantPalpite(Math.floor(Math.random() * players.length));
          // invariantes
          const m = mestreIndex, rsp = responderIndex;
          if (!players[m]) problemas.push(`p${partida} passo ${k}: Mestre inválido ${m}`);
          if (!players[rsp]) problemas.push(`p${partida} passo ${k}: quem responde inválido ${rsp}`);
          if (currentCard && cardState !== 'bonusChoice' && cardState !== 'none') {
            if (currentCard.isBonus) {
              const du = [currentCard.bonusLanderPlayerIdx, currentCard.bonusOpponentPlayerIdx];
              if (!du.includes(rsp)) problemas.push(`p${partida} passo ${k}: duelo com quem responde fora (${players[rsp].name})`);
              if (du.includes(m)) problemas.push(`p${partida} passo ${k}: duelista é o Mestre (${players[m].name})`);
            } else {
              if (m === rsp) problemas.push(`p${partida} passo ${k}: Mestre e quem responde são a mesma pessoa (${players[m].name})`);
              if (bonusOrigMestreIdx !== null) problemas.push(`p${partida} passo ${k}: leitor emprestado não voltou`);
            }
          }
          if (problemas.length > 12) break;
        }
      }
    }
    // 1.7.10.6 · a "previsão da próxima carta" do C.A.O.S. (4% depois de cada carta): a carta que acabou sai da mesa
    // na hora (antes ficava revelada com o Mestre novo, parecendo travada) e o balão não saca carta em dobro
    for (const sacaAntes of [false, true]) {
      gameEnded = false;
      caosSilenced = false;
      caosCardPrediction = null;
      if (activeToastState) closeActiveToast();
      drawHidden();
      flipCard();
      const antes = stats.totalDrawn, rnd = Math.random;
      Math.random = () => 0.01;
      let anunciou;
      const bloq = caosToastBloquear, mudo = caosMudoCarta;
      caosToastBloquear = () => false; // o balão aparece de verdade (sem respiro/orçamento de fala)
      caosMudoCarta = false;
      try { anunciou = maybeAnnounceCardPrediction(); } finally { Math.random = rnd; caosToastBloquear = bloq; caosMudoCarta = mudo; }
      if (!activeToastState) problemas.push('previsão: o balão não apareceu');
      if (!anunciou) { problemas.push('previsão não anunciou'); continue; }
      if (currentCard || cardState !== 'none') problemas.push(`previsão: a carta velha ficou na mesa (${cardState})`);
      if (sacaAntes) drawHidden();
      closeActiveToast();
      await espera(5);
      if (cardState !== 'hidden' || stats.totalDrawn !== antes + 1) problemas.push(`previsão${sacaAntes ? ' (sacou antes)' : ''}: ${cardState}, ${stats.totalDrawn - antes} carta(s) sacada(s)`);
      caosSilenced = true;
    }
    return { duelos, palpites, passos, desfeitos, problemas: problemas.slice(0, 15) };
  });
  console.log(JSON.stringify(r, null, 1));
  if (erros.length) console.log('erros de página:', erros.slice(0, 5));
  const ok = r.problemas.length === 0 && erros.length === 0 && r.duelos > 10;
  console.log(ok ? 'DUELO OK' : 'FALHOU duelo');
  await b.close();
  process.exit(ok ? 0 : 1);
})();
