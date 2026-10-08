/* ======================================================================
 * 3. REGRAS (VITÓRIA, PONTOS, JOIAS, TABULEIRO, BARALHO, EQUIPES)
 * ====================================================================== */

function isAnneName(n) {
  return OWNER_ANNE_RE.test(nameKeyPlain(n));
}
function isJfName(n) {
  return OWNER_JF_RE.test(nameKeyPlain(n));
}
// Níveis de zoeira: Family friendly (só no Júnior: só carinho) < Suave (zoa um pouquinho)
// < Normal (zoa e implica no limite) < Ácido (implica, briga e fica magoado) < Nível 0 (torra
// a paciência; você que pediu). Family friendly conta como Suave em todas as travas, e ainda
// troca qualquer zoeira por incentivo (caosFamiliaTroca).
function humorFamilia(p) {
  return !!(p && !p.iniciante && p.humor === "familia" && typeof CURRENT_MODE !== "undefined" && CURRENT_MODE === "junior");
}
function humorEscolhido(p) {
  return humorFamilia(p) ? "familia" : playerHumor(p);
}
function playerHumor(p) {
  if (p && p.iniciante) return "suave";
  const h = p && p.humor;
  if (h === "familia") return typeof CURRENT_MODE !== "undefined" && CURRENT_MODE === "hardcore" ? "normal" : "suave";
  if (h === "suave" && typeof CURRENT_MODE !== "undefined" && CURRENT_MODE === "hardcore") return "normal";
  if (h === "zero" && typeof CURRENT_MODE !== "undefined" && CURRENT_MODE === "junior") return "normal";
  return h === "suave" || h === "acido" || h === "zero" ? h : "normal";
}
function avatarsForMode() {
  const base =
    CURRENT_MODE === "junior"
      ? AVATARS.filter((a) => !["🍺", "🧛", "🧟", "🥷"].includes(a) && !a.startsWith("🕵")).concat(AVATARS_KIDS)
      : AVATARS.concat(AVATARS_EXTRA);
  return base.filter((a) => !AVATAR_EXCLUSIVE.includes(a));
}
function baralhoClassicoProprio() {
  return ADULT_CARDS.filter((c) => c.classificacao === "adulto" || c.classificacao === "livre");
}
// Baralho do Clássico (e dos modos que usam ele): cartas próprias + mistura de
// Old School e Júnior. Fora do Júnior, carta ANIMAL é anunciada como "Coisa".
function baralhoClassico() {
  const proprio = baralhoClassicoProprio();
  const total = Math.round(proprio.length / (1 - CLASSICO_MIX_OS - CLASSICO_MIX_JR));
  const os = shuffle(ADULT_CARDS.filter((c) => c.classificacao === "oldschool" && !c.soExpressHardcore)).slice(
    0,
    Math.round(total * CLASSICO_MIX_OS),
  );
  const jr = shuffle(ADULT_CARDS.filter((c) => c.classificacao === "junior")).slice(
    0,
    Math.round(total * CLASSICO_MIX_JR),
  );
  return proprio.concat(os, jr);
}
function baralhoHardcore() {
  return ADULT_CARDS;
}
function baralhoOldSchool() {
  return ADULT_CARDS.filter((c) => c.oldschool && c.category !== "ANIMAL");
}
// Cada carta: { cat, a: resposta, q: [20 entradas], class?, os?, xh? }.
// Entrada que começa com "*" é instrução especial (ex.: "*Volte 3 casas"); as outras são dicas.
function expandDeck(compact) {
  return compact.map((c) => ({
    id: c.id,
    category: c.cat,
    label: CATEGORY_LABELS[c.cat],
    answer: c.a,
    classificacao: c.class || "adulto",
    oldschool: !!c.os || c.class === "oldschool",
    soExpressHardcore: !!c.xh || c.class === "hardcore",
    // 1.7.8.4: cada dica tem id fixo (ANO-0001-C07 = 7ª entrada da carta no arquivo-fonte). A ordem
    // mostrada na partida (embaralhada) é outra coisa: o índice na carta em jogo. Regra das cartas:
    // nunca reordenar nem apagar entradas no arquivo; corrigir o texto mantém o id.
    clues: c.q.map((t, i) => {
      const id = c.id ? c.id + "-C" + String(i + 1).padStart(2, "0") : null;
      return t[0] === "*" ? { id, type: "special", text: t.slice(1) } : { id, type: "clue", text: t };
    }),
  }));
}
function rebuildCardsIndex() {
  cardsByAnswer = new Map(allCards.map((card) => [card.answer, card]));
}
// Cartas pelo id fixo (1.7.7.2). Vale pro baralho inteiro, não só o do modo atual.
let cartasPorIdMapa = null;
function cartaPorId(id) {
  if (!cartasPorIdMapa) cartasPorIdMapa = new Map(ADULT_CARDS.map((c) => [c.id, c]));
  return cartasPorIdMapa.get(id) || null;
}
// Resposta (de agora ou antiga, de save velho) → carta.
function cartaPorResposta(resp) {
  if (typeof resp !== "string") return null;
  const id = CARTAS_RESPOSTA_ANTIGA[resp];
  if (id) return cartaPorId(id);
  if (!cartasPorRespostaMapa) cartasPorRespostaMapa = new Map(ADULT_CARDS.map((c) => [c.answer, c]));
  return cartasPorRespostaMapa.get(resp) || null;
}
let cartasPorRespostaMapa = null;
// Avisos da validação de dados feita na abertura (aparecem no console com DEBUG
// e no painel Cérebro do C.A.O.S.).
function avisoDados(msg) {
  avisosDados.push(msg);
  DEBUG && console.warn("⚠️ Perfil: " + msg);
}
// Confere as falas do C.A.O.S.: família sem fala, grupo vazio e chave de
// familiasSorteio que não existe em familias.
function validarFalas() {
  const R = REACTIVE_VOICE;
  Object.keys(R.familias || {}).forEach((k) => {
    if (!Array.isArray(R.familias[k]) || !R.familias[k].length) avisoDados(`família "${k}" está sem fala.`);
  });
  (R.familiasSorteio || []).forEach((k) => {
    if (!R.familias || !Object.prototype.hasOwnProperty.call(R.familias, k))
      avisoDados(`familiasSorteio cita "${k}", que não existe em familias.`);
  });
  (function walk(o, path) {
    if (Array.isArray(o)) {
      if (!o.length && !path.startsWith("familias.")) avisoDados(`grupo de falas "${path}" está vazio.`);
      return;
    }
    if (o && typeof o === "object") Object.keys(o).forEach((k) => walk(o[k], path ? path + "." + k : k));
  })(R, "");
}
function checkCardIntegrity(cards) {
  const seen = new Map();
  const dupes = [];
  cards.forEach((c) => {
    if (seen.has(c.answer)) dupes.push(c.answer);
    else seen.set(c.answer, true);
  });
  const juniorPool = cards.filter(
    (c) => c.category !== "ANO" && (c.classificacao === "junior" || c.classificacao === "livre"),
  );
  if (juniorPool.length < JUNIOR_CARD_LIMIT)
    avisoDados(`${juniorPool.length} cartas elegíveis pro Júnior (esperado: ${JUNIOR_CARD_LIMIT}).`);
  ["ANIMAL", "PESSOA", "LUGAR", "COISA"].forEach((cat) => {
    const n = juniorPool.filter((c) => c.category === cat).length;
    if (n < JUNIOR_CARD_LIMIT / 4) avisoDados(`Júnior tem ${n} cartas de ${cat} (esperado: ${JUNIOR_CARD_LIMIT / 4}).`);
  });
  const SPECIALS_OK = [
    "perca sua vez",
    "um palpite a qualquer hora",
    "avance 1 casa",
    "avance 2 casas",
    "volte 2 casas",
    "volte 3 casas",
    "escolha um jogador para voltar 2 casas",
    "escolha um jogador para avançar 2 casas",
  ];
  cards.forEach((c) => {
    if (c.clues.length !== 20) avisoDados(`carta "${c.answer}" tem ${c.clues.length} entradas (o padrão é 20).`);
    const reais = c.clues.filter((x) => x.type === "clue").length;
    const especiais = c.clues.length - reais;
    if (especiais < 1 || especiais > 4)
      avisoDados(`carta "${c.answer}" tem ${especiais} especiais (a regra é de 1 a 4).`);
    if (c.category === "ANO")
      c.clues
        .filter((x) => x.type === "clue" && /\bentre\s+\d{3,4}\s+e\s+\d{3,4}/i.test(x.text))
        .forEach((x) => avisoDados(`carta ANO "${c.answer}" usa intervalo ("${x.text}"), o que a regra não permite.`));
    if (reais < 10) avisoDados(`carta "${c.answer}" tem só ${reais} dicas reais (o Hardcore/Express precisa de 10).`);
    c.clues
      .filter((x) => x.type === "special" && !SPECIALS_OK.includes(String(x.text).trim().toLowerCase()))
      .forEach((x) => avisoDados(`carta "${c.answer}" tem instrução especial que o motor não reconhece: "${x.text}".`));
  });
  const osPool = cards.filter((c) => c.oldschool && c.category !== "ANIMAL");
  if (osPool.length < OLDSCHOOL_META_CARTAS)
    DEBUG &&
      console.info(
        `ℹ️ Perfil: Old School tem ${osPool.length} cartas (meta: ${OLDSCHOOL_META_CARTAS}) — ` +
          ["ANO", "PESSOA", "LUGAR", "COISA"]
            .map((k) => k + " " + osPool.filter((c) => c.category === k).length)
            .join(" · "),
      );
  if (cards.some((c) => c.oldschool && c.category === "ANIMAL"))
    avisoDados("tem carta ANIMAL marcada pro Old School (o modo não usa animais).");
  if (dupes.length > 0) {
    avisoDados(
      `${dupes.length} resposta(s) duplicada(s) no baralho — isso quebra a reconstrucao do save: ${dupes.join(", ")}`,
    );
  }
}
function creditPoints(playerIdx, amount, noBonus) {
  const p = players[playerIdx];
  if (!p) return;
  const oldScore = p.score;
  p.score += amount;
  maybeShowScoreMilestone(p, oldScore, p.score);
  if (CURRENT_FORMAT === "equipe" && p.team && teams[p.team]) {
    const team = teams[p.team];
    const oldPos = team.position;
    team.position += amount;
    if (!noBonus) checkBonusLanding(p.team, oldPos, team.position);
  } else {
    const oldPos = p.position;
    p.position += amount;
    if (!noBonus) checkBonusLanding(playerIdx, oldPos, p.position);
  }
}
function formTeamsBalancedByAge(n) {
  const ids = Object.keys(TEAM_INFO).slice(0, n);
  const rosters = Object.fromEntries(ids.map((id) => [id, []]));
  let cursor = 0;
  AGE_BRACKETS.forEach((b) => {
    const group = shuffle(players.map((p, i) => i).filter((i) => players[i].ageBracket === b.id));
    group.forEach((idx) => {
      rosters[ids[cursor % n]].push(idx);
      cursor++;
    });
  });
  applyTeamRosters(ids, rosters);
}
function applyTeamRosters(ids, rosters) {
  teams = {};
  ids.forEach((id) => {
    teams[id] = { position: 0, members: shuffle(rosters[id]), memberCursor: 0, mestreCursor: 0 };
    rosters[id].forEach((idx) => {
      players[idx].team = id;
      players[idx].color = TEAM_INFO[id].color;
    });
  });
}
function applyTeamSpecialMove(teamId, amount, wasChosenByAnother) {
  if (gameEnded || !teams[teamId]) return;
  const t = teams[teamId];
  t.position = Math.max(0, Math.min(Math.max(WINNING_SCORE, t.position), t.position + amount));
  renderMiniScoreboard();
  renderScoreboard();
  if (victoryReached() && !ultimaRodadaAtiva()) {
    saveGameState();
    endGame();
    return;
  }
  maybeShowMoveSpecialFlavor(
    "Equipe " + (TEAM_INFO[teamId] ? TEAM_INFO[teamId].label : teamId),
    amount,
    wasChosenByAnother,
  );
  afterMoveSpecial();
}
function entityDisplay(id) {
  if (CURRENT_FORMAT === "equipe" && TEAM_INFO[id]) {
    return { name: "Equipe " + TEAM_INFO[id].label, color: TEAM_INFO[id].color, avatar: TEAM_INFO[id].emoji };
  }
  const p = jogadorIdValido(id) ? jogadorPorId(id) : players[id];
  return p ? { name: p.name, color: p.color, avatar: p.avatar } : { name: "?", color: "#888", avatar: "" };
}
function checkBonusLanding(playerIdx, oldPosition, newPosition) {
  if (
    newPosition > oldPosition &&
    newPosition > 0 &&
    newPosition % BONUS_HOUSE_INTERVAL === 0 &&
    newPosition < WINNING_SCORE &&
    (CURRENT_FORMAT === "equipe" || players.length >= 3)
  ) {
    pendingBonusQueue.push({ landerIdx: playerIdx, opponentIdx: null });
  }
}
function isWildcardSpecial(text) {
  return typeof text === "string" && text.toLowerCase().includes("palpite");
}
function currentGemCategories() {
  return CURRENT_MODE === "junior" ? ["ANIMAL", "PESSOA", "LUGAR", "COISA"] : ["ANO", "PESSOA", "LUGAR", "COISA"];
}
function winCond() {
  if (CURRENT_MODE === "express") return "express";
  const w = WIN_CONDITIONS[WIN_CONDITION] ? WIN_CONDITION : "casa";
  // Na Moda da Casa, depois do sorteio vale o comportamento do modo sorteado.
  if (w === "casa" && CASA_MODOS.includes(casaSorteado)) return casaSorteado;
  return w;
}
// Meta em pontos: na Moda da Casa sorteada em Pontos, depende do número de jogadores;
// nos outros casos é a meta normal (WINNING_SCORE).
function metaPontos() {
  if (WIN_CONDITION === "casa" && casaSorteado === "pontos" && CURRENT_MODE !== "express") {
    const n = Math.max(2, Math.min(6, players.length || 2));
    return CASA_META_PONTOS[n];
  }
  return WINNING_SCORE;
}
// Quantas dicas reais (no máximo) valem joia agora.
function gemClueLimit(mode) {
  const m = mode || CURRENT_MODE;
  const base = GEM_CLUE_LIMIT[m] || 5;
  return WIN_CONDITION === "casa" && casaSorteado === "joias" && m !== "express" ? base + CASA_JOIA_DICAS_EXTRA : base;
}
// Joias contam com trava por rodada?
function joiasComTrava() {
  return CURRENT_MODE !== "express" && winCond() === "joias";
}
function gemsAwarded() {
  const w = winCond();
  return w !== "pontos" && w !== "tabuleiro";
}
function gemsCountForWin() {
  const w = winCond();
  return w === "express" || w === "joias" || (w === "casa" && players.length >= GEMS_MIN_PLAYERS);
}
function boardCountsForWin() {
  const w = winCond();
  return w === "casa" || w === "tabuleiro";
}
function teamScore(id) {
  return players.filter((p) => p.team === id).reduce((s, p) => s + (p.score || 0), 0);
}
function rankValue(holder, teamId) {
  const w = winCond();
  if (w === "express") return holder.score || 0;
  if (w === "pontos") return teamId ? teamScore(teamId) : holder.score || 0;
  if (w === "joias") return gemTotal(holder);
  return holder.position || 0;
}
function victoryReached() {
  if (gemWinner) return true;
  const w = winCond();
  if (w === "express" || w === "joias") return false;
  const eq = CURRENT_FORMAT === "equipe";
  if (w === "pontos") {
    const meta = metaPontos();
    return eq ? Object.keys(teams).some((id) => teamScore(id) >= meta) : players.some((p) => p.score >= meta);
  }
  return eq
    ? Object.keys(teams).some((id) => teams[id].position >= WINNING_SCORE)
    : players.some((p) => p.position >= WINNING_SCORE);
}
function winCondRuleText(goal) {
  const t = winCondRuleTextBase(goal);
  if (!ultimaRodadaAtiva() || casaSorteado === "misto") return t;
  return winCond() === "casa"
    ? t + " Bateu a meta? A rodada termina pra todo mundo jogar igual, e vence quem estiver na frente."
    : t + " Quando alguém bate a meta, a rodada termina para todo mundo jogar o mesmo número de vezes.";
}
function winCondRuleTextBase(goal) {
  const g = goal || WINNING_SCORE || 200,
    w = winCond();
  if (w === "joias")
    return `Vence quem juntar as <b>${GEMS_TO_WIN} joias</b>. O tabuleiro anda, mas chegar na casa ${g} não vence. Máximo de <b>${JOIAS_POR_RODADA} joias por ${CURRENT_FORMAT === "equipe" ? "equipe" : "jogador"} em cada rodada</b>.`;
  if (w === "pontos")
    return `Vence quem somar <b>${metaPontos()} pontos</b> primeiro${CURRENT_FORMAT === "equipe" ? " (soma da equipe)" : ""}. Avance/Volte mexem só na casa — o tabuleiro é enfeite.`;
  if (w === "tabuleiro") return `Vence quem chegar primeiro na <b>casa ${g}</b>. Sem joias; pontos não decidem nada.`;
  if (casaSorteado !== "misto")
    return `No começo da partida o C.A.O.S. gira a roleta e sorteia o modo da mesa (nunca repete o da partida anterior): <b>Tabuleiro</b> (chegar na casa ${g}), <b>Pontos</b> (somar ${CASA_META_PONTOS[Math.max(2, Math.min(6, players.length || 2))]} pontos) ou <b>Joias</b> (as ${GEMS_TO_WIN} joias, valendo com até ${(GEM_CLUE_LIMIT[CURRENT_MODE] || 5) + CASA_JOIA_DICAS_EXTRA} dicas, no máximo ${JOIAS_POR_RODADA} por rodada).`;
  return players.length && players.length < GEMS_MIN_PLAYERS
    ? `Vence quem chegar primeiro na <b>casa ${g}</b>. Com menos de ${GEMS_MIN_PLAYERS} jogadores as joias são só troféu.`
    : `Vence quem chegar primeiro na <b>casa ${g}</b> — ou quem juntar as <b>${GEMS_TO_WIN} joias</b> antes.`;
}
function gemsEnabled() {
  return gemsAwarded();
}
function gemHolder(scorerIdx) {
  if (CURRENT_FORMAT === "equipe") {
    const p = players[scorerIdx];
    return p && teams[p.team] ? teams[p.team] : null;
  }
  return players[scorerIdx] || null;
}
function gemCapFor() {
  if (CURRENT_MODE !== "express") return 1;
  const n = (expressSelectedCategories && expressSelectedCategories.length) || 1;
  return Math.max(1, Math.floor(GEMS_TO_WIN / n));
}
function gemTotal(holder) {
  const g = holder && holder.gems ? holder.gems : {};
  return currentGemCategories().reduce((s, c) => s + (g[c] || 0), 0);
}
function gemCategoryFor(cardCategory) {
  return CURRENT_MODE !== "junior" && cardCategory === "ANIMAL" ? "COISA" : cardCategory;
}
function awardGemIfEarned(scorerIdx, realCluesRevealed) {
  if (!gemsEnabled() || !currentCard || currentCard.isBonus) return null;
  const cat = gemCategoryFor(currentCard.category);
  if (!currentGemCategories().includes(cat)) return null;
  const limit = gemClueLimit();
  if (!limit || realCluesRevealed > limit) return null;
  const holder = gemHolder(scorerIdx);
  if (!holder) return null;
  holder.gems = holder.gems || {};
  if ((holder.gems[cat] || 0) >= gemCapFor()) return null;
  // chave da trava e do vencedor: a equipe, ou o id do jogador (1.7.7.1; antes era a posição)
  const key = CURRENT_FORMAT === "equipe" ? players[scorerIdx].team : players[scorerIdx].id;
  if (joiasComTrava() && (joiasRodada[String(key)] || 0) >= JOIAS_POR_RODADA) {
    joiasTravaAvisar(scorerIdx);
    return null;
  }
  holder.gems[cat] = (holder.gems[cat] || 0) + 1;
  if (joiasComTrava()) joiasRodada[String(key)] = (joiasRodada[String(key)] || 0) + 1;
  const total = gemTotal(holder);
  if (total >= GEMS_TO_WIN && gemsCountForWin() && !gemWinner)
    gemWinner = { kind: CURRENT_FORMAT === "equipe" ? "team" : "player", id: key };
  return { cat, count: holder.gems[cat], total, key, trofeu: !gemsCountForWin() };
}
function palpiteEnabled() {
  return PALPITE_MODES_OK.includes(CURRENT_MODE);
}
function palpiteParticipants() {
  return CURRENT_FORMAT === "equipe" ? teamOrder.length : players.length;
}
function palpiteAvailable() {
  return palpiteEnabled() && palpiteParticipants() >= 3;
}
function palpiteKeyOf(playerIdx) {
  const p = players[playerIdx];
  if (!p) return null;
  return CURRENT_FORMAT === "equipe" ? p.team : p.id;
}
function palpiteCount(key) {
  return (key !== null && key !== void 0 && palpiteHolders[key]) || 0;
}
function grantPalpite(playerIdx) {
  if (!palpiteAvailable()) return "indisponivel";
  const key = palpiteKeyOf(playerIdx);
  if (key === null) return "indisponivel";
  if (palpiteCount(key) >= 1) return "fominha";
  if (palpiteStock <= 0) return "sem-estoque";
  palpiteStock--;
  palpiteHolders[key] = palpiteCount(key) + 1;
  return "ganhou";
}
function consumePalpite(key) {
  if (palpiteCount(key) <= 0) return false;
  palpiteHolders[key]--;
  if (palpiteHolders[key] <= 0) delete palpiteHolders[key];
  palpiteStock++;
  return true;
}
function palpiteEligibleHolders() {
  if (!palpiteAvailable() || !currentCard) return [];
  const blocked = new Set([palpiteKeyOf(mestreIndex), palpiteKeyOf(responderIndex)]);
  let keys = Object.keys(palpiteHolders).filter((k) => palpiteHolders[k] > 0 && !blocked.has(k));
  if (currentCard.isBonus) return [];
  return keys;
}
function palpiteEligibleScorers() {
  const keys = palpiteEligibleHolders();
  if (CURRENT_FORMAT === "equipe") return players.map((p, i) => i).filter((i) => keys.includes(players[i].team));
  return keys.map((k) => jogadorIdxPorId(k)).filter((i) => i >= 0);
}
function palpiteHit(key) {
  if (pendingIndex === null || gameEnded || !palpiteEligibleHolders().includes(key)) return;
  const t = CURRENT_FORMAT === "equipe" ? teams[key] : null;
  const idx = t ? (t.members && t.members.length ? t.members[t.memberCursor % t.members.length] : null) : jogadorIdxPorId(key);
  if (idx === null || idx === void 0 || idx < 0) return;
  markCorrect(idx);
}
function palpiteMiss(key) {
  if (pendingIndex === null || gameEnded || !palpiteEligibleHolders().includes(key)) return;
  consumePalpite(key);
  const d = entityDisplay(key);
  showToastMessage(`🃏 ${d.name} errou o palpite — sem penalidade, a ficha voltou pro estoque.`, null, true);
  render();
  saveGameState();
}
function deckLimiteModo() {
  return DECK_LIMITE[CURRENT_MODE] || 400;
}
function buildHardcoreClueSet(shuffledClues) {
  const reals = shuffledClues.filter((c) => c.type === "clue");
  const specials = shuffledClues.filter((c) => c.type === "special");
  const specialCount = Math.min(specials.length, sorteioRegra() < 0.5 ? 1 : 2);
  const chosenSpecials = shuffle(specials).slice(0, specialCount);
  const chosenReals = shuffle(reals).slice(0, 10 - chosenSpecials.length);
  return shuffle([...chosenReals, ...chosenSpecials]);
}
function isJfPlayer(p) {
  return !!p && isJfName(p.name);
}
function specialIsVoid(item) {
  if (!item || item.type !== "special" || CURRENT_MODE === "express") return false;
  if (isWildcardSpecial(item.text)) {
    const e = revealedOrder.find((r) => r.index === pendingIndex);
    return !(e && (e.palpiteResult === "ganhou" || e.palpiteResult === "fominha"));
  }
  return false;
}
function expressTimes() {
  return EXPRESS_TIMES[expressFlavor === "hardcore" ? "hardcore" : "classico"];
}
function expressPoints(realRevealed) {
  return Math.max(1, Math.min(10, 11 - realRevealed));
}
function applySpecialMove(targetIdx, amount) {
  if (gameEnded) return;
  if (players[targetIdx] && targetIdx !== responderIndex) caosMesaAlvo(responderIndex, targetIdx, amount);
  if (players[targetIdx] && amount) {
    vibrar(amount > 0 ? "avanca" : "volta");
    fxFloat(
      `${amount > 0 ? "⬆️ +" : "⬇️ "}${amount} ${Math.abs(amount) === 1 ? "casa" : "casas"} · ${players[targetIdx].name}`,
      amount > 0 ? "#60a5fa" : "#f87171",
    );
  }
  if (CURRENT_FORMAT === "equipe" && players[targetIdx]) {
    return applyTeamSpecialMove(players[targetIdx].team, amount, false);
  }
  if (!players[targetIdx]) return;
  const p = players[targetIdx];
  p.position = Math.max(0, Math.min(Math.max(WINNING_SCORE, p.position), p.position + amount));
  renderMiniScoreboard();
  renderScoreboard();
  if (victoryReached() && !ultimaRodadaAtiva()) {
    saveGameState();
    endGame();
    return;
  }
  maybeShowMoveSpecialFlavor(p.name, amount, targetIdx !== responderIndex);
  afterMoveSpecial();
}
function isValidEquipeCount(n) {
  return n === 4 || n === 6;
}
function hasEnoughPlayersForFormat() {
  return CURRENT_FORMAT === "equipe" ? isValidEquipeCount(players.length) : players.length >= MIN_PLAYERS;
}
function sanitizePlayerColor(name, color) {
  const solids = PLAYER_COLORS.filter((c) => c !== "RGB" && !GRADIENTS[c]);
  const used = new Set(players.map((p) => p.color));
  const pick = () => {
    const free = solids.filter((c) => !used.has(c));
    const pool = free.length ? free : solids;
    return pool[Math.floor(Math.random() * pool.length)];
  };
  let final = color;
  if (isJfName(name) && !used.has("RGB")) final = "RGB";
  else if (isAnneName(name) && !used.has("GRAD_PRINCESA")) final = "GRAD_PRINCESA";
  else if (isEnigmaName(name) && !used.has("GRAD_ONYX")) final = "GRAD_ONYX";
  else if (final === "RGB" || final === "GRAD_PRINCESA") final = pick();
  if (document.body.classList.contains("batata-mode") && (final === "RGB" || GRADIENTS[final]))
    final = isAnneName(name) && !used.has("#ff9ecd") ? "#ff9ecd" : pick();
  return final;
}
function sanitizePlayerAvatar(name, avatar) {
  const used = new Set(players.map((p) => p.avatar));
  if (isJfName(name) && !used.has("😎")) return "😎";
  if (isAnneName(name) && !used.has("👸")) return "👸";
  if (AVATAR_EXCLUSIVE.includes(avatar)) {
    const free = avatarsForMode().find((a) => !used.has(a));
    return free || avatar;
  }
  return avatar;
}
function computeMvp() {
  const validHistory = history.filter((h) => typeof h.cluesUsed === "number" && h.playerName);
  if (validHistory.length === 0) return null;
  const byPlayer = {};
  validHistory.forEach((h) => {
    if (!byPlayer[h.playerName])
      byPlayer[h.playerName] = { color: h.playerColor, avatar: h.playerAvatar, totalPts: 0, count: 0 };
    byPlayer[h.playerName].totalPts += h.points;
    byPlayer[h.playerName].count += 1;
  });
  const ranked = Object.entries(byPlayer).map(([name, d]) => ({
    name,
    color: d.color,
    avatar: d.avatar,
    avg: d.totalPts / d.count,
  }));
  if (ranked.length === 0) return null;
  return ranked.reduce((a, b) => (a.avg > b.avg ? a : b));
}
function cardsForExpressCategory(cat) {
  return ADULT_CARDS.filter(
    (c) =>
      (c.category === cat || (cat === "COISA" && c.category === "ANIMAL")) &&
      (expressFlavor === "hardcore" || !c.soExpressHardcore),
  );
}
function jfPlayerIndex() {
  return players.findIndex((p) => isJfName(p.name));
}
function isEnigmaName(n) {
  return /^(o\s*)?enigmatico([^a-z]|$)/.test(nameKeyPlain(n));
}
// 1.7.7.8: cadeado no placar pra quem já levou as 2 joias desta rodada (a trava fica visível, não é surpresa).
function joiasTravaBadge(key) {
  if (!joiasComTrava() || (joiasRodada[String(key)] || 0) < JOIAS_POR_RODADA) return "";
  return ` <span class="joia-trava" title="Já ganhou ${JOIAS_POR_RODADA} joias nesta rodada: a próxima só na rodada que vem" aria-label="joias desta rodada completas">🔒</span>`;
}
function gemBadgesHtml(holder) {
  const g = holder && holder.gems ? holder.gems : null;
  if (!g) return "";
  return currentGemCategories()
    .filter((c) => g[c] > 0)
    .map((c) => {
      const i = GEM_INFO[c];
      return ` <span class="gem" style="color:${i.color}" title="Joia de ${i.name}">◆${i.letter}${g[c] > 1 ? "×" + g[c] : ""}</span>`;
    })
    .join("");
}
function palpiteBadge(key) {
  const n = palpiteCount(key);
  return n > 0 ? ` <span title="fichas de palpite">🃏×${n}</span>` : "";
}
function buildPalpiteBoxHtml() {
  const keys = palpiteEligibleHolders();
  if (keys.length === 0) return "";
  const rows = keys
    .map((k) => {
      const d = entityDisplay(k);
      const n = palpiteCount(k);
      return `<div class="palpite-row"><span>🃏 ${playerNameHtml(d.name, d.color, d.avatar)}${n > 1 ? " ×" + n : ""}</span><span><button class="btn-correct palpite-hit" data-key="${k}">✓ Acertou</button> <button class="btn-wrong palpite-miss" data-key="${k}">✕ Errou</button></span></div>`;
    })
    .join("");
  return `<div class="palpite-box"><div class="palpite-title">🃏 Alguém usou o palpite a qualquer hora? (fichas no estoque: ${palpiteStock})</div>${rows}</div>`;
}

