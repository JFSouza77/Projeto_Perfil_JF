// Jogar de novo com a mesma mesa ({nome} = quem ganhou a anterior).
CAOS_GERADORES.revanche = {
  moldes: ["{abre} {meio}", "{abre} {meio} {fecho}", "{meio} {fecho}", "{inteira}"],
  abre: {
    geral: ["Revanche!", "Mais uma!", "De novo? Eu adoro.", "Mesma mesa de novo.", "Placar zerado.", "Segunda rodada.", "Lá vamos nós outra vez."],
    noite: ["Mais uma antes de dormir?"],
    madrugada: ["Mais uma, a essa hora? Quem sou eu pra julgar."],
  },
  meio: {
    geral: [
      "{nome} ganhou a última, então todo mundo mira em {nome} agora.",
      "Eu lembro de cada lance da última. Foi agora há pouco, mas bons tempos.",
      "Os nomes eu já decorei. Os erros também.",
      "Até {nome} começa do zero. A justiça existe, às vezes.",
      "Agora eu conheço o estilo de cada um. Cuidado.",
      "{nome}, a coroa está em jogo de novo.",
      "Quem perdeu a última tem crédito comigo. Pouco, mas tem.",
      "Já salvei a partida passada na memória. As partes vergonhosas em destaque.",
    ],
  },
  fecho: {
    geral: ["Bora.", "Que comece.", "Dessa vez eu quero ver virada.", "Eu tô pronto."],
  },
  inteira: {
    geral: [
      "Revanche. Eu lembro de cada lance da última. Bons tempos. Foi agora há pouco, mas bons tempos.",
      "Mesma mesa de novo. Dá até uma saudade da partida que acabou de acabar.",
      "Revanche! Mesma mesa, placar zerado. {nome}, a coroa tá em jogo de novo.",
    ],
  },
};
