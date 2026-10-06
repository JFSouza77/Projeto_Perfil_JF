#!/usr/bin/env node
// Teste da identidade dos jogadores (1.7.7.1 · Foundation Structure Update, Parte 2).
// Confere que cada jogador tem um id único que não muda quando alguém sai, quando a partida é
// salva e restaurada, e que save antigo (versão 11, chaves por posição e por nome) é convertido.
//   node ferramentas/teste_identidade.js [arquivo.html]
const { acharMestre, abrirNavegador } = require('./_navegador');
const ARQ = acharMestre(process.argv[2]);
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage(); const erros = []; page.on('pageerror', (e) => erros.push(e.message)); await page.route(/fonts\./, (r) => r.abort());
  await page.goto('file://' + ARQ); await page.waitForFunction(() => typeof jogadorIdNovo === 'function' && !document.getElementById('goToRulesBtn').disabled);
  const r = await page.evaluate(() => {
    const out = {};
    const nomes = ['Ana', 'Beto', 'Caio', 'Duda'];
    const mesa = () => nomes.map((n, i) => ({ name: n, score: 10 * i, position: 10 * i, humor: 'normal', color: PLAYER_COLORS[i], avatar: '😀', gems: {} }));
    // 1) save antigo (versão 11): sem id, palpite e joias por posição, 1º Mestre e ADM pelo nome
    const velho = { saveVersion: 11, savedAt: Date.now(), players: mesa(), CURRENT_MODE: 'classico', CURRENT_FORMAT: 'versus', WIN_CONDITION: 'joias',
      starterChosen: true, gameEnded: false, mestreIndex: 0, responderIndex: 1, deck: [], palpiteHolders: { 3: 1 }, joiasRodada: { 2: 1 },
      primeiroMestreNome: 'Beto', admPrincipalName: 'Caio', rodadaAtual: 2 };
    JFStore.setItem('perfil200_state', JSON.stringify(velho));
    loadGameState();
    const id = (n) => (players.find((p) => p.name === n) || {}).id;
    out.migrou = {
      todosComId: players.every((p) => jogadorIdValido(p.id)),
      idsUnicos: new Set(players.map((p) => p.id)).size === players.length,
      palpite: Object.keys(palpiteHolders).join() === id('Duda'),
      joias: Object.keys(joiasRodada).join() === id('Caio'),
      primeiroMestre: primeiroMestreId === id('Beto'),
      adm: admPrincipalId === id('Caio'),
    };
    // 2) salvar e restaurar: cada id continua com a mesma pessoa
    const antes = players.map((p) => p.name + '=' + p.id).join();
    saveGameState();
    const salvo = JSON.parse(JFStore.getItem('perfil200_state'));
    out.salvoV12 = salvo.saveVersion === 12 && salvo.primeiroMestreNome === 'Beto' && salvo.admPrincipalName === 'Caio';
    players = []; palpiteHolders = {}; loadGameState();
    out.restaurou = players.map((p) => p.name + '=' + p.id).join() === antes && Object.keys(palpiteHolders).join() === id('Duda');
    // 3) ADM tira o Beto: palpite, joias, 1º Mestre e ADM continuam com as pessoas certas
    starterChosen = true; gameEnded = false; cardState = 'none'; currentCard = null; mestreIndex = 2; responderIndex = 3;
    const idDuda = id('Duda'), idCaio = id('Caio');
    const err = admRemoverJogador(1);
    out.remocao = {
      ok: err === 'ok' || !err ? true : err,
      palpiteComDuda: palpiteHolders[idDuda] === 1,
      nomeDoPalpite: entityDisplay(idDuda).name === 'Duda',
      elegivelDuda: (() => { const m = mestreIndex, rp = responderIndex; mestreIndex = 0; responderIndex = 1; currentCard = { isBonus: false }; const e = palpiteEligibleScorers(); mestreIndex = m; responderIndex = rp; currentCard = null; return e.map((i) => players[i].name).join(); })() === 'Duda',
      joiasComCaio: joiasRodada[idCaio] === 1,
      idsIguais: players.every((p) => p.id === ({ Ana: id('Ana'), Caio: idCaio, Duda: idDuda })[p.name]),
      primeiroMestreTrocou: primeiroMestreId !== null && jogadorIdxPorId(primeiroMestreId) >= 0,
      adm: admPrincipalId === idCaio,
    };
    // 4) vencedor por joias guardado pelo id
    gemWinner = { kind: 'player', id: idDuda };
    out.vencedor = caosVencedoresIdx().map((i) => players[i].name).join() === 'Duda';
    gemWinner = null;
    // 5) ids novos nunca repetem
    const muitos = new Set(); for (let i = 0; i < 2000; i++) muitos.add(jogadorIdNovo(muitos));
    out.semRepetir = muitos.size === 2000;
    JFStore.removeItem('perfil200_state');
    return out;
  });
  const linhas = [
    ['Save antigo ganha id', r.migrou.todosComId && r.migrou.idsUnicos],
    ['Palpite e joias da rodada: posição → id', r.migrou.palpite && r.migrou.joias],
    ['1º Mestre e ADM principal: nome → id', r.migrou.primeiroMestre && r.migrou.adm],
    ['Save novo (v12) guarda id e ainda escreve o nome', r.salvoV12],
    ['Salvar e restaurar mantém cada id', r.restaurou],
    ['Remoção pelo ADM mantém palpite, joias e ADM com a pessoa certa', Object.values(r.remocao).every((v) => v === true)],
    ['Vencedor por joias pelo id', r.vencedor],
    ['2000 ids novos sem repetir', r.semRepetir],
  ];
  linhas.forEach(([n, ok]) => console.log(`${ok ? 'ok    ' : 'FALHOU'}  ${n}`));
  const tudo = linhas.every((l) => l[1]) && !erros.length;
  if (!tudo) console.log(JSON.stringify(r, null, 1));
  console.log(erros.length ? 'Erros na página: ' + erros.join(' | ') : 'Sem erro na página.');
  console.log(tudo ? 'IDENTIDADE OK' : 'IDENTIDADE FALHOU');
  await b.close();
  process.exit(tudo ? 0 : 1);
})();
