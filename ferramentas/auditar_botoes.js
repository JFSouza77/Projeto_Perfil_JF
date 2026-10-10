// Auditoria dos botões (1.7.6): passa pelas telas do jogo no Noturno, no Claro e com letra Enorme e confere
// cada botão visível: área de toque (mínimo 44 px), nome acessível, contraste e texto vazando.
// Uso: node ferramentas/auditar_botoes.js [Mestre.html] [--json saida.json]
"use strict";
const { acharMestre, abrirNavegador } = require("./_navegador");

const MESTRE = acharMestre(process.argv.slice(2).find((a) => a.endsWith(".html")));
const iJson = process.argv.indexOf("--json");
const SAIDA_JSON = iJson > 0 ? process.argv[iJson + 1] : null;
const TOQUE_MIN = 44;
const CONTRASTE_MIN = 4.5; // texto normal (WCAG AA); texto grande/negrito ≥ 18.66 px usa 3
const CONTRASTE_GRANDE = 3;

// Roda dentro da página: mede cada botão visível.
function medir(tela) {
  const parse = (c) => {
    const m = String(c).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const misturar = (cima, baixo) => ({
    r: cima.r * cima.a + baixo.r * (1 - cima.a),
    g: cima.g * cima.a + baixo.g * (1 - cima.a),
    b: cima.b * cima.a + baixo.b * (1 - cima.a),
    a: 1,
  });
  // Fundo efetivo: empilha as cores dos ancestrais; gradiente/imagem = indeterminado.
  const fundo = (el) => {
    const pilha = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return { indet: true };
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) {
        pilha.push(c);
        if (c.a >= 1) break;
      }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    const bodyBg = parse(getComputedStyle(document.body).backgroundColor);
    if (bodyBg && bodyBg.a >= 1) base = bodyBg;
    for (let i = pilha.length - 1; i >= 0; i--) base = misturar(pilha[i], base);
    return base;
  };
  const visivel = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return false;
    }
    // Coberto por janela? Confere o ponto central.
    const x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2));
    const y = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
    if (r.bottom < 0 || r.top > innerHeight) return "fora";
    const topo = document.elementFromPoint(x, y);
    return !topo || el.contains(topo) || topo.contains(el) ? true : "coberto";
  };
  const nome = (el) =>
    (el.getAttribute("aria-label") ||
      (el.getAttribute("aria-labelledby") && document.getElementById(el.getAttribute("aria-labelledby"))?.textContent) ||
      (el.labels && el.labels[0] && el.labels[0].textContent) ||
      el.textContent ||
      el.getAttribute("title") ||
      el.value ||
      "")
      .replace(/\s+/g, " ")
      .trim();
  const seletor = (el) => {
    if (el.id) return "#" + el.id;
    const cls = [...el.classList].filter((c) => !/^(on|sel|ativo|active|tomada|pulse|flash)/.test(c)).slice(0, 2);
    const pai = el.closest("[id]");
    return (pai ? "#" + pai.id + " " : "") + el.tagName.toLowerCase() + (cls.length ? "." + cls.join(".") : "");
  };
  // Texto vazando: mede só as letras (nós de texto), não o brilho/halo decorativo dos botões neon.
  const textoVaza = (el, r) => {
    if (el.tagName === "INPUT" || el.tagName === "SELECT") return false;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const rg = document.createRange();
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.textContent.trim()) continue;
      rg.selectNodeContents(n);
      for (const t of rg.getClientRects()) {
        if (t.width < 1) continue;
        if (t.top < r.top - 2 || t.bottom > r.bottom + 2 || t.left < r.left - 2 || t.right > r.right + 2) return true;
      }
    }
    return false;
  };
  const els = document.querySelectorAll(
    'button, [role="button"], a[href], input[type="range"], input[type="checkbox"], input[type="text"], input:not([type]), select, .number-btn, .color-swatch, .avatar-swatch',
  );
  const out = [];
  const vistos = new Set();
  els.forEach((el) => {
    if (vistos.has(el)) return;
    vistos.add(el);
    const v = visivel(el);
    if (v !== true) return;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const txt = parse(cs.color);
    let bg = fundo(el);
    // Camada colorida num ::after/::before atrás do texto (botões da mesa): ela é o fundo de verdade.
    let w = r.width;
    let h = r.height;
    for (const ps of ["::after", "::before"]) {
      const p = getComputedStyle(el, ps);
      if (p.content === "none" || p.position !== "absolute") continue;
      const c = parse(p.backgroundColor);
      if (c && c.a > 0.5 && parseFloat(p.width) >= r.width * 0.8) {
        const k = (p.filter.match(/brightness\(([\d.]+)\)/) || [, 1])[1];
        bg = { r: c.r * k, g: c.g * k, b: c.b * k, a: 1 };
      }
      // Área de toque ampliada por um pseudo-elemento transparente maior que o botão.
      if (p.pointerEvents !== "none") {
        w = Math.max(w, parseFloat(p.width) || 0);
        h = Math.max(h, parseFloat(p.height) || 0);
      }
    }
    let contraste = null;
    const temTexto = (el.textContent || "").replace(/[\s\p{Extended_Pictographic}️‍]/gu, "").length > 0;
    if (temTexto && txt && !bg.indet) {
      const t = txt.a < 1 ? misturar(txt, bg) : txt;
      const [a, b] = [lum(t), lum(bg)].sort((x, y) => y - x);
      contraste = Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100;
    }
    const px = parseFloat(cs.fontSize);
    const grande = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
    out.push({
      tela,
      sel: seletor(el),
      nome: nome(el).slice(0, 60),
      w: Math.round(w),
      h: Math.round(h),
      fonte: Math.round(px * 10) / 10,
      contraste,
      minimo: grande ? 3 : 4.5,
      desativado: !!el.disabled,
      tipo: el.tagName.toLowerCase() + (el.type ? ":" + el.type : ""),
      vaza: textoVaza(el, r),
      cor: cs.color,
      fundo: bg.indet ? "gradiente/imagem" : `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
    });
  });
  return out;
}

(async () => {
  const navegador = await abrirNavegador();
  const todos = [];
  const erros = [];
  for (const tema of ["noturno", "claro", "enorme"]) {
    // "enorme": letra Enorme na área útil do Safari num iPhone (a barra do navegador come a altura)
    const page = await navegador.newPage({ viewport: { width: 390, height: tema === "enorme" ? 664 : 844 }, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => erros.push(tema + ": " + e.message));
    await page.route(/fonts\./, (r) => r.abort());
    await page.addInitScript((claro) => {
      try {
        localStorage.setItem("perfil5_noturno", claro ? "0" : "1");
      } catch (e) {}
      if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
    }, tema === "claro");
    if (tema === "enorme")
      await page.addInitScript(() => {
        try {
          localStorage.setItem("perfil5_acessibilidade", JSON.stringify({ letra: 2 }));
        } catch (e) {}
      });
    await page.goto("file://" + MESTRE);
    await page.waitForFunction(() => typeof iniciar === "function" && !document.getElementById("goToRulesBtn").disabled);
    await page.evaluate((claro) => typeof temaAplicar === "function" && temaAplicar(claro), tema === "claro");
    await page.addStyleTag({ content: "*{animation:none!important;transition:none!important}" });
    const espera = (ms) => page.waitForTimeout(ms);
    const anotar = async (tela) => {
      await espera(250);
      todos.push(...(await page.evaluate(medir, tema + " · " + tela)));
    };
    const c = async (s) => {
      await page.locator(s).first().click({ timeout: 4000 }).catch(() => {});
      await espera(300);
    };
    const fecharJanelas = async (tela) => {
      for (let i = 0; i < 5; i++) {
        const x = page.locator(".caos-modal-ov button:visible, #novOk:visible, #paNao:visible").first();
        if (!(await x.count())) break;
        if (tela) await anotar(tela + " (janela)");
        await x.click({ timeout: 800 }).catch(() => {});
        await espera(250);
      }
    };
    await fecharJanelas("abertura");
    await anotar("tela inicial");
    await c("#btnMenuSplash");
    await anotar("menu ⋮");
    await c("#btnAcessibilidade");
    await anotar("painel acessibilidade");
    await c("#acessFechar");
    await c("#btnTutorial");
    await anotar("tutorial rápido");
    for (let i = 0; i < 12 && (await page.locator("#tutManual:visible").count()) === 0; i++) await c("#tutNext");
    await anotar("tutorial rápido (fim)");
    await c("#tutManual");
    await anotar("manual completo");
    await c("#tutClose");
    await c("#goToRulesBtn");
    await fecharJanelas("regras");
    await anotar("formato");
    await c("#btnFormatVersus");
    await c("#fmtConfirmBtn");
    await anotar("modo");
    await c("#modeBtnClassico");
    await c("#modeConfirmBtn");
    // 1.7.9.6: depois do modo, "Vai jogar online?" (audita a janela e segue sem sala)
    await espera(700);
    if (await page.locator("#redePergunta").count()) {
      await anotar("pergunta da sala online");
      await c("#redePerguntaNao");
    }
    await anotar("regras do modo");
    await c("#startGameBtn");
    await fecharJanelas("jogadores");
    await anotar("cadastro de jogadores");
    for (const n of ["Ana", "Beto"]) {
      await page.fill("#playerNameInput", n);
      await page.locator("#playerNameInput").dispatchEvent("input");
      for (let t = 0; t < 4 && (await page.locator("#addPlayerBtn:disabled").count()); t++) {
        await fecharJanelas();
        for (const s of ["#colorPickerRow .color-swatch:not(.tomada)", "#avatarPickerRow .avatar-swatch:not(.tomada)", "#humorPickerRow button"]) {
          const x = page.locator(s).nth(t);
          if (await x.count()) await x.click({ timeout: 800, force: true }).catch(() => {});
        }
        await espera(250);
      }
      await c("#addPlayerBtn");
      await fecharJanelas();
    }
    await anotar("jogadores prontos");
    await c("#drawStarterBtn");
    await espera(6000);
    await anotar("sorteio de quem começa");
    await c("#confirmStartBtn");
    await espera(2500);
    await fecharJanelas("partida");
    for (let i = 0; i < 6; i++) {
      await fecharJanelas();
      await anotar("partida (antes da carta)");
      const p = page.locator("#drawBtn:visible, #flipBtn:visible, #rouletteDoneBtn:visible").first();
      if (await p.count()) await p.click({ timeout: 2000 }).catch(() => {});
      await espera(1500);
      if (await page.locator(".number-btn:visible").count()) break;
    }
    await fecharJanelas();
    await anotar("escolha da dica");
    await page.locator(".number-btn:visible").first().click({ timeout: 3000 }).catch(() => {});
    await espera(800);
    await fecharJanelas();
    await anotar("resposta");
    await c("#pauseBtn, .pause-btn, [id*=pause i]:visible");
    await anotar("pausa");
    await page.close();
  }
  await navegador.close();

  // Junta por tela-independente: mesmo seletor+nome conta uma vez, guardando o pior caso.
  const porBotao = new Map();
  for (const b of todos) {
    const k = b.sel + "|" + b.nome + "|" + b.tela.split(" · ")[0];
    const atual = porBotao.get(k);
    if (!atual) porBotao.set(k, { ...b, telas: [b.tela.split(" · ")[1]] });
    else {
      if (!atual.telas.includes(b.tela.split(" · ")[1])) atual.telas.push(b.tela.split(" · ")[1]);
      atual.w = Math.min(atual.w, b.w);
      atual.h = Math.min(atual.h, b.h);
      if (b.contraste != null && (atual.contraste == null || b.contraste < atual.contraste)) atual.contraste = b.contraste;
    }
  }
  const lista = [...porBotao.values()];
  const pequenos = lista.filter((b) => !b.tipo.startsWith("input:text") && (b.w < TOQUE_MIN || b.h < TOQUE_MIN));
  const semNome = lista.filter((b) => !b.nome || !/[\p{L}\p{N}]/u.test(b.nome));
  const baixoContraste = lista.filter((b) => !b.desativado && b.contraste != null && b.contraste < b.minimo);
  const vazando = lista.filter((b) => b.vaza);
  const linha = (b, extra) => `  ${b.tela.split(" · ")[0].padEnd(7)} ${b.sel.padEnd(42)} ${extra}  "${b.nome}"  [${b.telas.join(", ")}]`;
  console.log(`Auditoria dos botões · ${require("path").basename(MESTRE)}`);
  console.log(`${lista.length} botões únicos (Noturno, Claro e letra Enorme), ${todos.length} medições em ${new Set(todos.map((b) => b.tela)).size} telas.\n`);
  console.log(`Área de toque abaixo de ${TOQUE_MIN} px: ${pequenos.length}`);
  pequenos.forEach((b) => console.log(linha(b, `${b.w}×${b.h}`)));
  console.log(`\nSem nome acessível (só ícone/emoji): ${semNome.length}`);
  semNome.forEach((b) => console.log(linha(b, "")));
  console.log(`\nContraste abaixo do mínimo (${CONTRASTE_MIN}, ou ${CONTRASTE_GRANDE} em texto grande): ${baixoContraste.length}`);
  baixoContraste.forEach((b) => console.log(linha(b, `${b.contraste}:1 (mín ${b.minimo}) ${b.cor} sobre ${b.fundo}`)));
  console.log(`\nTexto vazando pra fora do botão: ${vazando.length}`);
  vazando.forEach((b) => console.log(linha(b, `${b.w}×${b.h}`)));
  console.log(erros.length ? "\nErros na página:\n  " + erros.join("\n  ") : "\nSem erro na página.");
  if (SAIDA_JSON) require("fs").writeFileSync(SAIDA_JSON, JSON.stringify(lista, null, 1));
})();
