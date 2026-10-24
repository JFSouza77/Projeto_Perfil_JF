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

## Quando a versão do jogo sobe (regra do JF, 24/10/2026)

Pra não virar uma bagunça de versões com 1 ou 2 itens cada. Exemplo com a **1.7.10.9.3**:

| Número | Exemplo | Sobe quando |
|---|---|---|
| 5º · ajuste | 1.7.10.9.**3** | tiver **pelo menos 5 novidades** |
| 4º · versão | 1.7.10.**9** | tiver **pelo menos 10 novidades** no total, ou quando o JF disser que a vertente principal mudou |
| 3º · série | 1.7.**10** | **só com o OK do JF**. O Claude pode propor ("JF, acho que já bateu um limite bom aqui"), mas não sobe sozinho |
| 2º · grande | 1.**7** | só quando a série atual estiver **fechada**, a próxima já tiver **nome** e tiver **pelo menos 7 coisas grandes** pra ela |

**O que conta como coisa grande (2º número):**
- correção de bugs maiores;
- melhoria da mesa no geral;
- coisas novas no jogo (itens, mecânicas);
- expansão de conteúdo (cartas, acessibilidade);
- função nova do jogo;
- qualquer mudança de comportamento que mereça ser uma atualização grande.

**Checklist antes de subir qualquer número:**
1. Contar as novidades que o jogador vai ver (itens + QoL do log). O que mudou só por dentro (sem log) não conta.
2. Bateu o mínimo? Só então se pensa em subir. **Bater o mínimo não obriga a subir**: se não fizer sentido, continua na mesma versão e as novidades vão juntando.
3. Não bateu o mínimo? Não sobe. As novidades ficam guardadas e entram junto com as próximas.

**No log do jogo:** os ajustes de 5 números aparecem **dentro da lista da versão** a que pertencem (ex.: "Beta 1.7.10.9 · até a 1.7.10.9.3"), numa lista só. Em 24/10/2026 os logs antigos foram juntados assim: 64 entradas viraram 48, sem perder nenhum item.
