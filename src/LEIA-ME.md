# src/: fonte oficial do Perfil JF (desde a 1.7.5)

O jogo continua sendo **um HTML só**. Ele é montado juntando estas partes na ordem de `ordem.txt`, sem mudar nada no texto delas.

```
node build.js --testar --publicar   monta o Mestre, gera debug/compacta/offline, testa e atualiza o index.html
node montar.js                      só monta o Mestre (Perfil_JF_Mestre_X_Y_Z.html)
node ferramentas/auditar_cartas.js  confere as cartas (só reporta)
node ferramentas/caos_teste_geradores.js / caos_teste_estresse.js   testes do C.A.O.S. (só reportam)
```

- **Edite só os arquivos de `src/`.** O Mestre e as saídas são gerados, então nunca edite esses à mão.
- A versão vem do `<title>` em `html/01-cabeca.html`, e o nome do Mestre sai dela.
- Ao trocar de versão, apague o Mestre antigo com `git rm`. As saídas antigas (`Perfil_JF_X_Y_Z*.html`) **ficam** no repositório, pela regra do Klaus.
- Todo arquivo `.html`, `.css` ou `.js` de `src/` precisa estar em `ordem.txt`. A montagem para com erro se sobrar ou faltar algum.

## O que tem em cada parte

| Parte | Conteúdo |
|---|---|
| `html/01-cabeca.html` | Comentário com o HISTÓRICO, `<head>`, `<title>` com a versão, e termina em `<style>` |
| `css/01…06` | CSS, na ordem em que foi escrito. A ordem importa, porque regras de baixo vencem as de cima. `06-modo-claro.css` é o tema Claro |
| `html/02-corpo.html` | `</style>`, todo o HTML das telas, e termina em `<script>` |
| `js/01-configuracao.js` | Índice do script e a seção 1: constantes, limites, tempos e chaves de save |
| `js/02-estado.js` | Seção 2: variáveis globais da partida e do C.A.O.S. |
| `js/03-regras.js` | Seção 3: vitória, pontos, joias, tabuleiro, baralhos por modo e equipes |
| `js/04-turno-e-rodada.js` | Seção 4: sorteio de carta, dicas, acerto/erro, especiais, timers, pausa, início e fim |
| `js/05-tela.js` | Seção 5: renderização, menus, cadastro, tutorial, painéis e efeitos |
| `js/06-voz-som-vibracao.js` | Seção 6 |
| `js/07-caos/` | Seção 7, o C.A.O.S., em 11 partes (o mapa do cérebro está em `docs/CAOS_Cerebro.md`): `01-nucleo-e-falas` (temperamento, vetor de emoção, escolha e decoração das falas), `02-cerebro-adm` (o painel Cérebro da área ADM), `03-memoria-e-mesa` (fichas, recordes, rivais, leitura da mesa e casal), `04-lexico-e-relogio` (gerador de acerto/erro, relógio e tema da carta), `05-emocoes-e-rede-neural` (console de emoções, misturas, escada de rostos e rede neural), `06-humanizacao` (perguntas, implicância, silêncio e animações), `07-momentos-da-partida` (boas-vindas, início, falas espontâneas e efeitos), `08-hall-janelas-e-pausa` (comentários do Hall, janelas e pausa longa), `09-vinculos-silencio-e-balao` (favorito/desafeto, 🔇, chute e o balão `showToastMessage`), `10-gerador-de-falas` e `11-espinha` (as 3 leis e o canal) |
| `js/08-salvamento.js` | Seção 8: armazenamento, salvar/carregar, exportar/importar e fichas |
| `js/09-utilitarios.js` | Seção 9: texto, cores, sorteio e números |
| `dados/01-emocoes-do-caos.js` | Início da seção 10: `CAOS_EMOS` |
| `dados/02-cartas/` | `ADULT_CARDS`: `00-abertura` abre o `expandDeck([`, depois vem uma categoria por arquivo, e `99-fechamento` fecha |
| `dados/03-falas-do-caos.js` | `REACTIVE_VOICE` e os filtros de palavrão e gíria |
| `dados/04-lexico-e-emocoes.js` | Léxico, bancos de emoção, viradas e animações do C.A.O.S. |
| `dados/05-apelidos-e-comentarios.js` | Apelidos do Júnior, vibração e `CAOS_COMENT` |
| `dados/06-tutorial-e-dicas.js` | Passos do tutorial e dicas da pausa |
| `dados/07-novidades.js` | `NOVIDADES` (o log de atualizações que aparece no jogo) |
| `dados/08-geradores/` | Um arquivo por gatilho do gerador de falas. `00-abertura.js` explica as regras de escrita |
| `js/11-iniciar.js` | Seção 11: `iniciar()`, que roda por último |
| `html/03-fim.html` | `</script></body></html>` |

## Regras que não mudam

- Tudo continua no escopo global, sem módulos. Os `onclick` e as strings usam os nomes das funções direto.
- Cada carta usa o formato compacto `{ cat, a, class?, os?, xh?, q: [20] }`, e uma entrada que começa com `*` é especial. Uma carta nova entra no fim do arquivo da categoria dela.
- A ordem das cartas não muda o jogo: todo baralho é embaralhado, e o save guarda as cartas pelo nome.
