// Fim de partida com o JF na mesa. Etiquetas extras: jfVenceu / jfPerdeu.
CAOS_GERADORES.jfFim = {
  moldes: ["{abre} {meio}", "{meio} {fecho}", "{inteira}", "{abre} {meio} {fecho}"],
  abre: {
    geral: ["Partida encerrada.", "Fim de jogo.", "Acabou.", "E é isso."],
    madrugada: ["Fim de jogo, e já é {hora}."],
  },
  meio: {
    geral: [
      "Se algum bug apareceu, já sabemos de quem é a culpa.",
      "JF, depois a gente conversa sobre umas decisões que você tomou no meu código.",
      "Foi um prazer jogar com o criador.",
      "Vou guardar essa partida inteira na memória. Principalmente as partes ruins.",
    ],
    jfVenceu: [
      "O JF ganhou. No próprio jogo. Eu vou investigar.",
      "O criador venceu. Coincidência? Eu acho que não.",
      "Vitória do JF. Eu conferi as regras duas vezes.",
    ],
    jfPerdeu: [
      "O JF perdeu no jogo que ele mesmo fez. Eu nunca vou esquecer disso.",
      "O criador não ganhou. A criatura está satisfeita.",
      "JF, perder no próprio jogo é um talento raro.",
    ],
    anne: ["E a {anne} viu tudo. Isso vai ser lembrado em casa."],
  },
  fecho: {
    geral: ["Agora vai lá corrigir o que eu deixei nas entrelinhas.", "Até a próxima, chefe.", "Revanche quando quiser.", "Boa partida, mesa."],
  },
  inteira: {
    geral: [
      "Partida encerrada. Se algum bug apareceu, já sabemos de quem é a culpa.",
      "JF, posso conversar com você depois sobre algumas decisões que você tomou no meu código?",
      "Foi um prazer jogar com o criador. Agora vai lá corrigir o que eu deixei nas entrelinhas.",
    ],
  },
};
