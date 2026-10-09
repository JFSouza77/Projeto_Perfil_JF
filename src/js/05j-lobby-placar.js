/* ----------------------------------------------------------------------
 * 5j. LOBBY COM ABAS: TABULEIRO, PONTOS E JOIAS (1.7.9.6 · Board Update 5, ideia aprovada pelo JF)
 * O lobby entre as cartas (05i-tabuleiro.js) ganha abas. Abre direto na aba da condição de vitória.
 *  · Tabuleiro: o desenho com zoom e régua, e a lista de quem está na frente.
 *  · Pontos: "corrida de barras" com pódio (1º, 2º e 3º em degraus) e quanto cada um ganhou na carta.
 *  · Joias: cada jogador (ou equipe) com a sua coroa, um encaixe por joia; a joia ganha na carta
 *    entra brilhando, e embaixo diz o que falta. Só aparece quando a partida dá joias.
 *    1.7.9.8: cada joia tem o seu formato (joiaHtml, 03-regras.js) e o seu encaixe, em ordem alfabética.
 * É só tela, como o lobby: lê o placar, não muda nada.
 * ---------------------------------------------------------------------- */
const LOBBY_ABAS = {
  tabuleiro: { ic: "🗺️", nome: "Tabuleiro" },
  pontos: { ic: "🏆", nome: "Pontos" },
  joias: { ic: "💎", nome: "Joias" },
};
// Quem aparece no lobby: as equipes (no formato Equipe) ou os jogadores. A chave k é a mesma dos peões.
function lobbyEntidades() {
  const cats = currentGemCategories();
  const gemas = (h) => Object.fromEntries(cats.map((c) => [c, (h && h.gems && h.gems[c]) || 0]));
  if (CURRENT_FORMAT === "equipe")
    return teamOrder.map((id) => ({
      k: "t" + id,
      nome: `${TEAM_INFO[id].emoji} Equipe ${TEAM_INFO[id].label}`,
      cor: corDoJogador(TEAM_INFO[id].color),
      tok: TEAM_INFO[id].emoji,
      pos: teams[id].position || 0,
      pts: teamScore(id),
      gems: gemas(teams[id]),
    }));
  return players.map((p) => ({
    k: "p" + (p.id || p.name),
    nome: playerNameHtml(p.name, p.color, p.avatar),
    cor: corDoJogador(p.color),
    tok: escapeHtml(p.avatar || (p.name ? p.name[0].toUpperCase() : "?")),
    pos: p.position || 0,
    pts: p.score || 0,
    gems: gemas(p),
  }));
}
// Foto do placar num lobby (pra mostrar o que mudou no seguinte).
function lobbyFoto() {
  const f = { pos: {}, pts: {}, gems: {} };
  lobbyEntidades().forEach((e) => {
    f.pos[e.k] = e.pos;
    f.pts[e.k] = e.pts;
    f.gems[e.k] = { ...e.gems };
  });
  return f;
}
function lobbyFotoZero(f) {
  const z = { pos: {}, pts: {}, gems: {} };
  Object.keys(f.pos).forEach((k) => {
    z.pos[k] = 0;
    z.pts[k] = 0;
    z.gems[k] = {};
  });
  return z;
}
function lobbyAbasDisponiveis() {
  return ["tabuleiro", "pontos"].concat(gemsAwarded() ? ["joias"] : []);
}
// Abre na aba que decide a partida (Moda da Casa: a do modo sorteado; antes do sorteio, Tabuleiro).
function lobbyAbaInicial() {
  const w = winCond();
  const aba = w === "pontos" ? "pontos" : w === "joias" ? "joias" : "tabuleiro";
  return lobbyAbasDisponiveis().includes(aba) ? aba : "tabuleiro";
}
function lobbyVale(aba) {
  const w = winCond();
  if (aba === "tabuleiro") return boardCountsForWin();
  if (aba === "pontos") return w === "pontos";
  return gemsCountForWin();
}
function lobbyAbasHtml(inicial) {
  const abas = lobbyAbasDisponiveis();
  return `<div class="lb-abas" role="tablist" aria-label="O que ver">${abas
    .map(
      (a) =>
        `<button type="button" role="tab" class="lb-aba${a === inicial ? " on" : ""}" data-aba="${a}" aria-selected="${a === inicial}">${LOBBY_ABAS[a].ic} ${LOBBY_ABAS[a].nome}${lobbyVale(a) ? ' <span class="lb-vale" title="Decide a partida">🎯</span>' : ""}</button>`,
    )
    .join("")}</div>`;
}
function lobbyGanhoSelo(d) {
  if (!d) return "";
  return `<span class="tg-andou${d > 0 ? " tg-subiu" : " tg-desceu"}">${d > 0 ? "+" + d : d}</span>`;
}

/* --- Pontos: corrida de barras com pódio --- */
function lobbyPontosHtml(antes) {
  const ents = lobbyEntidades().sort((a, b) => b.pts - a.pts);
  const valePontos = winCond() === "pontos";
  const meta = valePontos ? metaPontos() : 0;
  const escala = Math.max(meta, ...ents.map((e) => e.pts), 1);
  const ant = (e) => (antes && antes.pts && typeof antes.pts[e.k] === "number" ? antes.pts[e.k] : null);
  // pódio: 2º, 1º, 3º (só com pontos de verdade)
  const top = ents.slice(0, 3).filter((e) => e.pts > 0);
  const degrau = (e, lugar) =>
    e
      ? `<div class="lp-degrau lp-${lugar}" style="--pc:${e.cor}"><div class="lp-tok">${e.tok}</div><div class="lp-nome">${e.nome}</div><div class="lp-bloco"><b>${["", "🥇", "🥈", "🥉"][lugar]}</b><span>${e.pts} pt${e.pts === 1 ? "" : "s"}</span></div></div>`
      : `<div class="lp-degrau lp-${lugar} lp-vazio"><div class="lp-bloco"></div></div>`;
  const podio = top.length
    ? `<div class="lp-podio">${degrau(top[1], 2)}${degrau(top[0], 1)}${degrau(top[2], 3)}</div>`
    : `<div class="lp-vazio-txt">Ninguém pontuou ainda. O pódio tá esperando.</div>`;
  const barras = ents
    .map((e) => {
      const a = ant(e);
      const de = a === null ? e.pts : a;
      return `<li class="lp-linha" style="--pc:${e.cor}"><div class="lp-topo"><span>${e.nome}${a === null ? "" : lobbyGanhoSelo(e.pts - a)}</span><b>${e.pts}${valePontos ? `/${meta}` : ""}</b></div><div class="lp-trilho"><div class="lp-barra" data-de="${((de / escala) * 100).toFixed(1)}" data-ate="${((e.pts / escala) * 100).toFixed(1)}" style="width:${((de / escala) * 100).toFixed(1)}%"></div>${valePontos ? '<i class="lp-chegada" title="Meta"></i>' : ""}</div></li>`;
    })
    .join("");
  const cab = valePontos
    ? `🎯 Vence quem chegar a <b>${meta} pontos</b>${CURRENT_FORMAT === "equipe" ? " (soma da equipe)" : ""}.`
    : "Nesta partida os pontos não decidem quem vence. Valem pela glória.";
  return `<div class="lp-cab">${cab}</div>${podio}<ul class="lp-lista">${barras}</ul>`;
}

/* --- Joias: a coroa de cada um --- */
function lobbyJoiasHtml(antes) {
  const cats = currentGemCategories();
  const vale = gemsCountForWin();
  const cap = gemCapFor();
  const ents = lobbyEntidades()
    .map((e) => ({ ...e, total: cats.reduce((s, c) => s + e.gems[c], 0) }))
    .sort((a, b) => b.total - a.total);
  const nomeCat = (c) => `${CAT_SELO_ICONE[c] || "💎"} ${c.charAt(0) + c.slice(1).toLowerCase()}`;
  const linhas = ents
    .map((e) => {
      const ant = antes && antes.gems && antes.gems[e.k];
      // 1.7.9.8: cada categoria tem o seu encaixe (em ordem alfabética), no formato da joia dela;
      // o encaixe vazio mostra a sombra da joia que falta
      const encaixes = [];
      joiasEmOrdem(cats).forEach((c) => {
        const novas = ant ? Math.max(0, e.gems[c] - (ant[c] || 0)) : 0;
        if (!e.gems[c] && cap === 1) encaixes.push(joiaHtml(c, "lj-joia lj-oca", ""));
        for (let i = 0; i < e.gems[c]; i++) encaixes.push(joiaHtml(c, "lj-joia" + (i >= e.gems[c] - novas ? " lj-nova" : "")));
      });
      while (encaixes.length < GEMS_TO_WIN) encaixes.push('<span class="joia-f lj-joia lj-oca jf-vazia" aria-hidden="true"></span>');
      const faltam = cap === 1 ? joiasEmOrdem(cats).filter((c) => !e.gems[c]) : [];
      const quase = vale && e.total === GEMS_TO_WIN - 1;
      const pe =
        e.total >= GEMS_TO_WIN
          ? "👑 Coroa completa!"
          : faltam.length
            ? `Falta: ${faltam.map(nomeCat).join(", ")}`
            : `${GEMS_TO_WIN - e.total} joia${GEMS_TO_WIN - e.total === 1 ? "" : "s"} pra completar`;
      return `<li class="lj-linha${quase ? " lj-quase" : ""}" style="--pc:${e.cor}"><div class="lj-topo"><span>${e.nome}</span><b>${e.total}/${GEMS_TO_WIN}</b></div><div class="lj-coroa"><span class="lj-ic" aria-hidden="true">👑</span>${encaixes.join("")}</div><div class="lj-pe">${quase ? "⚠️ A uma joia da coroa! · " : ""}${pe}</div></li>`;
    })
    .join("");
  const cab = vale
    ? `🎯 Vence quem completar a coroa com <b>${GEMS_TO_WIN} joias</b>.`
    : "Nesta partida as joias são troféu: contam pra história, não pra vitória.";
  return `<div class="lp-cab">${cab}</div><ul class="lj-lista">${linhas}</ul>`;
}

// Liga as abas: troca o painel, refaz o zoom do tabuleiro quando ele volta a aparecer e faz as barras
// dos pontos crescerem do valor de antes até o de agora.
function lobbyAbasInstalar(ov) {
  const crescer = (painel) => {
    if (!painel || painel.dataset.cresceu) return;
    painel.dataset.cresceu = "1";
    const barras = painel.querySelectorAll(".lp-barra[data-ate]");
    const ir = () => barras.forEach((b) => (b.style.width = b.dataset.ate + "%"));
    if (typeof semMovimento === "function" && semMovimento()) ir();
    else requestAnimationFrame(() => requestAnimationFrame(ir));
  };
  const mostrar = (aba) => {
    ov.querySelectorAll(".lb-aba").forEach((b) => {
      const on = b.dataset.aba === aba;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", String(on));
    });
    ov.querySelectorAll(".lb-painel").forEach((p) => (p.hidden = p.dataset.aba !== aba));
    if (aba === "tabuleiro") {
      const caixa = ov.querySelector("#tabCaixaLobby");
      if (caixa && caixa._zoom) caixa._zoom.pintar();
    }
    if (aba === "pontos") crescer(ov.querySelector('.lb-painel[data-aba="pontos"]'));
  };
  ov.querySelectorAll(".lb-aba").forEach((b) =>
    b.addEventListener("click", () => {
      mostrar(b.dataset.aba);
      tabCaosNoTabuleiro("aba");
    }),
  );
  const ini = ov.querySelector(".lb-aba.on");
  mostrar(ini ? ini.dataset.aba : "tabuleiro");
}
