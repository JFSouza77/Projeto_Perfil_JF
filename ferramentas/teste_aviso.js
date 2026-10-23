#!/usr/bin/env node
// Teste do aviso da mesa (1.7.10.7 · pedido do JF: "a tela tem que escurecer… os botões congelados, o tempo
// congelado"). Confere: a caixa aparece com a animação certa, o tempo da vez anda junto (não perde segundos),
// dispatchAction recusa comandos enquanto o aviso está na tela, a fila mostra um por vez, o aviso privado não
// congela a mesa, "Bora!" fecha só a caixa, e o convidado só aceita um aviso bem formado.
//   node ferramentas/teste_aviso.js [arquivo.html] [--prints=pasta]
const { acharMestre, abrirNavegador } = require('./_navegador');
const ARQ = acharMestre(process.argv.slice(2).find((a) => !a.startsWith('--')));
const PRINTS = (process.argv.find((a) => a.startsWith('--prints=')) || '').slice(9);
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.addInitScript(() => {
    try { localStorage.setItem('perfil5_tutorial_visto', 'x'); } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
  });
  await page.goto('file://' + ARQ);
  await page.waitForFunction(() => typeof avisoMostrar === 'function' && typeof dispatchAction === 'function');
  const problemas = [];
  const r1 = await page.evaluate(async () => {
    const p = [];
    const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
    gameEnded = false;
    starterChosen = true;
    // tempo da vez: 10 s, o aviso dura 2 s → depois do aviso ainda tem perto de 10 s
    timerEndAt = Date.now() + 10e3;
    timerKind = 'turn';
    resumeTimerInterval();
    avisoMostrar({ ic: '⚔️', titulo: 'Henrique te chamou pro duelo!', texto: 'Bora!', anim: 'duelo', seg: 2 });
    const ov = document.getElementById('avisoMesaOv');
    if (!ov) p.push('a caixa não apareceu');
    if (ov && !ov.querySelector('.aviso-espadas')) p.push('sem a animação do duelo');
    if (!avisoMesaCongela()) p.push('o aviso da mesa toda não congela');
    const r = dispatchAction({ type: 'pausar' });
    const r2 = dispatchAction({ type: 'pedirDica', data: [] });
    if (r2.ok || (r2.motivo !== 'aviso_na_tela' && r2.motivo !== 'fora_de_hora' && r2.motivo !== 'acao_desconhecida')) p.push('comando passou com aviso na tela: ' + JSON.stringify(r2));
    if (r.ok) resumeGame && dispatchAction({ type: 'continuar' });
    // fila
    avisoMostrar({ ic: '🥔', titulo: 'Batata Quente!', anim: 'batata', seg: 2 });
    if (avisoFila.length !== 1) p.push('a fila não guardou o segundo aviso');
    await espera(2300);
    if (!avisoMesa || avisoMesa.titulo !== 'Batata Quente!') p.push('o segundo aviso não entrou depois do primeiro');
    await espera(2300);
    if (avisoMesaAtivo()) p.push('o aviso não acabou');
    if (document.getElementById('avisoMesaOv')) p.push('a caixa ficou na tela');
    const resta = timerEndAt - Date.now();
    if (resta < 8.5e3) p.push('o tempo da vez andou durante o aviso: resta ' + resta + ' ms');
    clearTimer();
    // privado: não congela
    avisoMostrar({ ic: '🧤', titulo: 'Você foi roubado!', anim: 'maoleve', para: [12345], seg: 2 });
    if (avisoMesaCongela()) p.push('aviso privado congelou a mesa');
    if (avisoParaJogador(999)) p.push('aviso privado vazou pra outro jogador');
    if (!avisoParaJogador(12345)) p.push('aviso privado não chega pro roubado');
    // debug 23/10: aviso da mesa não espera o privado: entra na hora e o privado volta depois
    avisoMostrar({ ic: '🎁', titulo: 'Presente!', anim: 'presente', seg: 2 });
    if (!avisoMesaCongela() || avisoMesa.titulo !== 'Presente!') p.push('o aviso da mesa ficou esperando o privado');
    if (!avisoFila.length || !avisoFila[0].para) p.push('o aviso privado sumiu em vez de voltar depois');
    avisoZerar();
    // debug 23/10: aviso que passou da hora sem o timer disparar não perde o "no fim" quando chega outro
    let fimRodou = false;
    avisoMostrar({ titulo: 'velho', anim: 'duelo', seg: 2, aoFim: () => (fimRodou = true) });
    avisoMesa.ate = Date.now() - 10;
    avisoMostrar({ titulo: 'novo', anim: 'bomba', seg: 2 });
    if (!fimRodou) p.push('o aoFim do aviso velho se perdeu quando o novo chegou');
    avisoZerar();
    // Bora! fecha só a caixa
    avisoMostrar({ ic: '⚔️', titulo: 'x', anim: 'ppt', dados: { nomeA: 'A', nomeB: 'B', a: 'pedra', b: 'papel' }, seg: 2 });
    document.querySelector('#avisoMesaOv .aviso-ok').click();
    if (document.getElementById('avisoMesaOv')) p.push('Bora! não fechou a caixa');
    if (!avisoMesaCongela()) p.push('Bora! cancelou o congelamento da mesa');
    avisoZerar();
    // convidado: aviso mal formado
    if (avisoLimpar({ id: 1 }) || avisoLimpar(null)) p.push('aceitou aviso mal formado');
    const lim = avisoLimpar({ id: 'x', ate: Date.now() + 2000, ic: '<img src=x onerror=alert(1)>', titulo: '<b>oi</b>', anim: 'hack" onclick="x', dados: { nomeA: '<i>' } });
    if (!lim || lim.anim !== null) p.push('anim fora da lista passou');
    avisoDesenhar(lim, Date.now());
    const h = document.getElementById('avisoMesaOv')?.innerHTML || '';
    if (/<img|<b>oi/.test(h)) p.push('HTML do aviso não foi escapado: ' + h);
    avisoZerar();
    // 1.7.10.7.2: cada tipo com o seu botão e a sua cor; a variante (Mestre do duelo) pode trocar o botão
    avisoMostrar({ titulo: 'b', anim: 'bomba', seg: 2 });
    if (!AVISO_BOTAO.bomba.includes(avisoMesa.botao)) p.push('aviso da bomba sem o botão próprio');
    if (!document.querySelector('#avisoMesaOv .aviso-bomba')) p.push('aviso da bomba sem a cor própria');
    avisoZerar();
    avisoMostrar({ titulo: 'd', anim: 'duelo', seg: 2, para: ['jm', 'jx'], variantes: { jm: { titulo: 'Mestre', botao: 'Tô pronto!' } } });
    if (avisoParaJogador('jm').botao !== 'Tô pronto!' || avisoParaJogador('jx').botao !== 'Bora!') p.push('botão da variante errado');
    avisoZerar();
    // 1.7.10.9 (achado no teste online): se desenhar ou mandar o aviso der erro, o aviso ainda acaba e o relógio volta
    {
      const pub = window.redeHostPublicar;
      window.redeHostPublicar = () => { throw new Error('rede caiu'); };
      try { avisoMostrar({ ic: '💣', titulo: 'erro', anim: 'bomba', seg: 2 }); } catch (e) { p.push('aviso jogou erro pra fora: ' + e.message); }
      window.redeHostPublicar = pub;
      await espera(2300);
      if (avisoMesaAtivo()) p.push('aviso com erro na rede não acabou');
      const t0 = Date.now();
      await espera(300);
      if (avisoCongeladoDesde(t0) > 50) p.push('mesa ficou congelada depois do aviso com erro');
      avisoZerar();
    }
    // 1.7.10.7: Espectar duelo — quem está fora do duelo vê o botão e, depois, a resposta; duelista e Mestre não
    const redeAntes = rede;
    const d = { fase: 'duelo', quem: 'A', contra: 'B', mestre: 'C', equipe: false, ids: ['ja', 'jb', 'jc'] };
    rede = { papel: 'convidado', eu: 'jd', retrato: { duelo: d, matchId: 'm1' }, espia: null };
    if (!/td-espiar/.test(telaoDueloHtml(d))) p.push('quem está fora do duelo não vê o Espectar');
    rede.espia = { resposta: 'Pelé', matchId: 'm1' };
    if (!/Pelé/.test(telaoDueloHtml(d))) p.push('o espectador não vê a resposta');
    rede.eu = 'ja';
    if (/td-espiar|Pelé/.test(telaoDueloHtml(d))) p.push('duelista consegue espectar');
    rede.eu = 'jc';
    if (/td-espiar|Pelé/.test(telaoDueloHtml(d))) p.push('o Mestre do duelo vê o Espectar');
    rede.eu = 'jd';
    if (/td-espiar|Pelé/.test(telaoDueloHtml({ ...d, equipe: true }))) p.push('Espectar apareceu no duelo de equipes');
    rede = redeAntes;
    return p;
  });
  problemas.push(...r1);
  if (PRINTS) {
    const anims = [
      ['duelo', '⚔️', 'Henrique te chamou pro duelo!', 'Só tem um jeito: Bora!'],
      ['mestre', '🎙️', 'Você é o Mestre do duelo', 'Lê as dicas pros dois.'],
      ['maoleve', '🧤', 'Você foi roubado!', 'Mão Leve passou por aqui.'],
      ['ppt', '✊', 'Jokenpô!', 'Rafa × Vitinho', { nomeA: 'Rafa', nomeB: 'Vitinho', a: 'pedra', b: 'tesoura' }],
      ['dado', '🎲', 'Dado!', '', { nomeA: 'Rafa', nomeB: 'Vitinho', a: 5, b: 2 }],
      ['moeda', '🪙', 'Cara ou coroa', '', { lado: 'cara' }],
      ['batata', '🥔', 'Batata Quente!', 'Com o Henrique.'],
      ['bomba', '💣', 'Bomba!', ''],
    ];
    for (const [anim, ic, titulo, texto, dados] of anims) {
      await page.evaluate((o) => { avisoZerar(); avisoFechadoAqui = null; avisoMostrar(o); }, { anim, ic, titulo, texto, dados, seg: 6 });
      await page.waitForTimeout(anim === 'ppt' || anim === 'dado' || anim === 'moeda' ? 2200 : 700);
      await page.screenshot({ path: `${PRINTS}/aviso_${anim}.png` });
    }
  }
  await b.close();
  problemas.push(...erros.map((e) => 'erro na página: ' + e));
  if (problemas.length) {
    problemas.forEach((x) => console.log('FALHOU ', x));
    console.log('AVISO COM PROBLEMA');
    process.exit(1);
  }
  console.log('AVISO OK');
})();
