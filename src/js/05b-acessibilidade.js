/* ----------------------------------------------------------------------
 * 5b. ACESSIBILIDADE (1.7.6): configuração do aparelho, pra todos os modos.
 * Antes ela existia só no Old School Acessibilidade. Agora fica no menu ⋮ (e na Pausa):
 * letra maior (2 níveis), mais tempo pra escolher/responder, ler as dicas em voz alta,
 * volume da voz e dos sons, alto contraste e menos movimento.
 * O Old School Acessibilidade continua: ele liga letra grande e mais tempo naquela partida.
 * ---------------------------------------------------------------------- */
const ACESS_KEY = "perfil5_acessibilidade";
// Segundos a mais por tipo de relógio quando "Mais tempo" está ligado.
const ACESS_TEMPO_EXTRA = { pick: 15, response: 30, special: 10, turn: 5 };
const ACESS_PADRAO = { letra: 0, tempo: false, lerDicas: false, volVoz: 1, volSom: 1, contraste: false };
let acessCfg = { ...ACESS_PADRAO };
function acessCarregar() {
  try {
    const o = JSON.parse(JFStore.getItem(ACESS_KEY) || "{}");
    // 1.7.7 (revisão GPT): só as chaves conhecidas, cada uma no tipo certo. "false" em texto,
    // número no lugar de booleano ou lixo de versão velha voltam pro padrão.
    const ok = o && typeof o === "object" && !Array.isArray(o) ? o : {};
    acessCfg = { ...ACESS_PADRAO };
    Object.keys(ACESS_PADRAO).forEach((k) => {
      if (k in ok) acessCfg[k] = ok[k];
    });
    ["tempo", "lerDicas", "contraste"].forEach((k) => {
      acessCfg[k] = acessCfg[k] === true;
    });
    acessCfg.letra = [0, 1, 2].includes(acessCfg.letra) ? acessCfg.letra : 0;
    ["volVoz", "volSom"].forEach((k) => {
      const v = Number(acessCfg[k]);
      acessCfg[k] = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1;
    });
  } catch (e) {
    acessCfg = { ...ACESS_PADRAO };
  }
}
function acessSalvar() {
  try {
    JFStore.setItem(ACESS_KEY, JSON.stringify(acessCfg));
  } catch (e) {}
}
// Segundos a mais no relógio (o Old School Acessibilidade já vem com mais tempo de resposta).
function acessTempoExtra(kind) {
  if (typeof oldSchoolAcess !== "undefined" && oldSchoolAcess)
    return { pick: 15, response: 0, special: 10, turn: 0 }[kind] || 0;
  return acessCfg.tempo ? ACESS_TEMPO_EXTRA[kind] || 0 : 0;
}
function acessVolVoz() {
  return acessCfg.volVoz;
}
function acessVolSom() {
  return acessCfg.volSom;
}
// Letra e contraste na página inteira (classes no <html>).
function aplicarAcessibilidade() {
  const h = document.documentElement;
  const os = typeof CURRENT_MODE !== "undefined" && CURRENT_MODE === "oldschool" && oldSchoolAcess;
  h.classList.toggle("os-acess", os);
  h.classList.toggle("acess-letra-1", acessCfg.letra === 1);
  h.classList.toggle("acess-letra-2", acessCfg.letra === 2);
  h.classList.toggle("acess-contraste", !!acessCfg.contraste);
}
// Lê a dica em voz alta quando ela abre (usa a voz do aparelho; entra na fila depois do C.A.O.S.).
function acessLerDica(num, item) {
  if (!acessCfg.lerDicas || !item || typeof CAOS_VOICE_OK === "undefined" || !CAOS_VOICE_OK) return;
  try {
    const especial = item.type === "special";
    const txt = (especial ? "Instrução especial. " : "Dica " + num + ". ") + String(item.text || "");
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = "pt-BR";
    const v = typeof caosPickVoice === "function" ? caosPickVoice() : null;
    if (v) u.voice = v;
    u.rate = 1;
    u.volume = acessVolVoz();
    window.speechSynthesis.speak(u);
  } catch (e) {}
}
// Painel de acessibilidade (menu ⋮ da tela inicial e Pausa).
function acessPainelAbrir() {
  const antigo = document.getElementById("acessPainel");
  if (antigo) antigo.remove();
  const ov = document.createElement("div");
  ov.id = "acessPainel";
  ov.className = "caos-modal-ov acess-ov";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-label", "Acessibilidade");
  const box = document.createElement("div");
  box.className = "acess-box";
  ov.appendChild(box);
  const pintar = () => {
    const sel = (on) => (on ? ' aria-pressed="true" class="acess-op on"' : ' aria-pressed="false" class="acess-op"');
    box.innerHTML = `<div class="acess-tit">♿ Acessibilidade</div>
      <div class="acess-sub">Vale pra este aparelho, em todos os modos.</div>
      <div class="acess-grupo"><div class="acess-rot">🔠 Tamanho da letra</div>
        <div class="acess-seg" role="group" aria-label="Tamanho da letra">
          <button type="button" data-letra="0"${sel(acessCfg.letra === 0)}>Normal</button>
          <button type="button" data-letra="1"${sel(acessCfg.letra === 1)}>Grande</button>
          <button type="button" data-letra="2"${sel(acessCfg.letra === 2)}>Enorme</button>
        </div></div>
      <button type="button" data-tog="tempo"${sel(acessCfg.tempo)}>⏳ Mais tempo <small>+15 s pra escolher a dica, +30 s pra responder</small></button>
      <button type="button" data-tog="lerDicas"${sel(acessCfg.lerDicas)}${CAOS_VOICE_OK ? "" : " disabled"}>🔊 Ler as dicas em voz alta <small>${CAOS_VOICE_OK ? "cada dica é lida quando abre" : "este aparelho não tem voz"}</small></button>
      <button type="button" data-tog="contraste"${sel(acessCfg.contraste)}>🌗 Alto contraste <small>texto mais forte, sem brilho neon</small></button>
      <button type="button" data-tog="calmo"${sel(document.body.classList.contains("batata-mode"))}>🐢 Menos movimento <small>tira animações (o mesmo do Modo Batata)</small></button>
      <div class="acess-grupo"><label class="acess-rot" for="acessVolVoz">🗣️ Volume da voz <b>${Math.round(acessCfg.volVoz * 100)}%</b></label>
        <input id="acessVolVoz" type="range" min="0" max="1" step="0.05" value="${acessCfg.volVoz}"></div>
      <div class="acess-grupo"><label class="acess-rot" for="acessVolSom">🎵 Volume dos sons <b>${Math.round(acessCfg.volSom * 100)}%</b></label>
        <input id="acessVolSom" type="range" min="0" max="1" step="0.05" value="${acessCfg.volSom}"></div>
      <div class="acess-nota">🌎 Idioma: Português (Brasil). Outros idiomas vêm numa próxima atualização.</div>
      <div class="acess-acoes"><button type="button" class="acess-fechar" id="acessFechar">Pronto</button></div>`;
    box.querySelectorAll("[data-letra]").forEach((b) =>
      b.addEventListener("click", () => {
        acessCfg.letra = +b.dataset.letra;
        acessSalvar();
        aplicarAcessibilidade();
        pintar();
      }),
    );
    box.querySelectorAll("[data-tog]").forEach((b) =>
      b.addEventListener("click", () => {
        const k = b.dataset.tog;
        if (k === "calmo") {
          if (typeof toggleBatataMode === "function") toggleBatataMode();
        } else {
          acessCfg[k] = !acessCfg[k];
          acessSalvar();
          aplicarAcessibilidade();
          if (k === "lerDicas" && acessCfg.lerDicas) acessLerDica(1, { type: "clue", text: "Assim as dicas vão ser lidas." });
        }
        pintar();
      }),
    );
    [
      ["acessVolVoz", "volVoz"],
      ["acessVolSom", "volSom"],
    ].forEach(([id, k]) => {
      const inp = box.querySelector("#" + id);
      inp.addEventListener("input", () => {
        acessCfg[k] = +inp.value;
        inp.previousElementSibling.querySelector("b").textContent = Math.round(acessCfg[k] * 100) + "%";
      });
      inp.addEventListener("change", () => {
        acessSalvar();
        if (k === "volSom" && typeof playSfx === "function") playSfx("vitoriaCarta");
        if (k === "volVoz") acessLerDica(1, { type: "clue", text: "Volume da voz." });
      });
    });
    box.querySelector("#acessFechar").addEventListener("click", () => ov.remove());
  };
  ov.addEventListener("click", (e) => {
    if (e.target === ov) ov.remove();
  });
  pintar();
  document.body.appendChild(ov);
}

/* --- Toque duplo (1.7.7, revisão GPT/Google) ---
 * Depois de um veredito (Acertou, Errou, Pulou, Absurdo, Passar) ou de escolher um número, a
 * tela se redesenha na hora. O 2º toque de um toque duplo, ou um dedo que tremeu, caía no botão
 * que nasceu no mesmo lugar (Errou e logo em seguida um número da grade). Por 400 ms depois de
 * um desses toques, outro toque nesses mesmos botões é ignorado. Ninguém escolhe de propósito
 * tão rápido; quem toca duas vezes sem querer não perde a vez. */
const TOQUE_JOGO_SEL =
  "#correctBtn, #wrongBtn, #pularBtn, #absurdoBtn, #expressCorrectBtn, #expressNextBtn, .number-btn, [data-scorer], .palpite-hit, .palpite-miss";
const TOQUE_TRAVA_MS = 400;
let toqueJogoUltimo = 0;
document.addEventListener(
  "click",
  (e) => {
    const alvo = e.target && e.target.closest ? e.target.closest(TOQUE_JOGO_SEL) : null;
    if (!alvo) return;
    const agora = Date.now();
    if (agora - toqueJogoUltimo < TOQUE_TRAVA_MS) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }
    toqueJogoUltimo = agora;
  },
  true,
);
