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
 *
 * Segredos (wrangler secret put): TURN_KEY_ID e TURN_KEY_API_TOKEN. Variável: ORIGENS (sites aceitos).
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

export default {
  async fetch(req, env) {
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
      return sinal().fetch(req);
    }
    if (!ok) return json({ erro: "origem" }, 403, h);
    if (p === "/salas" && req.method === "GET") {
      const r = await sinal().fetch(new Request("https://sinal/salas", { headers: { "CF-Connecting-IP": req.headers.get("CF-Connecting-IP") || "" } }));
      return json(await r.json(), 200, h);
    }
    if (p === "/sala" && req.method === "POST") {
      const corpo = await req.text();
      if (corpo.length > 2000) return json({ erro: "grande" }, 413, h);
      const r = await sinal().fetch(new Request("https://sinal/sala", { method: "POST", body: corpo, headers: { "CF-Connecting-IP": req.headers.get("CF-Connecting-IP") || "" } }));
      return json(await r.json(), r.status, h);
    }
    if (p === "/ponte" && req.method === "GET") {
      try {
        return json(await ponte(env), 200, h);
      } catch (e) {
        return json({ iceServers: [], erro: "ponte" }, 200, h);
      }
    }
    return new Response("não achei", { status: 404, headers: h });
  },
};

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
    return new Response("?", { status: 404 });
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
    for (const ws of this.ctx.getWebSockets(id)) {
      const a = ws.deserializeAttachment();
      if (!a || a.morto) continue;
      if (a.token === token || Date.now() - a.visto > MORTO_MS) {
        ws.serializeAttachment({ ...a, morto: true });
        try {
          ws.close(1000, "substituido");
        } catch (e) {}
      } else return recusar("ID-TAKEN", "ID is taken");
    }
    this.ctx.acceptWebSocket(servidor, [id]);
    const agora = Date.now();
    servidor.serializeAttachment({ id, token, rede: rede(ip), visto: agora, desde: agora, info: null });
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
