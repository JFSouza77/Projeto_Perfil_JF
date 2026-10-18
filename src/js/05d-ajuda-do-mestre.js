/* ----------------------------------------------------------------------
 * 5d. AJUDA DO MESTRE (1.7.6): tempo extra pra quem ainda lê devagar quando é o Mestre.
 * Nasceu nas partidas do JF com os sobrinhos: a Isabel lê bem, mas ainda agarra em
 * algumas palavras, e no Express as dicas acabavam antes de a mesa entender a leitura.
 *
 * Quem ganha (só quando é o MESTRE da carta):
 *  · quem marcou 🧒 Menos de 12 no cadastro (no Equipe, a faixa 6-12);
 *  · quem entrou pelo 🐣 Sou iniciante;
 *  · quem a mesa aceitou dar, quando o C.A.O.S. percebeu a dificuldade (abaixo), ou pelo ADM.
 * Quanto: +20 s pra responder, +10 s nas instruções especiais; no Express, +8 s por dica
 * e +40 s no relógio da carta.
 *
 * O C.A.O.S. observa (central de análise da mesa): pra cada Mestre ele anota quanto tempo
 * cada dica leva até o veredito (Acertou, Errou, Pulou, Absurdo ou Passar) e quantas vezes o
 * tempo acaba. Se um Mestre fica bem acima do resto da mesa, ele avisa o sistema e pergunta
 * à mesa, no começo da próxima carta desse Mestre, se pode dar o tempo extra. Quem decide é
 * a mesa: o C.A.O.S. só observa e sugere (as 3 leis da espinha continuam valendo).
 * ---------------------------------------------------------------------- */
const MESTRE_TEMPO_EXTRA = { response: 20, special: 10, turn: 8, card: 40 };
// 1.7.10.6 (pedido do JF): idade obrigatória, em 3 faixas (o Modo C.A.O.S. é 16+). "maior" (12+, de antes da
// 1.7.10.6) vale como "12 a 15": não dá pra saber se tem 16, então não libera o Modo C.A.O.S.
const IDADE_OPCOES = [
  { id: "menor", label: "🧒 Menos de 12", cor: "#22d3ee" },
  { id: "doze", label: "🧑 12 a 15", cor: "#a78bfa" },
  { id: "dezesseis", label: "🧔 16 ou mais", cor: "#f472b6" },
];
const IDADE_RANK = { menor: 0, doze: 1, dezesseis: 2 };
function idadeNorm(v) {
  return v === "maior" ? "doze" : IDADE_RANK[v] !== undefined ? v : null;
}
function idadeLabel(v) {
  const o = IDADE_OPCOES.find((x) => x.id === idadeNorm(v));
  return o ? o.label.replace(/^\S+\s/, "") : "?";
}
// faixa etária do Equipe → idade (6-12 → menos de 12; 12-16 → 12 a 15; 16-18 e 18+ → 16 ou mais)
function idadeDaFaixa(f) {
  return f === "crianca" ? "menor" : f === "pre" ? "doze" : f === "jovem" || f === "adulto" ? "dezesseis" : null;
}
function jogador16(p) {
  return !!p && idadeNorm(p.idade) === "dezesseis";
}
/* Memória de idade por nick, neste dispositivo (pedido do JF): o jogo lembra a faixa de cada nome. Se um nome
   conhecido aparece numa faixa MAIOR do que a lembrada (ex.: era "menos de 12" e agora marcou "12 a 15"), pede
   confirmação antes. Faixa menor ou igual passa direto (e a memória acompanha). */
const IDADE_MEM_KEY = "perfil5_idade_nicks";
function idadeMemoria() {
  try {
    const m = JSON.parse(JFStore.getItem(IDADE_MEM_KEY) || "{}");
    return m && typeof m === "object" ? m : {};
  } catch (e) {
    return {};
  }
}
function idadeConhecida(nome) {
  const k = nameKeyPlain(String(nome || ""));
  return k ? idadeNorm(idadeMemoria()[k]) : null;
}
function idadeLembrar(nome, idade) {
  const k = nameKeyPlain(String(nome || "")), v = idadeNorm(idade);
  if (!k || !v) return;
  try {
    const m = idadeMemoria();
    m[k] = v;
    const ks = Object.keys(m);
    if (ks.length > 300) ks.slice(0, ks.length - 300).forEach((x) => delete m[x]);
    JFStore.setItem(IDADE_MEM_KEY, JSON.stringify(m));
  } catch (e) {}
}
// A faixa nova é maior do que a que este dispositivo lembra pra esse nome?
function idadeSubiu(nome, nova) {
  const ant = idadeConhecida(nome), v = idadeNorm(nova);
  return !!ant && !!v && IDADE_RANK[v] > IDADE_RANK[ant] ? ant : null;
}
function idadeConfirmarSubida(nome, nova, seguir) {
  const ant = idadeSubiu(nome, nova);
  if (!ant) return seguir();
  caosConfirmarModal(
    `🔎 "${nome}" já jogou neste dispositivo marcado como ${idadeLabel(ant)}.\n\nAgora está marcado como ${idadeLabel(nova)}. Confirma?`,
    "✅ Confirmo",
    "✏️ Corrigir",
    seguir,
  );
}
let selectedIdade = null;
let mestreObsEstourou = false; // o tempo acabou: o veredito que vem logo depois não conta duas vezes
function jogadorMenor12(p) {
  return !!p && (p.idade === "menor" || (CURRENT_FORMAT === "equipe" && p.ageBracket === "crianca"));
}
function mestreTemAjuda(p) {
  return !!p && (p.iniciante === true || jogadorMenor12(p) || p.mestreAjuda === true);
}
function mestreAtual() {
  return typeof mestreIndex === "number" && players[mestreIndex] ? players[mestreIndex] : null;
}
// Segundos a mais no relógio quando o Mestre da carta tem ajuda.
function mestreTempoExtra(kind) {
  if (!starterChosen) return 0;
  return mestreTemAjuda(mestreAtual()) ? MESTRE_TEMPO_EXTRA[kind] || 0 : 0;
}
function mestreAjudaMotivo(p) {
  if (p.iniciante) return "iniciante";
  if (jogadorMenor12(p)) return "idade";
  return "mesa";
}

/* --- Cadastro: botão de idade (obrigatório desde a 1.7.10.6; no Equipe vale a faixa etária) --- */
function renderIdadePicker() {
  const row = document.getElementById("idadeRow");
  if (!row) return;
  row.innerHTML = IDADE_OPCOES.map(
    (o) =>
      `<button type="button" class="main-btn age-swatch idade-btn${o.id === selectedIdade ? " on" : ""}" data-idade="${o.id}" style="--hc:${o.cor};" aria-pressed="${o.id === selectedIdade}">${o.label}</button>`,
  ).join("");
  row.classList.toggle("tem-escolha", !!selectedIdade);
  row.querySelectorAll("[data-idade]").forEach((b) =>
    b.addEventListener("click", () => {
      selectedIdade = selectedIdade === b.dataset.idade ? null : b.dataset.idade;
      idadeSugerida = null;
      renderIdadePicker();
      if (typeof cadAtualizarBotao === "function") cadAtualizarBotao();
    }),
  );
}
// Nome digitado que este dispositivo já conhece: a idade lembrada já vem marcada (dá pra trocar)
let idadeSugerida = null;
function idadeSugerirDoNome(nome) {
  const k = idadeConhecida(nome);
  if (k && (!selectedIdade || selectedIdade === idadeSugerida)) {
    if (selectedIdade !== k) {
      selectedIdade = k;
      idadeSugerida = k;
      renderIdadePicker();
    }
  } else if (!k && selectedIdade && selectedIdade === idadeSugerida) {
    selectedIdade = null;
    idadeSugerida = null;
    renderIdadePicker();
  }
}
function idadeMostrar(isEquipe) {
  const w = document.getElementById("idadeWrap");
  if (w) w.style.display = isEquipe ? "none" : "";
  renderIdadePicker();
}
// Idade do jogador novo (no Equipe, sai da faixa etária).
function idadeDoCadastro(isEquipe) {
  if (isEquipe) return idadeDaFaixa(selectedAgeBracket);
  return idadeNorm(selectedIdade);
}
function idadeLimpar() {
  selectedIdade = null;
  idadeSugerida = null;
  renderIdadePicker();
}
// Antes de começar: todo jogador precisa de idade. Quem não tem (jogador de antes da 1.7.10.6, sala aberta…)
// ganha a pergunta numa janela só, um por um; com todos preenchidos, segue.
function idadeCompletarAntes(seguir) {
  const falta = players.filter((p) => !idadeNorm(p.idade) && !isJfName(p.name));
  players.forEach((p) => {
    if (!idadeNorm(p.idade) && isJfName(p.name)) p.idade = "dezesseis";
  });
  if (!falta.length) return seguir();
  const p = falta[0];
  const { ov, box } = caosModalBase();
  ov.id = "idadeFaltaModal";
  const row = caosModalRow();
  IDADE_OPCOES.forEach((o) =>
    row.append(
      caosModalBtn(o.label, o.cor, () => {
        const marcar = () => {
          p.idade = o.id;
          if (CURRENT_FORMAT === "equipe" && !p.ageBracket) p.ageBracket = o.id === "menor" ? "crianca" : o.id === "doze" ? "pre" : "adulto";
          idadeLembrar(p.name, o.id);
          saveGameState();
          idadeCompletarAntes(seguir);
        };
        ov.remove();
        idadeConfirmarSubida(p.name, o.id, marcar);
      }),
    ),
  );
  const fechar = caosModalRow();
  fechar.append(caosModalBtn("Voltar", "#444a66", () => ov.remove()));
  box.append(caosModalMsg(`🎂 Qual a idade de ${(p.avatar ? p.avatar + " " : "") + p.name}?\n\nA idade é obrigatória: com menos de 12 o Mestre ganha tempo extra pra ler, e o Modo C.A.O.S. é só pra 16+.`), row, fechar);
  document.body.appendChild(ov);
}

/* --- Observação do C.A.O.S.: ritmo de cada Mestre --- */
function mestreObs(p) {
  if (!p.obsM) p.obsM = { d: 0, e: 0, ms: 0, n: 0 };
  return p.obsM;
}
// Veredito de uma dica (Acertou, Errou, Pulou, Absurdo ou Passar no Express).
function mestreObsVeredito() {
  try {
    if (mestreObsEstourou) {
      mestreObsEstourou = false;
      return;
    }
    const p = mestreAtual();
    if (!p || !pendingStartTime) return;
    const o = mestreObs(p);
    const ms = Date.now() - pendingStartTime;
    o.d++;
    if (ms > 0 && ms < 6e5) {
      o.ms += ms;
      o.n++;
    }
  } catch (e) {}
}
// O tempo da dica acabou sem veredito.
function mestreObsEstouro() {
  try {
    const p = mestreAtual();
    if (!p) return;
    const o = mestreObs(p);
    o.d++;
    o.e++;
    mestreObsEstourou = true;
  } catch (e) {}
}
// Esse Mestre está com dificuldade, comparado com o resto da mesa?
function mestreDificuldade(p) {
  const o = p && p.obsM;
  if (!o || o.d < 4) return false;
  let d = 0,
    e = 0,
    ms = 0,
    n = 0;
  players.forEach((q) => {
    if (q === p || !q.obsM || q.obsM.d < 3) return;
    d += q.obsM.d;
    e += q.obsM.e;
    ms += q.obsM.ms;
    n += q.obsM.n;
  });
  const taxa = o.e / o.d;
  const taxaMesa = d ? e / d : null;
  const porEstouro = o.e >= 2 && taxa >= 0.4 && (taxaMesa === null ? taxa >= 0.5 : taxa >= Math.max(0.2, taxaMesa * 2));
  const porDemora = o.n >= 3 && n >= 4 && o.ms / o.n >= (ms / n) * 1.6;
  return porEstouro || porDemora;
}
const MESTRE_AJUDA_FALAS = {
  // 1.7.7.6 (revisão GPT): sem dizer o motivo em voz alta. A idade é de quem marcou, não da mesa.
  idade: (n) => `[C.A.O.S.] ${n}, você tem um tempinho extra pra ler a carta. Sem pressa.`,
  iniciante: (n) => `[C.A.O.S.] ${n}, primeira vez de Mestre? Ganhou um tempinho extra pra ler. Respira e vai.`,
  mesa: (n) => `[C.A.O.S.] Tempo extra ligado pra ${n}. Pode ler com calma, a mesa espera.`,
};
// Começo da carta (drawHidden): avisa quem tem ajuda ou pergunta à mesa se o C.A.O.S. notou dificuldade.
function mestreAjudaNaCarta() {
  try {
    if (gameEnded || !starterChosen || cardState !== "hidden") return;
    const p = mestreAtual();
    if (!p) return;
    if (mestreTemAjuda(p)) {
      if (p.mestreAjudaAvisado) return;
      p.mestreAjudaAvisado = true;
      const fala = MESTRE_AJUDA_FALAS[mestreAjudaMotivo(p)](p.name);
      // 1.7.8.4: fala dirigida ao Mestre (privada no online), pelo id
      caosFalaAgendar(() => {
        caosFalarPara(p.id, fala, true);
        return null;
      }, p.iniciante ? 4200 : 1600);
      caosLog("mestreAjuda", `tempo extra de Mestre ativo pra ${p.name} (${mestreAjudaMotivo(p)})`);
      return;
    }
    if (p.mestreAjudaPerguntado || !mestreDificuldade(p)) return;
    p.mestreAjudaPerguntado = true;
    const o = p.obsM;
    caosLog(
      "mestreAjuda",
      `observou dificuldade de ${p.name} como Mestre: ${o.e} de ${o.d} dicas sem veredito no tempo, média ${o.n ? Math.round(o.ms / o.n / 1e3) : "?"} s`,
    );
    mestreAjudaPerguntar(p);
  } catch (e) {}
}
function mestreAjudaPerguntar(p) {
  const { ov, box } = caosModalBase();
  ov.id = "mestreAjudaModal";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-label", "Tempo extra pro Mestre");
  box.style.borderColor = "#22d3ee";
  const extra =
    CURRENT_MODE === "express"
      ? `+${MESTRE_TEMPO_EXTRA.turn} s em cada dica e +${MESTRE_TEMPO_EXTRA.card} s na carta`
      : `+${MESTRE_TEMPO_EXTRA.response} s pra responder`;
  const msg = `🤖 Mesa, anotei uma coisa: quando ${p.name} é o Mestre, as dicas demoram mais pra sair e o tempo acaba mais vezes. Ler em voz alta às vezes é difícil mesmo.\n\nVamos dar um tempinho extra pra ${p.name} quando for o Mestre? (${extra})`;
  const row = caosModalRow();
  const fechar = () => {
    try {
      caosVoiceCancel();
    } catch (e) {}
    ov.remove();
  };
  row.append(
    caosModalBtn("Agora não", "#444a66", () => {
      fechar();
      caosLog("mestreAjuda", `mesa recusou o tempo extra pra ${p.name}`);
      saveGameState();
    }),
    caosModalBtn("⏳ Dar tempo extra", "#0e7490", () => {
      fechar();
      p.mestreAjuda = true;
      p.mestreAjudaAvisado = true;
      caosLog("mestreAjuda", `mesa aceitou: tempo extra de Mestre pra ${p.name}`);
      saveGameState();
      showToastMessage(MESTRE_AJUDA_FALAS.mesa(p.name), null, true);
    }),
  );
  box.append(caosModalMsg(msg), row);
  document.body.appendChild(ov);
  try {
    caosFalarNormal(`[C.A.O.S.] Mesa, quando ${p.name} é o Mestre, as dicas demoram mais. Vamos dar um tempinho extra?`);
  } catch (e) {}
}

/* --- ADM: ligar/desligar o tempo extra de Mestre de cada jogador --- */
function admMestreAjudaSecao(sec, redesenhar) {
  if (!players.length) return;
  const tit = document.createElement("div");
  tit.className = "ci-note";
  tit.textContent = "⏳ Tempo extra quando for o Mestre (menos de 12 e iniciante já ganham sozinhos):";
  sec.appendChild(tit);
  players.forEach((p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ci-btn ci-wide";
    const auto = p.iniciante || jogadorMenor12(p);
    const on = mestreTemAjuda(p);
    b.setAttribute("aria-pressed", String(on));
    b.textContent = `${on ? "✅" : "⬜"} ${p.name}${auto ? (p.iniciante ? " (iniciante)" : " (menos de 12)") : ""}`;
    if (auto) {
      b.disabled = true;
      b.style.opacity = "0.6";
    }
    b.addEventListener("click", () => {
      p.mestreAjuda = !p.mestreAjuda;
      p.mestreAjudaPerguntado = true;
      caosLog("adm", `tempo extra de Mestre ${p.mestreAjuda ? "ligado" : "desligado"} pra ${p.name}`);
      saveGameState();
      redesenhar();
    });
    sec.appendChild(b);
  });
}
