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
    out.desfezIgual = semRelogio(retratoPartida('mestre')) === antesAcerto && history.length === histAntes && deck.length === deckAntes;
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
      dispatchAction({ type: 'pedirDica', data: [6], actorId: b2.id });
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
      rede = redeAntes;
      players = jogAntes; starterChosen = iniAntes; gameEnded = fimAntes; mestreIndex = mAntes; responderIndex = rAntes;
      currentCard = cartaAntes; cardState = estAntes; pendingIndex = pendAntes; revealedOrder = revAntes; palpiteHolders = holdAntes; palpiteStock = stockAntes; CURRENT_MODE = modoAntes; CURRENT_FORMAT = fmtAntes;
      palpiteVez = null; pedidoDica = null;
      out.palpiteAgora = temNumeros && naoDeOutro && pedido && pedidoSome && caioVe && dudaNao && mestreSemFicha && julgaCaio && umPorVez && errouSegue;
      out.palpiteAgoraDiag = JSON.stringify({ temNumeros, naoDeOutro, pedido, pedidoSome, caioVe, dudaNao, mestreSemFicha, julgaCaio, umPorVez, errouSegue });
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
      players = [{ id: 'j_semap1', name: 'Bia', score: 0, position: 0, color: PLAYER_COLORS[0], avatar: '😀', humor: 'normal', gems: {} }, { id: 'j_semap2', name: 'Caio', score: 0, position: 0, color: PLAYER_COLORS[1], avatar: '😎', humor: 'normal', gems: {} }];
      const abriu = !!redeAbrirSala('local');
      const tela = document.getElementById('welcomeScreen').style.display;
      document.getElementById('startGameBtn').click();
      const barrou = redeSemAparelho().length === 2 && document.getElementById('welcomeScreen').style.display === tela && !!document.querySelector('.caos-aviso-ov');
      document.querySelectorAll('.caos-aviso-ov, #redePainel').forEach((o) => o.remove());
      rede.hostEu = 'j_semap1'; rede.hostJunto = ['j_semap2'];
      const liberou = redeSemAparelho().length === 0;
      redeFechar();
      out.semAparelho = abriu && barrou && liberou;
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
      const l = cartasReportadas();
      out.reportar = temCarta && semResposta && l.length === 1 && l[0].id === currentCard.id && l[0].motivo === 'entrega' && cartasReportadasTexto().includes(currentCard.id) && partidaRevisao === rev0;
      out.reportar = out.reportar && cartaReporteFila().length === 1;
      currentCard = cartaAntes; gameEnded = fimAntes; starterChosen = iniAntes;
      if (ov) ov.remove();
      localStorage.removeItem('perfil5_cartas_reportadas');
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
    ['1.7.9.5: na partida o "toque pra ampliar" mostra só a lista, sem o tabuleiro grande', r.ampliarSemDesenho],
    ['1.7.9.5: Menos movimento (acessibilidade) e Modo Batata são coisas separadas', r.calmoSeparado],
    ['1.7.10: Reportar carta anota no aparelho, sem resposta na janela e sem mexer na partida', r.reportar],
    ['1.7.10: nome repetido: o nome já cadastrado fica em destaque, o campo fica vermelho e o C.A.O.S. comenta', r.nomeRepetido],
    ['Travas ADM: a pergunta abre, Sim trava o nick da Anne, Não desliga, e não pergunta duas vezes na mesma partida', r.travasAdm],
    ['C.A.O.S. 4.3: comentário espera a fala anterior terminar + respiro (até 10 por carta), aviso de regra passa, no online Alt-Tab não pausa e pular fala não marca ninguém, e o que ele já apresentou volta no save', r.caos42],
    ['C.A.O.S. 4.3: pular fala marca quem pulou (aparelho do host e celular); todos calaram = quieto (regra passa); parte calou = ciúmes; quem religa traz ele de volta', r.caos43],
    ['1.7.10.5: quem está na vez pede a dica no aparelho (o Mestre recebe o pedido); quem tem a ficha toca em Palpitar agora e o Mestre julga só esse palpite; errou, a ficha volta e a vez segue', r.palpiteAgora],
    ['Cadastro: o C.A.O.S. pergunta da voz (não pergunta se já está ligada); Sim liga; Não ganha fala triste e segue sem voz', r.vozPergunta],
    ['1.7.10.3: busca nas regras acha "grupo"; o C.A.O.S. lembra o que vale na 1ª carta de cada categoria (Júnior sem animal em Coisa)', r.regrasEPrimeira],
    ['1.7.10.1: com a sala aberta, a partida só começa quando todo jogador tem aparelho', r.semAparelho],
  ];
  linhas.forEach(([n, ok]) => console.log(`${ok ? 'ok    ' : 'FALHOU'}  ${n}`));
  const tudo = linhas.every((l) => l[1]) && !erros.length;
  if (!tudo) console.log(JSON.stringify(r, null, 1));
  console.log(erros.length ? 'Erros na página: ' + erros.join(' | ') : 'Sem erro na página.');
  console.log(tudo ? 'AÇÕES OK' : 'AÇÕES FALHOU');
  await b.close();
  process.exit(tudo ? 0 : 1);
})();
