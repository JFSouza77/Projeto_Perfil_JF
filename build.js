#!/usr/bin/env node
// Build do Perfil JF: gera, a partir do arquivo mestre, a versão debug e a compacta.
// Desde a 1.7.5 a fonte oficial é a pasta src/: o build monta o mestre a partir dela (montar.js)
// e depois gera as saídas. Nunca edite o mestre nem as saídas à mão: edite src/ e rode de novo.
//
//   npm install                 (uma vez: instala terser, csso e acorn)
//   node build.js               usa o Perfil_JF_Mestre_X_Y_Z.html mais novo da pasta
//   node build.js --publicar    também copia a compacta normal para index.html (GitHub Pages)
//   node build.js --testar      também abre cada saída num navegador headless
//                               (precisa de playwright-core e Chromium instalados)
//
// Saídas:
//   Perfil_JF_X_Y_Z_debug.html    código legível, dados reduzidos (para depurar)
//   Perfil_JF_X_Y_Z.html          compacta normal (vai para o GitHub como index.html)
//   Perfil_JF_X_Y_Z_offline.html  compacta comprimida, para baixar e jogar sem internet
//                                 (exige Safari 16.4+, Chrome 80+ ou Firefox 113+)
// Todas levam a fonte Baloo 2 embutida (pasta fontes/), sem depender do Google Fonts.

"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const vm = require("vm");
const acorn = require("acorn");
const { minify } = require("terser");
const csso = require("csso");
const { montar, temSrc } = require("./montar");

const ARGS = new Set(process.argv.slice(2));
const PASTA = __dirname;

// Cartas que ficam na versão debug.
const CARTAS_DEBUG = ["Leão", "2005", "1950", "Smartphone", "Colher", "Internet", "Cristo Redentor", "Oa", "Pelé", "Mônica"];
// Listas de REACTIVE_VOICE que não são falas (não são reduzidas no debug).
const LISTAS_NAO_FALA = ["familiasSorteio"];

// Fonte embutida: troca os <link> do Google Fonts por @font-face com os arquivos de fontes/.
const FONTES = [
  ["baloo2-latin.woff2", "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"],
  ["baloo2-latin-ext.woff2", "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF"],
];
function embutirFonte(antes) {
  const links = /<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>\s*/g;
  if (!links.test(antes)) return antes;
  const faces = FONTES.map(([arq, faixa]) => {
    const b64 = fs.readFileSync(path.join(PASTA, "fontes", arq)).toString("base64");
    return `@font-face{font-family:"Baloo 2";font-style:normal;font-weight:400 800;font-display:swap;src:url(data:font/woff2;base64,${b64}) format("woff2");unicode-range:${faixa}}`;
  }).join("");
  let feito = false;
  return antes.replace(links, () => (feito ? "" : ((feito = true), `<style>${faces}</style>\n`)));
}

// ---------------------------------------------------------------- utilitários
const kb = (n) => (n / 1024).toFixed(1) + " KB";
const tamanho = (s) => Buffer.byteLength(s, "utf8");

function acharMestre() {
  const dado = process.argv.slice(2).find((a) => !a.startsWith("--"));
  if (dado) return path.resolve(dado);
  const versao = (f) => f.match(/_(\d+(?:_\d+){2,3})\.html$/)[1].split("_").map(Number);
  const lista = fs
    .readdirSync(PASTA)
    .filter((f) => /^Perfil_JF_Mestre_\d+(_\d+){2,3}\.html$/.test(f))
    .sort((a, b) => {
      const [x, y] = [versao(a), versao(b)];
      for (let i = 0; i < 4; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
      return 0;
    });
  if (!lista.length) throw new Error("Nenhum Perfil_JF_Mestre_X_Y_Z.html encontrado.");
  return path.join(PASTA, lista[lista.length - 1]);
}

// Separa o HTML em: antes do <style>, CSS, meio, JS, depois do </script>.
function partes(html) {
  const s0 = html.indexOf("<style>"), s1 = html.indexOf("</style>");
  const j0 = html.indexOf("<script>"), j1 = html.lastIndexOf("</script>");
  if (s0 < 0 || j0 < 0 || html.indexOf("<script>", j0 + 1) >= 0) throw new Error("O mestre deve ter um <style> e um <script>.");
  return {
    antes: html.slice(0, s0),
    css: html.slice(s0 + 7, s1),
    meio: html.slice(s1 + 8, j0),
    js: html.slice(j0 + 8, j1),
    depois: html.slice(j1 + 9),
  };
}

function parse(js) {
  return acorn.parse(js, { ecmaVersion: "latest", sourceType: "script" });
}

// Nó do inicializador de uma declaração de nível superior.
function inicializador(ast, nome) {
  for (const n of ast.body)
    if (n.type === "VariableDeclaration") for (const d of n.declarations) if (d.id.name === nome) return d.init;
  throw new Error("Não achei a declaração " + nome);
}

// Troca trechos [inicio, fim) do texto (de trás pra frente).
function aplicar(txt, edits) {
  edits.sort((a, b) => b[0] - a[0]);
  for (const [a, b, t] of edits) txt = txt.slice(0, a) + t + txt.slice(b);
  return txt;
}

// --------------------------------------------------------------- contagens
// Avalia só os dados (cartas e falas) num sandbox e conta.
function contar(js) {
  const ast = parse(js);
  const cartasIni = inicializador(ast, "ADULT_CARDS");
  const cartasSrc = js.slice(cartasIni.arguments[0].start, cartasIni.arguments[0].end);
  const rv = inicializador(ast, "REACTIVE_VOICE");
  const rvSrc = js.slice(rv.start, rv.end);
  const cartas = vm.runInNewContext("(" + cartasSrc + ")");
  const R = vm.runInNewContext("(" + rvSrc + ")");
  let grupos = 0, falas = 0;
  (function walk(o) {
    if (Array.isArray(o)) {
      grupos++;
      falas += o.length;
      return;
    }
    if (o && typeof o === "object") Object.values(o).forEach(walk);
  })(R);
  const entradas = cartas.reduce((s, c) => s + c.q.length, 0);
  const incompletas = cartas.filter((c) => c.q.length !== 20).length;
  const familias = Object.keys(R.familias || {}).length;
  return { cartas: cartas.length, entradas, incompletas, familias, grupos, falas };
}

// ------------------------------------------------------------------ debug
// Mesmo código do mestre; só os dados são reduzidos.
function gerarDebug(html, versao) {
  const p = partes(html);
  let js = p.js;
  const ast = parse(js);
  const edits = [];
  // cartas: só as da lista
  const cartas = inicializador(ast, "ADULT_CARDS").arguments[0];
  const achadas = new Set();
  const ficam = cartas.elements.filter((c) => {
    const a = c.properties.find((q) => q.key.name === "a").value.value;
    if (CARTAS_DEBUG.includes(a)) achadas.add(a);
    return CARTAS_DEBUG.includes(a);
  });
  edits.push([cartas.start, cartas.end, "[\n  " + ficam.map((c) => js.slice(c.start, c.end)).join(",\n  ") + ",\n]"]);
  const faltam = CARTAS_DEBUG.filter((a) => !achadas.has(a));
  if (faltam.length) throw new Error("Cartas do debug não encontradas no mestre: " + faltam.join(", "));
  // falas: só a primeira de cada grupo e de cada família
  (function walk(n, chave) {
    if (n.type === "ObjectExpression") return n.properties.forEach((q) => walk(q.value, q.key.name || q.key.value));
    if (n.type !== "ArrayExpression" || LISTAS_NAO_FALA.includes(chave) || n.elements.length < 2) return;
    edits.push([n.elements[0].end, n.elements[n.elements.length - 1].end, ""]);
  })(inicializador(ast, "REACTIVE_VOICE"), "");
  js = aplicar(js, edits);
  let meio = p.meio.replace(/>\d+ cartas</, `>${CARTAS_DEBUG.length} cartas<`);
  const antes = embutirFonte(p.antes).replace(/<title>([^<]*)<\/title>/, "<title>$1 (debug)</title>");
  return antes + "<style>" + p.css + "</style>" + meio + "<script>" + js + "</script>" + p.depois;
}

// --------------------------------------------------------------- compacta
async function gerarCompacta(html) {
  const p = partes(html);
  const removido = [];
  // DEBUG desligado: o terser apaga os console.* que ficam atrás dele
  if (!/\nconst DEBUG = true;/.test(p.js)) throw new Error("O mestre precisa ter 'const DEBUG = true;'.");
  const jsEntrada = p.js.replace(/\nconst DEBUG = true;/, "\nconst DEBUG = false;");
  const consoles = (p.js.match(/\bconsole\.\w+\(/g) || []).length;
  const r = await minify(jsEntrada, {
    ecma: 2020,
    toplevel: false, // NÃO renomeia nem remove globais (onclick="..." e strings dependem deles)
    compress: { passes: 2, keep_fargs: true, keep_fnames: false, toplevel: false },
    mangle: { toplevel: false }, // só variáveis locais
    format: { comments: false, ascii_only: false },
  });
  const sobrou = (r.code.match(/\bconsole\.\w+\(/g) || []).length;
  removido.push(`JS: comentários, espaços e ${consoles - sobrou} chamadas console.* de depuração; variáveis locais renomeadas`);
  const css = csso.minify(p.css, { restructure: false, comments: false }).css;
  removido.push("CSS: comentários e espaços (sem reestruturar regras)");
  const limpaHtml = (h) =>
    h
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{2,}/g, "\n");
  removido.push("HTML: comentários (inclusive o histórico do mestre) e recuos");
  const bin = zlib.deflateRawSync(Buffer.from(r.code, "utf8"), { level: 9 });
    const b64 = bin.toString("base64");
    // Carregador: descomprime e executa. Abertura assíncrona; exige DecompressionStream
    // (Safari 16.4+, Chrome 80+, Firefox 113+).
    const script =
      `<script>(async()=>{try{const b=Uint8Array.from(atob("${b64}"),c=>c.charCodeAt(0));` +
      `const t=await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();` +
      `const s=document.createElement("script");s.textContent=t;document.body.appendChild(s)}catch(e){` +
      `document.body.insertAdjacentHTML("afterbegin",'<p style="color:#fff;padding:16px">Este navegador é antigo demais para esta versão do Perfil JF (precisa de Safari 16.4 ou mais novo).</p>')}})()</script>`;
  if (zlib.inflateRawSync(bin).toString("utf8") !== r.code) throw new Error("A compressão não voltou idêntica.");
  removido.push(`Offline: JS comprimido ${kb(tamanho(r.code))} → ${kb(bin.length)} (base64 ${kb(b64.length)})`);
  removido.push("Fonte Baloo 2 embutida (sem Google Fonts)");
  const antes = limpaHtml(embutirFonte(p.antes)).trim() + "\n<style>" + css + "</style>" + limpaHtml(p.meio);
  const normal = antes + "<script>" + r.code + "</script>" + limpaHtml(p.depois);
  const offline = antes.replace(/<title>([^<]*)<\/title>/, "<title>$1 (offline)</title>") + script + limpaHtml(p.depois);
  return { html: normal, offline, js: r.code, removido };
}

// ------------------------------------------------------------- verificação
function sintaxe(html, nome) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  scripts.forEach((s, i) => {
    try {
      parse(s);
    } catch (e) {
      throw new Error(`${nome}: erro de sintaxe no script ${i + 1}: ${e.message}`);
    }
  });
  return scripts.length;
}

async function testarNavegador(arquivo) {
  let chromium;
  try {
    ({ chromium } = require("playwright-core"));
  } catch (e) {
    return "pulado (playwright-core não instalado)";
  }
  const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", process.env.CHROMIUM].find((f) => f && fs.existsSync(f));
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  page.on("pageerror", (e) => erros.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/ERR_FAILED|ERR_NAME|net::/.test(m.text()) && erros.push(m.text()));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto("file://" + arquivo);
  // a versão offline descomprime o jogo antes de rodar: espera o iniciar() existir
  await page.waitForFunction(() => typeof iniciar === "function" && !document.getElementById("goToRulesBtn").disabled, null, { timeout: 20000 });
  // o botão Jogar flutua (animação contínua); parado no teste para o clique ser "estável"
  await page.addStyleTag({ content: ".splash-go-flutua{animation:none!important}" });
  await page.waitForTimeout(800);
  let etapa = "";
  const clica = async (sel, rotulo) => {
    etapa = rotulo || sel;
    await page.locator(sel).first().click({ timeout: 8000 });
    await page.waitForTimeout(400);
  };
  const fechaModais = async () => {
    // tutorial aberto sozinho (aparelho novo: "Como se ganha" no começo da partida) → fecha
    await page.locator("#tutClose:visible").click({ timeout: 1000 }).catch(() => {});
    for (let i = 0; i < 4; i++) {
      const b = page.locator(".caos-modal-ov button:visible, #novOk:visible, #paNao:visible").first();
      if (!(await b.count())) break;
      await b.click({ timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(300);
    }
  };
  let chegou = "abrir";
  try {
    await fechaModais();
    await clica("#goToRulesBtn", "jogar");
    await fechaModais(); // aparelho novo: o C.A.O.S. sugere o tutorial (o 1º botão é "Já sei jogar")
    await clica("#btnFormatVersus", "formato");
    await clica("#fmtConfirmBtn", "formato ok");
    await clica("#modeBtnClassico", "modo");
    await clica("#modeConfirmBtn", "modo ok");
    await clica("#startGameBtn", "vamos jogar");
    await fechaModais();
    for (const nome of ["Ana", "Beto"]) {
      await page.fill("#playerNameInput", nome);
      await page.locator("#playerNameInput").dispatchEvent("input");
      // escolhe cor, emoji e zoeira até o botão Adicionar liberar
      for (let t = 0; t < 4 && (await page.locator("#addPlayerBtn:disabled").count()); t++) {
        await fechaModais();
        for (const sel of ["#colorPickerRow .color-swatch:not(.tomada)", "#avatarPickerRow .avatar-swatch:not(.tomada)", "#humorPickerRow button"]) {
          const b = page.locator(sel).nth(t);
          if (await b.count()) await b.click({ timeout: 1500, force: true }).catch(() => {});
        }
        await page.waitForTimeout(300);
      }
      await clica("#addPlayerBtn", "adicionar " + nome);
      await fechaModais();
    }
    await clica("#drawStarterBtn", "sortear quem começa");
    etapa = "começar";
    // o botão "Começar agora" some sozinho quando a contagem termina
    await page.waitForSelector("#confirmStartBtn:visible, #playAreaSection:visible", { timeout: 15000 });
    await page.locator("#confirmStartBtn:visible").click({ timeout: 2000 }).catch(() => {});
    await page.waitForSelector("#playAreaSection:visible", { timeout: 15000 });
    chegou = "partida iniciada";
    // daqui pra frente o caminho depende do sorteio: passos opcionais
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(1200);
      await fechaModais();
      const prox = page.locator("#drawBtn:visible, #flipBtn:visible, #rouletteDoneBtn:visible, .number-btn:not(.aberta):visible, #wrongBtn:visible").first();
      if (!(await prox.count())) continue;
      const id = await prox.evaluate((e) => e.id || e.className);
      await prox.click({ timeout: 3000 }).catch(() => {});
      if (/number-btn/.test(id)) chegou = "partida iniciada e dica aberta";
    }
  } catch (e) {
    erros.push(`roteiro parou em "${etapa}": ` + e.message.split("\n")[0]);
  }
  await browser.close();
  return erros.length ? "FALHOU: " + erros.join(" | ") : `ok (${chegou}, sem erro no console)`;
}

// ------------------------------------------------------------- autoria
// Registro de versões (docs/Registro_de_Versoes.md): SHA-256 dos arquivos publicados, com data e
// hora de Brasília, pra provar que uma cópia é idêntica à nossa. Republicar a mesma versão troca a linha dela.
function registrarVersao(versao, arqs) {
  const crypto = require("crypto");
  const reg = path.join(PASTA, "docs", "Registro_de_Versoes.md");
  const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
  const quando = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date());
  const v = versao.replace(/_/g, ".");
  const linha = `| ${v} | ${quando} | \`${sha(arqs.mestre)}\` | \`${sha(arqs.compacta)}\` | \`${sha(arqs.offline)}\` |`;
  let txt = fs.existsSync(reg) ? fs.readFileSync(reg, "utf8") : "";
  const re = new RegExp("^\\| " + v.replace(/\./g, "\\.") + " \\|.*$", "m");
  txt = re.test(txt) ? txt.replace(re, linha) : txt.replace(/\n*$/, "\n") + linha + "\n";
  fs.writeFileSync(reg, txt);
  console.log(`Registro de versões: ${v} (SHA-256 do mestre, da compacta e do offline) em docs/Registro_de_Versoes.md.`);
}

// ------------------------------------------------------------------ main
(async () => {
  // Com src/, o Mestre é montado antes (src/ é a fonte oficial; ver montar.js).
  const dado = process.argv.slice(2).find((a) => !a.startsWith("--"));
  let montado = null;
  if (!dado && temSrc()) {
    montado = montar();
    console.log(`Mestre montado a partir de src/ (${montado.partes} partes).`);
  }
  const mestreArq = montado ? montado.arquivo : acharMestre();
  const versao = path.basename(mestreArq).match(/(\d+(?:_\d+){2,3})\.html$/)[1];
  const mestre = fs.readFileSync(mestreArq, "utf8");
  console.log(`Mestre usado: ${path.basename(mestreArq)} (versão ${versao.replace(/_/g, ".")})`);
  // O carimbo de versão dentro do HTML (<title>) tem que bater com o nome do arquivo.
  const carimbo = (mestre.match(/<title>[^<]*?(\d+(?:\.\d+){2,3})[^<]*<\/title>/) || [])[1];
  if (carimbo !== versao.replace(/_/g, "."))
    console.warn(
      `\n⚠️  ATENÇÃO: o nome do mestre diz ${versao.replace(/_/g, ".")}, mas o <title> do HTML diz ${carimbo || "(sem versão)"}.` +
        `\n    Confira o histórico/título do mestre antes de publicar.\n`,
    );
  // A data "Atualizada em" da tela inicial tem que ser a de hoje (horário de Brasília).
  const hoje = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const dataMestre = (mestre.match(/Atualizada em (\d{2}\/\d{2}\/\d{4})/) || [])[1];
  if (dataMestre !== hoje)
    console.warn(
      `\n⚠️  ATENÇÃO: o mestre diz "Atualizada em ${dataMestre || "(sem data)"}", mas hoje (Brasília) é ${hoje}.` +
        `\n    Atualize a data na tela inicial e no histórico antes de publicar.\n`,
    );
  const saidas = {
    debug: path.join(PASTA, `Perfil_JF_${versao}_debug.html`),
    compacta: path.join(PASTA, `Perfil_JF_${versao}.html`),
    offline: path.join(PASTA, `Perfil_JF_${versao}_offline.html`),
  };

  const debug = gerarDebug(mestre, versao);
  const comp = await gerarCompacta(mestre);
  fs.writeFileSync(saidas.debug, debug);
  fs.writeFileSync(saidas.compacta, comp.html);
  fs.writeFileSync(saidas.offline, comp.offline);

  // verificação
  const linhas = [];
  const cM = contar(partes(mestre).js);
  const cD = contar(partes(debug).js);
  const cC = contar(comp.js);
  for (const [nome, h] of [["mestre", mestre], ["debug", debug], ["compacta", comp.html], ["offline", comp.offline]]) sintaxe(h, nome);
  const igual = JSON.stringify(cM) === JSON.stringify(cC);
  if (!igual) throw new Error("Contagens da compacta diferentes do mestre: " + JSON.stringify({ cM, cC }));
  if (cD.cartas !== CARTAS_DEBUG.length || cD.familias !== cM.familias) throw new Error("Debug com contagem inesperada: " + JSON.stringify(cD));
  const fmt = (c) => `${c.cartas} cartas (${c.entradas} entradas${c.incompletas ? ", " + c.incompletas + " sem 20" : ""}), ${c.familias} famílias, ${c.grupos} grupos, ${c.falas} falas`;
  linhas.push(`Mestre   ${path.basename(mestreArq).padEnd(36)} ${kb(tamanho(mestre)).padStart(10)}  ${fmt(cM)}`);
  linhas.push(`Debug    ${path.basename(saidas.debug).padEnd(36)} ${kb(tamanho(debug)).padStart(10)}  ${fmt(cD)}`);
  linhas.push(`Compacta ${path.basename(saidas.compacta).padEnd(36)} ${kb(tamanho(comp.html)).padStart(10)}  ${fmt(cC)} (igual ao mestre)`);
  linhas.push(`Offline  ${path.basename(saidas.offline).padEnd(36)} ${kb(tamanho(comp.offline)).padStart(10)}  mesmo JS da compacta, comprimido`);
  console.log("\nArquivos gerados (só desta versão; os de outras versões não são tocados):");
  for (const f of Object.values(saidas)) console.log("  " + path.basename(f));
  console.log("\nSintaxe: ok no mestre e nas três saídas.\n");
  console.log(linhas.join("\n"));
  console.log("\nRemovido na compacta:\n  - " + comp.removido.join("\n  - "));
  console.log(`\nRemovido no debug: ${cM.cartas - cD.cartas} cartas e ${cM.falas - cD.falas} falas (fica a 1ª de cada grupo/família).`);

  let falhou = false;
  if (ARGS.has("--testar")) {
    console.log("\nTeste no navegador:");
    for (const [n, f] of [["mestre", mestreArq], ["debug", saidas.debug], ["compacta", saidas.compacta], ["offline", saidas.offline]]) {
      const r = await testarNavegador(f);
      if (r.startsWith("FALHOU")) falhou = true;
      console.log(`  ${n.padEnd(9)} ${r}`);
    }
  }
  // Teste falhou: não publica (o index.html do site continua na versão anterior).
  if (ARGS.has("--publicar") && falhou) {
    console.error("\nNÃO PUBLICADO: o teste no navegador falhou. Corrija e rode de novo.");
    process.exit(1);
  }
  if (ARGS.has("--publicar")) {
    fs.copyFileSync(saidas.compacta, path.join(PASTA, "index.html"));
    console.log("\nindex.html atualizado com a compacta.");
    registrarVersao(versao, { mestre: mestreArq, compacta: saidas.compacta, offline: saidas.offline });
  }
})().catch((e) => {
  console.error("\nERRO NO BUILD: " + e.message);
  process.exit(1);
});
