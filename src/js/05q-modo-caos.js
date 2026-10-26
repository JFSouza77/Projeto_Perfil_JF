/* --- 1.7.10.6 · MODO C.A.O.S. (handoff do JF de 17/10 + decisões dele; docs/Modos_1.7.10.6.md) ---
 * Só online, 16+, um dispositivo por pessoa, individual. Cada um recebe UMA carta secreta por rodada (10 dicas).
 * O Mestre roda: na vez dele, uma dica da carta DELE abre pra todo mundo e a janela de 25 s começa. Quem souber
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
// 25/10/2026: os prazos do Modo C.A.O.S. são marcados no tempo de jogo (relógio único, 02d): pausa e aviso da
// mesa param tudo sozinhos. Pros celulares, o retrato converte pro horário de verdade (relogioParede).
function mcAgora() {
  return relogioJogo();
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
// 1.7.10.7 (combinado com o JF): nada de balão nem de feed rolando. A linha fica guardada (a última aparece na
// tela) e o que é importante vira o aviso da mesa: tela escura, caixa grande, tempo congelado
function mcAnunciar(txt, aviso) {
  mcLog(txt);
  if (aviso && typeof avisoMostrar === "function") avisoMostrar(aviso);
}
function mcFoto() {
  if (!mc) return "";
  const j = mc.janela;
  return JSON.stringify([mc.rodada, mc.fase, mc.vez, Object.keys(mc.cartas).map((k) => [k, mc.cartas[k].aberta, mc.cartas[k].estado]), mc.pc, mc.inv, mc.vitrine, j && [j.buzz, j.tentaram, j.serial, !!j.congela, j.mordaca], mc.batata, mc.desafio && [mc.desafio.aberta, mc.desafio.buzz], mc.duelo && [mc.duelo.fase, mc.duelo.esc], mc.pinata, mc.maoLeve]);
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
    olhos: {},
    vitrine: null,
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
  mcAnunciar(`🌀 Modo C.A.O.S. começou. ${MC_TEMPO_MS / 60e3} minutos. Que vença o mais rápido.`, { ic: "🌀", titulo: "MODO C.A.O.S.!", texto: `Cada um tem a sua carta secreta. ${MC_TEMPO_MS / 60e3} minutos. Agora quem manda aqui sou eu.`, botao: "Que venha o caos! 🌀" });
  mcNovaRodada();
  mcTique = mcTique || setInterval(mcTicar, 250);
}
function mcBaralho() {
  return allCards && allCards.length ? allCards : baralhoClassico();
}
function mcNovaRodada() {
  mc.rodada++;
  if (mc.ultimo && mc.ultimo.tipo === "dormiu") mc.ultimo = null; // debug 23/10: rodada nova, cartas novas: ninguém está dormindo
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
    cartasRecentesMarcar(raw.answer); // 1.7.10.8
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
  deck = baralhoAfastarRecentes(shuffle(mcBaralho().slice())); // 1.7.10.8
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
  mc.abrirEm = mcAgora() + MC_PAUSA_VEZ_MS;
  if (mcEventoNaVez()) return; // o C.A.O.S. aprontou alguma coisa antes da dica (duelo, batata…)
  mcMudou();
}
function mcAbrirDica() {
  const id = mcMestreId(),
    c = mc.cartas[id];
  if (!c || !mcCartaViva(id)) return mcFimVez();
  if (mc.ultimo && mc.ultimo.tipo === "dormiu" && mc.ultimo.mestre === id) mc.ultimo = null; // a carta acordou
  c.aberta++;
  mc.serial++;
  const dur = (mc.turbo === id ? MC_TURBO_SEG : MC_JANELA_SEG) * 1e3;
  mc.janela = { serial: mc.serial, dur, inicio: mcAgora(), relogio: { resta: dur, fimEm: null }, buzz: null, buzzEm: 0, tentaram: [], folego: [], congela: null, mordaca: null, corte: false, imposto: false, bateram: [] };
  mcRelogioCorrer(mc.janela.relogio);
  // Imposto da Preguiça: sorteado no começo da vez (mcEventoNaVez), vale pra 1ª dica dela
  if (mc.impostoVez === id) {
    mc.janela.imposto = true;
    mc.impostoVez = null;
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
  mcLog(`🧟 ${mcNome(id)} usou a ${MC_LOJA.desfib.nome}: viu uma dica que ninguém mais viu.`);
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
  } else if (c && c.estado === "ativa") {
    mcLog(`💤 A carta de ${mcNome(id)} hibernou (${c.aberta} de ${c.dicas.length} dicas).`);
    // 1.7.10.9.3 (JF): aviso fixo de que a carta está dormindo e quando volta (sem a resposta, claro)
    mc.ultimo = { tipo: "dormiu", mestre: id, cat: c.cat, dicas: c.aberta, total: c.dicas.length };
  }
  if (mc.turbo === id) mc.turbo = null;
  mc.impostoVez = null;
  mc.janela = null;
  mc.desfib = null;
  // Batata Quente: depois da 3ª dica, quem está com ela encara a carta bônus
  if (mc.batata && mc.batata.dicas >= 3) {
    const com = mc.batata.com;
    mcAnunciar(`🥔💥 A batata estourou na mão de ${mcNome(com)}! Carta bônus agora.`, {
      ic: "🥔",
      titulo: "A BATATA ESTOUROU!",
      texto: `Na mão de ${mcNome(com)}. Carta bônus agora: até 5 dicas, valendo 1 carta.`,
      anim: "batata",
      variantes: { [com]: { titulo: "A batata estourou na sua mão!", texto: "Carta bônus agora: até 5 dicas. Sabe? Bate e responde." } },
    });
    return mcDesafioComecar(com);
  }
  mc.vez = (mc.vez + 1) % mc.ordem.length;
  mcComecarVez();
}
function mcFimRodada() {
  players.forEach((p) => mcPcMudar(p.id, MC_PC.rodada));
  mcLog(`☕ Fim da rodada ${mc.rodada}. Todo mundo ganhou ${MC_PC.rodada} PC.`);
  if (mcRelogioMs(mc.geral) <= 0) return mcFim();
  mc.fase = "intervalo";
  mc.janela = null;
  mc.intervalo = { fimEm: mcAgora() + MC_INTERVALO_SEG * 1e3, ini: mcAgora() };
  mc.vitrine = lojaVitrineSortear(MC_LOJA, MC_VITRINE); // 1.7.10.6: vitrine nova a cada intervalo
  // Mão Leve: uma vez por partida, a partir da 2ª rodada, alguém (de preferência da metade de baixo) recebe em segredo
  if (!mc.maoLeve && mc.cont.maoLeve < 1 && mc.rodada >= 1 && players.length >= 3 && sorteioRegra() < 0.6) {
    const baixo = players.slice().sort((a, b) => (a.score || 0) - (b.score || 0)).slice(0, Math.ceil(players.length / 2));
    mc.maoLeve = { id: sorteioItem(baixo).id };
    mc.cont.maoLeve++;
    caosLog("modocaos", "Mão Leve entregue em segredo");
    // só quem recebeu fica sabendo (aviso privado: não congela a mesa)
    avisoMostrar({ ic: "🧤", titulo: "Você ganhou a Mão Leve!", texto: "Segredo. Use quando quiser pra tirar 1 carta de alguém sem ninguém saber que foi você.", anim: "maoleve", para: [mc.maoLeve.id], seg: 5, botao: "Hehe 😏" });
  }
  const presente = mcPresenteTalvez();
  // Piñata: às vezes, no intervalo (não no mesmo intervalo do presente: um aviso grande por vez)
  if (!presente && mc.cont.pinata < 3 && sorteioRegra() < 0.45) {
    mc.cont.pinata++;
    mc.pinata = { palavra: sorteioItem(MC_PINATA_PALAVRAS), ganhou: null };
    mcAnunciar(`🪅 PIÑATA! Quem digitar primeiro "${mc.pinata.palavra}" leva ${MC_PC.pinata} PC!`, { ic: "🪅", titulo: "PIÑATA!", texto: `Quem digitar primeiro "${mc.pinata.palavra}" leva ${MC_PC.pinata} PC!`, anim: "pinata" });
  }
  mcMudou();
}
// 1.7.10.9.2 · Presente do C.A.O.S.: o lanterna, bem atrás do líder, ganha 1 item (1 vez por partida)
function mcPresenteTalvez() {
  if ((mc.cont.presente || 0) >= 1 || players.length < 3 || cartasPartida.length < MC_PRESENTE_CARTAS) return false;
  const pts = (p) => p.score || 0;
  const ord = players.slice().sort((a, b) => pts(b) - pts(a));
  const topo = pts(ord[0]),
    fundo = pts(ord[ord.length - 1]);
  // líder e lanterna únicos (empate adia pro próximo intervalo)
  if (topo - fundo < MC_PRESENTE_DIF || ord.filter((p) => pts(p) === topo).length !== 1 || ord.filter((p) => pts(p) === fundo).length !== 1) return false;
  const quem = ord[ord.length - 1],
    item = sorteioItem(MC_PRESENTE_ITENS),
    it = MC_LOJA[item];
  mc.cont.presente = 1;
  mc.inv[quem.id] = mc.inv[quem.id] || {};
  mc.inv[quem.id][item] = (mc.inv[quem.id][item] || 0) + 1;
  // a mesa sabe que teve presente; qual item, só quem ganhou (igual à lojinha, que é segredo)
  mcAnunciar(`🎁 PRESENTE DO C.A.O.S.! ${quem.name} ficou pra trás e ganhou um item.`, {
    ic: "🎁",
    titulo: "PRESENTE DO C.A.O.S.!",
    texto: `${quem.name} ficou ${topo - fundo} cartas atrás do líder e ganhou um item da lojinha. Qual? Segredo.`,
    anim: "presente",
    variantes: { [quem.id]: { titulo: "Um presente pra você!", texto: `Você ganhou ${it.ic} ${it.nome}: ${it.desc}. Ele aparece nos seus itens.`, botao: "Valeu, C.A.O.S.! 🎁" } },
  });
  return true;
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
// 1.7.10.6: a vitrine do intervalo (sorteada em mcFimRodada; uma só pra mesa, quem compra primeiro leva)
function mcPreco(item) {
  return (mc && mc.vitrine && mc.vitrine.precos[item]) || (MC_LOJA[item] || {}).preco || 0;
}
// 1.7.10.9.3 (JF): a vitrine aparece no começo do intervalo, mas os botões só liberam depois de LOJA_TRAVA_MS
function mcLojaTravada() {
  return !!(mc && mc.fase === "intervalo" && mc.intervalo && mc.intervalo.ini && mcAgora() - mc.intervalo.ini < LOJA_TRAVA_MS);
}
function mcPodeComprar(item, id) {
  const it = MC_LOJA[item];
  if (!mcAtivo() || mc.fase !== "intervalo" || !it || !jogadorPorId(id) || !mc.vitrine || mcLojaTravada()) return false;
  if ((mc.vitrine.estoque[item] || 0) <= 0 || (mc.pc[id] || 0) < mcPreco(item)) return false;
  if (item === "assalto") return players.some((p) => p.id !== id && (mc.pc[p.id] || 0) > 0);
  return true;
}
function mcComprar(item, id) {
  if (!mcPodeComprar(item, id)) return;
  mcPcMudar(id, -mcPreco(item));
  mc.vitrine.estoque[item]--;
  playSfx("joia");
  if (item === "assalto") {
    mcAssalto(id);
    return mcMudou();
  }
  mc.inv[id] = mc.inv[id] || {};
  mc.inv[id][item] = (mc.inv[id][item] || 0) + 1;
  mcLog(`🛒 ${mcNome(id)} comprou alguma coisa na lojinha…`); // o que foi é segredo dele
  mcMudou();
}
// Assalto Relâmpago: leva MC_ASSALTO_PC de quem tem mais PC; o Colete segura, o Espelho devolve o assalto
function mcAssalto(id) {
  const alvo = players.filter((p) => p.id !== id && (mc.pc[p.id] || 0) > 0).sort((a, b) => (mc.pc[b.id] || 0) - (mc.pc[a.id] || 0))[0];
  if (!alvo) return;
  if (mcItem(alvo.id, "kevlar")) {
    mc.inv[alvo.id].kevlar--;
    return mcAnunciar(`💸 ${mcNome(id)} tentou um Assalto Relâmpago em ${alvo.name}, mas o ${MC_LOJA.kevlar.nome} segurou!`, { ic: "🦺", titulo: "Assalto barrado!", texto: `${mcNome(id)} tentou assaltar ${alvo.name}, mas o ${MC_LOJA.kevlar.nome} segurou.` });
  }
  let de = alvo.id,
    para = id;
  if (mcItem(alvo.id, "espelho")) {
    mc.inv[alvo.id].espelho--;
    de = id;
    para = alvo.id;
  }
  const n = Math.min(MC_ASSALTO_PC, mc.pc[de] || 0);
  mcPcMudar(de, -n);
  mcPcMudar(para, n);
  const txtAssalto = de === id ? `🪞 O Espelho de ${alvo.name} refletiu o Assalto Relâmpago! ${mcNome(id)} perdeu ${n} PC pra ${alvo.name}.` : `💸 ASSALTO RELÂMPAGO! ${mcNome(id)} levou ${n} PC de ${alvo.name}.`;
  mcAnunciar(txtAssalto, { ic: de === id ? "🪞" : "💸", titulo: de === id ? "O Espelho refletiu!" : "ASSALTO RELÂMPAGO!", texto: txtAssalto.replace(/^\S+ /, ""), anim: "imposto" });
}
function mcPodeUsar(item, id, alvo) {
  if (!mcAtivo() || !mcItem(id, item) || !mc.janela) return false;
  const j = mc.janela;
  if (mc.fase !== "janela" || j.buzz) return false;
  // 1.7.10.9.1 (JF: "usou o item, funciona naquele momento"): sem janelinha certa pra usar
  if (item === "corte") return !j.corte && mcRelogioMs(j.relogio) > 6000;
  if (item === "folego") return j.tentaram.includes(id) && !j.folego.includes(id);
  if (item === "congelar") return !j.congela && id !== mcMestreId();
  if (item === "olho") return id !== mcMestreId() && !(mc.olhos[id] && mc.olhos[id].serial === j.serial);
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
    mcAnunciar(`✂️ ${mcNome(id)} usou a ${MC_LOJA.corte.nome}: a janela caiu pra 6 segundos!`);
  } else if (item === "folego") {
    j.folego.push(id);
    j.tentaram = j.tentaram.filter((x) => x !== id);
    mcLog(`💖 ${mcNome(id)} usou uma ${MC_LOJA.folego.nome} e pode tentar de novo.`);
  } else if (item === "congelar") {
    j.congela = { por: id, ate: mcAgora() + 7000 };
    mcAnunciar(`🥶 ${mcNome(id)} chamou a ${MC_LOJA.congelar.nome}: só ${mcNome(id)} pode palpitar pelos próximos 7 segundos.`);
  } else if (item === "olho") {
    // a 1ª letra da resposta, só no dispositivo de quem usou (mcPrivado), enquanto durar esta dica
    const c = mc.cartas[mcMestreId()];
    const letra = c ? (String(c.resp).match(/[A-Za-zÀ-ÿ0-9]/) || ["?"])[0].toUpperCase() : "?";
    mc.olhos[id] = { serial: j.serial, letra };
    mcLog(`👁️ ${mcNome(id)} usou alguma coisa…`);
  } else if (item === "mordaca") {
    let vitima = alvo,
      autor = id;
    if (mcItem(alvo, "espelho")) {
      mc.inv[alvo].espelho--;
      vitima = id;
      autor = alvo;
      mcAnunciar(`🪞 O Espelho de ${mcNome(alvo)} refletiu a Mordaça! ${mcNome(id)} levou a mordaça.`);
    } else mcAnunciar(`🤐 ${mcNome(id)} amordaçou ${mcNome(alvo)} nesta dica.`);
    j.mordaca = vitima;
    mc.garganta[vitima] = j.serial + 1; // Garganta Limpa: imune na próxima dica
    avisoMostrar({ ic: "🤐", titulo: "Você foi amordaçado!", texto: "Nesta dica você não pode palpitar.", para: [vitima], seg: 2.5 });
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
  // 1.7.10.7: um evento por vez, todos no mesmo sorteio (o imposto também), sempre entre uma vez e outra
  // Batata Quente: até 2 por partida, uma de cada vez
  if (!mc.batata && !mc.desafio && mc.cont.batata < 2 && r >= 0.07 && r < 0.13) {
    const alvo = sorteioItem(players.filter((p) => p.id !== mcMestreId()));
    if (alvo) {
      mc.cont.batata++;
      mc.batata = { com: alvo.id, dicas: 0 };
      mcAnunciar(`🥔 BATATA QUENTE na mão de ${alvo.name}!`, {
        ic: "🥔",
        titulo: "BATATA QUENTE!",
        texto: `Tá na mão de ${alvo.name}. Ela queima por 3 dicas: passe pra frente ou segure (e encare a carta bônus).`,
        anim: "batata",
        variantes: { [alvo.id]: { titulo: "A BATATA TÁ COM VOCÊ!", texto: "Ela queima por 3 dicas. Passe pra frente ou segure e encare a carta bônus." } },
      });
    }
  }
  // Modo Turbo: a carta deste Mestre roda com janela curta
  else if (!mc.turbo && mc.cont.turbo < 2 && r >= 0.13 && r < 0.19) {
    mc.cont.turbo++;
    mc.turbo = mcMestreId();
    mcAnunciar(`⏩ MODO TURBO na carta de ${mcNome(mc.turbo)}.`, { ic: "⏩", titulo: "MODO TURBO!", texto: `A carta de ${mcNome(mc.turbo)} roda com janela de ${MC_TURBO_SEG} segundos por dica.`, anim: "turbo" });
  }
  // Imposto da Preguiça: na 1ª dica desta vez, quem não tentar paga
  else if (mc.cont.imposto < 3 && mc.rodada >= 2 && r >= 0.19 && r < 0.25) {
    mc.cont.imposto++;
    mc.impostoVez = mcMestreId();
    mcAnunciar(`💸 IMPOSTO DA PREGUIÇA na próxima dica.`, { ic: "💸", titulo: "IMPOSTO DA PREGUIÇA!", texto: `Na próxima dica, quem não tentar palpitar paga ${MC_PC.imposto} PC.`, anim: "imposto" });
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
  mcLog(`🥔 ${mcNome(id)} passou a batata… agora tá com ${alvo.name}!`);
  // só quem recebeu leva o susto (não para a dica da mesa)
  avisoMostrar({ ic: "🥔", titulo: "A BATATA TÁ COM VOCÊ!", texto: `${mcNome(id)} passou pra você. Passe pra frente ou segure.`, anim: "batata", para: [alvo.id], seg: 3 });
  mcMudou();
}
// pedido do JF: "Segurar a Batata" = fica com ela e encara a carta bônus na hora
function mcBatataSegurar(id) {
  if (!mcPodeBatata(id)) return;
  mcAnunciar(`🥔 ${mcNome(id)} SEGUROU a batata! Carta bônus agora.`, { ic: "🥔", titulo: `${mcNome(id)} SEGUROU A BATATA!`, texto: "Carta bônus agora: até 5 dicas, valendo 1 carta.", anim: "batata" });
  if (mc.janela) mcRelogioParar(mc.janela.relogio);
  const naAbertura = mc.fase === "abrindo";
  mcDesafioComecar(id);
  if (naAbertura && mc.desafio) mc.desafio.mesmaVez = true; // segurou antes da dica abrir: a vez desse Mestre não se perde
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
    mcAnunciar(`🥔✅ ${mcNome(d.com)} venceu a carta bônus (${d.resp}): +1 carta e +${MC_PC.batata} PC!`, { ic: "🥔", titulo: `${mcNome(d.com)} venceu a carta bônus!`, texto: `Era ${d.resp}. +1 carta e +${MC_PC.batata} PC.` });
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
      txt += ` O ${MC_LOJA.kevlar.nome} segurou a perda!`;
    } else {
      p.score--;
      lanterna.score = (lanterna.score || 0) + 1;
      txt += ` Uma carta foi pro lanterna, ${lanterna.name}.`;
    }
  }
  mcAnunciar(txt, { ic: "💥", titulo: "Carta bônus perdida!", texto: txt.replace(/^\S+ /, ""), anim: "bomba" });
  mcDesafioFim();
}
function mcDesafioFim() {
  const volta = mc.desafio ? mc.desafio.voltaFase : "abrindo",
    mesmaVez = !!(mc.desafio && mc.desafio.mesmaVez);
  mc.desafio = null;
  // segurou no meio de uma janela: ela volta de onde parou; senão, segue a roda
  if (volta === "janela" && mc.janela) {
    mc.fase = "janela";
    mcRelogioCorrer(mc.janela.relogio);
    return mcMudou();
  }
  if (!mesmaVez) mc.vez = (mc.vez + 1) % mc.ordem.length;
  mcComecarVez();
}

// Roubo: um ladrão abaixo do topo desafia alguém com placar igual ou maior.
// 1.8 (pedido do JF): quem foi desafiado escolhe o duelo em 10 s; não escolheu, o C.A.O.S. sorteia.
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
  mc.duelo = { ladrao: ladrao.id, vitima: vitima.id, tipo: null, fase: "tipo", esc: {}, ate: mcAgora() + MC_DUELO_TIPO_MS, revanche: false, lados: null, resultado: null };
  mc.fase = "duelo";
  mcAnunciar(`⚔️ ROUBO! ${ladrao.name} quer uma carta de ${vitima.name}. ${vitima.name} escolhe o duelo!`, {
    ic: "⚔️",
    titulo: "É HORA DO DUELO!",
    texto: `${ladrao.name} quer uma carta de ${vitima.name}. ${vitima.name} escolhe o duelo em ${MC_DUELO_TIPO_MS / 1000} s.`,
    anim: "duelo",
    variantes: {
      [ladrao.id]: { titulo: `Você desafiou ${vitima.name}!`, texto: `Valendo uma carta. ${vitima.name} está escolhendo o duelo.` },
      [vitima.id]: { titulo: `${ladrao.name} quer uma carta sua!`, texto: `Você escolhe o duelo: dado, moeda, jokenpô ou par ou ímpar. ${MC_DUELO_TIPO_MS / 1000} s!` },
    },
  });
  mcMudou();
  return true;
}
const MC_DUELO_TIPO_MS = 10000;
function mcPodeEscolherTipo(id, tipo) {
  const d = mc && mc.duelo;
  return mcAtivo() && mc.fase === "duelo" && !!d && d.fase === "tipo" && d.vitima === id && MC_DUELOS.includes(tipo);
}
function mcDueloTipoEscolher(id, tipo) {
  if (!mcPodeEscolherTipo(id, tipo)) return;
  mcDueloDefinirTipo(tipo, id);
}
// O duelo ganhou tipo (escolhido pelo desafiado ou sorteado): lados, prazo e o aviso do tipo
function mcDueloDefinirTipo(tipo, quem) {
  const d = mc.duelo;
  d.tipo = tipo;
  d.fase = "escolha";
  d.ate = mcAgora() + 12000;
  if (d.tipo === "moeda") d.lados = Math.random() < 0.5 ? { [d.ladrao]: "cara", [d.vitima]: "coroa" } : { [d.ladrao]: "coroa", [d.vitima]: "cara" };
  if (d.tipo === "parimpar") d.lados = Math.random() < 0.5 ? { [d.ladrao]: "par", [d.vitima]: "ímpar" } : { [d.ladrao]: "ímpar", [d.vitima]: "par" };
  // dado e moeda não têm escolha: o C.A.O.S. rola na hora (com suspense)
  if (d.tipo === "d6" || d.tipo === "moeda") d.ate = mcAgora() + 3500;
  const como = quem ? `${mcNome(quem)} escolheu` : "Ninguém escolheu: o C.A.O.S. sorteou";
  mcAnunciar(`⚔️ ${como}: ${MC_DUELO_NOME[tipo]}!`, { ic: "⚔️", titulo: MC_DUELO_NOME[tipo], texto: `${como}. ${mcNome(d.ladrao)} × ${mcNome(d.vitima)}, melhor de 3.`, anim: "duelo" });
  mcMudou();
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
  let anim = null,
    dados = null; // 1.7.10.7: o resultado vira aviso animado (mãozinha balançando, dado, moeda)
  if (d.tipo === "d6") {
    let a, b;
    do {
      a = 1 + Math.floor(Math.random() * 6);
      b = 1 + Math.floor(Math.random() * 6);
    } while (a === b);
    venc = a > b ? L : V;
    det = `${mcNome(L)} tirou ${a}, ${mcNome(V)} tirou ${b}`;
    anim = "dado";
    dados = { nomeA: mcNome(L), nomeB: mcNome(V), a, b };
  } else if (d.tipo === "moeda") {
    const lado = Math.random() < 0.5 ? "cara" : "coroa";
    venc = d.lados[L] === lado ? L : V;
    det = `deu ${lado}`;
    anim = "moeda";
    dados = { lado };
  } else if (d.tipo === "ppt") {
    const ops = ["pedra", "papel", "tesoura"];
    const a = d.esc[L] !== undefined ? d.esc[L] : aleat(ops),
      b = d.esc[V] !== undefined ? d.esc[V] : aleat(ops);
    // 1.7.10.9.3: no máximo 3 empates seguidos; no 3º, o C.A.O.S. sorteia quem leva a rodada (senão o duelo não acaba)
    d.empates = a === b ? (d.empates || 0) + 1 : 0;
    if (a === b && d.empates < 3) {
      d.esc = {};
      d.ate = mcAgora() + 10000;
      mcAnunciar(`✊ Empate (${a})! De novo.`, { ic: "✊", titulo: "Empate! De novo!", texto: `Os dois de ${a}.`, anim: "ppt", dados: { nomeA: mcNome(L), nomeB: mcNome(V), a, b } });
      return mcMudou();
    }
    const ganha = { pedra: "tesoura", papel: "pedra", tesoura: "papel" };
    if (a === b) {
      d.empates = 0;
      venc = Math.random() < 0.5 ? L : V;
      det = `3 empates seguidos (${a}): o C.A.O.S. sorteou ${mcNome(venc)}`;
    } else {
      venc = ganha[a] === b ? L : V;
      det = `${mcNome(L)}: ${a} × ${mcNome(V)}: ${b}`;
    }
    anim = "ppt";
    dados = { nomeA: mcNome(L), nomeB: mcNome(V), a, b };
  } else {
    const a = d.esc[L] !== undefined ? d.esc[L] : Math.floor(Math.random() * 6),
      b = d.esc[V] !== undefined ? d.esc[V] : Math.floor(Math.random() * 6);
    const res = (a + b) % 2 === 0 ? "par" : "ímpar";
    venc = d.lados[L] === res ? L : V;
    det = `${a} + ${b} = ${a + b} (${res})`;
    anim = "parimpar";
    dados = { nomeA: mcNome(L), nomeB: mcNome(V), a, b };
  }
  const avisoRes = (titulo) => ({ ic: "⚔️", titulo, texto: det, anim, dados, seg: 5.5 });
  // 1.7.10.9.3 (JF): melhor de 3. Quem ganhar MC_DUELO_VITORIAS rodadas leva; antes disso, rodada nova do mesmo duelo
  d.placar = d.placar || { [L]: 0, [V]: 0 };
  d.placar[venc] = (d.placar[venc] || 0) + 1;
  d.rodada = d.rodada || 1;
  const pl = `${mcNome(L)} ${d.placar[L]} × ${d.placar[V]} ${mcNome(V)}`;
  if (d.placar[venc] < MC_DUELO_VITORIAS) {
    d.resultado = { venc, det: `Rodada ${d.rodada}: ${det} · ${pl}` };
    d.rodada++;
    d.esc = {};
    d.fase = "escolha";
    d.ate = mcAgora() + (d.tipo === "d6" || d.tipo === "moeda" ? 3500 : 12000);
    mcAnunciar(`⚔️ Rodada ${d.rodada - 1}: ${det}. ${mcNome(venc)} saiu na frente (${pl}).`, { ...avisoRes(`${mcNome(venc)} levou a rodada ${d.rodada - 1}!`), texto: `${det} · ${pl}` });
    return mcMudou();
  }
  det = `${det} · ${pl}`;
  d.resultado = { venc, det };
  const ladraoVenceu = venc === L;
  if (!d.revanche) {
    if (ladraoVenceu) {
      const ok = mcTransferir(V, L, "roubo");
      mcAnunciar(`⚔️ ${det}. ${ok ? `${mcNome(L)} roubou uma carta de ${mcNome(V)}!` : "Mas a carta não saiu do lugar."}`, avisoRes(ok ? `${mcNome(L)} roubou uma carta de ${mcNome(V)}!` : `${mcNome(L)} venceu, mas a carta não saiu do lugar`));
      if (ok) {
        d.fase = "revanche";
        d.ate = mcAgora() + 10000;
        return mcMudou();
      }
    } else mcAnunciar(`⚔️ ${det}. ${mcNome(V)} defendeu a carta!`, avisoRes(`${mcNome(V)} defendeu a carta!`));
    return mcDueloFim();
  }
  // revanche (dobro ou nada): a vítima ganhou, recupera a carta e ainda leva outra; perdeu, fica como está
  if (venc === V) {
    mcTransferir(L, V, "revanche", true);
    const mais = mcTransferir(L, V, "revanche", true);
    mcAnunciar(`🔁 ${det}. ${mcNome(V)} venceu a revanche: recuperou a carta${mais ? " e ainda levou outra" : ""}!`, avisoRes(`${mcNome(V)} venceu a revanche!`));
  } else mcAnunciar(`🔁 ${det}. ${mcNome(L)} venceu de novo. A perda fica.`, avisoRes(`${mcNome(L)} venceu de novo!`));
  mcDueloFim();
}
// tira 1 carta de "de" e dá pra "para". Escudo segura, Espelho reflete (no roubo, o ladrão perde 1 pro dono)
function mcTransferir(de, para, tipo, semProtecao) {
  const a = jogadorPorId(de),
    b = jogadorPorId(para);
  if (!a || !b || (a.score || 0) <= 0) return false;
  if (!semProtecao && mcItem(de, "kevlar")) {
    mc.inv[de].kevlar--;
    mcLog(`🦺 O ${MC_LOJA.kevlar.nome} de ${a.name} segurou o ${tipo}!`);
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
  d.placar = null; // a revanche também é melhor de 3
  d.rodada = 1;
  d.ate = mcAgora() + (d.tipo === "d6" || d.tipo === "moeda" ? 3500 : 12000);
  mcAnunciar(`🔁 ${mcNome(id)} pediu REVANCHE: dobro ou nada!`, { ic: "🔁", titulo: "REVANCHE!", texto: `${mcNome(id)} pediu dobro ou nada contra ${mcNome(d.ladrao)}.`, anim: "duelo" });
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
  // 1.7.10.7 (pedido do JF): é segredo. Só quem foi roubado fica sabendo, com a tela escura e as mãozinhas
  mcLog(ok ? "🧤 A Mão Leve passou por aqui…" : "🧤 A Mão Leve tentou… e não conseguiu.");
  if (ok) avisoMostrar({ ic: "🧤", titulo: "VOCÊ FOI ROUBADO!", texto: "Mão Leve passou por aqui. Você ficou com uma carta a menos… e ninguém viu quem foi.", anim: "maoleve", para: [alvo], seg: 5 });
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
  mcAnunciar(`🪅 ${mcNome(id)} arrebentou a Piñata: +${MC_PC.pinata} PC!`, { ic: "🪅", titulo: `${mcNome(id)} arrebentou a Piñata!`, texto: `+${MC_PC.pinata} PC.`, anim: "pinata", seg: 3 });
  mcMudou();
}

/* --- tique: relógios e prazos --- */
function mcTicar() {
  if (!mcAtivo()) return;
  // 1.7.10.7: aviso da mesa na tela: tudo para. 25/10/2026: os prazos (abrir dica, intervalo, desafio, duelo,
  // desfibrilador, Era do Gelo) e os relógios estão no tempo de jogo, que para sozinho na pausa e no aviso;
  // antes este tique empurrava cada um deles (e esquecer um era bug de tempo)
  mc.ultTick = mcAgora();
  if (typeof avisoMesaCongela === "function" && avisoMesaCongela()) {
    [mc.geral, mc.rodadaT, mc.janela && mc.janela.relogio].forEach(mcRelogioParar);
    return mcContagens();
  }
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
  // 1.7.10.9.3: passaram os 3 s de leitura: libera os botões da lojinha em todo dispositivo
  if (mc.fase === "intervalo" && mc.intervalo && !mc.intervalo.liberou && !mcLojaTravada()) {
    mc.intervalo.liberou = true;
    mcMudou();
  }
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
    if (mc.duelo.fase === "tipo") return mcDueloDefinirTipo(sorteioItem(MC_DUELOS), null);
    return mcDueloResolver();
  }
}
// textos com contagem regressiva (host e convidado): <b class="mc-cont" data-fim="…">
function mcContagens() {
  const agora = typeof rede !== "undefined" && rede && rede.papel === "convidado" ? redeAgora() : Date.now();
  document.querySelectorAll(".mc-barra[data-fim]").forEach((el) => {
    const f = Math.max(0, Math.min(1, (+el.dataset.fim - agora) / (+el.dataset.dur || 1)));
    const i = el.querySelector("i");
    if (i) i.style.width = (f * 100).toFixed(1) + "%";
    el.classList.toggle("mc-barra-fim", f < 0.3);
  });
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
  // prazos do tempo de jogo → horário de verdade (os celulares contam no relógio da rede)
  const P = relogioParede;
  const relo = (r) => (r ? (r.fimEm ? { fimEm: P(r.fimEm) } : { resta: Math.round(r.resta || 0) }) : null);
  return {
    rodada: mc.rodada,
    fase: mc.fase,
    geral: relo(mc.geral),
    rodadaT: relo(mc.rodadaT),
    mestre: m,
    carta: c && mc.fase !== "intervalo" ? { cat: c.cat, aberta: c.aberta, total: c.dicas.length, dicas: c.dicas.slice(0, c.aberta), estado: c.estado } : null,
    cartas: Object.fromEntries(Object.keys(mc.cartas).map((k) => [k, { cat: mc.cartas[k].cat, aberta: mc.cartas[k].aberta, estado: mc.cartas[k].estado, por: mc.cartas[k].por }])),
    janela: j ? { relogio: relo(j.relogio), dur: j.dur, buzz: j.buzz, tentaram: j.tentaram.slice(), congela: j.congela ? { por: j.congela.por, ate: P(j.congela.ate) } : null, mordaca: j.mordaca, imposto: j.imposto, corte: j.corte } : null,
    turbo: mc.turbo,
    abrirEm: mc.fase === "abrindo" ? P(mc.abrirEm) : null,
    pc: { ...mc.pc },
    vitrine: mc.vitrine ? { estoque: { ...mc.vitrine.estoque }, precos: { ...mc.vitrine.precos } } : null,
    batata: mc.batata ? { ...mc.batata } : null,
    desafio: mc.desafio ? { com: mc.desafio.com, juiz: mc.desafio.juiz, cat: mc.desafio.cat, dicas: mc.desafio.dicas.slice(0, mc.desafio.aberta), total: mc.desafio.dicas.length, buzz: mc.desafio.buzz, proxEm: mc.desafio.buzz ? null : P(mc.desafio.proxEm) } : null,
    duelo: mc.duelo ? { ladrao: mc.duelo.ladrao, vitima: mc.duelo.vitima, tipo: mc.duelo.tipo, fase: mc.duelo.fase, ate: P(mc.duelo.ate), escolheu: Object.keys(mc.duelo.esc), lados: mc.duelo.lados, resultado: mc.duelo.resultado, revanche: mc.duelo.revanche, placar: mc.duelo.placar || null, rodada: mc.duelo.rodada || 1 } : null,
    pinata: mc.pinata ? { palavra: mc.pinata.palavra, ganhou: mc.pinata.ganhou } : null,
    desfib: mc.desfib ? { id: mc.desfib.id || null, oferta: !!mc.desfib.oferta } : null,
    intervalo: mc.intervalo ? { fimEm: P(mc.intervalo.fimEm), travada: mcLojaTravada() } : null,
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
    olhoLetra: mc.olhos && mc.olhos[id] && mc.janela && mc.janela.serial === mc.olhos[id].serial ? mc.olhos[id].letra : null,
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
  if (mcPodePalpitar(id)) add("mcPalpitar", [id], mc.fase === "desfibSolo" ? "🧟 Responder (tentativa solo)" : "✋ Palpitar agora!", "ok");
  if (mc.fase === "julgando" && mcJuiz() === id && mc.janela && mc.janela.buzz) {
    add("mcVeredito", [true], `✅ ${nome(mc.janela.buzz)} acertou`, "ok", "Você julga");
    add("mcVeredito", [false], `❌ ${nome(mc.janela.buzz)} errou`, "nao", "Você julga");
  }
  if (mc.fase === "desfibOferta" && mc.desfib && mc.desfib.oferta.includes(id)) add("mcDesfib", [id], `${MC_LOJA.desfib.ic} Usar a ${MC_LOJA.desfib.nome}!`, "ok", "A carta vai hibernar");
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
    MC_DUELOS.forEach((t) => mcPodeEscolherTipo(id, t) && add("mcDueloTipo", [id, t], MC_DUELO_NOME[t], "", `⚔️ Te desafiaram! Escolha o duelo (${MC_DUELO_TIPO_MS / 1000} s)`));
    if (du.tipo === "ppt") ["pedra", "papel", "tesoura"].forEach((v) => mcPodeEscolherDuelo(id, v) && add("mcDuelo", [id, v], { pedra: "✊ Pedra", papel: "✋ Papel", tesoura: "✌️ Tesoura" }[v], "", "⚔️ Sua jogada (ninguém vê até os dois escolherem)"));
    if (du.tipo === "parimpar") [0, 1, 2, 3, 4, 5].forEach((v) => mcPodeEscolherDuelo(id, v) && add("mcDuelo", [id, v], String(v), "", `⚔️ Você é ${du.lados[id]}: escolha um número`));
    if (mcPodeRevanche(id)) {
      add("mcRevanche", [id, true], "🔁 Revanche! (dobro ou nada)", "ok", "Te roubaram");
      add("mcRevanche", [id, false], "Deixa quieto", "", "Te roubaram");
    }
  }
  if (mc.fase === "janela" && mc.janela) {
    ["corte", "folego", "congelar", "olho"].forEach((k) => mcPodeUsar(k, id) && add("mcUsar", [k, id], `${MC_LOJA[k].ic} Usar ${MC_LOJA[k].nome}`, "", "🎒 Seus itens"));
    if (mcItem(id, "mordaca")) players.forEach((p) => mcPodeUsar("mordaca", id, p.id) && add("mcUsar", ["mordaca", id, p.id], `🤐 Amordaçar ${nome(p.id)}`, "", "🎒 Mordaça"));
  }
  if (mc.maoLeve && mc.maoLeve.id === id) players.forEach((p) => mcPodeMaoLeve(id, p.id) && add("mcMaoLeve", [id, p.id], `🧤 Furtar de ${nome(p.id)}`, "", "🧤 Mão Leve (só você vê isso)"));
  if (mc.fase === "intervalo" && mc.vitrine) Object.keys(mc.vitrine.estoque).forEach((k) => mcPodeComprar(k, id) && add("mcComprar", [k, id], `${MC_LOJA[k].ic} ${MC_LOJA[k].nome} · ${mcPreco(k)} PC (${mc.vitrine.estoque[k]} no estoque)`, "", `🛒 Lojinha do C.A.O.S. · você tem ${mc.pc[id] || 0} PC`));
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
  const relogios = `<div class="mc-relogios"><span>⏱️ Partida ${cont(M.geral, true)}</span><span>🔄 Rodada ${M.rodada} · ${cont(M.rodadaT, true)}</span>${M.turbo ? '<span class="mc-ev">⏩ TURBO</span>' : ""}${M.janela && M.janela.imposto ? '<span class="mc-ev">💸 IMPOSTO</span>' : ""}</div>`;
  const placar = (r.jogadores || [])
    .slice()
    .sort((a, b) => (b.pontos || 0) - (a.pontos || 0))
    .map((j) => {
      const c = M.cartas[j.id];
      const estado = !c ? "" : c.estado === "capturada" ? "✅" : c.estado === "morta" ? "💀" : c.aberta > 0 && j.id !== M.mestre ? `💤 dormindo · ${c.aberta}/10` : `${c.aberta}/10`;
      return `<li class="${j.id === M.mestre ? "mc-mestre" : ""}"><span>${nome(j.id)}${j.id === eu ? " <small>(você)</small>" : ""}${M.batata && M.batata.com === j.id ? " 🥔" : ""}</span><span class="mc-pl-dir"><small>${estado}</small> <b>🃏 ${j.pontos || 0}</b> <small>· ${M.pc[j.id] || 0} PC</small></span></li>`;
    })
    .join("");
  let centro = "";
  const C = M.carta;
  if (M.fase === "intervalo") {
    const saldo = priv ? priv.pc : 0;
    const V = M.vitrine || { estoque: {}, precos: {} };
    const vitrine = Object.keys(V.estoque)
      .filter((k) => MC_LOJA[k])
      .map((k) => {
        const n = V.estoque[k] || 0,
          pr = V.precos[k] || MC_LOJA[k].preco;
        return `<li class="${n > 0 && priv && saldo >= pr ? "" : "mc-caro"}">${MC_LOJA[k].ic} <b>${MC_LOJA[k].nome}</b> · ${pr} PC <small>${n > 0 ? `(${n} no estoque)` : "(esgotado)"}</small><small>${escapeHtml(MC_LOJA[k].desc)}</small></li>`;
      })
      .join("");
    centro = `<div class="mc-bloco"><h3>🛒 Lojinha do C.A.O.S.</h3><p>Relógios congelados. Uma lojinha só pra mesa: quem comprar primeiro leva. Compre nos botões abaixo.</p>${M.intervalo && M.intervalo.travada ? `<p class="loja-trava">⏳ Dá uma olhada na vitrine: os botões liberam em instantes.</p>` : ""}<ul class="mc-vitrine">${vitrine}</ul>${M.pinata ? (M.pinata.ganhou ? `<p>🪅 ${nome(M.pinata.ganhou)} arrebentou a Piñata!</p>` : `<div class="mc-pinata">🪅 <b>PIÑATA!</b> Digite primeiro: <b class="mc-palavra">${escapeHtml(M.pinata.palavra)}</b><form class="mc-pinata-form"><input type="text" class="mc-pinata-txt" maxlength="20" autocomplete="off" aria-label="Palavra da Piñata"><button type="submit">Mandar</button></form></div>`) : ""}</div>`;
  } else if (M.fase === "desafio" && M.desafio) {
    const d = M.desafio;
    centro = `<div class="mc-bloco mc-batata"><h3>🥔 Carta bônus de ${nome(d.com)} · ${escapeHtml(TELAO_CAT[d.cat] || d.cat)}</h3><ol class="mc-dicas">${d.dicas.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ol><p>${d.buzz ? `🗣️ ${nome(d.com)} está respondendo… ${nome(d.juiz)} julga.` : `Próxima dica em ${d.proxEm ? `<b class="mc-cont" data-fim="${d.proxEm}">…</b> s` : "…"} (${d.dicas.length}/${d.total})`}</p></div>`;
  } else if (M.fase === "duelo" && M.duelo) {
    const du = M.duelo;
    const lado = (id) => (du.lados ? ` (${escapeHtml(du.lados[id])})` : "");
    centro = du.fase === "tipo" ? `<div class="mc-bloco mc-duelo"><h3>⚔️ DUELO</h3><p>${nome(du.ladrao)} × ${nome(du.vitima)}</p><p>${nome(du.vitima)} escolhe o duelo · <b class="mc-cont" data-fim="${du.ate}">…</b> s</p></div>` : `<div class="mc-bloco mc-duelo"><h3>⚔️ ${du.revanche ? "REVANCHE" : "DUELO"}: ${escapeHtml(MC_DUELO_NOME[du.tipo] || du.tipo)}</h3><p>${nome(du.ladrao)}${lado(du.ladrao)} × ${nome(du.vitima)}${lado(du.vitima)}</p><p class="mc-duelo-placar">Melhor de 3 · rodada ${du.rodada || 1} · <b>${(du.placar && du.placar[du.ladrao]) || 0} × ${(du.placar && du.placar[du.vitima]) || 0}</b></p>${du.resultado ? `<p><b>${escapeHtml(du.resultado.det)}</b></p>` : ""}<p>${du.fase === "revanche" ? `${nome(du.vitima)} decide se pede revanche · <b class="mc-cont" data-fim="${du.ate}">…</b> s` : du.tipo === "ppt" || du.tipo === "parimpar" ? `Escolheram: ${du.escolheu.length}/2 · <b class="mc-cont" data-fim="${du.ate}">…</b> s` : `Rolando… <b class="mc-cont" data-fim="${du.ate}">…</b>`}</p></div>`;
  } else if (C) {
    // 1.7.10.7.1 (relato do JF: "não sabia quem era o Mestre, a categoria, quanto tempo restava, e o Mestre não via a
    // própria carta direito"): painel da carta com Mestre, categoria grande, dica X de 10 em bolinhas, o tempo da
    // dica em número e barra, o que fazer agora; e, pro Mestre, a resposta e o que ele faz
    const j = M.janela;
    const souMestre = eu && eu === M.mestre;
    const catTxt = escapeHtml(TELAO_CAT[C.cat] || C.cat);
    const dicaN = M.fase === "abrindo" ? C.aberta + 1 : C.aberta;
    const pips = Array.from({ length: C.total }, (_, i) => `<i class="${i < C.aberta ? "on" : ""}${i === C.aberta - 1 && M.fase !== "abrindo" ? " agora" : ""}"></i>`).join("");
    let tempo = "",
      estado = "";
    if (M.fase === "abrindo") {
      tempo = M.abrirEm ? `<div class="mc-tempo"><small>A dica ${dicaN} abre em</small><b class="mc-cont" data-fim="${M.abrirEm}">…</b><span>s</span></div>` : "";
      estado = souMestre ? "🎙️ Prepare-se: você vai ler a próxima dica em voz alta." : `🎙️ ${nome(M.mestre)} vai ler a dica ${dicaN}.`;
    } else if (M.fase === "julgando" && j && j.buzz) {
      tempo = `<div class="mc-tempo mc-tempo-pausa"><small>Tempo parado</small><b>⏸️</b></div>`;
      estado = `<span class="mc-respondendo">🗣️ ${nome(j.buzz)} está respondendo!</span><small>${souMestre ? "Você julga: acertou ou errou?" : `${nome(M.mestre)} julga.`}</small>`;
    } else if (M.fase === "janela" && j) {
      tempo = `<div class="mc-tempo"><small>Tempo pra palpitar</small><b class="mc-cont mc-janela" data-fim="${fimDe(j.relogio)}">…</b><span>s</span></div><div class="mc-barra" data-fim="${fimDe(j.relogio)}" data-dur="${j.dur || 1}"><i></i></div>`;
      estado = souMestre
        ? "🎙️ Leia a dica em voz alta. Quem souber toca em ✋ Palpitar."
        : `✋ Sabe a resposta? Toque em <b>Palpitar</b> e fale em voz alta.${j.congela && Date.now() < j.congela.ate ? ` · 🥶 Só ${nome(j.congela.por)} agora` : ""}${j.mordaca ? ` · 🤐 ${nome(j.mordaca)} amordaçado` : ""}`;
    } else if (M.fase === "desfibOferta") estado = `${MC_LOJA.desfib.ic} A carta vai hibernar… alguém tem ${MC_LOJA.desfib.nome}?`;
    else if (M.fase === "desfibSolo" && M.desfib) estado = `${MC_LOJA.desfib.ic} ${nome(M.desfib.id)} está numa tentativa solo com a ${MC_LOJA.desfib.nome}!`;
    const mestreBox = souMestre && priv && priv.carta
      ? `<div class="mc-sou-mestre">🎙️ <b>Você é o Mestre desta carta</b><div class="mc-resp">Resposta: <b>${escapeHtml(priv.carta.resp)}</b> <small>(só você vê)</small></div></div>`
      : "";
    centro = `<div class="mc-bloco mc-carta-painel">
      <div class="mc-quem"><span><small>🎙️ Mestre</small><b>${nome(M.mestre)}</b></span><span><small>Categoria</small><b class="tc-selo mc-cat-grande">${catTxt}</b></span></div>
      ${mestreBox}
      <div class="mc-dica-n"><b>Dica ${dicaN} de ${C.total}</b><span class="mc-pips" aria-hidden="true">${pips}</span></div>
      ${tempo}
      <div class="mc-estado">${estado}</div>
      ${C.dicas.length ? `<div class="mc-dicas-tit">Dicas já abertas (a mais nova em cima)</div><ol class="mc-dicas">${C.dicas
        .map((t, i) => ({ t, i }))
        .reverse()
        .map((x) => `<li value="${x.i + 1}"${x.i === C.aberta - 1 ? ' class="mc-agora"' : ""}>${escapeHtml(x.t)}</li>`)
        .join("")}</ol>` : `<p class="mc-sem-dica">Nenhuma dica aberta ainda.</p>`}
    </div>`;
  }
  const U = M.ultimo;
  const ult = !U
    ? ""
    : U.tipo === "dormiu"
      ? `<div class="mc-ultimo mc-dormiu">💤 Ninguém acertou a carta de ${nome(U.mestre)}. Ela está <b>dormindo</b> e volta na próxima vez de ${nome(U.mestre)}, com a dica ${Math.min((U.dicas || 0) + 1, U.total || 10)}.</div>`
      : `<div class="mc-ultimo">${U.tipo === "capturada" ? `✅ ${nome(U.quem)} capturou` : "💀 Ninguém matou"} a carta de ${nome(U.mestre)}: <b>${escapeHtml(U.resp)}</b></div>`;
  // privado
  let meu = "";
  if (priv) {
    // 1.7.10.9.3: cada item guardado diz quando e como funciona (antes era só o ícone)
    const quando = {
      corte: "use na janela da dica",
      folego: "use logo depois de errar",
      mordaca: "use na janela da dica e escolha quem cala",
      desfib: "aparece sozinho quando uma carta for dormir",
      congelar: "use na janela da dica",
      espelho: "guardado: protege você sozinho",
      kevlar: "guardado: protege você sozinho",
      olho: "use na janela da dica",
    };
    const itensMeus = Object.keys(priv.inv || {}).filter((k) => priv.inv[k] > 0 && MC_LOJA[k]);
    const inv = itensMeus.map((k) => `${MC_LOJA[k].ic}${priv.inv[k] > 1 ? "×" + priv.inv[k] : ""}`).join(" ");
    const invLista = itensMeus.length ? `<ul class="mc-inv">${itensMeus.map((k) => `<li>${MC_LOJA[k].ic} <b>${MC_LOJA[k].nome}</b>${priv.inv[k] > 1 ? " ×" + priv.inv[k] : ""} <small>· ${quando[k] || "guardado"}</small></li>`).join("")}</ul>` : "";
    meu = `<div class="mc-meu">${priv.carta ? `🔒 Sua carta: <b>${escapeHtml(priv.carta.resp)}</b> <small>(${escapeHtml(TELAO_CAT[priv.carta.cat] || priv.carta.cat)} · ${priv.carta.estado === "ativa" ? priv.carta.aberta + "/10 dicas" : priv.carta.estado})</small>` : ""}<div>💠 ${priv.pc} PC${inv ? ` · 🎒 ${inv}` : ""}${priv.maoLeve ? " · 🧤 Mão Leve" : ""}</div>${invLista}${priv.juizResp ? `<div class="mc-juiz">⚖️ Você julga. A resposta é <b>${escapeHtml(priv.juizResp)}</b></div>` : ""}${priv.desfibDica ? `<div class="mc-desfib">🧟 Dica secreta: <b>${escapeHtml(priv.desfibDica)}</b></div>` : ""}${priv.olhoLetra ? `<div class="mc-desfib">👁️ A resposta começa com <b>${escapeHtml(priv.olhoLetra)}</b></div>` : ""}</div>`;
  }
  const grupos = {};
  (opcoes || []).forEach((o, i) => {
    const g = o.g || "";
    (grupos[g] = grupos[g] || []).push(`<button type="button" class="rede-btn${o.c === "ok" ? " rede-ok" : o.c === "nao" ? " rede-nao" : ""}" data-op="${i}">${escapeHtml(o.t)}</button>`);
  });
  const botoes = Object.keys(grupos)
    .map((g) => `<div class="mc-grupo">${g ? `<div class="mc-grupo-tit">${escapeHtml(g)}</div>` : ""}<div class="rede-acoes">${grupos[g].join("")}</div></div>`)
    .join("");
  // 1.7.10.7 (combinado com o JF): uma linha fixa no topo diz o que está acontecendo agora; nada de feed rolando,
  // só a última novidade; e o intervalo é uma tela só dele (lojinha e piñata)
  let agoraTxt = "";
  if (M.fase === "intervalo") agoraTxt = `☕ Intervalo · lojinha aberta · ${cont(M.intervalo, false)} s`;
  else if (M.fase === "duelo" && M.duelo) agoraTxt = `⚔️ Duelo: ${nome(M.duelo.ladrao)} × ${nome(M.duelo.vitima)}`;
  else if (M.fase === "desafio" && M.desafio) agoraTxt = `🥔 Carta bônus de ${nome(M.desafio.com)}`;
  else if (M.fase === "fim") agoraTxt = "🏁 Fim do tempo";
  else if (C) agoraTxt = `${eu && eu === M.mestre ? "🎙️ Você é o Mestre" : `🎙️ Mestre: ${nome(M.mestre)}`} · ${escapeHtml(TELAO_CAT[C.cat] || C.cat)} · dica ${M.fase === "abrindo" ? C.aberta + 1 : C.aberta} de ${C.total}`;
  const agoraLinha = agoraTxt ? `<div class="mc-agora-linha" role="status">${agoraTxt}</div>` : "";
  const novidade = (M.feed || []).length && M.fase !== "intervalo" ? `<div class="mc-novidade">${escapeHtml(M.feed[M.feed.length - 1])}</div>` : "";
  const bot = botoes ? `<div class="mc-botoes">${botoes}</div>` : "";
  if (M.fase === "intervalo") return `<div class="mc-tela mc-tela-intervalo">${agoraLinha}${centro}${bot}${meu}<ol class="mc-placar">${placar}</ol></div>`;
  return `<div class="mc-tela">${agoraLinha}${relogios}${centro}${bot}${novidade}${ult}${meu}<ol class="mc-placar">${placar}</ol></div>`;
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
      r.resta = Math.max(0, r.fimEm - mcAgora());
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
  mc.ultTick = null; // debug 23/10: o tique salvo é velho; contar congelamento a partir dele empurrava os prazos
  mc.olhos = mc.olhos || {};
  if (mc.fase === "intervalo" && !mc.vitrine) mc.vitrine = lojaVitrineSortear(MC_LOJA, MC_VITRINE);
  // prazos absolutos (abrir, intervalo, desafio, duelo) recomeçam a contar a partir de agora (no tempo de jogo)
  const agora = mcAgora();
  mc.abrirEm = agora + 1500;
  if (mc.intervalo) {
    mc.intervalo.fimEm = agora + MC_INTERVALO_SEG * 1e3;
    mc.intervalo.ini = agora - LOJA_TRAVA_MS; // retomou: a vitrine já pode
  }
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
    `🛒 <b>Lojinha (no intervalo, uma só pra mesa):</b> a cada intervalo aparecem ${MC_VITRINE} itens sorteados, com preço e estoque variando. Catálogo: ${Object.values(MC_LOJA)
      .map((it) => `${it.ic} ${it.nome} (~${it.preco})`)
      .join(", ")}.`,
    `🌀 <b>O C.A.O.S. apronta</b> (um evento por vez, sempre entre uma vez e outra, com aviso grande na tela): ⏩ Turbo (janela de ${MC_TURBO_SEG} s), 💸 Imposto da Preguiça (quem não tenta paga PC), 🥔 Batata Quente (passe ou segure; quem ficar com ela encara a carta bônus), 🧤 Mão Leve (furto secreto), 🪅 Piñata (digite primeiro), 🎁 Presente (quem ficou ${MC_PRESENTE_DIF}+ cartas atrás do líder ganha 1 item, uma vez por partida) e ⚔️ roubos com duelo em melhor de 3 (dado, moeda, jokenpô, par ou ímpar) e revanche dobro ou nada.`,
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
  // 1.7.10.6 (pedido do JF): 16+ de verdade: todo mundo marcado "16 ou mais" no cadastro
  const novos = players.filter((p) => !jogador16(p));
  if (novos.length) return avisar(`O Modo C.A.O.S. é só pra 16+. Fica de fora: ${novos.map((p) => p.name).join(", ")}${novos.some((p) => !idadeNorm(p.idade)) ? " (sem idade marcada)" : ""}.`);
  return true;
}
