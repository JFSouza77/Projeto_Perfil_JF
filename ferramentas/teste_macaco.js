#!/usr/bin/env node
// Teste do macaco (1.7.8.9): monta uma partida (modo e formato pela semente) e sai tocando em botões ao
// acaso, como um dedo: só o que está visível e por cima de tudo, com mais peso no que faz a partida andar.
// Sem internet nenhuma. A cada 25 toques confere as regras básicas (pontos e casas válidos, vez e Mestre
// dentro da mesa, resposta fora do retrato da mesa, nenhum id repetido); a cada 200, recarrega a página e
// exige a mesma partida de volta. Dois jogadores têm nome em forma de HTML ("<b id=xss>B"): se isso
// virar elemento na tela, é falha de segurança. Anota erro de página e de console.
//   node ferramentas/teste_macaco.js [arquivo.html] [semente] [toques] [pc]
//   (semente 0..11 = os 12 cenários; sem arquivo, usa o Mestre mais novo)
const { acharMestre, abrirNavegador } = require('./_navegador');
const ARQ = acharMestre(process.argv[2] && process.argv[2].endsWith('.html') ? process.argv[2] : null);
const ARGS = process.argv.slice(process.argv[2] && process.argv[2].endsWith('.html') ? 3 : 2);
const SEM = +(ARGS[0] || 0), PASSOS = +(ARGS[1] || 600);
const VW = ARGS[2] === 'pc' ? { width: 1366, height: 800 } : { width: 390, height: 844 };
let x = SEM >>> 0; const rnd = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
(async () => {
  const b = await abrirNavegador();
  const ctx = await b.newContext({ viewport: VW, hasTouch: VW.width < 900 });
  await ctx.route(/^https?:/, (r) => r.abort()); // offline de verdade
  const page = await ctx.newPage();
  const erros = [], avisos = [];
  page.on('pageerror', (e) => erros.push(e.message.slice(0, 160)));
  // a internet está cortada de propósito (route acima): a fonte do Google que não carrega não é falha do jogo
  // (1.7.9.10: o macaco às vezes abre a sala online pela pausa; sem internet, o WebSocket do servidor da sala falha: também é esperado)
  page.on('console', (m) => { if (m.type() === 'error' && !(/^Failed to load resource/.test(m.text()) && /^https?:/.test((m.location() || {}).url || '')) && !/^WebSocket connection to 'wss?:\/\/[^']*peerjs/.test(m.text())) avisos.push(m.text().slice(0, 160)); });
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  page.on('popup', (p) => p.close().catch(() => {}));
  await page.addInitScript(() => {
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
    // nome de jogador em forma de HTML: se algum dia virar elemento na tela, é falha de segurança
    window.__xss = [];
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1 && (n.id === 'xss' || n.id === 'xs2' || (n.querySelector && n.querySelector('#xss,#xs2')))) window.__xss.push((n.parentElement && (n.parentElement.id || n.parentElement.className)) || '?'); }))).observe(document, { childList: true, subtree: true });
    const st = window.setTimeout.bind(window);
    window.setTimeout = (fn, ms, ...a) => st(fn, Math.min(Number(ms) || 0, 400), ...a);
  });
  await page.goto('file://' + ARQ);
  await page.waitForTimeout(1500);
  const CENS = [
    { formato: 'versus', modo: 'classico', cond: 'tabuleiro', jog: 3 }, { formato: 'versus', modo: 'classico', cond: 'casa', jog: 4 },
    { formato: 'versus', modo: 'classico', cond: 'joias', jog: 5 }, { formato: 'versus', modo: 'hardcore', cond: 'pontos', jog: 3 },
    { formato: 'versus', modo: 'junior', cond: 'tabuleiro', jog: 2 }, { formato: 'versus', modo: 'oldschool', cond: 'tabuleiro', jog: 4 },
    { formato: 'versus', modo: 'express', sabor: 'classico', jog: 3 }, { formato: 'versus', modo: 'express', sabor: 'hardcore', jog: 5 },
    { formato: 'equipe', modo: 'classico', cond: 'tabuleiro', jog: 4, equipes: 2 }, { formato: 'equipe', modo: 'classico', cond: 'joias', jog: 6, equipes: 3, sub: 'ffa' },
    { formato: 'equipe', modo: 'hardcore', cond: 'pontos', jog: 6, equipes: 2 }, { formato: 'equipe', modo: 'classico', cond: 'tabuleiro', jog: 6, equipes: 3, sub: 'duelo' },
  ];
  const cen = CENS[SEM % CENS.length];
  await page.evaluate((cen) => {
    document.querySelectorAll('.caos-modal-ov, #novidadesModal, .jf-modal-bg').forEach((o) => o.remove());
    CURRENT_FORMAT = cen.formato;
    players = Array.from({ length: cen.jog }, (_, i) => ({ id: jogadorIdNovo(), name: ['Ana','<b id=xss>B','Caio','<i id=xs2>','Edu','Fê'][i], score: 0, position: 0, isBlocked: false,
      color: CURRENT_FORMAT === 'equipe' ? '#888888' : PLAYER_COLORS[i], avatar: AVATARS[i], humor: ['normal','suave','acido','nivel0','normal','normal'][i], ageBracket: CURRENT_FORMAT === 'equipe' ? 'adulto' : null, team: null, gems: {} }));
    selectMode(cen.modo, null, cen.sabor);
    if (cen.cond) WIN_CONDITION = cen.cond;
    if (cen.formato === 'equipe') { formTeamsBalancedByAge(cen.equipes); equipeSubMode = cen.sub || 'duelo'; starterDrawCount = 1; drawEquipeOrder(); }
    else { starterDrawCount = 1; mestreIndex = pickStarterMestreVersus(); responderIndex = nextResponder(mestreIndex, mestreIndex); }
    ['splashScreen','welcomeScreen','playerPanel','orderRevealSection'].forEach((id) => { const e = document.getElementById(id); if (e) e.style.display = 'none'; });
    document.getElementById('gameScreen').style.display = 'block';
    const pa = document.getElementById('playAreaSection'); if (pa) pa.style.display = 'block';
    beginGameplay();
  }, cen);
  const invariantes = async (rotulo) => {
    const r = await page.evaluate(() => {
      const p = [];
      if (typeof players === 'undefined' || !starterChosen) return p;
      players.forEach((j) => { if (!Number.isFinite(j.score)) p.push('score não numérico ' + j.name); if (!Number.isFinite(j.position) || j.position < 0) p.push('casa inválida ' + j.name + '=' + j.position); if (j.score < 0) p.push('score negativo ' + j.name); });
      if (!['none','hidden','revealed','bonusChoice'].includes(cardState) && cardState) p.push('cardState estranho ' + cardState);
      if (mestreIndex < 0 || mestreIndex >= players.length) p.push('mestreIndex fora ' + mestreIndex);
      if (responderIndex < 0 || responderIndex >= players.length) p.push('responderIndex fora ' + responderIndex);
      try { const m = JSON.stringify(retratoPartida('mesa')); if (currentCard && currentCard.answer && currentCard.answer.length > 3 && m.includes('"' + currentCard.answer + '"')) p.push('RESPOSTA NO RETRATO DA MESA'); } catch (e) { p.push('retrato quebrou ' + e.message); }
      document.querySelectorAll('[id]').forEach((e) => {}); 
      const ids = {}; document.querySelectorAll('[id]').forEach((e) => { ids[e.id] = (ids[e.id] || 0) + 1; }); Object.keys(ids).forEach((k) => { if (ids[k] > 1 && !/^$/.test(k)) p.push('id duplicado #' + k); });
      return p;
    }).catch((e) => ['avaliação quebrou: ' + e.message]);
    r.forEach((x) => erros.push(rotulo + ': ' + x));
  };
  const contagem = {};
  let travado = 0;
  for (let i = 0; i < PASSOS; i++) {
    const alvos = await page.evaluate(() => {
      const vis = (e) => { const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return false; const s = getComputedStyle(e); if (!(s.visibility !== 'hidden' && s.display !== 'none' && s.pointerEvents !== 'none' && r.bottom > -innerHeight * 3 && r.top < innerHeight * 4)) return false; if (r.top >= 0 && r.bottom <= innerHeight) { const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!h && (h === e || e.contains(h) || h.contains(e)); } const ov = [...document.querySelectorAll('.ci-overlay, .caos-modal-ov, .jf-modal-bg, #tutorialOverlay, .casa-sorteio-ov')].find((o) => getComputedStyle(o).display !== 'none' && o.getBoundingClientRect().height > 0); return !ov || ov.contains(e); };
      document.querySelectorAll('[data-mq]').forEach((e) => e.removeAttribute('data-mq'));
      const sel = 'button:not([disabled]), [role=button], summary, .chip, .mode-card, .format-card, input[type=checkbox], select, .clue-btn, .answer-toggle, .board, .toast';
      return [...document.querySelectorAll(sel)].filter(vis).map((e, k) => {
        e.dataset.mq = k;
        // peso: o que faz a partida andar vale mais; sair, reiniciar e pausar valem pouco
        let w = 1;
        if (e.closest('#cardArea') || e.closest('.caos-modal-ov') || e.closest('.jf-modal-bg') || e.classList.contains('caos-mbtn')) w = 8;
        if (/pauseResumeBtn/.test(e.id)) w = 8;
        if (/pauseBtn|tutorial|Tut|Manual|novidades|nov|giveUpBtn/i.test(e.id || '')) w = 0.3;
        if (/resetBtn|endGameBtn|pauseTrocarModoBtn|trocarModo|admOpen/i.test(e.id || '')) w = 0.02;
        if (e.tagName === 'SUMMARY' || e.closest('#novidadesModal') || e.classList.contains('nov-tag')) w = 0.05;
        if (e.closest('#novidadesModal') && /novOk|novX/.test(e.id)) w = 5;
        return { k, w, t: (e.id || e.className || e.tagName).toString().slice(0, 40) + '|' + (e.textContent || '').trim().slice(0, 24) };
      });
    }).catch(() => []);
    // texto de cadastro: se tiver campo de nome vazio, escreve
    await page.evaluate((n) => { const inp = document.querySelector('input[type=text]:not([disabled])'); if (inp && !inp.value && inp.offsetParent) { inp.value = 'Jog' + n; inp.dispatchEvent(new Event('input', { bubbles: true })); } }, i).catch(() => {});
    if (!alvos.length) { travado++; if (travado > 120) { erros.push('sem botão visível por 12 s · tela: ' + (await page.evaluate(() => [...document.body.children].filter((e) => e.offsetParent || getComputedStyle(e).position === 'fixed').filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.id || e.className || e.tagName).slice(0, 8).join(',')).catch(() => '?'))); if (process.env.PRINT) await page.screenshot({ path: process.env.PRINT.replace(/\.png$/, '_trava.png') }); break; } await page.waitForTimeout(100); continue; }
    travado = 0;
    // evita sair do jogo/recarregar demais
    const pool = alvos.filter((a) => !/telao|Abrir telão|Instalar|Compartilhar|Baixar|Copiar/i.test(a.t));
    let tot = pool.reduce((t, a) => t + a.w, 0), alvo = rnd() * tot, a = pool[0] || alvos[0];
    for (const c of pool) { alvo -= c.w; if (alvo <= 0) { a = c; break; } }
    contagem[a.t.split('|')[0]] = (contagem[a.t.split('|')[0]] || 0) + 1;
    try {
      const el = await page.$(`[data-mq="${a.k}"]`);
      if (el) { const tag = await el.evaluate((e) => e.tagName); if (tag === 'SELECT') { await el.evaluate((e) => { if (e.options.length) { e.selectedIndex = Math.floor(Math.random() * e.options.length); e.dispatchEvent(new Event('change', { bubbles: true })); } }); } else await el.scrollIntoViewIfNeeded({ timeout: 800 }).catch(() => {}); await el.click({ timeout: 1500, force: true }); }
    } catch (e) {}
    await page.waitForTimeout(40);
    if (i % 25 === 24) await invariantes('passo ' + i);
    // de vez em quando recarrega a página: a partida tem que voltar igual
    if (i % 200 === 199) {
      const antes = await page.evaluate(() => { if (!starterChosen || gameEnded) return null; saveGameState(); const r = retratoPartida('mestre'); delete r.relogio; return JSON.stringify(r); }).catch(() => null);
      if (antes) {
        await page.reload(); await page.waitForTimeout(2500);
        const depois = await page.evaluate(() => { if (!starterChosen) return 'NAO RETOMOU'; const r = retratoPartida('mestre'); delete r.relogio; return JSON.stringify(r); }).catch((e) => 'erro ' + e.message);
        // ordem das chaves não importa (as joias voltam do save em ordem canônica)
        const canon = (t) => { try { const o = (v) => Array.isArray(v) ? v.map(o) : v && typeof v === 'object' ? Object.keys(v).sort().reduce((r, k) => ((r[k] = o(v[k])), r), {}) : v; return JSON.stringify(o(JSON.parse(t))); } catch (e) { return t; } };
        if (canon(depois) !== canon(antes)) { const A = JSON.parse(antes); let B = {}; try { B = JSON.parse(depois); } catch (e) {} erros.push('recarregar mudou: ' + (typeof depois === 'string' && depois.length < 40 ? depois : (() => { const dif = []; const cmp = (a, b, cam) => { if (JSON.stringify(a) === JSON.stringify(b)) return; if (a && b && typeof a === 'object' && typeof b === 'object') { new Set([...Object.keys(a), ...Object.keys(b)]).forEach((k) => cmp(a[k], b[k], cam + '.' + k)); } else dif.push(cam + ': ' + JSON.stringify(a) + ' → ' + JSON.stringify(b)); }; cmp(A, B, ''); return dif.slice(0, 6).join(' ; '); })())); }
      }
    }
  }
  const xss = await page.evaluate(() => (window.__xss.length ? window.__xss.slice(0, 5).join(',') : false)).catch(() => false);
  if (xss) erros.push('SEGURANÇA: nome de jogador virou HTML em ' + xss);
  const estado = await page.evaluate(() => ({ starter: typeof starterChosen !== 'undefined' && starterChosen, cartas: typeof stats !== 'undefined' && stats.totalDrawn, fim: typeof gameEnded !== 'undefined' && gameEnded, rev: typeof partidaRevisao !== 'undefined' && partidaRevisao })).catch(() => ({}));
  if (process.env.PRINT) await page.screenshot({ path: process.env.PRINT });
  console.log(Object.entries(contagem).sort((a,b)=>b[1]-a[1]).slice(0,12).map(x=>x.join(':')).join(' , '));
  const ok = !erros.length && !avisos.length;
  console.log(JSON.stringify({ sem: SEM, cen: cen.modo + '/' + cen.formato + '/' + (cen.cond || cen.sabor), vw: VW.width, estado, erros: [...new Set(erros)], consoleErros: [...new Set(avisos)].slice(0, 8), botoesDistintos: Object.keys(contagem).length }));
  console.log(ok ? 'MACACO OK' : 'MACACO ACHOU PROBLEMA');
  await b.close();
  process.exit(ok ? 0 : 1);
})();
