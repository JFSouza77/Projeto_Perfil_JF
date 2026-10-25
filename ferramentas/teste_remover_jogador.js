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
    // remove o jogador 3 (Dino) da partida direto pela função
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
  ];
  let ok = true;
  checks.forEach(([n,v])=>{ console.log(`${v?"ok    ":"FALHOU"}  ${n}`); if(!v) ok=false; });
  if (erros.length){ console.log("Erros: "+erros.slice(0,3).join(" | ")); ok=false; }
  console.log("diag:", JSON.stringify(r));
  console.log(ok?"PAUSA JOGADORES OK":"PAUSA JOGADORES FALHOU");
  process.exit(ok?0:1);
})();
