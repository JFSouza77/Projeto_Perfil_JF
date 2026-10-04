# Roteiro até a 1.7.10 · Multiplayer Update

**Base:** versão 1.7.6.7, conferida no código em 04/10/2026.
**Origem:** junção de duas análises, a pedido do JF:
- **GPT:** "Auditoria estratégica do Perfil" (30 itens e checklist de 18 bloqueadores);
- **Claude:** "O que falta antes da 1.7.10" (plano 1.7.7 → 1.7.9) e a validação da análise do GPT contra o código.

**Regra deste roteiro:** ele descreve o código que existe, não o que gostaríamos que existisse. Cada item traz a versão em que foi conferido.

**Legenda:**
- 🟢 feito e verificado
- 🟡 parcial
- 🔴 não existe
- 🔵 decisão pendente (do JF)
- ⚠️ risco conhecido

**Este documento substitui** o `Roteiro_Organizacao_e_Online.md` (escrito sobre a 1.7.0) como referência de planejamento. O arquivo antigo fica como histórico. O `Status_do_Roteiro.md` continua com as decisões do JF.

---

## 1. Nomes das updates

| Versão | Nome | Em uma frase |
|---|---|---|
| **1.7.7** | **Foundation Structure Update** | Fortalecer o que já existe: identidade dos jogadores, da partida e das cartas, espinha mais completa, mapa dos sorteios, documentação e simulador. |
| **1.7.8** | **Actions and Events Update** | Preparar o motor pra receber pedidos e anunciar acontecimentos: ações, eventos, snapshot, filtro por papel e "online de mentira" com duas abas. |
| **1.7.9** | **Rooms and Network Update** | Construir a rede: salas e código da sala, protocolo, reconexão, troca de host, relógio sincronizado, versão igual em todos os aparelhos e beta fechado. |
| **1.7.10** | **Multiplayer Update** | Lançar o online, o nome DICAOS e o domínio próprio, com a mudança de endereço (save e memória). |

Os nomes seguem o padrão "X and Y Update" das versões anteriores (Cards and Rules, C.A.O.S. and Code, Buttons and Tutorial).

**Os números são planejamento, não promessa.** Se uma auditoria mostrar que algo já está pronto, ele não é refeito só porque está na lista. O objetivo é chegar à 1.7.10 com qualidade, não preencher cada versão.

---

## 2. Confronto ponto a ponto

**Colunas:**
- **GPT** e **Claude**: se cada análise trouxe o tema (✔ trouxe, ◐ trouxe em parte, ✗ não trouxe);
- **Código 1.7.6.7**: o que existe de verdade hoje;
- **Versão**: onde o tema entra.

### 2.1 Fundação (estado e identidade)

| Tema | GPT | Claude | Código 1.7.6.7 | Versão |
|---|---|---|---|---|
| Identidade dos jogadores (`id` separado da posição) | ✔ | ✗ | 🔴 Jogador não tem `id`. Mais de 200 referências usam a posição na lista (`mestreIndex`, `responderIndex`, `scorerIdx`…). 5 coisas são guardadas pelo **nome** (`admPrincipalName`, `primeiroMestreNome`, `ultimaRodadaQuem`, `caosMudoPor`, `pickedByName`). ⚠️ O ADM já remove jogador com `splice` e remapeia à mão umas 15 estruturas: cada estrutura nova que guarde posição precisa ser lembrada ali. | 1.7.7 |
| Identificação da partida (`matchId`) | ✔ | ✗ | 🟡 Só existe `caosPartidaSerial`, um contador local usado pra descartar falas atrasadas. Não vai pro save. | 1.7.7 |
| Identificação das cartas | ✔ | ✗ | 🟢/🟡 As 1000 respostas são únicas (conferido: 1000 de 1000) e o auditor proíbe repetidas. O save guarda as cartas pela resposta. Falta um `id` estável: corrigir o texto de uma resposta faz um save antigo perder a carta. | 1.7.7 |
| Inventário do estado | ✔ | ◐ ("estado da mesa portátil") | 🟡 São 261 variáveis globais em `js/02-estado.js`, e cerca de 90 vão pro save. As que ficam de fora são quase todas do C.A.O.S. ou da tela (correto). Algumas são de regra e não são salvas: `consecutiveExhausted` (2 cartas esgotadas seguidas disparam um evento), `streakCount` e `streakScorerIdx`, `starterDrawCount` (as 2 chances de sortear outro Mestre voltam depois de recarregar) e `cardWrongCount`. | 1.7.7 (inventário e correções) · 1.7.8 (snapshot) |
| Save e recuperação | ✔ | ◐ (pacote pro DICAOS) | 🟢 `SAVE_VERSION` 11, saneamento ao carregar, Exportar/Importar partida e memória do C.A.O.S. Falta: `id` de jogador, de partida e de carta no save. | 1.7.7 · migração na 1.7.9/1.7.10 |
| Cobertura da espinha do C.A.O.S. | ✔ | ✗ | 🟡 A foto (`caosEspinhaFoto`) vigia jogadores (placar, casa, bloqueio, equipe, joias), equipes, Mestre, vez, início, fim, estado da carta, cartas puxadas, resposta da carta e tamanho do baralho. **Ficam de fora:** fichas de palpite, joias da rodada, vencedor por joias, fila da casa de bônus, dicas abertas, relógios, modo sorteado da Moda da Casa, rodada atual e última rodada. A restauração acha o jogador por posição + nome. | 1.7.7 |
| Sorteios: regra × enfeite | ✔ | ✗ | 🟡 251 `Math.random` em 16 arquivos. **Decidem o jogo:** `shuffle` (baralho, ordem das dicas, equipes, ordem das equipes, fila do Mestre vs Todos), quantidade de especiais no Hardcore/Express, roleta da Moda da Casa, categorias do Express, alvo automático de "Escolha um jogador", reinserção de carta no baralho. **Enfeite:** cerca de 200 usos no C.A.O.S. (falas, emoções, léxico, tropeços). | 1.7.7 (mapa e fonte única) |
| Documentação atualizada | ✔ | ✗ | 🟡 O `Status_do_Roteiro.md` foi "lido na 1.7.4.3" e o roteiro antigo foi escrito sobre a 1.7.0. Este documento é o primeiro passo. | 1.7.7 |
| Simulador de partidas no repositório | ✔ (`sim.js`) | ◐ (partidas simuladas) | ⚠️ O `sim.js` citado pelo GPT foi usado fora do repositório (simulações de equilíbrio) e **não está em `ferramentas/`**. No repositório há testes da espinha, de estresse, dos geradores, das falas, das cartas e dos botões. | 1.7.7 |

### 2.2 Motor preparado pra rede

| Tema | GPT | Claude | Código 1.7.6.7 | Versão |
|---|---|---|---|---|
| Separar regra da tela | ✔ | ✗ | 🟡 `markCorrect`, `markWrong`, `chooseClue`, `flipCard` e `drawHidden` misturam regra, fala do C.A.O.S. e desenho. Plano: separar sem reescrever, preservando o comportamento. | 1.7.8 |
| Ações estruturadas (`{type, playerId, ...}`) | ✔ | ✗ | 🔴 Cada botão chama sua função direto. Plano: uma camada fina **por cima** das funções que já existem, sem criar regra paralela. | 1.7.8 |
| Eventos oficiais | ✔ | ◐ (canal do C.A.O.S.) | 🟡 Existe o canal de falas (`caosCanalRegistrar`, com o destino de cada fala) e o `caosLog`. Ainda não existem eventos de jogo padronizados. | 1.7.8 |
| C.A.O.S. reagindo a eventos | ✔ | ✗ | 🟡 Muitas reações leem as variáveis globais direto. Plano: priorizar as que podem dar inconsistência; sem reescrever o cérebro. | 1.7.8 |
| Snapshot (estado completo) | ✔ | ◐ | 🟡 O save já é quase um snapshot. Plano: usar o próprio save como base. | 1.7.8 |
| Informação por papel (host, Mestre, jogador) | ✔ | ◐ ("só o celular do Mestre vê a resposta") | 🔴 Plano: lista de dados públicos, privados e de administração, com o filtro **antes** do envio. | 1.7.8 (filtro) · 1.7.9 (envio) |
| "Online de mentira" com duas abas | ✗ | ✔ | — Teste de sala, rodízio de Mestres e queda do host sem servidor (BroadcastChannel entre abas). Adianta o simulador multiplayer. | 1.7.8 |
| Documento de autoridade (quem pode o quê) | ✔ | ◐ | 🟢 Decidido pelo JF: o host manda em tudo e o C.A.O.S. roda só no host (`Status_do_Roteiro.md`). Falta o documento de camadas: motor, NET, UI, save, C.A.O.S. | 1.7.8 |
| Segurança: casual × competitiva | ✔ | ✗ | 🔵 Recomendação: começar **casual** (o host filtra o que cada aparelho recebe; quem quiser trapacear inspecionando o código consegue, como em qualquer HTML). Competitivo exigiria servidor próprio. | 1.7.8 (decidir) |
| Uma build × duas (host e controle) | ✔ (pendente) | ✗ | 🔵 Recomendação: **um app só** com permissões por papel; duas builds dobram a manutenção. | 1.7.8 (decidir) |
| Escolher o serviço que liga os celulares | ✗ | ✔ | 🔵 Comparar custo, funcionamento no iPhone e necessidade de conta. Junto com a logística que o JF começa em 05–06/10. | 1.7.8 (comparação) · 1.7.9 (uso) |

### 2.3 Rede

| Tema | GPT | Claude | Código 1.7.6.7 | Versão |
|---|---|---|---|---|
| Salas e código da sala | ✔ | ✔ | 🔴 Já aparece no tutorial como "chega na 1.7.10". | 1.7.9 |
| Host autoritativo | ✔ | ✔ | 🟢 Decisão tomada · 🔴 implementação. | 1.7.9 |
| Ordem das mensagens (`seq`) e ação repetida aplicada uma vez só | ✔ | ✗ | 🔴 | 1.7.9 |
| Relógio sincronizado | ✔ | ✗ | 🟢 Os relógios já são por prazo final (`timerEndAt`, `cardEndAt`) e o relógio de jogo da 1.7.6.7 já existe. Falta compensar a diferença de relógio entre os aparelhos e a latência. | 1.7.9 |
| Reconexão (diferente de entrar de novo) | ✔ | ✗ | 🔴 Depende do `id` (1.7.7). | 1.7.9 |
| Sucessão de host | ✔ | ✔ | 🟡 Decidido pelo JF (o 2º Mestre assume, depois o 3º…) e a fala `hostCaiu` está pronta. Falta trocar posição por `id` e implementar. | 1.7.9 |
| NET separada do motor | ✔ | ✔ | 🔴 A camada `Net` vai ler o destino das falas no canal do C.A.O.S. (já previsto). | 1.7.9 |
| Testes de protocolo (mensagem duplicada, atrasada, de partida antiga, malformada, sem permissão) | ✔ | ✗ | 🔴 | 1.7.9 |
| Versão igual em todos os aparelhos (atualização automática) | ✗ | ✔ | 🔴 ⚠️ Hoje o Safari guarda versões antigas (o JF viu a 1.7.6.2 com a 1.7.6.6 no ar). No online, todo mundo da sala precisa estar na mesma versão. Plano: service worker com aviso "Nova versão disponível". | 1.7.9 (pode adiantar) |
| Partidas completas simuladas em todos os modos e desempenho em iPhone antigo | ◐ | ✔ | 🟡 | 1.7.9 |
| Beta fechado com a família | ✗ | ✔ | — | 1.7.9 |

### 2.4 Lançamento e produto

| Tema | GPT | Claude | Situação | Versão |
|---|---|---|---|---|
| Mudança pro DICAOS (save, memória e acessibilidade num código só) | ✗ | ✔ | 🟡 Exportar/Importar partida e memória já existem, mas separados. A acessibilidade não é exportada. | 1.7.9 (pacote) · 1.7.10 (troca) |
| Modo Caos | ✗ ⚠️ | ✔ | 🔵 O GPT diz que o C.A.O.S. "não deve decidir vencedores", o que conflita com a decisão do JF. **Conciliação:** a regra dele vale em todos os modos, exceto no Modo Caos, onde as ações do C.A.O.S. entram como **ações oficiais do motor** (2.2), nunca por fora da espinha. | regras 1.7.8 · protótipo 1.7.9 · lançamento 1.7.10 |
| Congelar o que está maduro (falas, emoções, cartas, visual) | ✔ | concorda | Política: só mexer com evidência (pedido do JF depois de jogar, auditor, teste). | sempre |
| 23 avisos do auditor de cartas e 1 fala repetida | ✗ | ✔ | 🟡 Não são erros, são pistas pra conferir. Entram no QoL. | qualquer patch |
| Agradecimentos Especiais | ✗ | ✔ | 🔵 Faltam os nomes. | quando o JF mandar |
| Arquivos offline antigos no repositório (cerca de 145 MB do histórico) | ✗ | ✔ | 🔵 Pela regra do Klaus, só saem se forem guardados antes em Releases. | decisão do JF |

---

## 3. Checklist de bloqueadores da 1.7.10

São os 18 itens do GPT mais 4 que só a análise do Claude trouxe.

| # | Requisito | Status 1.7.6.7 | Entra em |
|---|---|---|---|
| 1 | Identidade estável dos jogadores | 🔴 | 1.7.7 |
| 2 | Identificação da partida | 🟡 | 1.7.7 |
| 3 | Identificação das cartas | 🟡 | 1.7.7 |
| 4 | Estado serializável (snapshot) | 🟡 | 1.7.7 → 1.7.8 |
| 5 | Ações estruturadas | 🔴 | 1.7.8 |
| 6 | Eventos estruturados | 🟡 | 1.7.8 |
| 7 | Host autoritativo | 🟢 decidido · 🔴 implementado | 1.7.9 |
| 8 | Ordem das mensagens | 🔴 | 1.7.9 |
| 9 | Ação repetida aplicada uma vez só | 🔴 | 1.7.9 |
| 10 | Relógio sincronizado | 🟡 | 1.7.9 |
| 11 | Sorteios controlados | 🟡 | 1.7.7 |
| 12 | Estado filtrado por papel | 🔴 | 1.7.8 → 1.7.9 |
| 13 | Reconexão | 🔴 | 1.7.9 |
| 14 | Sucessão de host | 🟡 | 1.7.9 |
| 15 | NET separada | 🔴 | 1.7.8 → 1.7.9 |
| 16 | Testes de protocolo | 🔴 | 1.7.9 |
| 17 | Simulação multiplayer | 🔴 | 1.7.8 → 1.7.9 |
| 18 | Proteção do C.A.O.S. (falha dele não para a partida) | 🟢 3ª lei · 🟡 cobertura da foto | 1.7.7 |
| 19 | Versão igual em todos os aparelhos | 🔴 | 1.7.9 |
| 20 | Mudança de endereço (DICAOS) sem perder save nem memória | 🟡 | 1.7.9 → 1.7.10 |
| 21 | Serviço de conexão escolhido | 🔵 | 1.7.8 |
| 22 | Modo Caos pela via oficial do motor | 🔵 | 1.7.8 → 1.7.10 |

---

## 4. Plano da 1.7.7 · Foundation Structure Update

Cada parte sai publicada sozinha, como nas updates anteriores. Em todas valem as mesmas regras:
- **o jogo não muda pra quem joga** (exceto onde corrige um defeito);
- os testes atuais continuam passando, e cada parte ganha o seu teste;
- save de versão antiga continua abrindo.

### Parte 1 · 1.7.7 · Identidade dos jogadores
- Todo jogador ganha `id` (exemplo: `j_k7p2qa`) no cadastro. Ele não muda se alguém sair, se a ordem mudar ou se a partida for salva e restaurada.
- O save sobe pra versão 12. Save antigo ganha `id` ao abrir, sem perder nada.
- As 5 coisas guardadas pelo nome passam a guardar o `id`. Na leitura de save antigo, o nome ainda é aceito.
- As estruturas chaveadas por posição (fichas de palpite, joias da rodada, memória curta do C.A.O.S. por jogador) passam a usar o `id`. Isso encolhe o remapeamento manual da remoção pelo ADM.
- Nesta parte, `mestreIndex` e `responderIndex` continuam sendo posição (são "assento"). A conversão deles fica pra 1.7.8, junto com as ações.
- **Teste:** remover jogador pelo ADM, reordenar, salvar e restaurar, conferindo que cada `id` continua no mesmo jogador e que palpite, joias e Mestre ficam com a pessoa certa.

### Parte 2 · 1.7.7.1 · Partida e cartas identificadas
- `matchId` nasce no início da partida, vai pro save e é preservado no "Jogar de novo" como uma partida nova.
- Toda carta ganha `id` estável (categoria + resposta normalizada, por exemplo `ANO:2001`). O save passa a guardar `id`; save antigo, salvo pela resposta, continua abrindo.
- O auditor de cartas passa a conferir que os `id` são únicos.

### Parte 3 · 1.7.7.2 · Espinha completa
- A foto da espinha passa a vigiar também: fichas de palpite, joias da rodada, vencedor por joias, fila da casa de bônus, dicas abertas, relógios, modo sorteado da Moda da Casa, rodada e última rodada.
- A restauração acha o jogador pelo `id`.
- **Teste:** uma rotina falsa tenta mexer em cada um desses dados, e a espinha precisa desfazer tudo.

### Parte 4 · 1.7.7.3 · Sorteios e inventário do estado
- Os sorteios que **decidem o jogo** passam por uma função única (`sorteioRegra`), sem mudar o comportamento. Na 1.7.9 é ela que vai deixar o host sortear e os outros aparelhos receberem o resultado. Os sorteios de **enfeite** (falas, emoções) continuam como estão.
- Novo `docs/Estado_da_Partida.md`: o que é estado de regra, o que é do C.A.O.S. e o que é só da tela.
- As variáveis de regra que não vão pro save passam a ir: `consecutiveExhausted`, `streakCount`, `streakScorerIdx`, `starterDrawCount` e `cardWrongCount`.

### Parte 5 · 1.7.7.4 · Simulador e QoL
- Novo `ferramentas/simular_partidas.js`: partidas inteiras automáticas em todos os modos e formatos (Versus, Equipe 2×2, 2×3 e 3×2), conferindo regras que nunca podem quebrar:
  - placar nunca negativo;
  - joias sempre ≤ 4;
  - todo jogador continua com o mesmo `id`;
  - o Mestre roda certo;
  - a partida sempre termina;
  - nenhum erro no console.
- `Status_do_Roteiro.md` atualizado pra 1.7.7.
- QoL: os 23 avisos do auditor de cartas e a fala repetida.

---

## 5. Decisões que dependem do JF (sem pressa, mas antes da 1.7.9)

1. **Serviço do online:** o Claude traz a comparação na 1.7.8.
2. **Segurança casual ou competitiva** (recomendado: casual).
3. **Um app só ou duas builds** (recomendado: um).
4. **Regras do Modo Caos.**
5. **O que acontece se nenhum jogador puder assumir como host:** pausar e esperar? Encerrar salvando?
6. **Arquivos offline antigos:** mandar pra Releases e tirar do repositório?
7. **Nomes dos Agradecimentos Especiais.**
