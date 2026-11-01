#!/usr/bin/env node
// Teste da 1.9.2 (prints 8, 11 e 12 do JF, teste de 26/10): no celular, a faixa SUA VEZ só aparece depois que o
// Mestre mostra a carta; no intervalo, o próximo Mestre não vê a resposta nem o botão de virar a carta.
//   node ferramentas/teste_t2_vez.js
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
  await page.goto("file://" + acharMestre());
  await page.waitForFunction(() => typeof redeBotoesHtml === "function");
  const o = await page.evaluate(() => {
    const out = {};
    const base = (extra) => ({
      jogadores: [
        { id: "a", nome: "Anne", avatar: "👸" },
        { id: "b", nome: "JF", avatar: "😎" },
      ],
      mestreId: "b",
      vezId: "a",
      iniciada: true,
      intervalo: false,
      estadoCarta: "hidden",
      carta: null,
      relogio: null,
      partida: { historico: [] },
      ...extra,
    });
    const ver = (eu, retrato, opcoes, segredo) => {
      rede = { eu, retrato, painel: { opcoes: opcoes || [] }, respostas: {}, votei: {}, segredo: segredo || null, abaLobby: null };
      try {
        return redeBotoesHtml();
      } catch (e) {
        return "ERRO " + e.message;
      }
    };
    // print 8: carta ainda escondida → sem faixa SUA VEZ, com o aviso de que começa quando o Mestre mostrar
    const h1 = ver("a", base({ estadoCarta: "hidden" }));
    out.semFaixaAntes = !/SUA VEZ/.test(h1) && /assim que o Mestre mostrar a carta/.test(h1);
    // carta mostrada → faixa SUA VEZ
    const h2 = ver("a", base({ estadoCarta: "revealed", carta: { abertas: [], totalDicas: 20, pendente: null } }));
    out.faixaDepois = /SUA VEZ/.test(h2);
    // o Mestre continua com a faixa dele desde o começo
    const h3 = ver("b", base({ estadoCarta: "hidden" }));
    out.mestreComFaixa = /VOCÊ É O MESTRE/.test(h3);
    // prints 11 e 12: intervalo → o próximo Mestre não vê a resposta nem o Virar a carta
    const virar = [{ a: "virarCarta", t: "🃏 Virar a carta", c: "cta" }, { a: "pausar", t: "⏸️ Pausar", g: "Mais" }];
    const h4 = ver("b", base({ intervalo: true, estadoCarta: "none" }), virar, { resposta: "Sherlock Holmes" });
    out.intervaloSemResposta = !/Sherlock Holmes/.test(h4) && !/Só você vê/.test(h4);
    out.intervaloSemVirar = !/Virar a carta/.test(h4) && /Pausar/.test(h4);
    // fora do intervalo, tudo volta
    const h5 = ver("b", base({ intervalo: false, estadoCarta: "none" }), virar, { resposta: "Sherlock Holmes" });
    out.depoisDoIntervaloVolta = /Sherlock Holmes/.test(h5) && /Virar a carta/.test(h5);
    out.semErro = ![h1, h2, h3, h4, h5].some((h) => /^ERRO/.test(h));
    if (!out.semErro) out.erros = [h1, h2, h3, h4, h5].filter((h) => /^ERRO/.test(h)).join(" | ");
    return out;
  });
  let falhas = 0;
  for (const [k, v] of Object.entries(o)) {
    if (k === "erros") {
      console.log("      " + v);
      continue;
    }
    console.log((v ? "ok   " : "FALHA") + " " + k);
    if (!v) falhas++;
  }
  console.log(falhas ? "T2 VEZ COM PROBLEMA" : "T2 VEZ OK");
  await b.close();
  process.exit(falhas ? 1 : 0);
})().catch((e) => {
  console.log("erro:", e.message);
  process.exit(1);
});
