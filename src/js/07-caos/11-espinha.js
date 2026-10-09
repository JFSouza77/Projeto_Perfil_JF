/* ----------------------------------------------------------------------
 * 7c. ESPINHA DO C.A.O.S. (1.7.5.3): o que garante que ele não quebra a partida.
 * O C.A.O.S. é caótico, mas leal (caótico leal, na régua do RPG): livre pra falar o que
 * quiser dentro de três leis que o código faz valer, sem consciência e sem poder sobre o jogo.
 *
 *   1ª lei · NUNCA MEXE NO JOGO. Pontos, casas, joias, equipes, turno, Mestre e carta são da
 *            mesa. Se uma rotina dele mudar algo disso, a espinha desfaz na hora e anota.
 *   2ª lei · NUNCA FALA O QUE A MESA PROIBIU. Júnior e Family friendly sem fala pesada, Suave
 *            sem zoeira, 🔇 da carta, saída da partida e 👎 respeitados (filtros do motor).
 *   3ª lei · NUNCA TRAVA A PARTIDA. Erro dentro dele vira silêncio: a rotina devolve "nada",
 *            a partida segue e o erro fica registrado no Cérebro (área ADM).
 *
 * Além das leis: os medidores de emoção são saneados (nenhum número inválido ou fora da faixa)
 * e toda fala passa pelo CANAL, que anota pra quem ela é (a mesa ou um jogador). No online
 * (1.7.10) o canal é que vai mandar a fala pro aparelho certo: hoje todos são o "host".
 * ---------------------------------------------------------------------- */
// Rotinas de fala e de emoção protegidas (só C.A.O.S.: nenhuma delas pode mudar o jogo).
const CAOS_ENTRADAS = [
  "maybeShowTimeWarning",
  "maybeShowSpontaneousChatter",
  "maybeShowCardChatter",
  "maybeShowStartComment",
  "maybeShowCaosPresentation",
  "maybeAnnounceCrystalBall",
  "maybeShowAiCardEgg",
  "maybeMicroAmbiente",
  "maybeCommentClueNumber",
  "maybeVirtualPlayerLine",
  "maybeAcidMessage",
  "analyzeMatchStateReaction",
  "caosWelcomePlayer",
  "caosChuteResponder",
  "caosReligarCarta",
  "caosPausaHumorTick",
  "caosRelogioNaCarta",
  "caosTedioTick",
  "caosGerarFala",
  "caosPensamentoTexto",
  "caosConsoleEvento",
  "caosConsoleCarta",
  "caosConsoleAvancar",
  "caosEmoMaybeDecay",
];
// O que cada rotina devolve quando dá erro (o "nada" de cada uma).
const CAOS_ENTRADA_NADA = { caosGerarFala: "", caosPensamentoTexto: "" };
let caosEspinha = { falhas: 0, leis: 0, saneados: 0, log: [], instalada: false };
let caosCanal = [];
function caosEspinhaLog(tipo, txt) {
  caosEspinha.log.push(`${new Date().toLocaleTimeString("pt-BR")} · ${tipo} · ${txt}`);
  if (caosEspinha.log.length > 30) caosEspinha.log.shift();
  try {
    caosLog("espinha", tipo + " · " + txt);
  } catch (e) {}
}
// Foto do estado do jogo (só o que é da mesa). 1.7.7.3: espinha completa. Além de pontos, casas,
// joias, equipes, Mestre e quem responde, vigia fichas de palpite, joias da rodada, vencedor por joias,
// fila da casa de bônus, dicas abertas, dica pendente, modo sorteado da Moda da Casa, rodada, última
// rodada, sentido e vez das equipes. Jogador é achado pelo id (não pela posição).
// Relógios: o balão do C.A.O.S. congela o relógio enquanto fala (soma tempo, por cortesia). Por isso
// a regra dos relógios é "pode dar tempo, nunca tirar": se o fim de um relógio chegar mais perto, volta.
function caosEspinhaFoto() {
  try {
    return JSON.stringify({
      pl: players.map((p) => [p.id || p.name, p.score, p.position, !!p.isBlocked, p.team, p.gems || null]),
      tm: Object.keys(teams || {}).map((k) => [k, teams[k].score, teams[k].position, teams[k].gems || null, teams[k].memberCursor]),
      mi: mestreIndex,
      ri: responderIndex,
      ph: palpiteHolders,
      ps: palpiteStock,
      jr: joiasRodada,
      gw: gemWinner,
      bq: pendingBonusQueue,
      ro: revealedOrder.map((r) => r.index),
      pi: pendingIndex,
      cs: casaSorteado,
      ra: rodadaAtual,
      ur: ultimaRodada,
      tri: teamRoundIndex,
      pd: playDirection,
      // só vigiados (não dá pra desfazer com segurança): mudou, fica anotado
      vg: [starterChosen, gameEnded, cardState, stats ? stats.totalDrawn : 0, currentCard ? currentCard.id || currentCard.answer : null, Array.isArray(deck) ? deck.length : 0, typeof expressTargetAction !== "undefined" ? expressTargetAction : null],
    });
  } catch (e) {
    return null;
  }
}
// Relógios fora da foto: a comparação é "não pode encurtar".
function caosEspinhaRelogios() {
  return { t: timerEndAt, c: cardEndAt };
}
const caosEspinhaCopia = (v) => (v === null || v === undefined ? v : JSON.parse(JSON.stringify(v)));
// Devolve o jogo pra foto (1ª lei). Mexe só no que é da mesa.
function caosEspinhaRestaurar(foto, relogios) {
  try {
    const f = JSON.parse(foto);
    // mesmos jogadores em outra ordem (assento trocado): volta pra ordem da foto
    const chaves = f.pl.map((x) => x[0]);
    const chaveDe = (q) => q && (q.id || q.name);
    if (players.length === chaves.length && players.some((q, i) => chaveDe(q) !== chaves[i]) && players.every((q) => chaves.includes(chaveDe(q))))
      players.sort((a, b) => chaves.indexOf(chaveDe(a)) - chaves.indexOf(chaveDe(b)));
    f.pl.forEach(([chave, score, position, isBlocked, team, gems], i) => {
      const p = players.find((q) => q && (q.id || q.name) === chave) || (players[i] && players[i].name === chave ? players[i] : null);
      if (!p) return;
      p.score = score;
      p.position = position;
      p.isBlocked = isBlocked;
      p.team = team;
      if (gems) p.gems = gems;
      else delete p.gems;
    });
    f.tm.forEach(([k, score, position, gems, cursor]) => {
      if (!teams[k]) return;
      teams[k].score = score;
      teams[k].position = position;
      if (gems) teams[k].gems = gems;
      if (cursor !== undefined) teams[k].memberCursor = cursor;
    });
    mestreIndex = f.mi;
    responderIndex = f.ri;
    palpiteHolders = caosEspinhaCopia(f.ph) || {};
    palpiteStock = f.ps;
    joiasRodada = caosEspinhaCopia(f.jr) || {};
    gemWinner = caosEspinhaCopia(f.gw);
    pendingBonusQueue = caosEspinhaCopia(f.bq) || [];
    // dica aberta a mais sai; dica que sumiu não dá pra recriar (fica anotada pela foto)
    if (revealedOrder.length > f.ro.length && revealedOrder.slice(0, f.ro.length).every((r, i) => r.index === f.ro[i]))
      revealedOrder.length = f.ro.length;
    pendingIndex = f.pi;
    casaSorteado = f.cs;
    rodadaAtual = f.ra;
    ultimaRodada = f.ur;
    teamRoundIndex = f.tri;
    playDirection = f.pd;
    if (relogios) {
      if (relogios.t && timerEndAt && timerEndAt < relogios.t) timerEndAt = relogios.t;
      if (relogios.c && cardEndAt && cardEndAt < relogios.c) cardEndAt = relogios.c;
    }
  } catch (e) {}
}
// Algum relógio ficou mais curto do que estava?
function caosEspinhaRelogioEncurtou(antes) {
  return !!antes && ((antes.t && timerEndAt && timerEndAt < antes.t) || (antes.c && cardEndAt && cardEndAt < antes.c));
}
// Saneia os medidores (nenhum NaN, nenhum valor fora da faixa, emoção que manda válida).
function caosEspinhaSanear() {
  let n = 0;
  try {
    ["tensao", "calor", "paciencia"].forEach((k) => {
      const v = caosEmo[k];
      if (!Number.isFinite(v) || v < 0 || v > 10) {
        caosEmo[k] = Number.isFinite(v) ? Math.max(0, Math.min(10, v)) : k === "paciencia" ? 7 : 5;
        n++;
      }
    });
    const C = caosConsole;
    if (C && C.g) {
      Object.keys(CAOS_CONSOLE).forEach((k) => {
        const v = C.g[k],
          teto = CAOS_CONSOLE[k].teto;
        if (!Number.isFinite(v) || v < 0 || v > teto) {
          C.g[k] = Number.isFinite(v) ? Math.max(0, Math.min(teto, v)) : 0;
          n++;
        }
      });
      if (C.atual !== "calmo" && !CAOS_CONSOLE[C.atual]) {
        C.atual = "calmo";
        n++;
      }
    }
  } catch (e) {}
  if (n) {
    caosEspinha.saneados += n;
    caosEspinhaLog("saneou", n + " medidor(es) fora da faixa");
  }
}
// Protege uma rotina: erro vira "nada" (3ª lei) e mudança no jogo é desfeita (1ª lei).
function caosBlindarUm(nome) {
  const orig = typeof window !== "undefined" ? window[nome] : undefined;
  if (typeof orig !== "function" || orig.__blindada) return false;
  const nada = Object.prototype.hasOwnProperty.call(CAOS_ENTRADA_NADA, nome) ? CAOS_ENTRADA_NADA[nome] : null;
  const prot = function () {
    const antes = caosEspinhaFoto();
    const relAntes = caosEspinhaRelogios();
    let r = nada;
    try {
      r = orig.apply(this, arguments);
    } catch (e) {
      caosEspinha.falhas++;
      caosEspinhaLog("erro contido", nome + ": " + String((e && e.message) || e).slice(0, 120));
      r = nada;
    }
    const depois = caosEspinhaFoto();
    if (antes && depois && (antes !== depois || caosEspinhaRelogioEncurtou(relAntes))) {
      caosEspinhaRestaurar(antes, relAntes);
      if (caosEspinhaFoto() !== antes) {
        // o que mudou não é número da mesa (carta, baralho, fim de jogo): só anota
        caosEspinhaLog("aviso", nome + " mudou algo fora dos números da mesa");
      } else {
        caosEspinha.leis++;
        caosEspinhaLog("1ª lei", nome + " tentou mexer no jogo e foi desfeito");
      }
    }
    if (/^caos(Console|Emo)/.test(nome)) caosEspinhaSanear();
    // 1.7.7.6: as rotinas protegidas são síncronas. Se uma passar a devolver Promise, a foto acima
    // não cobre o que ela faz depois; fica anotado e a rejeição não vira erro solto.
    if (r && typeof r.then === "function") {
      caosEspinhaLog("aviso", nome + " devolveu Promise: a espinha só vigia a parte síncrona");
      r.then(null, (e) => {
        caosEspinha.falhas++;
        caosEspinhaLog("erro contido", nome + " (assíncrono): " + String((e && e.name) || "erro").slice(0, 40));
      });
    }
    return r;
  };
  prot.__blindada = true;
  try {
    window[nome] = prot;
  } catch (e) {
    return false;
  }
  return window[nome] === prot;
}
// Destino de uma fala (1.7.8.4: com id).
//  · EXPLÍCITO: quem fala com alguém diz pra quem (caosFalarPara, pelo id). É o que vale na rede.
//  · PELO NOME: sem destino explícito, o canal procura nomes no texto. Isso é só diagnóstico (um
//    apelido dentro de outro nome engana); na 1.7.9 a fala sem destino explícito vai pra mesa.
function caosCanalDestino(texto) {
  const t = String(texto || "");
  const citados = players.filter((p) => {
    if (!p || !p.name) return false;
    const esc = String(p.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("(^|[^\\p{L}\\p{N}])" + esc + "(?![\\p{L}\\p{N}])", "u").test(t);
  });
  return citados.length
    ? citados.map((p) => ({ id: p.id || null, nome: p.name, aparelho: p.aparelho || "host" }))
    : [{ id: null, nome: "mesa", aparelho: "todos" }];
}
let caosCanalSeq = 0;
// 1.7.9: o contador volta a 0 quando a página recarrega; o pedaço da sessão evita repetir um eventId
// já usado na mesma partida (quem recebe ignora evento repetido).
const caosCanalSessao = Math.random().toString(36).slice(2, 6);
let caosCanalDestinoExplicito = null; // { ids: [...] } enquanto caosFalarPara entrega a fala
function caosCanalRegistrar(texto, privado) {
  try {
    const exp = caosCanalDestinoExplicito;
    const para = exp
      ? exp.ids.map((id) => {
          const p = jogadorPorId(id);
          return { id, nome: p ? p.name : "?", aparelho: (p && p.aparelho) || "host" };
        })
      : caosCanalDestino(texto);
    caosCanal.push({
      // evento da fala: id único na partida (a rede usa pra não entregar duas vezes)
      eventId: (typeof matchId === "string" && matchId ? matchId : "local") + ":" + caosCanalSessao + ":f" + ++caosCanalSeq,
      matchId: typeof matchId === "string" ? matchId : null,
      revisao: typeof partidaRevisao === "number" ? partidaRevisao : 0,
      t: Date.now(),
      carta: stats ? stats.totalDrawn : 0,
      texto: String(texto).replace(/\[C\.A\.O\.S\.\]\s*/g, "").slice(0, 160),
      para,
      destino: exp ? "explicito" : para[0].id ? "nome" : "mesa",
      privado: !!(privado || (exp && exp.privado)),
    });
    if (caosCanal.length > 40) caosCanal.shift();
  } catch (e) {}
}
// Fala dirigida a um jogador (pelo id; aceita o nome por compatibilidade). Hoje aparece na tela de
// todos (um aparelho só); no online, com privado = true, o canal entrega só no aparelho dele.
function caosFalarPara(quem, msg, privado) {
  if (!msg) return;
  const p = jogadorPorId(quem) || players.find((q) => q && q.name === quem) || null;
  caosCanalPrivado = !!privado;
  caosCanalDestinoExplicito = p && p.id ? { ids: [p.id], privado: !!privado } : null;
  try {
    showToastMessage(msg);
  } finally {
    caosCanalPrivado = false;
    caosCanalDestinoExplicito = null;
  }
}
let caosCanalPrivado = false;
// Instala a espinha (chamada no iniciar, depois de tudo definido).
function caosEspinhaInstalar() {
  if (caosEspinha.instalada) return;
  let n = 0;
  CAOS_ENTRADAS.forEach((nome) => caosBlindarUm(nome) && n++);
  // canal: toda fala do C.A.O.S. que passa pela tela é registrada com o destino
  const toast = window.showToastMessage;
  if (typeof toast === "function" && !toast.__canal) {
    const viaCanal = function (msg) {
      if (typeof msg === "string" && msg.indexOf("[C.A.O.S.]") !== -1) caosCanalRegistrar(msg, caosCanalPrivado);
      return toast.apply(this, arguments);
    };
    viaCanal.__canal = true;
    window.showToastMessage = viaCanal;
  }
  caosEspinha.instalada = true;
  caosEspinhaLog("instalada", n + " rotinas protegidas pelas 3 leis");
}

/* --- Erros fora das rotinas vigiadas (1.7.7.6, revisão GPT) ---
 * Antes, um erro fora da espinha só aparecia no console (e o DEBUG fica desligado). Agora fica
 * registrado aqui, só neste aparelho, pra área ADM (Cérebro) mostrar. Guarda apenas o tipo do erro
 * e a hora: nada de nome de jogador, carta, resposta, texto do erro ou caminho de arquivo. Nunca é
 * enviado pra lugar nenhum e não esconde o erro do console. */
const caosErrosPagina = [];
function caosErroPaginaRegistrar(tipo, erro) {
  try {
    const codigo = erro && typeof erro.name === "string" ? erro.name.slice(0, 40) : typeof erro === "string" ? "Erro" : "ErroDesconhecido";
    caosErrosPagina.push({ tipo, codigo, quando: Date.now() });
    if (caosErrosPagina.length > 20) caosErrosPagina.shift();
  } catch (e) {}
}
try {
  window.addEventListener("error", (e) => caosErroPaginaRegistrar("erro", e && e.error));
  window.addEventListener("unhandledrejection", (e) => caosErroPaginaRegistrar("promessa", e && e.reason));
} catch (e) {}
function caosErrosPaginaResumo() {
  if (!caosErrosPagina.length) return "nenhum";
  return caosErrosPagina
    .slice(-5)
    .reverse()
    .map((x) => escapeHtml(`${new Date(x.quando).toLocaleTimeString("pt-BR")} · ${x.tipo} · ${x.codigo}`))
    .join("<br>");
}
