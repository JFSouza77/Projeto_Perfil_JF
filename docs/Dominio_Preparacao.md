# Domínio próprio: portas preparadas (1.7.10.5.5)

> **Nada foi trocado no ar.** O jogo continua em `https://jfsouza77.github.io/Projeto_Perfil_JF/`. Este documento
> diz o que já está pronto e o que fazer no dia em que o JF tiver o domínio (nome de trabalho: DICAOS).

## O que já está pronto no código

| Peça | Como está | Onde |
|---|---|---|
| Endereço do jogo | Um lugar só: `JOGO_SITE`. Texto de Compartilhar e link do convidado (quando o host está no offline) saem dele. | `src/js/01-configuracao.js` (bloco ENDEREÇOS) |
| Link dos convidados | Aberto pelo site, usa o endereço de onde foi aberto (`jogoSiteAtual()` e o link da sala em `05k-rede.js`). No domínio novo, já sai o domínio novo sem mexer em nada. | `jogoSiteAtual()` · `redeLinkSala` |
| App instalável | `manifest.json` e `sw.js` usam caminhos relativos (`./`). Funcionam em qualquer endereço. | raiz do repositório |
| Servidor da sala | Aceita os sites listados em `ORIGENS`. O arquivo offline e o localhost sempre valem. | `servidor/wrangler.toml` |
| Endereço do servidor | `REDE_SERVIDOR` (hoje `perfil-jf-sala.joaofe0000.workers.dev`). Pode virar `sala.dominio` depois. | `src/js/05k-rede.js` |

## No dia da troca (ordem segura)

1. **Comprar o domínio** (Registro.br pra `.com.br`, ou outro). Melhor deixar o DNS no próprio Cloudflare.
2. **Servidor primeiro:** acrescentar o domínio novo em `ORIGENS` (`servidor/wrangler.toml`), sem tirar o antigo.
   Merge no `main` → o Cloudflare republica sozinho.
3. **GitHub Pages:** em Settings → Pages → Custom domain, colocar o domínio (o GitHub cria o arquivo `CNAME`) e ligar
   "Enforce HTTPS". No DNS: `CNAME www → jfsouza77.github.io` (e os registros A do GitHub pro domínio sem www).
4. **Jogo:** trocar `JOGO_SITE` pro domínio novo, versão nova, build, PR.
5. **Testar:** abrir pelo domínio, abrir sala, entrar de outro dispositivo, instalar como app.
6. Opcional: servidor em subdomínio (`sala.dominio`) → Workers → Settings → Domains & Routes, e trocar `REDE_SERVIDOR`.

## Cuidado: o save fica no endereço antigo

O navegador guarda o save, a memória do C.A.O.S. e as fichas **por endereço**. No domínio novo o jogo abre "zerado"
pra quem já jogava. Antes de anunciar a troca:

- **Já existe:** Save de Bolso (exportar no endereço antigo, importar no novo).
- **A fazer na versão da troca:** no endereço antigo, um aviso "o jogo mudou de casa" com um botão que leva os
  dados junto (exporta e abre o domínio novo com os dados no link, importados uma vez). O endereço antigo fica no ar
  por um tempo, apontando pro novo.
- Quem tem o app instalado precisa instalar de novo pelo domínio novo.

## Fora do escopo agora

Idiomas, conta de jogador, salas públicas e telemetria dependem de decisões do JF (ver `docs/brainstorm/`).
