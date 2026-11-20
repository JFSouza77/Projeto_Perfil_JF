#!/usr/bin/env node
// Teste do bordão "Rapaz…" (1.9.6, núcleo 2.0.0 do C.A.O.S.) e do destrave do áudio com a voz ligada. Confere:
//   1. mesa só de 12+ com idade marcada: às vezes a fala começa com "Rapaz…", no máximo 3 por partida;
//   2. Júnior, criança (menos de 12) ou idade sem marcar: nunca;
//   3. fala curta, pergunta ou que já começa com interjeição: nunca;
//   4. sem casal JF + Anne: a chave caosCasal fica desligada e os bancos de casal sumiram;
//   5. efeitos desligados e voz ligada: o toque ainda destrava o áudio (a voz nova toca pelo WebAudio).
//   node ferramentas/teste_bordao.js [mestre.html]
"use strict";
const { acharMestre, abrirNavegador } = require("./_navegador");
const ARQ = acharMestre(process.argv[2]);
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage();
  const erros = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.goto("file://" + ARQ);
  await page.waitForFunction(() => typeof caosBordao === "function");
  const r = await page.evaluate(() => {
    const out = {};
    const fala = "[C.A.O.S.] Essa jogada foi de outro planeta, a mesa inteira ficou olhando.";
    const mesa = (idades) =>
      (players = idades.map((id, i) => ({ id: "p" + i, name: "J" + i, idade: id, score: 0, position: 0 })));
    const rodar = (n, porCarta) => {
      caosBordaoReset();
      let com = 0;
      for (let i = 0; i < n; i++) {
        stats.totalDrawn = porCarta ? i * 6 : i;
        if (caosBordao(fala).indexOf("[C.A.O.S.] Rapaz… ") === 0) com++;
      }
      return com;
    };
    const R = Math.random;
    CURRENT_MODE = "classico";
    mesa(["dezesseis", "doze", "dezesseis"]);
    Math.random = () => 0;
    out.adultos = rodar(40, true);
    out.adultosOk = out.adultos === 3; // teto de 3 por partida
    out.espaco = rodar(5, false) === 1; // 1 a cada 6 cartas
    mesa(["dezesseis", "menor", "dezesseis"]);
    out.crianca = rodar(40, true) === 0;
    mesa(["dezesseis", null, "dezesseis"]);
    out.semIdade = rodar(40, true) === 0;
    mesa(["dezesseis", "dezesseis", "dezesseis"]);
    CURRENT_MODE = "junior";
    out.junior = rodar(40, true) === 0;
    CURRENT_MODE = "classico";
    caosBordaoReset();
    stats.totalDrawn = 50;
    out.curta = caosBordao("[C.A.O.S.] Boa jogada.") === "[C.A.O.S.] Boa jogada.";
    out.pergunta = caosBordao("[C.A.O.S.] Alguém aqui sabe o que está fazendo nessa mesa hoje?").indexOf("Rapaz") === -1;
    out.interjeicao = caosBordao("[C.A.O.S.] Eita, essa resposta foi tão rápida que eu nem processei.").indexOf("Rapaz") === -1;
    Math.random = () => 0.99;
    caosBordaoReset();
    out.raro = caosBordao(fala) === fala; // sorteio alto: sem bordão
    Math.random = R;
    // 4. casal desligado
    mesa(["dezesseis", "dezesseis", "dezesseis"]);
    out.semCasal =
      caosCasal() === null &&
      !(REACTIVE_VOICE.perfilJogador && REACTIVE_VOICE.perfilJogador.casal) &&
      !REACTIVE_VOICE.ausentes &&
      !(REACTIVE_VOICE.duploPadrao && REACTIVE_VOICE.duploPadrao.casal) &&
      caosCasalErro() === "" &&
      caosCasalAcerto() === "";
    // 5. destrave com a voz ligada e o som desligado
    const sSom = soundOn,
      sVoz = caosVoiceOn;
    let chamou = 0;
    const sUnlock = window.unlockAudio;
    window.unlockAudio = () => chamou++;
    try {
      window.audioCtx = { state: "suspended", close() {} };
      soundOn = false;
      caosVoiceOn = true;
      audioDestravarNoToque();
      const comVoz = chamou;
      caosVoiceOn = false;
      audioDestravarNoToque();
      out.destrave = comVoz === 1 && chamou === 1;
    } finally {
      window.unlockAudio = sUnlock;
      soundOn = sSom;
      caosVoiceOn = sVoz;
      window.audioCtx = null;
    }
    return out;
  });
  await b.close();
  const linhas = [
    ["Mesa 12+: o bordão aparece, no máximo 3 por partida", r.adultosOk, { n: r.adultos }],
    ["Bordão espaçado: no máximo 1 a cada 6 cartas", r.espaco, {}],
    ["Com criança na mesa: nunca", r.crianca, {}],
    ["Com idade sem marcar: nunca", r.semIdade, {}],
    ["No Júnior: nunca", r.junior, {}],
    ["Fala curta, pergunta ou com interjeição: sem bordão", r.curta && r.pergunta && r.interjeicao, r],
    ["Sorteio alto: sem bordão (é de vez em quando)", r.raro, {}],
    ["Sem casal JF + Anne: chave desligada e bancos de casal fora", r.semCasal, {}],
    ["Efeitos desligados e voz ligada: o toque ainda destrava o áudio", r.destrave, {}],
  ];
  linhas.forEach(([n, v, d]) => {
    console.log(`${v ? "ok    " : "FALHOU"}  ${n}`);
    if (!v || process.env.V) console.log("        " + JSON.stringify(d));
  });
  if (erros.length) console.log("Erros na página: " + erros.slice(0, 3).join(" | "));
  const tudo = linhas.every((x) => x[1]) && !erros.length;
  if (!tudo) console.log("Error: teste do bordão falhou");
  console.log(tudo ? "BORDÃO OK" : "BORDÃO FALHOU");
  process.exit(tudo ? 0 : 1);
})();
