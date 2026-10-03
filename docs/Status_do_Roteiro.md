# Status do roteiro de organização e online

Lido em 03/10/2026, na 1.7.4.3. O roteiro original está em `Roteiro_Organizacao_e_Online.md`, sem alterações.
Ele foi escrito com base na leitura da 1.7.0, então números e nomes precisam ser conferidos de novo
na hora de começar cada fase.

## Onde cada parte entra (decisão do JF)

| Parte | Versão | Observação |
|---|---|---|
| Parte A: organização do código (Fase 0) | **1.7.5 · C.A.O.S. and Code Update** | O Klaus sugeriu a estruturação. Vem junto com o pente fino no cérebro do C.A.O.S. |
| C.A.O.S.: matrizes de humor, cérebro, humanização, memória e limites, limites de comportamento, testes de estresse, tédio e animação, controle e mistura de emoções | **1.7.5** | |
| Parte B: multiplayer online (Fases 1 a 6) | **1.7.10** | Vem junto com a retirada do aviso "Em breve: Modo Multiplayer" (#splashEmBreve). |
| Modo Caos / No Mercy | 1.7.10 ou depois | As regras de joias são decisão do JF. |
| Nome novo **DICAOS** e domínio próprio (dicaos.com.br + dicaos.com) | **1.7.10** | Decisão do JF em 03/10/2026: ele compra os domínios por volta de 05–06/10, mas a troca de nome, de domínio e de endereço só acontece junto com o multiplayer, no grande update. Planejar a migração do save (o progresso fica preso ao endereço antigo; usar Exportar/Importar). INPI: "DICAOS" sem conflito numa busca do JF; "CAOS" sozinho tem 602 processos. |
| Preparação da logística do online (transporte, serviço, contas) | A partir de 05–06/10/2026 | Em paralelo, depois que o JF comprar os domínios. |
| "Crie/sugira sua carta" (o C.A.O.S. confere se a carta já existe) | Para depois | É uma ideia do JF e ainda não tem data. |

## Itens que já estão resolvidos ou mudaram desde a 1.7.0

- **2.5, versões de 4 números:** o `build.js` já aceita `X_Y_Z` e `X_Y_Z_W` (regex `(\d+(?:_\d+){2,3})`). As saídas de uma versão não sobrescrevem as de outra.
- **3.9, escape do nome do vencedor:** a tela final já usa `escapeHtml()` no nome (`🏆 ${escapeHtml(sorted[0].name)} venceu!`). Os nomes das equipes vêm de `TEAM_INFO`, que são fixos.
- **2.6, validação de cartas:** já existe fora do repositório. Os scripts do auditor checam estrutura, vazamento, eco, contas das cartas de Ano e repetidas. Na 1.7.5 eles podem entrar no repositório (só reportam e não corrigem conteúdo).
- **Tamanho do Mestre:** cresceu bastante desde a 1.7.0. Hoje tem 1000 cartas (eram 600) e cerca de 2,4 MB. O peso das cartas no JS é ainda maior que os ~40% citados no roteiro.
- **Equilíbrio do baralho:** a 1.7.4.1 corrigiu a ordem de compra (o baralho era comprado ao contrário). Na hora de dividir o motor em arquivos, isso precisa ser mantido.
- **Express:** na 1.7.4 ganhou especiais de UNO funcionando, descarte e roleta só com as categorias da partida. Continua 100% offline, como decidido.

## Curadoria de cartas
- Público de cada modo (Old School, Júnior, Clássico): ver `docs/Publico_dos_Modos.md`.
- Onde registrar mudanças de cartas nos logs: ver `docs/Regras_dos_Logs.md`.

## C.A.O.S. no online (preparado na 1.7.5.3)
- O C.A.O.S. roda **só no host**, junto com o motor do jogo, e o host manda em tudo (decisão do JF).
- Toda fala dele passa pelo **canal** (`caosCanalRegistrar` em `src/js/07c-espinha-do-caos.js`), que já anota o destino: os jogadores citados ou a mesa toda.
- Na 1.7.10:
  - cada jogador recebe `aparelho` (o id da conexão);
  - a camada `Net` lê o destino de cada fala no canal e entrega no celular certo;
  - fala com `privado = true` (`caosFalarPara`) vai só para o aparelho da pessoa;
  - a voz continua tocando em cada aparelho, e cada pessoa silencia o próprio.
- As 3 leis da espinha valem também no online: o C.A.O.S. nunca mexe no jogo, nem no do host.
- **Modo Caos (ideia do JF para a 1.7.10):** é o único modo em que o C.A.O.S. vai ter poder no jogo, e o modo leva o nome dele. A 1ª lei continua valendo em todos os outros modos. No Modo Caos, as ações dele vão passar por uma via própria e explícita, com regras decididas pelo JF, nunca por fora da espinha.
- **Memória e endereço:** cada endereço tem a sua memória (o site e cada arquivo offline). Na troca para `dicaos.com.br`, levar o save e a memória (Exportar/Importar) e recomendar adicionar o jogo à Tela de Início, porque o Safari apaga dados de site depois de 7 dias sem visita.

## Cérebro do C.A.O.S.
- Mapa das camadas, gerador de falas, calibração e limites de memória: ver `docs/CAOS_Cerebro.md`.

## Feito na 1.7.5 · Parte 1 (organização do código)

- `src/` virou a fonte oficial. São 32 partes (html, css, js e dados), com a ordem em `src/ordem.txt` e a explicação em `src/LEIA-ME.md`.
- `montar.js` junta as partes, e o `build.js` monta o Mestre sozinho antes de gerar as saídas. O Mestre continua no repositório, mas agora é gerado.
- **Equivalência provada** contra o Mestre 1.7.4.4: o texto é idêntico, exceto a ordem das cartas, que agora ficam agrupadas por categoria (mesmas 1000 cartas, mesmo texto e mesma ordem dentro de cada categoria). O jogo não depende dessa ordem: todo baralho é embaralhado e o save guarda pelo nome.
- O build e o `--testar` passaram, e também as partidas simuladas na 1.7.5.
- `ferramentas/auditar_cartas.js` faz a validação das cartas (2.6) e só reporta, sem corrigir conteúdo.
- **Ainda não feito, porque depende do JF:** tirar `*_debug.html` e `*_offline.html` do repositório. Pela regra do Klaus, as saídas antigas ficam.
- **Próximos cortes possíveis:** `js/07-caos.js` tem cerca de 7 mil linhas e pode ser dividido junto com o trabalho no cérebro do C.A.O.S. (Parte 2).

## Para lembrar na 1.7.5

- Trabalhar numa branch separada, com **equivalência provada** (seção 2.3): o Mestre gerado a partir de `src/` precisa passar no `build.js --testar` e bater nas contagens (cartas, entradas, famílias, grupos e falas).
- Não mexer no conteúdo das cartas nem das falas durante a reorganização.
- Não versionar os `*_debug.html`, e decidir com o JF se os `*_offline.html` também saem do repositório (hoje eles ocupam a maior parte do `.git`, com cerca de 145 MB).
- A regra do Klaus continua valendo: não apagar nem sobrescrever as saídas de versões anteriores. Se elas saírem do repositório, precisam ir antes para Releases.
