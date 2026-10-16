#!/usr/bin/env node
// Auditoria dos motores de fala do C.A.O.S. (geradores por gatilho): monta muitas falas de cada gerador, em
// contextos variados, e conta as que saem sem sentido. Também serve de teste fixo: falha se algum defeito passar
// do limite (--testar).
// Defeitos que ele procura:
//   rabinho   — termina num fecho genérico que não conversa com o resto ("Enfim.", "Bora seguir.", "Mas sigo firme.")
//   orfa      — começa com conectivo que pede uma frase antes ("Mas…", "Já…", "Até…") ou pedaço sem sujeito
//   empilhada — 5 frases ou mais (ideias demais na mesma fala)
//   nome2x    — o mesmo nome aparece duas vezes
//   repete    — a mesma expressão de 2 palavras aparece duas vezes ("de novo… de novo", "bons tempos… bons tempos")
//   acao2x    — duas chamadas pra ação ("Vamos jogar. Bora.")
//   tom       — sentimento bom com fecho de quem está mal ("bom humor… Mas sigo firme.") ou o contrário
//   node ferramentas/caos_auditar_geradores.js [por caso] [--testar] [--mostra=N]
const { acharMestre, abrirNavegador } = require('./_navegador');
const args = process.argv.slice(2);
const N = +(args.find((a) => /^\d+$/.test(a)) || 150);
const TESTAR = args.includes('--testar');
const MOSTRA = +((args.find((a) => a.startsWith('--mostra=')) || '--mostra=4').slice(9));
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage();
  const erros = []; page.on('pageerror', (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.goto('file://' + acharMestre(args.find((a) => a.endsWith('.html'))));
  await page.waitForFunction(() => typeof caosGerarFala === 'function');
  const r = await page.evaluate(({ N }) => {
    const casos = [
      ['jfChegou', 0, ['JF']], ['jfChegou', 0, ['JF', 'Anne', 'Pedro'], 'hardcore'],
      ['anneChegou', 1, ['JF', 'Anne']], ['jfInicio', 0, ['JF', 'Ana', 'Beto']], ['jfAcerto', 0, ['JF', 'Anne']],
      ['jfFim', 0, ['JF', 'Ana'], null, { tags: ['jfPerdeu'] }], ['jfFim', 0, ['JF', 'Ana'], null, { tags: ['jfGanhou'] }],
      ['inicioModo', null, ['Ana', 'Beto'], 'junior'], ['inicioModo', null, ['Ana', 'Beto', 'Caio'], 'hardcore'],
      ['boasVindas', 1, ['Ana', 'Beto']], ['boasVindas', 0, ['Caio'], null, { tags: ['primeiro'] }],
      ['inicioMestre', 1, ['Ana', 'Beto', 'Caio']], ['inicioPrimeiro', 2, ['Ana', 'Beto', 'Caio']],
      ['revanche', null, ['Ana', 'Beto'], null, { vars: { nome: 'Ana' } }],
      ['pausaHumor', null, ['Ana', 'Beto'], null, { tags: ['d3'], vars: { pausa: '4 minutos' } }],
      ['pausaVolta', null, ['Ana', 'Beto'], null, { tags: ['magoado'], vars: { pausa: '3 minutos' } }],
      ['religado', 0, ['Ana', 'Beto']],
      ['chute', 0, ['Ana', 'Beto'], null, { tags: ['tipo_longe', 'cat_LUGAR', 'cartaDificil'], vars: { chute: 'Paris', anos: '0 anos', dicasTxt: '4 dicas', cat: 'Lugar' } }],
      ['pensamento', null, ['Ana', 'Beto'], null, { tags: ['emo_raiva', 'mist_magoado', 'temLider'], vars: { lider: 'Ana' } }],
      ['pensamento', null, ['Ana', 'Beto'], null, { tags: ['emo_alegria', 'comecoPartida'] }],
      ['pensamento', null, ['Ana', 'Beto'], null, { tags: ['emo_tedio', 'partidaLonga'], vars: { min: '40' } }],
      ['inicioJogadores', null, ['Ana', 'Beto', 'Caio'], null, { tags: ['q3'] }],
      ['abertura', null, ['Ana', 'Beto']], ['hostCaiu', null, ['Ana', 'Beto'], null, { vars: { antigo: 'Ana', nome: 'Beto' } }],
      ['pausaVolta', null, ['Ana', 'Beto'], null, { tags: ['leve'], vars: { pausa: '2 minutos' } }],
    ];
    const FECHOS = /^(bora|bora seguir|enfim|mas sigo firme|voltando ao jogo|vamos nessa|que comece|boa sorte|eu tô de olho|eu estou de olho|sem pressão\. muita pressão|agora é sério\. mais ou menos)[.!]?$/i;
    const ACAO = /\b(bora|vamos jogar|vamos nessa|que comece|bora jogar|vamos continuar)\b/gi;
    const POS = /(bom humor|gostando|divertido|tranquilo|em paz|gosto dessa mesa|legais|orgulhoso)/i;
    const NEG_FECHO = /(mas sigo firme|passa\.|respira)/i;
    const frases = (t) => t.split(/(?<=[.!?…])\s+/).filter(Boolean);
    const out = {};
    for (const [g, quem, mesa, modo, extra] of casos) {
      if (!CAOS_GERADORES[g]) continue;
      CURRENT_MODE = modo || 'classico'; CURRENT_FORMAT = 'versus';
      players = mesa.map((n) => ({ name: n, avatar: n === 'JF' ? '😎' : n === 'Anne' ? '👸' : '🙂', humor: 'normal' }));
      const p = quem != null ? players[quem] : null;
      const o = out[g] || (out[g] = { n: 0, def: {}, ex: {} });
      for (let i = 0; i < N; i++) {
        const t = caosGerarFala(g, p, extra).replace(/^\[C\.A\.O\.S\.\]\s*/, '');
        if (!t) continue;
        o.n++;
        const fs = frases(t), def = [];
        const ultima = fs[fs.length - 1] || '';
        if (fs.length > 1 && FECHOS.test(ultima.trim())) def.push('rabinho');
        if (/^(mas|já|até|enquanto isso|também|e (?!aí))\b/i.test(t)) def.push('orfa');
        if (fs.length >= 5) def.push('empilhada');
        for (const nm of mesa) {
          const c = (t.match(new RegExp('\\b' + nm + '\\b', 'g')) || []).length;
          if (c >= 2) { def.push('nome2x'); break; }
        }
        // mesma expressão de 2 palavras em dois pedaços diferentes da fala (repetição de propósito dentro do mesmo
        // pedaço, tipo "Nem de longe. Nem de binóculo", não conta)
        const bigr = (x) => { const pl = x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z]+/).filter(Boolean); const o = new Set(); for (let k = 0; k < pl.length - 1; k++) if (pl[k].length >= 4 || pl[k + 1].length >= 4) o.add(pl[k] + ' ' + pl[k + 1]); return o; };
        const pcs = (typeof caosGerUltPedacos !== 'undefined' && caosGerUltPedacos.length ? caosGerUltPedacos : [t]);
        let rep = false;
        for (let a = 0; a < pcs.length && !rep; a++) for (let c = a + 1; c < pcs.length; c++) if ([...bigr(pcs[c])].some((x) => bigr(pcs[a]).has(x))) { rep = true; break; }
        if (rep) def.push('repete');
        if ((t.match(ACAO) || []).length >= 2) def.push('acao2x');
        if (POS.test(t) && NEG_FECHO.test(ultima)) def.push('tom');
        def.forEach((d) => {
          o.def[d] = (o.def[d] || 0) + 1;
          (o.ex[d] = o.ex[d] || []).length < 6 && !o.ex[d].includes(t) && o.ex[d].push(t);
        });
      }
    }
    return out;
  }, { N });
  const total = {}; let falas = 0;
  for (const [g, o] of Object.entries(r)) {
    falas += o.n;
    const ds = Object.entries(o.def).sort((a, b2) => b2[1] - a[1]);
    ds.forEach(([d, c]) => (total[d] = (total[d] || 0) + c));
    console.log(`\n== ${g}: ${o.n} falas · ${ds.length ? ds.map(([d, c]) => `${d} ${Math.round((100 * c) / o.n)}%`).join(' · ') : 'sem defeito'}`);
    if (MOSTRA) ds.forEach(([d]) => o.ex[d].slice(0, MOSTRA).forEach((x) => console.log(`  [${d}] ${x}`)));
  }
  console.log('\nTOTAL (' + falas + ' falas): ' + (Object.entries(total).map(([d, c]) => `${d} ${((100 * c) / falas).toFixed(1)}%`).join(' · ') || 'sem defeito'));
  if (erros.length) console.log('Erros na página:', erros.slice(0, 3));
  // limites do teste fixo (passo 5): nenhum defeito acima de 1% no total
  const ruins = Object.entries(total).filter(([, c]) => c / falas > 0.01);
  if (TESTAR) console.log(ruins.length || erros.length ? 'GERADORES FALHOU: ' + ruins.map(([d]) => d).join(', ') : 'GERADORES OK');
  await b.close();
  process.exit(TESTAR && (ruins.length || erros.length) ? 1 : 0);
})();
