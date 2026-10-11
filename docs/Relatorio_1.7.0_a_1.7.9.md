# Perfil JF · Relatório consolidado: da Beta 1.6.5 à 1.7.9.9 (e o plano da 1.7.10)

> Para: o Klaus original (Claude Chat), pra dar uma olhada e opinar.
> Quem escreveu: o Claude Code que trabalhou no projeto com o JF de 01/10/2026 a 10/10/2026.
> Tudo o que está aqui está no repositório `JFSouza77/Projeto_Perfil_JF`. O histórico técnico completo, uma entrada
> por versão, fica no topo de `src/html/01-cabeca.html`. A versão pra quem joga fica em `src/dados/07-novidades.js`.

---

## 0. Resumo em uma tela

- **De onde partimos:** a Beta 1.6.5, um HTML único e minificado (C.A.O.S. 3.6), sem estrutura nem testes.
- **Onde estamos:** a **Beta 1.7.9.9**, no ar no GitHub Pages:
  - código-fonte organizado em `src/` (78 partes);
  - build com quatro saídas (Mestre, debug, compacta, offline);
  - 1000 cartas com id fixo e C.A.O.S. 4.0 com "espinha";
  - tabuleiro desenhado e motor de ações com desfazer, replay e retrato;
  - **multiplayer online de verdade** (PeerJS/WebRTC, host autoritativo, troca de host, votação, QR Code, ponte TURN);
  - uma bateria de 13 testes automáticos.
- **Já pronto pra 1.7.10, ainda não publicado:**
  - servidor nosso no Cloudflare: apresenta os aparelhos, lista as salas da rede e dá a ponte TURN de 1.000 GB/mês;
  - testes de partida inteira online, de iPhone em segundo plano e de atualização no meio da partida;
  - três bugs de troca de host achados por esses testes, já consertados.
- **Próximo grande passo:** a 1.7.10 traz o **Modo C.A.O.S.** (novo modo de jogo, em rascunho com o JF),
  dois jogadores no mesmo celular convidado, o nome **DICAOS** com domínio próprio e o beta fechado com a família.

---

## 1. Regras do projeto (combinadas com o JF)

- **Jogo 100% num HTML só, rodando local.** A única exceção é o online, que fala com servidores de apresentação e ponte.
  O offline continua sendo um arquivo único.
- **Fonte oficial é `src/`.** `node montar.js` junta as partes, na ordem de `src/ordem.txt`, no *Mestre*
  (`Perfil_JF_Mestre_X.html`). `node build.js --testar --publicar` gera debug, compacta (`index.html`) e
  offline e confere tudo num navegador de verdade. **Nunca** se edita o Mestre nem as saídas à mão.
- **Cada versão é um PR para `main`**, criado e mesclado pelo Claude Code. O PR leva o SHA-256 das saídas em
  `docs/Registro_de_Versoes.md`.
- **Numeração 1.7.N.M.** Depois do .9 sobe o número do meio. Em 09/10 o JF pediu pra juntar as versões
  pequenas: hoje mudança pequena entra na próxima versão, sem número próprio. Dentro do código, os comentários
  `1.7.N.M ·` usam a numeração antiga.
- **Novidades pra quem joga:** "emoji Título: explicação" (título de até 34 letras), sem bastidores (nada de IA,
  teste ou código), com o nome de quem teve a ideia de verdade (Pedro, Felipe, Bruno Levanti, Klaus…).
- **Decisão de regra é do JF.** O Claude Code propõe, testa e implementa.
- **Chaves de save nunca são renomeadas** (`perfil200_state`, `perfil5_*`). Save antigo sempre abre.

---

## 2. Linha do tempo (o que cada série fez)

### 1.7.0 · Rebuild Update (01/10)
Mestre legível criado a partir da 1.6.5 **sem mudar o jogo**:
- índice, funções em cima, estado e dados no fim;
- funções mortas e CSS sem uso removidos;
- cartas num formato padronizado;
- validação dos dados na abertura;
- service worker e fonte embutida pra jogar offline.

A revisão do GPT entrou: Reiniciar cala o C.A.O.S., falas atrasadas presas à partida, `alert()` trocado por janela própria.

### 1.7.1 / 1.7.1.1 · House Rules, Final Round, Voices & Faces, Clean Start, Pocket, Day & Night (01–02/10)
- Mestre em 9 seções.
- **Moda da Casa:** o C.A.O.S. sorteia o modo da mesa (tabuleiro, pontos ou joias) com roleta.
- **Última rodada:** quem bateu a meta espera a rodada fechar.
- **Trava de 2 joias por rodada.**
- PWA (instala na tela de início), compartilhar resultado.
- Visual Noturno e Claro, ícone novo.
- Musiquinha de vitória e risada do C.A.O.S. (ideias do Pedro, 11 anos).

### 1.7.2 / 1.7.2.1 · Android, Family Friendly, No Mercy, Pause Menu, Owner Lock (02/10)
- Botão "instalar app" no Android; voltar do Android pausa.
- Zoeira "Family friendly" no Júnior; Hardcore sem Suave.
- Pausa com tema e voz, selo da categoria na carta.
- **Cores e emojis com dono, com cadeado:** RGB do JF, degradê Princesa da Anne.

### 1.7.3 / 1.7.3.1 / 1.7.3.2 · Cards and Rules Update (02–03/10)
- Pente fino em **todas as cartas**: dicas independentes, sem eco, sem vazamento, fatos corrigidos.
- Baralho equilibrado por categoria.
- **+400 cartas:** total de 1000, 200 por categoria (Ano, Pessoa, Lugar, Coisa, Animal).
- Regras reescritas, verso novo da carta, 200+ falas sem graça cortadas.

### 1.7.4 / 1.7.4.1 · Game Mode Update (03/10)
Auditoria modo a modo: Express, Hardcore, Júnior, Clássico e Old School.
- **Bug grave achado:** o baralho era montado equilibrado no começo, mas a compra era `deck.pop()` (pega do fim).
  A categoria maior dominava: no Júnior, Animal saía 65% das vezes.
- **Conserto:** `.reverse()` na montagem. Resultado medido: 25% por categoria.
- Express com especiais de verdade (Volte 2 = inverte, estilo UNO).
- Júnior varrido de termos de adulto; Old School com acessibilidade.

### 1.7.5 / 1.7.5.1 · C.A.O.S. and Code Update (03/10)
- **Código organizado (sugestão do Klaus):** o Mestre virou partes em `src/`, com **equivalência provada**
  (texto idêntico ao da 1.7.4.4, exceto a ordem das cartas, que não muda o jogo).
- **Gerador de falas por gatilho:** monta a fala por contexto (hora, modo, mesa, memória, humor) e não repete os
  últimos pedaços.
- **C.A.O.S. 4.0:**
  - comenta o chute do Mestre;
  - tem pensamentos espontâneos e 7 rostos de mistura de emoções;
  - ganhou estabilizador de humor (ele oscilava);
  - painel neural no ADM e ~3.400 falas prontas + ~30 mil combinações.
- **A espinha do C.A.O.S.** (seção 4) e a memória portátil (levar/trazer entre aparelhos).

### 1.7.6 / 1.7.6.1 · Buttons and Tutorial Update (03/10)
- **Acessibilidade pra todos:** letra Grande/Enorme, mais tempo, dicas em voz alta, alto contraste, menos movimento.
- **Auditoria automática dos botões:** toque ≥ 44 px, nome acessível, contraste WCAG AA.
  Antes eram 107 toques pequenos; depois, zero.
- Tutorial rápido + manual completo; o C.A.O.S. sugere o tutorial.
- Tempo extra pro Mestre que lê devagar (testado com a Isabel).
- "Como se ganha" por condição; a duração da partida conta só o tempo jogado.

### 1.7.7 / 1.7.7.1 · Foundation and Structure Update (05–08/10)
Fundação pro online:
- **Identidade:** todo jogador ganha id fixo (`j_xxxxxx`); toda carta ganha id fixo (`ANO-0001` … `ANIMAL-0200`);
  toda partida ganha `matchId`.
- **Sorteios de regra** passam por `sorteioRegra()`, com semente pra teste (mulberry32).
- **Espinha completa:** ela vigia e desfaz qualquer mudança indevida no estado.
- **Simulador:** 14 partidas inteiras automáticas.
- Revisão do GPT + Google AI Studio conferida no código.
- Tela de computador (Opera GX/Chrome).

### 1.7.8 / 1.7.8.1 · Actions and Events Update (08/10)
O motor virou "ações":
- **24 ações com nome** por cima das funções do motor. Cada ação que muda o estado sobe a `partidaRevisao`.
- **`dispatchAction(cmd)`:** a porta única que a rede usa (seção 5.1).
- **Retrato da partida** (`retratoPartida("mesa" | "mestre")`): a projeção pública nunca leva a resposta.
- **Desfazer o último veredito** (8 s), virando narração de "VAR" do C.A.O.S. na 1.7.9.2.
- **Telão** (segunda aba desenhando o retrato) e **replay** (o simulador repete as ações com a mesma semente e compara).
- **Teste macaco:** toca em botões ao acaso, confere regras e recarrega exigindo a mesma partida.

### 1.7.9 · Rooms and Network Update (09–10/10)
- **Porta das ações fechada:** a porta usa as mesmas regras da tela (descartar, desistir, mover só com a especial aberta).
- **Cartas embaralhadas na versão publicada:** o catálogo vai cifrado por substituição, sem crescer o arquivo,
  pra ninguém abrir o código e ver as respostas. O Mestre continua legível.
- **Tabuleiro de verdade** (1.7.9.1):
  - SVG com 100 casas, 10 formas (Oito, Serpente, Espiral, Oval, Labirinto…) e tema por modo;
  - peões andam casa por casa;
  - **lobby entre as cartas** com abas Tabuleiro, Pontos (pódio + corrida de barras) e Joias (coroa com encaixes);
  - zoom, régua, e o C.A.O.S. comenta o tabuleiro.
- **Joias com formato próprio** (hexágono, esmeralda, losango…) e **VAR do C.A.O.S.** (1.7.9.2).
- **A rede**, da 1.7.9.2 à 1.7.9.9: seção 5.

### 1.7.9.3 a 1.7.9.9 · O online amadurecendo, com testes do JF em aparelhos reais
| Versão | O que motivou | O que entrou |
|---|---|---|
| 1.7.9.3 | Fim da 1.7.9 original | PeerJS de verdade, troca de host (2º Mestre assume), ponte TURN grátis, tela acesa, manual do online, tela de carregamento no iPhone |
| 1.7.9.4 | 1º teste real: a Anne era Mestre no tablet e o celular do JF (host) mostrava a resposta | Host vira "tela de jogador" quando o Mestre está em outro aparelho; sala antes do cadastro |
| 1.7.9.5 | 2º teste: a Mestre no tablet via só um resumo; Reiniciar deixava o tablet preso | Carta de verdade no celular do Mestre; reconexão depois de reiniciar; host que volta e acha outro host vira jogador |
| 1.7.9.6 | Pedidos do JF: abrir a sala no caminho, cada um criar o próprio jogador, só o Mestre abrir dicas, o C.A.O.S. falar em todos os celulares | "Vai jogar online?", entrar por código, **aceite do host**, cadastro no celular com as mesmas cores e emojis, falas do C.A.O.S. nos celulares (as particulares só pro dono) |
| 1.7.9.7 | "Procure falhas e brechas" | Revisão de segurança: nome limpo, limite de 25 mensagens/s, pedidos com limite e validade, o convidado limpa o que recebe |
| 1.7.9.8 | "O que mais pode dar bug? Gente por perto? 4G + Wi-Fi?" | QR Code, selo direta/ponte com o atraso, tirar da sala, **bug de código repetido** (a sala nova caía na sala dos outros) |
| 1.7.9.9 | "Se todo mundo sai, a partida tem que acabar" e "a Isabel joga no meu celular" | Partida online sem ninguém de fora é encerrada; vários jogadores no aparelho do host, cada um votando |

---

## 3. Como o código está organizado

```
src/
  html/      01-cabeca (histórico + <head>), 02-corpo, 03-fim
  css/       01..10 (base, telas, botões acessíveis, computador, tabuleiro, rede…)
  js/        01-configuracao … 05k-rede (o online), 05l-peerjs (PeerJS 1.5.5 embutido, MIT),
             05m-qrcode (qrcode-generator 2.0.4, MIT), 06-voz-som, 07-caos/ (11 partes), 08-salvamento, 11-iniciar
  dados/     cartas por categoria, falas, léxico, tutorial, novidades, geradores do C.A.O.S.
  ordem.txt  a ordem em que montar.js junta tudo
ferramentas/ testes e auditorias (seção 7)
servidor/    o servidor da sala no Cloudflare (seção 6)
docs/        roteiros, registro de versões, mapas (CAOS_Cerebro.md, Estado_da_Partida.md, Roteiro_Multiplayer.md…)
```

---

## 4. O C.A.O.S. e a espinha (as 3 leis)

O C.A.O.S. é o "apresentador" com personalidade: ~3.400 falas, um gerador por gatilho, 10 núcleos de emoção que
se misturam (magoado, saudade…), memória de cada jogador entre partidas e um temperamento que depende do nível de zoeira.

O JF pediu que ele fosse **"caótico leal, autônomo sem consciência, blindado"**. Daí a **espinha**
(`src/js/07-caos/11-espinha.js`), com 3 leis:

1. **Nunca mexe no jogo.** Antes de cada rotina protegida, uma foto do estado de regra (placar, casas, joias,
   palpites, vez, dicas abertas, rodada…). Depois, se algo mudou, a espinha desfaz e registra.
   Relógios seguem a regra "pode dar tempo, nunca tirar".
2. **Nunca fala o que a mesa proibiu** (filtros por nível de zoeira e pelo 👎).
3. **Nunca trava a partida.** Erro dentro do C.A.O.S. vira "nada" e fica registrado.

Um teste dedicado (`caos_teste_espinha.js`) usa uma rotina falsa que mexe em tudo e confere que a espinha desfaz tudo.

---

## 5. O multiplayer online

### 5.1 A ideia central: host autoritativo + porta única
Um aparelho é o **host**: tem a partida e roda o motor. Os outros são **convidados**: recebem um "retrato" e mandam
**comandos**. O host confere quem mandou e se a pessoa pode fazer aquilo, e só então passa pela mesma porta que a
tela usa:

```js
// src/js/05g-acoes.js — a porta única (a tela e a rede passam por ela)
function dispatchAction(cmd) {
  const def = ACOES[c.type];
  if (!def) return { ok: false, motivo: "acao_desconhecida" };
  if (c.matchId !== undefined && c.matchId !== matchId) return { ok: false, motivo: "partida_errada" };
  if (acoesComandosVistos.includes(c.commandId)) return { ok: true, duplicado: true };   // repetido não aplica 2x
  if (c.expectedRevision !== undefined && c.expectedRevision !== partidaRevisao)
    return { ok: false, motivo: "revisao_obsoleta" };                                    // tocou numa tela velha
  if (!def.pode.apply(null, dados)) return { ok: false, motivo: "fora_de_hora" };       // mesma regra da tela
  window[def.fn].apply(null, dados);                                                     // a função de sempre
  ...
}
```

```js
// src/js/05k-rede.js — quem pode o quê (o host decide pela sessão, nunca pelo que o celular diz)
function redePodeComandar(acao, jid) {
  if (REDE_SO_HOST.includes(acao)) return false;        // tempo, ADM, encerrar: só o host
  if (REDE_QUALQUER_UM.includes(acao)) return true;     // pausar/continuar
  const ehMestre = jogadorIdDe(mestreIndex) === jid;
  if (REDE_SO_MESTRE.includes(acao)) return ehMestre;   // virar carta, veredito, descartar…
  if (acao === "escolherDica") return ehMestre;         // regra do JF: só o Mestre abre a dica
  ...
}
```

### 5.2 Privacidade
- O retrato público **nunca** leva a resposta nem o id da carta (o id entregaria a resposta, porque o catálogo está no jogo).
- A resposta vai num envelope "segredo" **só pro celular do Mestre**. Ele apaga quando a carta acaba ou deixa de ser Mestre.
- O convidado, na versão publicada, **nem desembaralha o catálogo**: tem 0 cartas na memória.

### 5.3 Transporte
- PeerJS (WebRTC). O host é um Peer com o id `perfiljf-sala-<código>`.
- Cada convidado abre uma conexão, que fica presa à primeira sessão que falou por ela (ninguém se passa por outro).
- Toda mensagem tem envelope `{p, t, sala, de, seq}` e é validada: formato, protocolo, sala, sessão, tipo,
  conteúdo, tamanho e repetida/velha. Tem também limite de ritmo.
- **Ponte TURN:** pra quem está no 4G e não consegue ligação direta. Hoje usa pontes gratuitas; na 1.7.10, a do Cloudflare.

### 5.4 Entrada na sala (1.7.9.6)
Jogar → formato → modo → "Vai jogar online?" → código de 4 letras (sem I/O) + QR Code.

O convidado digita o código ou abre o link, cria o próprio jogador **com as mesmas peças do cadastro do host**
(cores com dono, emojis exclusivos, zoeira) e **espera o host aceitar**. Aparelho aceito volta sozinho depois.

### 5.5 Troca de host (regra do JF: "o 2º Mestre assume, depois o 3º…")
- O host escolhe o **sucessor**: o próximo da ordem dos Mestres que está online e não é o próprio host.
- Só pro sucessor, ele manda um **pacote de recuperação** com o save inteiro.
- Se o host some por 15 s, o sucessor grava o pacote, recarrega como host e reabre **a mesma sala**.
  Os outros se reconectam sozinhos.
- O host antigo que volta percebe que já tem host e entra como jogador.

### 5.6 Regras de sala do JF (1.7.9.9)
- Partida online em que todo mundo de fora saiu: em 45 s o jogo pausa e avisa; ninguém voltou em 2 min,
  a partida é **encerrada** (sem "continuar sozinho").
- Fechar a sala no meio também encerra.
- App reaberto com partida online salva e sem sala: encerrada.
- Vários jogadores podem dividir o aparelho do host (a Isabel no celular do JF). Cada um vota.
  O host continua sendo o aparelho que abriu a sala, não uma pessoa.

---

## 6. Pronto pra 1.7.10 (no ramo `online-1-7-10`, ainda não publicado)

### 6.1 Servidor nosso no Cloudflare (decisão do JF)
**Por que Cloudflare:** o Render grátis "dorme" (leva ~1 min pra acordar) e o Fly não tem mais plano grátis.
No Cloudflare, uma conta grátis cobre tudo, e a ponte TURN tem **1.000 GB/mês** grátis (o Metered dá 20 GB).

`servidor/worker.js` é um **Worker + Durable Object** com hibernação de WebSocket (não gasta nada parado).
Ele faz três coisas:
1. **Apresenta os aparelhos:** é compatível com o protocolo do PeerJS 1.5 (OPEN, OFFER, ANSWER, CANDIDATE,
   EXPIRE, ID-TAKEN).
2. **Lista as salas da mesma rede:** agrupa pelo IP público (IPv6 pelo /64). Na tela de entrar aparece
   "📶 Salas na sua rede". O host ainda precisa aceitar.
3. **Entrega a ponte TURN do Cloudflare:** gera credenciais de 24 h. A chave fica só nos segredos do Worker,
   nunca no jogo.

```js
// servidor/worker.js — o mesmo id chegando de novo: aparelho voltando (mesmo token) ou que sumiu (20 s sem
// batida) é substituído; outro aparelho vivo = id ocupado (o jogo trata: troca o código ou entra como jogador)
for (const ws of this.ctx.getWebSockets(id)) {
  const a = ws.deserializeAttachment();
  if (!a || a.morto) continue;
  if (a.token === token || Date.now() - a.visto > MORTO_MS) { ws.serializeAttachment({ ...a, morto: true }); ws.close(1000, "substituido"); }
  else return recusar("ID-TAKEN", "ID is taken");
}
```

**O público continua de reserva.** O host abre a sala nos dois servidores; o convidado tenta o nosso e, se não
achar, o público. Se a conta parar, o jogo continua funcionando como antes.

Está no ar em `perfil-jf-sala.joaofe0000.workers.dev`, conferido pelo JF: a página responde e `/ponte` devolve
`turn.cloudflare.com` com credenciais.

### 6.2 Testes que faltavam (`ferramentas/teste_online.js`)
Rodam com 3 aparelhos (host + 2 celulares), pela internet de verdade:
- **Partida inteira até o fim** em Versus Clássico, Equipe (2×2, um jogador dividindo o aparelho do host) e Express.
  Cada aparelho joga sozinho pelo painel que o host calcula. Confere que o placar dos celulares bate com o do host
  e que nenhum retrato vazou a resposta.
- **iPhone em segundo plano:**
  - celular pausado 8 s;
  - o iOS matando a página e o link aberto de novo;
  - host pausado 6 s e 30 s.

  Detalhe técnico: o Chromium não congela página com WebRTC aberto, então a "suspensão" é feita pausando o
  JavaScript pelo depurador, precedida do `visibilitychange` que o iOS dispara.
- **Host atualiza o jogo no meio:** os celulares com versão velha recarregam sozinhos uma vez e voltam pro mesmo
  lugar. Host mais velho que o celular: o celular avisa que quem precisa atualizar é o host.

### 6.3 Bugs que esses testes acharam (consertados)
1. **Host que volta depois de o 2º Mestre assumir continuava achando que era host**, numa sala vazia, porque a
   biblioteca dizia "conectado". Agora, quando a batida de 4 s atrasa mais de 12 s, o host sabe que esteve
   parado e **pergunta ao servidor quem está com a sala**:
   - outro aparelho → vira jogador, direto no próprio jogador, com uma identidade pré-aprovada no pacote de recuperação;
   - ninguém → reabre a sala;
   - ele mesmo → segue.
2. **Sucessor assumindo enquanto o host antigo voltava ficava preso** tentando pegar a sala. Agora, a cada 3ª
   tentativa, ele pergunta se o host voltou; se voltou, desiste (nada se perde, porque sem host ninguém mexeu na partida).
3. **O pacote de recuperação saía no máximo a cada 3 s**, e as últimas jogadas antes do host ir pro segundo plano
   se perdiam. Agora sai no máximo 1 por segundo, com um envio atrasado no fim da janela e outro na hora em que o
   host vai pro segundo plano (`visibilitychange`/`pagehide`).

```js
// src/js/05k-rede.js — o host voltou do segundo plano: quem está com a sala?
function redeHostVoltouDoFundo() {
  redeSondar(rede.sala, rede.modo, (existe, quem) => {
    if (existe && quem && quem !== rede.sessao) return redeHostRebaixar(); // outro assumiu: viro jogador
    if (!existe) t.reabrir();                                               // o servidor me soltou: abro de novo
  });                                                                       // fui eu que respondi: sigo host
}
```

---

## 7. Como a gente se protege de bug (a bateria)

Toda versão passa por esta bateria, rodada em sequência (testes pesados em paralelo dão falso erro):

| Teste | O que confere |
|---|---|
| `build.js --testar` | Mestre, debug, compacta e offline abrem, começam partida e abrem dica sem erro no console |
| `teste_rede` | ~150 conferências: no mesmo aparelho, pela internet (servidor local), só pela ponte TURN, sala primeiro, troca de host, colisão de código, partida órfã, servidor nosso + reserva |
| `teste_online` | Partidas até o fim (3 modos), segundo plano, atualização do host |
| `teste_acoes` | As 24 ações, retrato, desfazer, porta |
| `teste_identidade` | ids, save antigo, sorteio com semente, importar save |
| `teste_telao` | Telão em duas abas |
| `caos_teste_espinha` / `_geradores` / `_estresse` | As 3 leis, o gerador de falas e as emoções sob estresse |
| `auditar_cartas` | 1000 cartas: formato, ids únicos, vazamentos |
| `auditar_botoes` | Toque ≥ 44 px, nome acessível, contraste, texto vazando (letra Enorme) |
| `simular_partidas --replay` | Partidas inteiras automáticas e repetidas pela porta: mesmo estado final |
| `teste_macaco` | Toques ao acaso em vários cenários e recargas exigindo a mesma partida |

---

## 8. Decisões que o JF tomou (pra referência)
- PeerJS como transporte. **TURN** pra 4G + Wi-Fi.
- **Cloudflare** pro servidor (conta do JF criada em 10/10).
- No online, só o host segue o intervalo entre as cartas.
- **Descartar e Desistir viram votação** da mesa (maioria, 20 s, empate não passa).
- **Só o Mestre abre as dicas**; quem está na vez fala o número.
- **Troca de host:** o 2º Mestre assume, depois o 3º…
- Partida online sem ninguém de fora **é encerrada**.
- **Dois jogadores num celular convidado: SIM**, na 1.7.10 (decidido em 10/10).

---

## 9. Plano da 1.7.10 (não lançada ainda)
1. **Modo C.A.O.S.:** o novo modo de jogo. O JF vai rascunhar com GPT, Gemini e Google AI Studio antes.
   Nada implementado ainda.
2. **Dois jogadores no mesmo celular convidado:** o convidado escolhe mais de um nome, e a tela segue a vez.
3. **Ligar o servidor nosso:** já está no código do ramo, testado localmente. Falta a prova com aparelhos de verdade.
4. **Nome DICAOS, domínio próprio** e mudança de endereço sem perder save nem memória do C.A.O.S.
5. **Beta fechado com a família**, em celulares de verdade, no Wi-Fi e no 4G/5G.
6. Tirar o aviso "Em breve: Modo Multiplayer" da abertura.

## 10. Perguntas abertas que valem uma segunda opinião
- **Modo C.A.O.S.:** como encaixar um modo novo sem quebrar a espinha? Ela proíbe o C.A.O.S. de mexer no jogo.
  Um modo em que ele *interfere* nas regras precisa de ações próprias pela porta, não de exceções na espinha.
- **Lista de salas pela rede:** no 4G, operadoras usam o mesmo IP público pra muita gente (CGNAT), então
  estranhos podem ver o código da sala. O aceite do host protege, mas vale pensar se a lista mostra o nome do host.
- **Troca de host com o servidor público:** ele segura o id de um aparelho sumido por até ~90 s. Com o nosso, 20 s.
  O comportamento final está certo nos dois (um host só, nada perdido), mas no público a troca demora mais.
- **Quem divide o aparelho do host:** se o host cai e o 2º Mestre assume, quem dividia o aparelho com ele
  (a Isabel) fica sem aparelho até o host voltar como jogador. Hoje cada aparelho convidado tem um lugar só;
  com o item 2 da 1.7.10 isso se resolve.
