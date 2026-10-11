// Versão do Perfil JF (1.7.10, pedido do Klaus pra Release 1.0): dois conceitos separados.
//  · NOME DE EXIBIÇÃO: o que aparece pra quem joga, no <title> ("Perfil JF · Beta 1.7.10", "Perfil JF · Release 1.0").
//    Só texto: dá nome aos arquivos (Perfil_JF_Mestre_1_7_10.html, Perfil_JF_Mestre_1_0.html) e nada compara ele.
//  · BUILD: inteiro que só cresce (const JOGO_BUILD em src/js/01-configuracao.js). É o build que diz qual
//    versão é mais nova (rede, ferramentas). Toda versão publicada sobe o build; nunca volta.
// Usado por montar.js, build.js e ferramentas/_navegador.js.
"use strict";
const fs = require("fs");
const path = require("path");

// "1.7.10" ou "1.0" (2 a 4 números) dentro do <title>
const RE_VERSAO = /\d+(?:\.\d+){1,3}/;
function versaoDoTitulo(html) {
  const t = (String(html).match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  return (t.match(RE_VERSAO) || [])[0] || null;
}
function buildDe(html) {
  const m = String(html).match(/const JOGO_BUILD = (\d+);/);
  return m ? +m[1] : null;
}
const RE_MESTRE = /^Perfil_JF_Mestre_\d+(?:_\d+){1,3}\.html$/;
const versaoDoArquivo = (f) => (path.basename(f).match(/_(\d+(?:_\d+){1,3})\.html$/) || [])[1] || null;
const nomeDoMestre = (versao) => `Perfil_JF_Mestre_${String(versao).replace(/\./g, "_")}.html`;

// O Mestre mais novo da pasta: pelo build escrito dentro dele (os nomes de exibição podem "voltar", 1.7.10 → 1.0).
// Mestre antigo, sem build, conta como build 0 e desempata pelos números do nome.
function acharMestreMaisNovo(pasta) {
  const lista = fs.readdirSync(pasta).filter((f) => RE_MESTRE.test(f));
  if (!lista.length) return null;
  const chave = (f) => {
    let b = 0;
    try {
      b = buildDe(fs.readFileSync(path.join(pasta, f), "utf8")) || 0;
    } catch (e) {}
    return { b, v: versaoDoArquivo(f).split("_").map(Number) };
  };
  const cmp = (x, y) => {
    if (x.b !== y.b) return x.b - y.b;
    for (let i = 0; i < 4; i++) if ((x.v[i] || 0) !== (y.v[i] || 0)) return (x.v[i] || 0) - (y.v[i] || 0);
    return 0;
  };
  const com = lista.map((f) => ({ f, k: chave(f) })).sort((a, b) => cmp(a.k, b.k));
  return path.join(pasta, com[com.length - 1].f);
}

module.exports = { RE_VERSAO, versaoDoTitulo, buildDe, versaoDoArquivo, nomeDoMestre, acharMestreMaisNovo };
