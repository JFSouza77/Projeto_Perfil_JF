// 1.7.10.2 · Voz nova do C.A.O.S. (servidor → Azure), sem o Azure de verdade:
//   node ferramentas/teste_voz.js [mestre.html] --servidor=8787
// O servidor da sala precisa estar no ar (wrangler dev) com AZURE_URL=http://127.0.0.1:8799/tts e uma chave e
// região quaisquer. Este teste sobe o "Azure" de mentira na porta 8799 (devolve um áudio curto) e confere:
// a voz começa desligada; ligada, fala pela nuvem (sem a voz do aparelho); a mesma fala não pede de novo;
// sem servidor, fala pelo aparelho.
const http = require("http"), path = require("path");
const { acharMestreMaisNovo } = require("../versao.js");
const args = process.argv.slice(2);
const PORTA = +((args.find((a) => a.startsWith("--servidor=")) || "--servidor=8787").split("=")[1]);
const ARQ = path.resolve(args.find((a) => a.endsWith(".html")) || acharMestreMaisNovo(path.join(__dirname, "..")));
function wav() {
  const n = 4000, b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(16000, 24); b.writeUInt32LE(32000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  return b;
}
(async () => {
  const { chromium } = require("playwright");
  let pedidos = 0;
  const ssmls = [];
  const azure = http.createServer((req, res) => { let corpo = ""; req.on("data", (c) => (corpo += c)); req.on("end", () => { pedidos++; ssmls.push(corpo); res.writeHead(200, { "Content-Type": "audio/mpeg" }); res.end(wav()); }); });
  await new Promise((ok) => azure.listen(8799, "127.0.0.1", ok));
  const b = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const ok = [];
  const conf = (n, v) => ok.push([n, !!v]);
  try {
    const ctx = await b.newContext();
    await ctx.addInitScript((porta) => {
      window.__REDE_SERVIDOR = { host: "127.0.0.1", port: porta, secure: false };
      window.__aparelho = 0;
      if (window.speechSynthesis) window.speechSynthesis.speak = (u) => { window.__aparelho++; setTimeout(() => u.onend && u.onend(), 30); };
    }, PORTA);
    const pg = await ctx.newPage();
    const erros = [];
    pg.on("pageerror", (e) => erros.push(e.message));
    await pg.goto("file://" + ARQ);
    await pg.waitForFunction(() => typeof vozNuvem !== "undefined" && vozNuvem.ok !== null, null, { timeout: 15000 }).catch(() => {});
    conf("A voz do C.A.O.S. começa desligada", await pg.evaluate(() => caosVoiceOn === false));
    conf("O servidor diz que a voz nova está ligada", await pg.evaluate(() => vozNuvem.ok === true));
    const falar = (txt) => pg.evaluate((t) => new Promise((fim) => { const a0 = window.__aparelho; caosSpeak(t, null, () => fim({ aparelho: window.__aparelho - a0 })); setTimeout(() => fim({ timeout: true }), 8000); }), txt);
    await pg.evaluate(() => { caosVoiceOn = true; caosVoiceName = ""; unlockAudio(); });
    const p0 = pedidos;
    const frase = `[C.A.O.S.] Teste da voz nova número ${Date.now() % 100000}. Segunda frase aqui!`; // (o servidor guarda as falas)
    const r1 = await falar(frase);
    conf("Ligada, fala pela voz nova (sem a voz do aparelho; o que é novo vai pro Azure)", !r1.timeout && r1.aparelho === 0 && pedidos - p0 >= 1);
    const p1 = pedidos;
    const r2 = await falar(frase);
    conf("A mesma fala de novo não pede outra vez", !r2.timeout && r2.aparelho === 0 && pedidos === p1);
    // 1.7.10.3.1: a emoção vai junto: reticências viram pausa do tamanho da emoção, e o volume muda
    const n0 = ssmls.length;
    const r5 = await pg.evaluate((t) => new Promise((fim) => { caosEmoFalaAtual = "triste"; caosSpeak(t, null, () => fim(true)); setTimeout(() => fim(false), 8000); }), `[C.A.O.S.] Hmm... essa doeu ${Date.now() % 100000}. Que PENA.`);
    const novos = ssmls.slice(n0).join(" ");
    conf("Emoção na voz nova: pausa nas reticências, volume da tristeza e palavra em caixa alta mais forte", r5 && /<break time="650ms"\/>/.test(novos) && /volume="-12%"/.test(novos) && /<prosody volume="\+25%" pitch="\+8%">pena<\/prosody>/.test(novos));
    await pg.evaluate(() => (caosVoiceName = "x"));
    const r3 = await falar("[C.A.O.S.] Com voz do aparelho escolhida.");
    conf("Voz do aparelho escolhida na lista: usa o aparelho", !r3.timeout && r3.aparelho >= 1);
    await pg.evaluate(() => { caosVoiceName = ""; window.__REDE_SERVIDOR = { host: "127.0.0.1", port: 8798, secure: false }; vozNuvem.cache.clear(); });
    const r4 = await falar("[C.A.O.S.] Agora sem servidor nenhum.");
    conf("Sem servidor, cai na voz do aparelho", !r4.timeout && r4.aparelho >= 1);
    if (erros.length) console.log("Erros na página:", erros.join(" | "));
    else console.log("Sem erro na página.");
  } finally {
    await b.close();
    azure.close();
  }
  ok.forEach(([n, v]) => console.log((v ? "ok    " : "FALHOU") + "  " + n));
  console.log(ok.every((x) => x[1]) ? "VOZ OK" : "VOZ COM PROBLEMA");
})();
