/* ----------------------------------------------------------------------
 * 5u. REPORTAR PROBLEMA (25/10/2026, pedido do JF pras sessões de teste)
 * Irmão do Reportar carta (5n): quem achar um bug (travou, botão que não responde, placar errado,
 * C.A.O.S. falando bobagem, celular que não acompanha…) toca em "🐞 Reportar um problema" (Pausa →
 * Mais opções), em qualquer aparelho. O reporte vai pro servidor da sala (POST /reporte com
 * tipo "problema") e aparece na mesma página com senha do JF, numa seção própria.
 *  · Junto vai, se a pessoa deixar, o RETRATO da partida: versão, modo, carta, placar, últimas ações,
 *    últimas falas e erros da página. Sem nomes (os jogadores viram J1, J2…) e sem a resposta da carta.
 *  · Sem internet, entra na mesma fila do Reportar carta e vai depois.
 * ---------------------------------------------------------------------- */
const PROBLEMA_TIPOS = [
  ["travou", "🧊 Travou ou parou de responder"],
  ["botao", "👆 Botão ou toque que não funciona"],
  ["placar", "🔢 Placar, casas ou joias erradas"],
  ["caos", "🤖 O C.A.O.S. falou ou fez algo errado"],
  ["online", "📱 Celular ou sala online"],
  ["visual", "🎨 Tela feia, cortada ou ilegível"],
  ["outro", "✏️ Outro"],
];
const PROBLEMA_ANEXO_MAX = 2200;
// os últimos erros da página (pra ir no retrato)
let problemaErros = [];
try {
  window.addEventListener("error", (e) => {
    problemaErros.push({ t: Date.now(), m: String((e && e.message) || "erro").slice(0, 140) });
    if (problemaErros.length > 5) problemaErros.shift();
  });
  window.addEventListener("unhandledrejection", (e) => {
    problemaErros.push({ t: Date.now(), m: "promise: " + String((e && e.reason && e.reason.message) || e.reason || "?").slice(0, 130) });
    if (problemaErros.length > 5) problemaErros.shift();
  });
} catch (e) {}
// retrato da partida pra quem vai consertar (sem nomes, sem resposta)
function problemaRetrato() {
  const g = (fn, d) => {
    try {
      const v = fn();
      return v === undefined ? d : v;
    } catch (e) {
      return d;
    }
  };
  const a = {
    v: g(() => JOGO_VERSAO, "?"),
    b: g(() => JOGO_BUILD, 0),
    modo: g(() => CURRENT_MODE, null),
    formato: g(() => CURRENT_FORMAT, null),
    cond: g(() => WIN_CONDITION, null),
    jogando: g(() => !!starterChosen && !gameEnded, false),
    fim: g(() => !!gameEnded, false),
    carta: g(() => (currentCard ? currentCard.id : null), null),
    estado: g(() => cardState, null),
    dicas: g(() => revealedOrder.filter((r) => r && r.item && r.item.type === "clue").length, 0),
    cartas: g(() => stats.totalDrawn, 0),
    rev: g(() => partidaRevisao, 0),
    mestre: g(() => mestreIndex, null),
    vez: g(() => responderIndex, null),
    jog: g(() => players.map((p, i) => ["J" + (i + 1), p.score || 0, p.position || 0, p.humor || ""]), []),
    acoes: g(() => acoesLog.slice(-10).map((x) => x.r + ":" + x.a + (x.d && x.d.length ? "(" + x.d.join(",") + ")" : "")), []),
    falas: g(() => caosFalaReg.slice(-8).map((f) => f.ev + (f.motivo ? " [" + f.motivo + "]" : "")), []),
    caos: g(() => ({ calado: !!caosSilenced, espinha: caosEspinha.log.slice(-3) }), null),
    erros: problemaErros.map((e) => e.m),
    rede: g(() => (rede ? { papel: rede.papel, sala: !!rede.sala } : null), null),
    tela: g(() => window.innerWidth + "x" + window.innerHeight + (matchMedia("(pointer: coarse)").matches ? " toque" : ""), ""),
  };
  // cabe no limite do servidor: tira primeiro o que é mais longo
  for (const k of ["acoes", "falas", "caos", "erros"]) {
    if (JSON.stringify(a).length <= PROBLEMA_ANEXO_MAX) break;
    a[k] = Array.isArray(a[k]) ? a[k].slice(-3) : null;
  }
  return a;
}
// entra na fila do Reportar carta (mesmo envio, mesmo servidor)
function problemaGuardar(p) {
  try {
    const f = cartaReporteFila();
    f.push({ uid: Math.random().toString(36).slice(2, 10), tipo: "problema", ...p });
    localStorage.setItem(CARTAS_REPORTE_FILA_KEY, JSON.stringify(f.slice(-CARTAS_REPORTADAS_MAX)));
    return true;
  } catch (e) {
    return false;
  }
}
function problemaReportarAbrir() {
  document.getElementById("reportarProblema")?.remove();
  const ov = document.createElement("div");
  ov.id = "reportarProblema";
  ov.className = "jf-modal-bg";
  const opTipo = PROBLEMA_TIPOS.map(([k, t], i) => `<label class="rep-op"><input type="radio" name="probTipo" value="${k}"${i ? "" : " checked"}> ${t}</label>`).join("");
  ov.innerHTML =
    `<div class="jf-modal" role="dialog" aria-modal="true" aria-labelledby="probTit"><h3 id="probTit">🐞 Reportar um problema</h3>` +
    `<p><small>Vai direto pro JF. Sem nomes e sem a resposta da carta.</small></p>` +
    `<fieldset class="rep-grupo"><legend>O que aconteceu?</legend>${opTipo}</fieldset>` +
    `<textarea id="probNota" maxlength="300" rows="3" placeholder="Conta rapidinho: o que você fez e o que deu errado (opcional)" aria-label="Descrição do problema (opcional)"></textarea>` +
    `<label class="rep-op"><input type="checkbox" id="probAnexo" checked> Mandar junto o retrato da partida (versão, carta, placar, últimas jogadas)</label>` +
    `<button type="button" class="btn-start btn-neo neo-solid neo-still" id="probSalvar" style="--mc:#f59e0b; --mc-glow:rgba(245,158,11,0.35);">🐞 Enviar pro JF</button>` +
    `<button type="button" class="chip" id="probFechar" style="margin-top:10px">Fechar</button></div>`;
  const salvar = ov.querySelector("#probSalvar");
  salvar.addEventListener("click", () => {
    const ok = problemaGuardar({
      cat: (ov.querySelector('input[name="probTipo"]:checked') || {}).value || "outro",
      nota: String(ov.querySelector("#probNota").value || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 300),
      anexo: ov.querySelector("#probAnexo").checked ? problemaRetrato() : null,
      modo: typeof CURRENT_MODE !== "undefined" ? CURRENT_MODE : null,
      versao: JOGO_VERSAO,
      quando: Date.now(),
    });
    salvar.disabled = true;
    if (!ok) {
      salvar.textContent = "⚠️ Não deu pra guardar neste aparelho";
      return;
    }
    salvar.textContent = "⏳ Enviando…";
    cartaReporteEnviar().then((faltam) => {
      salvar.textContent = faltam ? "📥 Guardado: vai pro JF quando tiver internet" : "✅ Enviado pro JF. Obrigado!";
    });
  });
  ov.querySelector("#probFechar").addEventListener("click", () => ov.remove());
  document.body.appendChild(ov);
}
