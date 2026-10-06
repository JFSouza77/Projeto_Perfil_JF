/* ----------------------------------------------------------------------
 * 2b. IDENTIDADE DOS JOGADORES (1.7.7.1 · Foundation Structure Update, Parte 2)
 * Todo jogador ganha um id (ex.: "j_k7p2qa") no cadastro. Ele não muda quando alguém sai,
 * quando a ordem muda ou quando a partida é salva e restaurada. É a base do online:
 * na rede, "o jogador 2" não quer dizer nada; "j_k7p2qa" quer dizer sempre a mesma pessoa.
 *
 * Nesta parte passam a usar o id (no Versus; no Equipe a chave continua sendo a equipe):
 *  · fichas de palpite (palpiteHolders) e joias da rodada (joiasRodada);
 *  · vencedor por joias (gemWinner.id);
 *  · quem abriu a rodada (primeiroMestreId) e o ADM principal (admPrincipalId).
 * mestreIndex e responderIndex continuam sendo posição ("assento"); viram id na 1.7.8.
 * Save antigo (até a versão 11) ganha id ao abrir e tem as chaves convertidas.
 * ---------------------------------------------------------------------- */
const JOGADOR_ID_RE = /^j_[a-z0-9]{6,12}$/;
function jogadorIdNovo(usados) {
  const em = usados || new Set(players.map((p) => p && p.id));
  for (let t = 0; t < 50; t++) {
    let s = "j_";
    for (let i = 0; i < 6; i++) s += "abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 32)];
    if (!em.has(s)) return s;
  }
  return "j_" + Date.now().toString(36);
}
function jogadorIdValido(id) {
  return typeof id === "string" && JOGADOR_ID_RE.test(id);
}
// Garante id único em cada jogador da lista (save antigo, id repetido ou estragado).
function jogadoresGarantirIds(lista) {
  const usados = new Set();
  (lista || []).forEach((p) => {
    if (!p) return;
    if (!jogadorIdValido(p.id) || usados.has(p.id)) p.id = jogadorIdNovo(usados);
    usados.add(p.id);
  });
}
function jogadorIdxPorId(id) {
  if (id === null || id === void 0) return -1;
  return players.findIndex((p) => p && p.id === id);
}
function jogadorPorId(id) {
  const i = jogadorIdxPorId(id);
  return i >= 0 ? players[i] : null;
}
function jogadorIdDe(idx) {
  return players[idx] ? players[idx].id : null;
}
// Converte uma chave de save antigo (posição "0", "1"…) no id do jogador; id válido passa direto.
function jogadorChaveMigrar(k, lista) {
  const l = lista || players;
  if (jogadorIdValido(k)) return l.some((p) => p.id === k) ? k : null;
  const i = typeof k === "number" ? k : /^\d+$/.test(String(k)) ? parseInt(k, 10) : -1;
  return i >= 0 && l[i] ? l[i].id : null;
}

/* --- Partida (1.7.7.2): matchId ---
 * Nasce quando a partida começa, vai pro save e é preservado quando a partida é retomada.
 * "Jogar de novo" e partida nova ganham outro. Na 1.7.8 toda ação vai carimbada com ele, e na rede
 * uma ação de uma partida que já acabou é recusada. */
let matchId = null;
const PARTIDA_ID_RE = /^p_[a-z0-9]{8,16}$/;
function partidaIdNovo() {
  let s = "p_" + Date.now().toString(36).slice(-6);
  for (let i = 0; i < 4; i++) s += "abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 32)];
  return s;
}
function partidaIdValido(id) {
  return typeof id === "string" && PARTIDA_ID_RE.test(id);
}
