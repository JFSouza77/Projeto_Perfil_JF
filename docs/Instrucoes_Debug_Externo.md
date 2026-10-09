# Debug externo do Perfil JF · Beta 1.7.8.9 (antes da 1.7.9)

Instruções para uma revisão feita por outra IA (sem acesso ao GitHub), com os arquivos que o JF enviar.
Cole tudo a partir de "Contexto" na conversa e anexe os arquivos.

---

## Contexto

Você vai revisar o **Perfil JF**, um jogo de adivinhação (estilo "Perfil") num arquivo HTML único. Ele roda no celular (o principal é iPhone 15 com Safari, e o jogo é adicionado à Tela de Início) e no computador (Chrome e Opera GX).

As próximas versões levam o jogo para o **online**:
- **1.7.9** abre a rede: salas, código da sala, protocolo, reconexão, troca de host e relógio sincronizado.
- **1.7.10** consolida o online.

A 1.7.8 preparou a base. Você vai conferir se essa base aguenta.

**Arquivos anexados:**
- `Perfil_JF_Mestre_1_7_8_9.html`: o código **legível**. É nele que você analisa. O topo tem o HISTÓRICO de todas as versões, em comentário.
- `Perfil_JF_1_7_8_9_offline.html`: a versão para jogar sem internet. O código dele vem **comprimido** (ele descompacta na hora de rodar). Não tente ler o código dele: use só para abrir e jogar, se você conseguir rodar um navegador.

**Como o jogo é organizado (busque estes nomes no Mestre):**
- **Ações:** `ACOES`, `dispatchAction`, `acoesRegistrar`, `partidaRevisao`, `acoesLog`.
  - Toda jogada que muda a partida passa por uma "casca" que registra a ação, sobe a revisão e avisa quem escuta (`acoesAoMudar`).
- **Retrato da partida:** `retratoPartida("mesa" | "mestre")`.
  - O retrato da **mesa** nunca pode ter a resposta, o id da carta, o `clueId` nem as dicas fechadas.
  - É ele que vai para os outros celulares no online.
- **Desfazer:** `desfazerFotografar`, `desfazerAplicar`, `desfazerCaosFoto`, `desfazerUltimo`. Desfaz só o último veredito, por 8 s.
- **Telão:** `telaoPublicar`, `telaoIniciar`. É uma segunda aba (`#telao`) que só assiste, por BroadcastChannel. É o ensaio do online.
- **Espinha do C.A.O.S.:** `caosEspinhaFoto` e as "3 leis".
  - O C.A.O.S. é o personagem/narrador. Ele nunca pode mudar o estado que decide a partida.
- **Sorteio único:** `sorteioRegra`, `sorteioSemear`. Os sorteios que decidem a partida usam um gerador com semente.
- **Identidade:**
  - jogador `j_xxxxxx` (`jogadorIdNovo`), partida `matchId`;
  - carta `ANO-0001`, dica `ANO-0001-C07`.
- **Save:** `saveGameState`, `loadGameState` e o saneamento ao carregar. Exportar e Importar partida ("Save de Bolso").
- **Fala do C.A.O.S. com destino:** `caosFalarPara(id, fala, privado)` e o canal de eventos (`eventId`, `matchId`, revisão, destino).

---

## O que fazer

Leia o código do Mestre e procure **problemas reais**: coisas que quebram, travam, trapaceiam, vazam informação ou vão dar errado quando o jogo for para a rede. Priorize nesta ordem:

1. **Vazamento de resposta.** Algum caminho põe a resposta, o id da carta, o `clueId` ou dicas fechadas no retrato da mesa, no telão, no canal de falas, no texto exportado da mesa ou no título/aria de algum elemento visível a todos?
2. **Estado que muda fora de uma ação.**
   - Procure variáveis que decidem a partida (vez, Mestre, pontos, casas, joias, fichas, carta, dicas abertas, rodada, modo sorteado) e são alteradas por `setTimeout`, por clique ou pelo C.A.O.S. **sem passar** por `dispatchAction` ou por uma função da lista `ACOES`.
   - No online, isso dessincroniza os aparelhos.
3. **Não-determinismo nas regras.** Algum sorteio que decide a partida usa `Math.random()` em vez do sorteio único? Alguma regra depende de horário, de animação ou de balão aberto?
4. **Desfazer.** Algum dado da partida que o veredito muda e o desfazer **não** volta? Algum caso em que desfazer deixa a partida num estado impossível (bônus, duelo de equipe, Express, última rodada, joias)?
5. **Save e importação.**
   - Um save velho, estragado ou de outra versão pode travar o jogo ou apagar a partida?
   - O saneamento cobre todos os campos?
   - Algum campo novo (`partidaRevisao`, `acoesLog`, `expressTargetAction`, ids das dicas) não é salvo ou não é saneado?
6. **Segurança.** Algum texto vindo do jogador (nome, chute digitado, save importado) vai para `innerHTML` **sem** `escapeHtml`? No online, um nome malicioso viraria código no celular dos outros.
7. **Travas e vazamentos de memória.** Timers e `setInterval` que nunca param, listeners adicionados a cada render, janelas que podem ficar abertas sem saída, botões que somem atrás de outra camada (z-index).
8. **iPhone/Safari.** Coisas que funcionam no Chrome mas falham no Safari do iPhone: voz, som, `BroadcastChannel`, armazenamento, área segura, teclado cobrindo campo.
9. **Regras de jogo.** Contradições entre o texto das regras (tela de regras, manual, tutorial) e o que o código faz.

Cartas e falas do C.A.O.S. ficam em **segundo plano**: só aponte erro factual grave ou dica que entrega a resposta.

---

## Regras da revisão

- **Não invente.** Cada problema precisa citar o **nome da função** e um **trecho curto do código** (1 a 5 linhas) copiado do Mestre. Sem trecho, não entra.
  - Os números de linha mudam, então use o nome da função e o trecho.
- **Diga como reproduzir** (os toques na tela ou a sequência de chamadas) e **o que acontece** × **o que deveria acontecer**.
- **Separe certeza de suspeita.** Marque cada item como **CONFIRMADO** (você viu no código que acontece) ou **SUSPEITA** (pode acontecer, falta confirmar).
- **Não reescreva o jogo.** Sugira a correção mínima, em poucas linhas. Nada de "refatore tudo".
- **Não mude nomes de chaves do save** (`perfil200_state` e similares) nem os ids das cartas e dicas: quebraria saves antigos.
- **Regras de jogo são decisão do JF.** Se achar que uma regra deveria mudar, coloque numa seção separada ("Sugestões de regra"), sem tratar como bug.
- **Já decidido, não reabra:**
  - o "Reembaralhar" saiu e trocar de carta é só pelo **Descartar** (até a 5ª dica, no máximo 2 seguidas); no online vira votação;
  - o duelo com 2 equipes continua como está;
  - o C.A.O.S. pode zoar à vontade, mas **nunca** muda o estado da partida;
  - o telão funciona só no mesmo navegador (é ensaio, não é rede);
  - no replay do simulador, a revisão pode diferir em 1 ou 2 por ações automáticas embutidas;
  - o tempo extra do Mestre (menos de 12 anos ou iniciante) é proposital.

---

## Formato da resposta

1. **Resumo em 5 linhas:** a base aguenta o online? Quais os 3 maiores riscos?
2. **Tabela de achados**, do mais grave pro menos grave:

| # | Gravidade | Certeza | Área | Função | Problema (1 frase) |
|---|---|---|---|---|---|
| 1 | Alta / Média / Baixa | CONFIRMADO / SUSPEITA | ex.: Desfazer | `desfazerAplicar` | ... |

3. **Um bloco por achado**, com:
   - trecho do código (copiado do Mestre);
   - como reproduzir;
   - o que acontece × o que deveria;
   - correção mínima sugerida.
4. **Sugestões de regra** (opcional, separado).
5. **O que você conferiu e está OK:** lista curta, pra não repetirmos o trabalho.

Gravidade:
- **Alta:** trava, perde partida, vaza resposta ou dessincroniza no online.
- **Média:** regra errada ou tela quebrada.
- **Baixa:** detalhe visual ou texto.
