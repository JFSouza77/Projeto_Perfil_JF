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
function telaoDesenhar(r) {
  const box = document.getElementById("telao");
  if (!box) return;
  const nome = (id) => {
    const j = r.jogadores.find((p) => p.id === id);
    return j ? escapeHtml((j.avatar ? j.avatar + " " : "") + j.nome) : "—";
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
  const dicas = c
    ? c.abertas
        .map((d) => `<li${d.pos === c.pendente ? ' class="telao-agora"' : ""}>${d.tipo === "special" ? "⭐ " : ""}${escapeHtml(d.texto)}</li>`)
        .join("")
    : "";
  box.innerHTML = `
    <header class="telao-topo"><b>📺 Perfil JF</b><span>rodada ${r.rodada}${r.ultimaRodada ? " · última" : ""} · revisão ${r.revisao}</span></header>
    ${r.fim ? '<div class="telao-espera">🏁 Fim de partida</div>' : ""}
    <section class="telao-vez">
      <div>🎙️ Mestre<br><b>${nome(r.mestreId)}</b></div>
      <div>👉 Vez de<br><b>${nome(r.vezId)}</b></div>
      <div>⏱️ <b id="telaoRelogio">—</b></div>
    </section>
    ${c ? `<section class="telao-carta"><div class="telao-cat">${escapeHtml(TELAO_CAT[c.categoria] || c.categoria)} · ${c.abertas.length} de ${c.totalDicas} dicas</div><ol class="telao-dicas">${dicas || "<li>Nenhuma dica aberta ainda</li>"}</ol></section>` : ""}
    <section class="telao-placar"><ol>${placar}</ol></section>
    ${TELAO_SAIR}`;
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
