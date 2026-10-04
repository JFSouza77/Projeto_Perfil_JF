/* ----------------------------------------------------------------------
 * 5f. TEMPO DE JOGO (1.7.6.7): a duração da partida conta só o tempo jogando.
 * Antes ela era "agora menos a hora do início": pausa longa, app fechado e celular
 * bloqueado entravam na conta (uma partida de 5 cartas deu 628 minutos).
 * Agora um relógio soma a cada 5 s: tempo de jogo (partida rolando) ou tempo pausado
 * (tela de pausa aberta). Buraco maior que 1 minuto entre dois toques do relógio
 * (celular dormindo, app fechado, aba escondida) não conta pra nenhum dos dois.
 * O tempo pausado aparece separado nas estatísticas; nunca entra na duração.
 * ---------------------------------------------------------------------- */
let tempoJogoMs = 0;
let tempoPausaMs = 0;
let tempoUltimoTick = 0;
const TEMPO_TICK_MS = 5e3;
const TEMPO_BURACO_MAX_MS = 60e3;
function tempoTick() {
  const agora = Date.now();
  const d = tempoUltimoTick ? agora - tempoUltimoTick : 0;
  tempoUltimoTick = agora;
  if (!starterChosen || gameEnded || !caosPartidaInicioAt) return;
  if (!(d > 0) || d > TEMPO_BURACO_MAX_MS || document.hidden) return;
  if (typeof pausaEstaAberta === "function" && pausaEstaAberta()) tempoPausaMs += d;
  else if (!pausedAt && !pausaExpirada) tempoJogoMs += d;
}
function tempoZerar() {
  tempoJogoMs = 0;
  tempoPausaMs = 0;
  tempoUltimoTick = Date.now();
}
// Save antigo (antes da 1.7.6.7) não tem o relógio: estima pelo jeito velho, sem a pausa
// registrada e com teto de 4 min por carta (evita herdar um número absurdo).
function tempoRestaurar(state) {
  const ok = (v) => typeof v === "number" && isFinite(v) && v >= 0;
  if (ok(state.tempoJogoMs)) {
    tempoJogoMs = Math.min(state.tempoJogoMs, 864e5);
    tempoPausaMs = ok(state.tempoPausaMs) ? Math.min(state.tempoPausaMs, 864e5) : 0;
  } else if (caosPartidaInicioAt) {
    const fim = caosPartidaFimAt || (ok(state.savedAt) ? state.savedAt : Date.now());
    const bruto = Math.max(0, fim - caosPartidaInicioAt - (caosPausaAcum || 0));
    const teto = Math.max(1, (state.stats && state.stats.totalDrawn) || 1) * 4 * 6e4;
    tempoJogoMs = Math.min(bruto, teto);
    tempoPausaMs = 0;
  } else tempoZerar();
  tempoUltimoTick = Date.now();
}
function tempoMinutosJogo() {
  return Math.max(0, Math.floor(tempoJogoMs / 6e4));
}
function tempoMinutosPausa() {
  return Math.max(0, Math.floor(tempoPausaMs / 6e4));
}
setInterval(tempoTick, TEMPO_TICK_MS);
