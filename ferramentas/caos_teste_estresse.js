#!/usr/bin/env node
// Teste de estresse, tédio e animação das emoções do C.A.O.S. (só reporta). Chama o motor real
// de emoções na página com sequências de eventos (A acerto, E erro, X absurdo, P pulo, T 30 s parado)
// em cada temperamento, e mostra o pico, as trocas de emoção, a volta ao calmo e a paciência.
//   node ferramentas/caos_teste_estresse.js [mestre.html]
//   V=1 mostra a contagem de emoção/estado/matriz/mistura; TEMPS=normal,rabugento e CEN=estresse filtram.
const { acharMestre, abrirNavegador } = require('./_navegador');
const file = acharMestre(process.argv[2]);
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage(); const erros = []; page.on('pageerror', (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.goto('file://' + file); await page.waitForFunction(() => typeof caosConsoleReset === 'function');
  const REC = 'AEAEAPAEAEAAEAEPAEAEAEAAE';
  const cenarios = {
    estresse: 'E'.repeat(25) + 'X'.repeat(5) + REC,
    tedio: 'P'.repeat(10) + 'T'.repeat(20) + REC,
    animacao: 'A'.repeat(30) + REC,
    montanha: 'AAAEEEAAXXAAAAEEEEPPPAAAA' + REC,
    aleatorio: Array.from({ length: 120 }, (_, i) => 'AAEEPX'[(i * 7919 + 13) % 6]).join(''),
    realista: Array.from({ length: 120 }, (_, i) => 'AAAEEPAAEAEAAEPAAXAEEAAEAPAAEA'[(i * 7 + 3) % 30]).join(''),
    absurdos: 'X'.repeat(30) + REC,
  };
  for (const temp of (process.env.TEMPS || 'normal,rabugento,generoso,eletrico,sensivel').split(',')) {
    for (const [nome, seq] of Object.entries(cenarios).filter(([n]) => !process.env.CEN || process.env.CEN === n)) {
      if (process.env.CEN) await page.evaluate(() => { window.__dump = []; });
      const r = await page.evaluate(({ seq, temp }) => {
        CURRENT_MODE = 'classico'; CURRENT_FORMAT = 'versus'; gameEnded = false;
        players = [{ name: 'Ana', humor: 'normal', score: 0, position: 0 }, { name: 'Beto', humor: 'normal', score: 0, position: 0 }];
        stats.totalDrawn = 0;
        caosConsoleReset(); caosEixosReset();
        caosTemper = CAOS_TEMPERAMENTOS[temp]; caosEmo.tensao = 5 + caosTemper.t; caosEmo.calor = 5 + caosTemper.c; caosEmo.paciencia = 7;
        const hist = []; let flaps = 0, ant = 'calmo', nan = false, foraTeto = [], maxDwellNaoCalmo = 0, run = 0;
        for (let i = 0; i < seq.length; i++) {
          const ev = seq[i]; stats.totalDrawn++;
          caosConsoleCarta(false);
          if (ev === 'T') { for (let k = 0; k < 3; k++) caosSentir('tedio', 1, '30 s sem evento na mesa'); }
          else if (ev !== '.') caosJogEmoRegistrar(i % 2, ev);
          if (ev === 'A') caosEmoNudge(-0.4, 0.6);
          if (ev === 'E' || ev === 'X') { window.__se = (window.__se || 0) + 1; caosEmoNudge(window.__se >= 2 ? 1 : 0.5, window.__se >= 2 ? -0.3 : 0); } else window.__se = 0;
          if (ev === 'P') caosEmoNudge(-0.2, -0.4);
          caosConsoleAvancar('x'); caosEmoMaybeDecay();
          const C = caosConsole;
          Object.entries(C.g).forEach(([k, v]) => { if (!Number.isFinite(v)) nan = true; if (v > CAOS_CONSOLE[k].teto + 1e-9) foraTeto.push(k); });
          ['tensao', 'calor', 'paciencia'].forEach((k) => { if (!Number.isFinite(caosEmo[k]) || caosEmo[k] < 0 || caosEmo[k] > 10) nan = true; });
          if (C.atual !== ant) flaps++; ant = C.atual;
          run = C.atual === 'calmo' ? 0 : run + 1; maxDwellNaoCalmo = Math.max(maxDwellNaoCalmo, run);
          if (window.__dump && i < 12) window.__dump.push(i + ev + ' ' + C.atual + ' ' + JSON.stringify(Object.fromEntries(Object.entries(C.g).filter(([,v])=>v>0.5).map(([k,v])=>[k,+v.toFixed(1)]))));
          hist.push({ i, ev, atual: C.atual, mostra: C.mostra, mist: C.mist, est: caosEstadoComposto(), mat: caosHumorMatriz(), t: caosEmo.tensao, c: caosEmo.calor, p: caosEmo.paciencia, top: Object.entries(C.g).sort((a, b) => b[1] - a[1])[0] });
        }
        const fimAtivo = seq.endsWith('AEAEAPAEAEAAEAEPAEAEAEAAE') ? seq.length - 25 : seq.length;
        const voltou = hist.slice(fimAtivo).findIndex((h) => h.atual === 'calmo');
        const cont = (k) => { const o = {}; hist.forEach((h) => { o[h[k]] = (o[h[k]] || 0) + 1; }); return o; };
        const pico = hist.slice(0, fimAtivo).reduce((m, h) => (h.top[1] > m[1] ? h.top : m), ['', 0]);
        return { flaps, nan, foraTeto: [...new Set(foraTeto)], voltouEm: voltou, maxDwellNaoCalmo, atual: cont('atual'), est: cont('est'), mat: cont('mat'), mist: cont('mist'), pico, pacMin: Math.min(...hist.map((h) => h.p)), pacFim: hist[hist.length - 1].p, fim: hist[hist.length - 1].atual };
      }, { seq, temp });
      if (process.env.CEN) console.log((await page.evaluate(() => window.__dump)).join('\n'));
      const fmt = (o) => Object.entries(o).filter(([k]) => k !== 'null').map(([k, v]) => `${k}:${v}`).join(' ');
      console.log(`${temp.padEnd(9)} ${nome.padEnd(9)} pico ${r.pico[0]} ${r.pico[1].toFixed(1)} | trocas ${r.flaps} | volta ao calmo: ${r.voltouEm < 0 ? (nome === 'aleatorio' || nome === 'realista' ? '—' : 'NÃO VOLTOU') : r.voltouEm + ' cartas'} | paciência mín ${r.pacMin.toFixed(1)} fim ${r.pacFim.toFixed(1)}${r.nan ? ' | ❌ NaN/fora de 0-10' : ''}${r.foraTeto.length ? ' | ❌ acima do teto: ' + r.foraTeto : ''}`);
      if (process.env.V) console.log('   emoção:', fmt(r.atual), '\n   estado:', fmt(r.est), '\n   matriz:', fmt(r.mat), '\n   mistura:', fmt(r.mist));
    }
  }
  console.log(erros.length ? 'ERROS NA PÁGINA: ' + erros.join(' | ') : 'Sem erro na página.'); await b.close();
})();
