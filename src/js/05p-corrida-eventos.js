/* --- 1.7.10.6 · CORRIDA: EVENTOS (spec do JF de 17/10 à noite, com o balanceamento em docs/Modos_1.7.10.6.md) ---
 *  · Penalidades: errou, a carta perde 1 s; pulou ("nem tentou"), perde 2 s. Carta que morre sem acerto: o geral
 *    perde 1 min (o Seguro do Relógio segura; no duelo e no desempate não vale).
 *  · Bomba-Relógio: o C.A.O.S. anuncia antes da carta. Cada erro/pulo tira 5 s do geral; desarmar dá +20 s.
 *  · Juízo Final: no último minuto as dicas abrem sozinhas e qualquer um bate na mesa (sem os +10 s por acerto).
 *  · Hardcore: carta de 1:30 correndo 1,5×, as dicas abrem sozinhas o jogo todo, mais bombas.
 *  · Duelo: o jogo sorteia 2 duelistas e o Mestre; o geral congela, a carta corre 2×, quem vence rouba 25.
 * Quem sorteia bomba e duelo é o JOGO (regra do JF): na Corrida o C.A.O.S. é só o mestre de cerimônias e anuncia
 * como se a ideia fosse dele. Os anúncios furam o mudo (é informação de regra), mesmo com ele calado.
 *  · Lojinha de Sobrevivência (só online, só Tempo): no intervalo, gasta pontos em 5 itens com estoque limitado.
 * O "relâmpago" (Hardcore e Juízo Final) reaproveita o Palpitar agora: todo mundo tem o direito de bater na mesa. */
let corridaJuizo = false; // entrou no último minuto
let corridaBomba = -1; // cartaSeq da carta que é Bomba-Relógio
let corridaBombaProxima = false;
let corridaBombas = 0;
let corridaDuelo = null; // { ids: [2 duelistas], mestreAntes, carta }
let corridaDuelos = 0;
let corridaUltimoEvento = 0; // stats.totalDrawn do último evento (bomba/duelo), pra espaçar
let corridaSemDicas = -1; // cartaSeq da carta que ficou sem dica no relâmpago (acaba como esgotada)
let corridaCongelaMs = 0; // Pausa Dramática (lojinha): quanto do geral ainda fica congelado
let corridaCongelaTique = 0;
let corridaEscudo = -1; // cartaSeq que o Seguro do Relógio protege
let corridaFolego = {}; // id → cartaSeq em que a pessoa tem +15 s nas vezes
let corridaItens = {}; // id → { corte: n, desfib: n }
let corridaEstoque = null; // { item: unidades } (só com a lojinha ligada; só os itens da vitrine deste intervalo)
let corridaPrecos = {}; // { item: preço } da vitrine deste intervalo
let corridaCofrinho = {}; // id → cofrinhos guardados (cada um: +CORRIDA_COFRINHO_PTS no próximo acerto da pessoa)
let corridaIma = {}; // id → cartaSeq em que o Ímã de Pontos vale
let corridaTiqueSom = 0;

function corridaEventosZerar() {
  corridaJuizo = false;
  corridaBomba = -1;
  corridaBombaProxima = false;
  corridaBombas = 0;
  corridaDuelo = null;
  corridaDuelos = 0;
  corridaUltimoEvento = 0;
  corridaSemDicas = -1;
  corridaCongelaMs = 0;
  corridaEscudo = -1;
  corridaFolego = {};
  corridaItens = {};
  corridaEstoque = null;
  corridaPrecos = {};
  corridaCofrinho = {};
  corridaIma = {};
  document.body.classList.remove("cr-juizo", "cr-bomba", "cr-duelo");
}
function corridaEventosSalvar() {
  return {
    juizo: corridaJuizo,
    bomba: corridaBomba === cartaSeq ? 1 : 0,
    bombas: corridaBombas,
    duelo: corridaDuelo,
    duelos: corridaDuelos,
    ult: corridaUltimoEvento,
    congela: corridaCongelaMs,
    escudo: corridaEscudo === cartaSeq ? 1 : 0,
    folego: Object.keys(corridaFolego).filter((k) => corridaFolego[k] === cartaSeq),
    itens: corridaItens,
    estoque: corridaEstoque,
    precos: corridaPrecos,
    cofrinho: corridaCofrinho,
    ima: Object.keys(corridaIma).filter((k) => corridaIma[k] === cartaSeq),
  };
}
function corridaEventosRetomar(e) {
  corridaEventosZerar();
  if (!e || typeof e !== "object") return;
  const n = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
  corridaJuizo = !!e.juizo;
  corridaBomba = e.bomba ? cartaSeq : -1;
  corridaBombas = n(e.bombas, 10);
  corridaDuelos = n(e.duelos, 10);
  corridaUltimoEvento = n(e.ult, 999);
  corridaCongelaMs = n(e.congela, 120e3);
  corridaEscudo = e.escudo ? cartaSeq : -1;
  if (Array.isArray(e.folego)) e.folego.slice(0, 10).forEach((id) => (corridaFolego[String(id)] = cartaSeq));
  if (e.duelo && Array.isArray(e.duelo.ids) && e.duelo.ids.length === 2)
    corridaDuelo = { ids: e.duelo.ids.map(String), mestreAntes: n(e.duelo.mestreAntes, 9), carta: e.duelo.carta };
  if (e.itens && typeof e.itens === "object")
    Object.keys(e.itens)
      .slice(0, 10)
      .forEach((id) => (corridaItens[String(id)] = { corte: n(e.itens[id] && e.itens[id].corte, 5), desfib: n(e.itens[id] && e.itens[id].desfib, 5) }));
  if (e.estoque && typeof e.estoque === "object") {
    corridaEstoque = {};
    Object.keys(CORRIDA_LOJA).forEach((k) => {
      if (e.estoque[k] === undefined) return;
      corridaEstoque[k] = n(e.estoque[k], 5);
      corridaPrecos[k] = e.precos && e.precos[k] ? n(e.precos[k], 500) : CORRIDA_LOJA[k].preco;
    });
  }
  if (e.cofrinho && typeof e.cofrinho === "object") Object.keys(e.cofrinho).slice(0, 10).forEach((id) => (corridaCofrinho[String(id)] = n(e.cofrinho[id], 9)));
  if (Array.isArray(e.ima)) e.ima.slice(0, 10).forEach((id) => (corridaIma[String(id)] = cartaSeq));
  corridaClassesCorpo();
}

/* --- velocidades e durações --- */
function corridaVelocidade() {
  return corridaDuelo ? CORRIDA_DUELO_VEL : corridaHardcore ? CORRIDA_VEL_HC : 1;
}
function corridaCartaDuracao() {
  return corridaHardcore ? CORRIDA_CARTA_HC_MS : CORRIDA_CARTA_MS;
}
// mudar a velocidade (duelo começando/acabando) sem pular tempo: dobra o que correu antes
function corridaTrocarVelocidade(fn) {
  corridaDobrar();
  fn();
}
function corridaRelampago() {
  return CURRENT_MODE === "corrida" && (corridaHardcore || corridaJuizo);
}
function corridaBombaAgora() {
  return CURRENT_MODE === "corrida" && corridaBomba === cartaSeq && !!currentCard;
}
// prazos da vez: Hardcore 10+10 s; relâmpago: a janela da dica; Segundo Fôlego (lojinha): +15 s pra quem comprou
function corridaAjustarVez(dur, kind) {
  if (corridaHardcore) {
    dur.pick = Math.min(dur.pick, CORRIDA_VEZ_HC_SEG + acessTempoExtra("pick"));
    dur.response = Math.min(dur.response, CORRIDA_VEZ_HC_SEG + acessTempoExtra("response"));
  }
  if (corridaRelampago()) dur.response = CORRIDA_JANELA_SEG + acessTempoExtra("response");
  const r = players[responderIndex];
  if (r && corridaFolego[r.id] === cartaSeq && (kind === "pick" || kind === "response") && !corridaRelampago()) {
    dur.pick += 15;
    dur.response += 15;
  }
}
// Pausa Dramática: enquanto tiver saldo, o geral não corre (o saldo gasta no lugar dele)
function corridaCongelamento(geralCorre) {
  const agora = Date.now();
  const passou = corridaCongelaTique ? agora - corridaCongelaTique : 0;
  corridaCongelaTique = agora;
  if (!geralCorre || corridaCongelaMs <= 0) return geralCorre;
  corridaCongelaMs = Math.max(0, corridaCongelaMs - Math.min(passou, 1000));
  return false;
}

/* --- tique: Juízo Final, tic-tac da bomba, classes da tela --- */
function corridaEventosTique(parado) {
  if (!corridaJuizo && !corridaAcabou && !corridaDesempate && !corridaDuelo && starterChosen && corridaGeralMs() <= CORRIDA_JUIZO_MS) corridaJuizoComecar();
  if (corridaBombaAgora() && cardState === "revealed" && !parado && Date.now() - corridaTiqueSom >= 1000) {
    corridaTiqueSom = Date.now();
    playSfx(Math.floor(corridaTiqueSom / 1000) % 2 ? "tique" : "taque");
  }
  corridaClassesCorpo();
}
function corridaClassesCorpo() {
  const ativa = CURRENT_MODE === "corrida" && starterChosen && !gameEnded;
  document.body.classList.toggle("cr-juizo", ativa && corridaJuizo && !corridaAcabou);
  document.body.classList.toggle("cr-bomba", ativa && corridaBombaAgora());
  document.body.classList.toggle("cr-duelo", ativa && !!corridaDuelo);
}
function corridaJuizoComecar() {
  corridaJuizo = true;
  caosLog("corrida", "Juízo Final: último minuto, dicas abrem sozinhas");
  playSfx("erroForte");
  vibrar("tempo");
  const V = REACTIVE_VOICE.corrida;
  const fala = (V && V.juizo && getRandomReaction(V.juizo)) || "⚖️ JUÍZO FINAL! Último minuto: as dicas abrem sozinhas. Sabe? Bate na mesa!";
  showToastMessage(fala, null, true, true);
  // carta esperando a escolha da dica: já abre a próxima sozinha
  corridaRelampagoAgendar();
  corridaClassesCorpo();
}

/* --- penalidades --- */
function corridaPenalidade(tipo) {
  if (CURRENT_MODE !== "corrida" || !currentCard) return;
  const pulou = tipo === "pular";
  corridaCartaMudar(-(pulou ? CORRIDA_PULO_MS : CORRIDA_ERRO_MS));
  fxFloat(pulou ? "⏭️ −2 s na carta" : "❌ −1 s na carta", "#fb923c");
  if (corridaBombaAgora()) {
    corridaGeralMudar(-CORRIDA_BOMBA_ERRO_MS);
    fxFloat(`💣 −${CORRIDA_BOMBA_ERRO_MS / 1e3} s no relógio`, "#f87171");
  }
}
// carta morta sem acerto: −1 min no geral (Seguro do Relógio segura; no duelo e no desempate não vale)
function corridaCartaMorreu() {
  if (corridaDuelo || corridaDesempate || corridaAcabou) return;
  const bomba = corridaBombaAgora();
  if (corridaEscudo === cartaSeq) {
    corridaEscudo = -1;
    fxFloat(`${CORRIDA_LOJA.escudo.ic} ${CORRIDA_LOJA.escudo.nome} segurou o −1 min!`, "#38bdf8");
    caosLog("corrida", "Seguro do Relógio absorveu a carta morta");
    return;
  }
  corridaGeralMudar(-CORRIDA_MORTE_MS);
  fxFloat(bomba ? "💥 BOOM! −1 min no relógio" : "💀 Carta morta: −1 min no relógio", "#f87171");
  if (bomba) {
    flashScreen("red");
    fxShake();
    vibrar("absurdo");
  }
  caosLog("corrida", bomba ? "Bomba-Relógio explodiu: −1 min" : "carta morta: −1 min");
  const V = REACTIVE_VOICE.corrida;
  const lista = V && (bomba ? V.explodiu : V.morreu);
  if (lista) {
    const fala = getRandomReaction(lista);
    if (fala) caosFalaAgendar(() => fala, 900, bomba ? "sempre" : "baixa");
  }
}

/* --- Bomba-Relógio --- */
function corridaBombaTalvez() {
  if (corridaHardcore ? corridaBombas >= CORRIDA_BOMBA_QUOTA.hardcore : corridaBombas >= CORRIDA_BOMBA_QUOTA.normal) return;
  if (stats.totalDrawn < 3 || stats.totalDrawn - corridaUltimoEvento < 3 || corridaGeralMs() <= CORRIDA_EVENTO_FORA_MS) return;
  if (sorteioRegra() >= (corridaHardcore ? 0.3 : 0.15)) return;
  corridaBombaProxima = true;
}
// chamado quando a próxima carta ficou pronta (fim do drawHidden)
function corridaBombaArmar() {
  if (!corridaBombaProxima || !currentCard) return false;
  corridaBombaProxima = false;
  corridaBomba = cartaSeq;
  corridaBombas++;
  corridaUltimoEvento = stats.totalDrawn;
  caosLog("corrida", "Bomba-Relógio armada na carta " + stats.totalDrawn);
  playSfx("erroForte");
  const V = REACTIVE_VOICE.corrida;
  const fala =
    (V && V.bomba && getRandomReaction(V.bomba)) ||
    `💣 BOMBA-RELÓGIO! Se essa carta morrer, a mesa perde 1 minuto. Cada erro tira ${CORRIDA_BOMBA_ERRO_MS / 1e3} s. Acertou? +${CORRIDA_BOMBA_BONUS_MS / 1e3} s.`;
  setTimeout(() => !gameEnded && corridaBomba === cartaSeq && showToastMessage(fala, null, true), 400); // fura o mudo: é regra
  corridaClassesCorpo();
  return true;
}

/* --- relâmpago (Hardcore / Juízo Final): a dica abre sozinha e qualquer um bate na mesa --- */
let corridaRelampagoTimer = null;
function corridaRelampagoAgendar() {
  if (!corridaRelampago()) return;
  clearTimeout(corridaRelampagoTimer);
  const seq = cartaSeq;
  corridaRelampagoTimer = setTimeout(() => {
    if (seq !== cartaSeq || gameEnded || cardState !== "revealed" || pendingIndex !== null || !corridaRelampago()) return;
    if (activeToastState || timeoutOverlayMessage || pausedAt) return corridaRelampagoAgendar(); // espera a fala/aviso
    corridaAbrirSozinha();
  }, 900);
}
function corridaAbrirSozinha() {
  if (!currentCard) return;
  const idx = currentCard.clues.findIndex((c, i) => c.type === "clue" && !revealedOrder.some((r) => r.index === i));
  if (idx < 0) {
    corridaSemDicas = cartaSeq; // acabaram as dicas de verdade: a carta morre no próximo tique
    return;
  }
  chooseClue(idx);
}
function corridaRelampagoProxima() {
  if (gameEnded || !currentCard) return;
  clearTimer();
  palpiteVez = null;
  pendingIndex = null;
  if (!resolveExhaustionIfNeeded()) {
    startTimer("pick");
    render();
    saveGameState();
  }
}
// bateu na mesa e errou: −1 s na carta (e −5 s no geral se for bomba) e a próxima dica abre na hora
function corridaRelampagoErrou(key) {
  const i = jogadorIdxPorId(key);
  const p = players[i];
  corridaPenalidade(null);
  if (p) {
    p.errosPartida = (p.errosPartida || 0) + 1;
    fxPop("❌");
    playSfx("erro");
    caosLog("corrida", `${p.name} bateu na mesa e errou`);
  }
  corridaRelampagoProxima();
}

/* --- Duelo do C.A.O.S. --- */
function corridaDueloTalvez() {
  if (CURRENT_FORMAT === "equipe" || players.length < 3 || corridaDuelos >= CORRIDA_DUELO_MAX || corridaJuizo || corridaDesempate) return false;
  if (stats.totalDrawn < 5 || stats.totalDrawn - corridaUltimoEvento < 4 || corridaGeralMs() <= CORRIDA_EVENTO_FORA_MS) return false;
  if (sorteioRegra() >= 0.12) return false;
  corridaDueloComecar();
  return true;
}
function corridaDueloComecar() {
  const ordem = shuffle(players.map((p, i) => i));
  const [a, b, m] = ordem;
  corridaTrocarVelocidade(() => {
    corridaDuelo = { ids: [players[a].id, players[b].id], mestreAntes: mestreIndex, carta: null };
  });
  corridaDuelos++;
  corridaUltimoEvento = stats.totalDrawn;
  clearTimer();
  currentCard = null;
  cardState = "none";
  pendingIndex = null;
  revealedOrder = [];
  mestreIndex = m;
  responderIndex = a;
  caosLog("corrida", `duelo: ${players[a].name} × ${players[b].name}, Mestre ${players[m].name}`);
  const V = REACTIVE_VOICE.corrida;
  const nomes = `${players[a].name} e ${players[b].name}`;
  const fala =
    (V && V.duelo && getRandomReaction(V.duelo, nomes, players[m].name)) ||
    `⚔️ É HORA DO DUELO! ${nomes} pro ringue, ${players[m].name} lê a carta. O relógio da mesa para e a carta corre em dobro. Quem vencer rouba ${CORRIDA_DUELO_ROUBO} pontos!`;
  playSfx("flash");
  corridaClassesCorpo();
  render();
  saveGameState();
  showToastMessage(fala, () => {
    if (!gameEnded && corridaDuelo && cardState === "none") drawHidden();
  }, true);
}
// (chamado no fim da carta do duelo, antes de seguir) quem acertou rouba; ninguém: carta destruída
function corridaDueloFim() {
  const d = corridaDuelo;
  const ultima = cartasPartida[cartasPartida.length - 1];
  const venc = ultima && ultima.quem && d.ids.includes(ultima.quem) ? jogadorPorId(ultima.quem) : null;
  const perd = venc ? jogadorPorId(d.ids.find((id) => id !== venc.id)) : null;
  const V = REACTIVE_VOICE.corrida;
  let fala = "";
  if (venc && perd && corridaVitoria === "tempo") {
    const roubo = Math.min(CORRIDA_DUELO_ROUBO, perd.score || 0);
    perd.score = (perd.score || 0) - roubo;
    venc.score = (venc.score || 0) + roubo;
    if (roubo) fxFloat(`⚔️ ${venc.name} roubou ${roubo} de ${perd.name}!`, "#fbbf24");
    fala = (V && V.dueloVenceu && getRandomReaction(V.dueloVenceu, venc.name, perd.name)) || "";
  } else if (venc) {
    fala = (V && V.dueloVenceu && getRandomReaction(V.dueloVenceu, venc.name, perd ? perd.name : "o outro")) || "";
  } else {
    const nomes = d.ids.map((id) => (jogadorPorId(id) || {}).name || "?").join(" e ");
    fala = (V && V.dueloNinguem && getRandomReaction(V.dueloNinguem, nomes)) || `🔥 ${nomes} erraram tudo. Carta destruída. Que vergonha alheia.`;
  }
  caosLog("corrida", venc ? `duelo vencido por ${venc.name}` : "duelo sem vencedor: carta destruída");
  corridaTrocarVelocidade(() => (corridaDuelo = null));
  mestreIndex = d.mestreAntes < players.length ? d.mestreAntes : 0;
  responderIndex = nextResponder(mestreIndex, mestreIndex);
  corridaClassesCorpo();
  if (fala) caosFalaAgendar(() => fala, 600, "sempre");
}

/* --- Lojinha de Sobrevivência (online · Tempo · no intervalo) --- */
function corridaLojaLigada() {
  return CURRENT_MODE === "corrida" && corridaVitoria === "tempo" && typeof salaOnlineAberta === "function" && salaOnlineAberta();
}
/* 1.7.10.6 (pedido do JF): vitrine sorteada (Corrida e Modo C.A.O.S.): n itens do catálogo (pelo peso), 1 a 3 de
   cada ("max" no catálogo limita: os itens que dão tempo saem 1 só, senão a partida esticava sem fim), preço
   variando ±20% de 5 em 5 (mínimo 5). Devolve { estoque: { item: unidades }, precos: { item: preço } }. */
function lojaVitrineSortear(catalogo, n) {
  const bolsa = Object.keys(catalogo).map((k) => ({ k, w: catalogo[k].peso || 1 }));
  const estoque = {},
    precos = {};
  for (let i = 0; i < n && bolsa.length; i++) {
    const tot = bolsa.reduce((s, x) => s + x.w, 0);
    let r = sorteioRegra() * tot,
      j = 0;
    while (j < bolsa.length - 1 && r >= bolsa[j].w) r -= bolsa[j++].w;
    const k = bolsa.splice(j, 1)[0].k;
    estoque[k] = Math.min(catalogo[k].max || 3, 1 + Math.floor(sorteioRegra() * 3)); // max: itens de tempo, 1 por intervalo
    const fator = [0.8, 0.9, 1, 1, 1.1, 1.2][Math.floor(sorteioRegra() * 6)];
    precos[k] = Math.max(5, Math.round((catalogo[k].preco * fator) / 5) * 5);
  }
  return { estoque, precos };
}
// a cada intervalo a vitrine é outra (o que sobrou da anterior some)
function corridaLojaPreparar() {
  if (!corridaLojaLigada()) return;
  const v = lojaVitrineSortear(CORRIDA_LOJA, CORRIDA_VITRINE);
  corridaEstoque = v.estoque;
  corridaPrecos = v.precos;
  caosLog("corrida", "vitrine da lojinha: " + Object.keys(v.estoque).map((k) => `${CORRIDA_LOJA[k].nome} ${v.precos[k]}×${v.estoque[k]}`).join(", "));
}
function corridaPreco(item) {
  return corridaPrecos[item] || (CORRIDA_LOJA[item] || {}).preco || 0;
}
function corridaPodeComprar(item, id) {
  const it = CORRIDA_LOJA[item],
    p = jogadorPorId(id);
  if (!it || !p || !corridaLojaLigada() || !corridaIntervaloAberto() || !corridaEstoque) return false;
  if ((corridaEstoque[item] || 0) <= 0 || (p.score || 0) < corridaPreco(item)) return false;
  if (item === "ima" && corridaIma[id] === cartaSeq) return false;
  if (item === "escudo" && corridaEscudo === cartaSeq) return false; // um escudo por carta basta
  if (item === "folego" && corridaFolego[id] === cartaSeq) return false;
  return true;
}
function corridaComprar(item, id) {
  if (!corridaPodeComprar(item, id)) return;
  const it = CORRIDA_LOJA[item],
    p = jogadorPorId(id),
    preco = corridaPreco(item);
  p.score -= preco;
  corridaEstoque[item]--;
  if (item === "congelar") corridaCongelaMs += 15e3;
  else if (item === "folego") corridaFolego[id] = cartaSeq;
  else if (item === "escudo") corridaEscudo = cartaSeq;
  else if (item === "cofrinho") corridaCofrinho[id] = (corridaCofrinho[id] || 0) + 1;
  else if (item === "ampulheta") corridaGeralMudar(30e3);
  else if (item === "ima") corridaIma[id] = cartaSeq;
  else {
    corridaItens[id] = corridaItens[id] || { corte: 0, desfib: 0 };
    corridaItens[id][item]++;
  }
  playSfx("joia");
  fxFloat(`${it.ic} ${p.name} comprou ${it.nome} (−${preco})`, "#fbbf24");
  caosLog("corrida", `${p.name} comprou ${it.nome}`);
  const V = REACTIVE_VOICE.corrida;
  if (V && V.compra && Math.random() < 0.5) {
    const fala = getRandomReaction(V.compra, p.name);
    if (fala) caosFalaAgendar(() => fala, 300, "baixa");
  }
  corridaIntervaloRedesenharLoja();
  renderMiniScoreboard();
  saveGameState();
}
// no acerto (vitória por Tempo): Cofrinho de quem acertou e Ímã dos outros. Devolve os pontos extras de quem acertou.
function corridaLojaNoAcerto(scorer, pts) {
  if (!scorer || corridaVitoria !== "tempo") return 0;
  let extra = 0;
  if ((corridaCofrinho[scorer.id] || 0) > 0) {
    corridaCofrinho[scorer.id]--;
    extra = CORRIDA_COFRINHO_PTS;
    fxFloat(`🐷 Cofrinho de ${scorer.name}: +${extra}!`, "#f472b6");
  }
  players.forEach((p) => {
    if (p === scorer || corridaIma[p.id] !== cartaSeq) return;
    const ganho = Math.max(1, Math.round(pts * CORRIDA_IMA_FRACAO));
    p.score = (p.score || 0) + ganho;
    fxFloat(`🧲 Ímã de ${p.name}: +${ganho}`, "#60a5fa");
  });
  return extra;
}
function corridaPodeUsar(item, id) {
  const p = jogadorPorId(id),
    inv = corridaItens[id];
  if (!p || !inv || !(inv[item] > 0) || CURRENT_MODE !== "corrida" || cardState !== "revealed" || gameEnded) return false;
  if (item === "corte") return pendingIndex === null && players[responderIndex] && players[responderIndex].id === id && !corridaRelampago();
  if (item === "desfib") return true;
  return false;
}
function corridaUsar(item, id) {
  if (!corridaPodeUsar(item, id)) return;
  const p = jogadorPorId(id);
  corridaItens[id][item]--;
  if (item === "desfib") {
    corridaCartaMudar(15e3);
    fxFloat(`⚡ ${p.name}: +15 s na carta!`, "#4ade80");
  } else {
    // Passe Livre: passa a vez sem gastar dica e sem os −2 s
    clearTimer();
    responderIndex = advanceResponderAfterFailure();
    fxFloat(`${CORRIDA_LOJA.corte.ic} ${p.name} usou o ${CORRIDA_LOJA.corte.nome} e passou a vez`, "#a78bfa");
    startTimer("pick");
  }
  playSfx("pick");
  caosLog("corrida", `${p.name} usou ${CORRIDA_LOJA[item].nome}`);
  render();
  saveGameState();
}
/* A lojinha é UMA só pra mesa toda (pedido do JF): o mesmo estoque, ao vivo em todo dispositivo e na T2; quem comprar
   primeiro leva (o host atende um pedido de cada vez, e o segundo já encontra o estoque menor).
   estoque: { item: unidades }; compradores: [{ id, nome, pts }] (quem pode comprar NESTE dispositivo; vazio = só vitrine) */
function corridaLojaVitrineHtml(estoque, compradores, precos) {
  if (!estoque) return "";
  const pr = (k) => (precos && precos[k]) || CORRIDA_LOJA[k].preco;
  const linhas = Object.keys(estoque)
    .filter((k) => CORRIDA_LOJA[k])
    .map((k) => {
      const it = CORRIDA_LOJA[k],
        n = estoque[k] || 0;
      const btns = (compradores || [])
        .map((c) => {
          const pode = n > 0 && c.pts >= pr(k) && corridaPodeComprar(k, c.id);
          return `<button type="button" class="cr-loja-comprar" data-cr-comprar="${k}" data-cr-quem="${escapeHtml(c.id)}" ${pode ? "" : "disabled"}>${(compradores || []).length > 1 ? escapeHtml(c.nome) + " compra" : "Comprar"}</button>`;
        })
        .join("");
      return `<li class="cr-loja-item${n > 0 ? "" : " cr-esgotado"}"><span class="cr-li-ic">${it.ic}</span><span class="cr-li-txt"><b>${it.nome}</b><small>${it.desc}</small>${btns ? `<span class="cr-li-btns">${btns}</span>` : ""}</span><span class="cr-li-preco">${pr(k)}<small>${n > 0 ? `${n} no estoque` : "esgotado"}</small></span></li>`;
    })
    .join("");
  const saldo = (compradores || []).map((c) => `${escapeHtml(c.nome)}: <b>${c.pts}</b>`).join(" · ");
  return `<div class="cr-loja"><div class="cr-loja-tit">🛒 Lojinha de Sobrevivência <small>(uma só pra mesa: quem comprar primeiro leva · a vitrine muda a cada intervalo)</small></div>${saldo ? `<div class="cr-loja-saldo">💰 ${saldo}</div>` : ""}<ul>${linhas}</ul></div>`;
}
// no host: a vitrine da mesa, com os botões de quem joga no próprio dispositivo do host
function corridaLojaHostHtml() {
  if (!corridaLojaLigada() || !corridaEstoque) return "";
  const locais = players.filter((p) => typeof redeNoHost !== "function" || redeNoHost(p.id)).map((p) => ({ id: p.id, nome: p.name, pts: p.score || 0 }));
  return corridaLojaVitrineHtml(corridaEstoque, locais, corridaPrecos);
}
function corridaIntervaloRedesenharLoja() {
  const box = document.getElementById("crLojaHost");
  if (box) {
    box.innerHTML = corridaLojaHostHtml();
    corridaLojaLigarBotoes(box);
  }
  if (typeof redeHostPublicar === "function") redeHostPublicar(true);
}
function corridaLojaLigarBotoes(box) {
  box.querySelectorAll("[data-cr-comprar]").forEach((b) =>
    b.addEventListener("click", () => dispatchAction({ type: "corridaComprar", data: [b.dataset.crComprar, b.dataset.crQuem] })),
  );
}
// itens guardados dos jogadores do host, durante a carta (Passe Livre na vez, Choque de Tempo a qualquer hora)
function corridaItensHostHtml() {
  if (CURRENT_MODE !== "corrida" || cardState !== "revealed") return "";
  const btns = [];
  players.forEach((p) => {
    if (typeof redeNoHost === "function" && !redeNoHost(p.id)) return;
    ["desfib", "corte"].forEach((k) => {
      if (corridaPodeUsar(k, p.id))
        btns.push(`<button type="button" class="cr-usar" data-cr-usar="${k}" data-cr-quem="${escapeHtml(p.id)}">${CORRIDA_LOJA[k].ic} ${CORRIDA_LOJA[k].nome} (${escapeHtml(p.name)})</button>`);
    });
  });
  return btns.length ? `<div class="cr-itens">${btns.join("")}</div>` : "";
}

/* --- Coroas no fim: Senhor do Tempo (mais pontos) e Colecionador (mais cartas) --- */
function corridaCoroasHtml() {
  if (CURRENT_MODE !== "corrida" || !players.length) return "";
  const topo = (f) => {
    const max = Math.max(...players.map(f));
    if (max <= 0) return [];
    return players.filter((p) => f(p) === max);
  };
  const tempo = corridaVitoria === "tempo" ? topo((p) => p.score || 0) : [];
  const colec = topo((p) => corridaCartasDe(p));
  const nomes = (l) => l.map((p) => playerNameHtml(p.name, p.color, p.avatar)).join(" e ");
  const mesmo = tempo.length === 1 && colec.length === 1 && tempo[0] === colec[0];
  if (mesmo) return `<div class="cr-coroas"><div class="cr-coroa cr-dono">🏆 <b>Dono da Corrida</b>: ${nomes(tempo)} (mais pontos e mais cartas)</div></div>`;
  const linhas = [];
  if (tempo.length) linhas.push(`<div class="cr-coroa">⏱️ <b>Senhor do Tempo</b>: ${nomes(tempo)} · ${tempo[0].score} pts</div>`);
  if (colec.length) linhas.push(`<div class="cr-coroa">🃏 <b>Colecionador</b>: ${nomes(colec)} · ${corridaCartasDe(colec[0])} cartas</div>`);
  return linhas.length ? `<div class="cr-coroas">${linhas.join("")}</div>` : "";
}
