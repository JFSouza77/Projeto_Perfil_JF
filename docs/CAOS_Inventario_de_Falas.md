# Inventário dos pontos de fala do C.A.O.S.

Gerado por `node ferramentas/caos_inventario.js` (não edite à mão). Base do cérebro em modo sombra
(`docs/Roteiro_Cerebro_Sombra_2026-10-25.md`). Toda fala que aparece passa pelo funil `showToastMessage`,
e o funil anota tudo em `caosEmit` (`src/js/07-caos/15-cerebro-sombra.js`).

| Chamada | Linhas |
|---|---|
| `showToastMessage` | 124 |
| `caosFalaAgendar` | 36 |
| `caosFalarDepois` | 15 |
| `admFala` | 5 |
| `getRandomReaction` | 311 |
| `caosGerarFala` | 17 |
| **Total de linhas com fala** | **420** |

## js/03-regras.js (1)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 589 | showToastMessage | - |

## js/04-turno-e-rodada.js (47)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 163 | showToastMessage, getRandomReaction | ultimaRodada |
| 173 | showToastMessage, getRandomReaction | joiasTrava |
| 427 | showToastMessage | - |
| 474 | showToastMessage, getRandomReaction | previsaoCartaCategoriaErrada |
| 503 | showToastMessage | - |
| 613 | caosFalaAgendar, getRandomReaction | - |
| 623 | caosFalaAgendar, getRandomReaction | - |
| 688 | showToastMessage, getRandomReaction | bolaCristalErro |
| 691 | showToastMessage, getRandomReaction | previsaoCartaPassouPerto |
| 697 | showToastMessage, getRandomReaction | mesaDormindo |
| 706 | showToastMessage, getRandomReaction | mesa.geracao |
| 708 | showToastMessage | - |
| 710 | showToastMessage | - |
| 712 | showToastMessage, getRandomReaction | esgotouComResposta |
| 917 | caosFalarDepois | - |
| 918 | getRandomReaction | - |
| 1127 | caosFalaAgendar | - |
| 1250 | showToastMessage | - |
| 1261 | showToastMessage | - |
| 1272 | getRandomReaction | verbosidade |
| 1284 | getRandomReaction | iniciante.erroLeve |
| 1295 | getRandomReaction | surpresaErroFacil |
| 1328 | getRandomReaction | reacaoCurta |
| 1368 | showToastMessage | - |
| 1396 | getRandomReaction | bonusCancelado |
| 1400 | showToastMessage | - |
| 1524 | showToastMessage | - |
| 1803 | caosGerarFala | gerador jfFim |
| 1806 | showToastMessage, getRandomReaction | jfFim |
| 1808 | showToastMessage | - |
| 1809 | getRandomReaction | caosVoltouDaPartida, partidaLonga |
| 1814 | showToastMessage, getRandomReaction | partidaLonga |
| 1909 | showToastMessage | - |
| 1910 | caosGerarFala | gerador revanche |
| 1911 | getRandomReaction | revanche |
| 2011 | showToastMessage, getRandomReaction | trocaDeModo |
| 2166 | showToastMessage, getRandomReaction | sorteioMestreJf |
| 2201 | showToastMessage | - |
| 2202 | getRandomReaction | - |
| 2330 | caosFalaAgendar, getRandomReaction | desistiuBonus |
| 2343 | caosFalaAgendar, getRandomReaction | desistiu |
| 2442 | getRandomReaction | caosCofrinhoUso |
| 2454 | showToastMessage, getRandomReaction | mercyPontos |
| 2458 | showToastMessage, getRandomReaction | mercyBonus |
| 2489 | showToastMessage | - |
| 2624 | admFala, getRandomReaction | admSaida |
| 2625 | admFala, getRandomReaction | caosCofrinho |

## js/05-tela.js (23)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 166 | showToastMessage | - |
| 467 | showToastMessage, getRandomReaction | memoria.apagada |
| 517 | showToastMessage, getRandomReaction | especialExpressSemAlvo |
| 1322 | showToastMessage | - |
| 1323 | getRandomReaction | conferirResposta |
| 1694 | getRandomReaction | nomeRepetido |
| 1695 | showToastMessage | - |
| 1708 | getRandomReaction | escolhaExclusiva |
| 1712 | getRandomReaction | escolhaTomada |
| 1714 | showToastMessage | - |
| 1993 | getRandomReaction | nickDemora |
| 1994 | showToastMessage | - |
| 2306 | showToastMessage | - |
| 2789 | showToastMessage, getRandomReaction | - |
| 3306 | showToastMessage | - |
| 3416 | admFala, getRandomReaction | admHumorMudou |
| 3438 | admFala | - |
| 3439 | getRandomReaction | admHumorMudou |
| 3515 | admFala, getRandomReaction | caosVoltouDaPartida |
| 3651 | showToastMessage, getRandomReaction | pausaExpirada.continuou |
| 3662 | showToastMessage, getRandomReaction | pausaExpirada.recomecou |
| 3813 | showToastMessage | - |
| 3904 | getRandomReaction | vozCalada |

## js/05d-ajuda-do-mestre.js (2)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 260 | caosFalaAgendar | - |
| 307 | showToastMessage | - |

## js/05g-acoes.js (2)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 674 | showToastMessage | - |
| 684 | getRandomReaction | - |

## js/05i-tabuleiro.js (8)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 619 | getRandomReaction | tabuleiro.pular |
| 620 | caosFalaAgendar | - |
| 680 | getRandomReaction | - |
| 681 | caosFalaAgendar | - |
| 689 | getRandomReaction | - |
| 690 | caosFalaAgendar | - |
| 692 | getRandomReaction | - |
| 693 | caosFalaAgendar | - |

## js/05k-rede.js (9)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 90 | showToastMessage | - |
| 887 | caosGerarFala | gerador hostCaiu |
| 888 | showToastMessage | - |
| 2015 | showToastMessage | - |
| 2147 | showToastMessage | - |
| 2195 | showToastMessage | - |
| 2196 | showToastMessage | - |
| 2573 | getRandomReaction | vozCalada |
| 3429 | showToastMessage | - |

## js/05o-corrida.js (5)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 205 | getRandomReaction | - |
| 206 | caosFalaAgendar | - |
| 219 | getRandomReaction | - |
| 220 | caosFalaAgendar | - |
| 380 | getRandomReaction | - |

## js/05p-corrida-eventos.js (11)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 178 | getRandomReaction | - |
| 218 | getRandomReaction | - |
| 219 | caosFalaAgendar | - |
| 241 | getRandomReaction | - |
| 336 | getRandomReaction | - |
| 374 | getRandomReaction | - |
| 376 | getRandomReaction | - |
| 379 | getRandomReaction | - |
| 386 | caosFalaAgendar | - |
| 481 | getRandomReaction | - |
| 482 | caosFalaAgendar | - |

## js/05q-modo-caos.js (1)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 1390 | showToastMessage | - |

## js/06-voz-som-vibracao.js (3)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 392 | caosFalaAgendar, getRandomReaction | vozCalada |
| 570 | getRandomReaction | vozRecusada |
| 572 | showToastMessage | - |

## js/07-caos/01-nucleo-e-falas.js (61)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 179 | getRandomReaction | matrizHumor |
| 206 | getRandomReaction | - |
| 207 | getRandomReaction | - |
| 210 | showToastMessage | - |
| 217 | getRandomReaction | jogadorArtificial.palpiteAntecipado |
| 241 | getRandomReaction | - |
| 244 | getRandomReaction | - |
| 283 | getRandomReaction | familias |
| 324 | getRandomReaction | marcadoRevelacao |
| 337 | getRandomReaction | continuidadeMesmoJogador |
| 373 | getRandomReaction | transicaoPiorando |
| 377 | getRandomReaction | transicaoMelhorando |
| 455 | showToastMessage, getRandomReaction | avisoEscolha |
| 463 | showToastMessage | - |
| 464 | getRandomReaction | - |
| 482 | showToastMessage, getRandomReaction | avisoCarta |
| 570 | getRandomReaction | familia.zoeiraLeve |
| 572 | getRandomReaction | familia.apoio |
| 766 | showToastMessage | - |
| 891 | showToastMessage, getRandomReaction | iniciante.cortado |
| 904 | getRandomReaction | - |
| 905 | getRandomReaction | - |
| 906 | getRandomReaction | - |
| 907 | getRandomReaction | - |
| 909 | showToastMessage | - |
| 917 | getRandomReaction | caosCortado.vinganca |
| 1013 | getRandomReaction | estadoDoJogo.jogoArrastado |
| 1015 | getRandomReaction | estadoDoJogo.liderIsolado |
| 1017 | getRandomReaction | estadoDoJogo.lanternaReagindo |
| 1025 | getRandomReaction | estadoDoJogo.torcidaLanterna |
| 1028 | getRandomReaction | estadoDoJogo.jogoAcirrado |
| 1032 | getRandomReaction | metadeDaCarta.geral |
| 1038 | getRandomReaction | metadeDaCarta.ataqueLider |
| 1041 | getRandomReaction | metadeDaCarta.ataqueLanterna |
| 1043 | getRandomReaction | metadeDaCarta.geral |
| 1060 | showToastMessage, getRandomReaction | agonia15Dicas |
| 1067 | showToastMessage | - |
| 1081 | getRandomReaction | - |
| 1088 | showToastMessage | - |
| 1107 | showToastMessage, getRandomReaction | caosCansado |
| 1110 | showToastMessage, getRandomReaction | caosExausto |
| 1118 | showToastMessage, getRandomReaction | caosSaiuDaPartida |
| 1135 | showToastMessage, getRandomReaction | caosSaiuTemporario |
| 1150 | showToastMessage, getRandomReaction | - |
| 1247 | getRandomReaction | familias |
| 1266 | getRandomReaction | - |
| 1271 | getRandomReaction | - |
| 1277 | getRandomReaction | - |
| 1279 | getRandomReaction | - |
| 1281 | getRandomReaction | - |
| 1282 | getRandomReaction | - |
| 1284 | getRandomReaction | - |
| 1286 | getRandomReaction | - |
| 1290 | getRandomReaction | - |
| 1291 | getRandomReaction | - |
| 1292 | getRandomReaction | - |
| 1309 | getRandomReaction | erroEscalada |
| 1311 | getRandomReaction | - |
| 1312 | getRandomReaction | erroSarcasmo |
| 1334 | getRandomReaction | - |
| 1337 | showToastMessage | - |

## js/07-caos/02-cerebro-adm.js (5)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 151 | getRandomReaction | - |
| 161 | getRandomReaction | - |
| 162 | getRandomReaction | - |
| 167 | getRandomReaction | intruso.travado |
| 176 | getRandomReaction | intruso.abrir |

## js/07-caos/03-memoria-e-mesa.js (79)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 66 | getRandomReaction | - |
| 67 | getRandomReaction | - |
| 73 | getRandomReaction | - |
| 75 | getRandomReaction | - |
| 77 | getRandomReaction | - |
| 104 | getRandomReaction | - |
| 190 | getRandomReaction | recorde.rapido |
| 196 | getRandomReaction | - |
| 205 | caosFalarDepois | - |
| 223 | showToastMessage | - |
| 227 | showToastMessage | - |
| 275 | getRandomReaction | - |
| 276 | getRandomReaction | - |
| 296 | showToastMessage, getRandomReaction | mesa.cartaAbsurdo |
| 303 | showToastMessage | - |
| 314 | getRandomReaction | - |
| 315 | getRandomReaction | - |
| 318 | showToastMessage | - |
| 330 | getRandomReaction | - |
| 339 | showToastMessage | - |
| 358 | getRandomReaction | - |
| 379 | getRandomReaction | - |
| 383 | getRandomReaction | - |
| 388 | getRandomReaction | - |
| 401 | getRandomReaction | - |
| 464 | getRandomReaction | - |
| 486 | showToastMessage | - |
| 583 | caosFalaAgendar | - |
| 584 | getRandomReaction | absurdoTresMestre |
| 616 | getRandomReaction | juizMestre.ditador |
| 619 | getRandomReaction | - |
| 620 | getRandomReaction | - |
| 621 | getRandomReaction | - |
| 622 | getRandomReaction | - |
| 626 | getRandomReaction | - |
| 629 | getRandomReaction | - |
| 653 | getRandomReaction | juizMestre.mae |
| 658 | getRandomReaction | - |
| 667 | getRandomReaction | - |
| 674 | getRandomReaction | - |
| 677 | getRandomReaction | - |
| 684 | caosFalarDepois, getRandomReaction | mesa.mimica |
| 689 | getRandomReaction | mesa.culpaMestre |
| 700 | caosFalarDepois | - |
| 705 | caosFalarDepois, getRandomReaction | mesa.rivalEspecial |
| 725 | showToastMessage, getRandomReaction | - |
| 739 | showToastMessage, getRandomReaction | - |
| 752 | getRandomReaction | mesa.apostaAcertou |
| 753 | getRandomReaction | mesa.apostaErrou |
| 755 | showToastMessage | - |
| 823 | getRandomReaction | - |
| 824 | getRandomReaction | - |
| 831 | getRandomReaction | cerebro.premonicao |
| 852 | getRandomReaction | - |
| 855 | getRandomReaction | - |
| 860 | getRandomReaction | - |
| 862 | getRandomReaction | - |
| 870 | getRandomReaction | - |
| 872 | getRandomReaction | - |
| 888 | getRandomReaction | - |
| 899 | getRandomReaction | - |
| 900 | getRandomReaction | - |
| 904 | getRandomReaction | - |
| 907 | getRandomReaction | - |
| 911 | getRandomReaction | - |
| 979 | getRandomReaction | - |
| 981 | getRandomReaction | - |
| 983 | getRandomReaction | - |
| 984 | getRandomReaction | - |
| 985 | getRandomReaction | - |
| 1012 | getRandomReaction | - |
| 1015 | getRandomReaction | - |
| 1021 | getRandomReaction | - |
| 1024 | getRandomReaction | - |
| 1038 | getRandomReaction | - |
| 1039 | getRandomReaction | - |
| 1049 | getRandomReaction | perfilJogador.casal.especial |
| 1057 | getRandomReaction | - |
| 1061 | showToastMessage | - |

## js/07-caos/04-lexico-e-relogio.js (9)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 227 | getRandomReaction | - |
| 229 | getRandomReaction | - |
| 230 | getRandomReaction | - |
| 238 | showToastMessage, getRandomReaction | - |
| 245 | showToastMessage, getRandomReaction | - |
| 254 | getRandomReaction | - |
| 255 | getRandomReaction | - |
| 256 | getRandomReaction | - |
| 263 | getRandomReaction | cartaTema |

## js/07-caos/05-emocoes-e-rede-neural.js (1)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 753 | caosFalarDepois, getRandomReaction | duploPadrao |

## js/07-caos/06-humanizacao.js (11)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 84 | caosFalarDepois, getRandomReaction | naoCurti |
| 173 | caosFalarDepois, getRandomReaction | - |
| 203 | caosFalarDepois, getRandomReaction | implicancia.anuncio |
| 214 | caosFalarDepois, getRandomReaction | implicancia.carta |
| 222 | caosFalarDepois, getRandomReaction | implicancia.avisei |
| 230 | caosFalarDepois, getRandomReaction | implicancia.larguei |
| 251 | getRandomReaction | silencio |
| 326 | showToastMessage, getRandomReaction | - |
| 472 | caosFalarDepois, getRandomReaction | - |
| 491 | getRandomReaction | iniciante.bilheteMestre |
| 493 | getRandomReaction | iniciante.ajuda |

## js/07-caos/07-momentos-da-partida.js (90)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 4 | showToastMessage, getRandomReaction | iniciante.boasVindas |
| 28 | showToastMessage | - |
| 30 | caosGerarFala | gerador anneChegou |
| 31 | showToastMessage | - |
| 34 | caosGerarFala | gerador jfChegou |
| 35 | showToastMessage | - |
| 49 | showToastMessage | - |
| 58 | caosGerarFala | gerador boasVindas |
| 59 | showToastMessage | - |
| 84 | getRandomReaction | - |
| 85 | showToastMessage | - |
| 105 | getRandomReaction, caosGerarFala | jfInicio, gerador jfInicio |
| 112 | getRandomReaction | nickNumerado |
| 119 | getRandomReaction | corRgb |
| 120 | getRandomReaction | corEscolhida |
| 126 | caosGerarFala | gerador inicioJogadores |
| 127 | getRandomReaction | inicioJogadores |
| 132 | getRandomReaction, caosGerarFala | inicioMestre, gerador inicioMestre |
| 136 | getRandomReaction, caosGerarFala | inicioPrimeiro, gerador inicioPrimeiro |
| 144 | getRandomReaction | perfilJogador.casal.inicio |
| 149 | caosGerarFala | gerador inicioModo |
| 150 | getRandomReaction | inicioModo |
| 187 | showToastMessage | - |
| 191 | showToastMessage, getRandomReaction | cartaIA |
| 202 | getRandomReaction | - |
| 204 | getRandomReaction | acido |
| 215 | getRandomReaction | acido |
| 221 | showToastMessage, getRandomReaction | apresentacaoInicial |
| 227 | showToastMessage, getRandomReaction | lembreteNome |
| 234 | showToastMessage, getRandomReaction | marco100 |
| 236 | showToastMessage, getRandomReaction | marco77 |
| 238 | showToastMessage, getRandomReaction | marco67 |
| 240 | showToastMessage, getRandomReaction | marcosExatos |
| 261 | showToastMessage, getRandomReaction | bolaCristalAnuncio |
| 283 | getRandomReaction | previsaoCartaComResposta |
| 284 | getRandomReaction | previsaoCartaSoCategoria |
| 295 | showToastMessage | - |
| 332 | caosGerarFala | gerador pensamento |
| 344 | getRandomReaction | meta |
| 345 | getRandomReaction | espontaneo |
| 371 | getRandomReaction | - |
| 373 | showToastMessage | - |
| 396 | getRandomReaction | - |
| 397 | showToastMessage | - |
| 405 | showToastMessage | - |
| 406 | getRandomReaction | oldSchool.nostalgia |
| 413 | showToastMessage | - |
| 439 | getRandomReaction | aviao |
| 469 | getRandomReaction | bolaCristalAcerto |
| 470 | getRandomReaction | bolaCristalErro |
| 477 | getRandomReaction | previsaoCartaAcertou |
| 478 | getRandomReaction | previsaoCartaPassouPerto |
| 491 | getRandomReaction | surpresaAcertoDificil |
| 514 | getRandomReaction | acertoVirada |
| 516 | getRandomReaction | acertoRecuperacao |
| 518 | getRandomReaction | acertoAposErro |
| 520 | getRandomReaction | acertoComResposta |
| 526 | getRandomReaction | acertoUmaDica |
| 532 | getRandomReaction | acertoRidiculamenteRapido |
| 537 | getRandomReaction | acertoCategoriaRapido |
| 546 | getRandomReaction | acertoRidiculamenteRapido |
| 547 | getRandomReaction | tempoPessoalRapido |
| 549 | getRandomReaction | - |
| 559 | getRandomReaction | acertoPorDicas |
| 562 | getRandomReaction | sequenciaAcertos |
| 565 | getRandomReaction | jogadorLento |
| 571 | getRandomReaction | carinho |
| 574 | getRandomReaction, caosGerarFala | jfAcerto, gerador jfAcerto |
| 584 | getRandomReaction | cantada |
| 587 | getRandomReaction | nivelZero.acerto |
| 592 | getRandomReaction | reacaoCurta |
| 610 | showToastMessage | - |
| 617 | getRandomReaction | especialEscolhaJogador |
| 619 | showToastMessage | - |
| 625 | getRandomReaction | especialAvancou |
| 626 | getRandomReaction | especialVoltou |
| 627 | showToastMessage | - |
| 639 | getRandomReaction | especialPalpite |
| 640 | getRandomReaction | especialPercaVez |
| 641 | showToastMessage | - |
| 645 | getRandomReaction | especialExpressSkip |
| 646 | getRandomReaction | especialExpressReverse |
| 647 | getRandomReaction | especialExpressBlock |
| 648 | getRandomReaction | especialExpressSteal |
| 663 | showToastMessage | - |
| 704 | getRandomReaction | - |
| 705 | getRandomReaction | iniciante.fimDasDicas |
| 715 | showToastMessage | - |
| 720 | showToastMessage, getRandomReaction | iniciante.acerto |
| 750 | showToastMessage, getRandomReaction | iniciante.formatura |

## js/07-caos/08-hall-janelas-e-pausa.js (10)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 177 | showToastMessage | - |
| 537 | caosGerarFala | gerador pausaHumor |
| 538 | getRandomReaction | pausaHumor |
| 567 | caosFalaAgendar | - |
| 569 | caosGerarFala | gerador pausaVolta |
| 570 | getRandomReaction | pausaVolta |
| 594 | caosFalaAgendar | - |
| 595 | getRandomReaction | retaFinal |
| 614 | getRandomReaction | - |
| 616 | showToastMessage | - |

## js/07-caos/09-vinculos-silencio-e-balao.js (23)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 68 | caosFalaAgendar, getRandomReaction | vinculo.naoEVoce |
| 98 | caosFalaAgendar, getRandomReaction | vinculo.decepcao |
| 106 | caosFalaAgendar, getRandomReaction | vinculo.defesaFav |
| 116 | caosFalaAgendar, getRandomReaction | vinculo.elogioContrariado |
| 135 | caosFalaAgendar, getRandomReaction | vinculo.acusa |
| 141 | showToastMessage, getRandomReaction | vinculo.voltaAtras |
| 175 | showToastMessage, getRandomReaction | - |
| 224 | caosFalarDepois | - |
| 225 | getRandomReaction | satisfacao |
| 246 | showToastMessage, getRandomReaction | pausaCalmou |
| 268 | caosFalaAgendar, getRandomReaction | marcadoRedencao |
| 301 | showToastMessage, getRandomReaction | descanso.exige |
| 339 | caosFalaAgendar, getRandomReaction | - |
| 365 | caosFalaAgendar, getRandomReaction | memoria.magoado |
| 405 | showToastMessage | - |
| 437 | caosGerarFala | gerador religado |
| 462 | caosFalaAgendar, getRandomReaction | silenciaramVoltaZero |
| 466 | caosFalaAgendar, getRandomReaction | silenciaramVoltaSuave |
| 469 | caosFalaAgendar, getRandomReaction | silenciaramVolta |
| 513 | caosFalarDepois, getRandomReaction | - |
| 548 | caosGerarFala | gerador chute |
| 622 | showToastMessage | - |
| 694 | showToastMessage | - |

## js/07-caos/11-espinha.js (1)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 277 | showToastMessage | - |

## js/07-caos/12-ouvintes.js (4)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 62 | caosFalaAgendar, getRandomReaction | - |
| 67 | caosFalaAgendar, getRandomReaction | - |
| 77 | caosFalaAgendar, getRandomReaction | - |
| 88 | caosFalaAgendar, getRandomReaction | caosOuvintes.carinhoFiel |

## js/07-caos/13-amigos.js (5)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 50 | getRandomReaction | - |
| 67 | caosFalaAgendar | - |
| 92 | getRandomReaction | - |
| 93 | getRandomReaction | - |
| 98 | caosFalaAgendar | - |

## js/07-caos/16-guia-da-mesa.js (2)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 106 | getRandomReaction | - |
| 185 | getRandomReaction | guia |

## js/08-salvamento.js (1)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 1328 | showToastMessage | - |

## js/11-iniciar.js (6)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 457 | showToastMessage | - |
| 459 | getRandomReaction | nickRepertorio |
| 460 | getRandomReaction | nickSugestaoAceita |
| 504 | getRandomReaction | botaoEncerrar |
| 767 | showToastMessage | - |
| 768 | getRandomReaction | inicioInvalido |
