/* ----------------------------------------------------------------------
 * 5k. REDE: SALA, PROTOCOLO, PAPÉIS E RELÓGIO
 * 1.7.9.7 (Parte 3): a base. 1.7.9.10 (Final): a internet de verdade (PeerJS), o painel de cada
 * jogador calculado pelo host, a votação do Descartar e do Desistir, o lugar do host, a versão
 * igual em todos e a sala que volta quando o host recarrega.
 *
 * Um aparelho HOSPEDA a sala (roda a partida, como sempre); os outros ENTRAM como convidados:
 * escolhem quem são, recebem o retrato público e mandam comandos.
 *
 *  · HOST MANDA EM TUDO: o convidado não roda o motor, não carrega nem grava partida e não
 *    desembaralha as cartas (redeSemCatalogo). Ele só mostra o retrato público que chega.
 *  · ENVELOPE: toda mensagem leva o protocolo (REDE_PROTOCOLO), a sala, a sessão de quem mandou
 *    e um número em sequência. Mensagem de outra sala, de outro protocolo, repetida, velha,
 *    grande demais ou malformada é jogada fora (redeValidar), sem travar nada.
 *  · ATOR PELA SESSÃO: quem mandou o comando é a sessão que entrou na sala e ocupou um lugar
 *    (rede.assentos), nunca o que a mensagem diz. O host confere o papel (redePodeComandar) e
 *    depois vem a porta de sempre (dispatchAction): partida, revisão, comando repetido, regra.
 *  · PAINEL: o host calcula os botões de cada jogador (redeOpcoes: veredito, especiais de mover e
 *    de alvo, Express, duelo de bônus, palpite, desfazer, descartar, desistir) e manda só pra ele.
 *    O celular do convidado só desenha; a mesma regra da tela do host vale pra todo mundo.
 *  · RESPOSTA SÓ PRO MESTRE: o retrato da mesa nunca tem resposta. A resposta vai na mensagem
 *    "segredo", endereçada à sessão do Mestre da vez, e o convidado apaga quando a carta acaba ou
 *    quando deixa de ser Mestre.
 *  · VOTAÇÃO (decisão do JF): numa sala com gente, Descartar e Desistir viram votação da mesa. O
 *    Mestre pede (conta como sim), cada um vota no seu celular (o host também, se tiver lugar),
 *    e a maioria decide. Em 20 s vale o que foi votado; empate não passa.
 *  · INTERVALO (decisão do JF): no online só o host toca "Próxima carta". Os convidados veem o
 *    aviso do intervalo e o tabuleiro no próprio celular.
 *  · RECONEXÃO: o convidado guarda o id do jogador que escolheu e uma CHAVE secreta do aparelho
 *    (por sala). Se cair ou recarregar, ele pede o mesmo lugar com a chave e volta na hora. Sem a
 *    chave, ninguém toma um lugar que ainda está online. Se o HOST recarregar, a sala volta com o
 *    mesmo código (perfil5_rede_host) e os convidados se reconectam sozinhos.
 *  · TROCA DE HOST (1.7.9.11, regra do JF: o 2º Mestre da partida assume, depois o 3º…): o host manda o
 *    PACOTE DE RECUPERAÇÃO (o save completo) só pro sucessor, a cada mudança. Se os celulares ficarem
 *    15 s sem notícia do host, o sucessor recarrega como host com esse pacote e reabre a MESMA sala; os
 *    outros se reconectam sozinhos e o C.A.O.S. anuncia quem assumiu. O host antigo que voltar descobre
 *    que já tem host (sondagem) e entra como jogador.
 *  · VERSÃO: quem entra com outra versão do jogo é recusado, com o aviso pra atualizar.
 *  · RELÓGIO: o convidado mede a diferença pro relógio do host (ping/pong, fica a medida de menor
 *    atraso) e conta o tempo por ela. Quem decide que o tempo acabou é só o host.
 *  · TRANSPORTE: o protocolo não sabe por onde a mensagem vai.
 *      - INTERNET (padrão): PeerJS (WebRTC), embutido no jogo (05l-peerjs.js). O host é o "servidor"
 *        da sala: cada convidado abre uma conexão direta com ele. O servidor público do PeerJS só
 *        apresenta um ao outro; a partida não passa por ele.
 *      - LOCAL (ensaio): BroadcastChannel, abas do mesmo navegador (#sala=ABCD&local). Aqui a
 *        mensagem "para" alguém chega em todas as abas e o convidado ignora o que não é dele.
 * ---------------------------------------------------------------------- */
const REDE_PROTOCOLO = 1;
const REDE_MAX_LETRAS = 640 * 1024; // só o pacote de recuperação chega perto disso
const REDE_MAX_NORMAL = 64 * 1024; // o resto das mensagens
const REDE_DO_CONVIDADO = ["oi", "cmd", "ping", "tchau", "voto"];
const REDE_DO_HOST = ["bemvindo", "escolha", "recusa", "retrato", "segredo", "resp", "pong", "painel", "recuperacao"];
const REDE_HOST_SUMIU_MS = 15000; // sem notícia do host há mais que isso: o sucessor assume
const REDE_ONLINE_MS = 15000; // sem notícia há mais que isso: o convidado conta como fora
const REDE_LETRAS_SALA = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sem I e O (não confundem com 1 e 0)
const REDE_SITE = "https://jfsouza77.github.io/Projeto_Perfil_JF/"; // link pros convidados (o host pode estar no offline)
const REDE_PEER_PREFIXO = "perfiljf-sala-";
const REDE_HOST_KEY = "perfil5_rede_host";
const REDE_VOTO_MS = 20000;
// Versão do jogo (do <title>, lido antes de qualquer tela mudar o título).
const JOGO_VERSAO = (() => {
  try {
    if (typeof window.__JOGO_VERSAO === "string") return window.__JOGO_VERSAO; // (teste de versão diferente)
    return (String(document.title).match(/(\d+(?:\.\d+){2,3})/) || [])[1] || "?";
  } catch (e) {
    return "?";
  }
})();
let redeInsistirId = false; // reabrindo a sala depois de assumir: espera o id da sala ficar livre
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
function redeModoDoEndereco() {
  try {
    return /(?:^|[#&])local(?:&|$)/.test(String(location.hash || "")) ? "local" : "internet";
  } catch (e) {
    return "internet";
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
function redeTemInternet() {
  return typeof Peer === "function" && typeof RTCPeerConnection === "function";
}

/* --- Transportes --- */
// Local: BroadcastChannel (abas do mesmo navegador). As mensagens viajam como texto (JSON), igual
// pela internet, pra validação valer do mesmo jeito.
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
    estado: "aberta",
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
// 1.7.9.3 · Servidores que ajudam os celulares a se acharem. STUN descobre o endereço de cada um; TURN é a
// ponte: quando a rede do celular (4G/5G, Wi-Fi de empresa) não deixa a ligação direta, os dados passam por ele.
// Todos gratuitos e sem conta; se um sair do ar, os outros seguram. Portas 80/443 passam até em rede fechada.
// Pra usar uma conta própria (ex.: Metered, 20 GB/mês grátis), é só pôr os dados dela em REDE_ICE_PROPRIOS.
const REDE_ICE_PROPRIOS = [];
const REDE_ICE = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] },
  { urls: ["turn:eu-0.turn.peerjs.com:3478", "turn:us-0.turn.peerjs.com:3478"], username: "peerjs", credential: "peerjsp" },
  {
    urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443", "turn:openrelay.metered.ca:443?transport=tcp", "turns:openrelay.metered.ca:443?transport=tcp"],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  { urls: ["turn:freeturn.net:3478", "turns:freeturn.tel:5349"], username: "free", credential: "free" },
];
// Configuração do PeerJS (o teste aponta pra um servidor local por window.__REDE_PEER_CONFIG).
function redePeerConfig() {
  const extra = (typeof window !== "undefined" && window.__REDE_PEER_CONFIG) || {};
  return Object.assign({ debug: 0, config: { iceServers: REDE_ICE_PROPRIOS.concat(REDE_ICE), sdpSemantics: "unified-plan" } }, extra);
}
function redeMudouEstado(t) {
  try {
    if (typeof t.aoEstado === "function") t.aoEstado(t.estado, t.erro);
  } catch (e) {}
}
// Internet, lado do host: um Peer com o id da sala; cada convidado abre uma conexão com ele.
function redeTransportePeerHost(sala) {
  if (!redeTemInternet()) return null;
  const porSessao = new Map(); // sessão → conexão (pra mensagem "para" alguém ir só pra ele)
  const todas = new Set();
  let receber = () => {};
  let peer = null, tentativas = 0, fechado = false;
  const t = {
    tipo: "internet",
    estado: "conectando",
    erro: null,
    aoEstado: null,
    enviar(texto, para) {
      const manda = (c) => {
        try {
          if (c.open) c.send(texto);
        } catch (e) {}
      };
      if (para) {
        const c = porSessao.get(para);
        if (c) manda(c);
        return;
      }
      todas.forEach(manda);
    },
    aoReceber(fn) {
      receber = fn;
    },
    fechar() {
      fechado = true;
      try {
        peer && peer.destroy();
      } catch (e) {}
    },
  };
  const abrir = () => {
    try {
      peer = new Peer(REDE_PEER_PREFIXO + sala.toLowerCase(), redePeerConfig());
    } catch (e) {
      t.estado = "erro";
      t.erro = "peer";
      redeMudouEstado(t);
      return;
    }
    peer.on("open", () => {
      t.estado = "aberta";
      t.erro = null;
      redeMudouEstado(t);
    });
    peer.on("error", (e) => {
      const tipo = (e && e.type) || "erro";
      // o id da sala ainda está preso no servidor (o host acabou de recarregar): tenta de novo
      // 1.7.9.5 (relato do JF: fechou o app, a Anne trocou a carta e, ao voltar, ele continuava na carta
      // antiga): id da sala ocupado. Pergunta a quem está com ele: se alguém responde, outro aparelho é o
      // host (assumiu a sala) e este entra como jogador; se ninguém responde, é o id antigo preso no
      // servidor (app fechado de repente segura o id por até ~1 min) e tenta de novo.
      if (tipo === "unavailable-id" && tentativas < (redeInsistirId ? 45 : 30) && !fechado) {
        tentativas++;
        try {
          peer.destroy();
        } catch (x) {}
        if (redeInsistirId) return void setTimeout(abrir, 2500);
        redeSondar(sala, "internet", (existe) => {
          if (fechado) return;
          if (existe && rede && rede.papel === "host" && rede.transporte === t) return redeHostRebaixar();
          setTimeout(abrir, 1000);
        });
        return;
      }
      if (tipo === "peer-unavailable") return; // um convidado sumiu: não é erro da sala
      t.erro = tipo;
      if (t.estado !== "aberta") t.estado = "erro";
      redeMudouEstado(t);
    });
    // perdeu o servidor de apresentação: as conexões abertas continuam; tenta voltar pra receber novos
    peer.on("disconnected", () => {
      if (fechado) return;
      setTimeout(() => {
        try {
          if (!fechado && peer.disconnected && !peer.destroyed) peer.reconnect();
        } catch (e) {}
      }, 1500);
    });
    peer.on("connection", (c) => {
      todas.add(c);
      c.on("data", (d) => {
        if (typeof d !== "string") return;
        // a conexão fica presa à primeira sessão que falou por ela (ninguém se passa por outro)
        let de = null;
        try {
          de = JSON.parse(d).de;
        } catch (e) {}
        if (!c._sessao && redeSessaoValida(de)) {
          c._sessao = de;
          porSessao.set(de, c);
        }
        if (c._sessao && de !== c._sessao) return;
        receber(d);
      });
      const tirar = () => {
        todas.delete(c);
        if (c._sessao && porSessao.get(c._sessao) === c) porSessao.delete(c._sessao);
      };
      c.on("close", tirar);
      c.on("error", tirar);
    });
  };
  abrir();
  return t;
}
// Internet, lado do convidado: uma conexão com o host, que volta sozinha se cair.
function redeTransportePeerConvidado(sala) {
  if (!redeTemInternet()) return null;
  let receber = () => {};
  let peer = null, conn = null, fechado = false, agendado = null;
  const fila = [];
  const t = {
    tipo: "internet",
    estado: "conectando",
    erro: null,
    aoEstado: null,
    aoAbrir: null,
    enviar(texto) {
      if (conn && conn.open) {
        try {
          conn.send(texto);
          return;
        } catch (e) {}
      }
      fila.push(texto);
      if (fila.length > 40) fila.shift();
    },
    aoReceber(fn) {
      receber = fn;
    },
    // a conexão parece viva mas o host sumiu (o WebRTC pode demorar a perceber): abre outra
    reconectar() {
      if (fechado) return;
      const c = conn;
      conn = null;
      try {
        c && c.close();
      } catch (e) {}
      t.estado = "reconectando";
      tentarDeNovo(200);
    },
    fechar() {
      fechado = true;
      clearTimeout(agendado);
      try {
        peer && peer.destroy();
      } catch (e) {}
    },
  };
  const tentarDeNovo = (ms) => {
    if (fechado) return;
    clearTimeout(agendado);
    agendado = setTimeout(conectar, ms);
  };
  const conectar = () => {
    if (fechado || !peer || peer.destroyed) return;
    if (peer.disconnected) {
      try {
        peer.reconnect();
      } catch (e) {}
      return tentarDeNovo(2000);
    }
    let c;
    try {
      c = peer.connect(REDE_PEER_PREFIXO + sala.toLowerCase(), { reliable: true });
    } catch (e) {
      return tentarDeNovo(3000);
    }
    conn = c;
    c.on("open", () => {
      t.estado = "aberta";
      t.erro = null;
      while (fila.length) {
        try {
          c.send(fila.shift());
        } catch (e) {
          break;
        }
      }
      redeMudouEstado(t);
      try {
        if (typeof t.aoAbrir === "function") t.aoAbrir();
      } catch (e) {}
    });
    c.on("data", (d) => typeof d === "string" && receber(d));
    const caiu = () => {
      if (conn !== c) return;
      conn = null;
      if (fechado) return;
      t.estado = "reconectando";
      redeMudouEstado(t);
      tentarDeNovo(2000);
    };
    c.on("close", caiu);
    c.on("error", caiu);
  };
  try {
    peer = new Peer(undefined, redePeerConfig());
  } catch (e) {
    t.estado = "erro";
    t.erro = "peer";
    return t;
  }
  peer.on("open", () => conectar());
  peer.on("error", (e) => {
    const tipo = (e && e.type) || "erro";
    // a sala não existe (ainda) ou o host está recarregando: insiste devagar
    if (tipo === "peer-unavailable") {
      t.estado = "sem_sala";
      t.erro = tipo;
      redeMudouEstado(t);
      return tentarDeNovo(3000);
    }
    t.erro = tipo;
    redeMudouEstado(t);
    tentarDeNovo(4000);
  });
  peer.on("disconnected", () => tentarDeNovo(1500));
  return t;
}
function redeFabrica(modo, papel) {
  if (modo === "local") return redeTransporteLocal;
  return papel === "host" ? redeTransportePeerHost : redeTransportePeerConvidado;
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
  rede.transporte.enviar(texto, para);
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
  if (m.t !== "recuperacao" && bruto.length > REDE_MAX_NORMAL) return recusar("grande_demais");
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
  const txt = (v, n) => typeof v === "string" && v.length <= n;
  // conteúdo de cada tipo
  const ok = {
    oi: () =>
      (m.jogadorId === undefined || m.jogadorId === null || jogadorIdValido(m.jogadorId)) &&
      typeof m.chave === "string" && /^[a-z0-9]{12,32}$/.test(m.chave) && txt(m.versao, 20),
    cmd: () =>
      typeof m.commandId === "string" && /^[A-Za-z0-9_:-]{4,64}$/.test(m.commandId) && typeof m.acao === "string" && !!ACOES[m.acao] &&
      Array.isArray(m.dados) && m.dados.length <= 4 && m.dados.every(redeEhPrimitivo) &&
      (m.rev === undefined || Number.isInteger(m.rev)) && (m.matchId === undefined || m.matchId === null || typeof m.matchId === "string"),
    ping: () => typeof m.t0 === "number" && isFinite(m.t0),
    tchau: () => true,
    voto: () => txt(m.votacao, 40) && typeof m.sim === "boolean",
    bemvindo: () => jogadorIdValido(m.jogadorId),
    escolha: () => Array.isArray(m.lugares) && m.lugares.length <= 12 && m.lugares.every((l) => l && jogadorIdValido(l.id) && typeof l.nome === "string"),
    recusa: () => txt(m.motivo, 40) && (m.versao === undefined || txt(m.versao, 20)),
    retrato: () => m.r && typeof m.r === "object" && m.r.protocolo === RETRATO_PROTOCOLO && m.r.papel === "mesa" && Number.isInteger(m.r.revisao) && Array.isArray(m.r.jogadores),
    segredo: () => Number.isInteger(m.revisao) && (m.resposta === null || txt(m.resposta, 120)),
    resp: () => typeof m.commandId === "string" && typeof m.ok === "boolean",
    pong: () => typeof m.t0 === "number" && typeof m.th === "number" && isFinite(m.th),
    recuperacao: () => txt(m.estado, REDE_MAX_LETRAS) && Number.isInteger(m.revisao) && (m.matchId === null || txt(m.matchId, 64)),
    painel: () =>
      Number.isInteger(m.revisao) && Array.isArray(m.opcoes) && m.opcoes.length <= 40 &&
      m.opcoes.every((o) => o && typeof o.a === "string" && !!ACOES[o.a] && Array.isArray(o.d) && o.d.length <= 4 && o.d.every(redeEhPrimitivo) && txt(o.t, 80) && (o.c === undefined || txt(o.c, 12)) && (o.g === undefined || txt(o.g, 60))),
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
function redeHostGuardar() {
  try {
    if (rede && rede.papel === "host")
      JFStore.setItem(REDE_HOST_KEY, JSON.stringify({ sala: rede.sala, modo: rede.modo, eu: rede.hostEu || null, quando: Date.now() }));
  } catch (e) {}
}
// Abre a sala. modo "internet" (padrão, PeerJS) ou "local" (ensaio em abas). salaFixa: reabrir
// a mesma sala depois de recarregar.
function redeAbrirSala(modo, salaFixa) {
  if (typeof modo === "function") return redeAbrirSalaCom(modo, "local", salaFixa); // (testes antigos)
  const m = modo === "local" || !redeTemInternet() ? "local" : "internet";
  return redeAbrirSalaCom(redeFabrica(m, "host"), m, salaFixa);
}
function redeAbrirSalaCom(fab, modo, salaFixa) {
  if (rede) redeFechar();
  const sala = redeSalaValida(salaFixa) ? salaFixa : redeCodigoSala();
  const transporte = fab(sala);
  if (!transporte) return null;
  rede = {
    papel: "host",
    modo,
    sala,
    sessao: "s_" + redeAleatorio(10),
    transporte,
    seq: 0,
    ultimoSeq: {},
    recusadas: {},
    assentos: {},
    hostEu: null, // o jogador que está no aparelho do host (vota por ele)
    segredoEnviado: null,
    paineis: {},
    votacao: null,
    recEnviada: null, // revisão e sucessor do último pacote de recuperação
    recQuando: 0,
    batida: null,
    esperando: {}, // 1.7.9.4: sessões na tela "Quem é você?" → a última lista mandada (a sala abre antes do cadastro)
  };
  redeTelaAcesa(true);
  transporte.aoReceber((bruto) => {
    // outro aparelho já é host desta sala (só acontece no ensaio local): este passa a jogador
    if (typeof bruto === "string" && bruto.includes('"t":"retrato"')) {
      try {
        const o = JSON.parse(bruto);
        if (o && o.t === "retrato" && o.sala === rede.sala && o.de !== rede.sessao) return redeHostRebaixar();
      } catch (e) {}
    }
    const msg = redeValidar(bruto);
    if (msg) redeHostReceber(msg);
  });
  transporte.aoEstado = () => {
    const p = document.getElementById("redePainel");
    if (p && typeof p._pintar === "function") p._pintar();
  };
  if (!redeOuvindo) {
    acoesAoMudar(() => rede && rede.papel === "host" && redeHostPublicar());
    redeOuvindo = true;
  }
  // batida: retrato de novo a cada 4 s (quem perdeu uma mensagem se acerta) e confere a votação
  rede.batida = setInterval(() => {
    if (!rede || rede.papel !== "host") return;
    redeVotacaoConferir();
    redeHostEsperando();
    redeHostPublicar(true);
    redeCadastroInfo();
  }, 4000);
  redeHostGuardar();
  redeCadastroInfo();
  try {
    caosLog("rede", `sala ${sala} aberta (${transporte.tipo})`);
  } catch (e) {}
  return sala;
}
// Partida carregada depois de recarregar: se havia sala aberta há pouco, ela volta com o mesmo código.
// Antes, uma sondagem: se outro aparelho já é host da sala (assumiu enquanto este estava fora), este
// entra como jogador.
function redeHostRetomar() {
  if (rede || redeSalaDoEndereco()) return false;
  let s = null;
  try {
    s = JSON.parse(JFStore.getItem(REDE_HOST_KEY) || "null");
  } catch (e) {}
  if (!s || !redeSalaValida(s.sala) || !(Date.now() - (s.quando || 0) < 2 * 3600e3)) return false;
  if (!starterChosen || gameEnded) return false;
  const modo = s.modo === "local" ? "local" : "internet";
  redeSondar(s.sala, modo, (existe) => {
    if (rede) return;
    if (existe) {
      try {
        JFStore.removeItem(REDE_HOST_KEY);
      } catch (e) {}
      return redeIrPraSala(s.sala, modo);
    }
    redeInsistirId = !!s.assumiu;
    const sala = redeAbrirSala(modo, s.sala);
    if (!sala) return;
    if (jogadorIdValido(s.eu) && jogadorIdxPorId(s.eu) >= 0) rede.hostEu = s.eu;
    redeHostGuardar();
    if (s.assumiu) {
      // o C.A.O.S. anuncia a troca (gerador hostCaiu, pronto desde a 1.7.5.1)
      try {
        const nome = (jogadorPorId(s.eu) || {}).name || "alguém";
        const fala = typeof caosGerarFala === "function" ? caosGerarFala("hostCaiu", null, { antigo: s.antigo || "host", nome }) : "";
        showToastMessage(fala ? "[C.A.O.S.] " + fala : `[C.A.O.S.] ${nome} assumiu a sala. Nada se perdeu.`, null, true);
        caosLog("rede", `assumiu a sala ${s.sala} no lugar de ${s.antigo || "?"}`);
      } catch (e) {}
    }
  });
  return true;
}
// Pergunta se a sala já tem host (um ping; quem responde é o host). Local: 2,5 s; internet: 8 s.
function redeSondar(sala, modo, cb) {
  let feito = false;
  const fim = (v) => {
    if (feito) return;
    feito = true;
    try {
      limpar();
    } catch (e) {}
    cb(v);
  };
  let limpar = () => {};
  const sessao = "s_sonda" + redeAleatorio(6);
  const ping = JSON.stringify({ p: REDE_PROTOCOLO, t: "ping", sala, de: sessao, seq: 1, t0: Date.now() });
  const ouviu = (d) => {
    try {
      const o = JSON.parse(d);
      if (o && o.sala === sala && (o.t === "pong" || o.t === "retrato") && o.de !== sessao) fim(true);
    } catch (e) {}
  };
  if (modo === "local") {
    if (typeof BroadcastChannel !== "function") return fim(false);
    const bc = new BroadcastChannel("perfiljf-sala-" + sala);
    bc.onmessage = (ev) => ouviu(ev && ev.data);
    bc.postMessage(ping);
    limpar = () => bc.close();
    setTimeout(() => fim(false), 2500);
    return;
  }
  if (!redeTemInternet()) return fim(false);
  let peer;
  try {
    peer = new Peer(undefined, redePeerConfig());
  } catch (e) {
    return fim(false);
  }
  limpar = () => peer.destroy();
  peer.on("open", () => {
    const c = peer.connect(REDE_PEER_PREFIXO + sala.toLowerCase(), { reliable: true });
    c.on("open", () => fim(true));
  });
  peer.on("error", () => fim(false));
  setTimeout(() => fim(false), 15000); // 1.7.9.5: no 4G a conexão pode levar mais de 8 s
}
function redeIrPraSala(sala, modo) {
  try {
    location.hash = "sala=" + sala + (modo === "local" ? "&local" : "");
    location.reload();
  } catch (e) {}
}
// Outro aparelho é host desta sala: este deixa de ser e entra como jogador.
function redeHostRebaixar() {
  if (!rede || rede.papel !== "host") return;
  const sala = rede.sala, modo = rede.modo;
  try {
    caosLog("rede", "outro aparelho é host da sala " + sala + ": este entra como jogador");
  } catch (e) {}
  redeFechar();
  redeIrPraSala(sala, modo);
}
// 1.7.9.3 · Tela acesa enquanto a sala está aberta: celular que apaga a tela derruba a conexão (o iPhone
// suspende a página). Usa o Wake Lock do navegador quando existe; ao voltar pro jogo, pede de novo.
let redeTravaTela = null;
function redeTelaAcesa(ligar) {
  try {
    if (!ligar) {
      if (redeTravaTela) redeTravaTela.release().catch(() => {});
      redeTravaTela = null;
      return;
    }
    if (!navigator.wakeLock || document.visibilityState !== "visible" || (redeTravaTela && !redeTravaTela.released)) return;
    navigator.wakeLock.request("screen").then(
      (t) => {
        if (rede) redeTravaTela = t;
        else t.release().catch(() => {});
      },
      () => {},
    );
  } catch (e) {}
}
if (typeof document !== "undefined")
  ["visibilitychange", "pointerdown"].forEach((ev) =>
    document.addEventListener(ev, () => rede && redeTelaAcesa(true), { passive: true }),
  ); // alguns navegadores só liberam depois de um toque
function redeFechar() {
  if (!rede) return;
  redeTelaAcesa(false);
  try {
    if (rede.papel === "convidado") redeEnviar("tchau", {});
    if (rede.papel === "host") JFStore.removeItem(REDE_HOST_KEY);
  } catch (e) {}
  clearInterval(rede.batida);
  clearInterval(rede.pingTimer);
  clearInterval(rede.vistaTimer);
  try {
    rede.transporte.fechar();
  } catch (e) {}
  // a escuta de acoesAoMudar fica registrada; ela confere "rede" antes de agir
  rede = null;
  redeHostVista();
  redeCadastroInfo();
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
    .filter((p) => !redeOnline(rede.assentos[p.id]) && p.id !== rede.hostEu)
    .map((p) => ({ id: p.id, nome: String(p.name).slice(0, 24), avatar: p.avatar || null }));
}
// 1.7.9.4 · A sala aberta antes do cadastro: quem está escolhendo recebe a lista de novo quando ela muda
// (jogador cadastrado, removido, lugar ocupado). Lugar de jogador que saiu do cadastro volta pra escolha.
function redeMandarEscolha(sessao) {
  const lugares = redeLugaresLivres();
  rede.esperando[sessao] = JSON.stringify(lugares);
  redeEnviar("escolha", { lugares }, sessao);
}
function redeHostEsperando() {
  if (!rede || rede.papel !== "host") return;
  if (rede.hostEu && jogadorIdxPorId(rede.hostEu) < 0) rede.hostEu = null;
  rede.semLugar = rede.semLugar || {};
  Object.keys(rede.assentos).forEach((jid) => {
    if (jogadorIdxPorId(jid) >= 0) return;
    const a = rede.assentos[jid];
    delete rede.assentos[jid];
    if (!a.sessao) return;
    // 1.7.9.5 (relato do JF: Reiniciar no host não reiniciava no tablet): guarda o nome de quem perdeu o
    // lugar; se o host cadastrar o mesmo nome de novo, o aparelho volta pro lugar sozinho
    rede.semLugar[a.sessao] = { nome: a.nome || null, chave: a.chave };
    redeMandarEscolha(a.sessao);
  });
  Object.keys(rede.esperando).forEach((ses) => {
    const sl = rede.semLugar[ses];
    if (!sl || !sl.nome) return;
    const p = players.find((x) => x.name.toLowerCase() === sl.nome.toLowerCase() && x.id !== rede.hostEu && !redeOnline(rede.assentos[x.id]));
    if (!p) return;
    rede.assentos[p.id] = { sessao: ses, visto: Date.now(), chave: sl.chave, nome: p.name };
    delete rede.esperando[ses];
    delete rede.semLugar[ses];
    delete rede.paineis[p.id];
    redeEnviar("bemvindo", { jogadorId: p.id, matchId: matchId || null, volta: true }, ses);
  });
  const lista = JSON.stringify(redeLugaresLivres());
  Object.keys(rede.esperando).forEach((ses) => rede.esperando[ses] !== lista && redeMandarEscolha(ses));
}
// Resumo da sala no cadastro (botão "Vai jogar online?").
function redeCadastroInfo() {
  const b = document.getElementById("redeCadBtn"), info = document.getElementById("redeCadInfo");
  if (!b || !info) return;
  if (!rede || rede.papel !== "host") {
    b.textContent = "🌐 Vai jogar online? Abra a sala antes de cadastrar";
    info.innerHTML = "";
    return;
  }
  b.textContent = `🌐 Sala ${rede.sala} aberta · ver o link`;
  const na = players.filter((p) => redeOnline(rede.assentos[p.id])).map((p) => escapeHtml(p.name));
  const esperando = Object.keys(rede.esperando).length;
  info.innerHTML =
    `Cadastre todo mundo aqui: cada um escolhe o próprio nome no celular.` +
    (na.length ? `<br>🟢 Na sala: ${na.join(", ")}` : "") +
    (esperando ? `<br>⏳ ${esperando} aparelho${esperando === 1 ? "" : "s"} esperando o nome aparecer` : "");
}
// O cadastro mudou (jogador entrou ou saiu): avisa a sala na hora, sem esperar a batida.
function redeHostCadastroMudou() {
  if (!rede || rede.papel !== "host") return;
  redeHostEsperando();
  redeHostPublicar(true);
  redeCadastroInfo();
  const p = document.getElementById("redePainel");
  if (p && typeof p._pintar === "function") p._pintar();
}
function redeHostReceber(m) {
  const a = redeAssentoDaSessao(m.de);
  if (a) rede.assentos[a].visto = Date.now();
  if (m.t === "oi") return redeHostOi(m);
  if (m.t === "ping") return redeEnviar("pong", { t0: m.t0, th: Date.now() }, m.de);
  if (m.t === "tchau") {
    if (a) rede.assentos[a].visto = 0;
    delete rede.esperando[m.de];
    return;
  }
  if (m.t === "cmd") return redeHostComando(m, a);
  if (m.t === "voto") return a && redeVotar(a, m.votacao, m.sim);
}
function redeHostOi(m) {
  if (m.versao !== JOGO_VERSAO) return redeEnviar("recusa", { motivo: "versao_diferente", versao: JOGO_VERSAO }, m.de);
  // 1.7.9.4 (pedido do JF: abrir a sala antes de cadastrar): sem jogadores ainda, quem chega fica na tela
  // "Quem é você?" e o nome aparece lá quando o host cadastrar (redeHostEsperando)
  const pedido = m.jogadorId && jogadorIdxPorId(m.jogadorId) >= 0 ? m.jogadorId : null;
  if (!pedido) return redeMandarEscolha(m.de);
  if (pedido === rede.hostEu) return redeEnviar("recusa", { motivo: "lugar_ocupado" }, m.de);
  const atual = rede.assentos[pedido];
  // o mesmo aparelho voltando (mesma chave) recupera o lugar na hora; outro só depois que ele cair
  if (atual && atual.sessao !== m.de && redeOnline(atual) && atual.chave !== m.chave) return redeEnviar("recusa", { motivo: "lugar_ocupado" }, m.de);
  // a mesma sessão não segura dois lugares
  const antigo = redeAssentoDaSessao(m.de);
  if (antigo && antigo !== pedido) delete rede.assentos[antigo];
  const volta = !!atual;
  rede.assentos[pedido] = { sessao: m.de, visto: Date.now(), chave: m.chave, nome: (jogadorPorId(pedido) || {}).name || null };
  delete rede.esperando[m.de];
  if (rede.semLugar) delete rede.semLugar[m.de];
  delete rede.paineis[pedido];
  redeEnviar("bemvindo", { jogadorId: pedido, matchId: matchId || null, volta }, m.de);
  try {
    caosLog("rede", `${(jogadorPorId(pedido) || {}).name || "?"} ${volta ? "voltou pra" : "entrou na"} sala`);
  } catch (e) {}
  rede.segredoEnviado = null; // o Mestre pode ter acabado de chegar: manda a resposta de novo
  redeHostEsperando(); // o lugar saiu da lista de quem ainda está escolhendo
  redeHostPublicar(true);
  redeCadastroInfo();
  const p = document.getElementById("redePainel");
  if (p && typeof p._pintar === "function") p._pintar();
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
  // Descartar e Desistir pedidos pelo celular viram votação da mesa (se houver mais gente na sala)
  if ((m.acao === "descartarCarta" || m.acao === "desistirCarta") && redeVotacaoPrecisa()) {
    const def = ACOES[m.acao];
    if (!def.pode()) return responder(false, "fora_de_hora");
    const ok = redeVotacaoAbrir(m.acao === "descartarCarta" ? "descartar" : "desistir", jid);
    return responder(ok, ok ? "votacao" : "fora_de_hora");
  }
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

/* --- Painel de cada jogador: os botões que ele pode tocar agora (o host calcula) --- */
function redeOpcoes(jid) {
  const op = [];
  const add = (a, d, t, c, g) => op.push({ a, d: d || [], t, ...(c ? { c } : {}), ...(g ? { g } : {}) });
  if (!starterChosen || gameEnded || jogadorIdxPorId(jid) < 0) return op;
  if (pausedAt) {
    add("continuar", [], "▶️ Continuar");
    return op;
  }
  const ehMestre = jogadorIdDe(mestreIndex) === jid;
  const nome = (i) => (players[i] ? (players[i].avatar ? players[i].avatar + " " : "") + players[i].name : "?");
  if (cardState === "bonusChoice" && redePodeComandar("bonusAdversario", jid)) {
    const e = pendingBonusQueue[0];
    if (CURRENT_FORMAT === "equipe")
      teamOrder.filter((id) => id !== e.landerIdx).forEach((id) => add("bonusAdversario", [id], `${TEAM_INFO[id].emoji} Equipe ${TEAM_INFO[id].label}`, "", "🏟️ Contra quem é o duelo?"));
    else players.forEach((p, i) => i !== e.landerIdx && add("bonusAdversario", [i], nome(i), "", "🏟️ Contra quem é o duelo?"));
  }
  if (ehMestre) {
    if (cardState === "none") add("sacarCarta", [], "🃏 Puxar carta", "ok");
    if (cardState === "hidden") add("virarCarta", [], "👀 Ver carta", "ok");
    if (cardState === "revealed" && pendingIndex !== null && currentCard) {
      const item = currentCard.clues[pendingIndex], txt = String(item.text || "").toLowerCase();
      const resp = responderIndex;
      if (item.type === "special") {
        if (CURRENT_MODE === "express") {
          if (expressTargetAction) players.forEach((p, i) => i !== resp && i !== mestreIndex && add("expressAlvo", [i], nome(i), "", "🎯 Escolha o jogador"));
          else if (txt.includes("avance") && !txt.includes("escolha")) add("expressPular", [txt.includes("2") ? 2 : 1], "⏭️ Pular jogador", "ok");
          else if (txt.includes("volte") && !txt.includes("escolha")) add("expressInverter", [txt.includes("3") ? 3 : 2], "🔁 Inverter o sentido", "nao");
          else if (txt.includes("escolha um jogador")) add("expressMirar", [txt.includes("avan") ? "steal" : "block"], "🎯 Escolher jogador", "ok");
          else add("especialPerdeVez", [], "➡️ Passar a vez", "nao");
        } else if (isWildcardSpecial(item.text)) {
          if (specialIsVoid(item)) add("especialSeguir", [], "→ Continuar, escolhe outra dica", "ok");
          else add("especialPerdeVez", [], "→ Passar a vez", "nao");
        } else if (CONTINUE_SAME_PLAYER_SPECIALS.has(item.text)) add("especialSeguir", [], "→ Continuar, escolhe outra dica", "ok");
        else {
          const mv = acoesMovimento();
          if (mv && !mv.escolha) add("moverJogador", [resp, mv.n], `${mv.n > 0 ? "➡️ Avançar" : "⬅️ Voltar"} ${Math.abs(mv.n)} casa${Math.abs(mv.n) === 1 ? "" : "s"} e passar a vez`, mv.n > 0 ? "ok" : "nao");
          else if (mv && mv.escolha) {
            const g = `Quem vai ${mv.n > 0 ? "avançar" : "voltar"} ${Math.abs(mv.n)} casas?`;
            if (CURRENT_FORMAT === "equipe") {
              const minha = players[resp] && players[resp].team;
              teamOrder.filter((id) => id !== minha).forEach((id) => add("moverEquipe", [id, mv.n, true], `${TEAM_INFO[id].emoji} Equipe ${TEAM_INFO[id].label}`, "", g));
            } else if (palpiteParticipants() < 3) add("moverJogador", [mestreIndex, mv.n], `${nome(mestreIndex)} (o Mestre)`, "", g);
            else players.forEach((p, i) => i !== resp && add("moverJogador", [i, mv.n], nome(i), "", g));
          } else add("especialPerdeVez", [], "➡️ Vez consumida, passa pro próximo", "nao");
        }
      } else if (CURRENT_MODE === "express") {
        players.forEach((p, i) => i !== mestreIndex && add("acertou", [i], "✓ " + nome(i), "ok", "Quem acertou?"));
        add("expressPassar", [], "➡️ Próxima dica", "nao");
      } else {
        add("acertou", [resp], `✓ ${players[resp] ? players[resp].name : "?"} acertou`, "ok");
        add("errou", [], "✕ Errou", "nao");
        add("errou", ["pular"], "» Pulou");
        add("errou", ["absurdo"], "⚠︎ Absurdo");
        palpiteEligibleHolders().forEach((k) => {
          const d = entityDisplay(k);
          add("palpiteAcertou", [k], `🃏 Palpite de ${d.name}: acertou`, "ok", "Palpite a qualquer hora");
          add("palpiteErrou", [k], `🃏 Palpite de ${d.name}: errou`, "nao", "Palpite a qualquer hora");
        });
      }
    }
    if (cardState === "revealed" && CURRENT_MODE !== "express") {
      if (podeDescartarCarta()) add("descartarCarta", [], redeVotacaoPrecisa() ? "🗑️ Descartar (a mesa vota)" : "🗑️ Descartar", "", "Mais");
      if (podeDesistirCarta()) add("desistirCarta", [], redeVotacaoPrecisa() ? "🏳️ Desistir (a mesa vota)" : "🏳️ Desistir", "", "Mais");
    }
    if (desfazerOferta) add("desfazer", [], "↩️ Desfazer: " + desfazerOferta.nome, "", "Mais");
  }
  add("pausar", [], "⏸️ Pausar", "", "Mais");
  return op;
}
// Sucessor (regra do JF): na ordem dos Mestres da partida (a partir do 2º, contando do primeiro Mestre),
// o primeiro jogador que está na sala, online, e não é o próprio host.
function redeSucessor() {
  if (!rede || rede.papel !== "host" || !players.length) return null;
  let ini = jogadorIdxPorId(primeiroMestreId);
  if (ini < 0) ini = 0;
  for (let k = 1; k <= players.length; k++) {
    const p = players[(ini + k) % players.length];
    if (p && p.id !== rede.hostEu && redeOnline(rede.assentos[p.id])) return p.id;
  }
  return null;
}
// Pacote de recuperação: o save completo, só pro sucessor (no máximo a cada 3 s, ou quando ele muda).
function redeHostRecuperacao(forcar) {
  const suc = redeSucessor();
  const a = suc && rede.assentos[suc];
  if (!a || !starterChosen || gameEnded) return;
  const chave = suc + "|" + partidaRevisao;
  if (rede.recEnviada === chave && !forcar) return;
  if (!forcar && rede.recEnviada && rede.recEnviada.startsWith(suc + "|") && Date.now() - rede.recQuando < 3000) return;
  let estado = null;
  try {
    saveGameState();
    estado = JFStore.getItem("perfil200_state");
  } catch (e) {}
  if (!estado) return;
  if (redeEnviar("recuperacao", { estado, revisao: partidaRevisao, matchId: matchId || null }, a.sessao)) {
    rede.recEnviada = chave;
    rede.recQuando = Date.now();
  }
}
// Retrato público pra todos, o painel de cada um e a resposta só pro Mestre.
function redeHostPublicar(forcar) {
  if (!rede || rede.papel !== "host") return;
  if (!starterChosen && !forcar) return;
  // 1.7.9.4: a partida começou com a sala aberta e ninguém disse quem joga neste aparelho: pergunta uma vez
  if (starterChosen && !rede.hostEu && !rede.perguntouEu && players.length) {
    rede.perguntouEu = true;
    setTimeout(() => rede && rede.papel === "host" && !rede.hostEu && redePainelHost(), 700);
  }
  const r = retratoPartida("mesa");
  // extras da sala (não fazem parte do retrato da partida): intervalo e votação
  r.intervalo = typeof tabLobbyFimEm === "function" ? tabLobbyFimEm() : null;
  r.votacao = rede.votacao ? redeVotacaoPublica() : null;
  r.sucessor = redeSucessor();
  r.hostNome = rede.hostEu ? (jogadorPorId(rede.hostEu) || {}).name || null : null;
  redeEnviar("retrato", { r });
  redeHostRecuperacao(false);
  Object.keys(rede.assentos).forEach((jid) => {
    const a = rede.assentos[jid];
    if (!redeOnline(a)) return;
    const opcoes = redeOpcoes(jid);
    const chave = JSON.stringify(opcoes) + "|" + partidaRevisao;
    if (!forcar && rede.paineis[jid] === chave) return;
    rede.paineis[jid] = chave;
    redeEnviar("painel", { revisao: partidaRevisao, opcoes }, a.sessao);
  });
  const mid = jogadorIdDe(mestreIndex);
  const a = mid && rede.assentos[mid];
  const resposta = currentCard && cardState !== "none" && !gameEnded ? currentCard.answer : null;
  const chave = [mid, resposta, matchId].join("|");
  if (a && redeOnline(a) && (forcar || chave !== rede.segredoEnviado)) {
    redeEnviar("segredo", { revisao: partidaRevisao, resposta }, a.sessao);
    rede.segredoEnviado = chave;
  }
  redeHostVista();
}

/* --- 1.7.9.4 · Tela do host quando o Mestre está em outro aparelho (relato do JF no 1º teste: a Anne era a
   Mestre no tablet dela e o celular do host continuava com a tela do Mestre, com carta e resposta) ---
   Se o Mestre da vez está na sala num aparelho próprio, este aparelho vira a tela de um jogador: o mesmo
   retrato público dos convidados, os números da dica na vez de quem joga aqui e o Pausar. A carta, a
   resposta e os botões do Mestre ficam escondidos por baixo. Mestre sem aparelho (joga no do host), ou que
   caiu da sala: a tela de sempre volta sozinha. No intervalo entre as cartas fica a tela de sempre (o host
   toca em Próxima carta, e a carta já acabou). */
function redeMestreLonge() {
  if (!rede || rede.papel !== "host" || !starterChosen || gameEnded) return false;
  if (typeof tabLobbyFimEm === "function" && tabLobbyFimEm()) return false;
  const mid = jogadorIdDe(mestreIndex);
  return !!mid && mid !== rede.hostEu && redeOnline(rede.assentos[mid]);
}
function redeHostVista() {
  let box = document.getElementById("redeHostVista");
  const longe = redeMestreLonge();
  document.body.classList.toggle("rede-mestre-longe", longe);
  if (!longe) {
    if (box) box.remove();
    if (rede && rede.vistaTimer) clearInterval(rede.vistaTimer), (rede.vistaTimer = null);
    return;
  }
  if (!box) {
    box = document.createElement("div");
    box.id = "redeHostVista";
    box.className = "telao rede-convidado rede-host-vista";
    box.setAttribute("aria-live", "polite");
    document.body.appendChild(box);
  }
  const r = retratoPartida("mesa");
  r.votacao = rede.votacao ? redeVotacaoPublica() : null;
  telaoUltimo = r; // pro relógio
  telaoDesenhar(r, box);
  const sair = box.querySelector(".telao-sair");
  if (sair) sair.remove();
  const eu = rede.hostEu && players[jogadorIdxPorId(rede.hostEu)];
  const mestre = players[mestreIndex];
  const nome = (p) => escapeHtml((p.avatar ? p.avatar + " " : "") + p.name);
  const vez = !!eu && jogadorIdDe(responderIndex) === eu.id;
  let h = `<div class="rede-eu">${eu ? `Neste aparelho: <b>${nome(eu)}</b>${vez ? " · 👉 sua vez" : ""}` : "Este aparelho é a mesa"}</div>`;
  h += `<div class="rede-segredo">🔒 A carta e a resposta estão no aparelho de <b>${mestre ? nome(mestre) : "quem é o Mestre"}</b> (Mestre da vez).</div>`;
  const c = r.carta;
  if (vez && cardState === "revealed" && c && pendingIndex === null && !pausedAt) {
    const abertas = new Set(c.abertas.map((d) => d.pos));
    const nums = [];
    for (let i = 0; i < c.totalDicas; i++) if (!abertas.has(i)) nums.push(`<button type="button" class="rede-btn" data-dica="${i}">${i + 1}</button>`);
    if (nums.length) h += `<div class="rede-rot">Escolha uma dica:</div><div class="rede-nums">${nums.join("")}</div>`;
  }
  const ops = eu ? redeOpcoes(eu.id).filter((o) => o.a !== "pausar") : [];
  if (ops.length) h += `<div class="rede-acoes">${ops.map((o, i) => `<button type="button" class="rede-btn${o.c ? " rede-" + escapeHtml(o.c) : ""}" data-op="${i}">${escapeHtml(o.t)}</button>`).join("")}</div>`;
  h += `<div class="rede-acoes rede-mais"><button type="button" class="rede-btn" id="redeVistaPausar">⏸️ Pausar</button><button type="button" class="rede-btn" id="redeVistaSala">🌐 Sala ${rede.sala}</button></div>`;
  const barra = document.createElement("section");
  barra.className = "rede-barra";
  barra.innerHTML = h;
  const topo = box.querySelector(".telao-vez");
  if (topo) topo.after(barra);
  else box.prepend(barra);
  const agir = (acao, dados) => {
    if (!eu || !redePodeComandar(acao, eu.id)) return;
    dispatchAction({ type: acao, data: dados, commandId: "h_" + redeAleatorio(12), expectedRevision: partidaRevisao, actorId: eu.id });
  };
  barra.querySelectorAll("[data-dica]").forEach((b) => b.addEventListener("click", () => agir("escolherDica", [+b.dataset.dica])));
  barra.querySelectorAll("[data-op]").forEach((b) =>
    b.addEventListener("click", () => {
      const o = ops[+b.dataset.op];
      if (o) agir(o.a, o.d);
    }),
  );
  barra.querySelector("#redeVistaPausar").addEventListener("click", () => document.getElementById("pauseBtn")?.click());
  barra.querySelector("#redeVistaSala").addEventListener("click", () => redePainelHost());
  if (!rede.vistaTimer) rede.vistaTimer = setInterval(() => (document.getElementById("redeHostVista") ? telaoRelogio() : null), 500);
}

/* --- Votação do Descartar e do Desistir (decisão do JF) --- */
// Quem vota: os lugares online da sala e o jogador do host (se ele escolheu um).
function redeVotantes() {
  if (!rede || rede.papel !== "host") return [];
  const v = Object.keys(rede.assentos).filter((jid) => redeOnline(rede.assentos[jid]) && jogadorIdxPorId(jid) >= 0);
  if (rede.hostEu && jogadorIdxPorId(rede.hostEu) >= 0 && !v.includes(rede.hostEu)) v.push(rede.hostEu);
  return v;
}
// Vale votação quando tem mais alguém na sala além de quem pede.
function redeVotacaoPrecisa() {
  return !!rede && rede.papel === "host" && redeVotantes().length >= 2;
}
function redeVotacaoAbrir(tipo, pedidoPor) {
  if (!rede || rede.papel !== "host" || rede.votacao) return false;
  rede.votacao = { id: "v_" + redeAleatorio(8), tipo, pedidoPor, rev: partidaRevisao, carta: cartaSeq, ate: Date.now() + REDE_VOTO_MS, votos: {} };
  rede.votacao.votos[pedidoPor] = true; // quem pede já é um sim
  try {
    const m = jogadorPorId(pedidoPor) || players[mestreIndex] || { name: "O Mestre" };
    showToastMessage(
      tipo === "descartar"
        ? `[C.A.O.S.] ${m.name} quer DESCARTAR esta carta porque achou difícil demais. Todos de acordo? Votem no celular.`
        : `[C.A.O.S.] ${m.name} quer DESISTIR desta carta. Todos de acordo? Votem no celular.`,
      null,
      true,
    );
  } catch (e) {}
  redeVotacaoHostMostrar();
  redeHostPublicar(true);
  return true;
}
function redeVotar(jid, id, sim) {
  const v = rede && rede.votacao;
  if (!v || v.id !== id || !redeVotantes().includes(jid)) return;
  v.votos[jid] = !!sim;
  redeVotacaoConferir();
  redeHostPublicar(true);
}
function redeVotacaoPublica() {
  const v = rede.votacao, vs = Object.values(v.votos);
  return { id: v.id, tipo: v.tipo, pedidoPor: v.pedidoPor, ate: v.ate, sim: vs.filter((x) => x).length, nao: vs.filter((x) => !x).length, total: redeVotantes().length, votaram: Object.keys(v.votos) };
}
// Fecha a votação quando dá maioria, quando todos votaram ou quando o tempo acaba.
function redeVotacaoConferir() {
  const v = rede && rede.votacao;
  if (!v) return;
  const total = Math.max(1, redeVotantes().length), vs = Object.values(v.votos);
  const sim = vs.filter((x) => x).length, nao = vs.filter((x) => !x).length;
  const mudou = gameEnded || cartaSeq !== v.carta;
  let fim = null;
  if (mudou) fim = "cancelada";
  else if (sim * 2 > total) fim = "aprovada";
  else if (nao * 2 >= total || sim + nao >= total) fim = "recusada";
  else if (Date.now() > v.ate) fim = sim > nao ? "aprovada" : "recusada";
  if (!fim) return;
  rede.votacao = null;
  document.getElementById("redeVotoHost")?.remove();
  if (fim === "aprovada") {
    // a mesa decidiu: o host aplica pela porta de sempre
    const r = dispatchAction({ type: v.tipo === "descartar" ? "descartarCarta" : "desistirCarta", actorId: v.pedidoPor });
    if (!r.ok) fim = "recusada";
  }
  try {
    if (fim === "recusada") showToastMessage(`[C.A.O.S.] A mesa disse NÃO. A carta fica. ${sim} a ${nao}.`, null, true);
    if (fim === "aprovada") showToastMessage(`[C.A.O.S.] Aprovado pela mesa, ${sim} a ${nao}. ${v.tipo === "descartar" ? "Carta descartada." : "Carta desistida."}`, null, true);
    caosLog("rede", `votação de ${v.tipo}: ${fim} (${sim} sim, ${nao} não)`);
  } catch (e) {}
  redeHostPublicar(true);
}
// No aparelho do host: a janelinha de voto (se o host tem um jogador e ainda não votou).
function redeVotacaoHostMostrar() {
  document.getElementById("redeVotoHost")?.remove();
  const v = rede && rede.votacao;
  if (!v || !rede.hostEu || v.votos[rede.hostEu] !== undefined) return;
  const box = document.createElement("div");
  box.id = "redeVotoHost";
  box.className = "rede-voto-host";
  box.innerHTML = `<div>🗳️ ${v.tipo === "descartar" ? "Descartar" : "Desistir de"} esta carta?</div><button type="button" data-sim="1">👍 Sim</button><button type="button" data-sim="0">👎 Não</button>`;
  box.querySelectorAll("[data-sim]").forEach((b) =>
    b.addEventListener("click", () => {
      box.remove();
      if (rede && rede.votacao && rede.hostEu) redeVotar(rede.hostEu, rede.votacao.id, b.dataset.sim === "1");
    }),
  );
  document.body.appendChild(box);
}
// Botões Descartar/Desistir da tela do host: com gente na sala, viram votação.
function redeVotacaoTalvez(tipo) {
  if (!redeVotacaoPrecisa()) return false;
  const mid = jogadorIdDe(mestreIndex);
  return redeVotacaoAbrir(tipo, mid) || true;
}

/* =====================  CONVIDADO  ===================== */
const REDE_EU_KEY = "perfil5_rede_eu_"; // + sala: o jogador que este aparelho escolheu
function redeEntrarSala(sala, transporteFabrica) {
  if (!redeSalaValida(sala)) return false;
  if (rede) redeFechar();
  const fab = typeof transporteFabrica === "function" ? transporteFabrica : redeFabrica(redeModoDoEndereco(), "convidado");
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
    painel: null, // { revisao, opcoes }
    lugares: [],
    motivo: null,
    versaoHost: null,
    pendentes: {}, // commandId → { msg, tentativas, quando }
    respostas: {}, // commandId → resultado
    votei: {},
    hostSessao: null, // sessão do host (mudou: outro aparelho assumiu; me apresento de novo)
    ultimoHost: Date.now(), // última notícia do host
    recuperacao: null, // pacote de recuperação (só se eu for o sucessor)
    assumindo: false,
    relogio: { dif: 0, atraso: Infinity, amostras: 0 },
    aoMudar: null,
  };
  redeTelaAcesa(true);
  const oi = () => redeEnviar("oi", { jogadorId: rede.eu, chave: rede.chave, versao: JOGO_VERSAO });
  rede.oi = oi;
  transporte.aoReceber((bruto) => {
    const m = redeValidar(bruto);
    if (m) redeConvidadoReceber(m);
  });
  // a conexão voltou (internet): se apresenta de novo pro host
  transporte.aoAbrir = () => rede && rede.papel === "convidado" && oi();
  transporte.aoEstado = () => rede && typeof rede.aoMudar === "function" && rede.aoMudar("conexao");
  oi();
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
    if (rede.estado === "entrando" && n % 6 === 0) oi();
    redeReenviar();
  }, 500);
  return true;
}
function redeConvidadoReceber(m) {
  rede.ultimoHost = Date.now();
  if (rede.hostSessao && m.de !== rede.hostSessao) {
    // outro aparelho virou host da sala: me apresento de novo pra ele
    rede.hostSessao = m.de;
    rede.ultimoSeq = { [m.de]: rede.ultimoSeq[m.de] || 0 };
    if (rede.estado === "dentro") rede.oi();
  } else if (!rede.hostSessao) rede.hostSessao = m.de;
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
    if (["lugar_ocupado", "sem_partida", "versao_diferente"].includes(m.motivo)) {
      rede.estado = "recusado";
      rede.motivo = m.motivo;
      rede.versaoHost = m.versao || null;
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
    // o pacote de recuperação só fica com quem é o sucessor agora
    if (rede.recuperacao && r.sucessor !== rede.eu) rede.recuperacao = null;
    return avisar();
  }
  if (m.t === "painel") {
    if (rede.painel && m.revisao < rede.painel.revisao) return;
    rede.painel = { revisao: m.revisao, opcoes: m.opcoes };
    return avisar();
  }
  if (m.t === "recuperacao") {
    // só guarda se o retrato mais recente diz que eu sou o sucessor (mensagem fora de ordem não fica)
    if (rede.retrato && rede.retrato.sucessor === rede.eu) rede.recuperacao = { estado: m.estado, revisao: m.revisao, matchId: m.matchId };
    return;
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
// O host caiu e eu sou o sucessor: guardo a partida do pacote e recarrego como host da mesma sala.
function redeAssumir() {
  if (!rede || rede.papel !== "convidado" || !rede.recuperacao || rede.assumindo) return false;
  rede.assumindo = true;
  const sala = rede.sala, modo = rede.transporte.tipo === "local" ? "local" : "internet";
  const antigo = (rede.retrato && rede.retrato.hostNome) || "host";
  try {
    caosLog("rede", "o host sumiu: este aparelho assume a sala " + sala);
  } catch (e) {}
  try {
    JFStore.setItem("perfil200_state", rede.recuperacao.estado);
    JFStore.setItem(REDE_HOST_KEY, JSON.stringify({ sala, modo, eu: rede.eu, quando: Date.now(), assumiu: true, antigo }));
  } catch (e) {}
  const ir = () => {
    try {
      clearInterval(rede.pingTimer);
      rede.transporte.fechar();
    } catch (e) {}
    try {
      window.history.replaceState(null, "", String(location.href).split("#")[0]);
    } catch (e) {}
    location.reload();
  };
  try {
    const f = JFStore.flushNow && JFStore.flushNow();
    if (f && typeof f.then === "function") f.then(ir, ir);
    else ir();
  } catch (e) {
    ir();
  }
  redeConvidadoDesenhar();
  return true;
}
// Escolher quem eu sou na sala.
function redeEscolherLugar(jid) {
  if (!rede || rede.papel !== "convidado" || !jogadorIdValido(jid)) return false;
  rede.eu = jid;
  rede.estado = "entrando";
  return redeEnviar("oi", { jogadorId: jid, chave: rede.chave, versao: JOGO_VERSAO });
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
function redeVotarConvidado(sim) {
  const v = rede && rede.retrato && rede.retrato.votacao;
  if (!v || rede.votei[v.id] !== undefined) return false;
  rede.votei[v.id] = !!sim;
  return redeEnviar("voto", { votacao: v.id, sim: !!sim });
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
// O que este convidado é agora.
function redeMeuPapel() {
  const r = rede && rede.retrato;
  if (!r || !rede.eu) return { mestre: false, vez: false };
  return { mestre: r.mestreId === rede.eu, vez: r.vezId === rede.eu };
}

/* --- Tela do convidado: o retrato (como o telão) e os botões do meu painel --- */
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
    box.innerHTML = `<div class="telao-espera">Este navegador não consegue entrar na sala${redeModoDoEndereco() === "internet" ? " pela internet" : ""}.</div>${REDE_SAIR}`;
    return;
  }
  rede.aoMudar = () => redeConvidadoDesenhar();
  redeConvidadoDesenhar();
  telaoRelogioTimer = setInterval(() => {
    telaoRelogio();
    redeConvidadoTiques();
  }, 500);
}
const REDE_SAIR =
  '<button type="button" class="rede-como" onclick="openTutorial(\'manual:online\')">❓ Como funciona o online</button><button type="button" class="telao-sair" onclick="redeSairDaSala()">✕ Sair da sala</button>';
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
  versao_diferente: "Seu jogo está numa versão diferente da do host.",
  sem_permissao: "Isso não é com você agora.",
  fora_de_hora: "Agora não dá.",
  revisao_obsoleta: "A partida andou enquanto você tocava. Tente de novo.",
  sem_resposta: "O host não respondeu. Confira a conexão.",
  votacao: "Pedido enviado: a mesa vai votar.",
};
const REDE_CONEXAO = {
  conectando: "🔌 Conectando…",
  sem_sala: "🔎 Procurando a sala… (o host está com ela aberta?)",
  reconectando: "🔌 A conexão caiu. Reconectando…",
  erro: "⚠️ Sem conexão com o servidor da sala. Tentando de novo…",
};
// A cada meio segundo: contagem do intervalo e da votação (sem redesenhar a tela toda).
function redeConvidadoTiques() {
  if (!rede || !rede.retrato) return;
  // o host sumiu: se eu sou o sucessor (e tenho o pacote), assumo; senão, aviso e espero
  const sumiu = rede.estado === "dentro" && Date.now() - rede.ultimoHost > REDE_HOST_SUMIU_MS;
  if (sumiu && !rede.assumindo && rede.retrato.sucessor === rede.eu && rede.recuperacao) return redeAssumir();
  if (rede.recuperacao && rede.retrato.sucessor !== rede.eu) rede.recuperacao = null;
  // sem notícia do host: a cada 10 s, força uma conexão nova (o novo host pode já estar na sala)
  if (sumiu && typeof rede.transporte.reconectar === "function" && Date.now() - (rede.ultimaReconexao || 0) > 10000) {
    rede.ultimaReconexao = Date.now();
    rede.transporte.reconectar();
  }
  const aviso = rede.estado === "dentro" && Date.now() - rede.ultimoHost > 8000;
  if (aviso !== !!rede.avisoSumiu) {
    rede.avisoSumiu = aviso;
    redeConvidadoDesenhar();
  }
  const r = rede.retrato;
  const s = (ate) => Math.max(0, Math.ceil((ate - redeAgora()) / 1000));
  const iv = document.getElementById("redeIntervaloSeg");
  if (iv && r.intervalo) iv.textContent = s(r.intervalo);
  const vs = document.getElementById("redeVotoSeg");
  if (vs && r.votacao) vs.textContent = s(r.votacao.ate);
}
function redeConvidadoDesenhar() {
  const box = document.getElementById("telao");
  if (!box || !rede) return;
  const t = rede.transporte || {};
  let conexao = t.estado && t.estado !== "aberta" && REDE_CONEXAO[t.estado] ? `<div class="rede-conexao">${REDE_CONEXAO[t.estado]}</div>` : "";
  if (rede.assumindo) conexao = `<div class="rede-conexao">👑 O host caiu: este aparelho está assumindo a sala…</div>`;
  else if (rede.avisoSumiu && rede.retrato) {
    const suc = rede.retrato.sucessor && rede.retrato.jogadores.find((j) => j.id === rede.retrato.sucessor);
    conexao = `<div class="rede-conexao">🔌 Sem notícia do host…${suc ? ` Se ele não voltar, ${escapeHtml(suc.nome)} assume a sala.` : ""}</div>`;
  }
  const sala = `<div class="rede-sala">🌐 Sala <b>${rede.sala}</b></div>${conexao}`;
  if (rede.estado === "escolhendo") {
    const l = rede.lugares
      .map((p) => `<button type="button" class="rede-lugar" data-id="${escapeHtml(p.id)}">${escapeHtml((p.avatar ? p.avatar + " " : "") + p.nome)}</button>`)
      .join("");
    const vazio = "<small>O host ainda está cadastrando os jogadores. Seu nome aparece aqui assim que ele cadastrar.</small>";
    box.innerHTML = `${sala}<div class="telao-espera">Quem é você?<div class="rede-lugares">${l || vazio}</div></div>${REDE_SAIR}`;
    box.querySelectorAll(".rede-lugar").forEach((b) => b.addEventListener("click", () => redeEscolherLugar(b.dataset.id)));
    return;
  }
  if (rede.estado === "recusado") {
    const ver =
      rede.motivo === "versao_diferente"
        ? `<br><small>Host: Beta ${escapeHtml(rede.versaoHost || "?")} · Você: Beta ${escapeHtml(JOGO_VERSAO)}. Recarregue a página pra atualizar.</small>`
        : "";
    box.innerHTML = `${sala}<div class="telao-espera">${escapeHtml(REDE_MOTIVOS[rede.motivo] || "Não deu pra entrar.")}${ver}<br><button type="button" class="rede-lugar" id="redeDeNovo">${rede.motivo === "versao_diferente" ? "🔄 Recarregar" : "Tentar de novo"}</button></div>${REDE_SAIR}`;
    box.querySelector("#redeDeNovo").addEventListener("click", () => {
      if (rede.motivo === "versao_diferente") return location.reload();
      rede.estado = "entrando";
      rede.oi();
    });
    return;
  }
  if (rede.estado !== "dentro" || !rede.retrato) {
    box.innerHTML = `${sala}<div class="telao-espera">Entrando na sala…</div>${REDE_SAIR}`;
    return;
  }
  // 1.7.9.4: sala aberta antes da partida: espera o host terminar o cadastro e começar
  if (!rede.retrato.iniciada) {
    const r = rede.retrato, eu = r.jogadores.find((j) => j.id === rede.eu);
    const mesa = r.jogadores.map((j) => `<li>${escapeHtml((j.avatar ? j.avatar + " " : "") + j.nome)}${j.id === rede.eu ? " · você" : ""}</li>`).join("");
    box.innerHTML = `${sala}<div class="telao-espera">✅ Você é <b>${escapeHtml(eu ? (eu.avatar ? eu.avatar + " " : "") + eu.nome : "?")}</b><br><small>Esperando o host terminar o cadastro e começar a partida…</small></div><ul class="rede-lista">${mesa}</ul>${REDE_SAIR}`;
    return;
  }
  telaoUltimo = rede.retrato;
  telaoDesenhar(rede.retrato);
  // troca o "sair do telão" pelo "sair da sala" e põe a sala e os botões do meu papel
  const sair = box.querySelector(".telao-sair");
  if (sair) sair.outerHTML = REDE_SAIR;
  box.insertAdjacentHTML("afterbegin", sala);
  // 1.7.9.5 (relato do JF: "ela fica na sala TV, não tem nada pra acontecer"): quem é o Mestre vê a carta
  // como na tela de sempre, no lugar do resumo do telão
  if (redeMestreCartaMontar(box)) return redeConvidadoTiques();
  const barra = document.createElement("section");
  barra.className = "rede-barra";
  barra.innerHTML = redeBotoesHtml();
  const topo = box.querySelector(".telao-vez");
  if (topo) topo.after(barra);
  else box.appendChild(barra);
  barra.querySelectorAll("[data-op]").forEach((b) =>
    b.addEventListener("click", () => {
      const o = rede.painel && rede.painel.opcoes[+b.dataset.op];
      if (o) redeMandar(o.a, ...o.d);
    }),
  );
  barra.querySelectorAll("[data-aba-rede]").forEach((b) =>
    b.addEventListener("click", () => {
      rede.abaLobby = b.dataset.abaRede;
      redeConvidadoDesenhar();
    }),
  );
  barra.querySelectorAll(".lp-barra[data-ate]").forEach((x) => (x.style.width = x.dataset.ate + "%"));
  barra.querySelectorAll("[data-dica]").forEach((b) => b.addEventListener("click", () => redeMandar("escolherDica", +b.dataset.dica)));
  barra.querySelectorAll("[data-voto]").forEach((b) => b.addEventListener("click", () => redeVotarConvidado(b.dataset.voto === "1") && redeConvidadoDesenhar()));
  redeConvidadoTiques();
}
/* --- 1.7.9.5 · A carta do Mestre no celular dele, com a cara da tela de sempre ---
   Mesmas classes da carta do jogo (.card, .answer-header, .clue-list, .number-grid, .btn-correct…); os
   botões são os do painel que o host calculou (nada de regra aqui). Votação, intervalo e fim ficam no
   resumo de sempre. */
const REDE_CLASSE_BOTAO = (o) =>
  o.a === "acertou" || o.a === "palpiteAcertou" ? "btn-correct" :
  o.a === "errou" ? (o.d[0] === "pular" ? "btn-pular" : o.d[0] === "absurdo" ? "btn-absurdo" : "btn-wrong") :
  o.a === "palpiteErrou" ? "btn-wrong" :
  o.a === "virarCarta" ? "flip-btn" :
  o.a === "sacarCarta" ? "main-btn btn-draw" :
  o.a === "descartarCarta" || o.a === "desistirCarta" ? "discard-btn" :
  o.g === "Mais" ? "rede-btn" : "continue-btn";
function redeMestreCartaMontar(box) {
  const r = rede.retrato, papel = redeMeuPapel(), c = r.carta;
  if (!papel.mestre || r.fim || r.intervalo || r.votacao || (r.relogio && r.relogio.pausado)) return false;
  if (!["none", "hidden", "revealed"].includes(r.estadoCarta)) return false;
  const ops = (rede.painel && rede.painel.opcoes) || [];
  const nome = (id) => {
    const j = r.jogadores.find((p) => p.id === id);
    return j ? escapeHtml((j.avatar ? j.avatar + " " : "") + j.nome) : "—";
  };
  const botao = (o, i) => `<button type="button" class="${REDE_CLASSE_BOTAO(o)}" data-op="${i}">${escapeHtml(o.t)}</button>`;
  const grupo = (f) => ops.map((o, i) => (f(o) ? botao(o, i) : "")).join("");
  const mais = grupo((o) => o.g === "Mais");
  let h = "";
  if (r.estadoCarta !== "revealed" || !c) {
    const virar = grupo((o) => o.a === "virarCarta" || o.a === "sacarCarta");
    h = `<div class="card face-down rede-carta-mestre"><div class="verso-frase">Você sabe dizer quem sou?!</div><div class="mestre-da-vez">Mestre da rodada: <b>você</b></div><div>Vire a carta quando estiver pronto.</div>${virar}</div>`;
  } else {
    const cat = typeof gemCategoryFor === "function" ? gemCategoryFor(c.categoria) : c.categoria;
    const cor = (GEM_INFO[cat] || {}).color || "#e94560";
    const resp = rede.segredo && rede.segredo.resposta ? escapeHtml(rede.segredo.resposta) : "…";
    const livre = !c.abertas.length || Date.now() < (rede.verRespostaAte || 0);
    const dicas = c.abertas
      .map((d) => (d.tipo === "special" ? `<li class="special">${d.pos + 1}. ⭐ ${escapeHtml(d.texto)}</li>` : `<li><span class="clue-num">${d.pos + 1}.</span>${escapeHtml(d.texto)}</li>`))
      .join("");
    let controles = "";
    const pend = c.pendente === null || c.pendente === undefined ? null : c.abertas.find((d) => d.pos === c.pendente);
    if (pend) {
      const especial = grupo((o) => o.g !== "Mais" && !["acertou", "errou", "palpiteAcertou", "palpiteErrou"].includes(o.a));
      controles = `<div class="pending-box spotlight-box"><span class="pending-num">Dica ${pend.pos + 1}:</span> ${pend.tipo === "special" ? "⭐ " : ""}${escapeHtml(pend.texto)}</div>
        <div class="guess-btns" style="flex-direction:column;">${grupo((o) => o.a === "acertou")}${grupo((o) => o.a === "errou" && !o.d.length)}<div class="mesa-btns">${grupo((o) => o.a === "errou" && o.d.length)}</div></div>
        ${especial}${grupo((o) => o.a === "palpiteAcertou" || o.a === "palpiteErrou")}`;
    } else {
      const abertas = new Set(c.abertas.map((d) => d.pos));
      let grade = "";
      for (let i = 0; i < c.totalDicas; i++) grade += `<button type="button" class="number-btn${abertas.has(i) ? " aberta" : ""}" data-dica="${i}"${abertas.has(i) ? ' aria-disabled="true"' : ""}>${i + 1}</button>`;
      controles = `<div class="pick-label">${nome(r.vezId)}, escolha uma dica (${c.totalDicas - c.abertas.length} restantes)</div><div class="number-grid">${grade}</div>`;
    }
    h = `<div class="card rede-carta-mestre" style="--card-glow:${cor}">
      <div class="answer-header cat-neon" style="--cat:${cor};"><span class="cat-selo">${CAT_SELO_ICONE[cat] || "🃏"} ${escapeHtml((GEM_INFO[cat] || {}).name || cat)}</span>Diga aos jogadores: "Eu sou ${formatLabelUppercase(CATEGORY_LABELS[cat] || escapeHtml(cat))}."</div>
      <button type="button" id="redeResp" class="answer-line-name answer-toggle${livre ? " open" : ""}">${livre ? "🔒 " + resp : "👁️ Toque pra ver a resposta"}</button>
      <div class="clue-history${pend ? " blurred" : ""}"><div class="turn-info"><span class="mestre-tag">🎙️ Mestre: você</span><span class="responder-tag">👉 Vez de: ${nome(r.vezId)}</span></div><ul class="clue-list">${dicas || "<li>Nenhuma dica aberta ainda</li>"}</ul></div>
      ${controles}
      ${grupo((o) => o.a === "descartarCarta" || o.a === "desistirCarta")}
    </div>`;
  }
  const ult = Object.values(rede.respostas).slice(-1)[0];
  const aviso = ult && (!ult.ok || ult.motivo === "votacao") && REDE_MOTIVOS[ult.motivo] ? `<div class="rede-aviso">${escapeHtml(REDE_MOTIVOS[ult.motivo])}</div>` : "";
  const sec = document.createElement("section");
  sec.className = "rede-mestre";
  sec.innerHTML = h + aviso + (mais ? `<div class="rede-acoes rede-mais">${grupo((o) => o.g === "Mais" && o.a !== "descartarCarta" && o.a !== "desistirCarta")}</div>` : "");
  const resumo = box.querySelector(".telao-carta");
  if (resumo) resumo.replaceWith(sec);
  else (box.querySelector(".telao-vez") || box.firstChild).after(sec);
  sec.querySelectorAll("[data-op]").forEach((b) =>
    b.addEventListener("click", () => {
      const o = ops[+b.dataset.op];
      if (o) redeMandar(o.a, ...o.d);
    }),
  );
  sec.querySelectorAll(".number-btn[data-dica]:not(.aberta)").forEach((b) => b.addEventListener("click", () => redeMandar("escolherDica", +b.dataset.dica)));
  const rb = sec.querySelector("#redeResp");
  if (rb)
    rb.addEventListener("click", () => {
      rede.verRespostaAte = Date.now() < (rede.verRespostaAte || 0) ? 0 : Date.now() + 3000;
      redeConvidadoDesenhar();
      setTimeout(() => rede && redeConvidadoDesenhar(), 3100);
    });
  return true;
}
function redeBotoesHtml() {
  const r = rede.retrato, eu = r.jogadores.find((j) => j.id === rede.eu);
  const papel = redeMeuPapel();
  let h = `<div class="rede-eu">Você é <b>${escapeHtml(eu ? (eu.avatar ? eu.avatar + " " : "") + eu.nome : "?")}</b>${papel.mestre ? " · 🎙️ Mestre" : papel.vez ? " · 👉 sua vez" : ""}</div>`;
  if (r.fim) return h;
  if (r.intervalo) {
    // 1.7.9.11: o placar do intervalo no celular de cada um (Pontos e Joias; o tabuleiro está logo abaixo)
    h += `<div class="rede-intervalo">⏸️ Intervalo entre as cartas. O host segue em <b id="redeIntervaloSeg">…</b> s.</div>`;
    try {
      const ctx = lobbyContextoDoRetrato(r);
      const abas = ["pontos"].concat(ctx.temJoias ? ["joias"] : []);
      const aba = abas.includes(rede.abaLobby) ? rede.abaLobby : r.vitoria === "joias" && ctx.temJoias ? "joias" : "pontos";
      h += `<div class="lb-abas rede-lobby-abas">${abas.map((a) => `<button type="button" class="lb-aba${a === aba ? " on" : ""}" data-aba-rede="${a}">${LOBBY_ABAS[a].ic} ${LOBBY_ABAS[a].nome}</button>`).join("")}</div>`;
      h += `<div class="rede-lobby">${aba === "joias" ? lobbyJoiasHtml(null, ctx) : lobbyPontosHtml(null, ctx)}</div>`;
    } catch (e) {}
  }
  const v = r.votacao;
  if (v) {
    const ja = rede.votei[v.id] !== undefined || (v.votaram || []).includes(rede.eu);
    const quem = (r.jogadores.find((j) => j.id === v.pedidoPor) || { nome: "O Mestre" }).nome;
    h += `<div class="rede-votacao">🗳️ ${escapeHtml(quem)} quer ${v.tipo === "descartar" ? "descartar" : "desistir de"} esta carta. <b>${v.sim}</b> sim · <b>${v.nao}</b> não · <b id="redeVotoSeg">…</b> s${ja ? "<div><small>Seu voto foi.</small></div>" : `<div class="rede-acoes"><button type="button" class="rede-btn rede-ok" data-voto="1">👍 Sim</button><button type="button" class="rede-btn rede-nao" data-voto="0">👎 Não</button></div>`}</div>`;
  }
  if (papel.mestre && rede.segredo && rede.segredo.resposta)
    h += `<div class="rede-segredo">🔒 Só você vê: <b>${escapeHtml(rede.segredo.resposta)}</b></div>`;
  const c = r.carta;
  if ((papel.vez || papel.mestre) && r.estadoCarta === "revealed" && c && (c.pendente === null || c.pendente === undefined) && !(r.relogio && r.relogio.pausado)) {
    const abertas = new Set(c.abertas.map((d) => d.pos));
    const nums = [];
    for (let i = 0; i < c.totalDicas; i++) if (!abertas.has(i)) nums.push(`<button type="button" class="rede-btn" data-dica="${i}">${i + 1}</button>`);
    if (nums.length) h += `<div class="rede-rot">Escolha uma dica:</div><div class="rede-nums">${nums.join("")}</div>`;
  }
  // os botões que o host mandou pra mim, em grupos
  const ops = (rede.painel && rede.painel.opcoes) || [];
  const grupos = [];
  ops.forEach((o, i) => {
    const g = o.g || "";
    let gr = grupos.find((x) => x.g === g);
    if (!gr) grupos.push((gr = { g, itens: [] }));
    gr.itens.push(`<button type="button" class="rede-btn${o.c ? " rede-" + escapeHtml(o.c) : ""}" data-op="${i}">${escapeHtml(o.t)}</button>`);
  });
  grupos.sort((a, b) => (a.g === "Mais") - (b.g === "Mais"));
  grupos.forEach((gr) => {
    if (gr.g) h += `<div class="rede-rot">${escapeHtml(gr.g === "Mais" ? "" : gr.g)}</div>`;
    h += `<div class="rede-acoes${gr.g === "Mais" ? " rede-mais" : ""}">${gr.itens.join("")}</div>`;
  });
  const ult = Object.values(rede.respostas).slice(-1)[0];
  const aviso = ult && (!ult.ok || ult.motivo === "votacao") && REDE_MOTIVOS[ult.motivo] ? `<div class="rede-aviso">${escapeHtml(REDE_MOTIVOS[ult.motivo])}</div>` : "";
  return h + aviso;
}

/* --- Painel do host (ADM) --- */
function redeLinkDaSala() {
  if (!rede) return "";
  const base = /^https?:/.test(location.protocol) && rede.modo === "internet" ? String(location.href).split("#")[0] : rede.modo === "internet" ? REDE_SITE : String(location.href).split("#")[0];
  return base + "#sala=" + rede.sala + (rede.modo === "local" ? "&local" : "");
}
const REDE_ESTADO_HOST = {
  conectando: "🟡 Abrindo a sala no servidor…",
  aberta: "🟢 Sala aberta",
  erro: "🔴 Não deu pra abrir a sala pela internet",
};
function redePainelHost() {
  document.getElementById("redePainel")?.remove();
  if (rede && rede.papel === "host") rede.perguntouEu = true;
  const ov = document.createElement("div");
  ov.id = "redePainel";
  ov.className = "jf-modal-bg";
  const pintar = () => {
    if (!ov.isConnected && ov._montado) return;
    if (!rede || rede.papel !== "host") {
      const temNet = redeTemInternet();
      ov.innerHTML = `<div class="jf-modal" role="dialog" aria-modal="true"><h3>🌐 Jogar online</h3><p>Abra uma sala: cada jogador entra pelo link no próprio celular, escolhe quem é e joga de lá. Este aparelho continua com a partida.</p><button type="button" class="chip" id="redeComo">❓ Como funciona (passo a passo)</button>${
        temNet ? `<button type="button" class="btn-start btn-neo neo-solid neo-still" id="redeAbrirNet" style="--mc:#22d3ee; --mc-glow:rgba(34,211,238,0.35);">Abrir sala pela internet</button>` : `<p><small>Este navegador não tem como abrir sala pela internet.</small></p>`
      }<button type="button" class="chip" id="redeAbrirLocal">Ensaio neste navegador (abas)</button><button type="button" class="chip" id="redeOk" style="margin-top:10px">Fechar</button></div>`;
      const net = ov.querySelector("#redeAbrirNet");
      if (net)
        net.addEventListener("click", () => {
          redeAbrirSala("internet");
          pintar();
        });
      ov.querySelector("#redeComo").addEventListener("click", () => {
        ov.remove();
        openTutorial("manual:online");
      });
      ov.querySelector("#redeAbrirLocal").addEventListener("click", () => {
        redeAbrirSala("local");
        pintar();
      });
    } else {
      const est = rede.transporte.estado || "aberta";
      const lugares = players
        .map((p) => {
          const s = p.id === rede.hostEu ? "📱 neste aparelho" : redeOnline(rede.assentos[p.id]) ? "🟢 na sala" : rede.assentos[p.id] ? "🟠 caiu" : "⚪ fora";
          return `<li>${escapeHtml((p.avatar ? p.avatar + " " : "") + p.name)} · ${s}</li>`;
        })
        .join("");
      const opcoesEu = `<option value="">ninguém (o aparelho é só a mesa)</option>` + players.map((p) => `<option value="${escapeHtml(p.id)}"${p.id === rede.hostEu ? " selected" : ""}>${escapeHtml(p.name)}</option>`).join("");
      const erro = est === "erro" ? `<p class="rede-aviso">${REDE_ESTADO_HOST.erro}${rede.transporte.erro ? " (" + escapeHtml(rede.transporte.erro) + ")" : ""}. Confira a internet e tente de novo, ou use o ensaio em abas.</p>` : "";
      ov.innerHTML = `<div class="jf-modal" role="dialog" aria-modal="true"><h3>🌐 Sala ${rede.sala}</h3><div class="rede-estado">${rede.modo === "local" ? "🧪 Ensaio em abas deste navegador" : REDE_ESTADO_HOST[est] || est}</div>${erro}<p>Link pra entrar:<br><code class="rede-link">${escapeHtml(redeLinkDaSala())}</code></p><button type="button" class="chip" id="redeCopiar">📋 Copiar link</button>${
        navigator.share ? '<button type="button" class="chip" id="redeCompartilhar">📤 Compartilhar</button>' : ""
      }<label class="rede-rot-eu">Quem joga neste aparelho? <select id="redeEu">${opcoesEu}</select><small>${
        players.length ? "Escolha quem está com este aparelho: a carta só aparece aqui quando essa pessoa for o Mestre (ou quando o Mestre não tiver aparelho)." : "Cadastre os jogadores depois de mandar o link: cada um escolhe o próprio nome no celular."
      }</small></label><ul class="rede-lista">${lugares}</ul>${
        rede.modo === "local" ? '<button type="button" class="chip" id="redeAbrirAba">Abrir uma aba de convidado</button>' : ""
      }<button type="button" class="chip" id="redeComoSala">❓ Como funciona</button><button type="button" class="chip" id="redeFecharSala">Fechar a sala</button><button type="button" class="chip" id="redeOk" style="margin-top:10px">Fechar</button></div>`;
      ov.querySelector("#redeCopiar").addEventListener("click", (e) => {
        try {
          navigator.clipboard.writeText(redeLinkDaSala());
          e.target.textContent = "✅ Copiado";
        } catch (x) {}
      });
      const sh = ov.querySelector("#redeCompartilhar");
      if (sh) sh.addEventListener("click", () => navigator.share({ title: "Perfil JF · Sala " + rede.sala, text: "Entra na minha sala do Perfil JF:", url: redeLinkDaSala() }).catch(() => {}));
      ov.querySelector("#redeEu").addEventListener("change", (e) => {
        rede.hostEu = jogadorIdValido(e.target.value) ? e.target.value : null;
        if (rede.hostEu) delete rede.assentos[rede.hostEu];
        redeHostGuardar();
        redeHostEsperando();
        redeHostPublicar(true);
        pintar();
      });
      const ab = ov.querySelector("#redeAbrirAba");
      if (ab) ab.addEventListener("click", () => window.open(redeLinkDaSala(), "_blank"));
      ov.querySelector("#redeComoSala").addEventListener("click", () => {
        ov.remove();
        openTutorial("manual:online");
      });
      ov.querySelector("#redeFecharSala").addEventListener("click", () => {
        redeFechar();
        pintar();
      });
    }
    ov.querySelector("#redeOk").addEventListener("click", () => ov.remove());
  };
  ov._pintar = pintar;
  pintar();
  ov._montado = true;
  document.body.appendChild(ov);
}
