/* ----------------------------------------------------------------------
 * 7b. GERADOR DE FALAS POR GATILHO (1.7.5.1)
 * Cada gatilho (o JF chegou, a Anne chegou, o modo da partida, a hora...) tem o seu
 * gerador em CAOS_GERADORES (dados/08-geradores-de-fala.js). A fala é montada juntando
 * pedaços (slots) escolhidos pelo contexto do momento: hora, dia, modo, quem está na mesa,
 * o que a memória lembra da pessoa e o estado de espírito do C.A.O.S.
 * Cada pedaço é uma frase completa, então qualquer combinação fica certa.
 * A memória dos pedaços usados fica salva (CAOS_GERADOR_KEY), então ele não repete
 * a mesma coisa de uma partida pra outra, nem depois de fechar o jogo.
 * ---------------------------------------------------------------------- */
// Chance de escolher um pedaço do contexto (hora, memória, mesa) em vez de um geral.
const CAOS_GER_P_CONTEXTO = 0.7;
// Quantas falas inteiras de cada gatilho ficam guardadas pra não sair a mesma montagem.
const CAOS_GER_ULTIMAS = 12;
// Tamanho máximo (em letras) de uma fala montada; maior que isso, ele monta outra.
const CAOS_GER_MAX = 190;
let caosGerMem = null;
// Quantas falas cada gerador montou nesta partida (aparece no Cérebro, na área ADM).
let caosGerConta = {};
function caosGerMemoria() {
  if (caosGerMem) return caosGerMem;
  try {
    const o = JSON.parse(JFStore.getItem(CAOS_GERADOR_KEY) || "{}");
    caosGerMem = o && typeof o === "object" && !Array.isArray(o) ? o : {};
  } catch (e) {
    caosGerMem = {};
  }
  return caosGerMem;
}
function caosGerGravar() {
  try {
    const m = caosGerMemoria();
    // limite de memória: só gatilhos que existem, e listas curtas
    Object.keys(m).forEach((g) => {
      if (!CAOS_GERADORES[g]) delete m[g];
    });
    JFStore.setItem(CAOS_GERADOR_KEY, JSON.stringify(m));
  } catch (e) {}
}
function caosGerTemperamento() {
  for (const k in CAOS_TEMPERAMENTOS) if (CAOS_TEMPERAMENTOS[k] === caosTemper) return k;
  return "normal";
}
// Contexto padrão: etiquetas (tags) que escolhem os pedaços e variáveis que preenchem {chaves}.
function caosGerContexto(p) {
  const tags = new Set(),
    vars = {};
  const a = caosAgora();
  tags.add(caosPeriodo(a.h));
  if (a.dow === 0 || a.dow === 6) tags.add("fimDeSemana");
  if (a.dow === 5) tags.add("sexta");
  if (a.dow === 1) tags.add("segunda");
  vars.hora = caosHoraTexto(a.h);
  vars.dia = CAOS_DIAS[a.dow];
  const modo = CURRENT_FORMAT === "equipe" ? "equipe" : CURRENT_MODE;
  if (modo) tags.add("modo_" + modo);
  if (CURRENT_MODE) vars.modo = memModoNome(CURRENT_MODE);
  const n = players.length;
  vars.qtd = String(n);
  if (n <= 2) tags.add("dupla");
  if (n >= 5) tags.add("mesaCheia");
  const outros = players.filter((x) => x !== p);
  const anne = outros.find((x) => isAnneName(x.name)),
    jf = outros.find((x) => isJfName(x.name));
  if (anne) {
    tags.add("anne");
    vars.anne = anne.name;
  }
  if (jf) {
    tags.add("jf");
    vars.jf = jf.name;
  }
  const pedro = outros.find((x) => nameKeyPlain(x.name) === "pedro"),
    isabel = outros.find((x) => nameKeyPlain(x.name) === "isabel");
  if (pedro) {
    tags.add("pedro");
    vars.pedro = pedro.name;
  }
  if (isabel) {
    tags.add("isabel");
    vars.isabel = isabel.name;
  }
  const estranhos = outros.filter((x) => x !== anne && x !== jf && x !== pedro && x !== isabel);
  if (estranhos.length) {
    vars.outro = estranhos[Math.floor(Math.random() * estranhos.length)].name;
    tags.add("outro");
  }
  try {
    tags.add("estado_" + caosEstadoComposto());
  } catch (e) {}
  tags.add("temper_" + caosGerTemperamento());
  if (p) {
    vars.nome = p.name;
    tags.add("temNome");
    const f = p._fichaAntes !== undefined ? p._fichaAntes : fichaGet(p.name);
    if (!f || !(f.partidas > 0)) tags.add("estreia");
    if (f) {
      if (f.ultimaVez > 0) {
        const ms = Date.now() - f.ultimaVez;
        tags.add(ms < 864e5 ? "hoje" : ms < 14 * 864e5 ? "semana" : "sumido");
        vars.tempo = memTempoDesde(ms);
        vars.quando = vars.tempo === "ontem" || vars.tempo === "hoje mesmo" ? vars.tempo : "há " + vars.tempo;
      }
      if (f.partidas > 0) {
        if (f.ultimoResultado === "venceu") tags.add("venceuUltima");
        else if (f.ultimoResultado) tags.add("perdeuUltima");
        vars.partidas = String(f.partidas);
        vars.vitorias = String(f.vitorias || 0);
        if (f.partidas >= 10) tags.add("veterano");
        if ((f.vitorias || 0) >= 5) tags.add("vencedor");
        if (f.ultimoModo && f.ultimoModo !== CURRENT_MODE) {
          tags.add("outroModo");
          vars.modoAntes = memModoNome(f.ultimoModo);
        }
      }
    }
    const humor = playerHumor(p);
    if (humorFamilia(p)) tags.add("familia");
    else if (humor) tags.add("humor_" + humor);
  }
  return { tags, vars };
}
function caosGerPlaceholders(t) {
  return (String(t).match(/\{(\w+)\}/g) || []).map((x) => x.slice(1, -1));
}
// Palavras "fortes" de um texto (6+ letras, sem acento), pra não repetir a mesma palavra
// em dois pedaços da mesma fala ("Boas-vindas, Dani! Boas-vindas à bagunça.").
function caosGerPalavras(t) {
  return new Set(
    String(t)
      .replace(/\{\w+\}/g, " ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length >= 6),
  );
}
function caosGerPreenche(t, vars) {
  return String(t).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
}
// Escolhe um pedaço de um slot: primeiro tenta um balde do contexto (não usado ainda
// nesta fala), senão o geral. Evita os pedaços usados por último (memória salva).
function caosGerSlot(g, slot, def, ctx, usadas, ja) {
  const mem = caosGerMemoria(),
    mg = mem[g] || (mem[g] = {}),
    ms = mg[slot] || (mg[slot] = []);
  const ok = (t) =>
    caosGerPlaceholders(t).every((k) => ctx.vars[k] != null) &&
    !(CURRENT_MODE === "junior" && CAOS_JUNIOR_BLOCK_RE.test(t));
  const baldes = Object.keys(def).filter((k) => k !== "geral" && ctx.tags.has(k) && !usadas.has(k));
  const ordem = [];
  if (baldes.length && Math.random() < CAOS_GER_P_CONTEXTO) {
    for (let i = baldes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [baldes[i], baldes[j]] = [baldes[j], baldes[i]];
    }
    ordem.push(...baldes);
  }
  if (def.geral) ordem.push("geral");
  // 1ª passada: só pedaços não usados há pouco (balde de contexto gasto = muda de assunto).
  // 2ª passada (quando o slot só tem baldes gastos): aceita repetir.
  for (const repetir of [false, true]) {
    for (const b of ordem) {
      let lista = (def[b] || []).map((t, i) => ({ t, id: b + ":" + i })).filter((x) => ok(x.t));
      if (!lista.length) continue;
      if (ja && ja.size) {
        const sem = lista.filter((x) => ![...caosGerPalavras(x.t)].some((w) => ja.has(w)));
        if (sem.length) lista = sem;
        else if (b !== "geral" && !repetir) continue; // o balde só repetiria palavra: tenta outro
      }
      const livres = lista.filter((x) => !ms.includes(x.id));
      if (!livres.length && b !== "geral" && !repetir) continue;
      const pool = livres.length ? livres : lista;
      const x = pool[Math.floor(Math.random() * pool.length)];
      ms.push(x.id);
      const total = Object.values(def).reduce((s2, l) => s2 + l.length, 0);
      const janela = Math.max(1, Math.min(40, Math.floor(total * 0.7)));
      while (ms.length > janela) ms.shift();
      if (b !== "geral") usadas.add(b);
      return x.t;
    }
  }
  return null;
}
// Monta uma fala do gatilho. extra = { tags: [...], vars: {...} } acrescenta contexto
// próprio do momento. Devolve "" quando o gerador não existe ou não deu pra montar.
function caosGerarFala(g, p, extra) {
  const G = typeof CAOS_GERADORES !== "undefined" && CAOS_GERADORES[g];
  if (!G) return "";
  const ctx = caosGerContexto(p);
  if (extra) {
    (extra.tags || []).forEach((t) => ctx.tags.add(t));
    Object.assign(ctx.vars, extra.vars || {});
  }
  const mem = caosGerMemoria(),
    mg = mem[g] || (mem[g] = {}),
    ult = mg._ult || (mg._ult = []);
  let txt = "";
  for (let tent = 0; tent < 6; tent++) {
    const usadas = new Set(),
      ja = new Set();
    const molde = caosPickNR("ger." + g, G.moldes);
    let falhou = false;
    const montada = molde.replace(/\{(\w+)\}/g, (m, slot) => {
      if (!G[slot]) return m;
      const t = caosGerSlot(g, slot, G[slot], ctx, usadas, ja);
      if (t == null) falhou = true;
      else caosGerPalavras(t).forEach((w) => ja.add(w));
      return t || "";
    });
    if (falhou) continue;
    txt = caosGerPreenche(montada, ctx.vars)
      .replace(/\s+/g, " ")
      .trim()
      .replace(/(^|[.!?]\s+)([a-zà-ú])/g, (m, a, b) => a + b.toUpperCase());
    if (/\{\w+\}/.test(txt) || caosHasProfanity(txt, [ctx.vars.nome || ""])) {
      txt = "";
      continue;
    }
    if (txt.length > CAOS_GER_MAX && tent < 5) {
      txt = "";
      continue;
    }
    // impressão curta da fala (a memória salva fica pequena)
    let h = 0;
    for (const ch of txt) h = (h * 31 + ch.charCodeAt(0)) | 0;
    const chave = (h >>> 0).toString(36);
    if (ult.includes(chave) && tent < 5) continue;
    // respeita o 👎: fala montada que a mesa não curtiu não volta
    const nota = caosRatingsLoad()["gerador|" + g + "|" + txt.slice(0, 49)];
    if (nota && nota.down > nota.up && tent < 5) {
      txt = "";
      continue;
    }
    ult.push(chave);
    while (ult.length > CAOS_GER_ULTIMAS) ult.shift();
    break;
  }
  caosGerGravar();
  if (!txt) return "";
  txt = CAOS_PREFIXO + txt;
  caosGerConta[g] = (caosGerConta[g] || 0) + 1;
  caosLastPick = { bank: "gerador." + g, key: "gerador|" + g + "|" + txt.slice(CAOS_PREFIXO.length, CAOS_PREFIXO.length + 49), text: txt };
  caosLog("gerador", g + " · " + [...ctx.tags].filter((t) => !/^(temper_|estado_)/.test(t)).join(", "));
  return txt;
}
