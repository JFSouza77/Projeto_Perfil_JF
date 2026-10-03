/* ----------------------------------------------------------------------
 * 5c. O C.A.O.S. SUGERE O TUTORIAL (1.7.6): rede de segurança pra quem nunca jogou.
 * Pergunta uma vez só: "Quer fazer o tutorial? Leva menos de dois minutos."
 *  · ao tocar em Jogar, se o aparelho ainda não conhece ninguém (memória do C.A.O.S. vazia);
 *  · ao tocar em "Sou iniciante" no cadastro;
 *  · na Pausa, um atalho pro tutorial fica à vista enquanto ele não tiver sido visto.
 * Depois de abrir o tutorial (por qualquer caminho) ou responder "Já sei jogar", não pergunta mais.
 * ---------------------------------------------------------------------- */
const TUT_VISTO_KEY = "perfil5_tutorial_visto";
let tutSugeridoNaSessao = false;
let tutAoFechar = null; // o que fazer quando o tutorial sugerido fechar (seguir de onde parou)
function tutVisto() {
  try {
    return !!JFStore.getItem(TUT_VISTO_KEY);
  } catch (e) {
    return true;
  }
}
function tutMarcarVisto(como) {
  try {
    if (!JFStore.getItem(TUT_VISTO_KEY)) JFStore.setItem(TUT_VISTO_KEY, como + "|" + Date.now());
  } catch (e) {}
}
// Aparelho novo: o C.A.O.S. ainda não tem ficha de ninguém.
function tutMesaNova() {
  try {
    const f = JSON.parse(JFStore.getItem(MEM_FICHAS_KEY) || "{}");
    return !f || !Object.keys(f).length;
  } catch (e) {
    return false;
  }
}
const TUT_SUGESTAO_FALAS = {
  primeira: "Primeira vez por aqui? Quer fazer o tutorial? Leva menos de dois minutos. Eu espero. Juro que é rápido.",
  iniciante: "Antes do cadastro: quer ver o tutorial? Leva menos de dois minutos, e aí ninguém fica perdido.",
};
// Mostra a pergunta e devolve true; quem chamou para e espera: continuar() roda depois
// de "Já sei jogar" na hora, ou de "Ver o tutorial" quando o tutorial fechar.
function tutSugerir(motivo, continuar) {
  if (tutSugeridoNaSessao || tutVisto()) return false;
  tutSugeridoNaSessao = true;
  const fala = TUT_SUGESTAO_FALAS[motivo] || TUT_SUGESTAO_FALAS.primeira;
  const { ov, box } = caosModalBase();
  ov.id = "tutSugestao";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-label", "Sugestão de tutorial");
  box.style.borderColor = "#22d3ee";
  const ic = document.createElement("div");
  ic.textContent = "🎓";
  ic.setAttribute("aria-hidden", "true");
  ic.style.cssText = "font-size:2.6rem;line-height:1;margin-bottom:8px";
  const row = caosModalRow();
  const seguir = () => {
    try {
      caosVoiceCancel();
    } catch (e) {}
    ov.remove();
  };
  row.append(
    caosModalBtn("Já sei jogar", "#444a66", () => {
      seguir();
      tutMarcarVisto("recusou");
      if (continuar) continuar();
    }),
    caosModalBtn("🎓 Ver o tutorial", "#0e7490", () => {
      seguir();
      tutAoFechar = continuar || null;
      openTutorial("rapido");
    }),
  );
  box.append(ic, caosModalMsg("🤖 " + fala), row);
  document.body.appendChild(ov);
  try {
    caosFalarNormal("[C.A.O.S.] " + fala);
  } catch (e) {}
  return true;
}
// Chamado pelo closeTutorial: segue de onde a sugestão parou.
function tutDepoisDeFechar() {
  const f = tutAoFechar;
  tutAoFechar = null;
  if (f)
    try {
      f();
    } catch (e) {}
}
// Atalho na Pausa enquanto o tutorial não foi visto neste aparelho.
function tutPausaAtualizar() {
  const b = document.getElementById("pauseTutBtn");
  if (b) b.style.display = tutVisto() ? "none" : "";
}
