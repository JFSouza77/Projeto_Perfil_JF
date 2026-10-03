/* ======================================================================
 * 2. ESTADO GLOBAL (VARIÁVEIS DA PARTIDA E DO C.A.O.S.)
 * ====================================================================== */

let WINNING_SCORE = 200;
let allCards;
const avisosDados = [];
// preenchido por avisoDados() na abertura
var caosFaceUlt = {};
let selectedAvatar;
// atribuído em iniciar()
let cardsByAnswer;
// atribuído em iniciar()
let CURRENT_FORMAT = "versus";
let equipeSubMode = "duelo";
let teams = {};
let teamOrder = [];
let teamRoundIndex = 0;
let ffaCandidateQueue = [];
let ffaWrongCount = 0;
let bonusOrigMestreIdx = null;
let CURRENT_MODE = "classico";
let oldSchoolAcess = false;
let RESPONSE_TIME_LIMIT_BY_MODE = { classico: 90, hardcore: 60, express: 60, junior: 90, oldschool: 90 };
let expressSelectedCategories = [];
let expressFlavor = "classico";
let expressStealSavedResponder = null;
let deck = [];
let currentCard = null;
let pendingBonusQueue = [];
let cardState = "none";
let players = [];
let gameEnded = false;
let usedAtLeastOnce = false;
let starterChosen = false;
let mestreIndex = null;
let responderIndex = null;
let revealedOrder = [];
let pendingIndex = null;
let palpiteStock;
// atribuído em iniciar()
let palpiteHolders = {};
let timerInterval = null;
let timerEndAt = null;
let timerKind = null;
let RESPONSE_TIME_LIMIT = 90;
let playDirection = 1;
let history = [];
let stats = { totalDrawn: 0, totalDiscarded: 0, totalExhausted: 0 };
let mercyEventUsed = false;
let pendingStartTime = null;
let timeoutOverlayMessage = null;
let pausedRemainingSeconds = null;
let pausedAt = null;
let pausaExpirada = false;
let pausedKind = null;
let showHistory = false;
let showStats = false;
let consecutiveDiscards = 0;
let consecutiveExhausted = 0;
let streakScorerIdx = null;
let streakCount = 0;
let caosEasterEggsUsed;
// atribuído em iniciar()
let caosFatigueLevel = "normal";
let caosSilenced = false;
let caosFatiguePlan = null;
let caosSpontaneousCounter = 0;
let caosPrediction = null;
let caosCardPrediction = null;
let caosEmo = { tensao: 5, calor: 5, paciencia: 7 };
var caosVetorTravado = false;
var caosTemper;
// atribuído em iniciar()
let caosEmoEventsSinceDecay = 0;
let caosHumorOverride = null;
let caosLastMatrizSeen = null;
let caosUltimoAtorIdx = null;
let caosVirtualCardSeen = null;
let caosVirtualLastDrawn = -99;
let caosArqUltima = {};
let caosFamilyRecent = [];
let caosMarked = { idx: null, remaining: 0 };
let caosPrevMarkedIdx = null;
let caosLastSpeechByPlayer = {};
let caosCardMem = null;
let caosUltimaFalaAt = 0;
let caosFalasRecentes = [];
let caosLastMoodSeen = null;
let gemWinner = null;
let WIN_CONDITION = "casa";
// Modo sorteado na Moda da Casa: "tabuleiro" | "pontos" | "joias"; null = ainda não sorteou;
// "misto" = partida salva antes da 1.7.1.1 (segue a regra antiga: tabuleiro + joias).
let casaSorteado = null;
// Rodada = ciclo até o primeiro mestre voltar a ser mestre (nas equipes: até a 1ª equipe voltar a ler).
let rodadaAtual = 1;
let primeiroMestreNome = null;
let joiasRodada = {}; // joias ganhas na rodada atual, por jogador (índice) ou equipe (id)
let ultimaRodada = false; // true = alguém bateu a meta e a rodada está terminando
let ultimaRodadaQuem = ""; // quem bateu a meta primeiro (nome do jogador ou da equipe)
let saveBloqueado = false; // true depois de importar um save (até recarregar)
let audioTravadoToques = 0; // toques seguidos com o som ainda parado (iPhone)
let caosSorteioSilencio = false; // true enquanto o sorteio da Moda da Casa está na tela
let lastSplashColor = null;
var splashH0;
// atribuído em iniciar()
var splashT0 = 0;
let lastBeepSecond = null;
let soundOn = true;
let caosVoiceOn = true;
let caosVoiceSilenced = 0;
let caosVoiceSpoken = 0;
let caosCardTimes = [];
let caosVoiceSpeed = 1.2;
let caosVoicePitch = 1;
let caosVoiceName = "";
let vozPainelAberto = false;
let caosMoodOverride = null;
let timerSerial = 0;
let timeWarnedSerial = -1;
let cardSerial = 0;
let cardWarnedSerial = -1;
let cartaSeq = 0;
let overlayTimeoutRef = null;
let pendingOverlayAction = null;
let caosPoolIds = null;
let caosHist = null;
const caosBadIdx = new Map();
let caosLastPick = null;
let caosRatings = null;
let caosMatchLog = [];
let CAOS_EMOJI_CHANCE;
// atribuído em iniciar()
let caosLastEmoji = "";
var caosUltEmojiAdd = "";
var caosGiriaUlt = -99;
var caosBipAt = 0;
let cardWrongCount = 0;
let toastTimeoutRef = null;
let activeToastState = null;
let toastSerial = 0;
var caosFila = [];
let caosCortes = { total: 0, por: {}, rancor: {} };
var caosFalaCartaRef = -1;
var caosFalaCartaN = 0;
let caosLastTorcidaCard;
let caosClueCommentCard = null;
let caosClueCommentCount = 0;
let caosClueCommentLast = -99;
let caosSaidaTemp = null;
let caosSaidasTensao = 0;
let caosAcidLastCard = -99;
let caosAcidLastIdx = null;
let caosLastAchievementCard = -99;
let caosMem = { pl: {} };
let caosSpeechHist = [];
let caosSetupCount = 0;
let caosPrevLeaderIdx = -1;
let caosDiag = null;
let caosDiagUnsaved = 0;
let caosInspectorTab = "estado";
let caosDecisionLog = [];
let caosRitmoLog = [];
let caosEmoHist = [];
let caosEventoContexto = "";
let caosInspectorDestravado = false;
let caosIntrusoErros = 0;
let caosIntrusoTravaAte = 0;
let caosIntrusoTravas = 0;
var caosCosq = { n: 0, mexidas: 0, at: 0, ult: "", voz: false, falouAlto: false };
let caosMomentos = [];
let caosRivalPartida = {};
let caosMemCatFalou = {};
let caosRecordesNovos = [];
let nickEmprestadoAtual = null;
let caosMemPartidaInicio;
// atribuído em iniciar()
let caosMemFimFeito = false;
let caosMesa = {
  pulos: 0,
  absurdos: 0,
  pulosPor: {},
  absurdosPor: {},
  puloSeq: 0,
  ultAcao: {},
  tilt: {},
  alvos: {},
  dm: {},
  diag: {},
  absCat: {},
  precoce: {},
  falso: 0,
  ultErro: null,
};
let caosAposta = null;
let caosPartidaInicioAt = null;
let caosPartidaFimAt = null;
let caosResenhaTxt = null;
var caosEixos = { alegria: 0, confianca: 0, curiosidade: 0 };
var caosEixosCats = [];
var caosMesaIntimCache = null;
var caosConsole = null;
var caosUltEventoAt;
// atribuído em iniciar()
var caosEmoFalaAtual = null;
var caosEmoFalaN = 0;
var caosViradaDesde = 99;
var caosViradaPend = null;
var caosViradaForcar = null;
var caosViradas = { auto: 0, manual: 0 };
var caosDuploUlt = null;
var caosDuploN = 0;
var caosDuploCarta = -99;
var caosSeguraRef = null;
var caosSegurou = false;
var caosNaoCurtiN = 0;
var caosNaoCurtiReacoes = 0;
var caosPerguntaN = 0;
var caosPerguntaUlt = -99;
var caosPertoCont = {};
var caosImplic = null;
var caosSilencio = { ok: false, usado: false };
var caosSplashIdx = 0;
var caosSplashAt = 0;
var caosRepetidaAt = 0;
var caosRepetidaN = 0;
const caosAnimRodando = new Map();
let caosAnimRaf = 0;
let caosCatSeq = [];
let caosLastSpokeAt = 0;
let microAmbienteSerial = -1;
let caosAviaoLast = -99;
let cardEndAt = null;
let pausedCardRemaining = null;
let expressAskWho = false;
let expressWhoFreeze = null;
let expressTargetAction = null;
let rouletteToken = 0;
let answerRevealUntil = 0;
// Carta cuja resposta o Mestre já escondeu com um toque (antes da 1ª dica).
let answerEscondidaCarta = null;
let answerHideRef = null;
let answerChecksThisCard = 0;
var caosTokPrev = {};
let selectedColor;
// atribuído em iniciar()
var cadCor = false;
var cadEmoji = false;
var cadHumor = false;
var cadFaixa = false;
let iniFluxo = null;
let selectedHumor = "normal";
let nickWaitStart = null;
let nickWaitStage = 0;
let nickSuggestCurrent = null;
let nickSugestaoDoRepertorio = false;
let selectedAgeBracket;
// atribuído em iniciar()
let vibraOn = true;
var caosFalaveis = [];
var caosPickNRMem = {};
var caosComentUlt = "";
var caosComentAt = 0;
var caosTropecos = { n: 0, ult: -99, nomes: {} };
var caosComentandoHall = false;
let showHall = false;
let pendingFormat = null;
var caosToque = { k: null, at: 0 };
let trocaDeModoPendente = false;
let tutorialPos = 0;
let pendingMode = null;
let pauseTipOrder = [];
let pauseTipPos = 0;
let pauseTipTimer = null;
let caosCofrinho = 0;
let admPrincipalName = null;
let admCriadorLogado = false;
let admMsgPendente = [];
var caosPausaInicio = null;
var caosPausaDegrau = -1;
var caosPausaTimer = null;
var caosMagoa = 0;
var caosMagoaPico = 0;
var caosPartidaSerial = 0;
var caosVinc = null;
let pausaToqueUltimoSave = 0;
let orderCountdownInterval = null;
let starterDrawCount = 0;
let wakeLockRef = null;
let lastTimerTick = 0;
let autoPauseBlurRef = null;
var caosLedT = null;
var caosDescansoFalou = false;
var caosPausaAcum = 0;
var caosMudoCarta = false;
var caosMudoPor = null;

