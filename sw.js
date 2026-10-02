// Service worker do Perfil JF (GitHub Pages): guarda o jogo para abrir sem internet.
// Rede primeiro: com internet, sempre pega a versão mais nova e atualiza a cópia;
// sem internet, abre a última cópia guardada.
const CACHE = "perfil-jf";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(["./", "manifest.json", "icones/icone-180.png", "icones/icone-192.png"]))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp.ok) {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return resp;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("./"))),
  );
});
