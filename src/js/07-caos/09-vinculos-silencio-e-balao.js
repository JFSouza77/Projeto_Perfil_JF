function caosVinculoReset() {
  caosVinc = {
    fav: null,
    motivo: "",
    negados: {},
    ress: {},
    desafeto: null,
    desafetoFoi: null,
    acusou: {},
    cartaUlt: -99,
    favFoi: null,
    decepcionou: false,
  };
}
function caosVincElegivelDesafeto(p) {
  return p && !p.iniciante && CURRENT_MODE !== "junior" && playerHumor(p) !== "suave";
}
function caosVinculoSortear() {
  if (caosVinc.fav || caosVinc.decepcionou || players.length < 2) return;
  const pesos = players.map(
    (p2) => 1 + Math.min(10, memContaFicha(p2) && fichaGet(p2.name) ? fichaGet(p2.name).partidas : 0) * 0.3,
  );
  let r = Math.random() * pesos.reduce((a, b) => a + b, 0),
    idx = 0;
  for (let i = 0; i < pesos.length; i++) {
    r -= pesos[i];
    if (r <= 0) {
      idx = i;
      break;
    }
  }
  const p = players[idx],
    f = memContaFicha(p) && fichaGet(p.name);
  const motivos = [
    idx === 0 ? "foi a primeira pessoa a entrar no cadastro" : null,
    p.avatar ? `o ${p.avatar} do avatar me ganhou` : null,
    `o nick tem ${p.name.length} letras, meu número da sorte de hoje`,
    f && f.partidas >= 3 ? `a gente já jogou ${f.partidas} partidas` : null,
    "escolheu uma cor bonita",
  ].filter(Boolean);
  caosVinc.fav = p.name;
  caosVinc.motivo = motivos[Math.floor(Math.random() * motivos.length)];
  caosLog("vinculo", "💘 favorito secreto: " + p.name + " (" + caosVinc.motivo + ")");
}
function caosVincEhFav(p) {
  return !!(p && caosVinc && caosVinc.fav && nameKeyPlain(p.name) === nameKeyPlain(caosVinc.fav));
}
function caosVinculoCarta() {
  try {
    if (!starterChosen || gameEnded) return;
    caosVinculoSortear();
    const neg = Object.keys(caosVinc.negados).length;
    if (
      players.length >= 3 &&
      CURRENT_MODE !== "junior" &&
      stats.totalDrawn >= 3 &&
      neg < players.length - 2 &&
      stats.totalDrawn - caosVinc.cartaUlt >= 4 &&
      Math.random() < 0.08
    ) {
      const cand = players.filter(
        (p) => !caosVincEhFav(p) && !caosVinc.negados[p.name] && !p.iniciante && playerHumor(p) !== "suave",
      );
      if (cand.length) {
        const p = cand[Math.floor(Math.random() * cand.length)];
        caosVinc.negados[p.name] = 1;
        caosVinc.cartaUlt = stats.totalDrawn;
        caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.vinculo.naoEVoce, p.name), 1200, "baixa");
      }
    }
  } catch (e) {}
}
function caosVincRessent(p, q, motivo) {
  if (!p || !caosVincElegivelDesafeto(p) || caosVincEhFav(p)) return;
  const n = p.name;
  caosVinc.ress[n] = Math.min(6, (caosVinc.ress[n] || 0) + q);
  if (!caosVinc.desafeto && caosVinc.ress[n] >= 3) {
    caosVinc.desafeto = n;
    caosVinc.desafetoFoi = n;
    caosLog("vinculo", "😒 desafeto da partida: " + n + " (" + motivo + ")");
  }
}
function caosVinculoErro(p, tipo) {
  if (!p) return;
  const idx = players.indexOf(p);
  if (
    caosVincEhFav(p) &&
    !caosVinc.decepcionou &&
    tipo !== "absurdo" &&
    tipo !== "pular" &&
    idx >= 0 &&
    caosTrailing(idx, "M") >= 3
  ) {
    caosVinc.favFoi = p.name;
    caosVinc.fav = null;
    caosVinc.decepcionou = true;
    caosLog("vinculo", "💔 favorito decepcionou: " + p.name);
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.vinculo.decepcao, p.name), 1300, "media");
    return;
  }
  if (tipo === "absurdo") caosVincRessent(p, 1, "Absurdo");
  else if (tipo === "pular") caosVincRessent(p, 0.5, "pulou");
  else if (idx >= 0 && caosTrailing(idx, "M") >= 3) caosVincRessent(p, 0.5, "erros seguidos");
  if (caosVincEhFav(p) && tipo !== "absurdo" && Math.random() < 0.08 && stats.totalDrawn - caosVinc.cartaUlt >= 3) {
    caosVinc.cartaUlt = stats.totalDrawn;
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.vinculo.defesaFav, p.name), 1400, "baixa");
  }
}
function caosVinculoAcerto(idx) {
  const p = players[idx];
  if (!p || !caosVinc) return;
  const n = p.name;
  if (caosVinc.ress[n]) caosVinc.ress[n] = Math.max(0, caosVinc.ress[n] - 0.7);
  if (caosVinc.desafeto === n) {
    if (Math.random() < 0.35)
      caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.vinculo.elogioContrariado, n), 1600, "baixa");
    if ((caosVinc.ress[n] || 0) < 1.5) {
      caosVinc.desafeto = null;
      caosLog("vinculo", "🤝 " + n + " se redimiu");
    }
  }
}
function caosVinculoCorte() {
  const m = mestreIndex !== null && mestreIndex !== void 0 ? players[mestreIndex] : null;
  if (m) caosVincRessent(m, 1, "cortou a fala");
}
function caosVinculoNaoCurti() {
  const m = mestreIndex !== null && mestreIndex !== void 0 && starterChosen && !gameEnded ? players[mestreIndex] : null;
  if (!m || !caosVincElegivelDesafeto(m)) return;
  caosVincRessent(m, 1, "👎 (palpite: quem segurava o celular)");
  if (!caosVinc.acusou[m.name] && Math.random() < 0.4) {
    caosVinc.acusou[m.name] = 1;
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.vinculo.acusa, m.name), 1800, "baixa");
    const serV = caosPartidaSerial;
    if (Math.random() < 0.3)
      setTimeout(() => {
        if (!gameEnded && serV === caosPartidaSerial && caosVinc) {
          caosVinc.ress[m.name] = Math.max(0, (caosVinc.ress[m.name] || 0) - 1);
          showToastMessage(getRandomReaction(REACTIVE_VOICE.vinculo.voltaAtras, m.name));
        }
      }, 26e3);
  }
}
function caosVinculoResenha(f, pick, suave) {
  if (!caosVinc || !caosVinc.fav) return;
  f.push(
    pick([
      `Confissão: meu favorito da noite era ${caosVinc.fav}. Motivo: ${caosVinc.motivo}. Sim, é um motivo bobo.`,
      `Agora eu posso contar: meu favorito era ${caosVinc.fav}. Por quê? ${caosLexCap(caosVinc.motivo)}. Critério científico.`,
    ]),
  );
  if (caosVinc.desafetoFoi && !suave)
    f.push(
      pick([
        `E ${caosVinc.desafetoFoi}: a gente teve nossos momentos. Página virada. Quase.`,
        `${caosVinc.desafetoFoi}, sem ressentimentos. Poucos. Tá, alguns. Mas a gente se entende.`,
      ]),
    );
}
function caosAusentesTalvez() {
  try {
    if (stats.totalDrawn !== 2 || !caosOncePerMatch("ausentes") || CURRENT_MODE === "junior") return;
    const fichas = Object.values(fichasTodas() || {}),
      jaJogou = (f) => fichas.some((x) => x && x.nome && f(x.nome));
    const temJf = players.some((p) => isJfName(p.name)),
      temAnne = players.some((p) => isAnneName(p.name));
    const conheceJf = jaJogou(isJfName),
      conheceAnne = jaJogou(isAnneName);
    let bank = null;
    if (!temJf && !temAnne && conheceJf && conheceAnne && Math.random() < 0.6) bank = REACTIVE_VOICE.ausentes.ambos;
    else if (temJf && !temAnne && conheceAnne && Math.random() < 0.45) bank = REACTIVE_VOICE.ausentes.anne;
    else if (!temJf && temAnne && conheceJf && Math.random() < 0.45) bank = REACTIVE_VOICE.ausentes.jf;
    if (bank) caosToastAtrasado(() => showToastMessage(getRandomReaction(bank)), 1500);
  } catch (e) {}
}
function caosSatisfacaoTalvez() {
  try {
    if (gameEnded || stats.totalDrawn < 4 || document.getElementById("caosPergunta")) return;
    const p = players.find((x) => x && x.humorCaos && !x.humorPergunta && !x.iniciante);
    if (!p || Math.random() > 0.3) return;
    p.humorPergunta = true;
    const d = document.createElement("div");
    d.id = "caosPergunta";
    d.className = "caos-pergunta";
    d.setAttribute("role", "group");
    const fechar = () => d.remove(),
      nome = p.name;
    const passo1 = () => {
      d.innerHTML = `<span>🤖 <b>${escapeHtml(nome)}</b>, tá curtindo o jeito que eu tô te tratando?</span><button type="button" data-v="sim">👍 Tô</button><button type="button" data-v="nao">👎 Não</button>`;
    };
    const ordem =
      CURRENT_MODE === "junior"
        ? ["familia", "suave", "normal"]
        : CURRENT_MODE === "hardcore"
          ? ["normal", "acido", "zero"]
          : ["suave", "normal", "acido"];
    // Nível 0 fica acima de tudo; fora do Hardcore ele não está na escada do sorteio.
    const degrau = (h) => (ordem.includes(h) ? ordem.indexOf(h) : h === "zero" ? ordem.length : 0);
    const passo2 = () => {
      const i = degrau(humorEscolhido(p));
      const bts = [];
      if (i < ordem.length - 1) bts.push('<button type="button" data-v="mais">⬆️ Pode pegar mais pesado</button>');
      if (i > 0) bts.push('<button type="button" data-v="menos">⬇️ Pega mais leve</button>');
      d.innerHTML = `<span>🤖 Quer que eu mude, <b>${escapeHtml(nome)}</b>?</span>${bts.join("")}<button type="button" data-v="igual">Deixa assim</button>`;
    };
    d.addEventListener("click", (ev) => {
      const b = ev.target.closest("button");
      if (!b) return;
      ev.stopPropagation();
      const v = b.dataset.v,
        q = players.find((x) => x.name === nome);
      if (!q) return fechar();
      if (v === "nao") return passo2();
      fechar();
      const i = degrau(humorEscolhido(q));
      if (v === "mais" && i < ordem.length - 1) q.humor = ordem[i + 1];
      if (v === "menos" && i > 0) q.humor = ordem[i - 1];
      caosLog("satisfacao", `${nome}: ${v} → ${q.humor}`);
      saveGameState();
      renderScoreboard && renderScoreboard();
      caosFalarDepois(
        getRandomReaction(REACTIVE_VOICE.satisfacao[v === "mais" ? "mais" : v === "menos" ? "menos" : "ok"], nome),
      );
    });
    passo1();
    document.body.appendChild(d);
    setTimeout(() => {
      if (d.isConnected) d.remove();
    }, 14e3);
  } catch (e) {}
}
function caosPausaMagoaCarta() {
  if (caosMagoa <= 0) return;
  const f = 1 / caosMagoa;
  caosEmo.tensao = caosEmoClamp(caosEmo.tensao + (5 - caosEmo.tensao) * f);
  caosEmo.calor = caosEmoClamp(caosEmo.calor + (5 - caosEmo.calor) * f);
  caosEmo.paciencia = caosEmoClamp((caosEmo.paciencia ?? 7) + (7 - (caosEmo.paciencia ?? 7)) * f);
  caosMagoa--;
  if (caosMagoa === 0) {
    const pico = caosMagoaPico;
    caosMagoaPico = 0;
    if (pico >= 2 && !caosSilenced && Math.random() < 0.6)
      caosToastAtrasado(() => showToastMessage(getRandomReaction(REACTIVE_VOICE.pausaCalmou)), 1600);
  }
}
function caosLed(on) {
  try {
    const l = document.getElementById("caosStatusLed");
    if (!l) return;
    clearInterval(caosLedT);
    l.classList.toggle("on", !!on);
    l.classList.remove("alt");
    if (on) caosLedT = setInterval(() => l.classList.toggle("alt"), 380);
  } catch (e) {}
}
function caosMarcadoRedencao(idx, clues) {
  try {
    if (caosMarked.idx === null || caosMarked.idx !== idx || clues > 2) return;
    const p = players[idx];
    if (!p) return;
    caosPrevMarkedIdx = idx;
    caosMarked.idx = null;
    caosMarked.remaining = 0;
    caosLog("marcado", "redenção: " + p.name + " acertou com " + clues + " dica(s)");
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.marcadoRedencao, p.name), 900, "media");
  } catch (e) {}
}
function caosDescansoRegistrar() {
  try {
    if (!caosPartidaInicioAt || !stats || stats.totalDrawn < 5) return;
    const agora = Date.now();
    let rec = [];
    try {
      rec = JSON.parse(JFStore.getItem("perfil5_caos_fimsrecentes") || "[]");
    } catch (e) {}
    rec = (Array.isArray(rec) ? rec : [])
      .filter((t) => typeof t === "number" && agora - t < 72e5)
      .concat(agora)
      .slice(-6);
    JFStore.setItem("perfil5_caos_fimsrecentes", JSON.stringify(rec));
    const dur = caosMinutosAtivos();
    if (dur < 60 && rec.length < 3) return;
    JFStore.setItem(
      CAOS_DESCANSO_KEY,
      JSON.stringify({ fim: agora + CAOS_DESCANSO_MIN * 6e4, min: CAOS_DESCANSO_MIN }),
    );
    caosLog(
      "descanso",
      "exige " +
        CAOS_DESCANSO_MIN +
        " min (" +
        (dur >= 60 ? "partida de " + Math.round(dur) + " min" : "3 partidas em 2 h") +
        ")",
    );
    const ser = caosPartidaSerial;
    setTimeout(() => {
      if (ser !== caosPartidaSerial || !gameEnded) return;
      showToastMessage(getRandomReaction(REACTIVE_VOICE.descanso.exige, CAOS_DESCANSO_MIN), null, true);
    }, 14e3);
  } catch (e) {}
}
function caosDescansoChecar() {
  caosDescansoFalou = false;
  try {
    const raw = JFStore.getItem(CAOS_DESCANSO_KEY);
    if (!raw) return;
    JFStore.removeItem(CAOS_DESCANSO_KEY);
    const d = JSON.parse(raw);
    if (!d || typeof d.fim !== "number") return;
    const agora = Date.now();
    if (agora - d.fim > 72e5) return;
    const falta = Math.max(0, Math.ceil((d.fim - agora) / 6e4));
    let bank,
      args = [];
    if (falta > 3) {
      const fr = Math.min(1, falta / CAOS_DESCANSO_MIN);
      caosEmo.tensao = caosEmoClamp(5 + 3 * fr);
      caosEmo.paciencia = caosEmoClamp(7 - 4 * fr);
      caosEmo.calor = caosEmoClamp(5 - 2 * fr);
      caosSentir("raiva", falta > 8 ? 2 : 1, "intervalo interrompido");
      bank = REACTIVE_VOICE.descanso.interrompido;
      args = [falta];
    } else if (falta > 0) {
      caosEmo.tensao = caosEmoClamp(6);
      caosEmo.paciencia = caosEmoClamp(5);
      bank = REACTIVE_VOICE.descanso.quase;
      args = [falta];
    } else {
      caosEmo.tensao = caosEmoClamp(3);
      caosEmo.paciencia = caosEmoClamp(9);
      caosEmo.calor = caosEmoClamp(7);
      bank = REACTIVE_VOICE.descanso.respeitado;
    }
    caosLog("descanso", "início: faltavam " + falta + " min");
    caosDescansoFalou = true;
    caosFalaAgendar(() => getRandomReaction(bank, ...args), 2500, "sempre");
  } catch (e) {}
}
function caosMagoaFim() {
  try {
    if (CURRENT_MODE === "junior") return;
    players.forEach((p) => {
      if (!memContaFicha(p) || p.iniciante) return;
      const cortes = (caosCortes && caosCortes.por && caosCortes.por[p.name]) || 0;
      const mag = cortes >= 4 || (caosVinc && caosVinc.desafetoFoi === p.name);
      fichaUpd(p.name, (f) => {
        f.magoa = mag ? Math.min(3, (f.magoa || 0) + 1) : Math.max(0, (f.magoa || 0) - 1);
      });
    });
  } catch (e) {}
}
function caosMagoaInicio() {
  try {
    if (CURRENT_MODE === "junior" || caosDescansoFalou) return;
    const p = players.find(
      (x) =>
        !x.iniciante && playerHumor(x) !== "suave" && memContaFicha(x) && ((fichaGet(x.name) || {}).magoa || 0) >= 1,
    );
    if (!p) return;
    caosCortes.rancor[p.name] = true;
    caosLog("magoa", "começa magoado com " + p.name);
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.memoria.magoado, p.name), 4500, "sempre");
  } catch (e) {}
}
function caosMinutosAtivos() {
  return Math.max(0, (Date.now() - (caosPartidaInicioAt || Date.now()) - (caosPausaAcum || 0)) / 6e4);
}
function caosNomeMestre() {
  return players[mestreIndex] ? players[mestreIndex].name : "o Mestre";
}
function caosFalaBotao(botao, resto) {
  return "[C.A.O.S.] Atenção, mesa! O Mestre, " + caosNomeMestre() + ", apertou " + botao + ". " + resto;
}
function caosConfirmarComVoz(msg, txtSim, txtNao, onSim, fala) {
  const limpa = String(fala || "").replace(/^\[C\.A\.O\.S\.\]\s*/, "");
  caosConfirmarModal(msg + (limpa ? "\n\n🤖 " + limpa : ""), txtSim, txtNao, () => {
    caosVoiceCancel();
    onSim();
  });
  try {
    const ov = document.getElementById("caosConfirmModal");
    if (ov) ov.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => caosVoiceCancel()));
  } catch (e) {}
  if (fala) caosFalarNormal(fala);
}
function caosSilenciarCarta() {
  if (caosMudoCarta || gameEnded || !starterChosen) return;
  caosVoiceCancel();
  const quem = players[mestreIndex] ? players[mestreIndex].name : null;
  caosMudoCarta = true;
  caosMudoPor = quem;
  try {
    caosLog("silenciado", "C.A.O.S. silenciado nesta carta por " + (quem || "?"));
  } catch (e) {}
  try {
    closeActiveToast();
  } catch (e) {}
  try {
    caosRegistrarCorte();
  } catch (e) {}
  try {
    showToastMessage("🔇 C.A.O.S. silenciado até o fim desta carta.", null, true);
  } catch (e) {}
  saveGameState();
}
// 1.7.5.2: religar o C.A.O.S. pela Pausa (o 🔇 foi sem querer). Desfaz o corte que o
// silêncio contou (cortes, rancor, marcação de quem silenciou) e a raiva/tristeza dele,
// e ele volta agradecido em vez de magoado.
function caosReligarCarta() {
  if (!caosMudoCarta || gameEnded) return;
  const quem = caosMudoPor;
  caosMudoCarta = false;
  caosMudoPor = null;
  try {
    if (caosCortes.total > 0) caosCortes.total--;
    if (quem && caosCortes.por[quem] > 0) {
      caosCortes.por[quem]--;
      if (!caosCortes.por[quem]) {
        delete caosCortes.por[quem];
        delete caosCortes.rancor[quem];
      }
    }
    const qi = quem ? players.findIndex((p) => p.name === quem) : -1;
    if (qi >= 0 && caosMarked.idx === qi) caosMarked = { idx: null, remaining: 0 };
    caosEmoNudge(-0.6, 0.5);
    if (caosConsole) {
      caosConsole.g.raiva = Math.max(0, (caosConsole.g.raiva || 0) - 2);
      caosConsole.g.tristeza = Math.max(0, (caosConsole.g.tristeza || 0) - 1.5);
    }
    caosSentir("carinho", 2, "religado na pausa");
    caosLog("silenciado", "religado na pausa por quem clicou sem querer (corte desfeito)");
  } catch (e) {}
  const txt =
    caosGerarFala("religado", quem ? players.find((p) => p.name === quem) : null) ||
    "[C.A.O.S.] Voltei! Eu sabia que o 🔇 foi sem querer.";
  const box = document.getElementById("pausaCaos");
  if (box) {
    box.style.display = "";
    box.classList.add("show");
    caosToastEmo(box, "carinho", null);
    box.textContent = String(txt).replace(/[⟦⟧]/g, "");
  }
  pausaAjustesAtualizar();
  saveGameState();
}
function caosMudoVolta() {
  if (!caosMudoCarta) return;
  caosMudoCarta = false;
  const quem = caosMudoPor;
  caosMudoPor = null;
  try {
    caosEmoNudge(3, -1.2);
    caosSentir("raiva", 2.5, "foi silenciado");
    caosSentir("tristeza", 1.2, "foi silenciado");
    if (quem) caosCortes.rancor[quem] = true;
  } catch (e) {}
  const p = quem && players.find((x) => x.name === quem);
  if (p && playerHumor(p) === "zero" && !p.iniciante) {
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.silenciaramVoltaZero, quem), 700, "sempre");
    return;
  }
  if (p && (playerHumor(p) === "suave" || p.iniciante)) {
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.silenciaramVoltaSuave, quem), 700, "sempre");
    return;
  }
  caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.silenciaramVolta, quem || "Mestre"), 700, "sempre");
}
function caosChuteAnalisar(chute, resposta, cat) {
  const g = caosChuteNorm(chute),
    r = caosChuteNorm(resposta);
  if (!g) return { tipo: "vazio" };
  if (cat === "ANO" || /^\d{3,4}$/.test(r)) {
    const gn = parseInt((g.match(/\d{1,4}/) || [])[0], 10),
      rn = parseInt((r.match(/\d{1,4}/) || [])[0], 10);
    if (isFinite(gn) && isFinite(rn) && gn !== rn) {
      const d = Math.abs(gn - rn);
      const tipo = d <= 2 ? "anoTrave" : d <= 10 ? "anoPerto" : d <= 50 ? "anoMedio" : d <= 300 ? "anoLonge" : "anoEra";
      return { tipo, d, antes: gn < rn, gn };
    }
    if (gn === rn) return { tipo: "igual" };
  }
  if (g === r) return { tipo: "igual" };
  const gt = g.split(" ").filter((x) => x.length >= 3),
    rt = r.split(" ").filter((x) => x.length >= 3);
  const comum = gt.filter((x) => rt.some((y) => y === x || y.startsWith(x) || x.startsWith(y)));
  if ((comum.length && comum.length < Math.max(rt.length, 1)) || (comum.length && gt.length < rt.length))
    return { tipo: "parte" };
  const sim = 1 - caosLev(g, r) / Math.max(g.length, r.length, 1);
  if (sim >= 0.62) return { tipo: "parecido" };
  if (g[0] && g[0] === r[0] && sim >= 0.3) return { tipo: "inicial" };
  return { tipo: "longe" };
}
function caosChuteResponder(nome, chute) {
  const p = players.find((q) => q.name === nome);
  if (!p || gameEnded || !currentCard) return;
  const cat = gemCategoryFor ? gemCategoryFor(currentCard.category) : currentCard.category;
  const an = caosChuteAnalisar(chute, currentCard.answer, cat),
    B = REACTIVE_VOICE.chute;
  const suave = playerHumor(p) === "suave";
  const g = String(chute).trim().slice(0, 30);
  caosLog("chute", nome + " chutou '" + g + "' → " + an.tipo + (an.d != null ? " (" + an.d + " anos)" : ""));
  let banco = null;
  if (an.tipo.startsWith("ano")) banco = B[an.tipo];
  else banco = B[an.tipo];
  if (!banco || !banco.length) return;
  const fraseSuave = suave && B[an.tipo + "Suave"];
  const lista = fraseSuave && fraseSuave.length ? fraseSuave : banco;
  caosEmoNudge(an.tipo === "longe" || an.tipo === "anoEra" ? 0.3 : -0.2, an.tipo === "longe" ? 0 : 0.3);
  const gerada = caosChuteGerar(p, an, g, cat, fraseSuave && fraseSuave.length);
  caosFalarDepois(gerada || getRandomReaction(lista, nome, g, an.d || 0, an.antes ? "antes" : "depois"));
}
// 1.7.5.2: memória dos chutes da carta (pra lembrar de chute repetido) e o gerador de chute.
let caosChutesCarta = { carta: -1, lista: [] };
function caosChuteGerar(p, an, g, cat, suave) {
  try {
    if (caosChutesCarta.carta !== stats.totalDrawn) caosChutesCarta = { carta: stats.totalDrawn, lista: [] };
    const nk = caosChuteNorm(g);
    const antes = caosChutesCarta.lista.find((c) => c.k === nk);
    caosChutesCarta.lista.push({ k: nk, nome: p.name });
    if (caosChutesCarta.lista.length > 30) caosChutesCarta.lista.shift();
    const tags = ["tipo_" + an.tipo + (suave ? "Suave" : "")];
    const dicas = revealedOrder.filter((r) => r.item && r.item.type === "clue").length;
    const vars = {
      chute: g,
      anos: an.d === 1 ? "1 ano" : (an.d || 0) + " anos",
      dicasTxt: dicas === 1 ? "1 dica" : dicas + " dicas",
      cat: CAOS_CAT_NOME[cat] || cat,
    };
    // Suave/iniciante: só a reação, sem comentário extra (que costuma ser zoeira)
    if (an.tipo !== "igual" && playerHumor(p) !== "suave") {
      tags.push("cat_" + cat);
      if (antes && antes.nome === p.name) tags.push("chuteRepetidoMesmo");
      else if (antes) {
        tags.push("chuteRepetido");
        vars.quemAntes = antes.nome;
      }
      if (dicas >= 1 && dicas <= 2) tags.push("poucasDicas");
      if (dicas >= 10) tags.push("muitasDicas");
      const t = memContaFicha(p) ? fichaTaxa(fichaGet(p.name), cat) : { n: 0 };
      if (t.n >= 5 && t.taxa >= 0.6) tags.push("forteCat");
      if (t.n >= 5 && t.taxa <= 0.35) tags.push("fracoCat");
      if (currentCard && currentCard._caosDificuldade === "dificil") tags.push("cartaDificil");
      if (currentCard && currentCard._caosDificuldade === "facil") tags.push("cartaFacil");
    }
    return caosGerarFala("chute", p, { tags, vars });
  } catch (e) {
    return "";
  }
}
function caosChuteDigitar(nome) {
  caosPromptModal("O que " + nome + " chutou? (o C.A.O.S. não ouve, então conta pra ele)", "", (v) => {
    if (v == null) return;
    const t = String(v).trim();
    if (!t) return;
    caosChuteResponder(nome, t);
  });
}
function closeActiveToast() {
  if (!activeToastState) return;
  const { hadActiveTimer, afterClose, deferred, frozenAt, freezeEndedAt, frozenTimerSerial, frozenCardSerial } =
    activeToastState;
  activeToastState = null;
  if (toastTimeoutRef) {
    clearTimeout(toastTimeoutRef);
    toastTimeoutRef = null;
  }
  const toast = document.getElementById("jfToast");
  if (toast) toast.classList.remove("show");
  if (hadActiveTimer) {
    const frozenMs = Math.max(0, (freezeEndedAt || Date.now()) - frozenAt);
    if (cardEndAt && cardSerial === frozenCardSerial) cardEndAt += frozenMs;
    if (timerEndAt && timerSerial === frozenTimerSerial) {
      timerEndAt += frozenMs;
      if (typeof pendingStartTime === "number" && pendingStartTime !== null) pendingStartTime += frozenMs;
      resumeTimerInterval();
      updateTimerDisplay();
    } else if (cardEndAt && !timerInterval && CURRENT_MODE === "express" && cardState === "revealed") {
      resumeTimerInterval();
    }
  }
  if (typeof afterClose === "function") afterClose();
  if (deferred && deferred.length)
    deferred.forEach((fn) => {
      if (typeof fn === "function") fn();
    });
  caosFilaProxima();
}
function showToastMessage(msg, afterClose, bypassSilence, priority, noFreeze) {
  if (caosSorteioSilencio && !bypassSilence) {
    if (typeof afterClose === "function") afterClose();
    return;
  }
  if (caosMudoCarta && !bypassSilence && !priority && typeof msg === "string" && msg.indexOf("[C.A.O.S.]") !== -1) {
    if (typeof afterClose === "function") afterClose();
    return;
  }
  if (caosSilenced && !bypassSilence) {
    if (typeof afterClose === "function") afterClose();
    return;
  }
  if (!msg) {
    if (typeof afterClose === "function") afterClose();
    return;
  }
  if (
    typeof msg === "string" &&
    msg.indexOf("[C.A.O.S.]") !== -1 &&
    !priority &&
    !bypassSilence &&
    caosToastBloquear()
  ) {
    if (typeof afterClose === "function") afterClose();
    return;
  }
  if (
    CURRENT_MODE === "express" &&
    !priority &&
    !bypassSilence &&
    cardState === "revealed" &&
    !gameEnded &&
    String(msg).length > 150
  ) {
    caosLog("express", "fala longa cortada: " + String(msg).slice(0, 60));
    if (typeof afterClose === "function") afterClose();
    return;
  }
  if (activeToastState && activeToastState.priority && !priority) {
    if (typeof afterClose === "function") activeToastState.deferred.push(afterClose);
    return;
  }
  if (!priority && !bypassSilence && activeToastState && !activeToastState.priority) {
    if (typeof afterClose !== "function" && String(msg).indexOf("[C.A.O.S.]") !== -1) {
      caosFilaGuardar(msg, noFreeze);
      return;
    }
    const vis = Date.now() - (activeToastState.shownAt || activeToastState.frozenAt);
    const alvoLeitura = caosLeituraMinMs(activeToastState);
    if (vis < alvoLeitura) {
      const carta = stats.totalDrawn;
      const tentar = () => {
        if (gameEnded) return;
        if (document.getElementById("pauseScreen").style.display === "block") {
          setTimeout(tentar, 1e3);
          return;
        }
        if (
          stats.totalDrawn - carta >= 2 ||
          (stats.totalDrawn !== carta && cardState === "revealed" && revealedOrder.length > 0)
        ) {
          if (typeof afterClose === "function") afterClose();
          return;
        }
        showToastMessage(msg, afterClose, bypassSilence, priority, noFreeze);
      };
      setTimeout(tentar, alvoLeitura - vis + 60);
      return;
    }
  }
  for (let guard = 0; activeToastState && guard < 4; guard++) {
    if (guard > 0 && activeToastState.priority && !priority) {
      if (typeof afterClose === "function") activeToastState.deferred.push(afterClose);
      return;
    }
    closeActiveToast();
  }
  if (!priority && !bypassSilence) {
    const sil = caosSilencioTalvez(msg);
    if (sil) msg = sil;
  }
  let caosBancoFala =
    caosLastPick && String(msg).indexOf(String(caosLastPick.text).replace(/^\[C\.A\.O\.S\.\]\s*/, "")) !== -1
      ? caosLastPick.bank
      : null;
  const viradaManual = caosViradaManual(msg, caosBancoFala, priority);
  if (viradaManual) {
    msg = viradaManual.msg;
    caosBancoFala = viradaManual.banco;
    caosLastPick = { bank: viradaManual.banco, key: "virada|" + viradaManual.idx, text: msg };
    caosViradaPend = viradaManual;
  }
  const caosEmoFala =
    typeof msg === "string" && msg.indexOf("[C.A.O.S.]") !== -1
      ? caosEscada(caosEmocaoDaFala(caosBancoFala), caosBancoFala, priority)
      : null;
  caosViradaPend = null;
  const msgAntesTropeco = msg;
  if (!priority && !viradaManual) msg = caosTropeco(msg, caosBancoFala);
  const tropecou = msg !== msgAntesTropeco;
  if (
    caosEmoFala &&
    caosUltEmojiAdd &&
    msg.endsWith(" " + caosUltEmojiAdd) &&
    Math.max(0, Math.min(1, caosEmoK(caosEmoFala))) +
      (CAOS_EMO_GRAVE[String(caosBancoFala || "").split(".")[0]] || 0) >=
      0.75
  ) {
    msg = msg.slice(0, -(caosUltEmojiAdd.length + 1));
    caosUltEmojiAdd = "";
  }
  if (caosEmoFala) caosViradaDesde++;
  const virada = viradaManual || caosViradaDecidir(msg, caosEmoFala, caosBancoFala, priority, tropecou);
  caosLogMatchLine(msg);
  if (virada) {
    virada.linha = caosMatchLog[caosMatchLog.length - 1] || null;
    caosViradaDesde = 0;
  }
  let toast = document.getElementById("jfToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "jfToast";
    toast.className = "jf-toast-overlay";
    toast.setAttribute("role", "status");
    toast.title = "Toque pra pular a fala";
    toast.addEventListener("click", caosPularFala);
    toast.addEventListener("pointerdown", caosToastSegurarInicio);
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => toast.addEventListener(ev, caosToastSegurarFim));
    toast.addEventListener("contextmenu", (ev) => ev.preventDefault());
    document.body.appendChild(toast);
  }
  const displayMs = Math.max(4200, Math.min(msg.length > 200 ? 12e3 : msg.length > 140 ? 1e4 : 8e3, msg.length * 90));
  const hadActiveTimer = !noFreeze && !!timerInterval && !!timerEndAt;
  if (hadActiveTimer) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  toast.style.borderColor = "";
  caosToastEmo(toast, caosEmoFala, caosBancoFala);
  caosToastTexto(toast, msg);
  const serial = ++toastSerial;
  if (caosEmoFala) caosBip(caosEmoFala);
  caosEixosDaFala(caosBancoFala);
  caosConsoleDaFala(caosBancoFala);
  if (tropecou && caosEmoFala) caosSentir("vergonha", 5.5, "gafe");
  if (tropecou && caosEmoFala && toast.dataset.emo) {
    toast._frames = ["(・・?)", "(・・ )?"];
    toast.setAttribute("data-face", toast._frames[0]);
    setTimeout(() => {
      if (activeToastState && activeToastState.serial === serial) {
        const ev = caosConsole && caosConsole.on ? "vergonha" : caosEmoFala;
        caosToastEmo(toast, ev, caosBancoFala);
        caosEmoFalaAtual = ev;
      }
    }, 1100);
  }
  activeToastState = {
    hadActiveTimer,
    displayMs,
    afterClose,
    priority: !!priority,
    deferred: [],
    serial,
    frozenAt: Date.now(),
    freezeEndedAt: null,
    frozenTimerSerial: timerSerial,
    frozenCardSerial: cardSerial,
  };
  caosUltimaFalaAt = Date.now();
  caosFalasRecentes.push(caosUltimaFalaAt);
  activeToastState.msg = msg;
  activeToastState.virada = virada || null;
  const caosDelay = caosReactionDelay(msg);
  activeToastState.shownAt = Date.now() + caosDelay;
  if (caosDelay > 0) {
    caosToastTexto(toast, "💭 ···");
    toast.classList.add("show", "caos-thinking");
    if (caosEmoFala) caosToastEmo(toast, "pensando");
    caosLed(true);
    setTimeout(() => {
      caosLed(false);
      if (!activeToastState || activeToastState.serial !== serial) return;
      toast.classList.remove("caos-thinking");
      caosToastEmo(toast, caosEmoFala, caosBancoFala);
      caosToastTexto(toast, msg);
      caosFalarComBalao(msg, serial, virada);
    }, caosDelay);
  } else {
    toast.classList.remove("caos-thinking");
    toast.classList.add("show");
    caosFalarComBalao(msg, serial, virada);
  }
  toastTimeoutRef = setTimeout(() => {
    if (activeToastState && activeToastState.serial === serial) closeActiveToast();
  }, displayMs + caosDelay);
}

