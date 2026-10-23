# Revisão do pacote do GPT (17/10/2026)

**Pacote:** `Sugestoes_Analises_Melhorias_ChatGPT_Projeto_Perfil_ClaudeCode_2026-10-17.zip`. Recebido em 23/10/2026 e conferido contra a 1.7.10.9.1.

## O que mudou em relação ao pacote de 16/10

Comparei arquivo por arquivo. O pacote é **o mesmo de 16/10** (revisado em `docs/Revisao_Pacote_GPT_2026-10-16.md`), com só duas diferenças:
- o `00_LEIA_PRIMEIRO.md`, que só ganhou a data;
- uma seção nova no handoff do Modo C.A.O.S.: a **"Mochila do C.A.O.S."** (ideia do JF, lapidada pelo GPT em 17/10).

Todo o resto já foi tratado em 16/10 ou ficou obsoleto com a 1.7.10.6 em diante:
- **Já feitos:** Modo C.A.O.S., Corrida, Peça ao C.A.O.S., aviso da mesa, idade 16+, host que cai.
- **Ainda pra depois, como combinado:** telemetria, idiomas, domínio, voz versionada.

## A Mochila do C.A.O.S., item por item

Na noite de 17/10, o handoff do Gemini trocou a Mochila pela **lojinha com Pontos de Caos**. Mesmo assim, três dos itens dela já existem na lojinha, e o que faltava era o principal: **a ajuda pra quem ficou pra trás**.

| Proposta | Situação | O que foi feito |
|---|---|---|
| Primeira Letra (em segredo) | Já existia | 👁️ Olho do C.A.O.S.: a letra aparece só no dispositivo de quem usou, e só naquela dica. |
| Segunda Chance (depois de errar) | Já existia | 💖 Vida Extra. O palpite é falado e o Mestre julga, então "errou" já é registrado por jogador. |
| Pular/Bloquear o Líder | Parcial | 🤐 Mordaça: cala qualquer um numa dica (o Mestre não). Não ganhou versão "só o líder", pra não ter dois itens quase iguais. |
| Dado viciado / moeda de duas caras | Não entra | O GPT concordou: mexe num duelo que tem que ser justo. |
| **Ganhar a ajuda por estar atrás** (checkpoint, diferença de 2 cartas, uma vez por partida, aviso público) | **Feito na 1.7.10.9.2** | 🎁 **Presente do C.A.O.S.** (abaixo). |
| UI em React / drawer | Não se aplica | O jogo é HTML/CSS/JS. O item ganho aparece em "Seus itens", como os comprados. |

## 🎁 Presente do C.A.O.S. (1.7.10.9.2 · C.A.O.S. 4.6.3)

Regras da Mochila, com os ajustes do GPT:
- É checado **no intervalo entre rodadas**, a partir da **3ª carta encerrada** (capturada ou morta).
- Precisa de **um líder só e um lanterna só**, com **2 cartas ou mais** de diferença. Empate no topo ou no fundo adia a checagem pro próximo intervalo.
- O lanterna ganha **1 item** sorteado entre Olho, Vida Extra e Mordaça.
- **Uma vez por partida, pra mesa toda.** Não é um por pessoa.
- Ninguém perde o item se voltar pra frente. Ele vale até o fim da partida.
- **A mesa vê o aviso** ("ficou 3 cartas atrás e ganhou um item"), mas **qual item é segredo**, igual às compras da lojinha (regra do JF). Quem ganhou vê o nome e o efeito.
- Não sai no mesmo intervalo da Piñata, pra ter um aviso grande por vez.
- Convive com a Mão Leve, que já é uma ajuda pra metade de baixo do placar. A Mão Leve tem 60% de chance; o Presente só aparece com a diferença de 2+ cartas.

Teste: `ferramentas/teste_loja_caos.js` confere:
- que empate no topo ou no fundo não dá presente;
- que a diferença certa dá presente;
- que ele só sai uma vez.
