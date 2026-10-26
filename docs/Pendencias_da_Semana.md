# Pendências da semana (26/10 a 29/10/2026)

Regra do JF (26/10/2026): nesta semana, bug, print ou sugestão que ele mandar fica só anotado aqui, sem corrigir,
pra poupar créditos. Só corrige na hora o que ele pedir "pra agora", e só aquilo. Na **quinta, 29/10, às 18h**
(Brasília), os créditos renovam e começam os patches com tudo desta lista.

## Corrigido na hora (pedido do JF)

- [x] **Categoria aparecia na T2 antes da hora** (26/10): a roleta do celular pousava na categoria (e a cor da caixa
  entregava) antes de o Mestre falar e tocar em "Mostrar a carta". Agora a T2 fica em "???" com "Escute: o Mestre vai
  dizer a categoria" até ele mostrar. O Mestre continua vendo a categoria. Teste novo em `teste_telao.js` (falha na
  versão antiga). Commitado no v1.9, **ainda não publicado**.

## Bugs (do teste de mesa de domingo, 25/10, com as crianças)

- [ ] **Dica errada aberta** (T2): pediram a dica X e abriu a Y, sem o Mestre forçar. O JF não tem 100% de certeza.
  Investigar o caminho pedido → abertura (pedidoDica, trava, número tocado).
- [ ] **Vez da Elisa pulada** por um bug no tablet do João Carlos. Caso bem específico; o JF vai tirar prints da T2
  e testar com calma pra descrever melhor.
- [ ] T2 com "bugzinhos enjoados" no geral: esperar os prints do JF.

## Teste do JF em 26/10 (PC = host, como JF · celular = convidado, como Anne)

Prints numerados na ordem em que chegam; o JF responde dúvida pelo número.

- [ ] **Host entrou errado de novo**: pediu pra escolher quem joga no aparelho (o mesmo problema de antes). Sem print
  desta vez; o JF tira se repetir.
- [ ] **Print 1 · intervalo "Antes da próxima carta" (host)**: o botão "Próxima carta" fica espremido no canto, ao
  lado do título; rever a posição e o tamanho (centralizar, mais destaque, longe do título).
- [ ] **Print 2 · T2 do host na vez do JF**: tela confusa.
  - A T2 é uma coluna estreita por cima do jogo e o jogo aparece pelos lados (pedaços cortados como "Me" e "JF").
  - Duas grades de números: a grande pra escolher e a pequena da carta logo abaixo.
  - "JF pediu a dica 7" fica longe da grade em que ele tocou.
  - A categoria aparece duas vezes ("Categoria Pessoa" no topo e o selo "Pessoa" na carta).
  - "Neste aparelho: JF · Vez de JF" repete o que o "SUA VEZ!" já diz.
  - Rumo: centralizar e reorganizar botões e falas (entra no rework da T2).

## Sugestões

- [ ] **T2: dica escolhida bem evidente** (pode ficar pra T2 viva, 1.9): ao escolher, as outras apagam e a escolhida
  fica destacada, igual já é na tela do Mestre (1.7.10.9.x).
- [ ] **Tempo de escolha da dica e tempo que a dica fica aberta**: rever.
- [ ] **Cartas de Ano muito difíceis** (2.0): revisar as de Ano no rework; até a Elisa, que joga Old School e
  Hardcore, tem dificuldade com elas.

