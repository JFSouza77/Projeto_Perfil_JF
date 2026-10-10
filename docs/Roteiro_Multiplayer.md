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
| **1.7.7** | **Foundation and Structure Update** | Fortalecer o que já existe: identidade dos jogadores, da partida e das cartas, espinha mais completa, mapa dos sorteios, documentação e simulador. |
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

## 4. Plano da 1.7.7 · Foundation and Structure Update

Cada parte sai publicada sozinha, como nas updates anteriores. Em todas valem as mesmas regras:
- **o jogo não muda pra quem joga** (exceto onde corrige um defeito);
- os testes atuais continuam passando, e cada parte ganha o seu teste;
- save de versão antiga continua abrindo.

### Parte 1 · 1.7.7 · Correções da revisão (publicada)
- Saiu primeiro o que a revisão do JF + GPT + Google AI Studio apontou e o código confirmou, sem mudar regra: toque duplo, voltar do Android com janela aberta, preferências de acessibilidade à prova de valor estranho, anúncio da vez pro leitor de tela, espaço entre Acertou e Errou, letra Enorme em 320 px, Absurdo explicado e o `package.json` (ver a seção 6).

### Parte 2 · 1.7.7.1 · Identidade dos jogadores (publicada)
- Todo jogador ganha `id` (exemplo: `j_k7p2qa`) no cadastro. Ele não muda se alguém sair, se a ordem mudar ou se a partida for salva e restaurada.
- O save sobe pra versão 12. Save antigo ganha `id` ao abrir, sem perder nada.
- As 5 coisas guardadas pelo nome passam a guardar o `id`. Na leitura de save antigo, o nome ainda é aceito.
- As estruturas chaveadas por posição (fichas de palpite, joias da rodada, memória curta do C.A.O.S. por jogador) passam a usar o `id`. Isso encolhe o remapeamento manual da remoção pelo ADM.
- Nesta parte, `mestreIndex` e `responderIndex` continuam sendo posição (são "assento"). A conversão deles fica pra 1.7.8, junto com as ações.
- **Feito:** `js/02b-identidade.js`, save v12 e `ferramentas/teste_identidade.js`. As 2 referências por nome que decidem regra (1º Mestre da rodada e ADM principal) viraram id. As outras 3 (`ultimaRodadaQuem`, `caosMudoPor`, `pickedByName`) são só texto mostrado na tela e continuam pelo nome. A conversão achou um defeito antigo: as joias da rodada não eram remapeadas quando o ADM tirava alguém.
- **Teste:** remover jogador pelo ADM, reordenar, salvar e restaurar, conferindo que cada `id` continua no mesmo jogador e que palpite, joias e Mestre ficam com a pessoa certa.

### Parte 3 · 1.7.7.2 · Partida e cartas identificadas (publicada)
- **Feito:** ids `ANO-0001` … `ANIMAL-0200`, mapa `CARTAS_RESPOSTA_ANTIGA`, save com `deckIds`/`currentCardId`/`matchId`, auditor e `teste_identidade` conferindo.
- `matchId` nasce no início da partida, vai pro save e é preservado no "Jogar de novo" como uma partida nova.
- Toda carta ganha `id` **explícito e imutável**, escrito na própria carta (ex.: `ANO-0001`). Ele **não** sai da resposta (pedido do roteiro "Extractor Upgrade" do GPT): se uma resposta for corrigida, o `id` não muda. Um mapa resposta → `id` faz a migração do save antigo, que guardava pela resposta.
- O auditor de cartas passa a conferir que os `id` são únicos.

### Parte 4 · 1.7.7.3 · Espinha completa (publicada)
- **Feito:** tudo da lista abaixo, mais vez/cursor das equipes e sentido. Relógios com a regra "pode dar tempo, nunca tirar" (o balão congela o relógio enquanto fala). Carta, baralho, início e fim continuam só vigiados.
- A foto da espinha passa a vigiar também: fichas de palpite, joias da rodada, vencedor por joias, fila da casa de bônus, dicas abertas, relógios, modo sorteado da Moda da Casa, rodada e última rodada.
- A restauração acha o jogador pelo `id`.
- **Teste:** uma rotina falsa tenta mexer em cada um desses dados, e a espinha precisa desfazer tudo.

### Parte 5 · 1.7.7.4 · Sorteios e inventário do estado (publicada)
- **Feito:** `js/02c-sorteio.js` (`sorteioRegra`, `sorteioSemear`), `docs/Estado_da_Partida.md` e as 5 variáveis de regra no save (a sequência guardada pelo id).
- Os sorteios que **decidem o jogo** passam por uma função única (`sorteioRegra`), sem mudar o comportamento. Ela aceita uma semente nos testes, pra repetir a mesma partida. Na 1.7.9 é ela que vai deixar o host sortear e os outros aparelhos receberem o resultado. Os sorteios de **enfeite** (falas, emoções) continuam como estão.
- Novo `docs/Estado_da_Partida.md`: o que é estado de regra, o que é do C.A.O.S. e o que é só da tela.
- As variáveis de regra que não vão pro save passam a ir: `consecutiveExhausted`, `streakCount`, `streakScorerIdx`, `starterDrawCount` e `cardWrongCount`.

### Parte 6 · 1.7.7.5 · Simulador e QoL (publicada)
- **Feito:** `ferramentas/simular_partidas.js` com 14 cenários (Versus 2, 3, 4 e 6; Clássico, Hardcore, Júnior, Old School e Express; Tabuleiro, Pontos, Joias e Moda da Casa; Equipe 2×2, 2×3, 3×2 Duelo e 3×2 Todos). Todas as partidas terminam sem quebrar nenhuma regra, e a espinha não precisou desfazer nada.
- A semente fixa os sorteios de regra, mas não garante repetir exatamente a mesma partida: o tempo dos balões muda a ordem das ações do robô. Uma partida repetível de verdade vem com as ações da 1.7.8 (uma fila de comandos não depende do tempo da tela).
- **Fica para o JF:** os 23 avisos do auditor de cartas e a fala repetida. Mexer em carta e em fala é conteúdo; os avisos são pistas e não erros. Vão para a próxima Cards and Rules Update ou para um QoL de falas, se o JF quiser.
- Novo `ferramentas/simular_partidas.js` (vira o `npm run simular`), com semente e limite de passos (nunca roda pra sempre): partidas inteiras automáticas em todos os modos e formatos (Versus, Equipe 2×2, 2×3 e 3×2), conferindo regras que nunca podem quebrar:
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

---

## 6. Revisão do JF + GPT + Google AI Studio (1.7.0 a 1.7.6.x)

Conferida no código em 05/10/2026. Três destinos:

**Entrou na 1.7.7 (correção, sem mudar regra):**
- Toque duplo no veredito ou no número (trava de 400 ms só nesses botões).
- Voltar do Android: janela aberta tem prioridade (tutorial fecha; as outras seguram o voltar).
- Preferências de acessibilidade: só chaves conhecidas, booleanos de verdade, volume 0-1.
- Leitor de tela anuncia a vez e o Mestre.
- Acertou/Errou com 14 px de espaço; letra Enorme sem vazar em 320 px; Absurdo explicado ("o chute é que foi absurdo").
- `package.json`: "simular" apontava pra um arquivo que não existe.

**Já estava feito (a revisão não viu ou era de versão anterior):** empate na Última Rodada já é anunciado; falas atrasadas já são descartadas quando a partida muda; `prefers-reduced-motion` já é respeitado nas animações; letra Grande/Enorme já crescia a lista de dicas (tudo em rem).

**Entra nas próximas partes da 1.7.7 (roteiro "Extractor Upgrade" do GPT):** `id` imutável de carta com mapa de migração; `matchId`; simulador com semente; `docs/Estado_da_Partida.md`; separar a foto da espinha, o save e o futuro retrato da partida (GameSnapshot, 1.7.8).

**Fica pra decisão do JF (muda regra ou é produto):**
1. Desempate na Última Rodada.
2. Desfazer o último veredito.
3. Tempo extra individual pra quem **responde** (hoje o extra é de quem é Mestre).
4. Karaokê: destacar a palavra que a voz está lendo.
5. C.A.O.S. narrando o tutorial.
6. Contraste "quente" (tema alternativo ao alto contraste).
7. Animação de contagem dos pontos e virada de carta.
8. Indicador fixo de "já ganhou 2 joias nesta rodada".
9. 4ª Lei do C.A.O.S. (respeitar quem está lendo) e tom por idade.
10. Firebase / serviço do online (comparação na 1.7.8), árbitro de paz, resumo depois da pausa, troféus.

**Nome da update:** confirmado pelo JF em 08/10/2026: **Foundation and Structure Update**. "Extractor Upgrade" foi só o nome de trabalho do replanejamento do JF com o GPT e o Google AI Studio.

---

## 7. Documentos do GPT recebidos depois da 1.7.7 (conferidos em 08/10/2026)

Recebidos do JF:
- `ROTEIRO_1.7.7_Extractor_Upgrade.md`;
- `MESTRE_PAVIMENTACAO_MULTIPLAYER_1.7.0_a_1.7.10.md`, que junta os planos por versão e as revisões pt1 a pt7;
- `ROTEIRO_MELHORIAS_CAOS_MULTIPLAYER.md`, o roteiro vivo do C.A.O.S.

Os documentos ficam com o JF e não entram no repositório, porque citam pessoas da família. Aqui fica só o que foi feito com eles.

### 7.1 Já feito na 1.7.7 (os documentos foram escritos olhando a 1.7.6.7 e a 1.7.7.3)

| Pedido | Onde |
|---|---|
| `playerId`, migração do save v11 e remoção pelo ADM testada | 1.7.7.1 |
| `matchId` e id imutável de carta com mapa de respostas antigas | 1.7.7.2 |
| Auditor checando a unicidade dos ids | 1.7.7.2 |
| Inventário do estado, com foto, save e retrato separados | 1.7.7.4 (`docs/Estado_da_Partida.md`) |
| `sorteioRegra` com semente | 1.7.7.4 |
| Simulador com semente e limite de passos; `npm run simular` | 1.7.7.5 |
| Absurdo explicado ("o chute é que foi absurdo") e "atrocidade" fora do manual | 1.7.7 |
| Toque duplo | 1.7.7 |
| `aria-live` da vez | 1.7.7 |
| Letra Enorme a 320 px | 1.7.7 |

### 7.2 Feito na 1.7.7.6 (QoL da revisão)

- **Tempo extra do Mestre:** a fala não diz mais "já que você é mais novinho". Agora é neutra: "você tem um tempinho extra pra ler a carta".
- **Splash:**
  - mostra "Preparando as cartas…" até o jogo contar as cartas (antes dizia "575 cartas" por um instante);
  - o recado do C.A.O.S. responde a Enter e Espaço;
  - as palavras flutuantes e o dado são decorativos para o leitor de tela.
- **Importar save:**
  - limite de tamanho;
  - conferência de versão, jogadores e tipos antes de substituir a partida;
  - save de versão mais nova do jogo é recusado sem mexer em nada.
- **Gravação:** `JFStore.flushNow()` espera o banco do navegador confirmar a gravação (no máximo 1,5 s), e o import espera essa confirmação antes de recarregar.
- **Erros soltos da página** (`error` e `unhandledrejection`):
  - ficam registrados só neste aparelho, com o tipo e a hora (sem nome, carta, resposta ou texto);
  - aparecem no Cérebro (ADM).
- **Espinha:** se uma rotina protegida devolver Promise, isso fica anotado e a rejeição é contida.

### 7.3 Para a 1.7.8 (Actions and Events), como os próprios documentos sugerem

- `dispatchAction`, com `commandId`, `matchId`, `actorId` e `expectedRevision`.
- `GameSnapshot` separado do save, e projeção pública sem resposta.
- Ensaio em duas abas com `BroadcastChannel`.
- **`clueId` estável por dica** (ideia do JF):
  - id escrito na fonte (ex.: `ANO-0001-C07`), separado da ordem mostrada (`displayIndex`);
  - migração do save que hoje guarda a posição da dica.
- **Evento tipado do C.A.O.S.:** evento → fatos permitidos → seleção → fallback ou silêncio, com público explícito. O canal hoje acha o destinatário pelo nome dentro do texto; isso é só diagnóstico e não serve para a rede.
- **Inventário editorial das falas:** composição segura, fala atômica, pública, privada ou que depende de fatos. Sem reescrever a personalidade.
- **Regra para o online:** o C.A.O.S. não deduz leitura, idade, atenção ou intenção a partir de tempo, erro ou latência. A observação do Mestre (`mestreDificuldade`) continua só na mesa presencial; no online, o tempo extra é pedido pela pessoa ou é regra da sala.

### 7.4 Precisa do JF (decisão ou teste no aparelho)

1. **Layout no computador (Opera GX / Chrome):** resolvido na 1.7.7.7 com a sugestão do GPT (`css/08-computador.css`): sem zoom 1.2, e a tela usa a largura do monitor com limites de leitura.
2. **Idade:** a faixa "menos de 12" não muda baralho nem humor (confirmado). O GPT sugere a opção "Prefiro não informar". Hoje, não tocar em nada já significa isso.
3. **Baralho por idade ou preset de sala:** é só hipótese. Precisa de classificação editorial das cartas (familiaridade separada de dificuldade) e da sua aprovação.
4. **Provocação de cadastro para quem escolhe Suave:** o GPT recomenda só com opt-in e nunca em sala aberta.
5. **Idiomas** (`pt-BR`, `pt-PT`, `en`, `es`): infraestrutura candidata para a 1.7.9, com uma amostra pequena e revisada. As cartas não são traduzidas automaticamente.
6. **Ideias de produto:**
   - tela de carregamento (ideia da sobrinha): a splash já cobre a inicialização; medir antes;
   - "Continuar / Nova partida" na splash;
   - tabuleiro virtual completo;
   - narração do tutorial pelo C.A.O.S.;
   - transição da carta virando.
7. **Online:**
   - salas privadas por código no lançamento, sem matchmaking público;
   - serviço autoritativo ou host casual;
   - teto de custo;
   - migração para o domínio DICAOS (o navegador trata como outro endereço, então o save precisa de Exportar/Importar).

---

## 8. Decisões do JF sobre a 1.7.7 (08/10/2026) e fechamento

- **Nome:** Foundation and Structure Update.
- **Cartas e falas (JF deixou com o Claude):**
  - 5 cartas corrigidas no QoL da 1.7.7.8. Barsa, Carnê do Baú, Super Choque e Escova de dente tinham a resposta numa dica. 1945 tinha 4 dicas de conta.
  - Os 18 avisos que sobraram foram mantidos de propósito. "Sou um escudo" e parecidas funcionam como dica de categoria; "ilhas" e "nunca" são palavras comuns; os ecos são fatos diferentes.
  - A fala repetida do Ácido foi trocada por uma nova.
- **Ideias que mudavam regra (JF deixou com o Claude, "o mais equilibrado"):**
  - **Entrou:**
    - 🔒 no placar para quem já ganhou as 2 joias da rodada (a trava fica visível);
    - 🔊 "Ouvir este passo" no tutorial, só ao tocar;
    - virada de carta curta (sem animação no Modo Batata e com movimento reduzido).
  - **Desempate da Última Rodada:** continua "Empate entre…". Empatar com a mesma regra para todos é justo, e um desempate novo mudaria o resultado de partidas.
  - **Desfazer o último veredito:** vai para a 1.7.8. Com a fila de ações, desfazer vira "voltar uma ação" sem risco de deixar ponto, joia e vez desencontrados.
  - **Tempo extra para quem responde:** não entra. Quem responde ouve a dica, não lê. "Mais tempo" da acessibilidade e o tempo extra do Mestre já cobrem.
  - **Karaokê na leitura:** não entra agora. As vozes do iPhone não avisam de forma confiável qual palavra estão lendo.
  - **Contraste quente:** não entra. O Alto contraste já existe.
  - **Animação de pontos:** não entra. A virada de carta já dá o retorno visual sem atrasar a jogada.
  - **4ª Lei / tom por idade:** não entra, seguindo o GPT. O humor continua sendo escolha de cada pessoa.
- **Duelo com 2 equipes:** continua como sempre foi (JF).

**A 1.7.7 está fechada. Próxima: 1.7.8 · Actions and Events.**

---

## 9. Plano da 1.7.8 · Actions and Events Update

Cada parte sai publicada sozinha. Em todas, o jogo local continua igual para quem joga, e cada parte ganha o seu teste.

### Parte 1 · 1.7.8 · Fronteira de ações (publicada)
- `js/05g-acoes.js`:
  - 24 ações com nome (`sacarCarta`, `virarCarta`, `escolherDica`, `acertou`, `errou`, `palpiteAcertou`, `especialSeguir`, `expressPassar`, `tempoAcabou`, `pausar`, `encerrar`…);
  - uma casca em volta das funções do motor, como a da espinha. Só a chamada de fora vira ação; o que o motor chama por dentro não conta de novo.
- **Revisão** (`partidaRevisao`): sobe a cada ação que mudou o estado.
- **Registro** (`acoesLog`): guarda as últimas 300 ações, cada uma com quem era Mestre, quem estava na vez (pelo id) e a origem (toque, sistema ou comando).
- **`dispatchAction`:** recusa partida errada, revisão obsoleta, comando repetido (`commandId`) e ação fora de hora.
- **Teste:** `ferramentas/teste_acoes.js`. O simulador também confere que a revisão só cresce.

### Parte 2 · 1.7.8.1 · Retrato da partida (GameSnapshot) (publicada)
- **Feito:** `retratoPartida("mesa" | "mestre")` em `js/05g-acoes.js` e `acoesAoMudar(fn)`, que avisa a cada ação. O público também não leva o **id da carta**: o catálogo está dentro do jogo, então o id entregaria a resposta. O retrato não leva idade, humor nem fala do C.A.O.S. O simulador confere a cada 10 passos que o retrato público nunca leva a resposta.
- `retratoPartida(papel)` com `matchId` e revisão.
- A **projeção pública** nunca leva a resposta nem as dicas fechadas. A **projeção do Mestre** leva a resposta.
- O retrato é separado do save.
- **Teste:** procurar a resposta da carta dentro do retrato público.

### Parte 3 · 1.7.8.2 · Desfazer o último veredito (publicada)
- **Feito:**
  - vereditos que podem ser desfeitos: Acertou, Errou, Pulou, Absurdo e os palpites;
  - o ↩️ fica 8 s no alto da tela (embaixo aparece a pergunta Perto/Longe), acima do balão e abaixo das janelas;
  - volta pontos, joias, palpite, vez, Mestre, carta, dicas, baralho, histórico, estatísticas e o relógio com o tempo que faltava;
  - não aparece se o veredito acabou a partida;
  - o desfazer também é uma ação e sobe a revisão; as falas do C.A.O.S. não voltam.
- **Teste:** o simulador usa o desfazer em 10% dos vereditos e as 14 partidas terminam sem quebrar regra.
- ↩️ por alguns segundos depois de Acertou, Errou, Pulou ou Absurdo.
- Volta o estado de regra para antes da ação (pontos, joias, vez, palpite) e a revisão anota o desfazer.
- **Teste:** desfazer deixa tudo igual ao retrato anterior.

### Parte 4 · 1.7.8.3 · Ensaio em duas abas (BroadcastChannel) (publicada)
- **Feito:** `js/05h-telao.js`.
  - A aba do jogo publica o retrato público a cada ação (e quando alguém pede).
  - A aba `#telao` mostra placar, Mestre, vez, categoria, dicas abertas e relógio.
  - O telão não carrega a partida, não roda o motor nem grava (`saveBloqueado`).
  - Ele ignora retrato velho e de protocolo desconhecido.
  - Abre pelo painel ADM ("📺 Abrir telão"); serve também para um segundo monitor no computador.
- **Teste:** `ferramentas/teste_telao.js`, com duas abas de verdade num servidor http local.
- Uma aba "telão" só olha: recebe a projeção pública a cada revisão e mostra placar, dica aberta e vez.
- **Não prova** rede, segurança nem reconexão; é só o ensaio do fluxo.
- **Teste:** duas abas com a mesma revisão, e o telão sem a resposta.

### Parte 5 · 1.7.8.4 · Ids das dicas e eventos do C.A.O.S. (publicada)
- **Ids das dicas:**
  - cada dica tem id fixo pela posição no arquivo-fonte (`ANO-0001-C07`); são 20 mil ids únicos;
  - regra: nunca reordenar nem apagar entradas;
  - o save acha a dica pelo id (texto corrigido não perde a dica);
  - o `clueId` só vai no retrato do Mestre, porque ele começa com o id da carta.
- **Falas como eventos:**
  - cada fala no canal tem `eventId` único, `matchId`, revisão e destino (`explicito`, `mesa` ou `nome`);
  - `caosFalarPara(id, fala, privado)` dá o destinatário pelo id;
  - achar pelo nome no texto ficou só como diagnóstico; na rede, fala sem destino explícito vai para a mesa;
  - a primeira fala dirigida é o aviso do tempo extra, privado para o Mestre.
- **Fica para depois (conteúdo, sem pressa):** passar as outras falas dirigidas para `caosFalarPara`, uma família por vez, e o inventário editorial (fala autossuficiente, fatos exigidos).
- `clueId` estável por dica (`ANO-0001-C07`), separado da ordem mostrada, com migração do save.
- O C.A.O.S. passa a receber **eventos tipados**: evento, fatos permitidos, público (mesa, Mestre ou jogador por id) e fala ou silêncio. O canal deixa de achar o destinatário pelo nome dentro do texto.

### Parte 6 · 1.7.8.5 · Replay e QoL (publicada)
- `npm run simular:replay` (ou `node ferramentas/simular_partidas.js --replay --semente=N`):
  - grava as ações de cada cenário;
  - repete numa partida nova com a mesma semente via `dispatchAction`;
  - compara o retrato do Mestre no fim. `DBG=1` mostra os detalhes.
- **Achados do replay (corrigidos):**
  - o evento de piedade dependia do balão estar fechado, e por isso gastava o sorteio de regra em hora diferente. Agora ele não espera e mostra com prioridade;
  - o alvo do Express mudava o estado fora de uma ação. Agora é a ação `expressMirar` e entra na foto da espinha;
  - o evento do clique ia para os dados da ação. Agora vira `null`.
- **Limite conhecido:**
  - a revisão pode diferir em 1 ou 2 quando uma ação automática (sacar, tempo, encerrar) já veio embutida em outra no replay;
  - o estado da partida é o mesmo, e o replay anota essa diferença;
  - o replay roda num navegador só e não prova rede.

### Decisão para a 1.7.9 · Descartar por votação (registrada em 1.7.8.7)
- O "Reembaralhar" (antes da 1ª dica, sem limite) saiu na 1.7.8.7: fazia o mesmo que o Descartar. Trocar a carta é só pelo **Descartar** (até a 5ª dica, no máximo 2 seguidas).
- No online, o Descartar vira **votação da mesa**, como já acontece no Encerrar e no Desistir:
  - o C.A.O.S. anuncia em voz alta: "O Mestre quer descartar porque achou a carta muito difícil. Todos de acordo?";
  - o Mestre tem que convencer a mesa sem entregar a carta (ex.: "é um ano que nem eu conheço");
  - a mesa decide.

### Debug antes da 1.7.9 (1.7.8.9)
- **Teste do macaco** (`ferramentas/teste_macaco.js`): partida montada pela semente (12 cenários) e toques ao acaso como um dedo. Confere regras a cada 25 toques e recarrega a cada 200 exigindo a mesma partida, sem internet. Rodar nas versões grandes.
- **Achado e corrigido:** a roleta da categoria se perdia em qualquer `render()` (pausa e volta, balão que fecha) e o Mestre tinha que virar de novo.
- **Desfazer:** 200 vereditos desfeitos em 7 cenários mais o Express, com a espinha idêntica.
- **Decisão:** o "Próxima" do Express não tem desfazer, porque ele já abre a dica seguinte na tela.
- **Para a 1.7.9:**
  - o "✓ Acertou" do Express só abre a pergunta "Quem acertou?" (`expressAskWho`, congela o relógio) fora de uma ação. No online, isso é tela só do Mestre: não vai pro retrato, e o relógio congelado precisa ir junto com a revisão;
  - o `expressTargetAction` não é salvo: se recarregar com a janela do alvo aberta, a especial é escolhida de novo.
- **Revisão externa:** `docs/Instrucoes_Debug_Externo.md`.

## 10. Plano da 1.7.9 · Rooms and Network Update

Base: a revisão externa da 1.7.8.9 (10 achados), cada um conferido no código.

### Parte 1 · 1.7.9 · Porta das ações fechada (publicada)
- **A porta confere as regras do motor, não só a tela:**
  - descartar só até a 5ª dica e no máximo 2 seguidos;
  - desistir só depois da 1ª dica;
  - mover casas só com a especial de mover aberta, no valor dela e com um alvo permitido;
  - o alvo do Express só com a janela de alvo aberta.
  - A tela e a porta usam a mesma conta (`podeDescartarCarta`, `podeDesistirCarta`, `acoesMovimentoValido`).
- **O `reembaralharDicas` saiu da porta** e o `reshuffleAndDraw` saiu do jogo.
- **Viraram ações** (com revisão e aviso pro telão/rede): o fim do tempo da carta no Express (`expressCartaPerdida`) e tirar jogador pelo ADM (`admRemover`).
- **Pausar e voltar sobem a revisão:** a pausa entra na conta de "a partida mudou". Como toda ação, pausar fecha a janela do Desfazer, de propósito: desfazer com a partida pausada religaria o relógio.
- **Comando repetido segue recusado depois de recarregar:** os `commandId` já aplicados vão no save, e o log de cada ação guarda o `commandId`.
- **Falas do C.A.O.S.:** o `eventId` ganha um pedaço da sessão (`matchId:sessão:fN`), então recarregar não repete eventId.
- **Espinha (achado 10), mantida como está e registrada aqui:**
  - os campos "só vigiados" (início/fim, estado da carta, carta atual, tamanho do baralho) não são desfeitos;
  - desfazer troca de carta no meio de uma rotina do C.A.O.S. é mais arriscado do que avisar;
  - nenhuma rotina do C.A.O.S. mexe neles hoje (a espinha anotaria).

### Para as próximas partes (precisa da rede)
- **Envelope obrigatório:**
  - na rede, todo comando leva versão do protocolo, `matchId`, `commandId`, revisão esperada e o ator;
  - o ator vem da sessão (quem está conectado), nunca do que o aparelho diz;
  - o host confere o papel de quem manda: só o Mestre dá veredito, só quem está na vez escolhe a dica, só o ADM tira jogador, só o host manda as ações automáticas (tempo acabou, sacar).
- **Três formatos de estado:**
  - o estado completo, que só o host tem;
  - o retrato público, que vai pros convidados;
  - um pacote de recuperação, que vai só pro próximo host em caso de troca.
  - O retrato do telão não serve pra reconectar.
- **Relógio:** os aparelhos estimam a diferença pro relógio do host e mostram a contagem por ela. Só o host decide que o tempo acabou.
- **Votação do Descartar:** já registrada acima.
- **Privacidade das respostas (decisão do JF):** hoje o catálogo das 1000 cartas vem dentro do jogo. Duas saídas:
  - **(a) Partida casual:** todo mundo recebe o jogo inteiro. Quem souber mexer nas ferramentas do navegador acha a resposta, mas pela tela normal ninguém vê. É o mesmo nível de um jogo de tabuleiro, em que dá pra espiar a carta.
  - **(b) Sigilo de verdade:** o catálogo fica só no aparelho do host (ou num servidor), e cada carta vai só pro celular do Mestre na hora. Custa mais trabalho e exige que os convidados recebam uma versão do jogo sem as cartas.

### Parte 3 · 1.7.9.7 · Sala, protocolo, papéis e relógio (publicada)
- **`05k-rede.js`:** o host abre a sala pelo ADM (código de 4 letras); o convidado entra por `#sala=ABCD`, escolhe quem é e vê o retrato público com os botões do seu papel.
- **Envelope e validação:** protocolo, sala, sessão e número em sequência. Mensagem malformada, de outra sala ou protocolo, grande demais, repetida ou atrasada é jogada fora.
- **Ator pela sessão e papel conferido pelo host** (`redePodeComandar`), antes da porta de sempre (`dispatchAction`):
  - veredito, virar, sacar, descartar e desistir: só o Mestre;
  - escolher a dica: quem está na vez (ou o Mestre);
  - duelo de bônus: quem caiu na casa;
  - pausar e continuar: qualquer um;
  - tempo acabou, ADM e encerrar: só o host.
- **Travas de privacidade feitas:** 1 (convidado não roda a partida), 2 (convidado não desembaralha o catálogo na versão publicada), 3 (resposta só pro Mestre, apagada quando a carta acaba ou ele deixa de ser Mestre), 4 (retrato sem resposta e sem ids) e 5 (convidado não grava).
- **Reconexão:** id do jogador + chave do aparelho. O mesmo aparelho volta na hora; outro não toma um lugar online (só depois de 15 s sem notícia ou de um "tchau").
- **Relógio:** ping/pong, fica a medida de menor atraso; o convidado conta o tempo pelo relógio do host. Só o host decide que o tempo acabou.
- **Teste:** `ferramentas/teste_rede.js` (`npm run rede`).
- **Transporte:** hoje só o local (BroadcastChannel: abas do mesmo navegador). O protocolo não depende dele.

### Final · 1.7.9.10 · O online de verdade (beta) (publicada)
- **Decisões do JF:** PeerJS; no online só o host toca "Próxima carta"; tudo numa atualização só, a última da 1.7.9.
- **Transporte internet:** PeerJS 1.5.5 embutido no jogo (`05l-peerjs.js`, licença MIT). O host é um Peer com o id da sala (`perfiljf-sala-abcd`) e cada convidado abre uma conexão direta com ele. O servidor público do PeerJS só apresenta um ao outro.
  - A conexão fica presa à primeira sessão que falou por ela: ninguém se passa por outro.
  - Mensagem "para" alguém vai só pra ele.
  - O convidado reconecta sozinho e se apresenta de novo com a chave do aparelho.
  - O ensaio local continua: `#sala=ABCD&local`.
- **Painel calculado pelo host** (`redeOpcoes`): cada celular recebe só os botões que aquela pessoa pode tocar (veredito, especiais de mover e de alvo, Express, duelo de bônus, palpite, desfazer, descartar, desistir). O host confere de novo cada toque.
- **Votação do Descartar e do Desistir:** com 2 ou mais votantes (lugares online e o jogador do host), o pedido abre votação. O Mestre conta como sim, a maioria aprova, em 20 s vale o que foi votado e empate não passa. O host aplica pela porta de ações.
- **Desistir virou ação de verdade:** antes a confirmação da janela mudava a partida fora da porta (sem revisão nem registro).
- **Lugar do host:** o painel da sala escolhe quem joga no aparelho do host; ele vota por esse jogador.
- **Versão igual:** quem entra com outra versão é recusado, com o aviso pra atualizar.
- **Intervalo:** vai no retrato da sala; os celulares mostram o aviso e o tabuleiro, só o host segue.
- **Host recarregou:** a sala volta com o mesmo código (`perfil5_rede_host`, até 2 h) e os celulares voltam sozinhos.
- **Onde abre:** ⏸️ Pausar → 🌐 Jogar online (beta). Também no painel do ADM.
- **Teste:** `ferramentas/teste_rede.js` roda o mesmo roteiro em abas e pela internet, com um servidor PeerJS local (pacote `peer`, só pra teste). São 74 conferências.

### 1.7.9.11 · Troca de host e tela de carregamento (publicada)
- **Decisão do JF:** seguir com 1.7.9.x até fechar a estrutura da rede, e só então lançar a 1.7.10.
- **Troca de host** (regra do JF: o 2º Mestre assume, depois o 3º…):
  - o host manda o pacote de recuperação (o save completo) só pro sucessor, a cada mudança;
  - com 15 s sem notícia do host, o sucessor recarrega como host com o pacote e reabre a mesma sala;
  - o C.A.O.S. anuncia quem assumiu (gerador `hostCaiu`);
  - os outros se reconectam sozinhos;
  - o host antigo que voltar entra como jogador (sondagem antes de reabrir).
- **Placar do intervalo no celular de cada um:** abas Pontos e Joias a partir do retrato.
- **Tela de carregamento** (relato do JF: no iPhone não aparecia): imagens de abertura do iOS e tela de carregamento dentro do jogo.

### 1.7.9.3 (antiga 1.7.9.13) · Pronto pro online (publicada)
- **TURN (decisão do JF: usar):** `REDE_ICE` em `05k-rede.js` com STUN (Google, Cloudflare) e três pontes gratuitas sem conta (PeerJS, Open Relay da Metered nas portas 80/443 com TCP e TLS, freeturn.net). Se uma sair do ar, as outras seguram.
  - Conta própria (ex.: Metered grátis, 20 GB/mês) entra em `REDE_ICE_PROPRIOS`, que vai na frente da lista.
  - Teste: `teste_rede` roda o roteiro da internet de novo **só pela ponte** (`iceTransportPolicy: "relay"`, servidor TURN local `node-turn`) e confere que a ponte foi usada.
  - Daqui do ambiente de testes não dá pra alcançar os servidores públicos: quem confirma é o teste no 4G de verdade.
- **Tela acesa:** Wake Lock enquanto a sala está aberta (host e convidados), pedido de novo ao voltar pro jogo ou no primeiro toque.
- **Numeração da 1.7 arrumada (pedido do JF):** as versões pequenas de cada série foram juntadas e renumeradas (tabela completa no HISTÓRICO de `src/html/01-cabeca.html`). Na 1.7.9: 1.7.9 = antigas 1.7.9 e .1 · 1.7.9.1 = antigas .2 a .6 · 1.7.9.2 = antigas .7 a .9 · 1.7.9.3 = antigas .10 a .13. Neste roteiro, os números 1.7.N.M das seções mais abaixo são os antigos.
  - Regra pra frente: versão pequena (uma ou duas mudanças) entra junto na próxima, em vez de ganhar número próprio, pra 1.7.9 não passar do .9.

### Pra 1.7.10 (Multiplayer Update · lançamento)
- **Nome DICAOS, domínio próprio e mudança de endereço** (save e memória).
- **Beta fechado com a família**, em celulares de verdade, no Wi-Fi e no 4G/5G.

### Lista de lançamento da 1.7.10 (conferir no dia)
- **Tela inicial (splash):**
  - o aviso "🧪 Beta · Jogar online" vira o botão de verdade do Multiplayer (e sai o "beta");
  - nome e título novos, se for DICAOS;
  - linha da versão.
- **Imagens de abertura do iPhone e ícone:** gerar de novo se o nome ou o ícone mudarem (`node ferramentas/gerar_aberturas.js`).
- **Tutorial:** tirar o "beta" dos cartões do online.
- **Manifest e título** (`manifest.json`, `<title>`), se o nome mudar.
- **Avisar no NOVIDADES** que quem já instalou no iPhone pode precisar tirar o ícone da tela de início e pôr de novo pra ver a abertura nova.

### Decisão do JF · Privacidade das respostas (09/10/2026)
- **Escolha: (a), com o máximo de travas da (b).** Fica aberta a (b) completa depois, se precisar.
- **Já feito (1.7.9.1):** cartas embaralhadas no arquivo publicado.
  - Ctrl+F e "ver código-fonte" não acham nada.
  - A troca de letras muda a cada versão.
- **Travas para as partes da rede:**
  1. **Convidado não roda a partida:** o celular do convidado só mostra o retrato público que o host manda. Ele não guarda carta nem baralho, e o `retratoPartida("mestre")` dele não tem resposta pra dar.
  2. **Convidado não desembaralha o catálogo:** sem as cartas abertas na memória, não dá pra procurar a carta pelas dicas que já saíram. O celular só desembaralha se virar host (ou se o jogo for local).
  3. **A resposta vai só pro celular do Mestre, na hora,** e sai da memória dele quando a carta acaba (veredito, descarte ou tempo).
  4. **O retrato público continua sem id da carta e sem id da dica,** o que já é verdade desde a 1.7.8.4.
  5. **O save do convidado não guarda carta nem resposta.** Só o host salva a partida.
- **O que sobra:** quem souber depurar o jogo no navegador do host ou do Mestre da vez. É o mesmo que espiar a carta na mão de quem lê.

### Board Update · 1.7.9.2 (publicada)
- **Ideia do JF:** um tabuleiro de verdade, com cara do jogo original e forma diferente a cada partida.
- **100 casinhas** (decisão do JF), cada uma valendo `meta/100`. A regra continua em casas/pontos (`WINNING_SCORE`).
- **Forma:** 7 formas, sorteadas por partida. O `tabForma` vai no save e no retrato (`tabuleiro`), então telão e online desenham igual.
- **Tema por modo**, peões que andam casa por casa e tabuleiro grande em pé no celular.
- **Testes:**
  - `teste_telao` confere a forma e os peões no telão;
  - `teste_acoes` confere que a forma volta igual ao recarregar e muda numa partida nova.

### Board Update 2 · 1.7.9.3 (publicada)
- **Referências do JF:** fotos dos tabuleiros de verdade (Perfil 3, 4, 5, 6, 7, 8 e Júnior).
- **Mudanças:**
  - casas em blocos numa pista larga, com cores alternadas e degradê no Júnior;
  - "?" no bônus e número dentro do bloco;
  - entraram Oval, Labirinto e Zigue-zague; saiu o Coração; a Espiral ficou mais espaçada.

### Board Update 3 · 1.7.9.4 (publicada)
- **Ideia do JF:** o tabuleiro grande vira um lobby entre as cartas.
- **Na partida** volta a linha com pontinhos. O tabuleiro desenhado aparece no "toque pra ampliar" e no lobby.
- **Lobby:**
  - abre quando a carta acaba e as casas já foram contadas (`checkWinnerThenDraw` marca, `drawHidden` ou a escolha do duelo abrem);
  - fica aberto 1 minuto, com "Próxima carta ▶" pra pular; a pausa e a aba escondida param o relógio;
  - mostra o próximo Mestre, os peões andando desde o lobby anterior e a lista com quanto cada um andou;
  - é só tela: a próxima carta já está sorteada e escondida por baixo, e nada vai no save nem no registro de ações;
  - Desfazer o veredito fecha o lobby;
  - não abre no Express, no Descartar nem no fim da partida;
  - liga/desliga por aparelho (`perfil5_tab_lobby`).
- **No online (a fazer):** cada aparelho abre o seu lobby a partir do retrato. Falta decidir se o "Próxima carta" de um vale pra mesa toda (sugestão: o host ou o Mestre da vez pula pra todos; os outros só fecham a própria tela).

### Board Update 4 · 1.7.9.5 (publicada)
- Na partida só a linha com pontinhos; o tabuleiro grande fica no lobby, com zoom e régua de casas.
- O C.A.O.S. comenta o tabuleiro (estreia, abrir, toques, pular).
- Menos movimento (acessibilidade) separado do Modo Batata (desempenho).

### Board Update 5 · 1.7.9.6 (publicada)
- Lobby com abas Tabuleiro / Pontos (pódio + corrida de barras) / Joias (coroa). Aprovado pelo JF.

### Ideias pra depois (não é prioridade, decisão do JF)
O tabuleiro aparece em todas as condições de vitória (nas de pontos e joias ele avisa "não vale vitória"). Pra Pontos e Joias terem algo tão bonito quanto o tabuleiro:
- **Pontos · "Corrida de barras":** no lobby, as barras de cada jogador sobem como num gráfico de corrida, com o pódio (1º, 2º, 3º) em degraus e quanto cada um ganhou na carta.
- **Pontos · "Escada":** cada 10 pontos é um degrau; o peão sobe a escada até o topo (a meta).
- **Joias · "Coroa":** cada jogador tem uma coroa com um encaixe por categoria; a joia ganha na carta voa pro encaixe e brilha. Quem está a uma joia de completar ganha um aviso.
- **Joias · "Cofre":** um cofre com as joias de todos, separado por cor, mostrando quem está mais perto de fechar o conjunto.
- ~~**Lobby com abas**~~: feito na 1.7.9.6 (corrida de barras com pódio e coroa). A escada e o cofre ficaram de fora.
