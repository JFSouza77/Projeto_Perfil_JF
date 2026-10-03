// Geradores de fala por gatilho (1.7.5.1): um arquivo por gatilho nesta pasta.
// O motor fica em js/07b-gerador-de-falas.js. Gatilho novo = arquivo novo + linha em src/ordem.txt.
// Cada gatilho tem "moldes" (como juntar os pedaços) e slots (abre, meio, fecho, inteira...).
// Cada slot tem baldes: "geral" e baldes de contexto (hora, memória, quem está na mesa, modo,
// temperamento). Um balde de contexto só entra quando a etiqueta está ativa. Cada balde
// entra no máximo uma vez por fala, pra não repetir o assunto.
// Etiquetas padrão: madrugada, manha, tarde, noite, fimDeSemana, sexta, segunda,
//   modo_classico/hardcore/junior/oldschool/express/equipe, dupla, mesaCheia, anne, jf,
//   pedro, isabel, estreia, hoje, semana, sumido, venceuUltima, perdeuUltima, veterano,
//   vencedor, outroModo, familia, humor_suave/acido/zero, temper_normal/sensivel/generoso/
//   rabugento/eletrico, estado_<estado do C.A.O.S.>.
// Variáveis: {nome} {anne} {jf} {pedro} {isabel} {outro} {hora} {dia} {modo} {modoAntes}
//   {qtd} {tempo} ("3 dias", "ontem") {quando} ("há 3 dias", "ontem") {partidas} {vitorias}.
// Etiqueta "temNome": a fala é sobre um jogador (vem {nome}).
// Etiqueta "outro": tem alguém na mesa além de JF, Anne, Pedro e Isabel (vai em {outro}).
// Jogador comum: nada de palavra com gênero (bem-vindo/bem-vinda, primeiro/primeira, cansado...).
// Pedaço que pede variável que não existe é pulado.
// Pedaços são frases completas: qualquer combinação precisa fazer sentido.
const CAOS_GERADORES = {};
