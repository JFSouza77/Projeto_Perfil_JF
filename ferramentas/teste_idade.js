#!/usr/bin/env node
// Teste da idade obrigatória (1.7.10.6, pedido do JF): 3 faixas (menos de 12, 12 a 15, 16 ou mais), ninguém entra no
// cadastro nem começa a partida sem idade, o dispositivo lembra a faixa de cada nome e pede confirmação quando um
// nome conhecido aparece numa faixa maior. O Modo C.A.O.S. só vale pra quem é 16+.
//   node ferramentas/teste_idade.js [arquivo.html]
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
  await page.waitForFunction(() => typeof addPlayer === 'function' && !document.getElementById('goToRulesBtn').disabled);
  const r = await page.evaluate(async () => {
    const o = {};
    const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
    document.querySelectorAll('.caos-modal-ov, .jf-modal-bg, #novidadesModal').forEach((x) => x.remove());
    caosSilenced = true;
    JFStore.removeItem(IDADE_MEM_KEY);
    CURRENT_FORMAT = 'versus';
    selectMode('classico');
    players = [];
    ['splashScreen', 'welcomeScreen'].forEach((id) => (document.getElementById(id).style.display = 'none'));
    document.getElementById('playerPanel').style.display = 'block';
    const inp = document.getElementById('playerNameInput');
    const preparar = (nome) => {
      inp.value = nome;
      cadCor = true;
      cadEmoji = true;
      cadHumor = true;
      selectedHumor = 'normal';
    };
    // 1) sem idade não adiciona
    preparar('Bia');
    selectedIdade = null;
    o.semIdadeTrava = !cadPodeAdicionar() && /idade/.test(cadFaltaTexto());
    selectedIdade = 'menor';
    o.comIdadeLibera = cadPodeAdicionar();
    addPlayer();
    o.entrou = players.length === 1 && players[0].idade === 'menor';
    o.lembrou = idadeConhecida('bia') === 'menor';
    // 2) nome conhecido: a idade já vem marcada
    players = [];
    idadeLimpar();
    preparar('Bia');
    idadeSugerirDoNome('Bia');
    o.sugeriu = selectedIdade === 'menor';
    // 3) faixa maior que a lembrada: pede confirmação antes de entrar
    selectedIdade = 'doze';
    addPlayer();
    const modal = document.getElementById('caosConfirmModal');
    o.pediuConfirmacao = !!modal && players.length === 0 && /Bia/.test(modal.textContent);
    if (modal) [...modal.querySelectorAll('button')].find((x) => /Confirmo/.test(x.textContent)).click();
    await espera(20);
    o.confirmouEntrou = players.length === 1 && players[0].idade === 'doze' && idadeConhecida('Bia') === 'doze';
    // faixa menor ou igual passa direto
    players = [];
    preparar('Bia');
    selectedIdade = 'menor';
    addPlayer();
    o.menorPassaDireto = players.length === 1 && !document.getElementById('caosConfirmModal');
    // 4) começar a partida com jogador sem idade: a pergunta aparece e, respondida, segue
    players = [{ id: jogadorIdNovo(), name: 'Caio', score: 0, position: 0, color: PLAYER_COLORS[1], avatar: '🙂', humor: 'normal', gems: {} }];
    let seguiu = false;
    idadeCompletarAntes(() => (seguiu = true));
    const fm = document.getElementById('idadeFaltaModal');
    o.perguntouIdade = !!fm && !seguiu && /Caio/.test(fm.textContent);
    if (fm) [...fm.querySelectorAll('button')].find((x) => /16 ou mais/.test(x.textContent)).click();
    await espera(20);
    o.seguiuDepois = seguiu && players[0].idade === 'dezesseis';
    // 5) faixas: o "12 ou mais" antigo vale como 12 a 15; Modo C.A.O.S. só 16+
    o.antigoMaior = idadeNorm('maior') === 'doze';
    o.so16 = jogador16({ idade: 'dezesseis' }) && !jogador16({ idade: 'doze' }) && !jogador16({ idade: 'maior' }) && !jogador16({});
    o.equipe = idadeDaFaixa('crianca') === 'menor' && idadeDaFaixa('pre') === 'doze' && idadeDaFaixa('jovem') === 'dezesseis' && idadeDaFaixa('adulto') === 'dezesseis';
    return o;
  });
  let ok = !erros.length;
  for (const [k, v] of Object.entries(r)) {
    console.log((v ? 'ok    ' : 'FALHOU') + '  ' + k);
    ok = ok && v;
  }
  if (erros.length) console.log('Erros na página:', erros.slice(0, 5).join(' | '));
  else console.log('Sem erro na página.');
  console.log(ok ? 'IDADE OK' : 'IDADE COM FALHA');
  await b.close();
  process.exit(ok ? 0 : 1);
})();
