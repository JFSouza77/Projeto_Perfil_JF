#!/usr/bin/env node
// Teste do telão (1.7.8.3 · Actions and Events Update, Parte 4): ensaio em duas abas.
// Sobe um servidor http local (BroadcastChannel não liga páginas file://), abre o jogo numa aba
// e o telão (#telao) em outra, joga algumas ações e confere: o telão chega na mesma revisão,
// mostra Mestre, vez e dicas abertas, nunca mostra a resposta, ignora retrato velho e não grava
// nada no save da partida.
//   node ferramentas/teste_telao.js [arquivo.html]
const http = require('http');
const fs = require('fs');
const path = require('path');
const { acharMestre, abrirNavegador } = require('./_navegador');
const ARQ = acharMestre(process.argv[2]);
(async () => {
  const srv = http.createServer((req, res) => {
    const f = path.join(path.dirname(ARQ), decodeURIComponent(req.url.split('?')[0].split('#')[0]));
    if (!f.startsWith(path.dirname(ARQ)) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
  const url = `http://127.0.0.1:${srv.address().port}/${path.basename(ARQ)}`;
  const b = await abrirNavegador();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.route(/fonts\./, (r) => r.abort());
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('perfil5_tutorial_visto', 'x');
      localStorage.setItem('perfil5_tut_vitoria_vistos', JSON.stringify(['casa', 'tabuleiro', 'pontos', 'joias']));
    } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
  });
  const erros = [];
  const jogo = await ctx.newPage();
  jogo.on('pageerror', (e) => erros.push('jogo: ' + e.message));
  await jogo.goto(url);
  await jogo.waitForFunction(() => typeof telaoPublicar === 'function' && !document.getElementById('goToRulesBtn').disabled);
  await jogo.evaluate(() => {
    document.querySelectorAll('.caos-modal-ov, .jf-modal-bg').forEach((o) => o.remove());
    CURRENT_FORMAT = 'versus';
    players = ['Ana', 'Beto', 'Caio'].map((n, i) => ({ id: jogadorIdNovo(), name: n, score: 0, position: 0, color: PLAYER_COLORS[i], avatar: '😀', humor: 'normal', gems: {} }));
    selectMode('classico');
    WIN_CONDITION = 'tabuleiro';
    starterDrawCount = 1; mestreIndex = 0; responderIndex = 1;
    ['splashScreen', 'welcomeScreen', 'playerPanel'].forEach((id) => (document.getElementById(id).style.display = 'none'));
    document.getElementById('gameScreen').style.display = 'flex';
    beginGameplay();
    document.querySelectorAll('.caos-modal-ov, #tutorialOverlay').forEach((o) => o.remove());
    flipCard();
    saveGameState();
  });
  const saveAntes = await jogo.evaluate(() => JFStore.getItem('perfil200_state'));
  const telao = await ctx.newPage();
  telao.on('pageerror', (e) => erros.push('telão: ' + e.message));
  await telao.goto(url + '#telao');
  await telao.waitForFunction(() => document.getElementById('telao') && /revisão/.test(document.getElementById('telao').textContent), null, { timeout: 8000 }).catch(() => {});
  // ações no jogo: abre duas dicas com um Errou no meio
  await jogo.evaluate(() => {
    const livres = () => currentCard.clues.map((c, i) => i).filter((i) => currentCard.clues[i].type === 'clue' && !revealedOrder.some((x) => x.index === i));
    chooseClue(livres()[0]);
    if (activeToastState) closeActiveToast();
    markWrong();
  });
  await jogo.waitForTimeout(1500);
  await jogo.evaluate(() => {
    if (activeToastState) closeActiveToast();
    document.querySelectorAll('.caos-modal-ov').forEach((o) => o.remove());
    const livres = currentCard.clues.map((c, i) => i).filter((i) => currentCard.clues[i].type === 'clue' && !revealedOrder.some((x) => x.index === i));
    if (pendingIndex === null) chooseClue(livres[0]);
  });
  await telao.waitForTimeout(600);
  const j = await jogo.evaluate(() => ({ rev: partidaRevisao, resposta: currentCard.answer, abertas: revealedOrder.map((x) => x.item.text), mestre: players[mestreIndex].name, vez: players[responderIndex].name, fechadas: currentCard.clues.filter((c, i) => !revealedOrder.some((x) => x.index === i)).map((c) => c.text) }));
  const t = await telao.evaluate(() => ({ txt: document.getElementById('telao').innerText, rev: telaoUltimo && telaoUltimo.revisao, bloqueado: saveBloqueado, iniciou: starterChosen, pecas: document.querySelectorAll('#tabCaixaTelao .tb-peao').length, forma: telaoUltimo && telaoUltimo.tabuleiro }));
  const formaJogo = await jogo.evaluate(() => tabForma);
  // retrato velho é ignorado
  await jogo.evaluate(() => { const r = retratoPartida('mesa'); r.revisao = 1; r.jogadores[0].nome = 'VELHO'; telaoCanal.postMessage({ tipo: 'retrato', retrato: r }); });
  await telao.waitForTimeout(300);
  const t2 = await telao.evaluate(() => document.getElementById('telao').innerText);
  if (process.env.PRINT) await telao.screenshot({ path: process.env.PRINT });
  const saveDepois = await jogo.evaluate(() => JFStore.getItem('perfil200_state'));
  // 1.7.8.6: botão de sair do telão (no celular não tinha saída)
  const temSair = await telao.evaluate(() => !!document.querySelector('#telao .telao-sair'));
  await Promise.all([telao.waitForNavigation({ timeout: 8000 }).catch(() => {}), telao.click('#telao .telao-sair').catch(() => {})]);
  await telao.waitForFunction(() => typeof telaoModo === 'function', null, { timeout: 8000 }).catch(() => {});
  const saiu = await telao.evaluate(() => !location.hash.includes('telao') && !document.getElementById('telao') && typeof telaoModo === 'function' && !telaoModo()).catch(() => false);
  const savedAt = (s) => (JSON.parse(s || '{}').savedAt || 0);
  const linhas = [
    ['Telão chega na mesma revisão do jogo', t.rev === j.rev && t.txt.includes('revisão ' + j.rev)],
    ['Telão mostra Mestre e vez', t.txt.includes(j.mestre) && t.txt.includes(j.vez)],
    ['Telão mostra as dicas abertas', j.abertas.every((d) => t.txt.includes(d))],
    ['Telão nunca mostra a resposta nem dica fechada', !t.txt.includes(j.resposta) && j.fechadas.every((d) => !t.txt.includes(d))],
    ['Telão ignora retrato velho', !t2.includes('VELHO')],
    ['Telão não carrega a partida e não grava (saveBloqueado)', t.bloqueado === true && t.iniciou === false],
    ['O save continua sendo só do jogo', savedAt(saveDepois) >= savedAt(saveAntes)],
    ['Telão mostra o tabuleiro do jogo, com a mesma forma e um peão por jogador (1.7.9.2)', t.pecas === 3 && t.forma === formaJogo],
    ['Telão tem botão de sair, e ele volta pro jogo normal', temSair && saiu],
  ];
  linhas.forEach(([n, ok]) => console.log(`${ok ? 'ok    ' : 'FALHOU'}  ${n}`));
  const tudo = linhas.every((l) => l[1]) && !erros.length;
  if (!tudo) console.log(JSON.stringify({ j, t, t2: t2.slice(0, 300) }, null, 1));
  console.log(erros.length ? 'Erros na página: ' + erros.join(' | ') : 'Sem erro na página.');
  console.log(tudo ? 'TELÃO OK' : 'TELÃO FALHOU');
  await b.close();
  srv.close();
  process.exit(tudo ? 0 : 1);
})();
