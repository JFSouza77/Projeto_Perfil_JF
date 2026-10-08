#!/usr/bin/env node
// Teste da fundação (Foundation and Structure Update): jogadores (1.7.7.1), cartas e partida (1.7.7.2),
// sorteio de regra com semente e variáveis de regra no save (1.7.7.4).
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
    // 6) cartas com id fixo (1.7.7.2)
    const idsCartas = ADULT_CARDS.map((c) => c.id);
    out.cartasComId = idsCartas.every((x) => /^[A-Z]+-\d{4}$/.test(x)) && new Set(idsCartas).size === ADULT_CARDS.length && cartaPorId(idsCartas[7]) === ADULT_CARDS[7];
    // 7) save antigo que guardou uma resposta que depois foi corrigida: o mapa de respostas antigas acha a carta
    const c5 = ADULT_CARDS[5], c6 = ADULT_CARDS[6];
    CARTAS_RESPOSTA_ANTIGA['Resposta Velha'] = c5.id;
    JFStore.setItem('perfil200_state', JSON.stringify({ ...velho, deck: ['Resposta Velha', c6.answer], allCardsAnswers: ['Resposta Velha', c6.answer] }));
    loadGameState();
    out.respostaAntiga = deck.map((c) => c.id).join() === [c5.id, c6.id].join();
    delete CARTAS_RESPOSTA_ANTIGA['Resposta Velha'];
    // 8) save novo: a carta é achada pelo id mesmo se a resposta gravada não existir mais
    saveGameState();
    const st = JSON.parse(JFStore.getItem('perfil200_state'));
    out.salvaIds = Array.isArray(st.deckIds) && st.deckIds.join() === [c5.id, c6.id].join();
    st.deck = ['xxx', 'yyy']; st.allCardsAnswers = ['xxx', 'yyy'];
    JFStore.setItem('perfil200_state', JSON.stringify(st));
    loadGameState();
    out.pelaId = deck.map((c) => c.id).join() === [c5.id, c6.id].join();
    // 9) matchId: vai pro save, volta igual, e partida nova zera
    matchId = partidaIdNovo(); const mid = matchId;
    saveGameState(); matchId = null; loadGameState();
    out.matchId = partidaIdValido(mid) && matchId === mid;
    resetDeck();
    out.matchIdZera = matchId === null;
    // 10) sorteio de regra com semente (1.7.7.4): a mesma semente repete a mesma partida
    const seq = () => [sorteioRegra(), sorteioRegra(), sorteioRegra()].join();
    sorteioSemear(42); const s1 = seq() + '|' + shuffle(ADULT_CARDS.slice(0, 30)).map((c) => c.id).join() + '|' + embaralharEquilibrado(ADULT_CARDS.slice(0, 60)).map((c) => c.id).join();
    sorteioSemear(42); const s2 = seq() + '|' + shuffle(ADULT_CARDS.slice(0, 30)).map((c) => c.id).join() + '|' + embaralharEquilibrado(ADULT_CARDS.slice(0, 60)).map((c) => c.id).join();
    sorteioSemear(7); const s3 = seq();
    sorteioSemear(null);
    out.semente = s1 === s2 && s3 !== s1.split('|')[0] && sorteioSemente === null;
    // 11) variáveis de regra que não iam pro save (1.7.7.4)
    JFStore.setItem('perfil200_state', JSON.stringify(velho)); loadGameState();
    streakScorerIdx = 2; streakCount = 3; consecutiveExhausted = 1; starterDrawCount = 2; cardWrongCount = 4;
    const dono = players[2].id;
    saveGameState();
    streakScorerIdx = null; streakCount = 0; consecutiveExhausted = 0; starterDrawCount = 0; cardWrongCount = 0;
    loadGameState();
    out.regraSalva = players[streakScorerIdx] && players[streakScorerIdx].id === dono && streakCount === 3 && consecutiveExhausted === 1 && starterDrawCount === 2 && cardWrongCount === 4;
    // 12) importar: um save de verdade passa na conferência; um de versão futura não (1.7.7.6)
    const real = JSON.parse(JFStore.getItem('perfil200_state'));
    out.importa = importSaveConferir(real) === '' && importSaveConferir({ ...real, saveVersion: SAVE_VERSION + 1 }) !== '';
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
    ['1000 cartas com id fixo e único', r.cartasComId],
    ['Save antigo com resposta corrigida acha a carta (mapa)', r.respostaAntiga],
    ['Save novo guarda o id das cartas', r.salvaIds],
    ['Carta achada pelo id mesmo sem a resposta', r.pelaId],
    ['matchId salvo e restaurado', r.matchId],
    ['Partida nova zera o matchId', r.matchIdZera],
    ['Sorteio de regra com semente repete a partida', r.semente],
    ['Sequência, esgotadas, sorteio do Mestre e erros da carta vão pro save', r.regraSalva],
    ['Importar: save real passa, versão futura é recusada', r.importa],
  ];
  linhas.forEach(([n, ok]) => console.log(`${ok ? 'ok    ' : 'FALHOU'}  ${n}`));
  const tudo = linhas.every((l) => l[1]) && !erros.length;
  if (!tudo) console.log(JSON.stringify(r, null, 1));
  console.log(erros.length ? 'Erros na página: ' + erros.join(' | ') : 'Sem erro na página.');
  console.log(tudo ? 'IDENTIDADE OK' : 'IDENTIDADE FALHOU');
  await b.close();
  process.exit(tudo ? 0 : 1);
})();
