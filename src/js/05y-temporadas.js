/* =========================================================================================================
   Temporadas (pedido do JF, 30/10/2026; plano em docs/Temporadas.md)
   O jogo olha a data do aparelho e entra no clima da época (Natal, Halloween, Carnaval, aniversário do JF...).
   Este arquivo é só o motor: qual temporada vale numa data, a opção de ligar/desligar (Acessibilidade) e o modo
   de teste (?temporada=natal na URL). O visual, as falas, a lojinha e as cartas de cada temporada usam
   temporadaAtual() e a marca data-temporada no <html>.
   · Datas móveis: Carnaval (sábado até a Quarta de Cinzas) e Páscoa (Sexta-feira Santa ao domingo) saem da
     Páscoa; Dia das Mães e dos Pais são o 2º domingo de maio e de agosto; Black Friday é a sexta depois da 4ª
     quinta de novembro (até o domingo).
   · Duas juntas: ganha a de um dia só, depois a janela curta, depois a longa (Dia dos Namorados ganha da Festa
     Junina; Ano Novo ganha do Natal no dia 31).
   · Online: cada aparelho segue a própria data; pra pontuação, vale a do host (temporadaAtual(dataDoHost)).
   ========================================================================================================= */
const TEMPORADA_TESTE_KEY = "perfil_jf_temporada_teste";
// prio: 2 = um dia só, 1 = janela curta (até uma semana), 0 = janela longa
const TEMPORADAS = [
  { id: "anoNovo", nome: "Ano Novo", selo: "Edição de Ano Novo", emoji: "🎆", prio: 2, vale: (d, m, a) => (m === 12 && d === 31) || (m === 1 && d === 1) },
  { id: "aniversario", nome: "Aniversário do criador", selo: "Edição de aniversário do criador", emoji: "🎂", prio: 2, vale: (d, m) => m === 1 && d === 2 },
  { id: "carnaval", nome: "Carnaval", selo: "Edição de Carnaval", emoji: "🎭", prio: 1, vale: (d, m, a, t) => temporadaEntre(t, temporadaPascoa(a), -50, -46) },
  { id: "mulher", nome: "Dia da Mulher", selo: "Edição Dia da Mulher", emoji: "💐", prio: 2, vale: (d, m) => m === 3 && d === 8 },
  { id: "pascoa", nome: "Páscoa", selo: "Edição de Páscoa", emoji: "🐣", prio: 1, vale: (d, m, a, t) => temporadaEntre(t, temporadaPascoa(a), -2, 0) },
  { id: "maes", nome: "Dia das Mães", selo: "Edição Dia das Mães", emoji: "💐", prio: 2, vale: (d, m, a, t) => temporadaMesmoDia(t, temporadaDomingo(a, 4, 2)) },
  { id: "namorados", nome: "Dia dos Namorados", selo: "Edição Dia dos Namorados", emoji: "💘", prio: 2, vale: (d, m) => m === 6 && d === 12 },
  { id: "junina", nome: "Festa Junina", selo: "Edição Junina", emoji: "🌽", prio: 0, vale: (d, m) => m === 6 },
  { id: "pais", nome: "Dia dos Pais", selo: "Edição Dia dos Pais", emoji: "👔", prio: 2, vale: (d, m, a, t) => temporadaMesmoDia(t, temporadaDomingo(a, 7, 2)) },
  { id: "folclore", nome: "Folclore", selo: "Edição do Folclore", emoji: "🌳", prio: 2, vale: (d, m) => m === 8 && d === 22 },
  { id: "independencia", nome: "Independência", selo: "Edição da Independência", emoji: "🇧🇷", prio: 2, vale: (d, m) => m === 9 && d === 7 },
  { id: "criancas", nome: "Dia das Crianças", selo: "Edição Dia das Crianças", emoji: "🧸", prio: 1, vale: (d, m) => m === 10 && d >= 6 && d <= 12 },
  { id: "halloween", nome: "Halloween", selo: "Edição Halloween", emoji: "🎃", prio: 1, vale: (d, m) => m === 10 && d >= 20 },
  { id: "blackfriday", nome: "Black Friday", selo: "Edição Black Friday", emoji: "🏷️", prio: 1, vale: (d, m, a, t) => temporadaEntre(t, temporadaBlackFriday(a), 0, 2) },
  { id: "natal", nome: "Natal", selo: "Edição de Natal", emoji: "🎄", prio: 0, vale: (d, m) => m === 12 && d <= 30 },
];
// Domingo de Páscoa (calendário gregoriano, algoritmo de Meeus/Jones/Butcher), como Date local ao meio-dia
function temporadaPascoa(a) {
  const b = Math.floor(a / 100),
    c = a % 100,
    g = a % 19,
    h = (19 * g + b - Math.floor(b / 4) - Math.floor((8 * b + 13) / 25) + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * (b % 4) + 2 * i - h - k) % 7,
    m = Math.floor((g + 11 * h + 22 * l) / 451),
    mes = Math.floor((h + l - 7 * m + 114) / 31),
    dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(a, mes - 1, dia, 12);
}
// n-ésimo domingo do mês (mes 0 = janeiro)
function temporadaDomingo(a, mes, n) {
  const d = new Date(a, mes, 1, 12);
  d.setDate(1 + ((7 - d.getDay()) % 7) + 7 * (n - 1));
  return d;
}
// sexta depois da 4ª quinta de novembro
function temporadaBlackFriday(a) {
  const d = new Date(a, 10, 1, 12);
  d.setDate(1 + ((4 - d.getDay() + 7) % 7) + 21 + 1);
  return d;
}
function temporadaDiaN(t) {
  return Math.round(new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12).getTime() / 864e5);
}
function temporadaMesmoDia(t, ref) {
  return temporadaDiaN(t) === temporadaDiaN(ref);
}
function temporadaEntre(t, ref, de, ate) {
  const x = temporadaDiaN(t) - temporadaDiaN(ref);
  return x >= de && x <= ate;
}
// A temporada de uma data (sem olhar a opção nem o modo de teste), ou null
function temporadaDe(data) {
  const t = data instanceof Date ? data : new Date(data);
  if (isNaN(t)) return null;
  const d = t.getDate(),
    m = t.getMonth() + 1,
    a = t.getFullYear();
  let melhor = null;
  TEMPORADAS.forEach((s) => {
    try {
      if (s.vale(d, m, a, t) && (!melhor || s.prio > melhor.prio)) melhor = s;
    } catch (e) {}
  });
  return melhor;
}
function temporadaPorId(id) {
  return TEMPORADAS.find((s) => s.id === id) || null;
}
// Modo de teste (só pra desenvolvimento): ?temporada=natal na URL, ou a chave no aparelho. "nenhuma" = fora de época
function temporadaForcada() {
  try {
    const u = new URLSearchParams(location.search).get("temporada");
    const v = u || JFStore.getItem(TEMPORADA_TESTE_KEY);
    if (!v) return undefined;
    return v === "nenhuma" ? null : temporadaPorId(v) || undefined;
  } catch (e) {
    return undefined;
  }
}
function temporadasLigadas() {
  return typeof acessCfg === "undefined" || acessCfg.temporadas !== false;
}
// A temporada que vale agora neste aparelho (ou na data dada, por exemplo a do host), ou null
function temporadaAtual(data) {
  if (!temporadasLigadas()) return null;
  const f = temporadaForcada();
  if (f !== undefined) return f;
  return temporadaDe(data || new Date());
}
// Marca a temporada no <html> (data-temporada="natal"); o visual de cada temporada pendura nisso (11-temporadas.css):
// uma camada de enfeites atrás do conteúdo (não pega toque nem cobre texto) e o selo na splash.
function temporadaAplicar() {
  try {
    const t = temporadaAtual();
    const h = document.documentElement;
    if (t) h.dataset.temporada = t.id;
    else delete h.dataset.temporada;
    if (!document.body) return;
    if (!document.getElementById("temporadaEnfeite")) {
      const e = document.createElement("div");
      e.id = "temporadaEnfeite";
      e.className = "tmp-enfeite";
      e.setAttribute("aria-hidden", "true");
      e.innerHTML = '<div class="tmp-neve"></div><div class="tmp-luzes"></div>';
      document.body.prepend(e);
    }
    const log = document.getElementById("splashBuildLog");
    let selo = document.getElementById("splashTemporada");
    if (!selo && log) {
      selo = document.createElement("div");
      selo.id = "splashTemporada";
      selo.className = "splash-temporada";
      log.parentNode.insertBefore(selo, log);
    }
    if (selo) {
      selo.textContent = t ? t.emoji + " " + t.selo : "";
      selo.hidden = !t;
    }
  } catch (e) {}
}

/* Temporadas · item 4: o C.A.O.S. bonzinho do Natal (e do Ano Novo). Pedido do JF em 30/10/2026:
   - Modo C.A.O.S.: o 🎁 Presente pode sair até 3 vezes por partida (fora da temporada, 1) e também pros favoritos
     dele, mesmo quem não precisa ("toma um pontinho extra").
   - Joia de presente: chance bem baixa, 1 por partida, só onde joias contam pra vencer (Joias, Express, Moda da Casa
     com joias). Dá uma joia que falta e respeita a trava de 2 por rodada. NUNCA a 4ª joia: quem já tem 3 não ganha.
     Ele pode ajudar, mas nunca entregar a vitória. */
const TEMPORADA_BONZINHA = ["natal", "anoNovo"];
const TEMPORADA_PRESENTES_MAX = 3;
const TEMPORADA_JOIA_CHANCE = 0.03; // por carta virada, até sair uma na partida
const TEMPORADA_PONTINHO_PC = 5; // o "pontinho extra" do Modo C.A.O.S.
function temporadaBonzinha() {
  const t = typeof temporadaAtual === "function" ? temporadaAtual() : null;
  return !!t && TEMPORADA_BONZINHA.includes(t.id);
}
function temporadaFalasDe(chave) {
  const t = typeof temporadaAtual === "function" ? temporadaAtual() : null;
  const b = t && REACTIVE_VOICE.temporada && REACTIVE_VOICE.temporada[t.id];
  return (b && b[chave]) || (REACTIVE_VOICE.temporada && REACTIVE_VOICE.temporada.natal && REACTIVE_VOICE.temporada.natal[chave]) || [];
}
// quem pode ganhar a joia de presente agora (nunca quem já tem 3; nunca quem bateu a trava da rodada)
function temporadaJoiaCandidatos() {
  if (CURRENT_FORMAT === "equipe" || !gemsEnabled() || !gemsCountForWin() || gemWinner) return [];
  const cats = CURRENT_MODE === "express" && expressSelectedCategories && expressSelectedCategories.length ? expressSelectedCategories : currentGemCategories();
  const out = [];
  players.forEach((p) => {
    const g = p.gems || {};
    if (gemTotal(p) >= GEMS_TO_WIN - 1) return; // nunca a 4ª joia
    if (joiasComTrava() && (joiasRodada[String(p.id)] || 0) >= JOIAS_POR_RODADA) return;
    const faltam = cats.filter((c) => (g[c] || 0) < gemCapFor());
    if (faltam.length) out.push({ p, faltam });
  });
  return out;
}
function temporadaJoiaPresenteTalvez(forcar) {
  if (!temporadaBonzinha() || caosSilenced || gameEnded || !currentCard) return null;
  if (!forcar && sorteioRegra() >= TEMPORADA_JOIA_CHANCE) return null;
  const cands = temporadaJoiaCandidatos();
  if (!cands.length || !caosOncePerMatch("temporada_joia")) return null;
  const fav = typeof caosVinc !== "undefined" && caosVinc && caosVinc.fav;
  const escolha = cands.find((c) => c.p.name === fav) || cands[Math.floor(sorteioRegra() * cands.length)];
  const cat = escolha.faltam[Math.floor(sorteioRegra() * escolha.faltam.length)];
  const p = escolha.p;
  p.gems = p.gems || {};
  p.gems[cat] = (p.gems[cat] || 0) + 1;
  if (joiasComTrava()) joiasRodada[String(p.id)] = (joiasRodada[String(p.id)] || 0) + 1;
  caosLog("temporada", `🎁 joia de presente de Natal: ${p.name} ganhou ${cat}`);
  const msg = getRandomReaction(temporadaFalasDe("presenteJoia"), p.name, (CATEGORY_LABELS[cat] || cat).toLowerCase());
  if (msg) showToastMessage(msg);
  try {
    render();
    saveGameState();
  } catch (e) {}
  return { id: p.id, cat };
}

/* Temporadas · item 6: cores e emojis da temporada (TEMPORADA_ESTILOS em 01-configuracao.js). Na época, entram na
   paleta e na lista de emojis. Quem tem cadastro e escolhe um deles recebe a pergunta (pedido do JF): "Você escolheu
   um estilo que não é o do seu cadastro. Quer usar durante a temporada?". Sim: o C.A.O.S. autoriza e o "salvamento da
   temporada" guarda a escolha (não pergunta de novo nesta temporada). Não: volta o estilo de sempre. A ficha nunca
   guarda emoji de temporada, então, quando a época acaba, o jogador volta sozinho ao estilo que tinha. */
function temporadaEstilo() {
  const t = typeof temporadaAtual === "function" ? temporadaAtual() : null;
  return (t && TEMPORADA_ESTILOS[t.id]) || { cores: [], emojis: [], nomesCores: [] };
}
function temporadaEmojiEh(a) {
  return !!a && Object.values(TEMPORADA_ESTILOS).some((e) => e.emojis.includes(a));
}
function temporadaCorEh(c) {
  return !!c && Object.values(TEMPORADA_ESTILOS).some((e) => e.cores.includes(c));
}
function temporadaCorNome(c) {
  for (const e of Object.values(TEMPORADA_ESTILOS)) {
    const i = e.cores.indexOf(c);
    if (i >= 0) return "Cor de temporada: " + (e.nomesCores[i] || "especial");
  }
  return "";
}
function temporadaChave() {
  const t = typeof temporadaAtual === "function" ? temporadaAtual() : null;
  return t ? t.id + ":" + new Date().getFullYear() : null;
}
// salvamento da temporada: { nick: { chave: "natal:2026", cor, avatar } }; o que é de outra temporada some na leitura
function temporadaEstiloLer() {
  let o = {};
  try {
    o = JSON.parse(JFStore.getItem(TEMPORADA_ESTILO_KEY) || "{}") || {};
  } catch (e) {}
  const ch = temporadaChave();
  Object.keys(o).forEach((k) => {
    if (!o[k] || o[k].chave !== ch) delete o[k];
  });
  return o;
}
function temporadaEstiloGravar(o) {
  try {
    JFStore.setItem(TEMPORADA_ESTILO_KEY, JSON.stringify(o));
  } catch (e) {}
}
function temporadaEstiloTemCadastro(p) {
  if (!p) return false;
  if (typeof contaLogin === "function" && contaLogin(p.name)) return true;
  const f = typeof fichaGet === "function" ? fichaGet(p.name) : null;
  return !!(f && f.ultimoAvatar);
}
// volta o estilo de sempre (o emoji da ficha, se estiver livre; a cor, a primeira livre que não é de temporada)
function temporadaEstiloDesfazer(p) {
  const outros = players.filter((q) => q !== p);
  if (temporadaEmojiEh(p.avatar)) {
    const f = typeof fichaGet === "function" ? fichaGet(p.name) : null;
    const usados = new Set(outros.map((q) => q.avatar));
    const antigo = f && f.ultimoAvatar && !usados.has(f.ultimoAvatar) ? f.ultimoAvatar : null;
    p.avatar = antigo || avatarsForMode().find((a) => !usados.has(a) && !temporadaEmojiEh(a)) || p.avatar;
  }
  if (temporadaCorEh(p.color)) {
    const usadas = new Set(outros.map((q) => q.color));
    p.color = coresDaPaleta().find((c) => !usadas.has(c) && !temporadaCorEh(c) && !(typeof corReservada === "function" && corReservada(c))) || PLAYER_COLORS[0];
  }
}
function temporadaEstiloPerguntar(p, depois) {
  const seguir = () => {
    if (typeof depois === "function") depois();
  };
  const ch = temporadaChave();
  if (!p || !ch || !(temporadaCorEh(p.color) || temporadaEmojiEh(p.avatar)) || !temporadaEstiloTemCadastro(p)) return seguir();
  const salvo = temporadaEstiloLer();
  const k = nameKeyPlain(p.name);
  if (salvo[k]) return seguir(); // já autorizado nesta temporada
  const { ov, box } = caosModalBase();
  box.style.borderColor = "#22c55e";
  const t = document.createElement("div");
  t.innerHTML = `<div style="font-size:2rem">🎄</div><h3 style="margin:6px 0">Estilo de temporada</h3><p style="margin:8px 0 16px">${escapeHtml(p.name)}, você escolheu um estilo que não é o do seu cadastro. Quer usar durante a temporada?</p>`;
  box.appendChild(t);
  const atualizar = () => {
    try {
      renderScoreboard();
      renderColorPicker();
      renderAvatarPicker();
      saveGameState();
      if (typeof redeHostCadastroMudou === "function") redeHostCadastroMudou();
    } catch (e) {}
  };
  box.appendChild(
    caosModalBtn("Sim, quero! 🎄", "#16a34a", () => {
      ov.remove();
      salvo[k] = { chave: ch, cor: p.color, avatar: p.avatar };
      temporadaEstiloGravar(salvo);
      const fala = getRandomReaction(temporadaFalasDe("estiloAutorizado"), p.name);
      if (fala) showToastMessage(fala);
      seguir();
    }),
  );
  box.appendChild(
    caosModalBtn("Não, volta o meu de sempre", "#475569", () => {
      ov.remove();
      temporadaEstiloDesfazer(p);
      atualizar();
      seguir();
    }),
  );
  document.body.appendChild(ov);
}

/* Temporadas · item 7: 5 títulos da temporada no resumo do fim da partida (como os Troféus do C.A.O.S.). Pedido do JF:
   no Natal, o "Papai Noel" vai pro Mestre que mais distribuiu presentes. Cada título só aparece com dado de verdade. */
function temporadaTitulosHtml(larga) {
  const t = typeof temporadaAtual === "function" ? temporadaAtual() : null;
  if (!t || t.id !== "natal" || typeof larga !== "function") return "";
  const pj = (nome) => players.find((p) => p.name === nome);
  const nomeH = (p) => (p ? playerNameHtml(p.name, p.color, p.avatar) : "?");
  const por = {};
  (history || [])
    .filter((h) => typeof h.cluesUsed === "number" && h.playerName)
    .forEach((h) => {
      const o = (por[h.playerName] = por[h.playerName] || { n: 0, nt: 0, t: 0, min: 99 });
      o.n++;
      o.min = Math.min(o.min, h.cluesUsed);
      if (typeof h.timeTakenMs === "number" && h.timeTakenMs >= 1500) (o.nt++, (o.t += h.timeTakenMs));
    });
  let h = "";
  // 🎅 Papai Noel: o Mestre que mais entregou cartas acertadas pros outros (os "presentes")
  const dados = {};
  (cartasPartida || []).forEach((c) => {
    if (c.mestre && c.quem) dados[c.mestre] = (dados[c.mestre] || 0) + 1;
  });
  const noel = Object.entries(dados)
    .map(([id, n]) => ({ p: jogadorPorId(id), n }))
    .filter((x) => x.p && x.n >= 2)
    .sort((a, b) => b.n - a.n)[0];
  if (noel) h += larga("🎅", "Papai Noel", nomeH(noel.p), `como Mestre, entregou ${noel.n} cartas acertadas de presente`, "#ef4444", { t: "natalNoel", n: noel.p.name, v: noel.n });
  // 🎁 Duende Ajudante (JF, 03/11): quem mais mexeu nos outros jogadores no tabuleiro, avançando ou recuando
  const duende = players.filter((p) => (p.apoiosPartida || 0) >= 2).sort((a, b) => b.apoiosPartida - a.apoiosPartida)[0];
  if (duende) h += larga("🎁", "Duende Ajudante", nomeH(duende), `mexeu ${duende.apoiosPartida} vezes nos outros jogadores (avançando ou recuando)`, "#22c55e", { t: "natalDuende", n: duende.name, v: duende.apoiosPartida });
  // 🦌 Rena Veloz: quem acertou mais rápido, em média
  const rena = Object.entries(por)
    .filter(([, o]) => o.nt >= 2)
    .map(([nome, o]) => ({ nome, seg: Math.round(o.t / o.nt / 1000) }))
    .sort((a, b) => a.seg - b.seg)[0];
  if (rena) h += larga("🦌", "Rena Veloz", nomeH(pj(rena.nome)), `${rena.seg} s em média pra acertar`, "#f59e0b", { t: "natalRena", n: rena.nome, v: rena.seg });
  // 🌟 Estrela Guia: o acerto com menos dicas
  const estrela = Object.entries(por).sort((a, b) => a[1].min - b[1].min)[0];
  if (estrela && estrela[1].min < 99) h += larga("🌟", "Estrela Guia", nomeH(pj(estrela[0])), `acertou uma carta com só ${estrela[1].min} dica${estrela[1].min === 1 ? "" : "s"}`, "#facc15", { t: "natalEstrela", n: estrela[0], v: estrela[1].min });
  // ⛄ Boneco de Neve: quem mais ficou congelado nos palpites furados (zoeira de leve)
  const boneco = players.filter((p) => (p.errosPartida || 0) >= 2).sort((a, b) => b.errosPartida - a.errosPartida)[0];
  if (boneco) h += larga("⛄", "Boneco de Neve", nomeH(boneco), `congelou em ${boneco.errosPartida} palpites furados`, "#93c5fd", { t: "natalBoneco", n: boneco.name, v: boneco.errosPartida });
  return h;
}

/* Temporadas · item 8: as 10 cartas de Natal (src/dados/02-cartas/98-temporada.js). Ficam fora do baralho o ano todo.
   Durante o Natal, entram na partida (Clássico, Hardcore, Júnior e Corrida; Old School, Express e Modo C.A.O.S. têm
   baralho próprio e ficam como estão), espalhadas entre as primeiras cartas, e valem o dobro de pontos, com o selo
   🎄 na carta. */
const TEMPORADA_CARTAS_MODOS = ["classico", "hardcore", "junior", "corrida"];
const TEMPORADA_CARTAS_JANELA = 40; // as cartas da temporada entram espalhadas entre as primeiras 40 que vão sair
function temporadaCartaAtiva(card) {
  const t = typeof temporadaAtual === "function" ? temporadaAtual() : null;
  return !!(card && card.temporada && t && card.temporada === t.id);
}
function temporadaMultCarta(card) {
  return temporadaCartaAtiva(card) ? 2 : 1;
}
function temporadaCartasDoModo() {
  if (typeof TEMPORADA_CARTAS === "undefined" || !TEMPORADA_CARTAS_MODOS.includes(CURRENT_MODE)) return [];
  return TEMPORADA_CARTAS.filter((c) => {
    if (!temporadaCartaAtiva(c)) return false;
    if (CURRENT_MODE === "junior") return c.category !== "ANO" && (c.classificacao === "junior" || c.classificacao === "livre");
    if (CURRENT_MODE === "corrida") return c.category !== "ANO";
    return true;
  });
}
// recebe o baralho na ordem de compra (o fim sai primeiro) e espalha as cartas da temporada entre as primeiras a sair
function temporadaCartasNoBaralho(deck) {
  const novas = temporadaCartasDoModo().filter((c) => !deck.includes(c));
  if (!novas.length) return deck;
  const d = deck.slice();
  novas.forEach((c) => {
    const janela = Math.min(TEMPORADA_CARTAS_JANELA, d.length);
    d.splice(d.length - Math.floor(sorteioRegra() * (janela + 1)), 0, c);
  });
  // baralho já no limite do modo: as de Natal tomam o lugar das últimas a sair (o contador não passa de "400 de 400")
  if (typeof deckLimiteModo === "function" && deck.length >= deckLimiteModo()) {
    for (let tirar = novas.length, i = 0; tirar > 0 && i < d.length; ) {
      if (temporadaCartaAtiva(d[i])) i++;
      else {
        d.splice(i, 1);
        tirar--;
      }
    }
  }
  novas.forEach((c) => {
    if (!allCards.includes(c)) allCards.push(c);
  });
  rebuildCardsIndex();
  return d;
}
function temporadaSeloCartaHtml(card) {
  return temporadaCartaAtiva(card) ? `<div class="tmp-selo-carta" title="Carta de Natal: vale o dobro de pontos">🎄 Carta de Natal · vale o dobro</div>` : "";
}

/* Espírito natalino do C.A.O.S. (pedido do JF em 04/11/2026, antes de publicar o Natal). No Natal e no Ano Novo:
   - fica feliz por mais tempo e se estressa menos: as emoções ruins entram mais fracas e caem mais rápido de uma carta
     pra outra; alegria e carinho entram um pouco mais fortes e duram mais;
   - mais paciência: perde menos paciência a cada erro, recupera mais rápido e demora mais pra achar a mesa lenta;
   - fala disso: "vocês têm sorte que é Natal" quando começa a se irritar; com quem errou demais, "liga pro Papai Noel"
     e promete carvão; quando esfria, perdoa ("é Natal, não abusem da sorte").
   Fora do Natal: quando ele dá um presente, às vezes brinca com a data ("não sei se é seu aniversário, mas...").
   Só fala e emoção: nada aqui mexe em ponto, casa ou sorteio do jogo (as chances usam o Math.random das falas). */
const TEMPORADA_ESPIRITO = {
  ruimEntra: 0.75, // raiva, tristeza, ansiedade, medo, nojo e tédio entram com 75% da força
  bomEntra: 1.15, // alegria e carinho, com 115%
  ruimCai: 1.6, // por carta, a emoção ruim cai como se fossem 1,6 cartas
  bomSegura: 0.7, // alegria e carinho caem 30% mais devagar
  paciencia: 0.6, // perde 60% da paciência que perderia
  recupera: 0.22, // volta pro normal mais rápido (fora do Natal, 0,12)
  demora: 1.35, // espera 35% a mais antes de achar a mesa lenta
  raivaAviso: 3, // a partir daqui ele avisa que é Natal
  raivaCarvao: 5.5, // daqui pra cima, quem errou 3 vezes ou mais pode ganhar carvão
  raivaPerdao: 2, // abaixo disso, perdoa
};
const TEMPORADA_EMO_RUINS = ["raiva", "tristeza", "ansiedade", "medo", "nojo", "tedio"];
let temporadaEspiritoMesa = { serial: -1 };
function temporadaEspirito() {
  return typeof temporadaBonzinha === "function" && temporadaBonzinha();
}
function temporadaSentirFator(emo) {
  if (!temporadaEspirito()) return 1;
  if (TEMPORADA_EMO_RUINS.includes(emo)) return TEMPORADA_ESPIRITO.ruimEntra;
  if (emo === "alegria" || emo === "carinho") return TEMPORADA_ESPIRITO.bomEntra;
  return 1;
}
function temporadaDecaimento(emo, dec) {
  if (!temporadaEspirito()) return dec;
  if (TEMPORADA_EMO_RUINS.includes(emo)) return Math.pow(dec, TEMPORADA_ESPIRITO.ruimCai);
  if (emo === "alegria" || emo === "carinho") return 1 - (1 - dec) * TEMPORADA_ESPIRITO.bomSegura;
  return dec;
}
function temporadaPacienciaFator() {
  return temporadaEspirito() ? TEMPORADA_ESPIRITO.paciencia : 1;
}
function temporadaPacienciaRecupera() {
  return temporadaEspirito() ? TEMPORADA_ESPIRITO.recupera : 0.12;
}
function temporadaDemoraFator() {
  return temporadaEspirito() ? TEMPORADA_ESPIRITO.demora : 1;
}
function temporadaEspiritoEstado() {
  const ser = typeof caosPartidaSerial !== "undefined" ? caosPartidaSerial : 0;
  if (temporadaEspiritoMesa.serial !== ser)
    temporadaEspiritoMesa = { serial: ser, avisos: 0, ultAviso: -99, carvao: {}, nCarvao: 0, perdoes: 0, bravo: false };
  return temporadaEspiritoMesa;
}
function temporadaEspiritoFalar(msg) {
  if (!msg) return;
  if (typeof caosFalarDepois === "function") caosFalarDepois(msg);
  else showToastMessage(msg);
}
// chamado a cada acerto, erro ou pulo (caosConsoleEvento), depois que a emoção já mudou
function temporadaEspiritoFalasAqui() {
  const t = typeof temporadaAtual === "function" ? temporadaAtual() : null;
  return !!t && t.id === "natal"; // no Ano Novo ele segue calmo, mas sem Papai Noel e carvão na fala
}
function temporadaEspiritoEvento(idx, ev) {
  if (!temporadaEspirito() || !temporadaEspiritoFalasAqui() || caosSilenced || gameEnded || !caosConsole) return;
  const st = temporadaEspiritoEstado(),
    E = TEMPORADA_ESPIRITO,
    raiva = caosConsole.g.raiva || 0,
    carta = (stats && stats.totalDrawn) || 0;
  if (ev === "E" || ev === "X") {
    const p = players[idx],
      k = p && (p.id || p.name);
    if (p && !p.iniciante && raiva >= E.raivaCarvao && (p.errosPartida || 0) >= 3 && !st.carvao[k] && st.nCarvao < 2 && Math.random() < 0.6) {
      st.carvao[k] = true;
      st.nCarvao++;
      st.bravo = true;
      caosLog("temporada", `🎄 carvão pra ${p.name} (raiva ${raiva.toFixed(1)})`);
      return temporadaEspiritoFalar(getRandomReaction(temporadaFalasDe("carvao"), p.name));
    }
    if (raiva >= E.raivaAviso && st.avisos < 3 && carta - st.ultAviso >= 4 && Math.random() < 0.5) {
      st.avisos++;
      st.ultAviso = carta;
      st.bravo = true;
      return temporadaEspiritoFalar(getRandomReaction(temporadaFalasDe("espirito")));
    }
    if (raiva >= E.raivaAviso) st.bravo = true;
    return;
  }
  temporadaEspiritoPerdoar();
}
// esfriou (num acerto ou na virada de carta): perdoa a mesa, no máximo 2 vezes por partida
function temporadaEspiritoPerdoar() {
  if (!temporadaEspirito() || !temporadaEspiritoFalasAqui() || caosSilenced || gameEnded || !caosConsole) return;
  const st = temporadaEspiritoEstado();
  if (!st.bravo || st.perdoes >= 2 || (caosConsole.g.raiva || 0) >= TEMPORADA_ESPIRITO.raivaPerdao) return;
  st.bravo = false;
  st.perdoes++;
  temporadaEspiritoFalar(getRandomReaction(temporadaFalasDe("perdao")));
}
// Fora do Natal: o presente do C.A.O.S. às vezes vem com piada de data. Em outubro e novembro, "Feliz Natal adiantado".
function temporadaPresenteForaDeEpoca(nome) {
  if (temporadaEspirito() || caosSilenced || !nome || Math.random() >= 0.5) return;
  const B = REACTIVE_VOICE.temporada && REACTIVE_VOICE.temporada.presenteForaDeEpoca;
  if (!B) return;
  const mes = new Date().getMonth() + 1;
  const banco = (mes === 10 || mes === 11) && Math.random() < 0.5 ? B.natalAdiantado : B.aniversario;
  temporadaEspiritoFalar(getRandomReaction(banco, nome));
}
