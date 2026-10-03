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
// Foto do estado do jogo (só o que é da mesa).
function caosEspinhaFoto() {
  try {
    return JSON.stringify([
      players.map((p) => [p.name, p.score, p.position, !!p.isBlocked, p.team, p.gems || null]),
      Object.keys(teams || {}).map((k) => [k, teams[k].score, teams[k].position, teams[k].gems || null]),
      mestreIndex,
      responderIndex,
      starterChosen,
      gameEnded,
      cardState,
      stats ? stats.totalDrawn : 0,
      currentCard ? currentCard.answer : null,
      Array.isArray(deck) ? deck.length : 0,
    ]);
  } catch (e) {
    return null;
  }
}
// Devolve o jogo pra foto (1ª lei). Mexe só nos números da mesa.
function caosEspinhaRestaurar(foto) {
  try {
    const [pl, tm, mi, ri] = JSON.parse(foto);
    pl.forEach(([nome, score, position, isBlocked, team, gems], i) => {
      const p = players[i];
      if (!p || p.name !== nome) return;
      p.score = score;
      p.position = position;
      p.isBlocked = isBlocked;
      p.team = team;
      if (gems) p.gems = gems;
      else delete p.gems;
    });
    tm.forEach(([k, score, position, gems]) => {
      if (!teams[k]) return;
      teams[k].score = score;
      teams[k].position = position;
      if (gems) teams[k].gems = gems;
    });
    mestreIndex = mi;
    responderIndex = ri;
  } catch (e) {}
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
    let r = nada;
    try {
      r = orig.apply(this, arguments);
    } catch (e) {
      caosEspinha.falhas++;
      caosEspinhaLog("erro contido", nome + ": " + String((e && e.message) || e).slice(0, 120));
      r = nada;
    }
    const depois = caosEspinhaFoto();
    if (antes && depois && antes !== depois) {
      caosEspinhaRestaurar(antes);
      if (caosEspinhaFoto() !== antes) {
        // o que mudou não é número da mesa (carta, baralho, fim de jogo): só anota
        caosEspinhaLog("aviso", nome + " mudou algo fora dos números da mesa");
      } else {
        caosEspinha.leis++;
        caosEspinhaLog("1ª lei", nome + " tentou mexer no jogo e foi desfeito");
      }
    }
    if (/^caos(Console|Emo)/.test(nome)) caosEspinhaSanear();
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
// Destino de uma fala: os jogadores citados por nome, ou a mesa toda.
function caosCanalDestino(texto) {
  const t = String(texto || "");
  const citados = players.filter((p) => {
    if (!p || !p.name) return false;
    const esc = String(p.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("(^|[^\\p{L}\\p{N}])" + esc + "(?![\\p{L}\\p{N}])", "u").test(t);
  });
  return citados.length
    ? citados.map((p) => ({ nome: p.name, aparelho: p.aparelho || "host" }))
    : [{ nome: "mesa", aparelho: "todos" }];
}
function caosCanalRegistrar(texto, privado) {
  try {
    caosCanal.push({
      t: Date.now(),
      carta: stats ? stats.totalDrawn : 0,
      texto: String(texto).replace(/\[C\.A\.O\.S\.\]\s*/g, "").slice(0, 160),
      para: caosCanalDestino(texto),
      privado: !!privado,
    });
    if (caosCanal.length > 40) caosCanal.shift();
  } catch (e) {}
}
// Fala dirigida a um jogador. Hoje aparece na tela de todos (um aparelho só);
// no online, o canal entrega só no aparelho dele quando privado = true.
function caosFalarPara(nome, msg, privado) {
  if (!msg) return;
  caosCanalPrivado = !!privado;
  try {
    showToastMessage(msg);
  } finally {
    caosCanalPrivado = false;
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
