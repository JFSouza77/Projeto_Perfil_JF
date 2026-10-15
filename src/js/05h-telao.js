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
  const dica = pousou ? "🗣️ A categoria da carta" : c.roleta && c.roleta.girando ? "🎰 sorteando a categoria..." : "🃏 O Mestre vai virar a carta";
  return `<div class="roulette telao-roleta" style="--cat:${cor};" data-cats="${escapeHtml(cats.join(","))}" data-pousou="${pousou ? 1 : 0}"><div class="roulette-phrase">"Eu sou <span class="roulette-reel${pousou ? " landed" : ""}" id="telaoReel">${pousou ? label(c.categoria) : label(cats[0])}</span>"</div><div class="roulette-hint">${dica}</div></div>`;
}
function telaoRoletaAnimar(raiz) {
  clearInterval(telaoRoletaTimer);
  telaoRoletaTimer = null;
  const box = raiz && raiz.querySelector(".telao-roleta");
  if (!box || box.dataset.pousou === "1") return;
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
  const nome = w ? w.label : r.vitoria;
  if (!nome) return "";
  return `<details class="telao-objetivo"><summary>${TELAO_VITORIA_IC[r.vitoria] || (w && w.icon) || "🏆"} Como se vence: <b>${escapeHtml(nome)}</b></summary>${r.objetivo ? `<p>${escapeHtml(r.objetivo)}</p>` : ""}</details>`;
}
// 1.7.10.1 (pedido do JF): o tabuleiro inteiro só no intervalo (lobby antes da próxima carta), no fim e antes
// da primeira carta; com carta na mesa, ele sai da frente (o placar logo abaixo mostra a casa de cada um)
function telaoMostraTabuleiro(r) {
  return !!(r.intervalo || r.fim || !r.carta || r.estadoCarta === "none");
}
function telaoDesenhar(r, alvo) {
  const box = alvo || document.getElementById("telao"); // 1.7.9.4: o host desenha na própria tela de jogador
  if (!box) return;
  const nome = (id) => {
    const j = r.jogadores.find((p) => p.id === id);
    // C.A.O.S. 4.2 (relato da partida online: ninguém sabia quem era o host): selo HOST (quem cuida da sala; não
    // é o Mestre, que é o dono da carta da vez)
    return j ? escapeHtml((j.avatar ? j.avatar + " " : "") + j.nome) + (r.hostId && id === r.hostId ? ' <span class="selo-host" title="Host: quem abriu e cuida da sala">HOST</span>' : "") : "—";
  };
  const placar = [...r.jogadores]
    .sort((a, b) => (r.vitoria === "pontos" ? b.pontos - a.pontos : b.casa - a.casa))
    .map((j) => {
      const joias = Object.keys(j.joias || {}).length;
      const val = r.vitoria === "pontos" ? j.pontos + " pts" : r.vitoria === "joias" ? joias + "/4 joias" : "casa " + j.casa;
      return `<li><span>${nome(j.id)}</span><b>${escapeHtml(val)}</b></li>`;
    })
    .join("");
  const c = r.carta;
  // C.A.O.S. 4.2 (relato da partida online): cada dica com o número que foi pedido (a dica 13 aparece como 13,
  // não como 1), e a que o Mestre está lendo só mostra o texto depois do veredito
  const dicas = c
    ? c.abertas
        .map((d) => `<li value="${d.pos + 1}"${d.pos === c.pendente ? ' class="telao-agora"' : ""}>${d.texto == null ? "🔒 <i>O Mestre está lendo esta dica…</i>" : (d.tipo === "special" ? "⭐ " : "") + escapeHtml(d.texto)}${d.pedidaPor ? ` <small class="telao-quem">· pedida por ${nome(d.pedidaPor)}</small>` : ""}</li>`) // 1.7.9.6: quem pediu
        .join("")
    : "";
  // os números de dica pra todo mundo: livre, a que está sendo lida (em destaque) e as já usadas
  const usadas = c ? new Set(c.abertas.map((d) => d.pos)) : new Set();
  const numeros = c && c.totalDicas && r.estadoCarta !== "hidden"
    ? `<div class="telao-numeros" aria-label="Números de dica">${Array.from({ length: c.totalDicas }, (_, i) => `<span class="${i === c.pendente ? "agora" : usadas.has(i) ? "usada" : "livre"}">${i + 1}</span>`).join("")}</div>`
    : "";
  box.innerHTML = `
    <header class="telao-topo"><b>📺 Perfil JF</b><span>rodada ${r.rodada}${r.ultimaRodada ? " · última" : ""} · revisão ${r.revisao}</span></header>
    ${r.fim ? '<div class="telao-espera">🏁 Fim de partida</div>' : ""}
    <section class="telao-vez">
      <div>🎙️ Mestre<br><b>${nome(r.mestreId)}</b></div>
      <div>👉 Vez de<br><b>${nome(r.vezId)}</b></div>
      <div>⏱️ <b id="telaoRelogio">—</b></div>
    </section>
    ${telaoObjetivoHtml(r)}
    ${c && r.estadoCarta === "hidden" ? `<section class="telao-carta">${telaoRoletaHtml(c)}</section>` : c && c.categoria ? `<section class="telao-carta"><div class="telao-cat">${escapeHtml(TELAO_CAT[c.categoria] || c.categoria)} · ${c.abertas.length} de ${c.totalDicas} dicas</div>${numeros}${dicas ? `<ol class="telao-dicas">${dicas}</ol>` : `<p class="telao-sem-dica">Nenhuma dica aberta ainda</p>`}</section>` : ""}
    ${telaoMostraTabuleiro(r) ? tabHtmlTelao(r) : ""}
    <section class="telao-placar"><ol>${placar}</ol></section>
    ${TELAO_SAIR}`;
  tabPecasTelao(r); // 1.7.9.2: o mesmo tabuleiro do jogo
  telaoRoletaAnimar(box);
  telaoRelogio();
}
function telaoRelogio() {
  const el = document.getElementById("telaoRelogio");
  if (!el || !telaoUltimo) return;
  const rel = telaoUltimo.relogio || {};
  if (rel.pausado) {
    el.textContent = "pausado";
    return;
  }
  const fim = rel.fimEm || rel.cartaFimEm;
  el.textContent = fim ? Math.max(0, Math.ceil((fim - Date.now()) / 1000)) + " s" : "—";
}
