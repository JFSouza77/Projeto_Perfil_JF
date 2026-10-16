# Revisão do pacote do GPT (16/10/2026)

Pacote: `Sugestoes_Analises_Melhorias_ChatGPT_Projeto_Perfil_ClaudeCode_2026-10-16.zip` (relatórios, handoffs e feedbacks
discutidos pelo JF com o GPT). Cada item foi conferido no código da branch (1.7.10.5.3 · C.A.O.S. 4.4.1).

## Numeração (decisão do JF, 16/10/2026)

- Tudo o que dá pra fazer agora entra como **1.7.10.5.x** (QoL e correções no 4º número).
- **1.7.10.6** = Modo C.A.O.S. + Corrida contra o Tempo (o que foi prometido pra 1.7.10).
- **1.8** só depois de tudo isso terminado, revisado, testado e corrigido, com tema novo de update.

## Confirmado no código e corrigido na 1.7.10.5.4 · C.A.O.S. 4.4.2

| Item do GPT | Situação | O que foi feito |
|---|---|---|
| Voz no dispositivo do convidado saía sempre no tom calmo (`caosSpeak(..., "__normal")`) | Confirmado | Fala da rede usa a emoção (`"__emo:<emoção>"`) |
| Fila do convidado cortava a voz (troca em 1,5 s e `caosVoiceCancel`) | Confirmado | Próxima fala só depois do fim da voz (ou do tempo de leitura); fala com mais de 12 s na fila é descartada |
| Sem deduplicação no receptor | Confirmado | `ev` (eventId do canal) vai na mensagem; o dispositivo ignora evento repetido |
| Vocativo "Ei, Henrique, …" não era reconhecido | Confirmado | Regex de `redeFalaComQuem` aceita nome entre vírgulas no começo |
| Até 10 falas por carta ainda é muito | Decisão do JF | 10 → 6 por carta; 18 → 12 em 3 cartas |
| Fadiga: `CAOS_FATIGUE_CHANCE = 1` (ramo impossível) | Decisão do JF | É de propósito: ele sempre cansa em partida longa (comentário no código) |

## Já existia (o pacote estava atrás do código)

Filtro de nick com exceção do Carro Pika · selo HOST · T2 com número e pedido pendente · pedido de dica no próprio
dispositivo + trava (1.7.10.5.3) · Palpitar agora · explicação do palpite 1x por jogador · Alt-Tab não pausa o online ·
Ouvir de novo na revisão · respiro/ouvido interno · fala privada vai só pro dispositivo da pessoa (envio direcionado
pela sessão, não é filtro no receptor: a fala da mesa vai pra todos de propósito).

## Conflita com decisão do JF (fica como o JF decidiu)

- "Silenciar não causa rancor": o JF decidiu ciúmes/rancor com quem calou (C.A.O.S. 4.3, `12-ouvintes.js`).
- "Mute coletivo separado": hoje todos calarem = ele quieto na sala (decisão do JF).

## Fica pra depois (1.7.10.6 em diante, ou 1.8)

- "Peça ao C.A.O.S." (falar mais/menos, humor mais leve/ácido) com escopo pessoal x sala.
- Perfil de voz global versionado + preferências locais; equalização real depende da voz da nuvem.
- Orquestração por intenção (evento → vale falar? → intenção/destinatário → como soa) sobre os 18 geradores.
- Continuidade emocional por jogador ("não é contigo, foi o Henrique"), distração cômica rara, fadiga entre partidas.
- Envelope de fala com `recipientIds`/visibilidade explícitos em toda fala (hoje: explícito via `caosFalarPara`, nome no texto como reserva).
- Telemetria (já planejada pra depois dos modos), idiomas, domínio/nome (DICAOS), splash, idade x cartas, auditoria de layout no computador (precisa de relato com prints).
- Handoffs do Modo C.A.O.S. e da Corrida: comparar com `docs/brainstorm/` quando começar a 1.7.10.6.
