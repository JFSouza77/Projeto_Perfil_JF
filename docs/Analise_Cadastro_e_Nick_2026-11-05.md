# Cadastro, nick e PIN: análise (05/11/2026)

Pedido do JF (relatório do GPT de 04/11, `ANALISE_CADASTRO_JOGADORES_E_PROTECAO_DE_NICK`): ele adicionou à partida
os nicks dos sobrinhos sem digitar o PIN deles, e o jogo aceitou. **Isto é só diagnóstico e proposta: nada do jogo
foi mudado.** Nenhuma senha, PIN ou embaralhado de senha aparece aqui.

## 1. Comportamento confirmado (reproduzido na branch atual, com servidor local e nick de teste inventado)

| Caso | O que aconteceu |
|---|---|
| Nick com cadastro, com internet, outro aparelho, sem PIN | Apareceu "🔐 O nick tem cadastro. Digite o PIN… (sem o PIN, ele te trata como se fosse a primeira vez)". Em "Agora não", **o jogador entrou na partida** com aquele nome, marcado como `nickEmprestado`: sem login e **sem usar a memória (ficha) do dono** |
| Sem internet, aparelho que nunca soube do cadastro | Entrou e **usou a ficha que existia naquele aparelho** pra aquele nome (`nickEmprestado` falso). É a memória antiga "do dispositivo", de antes do cadastro |
| Sem internet, aparelho que já sabia do cadastro | Entrou como `nickEmprestado`, sem ficha |

Ou seja: **hoje o PIN protege a memória do C.A.O.S. (a ficha na nuvem), não o nome.** Isso está escrito de propósito no
cabeçalho de `src/js/05t-contas.js`: "quem usa um nick com cadastro sem entrar joga normal, mas o C.A.O.S. trata
como se fosse a primeira vez". O que o JF viu é o projeto funcionando como foi desenhado, mas o desenho não é o que ele
espera agora.

## 2. O que provavelmente confundiu (confirmado no código; vale reproduzir com o JF olhando)

O reconhecimento das pessoas conhecidas é **pelo nome digitado**, sem olhar o cadastro:
- piadas internas dos sobrinhos e dos amigos (`sobrinhoInfo`, `presenteDe`, `caosAmigoBanco` em `13-amigos.js`);
- o tratamento de criador do JF (`isJfName`) e o avatar exclusivo;
- o conteúdo ligado à Anne (`isAnneName`).

Então, quando outra pessoa digita o nick de um sobrinho, a memória dele não é usada, **mas o C.A.O.S. faz as piadas
dele**. Pra quem olha a mesa, parece que o perfil foi usado.

## 3. Estado atual da implementação

**Conceitos que existem hoje:**
1. **Jogador da partida:** só um nome, com cor, avatar e humor (`players`).
2. **Ficha no aparelho:** a memória do C.A.O.S. por nome, no `localStorage` (`fichaGet`, `fichaUpd`).
3. **Cadastro na nuvem:** nick + PIN de 4 números (servidor `/conta/*`). Guarda a ficha e os logins de até 6 aparelhos.
4. **Sala online:** o celular do convidado entra pela sala do host.

**O que o PIN faz:** entra no cadastro (`/conta/entrar`) e cria um login (token) neste aparelho. Só com o token o
aparelho lê (`/conta/ficha`) e grava (`/conta/salvar`) a memória da nuvem.

**Onde o nick é único:**
- No servidor: um cadastro por nick, sem acento e sem diferença de maiúscula.
- Na partida: o mesmo nome não entra duas vezes.
- Não existe reserva do nome na tela de adicionar jogador.

**Credenciais de administrador** (só onde ficam e o que liberam; nenhum valor):

| Credencial | Onde fica e onde é conferida | O que libera |
|---|---|---|
| **Senha do servidor** (segredo `REPORTES_SENHA` no Cloudflare) | Só no servidor; conferida no Worker, com comparação de tempo constante | Página dos reportes e página `/contas`: zerar PIN, apagar cadastro, limpar cadastros antigos, baixar tudo |
| **Senha do ADM Criador** (dentro do jogo) | Conferida **no próprio aparelho**, com um embaralhado curto (FNV de 32 bits) que está no código público | Painel do ADM no jogo e "remover da partida" (junto com a senha do host da sala) |

**Achado grave:** o **valor** da senha do ADM aparece por extenso no código público (o local exato foi passado pro JF
só no chat, pra este documento não virar placa indicando onde olhar). Como o jogo é publicado aberto no
GitHub Pages, qualquer pessoa que abra o código vê. Além disso, um embaralhado de 32 bits de uma senha curta se
desfaz em segundos.
- **Conclusão:** a senha do ADM no jogo serve como "trava de mesa" (pra criança não remover ninguém sem querer), não
  como segurança.
- **Recomendo trocar essa senha e tirar o valor do código**, mesmo que o resto fique pra depois.
- Não testei nenhum valor, e o valor não aparece neste documento.

## 4. Riscos e lacunas pro fluxo que o JF quer

| # | Lacuna | Efeito |
|---|---|---|
| 1 | O nome não é reservado: "Agora não" deixa entrar com o nick | É o relato do JF |
| 2 | Piadas e tratamento por nome não olham o cadastro | Outra pessoa ganha as piadas internas de alguém |
| 3 | **Sem internet, o aparelho não tem como conferir o PIN** | Offline, só dá pra bloquear o nick que o aparelho já sabe que tem cadastro |
| 4 | Na sala online, o celular manda o **login (token) do cadastro pro host**, e o host guarda no salvamento da partida (`08-salvamento.js`) | O aparelho do host fica com um login que dá pra ler e gravar a memória do convidado na nuvem. Numa mesa de família o risco é baixo, mas não é o certo |
| 5 | **PIN zerado pelo JF:** quem digitar aquele nick primeiro cria o PIN novo e fica com a memória | Na hora de recuperar, outra pessoa pode tomar o perfil |
| 6 | A senha do servidor vai no endereço da página (`?chave=`) e o servidor não limita tentativas dela | Fica no histórico do navegador; quem souber o endereço pode tentar várias vezes |
| 7 | `/conta/existe` responde se um nick tem cadastro (até 300 pedidos por hora por endereço) | Dá pra descobrir quais nicks são cadastrados. É inevitável se a tela tiver que dizer "esse nick tem cadastro"; o limite só deixa mais lento |
| 8 | PIN de 4 números, travando 15 minutos depois de 5 erros | Cerca de 480 tentativas por dia: dá pra achar um PIN em semanas, insistindo. E quem errar de propósito trava o dono |

**Modelo de ameaça real:** jogo de família e amigos, com a mesma pessoa do lado da outra. O que importa:
- ninguém "virar" outra pessoa por engano ou brincadeira (a memória e as piadas de cada um);
- crianças;
- um link público, onde qualquer um pode tentar.

Não há dinheiro nem dado sensível no cadastro: a ficha é só estatística de jogo.

## 5. Fluxo mínimo recomendado

**Ideia central:** separar o **nome na mesa** do **perfil**. Convidado legítimo continua jogando, só que com um nome
que não é o de um perfil.

Quando o nick digitado tem cadastro (o servidor respondeu, ou o aparelho já sabia):

```
🔐 Esse nick já tem cadastro. Se for seu, digite seu PIN.
[ Digitar o PIN ]   [ Usar outro nick ]   [ 🛠️ ADM ]
```

1. **Digitar o PIN** (igual a hoje): entra com o perfil e a memória.
2. **Usar outro nick:** volta pro campo com uma sugestão ("NickTeste 2"). O convidado joga normal, sem ficha nem
   piadas do dono.
3. **ADM:** pede a senha do ADM e deixa claro o que vai acontecer: "O ADM está liberando o nick X **nesta partida**,
   como convidado: sem a memória e sem as piadas do dono." Isso **não** é entrar no perfil.
   - Recuperar ou zerar o PIN continua só pela página `/contas` do servidor, com a senha do servidor.
4. **Sem resposta do servidor e o aparelho não sabe do cadastro:** entra como hoje, porque não há como saber.
   - Pra diminuir isso: quando estiver online, o aparelho guarda a lista dos nicks com cadastro que já viu.
5. **Piadas e tratamento por nome** (família, amigos, JF, Anne) só valem quando o nick **não** tem cadastro ou quando
   está logado.
   - Este item sozinho já resolve a sensação de "usaram o perfil dele" e é pequeno.

**Junto (segurança, pequeno):**
- trocar a senha do ADM e tirar o valor dela do código;
- o host não guardar o login do convidado no salvamento: só na memória enquanto a partida roda. Melhor ainda: o
  servidor dar um login só pra salvar a ficha daquela partida, que vence sozinho;
- ao zerar o PIN, gerar um **código de uso único** que o JF entrega pro dono, em vez de deixar o nick aberto pra quem
  chegar primeiro;
- senha do servidor por formulário (não no endereço), com limite de tentativas;
- trava do PIN que cresce: 15 minutos, depois 1 hora, depois 24 horas;
- avisar o dono ("tentaram entrar no seu cadastro") quando ele entrar.

**Ordem que eu sugiro (o JF decide):**
1. trocar a senha do ADM;
2. piadas só com login (item 5);
3. a janela com as três opções;
4. o login do convidado fora do salvamento;
5. o código de uso único;
6. o resto.

## 6. Dados que precisam continuar valendo

- **Fichas do aparelho:** a chave das fichas.
- **Logins:** `perfil5_contas`, `perfil5_contas_conhecidas` e `perfil5_contas_recusadas`.
- **Partidas salvas:** as que já têm `nickEmprestado` e `conta`.
- **Cadastros do servidor:** prefixo `c:` (nick, sal, embaralhado, tokens, ficha, falhas, criado, visto).
- **Medalhas da temporada**, que dependem de `memContaFicha`: nick emprestado não ganha medalha.
- **Partida em andamento:** quem já entrou como convidado não pode ser expulso por uma mudança de versão no meio do
  jogo.

## 7. Testes de aceitação propostos

1. Nick sem cadastro: entra como hoje (com a oferta de cadastrar).
2. Nick com cadastro e PIN certo: entra com a memória.
3. Nick com cadastro, PIN errado 5 vezes: trava e não entra com esse nick.
4. Nick com cadastro e "Usar outro nick": o nome sugerido entra e o original não.
5. ADM libera como convidado: entra sem ficha e sem piadas, com o aviso na tela.
6. Senha do ADM errada: não libera.
7. Sem internet, aparelho que já sabia do cadastro: pede o PIN ou outro nick. Aparelho que não sabia: entra como
   hoje.
8. Sala online:
   - o convidado do celular com login entra com a memória;
   - sem login, cai nas mesmas três opções;
   - o salvamento do host não guarda o token.
9. Nick de sobrinho (nome de teste) sem login: nenhuma piada interna. Com login: piadas normais. JF sem login: sem o
   tratamento de criador.
10. PIN zerado: só quem tem o código de uso único cria o PIN novo.
11. A senha do ADM não aparece no código montado (teste procura o valor e falha se achar).
12. Partida salva antiga com `nickEmprestado` e `conta` abre igual.
13. Iniciante, Júnior e "não perguntar de novo" continuam como hoje.

**Aguardando a decisão do JF antes de implementar.**
