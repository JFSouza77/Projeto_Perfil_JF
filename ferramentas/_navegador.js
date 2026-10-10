// Utilitário dos testes do C.A.O.S.: acha o Mestre mais novo e abre o Chromium headless.
"use strict";
const fs = require("fs");
const path = require("path");
const RAIZ = path.join(__dirname, "..");
function acharMestre(dado) {
  if (dado) return path.resolve(dado);
  const m = require("../versao").acharMestreMaisNovo(RAIZ); // 1.7.10: o mais novo pelo build
  if (!m) throw new Error("Nenhum Mestre encontrado. Rode antes: node montar.js");
  return m;
}
async function abrirNavegador() {
  const { chromium } = require("playwright-core");
  const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium", process.env.CHROMIUM].find(
    (f) => f && fs.existsSync(f),
  );
  return chromium.launch(exe ? { executablePath: exe } : {});
}
module.exports = { acharMestre, abrirNavegador };
