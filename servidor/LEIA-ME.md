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
