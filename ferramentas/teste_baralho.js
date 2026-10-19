#!/usr/bin/env node
// 1.7.10.8 (relato do JF: "acharam as cartas um pouco repetitivas"): numa noite de várias partidas no mesmo
// dispositivo, as cartas que já saíram vão pro fundo do baralho. Simula 8 partidas de 25 cartas e confere que nenhuma
// carta repete entre elas, que o equilíbrio de categorias continua e que a memória sobrevive a recarregar a página.
//   node ferramentas/teste_baralho.js [arquivo.html]
const { acharMestre, abrirNavegador } = require('./_navegador');
const ARQ = acharMestre(process.argv[2]);
(async () => {
  const b = await abrirNavegador();
  const ctx = await b.newContext();
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.goto('file://' + ARQ);
  await page.waitForFunction(() => typeof resetDeck === 'function' && typeof baralhoAfastarRecentes === 'function' && allCards.length > 100);
  const partidas = async (n) => page.evaluate((n) => {
    const out = [];
    for (let p = 0; p < n; p++) {
      CURRENT_MODE = 'classico';
      resetDeck();
      const tiradas = [];
      for (let i = 0; i < 25 && deck.length; i++) {
        const c = deck.pop();
        cartasRecentesMarcar(c.answer);
        tiradas.push([c.answer, gemCategoryFor(c.category)]);
      }
      out.push(tiradas);
    }
    return out;
  }, n);
  const r1 = await partidas(4);
  await page.evaluate(() => JFStore.flushNow && JFStore.flushNow());
  await page.waitForTimeout(800);
  await page.reload();
  await page.waitForFunction(() => typeof resetDeck === 'function' && allCards.length > 100);
  const r2 = await partidas(4);
  const todas = r1.concat(r2).flat();
  const vistas = new Set();
  let rep = 0;
  todas.forEach(([a]) => (vistas.has(a) ? rep++ : vistas.add(a)));
  const cats = {};
  todas.forEach(([, g]) => (cats[g] = (cats[g] || 0) + 1));
  const problemas = [];
  if (rep) problemas.push(`${rep} cartas repetiram em 8 partidas de 25`);
  const qs = Object.values(cats);
  if (Math.min(...qs) < todas.length / Object.keys(cats).length / 2.2) problemas.push('categorias desequilibradas: ' + JSON.stringify(cats));
  await b.close();
  problemas.push(...erros.map((e) => 'erro na página: ' + e));
  console.log(`8 partidas, ${todas.length} cartas, ${rep} repetidas · categorias ${JSON.stringify(cats)}`);
  if (problemas.length) {
    problemas.forEach((x) => console.log('FALHOU ', x));
    console.log('BARALHO COM PROBLEMA');
    process.exit(1);
  }
  console.log('BARALHO OK');
})();
