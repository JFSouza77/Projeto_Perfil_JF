/* =========================================================================================================
   1.8 · C.A.O.S. 5.2 · Guia da mesa (ideia da Elisa, partida em família de 26/10/2026)
   A mesa travou porque alguém não sabe o que fazer: ele diz quem é e o que tocar.
   · Cada fase tem um dono: sortear a carta, virar, falar a categoria (Mestre); escolher o número (quem está
     na vez); abrir a dica pedida, julgar o palpite, resolver a especial (Mestre); escolher o duelo (quem caiu
     no bônus).
   · Parou uns 12 s (25 s no julgamento, que tem conversa no meio) no tempo de jogo, sem fala dele na tela:
     ele cutuca o dono (no aparelho dele, quando é online) e o botão certo pisca.
   · Cutucou a mesma pessoa duas vezes: ele vira o guia dela. A partir daí avisa na hora, a cada vez dela,
     e comenta acerto, erro e chute absurdo. Três jogadas no ritmo seguidas e ele se despede.
   · Não entra no Express (as dicas abrem sozinhas), no Modo C.A.O.S. (tem painel próprio) nem por equipe.
   · Desliga no Inspetor do cérebro (ADM). Pausa, aviso da mesa e fala dele na tela não contam como demora.
   ========================================================================================================= */
const GUIA_KEY = "perfil_jf_caos_guia"; // "0" = desligado pelo ADM
const GUIA_ESPERA_MS = 12e3;
const GUIA_ESPERA_JULGAR_MS = 25e3;
const GUIA_GUIADO_MS = 1500; // quem está sendo guiado ouve a instrução logo
const GUIA_INTERVALO_MS = 2e4; // entre duas cutucadas de quem não está sendo guiado
const GUIA_RITMO_TCHAU = 3;
let guia = guiaNovo();
let guiaInstalado = false;

function guiaNovo() {
  return { match: null, chave: null, alvo: null, desde: 0, tick: 0, cutucou: false, ult: -1e9, lento: {}, guiando: {}, resp: null, pulso: null };
}
function guiaLigado() {
  try {
    return localStorage.getItem(GUIA_KEY) !== "0";
  } catch (e) {
    return true;
  }
}
function guiaDefinirLigado(v) {
  try {
    localStorage.setItem(GUIA_KEY, v ? "1" : "0");
  } catch (e) {}
  if (!v) guiaLimparPulso();
}
// Quem a mesa está esperando agora e o que essa pessoa tem que fazer (null = ninguém / o jogo está andando sozinho)
function guiaQuemAge() {
  if (!starterChosen || gameEnded || pausedAt || !players.length) return null;
  if (CURRENT_MODE === "caos" || CURRENT_MODE === "express" || CURRENT_FORMAT === "equipe") return null;
  if (typeof relogioParado === "function" && relogioParado()) return null;
  if (typeof avisoMesaAtivo === "function" && avisoMesaAtivo()) return null;
  if (timeoutOverlayMessage) return null;
  if (typeof tabLobbyFimEm === "function" && tabLobbyFimEm()) return null; // intervalo entre cartas: é o jogo
  if (guiaJanelaAberta()) return null; // alguém está lendo uma janela (regras, tutorial, confirmação)
  const mid = jogadorIdDe(mestreIndex);
  const r = (jid, acao, sel) => (jid ? { jid, acao, sel } : null);
  if (cardState === "bonusChoice") {
    const e = pendingBonusQueue[0];
    return e && bonusFase() === "adversario" ? r(jogadorIdDe(e.landerIdx), "bonus", "#cardArea button") : null;
  }
  if (cardState === "none") return r(mid, "sacar", "#drawBtn");
  if (cardState === "hidden") {
    if (roletaCarta !== currentCard) return r(mid, "virar", "#flipBtn");
    return roletaPousou ? r(mid, "mostrar", "#rouletteDoneBtn") : null; // roleta girando: é o jogo
  }
  if (cardState !== "revealed" || !currentCard) return null;
  if (pendingIndex === null) {
    const ped = pedidoDicaAtual();
    if (ped) return r(mid, "abrir", ".number-btn.pedida");
    return r(jogadorIdDe(responderIndex), "escolher", ".number-btn:not(.aberta)");
  }
  const item = currentCard.clues[pendingIndex];
  if (!item) return null;
  return item.type === "special" ? r(mid, "especial", "#cardArea button:not(.number-btn)") : r(mid, "julgar", "#correctBtn, #wrongBtn");
}
function guiaJanelaAberta() {
  try {
    return [...document.querySelectorAll(".caos-modal-ov, .jf-modal-bg, #tutorialOverlay")].some((el) => {
      const cs = getComputedStyle(el);
      return cs.display !== "none" && cs.visibility !== "hidden";
    });
  } catch (e) {
    return false;
  }
}
// O dono da vez está neste aparelho? (local: sempre; sala aberta: só quem joga no host)
function guiaNesteAparelho(jid) {
  if (typeof rede === "undefined" || !rede || rede.papel !== "host") return true;
  return typeof redeNoHost === "function" && redeNoHost(jid);
}
// Pro painel online: o botão do dono da vez pisca no celular dele
function guiaPulsoPara(jid) {
  return !!guia.pulso && guia.pulso === jid;
}
function guiaLimparPulso() {
  guia.pulso = null;
  try {
    document.querySelectorAll(".guia-pulso").forEach((el) => el.classList.remove("guia-pulso"));
  } catch (e) {}
}
function guiaAplicarPulso(q) {
  if (!q || !guiaNesteAparelho(q.jid)) return;
  try {
    document.querySelectorAll(q.sel).forEach((el) => {
      if (el.offsetParent !== null && !el.disabled) el.classList.add("guia-pulso");
    });
  } catch (e) {}
}
function guiaFalar(jid, banco) {
  const p = jogadorPorId(jid);
  const lista = REACTIVE_VOICE.guia && REACTIVE_VOICE.guia[banco];
  if (!p || !lista || caosSilenced) return false;
  const msg = getRandomReaction(lista, p.name);
  if (!msg) return false;
  caosLog("guia", `${p.name}: ${banco}`);
  caosFalarPara(jid, msg, true);
  return true;
}
function guiaCutucar(q) {
  const guiado = !!guia.guiando[q.jid];
  guia.cutucou = true;
  guia.ult = Date.now();
  guia.pulso = q.jid;
  guiaAplicarPulso(q);
  guiaFalar(q.jid, q.acao);
  if (!guiado) {
    guia.lento[q.jid] = (guia.lento[q.jid] || 0) + 1;
    if (guia.lento[q.jid] >= 2) {
      guia.guiando[q.jid] = { ritmo: 0 };
      guiaFalar(q.jid, "oferta");
    }
  }
  if (typeof salaOnlineAberta === "function" && salaOnlineAberta() && typeof redeHostPublicar === "function") redeHostPublicar();
}
// A situação mudou (alguém jogou): quem estava sendo guiado e jogou no ritmo conta ponto pra formatura
function guiaJogou(agora) {
  const g = guia.alvo && guia.guiando[guia.alvo];
  if (!g) return;
  const limite = guia.acao === "julgar" ? GUIA_ESPERA_JULGAR_MS : GUIA_ESPERA_MS;
  if (guia.cutucou && agora - guia.desde > limite) g.ritmo = 0;
  else if (++g.ritmo >= GUIA_RITMO_TCHAU) {
    delete guia.guiando[guia.alvo];
    guia.lento[guia.alvo] = 0;
    guiaFalar(guia.alvo, "tchau");
  }
}
function guiaTick() {
  const agora = typeof relogioJogo === "function" ? relogioJogo() : Date.now();
  const dt = Math.max(0, agora - (guia.tick || agora));
  guia.tick = agora;
  if (guia.match !== matchId) guia = Object.assign(guiaNovo(), { match: matchId, tick: agora });
  const q = guiaLigado() ? guiaQuemAge() : null;
  if (cardState === "revealed" && pendingIndex !== null) guia.resp = jogadorIdDe(responderIndex);
  if (!q) {
    if (guia.chave) guiaLimparPulso();
    guia.chave = null;
    guia.alvo = null;
    return;
  }
  const chave = q.jid + "|" + q.acao + "|" + partidaRevisao;
  if (chave !== guia.chave) {
    if (guia.chave) guiaJogou(agora);
    if (guia.pulso) guiaLimparPulso();
    Object.assign(guia, { chave, alvo: q.jid, acao: q.acao, desde: agora, cutucou: false });
    return;
  }
  // fala dele na tela: a mesa está ouvindo, não travada
  if (activeToastState) guia.desde += dt;
  if (guia.pulso) guiaAplicarPulso(q); // a tela redesenha: o brilho volta no botão novo
  if (guia.cutucou) return;
  const guiado = !!guia.guiando[q.jid];
  const espera = guiado ? GUIA_GUIADO_MS : q.acao === "julgar" ? GUIA_ESPERA_JULGAR_MS : GUIA_ESPERA_MS;
  if (agora - guia.desde < espera) return;
  if (!guiado && Date.now() - guia.ult < GUIA_INTERVALO_MS) return;
  guiaCutucar(q);
}
// Acerto, erro e absurdo de quem está sendo guiado ganham um comentário de professor
function guiaVeredito(ent) {
  if (!ent || !guiaLigado()) return;
  let jid = null,
    banco = null;
  if (ent.a === "acertou") {
    const idx = ent.d && typeof ent.d[0] === "number" ? ent.d[0] : null;
    jid = idx !== null && players[idx] ? players[idx].id : guia.resp;
    banco = "acerto";
  } else if (ent.a === "errou") {
    jid = guia.resp;
    banco = ent.d && ent.d[0] === "absurdo" ? "absurdo" : ent.d && ent.d[0] === "pular" ? null : "erro";
  }
  if (!jid || !banco || !guia.guiando[jid] || caosSilenced) return;
  const p = jogadorPorId(jid);
  const msg = p && getRandomReaction(REACTIVE_VOICE.guia[banco], p.name);
  if (msg) setTimeout(() => !gameEnded && caosFalarPara(jid, msg, true), 1200);
}
function guiaInstalar() {
  if (guiaInstalado) return;
  guiaInstalado = true;
  if (typeof acoesAoMudar === "function") acoesAoMudar(guiaVeredito);
  setInterval(() => {
    try {
      guiaTick();
    } catch (e) {}
  }, 1000);
}
