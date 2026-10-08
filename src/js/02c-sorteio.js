/* ----------------------------------------------------------------------
 * 2c. SORTEIO DE REGRA (1.7.7.4 · Foundation Structure Update, Parte 5)
 * Todo sorteio que DECIDE o jogo passa por aqui: embaralhar o baralho, devolver carta ao
 * baralho, quantas instruções especiais no Hardcore, modo da Moda da Casa, categorias e modo
 * sorteados, alvo automático das surpresas, 1º Mestre, evento de misericórdia e Duelo/Todos.
 * Os sorteios de ENFEITE (falas, emoções, cores, confete, animação das roletas) continuam no
 * Math.random de sempre.
 *  · Hoje: sorteioRegra() é o mesmo Math.random (o jogo não muda).
 *  · Testes: sorteioSemear(n) liga uma sequência fixa (mulberry32), pra repetir a mesma partida.
 *  · 1.7.9: o host sorteia e manda o resultado; os outros aparelhos não sorteiam regra.
 * ---------------------------------------------------------------------- */
let sorteioSemente = null; // null = Math.random; número = sequência fixa (só testes)
let sorteioContagem = 0; // quantos sorteios de regra a partida já fez (ajuda a comparar partidas)
function sorteioSemear(n) {
  sorteioSemente = n === null || n === undefined ? null : n >>> 0;
}
function sorteioRegra() {
  sorteioContagem++;
  if (sorteioSemente === null) return Math.random();
  // mulberry32
  sorteioSemente = (sorteioSemente + 0x6d2b79f5) >>> 0;
  let t = sorteioSemente;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function sorteioIndice(n) {
  return Math.floor(sorteioRegra() * n);
}
function sorteioItem(lista) {
  return lista[sorteioIndice(lista.length)];
}
