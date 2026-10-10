# Perfil JF — Parecer do Klaus e Rumo à Release 1.0

**Última atualização:** 10/10/2026 às 19:00 (horário de Brasília, pelo servidor)
**ORIGEM:** Claude (chat do Projeto Perfil, "Klaus") · **MOTIVO:** a pedido do JF
**Destinatário:** Claude Code. GPT e Gemini podem ler como contexto.
**Base:** `Relatorio_1.7.0_a_1.7.9.md` (escrito pelo Claude Code), a página publicada (Beta 1.7.9.9) e a leitura do repositório na versão 1.7.0.

> **Limite honesto:** o Klaus **não leu o código da 1.7.9.9**. Tudo abaixo vem do relatório, da página ao vivo e de conhecimento geral. Cada item marcado **[CONFIRMAR]** precisa ser checado no código real antes de virar tarefa. Itens classificados como bug real, decisão consciente, melhoria futura ou regra em aberto seguem o protocolo do projeto.

---

## 0. Contexto e nomenclatura de fase (decisão do JF)

- **Hoje:** Beta Pré-Release **1.7.9.9**.
- **1.7.10 (e suas ramificações):** será a **última Beta Pré-Release**.
- **Depois:** **Release 1.0** (o JF aceita chamar só de "Release 1.0" para facilitar a distinção).

### 0.1 Alerta: a troca de numeração pode quebrar a lógica de versão **[CONFIRMAR]**
Ir de `1.7.x` para `1.0` parece **voltar** no número. O relatório diz que o online compara versões (o convidado avisa "o host é mais velho", e o convidado com versão velha recarrega sozinho). Se essa comparação for numérica por partes, `1.0` seria considerada **mais antiga** que `1.7.10`.

Pedido ao Code:
1. Mapear **todos** os pontos que comparam, ordenam ou interpretam o número de versão (rede, service worker, `build.js`, `montar.js`, registro de versões, PWA, save).
2. Se houver comparação numérica da versão de exibição, separar em dois conceitos:
   - **Nome de exibição** ("Release 1.0", "Beta 1.7.10"): só texto.
   - **Número de build interno monotônico** (inteiro que só cresce, ex.: `build: 1799`, `1810`, `2000`): é ele que a rede e o service worker comparam.
3. Garantir que o build aceite o nome novo sem sobrescrever saídas antigas.
4. Chaves de save continuam **sem renomear** (`perfil200_state`, `perfil5_*`).

---

## 1. Parecer geral

**Veredito:** o projeto está bem arquitetado e muito bem testado para o tamanho. A fundação (fonte em `src/`, build com saídas, porta única de ações, host autoritativo, espinha do C.A.O.S., bateria de testes) é sólida. O que falta para a Release **não é mais recurso**, é **estabilização, prova em aparelhos reais e proteção contra riscos de operação** (endereço, contas, privacidade, saves).

### 1.1 Pontos fortes (manter)
- `src/` com 78 partes + `ordem.txt` + registro de versões com SHA-256.
- Rede com host autoritativo; a tela e a rede passam pela **mesma porta** (`dispatchAction`); a resposta nunca vai no retrato público; sessão presa à conexão; limite de ritmo; validação de envelope.
- Fallback: servidor próprio (Cloudflare) **e** PeerJS público.
- Bateria de 13 testes, incluindo partida inteira online, segundo plano e atualização do host.
- Espinha do C.A.O.S. (3 leis) com teste dedicado que tenta quebrá-la.
- Acessibilidade levada a sério (auditoria de botões: toque ≥ 44 px, nome acessível, contraste AA).
- Chaves de save intactas, save antigo sempre abre.
- Bug do baralho (`deck.pop()` + montagem equilibrada) corrigido com `.reverse()`.

### 1.2 Pontos de atenção (ordem de importância)
Detalhados na seção 2.

---

## 2. Riscos e achados (com recomendação)

### R1 · Mudança de endereço pode apagar saves e memória do C.A.O.S. — **crítico, classificar como risco real**
- `localStorage` é **por origem**. Ir de `jfsouza77.github.io` para `dicaos.com.br` é outra origem: chaves intactas **não** resolvem.
- Ao configurar domínio próprio no GitHub Pages, o endereço antigo **passa a redirecionar** para o novo; a página velha deixa de carregar e **não consegue exportar nada**.
- O app instalado na tela de início (PWA, principalmente iOS) fica preso à origem antiga.
- O service worker e o cache também são por origem.

**Recomendação:**
1. **Antes** de ligar o domínio, publicar uma versão no endereço antigo com aviso "vamos mudar" e fluxo guiado para **levar saves e memória do C.A.O.S.** (o "Levar/Trazer" e o "Exportar partida" já existem; reaproveitar).
2. Avaliar transferência automática entre origens (ex.: página no endereço antigo abre o novo passando os dados por um canal seguro) e medir o que funciona no iOS Safari. **[CONFIRMAR viabilidade]**
3. Manter o endereço antigo funcionando o máximo possível durante a transição; só então ligar o domínio.
4. Documentar o passo a passo para o JF (reinstalar o PWA no iPhone, etc.).
5. Quem já tem partida salva no aparelho precisa conseguir terminar antes da mudança, ou exportar.

### R2 · "Salas na sua rede" e privacidade (CGNAT, crianças) — **decisão do JF + melhoria**
- A lista agrupa por IP público. Em 4G/5G, operadoras compartilham IP (CGNAT): estranhos podem ver códigos de sala.
- O aceite do host protege, mas o **nome do estranho aparece para o host** (e o do host aparece na lista?).

**Recomendação:**
- A lista **não** deve mostrar o nome do host (só "sala disponível" ou nada que identifique).
- **Desligar a lista no Perfil Júnior** (6+): exigir código digitado.
- Nick vindo de outro aparelho: limitar tamanho/caracteres e escapar sempre (já há "nome limpo", **[CONFIRMAR]** cobertura em todas as telas).
- Decisão do JF: manter ou não a lista no modo adulto.

### R3 · Armazenamento no Safari/iOS — **risco real, mitigar**
Pelo que se sabe, o Safari pode apagar dados de sites não instalados após cerca de 7 dias sem uso (app instalado na tela de início é isento). **[CONFIRMAR comportamento atual do iOS]**

**Recomendação:** lembrete discreto para instalar o app e exportar o "Save de Bolso"; mensagem clara se o save sumir; reforçar o botão de exportar no fim da partida.

### R4 · Lacunas de teste em aparelho real — **bloqueia a Release**
A "suspensão do iPhone" no teste é simulada (JS pausado pelo depurador). Não substitui o iOS real.

Matriz mínima para o beta com a família (aparelhos reais):
| Cenário | Por quê |
|---|---|
| Wi-Fi → 4G no meio da partida | reconexão/mudança de rota ICE |
| Host em 4G/5G (CGNAT) e convidado em Wi-Fi | NAT difícil, depende de TURN |
| Wi-Fi que bloqueia WebRTC/UDP (escola, empresa) | TURN por TCP/TLS; **[CONFIRMAR]** que a lista de servidores TURN inclui 443/TLS |
| Tela bloqueada na vez do Mestre | segundo plano no iOS/Android |
| Android com economia de bateria | processos congelados |
| Host em iPhone, convidados em Android e vice-versa | diferenças de navegador |
| Partida longa (30+ min) | vazamento de memória, timers |
| Sala entre cidades (ex.: Vila Velha ↔ Piúma) | caso de uso original do JF |

### R5 · Complexidade e velocidade de mudança — **gestão**
Cerca de 40 versões em 10 dias, com recursos grandes (troca de host, votação, QR, ponte TURN). A **troca de host** é a parte mais complexa e talvez a menos usada em partida de família.

**Recomendação:** **congelar recursos** (ver seção 4). Decidir, com dados do beta, se a troca de host fica como está, é simplificada ou fica documentada como "experimental".

### R6 · Cifra do catálogo não é segurança — **decisão consciente (registrar)**
A cifra por substituição só atrapalha quem abre o código por curiosidade. Está certo para jogo entre amigos (decisão do JF). Não apresentar como proteção na documentação nem no manual. O host/Mestre no aparelho continuam vendo o necessário.

### R7 · Fatos das 1000 cartas — **melhoria**
`auditar_cartas` valida formato, ids e vazamento, mas **não valida se o fato está correto**.

**Recomendação (só com autorização do JF para mexer em conteúdo):** botão discreto "reportar carta" durante o beta que guarda localmente (e permite copiar/exportar) o id da carta e a dica reportada, para curadoria posterior. Não corrigir conteúdo sem pedido.

### R8 · Contas e continuidade — **operacional, antes da Release**
O projeto depende de GitHub, Cloudflare e (futuro) registro de domínio.
- Autenticação em dois fatores e códigos de recuperação guardados fora do aparelho.
- Documento `docs/Operacao.md` com: onde estão os segredos do Worker, como girar a chave da ponte TURN, como republicar, como restaurar de zero a partir do repositório.
- Backup periódico do repositório (cópia/zip em lugar separado) e das chaves **[o JF faz; o Code só documenta]**.

### R9 · Limites e custos de serviços externos — **verificar**
Limites de planos gratuitos mudam. **Não confiar em números de memória.**
- **[CONFIRMAR]** nas páginas oficiais: limite de tráfego TURN, limites do Worker/Durable Objects no plano gratuito, política de uso aceitável.
- Definir o que o jogo faz quando o limite estoura (cair para o PeerJS público? mostrar aviso?). O relatório diz que o público fica de reserva: testar esse caminho de ponta a ponta com o servidor nosso **desligado**.
- Adicionar alerta/verificação simples de saúde do Worker (a página responde, `/ponte` devolve credenciais) em um script de checagem.

### R10 · Privacidade e jogo com crianças — **verificar antes da Release**
O Júnior é 6+ e o online passa por servidores de terceiros (PeerJS público, Cloudflare). O IP trafega.
- **[CONFIRMAR / consultar pessoa habilitada]:** necessidade de aviso/política de privacidade simples, em português, dizendo o que trafega e o que **não** é guardado (nada de chat livre, nada de dado pessoal armazenado no servidor). O Klaus não é advogado: isto é um alerta, não parecer.
- Júnior online: sem chat livre (já é o desenho), nick restrito, lista de salas desligada (R2).
- Revisar o manual do online para pais/responsáveis.

### R11 · Domínio e marca DICAOS — **antes de usar o nome em público**
- Busca no INPI feita pelo JF: `DICAOS` e `DI CAOS` sem marca idêntica ou parecida (os 11 resultados são ruído de busca por radical). `CAOS` retornou 602 processos; **ainda não analisados** os vivos nas classes 9, 28 e 41.
- Pendentes (JF): checar páginas finais da busca `CAOS`, busca de anterioridade com agente de propriedade industrial, `dicaos.com.br` no registro.br, perfis `@dicaos` em redes, Google Play / App Store.
- O acrônimo C.A.O.S. com pontos **não** dá distinção jurídica em relação a "CAOS".
- Não trocar o nome dentro do jogo antes dessa checagem; quando trocar, fazer em uma versão própria (título, logo, ícones, splash), sem mexer nas chaves de save.

### R12 · Pontos técnicos específicos a conferir **[CONFIRMAR todos]**
1. **Vários jogadores no aparelho do host / no convidado:** a identidade da sessão é por aparelho, mas a votação é por jogador. Testar combinações (host cai com jogadores dividindo aparelho; convidado com dois nomes recarrega a página).
2. **Escape de nomes** em todos os pontos de saída (placar, telão, compartilhar resultado, histórico, falas do C.A.O.S. com `{nome}`).
3. **Telão** (segunda aba): garantir que mostra só retrato público, nunca resposta.
4. **Pacote de recuperação** (save inteiro enviado ao sucessor): conferir que **não contém** respostas a mais do que o necessário e que não vai para quem não é sucessor; tamanho vs. limite de mensagem.
5. **Relógio:** online usa a hora de quem? Confirmar que timers sobrevivem a diferença de relógio entre aparelhos (o roteiro anterior recomendava o host como referência).
6. **Service worker:** garantir que nunca faz cache de tráfego da sala/ponte, e que a atualização do host no meio da partida não deixa cliente preso em versão velha.
7. **`localStorage` compartilhado:** o endereço `jfsouza77.github.io` é compartilhado entre **todos** os projetos Pages do mesmo usuário (chaves podem colidir). Usar prefixo único e checar se há outro projeto no mesmo usuário.
8. **Compatibilidade do offline comprimido** (`DecompressionStream`) em navegadores antigos (iOS mais velho): ter mensagem clara se não houver suporte.

---

## 3. Respostas às perguntas abertas do relatório (seção 10)

### 3.1 Modo C.A.O.S. sem quebrar a espinha — **proposta de arquitetura**
Separar **dois papéis** que hoje estão misturados no nome:
- **Narrador (existe):** fala, comenta, tem memória e humor. Preso à espinha: **nunca altera o estado do jogo**.
- **Agente do modo (novo):** um ator **separado** que age só pela porta `dispatchAction`, com **ações próprias nomeadas** (ex.: ataque, roubo, destruição de joia), sorteio por `sorteioRegra()` com semente, tudo registrado, visível para a mesa e **desfazível** pelo VAR.

O narrador **comenta** o que o agente fez. A espinha continua valendo para o narrador, **sem exceção**. Evita abrir brecha na lei 1.

Pontos que dependem do **JF (regras de jogo)**:
- Joias: roubo/destruição só nesse modo? (o JF já disse que não gosta de perder joia.)
- Resposta oculta até do Mestre: como o host/Mestre se comportam? O host que joga não pode ver a resposta.
- **Palpite digitado**: exige comparar texto ("Messi" × "Lionel Messi", "Homem-Aranha" × "Spider-Man"). Opções: (a) aliases por carta (**mexe no conteúdo das 1000 cartas, só com autorização do JF**); (b) comparação aproximada; (c) veredito humano em casos duvidosos. Pedir ao Code uma estimativa de custo e risco de cada uma, **sem implementar**.
- O modo é separado dos atuais e **não** altera as regras dos outros.

### 3.2 Lista de salas por rede
Ver R2.

### 3.3 Troca de host: servidor público (~90 s) vs. nosso (20 s)
Resultado final correto nos dois. **Não vale esforço extra.** Registrar como comportamento conhecido na documentação.

### 3.4 Quem divide o aparelho do host
O item "dois jogadores no mesmo celular convidado" da 1.7.10 resolve. Fazer só isso. Testar o cenário "host cai → 2º Mestre assume → quem dividia o aparelho" (R12.1).

---

## 4. Plano até a Release 1.0

### 4.1 Congelamento
A partir de agora, **congelamento de recursos**. Só entra: correção de bug, o que está no plano da 1.7.10 e o que este documento pedir. Pedidos novos viram lista de "pós-1.0" (seção 6).

### 4.2 Ordem recomendada da 1.7.10 (e ramificações — última Beta Pré-Release)
1. **Prova do servidor nosso em aparelhos reais** (já está no ramo `online-1-7-10`, testado localmente). Incluir o teste com o servidor **desligado** (reserva pública).
2. **Dois jogadores no mesmo celular convidado.**
3. **Número de build interno monotônico** e revisão de toda comparação de versão (seção 0.1).
4. **Preparação da migração de endereço** (R1): fluxo de levar saves, **sem** ligar o domínio ainda.
5. **Ajustes de privacidade** (R2, R10) e **botão de reportar carta** (R7, só com OK do JF).
6. **Documentos de operação** (R8).
7. **Beta fechado com a família**, na matriz da seção R4.
8. **Modo C.A.O.S.:** versão **própria e separada** (por exemplo uma ramificação da 1.7.10 ou pós-1.0, decisão do JF), nunca misturado com a estabilização.

### 4.3 Critérios de saída da Beta (precisam estar escritos **antes** do beta fechado; valores a definir pelo JF)
Sugestão de modelo, ajustar:
- Bateria completa verde em duas rodadas seguidas, sem edição entre elas.
- N partidas completas online em aparelhos reais (sugestão: pelo menos 10, em pelo menos 3 cenários da matriz R4, incluindo 4G e Wi-Fi).
- **Zero** bug que trave partida, perca save ou revele resposta.
- Zero erro novo no console nas telas principais (build `--testar`).
- Migração de saves ensaiada de ponta a ponta com o save de um jogador real.
- Servidor nosso testado **ligado e desligado**.
- Documentos de operação e do usuário concluídos.
- Decisão registrada sobre nome (DICAOS) e domínio.

### 4.4 Da Beta para a Release 1.0
1. Rodar a bateria completa e anexar o resultado ao registro de versões.
2. Gerar as saídas e o registro de hashes (como hoje).
3. Congelar `main`; etiqueta (tag) **Release 1.0** no repositório e publicação das saídas (compacta e offline) em **Releases** do GitHub.
4. Atualizar manual, novidades ("O que há de novo") e tela de abertura (tirar "Beta"/"Em breve", **[CONFIRMAR]** se ainda aparece).
5. Atualizar o Documento Mestre (ver seção 5).
6. Depois da Release: apenas correções (1.0.1, 1.0.2…) até decidir a próxima linha de recursos.

---

## 5. Documentação a atualizar antes da Release
O JF mencionou querer reestruturar o Documento Mestre. Sugestão de conjunto mínimo em `docs/`:
- **Documento Mestre** novo (regras do jogo por modo, decisões do JF, o que **não** é bug).
- **`Operacao.md`** (R8).
- **`Registro_de_Versoes.md`** (já existe) e **`CHANGELOG.md`**.
- **`Roteiro_Multiplayer.md`** (já existe): marcar o que foi feito, o que mudou, o que sobra.
- **`Pos_1_0.md`**: lista de melhorias futuras (seção 6).
- Alinhar numeração e nomes (a documentação antiga fala em 5.0.x e "Perfil 200"; o projeto está na linha 1.7.x).

---

## 6. Melhorias futuras (pós-1.0, sem prioridade, **não implementar agora**)
- Modo C.A.O.S. (ver 3.1).
- Palpite digitado e aliases por carta (depende de OK do JF para conteúdo).
- Banco de cartas: crescer além de 1000, com curadoria de fatos.
- Trava de cor/avatar após adicionar jogador (ideia antiga).
- Voz melhor (voz neural offline, só com teste separado antes) e voz masculina.
- Relatório/estatísticas por jogador entre partidas.
- Reavaliar a troca de host com dados do beta.
- Multiplayer por salas públicas ou convites por link (só depois de resolver privacidade).
- Refatoração maior da lógica do motor (somente depois das regras 100% fechadas, como combinado no protocolo).

---

## 7. O que **não** fazer antes da Release
- Não adicionar recursos novos fora do plano.
- Não trocar o nome nem o endereço antes de R1 e R11.
- Não mexer em conteúdo de cartas ou falas sem pedido do JF.
- Não renomear chaves de save.
- Não apresentar a cifra do catálogo como segurança.
- Não remover o servidor público de reserva.
- Não confiar em limites de planos gratuitos sem conferir nas páginas oficiais.

---

## 8. Pedido ao Claude Code (resumo executável)
1. Validar este parecer contra o código real da 1.7.9.9 e do ramo `online-1-7-10`; para cada item **[CONFIRMAR]**, responder: confirmado / divergente / não confere, com motivo.
2. Mapear todas as comparações de versão e propor o número de build interno (seção 0.1).
3. Estimar esforço e risco de: migração de saves entre origens (R1), lista de salas sem nome do host e desligada no Júnior (R2), botão de reportar carta (R7), documento de operação (R8).
4. Propor a divisão em duas camadas Narrador × Agente do modo (3.1), **só como desenho**, sem implementar.
5. Montar a matriz de teste em aparelho real (R4) em formato de checklist que o JF possa preencher.
6. Devolver um relatório com: o que mudaria, o que não mudaria, riscos novos e discordâncias. **Não alterar código nem conteúdo nesta etapa.**
