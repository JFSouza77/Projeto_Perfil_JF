# Revisão: votação, C.A.O.S. e servidor (23/10/2026)

Interno, sem entrada nas novidades. A versão do jogo continua **1.7.10.9.3**. C.A.O.S. 4.6.5 · build 1832.

## 1. Votação da mesa (o bug do 2 a 1)

**O que acontecia:** a conta usava só quem estava conectado naquela hora. Com celular em segundo plano ou conexão piscando, a "mesa" encolhia, e numa sala de 5 dois votos já decidiam.

**Como ficou:**
- O total é a **mesa inteira** (todos os jogadores da partida), não só quem está online.
- Decide quem junta a **maioria**: 3 de 4 → 3 · 5 → 3 · 6 → 4 · 3 → 2.
- O "não" também precisa de maioria. Se o tempo acabar sem maioria, a carta **fica** (nada muda).
- Quem piscou a conexão ainda consegue votar.
- O celular mostra "(precisa de N sim de T)".

Teste novo: `ferramentas/teste_votacao.js`.

## 2. C.A.O.S. falando demais no Modo C.A.O.S.

**Causa:** nos outros modos existe um limite de falas por carta. No Modo C.A.O.S. o contador de cartas não anda do mesmo jeito, então o limite nunca valia.

**Como ficou (só no Modo C.A.O.S.):**
- **Calado** enquanto a mesa decide: janela da dica, julgamento, duelo, desafio, desfibrilador e enquanto tem aviso na tela.
- **No máximo uma fala por vez** de cada Mestre.
- Avisos de regra (o que explica o jogo) **continuam passando**.

Nos outros modos nada mudou.

## 3. Servidor

- **Nova tentativa automática** quando o Cloudflare dá erro passageiro (antes o pedido simplesmente falhava).
- **Erro geral não derruba mais a resposta:** vira um "tente de novo" (503), que o jogo já sabe repetir.
- **Logs ligados.** Pra ver: painel do Cloudflare → Workers & Pages → `perfil-jf-sala` → Logs.
- O deploy é automático ao juntar no GitHub.

## 4. Banco de falas

Auditoria: 2912 falas prontas e 629 peças de gerador. Nada quebrado; só avisos de estilo (5 falas longas, 9 terminando em emoticon sem ponto).

## 5. Pra depois (não urgente, quando você quiser)

| Tema | Ideia |
|---|---|
| Matriz de fala/voz | Separar a fala por "momento" (abertura, erro, acerto, duelo, fim) com peso e tempo de espera por tema, pra ele não repetir o mesmo assunto em seguida. A voz pode ganhar 2 ou 3 "tons" ligados ao humor. |
| Geradores | Memória das últimas peças usadas por gerador (hoje é só por frase pronta), pra combinar menos igual. |
| Cores e contraste | Rodar uma auditoria de contraste (WCAG AA) em todas as telas, nos dois temas, e corrigir o que ficar abaixo. |
| Vários idiomas | Primeiro tirar os textos fixos do código pra uma tabela; depois traduzir interface, regras e C.A.O.S. As cartas são o maior volume e precisam de revisão humana. |
| Faixas de idade | Teste guiado com alguém de cada faixa (criança no Júnior, adulto no Clássico/Corrida, mesa misturada no Modo C.A.O.S.), anotando onde a pessoa travou. |

## 6. Puxão de orelha (coisas pra você decidir)

1. **Limite de fala nos outros modos:** hoje o C.A.O.S. tem limite por carta no Clássico/Express/Corrida. Quer que ele fique ainda mais quieto lá também, ou está bom?
2. **Botão de "C.A.O.S. mais quieto"** no menu (falar menos sem mutar). Ajuda a mesa a não desligar ele de vez. Faço se quiser.
3. **Votação empatada (ex.: 2 a 2 numa mesa de 4):** hoje a carta fica. Confirma?
4. **Idiomas:** qual vem primeiro, inglês ou espanhol? E é pra 1.8 ou depois?
5. **Voz:** continua com a voz atual ou quer que eu prepare a troca de tom por humor?
