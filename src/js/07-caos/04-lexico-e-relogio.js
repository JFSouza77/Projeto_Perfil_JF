const caosLexPick = (a) => a[Math.floor(Math.random() * a.length)];
const caosLexCap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const caosLexMin = (s) =>
  !s || (typeof players !== "undefined" && players.some((p) => p && p.name && s.indexOf(p.name) === 0))
    ? s
    : s.charAt(0).toLowerCase() + s.slice(1);
function caosIntimidade(p) {
  const f = p && memContaFicha(p) ? fichaGet(p.name) : null,
    n = f ? f.partidas : 0;
  return n >= 10 ? "veterano" : n >= 2 ? "conhecido" : "novato";
}
function caosPrateleira(p) {
  if (!p || p.iniciante || CURRENT_MODE === "junior") return "suave";
  const h = playerHumor(p);
  if (caosVincEhFav(p) && (h === "zero" || h === "acido") && Math.random() < 0.7)
    return h === "zero" ? "acido" : "normal";
  return h === "zero" ? "zero" : h === "acido" ? "acido" : h === "suave" ? "suave" : "normal";
}
function caosFatos(tipo, p, x) {
  const F = [],
    ordem = x.ordem,
    seg = x.seg,
    dif = x.dif,
    h = new Date().getHours(),
    mestre = players[mestreIndex];
  const s = (n) => (n === 1 ? "segundo" : "segundos");
  if (tipo === "erro") {
    if (ordem === 1) F.push({ w: 3, np: "chutar logo na 1ª dica lida", fr: "Chutou logo na 1ª dica lida" });
    if (ordem >= 10)
      F.push({ w: 3, np: `errar com ${ordem} dicas já lidas`, fr: `Já eram ${ordem} dicas lidas na mesa` });
    if (seg != null && seg >= 25)
      F.push({ w: 3, np: `pensar ${seg} segundos e chegar nisso`, fr: `Foram ${seg} segundos pensando` });
    if (seg != null && seg <= 3)
      F.push({ w: 3, np: `responder em ${seg} ${s(seg)}`, fr: `A resposta saiu em ${seg} ${s(seg)}` });
    if (dif === "facil")
      F.push({ w: 4, np: "errar uma carta que a minha memória marca como fácil", fr: "Essa carta costuma ser fácil" });
    if (x.seguidos >= 3)
      F.push({ w: 3, np: `emendar o ${x.seguidos}º erro seguido`, fr: `É o ${x.seguidos}º erro seguido` });
    if (x.catRepetida) F.push({ w: 2, np: `tropeçar em ${x.cat} de novo`, fr: `${x.cat} de novo` });
    if (h >= 0 && h < 5)
      F.push({
        w: 2,
        np: `errar isso ${h === 0 ? "à meia-noite" : "às " + h + " da manhã"}`,
        fr: `O relógio marca ${h === 0 ? "meia-noite" : h + " da manhã"}`,
      });
    if (mestre && mestre !== p && x.seg != null && x.seg >= 8)
      F.push({ w: 1, np: `errar com ${mestre.name} lendo tão bem`, fr: `${mestre.name} leu direitinho` });
  } else if (tipo === "acerto") {
    if (ordem <= 2)
      F.push({
        w: 3,
        np: `acertar com ${ordem === 1 ? "uma dica lida" : "duas dicas lidas"}`,
        fr: `Acertou com ${ordem === 1 ? "uma dica lida" : "duas dicas lidas"}`,
      });
    if (ordem >= 12) F.push({ w: 2, np: `precisar de ${ordem} dicas`, fr: `Precisou de ${ordem} dicas` });
    if (seg != null && seg <= 6) F.push({ w: 3, np: `acertar em ${seg} ${s(seg)}`, fr: `Levou ${seg} ${s(seg)}` });
    if (seg != null && seg >= 40)
      F.push({ w: 2, np: `pensar ${seg} segundos até acertar`, fr: `Foram ${seg} segundos de suspense` });
    if (dif === "dificil")
      F.push({ w: 4, np: "acertar uma carta que costuma travar a mesa", fr: "Essa carta costuma travar a mesa" });
    if (x.missBefore >= 2)
      F.push({
        w: 3,
        np: `acertar depois de ${x.missBefore} erros seguidos`,
        fr: `O acerto veio depois de ${x.missBefore} erros seguidos`,
      });
  } else if (tipo === "pular") {
    if (ordem === 1) F.push({ w: 3, np: "pular logo a 1ª dica lida", fr: "Passou logo a 1ª dica lida" });
    if (x.pulos >= 3)
      F.push({ w: 3, np: `pular pela ${x.pulos}ª vez na partida`, fr: `É o ${x.pulos}º pulo da partida` });
    if (seg != null && seg >= 20)
      F.push({ w: 2, np: `pensar ${seg} segundos e desistir`, fr: `Foram ${seg} segundos pensando antes de passar` });
    if (ordem >= 12) F.push({ w: 2, np: `passar com ${ordem} dicas lidas`, fr: `Já eram ${ordem} dicas lidas` });
  }
  if (!F.length) return null;
  const tot = F.reduce((a, f) => a + f.w, 0);
  let r = Math.random() * tot;
  for (const f of F) {
    r -= f.w;
    if (r <= 0) return f;
  }
  return F[0];
}
function caosGerar(tipo, p, x) {
  const caosLexPick2 = (arr) => caosPickNR("gerar." + String((arr && arr[0]) || "").slice(0, 40), arr);
  if (!p || caosSilenced || CURRENT_MODE === "express") return "";
  x = x || {};
  const n = p.name,
    idx = players.indexOf(p),
    cat0 = currentCard ? gemCategoryFor(currentCard.category) : null;
  const ctx = {
    ordem: x.ordem != null ? x.ordem : caosCerebroOrdem(),
    seg: typeof x.ms === "number" && x.ms > 0 ? Math.max(1, Math.round(x.ms / 1e3)) : null,
    dif: currentCard ? currentCard._caosDificuldade : null,
    seguidos: idx >= 0 ? caosTrailing(idx, "M") : 0,
    missBefore: x.missBefore || 0,
    cat: CAOS_CAT_NOME[cat0] || cat0,
    catRepetida: cat0 ? caosDm(n, cat0, "p") >= 2 : false,
    pulos: caosMesa.pulosPor[n] || 0,
  };
  const cortes = (caosCortes.por && caosCortes.por[n]) || 0;
  if (cortes >= 3 && playerHumor(p) !== "suave") {
    return (
      "[C.A.O.S.] " +
      (tipo === "erro"
        ? caosLexPick2([`Errou, ${n}.`, `Não, ${n}.`, `Errado.`])
        : tipo === "acerto"
          ? caosLexPick2([`Acertou, ${n}.`, `Certo.`, `Ponto.`])
          : caosLexPick2([`Pulou.`, `Passou, ${n}.`]))
    );
  }
  const prat = caosPrateleira(p),
    intim = caosIntimidade(p),
    J = CAOS_LEX.juizo[tipo];
  if (
    tipo === "erro" &&
    prat !== "suave" &&
    (caosMesa.absurdos >= 3 || Object.keys(caosMesa.tilt || {}).length) &&
    Math.random() < 0.12
  ) {
    const t = caosLexPick2(CAOS_LEX.trivia);
    return (
      "[C.A.O.S.] " +
      caosLexPick2([
        `Você errou, ${n}. A propósito, ${t} Achei que, se é pra falar coisa sem sentido, eu também podia participar.`,
        `Erro 404: a lógica da resposta de ${n} não foi encontrada no meu banco de dados. Reiniciando o módulo de paciência…`,
        `${n}, enquanto você pensava nisso, eu aprendi que ${t} Pelo menos um de nós saiu dessa rodada sabendo alguma coisa.`,
      ])
    );
  }
  const fato = caosFatos(tipo, p, ctx);
  if (!fato) return "";
  const nomeIn = (s) => s.replace(/\{n\}/g, n);
  let juizo = caosLexPick2(J[prat]);
  if (intim === "novato" && prat !== "zero" && Math.random() < 0.4) juizo = caosLexPick2(J.formal);
  const abreBank = CAOS_LEX.abre[intim];
  const zonaH = typeof caosHumorMatriz === "function" ? caosHumorMatriz() : null;
  const confAb =
    caosEixos.confianca >= 5 ? CAOS_LEX.abreConf.alta : caosEixos.confianca <= -5 ? CAOS_LEX.abreConf.baixa : null;
  const medE = caosConsole && caosConsole.on && caosConsole.mostraMed !== "calmo" ? caosConsole.mostraMed : null;
  const emoAb =
    medE && CAOS_LEX.abreEmo[medE] && !(prat === "suave" && /^(raiva|nojo)$/.test(medE))
      ? CAOS_LEX.abreEmo[medE]
      : null;
  const abre =
    Math.random() < 0.45
      ? nomeIn(
          confAb && Math.random() < 0.35
            ? caosLexPick2(confAb)
            : emoAb && Math.random() < 0.5
              ? caosLexPick2(emoAb)
              : zonaH && CAOS_LEX.abreHumor[zonaH] && Math.random() < 0.5
                ? caosLexPick2(CAOS_LEX.abreHumor[zonaH])
                : caosLexPick2(abreBank),
        ) + " "
      : "";
  const juizoBase = juizo;
  if (medE && CAOS_LEX.raboEmo[medE] && !(prat === "suave" && medE === "nojo") && Math.random() < 0.18)
    juizo += " " + caosLexPick2(CAOS_LEX.raboEmo[medE]);
  const cola = (a, t) => (a && /[,:]\s*$/.test(a) ? a + caosLexMin(t) : a + caosLexCap(t));
  const moldes = [
    () => `${cola(abre, fato.fr)}. ${juizo}`,
    () => `${n}, ${fato.np}? ${juizo}`,
    () => `Pelos meus registros: ${caosLexMin(fato.fr)}. ${juizo}`,
  ];
  if (tipo !== "acerto") moldes.push(() => `${cola(abre, fato.np)}… ${juizo}`);
  if (intim === "veterano") moldes.push(() => `${nomeIn(caosLexPick2(J.intimo))} ${fato.fr}? ${juizo}`);
  if (intim === "novato" && tipo === "erro" && prat !== "zero")
    moldes.push(() => `${caosLexPick2(J.formal)} Observação técnica: ${caosLexMin(fato.fr)}.`);
  moldes.push(
    () => `Nota mental: ${caosLexMin(fato.fr)}. ${juizo}`,
    () => `${n}… ${caosLexMin(fato.fr)}. ${juizo}`,
    () => `Fato do dia: ${caosLexMin(fato.fr)}. ${juizo}`,
  );
  const limpa = (t) =>
    nomeIn(t)
      .replace(/\s+/g, " ")
      .replace(/\?\s*\?/g, "?")
      .trim();
  let txt = limpa(caosLexPick2(moldes)());
  // fala montada longa demais: volta para a forma simples "Fato. Julgamento."
  if (txt.length > CAOS_FALA_JUNTA_MAX) txt = limpa(`${caosLexCap(fato.fr)}. ${juizoBase}`);
  if (caosHasProfanity(txt, [n])) return "";
  txt = "[C.A.O.S.] " + txt;
  caosLastPick = { bank: "gerador." + tipo + "." + prat, key: "gerador|" + tipo + "|" + prat, text: txt };
  return txt;
}
function caosAgora() {
  const d = new Date();
  return { h: d.getHours(), dow: d.getDay(), dia: d.getDate(), mes: d.getMonth() + 1 };
}
function caosPeriodo(h) {
  return h < 5 ? "madrugada" : h < 12 ? "manha" : h < 18 ? "tarde" : "noite";
}
function caosDataEspecial(a) {
  if (a.mes === 12 && (a.dia === 24 || a.dia === 25)) return "natal";
  if ((a.mes === 12 && a.dia === 31) || (a.mes === 1 && a.dia === 1)) return "anoNovo";
  if (a.mes === 6 && a.dia === 12) return caosCasal() ? "namoradosCasal" : "namorados";
  if (a.mes === 10 && a.dia === 12) return "criancas";
  if (a.mes === 10 && a.dia === 31) return "halloween";
  if (a.dow === 5 && a.dia === 13) return "sexta13";
  return null;
}
function caosTurno(h) {
  if (typeof h !== "number") h = new Date().getHours();
  return h < 6 ? "madrugada" : h < 12 ? "manhã" : h < 18 ? "tarde" : "noite";
}
function caosHoraTexto(h) {
  return h === 0
    ? "meia-noite"
    : h === 12
      ? "meio-dia"
      : h < 12
        ? `${h} da manhã`
        : h < 18
          ? `${h - 12} da tarde`
          : `${h - 12} da noite`;
}
// Duração da partida: só o tempo jogando (pausa, app fechado e celular dormindo ficam de fora; ver js/05f).
function caosMinutosPartida() {
  return caosPartidaInicioAt ? tempoMinutosJogo() : 0;
}
function caosRelogioInicioTexto() {
  const a = caosAgora(),
    R = REACTIVE_VOICE.relogio,
    esp = caosDataEspecial(a);
  if (esp && R.especial[esp]) return getRandomReaction(R.especial[esp]);
  const dk = { 5: "sexta", 6: "sabado", 0: "domingo", 1: "segunda" }[a.dow];
  if (dk && R.diaSemana[dk] && Math.random() < 0.4) return getRandomReaction(R.diaSemana[dk]);
  return getRandomReaction(R.inicio[caosPeriodo(a.h)], caosHoraTexto(a.h), CAOS_DIAS[a.dow]);
}
function caosRelogioNaCarta() {
  if (caosSilenced || !caosPartidaInicioAt) return false;
  const m = caosMinutosPartida(),
    R = REACTIVE_VOICE.relogio;
  for (const marco of [120, 90, 60, 30]) {
    if (m >= marco && m < marco + 25 && caosOncePerMatch("relogio_" + marco)) {
      showToastMessage(getRandomReaction(R.marco[marco]));
      return true;
    }
  }
  const h = new Date().getHours(),
    iniH = new Date(caosPartidaInicioAt).getHours();
  if (h === 0 && iniH >= 18 && caosOncePerMatch("relogio_meianoite")) {
    showToastMessage(getRandomReaction(R.meiaNoite));
    return true;
  }
  return false;
}
function caosAutoConsciencia() {
  const A = REACTIVE_VOICE.autoConsciencia;
  const jf = players.some((p) => isJfName(p.name)),
    anne = players.some((p) => isAnneName(p.name));
  if (jf && anne && Math.random() < 0.6) return getRandomReaction(A.jfAnne);
  if (jf && Math.random() < 0.7) return getRandomReaction(A.jf);
  return getRandomReaction(A.solo);
}
function caosCartaTema(momento) {
  if (!currentCard || caosSilenced || CURRENT_MODE === "junior") return "";
  const k = nameKeyPlain(currentCard.answer),
    tema = Object.keys(CAOS_CARTA_TEMA).find((t) => CAOS_CARTA_TEMA[t].includes(k));
  if (!tema || Math.random() >= 0.6 || !caosOncePerMatch("tema_" + k)) return "";
  return getRandomReaction(REACTIVE_VOICE.cartaTema[tema][momento], currentCard.answer);
}
function caosResenha() {
  if (caosResenhaTxt) return caosResenhaTxt;
  if (!players.length || stats.totalDrawn < 3) return "";
  const pick = caosLexPick,
    min = caosMinutosPartida(),
    a = caosAgora();
  const venc = caosVencedoresIdx(),
    vNome = venc.length === 1 ? players[venc[0]].name : null;
  const ord = [...players].sort((x, y) => rankValue(y) - rankValue(x)),
    lant = players.length >= 3 ? ord[ord.length - 1] : null;
  const topo = (o) => {
    const e = Object.entries(o || {}).sort((x, y) => y[1] - x[1])[0];
    return e && e[1] > 0 ? e : null;
  };
  const pul = topo(caosMesa.pulosPor),
    abs = topo(caosMesa.absurdosPor),
    pre = topo(caosMesa.precoce);
  const diag = Object.keys(caosMesa.diag || {}).map((k) => k.split("|"));
  const suave = players.filter((p) => playerHumor(p) === "suave" || p.iniciante).length > players.length / 2;
  const quando = `${a.h < 5 ? "numa madrugada" : a.h < 12 ? "numa manhã" : a.h < 18 ? "numa tarde" : "numa noite"} de ${CAOS_DIAS[a.dow]}`;
  const dur = min >= 1 ? `${min} ${min === 1 ? "minuto" : "minutos"}` : "poucos minutos";
  const f = [];
  f.push(
    pick([
      `Uma partida de ${dur}, ${quando}, com ${stats.totalDrawn} cartas na mesa.`,
      `${caosLexCap(dur)} de jogo ${quando}. ${stats.totalDrawn} cartas depois, aqui estamos.`,
      `Relatório oficial: ${stats.totalDrawn} cartas, ${dur}, ${quando}.`,
    ]),
  );
  if (vNome)
    f.push(
      suave
        ? pick([`${vNome} venceu, e mereceu.`, `Vitória de ${vNome}, com todos os méritos.`])
        : pick([
            `${vNome} venceu, mas vamos com calma antes de chamar de gênio.`,
            `${vNome} ganhou. Eu revisei os dados e, infelizmente, foi justo.`,
            `Vitória de ${vNome}, que agora vai lembrar disso por uma semana.`,
          ]),
    );
  if (lant && lant.name !== vNome && !suave && Math.random() < 0.7)
    f.push(
      pick([
        `${lant.name} ficou na lanterna, mas com muita personalidade.`,
        `${lant.name} terminou em último. Eu anotei com carinho, pra usar depois.`,
      ]),
    );
  if (pul && pul[1] >= 3)
    f.push(
      pick([
        `${pul[0]} pulou ${pul[1]} dicas: veio mais pra assistir do que pra jogar.`,
        `${pul[1]} pulos de ${pul[0]}. Honestidade tem limite, e o limite foi testado.`,
      ]),
    );
  if (abs && abs[1] >= 2)
    f.push(
      pick([
        `${abs[0]} levou ${abs[1]} Absurdos. O Mestre não teve escolha.`,
        `${abs[1]} Absurdos pra ${abs[0]}. Alguns chutes dessa ${caosTurno()} deviam ser proibidos por lei.`,
      ]),
    );
  if (pre && pre[1] >= 3) f.push(`${pre[0]} chutou e errou ${pre[1]} vezes logo na 1ª dica lida. Coragem não faltou.`);
  if (diag.length) {
    const [dn, dc] = pick(diag);
    f.push(`Laudo da ${caosTurno()}: ${dn} e a categoria ${CAOS_CAT_NOME[dc] || dc} não se entenderam.`);
  }
  if (caosAposta) {
    const ok = vNome && nameKeyPlain(vNome) === nameKeyPlain(caosAposta.nome);
    f.push(
      ok
        ? `Minha aposta secreta em ${caosAposta.nome} acertou. Anotem.`
        : `Minha aposta secreta era ${caosAposta.nome}. Vocês estragaram meu modelo.`,
    );
  }
  caosVinculoResenha(f, pick, suave);
  f.push(
    suave
      ? pick(["Foi bom jogar com vocês. Até a próxima.", "Obrigado pela partida. Voltem sempre."])
      : pick([
          "Até a próxima. Estudem.",
          "Eu vou arquivar tudo. Até a próxima.",
          "Vocês deveriam repensar algumas escolhas. Até a próxima.",
          "Foi um prazer. Mentira. Foi divertido. Até a próxima.",
        ]),
  );
  const fixas = vNome ? 2 : 1;
  const meio = f.slice(fixas, -1);
  while (meio.length > 2) meio.splice(Math.floor(Math.random() * meio.length), 1);
  caosResenhaTxt = [...f.slice(0, fixas), ...meio, f[f.length - 1]].join(" ");
  return caosResenhaTxt;
}
