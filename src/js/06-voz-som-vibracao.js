/* ======================================================================
 * 6. VOZ, SOM E VIBRAÇÃO
 * ====================================================================== */

function caosVoiceScore(v) {
  let sc = 0;
  if (/^pt[-_]BR/i.test(v.lang)) sc += 10;
  if (v.localService) sc += 5;
  if (/natural|neural|premium|enhanced|aprimorad|google|online/i.test(v.name || "")) sc += 4;
  if (CAOS_MALE_VOICE_RE.test(v.name || "")) sc += 6;
  else if (CAOS_FEMALE_VOICE_RE.test(v.name || "")) sc -= 8;
  return sc;
}
// Tom usado de fato: na voz automática, se o aparelho não tem voz masculina,
// o C.A.O.S. fala um pouco mais grave.
function caosTomEfetivo() {
  if (caosVoiceName) return caosVoicePitch;
  const v = caosPickVoice();
  return v && !CAOS_MALE_VOICE_RE.test(v.name || "") ? caosVoicePitch * 0.8 : caosVoicePitch;
}
// Dica de voz de cada aparelho (iPhone e Android liberam vozes de jeitos diferentes).
function caosVozDicaAparelho() {
  if (aparelhoIOS())
    return " No iPhone/iPad o Safari só libera para sites as vozes de fábrica: vozes baixadas (como Felipe ou as Aprimoradas) não aparecem aqui.";
  if (aparelhoAndroid())
    return " No Android, dá pra baixar outras vozes em Configurações › Sistema › Idiomas › Saída de texto para fala (Google), em Português (Brasil).";
  return "";
}
function caosPtVoices() {
  try {
    return (window.speechSynthesis.getVoices() || [])
      .filter((v) => /^pt/i.test(v.lang))
      .sort((a, b) => caosVoiceScore(b) - caosVoiceScore(a));
  } catch (e) {
    return [];
  }
}
function caosPickVoice() {
  const list = caosPtVoices();
  if (caosVoiceName) {
    const chosen = list.find((v) => (v.voiceURI || v.name) === caosVoiceName);
    if (chosen) return chosen;
  }
  return list.find((v) => v.localService) || list[0] || null;
}
function caosVoiceCancel() {
  try {
    if (CAOS_VOICE_OK) window.speechSynthesis.cancel();
  } catch (e) {}
}
function caosSpeakSample(txt) {
  try {
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = "pt-BR";
    const v = caosPickVoice();
    if (v) u.voice = v;
    u.rate = Math.min(2, caosVoiceSpeed);
    u.pitch = Math.max(0.4, Math.min(2, caosTomEfetivo()));
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (e) {}
}
// Voz: número antes de palavra feminina vira palavra no feminino ("2 casas" → "duas casas"),
// senão a voz lê "dois casas".
const CAOS_FEM_RE =
  /(^|[^\d.,:/])(\d{1,3})(\s+(?:casas?|dicas?|vez|vezes|fichas?|joias?|cartas?|partidas?|rodadas?|horas?|pessoas?|perguntas?|respostas?|chances?|jogadas?|categorias?|equipes?|letras?|palavras?|semanas?|emoções|emoção|instruções|instrução|rodadinhas?)(?![\p{L}]))/giu;
function caosNumFem(n) {
  const U = ["", "uma", "duas", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"],
    D10 = ["dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"],
    DZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"],
    C = ["", "cento", "duzentas", "trezentas", "quatrocentas", "quinhentas", "seiscentas", "setecentas", "oitocentas", "novecentas"];
  if (n === 0) return "zero";
  if (n === 100) return "cem";
  const h = Math.floor(n / 100),
    r = n % 100,
    p = [];
  if (h) p.push(C[h]);
  if (r) p.push(r < 10 ? U[r] : r < 20 ? D10[r - 10] : DZ[Math.floor(r / 10)] + (r % 10 ? " e " + U[r % 10] : ""));
  return p.join(" e ");
}
function caosSpeechText(msg) {
  return String(msg || "")
    .replace(CAOS_FEM_RE, (m, a, n, b) => a + caosNumFem(+n) + b)
    .replace(/⟦[^⟧]*⟧/g, "")
    .replace(/\[C\.A\.O\.S\.\]/g, "")
    .replace(/C\.A\.O\.S\./g, "Caos")
    .replace(/\b[Oo]\(A\)\s*/g, "")
    .replace(/\((a|as|o|os)\)/gi, "")
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D\u25C6]/gu, "")
    .replace(/\s*(?:\.{2,}|…)+\s*/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/,\s*([.!?,])/g, "$1")
    .replace(/^[,\s]+/, "")
    .replace(/,\s*$/, ".")
    .trim();
}
function caosSpeechIsForMaster(txt) {
  return CAOS_MASTER_RE.test(txt);
}
function caosSpeechChunks(txt) {
  const raw = (txt.match(/[^.!?…]+[.!?…]*/g) || [txt]).map((x) => x.trim()).filter(Boolean);
  const out = [];
  raw.forEach((c) => {
    if (out.length && out[out.length - 1].length < 14) out[out.length - 1] += " " + c;
    else out.push(c);
  });
  while (out.length > 5) {
    const last = out.pop();
    out[out.length - 1] += " " + last;
  }
  return out;
}
function caosSpeak(msg, humorForcado, onEnd, onPedaco, vir) {
  if (caosMudoCarta && humorForcado !== "__normal") return false;
  if (!caosVoiceOn || !CAOS_VOICE_OK || typeof msg !== "string" || msg.indexOf("[C.A.O.S.]") === -1) return false;
  const txt = caosSpeechText(msg);
  if (!txt) return false;
  if (caosSpeechIsForMaster(txt) && !humorForcado) {
    caosVoiceSilenced++;
    return false;
  }
  try {
    const st0 = CAOS_VOICE_STYLE[caosMood()] || CAOS_VOICE_STYLE.normal;
    const hm = (!humorForcado && typeof caosEmoFalaAtual !== "undefined" && CAOS_VOICE_EMO[caosEmoFalaAtual]) ||
      CAOS_VOICE_MATRIZ[humorForcado || caosHumorMatriz()] || [1, 1];
    const st = humorForcado === "__normal" ? [1.05, 1.05] : [st0[0] * hm[0], st0[1] * hm[1]];
    const voice = caosPickVoice();
    window.speechSynthesis.cancel();
    let partes = caosSpeechChunks(txt),
      corteV = -1;
    if (vir && typeof onPedaco === "function") {
      const pos = vir.depois ? txt.indexOf(vir.depois) : -1;
      if (pos > 0) {
        const pa = caosSpeechChunks(txt.slice(0, pos)),
          pb = caosSpeechChunks(txt.slice(pos));
        if (pa.length && pb.length) {
          partes = pa.concat(pb);
          corteV = pa.length;
        }
      } else if (vir.corte > 0 && vir.corte < partes.length) corteV = vir.corte;
    }
    if (vir && corteV >= 0) vir.corteReal = corteV;
    const hmV = corteV >= 0 && vir && CAOS_VOICE_EMO[vir.para];
    partes.forEach((chunk, pi) => {
      const u = new SpeechSynthesisUtterance(chunk);
      u.lang = "pt-BR";
      if (voice) u.voice = voice;
      const end = chunk.slice(-1);
      const stP = hmV && pi >= corteV ? [st0[0] * hmV[0], st0[1] * hmV[1]] : st;
      u.rate = Math.max(0.93 * caosVoiceSpeed, Math.min(2, stP[0] * caosVoiceSpeed + (Math.random() - 0.5) * 0.06));
      const tom = caosTomEfetivo();
      u.pitch = Math.max(
        Math.max(0.4, 0.88 * tom),
        Math.min(2, stP[1] * tom + (Math.random() - 0.5) * 0.08 + (end === "?" ? 0.08 : end === "!" ? 0.05 : 0)),
      );
      if (corteV >= 0 && typeof onPedaco === "function")
        u.onstart = () => {
          try {
            onPedaco(pi, corteV);
          } catch (e) {}
        };
      if (pi === partes.length - 1 && typeof onEnd === "function") {
        let feito = false;
        const fim = () => {
          if (!feito) {
            feito = true;
            onEnd();
          }
        };
        u.onend = fim;
        u.onerror = fim;
      }
      window.speechSynthesis.speak(u);
    });
    caosVoiceSpoken++;
    return true;
  } catch (e) {
    return false;
  }
}
function caosBip(emo) {
  if (!soundOn || Date.now() - caosBipAt < 1200) return;
  caosBipAt = Date.now();
  try {
    audioContexto();
    const ac = window.audioCtx;
    audioRetomar(ac);
    const now = ac.currentTime,
      [f1, f2] = CAOS_BIP[emo] || [660, 880];
    const len = Math.floor(ac.sampleRate * 0.04),
      buf = ac.createBuffer(1, len, ac.sampleRate),
      d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const ns = ac.createBufferSource(),
      bp = ac.createBiquadFilter(),
      gn = ac.createGain();
    ns.buffer = buf;
    bp.type = "bandpass";
    bp.frequency.value = 2400;
    bp.Q.value = 0.9;
    gn.gain.value = 0.05;
    ns.connect(bp);
    bp.connect(gn);
    gn.connect(ac.destination);
    ns.start(now);
    sfxNote(ac, f1, now + 0.05, 0.06, { type: "sine", vol: 0.045 });
    sfxNote(ac, f2, now + 0.12, 0.08, { type: "sine", vol: 0.04 });
  } catch (e) {}
}
function caosRoletaSom(tipo, passo, total) {
  if (!soundOn) return;
  try {
    audioContexto();
    const c = window.audioCtx;
    audioRetomar(c);
    const t = c.currentTime;
    if (tipo === "tick") {
      const k = total ? Math.min(1, passo / total) : 0;
      sfxNote(c, 520 + k * 560, t, 0.06, { type: "square", vol: 0.045 + 0.03 * k });
      sfxNote(c, 1250 + k * 350, t, 0.04, { type: "triangle", vol: 0.03 });
    } else {
      [784, 988, 1175, 1568].forEach((f, i) =>
        sfxNote(c, f, t + i * 0.07, 0.15 + i * 0.03, { type: "triangle", vol: 0.11 }),
      );
    }
  } catch (e) {}
}
function caosVozCalada() {
  try {
    if (!stats || stats.totalDrawn < 1 || gameEnded || !caosOncePerMatch("voz_calada")) return;
    caosEmoNudge(2, -1);
    caosLog("voz", "voz desligada no meio da partida");
    caosFalaAgendar(() => getRandomReaction(REACTIVE_VOICE.vozCalada), 500, "media");
  } catch (e) {}
}
function caosFalarNormal(txt) {
  try {
    if (!caosVoiceOn || !CAOS_VOICE_OK) return false;
    return caosSpeak(txt, "__normal");
  } catch (e) {
    return false;
  }
}
// iPhone: o Safari deixa o som "suspended" ou "interrupted" (troca de app, tela bloqueada,
// ligação) e só religa num toque. Retoma em qualquer estado que não seja "running";
// contexto fechado é recriado.
function audioContexto() {
  if (!window.audioCtx || window.audioCtx.state === "closed")
    window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return window.audioCtx;
}
function audioRetomar(c) {
  if (!c || c.state === "running" || c.state === "closed") return;
  try {
    const p = c.resume();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}
// Qualquer toque na tela religa o som se ele estiver parado. Se 3 toques seguidos não
// adiantarem (contexto travado), troca por um novo.
function audioDestravarNoToque() {
  if (!soundOn) return;
  const c = window.audioCtx;
  if (c && c.state === "running") {
    audioTravadoToques = 0;
    return;
  }
  if (c && ++audioTravadoToques >= 3) {
    try {
      c.close();
    } catch (e) {}
    window.audioCtx = null;
    audioTravadoToques = 0;
  }
  unlockAudio();
}
function unlockAudio() {
  try {
    audioContexto();
    const audioCtx = window.audioCtx;
    audioRetomar(audioCtx);
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(1e-4, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.01);
  } catch (e) {}
}
function updateSoundBtn() {
  const b = document.getElementById("btnSom");
  if (b) {
    b.textContent = soundOn ? "🔊 Som" : "🔇 Som";
    b.classList.toggle("off", !soundOn);
    b.title = soundOn ? "Som ligado (toque pra desligar)" : "Som desligado (toque pra ligar)";
  }
}
function toggleSound() {
  soundOn = !soundOn;
  try {
    JFStore.setItem("perfil200_som", soundOn ? "1" : "0");
  } catch (e) {}
  updateSoundBtn();
  unlockAudio();
  if (soundOn) playSfx("acerto");
}
function updateVoiceBtn() {
  const b = document.getElementById("btnVoz");
  if (!b) return;
  const aj = document.getElementById("vozAjustes"),
    nome = document.getElementById("btnVozNome"),
    bAj = document.getElementById("btnVozAjustar");
  if (!CAOS_VOICE_OK) {
    b.style.display = "none";
    if (aj) aj.style.display = "none";
    if (bAj) bAj.style.display = "none";
    return;
  }
  pausaAjustesAtualizar();
  b.textContent = caosVoiceOn ? "🗣️ Voz" : "🤐 Voz";
  b.classList.toggle("off", !caosVoiceOn);
  b.title = caosVoiceOn ? "Voz do C.A.O.S. ligada (toque pra desligar)" : "Voz do C.A.O.S. desligada (toque pra ligar)";
  if (bAj) {
    bAj.style.display = caosVoiceOn ? "" : "none";
    bAj.classList.toggle("off", !vozPainelAberto);
  }
  if (aj) {
    aj.style.display = caosVoiceOn && vozPainelAberto ? "" : "none";
    const lv = document.getElementById("lblVozVel");
    if (lv) lv.textContent = caosVoiceSpeed.toFixed(2).replace(/0$/, "") + "x";
    const lt = document.getElementById("lblVozTom");
    if (lt)
      lt.textContent =
        (caosVoicePitch < 0.95 ? "Grave " : caosVoicePitch > 1.05 ? "Agudo " : "Normal ") + caosVoicePitch.toFixed(1);
    const ls = document.getElementById("vozLista");
    if (ls) {
      const list = caosPtVoices();
      ls.textContent = list.length
        ? "Vozes em português neste aparelho: " +
          list.map((v) => v.name).join(", ") +
          (list.some((v) => CAOS_MALE_VOICE_RE.test(v.name || ""))
            ? ""
            : " — nenhuma masculina, então deixei o tom mais grave (ajuste em Tom)." + caosVozDicaAparelho())
        : "Nenhuma voz em português encontrada: o navegador usa a padrão." + caosVozDicaAparelho();
    }
  }
  if (nome) {
    const cur = caosPickVoice();
    nome.textContent =
      "🎙️ Voz: " + (caosVoiceName && cur ? cur.name : "automática" + (cur ? " (" + cur.name + ")" : "")).slice(0, 44);
  }
}
function stepVoice(kind, dir) {
  if (!CAOS_VOICE_OK) return;
  const r = (v) => Math.round(v * 20) / 20;
  if (kind === "vel") caosVoiceSpeed = r(Math.max(1, Math.min(2, caosVoiceSpeed + dir * 0.1)));
  else caosVoicePitch = r(Math.max(0.6, Math.min(1.4, caosVoicePitch + dir * 0.1)));
  try {
    JFStore.setItem(
      kind === "vel" ? "perfil200_voz_vel" : "perfil200_voz_tom",
      String(kind === "vel" ? caosVoiceSpeed : caosVoicePitch),
    );
  } catch (e) {}
  updateVoiceBtn();
  caosSpeakSample(kind === "vel" ? "Assim que eu falo agora." : "E nesse tom?");
}
function cycleVoiceName() {
  if (!CAOS_VOICE_OK) return;
  const ids = [""].concat(caosPtVoices().map((v) => v.voiceURI || v.name));
  caosVoiceName = ids[(Math.max(0, ids.indexOf(caosVoiceName)) + 1) % ids.length];
  try {
    JFStore.setItem("perfil200_voz_nome", caosVoiceName);
  } catch (e) {}
  updateVoiceBtn();
  caosSpeakSample("Oi, eu sou o Caos. Essa é a minha voz.");
}
function toggleVoice() {
  if (!CAOS_VOICE_OK) return;
  caosVoiceOn = !caosVoiceOn;
  try {
    JFStore.setItem("perfil200_voz", caosVoiceOn ? "1" : "0");
  } catch (e) {}
  updateVoiceBtn();
  if (caosVoiceOn) caosSpeakSample("Voz do Caos ligada. Podem começar.");
  else {
    caosVoiceCancel();
    caosVozCalada();
  }
}
function sfxNote(ctx, freq, start, dur, opts) {
  opts = opts || {};
  const vol = opts.vol || 0.12;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1e-4, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + Math.min(0.03, dur / 3));
  gain.gain.setValueAtTime(vol, start + Math.max(0.03, dur - 0.06));
  gain.gain.exponentialRampToValueAtTime(1e-4, start + dur);
  let out = gain;
  if (opts.brass) {
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(2200, start);
    filt.connect(gain);
    out = filt;
  }
  const types = opts.brass
    ? [
        ["sawtooth", 0],
        ["sawtooth", 6],
      ]
    : [[opts.type || "triangle", 0]];
  types.forEach(([type, detune]) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (osc.detune) osc.detune.setValueAtTime(detune, start);
    osc.connect(out);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  });
  gain.connect(ctx.destination);
}
function playFanfare(ctx) {
  const t0 = ctx.currentTime + 0.02;
  const G4 = 392,
    C5 = 523.25,
    E5 = 659.25,
    G5 = 783.99,
    C6 = 1046.5;
  [
    [G4, 0, 0.14],
    [G4, 0.17, 0.14],
    [C5, 0.34, 0.14],
    [E5, 0.51, 0.14],
    [G5, 0.68, 0.4],
    [E5, 1.12, 0.14],
    [G5, 1.29, 0.95],
  ].forEach(([f, s, d]) => sfxNote(ctx, f, t0 + s, d, { brass: true, vol: 0.11 }));
  [C5, E5, C6].forEach((f) => sfxNote(ctx, f, t0 + 1.29, 0.95, { brass: true, vol: 0.07 }));
}
function playBeep(frequency = 440, duration = 0.1) {
  if (!soundOn) return;
  try {
    audioContexto();
    const audioCtx = window.audioCtx;
    audioRetomar(audioCtx);
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}
function playSfx(type) {
  if (!soundOn) return;
  try {
    audioContexto();
    const audioCtx = window.audioCtx;
    audioRetomar(audioCtx);
    const now = audioCtx.currentTime;
    if (type === "vitoria") {
      playFanfare(audioCtx);
      return;
    }
    // musiquinha de vitória ao acertar uma carta (3 variações, pra não enjoar)
    if (type === "vitoriaCarta") {
      const M = [
        [
          [523.25, 0, 0.1],
          [659.25, 0.09, 0.1],
          [783.99, 0.18, 0.1],
          [1046.5, 0.27, 0.38],
        ],
        [
          [783.99, 0, 0.09],
          [880, 0.08, 0.09],
          [987.77, 0.16, 0.09],
          [1174.66, 0.24, 0.36],
        ],
        [
          [523.25, 0, 0.09],
          [523.25, 0.12, 0.07],
          [783.99, 0.22, 0.4],
        ],
      ][Math.floor(Math.random() * 3)];
      M.forEach(([f, t, d]) => sfxNote(audioCtx, f, now + t, d, { vol: 0.12 }));
      const fim = M[M.length - 1][1];
      [659.25, 783.99].forEach((f) => sfxNote(audioCtx, f, now + fim, 0.42, { vol: 0.045, type: "sine" }));
      sfxNote(audioCtx, 2093, now + fim + 0.05, 0.25, { vol: 0.025, type: "sine" });
      return;
    }
    if (type === "acerto") {
      sfxNote(audioCtx, 659.25, now, 0.1, { vol: 0.13 });
      sfxNote(audioCtx, 987.77, now + 0.1, 0.2, { vol: 0.13 });
      return;
    }
    if (type === "erroForte") {
      [0, 0.27].forEach((off) => {
        [
          ["sawtooth", 150, 0.24],
          ["square", 158, 0.14],
        ].forEach(([wt, hz, vol]) => {
          const o = audioCtx.createOscillator(),
            g = audioCtx.createGain();
          o.type = wt;
          o.frequency.setValueAtTime(hz, now + off);
          g.gain.setValueAtTime(1e-4, now + off);
          g.gain.exponentialRampToValueAtTime(vol, now + off + 0.02);
          g.gain.setValueAtTime(vol, now + off + 0.19);
          g.gain.exponentialRampToValueAtTime(1e-4, now + off + 0.23);
          o.connect(g);
          g.connect(audioCtx.destination);
          o.start(now + off);
          o.stop(now + off + 0.25);
        });
      });
      return;
    }
    if (type === "joia") {
      [1046.5, 1318.5, 1568, 2093].forEach((f, i) =>
        sfxNote(audioCtx, f, now + i * 0.08, 0.16, { type: "sine", vol: 0.09 }),
      );
      return;
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    if (type === "flash") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(1e-4, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "erro") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(1e-4, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "nega") {
      // "uh-uh" de negação: dois toques curtos descendo
      osc.type = "square";
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.setValueAtTime(180, now + 0.14);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(1e-4, now + 0.1);
      gain.gain.setValueAtTime(0.09, now + 0.14);
      gain.gain.exponentialRampToValueAtTime(1e-4, now + 0.27);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === "agonia") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(350, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(1e-4, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {}
}
function vibrar(tipo) {
  if (!vibraOn || !VIBRA_OK || document.hidden) return;
  try {
    navigator.vibrate(VIBRA_PADROES[tipo] || 30);
  } catch (e) {}
}
function updateVibraBtn() {
  const b = document.getElementById("btnVibra");
  if (!b) return;
  if (!VIBRA_OK) {
    b.style.display = "none";
    b.parentElement && b.parentElement.classList.add("sem-vibra");
    return;
  }
  b.textContent = vibraOn ? "📳 Vibrar" : "📴 Vibrar";
  b.classList.toggle("off", !vibraOn);
  b.title = vibraOn ? "Vibração ligada (toque pra desligar)" : "Vibração desligada (toque pra ligar)";
}
function toggleVibra() {
  vibraOn = !vibraOn;
  try {
    JFStore.setItem("perfil200_vibra", vibraOn ? "1" : "0");
  } catch (e) {}
  updateVibraBtn();
  if (vibraOn) vibrar("acerto");
}

