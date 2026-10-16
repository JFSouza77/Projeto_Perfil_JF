# Perfil JF

Jogo de adivinhação por dicas (estilo Perfil) com o apresentador **C.A.O.S.**, feito pra jogar no celular, no
computador ou numa TV. **Versão atual: Beta 1.7.10.5.5 · C.A.O.S. 4.4.2** (16/10/2026).

- **Um aparelho só:** o jogo inteiro roda num HTML, sem precisar de internet (tem a versão `_offline`).
- **Online:** cada jogador entra pelo próprio aparelho, de qualquer lugar. Quem abre a sala é o host.
- O GitHub Pages publica o `index.html` (sempre a versão mais nova).

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
- Ficam no repositório só as **3 versões mais novas** (normal + offline), como reserva.
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
