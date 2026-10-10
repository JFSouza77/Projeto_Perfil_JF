const TUTORIAL_STEPS = [
  {
    sec: 0,
    icon: "🎲",
    title: "O que é o Perfil?",
    text: "Cada carta esconde <b>um Ano, uma Pessoa, um Lugar ou uma Coisa</b> (no Júnior, também <b>Animal</b>). A carta tem 20 dicas e o objetivo é descobrir o que ela é usando <b>o menor número de dicas</b>. Quanto mais cedo você acerta, mais pontos.",
  },
  {
    sec: 0,
    icon: "🧭",
    title: "O caminho até a partida",
    text: "Do começo ao jogo são poucos toques:<ul><li>🎮 <b>Jogar</b> na tela inicial;</li><li>⚔️ <b>Versus ou Equipe</b>;</li><li>🃏 o <b>modo</b> (Júnior, Clássico...);</li><li>📋 o <b>Resumo rápido</b> das regras → <b>Vamos começar!</b>;</li><li>✍️ o <b>cadastro</b> de quem vai jogar;</li><li>🎲 <b>Sortear quem começa</b>. Pronto, a primeira carta sai.</li></ul>",
  },
  {
    sec: 0,
    icon: "⚔️",
    title: "Versus ou Equipe?",
    text: "<b>Versus</b>: cada um por si, de 2 a 6 pessoas. <b>Equipe</b>: exatamente 4 ou 6 pessoas (com 6, dá pra fazer 2 equipes de 3 ou 3 equipes de 2), e o jogo sorteia os times equilibrando as idades.<br>Tocar num cartão só <b>marca</b> (ele acende e flutua). Pra seguir, toque em <b>✅ Continuar</b> — assim ninguém entra no lugar errado sem querer.",
    dark: true,
    mock:
      '<div class="mc-list">' +
      TUT_MC("#e11d48", "rgba(225,29,72,0.5)", "⚔️", "Versus", "Individual", " mode-selected") +
      TUT_MC("#fbbf24", "rgba(251,191,36,0.45)", "🤝", "Equipe", "Times", " mode-dimmed") +
      "</div>",
  },
  {
    sec: 0,
    icon: "🃏",
    title: "Os modos (e as idades)",
    text: "O selo neon mostra pra quem é cada modo:<ul><li>🧒 <b>Júnior (6+)</b>: cartas pra criançada, C.A.O.S. mais leve.</li><li>🃏 <b>Clássico (12+)</b>: o Perfil de sempre.</li><li>💀 <b>Hardcore (15+)</b>: só 10 dicas, pontos em dobro, menos tempo.</li><li>📻 <b>Old School (20+)</b>: cartas de quem viveu a época. Tem a versão <b>Acessibilidade</b> (letra maior, mais tempo). E qualquer modo pode ter letra maior e mais tempo pelo ♿ do menu ⋮.</li><li>🔥 <b>Express</b>: rápido, sem tabuleiro.</li><li>🎰 <b>Aleatório</b>: o jogo sorteia.</li></ul>Igual ao formato: toque pra marcar e depois no botão <b>🚀 Iniciar</b>.",
    dark: true,
    mock:
      '<div class="mc-list">' +
      TUT_MC("#38bdf8", "rgba(56,189,248,0.45)", "🧒", "Perfil Júnior", "6+") +
      TUT_MC("#34d399", "rgba(52,211,153,0.45)", "🃏", "Perfil Clássico", "12+", " mode-selected") +
      "</div>",
  },
  {
    sec: 1,
    icon: "✍️",
    title: "Seu nick",
    text: 'No cadastro, cada pessoa digita um <b>nome ou apelido</b> (de 2 a 15 letras) e toca em <b>Adicionar</b>. Sem ideia? Toque em <b>🎲 Sem ideia de nome? O C.A.O.S. sugere um</b> — ele só preenche o campo, quem decide é você.<br>👀 Aviso: o C.A.O.S. <b>lê o nick</b>. Número no nome, nome de meme, nome "tryhard", nome de verdade... ele vai ter uma opinião sobre isso.',
  },
  {
    sec: 1,
    icon: "😎",
    title: "Avatar e cor",
    text: "Antes de adicionar, escolha um <b>avatar</b> (o emoji que aparece do lado do seu nome) e uma <b>cor</b>. Cada pessoa tem a sua cor, e ela vai te representar no placar e no tabuleiro.<br>Tem cores especiais em <b>degradê</b> e a <b>Ônix Neon</b> (preta com contorno brilhando). No <b>Equipe</b>, no lugar da cor você marca a <b>faixa de idade</b> — ela só serve pra equilibrar os times.<br>🤖 Sim, o C.A.O.S. também repara no avatar que você escolheu.",
  },
  {
    sec: 1,
    icon: "🌶️",
    title: "Nível de zoeira",
    text: "Cada jogador escolhe <b>o quanto o C.A.O.S. pode zoar ELE</b> (vale só pra essa pessoa):<ul><li>🌷 <b>Suave</b>: gentil, sem ácido.</li><li>😏 <b>Normal</b>: a zoeira de sempre.</li><li>🌶️ <b>Ácido</b>: mais afiado e mais frequente.</li><li>💀 <b>Nível 0</b>: sem dó (mas sem palavrão — e ainda comemora quando você acerta).</li></ul>No <b>Júnior</b> só aparecem Suave e Normal. Mudou de ideia no meio do jogo? O <b>ADM</b> troca (tem um passo sobre ele lá no fim).",
    dark: true,
    mock: '<div class="tut-row"><span class="tut-chip">🌷 Suave</span><span class="tut-chip on">😏 Normal</span><span class="tut-chip">🌶️ Ácido</span><span class="tut-chip">💀 Nível 0</span></div>',
  },
  {
    sec: 1,
    icon: "🐣",
    title: "Primeira vez? Modo iniciante",
    text: "Tem gente que nunca jogou? No cadastro, toque em <b>🐣 Sou iniciante — quero ajuda do C.A.O.S.</b> e ele conduz o cadastro <b>passo a passo</b> (nick → avatar → cor).<br>Durante o jogo, o iniciante:<ul><li>fica no <b>Suave</b> a partida inteira;</li><li>ganha explicações <b>na hora</b>, uma vez só, das coisas que acontecem com ele (pontos, joia, instruções especiais...);</li><li>se travar nas 3 primeiras cartas, o C.A.O.S. fala com ele e pede uma força pro Mestre.</li></ul>",
    dark: true,
    mock: '<div class="ini-start" style="margin:0;">🐣 Sou iniciante — quero ajuda do C.A.O.S.</div>',
  },
  {
    sec: 1,
    icon: "⏳",
    title: "Idade e tempo extra",
    text: "No cadastro dá pra marcar <b>🧒 Menos de 12</b> ou <b>🧑 12 ou mais</b> (é opcional; no Equipe vale a faixa de idade).<br>Ler em voz alta ainda é difícil pra alguns. Por isso, quem tem <b>menos de 12</b> ou é <b>🐣 iniciante</b> ganha <b>tempo extra quando é o Mestre</b>: +20 s pra responder e, no Express, +8 s em cada dica e +40 s na carta.<br>🤖 O C.A.O.S. também repara: se alguém demora bem mais que a mesa pra ler, ele pergunta se pode dar esse tempo extra. Quem decide é a mesa (e o ADM pode ligar ou desligar).",
    dark: true,
    mock: '<div class="tut-row"><span class="tut-chip on">🧒 Menos de 12</span><span class="tut-chip">🧑 12 ou mais</span></div>',
  },
  {
    sec: 1,
    icon: "🎲",
    title: "Quem começa?",
    text: "Com todo mundo cadastrado, toque em <b>🎲 Sortear quem começa</b>. Não gostou? Dá pra sortear de novo <b>até 2 vezes</b>. Depois disso a <b>ordem da roda fica fixa</b> até o fim da partida.<br>Quem sair no sorteio é o <b>primeiro Mestre</b>.",
  },
  {
    sec: 2,
    icon: "🎙️",
    title: "O Mestre",
    text: "A cada carta, uma pessoa é o <b>Mestre</b>: segura o celular, <b>não mostra a tela</b> pra ninguém e lê tudo em voz alta. Os outros tentam adivinhar. Na carta seguinte, o celular passa pro próximo da roda.",
  },
  {
    sec: 2,
    icon: "🎰",
    title: "1. Anuncie a categoria",
    text: "Ao virar a carta, o jogo mostra a frase pronta. O Mestre lê <b>só a categoria</b>: “Eu sou UMA COISA”. <b>Nunca</b> leia a resposta (nada de “Eu sou o Cometa”!).",
    mock: '<div class="roulette" style="padding:6px 0;"><div class="roulette-phrase">"Eu sou <span class="roulette-reel landed">UMA COISA</span>"</div></div>',
  },
  {
    sec: 2,
    icon: "🙈",
    title: "2. A resposta (só pro Mestre)",
    text: "Ao virar a carta, a resposta fica <b>à mostra até a 1ª dica ser aberta</b>: é a hora do Mestre memorizar. Memorizou? <b>Toque nela pra esconder na hora</b> (bom quando a mesa demora pra escolher a dica). Depois ela se esconde, e pra conferir de novo é só tocar na faixa ou em <b>👁️ Conferir resposta</b> (aparece por <b>5 segundos</b>). Assim ninguém espia por cima do ombro.<br>Carta difícil demais (ou alguém viu)? Dá pra <b>descartar</b> e puxar outra até a 5ª dica (no máximo 2 seguidas).",
    mock: '<div class="answer-line-name answer-toggle livre"><span class="ans-nome">Cometa</span></div><div class="ans-hint">👆 toque pra esconder · some sozinha na 1ª dica</div><div class="answer-line-name answer-toggle" style="margin-top:8px;">🙈 Resposta escondida — toque pra ver (5 s)</div>',
  },
  {
    sec: 2,
    icon: "🔢",
    title: "3. Quem está na vez escolhe um número",
    text: "O jogador da vez fala um número de 1 a 20. O Mestre toca nele e <b>lê a dica em voz alta</b>. Os números são embaralhados: nenhum é “mais fácil”.<br>⏱️ Tem um tempo pra escolher o número e outro pra responder (aparece na tela). Acabou o de escolher = perde a vez.",
    mock: '<div class="number-grid" style="grid-template-columns:repeat(5,1fr);"><button class="number-btn">1</button><button class="number-btn">2</button><button class="number-btn" disabled>3</button><button class="number-btn">4</button><button class="number-btn">5</button></div>',
  },
  {
    sec: 2,
    icon: "🗣️",
    title: "4. Um palpite só",
    text: "Depois de ouvir a dica, o jogador dá <b>um</b> palpite. O Mestre toca em <b>Acertou</b> ou <b>Errou</b>. Errou? A vez passa pro próximo, que escolhe outro número.<br>O jogador não tinha palpite nenhum? <b>» Pulou</b>. O chute não tinha nada a ver com a dica? <b>⚠︎ Absurdo</b> (é o chute que foi absurdo, não a dica). Pro jogo, os dois são iguais ao Errou. Mas o C.A.O.S. fica sabendo… e ele não esquece.<br>Tocou no botão errado? Por 8 segundos aparece <b>↩️ Desfazer</b>.",
    mock: '<div class="guess-btns" style="flex-direction:column;"><button class="btn-correct">✓ Fulano acertou</button><button class="btn-wrong">✕ Errou</button><div class="mesa-btns"><button class="btn-pular">» Pulou</button><button class="btn-absurdo">⚠︎ Absurdo</button></div></div>',
  },
  {
    sec: 2,
    icon: "🤫",
    title: "Bilhete só pro Mestre",
    text: "Às vezes aparece na tela um <b>bilhete do C.A.O.S. só pro Mestre</b> (sem voz) — por exemplo, pedindo uma força pra um iniciante que travou.<br><b>Não leia em voz alta!</b> Leia sozinho e toque em <b>Li ✓</b>. Ele some sozinho depois de uns segundos.",
    dark: true,
    mock: '<div class="caos-bilhete-mock"><b>🤫 Só pro Mestre ler (não lê em voz alta!)</b><br>🤖 Dá uma força pra quem está começando: escolhe a próxima dica com carinho.</div>',
  },
  {
    sec: 2,
    icon: "⭐",
    title: "5. Instruções especiais",
    text: "Às vezes o número esconde uma <b>instrução</b> em vez de dica: “Avance 2 casas”, “Volte 2 casas”, “Escolha um jogador”, “Perca sua vez”... O Mestre lê e toca no botão que aparece. Se ninguém tocar em 15 s, o jogo aplica sozinho. A instrução conta como dica lida e <b>passa a vez</b> pro próximo jogador.",
  },
  {
    sec: 2,
    icon: "🃏",
    title: "Ficha de palpite",
    text: "Uma das instruções é o <b>Palpite a qualquer hora</b>: quem tira ganha uma <b>ficha</b> que vale o jogo todo. Com ela, dá pra chutar <b>fora da sua vez</b>, em qualquer carta, enquanto houver dica na tela. Errou o palpite? Sem castigo, só gasta a ficha.<br>⚠️ Cada um guarda <b>no máximo uma</b>. Tirou a instrução já tendo ficha? Não ganha outra e ainda <b>perde a vez</b> (e o C.A.O.S. te chama de fominha).<br>Precisa de 3 jogadores ou mais, e não existe no Hardcore nem no Express.",
  },
  {
    sec: 3,
    icon: "🏁",
    title: "Pontos e tabuleiro",
    text: "A carta vale <b>20</b>. Quem acerta leva <b>20 menos as dicas já lidas</b>, e o Mestre fica com as lidas. Ninguém acertou? Os 20 vão pro Mestre.<br><b>1 ponto = 1 casa</b> no tabuleiro. A condição de vitória aparece no Resumo rápido (o padrão é a <b>Moda da Casa</b>, logo a seguir). No Hardcore, os pontos valem em dobro.",
  },
  {
    sec: 3,
    icon: "🏠",
    title: "A Moda da Casa",
    text: "É a condição de vitória padrão (dá pra trocar no cadastro, em <b>🏆 Condição de Vitória</b>). No começo da partida o C.A.O.S. <b>gira uma roleta</b> e sorteia o modo da mesa toda. Nunca repete o da partida anterior:<ul><li>🎲 <b>Tabuleiro</b>: vence quem chegar primeiro na casa final;</li><li>🔢 <b>Pontos</b>: vence quem somar <b>200 pontos</b> (o tabuleiro vira enfeite);</li><li>💎 <b>Joias</b>: vence quem juntar as 4 joias. Aqui a joia vale com <b>1 dica a mais</b> (no Clássico, até 6) e cada um ganha <b>no máximo 2 joias por rodada</b>.</li></ul>Enquanto a roleta gira, o C.A.O.S. fica quieto. Depois ele anuncia o modo, e a partida começa quando a mesa toca em <b>Bora jogar!</b>",
  },
  {
    sec: 3,
    icon: "🏁",
    title: "Última rodada",
    text: "Alguém bateu a meta? O jogo <b>não acaba na hora</b>: a rodada vai até o fim, pra todo mundo jogar o mesmo número de vezes. A rodada termina quando o <b>primeiro Mestre</b> da partida volta a ser Mestre.<br>No fim da rodada, vence quem estiver na frente. Passou o líder na última rodada? A vitória é sua. Nas Joias, se mais de um completar, ganha quem completou primeiro.<br>No Express não tem última rodada: bateu, ganhou.",
  },
  {
    sec: 3,
    icon: "⚔️",
    title: "Casa de bônus",
    text: "A cada 10 casas tem uma <b>casa de bônus</b>. Parou nela com pontos? Você desafia alguém pra um <b>duelo valendo o dobro</b>: só vocês dois respondem, e você começa (você é o <b>desafiante</b>; a outra pessoa fica <b>na defesa</b>). Pulou e Absurdo valem no duelo, e a ficha de palpite só funciona pra quem está duelando. (Com 2 jogadores não tem duelo.)",
  },
  {
    sec: 3,
    icon: "💎",
    title: "Joias",
    text: "Joias só valem quando o modo é <b>Joias</b> (sorteado na Moda da Casa ou escolhido como Só Joias) e no Express. Acertou uma carta com <b>poucas dicas</b> (até 5; no Hardcore e no Express, até 3; na Moda da Casa, 1 a mais)? Ganha a <b>joia da categoria</b>: Ano, Pessoa, Lugar ou Coisa.<br>Juntou as <b>4 joias</b>? Bateu a meta (vem a última rodada; no Express, é vitória na hora). Trava: <b>no máximo 2 joias por rodada</b> pra cada um.",
  },
  {
    sec: 3,
    icon: "🆘",
    title: "Carta difícil demais?",
    text: "O Mestre pode <b>descartar</b> a carta até a 5ª dica (no máximo 2 descartes seguidos).<br>E quem estiver <b>bem atrás</b> pode receber a <b>Ajudinha do C.A.O.S.</b> (pontos ou uma carta bônus) — no máximo 1 vez por partida. Não tem no Hardcore, no Express nem no Equipe.",
  },
  {
    sec: 3,
    icon: "🔥",
    title: "E o Express?",
    text: "No Express é mais rápido: <b>sem tabuleiro</b>, 50 cartas de 1 ou 2 categorias (você escolhe, ou o jogo sorteia) e o tempero <b>Clássico</b> ou <b>Hardcore</b> (menos tempo). As dicas abrem sozinhas, quem souber fala, e o Mestre toca em <b>Acertou</b> e escolhe quem foi.<br>Pontos = <b>11 − dicas reveladas</b>. As instruções especiais funcionam como no UNO (pula, inverte, bloqueia).",
  },
  {
    sec: 4,
    icon: "🤖",
    title: "Quem é o C.A.O.S.?",
    text: "É o <b>narrador</b> da mesa: comenta, zoa (sem palavrão) e dá voz ao jogo — mas <b>não decide nada</b> e nunca entrega a resposta.<br>Ele reage ao que acontece de verdade: acertos rápidos, erros em sequência, Pulou, Absurdo, a hora da partida, quem está liderando... e respeita o nível de zoeira de cada um.<br>👎 Não curtiu uma fala? <b>Segure o balão</b> por 1 segundo: ele anota (e aprende). E às vezes, depois de um erro, aparece só pro Mestre: <b>🔥 Perto / 🧊 Longe</b>. É opcional; se tocar, ele comenta.",
  },
  {
    sec: 4,
    icon: "🎭",
    title: "O humor dele (e o seu)",
    text: 'O balão do C.A.O.S. muda de <b>cor</b> conforme o que ele está sentindo, e do lado aparece o <b>rostinho</b> dele: 💙 calmo, 💛 orgulhoso, ❤️ com raiva (pulsa rápido), 💜 debochado, 🩶 entediado, 🩷 carinhoso, 🩵 desafiando, 🟠 preocupado, 🧡 em festa, 💚 surpreso e 💙 triste (quando levam 👎 nele). E tem os momentos especiais: ele <b>vira a mesa</b> (╯°□°）╯︵ ┻━┻, <b>julga</b> ಠ_ಠ, <b>espia</b> ┬┴┬┴┤(·_├┬┴┬┴ e <b>dá de ombros</b> ¯\\_(ツ)_/¯.<br>E ele também "lê" vocês: no placar aparece um ícone do lado de quem está 😎 em chamas, 😡 tiltado, 🤡 de palhaçada (Absurdo), 😴 sumido, 👑 folgado na frente ou 😰 sob pressão. É só zoeira visual: não muda ponto nenhum.',
    dark: true,
    mock: '<div class="jf-toast-overlay show caos-emo" data-emo="raiva" data-face="(╬Ò﹏Ó)" style="--emo-cor:#ef4444; --emo-bg:rgba(52,8,12,0.96);">[C.A.O.S.] Terceiro erro seguido. Eu vou fingir que não vi.</div><div class="jf-toast-overlay show caos-emo" data-emo="orgulho" data-face="(⌐■_■)" style="--emo-cor:#fbbf24; --emo-bg:rgba(44,32,6,0.96);">[C.A.O.S.] Uma dica só. Respeito.</div>',
  },
  {
    sec: 4,
    icon: "🎭",
    title: "Como ler o humor do C.A.O.S.",
    text: "O humor dele aparece de <b>3 jeitos</b>, então não precisa olhar só a cor:<ul><li>🙂 a <b>carinha</b> no balão (quanto mais forte o sentimento, mais exagerada);</li><li>🏷️ a <b>etiqueta com o nome do sentimento</b> (RAIVA, TÉDIO, VERGONHA…) bem ao lado;</li><li>🎙️ a <b>voz</b>: animado fala mais rápido; tímido e triste, mais baixinho.</li></ul>A cor só reforça. Dá pra <b>⏭️ pular</b> uma fala ou <b>🔇 silenciar o C.A.O.S. até o fim da carta</b>. Mas ele guarda rancor: quando voltar, volta falando.",
  },
  {
    sec: 4,
    icon: "🧠",
    title: "Ele tem memória",
    text: 'O C.A.O.S. <b>lembra de cada nick</b> neste aparelho: quantas partidas jogou, vitórias, recordes, rivalidades. Quem já é "da casa" é tratado com mais intimidade (e com mais zoeira).<br>Na tela final fica o <b>🏆 Hall da Fama</b>. Quer começar do zero? Lá mesmo tem <b>Apagar a memória do C.A.O.S.</b>',
  },
  {
    sec: 5,
    icon: "⏸️",
    title: "Pausa (e o ADM)",
    text: "<b>⏸️ Pausar</b> congela o tempo — ninguém perde nada. Na pausa você encontra:<ul><li>💡 dicas de jogo trocando sozinhas;</li><li>🛡️ <b>ADM</b>: o <b>1º Mestre</b> da partida é o ADM e, <b>na vez dele</b>, pode mudar o nível de zoeira de um jogador;</li><li>🔄 <b>Trocar de modo</b> (recomeça com os mesmos jogadores);</li><li>📤 <b>Exportar</b> a partida.</li></ul>O jogo salva sozinho o tempo todo: se fechar sem querer, é só abrir de novo.",
  },
  {
    sec: 5,
    icon: "📤",
    title: "Save de Bolso",
    text: "<b>📤 Exportar partida</b> copia um <b>código</b> com a partida inteira (dá pra mandar no WhatsApp). No outro celular, <b>📥 Importar partida</b>, cola o código e continua de onde parou. Os dois botões ficam na tela de regras (e o Exportar também na pausa).",
    dark: true,
    mock: '<div style="display:flex; gap:10px;"><div class="btn-start btn-neo neo-small" style="--mc:#34d399; --mc-glow:rgba(52,211,153,0.3);">📤 Exportar</div><div class="btn-start btn-neo neo-small" style="--mc:#60a5fa; --mc-glow:rgba(96,165,250,0.3);">📥 Importar</div></div>',
  },
  {
    sec: 5,
    icon: "📳",
    title: "Ajustes do aparelho",
    text: "Na tela inicial, no menu <b>⋮</b> do canto de cima:<ul><li>🔊 <b>Som</b> liga/desliga os efeitos;</li><li>📳 <b>Vibrar</b> faz o celular tremer nos acertos, erros e sustos;</li><li>🗣️ <b>Voz</b>: o C.A.O.S. fala em voz alta; 🎚️ <b>Ajustar voz</b> muda velocidade, tom e a voz;</li><li>🥔 <b>Batata</b>: tira as animações pesadas (celular fraco ou bateria acabando);</li><li>📲 <b>Instalar o app</b>: põe o jogo na tela inicial (Android e iPhone);</li><li>🌙 <b>Noturno</b> / ☀️ <b>Claro</b>: troca o visual do jogo. O Noturno (padrão) é todo escuro; o Claro tem fundo lavanda e cartas brancas;</li><li>♿ <b>Acessibilidade</b>: letra maior, mais tempo, dicas lidas em voz alta, volume da voz e dos sons, alto contraste e menos movimento. Vale pra todos os modos e também fica na Pausa;</li><li>🧠 <b>Memória do C.A.O.S.</b>: 📤 Levar e 📥 Trazer passam o que ele lembra pra outro aparelho.</li></ul>",
    dark: true,
    mock: '<div class="tut-row"><span class="tut-chip" style="--mc:#f5c344;">🔊 Som</span><span class="tut-chip" style="--mc:#f5c344;">📳 Vibrar</span><span class="tut-chip" style="--mc:#f5c344;">🗣️ Voz</span><span class="tut-chip" style="--mc:#f5c344;">🥔 Batata</span></div>',
  },
  {
    sec: 5,
    icon: "🏆",
    title: "Fim de jogo",
    text: 'Acabou? Aparece o ranking com a <b>resenha do C.A.O.S.</b> (o "juízo final" da partida) e a estrela da partida. Dá pra ver as estatísticas, as cartas que cada um acertou, o <b>🏆 Hall da Fama</b>, mandar o ranking pro grupo em <b>📲 Compartilhar resultado</b> e tocar em <b>🔁 Jogar de novo</b> com os mesmos jogadores.<br>Também dá pra <b>avaliar as falas do C.A.O.S.</b> (👍/👎) — é assim que ele aprende o que a mesa curte.',
  },

  // 1.7.9.12 (pedido do JF: "se bobear, nem eu vou saber abrir uma sala online"): capítulo do online.
  {
    sec: 6,
    icon: "🌐",
    title: "Jogar online: como funciona",
    text: "No online, <b>cada pessoa joga no próprio celular</b>, na mesma sala ou cada um na sua casa (com uma chamada de voz, por exemplo).<ul><li>📱 <b>Um aparelho é o host:</b> é nele que a partida é montada e fica guardada. Pode ser o celular de quem joga ou um tablet/computador só pra mesa;</li><li>🔗 <b>Os outros entram por um link</b> e escolhem quem são. Eles não precisam montar nada;</li><li>🔒 <b>Só o celular do Mestre vê a resposta.</b> Quem está na vez escolhe o número da dica no próprio celular.</li></ul>Ainda é <b>beta</b>: no mesmo Wi-Fi funciona melhor. Os próximos passos ensinam a abrir e a entrar.",
    dark: true,
    mock: '<div class="tut-sala"><span class="tut-sala-selo">🧪 BETA</span><div class="tut-sala-rot">Sala</div><div class="tut-sala-cod">K7P2</div><div class="tut-sala-sub">1 host · cada um no seu celular</div></div>',
  },
  {
    sec: 6,
    icon: "📡",
    title: "Abrir uma sala (no aparelho do host)",
    text: "A ordem certa é <b>sala primeiro, cadastro depois</b>:<ol><li>Nesse aparelho, escolha o formato e o modo;</li><li>Na tela dos jogadores, toque em <b>🌐 Vai jogar online?</b> e depois em <b>Abrir sala pela internet</b>. Espere o <b>🟢 Sala aberta</b>;</li><li>Toque em <b>📋 Copiar link</b> ou <b>📤 Compartilhar</b> e mande no grupo. Quem abrir fica esperando o nome aparecer;</li><li>Feche a janela e <b>cadastre todo mundo</b> (inclusive quem joga de outro celular). Cada um toca no próprio nome no celular dele;</li><li>Sorteie quem começa. O jogo pergunta <b>Quem joga neste aparelho?</b>: escolha o seu nome (ou \"ninguém\", se o aparelho fica só na mesa).</li></ol>Quando o Mestre está em outro aparelho, este mostra a tela de jogador, <b>sem a carta e sem a resposta</b>. Já começou a partida? Dá pra abrir a sala pela <b>⏸️ Pausa</b>, em <b>🌐 Jogar online</b>.",
    dark: true,
    mock: '<div class="tut-sala"><div class="tut-sala-rot">🌐 Sala K7P2</div><div class="tut-sala-sub">🟢 Sala aberta</div><div class="tut-sala-sub">📋 Copiar link · 📤 Compartilhar</div></div>',
  },
  {
    sec: 6,
    icon: "🔗",
    title: "Entrar na sala (no seu celular)",
    text: "<ol><li>Abra o <b>link</b> que o host mandou (no Safari ou no Chrome);</li><li>Na tela <b>Quem é você?</b>, toque no seu nome;</li><li>Pronto: aparece o placar, a carta e os <b>botões do seu papel</b>.</li></ol>Se aparecer <b>\"Esse jogador já está na sala\"</b>, outra pessoa escolheu esse nome: confira com a mesa. Se aparecer <b>\"versão diferente\"</b>, recarregue a página pra atualizar o jogo.<br>💡 Com a sala aberta, o jogo mantém a <b>tela acesa</b> sozinho. Se você trocar de app, a conexão pode cair: é só voltar pro jogo ou abrir o link de novo.",
    dark: true,
    mock: '<div class="tut-sala"><div class="tut-sala-rot">🌐 Sala K7P2</div><div class="tut-sala-cod" style="font-size:1.1rem">Quem é você?</div><div class="tut-sala-sub">🦊 Ana · 🐼 Beto · 🐸 Caio</div></div>',
  },
  {
    sec: 6,
    icon: "🎙️",
    title: "Quem toca o quê",
    text: "Cada celular só mostra o que é seu:<ul><li>🎙️ <b>Mestre:</b> vê a resposta (\"🔒 Só você vê\"), vira a carta, dá o veredito (Acertou, Errou, Pulou), resolve as instruções especiais e o palpite;</li><li>👉 <b>Quem está na vez:</b> escolhe o número da dica;</li><li>🏟️ <b>Quem caiu na casa de bônus:</b> escolhe contra quem é o duelo;</li><li>⏸️ <b>Qualquer um</b> pode pausar e continuar;</li><li>🗳️ <b>Descartar e Desistir</b> viram votação: o Mestre pede e a mesa vota no celular;</li><li>📱 <b>O host</b> é o único que toca em <b>Próxima carta</b> no intervalo. Quando o Mestre está em outro aparelho, o host vê a mesma tela dos jogadores (sem a resposta). Se o Mestre não tem aparelho, ele usa o do host, que mostra tudo.</li></ul>",
  },
  {
    sec: 6,
    icon: "🆘",
    title: "Se a conexão cair",
    text: "<ul><li>🔄 <b>Caiu ou fechou sem querer?</b> Abra o link de novo: você volta pro mesmo lugar;</li><li>📱 <b>O host recarregou?</b> A sala volta sozinha, com o mesmo código, e todo mundo se reconecta;</li><li>👑 <b>O host sumiu de vez?</b> Em uns 15 segundos, quem foi o <b>2º Mestre</b> da partida assume a sala, sem perder nada. Se o host voltar, entra como jogador;</li><li>📶 <b>Não abriu?</b> No 4G/5G, quando a ligação direta é bloqueada, o jogo passa por uma ponte na internet (leva uns segundos a mais). Se mesmo assim não abrir, tente todos no <b>mesmo Wi-Fi</b>.</li></ul>Pra sair da sala, toque em <b>✕ Sair da sala</b>, no fim da tela.",
  },
  {
    sec: 6,
    icon: "🎮",
    title: "Pronto!",
    text: "Dica: dá pra instalar o jogo como app, em tela cheia e funcionando sem internet. No menu <b>⋮</b> da tela inicial, toque em <b>📲 Instalar o app</b> (no Android o Chrome instala direto; no iPhone aparece o passo a passo: Compartilhar → Adicionar à Tela de Início). Isso é tudo. O resto vocês aprendem jogando — e o <b>Resumo rápido</b> das regras está sempre antes da partida e na pausa. Bom jogo, e boa sorte com o C.A.O.S. 😏",
  },];
// Tutorial rápido (1.7.6): 10 passos, o básico em menos de 2 minutos, com linguagem pra criança.
// As "prints" são montadas com as próprias peças do jogo (ficam iguais ao jogo e não pesam no arquivo).
// O manual completo (TUTORIAL_STEPS) continua no fim do tutorial, no menu ⋮ e na Pausa.
const TUTORIAL_RAPIDO = [
  {
    icon: "🎲",
    title: "O jogo em 10 segundos",
    text: "Cada carta esconde <b>um segredo</b>: pessoa, lugar, ano, coisa ou bicho. São <b>20 dicas</b>. Quem descobre com <b>menos dicas</b> ganha <b>mais pontos</b>.",
    mock: '<div class="roulette" style="padding:6px 0;"><div class="roulette-phrase">"Eu sou <span class="roulette-reel landed">UM LUGAR</span>"</div></div>',
  },
  {
    icon: "🎙️",
    title: "O Mestre segura o celular",
    text: "A cada carta, uma pessoa é o <b>Mestre</b>: segura o celular, <b>esconde a tela</b> e lê as dicas em voz alta. Na próxima carta, o celular passa pro lado.",
    mock: '<div class="answer-line-name answer-toggle">🙈 Resposta escondida — toque pra ver (5 s)</div>',
  },
  {
    icon: "🔢",
    title: "Escolha um número",
    text: "Na sua vez, fale um número de <b>1 a 20</b>. O Mestre toca nele e lê a dica. Nenhum número é mais fácil.",
    mock: '<div class="number-grid" style="grid-template-columns:repeat(5,1fr);"><button class="number-btn" tabindex="-1">1</button><button class="number-btn" tabindex="-1">2</button><button class="number-btn" tabindex="-1" disabled>3</button><button class="number-btn" tabindex="-1">4</button><button class="number-btn" tabindex="-1">5</button></div>',
  },
  {
    icon: "🗣️",
    title: "Um chute por vez",
    text: "Ouviu a dica? Dê <b>um chute</b>. O Mestre toca em <b>Acertou</b> ou <b>Errou</b>, e a vez passa pro próximo. Sem ideia? <b>» Pulou</b>.",
    mock: '<div class="guess-btns" style="flex-direction:column;"><button class="btn-correct" tabindex="-1">✓ Ana acertou</button><button class="btn-wrong" tabindex="-1">✕ Errou</button></div>',
  },
  {
    icon: "⭐",
    title: "Às vezes é uma surpresa",
    text: "Alguns números escondem uma <b>surpresa</b>: andar casas, voltar, perder a vez… O Mestre lê e toca no botão.",
    mock: '<div class="tut-row"><span class="tut-chip on">⭐ Avance 2 casas</span><span class="tut-chip">⭐ Perca sua vez</span></div>',
    dark: true,
  },
  {
    icon: "🏁",
    title: "Pontos viram casas",
    text: "Acertou na 3ª dica? <b>17 pontos</b> (20 menos 3). Cada ponto é <b>uma casa</b> no tabuleiro. Chegou primeiro ao fim? <b>Ganhou!</b>",
    mock: '<div class="tut-row"><span class="tut-chip on">Dica 1 → 19 pts</span><span class="tut-chip">Dica 3 → 17 pts</span><span class="tut-chip">Dica 10 → 10 pts</span></div>',
    dark: true,
  },
  {
    icon: "🤖",
    title: "O C.A.O.S. comenta tudo",
    text: "O <b>C.A.O.S.</b> é o robô narrador: comenta, brinca e muda de humor, mas <b>nunca mexe nos pontos</b>. Cada um escolhe o quanto ele pode zoar (🌷 Suave é o mais gentil).",
    mock: '<div class="jf-toast-overlay show caos-emo" data-emo="orgulho" data-face="(⌐■_■)" style="--emo-cor:#fbbf24; --emo-bg:rgba(44,32,6,0.96); position:static; transform:none;">[C.A.O.S.] Uma dica só. Respeito.</div>',
    dark: true,
  },
  {
    icon: "⏳",
    title: "Lê devagar? Tudo bem",
    text: "Quem tem <b>menos de 12</b> ou é <b>iniciante</b> ganha <b>tempo extra</b> pra ler quando é o Mestre. Sem pressa!",
    mock: '<div class="tut-row"><span class="tut-chip on">🧒 Menos de 12</span><span class="tut-chip">🧑 12 ou mais</span></div>',
    dark: true,
  },
  {
    icon: "🌐",
    title: "Jogando online (beta)",
    text: "Dá pra jogar <b>cada um no seu celular</b>:<ul><li>📡 Na partida, <b>⏸️ Pausar → 🌐 Jogar online → Abrir sala</b>;</li><li>📋 <b>Copie o link</b> e mande no grupo;</li><li>🔗 Cada um abre o link e <b>escolhe quem é</b>;</li><li>🔒 Só o celular do <b>Mestre</b> vê a resposta.</li></ul>O passo a passo completo está no <b>📖 Manual</b>, capítulo <b>Online</b>.",
    mock: '<div class="tut-sala"><span class="tut-sala-selo">🧪 BETA</span><div class="tut-sala-rot">Sala</div><div class="tut-sala-cod">K7P2</div><div class="tut-sala-sub">Abra o link no seu celular pra entrar</div></div>',
    dark: true,
  },
  {
    icon: "✅",
    title: "Pronto pra jogar!",
    text: "O resto vocês aprendem jogando! Dúvida? <b>⏸️ Pausar</b> tem as regras, a ♿ <b>Acessibilidade</b> e o <b>📖 Manual completo</b>.",
  },
];
const PAUSE_TIPS = [
  // 1.7.9.12: dicas do online
  {
    when: () => typeof rede === "undefined" || !rede,
    text: () => "Dá pra jogar cada um no seu celular: na próxima partida, abra a sala no cadastro (🌐 Vai jogar online?), antes de cadastrar. Já começou? Toque em 🌐 Jogar online aqui na pausa. Passo a passo no 📖 Manual, capítulo Online.",
  },
  {
    when: () => typeof rede !== "undefined" && !!rede && rede.papel === "host",
    text: () => "Chegou mais alguém? 🌐 Jogar online → 📋 Copiar link e mande pra pessoa. Ela escolhe o nome dela e entra na hora.",
  },
  {
    when: () => typeof rede !== "undefined" && !!rede && rede.papel === "host",
    text: () => "Online: este aparelho mantém a tela acesa sozinho, mas não troque de app por muito tempo. Se ele sumir, quem foi o 2º Mestre assume a sala.",
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () => 'Mestre: leia só a categoria, com clareza ("Eu sou UMA PESSOA"). Nada de dar pistas no jeito de falar.',
  },
  {
    when: () => true,
    text: () => "Mestre: cara de paisagem! Não reaja aos chutes antes de tocar em Acertou ou Errou.",
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () => "Mestre: uma pausa dramática antes de ler a dica deixa a mesa mais tensa (e mais divertida).",
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () => "Mestre: leia a dica devagar, uma vez só e bem alto. Repetir a pedido vale, mas sem explicar nada.",
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () =>
      "Mestre: esqueceu a resposta? Toque em 👁️ Conferir resposta: ela aparece só por 5 segundos, longe dos olhos da mesa.",
  },
  {
    when: () => true,
    text: () =>
      "Mestre: chute com nome incompleto ou apelido vale? Combinem antes da partida, e o Mestre decide com a mesa.",
  },
  {
    when: () => true,
    text: () => "Mestre: segure o celular inclinado pra você. Tem sempre alguém tentando espiar a tela.",
  },
  {
    when: () => WIN_CONDITION === "casa" && CURRENT_MODE !== "express",
    text: () =>
      "Moda da Casa: o C.A.O.S. sorteia o modo da mesa no começo (Tabuleiro, Pontos ou Joias) e nunca repete o da partida anterior. Na próxima partida, vem outro.",
  },
  {
    when: () => ultimaRodadaAtiva(),
    text: () =>
      "Bateu a meta? A rodada vai até o fim pra todo mundo jogar igual. Quem passar o líder na última rodada leva a vitória.",
  },
  {
    when: () => joiasComTrava(),
    text: () =>
      `Modo Joias: no máximo ${JOIAS_POR_RODADA} joias por ${CURRENT_FORMAT === "equipe" ? "equipe" : "jogador"} em cada rodada. A rodada vira quando o primeiro Mestre volta a ser Mestre.`,
  },
  {
    when: () => palpiteAvailable(),
    text: () =>
      "Ficha de palpite é UMA por pessoa (ou equipe). Tirou outra já tendo uma? Perde a vez — e o C.A.O.S. chama de fominha.",
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () => "Mestre: ao virar a carta, a resposta fica à mostra até a 1ª dica ser aberta. Aproveite pra memorizar!",
  },
  { when: () => CURRENT_MODE !== "express", text: () => "Tocou numa dica que já saiu? O C.A.O.S. percebe. E comenta." },
  {
    when: () => true,
    text: () =>
      "No celular, segure o dedo num botão por meio segundo pra ver pra que ele serve — sem apertar de verdade.",
  },
  {
    when: () => CURRENT_MODE !== "express" && (CURRENT_FORMAT === "equipe" || players.length >= 3),
    text: () =>
      "Duelo da casa bônus: Pulou e Absurdo valem" +
      (palpiteEnabled() ? ", e a ficha de palpite só funciona pra quem está duelando." : "."),
  },
  {
    when: () => true,
    text: () =>
      "Não curtiu uma fala do C.A.O.S.? Segure o balão por 1 segundo: ele anota o 👎 e aquela fala sai do repertório deste aparelho (depois de algumas reprovações).",
  },
  {
    when: () => true,
    text: () =>
      "Toque no balão do C.A.O.S. pra pular a fala dele. Funciona. Mas ele anota quem foi (é o Mestre que segura o celular) e não esquece fácil.",
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () =>
      `Na sua vez, escolha um número de 1 a ${CURRENT_MODE === "hardcore" ? 10 : 20}. As dicas são embaralhadas a cada carta — o número não diz se a dica é fácil ou difícil.`,
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () =>
      `Você tem ${PICK_TIME_LIMIT + (CURRENT_MODE === "oldschool" && oldSchoolAcess ? 15 : 0)} segundos pra escolher a dica e ${RESPONSE_TIME_LIMIT} segundos pra responder depois que o Mestre ler.`,
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () =>
      "Só quem está na vez pode chutar. Errou? A vez passa pro próximo, até alguém acertar ou as dicas acabarem.",
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () =>
      "Quanto antes você acerta, mais pontos: a carta vale 20 — você leva 20 menos as dicas já reveladas, e o Mestre leva o resto.",
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () =>
      "As instruções com ⭐ não são dicas: elas movem casas, fazem perder a vez ou dão fichas — mas contam como dica revelada.",
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () =>
      "Instrução ⭐ tem 15 segundos pra ser resolvida. Se o tempo acabar, Avance/Volte são aplicados sozinhos.",
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () =>
      `Condição de vitória desta partida — ${WIN_CONDITIONS[winCond()].label}: ${winCondRuleText().replace(/<\/?b>/g, "")}`,
  },
  {
    when: () => CURRENT_MODE !== "express" && (CURRENT_FORMAT === "equipe" || players.length >= 3),
    text: () =>
      "Casa de bônus ⭐: parou EXATAMENTE numa casa múltipla de 10? Você escolhe alguém pra um duelo valendo dobro.",
  },
  {
    when: () => CURRENT_MODE !== "express" && (CURRENT_FORMAT === "equipe" || players.length >= 3),
    text: () =>
      "No duelo da carta bônus só os dois duelistas respondem: quem caiu na casa começa e, a cada erro, a vez passa pro outro.",
  },
  {
    when: () => CURRENT_MODE !== "express" && (CURRENT_FORMAT === "equipe" || players.length >= 3),
    text: () =>
      'Apareceu "Perca sua vez" no duelo da carta bônus? O bônus é cancelado e a carta volta pro fim do baralho.',
  },
  {
    when: () => gemsEnabled(),
    text: () =>
      `Joias 💎: acerte uma carta revelando poucas dicas (até ${gemClueLimit()}) e ganhe a joia da categoria dela. ${gemsCountForWin() ? `Juntou ${GEMS_TO_WIN}? Vitória na hora!` : `Com menos de ${GEMS_MIN_PLAYERS} jogadores a joia é só troféu.`}`,
  },
  {
    when: () => true,
    text: () =>
      "O Mestre segura o celular, lê as dicas em voz alta e marca Acertou ou Errou. Nunca mostre a tela pra quem está respondendo!",
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () => "Alguém espiou a carta ou o Mestre deixou escapar? O Descartar também serve pra isso: puxa outra na hora.",
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () => "Carta difícil demais? Dá pra descartar até a 5ª dica revelada — no máximo 2 descartes seguidos.",
  },
  {
    when: () => palpiteAvailable(),
    text: () =>
      "Ficha de palpite 🃏: quem tem pode chutar FORA da vez enquanto uma dica estiver na tela. Errou? Sem castigo, a ficha volta pro estoque.",
  },
  {
    when: () => true,
    text: () => "O C.A.O.S. só comenta — ele nunca decide nada no jogo. Quem manda na carta é o Mestre.",
  },
  {
    when: () => true,
    text: () =>
      'Celular travou ou alguém saiu do app? O jogo pausa sozinho e o tempo fica congelado até alguém tocar em "Voltar pro jogo".',
  },
  {
    when: () => true,
    text: () =>
      'Quer continuar a partida em outro celular? Toque em "📤 Exportar partida" aqui embaixo e mande o código.',
  },
  {
    when: () => true,
    text: () =>
      "Celular esquentando ou com pouca bateria? Na tela inicial, no menu ⋮ do canto de cima, tem o 🥔 Modo Batata, que tira as animações pesadas.",
  },
  {
    when: () => CURRENT_MODE === "hardcore",
    text: () => "Hardcore: só 10 entradas por carta, cada ponto vale dobrado e nada de ajudinha do C.A.O.S.",
  },
  {
    when: () => CURRENT_MODE === "junior",
    text: () =>
      "Júnior: tem carta de ANIMAL! Categorias: Animal, Pessoa, Lugar e Coisa — e o C.A.O.S. pega leve com todo mundo.",
  },
  {
    when: () => CURRENT_MODE === "express",
    text: () =>
      'Express: as dicas abrem sozinhas, uma por vez. Quem souber, fala — e o Mestre toca em "Acertou" e escolhe quem foi.',
  },
  {
    when: () => CURRENT_MODE === "express",
    text: () =>
      `Express: dois relógios! O da carta (${Math.floor(expressTimes().card / 60)}:${String(expressTimes().card % 60).padStart(2, "0")}) nunca reinicia; o da vez (${expressTimes().turn}s) reinicia a cada jogador.`,
  },
  {
    when: () => CURRENT_MODE === "express",
    text: () => "Express: quanto menos dicas, mais pontos — vale 11 menos as dicas reveladas (na 1ª dica, 10 pontos!).",
  },
  {
    when: () => CURRENT_MODE === "express",
    text: () =>
      'Express: ⭐ vira jogada de UNO — Avance pula jogadores, Volte inverte o sentido, "Escolha um jogador" bloqueia ou cede a vez.',
  },
  {
    when: () => CURRENT_FORMAT === "equipe",
    text: () => "Equipe: a cada carta uma equipe lê e outra responde. Pode combinar a resposta com o time — baixinho!",
  },
  {
    when: () => true,
    text: () =>
      "O C.A.O.S. tem humor próprio: acertos seguidos animam, erros em sequência deixam ele abatido. O rostinho do balão mostra como ele está.",
  },
  {
    when: () => true,
    text: () => "Na tela inicial, o 🆕 no canto de cima mostra o que mudou nas últimas versões do jogo.",
  },
  {
    when: () => true,
    text: () =>
      "Com o som ligado, o C.A.O.S. faz um bip de rádio antes de falar, com notas diferentes pra cada emoção.",
  },
  {
    when: () => true,
    text: () => "No fim da partida, toque nas plaquinhas do Hall da Fama e do resumo: o C.A.O.S. comenta cada número.",
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () =>
      "Pulou e Absurdo contam como erro no placar, mas o C.A.O.S. entende diferente: pular é escolha; Absurdo, ele anota com carinho. Ou não.",
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () => "Pausa muito longa deixa o C.A.O.S. magoado: ele volta de cara fechada e vai desmagoando a cada carta.",
  },
  {
    when: () => CURRENT_MODE !== "express",
    text: () =>
      'Jogando com alguém novo? No cadastro, o botão 🐣 "Sou iniciante" faz o C.A.O.S. ajudar passo a passo e pegar leve.',
  },
];
