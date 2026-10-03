// Primeiro Mestre da partida ({nome} = Mestre).
CAOS_GERADORES.inicioMestre = {
  moldes: ["{abre} {meio}", "{inteira}", "{abre} {meio}"],
  abre: {
    geral: ["{nome} é o primeiro Mestre.", "Mestre inicial: {nome}.", "O primeiro Mestre é {nome}.", "Quem lê as dicas primeiro é {nome}.", "{nome} abre a partida como Mestre."],
  },
  meio: {
    geral: [
      "Leia devagar, sem inventar nada.",
      "Espero que tenha boa voz.",
      "Eu observo. Com carinho. E preocupação.",
      "Sem cara de quem sabe a resposta, por favor.",
      "Lembra: quem lê não chuta.",
      "Responsabilidade grande. Voz firme.",
      "Se gaguejar, eu anoto.",
    ],
    noite: ["Fala baixo que já é de noite."],
    madrugada: ["Sussurra, que os vizinhos estão dormindo."],
    humor_acido: ["Com o seu humor ácido, a leitura vai ter veneno."],
    estreia: ["Primeira partida e já começa de Mestre. Que estreia."],
    veterano: ["Com {partidas} partidas, já sabe ler sem entregar. Espero."],
  },
  inteira: {
    geral: [
      "{nome} é o primeiro Mestre. Que Deus ajude.",
      "Mestre inicial: {nome}. Espero que tenha boa voz.",
      "{nome} é o Mestre. Leia devagar, sem inventar nada.",
      "O primeiro Mestre é {nome}. Eu observo. Com carinho. E preocupação.",
    ],
  },
};
