/* C.A.O.S. 4.7 · Tato (pedido do JF): frase longa de vez em quando é boa, mas com a mesa cansada ou cheia de coisa
   acontecendo ninguém acompanha. Ele aprende com a própria mesa: quando a maioria das falas que pularam ou que
   fizeram alguém desligar a voz eram longas, ele passa a preferir frases curtas (e lembra disso na próxima partida
   com a mesma mesa: veja "Memória da mesa" abaixo).
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
// C.A.O.S. 4.8 · Memória da mesa (pedido do JF): ele lembra de uma partida pra outra, com um "reset suave".
// · Mesma mesa (os mesmos nicks): já começa sabendo se ali frase longa funciona ou não.
// · Mesa nova: começa pelo jeito da mesa (crianças preferem narrador curto; adultos no Hardcore, Old School ou
//   Modo C.A.O.S. cansam de frase comprida; mesa mista fica no padrão) e testa: deixa passar umas falas longas.
//   Se a mesa ouve as longas até o fim, ele mantém; se corta, ele encurta.
const CAOS_TATO_KEY = "perfil5_caos_tato";
const CAOS_TATO_TESTES = 2; // falas longas que ele arrisca numa mesa nova, pra testar
const CAOS_TATO_OUVIU_MS = 2e4; // fala longa sem corte por 20 s conta como ouvida
const CAOS_TATO_MESAS = 30; // quantas mesas ele lembra
let caosTato = caosTatoNovo();
let caosFamiliasNichoUsadas = new Set();

function caosTatoNovo() {
  return { longas: 0, curtas: 0, curto: false, ouvidas: 0, gosta: false, pend: null, exib: null, sig: null, perfil: "mista", testes: 0, conhecida: false };
}
function caosTatoZerar() {
  caosTato = caosTatoNovo();
  caosFamiliasNichoUsadas = new Set();
}
function caosTatoMem() {
  try {
    const o = JSON.parse(JFStore.getItem(CAOS_TATO_KEY) || "{}");
    return o && typeof o === "object" && !Array.isArray(o) ? o : {};
  } catch (e) {
    return {};
  }
}
function caosTatoGravar() {
  if (!caosTato.sig) return;
  try {
    const m = caosTatoMem();
    m[caosTato.sig] = { curto: caosTato.curto, gosta: caosTato.gosta, perfil: caosTato.perfil, at: Date.now() };
    const chaves = Object.keys(m).sort((a, b) => (m[b].at || 0) - (m[a].at || 0));
    chaves.slice(CAOS_TATO_MESAS).forEach((k) => delete m[k]);
    JFStore.setItem(CAOS_TATO_KEY, JSON.stringify(m));
  } catch (e) {}
}
// O jeito da mesa: crianças, adultos ou mista.
function caosTatoPerfil() {
  const n = players.length || 1;
  const maioria = (f) => players.filter(f).length * 2 > n;
  if (CURRENT_MODE === "junior" || maioria((p) => p.ageBracket === "crianca" || p.ageBracket === "pre") || maioria((p) => p.humor === "familia"))
    return "criancas";
  if (["hardcore", "oldschool", "caos"].includes(CURRENT_MODE) || maioria((p) => p.ageBracket === "adulto")) return "adultos";
  return "mista";
}
// Primeira vez que ele olha pra mesa nesta partida: reconhece a mesa e puxa o que lembra dela.
function caosTatoIniciar() {
  if (caosTato.sig || !starterChosen || !players.length) return;
  caosTato.sig = players
    .map((p) => nameKeyPlain(p.name))
    .sort()
    .join("|");
  caosTato.perfil = caosTatoPerfil();
  const m = caosTatoMem()[caosTato.sig];
  if (m && (m.curto || m.gosta)) {
    caosTato.conhecida = true;
    caosTato.curto = !!m.curto;
    caosTato.gosta = !m.curto && !!m.gosta;
    if (caosTato.curto) caosTato.longas = 2;
    caosLog("tato", `mesma mesa de antes: ${caosTato.curto ? "aqui frase longa não rende" : "aqui frase longa funciona"}`);
  } else caosLog("tato", `mesa nova (${caosTato.perfil}): vou testar umas falas longas`);
}
function caosTatoTam(t) {
  return String(t || "")
    .replace(/^\[C\.A\.O\.S\.\]\s*/, "")
    .trim().length;
}
// Ele acabou de soltar uma fala: se é longa, fica esperando pra ver se a mesa ouve até o fim.
function caosTatoFalou(texto) {
  caosTatoIniciar();
  caosTatoConferir();
  caosTato.exib = { text: texto, at: Date.now() };
  if (caosTatoTam(texto) < CAOS_TATO_LONGA) return;
  caosTato.pend = { at: Date.now() };
  if (!caosTato.conhecida && !caosTato.curto && !caosTato.gosta) caosTato.testes++;
}
// Fala longa que passou 20 s sem corte: a mesa ouviu. Duas ouvidas e nenhum corte de longa: essa mesa gosta.
function caosTatoConferir() {
  const pd = caosTato.pend;
  if (!pd || Date.now() - pd.at < CAOS_TATO_OUVIU_MS) return;
  caosTato.pend = null;
  caosTato.ouvidas++;
  if (!caosTato.gosta && !caosTato.curto && caosTato.ouvidas >= 2 && caosTato.longas === 0) {
    caosTato.gosta = true;
    caosLog("tato", "a mesa ouve as falas longas até o fim: mantenho");
    caosTatoGravar();
  }
}
// A mesa reagiu mal a uma fala (pulou ou desligou a voz): anota o tamanho e decide se é hora de encurtar.
function caosTatoReacao(texto) {
  caosTatoIniciar();
  caosTato.pend = null;
  const n = caosTatoTam(texto);
  if (!n) return;
  if (n >= CAOS_TATO_LONGA) caosTato.longas++;
  else caosTato.curtas++;
  const total = caosTato.longas + caosTato.curtas;
  const curto = caosTato.longas >= 2 && caosTato.longas / total >= 0.6;
  if (curto !== caosTato.curto) {
    caosTato.curto = curto;
    if (curto) caosTato.gosta = false;
    caosLog("tato", curto ? `a mesa corta as falas longas (${caosTato.longas} de ${total}): vou falar curto` : "a mesa corta até as curtas: o problema não é o tamanho");
    caosTatoGravar();
  }
}
// Quem desligou a voz logo depois de uma fala: conta como reação a ela.
function caosTatoCalou() {
  const p = caosTato.exib || caosLastPick;
  if (p && p.at && Date.now() - p.at <= CAOS_TATO_JANELA_MS) caosTatoReacao(p.text);
}
function caosTatoRajada() {
  try {
    return caosFalasUltimos(6e4) >= CAOS_RAJADA_FALAS;
  } catch (e) {
    return false;
  }
}
function caosTatoMesaCansada() {
  return caosTatoRajada() || (CURRENT_MODE === "caos" && starterChosen && !gameEnded);
}
// Tamanho máximo preferido agora (a lista sem opção mais curta ainda fala a longa).
function caosTatoMax() {
  caosTatoIniciar();
  caosTatoConferir();
  if (caosTato.curto) return CAOS_TATO_LONGA;
  if (caosTato.gosta) return caosTatoRajada() ? CAOS_TATO_MESA_CANSADA : CAOS_TATO_NORMAL;
  // mesa nova: as primeiras longas passam, pra testar
  if (!caosTato.conhecida && caosTato.testes < CAOS_TATO_TESTES && !caosTatoRajada()) return CAOS_TATO_NORMAL;
  const base = caosTato.perfil === "criancas" ? CAOS_TATO_LONGA : caosTato.perfil === "adultos" ? CAOS_TATO_MESA_CANSADA : CAOS_TATO_NORMAL;
  return caosTatoMesaCansada() ? Math.min(base, CAOS_TATO_MESA_CANSADA) : base;
}
// Família de nicho que já saiu nesta partida não volta.
function caosFamiliaLiberada(k) {
  return !CAOS_FAMILIAS_NICHO.includes(k) || !caosFamiliasNichoUsadas.has(k);
}
function caosFamiliaUsou(k) {
  if (CAOS_FAMILIAS_NICHO.includes(k)) caosFamiliasNichoUsadas.add(k);
}
