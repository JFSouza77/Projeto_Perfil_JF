/* =========================================================================================================
   Temporadas (pedido do JF, 30/10/2026; plano em docs/Temporadas.md)
   O jogo olha a data do aparelho e entra no clima da época (Natal, Halloween, Carnaval, aniversário do JF...).
   Este arquivo é só o motor: qual temporada vale numa data, a opção de ligar/desligar (Acessibilidade) e o modo
   de teste (?temporada=natal na URL). O visual, as falas, a lojinha e as cartas de cada temporada usam
   temporadaAtual() e a marca data-temporada no <html>.
   · Datas móveis: Carnaval (sábado até a Quarta de Cinzas) e Páscoa (Sexta-feira Santa ao domingo) saem da
     Páscoa; Dia das Mães e dos Pais são o 2º domingo de maio e de agosto; Black Friday é a sexta depois da 4ª
     quinta de novembro (até o domingo).
   · Duas juntas: ganha a de um dia só, depois a janela curta, depois a longa (Dia dos Namorados ganha da Festa
     Junina; Ano Novo ganha do Natal no dia 31).
   · Online: cada aparelho segue a própria data; pra pontuação, vale a do host (temporadaAtual(dataDoHost)).
   ========================================================================================================= */
const TEMPORADA_TESTE_KEY = "perfil_jf_temporada_teste";
// prio: 2 = um dia só, 1 = janela curta (até uma semana), 0 = janela longa
const TEMPORADAS = [
  { id: "anoNovo", nome: "Ano Novo", selo: "Edição de Ano Novo", emoji: "🎆", prio: 2, vale: (d, m, a) => (m === 12 && d === 31) || (m === 1 && d === 1) },
  { id: "aniversario", nome: "Aniversário do criador", selo: "Edição de aniversário do criador", emoji: "🎂", prio: 2, vale: (d, m) => m === 1 && d === 2 },
  { id: "carnaval", nome: "Carnaval", selo: "Edição de Carnaval", emoji: "🎭", prio: 1, vale: (d, m, a, t) => temporadaEntre(t, temporadaPascoa(a), -50, -46) },
  { id: "mulher", nome: "Dia da Mulher", selo: "Edição Dia da Mulher", emoji: "💐", prio: 2, vale: (d, m) => m === 3 && d === 8 },
  { id: "pascoa", nome: "Páscoa", selo: "Edição de Páscoa", emoji: "🐣", prio: 1, vale: (d, m, a, t) => temporadaEntre(t, temporadaPascoa(a), -2, 0) },
  { id: "maes", nome: "Dia das Mães", selo: "Edição Dia das Mães", emoji: "💐", prio: 2, vale: (d, m, a, t) => temporadaMesmoDia(t, temporadaDomingo(a, 4, 2)) },
  { id: "namorados", nome: "Dia dos Namorados", selo: "Edição Dia dos Namorados", emoji: "💘", prio: 2, vale: (d, m) => m === 6 && d === 12 },
  { id: "junina", nome: "Festa Junina", selo: "Edição Junina", emoji: "🌽", prio: 0, vale: (d, m) => m === 6 },
  { id: "pais", nome: "Dia dos Pais", selo: "Edição Dia dos Pais", emoji: "👔", prio: 2, vale: (d, m, a, t) => temporadaMesmoDia(t, temporadaDomingo(a, 7, 2)) },
  { id: "folclore", nome: "Folclore", selo: "Edição do Folclore", emoji: "🌳", prio: 2, vale: (d, m) => m === 8 && d === 22 },
  { id: "independencia", nome: "Independência", selo: "Edição da Independência", emoji: "🇧🇷", prio: 2, vale: (d, m) => m === 9 && d === 7 },
  { id: "criancas", nome: "Dia das Crianças", selo: "Edição Dia das Crianças", emoji: "🧸", prio: 1, vale: (d, m) => m === 10 && d >= 6 && d <= 12 },
  { id: "halloween", nome: "Halloween", selo: "Edição Halloween", emoji: "🎃", prio: 1, vale: (d, m) => m === 10 && d >= 20 },
  { id: "blackfriday", nome: "Black Friday", selo: "Edição Black Friday", emoji: "🏷️", prio: 1, vale: (d, m, a, t) => temporadaEntre(t, temporadaBlackFriday(a), 0, 2) },
  { id: "natal", nome: "Natal", selo: "Edição de Natal", emoji: "🎄", prio: 0, vale: (d, m) => m === 12 && d <= 30 },
];
// Domingo de Páscoa (calendário gregoriano, algoritmo de Meeus/Jones/Butcher), como Date local ao meio-dia
function temporadaPascoa(a) {
  const b = Math.floor(a / 100),
    c = a % 100,
    g = a % 19,
    h = (19 * g + b - Math.floor(b / 4) - Math.floor((8 * b + 13) / 25) + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * (b % 4) + 2 * i - h - k) % 7,
    m = Math.floor((g + 11 * h + 22 * l) / 451),
    mes = Math.floor((h + l - 7 * m + 114) / 31),
    dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(a, mes - 1, dia, 12);
}
// n-ésimo domingo do mês (mes 0 = janeiro)
function temporadaDomingo(a, mes, n) {
  const d = new Date(a, mes, 1, 12);
  d.setDate(1 + ((7 - d.getDay()) % 7) + 7 * (n - 1));
  return d;
}
// sexta depois da 4ª quinta de novembro
function temporadaBlackFriday(a) {
  const d = new Date(a, 10, 1, 12);
  d.setDate(1 + ((4 - d.getDay() + 7) % 7) + 21 + 1);
  return d;
}
function temporadaDiaN(t) {
  return Math.round(new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12).getTime() / 864e5);
}
function temporadaMesmoDia(t, ref) {
  return temporadaDiaN(t) === temporadaDiaN(ref);
}
function temporadaEntre(t, ref, de, ate) {
  const x = temporadaDiaN(t) - temporadaDiaN(ref);
  return x >= de && x <= ate;
}
// A temporada de uma data (sem olhar a opção nem o modo de teste), ou null
function temporadaDe(data) {
  const t = data instanceof Date ? data : new Date(data);
  if (isNaN(t)) return null;
  const d = t.getDate(),
    m = t.getMonth() + 1,
    a = t.getFullYear();
  let melhor = null;
  TEMPORADAS.forEach((s) => {
    try {
      if (s.vale(d, m, a, t) && (!melhor || s.prio > melhor.prio)) melhor = s;
    } catch (e) {}
  });
  return melhor;
}
function temporadaPorId(id) {
  return TEMPORADAS.find((s) => s.id === id) || null;
}
// Modo de teste (só pra desenvolvimento): ?temporada=natal na URL, ou a chave no aparelho. "nenhuma" = fora de época
function temporadaForcada() {
  try {
    const u = new URLSearchParams(location.search).get("temporada");
    const v = u || JFStore.getItem(TEMPORADA_TESTE_KEY);
    if (!v) return undefined;
    return v === "nenhuma" ? null : temporadaPorId(v) || undefined;
  } catch (e) {
    return undefined;
  }
}
function temporadasLigadas() {
  return typeof acessCfg === "undefined" || acessCfg.temporadas !== false;
}
// A temporada que vale agora neste aparelho (ou na data dada, por exemplo a do host), ou null
function temporadaAtual(data) {
  if (!temporadasLigadas()) return null;
  const f = temporadaForcada();
  if (f !== undefined) return f;
  return temporadaDe(data || new Date());
}
// Marca a temporada no <html> (data-temporada="natal"); o visual de cada temporada pendura nisso (11-temporadas.css):
// uma camada de enfeites atrás do conteúdo (não pega toque nem cobre texto) e o selo na splash.
function temporadaAplicar() {
  try {
    const t = temporadaAtual();
    const h = document.documentElement;
    if (t) h.dataset.temporada = t.id;
    else delete h.dataset.temporada;
    if (!document.body) return;
    if (!document.getElementById("temporadaEnfeite")) {
      const e = document.createElement("div");
      e.id = "temporadaEnfeite";
      e.className = "tmp-enfeite";
      e.setAttribute("aria-hidden", "true");
      e.innerHTML = '<div class="tmp-neve"></div><div class="tmp-luzes"></div>';
      document.body.prepend(e);
    }
    const log = document.getElementById("splashBuildLog");
    let selo = document.getElementById("splashTemporada");
    if (!selo && log) {
      selo = document.createElement("div");
      selo.id = "splashTemporada";
      selo.className = "splash-temporada";
      log.parentNode.insertBefore(selo, log);
    }
    if (selo) {
      selo.textContent = t ? t.emoji + " " + t.selo : "";
      selo.hidden = !t;
    }
  } catch (e) {}
}

/* Temporadas · item 4: o C.A.O.S. bonzinho do Natal (e do Ano Novo). Pedido do JF em 30/10/2026:
   - Modo C.A.O.S.: o 🎁 Presente pode sair até 3 vezes por partida (fora da temporada, 1) e também pros favoritos
     dele, mesmo quem não precisa ("toma um pontinho extra").
   - Joia de presente: chance bem baixa, 1 por partida, só onde joias contam pra vencer (Joias, Express, Moda da Casa
     com joias). Dá uma joia que falta e respeita a trava de 2 por rodada. NUNCA a 4ª joia: quem já tem 3 não ganha.
     Ele pode ajudar, mas nunca entregar a vitória. */
const TEMPORADA_BONZINHA = ["natal", "anoNovo"];
const TEMPORADA_PRESENTES_MAX = 3;
const TEMPORADA_JOIA_CHANCE = 0.03; // por carta virada, até sair uma na partida
const TEMPORADA_PONTINHO_PC = 5; // o "pontinho extra" do Modo C.A.O.S.
function temporadaBonzinha() {
  const t = typeof temporadaAtual === "function" ? temporadaAtual() : null;
  return !!t && TEMPORADA_BONZINHA.includes(t.id);
}
function temporadaFalasDe(chave) {
  const t = typeof temporadaAtual === "function" ? temporadaAtual() : null;
  const b = t && REACTIVE_VOICE.temporada && REACTIVE_VOICE.temporada[t.id];
  return (b && b[chave]) || (REACTIVE_VOICE.temporada && REACTIVE_VOICE.temporada.natal && REACTIVE_VOICE.temporada.natal[chave]) || [];
}
// quem pode ganhar a joia de presente agora (nunca quem já tem 3; nunca quem bateu a trava da rodada)
function temporadaJoiaCandidatos() {
  if (CURRENT_FORMAT === "equipe" || !gemsEnabled() || !gemsCountForWin() || gemWinner) return [];
  const cats = CURRENT_MODE === "express" && expressSelectedCategories && expressSelectedCategories.length ? expressSelectedCategories : currentGemCategories();
  const out = [];
  players.forEach((p) => {
    const g = p.gems || {};
    if (gemTotal(p) >= GEMS_TO_WIN - 1) return; // nunca a 4ª joia
    if (joiasComTrava() && (joiasRodada[String(p.id)] || 0) >= JOIAS_POR_RODADA) return;
    const faltam = cats.filter((c) => (g[c] || 0) < gemCapFor());
    if (faltam.length) out.push({ p, faltam });
  });
  return out;
}
function temporadaJoiaPresenteTalvez(forcar) {
  if (!temporadaBonzinha() || caosSilenced || gameEnded || !currentCard) return null;
  if (!forcar && sorteioRegra() >= TEMPORADA_JOIA_CHANCE) return null;
  const cands = temporadaJoiaCandidatos();
  if (!cands.length || !caosOncePerMatch("temporada_joia")) return null;
  const fav = typeof caosVinc !== "undefined" && caosVinc && caosVinc.fav;
  const escolha = cands.find((c) => c.p.name === fav) || cands[Math.floor(sorteioRegra() * cands.length)];
  const cat = escolha.faltam[Math.floor(sorteioRegra() * escolha.faltam.length)];
  const p = escolha.p;
  p.gems = p.gems || {};
  p.gems[cat] = (p.gems[cat] || 0) + 1;
  if (joiasComTrava()) joiasRodada[String(p.id)] = (joiasRodada[String(p.id)] || 0) + 1;
  caosLog("temporada", `🎁 joia de presente de Natal: ${p.name} ganhou ${cat}`);
  const msg = getRandomReaction(temporadaFalasDe("presenteJoia"), p.name, (CATEGORY_LABELS[cat] || cat).toLowerCase());
  if (msg) showToastMessage(msg);
  try {
    render();
    saveGameState();
  } catch (e) {}
  return { id: p.id, cat };
}
