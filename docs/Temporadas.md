# Temporadas: o jogo no clima de cada data

Pedido do JF em 30/10/2026. O jogo olha a data do aparelho e entra no clima da época: visual, falas do C.A.O.S. e
cartas da temporada valendo o dobro. Tudo é feito aos poucos, no branch `temporadas`. **Nada é publicado sem o JF ver
e autorizar.** Quando tudo estiver pronto, o Code avisa e mostra o que fez.

## As 15 temporadas

| # | Temporada | Quando (janela) | Clima |
|---|---|---|---|
| 1 | Ano Novo | 31/12 a 1/1 | fogos, brinde, contagem regressiva |
| 2 | Aniversário do criador | 2/1 | festa pro JF; o C.A.O.S. pega leve com ele nesse dia |
| 3 | Carnaval | sábado até a Quarta de Cinzas (data móvel) | confete, serpentina, marchinha |
| 4 | Dia da Mulher | 8/3 | homenagem com fatos (cartas de mulheres marcantes) |
| 5 | Páscoa | Sexta-feira Santa ao domingo (data móvel) | ovos, coelho, chocolate |
| 6 | Dia das Mães | 2º domingo de maio | homenagem |
| 7 | Dia dos Namorados | 12/6 | corações; o C.A.O.S. faz piada de casal |
| 8 | Festa Junina | o mês de junho inteiro | bandeirinhas, fogueira, quadrilha |
| 9 | Dia dos Pais | 2º domingo de agosto | homenagem |
| 10 | Folclore | 22/8 | Saci, Curupira, Iara (ótimo pro Júnior) |
| 11 | Independência | 7/9 | verde e amarelo, com fatos |
| 12 | Dia das Crianças | 6/10 a 12/10 | o C.A.O.S. fala mais no Júnior |
| 13 | Halloween | 20/10 a 31/10 | abóboras, morcegos, teia; "olha a bruxa" |
| 14 | Black Friday | a sexta e o fim de semana (data móvel) | etiquetas de "desconto"; o C.A.O.S. zoando a "promoção" |
| 15 | Natal | 1/12 a 30/12 | neve leve, luzinhas, gorro no C.A.O.S. |

- **Se duas datas caírem juntas,** vale a de um dia só (ex.: o Dia dos Namorados ganha da Festa Junina no dia 12/6).
- **Datas móveis** são calculadas pelo próprio jogo. Pra conferir: em 2027, o Carnaval cai na terça 9/2 e a Páscoa em 28/3;
  o Dia das Mães em 9/5, o Dia dos Pais em 8/8 e a Black Friday em 26/11.
- **Pra conversar com o JF depois:** outras datas (Consciência Negra, Dia do Professor, Dia do Gamer…). A lista acima é a
  base e pode crescer.

## Regras

- **Liga e desliga:** uma opção "Temporadas" nas configurações, ligada por padrão.
- **Só aparência e falas,** com uma exceção pedida pelo JF: **carta da temporada vale o dobro de pontos** durante a
  janela, com um selo na carta (🎃, 🎄, 🎉…). Fora da janela, ela é uma carta comum ou nem aparece.
- **Quantidades terminam em 0 ou 5:** 15 temporadas, 15 falas do C.A.O.S. por temporada (225 no total), 10 cartas por
  temporada (150 no total).
- **Júnior:** só falas e cartas leves. As datas de homenagem usam fatos, sem tomar partido (mesma regra das cartas de
  tema pesado).
- **Movimento leve:** os enfeites respeitam o "reduzir movimento" do aparelho e não cobrem texto nem botões.
- **Online:** cada aparelho segue a própria data. Na dúvida, vale a data do host pra pontuação dobrada (assim todos
  contam igual).
- **Pra testar fora da época:** um modo de teste força a temporada (ex.: `?temporada=natal`), só pra desenvolvimento.

## Ordem de trabalho (um pedaço por dia)

1. [ ] Motor de temporadas: data → temporada, datas móveis, prioridade, opção nas configurações, modo de teste e teste automático.
2. [ ] Visual de cada temporada: cores e enfeites leves, sem atrapalhar a leitura.
3. [ ] Selo na splash ("🎃 Edição Halloween", "🎄 Edição de Natal"…).
4. [ ] Falas do C.A.O.S.: 15 por temporada, com acessório no rosto (chapéu de bruxa, gorro, confete…).
5. [ ] Aniversário do criador (2/1): o C.A.O.S. parabeniza o JF e pega leve com ele nesse dia.
6. [ ] Dia das Crianças: falas extras do C.A.O.S. no Júnior.
7. [ ] Cartas da temporada: 10 por temporada, auditadas, valendo o dobro na janela.
8. [ ] Bateria de testes, build, prints de cada temporada e relatório pro JF.

## Progresso

- 30/10/2026: plano criado; tarefa diária agendada (por volta de 8h45, horário de Brasília) pra ir fazendo um pedaço por vez.
