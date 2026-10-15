/* =========================================================================================================
   C.A.O.S. 4.3 · Ouvintes da sala (pedido do JF depois da partida online de 13/10, em que os 4 calaram ele)
   Cada aparelho avisa o host quando liga ou desliga a voz do C.A.O.S. e quando pula uma fala dele.
   · Pular fala marca quem pulou de verdade: o nick do aparelho onde tocou (não o Mestre da vez).
   · "Calou" = desligou a voz depois de ter ligado nesta partida (voz que nunca foi ligada não conta).
   · Todo mundo calou: ele fica quieto até o fim da partida (só aviso de regra, em texto), ou até alguém
     ligar a voz de novo.
   · Só uma parte calou: quem calou fica marcado (rancor, como quem corta a fala) e ele fica mais carinhoso
     com quem ainda ouve. Ciúmes e carência, de propósito.
   Só vale com a sala online aberta; no aparelho único da mesa nada disso muda.
   ========================================================================================================= */
let caosOuvintes = {}; // jogadorId -> { ligou: já ligou a voz nesta partida, ligada: a voz está ligada agora }
let caosOuvintesEstado = "normal"; // "normal" | "ciumes" | "calada"

// Partida nova: quem está com a voz ligada agora conta como ouvinte; ninguém começa "tendo calado"
function caosOuvintesZerar() {
  Object.keys(caosOuvintes).forEach((id) => (caosOuvintes[id].ligou = caosOuvintes[id].ligada));
  caosOuvintesEstado = "normal";
}
function caosOuvintesAtivo() {
  return typeof salaOnlineAberta === "function" && salaOnlineAberta() && starterChosen && !gameEnded && players.length >= 2;
}
function caosCalaram() {
  return players.filter((p) => caosOuvintes[p.id] && caosOuvintes[p.id].ligou && !caosOuvintes[p.id].ligada);
}
function caosOuvindo() {
  return players.filter((p) => caosOuvintes[p.id] && caosOuvintes[p.id].ligada);
}
// A sala inteira calou o C.A.O.S. (ele só passa aviso de regra)
function caosSalaCalada() {
  return caosOuvintesAtivo() && caosOuvintesEstado === "calada";
}
// Este jogador ainda ouve o C.A.O.S. enquanto outros calaram: ele fica mais carinhoso com ele
function caosFiel(p) {
  return !!p && caosOuvintesAtivo() && caosOuvintesEstado === "ciumes" && !!caosOuvintes[p.id] && caosOuvintes[p.id].ligada;
}
// Um aparelho ligou ou desligou a voz (ids = jogadores daquele aparelho)
function caosOuvinteVoz(ids, ligada) {
  (ids || []).forEach((id) => {
    if (!id || jogadorIdxPorId(id) < 0) return;
    const o = caosOuvintes[id] || (caosOuvintes[id] = { ligou: false, ligada: false });
    if (ligada) o.ligou = true;
    o.ligada = !!ligada;
  });
  caosOuvintesReavaliar(ids, ligada);
}
function caosOuvintesReavaliar(quem, ligou) {
  if (!caosOuvintesAtivo()) return;
  const calaram = caosCalaram(), ouvindo = caosOuvindo();
  const antes = caosOuvintesEstado;
  const todos = calaram.length > 0 && calaram.length === players.length;
  caosOuvintesEstado = todos ? "calada" : calaram.length && ouvindo.length ? "ciumes" : "normal";
  // quem calou fica marcado (rancor); o último a calar fica na mira por umas cartas
  calaram.forEach((p) => (caosCortes.rancor[p.name] = true));
  const nomes = (ps) => ps.map((p) => p.name);
  const lista = (ns) => (ns.length <= 1 ? ns.join("") : ns.slice(0, -1).join(", ") + " e " + ns[ns.length - 1]);
  const R = REACTIVE_VOICE.caosOuvintes;
  if (caosOuvintesEstado !== antes) caosLog("ouvintes", `${antes} → ${caosOuvintesEstado} (calaram: ${nomes(calaram).join(", ") || "ninguém"})`);
  if (caosOuvintesEstado === "calada" && antes !== "calada") {
    // a última fala dele antes do silêncio: aparece só em texto, uma vez por partida
    if (caosOncePerMatch("sala_calada")) caosFalaAgendar(() => getRandomReaction(R.todosCalaram), 600, "regra");
    return;
  }
  if (antes === "calada" && ligou) {
    const volta = players.find((p) => (quem || []).includes(p.id));
    if (volta) caosFalaAgendar(() => getRandomReaction(R.voltouAOuvir, volta.name), 600, "regra");
    return;
  }
  if (caosOuvintesEstado === "ciumes" && !ligou && quem && quem.length) {
    const fiel = ouvindo[Math.floor(Math.random() * ouvindo.length)];
    const ultimo = players.find((p) => quem.includes(p.id));
    if (ultimo) {
      const i = players.indexOf(ultimo);
      caosMarked = { idx: i, remaining: Math.max(caosMarked.idx === i ? caosMarked.remaining : 0, 5) };
    }
    if (fiel) caosFalaAgendar(() => getRandomReaction(R.ciumes, fiel.name, lista(nomes(calaram)), calaram.length), 900);
  }
}
// Na carta nova, de vez em quando, ele lembra quem ainda está com ele (só no estado de ciúmes)
function caosOuvintesNaCarta() {
  try {
    if (!caosOuvintesAtivo() || caosOuvintesEstado !== "ciumes" || Math.random() > 0.18) return false;
    const ouvindo = caosOuvindo(), calaram = caosCalaram();
    if (!ouvindo.length || !calaram.length) return false;
    const fiel = ouvindo[Math.floor(Math.random() * ouvindo.length)];
    const c = calaram[Math.floor(Math.random() * calaram.length)];
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.caosOuvintes.carinhoFiel, fiel.name, c.name), 1800);
    return true;
  } catch (e) {
    return false;
  }
}
// Quem pulou a fala neste aparelho (o do host). Aparelho único: o palpite de sempre (o Mestre da vez).
// Online: o jogador deste aparelho; se o aparelho é dividido, o Mestre se ele estiver aqui, senão ninguém.
function caosQuemPulouAqui() {
  if (mestreIndex === null || mestreIndex === void 0 || !players[mestreIndex] || !starterChosen || gameEnded) return null;
  if (!salaOnlineAberta()) return mestreIndex;
  const ids = typeof redeJogadoresNoHost === "function" ? redeJogadoresNoHost() : [];
  if (ids.length === 1) return jogadorIdxPorId(ids[0]);
  if (ids.includes(players[mestreIndex].id)) return mestreIndex;
  return null;
}
