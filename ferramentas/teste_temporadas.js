#!/usr/bin/env node
// Teste do motor das temporadas (docs/Temporadas.md): a temporada certa em cada data (inclusive as móveis), a
// prioridade quando duas caem juntas, todas aparecendo todo ano, a opção de desligar e o modo de teste.
//   node ferramentas/teste_temporadas.js
const { acharMestre, abrirNavegador } = require("./_navegador");
(async () => {
  const b = await abrirNavegador();
  const page = await (await b.newContext()).newPage();
  await page.route(/fonts\.|google/, (r) => r.abort());
  await page.addInitScript(() => {
    try {
      localStorage.setItem("perfil5_tutorial_visto", "x");
    } catch (e) {}
  });
  const url = "file://" + acharMestre();
  await page.goto(url);
  await page.waitForFunction(() => typeof temporadaDe === "function");
  const o = await page.evaluate(() => {
    const out = {};
    const id = (a, m, d) => (temporadaDe(new Date(a, m - 1, d, 15)) || { id: null }).id;
    const casos = [
      // [ano, mês, dia, esperado]
      [2026, 10, 31, "halloween"],
      [2026, 10, 20, "halloween"],
      [2026, 10, 19, null],
      [2026, 10, 12, "criancas"],
      [2026, 10, 6, "criancas"],
      [2026, 11, 10, null],
      [2026, 11, 27, "blackfriday"], // 4ª quinta de nov/2026 = 26
      [2026, 11, 29, "blackfriday"],
      [2026, 11, 30, null],
      [2026, 12, 1, "natal"],
      [2026, 12, 24, "natal"],
      [2026, 12, 31, "anoNovo"], // ganha do Natal
      [2027, 1, 1, "anoNovo"],
      [2027, 1, 2, "aniversario"],
      [2027, 1, 3, null],
      [2027, 2, 6, "carnaval"], // Páscoa 2027 = 28/3; Carnaval (terça) = 9/2
      [2027, 2, 9, "carnaval"],
      [2027, 2, 10, "carnaval"], // Quarta de Cinzas
      [2027, 2, 11, null],
      [2027, 3, 8, "mulher"],
      [2027, 3, 26, "pascoa"],
      [2027, 3, 28, "pascoa"],
      [2027, 3, 29, null],
      [2027, 5, 9, "maes"],
      [2027, 5, 10, null],
      [2027, 6, 1, "junina"],
      [2027, 6, 12, "namorados"], // ganha da Festa Junina
      [2027, 6, 30, "junina"],
      [2027, 8, 8, "pais"],
      [2027, 8, 22, "folclore"],
      [2027, 9, 7, "independencia"],
      [2027, 11, 26, "blackfriday"],
      [2026, 2, 17, "carnaval"], // Páscoa 2026 = 5/4
      [2026, 4, 3, "pascoa"],
      [2026, 5, 10, "maes"],
      [2026, 8, 9, "pais"],
    ];
    out.erradas = casos.filter(([a, m, d, e]) => id(a, m, d) !== e).map(([a, m, d, e]) => `${d}/${m}/${a}: ${id(a, m, d)} (esperado ${e})`);
    out.datasCertas = out.erradas.length === 0;
    out.quinze = TEMPORADAS.length === 15 && new Set(TEMPORADAS.map((t) => t.id)).size === 15;
    // todas aparecem em todo ano de 2026 a 2040
    const faltou = [];
    for (let a = 2026; a <= 2040; a++) {
      const vistas = new Set();
      for (let t = new Date(a, 0, 1, 15); t.getFullYear() === a; t.setDate(t.getDate() + 1)) {
        const s = temporadaDe(t);
        if (s) vistas.add(s.id);
      }
      TEMPORADAS.forEach((s) => vistas.has(s.id) || faltou.push(a + ":" + s.id));
    }
    out.faltou = faltou;
    out.todasTodoAno = faltou.length === 0;
    // Páscoa conferida em anos conhecidos
    const p = (a) => {
      const d = temporadaPascoa(a);
      return d.getDate() + "/" + (d.getMonth() + 1);
    };
    out.pascoa = p(2026) === "5/4" && p(2027) === "28/3" && p(2028) === "16/4" && p(2030) === "21/4" && p(2038) === "25/4";
    // opção desligada: nada; ligada de novo: volta
    acessCfg.temporadas = false;
    out.desligada = temporadaAtual(new Date(2026, 11, 24, 15)) === null;
    acessCfg.temporadas = true;
    out.ligada = (temporadaAtual(new Date(2026, 11, 24, 15)) || {}).id === "natal";
    // modo de teste pela chave do aparelho
    JFStore.setItem(TEMPORADA_TESTE_KEY, "halloween");
    out.forcada = (temporadaAtual(new Date(2026, 6, 1, 15)) || {}).id === "halloween";
    JFStore.setItem(TEMPORADA_TESTE_KEY, "nenhuma");
    out.forcadaNenhuma = temporadaAtual(new Date(2026, 11, 24, 15)) === null;
    JFStore.removeItem(TEMPORADA_TESTE_KEY);
    return out;
  });
  // ?temporada=natal na URL marca o <html>; desligar na Acessibilidade tira a marca
  await page.goto(url + "?temporada=natal");
  await page.waitForFunction(() => typeof temporadaAplicar === "function");
  o.urlMarcaHtml = await page.evaluate(() => document.documentElement.dataset.temporada === "natal");
  o.desligarTiraMarca = await page.evaluate(() => {
    acessCfg.temporadas = false;
    aplicarAcessibilidade();
    const ok = !document.documentElement.dataset.temporada;
    acessCfg.temporadas = true;
    aplicarAcessibilidade();
    return ok && document.documentElement.dataset.temporada === "natal";
  });
  // item 2: enfeite do Natal (atrás do conteúdo, sem toque) e selo na splash
  o.natalEnfeite = await page.evaluate(() => {
    const e = document.getElementById("temporadaEnfeite");
    const cs = e && getComputedStyle(e);
    return !!cs && cs.display === "block" && cs.pointerEvents === "none" && cs.zIndex === "-1" && cs.position === "fixed";
  });
  o.natalSelo = await page.evaluate(() => {
    const s = document.getElementById("splashTemporada");
    return !!s && !s.hidden && /Edição de Natal/.test(s.textContent);
  });
  await page.goto(url + "?temporada=nenhuma");
  await page.waitForFunction(() => typeof temporadaAplicar === "function");
  o.semTemporadaSemEnfeite = await page.evaluate(() => {
    const e = document.getElementById("temporadaEnfeite");
    const s = document.getElementById("splashTemporada");
    return (!e || getComputedStyle(e).display === "none") && (!s || s.hidden);
  });
  o.botaoNaAcessibilidade = await page.evaluate(() => {
    document.querySelectorAll(".caos-modal-ov").forEach((x) => x.remove());
    acessPainelAbrir();
    return !!document.querySelector('[data-tog="temporadas"]');
  });
  let falhas = 0;
  for (const [k, v] of Object.entries(o)) {
    if (Array.isArray(v)) {
      if (v.length) console.log("      " + k + ": " + v.slice(0, 8).join(" · "));
      continue;
    }
    console.log((v ? "ok   " : "FALHA") + " " + k);
    if (!v) falhas++;
  }
  console.log(falhas ? "TEMPORADAS COM PROBLEMA" : "TEMPORADAS OK");
  await b.close();
  process.exit(falhas ? 1 : 0);
})().catch((e) => {
  console.log("erro:", e.message);
  process.exit(1);
});
