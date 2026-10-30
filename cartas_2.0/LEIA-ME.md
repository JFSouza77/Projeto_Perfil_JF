# Cartas preparadas pra Beta 2.0 (fora do jogo)

Estas cartas **não entram no baralho atual**: o `montar.js` só junta o que está em `src/`. Elas entram no jogo com a
2.0 (Cards Expansion), movendo cada arquivo pra `src/dados/02-cartas/` (e pra `src/ordem.txt`).

- Mesmo formato das cartas do jogo: 20 entradas, 3 especiais espalhadas, ids continuando a numeração (ANO-0201…).
- Lista do que entra: `docs/Cartas_2.0_Perfil4.md` e `ferramentas/cartas_2.0_planejadas.json`.
- Conferência: `node ferramentas/auditar_cartas.js --com-2.0` (audita junto com o baralho atual: repetidas, ids, regras).
