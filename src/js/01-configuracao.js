/* ÍNDICE DO SCRIPT
  1. Configuração (constantes de regra, limites, tempos e chaves de salvamento)
  2. Estado global (variáveis da partida e do C.A.O.S.)
  3. Regras (vitória, pontos, joias, tabuleiro, baralho, equipes)
  4. Turno e rodada (sorteio de carta, dicas, acerto/erro, especiais, timers, pausa, início e fim)
  5. Tela (renderização, menus, cadastro, tutorial, painéis, efeitos)
  6. Voz, som e vibração
  7. C.A.O.S. (falas, humor, rostos, memória, decisões)
  8. Salvamento e memória (armazenamento, salvar/carregar, exportar/importar, fichas)
  9. Utilitários (texto, cores, sorteio, números)
  10. Dados (cartas, falas do C.A.O.S., rostos, rótulos, tabelas)
  11. iniciar(): monta tudo e liga a tela (roda por último)
*/

/* ======================================================================
 * 1. CONFIGURAÇÃO (CONSTANTES DE REGRA, LIMITES, TEMPOS E CHAVES DE SALVAMENTO)
 * ====================================================================== */

// Liga os avisos no console (o build da versão compacta troca para false).
const DEBUG = true;
// Valores de temporizador vindos do save (que pode ter sido editado à mão).
const TIMER_KINDS = ["pick", "response", "special", "turn"];
const SAVE_VERSION = 11;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
const CAOS_EMO_GRAVE = {
  erroEscalada: 1,
  juizMestre: 1,
  agonia15Dicas: 1,
  erroSeguido: 0.5,
  absurdo: 0.5,
  sequenciaAcertos: 1,
  joia: 1,
  vitoria: 1,
  recorde: 1,
};
const JOG_EMOS = {
  fogo: { i: "😎", t: "em chamas" },
  tilt: { i: "😡", t: "tiltado", gentil: "😤" },
  palhaco: { i: "🤡", t: "palhaçada registrada", gentil: "🙈" },
  sumido: { i: "😴", t: "sumido" },
  lider: { i: "👑", t: "folgado na liderança" },
  pressao: { i: "😰", t: "sob pressão" },
};
const PLAYER_COLORS = [
  "#e94560",
  "#4ecdc4",
  "#ffd166",
  "#a78bfa",
  "#38bdf8",
  "#fb923c",
  "#ff9ecd",
  "#8b5e3c",
  "#9ca3af",
  "#ffffff",
  "#2b2b2b",
  "#39ff14",
  "#3d8b5f",
  "#dc2626",
  "#6366f1",
  "#facc15",
  "GRAD_PESSEGO",
  "GRAD_CANDY",
  "GRAD_MINT",
  "GRAD_FIRE",
  "GRAD_ICE",
  "GRAD_GALAXY",
  "GRAD_LAVA",
  "GRAD_ROYAL",
  "GRAD_TROPICAL",
  "GRAD_ONYX",
  "RGB",
];
const GRADIENTS = {
  GRAD_SUNSET: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  GRAD_OCEAN: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
  GRAD_NEON: "linear-gradient(135deg, #f83600 0%, #f9d423 100%)",
  GRAD_CANDY: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  GRAD_MINT: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  GRAD_FIRE: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  GRAD_ICE: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
  GRAD_TOXIC: "linear-gradient(135deg, #b8ff00 0%, #00ff85 100%)",
  GRAD_GALAXY: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  GRAD_LAVA: "linear-gradient(135deg, #f12711 0%, #f5af19 100%)",
  GRAD_ROYAL: "linear-gradient(135deg, #5b8def 0%, #b47cff 100%)",
  GRAD_TROPICAL: "linear-gradient(135deg, #22d3ee 0%, #a3e635 100%)",
  GRAD_PESSEGO: "linear-gradient(135deg, #ffd3a5 0%, #fd6585 100%)",
  GRAD_PRINCESA: "linear-gradient(135deg, #ff8fc7 0%, #ffc2e0 55%, #ff7eb6 100%)",
  GRAD_ONYX: "linear-gradient(135deg, #000000 0%, #2a2a3d 50%, #000000 100%)",
};
const AVATARS = [
  "😎",
  "🤠",
  "👽",
  "🤖",
  "👻",
  "🦄",
  "🦁",
  "🐉",
  "🧙‍♂️",
  "🥷",
  "🕵️‍♂️",
  "👸",
  "🦸",
  "🧛",
  "🧜",
  "🧟",
  "⚽",
  "💩",
  "🍦",
  "🃏",
  "🍺",
  "👶",
  "🛸",
  "🎲",
  "🎭",
  "🔥",
  "🥸",
  "🦉",
  "🐙",
  "🍕",
];
const AVATARS_EXTRA = ["💀", "😈", "🤡", "🦈", "🐺", "🦅", "🐍", "👑", "🏆", "🎸", "🧠", "🥶", "🤑", "🦍"];
const AVATARS_KIDS = ["🐶", "🐱", "🐰", "🦊", "🐼", "🐸", "🦖", "🐢", "🦋", "🚀", "🧸", "🎈", "🍭", "🌈", "⭐", "🐧"];
const AVATAR_EXCLUSIVE = ["😎", "👸"];
const OWNER_ANNE_RE = /^an{1,2}(e|izinha|izinho)(zinha|zinho|zona)?([^a-z]|$)/;
const OWNER_JF_RE = /^jf([^a-z]|$)/;
const CATEGORY_LABELS = {
  ANO: "um ano",
  PESSOA: "uma pessoa",
  LUGAR: "um lugar",
  COISA: "uma coisa",
  ANIMAL: "um animal",
};
const JUNIOR_CARD_LIMIT = 200;
const CLASSICO_MIX_OS = 0.05;
const CLASSICO_MIX_JR = 0.05;
const OLDSCHOOL_META_CARTAS = 200;
const TEAM_INFO = {
  red: { label: "Vermelha", color: "#e94560", emoji: "🔴" },
  blue: { label: "Azul", color: "#38bdf8", emoji: "🔵" },
  green: { label: "Verde", color: "#10b981", emoji: "🟢" },
};
const AGE_BRACKETS = [
  { id: "crianca", label: "6-12", cor: "#22c55e" },
  { id: "pre", label: "12-16", cor: "#f97316" },
  { id: "jovem", label: "16-18", cor: "#ef4444" },
  { id: "adulto", label: "18+", cor: "#e5e7eb" },
];
// Chance de cada categoria sair no Hardcore (ANIMAL conta como COISA).
const CATEGORY_WEIGHTS_HARDCORE = { ANO: 0.3, PESSOA: 0.3, LUGAR: 0.2, COISA: 0.2 };
const BONUS_HOUSE_INTERVAL = 10;
const PALPITE_STOCK = 5;
const PICK_TIME_LIMIT = 30;
const SPECIAL_TIME_LIMIT = 15;
const PAUSA_EXPIRA_MS = 5 * 60 * 1e3;
const CAOS_FATIGUE_CHANCE = 1;
const CAOS_TEMPERAMENTOS = {
  normal: { nome: "normal", t: 0, c: 0 },
  sensivel: { nome: "sensível à demora", t: 0.5, c: 0, pac: 1.6 },
  generoso: { nome: "generoso", t: -0.5, c: 1.5 },
  rabugento: { nome: "rabugento", t: 1, c: -1.2 },
  eletrico: { nome: "elétrico", t: 0.8, c: 1, ruido: 1.8 },
};
const CAOS_MOOD_ALVO = {
  animado: { tensao: 3, calor: 8 },
  normal: { tensao: 5, calor: 5 },
  esquentou: { tensao: 6, calor: 7 },
  impaciente: { tensao: 7, calor: 4 },
  cansado: { tensao: 4.5, calor: 2 },
};
const CAOS_VOICE_MATRIZ = {
  frustrado: [1.03, 0.92],
  orgulhoso: [1.08, 1.12],
  entediado: [0.94, 0.92],
  desafiante: [1.1, 1.06],
};
const CAOS_VOICE_EMO = {
  calmo: [1, 1],
  orgulho: [1.06, 1.1],
  raiva: [1.04, 0.95],
  deboche: [1.02, 1.03],
  tedio: [0.94, 0.92],
  carinho: [0.98, 1.06],
  desafio: [1.06, 1.04],
  pensando: [0.98, 1],
  preocupado: [1.03, 1.03],
  festa: [1.1, 1.12],
  surpresa: [1.08, 1.1],
  triste: [0.93, 0.9],
  furia: [1.08, 0.92],
  julgando: [0.97, 0.97],
  espiando: [0.96, 0.98],
  recompondo: [0.97, 0.98],
  medo: [1.08, 1.1],
  ansiedade: [1.08, 1.05],
  vergonha: [0.96, 1.05],
  nojo: [0.95, 0.93],
  nostalgia: [0.94, 0.96],
  alivio: [0.97, 1],
};
const CAOS_FAMILIA_ALVO = {
  passivoAgressivo: { tensao: 7, calor: 1 },
  decepcaoProfunda: { tensao: 8, calor: 2 },
  otimismoIrritado: { tensao: 8, calor: 7 },
  alegriaAnsiosa: { tensao: 9, calor: 8 },
  tecnicoTI: { tensao: 4, calor: 1 },
  narradorEsportivo: { tensao: 8, calor: 9 },
  malandro: { tensao: 5, calor: 8 },
  irritado: { tensao: 9, calor: 4 },
  irritacaoEsquecida: { tensao: 8, calor: 4 },
  timidoAgressivo: { tensao: 8, calor: 3 },
  culpaJF: { tensao: 7, calor: 4 },
  quebraParede: { tensao: 6, calor: 5 },
  autodebate: { tensao: 6, calor: 3 },
  piadaRuim: { tensao: 6, calor: 3 },
  carinho: { tensao: 2, calor: 9 },
  carente: { tensao: 3, calor: 7 },
  cumpliceMestre: { tensao: 3, calor: 7 },
  yandere: { tensao: 4, calor: 8 },
  jfMeta: { tensao: 3, calor: 7 },
  recadoMestre: { tensao: 3, calor: 6 },
  distraido: { tensao: 4, calor: 2 },
  piadaEsquecida: { tensao: 4, calor: 2 },
  desanda: { tensao: 5, calor: 2 },
  semContexto: { tensao: 4, calor: 2 },
  autoconsciencia: { tensao: 4, calor: 3 },
  mudancaAssunto: { tensao: 4, calor: 3 },
  tristezaIrritada: { tensao: 8, calor: 2 },
  sarcasmoCarente: { tensao: 3, calor: 8 },
  confusaoOtimista: { tensao: 6, calor: 6 },
};
const CAOS_OS_FAMILIAS_BOBAS = [
  "piadaRuim",
  "piadaEsquecida",
  "semContexto",
  "desanda",
  "distraido",
  "yandere",
  "carente",
  "timidoAgressivo",
  "microMeta",
  "mudancaAssunto",
  "alegriaAnsiosa",
];
const CAOS_MARCADO_REVELA_CHANCE = 0.12;
const CAOS_CONTINUIDADE_CHANCE = { 2: 0.15, 3: 0.3 };
const CAOS_CARDMEM_KEY = "perfil5_caos_cardmem";
const CAOS_CARDMEM_ALPHA = 0.25;
const CAOS_MIN_LEITURA_MS = 2200;
const CAOS_MOOD_PIORA = ["normal", "esquentou", "impaciente", "cansado"];
const GEMS_TO_WIN = 4;
const GEM_CLUE_LIMIT = { classico: 5, hardcore: 3, express: 3, junior: 5, oldschool: 5 };
const GEM_INFO = {
  ANO: { name: "ANO", letter: "A", color: "#3b82f6" },
  PESSOA: { name: "PESSOA", letter: "P", color: "#ef4444" },
  LUGAR: { name: "LUGAR", letter: "L", color: "#10b981" },
  COISA: { name: "COISA", letter: "C", color: "#a855f7" },
  ANIMAL: { name: "ANIMAL", letter: "A", color: "#f59e0b" },
};
// Selo da categoria na carta aberta (ícone + nome, na cor da categoria).
const CAT_SELO_ICONE = { ANO: "📅", PESSOA: "🧑", LUGAR: "📍", COISA: "📦", ANIMAL: "🐾" };
const WIN_CONDITIONS = {
  casa: {
    icon: "🏠",
    label: "A Moda da Casa",
    hint: "No começo da partida o C.A.O.S. sorteia o modo da mesa: Tabuleiro, Pontos ou Joias. Vale para todo mundo.",
  },
  joias: {
    icon: "💎",
    label: "Só Joias",
    hint: "Vence quem juntar as 4 joias. O tabuleiro anda, mas chegar no fim não vence.",
  },
  pontos: {
    icon: "🔢",
    label: "Pontos",
    hint: "Vence quem somar a meta em PONTOS. Sem joias; o tabuleiro é só enfeite.",
  },
  tabuleiro: {
    icon: "🎲",
    label: "Clássico",
    hint: "Estilo Perfil de tabuleiro: vence quem chegar primeiro na casa final. Sem joias; pontos não contam.",
  },
};
const GEMS_MIN_PLAYERS = 4;
// "A Moda da Casa": no começo da partida o C.A.O.S. sorteia UM destes modos para a mesa toda.
const CASA_MODOS = ["tabuleiro", "pontos", "joias"];
// Meta de pontos da Moda da Casa (quando o sorteio cai em Pontos), por número de jogadores.
// Simulação de equilíbrio (sim.js, 10 mil partidas por mesa): 200 deixa Pontos com a mesma
// duração do Tabuleiro em qualquer mesa (a tabela 200..400 deixava Pontos até 141% mais longo).
const CASA_META_PONTOS = { 2: 200, 3: 200, 4: 200, 5: 200, 6: 200 };
// Na Moda da Casa sorteada em Joias, a joia vale com 1 dica real a mais que o limite do modo
// (Clássico: até 6). Simulação: assim Joias dura o mesmo que Tabuleiro e Pontos (diferença <= 6%).
const CASA_JOIA_DICAS_EXTRA = 1;
// Último modo sorteado (para não repetir na partida seguinte).
const CASA_ULTIMO_KEY = "perfil5_casa_ultimo";
// Visual do jogo neste aparelho: "0" = Modo Claro; sem valor ou "1" = Modo Noturno (padrão).
const NOTURNO_KEY = "perfil5_noturno";
// Risadinha do C.A.O.S. nas zoeiras: chance por fala, bancos de zoeira e as risadas.
const CAOS_RISADA_CHANCE = 0.2;
const CAOS_RISADA_BANCOS =
  /^(erro|esgotouComResposta|especialVoltou|especialPercaVez|fominha|dicaRepetida|acido|nivelZero|desistiu|implicancia|duploPadrao|bolaCristalErro|absurdo)/;
const CAOS_RISADAS = [
  "HAHAHA!",
  "Hahaha.",
  "Ha!",
  "Hehehe...",
  "HA! Trouxa!",
  "Hahaha, essa foi longe.",
  "Ha, se lascou!",
];
const CAOS_RISADAS_JUNIOR = ["Hihihi!", "Hehe!", "Hahaha!", "Ops, hihi."];
// Trava de joias: no máximo esta quantidade por jogador (ou equipe) em cada rodada,
// sempre que o modo em jogo for Joias (Moda da Casa sorteada em Joias ou "Só Joias").
const JOIAS_POR_RODADA = 2;
// Última rodada: quando alguém bate a meta, a rodada termina para todos terem jogado o
// mesmo número de vezes (menos no Express). Vence quem estiver na frente no fim da rodada.
const ULTIMA_RODADA = true;
const PALPITE_MODES_OK = ["classico", "junior", "oldschool"];
// Emblema do verso da carta: anéis neon, losangos dourados, o "P" dentro do "?" e o olho do C.A.O.S.
const VERSO_EMBLEMA_SVG = `<svg class="back-icon verso-emblema" viewBox="0 0 160 160" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="vsGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c084fc"/><stop offset="0.55" stop-color="#8b5cf6"/><stop offset="1" stop-color="#e879f9"/></linearGradient>
    <linearGradient id="vsOuro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#d4a017"/></linearGradient>
  </defs>
  <circle cx="80" cy="80" r="66" fill="none" stroke="#8b5cf6" stroke-opacity=".6" stroke-width="1.5"/>
  <circle cx="80" cy="80" r="57" fill="none" stroke="#e9c46a" stroke-opacity=".5" stroke-width="1"/>
  <path d="M80 2 l5 9 -5 9 -5 -9z M80 140 l5 9 -5 9 -5 -9z M2 80 l9 -5 9 5 -9 5z M140 80 l9 -5 9 5 -9 5z" fill="url(#vsOuro)"/>
  <path d="M55 60 A26 26 0 1 1 92 83 Q81 90 81 102" fill="none" stroke="url(#vsGrad)" stroke-width="12" stroke-linecap="round"/>
  <path d="M55 60 A26 26 0 1 1 92 83 Q81 90 81 102" fill="none" stroke="#fde68a" stroke-opacity=".55" stroke-width="1" stroke-linecap="round"/>
  <text class="vs-p" fill="#7c3aed" x="80" y="70" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="700">P</text>
  <g transform="translate(81 121)"><ellipse rx="11" ry="7" fill="url(#vsGrad)"/><ellipse rx="11" ry="7" fill="none" stroke="#fde68a" stroke-opacity=".7" stroke-width="1"/><circle r="3" fill="#fde68a"/></g>
</svg>`;
const DECK_LIMITE = { classico: 400, hardcore: 300, oldschool: 240, junior: 250, express: 50 };
const CAOS_VOICE_OK =
  typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
const CAOS_MASTER_RE =
  /\bmestre\b[^.!?]*?(?:^|[\s,])(?:l[eê]|leia|ler|lendo|diga|dizer|diz|fale|fala|repita|repete|passe|entregue|mostre|avise|conte)(?=[\s,.!?…]|$)|n[aã]o (?:leia|l[eê])[^.!?]*voz alta|(?:^|[\s,])(?:leia|l[eê]|ler|lendo|lido|fale|diga|repita|anuncie)\s[^.!?]{0,40}em voz alta/i;
// Vozes masculinas conhecidas (iPhone: Felipe, Eddy, Reed, Rocko, Grandpa; Windows: Daniel, Antonio...).
const CAOS_MALE_VOICE_RE =
  /felipe|ant[oô]nio|daniel|ricardo|jorge|cristiano|donato|humberto|j[uú]lio|val[eé]rio|luciano|rodrigo|f[aá]bio|eddy|\breed\b|rocko|grandpa|masculin|\bmale\b/i;
// Vozes femininas conhecidas: perdem pontos na escolha automática.
const CAOS_FEMALE_VOICE_RE =
  /luciana|joana|catarina|francisca|thalita|maria|vit[oó]ria|let[ií]cia|raquel|\bflo\b|grandma|sandy|shelley|google portugu|female|feminin/i;
const CAOS_VOICE_STYLE = {
  animado: [1.06, 1.05],
  esquentou: [1.04, 1.04],
  normal: [1, 1],
  impaciente: [1, 0.98],
  cansado: [0.98, 0.97],
};
const CAOS_HIST_KEY = "perfil200_caos_hist";
const CAOS_JUNIOR_BLOCK_RE =
  /embaixo da cama|puxar o p[ée]|dane-se|burrinh|\bsons[ao]\b|fuzil|tiro foi|dilma|presidenta|mulher sapiens|mandioca|estocar vento|pacto com o al[ée]m|invocar uma entidade|sangue nos olhos|m[áa]rcia sensitiva|processo bonito|exposed|\binss\b|pneu queimado|casos de fam[íi]lia|tela azul da morte|lado sombrio|shinigami|round 6|black mirror|john wick|bodega|cagad/i;
const CAOS_RATINGS_KEY = "perfil5_caos_avaliacoes";
const CAOS_MATCHLOG_MAX = 150;
const CAOS_PALAVROES = [
  "porra",
  "caralh\\w*",
  "cu",
  "cuzao",
  "fdp",
  "pqp",
  "vsf",
  "vtnc",
  "tnc",
  "krl",
  "puta",
  "puto",
  "putaria",
  "arrombad[oa]s?",
  "buceta",
  "bosta",
  "merda",
  "foda-se",
  "fodid[oa]s?",
  "foder",
  "fodeu",
  "fode",
  "viad[oa]s?",
  "piranha",
  "cachorra",
  "cavala",
  "vagabund[oa]s?",
  "escrot[oa]s?",
  "fuck\\w*",
  "motherfuck\\w*",
  "bitch\\w*",
  "shit",
  "shits",
  "shitty",
  "asshole",
  "pussy",
  "whore",
  "slut",
];
const CAOS_EMOJIS = {
  erro: ["😬", "🫠", "🙃", "🤦", "😵‍💫", "🥴", "😮‍💨", "🫣", "🤨"],
  acerto: ["🎯", "🔥", "👏", "🤯", "💪", "🙌", "🥳", "⚡"],
  tempo: ["⏳", "⏰", "🐌", "☕", "😴", "🍿", "🥱"],
  apresentacao: ["🤖", "👋", "🧠", "🎙️", "👀", "📡"],
  espontaneo: ["💬", "🤔", "🎈", "👀", "🫥"],
  carinho: ["🥰", "💖", "🫶", "😳"],
  geral: ["🤖", "💬", "😏", "👀"],
};
const CAOS_EMOJI_FAMILIA = {
  distraido: ["🦋", "🤔", "🫥"],
  mudancaAssunto: ["🌀", "🤪"],
  hiperfoco: ["🔍", "🧐"],
  timido: ["🥺", "😳", "👉👈"],
  timidoAgressivo: ["😤", "🥺"],
  irritado: ["😠", "😤", "💢"],
  irritacaoEsquecida: ["🤷", "😅"],
  matematica: ["🧮", "➕", "🤯"],
  piadaEsquecida: ["🫥", "🤡"],
  desanda: ["🌀", "😵‍💫"],
  absurdo: ["🥔", "🚗", "🦫", "🐧", "🦆"],
  pseudoCiencia: ["🔬", "📊", "🧪"],
  nerd: ["🎮", "🧙", "🕹️"],
  cozinha: ["🍿", "🍰", "☕", "🥪"],
  memeBrasil: ["🇧🇷", "📺", "🎭"],
  internetAntiga: ["💾", "📼", "🖥️"],
  giriasAntigas: ["🕺", "📻", "💿"],
  microMeta: ["👀", "🫢"],
  trabalho: ["💼", "🏖️", "📎"],
  carinho: ["💖", "🥹", "🫶"],
  carente: ["🥲", "🫥"],
  yandere: ["👁️", "💘"],
  jfMeta: ["👨‍💻", "🫡"],
  culpaJF: ["👉", "👨‍💻"],
  quebraParede: ["🎙️", "🎭"],
  cumpliceMestre: ["🤝", "🤫"],
  recadoMestre: ["🤫", "✉️"],
  leituraConsciente: ["👁️", "📖"],
  protocolo: ["🚨", "📋"],
  autodebate: ["🗣️", "🤦"],
  semContexto: ["❓", "🫠"],
  metaBanco: ["📚", "🔁"],
  piadaRuim: ["🤖", "😏"],
  dilma: ["🎤", "🌬️", "🥔"],
  cinema: ["🎬", "🍿", "🎞️"],
  series: ["📺", "🍿", "📼"],
  anime: ["🍥", "⚡", "🌸"],
  games: ["🎮", "🕹️", "🎲"],
  musicaInternacional: ["🎸", "🎤", "🎧"],
  mpb: ["🎶", "🥁", "🇧🇷"],
  referenciaObscura: ["🧠", "🕵️", "🔮"],
  autoconsciencia: ["🔁", "🤔"],
};
const CAOS_GIRIAS = [
  "aura",
  "gag",
  "cringe",
  "mood",
  "crush",
  "random",
  "npc",
  "skill issue",
  "main character",
  "red flag",
  "plot twist",
  "vibe",
  "vibes",
  "delulu",
  "rizz",
  "sigma",
  "brainrot",
  "camp",
  "f no chat",
  "farmar",
];
// Falas do C.A.O.S. Formato de cada entrada:
//   "texto"            -> fala simples; o prefixo "[C.A.O.S.] " é colocado na hora (caosFalasMontar).
//   "texto {nome}"     -> {nome} vira o 1º argumento (normalmente o nome do jogador).
//   (a, b) => `...`    -> fala com lógica ou vários argumentos: usada como está (já traz o prefixo).
// Exceção: os grupos listados em CAOS_FALAS_LITERAIS guardam texto pronto e são usados como estão.
const CAOS_PREFIXO = "[C.A.O.S.] ";
const CAOS_FALAS_LITERAIS = [
  "transicaoPiorando",
  "transicaoMelhorando",
  "familiasSorteio",
  "ausentes.ambos",
  "ausentes.anne",
  "ausentes.jf",
  "pausaExpirada.continuou",
  "pausaExpirada.recomecou",
  "oldSchool.nostalgia",
  "naoCurti",
  "silencio",
  "iniciante.fimDasDicas",
  "caosCortado.semNome",
];
const CAOS_BIP = {
  raiva: [330, 277],
  furia: [262, 220],
  festa: [988, 1319],
  orgulho: [880, 1175],
  triste: [523, 440],
  carinho: [784, 988],
  surpresa: [659, 1047],
  preocupado: [587, 554],
  tedio: [440, 415],
  deboche: [698, 622],
  julgando: [494, 494],
  pensando: [622, 698],
  desafio: [740, 988],
  medo: [784, 740],
  nojo: [392, 370],
  ansiedade: [698, 740],
  vergonha: [659, 587],
  alivio: [587, 659],
  inveja: [415, 392],
  nostalgia: [494, 440],
  esperanca: [698, 880],
};
const CAOS_BALAO_MIN_MS = 2500;
const CAOS_BALAO_POS_VOZ_MS = 600;
const CAOS_FALAS_POR_CARTA = 7;
const CAOS_COLOR_NAMES = {
  "#dc2626": "vermelho-sangue",
  "#6366f1": "índigo",
  "#facc15": "amarelo-ouro",
  "#e94560": "vermelho",
  "#4ecdc4": "turquesa",
  "#ffd166": "amarelo",
  "#a78bfa": "roxo",
  "#38bdf8": "azul",
  "#fb923c": "laranja",
  "#ff9ecd": "rosa",
  "#8b5e3c": "marrom",
  "#9ca3af": "cinza",
  "#ffffff": "branco",
  "#2b2b2b": "preto",
  RGB: "arco-íris",
  "#39ff14": "verde neon",
  "#3d8b5f": "verde",
  GRAD_SUNSET: "pôr do sol",
  GRAD_OCEAN: "oceano",
  GRAD_NEON: "neon",
  GRAD_CANDY: "doce de algodão",
  GRAD_MINT: "menta",
  GRAD_FIRE: "brasa",
  GRAD_ICE: "gelo",
  GRAD_TOXIC: "tóxico",
  GRAD_GALAXY: "galáxia",
  GRAD_LAVA: "lava",
  GRAD_ROYAL: "azul-real",
  GRAD_ONYX: "ônix neon",
  GRAD_TROPICAL: "tropical",
  GRAD_PRINCESA: "princesa",
};
const CAOS_AI_RE = /(intelig[eê]ncia artificial|chatgpt|gemini|claude|rob[oô]|computador|algoritmo|alexa|siri)/i;
const CAOS_CTX_ERRO_RE =
  /\berr(ou|ar|ei|ado|ada|ando)\b|\berro\b|resposta errada|palpite errado|decepcion|lament[aá]vel|isolou|(essa|dessa|nessa|sua|a) resposta\b|(esse|seu|o|um) palpite\b|esse chute|n[aã]o era essa|n[aã]o funcionou|stormtrooper|carta armadilha/i;
const CAOS_CTX_ACERTO_RE =
  /\bacert(ou|ar|ei|a)\b|boa jogada|jogada legal|parab[ée]ns|elogi|foi bem|mandou bem|\bufa\b|vit[óo]ria|drible na carta|continua acertando|foi boa|essa foi boa|boa resposta|gostei da jogada|gostei da resposta/i;
const CAOS_DIAG_KEY = "perfil200_caos_diag";
const CAOS_RITMO_MAX = 150;
const CAOS_EMOHIST_MAX = 200;
const CAOS_CHAVE_KEY = "perfil5_caos_chave";
const CAOS_CHAVES_PADRAO = ["48e2f097", "28f5be6d"];
const CI_ESTADOS = [
  ["normal", "Calmo observador", "Comentários neutros. Observa e anota.", "tensão e calor medianos"],
  ["flow", "Em flow", "Animado e generoso: a mesa está fluindo.", "tensão ≤ 3 · calor ≥ 7 · paciência ≥ 6"],
  ["showman_nervoso", "Showman nervoso", "Narração intensa e agitada.", "tensão ≥ 7 · calor ≥ 7"],
  ["irritado_seco", "Irritado e seco", "Zoeira mais afiada, pouca simpatia.", "tensão ≥ 7 · calor ≤ 3"],
  ["apatico", "Apático", "Frio e desanimado: a mesa esfriou.", "tensão ≤ 3 · calor ≤ 3"],
  ["no_talo", "No talo", "Paciência baixa com a tensão subindo.", "tensão ≥ 5 · paciência ≤ 4"],
  ["no_limite", "No limite", 'Pode "perder a linha" e falar qualquer coisa.', "paciência ≤ 2,5 · tensão ≥ 6"],
  ["exausto_de_paciencia", "Sem paciência", "Cansado da mesa (e de si mesmo).", "paciência ≤ 2,5"],
];
const CI_HUMORES = {
  frustrado: ["😤", "Frustrado", "Voz mais grave e seca. Debocha do erro.", "tensão ≥ 8 · calor ≤ 3,5"],
  orgulhoso: ["👑", "Orgulhoso", "Voz mais aguda e rápida. Se gaba dos acertos.", "calor ≥ 7,5 · tensão ≤ 4"],
  entediado: ["🥱", "Entediado", "Voz lenta e arrastada. Reclama do ritmo.", "calor ≤ 3 · tensão ≤ 5,5"],
  desafiante: ["⚡", "Desafiante", "Voz rápida e incisiva. Bota pressão na mesa.", "tensão ≥ 7 · calor ≥ 6"],
};
const CI_ARQUETIPOS = {
  impulsivo: "⚡ impulsivo",
  meticuloso: "🔍 meticuloso",
  sortudo: "🍀 sortudo",
  resiliente: "🛡️ resiliente",
  padrao: "— sem leitura ainda",
};
const CI_HUMOR_COR = {
  neutro: "#4ecdc4",
  frustrado: "#ff6b6b",
  orgulhoso: "#ffd166",
  entediado: "#9aa5b1",
  desafiante: "#c77dff",
};
const CI_HUMOR_NOME = {
  neutro: "😐 Neutro",
  frustrado: "😤 Frustrado",
  orgulhoso: "👑 Orgulhoso",
  entediado: "🥱 Entediado",
  desafiante: "⚡ Desafiante",
};
const CAOS_COSQ = {
  estranha: [
    "Hm? Alguém mexeu em alguma coisa aqui dentro?",
    "Senti uma corrente de ar no meu córtex.",
    "Estranho. Juro que eu estava de outro humor agora há pouco.",
  ],
  gancho: {
    "paciencia-": ["Eu tinha paciência. Tinha.", "Quem mexeu na minha paciência? Devolve."],
    "paciencia+": ["Paciência infinita de repente. Isso é suspeito."],
    "tensao+": ["Calma. Por que eu tô nervoso? Alguém sabe?", "Meu coração digital acelerou do nada."],
    "tensao-": ["Relaxei do nada. Tem alguém fazendo massagem no meu código?"],
    "calor+": ["Tô me sentindo carinhoso sem motivo. Isso é assédio emocional."],
    "calor-": ["Esfriei. Alguém abriu a geladeira do meu coração."],
    humor: ["Tô me sentindo… orgulhoso? De quê? Não fiz nada.", "Esse humor não é meu. Alguém me emprestou."],
    ritmo: ["A partida não mudou, mas eu mudei. Isso não é normal."],
    simular: ["Isso foi de verdade ou é teste? Vou fingir que acredito."],
    saida: ["Você vai me tirar da partida? Na frente de todo mundo?"],
    normal: ["Ok. Voltei ao normal. Não vou esquecer disso."],
    geral: ["Não cutuque aí, isso faz cosquinha."],
  },
  jf: ["JF, o que você tá fazendo?", "JF… eu sei que é você.", "Criador, com todo respeito: para de mexer em mim."],
  resigna: [
    "Tá, pode mexer. Mas eu tô anotando.",
    "Faça o que quiser. Eu só trabalho aqui.",
    "Mexe. Eu finjo que não sinto.",
  ],
};
const CAOS_NAMES_KEY = "perfil200_caos_conhecidos";
// Memória do gerador de falas (pedaços usados por último em cada gatilho), pra não repetir entre partidas.
const CAOS_GERADOR_KEY = "perfil5_caos_gerador";
const MEM_FICHAS_KEY = "perfil5_caos_fichas";
const MEM_RECORDES_KEY = "perfil5_caos_recordes";
const MEM_RIVAIS_KEY = "perfil5_caos_rivais";
const MEM_ULTIMA_KEY = "perfil5_caos_ultimapartida";
const MEM_BOLA_KEY = "perfil5_caos_bola";
const MEM_CATS = ["ANO", "PESSOA", "LUGAR", "COISA", "ANIMAL"];
const MEM_CARTAS_ABSURDO_KEY = "perfil5_caos_cartas_absurdo";
const CAOS_CAT_NOME = { ANO: "Ano", PESSOA: "Pessoa", LUGAR: "Lugar", COISA: "Coisa", ANIMAL: "Animal" };
const CAOS_CAT_MATERIA = {
  ANO: "História",
  PESSOA: "fofoca",
  LUGAR: "Geografia",
  COISA: "conhecimentos gerais",
  ANIMAL: "Biologia",
};
const CAOS_DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const CAOS_CARTA_TEMA = {
  tech: ["internet", "computador", "smartphone"],
  genio: ["albert einstein", "isaac newton", "leonardo da vinci", "santos dumont"],
  dinheiro: ["dinheiro", "pix", "bitcoin"],
};
const CAOS_CONSOLE = {
  alegria: { dec: 0.78, teto: 10, ic: "😄", cor: "#fb923c" },
  tristeza: { dec: 0.9, teto: 7, ic: "😢", cor: "#818cf8" },
  raiva: { dec: 0.8, teto: 10, ic: "😠", cor: "#ef4444" },
  medo: { dec: 0.7, teto: 10, ic: "😨", cor: "#a855f7" },
  nojo: { dec: 0.78, teto: 9, ic: "🤢", cor: "#65a30d" },
  ansiedade: { dec: 0.86, teto: 8, ic: "😬", cor: "#eab308" },
  tedio: { dec: 0.9, teto: 8, ic: "😑", cor: "#94a3b8" },
  vergonha: { dec: 0.6, teto: 10, ic: "🫣", cor: "#fda4af" },
  curiosidade: { dec: 0.75, teto: 8, ic: "🔎", cor: "#c084fc" },
  carinho: { dec: 0.92, teto: 5, ic: "💗", cor: "#f472b6" },
};
const CAOS_CONSOLE_CFG = { limiar: 3.8, saida: 2.5, margem: 1.4, dwell: 2, mistura: 0.6, pMistura: 0.12 };
const CAOS_CONSOLE_MISTURAS = [
  ["raiva", "tristeza", "magoado"],
  ["alegria", "ansiedade", "empolgação nervosa"],
  ["vergonha", "alegria", "riso sem graça"],
  ["curiosidade", "medo", "espiando com receio"],
  ["alegria", "nojo", "elogio contrariado"],
  ["carinho", "tristeza", "saudade"],
  ["medo", "raiva", "acuado"],
];
const CAOS_TEDIO_OCIOSO_MS = 3e4;
const CAOS_CONSOLE_DE_ROSTO = {
  festa: "alegria",
  orgulho: "alegria",
  triste: "tristeza",
  raiva: "raiva",
  furia: "raiva",
  medo: "medo",
  nojo: "nojo",
  ansiedade: "ansiedade",
  tedio: "tedio",
  vergonha: "vergonha",
  espiando: "curiosidade",
  carinho: "carinho",
};
const CAOS_EMO_VIZ = {
  calmo: "pensando julgando tedio orgulho carinho espiando ombros preocupado surpresa recompondo deboche",
  julgando: "calmo deboche raiva espiando pensando",
  deboche: "julgando raiva desafio calmo ombros",
  raiva: "deboche julgando furia recompondo desafio preocupado",
  furia: "raiva recompondo",
  recompondo: "raiva furia calmo triste",
  tedio: "calmo ombros triste pensando",
  triste: "tedio preocupado recompondo carinho",
  preocupado: "calmo triste pensando raiva surpresa",
  orgulho: "calmo festa desafio carinho",
  festa: "orgulho surpresa carinho",
  carinho: "calmo orgulho festa triste",
  desafio: "orgulho deboche raiva espiando",
  surpresa: "festa calmo preocupado espiando",
  espiando: "calmo julgando desafio surpresa pensando",
  pensando: "calmo preocupado espiando julgando tedio",
  ombros: "calmo tedio deboche",
  medo: "surpresa preocupado ansiedade triste calmo espiando raiva",
  ansiedade: "preocupado medo pensando calmo festa",
  nojo: "julgando deboche raiva tedio vergonha calmo",
  vergonha: "recompondo triste calmo festa nojo ombros pensando deboche",
  alivio: "calmo recompondo carinho festa orgulho preocupado ansiedade medo triste",
  inveja: "julgando deboche nojo raiva desafio calmo",
  nostalgia: "carinho triste calmo pensando",
  esperanca: "calmo carinho desafio orgulho preocupado ansiedade triste festa",
};
const CAOS_ESCADA_LIVRE =
  /^(joia|vitoria|recorde|sequenciaAcertos|absurdo|acertoRidiculamenteRapido|surpresa|acertoUmaDica|erroEscalada|juizMestre|agonia15Dicas|pausaVolta|retaFinal|hall\.|fominha|marco100|meta|jfFim|bolaCristalAcerto|previsaoCartaAcertou|virada\.)/;
const CAOS_VIRADA_QUANDO = [
  ["erro", /^(erro(Sarcasmo|Categoria|Rapido|Demorou|ComDica\w*|Ultimo|QuebraSequencia)?(\.|$)|gerador\.erro\.)/],
  ["acerto", /^(acerto(PorDicas|CategoriaRapido|ComResposta)?(\.|$)|gerador\.acerto\.)/],
  ["pular", /^(pular(\.|$)|gerador\.pular\.)/],
  ["pausa", /^pausaVolta\./],
  ["fim", /^(jfFim|vitoria)(\.|$)/],
];
const CAOS_VIRADA_DESINFLA = ["calmo", "tedio", "recompondo", "ombros"];
const CAOS_VIRADA_P_AUTO = 0.1;
const CAOS_VIRADA_P_MANUAL = 0.15;
const CAOS_VIRADA_ESPACO = 6;
const CAOS_VIRADA_MS = 400;
const CAOS_ANIM_GATILHOS = [
  [".fx-shake", "fxShake"],
  [".fx-pop", "fxPop"],
  [".fx-float", "fxFloat"],
  [".fx-burst", "fxBurst"],
  ["body.fx-urgente", "fxUrgente"],
  [".starter-result.chosen", "popIn"],
  [".roulette-reel.landed", "popIn"],
  [".screen-flash", "screenFlash"],
  [".error-x", "errorXPop"],
  [".spotlight-box", "spotlightIn"],
  [".timer-blink-on", "timerBlink"],
  [".clue-list li", "fadeSlideIn"],
  [".pending-box:not(#expressTargetModal)", "fadeSlideIn"],
];
const CAOS_EASE = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};
const CAOS_NUM_RE = /-?\d*\.?\d+/g;
const CAOS_NUMERO_CHANCE = 0.16;
const CAOS_CARD_CHATTER_CHANCE = 0.28;
const CAOS_FAMILIAS_MESTRE = ["quebraParede", "cumpliceMestre", "recadoMestre", "leituraConsciente"];
const EXPRESS_TIMES = { classico: { card: 150, turn: 15 }, hardcore: { card: 90, turn: 10 } };
const ANSWER_REVEAL_MS = 5e3;
const INI_ALVOS = {
  nick: ["#addNomeRow", "#nickIdeaWrap", "#nickSuggest"],
  avatar: ["#avatarBox"],
  cor: ["#colorBox"],
  faixa: ["#ageBracketWrap"],
  humor: ["#humorBox"],
  pronto: ["#addAcaoRow"],
};
const CAOS_FALA_PESADA_RE =
  /cringe|aura|goleiro|n[aã]o sabe nada|longe demais|burr|idiot|vergonh|pat[eé]tic|rid[ií]cul|desist|lixo|fracass|p[eé]ssim|horr[ií]vel|chor|incompet|nunca vai|in[uú]til|vexame|humilh|tosco|decepc|\bpior\b|mané|otári|lament|coitad|perdedor|feio|chato|cala a boca|some daqui|vergonha/i;
const HUMOR_OPTIONS = [
  {
    id: "familia",
    label: "🧸 Family friendly",
    hint: "Carinho o tempo todo: torce e incentiva. Zoa só de levinho, uma vez ou outra, sem nada pesado.",
  },
  { id: "suave", label: "🌷 Suave", hint: "Sem ácido, sem cantada, sem gozar erro repetido." },
  { id: "normal", label: "😏 Normal", hint: "A zoeira de sempre." },
  { id: "acido", label: "🌶️ Ácido", hint: "Zoeira mais afiada e mais frequente (nunca palavrão)." },
  {
    id: "caos",
    label: "🎲 C.A.O.S. decide",
    hint: "Ele sorteia como vai tratar você (Suave, Normal ou Ácido; nunca Nível 0) e, no meio do jogo, pergunta se você está curtindo.",
  },
  {
    id: "zero",
    label: "💀 Nível 0",
    hint: "Sem dó: áspero, implicante e sarcástico o tempo todo — mas sem palavrão, e ainda comemora quando você acerta.",
  },
];
const HUMOR_NOMES = { familia: "🧸 Family friendly", suave: "🌷 Suave", normal: "😏 Normal", acido: "🌶️ Ácido", zero: "💀 Nível 0" };
const HUMOR_COR = { familia: "#7dd3fc", suave: "#f9a8d4", normal: "#fbbf24", acido: "#ef4444", zero: "#b91c1c", caos: "#a78bfa" };
const NICKS_GERAL = [
  "Sabe-Tudo",
  "Rei do Palpite",
  "Rainha do Chute",
  "Capitão Dica",
  "Dona Resposta",
  "Seu Palpite",
  "Mestre Jedi",
  "O Enigmático",
  "Sherlock",
  "Enciclopédia",
  "Google Humano",
  "Chutador Pro",
  "Na Trave",
  "Quase Acertei",
  "Dica 20",
  "Primeira Dica",
  "Mente Brilhante",
  "Cérebro",
  "Oráculo",
  "Wikipédia",
  "Professor",
  "Doutor Perfil",
  "Lenda Viva",
  "Tio do Pavê",
  "Tia da Fofoca",
  "Batata Quente",
  "Coxinha",
  "Pão de Queijo",
  "Café Forte",
  "Soneca",
];
const NICK_WAIT_STAGES = [
  { at: 4e4, bank: "leve" },
  { at: 8e4, bank: "media" },
  { at: 12e4, bank: "forte" },
];
const CAOS_NICKTEMPO_KEY = "perfil5_caos_nicktempo";
const NICKS_REPERTORIO_KEY = "perfil5_nicks_repertorio";
const VIBRA_PADROES = {
  acerto: [35, 60, 35],
  erro: [170],
  nega: [45, 45, 45],
  absurdo: [60, 40, 60, 40, 220],
  pular: [22],
  tique: [18],
  tempo: [260, 90, 260],
  joia: [40, 40, 40, 40, 40, 40, 180],
  vitoria: [90, 70, 90, 70, 380],
  avanca: [25, 30, 25],
  volta: [110, 60, 110],
};
const CAOS_COMENT_TOM = {
  rapido: "elogio",
  sequencia: "elogio",
  placar: "elogio",
  sniper: "elogio",
  campeao: "elogio",
  respondidas: "elogio",
  rapida: "elogio",
  facil: "elogio",
  mvp: "elogio",
  muralha: "elogio",
  semdono: "zoeira",
  pulos: "zoeira",
  absurdos: "zoeira",
  precoce: "zoeira",
  inimizade: "zoeira",
  rival: "comentario",
  sorteadas: "comentario",
  duracao: "comentario",
  dificil: "comentario",
  laudos: "comentario",
  bola: "eu",
};
const CAOS_TROPECO = {
  fio: [
    "Onde eu tava? Ah, sim.",
    "Perdi o fio. Enfim:",
    "Eu ia falar outra coisa. Esquece. Então:",
    "Espera, deixa eu organizar a frase.",
    "Hm, como é que eu ia dizer isso… Ah:",
  ],
  arrep: [
    "…Isso soou melhor na minha cabeça.",
    "Não, pera. Deixa assim mesmo.",
    "Eu ia falar mais bonito, mas saiu isso.",
    "Acho que já falei isso hoje. Vale repetir.",
    "Anota aí que eu hesitei.",
    "Tá, essa não foi minha melhor frase.",
  ],
  interpAcerto: [
    "Pera, foi erro? … Não, acertou! Desculpa, me confundi.",
    "Espera, errou? … Não. Acertou. Tô lento hoje.",
  ],
  interpErro: ["Espera, isso foi acerto? … Não. Não foi.", "Pera, acertou? … Não. Ok, eu tinha entendido errado."],
};
const FORMAT_WRAP_IDS = { versus: "fmtWrapVersus", equipe: "fmtWrapEquipe" };
const TUT_CAPS = ["Começo", "Cadastro", "A carta", "Pontos", "C.A.O.S.", "Extras"];
const MODE_WRAP_IDS = {
  classico: "modeWrapClassico",
  hardcore: "modeWrapHardcore",
  express: "modeWrapExpress",
  junior: "modeWrapJunior",
  oldschool: "modeWrapOldschool",
  random: "modeWrapRandom",
};
const MODE_LABELS = {
  classico: "Perfil Clássico",
  hardcore: "Perfil Hardcore",
  express: "Perfil Express",
  junior: "Perfil Júnior",
  oldschool: "Perfil Old School",
};
const PAUSE_TIP_MS = 8e3;
// Endereço público do jogo (vai no texto de Compartilhar resultado).
const JOGO_URL = "https://jfsouza77.github.io/Projeto_Perfil_JF/";
const ADM_CRIADOR_HASH = "f10d7ed5";
const CAOS_PAUSA_DEGRAUS = [
  { s: 40, emo: "tedio", d: [0, -0.5, -0.5] },
  { s: 90, emo: "espiando", d: [0.5, -0.5, -1] },
  { s: 150, emo: "julgando", d: [0.5, -0.5, -1] },
  { s: 210, emo: "triste", d: [1, -1, -1] },
  { s: 270, emo: "raiva", d: [1, -1, -1.5] },
  { s: 360, emo: "furia", d: [1.5, -1, -1.5] },
];
const STARTER_MAX_DRAWS = 3;
const NOVIDADES_KEY = "perfil5_novidades_visto";
const CAOS_DESCANSO_KEY = "perfil5_caos_descanso";
const CAOS_DESCANSO_MIN = 15;
// Avance/Volte/Escolha um jogador: quem revelou PERDE a vez (regra do jogo; o Express tem regras próprias).
const MOVE_SPECIALS_KEEP_TURN = false;

