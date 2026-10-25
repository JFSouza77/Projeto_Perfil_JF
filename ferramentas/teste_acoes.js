#!/usr/bin/env node
// Teste das ações (1.7.8 · Actions and Events Update, Parte 1) do retrato da partida (1.7.8.1) do desfazer (1.7.8.2), dos ids das dicas e dos eventos de fala (1.7.8.4).
// Confere a fronteira de ações: toque vira ação registrada (sem contar de novo o que o motor chama
// por dentro), a revisão só sobe quando o estado muda, e dispatchAction recusa partida errada,
// revisão obsoleta, comando repetido e ação fora de hora. Revisão e registro vão pro save.
//   node ferramentas/teste_acoes.js [arquivo.html]
const { acharMestre, abrirNavegador } = require('./_navegador');
const ARQ = acharMestre(process.argv[2]);
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.addInitScript(() => {
    // esperas do jogo encurtadas (balões, animações); o prazo de 8 s do desfazer fica de verdade
    window.setTimeout = ((st) => (fn, ms, ...a) => st(fn, Number(ms) >= 7000 ? ms : Math.min(Number(ms) || 0, 5), ...a))(window.setTimeout.bind(window));
    try {
      localStorage.setItem('perfil5_tutorial_visto', 'x');
      localStorage.setItem('perfil5_tut_vitoria_vistos', JSON.stringify(['casa', 'tabuleiro', 'pontos', 'joias']));
    } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
  });
  await page.goto('file://' + ARQ);
  await page.waitForFunction(() => typeof dispatchAction === 'function' && !document.getElementById('goToRulesBtn').disabled);
  const r = await page.evaluate(async () => {
    const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const out = {};
    out.instaladas = Object.keys(ACOES).filter((t) => window[ACOES[t].fn] && window[ACOES[t].fn].__acao).length + '/' + Object.keys(ACOES).length;
    document.querySelectorAll('.caos-modal-ov, .jf-modal-bg').forEach((o) => o.remove());
    CURRENT_FORMAT = 'versus';
    players = ['Ana', 'Beto', 'Caio'].map((n, i) => ({ id: jogadorIdNovo(), name: n, score: 0, position: 0, color: PLAYER_COLORS[i], avatar: '😀', humor: 'normal', gems: {} }));
    selectMode('classico');
    WIN_CONDITION = 'tabuleiro';
    starterDrawCount = 1;
    mestreIndex = 0;
    responderIndex = 1;
    ['splashScreen', 'welcomeScreen', 'playerPanel'].forEach((id) => (document.getElementById(id).style.display = 'none'));
    document.getElementById('gameScreen').style.display = 'flex';
    beginGameplay();
    await espera(30);
    const fechar = () => {
      if (activeToastState) closeActiveToast();
      document.querySelectorAll('.caos-modal-ov, #tutorialOverlay').forEach((o) => o.remove());
    };
    fechar();
    const rev0 = partidaRevisao;
    // 1) toque de verdade (o botão chama a função pelo nome): vira ação com origem "toque"
    const tocar = async (el) => { toqueJogoUltimo = 0; el.click(); await espera(30); fechar(); };
    const virar = document.getElementById('flipBtn') || document.querySelector('#cardArea .flip-btn');
    if (cardState === 'hidden' && virar) await tocar(virar);
    if (cardState === 'hidden') flipCard();
    await espera(30); fechar();
    const num = [...document.querySelectorAll('#cardArea .number-btn:not(.aberta)')].find((e) => currentCard.clues[+e.dataset.idx].type === 'clue');
    num.id = 'numTeste';
    toqueJogoUltimo = 0;
    return out;
  });
  // toque de verdade (evento confiável do navegador)
  await page.click('#numTeste');
  await page.waitForTimeout(80);
  const r2 = await page.evaluate(async () => {
    const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const out = {};
    const fechar = () => {
      if (activeToastState) closeActiveToast();
      document.querySelectorAll('.caos-modal-ov, #tutorialOverlay').forEach((o) => o.remove());
    };
    fechar();
    const tocar = async (el) => { toqueJogoUltimo = 0; el.click(); await espera(30); fechar(); };
    const rev0 = 0;
    out.dicaAberta = pendingIndex !== null;
    out.logToque = acoesLog.slice(-3).map((x) => x.a + ':' + x.o).join(',');
    // 2) Errou: o motor chama render, vez, etc. por dentro: só UMA ação
    const nAntes = acoesLog.length;
    if (document.getElementById('wrongBtn')) await tocar(document.getElementById('wrongBtn'));
    out.umaAcaoPorToque = acoesLog.length === nAntes + 1 && acoesLog[acoesLog.length - 1].a === 'errou';
    out.revisaoSubiu = partidaRevisao > rev0;
    out.comQuem = !!acoesLog[acoesLog.length - 1].m && !!acoesLog[acoesLog.length - 1].v;
    // 3) toque fora de hora (Errou sem dica aberta) não muda nada: revisão igual
    const rv = partidaRevisao;
    markWrong();
    out.semMudancaSemRevisao = partidaRevisao === rv;
    // 4) comandos
    const livre = currentCard.clues.findIndex((c, i) => c.type === 'clue' && !revealedOrder.some((x) => x.index === i));
    out.desconhecida = dispatchAction({ type: 'trapacear' }).motivo;
    out.partidaErrada = dispatchAction({ type: 'escolherDica', data: [livre], matchId: 'p_outrapartida1' }).motivo;
    out.obsoleta = dispatchAction({ type: 'escolherDica', data: [livre], expectedRevision: partidaRevisao - 1 }).motivo;
    out.foraDeHora = dispatchAction({ type: 'acertou', data: [1] }).motivo;
    const c1 = dispatchAction({ type: 'escolherDica', data: [livre], commandId: 'cmd-1', matchId, expectedRevision: partidaRevisao });
    out.comandoOk = c1.ok && pendingIndex === livre && acoesLog[acoesLog.length - 1].o === 'comando';
    fechar();
    const revDepois = partidaRevisao;
    const c2 = dispatchAction({ type: 'escolherDica', data: [livre], commandId: 'cmd-1', matchId, expectedRevision: revDepois - 1 });
    out.duplicadoNaoAplica = c2.ok && c2.duplicado === true && partidaRevisao === revDepois;
    // 4b) retrato da partida (1.7.8.1): o público nunca leva resposta, id da carta nem dica fechada
    fechar();
    const pub = JSON.stringify(retratoPartida('mesa'));
    const mes = retratoPartida('mestre');
    const fechadas = currentCard.clues.filter((c, i) => !revealedOrder.some((x) => x.index === i)).map((c) => c.text);
    out.retratoSemResposta = !pub.includes(currentCard.answer) && !pub.includes(currentCard.id) && fechadas.every((t) => !pub.includes(t));
    // C.A.O.S. 4.2: a dica que o Mestre está lendo (pendente) só vai pra mesa depois do veredito; o Mestre vê
    out.retratoAbertas = JSON.parse(pub).carta.abertas.length === revealedOrder.length && revealedOrder.every((x) => x.index === pendingIndex ? !pub.includes(x.item.text) && JSON.stringify(mes).includes(x.item.text) : pub.includes(x.item.text));
    out.retratoMestre = mes.carta.resposta === currentCard.answer && mes.carta.id === currentCard.id && mes.revisao === partidaRevisao && JSON.parse(pub).revisao === partidaRevisao;
    out.retratoIds = mes.jogadores.every((j) => jogadorIdValido(j.id)) && mes.mestreId === players[mestreIndex].id;
    out.retratoSemCadastro = !/"idade"|"humor"|"ageBracket"/.test(pub);
    out.retratoTamanho = pub.length;
    // aviso de mudança chega a cada ação
    let avisos = 0;
    acoesAoMudar(() => avisos++);
    if (pendingIndex !== null) { toqueJogoUltimo = 0; markWrong(); fechar(); }
    out.avisou = avisos >= 1;
    // 4c) desfazer o último veredito (1.7.8.2)
    fechar();
    if (cardState === 'revealed' && pendingIndex === null) {
      const li = currentCard.clues.findIndex((c, i) => c.type === 'clue' && !revealedOrder.some((x) => x.index === i));
      if (li >= 0) chooseClue(li);
      fechar();
    }
    const semRelogio = (o) => { const c = JSON.parse(JSON.stringify(o)); delete c.revisao; delete c.relogio; return JSON.stringify(c); };
    const antesAcerto = semRelogio(retratoPartida('mestre'));
    const histAntes = history.length, deckAntes = deck.length, revAntesD = partidaRevisao;
    const caosAntes = JSON.stringify(caosExtraSalvar()), memAntes = JSON.stringify((caosCardMem && caosCardMem.porCarta || {})[currentCard.answer] || null), mlAntes = caosMatchLog.length;
    toqueJogoUltimo = 0;
    if (document.getElementById('correctBtn')) document.getElementById('correctBtn').click();
    await espera(30); fechar();
    out.ofereceuDesfazer = !!document.getElementById('desfazerBtn') && !!desfazerOferta && semRelogio(retratoPartida('mestre')) !== antesAcerto;
    // 1.7.9.4: o lobby do tabuleiro abre quando a próxima carta fica pronta, é só tela (não sobe a
    // revisão) e o Desfazer fecha ele
    for (let i = 0; i < 40 && !document.getElementById('tabLobby'); i++) { await espera(50); fechar(); }
    const revLobby = partidaRevisao;
    out.lobbyAbriu = !!document.getElementById('tabLobby') && cardState === 'hidden' && !!document.querySelector('#tabLobby #tabCaixaLobby .tb-pecas');
    // 1.7.9.6: abas Tabuleiro/Pontos(/Joias), abrindo na que decide a partida; trocar de aba não muda nada
    {
      const abas = [...document.querySelectorAll('#tabLobby .lb-aba')].map((b) => b.dataset.aba);
      const on = document.querySelector('#tabLobby .lb-aba.on');
      const pts = document.querySelector('#tabLobby .lb-aba[data-aba="pontos"]');
      if (pts) pts.click();
      const painelPts = document.querySelector('#tabLobby .lb-painel[data-aba="pontos"]');
      // 1.7.10.5.6 (pedido do JF): resumo da partida e aba Cartas com a carta que acabou de ser acertada
      const cp = cartasPartida[cartasPartida.length - 1];
      const pubL = retratoPartida('mesa');
      const abaC = document.querySelector('#tabLobby .lb-aba[data-aba="cartas"]');
      if (abaC) abaC.click();
      const painelC = document.querySelector('#tabLobby .lb-painel[data-aba="cartas"]');
      out.cartasPartida = !!cp && !!cp.quem && cp.dicaNum > 0 && !!cp.dicaTxt && cp.n === stats.totalDrawn - 1 && pubL.partida.historico.length === cartasPartida.length && pubL.partida.cartas === stats.totalDrawn && pubL.partida.acertos >= 1 && !!painelC && !painelC.hidden && painelC.textContent.includes(cp.resp) && !!document.querySelector('#tabLobby .pt-resumo') && partidaRevisao === revLobby;
      out.cartasN = cartasPartida.length;
      if (pts) pts.click();
      out.lobbyAbas = abas.includes('tabuleiro') && abas.includes('pontos') && abas.includes('joias') === gemsAwarded() && !!on && on.dataset.aba === lobbyAbaInicial() && !!painelPts && !painelPts.hidden && !!painelPts.querySelector('.lp-lista') && partidaRevisao === revLobby;
    }
    await espera(60);
    out.lobbySoTela = partidaRevisao === revLobby && !!document.getElementById('desfazerBtn') && +getComputedStyle(document.getElementById('tabLobby')).zIndex < +getComputedStyle(document.getElementById('desfazerBtn')).zIndex;
    // 1.7.9.9: o C.A.O.S. narra o Desfazer como VAR (calado, só o aviso simples)
    {
      const fFala = desfazerFalaVar({ tipo: 'acertou', nome: 'Acertou (Ana)', quem: 'Ana' });
      const silAntes = caosSilenced;
      caosSilenced = true;
      const fCalado = desfazerFalaVar({ tipo: 'errou', nome: 'Errou', quem: null });
      caosSilenced = silAntes;
      out.desfazerVar = (silAntes || /VAR|anulad/i.test(fFala)) && /Pode marcar de novo/.test(fFala) && fCalado === '↩️ Desfeito: Errou. Pode marcar de novo.';
    }
    document.getElementById('desfazerBtn') && document.getElementById('desfazerBtn').click();
    await espera(30); fechar();
    out.lobbyDesfeito = !document.getElementById('tabLobby');
    out.caosVoltou = JSON.stringify(caosExtraSalvar()) === caosAntes && JSON.stringify((caosCardMem && caosCardMem.porCarta || {})[currentCard.answer] || null) === memAntes && caosMatchLog.length === mlAntes;
    out.desfezIgual = semRelogio(retratoPartida('mestre')) === antesAcerto && history.length === histAntes && deck.length === deckAntes && cartasPartida.length === out.cartasN - 1;
    out.desfazerNoRegistro = partidaRevisao === revAntesD + 2 && acoesLog[acoesLog.length - 1].a === 'desfazer' && !document.getElementById('desfazerBtn');
    out.relogioVoltou = !!timerKind && !!timerEndAt;
    // outra jogada fecha a janela do desfazer
    toqueJogoUltimo = 0;
    if (document.getElementById('wrongBtn')) document.getElementById('wrongBtn').click();
    await espera(30); fechar();
    const tinha = !!desfazerOferta;
    const livre2 = currentCard.clues.findIndex((c, i) => !revealedOrder.some((x) => x.index === i));
    if (pendingIndex === null && livre2 >= 0) chooseClue(livre2);
    out.outraJogadaFecha = tinha && !desfazerOferta && !document.getElementById('desfazerBtn');
    fechar();
    // 4d) ids das dicas (1.7.8.4)
    const todosIds = ADULT_CARDS.flatMap((c) => c.clues.map((d) => d.id));
    out.dicasComId = todosIds.length === ADULT_CARDS.length * 20 && new Set(todosIds).size === todosIds.length && todosIds.every((x) => /^[A-Z]+-\d{4}-C\d{2}$/.test(x));
    const pubD = retratoPartida('mesa'), mesD = retratoPartida('mestre');
    out.clueIdSoMestre = pubD.carta.abertas.every((d) => d.clueId === undefined) && mesD.carta.abertas.every((d) => /-C\d{2}$/.test(d.clueId || ''));
    // texto da dica corrigido depois do save: a retomada acha a dica pelo id
    fechar();
    saveGameState();
    const abertaIdx = revealedOrder.length ? revealedOrder[0].index : 0;
    const dicaRaw = cardsByAnswer.get(currentCard.answer).clues.find((d) => d.id === currentCard.clues[abertaIdx].id);
    const textoVelho = dicaRaw.text;
    const nAbertas = revealedOrder.length;
    dicaRaw.text = textoVelho + ' (corrigida)';
    loadGameState();
    out.dicaPeloId = revealedOrder.length === nAbertas && currentCard.clues[abertaIdx].text === textoVelho + ' (corrigida)';
    dicaRaw.text = textoVelho;
    fechar();
    // 4e) falas como eventos com destino (1.7.8.4)
    caosFalarPara(players[0].id, '[C.A.O.S.] teste dirigido', true);
    const fDir = caosCanal[caosCanal.length - 1];
    if (activeToastState) closeActiveToast();
    showToastMessage('[C.A.O.S.] Mesa animada hoje.');
    const fMesa = caosCanal[caosCanal.length - 1];
    if (activeToastState) closeActiveToast();
    showToastMessage('[C.A.O.S.] Boa, ' + players[1].name + '.');
    const fNome = caosCanal[caosCanal.length - 1];
    if (activeToastState) closeActiveToast();
    out.falaExplicita = fDir && fDir.destino === 'explicito' && fDir.para[0].id === players[0].id && fDir.privado === true;
    out.falaMesa = fMesa && fMesa.destino === 'mesa' && fMesa.para[0].nome === 'mesa';
    out.falaNome = fNome && fNome.destino === 'nome' && fNome.para[0].id === players[1].id;
    const evs = caosCanal.map((x) => x.eventId);
    out.falaEvento = evs.every(Boolean) && new Set(evs).size === evs.length && fDir.matchId === matchId && typeof fDir.revisao === 'number';
    // 4f) 1.7.9: a porta confere as regras do motor, não só a tela
    fechar();
    const revPorta = partidaRevisao;
    out.semReembaralhar = dispatchAction({ type: 'reembaralharDicas' }).motivo === 'acao_desconhecida';
    // sem dica pendente (a carta sorteada às vezes deixa uma especial de mover aberta, e aí mover vale)
    const piMover = pendingIndex;
    pendingIndex = null;
    out.moverSemEspecial = dispatchAction({ type: 'moverJogador', data: [0, 5] }).motivo === 'fora_de_hora' && dispatchAction({ type: 'moverJogador', data: [responderIndex, 2] }).motivo === 'fora_de_hora' && dispatchAction({ type: 'moverEquipe', data: ['A', 2] }).motivo === 'fora_de_hora';
    pendingIndex = piMover;
    // cenário em que a tela mostra o Descartar (carta aberta, sem dica pendente, 0 descartes seguidos)
    const salvoD = { cs: cardState, pi: pendingIndex, cd: consecutiveDiscards };
    cardState = 'revealed'; pendingIndex = null; consecutiveDiscards = 0;
    const podiaDescartar = podeDescartarCarta();
    consecutiveDiscards = 2; // já descartou 2 seguidas: a tela esconde o botão, a porta tem que recusar
    out.descarteLimite = { podiaAntes: podiaDescartar, recusou: dispatchAction({ type: 'descartarCarta' }).motivo === 'fora_de_hora', reais: revealedOrder.filter((x) => x.item.type === 'clue').length };
    cardState = salvoD.cs; pendingIndex = salvoD.pi; consecutiveDiscards = salvoD.cd;
    out.portaSemEfeito = partidaRevisao === revPorta;
    // pausar e voltar sobem a revisão (o telão fica sabendo)
    const rp = partidaRevisao; pauseGame(); const r1 = partidaRevisao; resumeGame(); fechar();
    out.pausaRevisao = r1 === rp + 1 && partidaRevisao === rp + 2 && acoesLog.slice(-2).map((x) => x.a).join() === 'pausar,continuar';
    // comando repetido continua recusado depois de recarregar a partida
    const okp = dispatchAction({ type: 'pausar', commandId: 'teste-duravel-1' }); resumeGame(); fechar();
    saveGameState(); acoesComandosVistos = []; loadGameState(); fechar();
    const de = dispatchAction({ type: 'pausar', commandId: 'teste-duravel-1' });
    out.comandoDuravel = okp.ok === true && de.duplicado === true && acoesLog.some((x) => x.c === 'teste-duravel-1');
    if (pausedAt) { resumeGame(); fechar(); }
    // 5) save e retomada guardam revisão e registro
    tabFormaAtual();
    const formaSalva = tabForma;
    saveGameState();
    const revSalva = partidaRevisao, nSalvo = acoesLog.length;
    partidaRevisao = 0; acoesLog = [];
    loadGameState();
    out.salvou = partidaRevisao === revSalva && acoesLog.length === nSalvo;
    out.formaVoltou = !!formaSalva && tabForma === formaSalva;
    // a fala ganha o pedaço da sessão no eventId (recarregar não repete eventId)
    out.eventoSessao = caosCanal.length > 0 && caosCanal.every((x) => /:[a-z0-9]{1,6}:f\d+$/.test(x.eventId));
    // tirar jogador pelo ADM é uma ação registrada
    const ra = partidaRevisao, nP = players.length;
    const msgRem = admRemoverJogador(nP - 1);
    out.removerRegistra = players.length === nP - 1 ? partidaRevisao > ra && acoesLog[acoesLog.length - 1].a === 'admRemover' : 'não removeu: ' + msgRem;
    // 6) partida nova zera
    // 1.7.9.5: na partida o "toque pra ampliar" é só a lista (o desenho grande fica no lobby)
    abrirTabuleiroGrande();
    out.ampliarSemDesenho = !document.querySelector('#tabuleiroModal .tb-caixa') && !!document.querySelector('#tabuleiroModal .tg-list');
    document.getElementById('tabuleiroModal') && document.getElementById('tabuleiroModal').remove();
    // 1.7.9.5: Menos movimento é acessibilidade e não liga o Modo Batata (e o Batata não liga ele)
    {
      const batAntes = document.body.classList.contains('batata-mode'), calmoAntes = acessCfg.calmo;
      acessCfg.calmo = true; aplicarAcessibilidade();
      const calmoOk = movimentoReduzido() && !document.body.classList.contains('batata-mode') && visualFxAllowed() && document.documentElement.classList.contains('acess-calmo') && !tabAnimar();
      acessCfg.calmo = false; aplicarAcessibilidade();
      if (!batAntes) toggleBatataMode();
      const batOk = !acessCfg.calmo && !visualFxAllowed() && !tabAnimar() && !document.documentElement.classList.contains('acess-calmo');
      if (!batAntes) toggleBatataMode();
      acessCfg.calmo = calmoAntes; aplicarAcessibilidade();
      out.calmoSeparado = calmoOk && batOk;
    }
    // 1.7.10 (pedido do JF): nome repetido no cadastro destaca o nome já cadastrado e o C.A.O.S. comenta
    {
      const salvos = players, iniAntes = starterChosen;
      starterChosen = false;
      players = [{ id: 'j_rep001', name: 'Anne', score: 0, position: 0, color: PLAYER_COLORS[0], avatar: '😀', humor: 'normal', gems: {} }];
      renderScoreboard();
      const inp = document.getElementById('playerNameInput');
      inp.value = 'anne';
      cadRepetidoAt = 0; cadRepetidoN = 0;
      const n0 = players.length;
      addPlayer();
      const li = document.querySelector('#scoreboard li[data-i="0"]');
      const marcou = players.length === n0 && !!li && li.classList.contains('cad-repetido') && inp.classList.contains('cad-campo-erro');
      // o balão às vezes "pensa" antes (💭 ···): espera o texto aparecer
      let toast = null;
      for (let k = 0; k < 40 && !(toast && /Anne/.test(toast.textContent)); k++) { await espera(50); toast = document.getElementById('jfToast'); }
      out.nomeRepetido = marcou && !!toast && /Anne/.test(toast.textContent) && !document.querySelector('.caos-modal-ov');
      players = salvos; starterChosen = iniAntes; inp.value = ''; renderScoreboard();
    }
    // Travas ADM (pedido do JF): a pergunta abre; Sim trava o nick da Anne (reconhecida), Não desliga; respondida, não pergunta de novo
    {
      const antes = anneLigada();
      const clicar = (re) => [...document.querySelectorAll('#redeTravas button')].find((x) => re.test(x.textContent)).click();
      let seguiu = 0;
      redeTravasPerguntar(() => seguiu++, true);
      const abriu = !!document.getElementById('redeTravas') && /Travas ADM/.test(document.getElementById('redeTravas').textContent);
      clicar(/Sim/);
      const sim = anneLigada() === true && isAnneName('Anne') && seguiu === 1;
      redeTravasPerguntar(() => seguiu++);
      const naoRepete = !document.getElementById('redeTravas') && seguiu === 2;
      redeTravasPerguntar(() => seguiu++, true);
      clicar(/Não/);
      const nao = anneLigada() === false && !isAnneName('Anne') && seguiu === 3;
      out.travasAdm = abriu && sim && naoRepete && nao;
      anneLigar(antes);
    }
    // Pedido do JF: no cadastro, a pergunta da voz. Voz já ligada = não pergunta; Sim liga; Não = fala triste, voz desligada
    {
      const vozAntes = caosVoiceOn, falou = [];
      const toggleOrig = toggleVoice;
      toggleVoice = () => { caosVoiceOn = !caosVoiceOn; };
      let seguiu = 0;
      caosVoiceOn = true; vozPerguntada = false;
      vozPerguntar(() => seguiu++);
      const ligadaPula = !document.getElementById('vozPergunta') && seguiu === 1;
      caosVoiceOn = false; vozPerguntada = false;
      vozPerguntar(() => seguiu++);
      const abriu = !!document.getElementById('vozPergunta') && /Voz do C\.A\.O\.S\./.test(document.getElementById('vozPergunta').textContent);
      [...document.querySelectorAll('#vozPergunta button')].find((x) => /Ligar/.test(x.textContent)).click();
      const sim = caosVoiceOn === true && seguiu === 2;
      caosVoiceOn = false; vozPerguntada = false;
      vozPerguntar(() => seguiu++, (t) => falou.push(t));
      [...document.querySelectorAll('#vozPergunta button')].find((x) => /Não/.test(x.textContent)).click();
      const nao = caosVoiceOn === false && seguiu === 3 && falou.length === 1 && typeof falou[0] === "string" && falou[0].length > 10;
      vozPerguntar(() => seguiu++);
      const umaVez = !document.getElementById('vozPergunta') && seguiu === 4;
      toggleVoice = toggleOrig; caosVoiceOn = vozAntes;
      out.vozPergunta = ligadaPula && abriu && sim && nao && umaVez;
    }
    // C.A.O.S. 4.2 (partida online de 4: "insuportável"): comentário respeita intervalo; aviso de regra passa;
    // no online, Alt-Tab não pausa e pular fala não marca ninguém; categoria apresentada volta no save
    {
      const ultAntes = caosUltimaFalaAt, fimAntes = caosFalaFimAt;
      if (activeToastState) closeActiveToast();
      caosUltimaFalaAt = Date.now();
      const cortaInicio = caosToastBloquear() === true;
      // C.A.O.S. 4.3: o respiro conta de quando a fala anterior TERMINOU
      caosUltimaFalaAt = Date.now() - 3e4; caosFalaFimAt = Date.now();
      const cortaRespiro = caosToastBloquear() === true;
      caosFalaFimAt = Date.now() - 2e4; caosFalaCartaN = 0; caosFalasRecentes = [];
      const respirouPassa = caosToastBloquear() === false;
      const cortaComentario = cortaInicio && cortaRespiro && respirouPassa && CAOS_FALAS_POR_CARTA >= 5;
      caosFalaFimAt = fimAntes;
      caosFalaEssencial = true;
      const regraPassa = caosToastBloquear() === false;
      caosFalaEssencial = false;
      caosUltimaFalaAt = ultAntes;
      caosFalaFimAt = fimAntes;
      const redeAntes = typeof rede !== 'undefined' ? rede : null;
      rede = { papel: 'host' };
      const pausou0 = !!pausedAt;
      autoPauseGame();
      const naoPausa = !!pausedAt === pausou0 && salaOnlineAberta();
      const marcAntes = JSON.stringify(caosMarked), cortesAntes = JSON.stringify(caosCortes);
      caosRegistrarCorte();
      const naoMarca = JSON.stringify(caosMarked) === marcAntes;
      caosCortes = JSON.parse(cortesAntes);
      rede = redeAntes;
      caosEasterEggsUsed.add('primeira_cat_LUGAR');
      saveGameState();
      const salvo = JSON.parse(JFStore.getItem('perfil200_state') || '{}');
      const guardou = Array.isArray(salvo.caosUmaVez) && salvo.caosUmaVez.includes('primeira_cat_LUGAR');
      out.caos42 = cortaComentario && regraPassa && naoPausa && naoMarca && guardou;
      out.caos42diag = JSON.stringify({ cortaComentario, regraPassa, naoPausa, naoMarca, guardou });
    }
    // C.A.O.S. 4.3 · ouvintes da sala: pular marca quem pulou (aparelho do host / celular); todos calaram =
    // quieto (regra passa); só parte calou = ciúmes (quem calou marcado, quem ouve fica no suave)
    {
      const redeAntes = typeof rede !== 'undefined' ? rede : null;
      const cortesAntes = JSON.stringify(caosCortes), marcAntes = JSON.stringify(caosMarked), ouvAntes = JSON.stringify(caosOuvintes), estAntes = caosOuvintesEstado;
      const agendarOrig = caosFalaAgendar, falas = [];
      caosFalaAgendar = (fn, ms, prio) => falas.push({ t: fn(), prio });
      const jogAntes = players, iniAntes3 = starterChosen, fimJogo3 = gameEnded, mestreAntes3 = mestreIndex;
      players = ['Ana', 'Beto', 'Caio'].map((n, i) => ({ id: jogadorIdNovo(), name: n, score: 0, position: 0, color: PLAYER_COLORS[i], avatar: '😀', humor: 'normal', gems: {} }));
      starterChosen = true; gameEnded = false; mestreIndex = 2;
      const [a, b2, c] = players;
      rede = { papel: 'host', hostEu: a.id, hostJunto: [], assentos: {} };
      caosCortes = { total: 0, por: {}, rancor: {} };
      caosOuvintes = {}; caosOuvintesEstado = 'normal';
      caosRegistrarCorte();
      const pulouHost = caosCortes.por[a.name] === 1 && caosMarked.idx === 0;
      redeHostSinal(b2.id, { tipo: 'pulou' });
      redeHostSinal(b2.id, { tipo: 'pulou' }); // toque duplo conta uma vez
      const pulouCelular = caosCortes.por[b2.name] === 1 && caosMarked.idx === 1 && !caosCortes.por[players[mestreIndex].name + '_x'];
      caosOuvinteVoz([a.id], true); redeHostSinal(b2.id, { tipo: 'voz', ligada: true }); caosOuvinteVoz([c.id], true);
      const normal = caosOuvintesEstado === 'normal';
      redeHostSinal(b2.id, { tipo: 'voz', ligada: false });
      const ciumes = caosOuvintesEstado === 'ciumes' && caosFiel(a) && !caosFiel(b2) && playerHumor(a) === 'suave' && caosCortes.rancor[b2.name] === true && falas.some((f) => f.t.includes(b2.name) && f.t.includes(a.name) || f.t.includes(b2.name) && f.t.includes(c.name));
      caosOuvinteVoz([a.id], false); caosOuvinteVoz([c.id], false);
      const fimAntes2 = caosFalaFimAt, iniAntes2 = caosUltimaFalaAt;
      caosFalaFimAt = 0; caosUltimaFalaAt = 0; caosFalaCartaN = 0; caosFalasRecentes = [];
      const calada = caosSalaCalada() && caosToastBloquear() === true && falas.some((f) => f.prio === 'regra' && /calou|calad|ninguém quer|desligou/i.test(f.t));
      caosFalaEssencial = true; const regraPassa = caosToastBloquear() === false; caosFalaEssencial = false;
      caosOuvinteVoz([c.id], true);
      const voltou = caosOuvintesEstado === 'ciumes' && !caosSalaCalada() && falas.some((f) => f.t.includes(c.name) && /de novo|voltei|saudade/i.test(f.t));
      caosFalaFimAt = fimAntes2; caosUltimaFalaAt = iniAntes2;
      caosFalaAgendar = agendarOrig;
      caosCortes = JSON.parse(cortesAntes); caosMarked = JSON.parse(marcAntes); caosOuvintes = JSON.parse(ouvAntes); caosOuvintesEstado = estAntes;
      rede = redeAntes;
      players = jogAntes; starterChosen = iniAntes3; gameEnded = fimJogo3; mestreIndex = mestreAntes3;
      out.caos43 = pulouHost && pulouCelular && normal && ciumes && calada && regraPassa && voltou;
      out.caos43diag = JSON.stringify({ pulouHost, pulouCelular, normal, ciumes, calada, regraPassa, voltou });
    }
    // 1.7.10.5 · Palpitar agora (quem tem a ficha rouba a tentativa no próprio aparelho) e pedido de dica pelo aparelho
    {
      const redeAntes = typeof rede !== 'undefined' ? rede : null;
      const jogAntes = players, iniAntes = starterChosen, fimAntes = gameEnded, mAntes = mestreIndex, rAntes = responderIndex;
      const cartaAntes = currentCard, estAntes = cardState, pendAntes = pendingIndex, revAntes = revealedOrder, holdAntes = { ...palpiteHolders }, stockAntes = palpiteStock, modoAntes = CURRENT_MODE, fmtAntes = CURRENT_FORMAT;
      CURRENT_FORMAT = 'versus';
      players = ['Ana', 'Beto', 'Caio', 'Duda'].map((n, i) => ({ id: jogadorIdNovo(), name: n, score: 0, position: 0, color: PLAYER_COLORS[i], avatar: '😀', humor: 'normal', gems: {} }));
      const [a, b2, c, d] = players;
      starterChosen = true; gameEnded = false; mestreIndex = 0; responderIndex = 1;
      currentCard = { answer: 'Teste', category: 'COISA', clues: Array.from({ length: 10 }, (_, i) => ({ type: 'clue', text: 'dica ' + (i + 1) })) };
      cardState = 'revealed'; revealedOrder = []; pendingIndex = null; cartaSeq++;
      rede = { papel: 'host', hostEu: a.id, hostJunto: [], assentos: { [b2.id]: { visto: Date.now(), sessao: 's_b' }, [c.id]: { visto: Date.now(), sessao: 's_c' }, [d.id]: { visto: Date.now(), sessao: 's_d' } } };
      // pedido de dica: Beto (na vez) pede a 7 no celular dele; o Mestre vê "Abrir a dica 7"
      const opsBeto = redeOpcoes(b2.id);
      const temNumeros = opsBeto.filter((o) => o.a === 'pedirDica').length === 10;
      const naoDeOutro = !redePodeComandar('pedirDica', c.id, [6]) && redePodeComandar('pedirDica', b2.id, [6]);
      const rPed = dispatchAction({ type: 'pedirDica', data: [6], actorId: b2.id });
      // 1.7.10.5.3: trava da dica (Beto em outro aparelho): o Mestre só abre a pedida; forçar passa
      const trava = rPed.ok && dicaTravada() && dispatchAction({ type: 'escolherDica', data: [3], actorId: a.id }).ok === false && dicaPodeAbrir(3, true) && dicaPodeAbrir(6);
      const opsMestre = redeOpcoes(a.id);
      const pedido = !!opsMestre.find((o) => o.a === 'escolherDica' && o.d[0] === 6 && /pedida por/.test(o.t)) && retratoPartida('mesa').pedidoDica.pos === 6 && pendingIndex === null;
      chooseClue(6);
      if (activeToastState) closeActiveToast();
      const pedidoSome = !pedidoDicaAtual() && retratoPartida('mesa').pedidoDica === null;
      // Palpitar agora: Caio tem a ficha; vê o botão no aparelho dele; Duda (sem ficha) não vê
      palpiteHolders = { [c.id]: 1 }; palpiteStock = 4;
      const caioVe = !!redeOpcoes(c.id).find((o) => o.a === 'palpitarAgora');
      const dudaNao = !redeOpcoes(d.id).find((o) => o.a === 'palpitarAgora') && !redePodeComandar('palpitarAgora', d.id, [c.id]);
      const mestreSemFicha = !redeOpcoes(a.id).some((o) => o.a === 'palpiteAcertou');
      dispatchAction({ type: 'palpitarAgora', data: [c.id], actorId: c.id });
      if (activeToastState) closeActiveToast();
      const om = redeOpcoes(a.id);
      const julgaCaio = om.some((o) => o.a === 'palpiteAcertou' && o.d[0] === c.id) && !om.some((o) => o.a === 'acertou') && retratoPartida('mesa').palpiteVez === c.id;
      const umPorVez = !redeOpcoes(c.id).find((o) => o.a === 'palpitarAgora');
      const pendDepois = pendingIndex;
      dispatchAction({ type: 'palpiteErrou', data: [c.id], actorId: a.id });
      if (activeToastState) closeActiveToast();
      const errouSegue = !palpiteHolders[c.id] && palpiteStock === 5 && pendingIndex === pendDepois && responderIndex === 1 && !palpiteVezAtual() && redeOpcoes(a.id).some((o) => o.a === 'acertou');
      // C.A.O.S. 4.4.1 (relato do JF): tocar na dica aberta faz ele responder mesmo no respiro; falando, o toque não gasta
      pendingIndex = null; if (activeToastState) closeActiveToast();
      // (sem a sala: com o Beto em outro aparelho, a fala que chama ele pelo nome vai só pro celular dele)
      rede = redeAntes;
      const silRep = caosSilenced; caosSilenced = false;
      caosRepetidaAt = 0; caosRepetidaN = 0; caosFalaFimAt = Date.now(); caosUltimaFalaAt = Date.now();
      caosDicaRepetida(6);
      const respondeu = !!activeToastState && caosRepetidaN === 1;
      caosRepetidaAt = 0; caosDicaRepetida(6);
      const naoGasta = caosRepetidaN === 1;
      if (activeToastState) closeActiveToast();
      caosSilenced = silRep;
      out.dicaRepetida = respondeu && naoGasta; out.dicaRepetidaDiag = JSON.stringify({ respondeu, naoGasta, n: caosRepetidaN });
      rede = redeAntes;
      players = jogAntes; starterChosen = iniAntes; gameEnded = fimAntes; mestreIndex = mAntes; responderIndex = rAntes;
      currentCard = cartaAntes; cardState = estAntes; pendingIndex = pendAntes; revealedOrder = revAntes; palpiteHolders = holdAntes; palpiteStock = stockAntes; CURRENT_MODE = modoAntes; CURRENT_FORMAT = fmtAntes;
      palpiteVez = null; pedidoDica = null;
      out.palpiteAgora = trava && temNumeros && naoDeOutro && pedido && pedidoSome && caioVe && dudaNao && mestreSemFicha && julgaCaio && umPorVez && errouSegue;
      out.palpiteAgoraDiag = JSON.stringify({ trava, temNumeros, naoDeOutro, pedido, pedidoSome, caioVe, dudaNao, mestreSemFicha, julgaCaio, umPorVez, errouSegue });
    }
    // Easter egg: piadas internas (limite por partida, intervalo, nunca no Júnior), Dragons só com o JF + turma,
    // falas da mesa toda (sem vocativo) e cores de presente fora da paleta
    {
      const jogAntes = players, iniAntes = starterChosen, fimAntes = gameEnded, modoAntes = CURRENT_MODE, silAntes = caosSilenced, statsAntes = stats.totalDrawn, randAntes = Math.random;
      const agendarOrig = caosFalaAgendar, ditas = [];
      caosFalaAgendar = (fn) => ditas.push(fn());
      const mk = (n, i) => ({ id: jogadorIdNovo(), name: n, score: 0, position: 0, color: PLAYER_COLORS[i], avatar: '😀', humor: 'normal', gems: {} });
      starterChosen = true; gameEnded = false; caosSilenced = false; CURRENT_MODE = 'classico';
      players = ['Carro Pika', 'Ana'].map(mk);
      caosAmigosZerar();
      let n = 0;
      for (let c = 1; c <= 40; c++) { stats.totalDrawn = c; if (caosAmigoFala(players[0], 'vez')) n++; }
      const limite = n === CAOS_AMIGOS_MAX;
      caosAmigosZerar(); stats.totalDrawn = 5;
      const a1 = !!caosAmigoFala(players[0], 'vez'), a2 = !caosAmigoFala(players[0], 'erro');
      const intervalo = a1 && a2;
      caosAmigosZerar(); CURRENT_MODE = 'junior'; stats.totalDrawn = 9;
      const semJunior = !caosAmigoFala(players[0], 'vez'); CURRENT_MODE = 'classico';
      // sobrinhos do JF: reconhecidos pelo nick, valem no Júnior, e não confundem com nome parecido
      const sobrReconhece = sobrinhoDe('Pedrinho the Best') === 'pedro' && sobrinhoDe('Bebel LindAAA') === 'isabel' && sobrinhoDe('Isabel') === 'isabel' && sobrinhoDe('elisinha auruda') === 'elisa' && !sobrinhoDe('Pedro') && !sobrinhoDe('Pedrinho') && !sobrinhoDe('Elisa') && !sobrinhoDe('Isabela');
      players = ['Pedrinho the Best', 'Ana'].map(mk); caosAmigosZerar(); CURRENT_MODE = 'junior'; stats.totalDrawn = 9;
      const sobrJunior = !!caosAmigoFala(players[0], 'vez'); CURRENT_MODE = 'classico';
      // dose por sobrinho: o Pedro leva até o limite dos amigos, a Isabel (suave) no máximo 3
      caosAmigosZerar(); let np = 0;
      for (let c = 1; c <= 40; c++) { stats.totalDrawn = c; if (caosAmigoFala(players[0], 'vez')) np++; }
      const bebel = mk('Bebel LindAAA', 2); caosAmigosZerar(); let ni = 0;
      for (let c = 1; c <= 40; c++) { stats.totalDrawn = c; if (caosAmigoFala(bebel, 'vez')) ni++; }
      const sobrDose = np === CAOS_AMIGOS_MAX && ni === 3;
      const sobrinhos = sobrReconhece && sobrJunior && sobrDose;
      Math.random = () => 0.01;
      players = ['Ana', 'Vitinho'].map(mk); caosAmigosZerar(); stats.totalDrawn = 6; ditas.length = 0;
      const semJf = !caosDragonsNaCarta();
      players = ['JF', 'Vitinho', 'BsLordRafa', 'Typingg'].map(mk); caosAmigosZerar(); stats.totalDrawn = 6;
      const comJf = caosDragonsNaCarta() && ditas.length === 1 && /JF/.test(ditas[0]);
      Math.random = randAntes;
      // nenhuma piada é vocativa (fala da mesa toda, não particular)
      const nomes = { henrique: 'Carro Pika', rafa: 'BsLordRafa', vitinho: 'Vitinho', typingg: 'Typingg' };
      const todas = [];
      Object.keys(REACTIVE_VOICE.amigos).forEach((id) => Object.values(REACTIVE_VOICE.amigos[id]).forEach((l) => l.forEach((x) => todas.push([typeof x === 'function' ? x(nomes[id]) : x.replace(/\{nome\}/g, nomes[id]), nomes[id]]))));
      const nomesSobr = { pedro: 'Pedrinho the Best', isabel: 'Bebel LindAAA', elisa: 'elisinha auruda' };
      Object.keys(REACTIVE_VOICE.sobrinhos).forEach((id) => Object.values(REACTIVE_VOICE.sobrinhos[id]).forEach((l) => l.forEach((x) => todas.push([typeof x === 'function' ? x(nomesSobr[id]) : x.replace(/\{nome\}/g, nomesSobr[id]), nomesSobr[id]]))));
      REACTIVE_VOICE.dragons.um.forEach((x) => todas.push([typeof x === 'function' ? x('Vitinho') : x.replace(/\{nome\}/g, 'Vitinho'), 'Vitinho']));
      const vocativas = todas.filter(([t, nm]) => redeFalaComQuem({ texto: t.replace(/^\[C\.A\.O\.S\.\]\s*/, ''), para: [{ id: 'x', nome: nm }] }));
      const daMesa = vocativas.length === 0;
      const foraDaPaleta = !coresDaPaleta().some((c) => PRESENTES.some((p) => p.cor === c)) && sanitizePlayerColor('Typingg_KK', '#ff0000') === 'GRAD_KIRITO';
      caosFalaAgendar = agendarOrig; Math.random = randAntes;
      players = jogAntes; starterChosen = iniAntes; gameEnded = fimAntes; CURRENT_MODE = modoAntes; caosSilenced = silAntes; stats.totalDrawn = statsAntes;
      caosAmigosZerar();
      out.amigos = limite && intervalo && semJunior && semJf && comJf && daMesa && foraDaPaleta && sobrinhos;
      out.amigosDiag = JSON.stringify({ sobrReconhece, sobrJunior, sobrDose, np, ni, limite, n, intervalo, semJunior, semJf, comJf, daMesa, vocativas: vocativas.map((v) => v[0]).slice(0, 3), foraDaPaleta });
    }
    // C.A.O.S. 4.7 · Tato: a mesa pula frase longa -> ele passa a preferir curtas; famílias de nicho 1x por partida
    {
      const modoAntes = CURRENT_MODE, iniAntes = starterChosen, fimAntes = gameEnded, pickAntes = caosLastPick, randAntes = Math.random;
      const memAntes = JFStore.getItem(CAOS_TATO_KEY); JFStore.removeItem(CAOS_TATO_KEY);
      CURRENT_MODE = 'classico'; starterChosen = true; gameEnded = false; caosTatoZerar();
      const longa = '[C.A.O.S.] ' + 'Essa é uma fala bem comprida, cheia de voltas, que ninguém consegue acompanhar quando a mesa está com mil coisas acontecendo ao mesmo tempo.';
      const curta = '[C.A.O.S.] Então tá, né? Eu esperava mais.';
      const comecaNormal = !caosTato.curto && caosTatoMax() === CAOS_TATO_NORMAL;
      caosTatoReacao(longa); const umaNaoBasta = !caosTato.curto;
      caosTatoReacao(longa); caosTatoReacao(curta);
      const aprendeu = caosTato.curto && caosTatoMax() === CAOS_TATO_LONGA;
      // com a lista tendo opção curta, sai a curta (sem apagar a longa da lista)
      const lista = [longa.replace('[C.A.O.S.] ', ''), curta.replace('[C.A.O.S.] ', '')];
      let curtas = 0;
      for (let i = 0; i < 40; i++) { const t = getRandomReaction(lista); if (caosTatoTam(t) < CAOS_TATO_LONGA) curtas++; }
      const prefereCurta = curtas >= 36;
      // calar a voz logo depois de uma fala longa também ensina
      caosTatoZerar(); caosLastPick = { text: longa, at: Date.now() }; caosTatoCalou(); caosLastPick = { text: longa, at: Date.now() }; caosTatoCalou();
      const calarEnsina = caosTato.curto;
      caosLastPick = { text: longa, at: Date.now() - 6e4 }; caosTatoZerar(); caosTatoCalou(); caosTatoCalou();
      const calarVelhoNao = !caosTato.curto;
      // família de nicho: uma vez por partida
      caosTatoZerar();
      const nichoLivre = caosFamiliaLiberada('narradorEsportivo') && caosFamiliaLiberada('distraido');
      caosFamiliaUsou('narradorEsportivo'); caosFamiliaUsou('distraido');
      const nichoTrava = !caosFamiliaLiberada('narradorEsportivo') && caosFamiliaLiberada('distraido');
      JFStore.removeItem(CAOS_TATO_KEY); caosTatoZerar();
      CURRENT_MODE = 'caos'; caosTatoMax(); caosTato.testes = CAOS_TATO_TESTES; const caosModoEncurta = caosTatoMax() === CAOS_TATO_MESA_CANSADA;
      // C.A.O.S. 4.8 · memória da mesa: mesma mesa começa sabendo; mesa nova testa e depois vai pelo jeito da mesa
      const jogAntes = players;
      const mkp = (n) => ({ id: 'x' + n, name: n, score: 0, humor: 'normal' });
      JFStore.removeItem(CAOS_TATO_KEY); CURRENT_MODE = 'classico';
      players = ['Ana', 'Beto', 'Caio'].map(mkp); caosTatoZerar();
      caosTatoReacao(longa); caosTatoReacao(longa);
      players = ['Caio', 'Ana', 'Beto'].map(mkp); caosTatoZerar();
      const mesmaMesaLembra = caosTatoMax() === CAOS_TATO_LONGA && caosTato.conhecida;
      players = ['Duda', 'Eva'].map(mkp); caosTatoZerar();
      const novaTesta = caosTatoMax() === CAOS_TATO_NORMAL && !caosTato.conhecida;
      caosTatoFalou(longa); caosTato.pend.at -= 25e3; caosTatoFalou(longa); caosTato.pend.at -= 25e3; caosTatoConferir();
      const gostaDeLonga = caosTato.gosta && caosTatoMax() === CAOS_TATO_NORMAL;
      players = ['Duda', 'Eva'].map(mkp); caosTatoZerar();
      const lembraQueGosta = caosTato.sig === null && caosTatoMax() === CAOS_TATO_NORMAL && caosTato.gosta && caosTato.conhecida;
      const perfil = (modo) => { CURRENT_MODE = modo; players = ['Fê', 'Gui'].map(mkp); caosTatoZerar(); caosTatoMax(); caosTato.testes = CAOS_TATO_TESTES; return caosTatoMax(); };
      const jeitoDaMesa = perfil('junior') === CAOS_TATO_LONGA && perfil('hardcore') === CAOS_TATO_MESA_CANSADA && perfil('classico') === CAOS_TATO_NORMAL;
      // mesa nova intercala os testes: depois de uma longa de teste, as próximas 2 vão pelo jeito da mesa
      CURRENT_MODE = 'junior'; players = ['Hugo', 'Iara'].map(mkp); caosTatoZerar();
      const t0 = caosTatoMax(); caosTatoFalou(longa); const t1 = caosTatoMax(); caosTatoFalou(curta); const t2 = caosTatoMax(); caosTatoFalou(curta); const t3 = caosTatoMax();
      const intercala = t0 === CAOS_TATO_NORMAL && t1 === CAOS_TATO_LONGA && t2 === CAOS_TATO_LONGA && t3 === CAOS_TATO_NORMAL;
      CURRENT_MODE = 'classico';
      // datas de verdade na memória (C.A.O.S. 4.9)
      const ag = new Date(2026, 9, 24, 15).getTime(), dd = (y, m, d) => new Date(y, m, d, 20).getTime();
      const datas = memQuandoData(dd(2026, 9, 24), ag) === 'hoje mais cedo' && memQuandoData(dd(2026, 9, 23), ag) === 'ontem' && memQuandoData(dd(2026, 9, 22), ag) === 'anteontem' &&
        memQuandoData(dd(2026, 9, 20), ag) === 'na terça' && memQuandoData(dd(2026, 9, 17), ag) === 'semana passada, no dia 17' &&
        memQuandoData(dd(2026, 8, 20), ag) === 'no dia 20 de setembro' && memQuandoData(dd(2025, 9, 1), ag) === 'no dia 1 de outubro do ano passado';
      players = jogAntes; if (memAntes == null) JFStore.removeItem(CAOS_TATO_KEY); else JFStore.setItem(CAOS_TATO_KEY, memAntes);
      const memoria = mesmaMesaLembra && novaTesta && gostaDeLonga && lembraQueGosta && jeitoDaMesa && intercala && datas;
      CURRENT_MODE = modoAntes; starterChosen = iniAntes; gameEnded = fimAntes; caosLastPick = pickAntes; Math.random = randAntes; caosTatoZerar();
      out.tato = comecaNormal && umaNaoBasta && aprendeu && prefereCurta && calarEnsina && calarVelhoNao && nichoLivre && nichoTrava && caosModoEncurta && memoria;
      out.tatoDiag = JSON.stringify({ intercala, datas, mesmaMesaLembra, novaTesta, gostaDeLonga, lembraQueGosta, jeitoDaMesa, comecaNormal, umaNaoBasta, aprendeu, prefereCurta, curtas, calarEnsina, calarVelhoNao, nichoLivre, nichoTrava, caosModoEncurta });
    }
    // relato do JF: o tempo de criar o cadastro contou como "demorou pra escolher o nick" e ele cumprimentou o JF
    // como um estranho. Quem ele conhece é reconhecido antes da piada do nick demorado.
    {
      const jogAntes = players, toastAntes = window.showToastMessage, randAntes = Math.random, silAntes = caosSilenced;
      let dito = '';
      window.showToastMessage = (t) => (dito = String(t || ''));
      Math.random = () => 0;
      caosSilenced = false;
      const jf = { id: 'jfx', name: 'JF', avatar: '😎', score: 0, humor: 'normal', nickMs: 70e3 };
      players = [jf];
      caosWelcomePlayer(jf);
      const estranho = { id: 'zzx', name: 'Zuleica', avatar: '😀', score: 0, humor: 'normal', nickMs: 70e3 };
      players = [estranho];
      let ditoEstranho = '';
      window.showToastMessage = (t) => (ditoEstranho = String(t || ''));
      caosWelcomePlayer(estranho);
      window.showToastMessage = toastAntes; Math.random = randAntes; caosSilenced = silAntes; players = jogAntes;
      out.reconheceAntes = !!dito && !/1 minuto/.test(dito) && /1 minuto/.test(ditoEstranho);
      out.reconheceAntesDiag = JSON.stringify({ dito, ditoEstranho });
    }
    // 25/10/2026 (pedido do JF): ele lembra o emoji de cada um e comenta quando troca
    {
      const jogAntes = players, toastAntes = window.showToastMessage, randAntes = Math.random, silAntes = caosSilenced, fichasAntes = JFStore.getItem(MEM_FICHAS_KEY);
      const T = REACTIVE_VOICE.memoria.trocouEmoji, n = 'Teodorico';
      const doBanco = (bank, txt, a, b) => !!txt && bank.some((f) => txt.includes(typeof f === 'function' ? f(n, a, b) : f));
      const mk = (av) => ({ id: 'tdx', name: n, avatar: av, score: 0, humor: 'normal' });
      fichaUpd(n, (f) => { f.ultimoAvatar = '💀'; f.partidas = 2; });
      const p1 = mk('🍦'); players = [p1]; caosMemCadastro(p1);
      const calmo = caosTrocouEmoji(p1), salvou = fichaGet(n).ultimoAvatar === '🍦';
      const p2 = mk('💀'); players = [p2]; caosMemCadastro(p2);
      const bravo = caosTrocouEmoji(p2);
      const p3 = mk('💀'); players = [p3]; caosMemCadastro(p3);
      const igual = caosTrocouEmoji(p3);
      const p4 = mk('👑'); players = [p4]; caosMemCadastro(p4);
      const coroa = caosTrocouEmoji(p4);
      let dito = '';
      window.showToastMessage = (t) => (dito = String(t || ''));
      Math.random = () => 0; caosSilenced = false;
      const p5 = mk('🐶'); players = [p5]; caosMemCadastro(p5); caosWelcomePlayer(p5);
      window.showToastMessage = toastAntes; Math.random = randAntes; caosSilenced = silAntes; players = jogAntes;
      if (fichasAntes == null) JFStore.removeItem(MEM_FICHAS_KEY); else JFStore.setItem(MEM_FICHAS_KEY, fichasAntes);
      out.trocouEmoji = !!calmo && salvou && doBanco(T.sombrioParaFofo, calmo, '💀', '🍦') && doBanco(T.fofoParaSombrio, bravo, '🍦', '💀') &&
        igual === null && doBanco(T.paraConfiante, coroa, '💀', '👑') && doBanco(T.deConfiante, dito, '👑', '🐶');
      out.trocouEmojiDiag = JSON.stringify({ calmo, salvou, bravo, igual, coroa, dito });
    }
    // 25/10/2026 (pedido do JF): ele lembra o humor de cada um e zoa quem troca (ou troca toda hora)
    {
      const jogAntes = players, randAntes = Math.random, fichasAntes = JFStore.getItem(MEM_FICHAS_KEY), modoAntes = CURRENT_MODE;
      CURRENT_MODE = 'classico';
      const T = REACTIVE_VOICE.memoria.trocouHumor, n = 'Genoveva';
      // includes: às vezes ele decora a fala com um emoji no fim
      const doBanco = (bank, txt, ...a) => !!txt && bank.some((f) => txt.includes(typeof f === 'function' ? f(n, ...a) : f));
      const mk = (h, extra) => ({ id: 'gnx', name: n, avatar: '🦊', score: 0, humor: h, ...(extra || {}) });
      const cad = (p) => { players = [p]; caosMemCadastro(p); return p; };
      Math.random = () => 0.9;
      fichaUpd(n, (f) => { f.ultimoHumor = 'suave'; f.trocasHumor = 0; f.partidas = 1; });
      const subiu = caosTrocouHumor(cad(mk('acido')));
      const desceu = caosTrocouHumor(cad(mk('suave')));
      const contou = fichaGet(n).trocasHumor === 2;
      const igual = caosTrocouHumor(cad(mk('suave')));
      const praCaos = caosTrocouHumor(cad(mk('normal', { humorCaos: true })));
      Math.random = () => 0;
      const indeciso = caosTrocouHumor(cad(mk('normal')));
      const q = mk('normal'); players = [q]; q.humor = 'acido'; caosMemHumorMudou(q);
      const meioDaPartida = fichaGet(n).ultimoHumor === 'acido' && fichaGet(n).trocasHumor === 5;
      // ele lembra o que sorteou: sorteou Ácido e a pessoa voltou de Suave (pesado demais); sorteou Suave e voltou de Nível 0
      Math.random = () => 0.9;
      const sorteou = cad(mk('acido', { humorCaos: true }));
      const guardou = fichaGet(n).ultimoSorteado === 'acido' && fichaGet(n).ultimoHumor === 'caos';
      fichaUpd(n, (f) => (f.trocasHumor = 0));
      Math.random = () => 0.1;
      const pesado = caosTrocouHumor(cad(mk('suave')));
      fichaUpd(n, (f) => { f.ultimoHumor = 'caos'; f.ultimoSorteado = 'suave'; f.trocasHumor = 0; });
      const leve = caosTrocouHumor(cad(mk('zero')));
      // o "log" do jogador nas boas-vindas: recorde pessoal e tempo médio
      const M = REACTIVE_VOICE.memoria, pr = mk('normal');
      pr._fichaAntes = fichaLimpa({ partidas: 3, melhorPts: 42, msSum: 6 * 1e4, msN: 6 }, n);
      const ops = new Set();
      for (const r of [0.1, 0.9]) { Math.random = () => r; const o = caosMemBoasVindas(pr, 3); ops.add(o && o.bank); }
      const logDoJogador = ops.has(M.recordePessoal) && ops.has(M.tempoMedio.rapido);
      const lembraSorteio = logDoJogador && guardou && doBanco(T.sorteioPesado, pesado, 'Ácido', 'Suave') && doBanco(T.sorteioLeve, leve, 'Suave', 'Nível 0');
      Math.random = randAntes; players = jogAntes; CURRENT_MODE = modoAntes;
      if (fichasAntes == null) JFStore.removeItem(MEM_FICHAS_KEY); else JFStore.setItem(MEM_FICHAS_KEY, fichasAntes);
      out.trocouHumor = doBanco(T.subiu, subiu, 'Suave', 'Ácido') && doBanco(T.desceu, desceu, 'Ácido', 'Suave') && contou && igual === null &&
        doBanco(T.paraCaos, praCaos, 'Suave') && doBanco(T.indeciso, indeciso, 'o C.A.O.S.', 'Normal', 4) && meioDaPartida && lembraSorteio;
      out.trocouHumorDiag = JSON.stringify({ logDoJogador: ops.size, lembraSorteio, guardou, pesado, leve, subiu, desceu, contou, igual, praCaos, indeciso, meioDaPartida, f: fichaGet(n) });
    }
    // 1.7.10.3: busca nas regras e o lembrete da primeira carta de cada categoria
    {
      openTutorial('manual');
      const i = document.getElementById('tutBuscaIn');
      i.value = 'grupo'; tutBuscar();
      const achou = /cada categoria/.test((document.querySelector('.tut-busca-item') || {}).textContent || '');
      closeTutorial();
      const orig = caosFalaAgendar, got = [];
      caosFalaAgendar = (fn) => got.push(fn());
      const cartaAntes = currentCard, modoAntes = CURRENT_MODE, usados = new Set(caosEasterEggsUsed);
      const t = (cat, modo) => { CURRENT_MODE = modo; currentCard = { category: cat, clues: [] }; caosEasterEggsUsed.clear(); caosPrimeiraCategoria(); caosPrimeiraCategoria(); };
      t('PESSOA', 'classico'); t('COISA', 'junior');
      caosFalaAgendar = orig; currentCard = cartaAntes; CURRENT_MODE = modoAntes; caosEasterEggsUsed.clear(); usados.forEach((k) => caosEasterEggsUsed.add(k));
      out.regrasEPrimeira = achou && got.length === 2 && /grupo|banda|dupla/i.test(got[0]) && !/animal|bicho moram|até bicho conta/i.test(got[1].replace('Bicho tem categoria própria', ''));
    }
    // 1.7.10.1 (pedido do JF): com a sala aberta, a partida não começa com jogador sem aparelho
    {
      const salvos = players, iniAntes = starterChosen;
      starterChosen = false;
      players = [{ id: 'j_semap1', name: 'Bia', score: 0, position: 0, color: PLAYER_COLORS[0], avatar: '😀', humor: 'normal', gems: {}, idade: 'doze' }, { id: 'j_semap2', name: 'Caio', score: 0, position: 0, color: PLAYER_COLORS[1], avatar: '😎', humor: 'normal', gems: {}, idade: 'doze' }];
      const abriu = !!redeAbrirSala('local');
      const tela = document.getElementById('welcomeScreen').style.display;
      document.getElementById('startGameBtn').click();
      const barrou = redeSemAparelho().length === 2 && document.getElementById('welcomeScreen').style.display === tela && !!document.querySelector('.caos-aviso-ov');
      // 1.7.10.7: um clique em "Jogam aqui" põe os dois no dispositivo do host e a partida segue
      const sb = document.getElementById('startGameBtn');
      let seguiu = false;
      sb.click = () => (seguiu = true);
      const sim = [...document.querySelectorAll('#caosConfirmModal button')].find((b) => /Jogam aqui/.test(b.textContent));
      if (sim) sim.click();
      delete sb.click;
      document.querySelectorAll('.caos-aviso-ov, #redePainel').forEach((o) => o.remove());
      const liberou = !!sim && seguiu && redeSemAparelho().length === 0 && redeNoHost('j_semap1') && redeNoHost('j_semap2');
      // 1.7.10.6.1 (relato do JF): o host recarregou e perdeu quem joga nele: religa sozinho quem estava guardado
      starterChosen = true; rede.hostEu = null; rede.hostJunto = []; rede.hostEuSalvo = ['j_semap1']; rede.assentos.j_semap2 = { sessao: 'x', visto: Date.now(), chave: 'k', nome: 'Caio' };
      redeHostEuReligar();
      out.hostReligou = rede.hostEu === 'j_semap1' && !(rede.hostJunto || []).length;
      starterChosen = false;
      redeFechar();
      out.semAparelho = abriu && barrou && liberou;
      // 1.7.10.6.1 (JF perdeu o duelo pro Henrique): no duelo da carta bônus a ficha vale só pros dois duelistas
      {
        const pAntes = players, cAntes = currentCard, mAntes = mestreIndex, rAntes = responderIndex, hAntes = palpiteHolders, fAntes = CURRENT_FORMAT;
        CURRENT_FORMAT = 'versus';
        players = ['Ana', 'Beto', 'Caio', 'Duda'].map((n, i) => ({ id: 'j_duel' + i, name: n, score: 0, position: 0, color: PLAYER_COLORS[i], avatar: '😀', humor: 'normal', gems: {}, idade: 'doze' }));
        currentCard = { isBonus: true, bonusLanderPlayerIdx: 0, bonusOpponentPlayerIdx: 1, clues: [{ type: 'clue', text: 'x' }], answer: 'X', category: 'COISA' };
        mestreIndex = 2; responderIndex = 1;
        palpiteHolders = { j_duel0: 1, j_duel3: 1 };
        const el = palpiteAvailable() ? palpiteEligibleHolders() : null;
        out.palpiteDuelo = !!el && el.includes('j_duel0') && !el.includes('j_duel3');
        players = pAntes; currentCard = cAntes; mestreIndex = mAntes; responderIndex = rAntes; palpiteHolders = hAntes; CURRENT_FORMAT = fAntes;
      }
      players = salvos; starterChosen = iniAntes;
    }
    // 1.7.10: Reportar carta anota no aparelho (sem mostrar a resposta na janela, sem mexer na partida)
    {
      window.__REDE_SERVIDOR = false; // (sem mandar pro servidor de verdade)
      localStorage.removeItem('perfil5_cartas_reportadas');
      const cartaAntes = currentCard, fimAntes = gameEnded, iniAntes = starterChosen;
      if (!currentCard) currentCard = cartaPorId('ANO-0001');
      gameEnded = false; starterChosen = true;
      const rev0 = partidaRevisao, temCarta = !!(currentCard && currentCard.id);
      cartaReportarAbrir();
      const ov = document.getElementById('reportarCarta');
      const semResposta = !!ov && temCarta && !ov.textContent.toLowerCase().includes(String(currentCard.answer).toLowerCase());
      if (ov && temCarta) { ov.querySelector('input[name="repMotivo"][value="entrega"]').click(); ov.querySelector('#repSalvar').click(); }
      await new Promise((ok) => { const t0 = Date.now(); (function w() { if (cartaReporteFila().length || Date.now() - t0 > 15000) ok(); else setTimeout(w, 100); })(); });
      const l = cartasReportadas();
      out.reportar = temCarta && semResposta && l.length === 1 && l[0].id === currentCard.id && l[0].motivo === 'entrega' && cartasReportadasTexto().includes(currentCard.id) && partidaRevisao === rev0;
      // 25/10/2026: o print da tela vai junto (só na fila; a lista do aparelho guarda só o texto)
      const fi = cartaReporteFila()[0] || {};
      out.reportar = out.reportar && cartaReporteFila().length === 1 && Array.isArray(fi.imagens) && fi.imagens.length === 1 && /^data:image\/jpeg;base64,/.test(fi.imagens[0]) && !('imagens' in l[0]);
      out.reportarDiag = JSON.stringify({ n: cartaReporteFila().length, imgs: (fi.imagens || []).length, tam: ((fi.imagens || [])[0] || '').length });
      currentCard = cartaAntes; gameEnded = fimAntes; starterChosen = iniAntes;
      if (ov) ov.remove();
      localStorage.removeItem('perfil5_cartas_reportadas');
      localStorage.removeItem('perfil5_cartas_reporte_fila');
    }
    // 25/10/2026: Reportar problema guarda na fila com o retrato da partida (sem nomes, sem resposta)
    {
      window.__REDE_SERVIDOR = false;
      localStorage.removeItem('perfil5_cartas_reporte_fila');
      const cartaAntes = currentCard, jogAntes = players;
      if (!currentCard) currentCard = cartaPorId('ANO-0001');
      players = [{ id: 'q1', name: 'Zuleica', score: 7, position: 3, humor: 'normal' }, { id: 'q2', name: 'Teodoro', score: 2, position: 1, humor: 'suave' }];
      const rev0 = partidaRevisao;
      problemaReportarAbrir();
      const ov = document.getElementById('reportarProblema');
      if (ov) { ov.querySelector('input[name="probTipo"][value="placar"]').click(); ov.querySelector('#probNota').value = 'placar pulou'; ov.querySelector('#probSalvar').click(); }
      await new Promise((ok) => { const t0 = Date.now(); (function w() { if (cartaReporteFila().length || Date.now() - t0 > 15000) ok(); else setTimeout(w, 100); })(); });
      const f = cartaReporteFila(), it = f[0] || {}, txt = JSON.stringify(it);
      out.problema = !!ov && f.length === 1 && it.tipo === 'problema' && it.cat === 'placar' && it.nota === 'placar pulou' && !!it.anexo &&
        it.anexo.jog.length === 2 && it.anexo.jog[0][0] === 'J1' && it.anexo.carta === currentCard.id &&
        !/Zuleica|Teodoro/.test(JSON.stringify(it.anexo)) && !JSON.stringify(it.anexo).toLowerCase().includes(String(currentCard.answer).toLowerCase()) &&
        Array.isArray(it.imagens) && it.imagens.length === 1 && it.imagens[0].length <= 280000 && JSON.stringify({ ...it, imagens: [] }).length < 2900 && partidaRevisao === rev0;
      out.problemaDiag = JSON.stringify({ n: f.length, cat: it.cat, tam: txt.length, imgs: (it.imagens || []).length });
      if (ov) ov.remove();
      currentCard = cartaAntes; players = jogAntes;
      localStorage.removeItem('perfil5_cartas_reporte_fila');
    }
    resetDeck();
    out.zerou = partidaRevisao === 0 && acoesLog.length === 0 && tabForma === null;
    out.formaNova = !!tabFormaAtual() && tabForma !== formaSalva;
    JFStore.removeItem('perfil200_state');
    return out;
  });
  Object.assign(r, r2);
  const linhas = [
    ['Fronteira instalada em todas as ações', r.instaladas.split('/')[0] === r.instaladas.split('/')[1]],
    ['Toque vira ação registrada (origem toque)', r.dicaAberta && /escolherDica:toque/.test(r.logToque)],
    ['Um toque = uma ação (o que o motor chama por dentro não conta)', r.umaAcaoPorToque],
    ['A ação guarda o Mestre e a vez pelo id', r.comQuem],
    ['Revisão sobe quando muda; toque fora de hora não sobe', r.revisaoSubiu && r.semMudancaSemRevisao],
    ['Comando desconhecido recusado', r.desconhecida === 'acao_desconhecida'],
    ['Comando de outra partida recusado', r.partidaErrada === 'partida_errada'],
    ['Comando com revisão obsoleta recusado', r.obsoleta === 'revisao_obsoleta'],
    ['Comando fora de hora recusado', r.foraDeHora === 'fora_de_hora'],
    ['Comando válido aplica (origem comando)', r.comandoOk],
    ['Comando repetido não aplica duas vezes', r.duplicadoNaoAplica],
    ['Retrato público sem resposta, sem id da carta e sem dica fechada', r.retratoSemResposta],
    ['Retrato público com as dicas abertas (a que o Mestre está lendo só depois do veredito)', r.retratoAbertas],
    ['Retrato do Mestre com a resposta; os dois com a revisão atual', r.retratoMestre],
    ['Retrato com jogadores pelo id', r.retratoIds],
    ['Retrato sem dado de cadastro (idade, humor)', r.retratoSemCadastro],
    ['Aviso de mudança a cada ação', r.avisou],
    ['Acertou oferece ↩️ Desfazer', r.ofereceuDesfazer],
    ['Desfazer volta pontos, vez, carta, baralho e histórico ao de antes', r.desfezIgual],
    ['Desfazer volta também o humor e a memória do C.A.O.S. (1.7.8.6)', r.caosVoltou],
    ['Desfazer é uma ação registrada e o botão some', r.desfazerNoRegistro],
    ['Desfazer devolve o relógio da dica', r.relogioVoltou],
    ['Outra jogada fecha a janela do desfazer', r.outraJogadaFecha],
    ['20 mil dicas com id fixo e único (ANO-0001-C07)', r.dicasComId],
    ['Id da dica só no retrato do Mestre', r.clueIdSoMestre],
    ['Dica com texto corrigido é achada pelo id ao retomar', r.dicaPeloId],
    ['Fala dirigida vai pelo id, privada', r.falaExplicita],
    ['Fala sem destino vai pra mesa', r.falaMesa],
    ['Nome no texto vira só diagnóstico (com id)', r.falaNome],
    ['Cada fala é um evento único com partida e revisão', r.falaEvento],
    ['Revisão e registro vão pro save', r.salvou],
    ['1.7.9: "reembaralharDicas" não existe mais na porta', r.semReembaralhar],
    ['1.7.9: mover casas sem a especial aberta é recusado', r.moverSemEspecial],
    ['1.7.9: descarte além do limite é recusado (a tela e a porta usam a mesma regra)', r.descarteLimite && r.descarteLimite.podiaAntes && r.descarteLimite.recusou],
    ['1.7.9: comando recusado não muda nada', r.portaSemEfeito],
    ['1.7.9: pausar e voltar sobem a revisão', r.pausaRevisao],
    ['1.7.9: comando repetido segue recusado depois de recarregar', r.comandoDuravel],
    ['1.7.9: eventId da fala com o pedaço da sessão', r.eventoSessao],
    ['1.7.9: tirar jogador pelo ADM é ação registrada', r.removerRegistra === true],
    ['Partida nova zera revisão e registro', r.zerou],
    ['1.7.9.2: a forma do tabuleiro volta igual ao recarregar', r.formaVoltou],
    ['1.7.9.2: partida nova sorteia outra forma de tabuleiro', r.formaNova],
    ['1.7.9.4: o tabuleiro abre entre as cartas, com a próxima já escondida', r.lobbyAbriu],
    ['1.7.9.4: o lobby é só tela (não mexe na partida) e fica abaixo do Desfazer', r.lobbySoTela],
    ['1.7.9.4: desfazer o veredito fecha o lobby', r.lobbyDesfeito],
    ['1.7.9.9: o Desfazer vira fala de VAR do C.A.O.S. (calado: aviso simples)', r.desfazerVar],
    ['1.7.9.6: lobby com abas (Tabuleiro, Pontos e Joias quando a partida dá joias), abrindo na que decide', r.lobbyAbas],
    ['1.7.10.5.6: cartas da partida (categoria, resposta, quem, quantas dicas e qual dica) no lobby e no retrato, com resumo; o Desfazer tira a carta da lista', r.cartasPartida && r.desfezIgual],
    ['1.7.9.5: na partida o "toque pra ampliar" mostra só a lista, sem o tabuleiro grande', r.ampliarSemDesenho],
    ['1.7.9.5: Menos movimento (acessibilidade) e Modo Batata são coisas separadas', r.calmoSeparado],
    ['1.7.10: Reportar carta anota no aparelho, sem resposta na janela e sem mexer na partida', r.reportar],
    ['Reportar problema: vai pra fila com o retrato da partida, sem nomes e sem a resposta', r.problema],
    ['1.7.10: nome repetido: o nome já cadastrado fica em destaque, o campo fica vermelho e o C.A.O.S. comenta', r.nomeRepetido],
    ['Travas ADM: a pergunta abre, Sim trava o nick da Anne, Não desliga, e não pergunta duas vezes na mesma partida', r.travasAdm],
    ['C.A.O.S. 4.3: comentário espera a fala anterior terminar + respiro (até 10 por carta), aviso de regra passa, no online Alt-Tab não pausa e pular fala não marca ninguém, e o que ele já apresentou volta no save', r.caos42],
    ['C.A.O.S. 4.3: pular fala marca quem pulou (aparelho do host e celular); todos calaram = quieto (regra passa); parte calou = ciúmes; quem religa traz ele de volta', r.caos43],
    ['1.7.10.5: quem está na vez pede a dica no aparelho (o Mestre recebe o pedido); quem tem a ficha toca em Palpitar agora e o Mestre julga só esse palpite; errou, a ficha volta e a vez segue', r.palpiteAgora],
    ['1.7.10.5.3: trava da dica (o Mestre só abre a pedida, forçar passa); C.A.O.S. 4.4.1: tocar na dica aberta faz ele responder mesmo no respiro', r.dicaRepetida && r.palpiteAgora],
    ['Quem o C.A.O.S. conhece (JF, amigos, sobrinhos) é reconhecido antes da piada do nick demorado', r.reconheceAntes],
    ['O C.A.O.S. lembra o emoji de cada um e comenta a troca (💀 → 🍦 mais calmo, 🍦 → 💀 mau humor)', r.trocouEmoji],
    ['O C.A.O.S. lembra o humor de cada um e zoa a troca (subiu, desceu, deixou com ele, troca toda hora, o que ele sorteou)', r.trocouHumor],
    ['C.A.O.S. com tato: a mesa corta frase longa e ele passa a falar curto, lembra da mesma mesa, testa mesa nova pelo jeito dela; família de nicho só 1x por partida', r.tato],
    ['Easter egg: piadas internas com limite e intervalo (nunca no Júnior; os sobrinhos sim), Dragons só com o JF e a turma, falas da mesa toda e cores escondidas da paleta', r.amigos],
    ['Cadastro: o C.A.O.S. pergunta da voz (não pergunta se já está ligada); Sim liga; Não ganha fala triste e segue sem voz', r.vozPergunta],
    ['1.7.10.3: busca nas regras acha "grupo"; o C.A.O.S. lembra o que vale na 1ª carta de cada categoria (Júnior sem animal em Coisa)', r.regrasEPrimeira],
    ['1.7.10.1/1.7.10.7: com a sala aberta, quem não entrou pelo dispositivo joga no do host com um clique', r.semAparelho],
    ['1.7.10.6.1: o host que recarregou religa sozinho quem joga nele (lojinha, dica e rouba a vez de volta)', r.hostReligou],
    ['1.7.10.6.1: no duelo da carta bônus a ficha de palpite vale pros duelistas (e só pra eles)', r.palpiteDuelo],
  ];
  linhas.forEach(([n, ok]) => console.log(`${ok ? 'ok    ' : 'FALHOU'}  ${n}`));
  const tudo = linhas.every((l) => l[1]) && !erros.length;
  if (!tudo) console.log(JSON.stringify(r, null, 1));
  console.log(erros.length ? 'Erros na página: ' + erros.join(' | ') : 'Sem erro na página.');
  console.log(tudo ? 'AÇÕES OK' : 'AÇÕES FALHOU');
  await b.close();
  process.exit(tudo ? 0 : 1);
})();
