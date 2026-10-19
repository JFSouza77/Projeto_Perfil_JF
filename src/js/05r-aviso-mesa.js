/* --- 1.7.10.7 · AVISO DA MESA (pedido do JF, 18/10, depois da partida online com Rafa, Vitinho e Henrique) ---
 * "Todos os avisos, alertas, modalidades, tem que ter visual, tem que aparecer na tela, tem que ser chamativo, a tela
 * tem que piscar, vibrar, balançar. E todo mundo tem que ficar sabendo." Duelo, Batata Quente, roubo, Turbo, bomba,
 * Juízo Final…: a tela escurece, uma caixa grande e animada aparece no meio, o dispositivo vibra e treme, e enquanto o
 * aviso está na tela o tempo da partida para e os comandos ficam congelados (dispatchAction recusa). Quem manda é o
 * host: o aviso vai no painel de cada dispositivo (assim o aviso privado, como o da Mão Leve, só chega pra quem foi
 * roubado). Um aviso por vez: os outros esperam na fila. O botão ("Bora!") só fecha a caixa naquele dispositivo; o
 * congelamento dura o tempo do aviso pra todo mundo.
 *
 * avisoMostrar({ ic, titulo, texto, anim, dados, para, seg, botao })
 *   anim: duelo | batata | maoleve | bomba | turbo | imposto | juizo | mestre | ppt | dado | moeda | parimpar | pinata
 *   para: lista de ids de jogador (aviso privado: não congela a mesa) ou nada (a mesa toda)
 *   variantes: { idDoJogador: { ic, titulo, texto } } — o mesmo aviso com outra frase pra alguém ("Henrique te chamou!") */
const AVISO_SEG = 4.5;
// 1.7.10.7.2 (ideia do JF): cada tipo de aviso tem o seu botão (o convite do duelo fica no "Bora!", pedido dele)
const AVISO_BOTAO = {
  duelo: ["Bora!"],
  mestre: ["Tô pronto! 🎙️", "Deixa comigo! 🎙️", "Microfone na mão! 🎤", "Vou ler com emoção! 📖"],
  batata: ["Tá quente! 🔥", "Ai, queima! 🥵", "Passa logo isso! 🥔", "Socorro, tá pelando! 🔥", "Segura essa! 😬"],
  maoleve: ["Vou me vingar! 😤", "Quem foi?! 🕵️", "Isso não vai ficar assim! 😠", "Devolve! 🧤", "Ladrões! 🚨"],
  bomba: ["Socorro! 💣", "Kabum! 💥", "Vai explodir! 😱", "Corre, corre! 🏃", "Desarma isso! ✂️"],
  turbo: ["Acelera! ⏩", "Pisa fundo! 🏎️", "Sem freio! 💨", "Rapidinho! ⚡"],
  imposto: ["Que injustiça! 💸", "Lá se vai meu dinheiro… 😩", "Leão faminto! 🦁", "Vou palpitar, juro! ✋"],
  juizo: ["Que comece! ⚖️", "Chegou a hora! ⏳", "Agora é tudo ou nada! 🔥", "Seja o que Deus quiser! 🙏"],
  ppt: ["Uau! 😮", "Beleza! 👍", "Droga! 😤", "Na próxima eu ganho! 😠", "Que sorte! 🍀", "Não acredito! 😱"],
  dado: ["Uau! 😮", "Dado viciado! 🎲", "Na próxima eu ganho! 😠", "Que sorte! 🍀", "Droga! 😤", "Rolou bonito! 🎉"],
  moeda: ["Uau! 😮", "Cara de sorte! 🍀", "Droga! 😤", "Na próxima eu ganho! 😠", "Moeda roubada! 🪙", "Eu sabia! 😎"],
  parimpar: ["Uau! 😮", "Beleza! 👍", "Droga! 😤", "Na próxima eu ganho! 😠", "Contei errado! 🤦", "Eu sabia! 😎"],
  pinata: ["Quebra! 🪅", "Bate forte! 💪", "Doce pra mim! 🍬", "Vou digitar rapidinho! ⌨️"],
};
// sorteia o botão do tipo, sem repetir o último que saiu
const avisoBotaoUltimo = {};
function avisoBotaoSortear(anim) {
  const l = AVISO_BOTAO[anim];
  if (!l || !l.length) return null;
  const opc = l.length > 1 ? l.filter((b) => b !== avisoBotaoUltimo[anim]) : l;
  const b = opc[Math.floor(Math.random() * opc.length)];
  avisoBotaoUltimo[anim] = b;
  return b;
}
const AVISO_ANIMS = ["duelo", "batata", "maoleve", "bomba", "turbo", "imposto", "juizo", "mestre", "ppt", "dado", "moeda", "parimpar", "pinata"];
let avisoMesa = null; // { id, ic, titulo, texto, anim, dados, para, ate, congela, botao }
let avisoFila = [];
let avisoSeq = 0;
let avisoTimer = null;
let avisoFechadoAqui = null; // id do aviso que este dispositivo já fechou no botão
let avisoAoFim = {}; // id → o que o host faz quando o aviso sai da tela (ex.: tirar a carta do duelo)

// a fala do C.A.O.S. vira texto da caixa (sem a etiqueta)
function avisoFalaLimpa(f) {
  return String(f || "")
    .replace(/\[C\.A\.O\.S\.\]\s*/g, "")
    .trim();
}
function avisoMesaAtivo() {
  return !!avisoMesa && Date.now() < avisoMesa.ate;
}
// enquanto um aviso da mesa toda está na tela, o tempo para e os comandos esperam
function avisoMesaCongela() {
  return avisoMesaAtivo() && avisoMesa.congela;
}
// os trechos em que a mesa ficou congelada ([início, fim]; fim null = ainda congelada), pra quem conta tempo
// saber quanto descontar desde o último tique
let avisoCongelas = [];
function avisoCongeladoDesde(t) {
  const agora = Date.now();
  // 1.7.10.9 (achado no teste online: o relógio da Corrida parou pra sempre): trecho que ficou aberto sem aviso
  // congelando na tela fecha na hora em que o aviso devia ter saído (nunca congela mais que o próprio aviso)
  const ult = avisoCongelas[avisoCongelas.length - 1];
  if (ult && !ult[1] && !avisoMesaCongela()) ult[1] = Math.max(ult[0], Math.min(agora, avisoMesa && avisoMesa.ate ? avisoMesa.ate : agora));
  let ms = 0;
  for (const [ini, fim] of avisoCongelas) ms += Math.max(0, Math.min(fim || agora, agora) - Math.max(ini, t));
  return ms;
}
function avisoCongelaMarcar(liga) {
  const ult = avisoCongelas[avisoCongelas.length - 1];
  if (liga && !(ult && !ult[1])) avisoCongelas.push([Date.now(), null]);
  if (!liga && ult && !ult[1]) ult[1] = Date.now();
  if (avisoCongelas.length > 8) avisoCongelas = avisoCongelas.slice(-8);
}
function avisoMostrar(o) {
  if (!o || gameEnded) return;
  const a = {
    id: "av" + ++avisoSeq + "_" + (Date.now() % 1e6),
    ic: String(o.ic || "📣").slice(0, 8),
    titulo: String(o.titulo || "").slice(0, 80),
    texto: String(o.texto || "").slice(0, 220),
    anim: AVISO_ANIMS.includes(o.anim) ? o.anim : null,
    dados: o.dados || null,
    para: Array.isArray(o.para) && o.para.length ? o.para.slice(0, 10) : null,
    seg: Math.max(2, Math.min(9, o.seg || AVISO_SEG)),
    botao: String(o.botao || avisoBotaoSortear(o.anim) || "Entendi!").slice(0, 30),
    variantes: null,
  };
  if (o.variantes && typeof o.variantes === "object") {
    a.variantes = {};
    for (const k of Object.keys(o.variantes).slice(0, 10)) {
      const v = o.variantes[k] || {};
      a.variantes[k] = { ic: v.ic ? String(v.ic).slice(0, 8) : null, titulo: v.titulo ? String(v.titulo).slice(0, 80) : null, texto: v.texto != null ? String(v.texto).slice(0, 220) : null, botao: v.botao ? String(v.botao).slice(0, 30) : null };
    }
  }
  a.congela = !a.para;
  if (typeof o.aoFim === "function") avisoAoFim[a.id] = o.aoFim;
  if (avisoMesaAtivo()) {
    if (avisoFila.length < 6) avisoFila.push(a);
    return;
  }
  avisoComecar(a);
}
function avisoComecar(a) {
  a.ate = Date.now() + a.seg * 1e3;
  avisoMesa = a;
  avisoCongelaMarcar(a.congela);
  // o fim do aviso fica garantido antes de qualquer coisa que possa dar erro (desenho, rede)
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => avisoAcabar(a.id), a.seg * 1e3 + 30);
  try {
    caosLog("aviso", `${a.ic} ${a.titulo}${a.para ? " (privado)" : ""}`);
  } catch (e) {}
  try {
    avisoDesenharHost();
  } catch (e) {
    avisoErro("desenhar", e);
  }
  try {
    if (typeof redeHostPublicar === "function") redeHostPublicar(true);
  } catch (e) {
    avisoErro("publicar", e);
  }
}
function avisoErro(onde, e) {
  try {
    caosLog("aviso", `erro ao ${onde} o aviso: ${(e && e.message) || e}`);
  } catch (x) {}
}
function avisoAcabar(id) {
  if (!avisoMesa || avisoMesa.id !== id) return;
  avisoMesa = null;
  avisoCongelaMarcar(false);
  try {
    avisoDesenharHost();
  } catch (e) {}
  const fim = avisoAoFim[id];
  delete avisoAoFim[id];
  if (fim) {
    try {
      fim();
    } catch (e) {}
  }
  if (avisoMesa) return; // o aoFim já abriu outro aviso
  if (avisoFila.length) return avisoComecar(avisoFila.shift());
  try {
    if (typeof redeHostPublicar === "function") redeHostPublicar(true);
  } catch (e) {}
  try {
    render();
  } catch (e) {}
}
function avisoZerar() {
  clearTimeout(avisoTimer);
  avisoMesa = null;
  avisoFila = [];
  avisoCongelas = [];
  avisoAoFim = {};
  document.getElementById("avisoMesaOv")?.remove();
}
// o aviso que vale pra um jogador (vai no painel do dispositivo dele)
function avisoParaJogador(jid) {
  if (!avisoMesaAtivo()) return null;
  if (avisoMesa.para && !avisoMesa.para.includes(jid)) return null;
  return avisoComVariante(avisoMesa, jid);
}
function avisoComVariante(a, jid) {
  const { id, ic, titulo, texto, anim, dados, ate, congela, botao } = a;
  const v = (a.variantes && jid != null && a.variantes[jid]) || {};
  return { id, ic: v.ic || ic, titulo: v.titulo || titulo, texto: v.texto != null ? v.texto : texto, anim, dados, ate, congela, botao: v.botao || botao };
}
// o convidado só aceita um aviso bem formado (veio da rede)
function avisoLimpar(a) {
  if (!a || typeof a !== "object" || typeof a.id !== "string" || !Number.isFinite(a.ate)) return null;
  const d = a.dados && typeof a.dados === "object" ? a.dados : null;
  const t = (x, n) => (x == null ? null : String(x).slice(0, n));
  return {
    id: a.id.slice(0, 40),
    ic: t(a.ic, 8) || "📣",
    titulo: t(a.titulo, 80) || "",
    texto: t(a.texto, 220) || "",
    anim: AVISO_ANIMS.includes(a.anim) ? a.anim : null,
    dados: d ? { nomeA: t(d.nomeA, 40), nomeB: t(d.nomeB, 40), a: t(d.a, 12), b: t(d.b, 12), lado: d.lado === "cara" ? "cara" : "coroa" } : null,
    ate: a.ate,
    congela: !!a.congela,
    botao: t(a.botao, 30) || "Bora!",
  };
}
// no host (ou no jogo de um dispositivo só): aparece se for da mesa toda ou de alguém que joga aqui
function avisoDesenharHost() {
  const a = avisoMesaAtivo() ? avisoMesa : null;
  const online = typeof rede !== "undefined" && rede && rede.papel === "host";
  const noHost = (id) => typeof redeNoHost === "function" && redeNoHost(id);
  const aqui = a && (!a.para || !online || a.para.some(noHost));
  // no host online, a frase de quem joga aqui (a variante dele); num dispositivo só, a frase da mesa
  const meu = aqui && online && a.variantes ? Object.keys(a.variantes).find(noHost) : null;
  avisoDesenhar(aqui ? (meu ? avisoComVariante(a, meu) : a) : null, Date.now());
}
// no convidado: o aviso chega no painel; a hora "ate" é a do host
function avisoDesenharConvidado() {
  const a = typeof rede !== "undefined" && rede && rede.painel && rede.painel.aviso;
  const agora = typeof redeAgora === "function" ? redeAgora() : Date.now();
  avisoDesenhar(a && agora < a.ate ? a : null, agora);
}
let avisoGuardaTimer = null;
function avisoDesenhar(a, agora) {
  let ov = document.getElementById("avisoMesaOv");
  if (!a || avisoFechadoAqui === a.id) {
    if (ov) ov.remove();
    return;
  }
  if (ov && ov.dataset.id === a.id) return; // o mesmo aviso: não recomeça a animação
  if (ov) ov.remove();
  ov = document.createElement("div");
  ov.id = "avisoMesaOv";
  ov.className = "aviso-mesa-ov";
  ov.dataset.id = a.id;
  ov.setAttribute("role", "alertdialog");
  ov.setAttribute("aria-live", "assertive");
  const resta = Math.max(1000, a.ate - agora);
  ov.style.setProperty("--aviso-ms", resta + "ms");
  ov.innerHTML = `<div class="aviso-mesa${a.anim ? " aviso-" + a.anim : ""}">
    <div class="aviso-anim" aria-hidden="true">${avisoAnimHtml(a)}</div>
    <div class="aviso-tit">${escapeHtml(a.titulo)}</div>
    <div class="aviso-txt">${escapeHtml(a.texto || "")}</div>
    <div class="aviso-barra" aria-hidden="true"><i></i></div>
    <button type="button" class="aviso-ok">${escapeHtml(a.botao || "Bora!")}</button>
  </div>`;
  document.body.appendChild(ov);
  ov.querySelector(".aviso-ok").addEventListener("click", () => {
    avisoFechadoAqui = a.id;
    ov.remove();
  });
  // chama a atenção: treme a tela, vibra, toca
  try {
    document.body.classList.remove("aviso-treme");
    void document.body.offsetWidth;
    document.body.classList.add("aviso-treme");
    setTimeout(() => document.body.classList.remove("aviso-treme"), 700);
    vibrar("absurdo");
    playSfx(a.anim === "bomba" || a.anim === "maoleve" ? "erroForte" : "flash");
  } catch (e) {}
  clearTimeout(avisoGuardaTimer);
  avisoGuardaTimer = setTimeout(() => {
    const o = document.getElementById("avisoMesaOv");
    if (o && o.dataset.id === a.id) o.remove();
  }, resta + 50);
}
// a animação de cada aviso (emoji animado em CSS; o resultado do sorteio aparece no fim)
function avisoAnimHtml(a) {
  const d = a.dados || {};
  const lado = (ic, nome, final) =>
    `<div class="aviso-lado"><div class="aviso-mao"><span class="am-ini">${ic}</span><span class="am-fim">${escapeHtml(String(final || ""))}</span></div><div class="aviso-nome">${escapeHtml(nome || "")}</div></div>`;
  if (a.anim === "ppt") {
    const ic = { pedra: "✊", papel: "✋", tesoura: "✌️" };
    return `<div class="aviso-duelo-anim">${lado("✊", d.nomeA, ic[d.a] || "✊")}<b class="aviso-x">×</b>${lado("✊", d.nomeB, ic[d.b] || "✊")}</div>`;
  }
  if (a.anim === "parimpar") return `<div class="aviso-duelo-anim">${lado("✊", d.nomeA, "🖐️ " + (d.a ?? ""))}<b class="aviso-x">+</b>${lado("✊", d.nomeB, "🖐️ " + (d.b ?? ""))}</div>`;
  if (a.anim === "dado") return `<div class="aviso-duelo-anim">${lado("🎲", d.nomeA, "🎲 " + (d.a ?? ""))}<b class="aviso-x">×</b>${lado("🎲", d.nomeB, "🎲 " + (d.b ?? ""))}</div>`;
  if (a.anim === "moeda") return `<div class="aviso-moeda"><div class="aviso-mao"><span class="am-ini">🪙</span><span class="am-fim">${d.lado === "cara" ? "🙂 CARA" : "👑 COROA"}</span></div></div>`;
  if (a.anim === "maoleve") return `<div class="aviso-maos"><span>🧤</span></div>`; // 1.7.10.8: um par só (o emoji já é o par)
  if (a.anim === "duelo") return `<div class="aviso-espadas"><span>🗡️</span><span>🗡️</span></div>`;
  return `<div class="aviso-ic">${escapeHtml(a.ic || "📣")}</div>`;
}
