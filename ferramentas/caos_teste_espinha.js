#!/usr/bin/env node
// Teste da espinha do C.A.O.S. (só reporta): confere se as 3 leis estão valendo no Mestre (ou na
// saída indicada). Instalação nas rotinas, erro contido (3ª lei), jogo protegido (1ª lei),
// saneamento dos medidores e canal com o destino das falas.
//   node ferramentas/caos_teste_espinha.js [arquivo.html]
const { acharMestre, abrirNavegador } = require('./_navegador');
const ARQ = acharMestre(process.argv[2]);
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage(); const erros = []; page.on('pageerror', (e) => erros.push(e.message)); await page.route(/fonts\./, (r) => r.abort());
  await page.goto('file://' + ARQ); await page.waitForFunction(() => typeof caosEspinha === 'object' && caosEspinha.instalada);
  const r = await page.evaluate(() => {
    const out = {};
    out.instalada = caosEspinha.log[0];
    out.blindadas = CAOS_ENTRADAS.filter((n) => window[n] && window[n].__blindada).length + '/' + CAOS_ENTRADAS.length;
    CURRENT_MODE = 'classico'; CURRENT_FORMAT = 'versus'; gameEnded = false; starterChosen = true;
    players = [{ name: 'Ana', score: 10, position: 10, humor: 'normal' }, { name: 'Beto', score: 5, position: 5, humor: 'normal' }];
    // 3ª lei: rotina que quebra
    window.caosTesteQuebra = function () { throw new Error('bug de teste'); };
    caosBlindarUm('caosTesteQuebra');
    let quebrou = false; try { out.retornoErro = caosTesteQuebra(); } catch (e) { quebrou = true; }
    out.terceiraLei = !quebrou && caosEspinha.falhas === 1;
    // 1ª lei: rotina que tenta trapacear
    window.caosTesteTrapaca = function () { players[1].score += 50; players[1].position += 50; mestreIndex = 1; return 'ok'; };
    mestreIndex = 0; caosBlindarUm('caosTesteTrapaca'); caosTesteTrapaca();
    out.primeiraLei = players[1].score === 5 && players[1].position === 5 && mestreIndex === 0 && caosEspinha.leis === 1;
    // espinha completa (1.7.7.3): uma rotina falsa mexe em tudo que decide a partida
    players = [{ id: 'j_aaaaaa', name: 'Ana', score: 10, position: 10, humor: 'normal', gems: { ANO: 1 } }, { id: 'j_bbbbbb', name: 'Beto', score: 5, position: 5, humor: 'normal' }, { id: 'j_cccccc', name: 'Caio', score: 0, position: 0, humor: 'normal' }];
    mestreIndex = 0; responderIndex = 1; palpiteHolders = { j_cccccc: 1 }; palpiteStock = 4; joiasRodada = { j_aaaaaa: 1 }; gemWinner = null;
    pendingBonusQueue = [{ landerIdx: 1, opponentIdx: null }]; revealedOrder = [{ index: 3, item: { type: 'clue', text: 'x' } }]; pendingIndex = 3;
    casaSorteado = 'pontos'; rodadaAtual = 2; ultimaRodada = false; teamRoundIndex = 0; playDirection = 1;
    const agora = Date.now(); timerEndAt = agora + 30000; cardEndAt = agora + 90000;
    const leisAntes = caosEspinha.leis;
    window.caosTesteTudo = function () {
      players[2].score = 99; players[0].gems = { ANO: 1, PESSOA: 1, LUGAR: 1, COISA: 1 }; players.reverse();
      palpiteHolders = {}; palpiteStock = 0; joiasRodada = { j_bbbbbb: 2 }; gemWinner = { kind: 'player', id: 'j_bbbbbb' };
      pendingBonusQueue = []; revealedOrder.push({ index: 7, item: { type: 'clue', text: 'y' } }); pendingIndex = 7;
      casaSorteado = 'joias'; rodadaAtual = 9; ultimaRodada = true; teamRoundIndex = 3; playDirection = -1;
      timerEndAt = agora + 1000; cardEndAt = agora + 2000;
    };
    caosBlindarUm('caosTesteTudo'); caosTesteTudo();
    const ordemVoltou = players.map((p) => p.name).join() === 'Ana,Beto,Caio';
    const porNome = (n) => players.find((p) => p.name === n);
    out.completa = {
      ordem: ordemVoltou,
      placarPorId: porNome('Caio').score === 0 && Object.keys(porNome('Ana').gems).join() === 'ANO',
      palpite: palpiteHolders.j_cccccc === 1 && palpiteStock === 4,
      joias: joiasRodada.j_aaaaaa === 1 && !joiasRodada.j_bbbbbb && gemWinner === null,
      bonus: pendingBonusQueue.length === 1,
      dicas: revealedOrder.length === 1 && pendingIndex === 3,
      casaRodada: casaSorteado === 'pontos' && rodadaAtual === 2 && ultimaRodada === false,
      vezSentido: teamRoundIndex === 0 && playDirection === 1,
      relogios: timerEndAt === agora + 30000 && cardEndAt === agora + 90000,
      contou: caosEspinha.leis === leisAntes + 1,
    };
    // dar tempo pode (o balão congela o relógio enquanto fala)
    window.caosTesteTempo = function () { timerEndAt += 5000; };
    caosBlindarUm('caosTesteTempo'); caosTesteTempo();
    out.completa.darTempoPode = timerEndAt === agora + 35000 && caosEspinha.leis === leisAntes + 1;
    timerEndAt = null; cardEndAt = null; pendingIndex = null; revealedOrder = [];
    // saneamento
    caosConsoleReset(); caosConsole.g.raiva = NaN; caosEmo.tensao = 99; caosConsoleAvancar('x');
    out.saneou = Number.isFinite(caosConsole.g.raiva) && caosEmo.tensao <= 10;
    // canal
    showToastMessage('[C.A.O.S.] Boa, Ana! Beto, sua vez.'); showToastMessage('[C.A.O.S.] Mesa animada hoje.');
    out.canal = caosCanal.map((c) => c.para.map((d) => d.nome + '@' + d.aparelho).join('+'));
    // funções reais continuam funcionando
    // o gerador pode não montar numa tentativa (6 sorteios falham) e o jogo cai na lista pronta: vale montar em até 5
    out.gerador = [1, 2, 3, 4, 5].some(() => !!caosGerarFala('inicioModo', null));
    out.log = caosEspinha.log;
    return out;
  });
  const completaOk = Object.values(r.completa).every((v) => v === true);
  const ok = completaOk && r.blindadas.split('/')[0] === r.blindadas.split('/')[1] && r.terceiraLei && r.primeiraLei && r.saneou && r.gerador && r.canal[0] === 'Ana@host+Beto@host' && r.canal[1] === 'mesa@todos';
  console.log(`Rotinas protegidas: ${r.blindadas}`);
  console.log(`3ª lei (erro vira silêncio): ${r.terceiraLei ? 'ok' : 'FALHOU'}`);
  console.log(`1ª lei (jogo desfeito): ${r.primeiraLei ? 'ok' : 'FALHOU'}`);
  console.log(`Medidores saneados: ${r.saneou ? 'ok' : 'FALHOU'}`);
  console.log(`Espinha completa (palpite, joias, bônus, dicas, rodada, relógios; jogador pelo id): ${completaOk ? 'ok' : 'FALHOU ' + JSON.stringify(r.completa)}`);
  console.log(`Canal: ${r.canal.join(' | ')}`);
  console.log(`Gerador de falas responde: ${r.gerador ? 'ok' : 'FALHOU'}`);
  console.log(ok && !erros.length ? 'ESPINHA OK' : 'ESPINHA COM PROBLEMA ' + erros.join(' | '));
  process.exitCode = ok && !erros.length ? 0 : 1;
  await b.close();
})();
