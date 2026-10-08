/* ----------------------------------------------------------------------
 * 5g. AÇÕES E EVENTOS (1.7.8 · Actions and Events Update, Parte 1)
 * Toda jogada que muda a partida é uma AÇÃO com nome: sacar carta, virar, escolher número,
 * Acertou, Errou, Pulou, Absurdo, palpite, instrução especial, pausar, encerrar…
 *
 *  · FRONTEIRA: as funções do motor que os botões chamam ganham uma "casca" (como a espinha
 *    faz com o C.A.O.S.). A chamada de fora (o toque, o relógio) vira uma ação registrada;
 *    o que o motor chama por dentro não conta de novo. O jogo não muda: a casca só observa.
 *  · REVISÃO: cada ação que mudou o estado da partida sobe a revisão (partidaRevisao). Ação que
 *    não mudou nada (botão tocado fora de hora) não sobe.
 *  · LOG: as últimas ações ficam no save (acoesLog), com quem era Mestre e quem estava na vez,
 *    pelo id. É a base do "desfazer", do replay e da rede.
 *  · COMANDO: dispatchAction({ type, data, commandId, matchId, expectedRevision, actorId }) é a
 *    porta que a rede vai usar (1.7.9). Ela confere a partida, a revisão esperada, se o comando
 *    já foi aplicado (commandId repetido não aplica duas vezes) e se a ação cabe agora.
 *    Na 1.7.9 quem diz o actorId é a sessão do servidor, nunca o próprio aparelho.
 * ---------------------------------------------------------------------- */
const ACOES = {
  sacarCarta: { fn: "drawHidden", pode: () => acoesEmJogo() && cardState === "none" },
  virarCarta: { fn: "flipCard", pode: () => acoesEmJogo() && cardState === "hidden" },
  roletaCategoria: { fn: "startCategoryRoulette", pode: () => acoesEmJogo() && cardState === "hidden" },
  escolherDica: { fn: "chooseClue", pode: (idx) => acoesEmJogo() && acoesDicaLivre(idx) },
  acertou: { fn: "markCorrect", pode: (idx) => acoesComDica() && (idx === undefined || !!players[idx]) },
  errou: { fn: "markWrong", pode: (tipo) => acoesComDica() && [undefined, null, "pular", "absurdo"].includes(tipo) },
  palpiteAcertou: { fn: "palpiteHit", pode: () => acoesComDica() },
  palpiteErrou: { fn: "palpiteMiss", pode: () => acoesComDica() },
  especialSeguir: { fn: "continueAfterSpecial", pode: () => acoesComDica() },
  especialPerdeVez: { fn: "loseTurnAfterSpecial", pode: () => acoesComDica() },
  moverJogador: { fn: "applySpecialMove", pode: () => acoesEmJogo() },
  moverEquipe: { fn: "applyTeamSpecialMove", pode: () => acoesEmJogo() },
  bonusAdversario: { fn: "chooseBonusOpponent", pode: () => acoesEmJogo() && cardState === "bonusChoice" },
  descartarCarta: { fn: "discardAndDraw", pode: () => acoesEmJogo() },
  reembaralharDicas: { fn: "reshuffleAndDraw", pode: () => acoesEmJogo() },
  desistirCarta: { fn: "pedirDesistirCarta", pode: () => acoesEmJogo() },
  expressPassar: { fn: "expressPass", pode: () => acoesEmJogo() && CURRENT_MODE === "express" },
  expressPular: { fn: "expressSkip", pode: () => acoesEmJogo() && CURRENT_MODE === "express" },
  expressInverter: { fn: "expressReverse", pode: () => acoesEmJogo() && CURRENT_MODE === "express" },
  expressAlvo: { fn: "resolveExpressTarget", pode: () => acoesEmJogo() && CURRENT_MODE === "express" },
  tempoAcabou: { fn: "onTimerExpired", pode: () => acoesEmJogo() },
  pausar: { fn: "pauseGame", pode: () => acoesEmJogo() },
  continuar: { fn: "resumeGame", pode: () => starterChosen && !gameEnded },
  encerrar: { fn: "endGame", pode: () => acoesEmJogo() },
};
const ACOES_LOG_MAX = 300;
const ACOES_COMANDOS_MAX = 200;
let partidaRevisao = 0;
let acoesLog = [];
let acoesComandosVistos = [];
let acoesProfundidade = 0;
let acoesOrigemAtual = null; // "comando" quando a ação veio do dispatchAction
let acoesInstaladas = false;
const ACOES_POR_FN = {};
Object.keys(ACOES).forEach((t) => (ACOES_POR_FN[ACOES[t].fn] = t));

function acoesEmJogo() {
  return starterChosen && !gameEnded;
}
function acoesComDica() {
  return acoesEmJogo() && cardState === "revealed" && pendingIndex !== null;
}
function acoesDicaLivre(idx) {
  return (
    cardState === "revealed" &&
    pendingIndex === null &&
    !!currentCard &&
    Number.isInteger(idx) &&
    idx >= 0 &&
    idx < currentCard.clues.length &&
    !revealedOrder.some((r) => r.index === idx)
  );
}
// Só dados simples vão pro log (números, textos curtos, null).
function acoesDados(args) {
  return Array.prototype.slice.call(args, 0, 4).map((v) =>
    v === undefined ? null : typeof v === "number" || typeof v === "boolean" || v === null ? v : String(v).slice(0, 24),
  );
}
function acoesOrigem() {
  if (acoesOrigemAtual) return acoesOrigemAtual;
  try {
    const ev = window.event;
    if (ev && ev.isTrusted && /^(click|keydown|keyup|pointerup|touchend)$/.test(ev.type)) return "toque";
  } catch (e) {}
  return "sistema";
}
function acoesRegistrar(tipo, args, origem) {
  partidaRevisao++;
  acoesLog.push({
    r: partidaRevisao,
    a: tipo,
    d: acoesDados(args),
    o: origem,
    m: jogadorIdDe(mestreIndex),
    v: jogadorIdDe(responderIndex),
    t: caosPartidaInicioAt ? Math.max(0, Date.now() - caosPartidaInicioAt) : 0,
  });
  if (acoesLog.length > ACOES_LOG_MAX) acoesLog.splice(0, acoesLog.length - ACOES_LOG_MAX);
  if (typeof acoesAvisar === "function") acoesAvisar(acoesLog[acoesLog.length - 1]);
}
// Casca de uma função do motor: só a chamada de fora conta como ação.
function acoesEnvolver(fnNome) {
  const orig = window[fnNome];
  if (typeof orig !== "function" || orig.__acao) return false;
  const tipo = ACOES_POR_FN[fnNome];
  const casca = function () {
    if (acoesProfundidade > 0) return orig.apply(this, arguments);
    const origem = acoesOrigem();
    const antes = caosEspinhaFoto();
    acoesProfundidade++;
    try {
      return orig.apply(this, arguments);
    } finally {
      acoesProfundidade--;
      try {
        if (antes !== caosEspinhaFoto()) acoesRegistrar(tipo, arguments, origem);
      } catch (e) {}
    }
  };
  casca.__acao = true;
  try {
    window[fnNome] = casca;
  } catch (e) {
    return false;
  }
  return window[fnNome] === casca;
}
function acoesInstalar() {
  if (acoesInstaladas) return;
  let n = 0;
  Object.keys(ACOES).forEach((t) => acoesEnvolver(ACOES[t].fn) && n++);
  acoesInstaladas = true;
  try {
    caosLog("acoes", `fronteira de ações instalada em ${n} de ${Object.keys(ACOES).length} funções`);
  } catch (e) {}
}
// Partida nova: revisão e log do zero.
function acoesZerar() {
  partidaRevisao = 0;
  acoesLog = [];
  acoesComandosVistos = [];
}
function acoesRestaurar(state) {
  partidaRevisao = Number.isInteger(state.partidaRevisao) && state.partidaRevisao >= 0 ? state.partidaRevisao : 0;
  acoesLog = Array.isArray(state.acoesLog)
    ? state.acoesLog
        .filter((x) => x && typeof x === "object" && typeof x.a === "string" && ACOES[x.a] && Number.isInteger(x.r))
        .slice(-ACOES_LOG_MAX)
        .map((x) => ({
          r: x.r,
          a: x.a,
          d: Array.isArray(x.d) ? acoesDados(x.d) : [],
          o: x.o === "toque" || x.o === "comando" ? x.o : "sistema",
          m: jogadorIdValido(x.m) ? x.m : null,
          v: jogadorIdValido(x.v) ? x.v : null,
          t: typeof x.t === "number" && isFinite(x.t) ? x.t : 0,
        }))
    : [];
  acoesComandosVistos = [];
}
// A porta dos comandos (rede na 1.7.9; testes e ferramentas hoje).
function dispatchAction(cmd) {
  const c = cmd && typeof cmd === "object" ? cmd : {};
  const def = ACOES[c.type];
  if (!def) return { ok: false, motivo: "acao_desconhecida" };
  if (c.matchId !== undefined && c.matchId !== matchId) return { ok: false, motivo: "partida_errada", revisao: partidaRevisao };
  if (c.commandId !== undefined) {
    if (typeof c.commandId !== "string" || !c.commandId || c.commandId.length > 64)
      return { ok: false, motivo: "comando_invalido" };
    if (acoesComandosVistos.includes(c.commandId)) return { ok: true, duplicado: true, revisao: partidaRevisao };
  }
  if (c.expectedRevision !== undefined && c.expectedRevision !== partidaRevisao)
    return { ok: false, motivo: "revisao_obsoleta", revisao: partidaRevisao };
  const dados = Array.isArray(c.data) ? c.data : c.data === undefined ? [] : [c.data];
  let pode = false;
  try {
    pode = !!def.pode.apply(null, dados);
  } catch (e) {
    pode = false;
  }
  if (!pode) return { ok: false, motivo: "fora_de_hora", revisao: partidaRevisao };
  const antes = partidaRevisao;
  acoesOrigemAtual = "comando";
  try {
    window[def.fn].apply(null, dados);
  } catch (e) {
    return { ok: false, motivo: "erro", revisao: partidaRevisao };
  } finally {
    acoesOrigemAtual = null;
  }
  if (c.commandId !== undefined) {
    acoesComandosVistos.push(c.commandId);
    if (acoesComandosVistos.length > ACOES_COMANDOS_MAX) acoesComandosVistos.shift();
  }
  return partidaRevisao > antes ? { ok: true, revisao: partidaRevisao } : { ok: false, motivo: "sem_efeito", revisao: partidaRevisao };
}
// Resumo pro Cérebro (ADM).
function acoesResumo() {
  const ult = acoesLog
    .slice(-5)
    .reverse()
    .map((x) => `#${x.r} ${x.a}${x.d.length ? "(" + x.d.join(", ") + ")" : ""} · ${x.o}`);
  return { revisao: partidaRevisao, total: acoesLog.length, ultimas: ult };
}

/* --- Retrato da partida / GameSnapshot (1.7.8.1 · Parte 2) ---
 * O que vai pros outros aparelhos no online: só o estado de regra, separado do save.
 *  · papel "mesa" (projeção pública): placar, vez, dicas JÁ ABERTAS, relógio. Nunca leva a
 *    resposta nem as dicas fechadas da carta.
 *  · papel "mestre": o mesmo, mais a resposta da carta (quem lê precisa dela).
 * Não leva fala do C.A.O.S., preferência do aparelho (tema, letra, volume) nem dado de cadastro
 * que não é de regra (idade, humor). Leva matchId e revisão: quem recebe sabe se está atrasado. */
const RETRATO_PROTOCOLO = 1;
function retratoPartida(papel) {
  const mestre = papel === "mestre";
  const eq = CURRENT_FORMAT === "equipe";
  const joias = (h) => {
    const g = (h && h.gems) || {};
    const o = {};
    Object.keys(g).forEach((c) => g[c] > 0 && (o[c] = g[c]));
    return o;
  };
  const carta = currentCard
    ? {
        // o id da carta só pro Mestre: com o catálogo dentro do jogo, o id entregaria a resposta
        ...(mestre ? { id: currentCard.id || null } : {}),
        categoria: currentCard.category,
        totalDicas: currentCard.clues.length,
        abertas: revealedOrder.map((r) => ({
          pos: r.index,
          tipo: r.item.type,
          texto: r.item.text,
          pedidaPor: (players.find((p) => p.name === r.pickedByName) || {}).id || null,
        })),
        pendente: pendingIndex === null ? null : pendingIndex,
        ...(mestre ? { resposta: currentCard.answer } : {}),
      }
    : null;
  return {
    protocolo: RETRATO_PROTOCOLO,
    papel: mestre ? "mestre" : "mesa",
    matchId,
    revisao: partidaRevisao,
    conteudo: ADULT_CARDS.length,
    modo: CURRENT_MODE,
    formato: CURRENT_FORMAT,
    vitoria: winCond(),
    meta: { casa: WINNING_SCORE, pontos: typeof metaPontos === "function" ? metaPontos() : null },
    rodada: rodadaAtual,
    ultimaRodada,
    iniciada: starterChosen,
    fim: gameEnded,
    estadoCarta: cardState,
    jogadores: players.map((p) => ({
      id: p.id,
      nome: p.name,
      cor: p.color,
      avatar: p.avatar,
      pontos: p.score,
      casa: p.position,
      bloqueado: !!p.isBlocked,
      equipe: p.team || null,
      joias: joias(p),
    })),
    equipes: eq
      ? teamOrder.map((id) => ({ id, casa: teams[id].position, joias: joias(teams[id]), membros: (teams[id].members || []).map(jogadorIdDe) }))
      : [],
    mestreId: jogadorIdDe(mestreIndex),
    vezId: jogadorIdDe(responderIndex),
    carta,
    palpites: { ...palpiteHolders },
    estoquePalpite: palpiteStock,
    joiasRodada: { ...joiasRodada },
    vencedorJoias: gemWinner ? { tipo: gemWinner.kind, id: gemWinner.id } : null,
    relogio: { tipo: timerKind || null, fimEm: timerEndAt || null, cartaFimEm: cardEndAt || null, pausado: !!pausedAt },
  };
}

/* --- Avisos de mudança (pro ensaio em duas abas da Parte 4 e, depois, pra rede) --- */
const acoesOuvintes = [];
function acoesAoMudar(fn) {
  if (typeof fn === "function") acoesOuvintes.push(fn);
}
function acoesAvisar(entrada) {
  acoesOuvintes.forEach((fn) => {
    try {
      fn(entrada);
    } catch (e) {}
  });
}
