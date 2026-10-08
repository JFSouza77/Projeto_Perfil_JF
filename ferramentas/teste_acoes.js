#!/usr/bin/env node
// Teste das ações (1.7.8 · Actions and Events Update, Parte 1).
// Confere a fronteira de ações: toque vira ação registrada (sem contar de novo o que o motor chama
// por dentro), a revisão só sobe quando o estado muda, e dispatchAction recusa partida errada,
// revisão obsoleta, comando repetido e ação fora de hora. Revisão e registro vão pro save.
//   node ferramentas/teste_acoes.js [arquivo.html]
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
    const out = {};
    out.instaladas = Object.keys(ACOES).filter((t) => window[ACOES[t].fn] && window[ACOES[t].fn].__acao).length + '/' + Object.keys(ACOES).length;
    document.querySelectorAll('.caos-modal-ov, .jf-modal-bg').forEach((o) => o.remove());
    CURRENT_FORMAT = 'versus';
    players = ['Ana', 'Beto', 'Caio'].map((n, i) => ({ id: jogadorIdNovo(), name: n, score: 0, position: 0, color: PLAYER_COLORS[i], avatar: '😀', humor: 'normal', gems: {} }));
    selectMode('classico');
    WIN_CONDITION = 'tabuleiro';
    starterDrawCount = 1;
    mestreIndex = 0;
    responderIndex = 1;
    ['splashScreen', 'welcomeScreen', 'playerPanel'].forEach((id) => (document.getElementById(id).style.display = 'none'));
    document.getElementById('gameScreen').style.display = 'flex';
    beginGameplay();
    await espera(30);
    const fechar = () => {
      if (activeToastState) closeActiveToast();
      document.querySelectorAll('.caos-modal-ov, #tutorialOverlay').forEach((o) => o.remove());
    };
    fechar();
    const rev0 = partidaRevisao;
    // 1) toque de verdade (o botão chama a função pelo nome): vira ação com origem "toque"
    const tocar = async (el) => { toqueJogoUltimo = 0; el.click(); await espera(30); fechar(); };
    const virar = document.getElementById('flipBtn') || document.querySelector('#cardArea .flip-btn');
    if (cardState === 'hidden' && virar) await tocar(virar);
    if (cardState === 'hidden') flipCard();
    await espera(30); fechar();
    const num = [...document.querySelectorAll('#cardArea .number-btn:not(.aberta)')].find((e) => currentCard.clues[+e.dataset.idx].type === 'clue');
    num.id = 'numTeste';
    toqueJogoUltimo = 0;
    return out;
  });
  // toque de verdade (evento confiável do navegador)
  await page.click('#numTeste');
  await page.waitForTimeout(80);
  const r2 = await page.evaluate(async () => {
    const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const out = {};
    const fechar = () => {
      if (activeToastState) closeActiveToast();
      document.querySelectorAll('.caos-modal-ov, #tutorialOverlay').forEach((o) => o.remove());
    };
    fechar();
    const tocar = async (el) => { toqueJogoUltimo = 0; el.click(); await espera(30); fechar(); };
    const rev0 = 0;
    out.dicaAberta = pendingIndex !== null;
    out.logToque = acoesLog.slice(-3).map((x) => x.a + ':' + x.o).join(',');
    // 2) Errou: o motor chama render, vez, etc. por dentro: só UMA ação
    const nAntes = acoesLog.length;
    if (document.getElementById('wrongBtn')) await tocar(document.getElementById('wrongBtn'));
    out.umaAcaoPorToque = acoesLog.length === nAntes + 1 && acoesLog[acoesLog.length - 1].a === 'errou';
    out.revisaoSubiu = partidaRevisao > rev0;
    out.comQuem = !!acoesLog[acoesLog.length - 1].m && !!acoesLog[acoesLog.length - 1].v;
    // 3) toque fora de hora (Errou sem dica aberta) não muda nada: revisão igual
    const rv = partidaRevisao;
    markWrong();
    out.semMudancaSemRevisao = partidaRevisao === rv;
    // 4) comandos
    const livre = currentCard.clues.findIndex((c, i) => c.type === 'clue' && !revealedOrder.some((x) => x.index === i));
    out.desconhecida = dispatchAction({ type: 'trapacear' }).motivo;
    out.partidaErrada = dispatchAction({ type: 'escolherDica', data: [livre], matchId: 'p_outrapartida1' }).motivo;
    out.obsoleta = dispatchAction({ type: 'escolherDica', data: [livre], expectedRevision: partidaRevisao - 1 }).motivo;
    out.foraDeHora = dispatchAction({ type: 'acertou', data: [1] }).motivo;
    const c1 = dispatchAction({ type: 'escolherDica', data: [livre], commandId: 'cmd-1', matchId, expectedRevision: partidaRevisao });
    out.comandoOk = c1.ok && pendingIndex === livre && acoesLog[acoesLog.length - 1].o === 'comando';
    fechar();
    const revDepois = partidaRevisao;
    const c2 = dispatchAction({ type: 'escolherDica', data: [livre], commandId: 'cmd-1', matchId, expectedRevision: revDepois - 1 });
    out.duplicadoNaoAplica = c2.ok && c2.duplicado === true && partidaRevisao === revDepois;
    // 5) save e retomada guardam revisão e registro
    saveGameState();
    const revSalva = partidaRevisao, nSalvo = acoesLog.length;
    partidaRevisao = 0; acoesLog = [];
    loadGameState();
    out.salvou = partidaRevisao === revSalva && acoesLog.length === nSalvo;
    // 6) partida nova zera
    resetDeck();
    out.zerou = partidaRevisao === 0 && acoesLog.length === 0;
    JFStore.removeItem('perfil200_state');
    return out;
  });
  Object.assign(r, r2);
  const linhas = [
    ['Fronteira instalada em todas as ações', r.instaladas.split('/')[0] === r.instaladas.split('/')[1]],
    ['Toque vira ação registrada (origem toque)', r.dicaAberta && /escolherDica:toque/.test(r.logToque)],
    ['Um toque = uma ação (o que o motor chama por dentro não conta)', r.umaAcaoPorToque],
    ['A ação guarda o Mestre e a vez pelo id', r.comQuem],
    ['Revisão sobe quando muda; toque fora de hora não sobe', r.revisaoSubiu && r.semMudancaSemRevisao],
    ['Comando desconhecido recusado', r.desconhecida === 'acao_desconhecida'],
    ['Comando de outra partida recusado', r.partidaErrada === 'partida_errada'],
    ['Comando com revisão obsoleta recusado', r.obsoleta === 'revisao_obsoleta'],
    ['Comando fora de hora recusado', r.foraDeHora === 'fora_de_hora'],
    ['Comando válido aplica (origem comando)', r.comandoOk],
    ['Comando repetido não aplica duas vezes', r.duplicadoNaoAplica],
    ['Revisão e registro vão pro save', r.salvou],
    ['Partida nova zera revisão e registro', r.zerou],
  ];
  linhas.forEach(([n, ok]) => console.log(`${ok ? 'ok    ' : 'FALHOU'}  ${n}`));
  const tudo = linhas.every((l) => l[1]) && !erros.length;
  if (!tudo) console.log(JSON.stringify(r, null, 1));
  console.log(erros.length ? 'Erros na página: ' + erros.join(' | ') : 'Sem erro na página.');
  console.log(tudo ? 'AÇÕES OK' : 'AÇÕES FALHOU');
  await b.close();
  process.exit(tudo ? 0 : 1);
})();
