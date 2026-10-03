# Perfil JF

Jogo de adivinhação por dicas (estilo Perfil) com o apresentador C.A.O.S., feito para jogar no celular.
Tudo roda num HTML só, sem servidor. O GitHub Pages publica o `index.html`.

## Como trabalhar
- **A fonte é a pasta `src/`.** O que tem em cada parte está em `src/LEIA-ME.md`.
- `npm install` instala, uma vez, as ferramentas do build.
- `node build.js --testar --publicar` monta o Mestre, gera as versões debug, compacta e offline, testa no navegador e atualiza o `index.html`.
- `node ferramentas/auditar_cartas.js` confere as cartas. Só reporta, não muda nada.
- Nunca edite à mão o `Perfil_JF_Mestre_*.html` nem as saídas `Perfil_JF_*.html`.
- As saídas de versões anteriores não são apagadas nem sobrescritas (regra do Klaus).

## Documentos
- `docs/Status_do_Roteiro.md`: em que pé está o roteiro (organização na 1.7.5, online na 1.7.10).
- `docs/Publico_dos_Modos.md`: para quem é cada modo (Old School, Júnior, Clássico).
- `docs/Regras_dos_Logs.md`: onde registrar mudanças de cartas nos logs.
- O histórico de versões fica no topo de `src/html/01-cabeca.html`, e as novidades do jogo em `src/dados/07-novidades.js`.
