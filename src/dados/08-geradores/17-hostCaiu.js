// Usado desde a 1.7.9.11 (troca de host, 05k-rede.js): o aparelho host caiu e o C.A.O.S. anuncia quem assume.
// Regra do JF: o novo host é quem foi o 2º Mestre da partida (depois o 3º, e assim por diante),
// e os poderes de Mestre/host passam sem perder nada da partida.
// Variáveis extras: {antigo} (quem era o host) {nome} (o novo host).
CAOS_GERADORES.hostCaiu = {
  moldes: ["{abre} {meio}", "{abre} {meio} {fecho}", "{meio} {fecho}"],
  abre: {
    geral: ["Opa, perdemos o sinal do {antigo}.", "O aparelho do {antigo} saiu da sala.", "Caiu a conexão do host.", "Alerta: o {antigo} sumiu do mapa."],
  },
  meio: {
    geral: [
      "Calma, nada se perdeu: o {nome} assume como host agora.",
      "Pela ordem, quem foi o 2º Mestre assume: {nome}, a mesa é sua.",
      "Passei o comando pro {nome}. Placar, cartas e joias estão intactos.",
      "{nome} herda a mesa. Eu continuo aqui, do mesmo jeito.",
    ],
  },
  fecho: {
    geral: ["Bora continuar.", "Quando o {antigo} voltar, entra como jogador.", "Partida segue.", "Ninguém perde nada."],
  },
};
