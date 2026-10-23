/* Easter egg (pedido do JF): piadas internas com quem tem nick reconhecido (PRESENTES) e as falas "Dragons",
   que só valem com o JF na mesa junto de alguém do servidor. Pouco por partida: no máximo CAOS_AMIGOS_MAX por pessoa,
   com cartas de intervalo, e nunca no Júnior. Falas citam o nome no meio da frase (sem vocativo) pra serem da mesa toda. */
const CAOS_AMIGOS_MAX = 4; // por pessoa, por partida (fora a chegada)
const CAOS_AMIGOS_INTERVALO = 3; // cartas entre uma piada interna e outra (de qualquer amigo)
const CAOS_DRAGONS_MAX = 3; // falas Dragons por partida
const CAOS_DRAGONS_INTERVALO = 4;
const CAOS_DRAGONS_IDS = ["vitinho", "rafa", "typingg"];
let caosAmigosEstado = { n: {}, ult: -99, drag: 0, dragUlt: -99 };
// Sobrinhos do JF (pedido do JF): mesmas regras das piadas internas, mas valem no Júnior (são crianças) e as falas
// são de família. Reconhece o nome puro ou o nick de cada um.
const CAOS_SOBRINHOS = [
  { id: "pedro", re: /^(pedro$|pedrinho)/ },
  { id: "isabel", re: /^(isabel$|bebel)/ },
  { id: "elisa", re: /^(elisa$|elisinha)/ },
];
function sobrinhoDe(n) {
  const k = nameKeyPlain(n);
  const s = k && CAOS_SOBRINHOS.find((x) => x.re.test(k));
  return s ? s.id : null;
}
// O banco de piadas de quem tem este nome (amigo com presente ou sobrinho), com o id pra contar o limite.
function caosAmigoBanco(n) {
  const pr = presenteDe(n);
  if (pr && REACTIVE_VOICE.amigos[pr.id]) return { id: pr.id, B: REACTIVE_VOICE.amigos[pr.id], familia: false };
  const sb = sobrinhoDe(n);
  if (sb && REACTIVE_VOICE.sobrinhos[sb]) return { id: "sobrinho_" + sb, B: REACTIVE_VOICE.sobrinhos[sb], familia: true };
  return null;
}

function caosAmigosZerar() {
  caosAmigosEstado = { n: {}, ult: -99, drag: 0, dragUlt: -99 };
}
function caosAmigosLiberado(familia) {
  return typeof CURRENT_MODE !== "undefined" && (familia || CURRENT_MODE !== "junior") && !caosSilenced && starterChosen && !gameEnded;
}
// Uma piada interna pro jogador p no momento (vez/erro/acerto), respeitando o limite. Devolve o texto ou null.
function caosAmigoFala(p, momento, chance) {
  try {
    const am = p && caosAmigoBanco(p.name);
    if (!am || !caosAmigosLiberado(am.familia) || Math.random() > (chance === undefined ? 1 : chance)) return null;
    const B = am.B, id = am.id;
    if (!B[momento]) return null;
    const carta = stats ? stats.totalDrawn : 0;
    if ((caosAmigosEstado.n[id] || 0) >= CAOS_AMIGOS_MAX || carta - caosAmigosEstado.ult < CAOS_AMIGOS_INTERVALO) return null;
    const t = getRandomReaction(B[momento], p.name);
    if (!t) return null;
    caosAmigosEstado.n[id] = (caosAmigosEstado.n[id] || 0) + 1;
    caosAmigosEstado.ult = carta;
    caosLog("amigos", `${p.name}: piada interna (${momento}, ${caosAmigosEstado.n[id]}ª)`);
    return t;
  } catch (e) {
    return null;
  }
}
// Carta nova: às vezes uma piada com quem está na vez (ou o Mestre); senão, talvez uma Dragons.
function caosAmigosNaCarta() {
  if (!caosAmigosLiberado(true)) return false;
  const foco = [players[responderIndex], players[mestreIndex]].filter(Boolean);
  for (const p of foco) {
    const t = caosAmigoFala(p, "vez", 0.3);
    if (t) {
      caosFalaAgendar(() => t, 1600);
      return true;
    }
  }
  return caosDragonsNaCarta();
}
// Dragons: com o JF na mesa e pelo menos um do servidor (Vitinho, Rafa, Typingg), ele zoa o "ancião" de vez em quando.
// Com os três juntos, às vezes chama os três pra implicar junto.
function caosDragonsNaCarta() {
  try {
    if (!caosAmigosLiberado()) return false;
    const jf = players.find((p) => isJfName(p.name));
    const turma = players.filter((p) => {
      const pr = presenteDe(p.name);
      return pr && CAOS_DRAGONS_IDS.includes(pr.id);
    });
    const carta = stats ? stats.totalDrawn : 0;
    if (!jf || !turma.length || carta < 2) return false;
    if (caosAmigosEstado.drag >= CAOS_DRAGONS_MAX || carta - caosAmigosEstado.dragUlt < CAOS_DRAGONS_INTERVALO) return false;
    if (Math.random() > 0.22) return false;
    const D = REACTIVE_VOICE.dragons;
    const ids = new Set(turma.map((p) => presenteDe(p.name).id));
    let t;
    if (ids.size >= 3 && Math.random() < 0.45) {
      const [a, b, c] = CAOS_DRAGONS_IDS.map((id) => turma.find((p) => presenteDe(p.name).id === id).name);
      t = getRandomReaction(D.trio, a, b, c);
    } else t = getRandomReaction(D.um, turma[Math.floor(Math.random() * turma.length)].name);
    if (!t) return false;
    caosAmigosEstado.drag++;
    caosAmigosEstado.dragUlt = carta;
    caosLog("amigos", `Dragons (${caosAmigosEstado.drag}ª)`);
    caosFalaAgendar(() => t, 1800);
    return true;
  } catch (e) {
    return false;
  }
}
