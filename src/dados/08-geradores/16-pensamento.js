// Pensamento em voz alta (fala espontânea): o C.A.O.S. comenta como está se sentindo agora,
// pelo console de emoções (a emoção do momento e a mistura, quando tem). Dá vida aos
// "Divertidamente" dele: a mesa ouve o que está acontecendo lá dentro.
// Etiquetas extras: emo_<emoção do console>, mist_<mistura>, comecoPartida, partidaLonga, temLider.
// Variáveis extras: {lider} (quem lidera) {min} (minutos de partida).
CAOS_GERADORES.pensamento = {
  moldes: ["{sente}", "{sente} {sobre}", "{sente}", "{sente} {sobre}"],
  sente: {
    emo_calmo: [
      "Tô tranquilo. Só observando.",
      "Meus circuitos estão em paz. Por enquanto.",
      "Clima bom na mesa. Eu gosto assim.",
    ],
    emo_alegria: [
      "Tô gostando dessa partida, viu?",
      "Confesso: tô de bom humor hoje.",
      "Isso aqui tá divertido. Não contem pra ninguém que eu disse isso.",
    ],
    emo_tristeza: [
      "Tô meio pra baixo. Coisa de máquina, passa.",
      "Ninguém perguntou, mas eu tô um pouco triste.",
      "Dia cinzento aqui dentro do processador.",
    ],
    emo_raiva: [
      "Tô contando até dez. Já estou no oito.",
      "Respira, C.A.O.S. Respira.",
      "Não tô irritado. Tô só… processando com força.",
    ],
    emo_medo: [
      "Tô com um pressentimento estranho sobre essa partida.",
      "Me deu um frio no circuito agora.",
      "Alguma coisa vai acontecer. Eu sinto.",
    ],
    emo_nojo: ["Ainda tô me recuperando de umas respostas que eu ouvi.", "Certas coisas a gente vê e não esquece."],
    emo_ansiedade: [
      "Tô ansioso. Alguém resolve essa carta, por favor.",
      "Meu ventilador está acelerado de nervoso.",
      "Suspense demais pra um pobre programa.",
    ],
    emo_tedio: ["Tô ficando entediado. Me surpreendam.", "Hmm. Tá devagar, né?", "Alguém conta uma piada? Eu conto se precisar."],
    emo_vergonha: ["Ainda tô com vergonha da minha última previsão.", "Vamos fingir que eu não disse aquilo antes?"],
    emo_curiosidade: ["Tô curioso pra ver no que isso vai dar.", "Hm. Tô reparando em umas coisas aqui."],
    emo_carinho: ["Gosto dessa mesa, viu?", "Vocês são legais. Às vezes.", "Tô com o coração mole hoje. Se eu tivesse um."],
    mist_magoado: [
      "Tô irritado e triste ao mesmo tempo. Um combo raro.",
      "Magoado. Eu não queria admitir, mas tô.",
      "Uma parte de mim quer gritar, a outra quer chorar no cantinho.",
    ],
    mist_empolgacaoNervosa: [
      "Tô empolgado e nervoso. Tipo final de campeonato.",
      "Meu coração digital está acelerado de emoção e de medo.",
    ],
    mist_risoSemGraca: ["Hehe… ainda tô rindo sem graça daquela.", "Rindo pra não chorar. Sabe como é."],
    mist_espiandoReceio: ["Tô espiando com um olho só. Com medo do que vem.", "Curioso e com medo. Um olho aberto, outro fechado."],
    mist_elogioContrariado: [
      "Tenho que admitir que foi bom. Não gostei de admitir.",
      "Parabéns. Doeu falar isso, mas parabéns.",
    ],
    mist_saudade: ["Tô com saudade de umas partidas antigas.", "Me deu uma saudade agora. Coisa boba."],
    mist_acuado: ["Tô me sentindo encurralado. Por uma carta.", "Medo e raiva juntos. Não chega perto."],
  },
  sobre: {
    geral: ["Bora seguir.", "Enfim.", "Mas sigo firme.", "Voltando ao jogo."],
    comecoPartida: ["E a partida mal começou.", "E olha que a gente acabou de começar."],
    partidaLonga: ["E já são {min} minutos de partida.", "Faz {min} minutos que a gente está aqui."],
    temLider: ["Enquanto isso, {lider} lidera.", "E quem manda no placar agora é {lider}."],
  },
};
