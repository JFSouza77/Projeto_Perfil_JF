# Diário do Code

Manual do Code pra ele mesmo (ideia do JF, 30/10/2026). **Antes de caçar um bug, procurar aqui pelo sintoma.** Depois
de cada correção, escrever uma entrada nova no topo do Registro e, se for um sintoma novo, uma linha no Mapa.

Formato da entrada: **o que o JF viu** → **causa de verdade** → **o que mudou** (arquivo e função) → **teste que
segura**. Sem rodeio: é pra achar rápido.

## Mapa de sintomas (onde olhar primeiro)

| Sintoma relatado | Suspeitos de sempre |
|---|---|
| C.A.O.S. calado quando alguém entra | janela abrindo por cima (`caosModalBase` chama `caosLimparFalaParaJanela` e apaga a fala); respiro entre falas (`caosToastBloquear`); `caosBoasVindasQuandoPuder` |
| Fala só no balão, sem voz | filtro "Mestre, leia" (`CAOS_MASTER_RE` / `caosSpeechIsForMaster` em 06-voz); `caosMudoCarta`; voz desligada; fala que foi pro celular (`redeFalaSoLonge`) |
| Fala cortada / sumiu | `showToastMessage` (janela aberta > 25 s descarta), `caosToastBloquear` (orçamento, respiro, Corrida, Modo C.A.O.S.), `caosSilenced`; ver `caosEmit("cortada")` |
| Cérebro (Inspetor) não muda de cor | a cor é a emoção que manda (`caosConsole.mostra`), não o vetor; estabilizador `CAOS_CONSOLE_CFG.dwell`; Sandbox usa `caosSandboxSentir` |
| Nome conhecido (Anne, amigos) tratado como estranho | Anne desligada por padrão (`anneLigada`, Cérebro → Falas); emoji exclusivo (`sanitizePlayerAvatar`); `presenteDe`; `nickEmprestado` (nick com cadastro sem PIN) |
| Pergunta do cadastro / PIN | `contaAoCadastrar` e `contaOferecer` (05t-contas) |
| Botão que pisca demais / "autoritário" | `.guia-pulso` (10-rede.css, guia da mesa), `.cta-pulsa`, `.number-btn.pedida` |
| Mesa travada, ninguém sabe o que fazer | guia da mesa (16-guia-da-mesa.js): `guiaQuemAge`, `guiaTick`, `guiaCutucar` |
| T2 (celular) mostrando coisa errada | `telaoDesenhar` (05h-telao), `redeBotoesHtml`, `redeMestreCartaMontar`, `.rede-host-vista` (05k-rede) |
| Toque abriu a dica errada no celular | toque fantasma após redesenho: `redeToqueSeguro` e o retrato `opsDesenhadas` (05k-rede) |
| SUA VEZ / resposta aparecendo cedo no celular | `redeBotoesHtml` e `redeEuPapelTxt` (05k-rede): faixa só com a carta mostrada, nada da próxima carta no intervalo |
| Link de sala que não existe mais | `.rede-sala-velha` / `#redeOutroCodigo` (05k-rede) |
| Categoria aparecendo antes da hora no T2 | `telaoRoletaHtml(c, esconder)` (05h-telao) |
| Botão Adicionar "não faz nada" | `cadPodeAdicionar` / `cadFaltaTexto` / `cadGuiarFalta` (05-tela) e o clique em 11-iniciar |
| Teste online da Corrida Hardcore travou | intermitente conhecido (intervalo aberto com `jan:true`); rodar de novo com `--so=corrida` antes de caçar |
| Teste online "Modo C.A.O.S. até o fim" estourou 300 s | visto 1 vez na bateria inteira da 1.9.1 (máquina carregada); `--so=caos` passou 8/8 na 1.9.1 e na 1.9.0. Se repetir sozinho, aí caçar |
| Build (`--testar`) parou em "adicionar Ana" | o roteiro do build.js e o auditar_botoes esperam o Adicionar incompleto; desde a 1.9.1 ele fica `.bloqueado` (nunca `:disabled`) |
| Teste falhou logo depois de mudar fala | inventário desatualizado: `node ferramentas/caos_inventario.js`; contagens fixas em `teste_guia` e afins |

## Registro (mais novo primeiro)

### 31/10/2026 · 1.9.2 · respostas do JF aos prints 8, 11 e 12

- **"SUA VEZ" aparecendo antes de a carta ser mostrada (print 8).** O JF quis esconder. Mudou: `redeBotoesHtml` só põe a
  faixa da vez com `estadoCarta === "revealed"` (antes, a linha "Você começa assim que o Mestre mostrar a carta", em
  `redeEuPapelTxt`); a vista do host faz o mesmo. Teste: `teste_t2_vez`.
- **No intervalo, o próximo Mestre já via a resposta e o Virar a carta (prints 11 e 12).** O JF: "quebra a experiência".
  Mudou: sem `rede-segredo` e sem os botões virarCarta/sacarCarta/roletaCategoria quando `r.intervalo` (convidado) ou
  `tabLobbyFimEm()` (vista do host). Os índices dos botões (`data-op`) continuam os mesmos (vira `null`, não some da lista).

### 30/10/2026 · 1.9.1 · demonstração do JF pra uma pessoa de fora

- **"O C.A.O.S. não falou quando eu entrei, só quando removi e adicionei de novo."**
  - Causa: o `addPlayer` cumprimentava e logo abria a pergunta "quer cadastrar o nick?"; `caosModalBase` apaga a fala na
    hora (balão e voz).
  - Mudou: `contaAoCadastrar(p, rede, perguntar, pronto)` chama `pronto` só depois da pergunta e com a tela livre;
    `addPlayer` passa `caosBoasVindasQuandoPuder` (07-momentos), que também espera o respiro.
  - Teste: `teste_cadastro_caos` (jfCumprimentado, anneCumprimentada, anneNaoCortada).
- **"Ele não falava nada da minha namorada."**
  - Causa: a mesma janela, mais o respiro: o segundo cumprimento caía em "orçamento ou respiro" e era descartado.
  - Lembrete: as falas da Anne só existem com a opção ligada no Cérebro (aba Falas); desligada por padrão.
- **"Mexia na paciência e no estresse e as cores do cérebro não mudavam; o balão mudava sozinho."**
  - Causa: a cor do cérebro (`caosNeuralDesenhar`) é `caosEmocaoGlobal()` = emoção que manda no console, que só
    avança quando ele fala (dwell 3). O balão era a "cosquinha" (`caosCutucado`), de propósito.
  - Mudou: `caosSandboxSentir` (02-cerebro-adm) mexe nas emoções ligadas ao botão e chama
    `caosConsoleAvancar(..., forcar)`; novo ♻️ Restaurar de fábrica (`caosCerebroFabrica`).
- **"Demorei pra clicar e ele só comentou em texto, sem voz."**
  - Causa provável: a cutucada do guia pro Mestre ("lê pra mesa") batia no `CAOS_MASTER_RE` e a voz era calada.
  - Mudou: `caosSpeak` libera quando `caosLastPick.bank` começa com `guia.`. Não deu pra confirmar qual frase o JF viu:
    se repetir, pedir print.
- **"As dicas piscando parecem mandar eu clicar."**
  - Mudou: `.guia-pulso` sem crescer, 2,8 s, 3 respiros e depois só contorno leve.
- **Ideia: C.A.O.S. guiando a criação do jogador.**
  - Feito: `cadGuiarFalta` + banco `cadFalta` (30 falas); o Adicionar fica tocável (`.bloqueado` + `aria-disabled`).
- **"Botão Já falei a categoria: letra com contorno esquisito no roxo; queria ele mais reativo."**
  - Causa: `text-shadow` neon amarelo/laranja em `.cta-pulsa` (10-rede.css).
  - Mudou: sombra escura fina; guia insiste até 3 vezes no `mostrar` (`guiaBancoMostrar`: cochicho, depois pelo humor) e
    o botão balança de leve (`ctaCutuca`).

### 26 a 30/10/2026 · 1.9.0 · teste do JF com a família (prints 1 a 18)

- Categoria aparecendo no T2 antes do Mestre falar → `telaoRoletaHtml` com `esconder`.
- Dica errada aberta → toque fantasma após redesenho → `redeToqueSeguro` + `opsDesenhadas`.
- Falas do lobby aparecendo no celular → `redeFalaSoDoHost` (bancos `nick*` ficam no host).
- Sala velha no link → aviso `.rede-sala-velha`.
- Não reproduzido: "host entrou errado" (esperando print do JF).

### 31/10/2026 · lote da partida por categoria (pedido do JF, entra na próxima versão)

- **"Tá desnivelado: Pessoa vai ter 520 e Ano 255. Sorteia 400 por partida, 100 de cada categoria."**
  - Antes: com o banco maior que o limite do modo, o recorte do lote era um só, às cegas (`cartasPreferirNovas(shuffle(allCards)).slice`).
    A categoria grande enchia o lote. O `embaralharEquilibrado` depois equilibrava a ordem, mas sobre um lote torto.
  - Mudou: `loteBalanceado(cards, limite, alvo)` (09-utilitarios.js), chamado no `resetDeck`. Cada categoria entra com a
    mesma cota (Clássico 100 de cada; Hardcore pelos pesos 30/30/20/20), com as cartas que não saíram recentemente na
    frente. Categoria curta: o que falta é completado com as outras. Express (já monta o próprio lote) e Modo C.A.O.S. não mudam.
  - Teste: `ferramentas/teste_lote.js` (9/9), com um banco simulado da 2.0. `teste_baralho` e `teste_corrida` continuam OK.
  - Container novo sem `playwright-core`: `_navegador.js` cai pro `playwright` global.

### 04/11/2026 · teste do cérebro falhando "às vezes" (achado na bateria do Natal, não foi o JF)

- **"Igualdade" do `teste_cerebro` falhava em ~1 de 3 rodadas, inclusive no main.**
  - Causa: o teste mocka `Math.random` e `Date.now`, mas o estado do C.A.O.S. no começo do roteiro dependia da carga
    da página (temperamento sorteado e vetor emocional). Às vezes uma rodada começava com o temperamento "normal" e
    as outras não. Aí o peso da alegria e do carinho mudava, a mistura de rostos saía diferente e o sorteio desalinhava.
  - Mudou (só no teste): o roteiro começa com `caosCerebroFabrica()` e recomeça o sorteio do zero (`window.__semear`).
    O jogo não mudou.
  - Teste: `teste_cerebro` passou 5/5 em 3 rodadas no build do Natal e em 2 no main (antes oscilava).

### 04/11/2026 · Natal: contador "409 de 400" (achado no print do item 9 das temporadas)

- **Na tela da partida, com o Natal ligado: "Cartas restantes no baralho: 409 de 400".**
  - Causa: `temporadaCartasNoBaralho` somava as 10 cartas de Natal num baralho que já estava no limite do modo.
  - Mudou: com o baralho no limite, as de Natal tomam o lugar das últimas 10 cartas a sair (nunca de outra de Natal).
  - Teste: `teste_temporadas` › `baralhoNaoPassaDoLimite` (falha sem a correção, passa com ela).


### 05/11/2026 · emoções calibradas e voz contínua (lista de quinta do JF, entra na próxima versão)

- **Tédio que não passava:** depois da mesa parada, o C.A.O.S. seguia entediado por ~20 cartas, mesmo com a mesa
  jogando de novo.
  - Causa: só o tempo derretia o tédio; acerto e erro não mexiam nele.
  - Mudou: acerto tira 0,8 de tédio e erro tira 0,4 (com 6 erros seguidos ou mais, não tira: a mesa empacou).
  - Teste: `teste_emocoes` › "Tédio vai embora" (era 20 a 24 cartas; agora 4 a 8).
- **Temperamento do dia quase não aparecia:** rabugento e generoso reagiam igual a erro em série (os dois magoados).
  - Mudou: raiva pesa mais com tensão do dia (0,15 → 0,25) e a tristeza pesa menos (rabugento e elétrico se irritam;
    normal e generoso se magoam).
  - Teste: `teste_emocoes` › "Erro em série" (falha sem a mudança).
- **Voz picada:** na voz da nuvem cada frase era um áudio, com respiro e entonação recomeçando.
  - Mudou: fala com uma emoção só e até 300 letras vai num pedido só (`vozNuvemJuntar`).
  - Teste: `teste_voz` › "Duas frases, uma emoção: um pedido só".
- **💡 Sugestões (pedido do JF: "aba de sugestões e feedback pros jogadores"):** botão no menu ⋮ da tela inicial e na
  Pausa. Categoria e texto (até 500 letras), sem nome e sem retrato da partida. Vai pela fila do Reportar problema
  (sem internet, guarda e manda depois) e aparece na página dos reportes do JF, seção 💡 Sugestões (também no
  formato texto). O servidor recusa sugestão vazia e guarda no máximo 1.000.
  - Arquivos: `src/js/05u2-sugestoes.js`, `servidor/worker.js` (tipo "sugestao", prefixo `s:`), CSS das janelas.
  - Teste: `teste_sugestoes` (9 conferências, com o servidor local).
- **🏅 Medalhas da temporada (ideia do JF, 04/11):** vitória por joias no Júnior, no Clássico e no Old School durante
  a temporada dá a medalha dela ("natal-2026"). Fica na ficha (sobe com o cadastro); nick emprestado não conta. O
  C.A.O.S. comenta o progresso (10 falas) e a conquista (10 falas); quem ganha escolhe se mostra ao lado do nome no
  placar. Desenho em SVG nas cores de cada temporada, com o emoji dela.
  - Arquivos: `src/js/05y2-medalhas.js`, `fichaLimpa` (08-salvamento), `caosMemFimDePartida`, placar (05-tela), CSS.
  - Teste: `teste_medalhas` (16 conferências, inclusive "o jogo não muda").
- **Pente fino de acessibilidade (lista de quinta do JF):** o `auditar_botoes.js` ganhou `--axe=` (axe-core, WCAG 2.2
  A/AA, em todas as telas do roteiro, Noturno e Claro) e passou a contar a transparência dos botões (antes só no texto
  solto). Achados e correções:
  - Humores não escolhidos ficavam com 35% de opacidade (1,7 a 3:1), mas continuam clicáveis: agora menos cor e letra
    legível (o escolhido segue com o brilho). 💀 Nível 0 no Noturno com vermelho mais claro.
  - 🥔 Batata e 🗣️ Voz desligados no Claro: 4,0 e 4,45:1 → sem transparência (a borda tracejada mostra o desligado).
  - Título do resumo das regras e rostinho do recado no Claro: tinta mais escura.
  - Nome do botão diferente do texto na tela (WCAG 2.5.3, quem usa comando de voz): recado do C.A.O.S., Jogar online
    e 💡 Sugestões. O rostinho do recado agora é desenhado pelo CSS.
  - Apagado de propósito (➕ Adicionar incompleto, humor travado no passo) é isento e o auditor sabe disso.
  - Roteiro do auditor ganhou a tela final, a 💡 sugestão e a 🏅 medalha (69 telas); os botões Fechar e Guardar das
    janelas novas ganharam 44 px e cor legível no Claro.
  - Teclado: Esc fecha as janelas de recado (reportes, sugestão; na medalha vale "Guardar sem mostrar"); a janela da
    medalha abre com o foco no botão. As janelas de decisão da partida não fecham com Esc (de propósito).
  - Resultado: auditor zerado nos 3 temas e axe com 0 regras quebradas.

### 06/11/2026 · nick com cadastro entrava sem PIN (relato do JF, na 1.9.4)

- **O JF adicionou os nicks da família e o dele, todos com cadastro, e o jogo não pediu PIN nenhum.**
  - Causa provável (no aparelho dele): quem criou o cadastro naquele aparelho deixou o login guardado ali, e o jogo
    usava o login guardado sem perguntar. Num aparelho sem login, aparecia a pergunta, mas "Agora não" deixava
    entrar mesmo assim. E o tratamento de quem o C.A.O.S. conhece (JF, Anne, amigos, família) era só pelo nome.
  - Mudou (`05t-contas.js`, portão do PIN):
    - nick com cadastro só entra como o dono depois do PIN, mesmo com login guardado;
    - PIN digitado no 🔐 Cadastro nos últimos 5 minutos vale;
    - sem internet, o PIN é conferido no aparelho (PBKDF2 guardado no último login);
    - sem o PIN: "Usar outro nick" (com sugestão) ou "🛠️ ADM libera como convidado" (sem memória e sem o tratamento
      do dono).
  - Reconhecimento: `isJfName`, `isAnneName`, `presenteDe` e `sobrinhoInfo` só dizem sim pro dono confirmado; o
    formulário usa as versões `…NomeBruto`.
  - O valor da senha do ADM saiu do código (o sorteio da senha do host compara pelo embaralhado; o teste usa uma senha
    de mentira).
  - Teste: `teste_portao_pin` (10 conferências); `teste_cadastro_caos`, `teste_acoes` e `teste_remover_jogador`
    ajustados pra regra nova; `teste_contas` ok com o servidor local.

### 07/11/2026 · teste da "gafe" das temporadas falhando às vezes

- **Sintoma:** `teste_temporadas` deu `FALHA gafeFalaErradaEConserta` numa rodada e passou na seguinte.
- **Causa:** a gafe (o C.A.O.S. solta a fala de outra data e se corrige) sorteia entre as temporadas com falas. Desde
  06/11 o aniversário do criador também tem falas, e a checagem só reconhecia palavras de Natal e Ano Novo. O jogo estava
  certo; o teste é que estava velho (falhava em ~1 de cada 15 sorteios).
- **Mudou:** a checagem reconhece também as falas de aniversário (aniversário, Parabéns, Balões, criador, 2 de janeiro).
  Conferido com 400 sorteios: 0 falhas. Teste: `teste_temporadas` (2 rodadas seguidas ok).

