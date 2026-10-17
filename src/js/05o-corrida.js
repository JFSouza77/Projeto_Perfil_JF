/* --- 1.7.10.6 · CORRIDA CONTRA O TEMPO (regras do JF: docs/Modos_1.7.10.6.md) ---
 * É o jeito que o JF jogava com os sobrinhos: quem acerta fica com a carta. Sem tabuleiro, pontos ou joias.
 *  · Relógio geral de 30 min (+10 s por carta acertada). Zerou: a resposta em andamento termina e não começa
 *    carta nova. Vence quem tiver mais cartas; empate → desempate relâmpago.
 *  · Cada carta tem 2:30, que não reinicia por erro nem troca de vez. Acabou: a carta sai sem dono.
 *  · A vez segue a roda (15 s pra escolher a dica + 15 s pra responder; isso é o startTimer de sempre).
 *  · Entre as cartas, intervalo de 15 s com o relógio geral congelado.
 * Os relógios guardam "quanto falta" + "corre desde": o tique de 250 ms decide se cada um corre (pausa, fala do
 * C.A.O.S., aviso na tela e intervalo congelam), então não tem prazo pra empurrar em cada lugar que para o jogo. */
let corridaRestaMs = CORRIDA_TEMPO_MS;
let corridaDesde = null;
let corridaCartaRestaMs = CORRIDA_CARTA_MS;
let corridaCartaDesde = null;
let corridaCartaDaVez = -1; // cartaSeq da carta cujo relógio está valendo
let corridaAcabou = false; // o relógio geral zerou
let corridaDesempate = null; // { ids: [ids dos empatados], cartas: quantas ainda dá pra jogar }
let corridaDesempateFeito = false;
let corridaIntervaloPendente = false;
let corridaIntervaloFim = 0; // vai pro retrato da sala
let corridaIntervaloRelogio = null;
let corridaAvisos = {};
let corridaTique = null;
let corridaBarraTxt = "";

function corridaAtiva() {
  return CURRENT_MODE === "corrida";
}
function corridaGeralMs() {
  return Math.max(0, corridaRestaMs - (corridaDesde ? Date.now() - corridaDesde : 0));
}
function corridaCartaMs() {
  return Math.max(0, corridaCartaRestaMs - (corridaCartaDesde ? Date.now() - corridaCartaDesde : 0));
}
function corridaRelogioTxt(ms) {
  const s = Math.ceil(ms / 1e3);
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}
function corridaIntervaloAberto() {
  return !!document.getElementById("corridaIntervalo");
}
// O jogo está parado (pausa, fala do C.A.O.S., aviso na tela, intervalo)?
function corridaParado() {
  return (
    !starterChosen ||
    gameEnded ||
    !!pausedAt ||
    document.getElementById("pauseScreen").style.display === "block" ||
    corridaIntervaloAberto() ||
    !!activeToastState ||
    !!timeoutOverlayMessage ||
    caosJanelaImportanteAberta() // tutorial, aviso ou janela do C.A.O.S. aberta
  );
}
function corridaZerar() {
  corridaParar();
  corridaRestaMs = CORRIDA_TEMPO_MS;
  corridaCartaRestaMs = CORRIDA_CARTA_MS;
  corridaDesde = corridaCartaDesde = null;
  corridaCartaDaVez = -1;
  corridaAcabou = false;
  corridaDesempate = null;
  corridaDesempateFeito = false;
  corridaIntervaloPendente = false;
  corridaAvisos = {};
}
function corridaIniciar() {
  if (!corridaAtiva()) return;
  corridaTique = corridaTique || setInterval(corridaTicar, 250);
  corridaTicar();
}
// partida voltando do save: os relógios voltam do quanto faltava
function corridaRetomar(salvo) {
  if (!corridaAtiva() || !salvo) return;
  corridaRestaMs = Math.max(0, Math.min(Number(salvo.resta) || 0, 4 * 3600e3));
  corridaCartaRestaMs = Math.max(0, Math.min(Number(salvo.carta) || 0, CORRIDA_CARTA_MS));
  corridaCartaDaVez = cartaSeq;
  corridaAcabou = !!salvo.acabou;
  corridaDesempateFeito = !!salvo.desempateFeito;
  corridaDesempate = salvo.desempate && Array.isArray(salvo.desempate.ids) ? { ids: salvo.desempate.ids.slice(0, 6), cartas: Number(salvo.desempate.cartas) || 1 } : null;
  corridaAvisos = salvo.avisos && typeof salvo.avisos === "object" ? salvo.avisos : {};
  corridaDesde = corridaCartaDesde = null;
  if (starterChosen && !gameEnded) corridaIniciar();
}
function corridaSalvar() {
  if (!corridaAtiva()) return null;
  return { resta: corridaGeralMs(), carta: corridaCartaMs(), acabou: corridaAcabou, desempate: corridaDesempate, desempateFeito: corridaDesempateFeito, avisos: corridaAvisos };
}
function corridaParar() {
  clearInterval(corridaTique);
  corridaTique = null;
  corridaDobrar();
  corridaIntervaloFechar();
  const b = document.getElementById("corridaRelogios");
  if (b) b.hidden = true;
}
// "dobra" o tempo que correu pra dentro do quanto falta (o relógio para aqui)
function corridaDobrar() {
  if (corridaDesde) corridaRestaMs = corridaGeralMs();
  if (corridaCartaDesde) corridaCartaRestaMs = corridaCartaMs();
  corridaDesde = corridaCartaDesde = null;
}
function corridaTicar() {
  if (!corridaAtiva() || gameEnded) return corridaParar();
  // carta nova: o relógio dela começa cheio
  if (currentCard && cartaSeq !== corridaCartaDaVez) {
    corridaCartaDaVez = cartaSeq;
    corridaCartaRestaMs = CORRIDA_CARTA_MS;
    corridaCartaDesde = null;
  }
  const parado = corridaParado();
  const geralCorre = !parado && !corridaAcabou && !corridaDesempate && (cardState === "hidden" || cardState === "revealed");
  const cartaCorre = !parado && cardState === "revealed";
  const agora = Date.now();
  if (geralCorre && !corridaDesde) corridaDesde = agora;
  if (!geralCorre && corridaDesde) {
    corridaRestaMs = corridaGeralMs();
    corridaDesde = null;
  }
  if (cartaCorre && !corridaCartaDesde) corridaCartaDesde = agora;
  if (!cartaCorre && corridaCartaDesde) {
    corridaCartaRestaMs = corridaCartaMs();
    corridaCartaDesde = null;
  }
  corridaAvisarTempo();
  if (!corridaAcabou && !corridaDesempate && corridaGeralMs() <= 0) {
    corridaAcabou = true;
    corridaDobrar();
    caosLog("corrida", "o relógio geral zerou");
  }
  corridaDesenharBarra();
  corridaTalvezPublicar();
  if (parado || pendingOverlayAction) return;
  // com dica pendente (resposta ou especial em andamento), espera o veredito: ele chama o fim da carta
  if (cardState === "revealed" && pendingIndex === null && corridaCartaAcabou()) {
    clearTimer();
    resolveExhaustionIfNeeded();
    return;
  }
  // o relógio zerou antes de o Mestre abrir a carta: não começa carta nova
  if (cardState === "hidden" && corridaAcabou && !corridaDesempate) corridaEncerrar();
}
// A carta acabou (tempo da carta, ou relógio geral zerado fora do desempate)?
function corridaCartaAcabou() {
  if (!corridaAtiva() || !currentCard) return false;
  return corridaCartaMs() <= 0 || (corridaAcabou && !corridaDesempate);
}
function corridaAvisarCartaPerdida() {
  const geral = corridaAcabou && !corridaDesempate;
  fxFloat(geral ? "⏱️ Acabou o tempo!" : "⌛ A carta acabou o tempo", "#fb923c");
  playSfx("erro");
  caosLog("corrida", geral ? "carta encerrada pelo relógio geral" : "carta perdeu no tempo (2:30)");
}
function corridaBonus() {
  if (!corridaAtiva() || corridaDesempate || corridaAcabou) return;
  if (corridaDesde) corridaRestaMs = corridaGeralMs();
  corridaDesde = null;
  corridaRestaMs += CORRIDA_BONUS_MS;
}
// marcos do relógio geral: o C.A.O.S. avisa (uma vez cada)
function corridaAvisarTempo() {
  if (corridaAcabou || corridaDesempate) return;
  const ms = corridaGeralMs();
  const marcos = [
    ["cinco", 5 * 60e3, "⏱️ 5 minutos!"],
    ["um", 60e3, "⏱️ Último minuto!"],
    ["dez", 10e3, "⏱️ 10 segundos!"],
  ];
  for (const [k, lim, txt] of marcos) {
    if (ms > lim || corridaAvisos[k]) continue;
    // voltou do save já abaixo do marco: marca sem avisar
    corridaAvisos[k] = true;
    if (lim - ms > 3e3) continue;
    fxFloat(txt, "#fbbf24");
    playSfx(k === "dez" ? "tique" : "virar");
    vibrar("tempo");
    const V = REACTIVE_VOICE.corrida;
    if (k !== "dez" && V && V[k]) {
      const fala = getRandomReaction(V[k], corridaLiderNome());
      if (fala) caosFalaAgendar(() => fala, 200, "baixa");
    }
  }
}
function corridaLiderNome() {
  const top = corridaPlacar()[0];
  return top ? top.name : "alguém";
}
function corridaPlacar() {
  return players.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
}
// Barra dos relógios na tela do host/mesa (o online desenha a dele a partir do retrato)
function corridaDesenharBarra() {
  const b = document.getElementById("corridaRelogios");
  if (!b) return;
  const visivel = corridaAtiva() && starterChosen && !gameEnded;
  b.hidden = !visivel;
  if (!visivel) return;
  const html = corridaBarraHtml({
    geral: corridaGeralMs(),
    carta: cardState === "revealed" || cardState === "hidden" ? corridaCartaMs() : null,
    corre: !!corridaDesde,
    acabou: corridaAcabou,
    desempate: !!corridaDesempate,
  });
  if (html !== corridaBarraTxt) {
    corridaBarraTxt = html;
    b.innerHTML = html;
  }
}
// d = { geral, carta, corre, acabou, desempate } (o convidado monta o mesmo a partir do retrato)
function corridaBarraHtml(d) {
  const g = d.desempate
    ? `<span class="cr-geral cr-desempate">⚡ Desempate relâmpago</span>`
    : d.acabou
      ? `<span class="cr-geral cr-zerou">⏱️ 0:00 · última resposta</span>`
      : `<span class="cr-geral${d.geral <= 60e3 ? " cr-pouco" : ""}${d.corre ? "" : " cr-parado"}" title="Relógio geral da partida">⏱️ <b>${corridaRelogioTxt(d.geral)}</b></span>`;
  const c =
    d.carta === null || d.carta === undefined
      ? ""
      : `<span class="cr-carta${d.carta <= 30e3 ? " cr-pouco" : ""}" title="Tempo da carta">🃏 carta <b>${corridaRelogioTxt(d.carta)}</b></span>`;
  return g + c;
}

/* --- fim de carta, intervalo, fim de partida, desempate --- */
function corridaDepoisDaCarta() {
  renderScoreboard();
  renderMiniScoreboard();
  if (corridaDesempate) {
    const ultima = cartasPartida[cartasPartida.length - 1];
    if (ultima && ultima.quem) return endGame(); // quem acertou primeiro leva
    corridaDesempate.cartas--;
    if (corridaDesempate.cartas <= 0) return endGame(); // ninguém acertou: fica empate
    drawHidden();
    return;
  }
  if (corridaAcabou || deck.length === 0) return corridaEncerrar();
  corridaIntervaloPendente = true;
  drawHidden();
}
function corridaEncerrar() {
  if (gameEnded) return;
  const max = Math.max(0, ...players.map((p) => p.score || 0));
  const empatados = players.filter((p) => (p.score || 0) === max);
  if (empatados.length >= 2 && !corridaDesempateFeito && deck.length > 0) return corridaDesempateComecar(empatados);
  endGame();
}
function corridaPodeResponder(i) {
  return !corridaDesempate || (!!players[i] && corridaDesempate.ids.includes(players[i].id));
}
// No desempate o Mestre é quem não está empatado (se tiver); se todo mundo empatou, a roda segue
function corridaDesempateMestre(candidato) {
  if (!corridaDesempate) return candidato;
  for (let i = 0, c = candidato; i < players.length; i++, c = nextIndex(c)) if (!corridaPodeResponder(c)) return c;
  return candidato;
}
function corridaDesempateComecar(empatados) {
  corridaDesempateFeito = true;
  corridaIntervaloFechar();
  const ids = empatados.map((p) => p.id);
  const todos = empatados.length === players.length;
  // todo mundo empatado: cada um lê uma vez (no máximo), pra ninguém ficar sem responder
  corridaDesempate = { ids, cartas: todos ? empatados.length : 1 };
  // fichas de "rouba a vez" voltam pro estoque: no desempate, só a roda
  palpiteHolders = {};
  palpiteStock = Math.max(palpiteStock, 1);
  // a carta escondida (não aberta) volta pro baralho; a do desempate sai nova
  if (currentCard && cardState === "hidden") {
    const raw = cardsByAnswer.get(currentCard.answer);
    if (raw) deck.push(raw);
  }
  clearTimer();
  currentCard = null;
  cardState = "none";
  pendingIndex = null;
  revealedOrder = [];
  mestreIndex = corridaDesempateMestre(mestreIndex);
  responderIndex = nextResponder(mestreIndex, mestreIndex);
  caosLog("corrida", "desempate relâmpago: " + empatados.map((p) => p.name).join(", "));
  const nomes = empatados.map((p) => p.name).join(" × ");
  const V = REACTIVE_VOICE.corrida;
  const fala = (V && getRandomReaction(V.desempate, nomes)) || `⚡ DESEMPATE RELÂMPAGO! ${nomes}: uma carta, quem acertar primeiro leva.`;
  playSfx("flash");
  render();
  saveGameState();
  showToastMessage(fala, () => {
    if (!gameEnded && corridaDesempate && cardState === "none") drawHidden();
  }, true);
}

/* Intervalo de 15 s entre as cartas (relógio geral congelado): placar das cartas e a lista da partida. */
function corridaIntervaloTalvez() {
  if (!corridaIntervaloPendente) return;
  corridaIntervaloPendente = false;
  if (!corridaAtiva() || gameEnded || !starterChosen || cardState !== "hidden" || corridaDesempate) return;
  corridaIntervaloAbrir();
}
function corridaPlacarHtml() {
  const lista = corridaPlacar();
  const max = lista.length ? lista[0].score || 0 : 0;
  return `<ol class="cr-placar">${lista
    .map((p) => {
      const n = p.score || 0;
      return `<li class="${n === max && n > 0 ? "cr-lider" : ""}" style="--pc:${corDoJogador(p.color)}"><span>${playerNameHtml(p.name, p.color, p.avatar)}</span><b>${n} carta${n === 1 ? "" : "s"}</b></li>`;
    })
    .join("")}</ol>`;
}
function corridaIntervaloAbrir() {
  corridaIntervaloFechar();
  corridaDobrar();
  const m = players[mestreIndex];
  const ultima = cartasPartida[cartasPartida.length - 1];
  const ultimaTxt = !ultima
    ? ""
    : ultima.quem
      ? `✅ <b>${escapeHtml((jogadorPorId(ultima.quem) || {}).name || "Alguém")}</b> ficou com <b>${escapeHtml(ultima.resp)}</b> (${ultima.dicas} dica${ultima.dicas === 1 ? "" : "s"}) · +${CORRIDA_BONUS_MS / 1e3} s no relógio`
      : `❌ <b>${escapeHtml(ultima.resp)}</b> saiu sem dono`;
  const ov = document.createElement("div");
  ov.id = "corridaIntervalo";
  ov.className = "jf-modal-bg tb-lobby-bg";
  ov.innerHTML = `<div class="jf-modal tb-modal tb-lobby cr-intervalo" role="dialog" aria-modal="true" aria-labelledby="crIntTit">
    <div class="tb-lobby-topo"><h3 id="crIntTit">⏱️ Intervalo</h3><button type="button" class="btn-neo neo-solid neo-still tb-lobby-pular" id="crIntPular" style="--mc:#22d3ee; --mc-glow:rgba(34,211,238,0.35);">Próxima carta ▶</button></div>
    <div class="tb-lobby-tempo" aria-hidden="true"><div class="tb-lobby-barra" id="crIntBarra"></div></div>
    <div class="tb-lobby-sub">Relógio geral congelado em <b>${corridaRelogioTxt(corridaGeralMs())}</b> · <b id="crIntSeg">${CORRIDA_INTERVALO_SEG}</b> s</div>
    ${ultimaTxt ? `<div class="cr-ultima">${ultimaTxt}</div>` : ""}
    ${m ? `<div class="tb-lobby-prox">📖 Próximo Mestre: ${playerNameHtml(m.name, m.color, m.avatar)}</div>` : ""}
    ${corridaPlacarHtml()}
    <details class="cr-cartas"><summary>🃏 Cartas da partida</summary>${cartasPartidaHostHtml()}</details>
  </div>`;
  document.body.appendChild(ov);
  ov.querySelector("#crIntPular").addEventListener("click", corridaIntervaloFechar);
  let fim = Date.now() + CORRIDA_INTERVALO_SEG * 1e3,
    antes = Date.now();
  corridaIntervaloFim = fim;
  if (typeof redeHostPublicar === "function") redeHostPublicar(true);
  corridaIntervaloRelogio = setInterval(() => {
    const t = Date.now(),
      passou = t - antes;
    antes = t;
    if (!ov.isConnected || gameEnded || cardState !== "hidden") return corridaIntervaloFechar();
    if ((document.hidden && !(typeof salaOnlineAberta === "function" && salaOnlineAberta())) || pausaEstaAberta()) {
      fim += passou;
      corridaIntervaloFim = fim;
      return;
    }
    const resta = Math.max(0, fim - t);
    const seg = ov.querySelector("#crIntSeg"),
      barra = ov.querySelector("#crIntBarra");
    if (seg) seg.textContent = String(Math.ceil(resta / 1e3));
    if (barra) barra.style.width = ((resta / (CORRIDA_INTERVALO_SEG * 1e3)) * 100).toFixed(1) + "%";
    if (resta <= 0) corridaIntervaloFechar();
  }, 250);
}
function corridaIntervaloFechar() {
  clearInterval(corridaIntervaloRelogio);
  corridaIntervaloRelogio = null;
  const ov = document.getElementById("corridaIntervalo");
  if (!ov) return;
  ov.remove();
  corridaIntervaloFim = 0;
  if (typeof redeHostPublicar === "function") redeHostPublicar(true);
}

/* Regras na tela de cadastro (resumo e completas) */
function corridaRegrasHtml(resumo) {
  const min = CORRIDA_TEMPO_MS / 60e3,
    bonus = CORRIDA_BONUS_MS / 1e3,
    carta = corridaRelogioTxt(CORRIDA_CARTA_MS),
    vez = CORRIDA_VEZ_SEG;
  const li = [
    `🎯 <b>Objetivo:</b> quem acerta <b>fica com a carta</b>. Vence quem tiver mais cartas quando o relógio geral zerar. Não tem tabuleiro, pontos nem joias.`,
    `⏱️ <b>Relógio geral:</b> ${min} min. Cada carta acertada dá <b>+${bonus} s</b>. Zerou: a resposta que estava rolando termina e não sai carta nova.`,
    '🎙️ <b>Mestre:</b> roda a cada carta, como no Clássico. Fala a categoria e lê a dica pedida. <b>Nunca</b> fala a resposta.',
    `💬 <b>A vez:</b> segue a roda. ${vez} s pra escolher o número e ${vez} s pra responder. Errou ou o tempo acabou? Passa pro próximo.`,
    `🃏 <b>Carta:</b> ${carta} pra alguém acertar (não reinicia quando a vez passa). Acabou o tempo ou as 10 dicas? Sai sem dono.`,
  ];
  if (!resumo) {
    li.push(
      `☕ <b>Intervalo:</b> ${CORRIDA_INTERVALO_SEG} s entre as cartas pra ver o placar, com o relógio geral <b>congelado</b>. Dá pra pular.`,
      "⭐ <b>Especiais:</b> sem tabuleiro, as de andar casas saem. <b>Perca sua vez</b> passa a vez. <b>Rouba a vez</b> (o antigo Palpite a qualquer hora) dá uma ficha: quem tem pode responder fora da vez. Precisa de 3+ jogadores.",
      "⚡ <b>Empate no fim:</b> desempate relâmpago. Sai uma carta e só os empatados respondem: quem acertar primeiro leva. Ninguém acertou? Fica empate.",
      "⏸️ <b>Pausa:</b> pausar congela os dois relógios. As falas do C.A.O.S. também não comem o seu tempo.",
    );
  }
  return li.map((t) => "<li>" + t + "</li>").join("");
}

/* Online: os relógios vão no retrato como prazo (correndo) ou "quanto falta" (parado), na hora do host.
   Fica estável enquanto nada muda; o host republica quando um relógio para ou volta a correr. */
let corridaPublicado = "";
function corridaRetrato() {
  if (!corridaAtiva() || !starterChosen) return null;
  return {
    resta: corridaDesde ? null : Math.round(corridaRestaMs),
    fimEm: corridaDesde ? corridaDesde + corridaRestaMs : null,
    cartaResta: corridaCartaDesde ? null : Math.round(corridaCartaRestaMs),
    cartaFimEm: corridaCartaDesde ? corridaCartaDesde + corridaCartaRestaMs : null,
    acabou: corridaAcabou,
    desempate: !!corridaDesempate,
  };
}
// do retrato pro formato da barra (no convidado, na hora do host)
function corridaDoRetrato(c) {
  const agora = typeof redeAgora === "function" ? redeAgora() : Date.now();
  const ms = (fim, resta) => Math.max(0, fim ? fim - agora : resta || 0);
  return { geral: ms(c.fimEm, c.resta), carta: ms(c.cartaFimEm, c.cartaResta), corre: !!c.fimEm, acabou: !!c.acabou, desempate: !!c.desempate };
}
function corridaTalvezPublicar() {
  const k = [!!corridaDesde, !!corridaCartaDesde, corridaAcabou, !!corridaDesempate].join("|");
  if (k === corridaPublicado) return;
  corridaPublicado = k;
  if (typeof redeHostPublicar === "function") redeHostPublicar();
}
