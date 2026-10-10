/* ----------------------------------------------------------------------
 * 5n. REPORTAR CARTA (1.7.10 · parecer do Klaus, R7; aprovado pelo JF)
 * Durante o beta, quem achar uma carta com problema (fato errado, desatualizada, dica que entrega a
 * resposta…) toca em "⚑ Reportar esta carta" (Pausa → Mais opções), em QUALQUER aparelho (ideia do JF:
 * o host pode não ser ele). O reporte vai pro servidor da sala (POST /reporte: id da carta, dica, motivo;
 * nada pessoal) e o JF lê numa página com senha. Sem internet, fica na fila e vai depois (ao abrir o
 * jogo ou no próximo reporte). Reserva: 📤 Compartilhar (WhatsApp etc.) com o texto pronto.
 * Nenhuma carta muda sozinha; a curadoria é feita junto depois.
 *  · A janela não mostra a resposta (a mesa pode estar olhando): só o id da carta e as dicas já abertas.
 *  · Guardado em perfil5_cartas_reportadas (chave nova; até 200, as mais antigas saem).
 * ---------------------------------------------------------------------- */
const CARTAS_REPORTADAS_KEY = "perfil5_cartas_reportadas";
const CARTAS_REPORTADAS_MAX = 200;
const CARTAS_REPORTE_FILA_KEY = "perfil5_cartas_reporte_fila"; // ainda não chegaram no servidor
const REPORTAR_MOTIVOS = [
  ["fato", "❌ Fato errado"],
  ["velha", "🕰️ Desatualizada"],
  ["entrega", "🙊 Entrega a resposta"],
  ["confusa", "🤔 Confusa ou mal escrita"],
  ["outro", "✏️ Outro"],
];
function cartasReportadas() {
  try {
    const l = JSON.parse(localStorage.getItem(CARTAS_REPORTADAS_KEY) || "[]");
    return Array.isArray(l) ? l.filter((x) => x && typeof x.id === "string") : [];
  } catch (e) {
    return [];
  }
}
function cartaReportarGuardar(r) {
  const l = cartasReportadas();
  l.push(r);
  while (l.length > CARTAS_REPORTADAS_MAX) l.shift();
  try {
    localStorage.setItem(CARTAS_REPORTADAS_KEY, JSON.stringify(l));
    const f = cartaReporteFila();
    f.push(r);
    localStorage.setItem(CARTAS_REPORTE_FILA_KEY, JSON.stringify(f.slice(-CARTAS_REPORTADAS_MAX)));
    return true;
  } catch (e) {
    return false;
  }
}
function cartaReporteFila() {
  try {
    const f = JSON.parse(localStorage.getItem(CARTAS_REPORTE_FILA_KEY) || "[]");
    return Array.isArray(f) ? f : [];
  } catch (e) {
    return [];
  }
}
// Manda a fila pro servidor (um por vez; o que chegou sai da fila). Devolve quantos faltam.
let cartaReporteEnviando = null;
function cartaReporteEnviar() {
  if (cartaReporteEnviando) return cartaReporteEnviando;
  const url = typeof redeServidorUrl === "function" ? redeServidorUrl("/reporte") : null;
  if (!url || !cartaReporteFila().length || (typeof navigator !== "undefined" && navigator.onLine === false)) return Promise.resolve(cartaReporteFila().length);
  cartaReporteEnviando = (async () => {
    for (let i = 0; i < 50; i++) {
      const f = cartaReporteFila();
      if (!f.length) break;
      let ok = false;
      try {
        const r = await fetch(url, { method: "POST", body: JSON.stringify(f[0]) });
        ok = r.ok || r.status === 400; // 400 = reporte que o servidor não aceita: não adianta insistir
      } catch (e) {}
      if (!ok) break;
      try {
        localStorage.setItem(CARTAS_REPORTE_FILA_KEY, JSON.stringify(cartaReporteFila().slice(1)));
      } catch (e) {
        break;
      }
    }
    cartaReporteEnviando = null;
    return cartaReporteFila().length;
  })();
  return cartaReporteEnviando;
}
// ao abrir o jogo: o que ficou na fila vai sozinho (sem atrapalhar a abertura)
try {
  setTimeout(() => cartaReporteEnviar(), 8000);
} catch (e) {}
// Texto pra copiar e mandar (uma linha por reporte; a resposta vai junto pra facilitar a conferência).
function cartasReportadasTexto() {
  const l = cartasReportadas();
  if (!l.length) return "";
  const motivo = (m) => (REPORTAR_MOTIVOS.find((x) => x[0] === m) || [m, m])[1].replace(/^\S+\s/, "");
  return (
    `Perfil JF · cartas reportadas (${l.length}) · ${JOGO_VERSAO}\n` +
    l
      .map((r) => {
        const quando = new Date(r.quando).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
        const dica = r.dica ? `dica ${r.dica.pos + 1}: "${r.dica.texto}"` : "a carta toda";
        return `• ${r.id} (${r.resposta || "?"}) · ${dica} · ${motivo(r.motivo)}${r.nota ? " · " + r.nota : ""} · ${quando}`;
      })
      .join("\n")
  );
}
function cartaReportarAbrir() {
  document.getElementById("reportarCarta")?.remove();
  const carta = typeof currentCard !== "undefined" ? currentCard : null;
  const temCarta = !!(carta && carta.id && typeof starterChosen !== "undefined" && starterChosen && !gameEnded);
  const abertas = temCarta ? revealedOrder.filter((r) => r && r.item && r.item.type === "clue") : [];
  const ov = document.createElement("div");
  ov.id = "reportarCarta";
  ov.className = "jf-modal-bg";
  const total = cartasReportadas().length;
  const opDica = [`<label class="rep-op"><input type="radio" name="repDica" value="-1" checked> A carta toda</label>`]
    .concat(abertas.map((r) => `<label class="rep-op"><input type="radio" name="repDica" value="${r.index}"> Dica ${r.index + 1}: ${escapeHtml(String(r.item.text))}</label>`))
    .join("");
  const opMotivo = REPORTAR_MOTIVOS.map(([k, t], i) => `<label class="rep-op"><input type="radio" name="repMotivo" value="${k}"${i ? "" : " checked"}> ${t}</label>`).join("");
  ov.innerHTML =
    `<div class="jf-modal" role="dialog" aria-modal="true" aria-labelledby="repTit"><h3 id="repTit">⚑ Reportar esta carta</h3>` +
    (temCarta
      ? `<p><small>Achou algo errado? O reporte vai direto pro JF (só a carta, a dica e o motivo; nada muda na carta).</small></p>` +
        `<p class="rep-id">Carta <b>${escapeHtml(carta.id)}</b> · ${escapeHtml(String(carta.category || ""))}</p>` +
        `<fieldset class="rep-grupo"><legend>O que está errado?</legend>${opDica}</fieldset>` +
        `<fieldset class="rep-grupo"><legend>Motivo</legend>${opMotivo}</fieldset>` +
        `<input type="text" id="repNota" maxlength="120" autocomplete="off" placeholder="Quer explicar? (opcional)" aria-label="Explicação (opcional)">` +
        `<button type="button" class="btn-start btn-neo neo-solid neo-still" id="repSalvar" style="--mc:#f59e0b; --mc-glow:rgba(245,158,11,0.35);">⚑ Enviar pro JF</button>`
      : `<p>Não tem carta na mesa agora. Abra esta janela durante uma carta pra reportar.</p>`) +
    `<p class="rep-total" id="repTotal">${total ? `${total} carta${total === 1 ? "" : "s"} reportada${total === 1 ? "" : "s"} neste aparelho.` : "Nenhuma carta reportada neste aparelho ainda."}</p>` +
    `<button type="button" class="chip" id="repCopiar"${total ? "" : " disabled"}>📤 Compartilhar a lista</button>` +
    `<button type="button" class="chip" id="repLimpar"${total ? "" : " disabled"} style="margin-top:8px">🗑️ Apagar a lista</button>` +
    `<button type="button" class="chip" id="repFechar" style="margin-top:10px">Fechar</button></div>`;
  const totalAtual = () => {
    const n = cartasReportadas().length;
    const fila = cartaReporteFila().length;
    ov.querySelector("#repTotal").textContent =
      (n ? `${n} carta${n === 1 ? "" : "s"} reportada${n === 1 ? "" : "s"} neste aparelho.` : "Nenhuma carta reportada neste aparelho ainda.") + (fila ? ` ${fila} esperando internet pra ir.` : "");
    ov.querySelector("#repCopiar").disabled = !n;
    ov.querySelector("#repLimpar").disabled = !n;
  };
  const salvar = ov.querySelector("#repSalvar");
  if (salvar)
    salvar.addEventListener("click", () => {
      const pos = +(ov.querySelector('input[name="repDica"]:checked') || {}).value;
      const item = pos >= 0 && carta.clues[pos];
      const ok = cartaReportarGuardar({
        id: carta.id,
        resposta: carta.answer,
        categoria: carta.category,
        dica: item ? { pos, id: item.id || null, texto: String(item.text) } : null,
        motivo: (ov.querySelector('input[name="repMotivo"]:checked') || {}).value || "outro",
        nota: String(ov.querySelector("#repNota").value || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 120),
        modo: typeof CURRENT_MODE !== "undefined" ? CURRENT_MODE : null,
        versao: JOGO_VERSAO,
        quando: Date.now(),
      });
      salvar.disabled = true;
      if (!ok) {
        salvar.textContent = "⚠️ Não deu pra guardar neste aparelho";
        return totalAtual();
      }
      salvar.textContent = "⏳ Enviando…";
      cartaReporteEnviar().then((faltam) => {
        salvar.textContent = faltam ? "📥 Guardado: vai pro JF quando tiver internet" : "✅ Enviado pro JF. Obrigado!";
        totalAtual();
      });
    });
  // reserva: manda o texto por WhatsApp/mensagem (ou copia, se o aparelho não compartilha)
  ov.querySelector("#repCopiar").addEventListener("click", async (e) => {
    const txt = cartasReportadasTexto();
    try {
      if (navigator.share) {
        await navigator.share({ title: "Perfil JF · cartas reportadas", text: txt });
        return;
      }
    } catch (x) {
      if (x && x.name === "AbortError") return;
    }
    let ok = false;
    try {
      await navigator.clipboard.writeText(txt);
      ok = true;
    } catch (x) {}
    e.target.textContent = ok ? "✅ Copiado: cole na conversa com o JF" : "⚠️ Não deu pra copiar";
  });
  ov.querySelector("#repLimpar").addEventListener("click", () =>
    caosConfirmarModal("Apagar a lista de cartas reportadas neste aparelho? (o que já foi pro JF continua lá)", "🗑️ Apagar", "Cancelar", () => {
      try {
        localStorage.removeItem(CARTAS_REPORTADAS_KEY);
      } catch (e) {}
      totalAtual();
    })
  );
  ov.querySelector("#repFechar").addEventListener("click", () => ov.remove());
  document.body.appendChild(ov);
}
