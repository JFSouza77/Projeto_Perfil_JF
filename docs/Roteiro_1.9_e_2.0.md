# Roteiro: 1.9 (T2 viva) e Beta 2.0 (Rework Update)

Decidido pelo JF em 26/10/2026, logo antes de publicar a 1.8.0 (C.A.O.S. Expansion Update).

## Beta 1.9 · a tela secundária (T2) ganha vida

O próximo foco é a T2, a tela do celular de quem não está com o dispositivo da mesa. Hoje ela tem pouca coisa pra fazer
enquanto a pessoa espera. A ideia é dar o que fazer sem sobrecarregar, como foi feito na sala de espera (1.7.10.9.7):

- dicas de como jogar passando de tempos em tempos;
- o C.A.O.S. mexendo com quem está esperando ("E aí, ainda esperando a sua vez? Vai demorar…");
- mais informação útil da partida (sem entregar a resposta), no ritmo da espera.

## Beta 2.0 · Rework Update

Revisar, corrigir e reestruturar o projeto inteiro: "quase destruir pra reconstruir", sem modo novo.

| Frente | O que o JF pediu |
|---|---|
| Código | revisar, corrigir e reestruturar tudo |
| Visual | animações, detalhes e cores novas |
| Funções novas | tradução (multilíngue); outras funções (não modos) |
| Cards Expansion 2.0 | passar de 1.500 cartas no total (pelo menos 500 novas; hoje são cerca de 1.000) |
| C.A.O.S. | reestruturar vozes e bancos de falas, conferir fala por fala; geradores de ~30 mil combinações pra pelo menos 50 mil |
| Testes | parar com os testes básicos e focar em testes lógicos, de desempenho e de qualidade |
| Temas | conferir modo claro e escuro; o claro é o que sempre quebra |
| Acessibilidade | menu revisto, funções novas (alto contraste e outras ideias) |
| Servidores | conferir os servidores e a nuvem |
| Botões | conferir todos |

## Olhar pra dentro: o que o jogo tem de bom e o que pode melhorar (primeira leitura do Claude)

### O que está bom e é pra manter
- **Um arquivo só, que funciona offline** (e instala como app). É o que deixa o jogo rodar em qualquer celular.
- **O C.A.O.S. tem personalidade de verdade:** humor por jogador, memória entre partidas, emoções, falas em contexto.
- **Online sólido:** o host manda em tudo, as ações têm revisão e o jogo cuida de quem cai e volta, de troca de host, de
  vários jogadores no mesmo celular e de segundo plano.
- **Relógio único da partida** e ações com nome: pausa, aviso e desfazer funcionam igual em todos os modos.
- **Ferramentas de conteúdo:** inventário de falas, auditoria de geradores, conferência de cartas.

### O que dá pra melhorar (candidatos pra 2.0)
1. **Arquivos gigantes.** `05k-rede.js` tem ~3.600 linhas e `05-tela.js` ~4.000. Partir por assunto (sala, assentos,
   painel, convidado…) deixa cada mudança menor e mais segura.
2. **Fases da partida espalhadas em várias variáveis** (`cardState`, `pendingIndex`, `roletaCarta`, `pausedAt`…). O guia
   da mesa precisou "adivinhar" a fase juntando tudo. Uma máquina de estados única (fase atual + quem age) simplifica
   regras, telas, rede e testes de uma vez.
3. **Tela redesenhada inteira a cada mudança** (`innerHTML`). Isso faz animação reiniciar e o foco se perder. Redesenhar só
   o pedaço que mudou deixa tudo mais leve e mais bonito.
4. **Modo claro e alto contraste pela raiz.** Hoje o claro é uma camada de exceções por cima do escuro (`06-modo-claro.css`).
   Com cores em variáveis (tokens), escuro, claro e alto contraste viram só três tabelas de cor. Isso acaba com o
   "claro quebrando" e deixa o alto contraste quase de graça.
5. **Tradução precisa de base antes.** Os textos estão escritos direto no código. Primeiro passo: juntar os textos de tela
   num dicionário. Depois traduzir as telas e, por último, as falas do C.A.O.S. (a parte maior).
6. **Testes lógicos em vez de cenários com tempo de verdade.** Vários testes dependem de esperar ou de adiantar relógio
   (o do cérebro e o do iOS no online já deram falso alarme). Com o motor de regras separado da tela e o relógio
   injetável, dá pra testar regra por regra, rápido e sem alarme falso.
7. **Desempenho em celular fraco.** A compacta tem ~3 MB. Medir o tempo de abrir e os quadros por segundo nas
   animações, e cortar o que pesa (o laço que anima os balões varre a tela toda o tempo todo).
8. **Comentários de histórico no código.** Muitos trechos guardam a história ("1.7.x, pedido do JF…"). A história já está
   no git e no registro de versões; o código pode explicar só o porquê atual.
9. **Acessibilidade:** alto contraste, fonte amigável pra dislexia, leitura em voz alta da dica, paletas seguras pra
   daltonismo, alvo de toque maior em tudo e uma revisão com leitor de tela.
10. **Servidor e cadastro:** revisar limites de uso, mensagens de erro e o que acontece quando o servidor cai no meio da
    partida.

Essa lista é pra o JF lapidar. Nada disso entra sem o OK dele.
