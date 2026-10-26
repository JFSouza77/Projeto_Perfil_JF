/* =========================================================================================================
   1.8 · C.A.O.S. 5.2 · Afeto da ficha (pedido do JF, 25/10/2026: "agora que cada jogador tem uma ficha, dá pra usar
   isso nas emoções")
   O que ele sente numa jogada depende de quem jogou, pela ficha guardada entre partidas:
   · 🎖️ veterano (10+ partidas): erro irrita menos; acerto dá carinho;
   · 🌱 novato (menos de 2 partidas): erro quase não irrita; acerto dá carinho;
   · 🏆 craque (acerta 60%+ em 15+ respostas): erro irrita mais ("esperava mais de você");
   · 🦓 zebra (acerta menos de 35% em 10+ respostas): acerto alegra mais;
   · 💔 mágoa (cortou ele 2+ vezes): acerto alegra menos; erro dá um pouco de nojo;
   · 🔁 voltou por cima (foi lanterna na última): acerto dá carinho;
   · 📈 recorde: passou a melhor pontuação da ficha nesta partida: festa, uma vez só.
   Nome emprestado (nickEmprestado) não conta: a ficha é de outra pessoa.
   ========================================================================================================= */
const CAOS_AFETO_TAGS = {
  veterano: { ic: "🎖️", t: "veterano" },
  novato: { ic: "🌱", t: "novato" },
  craque: { ic: "🏆", t: "craque" },
  zebra: { ic: "🦓", t: "zebra" },
  magoa: { ic: "💔", t: "mágoa" },
  volta: { ic: "🔁", t: "voltou por cima" },
};
let caosAfetoCache = { match: null, por: {}, recorde: {} };

function caosAfetoFicha(p) {
  if (!p || typeof memContaFicha !== "function" || !memContaFicha(p) || typeof fichaGet !== "function") return null;
  try {
    return fichaGet(p.name);
  } catch (e) {
    return null;
  }
}
// etiquetas e pesos de um jogador (calculados uma vez por partida: a ficha só muda no fim)
function caosAfeto(p) {
  if (!p) return null;
  const mid = typeof matchId !== "undefined" ? matchId : null;
  if (caosAfetoCache.match !== mid) caosAfetoCache = { match: mid, por: {}, recorde: {} };
  const k = p.id || p.name;
  if (caosAfetoCache.por[k]) return caosAfetoCache.por[k];
  const f = caosAfetoFicha(p);
  const tags = [];
  if (f) {
    const n = f.acertos + f.erros,
      taxa = n ? f.acertos / n : null;
    if (f.partidas >= 10) tags.push("veterano");
    else if (f.partidas < 2) tags.push("novato");
    if (taxa !== null && n >= 15 && taxa >= 0.6) tags.push("craque");
    else if (taxa !== null && n >= 10 && taxa < 0.35) tags.push("zebra");
    if (f.magoa >= 2) tags.push("magoa");
    if (f.ultimoResultado === "lanterna") tags.push("volta");
  } else tags.push("novato");
  const tem = (t) => tags.includes(t);
  const a = {
    tags,
    raiva: (tem("veterano") ? 0.85 : 1) * (tem("novato") ? 0.7 : 1) * (tem("craque") ? 1.2 : 1) * (tem("magoa") ? 1.15 : 1),
    alegria: (tem("zebra") ? 1.4 : 1) * (tem("magoa") ? 0.85 : 1) * (tem("volta") ? 1.15 : 1),
    carinho: (tem("veterano") ? 0.3 : 0) + (tem("novato") ? 0.4 : 0) + (tem("volta") ? 0.5 : 0),
    nojo: tem("magoa") ? 0.3 : 0,
    recorde: f && f.melhorPts > 0 ? f.melhorPts : 0,
  };
  caosAfetoCache.por[k] = a;
  return a;
}
function caosAfetoMotivo(a) {
  return a && a.tags.length ? a.tags.map((t) => CAOS_AFETO_TAGS[t].t).join(", ") : "";
}
// passou o próprio recorde da ficha nesta partida: festa, uma vez por jogador por partida
function caosAfetoRecorde(p) {
  const a = caosAfeto(p);
  if (!a || !a.recorde || (p.score || 0) <= a.recorde) return false;
  const k = p.id || p.name;
  if (caosAfetoCache.recorde[k]) return false;
  caosAfetoCache.recorde[k] = true;
  caosSentir("alegria", 1.5, `recorde pessoal de ${p.name}`);
  caosSentir("carinho", 0.6, `recorde pessoal de ${p.name}`);
  caosLog("afeto", `${p.name} passou o recorde da ficha (${a.recorde})`);
  return true;
}

/* --- Inspetor do cérebro: aba "🧬 Jogadores" (a ficha e o que ele sente por cada um) --- */
function caosInspectorJogadores() {
  const wrap = document.createElement("div");
  const pintar = () => {
    wrap.innerHTML = "";
    const sec = ciSecao("🧬 Jogadores", "o que a ficha muda nas emoções dele");
    if (!players.length) {
      sec.insertAdjacentHTML("beforeend", '<div class="ci-note">Ninguém na mesa ainda.</div>');
      wrap.appendChild(sec);
      return;
    }
    players.forEach((p) => {
      const f = caosAfetoFicha(p),
        a = caosAfeto(p) || { tags: [], raiva: 1, alegria: 1, carinho: 0, nojo: 0 };
      const n = f ? f.acertos + f.erros : 0;
      const emo = p.estadoEmocional && JOG_EMOS[p.estadoEmocional] ? JOG_EMOS[p.estadoEmocional].t : "neutro";
      const vinc = caosVinc && caosVinc.fav === p.name ? " · 💛 favorito" : caosVinc && caosVinc.desafeto === p.name ? " · 😤 desafeto" : "";
      const tags = a.tags.map((t) => `<span class="ci-tag">${CAOS_AFETO_TAGS[t].ic} ${CAOS_AFETO_TAGS[t].t}</span>`).join(" ") || '<span class="ci-tag">sem etiqueta</span>';
      const pct = (x) => (x === 1 ? "igual" : (x > 1 ? "+" : "−") + Math.round(Math.abs(x - 1) * 100) + "%");
      const card = document.createElement("div");
      card.className = "ci-card ci-jog";
      card.innerHTML = `<div class="ci-kv"><span><b>${escapeHtml((p.avatar ? p.avatar + " " : "") + p.name)}</b>${vinc}</span><b class="ci-mono">${escapeHtml(emo)}</b></div>
        <div class="ci-tags">${tags}</div>
        <div class="ci-kv"><span>Ficha</span><b class="ci-mono">${f ? `${f.partidas} partidas · ${n ? Math.round((f.acertos / n) * 100) + "% de acerto" : "sem respostas"} · recorde ${f.melhorPts || 0} · média ${f.msN ? memSeg(f.msSum / f.msN) + " s" : "—"}` : p.nickEmprestado ? "nome emprestado (não conta)" : "sem ficha (primeira vez)"}</b></div>
        <div class="ci-kv"><span>Erro dele → raiva</span><b class="ci-mono">${pct(a.raiva)}</b></div>
        <div class="ci-kv"><span>Acerto dele → alegria</span><b class="ci-mono">${pct(a.alegria)}${a.carinho ? ` · carinho +${a.carinho.toFixed(1)}` : ""}</b></div>
        <div class="ci-kv"><span>Últimas jogadas</span><b class="ci-mono">${escapeHtml(((p.emo && p.emo.h) || "").split("").join(" ") || "—")}</b></div>`;
      sec.appendChild(card);
    });
    sec.insertAdjacentHTML("beforeend", '<div class="ci-note">Jogadas: A acerto · a acerto rápido · E erro · X absurdo · P pulo. As etiquetas vêm da ficha guardada (partidas anteriores) e valem a partida toda.</div>');
    wrap.appendChild(sec);
  };
  pintar();
  const tk = setInterval(() => {
    if (!wrap.isConnected) return clearInterval(tk);
    pintar();
  }, 2e3);
  return wrap;
}
