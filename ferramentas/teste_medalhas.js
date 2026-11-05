#!/usr/bin/env node
// 05/11/2026 · Medalhas da temporada (src/js/05y2-medalhas.js), no motor real da página:
//   node ferramentas/teste_medalhas.js [mestre.html]
// Confere: no Natal, vitória por joias no Júnior, no Clássico e no Old School dá a medalha "natal-2026"; outra
// condição de vitória, outro modo, fora da temporada, o mesmo modo duas vezes e nick emprestado não contam; a ficha
// guarda e limpa; o jogador escolhe mostrar e ela aparece no placar; as falas fecham em 0 ou 5; o jogo não muda.
const { acharMestre, abrirNavegador } = require("./_navegador");
const file = acharMestre(process.argv[2]);
(async () => {
  const ok = [];
  const conf = (n, v) => ok.push([n, !!v]);
  const b = await abrirNavegador();
  try {
    const abrir = async (temp) => {
      const pg = await b.newPage();
      pg.__erros = [];
      pg.on("pageerror", (e) => pg.__erros.push(e.message));
      await pg.route(/fonts\./, (r) => r.abort());
      await pg.goto("file://" + file + "?temporada=" + temp);
      await pg.waitForFunction(() => typeof medalhaAnotar === "function" && typeof caosMemFimDePartida === "function");
      return pg;
    };
    // uma partida que acaba com o 1º jogador vencendo (por joias, ou pela condição dada)
    const partida = (pg, modo, cond, nomes, emprestado) =>
      pg.evaluate(({ modo, cond, nomes, emprestado }) => {
        CURRENT_MODE = modo; WIN_CONDITION = cond; CURRENT_FORMAT = "versus";
        players = nomes.map((n, i) => ({ id: "j" + i, name: n, score: i ? 2 : 9, position: 0, gems: {}, humor: "normal", nickEmprestado: !!(emprestado && i === 0) }));
        gemWinner = cond === "joias" ? { kind: "player", id: "j0" } : null;
        stats.totalDrawn = 12; caosMemFimFeito = false;
        const antes = JSON.stringify(players.map((p) => [p.score, p.position, p.gems]));
        caosMemFimDePartida();
        return antes === JSON.stringify(players.map((p) => [p.score, p.position, p.gems]));
      }, { modo, cond, nomes, emprestado });
    const ficha = (pg, n) => pg.evaluate((n) => fichaGet(n), n);
    const ano = new Date().getFullYear();
    const CH = "natal-" + ano;

    const pg = await abrir("natal");
    await pg.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    let intocado = await partida(pg, "junior", "joias", ["Medalhista", "Outro"]);
    let f = await ficha(pg, "Medalhista");
    conf("Natal + Júnior + joias: conta 1 de 3", f && f.medalhas[CH] && f.medalhas[CH].d.join() === "junior" && !f.medalhas[CH].em);
    intocado = (await partida(pg, "junior", "joias", ["Medalhista", "Outro"])) && intocado;
    f = await ficha(pg, "Medalhista");
    conf("O mesmo modo duas vezes conta uma vez só", f.medalhas[CH].d.length === 1);
    intocado = (await partida(pg, "classico", "pontos", ["Medalhista", "Outro"])) && intocado;
    intocado = (await partida(pg, "hardcore", "joias", ["Medalhista", "Outro"])) && intocado;
    f = await ficha(pg, "Medalhista");
    conf("Outra condição de vitória (pontos) e outro modo (Hardcore) não contam", f.medalhas[CH].d.length === 1);
    conf("Quem perdeu não conta", !(await ficha(pg, "Outro")).medalhas[CH]);
    intocado = (await partida(pg, "classico", "joias", ["Medalhista", "Outro"])) && intocado;
    intocado = (await partida(pg, "oldschool", "joias", ["Medalhista", "Outro"])) && intocado;
    f = await ficha(pg, "Medalhista");
    conf("Júnior, Clássico e Old School por joias no Natal: ganhou a medalha " + CH, f.medalhas[CH].d.length === 3 && f.medalhas[CH].em > 0);
    conf("Ganhou, mas só mostra se o jogador escolher", f.medalhaMostrar === null);
    await pg.waitForSelector("#medalhaJanela", { timeout: 20000 }).catch(() => {});
    conf("Aparece a janela da medalha (com o desenho) perguntando se mostra", await pg.evaluate(() => !!document.querySelector("#medalhaJanela .medalha-grande svg")));
    await pg.click("#medMostrar").catch(() => {});
    f = await ficha(pg, "Medalhista");
    conf("Escolheu mostrar: fica na ficha", f.medalhaMostrar === CH);
    conf("Placar mostra a medalha ao lado do nome", await pg.evaluate(() => /medalha-tag[\s\S]*<svg/.test(medalhaHtml(players[0])) && medalhaHtml(players[1]) === ""));
    await pg.evaluate(() => medalhaEscolher("Medalhista", null));
    conf("Escolheu esconder: some do placar", await pg.evaluate(() => medalhaHtml(players[0]) === ""));
    conf("A ficha joga fora o que não vale", await pg.evaluate(() => {
      const l = fichaLimpa({ medalhas: { "natal-2026": { d: ["junior", "xx"], em: 0 }, "lixo": { d: ["junior"] }, "natal-20x": {} }, medalhaMostrar: "natal-2026" }, "A");
      return Object.keys(l.medalhas).join() === "natal-2026" && l.medalhas["natal-2026"].d.join() === "junior" && l.medalhaMostrar === null;
    }));
    intocado = (await partida(pg, "junior", "joias", ["Emprestado", "Outro"], true)) && intocado;
    conf("Nick emprestado não ganha medalha", !(await ficha(pg, "Emprestado")));
    conf("As falas da medalha fecham em 0 ou 5", await pg.evaluate(() => { const B = REACTIVE_VOICE.temporada.medalha; return B.progresso.length % 5 === 0 && B.ganhou.length % 5 === 0; }));
    conf("O jogo não muda (pontos, casas e joias iguais)", intocado);
    const erros1 = pg.__erros.slice();
    await pg.close();

    const fora = await abrir("nenhuma");
    await fora.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await partida(fora, "junior", "joias", ["Fora", "Outro"]);
    const ff = await ficha(fora, "Fora");
    conf("Fora de temporada não conta", ff && !Object.keys(ff.medalhas).length);
    await fora.evaluate(() => { fichaUpd("Fora", (f) => (f.medalhas = { "natal-2026": { d: ["junior", "classico", "oldschool"], em: 1 } })); medalhaPerguntarMostrar("Fora", "natal-2026"); });
    await fora.waitForTimeout(150);
    conf("Janela da medalha começa com o foco no botão", await fora.evaluate(() => document.activeElement && document.activeElement.id === "medMostrar"));
    await fora.keyboard.press("Escape");
    conf("Esc na medalha = guardar sem mostrar", await fora.evaluate(() => !document.getElementById("medalhaJanela") && fichaGet("Fora").medalhaMostrar === null));
    conf("Sem erro na página", !erros1.length && !fora.__erros.length);
    if (erros1.length || fora.__erros.length) console.log("Erros:", erros1.concat(fora.__erros).join(" | "));
  } finally {
    await b.close();
  }
  ok.forEach(([n, v]) => console.log((v ? "ok    " : "FALHOU") + "  " + n));
  const tudo = ok.every((x) => x[1]);
  console.log(tudo ? "MEDALHAS OK" : "MEDALHAS COM PROBLEMA");
  process.exit(tudo ? 0 : 1);
})();
