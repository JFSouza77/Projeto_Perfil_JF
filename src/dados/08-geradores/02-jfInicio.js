// Começo da partida com o JF na mesa (fala pra mesa sobre ele).
CAOS_GERADORES.jfInicio = {
  moldes: ["{abre} {meio}", "{meio} {fecho}", "{inteira}", "{abre} {meio} {fecho}", "{inteira}"],
  abre: {
    geral: ["Galera, um aviso.", "Pessoal, atenção.", "Antes de começar:", "Recado importante:", "Só pra constar:"],
    mesaCheia: ["Mesa cheia hoje, então vou falar alto:"],
    dupla: ["É um duelo, então vou ser direto:"],
    noite: ["Já que estamos à noite e ninguém tem pressa:"],
    madrugada: ["Já que ninguém aqui dorme:"],
  },
  meio: {
    geral: [
      "o JF programou esse jogo. Se algo estiver errado, vocês sabem quem procurar.",
      "ter criado o jogo não dá ponto extra pro JF.",
      "o JF conhece as cartas? Conhece. Lembra das respostas? Aparentemente não.",
      "se o JF perder, ele perdeu pro próprio jogo. Eu vou anotar.",
      "o JF tem acesso ao meu código, mas não ao meu humor.",
      "qualquer bug que aparecer hoje tem nome e sobrenome. Começa com J.",
      "o desenvolvedor está entre nós. Se algo quebrar, finjam que não viram.",
      "o JF jura que não decorou as cartas. Eu tenho minhas dúvidas.",
    ],
    anne: ["a {anne} e o JF na mesma mesa. Eu vou fingir neutralidade."],
    pedro: ["o {pedro} contra o JF. Pai e filho. Eu trouxe pipoca."],
    isabel: ["a {isabel} está de olho no JF. Eu também."],
    venceuUltima: ["o JF ganhou a última. Bora tirar a coroa dele."],
    perdeuUltima: ["o JF perdeu a última e diz que foi azar. Eu tenho os registros."],
    modo_hardcore: ["o JF escolheu Hardcore. Ninguém pediu, mas aqui estamos."],
    modo_equipe: ["quem cair no time do JF, meus pêsames. Ou parabéns. Ainda não sei."],
  },
  fecho: {
    geral: ["Boa sorte pra todo mundo.", "Que vença o melhor. Provavelmente não ele.", "Pronto, falei.", "Agora sim: bora jogar.", "Eu estou de olho nos dois lados."],
    temper_rabugento: ["E eu estou de mau humor hoje. Só pra avisar."],
  },
  inteira: {
    geral: [
      "Galera, esse aqui é o JF. Ele programou o jogo. Então, se alguma coisa estiver errada, já sabemos quem procurar.",
      "Ah, o JF está jogando. Agora entendi por que algumas coisas desse jogo funcionam desse jeito.",
      "Pessoal, respeitem o JF. Ele criou o jogo. Não significa que ele vai ganhar.",
      "Olha quem apareceu. O próprio criador do caos.",
      "JF está na partida. Comportem-se. Ou não. Ele provavelmente já viu coisa pior no próprio código.",
      "Senhoras e senhores, temos o desenvolvedor entre nós. Se algo quebrar, finjam que não viram.",
      "Meu criador está na partida. Vou tentar me comportar.",
      "Galera, esse é o JF. Tecnicamente, se ele perder, ele perdeu pro próprio código.",
    ],
  },
};
