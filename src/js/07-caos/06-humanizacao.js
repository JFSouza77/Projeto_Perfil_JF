function caosHumanizaReset() {
  caosNaoCurtiN = 0;
  caosNaoCurtiReacoes = 0;
  caosSegurou = false;
  caosPerguntaN = 0;
  caosPerguntaUlt = -99;
  caosPertoCont = {};
  caosImplic = null;
  caosSilencio = { ok: Math.random() < 0.4, usado: false };
  caosMagoa = 0;
  caosMagoaPico = 0;
  caosPausaInicio = null;
  caosPausaDegrau = -1;
  caosTropecos = { n: 0, ult: -99, nomes: {} };
}
function caosToastSegurarInicio() {
  clearTimeout(caosSeguraRef);
  if (!activeToastState) return;
  const t0 = Date.now();
  caosSeguraRef = setTimeout(() => {
    caosSegurou = true;
    setTimeout(() => {
      caosSegurou = false;
    }, 900);
    caosNaoCurti(t0);
  }, 700);
}
function caosToastSegurarFim() {
  clearTimeout(caosSeguraRef);
}
function caosNaoCurti(t0) {
  const st = activeToastState;
  if (!st) return;
  const msg = String(st.msg || "");
  if (msg.indexOf("[C.A.O.S.]") === -1) return;
  const sem = msg
    .replace(/\[C\.A\.O\.S\.\]\s*/g, "")
    .replace(/[⟦⟧]/g, "")
    .trim();
  let ent = null;
  for (let i = caosMatchLog.length - 1; i >= 0 && i >= caosMatchLog.length - 6; i--) {
    const e = caosMatchLog[i];
    if (e && e.text && sem.indexOf(e.text.slice(0, 60)) !== -1) {
      ent = e;
      break;
    }
  }
  if (!ent || (ent.rated && ent.r === -1)) return;
  const rapido = t0 - (st.shownAt || st.frozenAt || t0) < 1e3;
  caosNaoCurtiN++;
  const ruido = caosNaoCurtiN >= 5 && caosNaoCurtiN > caosMatchLog.length * 0.8;
  if (rapido || ruido) {
    ent.r = -1;
    ent.rated = true;
    ent.fraco = true;
    saveGameState();
  } else caosRate(ent, -1);
  ent.naHora = true;
  caosLog(
    "naoCurti",
    `${ent.bank}${rapido ? " (marcado em < 1 s: peso baixo)" : ""}${ruido ? " (80%+ das falas marcadas: ruído)" : ""} · ${ent.text.slice(0, 70)}`,
  );
  if (/^(acido|nivelZero)/.test(ent.bank) || /\.(acido|zero)$/.test(ent.bank))
    caosLog("naoCurti", "⚠️ fala Ácida/Nível 0 reprovada — conferir se ela chegou em alguém do Suave");
  caosEmoNudge(0.3, -0.4);
  caosVinculoNaoCurti();
  vibrar("erro");
  const toast = document.getElementById("jfToast");
  if (toast) {
    caosToastEmo(toast, "triste");
    const tag = document.createElement("span");
    tag.className = "toast-dislike";
    tag.textContent = "👎 anotado";
    toast.appendChild(tag);
  }
  if (/^implicancia/.test(ent.bank) && caosImplic && caosImplic.ativa) {
    caosImplic.dislikes++;
    if (caosImplic.dislikes >= 2) caosImplicLargar();
  }
  const reage = caosNaoCurtiN % 3 === 0 && caosNaoCurtiReacoes < 3 && !ruido;
  if (reage) caosNaoCurtiReacoes++;
  setTimeout(() => {
    if (activeToastState === st) closeActiveToast();
    if (reage) caosFalarDepois(getRandomReaction(REACTIVE_VOICE.naoCurti));
  }, 900);
}
function caosPerguntaTalvez(p, tipo) {
  if (!p || tipo || gameEnded || CURRENT_MODE === "express" || (currentCard && currentCard.isBonus)) return;
  // 1.7.10 (print do JF): com o Mestre em outro aparelho (online), a pergunta Perto/Longe não aparece no host
  if (typeof redeMestreLonge === "function" && redeMestreLonge()) return;
  const aperto = caosConsole && caosConsole.seqErr >= 2;
  if (
    caosPerguntaN >= (aperto ? 6 : 4) ||
    stats.totalDrawn - caosPerguntaUlt < (aperto ? 2 : 3) ||
    Math.random() > (aperto ? 0.65 : 0.35)
  )
    return;
  caosPerguntaN++;
  caosPerguntaUlt = stats.totalDrawn;
  document.getElementById("caosPergunta")?.remove();
  const d = document.createElement("div");
  d.id = "caosPergunta";
  d.className = "caos-pergunta";
  d.setAttribute("role", "group");
  d.innerHTML = `<span>🤖 Mestre, o chute de <b>${escapeHtml(p.name)}</b> foi…</span><button type="button" data-v="perto">🔥 Perto</button><button type="button" data-v="longe">🧊 Longe</button><button type="button" data-v="digitar">✏️ Digitar</button><button type="button" class="cp-x" data-v="x" aria-label="Fechar">✕</button>`;
  const nome = p.name;
  let fecharRef = null;
  const armarFechar = (ms, aoFechar) => {
    clearTimeout(fecharRef);
    fecharRef = setTimeout(() => {
      if (!d.parentNode) return;
      d.remove();
      if (aoFechar) aoFechar();
    }, ms);
  };
  // 2º passo (1.7.6.7): depois de Perto/Longe ainda dá pra digitar o chute. Se digitar, o C.A.O.S.
  // comenta o chute; se não, comenta o Perto/Longe. Nunca os dois seguidos.
  const segundoPasso = (v) => {
    caosPerguntaRegistrar(nome, v);
    const falar = () => caosPerguntaResposta(nome, v, true);
    d.innerHTML = `<span>${v === "perto" ? "🔥 Perto!" : "🧊 Longe!"} Quer contar o que <b>${escapeHtml(nome)}</b> chutou?</span><button type="button" data-v2="digitar">✏️ Digitar o chute</button><button type="button" data-v2="nao">Não precisa</button>`;
    d.onclick = (ev) => {
      const bt = ev.target.closest("button");
      if (!bt) return;
      ev.stopPropagation();
      clearTimeout(fecharRef);
      d.remove();
      if (bt.dataset.v2 === "digitar") caosChuteDigitar(nome, falar);
      else falar();
    };
    armarFechar(25e3, falar);
  };
  d.addEventListener("click", (ev) => {
    if (d.onclick) return;
    const bt = ev.target.closest("button");
    if (!bt) return;
    ev.stopPropagation();
    const v = bt.dataset.v;
    if (v === "perto" || v === "longe") return segundoPasso(v);
    clearTimeout(fecharRef);
    d.remove();
    if (v === "digitar") caosChuteDigitar(nome);
  });
  document.body.appendChild(d);
  // Tempo pro Mestre pensar se quer responder (era 9 s).
  armarFechar(25e3);
}
// Anota o Perto/Longe (memória da carta e humor), sem falar nada.
function caosPerguntaRegistrar(nome, v) {
  const p = players.find((q) => q.name === nome);
  if (!p) return;
  caosLog("perguntaMestre", `${nome}: ${v === "perto" ? "🔥 perto" : "🧊 longe"}`);
  if (v === "perto") caosPertoCont[nome] = (caosPertoCont[nome] || 0) + 1;
  caosEmoNudge(v === "perto" ? -0.2 : 0.3, v === "perto" ? 0.3 : 0);
}
function caosPerguntaResposta(nome, v, jaRegistrado) {
  const p = players.find((q) => q.name === nome);
  if (!p || gameEnded) return;
  if (!jaRegistrado) caosPerguntaRegistrar(nome, v);
  const suave = playerHumor(p) === "suave",
    B = REACTIVE_VOICE.perguntaMestre;
  const bank =
    v === "perto"
      ? suave
        ? B.pertoSuave
        : caosPertoCont[nome] >= 2
          ? B.eternoQuase
          : B.perto
      : suave
        ? B.longeSuave
        : B.longe;
  const mestre = players[mestreIndex] ? players[mestreIndex].name : "o Mestre";
  caosFalarDepois(getRandomReaction(bank, nome, mestre));
}
function caosCatDaCarta(c) {
  if (!c) return null;
  const k = CURRENT_MODE === "junior" ? c.category : gemCategoryFor(c.category);
  return k;
}
function caosImplicFlip() {
  if (CURRENT_MODE === "express" || gameEnded || !currentCard) return;
  if (!caosImplic) {
    const cats = [...new Set(deck.concat([currentCard]).map(caosCatDaCarta).filter(Boolean))];
    caosImplic =
      cats.length >= 2 && Math.random() < 0.75
        ? {
            cat: cats[Math.floor(Math.random() * cats.length)],
            ativa: true,
            anunciado: false,
            cartas: 0,
            avisei: false,
            dislikes: 0,
            anunciadoEm: -99,
          }
        : { ativa: false };
    if (caosImplic.ativa) caosLog("implicancia", "sorteada: " + caosImplic.cat);
  }
  const I = caosImplic;
  if (!I.ativa) return;
  if (!I.anunciado && stats.totalDrawn >= 2) {
    I.anunciado = true;
    I.anunciadoEm = stats.totalDrawn;
    caosFalarDepois(getRandomReaction(REACTIVE_VOICE.implicancia.anuncio, I.cat));
    return;
  }
  if (
    I.anunciado &&
    I.cartas < 2 &&
    stats.totalDrawn - I.anunciadoEm >= 2 &&
    caosCatDaCarta(currentCard) === I.cat &&
    Math.random() < 0.35
  ) {
    I.cartas++;
    caosFalarDepois(getRandomReaction(REACTIVE_VOICE.implicancia.carta, I.cat));
  }
}
function caosImplicFim(dicas) {
  const I = caosImplic;
  if (!I || !I.ativa || !I.anunciado || I.avisei || !currentCard) return;
  if (dicas >= 8 && caosCatDaCarta(currentCard) === I.cat && Math.random() < 0.6) {
    I.avisei = true;
    caosFalarDepois(getRandomReaction(REACTIVE_VOICE.implicancia.avisei, I.cat));
  }
}
function caosImplicLargar() {
  const I = caosImplic;
  if (!I || !I.ativa) return;
  I.ativa = false;
  caosLog("implicancia", "largada por 👎: " + I.cat);
  caosFalarDepois(getRandomReaction(REACTIVE_VOICE.implicancia.larguei, I.cat));
}
function caosSilencioTalvez(msg) {
  if (
    !caosSilencio.ok ||
    caosSilencio.usado ||
    gameEnded ||
    typeof msg !== "string" ||
    msg.indexOf("[C.A.O.S.]") === -1
  )
    return null;
  if (
    stats.totalDrawn < 6 ||
    !caosLastPick ||
    !/^(erro|erroComDica|erroComDicaNumero|erroComDicaCurta|acerto|acertoPorDicas|gerador\.)/.test(
      String(caosLastPick.bank),
    )
  )
    return null;
  if (Math.random() > 0.12) return null;
  caosSilencio.usado = true;
  const txt = getRandomReaction(REACTIVE_VOICE.silencio);
  caosLog("silencio", "escolheu não comentar (" + caosLastPick.bank + ")");
  caosLastPick = { bank: "silencio", key: "silencio|" + txt.slice(0, 40), text: txt };
  return txt;
}
function caosSplashFrases() {
  const h = new Date().getHours();
  const oi =
    h < 5
      ? ["espiando", "Madrugada e vocês aqui. Respeito."]
      : h < 12
        ? ["carinho", "Bom dia! Café e Perfil?"]
        : h < 18
          ? ["carinho", "Boa tarde! Bora uma partida?"]
          : ["desafio", "Boa noite! Partida rápida? (Nunca é rápida.)"];
  return [
    oi,
    ["espiando", "Tô de olho em quem vai ganhar hoje."],
    ["orgulho", "Eu comento. Vocês entretêm. Parceria justa."],
    ["desafio", "Aposto que ninguém acerta na 1ª dica."],
    ["festa", "Hoje tem joia, hein?"],
    ["julgando", "Vão começar sem ver o tutorial? Corajosos."],
    ["ombros", "Regras? Eu só narro."],
    ["tedio", "Tô esperando alguém tocar em Jogar…"],
  ];
}
function caosSplashMostrar(el, i) {
  const L = caosSplashFrases(),
    [emo, txt] = L[((i % L.length) + L.length) % L.length],
    E = CAOS_EMOS[emo] || CAOS_EMOS.calmo;
  el.dataset.emo = emo;
  el.style.setProperty("--emo-cor", E.cor);
  const f = el.querySelector(".sc-face"),
    t = el.querySelector(".sc-txt");
  el._frames = caosFaceEscolher(emo);
  if (f) f.textContent = el._frames[0];
  if (t) t.textContent = txt;
}
function caosSplashTick(el, t) {
  if (!caosSplashAt) caosSplashAt = t;
  if (t - caosSplashAt > 9e3) {
    caosSplashAt = t;
    caosSplashMostrar(el, ++caosSplashIdx);
  }
  const E = CAOS_EMOS[el.dataset.emo] || CAOS_EMOS.calmo,
    f = el.querySelector(".sc-face");
  const fs = el._frames || [E.faces[0]];
  if (f) {
    const fr = fs[Math.floor(t / (E.fr * 1.8)) % fs.length];
    if (f.textContent !== fr) f.textContent = fr;
  }
  el.style.setProperty("--emo-k", ((E.amp * (1 - Math.cos((t / E.per) * 2 * Math.PI))) / 2).toFixed(3));
}
function caosDicaRepetida(idx) {
  if (!currentCard || gameEnded || cardState !== "revealed" || pendingIndex !== null) return;
  const agora = Date.now();
  if (agora - caosRepetidaAt < 6e3 || caosRepetidaN >= 4) return;
  const e = revealedOrder.find((r) => r.index === idx);
  const v = players[responderIndex];
  if (!e || !v) return;
  caosRepetidaAt = agora;
  caosRepetidaN++;
  const B = REACTIVE_VOICE.dicaRepetida,
    dono = e.pickedByName || "alguém";
  let bank =
    playerHumor(v) === "suave" ? (dono === v.name ? B.suavePropria : B.suave) : dono === v.name ? B.propria : B.normal;
  if (bank === B.normal && (isJfName(v.name) || isAnneName(v.name)) && Math.random() < 0.6)
    bank = isJfName(v.name) ? B.sonso : B.sonsa;
  caosLog("dicaRepetida", `${v.name} tocou na dica ${idx + 1} (pedida por ${dono})`);
  showToastMessage(getRandomReaction(bank, v.name, dono), null, false, false, true);
}
function caosBezier(c, x) {
  if (x <= 0 || x >= 1) return x;
  const [x1, y1, x2, y2] = c,
    B = (t2, a, b) => 3 * a * t2 * (1 - t2) * (1 - t2) + 3 * b * t2 * t2 * (1 - t2) + t2 * t2 * t2;
  let t = x;
  for (let i = 0; i < 6; i++) {
    const dx = B(t, x1, x2) - x,
      d = 3 * x1 * (1 - t) * (1 - t) + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
    if (Math.abs(dx) < 1e-4 || Math.abs(d) < 1e-6) break;
    t -= dx / d;
  }
  if (t < 0 || t > 1 || Math.abs(B(t, x1, x2) - x) > 0.001) {
    let a = 0,
      b = 1;
    t = x;
    for (let i = 0; i < 20; i++) {
      const v = B(t, x1, x2);
      if (Math.abs(v - x) < 1e-4) break;
      if (v < x) a = t;
      else b = t;
      t = (a + b) / 2;
    }
  }
  return B(t, y1, y2);
}
function caosMistura(a, b, k) {
  if (typeof a === "number" && typeof b === "number") return +(a + (b - a) * k).toFixed(4);
  const sa = String(a),
    sb = String(b),
    na = sa.match(CAOS_NUM_RE) || [],
    nb = sb.match(CAOS_NUM_RE) || [];
  if (na.length !== nb.length || sa.replace(CAOS_NUM_RE, "#") !== sb.replace(CAOS_NUM_RE, "#"))
    return k < 0.5 ? sa : sb;
  let i = 0;
  return sa.replace(CAOS_NUM_RE, () => {
    const v = +na[i] + (+nb[i] - +na[i]) * k;
    i++;
    return String(+v.toFixed(4));
  });
}
function caosQuadro(spec, p) {
  const out = {},
    fr = spec.frames,
    ease = Array.isArray(spec.ease) ? spec.ease : CAOS_EASE[spec.ease] || CAOS_EASE.ease;
  const props = new Set();
  fr.forEach((f) => Object.keys(f[1]).forEach((k) => props.add(k)));
  props.forEach((prop) => {
    const tem = fr.filter((f) => prop in f[1]);
    let a = tem[0],
      b = tem[tem.length - 1];
    for (let i = 0; i < tem.length - 1; i++)
      if (p >= tem[i][0] && p <= tem[i + 1][0]) {
        a = tem[i];
        b = tem[i + 1];
        break;
      }
    if (p <= tem[0][0]) {
      out[prop] = tem[0][1][prop];
      return;
    }
    if (p >= b[0] && b === tem[tem.length - 1]) {
      out[prop] = b[1][prop];
      return;
    }
    const k = b[0] > a[0] ? caosBezier(ease, (p - a[0]) / (b[0] - a[0])) : 1;
    out[prop] = caosMistura(a[1][prop], b[1][prop], k);
  });
  return out;
}
function caosAnimPintar(el, q) {
  for (const k in q)
    el.style.setProperty(
      k,
      typeof q[k] === "number" && !k.startsWith("--") && k !== "opacity" ? q[k] + "px" : String(q[k]),
    );
}
function caosAnimParar(el, completou) {
  const r = caosAnimRodando.get(el);
  if (!r) return;
  caosAnimRodando.delete(el);
  if (!(completou && r.spec.fill))
    for (const k in r.orig) {
      if (r.orig[k]) el.style.setProperty(k, r.orig[k]);
      else el.style.removeProperty(k);
    }
  if (typeof r.fim === "function") {
    try {
      r.fim();
    } catch (e) {}
  }
}
function caosAnimTick(t) {
  caosAnimRaf = 0;
  caosAnimRodando.forEach((r, el) => {
    if (!el.isConnected || (r.sel && !el.matches(r.sel))) return caosAnimParar(el, false);
    const dt = t - r.t0 - (r.spec.delay || 0);
    if (dt < 0) return;
    let p = dt / r.spec.dur;
    if (r.spec.loop) p = p % 1;
    else if (p >= 1) {
      caosAnimPintar(el, caosQuadro(r.spec, 1));
      return caosAnimParar(el, true);
    }
    caosAnimPintar(el, caosQuadro(r.spec, p));
  });
  if (caosAnimRodando.size) caosAnimRaf = requestAnimationFrame(caosAnimTick);
}
function caosAnimar(el, spec, fim, sel) {
  try {
    if (!el) return;
    if (typeof spec === "string") spec = CAOS_ANIMS[spec];
    if (!spec) return;
    // Batata: nada anima. Menos movimento (1.7.9.5): só o que desloca, gira ou muda de tamanho
    // fica de fora; troca de cor e de brilho continua.
    const mexe = () => spec.frames.some((f) => ["transform", "translate", "rotate", "scale", "top", "left"].some((k) => k in f[1]));
    if (document.body.classList.contains("batata-mode") || (typeof movimentoReduzido === "function" && movimentoReduzido() && mexe())) {
      if (typeof fim === "function") fim();
      return;
    }
    caosAnimParar(el, false);
    const orig = {};
    spec.frames.forEach((f) =>
      Object.keys(f[1]).forEach((k) => {
        if (!(k in orig)) orig[k] = el.style.getPropertyValue(k);
      }),
    );
    const agora = performance.now();
    caosAnimRodando.set(el, { spec, t0: agora, orig, fim, sel });
    caosAnimPintar(el, caosQuadro(spec, 0));
    if (!caosAnimRaf) caosAnimRaf = requestAnimationFrame(caosAnimTick);
  } catch (e) {}
}
function caosIniExplica(p, tipo, ...args) {
  if (!p || !p.iniciante || !p.ini || gameEnded) return;
  const k = "x_" + tipo,
    feitas = p.ini.feitas || (p.ini.feitas = []);
  if (feitas.includes(k) || feitas.filter((x) => x.startsWith("x_")).length >= 8) return;
  const bank = REACTIVE_VOICE.iniciante.explica[tipo];
  if (!bank) return;
  feitas.push(k);
  caosLog("iniciante", `${p.name}: explicação "${tipo}"`);
  caosFalarDepois(getRandomReaction(bank, p.name, ...args));
  saveGameState();
}
function caosIniExplicaEspecial(p, texto) {
  if (!p || !p.iniciante) return;
  const t = String(texto || "").toLowerCase();
  if (/escolha um jogador para voltar/.test(t)) caosIniExplica(p, "escolherVoltar");
  else if (/escolha um jogador para avan/.test(t)) caosIniExplica(p, "escolherAvancar");
  else if (/^avance/.test(t)) caosIniExplica(p, "avancar");
  else if (/^volte/.test(t)) caosIniExplica(p, "voltar");
  else if (/perca sua vez/.test(t)) caosIniExplica(p, "perca");
}
function caosIniAjuda(p) {
  if (!p || !p.iniciante || gameEnded || stats.totalDrawn > 3 || CURRENT_MODE === "express") return "";
  caosMesa.iniErros = caosMesa.iniErros || {};
  const n = (caosMesa.iniErros[p.name] = (caosMesa.iniErros[p.name] || 0) + 1);
  if (n < 2 || !caosOncePerMatch("ini_ajuda_" + p.name)) return "";
  const m = players[mestreIndex];
  if (m && m !== p)
    setTimeout(() => caosBilheteMestre(getRandomReaction(REACTIVE_VOICE.iniciante.bilheteMestre, m.name, p.name)), 900);
  caosLog("iniciante", `${p.name}: ajuda direta (travou nas primeiras cartas)`);
  return getRandomReaction(REACTIVE_VOICE.iniciante.ajuda, p.name);
}
function caosBilheteMestre(txt) {
  if (!txt || gameEnded) return;
  document.getElementById("caosBilhete")?.remove();
  const d = document.createElement("div");
  d.id = "caosBilhete";
  d.className = "caos-bilhete";
  d.setAttribute("role", "note");
  const t = document.createElement("div");
  t.className = "caos-bilhete-tit";
  t.textContent = "🤫 Só pro Mestre ler (não lê em voz alta!)";
  const c = document.createElement("div");
  c.textContent = "🤖 " + String(txt).replace(/^\[C\.A\.O\.S\.\]\s*/, "");
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = "Li ✓";
  b.addEventListener("click", () => d.remove());
  d.append(t, c, b);
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 14e3);
}
function caosAntiRepeticao() {
  if (deck.length < 2) return;
  // nenhuma categoria sai mais de 2 vezes seguidas (no Express, com 1 ou 2 categorias, a regra é a de antes)
  const lim = 2,
    cat = (c) => gemCategoryFor(c.category);
  const cnt = {};
  deck.forEach((c) => {
    const k = cat(c);
    cnt[k] = (cnt[k] || 0) + 1;
  });
  const ult = caosCatSeq.slice(-lim),
    runCat = ult.length === lim && ult.every((x) => x === ult[0]) ? ult[0] : null;
  const topo = deck.length - 1,
    topCat = cat(deck[topo]);
  const ordem = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]),
    D = ordem[0],
    nD = cnt[D],
    nO = deck.length - nD;
  let alvo = null;
  if (runCat && topCat === runCat) alvo = ordem.find((k) => k !== runCat) || null;
  else if (D !== topCat && D !== runCat && nD > lim * nO) alvo = D;
  if (!alvo || alvo === topCat) return;
  for (let j = topo - 1; j >= 0; j--) {
    if (cat(deck[j]) === alvo) {
      const t = deck[topo];
      deck[topo] = deck[j];
      deck[j] = t;
      caosLog("baralho", `anti-repetição: puxei ${alvo} pra frente`);
      return;
    }
  }
}
