# Inventário dos pontos de fala do C.A.O.S.

Gerado por `node ferramentas/caos_inventario.js` (não edite à mão). Base do cérebro em modo sombra
(`docs/Roteiro_Cerebro_Sombra_2026-10-25.md`). Toda fala que aparece passa pelo funil `showToastMessage`,
e o funil anota tudo em `caosEmit` (`src/js/07-caos/15-cerebro-sombra.js`).

| Chamada | Linhas |
|---|---|
| `showToastMessage` | 128 |
| `caosFalaAgendar` | 36 |
| `caosFalarDepois` | 16 |
| `admFala` | 5 |
| `getRandomReaction` | 314 |
| `caosGerarFala` | 18 |
| **Total de linhas com fala** | **430** |

## js/03-regras.js (1)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 608 | showToastMessage | - |

## js/04-turno-e-rodada.js (47)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 163 | showToastMessage, getRandomReaction | ultimaRodada |
| 173 | showToastMessage, getRandomReaction | joiasTrava |
| 434 | showToastMessage | - |
| 481 | showToastMessage, getRandomReaction | previsaoCartaCategoriaErrada |
| 510 | showToastMessage | - |
| 621 | caosFalaAgendar, getRandomReaction | - |
| 631 | caosFalaAgendar, getRandomReaction | - |
| 696 | showToastMessage, getRandomReaction | bolaCristalErro |
| 699 | showToastMessage, getRandomReaction | previsaoCartaPassouPerto |
| 705 | showToastMessage, getRandomReaction | mesaDormindo |
| 714 | showToastMessage, getRandomReaction | mesa.geracao |
| 716 | showToastMessage | - |
| 718 | showToastMessage | - |
| 720 | showToastMessage, getRandomReaction | esgotouComResposta |
| 925 | caosFalarDepois | - |
| 926 | getRandomReaction | - |
| 1135 | caosFalaAgendar | - |
| 1258 | showToastMessage | - |
| 1269 | showToastMessage | - |
| 1280 | getRandomReaction | verbosidade |
| 1292 | getRandomReaction | iniciante.erroLeve |
| 1303 | getRandomReaction | surpresaErroFacil |
| 1336 | getRandomReaction | reacaoCurta |
| 1376 | showToastMessage | - |
| 1404 | getRandomReaction | bonusCancelado |
| 1408 | showToastMessage | - |
| 1532 | showToastMessage | - |
| 1831 | caosGerarFala | gerador jfFim |
| 1834 | showToastMessage, getRandomReaction | jfFim |
| 1836 | showToastMessage | - |
| 1837 | getRandomReaction | caosVoltouDaPartida, partidaLonga |
| 1842 | showToastMessage, getRandomReaction | partidaLonga |
| 1937 | showToastMessage | - |
| 1938 | caosGerarFala | gerador revanche |
| 1939 | getRandomReaction | revanche |
| 2039 | showToastMessage, getRandomReaction | trocaDeModo |
| 2194 | showToastMessage, getRandomReaction | sorteioMestreJf |
| 2229 | showToastMessage | - |
| 2230 | getRandomReaction | - |
| 2358 | caosFalaAgendar, getRandomReaction | desistiuBonus |
| 2371 | caosFalaAgendar, getRandomReaction | desistiu |
| 2470 | getRandomReaction | caosCofrinhoUso |
| 2482 | showToastMessage, getRandomReaction | mercyPontos |
| 2486 | showToastMessage, getRandomReaction | mercyBonus |
| 2517 | showToastMessage | - |
| 2652 | admFala, getRandomReaction | admSaida |
| 2653 | admFala, getRandomReaction | caosCofrinho |

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
| 890 | caosGerarFala | gerador hostCaiu |
| 891 | showToastMessage | - |
| 2031 | showToastMessage | - |
| 2172 | showToastMessage | - |
| 2220 | showToastMessage | - |
| 2221 | showToastMessage | - |
| 2598 | getRandomReaction | vozCalada |
| 3519 | showToastMessage | - |

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
| 198 | getRandomReaction | - |
| 199 | showToastMessage | - |
| 298 | getRandomReaction | - |
| 299 | showToastMessage | - |
| 597 | caosFalarDepois | - |
| 598 | showToastMessage | - |
| 619 | getRandomReaction | - |
| 625 | getRandomReaction | - |
| 639 | getRandomReaction | - |
| 711 | getRandomReaction | - |

## js/05y2-medalhas.js (2)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 95 | getRandomReaction | - |
| 96 | showToastMessage | - |

## js/06-voz-som-vibracao.js (3)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 415 | caosFalaAgendar, getRandomReaction | vozCalada |
| 595 | getRandomReaction | vozRecusada |
| 597 | showToastMessage | - |

## js/07-caos/01-nucleo-e-falas.js (62)

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
| 462 | caosGerarFala | gerador escolherDica |
| 463 | showToastMessage, getRandomReaction | avisoEscolha |
| 472 | showToastMessage | - |
| 473 | getRandomReaction | - |
| 491 | showToastMessage, getRandomReaction | avisoCarta |
| 579 | getRandomReaction | familia.zoeiraLeve |
| 581 | getRandomReaction | familia.apoio |
| 775 | showToastMessage | - |
| 900 | showToastMessage, getRandomReaction | iniciante.cortado |
| 913 | getRandomReaction | - |
| 914 | getRandomReaction | - |
| 915 | getRandomReaction | - |
| 916 | getRandomReaction | - |
| 918 | showToastMessage | - |
| 926 | getRandomReaction | caosCortado.vinganca |
| 1022 | getRandomReaction | estadoDoJogo.jogoArrastado |
| 1024 | getRandomReaction | estadoDoJogo.liderIsolado |
| 1026 | getRandomReaction | estadoDoJogo.lanternaReagindo |
| 1034 | getRandomReaction | estadoDoJogo.torcidaLanterna |
| 1037 | getRandomReaction | estadoDoJogo.jogoAcirrado |
| 1041 | getRandomReaction | metadeDaCarta.geral |
| 1047 | getRandomReaction | metadeDaCarta.ataqueLider |
| 1050 | getRandomReaction | metadeDaCarta.ataqueLanterna |
| 1052 | getRandomReaction | metadeDaCarta.geral |
| 1069 | showToastMessage, getRandomReaction | agonia15Dicas |
| 1076 | showToastMessage | - |
| 1090 | getRandomReaction | - |
| 1097 | showToastMessage | - |
| 1116 | showToastMessage, getRandomReaction | caosCansado |
| 1119 | showToastMessage, getRandomReaction | caosExausto |
| 1127 | showToastMessage, getRandomReaction | caosSaiuDaPartida |
| 1144 | showToastMessage, getRandomReaction | caosSaiuTemporario |
| 1159 | showToastMessage, getRandomReaction | - |
| 1256 | getRandomReaction | familias |
| 1275 | getRandomReaction | - |
| 1280 | getRandomReaction | - |
| 1286 | getRandomReaction | - |
| 1288 | getRandomReaction | - |
| 1290 | getRandomReaction | - |
| 1291 | getRandomReaction | - |
| 1293 | getRandomReaction | - |
| 1295 | getRandomReaction | - |
| 1299 | getRandomReaction | - |
| 1300 | getRandomReaction | - |
| 1301 | getRandomReaction | - |
| 1318 | getRandomReaction | erroEscalada |
| 1320 | getRandomReaction | - |
| 1321 | getRandomReaction | erroSarcasmo |
| 1343 | getRandomReaction | - |
| 1346 | showToastMessage | - |

## js/07-caos/02-cerebro-adm.js (5)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 151 | getRandomReaction | - |
| 161 | getRandomReaction | - |
| 162 | getRandomReaction | - |
| 167 | getRandomReaction | intruso.travado |
| 176 | getRandomReaction | intruso.abrir |

## js/07-caos/03-memoria-e-mesa.js (70)

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
| 468 | getRandomReaction | - |
| 490 | showToastMessage | - |
| 588 | caosFalaAgendar | - |
| 589 | getRandomReaction | absurdoTresMestre |
| 621 | getRandomReaction | juizMestre.ditador |
| 624 | getRandomReaction | - |
| 625 | getRandomReaction | - |
| 626 | getRandomReaction | - |
| 627 | getRandomReaction | - |
| 631 | getRandomReaction | - |
| 634 | getRandomReaction | - |
| 658 | getRandomReaction | juizMestre.mae |
| 663 | getRandomReaction | - |
| 672 | getRandomReaction | - |
| 679 | getRandomReaction | - |
| 682 | getRandomReaction | - |
| 689 | caosFalarDepois, getRandomReaction | mesa.mimica |
| 694 | getRandomReaction | mesa.culpaMestre |
| 705 | caosFalarDepois | - |
| 710 | caosFalarDepois, getRandomReaction | mesa.rivalEspecial |
| 730 | showToastMessage, getRandomReaction | - |
| 744 | showToastMessage, getRandomReaction | - |
| 757 | getRandomReaction | mesa.apostaAcertou |
| 758 | getRandomReaction | mesa.apostaErrou |
| 760 | showToastMessage | - |
| 828 | getRandomReaction | - |
| 829 | getRandomReaction | - |
| 836 | getRandomReaction | cerebro.premonicao |
| 857 | getRandomReaction | - |
| 860 | getRandomReaction | - |
| 865 | getRandomReaction | - |
| 867 | getRandomReaction | - |
| 875 | getRandomReaction | - |
| 877 | getRandomReaction | - |
| 893 | getRandomReaction | - |
| 904 | getRandomReaction | - |
| 905 | getRandomReaction | - |
| 909 | getRandomReaction | - |
| 912 | getRandomReaction | - |
| 916 | getRandomReaction | - |
| 984 | getRandomReaction | - |
| 986 | getRandomReaction | - |
| 988 | getRandomReaction | - |
| 989 | getRandomReaction | - |
| 990 | getRandomReaction | - |

## js/07-caos/04-lexico-e-relogio.js (8)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 227 | getRandomReaction | - |
| 229 | getRandomReaction | - |
| 230 | getRandomReaction | - |
| 238 | showToastMessage, getRandomReaction | - |
| 245 | showToastMessage, getRandomReaction | - |
| 254 | getRandomReaction | - |
| 255 | getRandomReaction | - |
| 262 | getRandomReaction | cartaTema |

## js/07-caos/05-emocoes-e-rede-neural.js (1)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 761 | caosFalarDepois, getRandomReaction | duploPadrao |

## js/07-caos/06-humanizacao.js (11)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 85 | caosFalarDepois, getRandomReaction | naoCurti |
| 174 | caosFalarDepois, getRandomReaction | - |
| 204 | caosFalarDepois, getRandomReaction | implicancia.anuncio |
| 215 | caosFalarDepois, getRandomReaction | implicancia.carta |
| 223 | caosFalarDepois, getRandomReaction | implicancia.avisei |
| 231 | caosFalarDepois, getRandomReaction | implicancia.larguei |
| 252 | getRandomReaction | silencio |
| 329 | showToastMessage, getRandomReaction | - |
| 475 | caosFalarDepois, getRandomReaction | - |
| 494 | getRandomReaction | iniciante.bilheteMestre |
| 496 | getRandomReaction | iniciante.ajuda |

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
| 160 | getRandomReaction | - |
| 161 | getRandomReaction | - |
| 168 | caosGerarFala | gerador inicioModo |
| 169 | getRandomReaction | inicioModo |
| 201 | getRandomReaction | - |
| 202 | getRandomReaction | - |
| 238 | showToastMessage | - |
| 242 | showToastMessage, getRandomReaction | cartaIA |
| 253 | getRandomReaction | - |
| 255 | getRandomReaction | acido |
| 266 | getRandomReaction | acido |
| 272 | showToastMessage, getRandomReaction | apresentacaoInicial |
| 278 | showToastMessage, getRandomReaction | lembreteNome |
| 285 | showToastMessage, getRandomReaction | marco100 |
| 287 | showToastMessage, getRandomReaction | marco77 |
| 289 | showToastMessage, getRandomReaction | marco67 |
| 291 | showToastMessage, getRandomReaction | marcosExatos |
| 312 | showToastMessage, getRandomReaction | bolaCristalAnuncio |
| 334 | getRandomReaction | previsaoCartaComResposta |
| 335 | getRandomReaction | previsaoCartaSoCategoria |
| 346 | showToastMessage | - |
| 383 | caosGerarFala | gerador pensamento |
| 395 | getRandomReaction | meta |
| 396 | getRandomReaction | espontaneo |
| 422 | getRandomReaction | - |
| 424 | showToastMessage | - |
| 447 | getRandomReaction | - |
| 448 | showToastMessage | - |
| 456 | showToastMessage | - |
| 457 | getRandomReaction | oldSchool.nostalgia |
| 464 | showToastMessage | - |
| 490 | getRandomReaction | aviao |
| 520 | getRandomReaction | bolaCristalAcerto |
| 521 | getRandomReaction | bolaCristalErro |
| 528 | getRandomReaction | previsaoCartaAcertou |
| 529 | getRandomReaction | previsaoCartaPassouPerto |
| 542 | getRandomReaction | surpresaAcertoDificil |
| 565 | getRandomReaction | acertoVirada |
| 567 | getRandomReaction | acertoRecuperacao |
| 569 | getRandomReaction | acertoAposErro |
| 571 | getRandomReaction | acertoComResposta |
| 577 | getRandomReaction | acertoUmaDica |
| 583 | getRandomReaction | acertoRidiculamenteRapido |
| 588 | getRandomReaction | acertoCategoriaRapido |
| 597 | getRandomReaction | acertoRidiculamenteRapido |
| 598 | getRandomReaction | tempoPessoalRapido |
| 600 | getRandomReaction | - |
| 610 | getRandomReaction | acertoPorDicas |
| 613 | getRandomReaction | sequenciaAcertos |
| 616 | getRandomReaction | jogadorLento |
| 622 | getRandomReaction | carinho |
| 625 | getRandomReaction, caosGerarFala | jfAcerto, gerador jfAcerto |
| 635 | getRandomReaction | cantada |
| 638 | getRandomReaction | nivelZero.acerto |
| 643 | getRandomReaction | reacaoCurta |
| 661 | showToastMessage | - |
| 668 | getRandomReaction | especialEscolhaJogador |
| 670 | showToastMessage | - |
| 677 | getRandomReaction | - |
| 679 | showToastMessage | - |
| 685 | getRandomReaction | especialAvancou |
| 686 | getRandomReaction | especialVoltou |
| 687 | showToastMessage | - |
| 699 | getRandomReaction | especialPalpite |
| 700 | getRandomReaction | especialPercaVez |
| 701 | showToastMessage | - |
| 705 | getRandomReaction | especialExpressSkip |
| 706 | getRandomReaction | especialExpressReverse |
| 707 | getRandomReaction | especialExpressBlock |
| 708 | getRandomReaction | especialExpressSteal |
| 723 | showToastMessage | - |
| 764 | getRandomReaction | - |
| 765 | getRandomReaction | iniciante.fimDasDicas |
| 775 | showToastMessage | - |
| 780 | showToastMessage, getRandomReaction | iniciante.acerto |
| 810 | showToastMessage, getRandomReaction | iniciante.formatura |

## js/07-caos/08-hall-janelas-e-pausa.js (10)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 232 | showToastMessage | - |
| 621 | caosGerarFala | gerador pausaHumor |
| 622 | getRandomReaction | pausaHumor |
| 651 | caosFalaAgendar | - |
| 653 | caosGerarFala | gerador pausaVolta |
| 654 | getRandomReaction | pausaVolta |
| 678 | caosFalaAgendar | - |
| 679 | getRandomReaction | retaFinal |
| 698 | getRandomReaction | - |
| 700 | showToastMessage | - |

## js/07-caos/09-vinculos-silencio-e-balao.js (22)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 68 | caosFalaAgendar, getRandomReaction | vinculo.naoEVoce |
| 98 | caosFalaAgendar, getRandomReaction | vinculo.decepcao |
| 106 | caosFalaAgendar, getRandomReaction | vinculo.defesaFav |
| 116 | caosFalaAgendar, getRandomReaction | vinculo.elogioContrariado |
| 135 | caosFalaAgendar, getRandomReaction | vinculo.acusa |
| 141 | showToastMessage, getRandomReaction | vinculo.voltaAtras |
| 210 | caosFalarDepois | - |
| 211 | getRandomReaction | satisfacao |
| 232 | showToastMessage, getRandomReaction | pausaCalmou |
| 254 | caosFalaAgendar, getRandomReaction | marcadoRedencao |
| 287 | showToastMessage, getRandomReaction | descanso.exige |
| 325 | caosFalaAgendar, getRandomReaction | - |
| 351 | caosFalaAgendar, getRandomReaction | memoria.magoado |
| 391 | showToastMessage | - |
| 423 | caosGerarFala | gerador religado |
| 448 | caosFalaAgendar, getRandomReaction | silenciaramVoltaZero |
| 452 | caosFalaAgendar, getRandomReaction | silenciaramVoltaSuave |
| 455 | caosFalaAgendar, getRandomReaction | silenciaramVolta |
| 499 | caosFalarDepois, getRandomReaction | - |
| 534 | caosGerarFala | gerador chute |
| 608 | showToastMessage | - |
| 680 | showToastMessage | - |

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
| 56 | getRandomReaction | - |
| 73 | caosFalaAgendar | - |
| 98 | getRandomReaction | - |
| 99 | getRandomReaction | - |
| 104 | caosFalaAgendar | - |

## js/07-caos/16-guia-da-mesa.js (2)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 110 | getRandomReaction | - |
| 202 | getRandomReaction | guia |

## js/08-salvamento.js (1)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 1334 | showToastMessage | - |

## js/11-iniciar.js (6)

| Linha | Chamada | Banco ou gerador |
|---|---|---|
| 461 | showToastMessage | - |
| 463 | getRandomReaction | nickRepertorio |
| 464 | getRandomReaction | nickSugestaoAceita |
| 508 | getRandomReaction | botaoEncerrar |
| 773 | showToastMessage | - |
| 774 | getRandomReaction | inicioInvalido |
