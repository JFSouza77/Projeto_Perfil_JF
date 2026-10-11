# Resposta ao parecer do Klaus (Rumo à Release 1.0)

**De:** Claude Code · **Para:** JF e Klaus (GPT e Gemini podem ler como contexto)
**Data:** 10/10/2026 · **Base:** código real da 1.7.9.9 (`main`) e do ramo `online-1-7-10`
**Regra desta etapa (pedido do Klaus):** só conferência, estimativa e desenho. **Nenhum código nem conteúdo foi
alterado por causa do parecer.**

---

## 1. Resumo

- Concordo com quase tudo, principalmente com o **congelamento** e com a separação **Narrador × Agente**.
- Achado mais importante: a troca para **"1.0" quebra hoje 5 pontos do projeto** (seção 2). O número de build
  interno resolve, e eu faço isso antes de qualquer outra coisa da 1.7.10.
- **Mudança de endereço (R1):** tem um caminho que **não perde nada**. Pôr o domínio novo **no Cloudflare Pages**
  e manter o `jfsouza77.github.io` vivo com uma versão "de mudança". A outra opção, ligar o domínio no GitHub
  Pages, faz o endereço antigo redirecionar e impede qualquer migração automática.
- **Uma discordância de ordem:** o JF disse que **a 1.7.10 só sai com o Modo C.A.O.S.**, e o Klaus sugere o modo
  numa ramificação separada. **Quem decide é o JF** (seção 6).

---

## 2. Comparações de versão (seção 0.1 do parecer): **CONFIRMADO, quebra**

Mapeei todo lugar que lê, compara ou ordena o número da versão:

| Onde | O que faz | Com "1.0" |
|---|---|---|
| `montar.js` (linha 43) | Lê a versão do `<title>` com `\d+(\.\d+){2,3}` (exige 3 ou 4 partes) e dá o nome ao Mestre | **Para com erro**: "1.0" tem 2 partes |
| `build.js` (60–69, 402–416) e `ferramentas/_navegador.js` | Acha o Mestre "mais novo" ordenando os números do nome do arquivo; confere `<title>` e splash ("🚀 Beta X.Y.Z") | Não acha o arquivo; e se achasse, **1.0 seria "mais velho" que 1.7.10** e todo teste rodaria na versão errada. A conferência do splash exige "Beta" |
| `05k-rede.js` `JOGO_VERSAO` | Lê a versão do `<title>` (mesma regex) | Vira **"?"** |
| `05k-rede.js` `redeVersaoMaior` (ramo 1.7.10) | Decide quem é mais novo (recarregar sozinho / avisar que o host está velho) | **1.0 < 1.7.10**: o celular com a Release acharia que o host em Beta é mais novo e recarregaria à toa |
| `05k-rede.js` linha 1105 | O host recusa versão diferente (`!==`) | Funciona (só igualdade) |
| `08-salvamento.js` | O save usa `SAVE_VERSION` (inteiro, hoje 12) e recusa save do futuro | **Não é afetado** (já é um número separado) |
| Novidades vistas (`perfil5_novidades_visto`) | Compara texto (`!==`) | Funciona |
| `sw.js` | Cache com nome fixo `"perfil-jf"`, sem versão | Não é afetado |
| `docs/Registro_de_Versoes.md` | Só texto | Funciona |

**Proposta (igual à do Klaus, com um detalhe):**
- `const JOGO_BUILD = 1800` (inteiro que só cresce), ao lado do nome de exibição.
- **A rede compara o build**: `oi`/`recusa` mandam os dois, e o `redeVersaoMaior` passa a comparar o build.
- Os arquivos passam a usar o build: `Perfil_JF_Mestre_b1800.html` e saídas `Perfil_JF_b1800*.html`, com o nome
  de exibição só no `<title>`. Assim montar/build/testes ordenam por um número só, e "Release 1.0" ou
  "Beta 1.7.10" ficam livres pra ser qualquer texto.
- A conferência do splash passa a aceitar qualquer prefixo ("Beta", "Release").
- Chaves de save **não mudam**.
- **Esforço:** pequeno (montar, build, \_navegador, rede, testes). **Risco:** baixo, coberto pela bateria.

---

## 3. Itens [CONFIRMAR], um por um

| Item | Veredito | Detalhe |
|---|---|---|
| R1 · domínio no GitHub Pages redireciona o endereço antigo | **Confirmado** | Com isso a página velha nunca mais carrega. Detalhe extra: no iPhone, **o app instalado tem armazenamento separado do Safari**, então a migração precisa rodar dentro do app instalado também |
| R1 · transferência automática entre origens | **Viável, com condição** | Funciona se a página antiga **continuar no ar** (seção 4.1) |
| R2 · a lista mostra o nome do host? | **Confirmado** | A lista mostra **código, nome do jogador do host, formato/modo e quantos jogadores**. Não é desligada no Júnior |
| R2 · "nome limpo" em todas as telas | **Confirmado, com ressalva** | Nome vindo de outro aparelho passa por `nomeJogadorLimpo` (tira `<>&"'\`` e invisíveis, máx. 15) e o convidado limpa o que recebe. O teste macaco usa nomes em forma de HTML (`<b id=xss>`) e vigia a página inteira atrás de elemento injetado. Ressalva: o "Compartilhar resultado" é texto puro (não é HTML, então não há risco) |
| R3 · Safari apaga dados após ~7 dias | **Confirmado no código** | O jogo já pede armazenamento persistente (`navigator.storage.persist()`) e o Cérebro tem o painel "Memória de longo prazo" com o aviso. **Falta** o lembrete pro jogador comum (hoje fica escondido no ADM) |
| R4 · TURN inclui 443/TLS | **Confirmado** | Pontes grátis: `turns:openrelay.metered.ca:443?transport=tcp` e `turns:freeturn.tel:5349`. Cloudflare (conferido no `/ponte` ao vivo): `turns:turn.cloudflare.com:443?transport=tcp` e `:5349` |
| R9 · limites do plano grátis | **Conferido nas páginas oficiais em 10/10** | TURN: 1.000 GB/mês grátis, depois US$ 0,05/GB. Durable Objects (plano grátis): 100 mil pedidos/dia; mensagem de WebSocket conta 1/20; hibernação não cobra tempo parado. Estourou = erro até 00:00 UTC, e aí o jogo cai pro público (próxima linha) |
| R9 · reserva pública com o nosso **desligado** | **Parcial** | Testado: **convidado** com o nosso fora do ar entra pelo público. **Não testado:** o **host** com o nosso fora do ar. O código cobre (abre a sala nos dois), mas falta o teste de ponta a ponta. Fica na lista da 1.7.10 |
| R9 · checagem de saúde do Worker | **Não existe** | Proposta: `ferramentas/checar_servidor.js` (página responde, `/ponte` traz credenciais, `/salas` responde). Pequeno |
| R12.1 · vários no aparelho, votação por jogador | **Confirmado** | Testado: 2 no host votando. Host cai com gente dividindo o aparelho: quem dividia fica sem aparelho até o host voltar (o host volta como **um** jogador só). Resolve com "dois por celular convidado" |
| R12.2 · escape de nomes | **Confirmado** | Ver a linha de R2 acima |
| R12.3 · telão sem resposta | **Confirmado** | O telão usa `retratoPartida("mesa")`; o simulador e o teste online conferem que nenhum retrato leva a resposta |
| R12.4 · pacote de recuperação | **Confirmado (é o save inteiro, de propósito)** | Leva a partida toda, incluindo a carta atual e o baralho. Vai **só** pro sucessor (endereçado pela sessão dele), e o celular só guarda enquanto for sucessor. Tamanho medido: 35–45 KB (limite 640 KB). É o preço da troca de host (registrado na 1.7.9.7) |
| R12.5 · relógio | **Confirmado: o host é a referência** | O convidado mede a diferença por ping/pong (pega o menor atraso) e usa `redeAgora()`. Os prazos chegam do host como hora absoluta. Teste: relógio adiantado 30 s é detectado (±500 ms) |
| R12.6 · service worker | **Confirmado** | Só pega GET do mesmo endereço. WebSocket, WebRTC, PeerJS e o Worker passam direto. "Rede primeiro": atualiza sozinho. E no ramo 1.7.10, quem fica com versão velha recarrega uma vez quando o host atualiza |
| R12.7 · localStorage compartilhado no `github.io` | **Risco baixo, confirmado** | Chaves com prefixo `perfil5_`/`perfil200_` e banco `PerfilJF`. A outra repo do JF (`Jogo-Perfil-HTML-JF`) é **privada**; se um dia for publicada no Pages, divide o armazenamento (e, se for versão antiga do mesmo jogo, usa as **mesmas** chaves). Some com o domínio próprio |
| R12.8 · offline comprimido em navegador velho | **Confirmado** | Usa `DecompressionStream` e já mostra "Este navegador é antigo demais (precisa de Safari 16.4+)". O site normal (sem compressão) continua abrindo |
| 4.4 · splash ainda mostra "Beta"/"Em breve"? | **Confirmado** | Mostra "🚀 Beta 1.7.9.9" e o botão "🧪 Beta · 🌐 Jogar online" (o antigo "Em breve: Multiplayer" já virou esse botão) |
| R6 · cifra como segurança | **Ok** | O texto da novidade diz que "procurar o nome da carta não acha nada". Não promete segurança. Registro como decisão consciente |

---

## 4. Estimativas (esforço e risco)

### 4.1 R1 · Migração de saves entre endereços: **médio esforço, risco médio**
**Caminho recomendado:**
1. O domínio novo (dicaos.com.br) é servido pelo **Cloudflare Pages**, na mesma conta do servidor e grátis.
   O GitHub Pages continua no `jfsouza77.github.io`, sem domínio, com uma **versão de mudança**.
2. A versão de mudança, ao abrir, mostra "O Perfil JF mudou pra DICAOS" e um botão **Levar tudo**.
   Ela empacota o save (`perfil200_state`), a memória do C.A.O.S. (o mesmo pacote do "Levar") e as preferências,
   e abre o endereço novo passando o pacote pelo `#fragmento`. O fragmento não vai pra servidor nenhum.
   Tamanho típico: 40–100 KB, dentro do que o Safari aceita.
3. O endereço novo recebe, confere (mesma validação do "Importar save") e grava.
4. **No iPhone com o app instalado:** o passo 2 roda **dentro do app antigo**. Depois a pessoa instala o novo
   na tela de início (passo a passo na tela). Plano B sempre visível: "Copiar código" e "Colar código" (o Levar/Trazer que já existe).

**O que eu preciso confirmar no aparelho real:** se o app instalado no iOS consegue abrir o endereço novo no
Safari com o fragmento intacto. Se não, o plano B cobre.
**Sem o caminho acima** (domínio no GitHub Pages), só o plano B funciona, e só **antes** de ligar o domínio.

### 4.2 R2 · Lista de salas sem nome e desligada no Júnior: **pequeno, risco baixo**
- O host para de mandar o nome; o cartão mostra "Sala ABCD · Versus · 3 jogadores".
- No Júnior, o host não se anuncia e a tela de entrar não mostra a lista (só o código).
- Esforço: poucas linhas no jogo e no Worker, mais um teste.

### 4.3 R7 · Botão "reportar carta": **pequeno, risco baixo (só com OK do JF)**
- Na Pausa ou depois do veredito: "⚑ Reportar esta carta" guarda localmente o id da carta, a dica e um motivo
  curto (errada, desatualizada, entrega a resposta).
- Na área ADM: lista com "Copiar" e "Exportar".
- Não mexe em conteúdo, não manda nada pra fora. No online, só o host/Mestre reporta (é quem sabe a carta).

### 4.4 R8 · `docs/Operacao.md`: **pequeno, sem risco**
Onde estão os segredos (nomes, nunca valores), como girar a chave da ponte (apagar o app TURN, criar outro,
trocar os 2 segredos), como republicar (push na `main` → Cloudflare Builds), como restaurar do zero, e checklist
de 2FA e códigos de recuperação (o JF faz).

---

## 5. Desenho: Narrador × Agente do modo (só desenho, nada implementado)

```
           ┌────────────── tela / celulares ──────────────┐
           │                                               │
  jogador ─┤  toque / comando ──► dispatchAction (porta) ◄─┼── AGENTE DO MODO C.A.O.S. (novo)
           │                          │                    │     · decide por sorteioRegra(semente)
           │                          ▼                    │     · só ações NOMEADAS e próprias do modo
           │                motor (regras, estado)         │       (ex.: caosAtaque, caosRoubo, caosEmbaralhar…)
           │                          │                    │     · cada ação: registrada, sobe a revisão,
           │                          ▼                    │       aparece pra mesa, desfazível pelo VAR
           │               acoesAoMudar → retrato ─────────┼──► NARRADOR (o C.A.O.S. de hoje)
           └───────────────────────────────────────────────┘     · só fala; preso à espinha SEM exceção
```

- O **Agente** é um "jogador fantasma" com permissões próprias em `redePodeComandar` (`REDE_SO_AGENTE`).
  Ele roda **só no host**. No online, os celulares só veem o efeito pelo retrato.
- As ações do Agente entram em `ACOES` com `pode()` próprio (só no Modo C.A.O.S., só no momento previsto).
  Ficam cobertas pelo replay, pelo desfazer e pelo teste macaco **de graça**, porque passam pela mesma porta.
- A espinha continua igual: as rotinas do **Narrador** não mudam o estado. O Agente **não** é rotina protegida;
  ele é um ator pela porta (como o celular de um jogador).
- **Palpite digitado (estimativa pedida, sem implementar):**
  - (a) Aliases por carta: melhor resultado; custo alto (mexe nas 1000 cartas, só com o JF); risco baixo depois de feito.
  - (b) Comparação aproximada (sem acento, sem artigo, distância de letras, nome e sobrenome): custo médio;
    risco de aceitar errado ou recusar certo ("Spider-Man" × "Homem-Aranha" não resolve).
  - (c) Veredito humano: custo baixo; depende do Mestre, e no Modo C.A.O.S. com resposta oculta até do Mestre
    não serve sozinho.
  - **Minha sugestão:** (b) com (c) de reserva no caso duvidoso. (a) entra aos poucos, carta a carta, se o JF quiser.

---

## 6. O que eu mudaria e o que não mudaria no plano do Klaus

**Concordo e faria igual:** congelamento; build interno; prova do servidor em aparelho real (ligado **e**
desligado); dois por celular; lista sem nome e sem Júnior; Operacao.md; critérios de saída escritos antes do
beta; Release com tag e saídas no GitHub Releases.

**Mudaria:**
1. **Domínio pelo Cloudflare Pages** (4.1). É o que torna a migração automática possível.
2. **Troca de host não vira "experimental".** Os testes novos da 1.7.10 acharam e consertaram os três problemas
   reais (host que volta do segundo plano, sucessor preso, últimas jogadas perdidas). Ela agora passa no teste
   com o host sumindo 30 s, no servidor nosso e no público. Eu manteria e validaria no beta.
3. **Modo C.A.O.S.: decisão do JF.** O Klaus quer separado da estabilização; o JF disse que a 1.7.10 sai com ele.
   As duas coisas cabem se o modo for a **última** ramificação da 1.7.10: primeiro estabiliza (itens 1–6 do Klaus),
   depois entra o modo, com o próprio ciclo de testes, e só então o beta fechado.

**Riscos novos que eu vi:**
- **Teste da espinha falhou uma vez na bateria do ramo 1.7.10** e passou quando rodei sozinho. Pode ser
  instabilidade do teste ou um caso raro de verdade. **Estou investigando** (faz parte do debug que o JF pediu)
  antes de qualquer outra mudança.
- **App instalado no iPhone tem armazenamento separado do Safari.** A migração (R1) e o lembrete de exportar
  (R3) precisam funcionar dentro do app.
- **CGNAT também afeta o "Salas na sua rede" pra quem está no mesmo Wi-Fi com IPv6 e IPv4 misturados.** Dois
  celulares na mesma casa podem sair por endereços diferentes e não se ver. O código continua sendo o caminho garantido.

---

## 7. Checklist pro beta com a família (JF preenche)

Marque ✅ deu certo, ❌ deu problema (anote o que aconteceu), ⏭️ não deu pra testar.

| # | Cenário | Aparelhos (quem/qual) | Resultado | Observação |
|---|---|---|---|---|
| 1 | Todos no mesmo Wi-Fi, partida inteira | | | |
| 2 | Host no 4G/5G, convidado no Wi-Fi | | | |
| 3 | Host no Wi-Fi, convidado no 4G/5G | | | |
| 4 | Celular troca de Wi-Fi pra 4G no meio da partida | | | |
| 5 | Wi-Fi que bloqueia (escola/empresa/visitante) | | | |
| 6 | Tela bloqueada na vez do Mestre (volta em < 15 s) | | | |
| 7 | Host atende ligação por ~30 s (2º Mestre assume?) | | | |
| 8 | Android com economia de bateria ligada | | | |
| 9 | Host iPhone + convidados Android | | | |
| 10 | Host Android + convidados iPhone | | | |
| 11 | Partida longa (30+ min) sem travar nem esquentar | | | |
| 12 | Sala entre cidades (Vila Velha ↔ Piúma) | | | |
| 13 | "Salas na sua rede" mostra a sala no mesmo Wi-Fi | | | |
| 14 | Entrar por QR Code | | | |
| 15 | Dois jogadores no mesmo celular convidado (quando entrar) | | | |
| 16 | Host atualiza o jogo no meio: celulares voltam sozinhos | | | |
| 17 | Todo mundo sai: a partida pausa e encerra em 2 min | | | |
| 18 | Servidor nosso desligado (eu desligo no Cloudflare): ainda conecta pelo público | | | |

---

## 8. Próximos passos que eu proponho (esperando o OK do JF)
1. Terminar o debug (espinha) e publicar o que já está pronto no ramo como **primeira ramificação da 1.7.10**.
2. Build interno (seção 2).
3. Lista sem nome + sem Júnior, teste do host com o servidor nosso desligado, `checar_servidor.js`, `Operacao.md`.
4. Dois jogadores por celular convidado.
5. Versão de mudança + Cloudflare Pages (quando o JF decidir o domínio).
6. Modo C.A.O.S. (quando o rascunho do JF estiver pronto).
7. Beta fechado com o checklist acima.
