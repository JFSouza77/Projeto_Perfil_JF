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
const REDE_DO_CONVIDADO = ["oi", "cmd", "ping", "tchau", "voto", "pedido"];
const REDE_DO_HOST = ["bemvindo", "escolha", "recusa", "retrato", "segredo", "resp", "pong", "painel", "recuperacao", "aguarde", "fala"];
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
// 1.7.10 · "1.7.9.9" > "1.7.9.8"? (compara número a número)
function redeVersaoMaior(a, b) {
  const x = String(a || "").split(".").map(Number), y = String(b || "").split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d > 0;
  }
  return false;
}
// 1.7.10 · O host atualizou o jogo no meio da partida: quem está com a versão velha recarrega sozinho uma vez
// (volta pro mesmo lugar). Se mesmo assim continuar diferente, fica o botão "Recarregar" com a explicação.
function redeAtualizarJunto(versaoHost) {
  if (!versaoHost || !redeVersaoMaior(versaoHost, JOGO_VERSAO)) return false;
  const marca = "perfil5_rede_atualizou";
  try {
    if (sessionStorage.getItem(marca) === versaoHost) return false;
    sessionStorage.setItem(marca, versaoHost);
  } catch (e) {
    return false;
  }
  try {
    showToastMessage(`🔄 O host atualizou o jogo (Beta ${versaoHost}). Atualizando…`, null, true);
  } catch (e) {}
  setTimeout(() => {
    if (typeof window.__REDE_RECARREGAR === "function") return window.__REDE_RECARREGAR(); // (teste)
    location.reload();
  }, 1500);
  return true;
}
let redeInsistirId = false; // reabrindo a sala depois de assumir: espera o id da sala ficar livre
let redeOuvindo = false; // a escuta das ações (acoesAoMudar) é registrada uma vez só
let rede = null; // { papel: "host" | "convidado", sala, sessao, transporte, seq, ultimoSeq: {} , ... }
// 1.7.9.9 (regra do JF): a partida teve jogador em outro aparelho = partida online. Ela não continua só neste
// aparelho quando todo mundo sai da sala (vai no save).
let partidaOnline = false;

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
let redeTrocasCodigo = 0;
function redeTrocarCodigo() {
  if (!rede || rede.papel !== "host" || ++redeTrocasCodigo > 5) return;
  const modo = rede.modo, eu = rede.hostEu, junto = rede.hostJunto || [], painel = !!document.getElementById("redePainel");
  try {
    caosLog("rede", `código ${rede.sala} já estava em uso: sorteando outro`);
  } catch (e) {}
  redeFechar();
  if (!redeAbrirSala(modo)) return;
  rede.hostEu = eu;
  rede.hostJunto = junto;
  if (painel) redePainelHost();
}
function redeCodigoSala() {
  // (teste) primeiro código forçado, pra simular código já em uso
  try {
    if (typeof window !== "undefined" && window.__REDE_SALA_TESTE && redeSalaValida(window.__REDE_SALA_TESTE)) {
      const c = window.__REDE_SALA_TESTE;
      window.__REDE_SALA_TESTE = null;
      return c;
    }
  } catch (e) {}
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
/* --- 1.7.10 · Servidor da sala nosso (Cloudflare, servidor/worker.js; decisão do JF) ---
   Apresenta os aparelhos (no lugar do servidor público do PeerJS), lista as salas da mesma rede e entrega
   a ponte TURN do Cloudflare (1.000 GB/mês grátis). Vazio = só o público, como antes. Com ele, o público
   fica de reserva: o host abre a sala nos dois, e o convidado tenta o nosso e, se não achar, o público. */
const REDE_SERVIDOR = ""; // endereço do Worker, ex.: "perfil-jf-sala.<conta>.workers.dev"
const REDE_SERVIDOR_CHAVE = "perfiljf";
const REDE_PONTE_KEY = "perfil5_rede_ponte";
let redePonte = null; // { iceServers, validade } vindo do servidor nosso
// { host, port, secure } do servidor nosso, ou null (o teste usa window.__REDE_SERVIDOR)
function redeServidorNosso() {
  const t = typeof window !== "undefined" && window.__REDE_SERVIDOR;
  if (t && t.host) return { host: t.host, port: t.port || 443, secure: t.secure !== false };
  return REDE_SERVIDOR ? { host: REDE_SERVIDOR, port: 443, secure: true } : null;
}
function redeServidorUrl(caminho) {
  const s = redeServidorNosso();
  return s ? `${s.secure ? "https" : "http"}://${s.host}:${s.port}${caminho}` : null;
}
function redePonteValida() {
  if (redePonte && redePonte.validade > Date.now() + 3600000) return redePonte;
  try {
    const p = JSON.parse(localStorage.getItem(REDE_PONTE_KEY) || "null");
    if (p && Array.isArray(p.iceServers) && p.validade > Date.now() + 3600000) return (redePonte = p);
  } catch (e) {}
  return null;
}
// Pega as credenciais da ponte (valem 24 h) antes de abrir a conexão; sem resposta em 2,5 s, segue sem.
function redePontePronta() {
  const url = redeServidorUrl("/ponte");
  if (!url || redePonteValida() || !redeTemInternet()) return Promise.resolve();
  let ctl = null;
  try {
    ctl = new AbortController();
  } catch (e) {}
  const tempo = setTimeout(() => ctl && ctl.abort(), 2500);
  return fetch(url, ctl ? { signal: ctl.signal } : {})
    .then((r) => r.json())
    .then((j) => {
      if (!j || !Array.isArray(j.iceServers) || !j.iceServers.length) return;
      redePonte = { iceServers: j.iceServers.slice(0, 4), validade: +j.validade || Date.now() + 86400000 };
      try {
        localStorage.setItem(REDE_PONTE_KEY, JSON.stringify(redePonte));
      } catch (e) {}
    })
    .catch(() => {})
    .finally(() => clearTimeout(tempo));
}
// Lista dos servidores de apresentação: o nosso primeiro (se tiver) e o público de reserva.
function redeServidores() {
  return redeServidorNosso() ? [0, 1] : [1];
}
// Configuração do PeerJS. qual = 0 (nosso) ou 1 (público; o teste aponta pra um local por __REDE_PEER_CONFIG).
function redePeerConfig(qual) {
  if (qual === undefined) qual = redeServidores()[0];
  const extra = (typeof window !== "undefined" && window.__REDE_PEER_CONFIG) || {};
  const p = redePonteValida();
  const ice = { iceServers: REDE_ICE_PROPRIOS.concat(p ? p.iceServers : [], REDE_ICE), sdpSemantics: "unified-plan" };
  const s = qual === 0 && redeServidorNosso();
  if (s) return { debug: 0, host: s.host, port: s.port, secure: s.secure, path: "/", key: REDE_SERVIDOR_CHAVE, config: extra.config || ice };
  return Object.assign({ debug: 0, config: ice }, extra);
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
  let peer = null, reserva = null, tentativas = 0, fechado = false;
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
      try {
        reserva && reserva.destroy();
      } catch (e) {}
    },
  };
  // cada convidado que chega (pelo servidor nosso ou pelo de reserva) entra pelo mesmo caminho
  const aoConectar = (c) => {
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
  };
  // 1.7.10: com o servidor nosso, a sala também abre no público (de reserva). Se um cair, o outro segura.
  const abrirReserva = () => {
    if (fechado || redeServidores().length < 2) return;
    try {
      reserva = new Peer(REDE_PEER_PREFIXO + sala.toLowerCase(), redePeerConfig(1));
    } catch (e) {
      return;
    }
    const r = reserva;
    r.on("open", () => {
      if (t.estado !== "aberta" && !fechado) {
        t.estado = "aberta";
        t.erro = null;
        redeMudouEstado(t);
      }
    });
    r.on("connection", aoConectar);
    r.on("error", (e) => {
      if ((e && e.type) === "peer-unavailable" || fechado || reserva !== r) return;
      try {
        r.destroy();
      } catch (x) {}
      setTimeout(() => reserva === r && abrirReserva(), 20000);
    });
    r.on("disconnected", () =>
      setTimeout(() => {
        try {
          if (!fechado && reserva === r && r.disconnected && !r.destroyed) r.reconnect();
        } catch (x) {}
      }, 3000)
    );
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
      // 1.7.9.8: sala recém-aberta com o código já em uso por outro grupo: sorteia outro código (nunca entra
      // na sala dos outros). A pergunta "quem está com o id" abaixo é só pra quem está voltando pra própria sala.
      if (tipo === "unavailable-id" && !fechado && rede && rede.papel === "host" && rede.transporte === t && rede.salaNova) {
        fechado = true;
        try {
          peer.destroy();
          reserva && reserva.destroy();
        } catch (x) {}
        return void setTimeout(redeTrocarCodigo, 0);
      }
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
      // o servidor nosso falhou mas a reserva está aberta: a sala segue; tenta voltar pro nosso depois
      if (reserva && reserva.open && !fechado) {
        setTimeout(() => {
          try {
            if (!fechado && peer.disconnected && !peer.destroyed) peer.reconnect();
            else if (!fechado && peer.destroyed) abrir();
          } catch (x) {}
        }, 15000);
        return;
      }
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
    peer.on("connection", aoConectar);
  };
  redePontePronta().then(() => {
    if (fechado) return;
    abrir();
    abrirReserva();
  });
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
    // 1.7.9.8: a ligação com o host é direta ou passa pela ponte (TURN)?
    async ligacao() {
      const pc = conn && conn.peerConnection;
      if (!pc || typeof pc.getStats !== "function") return null;
      try {
        const st = await pc.getStats();
        let par = null;
        st.forEach((x) => {
          if (x.type === "transport" && x.selectedCandidatePairId) par = st.get(x.selectedCandidatePairId) || par;
        });
        if (!par) st.forEach((x) => x.type === "candidate-pair" && x.state === "succeeded" && (x.nominated || x.selected) && (par = par || x));
        const loc = par && st.get(par.localCandidateId), rem = par && st.get(par.remoteCandidateId);
        if (!loc) return null;
        return loc.candidateType === "relay" || (rem && rem.candidateType === "relay") ? "ponte" : "direta";
      } catch (e) {
        return null;
      }
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
    if (fechado || !peer || peer.destroyed || (conn && conn.open)) return;
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
  // 1.7.10: com o servidor nosso, o público fica de reserva: se a sala não aparece num, tenta o outro
  const servidores = redeServidores();
  let qual = 0;
  const trocar = (ms) => {
    clearTimeout(agendado);
    try {
      peer && peer.destroy();
    } catch (e) {}
    peer = null;
    qual = (qual + 1) % servidores.length;
    agendado = setTimeout(criar, ms);
  };
  const criar = () => {
    if (fechado) return;
    let p;
    try {
      p = new Peer(undefined, redePeerConfig(servidores[qual]));
    } catch (e) {
      t.estado = "erro";
      t.erro = "peer";
      redeMudouEstado(t);
      return;
    }
    peer = p;
    p.on("open", () => peer === p && conectar());
    p.on("error", (e) => {
      if (peer !== p) return;
      const tipo = (e && e.type) || "erro";
      // a sala não existe (ainda) ou o host está recarregando: insiste devagar
      if (tipo === "peer-unavailable") t.estado = "sem_sala";
      t.erro = tipo;
      redeMudouEstado(t);
      if (servidores.length > 1 && !(conn && conn.open)) return trocar(tipo === "peer-unavailable" ? 1500 : 2500);
      tentarDeNovo(tipo === "peer-unavailable" ? 3000 : 4000);
    });
    p.on("disconnected", () => peer === p && tentarDeNovo(1500));
  };
  redePontePronta().then(criar);
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
    ping: () => typeof m.t0 === "number" && isFinite(m.t0) && (m.via === undefined || ["direta", "ponte", "local"].includes(m.via)) && (m.ms === undefined || (Number.isFinite(m.ms) && m.ms >= 0 && m.ms <= 60000)),
    tchau: () => true,
    voto: () => txt(m.votacao, 40) && typeof m.sim === "boolean",
    // 1.7.9.6: o convidado cria o próprio jogador (o host aprova e cadastra)
    pedido: () =>
      m.perfil && typeof m.perfil === "object" && txt(m.perfil.nome, 15) && typeof m.chave === "string" && /^[a-z0-9]{12,32}$/.test(m.chave) &&
      ["cor", "avatar", "humor", "idade", "faixa"].every((k) => m.perfil[k] === undefined || m.perfil[k] === null || txt(m.perfil[k], 20)),
    aguarde: () => true,
    fala: () => txt(m.texto, 240) && (m.quem === undefined || (Array.isArray(m.quem) && m.quem.length <= 8 && m.quem.every(jogadorIdValido))),
    bemvindo: () => jogadorIdValido(m.jogadorId),
    escolha: () => Array.isArray(m.lugares) && m.lugares.length <= 12 && m.lugares.every((l) => l && jogadorIdValido(l.id) && typeof l.nome === "string"),
    recusa: () => txt(m.motivo, 40) && (m.versao === undefined || txt(m.versao, 20)),
    retrato: () => m.r && typeof m.r === "object" && m.r.protocolo === RETRATO_PROTOCOLO && m.r.papel === "mesa" && Number.isInteger(m.r.revisao) && Array.isArray(m.r.jogadores),
    segredo: () => Number.isInteger(m.revisao) && (m.resposta === null || txt(m.resposta, 120)),
    resp: () => typeof m.commandId === "string" && typeof m.ok === "boolean",
    pong: () => typeof m.t0 === "number" && typeof m.th === "number" && isFinite(m.th),
    recuperacao: () =>
      txt(m.estado, REDE_MAX_LETRAS) && Number.isInteger(m.revisao) && (m.matchId === null || txt(m.matchId, 64)) &&
      (m.aprovados === undefined || (Array.isArray(m.aprovados) && m.aprovados.length <= 40 && m.aprovados.every((c) => txt(c, 32)))),
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
      JFStore.setItem(REDE_HOST_KEY, JSON.stringify({ sala: rede.sala, modo: rede.modo, eu: rede.hostEu || null, junto: rede.hostJunto || [], quando: Date.now(), aprovados: Object.keys(rede.aprovados || {}).slice(-40) }));
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
  const salaNova = !redeSalaValida(salaFixa);
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
    hostJunto: [], // 1.7.9.9: outros jogadores que dividem o aparelho do host (sem aparelho próprio)
    segredoEnviado: null,
    paineis: {},
    votacao: null,
    recEnviada: null, // revisão e sucessor do último pacote de recuperação
    recQuando: 0,
    batida: null,
    salaNova, // 1.7.9.8: sala recém-aberta (não é volta de recarga): código ocupado = sorteia outro
    esperando: {}, // 1.7.9.4: sessões na tela "Quem é você?" → a última lista mandada (a sala abre antes do cadastro)
    pedidos: {}, // 1.7.9.6: sessão → pedido de entrada esperando o host aprovar
    aprovados: {}, // 1.7.9.6: aparelhos (chave) que o host já aprovou: voltam sem pedir de novo
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
    redePedidosConferir();
    redeSozinhoConferir();
    redeHostEsperando();
    redeHostPublicar(true);
    redeCadastroInfo();
    redeSalaContar();
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
    rede.hostJunto = (Array.isArray(s.junto) ? s.junto : []).filter((id) => jogadorIdValido(id) && jogadorIdxPorId(id) >= 0 && id !== rede.hostEu);
    (Array.isArray(s.aprovados) ? s.aprovados : []).forEach((c) => typeof c === "string" && (rede.aprovados[c] = true));
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
  document.getElementById("redeSozinho")?.remove();
  redeHostVista();
  redeCadastroInfo();
  redePedidosPintar(); // 1.7.9.7: a janelinha de pedidos some junto com a sala
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
    .filter((p) => !redeOnline(rede.assentos[p.id]) && !redeNoHost(p.id))
    .map((p) => ({ id: p.id, nome: String(p.name).slice(0, 24), avatar: p.avatar || null }));
}
// 1.7.9.4 · A sala aberta antes do cadastro: quem está escolhendo recebe a lista de novo quando ela muda
// (jogador cadastrado, removido, lugar ocupado). Lugar de jogador que saiu do cadastro volta pra escolha.
function redeMandarEscolha(sessao) {
  const lugares = redeLugaresLivres();
  const cadastro = redeOpcoesCadastro();
  rede.esperando[sessao] = JSON.stringify([lugares, cadastro]);
  redeEnviar("escolha", { lugares, cadastro }, sessao);
}
// 1.7.9.6: o que o convidado pode escolher pra criar o próprio jogador (só antes da partida começar)
// 1.7.9.6 (pedido do JF): o mesmo cadastro do host, com as cores de dono (RGB do JF, degradê da Anne),
// os emojis exclusivos e as cores da zoeira
function redeOpcoesCadastro() {
  if (starterChosen || players.length >= MAX_PLAYERS) return null;
  const equipe = CURRENT_FORMAT === "equipe";
  return {
    equipe,
    cores: equipe ? [] : coresDaPaleta(),
    coresUsadas: players.map((p) => p.color),
    avatares: avatarsForMode(),
    avataresUsados: players.map((p) => p.avatar),
    humores: humorOpcoesModo().map((o) => ({ id: o.id, nome: o.label, dica: o.hint || "", cor: HUMOR_COR[o.id] || "#fbbf24" })),
    humorPadrao: CURRENT_MODE === "junior" ? "familia" : "normal",
    idades: equipe ? AGE_BRACKETS.map((b) => ({ id: b.id, nome: b.label, cor: b.cor })) : IDADE_OPCOES.map((o) => ({ id: o.id, nome: o.label, cor: o.id === "menor" ? "#22d3ee" : "#a78bfa" })),
  };
}
function redeHostEsperando() {
  if (!rede || rede.papel !== "host") return;
  if (rede.hostEu && jogadorIdxPorId(rede.hostEu) < 0) rede.hostEu = null;
  rede.hostJunto = (rede.hostJunto || []).filter((id) => jogadorIdxPorId(id) >= 0);
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
    const p = players.find((x) => x.name.toLowerCase() === sl.nome.toLowerCase() && !redeNoHost(x.id) && !redeOnline(rede.assentos[x.id]));
    if (!p) return;
    rede.assentos[p.id] = { sessao: ses, visto: Date.now(), chave: sl.chave, nome: p.name };
    delete rede.esperando[ses];
    delete rede.semLugar[ses];
    delete rede.paineis[p.id];
    redeEnviar("bemvindo", { jogadorId: p.id, matchId: matchId || null, volta: true }, ses);
  });
  const lista = JSON.stringify([redeLugaresLivres(), redeOpcoesCadastro()]);
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
  if (!redeRitmoOk(m.de)) return; // 1.7.9.7: sessão mandando demais
  const a = redeAssentoDaSessao(m.de);
  if (a) rede.assentos[a].visto = Date.now();
  if (m.t === "oi") return redeHostOi(m);
  if (m.t === "ping") {
    if (a) {
      if (m.via) rede.assentos[a].via = m.via;
      if (m.ms !== undefined) rede.assentos[a].ms = m.ms;
    }
    return redeEnviar("pong", { t0: m.t0, th: Date.now() }, m.de);
  }
  if (m.t === "tchau") {
    if (a) rede.assentos[a].visto = 0;
    delete rede.esperando[m.de];
    if (rede.pedidos[m.de]) delete rede.pedidos[m.de], redePedidosPintar();
    return;
  }
  if (m.t === "pedido") return redeHostPedidoPerfil(m);
  if (m.t === "cmd") return redeHostComando(m, a);
  if (m.t === "voto") return a && redeVotar(a, m.votacao, m.sim);
}
function redeHostOi(m) {
  if (m.versao !== JOGO_VERSAO) return redeEnviar("recusa", { motivo: "versao_diferente", versao: JOGO_VERSAO }, m.de);
  // 1.7.9.4 (pedido do JF: abrir a sala antes de cadastrar): sem jogadores ainda, quem chega fica na tela
  // "Quem é você?" e o nome aparece lá quando o host cadastrar (redeHostEsperando)
  const pedido = m.jogadorId && jogadorIdxPorId(m.jogadorId) >= 0 ? m.jogadorId : null;
  if (!pedido) return redeMandarEscolha(m.de);
  if (redeNoHost(pedido)) return redeEnviar("recusa", { motivo: "lugar_ocupado" }, m.de);
  const atual = rede.assentos[pedido];
  // o mesmo aparelho voltando (mesma chave) recupera o lugar na hora; outro só depois que ele cair
  if (atual && atual.sessao !== m.de && redeOnline(atual) && atual.chave !== m.chave) return redeEnviar("recusa", { motivo: "lugar_ocupado" }, m.de);
  // 1.7.9.6 (pedido do JF): aparelho novo só entra com o host aprovando; quem volta (mesma chave) entra direto
  if (!rede.aprovados[m.chave] && !(atual && atual.chave === m.chave)) return redePedidoNovo(m.de, { tipo: "lugar", jogadorId: pedido, chave: m.chave });
  redeAssentar(m.de, pedido, m.chave);
}
function redeAssentar(ses, pedido, chave) {
  const m = { de: ses, chave };
  const atual = rede.assentos[pedido];
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
/* --- 1.7.9.6 · Falas do C.A.O.S. nos celulares (relato do JF: ele falou com a Anne pelo aparelho do host) ---
   Toda fala que passa pelo canal (11-espinha) vai pra sala, com quem ela cita. Fala particular (ex.: o aviso
   de tempo extra do Mestre) vai só pro aparelho da pessoa e não aparece no host se ela está em outro aparelho. */
function redeHostFala(f) {
  if (!rede || rede.papel !== "host" || !f || !f.texto) return;
  const ids = (f.para || []).map((d) => d.id).filter((id) => jogadorIdValido(id));
  if (f.privado) {
    ids.forEach((id) => {
      const a = rede.assentos[id];
      if (a && redeOnline(a) && !redeNoHost(id)) redeEnviar("fala", { texto: f.texto, quem: [id] }, a.sessao);
    });
    return;
  }
  redeEnviar("fala", ids.length ? { texto: f.texto, quem: ids.slice(0, 8) } : { texto: f.texto });
}
// A fala particular é só de quem está em outro aparelho? Então não aparece aqui no host.
function redeFalaSoLonge(f) {
  if (!rede || rede.papel !== "host" || !f || !f.privado) return false;
  const ids = (f.para || []).map((d) => d.id).filter(Boolean);
  return ids.length > 0 && ids.every((id) => !redeNoHost(id) && redeOnline(rede.assentos[id]));
}
// No celular do convidado: balão da fala (e a voz, quando a fala é com ele).
function redeFalaMostrar(m) {
  rede.falas = (rede.falas || []).concat({ texto: m.texto, minha: Array.isArray(m.quem) && m.quem.includes(rede.eu) }).slice(-3);
  if (!rede.falaAtiva) redeFalaProxima();
  else if (rede.falas.length > 1) {
    // fila crescendo: encurta a fala da tela
    clearTimeout(rede.falaTimer);
    rede.falaTimer = setTimeout(redeFalaProxima, 1500);
  }
}
function redeFalaProxima() {
  const f = rede && rede.falas && rede.falas.shift();
  let el = document.getElementById("redeFala");
  if (!f) {
    if (el) el.remove();
    if (rede) rede.falaAtiva = false;
    return;
  }
  rede.falaAtiva = true;
  if (!el) {
    el = document.createElement("div");
    el.id = "redeFala";
    el.className = "rede-fala";
    el.setAttribute("aria-live", "polite");
    el.addEventListener("click", () => redeFalaProxima());
    document.body.appendChild(el);
  }
  el.classList.toggle("minha", f.minha);
  el.innerHTML = `<b>🤖 C.A.O.S.</b> ${escapeHtml(f.texto)}`;
  if (f.minha)
    try {
      caosSpeak("[C.A.O.S.] " + f.texto, "__normal");
    } catch (e) {}
  clearTimeout(rede.falaTimer);
  // com fala esperando na fila, esta fica menos tempo (o celular não fica atrasado em relação à mesa)
  const ms = Math.min(9000, Math.max(3500, f.texto.length * 70));
  rede.falaTimer = setTimeout(redeFalaProxima, rede.falas.length ? Math.min(ms, 2500) : ms);
}
/* --- 1.7.9.7 · Sala blindada: o que vem de outro aparelho é limpo e tem limite ---
   Nome criado pelo convidado: sem caracteres de HTML nem invisíveis (o nome aparece em janelas e falas do
   host). Ritmo: cada sessão manda no máximo 25 mensagens por segundo; pedido de entrada no máximo 1 a cada
   3 s e no máximo 6 esperando ao mesmo tempo; pedido sem resposta expira em 3 min. */
const REDE_RITMO_MAX = 25, REDE_PEDIDOS_MAX = 6, REDE_PEDIDO_EXPIRA_MS = 180000;
function nomeJogadorLimpo(n) {
  return String(n == null ? "" : n)
    .replace(/[<>&"'`\\]/g, "")
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u2069\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 15);
}
function redeRitmoOk(ses) {
  const agora = Date.now();
  rede.ritmo = rede.ritmo || {};
  const r = rede.ritmo[ses] && agora - rede.ritmo[ses].t < 1000 ? rede.ritmo[ses] : (rede.ritmo[ses] = { t: agora, n: 0 });
  r.n++;
  if (r.n > REDE_RITMO_MAX) {
    rede.recusadas.ritmo = (rede.recusadas.ritmo || 0) + 1;
    return false;
  }
  return true;
}
// Batida do host: pedido velho expira; partida começou → pedido de criar jogador não vale mais.
function redePedidosConferir() {
  if (!rede || rede.papel !== "host") return;
  let mudou = false;
  Object.keys(rede.pedidos).forEach((ses) => {
    const p = rede.pedidos[ses];
    const motivo = Date.now() - p.quando > REDE_PEDIDO_EXPIRA_MS ? "pedido_expirou" : starterChosen && p.tipo === "perfil" ? "partida_comecou" : "";
    if (!motivo) return;
    delete rede.pedidos[ses];
    redeEnviar("recusa", { motivo }, ses);
    mudou = true;
  });
  if (mudou) redePedidosPintar(), redeCadastroInfo();
}
/* --- 1.7.9.6 · Pedidos de entrada (pedido do JF: o host autoriza; cada um cria o próprio jogador) --- */
function redePerfilProblema(perfil, ignorarSessao) {
  const nome = nomeJogadorLimpo(perfil && perfil.nome);
  if (starterChosen) return "partida_comecou";
  const pendentes = Object.keys(rede.pedidos).filter((s) => s !== ignorarSessao && rede.pedidos[s].tipo === "perfil");
  if (players.length + pendentes.length >= MAX_PLAYERS) return "sala_cheia";
  if (nome.length < 2 || nome.length > 15) return "nome_curto";
  const igual = (n) => String(n).toLowerCase() === nome.toLowerCase();
  if (players.some((p) => igual(p.name)) || pendentes.some((s) => igual(rede.pedidos[s].perfil.nome))) return "nome_em_uso";
  return "";
}
function redeHostPedidoPerfil(m) {
  if (redeAssentoDaSessao(m.de)) return; // já está na sala
  const ant = rede.pedidos[m.de];
  if (ant && Date.now() - ant.quando < 3000) return; // um pedido a cada 3 s
  if (!ant && Object.keys(rede.pedidos).length >= REDE_PEDIDOS_MAX) return redeEnviar("recusa", { motivo: "muitos_pedidos" }, m.de);
  const prob = redePerfilProblema(m.perfil, m.de);
  if (prob) return redeEnviar("recusa", { motivo: prob }, m.de);
  const pedido = { tipo: "perfil", perfil: { ...m.perfil, nome: nomeJogadorLimpo(m.perfil.nome) }, chave: m.chave };
  if (rede.aprovados[m.chave]) return redeAprovarPedido(m.de, true, pedido);
  redePedidoNovo(m.de, pedido);
}
function redePedidoNovo(ses, pedido) {
  if (!rede.pedidos[ses] && Object.keys(rede.pedidos).length >= REDE_PEDIDOS_MAX) return redeEnviar("recusa", { motivo: "muitos_pedidos" }, ses);
  rede.pedidos[ses] = { ...pedido, quando: Date.now() };
  delete rede.esperando[ses];
  redeEnviar("aguarde", {}, ses);
  redePedidosPintar();
  redeCadastroInfo();
  try {
    vibrar("erro"); // chama a atenção de quem está com o aparelho do host
  } catch (e) {}
}
// O host aceita (ou recusa) a entrada. O perfil vira jogador do cadastro, com as mesmas travas do cadastro daqui.
function redeAprovarPedido(ses, sim, pedidoDireto) {
  if (!rede || rede.papel !== "host") return false;
  const p = pedidoDireto || rede.pedidos[ses];
  delete rede.pedidos[ses];
  redePedidosPintar();
  if (!p) return false;
  if (!sim) {
    redeEnviar("recusa", { motivo: "recusado" }, ses);
    redeCadastroInfo();
    return true;
  }
  rede.aprovados[p.chave] = true;
  redeHostGuardar();
  let pid = p.jogadorId;
  if (p.tipo === "perfil") {
    const prob = redePerfilProblema(p.perfil, ses);
    if (prob) return redeEnviar("recusa", { motivo: prob }, ses), false;
    pid = redeHostAdicionarPerfil(p.perfil);
  } else if (jogadorIdxPorId(pid) < 0 || redeNoHost(pid) || redeOnline(rede.assentos[pid])) {
    return redeMandarEscolha(ses), false;
  }
  if (!pid) return false;
  redeAssentar(ses, pid, p.chave);
  return true;
}
function redeAprovarTodos() {
  Object.keys((rede && rede.pedidos) || {}).forEach((ses) => redeAprovarPedido(ses, true));
}
function redeHostAdicionarPerfil(perfil) {
  const name = nomeJogadorLimpo(perfil.nome);
  undoTeamFormation();
  const isEquipe = CURRENT_FORMAT === "equipe";
  const usadas = new Set(players.map((p) => p.color)), usados = new Set(players.map((p) => p.avatar));
  // as mesmas regras do cadastro daqui: cor de dono só com o nome do dono (sanitizePlayerColor/Avatar)
  const cores = coresDaPaleta().filter((c) => !usadas.has(c) && (!COR_EXCLUSIVA[c] || COR_EXCLUSIVA[c].dono(name)));
  const avatares = avatarsForMode().concat(AVATAR_EXCLUSIVE).filter((a) => !usados.has(a));
  const cor = cores.includes(perfil.cor) ? perfil.cor : cores.find((c) => !COR_EXCLUSIVA[c]) || PLAYER_COLORS[0];
  const avatar = avatares.includes(perfil.avatar) ? perfil.avatar : avatares.find((a) => !AVATAR_EXCLUSIVE.includes(a)) || "😀";
  const humores = humorOpcoesModo().map((o) => o.id);
  const humor = humores.includes(perfil.humor) ? perfil.humor : CURRENT_MODE === "junior" ? "familia" : "normal";
  const faixa = isEquipe && AGE_BRACKETS.some((b) => b.id === perfil.faixa) ? perfil.faixa : null;
  const p = {
    id: jogadorIdNovo(),
    name,
    score: 0,
    position: 0,
    isBlocked: false,
    color: isEquipe ? "#888888" : sanitizePlayerColor(name, cor),
    avatar: sanitizePlayerAvatar(name, avatar),
    humor: humor === "caos" ? caosSortearHumor() : humor,
    humorCaos: humor === "caos" || void 0,
    ageBracket: faixa,
    idade: isEquipe ? (faixa ? (faixa === "crianca" ? "menor" : "maior") : null) : IDADE_OPCOES.some((o) => o.id === perfil.idade) ? perfil.idade : null,
    team: null,
    nickMs: null,
    aparelho: "celular",
  };
  players.push(p);
  try {
    caosMemCadastro(p);
  } catch (e) {}
  renderScoreboard();
  renderColorPicker();
  renderAvatarPicker();
  updateDrawAvailability();
  saveGameState();
  redeHostCadastroMudou();
  try {
    caosWelcomePlayer(p);
  } catch (e) {}
  return p.id;
}
const REDE_MOTIVO_TXT = {
  partida_comecou: "A partida já começou: escolha um nome da lista.",
  sala_cheia: "A sala já está cheia.",
  nome_curto: "O nome precisa ter de 2 a 15 letras.",
  nome_em_uso: "Já tem alguém com esse nome. Escolha outro.",
  muitos_pedidos: "Muita gente pedindo pra entrar ao mesmo tempo. Tente de novo em instantes.",
  pedido_expirou: "O pedido ficou sem resposta. Tente de novo.",
};
// Janelinha do host com os pedidos de entrada.
function redePedidosPintar() {
  let box = document.getElementById("redePedidos");
  const lista = rede && rede.papel === "host" ? Object.keys(rede.pedidos) : [];
  if (!lista.length) {
    if (box) box.remove();
    return;
  }
  if (!box) {
    box = document.createElement("div");
    box.id = "redePedidos";
    box.className = "rede-pedidos";
    box.setAttribute("role", "dialog");
    document.body.appendChild(box);
  }
  const quem = (p) =>
    p.tipo === "perfil" ? `${escapeHtml(p.perfil.avatar || "🙂")} <b>${escapeHtml(p.perfil.nome)}</b> quer entrar` : `Alguém quer entrar como <b>${escapeHtml((jogadorPorId(p.jogadorId) || {}).name || "?")}</b>`;
  box.innerHTML =
    `<div class="rede-pedidos-tit">🙋 Pedido${lista.length > 1 ? "s" : ""} pra entrar na sala ${rede.sala}</div>` +
    lista.map((ses) => `<div class="rede-pedido"><span>${quem(rede.pedidos[ses])}</span><span><button type="button" class="rede-btn rede-ok" data-sim="1" data-ses="${ses}">✅ Aceitar</button><button type="button" class="rede-btn rede-nao" data-sim="0" data-ses="${ses}">❌</button></span></div>`).join("") +
    (lista.length > 1 ? `<button type="button" class="rede-btn rede-ok" id="redeAceitarTodos">✅ Aceitar todos</button>` : "");
  box.querySelectorAll("[data-ses]").forEach((b) => b.addEventListener("click", () => redeAprovarPedido(b.dataset.ses, b.dataset.sim === "1")));
  const todos = box.querySelector("#redeAceitarTodos");
  if (todos) todos.addEventListener("click", redeAprovarTodos);
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
  if (acao === "escolherDica") return ehMestre; // 1.7.9.6 (regra do JF): só o Mestre abre as dicas; quem está na vez fala o número
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
    if (p && !redeNoHost(p.id) && redeOnline(rede.assentos[p.id])) return p.id;
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
  if (redeEnviar("recuperacao", { estado, revisao: partidaRevisao, matchId: matchId || null, aprovados: Object.keys(rede.aprovados || {}).slice(-40) }, a.sessao)) {
    rede.recEnviada = chave;
    rede.recQuando = Date.now();
  }
}
// Retrato público pra todos, o painel de cada um e a resposta só pro Mestre.
function redeHostPublicar(forcar) {
  if (!rede || rede.papel !== "host") return;
  if (!starterChosen && !forcar) return;
  if (starterChosen && !gameEnded && redeAlguemLonge()) partidaOnline = true; // 1.7.9.9: marca na hora
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
// 1.7.9.9 · Jogadores do aparelho do host: o principal (hostEu) e quem divide o aparelho com ele.
function redeNoHost(jid) {
  return !!rede && !!jid && (jid === rede.hostEu || (rede.hostJunto || []).includes(jid));
}
function redeJogadoresNoHost() {
  if (!rede) return [];
  return [rede.hostEu].concat(rede.hostJunto || []).filter((id) => id && jogadorIdxPorId(id) >= 0);
}
function redeDefinirNoHost(ids) {
  if (!rede || rede.papel !== "host") return;
  const lista = [...new Set(ids)].filter((id) => jogadorIdxPorId(id) >= 0 && !(redeOnline(rede.assentos[id]) && !redeNoHost(id)));
  rede.hostEu = lista[0] || null;
  rede.hostJunto = lista.slice(1);
  lista.forEach((id) => delete rede.assentos[id]);
  redeHostGuardar();
  redeHostEsperando();
  redeHostPublicar(true);
}
function redeMestreLonge() {
  if (!rede || rede.papel !== "host" || !starterChosen || gameEnded) return false;
  if (typeof tabLobbyFimEm === "function" && tabLobbyFimEm()) return false;
  const mid = jogadorIdDe(mestreIndex);
  return !!mid && !redeNoHost(mid) && redeOnline(rede.assentos[mid]);
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
  // 1.7.9.9: pode ter mais de um jogador neste aparelho (quem não tem celular divide o do host)
  const eus = redeJogadoresNoHost().map((id) => players[jogadorIdxPorId(id)]);
  const mestre = players[mestreIndex];
  const nome = (p) => escapeHtml((p.avatar ? p.avatar + " " : "") + p.name);
  const daVez = eus.find((p) => jogadorIdDe(responderIndex) === p.id);
  const vez = !!daVez;
  let h = `<div class="rede-eu">${eus.length ? `Neste aparelho: <b>${eus.map(nome).join("</b> e <b>")}</b>${vez ? ` · 👉 vez de ${nome(daVez)}` : ""}` : "Este aparelho é a mesa"}</div>`;
  h += `<div class="rede-segredo">🔒 A carta e a resposta estão no aparelho de <b>${mestre ? nome(mestre) : "quem é o Mestre"}</b> (Mestre da vez).</div>`;
  if (vez && cardState === "revealed" && pendingIndex === null && !pausedAt)
    h += `<div class="rede-rot">👉 Sua vez: fale um número de dica pro Mestre abrir.</div>`; // 1.7.9.6: só o Mestre abre
  const ops = [];
  eus.forEach((p) => redeOpcoes(p.id).forEach((o) => o.a !== "pausar" && ops.push({ ...o, quem: p.id })));
  if (ops.length) h += `<div class="rede-acoes">${ops.map((o, i) => `<button type="button" class="rede-btn${o.c ? " rede-" + escapeHtml(o.c) : ""}" data-op="${i}">${escapeHtml(o.t)}</button>`).join("")}</div>`;
  h += `<div class="rede-acoes rede-mais"><button type="button" class="rede-btn" id="redeVistaPausar">⏸️ Pausar</button><button type="button" class="rede-btn" id="redeVistaSala">🌐 Sala ${rede.sala}</button></div>`;
  const barra = document.createElement("section");
  barra.className = "rede-barra";
  barra.innerHTML = h;
  const topo = box.querySelector(".telao-vez");
  if (topo) topo.after(barra);
  else box.prepend(barra);
  const agir = (quem, acao, dados) => {
    if (!quem || !redePodeComandar(acao, quem)) return;
    dispatchAction({ type: acao, data: dados, commandId: "h_" + redeAleatorio(12), expectedRevision: partidaRevisao, actorId: quem });
  };
  barra.querySelectorAll("[data-op]").forEach((b) =>
    b.addEventListener("click", () => {
      const o = ops[+b.dataset.op];
      if (o) agir(o.quem, o.a, o.d);
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
  // 1.7.9.9: todos os jogadores do aparelho do host votam (quem divide o aparelho também)
  redeJogadoresNoHost().forEach((id) => !v.includes(id) && v.push(id));
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
  if (!v) return;
  // 1.7.9.9: uma linha por jogador do aparelho do host que ainda não votou
  const falta = redeJogadoresNoHost().filter((id) => v.votos[id] === undefined);
  if (!falta.length) return;
  const box = document.createElement("div");
  box.id = "redeVotoHost";
  box.className = "rede-voto-host";
  const nome = (id) => escapeHtml(((jogadorPorId(id) || {}).avatar ? jogadorPorId(id).avatar + " " : "") + ((jogadorPorId(id) || {}).name || "?"));
  box.innerHTML =
    `<div>🗳️ ${v.tipo === "descartar" ? "Descartar" : "Desistir de"} esta carta?</div>` +
    falta.map((id) => `<div class="rede-voto-linha">${falta.length > 1 ? `<span>${nome(id)}</span>` : ""}<button type="button" data-sim="1" data-quem="${escapeHtml(id)}">👍 Sim</button><button type="button" data-sim="0" data-quem="${escapeHtml(id)}">👎 Não</button></div>`).join("");
  box.querySelectorAll("[data-sim]").forEach((b) =>
    b.addEventListener("click", () => {
      if (rede && rede.votacao) redeVotar(b.dataset.quem, rede.votacao.id, b.dataset.sim === "1");
      redeVotacaoHostMostrar();
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
    if (n <= 4 || n % 10 === 0) {
      // 1.7.9.8: junto do ping vai como está a minha ligação (o host mostra no painel da sala)
      const extra = {};
      if (rede.via) extra.via = rede.via;
      if (Number.isFinite(rede.ms)) extra.ms = Math.round(rede.ms);
      redeEnviar("ping", { t0: Date.now(), ...extra });
      const t = rede.transporte;
      if (t && t.tipo === "local") rede.via = "local";
      else if (t && typeof t.ligacao === "function") t.ligacao().then((v) => rede && v && (rede.via = v));
    }
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
    rede.ms = atraso; // a última ida e volta (o selo de conexão da tela)
    return;
  }
  if (m.t === "escolha") {
    rede.estado = "escolhendo";
    rede.lugares = m.lugares.map((l) => ({ id: l.id, nome: String(l.nome).slice(0, 24), avatar: redeEmojiLimpo(l.avatar) }));
    rede.cadastro = redeCadastroLimpo(m.cadastro);
    return avisar();
  }
  if (m.t === "aguarde") {
    rede.estado = "aguardando";
    return avisar();
  }
  if (m.t === "fala") return redeFalaMostrar(m);
  if (m.t === "recusa") {
    // 1.7.9.6: problema no jogador que eu criei: volto pro formulário com o aviso
    if (REDE_MOTIVO_TXT[m.motivo]) {
      rede.estado = "escolhendo";
      rede.erroCadastro = REDE_MOTIVO_TXT[m.motivo];
      return avisar();
    }
    if (["lugar_ocupado", "sem_partida", "versao_diferente", "recusado", "removido"].includes(m.motivo)) {
      if (m.motivo === "removido") {
        rede.eu = null;
        try {
          localStorage.removeItem(REDE_EU_KEY + rede.sala);
          sessionStorage.removeItem(REDE_EU_KEY + rede.sala);
        } catch (e) {}
      }
      rede.estado = "recusado";
      rede.motivo = m.motivo;
      rede.versaoHost = m.versao || null;
      if (m.motivo === "lugar_ocupado") rede.eu = null;
      if (m.motivo === "versao_diferente") redeAtualizarJunto(rede.versaoHost);
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
    const r = redeRetratoLimpo(m.r), ant = rede.retrato;
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
    if (rede.retrato && rede.retrato.sucessor === rede.eu) rede.recuperacao = { estado: m.estado, revisao: m.revisao, matchId: m.matchId, aprovados: m.aprovados || [] };
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
    JFStore.setItem(REDE_HOST_KEY, JSON.stringify({ sala, modo, eu: rede.eu, quando: Date.now(), assumiu: true, antigo, aprovados: rede.recuperacao.aprovados || [] }));
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
  recusado: "O host não aceitou a entrada.",
  removido: "O host tirou você da sala.",
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
  const selo = rede.estado === "dentro" && rede.via && rede.via !== "local" ? `<span class="rede-selo">${rede.via === "ponte" ? "🌉 pela ponte" : "📶 direta"}${Number.isFinite(rede.ms) ? " · " + Math.round(rede.ms) + " ms" : ""}</span>` : "";
  const sala = `<div class="rede-sala">🌐 Sala <b>${rede.sala}</b>${selo}</div>${conexao}`;
  if (rede.estado === "escolhendo") return redeEscolhaDesenhar(box, sala);
  if (rede.estado === "aguardando") {
    box.innerHTML = `${sala}<div class="telao-espera">⏳ Pedido enviado<br><small>Esperando o host aceitar a sua entrada…</small></div>${REDE_SAIR}`;
    return;
  }
  if (rede.estado === "recusado") {
    const ver =
      rede.motivo === "versao_diferente"
        ? `<br><small>Host: Beta ${escapeHtml(rede.versaoHost || "?")} · Você: Beta ${escapeHtml(JOGO_VERSAO)}. ${redeVersaoMaior(JOGO_VERSAO, rede.versaoHost) ? "O jogo do host está mais velho: ele precisa recarregar o jogo dele." : "Recarregue a página pra atualizar."}</small>`
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
    const quem = (d) => (d.pedidaPor ? ` <span class="picked-by">(pedida por ${nome(d.pedidaPor)})</span>` : "");
    const dicas = c.abertas
      .map((d) => (d.tipo === "special" ? `<li class="special">${d.pos + 1}. ⭐ ${escapeHtml(d.texto)}${quem(d)}</li>` : `<li><span class="clue-num">${d.pos + 1}.</span>${escapeHtml(d.texto)}${quem(d)}</li>`))
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
      controles = `<div class="pick-label">${nome(r.vezId)} fala um número: você abre a dica (${c.totalDicas - c.abertas.length} restantes)</div><div class="number-grid">${grade}</div>`;
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
/* --- 1.7.9.7 · O que chega do host também é limpo antes de desenhar (cor só das conhecidas, emoji curto) --- */
function redeEmojiLimpo(a) {
  return typeof a === "string" && a ? a.replace(/[<>&"'`\\]/g, "").slice(0, 8) || null : null;
}
function redeCorLimpa(c, padrao) {
  return isSafeColor(c) ? c : padrao;
}
function redeRetratoLimpo(r) {
  (r.jogadores || []).forEach((j) => {
    j.cor = redeCorLimpa(j.cor, "#cccccc");
    j.avatar = redeEmojiLimpo(j.avatar);
    j.nome = String(j.nome == null ? "?" : j.nome).slice(0, 24);
  });
  return r;
}
function redeCadastroLimpo(c) {
  if (!c || typeof c !== "object") return null;
  const lista = (v) => (Array.isArray(v) ? v.slice(0, 80) : []);
  const op = (o) => ({ id: String(o && o.id).slice(0, 20), nome: String(o && o.nome).slice(0, 40), dica: String((o && o.dica) || "").slice(0, 300), cor: redeCorLimpa(o && o.cor, "#fbbf24") });
  return {
    equipe: !!c.equipe,
    cores: lista(c.cores).filter((x) => isSafeColor(x)),
    coresUsadas: lista(c.coresUsadas).filter((x) => typeof x === "string"),
    avatares: lista(c.avatares).map(redeEmojiLimpo).filter(Boolean),
    avataresUsados: lista(c.avataresUsados).map(redeEmojiLimpo).filter(Boolean),
    humores: lista(c.humores).slice(0, 8).map(op),
    humorPadrao: String(c.humorPadrao || "normal").slice(0, 20),
    idades: lista(c.idades).slice(0, 8).map(op),
  };
}
/* --- 1.7.9.6 · Entrada na sala: criar o próprio jogador (antes da partida) ou escolher um nome da lista --- */
function redeEscolhaDesenhar(box, sala) {
  const focoNome = document.activeElement && document.activeElement.id === "redeNome";
  const cad = rede.cadastro, r = (rede.rascunho = rede.rascunho || {});
  const l = (rede.lugares || [])
    .map((p) => `<button type="button" class="rede-lugar" data-id="${escapeHtml(p.id)}">${escapeHtml((p.avatar ? p.avatar + " " : "") + p.nome)}</button>`)
    .join("");
  let form = "";
  if (cad) {
    const nomeAt = String(r.nome || "").trim();
    const usadas = new Set(cad.coresUsadas || []), usados = new Set(cad.avataresUsados || []);
    const tomadaCor = (c) => usadas.has(c) || (!!COR_EXCLUSIVA[c] && !COR_EXCLUSIVA[c].dono(nomeAt));
    // emoji exclusivo do dono (😎 do JF, 👸 da Anne) entra na lista quando o nome é o dele
    const exclusivo = isJfName(nomeAt) ? "😎" : isAnneName(nomeAt) ? "👸" : null;
    const avatares = (exclusivo && !usados.has(exclusivo) ? [exclusivo] : []).concat(cad.avatares);
    // dono digitou o nome: a cor e o emoji dele já vêm marcados (o host faria o mesmo)
    const corDono = cad.cores.find((c) => COR_EXCLUSIVA[c] && COR_EXCLUSIVA[c].dono(nomeAt) && !usadas.has(c));
    if (corDono && r.donoMarcado !== nomeAt) {
      r.cor = corDono;
      if (exclusivo && !usados.has(exclusivo)) r.avatar = exclusivo;
      r.donoMarcado = nomeAt;
    }
    if (r.cor && (tomadaCor(r.cor) || !cad.cores.includes(r.cor))) r.cor = null;
    if (r.avatar && (usados.has(r.avatar) || !avatares.includes(r.avatar))) r.avatar = null;
    if (!r.humor) r.humor = cad.humorPadrao;
    const hAtual = cad.humores.find((h) => h.id === r.humor);
    const cores = cad.cores
      .map((c, i) => {
        const t = tomadaCor(c);
        const rot = (COR_EXCLUSIVA[c] ? "Cor exclusiva " + COR_EXCLUSIVA[c].de : "Cor " + (i + 1)) + (t ? " (já tem dono)" : "");
        return `<button type="button" class="color-swatch${c === r.cor ? " selected" : ""}${c === "RGB" ? " rgb-swatch" : ""}${t ? " tomada" : ""}${COR_EXCLUSIVA[c] && t && !usadas.has(c) ? " reservada" : ""}" data-cor="${escapeHtml(c)}" style="${c === "RGB" ? "" : "background:" + playerColorCss(c)}" aria-label="${escapeHtml(rot)}"${t ? ' aria-disabled="true"' : ""}></button>`;
      })
      .join("");
    const emojis = avatares
      .map((a) => `<button type="button" class="avatar-swatch${a === r.avatar ? " selected" : ""}${usados.has(a) ? " tomada" : ""}" data-av="${escapeHtml(a)}" aria-label="Emoji ${escapeHtml(a)}"${usados.has(a) ? ' aria-disabled="true"' : ""}>${escapeHtml(a)}</button>`)
      .join("");
    const humores = cad.humores
      .map((h) => `<button type="button" class="main-btn age-swatch humor-btn${h.id === r.humor ? " on" : ""}" data-humor="${escapeHtml(h.id)}" style="--hc:${escapeHtml(h.cor)};">${escapeHtml(h.nome)}</button>`)
      .join("");
    const idades = cad.idades
      .map((o) => `<button type="button" class="main-btn age-swatch ${cad.equipe ? "age-btn" : "idade-btn"}${o.id === r.idade ? " on" : ""}" data-idade="${escapeHtml(o.id)}" style="--hc:${escapeHtml(o.cor)};" aria-pressed="${o.id === r.idade}">${escapeHtml(o.nome)}</button>`)
      .join("");
    form = `<div class="rede-form">
      <div class="rede-form-tit">🙋 Crie o seu jogador</div>
      <input type="text" id="redeNome" maxlength="15" placeholder="Seu nome" aria-label="Seu nome" value="${escapeHtml(r.nome || "")}">
      ${cad.cores.length ? `<div class="rede-rot">🎨 Cor</div><div class="color-picker-row rede-paleta">${cores}</div>` : ""}
      <div class="rede-rot">😀 Emoji</div><div class="avatar-picker-row rede-paleta">${emojis}</div>
      <div class="rede-rot">🎭 Zoeira · Como o C.A.O.S. pode zoar você?</div><div class="color-picker-row rede-paleta tem-escolha">${humores}</div>
      ${hAtual && hAtual.dica ? `<div class="rede-dica-humor">${escapeHtml(hAtual.dica)}</div>` : ""}
      <div class="rede-rot">${cad.equipe ? "Faixa etária" : "Idade <small>(opcional · com menos de 12, ganha tempo extra pra ler quando for o Mestre)</small>"}</div><div class="color-picker-row rede-paleta${r.idade ? " tem-escolha" : ""}">${idades}</div>
      ${rede.erroCadastro ? `<div class="rede-aviso">${escapeHtml(rede.erroCadastro)}</div>` : ""}
      <button type="button" class="btn-start btn-neo neo-solid neo-still" id="redePedir" style="--mc:#22d3ee; --mc-glow:rgba(34,211,238,0.35);">🙋 Pedir pra entrar</button>
    </div>`;
  }
  const lista = l ? `<div class="rede-rot">${cad ? "Ou, se o host já cadastrou você:" : "Quem é você?"}</div><div class="rede-lugares">${l}</div>` : "";
  const vazio = !cad && !l ? "<small>O host ainda está montando a partida. Espere um pouquinho.</small>" : "";
  box.innerHTML = `${sala}<div class="telao-espera rede-entrada">${cad ? "" : "Quem é você?"}${form}${lista}${vazio}</div>${REDE_SAIR}`;
  box.querySelectorAll(".rede-lugar").forEach((b) => b.addEventListener("click", () => redeEscolherLugar(b.dataset.id)));
  const nome = box.querySelector("#redeNome");
  if (nome) {
    // trocar o nome pode destravar a cor e o emoji de dono: redesenha só quando isso muda
    const dono = (n) => (isJfName(n) ? "jf" : isAnneName(n) ? "anne" : "");
    nome.addEventListener("input", () => {
      const antes = dono(String(r.nome || "").trim());
      r.nome = nome.value;
      if (dono(String(r.nome).trim()) !== antes) redeEscolhaDesenhar(box, sala);
    });
    if (focoNome) {
      nome.focus();
      nome.setSelectionRange(nome.value.length, nome.value.length);
    }
  }
  const marcar = (attr, campo) =>
    box.querySelectorAll(`[data-${attr}]`).forEach((b) =>
      b.addEventListener("click", () => {
        if (b.classList.contains("tomada")) {
          rede.erroCadastro = campo === "cor" && COR_EXCLUSIVA[b.dataset[attr]] ? `Essa é a cor exclusiva ${COR_EXCLUSIVA[b.dataset[attr]].de}.` : "Esse já tem dono. Escolha outro.";
        } else {
          rede.erroCadastro = null;
          r[campo] = r[campo] === b.dataset[attr] && campo === "idade" ? null : b.dataset[attr];
        }
        redeEscolhaDesenhar(box, sala);
      }),
    );
  marcar("cor", "cor");
  marcar("av", "avatar");
  marcar("humor", "humor");
  marcar("idade", "idade");
  const pedir = box.querySelector("#redePedir");
  if (pedir) pedir.addEventListener("click", () => redePedirEntrada());
}
function redePedirEntrada(perfil) {
  if (!rede || rede.papel !== "convidado") return false;
  const r = perfil || rede.rascunho || {};
  const nome = nomeJogadorLimpo(r.nome);
  if (nome.length < 2 || nome.length > 15) {
    rede.erroCadastro = REDE_MOTIVO_TXT.nome_curto;
    redeConvidadoDesenhar();
    return false;
  }
  rede.erroCadastro = null;
  const cad = rede.cadastro || {};
  const p = { nome, cor: r.cor || null, avatar: r.avatar || null, humor: r.humor || null };
  if (cad.equipe) p.faixa = r.idade || null;
  else p.idade = r.idade || null;
  redeEnviar("pedido", { perfil: p, chave: rede.chave });
  rede.estado = "aguardando";
  redeConvidadoDesenhar();
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
  if (papel.vez && !papel.mestre && r.estadoCarta === "revealed" && r.carta && (r.carta.pendente === null || r.carta.pendente === undefined))
    h += `<div class="rede-rot">👉 Sua vez: fale um número de dica pro Mestre abrir.</div>`;
  if (papel.mestre && rede.segredo && rede.segredo.resposta)
    h += `<div class="rede-segredo">🔒 Só você vê: <b>${escapeHtml(rede.segredo.resposta)}</b></div>`;
  const c = r.carta;
  if (papel.mestre && r.estadoCarta === "revealed" && c && (c.pendente === null || c.pendente === undefined) && !(r.relogio && r.relogio.pausado)) {
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
/* --- 1.7.9.6 · O caminho do online (pedido do JF): Jogar → formato → modo → "Vai jogar online?" ---
   Só pergunta depois de um toque de verdade (escolher o modo na tela), sem sala aberta e sem ninguém
   cadastrado ainda. Quem vai entrar usa o botão 🌐 Jogar online da tela inicial e digita o código. */
/* --- 1.7.9.9 · Partida online sem ninguém (regra do JF) ---
   Teve gente em outro aparelho e todo mundo saiu: 45 s pra quem caiu voltar; depois o jogo pausa e avisa;
   ninguém voltou em 2 min → a partida é encerrada (sem "continuar sozinho": quem está no aparelho do host
   pode encerrar antes ou esperar mais 2 min). App aberto de novo sem sala pra voltar → partida encerrada. */
let REDE_SOZINHO_MS = 45000, REDE_SOZINHO_FIM_MS = 120000;
try {
  if (typeof window !== "undefined" && Array.isArray(window.__REDE_SOZINHO)) [REDE_SOZINHO_MS, REDE_SOZINHO_FIM_MS] = window.__REDE_SOZINHO; // (teste)
} catch (e) {}
function redeAlguemLonge() {
  return !!rede && Object.keys(rede.assentos).some((jid) => !redeNoHost(jid) && jogadorIdxPorId(jid) >= 0 && redeOnline(rede.assentos[jid]));
}
function redeSozinhoConferir() {
  if (!rede || rede.papel !== "host") return;
  if (starterChosen && !gameEnded && redeAlguemLonge()) partidaOnline = true;
  const box = document.getElementById("redeSozinho");
  if (!partidaOnline || !starterChosen || gameEnded || redeAlguemLonge()) {
    rede.sozinhoDesde = null;
    if (box) box.remove();
    return;
  }
  const agora = Date.now();
  if (!rede.sozinhoDesde) rede.sozinhoDesde = agora;
  const passou = agora - rede.sozinhoDesde;
  if (passou < REDE_SOZINHO_MS) return;
  if (passou >= REDE_SOZINHO_MS + REDE_SOZINHO_FIM_MS) return redeEncerrarOnline("Todo mundo saiu da sala e ninguém voltou: a partida online foi encerrada.");
  if (!pausedAt) {
    try {
      pauseGame();
    } catch (e) {}
  }
  const falta = Math.ceil((REDE_SOZINHO_MS + REDE_SOZINHO_FIM_MS - passou) / 1000);
  if (box) {
    const seg = box.querySelector("#redeSozinhoSeg");
    if (seg) seg.textContent = falta;
    return;
  }
  const ov = document.createElement("div");
  ov.id = "redeSozinho";
  ov.className = "jf-modal-bg rede-sozinho";
  ov.innerHTML = `<div class="jf-modal" role="dialog" aria-modal="true"><h3>📴 Todo mundo saiu da sala</h3><p>Esta partida é <b>online</b>: os outros aparelhos saíram da sala <b>${rede.sala}</b>. Se ninguém voltar em <b id="redeSozinhoSeg">${falta}</b> s, a partida é encerrada.</p><p><small>Quem caiu é só abrir o jogo de novo (ou o link) pra voltar.</small></p><button type="button" class="chip" id="redeSozinhoEsperar">⏳ Esperar mais 2 minutos</button><button type="button" class="chip" id="redeSozinhoFim" style="margin-top:10px">🏁 Encerrar a partida agora</button></div>`;
  ov.querySelector("#redeSozinhoEsperar").addEventListener("click", () => {
    if (rede) rede.sozinhoDesde = Date.now() - REDE_SOZINHO_MS;
    redeSozinhoConferir();
  });
  ov.querySelector("#redeSozinhoFim").addEventListener("click", () => redeEncerrarOnline("A partida online foi encerrada."));
  document.body.appendChild(ov);
  try {
    caosLog("rede", "todo mundo saiu da sala: esperando voltarem");
  } catch (e) {}
}
function redeEncerrarOnline(msg) {
  document.getElementById("redeSozinho")?.remove();
  document.getElementById("redeOrfa")?.remove();
  if (!starterChosen || gameEnded) return;
  try {
    if (pausedAt && typeof resumeGame === "function") resumeGame();
  } catch (e) {}
  try {
    endGame();
  } catch (e) {}
  try {
    showToastMessage("📴 " + msg, null, true);
    caosLog("rede", msg);
  } catch (e) {}
}
// App aberto de novo com uma partida online salva e sem sala pra voltar: a partida não continua aqui.
function redePartidaOnlineOrfa() {
  if (!partidaOnline || !starterChosen || gameEnded || rede || document.getElementById("redeOrfa")) return;
  const ov = document.createElement("div");
  ov.id = "redeOrfa";
  ov.className = "jf-modal-bg";
  ov.innerHTML = `<div class="jf-modal" role="dialog" aria-modal="true"><h3>📴 A sala foi encerrada</h3><p>Esta partida era <b>online</b> e a sala não está mais aberta. Ela fica encerrada como estava, com o resultado de agora.</p><button type="button" class="btn-start btn-neo neo-solid neo-still" id="redeOrfaOk" style="--mc:#22d3ee; --mc-glow:rgba(34,211,238,0.35);">🏁 Ver o resultado</button></div>`;
  ov.querySelector("#redeOrfaOk").addEventListener("click", () => redeEncerrarOnline("A sala da partida online foi encerrada."));
  document.body.appendChild(ov);
}
function redePerguntarSalaTalvez() {
  try {
    if (rede || redeSalaDoEndereco() || players.length || starterChosen || !redeTemInternet()) return;
    if (!(navigator.userActivation && navigator.userActivation.isActive)) return;
  } catch (e) {
    return;
  }
  setTimeout(redePerguntarSala, 450);
}
function redePerguntarSala() {
  if (rede || document.getElementById("redePergunta")) return;
  const ov = document.createElement("div");
  ov.id = "redePergunta";
  ov.className = "jf-modal-bg";
  ov.innerHTML = `<div class="jf-modal" role="dialog" aria-modal="true"><h3>🌐 Vai jogar online?</h3><p>Abrindo a sala, este aparelho vira o <b>host</b> da partida. Os outros entram com o <b>código da sala</b> (ou pelo link), você aceita a entrada e cada um cria o próprio jogador no celular dele.</p><button type="button" class="btn-start btn-neo neo-solid neo-still" id="redePerguntaSim" style="--mc:#22d3ee; --mc-glow:rgba(34,211,238,0.35);">🌐 Sim, abrir a sala</button><button type="button" class="chip" id="redePerguntaNao" style="margin-top:10px">Não, todo mundo neste aparelho</button></div>`;
  ov.querySelector("#redePerguntaSim").addEventListener("click", () => {
    ov.remove();
    if (redeAbrirSala("internet")) redePainelHost();
  });
  ov.querySelector("#redePerguntaNao").addEventListener("click", () => ov.remove());
  document.body.appendChild(ov);
}
// Tela inicial: entrar numa sala digitando o código (o link continua valendo).
/* --- 1.7.10 · Salas na sua rede (servidor nosso) ---
   O host conta a sala pro servidor (nome, formato e modo, quantos jogadores); quem vai entrar vê as salas
   abertas no mesmo Wi-Fi (mesmo endereço na internet) e toca pra entrar. O host ainda precisa aceitar. */
function redeSalaContar() {
  const url = redeServidorUrl("/sala");
  if (!url || !rede || rede.papel !== "host" || rede.modo !== "internet" || !redeTemInternet()) return;
  const eu = rede.hostEu ? jogadorPorId(rede.hostEu) : null;
  const modo = (CURRENT_FORMAT === "equipe" ? "Equipe" : "Versus") + " · " + String(CURRENT_MODE || "").replace(/^./, (c) => c.toUpperCase());
  const info = JSON.stringify({ sala: rede.sala, nome: eu ? eu.name : null, modo, jogadores: players.length });
  if (info === rede.salaContada && Date.now() - (rede.salaContadaEm || 0) < 60000) return;
  rede.salaContada = info;
  rede.salaContadaEm = Date.now();
  try {
    fetch(url, { method: "POST", body: info }).catch(() => {});
  } catch (e) {}
}
function redeSalasPerto(caixa) {
  const url = redeServidorUrl("/salas");
  if (!url || !caixa || !redeTemInternet()) return;
  fetch(url)
    .then((r) => r.json())
    .then((lista) => {
      if (!caixa.isConnected || !Array.isArray(lista)) return;
      const boas = lista.filter((x) => x && redeSalaValida(String(x.sala || "")));
      if (!boas.length) {
        caixa.innerHTML = `<small>📶 Nenhuma sala aberta no seu Wi-Fi agora.</small>`;
        return;
      }
      caixa.innerHTML =
        `<div class="rede-perto-rot">📶 Salas na sua rede</div>` +
        boas
          .map((x) => {
            const quem = x.nome ? `${escapeHtml(String(x.nome))}` : "Sala";
            const det = [x.modo ? escapeHtml(String(x.modo)) : "", x.jogadores ? `${x.jogadores | 0} jogador${(x.jogadores | 0) === 1 ? "" : "es"}` : ""].filter(Boolean).join(" · ");
            return `<button type="button" class="chip rede-perto-sala" data-sala="${x.sala}"><b>${x.sala}</b> · ${quem}${det ? `<small> · ${det}</small>` : ""}</button>`;
          })
          .join("");
      caixa.querySelectorAll("[data-sala]").forEach((bt) => bt.addEventListener("click", () => redeIrPraSala(bt.dataset.sala, "internet")));
    })
    .catch(() => {
      if (caixa.isConnected) caixa.innerHTML = "";
    });
}
function redeEntrarPorCodigo() {
  document.getElementById("redeCodigoJanela")?.remove();
  const ov = document.createElement("div");
  ov.id = "redeCodigoJanela";
  ov.className = "jf-modal-bg";
  ov.innerHTML = `<div class="jf-modal" role="dialog" aria-modal="true"><h3>🌐 Jogar online</h3><p><b>Entrar numa sala:</b> digite o código que aparece no aparelho do host.</p><input type="text" id="redeCodigoIn" class="rede-codigo-in" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD" aria-label="Código da sala"><div class="rede-aviso" id="redeCodigoErro" style="display:none"></div><button type="button" class="btn-start btn-neo neo-solid neo-still" id="redeCodigoIr" style="--mc:#22d3ee; --mc-glow:rgba(34,211,238,0.35);">Entrar na sala</button><div class="rede-perto" id="redeSalasPerto"></div><p style="margin-top:12px"><small>Pra <b>abrir</b> uma sala: toque em <b>Jogar</b>, escolha o formato e o modo e responda <b>Sim</b> em "Vai jogar online?".</small></p><button type="button" class="chip" id="redeCodigoComo">❓ Como funciona</button><button type="button" class="chip" id="redeCodigoFechar" style="margin-top:10px">Fechar</button></div>`;
  const inp = ov.querySelector("#redeCodigoIn"), erro = ov.querySelector("#redeCodigoErro");
  inp.addEventListener("input", () => {
    inp.value = inp.value.toUpperCase().replace(/[^A-HJ-NP-Z]/g, "").slice(0, 4); // o código não usa I nem O
  });
  const ir = () => {
    const c = inp.value.trim().toUpperCase();
    if (!redeSalaValida(c)) {
      erro.textContent = "O código tem 4 letras, como aparece no aparelho do host.";
      erro.style.display = "";
      return;
    }
    if (!redeTemInternet()) {
      erro.textContent = "Este aparelho está sem internet.";
      erro.style.display = "";
      return;
    }
    redeIrPraSala(c, "internet");
  };
  ov.querySelector("#redeCodigoIr").addEventListener("click", ir);
  inp.addEventListener("keydown", (e) => e.key === "Enter" && ir());
  ov.querySelector("#redeCodigoComo").addEventListener("click", () => {
    ov.remove();
    openTutorial("manual:online");
  });
  ov.querySelector("#redeCodigoFechar").addEventListener("click", () => ov.remove());
  document.body.appendChild(ov);
  redeSalasPerto(ov.querySelector("#redeSalasPerto"));
  setTimeout(() => inp.focus(), 50);
}
/* --- 1.7.9.8 · Sala de perto: QR Code, selo de conexão e tirar da sala --- */
// QR Code do link da sala (biblioteca 5m, embutida): quem está perto aponta a câmera e entra.
function redeQrHtml(link) {
  try {
    if (typeof qrcode !== "function" || !link) return "";
    const qr = qrcode(0, "M");
    qr.addData(link);
    qr.make();
    return `<div class="rede-qr" aria-label="QR Code do link da sala">${qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true })}</div><div class="rede-qr-rot">📷 Quem está perto: aponte a câmera do celular</div>`;
  } catch (e) {
    return "";
  }
}
// "📶 direta · 40 ms" ou "🌉 pela ponte · 120 ms" (o convidado conta no ping)
function redeSeloConexao(a) {
  if (!a || !a.via) return "";
  const ms = Number.isFinite(a.ms) ? ` · ${Math.round(a.ms)} ms` : "";
  return a.via === "ponte" ? ` · 🌉 pela ponte${ms}` : a.via === "local" ? "" : ` · 📶 direta${ms}`;
}
// O host tira um aparelho da sala: o lugar fica livre e a aprovação daquele aparelho é desfeita.
function redeTirarDaSala(jid) {
  if (!rede || rede.papel !== "host") return false;
  const a = rede.assentos[jid];
  if (!a) return false;
  delete rede.assentos[jid];
  if (a.chave) delete rede.aprovados[a.chave];
  delete rede.paineis[jid];
  if (a.sessao) redeEnviar("recusa", { motivo: "removido" }, a.sessao);
  redeHostGuardar();
  redeHostPublicar(true);
  redeCadastroInfo();
  try {
    caosLog("rede", `${(jogadorPorId(jid) || {}).name || "?"} foi tirado da sala pelo host`);
  } catch (e) {}
  return true;
}
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
          const a = rede.assentos[p.id];
          const s = redeNoHost(p.id) ? "📱 neste aparelho" : redeOnline(a) ? "🟢 na sala" + redeSeloConexao(a) : a ? "🟠 caiu" : "⚪ fora";
          const tirar = a && !redeNoHost(p.id) ? ` <button type="button" class="rede-tirar" data-tirar="${escapeHtml(p.id)}" aria-label="Tirar ${escapeHtml(p.name)} da sala">✕ tirar</button>` : "";
          return `<li>${escapeHtml((p.avatar ? p.avatar + " " : "") + p.name)} · ${s}${tirar}</li>`;
        })
        .join("");
      // 1.7.9.9: quem joga neste aparelho (pode ser mais de um: quem não tem aparelho divide o do host)
      const opcoesEu = players
        .map((p) => {
          const longe = !redeNoHost(p.id) && redeOnline(rede.assentos[p.id]);
          return `<label class="rede-eu-op${longe ? " longe" : ""}"><input type="checkbox" data-eu="${escapeHtml(p.id)}"${redeNoHost(p.id) ? " checked" : ""}${longe ? " disabled" : ""}> ${escapeHtml((p.avatar ? p.avatar + " " : "") + p.name)}${longe ? " <small>(no aparelho dele)</small>" : ""}</label>`;
        })
        .join("");
      const erro = est === "erro" ? `<p class="rede-aviso">${REDE_ESTADO_HOST.erro}${rede.transporte.erro ? " (" + escapeHtml(rede.transporte.erro) + ")" : ""}. Confira a internet e tente de novo, ou use o ensaio em abas.</p>` : "";
      ov.innerHTML = `<div class="jf-modal" role="dialog" aria-modal="true"><h3>🌐 Sala ${rede.sala}</h3><div class="rede-estado">${rede.modo === "local" ? "🧪 Ensaio em abas deste navegador" : REDE_ESTADO_HOST[est] || est}</div>${erro}<div class="rede-codigo-rot">Código da sala</div><div class="rede-codigo">${rede.sala}</div>${redeQrHtml(redeLinkDaSala())}<p class="rede-rot">Quem vai jogar abre o jogo, toca em <b>🌐 Jogar online</b> e digita o código. Ou mande o link:</p><code class="rede-link">${escapeHtml(redeLinkDaSala())}</code><button type="button" class="chip" id="redeCopiar">📋 Copiar link</button>${
        navigator.share ? '<button type="button" class="chip" id="redeCompartilhar">📤 Compartilhar</button>' : ""
      }<div class="rede-rot-eu">Quem joga neste aparelho? <small>(pode marcar mais de um)</small><div class="rede-eu-lista">${opcoesEu || "<small>Ninguém cadastrado ainda.</small>"}</div><small>${
        players.length ? "Marque quem joga neste aparelho, inclusive quem não tem celular e divide este. Nenhum marcado = o aparelho é só a mesa. A carta só aparece aqui quando o Mestre é alguém daqui (ou não tem aparelho)." : "Mande o código (ou o link): cada um cria o próprio jogador no celular, e você aceita a entrada aqui. Quem joga neste aparelho você cadastra como sempre."
      }</small></div><ul class="rede-lista">${lugares}</ul>${
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
      ov.querySelectorAll("[data-eu]").forEach((cx) =>
        cx.addEventListener("change", () => {
          const marcados = [...ov.querySelectorAll("[data-eu]:checked")].map((x) => x.dataset.eu).filter(jogadorIdValido);
          redeDefinirNoHost(marcados);
          pintar();
        }),
      );
      ov.querySelectorAll("[data-tirar]").forEach((b) =>
        b.addEventListener("click", () => {
          redeTirarDaSala(b.dataset.tirar);
          pintar();
        }),
      );
      const ab = ov.querySelector("#redeAbrirAba");
      if (ab) ab.addEventListener("click", () => window.open(redeLinkDaSala(), "_blank"));
      ov.querySelector("#redeComoSala").addEventListener("click", () => {
        ov.remove();
        openTutorial("manual:online");
      });
      ov.querySelector("#redeFecharSala").addEventListener("click", () => {
        // 1.7.9.9: partida online em andamento: fechar a sala encerra a partida (não vira partida de um aparelho só)
        if (partidaOnline && starterChosen && !gameEnded) {
          caosConfirmarComVoz(
            "Esta partida é online: fechar a sala encerra a partida. Encerrar?",
            "Fechar e encerrar",
            "Cancelar",
            () => {
              redeEncerrarOnline("A sala foi fechada e a partida online foi encerrada.");
              redeFechar();
              ov.remove();
            },
          );
          return;
        }
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
