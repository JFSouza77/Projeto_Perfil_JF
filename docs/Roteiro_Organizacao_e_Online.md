# Perfil JF — Roteiro de Organização do Código e Multiplayer Online

**Última atualização:** 03/10/2026 às 08:52 (horário de Brasília, pelo servidor)
**ORIGEM:** Claude (chat do Projeto Perfil) · **MOTIVO:** a pedido do JF
**Destinatário:** Claude Code (análise). GPT e Gemini podem ler como contexto.
**Base da leitura:** repositório `jfsouza77/Projeto_Perfil_JF` na versão **1.7.0**. O jogo já está na **1.7.4** (C.A.O.S. 3.8). Tudo que cita linhas, funções ou estrutura interna precisa ser **revalidado contra a 1.7.4** antes de qualquer decisão.

---

## 0. Pedido ao Claude Code

**Só análise. Não alterar código, cartas, falas nem arquivos do repositório.**

Devolver:
1. Mapa real da estrutura da 1.7.4 (seções do Mestre, onde ficam estado, motor, render, timers, voz, save).
2. Para cada item deste roteiro: **confirmado / divergente / não confere**, com o motivo.
3. Riscos que este roteiro não previu.
4. Discordâncias e alternativas (discordar é bem-vindo).
5. Lista das **perguntas que dependem do JF** (regra de jogo = decisão dele, nunca chutar).

Classificar cada achado: bug real / decisão consciente / melhoria futura / regra em aberto.

Regras do projeto que valem aqui: o Claude (arquiteto-chefe) tem a palavra final sobre o código; nomes de função/variável só podem ser citados se confirmados no arquivo real; o conteúdo das cartas não é mexido sem pedido do JF; o C.A.O.S. nunca pontua nem muda turno ou estado.

---

## 1. Decisões já tomadas pelo JF (não reabrir sem motivo novo)

- O jogo deve funcionar **online** em Wi-Fi e 5G, **entre cidades e estados diferentes** (ex.: Vila Velha ↔ Piúma).
- **Express continua 100% offline.** Os demais modos podem ter versão online (Clássico, Hardcore, Old School, Júnior; Equipe e demais a decidir, ver 3).
- O jogo **continua funcionando offline** como hoje. O online é um acréscimo, nunca um requisito.
- **O host manda em tudo.** Os outros aparelhos enviam apenas **intenções**; quem decide é o host.
- Convidados veem a **carta virada** e só as dicas que foram pedidas/reveladas. A resposta nunca vai para quem está chutando.
- **C.A.O.S. fala em cada aparelho**, como se fosse um jogador junto de todos. Cada pessoa silencia o próprio aparelho se quiser.
- **Trapaça entre amigos é aceitável**, mas qualquer bloqueio razoável é bem-vindo.
- A regra de "arquivo único" foi **reinterpretada**: o produto final continua sendo um HTML autocontido; o código-fonte pode ser dividido e montado pelo build.
- Versão de referência no momento da conversa: 1.7.1.2 → hoje 1.7.4.

---

## 2. PARTE A — Organização do código (Fase 0, antes do online)

**Objetivo:** deixar o projeto leve e legível para humanos e IAs, **sem mudar o jogo**.

### 2.1 Diagnóstico (da leitura da 1.7.0)
- `Perfil_JF_Mestre_X_Y_Z.html` é a fonte real: ~44,5 mil linhas, ~2 MB, um `<style>` e um `<script>`.
- ~40% do JS são as cartas (`ADULT_CARDS`, perto de 16 mil linhas) e ~7,5 mil linhas são falas do C.A.O.S. (`REACTIVE_VOICE`). O resto é lógica (~680 funções), com estado em variáveis globais e alguns `onclick` inline.
- `build.js` gera debug, compacta e offline a partir do Mestre; valida sintaxe e contagens; `--testar` roda um roteiro no navegador. **Isso é bom e deve ser preservado.**
- O build **só reconhece versões com 3 números** (`X_Y_Z`). Versões de 4 números (1.7.1.2) exigem ajuste (ver 2.5).
- Cada versão gera 5 HTMLs grandes no repositório (~7 MB).

### 2.2 Estrutura proposta (hipótese, validar)
```
src/
  index.template.html     (esqueleto + marcadores de inclusão)
  css/                    (partes do CSS, ordem numerada)
  js/
    00-config.js          (constantes, versão, DEBUG)
    10-estado.js
    20-motor.js           (regras: dicas, pontos, bônus, joias, modos)
    30-render.js
    40-timers-pausa-save.js
    50-caos-engine.js     (lógica do C.A.O.S.)
    60-voz.js
    90-init.js
  dados/
    cartas/ano.js, pessoa.js, lugar.js, coisa.js, animal.js ...
    falas/*.js            (REACTIVE_VOICE por família)
fontes/                   (Baloo 2, como já está)
build.js                  (monta o Mestre/saídas a partir de src/)
docs/                     (Documento Mestre, status, changelog, este roteiro)
```
- **Sem ES modules.** O jogo usa funções globais (`onclick` inline, strings que referenciam nomes). O build deve **concatenar em ordem**, mantendo tudo no escopo global, exatamente como hoje.
- Os nomes dos arquivos acima são sugestão. O Claude Code define a divisão real depois de mapear o código.

### 2.3 Regra de ouro da migração: **equivalência provada**
A reorganização só vale se o resultado for **idêntico em comportamento**:
1. Gerar o Mestre a partir de `src/` e comparar com o Mestre da 1.7.4 (idealmente byte a byte; se não der, mesmas contagens + mesmo JS depois de normalizar).
2. `build.js` deve passar nas validações que já existem (sintaxe, contagem de cartas/entradas/falas, `--testar`).
3. Só então o `src/` vira a fonte oficial.
4. Trabalhar em **branch separada**, com o Mestre antigo preservado até a aprovação do JF.

### 2.4 Higiene do repositório
- Não versionar saídas geradas que não são publicadas: `*_debug.html` (e talvez `*_offline.html`). Manter `index.html` (GitHub Pages). Oferecer o offline em **Releases**.
- Criar `docs/` com Documento Mestre, status e changelog em Markdown, para IAs lerem sempre a versão atual (o repositório é público).
- `README.md` curto (o que é, como rodar o build, como publicar).
- Commits com mensagem descritiva (formato do changelog do projeto: versão, origem, motivo, mudança).
- `CHANGELOG.md` no repositório.

### 2.5 Esquema de versão
- Definir: 3 números (`1.7.4`) ou 4 (`1.7.1.2`), e o que cada número significa.
- Ajustar `build.js` para aceitar o esquema definido: `acharMestre()`, o `sort` e o `main()`. Hoje a regex captura só 3 números e as saídas podem sobrescrever as da versão anterior.
- Avisar quando o nome do arquivo e o carimbo de versão dentro do HTML divergirem.

### 2.6 Testes
- Manter `--testar` (Playwright).
- Sugerido: script de validação das cartas com as regras do documento "Regras de criação de cartas" (vazamento de resposta, eco, 20 entradas, especiais). **Só reporta; não corrige conteúdo.**
- Quando o online existir: roteiro de teste com host + 2 convidados simulados.

### 2.7 Riscos da Parte A
- Quebrar dependência de ordem entre blocos globais ao dividir o JS.
- O minificador (`terser`, `toplevel: false`) depende de globais não serem renomeadas; manter.
- Mudar o formato das cartas por acidente (proibido nesta fase).

**Critério de pronto da Fase 0:** build novo gera saídas equivalentes às da 1.7.4; testes passam; JF aprova a branch.

---

## 3. PARTE B — Multiplayer online

### 3.1 Decisões em aberto (**do JF**)
1. **Modos online:** Clássico, Hardcore, Old School, Júnior. E **Equipe, Versus e Aleatório**? Express fica offline.
2. **Aceita uma conta em serviço externo (plano gratuito)?** Isso decide a arquitetura (ver 3.3). Com isso o jogo deixa de ser "sem backend" no modo online.
3. **Jogadores por sala:** limite mínimo/máximo (hoje o Clássico vai de 2 a N; Equipe exige exatamente 4 ou 6).
4. **Papel de Mestre:** continua em rodízio fixo (regra atual), agora em aparelhos diferentes. Confirmar.
5. **Espectadores:** pode entrar alguém só para assistir?
6. **Quando o host cai:** a partida morre, pausa até voltar, ou passa o host para outro? (Recomendação inicial: pausa e retoma; passar o host é complexo.)
7. **Júnior online:** crianças. Recomendação: **sem chat livre e sem dados pessoais** trafegando. Confirmar.
8. **Salvar partida online:** o "Save de Bolso" (Base64) vale para partida online?
9. **Joias no Modo Caos** (ver 3.10): o JF não gosta de perder joia. Roubo/destruição de joia só no Modo Caos, separado? Decisão dele.

### 3.2 Papéis e builds
- **Host:** roda o jogo completo, o mesmo motor de hoje. É a única fonte da verdade.
- **Convidado/controle:** tela leve, **sem as cartas e sem as falas**, só interface + conexão. Sugestão: **mais uma saída do `build.js`** (ou `?modo=controle`). Assim a resposta não está no código do celular de quem chuta.
- **Mestre da rodada** (papel de turno, não de aparelho): o aparelho que for o Mestre recebe a **resposta da carta atual**, enviada pelo host naquele momento.
- **Limite honesto:** a página principal continua pública, então quem abrir o site do host pode ler as cartas no código. Isso só se reduz, não se impede, sem servidor guardando as cartas.

### 3.3 Transporte (como os aparelhos se falam)
Requisito do JF: funcionar em Wi-Fi, 5G e cidades diferentes.

| Opção | Funciona em 5G/entre cidades | Backend | Observação |
|---|---|---|---|
| **A. Relay em tempo real** (Firebase Realtime, Supabase Realtime, Ably, ou similar) | Sim | Serviço externo (plano grátis) | Mais estável; aguenta reconexão; **recomendada** |
| **B. P2P WebRTC com servidor TURN** (PeerJS/Trystero + TURN) | Sim, só com TURN | Sinalização + TURN externos | Sem TURN falha com frequência em 4G/5G (NAT de operadora); host caindo derruba tudo |
| C. P2P puro com STUN | **Não é confiável** fora da mesma rede | Sinalização pública | Serve só como teste |

- **Recomendação:** A, com a camada `Net` desenhada para o serviço ser **trocável**.
- **Não decidir por opinião:** a Fase 1 testa as opções em cenários reais (ver 3.11).
- Limites e preços dos planos gratuitos mudam: **verificar nas páginas oficiais** na hora de escolher. Não confiar em números de memória.
- As chaves públicas do cliente ficam visíveis no código; configurar regras de acesso do serviço para limitar o dano.

### 3.4 Camada `Net` (isolada)
Interface mínima, independente do serviço:
- `criarSala()` → código curto
- `entrarSala(codigo, nome, token?)`
- `enviar(para, mensagem)` / `transmitir(mensagem)`
- `aoReceber(callback)`
- `estado()` → conectado / reconectando / caiu
- `sair()`

Regras:
- `Net` **não mexe no DOM nem no estado do jogo.** Ela recebe, valida o envelope e **chama funções que o motor já tem**.
- Se `Net` falhar ou não existir, o jogo local **segue funcionando** (Express e modo offline não dependem dela).
- Nenhum nome de função do motor é citado aqui: o Claude Code mapeia quais ações do motor (revelar dica, marcar acerto/erro, aplicar especial, descartar, etc.) existem de verdade e como chamá-las sem passar pela interface.

### 3.5 Protocolo de mensagens
Envelope comum: `{ v, sala, de, seq, tipo, dados }` (`v` = versão do protocolo; `seq` para ordenar e descartar duplicadas).

**Convidado → Host (intenções):**
- `ENTRAR` (nome, cor/avatar, humor, token de reconexão)
- `PEDIR_DICA` (número)
- `CHUTAR` (texto, no modo que usar texto)
- `PASSAR` / `DESCARTAR` / ações de turno
- `MARCAR` (acerto/erro, só vindo do Mestre)
- `USAR_FICHA_PALPITE`
- `PING`

**Host → Convidados:**
- `ESTADO` (visão filtrada pelo papel de cada um)
- `DICA` (texto revelado)
- `RESULTADO` (acerto/erro, pontos, posição, joias)
- `CAOS_FALA` (id da fala, texto final, parâmetros de voz)
- `RELOGIO` (referência de tempo) e `TIMER` (prazo)
- `PAUSA` / `RETOMAR` / `FIM`

O host **valida tudo**: o remetente é quem deveria agir naquela vez? A intenção é válida no estado atual? Se não, ignora (e pode avisar).

### 3.6 Quem vê o quê
| Informação | Host | Mestre | Quem chuta/vez | Demais |
|---|---|---|---|---|
| Resposta da carta | sim | **sim** | **não** (só após resolvida) | não |
| Dicas ainda não reveladas | sim | sim | não | não |
| Dicas reveladas | sim | sim | sim | sim |
| Categoria e carta virada | sim | sim | sim | sim |
| Placar, posições, joias, fichas | sim | sim | sim | sim |

### 3.7 Tempo
- O host é a **referência de relógio**. Cada aparelho calcula a diferença entre o seu relógio e o do host por troca de pings (estilo NTP simples).
- Timers continuam baseados em prazo absoluto (como hoje), agora em **tempo do host**.
- Não depender de relógio externo.
- Pausa automática (tela fora de foco) precisa de regra clara online: pausa só o aparelho, ou a partida inteira? **Decisão do JF.**

### 3.8 C.A.O.S. online
- O **host sorteia a fala uma vez** (para o mesmo comentário não sair diferente em cada celular) e transmite id + texto + parâmetros de voz.
- Cada aparelho fala localmente com a voz dele; botão de mudo individual.
- Falas que mandam o **Mestre** fazer algo ficam só escritas (regra atual).
- Memória anti-repetição e humor por jogador continuam **no host**.
- O C.A.O.S. continua sem pontuar nem mudar estado: o motor decide, emite o evento, o C.A.O.S. reage.
- Cuidado: o tom/voz depende do aparelho (no iOS só aparecem algumas vozes). Não prometer voz idêntica em todos.

### 3.9 Conexão e resiliência
- **Reconexão** por nome + token guardado no aparelho.
- **Wake Lock** para a tela não apagar (e aviso se o navegador não suportar). Celular que bloqueia a tela derruba conexão em muitos navegadores, especialmente iOS: **testar**.
- Heartbeat e detecção de queda; estado visível ("reconectando…").
- Nomes duplicados, sala cheia, sala inexistente, host ausente: mensagens claras.
- Salas com **código curto aleatório**, que expiram.
- Mensagens fora de ordem ou duplicadas: usar `seq`.
- Dois ataques/intenções ao mesmo tempo: o host **enfileira** e trava a rodada no primeiro que chegar.
- Escape de nomes no HTML (hoje o nome do vencedor entra sem escape na tela final; online isso vira risco de verdade, pois o nome vem de outro aparelho).

### 3.10 Modo Caos / "No Mercy" (fase final)
Proposta original (Gemini + JF): resposta oculta até do Mestre; PvP de roubo de joias; palpite digitado; C.A.O.S. dá o veredito por voz.

Problemas a resolver **antes** de desenhar:
- **Comparação de texto:** normalizar acentos/caixa não basta ("Messi" × "Lionel Messi", "Homem-Aranha" × "Spider-Man", "Tony Stark" × "Homem de Ferro"). Opções: (a) **aliases por carta** (altera o conteúdo das cartas, **só com pedido explícito do JF**); (b) comparação aproximada; (c) o veredito continua humano em casos duvidosos. O Claude Code deve estimar custo de cada uma.
- **Joias:** regra de jogo do JF (ver 3.1.9). Não implementar sem decisão.
- Existe como **modo separado**, nunca alterando os modos atuais.
- A mecânica de palpite digitado serve também aos outros modos no futuro, mas é decisão à parte.

### 3.11 Fases, entregáveis e critério de pronto

**Fase 0 — Organização (Parte A).** Pronto: build equivalente, testes passando, JF aprovou.

**Fase 1 — Teste de conexão (página separada, sem tocar no jogo).**
- Host + 2 convidados trocando mensagens e medindo.
- Cenários: (1) mesma Wi-Fi; (2) 5G; (3) duas cidades (ex.: Vila Velha ↔ Piúma), com iPhone e Android; (4) tela bloqueada e reconexão.
- Medir: tempo para conectar, latência, taxa de sucesso, comportamento ao bloquear a tela.
- Comparar transportes A e B. **A escolha final sai daqui.**
- Pronto: decisão de transporte documentada com dados.

**Fase 2 — Camada `Net`, protocolo e build do controle.**
Pronto: host e convidado conversam dentro do jogo (lobby, entrar na sala, ver o placar), sem partida ainda.

**Fase 3 — Clássico online (2 e 3 jogadores).**
Pronto: uma partida completa entre aparelhos, com resposta visível só ao Mestre, timers sincronizados e C.A.O.S. falando em todos.

**Fase 4 — Demais modos:** Hardcore, Old School, Júnior (com regras de privacidade), depois os formatos Equipe/Versus/Aleatório conforme decisão do JF.

**Fase 5 — Modo Caos / No Mercy.**

**Fase 6 — Polimento:** reconexões raras, mensagens de erro, acessibilidade, desempenho em aparelho fraco (Modo Batata).

### 3.12 O que **não** fazer
- Não refatorar o motor "de passagem" durante o online. A Parte A vem antes e é separada.
- Não mexer em conteúdo de cartas ou falas sem pedido do JF.
- Não fazer o Express depender de `Net`.
- Não quebrar o offline nem o service worker (ele já ignora outros domínios; manter assim e **não** cachear tráfego da sala).
- Não enviar a resposta da carta para aparelhos que não são o do Mestre.
- Não colocar dados pessoais de crianças em serviço externo.

### 3.13 O que eu **não consegui verificar** (o Claude Code deve checar)
- Estrutura interna da 1.7.4 (li a 1.7.0, e só o conteúdo do `build.js`, do `sw.js` e a estrutura do Mestre).
- Quais ações do motor podem ser chamadas sem passar pela tela.
- Limites e regras atuais dos planos gratuitos dos serviços citados.
- Comportamento real de iOS/Safari com conexões em segundo plano e tela bloqueada.
- Compatibilidade do offline-comprimido (`DecompressionStream`) com o fluxo online.
