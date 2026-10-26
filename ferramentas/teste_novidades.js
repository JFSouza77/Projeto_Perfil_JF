#!/usr/bin/env node
// Confere o log de novidades (src/dados/07-novidades.js): todo item e todo ajuste (QoL) no formato
// "emoji Título: explicação" (título de até 34 letras, sem dois-pontos nem aspas), pra virar menu que abre ao tocar;
// e no máximo 7 itens e 7 ajustes por versão (docs/Regras_dos_Logs.md).
"use strict";
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "src", "dados", "07-novidades.js"), "utf8");
const NOVIDADES = eval(src.replace(/^[\s\S]*?const NOVIDADES = /, "(").replace(/;\s*$/, ")"));
const RE = /^(\S+\s+)?([^:<"]{2,34}):\s+([\s\S]+)$/u; // o mesmo de novItemHtml (05-tela.js)
let ruins = 0;
NOVIDADES.forEach((n) => {
  ["itens", "qol"].forEach((k) => {
    const l = n[k] || [];
    if (l.length > 7) {
      ruins++;
      console.log(`FALHOU  ${n.v}: ${l.length} ${k} (máximo 7)`);
    }
    l.forEach((x) => {
      if (!RE.test(x)) {
        ruins++;
        console.log(`FALHOU  ${n.v} (${k}) sem título: ${x.slice(0, 80)}`);
      }
    });
  });
});
console.log(ruins ? "NOVIDADES FALHOU" : `NOVIDADES OK (${NOVIDADES.length} versões)`);
process.exit(ruins ? 1 : 0);
