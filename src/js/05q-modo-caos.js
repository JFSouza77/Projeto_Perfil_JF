/* --- 1.7.10.6 · MODO C.A.O.S. (handoff do JF de 17/10 + decisões dele; docs/Modos_1.7.10.6.md) ---
 * Só online, 16+, um dispositivo por pessoa, individual. Cada um recebe UMA carta secreta por rodada (10 dicas).
 * O Mestre roda: na vez dele, uma dica da carta DELE abre pra todo mundo e a janela de 15 s começa. Quem souber
 * toca em "Palpitar agora" (o primeiro trava a vez), fala a resposta e o Mestre marca Acertou/Errou (decisão do JF:
 * palpite falado, não digitado). Acertou: captura a carta (1 carta = 1 ponto) e a resposta aparece pra todos.
 * Ninguém acertou: a carta hiberna e volta na próxima vez desse Mestre, na dica seguinte.
 * Partida de 10 min, rodada de até 5 min, intervalo de 15 s com tudo congelado (lojinha e às vezes a Piñata).
 * Economia paralela de Pontos de Caos (PC), que não contam no placar. Aqui o C.A.O.S. FAZ as coisas de verdade:
 * Turbo, Imposto da Preguiça, Batata Quente, Mão Leve, roubos com duelo e revanche.
 * Tudo roda no host (autoridade da sala); os dispositivos recebem o retrato público (mc) e, no painel de cada um,
 * só o que é dele (a própria carta, PC, itens, Mão Leve, dica do Desfibrilador, resposta pra quem julga). */
let mc = null;
let mcTique = null;

function mcAtivo() {
  return CURRENT_MODE === "caos" && !!mc && starterChosen && !gameEnded;
}
function mcAgora() {
  return Date.now();
}
// relógio que pode parar: { resta } parado ou { fimEm } correndo
function mcRelogioMs(r) {
  if (!r) return 0;
  return Math.max(0, r.fimEm ? r.fimEm - mcAgora() : r.resta || 0);
}
function mcRelogioParar(r) {
  if (r && r.fimEm) {
    r.resta = Math.max(0, r.fimEm - mcAgora());
    r.fimEm = null;
  }
}
function mcRelogioCorrer(r) {
  if (r && !r.fimEm) {
    r.fimEm = mcAgora() + (r.resta || 0);
    r.resta = null;
  }
}
function mcNome(id) {
  const p = jogadorPorId(id);
  return p ? p.name : "Alguém";
}
function mcMestreId() {
  return mc && mc.ordem[mc.vez];
}
function mcCartaDe(id) {
  return mc && mc.cartas[id];
}
function mcLog(txt) {
  if (!mc) return;
  mc.feed.push(String(txt).slice(0, 160));
  if (mc.feed.length > 8) mc.feed.shift();
  caosLog("modocaos", txt);
}
// o C.A.O.S. anuncia (fura o mudo: é informação de regra) e a linha vai pro feed de todo mundo
function mcAnunciar(txt, fala) {
  mcLog(txt);
  const f = fala || txt;
  if (f) setTimeout(() => !gameEnded && showToastMessage(f, null, true), 50);
}
function mcFoto() {
  if (!mc) return "";
  const j = mc.janela;
  return JSON.stringify([mc.rodada, mc.fase, mc.vez, Object.keys(mc.cartas).map((k) => [k, mc.cartas[k].aberta, mc.cartas[k].estado]), mc.pc, mc.inv, j && [j.buzz, j.tentaram, j.serial, !!j.congela, j.mordaca], mc.batata, mc.desafio && [mc.desafio.aberta, mc.desafio.buzz], mc.duelo && [mc.duelo.fase, mc.duelo.esc], mc.pinata, mc.maoLeve]);
}

/* --- começo, rodadas, vezes --- */
function mcZerar() {
  clearInterval(mcTique);
  mcTique = null;
  mc = null;
}
function mcIniciar() {
  mc = {
    rodada: 0,
    fase: "abrindo",
    geral: { resta: MC_TEMPO_MS, fimEm: null },
    rodadaT: { resta: MC_RODADA_MS, fimEm: null },
    cartas: {},
    ordem: players.map((p) => p.id),
    vez: 0,
    janela: null,
    serial: 0,
    turbo: null,
    pc: Object.fromEntries(players.map((p) => [p.id, 0])),
    inv: {},
    garganta: {},
    batata: null,
    desafio: null,
    duelo: null,
    pinata: null,
    maoLeve: null,
    desfib: null,
    ultimo: null,
    feed: [],
    intervalo: null,
    abrirEm: 0,
    cont: { turbo: 0, imposto: 0, batata: 0, roubo: 0, maoLeve: 0, pinata: 0 },
  };
  players.forEach((p) => (p.score = 0));
  mcAnunciar("🌀 Modo C.A.O.S. começou. 10 minutos. Que vença o mais rápido.", "🌀 MODO C.A.O.S.! Cada um tem a sua carta secreta. 10 minutos. Agora quem manda aqui sou eu.");
  mcNovaRodada();
  mcTique = mcTique || setInterval(mcTicar, 250);
}
function mcBaralho() {
  return allCards && allCards.length ? allCards : baralhoClassico();
}
function mcNovaRodada() {
  mc.rodada++;
  mc.rodadaT = { resta: MC_RODADA_MS, fimEm: null };
  mc.cartas = {};
  const usadas = new Set(cartasPartida.map((c) => c.resp));
  players.forEach((p) => {
    let raw = null;
    for (let t = 0; t < 40 && !raw; t++) {
      if (!deck.length) resetDeckSoBaralho();
      const c = deck.pop();
      if (c && !usadas.has(c.answer)) raw = c;
    }
    if (!raw) raw = sorteioItem(mcBaralho());
    usadas.add(raw.answer);
    const dicas = shuffle(raw.clues.filter((c) => c.type === "clue")).slice(0, 10).map((c) => String(c.text));
    mc.cartas[p.id] = { resp: raw.answer, cat: gemCategoryFor(raw.category), dicas, aberta: 0, estado: "ativa", por: null };
  });
  mc.vez = (mc.rodada - 1) % mc.ordem.length;
  mc.turbo = null;
  mcLog(`🃏 Rodada ${mc.rodada}: cada um recebeu uma carta nova.`);
  mcComecarVez();
}
// baralho acabou no meio da partida: embaralha de novo (sem mexer no resto da partida)
function resetDeckSoBaralho() {
  deck = shuffle(mcBaralho().slice());
}
function mcCartaViva(id) {
  const c = mc.cartas[id];
  return !!c && c.estado === "ativa" && c.aberta < c.dicas.length;
}
function mcComecarVez() {
  if (!mcAtivo()) return;
  if (mcRelogioMs(mc.geral) <= 0) return mcFim();
  if (mcRelogioMs(mc.rodadaT) <= 0) return mcFimRodada();
  // próximo Mestre com carta viva (a partir da vez atual)
  let achou = -1;
  for (let i = 0; i < mc.ordem.length; i++) {
    const k = (mc.vez + i) % mc.ordem.length;
    if (jogadorPorId(mc.ordem[k]) && mcCartaViva(mc.ordem[k])) {
      achou = k;
      break;
    }
  }
  if (achou < 0) return mcFimRodada();
  mc.vez = achou;
  mestreIndex = jogadorIdxPorId(mcMestreId());
  mc.fase = "abrindo";
  mc.janela = null;
  mc.abrirEm = mcAgora() + 1500;
  if (mcEventoNaVez()) return; // o C.A.O.S. aprontou alguma coisa antes da dica (duelo, batata…)
  mcMudou();
}
function mcAbrirDica() {
  const id = mcMestreId(),
    c = mc.cartas[id];
  if (!c || !mcCartaViva(id)) return mcFimVez();
  c.aberta++;
  mc.serial++;
  const dur = (mc.turbo === id ? MC_TURBO_SEG : MC_JANELA_SEG) * 1e3;
  mc.janela = { serial: mc.serial, dur, inicio: mcAgora(), relogio: { resta: dur, fimEm: null }, buzz: null, buzzEm: 0, tentaram: [], folego: [], congela: null, mordaca: null, corte: false, imposto: false, bateram: [] };
  mcRelogioCorrer(mc.janela.relogio);
  if (mc.cont.imposto < 3 && mc.rodada >= 2 && sorteioRegra() < 0.08) {
    mc.cont.imposto++;
    mc.janela.imposto = true;
    mcAnunciar("💸 IMPOSTO DA PREGUIÇA nesta dica: quem não tentar paga 10 PC.");
  }
  if (mc.batata) mc.batata.dicas++;
  mc.fase = "janela";
  playSfx("virar");
  mcMudou();
}
// quanto da janela já passou (sem contar o tempo de julgamento)
function mcJanelaPassou() {
  const j = mc.janela;
  return j ? j.dur - mcRelogioMs(j.relogio) : 0;
}
function mcPodePalpitar(id) {
  if (!mcAtivo() || !mc.janela || mc.janela.buzz) return false;
  const j = mc.janela;
  if (mc.fase === "desfibSolo") return !!mc.desfib && mc.desfib.id === id && !j.tentaram.includes(id);
  if (mc.fase !== "janela" || id === mcMestreId() || !jogadorPorId(id)) return false;
  if (j.tentaram.includes(id) || (j.mordaca && j.mordaca === id)) return false;
  if (j.congela && j.congela.por !== id && mcAgora() < j.congela.ate) return false;
  return true;
}
function mcPalpitar(id) {
  if (!mcPodePalpitar(id)) return;
  const j = mc.janela;
  j.buzz = id;
  j.buzzEm = mcJanelaPassou();
  if (!j.bateram.includes(id)) j.bateram.push(id);
  mcRelogioParar(j.relogio);
  mc.faseAntes = mc.fase;
  mc.fase = "julgando";
  playSfx("pick");
  mcMudou();
}
// quem julga: o Mestre da vez; se ele estiver fora da sala, o host
function mcJuiz() {
  const m = mcMestreId();
  if (typeof rede !== "undefined" && rede && rede.papel === "host" && m !== rede.hostEu && !redeOnline(rede.assentos[m])) return rede.hostEu;
  return m;
}
function mcPodeVeredito() {
  return mcAtivo() && mc.fase === "julgando" && !!mc.janela && !!mc.janela.buzz;
}
function mcVeredito(ok) {
  if (!mcPodeVeredito()) return;
  const j = mc.janela,
    quem = j.buzz,
    id = mcMestreId(),
    c = mc.cartas[id];
  j.buzz = null;
  if (ok) {
    const p = jogadorPorId(quem);
    c.estado = "capturada";
    c.por = quem;
    if (p) p.score = (p.score || 0) + 1;
    const rapido = j.buzzEm <= MC_RAPIDO_MS;
    if (rapido) mcPcMudar(quem, MC_PC.rapido);
    mc.ultimo = { resp: c.resp, cat: c.cat, quem, mestre: id, tipo: "capturada", dicas: c.aberta };
    cartasPartida.push({ n: cartasPartida.length + 1, cat: c.cat, resp: c.resp, quem, mestre: id, dicas: c.aberta, dicaNum: null, dicaTxt: null, bonus: false });
    playSfx("vitoriaCarta");
    vibrar("acerto");
    mcAnunciar(`✅ ${mcNome(quem)} capturou a carta de ${mcNome(id)}: ${c.resp}${rapido ? ` (+${MC_PC.rapido} PC pela rapidez)` : ""}`);
    if (mc.turbo === id) mc.turbo = null;
    if (mc.fase === "julgando" && mc.faseAntes === "desfibSolo") mc.desfib = null;
    return mcFimVez();
  }
  // errou: ele não tenta de novo nesta dica (só com Fôlego); a janela continua de onde parou
  j.tentaram.push(quem);
  playSfx("erro");
  mcLog(`❌ ${mcNome(quem)} errou.`);
  if (mc.faseAntes === "desfibSolo") {
    mc.desfib = null;
    return mcFimVez(); // a tentativa solo do Desfibrilador era uma só
  }
  mc.fase = mc.faseAntes || "janela";
  mcRelogioCorrer(j.relogio);
  mcMudou();
}
// janela fechou sem acerto: Imposto da Preguiça, oferta do Desfibrilador, e a carta hiberna
function mcJanelaFechou() {
  const j = mc.janela,
    id = mcMestreId();
  if (j && j.imposto)
    players.forEach((p) => {
      if (p.id !== id && !j.bateram.includes(p.id) && (mc.pc[p.id] || 0) > 0) {
        mcPcMudar(p.id, -MC_PC.imposto);
        mcLog(`💸 ${p.name} não tentou e pagou ${MC_PC.imposto} PC de imposto.`);
      }
    });
  const c = mc.cartas[id];
  const temProxima = c && c.aberta < c.dicas.length;
  const donos = players.filter((p) => p.id !== id && (mc.inv[p.id] || {}).desfib > 0).map((p) => p.id);
  if (temProxima && donos.length) {
    mc.fase = "desfibOferta";
    mc.desfib = { oferta: donos, ate: mcAgora() + 5000 };
    return mcMudou();
  }
  mcFimVez();
}
function mcUsarDesfib(id) {
  if (!mcAtivo() || mc.fase !== "desfibOferta" || !mc.desfib || !mc.desfib.oferta.includes(id)) return;
  mc.inv[id].desfib--;
  const c = mc.cartas[mcMestreId()];
  // a próxima dica só na tela dele por 5 s (+ tempo pra responder); a carta não anda pra mesa
  mc.desfib = { id, dica: c.dicas[c.aberta], ate: mcAgora() + 8000 };
  mc.janela = { serial: ++mc.serial, dur: 8000, inicio: mcAgora(), relogio: { resta: 8000, fimEm: null }, buzz: null, buzzEm: 0, tentaram: [], folego: [], congela: null, mordaca: null, corte: false, imposto: false, bateram: [] };
  mcRelogioCorrer(mc.janela.relogio);
  mc.fase = "desfibSolo";
  mcLog(`⚡ ${mcNome(id)} usou o Desfibrilador: viu uma dica que ninguém mais viu.`);
  mcMudou();
}
function mcFimVez() {
  const id = mcMestreId(),
    c = mc.cartas[id];
  if (c && c.estado === "ativa" && c.aberta >= c.dicas.length) {
    c.estado = "morta";
    mc.ultimo = { resp: c.resp, cat: c.cat, quem: null, mestre: id, tipo: "morta", dicas: c.aberta };
    cartasPartida.push({ n: cartasPartida.length + 1, cat: c.cat, resp: c.resp, quem: null, mestre: id, dicas: c.aberta, dicaNum: null, dicaTxt: null, bonus: false });
    mcLog(`💀 Ninguém matou a carta de ${mcNome(id)}: era ${c.resp}.`);
  } else if (c && c.estado === "ativa") mcLog(`💤 A carta de ${mcNome(id)} hibernou (${c.aberta} de ${c.dicas.length} dicas).`);
  if (mc.turbo === id) mc.turbo = null;
  mc.janela = null;
  mc.desfib = null;
  // Batata Quente: depois da 3ª dica, quem está com ela encara a carta bônus
  if (mc.batata && mc.batata.dicas >= 3) return mcDesafioComecar(mc.batata.com);
  mc.vez = (mc.vez + 1) % mc.ordem.length;
  mcComecarVez();
}
function mcFimRodada() {
  players.forEach((p) => mcPcMudar(p.id, MC_PC.rodada));
  mcLog(`☕ Fim da rodada ${mc.rodada}. Todo mundo ganhou ${MC_PC.rodada} PC.`);
  if (mcRelogioMs(mc.geral) <= 0) return mcFim();
  mc.fase = "intervalo";
  mc.janela = null;
  mc.intervalo = { fimEm: mcAgora() + MC_INTERVALO_SEG * 1e3 };
  // Mão Leve: uma vez por partida, a partir da 2ª rodada, alguém (de preferência da metade de baixo) recebe em segredo
  if (!mc.maoLeve && mc.cont.maoLeve < 1 && mc.rodada >= 1 && players.length >= 3 && sorteioRegra() < 0.6) {
    const baixo = players.slice().sort((a, b) => (a.score || 0) - (b.score || 0)).slice(0, Math.ceil(players.length / 2));
    mc.maoLeve = { id: sorteioItem(baixo).id };
    mc.cont.maoLeve++;
    caosLog("modocaos", "Mão Leve entregue em segredo");
  }
  // Piñata: às vezes, no intervalo
  if (mc.cont.pinata < 3 && sorteioRegra() < 0.45) {
    mc.cont.pinata++;
    mc.pinata = { palavra: sorteioItem(MC_PINATA_PALAVRAS), ganhou: null };
    mcAnunciar(`🪅 PIÑATA! Quem digitar primeiro "${mc.pinata.palavra}" leva ${MC_PC.pinata} PC!`);
  }
  mcMudou();
}
function mcFim() {
  if (!mc || gameEnded) return;
  mc.fase = "fim";
  mcLog("🏁 Fim do tempo!");
  clearInterval(mcTique);
  mcTique = null;
  endGame();
}

/* --- PC, lojinha e itens --- */
function mcPcMudar(id, n) {
  mc.pc[id] = Math.max(0, (mc.pc[id] || 0) + n);
}
function mcItem(id, item) {
  return ((mc.inv[id] || {})[item] || 0) > 0;
}
function mcPodeComprar(item, id) {
  const it = MC_LOJA[item];
  return mcAtivo() && mc.fase === "intervalo" && !!it && !!jogadorPorId(id) && (mc.pc[id] || 0) >= it.preco;
}
function mcComprar(item, id) {
  if (!mcPodeComprar(item, id)) return;
  mcPcMudar(id, -MC_LOJA[item].preco);
  mc.inv[id] = mc.inv[id] || {};
  mc.inv[id][item] = (mc.inv[id][item] || 0) + 1;
  playSfx("joia");
  mcLog(`🛒 ${mcNome(id)} comprou alguma coisa na lojinha…`); // o que foi é segredo dele
  mcMudou();
}
function mcPodeUsar(item, id, alvo) {
  if (!mcAtivo() || !mcItem(id, item) || !mc.janela) return false;
  const j = mc.janela,
    passou = mcJanelaPassou();
  if (mc.fase !== "janela" || j.buzz) return false;
  if (item === "corte") return !j.corte && mcRelogioMs(j.relogio) > 7000;
  if (item === "folego") return j.tentaram.includes(id) && !j.folego.includes(id);
  if (item === "congelar") return !j.congela && passou <= 3000 && id !== mcMestreId();
  if (item === "mordaca") {
    const a = jogadorPorId(alvo);
    return !!a && alvo !== id && alvo !== mcMestreId() && !j.mordaca && mc.garganta[alvo] !== j.serial && !j.tentaram.includes(alvo);
  }
  return false;
}
function mcUsar(item, id, alvo) {
  if (!mcPodeUsar(item, id, alvo)) return;
  const j = mc.janela;
  mc.inv[id][item]--;
  if (item === "corte") {
    j.corte = true;
    j.relogio.fimEm = mcAgora() + 6000;
    mcAnunciar(`✂️ ${mcNome(id)} cortou o fio: a janela caiu pra 6 segundos!`);
  } else if (item === "folego") {
    j.folego.push(id);
    j.tentaram = j.tentaram.filter((x) => x !== id);
    mcLog(`🫁 ${mcNome(id)} tomou fôlego e pode tentar de novo.`);
  } else if (item === "congelar") {
    j.congela = { por: id, ate: j.inicio + 7000 };
    mcAnunciar(`🧊 ${mcNome(id)} congelou a mesa: só ele pode bater nos primeiros 7 segundos.`);
  } else if (item === "mordaca") {
    let vitima = alvo,
      autor = id;
    if (mcItem(alvo, "espelho")) {
      mc.inv[alvo].espelho--;
      vitima = id;
      autor = alvo;
      mcAnunciar(`🪞 O Espelho de ${mcNome(alvo)} refletiu a Mordaça! ${mcNome(id)} ficou amordaçado.`);
    } else mcAnunciar(`🤐 ${mcNome(id)} amordaçou ${mcNome(alvo)} nesta dica.`);
    j.mordaca = vitima;
    mc.garganta[vitima] = j.serial + 1; // Garganta Limpa: imune na próxima dica
  }
  playSfx("pick");
  mcMudou();
}

/* --- Eventos do C.A.O.S. (aqui ele faz de verdade) --- */
// sorteado no começo de cada vez; true = o evento tomou conta (a vez continua depois dele)
function mcEventoNaVez() {
  const passou = MC_TEMPO_MS - mcRelogioMs(mc.geral);
  if (passou < 60e3) return false;
  const r = sorteioRegra();
  // roubo com duelo: até 2 por partida
  if (mc.cont.roubo < 2 && players.length >= 3 && r < 0.07 && mcRouboComecar()) return true;
  // Batata Quente: até 2 por partida, uma de cada vez
  if (!mc.batata && !mc.desafio && mc.cont.batata < 2 && r >= 0.07 && r < 0.13) {
    const alvo = sorteioItem(players.filter((p) => p.id !== mcMestreId()));
    if (alvo) {
      mc.cont.batata++;
      mc.batata = { com: alvo.id, dicas: 0 };
      mcAnunciar(`🥔 BATATA QUENTE na mão de ${alvo.name}! Ela queima por 3 dicas: passe pra frente ou segure (e encare a carta bônus).`);
    }
  }
  // Modo Turbo: a carta deste Mestre roda com janela de 5 s
  if (!mc.turbo && mc.cont.turbo < 2 && r >= 0.13 && r < 0.19) {
    mc.cont.turbo++;
    mc.turbo = mcMestreId();
    mcAnunciar(`⏩ MODO TURBO na carta de ${mcNome(mc.turbo)}: janela de ${MC_TURBO_SEG} segundos!`);
  }
  return false;
}
function mcPodeBatata(id) {
  return mcAtivo() && !!mc.batata && mc.batata.com === id && (mc.fase === "janela" || mc.fase === "abrindo");
}
function mcBatataPassar(id) {
  if (!mcPodeBatata(id)) return;
  const outros = players.filter((p) => p.id !== id);
  const alvo = sorteioItem(outros);
  if (!alvo) return;
  mc.batata.com = alvo.id;
  mcAnunciar(`🥔 ${mcNome(id)} passou a batata… agora tá com ${alvo.name}!`);
  mcMudou();
}
// pedido do JF: "Segurar a Batata" = fica com ela e encara a carta bônus na hora
function mcBatataSegurar(id) {
  if (!mcPodeBatata(id)) return;
  mcAnunciar(`🥔 ${mcNome(id)} SEGUROU a batata! Carta bônus agora.`);
  if (mc.janela) mcRelogioParar(mc.janela.relogio);
  mcDesafioComecar(id);
}
// Carta bônus da batata (Hardcore): até 5 dicas abrem sozinhas; o portador bate e responde; quem julga recebe a resposta
function mcDesafioComecar(id) {
  const emJogo = new Set(Object.values(mc.cartas).map((c) => c.resp));
  const raw = sorteioItem(baralhoHardcore().filter((c) => !emJogo.has(c.answer)));
  const dicas = shuffle(raw.clues.filter((c) => c.type === "clue")).slice(0, 5).map((c) => String(c.text));
  const juizes = players.filter((p) => p.id !== id);
  const juiz = (juizes.find((p) => p.id === mcMestreId()) || sorteioItem(juizes)).id;
  mc.desafio = { com: id, juiz, resp: raw.answer, cat: gemCategoryFor(raw.category), dicas, aberta: 1, proxEm: mcAgora() + 6000, buzz: null, voltaFase: mc.fase };
  mc.batata = null;
  mc.fase = "desafio";
  mcMudou();
}
function mcDesafioBater(id) {
  if (!mcAtivo() || mc.fase !== "desafio" || !mc.desafio || mc.desafio.com !== id || mc.desafio.buzz) return;
  mc.desafio.buzz = id;
  mc.desafio.restaProx = Math.max(0, mc.desafio.proxEm - mcAgora());
  playSfx("pick");
  mcMudou();
}
function mcDesafioVeredito(ok) {
  const d = mc && mc.desafio;
  if (!mcAtivo() || mc.fase !== "desafio" || !d || !d.buzz) return;
  d.buzz = null;
  if (ok) {
    const p = jogadorPorId(d.com);
    if (p) p.score = (p.score || 0) + 1;
    mcPcMudar(d.com, MC_PC.batata);
    cartasPartida.push({ n: cartasPartida.length + 1, cat: d.cat, resp: d.resp, quem: d.com, mestre: null, dicas: d.aberta, dicaNum: null, dicaTxt: null, bonus: true });
    mcAnunciar(`🥔✅ ${mcNome(d.com)} venceu a carta bônus (${d.resp}): +1 carta e +${MC_PC.batata} PC!`);
    return mcDesafioFim();
  }
  playSfx("erro");
  mcLog(`🥔❌ ${mcNome(d.com)} errou na carta bônus.`);
  d.proxEm = mcAgora() + (d.restaProx || 3000);
  if (d.aberta >= d.dicas.length) return mcDesafioPerdeu();
  mcMudou();
}
function mcDesafioPerdeu() {
  const d = mc.desafio;
  const p = jogadorPorId(d.com);
  const lanterna = players.filter((q) => q.id !== d.com).sort((a, b) => (a.score || 0) - (b.score || 0))[0];
  let txt = `🥔💥 ${mcNome(d.com)} não acertou a carta bônus (era ${d.resp}).`;
  if (p && (p.score || 0) > 0 && lanterna) {
    if (mcItem(d.com, "kevlar")) {
      mc.inv[d.com].kevlar--;
      txt += " O Escudo de Kevlar segurou a perda!";
    } else {
      p.score--;
      lanterna.score = (lanterna.score || 0) + 1;
      txt += ` Uma carta foi pro lanterna, ${lanterna.name}.`;
    }
  }
  mcAnunciar(txt);
  mcDesafioFim();
}
function mcDesafioFim() {
  const volta = mc.desafio ? mc.desafio.voltaFase : "abrindo";
  mc.desafio = null;
  // segurou no meio de uma janela: ela volta de onde parou; senão, segue a roda
  if (volta === "janela" && mc.janela) {
    mc.fase = "janela";
    mcRelogioCorrer(mc.janela.relogio);
    return mcMudou();
  }
  mc.vez = (mc.vez + 1) % mc.ordem.length;
  mcComecarVez();
}

// Roubo: um ladrão abaixo do topo desafia alguém com placar igual ou maior; duelo sorteado pelo C.A.O.S.
const MC_DUELOS = ["d6", "moeda", "ppt", "parimpar"];
const MC_DUELO_NOME = { d6: "🎲 Dado (D6)", moeda: "🪙 Cara ou Coroa", ppt: "✊ Pedra, Papel e Tesoura", parimpar: "✌️ Par ou Ímpar" };
function mcRouboComecar() {
  const topo = Math.max(...players.map((p) => p.score || 0));
  const ladroes = players.filter((p) => (p.score || 0) < topo);
  const ladrao = sorteioItem(ladroes.length ? ladroes : players);
  if (!ladrao) return false;
  const vitimas = players.filter((p) => p.id !== ladrao.id && (p.score || 0) >= (ladrao.score || 0) && (p.score || 0) > 0);
  const vitima = sorteioItem(vitimas);
  if (!vitima) return false;
  mc.cont.roubo++;
  mc.duelo = { ladrao: ladrao.id, vitima: vitima.id, tipo: sorteioItem(MC_DUELOS), fase: "escolha", esc: {}, ate: mcAgora() + 12000, revanche: false, lados: null, resultado: null };
  const d = mc.duelo;
  if (d.tipo === "moeda") d.lados = Math.random() < 0.5 ? { [d.ladrao]: "cara", [d.vitima]: "coroa" } : { [d.ladrao]: "coroa", [d.vitima]: "cara" };
  if (d.tipo === "parimpar") d.lados = Math.random() < 0.5 ? { [d.ladrao]: "par", [d.vitima]: "ímpar" } : { [d.ladrao]: "ímpar", [d.vitima]: "par" };
  // dado e moeda não têm escolha: o C.A.O.S. rola na hora (com suspense)
  if (d.tipo === "d6" || d.tipo === "moeda") d.ate = mcAgora() + 3500;
  mc.fase = "duelo";
  mcAnunciar(`⚔️ ROUBO! ${ladrao.name} quer uma carta de ${vitima.name}. Duelo: ${MC_DUELO_NOME[d.tipo]}!`, `⚔️ É HORA DO DUELO! ${ladrao.name} contra ${vitima.name}, valendo uma carta. ${MC_DUELO_NOME[d.tipo]}!`);
  mcMudou();
  return true;
}
function mcPodeEscolherDuelo(id, valor) {
  const d = mc && mc.duelo;
  if (!mcAtivo() || mc.fase !== "duelo" || !d || d.fase !== "escolha" || (id !== d.ladrao && id !== d.vitima) || d.esc[id] !== undefined) return false;
  if (d.tipo === "ppt") return ["pedra", "papel", "tesoura"].includes(valor);
  if (d.tipo === "parimpar") return Number.isInteger(valor) && valor >= 0 && valor <= 5;
  return false;
}
function mcDueloEscolher(id, valor) {
  if (!mcPodeEscolherDuelo(id, valor)) return;
  mc.duelo.esc[id] = valor;
  if (mc.duelo.esc[mc.duelo.ladrao] !== undefined && mc.duelo.esc[mc.duelo.vitima] !== undefined) mcDueloResolver();
  else mcMudou();
}
function mcDueloResolver() {
  const d = mc.duelo,
    L = d.ladrao,
    V = d.vitima;
  let venc = null,
    det = "";
  const aleat = (lista) => sorteioItem(lista);
  if (d.tipo === "d6") {
    let a, b;
    do {
      a = 1 + Math.floor(Math.random() * 6);
      b = 1 + Math.floor(Math.random() * 6);
    } while (a === b);
    venc = a > b ? L : V;
    det = `${mcNome(L)} tirou ${a}, ${mcNome(V)} tirou ${b}`;
  } else if (d.tipo === "moeda") {
    const lado = Math.random() < 0.5 ? "cara" : "coroa";
    venc = d.lados[L] === lado ? L : V;
    det = `deu ${lado}`;
  } else if (d.tipo === "ppt") {
    const ops = ["pedra", "papel", "tesoura"];
    const a = d.esc[L] !== undefined ? d.esc[L] : aleat(ops),
      b = d.esc[V] !== undefined ? d.esc[V] : aleat(ops);
    if (a === b) {
      d.esc = {};
      d.ate = mcAgora() + 10000;
      mcLog(`✊ Empate (${a})! De novo.`);
      return mcMudou();
    }
    const ganha = { pedra: "tesoura", papel: "pedra", tesoura: "papel" };
    venc = ganha[a] === b ? L : V;
    det = `${mcNome(L)}: ${a} × ${mcNome(V)}: ${b}`;
  } else {
    const a = d.esc[L] !== undefined ? d.esc[L] : Math.floor(Math.random() * 6),
      b = d.esc[V] !== undefined ? d.esc[V] : Math.floor(Math.random() * 6);
    const res = (a + b) % 2 === 0 ? "par" : "ímpar";
    venc = d.lados[L] === res ? L : V;
    det = `${a} + ${b} = ${a + b} (${res})`;
  }
  d.resultado = { venc, det };
  const ladraoVenceu = venc === L;
  if (!d.revanche) {
    if (ladraoVenceu) {
      const ok = mcTransferir(V, L, "roubo");
      mcAnunciar(`⚔️ ${det}. ${ok ? `${mcNome(L)} roubou uma carta de ${mcNome(V)}!` : "Mas a carta não saiu do lugar."}`);
      if (ok) {
        d.fase = "revanche";
        d.ate = mcAgora() + 10000;
        return mcMudou();
      }
    } else mcAnunciar(`⚔️ ${det}. ${mcNome(V)} defendeu a carta!`);
    return mcDueloFim();
  }
  // revanche (dobro ou nada): a vítima ganhou, recupera a carta e ainda leva outra; perdeu, fica como está
  if (venc === V) {
    mcTransferir(L, V, "revanche", true);
    const mais = mcTransferir(L, V, "revanche", true);
    mcAnunciar(`🔁 ${det}. ${mcNome(V)} venceu a revanche: recuperou a carta${mais ? " e ainda levou outra" : ""}!`);
  } else mcAnunciar(`🔁 ${det}. ${mcNome(L)} venceu de novo. A perda fica.`);
  mcDueloFim();
}
// tira 1 carta de "de" e dá pra "para". Escudo segura, Espelho reflete (no roubo, o ladrão perde 1 pro dono)
function mcTransferir(de, para, tipo, semProtecao) {
  const a = jogadorPorId(de),
    b = jogadorPorId(para);
  if (!a || !b || (a.score || 0) <= 0) return false;
  if (!semProtecao && mcItem(de, "kevlar")) {
    mc.inv[de].kevlar--;
    mcLog(`🛡️ O Escudo de Kevlar de ${a.name} segurou o ${tipo}!`);
    return false;
  }
  if (!semProtecao && mcItem(de, "espelho")) {
    mc.inv[de].espelho--;
    mcLog(`🪞 O Espelho de ${a.name} refletiu! Quem perde é ${b.name}.`);
    if ((b.score || 0) > 0) {
      b.score--;
      a.score = (a.score || 0) + 1;
    }
    return false;
  }
  a.score--;
  b.score = (b.score || 0) + 1;
  return true;
}
function mcPodeRevanche(id) {
  const d = mc && mc.duelo;
  return mcAtivo() && mc.fase === "duelo" && !!d && d.fase === "revanche" && d.vitima === id;
}
function mcRevanche(id, quer) {
  if (!mcPodeRevanche(id)) return;
  const d = mc.duelo;
  if (!quer) return mcDueloFim();
  d.revanche = true;
  d.fase = "escolha";
  d.esc = {};
  d.ate = mcAgora() + (d.tipo === "d6" || d.tipo === "moeda" ? 3500 : 12000);
  mcAnunciar(`🔁 ${mcNome(id)} pediu REVANCHE: dobro ou nada!`);
  mcMudou();
}
function mcDueloFim() {
  mc.duelo = null;
  mc.fase = "abrindo";
  mc.abrirEm = mcAgora() + 1500;
  mcMudou();
}
// Mão Leve (drop secreto): tira 1 carta de alguém sem dizer quem foi
function mcPodeMaoLeve(id, alvo) {
  const a = jogadorPorId(alvo);
  return mcAtivo() && !!mc.maoLeve && mc.maoLeve.id === id && alvo !== id && !!a && (a.score || 0) > 0 && (mc.fase === "janela" || mc.fase === "abrindo" || mc.fase === "intervalo");
}
function mcMaoLeve(id, alvo) {
  if (!mcPodeMaoLeve(id, alvo)) return;
  mc.maoLeve = null;
  const ok = mcTransferir(alvo, id, "furto");
  mcAnunciar(ok ? `🧤 A Mão Leve passou por aqui… ${mcNome(alvo)} ficou com uma carta a menos.` : "🧤 A Mão Leve tentou… e não conseguiu.");
  mcMudou();
}
// Piñata: digitar a palavra exata; o host atende um de cada vez, então o primeiro que chega leva
function mcPodePinata(id, txt) {
  return mcAtivo() && mc.fase === "intervalo" && !!mc.pinata && !mc.pinata.ganhou && !!jogadorPorId(id) && typeof txt === "string";
}
function mcPinata(id, txt) {
  if (!mcPodePinata(id, txt)) return;
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toUpperCase().replace(/\s+/g, " ");
  if (norm(txt) !== norm(mc.pinata.palavra)) return;
  mc.pinata.ganhou = id;
  mcPcMudar(id, MC_PC.pinata);
  mcAnunciar(`🪅 ${mcNome(id)} arrebentou a Piñata: +${MC_PC.pinata} PC!`);
  mcMudou();
}

/* --- tique: relógios e prazos --- */
function mcTicar() {
  if (!mcAtivo()) return;
  const pausado = !!pausedAt;
  const joga = !pausado && ["abrindo", "janela", "julgando", "desfibOferta", "desfibSolo"].includes(mc.fase);
  [mc.geral, mc.rodadaT].forEach((r) => (joga ? mcRelogioCorrer(r) : mcRelogioParar(r)));
  if (mc.janela) {
    if (pausado || mc.fase === "julgando" || mc.fase === "desafio") mcRelogioParar(mc.janela.relogio);
    else if (mc.fase === "janela" || mc.fase === "desfibSolo") mcRelogioCorrer(mc.janela.relogio);
  }
  mcContagens();
  if (pausado) return;
  const agora = mcAgora();
  if (mcRelogioMs(mc.geral) <= 0 && mc.fase !== "julgando" && mc.fase !== "fim") return mcFim();
  if (mc.fase === "abrindo" && agora >= mc.abrirEm) return mcAbrirDica();
  if ((mc.fase === "janela" || mc.fase === "desfibSolo") && mc.janela && mcRelogioMs(mc.janela.relogio) <= 0) {
    if (mc.fase === "desfibSolo") return mcFimVez();
    return mcJanelaFechou();
  }
  if (mc.fase === "desfibOferta" && mc.desfib && agora >= mc.desfib.ate) return mcFimVez();
  if (mc.fase === "intervalo" && mc.intervalo && agora >= mc.intervalo.fimEm) {
    mc.pinata = null;
    mc.intervalo = null;
    return mcNovaRodada();
  }
  if (mc.fase === "desafio" && mc.desafio && !mc.desafio.buzz && agora >= mc.desafio.proxEm) {
    const d = mc.desafio;
    if (d.aberta >= d.dicas.length) return mcDesafioPerdeu();
    d.aberta++;
    d.proxEm = agora + 6000;
    return mcMudou();
  }
  if (mc.fase === "duelo" && mc.duelo && agora >= mc.duelo.ate) {
    if (mc.duelo.fase === "revanche") return mcDueloFim();
    return mcDueloResolver();
  }
}
// textos com contagem regressiva (host e convidado): <b class="mc-cont" data-fim="…">
function mcContagens() {
  const agora = typeof rede !== "undefined" && rede && rede.papel === "convidado" ? redeAgora() : Date.now();
  document.querySelectorAll(".mc-cont[data-fim]").forEach((el) => {
    const s = Math.max(0, Math.ceil((+el.dataset.fim - agora) / 1000));
    const t = el.dataset.mmss ? Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") : String(s);
    if (el.textContent !== t) el.textContent = t;
  });
}
// mudou o estado fora de uma ação (relógio, sorteio): tela do host, save e sala
function mcMudou() {
  if (!mc) return;
  try {
    mcDesenharHost();
  } catch (e) {}
  saveGameState();
  if (typeof redeHostPublicar === "function") redeHostPublicar(true);
}

/* --- retrato público, privado e painel --- */
function mcRetrato() {
  if (CURRENT_MODE !== "caos" || !mc) return null;
  const m = mcMestreId(),
    c = mc.cartas[m],
    j = mc.janela;
  const relo = (r) => (r ? (r.fimEm ? { fimEm: r.fimEm } : { resta: Math.round(r.resta || 0) }) : null);
  return {
    rodada: mc.rodada,
    fase: mc.fase,
    geral: relo(mc.geral),
    rodadaT: relo(mc.rodadaT),
    mestre: m,
    carta: c && mc.fase !== "intervalo" ? { cat: c.cat, aberta: c.aberta, total: c.dicas.length, dicas: c.dicas.slice(0, c.aberta), estado: c.estado } : null,
    cartas: Object.fromEntries(Object.keys(mc.cartas).map((k) => [k, { cat: mc.cartas[k].cat, aberta: mc.cartas[k].aberta, estado: mc.cartas[k].estado, por: mc.cartas[k].por }])),
    janela: j ? { relogio: relo(j.relogio), dur: j.dur, buzz: j.buzz, tentaram: j.tentaram.slice(), congela: j.congela ? { por: j.congela.por, ate: j.congela.ate } : null, mordaca: j.mordaca, imposto: j.imposto, corte: j.corte } : null,
    turbo: mc.turbo,
    pc: { ...mc.pc },
    batata: mc.batata ? { ...mc.batata } : null,
    desafio: mc.desafio ? { com: mc.desafio.com, juiz: mc.desafio.juiz, cat: mc.desafio.cat, dicas: mc.desafio.dicas.slice(0, mc.desafio.aberta), total: mc.desafio.dicas.length, buzz: mc.desafio.buzz, proxEm: mc.desafio.buzz ? null : mc.desafio.proxEm } : null,
    duelo: mc.duelo ? { ladrao: mc.duelo.ladrao, vitima: mc.duelo.vitima, tipo: mc.duelo.tipo, fase: mc.duelo.fase, ate: mc.duelo.ate, escolheu: Object.keys(mc.duelo.esc), lados: mc.duelo.lados, resultado: mc.duelo.resultado, revanche: mc.duelo.revanche } : null,
    pinata: mc.pinata ? { palavra: mc.pinata.palavra, ganhou: mc.pinata.ganhou } : null,
    desfib: mc.desfib ? { id: mc.desfib.id || null, oferta: !!mc.desfib.oferta } : null,
    intervalo: mc.intervalo ? { fimEm: mc.intervalo.fimEm } : null,
    ultimo: mc.ultimo,
    feed: mc.feed.slice(-6),
  };
}
// só pro dispositivo de "id": a carta dele (ele é o Mestre dela), PC, itens, Mão Leve, Desfibrilador, juiz
function mcPrivado(id) {
  if (CURRENT_MODE !== "caos" || !mc || !jogadorPorId(id)) return null;
  const c = mc.cartas[id];
  const juizResp = mc.fase === "julgando" && mcJuiz() === id ? mc.cartas[mcMestreId()].resp : mc.desafio && mc.desafio.juiz === id ? mc.desafio.resp : null;
  return {
    carta: c ? { resp: c.resp, cat: c.cat, aberta: c.aberta, estado: c.estado } : null,
    pc: mc.pc[id] || 0,
    inv: { ...(mc.inv[id] || {}) },
    maoLeve: !!mc.maoLeve && mc.maoLeve.id === id,
    desfibDica: mc.desfib && mc.desfib.id === id ? mc.desfib.dica : null,
    juizResp,
  };
}
// botões de cada um (o host calcula; o convidado só desenha)
function mcOpcoes(id) {
  const op = [];
  const add = (a, d, t, c, g) => op.push({ a, d: d || [], t, ...(c ? { c } : {}), ...(g ? { g } : {}) });
  if (!mcAtivo() || !jogadorPorId(id)) return op;
  if (pausedAt) {
    add("continuar", [], "▶️ Continuar");
    return op;
  }
  const nome = (x) => {
    const p = jogadorPorId(x);
    return p ? (p.avatar ? p.avatar + " " : "") + p.name : "?";
  };
  if (mcPodePalpitar(id)) add("mcPalpitar", [id], mc.fase === "desfibSolo" ? "⚡ Responder (tentativa solo)" : "✋ Palpitar agora!", "ok");
  if (mc.fase === "julgando" && mcJuiz() === id && mc.janela && mc.janela.buzz) {
    add("mcVeredito", [true], `✅ ${nome(mc.janela.buzz)} acertou`, "ok", "Você julga");
    add("mcVeredito", [false], `❌ ${nome(mc.janela.buzz)} errou`, "nao", "Você julga");
  }
  if (mc.fase === "desfibOferta" && mc.desfib && mc.desfib.oferta.includes(id)) add("mcDesfib", [id], "⚡ Usar o Desfibrilador!", "ok", "A carta vai hibernar");
  if (mcPodeBatata(id)) {
    add("mcBatataPassar", [id], "🥔 Passar pro próximo", "", "🥔 A batata tá com você");
    add("mcBatataSegurar", [id], "🥔 Segurar a Batata (carta bônus agora)", "", "🥔 A batata tá com você");
  }
  const d = mc.desafio;
  if (mc.fase === "desafio" && d) {
    if (d.com === id && !d.buzz) add("mcDesafioBater", [id], "🥔 Sei! Vou responder", "ok", "Carta bônus");
    if (d.juiz === id && d.buzz) {
      add("mcDesafioVeredito", [true], `✅ ${nome(d.com)} acertou`, "ok", "Você julga a carta bônus");
      add("mcDesafioVeredito", [false], `❌ ${nome(d.com)} errou`, "nao", "Você julga a carta bônus");
    }
  }
  const du = mc.duelo;
  if (mc.fase === "duelo" && du) {
    if (du.tipo === "ppt") ["pedra", "papel", "tesoura"].forEach((v) => mcPodeEscolherDuelo(id, v) && add("mcDuelo", [id, v], { pedra: "✊ Pedra", papel: "✋ Papel", tesoura: "✌️ Tesoura" }[v], "", "⚔️ Sua jogada (ninguém vê até os dois escolherem)"));
    if (du.tipo === "parimpar") [0, 1, 2, 3, 4, 5].forEach((v) => mcPodeEscolherDuelo(id, v) && add("mcDuelo", [id, v], String(v), "", `⚔️ Você é ${du.lados[id]}: escolha um número`));
    if (mcPodeRevanche(id)) {
      add("mcRevanche", [id, true], "🔁 Revanche! (dobro ou nada)", "ok", "Te roubaram");
      add("mcRevanche", [id, false], "Deixa quieto", "", "Te roubaram");
    }
  }
  if (mc.fase === "janela" && mc.janela) {
    ["corte", "folego", "congelar"].forEach((k) => mcPodeUsar(k, id) && add("mcUsar", [k, id], `${MC_LOJA[k].ic} Usar ${MC_LOJA[k].nome}`, "", "🎒 Seus itens"));
    if (mcItem(id, "mordaca")) players.forEach((p) => mcPodeUsar("mordaca", id, p.id) && add("mcUsar", ["mordaca", id, p.id], `🤐 Amordaçar ${nome(p.id)}`, "", "🎒 Mordaça"));
  }
  if (mc.maoLeve && mc.maoLeve.id === id) players.forEach((p) => mcPodeMaoLeve(id, p.id) && add("mcMaoLeve", [id, p.id], `🧤 Furtar de ${nome(p.id)}`, "", "🧤 Mão Leve (só você vê isso)"));
  if (mc.fase === "intervalo") Object.keys(MC_LOJA).forEach((k) => mcPodeComprar(k, id) && add("mcComprar", [k, id], `${MC_LOJA[k].ic} ${MC_LOJA[k].nome} · ${MC_LOJA[k].preco} PC`, "", `🛒 Lojinha do C.A.O.S. · você tem ${mc.pc[id] || 0} PC`));
  add("pausar", [], "⏸️ Pausar");
  return op;
}
// quem pode mandar cada comando (o host confere pela sessão antes da porta)
function mcPodeComandar(acao, jid, dados) {
  const host = typeof rede !== "undefined" && rede && rede.hostEu === jid;
  if (acao === "mcVeredito") return mcJuiz() === jid || host;
  if (acao === "mcDesafioVeredito") return !!mc && !!mc.desafio && mc.desafio.juiz === jid;
  return !!dados && dados[acao === "mcComprar" || acao === "mcUsar" ? 1 : 0] === jid;
}

/* --- tela (a mesma pro host e pros convidados) --- */
function mcTelaHtml(r, eu, opcoes, priv) {
  const M = r.mc;
  if (!M) return "";
  const jog = (id) => (r.jogadores || []).find((j) => j.id === id);
  const nome = (id) => {
    const j = jog(id);
    return j ? escapeHtml((j.avatar ? j.avatar + " " : "") + j.nome) : "Alguém";
  };
  const fimDe = (rel) => (rel ? (rel.fimEm ? rel.fimEm : (typeof rede !== "undefined" && rede && rede.papel === "convidado" ? redeAgora() : Date.now()) + (rel.resta || 0)) : 0);
  const cont = (rel, mmss) => (rel ? `<b class="mc-cont"${mmss ? ' data-mmss="1"' : ""} data-fim="${fimDe(rel)}">…</b>` : "—");
  const relogios = `<div class="mc-relogios"><span>⏱️ ${cont(M.geral, true)}</span><span>🔄 Rodada ${M.rodada} · ${cont(M.rodadaT, true)}</span>${M.turbo ? '<span class="mc-ev">⏩ TURBO</span>' : ""}${M.janela && M.janela.imposto ? '<span class="mc-ev">💸 IMPOSTO</span>' : ""}</div>`;
  const placar = (r.jogadores || [])
    .slice()
    .sort((a, b) => (b.pontos || 0) - (a.pontos || 0))
    .map((j) => {
      const c = M.cartas[j.id];
      const estado = !c ? "" : c.estado === "capturada" ? "✅" : c.estado === "morta" ? "💀" : `💤 ${c.aberta}/10`;
      return `<li class="${j.id === M.mestre ? "mc-mestre" : ""}"><span>${nome(j.id)}${j.id === eu ? " <small>(você)</small>" : ""}${M.batata && M.batata.com === j.id ? " 🥔" : ""}</span><span class="mc-pl-dir"><small>${estado}</small> <b>🃏 ${j.pontos || 0}</b> <small>· ${M.pc[j.id] || 0} PC</small></span></li>`;
    })
    .join("");
  let centro = "";
  const C = M.carta;
  if (M.fase === "intervalo") {
    centro = `<div class="mc-bloco"><h3>☕ Intervalo · ${cont(M.intervalo, false)} s</h3><p>Relógios congelados. Lojinha aberta (botões do seu painel).</p>${M.pinata ? (M.pinata.ganhou ? `<p>🪅 ${nome(M.pinata.ganhou)} arrebentou a Piñata!</p>` : `<div class="mc-pinata">🪅 <b>PIÑATA!</b> Digite primeiro: <b class="mc-palavra">${escapeHtml(M.pinata.palavra)}</b><form class="mc-pinata-form"><input type="text" class="mc-pinata-txt" maxlength="20" autocomplete="off" aria-label="Palavra da Piñata"><button type="submit">Mandar</button></form></div>`) : ""}</div>`;
  } else if (M.fase === "desafio" && M.desafio) {
    const d = M.desafio;
    centro = `<div class="mc-bloco mc-batata"><h3>🥔 Carta bônus de ${nome(d.com)} · ${escapeHtml(TELAO_CAT[d.cat] || d.cat)}</h3><ol class="mc-dicas">${d.dicas.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ol><p>${d.buzz ? `🗣️ ${nome(d.com)} está respondendo… ${nome(d.juiz)} julga.` : `Próxima dica em ${d.proxEm ? `<b class="mc-cont" data-fim="${d.proxEm}">…</b> s` : "…"} (${d.dicas.length}/${d.total})`}</p></div>`;
  } else if (M.fase === "duelo" && M.duelo) {
    const du = M.duelo;
    const lado = (id) => (du.lados ? ` (${escapeHtml(du.lados[id])})` : "");
    centro = `<div class="mc-bloco mc-duelo"><h3>⚔️ ${du.revanche ? "REVANCHE" : "DUELO"}: ${escapeHtml(MC_DUELO_NOME[du.tipo] || du.tipo)}</h3><p>${nome(du.ladrao)}${lado(du.ladrao)} × ${nome(du.vitima)}${lado(du.vitima)}</p>${du.resultado ? `<p><b>${escapeHtml(du.resultado.det)}</b></p>` : ""}<p>${du.fase === "revanche" ? `${nome(du.vitima)} decide se pede revanche · <b class="mc-cont" data-fim="${du.ate}">…</b> s` : du.tipo === "ppt" || du.tipo === "parimpar" ? `Escolheram: ${du.escolheu.length}/2 · <b class="mc-cont" data-fim="${du.ate}">…</b> s` : `Rolando… <b class="mc-cont" data-fim="${du.ate}">…</b>`}</p></div>`;
  } else if (C) {
    const j = M.janela;
    let estado = "";
    if (M.fase === "abrindo") estado = `🎙️ Vez de ${nome(M.mestre)}: a dica ${C.aberta + 1} já vai abrir…`;
    else if (M.fase === "julgando" && j && j.buzz) estado = `🗣️ ${nome(j.buzz)} está respondendo! ${nome(M.mestre)} julga.`;
    else if (M.fase === "janela" && j) estado = `✋ Quem souber, palpita! <b class="mc-cont mc-janela" data-fim="${fimDe(j.relogio)}">…</b> s${j.congela && Date.now() < j.congela.ate ? ` · 🧊 só ${nome(j.congela.por)} agora` : ""}${j.mordaca ? ` · 🤐 ${nome(j.mordaca)} amordaçado` : ""}`;
    else if (M.fase === "desfibOferta") estado = "⚡ A carta vai hibernar… alguém tem Desfibrilador?";
    else if (M.fase === "desfibSolo" && M.desfib) estado = `⚡ ${nome(M.desfib.id)} está numa tentativa solo com o Desfibrilador!`;
    centro = `<div class="mc-bloco"><div class="mc-cat">🎙️ Carta de ${nome(M.mestre)} · <span class="tc-selo">${escapeHtml(TELAO_CAT[C.cat] || C.cat)}</span> · ${C.aberta}/${C.total} dicas</div><div class="mc-estado">${estado}</div><ol class="mc-dicas">${C.dicas
      .map((t, i) => ({ t, i }))
      .reverse()
      .map((x) => `<li value="${x.i + 1}"${x.i === C.aberta - 1 ? ' class="mc-agora"' : ""}>${escapeHtml(x.t)}</li>`)
      .join("")}</ol></div>`;
  }
  const ult = M.ultimo ? `<div class="mc-ultimo">${M.ultimo.tipo === "capturada" ? `✅ ${nome(M.ultimo.quem)} capturou` : "💀 Ninguém matou"} a carta de ${nome(M.ultimo.mestre)}: <b>${escapeHtml(M.ultimo.resp)}</b></div>` : "";
  // privado
  let meu = "";
  if (priv) {
    const inv = Object.keys(priv.inv || {})
      .filter((k) => priv.inv[k] > 0 && MC_LOJA[k])
      .map((k) => `${MC_LOJA[k].ic}${priv.inv[k] > 1 ? "×" + priv.inv[k] : ""}`)
      .join(" ");
    meu = `<div class="mc-meu">${priv.carta ? `🔒 Sua carta: <b>${escapeHtml(priv.carta.resp)}</b> <small>(${escapeHtml(TELAO_CAT[priv.carta.cat] || priv.carta.cat)} · ${priv.carta.estado === "ativa" ? priv.carta.aberta + "/10 dicas" : priv.carta.estado})</small>` : ""}<div>💠 ${priv.pc} PC${inv ? ` · 🎒 ${inv}` : ""}${priv.maoLeve ? " · 🧤 Mão Leve" : ""}</div>${priv.juizResp ? `<div class="mc-juiz">⚖️ Você julga. A resposta é <b>${escapeHtml(priv.juizResp)}</b></div>` : ""}${priv.desfibDica ? `<div class="mc-desfib">⚡ Dica secreta: <b>${escapeHtml(priv.desfibDica)}</b></div>` : ""}</div>`;
  }
  const grupos = {};
  (opcoes || []).forEach((o, i) => {
    const g = o.g || "";
    (grupos[g] = grupos[g] || []).push(`<button type="button" class="rede-btn${o.c === "ok" ? " rede-ok" : o.c === "nao" ? " rede-nao" : ""}" data-op="${i}">${escapeHtml(o.t)}</button>`);
  });
  const botoes = Object.keys(grupos)
    .map((g) => `<div class="mc-grupo">${g ? `<div class="mc-grupo-tit">${escapeHtml(g)}</div>` : ""}<div class="rede-acoes">${grupos[g].join("")}</div></div>`)
    .join("");
  const feed = (M.feed || []).length ? `<ul class="mc-feed">${M.feed.slice().reverse().map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>` : "";
  return `<div class="mc-tela">${relogios}${centro}${ult}${meu}${botoes ? `<div class="mc-botoes">${botoes}</div>` : ""}<ol class="mc-placar">${placar}</ol>${feed}</div>`;
}
// host: desenha a tela do jogador do próprio dispositivo (hostEu) no lugar da carta de sempre
function mcDesenharHost() {
  if (CURRENT_MODE !== "caos" || !mc) return;
  let box = document.getElementById("mcTela");
  const gs = document.getElementById("gameScreen");
  if (!box && gs) {
    box = document.createElement("section");
    box.id = "mcTela";
    gs.prepend(box);
  }
  if (!box) return;
  ["cardArea", "drawControls", "miniScoreboard", "boardTrack", "deckInfo", "corridaRelogios"].forEach((id) => {
    const e = document.getElementById(id);
    if (e) e.style.display = "none";
  });
  const eu = typeof rede !== "undefined" && rede && rede.hostEu ? rede.hostEu : players[0] && players[0].id;
  const r = retratoPartida("mesa");
  const ops = mcOpcoes(eu);
  box.innerHTML = mcTelaHtml(r, eu, ops, mcPrivado(eu));
  box.querySelectorAll("[data-op]").forEach((b) =>
    b.addEventListener("click", () => {
      const o = ops[+b.dataset.op];
      if (o) dispatchAction({ type: o.a, data: o.d });
    }),
  );
  mcLigarPinata(box, (txt) => dispatchAction({ type: "mcPinata", data: [eu, txt] }));
  mcContagens();
}
function mcLigarPinata(box, mandar) {
  const f = box.querySelector(".mc-pinata-form");
  if (!f) return;
  f.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const i = f.querySelector(".mc-pinata-txt");
    if (i && i.value.trim()) mandar(i.value.trim().slice(0, 20));
    if (i) i.value = "";
  });
}
// convidado: no lugar do telão de sempre
function mcDesenharConvidado(box) {
  const r = rede.retrato;
  const ops = (rede.painel && rede.painel.opcoes) || [];
  const priv = rede.painel && rede.painel.extra;
  const foco = document.activeElement && document.activeElement.classList.contains("mc-pinata-txt") ? document.activeElement.value : null;
  box.innerHTML = `<div class="rede-sala">🌐 Sala <b>${escapeHtml(rede.sala || "")}</b></div>${r.fim ? '<div class="telao-espera">🏁 Fim de partida</div>' : ""}${mcTelaHtml(r, rede.eu, ops, priv)}${redeSairHtml()}`;
  box.querySelectorAll("[data-op]").forEach((b) =>
    b.addEventListener("click", () => {
      const o = ops[+b.dataset.op];
      if (o) redeMandar(o.a, ...o.d);
    }),
  );
  mcLigarPinata(box, (txt) => redeMandar("mcPinata", rede.eu, txt));
  if (foco !== null) {
    const i = box.querySelector(".mc-pinata-txt");
    if (i) {
      i.value = foco;
      i.focus();
    }
  }
  mcContagens();
}

/* --- save --- */
function mcSalvar() {
  if (CURRENT_MODE !== "caos" || !mc) return null;
  const copia = JSON.parse(JSON.stringify(mc));
  // relógios correndo viram "quanto falta"
  const fixa = (r) => {
    if (r && r.fimEm) {
      r.resta = Math.max(0, r.fimEm - Date.now());
      r.fimEm = null;
    }
  };
  fixa(copia.geral);
  fixa(copia.rodadaT);
  if (copia.janela) fixa(copia.janela.relogio);
  return copia;
}
function mcRetomar(s) {
  mcZerar();
  if (CURRENT_MODE !== "caos" || !s || typeof s !== "object" || !s.cartas) return;
  mc = s;
  // prazos absolutos (abrir, intervalo, desafio, duelo) recomeçam a contar a partir de agora
  const agora = Date.now();
  mc.abrirEm = agora + 1500;
  if (mc.intervalo) mc.intervalo.fimEm = agora + MC_INTERVALO_SEG * 1e3;
  if (mc.desafio) mc.desafio.proxEm = agora + 6000;
  if (mc.duelo) mc.duelo.ate = agora + 10000;
  if (mc.desfib && mc.desfib.oferta) mc.desfib.ate = agora + 5000;
  if (mc.fase === "julgando" && mc.janela) mc.janela.buzz = mc.janela.buzz || null;
  if (starterChosen && !gameEnded) mcTique = setInterval(mcTicar, 250);
}

/* --- regras --- */
function mcRegrasHtml() {
  const li = [
    "🌀 <b>Modo C.A.O.S.:</b> só online, 16+, um dispositivo por pessoa, cada um por si. Vence quem tiver <b>mais cartas</b> quando os 10 minutos acabarem.",
    "🃏 <b>Sua carta:</b> a cada rodada cada um recebe uma carta secreta (10 dicas). Você é o Mestre dela e vê a resposta no seu dispositivo.",
    `🎙️ <b>A vez:</b> o Mestre roda. Na sua vez, uma dica da sua carta abre pra todo mundo e a janela de ${MC_JANELA_SEG} s começa. Quem souber toca em <b>Palpitar agora</b> (o primeiro trava), fala a resposta e você marca Acertou/Errou.`,
    "✅ <b>Acertou:</b> captura a carta (1 carta = 1 ponto) e a resposta aparece pra todos. Ninguém acertou: a carta hiberna e volta na sua próxima vez, na dica seguinte.",
    `⏱️ <b>Tempo:</b> partida de ${MC_TEMPO_MS / 60e3} min, rodada de até ${MC_RODADA_MS / 60e3} min, intervalo de ${MC_INTERVALO_SEG} s com tudo congelado.`,
    `💠 <b>Pontos de Caos (PC):</b> não contam no placar; servem pra lojinha. Ganha ${MC_PC.rodada} por rodada, +${MC_PC.rapido} acertando nos ${MC_RAPIDO_MS / 1e3} primeiros segundos, e nos eventos.`,
    `🛒 <b>Lojinha (no intervalo):</b> ${Object.values(MC_LOJA)
      .map((it) => `${it.ic} ${it.nome} (${it.preco})`)
      .join(", ")}.`,
    "🌀 <b>O C.A.O.S. apronta:</b> ⏩ Turbo (janela de 5 s), 💸 Imposto da Preguiça (quem não tenta paga PC), 🥔 Batata Quente (passe ou segure; quem ficar com ela encara a carta bônus), 🧤 Mão Leve (furto secreto), 🪅 Piñata (digite primeiro) e ⚔️ roubos com duelo (dado, moeda, jokenpô, par ou ímpar) e revanche dobro ou nada.",
  ];
  return li.map((t) => "<li>" + t + "</li>").join("");
}
// antes de começar: só online, 3+ pessoas, cada uma no próprio dispositivo, 16+
function mcPodeComecar() {
  const avisar = (t) => {
    const ors = document.getElementById("orderRevealSection"),
      pp = document.getElementById("playerPanel");
    if (ors) ors.style.display = "none";
    if (pp) pp.style.display = "block";
    showToastMessage(`🌀 ${t}`, null, true);
    return false;
  };
  if (typeof salaOnlineAberta !== "function" || !salaOnlineAberta()) return avisar("O Modo C.A.O.S. é só online: abra a sala (🌐) e chame a galera, cada um no seu dispositivo.");
  if (players.length < 3) return avisar("O Modo C.A.O.S. precisa de pelo menos 3 jogadores.");
  const semAparelho = players.filter((p) => p.id !== rede.hostEu && !redeOnline(rede.assentos[p.id]));
  if (semAparelho.length) return avisar(`No Modo C.A.O.S. cada um joga no próprio dispositivo. Falta entrar: ${semAparelho.map((p) => p.name).join(", ")}.`);
  if (players.some((p) => p.idade === "menor")) return avisar("O Modo C.A.O.S. é 16+. Tem jogador marcado com menos de 12 anos.");
  return true;
}
