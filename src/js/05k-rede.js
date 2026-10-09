/* ----------------------------------------------------------------------
 * 5k. REDE: SALA, PROTOCOLO, PAPÉIS E RELÓGIO (1.7.9.7 · Rooms and Network Update, Parte 3)
 * A base do online. Um aparelho HOSPEDA a sala (roda a partida, como sempre); os outros ENTRAM
 * como convidados: escolhem quem são, recebem o retrato público e mandam comandos.
 *
 *  · HOST MANDA EM TUDO: o convidado não roda o motor, não carrega nem grava partida e não
 *    desembaralha as cartas (redeSemCatalogo). Ele só mostra o retrato público que chega.
 *  · ENVELOPE: toda mensagem leva o protocolo (REDE_PROTOCOLO), a sala, a sessão de quem mandou
 *    e um número em sequência. Mensagem de outra sala, de outro protocolo, repetida, velha,
 *    grande demais ou malformada é jogada fora (redeValidar), sem travar nada.
 *  · ATOR PELA SESSÃO: quem mandou o comando é a sessão que entrou na sala e ocupou um lugar
 *    (redeAssentos), nunca o que a mensagem diz. O host confere o papel (redePodeComandar):
 *    só o Mestre dá veredito, só quem está na vez (ou o Mestre) escolhe a dica, quem caiu na casa
 *    de bônus escolhe o duelo, qualquer um pausa, e o que é do relógio ou do ADM só o host faz.
 *    Depois disso vem a porta de sempre (dispatchAction): partida, revisão, comando repetido, regra.
 *  · RESPOSTA SÓ PRO MESTRE: o retrato da mesa nunca tem resposta. A resposta vai numa mensagem
 *    "segredo" endereçada à sessão do Mestre da vez, e o convidado apaga quando a carta acaba ou
 *    quando deixa de ser Mestre.
 *  · RECONEXÃO: o convidado guarda o id do jogador que escolheu e uma CHAVE secreta do aparelho
 *    (por sala). Se cair ou recarregar, ele pede o mesmo lugar com a chave e volta na hora, com o
 *    retrato atual. Sem a chave, ninguém toma um lugar que ainda está online.
 *  · RELÓGIO: o convidado mede a diferença pro relógio do host (ping/pong, fica a medida de menor
 *    atraso) e conta o tempo por ela. Quem decide que o tempo acabou é só o host.
 *  · TRANSPORTE TROCÁVEL: o protocolo não sabe por onde a mensagem vai. Hoje existe o transporte
 *    LOCAL (BroadcastChannel: abas do mesmo navegador, o ensaio). O transporte entre celulares
 *    (internet) entra quando o JF escolher o serviço (Roteiro, seção 10). No local, a mensagem
 *    "para" alguém chega em todas as abas e o convidado ignora o que não é dele; na internet ela
 *    vai só pra quem é.
 * ---------------------------------------------------------------------- */
const REDE_PROTOCOLO = 1;
const REDE_MAX_LETRAS = 64 * 1024;
const REDE_DO_CONVIDADO = ["oi", "cmd", "ping", "tchau"];
const REDE_DO_HOST = ["bemvindo", "escolha", "recusa", "retrato", "segredo", "resp", "pong"];
const REDE_ONLINE_MS = 15000; // sem notícia há mais que isso: o convidado conta como fora
const REDE_LETRAS_SALA = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sem I e O (não confundem com 1 e 0)
let redeOuvindo = false; // a escuta das ações (acoesAoMudar) é registrada uma vez só
let rede = null; // { papel: "host" | "convidado", sala, sessao, transporte, seq, ultimoSeq: {} , ... }

function redeAleatorio(n) {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  try {
    const v = new Uint8Array(n);
    crypto.getRandomValues(v);
    v.forEach((x) => (s += a[x % a.length]));
  } catch (e) {
    for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)];
  }
  return s;
}
function redeCodigoSala() {
  let s = "";
  for (let i = 0; i < 4; i++) s += REDE_LETRAS_SALA[Math.floor(Math.random() * REDE_LETRAS_SALA.length)];
  return s;
}
function redeSalaValida(s) {
  return typeof s === "string" && /^[A-HJ-NP-Z]{4}$/.test(s);
}
function redeSessaoValida(s) {
  return typeof s === "string" && /^s_[a-z0-9]{6,16}$/.test(s);
}
// Sala no endereço (#sala=ABCD): este aparelho entra como convidado.
function redeSalaDoEndereco() {
  try {
    const m = /(?:^|[#&])sala=([A-Za-z]{4})(?:&|$)/.exec(String(location.hash || ""));
    const s = m ? m[1].toUpperCase() : null;
    return redeSalaValida(s) ? s : null;
  } catch (e) {
    return null;
  }
}
// Trava de privacidade 2: o convidado não abre o catálogo de cartas (a versão publicada só
// desembaralha as cartas quando isto é falso; ver embaralharCartas no build.js).
function redeSemCatalogo() {
  return !!redeSalaDoEndereco();
}
// Agora no relógio do host (no host, o próprio relógio).
function redeAgora() {
  return Date.now() + (rede && rede.papel === "convidado" ? rede.relogio.dif : 0);
}

/* --- Transporte --- */
// Local: BroadcastChannel (abas do mesmo navegador). As mensagens viajam como texto (JSON), igual
// iriam pela internet, pra validação valer do mesmo jeito.
function redeTransporteLocal(sala) {
  if (typeof BroadcastChannel !== "function") return null;
  let bc;
  try {
    bc = new BroadcastChannel("perfiljf-sala-" + sala);
  } catch (e) {
    return null;
  }
  const t = {
    tipo: "local",
    enviar(texto) {
      try {
        bc.postMessage(texto);
      } catch (e) {}
    },
    aoReceber(fn) {
      bc.onmessage = (ev) => fn(ev && ev.data);
    },
    fechar() {
      try {
        bc.close();
      } catch (e) {}
    },
  };
  return t;
}

/* --- Envelope --- */
function redeEnviar(tipo, dados, para) {
  if (!rede || !rede.transporte) return false;
  const m = { p: REDE_PROTOCOLO, t: tipo, sala: rede.sala, de: rede.sessao, seq: ++rede.seq, ...(dados || {}) };
  if (para) m.para = para;
  let texto;
  try {
    texto = JSON.stringify(m);
  } catch (e) {
    return false;
  }
  if (texto.length > REDE_MAX_LETRAS) return false;
  rede.transporte.enviar(texto);
  rede.enviadas = (rede.enviadas || 0) + 1;
  return true;
}
const redeEhPrimitivo = (v) => v === null || ["string", "number", "boolean"].includes(typeof v);
// Confere uma mensagem que chegou. Devolve a mensagem pronta ou null (e conta o motivo).
function redeValidar(bruto) {
  const recusar = (motivo) => {
    if (rede) rede.recusadas[motivo] = (rede.recusadas[motivo] || 0) + 1;
    return null;
  };
  if (!rede) return null;
  if (typeof bruto !== "string") return recusar("formato");
  if (bruto.length > REDE_MAX_LETRAS) return recusar("grande_demais");
  let m;
  try {
    m = JSON.parse(bruto);
  } catch (e) {
    return recusar("formato");
  }
  if (!m || typeof m !== "object" || Array.isArray(m)) return recusar("formato");
  if (m.p !== REDE_PROTOCOLO) return recusar("protocolo");
  if (m.sala !== rede.sala) return recusar("outra_sala");
  if (!redeSessaoValida(m.de)) return recusar("sessao");
  if (m.de === rede.sessao) return null; // eco da própria mensagem (transporte local)
  if (!Number.isInteger(m.seq) || m.seq < 1) return recusar("seq");
  const aceitos = rede.papel === "host" ? REDE_DO_CONVIDADO : REDE_DO_HOST;
  if (!aceitos.includes(m.t)) return recusar("tipo");
  if (m.para !== undefined && !redeSessaoValida(m.para)) return recusar("para");
  if (m.para !== undefined && m.para !== rede.sessao) return null; // não é pra mim
  // ordem: de cada sessão, só mensagem mais nova que a última (repetida ou atrasada sai)
  const ult = rede.ultimoSeq[m.de] || 0;
  if (m.seq <= ult) return recusar("repetida");
  // conteúdo de cada tipo
  const ok = {
    oi: () => (m.jogadorId === undefined || m.jogadorId === null || jogadorIdValido(m.jogadorId)) && typeof m.chave === "string" && /^[a-z0-9]{12,32}$/.test(m.chave),
    cmd: () =>
      typeof m.commandId === "string" && /^[A-Za-z0-9_:-]{4,64}$/.test(m.commandId) && typeof m.acao === "string" && !!ACOES[m.acao] &&
      Array.isArray(m.dados) && m.dados.length <= 4 && m.dados.every(redeEhPrimitivo) &&
      (m.rev === undefined || Number.isInteger(m.rev)) && (m.matchId === undefined || m.matchId === null || typeof m.matchId === "string"),
    ping: () => typeof m.t0 === "number" && isFinite(m.t0),
    tchau: () => true,
    bemvindo: () => jogadorIdValido(m.jogadorId),
    escolha: () => Array.isArray(m.lugares) && m.lugares.length <= 12 && m.lugares.every((l) => l && jogadorIdValido(l.id) && typeof l.nome === "string"),
    recusa: () => typeof m.motivo === "string" && m.motivo.length <= 40,
    retrato: () => m.r && typeof m.r === "object" && m.r.protocolo === RETRATO_PROTOCOLO && m.r.papel === "mesa" && Number.isInteger(m.r.revisao) && Array.isArray(m.r.jogadores),
    segredo: () => Number.isInteger(m.revisao) && (m.resposta === null || (typeof m.resposta === "string" && m.resposta.length <= 120)),
    resp: () => typeof m.commandId === "string" && typeof m.ok === "boolean",
    pong: () => typeof m.t0 === "number" && typeof m.th === "number" && isFinite(m.th),
  }[m.t];
  let certo = false;
  try {
    certo = !!ok();
  } catch (e) {
    certo = false;
  }
  if (!certo) return recusar("conteudo");
  rede.ultimoSeq[m.de] = m.seq;
  return m;
}

/* =====================  HOST  ===================== */
// Lugar de cada jogador: { [jogadorId]: { sessao, visto } }
function redeAbrirSala(transporteFabrica) {
  if (rede) redeFechar();
  const sala = redeCodigoSala();
  const fab = typeof transporteFabrica === "function" ? transporteFabrica : redeTransporteLocal;
  const transporte = fab(sala);
  if (!transporte) return null;
  rede = {
    papel: "host",
    sala,
    sessao: "s_" + redeAleatorio(10),
    transporte,
    seq: 0,
    ultimoSeq: {},
    recusadas: {},
    assentos: {},
    segredoEnviado: null,
    batida: null,
  };
  transporte.aoReceber((bruto) => {
    const m = redeValidar(bruto);
    if (m) redeHostReceber(m);
  });
  if (!redeOuvindo) {
    acoesAoMudar(() => rede && rede.papel === "host" && redeHostPublicar());
    redeOuvindo = true;
  }
  // batida: retrato de novo a cada 4 s (quem perdeu uma mensagem se acerta) e confere quem caiu
  rede.batida = setInterval(() => {
    if (!rede || rede.papel !== "host") return;
    redeHostPublicar(true);
  }, 4000);
  try {
    caosLog("rede", `sala ${sala} aberta (${transporte.tipo})`);
  } catch (e) {}
  return sala;
}
function redeFechar() {
  if (!rede) return;
  try {
    if (rede.papel === "convidado") redeEnviar("tchau", {});
  } catch (e) {}
  clearInterval(rede.batida);
  clearInterval(rede.pingTimer);
  try {
    rede.transporte.fechar();
  } catch (e) {}
  // a escuta de acoesAoMudar fica registrada; ela confere "rede" antes de agir
  rede = null;
}
function redeAssentoDaSessao(sessao) {
  if (!rede || !rede.assentos) return null;
  const id = Object.keys(rede.assentos).find((k) => rede.assentos[k].sessao === sessao);
  return id || null;
}
function redeOnline(a) {
  return !!a && Date.now() - a.visto < REDE_ONLINE_MS;
}
function redeLugaresLivres() {
  return players
    .filter((p) => !redeOnline(rede.assentos[p.id]))
    .map((p) => ({ id: p.id, nome: String(p.name).slice(0, 24), avatar: p.avatar || null }));
}
function redeHostReceber(m) {
  const a = redeAssentoDaSessao(m.de);
  if (a) rede.assentos[a].visto = Date.now();
  if (m.t === "oi") return redeHostOi(m);
  if (m.t === "ping") return redeEnviar("pong", { t0: m.t0, th: Date.now() }, m.de);
  if (m.t === "tchau") {
    if (a) rede.assentos[a].visto = 0;
    return;
  }
  if (m.t === "cmd") return redeHostComando(m, a);
}
function redeHostOi(m) {
  if (!players.length) return redeEnviar("recusa", { motivo: "sem_partida" }, m.de);
  const pedido = m.jogadorId && jogadorIdxPorId(m.jogadorId) >= 0 ? m.jogadorId : null;
  if (!pedido) return redeEnviar("escolha", { lugares: redeLugaresLivres() }, m.de);
  const atual = rede.assentos[pedido];
  // o mesmo aparelho voltando (mesma chave) recupera o lugar na hora; outro só depois que ele cair
  if (atual && atual.sessao !== m.de && redeOnline(atual) && atual.chave !== m.chave) return redeEnviar("recusa", { motivo: "lugar_ocupado" }, m.de);
  // a mesma sessão não segura dois lugares
  const antigo = redeAssentoDaSessao(m.de);
  if (antigo && antigo !== pedido) delete rede.assentos[antigo];
  const volta = !!atual;
  rede.assentos[pedido] = { sessao: m.de, visto: Date.now(), chave: m.chave };
  redeEnviar("bemvindo", { jogadorId: pedido, matchId: matchId || null, volta }, m.de);
  try {
    caosLog("rede", `${(jogadorPorId(pedido) || {}).name || "?"} ${volta ? "voltou pra" : "entrou na"} sala`);
  } catch (e) {}
  rede.segredoEnviado = null; // o Mestre pode ter acabado de chegar: manda a resposta de novo
  redeHostPublicar(true);
}
// Quem pode mandar o quê (o host confere antes da porta de sempre).
const REDE_SO_MESTRE = [
  "sacarCarta", "virarCarta", "roletaCategoria", "acertou", "errou", "palpiteAcertou", "palpiteErrou", "especialSeguir",
  "especialPerdeVez", "moverJogador", "moverEquipe", "descartarCarta", "desistirCarta", "desfazer", "expressPassar",
  "expressPular", "expressInverter", "expressMirar", "expressAlvo",
];
const REDE_QUALQUER_UM = ["pausar", "continuar"];
const REDE_SO_HOST = ["tempoAcabou", "expressCartaPerdida", "admRemover", "encerrar"];
function redePodeComandar(acao, jid) {
  if (!jid || jogadorIdxPorId(jid) < 0) return false;
  if (REDE_SO_HOST.includes(acao)) return false;
  if (REDE_QUALQUER_UM.includes(acao)) return true;
  const ehMestre = jogadorIdDe(mestreIndex) === jid;
  if (REDE_SO_MESTRE.includes(acao)) return ehMestre;
  if (acao === "escolherDica") return ehMestre || jogadorIdDe(responderIndex) === jid;
  if (acao === "bonusAdversario") {
    const e = pendingBonusQueue && pendingBonusQueue[0];
    if (!e) return false;
    const p = players[jogadorIdxPorId(jid)];
    return CURRENT_FORMAT === "equipe" ? !!p && p.team === e.landerIdx : players[e.landerIdx] && players[e.landerIdx].id === jid;
  }
  return false;
}
function redeHostComando(m, jid) {
  const responder = (ok, motivo) => redeEnviar("resp", { commandId: m.commandId, ok, motivo: motivo || null, revisao: partidaRevisao }, m.de);
  if (!jid) return responder(false, "sem_lugar");
  if (!redePodeComandar(m.acao, jid)) return responder(false, "sem_permissao");
  const r = dispatchAction({
    type: m.acao,
    data: m.dados,
    commandId: m.commandId,
    matchId: m.matchId === undefined ? undefined : m.matchId,
    expectedRevision: m.rev,
    actorId: jid,
  });
  responder(!!r.ok, r.ok ? (r.duplicado ? "duplicado" : null) : r.motivo);
  if (!r.ok || r.duplicado) redeHostPublicar(true); // quem errou a revisão recebe o retrato atual
}
// Retrato público pra todos e a resposta só pro Mestre (se ele está na sala).
function redeHostPublicar(forcar) {
  if (!rede || rede.papel !== "host") return;
  if (!starterChosen && !forcar) return;
  redeEnviar("retrato", { r: retratoPartida("mesa") });
  const mid = jogadorIdDe(mestreIndex);
  const a = mid && rede.assentos[mid];
  const resposta = currentCard && cardState !== "none" && !gameEnded ? currentCard.answer : null;
  const chave = [mid, resposta, matchId].join("|");
  if (a && redeOnline(a) && (forcar || chave !== rede.segredoEnviado)) {
    redeEnviar("segredo", { revisao: partidaRevisao, resposta }, a.sessao);
    rede.segredoEnviado = chave;
  }
}

/* =====================  CONVIDADO  ===================== */
const REDE_EU_KEY = "perfil5_rede_eu_"; // + sala: o jogador que este aparelho escolheu
function redeEntrarSala(sala, transporteFabrica) {
  if (!redeSalaValida(sala)) return false;
  if (rede) redeFechar();
  const fab = typeof transporteFabrica === "function" ? transporteFabrica : redeTransporteLocal;
  const transporte = fab(sala);
  if (!transporte) return false;
  // quem eu sou nesta sala: { id, chave } (a aba primeiro; depois o aparelho)
  let eu = null;
  try {
    eu = JSON.parse(sessionStorage.getItem(REDE_EU_KEY + sala) || localStorage.getItem(REDE_EU_KEY + sala) || "null");
  } catch (e) {}
  if (!eu || typeof eu !== "object") eu = {};
  rede = {
    papel: "convidado",
    sala,
    sessao: "s_" + redeAleatorio(10),
    transporte,
    seq: 0,
    ultimoSeq: {},
    recusadas: {},
    eu: jogadorIdValido(eu.id) ? eu.id : null,
    chave: typeof eu.chave === "string" && /^[a-z0-9]{12,32}$/.test(eu.chave) ? eu.chave : redeAleatorio(16),
    estado: "entrando", // entrando | escolhendo | dentro | recusado
    retrato: null,
    segredo: null, // { revisao, resposta }
    lugares: [],
    motivo: null,
    pendentes: {}, // commandId → { msg, tentativas, quando }
    respostas: {}, // commandId → resultado
    relogio: { dif: 0, atraso: Infinity, amostras: 0 },
    aoMudar: null,
  };
  transporte.aoReceber((bruto) => {
    const m = redeValidar(bruto);
    if (m) redeConvidadoReceber(m);
  });
  redeEnviar("oi", { jogadorId: rede.eu, chave: rede.chave });
  // fechou a aba ou saiu da página: avisa o host (o lugar fica livre na hora)
  try {
    window.addEventListener("pagehide", () => rede && rede.papel === "convidado" && redeEnviar("tchau", {}));
  } catch (e) {}
  // relógio: 4 medidas rápidas e depois uma a cada 5 s; reenvia comando sem resposta
  let n = 0;
  rede.pingTimer = setInterval(() => {
    if (!rede || rede.papel !== "convidado") return;
    n++;
    if (n <= 4 || n % 10 === 0) redeEnviar("ping", { t0: Date.now() });
    if (rede.estado === "entrando" && n % 6 === 0) redeEnviar("oi", { jogadorId: rede.eu, chave: rede.chave });
    redeReenviar();
  }, 500);
  return true;
}
function redeConvidadoReceber(m) {
  const avisar = () => {
    if (typeof rede.aoMudar === "function")
      try {
        rede.aoMudar(m.t);
      } catch (e) {}
  };
  if (m.t === "pong") {
    const agora = Date.now(), atraso = agora - m.t0;
    if (atraso >= 0 && atraso <= rede.relogio.atraso + 30) {
      // a medida de menor atraso é a mais confiável
      rede.relogio.dif = Math.round(m.th + atraso / 2 - agora);
      rede.relogio.atraso = Math.min(atraso, rede.relogio.atraso);
    }
    rede.relogio.amostras++;
    return;
  }
  if (m.t === "escolha") {
    rede.estado = "escolhendo";
    rede.lugares = m.lugares;
    return avisar();
  }
  if (m.t === "recusa") {
    if (m.motivo === "lugar_ocupado" || m.motivo === "sem_partida") {
      rede.estado = "recusado";
      rede.motivo = m.motivo;
      if (m.motivo === "lugar_ocupado") rede.eu = null;
    }
    return avisar();
  }
  if (m.t === "bemvindo") {
    rede.eu = m.jogadorId;
    rede.estado = "dentro";
    try {
      const eu = JSON.stringify({ id: m.jogadorId, chave: rede.chave });
      sessionStorage.setItem(REDE_EU_KEY + rede.sala, eu);
      localStorage.setItem(REDE_EU_KEY + rede.sala, eu);
    } catch (e) {}
    return avisar();
  }
  if (m.t === "retrato") {
    const r = m.r, ant = rede.retrato;
    if (ant && ant.matchId === r.matchId && r.revisao < ant.revisao) return; // atrasado
    rede.retrato = r;
    // trava 3: a resposta sai da memória quando a carta acaba ou quando não sou mais o Mestre
    if (rede.segredo && (r.mestreId !== rede.eu || !r.carta || r.fim || r.matchId !== rede.segredo.matchId)) rede.segredo = null;
    return avisar();
  }
  if (m.t === "segredo") {
    const r = rede.retrato;
    rede.segredo = m.resposta ? { revisao: m.revisao, resposta: m.resposta, matchId: r ? r.matchId : null } : null;
    return avisar();
  }
  if (m.t === "resp") {
    delete rede.pendentes[m.commandId];
    rede.respostas[m.commandId] = { ok: m.ok, motivo: m.motivo, revisao: m.revisao };
    return avisar();
  }
}
// Escolher quem eu sou na sala.
function redeEscolherLugar(jid) {
  if (!rede || rede.papel !== "convidado" || !jogadorIdValido(jid)) return false;
  rede.eu = jid;
  rede.estado = "entrando";
  return redeEnviar("oi", { jogadorId: jid, chave: rede.chave });
}
// Mandar um comando pro host. O mesmo commandId vai de novo se a resposta não vier (o host aplica
// uma vez só).
function redeMandar(acao, ...dados) {
  if (!rede || rede.papel !== "convidado" || rede.estado !== "dentro" || !ACOES[acao]) return null;
  const commandId = "c_" + redeAleatorio(12);
  const r = rede.retrato;
  const msg = { commandId, acao, dados: dados.slice(0, 4).map((v) => (redeEhPrimitivo(v) ? v : null)), rev: r ? r.revisao : undefined, matchId: r ? r.matchId : undefined };
  rede.pendentes[commandId] = { msg, tentativas: 1, quando: Date.now() };
  redeEnviar("cmd", msg);
  return commandId;
}
function redeReenviar() {
  if (!rede || rede.papel !== "convidado") return;
  Object.keys(rede.pendentes).forEach((id) => {
    const p = rede.pendentes[id];
    if (Date.now() - p.quando < 2500) return;
    if (p.tentativas >= 3) {
      delete rede.pendentes[id];
      rede.respostas[id] = { ok: false, motivo: "sem_resposta" };
      return;
    }
    p.tentativas++;
    p.quando = Date.now();
    redeEnviar("cmd", p.msg);
  });
}
// O que este convidado pode tocar agora (a mesma regra que o host confere).
function redeMeuPapel() {
  const r = rede && rede.retrato;
  if (!r || !rede.eu) return { mestre: false, vez: false };
  return { mestre: r.mestreId === rede.eu, vez: r.vezId === rede.eu };
}

/* --- Tela do convidado: o retrato (como o telão) e os botões do meu papel --- */
function redeConvidadoIniciar(sala) {
  try {
    saveBloqueado = true; // trava 5: o convidado nunca grava a partida
  } catch (e) {}
  document.title = "🌐 Sala " + sala + " · Perfil JF";
  ["splashScreen", "welcomeScreen", "gameScreen"].forEach((id) => {
    const e = document.getElementById(id);
    if (e) e.style.display = "none";
  });
  let box = document.getElementById("telao");
  if (!box) {
    box = document.createElement("main");
    box.id = "telao";
    box.className = "telao rede-convidado";
    box.setAttribute("aria-live", "polite");
    document.body.appendChild(box);
  }
  if (!redeEntrarSala(sala)) {
    box.innerHTML = `<div class="telao-espera">Este navegador não consegue entrar na sala.</div>${REDE_SAIR}`;
    return;
  }
  rede.aoMudar = () => redeConvidadoDesenhar();
  redeConvidadoDesenhar();
  telaoRelogioTimer = setInterval(telaoRelogio, 500);
}
const REDE_SAIR = '<button type="button" class="telao-sair" onclick="redeSairDaSala()">✕ Sair da sala</button>';
function redeSairDaSala() {
  try {
    if (rede) {
      localStorage.removeItem(REDE_EU_KEY + rede.sala);
      sessionStorage.removeItem(REDE_EU_KEY + rede.sala);
    }
    redeFechar();
  } catch (e) {}
  try {
    window.history.replaceState(null, "", String(location.href).split("#")[0]);
  } catch (e) {}
  location.reload();
}
const REDE_MOTIVOS = {
  lugar_ocupado: "Esse jogador já está na sala em outro aparelho.",
  sem_partida: "O host ainda não cadastrou os jogadores. Espere e tente de novo.",
  sem_permissao: "Isso não é com você agora.",
  fora_de_hora: "Agora não dá.",
  revisao_obsoleta: "A partida andou enquanto você tocava. Tente de novo.",
  sem_resposta: "O host não respondeu. Confira a conexão.",
};
function redeConvidadoDesenhar() {
  const box = document.getElementById("telao");
  if (!box || !rede) return;
  const sala = `<div class="rede-sala">🌐 Sala <b>${rede.sala}</b></div>`;
  if (rede.estado === "escolhendo") {
    const l = rede.lugares
      .map((p) => `<button type="button" class="rede-lugar" data-id="${escapeHtml(p.id)}">${escapeHtml((p.avatar ? p.avatar + " " : "") + p.nome)}</button>`)
      .join("");
    box.innerHTML = `${sala}<div class="telao-espera">Quem é você?<div class="rede-lugares">${l || "<small>Nenhum lugar livre agora.</small>"}</div></div>${REDE_SAIR}`;
    box.querySelectorAll(".rede-lugar").forEach((b) => b.addEventListener("click", () => redeEscolherLugar(b.dataset.id)));
    return;
  }
  if (rede.estado === "recusado") {
    box.innerHTML = `${sala}<div class="telao-espera">${escapeHtml(REDE_MOTIVOS[rede.motivo] || "Não deu pra entrar.")}<br><button type="button" class="rede-lugar" id="redeDeNovo">Tentar de novo</button></div>${REDE_SAIR}`;
    box.querySelector("#redeDeNovo").addEventListener("click", () => {
      rede.estado = "entrando";
      redeEnviar("oi", { jogadorId: rede.eu, chave: rede.chave });
    });
    return;
  }
  if (rede.estado !== "dentro" || !rede.retrato) {
    box.innerHTML = `${sala}<div class="telao-espera">Entrando na sala…</div>${REDE_SAIR}`;
    return;
  }
  telaoUltimo = rede.retrato;
  telaoDesenhar(rede.retrato);
  // troca o "sair do telão" pelo "sair da sala" e põe a sala e os botões do meu papel
  const sair = box.querySelector(".telao-sair");
  if (sair) sair.outerHTML = REDE_SAIR;
  box.insertAdjacentHTML("afterbegin", sala);
  const barra = document.createElement("section");
  barra.className = "rede-barra";
  barra.innerHTML = redeBotoesHtml();
  const topo = box.querySelector(".telao-vez");
  if (topo) topo.after(barra);
  else box.appendChild(barra);
  barra.querySelectorAll("[data-acao]").forEach((b) =>
    b.addEventListener("click", () => {
      const dados = b.dataset.dado === undefined ? [] : [b.dataset.tipo === "num" ? Number(b.dataset.dado) : b.dataset.dado];
      redeMandar(b.dataset.acao, ...dados);
    }),
  );
}
function redeBotoesHtml() {
  const r = rede.retrato, eu = r.jogadores.find((j) => j.id === rede.eu);
  const papel = redeMeuPapel();
  const b = (acao, txt, dado, tipo) =>
    `<button type="button" class="rede-btn" data-acao="${acao}"${dado === undefined ? "" : ` data-dado="${escapeHtml(String(dado))}" data-tipo="${tipo || "txt"}"`}>${txt}</button>`;
  let h = `<div class="rede-eu">Você é <b>${escapeHtml(eu ? (eu.avatar ? eu.avatar + " " : "") + eu.nome : "?")}</b>${papel.mestre ? " · 🎙️ Mestre" : papel.vez ? " · 👉 sua vez" : ""}</div>`;
  if (r.fim) return h;
  if (r.relogio && r.relogio.pausado) return h + `<div class="rede-acoes">${b("continuar", "▶️ Continuar")}</div>`;
  const c = r.carta, acoes = [];
  if (papel.mestre && rede.segredo && rede.segredo.resposta)
    h += `<div class="rede-segredo">🔒 Só você vê: <b>${escapeHtml(rede.segredo.resposta)}</b></div>`;
  if (papel.mestre) {
    if (r.estadoCarta === "none") acoes.push(b("sacarCarta", "🃏 Puxar carta"));
    if (r.estadoCarta === "hidden") acoes.push(b("virarCarta", "👀 Ver carta"));
    if (r.estadoCarta === "revealed" && c && c.pendente !== null && c.pendente !== undefined) {
      const it = c.abertas.find((d) => d.pos === c.pendente);
      if (it && it.tipo === "special") acoes.push(b("especialSeguir", "⭐ Seguir"), b("especialPerdeVez", "⛔ Perde a vez"));
      else acoes.push(b("acertou", "✓ Acertou"), b("errou", "✗ Errou"), b("errou", "» Pulou", "pular"));
    }
  }
  if ((papel.vez || papel.mestre) && r.estadoCarta === "revealed" && c && (c.pendente === null || c.pendente === undefined)) {
    const abertas = new Set(c.abertas.map((d) => d.pos));
    const nums = [];
    for (let i = 0; i < c.totalDicas; i++) if (!abertas.has(i)) nums.push(b("escolherDica", String(i + 1), i, "num"));
    if (nums.length) h += `<div class="rede-rot">Escolha uma dica:</div><div class="rede-nums">${nums.join("")}</div>`;
  }
  acoes.push(b("pausar", "⏸️ Pausar"));
  const ult = Object.values(rede.respostas).slice(-1)[0];
  const aviso = ult && !ult.ok && REDE_MOTIVOS[ult.motivo] ? `<div class="rede-aviso">${escapeHtml(REDE_MOTIVOS[ult.motivo])}</div>` : "";
  return h + `<div class="rede-acoes">${acoes.join("")}</div>` + aviso;
}

/* --- Painel do host (ADM) --- */
function redeLinkDaSala() {
  return String(location.href).split("#")[0] + "#sala=" + (rede ? rede.sala : "");
}
function redePainelHost() {
  document.getElementById("redePainel")?.remove();
  const ov = document.createElement("div");
  ov.id = "redePainel";
  ov.className = "jf-modal-bg";
  const pintar = () => {
    if (!rede || rede.papel !== "host") {
      ov.innerHTML = `<div class="jf-modal" role="dialog" aria-modal="true"><h3>🌐 Sala (ensaio)</h3><p>Abre uma sala neste navegador. Cada jogador entra pelo link numa outra aba (no online de verdade, cada um no seu celular).</p><button type="button" class="btn-start btn-neo neo-solid neo-still" id="redeAbrir" style="--mc:#22d3ee; --mc-glow:rgba(34,211,238,0.35);">Abrir sala</button><button type="button" class="chip" id="redeOk" style="margin-top:10px">Fechar</button></div>`;
      ov.querySelector("#redeAbrir").addEventListener("click", () => {
        redeAbrirSala();
        pintar();
      });
    } else {
      const lugares = players
        .map((p) => `<li>${escapeHtml((p.avatar ? p.avatar + " " : "") + p.name)} · ${redeOnline(rede.assentos[p.id]) ? "🟢 na sala" : rede.assentos[p.id] ? "🟠 caiu" : "⚪ fora"}</li>`)
        .join("");
      ov.innerHTML = `<div class="jf-modal" role="dialog" aria-modal="true"><h3>🌐 Sala ${rede.sala}</h3><p>Link pra entrar:<br><code class="rede-link">${escapeHtml(redeLinkDaSala())}</code></p><ul class="rede-lista">${lugares}</ul><button type="button" class="chip" id="redeAbrirAba">Abrir uma aba de convidado</button><button type="button" class="chip" id="redeFecharSala">Fechar a sala</button><button type="button" class="chip" id="redeOk" style="margin-top:10px">Fechar</button></div>`;
      ov.querySelector("#redeAbrirAba").addEventListener("click", () => window.open(redeLinkDaSala(), "_blank"));
      ov.querySelector("#redeFecharSala").addEventListener("click", () => {
        redeFechar();
        pintar();
      });
    }
    ov.querySelector("#redeOk").addEventListener("click", () => ov.remove());
  };
  pintar();
  document.body.appendChild(ov);
}
