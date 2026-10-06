#!/usr/bin/env node
// Auditoria das cartas (só reporta: não corrige nada). Lê as cartas de src/dados/02-cartas/.
//
//   node ferramentas/auditar_cartas.js            resumo por tipo de apontamento
//   node ferramentas/auditar_cartas.js --tudo     lista cada apontamento
//   node ferramentas/auditar_cartas.js --json X   grava os apontamentos em X
//
// Regras conferidas (ver docs/Publico_dos_Modos.md e as regras de criação de cartas):
//   ERRO   20 entradas; no máximo 4 especiais; nunca 3 especiais seguidas; especial conhecida;
//          resposta repetida; total de cartas múltiplo de 5; Júnior sem carta de ANO;
//          contas das cartas de ANO (soma, par/ímpar, bissexto, divisível, romanos, Copa, Olimpíada);
//          vício "quatro dígitos" / "calendário gregoriano" em ANO.
//   AVISO  vazamento (dica com a resposta ou parte dela); eco (duas dicas muito parecidas);
//          dica que começa remetendo a outra; frase genérica; mais de 3 dicas de conta em ANO.
//   Avisos são pistas pra uma pessoa conferir; nem todo aviso é erro.

"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PASTA_CARTAS = path.join(__dirname, "..", "src", "dados", "02-cartas");
const ARGS = process.argv.slice(2);

function lerCartas() {
  const arqs = fs.readdirSync(PASTA_CARTAS).filter((f) => /^\d+-[a-z]+\.js$/.test(f) && !/^(00|99)-/.test(f)).sort();
  const cartas = [];
  for (const f of arqs) {
    const lista = vm.runInNewContext("[" + fs.readFileSync(path.join(PASTA_CARTAS, f), "utf8") + "]");
    lista.forEach((c) => cartas.push(Object.assign(c, { _arq: f })));
  }
  return cartas;
}

function lerRespostasAntigas() {
  const txt = fs.readFileSync(path.join(PASTA_CARTAS, "99-fechamento.js"), "utf8");
  const m = txt.match(/const CARTAS_RESPOSTA_ANTIGA = (\{[\s\S]*?\});/);
  return m ? vm.runInNewContext("(" + m[1] + ")") : {};
}

const ESPECIAIS = [
  "perca sua vez", "um palpite a qualquer hora", "avance 1 casa", "avance 2 casas", "volte 2 casas", "volte 3 casas",
  "escolha um jogador para voltar 2 casas", "escolha um jogador para avançar 2 casas",
];
const norm = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const STOP = new Set(
  ("a o as os um uma uns umas de do da dos das e em no na nos nas por para pra com sem que se sou fui foi era ser sao meu minha meus " +
    "minhas seu sua seus suas ao aos mais muito como quando onde qual quem ja nao sim tambem eu me mim isso esse essa este esta ele ela " +
    "eles elas lhe tem ter tenho tive vez vezes ate entre sobre apos antes depois so mas ou nem cada todo toda todos todas outro outra ano " +
    "anos mundo primeiro primeira grande grandes famoso famosa conhecido conhecida considerado considerada pelo pela pelos pelas num numa " +
    "sendo sido estou estava estao the of and la le el lo los del des").split(" "),
);
const toks = (t) => norm(t).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
const GENERICAS = new Set(
  ("torre chuva esponja deserto rio monte ilha lago praia cidade castelo ponte parque museu estadio igreja catedral palacio praca estatua " +
    "templo muralha mar oceano serra vale pico cristo santo santa sao dom rei rainha principe princesa capitao doutor senhor dona jogo filme banda").split(" "),
);
const VICIO = [
  /programas? de perguntas/, /curiosidades/, /provas? de (geografia|historia)/, /viraliz/, /bem especific/, /muito lembrad/,
  /todo mundo conhece/, /faco parte da cultura/, /sou muito famos/, /sou bastante conhecid/, /muita gente (ja )?(ouviu|conhece)/,
];
const romano = (n) => {
  let s = "";
  for (const [v, r] of [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]])
    while (n >= v) (s += r), (n -= v);
  return s;
};
const bissexto = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const anoDeCopa = (y) => y >= 1930 && y % 4 === 2 && y !== 1942 && y !== 1946;
const anoDeOlimpiada = (y) => (y >= 1896 && y % 4 === 0 && ![1916, 1940, 1944, 2020].includes(y)) || y === 2021;
const NUM = { um: 1, dois: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10 };
const CONTA = /digitos|bissexto|par\b|impar|divisivel|multiplo|romanos|decada termina|da minha decada|anos? de distancia/;

function auditar(cartas) {
  const erros = [], avisos = [];
  const nome = (c) => `${c.cat} · ${c.a}${c.class ? " [" + c.class + "]" : ""}${c.os ? " {os}" : ""}${c.xh ? " {xh}" : ""}`;
  const erro = (c, tipo, msg) => erros.push({ carta: nome(c), tipo, msg });
  const aviso = (c, tipo, msg) => avisos.push({ carta: nome(c), tipo, msg });

  if (cartas.length % 5) erros.push({ carta: "(baralho)", tipo: "total", msg: `${cartas.length} cartas: o total tem que ser múltiplo de 5` });
  const respostas = new Map();
  cartas.forEach((c) => respostas.set(norm(c.a), (respostas.get(norm(c.a)) || 0) + 1));
  respostas.forEach((n, a) => n > 1 && erros.push({ carta: a, tipo: "repetida", msg: `resposta aparece em ${n} cartas` }));
  // id fixo (1.7.7.2): CATEGORIA-0001, único, com o prefixo da categoria da carta
  const ids = new Map();
  cartas.forEach((c) => {
    if (typeof c.id !== "string" || !/^[A-Z]+-\d{4}$/.test(c.id)) erro(c, "id", `id ausente ou fora do formato CATEGORIA-0001: ${c.id}`);
    else if (c.id.split("-")[0] !== c.cat) erro(c, "id", `id ${c.id} não é da categoria ${c.cat}`);
    if (c.id) ids.set(c.id, (ids.get(c.id) || 0) + 1);
  });
  ids.forEach((n, id) => n > 1 && erros.push({ carta: id, tipo: "id", msg: `id aparece em ${n} cartas` }));
  // mapa de respostas antigas: cada id tem que existir, e a resposta antiga não pode ser resposta atual
  const antigas = lerRespostasAntigas();
  const atuais = new Set(cartas.map((c) => c.a));
  Object.keys(antigas).forEach((r) => {
    if (!ids.has(antigas[r])) erros.push({ carta: r, tipo: "id", msg: `resposta antiga aponta pra id que não existe: ${antigas[r]}` });
    if (atuais.has(r)) erros.push({ carta: r, tipo: "id", msg: "resposta antiga ainda é resposta de uma carta" });
  });

  for (const c of cartas) {
    const q = c.q || [];
    if (q.length !== 20) erro(c, "estrutura", `${q.length} entradas (são 20)`);
    const esp = q.map((t) => t[0] === "*");
    const nEsp = esp.filter(Boolean).length;
    if (nEsp > 4) erro(c, "estrutura", `${nEsp} especiais (máximo 4)`);
    for (let i = 0; i + 2 < q.length; i++)
      if (esp[i] && esp[i + 1] && esp[i + 2]) {
        erro(c, "estrutura", `3 especiais seguidas (posições ${i + 1} a ${i + 3})`);
        break;
      }
    q.forEach((t) => t[0] === "*" && !ESPECIAIS.includes(t.slice(1).trim().toLowerCase()) && erro(c, "estrutura", `especial desconhecida: ${t}`));
    if (c.cat === "ANO" && c.class === "junior") erro(c, "junior", "Júnior não tem carta de ANO");

    const dicas = q.map((t, i) => [t, i + 1]).filter(([t]) => t[0] !== "*");
    // vazamento
    const resp = norm(c.a).replace(/[^a-z0-9 ]/g, " ").trim();
    const partes = toks(c.a).filter((w) => !GENERICAS.has(w) && w.length >= 4);
    for (const [t, i] of dicas) {
      const n = " " + norm(t).replace(/[^a-z0-9 ]/g, " ") + " ";
      if (c.cat === "ANO") {
        if (n.includes(" " + resp + " ")) aviso(c, "vazamento", `#${i} diz o ano: "${t}"`);
        continue;
      }
      if (resp.length >= 3 && n.includes(" " + resp + " ")) aviso(c, "vazamento", `#${i} tem a resposta inteira: "${t}"`);
      else {
        const hit = partes.filter((w) => n.includes(" " + w + " "));
        if (hit.length) aviso(c, "vazamento", `#${i} tem parte da resposta (${hit.join(", ")}): "${t}"`);
      }
    }
    // dica que depende de outra
    for (const [t, i] of dicas) {
      const n = norm(t);
      if (/^(esse|essa|esses|essas|este|esta|estes|estas|isso|isto|nesse|nessa|desse|dessa|ele|ela|eles|elas|la|ali)\b/.test(n) && !(c.cat === "ANO" && /^(esse|nesse|neste) (mesmo )?(ano|periodo)/.test(n)))
        aviso(c, "dependencia", `#${i} começa remetendo a outra dica: "${t}"`);
    }
    for (const [t, i] of dicas) if (VICIO.some((r) => r.test(norm(t)))) aviso(c, "generica", `#${i}: "${t}"`);
    // eco
    const tk = dicas.map(([t, i]) => [new Set(toks(t)), t, i]);
    for (let x = 0; x < tk.length; x++)
      for (let y = x + 1; y < tk.length; y++) {
        const A = tk[x][0], B = tk[y][0];
        if (A.size < 3 || B.size < 3) continue;
        let inter = 0;
        A.forEach((w) => B.has(w) && inter++);
        const j = inter / (A.size + B.size - inter);
        if (j >= 0.45) aviso(c, "eco", `#${tk[x][2]} e #${tk[y][2]} (${Math.round(j * 100)}%): "${tk[x][1]}" | "${tk[y][1]}"`);
      }
    // contas do ANO
    if (c.cat === "ANO" && /^\d{3,4}$/.test(c.a)) {
      const y = parseInt(c.a, 10);
      let contas = 0;
      for (const [t, i] of dicas) {
        const T = norm(t);
        const ruim = (m) => erro(c, "ano", `#${i} ${m}: "${t}"`);
        let m;
        if (CONTA.test(T)) contas++;
        if ((m = T.match(/digitos somam(?: exatamente)? (\d+)/))) {
          const s = String(y).split("").reduce((a, b) => a + +b, 0);
          if (s !== +m[1]) ruim(`a soma é ${s}`);
        }
        if (/\b(sou|um numero) (um numero )?par\b|sou par\b/.test(T) && y % 2) ruim("o ano é ímpar");
        if (/impar/.test(T) && !/nao sou impar/.test(T) && y % 2 === 0) ruim("o ano é par");
        if (/nao (fui|sou) (um )?ano bissexto/.test(T)) {
          if (bissexto(y)) ruim("o ano é bissexto");
        } else if (/bissexto/.test(T) && !/nao/.test(T) && !bissexto(y)) ruim("o ano não é bissexto");
        if ((m = T.match(/romanos, tenho (\d+|\w+) letras/))) {
          const n = +m[1] || NUM[m[1]];
          if (romano(y).length !== n) ruim(`em romanos é ${romano(y)}`);
        }
        if ((m = T.match(/divisivel por (\d+)/)) && !/nao/.test(T) && y % +m[1]) ruim(`não é divisível por ${m[1]}`);
        if ((m = T.match(/multiplo de (\d+)/)) && !/nao/.test(T) && y % +m[1]) ruim(`não é múltiplo de ${m[1]}`);
        if ((m = T.match(/minha decada termina no ano (\d+)/)) && !(y <= +m[1] && +m[1] - y < 10)) ruim("década errada");
        if (/nao sou ano de copa/.test(T) && anoDeCopa(y)) ruim("é ano de Copa");
        if (/(nao (sou|fui)|nem) (ano )?de olimp/.test(T) && anoDeOlimpiada(y)) ruim("é ano de Olimpíada");
        if (/sou ano de olimp/.test(T) && !/nao/.test(T) && !anoDeOlimpiada(y)) ruim("não é ano de Olimpíada");
        if ((m = T.match(/estou a (\d+) anos? de distancia de (\d+)/)) && Math.abs(y - +m[2]) !== +m[1]) ruim("distância errada");
        if (/quatro digitos|calendario gregoriano/.test(T)) ruim("vício (proibido em ANO)");
      }
      if (contas > 3) aviso(c, "ano", `${contas} dicas de conta (máximo 3)`);
    }
  }
  return { erros, avisos };
}

const cartas = lerCartas();
const { erros, avisos } = auditar(cartas);
const porCat = {};
cartas.forEach((c) => (porCat[c.cat] = (porCat[c.cat] || 0) + 1));
console.log(`${cartas.length} cartas · ` + Object.entries(porCat).map(([k, v]) => `${k} ${v}`).join(" · "));
const resumo = (lista) => {
  const t = {};
  lista.forEach((x) => (t[x.tipo] = (t[x.tipo] || 0) + 1));
  return Object.entries(t).map(([k, v]) => `${k} ${v}`).join(", ") || "nenhum";
};
console.log(`Erros:  ${erros.length} (${resumo(erros)})`);
console.log(`Avisos: ${avisos.length} (${resumo(avisos)}) — pistas pra conferir, nem todo aviso é erro`);
if (ARGS.includes("--tudo") || erros.length) {
  for (const x of erros) console.log(`  ERRO  [${x.tipo}] ${x.carta}: ${x.msg}`);
  if (ARGS.includes("--tudo")) for (const x of avisos) console.log(`  aviso [${x.tipo}] ${x.carta}: ${x.msg}`);
}
const j = ARGS.indexOf("--json");
if (j >= 0 && ARGS[j + 1]) fs.writeFileSync(ARGS[j + 1], JSON.stringify({ erros, avisos }, null, 1));
process.exitCode = erros.length ? 1 : 0;
