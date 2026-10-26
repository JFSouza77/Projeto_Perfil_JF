const { acharMestre, abrirNavegador } = require("./_navegador");
const ARQ = acharMestre(process.argv[2]);
(async () => {
  const b = await abrirNavegador();
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.route(/fonts\./, (r) => r.abort());
  await page.addInitScript(() => { try { localStorage.setItem("perfil5_tutorial_visto","x"); localStorage.setItem("perfil5_tut_vitoria_vistos", JSON.stringify(["casa","tabuleiro","pontos","joias"])); } catch(e){} if (window.speechSynthesis) window.speechSynthesis.speak=()=>{}; });
  await page.goto("file://" + ARQ);
  await page.waitForFunction(() => typeof beginGameplay === "function" && typeof pauseJogadoresAtualizar === "function");
  const r = await page.evaluate(async () => {
    const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const out = {};
    CURRENT_FORMAT = "versus";
    players = ["Ana","Beto","Caio","Dino"].map((n,i)=>({ id: jogadorIdNovo(), name:n, score: (i+1)*4, position:0, color: PLAYER_COLORS[i], avatar:"😀", humor:"normal", gems:{} }));
    selectMode("classico"); WIN_CONDITION="tabuleiro"; starterDrawCount=1; mestreIndex=0; responderIndex=1;
    ["splashScreen","welcomeScreen","playerPanel"].forEach((id)=>{const e=document.getElementById(id); if(e) e.style.display="none";});
    document.getElementById("gameScreen").style.display="flex";
    beginGameplay(); await espera(30);
    document.querySelectorAll(".caos-modal-ov, .jf-modal-bg, #tutorialOverlay").forEach((o)=>o.remove());
    // abre a pausa
    showPauseScreen(); await espera(20);
    const box = document.getElementById("pauseJogadoresBox");
    out.temBox = !!box;
    out.linhas = box ? box.querySelectorAll(".pj-row").length : 0;
    out.temBotaoPartida = box ? box.querySelectorAll(".pj-partida").length : 0;
    out.temBotaoSala = box ? box.querySelectorAll(".pj-sala").length : 0; // 0 no jogo local (sem rede)
    // 1.8: remover da partida pede senha (ADM ou senha do host da sala)
    const btnTxt = (re) => [...document.querySelectorAll(".caos-modal-ov button, #caosConfirmModal button")].find((b) => re.test(b.textContent));
    const digitar = (v) => { const ovs = document.querySelectorAll(".caos-modal-ov"); const inp = ovs[ovs.length - 1].querySelector("input"); inp.value = v; return inp; };
    const nAntes = players.length;
    box.querySelectorAll(".pj-partida")[2].click(); await espera(20);
    const campo = digitar("1234");
    out.pedeSenha = !!campo && campo.type === "password";
    btnTxt(/^OK$/).click(); await espera(20);
    out.senhaErradaNaoRemove = players.length === nAntes;
    document.querySelectorAll(".caos-modal-ov, #caosConfirmModal").forEach((o) => o.remove());
    caosIntrusoErros = 0; caosIntrusoTravaAte = 0;
    // com a sala aberta: a senha do host libera
    redeAbrirSala("local"); await espera(30);
    out.salaTemSenha = /^\d{4}$/.test(rede.senhaHost || "") && rede.senhaHost !== "0077";
    showPauseScreen(); await espera(10);
    document.querySelectorAll("#pauseJogadoresBox .pj-partida")[2].click(); await espera(20);
    digitar(rede.senhaHost); btnTxt(/^OK$/).click(); await espera(20);
    const conf = btnTxt(/^Remover$/);
    out.senhaHostAbreConfirmacao = !!conf;
    if (conf) conf.click(); await espera(30);
    out.senhaHostRemoveu = players.length === nAntes - 1;
    document.querySelectorAll(".caos-modal-ov, #caosConfirmModal").forEach((o) => o.remove());
    // a senha do ADM também libera
    showPauseScreen(); await espera(10);
    const n2 = players.length;
    document.querySelectorAll("#pauseJogadoresBox .pj-partida")[2].click(); await espera(20);
    digitar("0077"); btnTxt(/^OK$/).click(); await espera(20);
    const conf2 = btnTxt(/^Remover$/);
    if (conf2) conf2.click(); await espera(30);
    out.senhaAdmRemoveu = players.length === n2 - 1;
    document.querySelectorAll(".caos-modal-ov, #caosConfirmModal").forEach((o) => o.remove());
    redeFechar();
    players.push({ id: jogadorIdNovo(), name: "Eva", score: 4, position: 0, color: PLAYER_COLORS[4], avatar: "😀", humor: "normal", gems: {} }, { id: jogadorIdNovo(), name: "Fabi", score: 8, position: 0, color: PLAYER_COLORS[5], avatar: "😀", humor: "normal", gems: {} });
    // remove o jogador 3 da partida direto pela função
    const antes = players.length, scoreAntes = players.map(p=>p.score);
    const res = admRemoverJogador(3);
    out.removeu = res === "ok" && players.length === antes - 1;
    out.pontosDivididos = players.every((p,i)=>p.score >= scoreAntes[i]); // todos ganharam parte
    return out;
  });
  await b.close();
  const checks = [
    ["Seção de jogadores aparece na Pausa", r.temBox],
    ["Lista todos os 4 jogadores", r.linhas === 4],
    ["Cada um com 'Remover da partida'", r.temBotaoPartida === 4],
    ["'Remover da sala' só no online (0 no local)", r.temBotaoSala === 0],
    ["Remover da partida funciona", r.removeu],
    ["Pontos divididos entre quem fica", r.pontosDivididos],
    ["1.8: remover da partida pede senha (campo de senha)", r.pedeSenha],
    ["1.8: senha errada não remove ninguém", r.senhaErradaNaoRemove],
    ["1.8: a sala gera a senha do host (4 números, nunca 0077)", r.salaTemSenha],
    ["1.8: senha do host abre a confirmação e remove", r.senhaHostAbreConfirmacao && r.senhaHostRemoveu],
    ["1.8: senha do ADM também remove", r.senhaAdmRemoveu],
  ];
  let ok = true;
  checks.forEach(([n,v])=>{ console.log(`${v?"ok    ":"FALHOU"}  ${n}`); if(!v) ok=false; });
  if (erros.length){ console.log("Erros: "+erros.slice(0,3).join(" | ")); ok=false; }
  console.log("diag:", JSON.stringify(r));
  console.log(ok?"PAUSA JOGADORES OK":"PAUSA JOGADORES FALHOU");
  process.exit(ok?0:1);
})();
