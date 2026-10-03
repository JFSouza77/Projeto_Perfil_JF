function caosKnownNames() {
  try {
    const o = JSON.parse(JFStore.getItem(CAOS_NAMES_KEY) || "{}");
    return o && typeof o === "object" ? o : {};
  } catch (e) {
    return {};
  }
}
function caosTimesSeen(name) {
  return caosKnownNames()[nameKeyPlain(name)] || 0;
}
function caosRememberPlayers() {
  try {
    const o = caosKnownNames();
    players.forEach((p) => {
      const k = nameKeyPlain(p.name);
      if (k && !p.nickEmprestado) o[k] = (o[k] || 0) + 1;
    });
    const keys = Object.keys(o);
    if (keys.length > 60) keys.slice(0, keys.length - 60).forEach((k) => delete o[k]);
    JFStore.setItem(CAOS_NAMES_KEY, JSON.stringify(o));
  } catch (e) {}
}
function caosMemCadastro(p) {
  if (!p) return;
  if (nickEmprestadoAtual && nameKeyPlain(nickEmprestadoAtual) === nameKeyPlain(p.name)) p.nickEmprestado = true;
  nickEmprestadoAtual = null;
  if (!memContaFicha(p)) return;
  p._fichaAntes = fichaGet(p.name);
  fichaUpd(p.name, (f) => {
    f.ultimaVez = Date.now();
  });
}
function caosMemBoasVindas(p, n) {
  const f = p._fichaAntes,
    M = REACTIVE_VOICE.memoria,
    R = Math.random,
    name = p.name;
  if (!f) return null;
  const opcoes = [];
  if (f.ultimaVez > 0) {
    const ms = Date.now() - f.ultimaVez;
    const b = ms < 864e5 ? M.reencontro.hoje : ms < 14 * 864e5 ? M.reencontro.dias : M.reencontro.muitoTempo;
    opcoes.push({ w: 40, bank: b, args: [name, memTempoDesde(ms)] });
  }
  if (f.ultimoResultado === "venceu" && f.partidas >= 1)
    opcoes.push({ w: 25, bank: M.venceuUltima, args: [name, memModoNome(f.ultimoModo)] });
  if (f.absurdos > 0) opcoes.push({ w: 18, bank: REACTIVE_VOICE.mesa.absurdoAntigo, args: [name, f.absurdos] });
  if (f.partidas >= 4 && f.vitorias >= 1)
    opcoes.push({ w: 15, bank: M.veterano, args: [name, f.vitorias, f.partidas] });
  const forte = MEM_CATS.map((c) => ({ c, ...fichaTaxa(f, c) }))
    .filter((x) => x.n >= 5)
    .sort((a, b) => b.taxa - a.taxa)[0];
  if (forte && forte.taxa >= 0.6)
    opcoes.push({
      w: 15,
      bank: M.categoria.forteCadastro,
      args: [name, caosCategoryLabel(forte.c), memPct(forte.taxa)],
    });
  if (!opcoes.length) return null;
  const tot = opcoes.reduce((s, o) => s + o.w, 0);
  let r = R() * tot;
  for (const o of opcoes) {
    r -= o.w;
    if (r <= 0) return o;
  }
  return opcoes[0];
}
function caosMemAcerto(idx, dicas, ms) {
  const p = players[idx];
  if (!p || !currentCard) return;
  const cat = gemCategoryFor(currentCard.category);
  if (memContaFicha(p))
    fichaUpd(p.name, (f) => {
      f.acertos++;
      const a = f.cat[cat] || [0, 0];
      a[0]++;
      a[1]++;
      f.cat[cat] = a;
      if (typeof ms === "number" && ms > 0 && ms < 6e5) {
        f.msSum += ms;
        f.msN++;
      }
      if (dicas === 1) f.primeiraDica++;
    });
  if (CURRENT_MODE !== "express" && !currentCard.isBonus) {
    const sofrido = CURRENT_MODE === "hardcore" ? 8 : 14;
    if (dicas <= 2)
      caosMomentos.push({
        tipo: "golaco",
        nome: p.name,
        carta: stats.totalDrawn,
        resp: currentCard.answer,
        dicas,
        usado: false,
      });
    else if (dicas >= sofrido)
      caosMomentos.push({
        tipo: "sofrido",
        nome: p.name,
        carta: stats.totalDrawn,
        resp: currentCard.answer,
        dicas,
        usado: false,
      });
  }
  const msgs = [];
  if (CURRENT_MODE !== "express" && typeof ms === "number" && ms >= 1500) {
    const m = caosRecordeTentar("rapido", ms, true, { nome: p.name, resp: currentCard.answer });
    if (m && m.antes.data < caosMemPartidaInicio && caosOncePerMatch("rec_rapido"))
      msgs.push(getRandomReaction(REACTIVE_VOICE.recorde.rapido, p.name, memSeg(ms), memSeg(m.antes.v), m.antes.nome));
  }
  if (streakScorerIdx === idx && streakCount >= 3) {
    const m = caosRecordeTentar("sequencia", streakCount, false, { nome: p.name });
    if (m && m.antes.data < caosMemPartidaInicio && caosOncePerMatch("rec_seq"))
      msgs.push(
        getRandomReaction(
          REACTIVE_VOICE.recorde.sequencia,
          p.name,
          streakCount,
          m.antes ? m.antes.v : "",
          m.antes ? m.antes.nome : "",
        ),
      );
  }
  if (msgs[0]) caosFalarDepois(msgs[0]);
}
function caosMemErro(idx) {
  const p = players[idx];
  if (!p || !currentCard || !memContaFicha(p)) return;
  const cat = gemCategoryFor(currentCard.category);
  fichaUpd(p.name, (f) => {
    f.erros++;
    const a = f.cat[cat] || [0, 0];
    a[1]++;
    f.cat[cat] = a;
  });
}
function caosFalarDepois(msg) {
  if (!msg) return;
  const ser = caosPartidaSerial;
  if (activeToastState && activeToastState.priority)
    activeToastState.deferred.push(() => {
      if (ser === caosPartidaSerial) showToastMessage(msg);
    });
  else
    setTimeout(() => {
      if (ser === caosPartidaSerial) showToastMessage(msg);
    }, 120);
}
function caosRecordeTentar(tipo, v, menorMelhor, extra) {
  const o = memLer(MEM_RECORDES_KEY, {});
  const atual =
    o[tipo] && typeof o[tipo].v === "number"
      ? { ...o[tipo], data: memNum(o[tipo].data, 0), nome: String(o[tipo].nome || "?") }
      : null;
  const bateu = !atual || (menorMelhor ? v < atual.v : v > atual.v);
  if (!bateu) return null;
  o[tipo] = {
    v,
    nome: String(extra.nome || "").slice(0, 15),
    resp: extra.resp ? String(extra.resp).slice(0, 60) : void 0,
    modo: CURRENT_MODE,
    data: Date.now(),
  };
  memGravar(MEM_RECORDES_KEY, o);
  if (!caosRecordesNovos.includes(tipo)) caosRecordesNovos.push(tipo);
  caosLog(
    "recorde",
    `${tipo}: ${v} (${extra.nome})${atual ? " — antes " + atual.v + " (" + atual.nome + ")" : " — primeiro registro"}`,
  );
  return atual ? { antes: atual } : null;
}
function caosRivalChave(a, b) {
  return [nameKeyPlain(a), nameKeyPlain(b)].sort().join("|");
}
function caosRivalTroca(novoIdx, antigoIdx) {
  const a = players[novoIdx],
    b = players[antigoIdx];
  if (!a || !b || a === b || CURRENT_FORMAT === "equipe") return null;
  const k = caosRivalChave(a.name, b.name);
  const n = (caosRivalPartida[k] || 0) + 1;
  caosRivalPartida[k] = n;
  const o = memLer(MEM_RIVAIS_KEY, {});
  const r = o[k] && typeof o[k] === "object" ? o[k] : { n: 0 };
  r.n = memNum(r.n, 0) + 1;
  r.a = String(a.name).slice(0, 15);
  r.b = String(b.name).slice(0, 15);
  delete o[k];
  o[k] = r;
  const ks = Object.keys(o);
  if (ks.length > 60) ks.slice(0, ks.length - 60).forEach((x) => delete o[x]);
  memGravar(MEM_RIVAIS_KEY, o);
  caosMomentos.push({ tipo: "virada", nome: a.name, outro: b.name, carta: stats.totalDrawn, usado: false });
  const RV = REACTIVE_VOICE.memoria.rival;
  if (n === 2 && caosOncePerMatch("rival_" + k)) return getRandomReaction(RV.classico, a.name, b.name, r.n);
  if (n >= 3 && Math.random() < 0.35) return getRandomReaction(RV.denovo, a.name, b.name, n);
  return null;
}
function caosMemoriaNaDica() {
  if (caosSilenced || CURRENT_MODE === "express" || !currentCard || currentCard.isBonus) return false;
  if (revealedOrder.filter((r) => r.item.type === "clue").length !== 1) return false;
  if (caosFalasUltimos(4e4) >= 2) return false;
  const p = players[responderIndex];
  if (!p || p.iniciante) return false;
  const R = Math.random,
    M = REACTIVE_VOICE.memoria,
    fator = caosOS() ? 0.6 : 1;
  {
    const ab = memLer(MEM_CARTAS_ABSURDO_KEY, {})[String(currentCard.answer).slice(0, 60)];
    if (
      ab &&
      memNum(ab.data, 0) < caosMemPartidaInicio &&
      R() < 0.5 &&
      caosOncePerMatch("absurdo_carta_" + currentCard.answer)
    ) {
      showToastMessage(getRandomReaction(REACTIVE_VOICE.mesa.cartaAbsurdo));
      return true;
    }
  }
  {
    const pm = caosCerebroPremonicao(p);
    if (pm) {
      showToastMessage(pm);
      return true;
    }
  }
  const mom = caosMomentos.filter((m) => !m.usado && m.nome === p.name && stats.totalDrawn - m.carta >= 3);
  if (mom.length && R() < 0.11 * fator) {
    const m = mom[Math.floor(R() * mom.length)];
    m.usado = true;
    if (m.tipo === "sofrido" && playerHumor(p) === "suave" && R() < 0.5) return false;
    const msg2 =
      m.tipo === "virada"
        ? getRandomReaction(M.callback.virada, p.name, m.outro)
        : getRandomReaction(M.callback[m.tipo], p.name, m.resp, m.dicas);
    if (msg2) {
      caosLog("memoria", `callback ${m.tipo}: ${p.name}`);
      showToastMessage(msg2);
      return true;
    }
  }
  if (caosMemCatFalou[p.name] || !memContaFicha(p)) return false;
  const f = fichaGet(p.name);
  if (!f) return false;
  const cat = gemCategoryFor(currentCard.category),
    t = fichaTaxa(f, cat);
  if (t.n < 5 || (t.taxa > 0.25 && t.taxa < 0.6) || R() >= 0.12 * fator) return false;
  if (t.taxa <= 0.25 && playerHumor(p) === "suave" && R() < 0.5) return false;
  caosMemCatFalou[p.name] = true;
  const msg = getRandomReaction(
    t.taxa >= 0.6 ? M.categoria.forte : M.categoria.fraco,
    p.name,
    caosCategoryLabel(cat),
    memPct(t.taxa),
    t.n,
  );
  if (msg) {
    caosLog("memoria", `categoria ${cat}: ${p.name} ${memPct(t.taxa)} de ${t.n}`);
    showToastMessage(msg);
    return true;
  }
  return false;
}
function caosBolaPeso(i) {
  const p = players[i];
  if (!p || !currentCard || !memContaFicha(p)) return 1;
  const t = fichaTaxa(fichaGet(p.name), gemCategoryFor(currentCard.category));
  return t.n >= 3 ? 0.4 + t.taxa * 2 : 1;
}
function caosBolaRegistrar(ok) {
  const o = memLer(MEM_BOLA_KEY, {});
  o.t = memNum(o.t, 0) + 1;
  o.a = memNum(o.a, 0) + (ok ? 1 : 0);
  memGravar(MEM_BOLA_KEY, o);
  if (o.t < 5 || Math.random() >= 0.5) return "";
  return (
    " " +
    getRandomReaction(
      ok ? REACTIVE_VOICE.memoria.bolaTaxa.acerto : REACTIVE_VOICE.memoria.bolaTaxa.erro,
      o.a,
      o.t,
      memPct(o.a / o.t),
    )
  );
}
function caosMemInicioTexto() {
  const M = REACTIVE_VOICE.memoria,
    R = Math.random,
    opcoes = [];
  const u = memLer(MEM_ULTIMA_KEY, null);
  const naMesa = new Set(players.filter(memContaFicha).map((p) => nameKeyPlain(p.name)));
  if (
    u &&
    memNum(u.data, 0) > 0 &&
    Date.now() - u.data < 14 * 864e5 &&
    Array.isArray(u.jogadores) &&
    u.jogadores.some((k) => naMesa.has(k))
  ) {
    if (u.saiu) opcoes.push(getRandomReaction(M.ultimaPartida.saiu));
    const cortador =
      typeof u.cortador === "string" ? players.find((p) => nameKeyPlain(p.name) === nameKeyPlain(u.cortador)) : null;
    if (memNum(u.cortes, 0) >= 3 && cortador && playerHumor(cortador) !== "suave")
      opcoes.push(getRandomReaction(M.ultimaPartida.cortes, cortador.name, u.cortes));
    const venc =
      typeof u.vencedor === "string"
        ? players.find((p) => nameKeyPlain(p.name) === nameKeyPlain(u.vencedor) && memContaFicha(p))
        : null;
    if (venc && players.length >= 2) opcoes.push(getRandomReaction(M.ultimaPartida.vencedor, venc.name));
  }
  if (CURRENT_FORMAT !== "equipe") {
    const o = memLer(MEM_RIVAIS_KEY, {});
    const pares = [];
    for (let i = 0; i < players.length; i++)
      for (let j = i + 1; j < players.length; j++) {
        if (!memContaFicha(players[i]) || !memContaFicha(players[j])) continue;
        const r = o[caosRivalChave(players[i].name, players[j].name)];
        if (r && memNum(r.n, 0) >= 3) pares.push({ a: players[i].name, b: players[j].name, n: r.n });
      }
    if (pares.length) {
      const x = pares.sort((a, b) => b.n - a.n)[0];
      opcoes.push(getRandomReaction(M.rival.inicio, x.a, x.b, x.n));
    }
  }
  const ok = opcoes.filter(Boolean);
  return ok.length ? ok[Math.floor(R() * ok.length)] : "";
}
function caosMemTemInicio() {
  try {
    return !!caosMemInicioTexto();
  } catch (e) {
    return false;
  }
}
function caosVencedoresIdx() {
  if (!players.length) return [];
  if (gemWinner && gemWinner.kind === "player" && players[gemWinner.id]) return [gemWinner.id];
  if (CURRENT_FORMAT === "equipe") {
    let alvo = null;
    if (gemWinner && gemWinner.kind === "team") alvo = gemWinner.id;
    else {
      const tv = (id) => rankValue(teams[id], id);
      const top2 = Math.max(...teamOrder.map(tv));
      const t2 = teamOrder.filter((id) => tv(id) === top2);
      if (t2.length === 1 && top2 > 0) alvo = t2[0];
    }
    return alvo ? players.map((p, i) => i).filter((i) => players[i].team === alvo) : [];
  }
  const top = Math.max(...players.map((p) => rankValue(p)));
  const t = players.map((p, i) => i).filter((i) => rankValue(players[i]) === top);
  return t.length === 1 && top > 0 ? t : [];
}
function caosMemFimDePartida() {
  if (caosMemFimFeito || !players.length) return;
  caosMemFimFeito = true;
  if (stats.totalDrawn < 5) return;
  caosMagoaFim();
  const venc = caosVencedoresIdx();
  const lanterna =
    CURRENT_FORMAT !== "equipe" && players.length >= 3
      ? (() => {
          const low = Math.min(...players.map((p) => rankValue(p)));
          const l = players.map((p, i) => i).filter((i) => rankValue(players[i]) === low);
          return l.length === 1 ? l[0] : -1;
        })()
      : -1;
  players.forEach((p, i) => {
    if (!memContaFicha(p)) return;
    fichaUpd(p.name, (f) => {
      f.partidas++;
      if (venc.includes(i)) f.vitorias++;
      f.melhorPts = Math.max(f.melhorPts, memNum(p.score, 0));
      f.joias += Object.values(p.gems || {}).reduce((s, n) => s + (Number(n) || 0), 0);
      f.ultimoResultado = venc.includes(i) ? "venceu" : i === lanterna ? "lanterna" : "meio";
      f.ultimoModo = CURRENT_MODE;
      f.ultimaVez = Date.now();
    });
  });
  let recMsg = "";
  if (CURRENT_FORMAT !== "equipe") {
    const best = players.reduce((a, b) => (b.score > a.score ? b : a), players[0]);
    if (best && best.score > 0) {
      const m = caosRecordeTentar("pontuacao_" + CURRENT_MODE, best.score, false, { nome: best.name });
      if (m && m.antes.data < caosMemPartidaInicio)
        recMsg = getRandomReaction(
          REACTIVE_VOICE.recorde.pontuacao,
          best.name,
          best.score,
          m.antes.v,
          m.antes.nome,
          memModoNome(CURRENT_MODE),
        );
    }
  }
  const cortes = Object.entries(caosCortes.por || {}).sort((a, b) => b[1] - a[1])[0];
  memGravar(MEM_ULTIMA_KEY, {
    data: Date.now(),
    saiu: !!caosSilenced,
    cortes: memNum(caosCortes.total, 0),
    cortador: cortes ? String(cortes[0]).slice(0, 15) : null,
    vencedor: venc.length === 1 && memContaFicha(players[venc[0]]) ? String(players[venc[0]].name).slice(0, 15) : null,
    jogadores: players.filter(memContaFicha).map((p) => nameKeyPlain(p.name)),
    modo: CURRENT_MODE,
  });
  if (recMsg)
    setTimeout(() => {
      if (gameEnded) showToastMessage(recMsg, null, true);
    }, 9e3);
}
function caosMemResetPartida() {
  caosMomentos = [];
  caosRivalPartida = {};
  caosMemCatFalou = {};
  caosRecordesNovos = [];
  caosMemFimFeito = false;
  caosMemPartidaInicio = Date.now();
}
function caosMesaReset() {
  caosPartidaInicioAt = null;
  caosPausaAcum = 0;
  caosPartidaFimAt = null;
  caosResenhaTxt = null;
  caosMesa = {
    pulos: 0,
    absurdos: 0,
    pulosPor: {},
    absurdosPor: {},
    puloSeq: 0,
    ultAcao: {},
    tilt: {},
    alvos: {},
    dm: {},
    diag: {},
    absCat: {},
    precoce: {},
    falso: 0,
    ultErro: null,
  };
  caosAposta = null;
}
function caosMesaLimpa(m) {
  const num = (v) => (typeof v === "number" && isFinite(v) && v >= 0 ? Math.floor(v) : 0);
  const mapa = (o) => {
    const r = {};
    if (o && typeof o === "object")
      Object.keys(o)
        .slice(0, 12)
        .forEach((k) => {
          r[String(k).slice(0, 15)] = num(o[k]);
        });
    return r;
  };
  const t = m && typeof m === "object" ? m : {};
  const mapaN = (o, lim) => {
    const r = {};
    if (o && typeof o === "object")
      Object.keys(o)
        .slice(0, lim)
        .forEach((k) => {
          r[String(k).slice(0, 40)] = num(o[k]);
        });
    return r;
  };
  return {
    pulos: num(t.pulos),
    absurdos: num(t.absurdos),
    pulosPor: mapa(t.pulosPor),
    absurdosPor: mapa(t.absurdosPor),
    puloSeq: num(t.puloSeq),
    ultAcao: {},
    tilt: {},
    alvos: mapa(t.alvos),
    dm: mapaN(t.dm, 400),
    diag: mapaN(t.diag, 60),
    absCat: mapaN(t.absCat, 60),
    precoce: mapa(t.precoce),
    falso: 0,
    ultErro: null,
  };
}
function caosMesaRegistrar(tipo, p) {
  if (!p) return;
  caosCerebroRegistrar(tipo, p);
  const nome = p.name;
  if (tipo === "pular") {
    caosMesa.pulos++;
    caosMesa.pulosPor[nome] = (caosMesa.pulosPor[nome] || 0) + 1;
    caosMesa.puloSeq++;
  } else caosMesa.puloSeq = 0;
  if (tipo === "absurdo") {
    caosMesa.absurdos++;
    caosMesa.absurdosPor[nome] = (caosMesa.absurdosPor[nome] || 0) + 1;
    if (memContaFicha(p))
      fichaUpd(nome, (f) => {
        f.absurdos = (f.absurdos || 0) + 1;
      });
    if (caosMesa.absCartaSeq !== cartaSeq) {
      caosMesa.absCartaSeq = cartaSeq;
      caosMesa.absCartaN = 0;
    }
    caosMesa.absCartaN++;
    if (caosMesa.absCartaN === 3 && players[mestreIndex] && caosOncePerMatch("abs3_" + cartaSeq))
      caosFalaAgendar(
        () => getRandomReaction(REACTIVE_VOICE.absurdoTresMestre, players[mestreIndex].name),
        700,
        "media",
      );
    if (currentCard && currentCard.answer) {
      const o = memLer(MEM_CARTAS_ABSURDO_KEY, {});
      const k = String(currentCard.answer).slice(0, 60);
      o[k] = { n: memNum(o[k] && o[k].n, 0) + 1, data: Date.now() };
      const ks = Object.keys(o);
      if (ks.length > 150) ks.slice(0, ks.length - 150).forEach((x) => delete o[x]);
      memGravar(MEM_CARTAS_ABSURDO_KEY, o);
    }
    caosLog("mesa", `🤦 Absurdo de ${nome} (${caosMesa.absurdosPor[nome]}º na partida)`);
  }
  if (tipo === "acerto") caosMesa.ultimoAcertoFofo = AVATARS_KIDS.includes(p.avatar) ? nome : null;
  caosMesa.antes = caosMesa.ultAcao[nome] || null;
  caosMesa.ultAcao[nome] = tipo || "erro";
}
function caosMesaFala(tipo, p) {
  if (!p || caosSilenced) return "";
  const M = REACTIVE_VOICE.mesa,
    suave = playerHumor(p) === "suave" || p.iniciante || CURRENT_MODE === "junior";
  if (tipo === "absurdo") {
    {
      const mm = players[mestreIndex];
      if (
        caosMesa.absCartaN >= 3 &&
        caosMesa.absCartaSeq === cartaSeq &&
        mm &&
        playerHumor(mm) !== "suave" &&
        caosOncePerMatch("ditador_" + mm.name)
      )
        return getRandomReaction(REACTIVE_VOICE.juizMestre.ditador, mm.name);
    }
    const q = caosMesa.absurdosPor[p.name] || 1;
    if (suave) return Math.random() < 0.85 ? getRandomReaction(M.absurdoSuave, p.name) : "";
    if (q === 3) return getRandomReaction(M.desacreditado, p.name);
    if (q === 2 && Math.random() < 0.6) return getRandomReaction(M.absurdoSegundo, p.name);
    return Math.random() < (caosOS() ? 0.75 : 0.95) ? getRandomReaction(M.absurdo, p.name) : "";
  }
  if (tipo === "pular") {
    if (caosMesa.puloSeq >= 3 && caosOncePerMatch("mesa_silencio_" + stats.totalDrawn))
      return getRandomReaction(M.silencio);
    if (suave || caosFalasUltimos(45e3) >= 2) return "";
    return Math.random() < (playerHumor(p) === "zero" ? 0.6 : caosOS() ? 0.18 : 0.3)
      ? (Math.random() < 0.5 && caosGerar("pular", p, {})) || getRandomReaction(M.pular, p.name)
      : "";
  }
  return "";
}
function caosMesaMista() {
  if (CURRENT_MODE === "junior" || CURRENT_FORMAT === "equipe") return false;
  const k = players.filter((p) => AVATARS_KIDS.includes(p.avatar)).length;
  return k >= 1 && k < players.length;
}
function caosMesaErroNormal(p, ms) {
  if (!p || p.iniciante) return "";
  {
    const mm = players[mestreIndex];
    if (
      cardWrongCount >= 5 &&
      !(caosMesa.absCartaSeq === cartaSeq && caosMesa.absCartaN > 0) &&
      caosCerebroOrdem() >= 12 &&
      mm &&
      mm !== p &&
      playerHumor(mm) !== "suave" &&
      Math.random() < 0.35 &&
      caosOncePerMatch("mae_" + mm.name)
    )
      return getRandomReaction(REACTIVE_VOICE.juizMestre.mae, mm.name);
  }
  const M = REACTIVE_VOICE.mesa;
  if (caosMesaMista()) {
    if (AVATARS_KIDS.includes(p.avatar)) {
      if (Math.random() < 0.35) return getRandomReaction(M.fofinho, p.name);
    } else if (
      caosMesa.ultimoAcertoFofo &&
      caosMesa.ultimoAcertoFofo !== p.name &&
      playerHumor(p) !== "suave" &&
      Math.random() < 0.3
    ) {
      const k = caosMesa.ultimoAcertoFofo;
      caosMesa.ultimoAcertoFofo = null;
      return getRandomReaction(M.carrasco, p.name, k);
    }
  }
  if (playerHumor(p) === "suave") return "";
  if (caosMesa.antes === "pular" && typeof ms === "number" && ms < 3e3 && !caosMesa.tilt[p.name]) {
    caosMesa.tilt[p.name] = 1;
    caosLog("mesa", `tilt: ${p.name}`);
    return getRandomReaction(M.tilt, p.name);
  }
  if ((caosMesa.absurdosPor[p.name] || 0) >= 3 && Math.random() < 0.35)
    return getRandomReaction(M.desacreditadoErro, p.name);
  return "";
}
function caosMesaMimica(restoMs, scorer, mestre) {
  if (caosSilenced || !scorer || !mestre || scorer === mestre || restoMs === null || restoMs > 2500 || restoMs < 0)
    return;
  if (playerHumor(mestre) === "suave" || Math.random() >= 0.5) return;
  caosFalarDepois(getRandomReaction(REACTIVE_VOICE.mesa.mimica, mestre.name, scorer.name));
}
function caosMesaCulpaMestre() {
  const m = players[mestreIndex];
  if (!m || CURRENT_MODE === "express" || playerHumor(m) === "suave" || m.iniciante || Math.random() >= 0.15) return "";
  return getRandomReaction(REACTIVE_VOICE.mesa.culpaMestre, m.name);
}
function caosMesaAlvo(quemIdx, alvoIdx, amount) {
  const a = players[quemIdx],
    b = players[alvoIdx];
  if (!a || !b || a === b || amount >= 0 || caosSilenced) return;
  const k = a.name + "→" + b.name;
  caosMesa.alvos[k] = (caosMesa.alvos[k] || 0) + 1;
  {
    const cm = caosCasalEspecial(quemIdx, alvoIdx);
    if (cm) {
      caosFalarDepois(cm);
      return;
    }
  }
  if (caosMesa.alvos[k] === 2 && caosOncePerMatch("rival_esp_" + k))
    caosFalarDepois(getRandomReaction(REACTIVE_VOICE.mesa.rivalEspecial, a.name, b.name));
}
function caosMesaNaCarta() {
  if (caosSilenced || CURRENT_MODE === "express" || CURRENT_FORMAT === "equipe" || players.length < 3) return false;
  const M = REACTIVE_VOICE.mesa,
    W = WINNING_SCORE || 200;
  const lider = players.reduce((best, p) => (rankValue(p) > rankValue(best) ? p : best), players[0]);
  if (
    !caosAposta &&
    stats.totalDrawn >= 8 &&
    (rankValue(lider) >= W * 0.35 || stats.totalDrawn >= 14) &&
    caosOncePerMatch("aposta")
  ) {
    const cand = [...players].sort(
      (x, y) =>
        rankValue(y) - rankValue(x) ||
        ((fichaGet(y.name) || {}).vitorias || 0) - ((fichaGet(x.name) || {}).vitorias || 0),
    );
    caosAposta = { nome: cand[0].name, carta: stats.totalDrawn };
    caosLog("mesa", `aposta secreta: ${cand[0].name} (carta ${stats.totalDrawn})`);
    showToastMessage(getRandomReaction(M.apostaFeita));
    return true;
  }
  if (typeof palpiteHolders === "object" && rankValue(lider) >= W * 0.75) {
    const donoIdx = Object.keys(palpiteHolders)
      .map(Number)
      .find((i) => palpiteHolders[i] > 0 && players[i]);
    if (
      donoIdx !== void 0 &&
      playerHumor(players[donoIdx]) !== "suave" &&
      Math.random() < 0.6 &&
      caosOncePerMatch("fantasma")
    ) {
      showToastMessage(getRandomReaction(M.fantasma, players[donoIdx].name));
      return true;
    }
  }
  return false;
}
function caosMesaRevelaAposta() {
  if (!caosAposta || !players.length) return;
  const venc = caosVencedoresIdx();
  if (venc.length !== 1) return;
  const v = players[venc[0]].name,
    ok = nameKeyPlain(v) === nameKeyPlain(caosAposta.nome);
  const msg = ok
    ? getRandomReaction(REACTIVE_VOICE.mesa.apostaAcertou, caosAposta.nome, caosAposta.carta)
    : getRandomReaction(REACTIVE_VOICE.mesa.apostaErrou, caosAposta.nome, caosAposta.carta, v);
  setTimeout(() => {
    if (gameEnded) showToastMessage(msg, null, true);
  }, 6500);
}
function caosPerfilAvatar(p) {
  if (!p || p.iniciante || CURRENT_MODE === "junior") return null;
  const h = playerHumor(p),
    a = p.avatar;
  if (CAOS_AVATAR_TIPO.fofo.has(a) && (h === "acido" || h === "zero")) return "fofoPsicopata";
  if (CAOS_AVATAR_TIPO.sombrio.has(a) && h === "suave") return "trevosoNutella";
  if (CAOS_AVATAR_TIPO.confiante.has(a)) return "arrogante";
  return null;
}
function caosCerebroOrdem() {
  return revealedOrder.filter((r) => r.item.type === "clue").length;
}
function caosDmInc(nome, cat, k, v) {
  const key = nome + "|" + cat + "|" + k;
  caosMesa.dm[key] = (caosMesa.dm[key] || 0) + v;
}
function caosDm(nome, cat, k) {
  return caosMesa.dm[nome + "|" + cat + "|" + k] || 0;
}
function caosDificilFicha(p, cat) {
  if (!memContaFicha(p)) return 0;
  const f = fichaGet(p.name);
  return f && f.dificil ? f.dificil[cat] || 0 : 0;
}
function caosCerebroRegistrar(tipo, p) {
  if (!p || !currentCard || CURRENT_MODE === "express") return;
  const cat = gemCategoryFor(currentCard.category),
    nome = p.name;
  caosDmInc(nome, cat, "t", 1);
  if (tipo === "acerto") {
    caosDmInc(nome, cat, "a", 1);
    return;
  }
  caosDmInc(nome, cat, "p", tipo === "absurdo" ? 5 : tipo === "pular" ? 2 : 1);
  if (tipo === "absurdo") caosMesa.absCat[nome + "|" + cat] = (caosMesa.absCat[nome + "|" + cat] || 0) + 1;
  if (tipo !== "pular" && caosCerebroOrdem() === 1) caosMesa.precoce[nome] = (caosMesa.precoce[nome] || 0) + 1;
}
function caosCerebroDiagnostico(p) {
  if (!p || !currentCard || CURRENT_MODE === "express" || p.iniciante) return "";
  const cat = gemCategoryFor(currentCard.category),
    nome = p.name,
    dk = nome + "|" + cat;
  if (caosMesa.diag[dk]) return "";
  const t = caosDm(nome, cat, "t"),
    pts = caosDm(nome, cat, "p");
  if (t < 3 || pts < 6 || caosDm(nome, cat, "a") > 0) return "";
  const outros = players.filter((x) => x.name !== nome && caosDm(x.name, cat, "t") > 0);
  const media = outros.length
    ? outros.reduce((s, x) => s + caosDm(x.name, cat, "p") / caosDm(x.name, cat, "t"), 0) / outros.length
    : 0;
  if (!outros.length) return "";
  if (pts / t < Math.max(1.5 * media, 1.2)) return "";
  caosMesa.diag[dk] = 1;
  if (memContaFicha(p))
    fichaUpd(nome, (f) => {
      f.dificil = f.dificil || {};
      f.dificil[cat] = Math.min(9, (f.dificil[cat] || 0) + 1);
    });
  caosLog(
    "cerebro",
    `laudo: ${nome} com dificuldade em ${cat} (${pts} pts em ${t} jogadas; média da mesa ${media.toFixed(2)}/jogada)`,
  );
  const C = REACTIVE_VOICE.cerebro,
    cn = CAOS_CAT_NOME[cat] || cat;
  return playerHumor(p) === "suave"
    ? getRandomReaction(C.diagnosticoSuave, nome, cn)
    : getRandomReaction(C.diagnostico, nome, cn, CAOS_CAT_MATERIA[cat] || cn);
}
function caosCerebroPremonicao(p) {
  if (!p || !currentCard || p.iniciante) return "";
  const cat = gemCategoryFor(currentCard.category);
  if (!(caosMesa.diag[p.name + "|" + cat] || caosDificilFicha(p, cat) > 0)) return "";
  if (Math.random() >= 0.3 || !caosOncePerMatch("premonicao_" + p.name + "_" + stats.totalDrawn)) return "";
  return getRandomReaction(REACTIVE_VOICE.cerebro.premonicao, p.name, CAOS_CAT_NOME[cat] || cat);
}
function caosCerebroAcerto(p, ordem, missBefore, ms) {
  if (!p || !currentCard || CURRENT_MODE === "express") return "";
  {
    const cm = caosCasalAcerto(p, players.indexOf(p));
    if (cm) return cm;
  }
  {
    const ct = caosCartaTema("acerto");
    if (ct) return ct;
  }
  const C = REACTIVE_VOICE.cerebro,
    cat = gemCategoryFor(currentCard.category),
    dk = p.name + "|" + cat;
  if (ordem <= 2 && (caosMesa.diag[dk] || caosDificilFicha(p, cat) > 0)) {
    delete caosMesa.diag[dk];
    if (memContaFicha(p))
      fichaUpd(p.name, (f) => {
        if (f.dificil) delete f.dificil[cat];
      });
    return getRandomReaction(C.redencao, p.name, CAOS_CAT_NOME[cat] || cat, ordem);
  }
  if (missBefore >= 3 && ordem <= 2 && !p.iniciante && playerHumor(p) !== "suave" && Math.random() < 0.7)
    return getRandomReaction(C.impostor, p.name, ordem);
  const PJ = REACTIVE_VOICE.perfilJogador,
    na = caosNickAnalise(p.name),
    pf = caosPerfilAvatar(p),
    R = Math.random;
  if (na && na.tipo === "enigma" && R() < 0.4) return getRandomReaction(PJ.enigma.acerto);
  if (na && na.tipo === "aura" && ordem >= 10 && R() < 0.6)
    return getRandomReaction(PJ.nick.acerto.auraTarde, p.name, ordem);
  if (
    na &&
    PJ.nick.acerto[na.tipo] &&
    ordem <= 3 &&
    R() < 0.4 &&
    caosOncePerMatch("nick_acerto_" + p.name + "_" + Math.floor(stats.totalDrawn / 4))
  )
    return getRandomReaction(PJ.nick.acerto[na.tipo], p.name);
  if (pf && ordem <= 3 && R() < 0.3 && caosOncePerMatch("perfil_acerto_" + p.name))
    return getRandomReaction(PJ.avatar.acerto[pf], p.name);
  if (R() < 0.12) {
    const g = caosGerar("acerto", p, { ms, ordem, missBefore });
    if (g) return g;
  }
  return "";
}
function caosCerebroErro(p, ms, surpresa) {
  if (!p || p.iniciante || CURRENT_MODE === "express") return "";
  const C = REACTIVE_VOICE.cerebro,
    R = Math.random,
    agora = Date.now(),
    ant = caosMesa.ultErro;
  caosMesa.ultErro = { nome: p.name, ms: typeof ms === "number" ? ms : 99999, t: agora };
  if (caosMesa.falso && R() < 0.6) {
    caosMesa.falso = 0;
    return getRandomReaction(C.falsoCarregamento);
  }
  if (
    ant &&
    ant.nome !== p.name &&
    ant.ms < 4e3 &&
    typeof ms === "number" &&
    ms < 4e3 &&
    agora - ant.t < 15e3 &&
    caosOncePerMatch("manada_" + stats.totalDrawn)
  )
    return getRandomReaction(C.manada);
  if (isJfPlayer(p) && surpresa === "erroFacil" && R() < 0.6) return getRandomReaction(C.criador, p.name);
  const PJ = REACTIVE_VOICE.perfilJogador,
    perfil = caosPerfilAvatar(p);
  if (perfil && R() < 0.5 && caosOncePerMatch("perfil_erro_" + p.name))
    return getRandomReaction(PJ.avatar.erro[perfil], p.name);
  const na = caosNickAnalise(p.name);
  if (na && na.tipo === "enigma") {
    if (R() < 0.35) return getRandomReaction(PJ.enigma.erro);
  } else if (na && PJ.nick.erro[na.tipo]) {
    const primeira = caosOncePerMatch("nick_erro1_" + p.name),
      chance = na.tipo === "nomeReal" ? [0.4, 0.1] : na.tipo === "numero" ? [0.5, 0.12] : [0.7, 0.18];
    if (R() < (primeira ? chance[0] : chance[1])) return getRandomReaction(PJ.nick.erro[na.tipo], p.name);
  }
  return "";
}
function caosCerebroAnne(tipo, p) {
  return caosCasalErro(tipo, p);
}
function caosFalsoCarregamento() {
  if (caosSilenced || activeToastState || !visualFxAllowed()) return false;
  const toast = document.getElementById("jfToast");
  if (!toast) return false;
  const serial0 = toastSerial;
  caosToastTexto(toast, "💭 ···");
  toast.classList.add("show", "caos-thinking");
  setTimeout(() => {
    if (toastSerial === serial0 && !activeToastState) toast.classList.remove("show", "caos-thinking");
  }, 2500);
  caosMesa.falso = 1;
  caosLog("cerebro", "falso carregamento");
  return true;
}
function caosNickAnalise(nome) {
  const k = nameKeyPlain(nome);
  if (!k || isJfName(nome) || isAnneName(nome)) return null;
  if (isEnigmaName(nome)) return { tipo: "enigma" };
  if (/(^|[^0-9])67([^0-9]|$)|(^|[^0-9])6 ?-? ?7([^0-9]|$)|six ?-? ?seven|meia ?sete/.test(k))
    return { tipo: "sixseven" };
  if (
    /brain ?rot|skibidi|(^|[^a-z])npc([^a-z]|$)|tralalero|tung ?tung|sahur|bombardiro|capuccin|patapim|labubu|delulu|slay|amogus|among ?us|(^|[^a-z])sus([^a-z]|$)|cringe|looksmax|mewing|fanum|ohio|rizz/.test(
      k,
    )
  )
    return { tipo: "genz" };
  if (/aura|sigma|chad|alpha|alfa|goat|(^|[^a-z])mog/.test(k)) return { tipo: "aura" };
  if (
    /player|matador|sniper|lenda|legend|brabo|craque|invict|imbativ|monstro|mito|^(boss|god|king)|(^|[^a-z])(pro|rei|boss|god|king|deus)([^a-z]|$)/.test(
      k,
    )
  )
    return { tipo: "tryhard" };
  const num = k.match(/\d+/);
  if (num) {
    const x = num[0];
    const sub = /^(19[4-9]\d|20[0-2]\d)$/.test(x)
      ? "ano"
      : ["7", "9", "10", "11"].includes(x)
        ? "camisa"
        : /^(123|1234|12345|321|4321)$/.test(x)
          ? "senha"
          : /^00\d?$/.test(x)
            ? "agente"
            : "generico";
    return { tipo: "numero", sub, x };
  }
  const palavras = k
    .replace(/[^a-z ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (palavras.length && palavras.length <= 2 && palavras.every((w) => CAOS_NOMES_REAIS.has(w)))
    return { tipo: "nomeReal" };
  return null;
}
function caosPerfilCadastro(p) {
  const PJ = REACTIVE_VOICE.perfilJogador,
    R = Math.random,
    na = caosNickAnalise(p.name),
    pf = caosPerfilAvatar(p);
  if (na && na.tipo === "enigma") return getRandomReaction(PJ.enigma.cadastro);
  if (na && (na.tipo === "sixseven" || na.tipo === "genz"))
    return getRandomReaction(PJ.nick.cadastro[na.tipo], p.name) + " " + caosAutoConsciencia();
  const op = [];
  if (na && na.tipo === "numero") op.push(() => getRandomReaction(PJ.nick.numero[na.sub], p.name, na.x));
  else if (na && PJ.nick.cadastro[na.tipo]) op.push(() => getRandomReaction(PJ.nick.cadastro[na.tipo], p.name));
  if (pf) op.push(() => getRandomReaction(PJ.avatar.cadastro[pf], p.name));
  if (!op.length || R() >= 0.6) return null;
  return op[Math.floor(R() * op.length)]() || null;
}
function caosCasal() {
  if (players.length < 3) return null;
  const j = players.findIndex((p) => isJfName(p.name)),
    a = players.findIndex((p) => isAnneName(p.name));
  return j >= 0 && a >= 0 ? { j, a } : null;
}
function caosCasalPode() {
  return stats.totalDrawn - (caosMesa.casalCarta ?? -99) >= 3;
}
function caosCasalMarca() {
  caosMesa.casalCarta = stats.totalDrawn;
}
function caosCasalErro(tipo, p) {
  const c = caosCasal();
  if (!c || !p || tipo === "pular" || !caosCasalPode()) return "";
  const C = REACTIVE_VOICE.perfilJogador.casal,
    idx = players.indexOf(p),
    R = Math.random;
  let m = "";
  if (idx === c.a && mestreIndex === c.j)
    m =
      tipo === "absurdo"
        ? R() < 0.8
          ? getRandomReaction(C.anneAbsurdo)
          : ""
        : R() < 0.45
          ? getRandomReaction(C.anneErraJfMestre)
          : "";
  else if (idx === c.j && mestreIndex === c.a)
    m =
      tipo === "absurdo"
        ? R() < 0.8
          ? getRandomReaction(C.jfAbsurdoPelaAnne)
          : ""
        : R() < 0.4
          ? getRandomReaction(C.jfErraAnneMestre)
          : "";
  if (m) caosCasalMarca();
  return m;
}
function caosCasalAcerto(p, scorerIdx) {
  const c = caosCasal();
  if (!c || !p || !caosCasalPode()) return "";
  const C = REACTIVE_VOICE.perfilJogador.casal,
    R = Math.random,
    par = scorerIdx === c.j ? c.a : scorerIdx === c.a ? c.j : -1;
  if (par < 0) return "";
  let m = "";
  if (caosPrevLeaderIdx === par && caosLeaderIdx() === scorerIdx && R() < 0.8)
    m = getRandomReaction(C.virada, p.name, players[par].name);
  else if (mestreIndex === par && R() < 0.35) m = getRandomReaction(C.acertoParceiroMestre, p.name, players[par].name);
  if (m) caosCasalMarca();
  return m;
}
function caosCasalEspecial(quemIdx, alvoIdx) {
  const c = caosCasal();
  if (!c) return "";
  if (!((quemIdx === c.j && alvoIdx === c.a) || (quemIdx === c.a && alvoIdx === c.j))) return "";
  if (!caosOncePerMatch("casal_esp_" + quemIdx)) return "";
  caosCasalMarca();
  return getRandomReaction(REACTIVE_VOICE.perfilJogador.casal.especial, players[quemIdx].name, players[alvoIdx].name);
}
function caosCasalFim() {
  const c = caosCasal();
  if (!c || Math.random() >= 0.8) return;
  const vj = rankValue(players[c.j]),
    va = rankValue(players[c.a]);
  if (vj === va) return;
  const msg = getRandomReaction(
    vj > va ? REACTIVE_VOICE.perfilJogador.casal.fimJf : REACTIVE_VOICE.perfilJogador.casal.fimAnne,
  );
  setTimeout(() => {
    if (gameEnded) showToastMessage(msg, null, true);
  }, 12e3);
}
