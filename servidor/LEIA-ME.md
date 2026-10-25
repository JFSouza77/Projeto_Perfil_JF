# Servidor da sala (Cloudflare)

O servidor nosso do online do Perfil JF. Fica no Cloudflare, no plano grátis, e faz três coisas:

1. **Apresenta os aparelhos.** Faz o papel que hoje é do servidor público do PeerJS. Se o nosso cair, o público segura, porque o jogo abre a sala nos dois.
2. **Lista as salas da sua rede.** Na tela "🌐 Jogar online" aparecem as salas abertas no mesmo Wi-Fi. É só tocar pra entrar, e o host ainda precisa aceitar.
3. **Dá a ponte (TURN) do Cloudflare.** É ela que liga quem está no 4G/5G com quem está no Wi-Fi. São 1.000 GB por mês grátis, o que dá milhares de partidas.

O código é o `worker.js`, e a configuração fica no `wrangler.toml`.

## Passo a passo (uma vez só, dá pra fazer pelo navegador do celular)

### 1. Criar a conta
1. Entre em **dash.cloudflare.com** e crie a conta grátis (e-mail e senha).

### 2. Ligar o servidor ao GitHub
2. No menu, vá em **Compute (Workers) → Workers & Pages → Create → Import a repository**.
3. Conecte o GitHub e escolha o repositório **Projeto_Perfil_JF**.
4. Em **Root directory** (pasta), escreva `servidor`. Deixe o resto como está e toque em **Deploy**.
5. No fim, aparece o endereço do servidor, algo como `perfil-jf-sala.SEU-NOME.workers.dev`. **Mande esse endereço pro Claude**: ele põe o endereço no jogo (`REDE_SERVIDOR`, em `src/js/05k-rede.js`).

A partir daí, toda mudança nesta pasta que entrar no GitHub publica o servidor sozinha.

### 3. Criar a ponte (TURN)
6. No menu, vá em **Realtime → TURN Server → Create** (dê um nome, por exemplo "perfil-jf").
7. Ele mostra dois códigos: **Turn Token ID** e **API Token**. Copie os dois. O API Token só aparece uma vez.
8. Volte em **Workers & Pages → perfil-jf-sala → Settings → Variables and Secrets → Add**:
   - tipo **Secret**, nome `TURN_KEY_ID`, valor = o Turn Token ID;
   - tipo **Secret**, nome `TURN_KEY_API_TOKEN`, valor = o API Token.
9. Toque em **Deploy** (ou **Save and deploy**).

### 3b. Senha da página de cartas reportadas
- Em **Variables and Secrets → Add**, crie um **Secret** com o nome `REPORTES_SENHA`. O valor é uma senha que só você sabe (pode ser uma frase).
- Pra ver os reportes, abra `https://perfil-jf-sala.SEU-NOME.workers.dev/reportes?chave=SUA-SENHA`. Salve nos favoritos.
  Na mesma página, embaixo das cartas, ficam os **problemas reportados** (25/10/2026: 🐞 Reportar um problema, na pausa),
  cada um com o retrato da partida (versão, carta, placar, últimas jogadas; sem nomes).
  Cartas e problemas podem vir com até 3 imagens (o print da tela tirado sozinho e fotos/prints do aparelho):
  aparecem em miniatura; toque pra abrir grande. As mais antigas saem sozinhas (até 600 pedaços guardados).
- Pra ver os cadastros dos jogadores (nick + PIN, 11/2026), abra `https://perfil-jf-sala.SEU-NOME.workers.dev/contas?chave=SUA-SENHA` (a mesma senha dos reportes). Lá dá pra zerar o PIN de quem esqueceu (a memória continua), apagar um cadastro, limpar quem sumiu há muito tempo e baixar tudo em JSON.

### 3c. Voz nova do C.A.O.S. (Microsoft Azure, plano grátis)
1. Entre em **portal.azure.com** e crie a conta grátis (pede cartão só pra conferir; o plano grátis F0 não cobra).
2. No topo, busque **Speech services** (Serviços de Fala) → **Criar**:
   - Grupo de recursos: crie um novo (ex.: "perfil-jf");
   - Região: **Brazil South**;
   - Nome: qualquer um (ex.: "perfil-jf-voz");
   - Tipo de preço: **Free F0**.
   Toque em **Revisar + criar** → **Criar**.
3. Quando terminar, abra o recurso → **Chaves e Ponto de Extremidade** (Keys and Endpoint). Copie a **Chave 1** e o
   **Local/Região** (fica como `brazilsouth`).
4. No Cloudflare, em **Workers & Pages → perfil-jf-sala → Settings → Variables and Secrets → Add**:
   - tipo **Secret**, nome `AZURE_SPEECH_KEY`, valor = a Chave 1;
   - tipo **Secret**, nome `AZURE_SPEECH_REGION`, valor = `brazilsouth`.
   Toque em **Deploy**.
5. Opcional: pra trocar a voz, crie a variável (texto) `AZURE_VOZ` com o nome de outra voz brasileira do Azure
   (padrão: `pt-BR-AntonioNeural`). A lista e as amostras ficam na Galeria de Voz do Azure (Speech Studio).
   Teto do mês: variável `VOZ_TETO_MES` (padrão 400000 letras, abaixo do grátis do Azure).
   Emoção (1.7.10.3.1): o jogo manda a emoção de cada fala; o servidor muda volume e pausas sozinho. Se um dia
   usar uma voz com estilos (as MAI-Voice da Microsoft, ex.: Caio), crie a variável `AZURE_ESTILOS` = `1` e a
   emoção vira o estilo dela (alegre, triste, bravo, sussurrando...).

### 3d. Voz com emoção de verdade (opcional, paga: MAI-Voice, ex.: Caio)
A voz grátis (3c) continua configurada e vira a **reserva**: se a voz com emoção falhar (crédito acabou, chave
errada), o servidor usa a grátis sozinho, sem o jogo perceber.
1. No Azure, crie um recurso **Microsoft Foundry** numa região que tenha MAI-Voice (ex.: **East US**).
2. Copie a chave (Chave 1) e a região (ex.: `eastus`).
3. No Cloudflare (**perfil-jf-sala → Settings → Variables and Secrets**):
   - Secret `AZURE_MAI_KEY` = a chave;
   - Secret `AZURE_MAI_REGION` = a região (ex.: `eastus`);
   - (opcional) variável `AZURE_MAI_VOZ` (padrão `pt-BR-Caio:MAI-Voice-2.1-Flash`).
   Toque em **Deploy**.
4. Pra voltar só pra voz grátis: apague `AZURE_MAI_KEY` e toque em **Deploy**.
O teto do mês (`VOZ_TETO_MES`, padrão 400 mil letras) vale pras duas: com a MAI Flash (US$ 15 por milhão de letras),
dá no máximo uns US$ 6 por mês. Crie também um alerta de orçamento no Azure (Gerenciamento de Custos → Orçamentos).

Conferir: `.../voz/estado` tem que mostrar `{"ligada":true}`. Sem isso (ou sem internet), o C.A.O.S. fala com a voz do aparelho, como antes.

### 4. Conferir
- Abra `https://perfil-jf-sala.SEU-NOME.workers.dev/`: deve aparecer "Perfil JF · servidor da sala".
- Abra `.../ponte`: deve aparecer uma lista `iceServers` com `turn.cloudflare.com`. Se vier vazia, confira os dois segredos.

## Quanto custa

Nada, dentro destes limites:

- **Workers grátis:** 100 mil pedidos por dia. Uma partida usa algumas centenas.
- **Durable Objects grátis:** cabem no plano grátis. Os aparelhos ficam "dormindo" no servidor entre uma mensagem e outra, sem gastar.
- **Ponte TURN:** 1.000 GB por mês grátis. Depois disso, US$ 0,05 por GB. Só passa pela ponte quem não consegue ligação direta, e uma partida inteira pela ponte gasta poucos MB.

Se algum dia a conta parar, o jogo continua funcionando pelos servidores públicos, como era antes.

## Testar no computador (pra quem mexe no código)

```
cd servidor
npx wrangler dev --port 8787
node ../ferramentas/teste_rede.js --servidor=8787
```

O teste roda o roteiro de rede inteiro passando pelo servidor nosso, no lugar do `peer` local.
