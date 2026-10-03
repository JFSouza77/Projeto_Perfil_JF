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
    // saneamento
    caosConsoleReset(); caosConsole.g.raiva = NaN; caosEmo.tensao = 99; caosConsoleAvancar('x');
    out.saneou = Number.isFinite(caosConsole.g.raiva) && caosEmo.tensao <= 10;
    // canal
    showToastMessage('[C.A.O.S.] Boa, Ana! Beto, sua vez.'); showToastMessage('[C.A.O.S.] Mesa animada hoje.');
    out.canal = caosCanal.map((c) => c.para.map((d) => d.nome + '@' + d.aparelho).join('+'));
    // funções reais continuam funcionando
    out.gerador = !!caosGerarFala('inicioModo', null);
    out.log = caosEspinha.log;
    return out;
  });
  const ok = r.blindadas.split('/')[0] === r.blindadas.split('/')[1] && r.terceiraLei && r.primeiraLei && r.saneou && r.gerador && r.canal[0] === 'Ana@host+Beto@host' && r.canal[1] === 'mesa@todos';
  console.log(`Rotinas protegidas: ${r.blindadas}`);
  console.log(`3ª lei (erro vira silêncio): ${r.terceiraLei ? 'ok' : 'FALHOU'}`);
  console.log(`1ª lei (jogo desfeito): ${r.primeiraLei ? 'ok' : 'FALHOU'}`);
  console.log(`Medidores saneados: ${r.saneou ? 'ok' : 'FALHOU'}`);
  console.log(`Canal: ${r.canal.join(' | ')}`);
  console.log(ok && !erros.length ? 'ESPINHA OK' : 'ESPINHA COM PROBLEMA ' + erros.join(' | '));
  process.exitCode = ok && !erros.length ? 0 : 1;
  await b.close();
})();
