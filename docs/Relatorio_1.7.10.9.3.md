# Relatório da 1.7.10.9.3 (23/10/2026) · pra o JF avaliar

C.A.O.S. 4.6.4 · build 1831.

## Pedidos do JF (já no jogo)

| Pedido | Como ficou |
|---|---|
| Corrida sem Ano, com Animal do Júnior | Ano saiu do baralho da Corrida. Animal virou categoria própria e foi completado com bichos do Júnior até ficar do tamanho da maior categoria. |
| 15 s pra escolher a dica, abrindo uma sozinha | Se ninguém escolher, abre uma dica de verdade sorteada (nunca uma especial) e a mesma pessoa responde, com 25 s. Não perde a vez nem leva castigo. |
| Modo C.A.O.S. com 15 min | Feito. |
| Lojinha com 3 s de leitura | Feito nas duas lojinhas: a vitrine aparece na hora e os botões liberam depois de 3 s. |
| Respiro de 6 s | Feito no Modo C.A.O.S. (era 4,5 s). |
| Aviso da carta dormindo | Aviso fixo: "Ninguém acertou a carta de X. Ela está dormindo e volta na próxima vez de X, com a dica N". No placar, a carta mostra "💤 dormindo". A resposta nunca aparece. O aviso some quando a carta acorda. |
| Duelo em melhor de 3 | Roubo com duelo e revanche: quem ganhar 2 rodadas leva. A tela mostra "Melhor de 3 · rodada N · placar". Cada rodada tem o seu aviso animado. |
| Intervalo de 20 s | Na Corrida (entre cartas) e no Modo C.A.O.S. (entre rodadas). Os dois têm lojinha com a trava de 3 s, então ficam iguais. |

## Decisões que eu tomei (você só avalia)

1. **Jokenpô: no máximo 3 empates seguidos.** Antes, empate repetia sem limite. Com o melhor de 3, um duelo podia não acabar. No 3º empate seguido, o C.A.O.S. sorteia quem leva **aquela rodada**, não o duelo inteiro. *(Ideia do GPT.)*
2. **Intervalo de 20 s também no Modo C.A.O.S.** Você falou de "intervalo entre cartas", que é o da Corrida. Apliquei nos dois porque a trava de 3 s está nas duas lojinhas. Se quiser 15 s no Modo C.A.O.S., é um número.
3. **A revanche também é melhor de 3.** Mantém a regra igual no duelo e na revanche. A revanche continua "dobro ou nada".
4. **Itens explicados no Modo C.A.O.S.** Antes, o painel mostrava só o ícone do item guardado. Agora cada item tem nome e uma frase de quando funciona: "use na janela da dica", "use logo depois de errar", "guardado: protege você sozinho". *(Ideia do GPT, versão simples.)*
5. **A dica que abre sozinha é sorteada entre as de verdade.** Assim nunca cai uma especial ("Perde a vez") sem a pessoa escolher.
6. **Animal do tamanho da maior categoria.** Se eu colocasse todos os 93 bichos do Júnior, Animal viraria 1/3 do baralho. Completei só até empatar com a maior das outras (Pessoa, Lugar ou Coisa).

## Tempo que um duelo leva agora (pra você sentir o ritmo)

| Duelo | Tempo aproximado |
|---|---|
| Dado ou moeda | ~3,5 s por rodada + ~5,5 s de aviso. Melhor de 3: de 18 a 27 s. |
| Jokenpô ou par ou ímpar | até 12 s pra escolher + aviso por rodada. Normalmente de 30 a 50 s. |

O relógio da partida **não corre** durante o duelo. Se ficar longo demais na mesa, dá pra baixar a janela de escolha de 12 pra 8 s.

## Ficou pra você decidir

- Lojinha por pedidos com sorteio, no lugar de "quem comprar primeiro leva".
- Item +2.
- Revide.
- Rodada Bônus.
- Duelistas escolherem o tipo de duelo.

As recomendações estão em `docs/Resposta_Handoff_GPT_2026-10-23.md`.
