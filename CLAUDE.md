# Perfil JF: regras fixas do JF

- **Quantidades sempre terminam em 0 ou 5** (falas, cartas, pedaços de gerador, itens). Vale pro total e pra cada grupo.
  Contar de verdade antes de publicar. Detalhes em `docs/Regras_dos_Logs.md`.
- A fonte é `src/`. Montar com `node montar.js`, gerar as saídas com `node build.js` (nunca editar o Mestre à mão).
- Versão do C.A.O.S. e tamanho do log: `docs/Regras_dos_Logs.md`.
- **Pedido urgente do JF vem primeiro (26/10/2026):** quando ele pedir algo "pra agora", parar testes e tudo que
  estiver em segundo plano e focar só naquilo; publicar e só depois voltar pros testes e pendências.
- **Próximas versões (26/10/2026):** 1.9 = T2 viva (a tela do celular com dicas, C.A.O.S. mexendo com quem espera);
  Beta 2.0 = Rework Update (reestruturar tudo, tradução, 1.500+ cartas, falas revistas e 50 mil combinações,
  testes lógicos e de desempenho, modo claro e acessibilidade). Detalhes: `docs/Roteiro_1.9_e_2.0.md`.
- **Cartas com tema pesado (26/10/2026):** entram (Perfil também é conhecimento), só com fatos, sem tomar partido,
  imparcial e honesto. Nunca no Júnior; podem cair no Clássico, Hardcore e Old School. Lista da 2.0: `docs/Cartas_2.0_Perfil4.md`.
- **Ajustes pequenos:** o JF liberou ir acumulando e postando quando der (ajuste da versão aberta).
- **Cartas da 2.0 (26/10/2026):** a meta é chegar perto de 2.000 cartas no total (500 novas era só uma média). Primeiro
  o rascunho (criar), depois a estrutura; o filtro fino (o que cabe no Júnior, no Express etc.) fica pra depois.
  As cartas novas ficam preparadas fora do baralho até a 2.0 sair. Plano: `docs/Cartas_2.0_Perfil4.md`.
- **Nomes (26/10/2026):** quando o JF fala "Code", é este Claude Code (nuvem de codificação); "Klaus" é o chat do Claude.
- **Catálogo de cartas:** `docs/Catalogo_de_Cartas.md` (pro GPT conferir) e `.html` (pro JF), gerados por
  `node ferramentas/catalogo_cartas.js`. Carta planejada nova entra em `ferramentas/cartas_2.0_planejadas.json` e
  o catálogo é gerado de novo. Carta nova no jogo precisa de assunto em `ferramentas/catalogo_assuntos.json`.
- **Economia de créditos (26/10 a 29/10/2026):** bug, print ou sugestão que o JF mandar nesta semana só é anotado em
  `docs/Pendencias_da_Semana.md`, sem corrigir. Exceção: quando ele disser que precisa daquilo "pra agora", corrigir só
  aquilo, pontual. Na quinta, 29/10, às 18h (Brasília), os créditos renovam e começam os patches com tudo que acumulou.
- **Temporadas (30/10/2026):** o jogo entra no clima das datas (Halloween, Natal, Carnaval, Festa Junina, aniversário do JF
  em 2/1 etc.), com falas, lojinha, cores, emojis e títulos da temporada e cartas valendo o dobro. Prioridade: Natal. Feito aos poucos, 2 vezes por dia (8h47 e 23h47), quando
  não houver pedido do JF; pedido dele sempre vem antes. Nada vai pro ar sem o JF ver e autorizar. Plano: `docs/Temporadas.md`.
- **Elisa (26/10/2026):** sobrinha do JF, 13 anos, mas com maturidade e raciocínio de uns 16; joga Júnior, Clássico,
  Old School e Hardcore. Sugestão e relato dela têm peso de jogadora experiente, não de criança.
