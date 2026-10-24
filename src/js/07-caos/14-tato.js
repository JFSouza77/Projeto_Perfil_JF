/* C.A.O.S. 4.7 · Tato (pedido do JF): frase longa de vez em quando é boa, mas com a mesa cansada ou cheia de coisa
   acontecendo ninguém acompanha. Ele aprende com a própria mesa: quando a maioria das falas que pularam ou que
   fizeram alguém desligar a voz eram longas, ele passa a preferir frases curtas até o fim da partida.
   Também encurta sozinho quando a mesa está cansada (rajada de falas) e no Modo C.A.O.S. (muita informação na tela).
   Não apaga nenhuma fala: só escolhe as mais curtas quando a lista tem opção. */
const CAOS_TATO_LONGA = 120; // letras (sem o "[C.A.O.S.]"): daqui pra cima a fala conta como longa
const CAOS_TATO_MESA_CANSADA = 140; // limite com a mesa cansada ou no Modo C.A.O.S.
const CAOS_TATO_NORMAL = 170; // limite de sempre
const CAOS_TATO_JANELA_MS = 2e4; // quem desliga a voz até 20 s depois de uma fala conta como reação a ela
// Famílias de nicho (referência muito específica): no máximo uma fala de cada por partida, pra não cansar.
const CAOS_FAMILIAS_NICHO = [
  "referenciaObscura",
  "internetAntiga",
  "giriasAntigas",
  "anime",
  "mpb",
  "musicaInternacional",
  "dilma",
  "narradorEsportivo",
  "malandro",
  "cozinha",
  "tecnicoTI",
  "pseudoCiencia",
];
let caosTato = { longas: 0, curtas: 0, curto: false };
let caosFamiliasNichoUsadas = new Set();

function caosTatoZerar() {
  caosTato = { longas: 0, curtas: 0, curto: false };
  caosFamiliasNichoUsadas = new Set();
}
function caosTatoTam(t) {
  return String(t || "")
    .replace(/^\[C\.A\.O\.S\.\]\s*/, "")
    .trim().length;
}
// A mesa reagiu mal a uma fala (pulou ou desligou a voz): anota o tamanho e decide se é hora de encurtar.
function caosTatoReacao(texto) {
  const n = caosTatoTam(texto);
  if (!n) return;
  if (n >= CAOS_TATO_LONGA) caosTato.longas++;
  else caosTato.curtas++;
  const total = caosTato.longas + caosTato.curtas;
  const curto = caosTato.longas >= 2 && caosTato.longas / total >= 0.6;
  if (curto !== caosTato.curto) {
    caosTato.curto = curto;
    caosLog("tato", curto ? `a mesa corta as falas longas (${caosTato.longas} de ${total}): vou falar curto` : "a mesa corta até as curtas: o problema não é o tamanho");
  }
}
// Quem desligou a voz logo depois de uma fala: conta como reação a ela.
function caosTatoCalou() {
  const p = caosLastPick;
  if (p && p.at && Date.now() - p.at <= CAOS_TATO_JANELA_MS) caosTatoReacao(p.text);
}
function caosTatoMesaCansada() {
  try {
    return caosFalasUltimos(6e4) >= CAOS_RAJADA_FALAS || (CURRENT_MODE === "caos" && starterChosen && !gameEnded);
  } catch (e) {
    return false;
  }
}
// Tamanho máximo preferido agora (a lista sem opção mais curta ainda fala a longa).
function caosTatoMax() {
  if (caosTato.curto) return CAOS_TATO_LONGA;
  return caosTatoMesaCansada() ? CAOS_TATO_MESA_CANSADA : CAOS_TATO_NORMAL;
}
// Família de nicho que já saiu nesta partida não volta.
function caosFamiliaLiberada(k) {
  return !CAOS_FAMILIAS_NICHO.includes(k) || !caosFamiliasNichoUsadas.has(k);
}
function caosFamiliaUsou(k) {
  if (CAOS_FAMILIAS_NICHO.includes(k)) caosFamiliasNichoUsadas.add(k);
}
