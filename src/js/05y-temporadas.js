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
