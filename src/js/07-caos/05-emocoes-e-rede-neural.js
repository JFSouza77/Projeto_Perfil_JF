function caosGradLoop(color) {
  const cs = String(GRADIENTS[color] || "").match(/#[0-9a-fA-F]{3,8}/g) || [];
  return cs.length >= 2 ? `linear-gradient(90deg, ${cs.join(", ")}, ${cs[0]})` : GRADIENTS[color] || "";
}
function caosEixosReset() {
  caosEixos = { alegria: 0, confianca: 0, curiosidade: 0 };
  caosEixosCats = [];
  caosMesaIntimCache = null;
}
function caosEixosDaFala(bank) {
  const b = String(bank || ""),
    cl = (v) => Math.max(-10, Math.min(10, v));
  if (/^(joia|sequenciaAcertos|acertoVirada|acertoRecuperacao|recorde|marco100)/.test(b))
    caosEixos.alegria = cl(caosEixos.alegria + 2);
  if (/^(bolaCristalAcerto|previsaoCartaAcertou)/.test(b)) caosEixos.confianca = cl(caosEixos.confianca + 3);
  if (/^(bolaCristalErro|previsaoCartaCategoriaErrada|previsaoCartaPassouPerto)/.test(b))
    caosEixos.confianca = cl(caosEixos.confianca - 3);
}
function caosEixosCarta() {
  let novo = false;
  caosEixos.alegria *= 0.8;
  caosEixos.confianca *= 0.9;
  caosEixos.curiosidade *= 0.75;
  try {
    const c = currentCard && caosCatDaCarta(currentCard);
    if (c) {
      novo = !caosEixosCats.slice(-3).includes(c);
      if (novo) caosEixos.curiosidade = Math.min(10, caosEixos.curiosidade + 1.5);
      caosEixosCats.push(c);
    }
  } catch (e) {}
  caosConsoleCarta(novo);
}
function caosMesaIntim() {
  if (caosMesaIntimCache !== null) return caosMesaIntimCache;
  try {
    const ps = players.map((p) => (memContaFicha(p) && fichaGet(p.name) ? fichaGet(p.name).partidas : 0));
    const m = ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 0;
    caosMesaIntimCache = m >= 10 ? 0.15 : m < 2 ? -0.15 : 0;
  } catch (e) {
    caosMesaIntimCache = 0;
  }
  return caosMesaIntimCache;
}
function caosHumorScores() {
  const cl = (x) => Math.max(0, Math.min(1, x));
  const t = (caosEmo.tensao ?? 5) / 10,
    c = (caosEmo.calor ?? 5) / 10,
    p = (caosEmo.paciencia ?? 7) / 10;
  const sT = cl((t - 0.5) / 0.5),
    sTlow = cl((0.6 - t) / 0.6),
    sChi = cl((c - 0.55) / 0.45),
    sClo = cl((0.55 - c) / 0.55);
  return {
    raiva: Math.max(
      Math.pow(sT, 0.8) * Math.pow(1 - p, 0.8) * (0.7 + 0.3 * sClo),
      Math.pow(cl((0.25 - p) / 0.25), 1.5) * 0.45,
    ),
    preocupado: sT * Math.pow(p, 1.2) * 0.75,
    tedio: sTlow * Math.max(sClo * Math.pow(1 - p, 0.5), Math.pow(1 - p, 2) * 0.7),
    orgulho: sChi * cl(sTlow + 0.35) * Math.pow(p, 0.7),
    desafio: cl((t - 0.45) / 0.55) * cl((c - 0.5) / 0.5) * Math.pow(p, 0.5),
    festa: cl((caosEixos.alegria || 0) / 10) * (0.5 + 0.5 * p),
    espiando: cl((caosEixos.curiosidade || 0) / 10) * 0.8,
  };
}
function caosHumorContinuo() {
  const S = caosHumorScores();
  let top = "calmo",
    v = 0;
  const ks = ["raiva", "preocupado", "desafio", "orgulho", "tedio", "festa", "espiando"];
  ks.forEach((k) => {
    if (S[k] >= (k === "raiva" ? 0.3 : 0.35) && S[k] > v) {
      v = S[k];
      top = k;
    }
  });
  let sec = null,
    v2 = 0.3;
  ks.forEach((k) => {
    if (k !== top && S[k] > v2) {
      v2 = S[k];
      sec = k;
    }
  });
  return { emo: top, k: top === "calmo" ? 0 : v, sec, k2: sec ? v2 : 0 };
}
function caosEmocaoGlobalLegado() {
  let e = "calmo";
  try {
    const h = caosHumorContinuo();
    e = h.sec && Math.random() < h.k2 / (h.k + h.k2 || 1) ? h.sec : h.emo;
  } catch (err) {
    e = "calmo";
  }
  return e;
}
function caosConsoleReset() {
  const on = caosConsole
    ? caosConsole.on
    : (() => {
        try {
          return JFStore.getItem("perfil5_caos_console") !== "0";
        } catch (e) {
          return true;
        }
      })();
  const g = {};
  Object.keys(CAOS_CONSOLE).forEach((k) => {
    g[k] = 0;
  });
  caosConsole = {
    on,
    g,
    atual: "calmo",
    dwell: 0,
    mostra: "calmo",
    mostraMed: "calmo",
    mist: null,
    seqOk: 0,
    seqErr: 0,
    ultEv: "",
    log: [],
    hist: [],
    legMostra: "calmo",
    legN: 0,
  };
}
function caosConsoleLog(txt) {
  try {
    caosConsole.log.push(`c${typeof stats !== "undefined" && stats ? stats.totalDrawn : 0} · ${txt}`);
    if (caosConsole.log.length > 30) caosConsole.log.shift();
  } catch (e) {}
}
function caosSentir(emo, v, motivo) {
  try {
    const C = caosConsole,
      M = CAOS_CONSOLE[emo];
    if (!C || !M || !(v > 0)) return;
    const t = caosEmo.tensao ?? 5,
      c = caosEmo.calor ?? 5,
      p = caosEmo.paciencia ?? 7,
      T = caosTemper || {};
    let k = 1;
    if (emo === "raiva") k = (1 + Math.max(0, 7 - p) * 0.12) * (1 + (T.t || 0) * 0.15);
    else if (emo === "ansiedade") k = (1 + Math.max(0, 7 - p) * 0.08) * (1 + (t - 5) * 0.08);
    else if (emo === "medo") k = 1 + (t - 5) * 0.1;
    else if (emo === "alegria") k = 1 + (c - 5) * 0.08 + (T.c || 0) * 0.1;
    else if (emo === "carinho") k = 1 + (c - 5) * 0.06;
    else if (emo === "tedio") k = Math.max(0.4, Math.min(1.3, (9 - c) / 4));
    if (/demora/.test(String(motivo || "")) && T.pac && (emo === "raiva" || emo === "ansiedade")) k *= T.pac;
    k = emo === "tedio" ? k : Math.max(0.2, k);
    const antes = C.g[emo],
      sat = Math.max(0, 1 - antes / M.teto);
    C.g[emo] = Math.min(M.teto, antes + v * k * sat);
    if (C.g[emo] - antes >= 0.5) caosConsoleLog(`${M.ic} ${emo} +${(C.g[emo] - antes).toFixed(1)} (${motivo || "?"})`);
  } catch (e) {}
}
function caosTedioTick() {
  try {
    if (
      CURRENT_MODE === "express" ||
      gameEnded ||
      activeToastState ||
      cardState !== "revealed" ||
      !stats ||
      stats.totalDrawn < 1
    )
      return;
    if (document.getElementById("pauseScreen").style.display === "block") {
      caosUltEventoAt = Date.now();
      return;
    }
    const agora = Date.now();
    if (agora - Math.max(caosUltEventoAt, caosUltimaFalaAt || 0) < CAOS_TEDIO_OCIOSO_MS) return;
    caosUltEventoAt = agora;
    caosSentir("tedio", 1, "30 s sem evento na mesa");
  } catch (e) {}
}
function caosConsoleCarta(novo) {
  try {
    caosUltEventoAt = Date.now();
    const C = caosConsole;
    if (!C) return;
    Object.keys(C.g).forEach((k) => {
      // a emoção que manda cai mais devagar (estabiliza nela e se acalma aos poucos)
      const dec = k === C.atual ? 1 - (1 - CAOS_CONSOLE[k].dec) * CAOS_CONSOLE_CFG.segura : CAOS_CONSOLE[k].dec;
      C.g[k] = Math.max(0, C.g[k] * dec);
      if (C.g[k] < 0.05) C.g[k] = 0;
    });
    // 1.7.5.1: tédio de rotina só vem de pulo (antes vinha de todo erro, e erro em série
    // deixava o C.A.O.S. entediado em vez de irritado ou magoado). Erro em série longo
    // (6 ou mais) ainda cansa um pouco: "a mesa empacou".
    if (novo) caosSentir("curiosidade", 2, "categoria nova");
    else if (C.ultEv === "P") caosSentir("tedio", 1.2, "rotina");
    else if (C.ultEv === "E" && C.seqErr >= 6) caosSentir("tedio", 0.5, "a mesa empacou");
    if (
      typeof gameEnded !== "undefined" &&
      !gameEnded &&
      typeof caosMomentoCritico === "function" &&
      caosMomentoCritico()
    ) {
      caosSentir("ansiedade", 1, "reta final");
      caosSentir("medo", 1.2, "reta final");
      try {
        if (
          players.some(
            (p) =>
              p && typeof p.position === "number" && WINNING_SCORE - p.position > 0 && WINNING_SCORE - p.position <= 3,
          )
        )
          caosSentir("medo", 1.5, "alguém a 3 casas");
      } catch (e) {}
    }
  } catch (e) {}
}
function caosConsoleEvento(idx, ev) {
  try {
    caosUltEventoAt = Date.now();
    const C = caosConsole;
    if (!C) return;
    const p = players[idx],
      nm = p && p.name,
      fav = nm && caosVinc && caosVinc.fav === nm,
      des = nm && caosVinc && caosVinc.desafeto === nm;
    if (ev === "A" || ev === "a") {
      C.seqOk++;
      C.seqErr = 0;
      caosSentir("alegria", (ev === "a" ? 1 : 0.7) * (des ? 0.6 : 1), "acerto");
      if (C.seqOk >= 3 && C.seqOk % 2 === 1) caosSentir("alegria", 1.2, "sequência de acertos");
      if (fav) caosSentir("carinho", 0.5, "favorito acertou");
      if (p && playerHumor(p) === "suave") caosSentir("carinho", humorFamilia(p) ? 1 : 0.6, "acerto de jogador Suave");
      C.g.raiva = Math.max(0, (C.g.raiva || 0) - 1.2);
      if (des) caosSentir("nojo", 0.4, "elogio contrariado");
    } else if (ev === "E" || ev === "X") {
      C.seqErr++;
      C.seqOk = 0;
      caosPacienciaNudge(ev === "X" ? -0.5 : C.seqErr >= 3 ? -0.5 : C.seqErr === 2 ? -0.3 : -0.15);
      caosSentir(
        "raiva",
        (ev === "X" ? 0.5 : 1.25) *
          (fav ? 0.5 : des ? 1.3 : 1) *
          (p && playerHumor(p) === "suave" ? 0.5 : 1) *
          (1 / (1 + 0.18 * Math.max(0, (C.g.raiva || 0) - 3))),
        ev === "X" ? "absurdo" : "erro",
      );
      if (p && playerHumor(p) === "suave") caosSentir("carinho", 0.3, "erro de jogador Suave");
      if (ev === "X") caosSentir("nojo", 3.5, "absurdo");
      if (C.seqErr === 3) caosSentir("tristeza", 2, "erros seguidos");
      else if (C.seqErr > 3) caosSentir("tristeza", 1.2, "erros seguidos");
      if (des && ev === "E") caosSentir("nojo", 0.6, "desafeto errou");
    } else if (ev === "P") {
      C.seqOk = 0;
      caosPacienciaNudge(-0.15);
      caosSentir("tedio", 0.6, "pulou");
      if (p && p.emo && /PP$/.test(p.emo.h || "")) caosSentir("nojo", 1.5, "pulos seguidos");
    }
    C.ultEv = ev === "a" ? "A" : ev;
  } catch (e) {}
}
function caosConsoleDaFala(bank) {
  const b = String(bank || "");
  if (!b || !caosConsole) return;
  if (/^(joia|vitoria|recorde|marco100|acertoVirada)/.test(b)) caosSentir("alegria", 3, b.split(".")[0]);
  else if (/^sequenciaAcertos/.test(b)) caosSentir("alegria", 2, "sequência");
  else if (/^(bolaCristalAcerto|previsaoCartaAcertou|mesa\.apostaAcertou)/.test(b))
    caosSentir("alegria", 1.5, "previsão certa");
  if (/^erroEscalada/.test(b)) caosSentir("tristeza", 1.5, "erro em escalada");
  if (/^surpresaErroFacil/.test(b)) caosSentir("raiva", 1.5, "erro fácil");
  if (/^(erroDemorou|jogadorLento|tempoPessoalLento)/.test(b)) {
    caosSentir("raiva", 0.8, "demora");
    caosSentir("tedio", 1.2, "demora");
    caosSentir("ansiedade", 0.5, "demora");
  }
  if (/^(avisoTempo|avisoCarta|metadeDaCarta|dicasProgresso)/.test(b)) caosSentir("ansiedade", 1.2, "esperando");
  if (/^agonia15Dicas/.test(b)) {
    caosSentir("ansiedade", 2, "agonia");
    caosSentir("medo", 1.5, "agonia");
  }
  if (/^perguntaMestre\./.test(b)) caosSentir("ansiedade", 1, "pergunta ao Mestre");
  if (/^retaFinal/.test(b)) {
    caosSentir("medo", 3, "reta final");
    caosSentir("ansiedade", 2, "reta final");
  }
  if (/^pausaVolta\.magoado/.test(b)) caosSentir("tristeza", 3, "pausa longa");
  if (/^pausaVolta\.puto/.test(b)) {
    caosSentir("raiva", 3, "pausa longuíssima");
    caosSentir("tristeza", 1.5, "pausa longuíssima");
  }
  if (/^(caosCortado|naoCurti)/.test(b)) {
    caosSentir("tristeza", 1.5, "cortado/👎");
    caosSentir("raiva", 1, "cortado/👎");
  }
  if (/^(caosSaiuDaPartida|caosSaiuTemporario)/.test(b)) caosSentir("tristeza", 3, "silenciado");
  if (/^(bolaCristalErro|previsaoCartaCategoriaErrada|previsaoCartaPassouPerto)/.test(b))
    caosSentir("vergonha", 4, "previsão errada");
  if (/^mesa\.apostaErrou/.test(b)) caosSentir("vergonha", 5.5, "aposta errada");
  if (/^(carinho|iniciante|boasVindas|jfInicio|vinculo\.defesaFav|nickSugestaoAceita|satisfacao\.ok)/.test(b))
    caosSentir("carinho", 1.8, b.split(".")[0]);
  if (/^vinculo\.elogioContrariado/.test(b)) {
    caosSentir("nojo", 1, "elogio contrariado");
    caosSentir("alegria", 0.8, "elogio contrariado");
  }
  if (/^(entediado|mesaDormindo|partidaLonga|caosCansado|caosExausto)/.test(b)) caosSentir("tedio", 1.4, "mesa parada");
  if (/^(inicioJogadores|boasVindas|nickReacao)/.test(b)) caosSentir("curiosidade", 1, "gente nova");
}
function caosConsoleRosto(med) {
  const g = caosConsole ? caosConsole.g : {};
  if (med === "alegria") return g.alegria >= 6.5 ? "festa" : "orgulho";
  if (med === "raiva") return g.raiva >= 8.5 ? "furia" : "raiva";
  return (
    {
      tristeza: "triste",
      curiosidade: "espiando",
      medo: "medo",
      nojo: "nojo",
      ansiedade: "ansiedade",
      tedio: "tedio",
      vergonha: "vergonha",
      carinho: "carinho",
    }[med] || "calmo"
  );
}
function caosConsoleMistura() {
  const g = caosConsole.g,
    ord = Object.keys(g).sort((a2, b2) => g[b2] - g[a2]),
    a = ord[0],
    b = ord[1];
  // 4.0: mistura a partir de 70% do limiar (antes 80%): as misturas aparecem com mais frequência
  if (!(g[a] >= CAOS_CONSOLE_CFG.limiar * 0.7 && g[b] >= CAOS_CONSOLE_CFG.limiar * 0.7)) return null;
  const m = CAOS_CONSOLE_MISTURAS.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
  return m ? m[2] : null;
}
function caosConsoleAvancar(bank) {
  try {
    const C = caosConsole,
      F = CAOS_CONSOLE_CFG,
      b = String(bank || ""),
      livre = CAOS_ESCADA_LIVRE.test(b) || (typeof gameEnded !== "undefined" && gameEnded);
    const leg = caosEmocaoGlobalLegado();
    if (leg !== C.legMostra && (C.legN >= F.dwell || livre)) {
      C.legMostra = leg;
      C.legN = 0;
    }
    C.legN++;
    const g = C.g,
      ord = Object.keys(g).sort((x, y) => g[y] - g[x]);
    let top = ord[0];
    const v = g[top];
    if (v < F.limiar) top = "calmo";
    const grave = g.medo >= 7 || g.nojo >= 7 || g.vergonha >= 7;
    if (top !== C.atual) {
      const vA = C.atual === "calmo" ? F.limiar : g[C.atual];
      const passa = top === "calmo" ? vA < F.saida : C.atual === "calmo" || v - vA >= F.margem || vA < F.saida;
      if ((C.dwell >= F.dwell || grave || livre) && passa) {
        caosConsoleLog(`🎚️ ${C.atual} → ${top}`);
        C.atual = top;
        C.dwell = 0;
      }
    } else if (C.atual !== "calmo" && g[C.atual] < F.saida && C.dwell >= F.dwell) {
      C.atual = "calmo";
      C.dwell = 0;
    }
    C.dwell++;
    let mostra = C.atual;
    if (C.atual !== "calmo" && F.pMistura > 0) {
      const sec = ord.find((k) => k !== C.atual);
      if (
        sec &&
        g[sec] >= F.mistura * g[C.atual] &&
        g[sec] >= F.saida &&
        Math.random() < (F.pMistura * g[sec]) / g[C.atual]
      )
        mostra = sec;
    }
    const mi = caosConsoleMistura();
    if (mi && mi !== C.mist) caosConsoleLog("🎨 mistura: " + mi);
    C.mist = mi;
    C.mostraMed = mostra;
    C.mostra = caosConsoleRosto(mostra);
    C.hist.push(C.mostra);
    if (C.hist.length > 60) C.hist.shift();
  } catch (e) {}
}
function caosConsoleTingir(e, bank) {
  try {
    const C = caosConsole;
    if (!C || !C.on || C.atual === "calmo" || !e || e === C.mostra) return e;
    if (CAOS_ESCADA_LIVRE.test(String(bank || "")) || (typeof gameEnded !== "undefined" && gameEnded)) return e;
    const med = C.mostraMed,
      ok = (CAOS_TOM_POS.has(e) && CAOS_MED_POS.has(med)) || (CAOS_TOM_NEG.has(e) && CAOS_MED_NEG.has(med));
    if (!ok || !caosEmoVizinhos(e).has(C.mostra)) return e;
    const pr = Math.min(0.35, 0.1 + (C.g[med] - CAOS_CONSOLE_CFG.limiar) / 10);
    return Math.random() < pr ? C.mostra : e;
  } catch (err) {
    return e;
  }
}
function caosEmocaoGlobal() {
  let e = "calmo";
  try {
    e =
      caosConsole && caosConsole.on
        ? caosConsole.mostra
        : caosConsole && caosConsole.legN
          ? caosConsole.legMostra
          : caosEmocaoGlobalLegado();
  } catch (err) {
    e = "calmo";
  }
  if (e === "raiva" && typeof CURRENT_MODE !== "undefined" && CURRENT_MODE === "junior") e = "deboche";
  return e;
}
function caosSuaveAlvo(bank) {
  return (typeof CURRENT_MODE !== "undefined" && CURRENT_MODE === "junior") || /\.suave$/.test(String(bank || ""));
}
function caosConsoleSuavizar(e, bank) {
  if (!caosSuaveAlvo(bank)) return e;
  if (e === "raiva" || e === "furia") return "deboche";
  if (e === "nojo") return "ombros";
  if (e === "inveja") return "deboche";
  return e;
}
const caosEmoVizinhos = (e) => {
  const a = new Set((CAOS_EMO_VIZ[e] || "").split(" ").filter(Boolean));
  Object.keys(CAOS_EMO_VIZ).forEach((k) => {
    if ((CAOS_EMO_VIZ[k] || "").split(" ").includes(e)) a.add(k);
  });
  return a;
};
function caosEscada(emo, bank, forte) {
  if (!emo || !CAOS_EMOS[emo]) return emo;
  const antes = caosEmoFalaAtual;
  let fim = emo;
  const livre = forte || gameEnded || CAOS_ESCADA_LIVRE.test(String(bank || ""));
  if (antes && antes !== emo && !livre) {
    if (!caosEmoVizinhos(antes).has(emo)) {
      const vis = { [antes]: null },
        fila = [antes];
      while (fila.length) {
        const x = fila.shift();
        if (x === emo) break;
        caosEmoVizinhos(x).forEach((y) => {
          if (!(y in vis)) {
            vis[y] = x;
            fila.push(y);
          }
        });
      }
      if (emo in vis) {
        let passo = emo;
        while (vis[passo] !== antes && vis[passo] !== null) passo = vis[passo];
        fim = passo;
      }
    }
    if (
      (antes === "raiva" || antes === "furia") &&
      !["raiva", "furia", "recompondo"].includes(fim) &&
      Math.random() < 0.5
    )
      fim = "recompondo";
  }
  if (CURRENT_MODE === "junior" && (fim === "raiva" || fim === "furia")) fim = "deboche";
  caosEmoFalaN = fim === antes ? caosEmoFalaN + 1 : 1;
  caosEmoFalaAtual = fim;
  return fim;
}
function caosEmocaoDaFala(bank) {
  caosConsoleAvancar(bank);
  let e = null;
  const b = String(bank || "");
  if (b.startsWith("gerador.")) {
    const [, tipo, prat] = b.split(".");
    e =
      tipo === "acerto"
        ? "orgulho"
        : tipo === "pular"
          ? "ombros"
          : prat === "acido" || prat === "zero"
            ? "raiva"
            : "deboche";
  } else if (b.startsWith("perguntaMestre.")) {
    const sub = b.split(".")[1];
    e = /Suave$/.test(sub) ? "carinho" : sub === "longe" ? "deboche" : "desafio";
  } else if (b.startsWith("pausaVolta."))
    e = { leve: "deboche", magoado: "triste", puto: "raiva" }[b.split(".")[1]] || "deboche";
  else if (b === "pausaCalmou") e = "alivio";
  else if (b.startsWith("memoria.reencontro")) e = "nostalgia";
  else if (b.startsWith("ausentes."))
    e = { ambos: "pensando", anne: "carinho", jf: "deboche" }[b.split(".")[1]] || "calmo";
  else if (b.startsWith("satisfacao."))
    e = { ok: "carinho", mais: "desafio", menos: "recompondo" }[b.split(".")[1]] || "calmo";
  else if (b.startsWith("vinculo."))
    e =
      {
        naoEVoce: "espiando",
        defesaFav: "carinho",
        elogioContrariado: "inveja",
        acusa: "julgando",
        voltaAtras: "recompondo",
      }[b.split(".")[1]] || "calmo";
  else if (b.startsWith("hall."))
    e = { elogio: "orgulho", zoeira: "deboche", comentario: "pensando", eu: "orgulho" }[b.split(".")[1]] || "pensando";
  else if (b.startsWith("virada.")) e = (caosViradaPend && caosViradaPend.de) || null;
  else if (b === "mesa.apostaErrou") e = "vergonha";
  else if (b.startsWith("matrizHumor."))
    e =
      { frustrado: "raiva", orgulhoso: "orgulho", entediado: "tedio", desafiante: "desafio" }[b.split(".")[1]] || null;
  else if (b) e = CAOS_EMO_POR_BANCO[b.split(".")[0]] || null;
  if (!e) e = caosEmocaoGlobal();
  else e = caosConsoleTingir(e, bank);
  if (e === "raiva" && typeof CURRENT_MODE !== "undefined" && CURRENT_MODE === "junior") e = "deboche";
  return caosConsoleSuavizar(e, bank);
}
function caosToastEmo(toast, emo, bank) {
  try {
    if (caosAnimRodando.has(toast)) caosAnimParar(toast, false);
  } catch (e) {}
  const E = emo && CAOS_EMOS[emo];
  toast.classList.toggle("caos-emo", !!E);
  try {
    const rt0 = toast.querySelector(".toast-rotulo");
    if (rt0) {
      if (E) rt0.textContent = E.nome;
      else rt0.remove();
    }
  } catch (e) {}
  if (!E) {
    delete toast.dataset.emo;
    delete toast.dataset.mist;
    toast._frames = null;
    toast.removeAttribute("data-face");
    toast.style.removeProperty("--emo-cor");
    toast.style.removeProperty("--emo-bg");
    return;
  }
  toast.dataset.emo = emo;
  toast._frames = caosFaceEscolher(emo, bank);
  // rosto de mistura: a etiqueta mostra o nome da mistura (aqui e em caosToastTexto)
  toast.dataset.mist = caosFaceMist || "";
  if (caosFaceMist)
    try {
      const rt1 = toast.querySelector(".toast-rotulo");
      if (rt1) rt1.textContent = caosFaceMist;
    } catch (e) {}
  const f0 = toast._frames[0];
  toast.setAttribute("data-face", f0);
  toast.dataset.fl = toast._frames.some((f) => f.length > 9) ? "1" : "";
  toast.style.setProperty("--emo-cor", E.cor);
  toast.style.setProperty("--emo-bg", E.bg);
}
function caosViradaLimpar() {
  caosViradaDesde = 99;
  caosViradaPend = null;
}
function caosViradaDecidir(msg, emo, bank, priority, tropecou) {
  try {
    if (typeof msg !== "string" || msg.indexOf("[C.A.O.S.]") === -1 || !emo || !CAOS_EMOS[emo] || priority || tropecou)
      return null;
    const forca = caosViradaForcar === "auto",
      b = String(bank || "");
    if (caosViradaForcar === "manual") return null;
    if (!forca && caosViradaDesde < CAOS_VIRADA_ESPACO) return null;
    const hall = /^hall\./.test(b);
    if (CAOS_ESCADA_LIVRE.test(b) && !hall) return null;
    if (typeof gameEnded !== "undefined" && gameEnded && !hall) return null;
    const chunks = caosSpeechChunks(caosSpeechText(msg));
    if (chunks.length < 2) return null;
    if (!forca && Math.random() >= CAOS_VIRADA_P_AUTO) return null;
    const C = typeof caosConsole !== "undefined" && caosConsole ? caosConsole : null;
    let cand = [...caosEmoVizinhos(emo)].filter((e) => CAOS_EMOS[e] && e !== emo && e !== "furia");
    cand = cand
      .map((e) => ({ e, p: caosConsoleSuavizar(e, b) }))
      .filter((x) => CAOS_EMOS[x.p] && x.p !== emo && x.p !== "furia");
    if (!cand.length) return null;
    const med = (e) => (C && CAOS_CONSOLE_DE_ROSTO[e] ? C.g[CAOS_CONSOLE_DE_ROSTO[e]] || 0 : 0);
    const forte = Math.max(...cand.map((x) => med(x.p)));
    let pool = cand,
      pesos = null;
    if (forte >= CAOS_CONSOLE_CFG.limiar) pesos = cand.map((x) => 1 + Math.max(0, med(x.p) - 2) * 0.8);
    else {
      const d = cand.filter((x) => CAOS_VIRADA_DESINFLA.includes(x.p));
      if (d.length) pool = d;
    }
    let r = Math.random() * (pesos ? pesos.reduce((a, c) => a + c, 0) : pool.length),
      esc = pool[0];
    for (let i = 0; i < pool.length; i++) {
      r -= pesos ? pesos[i] : 1;
      if (r < 0) {
        esc = pool[i];
        break;
      }
    }
    const n = chunks.length;
    let corte = n - 1;
    if (n >= 3 && Math.random() < 0.3) corte = n - 2;
    const tot = chunks.reduce((a, c) => a + c.length, 0) || 1,
      ant = chunks.slice(0, corte).reduce((a, c) => a + c.length, 0);
    return { auto: true, de: emo, para: esc.p, corte, frac: ant / tot, banco: b };
  } catch (e) {
    return null;
  }
}
function caosViradaManual(msg, bank, priority) {
  try {
    if (priority || typeof msg !== "string" || msg.indexOf("[C.A.O.S.]") === -1 || !bank) return null;
    const b = String(bank),
      q = (CAOS_VIRADA_QUANDO.find((x) => x[1].test(b)) || [])[0];
    if (!q) return null;
    const forca = caosViradaForcar === "manual";
    if (caosViradaForcar === "auto") return null;
    if (q === "fim" ? !(typeof gameEnded !== "undefined" && gameEnded) : typeof gameEnded !== "undefined" && gameEnded)
      return null;
    if (!forca && Math.random() >= CAOS_VIRADA_P_MANUAL) return null;
    const suave = caosSuaveAlvo(b),
      nome =
        ((typeof players !== "undefined" && players) || [])
          .map((p) => p && p.name)
          .filter(Boolean)
          .find((nm) => msg.indexOf(nm) !== -1) || "";
    const deOrig = q === "pausa" ? { leve: "deboche", magoado: "triste", puto: "raiva" }[b.split(".")[1]] : null;
    const pool = CAOS_VIRADAS.filter(
      (x) =>
        x.quando === q &&
        !(suave && (CAOS_VIRADA_PROIBIDA.has(x.de) || CAOS_VIRADA_PROIBIDA.has(x.para))) &&
        (nome || !/\{n\}/.test(x.partes.join(" "))) &&
        (!deOrig || x.de === deOrig) &&
        CAOS_EMOS[x.de] &&
        CAOS_EMOS[x.para],
    );
    if (!pool.length) return null;
    const item = caosPickNR("virada." + q, pool),
      partes = item.partes.map((s) => s.replace(/\{n\}/g, nome)),
      junto = partes.join(" ");
    return {
      manual: true,
      quando: q,
      idx: CAOS_VIRADAS.indexOf(item),
      de: item.de,
      para: item.para,
      msg: "[C.A.O.S.] " + junto,
      depois: caosSpeechText(partes[1]),
      frac: partes[0].length / junto.length,
      banco: "virada." + q + (suave ? ".suave" : ""),
      origem: b,
    };
  } catch (e) {
    return null;
  }
}
function caosViradaTrocar(serial, v, origem) {
  try {
    if (!v || v.feita || !activeToastState || activeToastState.serial !== serial) return false;
    const toast = document.getElementById("jfToast");
    if (!toast || !toast.classList.contains("show") || toast.classList.contains("caos-thinking")) return false;
    v.feita = true;
    const A = CAOS_EMOS[v.de],
      B = CAOS_EMOS[v.para],
      a = A && caosHexRgb(A.cor),
      b = B && caosHexRgb(B.cor);
    caosToastEmo(toast, v.para, v.banco);
    if (a && b)
      caosAnimar(toast, {
        dur: CAOS_VIRADA_MS,
        ease: "ease-in-out",
        fill: true,
        frames: [
          [0, { "--emo-cor": a, "--emo-bg": A.bg }],
          [1, { "--emo-cor": b, "--emo-bg": B.bg }],
        ],
      });
    caosBip(v.para);
    caosEmoFalaAtual = v.para;
    if (v.auto) caosViradas.auto++;
    else caosViradas.manual++;
    if (v.linha) v.linha.v = v.de + "→" + v.para;
    caosLog("virada", `${v.de} → ${v.para} (${v.manual ? "manual " + v.quando : "auto"} · ${origem})`);
    return true;
  } catch (e) {
    return false;
  }
}
function caosViradaTempo(serial, v, ms) {
  const t = Math.max(
    1200,
    ms != null ? ms : (v.frac || 0.5) * ((activeToastState && activeToastState.displayMs) || 5e3),
  );
  setTimeout(() => caosViradaTrocar(serial, v, "tempo"), t);
}
function caosDuploPadrao(idx) {
  const agora = stats.totalDrawn,
    ant = caosDuploUlt;
  caosDuploUlt = { idx, carta: agora };
  if (!ant || ant.idx === idx || agora - ant.carta !== 1) return;
  if (CURRENT_MODE === "junior" || caosDuploN >= 2 || agora - caosDuploCarta < 5 || Math.random() > 0.6) return;
  const p = players[idx],
    q = players[ant.idx];
  if (!p || !q) return;
  const hp = playerHumor(p),
    hq = playerHumor(q),
    duro = (h) => h === "acido" || h === "zero";
  let su, ac, tipo;
  if (hp === "suave" && duro(hq)) {
    su = p;
    ac = q;
    tipo = "suaveAgora";
  } else if (duro(hp) && hq === "suave") {
    su = q;
    ac = p;
    tipo = "acidoAgora";
  } else return;
  const casal =
    players.length >= 3 && ((isJfName(ac.name) && isAnneName(su.name)) || (isAnneName(ac.name) && isJfName(su.name)));
  if (casal && Math.random() < 0.5) tipo = "casal";
  caosDuploN++;
  caosDuploCarta = agora;
  caosLog("duploPadrao", `${su.name} (Suave) × ${ac.name} (${playerHumor(ac)}) · ${tipo}`);
  caosFalarDepois(getRandomReaction(REACTIVE_VOICE.duploPadrao[tipo], su.name, ac.name));
}
function caosJogEmoRegistrar(idx, ev) {
  const p = players[idx];
  if (!p) return;
  if (!p.emo || typeof p.emo.h !== "string") p.emo = { h: "" };
  p.emo.h = (p.emo.h + ev).slice(-8);
  caosConsoleEvento(idx, ev);
  caosJogEmoAtualizar();
}
function caosJogEmoAtualizar() {
  if (!players.length) return;
  const cartas = typeof stats !== "undefined" && stats ? stats.totalDrawn : 0;
  const ord = players.map((p, i) => i).sort((a, b) => players[b].score - players[a].score);
  const lider = ord[0],
    lanterna = ord[ord.length - 1];
  const gap = players[lider].score - (players[ord[1]] ? players[ord[1]].score : 0);
  const escala = CURRENT_MODE === "express" ? 25 : 40;
  players.forEach((p, i) => {
    const h = (p.emo && p.emo.h) || "",
      ult = h.slice(-1),
      fim = (re) => (h.match(re) || [""])[0].length;
    let e = null;
    if (h.slice(-2).includes("X")) e = "palhaco";
    else if (fim(/[EX]+$/) >= 3) e = "tilt";
    else if (fim(/[Aa]+$/) >= 2 || ult === "a") e = "fogo";
    else if (fim(/P+$/) >= 2) e = "sumido";
    else if (players.length >= 3 && cartas >= 4 && i === lider && gap >= escala / 2 && ult !== "E") e = "lider";
    else if (players.length >= 3 && cartas >= 4 && i === lanterna && players[lider].score - p.score >= escala)
      e = "pressao";
    if (e !== (p.estadoEmocional || null)) {
      p.estadoEmocional = e;
      caosLog("jogador", `${p.name}: ${e ? JOG_EMOS[e].t : "neutro"}`);
    }
  });
}
function caosNeuralCriar() {
  const w = document.createElement("div");
  w.className = "ci-neural-wrap";
  w.innerHTML = '<canvas class="ci-neural" aria-hidden="true"></canvas><div class="ci-neural-lbl"></div>';
  caosNeuralDesenhar(w.firstChild, 0);
  return w;
}
function caosNeuralDesenhar(cv, t) {
  if (!cv || !cv.getContext) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1),
    W = cv.clientWidth || 300,
    H = cv.clientHeight || 110;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
  }
  const g = cv.getContext("2d");
  if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const emo = caosEmocaoGlobal(),
    E = CAOS_EMOS[emo] || CAOS_EMOS.calmo;
  const te = caosEmo.tensao,
    ca = caosEmo.calor,
    pa = caosEmo.paciencia ?? 7;
  const n = Math.round(10 + ca * 2.6),
    vel = 0.35 + te / 9,
    trem = Math.max(0, 6 - pa) * 0.7;
  if (!cv._pts) cv._pts = [];
  while (cv._pts.length < n)
    cv._pts.push({
      a: Math.random() * 6.283,
      r: 0.35 + Math.random() * 0.6,
      v: (0.5 + Math.random()) * (Math.random() < 0.5 ? -1 : 1),
      s: 1 + Math.random() * 1.8,
    });
  if (cv._pts.length > n) cv._pts.length = n;
  if (cv._emo && cv._emo !== emo) {
    cv._burst = (cv._burst || []).concat(
      Array.from({ length: 26 }, () => ({ a: Math.random() * 6.283, d: 0, v: 1.2 + Math.random() * 2.2, vida: 1 })),
    );
    caosLog("humor", "inspetor: " + cv._emo + " → " + emo);
  }
  cv._emo = emo;
  const dt = cv._t ? Math.min(0.1, (t - cv._t) / 1e3) : 0;
  cv._t = t;
  const cx = W / 2,
    cy = H / 2,
    R = Math.min(W / 2, H / 2) - 6,
    per = E.per / (0.7 + te / 10);
  const k = (1 - Math.cos((t / per) * 6.283)) / 2;
  g.clearRect(0, 0, W, H);
  const pos = cv._pts.map((p) => {
    p.a += p.v * vel * dt;
    const rr = p.r * R,
      jx = trem ? (Math.random() - 0.5) * trem : 0,
      jy = trem ? (Math.random() - 0.5) * trem : 0;
    return [cx + Math.cos(p.a) * rr * (W / H > 2 ? 2.4 : 1.3) + jx, cy + Math.sin(p.a) * rr * 0.85 + jy, p.s];
  });
  g.lineWidth = 0.6;
  g.strokeStyle = E.cor;
  for (let i = 0; i < pos.length; i++)
    for (let j = i + 1; j < pos.length; j++) {
      const dx = pos[i][0] - pos[j][0],
        dy = pos[i][1] - pos[j][1],
        d = dx * dx + dy * dy;
      if (d < 1800) {
        g.globalAlpha = 0.28 * (1 - d / 1800);
        g.beginPath();
        g.moveTo(pos[i][0], pos[i][1]);
        g.lineTo(pos[j][0], pos[j][1]);
        g.stroke();
      }
    }
  g.fillStyle = E.cor;
  pos.forEach(([x, y, sz]) => {
    g.globalAlpha = 0.85;
    g.beginPath();
    g.arc(x, y, sz, 0, 6.283);
    g.fill();
  });
  if (cv._burst && cv._burst.length) {
    cv._burst = cv._burst.filter((b) => {
      b.d += b.v * 60 * dt;
      b.vida -= dt * 0.9;
      if (b.vida <= 0) return false;
      g.globalAlpha = b.vida;
      g.beginPath();
      g.arc(cx + Math.cos(b.a) * b.d, cy + Math.sin(b.a) * b.d * 0.6, 1.8, 0, 6.283);
      g.fill();
      return true;
    });
  }
  // 4.0: anel dos núcleos de emoção (as dez emoções do console). Tamanho = intensidade;
  // linha brilhante liga as duas emoções que estão se misturando.
  try {
    const C = caosConsole;
    if (C && C.g) {
      const ks = Object.keys(CAOS_CONSOLE),
        nucleos = {};
      const rx = Math.min(W / 2 - 14, R * (W / H > 2 ? 2.6 : 1.4)),
        ry = R * 0.78;
      ks.forEach((kk, i) => {
        const ang = (i / ks.length) * 6.283 - 1.571 + t / 9000;
        const v = C.g[kk] || 0,
          x = cx + Math.cos(ang) * rx,
          y = cy + Math.sin(ang) * ry;
        nucleos[kk] = [x, y];
        g.globalAlpha = 0.25 + Math.min(0.75, v / 8);
        g.fillStyle = CAOS_CONSOLE[kk].cor;
        g.beginPath();
        g.arc(x, y, 2 + Math.min(7, v * 0.8) + (kk === C.atual ? 1.5 * k : 0), 0, 6.283);
        g.fill();
        if (v >= CAOS_CONSOLE_CFG.saida) {
          g.globalAlpha = 0.18 + Math.min(0.4, v / 20);
          g.strokeStyle = CAOS_CONSOLE[kk].cor;
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(cx, cy);
          g.stroke();
        }
      });
      if (C.mist) {
        const ord = ks.slice().sort((a2, b2) => C.g[b2] - C.g[a2]);
        const [p1, p2] = [nucleos[ord[0]], nucleos[ord[1]]];
        g.globalAlpha = 0.5 + 0.4 * k;
        g.lineWidth = 2;
        g.strokeStyle = "#ffffff";
        g.beginPath();
        g.moveTo(p1[0], p1[1]);
        g.quadraticCurveTo(cx, cy, p2[0], p2[1]);
        g.stroke();
        g.lineWidth = 0.6;
      }
    }
  } catch (e) {}
  g.fillStyle = E.cor;
  const r0 = 14 + 6 * k * E.amp,
    grad = g.createRadialGradient(cx, cy, 0, cx, cy, r0 * 2.2);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.25, E.cor);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.globalAlpha = 0.9;
  g.fillStyle = grad;
  g.beginPath();
  g.arc(cx, cy, r0 * 2.2, 0, 6.283);
  g.fill();
  g.globalAlpha = 1;
  const wrap = cv.parentNode;
  if (wrap) {
    wrap.style.setProperty("--emo-cor", E.cor);
    wrap.style.setProperty("--emo-k", (k * E.amp).toFixed(3));
    if (cv._framesEmo !== emo || !cv._frames) {
      cv._framesEmo = emo;
      cv._frames = caosFaceEscolher(emo);
    }
    const lbl = wrap.querySelector(".ci-neural-lbl"),
      fr = cv._frames[Math.floor(t / E.fr) % cv._frames.length];
    const C = caosConsole || {};
    const txt = `${fr}  ${E.nome.toUpperCase()}${C.mist ? " · mistura: " + C.mist : ""}
tensão ${ciNum(te, 0)} · calor ${ciNum(ca, 0)} · paciência ${ciNum(pa, 0)}
${caosEstadoComposto().replace(/_/g, " ")} · ${caosTemper && caosTemper.nome ? caosTemper.nome : "normal"} · C.A.O.S. 4.0`;
    if (lbl && lbl.textContent !== txt) lbl.textContent = txt;
  }
}
