#!/usr/bin/env node
// Limpeza das versões antigas (pedido do JF, 15/10/2026): deixa no depósito só as 3 versões mais novas do jogo
// (normal + offline) como reserva de segurança; as outras saem da pasta. Nada se perde: continuam no histórico
// do Git e no acervo do Drive (rode antes "node ferramentas/limpar_versoes.js --acervo" e suba o pacote no Drive).
//   node ferramentas/limpar_versoes.js            → mostra o que sairia (não apaga nada)
//   node ferramentas/limpar_versoes.js --apagar   → tira do Git (git rm) as versões além das 3 mais novas
//   node ferramentas/limpar_versoes.js --acervo DIR → monta em DIR o zip com TODAS as versões do histórico + o
//                                                   bundle do Git + SHA256 + LEIA-ME (pra guardar no Drive)
//   --manter=N muda o número de versões guardadas (padrão 3)
"use strict";
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const RAIZ = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const MANTER = +((args.find((a) => a.startsWith("--manter=")) || "").slice(9)) || 3;
const sh = (c, o) => execSync(c, { cwd: RAIZ, encoding: "utf8", maxBuffer: 1 << 28, ...(o || {}) });
const RE = /^Perfil_JF_(\d+(?:_\d+)*)(_offline|_debug)?\.html$/;
const chave = (v) => v.split("_").map(Number);
const cmp = (a, b) => {
  const x = chave(a), y = chave(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
  return 0;
};
const rastreados = sh("git ls-files").split("\n").filter(Boolean);
const daRaiz = rastreados.filter((f) => !f.includes("/") && RE.test(f));
const antigas = rastreados.filter((f) => f.startsWith("versoes_antigas/"));
const versoes = [...new Set(daRaiz.map((f) => f.match(RE)[1]))].sort(cmp);
const ficam = new Set(versoes.slice(-MANTER));
const saem = daRaiz.filter((f) => !ficam.has(f.match(RE)[1])).concat(antigas);

if (args[0] === "--acervo") {
  const dir = path.resolve(args[1] || "acervo");
  const pasta = path.join(dir, "Perfil_JF_versoes");
  fs.mkdirSync(pasta, { recursive: true });
  const hoje = sh("TZ=America/Sao_Paulo date +%Y-%m-%d").trim();
  // toda versão que já passou pelo Git (inclusive as que já foram limpas), na última forma que teve
  const todas = sh("git log --all --name-only --format=").split("\n").filter((f) => RE.test(path.basename(f)));
  const vistos = new Set();
  todas.forEach((f) => {
    const nome = path.basename(f);
    if (vistos.has(nome)) return;
    try {
      // na pasta: o arquivo de agora; já limpo: o conteúdo de antes do commit que tirou ele
      let conteudo;
      if (fs.existsSync(path.join(RAIZ, f))) conteudo = fs.readFileSync(path.join(RAIZ, f));
      else {
        const ultimo = sh(`git log --all -1 --format=%H -- "${f}"`).trim();
        const ler = (ref) => execSync(`git show ${ref}:"${f}"`, { cwd: RAIZ, maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] });
        try {
          conteudo = ler(ultimo); // o último commit ainda tem o arquivo
        } catch (e) {
          conteudo = ler(ultimo + "^"); // o último commit foi o que tirou: pega de antes
        }
      }
      fs.writeFileSync(path.join(pasta, nome), conteudo);
      vistos.add(nome);
    } catch (e) {}
  });
  fs.copyFileSync(path.join(RAIZ, "AUTORIA.md"), path.join(pasta, "AUTORIA.md"));
  sh(`cd "${pasta}" && sha256sum * > SHA256_versoes.txt`);
  const zip = path.join(dir, `Perfil_JF_acervo_versoes_${hoje}.zip`);
  const bundle = path.join(dir, `Perfil_JF_historico_completo_${hoje}.bundle`);
  sh(`cd "${dir}" && rm -f "${zip}" && zip -q -9 -r "${zip}" Perfil_JF_versoes`);
  sh(`git bundle create "${bundle}" --all`, { stdio: ["ignore", "pipe", "ignore"] });
  const h = (f) => sh(`sha256sum "${f}"`).split(" ")[0];
  fs.writeFileSync(
    path.join(dir, "LEIA-ME_Acervo_Perfil_JF.txt"),
    `ACERVO DO PERFIL JF — cópia de segurança de ${hoje}\nAutor e dono do projeto: JF (JFSouza77 no GitHub). Ver AUTORIA.md.\n\n` +
      `1) ${path.basename(zip)}: todas as versões do jogo (${vistos.size} arquivos). Abra qualquer .html no navegador.\n` +
      `   SHA256_versoes.txt = a impressão digital de cada arquivo.\n` +
      `2) ${path.basename(bundle)}: o histórico inteiro do Git (${sh("git rev-list --all --count").trim()} registros), com data, hora e autor.\n` +
      `   Pra abrir num computador com Git:  git clone ${path.basename(bundle)} Projeto_Perfil_JF\n\n` +
      `Último registro: ${sh("git log -1 --format='%h · %ad · %s' --date=format:'%d/%m/%Y %H:%M'").trim()}\n` +
      `SHA256 do bundle: ${h(bundle)}\nSHA256 do zip:    ${h(zip)}\n`,
  );
  console.log(`Acervo pronto em ${dir}: ${vistos.size} versões, zip e bundle.`);
  process.exit(0);
}

console.log(`Versões no depósito: ${versoes.length}. Ficam as ${MANTER} mais novas: ${[...ficam].join(", ")}`);
console.log(`Saem ${saem.length} arquivos (${saem.length - antigas.length} da raiz e ${antigas.length} de versoes_antigas).`);
if (args[0] !== "--apagar") {
  saem.forEach((f) => console.log("  sairia: " + f));
  console.log("Nada foi apagado. Use --apagar pra tirar do Git.");
  process.exit(0);
}
for (let i = 0; i < saem.length; i += 100) sh("git rm -q -- " + saem.slice(i, i + 100).map((f) => `"${f}"`).join(" "));
// os _debug não vão pro Git (gitignore), mas também acumulam na pasta: limpa os de versões antigas
fs.readdirSync(RAIZ).forEach((f) => {
  const m = f.match(RE);
  if (m && m[2] === "_debug" && !ficam.has(m[1])) fs.unlinkSync(path.join(RAIZ, f));
});
console.log(`Limpeza feita: ${saem.length} arquivos saíram. Confira com "git status" e faça o commit.`);
