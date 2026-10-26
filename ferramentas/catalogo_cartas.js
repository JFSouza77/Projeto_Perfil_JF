#!/usr/bin/env node
// Catálogo das cartas: só os nomes (sem dicas), separados por categoria e assunto, com as cartas que já estão no jogo
// e as planejadas pra 2.0. Serve pro JF (e o GPT) conferir se uma carta já existe antes de sugerir.
//
//   node ferramentas/catalogo_cartas.js     gera docs/Catalogo_de_Cartas.md e docs/Catalogo_de_Cartas.html
//
// Fontes: src/dados/02-cartas/ (no jogo), ferramentas/catalogo_assuntos.json (assunto de cada carta do jogo) e
// ferramentas/cartas_2.0_planejadas.json (planejadas). Carta do jogo sem assunto cai em "Outros" e é avisada.

"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const RAIZ = path.join(__dirname, "..");
const PASTA_CARTAS = path.join(RAIZ, "src", "dados", "02-cartas");
const ASSUNTOS = JSON.parse(fs.readFileSync(path.join(__dirname, "catalogo_assuntos.json"), "utf8"));
const PLANO = JSON.parse(fs.readFileSync(path.join(__dirname, "cartas_2.0_planejadas.json"), "utf8")).cartas;
const CATS = [
  ["ANIMAL", "🐾 Animal"],
  ["ANO", "📅 Ano"],
  ["COISA", "📦 Coisa"],
  ["LUGAR", "📍 Lugar"],
  ["PESSOA", "🧑 Pessoa"],
];
const TAG = { junior: ["jr", "🧸 Júnior"], oldschool: ["os", "📼 Old School"], hardcore: ["hc", "💀 Hardcore"] };

const chave = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function anoNum(a) {
  const m = String(a).match(/^(\d+)\s*(a\.C\.|d\.C\.)?/);
  return m ? (m[2] === "a.C." ? -1 : 1) * +m[1] : 0;
}
function periodo(n) {
  if (n < 1500) return [0, "Antes de 1500 (Antiguidade e Idade Média)"];
  if (n < 1600) return [1, "Século XVI (1500–1599)"];
  if (n < 1700) return [2, "Século XVII (1600–1699)"];
  if (n < 1800) return [3, "Século XVIII (1700–1799)"];
  if (n < 1900) return [4, "Século XIX (1800–1899)"];
  if (n < 2000) {
    const d = Math.floor(n / 10) * 10;
    return [5 + (d - 1900) / 10, `Século XX · anos ${d} (${d}–${d + 9})`];
  }
  return [20, "Século XXI (2000 em diante)"];
}

// cartas do jogo
const cartas = [];
const semAssunto = [];
fs.readdirSync(PASTA_CARTAS)
  .filter((f) => /^\d+-[a-z]+\.js$/.test(f) && !/^(00|99)-/.test(f))
  .sort()
  .forEach((f) => {
    vm.runInNewContext("[" + fs.readFileSync(path.join(PASTA_CARTAS, f), "utf8") + "]").forEach((c) => {
      const t = TAG[c.class] ? c.class : c.os ? "oldschool" : "";
      let assunto = "";
      if (c.cat !== "ANO") {
        assunto = (ASSUNTOS[c.cat] || {})[c.a];
        if (!assunto) semAssunto.push(c.cat + ": " + c.a), (assunto = "Outros");
      }
      cartas.push({ cat: c.cat, a: c.a, assunto, tag: t, nova: false });
    });
  });
// planejadas (conferindo se alguma já existe no jogo)
const noJogo = new Set(cartas.map((c) => c.cat + "|" + chave(c.a)));
const repetidas = [];
for (const [cat, lista] of Object.entries(PLANO)) {
  lista.forEach((p) => {
    if (noJogo.has(cat + "|" + chave(p.a))) return repetidas.push(cat + ": " + p.a);
    cartas.push({ cat, a: p.a, assunto: p.assunto, tag: "", nova: true, obs: p.obs || "" });
  });
}

function grupos(cat) {
  const cs = cartas.filter((c) => c.cat === cat);
  const subs = new Map();
  cs.forEach((c) => {
    const [ord, nome] = cat === "ANO" ? periodo(anoNum(c.a)) : [0, c.assunto];
    const k = ord + "|" + nome;
    if (!subs.has(k)) subs.set(k, { ord, nome, itens: [] });
    subs.get(k).itens.push(c);
  });
  const lista = [...subs.values()].sort((x, y) => x.ord - y.ord || chave(x.nome).localeCompare(chave(y.nome)));
  lista.forEach((s) => s.itens.sort((x, y) => (cat === "ANO" ? anoNum(x.a) - anoNum(y.a) : chave(x.a).localeCompare(chave(y.a)))));
  return { cs, lista };
}
const tot = (f) => cartas.filter(f).length;
const RES = CATS.map(([cat, nome]) => ({
  cat,
  nome,
  jogo: tot((c) => c.cat === cat && !c.nova),
  nova: tot((c) => c.cat === cat && c.nova),
}));
const TJ = tot((c) => !c.nova),
  TN = tot((c) => c.nova);

// ---------- Markdown (pro GPT conferir) ----------
let md = `# Catálogo de cartas do Perfil JF

Gerado pelo Code (Claude Code) em ${new Date().toISOString().slice(0, 10)} com \`node ferramentas/catalogo_cartas.js\`. Só os nomes, sem dicas.

**${TJ + TN} cartas: ${TJ} já estão no jogo e ${TN} estão planejadas pra Beta 2.0 (marcadas com 🆕).**

| Categoria | No jogo | Planejadas 🆕 | Total |
|---|---|---|---|
${RES.map((r) => `| ${r.nome} | ${r.jogo} | ${r.nova} | ${r.jogo + r.nova} |`).join("\n")}
| **Total** | **${TJ}** | **${TN}** | **${TJ + TN}** |

## Como conferir uma ideia de carta (instruções pro GPT)

1. Procure o nome **sem ligar pra acento, maiúscula ou hífen** (Pokemon = Pokémon, beija flor = Beija-flor).
2. Procure também **apelidos e outros nomes** (Robotnik = Dr. Eggman, Quico = Kiko, 4G = Internet móvel, X = Twitter).
3. Uma carta pode existir em **outra categoria** (Falcão é Animal, a ave; o jogador do futsal é outra carta, em Pessoa).
   Personagem e obra são cartas diferentes (Crash Bandicoot está em Pessoa e em Coisa, como jogo).
4. Responda com uma destas três:
   - **JÁ EXISTE** (no jogo) ou **JÁ PLANEJADA** (🆕), dizendo onde está;
   - **PARECIDA**, quando existe algo muito próximo (diga qual e se vale como carta à parte);
   - **NOVA**, com a categoria e o assunto deste catálogo em que ela entraria.
5. Junte as NOVAS numa lista pra o JF mandar pro Code. Regras do JF: quantidades terminam em 0 ou 5; tema pesado
   entra só com fatos, sem tomar partido, e nunca no Júnior.

Marcas: 🆕 planejada pra 2.0 · 🧸 Júnior (só no modo Júnior) · 📼 Old School · 💀 Hardcore · sem marca = baralho principal.
Em Ano, a ordem é cronológica; nas outras, assunto e nome em ordem alfabética.
`;
const mdNome = (c) =>
  c.a + (c.nova ? " 🆕" : "") + (c.tag ? " " + TAG[c.tag][1].split(" ")[0] : "") + (c.nova && c.obs && c.cat !== "ANO" ? ` (${c.obs})` : "") + (c.nova && c.cat === "ANO" ? ` (${c.obs})` : "");
CATS.forEach(([cat, nome]) => {
  const { cs, lista } = grupos(cat);
  md += `\n## ${nome} · ${cs.length} (${cs.filter((c) => !c.nova).length} no jogo, ${cs.filter((c) => c.nova).length} 🆕)\n`;
  lista.forEach((s) => {
    md += `\n**${s.nome}** (${s.itens.length})\n`;
    if (cat === "ANO" && s.itens.some((c) => c.nova)) md += s.itens.map((c) => "- " + mdNome(c)).join("\n") + "\n";
    else md += s.itens.map(mdNome).join(" · ") + "\n";
  });
});
fs.writeFileSync(path.join(RAIZ, "docs", "Catalogo_de_Cartas.md"), md);

// ---------- HTML (pro JF olhar) ----------
const tagHtml = (c) =>
  (c.nova ? '<span class="tg nv">🆕 2.0</span>' : "") + (c.tag ? `<span class="tg ${TAG[c.tag][0]}">${TAG[c.tag][1]}</span>` : "");
const secoes = CATS.map(([cat, nome]) => {
  const { cs, lista } = grupos(cat);
  const blocos = lista
    .map((s) => {
      const lis = s.itens
        .map((c) => `<li data-b="${esc(chave(c.a))}"${c.nova ? ' class="nv"' : ""}${c.obs ? ` title="${esc(c.obs)}"` : ""}>${esc(c.a)}${tagHtml(c)}</li>`)
        .join("");
      const nn = s.itens.filter((c) => c.nova).length;
      return `<details class="sub" open><summary>${esc(s.nome)} <span class="n">${s.itens.length}${nn ? ` · ${nn} 🆕` : ""}</span></summary><ul>${lis}</ul></details>`;
    })
    .join("");
  return `<section class="cat" id="c-${cat}"><h2>${nome} <span class="n">${cs.length} cartas · ${cs.filter((c) => c.nova).length} 🆕 · ${lista.length} assuntos</span></h2>${blocos}</section>`;
}).join("");
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cartas do Perfil JF</title>
<style>
:root{--bg:#0f1220;--card:#181c2e;--line:#2a3050;--tx:#e8eaf6;--mu:#9aa3c7;--ac:#22d3ee;--jr:#34d399;--os:#fbbf24;--hc:#f87171;--nv:#c084fc}
@media (prefers-color-scheme:light){:root{--bg:#f6f7fb;--card:#fff;--line:#dfe3f0;--tx:#1b1f33;--mu:#5b6380;--ac:#0e7490;--jr:#047857;--os:#b45309;--hc:#b91c1c;--nv:#7e22ce}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.w{max-width:1100px;margin:0 auto;padding:16px}h1{margin:8px 0 4px;font-size:1.6rem}.sub-t{color:var(--mu);margin:0 0 14px}
.top{position:sticky;top:0;z-index:2;background:var(--bg);padding:10px 0;border-bottom:1px solid var(--line)}
.res{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}.res a{color:var(--tx);text-decoration:none;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:5px 12px}
input[type=search]{width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--tx);font-size:16px}
.bt{margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}.bt button,.bt label{background:var(--card);color:var(--tx);border:1px solid var(--line);border-radius:8px;padding:6px 10px;cursor:pointer;font:inherit}
.cat{margin:22px 0}h2{font-size:1.3rem;margin:0 0 8px;scroll-margin-top:170px}.n{color:var(--mu);font-weight:400;font-size:.85rem}
.sub{background:var(--card);border:1px solid var(--line);border-radius:12px;margin:8px 0;padding:8px 12px}summary{cursor:pointer;font-weight:700}
ul{columns:3 220px;column-gap:24px;margin:8px 0 2px;padding-left:18px}li{break-inside:avoid;padding:1px 0}li.nv{color:var(--nv)}
.tg{font-size:.7rem;margin-left:6px;padding:1px 6px;border-radius:999px;border:1px solid currentColor;white-space:nowrap}.tg.jr{color:var(--jr)}.tg.os{color:var(--os)}.tg.hc{color:var(--hc)}.tg.nv{color:var(--nv)}
.leg{color:var(--mu);font-size:.85rem;margin-top:6px}.vazio{display:none}
</style></head><body><div class="w">
<h1>🃏 Cartas do Perfil JF</h1><p class="sub-t">${TJ + TN} cartas, só os nomes (sem dicas): ${TJ} no jogo e ${TN} planejadas pra Beta 2.0. Em Ano, ordem cronológica.</p>
<div class="top"><div class="res">${RES.map((r) => `<a href="#c-${r.cat}">${r.nome} <b>${r.jogo + r.nova}</b></a>`).join("")}</div><input id="q" type="search" placeholder="Procurar uma carta (ex.: Batman, 1969, Pantanal)…" aria-label="Procurar uma carta">
<div class="bt"><button type="button" id="abrir">Abrir tudo</button><button type="button" id="fechar">Fechar tudo</button><label><input type="checkbox" id="sonv"> Só as 🆕 da 2.0</label></div>
<div class="leg">Marcas: <span class="tg nv">🆕 2.0</span> planejada, ainda sem dicas · <span class="tg jr">🧸 Júnior</span> só no Júnior · <span class="tg os">📼 Old School</span> · <span class="tg hc">💀 Hardcore</span> · sem marca = baralho principal.</div></div>
${secoes}
</div><script>
const sem=(s)=>s.normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase();
const q=document.getElementById("q"),nv=document.getElementById("sonv");
function filtrar(){const t=sem(q.value.trim()),so=nv.checked;document.querySelectorAll(".sub").forEach((d)=>{let n=0;d.querySelectorAll("li").forEach((li)=>{const ok=(!t||li.dataset.b.includes(t))&&(!so||li.classList.contains("nv"));li.style.display=ok?"":"none";if(ok)n++;});d.classList.toggle("vazio",!n);if(t||so)d.open=true;});document.querySelectorAll(".cat").forEach((c)=>c.classList.toggle("vazio",!c.querySelector(".sub:not(.vazio)")));}
q.addEventListener("input",filtrar);nv.addEventListener("change",filtrar);
document.getElementById("abrir").onclick=()=>document.querySelectorAll(".sub").forEach((d)=>(d.open=true));
document.getElementById("fechar").onclick=()=>document.querySelectorAll(".sub").forEach((d)=>(d.open=false));
</script></body></html>`;
fs.writeFileSync(path.join(RAIZ, "docs", "Catalogo_de_Cartas.html"), html);

console.log(`Catálogo: ${TJ} no jogo + ${TN} planejadas = ${TJ + TN}`);
RES.forEach((r) => console.log(`  ${r.cat}: ${r.jogo} + ${r.nova}`));
if (semAssunto.length) console.log("Sem assunto (caiu em Outros): " + semAssunto.join("; "));
if (repetidas.length) console.log("ATENÇÃO, planejadas que já existem no jogo: " + repetidas.join("; "));
