#!/usr/bin/env node
// Kit de dissecação do C.A.O.S. (pedido do JF, 05/11/2026): gera a parte técnica do kit em docs/CAOS_Anatomia/,
// pra o Code de outro projeto (o Wally, da Carteira) ler direto, sem interpretar texto:
//   · caos_manifesto.json   órgãos → arquivos → funções (com linha e a 1ª linha de comentário), bancos de fala e
//                           geradores com as contagens, constantes de configuração e versão do C.A.O.S.;
//   · 08_Amostras_de_Falas.md  uma amostra de cada banco e de cada gerador.
// Rode depois de mexer no C.A.O.S. (o teste de sempre não depende disso):  node ferramentas/caos_anatomia.js
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const RAIZ = path.resolve(__dirname, "..");
const SAIDA = path.join(RAIZ, "docs", "CAOS_Anatomia");
const ler = (f) => fs.readFileSync(path.join(RAIZ, f), "utf8");

// Órgãos do C.A.O.S. e os arquivos de cada um (a ordem é a da remontagem sugerida no 00_LEIA-ME)
const ORGAOS = [
  { id: "espinha", nome: "Espinha (as 3 leis)", generico: true, arquivos: ["src/js/07-caos/11-espinha.js"] },
  { id: "nucleo", nome: "Núcleo: funil de falas, escolha sem repetir, filtros e humor de voz", generico: true, arquivos: ["src/js/07-caos/01-nucleo-e-falas.js", "src/js/07-caos/08-hall-janelas-e-pausa.js"] },
  { id: "cerebro", nome: "Cérebro: console de emoções, vetor (tensão, calor, paciência), temperamento e rostos", generico: true, arquivos: ["src/js/07-caos/05-emocoes-e-rede-neural.js", "src/dados/01-emocoes-do-caos.js", "src/dados/04-lexico-e-emocoes.js"] },
  { id: "gerador", nome: "Coluna da fala: gerador de falas por gatilho e léxico", generico: true, arquivos: ["src/js/07-caos/10-gerador-de-falas.js", "src/js/07-caos/04-lexico-e-relogio.js"] },
  { id: "tato", nome: "Tato: aprende o tamanho de fala que a mesa aguenta", generico: true, arquivos: ["src/js/07-caos/14-tato.js"] },
  { id: "memoria", nome: "Memória: nomes, fichas, recordes, mesa e vínculos (favorito, desafeto, silêncio)", generico: true, arquivos: ["src/js/07-caos/03-memoria-e-mesa.js", "src/js/07-caos/09-vinculos-silencio-e-balao.js", "src/js/07-caos/17-afeto-da-ficha.js", "src/js/05t-contas.js"] },
  { id: "humanizacao", nome: "Humanização: 👍/👎, \"não curti\", segurar a fala, respostas ao toque", generico: true, arquivos: ["src/js/07-caos/06-humanizacao.js"] },
  { id: "ouvidos", nome: "Ouvidos: quem ouve e quem calou ele (aparelhos da sala)", generico: false, arquivos: ["src/js/07-caos/12-ouvintes.js"] },
  { id: "voz", nome: "Voz: Azure (servidor) com reserva na voz do aparelho", generico: true, arquivos: ["src/js/06-voz-som-vibracao.js", "servidor/worker.js"], filtro: /^(caos|voz|audio|unlockAudio|toggleVoice|stepVoice|cycleVoiceName|updateVoiceBtn|falar)/ },
  { id: "sombra", nome: "Cérebro em modo sombra: registro único, percepção e decisão (só anota)", generico: true, arquivos: ["src/js/07-caos/15-cerebro-sombra.js"] },
  { id: "momentos", nome: "Momentos: começo, chegada de alguém, falas espontâneas (específico do jogo, mas o molde serve)", generico: false, arquivos: ["src/js/07-caos/07-momentos-da-partida.js", "src/js/07-caos/16-guia-da-mesa.js"] },
  { id: "pessoas", nome: "Pessoas: humor de cada um, JF, amigos e família", generico: true, arquivos: ["src/js/03-regras.js", "src/js/07-caos/13-amigos.js"], filtro: /humor|Jf|jf|Anne|anne|presente|sobrinho|caosAmi|nomeImproprio|nomeNormalizar/ },
  { id: "temporadas", nome: "Temporadas: datas, espírito natalino, presente com data", generico: true, arquivos: ["src/js/05y-temporadas.js"] },
  { id: "adm", nome: "Área ADM: diagnóstico, console e sandbox do cérebro", generico: false, arquivos: ["src/js/07-caos/02-cerebro-adm.js"] },
];

// funções de um arquivo: nome, linha e o comentário logo acima (quando tem)
function funcoes(arq) {
  const linhas = ler(arq).split("\n");
  const out = [];
  linhas.forEach((l, i) => {
    const m = /^(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)/.exec(l) || /^\s{2}async\s+([a-zA-Z0-9_$]+)\(([^)]*)\)\s*\{/.exec(l);
    if (!m) return;
    let c = "";
    for (let k = i - 1; k >= 0 && k >= i - 3; k--) {
      const t = linhas[k].trim();
      if (/^\/\/|^\*|^\/\*/.test(t)) c = t.replace(/^\/\/\s?|^\/\*+\s?|^\*\s?|\*\/$/g, "").trim() + (c ? " " + c : "");
      else break;
    }
    out.push({ nome: m[1], args: m[2].trim(), linha: i + 1, nota: c.slice(0, 220) });
  });
  return out;
}

// carrega os dados de fala num contexto isolado (são só objetos; funções de fala viram texto de amostra)
function carregarDados() {
  const ordem = ler("src/ordem.txt").split("\n").map((s) => s.trim());
  const dados = ["js/01-configuracao.js"].concat(ordem.filter((f) => /^dados\/(01-emocoes|03-falas-do-caos|04-lexico|08-geradores\/)/.test(f)));
  // os arquivos citam coisas do jogo (AVATARS, players…): cada uma que faltar vira um valor vazio, e tudo roda de
  // novo num contexto limpo (rodar de novo no mesmo contexto daria "já declarado")
  const vazio = 'new Proxy(function(){ return ""; }, { get: (a, k) => (k === Symbol.iterator ? function* () {} : k === Symbol.toPrimitive ? () => "" : k === "length" ? 0 : []) })';
  const faltam = [];
  for (let tent = 0; tent < 60; tent++) {
    const ctx = { console, Math, Date, String, Number, Object, Array, JSON, RegExp, Set, Map };
    vm.createContext(ctx);
    faltam.forEach((n) => vm.runInContext(`var ${n} = ${vazio};`, ctx));
    let novo = null;
    for (const f of dados) {
      try {
        vm.runInContext(ler("src/" + f), ctx, { filename: f });
      } catch (e) {
        const m = /^(\w+) is not defined/.exec(e.message || "");
        if (m && !faltam.includes(m[1])) {
          novo = m[1];
          break;
        }
        console.warn("aviso: não carregou " + f + ": " + e.message);
      }
    }
    if (novo) {
      faltam.push(novo);
      continue;
    }
    const pega = (n) => {
      try {
        return vm.runInContext(`typeof ${n} === "undefined" ? null : ${n}`, ctx);
      } catch (e) {
        return null;
      }
    };
    return { RV: pega("REACTIVE_VOICE") || {}, GER: pega("CAOS_GERADORES") || {} };
  }
  return { RV: {}, GER: {} };
}
const textoDe = (x) => {
  try {
    return String(typeof x === "function" ? x("Fulano", 3, "Lugar") : x).replace(/^\[C\.A\.O\.S\.\]\s*/, "");
  } catch (e) {
    return "(fala com variáveis)";
  }
};
function bancos(RV) {
  const out = [];
  (function andar(o, cam) {
    if (Array.isArray(o)) {
      if (o.length) out.push({ banco: cam, qtd: o.length, amostra: textoDe(o[0]).slice(0, 160) });
      return;
    }
    if (o && typeof o === "object") Object.keys(o).forEach((k) => andar(o[k], cam ? cam + "." + k : k));
  })(RV, "");
  return out;
}
function geradores(GER) {
  return Object.keys(GER).map((g) => {
    const G = GER[g];
    const slots = Object.keys(G).filter((k) => k !== "moldes");
    let pedacos = 0;
    const baldes = {};
    slots.forEach((s) => Object.keys(G[s] || {}).forEach((b) => {
      const n = (G[s][b] || []).length;
      pedacos += n;
      baldes[s + "." + b] = n;
    }));
    const amostra = slots.map((s) => (G[s] && G[s].geral && G[s].geral[0]) || (G[s] && Object.values(G[s])[0] && Object.values(G[s])[0][0]) || "").filter(Boolean).join(" ");
    return { gerador: g, moldes: G.moldes || [], pedacos, baldes, amostra: String(amostra).slice(0, 200) };
  });
}
function versaoCaos() {
  const m = /C\.A\.O\.S\. (\d+\.\d+\.\d+)/.exec(ler("src/html/02-corpo.html"));
  const j = /<title>Perfil JF · ([^<]+)<\/title>/.exec(ler("src/html/01-cabeca.html"));
  return { caos: m ? m[1] : "?", jogo: j ? j[1] : "?" };
}
function constantes() {
  const cfg = ler("src/js/01-configuracao.js").split("\n");
  return cfg
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => /^const (CAOS_|VOZ_|TEMPORADA_)[A-Z0-9_]+\s*=/.test(l))
    .map(({ l, i }) => ({ nome: /^const ([A-Z0-9_]+)/.exec(l)[1], linha: i + 1, arquivo: "src/js/01-configuracao.js" }));
}

const { RV, GER } = carregarDados();
const v = versaoCaos();
const bs = bancos(RV), gs = geradores(GER);
const manifesto = {
  sobre: "Manifesto do C.A.O.S. (Perfil JF). Gerado por ferramentas/caos_anatomia.js. Leia junto com docs/CAOS_Anatomia/00_LEIA-ME_Wally.md.",
  versao: v,
  gerado_em: new Date().toISOString().slice(0, 10),
  totais: {
    funcoes: 0,
    bancos: bs.length,
    falas_prontas: bs.reduce((a, b) => a + b.qtd, 0),
    geradores: gs.length,
    pedacos_de_gerador: gs.reduce((a, g) => a + g.pedacos, 0),
  },
  orgaos: ORGAOS.map((o) => ({
    ...o,
    filtro: undefined,
    funcoes: o.arquivos
      .filter((f) => /\.js$/.test(f))
      .flatMap((f) => funcoes(f).map((x) => ({ arquivo: f, ...x })))
      .filter((x) => !o.filtro || o.filtro.test(x.nome)),
  })),
  constantes: constantes(),
  bancos: bs,
  geradores: gs,
};
manifesto.totais.funcoes = manifesto.orgaos.reduce((a, o) => a + o.funcoes.length, 0);
fs.mkdirSync(SAIDA, { recursive: true });
// Nome de criança da família nunca vai pro kit (regra do JF, 05/11/2026): os ids e nicks de CAOS_SOBRINHOS viram
// familia_1, familia_2… O arquivo de família de cada projeto é que diz quem é quem.
const SEM_CRIANCA = (() => {
  const fonte = ler("src/js/07-caos/13-amigos.js");
  const bloco = (fonte.match(/const CAOS_SOBRINHOS = \[([\s\S]*?)\];/) || [])[1] || "";
  const trocas = [];
  [...bloco.matchAll(/id:\s*"([^"]+)",\s*re:\s*\/(.*?)\/,/g)].forEach((m, i) => {
    const novo = "familia_" + (i + 1);
    trocas.push([m[1], novo]);
    (m[2].match(/[a-z]{5,}/g) || []).filter((w) => !/^(the|best)$/.test(w)).forEach((w) => trocas.push([w, novo]));
  });
  return (txt) => trocas.reduce((t, [de, para]) => t.replace(new RegExp("\\b" + de + "\\b", "gi"), para), txt);
})();
fs.writeFileSync(path.join(SAIDA, "caos_manifesto.json"), SEM_CRIANCA(JSON.stringify(manifesto, null, 1)) + "\n");

// amostras legíveis
const L = [];
L.push(`# Amostras de falas do C.A.O.S. (${v.jogo} · C.A.O.S. ${v.caos})`);
L.push("");
L.push("Gerado por `node ferramentas/caos_anatomia.js`. Uma fala de cada banco e uma montagem de cada gerador, pra sentir o");
L.push('tom. "Fulano", 3 e "Lugar" são valores de exemplo no lugar do nome, do número e da categoria.');
L.push("");
L.push(`**Totais:** ${manifesto.totais.falas_prontas} falas prontas em ${bs.length} bancos · ${gs.length} geradores com ${manifesto.totais.pedacos_de_gerador} pedaços.`);
L.push("");
L.push("## Geradores (falas montadas por pedaços)");
L.push("");
L.push("| Gerador | Pedaços | Exemplo de montagem |");
L.push("|---|---|---|");
gs.forEach((g) => L.push(`| \`${g.gerador}\` | ${g.pedacos} | ${g.amostra.replace(/\|/g, "/")} |`));
L.push("");
L.push("## Bancos de falas prontas");
L.push("");
L.push("| Banco | Falas | Exemplo |");
L.push("|---|---|---|");
bs.forEach((b) => L.push(`| \`${b.banco}\` | ${b.qtd} | ${b.amostra.replace(/\|/g, "/").replace(/\n/g, " ")} |`));
fs.writeFileSync(path.join(SAIDA, "08_Amostras_de_Falas.md"), SEM_CRIANCA(L.join("\n")) + "\n");
console.log(`Kit do C.A.O.S.: ${manifesto.totais.funcoes} funções em ${ORGAOS.length} órgãos · ${manifesto.totais.falas_prontas} falas em ${bs.length} bancos · ${gs.length} geradores (${manifesto.totais.pedacos_de_gerador} pedaços) · C.A.O.S. ${v.caos}`);
