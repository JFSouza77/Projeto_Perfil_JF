/* ----------------------------------------------------------------------
 * 5v. PRINTS NOS REPORTES (25/10/2026, pedido do JF: "uma boa prova do que e como aconteceu")
 * Reportar carta (5n) e Reportar problema (5u) levam imagens junto:
 *  · PRINT AUTOMÁTICO: ao abrir a janela, o jogo fotografa a tela como estava (html2canvas, 5w). A própria
 *    janela de reporte e a resposta da carta ficam de fora do print.
 *  · FOTO OU PRINT DO APARELHO: a pessoa pode anexar o print que tirou na hora (ou uma foto da tela).
 * Até REPORTE_IMG_MAX imagens, reduzidas (lado maior REPORTE_IMG_LADO, JPEG) pra caber no servidor.
 * ---------------------------------------------------------------------- */
const REPORTE_IMG_MAX = 3;
const REPORTE_IMG_LADO = 900;
const REPORTE_IMG_QUALIDADE = 0.6;
const REPORTE_IMG_TAM_MAX = 280000; // tamanho máximo de cada imagem (texto base64)
// o que nunca entra no print: as janelas de reporte e a resposta da carta
function reporteFicaForaDoPrint(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el.id === "reportarCarta" || el.id === "reportarProblema" || el.id === "answerToggle" || el.id === "conferirBtn" || el.id === "ansHint") return true;
  // no arquivo offline (file://) imagem solta "suja" o desenho e o navegador não deixa exportar: fica de fora
  if (el.tagName === "IMG" && location.protocol === "file:") return true;
  return !!(el.classList && (el.classList.contains("answer-line-name") || el.classList.contains("jf-toast-overlay-escondido")));
}
// reduz um canvas ou imagem pra JPEG (lado maior REPORTE_IMG_LADO); devolve null se não couber
function reporteReduzir(fonte, w, h) {
  try {
    const k = Math.min(1, REPORTE_IMG_LADO / Math.max(w, h, 1));
    const cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(w * k));
    cv.height = Math.max(1, Math.round(h * k));
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.drawImage(fonte, 0, 0, cv.width, cv.height);
    for (const q of [REPORTE_IMG_QUALIDADE, 0.45, 0.3]) {
      const d = cv.toDataURL("image/jpeg", q);
      if (d.length <= REPORTE_IMG_TAM_MAX) return d;
    }
  } catch (e) {}
  return null;
}
// O html2canvas 1.4.1 não entende a cor "color(srgb r g b / a)" (é como o navegador devolve o color-mix() do
// CSS). Na CÓPIA da página que ele fotografa, essas cores viram rgba(). A página de verdade não muda.
const REPORTE_PROPS_COR = ["color", "background-color", "background-image", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color", "outline-color", "box-shadow", "text-shadow", "text-decoration-color", "fill", "stroke", "caret-color", "column-rule-color"];
function reporteCorRgba(v) {
  return String(v).replace(/color\(srgb\s+([-\d.e+]+)\s+([-\d.e+]+)\s+([-\d.e+]+)(?:\s*\/\s*([-\d.e+%]+))?\)/g, (_, r, g, b, a) => {
    const c = (x) => Math.max(0, Math.min(255, Math.round(parseFloat(x) * 255)));
    const al = a == null ? 1 : /%$/.test(a) ? parseFloat(a) / 100 : parseFloat(a);
    return `rgba(${c(r)}, ${c(g)}, ${c(b)}, ${Math.max(0, Math.min(1, al))})`;
  });
}
function reporteCopiaSemColorFn(doc) {
  // na cópia as animações recomeçariam do zero (a carta entra com opacidade 0): o print sai do estado final
  try {
    const st = doc.createElement("style");
    st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}";
    doc.head.appendChild(st);
  } catch (e) {}
  try {
    const win = doc.defaultView;
    doc.querySelectorAll("*").forEach((el) => {
      const cs = win.getComputedStyle(el);
      for (const p of REPORTE_PROPS_COR) {
        const v = cs.getPropertyValue(p);
        if (v && v.indexOf("color(") !== -1) el.style.setProperty(p, reporteCorRgba(v), "important");
      }
    });
  } catch (e) {}
}
// print da tela como ela está (sem a janela de reporte e sem a resposta). Nunca trava: em erro, devolve null.
async function reportePrintTela() {
  if (typeof html2canvas !== "function") return null;
  try {
    const fundo = getComputedStyle(document.body).backgroundColor;
    const cv = await Promise.race([
      html2canvas(document.body, {
        logging: false,
        useCORS: false,
        scale: Math.min(1, REPORTE_IMG_LADO / Math.max(window.innerWidth, window.innerHeight)),
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: fundo && fundo !== "rgba(0, 0, 0, 0)" ? fundo : "#1a1a2e",
        ignoreElements: reporteFicaForaDoPrint,
        onclone: reporteCopiaSemColorFn,
      }),
      new Promise((ok) => setTimeout(() => ok(null), 8000)),
    ]);
    return cv ? reporteReduzir(cv, cv.width, cv.height) : null;
  } catch (e) {
    return null;
  }
}
// foto/print escolhido no aparelho → JPEG reduzido
function reporteLerArquivo(arq) {
  return new Promise((ok) => {
    if (!arq || !/^image\//.test(arq.type || "")) return ok(null);
    const url = URL.createObjectURL(arq);
    const img = new Image();
    img.onload = () => {
      const d = reporteReduzir(img, img.naturalWidth, img.naturalHeight);
      URL.revokeObjectURL(url);
      ok(d);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      ok(null);
    };
    img.src = url;
  });
}
// área das imagens dentro da janela de reporte: miniaturas (com ✕), "Adicionar foto ou print" e o print
// automático. Devolve { imagens(), pronto } (pronto: Promise que resolve quando o print automático termina).
function reporteImagensMontar(caixa) {
  const lista = [];
  caixa.className = "rep-imgs";
  caixa.innerHTML =
    `<div class="rep-imgs-tit">📸 Imagens que vão junto</div><div class="rep-thumbs"></div>` +
    `<label class="chip rep-add"><input type="file" accept="image/*" multiple hidden> 📎 Adicionar foto ou print</label>` +
    `<p class="rep-total"><small>O print da tela é tirado sozinho (sem a resposta da carta). Toque no ✕ pra tirar uma imagem.</small></p>`;
  const thumbs = caixa.querySelector(".rep-thumbs"),
    add = caixa.querySelector(".rep-add"),
    input = add.querySelector("input");
  const desenhar = () => {
    thumbs.innerHTML = lista.length
      ? lista
          .map(
            (it, i) =>
              `<span class="rep-thumb"><img src="${it.d}" alt="${it.auto ? "Print da tela" : "Imagem anexada"} ${i + 1}"><button type="button" class="rep-thumb-x" data-i="${i}" aria-label="Tirar a imagem ${i + 1}">✕</button></span>`,
          )
          .join("")
      : `<span class="rep-thumb-vazio">${caixa.dataset.tirando ? "⏳ Tirando o print da tela…" : "Nenhuma imagem."}</span>`;
    add.style.display = lista.length >= REPORTE_IMG_MAX ? "none" : "";
  };
  thumbs.addEventListener("click", (ev) => {
    const b = ev.target.closest(".rep-thumb-x");
    if (!b) return;
    lista.splice(+b.dataset.i, 1);
    desenhar();
  });
  input.addEventListener("change", async () => {
    for (const arq of [...input.files].slice(0, REPORTE_IMG_MAX - lista.length)) {
      const d = await reporteLerArquivo(arq);
      if (d && lista.length < REPORTE_IMG_MAX) lista.push({ d, auto: false });
    }
    input.value = "";
    desenhar();
  });
  caixa.dataset.tirando = "1";
  desenhar();
  const pronto = reportePrintTela().then((d) => {
    delete caixa.dataset.tirando;
    if (d && lista.length < REPORTE_IMG_MAX) lista.unshift({ d, auto: true });
    desenhar();
  });
  return { imagens: () => lista.map((x) => x.d), pronto };
}
