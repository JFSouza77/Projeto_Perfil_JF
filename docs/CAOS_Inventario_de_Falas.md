# Inventário dos pontos de fala do C.A.O.S.

Gerado por `node ferramentas/caos_inventario.js` (não edite à mão). Base do cérebro em modo sombra
(`docs/Roteiro_Cerebro_Sombra_2026-10-25.md`). Toda fala que aparece passa pelo funil `showToastMessage`,
e o funil anota tudo em `caosEmit` (`src/js/07-caos/15-cerebro-sombra.js`).

| Chamada | Linhas |
|---|---|
| `showToastMessage` | 129 |
| `caosFalaAgendar` | 36 |
| `caosFalarDepois` | 16 |
| `admFala` | 5 |
| `getRandomReaction` | 323 |
| `caosGerarFala` | 17 |
| **Total de linhas com fala** | **438** |

## js/03-regras.js (1)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 590 | showToastMessage | - |

## js/04-turno-e-rodada.js (47)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 163 | showToastMessage, getRandomReaction | ultimaRodada |
| 173 | showToastMessage, getRandomReaction | joiasTrava |
| 433 | showToastMessage | - |
| 480 | showToastMessage, getRandomReaction | previsaoCartaCategoriaErrada |
| 509 | showToastMessage | - |
| 620 | caosFalaAgendar, getRandomReaction | - |
| 630 | caosFalaAgendar, getRandomReaction | - |
| 695 | showToastMessage, getRandomReaction | bolaCristalErro |
| 698 | showToastMessage, getRandomReaction | previsaoCartaPassouPerto |
| 704 | showToastMessage, getRandomReaction | mesaDormindo |
| 713 | showToastMessage, getRandomReaction | mesa.geracao |
| 715 | showToastMessage | - |
| 717 | showToastMessage | - |
| 719 | showToastMessage, getRandomReaction | esgotouComResposta |
| 924 | caosFalarDepois | - |
| 925 | getRandomReaction | - |
| 1134 | caosFalaAgendar | - |
| 1257 | showToastMessage | - |
| 1268 | showToastMessage | - |
| 1279 | getRandomReaction | verbosidade |
| 1291 | getRandomReaction | iniciante.erroLeve |
| 1302 | getRandomReaction | surpresaErroFacil |
| 1335 | getRandomReaction | reacaoCurta |
| 1375 | showToastMessage | - |
| 1403 | getRandomReaction | bonusCancelado |
| 1407 | showToastMessage | - |
| 1531 | showToastMessage | - |
| 1810 | caosGerarFala | gerador jfFim |
| 1813 | showToastMessage, getRandomReaction | jfFim |
| 1815 | showToastMessage | - |
| 1816 | getRandomReaction | caosVoltouDaPartida, partidaLonga |
| 1821 | showToastMessage, getRandomReaction | partidaLonga |
| 1916 | showToastMessage | - |
| 1917 | caosGerarFala | gerador revanche |
| 1918 | getRandomReaction | revanche |
| 2018 | showToastMessage, getRandomReaction | trocaDeModo |
| 2173 | showToastMessage, getRandomReaction | sorteioMestreJf |
| 2208 | showToastMessage | - |
| 2209 | getRandomReaction | - |
| 2337 | caosFalaAgendar, getRandomReaction | desistiuBonus |
| 2350 | caosFalaAgendar, getRandomReaction | desistiu |
| 2449 | getRandomReaction | caosCofrinhoUso |
| 2461 | showToastMessage, getRandomReaction | mercyPontos |
| 2465 | showToastMessage, getRandomReaction | mercyBonus |
| 2496 | showToastMessage | - |
| 2631 | admFala, getRandomReaction | admSaida |
| 2632 | admFala, getRandomReaction | caosCofrinho |

## js/05-tela.js (25)

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
| 2315 | showToastMessage | - |
| 2798 | showToastMessage, getRandomReaction | - |
| 3315 | showToastMessage | - |
| 3425 | admFala, getRandomReaction | admHumorMudou |
| 3447 | admFala | - |
| 3448 | getRandomReaction | admHumorMudou |
| 3524 | admFala, getRandomReaction | caosVoltouDaPartida |
| 3660 | showToastMessage, getRandomReaction | pausaExpirada.continuou |
| 3671 | showToastMessage, getRandomReaction | pausaExpirada.recomecou |
| 3822 | showToastMessage | - |
| 3913 | getRandomReaction | vozCalada |
| 4117 | getRandomReaction | - |
| 4118 | showToastMessage | - |

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
| 620 | getRandomReaction | tabuleiro.pular |
| 621 | caosFalaAgendar | - |
| 681 | getRandomReaction | - |
| 682 | caosFalaAgendar | - |
| 690 | getRandomReaction | - |
| 691 | caosFalaAgendar | - |
| 693 | getRandomReaction | - |
| 694 | caosFalaAgendar | - |

## js/05k-rede.js (9)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 90 | showToastMessage | - |
| 887 | caosGerarFala | gerador hostCaiu |
| 888 | showToastMessage | - |
| 2028 | showToastMessage | - |
| 2169 | showToastMessage | - |
| 2217 | showToastMessage | - |
| 2218 | showToastMessage | - |
| 2595 | getRandomReaction | vozCalada |
| 3516 | showToastMessage | - |

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
| 498 | getRandomReaction | - |
| 499 | caosFalaAgendar | - |

## js/05q-modo-caos.js (2)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 385 | getRandomReaction | - |
| 1415 | showToastMessage | - |

## js/05y-temporadas.js (10)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 186 | getRandomReaction | - |
| 187 | showToastMessage | - |
| 286 | getRandomReaction | - |
| 287 | showToastMessage | - |
| 452 | caosFalarDepois | - |
| 453 | showToastMessage | - |
| 470 | getRandomReaction | - |
| 476 | getRandomReaction | - |
| 490 | getRandomReaction | - |
| 499 | getRandomReaction | - |

## js/06-voz-som-vibracao.js (3)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 398 | caosFalaAgendar, getRandomReaction | vozCalada |
| 576 | getRandomReaction | vozRecusada |
| 578 | showToastMessage | - |

## js/07-caos/01-nucleo-e-falas.js (61)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 180 | getRandomReaction | matrizHumor |
| 207 | getRandomReaction | - |
| 208 | getRandomReaction | - |
| 211 | showToastMessage | - |
| 218 | getRandomReaction | jogadorArtificial.palpiteAntecipado |
| 242 | getRandomReaction | - |
| 245 | getRandomReaction | - |
| 284 | getRandomReaction | familias |
| 325 | getRandomReaction | marcadoRevelacao |
| 338 | getRandomReaction | continuidadeMesmoJogador |
| 374 | getRandomReaction | transicaoPiorando |
| 378 | getRandomReaction | transicaoMelhorando |
| 458 | showToastMessage, getRandomReaction | avisoEscolha |
| 466 | showToastMessage | - |
| 467 | getRandomReaction | - |
| 485 | showToastMessage, getRandomReaction | avisoCarta |
| 573 | getRandomReaction | familia.zoeiraLeve |
| 575 | getRandomReaction | familia.apoio |
| 769 | showToastMessage | - |
| 894 | showToastMessage, getRandomReaction | iniciante.cortado |
| 907 | getRandomReaction | - |
| 908 | getRandomReaction | - |
| 909 | getRandomReaction | - |
| 910 | getRandomReaction | - |
| 912 | showToastMessage | - |
| 920 | getRandomReaction | caosCortado.vinganca |
| 1016 | getRandomReaction | estadoDoJogo.jogoArrastado |
| 1018 | getRandomReaction | estadoDoJogo.liderIsolado |
| 1020 | getRandomReaction | estadoDoJogo.lanternaReagindo |
| 1028 | getRandomReaction | estadoDoJogo.torcidaLanterna |
| 1031 | getRandomReaction | estadoDoJogo.jogoAcirrado |
| 1035 | getRandomReaction | metadeDaCarta.geral |
| 1041 | getRandomReaction | metadeDaCarta.ataqueLider |
| 1044 | getRandomReaction | metadeDaCarta.ataqueLanterna |
| 1046 | getRandomReaction | metadeDaCarta.geral |
| 1063 | showToastMessage, getRandomReaction | agonia15Dicas |
| 1070 | showToastMessage | - |
| 1084 | getRandomReaction | - |
| 1091 | showToastMessage | - |
| 1110 | showToastMessage, getRandomReaction | caosCansado |
| 1113 | showToastMessage, getRandomReaction | caosExausto |
| 1121 | showToastMessage, getRandomReaction | caosSaiuDaPartida |
| 1138 | showToastMessage, getRandomReaction | caosSaiuTemporario |
| 1153 | showToastMessage, getRandomReaction | - |
| 1250 | getRandomReaction | familias |
| 1269 | getRandomReaction | - |
| 1274 | getRandomReaction | - |
| 1280 | getRandomReaction | - |
| 1282 | getRandomReaction | - |
| 1284 | getRandomReaction | - |
| 1285 | getRandomReaction | - |
| 1287 | getRandomReaction | - |
| 1289 | getRandomReaction | - |
| 1293 | getRandomReaction | - |
| 1294 | getRandomReaction | - |
| 1295 | getRandomReaction | - |
| 1312 | getRandomReaction | erroEscalada |
| 1314 | getRandomReaction | - |
| 1315 | getRandomReaction | erroSarcasmo |
| 1337 | getRandomReaction | - |
| 1340 | showToastMessage | - |

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
| 757 | caosFalarDepois, getRandomReaction | duploPadrao |

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

## js/07-caos/07-momentos-da-partida.js (95)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 18 | showToastMessage, getRandomReaction | iniciante.boasVindas |
| 42 | showToastMessage | - |
| 44 | caosGerarFala | gerador anneChegou |
| 45 | showToastMessage | - |
| 48 | caosGerarFala | gerador jfChegou |
| 49 | showToastMessage | - |
| 63 | showToastMessage | - |
| 72 | caosGerarFala | gerador boasVindas |
| 73 | showToastMessage | - |
| 98 | getRandomReaction | - |
| 99 | showToastMessage | - |
| 119 | getRandomReaction, caosGerarFala | jfInicio, gerador jfInicio |
| 126 | getRandomReaction | nickNumerado |
| 133 | getRandomReaction | corRgb |
| 134 | getRandomReaction | corEscolhida |
| 140 | caosGerarFala | gerador inicioJogadores |
| 141 | getRandomReaction | inicioJogadores |
| 146 | getRandomReaction, caosGerarFala | inicioMestre, gerador inicioMestre |
| 150 | getRandomReaction, caosGerarFala | inicioPrimeiro, gerador inicioPrimeiro |
| 158 | getRandomReaction | perfilJogador.casal.inicio |
| 162 | getRandomReaction | - |
| 169 | caosGerarFala | gerador inicioModo |
| 170 | getRandomReaction | inicioModo |
| 202 | getRandomReaction | - |
| 203 | getRandomReaction | - |
| 240 | showToastMessage | - |
| 244 | showToastMessage, getRandomReaction | cartaIA |
| 255 | getRandomReaction | - |
| 257 | getRandomReaction | acido |
| 268 | getRandomReaction | acido |
| 274 | showToastMessage, getRandomReaction | apresentacaoInicial |
| 280 | showToastMessage, getRandomReaction | lembreteNome |
| 287 | showToastMessage, getRandomReaction | marco100 |
| 289 | showToastMessage, getRandomReaction | marco77 |
| 291 | showToastMessage, getRandomReaction | marco67 |
| 293 | showToastMessage, getRandomReaction | marcosExatos |
| 314 | showToastMessage, getRandomReaction | bolaCristalAnuncio |
| 336 | getRandomReaction | previsaoCartaComResposta |
| 337 | getRandomReaction | previsaoCartaSoCategoria |
| 348 | showToastMessage | - |
| 385 | caosGerarFala | gerador pensamento |
| 397 | getRandomReaction | meta |
| 398 | getRandomReaction | espontaneo |
| 424 | getRandomReaction | - |
| 426 | showToastMessage | - |
| 449 | getRandomReaction | - |
| 450 | showToastMessage | - |
| 458 | showToastMessage | - |
| 459 | getRandomReaction | oldSchool.nostalgia |
| 466 | showToastMessage | - |
| 492 | getRandomReaction | aviao |
| 522 | getRandomReaction | bolaCristalAcerto |
| 523 | getRandomReaction | bolaCristalErro |
| 530 | getRandomReaction | previsaoCartaAcertou |
| 531 | getRandomReaction | previsaoCartaPassouPerto |
| 544 | getRandomReaction | surpresaAcertoDificil |
| 567 | getRandomReaction | acertoVirada |
| 569 | getRandomReaction | acertoRecuperacao |
| 571 | getRandomReaction | acertoAposErro |
| 573 | getRandomReaction | acertoComResposta |
| 579 | getRandomReaction | acertoUmaDica |
| 585 | getRandomReaction | acertoRidiculamenteRapido |
| 590 | getRandomReaction | acertoCategoriaRapido |
| 599 | getRandomReaction | acertoRidiculamenteRapido |
| 600 | getRandomReaction | tempoPessoalRapido |
| 602 | getRandomReaction | - |
| 612 | getRandomReaction | acertoPorDicas |
| 615 | getRandomReaction | sequenciaAcertos |
| 618 | getRandomReaction | jogadorLento |
| 624 | getRandomReaction | carinho |
| 627 | getRandomReaction, caosGerarFala | jfAcerto, gerador jfAcerto |
| 637 | getRandomReaction | cantada |
| 640 | getRandomReaction | nivelZero.acerto |
| 645 | getRandomReaction | reacaoCurta |
| 663 | showToastMessage | - |
| 670 | getRandomReaction | especialEscolhaJogador |
| 672 | showToastMessage | - |
| 679 | getRandomReaction | - |
| 681 | showToastMessage | - |
| 687 | getRandomReaction | especialAvancou |
| 688 | getRandomReaction | especialVoltou |
| 689 | showToastMessage | - |
| 701 | getRandomReaction | especialPalpite |
| 702 | getRandomReaction | especialPercaVez |
| 703 | showToastMessage | - |
| 707 | getRandomReaction | especialExpressSkip |
| 708 | getRandomReaction | especialExpressReverse |
| 709 | getRandomReaction | especialExpressBlock |
| 710 | getRandomReaction | especialExpressSteal |
| 725 | showToastMessage | - |
| 766 | getRandomReaction | - |
| 767 | getRandomReaction | iniciante.fimDasDicas |
| 777 | showToastMessage | - |
| 782 | showToastMessage, getRandomReaction | iniciante.acerto |
| 812 | showToastMessage, getRandomReaction | iniciante.formatura |

## js/07-caos/08-hall-janelas-e-pausa.js (10)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 188 | showToastMessage | - |
| 548 | caosGerarFala | gerador pausaHumor |
| 549 | getRandomReaction | pausaHumor |
| 578 | caosFalaAgendar | - |
| 580 | caosGerarFala | gerador pausaVolta |
| 581 | getRandomReaction | pausaVolta |
| 605 | caosFalaAgendar | - |
| 606 | getRandomReaction | retaFinal |
| 625 | getRandomReaction | - |
| 627 | showToastMessage | - |

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
| 110 | getRandomReaction | - |
| 202 | getRandomReaction | guia |

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
| 768 | showToastMessage | - |
| 769 | getRandomReaction | inicioInvalido |
