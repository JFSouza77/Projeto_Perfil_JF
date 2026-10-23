#!/usr/bin/env node
// Teste da votação da mesa (relato do JF: numa sala de 5, 2 votos já decidiam). Monta uma mesa online de mentira
// no host (sem rede de verdade) e confere a conta: o total é a mesa inteira, decide quem junta a maioria
// (5 → 3, 4 → 3, 6 → 4), celular em segundo plano continua contando, e o tempo acabando sem maioria deixa a carta.
//   node ferramentas/teste_votacao.js [arquivo.html]
const { acharMestre, abrirNavegador } = require('./_navegador');
const ARQ = acharMestre(process.argv[2]);
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.addInitScript(() => {
    try {
      localStorage.setItem('perfil5_tutorial_visto', 'x');
    } catch (e) {}
  });
  await page.goto('file://' + ARQ);
  await page.waitForFunction(() => typeof redeVotacaoConferir === 'function');
  const r = await page.evaluate(() => {
    const o = {};
    // n jogadores: o host (p0) joga no próprio dispositivo; os outros têm lugar na sala; "offline" = celular em segundo plano
    const mesa = (n, offline) => {
      players = Array.from({ length: n }, (_, i) => ({ id: 'p' + i, name: 'J' + i, score: 0 }));
      const assentos = {};
      for (let i = 1; i < n; i++) assentos['p' + i] = { online: !(offline || []).includes(i), sessao: 's' + i };
      rede = { papel: 'host', hostEu: 'p0', hostJunto: [], assentos, votacao: null, painel: null };
      gameEnded = false;
      cartaSeq = 7;
    };
    const resultado = (votos, expirou) => {
      let fim = null;
      const disp = window.dispatchAction;
      window.dispatchAction = () => ((fim = 'aprovada'), { ok: true });
      const toast = window.showToastMessage;
      window.showToastMessage = (t) => {
        if (/disse NÃO/.test(t)) fim = 'recusada';
      };
      const pub = window.redeHostPublicar;
      window.redeHostPublicar = () => {};
      rede.votacao = { id: 'v1', tipo: 'descartar', pedidoPor: 'p1', rev: 0, carta: cartaSeq, ate: Date.now() + (expirou ? -1 : 60e3), votos: {} };
      Object.entries(votos).forEach(([k, s]) => (rede.votacao.votos[k] = s));
      try {
        redeVotacaoConferir();
      } finally {
        window.dispatchAction = disp;
        window.showToastMessage = toast;
        window.redeHostPublicar = pub;
      }
      return fim || (rede.votacao ? 'aberta' : 'outro');
    };
    mesa(5);
    o.cinco2simNaoDecide = resultado({ p1: true, p2: true }) === 'aberta';
    o.cinco3simAprova = resultado({ p1: true, p2: true, p3: true }) === 'aprovada';
    o.cinco3naoRecusa = resultado({ p1: true, p2: false, p3: false, p4: false }) === 'recusada';
    o.cinco2a1TempoAcabouFica = resultado({ p1: true, p2: true, p3: false }, true) === 'recusada';
    mesa(5, [3, 4]); // dois celulares em segundo plano: a mesa continua sendo de 5
    o.segundoPlanoContinuaContando = redeVotacaoTotal() === 5 && resultado({ p1: true, p2: true }) === 'aberta';
    mesa(4);
    o.quatroPrecisaDe3 = redeVotacaoMaioria() === 3 && resultado({ p1: true, p2: true }) === 'aberta';
    o.quatro2a2Recusa = resultado({ p1: true, p2: true, p3: false, p0: false }) === 'recusada';
    mesa(6);
    o.seisPrecisaDe4 = redeVotacaoMaioria() === 4;
    mesa(3);
    o.tres2simAprova = resultado({ p1: true, p2: true }) === 'aprovada';
    // quem piscou a conexão ainda vota
    mesa(5, [2]);
    rede.votacao = { id: 'v2', tipo: 'descartar', pedidoPor: 'p1', rev: 0, carta: cartaSeq, ate: Date.now() + 60e3, votos: { p1: true } };
    const pub = window.redeHostPublicar;
    window.redeHostPublicar = () => {};
    redeVotar('p2', 'v2', false);
    window.redeHostPublicar = pub;
    o.quemPiscouVota = rede.votacao && rede.votacao.votos.p2 === false;
    o.publicaQuantoPrecisa = redeVotacaoPublica().precisa === 3 && redeVotacaoPublica().total === 5;
    rede = null;
    return o;
  });
  let falhas = 0;
  for (const [k, v] of Object.entries(r)) {
    console.log((v ? 'ok   ' : 'FALHA') + ' ' + k);
    if (!v) falhas++;
  }
  erros.forEach((e) => console.log('erro na página: ' + e));
  await b.close();
  console.log(falhas || erros.length ? 'VOTAÇÃO COM PROBLEMA' : 'VOTAÇÃO OK');
  process.exit(falhas || erros.length ? 1 : 0);
})();
