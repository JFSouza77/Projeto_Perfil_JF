# Debug interno (23/10/2026)

Evento interno, sem entrada nas novidades (pedido do JF). A versão continua **1.7.10.9.3**: as correções vão pro arquivo publicado, mas sem log de updates.

## O que foi feito

1. **Revisão de código** de tudo o que mudou da 1.7.10.6.2 até a 1.7.10.9.3 (cerca de 5 mil linhas). Saíram 18 achados prováveis; cada um foi conferido no código antes de corrigir.
2. **Macaco** (o teste que sai tocando em botões ao acaso) **ganhou a Corrida**: Tempo, Cartas Hardcore e Equipe. Antes, nenhum dos 12 cenários era da Corrida. Agora são 15.
3. **Rodada completa de testes:**
   - bateria;
   - geradores de fala, estresse do C.A.O.S. e auditoria de cartas;
   - rede completa;
   - macaco nos 15 cenários (celular e computador);
   - todos os cenários online.
4. **Checagem de nomes** com TypeScript: nenhuma função ou variável inexistente.

## Problemas encontrados e corrigidos

### Avisos da mesa (a tela escura que congela)
- **Votação virava "não".** A mesa aprovava descartar a carta com um aviso na tela, o aviso barrava o comando e o jogo dizia "A mesa disse NÃO". Agora a votação espera o aviso sair.
- **Carta do duelo podia nunca sair (Corrida).** Com a aba lenta, um aviso novo chegava entre a hora do anterior acabar e o timer dele disparar. Aí o "no fim" do anterior (puxar a carta do duelo ou do desempate) se perdia. Agora o anterior é encerrado direito antes do novo começar.
- **Fila de avisos cheia:** antes o aviso sumia junto com o que ele ia fazer no fim. Agora a fila vai até 12, e se encher, o que o aviso faria no fim acontece mesmo assim.
- **Juízo Final abria a dica por baixo do aviso.** A dica automática não esperava o aviso grande. Agora espera.
- **Aviso privado segurava o da mesa.** Uma Mão Leve (secreta) fazia o aviso da mesa (Presente, Piñata…) esperar uns segundos, e essa demora entregava que alguém tinha recebido um segredo. Agora o da mesa entra na hora e o privado volta depois, com o tempo que faltava.

### Online
- **Espectar duelo no host:** se um duelista jogava no mesmo dispositivo do host, o botão Espectar aparecia ali e mostrava a resposta pra ele. Agora não aparece.
- **Espectar em dois duelos seguidos:** o celular podia mostrar a resposta do duelo anterior. Agora a resposta vale só pra carta em que foi pedida.
- **Jogador que caiu por um instante era "puxado" pro host.** Na hora de começar, o "Joga aqui" movia também quem só tinha caído (🟠). Agora só move quem nunca entrou pela sala; quem caiu, o jogo avisa pra esperar voltar.
- **Trava de 3 s da lojinha da Corrida nos celulares:** os botões sumiam sem explicação. Agora aparece "os botões liberam em instantes".

### Modo C.A.O.S.
- **Pausa não segurava os prazos.** Pausar a partida parava os relógios, mas a abertura da dica, o intervalo, o duelo e a Era do Gelo continuavam contando. Ao despausar, tudo vencia de uma vez. Agora tudo espera junto.
- **A Era do Gelo podia acabar durante um aviso** (os 7 s exclusivos corriam com a mesa congelada). Corrigido.
- **"Carta dormindo" sobrava na rodada seguinte**, mesmo com todo mundo recebendo carta nova. Agora some na rodada nova.
- **O aviso de abertura ainda dizia "10 minutos".** Agora mostra o tempo de verdade (15).
- **Recuperar a partida empurrava os prazos** por causa de um tique antigo guardado no save. Corrigido.

### Corrida
- **Recarregar a página voltava com o baralho do Clássico** (com Ano!). Agora volta com o da Corrida.
- **Recarregar mudava o nome do especial:** "Rouba a vez" voltava a ser "Um palpite a qualquer hora". Corrigido.
- **Frase da primeira Coisa:** o C.A.O.S. dizia que "bicho conta como Coisa", mas na Corrida Animal é categoria própria. Agora usa a frase certa.
- **"Ganhou × gastou" errado com duelo:** o roubo de 25 do duelo bagunçava o "ganhou". Agora o duelo fica separado. Os dados da partida ganharam a coluna **Duelo**.

### Recarregar a página (achado pelo macaco novo da Corrida)
- **A partida inteira podia zerar.** O baralho da Corrida (e o do Modo C.A.O.S.) é uma mistura sorteada. Ao recarregar, o jogo sorteava outra mistura, a carta da vez às vezes não estava nela, o desenho dava erro e o jogo zerava tudo. Era raro (1 em cada 10 recargas da Corrida Hardcore no teste). Agora a lista de cartas vai no save, como já era no Clássico.
- **Proteção extra:** se um dia a carta da vez não voltar, só ela se perde: a mesa segue pra próxima carta, sem zerar a partida.

### Cartas
- **Três dicas entregavam a resposta:** "Terra do Nunca" (duas dicas com "nunca") e "Parque Pedra da Cebola" ("parede de pedra"). Reescritas. Os outros avisos da auditoria são de propósito (ex.: "Sou um escudo" como dica final).
- **Cartas repetidas:** quando o baralho é maior que o limite da partida, o recorte agora pega primeiro as cartas que não saíram nas últimas partidas. Antes era às cegas e só depois empurrava as repetidas pro fundo.
- **Gravação mais leve:** a memória das cartas recentes gravava a lista inteira a cada carta (seis vezes seguidas por rodada no Modo C.A.O.S.). Agora grava uma vez depois da rajada, e também ao fechar a página.

### Teste novo que achou bug do próprio debug
- O marcador de duelo criado no começo deste debug zerava ao recarregar. O macaco pegou, e ele passou a usar um contador que vai no save.

## Ficou registrado (não é bug, é dívida técnica)

- **Relógios espalhados:** cada relógio (vez, Corrida, Modo C.A.O.S., intervalo) desconta o tempo dos avisos e da pausa por conta própria. Funciona, mas toda função nova que conta tempo precisa lembrar de fazer isso, e foi daí que vieram vários bugs acima. Um "relógio único da partida" resolveria na raiz. É uma mudança grande, pra fazer com calma, nunca no meio de outra coisa.

## Resultado dos testes

Rodada final, depois de todas as correções:
- Bateria (14 suítes): tudo OK.
- Geradores de fala, estresse do C.A.O.S. e rede completa: OK.
- Auditoria de cartas: 0 erros.
- Macaco: 15 cenários no celular e 5 no computador, OK. A Corrida Hardcore, que falhava 1 em 10, passou 10 de 10 depois da correção.
- Online: Versus, Equipe, Express, as três Corridas, Modo C.A.O.S., duelo, segundo plano e host que cai: tudo OK.
- `build --testar`: mestre, debug, compacta e offline OK.
