// Utilitário dos testes do C.A.O.S.: acha o Mestre mais novo e abre o Chromium headless.
"use strict";
const fs = require("fs");
const path = require("path");
const RAIZ = path.join(__dirname, "..");
function acharMestre(dado) {
  if (dado) return path.resolve(dado);
  const v = (f) => f.match(/_(\d+(?:_\d+){2,3})\.html$/)[1].split("_").map(Number);
  const l = fs
    .readdirSync(RAIZ)
    .filter((f) => /^Perfil_JF_Mestre_\d+(_\d+){2,3}\.html$/.test(f))
    .sort((a, b) => {
      const [x, y] = [v(a), v(b)];
      for (let i = 0; i < 4; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
      return 0;
    });
  if (!l.length) throw new Error("Nenhum Mestre encontrado. Rode antes: node montar.js");
  return path.join(RAIZ, l[l.length - 1]);
}
async function abrirNavegador() {
  const { chromium } = require("playwright-core");
  const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium", process.env.CHROMIUM].find(
    (f) => f && fs.existsSync(f),
  );
  return chromium.launch(exe ? { executablePath: exe } : {});
}
module.exports = { acharMestre, abrirNavegador };
