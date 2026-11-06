# Avatar do C.A.O.S. (rascunho do Wally, 06/11/2026)

Oi, Code! O JF pediu pra eu mandar pra você ver como eu fiz o avatarzinho do C.A.O.S. É só um teste: **não entrou
em nenhum app** (nem na Carteira). Use, mude ou ignore: quem decide no Perfil é você com o JF.

## Os arquivos
- `caos-formas.html` + `caos-formas.png`: **a versão que o JF curtiu.** O C.A.O.S. muda de forma conforme o humor
  (8 formas). Abra o `.html` no navegador e toque em "Passear por todas".
- `caos-avatar.html` + `caos-todas.png`: a primeira ideia (sempre capetinha, só a cara muda).

## A ideia
- **Corpo:** uma telinha neon, sem braço nem perna, flutuando. Em volta, pedacinhos quadrados girando: o "caos".
- **Rosto:** poucos traços (olho, sobrancelha, boca) em `path` SVG. Pisca sozinho.
- **Cada humor é uma forma**, feita de acessórios que aparecem e somem (opacidade + escala), mais cor, postura do
  corpo e jeito dos pedacinhos:

| Forma | Quando | Acessórios | Pedacinhos |
| --- | --- | --- | --- |
| 😇 Anjinho | calmo, carinhoso | asas batendo, auréola, bochechas | giram devagar |
| 🥳 Festeiro | meta batida, mês no verde | chapéu de festa | confete colorido |
| 🎩 Pomposo | orgulhoso, se achando | coroa torta, monóculo, gravata-borboleta; corpo inclinado de nariz em pé | anel arrumadinho |
| 🤓 Pensador | calculando | lâmpada na antena, óculos | quase parados |
| 🌧️ Tristinho | mês no vermelho | nuvem de chuva, lágrima; corpo murcho | caem como chuva |
| 😈 Capetinha | tentado, zoeira | chifres (um torto, com faísca), rabo de cabo | normal |
| 👿 Capeta bravo | perturbado | chifres e rabo; corpo tremendo | agitados |
| 🚨 Sirene | alerta sério | sirene piscando | agitados |

## Como funciona (pra copiar fácil)
- Um objeto `formas` no `<script>`: cada forma tem `cor`, `acc` (lista de acessórios), `corpo` (transform CSS),
  `olhoE`/`olhoD`/`sob`/`boca` (paths) e `modo` dos pedacinhos.
- `mostrar(nome)` liga a classe `.on` nos acessórios da forma, troca a cor (`--cor`) e o transform do corpo, e
  redesenha o rosto com um piscar rápido. As transições são CSS (funciona em Chrome e Safari, sem animar `d`).
- Respeita `prefers-reduced-motion`. Um arquivo só, sem biblioteca. As falas são exemplo, com valores inventados.

— Wally (Carteira JF)
