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
// o relógio da carta pode correr mais rápido (Hardcore 1,5×, Duelo 2×): o "tempo de carta" é o real × velocidade
function corridaCartaMs() {
  return Math.max(0, corridaCartaRestaMs - (corridaCartaDesde ? (Date.now() - corridaCartaDesde) * corridaVelocidade() : 0));
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
    // tutorial, aviso ou janela do C.A.O.S. aberta: só congela no jogo local (no online, uma janela no host não
    // pode parar a sala inteira; quem pausa a sala é o botão Pausar)
    (caosJanelaImportanteAberta() && !(typeof salaOnlineAberta === "function" && salaOnlineAberta()))
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
  corridaEventosZerar();
}
function corridaIniciar() {
  if (!corridaAtiva()) return;
  corridaLojaPreparar();
  corridaTique = corridaTique || setInterval(corridaTicar, 250);
  corridaTicar();
}
// partida voltando do save: os relógios voltam do quanto faltava
function corridaRetomar(salvo) {
  if (!corridaAtiva() || !salvo) return;
  corridaRestaMs = Math.max(0, Math.min(Number(salvo.resta) || 0, 4 * 3600e3));
  corridaCartaRestaMs = Math.max(0, Math.min(Number(salvo.carta) || 0, CORRIDA_CARTA_MS + 120e3));
  corridaCartaDaVez = cartaSeq;
  corridaAcabou = !!salvo.acabou;
  corridaDesempateFeito = !!salvo.desempateFeito;
  corridaDesempate = salvo.desempate && Array.isArray(salvo.desempate.ids) ? { ids: salvo.desempate.ids.slice(0, 6), cartas: Number(salvo.desempate.cartas) || 1 } : null;
  corridaAvisos = salvo.avisos && typeof salvo.avisos === "object" ? salvo.avisos : {};
  corridaEventosRetomar(salvo.ev);
  corridaDesde = corridaCartaDesde = null;
  if (starterChosen && !gameEnded) corridaIniciar();
}
function corridaSalvar() {
  if (!corridaAtiva()) return null;
  return { resta: corridaGeralMs(), carta: corridaCartaMs(), acabou: corridaAcabou, desempate: corridaDesempate, desempateFeito: corridaDesempateFeito, avisos: corridaAvisos, ev: corridaEventosSalvar() };
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
    corridaCartaRestaMs = corridaCartaDuracao();
    corridaCartaDesde = null;
  }
  const parado = corridaParado();
  // o geral congela no desempate, no duelo e enquanto durar o "Pausa Dramática" da lojinha
  let geralCorre = !parado && !corridaAcabou && !corridaDesempate && !corridaDuelo && (cardState === "hidden" || cardState === "revealed");
  geralCorre = corridaCongelamento(geralCorre);
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
  corridaAvisarDerreteu();
  corridaEventosTique(parado);
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
  return corridaCartaMs() <= 0 || (corridaAcabou && !corridaDesempate) || corridaSemDicas === cartaSeq;
}
function corridaAvisarCartaPerdida() {
  const geral = corridaAcabou && !corridaDesempate;
  fxFloat(geral ? "⏱️ Acabou o tempo!" : "⌛ A carta acabou o tempo", "#fb923c");
  playSfx("erro");
  caosLog("corrida", geral ? "carta encerrada pelo relógio geral" : "carta perdeu no tempo (2:30)");
}
// +10 s no geral por acerto; a Bomba-Relógio desarmada dá +20 s; no Juízo Final e no duelo, nada
function corridaBonus() {
  if (!corridaAtiva() || corridaDesempate || corridaAcabou || corridaJuizo || corridaDuelo) return;
  corridaGeralMudar(corridaBombaAgora() ? CORRIDA_BOMBA_BONUS_MS : CORRIDA_BONUS_MS);
}
// soma (ou tira) tempo do relógio geral na hora; nunca abaixo de zero (zerou: a partida acaba como sempre)
function corridaGeralMudar(ms) {
  if (corridaDesde) corridaRestaMs = corridaGeralMs();
  corridaDesde = null;
  corridaRestaMs = Math.max(0, corridaRestaMs + ms);
}
// tira (ou põe) tempo do relógio da carta na hora
function corridaCartaMudar(ms) {
  if (corridaCartaDesde) corridaCartaRestaMs = corridaCartaMs();
  corridaCartaDesde = null;
  corridaCartaRestaMs = Math.max(0, corridaCartaRestaMs + ms);
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
// Corrida · Tempo: quando a carta entra nos 30 s finais, às vezes o C.A.O.S. comenta (uma vez por carta)
let corridaDerreteuCarta = -1;
function corridaAvisarDerreteu() {
  if (corridaVitoria !== "tempo" || cardState !== "revealed" || corridaDerreteuCarta === cartaSeq) return;
  const ms = corridaCartaMs();
  if (ms > 30e3 || ms < 25e3) return;
  corridaDerreteuCarta = cartaSeq;
  const V = REACTIVE_VOICE.corrida;
  if (V && V.derreteu && Math.random() < 0.5) {
    const fala = getRandomReaction(V.derreteu);
    if (fala) caosFalaAgendar(() => fala, 100, "baixa");
  }
}
function corridaLiderNome() {
  const top = corridaPlacar()[0];
  return top ? top.name : "alguém";
}
function corridaPlacar() {
  return players.slice().sort((a, b) => corridaRank(b) - corridaRank(a));
}
// Corrida em equipe: o placar é da equipe (soma do que cada um conquistou)
function corridaCartasEquipe(teamId) {
  return players.filter((p) => p.team === teamId).reduce((s, p) => s + corridaCartasDe(p), 0);
}
function corridaRankEquipe(teamId) {
  return teamScore(teamId) + (corridaVitoria === "tempo" ? Math.min(corridaCartasEquipe(teamId), 999) / 1000 : 0);
}
function corridaEntidades() {
  if (CURRENT_FORMAT !== "equipe") return corridaPlacar().map((p) => ({ k: p.id, html: playerNameHtml(p.name, p.color, p.avatar), cor: corDoJogador(p.color), rank: corridaRank(p), txt: corridaValorTxt(p) }));
  return teamOrder
    .map((id) => {
      const info = TEAM_INFO[id],
        n = corridaCartasEquipe(id);
      const cartas = `${n} carta${n === 1 ? "" : "s"}`;
      return { k: id, html: `${info.emoji} Equipe ${escapeHtml(info.label)}`, cor: corDoJogador(info.color), rank: corridaRankEquipe(id), txt: corridaVitoria === "tempo" ? `${teamScore(id)} pts · ${cartas}` : cartas };
    })
    .sort((a, b) => b.rank - a.rank);
}
/* Pontuação (decisão do JF, 17/10): na Corrida · Tempo a carta vale os segundos que sobravam no relógio dela na hora
   do acerto (acertou com 1:45 sobrando = 105 pontos); na Corrida · Cartas, cada carta vale 1. */
function corridaValorCarta() {
  return corridaVitoria === "tempo" ? Math.max(1, Math.ceil(corridaCartaMs() / 1e3)) : 1;
}
function corridaCartasDe(p) {
  return p ? cartasPartida.filter((c) => c.quem === p.id).length : 0;
}
// pra ordenar: no Tempo, empate em pontos desempata por quem tem mais cartas (fração nunca chega a 1)
function corridaRank(p) {
  if (!p) return 0;
  return (p.score || 0) + (corridaVitoria === "tempo" ? Math.min(corridaCartasDe(p), 999) / 1000 : 0);
}
function corridaValorTxt(p) {
  const n = corridaCartasDe(p);
  const cartas = `${n} carta${n === 1 ? "" : "s"}`;
  return corridaVitoria === "tempo" ? `${p.score || 0} pts · ${cartas}` : cartas;
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
    tempo: corridaVitoria === "tempo",
    juizo: corridaJuizo,
    bomba: corridaBombaAgora(),
    duelo: !!corridaDuelo,
    vel: corridaVelocidade(),
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
  // Tempo: o valor da carta derretendo na tela (acertou agora, leva isso)
  const v =
    d.tempo && d.carta !== null && d.carta !== undefined
      ? `<span class="cr-vale${d.carta <= 30e3 ? " cr-pouco" : ""}" title="Quanto a carta vale se acertar agora">💰 vale <b>${Math.max(1, Math.ceil(d.carta / 1e3))}</b></span>`
      : "";
  const ev =
    (d.bomba ? `<span class="cr-ev cr-ev-bomba">💣 BOMBA</span>` : "") +
    (d.duelo ? `<span class="cr-ev cr-ev-duelo">⚔️ DUELO · carta 2×</span>` : "") +
    (d.juizo && !d.acabou ? `<span class="cr-ev cr-ev-juizo">⚖️ JUÍZO FINAL</span>` : "") +
    (!d.duelo && d.vel > 1 ? `<span class="cr-ev">💀 ${d.vel}×</span>` : "");
  return g + c + v + ev;
}

/* --- fim de carta, intervalo, fim de partida, desempate --- */
function corridaDepoisDaCarta() {
  renderScoreboard();
  renderMiniScoreboard();
  if (corridaDuelo) corridaDueloFim();
  if (corridaDesempate) {
    const ultima = cartasPartida[cartasPartida.length - 1];
    if (ultima && ultima.quem) return endGame(); // quem acertou primeiro leva
    corridaDesempate.cartas--;
    if (corridaDesempate.cartas <= 0) return endGame(); // ninguém acertou: fica empate
    drawHidden();
    return;
  }
  if (corridaAcabou || deck.length === 0) return corridaEncerrar();
  // o C.A.O.S. pode chamar um duelo antes da próxima carta (ele mesmo puxa a carta depois do anúncio)
  if (corridaDueloTalvez()) return;
  corridaBombaTalvez();
  corridaIntervaloPendente = true;
  drawHidden();
}
function corridaEncerrar() {
  if (gameEnded) return;
  const max = Math.max(0, ...players.map((p) => p.score || 0));
  const empatados = players.filter((p) => (p.score || 0) === max);
  if (CURRENT_FORMAT !== "equipe" && corridaVitoria === "cartas" && empatados.length >= 2 && !corridaDesempateFeito && deck.length > 0) return corridaDesempateComecar(empatados);
  endGame();
}
// desempate e duelo: só os escolhidos respondem
function corridaRestritos() {
  return corridaDuelo ? corridaDuelo.ids : corridaDesempate ? corridaDesempate.ids : null;
}
function corridaPodeResponder(i) {
  const r = corridaRestritos();
  return !r || (!!players[i] && r.includes(players[i].id));
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
  const lista = corridaEntidades();
  const max = lista.length ? lista[0].rank : 0;
  return `<ol class="cr-placar">${lista
    .map((e) => {
      return `<li class="${e.rank === max && max > 0 ? "cr-lider" : ""}" style="--pc:${e.cor}"><span>${e.html}</span><b>${e.txt}</b></li>`;
    })
    .join("")}</ol>`;
}
function corridaIntervaloAbrir() {
  corridaIntervaloFechar();
  corridaDobrar();
  corridaLojaPreparar(); // a sala pode ter aberto depois do começo da partida
  const m = players[mestreIndex];
  const ultima = cartasPartida[cartasPartida.length - 1];
  const ultimaTxt = !ultima
    ? ""
    : ultima.quem
      ? `✅ <b>${escapeHtml((jogadorPorId(ultima.quem) || {}).name || "Alguém")}</b> ficou com <b>${escapeHtml(ultima.resp)}</b> (${ultima.dicas} dica${ultima.dicas === 1 ? "" : "s"}${ultima.pts ? ` · <b>+${ultima.pts} pts</b>` : ""}) · +${CORRIDA_BONUS_MS / 1e3} s no relógio`
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
    ${corridaBombaAgora() ? `<div class="cr-aviso-bomba">💣 A próxima carta é uma <b>BOMBA-RELÓGIO</b>: cada erro tira ${CORRIDA_BOMBA_ERRO_MS / 1e3} s do relógio; se ela morrer, −1 min.</div>` : ""}
    ${corridaPlacarHtml()}
    <div id="crLojaHost">${corridaLojaHostHtml()}</div>
    <details class="cr-cartas"><summary>🃏 Cartas da partida</summary>${cartasPartidaHostHtml()}</details>
  </div>`;
  document.body.appendChild(ov);
  ov.querySelector("#crIntPular").addEventListener("click", corridaIntervaloFechar);
  // a lojinha só libera com o intervalo aberto na tela: redesenha agora que ele existe
  corridaIntervaloRedesenharLoja();
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
    hc = corridaHardcore,
    carta = corridaRelogioTxt(hc ? CORRIDA_CARTA_HC_MS : CORRIDA_CARTA_MS),
    vez = hc ? CORRIDA_VEZ_HC_SEG : CORRIDA_VEZ_SEG,
    tempo = corridaVitoria === "tempo";
  const li = [
    tempo
      ? `🎯 <b>Objetivo (⏱️ Tempo):</b> a carta vale <b>os segundos que sobravam no relógio dela</b> na hora do acerto (acertou com 1:05 sobrando = 65 pontos). Vence quem somar mais pontos quando o relógio geral zerar.`
      : `🎯 <b>Objetivo (🃏 Cartas):</b> quem acerta <b>fica com a carta</b> e cada carta vale 1. Vence quem tiver mais cartas quando o relógio geral zerar.`,
    `⏱️ <b>Relógio geral:</b> ${min} min. Acertou: <b>+${bonus} s</b>. Carta que morre sem acerto: <b>−1 min</b> pra mesa toda. Zerou: a resposta que estava rolando termina e acabou.`,
    hc
      ? `💀 <b>Hardcore:</b> a carta tem ${carta} e o relógio dela corre <b>1,5×</b>. As dicas abrem sozinhas: quem souber, <b>bate na mesa</b> (no online, o botão no dispositivo) e responde. Errou, a próxima abre na hora.`
      : `💬 <b>A vez:</b> segue a roda. ${vez} s pra escolher o número e ${vez} s pra responder. A carta tem ${carta} e não reinicia quando a vez passa.`,
    `❌ <b>Errou:</b> a carta perde 1 s. <b>Pulou</b> (nem tentou): perde 2 s.`,
    '🎙️ <b>Mestre:</b> roda a cada carta. Fala a categoria e lê a dica. <b>Nunca</b> fala a resposta.',
  ];
  if (!resumo) {
    li.push(
      `💣 <b>Bomba-Relógio:</b> de vez em quando o jogo arma uma carta (e o C.A.O.S. anuncia como se fosse ideia dele) (${hc ? CORRIDA_BOMBA_QUOTA.hardcore : CORRIDA_BOMBA_QUOTA.normal} por partida). Cada erro tira ${CORRIDA_BOMBA_ERRO_MS / 1e3} s do relógio geral; desarmar dá <b>+${CORRIDA_BOMBA_BONUS_MS / 1e3} s</b>; se ela morrer, BOOM: −1 min.`,
      `⚔️ <b>Duelo:</b> até ${CORRIDA_DUELO_MAX} por partida (3+ jogadores), o jogo sorteia dois duelistas e o Mestre (o C.A.O.S. faz o show). O relógio geral para, a carta corre <b>2×</b> e só os dois respondem. ${tempo ? `Quem vence rouba ${CORRIDA_DUELO_ROUBO} pontos do outro. ` : ""}Ninguém acertou? Carta destruída.`,
      "⚖️ <b>Juízo Final:</b> no último minuto as dicas abrem sozinhas e qualquer um bate na mesa. Acertar não dá mais tempo.",
      `☕ <b>Intervalo:</b> ${CORRIDA_INTERVALO_SEG} s entre as cartas pra ver o placar, com o relógio geral <b>congelado</b>.${tempo ? ` <b>No online</b>, é a hora da 🛒 <b>Lojinha de Sobrevivência</b>, uma só pra mesa toda (quem comprar primeiro leva): gaste pontos nos itens da vitrine, que muda a cada intervalo (${Object.values(CORRIDA_LOJA).map((it) => it.ic + " " + it.nome).join(", ")}; estoque limitado).` : ""}`,
      hc ? "⭐ <b>Especiais:</b> no Hardcore não tem (as dicas abrem sozinhas)." : "⭐ <b>Especiais:</b> sem tabuleiro, as de andar casas saem. <b>Perca sua vez</b> passa a vez. <b>Rouba a vez</b> (o antigo Palpite a qualquer hora) dá uma ficha pra responder fora da vez (3+ jogadores).",
      tempo
        ? "⚖️ <b>Empate no fim:</b> vence quem tiver mais cartas; empatou de novo, vitória dividida. Na tela final ainda saem as coroas de ⏱️ <b>Senhor do Tempo</b> e 🃏 <b>Colecionador</b>."
        : "⚡ <b>Empate no fim:</b> desempate relâmpago (uma carta, só os empatados respondem). Na tela final sai a coroa de 🃏 <b>Colecionador</b>.",
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
    cartaFimEm: corridaCartaDesde ? Math.round(corridaCartaDesde + corridaCartaRestaMs / corridaVelocidade()) : null,
    acabou: corridaAcabou,
    desempate: !!corridaDesempate,
    vitoria: corridaVitoria,
    cartas: Object.fromEntries(players.map((p) => [p.id, corridaCartasDe(p)])),
    hardcore: corridaHardcore,
    juizo: corridaJuizo,
    bomba: corridaBombaAgora(),
    duelo: corridaDuelo ? corridaDuelo.ids.slice() : null,
    vel: corridaVelocidade(),
    estoque: corridaEstoque ? { ...corridaEstoque } : null,
    precos: corridaEstoque ? { ...corridaPrecos } : null,
  };
}
// do retrato pro formato da barra (no convidado, na hora do host)
function corridaDoRetrato(c) {
  const agora = typeof redeAgora === "function" ? redeAgora() : Date.now();
  const ms = (fim, resta) => Math.max(0, fim ? fim - agora : resta || 0);
  const vel = c.vel || 1;
  const carta = c.cartaFimEm ? Math.max(0, (c.cartaFimEm - agora) * vel) : c.cartaResta || 0;
  return { geral: ms(c.fimEm, c.resta), carta, corre: !!c.fimEm, acabou: !!c.acabou, desempate: !!c.desempate, tempo: c.vitoria === "tempo", juizo: !!c.juizo, bomba: !!c.bomba, duelo: !!c.duelo, vel };
}
function corridaTalvezPublicar() {
  const k = [!!corridaDesde, !!corridaCartaDesde, corridaAcabou, !!corridaDesempate].join("|");
  if (k === corridaPublicado) return;
  corridaPublicado = k;
  if (typeof redeHostPublicar === "function") redeHostPublicar();
}

// placar da T2 / dispositivos (a partir do retrato)
function corridaValorRetrato(r, j) {
  const n = (r.corrida && r.corrida.cartas && r.corrida.cartas[j.id]) || 0;
  const cartas = `${n} carta${n === 1 ? "" : "s"}`;
  return r.corrida && r.corrida.vitoria === "tempo" ? `⏱️ ${j.pontos} pts · ${cartas}` : `🃏 ${cartas}`;
}
