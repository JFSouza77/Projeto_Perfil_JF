# Operação do Perfil JF (onde fica cada coisa e o que fazer se der problema)

> Parecer do Klaus, item R8. Aqui ficam **nomes e lugares**, nunca senhas ou chaves.

## 1. As três contas
| Conta | Pra quê | Quem cuida |
|---|---|---|
| **GitHub** (JFSouza77) | Código (`Projeto_Perfil_JF`) e o site (GitHub Pages: `jfsouza77.github.io/Projeto_Perfil_JF/`) | JF |
| **Cloudflare** (joaofe0000@…) | Servidor da sala `perfil-jf-sala.joaofe0000.workers.dev`: apresenta os aparelhos, lista as salas, ponte TURN, cartas reportadas | JF |
| **Registro do domínio** (futuro, DICAOS) | Endereço próprio | JF |

**Segurança das contas (o JF faz):** autenticação em dois fatores nas três e códigos de recuperação guardados **fora do celular** (papel ou outro lugar seguro).

## 2. Segredos do servidor (Cloudflare → Workers & Pages → perfil-jf-sala → Settings → Variables and Secrets)
| Nome | O que é | Onde nasce |
|---|---|---|
| `TURN_KEY_ID` | Id da ponte TURN | Cloudflare → Realtime → TURN Server ("Jogo JF") |
| `TURN_KEY_API_TOKEN` | Chave da ponte (aparece uma vez só) | idem |
| `REPORTES_SENHA` | Senha da página de cartas reportadas | o JF inventa |
| `ORIGENS` (variável, não segredo) | Sites que podem usar a lista de salas, a ponte e os reportes | `servidor/wrangler.toml` |

## 3. Tarefas comuns
- **Girar a chave da ponte** (vazou ou por precaução):
  1. Cloudflare → Realtime → TURN Server: apague o app e crie outro.
  2. Troque `TURN_KEY_ID` e `TURN_KEY_API_TOKEN` e toque em Deploy.
  3. Os jogos pegam as credenciais novas sozinhos (elas valem 24 h).
- **Trocar a senha dos reportes:** edite `REPORTES_SENHA` e toque em Deploy. O favorito antigo para de abrir.
- **Ver as cartas reportadas:** `https://perfil-jf-sala.joaofe0000.workers.dev/reportes?chave=SENHA`. "Ver como texto" serve pra copiar e mandar pro Claude.
- **Republicar o servidor:** qualquer mudança na pasta `servidor/` que entra na `main` é publicada sozinha (Cloudflare Builds). Pra forçar: Deployments → Retry build.
- **Publicar uma versão do jogo:** PR para a `main` (o Claude Code faz). O GitHub Pages publica o `index.html` em ~1 min.
- **Conferir se o servidor está vivo:** abra o endereço do servidor (tem que aparecer "Perfil JF · servidor da sala") e o `/ponte` (tem que aparecer `turn.cloudflare.com`).

## 4. Se algo parar
| Problema | O que acontece no jogo | O que fazer |
|---|---|---|
| Servidor nosso fora do ar ou estourou o limite do dia | O jogo usa o servidor público do PeerJS (reserva) e as pontes grátis. "Salas na sua rede" e reportes ficam parados (os reportes esperam na fila do aparelho) | Ver o status em cloudflarestatus.com; limites voltam 00:00 UTC (21h em Brasília) |
| Ponte TURN sem credenciais (`/ponte` vazio) | 4G com Wi-Fi pode não conectar pelas pontes grátis | Conferir os 2 segredos; girar a chave (3) |
| Servidor público do PeerJS fora do ar | Nada muda, se o nosso estiver no ar | — |
| GitHub Pages fora do ar | Quem tem o app instalado ou o arquivo offline continua jogando | Mandar o arquivo offline pra quem precisar |

## 5. Restaurar do zero
1. O repositório tem **tudo**: o jogo (`src/`), o servidor (`servidor/`) e as ferramentas. Backup: GitHub → Code → Download ZIP de vez em quando (o JF guarda fora do celular).
2. Servidor novo: seguir `servidor/LEIA-ME.md` (conta Cloudflare, importar o repositório com a pasta `servidor`, os 3 segredos). Se o endereço mudar, trocar `REDE_SERVIDOR` em `src/js/05k-rede.js` e publicar uma versão.
3. Jogo: `node build.js --testar --publicar` gera tudo a partir de `src/`.

## 6. Comportamentos conhecidos (não são bug)
- **Troca de host:** com o servidor nosso, o 2º Mestre assume ~20 s depois que o host some. Pelo público pode levar até ~90 s, porque ele segura o endereço de um aparelho sumido por mais tempo. O resultado final é o mesmo: um host só, nada perdido.
- **Cartas embaralhadas no site:** só atrapalham quem abre o código por curiosidade. **Não é segurança** (decisão consciente do JF).
- **"Salas na sua rede":** no 4G, a operadora pode pôr muita gente no mesmo endereço. Por isso o cartão não tem nome e o Júnior não aparece; o host sempre precisa aceitar.
