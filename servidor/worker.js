/* Perfil JF · servidor da sala (Cloudflare Worker + Durable Object)
 *
 * Faz três coisas, numa conta só do Cloudflare (plano grátis):
 *   1. Apresenta os aparelhos (sinalização compatível com o PeerJS 1.5): o host abre a sala com o id
 *      "perfiljf-sala-<código>" e cada convidado manda a oferta do WebRTC por aqui. Depois que a ligação
 *      abre, os dados vão direto entre os celulares (ou pela ponte TURN), sem passar por este servidor.
 *   2. Lista as salas da mesma rede (GET /salas): quem está no mesmo Wi-Fi sai na internet pelo mesmo
 *      endereço público, então o servidor mostra só as salas abertas desse endereço.
 *   3. Entrega as credenciais da ponte TURN do Cloudflare (GET /ponte), sem expor a chave da conta.
 *
 * Rotas (o jogo usa key "perfiljf" e path "/"):
 *   GET  /perfiljf/id      → id aleatório pro PeerJS (convidado)
 *   WS   /peerjs?key=&id=&token=  → sinalização (Durable Object "Sinal", com hibernação)
 *   GET  /salas            → [{ sala, modo, jogadores, desde }] da mesma rede (só as anunciadas)
 *   POST /sala             → o host anuncia a sala (modo e quantos jogadores; sem nome; o Júnior pede pra não listar)
 *   GET  /ponte            → { iceServers: [...] } (vazio se a ponte não estiver configurada)
 *   POST /reporte          → carta reportada por qualquer aparelho (1.7.10: id, dica, motivo; nada pessoal)
 *   GET  /reportes?chave=… → página do JF com os reportes (senha no segredo REPORTES_SENHA); &formato=texto
 *   POST /reportes/apagar  → apaga todos (com a senha)
 *   GET  /voz/estado       → { ligada } (1.7.10.2: a voz nova do C.A.O.S. está configurada?)
 *   POST /voz              → { t, r, p } → MP3 da fala (Azure, voz pt-BR). Cada fala gerada fica guardada
 *                            (as falas se repetem muito) e há um teto de letras por mês (VOZ_TETO_MES).
 *
 * Segredos (wrangler secret put): TURN_KEY_ID, TURN_KEY_API_TOKEN, REPORTES_SENHA, AZURE_SPEECH_KEY e
 * AZURE_SPEECH_REGION (e, opcional, AZURE_MAI_KEY + AZURE_MAI_REGION: voz com emoção, com a grátis de reserva). Variáveis: ORIGENS (sites aceitos), AZURE_VOZ (nome da voz), AZURE_ESTILOS (1 = a voz tem estilos de emoção) e VOZ_TETO_MES.
 * Como publicar: servidor/LEIA-ME.md.
 */
const CHAVE = "perfiljf";
const PREFIXO_SALA = "perfiljf-sala-";
const MORTO_MS = 20000; // sem batida (o PeerJS bate a cada 5 s) por 20 s = aparelho sumiu
const MAX_MSG = 64 * 1024;
const TIPOS = ["OFFER", "ANSWER", "CANDIDATE", "LEAVE", "EXPIRE"];

const idValido = (id) => typeof id === "string" && /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.test(id) && id.length <= 64;

function cors(req, env, livre) {
  const origem = req.headers.get("Origin") || "";
  const aceitas = String(env.ORIGENS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ok =
    livre ||
    !origem ||
    origem === "null" || // arquivo offline aberto do aparelho
    aceitas.includes(origem) ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origem);
  return {
    ok,
    h: {
      "Access-Control-Allow-Origin": ok ? origem || "*" : "null",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    },
  };
}
// 1.7.10.3.1 · Emoção na voz nova. [volume, pausa do "…" em ms, estilo da Microsoft (só nas vozes com estilos),
// ajuste de velocidade em %]. C.A.O.S. 4.1.4 (calibragem pedida pelo JF): fala do dia a dia sai normal, sem
// "ator de novela" (estilo neutral); vergonha mais baixa e lenta; recompondo mais rápido e leve; deboche seco e
// provocativo (neutro, um pouco mais lento, pausa maior); estilos que vêm com suspiro (hopeful, relieved,
// regretful) fora. As emoções fortes (festa, surpresa, raiva, tristeza, tédio...) ficam como estavam.
const VOZ_EMOCOES = {
  calmo: ["+0%", 380, "neutral", 0],
  orgulho: ["+8%", 320, "joyful", 0],
  raiva: ["+15%", 260, "angry", 0],
  furia: ["+22%", 220, "shouting", 0],
  deboche: ["+4%", 470, "neutral", -3], // 4.3 (JF: "um pouco dos dois"): seco, mas com um sorrisinho na voz
  tedio: ["-10%", 650, "", 0],
  carinho: ["-6%", 420, "softvoice", 0],
  desafio: ["+10%", 300, "determined", 0],
  pensando: ["-4%", 600, "confused", 0],
  preocupado: ["+0%", 380, "fearful", 0],
  festa: ["+15%", 260, "excited", 0],
  surpresa: ["+12%", 300, "surprised", 0],
  triste: ["-12%", 650, "sad", 0],
  julgando: ["-3%", 520, "", 0],
  espiando: ["-18%", 500, "whispering", 0],
  recompondo: ["-3%", 300, "neutral", 8],
  medo: ["+5%", 280, "fearful", 0],
  ansiedade: ["+5%", 260, "fearful", 5],
  vergonha: ["-8%", 480, "embarrassed", -5], // 4.2: "sem jeito", leve, sem ficar caricato
  nojo: ["+0%", 450, "disgusted", 0],
  nostalgia: ["-6%", 560, "neutral", -5],
  alivio: ["-3%", 340, "neutral", 5],
};
const VOZ_SSML_VERSAO = 7;
// Texto já limpo (sem < > & ") → SSML: "⏸" vira pausa, PALAVRA EM CAIXA ALTA (4+ letras) sai mais forte,
// palavra esticada ("PASTEEEL", "NÃÃÃO") vira a palavra normal, mais lenta e forte (lida letra a letra, saía
// "pastil"), interjeição no começo ganha um respiro, e a emoção muda o volume (e o estilo, se a voz tiver).
// Voz com estilos (Caio): sem mexer no tom (o estilo cuida da entonação; tom mexido deixava a voz murcha).
function vozSsml(nome, t, rateN, pitch, e, estilos) {
  const [vol, pausa, estilo, dRate] = VOZ_EMOCOES[e] || VOZ_EMOCOES.calmo;
  const rn = Math.round((Number(rateN) || 0) + (dRate || 0)), rate = (rn >= 0 ? "+" : "") + rn + "%";
  // sem pontuação no fim, a voz às vezes "solta o ar" (suspiro avulso): fecha a frase
  if (!/[.!?…]$/.test(t)) t += ".";
  let corpo = t
    .replace(/^(ah+|hm+|hum+|u[eé]|ops|opa|uau|eita|nossa|vish|oxe|aff)([,!.]?)\s+(?!⏸)/i, (m, a, pt) => `${a}${pt || ","}<break time="220ms"/> `)
    .replace(/\s*⏸\s*/g, `<break time="${pausa}ms"/> `)
    .replace(/\p{L}*(\p{L})\1{2,}\p{L}*/gu, (w) => `<prosody rate="-15%" volume="+20%">${w.replace(/(\p{L})\1{2,}/gu, "$1").toLowerCase()}</prosody>`)
    .replace(/(^|[^\p{L}])(\p{Lu}{4,})(?![\p{L}])/gu, (m, a, w) => `${a}<prosody volume="+25%"${estilos ? "" : ' pitch="+8%"'}>${w.toLowerCase()}</prosody>`);
  corpo = `<prosody rate="${rate}"${estilos ? "" : ` pitch="${pitch}"`} volume="${vol}">${corpo}</prosody>`;
  if (estilos && estilo) corpo = `<mstts:express-as style="${estilo}">${corpo}</mstts:express-as>`;
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="pt-BR"><voice name="${nome}">${corpo}</voice></speak>`;
}
// 1.7.10.3.1 · Vozes do servidor, na ordem de tentativa. "mai" (opcional): voz com emoção de verdade (MAI-Voice,
// paga; AZURE_MAI_KEY + AZURE_MAI_REGION, voz em AZURE_MAI_VOZ). "padrao": a voz grátis (AZURE_SPEECH_KEY +
// AZURE_SPEECH_REGION, voz em AZURE_VOZ). Se a "mai" falhar (crédito acabou, chave errada), cai na "padrao".
function vozesDoServidor(env) {
  const url = (reg, teste) => teste || `https://${String(reg).replace(/[^a-z0-9]/g, "")}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const nome = (n, pad) => String(n || pad).replace(/[^A-Za-z0-9:.-]/g, "");
  const out = [];
  if (env.AZURE_MAI_KEY && env.AZURE_MAI_REGION)
    out.push({ id: "mai", chave: env.AZURE_MAI_KEY, url: url(env.AZURE_MAI_REGION, env.AZURE_MAI_URL), nome: nome(env.AZURE_MAI_VOZ, "pt-BR-Caio:MAI-Voice-2.1-Flash"), estilos: true });
  if (env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION)
    out.push({ id: "padrao", chave: env.AZURE_SPEECH_KEY, url: url(env.AZURE_SPEECH_REGION, env.AZURE_URL), nome: nome(env.AZURE_VOZ, "pt-BR-AntonioNeural"), estilos: !!env.AZURE_ESTILOS && env.AZURE_ESTILOS !== "0" });
  return out;
}
const json = (dados, status, h) => new Response(JSON.stringify(dados), { status: status || 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(h || {}) } });

// Mesma rede: IPv4 igual, ou IPv6 com o mesmo prefixo /64 (cada celular tem o seu IPv6, mas a rede é a mesma).
function rede(ip) {
  ip = String(ip || "");
  if (!ip.includes(":")) return ip;
  const partes = ip.split("::")[0].split(":");
  while (partes.length < 4) partes.push("0");
  return partes.slice(0, 4).join(":").toLowerCase();
}

async function ponte(env) {
  if (!env.TURN_KEY_ID || !env.TURN_KEY_API_TOKEN) return { iceServers: [] };
  const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ttl: 86400 }),
  });
  if (!r.ok) return { iceServers: [], erro: r.status };
  const j = await r.json();
  const lista = Array.isArray(j.iceServers) ? j.iceServers : j.iceServers ? [j.iceServers] : [];
  // a porta 53 é bloqueada por alguns navegadores e atrasa a conexão: fica de fora
  const limpa = lista
    .map((s) => ({ ...s, urls: [].concat(s.urls || []).filter((u) => !/:53(\?|$)/.test(u)) }))
    .filter((s) => s.urls.length);
  return { iceServers: limpa, validade: Date.now() + 86400 * 1000 };
}

// 11/2026 (relato do JF: "o servidor dá umas crashadas"): o Cloudflare às vezes reinicia ou sobrecarrega o Durable
// Object (no plano grátis isso acontece). Antes o erro estourava cru e virava 500 sem cabeçalho de CORS (o jogo nem
// conseguia ler). Agora: tenta de novo uma vez quando o próprio Cloudflare diz que dá pra repetir, registra no log
// (Workers Logs, ligado no wrangler.toml) e responde um erro limpo que o jogo entende.
async function doFetch(stub, req) {
  // o corpo de um pedido só pode ser lido uma vez: a cópia é que vai na segunda tentativa
  const copia = req.method === "GET" || req.method === "HEAD" ? req : req.clone();
  try {
    return await stub.fetch(req);
  } catch (e) {
    if (e && e.retryable && !e.overloaded) {
      console.warn("DO: tentando de novo:", e.message);
      return await stub.fetch(copia);
    }
    throw e;
  }
}
export default {
  async fetch(req, env) {
    try {
      return await atender(req, env);
    } catch (e) {
      console.error("erro no servidor:", new URL(req.url).pathname, e && e.message, e && e.stack);
      const { h } = cors(req, env, true);
      return json({ erro: "servidor", tentar: true }, 503, h);
    }
  },
};
async function atender(req, env) {
  {
    const url = new URL(req.url);
    const p = url.pathname.replace(/\/+$/, "") || "/";
    const livre = p === `/${CHAVE}/id` || p === "/";
    const { ok, h } = cors(req, env, livre);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    if (p === "/") return new Response("Perfil JF · servidor da sala\n", { headers: { "Content-Type": "text/plain; charset=utf-8", ...h } });
    if (p === `/${CHAVE}/id`) return new Response(crypto.randomUUID(), { headers: { "Content-Type": "text/html", "Cache-Control": "no-store", ...h } });
    if (p === `/${CHAVE}/peers`) return new Response("", { status: 401, headers: h });
    const sinal = () => env.SINAL.get(env.SINAL.idFromName("sinal"));
    if (p === "/peerjs") {
      if (req.headers.get("Upgrade") !== "websocket") return new Response("só WebSocket", { status: 426 });
      return doFetch(sinal(), req);
    }
    const caixa = () => env.SINAL.get(env.SINAL.idFromName("reportes"));
    // 1.7.10: a página dos reportes abre direto no navegador do JF (protegida pela senha)
    if (p === "/reportes" || p === "/reportes/apagar") {
      if (!env.REPORTES_SENHA) return new Response("Senha dos reportes não configurada (segredo REPORTES_SENHA).", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      return doFetch(caixa(), req);
    }
    if (!ok) return json({ erro: "origem" }, 403, h);
    if (p === "/reporte" && req.method === "POST") {
      const corpo = await req.text();
      if (corpo.length > 3000) return json({ erro: "grande" }, 413, h);
      const r = await doFetch(caixa(), new Request("https://caixa/reporte", { method: "POST", body: corpo, headers: { "CF-Connecting-IP": req.headers.get("CF-Connecting-IP") || "" } }));
      return json(await r.json(), r.status, h);
    }
    if (p === "/salas" && req.method === "GET") {
      const r = await doFetch(sinal(), new Request("https://sinal/salas", { headers: { "CF-Connecting-IP": req.headers.get("CF-Connecting-IP") || "" } }));
      return json(await r.json(), 200, h);
    }
    if (p === "/sala" && req.method === "POST") {
      const corpo = await req.text();
      if (corpo.length > 2000) return json({ erro: "grande" }, 413, h);
      const r = await doFetch(sinal(), new Request("https://sinal/sala", { method: "POST", body: corpo, headers: { "CF-Connecting-IP": req.headers.get("CF-Connecting-IP") || "" } }));
      return json(await r.json(), r.status, h);
    }
    // 1.7.10.2 · voz nova do C.A.O.S. (Azure); instância "voz" do Durable Object guarda as falas e o teto do mês
    const voz = () => env.SINAL.get(env.SINAL.idFromName("voz"));
    if (p === "/voz/estado" && req.method === "GET") return json({ ligada: vozesDoServidor(env).length > 0 }, 200, h);
    if (p === "/voz" && req.method === "POST") {
      if (!vozesDoServidor(env).length) return json({ erro: "sem_voz" }, 503, h);
      const corpo = await req.text();
      if (corpo.length > 1500) return json({ erro: "grande" }, 413, h);
      const r = await doFetch(voz(), new Request("https://voz/voz", { method: "POST", body: corpo, headers: { "CF-Connecting-IP": req.headers.get("CF-Connecting-IP") || "" } }));
      const cab = new Headers(r.headers);
      Object.entries(h).forEach(([k, v]) => cab.set(k, v));
      return new Response(r.body, { status: r.status, headers: cab });
    }
    if (p === "/ponte" && req.method === "GET") {
      try {
        return json(await ponte(env), 200, h);
      } catch (e) {
        return json({ iceServers: [], erro: "ponte" }, 200, h);
      }
    }
    return new Response("não achei", { status: 404, headers: h });
  }
}

// Um Durable Object só pra todas as salas (escala de família). Os WebSockets hibernam entre mensagens,
// então o objeto não gasta tempo parado; o estado de cada aparelho fica no "attachment" do socket.
export class Sinal {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }
  // aparelho conectado com esse id (o mais recente, vivo)
  vivo(id) {
    let melhor = null;
    for (const ws of this.ctx.getWebSockets(id)) {
      const a = ws.deserializeAttachment();
      if (!a || a.id !== id || a.morto || Date.now() - a.visto > MORTO_MS) continue;
      if (!melhor || a.desde > melhor.a.desde) melhor = { ws, a };
    }
    return melhor;
  }
  async fetch(req) {
    const url = new URL(req.url);
    const ip = req.headers.get("CF-Connecting-IP") || "";
    if (url.pathname === "/peerjs") return this.conectar(url, ip);
    if (url.pathname === "/salas") return json(this.salas(ip));
    if (url.pathname === "/sala") return this.contarSala(await req.text(), ip);
    if (url.pathname === "/reporte") return this.guardarReporte(await req.text(), ip);
    if (url.pathname === "/reportes") return this.paginaReportes(url);
    if (url.pathname === "/reportes/apagar") return this.apagarReportes(req);
    if (url.pathname === "/voz") return this.falar(await req.text(), ip);
    return new Response("?", { status: 404 });
  }
  /* --- 1.7.10.2 · Voz nova do C.A.O.S. (instância "voz") ---
     Recebe o texto já limpo pelo jogo (t), a velocidade (r) e o tom (p) e devolve o MP3 do Azure. A mesma fala
     com o mesmo jeito sai do storage (sem gastar o Azure de novo). Teto de letras por mês (VOZ_TETO_MES, padrão
     400 mil, abaixo do grátis do Azure) e ritmo por endereço; passou disso, o jogo usa a voz do aparelho. */
  async falar(corpo, ip) {
    let d;
    try {
      d = JSON.parse(corpo);
    } catch (e) {
      return json({ erro: "json" }, 400);
    }
    const t = String((d && d.t) || "").replace(/[\u0000-\u001f<>&"]/g, " ").replace(/\s+/g, " ").trim().slice(0, 400);
    if (!t) return json({ erro: "vazio" }, 400);
    const num = (v, a, b) => Math.max(a, Math.min(b, Number.isFinite(+v) ? +v : 1));
    const r = Math.round(num(d.r, 0.5, 2) * 20) / 20, p = Math.round(num(d.p, 0.5, 2) * 20) / 20;
    // 1.7.10.3.1: a emoção da fala (vem do jogo) muda volume e pausas; numa voz com estilos (MAI-Voice, ex.: Caio)
    // também vira o estilo da Microsoft (alegre, triste, bravo...).
    const e = Object.prototype.hasOwnProperty.call(VOZ_EMOCOES, d.e) ? d.e : "";
    const vozes = vozesDoServidor(this.env);
    const st = this.ctx.storage;
    const mp3 = (dados, origem) => new Response(dados, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=604800", "X-Voz": origem } });
    const chaveDe = async (v) => {
      const dig = await crypto.subtle.digest("SHA-256", new TextEncoder().encode([v.nome, r, p, t, e, v.estilos ? 1 : 0, VOZ_SSML_VERSAO].join("|")));
      return "v:" + [...new Uint8Array(dig)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 40);
    };
    // Voz principal fora do ar (crédito acabou, chave trocada...): pula ela por 10 min e usa a reserva
    this.vozFora = this.vozFora || {};
    const agora = Date.now();
    const pausa = Number(this.env.VOZ_PAUSA_MS) > 0 ? Number(this.env.VOZ_PAUSA_MS) : 600e3; // (o teste encurta)
    const ativas = vozes.filter((v, i) => i === vozes.length - 1 || !(agora - (this.vozFora[v.id] || 0) < pausa));
    for (const v of ativas) {
      const g = await st.get(await chaveDe(v));
      if (g) return mp3(g, "guardada");
    }
    // ritmo: 400 falas novas por hora por endereço (em memória)
    this.ritmoVoz = this.ritmoVoz || new Map();
    const rv = (this.ritmoVoz.get(ip) || []).filter((x) => agora - x < 3600e3);
    if (rv.length >= 400) return json({ erro: "calma" }, 429);
    rv.push(agora);
    this.ritmoVoz.set(ip, rv);
    // teto do mês
    const mes = new Date().toISOString().slice(0, 7);
    const teto = Number(this.env.VOZ_TETO_MES) > 0 ? Number(this.env.VOZ_TETO_MES) : 400000;
    const gasto = (await st.get("mes:" + mes)) || 0;
    if (gasto + t.length > teto) return json({ erro: "teto" }, 429);
    const pct = (x, k) => (x >= 1 ? "+" : "") + Math.round((x - 1) * k) + "%";
    let ultimo = 0;
    for (const v of ativas) {
      let az;
      try {
        az = await fetch(v.url, {
          method: "POST",
          headers: { "Ocp-Apim-Subscription-Key": v.chave, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3", "User-Agent": "perfil-jf" },
          body: vozSsml(v.nome, t, Math.round((r - 1) * 100), pct(p, 40), e, v.estilos),
        });
      } catch (err) {
        az = null;
      }
      if (!az || !az.ok) {
        ultimo = az ? az.status : 0;
        this.vozFora[v.id] = agora;
        continue;
      }
      const dados = await az.arrayBuffer();
      await st.put("mes:" + mes, gasto + t.length);
      if (dados.byteLength > 0 && dados.byteLength < 1900000) await st.put(await chaveDe(v), dados);
      return mp3(dados, "nova:" + v.id);
    }
    return json({ erro: "azure", status: ultimo }, 502);
  }
  /* --- 1.7.10 · Reportes de cartas (instância "reportes"; storage do Durable Object) ---
     Guarda só o que serve pra conferir a carta: id, resposta, categoria, dica, motivo, nota curta, modo,
     versão e hora. Nada de nome, IP ou aparelho (o IP só limita a enxurrada, em memória). Até 3000. */
  async guardarReporte(corpo, ip) {
    let d;
    try {
      d = JSON.parse(corpo);
    } catch (e) {
      return json({ erro: "json" }, 400);
    }
    const t = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
    if (!d || !/^[A-Z]{3,8}-\d{4}$/.test(String(d.id || ""))) return json({ erro: "carta" }, 400);
    // no máximo 40 por hora por endereço (em memória; só pra ninguém lotar a caixa)
    const agora = Date.now();
    this.ritmo = this.ritmo || new Map();
    const r = (this.ritmo.get(ip) || []).filter((x) => agora - x < 3600e3);
    if (r.length >= 40) return json({ erro: "calma" }, 429);
    r.push(agora);
    this.ritmo.set(ip, r);
    const dica = d.dica && Number.isInteger(d.dica.pos) ? { pos: d.dica.pos, id: t(d.dica.id, 24) || null, texto: t(d.dica.texto, 300) } : null;
    const rep = {
      id: d.id,
      resposta: t(d.resposta, 80),
      categoria: t(d.categoria, 12),
      dica,
      motivo: ["fato", "velha", "entrega", "confusa", "outro"].includes(d.motivo) ? d.motivo : "outro",
      nota: t(d.nota, 120),
      modo: t(d.modo, 16),
      versao: t(d.versao, 20),
      quando: Number.isFinite(d.quando) ? d.quando : agora,
      chegou: agora,
    };
    const st = this.ctx.storage;
    await st.put("r:" + String(agora).padStart(15, "0") + ":" + Math.random().toString(36).slice(2, 8), rep);
    const n = ((await st.get("n")) || 0) + 1;
    if (n > 3000) {
      const velhos = await st.list({ prefix: "r:", limit: n - 3000 });
      await st.delete([...velhos.keys()]);
      await st.put("n", 3000);
    } else await st.put("n", n);
    return json({ ok: true });
  }
  senhaOk(chave) {
    const a = String(chave || ""), b = String(this.env.REPORTES_SENHA || "");
    if (!b || a.length !== b.length) return false;
    let x = 0;
    for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return x === 0;
  }
  async paginaReportes(url) {
    if (!this.senhaOk(url.searchParams.get("chave"))) return new Response("Senha errada.", { status: 401, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    const lista = [...(await this.ctx.storage.list({ prefix: "r:", reverse: true, limit: 1000 })).values()];
    const motivo = { fato: "❌ Fato errado", velha: "🕰️ Desatualizada", entrega: "🙊 Entrega a resposta", confusa: "🤔 Confusa", outro: "✏️ Outro" };
    const quando = (ms) => new Date(ms).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
    if (url.searchParams.get("formato") === "texto") {
      const txt = lista.map((r) => `• ${r.id} (${r.resposta}) · ${r.dica ? `dica ${r.dica.pos + 1}: "${r.dica.texto}"` : "a carta toda"} · ${(motivo[r.motivo] || r.motivo).replace(/^\S+\s/, "")}${r.nota ? " · " + r.nota : ""} · ${r.modo || "?"} · ${r.versao || "?"} · ${quando(r.quando)}`).join("\n");
      return new Response(`Perfil JF · cartas reportadas (${lista.length})\n` + txt + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
    }
    const e = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    const chave = e(url.searchParams.get("chave"));
    const itens = lista
      .map((r) => `<li><b>${e(r.id)}</b> · ${e(r.resposta)} <span>${e(r.categoria)}</span><br>${r.dica ? `Dica ${r.dica.pos + 1}: “${e(r.dica.texto)}”` : "A carta toda"}<br><em>${e(motivo[r.motivo] || r.motivo)}</em>${r.nota ? ` · ${e(r.nota)}` : ""}<small>${e(r.modo)} · ${e(r.versao)} · ${e(quando(r.quando))}</small></li>`)
      .join("");
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Cartas reportadas</title><style>body{font-family:system-ui,sans-serif;background:#12121c;color:#eee;margin:0;padding:16px;max-width:760px;margin:auto}h1{font-size:1.3rem}li{list-style:none;background:#1e1e2e;border-radius:12px;padding:12px;margin:10px 0;line-height:1.45}li span{opacity:.7;font-size:.85em}li small{display:block;opacity:.6;margin-top:4px}em{color:#fbbf24;font-style:normal}a,button{color:#22d3ee}button{background:none;border:1px solid #e11d48;color:#fda4af;border-radius:10px;padding:10px 14px;margin-top:16px}</style></head><body><h1>⚑ Cartas reportadas (${lista.length})</h1><p><a href="?chave=${chave}&formato=texto">Ver como texto (pra copiar)</a></p><ul style="padding:0">${itens || "<li>Nenhuma carta reportada ainda.</li>"}</ul><form method="post" action="/reportes/apagar" onsubmit="return confirm('Apagar todos os reportes?')"><input type="hidden" name="chave" value="${chave}"><button>🗑️ Apagar todos</button></form></body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  }
  async apagarReportes(req) {
    let chave = "";
    try {
      chave = (await req.formData()).get("chave");
    } catch (e) {}
    if (req.method !== "POST" || !this.senhaOk(chave)) return new Response("Senha errada.", { status: 401, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    const st = this.ctx.storage;
    let lista;
    while ((lista = await st.list({ prefix: "r:", limit: 128 })).size) await st.delete([...lista.keys()]);
    await st.put("n", 0);
    return new Response(null, { status: 303, headers: { Location: "/reportes?chave=" + encodeURIComponent(chave) } });
  }
  conectar(url, ip) {
    const id = url.searchParams.get("id") || "";
    const token = url.searchParams.get("token") || "";
    const key = url.searchParams.get("key") || "";
    const par = new WebSocketPair();
    const [cliente, servidor] = [par[0], par[1]];
    const recusar = (tipo, msg) => {
      servidor.accept();
      servidor.send(JSON.stringify({ type: tipo, payload: { msg } }));
      servidor.close(1008, msg);
      return new Response(null, { status: 101, webSocket: cliente });
    };
    if (!id || !token || !key) return recusar("ERROR", "No id, token, or key supplied to websocket server");
    if (key !== CHAVE) return recusar("INVALID-KEY", "Invalid key provided");
    if (!idValido(id)) return recusar("ERROR", "Invalid id");
    // o mesmo id já está aqui: se é o mesmo aparelho voltando (mesmo token) ou um aparelho que sumiu,
    // o novo assume; se é outro aparelho vivo, o id está ocupado (o jogo trata: outro código ou outro host)
    let herdada = null; // o mesmo aparelho voltando (mesmo token) mantém o anúncio da sala (revisão 1.7.10)
    for (const ws of this.ctx.getWebSockets(id)) {
      const a = ws.deserializeAttachment();
      if (!a || a.morto) continue;
      if (a.token === token || Date.now() - a.visto > MORTO_MS) {
        if (a.token === token && a.info) herdada = a.info;
        ws.serializeAttachment({ ...a, morto: true });
        try {
          ws.close(1000, "substituido");
        } catch (e) {}
      } else return recusar("ID-TAKEN", "ID is taken");
    }
    this.ctx.acceptWebSocket(servidor, [id]);
    const agora = Date.now();
    servidor.serializeAttachment({ id, token, rede: rede(ip), visto: agora, desde: agora, info: herdada });
    servidor.send(JSON.stringify({ type: "OPEN" }));
    return new Response(null, { status: 101, webSocket: cliente });
  }
  webSocketMessage(ws, msg) {
    if (typeof msg !== "string" || msg.length > MAX_MSG) return;
    const a = ws.deserializeAttachment();
    if (!a || a.morto) return;
    a.visto = Date.now();
    ws.serializeAttachment(a);
    let m;
    try {
      m = JSON.parse(msg);
    } catch (e) {
      return;
    }
    if (!m || m.type === "HEARTBEAT" || !TIPOS.includes(m.type)) return;
    const dst = typeof m.dst === "string" ? m.dst : "";
    if (!dst) {
      if (m.type === "LEAVE") {
        a.morto = true;
        ws.serializeAttachment(a);
        try {
          ws.close(1000, "saiu");
        } catch (e) {}
      }
      return;
    }
    const alvo = this.vivo(dst);
    if (alvo) {
      try {
        alvo.ws.send(JSON.stringify({ type: m.type, src: a.id, dst, payload: m.payload }));
        return;
      } catch (e) {
        alvo.a.morto = true;
        try {
          alvo.ws.serializeAttachment(alvo.a);
        } catch (x) {}
        try {
          ws.send(JSON.stringify({ type: "LEAVE", src: dst, dst: a.id }));
        } catch (x) {}
        return;
      }
    }
    // ninguém com esse id: o PeerJS de quem chamou avisa "peer-unavailable" (sala não existe ainda)
    if (m.type === "OFFER") {
      try {
        ws.send(JSON.stringify({ type: "EXPIRE", src: dst, dst: a.id }));
      } catch (e) {}
    }
  }
  webSocketClose(ws, code) {
    try {
      ws.close(code === 1005 || code === 1006 ? 1000 : code, "fechou");
    } catch (e) {}
  }
  webSocketError(ws) {
    try {
      ws.close(1011, "erro");
    } catch (e) {}
  }
  salas(ip) {
    const minha = rede(ip);
    const lista = [];
    if (!minha) return lista;
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (!a || a.morto || Date.now() - a.visto > MORTO_MS || a.rede !== minha || !a.id.startsWith(PREFIXO_SALA)) continue;
      // só aparece a sala que o host anunciou (o Júnior não anuncia) e sem nome de ninguém
      const i = a.info;
      if (!i || !i.listar) continue;
      lista.push({ sala: a.id.slice(PREFIXO_SALA.length).toUpperCase(), modo: i.modo || null, jogadores: i.jogadores || 0, desde: a.desde });
    }
    return lista.sort((x, y) => y.desde - x.desde).slice(0, 12);
  }
  contarSala(corpo, ip) {
    let d;
    try {
      d = JSON.parse(corpo);
    } catch (e) {
      return json({ erro: "json" }, 400);
    }
    const sala = String((d && d.sala) || "").toLowerCase();
    if (!/^[a-z0-9]{3,8}$/.test(sala)) return json({ erro: "sala" }, 400);
    const v = this.vivo(PREFIXO_SALA + sala);
    // só quem está na mesma rede do host atualiza o cartão da sala
    if (!v || v.a.rede !== rede(ip)) return json({ erro: "sem_sala" }, 404);
    const limpa = (s, n) => String(s || "").replace(/[<>&"'`\\\u0000-\u001f\u200b-\u200f\u2028-\u202e]/g, "").slice(0, n) || null;
    v.a.info = { listar: d.listar !== false, modo: limpa(d.modo, 24), jogadores: Math.max(0, Math.min(12, d.jogadores | 0)) };
    v.ws.serializeAttachment(v.a);
    return json({ ok: true });
  }
}
