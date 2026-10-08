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

**Nome da update:** o roteiro do GPT chama a 1.7.7 de "Extractor Upgrade". Mantido "Foundation Structure Update", o nome aprovado pelo JF.

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
