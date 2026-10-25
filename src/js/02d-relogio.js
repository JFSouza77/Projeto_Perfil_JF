/* ----------------------------------------------------------------------
 * 2d. RELÓGIO ÚNICO DA PARTIDA (25/10/2026 · roteiro "o que vem depois da 1.7.10", item 1)
 * Antes, cada parte do jogo cuidava do próprio tempo: o tempo da vez empurrava o prazo quando um aviso
 * cobria a tela, a Corrida empurrava os dela, o Modo C.A.O.S. empurrava oito prazos diferentes a cada aviso
 * ou pausa. Esquecer um desses empurrões era a origem da família de bugs de tempo.
 * Agora existe um TEMPO DE JOGO só: ele anda com o relógio de verdade e PARA quando a partida está parada
 * (pausa, aviso da mesa na tela). Os prazos da partida são marcados nesse tempo, então param sozinhos:
 * ninguém mais empurra nada.
 *  · relogioJogo(): o tempo de jogo agora (ms). Use no lugar de Date.now() pra marcar e conferir prazos.
 *  · relogioMarcar(motivo, liga): a partida parou/voltou por "pausa" ou "aviso" (vários juntos contam uma vez).
 *  · relogioParede(t): converte um prazo do tempo de jogo pro relógio de verdade (pra mandar pros celulares,
 *    que contam no relógio da rede). Parada, o prazo "anda junto" a cada envio.
 *  · Save guarda "quanto falta" (relogio de jogo não sobrevive a recarregar a página).
 * A fala do C.A.O.S. não é parada geral: ela congela só o tempo da vez que estava correndo quando começou
 * (09-vinculos, closeActiveToast), e mede isso no tempo de jogo pra não descontar duas vezes com o aviso.
 * ---------------------------------------------------------------------- */
const RELOGIO_MOTIVOS = ["pausa", "aviso"];
const relogio = { ativos: new Set(), desde: null, desconto: 0, trechos: [] };
// conserto sozinho: o estado de verdade é a pausa (pausedAt) e o aviso na tela (avisoMesaCongela). Se uma
// marca faltou (pausa vinda do save, aviso que saiu sem desmarcar), o relógio se acerta aqui; o aviso que
// já devia ter saído fecha na hora em que saiu, não na hora em que alguém percebeu
function relogioConferir() {
  const pausa = typeof pausedAt !== "undefined" && !!pausedAt;
  if (pausa !== relogio.ativos.has("pausa")) relogioMarcar("pausa", pausa);
  const aviso = typeof avisoMesaCongela === "function" && avisoMesaCongela();
  if (aviso && !relogio.ativos.has("aviso")) relogioMarcar("aviso", true);
  if (!aviso && relogio.ativos.has("aviso")) {
    const ate = typeof avisoMesa !== "undefined" && avisoMesa && avisoMesa.ate ? avisoMesa.ate : Date.now();
    relogioMarcar("aviso", false, Math.min(Date.now(), ate));
  }
}
function relogioMarcar(motivo, liga, quando) {
  if (!RELOGIO_MOTIVOS.includes(motivo)) return;
  // nunca antes do fim do último trecho (não desconta duas vezes) nem depois de agora
  const ult = relogio.trechos[relogio.trechos.length - 1];
  const agora = Math.min(Date.now(), Math.max(typeof quando === "number" ? quando : Date.now(), ult ? ult[1] : 0));
  if (liga) {
    if (relogio.ativos.has(motivo)) return;
    if (!relogio.ativos.size) relogio.desde = agora;
    relogio.ativos.add(motivo);
    return;
  }
  if (!relogio.ativos.delete(motivo) || relogio.ativos.size || relogio.desde == null) return;
  const fim = Math.max(relogio.desde, agora);
  relogio.desconto += fim - relogio.desde;
  relogio.trechos.push([relogio.desde, fim]);
  if (relogio.trechos.length > 16) relogio.trechos.shift();
  relogio.desde = null;
}
function relogioParado() {
  relogioConferir();
  return relogio.ativos.size > 0;
}
function relogioJogo() {
  relogioConferir();
  const agora = Date.now();
  return agora - relogio.desconto - (relogio.desde != null ? agora - relogio.desde : 0);
}
// prazo do tempo de jogo → relógio de verdade (pra quem está fora deste aparelho)
function relogioParede(t) {
  return typeof t === "number" && t ? Date.now() + (t - relogioJogo()) : t;
}
// o contrário: horário de verdade (ex.: prazo vindo do save) → tempo de jogo
function relogioDaParede(w) {
  return typeof w === "number" && w ? relogioJogo() + (w - Date.now()) : w;
}
// (o tempo de jogo nunca zera nem volta: prazo marcado nele continua valendo de uma partida pra outra)
