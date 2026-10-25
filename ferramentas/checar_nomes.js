#!/usr/bin/env node
// Checagem de nomes (1.7.10.5.5): passa o TypeScript por cima do JavaScript do jogo, SEM mudar nada no jogo.
// Junta os .js de src/ na ordem do montar.js e procura nome que não existe (função ou variável digitada
// errado, ou que sumiu num corte de código). É o tipo de erro que só aparece quando aquela parte roda,
// às vezes só no online. As outras queixas do TypeScript (tipos) são ignoradas: o jogo é dinâmico de propósito.
//   node ferramentas/checar_nomes.js
// Precisa do TypeScript (tsc) instalado; sem ele, só avisa e sai sem erro.
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const RAIZ = path.join(__dirname, "..");
// nomes que vêm de fora do nosso código (bibliotecas embutidas)
const DE_FORA = new Set(["Peer", "define", "html2canvas"]); // html2canvas: 05w (25/10/2026)

const ordem = fs.readFileSync(path.join(RAIZ, "src", "ordem.txt"), "utf8").split("\n").map((l) => l.trim()).filter((l) => /\.js$/.test(l));
const partes = [];
let linha = 0;
for (const arq of ordem) {
  const txt = fs.readFileSync(path.join(RAIZ, "src", arq), "utf8") + "\n";
  partes.push({ arq, ini: linha + 1, n: txt.split("\n").length - 1 });
  linha += txt.split("\n").length - 1;
  partes[partes.length - 1].txt = txt;
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "perfil-nomes-"));
const alvo = path.join(tmp, "jogo.js");
fs.writeFileSync(alvo, partes.map((p) => p.txt).join(""));

const tsc = spawnSync("tsc", ["--allowJs", "--checkJs", "--noEmit", "--target", "es2022", "--lib", "dom,es2022,dom.iterable", "--skipLibCheck", "--strict", "false", "--noImplicitAny", "false", alvo], { encoding: "utf8" });
if (tsc.error) {
  console.log("TypeScript (tsc) não encontrado: checagem de nomes pulada.");
  process.exit(0);
}
const onde = (l) => {
  const p = partes.find((x) => l >= x.ini && l < x.ini + x.n);
  return p ? `src/${p.arq}:${l - p.ini + 1}` : `linha ${l}`;
};
const achados = [];
for (const m of (tsc.stdout + tsc.stderr).matchAll(/jogo\.js\((\d+),\d+\): error (TS2304|TS2552): Cannot find name '([^']+)'/g)) {
  if (DE_FORA.has(m[3])) continue;
  achados.push(`${onde(+m[1])}  nome desconhecido: ${m[3]}`);
}
fs.rmSync(tmp, { recursive: true, force: true });
achados.forEach((a) => console.log("  ❌ " + a));
console.log(achados.length ? `NOMES COM PROBLEMA (${achados.length})` : "NOMES OK");
process.exitCode = achados.length ? 1 : 0;
