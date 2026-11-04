// Demora pra escolher a dica (JF, 04/11/2026: "tô de saco cheio de ouvir 'escolhe um número, ele não morde'"). Junta
// um comentário sobre a espera ({abre}), o empurrão ({empurra}) e às vezes um fecho ({fecho}). O humor do console
// escolhe o tom, e as temporadas entram com pedaço próprio.
// Etiquetas extras: emo_<emoção do console>, repete (a mesma pessoa demorou de novo nesta partida).
// Etiquetas que todo gerador tem: temporada_<id> (temporada de agora) e data_<id>_<momento> (calendário do presente).
CAOS_GERADORES.escolherDica = {
  moldes: ["{empurra}", "{abre} {empurra}", "{empurra} {fecho}", "{abre} {empurra}", "{abre} {empurra} {fecho}"],
  abre: {
    geral: [
      "O relógio tá andando.",
      "Vinte números na tela e nenhuma decisão.",
      "Eu já escolhi umas cinco dicas aqui na minha cabeça.",
      "A carta tá esperando, e ela não é paciente igual a mim.",
      "Silêncio na mesa. Dá pra ouvir o ventilador do celular.",
      "Isso é estratégia ou é sono?",
      "Tô vendo os dedos parados daqui.",
      "Cada segundo parado é um segundo a menos pra pensar na resposta.",
      "A dica não vai se escolher sozinha. Eu já tentei.",
      "Parece prova de múltipla escolha com vinte alternativas.",
    ],
    repete: [
      "De novo essa demora, hein?",
      "Já virou tradição esperar por você.",
      "Eu tô começando a decorar o seu tempo de reação.",
      "Mais uma vez eu aqui, esperando.",
      "Essa cena eu já vi nesta partida.",
    ],
    emo_tedio: [
      "Tô bocejando em binário.",
      "Até a ampulheta dormiu.",
      "Meu tédio já tem tédio.",
      "Contei os pixels da tela. Duas vezes.",
      "Isso tá mais lento que download de 2005.",
    ],
    emo_raiva: [
      "Minha paciência tá no vermelho.",
      "Respira, C.A.O.S. Respira.",
      "Tô contando até dez, e já tô no nove.",
      "Meus circuitos estão esquentando.",
      "Eu tô calmo. Calmíssimo. Quase.",
    ],
    emo_alegria: [
      "Tô de bom humor, então vou esperar sorrindo.",
      "Hoje eu tô paciente, aproveita.",
      "Clima bom na mesa, mas o tempo não para.",
      "Tô animado pra ver qual dica vai sair.",
      "Gosto de suspense, mas nem tanto.",
    ],
    temporada_natal: [
      "O Papai Noel tá de olho em quem demora.",
      "As renas já deram três voltas no quarteirão.",
      "Até o panetone já ficou pronto.",
      "Natal é tempo de espera, mas não exagera.",
      "O pisca-pisca já piscou umas mil vezes.",
    ],
    temporada_anoNovo: [
      "Desse jeito o ano vira antes da dica sair.",
      "A contagem regressiva já começou.",
      "A champanhe tá esquentando.",
      "Os fogos estão esperando a sua decisão.",
      "Promessa de ano novo: escolher mais rápido.",
    ],
  },
  empurra: {
    geral: [
      "Escolhe uma dica, {nome}.",
      "{nome}, qualquer número já ajuda.",
      "Vai, {nome}: um número, só um.",
      "{nome}, aponta um número e vê no que dá.",
      "Bora, {nome}. A dica certa pode estar logo ali.",
      "{nome}, fecha o olho e escolhe. Funciona às vezes.",
      "Um número, {nome}. Eu prometo que não é pegadinha.",
      "{nome}, a mesa inteira tá torcendo por uma escolha.",
      "Escolhe logo, {nome}, antes que eu escolha por você.",
      "{nome}, pode ser o seu número da sorte.",
      "Decide aí, {nome}. Do 1 ao 20, tanto faz.",
      "{nome}, vai no primeiro número que vier na cabeça.",
      "Toca num número, {nome}. Eles estão pedindo.",
      "{nome}, a dica não vai cair do céu. Escolhe uma.",
      "Coragem, {nome}: escolhe uma dica.",
    ],
    modo_junior: [
      "Vamos lá, {nome}! Escolhe um número bem bonito.",
      "{nome}, que tal o número da sua idade?",
      "Escolhe uma dica, {nome}. Você consegue!",
      "{nome}, toca num número e vamos descobrir juntos.",
      "Qual número você mais gosta, {nome}? Escolhe ele!",
    ],
  },
  fecho: {
    geral: [
      "Eu acredito em você.",
      "O tempo tá passando.",
      "Sem pressão. Mentira, com pressão.",
      "A mesa agradece.",
      "Depois a gente vê se foi sorte.",
      "Eu tô cronometrando.",
      "Qualquer uma serve. Quase todas.",
      "Ninguém vai rir. Talvez eu.",
      "A carta tá ficando com sono.",
      "Vai que é a dica certa.",
    ],
  },
};
