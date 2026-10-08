]);
// Resposta antiga → id da carta (1.7.7.2). O id de cada carta é fixo e escrito na própria carta
// (ANO-0001, PESSOA-0001…): ele nunca sai da resposta e nunca muda. Quando a resposta de uma carta
// for corrigida, a resposta antiga entra aqui, pra um save antigo (que guardava pela resposta)
// continuar achando a carta. Carta nova ganha o próximo número da categoria; número de carta
// removida não é reaproveitado.
// Dicas (1.7.8.4): cada entrada tem id fixo pela posição no arquivo (ANO-0001-C07 = 7ª entrada).
// Por isso: nunca reordenar nem apagar entradas de uma carta. Corrigir o texto mantém o id; trocar
// uma dica por outra é escrever por cima, na mesma posição.
const CARTAS_RESPOSTA_ANTIGA = {};
