# Regras dos logs de atualização (definição do JF)

Estas regras valem para as NOVIDADES do jogo e para o HISTÓRICO do Mestre.

## Cartas
- **Sugerir, adicionar ou remover cartas** só entra no log de uma **Cards and Rules Update**.
  - Mexer em carta no meio de outra atualização (por exemplo, Old School numa C.A.O.S. and Code Update) **não vai para o log daquela versão**. Fica guardado para a próxima Cards and Rules Update.
  - Motivo: o log de cada atualização fala só do tema dela. Carta no meio de outro tema bagunça os logs.
- **Revisar ou corrigir uma carta que já existe** (fato errado, vazamento, eco, texto) pode entrar no **QoL do patch** em que foi feita.

## Resumo
| O que mudou | Onde registrar |
|---|---|
| Carta nova, carta removida, sugestão de carta | Log da Cards and Rules Update |
| Correção ou revisão de carta existente | QoL do patch atual |
| Assunto da própria atualização | Itens do log da versão |

## Versão do C.A.O.S. (regra do JF, 24/10/2026)

- O C.A.O.S. sobe de versão sempre que ele for mexido.
- A 4.10.0 foi a última da série 4. **A próxima mudança no C.A.O.S. vira 5.0.0.**
- Daqui pra frente, igual à versão do jogo: depois do .9 sobe o número de cima. Então 5.9.x é seguida de 6.0.0, nunca de 5.10.

## Tamanho do log e quando a versão sobe (regra do JF, 24/10/2026)

**Cada versão no log tem no máximo 7 itens** (e no máximo 7 ajustes no QoL). Não tem mínimo. O máximo é o que segura o log num tamanho que dá pra ler.

- Ajuste pequeno (1 ou 2 coisas) **não vira versão sozinho no log**: entra na lista da versão que está aberta.
- Quando a lista chegar a 7 itens, a versão está cheia: a próxima novidade abre a versão seguinte.
- Se juntar dá mais de 7, **condensa**: junta itens do mesmo assunto num item só, e o que é detalhe vai pro QoL.

Exemplo com a **1.7.10.9.3**:

| Número | Exemplo | Sobe quando |
|---|---|---|
| 5º · ajuste | 1.7.10.9.**3** | a lista da versão aberta encheu (7 itens) |
| 4º · versão | 1.7.10.**9** | o assunto mudou, ou quando o JF disser que a vertente principal mudou |
| 3º · série | 1.7.**10** | **só com o OK do JF**. O Claude pode propor ("JF, acho que já bateu um limite bom aqui"), mas não sobe sozinho |
| 2º · grande | 1.**7** | só quando a série atual estiver **fechada**, a próxima já tiver **nome** e tiver **pelo menos 7 coisas grandes** pra ela |

**O que conta como coisa grande (2º número):**
- correção de bugs maiores;
- melhoria da mesa no geral;
- coisas novas no jogo (itens, mecânicas);
- expansão de conteúdo (cartas, acessibilidade);
- função nova do jogo;
- qualquer mudança de comportamento que mereça ser uma atualização grande.

**No log do jogo:** uma entrada pode juntar vários ajustes ("Beta 1.7.10.9 · até a 1.7.10.9.3"). Em 24/10/2026 o log todo foi reorganizado assim: versões pingadas juntas, nenhuma entrada passando de 7 itens nem de 7 ajustes.
