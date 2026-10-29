# Pendências da semana (26/10 a 29/10/2026)

Regra do JF (26/10/2026): nesta semana, bug, print ou sugestão que ele mandar fica só anotado aqui, sem corrigir,
pra poupar créditos. Só corrige na hora o que ele pedir "pra agora", e só aquilo. Na **quinta, 29/10, às 18h**
(Brasília), os créditos renovam e começam os patches com tudo desta lista.

## Corrigido na hora (pedido do JF)

- [x] **Categoria aparecia na T2 antes da hora** (26/10): a roleta do celular pousava na categoria (e a cor da caixa
  entregava) antes de o Mestre falar e tocar em "Mostrar a carta". Agora a T2 fica em "???" com "Escute: o Mestre vai
  dizer a categoria" até ele mostrar. O Mestre continua vendo a categoria. Teste novo em `teste_telao.js` (falha na
  versão antiga). Commitado no v1.9, **ainda não publicado**.

## Patches de quinta, 29/10 (v1.9, ainda não publicados)

Feito, com teste:
- [x] Dica escolhida na tela do Mestre: sem balanço; respira e flutua devagar.
- [x] T2 no iPhone: faixa da cor do fundo na área da hora/bateria (o conteúdo não passa mais por baixo).
- [x] Balão do C.A.O.S. no celular foi pra baixo da tela (não cobre mais Mestre/vez/categoria).
- [x] "Pergunte ao C.A.O.S.": a resposta vem com o rosto dele.
- [x] Falas do cadastro de nomes (nickDemora e cia.) ficam só no host; não vão pra quem espera a sala.
- [x] Intervalo na T2: sem "sorteando…", sem "pausado", sem "Sua vez"; sem o quadro repetido com a roleta "???".
- [x] Intervalo do host: "Próxima carta" centralizado e grande, embaixo do relógio.
- [x] T2 com uma grade só de números; a dica pedida fica acesa e as outras apagam.
- [x] Categoria uma vez só na T2; "Neste aparelho: JF · Vez de JF" sem repetir a vez.
- [x] Resposta legível no celular do Mestre; "Virar a carta" grande e pulsando também na carta virada.
- [x] **Dica errada aberta**: causa provável achada. Se a T2 se redesenha no meio do toque, o "clique" do celular
  caía no botão novo embaixo do dedo (os números mudam de lugar quando uma dica abre); e o botão usava a lista de
  ações do momento do toque, não a desenhada. Agora só vale o toque que começou no próprio botão, e a ação é a
  desenhada.
- [x] Sala velha no link (print 3): a tela diz que não achou a sala e oferece "Entrar com outro código".

Ficou pra perguntar ao JF:
- [ ] **Host entrou errado**: não reproduzi. Sala nova começa sem lugares guardados e, quando a partida começa, quem
  não tem celular vai pro host sozinho. Preciso de print da tela que pediu a escolha (era no PC ou no celular?).
- [ ] Print 8: "SUA VEZ! ANNE" aparece antes de o Mestre mostrar a carta. Esconder até a carta ser mostrada?
- [ ] Prints 11 e 12: no intervalo, a próxima Mestre já vê a resposta e o "Virar a carta". Separar (só depois do
  intervalo) ou manter (dá pra começar antes)?
- [ ] Vez da Elisa pulada (tablet do João Carlos): esperando prints.

## Bugs (do teste de mesa de domingo, 25/10, com as crianças)

- [ ] **Dica errada aberta** (T2): pediram a dica X e abriu a Y, sem o Mestre forçar. O JF não tem 100% de certeza.
  Investigar o caminho pedido → abertura (pedidoDica, trava, número tocado).
- [ ] **Vez da Elisa pulada** por um bug no tablet do João Carlos. Caso bem específico; o JF vai tirar prints da T2
  e testar com calma pra descrever melhor.
- [ ] T2 com "bugzinhos enjoados" no geral: esperar os prints do JF.

## Teste do JF em 26/10 (PC = host, como JF · celular = convidado, como Anne)

Prints numerados na ordem em que chegam (salvos em `docs/prints_teste_2026-10-26/`); o JF responde dúvida pelo número.

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

### Celular (convidado, como Anne) · prints 3 a 18

Pedidos do JF:
- [ ] **Rework da T2, urgente**: muita informação, poluída e bagunçada.
- [ ] **C.A.O.S. na sala de espera**: o rosto dele não aparece nas respostas do "Pergunte ao C.A.O.S." (prints 5, 6);
  e quando o balão com rosto aparece, é uma fala do lobby de criação de jogadores, fora de contexto pra quem espera
  (print 9: "Tenta juntar um bicho com uma coisa legal. Tipo Tubarão Foguete"). Rever as informações dessa tela.
- [ ] **Dica escolhida na tela do Mestre**: o balanço ficou exagerado. Deixar sutil: pulsar devagar, flutuar ou
  piscar de leve, minimalista, mas ainda em destaque.

O que o Code viu (confirmar com o JF antes de mexer no que não for pedido):
- Print 3: "Entrando na sala…" procurando a sala **PXLG**, mas a sala do teste era **FQRJ** (prints 4+). Parece
  que o celular tentou voltar pra uma sala antiga guardada. Ligar com o problema do host entrar errado?
- Prints 4 a 6: sala de espera ok no geral; dica, tutorial, perguntas e voz. Só o rosto do C.A.O.S. falta.
- Print 7, 10, 16, 17: ao rolar, o conteúdo passa por baixo da barra do iPhone (hora e bateria por cima do texto).
  Falta respeitar a área segura do topo.
- Print 8: carta ainda escondida ("Categoria: sorteando…") e a roleta já mostra "Eu sou UMA COISA". **Já corrigido
  hoje** (v1.9, falta publicar). Também mostra "SUA VEZ! ANNE" antes de a carta ser mostrada; cedo demais?
- Prints 9, 11, 13: os balões do C.A.O.S. cobrem o topo da T2 (Mestre/vez/categoria).
- Prints 11 e 12: no intervalo, a Anne (próxima Mestre) já vê "Só você vê: Sherlock Holmes" e o botão grande
  "Virar a carta"; o intervalo e a próxima carta misturados na mesma tela.
- Print 13: Mestre com a resposta aberta direto (botão branco com letra dourada, pouco contraste) e muita coisa
  repetida (Mestre: você, Vez de: JF, que o topo já mostra).
- Print 15: o botão "Virar a carta" da carta virada para baixo é pequeno e cinza, enquanto no intervalo (print 12) ele
  é grande e roxo. Padronizar.
- Print 17: intervalo com "Continuar" e logo abaixo outro quadro "Intervalo: a próxima carta já vem" com a roleta
  "???": informação repetida.
- Print 18: no intervalo, o topo diz "Categoria: sorteando…" e "Tempo da vez: pausado", e o painel diz "Sua vez";
  no intervalo não tem carta nem vez correndo.

## Sugestões

- [ ] **T2: dica escolhida bem evidente** (pode ficar pra T2 viva, 1.9): ao escolher, as outras apagam e a escolhida
  fica destacada, igual já é na tela do Mestre (1.7.10.9.x).
- [ ] **Tempo de escolha da dica e tempo que a dica fica aberta**: rever.
- [ ] **Cartas de Ano muito difíceis** (2.0): revisar as de Ano no rework; até a Elisa, que joga Old School e
  Hardcore, tem dificuldade com elas.

