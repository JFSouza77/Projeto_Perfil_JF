// O Mestre contou o que alguém chutou (botão "digitar o chute"). O C.A.O.S. compara com a resposta
// e comenta pela categoria e pelo que ele lembra (chute repetido na carta, dicas abertas,
// como a pessoa vai na categoria, se a carta costuma derrubar gente). Nunca entrega a resposta
// nem diz se a data é antes ou depois.
// Etiquetas extras: tipo_igual, tipo_anoTrave, tipo_anoPerto, tipo_anoMedio, tipo_anoLonge, tipo_anoEra,
//   tipo_anoEraSuave, tipo_parte, tipo_parecido, tipo_inicial, tipo_longe, tipo_longeSuave;
//   cat_ANO/PESSOA/LUGAR/COISA/ANIMAL, chuteRepetido, chuteRepetidoMesmo, poucasDicas, muitasDicas,
//   forteCat, fracoCat, cartaDificil, cartaFacil.
// Variáveis extras: {chute} {anos} ("1 ano", "12 anos") {dicasTxt} ("3 dicas") {cat} {quemAntes}.
CAOS_GERADORES.chute = {
  moldes: ["{reacao}", "{reacao}", "{reacao} {extra}", "{reacao} {extra}"],
  reacao: {
    tipo_igual: [
      '"{chute}" é exatamente a resposta, {nome}! Mestre, confere aí: acho que alguém apertou Errou sem querer.',
      "{nome} chutou certinho. Se o botão disse que errou, o botão é que está de mau humor.",
      "Mestre, o chute de {nome} bate com a resposta. Eu só narro, mas nesse caso eu daria o ponto.",
      '"{chute}"? Isso é a resposta, letra por letra. Revisa aí, Mestre.',
    ],
    tipo_anoTrave: [
      "{chute}? Por {anos}, {nome}! Bateu na trave do calendário.",
      "{nome} chutou {chute} e errou por {anos}. Acertou a casa e errou o andar.",
      "Trave! {chute} passou a {anos} da resposta.",
      "{anos} de diferença, {nome}. O calendário quase ficou do seu lado.",
    ],
    tipo_anoPerto: [
      "{chute}? Só {anos} de diferença. Dá pra sentir o cheiro da resposta, {nome}.",
      "{nome} chutou {chute}. Está na vizinhança: uns {anos} de distância.",
      "Perto, {nome}. {chute} fica a {anos} da resposta.",
    ],
    tipo_anoMedio: [
      "{chute}? Uns {anos} de distância. Mesma época, só um pouco fora de órbita, {nome}.",
      "{anos} de erro, {nome}. Pelo menos o século você acertou. Provavelmente.",
      "{chute} ficou a {anos}. Esquentando, mas ainda morno.",
    ],
    tipo_anoLonge: [
      "{chute}, {nome}? Errou por {anos}. Outra época, outra moda, outro cabelo.",
      "{anos} de diferença. {nome} viajou no tempo e esqueceu de voltar.",
      "{chute}? Longe: {anos} de distância. A máquina do tempo precisa de revisão.",
    ],
    tipo_anoEra: [
      "{chute}? {anos} de diferença, {nome}. Isso não é erro, é outra era geológica.",
      "{nome} errou por {anos}. Vou fingir que foi pegadinha de calendário.",
      "{chute}?! Tem dinossauro mais perto da resposta que esse chute.",
    ],
    tipo_anoEraSuave: [
      "{chute} está longe da resposta, {nome}, mas acontece. Tenta mais uma dica.",
      "Datas são traiçoeiras, {nome}. {chute} não é, mas vale a tentativa.",
    ],
    tipo_parte: [
      '{nome} falou "{chute}". Parte disso está na resposta. Parte.',
      '"{chute}" tem um pedaço da resposta escondido. Eu não vou contar qual.',
      'Tem coisa certa em "{chute}", {nome}. Não tudo.',
    ],
    tipo_parecido: [
      '"{chute}"? Tão parecido que quase doeu em mim, {nome}.',
      '{nome} chutou "{chute}". Se fosse prova, ia ter nota de participação.',
      '"{chute}" passou raspando, {nome}.',
    ],
    tipo_inicial: [
      '"{chute}" começa igual à resposta, {nome}. Só começa.',
      "{nome}, a primeira letra de \"{chute}\" bate. Parabéns pela primeira letra.",
      '"{chute}" largou bem e tropeçou no caminho.',
    ],
    tipo_longe: [
      '"{chute}", {nome}? Eu não vejo ligação nenhuma. E eu vejo ligação em tudo.',
      '{nome} chutou "{chute}". Respeito a coragem. A resposta fica do outro lado do mapa.',
      '"{chute}"? Nem de longe. Nem de binóculo, {nome}.',
      '"{chute}"… Interessante. Errado, mas interessante.',
    ],
    tipo_longeSuave: [
      '"{chute}" foi uma boa ideia, {nome}. A resposta é outra, mas tem lógica.',
      'Entendi o raciocínio com "{chute}", {nome}. Não era essa, mas dá pra tentar de novo.',
      '"{chute}" não é, mas foi um bom palpite.',
    ],
  },
  extra: {
    chuteRepetido: [
      '{quemAntes} já tinha tentado "{chute}" nessa carta. Ninguém lê o histórico?',
      "Esse chute já apareceu nessa carta. Eu lembro, mesmo que vocês não.",
    ],
    chuteRepetidoMesmo: ['De novo "{chute}", {nome}? Insistência é bonito. Às vezes.'],
    poucasDicas: ["Chutar com {dicasTxt} é coragem pura.", "Com {dicasTxt} na mesa, foi um chute no escuro."],
    muitasDicas: ["Já são {dicasTxt} na mesa…", "Depois de {dicasTxt}, eu esperava mais."],
    cat_ANO: ["Ano é traiçoeiro mesmo.", "Calendário não perdoa."],
    cat_PESSOA: ["Gente famosa demais confunde, eu sei.", "Tem muita gente no mundo, eu entendo."],
    cat_LUGAR: ["O mapa é grande, eu sei.", "Geografia é esporte radical."],
    cat_COISA: ["Coisa é a categoria mais traiçoeira: tudo é coisa."],
    cat_ANIMAL: ["O zoológico inteiro está rindo. Com carinho."],
    fracoCat: ["{cat} não é muito a sua praia, {nome}. Eu tenho os números."],
    forteCat: ["E olha que {cat} costuma ser sua especialidade, {nome}."],
    cartaDificil: ["Essa carta derruba muita gente. Eu lembro.", "Essa carta já fez outras vítimas por aqui."],
    cartaFacil: ["E essa carta costuma sair fácil…", "Curioso: essa carta normalmente sai rapidinho."],
  },
};
