/* 11/2026 · Cadastro do jogador (pedido do JF, ideia do Henrique). Opcional: nick + PIN de 4 números.
   Com cadastro, o C.A.O.S. lembra da pessoa em qualquer dispositivo (a ficha fica no servidor, /conta/*) e
   ninguém herda essa memória só por usar o mesmo nick: quem usa um nick com cadastro sem entrar joga normal,
   mas o C.A.O.S. trata como se fosse a primeira vez (nickEmprestado). Esqueceu o PIN: o JF zera pelo painel
   /contas do servidor e a memória continua. Sem internet, o jogo segue como antes (memória do dispositivo). */
const CONTAS_KEY = "perfil5_contas"; // logins deste dispositivo: { chave do nick: { nick, token } }
const CONTAS_CONHECIDAS_KEY = "perfil5_contas_conhecidas"; // nicks que já sabemos que têm cadastro: { chave: 1 }
const CONTAS_RECUSADAS_KEY = "perfil5_contas_recusadas"; // "não perguntar de novo" pra esse nick neste dispositivo

function contasLer(k) {
  try {
    const o = JSON.parse(localStorage.getItem(k) || "{}");
    return o && typeof o === "object" && !Array.isArray(o) ? o : {};
  } catch (e) {
    return {};
  }
}
function contasGravar(k, o) {
  try {
    localStorage.setItem(k, JSON.stringify(o));
  } catch (e) {}
}
function contaLogin(nome) {
  const k = nameKeyPlain(nome);
  const l = k && contasLer(CONTAS_KEY)[k];
  return l && typeof l.token === "string" ? { nick: String(l.nick || nome).slice(0, 15), token: l.token } : null;
}
function contaGuardarLogin(nome, token) {
  const o = contasLer(CONTAS_KEY);
  o[nameKeyPlain(nome)] = { nick: String(nome).slice(0, 15), token };
  contasGravar(CONTAS_KEY, o);
  contaMarcarConhecida(nome, true);
}
function contaEsquecerLogin(nome) {
  const o = contasLer(CONTAS_KEY);
  delete o[nameKeyPlain(nome)];
  contasGravar(CONTAS_KEY, o);
}
function contaConhecida(nome) {
  const k = nameKeyPlain(nome);
  return !!(k && contasLer(CONTAS_CONHECIDAS_KEY)[k]);
}
function contaMarcarConhecida(nome, sim) {
  const k = nameKeyPlain(nome);
  if (!k) return;
  const o = contasLer(CONTAS_CONHECIDAS_KEY);
  if (sim) o[k] = 1;
  else delete o[k];
  contasGravar(CONTAS_CONHECIDAS_KEY, o);
}
async function contaPost(acao, corpo) {
  const url = typeof redeServidorUrl === "function" ? redeServidorUrl("/conta/" + acao) : null;
  if (!url || (typeof navigator !== "undefined" && navigator.onLine === false)) return { erro: "offline" };
  const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const t = setTimeout(() => ctl && ctl.abort(), 6000);
  try {
    const r = await fetch(url, { method: "POST", body: JSON.stringify(corpo), signal: ctl ? ctl.signal : undefined });
    let j = {};
    try {
      j = await r.json();
    } catch (e) {}
    return r.ok ? j : Object.assign({ erro: "servidor" }, j, { status: r.status });
  } catch (e) {
    return { erro: "offline" };
  } finally {
    clearTimeout(t);
  }
}
// A ficha da nuvem entra na memória deste dispositivo (se a daqui tiver mais partidas, fica a daqui e ela sobe no fim)
function contaFichaJuntar(nome, ficha) {
  if (!ficha || typeof ficha !== "object") return;
  const loc = fichaGet(nome);
  if (loc && (loc.partidas || 0) > (ficha.partidas || 0)) return;
  fichaUpd(nome, (f) => Object.assign(f, fichaLimpa(ficha, nome)));
}
function contaRecusada(nome) {
  const k = nameKeyPlain(nome);
  return !!(k && contasLer(CONTAS_RECUSADAS_KEY)[k]);
}
function contaRecusar(nome) {
  const o = contasLer(CONTAS_RECUSADAS_KEY);
  o[nameKeyPlain(nome)] = 1;
  contasGravar(CONTAS_RECUSADAS_KEY, o);
}
// Pedido do JF: em vez do botão pequeno, a pergunta aparece sozinha logo depois de cadastrar o nick.
// Nick com cadastro: pede o PIN. Nick sem cadastro: oferece criar (com "Agora não" e "Não perguntar de novo").
// Só pergunta quando o servidor respondeu (sem internet, não incomoda).
function contaOferecer(nome, existe, semPin, depois, seNao) {
  if (contaLogin(nome) || (!existe && contaRecusada(nome))) return;
  const { ov, box } = caosModalBase();
  const fim = () => ov.remove();
  const nao = () => {
    fim();
    if (typeof seNao === "function") seNao();
  };
  const row = caosModalRow();
  const entrar = existe && !semPin;
  row.append(
    caosModalBtn("Agora não", "#444a66", nao),
    caosModalBtn(entrar ? "Digitar o PIN" : "Cadastrar", "#2563eb", () => {
      fim();
      contaAbrir(nome, depois);
    }),
  );
  const msg = entrar
    ? `🔐 O nick "${nome}" tem cadastro. Digite o PIN pro C.A.O.S. lembrar de você (sem o PIN, ele te trata como se fosse a primeira vez).`
    : `🔐 Quer cadastrar o nick "${nome}"? Com um PIN de 4 números, o C.A.O.S. lembra de você em qualquer dispositivo, e ninguém mais usa a sua memória.`;
  box.append(caosModalMsg(msg), row);
  if (!existe) {
    const nunca = document.createElement("button");
    nunca.type = "button";
    nunca.className = "chip";
    nunca.textContent = "Não perguntar de novo pra esse nick";
    nunca.style.cssText = "display:block;margin:12px auto 0;min-height:44px";
    nunca.addEventListener("click", () => {
      contaRecusar(nome);
      nao();
    });
    box.append(nunca);
  }
  document.body.appendChild(ov);
}
// Jogador entrou no cadastro da partida (aqui ou pela sala). contaRede = login que o celular do jogador mandou.
// perguntar = cadastro feito neste dispositivo: oferece criar ou entrar no cadastro logo depois.
function contaAoCadastrar(p, contaRede, perguntar) {
  if (!p || !p.name) return;
  const daRede = contaRede && typeof contaRede.token === "string" ? { nick: String(contaRede.nick || p.name).slice(0, 15), token: contaRede.token.slice(0, 64) } : null;
  const l = daRede || contaLogin(p.name);
  if (l && nameKeyPlain(l.nick) === nameKeyPlain(p.name)) {
    p.conta = l;
    contaPost("ficha", { nick: p.name, token: l.token }).then((r) => {
      if (r && r.ok) contaFichaJuntar(p.name, r.ficha);
      else if (r && r.erro === "login") {
        // o login caiu (o JF zerou o PIN, ou saiu em outro lugar): sem memória até entrar de novo
        delete p.conta;
        p.nickEmprestado = true;
        if (!daRede) contaEsquecerLogin(p.name);
      }
    });
    return;
  }
  // nick com cadastro sem login: joga normal, mas sem a memória de quem é dono do nick
  if (contaConhecida(p.name)) p.nickEmprestado = true;
  contaPost("existe", { nick: p.name }).then((r) => {
    if (!r || r.erro) return;
    contaMarcarConhecida(p.name, !!r.existe);
    if (r.existe && !p.conta) p.nickEmprestado = true;
    if (perguntar && !p.iniciante && players.includes(p))
      contaOferecer(p.name, !!r.existe, !!r.semPin, () => {
        // entrou ou criou: esse jogador passa a ter memória
        const l = contaLogin(p.name);
        if (!l) return;
        p.conta = l;
        delete p.nickEmprestado;
        saveGameState();
      });
  });
}
// Fim da partida: a ficha de quem tem cadastro sobe pra nuvem.
function contasSalvarFichas() {
  (players || []).forEach((p) => {
    if (!p || !p.conta || p.nickEmprestado) return;
    const f = fichaGet(p.name);
    if (f) contaPost("salvar", { nick: p.name, token: p.conta.token, ficha: f });
  });
}
// Janela do PIN (4 números, escondido).
function contaPinModal(msg, cb) {
  const { ov, box } = caosModalBase();
  const inp = document.createElement("input");
  inp.type = "password";
  inp.inputMode = "numeric";
  inp.autocomplete = "off";
  inp.maxLength = 4;
  inp.placeholder = "••••";
  inp.setAttribute("aria-label", "PIN de 4 números");
  inp.style.cssText =
    "width:100%;box-sizing:border-box;padding:12px;margin:0 0 16px;border-radius:8px;border:1px solid #555a7a;background:#0f0f1e;color:#fff;font-size:24px;letter-spacing:10px;text-align:center;font-family:inherit";
  const fim = (v) => {
    ov.remove();
    cb(v);
  };
  inp.addEventListener("input", () => (inp.value = inp.value.replace(/\D/g, "").slice(0, 4)));
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fim(inp.value);
    }
  });
  const row = caosModalRow();
  row.append(caosModalBtn("Cancelar", "#444a66", () => fim(null)), caosModalBtn("OK", "#2563eb", () => fim(inp.value)));
  box.append(caosModalMsg(msg), inp, row);
  document.body.appendChild(ov);
  setTimeout(() => inp.focus(), 50);
}
const CONTA_ERRO_TXT = {
  offline: "Sem conexão com o servidor agora. O cadastro precisa de internet; dá pra jogar sem ele normalmente.",
  pin: "PIN errado.",
  bloqueado: "Muitos PINs errados. Espere 15 minutos e tente de novo (ou peça pro JF zerar o PIN).",
  existe: "Esse nick já tem cadastro. Use o PIN dele, ou escolha outro nick.",
  nick: "O nick precisa ter entre 2 e 15 letras.",
  calma: "Calma! Muitas tentativas. Tente daqui a pouco.",
};
// Botão "Cadastro": entra, cria ou mostra quem está conectado com esse nick neste dispositivo.
async function contaAbrir(nomeBruto, depois) {
  const nome = nomeJogadorLimpo(nomeBruto || "");
  const pronto = () => typeof depois === "function" && depois();
  if (nome.length < 2 || nome.length > 15) return caosAvisoModal("Digite o nick primeiro (de 2 a 15 letras) e depois toque em 🔐 Cadastro.");
  const l = contaLogin(nome);
  if (l) {
    const { ov, box } = caosModalBase();
    const row = caosModalRow();
    row.append(
      caosModalBtn("Sair do cadastro", "#9f1239", () => {
        ov.remove();
        contaPost("sair", { nick: nome, token: l.token });
        contaEsquecerLogin(nome);
        caosAvisoModal(`Pronto: neste dispositivo, "${nome}" não está mais conectado.`, pronto);
      }),
      caosModalBtn("OK", "#2563eb", () => {
        ov.remove();
        pronto();
      }),
    );
    box.append(caosModalMsg(`✅ "${nome}" está conectado neste dispositivo. O C.A.O.S. lembra de você em qualquer dispositivo em que você entrar.`), row);
    document.body.appendChild(ov);
    return;
  }
  const ex = await contaPost("existe", { nick: nome });
  if (ex.erro) return caosAvisoModal(CONTA_ERRO_TXT[ex.erro] || CONTA_ERRO_TXT.offline);
  const deuCerto = (r) => {
    if (!r || !r.ok) return caosAvisoModal(CONTA_ERRO_TXT[r && r.erro] || CONTA_ERRO_TXT.offline);
    contaGuardarLogin(nome, r.token);
    contaFichaJuntar(nome, r.ficha);
    caosAvisoModal(`✅ Pronto, "${nome}"! Agora o C.A.O.S. lembra de você em qualquer dispositivo em que você entrar com esse nick e esse PIN.`, pronto);
  };
  if (ex.existe && !ex.semPin) {
    return contaPinModal(`🔐 "${nome}" tem cadastro. Digite o PIN:`, async (pin) => {
      if (pin == null) return;
      const r = await contaPost("entrar", { nick: nome, pin });
      if (r.erro === "pin") return caosAvisoModal(`PIN errado.${r.restam ? ` Mais ${r.restam} tentativa${r.restam === 1 ? "" : "s"} antes de travar por 15 minutos.` : ""}`);
      deuCerto(r);
    });
  }
  const msg = ex.semPin
    ? `🔑 O PIN de "${nome}" foi zerado. Escolha um PIN novo de 4 números (a memória continua):`
    : `🆕 Criar cadastro pra "${nome}". Escolha um PIN de 4 números (anote ou guarde bem; ele protege a memória do C.A.O.S. sobre você):`;
  contaPinModal(msg, (pin) => {
    if (pin == null) return;
    if (!/^\d{4}$/.test(pin)) return caosAvisoModal("O PIN precisa ter exatamente 4 números.");
    contaPinModal("Digite o mesmo PIN de novo, pra confirmar:", async (pin2) => {
      if (pin2 == null) return;
      if (pin2 !== pin) return caosAvisoModal("Os dois PINs não bateram. Tente de novo.");
      deuCerto(await contaPost("criar", { nick: nome, pin }));
    });
  });
}
// Botão do cadastro na tela de jogadores (este dispositivo)
function contaBotaoLigar() {
  const b = typeof document !== "undefined" && document.getElementById("contaBtn");
  if (!b || b.dataset.ligado) return;
  b.dataset.ligado = "1";
  b.addEventListener("click", () => {
    const inp = document.getElementById("playerNameInput");
    // o tempo na janela do cadastro não conta como "demorou pra escolher o nick"
    if (typeof nickWaitStart !== "undefined") nickWaitStart = null;
    contaAbrir(inp ? inp.value : "");
  });
}
contaBotaoLigar();
