/* ----------------------------------------------------------------------
 * 5y2. MEDALHAS DA TEMPORADA (05/11/2026, ideia do JF em 04/11; plano em docs/Temporadas.md)
 * Durante uma temporada (Natal, Ano Novo…), quem vencer uma partida no Júnior, uma no Clássico e uma no Old School,
 * as três com a condição Vitória por joias, ganha a medalha daquela temporada e daquele ano ("natal-2026").
 *  · Fica na ficha do jogador (f.medalhas), que sobe pra nuvem com o cadastro. Nick emprestado não conta.
 *  · O jogador escolhe se mostra (f.medalhaMostrar): a medalha aparece ao lado do nome no placar.
 *  · O C.A.O.S. comenta o progresso ("2 de 3, falta o Old School") e a conquista.
 *  · Desenho em SVG, nas cores de cada temporada, com o emoji dela no meio (a do Natal: vermelho, verde e dourado).
 * Só olha o fim da partida: não mexe em ponto, joia, turno nem baralho.
 * ---------------------------------------------------------------------- */
const MEDALHA_MODOS = ["junior", "classico", "oldschool"];
const MEDALHA_MODO_NOME = { junior: "o Júnior", classico: "o Clássico", oldschool: "o Old School" };
// [fita 1, fita 2, aro]
const MEDALHA_CORES = {
  natal: ["#dc2626", "#16a34a", "#facc15"],
  anoNovo: ["#1e3a8a", "#facc15", "#fde68a"],
  halloween: ["#ea580c", "#581c87", "#fb923c"],
  carnaval: ["#db2777", "#7c3aed", "#facc15"],
  junina: ["#b45309", "#dc2626", "#fbbf24"],
  independencia: ["#16a34a", "#facc15", "#2563eb"],
  _: ["#4f46e5", "#a855f7", "#facc15"],
};
function medalhaChave(t, data) {
  const d = data || new Date();
  let a = d.getFullYear();
  if (t && t.id === "anoNovo" && d.getMonth() === 0) a--; // 31/12 e 1/1 são a mesma temporada
  return t ? t.id + "-" + a : null;
}
function medalhaInfo(chave) {
  const m = /^([a-zA-Z]+)-(\d{4})$/.exec(String(chave || ""));
  if (!m) return null;
  const t = typeof temporadaPorId === "function" ? temporadaPorId(m[1]) : null;
  return { id: m[1], ano: +m[2], nome: (t ? t.nome : m[1]) + " " + m[2], emoji: t ? t.emoji : "🏅" };
}
function medalhaSvg(chave, px) {
  const I = medalhaInfo(chave);
  if (!I) return "";
  const [c1, c2, aro] = MEDALHA_CORES[I.id] || MEDALHA_CORES._;
  const n = px || 20;
  return (
    `<svg class="medalha-svg" width="${n}" height="${n}" viewBox="0 0 40 40" role="img" aria-label="Medalha de ${escapeHtml(I.nome)}">` +
    `<path d="M11 1h7l4 15h-7z" fill="${c1}"/><path d="M22 1h7l-4 15h-7z" fill="${c2}"/>` +
    `<circle cx="20" cy="26" r="13" fill="${aro}" stroke="#78350f" stroke-width="1.5"/>` +
    `<circle cx="20" cy="26" r="9.5" fill="none" stroke="#fff8" stroke-width="1"/>` +
    `<text x="20" y="30.5" text-anchor="middle" font-size="12">${I.emoji}</text></svg>`
  );
}
// a ficha guarda só o que é válido (chamada pelo fichaLimpa)
function medalhasLimpar(f) {
  const out = {};
  const m = f && f.medalhas && typeof f.medalhas === "object" ? f.medalhas : {};
  Object.keys(m)
    .filter((k) => medalhaInfo(k))
    .slice(-30)
    .forEach((k) => {
      const d = Array.isArray(m[k] && m[k].d) ? MEDALHA_MODOS.filter((x) => m[k].d.includes(x)) : [];
      const em = Number(m[k] && m[k].em) > 0 ? Number(m[k].em) : 0;
      if (d.length || em) out[k] = { d, em };
    });
  const mostrar = f && typeof f.medalhaMostrar === "string" && out[f.medalhaMostrar] && out[f.medalhaMostrar].em ? f.medalhaMostrar : null;
  return { medalhas: out, medalhaMostrar: mostrar };
}
// Fim da partida (caosMemFimDePartida, dentro do fichaUpd de cada jogador): anota a vitória que vale.
// Devolve o que aconteceu: null, { tipo: "progresso", ... } ou { tipo: "ganhou", ... }.
function medalhaAnotar(f, venceu, data) {
  try {
    if (!venceu || typeof WIN_CONDITION === "undefined" || WIN_CONDITION !== "joias") return null;
    if (typeof CURRENT_MODE === "undefined" || !MEDALHA_MODOS.includes(CURRENT_MODE)) return null;
    const t = typeof temporadaAtual === "function" ? temporadaAtual(data) : null;
    const ch = medalhaChave(t, data);
    if (!ch) return null;
    f.medalhas = f.medalhas || {};
    const m = (f.medalhas[ch] = f.medalhas[ch] || { d: [], em: 0 });
    if (m.em || m.d.includes(CURRENT_MODE)) return null; // já ganhou, ou esse modo já estava contado
    m.d.push(CURRENT_MODE);
    if (m.d.length >= MEDALHA_MODOS.length) {
      m.em = Date.now();
      return { tipo: "ganhou", chave: ch, temporada: t.nome };
    }
    const falta = MEDALHA_MODOS.filter((x) => !m.d.includes(x)).map((x) => MEDALHA_MODO_NOME[x]);
    return { tipo: "progresso", chave: ch, temporada: t.nome, q: m.d.length, falta: falta.join(" e ") };
  } catch (e) {
    return null;
  }
}
// O que aconteceu no fim da partida vira fala do C.A.O.S. e, pra quem ganhou, a pergunta "mostrar no nome?"
function medalhaAvisar(eventos) {
  if (!eventos || !eventos.length) return;
  const B = REACTIVE_VOICE.temporada && REACTIVE_VOICE.temporada.medalha;
  eventos.forEach((ev, k) => {
    setTimeout(() => {
      try {
        if (B) {
          const fala = ev.tipo === "ganhou" ? getRandomReaction(B.ganhou, ev.nome, ev.temporada) : getRandomReaction(B.progresso, ev.nome, ev.temporada, ev.q, ev.falta);
          if (fala) showToastMessage(fala, null, true);
        }
        if (ev.tipo === "ganhou") setTimeout(() => medalhaPerguntarMostrar(ev.nome, ev.chave), 4500);
      } catch (e) {}
    }, 5000 + k * 7000);
  });
}
function medalhaPerguntarMostrar(nome, chave) {
  const I = medalhaInfo(chave);
  if (!I) return;
  document.getElementById("medalhaJanela")?.remove();
  const ov = document.createElement("div");
  ov.id = "medalhaJanela";
  ov.className = "jf-modal-bg";
  ov.innerHTML =
    `<div class="jf-modal medalha-modal" role="dialog" aria-modal="true" aria-labelledby="medTit">` +
    `<div class="medalha-grande" aria-hidden="true">${medalhaSvg(chave, 96)}</div>` +
    `<h3 id="medTit">🏅 Medalha de ${escapeHtml(I.nome)}</h3>` +
    `<p>${escapeHtml(nome)} venceu por joias no Júnior, no Clássico e no Old School durante a temporada.</p>` +
    `<p><small>Quer mostrar a medalha ao lado do seu nome no placar? Dá pra mudar depois.</small></p>` +
    `<button type="button" class="btn-start btn-neo neo-solid neo-still" id="medMostrar" style="--mc:#f59e0b; --mc-glow:rgba(245,158,11,0.35);">🏅 Mostrar no meu nome</button>` +
    `<button type="button" class="chip" id="medGuardar" style="margin-top:10px">Guardar sem mostrar</button></div>`;
  const fechar = (mostrar) => {
    medalhaEscolher(nome, mostrar ? chave : null);
    ov.remove();
    try {
      if (typeof renderScoreboard === "function") renderScoreboard();
    } catch (e) {}
  };
  ov.querySelector("#medMostrar").addEventListener("click", () => fechar(true));
  ov.querySelector("#medGuardar").addEventListener("click", () => fechar(false));
  document.body.appendChild(ov);
  setTimeout(() => ov.querySelector("#medMostrar")?.focus(), 50); // teclado e leitor de tela começam na janela
}
// Mostrar (chave) ou esconder (null) a medalha do jogador
function medalhaEscolher(nome, chave) {
  fichaUpd(nome, (f) => {
    f.medalhaMostrar = chave && f.medalhas && f.medalhas[chave] && f.medalhas[chave].em ? chave : null;
  });
}
// Ao lado do nome no placar
function medalhaHtml(p) {
  try {
    if (!p || typeof memContaFicha !== "function" || !memContaFicha(p)) return "";
    const f = fichaGet(p.name);
    if (!f || !f.medalhaMostrar) return "";
    const I = medalhaInfo(f.medalhaMostrar);
    return ` <span class="medalha-tag" title="Medalha de ${escapeHtml(I.nome)}">${medalhaSvg(f.medalhaMostrar, 18)}</span>`;
  } catch (e) {
    return "";
  }
}
