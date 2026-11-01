#!/usr/bin/env node
// Lote da partida por categoria (JF, 31/10/2026): com o banco maior que o limite do modo, cada categoria entra com a
// mesma cota (Clássico: 400 = 100 de cada; Hardcore: pelos pesos). Simula um banco desnivelado como o da 2.0
// (Pessoa 520, Coisa+Animal 715, Lugar 425, Ano 255), confere a cota, a preferência por cartas novas e o completar
// quando falta carta numa categoria.
//   node ferramentas/teste_lote.js [arquivo.html]
const { acharMestre, abrirNavegador } = require('./_navegador');
const ARQ = acharMestre(process.argv[2]);
(async () => {
  const b = await abrirNavegador();
  const page = await (await b.newContext()).newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.goto('file://' + ARQ);
  await page.waitForFunction(() => typeof loteBalanceado === 'function' && typeof resetDeck === 'function' && allCards.length > 100);
  const r = await page.evaluate(() => {
    CURRENT_MODE = 'classico';
    const falsa = (cat, n) => Array.from({ length: n }, (_, i) => ({ category: cat, answer: cat + '-' + i, clues: [] }));
    const banco = [].concat(falsa('PESSOA', 520), falsa('COISA', 450), falsa('ANIMAL', 265), falsa('LUGAR', 425), falsa('ANO', 255));
    const conta = (l) => l.reduce((o, c) => ((o[gemCategoryFor(c.category)] = (o[gemCategoryFor(c.category)] || 0) + 1), o), {});
    const out = {};
    out.classico = conta(loteBalanceado(banco, 400));
    out.unicas = new Set(loteBalanceado(banco, 400).map((c) => c.answer)).size;
    // Ano curto (só 40): as 60 que faltam vêm das outras, e o lote continua com 400
    const curto = [].concat(falsa('PESSOA', 520), falsa('COISA', 450), falsa('LUGAR', 425), falsa('ANO', 40));
    out.curto = conta(loteBalanceado(curto, 400));
    out.curtoTotal = loteBalanceado(curto, 400).length;
    // Hardcore (300, pesos 30/30/20/20)
    CURRENT_MODE = 'hardcore';
    out.hardcore = conta(loteBalanceado(banco, 300, CATEGORY_WEIGHTS_HARDCORE));
    CURRENT_MODE = 'classico';
    // cartas novas primeiro: marca 200 de Ano como recentes; as 100 de Ano do lote não podem ser delas
    const recentes = falsa('ANO', 200).map((c) => c.answer);
    JFStore.setItem(CARTAS_RECENTES_KEY, JSON.stringify(recentes));
    cartasRecentes = null;
    const anoLote = loteBalanceado(banco, 400).filter((c) => c.category === 'ANO').map((c) => c.answer);
    const setRec = new Set(cartasRecentesLer());
    out.anoNovas = anoLote.filter((a) => !setRec.has(a)).length;
    out.recLidas = setRec.size;
    // banco menor que o limite: não mexe
    const peq = falsa('PESSOA', 30);
    out.pequenoIgual = loteBalanceado(peq, 400) === peq;
    // partida de verdade: o resetDeck do Clássico continua funcionando
    JFStore.setItem(CARTAS_RECENTES_KEY, '[]'); cartasRecentes = null;
    resetDeck();
    out.deckReal = deck.length;
    out.deckRealCats = conta(deck);
    return out;
  });
  await b.close();
  const ok = [];
  const t = (nome, cond, info) => ok.push([nome, !!cond, info]);
  t('Clássico: 100 de cada categoria', ['PESSOA', 'COISA', 'LUGAR', 'ANO'].every((k) => r.classico[k] === 100), JSON.stringify(r.classico));
  t('Clássico: 400 cartas sem repetir', r.unicas === 400, r.unicas);
  t('Ano curto: entram as 40 de Ano', r.curto.ANO === 40, JSON.stringify(r.curto));
  t('Ano curto: lote completa 400 com as outras', r.curtoTotal === 400, r.curtoTotal);
  t('Hardcore: 90/90/60/60 pelos pesos', r.hardcore.ANO === 90 && r.hardcore.PESSOA === 90 && r.hardcore.LUGAR === 60 && r.hardcore.COISA === 60, JSON.stringify(r.hardcore));
  t('Cartas novas primeiro (as 100 de Ano são as que não saíram)', r.recLidas === 200 && r.anoNovas === 55, `novas=${r.anoNovas} de 55 possíveis, recentes=${r.recLidas}`);
  t('Banco pequeno: não mexe', r.pequenoIgual);
  t('resetDeck do Clássico monta o baralho', r.deckReal > 0, `${r.deckReal} cartas ${JSON.stringify(r.deckRealCats)}`);
  t('sem erro na página', !erros.length, erros.join(' | '));
  let falhas = 0;
  ok.forEach(([n, c, i]) => { console.log((c ? '✅ ' : '❌ ') + n + (i !== undefined ? '  (' + i + ')' : '')); if (!c) falhas++; });
  console.log(`\n${ok.length - falhas}/${ok.length}`);
  process.exit(falhas ? 1 : 0);
})();
