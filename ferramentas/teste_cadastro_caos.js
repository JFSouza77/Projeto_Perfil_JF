#!/usr/bin/env node
// Teste da 1.9.1 (demonstração do JF de 30/10/2026):
//  · o "oi" do C.A.O.S. espera a pergunta do cadastro fechar (antes a janela apagava a fala) e não cai no respiro;
//  · Adicionar incompleto: o C.A.O.S. diz o que falta (com o nick) e marca o campo;
//  · Sandbox do cérebro: mexer no vetor troca a emoção (a cor do cérebro) na hora, e o Restaurar de fábrica zera;
//  · fala do guia da mesa pro Mestre ("lê pra mesa") sai na voz.
//   node ferramentas/teste_cadastro_caos.js
const { acharMestre, abrirNavegador } = require("./_navegador");
(async () => {
  const b = await abrirNavegador();
  const page = await (await b.newContext()).newPage();
  await page.route(/fonts\.|google/, (r) => r.abort());
  await page.route(/\/conta\/existe/, async (r) => {
    const corpo = JSON.parse(r.request().postData() || "{}");
    await new Promise((ok) => setTimeout(ok, 300));
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, existe: /^jf$/i.test(corpo.nick), semPin: false }) });
  });
  await page.addInitScript(() => {
    try {
      localStorage.setItem("perfil5_tutorial_visto", "x");
      localStorage.setItem("perfil5_anne_ligada", "1");
    } catch (e) {}
    window.__REDE_SERVIDOR = { host: "127.0.0.1", port: 8787, secure: false };
  });
  await page.goto("file://" + acharMestre());
  await page.waitForFunction(() => typeof cadGuiarFalta === "function" && typeof caosSandboxSentir === "function");
  await page.waitForTimeout(1200);
  const o = await page.evaluate(async () => {
    const out = {};
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    document.querySelectorAll(".caos-modal-ov").forEach((x) => x.remove());
    const falas = [];
    const emit = window.caosEmit;
    window.caosEmit = (k, d) => {
      if (d && d.texto) falas.push({ k, t: Date.now(), modal: !!document.querySelector(".caos-modal-ov") });
      return emit(k, d);
    };
    const responder = async () => {
      for (let i = 0; i < 40 && !document.querySelector(".caos-modal-ov"); i++) await espera(100);
      const m = document.querySelector(".caos-modal-ov");
      const nao = m && [...m.querySelectorAll("button")].find((x) => /Agora não/.test(x.textContent));
      if (nao) nao.click();
      return !!m;
    };
    // 1) JF (nick com cadastro): a pergunta aparece e o "oi" vem depois que ela fecha
    document.getElementById("playerNameInput").value = "JF";
    addPlayer();
    out.jfSemOiAntesDaPergunta = !falas.some((f) => f.k === "gerador.jfChegou" || /boasVindas|nickReacao/.test(f.k));
    out.perguntaJf = await responder();
    for (let i = 0; i < 40 && !falas.some((f) => /jfChegou|nickReacao\.jf|boasVindas/.test(f.k)); i++) await espera(150);
    out.jfCumprimentado = falas.some((f) => /jfChegou|nickReacao\.jf|boasVindas/.test(f.k) && !f.modal);
    // 2) Anne logo depois (respiro): o "oi" espera e sai, em vez de ser cortado
    const n0 = falas.length;
    document.getElementById("playerNameInput").value = "Anne";
    addPlayer();
    out.perguntaAnne = await responder();
    for (let i = 0; i < 120 && !falas.slice(n0).some((f) => /anne|boasVindas/i.test(f.k) && f.k !== "cortada"); i++) await espera(200);
    out.anneCumprimentada = falas.slice(n0).some((f) => /anne|boasVindas/i.test(f.k) && f.k !== "cortada");
    out.anneNaoCortada = !falas.slice(n0).some((f) => f.k === "cortada");
    // 3) Adicionar incompleto: fala com o nick e marca o campo da idade
    await espera(7000);
    const n1 = falas.length;
    const inp = document.getElementById("playerNameInput");
    inp.value = "Bia";
    cadAtualizarBotao();
    out.botaoTocavel = !document.getElementById("addPlayerBtn").disabled && document.getElementById("addPlayerBtn").getAttribute("aria-disabled") === "true";
    document.getElementById("addPlayerBtn").click();
    await espera(400);
    out.faltaFalou = falas.slice(n1).some((f) => /^cadFalta\./.test(f.k));
    out.faltaMarcou = !!document.querySelector(".cad-falta-foco");
    out.naoAdicionou = !players.some((p) => p.name === "Bia");
    // 4) Sandbox: 3 toques em Tensão+ trocam a emoção; fábrica volta ao calmo
    caosCerebroFabrica();
    const e0 = caosEmocaoGlobal();
    for (let i = 0; i < 3; i++) caosSandboxSentir("Tensão", 1.5);
    out.sandboxMudaCor = e0 === "calmo" && caosEmocaoGlobal() !== "calmo";
    caosEmo.tensao = 9;
    caosHumorOverride = "frustrado";
    caosCerebroFabrica();
    out.fabrica = caosEmocaoGlobal() === "calmo" && caosEmo.tensao === 5 && caosEmo.calor === 5 && caosEmo.paciencia === 7 && caosHumorOverride === null;
    // 5) Guia pro Mestre: a fala com "lê pra mesa" passa no filtro da voz
    const frase = "[C.A.O.S.] Bia, pediram uma dica! Você é o Mestre: toca no número que pisca e lê em voz alta.";
    out.filtroAindaCalaOResto = caosSpeechIsForMaster(caosSemPausa(caosSpeechText(frase, true)));
    const vozOn = caosVoiceOn;
    caosVoiceOn = true;
    caosLastPick = { bank: "outro.banco", text: frase, at: Date.now() };
    const c0 = caosVoiceSilenced;
    try {
      caosSpeak(frase);
    } catch (e) {}
    out.semGuiaContinuaCalado = caosVoiceSilenced === c0 + 1; // controle: o filtro está ativo neste navegador
    const antes = caosVoiceSilenced;
    caosLastPick = { bank: "guia.abrir", text: frase, at: Date.now() };
    try {
      caosSpeak(frase);
    } catch (e) {}
    out.guiaComVoz = caosVoiceSilenced === antes;
    caosVoiceCancel && caosVoiceCancel();
    caosVoiceOn = vozOn;
    return out;
  });
  let falhas = 0;
  for (const [k, v] of Object.entries(o)) {
    console.log((v ? "ok   " : "FALHA") + " " + k);
    if (!v) falhas++;
  }
  console.log(falhas ? "CADASTRO/C.A.O.S. COM PROBLEMA" : "CADASTRO/C.A.O.S. OK");
  await b.close();
  process.exit(falhas ? 1 : 0);
})().catch((e) => {
  console.log("erro:", e.message);
  process.exit(1);
});
