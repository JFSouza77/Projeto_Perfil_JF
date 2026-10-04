/* ----------------------------------------------------------------------
 * 5e. COMO SE GANHA (1.7.6.7): mini tutorial de 5 passos pra cada condição de vitória
 * (Clássico/Tabuleiro, Pontos, Só Joias e A Moda da Casa), com os números da partida.
 * Usa a mesma janela do tutorial (openTutorial("vitoria:<condição>")).
 *  · abre sozinho no começo da partida, na 1ª vez que a condição aparece neste aparelho
 *    (na Moda da Casa, logo depois da roleta, explicando o modo sorteado);
 *  · botão "📖 Como funciona?" no cadastro e na roleta; "🏆 Como se ganha" na Pausa.
 * ---------------------------------------------------------------------- */
const VITORIA_TUT_KEY = "perfil5_tut_vitoria_vistos";
function vitoriaEquipe() {
  return CURRENT_FORMAT === "equipe";
}
function vitoriaQuem() {
  return vitoriaEquipe() ? "a equipe" : "você";
}
function vitoriaCasaFinal() {
  return WINNING_SCORE || 200;
}
function vitoriaMetaPontos() {
  if (WIN_CONDITION === "casa") return CASA_META_PONTOS[Math.max(2, Math.min(6, players.length || 2))];
  return metaPontos();
}
function vitoriaLimiteJoia(cond) {
  const base = GEM_CLUE_LIMIT[CURRENT_MODE] || 5;
  return cond === "casa" || (WIN_CONDITION === "casa" && casaSorteado === "joias") ? base + CASA_JOIA_DICAS_EXTRA : base;
}
function vitoriaCategoriasJoia() {
  const ic = { ANO: "📅 Ano", PESSOA: "🧑 Pessoa", LUGAR: "📍 Lugar", COISA: "📦 Coisa", ANIMAL: "🐾 Animal" };
  return currentGemCategories()
    .map((c) => ic[c])
    .join(", ");
}
const VITORIA_JOIAS_MOCK =
  '<div class="tut-row"><span class="tut-chip on">📅 Ano</span><span class="tut-chip on">🧑 Pessoa</span><span class="tut-chip">📍 Lugar</span><span class="tut-chip">📦 Coisa</span></div>';
// Cada condição: lista de 5 passos montada na hora (os números dependem do modo e da mesa).
const VITORIA_TUTORIAIS = {
  tabuleiro: () => [
    {
      icon: "🎲",
      title: "Clássico: uma corrida",
      text: `É o Perfil de tabuleiro: ganha quem chegar primeiro na <b>casa ${vitoriaCasaFinal()}</b>.${vitoriaEquipe() ? " No Equipe, a equipe anda junta." : ""}`,
    },
    {
      icon: "🏁",
      title: "Acertou, andou",
      text: "Acertou na 3ª dica? Anda <b>17 casas</b> (20 menos 3). O Mestre anda as dicas que leu. Ninguém acertou? O Mestre anda 20.",
      mock: '<div class="tut-row"><span class="tut-chip on">Dica 1 → 19 casas</span><span class="tut-chip">Dica 3 → 17 casas</span></div>',
      dark: true,
    },
    {
      icon: "⭐",
      title: "Avance e Volte",
      text: "Algumas surpresas mexem no tabuleiro: <b>Avance 2 casas</b>, <b>Volte 3 casas</b>… Aqui elas contam de verdade.",
    },
    {
      icon: "🎁",
      title: "Casa de bônus",
      text: "A cada 10 casas tem uma <b>casa de bônus</b>. Parou nela? Duelo valendo o dobro contra quem você escolher.",
    },
    {
      icon: "🚫",
      title: "Sem joias",
      text: "No Clássico não tem joias, e os pontos não decidem nada: <b>só a casa importa</b>. Corre!",
    },
  ],
  pontos: () => [
    {
      icon: "🔢",
      title: "Pontos: quem somar mais",
      text: `Ganha quem chegar a <b>${vitoriaMetaPontos()} pontos</b> primeiro${vitoriaEquipe() ? " (soma dos pontos da equipe)" : ""}.`,
    },
    {
      icon: "🧮",
      title: "Como ganha ponto",
      text: "A carta vale 20. Quem acerta leva <b>20 menos as dicas lidas</b>. O Mestre leva as dicas lidas. Ninguém acertou? Os 20 vão pro Mestre.",
    },
    {
      icon: "⚡",
      title: "Arriscar cedo vale",
      text: "Acertar na 1ª dica dá <b>19 pontos</b>. Na 10ª, só 10. Quanto mais cedo, mais ponto.",
      mock: '<div class="tut-row"><span class="tut-chip on">Dica 1 → 19 pts</span><span class="tut-chip">Dica 10 → 10 pts</span></div>',
      dark: true,
    },
    {
      icon: "⭐",
      title: "Avance e Volte não contam",
      text: "As surpresas de andar casas mexem só no tabuleiro, e aqui o tabuleiro é <b>só enfeite</b>. Ponto não se perde nem se ganha com elas.",
    },
    {
      icon: "🚫",
      title: "Sem joias",
      text: "Em Pontos não tem joias. É só somar e chegar na meta primeiro.",
    },
  ],
  joias: () => [
    {
      icon: "💎",
      title: "O que são as joias",
      text: `São <b>4 joias</b>, uma de cada categoria: ${vitoriaCategoriasJoia()}.`,
      mock: VITORIA_JOIAS_MOCK,
      dark: true,
    },
    {
      icon: "🎯",
      title: "Como ganhar uma joia",
      text: `Acerte a carta usando <b>até ${vitoriaLimiteJoia()} dicas</b> e ${vitoriaQuem()} ganha a joia daquela categoria. As surpresas (instruções especiais) não contam como dica.`,
    },
    {
      icon: "🏆",
      title: "Como vence",
      text: `Juntou as <b>4 joias</b>, uma de cada categoria? Ganhou! Já tem a joia de uma categoria? Acertar outra igual não dá mais uma. Carta bônus não dá joia.`,
    },
    {
      icon: "🔒",
      title: "No máximo 2 por rodada",
      text: `Cada ${vitoriaEquipe() ? "equipe" : "jogador"} ganha <b>no máximo ${JOIAS_POR_RODADA} joias por rodada</b>. Assim ninguém dispara sozinho.`,
    },
    {
      icon: "🎲",
      title: "E o tabuleiro?",
      text: `O tabuleiro anda normalmente, mas chegar na casa ${vitoriaCasaFinal()} <b>não vence</b>. Aqui o que vale são as joias.`,
    },
  ],
  casa: () => [
    {
      icon: "🏠",
      title: "A Moda da Casa",
      text: "No começo da partida o C.A.O.S. <b>gira uma roleta</b> e sorteia como a mesa vai ganhar. Vale pra todo mundo.",
      mock: '<div class="roulette" style="padding:6px 0;"><div class="roulette-phrase"><span class="roulette-reel landed">💎 JOIAS</span></div></div>',
    },
    {
      icon: "🎲",
      title: "Pode sair Tabuleiro",
      text: `Vence quem chegar primeiro na <b>casa ${vitoriaCasaFinal()}</b>.`,
    },
    {
      icon: "🔢",
      title: "Pode sair Pontos",
      text: `Vence quem somar <b>${vitoriaMetaPontos()} pontos</b> primeiro. O tabuleiro vira enfeite.`,
    },
    {
      icon: "💎",
      title: "Pode sair Joias",
      text: `Vence quem juntar as <b>4 joias</b> (uma por categoria). Na Moda da Casa, cada joia vale acertando com até <b>${vitoriaLimiteJoia("casa")} dicas</b>.`,
      mock: VITORIA_JOIAS_MOCK,
      dark: true,
    },
    {
      icon: "🔁",
      title: "Nunca repete",
      text: "A roleta nunca repete o modo da partida anterior. Esqueceu qual saiu? Toque em <b>⏸️ Pausar</b> → <b>🏆 Como se ganha</b>.",
    },
  ],
};
function vitoriaTutNome(cond) {
  const w = WIN_CONDITIONS[cond];
  return w ? w.icon + " " + w.label : "";
}
function vitoriaTutPassos(cond) {
  const f = VITORIA_TUTORIAIS[cond];
  return f ? f() : null;
}
function vitoriaTutVistos() {
  try {
    const l = JSON.parse(JFStore.getItem(VITORIA_TUT_KEY) || "[]");
    return Array.isArray(l) ? l : [];
  } catch (e) {
    return [];
  }
}
function vitoriaTutMarcar(cond) {
  try {
    const l = vitoriaTutVistos();
    if (!l.includes(cond)) {
      l.push(cond);
      JFStore.setItem(VITORIA_TUT_KEY, JSON.stringify(l));
    }
  } catch (e) {}
}
// Abre sozinho só na 1ª vez de cada condição neste aparelho.
function vitoriaTutTalvez(cond) {
  if (CURRENT_MODE === "express" || !VITORIA_TUTORIAIS[cond] || vitoriaTutVistos().includes(cond)) return false;
  openTutorial("vitoria:" + cond);
  return true;
}
// Começo da partida (beginGameplay). Na Moda da Casa quem chama é a roleta, depois do sorteio.
function vitoriaTutInicio() {
  if (CURRENT_MODE === "express" || WIN_CONDITION === "casa") return;
  setTimeout(() => vitoriaTutTalvez(winCond()), 500);
}
// Botão "📖 Como funciona?" do cadastro: explica a condição marcada.
function vitoriaTutBotaoHtml() {
  return `<button type="button" class="btn-sec wincond-tut" id="winCondTutBtn">📖 Como funciona? (5 passos)</button>`;
}
