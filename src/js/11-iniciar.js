/* ======================================================================
 * 11. INICIAR (roda por último, depois de todos os dados)
 * ====================================================================== */

function iniciar() {
  caosFalasMontar(REACTIVE_VOICE);
  // acessibilidade do aparelho (letra, contraste) antes de desenhar as telas
  try {
    acessCarregar();
    aplicarAcessibilidade();
  } catch (e) {}
  // espinha do C.A.O.S.: as 3 leis e o canal de falas (js/07c)
  try {
    caosEspinhaInstalar();
  } catch (e) {}
  registrarOffline();
  // Lista plana de rostos de cada emoção (derivada de niv).
  Object.values(CAOS_EMOS).forEach((E) => {
    E.faces = E.niv.flat(2);
  });

  selectedAvatar = AVATARS[0];
  allCards = baralhoClassico();
  cardsByAnswer = new Map(allCards.map((card) => [card.answer, card]));
  checkCardIntegrity(ADULT_CARDS);
  validarFalas();
  palpiteStock = PALPITE_STOCK;
  caosEasterEggsUsed = new Set();
  caosTemper = CAOS_TEMPERAMENTOS.normal;
  splashH0 = Math.random() * 360;
  try {
    soundOn = JFStore.getItem("perfil200_som") !== "0";
  } catch (e) {}
  try {
    caosVoiceOn = JFStore.getItem("perfil200_voz") !== "0";
  } catch (e) {}
  if (!CAOS_VOICE_OK) caosVoiceOn = false;
  try {
    const v = parseFloat(JFStore.getItem("perfil200_voz_vel"));
    if (v >= 1 && v <= 2) caosVoiceSpeed = Math.round(v * 20) / 20;
  } catch (e) {}
  try {
    const v = parseFloat(JFStore.getItem("perfil200_voz_tom"));
    if (v >= 0.6 && v <= 1.4) caosVoicePitch = Math.round(v * 20) / 20;
  } catch (e) {}
  try {
    caosVoiceName = JFStore.getItem("perfil200_voz_nome") || "";
  } catch (e) {}
  CAOS_EMOJI_CHANCE = typeof window !== "undefined" && window.__CAOS_SEM_EMOJI ? 0 : 0.03;
  try {
    caosInspectorDestravado = sessionStorage.getItem("perfil5_caos_auth") === "1";
  } catch (e) {}
  caosMemPartidaInicio = Date.now();

  caosConsoleReset();
  caosUltEventoAt = Date.now();

  (function () {
    const el = document.getElementById("splashCaos");
    if (!el) return;
    caosSplashMostrar(el, 0);
    el.addEventListener("click", () => {
      caosSplashAt = 0;
      caosSplashMostrar(el, ++caosSplashIdx);
    });
  })();
  (function caosPulinho() {
    const ALVO = "button, .chip, .splash-caos";
    const pular = (ev) => {
      if (document.body.classList.contains("batata-mode")) return;
      const el = ev.target && ev.target.closest && ev.target.closest(ALVO);
      if (!el || el.disabled || el.closest("#jfToast") || el._pulando) return;
      el._pulando = true;
      try {
        caosAnimar(el, "tapPulo", () => {
          el._pulando = false;
        });
      } catch (e) {
        el._pulando = false;
      }
    };
    document.addEventListener("pointerover", (ev) => {
      if (ev.pointerType === "mouse") pular(ev);
    });
    document.addEventListener("pointerdown", pular);
  })();
  (function caosDicaDeToque() {
    let ref = null,
      alvo = null,
      mostrou = false,
      bolha = null,
      x0 = 0,
      y0 = 0;
    const tirar = () => {
      if (bolha) bolha.remove();
      bolha = null;
    };
    document.addEventListener(
      "pointerdown",
      (ev) => {
        if (ev.pointerType === "mouse") return;
        const el = ev.target && ev.target.closest && ev.target.closest("[title]");
        if (!el || el.closest("#jfToast")) return;
        const txt = el.getAttribute("title");
        if (!txt) return;
        alvo = el;
        mostrou = false;
        x0 = ev.clientX;
        y0 = ev.clientY;
        clearTimeout(ref);
        ref = setTimeout(() => {
          mostrou = true;
          tirar();
          bolha = document.createElement("div");
          bolha.className = "dica-toque";
          bolha.textContent = txt;
          document.body.appendChild(bolha);
          const r = el.getBoundingClientRect(),
            w = bolha.offsetWidth;
          bolha.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + "px";
          bolha.style.top = Math.max(8, r.top - bolha.offsetHeight - 8) + "px";
          setTimeout(tirar, 2800);
        }, 520);
      },
      true,
    );
    document.addEventListener(
      "pointermove",
      (ev) => {
        if (ref && (Math.abs(ev.clientX - x0) > 10 || Math.abs(ev.clientY - y0) > 10)) clearTimeout(ref);
      },
      true,
    );
    ["pointerup", "pointercancel"].forEach((t) => document.addEventListener(t, () => clearTimeout(ref), true));
    document.addEventListener(
      "click",
      (ev) => {
        if (mostrou && alvo && alvo.contains(ev.target)) {
          ev.stopPropagation();
          ev.preventDefault();
          mostrou = false;
        }
      },
      true,
    );
    document.addEventListener(
      "contextmenu",
      (ev) => {
        if (alvo && ev.target && alvo.contains(ev.target)) ev.preventDefault();
      },
      true,
    );
  })();
  (function caosAnimObservar() {
    const ativos = new WeakMap();
    const vencedora = (el) => {
      let v = null;
      for (const g of CAOS_ANIM_GATILHOS) {
        try {
          if (el.matches(g[0])) v = g;
        } catch (e) {}
      }
      return v;
    };
    const conferir = (el) => {
      if (!el || el.nodeType !== 1) return;
      const g = vencedora(el);
      if (!g) {
        if (ativos.has(el)) {
          ativos.delete(el);
          const r = caosAnimRodando.get(el);
          if (r && r.spec.loop) caosAnimParar(el, false);
        }
        return;
      }
      if (ativos.get(el) === g[1]) return;
      ativos.set(el, g[1]);
      caosAnimar(el, g[1], null, CAOS_ANIMS[g[1]].loop ? g[0] : null);
    };
    const TODOS = CAOS_ANIM_GATILHOS.map((g) => g[0]).join(", ");
    const mo = new MutationObserver((lista) => {
      for (const m of lista) {
        if (m.type === "attributes") conferir(m.target);
        else
          m.addedNodes.forEach((n) => {
            if (n.nodeType !== 1) return;
            conferir(n);
            if (n.firstElementChild) n.querySelectorAll(TODOS).forEach(conferir);
          });
      }
    });
    try {
      mo.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["class"],
      });
    } catch (e) {}
  })();
  (function caosMotorVisual() {
    const temRaf = !!window.requestAnimationFrame;
    let last = 0,
      L = null;
    const A = [34, 211, 238],
      B = [217, 70, 239];
    const vis = (sel) =>
      Array.prototype.filter.call(document.querySelectorAll(sel), (e) => e.getClientRects().length > 0);
    const varrer = () => {
      const bat = document.body.classList.contains("batata-mode");
      return {
        rgb: document.querySelectorAll(".rgb-name, .rgb-swatch"),
        gr: document.querySelectorAll(".grad-anim"),
        sel: document.querySelectorAll(
          ".mode-select-wrap.mode-selected, .humor-btn.on, .age-btn.on, .btn-confirm-start",
        ),
        on: document.querySelectorAll(".onyx-swatch"),
        mini: bat ? [] : vis(".mc-badge, .mc-icon, .btn-neo, .jog-emo"),
        neon: bat ? [] : vis(".resumo-neon, .pause-min, .splash-go, .pronto, .humor-btn.on, .age-btn.on"),
        grid: bat ? [] : vis(".number-grid"),
        splash: bat ? [] : vis(".splash-caos, .splash-dice"),
        ft: bat ? [] : vis("#endControls"),
        carta: bat ? [] : vis("#cardArea"),
        spot: bat ? [] : vis(".spotlight-box"),
        emo: bat ? [] : vis(".jf-toast-overlay.caos-emo.show"),
        neural: bat ? [] : vis(".ci-neural"),
      };
    };
    const temAlgo = (l) =>
      l.rgb.length ||
      l.gr.length ||
      l.sel.length ||
      l.on.length ||
      l.mini.length ||
      l.neon.length ||
      l.emo.length ||
      l.neural.length ||
      l.grid.length ||
      l.splash.length ||
      l.ft.length ||
      l.carta.length ||
      l.spot.length;
    function dormir() {
      setTimeout(() => {
        if (document.hidden) return dormir();
        L = varrer();
        if (temAlgo(L)) {
          last = 0;
          seguir();
        } else dormir();
      }, 500);
    }
    function seguir() {
      if (temRaf) window.requestAnimationFrame(tick);
      else setTimeout(() => tick(performance.now ? performance.now() : Date.now()), 33);
    }
    let varredura = 0;
    function tick(t) {
      if (document.hidden) return dormir();
      if (t - varredura > 500) {
        varredura = t;
        L = varrer();
        if (!temAlgo(L)) return dormir();
      }
      if (t - last < 33) return seguir();
      last = t;
      if (L.rgb.length) {
        const h = Math.round(((t / 3e3) * 360) % 360),
          pos = (((t / 2e3) % 1) * 200).toFixed(1) + "% 0%";
        L.rgb.forEach((el) => {
          el.style.setProperty("--rgb-cor", `hsl(${h}, 100%, 62%)`);
          el.style.setProperty("--rgb-pos", pos);
        });
      }
      if (!document.body.classList.contains("batata-mode")) {
        if (L.gr.length) {
          const pos = (((t / 4e3) % 1) * 200).toFixed(1) + "% 0%";
          L.gr.forEach((el) => el.style.setProperty("--grad-pos", pos));
        }
        if (L.sel.length) {
          const rot = (((t / 2800) * 360) % 360).toFixed(1) + "deg",
            fy = (-3 + 3 * Math.cos((t / 2600) * 2 * Math.PI)).toFixed(2) + "px",
            np = (50 - 50 * Math.cos((t / 5e3) * 2 * Math.PI)).toFixed(1) + "% 50%";
          L.sel.forEach((el) => {
            el.style.setProperty("--led-rot", rot);
            el.style.setProperty("--mc-float", fy);
            el.style.setProperty("--neon-pos", np);
          });
        }
        if (L.on.length) {
          const k = (1 - Math.cos((t / 2400) * 2 * Math.PI)) / 2,
            mix = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(",");
          const c1 = mix(A, B),
            c2 = mix(B, A);
          L.on.forEach((el) => {
            el.style.setProperty("--onyx-a", `rgb(${c1})`);
            el.style.setProperty("--onyx-b", `rgba(${c2},0.55)`);
          });
        }
        if (L.mini.length)
          L.mini.forEach((el, i) => {
            const bt = el.classList.contains("btn-neo"),
              per = bt ? 3600 : 2600;
            el.style.setProperty("--mini-rot", (((t / per) * 360 + i * 67) % 360).toFixed(1) + "deg");
            el.style.setProperty(
              "--mini-float",
              ((bt ? -2 : -1.6) * (1 - Math.cos((t / (bt ? 2800 : 1900)) * 2 * Math.PI + i * 0.9))).toFixed(2) + "px",
            );
          });
        if (L.neon.length) {
          const k = ((1 - Math.cos((t / 3e3) * 2 * Math.PI)) / 2).toFixed(3);
          L.neon.forEach((el) => el.style.setProperty("--glow-k", k));
        }
        if (L.emo.length)
          L.emo.forEach((el) => {
            const E = CAOS_EMOS[el.dataset.emo];
            if (!E) return;
            const per = E.per / (0.7 + (caosEmo.tensao || 5) / 10);
            el.style.setProperty("--emo-k", ((E.amp * (1 - Math.cos((t / per) * 2 * Math.PI))) / 2).toFixed(3));
            if (el._frames) {
              const f = el._frames[Math.floor(t / E.fr) % el._frames.length];
              if (el.getAttribute("data-face") !== f) el.setAttribute("data-face", f);
            }
            el.style.setProperty("--face-y", (-1.5 * Math.sin((t / 900) * 2 * Math.PI)).toFixed(2) + "px");
            el.style.setProperty(
              "--face-r",
              el.dataset.emo === "raiva"
                ? (2.5 * Math.sin(t / 45)).toFixed(2) + "deg"
                : el.dataset.emo === "deboche"
                  ? (4 * Math.sin(t / 700)).toFixed(2) + "deg"
                  : "0deg",
            );
          });
        if (L.neural.length) L.neural.forEach((cv) => caosNeuralDesenhar(cv, t));
        document.querySelectorAll(".board-token.pulando").forEach((el) => {
          const p = (Date.now() - (+el.dataset.t0 || 0)) / 900;
          if (p >= 1) {
            el.classList.remove("pulando");
            el.style.removeProperty("--tok-y");
          } else
            el.style.setProperty("--tok-y", (-9 * Math.abs(Math.sin(p * Math.PI * 2)) * (1 - p)).toFixed(2) + "px");
        });
        if (L.carta.length) {
          const r = (((t / 9e3) * 360) % 360).toFixed(1) + "deg";
          L.carta.forEach((el) => el.style.setProperty("--card-rot", r));
        }
        if (L.spot.length) {
          const y = (-2 * Math.sin((t / 5e3) * 2 * Math.PI)).toFixed(2) + "px",
            k = ((1 - Math.cos((t / 4200) * 2 * Math.PI)) / 2).toFixed(3);
          L.spot.forEach((el) => {
            el.style.setProperty("--spot-y", y);
            el.style.setProperty("--spot-k", k);
          });
        }
        if (L.ft.length) {
          const r = (((t / 14e3) * 360) % 360).toFixed(1) + "deg";
          L.ft.forEach((el) => el.style.setProperty("--ft-rot", r));
        }
        if (L.grid.length) {
          const r = (((t / 12e3) * 360) % 360).toFixed(1) + "deg";
          L.grid.forEach((g) => g.style.setProperty("--grid-rot", r));
        }
        if (L.splash.length)
          L.splash.forEach((el) => {
            if (el.id === "splashCaos") caosSplashTick(el, t);
            else {
              el.style.setProperty("--dice-y", (-7 * Math.sin(t / 1400)).toFixed(2) + "px");
              el.style.setProperty("--dice-r", (((t / 1e4) * 360) % 360).toFixed(1) + "deg");
              el.style.setProperty("--dice-ry", (28 * Math.sin(t / 2600)).toFixed(2) + "deg");
            }
          });
        {
          const fw = document.querySelectorAll("#floatingWordsContainer .floating-word");
          if (fw.length && fw[0].getClientRects().length)
            fw.forEach((el) => {
              const d = +el.dataset.dur || 30,
                p = ((t / 1e3 + (+el.dataset.off || 0)) / d) % 1;
              el.style.transform = `translateY(${(112 - 137 * p).toFixed(2)}vh) rotate(${(-4 + 8 * p).toFixed(2)}deg)`;
              el.style.opacity = (p < 0.08 ? (0.11 * p) / 0.08 : p > 0.92 ? (0.11 * (1 - p)) / 0.08 : 0.11).toFixed(3);
            });
        }
        {
          const tt = document.querySelector("#splashScreen .splash-title");
          if (tt && tt.getClientRects().length) {
            const h = splashHue(t).toFixed(1);
            tt.style.setProperty("--sp-h", h);
            const dd = document.querySelector("#splashScreen .splash-dice");
            if (dd) dd.style.setProperty("--sp-h", h);
          }
        }
      }
      seguir();
    }
    dormir();
  })();
  selectedColor = PLAYER_COLORS[0];
  document.getElementById("playerNameInput").addEventListener("input", caosCadastroFluxo);
  document.getElementById("playerNameInput").addEventListener("input", () => {
    try {
      renderColorPicker();
      cadPrevs();
    } catch (e) {}
  });
  document.getElementById("colorPickerRow").addEventListener("click", (ev) => {
    if (!ev.target.closest(".color-swatch") || ev.target.closest(".tomada")) return;
    setTimeout(() => {
      cadCor = true;
      renderColorPicker();
      document.getElementById("colorBox").open = false;
      if (!cadEmoji) document.getElementById("avatarBox").open = true;
      cadPrevs();
      cadAtualizarBotao();
    }, 0);
  });
  document.getElementById("avatarPickerRow").addEventListener("click", (ev) => {
    if (!ev.target.closest(".avatar-swatch") || ev.target.closest(".tomada")) return;
    setTimeout(() => {
      cadEmoji = true;
      renderAvatarPicker();
      document.getElementById("avatarBox").open = false;
      const hb = document.getElementById("humorBox");
      if (hb && !cadHumor) hb.open = true;
      cadPrevs();
      cadAtualizarBotao();
    }, 0);
  });
  setTimeout(cadPrevs, 0);
  document.getElementById("iniBtn").addEventListener("click", iniComecar);
  document.getElementById("iniProx").addEventListener("click", iniProximo);
  document.getElementById("iniVoltar").addEventListener("click", iniVoltar);
  document.getElementById("iniSair").addEventListener("click", iniSair);
  setInterval(nickWaitTick, 1e3);
  document.getElementById("nickSuggestUse").addEventListener("click", () => {
    const input = document.getElementById("playerNameInput");
    const doRep = nickSugestaoDoRepertorio,
      nk = nickSuggestCurrent;
    nickEmprestadoAtual = doRep ? nk : null;
    if (input && nickSuggestCurrent) {
      input.value = nickSuggestCurrent;
      input.focus();
    }
    hideNickSuggest();
    showToastMessage(
      doRep
        ? getRandomReaction(REACTIVE_VOICE.nickRepertorio, nk)
        : getRandomReaction(REACTIVE_VOICE.nickSugestaoAceita),
    );
  });
  document.getElementById("nickSuggestOther").addEventListener("click", () => {
    showNickSuggest();
  });
  document.getElementById("nickSuggestClose").addEventListener("click", hideNickSuggest);
  document.getElementById("nickIdeaBtn").addEventListener("click", () => {
    showNickSuggest();
  });
  selectedAgeBracket = AGE_BRACKETS[0].id;
  try {
    vibraOn = JFStore.getItem("perfil200_vibra") !== "0";
  } catch (e) {}
  window.alert = function (m) {
    caosAvisoModal(String(m == null ? "" : m));
  };
  document.getElementById("drawBtn").addEventListener("click", () => {
    usedAtLeastOnce = true;
    drawHidden();
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (starterChosen && !gameEnded) {
      caosConfirmarComVoz(
        "Reiniciar apaga a partida atual (pontos, casas e joias). Reiniciar?",
        "Reiniciar",
        "Cancelar",
        () => resetGame(),
        caosFalaBotao(
          "Reiniciar",
          "Isso apaga a partida inteira: pontos, casas e joias. Se foi sem querer, toquem em Cancelar.",
        ),
      );
      return;
    }
    resetGame();
  });
  document.getElementById("endGameBtn").addEventListener("click", () => {
    if (starterChosen && !gameEnded) {
      caosConfirmarComVoz(
        "Encerrar a partida agora? O ranking fica como está neste momento.",
        "Encerrar",
        "Continuar",
        () => endGame(),
        getRandomReaction(REACTIVE_VOICE.botaoEncerrar, caosNomeMestre()) ||
          caosFalaBotao(
            "Encerrar",
            "Vocês querem mesmo terminar a partida agora? Se foi sem querer, toquem em Continuar.",
          ),
      );
      return;
    }
    endGame();
  });
  document.getElementById("addPlayerBtn").addEventListener("click", () => {
    if (!iniFluxo && !cadPodeAdicionar()) {
      cadAtualizarBotao();
      return;
    }
    addPlayer();
  });
  document.getElementById("playerNameInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (!iniFluxo && !cadPodeAdicionar()) return;
      addPlayer();
    }
  });
  document.getElementById("startGameBtn").addEventListener("click", () => {
    unlockAudio();
    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "flex";
    syncGameplayPanels();
    saveGameState();
  });
  document.getElementById("goToRulesBtn").addEventListener("click", () => {
    unlockAudio();
    if (pausaExpirada) {
      perguntarPartidaAnterior();
      return;
    }
    if (tutMesaNova() && tutSugerir("primeira", () => document.getElementById("goToRulesBtn").click())) return;
    document.getElementById("splashScreen").style.display = "none";
    document.getElementById("formatSelectScreen").style.display = "block";
    resetFormatSelectionUI();
    renderModeCardDescs();
  });
  ["versus", "equipe"].forEach((fmt) =>
    document.getElementById(fmt === "versus" ? "btnFormatVersus" : "btnFormatEquipe").addEventListener("click", () => {
      unlockAudio();
      toqueSelecao(
        "f" + fmt,
        () => pendingFormat === fmt,
        () => selectPendingFormat(fmt),
        () => document.getElementById("fmtConfirmBtn").click(),
        () => resetFormatSelectionUI(),
      );
    }),
  );
  document.getElementById("fmtConfirmBtn").addEventListener("click", () => {
    if (!pendingFormat) return;
    unlockAudio();
    CURRENT_FORMAT = pendingFormat;
    document.getElementById("formatSelectScreen").style.display = "none";
    document.getElementById("modeSelectScreen").style.display = "block";
    resetModeSelectionUI();
    window.scrollTo(0, 0);
  });
  document
    .querySelectorAll(".expressCatChk")
    .forEach((cb) => cb.addEventListener("change", updateExpressCheckboxState));
  document.getElementById("btnTutorial").addEventListener("click", () => {
    unlockAudio();
    openTutorial("rapido");
  });
  document.getElementById("btnTutorial2").addEventListener("click", () => openTutorial("rapido"));
  document.getElementById("pauseTutBtn").addEventListener("click", () => openTutorial("rapido"));
  ["btnManual", "pauseManualBtn"].forEach((id) => {
    const b = document.getElementById(id);
    if (b) b.addEventListener("click", () => openTutorial("manual"));
  });
  [
    ["classico", "modeBtnClassico"],
    ["hardcore", "modeBtnHardcore"],
    ["junior", "modeBtnJunior"],
    ["express", "modeBtnExpress"],
    ["random", "modeBtnRandom"],
    ["oldschool", "modeBtnOldschool"],
  ].forEach(([m, id]) =>
    document.getElementById(id).addEventListener("click", () => {
      unlockAudio();
      toqueSelecao(
        "m" + m,
        () => pendingMode === m,
        () => selectPendingMode(m),
        () => {
          if (m === "express") confirmExpress("classico");
          else if (m === "oldschool") selectMode("oldschool", null, "padrao");
          else document.getElementById("modeConfirmBtn").click();
        },
        () => resetModeSelectionUI(),
      );
    }),
  );
  document
    .getElementById("confirmOldSchoolBtn")
    .addEventListener("click", () => selectMode("oldschool", null, "padrao"));
  document
    .getElementById("confirmOldSchoolAcessBtn")
    .addEventListener("click", () => selectMode("oldschool", null, "acess"));
  document.getElementById("modeConfirmBtn").addEventListener("click", () => {
    if (!pendingMode) return;
    if (pendingMode === "random") {
      const options =
        CURRENT_FORMAT === "equipe"
          ? ["classico", "hardcore", "oldschool"]
          : ["classico", "hardcore", "express", "junior", "oldschool"];
      const chosen = options[Math.floor(Math.random() * options.length)];
      if (chosen === "express") {
        const flavor = Math.random() < 0.5 ? "classico" : "hardcore";
        selectMode("express", pickRandomExpressCategories(), flavor);
      } else {
        selectMode(chosen);
      }
      return;
    }
    selectMode(pendingMode);
  });
  document.getElementById("confirmExpressClassicoBtn").addEventListener("click", () => confirmExpress("classico"));
  document.getElementById("confirmExpressHardcoreBtn").addEventListener("click", () => confirmExpress("hardcore"));
  caosVinculoReset();
  document.addEventListener("pointerdown", pausaRegistrarToque, true);
  document.addEventListener("keydown", pausaRegistrarToque, true);
  setInterval(checarPausaEsquecida, 1e4);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checarPausaEsquecida();
  });
  document.getElementById("pauseBtn").addEventListener("click", pauseGame);
  document.getElementById("boardTrack").addEventListener("click", abrirTabuleiroGrande);
  document.getElementById("trocarModoBtn").addEventListener("click", () => voltarParaSelecaoDeModo(false));
  document.getElementById("pauseTrocarModoBtn").addEventListener("click", () => {
    caosConfirmarComVoz(
      "Trocar de modo apaga a partida atual (pontos, casas e joias). Os jogadores continuam cadastrados. Trocar?",
      "Trocar",
      "Cancelar",
      () => voltarParaSelecaoDeModo(true),
      caosFalaBotao(
        "Trocar de modo",
        "Isso também apaga a partida atual. Vocês concordam? Se não, toquem em Cancelar.",
      ),
    );
  });
  document.getElementById("modeBackBtn").addEventListener("click", () => {
    resetModeSelectionUI();
    document.getElementById("modeSelectScreen").style.display = "none";
    document.getElementById("formatSelectScreen").style.display = "block";
    selectPendingFormat(CURRENT_FORMAT === "equipe" ? "equipe" : "versus");
  });
  document.getElementById("fmtBackBtn").addEventListener("click", () => {
    document.getElementById("formatSelectScreen").style.display = "none";
    document.getElementById("splashScreen").style.display = "";
  });
  document.getElementById("resumeGameBtn").addEventListener("click", resumeGame);
  document.getElementById("pauseResumeBtn").addEventListener("click", resumeGame);
  document.getElementById("pauseExportBtn").addEventListener("click", () => exportSave());
  document.getElementById("pauseTemaBtn").addEventListener("click", toggleNoturno);
  document.getElementById("pauseVozBtn").addEventListener("click", pausaVozTrocar);
  document.getElementById("pauseReligarBtn").addEventListener("click", caosReligarCarta);
  pausaAjustesAtualizar();
  document.getElementById("pauseAdmBtn").addEventListener("click", openAdmPanel);
  document.getElementById("pauseTipNextBtn").addEventListener("click", () => {
    startPauseTipsTimerOnly();
    showPauseTip(true);
  });
  (function setupFloatingWords() {
    const container = document.getElementById("floatingWordsContainer");
    if (!container) return;
    requestAnimationFrame(() => {
      setTimeout(buildFloatingWords, 30);
    });
    function buildFloatingWords() {
      let answerSample = [];
      let clueSample = [];
      if (allCards && allCards.length > 0) {
        const usedIdx = new Set();
        while (answerSample.length < 10 && usedIdx.size < allCards.length) {
          const idx = Math.floor(Math.random() * allCards.length);
          if (!usedIdx.has(idx)) {
            usedIdx.add(idx);
            answerSample.push(allCards[idx].answer);
          }
        }
        let attempts = 0;
        while (clueSample.length < 8 && attempts < 200) {
          attempts++;
          const card = allCards[Math.floor(Math.random() * allCards.length)];
          const clueItems = card.clues.filter((c) => c.type === "clue" && c.text.length <= 55);
          if (clueItems.length === 0) continue;
          const pick = clueItems[Math.floor(Math.random() * clueItems.length)];
          clueSample.push(pick.text);
        }
      } else {
        answerSample = [
          "2001",
          "Santos Dumont",
          "Torre Eiffel",
          "Computador",
          "Harry Potter",
          "Buraco Negro",
          "Cleópatra",
          "Internet",
          "Tiranossauro Rex",
          "Guerra Fria",
        ];
        clueSample = ["Leonardo da Vinci", "Muralha da China", "Cachorro-quente", "Gravidade", "Júlio César"];
      }
      const EMOJIS = ["🎲", "🏆", "⭐", "🎉", "🧠", "🎯", "🥳", "🌍"];
      const floaters = shuffle([...answerSample, ...clueSample, ...EMOJIS]);
      const LANES = 4;
      floaters.forEach((word, i) => {
        const el = document.createElement("div");
        el.className = "floating-word";
        el.textContent = word;
        const lane = i % LANES;
        const laneWidth = 100 / LANES;
        const jitter = (Math.random() - 0.5) * laneWidth * 0.6;
        el.style.left = Math.max(2, Math.min(90, lane * laneWidth + jitter)) + "%";
        el.style.fontSize = 0.85 + Math.random() * 1.5 + "rem";
        el.dataset.dur = (26 + Math.random() * 22).toFixed(1);
        el.dataset.off = (Math.random() * 46).toFixed(1);
        container.appendChild(el);
      });
      document.getElementById("splashSubtitle").textContent = `${ADULT_CARDS.length} cartas`;
    }
  })();
  document.getElementById("redrawMestreBtn").addEventListener("click", redrawMestre);
  document.getElementById("drawStarterBtn").addEventListener("click", () => {
    unlockAudio();
    if (players.length < MIN_PLAYERS) {
      caosAvisoModal(`Adicione pelo menos ${MIN_PLAYERS} jogadores antes de sortear quem começa.`);
      return;
    }
    if (CURRENT_FORMAT === "equipe") {
      showToastMessage(
        getRandomReaction(REACTIVE_VOICE.inicioInvalido, "no Modo Equipe quem sorteia é o botão das equipes"),
        null,
        true,
      );
      return;
    }
    starterDrawCount = 1;
    mestreIndex = pickStarterMestreVersus();
    responderIndex = nextResponder(mestreIndex, mestreIndex);
    document.getElementById("playerPanel").style.display = "none";
    document.getElementById("orderRevealSection").style.display = "block";
    renderOrderList();
    startOrderCountdown();
    saveGameState();
  });
  document.getElementById("teamCount2Btn").addEventListener("click", () => runTeamFormation(2));
  document.getElementById("teamCount3Btn").addEventListener("click", () => runTeamFormation(3));
  document.getElementById("subModeDueloBtn").addEventListener("click", () => {
    equipeSubMode = "duelo";
    paintSubModeChoice("duelo");
    saveGameState();
  });
  document.getElementById("subModeFfaBtn").addEventListener("click", () => {
    equipeSubMode = "ffa";
    paintSubModeChoice("ffa");
    saveGameState();
  });
  document.getElementById("subModeRandomBtn").addEventListener("click", () => {
    equipeSubMode = Math.random() < 0.5 ? "duelo" : "ffa";
    paintSubModeChoice("random");
    saveGameState();
  });
  document.getElementById("startTeamsBtn").addEventListener("click", () => {
    unlockAudio();
    const ids = Object.keys(teams);
    if (ids.length === 0) {
      caosAvisoModal("Forme as equipes primeiro.");
      return;
    }
    if (!isValidEquipeCount(players.length) || !players.every((p) => p.team && teams[p.team])) {
      caosAvisoModal(
        "O Modo Equipe precisa de EXATAMENTE 4 ou 6 jogadores, todos com equipe. Sorteie as equipes de novo.",
      );
      return;
    }
    starterDrawCount = 1;
    drawEquipeOrder();
    document.getElementById("playerPanel").style.display = "none";
    document.getElementById("orderRevealSection").style.display = "block";
    startOrderCountdown();
    saveGameState();
  });
  document.getElementById("confirmStartBtn").addEventListener("click", beginGameplay);
  // Som no iPhone: o primeiro toque religa o áudio que o Safari tiver suspendido.
  ["touchend", "pointerdown", "keydown"].forEach((ev) =>
    document.addEventListener(ev, audioDestravarNoToque, { capture: true, passive: true }),
  );
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      caosVoiceCancel();
      autoPauseGame();
      return;
    }
    if (document.visibilityState === "visible" && starterChosen && !gameEnded) {
      requestWakeLock();
      recoverFromMissedPause();
    }
  });
  window.addEventListener("pagehide", autoPauseGame);
  window.addEventListener("blur", () => {
    clearTimeout(autoPauseBlurRef);
    autoPauseBlurRef = setTimeout(() => {
      if (!document.hasFocus()) autoPauseGame();
    }, 300);
  });
  window.addEventListener("focus", () => {
    clearTimeout(autoPauseBlurRef);
  });
  renderColorPicker();
  renderAvatarPicker();
  renderAgeBracketPicker();
  renderHumorPicker();
  document.getElementById("btnBatata").addEventListener("click", toggleBatataMode);
  document.getElementById("btnNoturno").addEventListener("click", toggleNoturno);
  document.getElementById("btnMemExportar").addEventListener("click", caosMemoriaExportar);
  document.getElementById("btnAcessibilidade").addEventListener("click", acessPainelAbrir);
  document.getElementById("pauseAcessBtn").addEventListener("click", acessPainelAbrir);
  document.getElementById("btnMemImportar").addEventListener("click", caosMemoriaImportar);
  temaAplicar();
  document.getElementById("btnNovidades").addEventListener("click", abrirNovidades);
  document.getElementById("btnInstalar").addEventListener("click", instalarApp);
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    instalarPrompt = e;
    instalarAtualizarBotao();
  });
  window.addEventListener("appinstalled", () => {
    instalarPrompt = null;
    instalarAtualizarBotao();
  });
  instalarAtualizarBotao();
  window.addEventListener("popstate", voltarApertado);
  // depois de reabrir no meio da partida, o 1º toque já protege o "voltar"
  document.addEventListener(
    "click",
    () => {
      if (starterChosen && !gameEnded) voltarGuardar();
    },
    { capture: true, passive: true },
  );
  // Menu ⋮ da tela inicial: abre/fecha no botão; fecha ao tocar fora dele.
  (function () {
    const bt = document.getElementById("btnMenuSplash"),
      menu = document.getElementById("splashMenu");
    if (!bt || !menu) return;
    let engolir = 0;
    const abrir = (sim) => {
      menu.hidden = !sim;
      bt.setAttribute("aria-expanded", sim ? "true" : "false");
    };
    bt.addEventListener("click", () => abrir(menu.hidden));
    // botões que abrem janela (acessibilidade, memória) fecham o menu antes, pro 1º toque na janela valer
    menu.addEventListener("click", (e) => {
      if (e.target.closest && e.target.closest("[data-fecha-menu]")) abrir(false);
    });
    document.addEventListener(
      "pointerdown",
      (e) => {
        if (!menu.hidden && !menu.contains(e.target) && !bt.contains(e.target)) {
          abrir(false);
          engolir = Date.now();
        }
      },
      { capture: true, passive: true },
    );
    // o toque que fechou o menu não aciona o botão que estava embaixo
    document.addEventListener(
      "click",
      (e) => {
        if (Date.now() - engolir < 700) {
          engolir = 0;
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );
  })();
  novidadesMarcarChip();
  document.getElementById("btnSom").addEventListener("click", toggleSound);
  document.getElementById("btnVibra").addEventListener("click", toggleVibra);
  updateVibraBtn();
  document.getElementById("btnVoz").addEventListener("click", toggleVoice);
  document.getElementById("btnVozAjustar").addEventListener("click", () => {
    vozPainelAberto = !vozPainelAberto;
    updateVoiceBtn();
  });
  document
    .querySelectorAll(".voz-step")
    .forEach((b) => b.addEventListener("click", () => stepVoice(b.dataset.kind, parseInt(b.dataset.dir, 10))));
  document.getElementById("btnVozNome").addEventListener("click", cycleVoiceName);
  try {
    if (CAOS_VOICE_OK && window.speechSynthesis.addEventListener)
      window.speechSynthesis.addEventListener("voiceschanged", updateVoiceBtn);
  } catch (e) {}
  try {
    if (CAOS_VOICE_OK) {
      if (!window.speechSynthesis.addEventListener) window.speechSynthesis.onvoiceschanged = updateVoiceBtn;
      [600, 1500, 3e3, 6e3].forEach((ms) => setTimeout(updateVoiceBtn, ms));
    }
  } catch (e) {}
  document.addEventListener(
    "pointerdown",
    () => {
      try {
        if (CAOS_VOICE_OK && caosVoiceOn) {
          const u = new SpeechSynthesisUtterance(" ");
          u.volume = 0;
          window.speechSynthesis.speak(u);
        }
      } catch (e) {}
    },
    { once: true, passive: true },
  );
  updateVoiceBtn();
  (function () {
    const bl = document.getElementById("splashBuildLog");
    if (!bl) return;
    let taps = 0,
      t0 = 0;
    bl.addEventListener("click", () => {
      const now = Date.now();
      if (now - t0 > 4e3) taps = 0;
      if (taps === 0) t0 = now;
      taps++;
      if (taps >= 5) {
        taps = 0;
        caosDiagShow();
      }
    });
  })();
  updateSoundBtn();
  try {
    if (JFStore.getItem("perfil200_batata") === "1") {
      document.body.classList.add("batata-mode");
      renderColorPicker();
    }
  } catch (e) {}
  updateBatataBtn();
  document.getElementById("exportSaveBtn").addEventListener("click", exportSave);
  document.getElementById("importSaveBtn").addEventListener("click", importSave);

  setTimeout(cadAtualizarBotao, 0);

  (function startApp() {
    const playBtn = document.getElementById("goToRulesBtn");
    if (playBtn) playBtn.disabled = true;
    aplicarCorRngSplash();
    JFStore.boot().then(() => {
      applyStoredPrefs();
      loadGameState();
      updateModeNotice();
      renderStorageStatus();
      if (playBtn) playBtn.disabled = false;
    });
  })();
}
iniciar();
