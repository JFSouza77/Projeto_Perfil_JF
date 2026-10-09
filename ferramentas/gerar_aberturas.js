#!/usr/bin/env node
// Gera as imagens de abertura do iPhone (1.7.9.11 · relato do JF: no iPhone não aparecia tela de
// carregamento nenhuma). O Android monta a abertura sozinho com o ícone e a cor do manifest; o iPhone
// só mostra se o site tiver uma imagem pronta no tamanho exato da tela de cada modelo
// (<link rel="apple-touch-startup-image">). Este script desenha a abertura (fundo, ícone, nome) em cada
// tamanho e salva em icones/abertura-LxA.jpg (JPEG: o degradê em PNG passava de 1 MB cada). Os <link> ficam em src/html/01-cabeca.html.
//   node ferramentas/gerar_aberturas.js
"use strict";
const fs = require("fs");
const path = require("path");
const { abrirNavegador } = require("./_navegador");
const RAIZ = path.join(__dirname, "..");
// [largura CSS, altura CSS, densidade] — modelos em retrato (o jogo é em pé)
const TELAS = [
  [440, 956, 3], // 16 Pro Max
  [402, 874, 3], // 16 Pro
  [430, 932, 3], // 16 Plus, 15 Plus, 15 Pro Max, 14 Pro Max
  [393, 852, 3], // 16, 15, 15 Pro, 14 Pro
  [428, 926, 3], // 14 Plus, 13 Pro Max, 12 Pro Max
  [390, 844, 3], // 14, 13, 13 Pro, 12, 12 Pro
  [375, 812, 3], // 13 mini, 12 mini, 11 Pro, XS, X
  [414, 896, 3], // 11 Pro Max, XS Max
  [414, 896, 2], // 11, XR
  [414, 736, 3], // 8 Plus
  [375, 667, 2], // SE (2ª e 3ª), 8
];
(async () => {
  const icone = "data:image/png;base64," + fs.readFileSync(path.join(RAIZ, "icones/icone-512.png")).toString("base64");
  const b = await abrirNavegador();
  const links = [];
  for (const [w, h, d] of TELAS) {
    const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: d });
    await pg.setContent(`<!doctype html><html><body style="margin:0;width:${w}px;height:${h}px;overflow:hidden;
      background:radial-gradient(120% 80% at 50% 38%, #24204a 0%, #12112a 55%, #0b0a1c 100%);
      display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,Helvetica,sans-serif;">
      <img src="${icone}" style="width:${Math.round(w * 0.46)}px;height:${Math.round(w * 0.46)}px;border-radius:22%;filter:drop-shadow(0 0 22px #ff2fa055);">
      <div style="margin-top:${Math.round(h * 0.035)}px;color:#fff;font-weight:800;font-size:${Math.round(w * 0.085)}px;letter-spacing:1px;text-shadow:0 0 12px #ff2fa0aa, 0 0 26px #ff2fa055;">Perfil JF</div>
      <div style="margin-top:${Math.round(h * 0.012)}px;color:#c4b5fd;font-size:${Math.round(w * 0.038)}px;opacity:.85;">Carregando…</div>
    </body></html>`);
    await pg.waitForTimeout(100);
    const nome = `abertura-${w * d}x${h * d}.jpg`;
    await pg.screenshot({ path: path.join(RAIZ, "icones", nome), type: "jpeg", quality: 86 });
    await pg.close();
    links.push(
      `<link rel="apple-touch-startup-image" media="screen and (device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${d}) and (orientation: portrait)" href="icones/${nome}">`,
    );
    console.log("ok", nome);
  }
  await b.close();
  console.log("\n" + links.join("\n"));
})();
