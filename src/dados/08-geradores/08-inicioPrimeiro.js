// Primeira pessoa a responder ({nome}).
CAOS_GERADORES.inicioPrimeiro = {
  moldes: ["{abre} {meio}", "{inteira}", "{abre} {meio}", "{abre}"],
  abre: {
    geral: ["{nome} começa respondendo.", "Quem responde primeiro é {nome}.", "O primeiro palpite é de {nome}.", "{nome} abre os trabalhos.", "A primeira carta é de {nome}."],
  },
  meio: {
    geral: [
      "Sem pressão. Muita pressão.",
      "Boa sorte.",
      "Eu estou de olho.",
      "Começar bem é meio caminho. Começar mal é história pra mim.",
      "Respira e escolhe uma dica.",
      "A mesa inteira está olhando. Eu também.",
    ],
    venceuUltima: ["Ganhou a última. Vamos ver se foi sorte."],
    perdeuUltima: ["Hora de apagar a última partida da memória. A sua, porque a minha não apaga."],
    humor_suave: ["Vai com calma. Eu torço baixinho."],
    humor_acido: ["Pediu ácido, então já aviso: errou, eu falo."],
    modo_hardcore: ["No Hardcore, primeira carta já pesa."],
  },
  inteira: {
    geral: [
      "{nome} começa respondendo. Sem pressão. Muita pressão.",
      "Quem vai sofrer primeiro é {nome}. Boa sorte.",
      "O primeiro a responder é {nome}. Eu estou de olho.",
    ],
  },
};
