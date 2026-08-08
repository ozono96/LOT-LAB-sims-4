/* =========================================================
   OBS INTEGRATION MODULE
   Permite enviar cualquier ventana a OBS Studio como
   Fuente de Navegador (Browser Source) o Popout standalone.
   ========================================================= */

(function () {
    // Ventanas disponibles con nombre legible y opciones de pantalla
    const VENTANAS_OBS = [
        { id: "ventanaRuletaDesastres",   nombre: "🎡 Ruleta de Desastres (Juego / Girar)", screen: "juego" },
        { id: "ventanaRuletaDesastres",   nombre: "⚙️ Ruleta de Desastres (Configuración)", screen: "config" },
        { id: "ventanaRetoResultado",     nombre: "🎯 Reto Generado" },
        { id: "ventanaRetosOpciones",     nombre: "⚙️ Opciones del Reto" },
        { id: "ventanaRuletaColor",       nombre: "🎨 Ruleta de Colores" },
        { id: "ventanaDados",             nombre: "🎲 Tirador de Dados" },
        { id: "ventanaTemporizador",      nombre: "⏱️ Temporizador de Retos" },
        { id: "ventanaHabilidadesGenerador", nombre: "🧠 Habilidades al Azar" },
        { id: "ventanaBuscador",          nombre: "🔍 Filtrador de Solares" },
        { id: "ventanaResultados",        nombre: "🏠 Resultados de Búsqueda" },
        { id: "ventanaFichaSolar",        nombre: "📋 Ficha de Solar" },
        { id: "ventanaListado",           nombre: "📦 Listado de Packs" },
        { id: "ventanaTrucos",            nombre: "🕹️ Trucos" },
        { id: "ventanaEstadisticas",      nombre: "📊 Estadísticas Sims 4" },
    ];

    // Canal BroadcastChannel + Storage fallback para comunicación en tiempo real
    const OBS_SYNC_CHANNEL = "lotlab_obs_sync_v2";
    let broadcastChannel = null;
    let syncObsWindowId = null;
    let ultimoTsAplicado = 0;

    // ─── 1. INYECTAR BOTONES OBS EN CADA cabeceraVentana ──────────────────
    function inyectarBotonesOBSEnHeaders() {
        document.querySelectorAll(".ventana").forEach(ventana => {
            const id = ventana.id;
            if (!id) return;

            const cabecera = ventana.querySelector(".cabeceraVentana");
            if (!cabecera) return;

            // Evitar duplicados
            if (cabecera.querySelector(".btnOBS")) return;

            const btnCerrar = cabecera.querySelector(".cerrar");

            const btn = document.createElement("button");
            btn.className = "btnOBS";
            btn.type = "button";
            btn.title = "Copiar enlace para OBS";
            btn.setAttribute("data-window", id);
            btn.setAttribute("data-tooltip", "📺 Pulsa para copiar el enlace de OBS de esta ventana");
            btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="currentColor"/><line x1="12" y1="3" x2="12" y2="1" stroke="currentColor" stroke-width="2"/><line x1="12" y1="23" x2="12" y2="21" stroke="currentColor" stroke-width="2"/><line x1="3" y1="12" x2="1" y2="12" stroke="currentColor" stroke-width="2"/><line x1="23" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2"/></svg>`;

            if (btnCerrar) {
                cabecera.insertBefore(btn, btnCerrar);
            } else {
                cabecera.appendChild(btn);
            }
        });
    }

    // ─── 2. ACTIVAR MODO OBS (Página limpia para browser source / popout) ──
    function activarModoOBS(windowId, screenParam) {
        syncObsWindowId = windowId;
        document.body.classList.add("modo-obs");
        document.documentElement.classList.add("modo-obs");

        forzarVisibilidadOBS();

        const prepararYMostrarVentana = () => {
            document.querySelectorAll(".ventana").forEach(v => {
                if (v.id !== windowId) v.style.display = "none";
            });

            const elVentana = document.getElementById(windowId);
            if (!elVentana) return;

            elVentana.style.display = "block";

            // Lógica de pantalla activa según tipo de ventana
            if (windowId === "ventanaRuletaDesastres") {
                const pantallaConfig = document.getElementById("pantallaConfigRuletaDesastres");
                const pantallaJuego = document.getElementById("pantallaJuegoRuletaDesastres");

                if (screenParam === "config") {
                    if (pantallaConfig) pantallaConfig.style.display = "block";
                    if (pantallaJuego) pantallaJuego.style.display = "none";
                } else {
                    if (pantallaConfig) pantallaConfig.style.display = "none";
                    if (pantallaJuego) pantallaJuego.style.display = "block";

                    if (typeof renderizarBotonesCategorias === "function") {
                        renderizarBotonesCategorias();
                    }
                }
            } else if (windowId === "ventanaHabilidadesGenerador") {
                if (typeof _habFiltrarHabilidades === "function") {
                    _habFiltrarHabilidades();
                    if (typeof _habInicializarGenerador === "function") _habInicializarGenerador();
                }
            } else if (windowId === "ventanaRetoResultado") {
                if (!window.retoActual && typeof generarReto === "function") {
                    generarReto(true);
                }
            } else if (windowId === "ventanaRuletaColor") {
                if (typeof inicializarRuletaColor === "function") {
                    inicializarRuletaColor();
                }
            } else if (windowId === "ventanaDados") {
                if (typeof inicializarDados === "function") {
                    inicializarDados();
                }
            }
        };

        prepararYMostrarVentana();
        setTimeout(prepararYMostrarVentana, 300);

        // Iniciar receptor de estado en vivo para OBS / Popouts
        iniciarReceptorEstadoEnVivo(windowId);

        // Auto-resize adaptativo si es un Popout (`window.opener`)
        if (window.opener) {
            activarAutoResizePopoutAdaptativo(windowId);
        }
    }

    // ─── 2a. AUTO-REDIMENSIONAR ADAPTATIVO EN TIEMPO REAL (POPOUT) ──────────
    // Se redimensiona dinámicamente cuando el contenido dentro de la ventana aumenta
    // o disminuye (p.ej. al cambiar entre pantallas o añadir filas al historial).
    function activarAutoResizePopoutAdaptativo(windowId) {
        if (!window.opener) return;

        const el = document.getElementById(windowId);
        if (!el) return;

        let prevAncho = 0;
        let prevAlto = 0;
        let debounceTimer = null;

        function reajustar() {
            if (el.style.display !== "block") return;

            const scrollW = el.scrollWidth || el.offsetWidth;
            const scrollH = el.scrollHeight || el.offsetHeight;
            if (scrollW < 10 || scrollH < 10) return;

            const margenW = Math.max(0, window.outerWidth - window.innerWidth);
            const margenH = Math.max(0, window.outerHeight - window.innerHeight);

            const anchoDeseado = Math.ceil(scrollW) + margenW;
            const altoDeseado  = Math.ceil(scrollH) + margenH;

            // Evitar ajustes ínfimos que puedan generar bucles
            if (Math.abs(anchoDeseado - prevAncho) < 14 && Math.abs(altoDeseado - prevAlto) < 14) {
                return;
            }

            prevAncho = anchoDeseado;
            prevAlto = altoDeseado;

            const anchoMax = window.screen ? window.screen.availWidth  : anchoDeseado;
            const altoMax  = window.screen ? window.screen.availHeight : altoDeseado;

            try {
                window.resizeTo(
                    Math.min(Math.max(anchoDeseado, 380), anchoMax),
                    Math.min(Math.max(altoDeseado,  260), altoMax)
                );
            } catch (e) {
                // Ignore security limits
            }
        }

        setTimeout(reajustar, 300);
        setTimeout(reajustar, 900);

        if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(() => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(reajustar, 120);
            });
            ro.observe(el);
        }
    }

    // ─── 2b. EVITAR QUE OBS PAUSE TEMPORIZADORES Y ANIMACIONES ─────────────
    function forzarVisibilidadOBS() {
        try {
            Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
            Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
        } catch (e) {}

        const bloquearEvento = (e) => {
            if (e && typeof e.stopImmediatePropagation === "function") {
                e.stopImmediatePropagation();
            }
        };
        document.addEventListener("visibilitychange", bloquearEvento, true);
        window.addEventListener("blur", bloquearEvento, true);
    }

    // ─── 3. EMISOR Y RECEPTOR DE ESTADO EN TIEMPO REAL ──────────────────────
    function emitirEstadoEnVivoOBS(windowId, payload) {
        if (!payload) return;
        payload.ts = Date.now();
        payload.windowId = windowId;

        // 1. BroadcastChannel (pestañas en el mismo navegador)
        try {
            if (!broadcastChannel) broadcastChannel = new BroadcastChannel(OBS_SYNC_CHANNEL_NAME);
            broadcastChannel.postMessage(payload);
        } catch (e) {}

        // 2. localStorage (dispara evento 'storage' nativo en otras ventanas/procesos del mismo dominio)
        try {
            localStorage.setItem(OBS_SYNC_KEY_PREFIX + windowId, JSON.stringify(payload));
        } catch (e) {}
    }
    window.emitirEstadoEnVivoOBS = emitirEstadoEnVivoOBS;

    function iniciarReceptorEstadoEnVivo(targetWindowId) {
        const procesarPayload = (payload) => {
            if (!payload || payload.windowId !== targetWindowId) return;
            if (payload.ts <= ultimoTsAplicado) return;
            ultimoTsAplicado = payload.ts;

            aplicarEstadoObjetivoEnDOM(targetWindowId, payload);
        };

        // 1. Escuchar mensajes BroadcastChannel
        try {
            if (!broadcastChannel) broadcastChannel = new BroadcastChannel(OBS_SYNC_CHANNEL_NAME);
            broadcastChannel.onmessage = (event) => procesarPayload(event.data);
        } catch (e) {}

        // 2. Escuchar evento native 'storage' de JS (cambios entre ventanas de navegador)
        window.addEventListener("storage", (e) => {
            if (e.key === OBS_SYNC_KEY_PREFIX + targetWindowId && e.newValue) {
                try {
                    procesarPayload(JSON.parse(e.newValue));
                } catch (err) {}
            }
        });

        // 3. Polling liviano a localStorage como respaldo (cada 500ms)
        setInterval(() => {
            try {
                const raw = localStorage.getItem(OBS_SYNC_KEY_PREFIX + targetWindowId);
                if (raw) procesarPayload(JSON.parse(raw));
            } catch (err) {}
        }, 500);
    }

    function aplicarEstadoObjetivoEnDOM(windowId, payload) {
        if (windowId === "ventanaRuletaDesastres") {
            const pantallaConfig = document.getElementById("pantallaConfigRuletaDesastres");
            const pantallaJuego = document.getElementById("pantallaJuegoRuletaDesastres");

            if (payload.pantalla === "juego") {
                if (pantallaConfig) pantallaConfig.style.display = "none";
                if (pantallaJuego) pantallaJuego.style.display = "block";
            }

            if (payload.iconoHTML !== undefined) {
                const containerIcono = document.getElementById("iconoResultadoDesastre");
                if (containerIcono) containerIcono.innerHTML = payload.iconoHTML;
            }
            if (payload.titulo !== undefined) {
                const el = document.getElementById("tituloResultadoDesastre");
                if (el) el.textContent = payload.titulo;
            }
            if (payload.descripcion !== undefined) {
                const el = document.getElementById("descResultadoDesastre");
                if (el) el.innerHTML = payload.descripcion;
            }
            if (payload.detalle !== undefined) {
                const el = document.getElementById("detalleResultadoDesastre");
                if (el) el.textContent = payload.detalle;
            }
            if (payload.historialHTML !== undefined) {
                const el = document.getElementById("listaHistorialDesastres");
                if (el) el.innerHTML = payload.historialHTML;
            }
        } else if (windowId === "ventanaRetoResultado") {
            if (payload.retoActual && typeof renderizarResultadoReto === "function") {
                window.retoActual = payload.retoActual;
                renderizarResultadoReto(payload.retoActual);
            } else if (payload.contenidoHTML) {
                const el = document.getElementById("contenidoRetoResultado");
                if (el) el.innerHTML = payload.contenidoHTML;
            }
        } else if (windowId === "ventanaDados") {
            if (payload.resultadoHTML !== undefined) {
                const el = document.getElementById("resultadoDados");
                if (el) el.innerHTML = payload.resultadoHTML;
            }
            if (payload.mensajeHTML !== undefined) {
                const el = document.getElementById("mensajeDados");
                if (el) el.innerHTML = payload.mensajeHTML;
            }
        } else if (windowId === "ventanaRuletaColor") {
            if (payload.resultadoHTML !== undefined) {
                const el = document.getElementById("resultadoRuletaColor");
                if (el) el.innerHTML = payload.resultadoHTML;
            }
            if (payload.mensajeHTML !== undefined) {
                const el = document.getElementById("mensajeRuletaColor");
                if (el) el.innerHTML = payload.mensajeHTML;
            }
        } else if (windowId === "ventanaHabilidadesGenerador") {
            if (payload.resultadoHTML !== undefined) {
                const el = document.getElementById("habListaResultados");
                if (el) el.innerHTML = payload.resultadoHTML;
            }
        }
    }

    // ─── 4. HOOKS DE EMISIÓN DESDE LA PESTAÑA PRINCIPAL ─────────────────────
    function instanciarHooksEmision() {
        // 1. Hook para Ruleta de Desastres
        const origGiro = window.ejecutarGiroDesastre;
        if (typeof origGiro === "function") {
            window.ejecutarGiroDesastre = function (...args) {
                const res = origGiro.apply(this, args);
                setTimeout(() => {
                    emitirEstadoEnVivoOBS("ventanaRuletaDesastres", {
                        pantalla: "juego",
                        iconoHTML: document.getElementById("iconoResultadoDesastre")?.innerHTML,
                        titulo: document.getElementById("tituloResultadoDesastre")?.textContent,
                        descripcion: document.getElementById("descResultadoDesastre")?.innerHTML,
                        detalle: document.getElementById("detalleResultadoDesastre")?.textContent,
                        historialHTML: document.getElementById("listaHistorialDesastres")?.innerHTML
                    });
                }, 220);
                return res;
            };
        }

        const origComenzarRuleta = window.comenzarRuletaDesastres;
        if (typeof origComenzarRuleta === "function") {
            window.comenzarRuletaDesastres = function (...args) {
                const res = origComenzarRuleta.apply(this, args);
                setTimeout(() => {
                    emitirEstadoEnVivoOBS("ventanaRuletaDesastres", {
                        pantalla: "juego",
                        iconoHTML: document.getElementById("iconoResultadoDesastre")?.innerHTML,
                        titulo: document.getElementById("tituloResultadoDesastre")?.textContent,
                        descripcion: document.getElementById("descResultadoDesastre")?.innerHTML,
                        detalle: document.getElementById("detalleResultadoDesastre")?.textContent,
                        historialHTML: document.getElementById("listaHistorialDesastres")?.innerHTML
                    });
                }, 100);
                return res;
            };
        }

        const origLimpiarHistorial = window.limpiarHistorialDesastres;
        if (typeof origLimpiarHistorial === "function") {
            window.limpiarHistorialDesastres = function (...args) {
                const res = origLimpiarHistorial.apply(this, args);
                setTimeout(() => {
                    emitirEstadoEnVivoOBS("ventanaRuletaDesastres", {
                        pantalla: "juego",
                        historialHTML: document.getElementById("listaHistorialDesastres")?.innerHTML
                    });
                }, 50);
                return res;
            };
        }

        // 2. Hook para Reto Resultado
        const origRenderizarReto = window.renderizarResultadoReto;
        if (typeof origRenderizarReto === "function") {
            window.renderizarResultadoReto = function (...args) {
                const res = origRenderizarReto.apply(this, args);
                setTimeout(() => {
                    emitirEstadoEnVivoOBS("ventanaRetoResultado", {
                        retoActual: window.retoActual,
                        contenidoHTML: document.getElementById("contenidoRetoResultado")?.innerHTML
                    });
                }, 100);
                return res;
            };
        }

        // 3. Hook para Dados
        const origTirarDados = window.tirarDados;
        if (typeof origTirarDados === "function") {
            window.tirarDados = function (...args) {
                const res = origTirarDados.apply(this, args);
                setTimeout(() => {
                    emitirEstadoEnVivoOBS("ventanaDados", {
                        resultadoHTML: document.getElementById("resultadoDados")?.innerHTML,
                        mensajeHTML: document.getElementById("mensajeDados")?.innerHTML
                    });
                }, 150);
                return res;
            };
        }

        // 4. Hook para Ruleta de Colores
        const origGirarColor = window.girarRuletaColor;
        if (typeof origGirarColor === "function") {
            window.girarRuletaColor = function (...args) {
                const res = origGirarColor.apply(this, args);
                setTimeout(() => {
                    emitirEstadoEnVivoOBS("ventanaRuletaColor", {
                        resultadoHTML: document.getElementById("resultadoRuletaColor")?.innerHTML,
                        mensajeHTML: document.getElementById("mensajeRuletaColor")?.innerHTML
                    });
                }, 200);
                return res;
            };
        }

        // 5. Hook para Habilidades
        const origHabTirar = window._habTirar;
        if (typeof origHabTirar === "function") {
            window._habTirar = function (...args) {
                const res = origHabTirar.apply(this, args);
                setTimeout(() => {
                    emitirEstadoEnVivoOBS("ventanaHabilidadesGenerador", {
                        resultadoHTML: document.getElementById("habListaResultados")?.innerHTML
                    });
                }, 300);
                return res;
            };
        }
    }

    // ─── 3. COPIAR URL PARA OBS BROWSER SOURCE ─────────────────────────────
    function construirURLOBS(windowId, screenId = null) {
        const loc = window.location;

        if (loc.protocol === "file:") {
            setTimeout(() => mostrarToastOBS("⚠️ Estás en local (file://). Para Browser Source usa la URL de GitHub Pages, o usa el Popout."), 100);
        }

        const url = new URL(loc.href.split("?")[0].split("#")[0]);
        url.searchParams.set("obs", "1");
        url.searchParams.set("window", windowId);
        if (screenId) {
            url.searchParams.set("screen", screenId);
        } else if (windowId === "ventanaRuletaDesastres") {
            url.searchParams.set("screen", "juego");
        }
        return url.href;
    }

    window.copiarURLEnlaceOBS = function (windowId, screenId = null) {
        if (!windowId) return;
        const obsURL = construirURLOBS(windowId, screenId);

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(obsURL).then(() => {
                mostrarToastOBS("🎥 URL copiada. Añádela como Fuente de Navegador en OBS Studio.");
            }).catch(() => {
                prompt("Copia este enlace para OBS Browser Source:", obsURL);
            });
        } else {
            prompt("Copia este enlace para OBS Browser Source:", obsURL);
        }
    };

    function copiarURLEnlaceOBSDirecto(windowId, event) {
        if (!windowId) return;

        // Detectar si la ventana actual de la ruleta está en juego o config
        let screenParam = null;
        if (windowId === "ventanaRuletaDesastres") {
            const juego = document.getElementById("pantallaJuegoRuletaDesastres");
            screenParam = (juego && juego.style.display !== "none") ? "juego" : "config";
        }

        const obsURL = construirURLOBS(windowId, screenParam);

        const avisarExito = () => {
            if (typeof mostrarTooltipCopiado === "function") {
                mostrarTooltipCopiado(event, "✅ Enlace de OBS copiado");
            } else {
                mostrarToastOBS("🎥 Enlace de OBS copiado.");
            }
        };

        const avisarFallo = () => {
            if (typeof mostrarTooltipCopiado === "function") {
                mostrarTooltipCopiado(event, "⚠️ No se pudo copiar");
            } else {
                prompt("Copia este enlace para OBS Browser Source:", obsURL);
            }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(obsURL).then(avisarExito).catch(() => {
                copiarURLEnlaceOBSFallback(obsURL, avisarExito, avisarFallo);
            });
        } else {
            copiarURLEnlaceOBSFallback(obsURL, avisarExito, avisarFallo);
        }
    }

    function copiarURLEnlaceOBSFallback(texto, avisarExito, avisarFallo) {
        const textarea = document.createElement("textarea");
        textarea.value = texto;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand("copy");
            avisarExito();
        } catch (error) {
            avisarFallo();
        }

        document.body.removeChild(textarea);
    }

    // ─── 4. ABRIR POPOUT STANDALONE ────────────────────────────────────────
    window.abrirPopoutOBS = function (windowId, screenId = null) {
        if (!windowId) return;

        // Detectar si la ruleta está en juego o config si no viene definido
        if (!screenId && windowId === "ventanaRuletaDesastres") {
            const juego = document.getElementById("pantallaJuegoRuletaDesastres");
            screenId = (juego && juego.style.display !== "none") ? "juego" : "config";
        }

        const url = construirURLOBS(windowId, screenId);
        window.open(url, "OBS_" + windowId, "width=920,height=720,scrollbars=yes,resizable=yes");
    };

    // ─── 5. MODAL SELECTOR DE VENTANA PARA OBS ─────────────────────────────
    function crearModalOBS() {
        if (document.getElementById("modalOBSSelector")) return;

        const modal = document.createElement("div");
        modal.id = "modalOBSSelector";
        modal.className = "modalOBSSelector";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");

        modal.innerHTML = `
            <div class="modalOBSCard">
                <div class="modalOBSHeader">
                    <span class="modalOBSTitulo">📺 Enviar a OBS Studio</span>
                    <button class="cerrar modalOBSCerrar" id="cerrarModalOBS" title="Cerrar">✕</button>
                </div>
                <p class="modalOBSDesc">Selecciona una ventana. Podrás copiar el enlace directo para <strong>OBS Browser Source</strong> o abrirla en una ventana emergente independiente.</p>
                <div class="modalOBSLista" id="listaVentanasOBS"></div>
            </div>
        `;

        document.body.appendChild(modal);

        const lista = modal.querySelector("#listaVentanasOBS");
        VENTANAS_OBS.forEach(v => {
            if (!document.getElementById(v.id)) return;

            const item = document.createElement("div");
            item.className = "modalOBSItem";
            item.innerHTML = `
                <span class="modalOBSItemNombre">${v.nombre}</span>
                <div class="modalOBSItemAcciones">
                    <button class="btnObsCopiar" data-window="${v.id}" data-screen="${v.screen || ''}" data-tooltip="Copiar URL para OBS Browser Source">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                        Copiar URL
                    </button>
                    <button class="btnObsPopout" data-window="${v.id}" data-screen="${v.screen || ''}" data-tooltip="Abrir en ventana emergente">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
                        Popout
                    </button>
                </div>
            `;
            lista.appendChild(item);
        });

        lista.addEventListener("click", (e) => {
            const btnCopiar = e.target.closest(".btnObsCopiar");
            const btnPopout = e.target.closest(".btnObsPopout");
            if (btnCopiar) window.copiarURLEnlaceOBS(btnCopiar.dataset.window, btnCopiar.dataset.screen || null);
            if (btnPopout) window.abrirPopoutOBS(btnPopout.dataset.window, btnPopout.dataset.screen || null);
        });

        document.getElementById("cerrarModalOBS").addEventListener("click", () => {
            modal.classList.remove("visible");
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.classList.remove("visible");
        });
    }

    window.abrirSelectorOBS = function () {
        crearModalOBS();
        const modal = document.getElementById("modalOBSSelector");
        if (modal) modal.classList.add("visible");
    };

    // ─── 6. TOAST NOTIFICACIÓN ─────────────────────────────────────────────
    function mostrarToastOBS(mensaje) {
        let toast = document.getElementById("toastOBS");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toastOBS";
            toast.className = "toastOBS";
            document.body.appendChild(toast);
        }
        toast.textContent = mensaje;
        toast.classList.add("visible");
        setTimeout(() => toast.classList.remove("visible"), 4500);
    }

    // ─── 7. CLICK EN BOTONES OBS PEQUEÑOS DE CADA CABECERA ─────────────────
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".btnOBS");
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            const windowId = btn.dataset.window;
            if (windowId) {
                copiarURLEnlaceOBSDirecto(windowId, e);
            }
        }
    });

    // ─── 8. INIT ───────────────────────────────────────────────────────────
    document.addEventListener("DOMContentLoaded", () => {
        const urlParams = new URLSearchParams(window.location.search);
        const targetWindowId = urlParams.get("window");
        const screenParam = urlParams.get("screen");
        const esOBS = urlParams.has("obs") && targetWindowId;

        if (esOBS) {
            activarModoOBS(targetWindowId, screenParam);
        }

        setTimeout(inyectarBotonesOBSEnHeaders, 600);
    });

    window.addEventListener("load", () => {
        setTimeout(inyectarBotonesOBSEnHeaders, 1000);
        setTimeout(instanciarHooksEmision, 600);
    });
})();