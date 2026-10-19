/* ----------------------------------------------------------------------
 * 5h. TELÃO · ENSAIO EM DUAS ABAS (1.7.8.3 · Actions and Events Update, Parte 4)
 * Ensaio do online dentro de um aparelho só: a aba do jogo manda o RETRATO PÚBLICO da partida
 * (sem resposta, sem dica fechada) por BroadcastChannel a cada ação; uma segunda aba, aberta com
 * "#telao" no endereço, só olha: mostra placar, Mestre, vez, categoria, dicas abertas e relógio.
 *  · O telão não carrega a partida, não roda o motor e não grava nada (saveBloqueado).
 *  · Ele ignora retrato velho (revisão menor da mesma partida) e de protocolo desconhecido.
 *  · Isto NÃO prova rede, segurança, latência nem reconexão: as duas abas estão no mesmo navegador.
 *    É o ensaio do fluxo "ação → retrato → outra tela", que a 1.7.9 leva pra rede.
 * Abre pelo painel ADM ("📺 Abrir telão"). Útil também com um segundo monitor no computador.
 * ---------------------------------------------------------------------- */
const TELAO_CANAL = "perfiljf-telao";
let telaoCanal = null;
let telaoUltimo = null; // último retrato mostrado no telão
let telaoRelogioTimer = null;
function telaoModo() {
  try {
    return /(^|[#&])telao($|&)/.test(String(location.hash || "").replace(/^#/, ""));
  } catch (e) {
    return false;
  }
}
function telaoAbrirCanal() {
  if (telaoCanal || typeof BroadcastChannel !== "function") return telaoCanal;
  try {
    telaoCanal = new BroadcastChannel(TELAO_CANAL);
  } catch (e) {
    telaoCanal = null;
  }
  return telaoCanal;
}

/* --- Lado do jogo: publica o retrato público --- */
function telaoPublicar() {
  const c = telaoCanal;
  if (!c || !starterChosen) return;
  try {
    c.postMessage({ tipo: "retrato", retrato: retratoPartida("mesa") });
  } catch (e) {}
}
function telaoLigarJogo() {
  if (telaoModo() || !telaoAbrirCanal()) return;
  telaoCanal.onmessage = (ev) => {
    const m = ev && ev.data;
    if (m && m.tipo === "pedir") telaoPublicar();
  };
  acoesAoMudar(() => telaoPublicar());
}
function telaoAbrirAba() {
  try {
    const url = String(location.href).split("#")[0] + "#telao";
    window.open(url, "_blank");
    setTimeout(telaoPublicar, 800);
  } catch (e) {}
}

/* --- Lado do telão: só mostra --- */
// 1.7.8.6 (feedback): no celular não tinha como sair do telão sem fechar o jogo
const TELAO_SAIR = '<button type="button" class="telao-sair" onclick="telaoSair()">✕ Sair do telão</button>';
function telaoSair() {
  try {
    if (telaoRelogioTimer) clearInterval(telaoRelogioTimer);
    if (telaoCanal) telaoCanal.close();
  } catch (e) {}
  try {
    window.history.replaceState(null, "", String(location.href).split("#")[0]);
  } catch (e) {}
  location.reload();
}
function telaoIniciar() {
  try {
    saveBloqueado = true; // o telão nunca grava a partida
  } catch (e) {}
  document.title = "📺 Telão · Perfil JF";
  ["splashScreen", "welcomeScreen", "gameScreen"].forEach((id) => {
    const e = document.getElementById(id);
    if (e) e.style.display = "none";
  });
  let box = document.getElementById("telao");
  if (!box) {
    box = document.createElement("main");
    box.id = "telao";
    box.className = "telao";
    box.setAttribute("aria-live", "polite");
    document.body.appendChild(box);
  }
  box.innerHTML = '<div class="telao-espera">📺 Telão do Perfil JF<br><small>Esperando a partida na outra aba…</small></div>' + TELAO_SAIR;
  if (!telaoAbrirCanal()) {
    box.innerHTML = '<div class="telao-espera">Este navegador não tem como receber a partida da outra aba.</div>' + TELAO_SAIR;
    return;
  }
  telaoCanal.onmessage = (ev) => {
    const m = ev && ev.data;
    if (!m || m.tipo !== "retrato") return;
    const r = m.retrato;
    if (!r || r.protocolo !== RETRATO_PROTOCOLO || r.papel !== "mesa") return;
    if (telaoUltimo && telaoUltimo.matchId === r.matchId && r.revisao < telaoUltimo.revisao) return;
    telaoUltimo = r;
    telaoDesenhar(r);
  };
  try {
    telaoCanal.postMessage({ tipo: "pedir" });
  } catch (e) {}
  telaoRelogioTimer = setInterval(telaoRelogio, 500);
}
const TELAO_CAT = { ANO: "📅 Ano", PESSOA: "🧑 Pessoa", LUGAR: "📍 Lugar", COISA: "📦 Coisa", ANIMAL: "🐾 Animal" };
/* 1.7.10.1 (relato do JF) · A roleta da categoria também nos celulares: enquanto o host não manda a categoria,
   o rolo gira entre as categorias da partida; quando ela chega, para nela ("Eu sou UMA COISA"). */
let telaoRoletaTimer = null;
function telaoRoletaHtml(c) {
  const label = (k) => escapeHtml((CATEGORY_LABELS[k] || k || "?").toUpperCase());
  const cats = (c.roleta && Array.isArray(c.roleta.cats) && c.roleta.cats.length ? c.roleta.cats : Object.keys(CATEGORY_LABELS)).filter((k) => typeof k === "string").slice(0, 8);
  const pousou = !!c.categoria;
  const cor = pousou ? (GEM_INFO[c.categoria] || {}).color || "#e94560" : "#a78bfa";
  const dica = pousou ? "🗣️ A categoria da carta" : c.roleta && c.roleta.girando ? "🎰 Sorteando a categoria..." : "🃏 O Mestre vai virar a carta";
  return `<div class="roulette telao-roleta" style="--cat:${cor};" data-cats="${escapeHtml(cats.join(","))}" data-pousou="${pousou ? 1 : 0}" data-girando="${c.roleta && c.roleta.girando ? 1 : 0}"><div class="roulette-phrase">"Eu sou <span class="roulette-reel${pousou ? " landed" : ""}" id="telaoReel">${pousou ? label(c.categoria) : c.roleta && c.roleta.girando ? label(cats[0]) : "???"}</span>"</div><div class="roulette-hint">${dica}</div></div>`;
}
function telaoRoletaAnimar(raiz) {
  clearInterval(telaoRoletaTimer);
  telaoRoletaTimer = null;
  const box = raiz && raiz.querySelector(".telao-roleta");
  // 1.7.10.5.6 (relato do JF): antes de o Mestre tocar em Virar carta o rolo fica parado; só gira junto com a roleta dele
  if (!box || box.dataset.pousou === "1" || box.dataset.girando !== "1") return;
  const reel = box.querySelector(".roulette-reel"), cats = box.dataset.cats.split(",").filter(Boolean);
  if (!reel || cats.length < 2 || (typeof visualFxAllowed === "function" && !visualFxAllowed())) return;
  let i = 0;
  telaoRoletaTimer = setInterval(() => {
    if (!reel.isConnected) return clearInterval(telaoRoletaTimer);
    i = (i + 1) % cats.length;
    reel.textContent = (CATEGORY_LABELS[cats[i]] || cats[i]).toUpperCase();
  }, 140);
}
const TELAO_VITORIA_IC = { casa: "🏠", tabuleiro: "🏁", pontos: "🔢", joias: "💎", express: "⚡" };
function telaoObjetivoHtml(r) {
  const w = (typeof WIN_CONDITIONS !== "undefined" && WIN_CONDITIONS[r.vitoria]) || null;
  const nome = w ? w.label : r.vitoria === "corrida" ? "Corrida contra o Tempo" : r.vitoria;
  if (!nome) return "";
  return `<details class="telao-objetivo" data-k="obj"><summary>${TELAO_VITORIA_IC[r.vitoria] || (w && w.icon) || (r.vitoria === "corrida" ? "⏱️" : "🏆")} Como se vence: <b>${escapeHtml(nome)}</b></summary>${r.objetivo ? `<p>${escapeHtml(r.objetivo)}</p>` : ""}</details>`;
}
// 1.7.10.1 (pedido do JF): o tabuleiro inteiro só no intervalo (lobby antes da próxima carta), no fim e antes
// da primeira carta; com carta na mesa, ele sai da frente (o placar logo abaixo mostra a casa de cada um)
function telaoMostraTabuleiro(r) {
  return !!(r.intervalo || r.fim || !r.carta || r.estadoCarta === "none");
}
/* 1.7.10.5.6 (pedido do JF: "muito cru... tudo cinza") · T2 com hierarquia: primeiro de quem é a vez e o relógio,
   depois a carta (estado, categoria, números e dicas), o placar e, por último, o que é de consulta (como se vence
   e as cartas da partida, clicáveis). Os <details> abertos continuam abertos quando chega retrato novo. */
function telaoEstadoHtml(r, nomeTxt) {
  const c = r.carta;
  if (r.fim || !c) return "";
  if (r.intervalo) return `<div class="tc-estado">⏸️ Intervalo: a próxima carta já vem</div>`;
  if (r.palpiteVez) return `<div class="tc-estado tc-palpite">🃏 <b>${escapeHtml(nomeTxt(r.palpiteVez))}</b> vai palpitar! O Mestre julga.</div>`;
  if (r.estadoCarta === "hidden") return "";
  if (c.pendente !== null && c.pendente !== undefined) return `<div class="tc-estado tc-lendo">🎙️ O Mestre está lendo a dica <b>${c.pendente + 1}</b></div>`;
  if (r.pedidoDica) return `<div class="tc-estado tc-pedido">👉 ${escapeHtml(nomeTxt(r.pedidoDica.por))} pediu a dica <b>${r.pedidoDica.pos + 1}</b></div>`;
  if (r.estadoCarta === "revealed") return `<div class="tc-estado">👉 <b>${escapeHtml(nomeTxt(r.vezId))}</b> escolhe a próxima dica</div>`;
  return "";
}
// 1.7.10.5.7 (pedido do JF): seletor de alvo da especial "escolha um jogador" (só quem abriu a dica toca; o
// convidado liga os botões em redeConvidadoDesenhar)
function telaoAlvoHtml(r, nomeTxt) {
  const ae = r.alvoEspecial;
  if (!ae || !Array.isArray(ae.alvos)) return "";
  const verbo = `${ae.n > 0 ? "avançar" : "voltar"} ${Math.abs(ae.n)} casas`;
  const cards = ae.alvos
    .map((a) => `<button type="button" class="ta-alvo${ae.n > 0 ? " ta-bom" : ""}" data-alvo="${escapeHtml(String(a.k))}" style="--pc:${isSafeColor(a.cor) ? corDoJogador(a.cor) : "#a78bfa"}" disabled><span class="ta-av" aria-hidden="true">${escapeHtml(a.avatar || "●")}</span><b>${escapeHtml(a.nome)}</b><small>casa ${a.casa | 0}</small></button>`)
    .join("");
  return `<div class="ta-escolha"><div class="tc-estado tc-pedido ta-tit">🎯 <b>${escapeHtml(nomeTxt(ae.quem))}</b> escolhe quem vai ${verbo}</div><div class="ta-alvos">${cards}</div><small class="ta-pe">${ae.n > 0 ? "⬆️" : "⬇️"} ${verbo} · se o tempo acabar, o jogo sorteia</small></div>`;
}
// 1.7.10.6 (pedido do JF): faixa do duelo de bônus em todo dispositivo (antes só quem caiu na casa sabia)
function telaoDueloHtml(d) {
  const e = (x) => escapeHtml(String(x || "?"));
  let txt;
  if (d.fase === "adversario") txt = `<b>${e(d.quem)}</b> caiu na casa de bônus e está escolhendo quem desafia${d.equipe ? "" : " (e depois quem vai ser o Mestre)"}.`;
  else if (d.fase === "mestre") txt = `<b>${e(d.quem)}</b> desafiou <b>${e(d.contra)}</b>! Agora escolhe quem vai ser o Mestre do duelo.`;
  else txt = `<b>${e(d.quem)}</b> × <b>${e(d.contra)}</b>${d.mestre ? ` · 🎙️ Mestre: <b>${e(d.mestre)}</b>` : ""}. Só os dois respondem, a vez alterna e a carta vale em dobro.`;
  // 1.7.10.7 (pedido do JF): quem está fora do duelo pode espectar e ver a resposta no próprio dispositivo
  let espia = "";
  if (typeof redeEspiarPode === "function" && redeEspiarPode(d)) {
    const resp = redeEspiaResposta();
    espia = resp
      ? `<span class="td-espia">👀 Resposta: <b>${e(resp)}</b> <small>(só você vê, não sopra!)</small></span>`
      : `<button type="button" class="td-espiar">👀 Espectar duelo (ver a resposta)</button>`;
  }
  return `<section class="telao-duelo" role="status"><span class="td-tit">🏟️ Duelo de bônus</span><span class="td-txt">${txt}</span>${espia}</section>`;
}
function telaoDesenhar(r, alvo) {
  const box = alvo || document.getElementById("telao"); // 1.7.9.4: o host desenha na própria tela de jogador
  if (!box) return;
  if (!r._em) r._em = Date.now(); // pro tempo de jogo andar entre um retrato e outro
  // o que estava aberto (como se vence, cartas da partida e cada carta) continua aberto
  const abertos = new Set([...box.querySelectorAll("details[data-k][open]")].map((d) => d.dataset.k));
  const jog = (id) => r.jogadores.find((p) => p.id === id);
  const nomeTxt = (id) => {
    const j = jog(id);
    if (j) return j.nome;
    const eq = r.equipes && r.equipes.find((e) => e.id === id);
    return eq ? "Equipe " + ((TEAM_INFO[eq.id] || {}).label || eq.id) : "Alguém";
  };
  const nome = (id) => {
    const j = jog(id);
    // C.A.O.S. 4.2 (relato da partida online: ninguém sabia quem era o host): selo HOST (quem cuida da sala; não
    // é o Mestre, que é o dono da carta da vez)
    // 1.7.10.5 (pedido do JF): selo amarelo em quem tem a ficha de palpite a qualquer hora
    const ficha = r.palpites && (r.palpites[id] > 0 || (j && j.equipe && r.palpites[j.equipe] > 0));
    return j
      ? escapeHtml((j.avatar ? j.avatar + " " : "") + j.nome) +
          (r.hostId && id === r.hostId ? ' <span class="selo-host" title="Host: quem abriu e cuida da sala">HOST</span>' : "") +
          (ficha ? ' <span class="selo-palpite" title="Tem ficha de palpite a qualquer hora">🃏</span>' : "")
      : "—";
  };
  const cor = (id) => {
    const j = jog(id);
    return j && isSafeColor(j.cor) ? corDoJogador(j.cor) : "#a78bfa";
  };
  const porPontos = r.vitoria === "pontos" || r.vitoria === "corrida";
  const cartasJ = (j) => (r.corrida && r.corrida.cartas && r.corrida.cartas[j.id]) || 0;
  const ordem = [...r.jogadores].sort((a, b) => (porPontos ? b.pontos - a.pontos || cartasJ(b) - cartasJ(a) : b.casa - a.casa));
  const placar = ordem
    .map((j, i) => {
      const joias = Object.keys(j.joias || {}).length;
      const val = r.vitoria === "corrida" ? corridaValorRetrato(r, j) : r.vitoria === "pontos" ? j.pontos + " pts" : r.vitoria === "joias" ? joias + "/4 joias" : "casa " + j.casa;
      const tags = (j.id === r.mestreId ? '<span class="tp-tag">🎙️ Mestre</span>' : "") + (j.id === r.vezId ? '<span class="tp-tag tp-vez">👉 Vez</span>' : "");
      return `<li style="--pc:${cor(j.id)}"${i === 0 ? ' class="tp-lider"' : ""}><span class="tp-nome"><i class="tp-cor" aria-hidden="true"></i>${nome(j.id)}${tags}</span><b>${escapeHtml(val)}</b></li>`;
    })
    .join("");
  const c = r.carta;
  // C.A.O.S. 4.2 (relato da partida online): cada dica com o número que foi pedido (a dica 13 aparece como 13,
  // não como 1), e a que o Mestre está lendo só mostra o texto depois do veredito
  const dicas = c
    ? c.abertas
        .slice()
        .reverse() // a mais nova em cima: é a que a mesa está discutindo
        .map((d) => `<li value="${d.pos + 1}"${d.pos === c.pendente ? ' class="telao-agora"' : ""}><span class="td-n">${d.pos + 1}</span><span class="td-txt">${d.texto == null ? "🔒 <i>O texto aparece depois do veredito</i>" : (d.tipo === "special" ? "⭐ " : "") + escapeHtml(d.texto)}${d.pedidaPor ? ` <small class="telao-quem">· pedida por ${nome(d.pedidaPor)}</small>` : ""}</span></li>`) // 1.7.9.6: quem pediu
        .join("")
    : "";
  // os números de dica pra todo mundo: livre, a que está sendo lida (em destaque) e as já usadas
  const usadas = c ? new Set(c.abertas.map((d) => d.pos)) : new Set();
  const numeros = c && c.totalDicas && r.estadoCarta !== "hidden"
    ? `<div class="telao-numeros" aria-label="Números de dica">${Array.from({ length: c.totalDicas }, (_, i) => `<span class="${i === c.pendente ? "agora" : usadas.has(i) ? "usada" : r.pedidoDica && r.pedidoDica.pos === i ? "pedida" : "livre"}">${usadas.has(i) && i !== c.pendente ? '<i class="ficha" aria-hidden="true"></i>' : ""}${i + 1}</span>`).join("")}</div>`
    : "";
  const catCor = c && c.categoria ? (GEM_INFO[c.categoria] || {}).color || "#a78bfa" : "#a78bfa";
  const p = r.partida || {};
  const carta =
    c && r.estadoCarta === "hidden"
      ? `<section class="telao-carta" style="--cat:${catCor}">${telaoEstadoHtml(r, nomeTxt)}${telaoRoletaHtml(c)}</section>`
      : c && c.categoria
        ? `<section class="telao-carta" style="--cat:${catCor}">${r.alvoEspecial ? telaoAlvoHtml(r, nomeTxt) : telaoEstadoHtml(r, nomeTxt)}<div class="telao-cat"><span class="tc-selo">${escapeHtml(TELAO_CAT[c.categoria] || c.categoria)}</span><span class="tc-conta"><b>${c.abertas.length}</b> de ${c.totalDicas} dicas</span></div>${numeros}${dicas ? `<ol class="telao-dicas">${dicas}</ol>` : `<p class="telao-sem-dica">Nenhuma dica aberta ainda</p>`}</section>`
        : "";
  const hist = Array.isArray(p.historico) ? p.historico : [];
  box.dataset.rev = String(r.revisao);
  box.innerHTML = `
    <header class="telao-topo"><b>📺 Perfil JF</b><span class="tt-info"><span>Rodada ${r.rodada}${r.ultimaRodada ? " · <b>última</b>" : ""}</span><span>⏱️ <span id="telaoTempo">${partidaTempoTxt(p.tempoMs || 0)}</span></span><span>🃏 ${p.cartas || 0}</span></span></header>
    ${r.fim ? '<div class="telao-espera">🏁 Fim de partida</div>' : ""}
    ${r.duelo && !r.fim ? telaoDueloHtml(r.duelo) : ""}
    <section class="telao-vez">
      <div class="tv-mestre" style="--pc:${cor(r.mestreId)}"><small>🎙️ Mestre (lê as dicas)</small><b>${nome(r.mestreId)}</b></div>
      <div class="tv-vez" style="--pc:${cor(r.vezId)}"><small>👉 Vez de (escolhe a dica e responde)</small><b>${nome(r.vezId)}</b></div>
      <div class="tv-cat" style="--cat:${catCor}"><small>🃏 Categoria</small><b>${c && c.categoria && r.estadoCarta !== "hidden" ? escapeHtml(TELAO_CAT[c.categoria] || c.categoria) : c ? "sorteando…" : "—"}</b></div>
      <div class="tv-relogio"><small>⏱️ Tempo da vez</small><b id="telaoRelogio">—</b></div>
    </section>
    ${r.corrida ? `<div class="corrida-relogios" id="telaoCorrida">${corridaBarraHtml(corridaDoRetrato(r.corrida))}</div>` : ""}
    ${carta}
    ${telaoMostraTabuleiro(r) ? tabHtmlTelao(r) : ""}
    <section class="telao-placar"><h2 class="tp-tit">Placar</h2><ol>${placar}</ol></section>
    ${r.intervalo && r.corrida && r.corrida.estoque ? corridaLojaVitrineHtml(r.corrida.estoque, [], r.corrida.precos) : ""}
    ${telaoObjetivoHtml(r)}
    <details class="telao-hist" data-k="hist"><summary>🗂️ Cartas da partida <span class="th-n">${hist.length}</span></summary>${cartasPartidaHtml(hist, nomeTxt, (id) => (jog(id) ? escapeHtml((jog(id).avatar ? jog(id).avatar + " " : "") + jog(id).nome) : "Alguém"))}</details>
    ${TELAO_SAIR}`;
  box.querySelectorAll("details[data-k]").forEach((d) => abertos.has(d.dataset.k) && (d.open = true));
  tabPecasTelao(r); // 1.7.9.2: o mesmo tabuleiro do jogo
  telaoRoletaAnimar(box);
  telaoRelogio();
}
function telaoRelogio() {
  const el = document.getElementById("telaoRelogio");
  if (!el || !telaoUltimo) return;
  const r = telaoUltimo, rel = r.relogio || {};
  // tempo de jogo andando entre um retrato e outro (parado na pausa, no intervalo e no fim)
  const tj = document.getElementById("telaoTempo");
  if (tj && r.partida && r.iniciada && !r.fim && !rel.pausado && !r.intervalo) tj.textContent = partidaTempoTxt((r.partida.tempoMs || 0) + (Date.now() - (r._em || Date.now())));
  const tc = document.getElementById("telaoCorrida");
  if (tc && r.corrida) {
    const html = corridaBarraHtml(corridaDoRetrato(r.corrida));
    if (tc.innerHTML !== html) tc.innerHTML = html;
  }
  if (rel.pausado) {
    el.textContent = "pausado";
    el.classList.remove("tv-pouco");
    return;
  }
  const fim = rel.fimEm || rel.cartaFimEm;
  const seg = fim ? Math.max(0, Math.ceil((fim - Date.now()) / 1000)) : null;
  el.textContent = seg === null ? "—" : seg + " s";
  el.classList.toggle("tv-pouco", seg !== null && seg <= 10);
}
