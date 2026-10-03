#!/usr/bin/env node
// Auditoria das falas do C.A.O.S. (só reporta, não muda nada). Lê o Mestre mais novo.
//   node ferramentas/caos_auditar_falas.js [--tudo] [mestre.html]
// Confere nas falas prontas (REACTIVE_VOICE) e nos pedaços dos geradores (CAOS_GERADORES):
//   chave {x} desconhecida, espaço duplo, espaço antes de pontuação, fala sem pontuação final,
//   fala longa (> 170 letras), fala repetida em listas diferentes e termos que o Júnior bloqueia
//   em listas de Júnior/família.
"use strict";
const fs = require("fs");
const vm = require("vm");
const acorn = require("acorn");
const { acharMestre } = require("./_navegador");
const ARGS = process.argv.slice(2);
const html = fs.readFileSync(acharMestre(ARGS.find((a) => !a.startsWith("--"))), "utf8");
const js = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));
const ast = acorn.parse(js, { ecmaVersion: "latest" });
const fonte = (nome) => {
  for (const n of ast.body)
    if (n.type === "VariableDeclaration" && n.declarations[0].id.name === nome) {
      const i = n.declarations[0].init;
      return js.slice(i.start, i.end);
    }
  return null;
};
const ctx = { CAOS_PREFIXO: "[C.A.O.S.] " };
const RV = vm.runInNewContext("(" + fonte("REACTIVE_VOICE") + ")", ctx);
const JR = vm.runInNewContext("(" + fonte("CAOS_JUNIOR_BLOCK_RE") + ")", ctx);
const ini = js.indexOf("const CAOS_GERADORES = {};");
const fim = js.indexOf("\nfunction ", ini);
vm.runInNewContext(js.slice(ini, fim).replace("const CAOS_GERADORES", "var CAOS_GERADORES"), ctx);
const VARS_GER = new Set("nome anne jf pedro isabel outro hora dia modo modoAntes qtd tempo quando partidas vitorias chute anos dicasTxt cat quemAntes lider min pausa".split(" "));
const itens = [];
(function w(o, p) {
  if (Array.isArray(o)) return p === "familiasSorteio" ? null : o.forEach((x) => typeof x === "string" && itens.push({ onde: p, t: x, ger: false }));
  if (o && typeof o === "object") Object.keys(o).forEach((k) => w(o[k], p ? p + "." + k : k));
})(RV, "");
for (const [g, def] of Object.entries(ctx.CAOS_GERADORES))
  for (const [slot, baldes] of Object.entries(def)) {
    if (slot === "moldes") continue;
    for (const [b, lista] of Object.entries(baldes)) lista.forEach((t) => itens.push({ onde: `gerador.${g}.${slot}.${b}`, t, ger: true }));
  }
const apont = {};
const add = (tipo, it, msg) => (apont[tipo] = apont[tipo] || []).push(`${it.onde}: ${msg || it.t}`);
const vistos = new Map();
for (const it of itens) {
  const t = it.t;
  (t.match(/\{(\w+)\}/g) || []).forEach((m) => {
    const k = m.slice(1, -1);
    if (it.ger ? !VARS_GER.has(k) : k !== "nome") add("chave desconhecida", it, `${m} em "${t}"`);
  });
  if (/ {2,}/.test(t)) add("espaço duplo", it);
  if (/ [,.!?;:](?!\.)/.test(t) && !/ \.\.\./.test(t)) add("espaço antes de pontuação", it);
  const sem = t.replace(/\[C\.A\.O\.S\.\]\s*/, "").trim();
  if (sem && !/[.!?…)"”»:♪♫✨💢👀👏👍♡🙂😎👑🎉🔥]$|[\u{1F300}-\u{1FAFF}]$/u.test(sem)) add("sem pontuação final", it);
  if (sem.length > 170) add("longa (> 170 letras)", it, `${sem.length} letras: "${sem.slice(0, 80)}…"`);
  // listas do Júnior / Family friendly / iniciante / Suave (familias.* são as "famílias" de falas, não o modo família)
  if (/(^|\.)(familia|iniciante|junior)(\.|$)|suave/i.test(it.onde) && JR.test(t)) add("termo bloqueado no Júnior", it);
  const k = sem.toLowerCase();
  if (!it.ger && sem.length > 25) {
    if (vistos.has(k) && vistos.get(k) !== it.onde) add("repetida em outra lista", it, `"${sem.slice(0, 70)}" (também em ${vistos.get(k)})`);
    else vistos.set(k, it.onde);
  }
}
console.log(`Falas prontas: ${itens.filter((x) => !x.ger).length} · pedaços de gerador: ${itens.filter((x) => x.ger).length}`);
const tipos = Object.keys(apont);
if (!tipos.length) console.log("Nenhum apontamento.");
for (const tp of tipos) {
  console.log(`${tp}: ${apont[tp].length}`);
  apont[tp].slice(0, ARGS.includes("--tudo") ? 1e9 : 6).forEach((x) => console.log("   " + x.slice(0, 200)));
}
