/* ----------------------------------------------------------------------
 * 5u2. SUGESTÕES (05/11/2026, pedido do JF: "aba de sugestões e feedback pros jogadores")
 * Qualquer jogador manda uma ideia ou opinião pro JF, quando quiser: menu ⋮ da tela inicial ou Pausa.
 * Vai pelo mesmo caminho do Reportar problema (5u): fila no aparelho, envio quando tiver internet, e a
 * página com senha do JF (seção 💡 Sugestões). Só a categoria e o texto: sem nome, sem retrato da partida.
 * ---------------------------------------------------------------------- */
const SUGESTAO_TIPOS = [
  ["ideia", "💡 Ideia nova"],
  ["modo", "🎮 Modos e regras"],
  ["cartas", "🃏 Cartas"],
  ["caos", "🤖 C.A.O.S."],
  ["visual", "🎨 Visual e acessibilidade"],
  ["outro", "✏️ Outro"],
];
const SUGESTAO_MAX = 500;
function sugestaoGuardar(s) {
  return reporteFilaEntrar({ uid: Math.random().toString(36).slice(2, 10), tipo: "sugestao", ...s });
}
function sugestaoAbrir() {
  document.getElementById("sugestaoJanela")?.remove();
  const ov = document.createElement("div");
  ov.id = "sugestaoJanela";
  ov.className = "jf-modal-bg";
  const opTipo = SUGESTAO_TIPOS.map(([k, t], i) => `<label class="rep-op"><input type="radio" name="sugTipo" value="${k}"${i ? "" : " checked"}> ${t}</label>`).join("");
  ov.innerHTML =
    `<div class="jf-modal" role="dialog" aria-modal="true" aria-labelledby="sugTit"><h3 id="sugTit">💡 Mandar uma sugestão</h3>` +
    `<p><small>Ideia, opinião, o que você gostou ou não gostou: vai direto pro JF. Não precisa pôr seu nome.</small></p>` +
    `<fieldset class="rep-grupo"><legend>Sobre o quê?</legend>${opTipo}</fieldset>` +
    `<textarea id="sugNota" maxlength="${SUGESTAO_MAX}" rows="4" placeholder="Escreve aqui a sua ideia" aria-label="Sua sugestão"></textarea>` +
    `<p class="rep-total"><small id="sugConta" aria-live="polite">0 de ${SUGESTAO_MAX} letras</small></p>` +
    `<button type="button" class="btn-start btn-neo neo-solid neo-still" id="sugEnviar" style="--mc:#22c55e; --mc-glow:rgba(34,197,94,0.35);" disabled>💡 Enviar pro JF</button>` +
    `<button type="button" class="chip" id="sugFechar" style="margin-top:10px">Fechar</button></div>`;
  const nota = ov.querySelector("#sugNota"),
    enviar = ov.querySelector("#sugEnviar"),
    conta = ov.querySelector("#sugConta");
  const limpo = () => String(nota.value || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, SUGESTAO_MAX);
  nota.addEventListener("input", () => {
    conta.textContent = `${nota.value.length} de ${SUGESTAO_MAX} letras`;
    if (!enviar.dataset.foi) enviar.disabled = !limpo();
  });
  enviar.addEventListener("click", () => {
    if (!limpo()) return;
    enviar.disabled = true;
    enviar.dataset.foi = "1";
    const ok = sugestaoGuardar({
      cat: (ov.querySelector('input[name="sugTipo"]:checked') || {}).value || "outro",
      nota: limpo(),
      modo: typeof CURRENT_MODE !== "undefined" ? CURRENT_MODE : null,
      versao: typeof JOGO_VERSAO !== "undefined" ? JOGO_VERSAO : "?",
      quando: Date.now(),
    });
    if (!ok) {
      enviar.textContent = "⚠️ Não deu pra guardar neste aparelho";
      return;
    }
    enviar.textContent = "⏳ Enviando…";
    cartaReporteEnviar().then((faltam) => {
      enviar.textContent = faltam ? "📥 Guardada: vai pro JF quando tiver internet" : "✅ Enviada pro JF. Valeu pela ideia!";
    });
  });
  ov.querySelector("#sugFechar").addEventListener("click", () => ov.remove());
  document.body.appendChild(ov);
  setTimeout(() => nota.focus(), 50);
}
// 05/11/2026 (pente fino, teclado): Esc fecha as janelas de recado (reportes, sugestão e medalha). Só essas: as
// janelas de decisão da partida não podem sumir com uma tecla. Na medalha, Esc vale "Guardar sem mostrar".
try {
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const med = document.getElementById("medalhaJanela");
    if (med) {
      med.querySelector("#medGuardar")?.click();
      return;
    }
    for (const id of ["sugestaoJanela", "reportarProblema", "reportarCarta"]) {
      const el = document.getElementById(id);
      if (el) {
        el.remove();
        return;
      }
    }
  });
} catch (e) {}
