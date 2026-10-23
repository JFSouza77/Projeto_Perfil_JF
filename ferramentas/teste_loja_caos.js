#!/usr/bin/env node
// Teste da Lojinha do Modo C.A.O.S. (1.7.10.6): vitrine sorteada a cada intervalo (MC_VITRINE itens, estoque 1 a 3,
// preço ±20%), compra só do que está na vitrine e com estoque, Assalto Relâmpago (Colete segura, Espelho devolve) e
// Olho do C.A.O.S. (1ª letra só pra quem usou, só naquela dica).
//   node ferramentas/teste_loja_caos.js [arquivo.html]
const { acharMestre, abrirNavegador } = require('./_navegador');
const ARQ = acharMestre(process.argv[2]);
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.addInitScript(() => {
    try {
      localStorage.setItem('perfil5_tutorial_visto', 'x');
    } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
  });
  await page.goto('file://' + ARQ);
  await page.waitForFunction(() => typeof mcIniciar === 'function' && !document.getElementById('goToRulesBtn').disabled);
  const r = await page.evaluate(() => {
    const o = {};
    document.querySelectorAll('.caos-modal-ov, .jf-modal-bg, #novidadesModal').forEach((x) => x.remove());
    caosSilenced = true;
    CURRENT_FORMAT = 'versus';
    selectMode('caos');
    players = ['Ana', 'Beto', 'Caio'].map((n, i) => ({ id: 'p' + i, name: n, score: 0, idade: 'dezesseis' }));
    starterChosen = true;
    gameEnded = false;
    mcIniciar();
    clearInterval(mcTique);
    // vitrine: 60 sorteios
    let okV = true;
    for (let i = 0; i < 60; i++) {
      const v = lojaVitrineSortear(MC_LOJA, MC_VITRINE);
      const ks = Object.keys(v.estoque);
      if (ks.length !== MC_VITRINE || new Set(ks).size !== ks.length) okV = false;
      ks.forEach((k) => {
        const base = MC_LOJA[k].preco,
          p = v.precos[k];
        if (!MC_LOJA[k] || v.estoque[k] < 1 || v.estoque[k] > 3 || p < 5 || Math.abs(p - base) > base * 0.2 + 2.5) okV = false;
      });
    }
    o.vitrineValida = okV;
    // intervalo
    mcFimRodada();
    o.intervaloTemVitrine = mc.fase === 'intervalo' && !!mc.vitrine && Object.keys(mc.vitrine.estoque).length === MC_VITRINE;
    // forçar vitrine conhecida
    mc.vitrine = { estoque: { folego: 1, assalto: 2, olho: 1, kevlar: 1, espelho: 1 }, precos: { folego: 20, assalto: 25, olho: 45, kevlar: 60, espelho: 45 } };
    mc.pc = { p0: 200, p1: 50, p2: 30 };
    mc.inv = {};
    o.foraDaVitrineNaoCompra = !mcPodeComprar('corte', 'p0');
    mcComprar('folego', 'p0');
    o.comprou = mc.inv.p0.folego === 1 && mc.pc.p0 === 180 && mc.vitrine.estoque.folego === 0;
    o.esgotadoNaoCompra = !mcPodeComprar('folego', 'p1');
    // assalto: p2 assalta o mais rico (p0, 180)
    mcComprar('assalto', 'p2');
    o.assalto = mc.pc.p2 === 30 - 25 + MC_ASSALTO_PC && mc.pc.p0 === 180 - MC_ASSALTO_PC && !(mc.inv.p2 && mc.inv.p2.assalto);
    // colete segura
    mc.inv.p0 = { kevlar: 1 };
    const antes = mc.pc.p0;
    mc.pc.p1 = 50;
    mcComprar('assalto', 'p1');
    o.coleteSegura = mc.pc.p0 === antes && mc.inv.p0.kevlar === 0 && mc.pc.p1 === 25;
    // espelho devolve
    mc.vitrine.estoque.assalto = 1;
    mc.inv.p0 = { espelho: 1 };
    mc.pc.p1 = 50;
    const p0a = mc.pc.p0;
    mcComprar('assalto', 'p1');
    o.espelhoDevolve = mc.pc.p1 === 25 - MC_ASSALTO_PC && mc.pc.p0 === p0a + MC_ASSALTO_PC && mc.inv.p0.espelho === 0;
    // sem estoque de assalto
    o.assaltoEsgotou = !mcPodeComprar('assalto', 'p0');
    // olho
    mcComprar('olho', 'p0');
    mcNovaRodada();
    clearInterval(mcTique);
    mc.fase = 'janela';
    mc.janela = { serial: ++mc.serial, dur: 20000, inicio: mcAgora(), relogio: { resta: 20000, fimEm: mcAgora() + 20000 }, buzz: null, buzzEm: 0, tentaram: [], folego: [], congela: null, mordaca: null, corte: false, imposto: false, bateram: [] };
    const mestre = mcMestreId();
    const quem = ['p0', 'p1', 'p2'].find((x) => x !== mestre);
    mc.inv[quem] = { olho: 1 };
    mc.inv[mestre] = { olho: 1 };
    o.mestreNaoUsaOlho = !mcPodeUsar('olho', mestre);
    mcUsar('olho', quem);
    const resp = String(mc.cartas[mestre].resp);
    const letra = mcPrivado(quem).olhoLetra;
    o.olhoLetra = !!letra && resp.toUpperCase().indexOf(letra) >= 0 && mc.inv[quem].olho === 0;
    const outro = ['p0', 'p1', 'p2'].find((x) => x !== mestre && x !== quem);
    o.olhoPrivado = !mcPrivado(outro).olhoLetra;
    mc.janela.serial = ++mc.serial;
    o.olhoSoNaquelaDica = !mcPrivado(quem).olhoLetra;
    // 1.7.10.9.1 (JF): item funciona na hora, sem janelinha certa: Era do Gelo com 10 s de dica já passados
    mc.janela.inicio = mcAgora() - 10000;
    mc.janela.congela = null;
    mc.inv[quem] = { congelar: 1, corte: 1 };
    o.geloDepoisDos3s = mcPodeUsar('congelar', quem);
    mcUsar('congelar', quem);
    o.geloTravaAPartirDeAgora = !!mc.janela.congela && Math.abs(mc.janela.congela.ate - (mcAgora() + 7000)) < 500;
    mc.janela.relogio = { resta: 6500, fimEm: mcAgora() + 6500 };
    o.tesouraCom6sEPouco = mcPodeUsar('corte', quem);
    // 1.7.10.9.2 · Presente do C.A.O.S.: lanterna 2+ cartas atrás do líder ganha 1 item, uma vez por partida
    const placar = (a, b2, c) => players.forEach((p, i) => (p.score = [a, b2, c][i]));
    cartasPartida.length = 0;
    for (let i = 0; i < 3; i++) cartasPartida.push({ n: i + 1 });
    mc.cont.presente = 0;
    placar(2, 0, 0);
    o.presenteEmpateNaoDa = mcPresenteTalvez() === false;
    placar(3, 1, 1);
    o.presenteLanternaEmpatadoNaoDa = mcPresenteTalvez() === false;
    placar(1, 1, 0);
    o.presenteLiderEmpatadoNaoDa = mcPresenteTalvez() === false;
    placar(3, 1, 0);
    const invAntes = JSON.stringify(mc.inv.p2 || {});
    o.presenteDa = mcPresenteTalvez() === true && mc.cont.presente === 1 && MC_PRESENTE_ITENS.some((k) => ((mc.inv.p2 || {})[k] || 0) > (JSON.parse(invAntes)[k] || 0));
    o.presenteSoUmaVez = mcPresenteTalvez() === false;
    cartasPartida.length = 0;
    // tela do intervalo desenha sem erro
    mcFimRodada();
    clearInterval(mcTique);
    const html = mcTelaHtml(retratoPartida('mesa'), 'p0', mcOpcoes('p0'), mcPrivado('p0'));
    o.telaIntervalo = /mc-vitrine/.test(html) && /no estoque|esgotado/.test(html);
    // retomar save antigo sem olhos/vitrine
    const s = JSON.parse(JSON.stringify(mc));
    delete s.olhos;
    delete s.vitrine;
    mcRetomar(s);
    clearInterval(mcTique);
    o.retomarAntigo = !!mc.olhos && !!mc.vitrine;
    return o;
  });
  let falhas = 0;
  for (const [k, v] of Object.entries(r)) {
    console.log((v ? 'ok   ' : 'FALHA') + ' ' + k);
    if (!v) falhas++;
  }
  if (erros.length) {
    console.log('Erros da página:', erros);
    falhas++;
  }
  await b.close();
  console.log(falhas ? `\n${falhas} falha(s)` : '\nLoja do C.A.O.S.: tudo ok');
  process.exit(falhas ? 1 : 0);
})();
