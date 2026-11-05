# Regras do JF com o Code (e do Code com o JF)

Tudo o que foi combinado entre o JF e o Claude Code até 05/11/2026, num lugar só. Serve pra abrir qualquer chat novo
do Code e manter o mesmo jeito de trabalhar. As regras curtas também estão no `CLAUDE.md` (o Code lê sozinho).

---

## 1. Quem é quem

- **JF** (João Fernando, JFSouza77): criador e diretor do Perfil JF. Ele decide; o Code executa e sugere.
- **Code** = o Claude Code (este, na nuvem de codificação). **Klaus** = o chat do Claude. **GPT** confere cartas pelo
  catálogo.
- **Elisa** (sobrinha do JF, 13 anos, com maturidade de uns 16): joga Júnior, Clássico, Old School e Hardcore. Relato e
  sugestão dela têm peso de **jogadora experiente**, não de criança.
- Outras pessoas que contribuem (Pedro, Felipe, Bruno Levanti, Klaus…) levam o nome nas novidades quando a ideia é delas.

## 2. Como conversar com o JF

- **Sempre em português**, linguagem simples, sem jargão. Resposta curta e direta; detalhe técnico só se ajudar.
- O JF tem **TDAH** e esquece pergunta aberta. **Puxar a orelha:** quando ele mandar mensagem e tiver pergunta do Code
  sem resposta, lembrar no fim, de leve ("Aproveitando que você veio: ficou isso aberto comigo…").
  - **Só na resposta a uma mensagem dele.** Relatório de tarefa automática não leva lembrete (ele nem chegou ainda).
- Relatório de trabalho feito: o que mudou, o que foi testado, o que falta. **Com prints** quando é coisa visual.
- Dizer a verdade: teste que falhou, coisa que não deu pra fazer, limite da ferramenta. Nunca dizer que está pronto sem
  ter conferido.
- Quando o JF pedir opinião, dar uma recomendação clara (não uma lista de opções sem posição).

## 3. Quem decide o quê

- **Publicar versão nova do jogo: só com o ok do JF.** (Ex.: "você tem meu ok pra postar".)
- **Decisões práticas (01/11/2026):** organização, juntar PR que não muda o jogo, quando soltar um ajuste já testado, por
  onde começar: o Code decide sozinho pelo mais fácil, prático e seguro, e **só avisa**.
  - PR só de documentação, ferramenta ou limpeza (não muda o jogo): o Code pode abrir, marcar pronto e mergear.
- **Apagar coisa** (arquivos, versões antigas, dados): perguntar antes.
- **"Você ajusta do jeito que quiser":** quando o JF fala isso, o Code calibra (números, quantidade de falas, desenho) e
  depois conta o que escolheu.
- **Ajustes pequenos:** pode ir acumulando e soltar junto com a versão aberta.

## 4. Agenda e prioridades (horário de Brasília)

- **Pedido urgente do JF ("pra agora") vem primeiro:** para testes e tarefas em segundo plano, faz só aquilo, publica
  (com o ok dele) e depois volta pro resto.
- **Coisa pequena e fácil:** ao longo da semana, na hora que o Code preferir.
- **Att grande ou muita task junta:** **quinta a partir das 18h** (os créditos renovam às 15h) e **sexta das 9h às 18h**.
- **Sexta depois das 18h, sábado e domingo:** nada grande, só se for muito necessário.
- Lista do que espera pra quinta: `docs/Pendencias_da_Semana.md`.
- **Tarefa automática das Temporadas:** 2 vezes por dia (8h47 e 23h47), um pedaço por vez, só quando não há pedido do JF
  pendente. Nunca publica sozinha.

## 5. Regras fixas do jogo e do conteúdo

- **Quantidades sempre terminam em 0 ou 5:** falas, cartas, pedaços de gerador, itens. Vale pro total e pra cada grupo
  (um banco novo tem 5, 10 ou 15, nunca 8). Contar de verdade antes de publicar.
- **Cartas com tema pesado:** entram (Perfil também é conhecimento), só com fatos, sem tomar partido, imparcial e honesto.
  **Nunca no Júnior**; podem cair no Clássico, Hardcore e Old School.
- **Cartas da 2.0:** meta de chegar perto de 2.000 cartas. Primeiro o rascunho, depois a estrutura, depois o filtro fino.
  Ficam **fora do baralho** até a 2.0 sair. Plano: `docs/Cartas_2.0_Perfil4.md`.
- **Equilíbrio do baralho:** lote da partida com cota igual por categoria (Clássico: 100 de cada).
- **C.A.O.S. nunca dá a 4ª joia** (pode ajudar, nunca entregar a vitória).
- **Temporadas:** o jogo entra no clima das datas (falas, enfeites, lojinha, cores, emojis, títulos, cartas valendo o
  dobro). Prioridade era o Natal (publicado na 1.9.3). **Nada vai pro ar sem o JF ver e autorizar.** Plano:
  `docs/Temporadas.md`.
- **Júnior:** só falas e cartas leves. Datas de homenagem com carinho e fatos, sem piada pesada.
- **Privacidade:** em print ou material público, nada de nome completo ou rosto das crianças da família; usar jogadores
  fictícios (Ana, Beto, Caio, Duda).

## 6. Versões e logs (detalhes em `docs/Regras_dos_Logs.md`)

- **Numeração:** 1.N.M. Depois do .9 sobe o número de cima (5.9.x → 6.0.0, nunca 5.10).
- **C.A.O.S. sobe de versão sempre que for mexido.** (Hoje: 5.4.0.)
- **Log com no máximo 7 itens e 7 ajustes (QoL) por versão.** Ajuste pequeno entra na versão aberta; passou de 7, condensa
  ou abre a próxima.
- **Carta nova só entra no log de uma "Cards and Rules Update".** Correção de carta existente pode ir no QoL.
- **Como escrever as novidades** (`src/dados/07-novidades.js`): pra quem joga, "emoji Título: explicação", título curto,
  nada de bastidores (código, IA, testes). O mais importante primeiro. Rascunho em `docs/Novidades_Rascunho.md`.
- **Versão nova:** título, `JOGO_BUILD`, linha no HISTÓRICO (`src/html/01-cabeca.html`), tela inicial (versão e data de
  hoje), novidades, `node build.js --testar --publicar`, PR pra `main`.

## 7. Como o Code trabalha no repositório

- **A fonte é `src/`.** `node montar.js` monta o Mestre; `node build.js --testar` gera e testa as saídas. **Nunca editar o
  Mestre nem as saídas à mão.**
- Depois de montar pra testar, **devolver o Mestre publicado como estava** (não commitar Mestre de teste).
- **Testar antes de entregar:** os testes que tocam no que mudou (ex.: `teste_temporadas`, `teste_cerebro`,
  `caos_teste_espinha`, `teste_baralho`, `caos_auditar_geradores --testar`) e o `build.js --testar`. Cada coisa nova
  ganha um teste que **falha sem a correção**.
- **Cartas:** auditor `node ferramentas/auditar_cartas.js`; carta planejada nova em
  `ferramentas/cartas_2.0_planejadas.json` e catálogo gerado de novo (`node ferramentas/catalogo_cartas.js`); carta nova no
  jogo precisa de assunto em `ferramentas/catalogo_assuntos.json`.
- **Falas do C.A.O.S.:** depois de mexer, gerar de novo o inventário (`node ferramentas/caos_inventario.js`).
- **Diário do Code** (`docs/Diario_do_Code.md`): antes de caçar bug, procurar o sintoma no Mapa; depois de cada correção,
  escrever no Registro (o que o JF viu, causa, o que mudou, teste que segura).
- **Git:** trabalhar em branch, PR pra `main` (rascunho enquanto não está pronto). **Nunca reescrever histórico nem force
  push.** PR mergeado não recebe trabalho novo: branch novo a partir da `main`.
- **Versões antigas:** ficam na pasta só as 3 mais novas (normal, offline e Mestre); o resto está no Git e no acervo do
  Drive (`node ferramentas/limpar_versoes.js`).

## 8. Segurança (inegociável)

- Chaves e senhas (TURN do Cloudflare, `REPORTES_SENHA`, `AZURE_SPEECH_KEY`, `AZURE_MAI_KEY`) ficam **só nos segredos do
  Cloudflare**. **Nunca** no código, em arquivo do repositório ou no chat.
- O Code **nunca pede chave ao JF**. Pra teste local, só valores de mentira na linha de comando.
- Não revelar senha descoberta nem "desembaralhar" o que está protegido.
- Nada de identificador de modelo de IA em commit, PR ou arquivo do repositório.

## 9. Onde fica cada coisa

| O quê | Onde |
|---|---|
| Regras curtas (lidas sozinhas pelo Code) | `CLAUDE.md` |
| Este documento | `docs/Regras_JF_e_Code.md` |
| Regras dos logs e quantidades | `docs/Regras_dos_Logs.md` |
| Pendências e lista de quinta | `docs/Pendencias_da_Semana.md` |
| Diário de bugs | `docs/Diario_do_Code.md` |
| Temporadas (plano e progresso) | `docs/Temporadas.md` |
| Cartas da 2.0 | `docs/Cartas_2.0_Perfil4.md` e `ferramentas/cartas_2.0_planejadas.json` |
| Contas, servidor e o que fazer se der problema | `docs/Operacao.md` |
| Roteiro 1.9 e 2.0 | `docs/Roteiro_1.9_e_2.0.md` |

## 10. Pra levar pra um chat novo do Code

Cole isto no começo:

> Leia o `CLAUDE.md` e o `docs/Regras_JF_e_Code.md` do repositório JFSouza77/Projeto_Perfil_JF e siga as regras de lá.
> Fale comigo em português simples. Antes de começar, veja `docs/Pendencias_da_Semana.md` e o que está aberto em
> `docs/Temporadas.md`.
