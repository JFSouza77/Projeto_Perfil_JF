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
