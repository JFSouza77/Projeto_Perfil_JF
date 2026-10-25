#!/usr/bin/env node
// Inventário dos pontos de fala do C.A.O.S. (C.A.O.S. 5.1 · cérebro em modo sombra, passo 1).
// Varre src/js e lista cada lugar que pede fala (showToastMessage, caosFalaAgendar, caosFalarDepois,
// admFala, getRandomReaction, caosGerarFala) com arquivo, linha e banco citado. Confere no Mestre
// se todo banco citado existe de verdade.
//   node ferramentas/caos_inventario.js            → reescreve docs/CAOS_Inventario_de_Falas.md
//   node ferramentas/caos_inventario.js --checar   → só confere (bancos existem e o documento está em dia)
"use strict";
const fs = require("fs");
const path = require("path");
const { acharMestre, abrirNavegador } = require("./_navegador");
const RAIZ = path.join(__dirname, "..");
const DOC = path.join(RAIZ, "docs", "CAOS_Inventario_de_Falas.md");
const CHECAR = process.argv.includes("--checar");
const CHAMADAS = ["showToastMessage", "caosFalaAgendar", "caosFalarDepois", "admFala", "getRandomReaction", "caosGerarFala"];

function arquivos(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((d) => (d.isDirectory() ? arquivos(path.join(dir, d.name)) : d.name.endsWith(".js") ? [path.join(dir, d.name)] : []));
}
function varrer() {
  const pontos = [];
  for (const f of arquivos(path.join(RAIZ, "src", "js")).sort()) {
    const rel = path.relative(path.join(RAIZ, "src"), f);
    fs.readFileSync(f, "utf8")
      .split("\n")
      .forEach((l, i) => {
        if (/^\s*(\/\/|\*)/.test(l)) return;
        const tipos = CHAMADAS.filter((c) => new RegExp("(^|[^\\w.])" + c + "\\(").test(l) && !new RegExp("function " + c + "\\(").test(l));
        if (!tipos.length) return;
        const bancos = [...new Set((l.match(/REACTIVE_VOICE(\.[A-Za-z_]\w*)+/g) || []).map((b) => b.replace(/^REACTIVE_VOICE\./, "")))];
        const ger = (l.match(/caosGerarFala\(\s*"([\w.]+)"/) || [])[1];
        pontos.push({ arq: rel, linha: i + 1, tipos, bancos, ger: ger || null });
      });
  }
  return pontos;
}
function montarDoc(pontos) {
  const porArq = {};
  pontos.forEach((p) => (porArq[p.arq] = porArq[p.arq] || []).push(p));
  const conta = (t) => pontos.filter((p) => p.tipos.includes(t)).length;
  const L = [
    "# Inventário dos pontos de fala do C.A.O.S.",
    "",
    "Gerado por `node ferramentas/caos_inventario.js` (não edite à mão). Base do cérebro em modo sombra",
    "(`docs/Roteiro_Cerebro_Sombra_2026-10-25.md`). Toda fala que aparece passa pelo funil `showToastMessage`,",
    "e o funil anota tudo em `caosEmit` (`src/js/07-caos/15-cerebro-sombra.js`).",
    "",
    "| Chamada | Linhas |",
    "|---|---|",
    ...CHAMADAS.map((c) => `| \`${c}\` | ${conta(c)} |`),
    `| **Total de linhas com fala** | **${pontos.length}** |`,
    "",
  ];
  for (const arq of Object.keys(porArq)) {
    L.push(`## ${arq} (${porArq[arq].length})`, "", "| Linha | Chamada | Banco ou gerador |", "|---|---|---|");
    porArq[arq].forEach((p) =>
      L.push(`| ${p.linha} | ${p.tipos.join(", ")} | ${[...p.bancos, ...(p.ger ? ["gerador " + p.ger] : [])].join(", ") || "-"} |`),
    );
    L.push("");
  }
  return L.join("\n");
}
(async () => {
  const pontos = varrer();
  const bancos = [...new Set(pontos.flatMap((p) => p.bancos))];
  const b = await abrirNavegador();
  const page = await b.newPage();
  await page.route(/fonts\./, (r) => r.abort());
  await page.goto("file://" + acharMestre());
  await page.waitForFunction(() => typeof REACTIVE_VOICE === "object");
  // banco citado precisa existir (um prefixo dele também vale: REACTIVE_VOICE.amigos[id] etc.)
  const faltam = await page.evaluate((bs) => {
    return bs.filter((b) => {
      let o = REACTIVE_VOICE;
      for (const k of b.split(".")) {
        if (o == null || typeof o !== "object" || !(k in o)) return true;
        o = o[k];
      }
      return false;
    });
  }, bancos);
  await b.close();
  const doc = montarDoc(pontos);
  const emDia = fs.existsSync(DOC) && fs.readFileSync(DOC, "utf8") === doc;
  if (!CHECAR) fs.writeFileSync(DOC, doc);
  console.log(`${pontos.length} linhas com fala · ${bancos.length} bancos citados`);
  if (faltam.length) console.log("Error: banco citado que não existe: " + faltam.join(", "));
  if (CHECAR && !emDia) console.log("Error: docs/CAOS_Inventario_de_Falas.md desatualizado (rode sem --checar)");
  console.log(faltam.length || (CHECAR && !emDia) ? "INVENTÁRIO FALHOU" : "INVENTÁRIO OK");
})();
