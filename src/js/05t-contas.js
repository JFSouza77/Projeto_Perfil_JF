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
  return l && typeof l.token === "string" ? { nick: String(l.nick || nome).slice(0, 15), token: l.token, ...(l.pv ? { pv: l.pv } : {}) } : null;
}
function contaGuardarLogin(nome, token, pin) {
  const o = contasLer(CONTAS_KEY);
  const k = nameKeyPlain(nome);
  const antes = o[k] && o[k].token === token ? o[k].pv : null;
  o[k] = { nick: String(nome).slice(0, 15), token, ...(antes ? { pv: antes } : {}) };
  contasGravar(CONTAS_KEY, o);
  contaMarcarConhecida(nome, true);
  // 06/11/2026: guarda uma conferência embaralhada do PIN (PBKDF2 com sal) pra pedir o PIN mesmo sem internet
  if (pin) contaPinLocalGerar(pin).then((pv) => {
    if (!pv) return;
    const o2 = contasLer(CONTAS_KEY);
    if (o2[k] && o2[k].token === token) {
      o2[k].pv = pv;
      contasGravar(CONTAS_KEY, o2);
    }
  });
}
async function contaPinLocalHash(pin, sal) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(String(pin)), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(sal), iterations: 60000 }, base, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function contaPinLocalGerar(pin) {
  try {
    if (!(typeof crypto !== "undefined" && crypto.subtle)) return null;
    const s = [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join("");
    return { s, h: await contaPinLocalHash(pin, s) };
  } catch (e) {
    return null;
  }
}
async function contaPinLocalOk(login, pin) {
  try {
    if (!login || !login.pv || !login.pv.s || !(typeof crypto !== "undefined" && crypto.subtle)) return false;
    return (await contaPinLocalHash(pin, login.pv.s)) === login.pv.h;
  } catch (e) {
    return false;
  }
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
  // o emoji e o humor de agora valem mais que os que vieram da nuvem (senão a próxima troca compara com o emoji errado)
  const p = players.find((q) => nameKeyPlain(q.name) === nameKeyPlain(nome));
  fichaUpd(nome, (f) => {
    Object.assign(f, fichaLimpa(ficha, nome));
    if (p && p.avatar && !(presenteDe(nome) && presenteDe(nome).gira) && !temporadaEmojiEh(p.avatar)) f.ultimoAvatar = p.avatar;
    if (p && caosHumorEscolha(p)) caosHumorAnotar(f, caosHumorEscolha(p), p);
  });
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
function contaAoCadastrar(p, contaRede, perguntar, pronto) {
  if (!p || !p.name) return;
  // 1.9.1 (relato do JF): a janela do cadastro apagava o "oi" do C.A.O.S. na hora. Quem chama passa "pronto", que
  // roda uma vez só, depois da pergunta (respondida, ou sem pergunta nenhuma) e com a tela livre de janelas.
  let chamou = false;
  const fim = () => {
    if (chamou || typeof pronto !== "function") return;
    chamou = true;
    let livre = 0,
      voltas = 0;
    const ver = () => {
      if (!players.includes(p)) return;
      livre = caosJanelaImportanteAberta() ? 0 : livre + 1;
      if (livre >= 2 || ++voltas > 300) return pronto();
      setTimeout(ver, 400);
    };
    setTimeout(ver, 200);
  };
  const daRede = contaRede && typeof contaRede.token === "string" ? { nick: String(contaRede.nick || p.name).slice(0, 15), token: contaRede.token.slice(0, 64) } : null;
  // 06/11/2026: login guardado no aparelho não basta (aparelho da família é de todo mundo): neste aparelho, só vale o
  // login que acabou de passar pelo PIN (p.conta, posto pelo portão no addPlayer); da sala, o login do celular.
  const l = daRede || (p.conta && typeof p.conta.token === "string" ? { nick: p.conta.nick || p.name, token: p.conta.token } : null);
  if (p.convidadoAdm) return fim(); // o ADM liberou como convidado: sem memória e sem pergunta
  if (l && nameKeyPlain(l.nick) === nameKeyPlain(p.name)) {
    p.conta = { nick: String(l.nick).slice(0, 15), token: l.token };
    contaPost("ficha", { nick: p.name, token: l.token }).then((r) => {
      if (r && r.ok) contaFichaJuntar(p.name, r.ficha);
      else if (r && r.erro === "login") {
        // o login caiu (o JF zerou o PIN, ou saiu em outro lugar): sem memória até entrar de novo
        delete p.conta;
        p.nickEmprestado = true;
        if (!daRede) contaEsquecerLogin(p.name);
      }
    });
    fim();
    return;
  }
  // nick com cadastro sem login: joga normal, mas sem a memória de quem é dono do nick
  if (contaConhecida(p.name)) p.nickEmprestado = true;
  contaPost("existe", { nick: p.name }).then((r) => {
    if (!r || r.erro) return fim();
    contaMarcarConhecida(p.name, !!r.existe);
    if (r.existe && !p.conta) p.nickEmprestado = true;
    // 06/11/2026 (pedido do JF): nick com cadastro neste aparelho, sem o PIN: tem que resolver (PIN, outro nick ou ADM)
    if (perguntar && r.existe && !r.semPin && !p.conta && players.includes(p)) {
      contaExigirPin(p.name, {
        p,
        seguir: (res) => {
          if (res && res.conta) {
            p.conta = { nick: res.conta.nick, token: res.conta.token };
            delete p.nickEmprestado;
          } else if (res && res.convidado) {
            p.nickEmprestado = true;
            p.convidadoAdm = true;
          }
          try {
            saveGameState();
            renderScoreboard();
          } catch (e) {}
          fim();
        },
      });
      return;
    }
    if (perguntar && !p.iniciante && players.includes(p))
      contaOferecer(p.name, !!r.existe, !!r.semPin, () => {
        // entrou ou criou: esse jogador passa a ter memória
        const l = contaLogin(p.name);
        if (!l) return;
        p.conta = l;
        delete p.nickEmprestado;
        saveGameState();
      });
    fim();
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
  const deuCerto = (r, pin) => {
    if (!r || !r.ok) return caosAvisoModal(CONTA_ERRO_TXT[r && r.erro] || CONTA_ERRO_TXT.offline);
    contaGuardarLogin(nome, r.token, pin);
    contaPinRecente[nameKeyPlain(nome)] = Date.now();
    contaFichaJuntar(nome, r.ficha);
    caosAvisoModal(`✅ Pronto, "${nome}"! Agora o C.A.O.S. lembra de você em qualquer dispositivo em que você entrar com esse nick e esse PIN.`, pronto);
  };
  if (ex.existe && !ex.semPin) {
    return contaPinModal(`🔐 "${nome}" tem cadastro. Digite o PIN:`, async (pin) => {
      if (pin == null) return;
      const r = await contaPost("entrar", { nick: nome, pin });
      if (r.erro === "pin") return caosAvisoModal(`PIN errado.${r.restam ? ` Mais ${r.restam} tentativa${r.restam === 1 ? "" : "s"} antes de travar por 15 minutos.` : ""}`);
      deuCerto(r, pin);
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
      deuCerto(await contaPost("criar", { nick: nome, pin }), pin);
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

/* ----------------------------------------------------------------------
 * 06/11/2026 · Portão do PIN (pedido do JF: "o jogo tem que perguntar: é você mesmo? qual é a sua senha?")
 * Nick com cadastro só entra na partida como o dono depois do PIN, mesmo com o login guardado neste aparelho
 * (no aparelho da família, todo mundo tem o login de todo mundo). Sem o PIN: outro nick, ou o ADM libera como
 * convidado (sem a memória e sem o tratamento do dono). E quem o jogo conhece (JF, Anne, amigos, família) só é
 * reconhecido quando o dono confirmou (contaNomeComDono, usado por isJfName e companhia em 03-regras).
 * ---------------------------------------------------------------------- */
const contaConfirmados = new Set(); // nicks que acabaram de passar pelo PIN (antes de entrar na lista)
const contaPinRecente = {}; // nick → quando o PIN foi digitado no 🔐 Cadastro (vale 5 min pra não pedir duas vezes)
const CONTA_PIN_RECENTE_MS = 5 * 60e3;
function contaNomeComDono(n) {
  try {
    const k = nameKeyPlain(n);
    if (!k) return false;
    const ps = typeof players !== "undefined" && Array.isArray(players) ? players : [];
    const p = ps.find((q) => q && nameKeyPlain(q.name) === k);
    if (p) return !!(p.conta && p.conta.token) && !p.nickEmprestado;
    return contaConfirmados.has(k);
  } catch (e) {
    return false;
  }
}
// Antes de entrar na lista (addPlayer): o aparelho já sabe que esse nick tem cadastro? Então pergunta o PIN agora.
// Devolve true quando a janela abriu (o addPlayer espera a resposta e chama de novo).
function contaPortaoAntes(nome, seguir) {
  try {
    const k = nameKeyPlain(nome);
    if (!k || !(contaLogin(nome) || contaConhecida(nome))) return false;
    const l = contaLogin(nome);
    if (l && contaPinRecente[k] && Date.now() - contaPinRecente[k] < CONTA_PIN_RECENTE_MS) {
      // acabou de digitar o PIN (criou ou entrou no 🔐 Cadastro): não pede de novo
      delete contaPinRecente[k];
      contaConfirmados.add(k);
      seguir({ conta: { nick: l.nick, token: l.token } });
      contaConfirmados.delete(k);
      return true;
    }
    contaExigirPin(nome, { seguir });
    return true;
  } catch (e) {
    return false;
  }
}
function contaSugerirOutroNick(nome) {
  const base = String(nome).slice(0, 13).trim();
  for (let i = 2; i < 10; i++) {
    const s = base + " " + i;
    if (!players.some((q) => nameKeyPlain(q.name) === nameKeyPlain(s)) && !contaConhecida(s)) return s;
  }
  return base + " 9";
}
// A janela: Digitar o PIN · Usar outro nick · ADM libera (como convidado)
//   op.p: o jogador já está na lista (o servidor avisou depois); sem p, é antes de entrar.
//   op.seguir({ conta }) dono confirmado · op.seguir({ convidado: true }) liberado pelo ADM
function contaExigirPin(nome, op) {
  op = op || {};
  const k = nameKeyPlain(nome);
  const reabrir = () => contaExigirPin(nome, op);
  const pronto = (res) => {
    if (res && res.conta) contaConfirmados.add(k);
    if (typeof op.seguir === "function") op.seguir(res);
    if (res && res.conta) setTimeout(() => contaConfirmados.delete(k), 0); // depois que entrou na lista, vale o p.conta
  };
  const { ov, box } = caosModalBase();
  const fim = () => ov.remove();
  const row = caosModalRow();
  row.append(
    caosModalBtn("🔐 Digitar o PIN", "#2563eb", () => {
      fim();
      contaPinModal(`🔐 PIN de "${nome}":`, async (pin) => {
        if (pin == null) return reabrir();
        const r = await contaPost("entrar", { nick: nome, pin });
        if (r && r.ok) {
          contaGuardarLogin(nome, r.token, pin);
          contaFichaJuntar(nome, r.ficha);
          return pronto({ conta: { nick: String(r.nick || nome).slice(0, 15), token: r.token } });
        }
        if (r && r.erro === "offline") {
          const l = contaLogin(nome);
          if (l && (await contaPinLocalOk(l, pin))) return pronto({ conta: { nick: l.nick, token: l.token } });
          return caosAvisoModal(
            l && l.pv
              ? "PIN errado."
              : "Sem internet não dá pra conferir o PIN agora. Use outro nick, ou peça pro ADM liberar como convidado.",
            reabrir,
          );
        }
        if (r && r.erro === "pin") return caosAvisoModal(`PIN errado.${r.restam ? ` Mais ${r.restam} tentativa${r.restam === 1 ? "" : "s"} antes de travar por 15 minutos.` : ""}`, reabrir);
        if (r && r.erro === "sem_conta") {
          // o cadastro foi apagado: o nick ficou livre
          contaMarcarConhecida(nome, false);
          contaEsquecerLogin(nome);
          return caosAvisoModal(`O cadastro de "${nome}" não existe mais. O nick está livre.`, () => pronto({ livre: true }));
        }
        if (r && r.erro === "sem_pin") return caosAvisoModal(`O PIN de "${nome}" foi zerado. Toque em 🔐 Cadastro pra criar um PIN novo.`, reabrir);
        caosAvisoModal(CONTA_ERRO_TXT[r && r.erro] || CONTA_ERRO_TXT.offline, reabrir);
      });
    }),
    caosModalBtn("Usar outro nick", "#444a66", () => {
      fim();
      const sug = contaSugerirOutroNick(nome);
      if (op.p && players.includes(op.p)) {
        const i = players.indexOf(op.p);
        players.splice(i, 1);
        try {
          renderScoreboard();
          if (typeof redeHostCadastroMudou === "function") redeHostCadastroMudou();
        } catch (e) {}
      }
      const inp = document.getElementById("playerNameInput");
      if (inp) {
        inp.value = sug;
        try {
          inp.dispatchEvent(new Event("input"));
        } catch (e) {}
      }
      caosAvisoModal(`"${nome}" já é de outra pessoa. Escolha outro nick (sugeri "${sug}") e toque em Adicionar.`, () => inp && inp.focus());
    }),
  );
  const adm = document.createElement("button");
  adm.type = "button";
  adm.className = "chip";
  adm.textContent = "🛠️ ADM libera como convidado";
  adm.style.cssText = "display:block;margin:12px auto 0;min-height:44px";
  adm.addEventListener("click", () => {
    fim();
    if (typeof caosIntrusoBarrado === "function" && caosIntrusoBarrado(null)) return caosAvisoModal("Muitas tentativas erradas. Espere um pouquinho.", reabrir);
    caosPromptModal(`🛠️ Senha do ADM pra liberar "${nome}" nesta partida como convidado (sem a memória e sem o tratamento do dono do nick):`, "", (v) => {
      if (v === null) return reabrir();
      const ok = typeof admHash === "function" && admHash(v) === ADM_CRIADOR_HASH;
      if (typeof caosIntrusoTentativa === "function" ? !caosIntrusoTentativa(ok, null, "convidado") : !ok) return caosAvisoModal("Senha errada.", reabrir);
      caosAvisoModal(`🛠️ O ADM liberou "${nome}" nesta partida como convidado: sem a memória e sem o tratamento do dono do nick.`, () => pronto({ convidado: true }));
    });
    if (typeof removerSenhaCampo === "function") removerSenhaCampo();
  });
  box.append(caosModalMsg(`🔐 O nick "${nome}" já tem cadastro. Se for você, digite seu PIN.\nSe não for, use outro nick (ou peça pro ADM liberar como convidado).`), row, adm);
  document.body.appendChild(ov);
}
