#!/usr/bin/env node
// Compara dois Mestres para provar que uma reorganização não mudou o jogo (só reporta).
//   node ferramentas/comparar_mestres.js antigo.html novo.html
// Diz se os arquivos são idênticos byte a byte e, se não forem, se a única diferença é a ordem
// das cartas em ADULT_CARDS (mesmo conjunto, mesmo texto, mesma ordem dentro de cada categoria).
"use strict";
const fs = require("fs");
const acorn = require("acorn");
const [fa, fb] = process.argv.slice(2);
if (!fa || !fb) {
  console.log("uso: node ferramentas/comparar_mestres.js antigo.html novo.html");
  process.exit(2);
}
const [a, b] = [fa, fb].map((f) => fs.readFileSync(f, "utf8"));
function separar(h) {
  const j0 = h.indexOf("<script>") + 8, j1 = h.lastIndexOf("</script>");
  const js = h.slice(j0, j1);
  let arr;
  for (const n of acorn.parse(js, { ecmaVersion: "latest" }).body)
    if (n.type === "VariableDeclaration" && n.declarations[0].id.name === "ADULT_CARDS") arr = n.declarations[0].init.arguments[0];
  const cartas = arr.elements.map((e) => js.slice(e.start, e.end));
  return { cartas, resto: h.slice(0, j0) + js.slice(0, arr.start) + "<<CARTAS>>" + js.slice(arr.end) + h.slice(j1) };
}
if (a === b) {
  console.log("Idênticos byte a byte.");
  process.exit(0);
}
const A = separar(a), B = separar(b);
const cat = (c) => (c.match(/cat: "(\w+)"/) || [])[1];
const porCat = (l) => JSON.stringify([...new Set(l.map(cat))].sort().map((k) => l.filter((c) => cat(c) === k)));
const restoIgual = A.resto === B.resto;
const mesmoConjunto = JSON.stringify([...A.cartas].sort()) === JSON.stringify([...B.cartas].sort());
const ordemCat = porCat(A.cartas) === porCat(B.cartas);
console.log(`Fora as cartas, o texto é idêntico: ${restoIgual ? "sim" : "NÃO"}`);
console.log(`Cartas: ${A.cartas.length} → ${B.cartas.length}; mesmo conjunto e texto: ${mesmoConjunto ? "sim" : "NÃO"}; mesma ordem dentro de cada categoria: ${ordemCat ? "sim" : "NÃO"}`);
if (!restoIgual) {
  let i = 0;
  while (A.resto[i] === B.resto[i]) i++;
  const linha = A.resto.slice(0, i).split("\n").length;
  console.log(`Primeira diferença perto da linha ${linha} (contando sem as cartas):`);
  console.log("  antigo: " + JSON.stringify(A.resto.slice(Math.max(0, i - 40), i + 80)));
  console.log("  novo:   " + JSON.stringify(B.resto.slice(Math.max(0, i - 40), i + 80)));
}
process.exit(restoIgual && mesmoConjunto && ordemCat ? 0 : 1);
