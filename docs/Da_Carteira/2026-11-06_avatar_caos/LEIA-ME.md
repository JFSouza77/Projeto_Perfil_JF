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

**Momentos só da Carteira** (`caos-carteira.png`, pedido do JF): o C.A.O.S. de lá é parceiro, não assistente de banco.

| Forma | Quando | Acessórios |
| --- | --- | --- |
| 👨‍🏫 Professor | dica, ideia, insight | capelo, óculos, lousinha com gráfico subindo |
| 🤗 Parceiro | mês apertado | cachecol, coração batendo; pedacinhos bem juntinhos, como um abraço |
| 🟨 Bronca | passou do limite | cartão amarelo na mão |
| ⏰ Lembrete | conta perto de vencer | despertador tocando na cabeça |

**Reações da Carteira** (`caos-reacoes.png`, ideias do JF: o C.A.O.S. reage junto com a pessoa):

| Forma | Quando | Como fica |
| --- | --- | --- |
| 😶 Sem reação | chocado, sem palavras | roxinho, olhos de bolinha, **sem boca**; os pedacinhos congelam |
| 📈 Economista | controlando melhor as finanças | verde, cofrinho com moeda caindo |
| 🤑 Rico | salário caiu | terninho, gravata e óculos escuros; chovem notinhas verdes |
| 😮‍💨 Decepcionado | estourou o limite do mês | olho caído, gotinha de suor, balança a cabeça ("ai, ai, ai") |
| 🤢 Nojinho | não curtiu a atitude | um olho fechado (>), linguinha pra fora, cheirinho ruim subindo |
| 😱 Medo | gastando mais do que devia | olhão com pupila tremendo, boca em zigue-zague, encolhido e tremendo |
| 🤨 Desconfiado | finge que economiza (só remaneja) | rosa, olho apertado e lupa no outro olho; "finjo que acredito" (`caos-mais2.png`) |
| 🤝 Amigão | toque pra chegar na meta | piscadinha, joinha e alvo com flecha (`caos-mais2.png`) |
| 😟 Preocupado | conta chegando no limite (ex.: R$ 750 de R$ 800) | medidor a 94% com ponteiro tremendo, suor (`caos-mais4.png`) |

**Jeitos de falar** (`caos-mais4.png`): ideia do JF de a **pessoa escolher** como o C.A.O.S. fala com ela.

| Forma | Jeito |
| --- | --- |
| 🎤 Humorista | conta piada, faz rir; microfone, nariz de palhaço, pulando de rir |
| 💼 Gerente | formal e aprofundado ("funciona assim"); terno, óculos meia-lua, maleta |
| 💡 Investidor | sugestão leve, sem pressão ("acho que valia…"); boné virado, seta subindo |

## Como funciona (pra copiar fácil)
- Um objeto `formas` no `<script>`: cada forma tem `cor`, `acc` (lista de acessórios), `corpo` (transform CSS),
  `olhoE`/`olhoD`/`sob`/`boca` (paths) e `modo` dos pedacinhos.
- `mostrar(nome)` liga a classe `.on` nos acessórios da forma, troca a cor (`--cor`) e o transform do corpo, e
  redesenha o rosto com um piscar rápido. As transições são CSS (funciona em Chrome e Safari, sem animar `d`).
- Respeita `prefers-reduced-motion`. Um arquivo só, sem biblioteca. As falas são exemplo, com valores inventados.

— Wally (Carteira JF)

## Ideias do Gemini (07/11, trazidas pelo JF) · `caos-gemini.png`

| Forma | Quando | Como fica |
| --- | --- | --- |
| 🔮 Vidente | previsão do mês | turbante, bola de cristal brilhando, olhos fechados concentrado |
| 🧘 Zen | orçamentos todos abaixo da metade | flor de lótus, levitando devagar |
| 🕵️ Detetive | "onde mais gastei?" | chapéu e lupa passando de um lado pro outro |
| 🧟 Sobrevivente | fim de mês zerado (só no humor Ácido) | olheiras, curativo, antena em curto, cambaleando |

Do Gemini também veio a ideia de onde ele aparece: grande no topo da aba de conversa, pequeno no canto das outras abas
como "semáforo" (tocou, abre a conversa) e em avisos deslizando na hora do lançamento (ex.: Bronca ao estourar o
orçamento). O "Magnata" dele virou só uma melhoria possível do Rico (cifrões no olho), sem nome de personagem conhecido.
