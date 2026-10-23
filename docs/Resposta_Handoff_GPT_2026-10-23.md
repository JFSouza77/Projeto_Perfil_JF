# Resposta ao handoff consolidado do GPT (23/10/2026)

**Arquivo recebido:** `06_HANDOFF_CONSOLIDADO_PARA_CLAUDE.md`
**Conferido contra:** 1.7.10.9.2
**O que entrou:** as decisões do JF foram para a **1.7.10.9.3 · C.A.O.S. 4.6.4 · build 1831**.

## Uma correção de origem

O handoff atribui os **30 min da Corrida** ao Claude Code. Na verdade, a regra é **do JF**: na 1.7.10.6, o Claude tinha reduzido pra 20 min no balanceamento, e o JF mandou voltar pra 30 ("não pode ser reduzido"). A regra continua valendo; só a origem estava trocada.

## Decisões do JF que entraram na 1.7.10.9.3

| Decisão | Como ficou |
|---|---|
| Corrida sem Ano, com Animal do Júnior, mantendo Coisa | O baralho da Corrida tira todas as cartas de Ano. Animal vira **categoria própria** (antes, fora do Júnior, animal era anunciado como Coisa). O baralho é completado com animais do Júnior até ter o tamanho da maior das outras categorias (Pessoa, Lugar ou Coisa), pra as quatro saírem parecido. As regras na tela dizem "Pessoa, Lugar, Coisa e Animal. Na Corrida não tem Ano." |
| 15 s pra escolher a dica; se não escolher, abre uma sozinha, sem pular a vez | Feito. A dica aberta é **uma de verdade** (nunca uma especial), sorteada. Quem estava na vez responde. Aparece o aviso "demorou pra escolher: uma dica abriu sozinha". Os 5 s desse aviso não contam no tempo de resposta. A resposta continua com 25 s. No Hardcore e no Juízo Final nada muda: lá as dicas já abrem sozinhas. |
| Modo C.A.O.S. com 15 min | Feito (era 10). A rodada continua com teto de 5 min. |
| Lojinha: vitrine na hora, botões liberam depois de 3 s | Feito **nas duas lojinhas** (Corrida e Modo C.A.O.S.). Nos 3 primeiros segundos, aparece "Dá uma olhada na vitrine: os botões liberam em instantes". Depois disso, os botões liberam em todo dispositivo. O intervalo continua com 15 s, e se a partida pausar, a trava espera junto. |

## Respostas às perguntas da seção 7

1. **Melhor de três nos duelos do Modo C.A.O.S.?** **Não existe.** O duelo é decidido numa rodada só:
   - jokenpô: empate repete, **sem limite** de repetições;
   - dado: empate é rolado de novo na hora;
   - moeda e par ou ímpar: os lados são sorteados antes;
   - depois de perder, a vítima pode pedir **uma** revanche **dobro ou nada**.

   Então a proposta de "três empates no jokenpô e o C.A.O.S. sorteia" não conflita com nada. Ela só põe um limite onde hoje não tem.
2. **O que é "rodada" no Modo C.A.O.S.?** É uma **volta completa**: cada jogador recebe uma carta secreta e é Mestre dela; quando todo mundo foi Mestre (ou passaram 5 min), a rodada acaba. **No fim de cada rodada, todo mundo ganha os mesmos +10 PC.** A renda não é por turno de Mestre.
3. **15 min do Modo C.A.O.S. e as decisões da Corrida já estão no jogo?** Agora sim, na 1.7.10.9.3.
4. **O Espelho Refletor já reflete roubo?** **Sim.**
   - No roubo, na Mão Leve e no Assalto, o Espelho faz o ataque voltar: quem atacou perde 1 carta pro dono do Espelho (se tiver carta). O Colete só anula.
   - O "Revide/Troco" proposto (o roubo acontece e o portador rouba 1 de volta) termina com o placar empatado. Ou seja, é **mais fraco que o Espelho** e quase igual a ele.
   - Recomendação: deixar no backlog. Se quiser diferenciar, uma ideia é o Revide **revelar quem foi a Mão Leve** e pegar a carta de volta. Isso o Espelho não faz.
5. **Unidade da lojinha da Corrida:**
   - na vitória por **Tempo**, paga com os **pontos do placar**;
   - na vitória por **Cartas**, paga com **créditos**: cada acerto dá os segundos que sobravam na carta, e eles não contam no placar;
   - os preços são os mesmos nos dois casos;
   - no **Equipe**, cada jogador compra com o próprio saldo, e o placar da equipe é a soma dos jogadores, então a compra pesa na equipe.
6. **Imunidade da Rodada Bônus:** é rascunho, e quem decide é o JF. Minha recomendação está abaixo.

## Propostas e rascunhos que ficaram para o JF decidir

Nada disto entrou no jogo. Para cada item, minha recomendação:

| Proposta | Recomendação do Claude |
|---|---|
| Respiro de **6 s** no Modo C.A.O.S. (hoje 4,5 s) | Vale testar. É só trocar um número. Faço quando o JF disser. |
| Mensagem persistente da carta que hiberna ("volta na próxima vez deste Mestre") | Boa e de baixo risco. Hoje só aparece a última novidade no topo. |
| Estado dos itens em texto ("Pronto", "Guardado", "Usado") | Boa. A lojinha da Corrida já explica o "Usar" e mostra os guardados; dá pra estender aos dois modos. |
| Lojinha por **pedidos fechados com sorteio** (no lugar de quem clica primeiro leva) | Muda uma regra do JF ("quem comprar primeiro leva"). Só faço se o JF quiser. A trava de 3 s já tira boa parte da vantagem de quem tem o dedo mais rápido. |
| Item **+2** (roubo que leva 2 cartas) | Forte demais numa partida de 15 min, em que um placar típico é de 3 a 6 cartas. Se entrar: raro (peso 1, no máximo 1 por vitrine), caro (~50 PC) e sem valer na revanche. |
| Item **Revide/Troco** | Quase igual ao Espelho (resposta 4). Backlog, ou a versão que revela a Mão Leve. |
| Evento **Rodada Bônus** (todos menos o Mestre podem responder, os dois ganham PC) | Tem cara de Modo C.A.O.S. e é diferente da Batata. Sugestão pro protótipo: carta do evento separada; dicas a cada 8 s, como no Express; **+20 PC** pra quem acertou e pro Mestre; no lugar da imunidade ampla, **1 escudo contra o próximo efeito negativo** (mais fácil de explicar e de ver na tela). |
| Escolha da modalidade do duelo pelos duelistas | Boa ideia, e encaixa: cada um escolhe em segredo; se escolherem igual, vale essa; se não, sorteia entre as duas. Junto, o limite de 3 empates no jokenpô. |

## Itens de robustez da seção 2.4 (só pra registro)

Já cobertos e testados:
- **Autoridade única do host:** relógios, compras, resultados e mudanças de fase.
- **Sem ação aplicada duas vezes:** eventos repetidos são ignorados pelo identificador.
- **Retomada:** pausa, aviso, recarregar a página e troca de host retomam a partida.
- **Testes online cobrindo isso:** `teste_online --so=fundo` (host que cai de vez) e `--so=caos|corrida|duelo`, além das bateria de testes.

A sugestão de registrar dados para balancear continua no plano de telemetria (`docs/brainstorm/Telemetria.md`).
