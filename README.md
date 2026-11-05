# Perfil JF

**Jogo de adivinhação multiplayer com o apresentador C.A.O.S.** Uma pessoa é o Mestre, os outros pedem dicas e tentam
descobrir a carta. O C.A.O.S. narra a partida, zoa, torce, se irrita e se emociona com a mesa.

### ▶️ [Jogar agora](https://jfsouza77.github.io/Projeto_Perfil_JF/)

Roda no navegador do celular, do computador ou da TV, sem instalar nada. **Versão atual: Beta 1.9.3 · Edição de Natal
· C.A.O.S. 5.4.0** (04/11/2026).

- **1.000 cartas** em Pessoa, Lugar, Coisa, Ano e Animal, com 20 dicas cada.
- **7 modos:** Clássico, Hardcore, Express, Júnior (pra criança), Old School, Modo C.A.O.S. e Corrida contra o Tempo.
- **Um aparelho só ou online:** a mesa inteira num celular, ou cada jogador no próprio aparelho, de qualquer lugar.
  Quem abre a sala é o host; dá pra usar a TV como telão.
- **C.A.O.S.:** um apresentador com emoções, memória dos jogadores, voz e milhares de falas montadas por contexto.
- **Temporadas:** o jogo entra no clima das datas (Natal, Ano Novo e outras), com falas, enfeites e cartas da época.
- **Funciona offline** (versão `_offline`) e pode ser instalado como app (PWA).
- **Acessibilidade:** tamanho de letra, mais tempo pra ler, leitura das dicas em voz alta, alto contraste e menos movimento.

**Por dentro:** HTML, CSS e JavaScript puros, sem framework, montados num arquivo só a partir de `src/`. O online usa um
servidor próprio no Cloudflare Workers. Testes automáticos no navegador (Playwright): partidas inteiras simuladas,
online com vários aparelhos, auditoria de cartas, de botões e de falas.

## Como trabalhar
- **A fonte é a pasta `src/`.** O que tem em cada parte está em `src/LEIA-ME.md`; a ordem, em `src/ordem.txt`.
- `npm install` instala, uma vez, as ferramentas do build.
- `node montar.js` junta o `src/` no Mestre (`Perfil_JF_Mestre_*.html`).
- `node build.js --testar --publicar` gera as versões normal, debug e offline, testa no navegador e atualiza o `index.html`.
- Nunca edite à mão o Mestre nem as saídas `Perfil_JF_*.html`.
- Cada versão nova: título e versões no código, linha no HISTÓRICO (`src/html/01-cabeca.html`) e nas NOVIDADES
  (`src/dados/07-novidades.js`, regras em `docs/Regras_dos_Logs.md`), build, testes, PR.

## Testes
- `npm run testes` (nomes via TypeScript, ações, duelo, identidade, telão e C.A.O.S.), `npm run auditar` (cartas e botões:
  toque, nome, contraste e texto vazando nos temas Noturno e Claro).
- `npm run rede` e `node ferramentas/teste_online.js` testam o online com vários aparelhos simulados.
- `npm run simular` joga partidas inteiras; `npm run macaco` toca na tela ao acaso procurando travas;
  `npm run equilibrio` compara a duração e a justiça das condições de vitória.

## Servidor do online (Cloudflare)
- Código em `servidor/` (`worker.js`); passo a passo em `servidor/LEIA-ME.md`.
- **Publica sozinho:** o Cloudflare (Workers Builds) está ligado a este repositório e republica a cada merge no `main`.
- Chaves e senhas (TURN, Azure, reportes) ficam **só** nos segredos do Cloudflare. Nunca no código nem no chat.

## Versões antigas e backup
- Ficam no repositório só as **3 versões mais novas** (normal, offline e Mestre), como reserva.
- As antigas estão no histórico do Git e no **acervo do Drive** do JF ("Projeto Perfil JF > Perfil JF - Acervo GitHub").
- `node ferramentas/limpar_versoes.js` mostra o que sairia; `--apagar` limpa; `--acervo PASTA` monta o pacote
  pro Drive (zip com todas as versões, histórico completo do Git e impressões digitais SHA-256).
- Uma rotina agendada faz isso todo dia 1º do mês e manda o acervo pro JF guardar.

## Autoria
© 2026 JF (JFSouza77). Todos os direitos reservados. Criação e direção: JF.
Ver `AUTORIA.md` e `docs/Registro_de_Versoes.md` (impressão digital de cada versão publicada).
Ideias e testes de quem jogou levam crédito nas novidades do jogo.

## Documentos
- `docs/Operacao.md`: onde fica cada coisa (GitHub, Cloudflare, Drive) e o que fazer se der problema.
- `docs/CAOS_Cerebro.md`: como o C.A.O.S. pensa, fala e sente.
- `docs/Publico_dos_Modos.md`: para quem é cada modo (Old School, Júnior, Clássico).
- `docs/Regras_dos_Logs.md` e `docs/Correcoes_de_Cartas.md`: regras das novidades e correções de cartas.
- `docs/Estado_da_Partida.md`: o estado do jogo, peça por peça.
- `docs/Dominio_Preparacao.md`: o que já está pronto pro domínio próprio e o passo a passo da troca.
- `docs/brainstorm/`: ideias em discussão (Modo C.A.O.S., Corrida contra o Tempo, Telemetria).
- `docs/Parecer_do_Klaus_Rumo_a_Release_1_0.md` e `docs/Resposta_ao_Parecer_do_Klaus.md`: o caminho até a 1.0.
- Históricos (já cumpridos): `docs/Status_do_Roteiro.md`, `docs/Roteiro_Multiplayer.md`,
  `docs/Roteiro_Organizacao_e_Online.md`, `docs/Relatorio_1.7.0_a_1.7.9.md`, `docs/Instrucoes_Debug_Externo.md`.
