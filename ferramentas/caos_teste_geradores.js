#!/usr/bin/env node
// Teste dos geradores de fala do C.A.O.S. (só reporta). Monta muitas falas de cada gatilho e confere:
// quantas saem diferentes, se alguma sai vazia ou com {chave} sem preencher, e se a memória salva
// evita repetir depois de fechar e abrir o jogo.
//   node ferramentas/caos_teste_geradores.js [quantas por gatilho] [mestre.html]
// Precisa de playwright-core e Chromium (os mesmos do build.js --testar).
const { acharMestre, abrirNavegador } = require('./_navegador');
const N = +(process.argv[2] || 30), file = acharMestre(process.argv[3]);
(async () => {
  const b = await abrirNavegador();
  const ctx = await b.newContext(); const page = await ctx.newPage();
  const erros = []; page.on('pageerror', (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  const abrir = async () => { await page.goto('file://' + file); await page.waitForFunction(() => typeof caosGerarFala === 'function'); };
  await abrir();
  const roda = (cfg) => page.evaluate(({ N, cfg }) => {
    CURRENT_MODE = cfg.modo || 'classico'; CURRENT_FORMAT = cfg.formato || 'versus';
    players = cfg.mesa.map((n) => ({ name: n, avatar: n === 'JF' ? '😎' : n === 'Anne' ? '👸' : '🙂', humor: cfg.humor || 'normal' }));
    const out = [];
    for (let i = 0; i < N; i++) {
      const p = cfg.quem != null ? players[cfg.quem] : null;
      out.push(caosGerarFala(cfg.g, p, cfg.extra).replace('[C.A.O.S.] ', ''));
    }
    return out;
  }, { N, cfg });
  const casos = [
    { g: 'jfChegou', quem: 0, mesa: ['JF'] },
    { g: 'jfChegou', quem: 0, mesa: ['JF', 'Anne', 'Pedro'], modo: 'hardcore' },
    { g: 'anneChegou', quem: 1, mesa: ['JF', 'Anne'] },
    { g: 'jfInicio', quem: 0, mesa: ['JF', 'Ana', 'Beto'] },
    { g: 'jfAcerto', quem: 0, mesa: ['JF', 'Anne'] },
    { g: 'jfFim', quem: 0, mesa: ['JF', 'Ana'], extra: { tags: ['jfPerdeu'] } },
    { g: 'inicioModo', quem: null, mesa: ['Ana', 'Beto'], modo: 'junior' },
    { g: 'inicioModo', quem: null, mesa: ['Ana', 'Beto', 'Caio', 'Dani'], formato: 'equipe' },
    { g: 'boasVindas', quem: 1, mesa: ['Ana', 'Beto'] },
    { g: 'boasVindas', quem: 0, mesa: ['Caio'], extra: { tags: ['primeiro'] }, humor: 'suave' },
    { g: 'boasVindas', quem: 2, mesa: ['JF', 'Anne', 'Dani'], modo: 'hardcore', humor: 'acido' },
    { g: 'inicioMestre', quem: 1, mesa: ['Ana', 'Beto', 'Caio'] },
    { g: 'inicioPrimeiro', quem: 2, mesa: ['Ana', 'Beto', 'Caio'], humor: 'acido' },
    { g: 'revanche', quem: null, mesa: ['Ana', 'Beto'], extra: { vars: { nome: 'Ana' } } },
    { g: 'pausaHumor', quem: null, mesa: ['Ana', 'Beto'], extra: { tags: ['d3'], vars: { pausa: '4 minutos' } } },
    { g: 'pausaVolta', quem: null, mesa: ['Ana', 'Beto'], extra: { tags: ['magoado'], vars: { pausa: '3 minutos' } } },
    { g: 'religado', quem: 0, mesa: ['Ana', 'Beto'] },
    { g: 'chute', quem: 0, mesa: ['Ana', 'Beto'], extra: { tags: ['tipo_longe', 'cat_LUGAR', 'cartaDificil'], vars: { chute: 'Paris', anos: '0 anos', dicasTxt: '4 dicas', cat: 'Lugar' } } },
    { g: 'chute', quem: 1, mesa: ['Ana', 'Beto'], extra: { tags: ['tipo_anoPerto', 'cat_ANO', 'chuteRepetido'], vars: { chute: '1995', anos: '6 anos', dicasTxt: '3 dicas', cat: 'Ano', quemAntes: 'Ana' } } },
    { g: 'pensamento', quem: null, mesa: ['Ana', 'Beto'], extra: { tags: ['emo_raiva', 'mist_magoado', 'temLider'], vars: { lider: 'Ana' } } },
    { g: 'pensamento', quem: null, mesa: ['Ana', 'Beto'], extra: { tags: ['emo_alegria', 'comecoPartida'] } },
    { g: 'inicioJogadores', quem: null, mesa: ['Ana', 'Beto', 'Caio'], extra: { tags: ['q3'] } },
  ];
  for (const c of casos) {
    const out = await roda(c);
    const vazias = out.filter((x) => !x).length;
    const dist = new Set(out).size;
    console.log(`\n== ${c.g} (${c.mesa.join(', ')}${c.modo ? ' · ' + c.modo : ''}${c.formato ? ' · ' + c.formato : ''}): ${dist}/${out.length} diferentes, ${vazias} vazias`);
    out.slice(0, +(process.env.MOSTRA || 8)).forEach((x) => console.log('  - ' + x));
    const ruins = out.filter((x) => /\{\w+\}|\s[.,]|undefined|null/.test(x));
    if (ruins.length) console.log('  ❌ ruins:', ruins.slice(0, 3));
  }
  // memória entre recargas: as 5 últimas antes x as 5 primeiras depois
  const antes = await roda({ g: 'jfChegou', quem: 0, mesa: ['JF'] });
  await abrir();
  const depois = await roda({ g: 'jfChegou', quem: 0, mesa: ['JF'] });
  const rep = depois.slice(0, 8).filter((x) => antes.slice(-8).includes(x)).length;
  console.log(`\nMemória após recarga: ${rep} de 8 falas repetiram as 8 últimas de antes`);
  console.log('Tamanho da memória salva:', await page.evaluate(() => (localStorage.getItem('perfil5_caos_gerador') || '').length), 'letras');
  console.log(erros.length ? 'ERROS NA PÁGINA: ' + erros.join(' | ') : 'Sem erro na página.');
  await b.close();
})();
