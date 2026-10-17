# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Turma de amigos e famílias no Brasil, de 6 a 60+ anos, jogando juntos. Duas situações:

- **Mesa com um dispositivo só:** todo mundo na mesma sala; o Mestre da vez segura o dispositivo (celular, tablet, computador ou TV) e lê as dicas.
- **Online:** cada um no próprio dispositivo, na mesma sala ou cada um na sua casa (com uma chamada de voz). Um dispositivo é o host da sala.

O trabalho do jogador: adivinhar a resposta da carta com o menor número de dicas, se divertir com a mesa e, quando é o Mestre, conduzir a carta sem entregar a resposta.

## Product Purpose

Um jogo de adivinhação por dicas no estilo do Perfil de tabuleiro, digital, com um narrador (o C.A.O.S.) que dá vida à mesa. Sucesso é a mesa querer jogar mais uma partida: rodadas fluidas, regras claras, ninguém travado e boas risadas com o narrador.

## Positioning

O que só o Perfil JF tem, tudo junto:

- **O C.A.O.S.:** narrador com personalidade, memória entre partidas e emoções, que comenta o que acontece de verdade na mesa e zoa sem palavrão. Nunca decide nada nem entrega a resposta.
- **Cartas próprias:** 1000 cartas escritas pro jogo (Ano, Pessoa, Lugar, Coisa, Animal), com modos por idade e estilo.
- **Joga em qualquer lugar:** um arquivo HTML só, que funciona offline, e um online em que cada um joga no próprio dispositivo.
- **Fiel ao Perfil de tabuleiro:** Mestre, dicas numeradas, fichas, tabuleiro e casas de bônus, só que digital.

## Operating Context

- Partidas em casa, à noite e no fim de semana, com conversa em voz alta; o jogo é lido em voz alta pelo Mestre.
- Dispositivos de todo tipo: celular, tablet, computador (navegadores como Chrome e Opera GX), TV, e aparelhos fracos ("Modo Batata").
- Online: salas de 4 letras, link ou QR Code, host que aceita a entrada; tela dos jogadores (T2) separada da tela do Mestre.
- Modos: Clássico (12+), Júnior (6+), Old School (20+), Hardcore (15+), Express; formatos Versus e Equipe; condições de vitória Tabuleiro, Pontos e Joias.
- Publicado no GitHub Pages; o servidor da sala roda no Cloudflare.

## Capabilities and Constraints

- **Um HTML só, offline primeiro.** A fonte fica em `src/` e é montada num arquivo único (`montar.js`, `build.js`). Sem framework, tudo em JavaScript no escopo global.
- **Português do Brasil.** Textos, cartas e falas em pt-BR; idiomas ficam pra depois.
- **Regras e decisões de design são do JF.** Regra ambígua: perguntar, nunca chutar.
- **O C.A.O.S. só comenta:** nunca pontua, nunca muda turno ou estado; sem palavrão pesado, nada triste ou pesado.
- **Privacidade da carta:** só o dispositivo do Mestre vê a resposta e a dica pendente.
- **Termos:** "dispositivo" (nunca assumir celular ou computador), "Mestre" (quem lê a carta) é diferente de "host" (quem abre a sala), "T2" é a tela dos jogadores.
- **Easter eggs** (presentes, piadas da turma) não aparecem nas novidades nem no histórico.
- **Em aberto:** nome público definitivo (DICAOS é nome de trabalho), domínio próprio, idiomas, Modo C.A.O.S. e Corrida contra o Tempo (1.7.10.6).

## Brand Commitments

- Nome público por enquanto: **Perfil JF**. Criação e direção: JF (JFSouza77).
- O C.A.O.S. (Central de Avaliação e Observação Sistêmica) é a voz e a personalidade do jogo: espirituoso, um pouco provocador, carinhoso por baixo, nunca ofensivo.
- Identidade visual existente: neon sobre fundo escuro (tema Noturno) e um tema Claro; ícone com a carta "P" e o ponto de interrogação em neon.

## Evidence on Hand

- 1000 cartas reais em `src/dados/02-cartas/` (200 por categoria).
- Playtests reais com a turma (Henrique, Vitinho, Rafa, Typingg, Júlia e outros), creditados nas novidades do jogo.
- Não existem depoimentos, números de usuários nem imprensa. Não inventar.

## Product Principles

1. **A mesa vem primeiro:** o jogo serve à conversa e à risada das pessoas juntas; nada pode travar a rodada.
2. **Regras claras e fiéis ao tabuleiro:** quem conhece o Perfil físico se sente em casa; o digital resolve o trabalho chato (contas, tempo, sorteio).
3. **O C.A.O.S. tem personalidade, mas respeita:** fala no momento certo, para a pessoa certa, e sabe ficar quieto.
4. **Funciona em qualquer dispositivo e sem internet:** do celular fraco à TV, offline ou online.
5. **Para todas as idades:** do Júnior ao Old School, cada um tem um jeito de jogar.

## Accessibility & Inclusion

- Público de 6 a 60+: letra maior e mais tempo (Old School com acessibilidade), tempo extra pra quem tem menos de 12 ou é iniciante.
- Área de toque mínima de 44 px, contraste WCAG AA nos temas Noturno e Claro (conferido por `ferramentas/auditar_botoes.js`), "Menos movimento" e "Modo Batata".
- Voz do C.A.O.S. opcional e controlável em cada dispositivo.
