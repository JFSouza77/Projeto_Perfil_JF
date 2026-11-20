/* --- 1.9.6 · Avatar do C.A.O.S. na mesa (teste, pedido do JF; adiado de 06/11 pra 19/11) ---
 * Só no Modo C.A.O.S. e só com a opção "🤖 Avatar do C.A.O.S." ligada na Acessibilidade (começa desligada).
 * Ele flutua no canto da tela e muda de forma com o humor (as formas que o JF escolheu em 06/11):
 *   carinho e calmo → anjinho · alegria → festeiro · raiva → capetinha (forte: capeta bravo)
 *   tristeza → tristinho · medo e ansiedade → sirene · curiosidade → pensador · tédio → sonolento
 *   vergonha → envergonhado · nojo → nojinho
 * No host, o humor vem do console de emoções; no celular, da última fala do C.A.O.S. que chegou da sala.
 * Menos movimento ou Modo Batata: o avatar fica parado (o próprio avatar já respeita isso). */
const CAOS_AVATAR_FORMA_DA_EMOCAO = {
  calmo: "anjinho",
  carinho: "anjinho",
  alegria: "feliz",
  raiva: "tentado",
  tristeza: "triste",
  medo: "alerta",
  ansiedade: "alerta",
  curiosidade: "pensando",
  tedio: "sonolento",
  vergonha: "envergonhado",
  nojo: "nojinho",
};
const CAOS_AVATAR_FURIA = 7; // raiva acima disso vira o capeta bravo
let caosAvatarMesa = null;
let caosAvatarTique = null;
function caosAvatarLigado() {
  return typeof acessCfg !== "undefined" && acessCfg.avatar === true;
}
// No Modo C.A.O.S. com a partida rodando, no host ou no celular de quem joga
function caosAvatarNaHora() {
  if (!caosAvatarLigado() || typeof CURRENT_MODE === "undefined" || CURRENT_MODE !== "caos") return false;
  if (typeof gameEnded !== "undefined" && gameEnded) return false;
  const tela = document.getElementById("gameScreen");
  const noCelular = typeof rede !== "undefined" && rede && rede.papel === "convidado";
  return noCelular || !!(tela && tela.style.display !== "none");
}
function caosAvatarForma() {
  try {
    const c = typeof caosConsole !== "undefined" ? caosConsole : null;
    if (c && c.atual) {
      if (c.atual === "raiva" && c.g && c.g.raiva >= CAOS_AVATAR_FURIA) return "perturbado";
      return CAOS_AVATAR_FORMA_DA_EMOCAO[c.atual] || "anjinho";
    }
    const falas = typeof rede !== "undefined" && rede && rede.falas;
    const ult = falas && falas.length ? falas[falas.length - 1] : null;
    if (ult && ult.emo) return CaosAvatar.formaPara({ rosto: { emo: ult.emo, nome: ult.emo } });
  } catch (e) {}
  return "anjinho";
}
function caosAvatarAtualizar() {
  try {
    if (!caosAvatarNaHora()) {
      if (caosAvatarMesa) caosAvatarMesa.el.hidden = true;
      return;
    }
    if (!caosAvatarMesa) {
      const el = document.createElement("div");
      el.id = "caosAvatarMesa";
      el.className = "caos-avatar-mesa";
      document.body.appendChild(el);
      CaosAvatar.configurarAvatar({ menosMovimento: () => (typeof semMovimento === "function" ? semMovimento() : false) });
      caosAvatarMesa = CaosAvatar.criarAvatar(el, { tamanho: "pequeno", forma: caosAvatarForma() });
    }
    caosAvatarMesa.el.hidden = false;
    caosAvatarMesa.mostrar(caosAvatarForma());
    // boca mexendo enquanto o balão do C.A.O.S. está na tela
    caosAvatarMesa.falando(!!(typeof activeToastState !== "undefined" && activeToastState));
  } catch (e) {}
}
function caosAvatarIniciar() {
  if (caosAvatarTique) return;
  caosAvatarTique = setInterval(caosAvatarAtualizar, 700);
}
