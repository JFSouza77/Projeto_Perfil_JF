]);
// Resposta antiga → id da carta (1.7.7.2). O id de cada carta é fixo e escrito na própria carta
// (ANO-0001, PESSOA-0001…): ele nunca sai da resposta e nunca muda. Quando a resposta de uma carta
// for corrigida, a resposta antiga entra aqui, pra um save antigo (que guardava pela resposta)
// continuar achando a carta. Carta nova ganha o próximo número da categoria; número de carta
// removida não é reaproveitado.
const CARTAS_RESPOSTA_ANTIGA = {};
