#!/usr/bin/env node
// Monta o arquivo Mestre a partir das partes em src/.
// A fonte oficial do jogo é src/. O Mestre (Perfil_JF_Mestre_X_Y_Z.html) é gerado: não edite à mão.
//
//   node montar.js     monta o Mestre e mostra o tamanho
//   node build.js      já monta o Mestre antes de gerar as saídas (não precisa rodar este antes)
//
// A montagem só junta os arquivos na ordem de src/ordem.txt, sem mudar nada.
// A versão vem do <title> de src/html/01-cabeca.html.

"use strict";
const fs = require("fs");
const path = require("path");
const { versaoDoTitulo, buildDe, nomeDoMestre } = require("./versao");

const PASTA = __dirname;
const SRC = path.join(PASTA, "src");
const ORDEM = path.join(SRC, "ordem.txt");

function temSrc() {
  return fs.existsSync(ORDEM);
}

function montar() {
  const lista = fs
    .readFileSync(ORDEM, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  // todo arquivo de src/ precisa estar na ordem (e vice-versa), pra nada ficar de fora sem querer
  const noDisco = [];
  (function varre(d) {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) varre(p);
      else if (/\.(html|css|js)$/.test(f.name)) noDisco.push(path.relative(SRC, p).split(path.sep).join("/"));
    }
  })(SRC);
  const faltam = lista.filter((f) => !noDisco.includes(f));
  const sobram = noDisco.filter((f) => !lista.includes(f));
  if (faltam.length) throw new Error("src/ordem.txt cita arquivos que não existem: " + faltam.join(", "));
  if (sobram.length) throw new Error("Arquivos em src/ que não estão em src/ordem.txt: " + sobram.join(", "));
  const html = lista.map((f) => fs.readFileSync(path.join(SRC, f), "utf8")).join("");
  // 1.7.10: o nome de exibição (do <title>) dá nome ao arquivo; o build (JOGO_BUILD) diz qual é mais nova (versao.js)
  const versao = versaoDoTitulo(html);
  if (!versao) throw new Error("Não achei a versão no <title> de src/html/01-cabeca.html.");
  if (!buildDe(html)) throw new Error("Não achei const JOGO_BUILD = <número>; em src/js/01-configuracao.js.");
  const arquivo = path.join(PASTA, nomeDoMestre(versao));
  fs.writeFileSync(arquivo, html);
  return { arquivo, versao, partes: lista.length, html };
}

module.exports = { montar, temSrc };

if (require.main === module) {
  const r = montar();
  console.log(`Mestre montado: ${path.basename(r.arquivo)} (${r.partes} partes, ${(Buffer.byteLength(r.html) / 1024).toFixed(1)} KB)`);
}
